import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServerDb, getServerTimestamp } from '../../src/lib/server-firestore.js';

const ACTIVE_CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'CAD', 'AUD', 'GHS', 'ZAR', 'XOF'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, verif-hash');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'active', endpoint: 'EFADO Flutterwave Webhook' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const verifHash = (req.headers['verif-hash'] || req.headers['verif_hash']) as string | undefined;
    const expectedHash = (process.env.FLW_VERIFY_HASH || 'efadowallet2026secureconnecthubsoperation').trim();
    if (!verifHash || verifHash.trim() !== expectedHash) {
      return res.status(401).json({ success: false, message: 'Unauthorized webhook hash' });
    }

    const payload = req.body || {};
    const data = payload.data || payload;
    const event = String(payload.event || '').toLowerCase();
    const txStatus = String(data.status || '').toLowerCase();
    const txRef = String(data.tx_ref || payload.tx_ref || '').trim();
    const amount = Number(data.amount || payload.amount || 0);
    const txCurrency = String(data.currency || payload.currency || 'NGN').trim().toUpperCase();

    if (
      txRef &&
      amount > 0 &&
      ACTIVE_CURRENCIES.includes(txCurrency) &&
      (txStatus === 'successful' || txStatus === 'completed' || event === 'charge.completed')
    ) {
      const db = getServerDb();
      if (db) {
        const pendingRef = db.doc(`pendingPayments/${txRef}`);
        const pendingSnap = await pendingRef.get();
        const targetUserId = String(
          data.meta?.userId ||
            payload.meta?.userId ||
            (pendingSnap.exists ? pendingSnap.data()?.userId : '') ||
            ''
        ).trim();

        if (targetUserId) {
          const serverTime = getServerTimestamp();
          const walletRef = db.doc(`wallets/${targetUserId}/${txCurrency}/depositWallet`);
          const globalTxRef = db.doc(`transactions/${txRef}`);
          const userTxRef = db.doc(`wallets/${targetUserId}/transactions/${txRef}`);

          await db.runTransaction(async (t: any) => {
            const existingTx = await t.get(globalTxRef);
            if (existingTx.exists && existingTx.data()?.credited === true) {
              return;
            }

            const walletSnap = await t.get(walletRef);
            const oldBal = walletSnap.exists
              ? Number(walletSnap.data()?.balance ?? walletSnap.data()?.depositWallet ?? 0)
              : 0;
            const newBal = oldBal + amount;

            t.set(
              walletRef,
              {
                balance: newBal,
                depositWallet: newBal,
                currency: txCurrency,
                userId: targetUserId,
                lastFundedRef: txRef,
                createdAt: walletSnap.exists ? (walletSnap.data()?.createdAt || serverTime) : serverTime,
                updatedAt: serverTime
              },
              { merge: true }
            );

            const txRecord = {
              type: 'deposit',
              tx_ref: txRef,
              reference: txRef,
              userId: targetUserId,
              amount,
              currency: txCurrency,
              gateway: 'flutterwave',
              method: 'Flutterwave Gateway',
              purpose: 'Wallet Top-up',
              description: `Verified Flutterwave Deposit (${txCurrency}) [Ref: ${txRef}]`,
              creditedPocket: `wallets/${targetUserId}/${txCurrency}/depositWallet`,
              status: 'completed',
              credited: true,
              timestamp: serverTime,
              createdAt: existingTx.exists ? (existingTx.data()?.createdAt || serverTime) : serverTime,
              updatedAt: serverTime
            };

            t.set(globalTxRef, txRecord, { merge: true });
            t.set(userTxRef, txRecord, { merge: true });
            t.set(pendingRef, { status: 'completed', credited: true, currency: txCurrency, updatedAt: serverTime }, { merge: true });
          });
        }
      }
    }

    return res.status(200).json({ success: true, status: 'received', message: 'Webhook processed' });
  } catch (e: any) {
    console.error('[Vercel Flutterwave Webhook Error]:', e);
    return res.status(200).json({ success: true, message: 'Webhook acked' });
  }
}
