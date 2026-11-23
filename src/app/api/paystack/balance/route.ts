import { getPaystackBalance } from '../../../../lib/paystack.js';
import { auth, getServerDb } from '../../../../lib/server-firestore.js';

const ADMIN_EMAILS = new Set([
  'efado226@gmail.com',
  'efadofestus@gmail.com',
  'festdanemh@gmail.com'
]);

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1]?.trim() : null;
    if (!token) {
      return Response.json({ success: false, connected: false, error: 'Unauthorized' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = await auth().verifyIdToken(token);
    } catch {
      return Response.json({ success: false, connected: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!decoded?.uid) {
      return Response.json({ success: false, connected: false, error: 'Unauthorized' }, { status: 401 });
    }

    const email = String(decoded.email || '').trim().toLowerCase();
    let isAdmin = ADMIN_EMAILS.has(email);

    if (!isAdmin) {
      const db = getServerDb();
      if (db) {
        try {
          const userSnap = await db.doc(`users/${decoded.uid}`).get();
          const uData = userSnap?.exists ? userSnap.data() : null;
          if (uData && (uData.role === 'admin' || uData.is_super_admin === true)) {
            isAdmin = true;
          }
        } catch {
          // Non-fatal fallback
        }
      }
    }

    if (!isAdmin) {
      return Response.json({ success: false, connected: false, error: 'Forbidden: Admin privileges required' }, { status: 403 });
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return Response.json({
        success: false,
        connected: false,
        balances: [],
        error: 'Paystack API secret key not configured'
      }, { status: 200 });
    }

    const paystackRes = await getPaystackBalance();
    const rawData = Array.isArray(paystackRes?.data) ? paystackRes.data : [];
    const balances = rawData.map((b: any) => ({
      currency: String(b.currency || 'NGN'),
      balanceKobo: Number(b.balance || 0),
      balanceMajor: Number((Number(b.balance || 0) / 100).toFixed(2))
    }));

    return Response.json({
      success: true,
      connected: true,
      balances
    });
  } catch (error: any) {
    console.error('[Paystack Balance Route Error]:', error);
    return Response.json(
      {
        success: false,
        connected: false,
        balances: [],
        error: error?.message || 'Failed to fetch live Paystack balance'
      },
      { status: 500 }
    );
  }
}
