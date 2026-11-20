import { getPaystackBalance, resolveAccountNumber, createTransferRecipient, initiateTransfer } from '../../../../lib/paystack.js';
import { getServerDb, getServerTimestamp, auth } from '../../../../lib/server-firestore.js';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1]?.trim() : null;
    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = await auth().verifyIdToken(token);
    } catch {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = decoded.uid;
    const body = await req.json().catch(() => ({}));
    const { amount, account_number, bank_code, account_name, source_wallet, currency: rawCurrency } = body || {};
    const wdCurrency = String(rawCurrency || 'NGN').trim().toUpperCase();
    if (wdCurrency === 'SIRA') {
      return Response.json({ success: false, error: 'SIRA currency is Coming Soon and disabled for withdrawals.' }, { status: 400 });
    }

    const targetWalletField =
      source_wallet === 'playerWallet'
        ? 'playerWallet'
        : source_wallet === 'cashOutWallet'
          ? 'cashOutWallet'
          : 'depositWallet';

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 100 || numAmount > 10000000) {
      return Response.json({ success: false, error: `Invalid amount: Must be between 100 and 10,000,000 ${wdCurrency}` }, { status: 400 });
    }

    const cleanAccount = String(account_number || '').trim().replace(/\D/g, '');
    const cleanBank = String(bank_code || '').trim();
    const providedName = String(account_name || '').trim();

    if (!cleanAccount || cleanAccount.length !== 10 || !cleanBank || !providedName) {
      return Response.json({ success: false, error: 'Please verify destination bank account first (10-digit account number & bank).' }, { status: 400 });
    }

    const db = getServerDb();
    if (!db) {
      return Response.json({ success: false, error: 'Server Firestore not configured' }, { status: 500 });
    }

    const walletRef = db.doc(`wallets/${userId}/${wdCurrency}/depositWallet`);
    const userRef = db.doc(`users/${userId}`);
    const [walletSnap, userSnap] = await Promise.all([walletRef.get(), userRef.get()]);
    const pocketBalance = walletSnap.exists ? Number(walletSnap.data()?.balance ?? walletSnap.data()?.depositWallet ?? 0) : 0;
    const userFieldBalance = userSnap.exists ? Number(userSnap.data()?.[targetWalletField] || 0) : 0;
    const currentBalance =
      targetWalletField === 'depositWallet' ? pocketBalance : userFieldBalance;

    if (numAmount > currentBalance) {
      return Response.json({
        success: false,
        error: `INSUFFICIENT FUNDS in ${targetWalletField === 'depositWallet' ? `${wdCurrency} Deposit Pocket` : targetWalletField} (Available: ${wdCurrency} ${currentBalance.toLocaleString()})`
      }, { status: 400 });
    }

    try {
      const balanceRes = await getPaystackBalance();
      const balances = balanceRes?.data || [];
      const curBalanceObj = balances.find((b: any) => b.currency === wdCurrency) || balances[0];
      const paystackBalanceKobo = Number(curBalanceObj?.balance || 0);

      if (paystackBalanceKobo < numAmount * 100) {
        return Response.json({ success: false, error: 'Gateway payout liquidity temporarily unavailable, try later or use Flutterwave.' }, { status: 400 });
      }
    } catch (e) {
      console.warn('[Next.js Balance Check Warning]:', e);
    }

    try {
      const resolveRes = await resolveAccountNumber(cleanAccount, cleanBank);
      if (!resolveRes?.data?.account_name) {
        return Response.json({ success: false, error: 'Invalid account number: Destination bank account could not be resolved.' }, { status: 400 });
      }
    } catch (resErr: any) {
      const isTimeout = resErr?.status === 504;
      return Response.json({
        success: false,
        error: isTimeout ? 'Bank not responding. Please try again.' : (resErr?.message || 'Could not verify account with bank. Check details.')
      }, { status: isTimeout ? 504 : 400 });
    }

    let recipientCode = '';
    const recipientKey = `${cleanBank}_${cleanAccount}_${wdCurrency}`;
    const userRecipientDoc = db.doc(`users/${userId}/recipients/${recipientKey}`);
    const recipientSnap = await userRecipientDoc.get();

    if (recipientSnap.exists && recipientSnap.data()?.recipient_code) {
      recipientCode = recipientSnap.data().recipient_code;
    } else {
      const recipientRes = await createTransferRecipient(providedName, cleanAccount, cleanBank, wdCurrency);
      recipientCode = recipientRes?.data?.recipient_code;

      if (!recipientCode) {
        return Response.json({ success: false, error: 'Failed to register withdrawal bank beneficiary' }, { status: 500 });
      }

      await userRecipientDoc.set({
        recipient_code: recipientCode,
        account_name: providedName,
        account_number: cleanAccount,
        bank_code: cleanBank,
        currency: wdCurrency,
        createdAt: getServerTimestamp()
      }, { merge: true });
    }

    const reference = `EFADO-WD-${userId.substring(0, 8)}-${Date.now()}`;
    const serverTime = getServerTimestamp();
    const txDoc = db.doc(`transactions/${reference}`);
    const userTxDoc = db.doc(`wallets/${userId}/transactions/${reference}`);

    let debitedBalance = 0;

    try {
      await db.runTransaction(async (transaction: any) => {
        if (targetWalletField === 'depositWallet') {
          const freshWalletSnap = await transaction.get(walletRef);
          const balance = freshWalletSnap.exists
            ? Number(freshWalletSnap.data()?.balance ?? freshWalletSnap.data()?.depositWallet ?? 0)
            : 0;
          if (numAmount > balance) {
            throw new Error(`INSUFFICIENT FUNDS (Available: ${wdCurrency} ${balance.toLocaleString()})`);
          }
          debitedBalance = balance - numAmount;
          transaction.set(walletRef, {
            balance: debitedBalance,
            depositWallet: debitedBalance,
            currency: wdCurrency,
            updatedAt: serverTime
          }, { merge: true });
        } else {
          const freshUserSnap = await transaction.get(userRef);
          const balance = freshUserSnap.exists ? Number(freshUserSnap.data()?.[targetWalletField] || 0) : 0;
          if (numAmount > balance) {
            throw new Error(`INSUFFICIENT FUNDS (Available: ${wdCurrency} ${balance.toLocaleString()})`);
          }
          debitedBalance = balance - numAmount;
          transaction.set(userRef, {
            [targetWalletField]: debitedBalance,
            updatedAt: serverTime
          }, { merge: true });
        }

        const withdrawRecord = {
          type: 'withdrawal',
          status: 'pending',
          amount: numAmount,
          currency: wdCurrency,
          sourceWallet: targetWalletField,
          account_number: cleanAccount,
          bank_code: cleanBank,
          account_name: providedName,
          reference,
          userId,
          gateway: 'paystack',
          method: 'Paystack Bank Transfer',
          purpose: 'Cash Out Request',
          description: `Paystack Withdrawal to ${providedName} (${cleanAccount})`,
          timestamp: serverTime,
          createdAt: serverTime,
          updatedAt: serverTime
        };

        transaction.set(txDoc, withdrawRecord, { merge: true });
        transaction.set(userTxDoc, withdrawRecord, { merge: true });
      });
    } catch (txErr: any) {
      if (String(txErr?.message || '').includes('INSUFFICIENT FUNDS')) {
        return Response.json({ success: false, error: txErr.message }, { status: 400 });
      }
      throw txErr;
    }

    try {
      const transferRes = await initiateTransfer(
        numAmount,
        recipientCode,
        reference,
        'EFADO Wallet Withdrawal'
      );

      const transferData = transferRes?.data;
      if (!transferRes?.status || !transferData?.transfer_code) {
        throw new Error(transferRes?.message || 'Transfer initiation failed on payment gateway');
      }

      const transferCode = transferData.transfer_code;

      await Promise.all([
        txDoc.set({ transfer_code: transferCode, transfer_status: transferData.status, updatedAt: getServerTimestamp() }, { merge: true }),
        userTxDoc.set({ transfer_code: transferCode, transfer_status: transferData.status, updatedAt: getServerTimestamp() }, { merge: true })
      ]);

      return Response.json({
        success: true,
        debitedOnServer: true,
        message: 'Withdrawal processing, you will receive in bank shortly',
        reference,
        transfer_code: transferCode,
        amount: numAmount,
        currency: wdCurrency,
        newBalance: debitedBalance
      });

    } catch (transferErr: any) {
      console.error('[Next.js Transfer Failed -> Refunding Wallet]:', transferErr);

      try {
        await db.runTransaction(async (transaction: any) => {
          const refundTime = getServerTimestamp();
          if (targetWalletField === 'depositWallet') {
            const freshWalletSnap = await transaction.get(walletRef);
            const currentSub = freshWalletSnap.exists
              ? Number(freshWalletSnap.data()?.balance ?? freshWalletSnap.data()?.depositWallet ?? 0)
              : 0;
            const refundedBal = currentSub + numAmount;
            transaction.set(walletRef, {
              balance: refundedBal,
              depositWallet: refundedBal,
              currency: wdCurrency,
              updatedAt: refundTime
            }, { merge: true });
          } else {
            const freshUserSnap = await transaction.get(userRef);
            const currentUserBal = freshUserSnap.exists ? Number(freshUserSnap.data()?.[targetWalletField] || 0) : 0;
            const refundedBal = currentUserBal + numAmount;
            transaction.set(userRef, {
              [targetWalletField]: refundedBal,
              updatedAt: refundTime
            }, { merge: true });
          }

          const failUpdate = {
            status: 'failed',
            refunded: true,
            error: transferErr?.message || 'Transfer failed, money refunded to wallet',
            updatedAt: refundTime
          };

          transaction.set(txDoc, failUpdate, { merge: true });
          transaction.set(userTxDoc, failUpdate, { merge: true });
        });
      } catch (refundErr) {
        console.error('[Next.js Critical Refund Error]:', refundErr);
      }

      return Response.json({
        success: false,
        error: transferErr?.message
          ? `Transfer failed (${transferErr.message}). Balance has been refunded to your wallet.`
          : 'Transfer failed, money refunded to wallet'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[Next.js Withdraw Error]:', error);
    return Response.json({
      success: false,
      error: error.message || 'Server error processing withdrawal'
    }, { status: 500 });
  }
}
