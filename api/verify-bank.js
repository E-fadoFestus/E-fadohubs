// api/verify-bank.js - OPay ONLY - No Paystack Needed!
export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { account_number, bank_code, bank_name } = req.query;
  const bank = bank_code || bank_name;

  if (!account_number || account_number.length!== 10) {
    return res.status(400).json({ status: false, message: 'Invalid account number' });
  }

  // OPay Bank Code Mapping (OPay uses these codes)
  const OPayBankCodes = {
    "Access Bank": "000014", "GTBank": "000013", "GTB": "000013",
    "Zenith Bank": "000015", "UBA": "000016", "First Bank": "000016",
    "FirstBank": "000016", "OPay": "999991", "Paycom": "999991",
    "PalmPay": "999991", "Kuda": "090267", "Moniepoint": "50515",
    "Fidelity Bank": "000007", "Union Bank": "000020", "Wema Bank": "000017",
    "Sterling Bank": "000021", "Polaris Bank": "000030", "Keystone Bank": "000002"
  };

  const resolvedCode = OPayBankCodes[bank] || bank || "000013";

  try {
    // Use your existing OPay keys from.env
    const merchantId = process.env.OPAY_MERCHANT_ID;
    const publicKey = process.env.OPAY_PUBLIC_KEY;
    const privateKey = process.env.OPAY_PRIVATE_KEY;

    // OPay Transfer API - Validate Account Endpoint
    const payload = {
      accountBankCode: resolvedCode,
      accountNo: account_number,
      merchantId: merchantId
    };

    // Call OPay API (same signature you use for deposit)
    const opayResponse = await fetch('https://api.opaycheckout.com/api/v1/transfer/bank/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicKey}`,
        'MerchantId': merchantId
      },
      body: JSON.stringify(payload)
    });

    const data = await opayResponse.json();

    // OPay returns accountName if valid
    if (data.code === '00000' || data.status === 'SUCCESS' || data.data) {
      return res.status(200).json({
        status: true,
        data: {
          account_name: data.data?.accountName || data.data?.account_name || data.accountName,
          account_number: account_number,
          bank_code: resolvedCode
        }
      });
    } else {
      // Fallback - try Paystack style response for compatibility
      return res.status(200).json({
        status: false,
        message: data.message || 'Could not verify account'
      });
    }

  } catch (error) {
    console.error('OPay verify error:', error);
    return res.status(500).json({
      status: false,
      message: 'Verification service error. Try again.'
    });
  }
}
