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

      if (resolveRes?.status && data?.account_name) {
        return Response.json({
          success: true,
          account_name: data.account_name,
          account_number: data.account_number || cleanAccount,
          source: 'paystack'
        });
      }
    } catch (resolveErr: any) {
      // Fall back to Flutterwave V3 NIBSS resolve with 10s timeout if Paystack fails or rejects bank code
      const flwSecret = (
        process.env.FLWSECK_LIVE ||
        process.env.FLW_SECRET_KEY ||
        process.env.FLUTTERWAVE_SECRET_KEY ||
        process.env.FLUTTERWAVE_CLIENT_SECRET ||
        ''
      ).trim().replace(/^['"]|['"]$/g, '').replace(/[;\s]/g, '');

      if (flwSecret && flwSecret.length > 20) {
        let flwBankCode = cleanBank;
        if (flwBankCode === '999992') flwBankCode = '100004';
        if (flwBankCode === '999991') flwBankCode = '100033';
        if (flwBankCode === '50211') flwBankCode = '090267';

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);
        try {
          const flwRes = await fetch('https://api.flutterwave.com/v3/accounts/resolve', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${flwSecret}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              account_number: cleanAccount,
              account_bank: flwBankCode
            }),
            signal: controller.signal
          });
          clearTimeout(timer);
          const flwData = await flwRes.json().catch(() => null);
          if (flwData?.status === 'success' && flwData?.data?.account_name) {
            return Response.json({
              success: true,
              account_name: flwData.data.account_name,
              account_number: flwData.data.account_number || cleanAccount,
              source: 'flutterwave'
            });
          }
        } catch {
          clearTimeout(timer);
        }
      }

      const isTimeout = resolveErr?.status === 504 || String(resolveErr?.message || '').toLowerCase().includes('did not respond');
      return Response.json({
        success: false,
        error: isTimeout
          ? 'Bank not responding. Please try again in a few seconds.'
          : (resolveErr?.message || 'Invalid account number or bank details. Check and try again.')
      }, { status: isTimeout ? 504 : (resolveErr?.message?.includes('PAYSTACK_SECRET_KEY') ? 500 : 400) });
    }

    return Response.json({
      success: false,
      error: 'Invalid account number or bank details. Check and try again.'
    }, { status: 400 });

  } catch (error: any) {
    console.error('[Next.js Verify Account Error]:', error);
    return Response.json({
      success: false,
      error: error.message || 'Server error verifying bank account'
    }, { status: 500 });
  }
}
