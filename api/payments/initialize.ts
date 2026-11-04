import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

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
    const { amount, email, userId, channel, name, phone } = req.body || {};

    if (!amount || !userId) {
      return res.status(400).json({ success: false, message: 'amount and userId required' });
    }

    const numAmount = Number(amount);
    const tx_ref = `EFADO_${Date.now()}_${String(userId).substring(0, 6)}`;
    const userEmail = (email || 'user@efado.com').trim();
    const targetUserId = String(userId).trim();

    // Flutterwave V4 / Live Secret Key
    let flwSecret = (
      process.env.FLWSECK_LIVE ||
      process.env.FLUTTERWAVE_CLIENT_SECRET ||
      process.env.FLUTTERWAVE_SECRET_KEY ||
      process.env.FLW_SECRET_KEY ||
      process.env.FLWSECK ||
      ''
    ).trim();

    if (flwSecret.includes('=')) {
      flwSecret = flwSecret.split('=').pop()?.trim() || '';
    }
    flwSecret = flwSecret.replace(/['";]/g, '').trim();

    // Resolve public key / V4 Client ID
    const publicKey = (
      process.env.VITE_FLUTTERWAVE_PUBLIC_KEY ||
      process.env.VITE_FLUTTERWAVE_CLIENT_ID ||
      process.env.VITE_FLW_PUBLIC_KEY ||
      process.env.FLUTTERWAVE_CLIENT_ID ||
      ''
    ).trim();

    const appUrl = (process.env.APP_URL || 'https://e-fado.com').replace(/\/$/, '');
    const redirectUrl = `${appUrl}/payment/flutterwave-callback?tx_ref=${encodeURIComponent(tx_ref)}&userId=${encodeURIComponent(targetUserId)}&amount=${numAmount}`;

    let paymentLink = '';

    // V4 initialize: call https://api.flutterwave.com/v3/payments with Bearer FLWSECK_LIVE
    if (flwSecret) {
      try {
        const flwRes = await fetch('https://api.flutterwave.com/v3/payments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${flwSecret}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tx_ref,
            amount: String(numAmount),
            currency: 'NGN',
            redirect_url: redirectUrl,
            payment_options: 'card,banktransfer,opay,ussd,account,qr',
            customer: {
              email: userEmail,
              name: name || userEmail.split('@')[0] || 'EFADO Valued Member',
              phonenumber: phone || ''
            },
            customizations: {
              title: 'EFADO Market Hubs Central Processor',
              description: `Fund ₦${numAmount.toLocaleString()} to EFADO Sovereign Wallet`,
              logo: `${appUrl}/efado_logo_192.jpg`
            },
            meta: {
              userId: targetUserId,
              email: userEmail,
              channel: channel || 'ALL'
            }
          })
        });

        const flwData = await flwRes.json();
        if (flwData.status === 'success' && flwData.data?.link) {
          paymentLink = flwData.data.link;
        } else {
          console.warn('[Payments Initialize V4] Gateway message:', flwData?.message || flwData);
        }
      } catch (callErr) {
        console.warn('[Payments Initialize V4] Fetch error to api.flutterwave.com:', callErr);
      }
    }

    // Default V4 hosted pay link if direct call was skipped or offline
    if (!paymentLink) {
      paymentLink = `https://checkout.flutterwave.com/v3/hosted/pay?tx_ref=${encodeURIComponent(tx_ref)}&amount=${numAmount}&currency=NGN&email=${encodeURIComponent(userEmail)}`;
    }

    // Record pending payment in Firestore
    try {
      const pendingPaymentRef = doc(db, 'pendingPayments', tx_ref);
      await setDoc(pendingPaymentRef, {
        tx_ref,
        amount: numAmount,
        email: userEmail,
        userId: targetUserId,
        channel: channel || 'ALL',
        currency: 'NGN',
        status: 'pending',
        link: paymentLink,
        createdAt: serverTimestamp()
      }, { merge: true });
    } catch (dbErr) {
      console.warn('[Payments Initialize V4] Firestore pending write warning:', dbErr);
    }

    return res.status(200).json({
      success: true,
      tx_ref,
      amount: numAmount,
      currency: 'NGN',
      email: userEmail,
      publicKey,
      channels: ['card', 'banktransfer', 'opay', 'ussd', 'account', 'qr'],
      link: paymentLink,
      message: 'Transaction initialized'
    });

  } catch (error: any) {
    console.error('Initialize error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error in initialize',
      error: String(error)
    });
  }
}
