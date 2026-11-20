import React, { useState, useEffect, useRef } from 'react';
import {
  Loader2,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Wallet,
  ArrowUpRight,
  Check,
  Zap,
  ExternalLink,
  X,
  RefreshCw,
  Lock
} from 'lucide-react';
import { UserProfile } from '../types';
import { auth, db, doc, onSnapshot } from '../firebase';
import {
  ACTIVE_WALLET_CURRENCIES,
  FUTURE_WALLET_CURRENCIES,
  formatCurrencyAmount,
  getMinDepositForCurrency,
  getWalletCurrencyMeta,
  isDisabledFutureCurrency,
  normalizeCurrencyCode
} from '../constants/walletCurrencies';

interface FlutterwaveDepositProps {
  user: UserProfile;
  onSuccess: (paymentInfo: {
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
    FlutterwaveCheckout?: (options: any) => any;
  }
}

interface ActiveHostedPayState {
  url: string;
  tx_ref: string;
  amount: number;
  currency: string;
}

export const FlutterwaveDeposit: React.FC<FlutterwaveDepositProps> = ({
  user,
  onSuccess,
  defaultAmount = 1000,
  defaultCurrency = 'NGN'
}) => {
  const initialCur = isDisabledFutureCurrency(defaultCurrency) ? 'NGN' : normalizeCurrencyCode(defaultCurrency);
  const [currency, setCurrency] = useState<string>(initialCur);
  const [amount, setAmount] = useState<string>(defaultAmount.toString());
  const [isInitializing, setIsInitializing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [depositBalance, setDepositBalance] = useState<number>(
    user.walletPockets?.[initialCur] ?? (initialCur === 'NGN' ? user.depositWallet || 0 : 0)
  );
  const [activeHostedPay, setActiveHostedPay] = useState<ActiveHostedPayState | null>(null);

  const verificationPollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const clean = normalizeCurrencyCode(defaultCurrency);
    if (clean && !isDisabledFutureCurrency(clean)) {
      setCurrency(clean);
    }
  }, [defaultCurrency]);

  const curMeta = getWalletCurrencyMeta(currency);
  const minDeposit = getMinDepositForCurrency(currency);
  const quickAmountOptions =
    currency === 'NGN'
      ? [1000, 2000, 5000, 10000, 20000, 50000]
      : currency === 'XOF'
        ? [1000, 2500, 5000, 10000, 25000, 50000]
        : [10, 25, 50, 100, 250, 500];

