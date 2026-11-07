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

    // Clean and validate V4 credentials
    const cleanKey = (k?: string) => (k || '').trim().replace(/['";`\s]/g, '').split('=').pop()?.trim() || '';

    const clientId = cleanKey(process.env.FLUTTERWAVE_CLIENT_ID);
    const clientSecret = cleanKey(process.env.FLUTTERWAVE_CLIENT_SECRET);

    if (!clientId || !clientSecret) {
      console.error('[Flutterwave V4 Init] Missing FLUTTERWAVE_CLIENT_ID or FLUTTERWAVE_CLIENT_SECRET');
      return res.status(500).json({
        success: false,
        message: 'FLUTTERWAVE_CLIENT_ID or FLUTTERWAVE_CLIENT_SECRET missing in server environment. Please configure both in Vercel settings.'
      });
    }

    const appUrl = (process.env.APP_URL || 'https://www.e-fado.com').replace(/\/$/, '');
    const redirectUrl = `${appUrl}/payment/flutterwave-callback?tx_ref=${encodeURIComponent(tx_ref)}&userId=${encodeURIComponent(targetUserId)}&amount=${numAmount}`;

    // Step 1: Obtain V4 OAuth2 Access Token from IDP
    const tokenController = new AbortController();
    const tokenTimeout = setTimeout(() => tokenController.abort(), 10000);

    let tokenData: any = {};
    try {
      const tokenBody = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      }).toString();

      const tokenRes = await fetch('https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: tokenBody,
        signal: tokenController.signal
      });

      const rawTokenText = await tokenRes.text();
      try {
        tokenData = rawTokenText ? JSON.parse(rawTokenText) : {};
      } catch {
        tokenData = { raw: rawTokenText };
      }

      if (!tokenRes.ok || !tokenData?.access_token) {
        console.error('[Flutterwave V4 Token Error]:', tokenData);
        return res.status(502).json({
          success: false,
          message: tokenData?.error_description || tokenData?.error || 'Failed to obtain Flutterwave V4 access token. Check Client ID and Client Secret.',
          details: tokenData
        });
      }
    } catch (tokenErr: any) {
      console.error('[Flutterwave V4 Token Fetch Failed]:', tokenErr);
      return res.status(502).json({
        success: false,
        message: tokenErr.name === 'AbortError' ? 'Timeout connecting to Flutterwave V4 Token IDP' : (tokenErr.message || 'Could not connect to Flutterwave V4 Token IDP')
      });
    } finally {
      clearTimeout(tokenTimeout);
    }

    // Step 2: Build Hosted Checkout with verified V4 Client ID
    // Flutterwave V4 has no hosted payment-links API endpoint.
    // Standard hosted checkout uses Flutterwave's secure hosted pay gateway with your V4 Client ID.
    const hostedPayParams = new URLSearchParams({
      public_key: clientId,
      tx_ref: tx_ref,
      amount: String(numAmount),
      currency: 'NGN',
      payment_options: 'card,banktransfer,opay,ussd,account',
      redirect_url: redirectUrl,
      'customer[email]': userEmail,
      'customer[name]': name || userEmail.split('@')[0] || 'EFADO Valued Member',
      'customer[phonenumber]': phone || '',
      'customizations[title]': 'EFADO Market Hubs Central Processor',
      'customizations[description]': `Fund ₦${numAmount.toLocaleString()} to EFADO Sovereign Wallet`,
      'customizations[logo]': `${appUrl}/efado_logo_192.jpg`,
      'meta[userId]': targetUserId,
      'meta[channel]': channel || 'ALL'
    });

    const hostedCheckoutLink = `https://checkout.flutterwave.com/v3/hosted/pay?${hostedPayParams.toString()}`;

    return res.status(200).json({
      success: true,
      tx_ref,
      amount: numAmount,
      currency: 'NGN',
      email: userEmail,
      publicKey: clientId,
      link: hostedCheckoutLink,
      channels: ['card', 'banktransfer', 'opay', 'ussd', 'account', 'qr'],
      message: 'Transaction initialized with Flutterwave V4 credentials'
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
