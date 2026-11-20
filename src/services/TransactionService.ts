import { db, collection, doc, serverTimestamp, runTransaction, increment } from '../firebase';
import { Transaction } from '../types';
import { isDisabledFutureCurrency, normalizeCurrencyCode } from '../constants/walletCurrencies';

export const TransactionService = {
  /**
   * Records a transaction in the EFADO master ledger.
   * For balance-mutating deposits/withdrawals, atomically updates BOTH the canonical
   * wallet pocket (`wallets/{uid}/{currency}/depositWallet` or user win/cashout wallet)
   * AND the transaction document in a single Firestore transaction so history and balance
   * never fall out of sync.
   */
  async recordTransaction(
    data: Omit<Transaction, 'timestamp' | 'id'> & { ledgerOnly?: boolean }
  ): Promise<string> {
    try {
      const currency = normalizeCurrencyCode(data.currency || 'NGN');
      if (isDisabledFutureCurrency(currency)) {
        throw new Error(`${currency} is Coming Soon and not yet in circulation.`);
      }

      const reference =
        data.reference ||
        `EFD-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString().slice(-4)}`;

      const { ledgerOnly, ...cleanedData } = data;
      const txRef = data.reference
        ? doc(db, 'transactions', reference)
        : doc(collection(db, 'transactions'));

      await runTransaction(db, async (tx) => {
        const userRef = doc(db, 'users', data.userId);
        const walletPocketRef = doc(db, 'wallets', data.userId, currency, 'depositWallet');

        if (!ledgerOnly) {
          if (data.type === 'deposit' && data.status === 'completed') {
            const pocketSnap = await tx.get(walletPocketRef);
            const oldBal = pocketSnap.exists()
              ? Number(pocketSnap.data()?.balance ?? pocketSnap.data()?.depositWallet ?? 0) || 0
              : 0;
            const nextBal = oldBal + Number(data.amount || 0);

            tx.set(
              walletPocketRef,
              {
                balance: nextBal,
                depositWallet: nextBal,
                currency,
                userId: data.userId,
                lastFundedRef: reference,
                updatedAt: serverTimestamp()
              },
              { merge: true }
            );
          } else if (data.type === 'withdrawal') {
            const sourceWallet =
              data.metadata?.sourceWallet ||
              data.metadata?.walletField ||
              data.metadata?.walletSource ||
              'depositWallet';

            if (sourceWallet === 'depositWallet') {
              const pocketSnap = await tx.get(walletPocketRef);
              const oldBal = pocketSnap.exists()
                ? Number(pocketSnap.data()?.balance ?? pocketSnap.data()?.depositWallet ?? 0) || 0
                : 0;
              if (oldBal < Number(data.amount || 0)) {
                throw new Error(`INSUFFICIENT FUNDS in ${currency} Pocket`);
              }
              const nextBal = oldBal - Number(data.amount || 0);
              tx.set(
                walletPocketRef,
                {
                  balance: nextBal,
                  depositWallet: nextBal,
                  currency,
                  userId: data.userId,
                  updatedAt: serverTimestamp()
                },
                { merge: true }
              );
            } else {
              tx.update(userRef, {
                [sourceWallet]: increment(-Number(data.amount || 0))
              });
            }
          } else if (data.type === 'game_win') {
            tx.update(userRef, {
              playerWallet: increment(Number(data.amount || 0))
            });
          } else if (data.type === 'game_bet' || data.type === 'payment') {
            const walletField = data.metadata?.walletField || 'depositWallet';
            if (walletField === 'depositWallet') {
              const pocketSnap = await tx.get(walletPocketRef);
              const oldBal = pocketSnap.exists()
                ? Number(pocketSnap.data()?.balance ?? pocketSnap.data()?.depositWallet ?? 0) || 0
                : 0;
              if (oldBal < Number(data.amount || 0)) {
                throw new Error(`INSUFFICIENT FUNDS in ${currency} Pocket`);
              }
              const nextBal = oldBal - Number(data.amount || 0);
              tx.set(
                walletPocketRef,
                {
                  balance: nextBal,
                  depositWallet: nextBal,
                  currency,
                  userId: data.userId,
                  updatedAt: serverTimestamp()
                },
                { merge: true }
              );
            } else {
              tx.update(userRef, {
                [walletField]: increment(-Number(data.amount || 0))
              });
            }
          }
        }

        tx.set(
          txRef,
          {
            ...cleanedData,
            currency,
            reference,
            credited: data.type === 'deposit' && data.status === 'completed' ? true : undefined,
            creditedPocket:
              data.type === 'deposit' && data.status === 'completed'
                ? `wallets/${data.userId}/${currency}/depositWallet`
                : undefined,
            timestamp: serverTimestamp()
          },
          { merge: true }
        );
      });

      return txRef.id;
    } catch (error) {
      console.error('Error recording EFADO transaction:', error);
      throw error;
    }
  },

  /**
   * Formats a transaction into a printable receipt format.
   */
  generateReceiptData(tx: Transaction) {
    return {
      ...tx,
      issuer: 'EFADO Hubs Connect',
      verified: true,
      integritySignature: btoa(JSON.stringify(tx)).slice(0, 32)
    };
  }
};
