import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, verif-hash');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success:false, message:'Method not allowed' });

  try {
    const verifHash = req.headers['verif-hash'] as string;
    const expectedHash = 'efadowallet2026secureconnecthubsoperation';
    if (verifHash !== expectedHash) console.warn('Webhook invalid hash');

    const payload = req.body;
    console.log('Flutterwave webhook', payload?.tx_ref || payload?.data?.tx_ref);

    return res.status(200).json({ success:true, status:'received', message:'Webhook processed' });
  }catch(e:any){
    return res.status(200).json({ success:true, message:'Webhook acked' });
  }
}
