import React, { useState } from 'react';
import { Loader2, CreditCard, ShieldCheck, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';
import { createFlutterwavePaymentLink } from '../utils/flutterwave';

interface FlutterwaveDepositProps {
  user: UserProfile;
  onSuccess: (paymentInfo: { reference: string; amount: number }) => void;
  onCancel?: () => void;
  defaultAmount?: number;
}

export const FlutterwaveDeposit: React.FC<FlutterwaveDepositProps> = ({
  user,
  defaultAmount = 1000
}) => {
  const [amount, setAmount] = useState<string>(defaultAmount.toString());
  const [isPaying, setIsPaying] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'all' | 'card' | 'ussd' | 'transfer'>('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

  const handleFlutterwavePayment = async () => {
    setErrorMessage(null);
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 100) {
      setErrorMessage('Please enter a deposit amount of at least ₦100.');
      return;
    }

    setIsPaying(true);
    const reference = `EFD_FLW_${Math.floor(100 + Math.random() * 900)}_${Date.now()}`;

    try {
      const result = await createFlutterwavePaymentLink({
        email: user.email || 'customer@efado.com',
        name: user.displayName || 'EFADO Member',
        amount: numericAmount,
        currency: 'NGN',
        tx_ref: reference,
        purpose: 'EFADO Wallet Deposit',
        meta: {
          userId: user.uid,
          selectedMethod
        },
        customizations: {
          title: 'EFADO Wallet Deposit',
          description: `Deposit ₦${numericAmount.toLocaleString()} to EFADO Wallet`
        }
      });

      if (result.status && result.link) {
        setIsPaying(false);
        window.location.href = result.link;
        return;
      }

      throw new Error(result.message || 'Payment initialization could not be completed. Please try again.');
    } catch (err: any) {
      setIsPaying(false);
      console.warn('Payment link issue:', err);
      setErrorMessage('Unable to connect to the payment gateway right now. Please try again in a moment.');
    }
  };

  const parsedAmount = parseFloat(amount);
  const formattedDisplay = !isNaN(parsedAmount) && parsedAmount > 0 
    ? `₦${parsedAmount.toLocaleString()}` 
    : '₦0';

  return (
    <div id="flutterwave-deposit-container" className="space-y-6">
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
            id="flutterwave-amount-input"
            type="number"
            min="100"
            step="100"
            placeholder="5,000"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
          />
        </div>
        
        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
          {quickAmounts.map((amt) => (
            <button
              id={`quick-amt-${amt}`}
              key={amt}
              type="button"
              onClick={() => {
                setAmount(amt.toString());
                if (errorMessage) setErrorMessage(null);
              }}
              className={`py-2 px-2 border rounded-lg text-xs font-bold transition-all ${
                amount === amt.toString()
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
              }`}
            >
              ₦{amt.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Channels Info */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">
            Accepted Payment Channels
          </span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => setSelectedMethod(selectedMethod === 'card' ? 'all' : 'card')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              selectedMethod === 'card'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> Debit / Credit Card
          </button>
          <button
            type="button"
            onClick={() => setSelectedMethod(selectedMethod === 'transfer' ? 'all' : 'transfer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              selectedMethod === 'transfer'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            🏦 Bank Transfer
          </button>
          <button
            type="button"
            onClick={() => setSelectedMethod(selectedMethod === 'ussd' ? 'all' : 'ussd')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              selectedMethod === 'ussd'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            💬 USSD
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium leading-relaxed">
            {errorMessage}
          </div>
        </div>
      )}

      {/* Pay Button */}
      <div>
        <button
          id="flutterwave-secure-pay-btn"
          type="button"
          disabled={isPaying}
          onClick={handleFlutterwavePayment}
          className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/10 cursor-pointer"
        >
          {isPaying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Redirecting to Payment Gateway...</span>
            </>
          ) : (
            <span>Proceed to Pay {formattedDisplay}</span>
          )}
        </button>
      </div>

      {/* Trust Badge */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Secure 256-bit encrypted transaction</span>
      </div>
    </div>
  );
};
