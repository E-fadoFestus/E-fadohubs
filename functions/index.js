const functions = require('firebase-functions');
const { defineSecret } = require('firebase-functions/params');

const clientId = defineSecret('FLUTTERWAVE_CLIENT_ID');
const clientSecret = defineSecret('FLUTTERWAVE_CLIENT_SECRET');
const encryptionKey = defineSecret('FLUTTERWAVE_ENCRYPTION_KEY');
const opaySecretKey = defineSecret('OPAY_SECRET_KEY');
const opayMerchantId = defineSecret('OPAY_MERCHANT_ID');

/**
 * Callable Firebase Function to initialize Flutterwave V4 Checkout session securely.
 * The Secret Key and Encryption Key remain strictly server-side in Firebase Secrets.
 */
exports.createFlutterwavePayment = functions.https.onCall(
  { secrets: [clientSecret, clientId, encryptionKey] },
  async (request) => {
    const data = request.data || request;
    const resolvedSecret = process.env.FLUTTERWAVE_CLIENT_SECRET || (clientSecret ? clientSecret.value() : '');
    const resolvedClientId = data.publicKey || process.env.FLUTTERWAVE_CLIENT_ID || (clientId ? clientId.value() : '');

    let accessToken = null;

    // 1. Get V4 access token if client_id is available
    if (resolvedClientId && resolvedSecret) {
      try {
        const tokenRes = await fetch('https://api.flutterwave.com/v3/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: resolvedClientId,
            client_secret: resolvedSecret
          })
        });
        const tokenJson = await tokenRes.json();
        if (tokenJson.access_token) {
          accessToken = tokenJson.access_token;
        }
      } catch (err) {
        console.warn('Flutterwave V4 token exchange failed, attempting direct secret Bearer:', err);
      }
    }

    const authHeader = accessToken ? `Bearer ${accessToken}` : `Bearer ${resolvedSecret}`;
    const txRef = data.tx_ref || `tx-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const redirectBase = data.redirectBase || data.redirect_url || '';

    // 2. Create hosted checkout payment session
    const payRes = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: Number(data.amount),
        currency: data.currency || 'NGN',
        redirect_url: redirectBase ? (redirectBase.includes('http') ? redirectBase : `${redirectBase}/payment-success`) : undefined,
        customer: {
          email: data.email || 'customer@efado.com',
          name: data.name || 'EFADO Customer',
          phonenumber: data.phone || data.phonenumber || ''
        },
        meta: data.meta || {},
        customizations: data.customizations || {
          title: 'EFADO Ecosystem Checkout',
          description: data.purpose || 'Payment for EFADO service/order'
        }
      })
    });

    const result = await payRes.json();

    if (result.status === 'success' && result.data?.link) {
      return { 
        status: true,
        link: result.data.link,
        tx_ref: txRef
      };
    }

    throw new functions.https.HttpsError(
      'invalid-argument',
      result.message || 'Failed to initialize Flutterwave hosted checkout link'
    );
  }
);

// Initialize Firebase Admin SDK if needed
const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Firebase Cloud Function: initializeOpayPayment
 * Securely initializes an OPay Pay-In cashier session.
 * Uses process.env.OPAY_SECRET_KEY and process.env.OPAY_MERCHANT_ID on the server.
 * Never exposes secret keys to the client.
 */
exports.initializeOpayPayment = functions.https.onCall(
  { secrets: [opaySecretKey, opayMerchantId] },
  async (request) => {
    const data = request.data || request;
    const rawAmount = Number(data.amount) || 0;
    const userId = String(data.userId || '').trim();
    const domain = String(data.domain || process.env.APP_URL || 'https://e-fado.com').replace(/\/$/, '');

    if (!rawAmount || rawAmount <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Amount must be greater than 0.');
    }
    if (!userId) {
      throw new functions.https.HttpsError('invalid-argument', 'User ID is required to fund wallet.');
    }

    // Amount in kobo (1 NGN = 100 kobo)
    const amountInKobo = Math.round(rawAmount * 100);

    // Reference as unique timestamp plus userId
    const reference = `OPAY_${Date.now()}_${userId}`;

    // Callbacks as domain slash wallet
    const callbackUrl = `${domain}/wallet`;
    const returnUrl = `${domain}/wallet`;

    const secretKey = (process.env.OPAY_SECRET_KEY || (opaySecretKey ? opaySecretKey.value() : '') || '').trim();
    const merchantId = (process.env.OPAY_MERCHANT_ID || (opayMerchantId ? opayMerchantId.value() : '') || '').trim();

    // Test mode fallback simulation if live test keys are not active or configured with dummy value
    const isTestKey = !secretKey || secretKey === 'OPAY_SEC_TEST_KEY' || secretKey.startsWith('TEST_') || secretKey.length < 10;

    if (isTestKey) {
      console.warn('[OPay Cloud Function] Test mode simulation active for reference:', reference);
      // Record pending transaction in Firestore
      try {
        await db.collection('transactions').doc(`OPAY-${reference}`).set({
          userId,
          type: 'deposit',
          amount: rawAmount,
          currency: 'NGN',
          status: 'pending',
          reference,
          paymentGateway: 'opay',
          productName: 'Wallet Funding',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            mode: 'test_sandbox',
            amountInKobo
          }
        }, { merge: true });
      } catch (dbErr) {
        console.warn('[OPay Cloud Function] Pre-recording transaction note:', dbErr);
      }

      const testCashierUrl = `${callbackUrl}?opay_ref=${reference}&status=success&amount=${rawAmount}&userId=${encodeURIComponent(userId)}&simulated=true`;
      return {
        status: 'success',
        cashierUrl: testCashierUrl,
        reference,
        orderNo: `OPAY_ORD_${Date.now()}`,
        amount: rawAmount,
        currency: 'NGN',
        isTestMode: true
      };
    }

    try {
      const payload = {
        country: 'NG',
        reference,
        amount: String(amountInKobo),
        currency: 'NGN',
        returnUrl,
        callbackUrl,
        cancelUrl: `${domain}/wallet?status=cancelled`,
        expireAt: '30',
        productName: 'Wallet Funding',
        productDesc: 'EFADO Ecosystem Wallet Funding',
        userPhone: data.phone || data.userPhone || '+2348000000000',
        payMethod: 'BankCard,BankTransfer,OpayWallet',
        metadata: {
          userId,
          productName: 'Wallet Funding',
          service: 'EFADO Wallet'
        }
      };

      const response = await fetch('https://cashierapi.opayweb.com/api/v3/cashier/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'MerchantId': merchantId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.code === '00000' && result.data && result.data.cashierUrl) {
        // Record pending deposit in Firestore
        await db.collection('transactions').doc(`OPAY-${reference}`).set({
          userId,
          type: 'deposit',
          amount: rawAmount,
          currency: 'NGN',
          status: 'pending',
          reference,
          orderNo: result.data.orderNo || '',
          paymentGateway: 'opay',
          productName: 'Wallet Funding',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            cashierUrl: result.data.cashierUrl,
            amountInKobo
          }
        }, { merge: true });

        return {
          status: 'success',
          cashierUrl: result.data.cashierUrl,
          reference,
          orderNo: result.data.orderNo,
          amount: rawAmount
        };
      } else {
        console.error('[OPay Cloud Function] OPay initialization error:', result);
        throw new functions.https.HttpsError(
          'failed-precondition',
          result.message || 'OPay could not generate cashier URL.'
        );
      }
    } catch (err) {
      console.error('[OPay Cloud Function] Exception during initialize:', err);
      throw new functions.https.HttpsError('internal', err.message || 'Connection error to OPay API');
    }
  }
);

/**
 * Firebase Cloud Function: opayWebhook
 * Path: api/opay/webhook
 * Receives OPay callback, verifies payment with OPay status API using OPAY_SECRET_KEY,
 * and updates user wallet balance in Firestore with atomic increment.
 */
exports.opayWebhook = functions.https.onRequest(
  { secrets: [opaySecretKey, opayMerchantId] },
  async (req, res) => {
    if (req.method === 'GET') {
      return res.status(200).json({ status: 'active', message: 'OPay Webhook Listener Online' });
    }

    const payload = req.body || {};
    const secretKey = (process.env.OPAY_SECRET_KEY || (opaySecretKey ? opaySecretKey.value() : '') || '').trim();
    const merchantId = (process.env.OPAY_MERCHANT_ID || (opayMerchantId ? opayMerchantId.value() : '') || '').trim();

  const reference = payload.reference || payload.orderNo || payload.data?.reference || payload.data?.orderNo;
  const status = payload.status || payload.data?.status;
  const amountInKobo = Number(payload.amount || payload.data?.amount || 0);
  const amountNGN = amountInKobo > 1000 ? amountInKobo / 100 : amountInKobo;

  console.log('[OPay Webhook] Incoming callback event for reference:', reference, 'Status:', status);

  if (!reference) {
    return res.status(400).json({ code: '400', message: 'Missing transaction reference' });
  }

  // Verify payment status with OPay Status API using Secret Key
  let isVerified = false;
  let verifiedAmountNGN = amountNGN;

  if (secretKey && secretKey !== 'OPAY_SEC_TEST_KEY') {
    try {
      const verifyRes = await fetch('https://cashierapi.opayweb.com/api/v3/cashier/status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'MerchantId': merchantId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reference })
      });
      const verifyData = await verifyRes.json();
      console.log('[OPay Webhook] Status query verification response:', verifyData);

      if (verifyData.code === '00000' && (verifyData.data?.status === 'SUCCESS' || verifyData.data?.status === 'SUCCESSFUL')) {
        isVerified = true;
        const respKobo = Number(verifyData.data.amount || 0);
        if (respKobo > 0) verifiedAmountNGN = respKobo / 100;
      }
    } catch (statusErr) {
      console.error('[OPay Webhook] Failed to query OPay status API:', statusErr);
    }
  } else {
    // Test mode fallback verification
    if (status === 'SUCCESS' || status === 'SUCCESSFUL' || payload.event === 'charge.success' || payload.simulated) {
      isVerified = true;
    }
  }

  if (isVerified) {
    try {
      const txId = `OPAY-${reference}`;
      const txDocRef = db.collection('transactions').doc(txId);
      const existingTx = await txDocRef.get();

      if (existingTx.exists && existingTx.data().status === 'completed') {
        console.log(`[OPay Webhook] Transaction ${txId} already completed. Ignoring duplicate callback.`);
        return res.status(200).json({ code: '00000', message: 'Transaction already processed' });
      }

      // Extract userId from reference format OPAY_{timestamp}_{userId}
      let targetUserId = '';
      if (existingTx.exists && existingTx.data().userId) {
        targetUserId = existingTx.data().userId;
      } else {
        const parts = reference.split('_');
        if (parts.length >= 3) {
          targetUserId = parts.slice(2).join('_');
        }
      }

      if (targetUserId && verifiedAmountNGN > 0) {
        // Update user wallet balance in Firestore
        const userRef = db.collection('users').doc(targetUserId);
        await userRef.update({
          depositWallet: admin.firestore.FieldValue.increment(verifiedAmountNGN),
          playerWallet: admin.firestore.FieldValue.increment(verifiedAmountNGN)
        });

        // Record completed transaction
        await txDocRef.set({
          userId: targetUserId,
          type: 'deposit',
          amount: verifiedAmountNGN,
          currency: 'NGN',
          status: 'completed',
          reference,
          paymentGateway: 'opay',
          productName: 'Wallet Funding',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            method: 'OPay Pay-In Gateway',
            amountInKobo: Math.round(verifiedAmountNGN * 100)
          }
        }, { merge: true });

        console.log(`[OPay Webhook] User ${targetUserId} credited successfully with ₦${verifiedAmountNGN.toLocaleString()} (Ref: ${reference})`);
      }

      return res.status(200).json({ code: '00000', message: 'SUCCESSFUL' });
    } catch (dbErr) {
      console.error('[OPay Webhook] Firestore update error:', dbErr);
      return res.status(500).json({ code: '500', message: 'Database processing error' });
    }
  }

  return res.status(200).json({ code: '00000', message: 'Webhook received, not credited' });
});

