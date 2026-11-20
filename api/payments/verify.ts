import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServerDb, getServerTimestamp } from '../../src/lib/server-firestore.js';

const ACTIVE_CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'CAD', 'AUD', 'GHS', 'ZAR', 'XOF'];

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
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
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
          }).toString(),
          signal: controller.signal
        }
      );
      clearTimeout(timer);
      const tokenData = await tokenRes.json().catch(() => null);
      if (tokenRes.ok && tokenData?.access_token) {
        return tokenData.access_token;
      }
    } catch (err) {
      clearTimeout(timer);
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
    const verifyController = new AbortController();
    const verifyTimer = setTimeout(() => verifyController.abort(), 10000);
    try {
      const verifyEndpoint = transaction_id
        ? `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transaction_id)}/verify`
        : `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(tx_ref)}`;

      const flwRes = await fetch(verifyEndpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${flwBearer}`,
          'Content-Type': 'application/json'
        },
        signal: verifyController.signal
      });
      clearTimeout(verifyTimer);
      flwData = await flwRes.json().catch(() => null);
    } catch (fetchErr: any) {
      clearTimeout(verifyTimer);
      console.error('Flutterwave verify fetch error:', fetchErr);
      return res.status(fetchErr?.name === 'AbortError' ? 504 : 502).json({
        success: false,
        status: false,
        message:
          fetchErr?.name === 'AbortError'
            ? 'Flutterwave gateway did not respond within 10 seconds. Please try again.'
            : 'Could not verify transaction with Flutterwave'
      });
    }

    const verifiedStatus = String(flwData?.data?.status || '').toLowerCase();
    const verifiedAmount = Number(flwData?.data?.amount);
    const verifiedRef = String(flwData?.data?.tx_ref || tx_ref || `FLW_TX_${transaction_id}`).trim();
    const txCurrency = String(flwData?.data?.currency || source.currency || 'NGN').trim().toUpperCase();

    if (txCurrency === 'SIRA' || !ACTIVE_CURRENCIES.includes(txCurrency)) {
      return res.status(400).json({
        success: false,
        status: false,
        message: `Unsupported transaction currency "${txCurrency}"`
      });
    }

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

    const pendingDoc = db.doc(`pendingPayments/${verifiedRef}`);
    const pendingSnap = await pendingDoc.get();
    const targetUserId = String(
      flwData?.data?.meta?.userId ||
        (pendingSnap.exists ? pendingSnap.data()?.userId : '') ||
        fallbackUserId ||
        ''
    ).trim();

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        status: false,
        message: 'Could not identify user account for this Flutterwave payment'
      });
    }

    const txRefDoc = db.doc(`wallets/${targetUserId}/transactions/${verifiedRef}`);
    const globalTxDoc = db.doc(`transactions/${verifiedRef}`);
    // Canonical single pocket location per currency: wallets/{uid}/{currency}/depositWallet
    const walletRef = db.doc(`wallets/${targetUserId}/${txCurrency}/depositWallet`);

    const existingTx = await globalTxDoc.get();
    const existingSubTx = await txRefDoc.get();
    if (
      (existingTx.exists && existingTx.data()?.credited === true) ||
      (existingSubTx.exists && existingSubTx.data()?.credited === true)
    ) {
      const walletDoc = await walletRef.get();
      const currentBalance = walletDoc.exists
        ? Number(walletDoc.data()?.balance ?? walletDoc.data()?.depositWallet ?? 0)
        : 0;
      return res.status(200).json({
        success: true,
        status: true,
        credited: true,
        alreadyCredited: true,
        already_processed: true,
        tx_ref: verifiedRef,
        amount: verifiedAmount,
        currency: txCurrency,
        newBalance: currentBalance,
        creditedPocket: `wallets/${targetUserId}/${txCurrency}/depositWallet`,
        data: { status: 'success', amount: verifiedAmount, currency: txCurrency, tx_ref: verifiedRef },
        message: 'Already credited'
      });
    }

    const serverTime = getServerTimestamp();
    let updatedBalance = 0;

    await db.runTransaction(async (t: any) => {
      const freshTx = await t.get(globalTxDoc);
      if (freshTx.exists && freshTx.data()?.credited === true) {
        const wSnap = await t.get(walletRef);
        updatedBalance = wSnap.exists ? Number(wSnap.data()?.balance ?? wSnap.data()?.depositWallet ?? 0) : 0;
        return;
      }

      const walletSnapshot = await t.get(walletRef);
      const oldBalance = walletSnapshot.exists
        ? Number(walletSnapshot.data()?.balance ?? walletSnapshot.data()?.depositWallet ?? 0)
        : 0;
      updatedBalance = oldBalance + verifiedAmount;

      t.set(
        walletRef,
        {
          balance: updatedBalance,
          depositWallet: updatedBalance,
          currency: txCurrency,
          userId: targetUserId,
          lastFundedRef: verifiedRef,
          createdAt: walletSnapshot.exists ? (walletSnapshot.data()?.createdAt || serverTime) : serverTime,
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
        currency: txCurrency,
        gateway: 'flutterwave',
        method: 'Flutterwave Gateway',
        purpose: 'Wallet Top-up',
        description: `Verified Flutterwave Deposit (${txCurrency}) [Ref: ${verifiedRef}]`,
        creditedPocket: `wallets/${targetUserId}/${txCurrency}/depositWallet`,
        status: 'completed',
        credited: true,
        timestamp: serverTime,
        createdAt: existingTx.exists ? (existingTx.data()?.createdAt || serverTime) : serverTime,
        updatedAt: serverTime
      };

      t.set(txRefDoc, txRecord, { merge: true });
      t.set(globalTxDoc, txRecord, { merge: true });
      t.set(pendingDoc, { status: 'completed', credited: true, currency: txCurrency, updatedAt: serverTime }, { merge: true });
    });

    return res.status(200).json({
      success: true,
      status: true,
      verified: true,
      credited: true,
      tx_ref: verifiedRef,
      amount: verifiedAmount,
      currency: txCurrency,
      newBalance: updatedBalance,
      creditedPocket: `wallets/${targetUserId}/${txCurrency}/depositWallet`,
      data: {
        status: 'success',
        amount: verifiedAmount,
        currency: txCurrency,
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
