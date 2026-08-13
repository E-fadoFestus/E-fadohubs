import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { db } from './src/firebase';
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';

// Load environment variables in development
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = 3000;

// Capture raw body for secure Paystack signature verification
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));

// Route A: Paystack Webhook Handler
// Paystack will send POST requests here to securely notify of successful payments
app.post('/webhook/paystack', async (req: any, res: any) => {
  const signature = req.headers['x-paystack-signature'];
  const secretKey = process.env.PAYSTACK_SECRET_KEY || '';

  if (secretKey) {
    if (!signature) {
      console.warn('[Paystack Webhook] Missing x-paystack-signature header');
      return res.status(400).send('No signature header');
    }

    const rawBodyContent = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(rawBodyContent)
      .digest('hex');

    if (hash !== signature) {
      console.warn('[Paystack Webhook] Signature verification failed! The request is invalid or forged.');
      return res.status(401).send('Invalid signature');
    }
  } else {
    console.warn('[Paystack Webhook] Warning: PAYSTACK_SECRET_KEY is not configured on the backend server!');
  }

  const event = req.body;
  if (event) {
    const data = event.data || event;
    const reference = data.reference;
    const amountKobo = data.amount || 0;
    const amountNGN = amountKobo > 100000 ? amountKobo / 100 : (amountKobo || 1000);
    const customerEmail = data.customer?.email || data.email;
    const metadata = data.metadata || {};
    const userId = metadata.userId || metadata.user_id;
    const userName = metadata.userName || customerEmail;
    const purpose = metadata.purpose || metadata.service || 'EFADO Wallet Topup';

    if (reference && (event.event === 'charge.success' || event.status === 'success' || data.status === 'success')) {
      if (!userId) {
        console.error('[Paystack Webhook] Missing userId in transaction metadata. Cannot credit wallet automatically.');
        try {
          await addDoc(collection(db, 'unassigned_paystack_transactions'), {
            reference,
            amount: amountNGN,
            customerEmail,
            payload: data,
            timestamp: serverTimestamp()
          });
        } catch (e) {
          console.error('Failed to log unassigned transaction', e);
        }
        return res.status(200).json({ status: 'logged_unassigned' });
      }

      try {
        const txId = `PAYSTACK-${reference}`;
        const transactionRef = doc(db, 'transactions', txId);
        
        const txSnap = await getDoc(transactionRef);
        if (txSnap.exists()) {
          console.info(`[Paystack Webhook] Transaction ${txId} already processed. Skipping duplicate credit.`);
          return res.status(200).send('Duplicate transaction ignored');
        }

        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          depositWallet: increment(amountNGN),
          playerWallet: increment(amountNGN)
        });

        await setDoc(transactionRef, {
          userId,
          type: 'deposit',
          amount: amountNGN,
          currency: 'NGN',
          status: 'completed',
          reference,
          timestamp: serverTimestamp(),
          metadata: {
            gateway: 'paystack_webhook',
            purpose,
            email: customerEmail,
            method: 'Paystack Automated Webhook Integration'
          }
        });

        await addDoc(collection(db, 'paystack_webhook_logs'), {
          userId,
          userName,
          amount: amountNGN,
          purpose,
          status: 'SUCCESS_AUTO_CREDITED',
          timestamp: serverTimestamp(),
          gatewayRef: reference
        });

        console.info(`[Paystack Webhook] Successfully credited User ${userId} with ₦${amountNGN.toLocaleString()} (Ref: ${reference})`);
      } catch (err) {
        console.error('[Paystack Webhook] Error updating user wallet/ledger:', err);
        return res.status(500).send('Database update failed');
      }
    }
  }

  res.status(200).send('Event processed');
});

