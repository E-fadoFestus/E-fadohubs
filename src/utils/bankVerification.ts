import { getFlutterwaveSecretKey } from './flutterwave';

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
  { code: '082', name: 'Keystone Bank', shortName: 'Keystone' },
  { code: '215', name: 'Unity Bank PLC', shortName: 'Unity' },
  { code: '301', name: 'Jaiz Bank PLC', shortName: 'Jaiz' },
  { code: '101', name: 'Providus Bank', shortName: 'Providus' },
  { code: '000', name: 'Other Bank / International Wire', shortName: 'Other' }
];

export async function resolveBankAccount(
  accountNumber: string,
  bankCode: string,
  bankName: string
): Promise<{ success: boolean; accountName?: string; message?: string }> {
  const cleanNumber = accountNumber.trim().replace(/\D/g, '');
  
  if (cleanNumber.length < 10) {
    return {
      success: false,
      message: 'Account number must be exactly 10 digits.'
    };
  }

  try {
    const flwKey = getFlutterwaveSecretKey();
    const paystackKey = localStorage.getItem('efado_paystack_secret_key') || '';
    const activeSecretKey = flwKey || paystackKey;

    const url = `/api/bank/resolve?account_number=${encodeURIComponent(cleanNumber)}&bank_code=${encodeURIComponent(bankCode)}&bank_name=${encodeURIComponent(bankName)}&secret_key=${encodeURIComponent(activeSecretKey)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status && data.account_name) {
      return {
        success: true,
        accountName: data.account_name
      };
    } else {
      return {
        success: false,
        message: data.message || 'Account holder name could not be verified by destination bank. Please check account number and bank.'
      };
    }
  } catch (err) {
    console.warn('Backend bank resolve API call failed:', err);
    return {
      success: false,
      message: 'Bank verification service unavailable. Please check account details.'
    };
  }
}

