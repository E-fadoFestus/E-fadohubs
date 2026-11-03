import { db } from '../../src/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

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

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed. Use POST.' });
  }

  try {
    const payload = req.method === 'POST' ? req.body || {} : req.query || {};
    const { amount, email, userId, channel = 'ALL', name, phone } = payload;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'A positive numeric amount is required' });
    }

    // 1. Create tx_ref EFADO+Date.now()
    const tx_ref = payload.tx_ref || `EFADO+${Date.now()}`;
    const userEmail = (email || 'customer@efado.com').trim();
    const targetUserId = (userId || userEmail).trim();

    // 2. Save to pendingPayments in Firestore
    const pendingPaymentRef = doc(db, 'pendingPayments', tx_ref);
    await setDoc(pendingPaymentRef, {
      tx_ref,
      amount: numAmount,
      email: userEmail,
      userId: targetUserId,
      name: name || '',
      phone: phone || '',
      channel: (channel || 'ALL').toUpperCase(),
      currency: 'NGN',
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    // Also pre-record in deposits collection for system compatibility
    try {
      const depositRef = doc(db, 'deposits', tx_ref);
      await setDoc(depositRef, {
        tx_ref,
        amount: numAmount,
        email: userEmail,
        userId: targetUserId,
        channel: 'ALL',
        currency: 'NGN',
        status: 'pending',
        createdAt: serverTimestamp()
      }, { merge: true });
    } catch (_) {}

    const publicKey = (
      process.env.VITE_FLUTTERWAVE_PUBLIC_KEY || 
      process.env.VITE_FLUTTERWAVE_CLIENT_ID || 
      process.env.FLUTTERWAVE_CLIENT_ID || 
      'FLWPUBK_TEST-9382f7e028b171f11e998c7602058ba3-X'
    ).trim();

    return res.status(200).json({
      success: true,
      status: 'success',
      message: 'Payment initialized successfully',
      tx_ref,
      amount: numAmount,
      currency: 'NGN',
      email: userEmail,
      userId: targetUserId,
      channel: (channel || 'ALL').toUpperCase(),
      publicKey
    });
  } catch (err: any) {
    console.error('[API payments/initialize Error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Initialization error' });
  }
}
