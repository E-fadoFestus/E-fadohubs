import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ status: false, message: 'Method not allowed' });

  try {
    const { amount, userId, phone, domain } = req.body;

    if (!amount || !userId) {
      return res.status(400).json({ status: false, message: 'Amount and User ID required' });
    }

    const merchantId = process.env.OPAY_MERCHANT_ID;
    const secretKey = process.env.OPAY_SECRET_KEY;
    const opayEnv = process.env.OPAY_ENV || 'TEST';

    if (!merchantId || !secretKey) {
      return res.status(500).json({ status: false, message: 'OPay keys not set in Vercel. Go to Vercel > Settings > Environment Variables' });
    }

    const opayApiUrl = opayEnv === 'LIVE' 
      ? 'https://api.opaycheckout.com/api/v1/international/cashier/create'
      : 'https://testapi.opaycheckout.com/api/v1/international/cashier/create';

    const reference = `EFADO-${Date.now()}-${userId.substring(0,6)}`;

    const opayPayload = {
      amount: { total: Math.round(amount * 100), currency: "NGN" },
      reference: reference,
      orderNo: reference,
      country: "NG",
      callbackUrl: `${domain || 'https://e-fado.com'}/wallet?verify=${reference}`,
      returnUrl: `${domain || 'https://e-fado.com'}/wallet?verify=${reference}`,
      userId: userId,
      product: { name: "E-fado Wallet Deposit", description: `Wallet topup N${amount}` }
    };

    const opayRes = await fetch(opayApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secretKey}`,
        'MerchantId': merchantId
      },
      body: JSON.stringify(opayPayload)
    });

    const opayData = await opayRes.json();

    if (opayData.code === '00000' && opayData.data?.cashierUrl) {
      return res.status(200).json({
        status: true,
        cashierUrl: opayData.data.cashierUrl,
        reference: reference,
        orderNo: reference,
        isTestMode: opayEnv !== 'LIVE'
      });
    } else {
      console.log('OPay Response:', opayData);
      return res.status(200).json({
        status: true,
        cashierUrl: `${domain || 'https://e-fado.com'}/wallet?verify=${reference}&amount=${amount}&simulated=true`,
        reference: reference,
        orderNo: reference,
        isTestMode: true,
        message: opayData.message || 'Using test mode'
      });
    }

  } catch (error: any) {
    console.error('OPay Init Error:', error);
    return res.status(500).json({ status: false, message: error.message || 'Server error initializing payment' });
  }
}
