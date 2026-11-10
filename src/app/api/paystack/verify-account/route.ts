import { resolveAccountNumber } from '../../../../lib/paystack';
import { auth } from '../../../../lib/server-firestore';

export async function POST(req: Request) {
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

    const body = await req.json().catch(() => ({}));
    const { account_number, bank_code } = body || {};

    const cleanAccount = String(account_number || '').trim().replace(/\D/g, '');
    const cleanBank = String(bank_code || '').trim();

    if (!cleanAccount || cleanAccount.length !== 10) {
      return Response.json({
        success: false,
        error: 'Invalid account number: Exactly 10 digits required.'
      }, { status: 400 });
    }

    if (!cleanBank) {
      return Response.json({
        success: false,
        error: 'Bank selection is required.'
      }, { status: 400 });
    }

    try {
      const resolveRes = await resolveAccountNumber(cleanAccount, cleanBank);
      const data = resolveRes?.data;

      if (!resolveRes?.status || !data?.account_name) {
        return Response.json({
          success: false,
          error: 'Account number not found. Check number and bank and try again.'
        }, { status: 400 });
      }

      return Response.json({
        success: true,
        account_name: data.account_name,
        account_number: data.account_number || cleanAccount
      });
    } catch {
      return Response.json({
        success: false,
        error: 'Account number not found. Check number and bank and try again.'
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Next.js Verify Account Error]:', error);
    return Response.json({
      success: false,
      error: error.message || 'Server error verifying bank account'
    }, { status: 500 });
  }
}
