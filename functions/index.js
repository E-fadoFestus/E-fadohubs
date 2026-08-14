const functions = require('firebase-functions');
const { defineSecret } = require('firebase-functions/params');

const clientId = defineSecret('FLUTTERWAVE_CLIENT_ID');
const clientSecret = defineSecret('FLUTTERWAVE_CLIENT_SECRET');
const encryptionKey = defineSecret('FLUTTERWAVE_ENCRYPTION_KEY');

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
