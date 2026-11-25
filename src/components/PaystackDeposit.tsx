import React, { useState, useEffect } from 'react';
import {
  Loader2,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ExternalLink,
  X,
  Lock
} from 'lucide-react';
import { UserProfile } from '../types';
import { auth } from '../firebase';
import {
  ACTIVE_WALLET_CURRENCIES,
  FUTURE_WALLET_CURRENCIES,
  formatCurrencyAmount,
  getMinDepositForCurrency,
  getWalletCurrencyMeta,
  isDisabledFutureCurrency,
  normalizeCurrencyCode
} from '../constants/walletCurrencies';
import { extractErrorMessage, readResponseSafely } from '../utils/errorFormat';

interface PaystackDepositProps {
  user: UserProfile;
  onSuccess?: (paymentInfo: {
    reference: string;
    amount: number;
    currency: string;
    alreadyCreditedByServer?: boolean;
  }) => void | Promise<void>;
  onCancel?: () => void;
  defaultAmount?: number;
  defaultCurrency?: string;
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: {
        key: string;
        email: string;
        amount: number;
        currency?: string;
        ref?: string;
        metadata?: Record<string, any>;
        callback: (response: { reference?: string; trxref?: string; status?: string; message?: string }) => void;
        onClose: () => void;
      }) => {
        openIframe: () => void;
      };
    };
    __PAYSTACK_PUBLIC_KEY__?: string;
  }
}

const getPaystackPublicKey = (): string => {
  const rawKey = (
    import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ||
    (typeof window !== 'undefined' ? window.__PAYSTACK_PUBLIC_KEY__ : '') ||
    ''
  ).trim();

  if (
    !rawKey ||
    rawKey === 'YOUR_PAYSTACK_PUBLIC_KEY' ||
    rawKey.includes('xxxx') ||
    !/^pk_(test|live)_[a-zA-Z0-9]+$/.test(rawKey)
  ) {
    return '';
  }
  return rawKey;
};

const loadPaystackInlineScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.PaystackPop) {
      resolve();
      return;
    }

    const timeoutMs = 10000;
    const startTime = Date.now();

    const pollInterval = setInterval(() => {
      if (window.PaystackPop) {
        clearInterval(pollInterval);
        resolve();
      } else if (Date.now() - startTime >= timeoutMs) {
        clearInterval(pollInterval);
        reject(new Error('Timed out loading Paystack Checkout.'));
      }
    }, 100);

    const existing = document.querySelector('script[src*="js.paystack.co/v1/inline.js"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener(
        'error',
        () => {
          clearInterval(pollInterval);
          reject(new Error('Failed to load Paystack Checkout. Check your connection or ad-blocker.'));
        },
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => {
      if (window.PaystackPop) {
        clearInterval(pollInterval);
        resolve();
      }
    };
    script.onerror = () => {
      clearInterval(pollInterval);
      reject(new Error('Failed to load Paystack Checkout.'));
    };
    document.head.appendChild(script);
  });
};

