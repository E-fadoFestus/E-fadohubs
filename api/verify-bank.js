/**
 * E-FADO WALLET - HOLISTIC BANK VERIFICATION FIX
 * This file MUST always return JSON, never HTML
 * Supports: ACCESS, OPay, PalmPay, GTB, First Bank, etc - 100+ banks
 */
export default async function handler(req, res) {
  // 1. GOLDEN RULE: ALWAYS SET CORS + JSON HEADERS FIRST
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).json({ success: true });
  if (!['POST', 'GET'].includes(req.method)) {
    return res.status(405).json({ success: false, message: 'Use POST' });
  }

  try {
    const body = req.body || {};
    const query = req.query || {};
    
    // Accept any naming style from frontend
    const account_number = body.account_number || body.accountNumber || query.account_number || '';
    const bank_code_input = body.bank_code || body.bankCode || body.code || query.bank_code || '044';
    const bank_name_input = body.bank_name || body.bankName || body.bank || '';

    if (!account_number || String(account_number).trim().length !== 10) {
      return res.status(400).json({ success: false, message: 'Enter 10-digit NUBAN account number' });
    }

    // 2. HOLISTIC: FULL NIGERIAN BANK CODE MAP (so frontend dropdown works)
    const BANKS = {
      'ACCESS BANK': '044', 'ACCESS': '044', '044': '044',
      'OPAY': '999992', 'OPAY DIGITAL': '999992', 'PAYCOM': '999992',
      'PALMPAY': '999991', 'PALM PAY': '999991',
      'GTB': '058', 'GTBANK': '058', 'GUARANTY TRUST': '058',
      'FIRST BANK': '011', 'FIRSTBANK': '011',
      'UBA': '033', 'ZENITH': '057', 'KUDA': '50211',
      'MONIEPOINT': '50515', 'PAGA': '100002', 'WEMA': '035',
      'FCMB': '214', 'STERLING': '232', 'UNION': '032', 'ECOBANK': '050'
    };

    let bank_code = String(bank_code_input).trim();
    const upperBank = String(bank_name_input || bank_code_input).toUpperCase().trim();
    if (BANKS[upperBank]) bank_code = BANKS[upperBank];

    // 3. HOLISTIC: GET SECRETS SAFELY - Never crash
    const cleanKey = (k) => (k || '').trim().replace(/['";`\s]/g, '').split('=').pop().trim();
    const FLW_SECRET = cleanKey(process.env.FLWSECK_LIVE || process.env.FLUTTERWAVE_SECRET_KEY || process.env.FLW_SECRET_KEY);
    const PAYSTACK_SECRET = cleanKey(process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_LIVE);

    // 4. TRY FLUTTERWAVE V3 (Primary)
    if (FLW_SECRET && FLW_SECRET.length > 20) {
      try {
        const flwRes = await fetch('https://api.flutterwave.com/v3/accounts/resolve', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${FLW_SECRET}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ account_number: String(account_number), account_bank: String(bank_code) })
        });
        const flwData = await flwRes.json();
        if (flwData.status === 'success' && flwData.data?.account_name) {
          return res.status(200).json({
            success: true,
            account_name: flwData.data.account_name,
            account_number: flwData.data.account_number || account_number,
            bank_code: bank_code,
            bank_name: bank_name_input || bank_code,
            source: 'flutterwave',
            message: 'Account verified'
          });
        }
        console.log('FLW failed:', flwData);
      } catch (e) { console.log('FLW error', e.message); }
    }

    // 5. TRY PAYSTACK (Fallback - best for OPay/PalmPay)
    if (PAYSTACK_SECRET) {
      try {
        const psRes = await fetch(`https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`, {
          headers: { 'Authorization': `Bearer ${PAYSTACK_SECRET}` }
        });
        const psData = await psRes.json();
        if (psData.status && psData.data?.account_name) {
          return res.status(200).json({
            success: true,
            account_name: psData.data.account_name,
            account_number: psData.data.account_number || account_number,
            bank_code: bank_code,
            source: 'paystack',
            message: 'Account verified'
          });
        }
      } catch (e) { console.log('Paystack error', e.message); }
    }

    // 6. LAST RESORT: Return friendly error as JSON, NOT HTML
    // This is what your screenshot currently shows as UNAVAILABLE because old code crashed
    return res.status(200).json({
      success: false,
      message: `Could not verify ${account_number}. Confirm bank is ${bank_name_input || bank_code}. If OPay/PalmPay, try 10-digit number again.`,
      hint: 'Add FLWSECK_LIVE and PAYSTACK_SECRET_KEY in Vercel env',
      account_number,
      bank_code
    });

  } catch (err) {
    // 7. NEVER RETURN HTML - This is why you saw <!DOCTYPE
    console.error('verify-bank holistic crash:', err);
    return res.status(500).json({ success: false, message: 'Verification service error, try again', error: err.message });
  }
}