// Route B: Paystack Initialize Payment API (/pay & /api/paystack/initialize)
const handlePaystackInitialize = async (req: express.Request, res: express.Response) => {
  const { email, amount, userId, serviceType, purpose, callback_url } = req.body;

  if (!email || !amount) {
    return res.status(400).json({ status: false, message: 'Email and deposit amount are required.' });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY || '';
  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const callbackUrl = callback_url || `${appUrl}/payment/callback`;

  const numericAmount = Number(amount);
  const amountInKobo = numericAmount < 100000 ? Math.round(numericAmount * 100) : numericAmount;

  if (!secretKey) {
    console.warn('[Paystack Initialize API] PAYSTACK_SECRET_KEY is missing on server. Providing sandbox simulation checkout link.');
    const reference = `EFD_PST_SIM_${Math.floor(100000 + Math.random() * 900000)}_${Date.now()}`;
    return res.json({
      status: true,
      message: 'Sandbox Paystack session initialized',
      authorization_url: `${callbackUrl}?reference=${reference}&amount=${numericAmount}&simulated=true&userId=${encodeURIComponent(userId || '')}`,
      access_code: 'SIM_ACCESS_CODE',
      reference
    });
  }

  try {
    const reference = `EFD_PST_${Math.floor(100 + Math.random() * 900)}_${Date.now()}`;
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        reference,
        callback_url: callbackUrl,
        metadata: {
          userId: userId || '',
          userName: email,
          service: serviceType || 'game',
          purpose: purpose || 'EFADO Wallet Topup',
          website: 'e-fado.com'
        }
      })
    });

    const data = await response.json();
    if (data.status && data.data?.authorization_url) {
      return res.json({
        status: true,
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference: data.data.reference || reference
      });
    } else {
      console.error('[Paystack Initialize API] Paystack error response:', data);
      return res.status(400).json({ status: false, message: data.message || 'Could not initialize Paystack transaction session' });
    }
  } catch (err: any) {
    console.error('[Paystack Initialize API] Connection error:', err);
    return res.status(500).json({ status: false, message: err.message || 'Failed to connect to Paystack payment gateway' });
  }
};

app.post('/api/paystack/initialize', handlePaystackInitialize);
app.post('/pay', handlePaystackInitialize);

// Route C: Paystack Live Verification API (Proxy & Fallback Credit)
app.get('/api/paystack/verify/:reference', async (req: express.Request, res: express.Response) => {
  const { reference } = req.params;
  const userIdQuery = String(req.query.userId || '').trim();
  const secretKey = process.env.PAYSTACK_SECRET_KEY || '';

  try {
    const txId = `PAYSTACK-${reference}`;
    const transactionRef = doc(db, 'transactions', txId);
    const txSnap = await getDoc(transactionRef);

    if (txSnap.exists()) {
      console.info(`[Paystack Verify API] Transaction ${txId} already processed. Returning success.`);
      return res.json({ status: true, already_processed: true, message: 'Transaction already credited to wallet', data: { status: 'success', reference } });
    }

    if (!secretKey || reference.startsWith('EFD_PST_SIM_')) {
      const simAmount = Number(req.query.amount) || 1000;
      const targetUserId = userIdQuery;

      if (targetUserId) {
        const userRef = doc(db, 'users', targetUserId);
        await updateDoc(userRef, {
          depositWallet: increment(simAmount),
          playerWallet: increment(simAmount)
        });

        await setDoc(transactionRef, {
          userId: targetUserId,
          type: 'deposit',
          amount: simAmount,
          currency: 'NGN',
          status: 'completed',
          reference,
          timestamp: serverTimestamp(),
          metadata: {
            gateway: 'paystack_sandbox_verify',
            purpose: 'EFADO Wallet Topup',
            method: 'Paystack Sandbox Verification'
          }
        });
      }

      return res.json({
        status: true,
        data: {
          status: 'success',
          reference,
          amount: simAmount * 100,
          gateway_response: 'Successful (Sandbox Verified)'
        }
      });
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    });

    const body = await response.json();
    
    if (body.status && body.data?.status === 'success') {
      const data = body.data;
      const amountKobo = data.amount;
      const amountNGN = amountKobo / 100;
      const customerEmail = data.customer?.email;
      const metadata = data.metadata || {};
      const userId = metadata.userId || metadata.user_id || userIdQuery;
      const purpose = metadata.purpose || metadata.service || 'EFADO Wallet Topup';

      if (userId) {
        const finalSnap = await getDoc(transactionRef);
        if (!finalSnap.exists()) {
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
            depositWallet: increment(amountNGN),
            playerWallet: increment(amountNGN)
          });

          await setDoc(transactionRef, {
            userId,
            type: 'deposit',
            amount: amountNGN,
            currency: 'NGN',
            status: 'completed',
            reference,
            timestamp: serverTimestamp(),
            metadata: {
              gateway: 'paystack_verify_api',
              purpose,
              email: customerEmail,
              method: 'Paystack Secure Verification API Proxy'
            }
          });

          console.info(`[Paystack Verify API] Securely credited User ${userId} with ₦${amountNGN.toLocaleString()} (Ref: ${reference})`);
        }
      }
    }

    return res.status(response.status).json(body);
  } catch (err: any) {
    console.error(`[Paystack Verify API] Verification request failed for reference ${reference}:`, err);
    return res.status(500).json({ status: false, message: err.message || 'Internal verification failure' });
  }
});

