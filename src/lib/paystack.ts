import crypto from 'crypto';

// Server-side Paystack Secret Key (Never expose to frontend or log)
export const paystackSecret = (process.env.PAYSTACK_SECRET_KEY || '').trim();

/**
 * Helper to ensure secret key is available in server environment
 */
function getSecret(): string {
  const secret = process.env.PAYSTACK_SECRET_KEY || paystackSecret;
  if (!secret) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured in server environment.');
  }
  return secret.trim();
}

/**
 * Standard Paystack API Request Wrapper
 */
async function paystackRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const secret = getSecret();
  const url = endpoint.startsWith('http') ? endpoint : `https://api.paystack.co${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${secret}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const rawText = await response.text();
  let data: any = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { raw: rawText };
  }

  if (!response.ok) {
    const errorMsg = data?.message || `Paystack request failed with status ${response.status}`;
    const error: any = new Error(errorMsg);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

/**
 * 1. Initialize Paystack Payment
 * Converts amount in Naira to Kobo (amountInNaira * 100)
 */
export async function initializePaystackPayment(
  email: string,
  amountInNaira: number,
  reference: string,
  metadata: Record<string, any> = {},
  callback_url: string = 'https://www.e-fado.com/payment/callback'
) {
  if (!email || !amountInNaira || amountInNaira <= 0 || !reference) {
    throw new Error('email, positive amountInNaira, and reference are required to initialize Paystack payment.');
  }

  const amountInKobo = Math.round(amountInNaira * 100);

  const payload = {
    email: email.trim().toLowerCase(),
    amount: amountInKobo,
    reference: reference.trim(),
    callback_url,
    currency: 'NGN',
    channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
    metadata: {
      ...metadata,
      reference: reference.trim(),
      amountInNaira
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
  const cleanRef = encodeURIComponent(reference.trim());
  return await paystackRequest(`/transaction/verify/${cleanRef}`, {
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
  return await paystackRequest(`/bank?country=${encodeURIComponent(country)}&perPage=${perPage}`, {
    method: 'GET'
  });
}

/**
 * 5. Resolve Bank Account Number to Account Name
 */
export async function resolveAccountNumber(account_number: string, bank_code: string) {
  if (!account_number || !bank_code) {
    throw new Error('account_number and bank_code are required to resolve bank account.');
  }
  const cleanAccount = account_number.trim();
  const cleanBank = bank_code.trim();
  return await paystackRequest(`/bank/resolve?account_number=${encodeURIComponent(cleanAccount)}&bank_code=${encodeURIComponent(cleanBank)}`, {
    method: 'GET'
  });
}

/**
 * 6. Check Paystack Balance (in Kobo)
 */
export async function getPaystackBalance() {
  return await paystackRequest('/balance', {
    method: 'GET'
  });
}

/**
 * 7. Create or Retrieve Transfer Recipient
 */
export async function createTransferRecipient(name: string, account_number: string, bank_code: string) {
  const payload = {
    type: 'nuban',
    name: name.trim(),
    account_number: account_number.trim(),
    bank_code: bank_code.trim(),
    currency: 'NGN'
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
  return await paystackRequest(`/transfer/${encodeURIComponent(transfer_code.trim())}`, {
    method: 'GET'
  });
}

/**
 * 10. Verify Transfer by reference
 */
export async function verifyTransfer(reference: string) {
  return await paystackRequest(`/transfer/verify/${encodeURIComponent(reference.trim())}`, {
    method: 'GET'
  });
}
