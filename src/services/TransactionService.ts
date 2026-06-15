import { db, collection, addDoc, serverTimestamp, doc, updateDoc, increment } from '../firebase';
import { Transaction } from '../types';

export const TransactionService = {
  /**
   * Records a new transaction in the EFADO ecosystem.
   * This is the master ledger for all value movements.
   */
  async recordTransaction(data: Omit<Transaction, 'timestamp' | 'id'> & { skipWalletUpdate?: boolean }): Promise<string> {
    try {
      // Generate a unique reference if not provided
      const reference = data.reference || `EFD-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      
      // Separate out skipWalletUpdate before writing to Firestore if needed
      const { skipWalletUpdate, ...cleanedData } = data;
      
      const txData = {
        ...cleanedData,
        reference,
        timestamp: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'transactions'), txData);
      
      // Skip updates if requested
      if (skipWalletUpdate || data.metadata?.skipWalletUpdate) {
        return docRef.id;
      }
      
      // Update user wallet balances based on transaction type
      const userRef = doc(db, 'users', data.userId);
      
      if (data.type === 'deposit') {
        const updateFields: any = {
          depositWallet: increment(data.amount)
        };
        // If the deposit is automated (comes in pre-completed status), credit play wallet instantly
        if (data.status === 'completed') {
          updateFields.playerWallet = increment(data.amount);
        }
        await updateDoc(userRef, updateFields);
      } else if (data.type === 'withdrawal') {
        const walletField = data.metadata?.sourceWallet || data.metadata?.walletField || data.metadata?.walletSource || 'cashOutWallet';
        await updateDoc(userRef, {
          [walletField]: increment(-data.amount)
        });
      } else if (data.type === 'game_win') {
        await updateDoc(userRef, {
          playerWallet: increment(data.amount)
        });
      } else if (data.type === 'game_bet' || data.type === 'payment') {
        // Logic depends on which wallet is used
        const walletField = data.metadata?.walletField || 'playerWallet';
        await updateDoc(userRef, {
          [walletField]: increment(-data.amount)
        });
      }

      return docRef.id;
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
