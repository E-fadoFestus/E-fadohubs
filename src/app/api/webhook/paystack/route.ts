import { verifyPaystackSignature, verifyPaystackPayment } from '../../../../lib/paystack';
import { getServerDb, getServerTimestamp } from '../../../../lib/server-firestore';

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
      const userId = verifiedData.metadata?.userId || verifiedData.customer?.email;

      if (userId && paidAmount > 0) {
        const txDoc = db.doc(`transactions/${reference}`);
        const userTxDoc = db.doc(`wallets/${userId}/transactions/${reference}`);
        const walletRef = db.doc(`wallets/${userId}/NGN/depositWallet`);
        const userRef = db.doc(`users/${userId}`);

        const txSnap = await txDoc.get();
        const existingTx = txSnap.exists ? txSnap.data() : null;

        if (!existingTx || existingTx.credited !== true) {
          await db.runTransaction(async (transaction: any) => {
            const walletSnap = await transaction.get(walletRef);
            const oldBalance = walletSnap.exists ? Number(walletSnap.data()?.balance || walletSnap.data()?.depositWallet || 0) : 0;
            const updatedBalance = oldBalance + paidAmount;

            transaction.set(walletRef, {
              balance: updatedBalance,
              depositWallet: updatedBalance,
              updatedAt: serverTime
            }, { merge: true });

            transaction.set(userRef, {
              depositWallet: updatedBalance,
              updatedAt: serverTime
            }, { merge: true });

            const successRecord = {
              type: 'fund',
              status: 'success',
              credited: true,
              amount: paidAmount,
              currency: 'NGN',
              reference,
              userId,
              gateway: 'paystack',
              updatedAt: serverTime
            };

            transaction.set(txDoc, successRecord, { merge: true });
            transaction.set(userTxDoc, successRecord, { merge: true });
          });
        }
      }
      return Response.json({ success: true, status: 'processed' }, { status: 200 });
    }

    if (event === 'transfer.success') {
      if (reference) {
        const txDoc = db.doc(`transactions/${reference}`);
        const txSnap = await txDoc.get();
        if (txSnap.exists) {
          const userId = txSnap.data().userId;
          await txDoc.set({ status: 'success', settledAt: serverTime, updatedAt: serverTime }, { merge: true });
          if (userId) {
            await db.doc(`wallets/${userId}/transactions/${reference}`).set({ status: 'success', settledAt: serverTime, updatedAt: serverTime }, { merge: true });
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

          if (txData.status === 'pending' && !txData.refunded && userId && withdrawAmount > 0) {
            const walletRef = db.doc(`wallets/${userId}/NGN/depositWallet`);
            const userRef = db.doc(`users/${userId}`);

            await db.runTransaction(async (transaction: any) => {
              const walletSnap = await transaction.get(walletRef);
              const oldBalance = walletSnap.exists ? Number(walletSnap.data()?.balance || walletSnap.data()?.depositWallet || 0) : 0;
              const refundedBalance = oldBalance + withdrawAmount;

              transaction.set(walletRef, {
                balance: refundedBalance,
                depositWallet: refundedBalance,
                updatedAt: serverTime
              }, { merge: true });

              transaction.set(userRef, {
                depositWallet: refundedBalance,
                updatedAt: serverTime
              }, { merge: true });

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
