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

    // Step 1: Obtain V4 OAuth2 Access Token
    const tokenController = new AbortController();
    const tokenTimeout = setTimeout(() => tokenController.abort(), 10000);

    let tokenData: any;
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

      tokenData = await tokenRes.json();

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

    const accessToken = tokenData.access_token;

    // Step 2: Create Hosted Checkout / Payment Link using Bearer Access Token
    const payController = new AbortController();
    const payTimeout = setTimeout(() => payController.abort(), 14000);

    const paymentPayload = {
      tx_ref,
      amount: numAmount,
      currency: 'NGN',
      redirect_url: redirectUrl,
      payment_options: 'card,banktransfer,opay,ussd,account',
      customer: {
        email: userEmail,
        name: name || userEmail.split('@')[0] || 'EFADO Valued Member',
        phone_number: phone || ''
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
    };

    let flwRes: Response;
    let flwData: any;

    try {
      flwRes = await fetch('https://api.flutterwave.com/v4/payment-links', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(paymentPayload),
        signal: payController.signal
      });

      // Fallback if /v4/payment-links is routed at /payment-links
      if (flwRes.status === 404) {
        flwRes = await fetch('https://api.flutterwave.com/payment-links', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(paymentPayload),
          signal: payController.signal
        });
      }

      flwData = await flwRes.json();
    } catch (fetchErr: any) {
      if (fetchErr.name === 'AbortError') {
        console.error('[Flutterwave V4 Hosted Link Timeout]');
        return res.status(504).json({
          success: false,
          message: 'Flutterwave V4 API connection timed out. Please try again.'
        });
      }
      throw fetchErr;
    } finally {
      clearTimeout(payTimeout);
    }

    console.info(`[Flutterwave V4 Payment-Links] Response status=${flwRes.status}:`, JSON.stringify(flwData));

    // Extract hosted checkout link
    const paymentLink =
      flwData?.data?.link ||
      flwData?.data?.checkout_url ||
      flwData?.data?.redirect_url ||
      flwData?.link ||
      flwData?.checkout_url ||
      flwData?.redirect_url ||
      flwData?.next_action?.redirect_url?.url ||
      flwData?.next_action?.url;

    if (flwRes.ok && paymentLink) {
      return res.status(200).json({
        success: true,
        tx_ref,
        amount: numAmount,
        currency: 'NGN',
        email: userEmail,
        publicKey: clientId,
        link: paymentLink,
        channels: ['card', 'banktransfer', 'opay', 'ussd', 'account', 'qr'],
        message: 'Payment link generated successfully via Flutterwave V4'
      });
    }

    // Return real error from Flutterwave V4
    console.error('[Flutterwave V4 Error]:', flwData);
    return res.status(400).json({
      success: false,
      message: flwData?.message || flwData?.error_description || flwData?.error || 'Flutterwave V4 failed to create hosted payment link.',
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
