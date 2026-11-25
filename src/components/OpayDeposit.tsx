import React, { useState } from 'react';
import { UserProfile } from '../types';
import { auth } from '../firebase';
import { AlertCircle, CheckCircle2, ShieldCheck, Loader2, ArrowRight, Check, Lock } from 'lucide-react';
import { soundManager } from '../services/sound';
import {
  ACTIVE_WALLET_CURRENCIES,
  FUTURE_WALLET_CURRENCIES,
  formatCurrencyAmount,
  getMinDepositForCurrency,
  getWalletCurrencyMeta,
  isDisabledFutureCurrency,
  normalizeCurrencyCode
} from '../constants/walletCurrencies';

interface OpayDepositProps {
  user: UserProfile;
  defaultAmount?: number;
  defaultCurrency?: string;
  onSuccess?: (details: { reference: string; amount: number; currency?: string; alreadyCreditedByServer?: boolean }) => void;
}

export const OpayDeposit: React.FC<OpayDepositProps> = ({
  user,
  defaultAmount = 1000,
  defaultCurrency = 'NGN',
  onSuccess
}) => {
  const initialCur = isDisabledFutureCurrency(defaultCurrency) ? 'NGN' : normalizeCurrencyCode(defaultCurrency);
  const [currency, setCurrency] = useState<string>(initialCur);
  const [amount, setAmount] = useState<string>(String(defaultAmount));
  const [phoneNumber, setPhoneNumber] = useState<string>(user.phoneNumber || user.admin_otp_phone || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const curMeta = getWalletCurrencyMeta(currency);
  const minDeposit = getMinDepositForCurrency(currency);
  const parsedAmount = Number(amount);
  const isBelowMin = !Number.isFinite(parsedAmount) || parsedAmount < minDeposit;
  const formattedDisplay =
    Number.isFinite(parsedAmount) && parsedAmount > 0
      ? formatCurrencyAmount(parsedAmount, currency)
      : formatCurrencyAmount(0, currency);

  const presetAmounts =
    currency === 'NGN'
      ? [1000, 2000, 5000, 10000, 20000, 50000]
      : currency === 'XOF'
        ? [1000, 2500, 5000, 10000, 25000, 50000]
        : [10, 25, 50, 100, 250, 500];

  const handleFundWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setCheckoutUrl(null);

    if (isDisabledFutureCurrency(currency)) {
      setErrorMessage('SIRA (Burkina Faso) is Coming Soon and not yet enabled.');
      return;
    }

    if (isBelowMin) {
      setErrorMessage(`Minimum deposit is ${formatCurrencyAmount(minDeposit, currency)}.`);
      return;
    }

    setIsLoading(true);
    soundManager.playClick();

    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      if (!token) {
        throw new Error('Please log in to fund your account.');
      }

      const resp = await fetch('/api/wallet/deposit/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          method: 'opay',
          amount: parsedAmount,
          currency,
          phoneNumber
        })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data?.success) {
        throw new Error(data?.message || 'Could not start OPAY payment.');
      }

      if (data.cashierUrl) {
        setCheckoutUrl(data.cashierUrl);
        setSuccessMessage('OPAY Pay-In checkout is ready. Complete payment in the checkout window.');
        window.location.assign(data.cashierUrl);
      } else {
        setSuccessMessage(
          `OPAY payment reference ${data.reference} registered. Your pocket will be credited once payment confirmation arrives.`
        );
        if (onSuccess) {
          onSuccess({ reference: data.reference, amount: parsedAmount, currency, alreadyCreditedByServer: false });
        }
      }
      soundManager.playCashoutChime();
    } catch (err: any) {
      setErrorMessage(err?.message || 'OPAY payment could not be started. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
          <span className="text-xs font-bold text-[#16A34A]">Secure Payment - Verified</span>
        </div>
        <span className="text-xs font-bold text-[#7C3AED]">OPAY Pay-In</span>
      </div>

      {/* Pocket Selector */}
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
                disabled={isLoading}
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

      <form onSubmit={handleFundWallet} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">
            Enter Deposit Amount ({currency}) — Min {formatCurrencyAmount(minDeposit, currency)}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-slate-500">
              {curMeta.symbol}
            </span>
            <input
              type="number"
              min={minDeposit}
              step="any"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-300 rounded-xl text-lg font-bold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              required
            />
          </div>
          {amount !== '' && isBelowMin && (
            <p className="text-xs font-semibold text-[#DC2626] mb-0 max-w-none">
              Minimum deposit is {formatCurrencyAmount(minDeposit, currency)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {presetAmounts.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(String(preset))}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold border tabular-nums flex items-center justify-center gap-1 ${
                Number(amount) === preset
                  ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                  : 'bg-white border-slate-200 text-slate-800 hover:border-[#7C3AED]'
              }`}
            >
              {Number(amount) === preset && <Check className="w-3.5 h-3.5" />}
              {curMeta.symbol}
              {preset >= 1000 ? `${preset / 1000}k` : preset}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">OPAY / Mobile Phone Number</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+234 800 000 0000"
            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
          />
        </div>

        <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl text-center">
          <p className="text-xs font-semibold text-slate-700 mb-0 max-w-none tabular-nums">
            You pay <strong className="text-slate-900">{formattedDisplay}</strong> — You receive{' '}
            <strong className="text-[#16A34A]">{formattedDisplay}</strong> — No hidden fee
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-[#DC2626] font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-[#16A34A] font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {checkoutUrl && (
          <a
            href={checkoutUrl}
            target="_top"
            rel="noopener noreferrer"
            className="block text-center py-3 bg-[#7C3AED] text-white rounded-xl text-xs font-bold"
          >
            Continue to OPAY Checkout
          </a>
        )}

        <div className="sticky bottom-16 sm:bottom-2 z-20 pt-2 bg-white/95 backdrop-blur-sm pb-1">
          <button
            type="submit"
            disabled={isLoading || isBelowMin}
            className="w-full py-4 bg-[#16A34A] hover:bg-emerald-700 text-white font-bold uppercase text-sm sm:text-base rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed tabular-nums"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Starting OPAY Pay-In...</span>
              </>
            ) : (
              <>
                <span>FUND {currency} POCKET {formattedDisplay}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="text-center text-xs text-slate-500 font-medium flex items-center justify-center gap-1.5 pt-1">
        <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
        <span>Protected by 256-bit encryption • Compliance: PCI DSS, NDPR, GDPR</span>
      </div>
    </div>
  );
};
