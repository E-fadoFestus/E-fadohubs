import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { amount, email, userId, channel } = req.body || {};
    
    if (!amount || !userId) {
      return res.status(400).json({ success: false, message: 'amount and userId required' });
    }

    const tx_ref = `EFADO_${Date.now()}_${userId.substring(0,6)}`;
    
    return res.status(200).json({
      success: true,
      tx_ref,
      amount: Number(amount),
      currency: 'NGN',
      email: email || 'user@efado.com',
      publicKey: process.env.VITE_FLUTTERWAVE_PUBLIC_KEY || '',
      channels: ['card','banktransfer','opay','ussd','account','qr'],
      message: 'Transaction initialized'
    });

  } catch (error: any) {
    console.error('Initialize error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error in initialize',
      error: String(error)
    });
  }
}
