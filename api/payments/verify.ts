import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServerDb, getServerTimestamp } from '../../src/lib/server-firestore';

const cleanKey = (k?: string) =>
  (k || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/[;\s]/g, '');

async function getFlutterwaveBearerToken(): Promise<string> {
  const v3Secret = cleanKey(
    process.env.FLWSECK_LIVE ||
      process.env.FLW_SECRET_KEY ||
      process.env.FLUTTERWAVE_SECRET_KEY ||
      process.env.FLWSECK
  );
  if (v3Secret) return v3Secret;

  const clientId = cleanKey(
    process.env.FLUTTERWAVE_CLIENT_ID ||
      process.env.VITE_FLUTTERWAVE_CLIENT_ID ||
      process.env.FLW_PUBLIC_KEY
  );
  const clientSecret = cleanKey(process.env.FLUTTERWAVE_CLIENT_SECRET);
  if (clientId && clientSecret) {
    try {
      const tokenRes = await fetch(
        'https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials'
          }).toString()
        }
      );
      const tokenData = await tokenRes.json().catch(() => null);
      if (tokenRes.ok && tokenData?.access_token) {
        return tokenData.access_token;
      }
    } catch (err) {
      console.warn('[Flutterwave Verify Token Fallback Error]:', err);
    }
    return clientSecret;
  }
  return '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ success: false, status: false, message: 'Method not allowed' });
  }

  try {
    const source = req.method === 'POST' ? req.body || {} : req.query || {};
    const tx_ref = String(
      source.tx_ref || source.txRef || source.reference || req.query?.tx_ref || ''
    ).trim();
    const transaction_id = String(
      source.transaction_id || source.transactionId || source.id || req.query?.transaction_id || ''
    ).trim();
    const fallbackAmount = Number(source.amount || req.query?.amount) || 0;
    const fallbackUserId = String(source.userId || source.user_id || req.query?.userId || '').trim();

    if (!tx_ref && !transaction_id) {
      return res.status(400).json({
        success: false,
        status: false,
        message: 'tx_ref or transaction_id is required'
      });
    }

    const db = getServerDb();
    if (!db) {
      return res.status(500).json({
        success: false,
        status: false,
        message: 'Server Firestore unavailable'
      });
    }

    const flwBearer = await getFlutterwaveBearerToken();
    if (!flwBearer) {
      return res.status(500).json({
        success: false,
        status: false,
        message: 'Flutterwave secret key missing in Vercel environment'
      });
    }

    let flwData: any = null;
    try {
      const verifyEndpoint = transaction_id
        ? `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transaction_id)}/verify`
        : `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(tx_ref)}`;

      const flwRes = await fetch(verifyEndpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${flwBearer}`,
          'Content-Type': 'application/json'
        }
      });
      flwData = await flwRes.json().catch(() => null);
    } catch (fetchErr: any) {
      console.error('Flutterwave verify fetch error:', fetchErr);
      return res.status(502).json({
        success: false,
        status: false,
        message: 'Could not verify transaction with Flutterwave'
      });
    }

    const verifiedStatus = String(flwData?.data?.status || '').toLowerCase();
    const verifiedAmount = Number(flwData?.data?.amount);
    const verifiedRef = String(flwData?.data?.tx_ref || tx_ref || `FLW_TX_${transaction_id}`).trim();
    const targetUserId = String(
      fallbackUserId || flwData?.data?.meta?.userId || ''
    ).trim();

    if (
      flwData?.status !== 'success' ||
      (verifiedStatus !== 'successful' && verifiedStatus !== 'completed') ||
      (tx_ref && flwData?.data?.tx_ref && flwData.data.tx_ref !== tx_ref) ||
      !Number.isFinite(verifiedAmount) ||
      verifiedAmount <= 0 ||
      (fallbackAmount > 0 && verifiedAmount < fallbackAmount)
    ) {
      return res.status(400).json({
        success: false,
        status: false,
        message: flwData?.message || 'Payment not confirmed successful on Flutterwave',
        details: flwData
      });
    }

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        status: false,
        message: 'Could not identify user account for this Flutterwave payment'
      });
    }

    const txRefDoc = db.doc(`wallets/${targetUserId}/transactions/${verifiedRef}`);
    const globalTxDoc = db.doc(`transactions/${verifiedRef}`);
    const pendingDoc = db.doc(`pendingPayments/${verifiedRef}`);
    const walletRef = db.doc(`wallets/${targetUserId}/NGN/depositWallet`);
    const userRef = db.doc(`users/${targetUserId}`);

    const existingTx = await txRefDoc.get();
    if (existingTx.exists && existingTx.data()?.credited === true) {
      const walletDoc = await walletRef.get();
      const currentBalance = walletDoc.exists
        ? Number(walletDoc.data()?.balance ?? walletDoc.data()?.depositWallet ?? 0)
        : 0;
      return res.status(200).json({
        success: true,
        status: true,
        alreadyCredited: true,
        already_processed: true,
        tx_ref: verifiedRef,
        amount: verifiedAmount,
        newBalance: currentBalance,
        data: { status: 'success', amount: verifiedAmount, tx_ref: verifiedRef },
        message: 'Already credited'
      });
    }

    const serverTime = getServerTimestamp();
    let updatedBalance = 0;

    await db.runTransaction(async (t: any) => {
      const walletSnapshot = await t.get(walletRef);
      const userSnapshot = await t.get(userRef);

      const subBal = walletSnapshot.exists
        ? Number(walletSnapshot.data()?.balance ?? walletSnapshot.data()?.depositWallet ?? 0)
        : 0;
      const userBal = userSnapshot.exists
        ? Number(userSnapshot.data()?.depositWallet ?? 0)
        : 0;
      const oldBalance = Math.max(subBal, userBal);
      updatedBalance = oldBalance + verifiedAmount;

      t.set(
        walletRef,
        {
          balance: updatedBalance,
          depositWallet: updatedBalance,
          updatedAt: serverTime
        },
        { merge: true }
      );

      t.set(
        userRef,
        {
          depositWallet: updatedBalance,
          updatedAt: serverTime
        },
        { merge: true }
      );

      const txRecord = {
        type: 'deposit',
        tx_ref: verifiedRef,
        reference: verifiedRef,
        transaction_id: String(transaction_id || flwData?.data?.id || ''),
        userId: targetUserId,
        amount: verifiedAmount,
        currency: flwData?.data?.currency || 'NGN',
        gateway: 'flutterwave',
        method: 'Flutterwave Gateway',
        status: 'completed',
        credited: true,
        createdAt: serverTime,
        updatedAt: serverTime
      };

      t.set(txRefDoc, txRecord, { merge: true });
      t.set(globalTxDoc, txRecord, { merge: true });
      t.set(pendingDoc, { status: 'completed', credited: true, updatedAt: serverTime }, { merge: true });
    });

    return res.status(200).json({
      success: true,
      status: true,
      verified: true,
      credited: true,
      tx_ref: verifiedRef,
      amount: verifiedAmount,
      newBalance: updatedBalance,
      data: {
        status: 'success',
        amount: verifiedAmount,
        tx_ref: verifiedRef
      }
    });
  } catch (error: any) {
    console.error('[Vercel Flutterwave Verify Crash]:', error);
    return res.status(500).json({
      success: false,
      status: false,
      message: error?.message || 'Server error verifying Flutterwave payment'
    });
  }
}