  // Live balance listener ONLY from canonical path: wallets/{uid}/{currency}/depositWallet
  useEffect(() => {
    if (!user?.uid || isDisabledFutureCurrency(currency)) return;

    setDepositBalance(
      user.walletPockets?.[currency] ?? (currency === 'NGN' ? user.depositWallet || 0 : 0)
    );

    const unsubSub = onSnapshot(
      doc(db, 'wallets', user.uid, currency, 'depositWallet'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const bal = Number(data?.balance ?? data?.depositWallet ?? 0) || 0;
          setDepositBalance(bal);
        } else {
          setDepositBalance(0);
        }
      },
      (err) => {
        console.warn(`[FlutterwaveDeposit] Canonical pocket listener notice (${currency}):`, err?.message || err);
      }
    );

    return () => {
      unsubSub();
      if (verificationPollingRef.current) {
        clearInterval(verificationPollingRef.current);
      }
    };
  }, [user?.uid, currency]);

  const verifyPayment = async (
    txRef: string,
    transactionId?: string | number,
    numAmount?: number,
    payCurrency?: string
  ) => {
    setIsVerifying(true);
    setStatusMessage('Verifying payment on Flutterwave server & crediting pocket...');
    setErrorMessage(null);

    const targetAmount = numAmount || parseFloat(amount) || minDeposit;
    const targetCurrency = normalizeCurrencyCode(payCurrency || currency);

    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken().catch(() => '') : '';
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 14000);

      let verifyRes: Response;
      let verifyData: any = {};
      try {
        verifyRes = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            tx_ref: txRef,
            transaction_id: transactionId,
            amount: targetAmount,
            currency: targetCurrency,
            userId: user.uid
          }),
          signal: controller.signal
        });
        const verifyText = await verifyRes.text();
        verifyData = verifyText ? JSON.parse(verifyText) : {};
      } finally {
        clearTimeout(timer);
      }

      if (verifyRes.ok && verifyData.success && verifyData.credited !== false) {
        const creditedAmt = Number(verifyData.amount || targetAmount);
        const creditedCur = normalizeCurrencyCode(verifyData.currency || targetCurrency);

        setStatusMessage(
          `Deposit verified & credited! ${formatCurrencyAmount(creditedAmt, creditedCur)} added to your ${creditedCur} Pocket.`
        );
        setActiveHostedPay(null);

        if (typeof verifyData.newBalance === 'number') {
          setDepositBalance(verifyData.newBalance);
        }

        setIsVerifying(false);
        await onSuccess({
          reference: txRef,
          amount: creditedAmt,
          currency: creditedCur,
          alreadyCreditedByServer: true
        });
      } else {
        throw new Error(
          verifyData.error ||
            verifyData.message ||
            'Payment not yet confirmed by gateway. Wallet was NOT credited.'
        );
      }
    } catch (err: any) {
      console.warn('[Payments Verify Notice]:', err);
      setIsVerifying(false);
      setStatusMessage(null);
      setErrorMessage(
        err?.name === 'AbortError'
          ? 'Verification timed out. Please try checking status again.'
          : err.message || 'Verification could not confirm gateway status yet.'
      );
    }
  };

  const handleFundCheckout = async () => {
    setErrorMessage(null);
    setStatusMessage(null);

    if (isDisabledFutureCurrency(currency)) {
      setErrorMessage('SIRA (Burkina Faso) is Coming Soon — planned currency, not yet in circulation.');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < minDeposit) {
      setErrorMessage(
        `Please select or enter an amount of at least ${formatCurrencyAmount(minDeposit, currency)}.`
      );
      return;
    }

    setIsInitializing(true);
    setStatusMessage(`Connecting Flutterwave (${currency}) Gateway...`);

    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), 15000);

    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken().catch(() => '') : '';
      const initRes = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          amount: numericAmount,
          currency,
          email: user.email || `${user.uid}@efado.com`,
          userId: user.uid,
          channel: 'ALL',
          name: user.displayName || user.fullName || 'EFADO Valued Customer',
          phone: user.phoneNumber || ''
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutTimer);

      const initText = await initRes.text();
      let initData: any = {};
      try {
        initData = initText ? JSON.parse(initText) : {};
      } catch {
        throw new Error('Flutterwave initialization endpoint returned an invalid response.');
      }
      if (!initRes.ok || !initData.success) {
        throw new Error(initData.error || initData.message || 'Payment initialization failed. Please try again.');
      }

      if (!initData.link || typeof initData.link !== 'string') {
        throw new Error('Flutterwave did not return a valid checkout link. Please verify API keys.');
      }

      const txRef = initData.tx_ref;
      const paymentLink = initData.link;

      setStatusMessage('Redirecting to Flutterwave checkout...');
      setActiveHostedPay({
        url: paymentLink,
        tx_ref: txRef,
        amount: numericAmount,
        currency
      });

      setIsInitializing(false);
      window.location.href = paymentLink;
    } catch (err: any) {
      clearTimeout(timeoutTimer);
      setIsInitializing(false);
      setIsVerifying(false);
      setStatusMessage(null);
      if (err.name === 'AbortError') {
        setErrorMessage('Connection timed out after 15 seconds. Please try again.');
      } else {
        setErrorMessage(err.message || 'Failed to initialize payment. Please try again.');
      }
    }
  };

  const parsedAmount = parseFloat(amount);
  const formattedDisplay =
    !isNaN(parsedAmount) && parsedAmount > 0
      ? formatCurrencyAmount(parsedAmount, currency)
      : formatCurrencyAmount(0, currency);

  const currentDisplayBalance = formatCurrencyAmount(depositBalance, currency);

  return (
    <div id="flutterwave-deposit-screen" className="space-y-6">
      {/* Live Canonical Pocket Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-5 rounded-2xl text-white shadow-xl relative overflow-hidden border border-indigo-700/50">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Wallet className="w-32 h-32 text-indigo-400" />
        </div>
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-indigo-400" />
              {curMeta.flag} {curMeta.name} Pocket ({currency})
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Sync
            </span>
          </div>
          <div className="text-3xl font-black tracking-tight text-white flex items-baseline gap-1">
            {currentDisplayBalance}
          </div>
          <p className="text-[11px] text-slate-300 font-medium">
            Pocket: <span className="font-mono text-indigo-200">wallets/{user.uid || '...'}/{currency}/depositWallet</span>
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
                disabled={isInitializing || isVerifying}
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
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-indigo-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{c.flag}</span>
                  <span className={`text-[10px] font-black ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
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
            id="flutterwave-amount-input"
            type="number"
            min={minDeposit}
            step="any"
            placeholder={String(minDeposit * 10)}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            className="w-full pl-14 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
          />
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
          {quickAmountOptions.map((val) => (
            <button
              id={`quick-amt-${val}`}
              key={val}
              type="button"
              onClick={() => {
                setAmount(val.toString());
                if (errorMessage) setErrorMessage(null);
              }}
              className={`py-2.5 px-2 border rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                amount === val.toString()
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-md scale-[1.02]'
                  : 'border-slate-200 text-slate-700 hover:border-indigo-400 bg-white hover:bg-slate-50'
              }`}
            >
              {amount === val.toString() && <Check className="w-3 h-3 text-white" />}
              {curMeta.symbol}{val >= 1000 ? `${val / 1000}k` : val}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Channels Indicator */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Flutterwave Payment Channels ({currency})
          </span>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-150">
            Live Multi-Currency
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-bold">
          <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 flex items-center gap-2 text-slate-700 shadow-2xs">
            <CreditCard className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Debit / Credit Card</span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 flex items-center gap-2 text-slate-700 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Bank Transfer</span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 flex items-center gap-2 text-slate-700 shadow-2xs">
            <Zap className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Mobile Money / OPay</span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 flex items-center gap-2 text-slate-700 shadow-2xs">
            <ArrowUpRight className="w-4 h-4 text-blue-600 shrink-0" />
            <span>USSD & Bank</span>
          </div>
        </div>
      </div>

      {/* Active Flutterwave Hosted Checkout Card */}
      {activeHostedPay && (
        <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-2 border-indigo-500 rounded-2xl p-5 shadow-lg space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-600 text-white rounded-lg">
                <Zap className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-sm font-black text-slate-900">Flutterwave Gateway Checkout</h4>
                <p className="text-[11px] text-slate-500 font-mono">Ref: {activeHostedPay.tx_ref}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveHostedPay(null)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-slate-600 space-y-1">
            <p>
              Your transaction of <strong className="text-slate-900 font-black">{formatCurrencyAmount(activeHostedPay.amount, activeHostedPay.currency)}</strong> is ready on Flutterwave.
            </p>
            <p className="text-[11px] text-slate-500">
              If the checkout page did not open automatically, click <strong>Open Flutterwave Checkout</strong> below:
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <a
              id="flw-v4-open-checkout-link"
              href={activeHostedPay.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-center"
            >
              <span>Open Flutterwave Checkout</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              id="flw-v4-verify-button"
              type="button"
              disabled={isVerifying}
              onClick={() =>
                verifyPayment(activeHostedPay.tx_ref, undefined, activeHostedPay.amount, activeHostedPay.currency)
              }
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying on Server...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>I Have Completed Payment</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Status & Messages */}
      {statusMessage && (
        <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-start gap-2.5 text-indigo-900 text-xs animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium leading-relaxed">{statusMessage}</div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {/* FUND Button */}
      <div className="space-y-3">
        <button
          id="flutterwave-fund-button"
          type="button"
          disabled={isInitializing || isVerifying || isDisabledFutureCurrency(currency)}
          onClick={handleFundCheckout}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 active:scale-[0.99] text-white font-black uppercase text-base tracking-wider rounded-2xl transition-all shadow-xl hover:shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isInitializing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Connecting Flutterwave ({currency})...</span>
            </>
          ) : isVerifying ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verifying & Crediting {currency}...</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 fill-amber-300 text-amber-300" />
              <span>FUND {currency} POCKET {formattedDisplay}</span>
            </>
          )}
        </button>
      </div>

      <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>Atomic Verified Settlement • Pocket: wallets/{'{uid}'}/{currency}/depositWallet</span>
      </div>
    </div>
  );
};
