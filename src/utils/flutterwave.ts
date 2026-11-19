import { auth, functions, httpsCallable } from '../firebase';
import { getBackendUrl } from '../config/backend';

export interface FlutterwavePaymentParams {
  amount: number;
  currency?: string;
  email: string;
  name?: string;
  phone?: string;
  tx_ref?: string;
  purpose?: string;
  redirectBase?: string;
  redirect_url?: string;
  userId?: string;
  meta?: Record<string, any>;
  customizations?: {
    title?: string;
    description?: string;
    logo?: string;
  };
}

export interface FlutterwavePaymentResult {
  status: boolean;
  link?: string;
  tx_ref?: string;
  message?: string;
  isSandbox?: boolean;
}

export function sanitizeKey(rawKey: string): string {
  if (!rawKey) return '';
  let cleaned = rawKey.trim();

  if (cleaned.includes('=')) {
    const parts = cleaned.split('=');
    cleaned = parts[parts.length - 1].trim();
  }

  cleaned = cleaned.replace(/['";]/g, '').trim();
  return cleaned;
}

export function getFlutterwavePublicKey(): string {
  const rawEnvKey = (
    import.meta.env.VITE_FLUTTERWAVE_CLIENT_ID ||
    import.meta.env.VITE_FLW_PUBLIC_KEY ||
    import.meta.env.VITE_FLW_CLIENT_ID ||
    import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY ||
    ''
  ).trim();

  if (rawEnvKey) {
    const sanitizedEnv = sanitizeKey(rawEnvKey);
    if (sanitizedEnv) {
      return sanitizedEnv;
    }
  }

  const localKey = typeof localStorage !== 'undefined' ? localStorage.getItem('efado_flw_public_key') : null;
  if (localKey && localKey.trim()) {
    const sanitizedLocal = sanitizeKey(localKey);
    if (sanitizedLocal) {
      return sanitizedLocal;
    }
  }

  return '';
}

export function saveFlutterwavePublicKey(key: string): void {
  const trimmed = key.trim();
  if (trimmed) {
    localStorage.setItem('efado_flw_public_key', trimmed);
  } else {
    localStorage.removeItem('efado_flw_public_key');
  }
}

export function clearFlutterwaveKeys(): void {
  localStorage.removeItem('efado_flw_public_key');
}

/**
 * Creates a Flutterwave Checkout session via the Vercel/Express `/api/payments/initialize` backend.
 * Uses the deployment's configured Flutterwave V3 or V4 environment secrets.
 */
export async function createFlutterwavePaymentLink(
  params: FlutterwavePaymentParams
): Promise<FlutterwavePaymentResult> {
  const publicKey = getFlutterwavePublicKey();
  const txRef = params.tx_ref || `EFD_FLW_${Math.floor(100 + Math.random() * 900)}_${Date.now()}`;
  const redirectBase = params.redirectBase || window.location.origin;
  const resolvedUserId = params.userId || params.meta?.userId || auth.currentUser?.uid || 'guest';

  const payload = {
    ...params,
    userId: resolvedUserId,
    tx_ref: txRef,
    publicKey,
    redirectBase
  };

  let lastErrorMsg = 'Failed to initialize Flutterwave payment session.';

  // 1. Primary: Unified Vercel / Express backend (`/api/payments/initialize`)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 14000);
    const response = await fetch(getBackendUrl('/api/payments/initialize'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timer);

    const responseText = await response.text();
    let data: any = null;
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch {
      console.warn('[Flutterwave] Backend returned non-JSON response:', responseText.substring(0, 120));
    }

    if (response.ok && data && (data.status || data.success) && data.link) {
      return {
        status: true,
        link: data.link,
        tx_ref: data.tx_ref || txRef,
        isSandbox: data.isSandbox
      };
    }

    if (data?.message || data?.error) {
      lastErrorMsg = data.message || data.error;
    }
  } catch (err: any) {
    lastErrorMsg =
      err?.name === 'AbortError'
        ? 'Connection to Flutterwave timed out. Please try again.'
        : err?.message || lastErrorMsg;
    console.warn('[Flutterwave] Primary /api/payments/initialize error:', lastErrorMsg);
  }

  // 2. Secondary: Firebase Callable Function fallback if deployed
  try {
    if (functions) {
      const createPaymentFn = httpsCallable<any, any>(functions, 'createFlutterwavePayment');
      const fnResponse = await createPaymentFn(payload);
      const fnData = fnResponse.data;
      if (fnData && (fnData.link || fnData.status)) {
        return {
          status: true,
          link: fnData.link,
          tx_ref: fnData.tx_ref || txRef
        };
      }
    }
  } catch (fnErr: any) {
    console.warn('[Flutterwave] Firebase Function fallback error:', fnErr?.message || fnErr);
  }

  return {
    status: false,
    message: lastErrorMsg
  };
}

/**
 * High-level checkout helper that initiates the session and redirects the browser
 * directly to the Flutterwave hosted checkout screen.
 */
export async function startFlutterwaveCheckout(params: FlutterwavePaymentParams): Promise<void> {
  const result = await createFlutterwavePaymentLink(params);
  if (result.status && result.link) {
    window.location.href = result.link;
  } else {
    throw new Error(result.message || 'Could not initiate payment session.');
  }
}
