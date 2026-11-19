import { getPaystackBalance, resolveAccountNumber, createTransferRecipient, initiateTransfer } from '../../../../lib/paystack';
import { getServerDb, getServerTimestamp, auth } from '../../../../lib/server-firestore';

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
    const { amount, account_number, bank_code, account_name, source_wallet } = body || {};
    const targetWalletField =
      source_wallet === 'playerWallet'
        ? 'playerWallet'
        : source_wallet === 'depositWallet'
          ? 'depositWallet'
          : 'cashOutWallet';

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 100 || numAmount > 1000000) {
      return Response.json({ success: false, error: 'Invalid amount: Must be between ₦100 and ₦1,000,000' }, { status: 400 });
    }

    const cleanAccount = String(account_number || '').trim().replace(/\D/g, '');
    const cleanBank = String(bank_code || '').trim();
    const providedName = String(account_name || '').trim();

    if (!cleanAccount || cleanAccount.length !== 10 || !cleanBank || !providedName) {
      return Response.json({ success: false, error: 'Please verify account first with valid bank and 10-digit account number' }, { status: 400 });
    }

    const db = getServerDb();
    if (!db) {
      return Response.json({ success: false, error: 'Server Firestore not configured' }, { status: 500 });
    }

    const walletRef = db.doc(`wallets/${userId}/NGN/depositWallet`);
    const userRef = db.doc(`users/${userId}`);
    const [walletSnap, userSnap] = await Promise.all([walletRef.get(), userRef.get()]);
    const subBalance = walletSnap.exists ? Number(walletSnap.data()?.balance || walletSnap.data()?.depositWallet || 0) : 0;
    const userFieldBalance = userSnap.exists ? Number(userSnap.data()?.[targetWalletField] || 0) : 0;
    const currentBalance =
      targetWalletField === 'depositWallet' ? Math.max(subBalance, userFieldBalance) : userFieldBalance;

    if (numAmount > currentBalance) {
      return Response.json({
        success: false,
        error: `Insufficient balance in ${targetWalletField} (Available: ₦${currentBalance.toLocaleString()})`
      }, { status: 400 });
    }

    try {
      const balanceRes = await getPaystackBalance();
      const balances = balanceRes?.data || [];
      const ngnBalanceObj = balances.find((b: any) => b.currency === 'NGN') || balances[0];
      const paystackBalanceKobo = Number(ngnBalanceObj?.balance || 0);

      if (paystackBalanceKobo < numAmount * 100) {
        return Response.json({ success: false, error: 'Withdrawal temporarily unavailable, try later' }, { status: 400 });
      }
    } catch (e) {
      console.warn('[Next.js Balance Check Warning]:', e);
    }

    try {
      const resolveRes = await resolveAccountNumber(cleanAccount, cleanBank);
      if (!resolveRes?.data?.account_name) {
        return Response.json({ success: false, error: 'Destination bank account could not be resolved' }, { status: 400 });
      }
    } catch {
      return Response.json({ success: false, error: 'Could not verify account with bank. Check details.' }, { status: 400 });
    }

    let recipientCode = '';
    const recipientKey = `${cleanBank}_${cleanAccount}`;
    const userRecipientDoc = db.doc(`users/${userId}/recipients/${recipientKey}`);
    const recipientSnap = await userRecipientDoc.get();

    if (recipientSnap.exists && recipientSnap.data()?.recipient_code) {
      recipientCode = recipientSnap.data().recipient_code;
    } else {
      const recipientRes = await createTransferRecipient(providedName, cleanAccount, cleanBank);
      recipientCode = recipientRes?.data?.recipient_code;

      if (!recipientCode) {
        return Response.json({ success: false, error: 'Failed to register withdrawal bank beneficiary' }, { status: 500 });
      }

      await userRecipientDoc.set({
        recipient_code: recipientCode,
        account_name: providedName,
        account_number: cleanAccount,
        bank_code: cleanBank,
        createdAt: getServerTimestamp()
      }, { merge: true });
    }

    const reference = `EFADO-WD-${userId.substring(0, 8)}-${Date.now()}`;
    const serverTime = getServerTimestamp();
    const txDoc = db.doc(`transactions/${reference}`);
    const userTxDoc = db.doc(`wallets/${userId}/transactions/${reference}`);

    let debitedBalance = 0;

    await db.runTransaction(async (transaction: any) => {
      const [freshWalletSnap, freshUserSnap] = await Promise.all([
        transaction.get(walletRef),
        transaction.get(userRef)
      ]);
      const freshSub = freshWalletSnap.exists
        ? Number(freshWalletSnap.data()?.balance || freshWalletSnap.data()?.depositWallet || 0)
        : 0;
      const freshUserBal = freshUserSnap.exists
        ? Number(freshUserSnap.data()?.[targetWalletField] || 0)
        : 0;
      const balance =
        targetWalletField === 'depositWallet' ? Math.max(freshSub, freshUserBal) : freshUserBal;

      if (numAmount > balance) {
        throw new Error('Insufficient wallet balance');
      }

      debitedBalance = balance - numAmount;

      if (targetWalletField === 'depositWallet') {
        transaction.set(walletRef, {
          balance: debitedBalance,
          depositWallet: debitedBalance,
          updatedAt: serverTime
        }, { merge: true });
      }

      transaction.set(userRef, {
        [targetWalletField]: debitedBalance,
        updatedAt: serverTime
      }, { merge: true });

      const withdrawRecord = {
        type: 'withdraw',
        status: 'pending',
        amount: numAmount,
        currency: 'NGN',
        sourceWallet: targetWalletField,
        account_number: cleanAccount,
        bank_code: cleanBank,
        account_name: providedName,
        reference,
        userId,
        gateway: 'paystack',
        createdAt: serverTime,
        updatedAt: serverTime
      };

      transaction.set(txDoc, withdrawRecord, { merge: true });
      transaction.set(userTxDoc, withdrawRecord, { merge: true });
    });

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
        txDoc.set({ transfer_code: transferCode, transfer_status: transferData.status }, { merge: true }),
        userTxDoc.set({ transfer_code: transferCode, transfer_status: transferData.status }, { merge: true })
      ]);

      return Response.json({
        success: true,
        debitedOnServer: true,
        message: 'Withdrawal processing, you will receive in bank shortly',
        reference,
        transfer_code: transferCode,
        amount: numAmount,
        newBalance: debitedBalance
      });

    } catch (transferErr: any) {
      console.error('[Next.js Transfer Failed -> Refunding Wallet]:', transferErr);

      try {
        await db.runTransaction(async (transaction: any) => {
          const [freshWalletSnap, freshUserSnap] = await Promise.all([
            transaction.get(walletRef),
            transaction.get(userRef)
          ]);
          const currentSub = freshWalletSnap.exists
            ? Number(freshWalletSnap.data()?.balance || freshWalletSnap.data()?.depositWallet || 0)
            : 0;
          const currentUserBal = freshUserSnap.exists
            ? Number(freshUserSnap.data()?.[targetWalletField] || 0)
            : 0;
          const baseBal =
            targetWalletField === 'depositWallet' ? Math.max(currentSub, currentUserBal) : currentUserBal;
          const refundedBal = baseBal + numAmount;

          if (targetWalletField === 'depositWallet') {
            transaction.set(walletRef, {
              balance: refundedBal,
              depositWallet: refundedBal,
              updatedAt: getServerTimestamp()
            }, { merge: true });
          }

          transaction.set(userRef, {
            [targetWalletField]: refundedBal,
            updatedAt: getServerTimestamp()
          }, { merge: true });

          const failUpdate = {
            status: 'failed',
            refunded: true,
            error: transferErr?.message || 'Transfer failed, money refunded to wallet',
            updatedAt: getServerTimestamp()
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
