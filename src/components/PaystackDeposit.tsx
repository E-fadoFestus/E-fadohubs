import React, { useState, useEffect } from 'react';
import {
  Loader2,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  Zap,
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
        reject(new Error('Timed out loading Paystack Checkout SDK (https://js.paystack.co/v1/inline.js).'));
      }
    }, 100);

    const existing = document.querySelector('script[src*="js.paystack.co/v1/inline.js"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener(
        'error',
        () => {
          clearInterval(pollInterval);
          reject(new Error('Failed to load Paystack Checkout script. Check network or ad-blocker.'));
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
      reject(new Error('Failed to load Paystack Checkout script (https://js.paystack.co/v1/inline.js).'));
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

  // Preload Paystack Inline SDK in the background
  useEffect(() => {
    if (getPaystackPublicKey()) {
      loadPaystackInlineScript().catch((err) => {
        console.warn('Paystack script preload notice:', err?.message || err);
      });
    }
  }, []);

  const showError = (errOrMsg: unknown, debugPayload?: unknown) => {
    const msg = extractErrorMessage(errOrMsg, 'Payment failed, please try again.');
    if (debugPayload !== undefined) {
      console.error('Paystack deposit error:', msg, debugPayload);
    } else {
      console.error('Paystack deposit error:', msg);
    }
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
      return await Promise.race([
        currentUser.getIdToken(),
        new Promise<string>((_, reject) =>
          setTimeout(
            () => reject(new Error('Authentication session timed out. Please refresh and log in again.')),
            8000
          )
        )
      ]);
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
      setStatusMessage('Verifying payment on Paystack server & crediting pocket...');
      setErrorMessage(null);

      if (!token) {
        throw new Error('Authentication required to verify payment with server.');
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
        console.error('Paystack verify failed:', verifyRes.status, verifyData ?? verifyRawText);
        const message = extractErrorMessage(
          verifyData ?? verifyRawText,
          'Server could not verify and credit payment. Wallet was NOT credited.'
        );
        throw new Error(message);
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

      const msg = `Deposit verified & credited! ${formatCurrencyAmount(verifiedAmount, verifiedCurrency)} added to your ${verifiedCurrency} Pocket (Ref: ${paidRef}).`;
      setIsRedirecting(false);
      setStatusMessage(null);
      setSuccessMessage(msg);
      setToast({ type: 'success', message: msg });
    } catch (err: any) {
      showError(
        err?.name === 'AbortError'
          ? `Verification timed out. Check wallet history or retry with ref: ${paidRef}`
          : extractErrorMessage(err, `Payment verification failed for ref: ${paidRef}.`),
        err
      );
    }
  };

  const handleFundWallet = async () => {
    setErrorMessage(null);
    setStatusMessage(null);
    setSuccessMessage(null);
    setCheckoutUrl(null);

    if (isDisabledFutureCurrency(currency)) {
      showError('SIRA (Burkina Faso) is Coming Soon — planned currency, not yet in circulation.');
      return;
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount < minDeposit) {
      showError(`Please enter a valid deposit amount of at least ${formatCurrencyAmount(minDeposit, currency)}.`);
      return;
    }
    if (numericAmount > 10000000) {
      showError(`Maximum single deposit limit is ${formatCurrencyAmount(10000000, currency)}.`);
      return;
    }

    const amountInMinorUnits = Math.round(numericAmount * 100);
    if (!Number.isInteger(amountInMinorUnits) || amountInMinorUnits <= 0) {
      showError('Invalid deposit amount. Please enter a valid positive number.');
      return;
    }

    const rawEmail = (user?.email || auth.currentUser?.email || '').trim().toLowerCase();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail);
    const customerEmail = isValidEmail
      ? rawEmail
      : user?.uid
        ? `${user.uid}@efado.com`
        : '';

    if (!customerEmail) {
      showError('Your account email is missing. Please sign in or add an email address in your profile.');
      return;
    }

    setIsRedirecting(true);
    setStatusMessage(`Initializing Paystack (${currency}) checkout...`);

    try {
      const token = await getAuthTokenSafely();
      if (!token) {
        throw new Error('Please log in to initialize payment.');
      }

      const publicKey = getPaystackPublicKey();

      // Method 1: Paystack Inline Checkout (PaystackPop) when public key is configured
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
              amount: numericAmount,
              amount_in_kobo: amountInMinorUnits,
              currency
            }),
            signal: initController.signal
          });
          clearTimeout(initTimer);
          const { data: initData, rawText: initRawText } = await readResponseSafely(initRes);
          if (!initRes.ok) {
            console.error('Paystack initialize error:', initRes.status, initData ?? initRawText);
            throw new Error(
              extractErrorMessage(
                initData ?? initRawText,
                `Failed to pre-register transaction on server (HTTP ${initRes.status}).`
              )
            );
          }
          activeRef = initData?.reference || initData?.data?.reference || '';
          fallbackAuthUrl = initData?.authorization_url || initData?.data?.authorization_url || '';
        } catch (preInitErr: any) {
          clearTimeout(initTimer);
          throw new Error(
            preInitErr?.name === 'AbortError'
              ? 'Server timed out initializing Paystack transaction. Please try again.'
              : extractErrorMessage(preInitErr, 'Could not initialize Paystack transaction.')
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
            setStatusMessage('Redirecting to Paystack secure checkout...');
            window.location.assign(fallbackAuthUrl);
            return;
          }
          throw scriptErr;
        }

        if (!window.PaystackPop || typeof window.PaystackPop.setup !== 'function') {
          if (fallbackAuthUrl) {
            setCheckoutUrl(fallbackAuthUrl);
            setStatusMessage('Redirecting to Paystack secure checkout...');
            window.location.assign(fallbackAuthUrl);
            return;
          }
          throw new Error('Paystack Checkout SDK did not initialize properly.');
        }

        const handler = window.PaystackPop.setup({
          key: publicKey,
          email: customerEmail,
          amount: amountInMinorUnits,
          currency,
          ref: activeRef,
          metadata: {
            userId: user?.uid || auth.currentUser?.uid || '',
            currency,
            custom_fields: [
              {
                display_name: 'User ID',
                variable_name: 'user_id',
                value: user?.uid || auth.currentUser?.uid || ''
              },
              {
                display_name: 'Wallet Pocket',
                variable_name: 'currency',
                value: currency
              }
            ]
          },
          callback: (response) => {
            const verifiedRef = response?.reference || response?.trxref || activeRef;
            void handlePaystackPaymentSuccess(verifiedRef, numericAmount, currency, token);
          },
          onClose: () => {
            setIsRedirecting(false);
            setStatusMessage(null);
            if (onCancel) onCancel();
            setErrorMessage('Payment window closed before completion.');
          }
        });

        setStatusMessage('Opening Paystack Checkout modal...');
        handler.openIframe();
        return;
      }

      // Method 2: Backend Initialize & Redirect
      setStatusMessage(`Redirecting to Paystack (${currency})...`);
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
          amount: numericAmount,
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
        console.error('Paystack initialize error:', response.status, data ?? rawText);
        const baseMsg = extractErrorMessage(
          data ?? rawText,
          `Failed to initialize Paystack checkout (HTTP ${response.status}).`
        );
        const helpfulMsg = baseMsg.includes('PAYSTACK_SECRET_KEY')
          ? 'Paystack keys are not configured. Set PAYSTACK_SECRET_KEY in server environment.'
          : baseMsg;

        showError(helpfulMsg, data ?? rawText);
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
        showError('Connection to Paystack timed out after 12 seconds. Please try again.', err);
        return;
      }
      showError(extractErrorMessage(err, 'Payment failed to initialize. Please try again.'), err);
    }
  };

  const parsedAmount = Number(amount);
  const formattedDisplay =
    Number.isFinite(parsedAmount) && parsedAmount > 0
      ? formatCurrencyAmount(parsedAmount, currency)
      : formatCurrencyAmount(0, currency);

  return (
    <div id="paystack-fund-card" className="space-y-6 relative">
      {toast && (
        <div
          role="alert"
          className={`fixed top-5 right-5 z-[100] max-w-sm p-4 rounded-2xl shadow-2xl border flex items-start gap-3 animate-in fade-in ${
            toast.type === 'error'
              ? 'bg-rose-950 text-rose-100 border-rose-500/60'
              : 'bg-emerald-950 text-emerald-100 border-emerald-500/60'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div className="text-xs font-bold flex-1 leading-relaxed">{toast.message}</div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 p-5 rounded-2xl text-white shadow-xl relative overflow-hidden border border-emerald-700/50">
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              Paystack Multi-Currency Fund Terminal
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {currency} Pocket
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Fund your <strong className="text-white">{curMeta.name} ({currency})</strong> pocket directly. Deposits are verified atomically on the server — never mixed with other currencies.
          </p>
        </div>
      </div>

      {/* Pocket Currency Selector (9 Active + 1 Coming Soon Disabled) */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
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
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-md'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-emerald-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{c.flag}</span>
                  <span className={`text-[10px] font-black ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {c.symbol}
                  </span>
                </div>
                <p className="text-xs font-black mt-1">{c.code}</p>
              </button>
            );
          })}

          {FUTURE_WALLET_CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              disabled
              title={c.note}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed text-left relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm grayscale">{c.flag}</span>
                <Lock className="w-3 h-3 text-slate-400" />
              </div>
              <p className="text-xs font-black mt-1">{c.code}</p>
              <span className="text-[9px] font-bold uppercase text-amber-600 block">Coming Soon</span>
            </button>
          ))}
        </div>
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Enter Deposit Amount ({currency}) — Min {formatCurrencyAmount(minDeposit, currency)}
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-black text-slate-400">
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
            className="w-full pl-14 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
          />
        </div>

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
              className={`py-2.5 px-2 border rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                amount === val.toString()
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-md scale-[1.02]'
                  : 'border-slate-200 text-slate-700 hover:border-emerald-400 bg-white hover:bg-slate-50'
              }`}
            >
              {amount === val.toString() && <Check className="w-3 h-3 text-white" />}
              {curMeta.symbol}{val >= 1000 ? `${val / 1000}k` : val}
            </button>
          ))}
        </div>
      </div>

      {/* Status, Success, Checkout Link & Error Notifications */}
      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-900 text-xs animate-in fade-in">
          <Loader2 className="w-4 h-4 text-emerald-600 animate-spin flex-shrink-0" />
          <div className="font-bold">{statusMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start gap-2.5 text-emerald-900 text-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="font-bold flex-1">{successMessage}</div>
        </div>
      )}

      {checkoutUrl && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 text-xs">
          <p className="font-bold text-indigo-900">
            If Paystack checkout did not open automatically, click below:
          </p>
          <a
            href={checkoutUrl}
            target="_top"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all"
          >
            <span>Open Paystack Checkout</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="font-bold flex-1">
            {extractErrorMessage(errorMessage, 'Payment failed, please try again.')}
          </div>
        </div>
      )}

      {/* FUND BUTTON */}
      <button
        id="paystack-fund-wallet-button"
        type="button"
        disabled={isRedirecting || isDisabledFutureCurrency(currency)}
        onClick={handleFundWallet}
        className="w-full py-4 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 hover:from-emerald-700 hover:to-teal-900 active:scale-[0.99] text-white font-black uppercase text-base tracking-wider rounded-2xl transition-all shadow-xl hover:shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isRedirecting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{statusMessage || 'Redirecting to Paystack...'}</span>
          </>
        ) : (
          <>
            <Zap className="w-5 h-5 fill-amber-300 text-amber-300" />
            <span>Fund {currency} Pocket {formattedDisplay}</span>
            <ArrowRight className="w-5 h-5 ml-1" />
          </>
        )}
      </button>

      <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center gap-2 pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>Atomic Verified Settlement • Pocket: wallets/{'{uid}'}/{currency}/depositWallet</span>
      </div>
    </div>
  );
};
