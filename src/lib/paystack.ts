import crypto from 'crypto';

// Server-side Paystack Secret Key (Never expose to frontend or log)
export const paystackSecret = (process.env.PAYSTACK_SECRET_KEY || '').trim();

/**
 * Helper to ensure secret key is available in server environment
 */
function getSecret(): string {
  const raw =
    process.env.PAYSTACK_SECRET_KEY ||
    process.env.PAYSTACK_LIVE ||
    process.env.PAYSTACK_LIVE_SECRET_KEY ||
    process.env.PAYSTACK_SECRET ||
    process.env.VITE_PAYSTACK_SECRET_KEY ||
    paystackSecret ||
    '';
  return raw.trim().replace(/^['"]|['"]$/g, '').replace(/[;\s]/g, '');
}

/**
 * Standard Paystack API Request Wrapper
 */
async function paystackRequest<T = any>(endpoint: string, options: RequestInit = {}, timeoutMs: number = 10000): Promise<T> {
  const secret = getSecret();
  if (!secret) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured in server environment.');
  }

  const url = endpoint.startsWith('http') ? endpoint : `https://api.paystack.co${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${secret}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      const timeoutErr: any = new Error('Bank/Paystack gateway did not respond within 10 seconds. Please try again.');
      timeoutErr.status = 504;
      throw timeoutErr;
    }
    throw err;
  }
  clearTimeout(timeoutId);

  const rawText = await response.text();
  let data: any = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { raw: rawText };
  }

  if (!response.ok) {
    const rawMsg = data?.message ?? data?.error;
    const errorMsg =
      typeof rawMsg === 'string' && rawMsg.trim() && rawMsg.trim() !== '[object Object]'
        ? rawMsg.trim()
        : rawMsg && typeof rawMsg === 'object'
          ? (typeof rawMsg.message === 'string' ? rawMsg.message : JSON.stringify(rawMsg))
          : `Paystack request failed with status ${response.status}`;
    const error: any = new Error(errorMsg);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

/**
 * Standard Nigerian bank directory fallback list
 */
const FALLBACK_NIGERIAN_BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'Guaranty Trust Bank (GTBank / GTCO)', code: '058' },
  { name: 'Zenith Bank', code: '057' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'United Bank for Africa (UBA)', code: '033' },
  { name: 'Moniepoint Microfinance Bank', code: '50515' },
  { name: 'OPay Digital Services Limited', code: '999992' },
  { name: 'PalmPay Limited', code: '999991' },
  { name: 'Kuda Microfinance Bank', code: '50211' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First City Monument Bank (FCMB)', code: '214' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Wema Bank (ALAT)', code: '035' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Union Bank of Nigeria', code: '032' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Providus Bank', code: '101' },
  { name: 'FairMoney Microfinance Bank', code: '50971' },
  { name: 'Rubies Microfinance Bank', code: '125' },
  { name: 'VFD Microfinance Bank (VBank)', code: '566' }
];

/**
 * 1. Initialize Paystack Payment
 * Converts amount in major units to minor units (kobo/cents/pesewas * 100)
 */
export async function initializePaystackPayment(
  email: string,
  amountInMajorUnits: number,
  reference: string,
  metadata: Record<string, any> = {},
  callback_url: string = 'https://www.e-fado.com/payment/callback',
  currency: string = 'NGN'
) {
  if (!email || !amountInMajorUnits || amountInMajorUnits <= 0 || !reference) {
    throw new Error('email, positive amount, and reference are required to initialize Paystack payment.');
  }

  const normalizedCurrency = String(currency || 'NGN').trim().toUpperCase();
  if (normalizedCurrency === 'SIRA') {
    throw new Error('SIRA currency is coming soon and not yet enabled for payments.');
  }

  const secret = getSecret();
  if (!secret) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured in server environment.');
  }

  const amountInMinor = Math.round(amountInMajorUnits * 100);
  if (!Number.isInteger(amountInMinor) || amountInMinor <= 0) {
    throw new Error('Invalid payment amount.');
  }

  const payload = {
    email: email.trim().toLowerCase(),
    amount: amountInMinor,
    reference: reference.trim(),
    callback_url,
    currency: normalizedCurrency,
    channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
    metadata: {
      ...metadata,
      currency: normalizedCurrency,
      reference: reference.trim(),
      amountInMajorUnits
    }
  };

  return await paystackRequest('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * 2. Verify Paystack Payment by reference
 */
export async function verifyPaystackPayment(reference: string) {
  if (!reference || !reference.trim()) {
    throw new Error('reference is required to verify Paystack payment.');
  }
  const cleanRef = reference.trim();
  const secret = getSecret();
  if (!secret) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured in server environment.');
  }

  return await paystackRequest(`/transaction/verify/${encodeURIComponent(cleanRef)}`, {
    method: 'GET'
  });
}

/**
 * 3. Verify Paystack Webhook Signature using HMAC SHA512
 */
export function verifyPaystackSignature(rawBody: string | Buffer, signature: string | undefined): boolean {
  if (!signature || !rawBody) return false;
  try {
    const secret = getSecret();
    if (!secret) return false;
    const hash = crypto
      .createHmac('sha512', secret)
      .update(typeof rawBody === 'string' ? rawBody : Buffer.from(rawBody))
      .digest('hex');
    return hash === signature.trim();
  } catch (err) {
    console.error('[Paystack Signature Verification Error]:', err);
    return false;
  }
}

/**
 * 4. Get List of Nigerian Banks
 */
export async function getPaystackBanks(country: string = 'nigeria', perPage: number = 100) {
  const secret = getSecret();
  if (!secret) {
    return {
      status: true,
      data: FALLBACK_NIGERIAN_BANKS
    };
  }
  try {
    return await paystackRequest(`/bank?country=${encodeURIComponent(country)}&perPage=${perPage}`, {
      method: 'GET'
    });
  } catch (err) {
    console.warn('[Paystack Banks Request Warning] Falling back to standard bank list:', err);
    return {
      status: true,
      data: FALLBACK_NIGERIAN_BANKS
    };
  }
}

function normalizePaystackBankCode(code: string): string {
  const clean = String(code || '').trim();
  if (clean === '100004') return '999992'; // OPay
  if (clean === '100033') return '999991'; // PalmPay
  if (clean === '090267') return '50211';  // Kuda
  return clean;
}

/**
 * 5. Resolve Bank Account Number to Account Name
 */
export async function resolveAccountNumber(account_number: string, bank_code: string) {
  if (!account_number || !bank_code) {
    throw new Error('account_number and bank_code are required to resolve bank account.');
  }
  const cleanAccount = account_number.trim();
  const cleanBank = normalizePaystackBankCode(bank_code);
  const secret = getSecret();
  if (!secret) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured in server environment.');
  }
  return await paystackRequest(`/bank/resolve?account_number=${encodeURIComponent(cleanAccount)}&bank_code=${encodeURIComponent(cleanBank)}`, {
    method: 'GET'
  }, 10000);
}

/**
 * 6. Check Paystack Balance (in Kobo)
 */
export async function getPaystackBalance() {
  const secret = getSecret();
  if (!secret) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured in server environment.');
  }
  return await paystackRequest('/balance', {
    method: 'GET'
  });
}

/**
 * 7. Create or Retrieve Transfer Recipient
 */
export async function createTransferRecipient(name: string, account_number: string, bank_code: string, currency: string = 'NGN') {
  const secret = getSecret();
  if (!secret) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured in server environment.');
  }
  const payload = {
    type: 'nuban',
    name: name.trim(),
    account_number: account_number.trim(),
    bank_code: normalizePaystackBankCode(bank_code),
    currency: String(currency || 'NGN').toUpperCase()
  };

  return await paystackRequest('/transferrecipient', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * 8. Initiate Single Transfer (Withdrawal)
 */
export async function initiateTransfer(
  amountInNaira: number,
  recipient_code: string,
  reference: string,
  reason: string = 'EFADO Wallet Withdrawal'
) {
  const secret = getSecret();
  if (!secret) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured in server environment.');
  }
  const amountInKobo = Math.round(amountInNaira * 100);

  const payload = {
    source: 'balance',
    amount: amountInKobo,
    recipient: recipient_code.trim(),
    reference: reference.trim(),
    reason
  };

  return await paystackRequest('/transfer', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * 9. Get Transfer Status by transfer code or reference
 */
export async function getTransferStatus(transfer_code: string) {
  const secret = getSecret();
  if (!secret) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured in server environment.');
  }
  return await paystackRequest(`/transfer/${encodeURIComponent(transfer_code.trim())}`, {
    method: 'GET'
  });
}

/**
 * 10. Verify Transfer by reference
 */
export async function verifyTransfer(reference: string) {
  const secret = getSecret();
  if (!secret) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured in server environment.');
  }
  return await paystackRequest(`/transfer/verify/${encodeURIComponent(reference.trim())}`, {
    method: 'GET'
  });
}
