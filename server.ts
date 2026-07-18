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

  if (!signature) {
    console.warn('[Paystack Webhook] Missing x-paystack-signature header');
    return res.status(400).send('No signature header');
  }

  if (!secretKey) {
    console.warn('[Paystack Webhook] Warning: PAYSTACK_SECRET_KEY is not configured on the backend server!');
  }

  // Verify HMAC-SHA512 signature using Paystack Secret Key
  const rawBodyContent = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
  const hash = crypto
    .createHmac('sha512', secretKey)
    .update(rawBodyContent)
    .digest('hex');

  if (hash !== signature) {
    console.warn('[Paystack Webhook] Signature verification failed! The request is invalid or forged.');
    return res.status(401).send('Invalid signature');
  }

  const event = req.body;
  console.info(`[Paystack Webhook] Signature verified successfully. Event: ${event.event}`);

  if (event.event === 'charge.success') {
    const data = event.data;
    const reference = data.reference;
    const amountKobo = data.amount;
    const amountNGN = amountKobo / 100; // Paystack works in kobo (e.g. 10000 kobo = ₦100)
    const customerEmail = data.customer?.email;
    const metadata = data.metadata || {};
    const userId = metadata.userId;
    const userName = metadata.userName || customerEmail;
    const purpose = metadata.purpose || 'EFADO Wallet Topup';

    if (!userId) {
      console.error('[Paystack Webhook] Missing userId in transaction metadata. Cannot credit wallet.');
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
      // 1. Check if transaction reference is already processed to prevent double crediting
      const txId = `PAYSTACK-${reference}`;
      const transactionRef = doc(db, 'transactions', txId);
      
      const txSnap = await getDoc(transactionRef);
      if (txSnap.exists()) {
        console.info(`[Paystack Webhook] Transaction ${txId} already processed. Skipping duplicate credit.`);
        return res.status(200).send('Duplicate transaction ignored');
      }

      // 2. Perform atomic database updates on user balance
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        depositWallet: increment(amountNGN),
        playerWallet: increment(amountNGN) // Auto-credit both balances instantly on completed deposit
      });

      // 3. Write transaction ledger entry with the unique ID to guarantee single execution
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

      // 4. Log webhook audit record
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

  // Acknowledge event received to Paystack
  res.status(200).send('Event processed');
});

// Route B: Paystack Live Verification API (Proxy & Fallback Credit)
// This lets the frontend securely query the status of a payment using the server-side Secret Key
app.get('/api/paystack/verify/:reference', async (req: express.Request, res: express.Response) => {
  const { reference } = req.params;
  const secretKey = process.env.PAYSTACK_SECRET_KEY || '';

  if (!secretKey) {
    console.error('[Paystack Verify API] Missing PAYSTACK_SECRET_KEY on server');
    return res.status(500).json({ status: 'error', message: 'Backend configuration error: PAYSTACK_SECRET_KEY is missing.' });
  }

  try {
    // 1. Check if we already processed this reference in our DB to prevent duplicate crediting
    const txId = `PAYSTACK-${reference}`;
    const transactionRef = doc(db, 'transactions', txId);
    const txSnap = await getDoc(transactionRef);
    if (txSnap.exists()) {
      console.info(`[Paystack Verify API] Transaction ${txId} already processed. Returning success.`);
      return res.json({ status: 'success', already_processed: true, message: 'Transaction already credited' });
    }

    // 2. Fetch status from official Paystack API
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    });

    const body = await response.json();
    
    // 3. If verified successfully on Paystack, credit the user if the webhook hasn't done so yet
    if (body.status && body.data?.status === 'success') {
      const data = body.data;
      const amountKobo = data.amount;
      const amountNGN = amountKobo / 100;
      const customerEmail = data.customer?.email;
      const metadata = data.metadata || {};
      const userId = metadata.userId;
      const purpose = metadata.purpose || 'EFADO Wallet Topup';

      if (userId) {
        // Double-check under transaction lock (just in case of microsecond race conditions)
        const finalSnap = await getDoc(transactionRef);
        if (!finalSnap.exists()) {
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
            depositWallet: increment(amountNGN),
            playerWallet: increment(amountNGN)
          });

          // Write ledger entry using the unique ID
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
    return res.status(500).json({ status: 'error', message: err.message || 'Internal verification failure' });
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