export const PaystackDeposit: React.FC<PaystackDepositProps> = ({
  user,
  onSuccess,
  onCancel,
  defaultAmount = 1000,
  defaultCurrency = 'NGN'
}) => {
  const initialCur = isDisabledFutureCurrency(defaultCurrency) ? 'NGN' : normalizeCurrencyCode(defaultCurrency);
  const [currency, setCurrency] = useState<string>(initialCur);
  const [amount, setAmount] = useState<string>(defaultAmount.toString());
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  useEffect(() => {
    const clean = normalizeCurrencyCode(defaultCurrency);
    if (clean && !isDisabledFutureCurrency(clean)) {
      setCurrency(clean);
    }
  }, [defaultCurrency]);

  const curMeta = getWalletCurrencyMeta(currency);
  const minDeposit = getMinDepositForCurrency(currency);
  const quickAmounts =
    currency === 'NGN'
      ? [1000, 2000, 5000, 10000, 20000, 50000]
      : currency === 'XOF'
        ? [1000, 2500, 5000, 10000, 25000, 50000]
        : [10, 25, 50, 100, 250, 500];

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 7000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (getPaystackPublicKey()) {
      loadPaystackInlineScript().catch(() => {});
    }
  }, []);

  const showError = (errOrMsg: unknown) => {
    const msg = extractErrorMessage(errOrMsg, 'Payment failed, please try again.');
    setIsRedirecting(false);
    setStatusMessage(null);
    setErrorMessage(msg);
    setToast({ type: 'error', message: msg });
  };

  const getAuthTokenSafely = async (): Promise<string> => {
    if (typeof (auth as any).authStateReady === 'function') {
      await Promise.race([
        (auth as any).authStateReady(),
        new Promise((resolve) => setTimeout(resolve, 4000))
      ]);
    }
    const currentUser = auth.currentUser;
    if (currentUser) {
      return await currentUser.getIdToken();
    }
    if (typeof (user as any)?.getIdToken === 'function') {
      return await (user as any).getIdToken();
    }
    return '';
  };

  const handlePaystackPaymentSuccess = async (
    paidRef: string,
    paidAmount: number,
    paidCurrency: string,
    token: string
  ) => {
    try {
      setStatusMessage('Confirming payment and crediting your pocket...');
      setErrorMessage(null);

      if (!token) {
        throw new Error('Please sign in again to verify this payment.');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 14000);

      let verifyRes: Response;
      let verifyData: any = null;
      let verifyRawText = '';
      try {
        verifyRes = await fetch(
          `/api/paystack/verify?reference=${encodeURIComponent(paidRef)}`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`
            },
            signal: controller.signal
          }
        );
        const parsed = await readResponseSafely(verifyRes);
        verifyData = parsed.data;
        verifyRawText = parsed.rawText;
      } finally {
        clearTimeout(timeoutId);
      }

      if (!verifyRes.ok || !verifyData?.success || verifyData?.credited === false) {
        throw new Error(
          extractErrorMessage(
            verifyData ?? verifyRawText,
            'We could not verify this payment yet. Your balance was not changed.'
          )
        );
      }

      const verifiedAmount = Number(verifyData.amount || paidAmount);
      const verifiedCurrency = normalizeCurrencyCode(verifyData.currency || paidCurrency);

      if (onSuccess) {
        await onSuccess({
          reference: paidRef,
          amount: verifiedAmount,
          currency: verifiedCurrency,
          alreadyCreditedByServer: true
        });
      }

      const msg = `Deposit successful! ${formatCurrencyAmount(verifiedAmount, verifiedCurrency)} added to your ${verifiedCurrency} Pocket.`;
      setIsRedirecting(false);
      setStatusMessage(null);
      setSuccessMessage(msg);
      setToast({ type: 'success', message: msg });
    } catch (err: any) {
      showError(
        err?.name === 'AbortError'
          ? `Verification timed out. Check your Activity page or retry with reference: ${paidRef}`
          : extractErrorMessage(err, `Payment verification failed for reference: ${paidRef}.`)
      );
    }
  };

  const parsedAmount = Number(amount);
  const isBelowMin = !Number.isFinite(parsedAmount) || parsedAmount < minDeposit;
  const formattedDisplay =
    Number.isFinite(parsedAmount) && parsedAmount > 0
      ? formatCurrencyAmount(parsedAmount, currency)
      : formatCurrencyAmount(0, currency);

  const handleFundWallet = async () => {
    setErrorMessage(null);
    setStatusMessage(null);
    setSuccessMessage(null);
    setCheckoutUrl(null);

    if (isDisabledFutureCurrency(currency)) {
      showError('SIRA (Burkina Faso) is Coming Soon and not yet enabled.');
      return;
    }

    if (isBelowMin) {
      showError(`Minimum deposit is ${formatCurrencyAmount(minDeposit, currency)}.`);
      return;
    }
    if (parsedAmount > 10000000) {
      showError(`Maximum single deposit limit is ${formatCurrencyAmount(10000000, currency)}.`);
      return;
    }

    const amountInMinorUnits = Math.round(parsedAmount * 100);
    const rawEmail = (user?.email || auth.currentUser?.email || '').trim().toLowerCase();
    const customerEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)
      ? rawEmail
      : user?.uid
        ? `${user.uid}@efado.com`
        : '';

    if (!customerEmail) {
      showError('Please add an email address in My Account Profile first.');
      return;
    }

    setIsRedirecting(true);
    setStatusMessage(`Preparing Paystack (${currency}) checkout...`);

    try {
      const token = await getAuthTokenSafely();
      if (!token) {
        throw new Error('Please log in to fund your account.');
      }

      const publicKey = getPaystackPublicKey();

      if (publicKey) {
        const initController = new AbortController();
        const initTimer = setTimeout(() => initController.abort(), 30000);
        let activeRef = '';
        let fallbackAuthUrl = '';
        try {
          const initRes = await fetch('/api/paystack/initialize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              amount: parsedAmount,
              amount_in_kobo: amountInMinorUnits,
              currency
            }),
            signal: initController.signal
          });
          clearTimeout(initTimer);
          const { data: initData, rawText: initRawText } = await readResponseSafely(initRes);
          if (!initRes.ok) {
            throw new Error(
              extractErrorMessage(
                initData ?? initRawText,
                `Could not start payment (HTTP ${initRes.status}).`
              )
            );
          }
          activeRef = initData?.reference || initData?.data?.reference || '';
          fallbackAuthUrl = initData?.authorization_url || initData?.data?.authorization_url || '';
        } catch (preInitErr: any) {
          clearTimeout(initTimer);
          throw new Error(
            preInitErr?.name === 'AbortError'
              ? 'Connection timed out while starting payment. Please try again.'
              : extractErrorMessage(preInitErr, 'Could not start Paystack payment.')
          );
        }

        if (!activeRef) {
          activeRef = `EFADO-FUND-${(user?.uid || 'USR').substring(0, 8)}-${Date.now()}`;
        }

        try {
          await loadPaystackInlineScript();
        } catch (scriptErr) {
          if (fallbackAuthUrl) {
            setCheckoutUrl(fallbackAuthUrl);
            setStatusMessage('Opening Paystack secure checkout...');
            window.location.assign(fallbackAuthUrl);
            return;
          }
          throw scriptErr;
        }

        if (!window.PaystackPop || typeof window.PaystackPop.setup !== 'function') {
          if (fallbackAuthUrl) {
            setCheckoutUrl(fallbackAuthUrl);
            setStatusMessage('Opening Paystack secure checkout...');
            window.location.assign(fallbackAuthUrl);
            return;
          }
          throw new Error('Paystack Checkout could not open.');
        }

        const handler = window.PaystackPop.setup({
          key: publicKey,
          email: customerEmail,
          amount: amountInMinorUnits,
          currency,
          ref: activeRef,
          metadata: {
            userId: user?.uid || auth.currentUser?.uid || '',
            currency
          },
          callback: (response) => {
            const verifiedRef = response?.reference || response?.trxref || activeRef;
            void handlePaystackPaymentSuccess(verifiedRef, parsedAmount, currency, token);
          },
          onClose: () => {
            setIsRedirecting(false);
            setStatusMessage(null);
            if (onCancel) onCancel();
            setErrorMessage('Payment window closed before completion.');
          }
        });

        setStatusMessage('Opening Paystack Checkout...');
        handler.openIframe();
        return;
      }

      setStatusMessage(`Opening Paystack (${currency}) checkout...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parsedAmount,
          amount_in_kobo: amountInMinorUnits,
          currency
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const { data, rawText } = await readResponseSafely(response);
      const authUrl: string | undefined = data?.authorization_url || data?.data?.authorization_url;
      const isOk = Boolean(response.ok && (data?.success || data?.status) && authUrl);

      if (!isOk || !authUrl) {
        const baseMsg = extractErrorMessage(
          data ?? rawText,
          `Could not start Paystack payment (HTTP ${response.status}).`
        );
        const helpfulMsg = baseMsg.includes('PAYSTACK_SECRET_KEY')
          ? 'Paystack keys are not configured yet on the server.'
          : baseMsg;
        showError(helpfulMsg);
        return;
      }

      setCheckoutUrl(authUrl);
      setStatusMessage('Redirecting to Paystack secure checkout...');
      window.location.assign(authUrl);

      setTimeout(() => {
        setIsRedirecting(false);
      }, 4000);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        showError('Connection timed out. Please try again.');
        return;
      }
      showError(extractErrorMessage(err, 'Payment could not be started. Please try again.'));
    }
  };

  return (
    <div id="paystack-fund-card" className="space-y-5 relative">
      {toast && (
        <div
          role="alert"
          className={`fixed top-5 right-5 z-[1100] max-w-sm p-4 rounded-2xl shadow-xl border flex items-start gap-3 ${
            toast.type === 'error'
              ? 'bg-red-50 text-[#DC2626] border-red-200'
              : 'bg-emerald-50 text-[#16A34A] border-emerald-200'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
          )}
          <div className="text-xs font-bold flex-1 leading-relaxed">{toast.message}</div>
          <button type="button" onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Secure Payment Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
          <span className="text-xs font-bold text-[#16A34A]">Secure Payment - Verified</span>
        </div>
        <span className="text-xs font-bold text-[#7C3AED] bg-white px-2.5 py-1 rounded-lg border border-purple-100">
          {curMeta.flag} {curMeta.name} ({currency})
        </span>
      </div>

      {/* Pocket Currency Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 block">
          Select Target Currency Pocket
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {ACTIVE_WALLET_CURRENCIES.map((c) => {
            const isSelected = currency === c.code;
            return (
              <button
                key={c.code}
                type="button"
                disabled={isRedirecting}
                onClick={() => {
                  setCurrency(c.code);
                  setErrorMessage(null);
                  const newMin = getMinDepositForCurrency(c.code);
                  if (!Number(amount) || Number(amount) < newMin) {
                    setAmount(String(newMin * 10));
                  }
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-[#7C3AED] bg-[#7C3AED] text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-900 hover:border-[#7C3AED]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{c.flag}</span>
                  <span className={`text-xs font-bold ${isSelected ? 'text-purple-100' : 'text-slate-500'}`}>
                    {c.symbol}
                  </span>
                </div>
                <p className={`text-xs font-bold mt-1 mb-0 max-w-none ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {c.code}
                </p>
              </button>
            );
          })}

          {FUTURE_WALLET_CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              disabled
              title={c.note}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 opacity-70 cursor-not-allowed text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm grayscale">{c.flag}</span>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-xs font-bold mt-1 mb-0 max-w-none text-slate-500">{c.code}</p>
              <span className="text-[11px] font-semibold text-slate-500 block">Coming Soon</span>
            </button>
          ))}
        </div>
      </div>

      {/* Deposit Amount Input */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 block">
          Enter Deposit Amount ({currency}) — Min {formatCurrencyAmount(minDeposit, currency)}
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-slate-500">
            {curMeta.symbol}
          </span>
          <input
            id="paystack-amount-input"
            type="number"
            min={minDeposit}
            max="10000000"
            step="any"
            placeholder={String(minDeposit * 10)}
            value={amount}
            disabled={isRedirecting}
            onChange={(e) => {
              setAmount(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-300 rounded-xl text-lg font-bold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED]"
          />
        </div>
        {amount !== '' && isBelowMin && (
          <p className="text-xs font-semibold text-[#DC2626] mb-0 max-w-none">
            Minimum deposit is {formatCurrencyAmount(minDeposit, currency)}
          </p>
        )}

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
          {quickAmounts.map((val) => (
            <button
              id={`paystack-quick-${val}`}
              key={val}
              type="button"
              disabled={isRedirecting}
              onClick={() => {
                setAmount(val.toString());
                if (errorMessage) setErrorMessage(null);
              }}
              className={`py-2.5 px-2 border rounded-xl text-xs font-bold tabular-nums transition-all flex items-center justify-center gap-1 ${
                amount === val.toString()
                  ? 'border-[#7C3AED] bg-[#7C3AED] text-white shadow-sm'
                  : 'border-slate-200 text-slate-800 hover:border-[#7C3AED] bg-white'
              }`}
            >
              {amount === val.toString() && <Check className="w-3.5 h-3.5 text-white" />}
              {curMeta.symbol}
              {val >= 1000 ? `${val / 1000}k` : val}
            </button>
          ))}
        </div>
      </div>

      {/* Fee Breakdown Line */}
      <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl text-center">
        <p className="text-xs font-semibold text-slate-700 mb-0 max-w-none tabular-nums">
          You pay <strong className="text-slate-900">{formattedDisplay}</strong> — You receive{' '}
          <strong className="text-[#16A34A]">{formattedDisplay}</strong> — No hidden fee
        </p>
      </div>

      {/* Status, Success, Checkout Link & Error Messages */}
      {statusMessage && (
        <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-2.5 text-[#7C3AED] text-xs font-bold">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-[#16A34A] text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {checkoutUrl && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-2 text-xs">
          <p className="font-bold text-slate-900 mb-0 max-w-none">
            If checkout did not open automatically, tap below:
          </p>
          <a
            href={checkoutUrl}
            target="_top"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#7C3AED] hover:bg-purple-700 text-white font-bold rounded-xl"
          >
            <span>Open Paystack Checkout</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-[#DC2626] text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{extractErrorMessage(errorMessage, 'Payment failed, please try again.')}</span>
        </div>
      )}

      {/* Sticky Bottom FUND CTA */}
      <div className="sticky bottom-16 sm:bottom-2 z-20 pt-2 bg-white/95 backdrop-blur-sm pb-1">
        <button
          id="paystack-fund-wallet-button"
          type="button"
          disabled={isRedirecting || isBelowMin || isDisabledFutureCurrency(currency)}
          onClick={handleFundWallet}
          className="w-full py-4 bg-[#16A34A] hover:bg-emerald-700 active:scale-[0.99] text-white font-bold uppercase text-sm sm:text-base tracking-wide rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed tabular-nums"
        >
          {isRedirecting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Opening Paystack...</span>
            </>
          ) : (
            <>
              <span>FUND {currency} POCKET {formattedDisplay}</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      <div className="text-center text-xs text-slate-500 font-medium flex items-center justify-center gap-1.5 pt-1">
        <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
        <span>Protected by 256-bit encryption • Compliance: PCI DSS, NDPR, GDPR</span>
      </div>
    </div>
  );
};
