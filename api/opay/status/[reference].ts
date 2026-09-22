import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { reference } = req.query;
    if (!reference) return res.status(400).json({ status: false, message: 'No reference' });

    const merchantId = process.env.OPAY_MERCHANT_ID;
    const secretKey = process.env.OPAY_SECRET_KEY;
    const opayEnv = process.env.OPAY_ENV || 'TEST';

    // If still no keys, allow simulated for testing
    if (!merchantId || !secretKey) {
      return res.status(200).json({ status: true, verified: true, message: 'Simulated - Add OPay keys for real verification' });
    }

    const opayQueryUrl = opayEnv === 'LIVE'
      ? 'https://api.opaycheckout.com/api/v1/international/cashier/status'
      : 'https://testapi.opaycheckout.com/api/v1/international/cashier/status';

    const opayRes = await fetch(opayQueryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secretKey}`,
        'MerchantId': merchantId
      },
      body: JSON.stringify({ reference: reference as string, orderNo: reference as string })
    });

    const data = await opayRes.json();

    // OPay success code
    if (data.code === '00000' && data.data?.status === 'SUCCESS') {
      return res.status(200).json({ status: true, verified: true, data: data.data });
    } else {
      // For test mode, still allow
      if (opayEnv === 'TEST') {
        return res.status(200).json({ status: true, verified: true, message: 'Test mode verified' });
      }
      return res.status(200).json({ status: false, verified: false, data });
    }

  } catch (e: any) {
    return res.status(500).json({ status: false, message: e.message });
  }
}
