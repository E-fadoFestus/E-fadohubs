import React, { useState, useEffect, useRef } from 'react';
import {
  Loader2,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Check,
  ExternalLink,
  X,
  RefreshCw,
  Lock,
  ArrowRight
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
import { extractErrorMessage } from '../utils/errorFormat';

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
      () => {}
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
    setStatusMessage('Confirming payment and crediting your pocket...');
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
          `Deposit successful! ${formatCurrencyAmount(creditedAmt, creditedCur)} added to your ${creditedCur} Pocket.`
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
          extractErrorMessage(verifyData, 'Payment not confirmed yet. Your balance was not changed.')
        );
      }
    } catch (err: any) {
      setIsVerifying(false);
      setStatusMessage(null);
      setErrorMessage(
        err?.name === 'AbortError'
          ? 'Verification timed out. Please try checking again.'
          : extractErrorMessage(err, 'Could not confirm payment yet.')
      );
    }
  };

  const parsedAmount = parseFloat(amount);
  const isBelowMin = isNaN(parsedAmount) || parsedAmount < minDeposit;
  const formattedDisplay =
    !isNaN(parsedAmount) && parsedAmount > 0
      ? formatCurrencyAmount(parsedAmount, currency)
      : formatCurrencyAmount(0, currency);

  const handleFundCheckout = async () => {
    setErrorMessage(null);
    setStatusMessage(null);

    if (isDisabledFutureCurrency(currency)) {
      setErrorMessage('SIRA (Burkina Faso) is Coming Soon and not yet enabled.');
      return;
    }

    if (isBelowMin) {
      setErrorMessage(`Minimum deposit is ${formatCurrencyAmount(minDeposit, currency)}.`);
      return;
    }

    setIsInitializing(true);
    setStatusMessage(`Opening Flutterwave (${currency}) checkout...`);

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
          amount: parsedAmount,
          currency,
          email: user.email || `${user.uid}@efado.com`,
          userId: user.uid,
          channel: 'ALL',
          name: user.displayName || user.fullName || 'EFADO Member',
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
        throw new Error('Could not start Flutterwave payment.');
      }

      if (!initRes.ok || !initData.success || !initData.link) {
        throw new Error(extractErrorMessage(initData, 'Payment could not be started. Please check server configuration.'));
      }

      setStatusMessage('Redirecting to Flutterwave checkout...');
      setActiveHostedPay({
        url: initData.link,
        tx_ref: initData.tx_ref,
        amount: parsedAmount,
        currency
      });

      setIsInitializing(false);
      window.location.href = initData.link;
    } catch (err: any) {
      clearTimeout(timeoutTimer);
      setIsInitializing(false);
      setIsVerifying(false);
      setStatusMessage(null);
      if (err?.name === 'AbortError') {
        setErrorMessage('Connection timed out. Please try again.');
      } else {
        setErrorMessage(extractErrorMessage(err, 'Failed to start payment. Please try again.'));
      }
    }
  };

  return (
    <div id="flutterwave-deposit-screen" className="space-y-5">
      {/* Secure Badge + Pocket Balance */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
          <span className="text-xs font-bold text-[#16A34A]">Secure Payment - Verified</span>
        </div>
        <span className="text-xs font-bold text-slate-800 tabular-nums">
          {curMeta.flag} {currency} Balance: {formatCurrencyAmount(depositBalance, currency)}
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
                disabled={isInitializing || isVerifying}
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

      {/* Amount Input */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 block">
          Enter Deposit Amount ({currency}) — Min {formatCurrencyAmount(minDeposit, currency)}
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-slate-500">
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
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-300 rounded-xl text-lg font-bold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED]"
          />
        </div>
        {amount !== '' && isBelowMin && (
          <p className="text-xs font-semibold text-[#DC2626] mb-0 max-w-none">
            Minimum deposit is {formatCurrencyAmount(minDeposit, currency)}
          </p>
        )}

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

      <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl text-center">
        <p className="text-xs font-semibold text-slate-700 mb-0 max-w-none tabular-nums">
          You pay <strong className="text-slate-900">{formattedDisplay}</strong> — You receive{' '}
          <strong className="text-[#16A34A]">{formattedDisplay}</strong> — No hidden fee
        </p>
      </div>

      {activeHostedPay && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 m-0">Flutterwave Checkout Ready</h4>
              <p className="text-xs text-slate-500 font-mono m-0 max-w-none">Ref: {activeHostedPay.tx_ref}</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveHostedPay(null)}
              className="p-1.5 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <a
              id="flw-v4-open-checkout-link"
              href={activeHostedPay.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 bg-[#7C3AED] hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
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
              className="flex-1 py-3 px-4 bg-[#16A34A] hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
            >
              {isVerifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>{isVerifying ? 'Checking...' : 'I Have Completed Payment'}</span>
            </button>
          </div>
        </div>
      )}

      {statusMessage && (
        <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-2 text-[#7C3AED] text-xs font-bold">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-[#DC2626] text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="sticky bottom-16 sm:bottom-2 z-20 pt-2 bg-white/95 backdrop-blur-sm pb-1">
        <button
          id="flutterwave-fund-button"
          type="button"
          disabled={isInitializing || isVerifying || isBelowMin || isDisabledFutureCurrency(currency)}
          onClick={handleFundCheckout}
          className="w-full py-4 bg-[#16A34A] hover:bg-emerald-700 active:scale-[0.99] text-white font-bold uppercase text-sm sm:text-base tracking-wide rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed tabular-nums"
        >
          {isInitializing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Opening Flutterwave...</span>
            </>
          ) : isVerifying ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verifying Payment...</span>
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
