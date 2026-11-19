/**
 * E-FADO WALLET - UNIFIED NIGERIAN BANK ACCOUNT VERIFICATION
 * Always returns JSON. Tries Paystack NIBSS resolve first (supports 100+ banks incl. OPay/PalmPay/Kuda/Moniepoint),
 * then falls back to Flutterwave V3 NIBSS resolve.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).json({ success: true, status: true });
  if (!['POST', 'GET'].includes(req.method)) {
    return res.status(405).json({ success: false, status: false, message: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const query = req.query || {};

    const account_number = String(
      body.account_number || body.accountNumber || query.account_number || ''
    )
      .trim()
      .replace(/\D/g, '');
    const bank_code_input = String(
      body.bank_code || body.bankCode || body.code || query.bank_code || ''
    ).trim();
    const bank_name_input = String(
      body.bank_name || body.bankName || body.bank || query.bank_name || ''
    ).trim();

    if (!account_number || account_number.length !== 10) {
      return res.status(400).json({
        success: false,
        status: false,
        message: 'Enter a valid 10-digit NUBAN account number.'
      });
    }

    const PAYSTACK_BANKS = {
      ACCESS: '044',
      'ACCESS BANK': '044',
      'ACCESS BANK PLC': '044',
      GTB: '058',
      GTBANK: '058',
      'GUARANTY TRUST': '058',
      'GUARANTY TRUST BANK': '058',
      ZENITH: '057',
      'ZENITH BANK': '057',
      'ZENITH BANK PLC': '057',
      'FIRST BANK': '011',
      FIRSTBANK: '011',
      'FIRST BANK OF NIGERIA': '011',
      UBA: '033',
      'UNITED BANK FOR AFRICA': '033',
      OPAY: '999992',
      'OPAY DIGITAL': '999992',
      'OPAY DIGITAL SERVICES': '999992',
      PAYCOM: '999992',
      PALMPAY: '999991',
      'PALM PAY': '999991',
      'PALMPAY LIMITED': '999991',
      KUDA: '50211',
      'KUDA MICROFINANCE BANK': '50211',
      MONIEPOINT: '50515',
      'MONIEPOINT MICROFINANCE BANK': '50515',
      PAGA: '100002',
      WEMA: '035',
      'WEMA BANK': '035',
      ALAT: '035',
      FCMB: '214',
      'FIRST CITY MONUMENT BANK': '214',
      STERLING: '232',
      'STERLING BANK': '232',
      UNION: '032',
      'UNION BANK': '032',
      ECOBANK: '050',
      'ECOBANK NIGERIA': '050',
      FIDELITY: '070',
      'FIDELITY BANK': '070',
      STANBIC: '221',
      'STANBIC IBTC': '221',
      KEYSTONE: '082',
      POLARIS: '076',
      UNITY: '215',
      JAIZ: '301',
      PROVIDUS: '101',
      VFD: '566',
      VBANK: '566'
    };

    let paystackBankCode = bank_code_input;
    const upperBank = bank_name_input.toUpperCase().trim();
    if ((!paystackBankCode || paystackBankCode === '000') && upperBank) {
      for (const [key, code] of Object.entries(PAYSTACK_BANKS)) {
        if (upperBank.includes(key)) {
          paystackBankCode = code;
          break;
        }
      }
    }

    const cleanKey = (k) =>
      (k || '')
        .trim()
        .replace(/^['"]|['"]$/g, '')
        .replace(/[;\s]/g, '');

    const PAYSTACK_SECRET = cleanKey(
      process.env.PAYSTACK_SECRET_KEY ||
        process.env.PAYSTACK_LIVE ||
        process.env.PAYSTACK_SECRET ||
        process.env.PAYSTACK_LIVE_SECRET_KEY
    );
    const FLW_SECRET = cleanKey(
      process.env.FLWSECK_LIVE ||
        process.env.FLW_SECRET_KEY ||
        process.env.FLUTTERWAVE_SECRET_KEY ||
        process.env.FLUTTERWAVE_CLIENT_SECRET
    );

    // 1. Try Paystack NIBSS Account Resolution (Primary — most reliable across Nigerian commercial + fintech banks)
    if (PAYSTACK_SECRET) {
      let codeForPaystack = paystackBankCode;
      // Convert Flutterwave fintech codes back to Paystack codes if needed
      if (codeForPaystack === '100004') codeForPaystack = '999992'; // OPay
      if (codeForPaystack === '100033') codeForPaystack = '999991'; // PalmPay
      if (codeForPaystack === '090267') codeForPaystack = '50211';  // Kuda

      // If still no bank code, look up dynamically via Paystack bank directory by bank name
      if ((!codeForPaystack || codeForPaystack === '000') && bank_name_input) {
        try {
          const listRes = await fetch('https://api.paystack.co/bank?country=nigeria&perPage=100', {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
          });
          const listData = await listRes.json().catch(() => null);
          if (listData?.status && Array.isArray(listData.data)) {
            const target = bank_name_input.toLowerCase().replace(/[^a-z0-9]/g, '');
            const matched = listData.data.find((b) =>
              String(b.name || '')
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '')
                .includes(target)
            );
            if (matched?.code) codeForPaystack = String(matched.code);
          }
        } catch (dirErr) {
          console.warn('[verify-bank] Paystack bank lookup skipped:', dirErr.message);
        }
      }

      if (codeForPaystack && codeForPaystack !== '000') {
        try {
          const psRes = await fetch(
            `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(account_number)}&bank_code=${encodeURIComponent(codeForPaystack)}`,
            { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
          );
          const psData = await psRes.json().catch(() => null);
          if (psData?.status && psData?.data?.account_name) {
            return res.status(200).json({
              success: true,
              status: true,
              account_name: psData.data.account_name,
              account_number: psData.data.account_number || account_number,
              bank_code: codeForPaystack,
              bank_name: bank_name_input || codeForPaystack,
              source: 'paystack',
              message: 'Account verified'
            });
          }
          console.warn('[verify-bank] Paystack resolve returned non-match:', psData?.message || psData);
        } catch (e) {
          console.warn('[verify-bank] Paystack error:', e.message);
        }
      }
    }

    // 2. Fallback to Flutterwave V3 NIBSS Account Resolution
    if (FLW_SECRET && FLW_SECRET.length > 20) {
      let flwBankCode = paystackBankCode || bank_code_input;
      if (flwBankCode === '999992') flwBankCode = '100004'; // OPay in Flutterwave
      if (flwBankCode === '999991') flwBankCode = '100033'; // PalmPay in Flutterwave
      if (flwBankCode === '50211') flwBankCode = '090267';  // Kuda in Flutterwave

      if (flwBankCode && flwBankCode !== '000') {
        try {
          const flwRes = await fetch('https://api.flutterwave.com/v3/accounts/resolve', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${FLW_SECRET}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              account_number,
              account_bank: String(flwBankCode)
            })
          });
          const flwData = await flwRes.json().catch(() => null);
          if (flwData?.status === 'success' && flwData?.data?.account_name) {
            return res.status(200).json({
              success: true,
              status: true,
              account_name: flwData.data.account_name,
              account_number: flwData.data.account_number || account_number,
              bank_code: flwBankCode,
              bank_name: bank_name_input || flwBankCode,
              source: 'flutterwave',
              message: 'Account verified'
            });
          }
          console.warn('[verify-bank] Flutterwave resolve returned non-match:', flwData?.message || flwData);
        } catch (e) {
          console.warn('[verify-bank] Flutterwave error:', e.message);
        }
      }
    }

    const keysConfigured = Boolean(PAYSTACK_SECRET || FLW_SECRET);
    return res.status(keysConfigured ? 422 : 500).json({
      success: false,
      status: false,
      message: keysConfigured
        ? `Could not verify ${account_number}. Please confirm the 10-digit account number and destination bank (${bank_name_input || bank_code_input}).`
        : 'Server payment secret keys (PAYSTACK_SECRET_KEY / FLW_SECRET_KEY) are not configured in Vercel environment.',
      account_number,
      bank_code: paystackBankCode
    });
  } catch (err) {
    console.error('verify-bank holistic crash:', err);
    return res.status(500).json({
      success: false,
      status: false,
      message: err?.message || 'Verification service error, please try again.'
    });
  }
}
