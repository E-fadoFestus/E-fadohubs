import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { amount, email, userId, name, phone, channel } = req.body || {};

    if (!amount || !userId) {
      return res.status(400).json({ success: false, message: 'amount and userId required' });
    }

    const numAmount = Number(amount);
    const tx_ref = `EFADO_${Date.now()}_${String(userId).substring(0, 6)}`;
    const userEmail = (email || 'user@efado.com').trim();
    const targetUserId = String(userId).trim();

    let flwSecret = (
      process.env.FLWSECK_LIVE ||
      process.env.FLUTTERWAVE_SECRET_KEY ||
      process.env.FLW_SECRET_KEY ||
      ''
    ).trim();

    if (flwSecret.includes('=')) {
      flwSecret = flwSecret.split('=').pop()?.trim() || '';
    }
    flwSecret = flwSecret.replace(/['";]/g, '').trim();

    const publicKey = (
      process.env.VITE_FLUTTERWAVE_PUBLIC_KEY ||
      process.env.VITE_FLUTTERWAVE_CLIENT_ID ||
      ''
    ).trim();

    const appUrl = (process.env.APP_URL || 'https://www.e-fado.com').replace(/\/$/, '');
    const redirectUrl = `${appUrl}/payment/flutterwave-callback?tx_ref=${encodeURIComponent(tx_ref)}&userId=${encodeURIComponent(targetUserId)}`;

    let paymentLink = '';

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
              name: name || userEmail.split('@')[0] || 'EFADO User',
              phonenumber: phone || ''
            },
            customizations: {
              title: 'EFADO Market Hubs',
              description: `Fund ₦${numAmount} to EFADO Wallet`,
              logo: `${appUrl}/efado_logo_192.jpg`
            },
            meta: { userId: targetUserId }
          })
        });
        const flwData = await flwRes.json() as any;
        if (flwData.status === 'success' && flwData.data?.link) {
          paymentLink = flwData.data.link;
        }
      } catch (e) {
        console.warn('Flutterwave call failed', e);
      }
    }

    if (!paymentLink) {
      paymentLink = `https://checkout.flutterwave.com/v3/hosted/pay?tx_ref=${encodeURIComponent(tx_ref)}&amount=${numAmount}&currency=NGN&email=${encodeURIComponent(userEmail)}`;
    }

    return res.status(200).json({
      success: true,
      tx_ref,
      amount: numAmount,
      currency: 'NGN',
      email: userEmail,
      publicKey,
      link: paymentLink,
      channels: ['card', 'banktransfer', 'opay', 'ussd', 'account', 'qr'],
      message: 'Transaction initialized'
    });

  } catch (error: any) {
    console.error('Initialize error', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error in initialize' });
  }
}
