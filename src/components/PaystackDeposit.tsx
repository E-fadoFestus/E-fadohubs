import React, { useState } from 'react';
import { Loader2, CreditCard, ShieldCheck, AlertCircle, Zap, ArrowRight, Check } from 'lucide-react';
import { UserProfile } from '../types';
import { auth } from '../firebase';

interface PaystackDepositProps {
  user: UserProfile;
  onSuccess?: (paymentInfo: { reference: string; amount: number }) => void;
  onCancel?: () => void;
  defaultAmount?: number;
}

export const PaystackDeposit: React.FC<PaystackDepositProps> = ({
  user,
  defaultAmount = 1000
}) => {
  const [amount, setAmount] = useState<string>(defaultAmount.toString());
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

  const handleFundWallet = async () => {
    setErrorMessage(null);
    setStatusMessage(null);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 100) {
      setErrorMessage('Please enter an amount of at least ₦100.');
      return;
    }

    if (numericAmount > 1000000) {
      setErrorMessage('Maximum single deposit limit is ₦1,000,000.');
      return;
    }

    setIsRedirecting(true);
    setStatusMessage('Redirecting to Paystack...');

    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : (typeof (user as any).getIdToken === 'function' ? await (user as any).getIdToken() : '');
      if (!token) {
        throw new Error('Please log in to initialize payment.');
      }

      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: numericAmount
        })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success || !data?.authorization_url) {
        console.error('Paystack initialize error:', data);
        const rawErr = data?.error;
        const errStr = typeof rawErr === 'string' ? rawErr : (rawErr?.message || (typeof rawErr === 'object' ? JSON.stringify(rawErr) : null));
        const message = errStr || data?.message || 'Payment failed, please try again';
        setIsRedirecting(false);
        setStatusMessage(null);
        setErrorMessage(message);
        return;
      }

      setStatusMessage('Redirecting to Paystack secure checkout...');
      // Direct browser redirect to Paystack hosted payment page
      window.location.href = data.authorization_url;

    } catch (err: any) {
      console.error('Paystack initialize error:', err);
      setIsRedirecting(false);
      setStatusMessage(null);
      const message = (typeof err?.message === 'string' ? err.message : null) || 'Payment failed, please try again';
      setErrorMessage(message);
    }
  };

  const parsedAmount = parseFloat(amount);
  const formattedDisplay = !isNaN(parsedAmount) && parsedAmount > 0 
    ? `₦${parsedAmount.toLocaleString()}` 
    : '₦0';

  return (
    <div id="paystack-fund-card" className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 p-5 rounded-2xl text-white shadow-xl relative overflow-hidden border border-emerald-700/50">
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              Paystack Sovereign Fund Terminal
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Gateway
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Fund your EFADO Sovereign Wallet instantly with Nigerian Debit Cards, Bank Transfer, USSD, Bank Account, or OPay via Paystack.
          </p>
        </div>
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Enter Deposit Amount (NGN)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">
            ₦
          </span>
          <input
            id="paystack-amount-input"
            type="number"
            min="100"
            max="1000000"
            step="100"
            placeholder="5,000"
            value={amount}
            disabled={isRedirecting}
            onChange={(e) => {
              setAmount(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
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
              ₦{(val / 1000)}k
            </button>
          ))}
        </div>
      </div>

      {/* Status & Error Notifications */}
      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-900 text-xs animate-in fade-in">
          <Loader2 className="w-4 h-4 text-emerald-600 animate-spin flex-shrink-0" />
          <div className="font-bold">{statusMessage}</div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="font-bold flex-1">
            {typeof errorMessage === 'string' ? errorMessage : ((errorMessage as any)?.message || 'Payment failed, please try again')}
          </div>
        </div>
      )}

      {/* FUND BUTTON */}
      <button
        id="paystack-fund-wallet-button"
        type="button"
        disabled={isRedirecting}
        onClick={handleFundWallet}
        className="w-full py-4 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 hover:from-emerald-700 hover:to-teal-900 active:scale-[0.99] text-white font-black uppercase text-base tracking-wider rounded-2xl transition-all shadow-xl hover:shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isRedirecting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Redirecting to Paystack...</span>
          </>
        ) : (
          <>
            <Zap className="w-5 h-5 fill-amber-300 text-amber-300" />
            <span>Fund Wallet {formattedDisplay}</span>
            <ArrowRight className="w-5 h-5 ml-1" />
          </>
        )}
      </button>

      <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center gap-2 pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>Secured 256-bit Encrypted Settlement via Paystack (PCI-DSS Level 1)</span>
      </div>
    </div>
  );
};