// Route C: Real Bank Account Name Enquiry API (/api/bank/resolve)
app.get('/api/bank/resolve', async (req: express.Request, res: express.Response) => {
  const accountNumber = String(req.query.account_number || '').trim();
  const bankCode = String(req.query.bank_code || '').trim();
  const bankName = String(req.query.bank_name || '').trim();
  const clientSecretKey = String(req.query.secret_key || req.headers['x-secret-key'] || '').trim();

  if (!accountNumber || accountNumber.length < 10) {
    return res.status(400).json({ status: false, message: 'Account number must be at least 10 digits.' });
  }

  // Determine active keys (Server env or client provided secret key)
  let paystackSecret = process.env.PAYSTACK_SECRET_KEY || process.env.VITE_PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET || '';
  if (clientSecretKey && clientSecretKey.startsWith('sk_')) {
    paystackSecret = clientSecretKey;
  }

  let flwSecret = process.env.VITE_FLW_SECRET_KEY || process.env.FLW_SECRET_KEY || process.env.FLUTTERWAVE_SECRET_KEY || process.env.FLWSECK || '';
  if (clientSecretKey && (clientSecretKey.startsWith('FLWSECK') || clientSecretKey.length > 20)) {
    flwSecret = clientSecretKey;
  }

  // Normalize Bank Code for Paystack & Flutterwave
  let codeToTry = bankCode;
  if (!codeToTry || codeToTry === '000') {
    const bNameLower = bankName.toLowerCase();
    if (bNameLower.includes('gtb') || bNameLower.includes('guaranty')) codeToTry = '058';
    else if (bNameLower.includes('access')) codeToTry = '044';
    else if (bNameLower.includes('zenith')) codeToTry = '057';
    else if (bNameLower.includes('first bank') || bNameLower.includes('firstbank')) codeToTry = '011';
    else if (bNameLower.includes('kuda')) codeToTry = '50211';
    else if (bNameLower.includes('moniepoint')) codeToTry = '50515';
    else if (bNameLower.includes('opay')) codeToTry = '999992';
    else if (bNameLower.includes('palmpay')) codeToTry = '999991';
    else if (bNameLower.includes('uba') || bNameLower.includes('united bank')) codeToTry = '033';
    else if (bNameLower.includes('fcmb')) codeToTry = '214';
    else if (bNameLower.includes('stanbic')) codeToTry = '221';
    else if (bNameLower.includes('sterling')) codeToTry = '232';
    else if (bNameLower.includes('wema') || bNameLower.includes('alat')) codeToTry = '035';
    else if (bNameLower.includes('fidelity')) codeToTry = '070';
    else if (bNameLower.includes('providus')) codeToTry = '101';
  }

  // 1. Attempt Paystack Live Account Resolution
  if (paystackSecret && codeToTry && codeToTry !== '000') {
    try {
      console.info(`[Bank Resolve API] Querying Paystack NIBSS for Acc: ${accountNumber}, BankCode: ${codeToTry}`);
      const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(codeToTry)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${paystackSecret}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.status && data.data?.account_name) {
        console.info(`[Bank Resolve API] Paystack resolved real name: ${data.data.account_name}`);
        return res.json({
          status: true,
          account_name: data.data.account_name,
          account_number: accountNumber,
          bank_name: bankName || 'Verified Bank',
          resolved_via: 'Paystack Live Gateway'
        });
      }
    } catch (err) {
      console.warn('[Bank Resolve API] Paystack live API query failed:', err);
    }
  }

  // 2. Attempt Flutterwave Live Account Resolution
  let flwBankCode = codeToTry;
  if (codeToTry === '999992') flwBankCode = '100004'; // OPay in Flutterwave
  if (codeToTry === '999991') flwBankCode = '100033'; // PalmPay in Flutterwave
  if (codeToTry === '50211') flwBankCode = '090267'; // Kuda in Flutterwave

  if (flwSecret && flwBankCode && flwBankCode !== '000') {
    try {
      console.info(`[Bank Resolve API] Querying Flutterwave NIBSS for Acc: ${accountNumber}, BankCode: ${flwBankCode}`);
      const response = await fetch('https://api.flutterwave.com/v3/accounts/resolve', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${flwSecret}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account_number: accountNumber,
          account_bank: flwBankCode
        })
      });
      const data = await response.json();
      if (data.status === 'success' && data.data?.account_name) {
        console.info(`[Bank Resolve API] Flutterwave resolved real name: ${data.data.account_name}`);
        return res.json({
          status: true,
          account_name: data.data.account_name,
          account_number: accountNumber,
          bank_name: bankName || 'Verified Bank',
          resolved_via: 'Flutterwave Live Gateway'
        });
      }
    } catch (err) {
      console.warn('[Bank Resolve API] Flutterwave live API query failed:', err);
    }
  }

  // If live bank resolution could not verify account, report account verification failure
  return res.status(422).json({
    status: false,
    message: `Account verification failed: Destination bank could not verify account number ${accountNumber}. Please confirm your 10-digit account number and destination bank selection.`
  });
});

