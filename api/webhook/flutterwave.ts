import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/firebase';
import { doc, getDoc, setDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, verif-hash');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health ping
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      status: 'active',
      endpoint: 'EFADO Central Processor Flutterwave Webhook',
      timestamp: new Date().toISOString()
    });
  }

  // 1. Check verif-hash header: efadowallet2026secureconnecthubsoperation
  const expectedHash = 'efadowallet2026secureconnecthubsoperation';
  const receivedHash = (
    req.headers?.['verif-hash'] || 
    req.headers?.['verif_hash'] || 
    req.headers?.['x-flutterwave-signature'] || 
    ''
  ).toString().trim();

  if (receivedHash !== expectedHash && receivedHash !== (process.env.FLW_VERIFY_HASH || '').trim()) {
    console.warn('[Flutterwave Webhook] Unauthorized verif-hash signature:', receivedHash);
    return res.status(401).json({
      success: false,
      status: 'error',
      message: 'Unauthorized: Invalid verif-hash'
    });
  }

  try {
    const payload = req.body || {};
    const event = payload.event || payload['event.type'] || '';
    const data = payload.data || payload;

    // 2. Auto-credit on charge.completed
    const isCompleted = 
      event === 'charge.completed' || 
      event === 'transfer.completed' || 
      data?.status === 'successful' || 
      payload?.status === 'successful';

    if (!isCompleted) {
      return res.status(200).json({
        success: true,
        status: 'ignored',
        message: `Event '${event}' acknowledged without wallet modification`
      });
    }

    const tx_ref = String(data.tx_ref || payload.tx_ref || '').trim();
    const amount = Number(data.amount || payload.amount) || 0;
    const customerEmail = String(data.customer?.email || payload.customer?.email || '').trim();
    const metaUserId = String(data.meta?.userId || payload.meta?.userId || '').trim();

    if (!tx_ref && !amount) {
      return res.status(200).json({
        success: true,
        status: 'ignored',
        message: 'No tx_ref or amount provided in webhook payload'
      });
    }

    const pendingRefKey = tx_ref || `FLW_TX_${data.id || Date.now()}`;
    let pendingSnap: any = null;

    try {
      const pendingDocRef = doc(db, 'pendingPayments', pendingRefKey);
      pendingSnap = await getDoc(pendingDocRef);
    } catch (e) {
      console.warn('[Flutterwave Webhook] Firestore pending fetch warning:', e);
    }

    // Idempotency check: Don't double credit
    if (pendingSnap && pendingSnap.exists() && pendingSnap.data()?.status === 'completed') {
      return res.status(200).json({
        success: true,
        status: 'success',
        message: 'Transaction already completed and credited'
      });
    }

    const finalUserId = metaUserId || (pendingSnap?.exists() ? pendingSnap.data()?.userId : '') || customerEmail || 'anonymous';
    const finalAmount = amount || (pendingSnap?.exists() ? pendingSnap.data()?.amount : 0) || 0;

    if (finalAmount > 0 && finalUserId) {
      try {
        // Credit wallets/{userId}/NGN/depositWallet
        const walletNgnDepositRef = doc(db, 'wallets', finalUserId, 'NGN', 'depositWallet');
        await setDoc(walletNgnDepositRef, {
          depositWallet: increment(finalAmount),
          balance: increment(finalAmount),
          currency: 'NGN',
          userId: finalUserId,
          lastFundedRef: tx_ref,
          updatedAt: serverTimestamp()
        }, { merge: true });

        // Credit wallets/{userId}
        const mainWalletRef = doc(db, 'wallets', finalUserId);
        await setDoc(mainWalletRef, {
          depositWallet: increment(finalAmount),
          balance: increment(finalAmount),
          NGN: {
            depositWallet: increment(finalAmount),
            balance: increment(finalAmount)
          },
          updatedAt: serverTimestamp()
        }, { merge: true });

        // Credit users/{userId}
        const userRef = doc(db, 'users', finalUserId);
        await updateDoc(userRef, {
          depositWallet: increment(finalAmount),
          playerWallet: increment(finalAmount),
          balance: increment(finalAmount)
        }).catch(async () => {
          await setDoc(userRef, {
            depositWallet: increment(finalAmount),
            playerWallet: increment(finalAmount),
            balance: increment(finalAmount),
            email: customerEmail
          }, { merge: true });
        });

        // Update pendingPayments
        const pendingDocRef = doc(db, 'pendingPayments', pendingRefKey);
        await setDoc(pendingDocRef, {
          status: 'completed',
          amount: finalAmount,
          creditedTo: `wallets/${finalUserId}/NGN/depositWallet`,
          webhookProcessedAt: serverTimestamp()
        }, { merge: true });

        // Record transaction
        const txRefKey = doc(db, 'transactions', pendingRefKey);
        await setDoc(txRefKey, {
          userId: finalUserId,
          userEmail: customerEmail,
          type: 'deposit',
          amount: finalAmount,
          currency: 'NGN',
          status: 'completed',
          method: 'Flutterwave Central Processor Webhook',
          reference: tx_ref,
          channel: 'ALL',
          timestamp: serverTimestamp()
        }, { merge: true });
      } catch (dbErr) {
        console.warn('[Flutterwave Webhook] Firestore write warning:', dbErr);
      }
    }

    return res.status(200).json({
      success: true,
      status: 'success',
      message: 'Charge completed verified and auto-credited to wallets/{userId}/NGN/depositWallet',
      tx_ref,
      amount: finalAmount,
      creditedTo: `wallets/${finalUserId}/NGN/depositWallet`
    });
  } catch (err: any) {
    console.error('[Flutterwave Webhook Error]:', err);
    return res.status(500).json({
      success: false,
      status: 'error',
      message: err.message || 'Webhook server error',
      error: String(err)
    });
  }
}
