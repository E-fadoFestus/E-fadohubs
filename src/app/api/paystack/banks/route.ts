import { getPaystackBanks } from '../../../../lib/paystack';
import { auth } from '../../../../lib/server-firestore';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1]?.trim() : null;
    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const decoded = await auth().verifyIdToken(token);
      if (!decoded?.uid) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } catch {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paystackRes = await getPaystackBanks('nigeria', 100);
    const rawBanks = paystackRes?.data || [];

    const banks = rawBanks
      .filter((b: any) => b && b.name && b.code && b.active !== false)
      .map((b: any) => ({
        name: String(b.name).trim(),
        code: String(b.code).trim()
      }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    return Response.json({
      success: true,
      banks
    });
  } catch (error: any) {
    console.error('[Next.js Banks Error]:', error);
    return Response.json({
      success: false,
      error: error.message || 'Failed to fetch Nigerian bank directory'
    }, { status: 500 });
  }
}
