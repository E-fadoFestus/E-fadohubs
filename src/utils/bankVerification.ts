import { auth } from '../firebase';
import { getBackendUrl } from '../config/backend';

export interface BankItem {
  code: string;
  name: string;
  shortName?: string;
}

export const NIGERIAN_BANKS: BankItem[] = [
  { code: '044', name: 'Access Bank PLC', shortName: 'Access' },
  { code: '058', name: 'Guaranty Trust Bank (GTBank)', shortName: 'GTBank' },
  { code: '057', name: 'Zenith Bank PLC', shortName: 'Zenith' },
  { code: '011', name: 'First Bank of Nigeria', shortName: 'FirstBank' },
  { code: '50211', name: 'Kuda Microfinance Bank', shortName: 'Kuda' },
  { code: '50515', name: 'Moniepoint Microfinance Bank', shortName: 'Moniepoint' },
  { code: '999992', name: 'OPay Digital Services', shortName: 'OPay' },
  { code: '999991', name: 'PalmPay Limited', shortName: 'PalmPay' },
  { code: '033', name: 'United Bank for Africa (UBA)', shortName: 'UBA' },
  { code: '214', name: 'First City Monument Bank (FCMB)', shortName: 'FCMB' },
  { code: '221', name: 'Stanbic IBTC Bank', shortName: 'Stanbic' },
  { code: '232', name: 'Sterling Bank PLC', shortName: 'Sterling' },
  { code: '035', name: 'Wema Bank / ALAT', shortName: 'Wema' },
  { code: '070', name: 'Fidelity Bank PLC', shortName: 'Fidelity' },
  { code: '032', name: 'Union Bank of Nigeria', shortName: 'Union' },
  { code: '050', name: 'EcoBank Nigeria', shortName: 'EcoBank' },
  { code: '076', name: 'Polaris Bank', shortName: 'Polaris' },
  { code: '082', name: 'Keystone Bank', shortName: 'Keystone' },
  { code: '215', name: 'Unity Bank PLC', shortName: 'Unity' },
  { code: '301', name: 'Jaiz Bank PLC', shortName: 'Jaiz' },
  { code: '101', name: 'Providus Bank', shortName: 'Providus' },
  { code: '566', name: 'VFD Microfinance Bank (VBank)', shortName: 'VBank' },
  { code: '000', name: 'Other Bank / International Wire', shortName: 'Other' }
];

export async function resolveBankAccount(
  accountNumber: string,
  bankCode: string,
  bankName: string,
  gateway: 'paystack' | 'flutterwave' = 'paystack'
): Promise<{ success: boolean; accountName?: string; message?: string; resolvedVia?: string }> {
  const cleanNumber = accountNumber.trim().replace(/\D/g, '');

  if (cleanNumber.length !== 10) {
    return {
      success: false,
      message: 'Invalid account number: must be exactly 10 digits.'
    };
  }

  let effectiveBankCode = (bankCode || '').trim();
  if ((!effectiveBankCode || effectiveBankCode === '000') && bankName) {
    const lowerName = bankName.toLowerCase();
    const matched = NIGERIAN_BANKS.find(
      (b) =>
        b.code !== '000' &&
        (lowerName.includes(b.shortName?.toLowerCase() || '') ||
          b.name.toLowerCase().includes(lowerName))
    );
    if (matched) {
      effectiveBankCode = matched.code;
    }
  }

  // Try authenticated Paystack verify-account directly first when Paystack is chosen
  if (gateway === 'paystack' && auth.currentUser && effectiveBankCode && effectiveBankCode !== '000') {
    const psCtrl = new AbortController();
    const psTimer = setTimeout(() => psCtrl.abort(), 10000);
    try {
      const token = await auth.currentUser.getIdToken();
      const psRes = await fetch(getBackendUrl('/api/paystack/verify-account'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          account_number: cleanNumber,
          bank_code: effectiveBankCode
        }),
        signal: psCtrl.signal
      });
      clearTimeout(psTimer);
      const psData = await psRes.json().catch(() => null);
      if (psRes.ok && psData?.success && psData?.account_name) {
        return {
          success: true,
          accountName: psData.account_name,
          resolvedVia: 'Paystack Live Gateway'
        };
      }
    } catch {
      clearTimeout(psTimer);
    }
  }

  // Unified /api/verify-bank (tries selected gateway first + automatic fallback with 10s timeout)
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(getBackendUrl('/api/verify-bank'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        account_number: cleanNumber,
        bank_code: effectiveBankCode,
        bank_name: bankName,
        gateway
      }),
      signal: controller.signal
    });
    clearTimeout(timer);

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    const resolvedName = data?.account_name || data?.data?.account_name;
    if ((data?.success || data?.status) && resolvedName) {
      return {
        success: true,
        accountName: resolvedName,
        resolvedVia: data?.resolved_via
      };
    }

    const errMsg = data?.message || data?.error || '';
    if (res.status >= 502) {
      return {
        success: false,
        message: errMsg || 'Bank not responding. Please try again shortly.'
      };
    }

    return {
      success: false,
      message:
        errMsg ||
        'Invalid account number or wrong bank selected. Please check your 10-digit account number.'
    };
  } catch (err: any) {
    clearTimeout(timer);
    return {
      success: false,
      message:
        err?.name === 'AbortError'
          ? 'Bank not responding (request timed out after 10s). Please try again.'
          : 'Bank not responding. Check your connection and try again.'
    };
  }
}
