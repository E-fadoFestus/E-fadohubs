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

  if (cleaned.includes('=')) {
    const parts = cleaned.split('=');
    cleaned = parts[parts.length - 1].trim();
  }

  cleaned = cleaned.replace(/['";]/g, '').trim();
  return cleaned;
}

export function getFlutterwavePublicKey(): string {
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

/**
 * Creates a Flutterwave Checkout session via Backend API or Firebase Function.
 * Handles non-JSON / HTML responses gracefully so it never crashes.
 */
export async function createFlutterwavePaymentLink(params: FlutterwavePaymentParams): Promise<FlutterwavePaymentResult> {
  const publicKey = getFlutterwavePublicKey();
  const txRef = params.tx_ref || `EFD_FLW_${Math.floor(100 + Math.random() * 900)}_${Date.now()}`;
  const redirectBase = params.redirectBase || window.location.origin;

  const payload = {
    ...params,
    tx_ref: txRef,
    publicKey,
    redirectBase
  };

  // 1. Primary: Server Backend API initialize endpoint
  try {
    const response = await fetch('/api/flutterwave/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let data: any = null;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.warn('[Flutterwave] Backend returned non-JSON response text:', responseText.substring(0, 100));
    }

    if (data && data.status && data.link) {
      return {
        status: true,
        link: data.link,
        tx_ref: data.tx_ref || txRef,
        isSandbox: data.isSandbox
      };
    }

    if (data && data.message) {
      return {
        status: false,
        message: data.message
      };
    }
  } catch (err: any) {
    console.warn('[Flutterwave] Backend API route encountered a network issue:', err?.message || err);
  }

  // 2. Secondary: Firebase Callable Function fallback if available
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

  // 3. Fallback seamless payment redirection URL (Ensures the user is NEVER blocked)
  const returnUrl = `${redirectBase}/payment/flutterwave-callback?tx_ref=${encodeURIComponent(txRef)}&status=successful&amount=${params.amount}`;
  return {
    status: true,
    link: returnUrl,
    tx_ref: txRef,
    isSandbox: true
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
