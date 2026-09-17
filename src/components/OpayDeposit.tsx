import React, { useState } from 'react';
import { UserProfile } from '../types';
import { OpayService } from '../services/OpayService';
import { ShieldCheck, Zap, AlertCircle, ArrowRight, Wallet, CheckCircle2, Lock } from 'lucide-react';
import { soundManager } from '../services/sound';

interface OpayDepositProps {
  user: UserProfile;
  defaultAmount?: number;
  onSuccess?: (details: { reference: string; amount: number }) => void;
}

export const OpayDeposit: React.FC<OpayDepositProps> = ({
  user,
  defaultAmount = 1000,
  onSuccess
}) => {
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [phoneNumber, setPhoneNumber] = useState<string>(user.admin_otp_phone || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Environment variables for display only
  const merchantIdDisplay = import.meta.env.VITE_OPAY_MERCHANT_ID || '';
  const publicKeyDisplay = import.meta.env.VITE_OPAY_PUBLIC_KEY || '';

  const presetAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

  const handleFundWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (amount <= 0 || isNaN(amount)) {
      setErrorMessage('Please enter an amount greater than ₦0');
      return;
    }

    if (amount < 100) {
      setErrorMessage('Minimum OPay deposit amount is ₦100');
      return;
    }

    setIsLoading(true);
    soundManager.playClick();

    try {
      // 1. Call secure backend initialization
      const initData = await OpayService.initializePayment(amount, user.uid, phoneNumber);

      if (initData.status && initData.cashierUrl) {
        soundManager.playCashoutChime();

        // 2. Redirect user to cashierUrl received from OPay
        console.log('[OPay] Redirecting user to Cashier checkout URL:', initData.cashierUrl);
        window.location.href = initData.cashierUrl;
      } else {
        throw new Error(initData.message || 'Failed to initialize OPay payment session.');
      }
    } catch (err: any) {
      console.error('[OPay Frontend Error]', err);
      setErrorMessage(err.message || 'Payment initialization encountered an issue. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* OPay Header Banner */}
      <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 font-black shadow-md shadow-emerald-500/20">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
              OPay Pay-In Gateway
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
              TEST MODE
            </span>
          </div>
          <p className="text-xs text-emerald-800 font-semibold mt-1 leading-relaxed">
            Instant wallet funding via OPay Wallet, Bank Transfer, USSD, and Debit Cards. Funds are credited instantly into your deposit balance.
          </p>

          {/* Display-only environment credentials */}
          <div className="mt-2 pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[10px] text-emerald-900/80 font-mono">
            <span>MID: {merchantIdDisplay ? `${merchantIdDisplay.slice(0, 8)}...` : 'Configured'}</span>
            <span>Public Key: {publicKeyDisplay ? `${publicKeyDisplay.slice(0, 10)}...` : 'Active'}</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleFundWallet} className="space-y-5">
        {/* Amount Input */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
            <span>Funding Amount (NGN)</span>
            <span className="text-[10px] text-slate-400 font-normal">Min: ₦100</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 font-black text-lg">
              ₦
            </div>
            <input
              type="number"
              min="100"
              step="100"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="1000"
              className="w-full pl-10 pr-4 py-3.5 bg-slate-50 hover:bg-white focus:bg-white border-2 border-slate-200 focus:border-emerald-500 rounded-2xl text-lg font-black text-slate-900 outline-none transition-all shadow-inner"
              required
            />
          </div>
        </div>

        {/* Quick Amount Selector Chips */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
            Quick Select Amount
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {presetAmounts.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setAmount(preset);
                  soundManager.playClick();
                }}
                className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all border ${
                  amount === preset
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30 scale-105'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-300'
                }`}
              >
                ₦{preset.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Optional Phone input */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
            OPay / Mobile Phone Number (Optional)
          </label>
          <input
            type="tel"
            placeholder="080... or 090..."
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all"
          />
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isLoading || amount < 100}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Initializing OPay Cashier...</span>
            </>
          ) : (
            <>
              <Wallet className="w-5 h-5" />
              <span>Fund Wallet with OPay (₦{amount ? amount.toLocaleString() : '0'})</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Security & Features Footnote */}
      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3 text-slate-500 text-[11px] font-semibold">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>256-Bit Encrypted Cashier</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Zero Processing Fee</span>
        </div>
      </div>
    </div>
  );
};
