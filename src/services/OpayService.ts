/**
 * OPay Pay-In Gateway Client Service
 * 
 * Provides secure client-side methods to initiate and verify OPay Pay-In deposits.
 * Note: Secret keys are strictly handled on the backend (Express server / Cloud Function).
 */

export interface OpayInitResponse {
  status: boolean;
  cashierUrl?: string;
  reference?: string;
  orderNo?: string;
  amount?: number;
  message?: string;
  isTestMode?: boolean;
}

export interface OpayVerifyResponse {
  status: boolean;
  verified?: boolean;
  already_processed?: boolean;
  amount?: number;
  reference?: string;
  message?: string;
}

export class OpayService {
  /**
   * Initializes an OPay Cashier payment session via secure backend.
   * Never exposes secret keys to the browser.
   */
  static async initializePayment(amount: number, userId: string, phone?: string): Promise<OpayInitResponse> {
    if (!amount || amount <= 0) {
      throw new Error('Please enter a valid deposit amount greater than 0.');
    }
    if (!userId) {
      throw new Error('User identification is required to process wallet deposit.');
    }

    const domain = typeof window !== 'undefined' ? window.location.origin : 'https://e-fado.com';

    try {
      const response = await fetch('/api/opay/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          userId,
          phone,
          domain
        })
      });

      const data = await response.json();

      if (data.status && data.cashierUrl) {
        return {
          status: true,
          cashierUrl: data.cashierUrl,
          reference: data.reference,
          orderNo: data.orderNo,
          amount,
          isTestMode: data.isTestMode
        };
      } else {
        throw new Error(data.message || 'Could not generate OPay checkout link.');
      }
    } catch (err: any) {
      console.error('[OpayService] Initialization failed:', err);
      throw err;
    }
  }

  /**
   * Queries payment status from backend verification endpoint.
   */
  static async verifyPayment(
    reference: string,
    userId?: string,
    amount?: number,
    status?: string,
    simulated?: boolean
  ): Promise<OpayVerifyResponse> {
    if (!reference) {
      return { status: false, message: 'Missing transaction reference' };
    }

    try {
      const params = new URLSearchParams();
      if (userId) params.set('userId', userId);
      if (amount) params.set('amount', String(amount));
      if (status) params.set('status', status);
      if (simulated) params.set('simulated', 'true');

      const url = `/api/opay/status/${encodeURIComponent(reference)}?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (err: any) {
      console.error('[OpayService] Verification error:', err);
      return {
        status: false,
        message: err.message || 'Network error verifying payment status'
      };
    }
  }
}
