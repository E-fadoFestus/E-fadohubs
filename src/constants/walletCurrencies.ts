export interface WalletCurrencyMeta {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  disabled?: boolean;
  comingSoon?: boolean;
  note?: string;
}

export const ACTIVE_WALLET_CURRENCIES: WalletCurrencyMeta[] = [
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', flag: '🇬🇭' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA', flag: '🇧🇫', note: 'Burkina Faso & WAEMU' }
];

export const FUTURE_WALLET_CURRENCIES: WalletCurrencyMeta[] = [
  {
    code: 'SIRA',
    name: 'Sira (Burkina Faso)',
    symbol: 'SIRA',
    flag: '🇧🇫',
    disabled: true,
    comingSoon: true,
    note: 'Coming Soon — Planned currency, not yet in circulation'
  }
];

export const ALL_WALLET_CURRENCIES: WalletCurrencyMeta[] = [
  ...ACTIVE_WALLET_CURRENCIES,
  ...FUTURE_WALLET_CURRENCIES
];

export const ACTIVE_CURRENCY_CODES = ACTIVE_WALLET_CURRENCIES.map((c) => c.code);
export const DISABLED_FUTURE_CURRENCY_CODES = FUTURE_WALLET_CURRENCIES.map((c) => c.code);

export function normalizeCurrencyCode(code?: string | null): string {
  const clean = String(code || 'NGN').trim().toUpperCase();
  if (clean === 'CFA') return 'XOF';
  return clean || 'NGN';
}

export function isDisabledFutureCurrency(code?: string | null): boolean {
  const clean = normalizeCurrencyCode(code);
  return DISABLED_FUTURE_CURRENCY_CODES.includes(clean);
}

export function isActiveWalletCurrency(code?: string | null): boolean {
  const clean = normalizeCurrencyCode(code);
  return ACTIVE_CURRENCY_CODES.includes(clean);
}

export function getWalletCurrencyMeta(code?: string | null): WalletCurrencyMeta {
  const clean = normalizeCurrencyCode(code);
  return (
    ALL_WALLET_CURRENCIES.find((c) => c.code === clean) ||
    ACTIVE_WALLET_CURRENCIES[0]
  );
}

export function formatCurrencyAmount(amount: number, currencyCode: string = 'NGN'): string {
  const meta = getWalletCurrencyMeta(currencyCode);
  const safeNum = Number.isFinite(amount) ? amount : 0;
  const formatted = safeNum.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return meta.code === 'XOF' || meta.code === 'SIRA'
    ? `${formatted} ${meta.symbol}`
    : `${meta.symbol}${formatted}`;
}

// Minimum deposit per active currency
export const MIN_DEPOSIT_BY_CURRENCY: Record<string, number> = {
  NGN: 100,
  USD: 1,
  GBP: 1,
  EUR: 1,
  CAD: 1,
  AUD: 1,
  GHS: 5,
  ZAR: 10,
  XOF: 500
};

export function getMinDepositForCurrency(currencyCode: string = 'NGN'): number {
  const clean = normalizeCurrencyCode(currencyCode);
  return MIN_DEPOSIT_BY_CURRENCY[clean] ?? 100;
}
