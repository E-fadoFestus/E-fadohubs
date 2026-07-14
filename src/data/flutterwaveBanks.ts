export interface FlutterwaveBank {
  id: number;
  code: string;
  name: string;
  country: string;
}

export interface FlutterwaveCountry {
  code: string;
  name: string;
  currency: string;
}

export const FLUTTERWAVE_COUNTRIES: FlutterwaveCountry[] = [
  { code: 'NG', name: 'Nigeria', currency: 'NGN' },
  { code: 'GH', name: 'Ghana', currency: 'GHS' },
  { code: 'KE', name: 'Kenya', currency: 'KES' },
  { code: 'UK', name: 'United Kingdom', currency: 'GBP' },
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS' },
  { code: 'UG', name: 'Uganda', currency: 'UGX' },
  { code: 'RW', name: 'Rwanda', currency: 'RWF' },
];

export const FLUTTERWAVE_BANKS: FlutterwaveBank[] = [
  // Nigeria (NG) - Popular Banks & MFBs
  { id: 1, code: '044', name: 'Access Bank', country: 'NG' },
  { id: 2, code: '063', name: 'Access Bank (Diamond)', country: 'NG' },
  { id: 3, code: '058', name: 'Guaranty Trust Bank (GTBank / GTCO)', country: 'NG' },
  { id: 4, code: '057', name: 'Zenith Bank', country: 'NG' },
  { id: 5, code: '011', name: 'First Bank of Nigeria', country: 'NG' },
  { id: 6, code: '033', name: 'United Bank for Africa (UBA)', country: 'NG' },
  { id: 7, code: '50515', name: 'Moniepoint Microfinance Bank', country: 'NG' },
  { id: 8, code: '999992', name: 'OPay Digital Services Limited', country: 'NG' },
  { id: 9, code: '999991', name: 'PalmPay Limited', country: 'NG' },
  { id: 10, code: '50211', name: 'Kuda Microfinance Bank', country: 'NG' },
  { id: 11, code: '070', name: 'Fidelity Bank', country: 'NG' },
  { id: 12, code: '214', name: 'First City Monument Bank (FCMB)', country: 'NG' },
  { id: 13, code: '232', name: 'Sterling Bank', country: 'NG' },
  { id: 14, code: '035', name: 'Wema Bank (ALAT)', country: 'NG' },
  { id: 15, code: '221', name: 'Stanbic IBTC Bank', country: 'NG' },
  { id: 16, code: '050', name: 'Ecobank Nigeria', country: 'NG' },
  { id: 17, code: '032', name: 'Union Bank of Nigeria', country: 'NG' },
  { id: 18, code: '076', name: 'Polaris Bank', country: 'NG' },
  { id: 19, code: '082', name: 'Keystone Bank', country: 'NG' },
  { id: 20, code: '215', name: 'Unity Bank', country: 'NG' },
  { id: 21, code: '030', name: 'Heritage Bank', country: 'NG' },
  { id: 22, code: '068', name: 'Standard Chartered Bank', country: 'NG' },
  { id: 23, code: '023', name: 'Citibank Nigeria', country: 'NG' },
  { id: 24, code: '102', name: 'Titan Trust Bank', country: 'NG' },
  { id: 25, code: '125', name: 'Rubies Microfinance Bank', country: 'NG' },
  { id: 26, code: '566', name: 'VFD Microfinance Bank (VBank)', country: 'NG' },
  { id: 27, code: '51310', name: 'Sparkle Microfinance Bank', country: 'NG' },
  { id: 28, code: '50971', name: 'FairMoney Microfinance Bank', country: 'NG' },
  { id: 29, code: '50126', name: 'Eyowo Microfinance Bank', country: 'NG' },
  { id: 30, code: '50383', name: 'Carbon / One Finance', country: 'NG' },

  // Ghana (GH)
  { id: 101, code: 'GH01', name: 'GCB Bank Limited', country: 'GH' },
  { id: 102, code: 'GH02', name: 'Ecobank Ghana', country: 'GH' },
  { id: 103, code: 'GH03', name: 'Absa Bank Ghana', country: 'GH' },
  { id: 104, code: 'GH04', name: 'Fidelity Bank Ghana', country: 'GH' },
  { id: 105, code: 'GH05', name: 'MTN Mobile Money Ghana', country: 'GH' },
  { id: 106, code: 'GH06', name: 'Vodafone Cash Ghana', country: 'GH' },
  { id: 107, code: 'GH07', name: 'AirtelTigo Money Ghana', country: 'GH' },

  // Kenya (KE)
  { id: 201, code: 'KE01', name: 'M-PESA (Safaricom)', country: 'KE' },
  { id: 202, code: 'KE02', name: 'KCB Bank Kenya', country: 'KE' },
  { id: 203, code: 'KE03', name: 'Equity Bank Kenya', country: 'KE' },
  { id: 204, code: 'KE04', name: 'Co-operative Bank of Kenya', country: 'KE' },
  { id: 205, code: 'KE05', name: 'Absa Bank Kenya', country: 'KE' },
  { id: 206, code: 'KE06', name: 'Standard Chartered Kenya', country: 'KE' },

  // United Kingdom (UK)
  { id: 301, code: 'UK01', name: 'Barclays Bank UK', country: 'UK' },
  { id: 302, code: 'UK02', name: 'HSBC UK Bank', country: 'UK' },
  { id: 303, code: 'UK03', name: 'Lloyds Bank', country: 'UK' },
  { id: 304, code: 'UK04', name: 'NatWest Bank', country: 'UK' },
  { id: 305, code: 'UK05', name: 'Revolut UK / EU', country: 'UK' },
  { id: 306, code: 'UK06', name: 'Monzo Bank UK', country: 'UK' },

  // United States (US)
  { id: 401, code: 'US01', name: 'JPMorgan Chase Bank', country: 'US' },
  { id: 402, code: 'US02', name: 'Bank of America', country: 'US' },
  { id: 403, code: 'US03', name: 'Wells Fargo', country: 'US' },
  { id: 404, code: 'US04', name: 'Citibank US', country: 'US' },
  { id: 405, code: 'US05', name: 'US Bank / Mercury / Relay', country: 'US' },
];

export function getCurrencyByCountry(countryCode: string): string {
  const country = FLUTTERWAVE_COUNTRIES.find((c) => c.code === countryCode);
  return country ? country.currency : 'NGN';
}

export function getBanksByCountry(countryCode: string): FlutterwaveBank[] {
  const list = FLUTTERWAVE_BANKS.filter((b) => b.country === countryCode);
  if (list.length === 0) {
    // Fallback to all if custom country
    return FLUTTERWAVE_BANKS;
  }
  return list;
}
