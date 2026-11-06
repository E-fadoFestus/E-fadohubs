import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';

// Initialize Firebase Admin with credentials
function getDb() {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountKey) {
    return null;
  }

  const adminApp: any = admin;
  try {
    const apps = adminApp.apps || (adminApp.getApps ? adminApp.getApps() : []);
    if (!apps.length) {
      let serviceAccount: any;
      const trimmed = serviceAccountKey.trim();
      if (trimmed.startsWith('{')) {
        serviceAccount = JSON.parse(trimmed);
      } else {
        try {
          const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
          serviceAccount = JSON.parse(decoded);
        } catch {
          serviceAccount = JSON.parse(serviceAccountKey || '{}');
        }
      }

      const certCred = adminApp.credential?.cert
        ? adminApp.credential.cert(serviceAccount)
        : (adminApp.cert ? adminApp.cert(serviceAccount) : null);

      adminApp.initializeApp({
        credential: certCred
      });
    }

    if (typeof adminApp.firestore === 'function') {
      return adminApp.firestore();
    }
    const { getFirestore } = require('firebase-admin/firestore');
    return getFirestore();
  } catch (err) {
    console.error('Failed to initialize Firebase Admin:', err);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { tx_ref, transaction_id, userId, amount } = req.body || {};

    // Strict input validation
    if (!tx_ref || !transaction_id || !userId || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: 'tx_ref, transaction_id, userId and amount required'
      });
    }

    const expectedAmount = Number(amount);
    if (isNaN(expectedAmount) || expectedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount required'
      });
    }

    // Flutterwave secret key resolution
    const flwSecret = (
      process.env.FLUTTERWAVE_CLIENT_SECRET ||
      process.env.FLWSECK_LIVE ||
      process.env.FLUTTERWAVE_SECRET_KEY ||
      process.env.FLW_SECRET_KEY ||
      ''
    ).trim().replace(/['";]/g, '');

    if (!flwSecret) {
      return res.status(500).json({
        success: false,
        message: 'Flutterwave secret missing'
      });
    }

    // Verify transaction with Flutterwave API
    let flwData: any;
    try {
      const flwRes = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${flwSecret}`,
          'Content-Type': 'application/json'
        }
      });
      flwData = await flwRes.json();
    } catch (fetchErr: any) {
      console.error('Flutterwave verify fetch error:', fetchErr);
      return res.status(502).json({
        success: false,
        message: 'Could not verify with Flutterwave'
      });
    }

    // Strict verification checks
    const verifiedAmount = Number(flwData?.data?.amount);

    if (
      flwData?.status !== 'success' ||
      flwData?.data?.status !== 'successful' ||
      flwData?.data?.tx_ref !== tx_ref ||
      flwData?.data?.currency !== 'NGN' ||
      isNaN(verifiedAmount) ||
      verifiedAmount < expectedAmount
    ) {
      return res.status(400).json({
        success: false,
        message: 'Payment not successful or amount mismatch',
        details: flwData
      });
    }

    // Backend Firestore connection via firebase-admin
    const db = getDb();
    if (!db) {
      console.error('FIREBASE_SERVICE_ACCOUNT_KEY missing or invalid in backend');
      return res.status(500).json({
        success: false,
        message: 'Server Firestore not configured'
      });
    }

    // Idempotency check: prevent duplicate crediting
    const txRefDocPath = `wallets/${userId}/transactions/${tx_ref}`;
    const txRefDoc = db.doc(txRefDocPath);
    const existingTx = await txRefDoc.get();

    if (existingTx.exists) {
      const txData = existingTx.data();
      if (txData?.status === 'successful' && txData?.credited === true) {
        const walletDoc = await db.doc(`wallets/${userId}/NGN/depositWallet`).get();
        const currentBalance = walletDoc.exists ? Number(walletDoc.data()?.balance || 0) : 0;
        return res.status(200).json({
          success: true,
          newBalance: currentBalance,
          alreadyCredited: true,
          message: 'Already credited'
        });
      }
    }

    // Credit in backend using Firestore transaction
    const walletRef = db.doc(`wallets/${userId}/NGN/depositWallet`);
    const userRef = db.doc(`users/${userId}`);
    const adminApp: any = admin;
    const serverTimestamp = adminApp.firestore?.FieldValue?.serverTimestamp
      ? adminApp.firestore.FieldValue.serverTimestamp()
      : require('firebase-admin/firestore').FieldValue.serverTimestamp();

    let updatedBalance = 0;

    await db.runTransaction(async (t: any) => {
      const walletSnapshot = await t.get(walletRef);
      const oldBalance = walletSnapshot.exists ? Number(walletSnapshot.data()?.balance || 0) : 0;
      updatedBalance = oldBalance + verifiedAmount;

      t.set(walletRef, {
        balance: updatedBalance,
        updatedAt: serverTimestamp
      }, { merge: true });

      t.set(txRefDoc, {
        tx_ref,
        transaction_id: String(transaction_id),
        userId: String(userId),
        amount: verifiedAmount,
        currency: 'NGN',
        gateway: 'flutterwave',
        status: 'successful',
        credited: true,
        createdAt: serverTimestamp
      }, { merge: true });

      t.set(userRef, {
        depositWallet: updatedBalance,
        updatedAt: serverTimestamp
      }, { merge: true });
    });

    return res.status(200).json({
      success: true,
      verified: true,
      credited: true,
      tx_ref,
      amount: verifiedAmount,
      newBalance: updatedBalance
    });

  } catch (error: any) {
    console.error('Verify error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error in verify'
    });
  }
}
