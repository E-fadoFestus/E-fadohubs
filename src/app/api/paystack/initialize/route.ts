import { initializePaystackPayment } from '../../../../lib/paystack';
import { getServerDb, getServerTimestamp, auth } from '../../../../lib/server-firestore';

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
    const { amount } = body || {};

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 100 || numAmount > 1000000) {
      return Response.json({ success: false, error: 'Invalid amount: Must be between ₦100 and ₦1,000,000' }, { status: 400 });
    }

    const reference = `EFADO-FUND-${userId.substring(0, 8)}-${Date.now()}`;
    const callbackUrl = `${(process.env.NEXT_PUBLIC_APP_URL || 'https://www.e-fado.com').replace(/\/$/, '')}/payment/callback`;

    const db = getServerDb();
    if (db) {
      try {
        const txDoc = db.doc(`transactions/${reference}`);
        const userTxDoc = db.doc(`wallets/${userId}/transactions/${reference}`);
        const txData = {
          type: 'fund',
          status: 'pending',
          amount: numAmount,
          currency: 'NGN',
          reference,
          userId,
          email: userEmail,
          gateway: 'paystack',
          purpose: 'wallet_funding',
          createdAt: getServerTimestamp(),
          updatedAt: getServerTimestamp()
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
        reference
      },
      callbackUrl
    );

    const authUrl = paystackResponse?.data?.authorization_url;
    if (!paystackResponse?.status || !authUrl) {
      return Response.json({
        success: false,
        error: 'Failed to initialize payment with Paystack',
        details: paystackResponse
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      authorization_url: authUrl,
      reference,
      access_code: paystackResponse?.data?.access_code
    });

  } catch (error: any) {
    console.error('[Next.js Paystack Init Error]:', error);
    return Response.json({
      success: false,
      error: error.message || 'Failed to initialize payment'
    }, { status: 500 });
  }
}
