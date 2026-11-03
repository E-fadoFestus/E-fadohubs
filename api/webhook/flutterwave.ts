import { db } from '../../src/firebase';
import { doc, getDoc, setDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';

interface VercelRequest {
  method?: string;
  body?: any;
  query?: any;
  headers?: any;
}

interface VercelResponse {
  setHeader: (key: string, value: string) => void;
  status: (code: number) => VercelResponse;
  json: (body: any) => void;
  end: () => void;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, verif-hash');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health ping for webhook endpoint
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      endpoint: 'EFADO Central Processor Flutterwave Webhook',
      timestamp: new Date().toISOString()
    });
  }

  // 1. Check verif-hash efadowallet2026secureconnecthubsoperation
  const expectedHash = 'efadowallet2026secureconnecthubsoperation';
  const configuredSecret = (process.env.FLW_VERIFY_HASH || expectedHash).trim();
  const signature = req.headers?.['verif-hash'] || req.headers?.['verif_hash'] || req.headers?.['x-flutterwave-signature'];

  if (!signature || (signature !== expectedHash && signature !== configuredSecret)) {
    console.warn('[Flutterwave Webhook] Invalid or missing verif-hash signature. Rejected.');
    return res.status(401).json({ status: 'error', message: 'Unauthorized webhook hash' });
  }

  try {
    const payload = req.body || {};
    const event = payload.event || payload['event.type'] || '';
    const data = payload.data || payload;

    // 2. Auto-credit on charge.completed (or status successful)
    const isCompleted = 
      event === 'charge.completed' || 
      event === 'transfer.completed' || 
      data?.status === 'successful' || 
      payload?.status === 'successful';

    if (!isCompleted) {
      return res.status(200).json({ status: 'ignored', message: `Event ${event} acknowledged` });
    }

    const tx_ref = String(data.tx_ref || payload.tx_ref || '').trim();
    const amount = Number(data.amount || payload.amount) || 0;
    const customerEmail = String(data.customer?.email || payload.customer?.email || '').trim();
    const metaUserId = String(data.meta?.userId || payload.meta?.userId || '').trim();

    if (!tx_ref && !amount) {
      return res.status(200).json({ status: 'ignored', message: 'No tx_ref or amount in payload' });
    }

    // 3. Lookup pendingPayments record
    const pendingDocRef = doc(db, 'pendingPayments', tx_ref);
    const pendingSnap = await getDoc(pendingDocRef);

    // Idempotency check: Don't double credit
    if (pendingSnap.exists() && pendingSnap.data()?.status === 'completed') {
      return res.status(200).json({ status: 'success', message: 'Transaction already completed' });
    }

    const finalUserId = metaUserId || (pendingSnap.exists() ? pendingSnap.data()?.userId : '') || customerEmail || 'anonymous';
    const finalAmount = amount || pendingSnap.data()?.amount || 0;

    if (finalAmount > 0 && finalUserId) {
      // Target 1: Credit wallets/{userId}/NGN/depositWallet
      const walletNgnDepositRef = doc(db, 'wallets', finalUserId, 'NGN', 'depositWallet');
      await setDoc(walletNgnDepositRef, {
        depositWallet: increment(finalAmount),
        balance: increment(finalAmount),
        currency: 'NGN',
        userId: finalUserId,
        lastFundedRef: tx_ref,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Target 2: Credit wallets/{userId}
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

      // Target 3: Credit users/{userId}
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
      await setDoc(pendingDocRef, {
        status: 'completed',
        amount: finalAmount,
        creditedTo: `wallets/${finalUserId}/NGN/depositWallet`,
        webhookProcessedAt: serverTimestamp()
      }, { merge: true });

      // Record transaction
      const txRefKey = doc(db, 'transactions', tx_ref);
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
    }

    return res.status(200).json({
      status: 'success',
      message: 'Charge completed verified and auto-credited to wallets/{userId}/NGN/depositWallet',
      tx_ref,
      amount: finalAmount,
      creditedTo: `wallets/${finalUserId}/NGN/depositWallet`
    });
  } catch (err: any) {
    console.error('[Flutterwave Webhook Error]:', err);
    return res.status(500).json({ status: 'error', message: err.message || 'Webhook error' });
  }
}