// Route D: Flutterwave Initialize Checkout Session
app.post('/api/flutterwave/initialize', async (req: express.Request, res: express.Response) => {
  const { email, amount, userId, purpose, callback_url, currency = 'NGN', customizations, secretKey: clientSecretKey, publicKey: clientPublicKey } = req.body;
  
  // Resolve active secret key from request body or backend environment
  let flwSecret = (
    clientSecretKey ||
    process.env.VITE_FLW_SECRET_KEY || 
    process.env.FLW_SECRET_KEY || 
    process.env.FLUTTERWAVE_SECRET_KEY || 
    process.env.FLWSECK || 
    ''
  ).trim();

  // If secret key wasn't explicitly set, but client passed a secret key in public key field (starts with FLWSECK)
  const clientPub = (clientPublicKey || process.env.VITE_FLW_PUBLIC_KEY || '').trim();
  if (!flwSecret && clientPub.toUpperCase().startsWith('FLWSECK')) {
    flwSecret = clientPub;
  }

  // Clean raw key strings (strip quotes/equals if user pasted whole env line)
  if (flwSecret.includes('=')) {
    flwSecret = flwSecret.split('=').pop()?.trim() || '';
  }
  flwSecret = flwSecret.replace(/['";]/g, '').trim();

  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const callbackUrl = callback_url || `${appUrl}/payment/flutterwave-callback`;
  const reference = `EFD_FLW_${Math.floor(100 + Math.random() * 900)}_${Date.now()}`;

  if (!flwSecret) {
    console.warn('[Flutterwave Init API] FLW Secret key is not configured on backend or client. Generating sandbox simulation URL.');
    return res.json({
      status: true,
      message: 'Sandbox Flutterwave session initialized',
      link: `${callbackUrl}?tx_ref=${reference}&status=successful&amount=${amount}&userId=${encodeURIComponent(userId || '')}`,
      tx_ref: reference,
      isSandbox: true
    });
  }

  try {
    console.info(`[Flutterwave Init API] Initializing live transaction via Flutterwave API using Secret Key (${flwSecret.substring(0, 10)}...)...`);
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${flwSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tx_ref: reference,
        amount: Number(amount),
        currency,
        redirect_url: callbackUrl,
        customer: {
          email: email || 'customer@efado.com',
          name: email || 'EFADO Valued Member'
        },
        meta: {
          userId: userId || '',
          purpose: purpose || 'EFADO Wallet Topup'
        },
        customizations: customizations || {
          title: 'EFADO Sovereign Payment Gateway',
          description: purpose || 'Instant EFADO Wallet Topup'
        }
      })
    });

    const data = await response.json();
    if (data.status === 'success' && data.data?.link) {
      return res.json({
        status: true,
        link: data.data.link,
        tx_ref: reference
      });
    } else {
      console.error('[Flutterwave Init API] Flutterwave rejected request:', data);
      return res.status(400).json({ 
        status: false, 
        message: data.message || 'Could not initialize Flutterwave payment session with current secret key.',
        details: data
      });
    }
  } catch (err: any) {
    console.error('[Flutterwave Init API] Exception:', err);
    return res.status(500).json({ status: false, message: err.message || 'Failed to connect to Flutterwave payment gateway' });
  }
});

