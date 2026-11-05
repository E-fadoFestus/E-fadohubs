import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, verif-hash');

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
    if (isNaN(numAmount) || numAmount < 100) {
      return res.status(400).json({ success: false, message: 'Minimum deposit amount is ₦100' });
    }

    const tx_ref = `EFADO_${Date.now()}_${String(userId).substring(0, 6)}`;
    const userEmail = (email || 'user@efado.com').trim();
    const targetUserId = String(userId).trim();

    // Clean and normalize keys
    const cleanKey = (k?: string) => (k || '').trim().replace(/['";`\s]/g, '').split('=').pop()?.trim() || '';

    const flwSecret = cleanKey(
      process.env.FLUTTERWAVE_CLIENT_SECRET ||
      process.env.FLWSECK_LIVE ||
      process.env.FLUTTERWAVE_SECRET_KEY ||
      process.env.FLW_SECRET_KEY ||
      process.env.FLWSECK ||
      ''
    );

    const clientId = cleanKey(
      process.env.FLUTTERWAVE_CLIENT_ID ||
      process.env.VITE_FLUTTERWAVE_CLIENT_ID ||
      process.env.VITE_FLUTTERWAVE_PUBLIC_KEY ||
      process.env.VITE_FLW_PUBLIC_KEY ||
      ''
    );

    const appUrl = (process.env.APP_URL || 'https://www.e-fado.com').replace(/\/$/, '');
    const redirectUrl = `${appUrl}/payment/flutterwave-callback?tx_ref=${encodeURIComponent(tx_ref)}&userId=${encodeURIComponent(targetUserId)}&amount=${numAmount}`;

    if (!flwSecret) {
      console.error('[Flutterwave V4 Init] Missing FLUTTERWAVE_CLIENT_SECRET in server environment');
      return res.status(500).json({
        success: false,
        message: 'FLUTTERWAVE_CLIENT_SECRET is missing in server environment. Please configure it in Vercel settings.',
        hint: 'Add FLUTTERWAVE_CLIENT_SECRET or FLWSECK_LIVE in Vercel Environment Variables'
      });
    }

    console.info(`[Flutterwave V4 Init] Initiating payment call to api.flutterwave.com: Amount=₦${numAmount}, Ref=${tx_ref}, User=${targetUserId}`);

    // Call Flutterwave V4 / V3 Standard Payments API
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 14000);

    let flwRes: Response;
    let flwData: any;

    try {
      flwRes = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${flwSecret}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
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
        }),
        signal: controller.signal
      });

      flwData = await flwRes.json();
    } catch (fetchErr: any) {
      if (fetchErr.name === 'AbortError') {
        console.error('[Flutterwave V4 Init] Timeout after 14s connecting to api.flutterwave.com');
        return res.status(504).json({
          success: false,
          message: 'Flutterwave API connection timed out. Please try again.'
        });
      }
      throw fetchErr;
    } finally {
      clearTimeout(timeout);
    }

    console.info(`[Flutterwave V4 Init] Response status=${flwRes.status}:`, JSON.stringify(flwData));

    if (flwData?.status === 'success' && flwData?.data?.link) {
      const paymentLink = flwData.data.link;

      return res.status(200).json({
        success: true,
        tx_ref,
        amount: numAmount,
        currency: 'NGN',
        email: userEmail,
        publicKey: clientId,
        link: paymentLink,
        channels: ['card', 'banktransfer', 'opay', 'ussd', 'account', 'qr'],
        message: 'Payment link generated successfully'
      });
    }

    // Flutterwave rejected the request or returned an error
    console.error('[Flutterwave V4 Init] Flutterwave returned non-success:', flwData);
    return res.status(400).json({
      success: false,
      message: flwData?.message || 'Flutterwave failed to generate payment link. Please check your credentials.',
      details: flwData
    });

  } catch (error: any) {
    console.error('[Flutterwave V4 Init Crash]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error in initialize',
      error: String(error)
    });
  }
}
