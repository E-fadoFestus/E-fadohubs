import { verifyPaystackSignature, verifyPaystackPayment } from '../../../../lib/paystack.js';
import { getServerDb, getServerTimestamp } from '../../../../lib/server-firestore.js';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature') || '';

    const isValid = verifyPaystackSignature(rawBody, signature);
    if (!isValid) {
      console.error('[Next.js Paystack Webhook] Invalid signature rejected');
      return Response.json({ success: false, message: 'Invalid Paystack signature' }, { status: 401 });
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = {};
    }

    const event = payload.event;
    const data = payload.data || {};
    const reference = data.reference;

    const db = getServerDb();
    if (!db) {
      return Response.json({ success: true, warning: 'DB connection offline' }, { status: 200 });
    }

    const serverTime = getServerTimestamp();

    if (event === 'charge.success') {
      if (!reference) {
        return Response.json({ success: true, ignored: true, reason: 'No reference' }, { status: 200 });
      }

      let verifiedData = data;
      try {
        const verifyRes = await verifyPaystackPayment(reference);
        if (verifyRes?.status && verifyRes?.data?.status === 'success') {
          verifiedData = verifyRes.data;
        }
      } catch (e) {
        console.warn('[Next.js Webhook Re-verify notice]:', e);
      }

      const paidAmount = Number(verifiedData.amount) / 100;
      const txCurrency = String(verifiedData.currency || 'NGN').trim().toUpperCase();
      const ALLOWED_CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'CAD', 'AUD', 'GHS', 'ZAR', 'XOF'];
      const userId = verifiedData.metadata?.userId || verifiedData.customer?.email;

      if (userId && paidAmount > 0 && ALLOWED_CURRENCIES.includes(txCurrency)) {
        const txDoc = db.doc(`transactions/${reference}`);
        const userTxDoc = db.doc(`wallets/${userId}/transactions/${reference}`);
        const walletRef = db.doc(`wallets/${userId}/${txCurrency}/depositWallet`);

        await db.runTransaction(async (transaction: any) => {
          const txSnap = await transaction.get(txDoc);
          const existingTx = txSnap.exists ? txSnap.data() : null;
          if (existingTx && existingTx.credited === true) {
            return;
          }

          const walletSnap = await transaction.get(walletRef);
          const oldBalance = walletSnap.exists ? Number(walletSnap.data()?.balance ?? walletSnap.data()?.depositWallet ?? 0) : 0;
          const updatedBalance = oldBalance + paidAmount;

          transaction.set(walletRef, {
            balance: updatedBalance,
            depositWallet: updatedBalance,
            currency: txCurrency,
            userId,
            lastFundedRef: reference,
            createdAt: walletSnap.exists ? (walletSnap.data()?.createdAt || serverTime) : serverTime,
            updatedAt: serverTime
          }, { merge: true });

          const successRecord = {
            type: 'deposit',
            status: 'completed',
            credited: true,
            amount: paidAmount,
            currency: txCurrency,
            reference,
            userId,
            gateway: 'paystack',
            method: 'Paystack Gateway',
            purpose: 'Wallet Top-up',
            description: `Verified Paystack Deposit (${txCurrency}) [Ref: ${reference}]`,
            creditedPocket: `wallets/${userId}/${txCurrency}/depositWallet`,
            timestamp: serverTime,
            createdAt: existingTx?.createdAt || serverTime,
            updatedAt: serverTime
          };

          transaction.set(txDoc, successRecord, { merge: true });
          transaction.set(userTxDoc, successRecord, { merge: true });
        });
      }
      return Response.json({ success: true, status: 'processed' }, { status: 200 });
    }

    if (event === 'transfer.success') {
      if (reference) {
        const txDoc = db.doc(`transactions/${reference}`);
        const txSnap = await txDoc.get();
        if (txSnap.exists) {
          const userId = txSnap.data().userId;
          await txDoc.set({ status: 'completed', settledAt: serverTime, updatedAt: serverTime }, { merge: true });
          if (userId) {
            await db.doc(`wallets/${userId}/transactions/${reference}`).set({ status: 'completed', settledAt: serverTime, updatedAt: serverTime }, { merge: true });
          }
        }
      }
      return Response.json({ success: true, status: 'transfer_success_handled' }, { status: 200 });
    }

    if (event === 'transfer.failed' || event === 'transfer.reversed') {
      if (reference) {
        const txDoc = db.doc(`transactions/${reference}`);
        const txSnap = await txDoc.get();

        if (txSnap.exists) {
          const txData = txSnap.data();
          const userId = txData.userId;
          const withdrawAmount = Number(txData.amount || 0);
          const wdCurrency = String(txData.currency || 'NGN').trim().toUpperCase();
          const sourceWallet = txData.sourceWallet || 'depositWallet';

          if (txData.status === 'pending' && !txData.refunded && userId && withdrawAmount > 0) {
            const walletRef = db.doc(`wallets/${userId}/${wdCurrency}/depositWallet`);
            const userRef = db.doc(`users/${userId}`);

            await db.runTransaction(async (transaction: any) => {
              if (sourceWallet === 'playerWallet' || sourceWallet === 'cashOutWallet') {
                const userSnap = await transaction.get(userRef);
                const oldBal = userSnap.exists ? Number(userSnap.data()?.[sourceWallet] || 0) : 0;
                transaction.set(userRef, {
                  [sourceWallet]: oldBal + withdrawAmount,
                  updatedAt: serverTime
                }, { merge: true });
              } else {
                const walletSnap = await transaction.get(walletRef);
                const oldBalance = walletSnap.exists ? Number(walletSnap.data()?.balance ?? walletSnap.data()?.depositWallet ?? 0) : 0;
                const refundedBalance = oldBalance + withdrawAmount;
                transaction.set(walletRef, {
                  balance: refundedBalance,
                  depositWallet: refundedBalance,
                  currency: wdCurrency,
                  updatedAt: serverTime
                }, { merge: true });
              }

              const failRecord = {
                status: 'failed',
                refunded: true,
                refundAmount: withdrawAmount,
                failureReason: data.reason || 'Transfer failed or reversed by destination bank',
                updatedAt: serverTime
              };

              transaction.set(txDoc, failRecord, { merge: true });
              transaction.set(db.doc(`wallets/${userId}/transactions/${reference}`), failRecord, { merge: true });
            });
          }
        }
      }
      return Response.json({ success: true, status: 'transfer_failure_refunded' }, { status: 200 });
    }

    return Response.json({ success: true, status: 'event_acknowledged' }, { status: 200 });

  } catch (error: any) {
    console.error('[Next.js Webhook Error]:', error);
    return Response.json({ success: true, warning: error.message }, { status: 200 });
  }
}
