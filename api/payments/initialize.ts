import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServerDb, getServerTimestamp } from '../../src/lib/server-firestore';

const cleanKey = (k?: string) =>
  (k || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/[;\s]/g, '');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, verif-hash');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, status: false, message: 'Method not allowed' });
  }

  try {
    const { amount, email, userId, name, phone, channel, tx_ref: customRef, meta, customizations, redirect_url } =
      req.body || {};

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount < 100) {
      return res.status(400).json({ success: false, status: false, message: 'Minimum deposit amount is ₦100' });
    }

    const targetUserId = String(userId || meta?.userId || 'guest').trim();
    const userEmail = String(email || `${targetUserId}@efado.com`).trim().toLowerCase();
    const tx_ref = String(customRef || `EFADO_${Date.now()}_${targetUserId.substring(0, 6)}`).trim();

    const originHeader = req.headers.origin as string | undefined;
    const forwardedHost = (req.headers['x-forwarded-host'] || req.headers.host) as string | undefined;
    const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
    const baseAppUrl = (
      originHeader ||
      (forwardedHost ? `${proto}://${forwardedHost}` : '') ||
      process.env.APP_URL ||
      'https://www.e-fado.com'
    ).replace(/\/$/, '');

    const callbackUrl =
      redirect_url ||
      `${baseAppUrl}/payment/flutterwave-callback?tx_ref=${encodeURIComponent(tx_ref)}&userId=${encodeURIComponent(targetUserId)}&amount=${numAmount}`;

    const clientId = cleanKey(
      process.env.FLUTTERWAVE_CLIENT_ID ||
        process.env.VITE_FLUTTERWAVE_CLIENT_ID ||
        process.env.FLW_PUBLIC_KEY ||
        process.env.VITE_FLW_PUBLIC_KEY ||
        process.env.FLWPUBK_LIVE ||
        process.env.FLUTTERWAVE_PUBLIC_KEY
    );

    const v3Secret = cleanKey(
      process.env.FLWSECK_LIVE ||
        process.env.FLW_SECRET_KEY ||
        process.env.FLUTTERWAVE_SECRET_KEY ||
        process.env.FLWSECK
    );

    const v4Secret = cleanKey(process.env.FLUTTERWAVE_CLIENT_SECRET);
    const activeSecret = v3Secret || v4Secret;

    if (!activeSecret && !clientId) {
      return res.status(500).json({
        success: false,
        status: false,
        message: 'Flutterwave keys missing in Vercel environment (configure FLWSECK_LIVE/FLW_SECRET_KEY or FLUTTERWAVE_CLIENT_ID + FLUTTERWAVE_CLIENT_SECRET).'
      });
    }

    let paymentLink = '';

    // 1. Primary V3 Standard Payments API when a V3 secret key (or secret bearer) is configured
    if (v3Secret || (activeSecret && activeSecret.startsWith('FLWSECK'))) {
      try {
        const flwRes = await fetch('https://api.flutterwave.com/v3/payments', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${v3Secret || activeSecret}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tx_ref,
            amount: String(numAmount),
            currency: 'NGN',
            redirect_url: callbackUrl,
            payment_options: 'card,banktransfer,opay,ussd,account,qr',
            customer: {
              email: userEmail,
              name: name || userEmail.split('@')[0] || 'EFADO Member',
              phonenumber: phone || ''
            },
            customizations: {
              title: customizations?.title || 'EFADO Market Hubs Central Processor',
              description: customizations?.description || `Fund ₦${numAmount.toLocaleString()} to EFADO Wallet`,
              logo: customizations?.logo || `${baseAppUrl}/efado_logo_192.jpg`
            },
            meta: {
              ...(meta || {}),
              userId: targetUserId,
              email: userEmail,
              channel: channel || 'ALL'
            }
          })
        });

        const flwData = await flwRes.json().catch(() => null);
        if (flwData?.status === 'success' && flwData?.data?.link) {
          paymentLink = flwData.data.link;
        } else {
          console.warn('[Vercel Flutterwave V3 Init Notice]:', flwData?.message || flwData);
        }
      } catch (v3Err: any) {
        console.warn('[Vercel Flutterwave V3 Init Error]:', v3Err?.message || v3Err);
      }
    }

    // 2. V4 OAuth2 + Hosted Checkout fallback when using Flutterwave V4 Client ID / Client Secret
    if (!paymentLink && clientId && v4Secret) {
      try {
        const tokenController = new AbortController();
        const tokenTimeout = setTimeout(() => tokenController.abort(), 10000);
        const tokenBody = new URLSearchParams({
          client_id: clientId,
          client_secret: v4Secret,
          grant_type: 'client_credentials'
        }).toString();

        const tokenRes = await fetch(
          'https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: tokenBody,
            signal: tokenController.signal
          }
        );
        clearTimeout(tokenTimeout);

        const tokenData = await tokenRes.json().catch(() => null);
        if (tokenRes.ok && tokenData?.access_token) {
          const hostedPayParams = new URLSearchParams({
            public_key: clientId,
            tx_ref,
            amount: String(numAmount),
            currency: 'NGN',
            payment_options: 'card,banktransfer,opay,ussd,account',
            redirect_url: callbackUrl,
            'customer[email]': userEmail,
            'customer[name]': name || userEmail.split('@')[0] || 'EFADO Valued Member',
            'customer[phonenumber]': phone || '',
            'customizations[title]': customizations?.title || 'EFADO Market Hubs Central Processor',
            'customizations[description]':
              customizations?.description || `Fund ₦${numAmount.toLocaleString()} to EFADO Sovereign Wallet`,
            'customizations[logo]': customizations?.logo || `${baseAppUrl}/efado_logo_192.jpg`,
            'meta[userId]': targetUserId,
            'meta[channel]': channel || 'ALL'
          });
          paymentLink = `https://checkout.flutterwave.com/v3/hosted/pay?${hostedPayParams.toString()}`;
        } else {
          console.warn('[Vercel Flutterwave V4 Token Warning]:', tokenData);
        }
      } catch (v4Err: any) {
        console.warn('[Vercel Flutterwave V4 Init Error]:', v4Err?.message || v4Err);
      }
    }

    // 3. Direct Hosted Checkout param fallback if only public key is valid
    if (!paymentLink && clientId && clientId.startsWith('FLWPUBK')) {
      const hostedPayParams = new URLSearchParams({
        public_key: clientId,
        tx_ref,
        amount: String(numAmount),
        currency: 'NGN',
        payment_options: 'card,banktransfer,opay,ussd,account',
        redirect_url: callbackUrl,
        'customer[email]': userEmail,
        'customer[name]': name || userEmail.split('@')[0] || 'EFADO Member'
      });
      paymentLink = `https://checkout.flutterwave.com/v3/hosted/pay?${hostedPayParams.toString()}`;
    }

    if (!paymentLink) {
      return res.status(502).json({
        success: false,
        status: false,
        message: 'Could not obtain a valid Flutterwave checkout link. Verify your Flutterwave keys in Vercel.'
      });
    }

    // Record pending transaction in Firestore (ai-studio-ae55e9a4-6837-4ca3-a2d6-3ec7ce41d18a)
    try {
      const db = getServerDb();
      if (db) {
        await db.doc(`pendingPayments/${tx_ref}`).set(
          {
            tx_ref,
            amount: numAmount,
            email: userEmail,
            userId: targetUserId,
            channel: channel || 'ALL',
            currency: 'NGN',
            status: 'pending',
            gateway: 'flutterwave',
            link: paymentLink,
            createdAt: getServerTimestamp()
          },
          { merge: true }
        );
      }
    } catch (dbErr) {
      console.warn('[Vercel Flutterwave Init] Pending record notice:', dbErr);
    }

    return res.status(200).json({
      success: true,
      status: true,
      tx_ref,
      amount: numAmount,
      currency: 'NGN',
      email: userEmail,
      publicKey: clientId,
      link: paymentLink,
      channels: ['card', 'banktransfer', 'opay', 'ussd', 'account', 'qr'],
      message: 'Flutterwave payment initialized'
    });
  } catch (error: any) {
    console.error('[Vercel Flutterwave Init Crash]:', error);
    return res.status(500).json({
      success: false,
      status: false,
      message: error?.message || 'Server error initializing Flutterwave payment'
    });
  }
}
