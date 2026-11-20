import type { VercelRequest, VercelResponse } from '@vercel/node';

const FALLBACK_BANKS = [
  { code: '044', name: 'Access Bank PLC' },
  { code: '058', name: 'Guaranty Trust Bank (GTBank)' },
  { code: '057', name: 'Zenith Bank PLC' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '033', name: 'United Bank for Africa (UBA)' },
  { code: '100004', name: 'OPay Digital Services Limited' },
  { code: '100033', name: 'PalmPay Limited' },
  { code: '090267', name: 'Kuda Microfinance Bank' },
  { code: '50515', name: 'Moniepoint Microfinance Bank' },
  { code: '214', name: 'First City Monument Bank (FCMB)' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '232', name: 'Sterling Bank PLC' },
  { code: '035', name: 'Wema Bank / ALAT' },
  { code: '070', name: 'Fidelity Bank PLC' },
  { code: '032', name: 'Union Bank of Nigeria' },
  { code: '050', name: 'EcoBank Nigeria' },
  { code: '076', name: 'Polaris Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '215', name: 'Unity Bank PLC' },
  { code: '301', name: 'Jaiz Bank PLC' },
  { code: '101', name: 'Providus Bank' },
  { code: '566', name: 'VFD Microfinance Bank (VBank)' }
];

const cleanKey = (k?: string) =>
  (k || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/[;\s]/g, '');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, status: false, message: 'Method not allowed' });
  }

  const country = String(req.query?.country || 'NG').toUpperCase();
  const flwSecret = cleanKey(
    process.env.FLWSECK_LIVE ||
      process.env.FLW_SECRET_KEY ||
      process.env.FLUTTERWAVE_SECRET_KEY ||
      process.env.FLWSECK ||
      process.env.FLUTTERWAVE_CLIENT_SECRET
  );

  if (flwSecret) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const flwRes = await fetch(`https://api.flutterwave.com/v3/banks/${encodeURIComponent(country)}`, {
        headers: {
          Authorization: `Bearer ${flwSecret}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timer);
      const data = await flwRes.json().catch(() => null);
      if (data?.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
        const banks = data.data
          .filter((b: any) => b && b.name && b.code)
          .map((b: any) => ({ name: String(b.name).trim(), code: String(b.code).trim() }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
        return res.status(200).json({ success: true, status: true, banks, data: banks });
      }
    } catch {
      clearTimeout(timer);
    }
  }

  return res.status(200).json({
    success: true,
    status: true,
    banks: FALLBACK_BANKS,
    data: FALLBACK_BANKS
  });
}
