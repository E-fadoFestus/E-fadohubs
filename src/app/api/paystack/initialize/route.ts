import { initializePaystackPayment } from '../../../../lib/paystack.js';
import { getServerDb, getServerTimestamp, auth } from '../../../../lib/server-firestore.js';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1]?.trim() : null;
    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = await auth().verifyIdToken(token);
    } catch {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = decoded.uid;
    const userEmail = (decoded.email || `${userId}@efado.com`).trim().toLowerCase();
    const body = await req.json().catch(() => ({}));
    const { amount, amount_in_kobo, currency: rawCurrency } = body || {};

    const requestedCurrency = String(rawCurrency || 'NGN').trim().toUpperCase();
    const ACTIVE_CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'CAD', 'AUD', 'GHS', 'ZAR', 'XOF'];
    if (requestedCurrency === 'SIRA') {
      return Response.json({
        success: false,
        error: 'SIRA is Coming Soon and not yet in circulation. Deposits in SIRA are disabled.'
      }, { status: 400 });
    }
    if (!ACTIVE_CURRENCIES.includes(requestedCurrency)) {
      return Response.json({
        success: false,
        error: `Unsupported currency "${requestedCurrency}". Supported currencies: ${ACTIVE_CURRENCIES.join(', ')}.`
      }, { status: 400 });
    }

    const numAmount = amount !== undefined && amount !== null
      ? Number(amount)
      : (amount_in_kobo !== undefined && amount_in_kobo !== null ? Number(amount_in_kobo) / 100 : NaN);

    const minAmount = requestedCurrency === 'NGN' ? 100 : requestedCurrency === 'XOF' ? 500 : 1;
    if (!Number.isFinite(numAmount) || numAmount < minAmount || numAmount > 10000000) {
      return Response.json({
        success: false,
        error: `Invalid amount: Must be at least ${minAmount} ${requestedCurrency}`
      }, { status: 400 });
    }

    const reference = `EFADO-FUND-${userId.substring(0, 8)}-${Date.now()}`;
    const originHeader = req.headers.get('origin');
    const baseAppUrl = (originHeader || process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://www.e-fado.com').replace(/\/$/, '');
    const callbackUrl = `${baseAppUrl}/payment/callback`;

    const db = getServerDb();
    const serverTime = getServerTimestamp();
    if (db) {
      try {
        const txDoc = db.doc(`transactions/${reference}`);
        const userTxDoc = db.doc(`wallets/${userId}/transactions/${reference}`);
        const txData = {
          type: 'deposit',
          status: 'pending',
          credited: false,
          amount: numAmount,
          currency: requestedCurrency,
          reference,
          userId,
          email: userEmail,
          gateway: 'paystack',
          method: 'Paystack Gateway',
          purpose: 'Wallet Top-up',
          timestamp: serverTime,
          createdAt: serverTime,
          updatedAt: serverTime
        };

        await Promise.all([
          txDoc.set(txData, { merge: true }),
          userTxDoc.set(txData, { merge: true })
        ]);
      } catch (dbErr) {
        console.warn('[Next.js Paystack Init] DB record warning:', dbErr);
      }
    }

    const paystackResponse = await initializePaystackPayment(
      userEmail,
      numAmount,
      reference,
      {
        userId,
        purpose: 'wallet_funding',
        currency: requestedCurrency,
        reference
      },
      callbackUrl,
      requestedCurrency
    );

    const authUrl = paystackResponse?.data?.authorization_url;
    if (!paystackResponse?.status || !authUrl) {
      return Response.json({
        success: false,
        error: paystackResponse?.message || 'Failed to initialize payment with Paystack',
        details: paystackResponse
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      authorization_url: authUrl,
      reference,
      currency: requestedCurrency,
      access_code: paystackResponse?.data?.access_code
    });

  } catch (error: any) {
    console.error('[Next.js Paystack Init Error]:', error);
    const status =
      typeof error?.status === 'number' && error.status >= 400 && error.status < 600
        ? error.status
        : 500;
    return Response.json({
      success: false,
      error: error.message || 'Failed to initialize payment'
    }, { status });
  }
}
