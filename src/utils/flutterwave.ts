import { functions, httpsCallable } from '../firebase';

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

  // Handle KEY_NAME=VAL format if user pasted entire env line
  if (cleaned.includes('=')) {
    const parts = cleaned.split('=');
    cleaned = parts[parts.length - 1].trim();
  }

  // Remove surrounding quotes, double quotes, whitespace, or trailing semicolons
  cleaned = cleaned.replace(/['";]/g, '').trim();

  if (!cleaned) return '';

  const upper = cleaned.toUpperCase();

  // If public key is provided or starts with FLWPUBK
  if (upper.startsWith('FLWPUBK')) {
    return cleaned;
  }

  return cleaned;
}

export function getFlutterwavePublicKey(): string {
  // 1. Priority 1: Check environment variables (Vite public key / Client ID)
  const rawEnvKey = (
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

  // 2. Priority 2: Check browser localStorage override
  const localKey = localStorage.getItem('efado_flw_public_key');
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

export function isTestKey(key?: string): boolean {
  const activeKey = key || getFlutterwavePublicKey();
  return activeKey.toUpperCase().includes('TEST');
}

export function isDefaultOrInvalidKey(key?: string): boolean {
  const activeKey = key || getFlutterwavePublicKey();
  return !activeKey;
}

/**
 * Creates a Flutterwave V4 Checkout session via Firebase Cloud Functions or Backend API.
 * The Flutterwave Client Secret and Encryption Key remain strictly secured on the backend.
 */
export async function createFlutterwavePaymentLink(params: FlutterwavePaymentParams): Promise<FlutterwavePaymentResult> {
  const publicKey = getFlutterwavePublicKey();
  const payload = {
    ...params,
    publicKey,
    redirectBase: params.redirectBase || window.location.origin
  };

  // 1. Attempt Firebase Callable Function first (Step 1 requirement)
  try {
    if (functions) {
      const createPaymentFn = httpsCallable<any, any>(functions, 'createFlutterwavePayment');
      const response = await createPaymentFn(payload);
      const data = response.data;
      if (data && (data.link || data.status)) {
        return {
          status: true,
          link: data.link,
          tx_ref: data.tx_ref
        };
      }
    }
  } catch (fnErr: any) {
    console.warn('[Flutterwave] Firebase function unavailable or error, falling back to server API endpoint:', fnErr?.message || fnErr);
  }

  // 2. Fallback to Express backend server endpoint
  try {
    const response = await fetch('/api/flutterwave/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data.status && data.link) {
      return {
        status: true,
        link: data.link,
        tx_ref: data.tx_ref,
        isSandbox: data.isSandbox
      };
    }

    return {
      status: false,
      message: data.message || 'Payment initialization was rejected by Flutterwave gateway.'
    };
  } catch (err: any) {
    return {
      status: false,
      message: err.message || 'Unable to connect to Flutterwave payment gateway.'
    };
  }
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
    throw new Error(result.message || 'Could not initiate Flutterwave payment link.');
  }
}