// Route E: Flutterwave Real Live Bank Transfer / Payout API
app.post('/api/flutterwave/payout', async (req: express.Request, res: express.Response) => {
  const { account_bank, account_number, amount, narration, beneficiary_name, userId } = req.body;
  const flwSecret = process.env.VITE_FLW_SECRET_KEY || process.env.FLW_SECRET_KEY || process.env.FLUTTERWAVE_SECRET_KEY || process.env.FLWSECK || '';

  if (!account_number || !amount) {
    return res.status(400).json({ status: false, message: 'Account number and amount are required for payout.' });
  }

  const reference = `EFD_TRF_${Math.floor(100000 + Math.random() * 900000)}_${Date.now()}`;

  if (!flwSecret) {
    console.warn('[Flutterwave Payout API] FLW Secret key is missing on backend. Simulating live transfer.');
    return res.json({
      status: true,
      message: 'Payout queued successfully (Sandbox Simulation)',
      reference,
      data: {
        id: Math.floor(10000 + Math.random() * 90000),
        account_number,
        bank_code: account_bank,
        full_name: beneficiary_name || 'Beneficiary',
        amount: Number(amount),
        status: 'SUCCESSFUL',
        complete_message: 'Transfer processed in sandbox mode'
      }
    });
  }

  try {
    const response = await fetch('https://api.flutterwave.com/v3/transfers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${flwSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        account_bank: account_bank || '044',
        account_number,
        amount: Number(amount),
        narration: narration || 'EFADO Sovereign Cashout Transfer',
        currency: 'NGN',
        reference,
        callback_url: `${process.env.APP_URL || ''}/api/flutterwave/transfer-callback`
      })
    });

    const data = await response.json();
    if (data.status === 'success') {
      console.info(`[Flutterwave Payout API] Payout successfully dispatched for Acc: ${account_number}, Amount: NGN ${amount}, Ref: ${reference}`);
      return res.json({
        status: true,
        message: 'Payout transfer dispatched successfully via Flutterwave Live Gateway',
        reference,
        data: data.data
      });
    } else {
      console.error('[Flutterwave Payout API] Flutterwave Transfer failed:', data);
      return res.status(400).json({ status: false, message: data.message || 'Flutterwave Transfer execution failed' });
    }
  } catch (err: any) {
    console.error('[Flutterwave Payout API] Exception:', err);
    return res.status(500).json({ status: false, message: err.message || 'Failed to dispatch transfer via Flutterwave API' });
  }
});

// Route F: Flutterwave Subaccount Creation Proxy
app.post('/api/flutterwave/subaccount', async (req: express.Request, res: express.Response) => {
  const flwSecret = process.env.VITE_FLW_SECRET_KEY || process.env.FLW_SECRET_KEY || process.env.FLUTTERWAVE_SECRET_KEY || process.env.FLWSECK || '';

  if (!flwSecret) {
    const simId = `FLW_SUB_SIM_${Math.floor(100000 + Math.random() * 900000)}`;
    return res.json({
      status: 'success',
      data: {
        id: simId,
        account_number: req.body.account_number,
        business_name: req.body.business_name,
        split_value: req.body.split_value || 95
      }
    });
  }

  try {
    const response = await fetch('https://api.flutterwave.com/v3/subaccounts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${flwSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        account_bank: req.body.account_bank,
        account_number: req.body.account_number,
        business_name: req.body.business_name,
        business_email: req.body.business_email,
        business_contact: req.body.business_contact || '',
        country: req.body.country || 'NG',
        split_type: req.body.split_type || 'percentage',
        split_value: req.body.split_value ?? 95
      })
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err: any) {
    return res.status(500).json({ status: false, message: err.message || 'Subaccount creation request failed' });
  }
});

// Start server with Vite middleware support
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[EFADO Fullstack Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
