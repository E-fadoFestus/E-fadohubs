import React, { useState, useEffect } from 'react';
import { Loader2, CreditCard, Shield, AlertTriangle } from 'lucide-react';
import { UserProfile } from '../types';

interface PaystackDepositProps {
  user: UserProfile;
  onSuccess: (paymentInfo: { reference: string; amount: number }) => void;
  onCancel?: () => void;
  defaultAmount?: number;
}

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export const PaystackDeposit: React.FC<PaystackDepositProps> = ({
  user,
  onSuccess,
  onCancel,
  defaultAmount = 1000
}) => {
  const [amount, setAmount] = useState<string>(defaultAmount.toString());
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // Dynamically load Paystack Inline JS script
  useEffect(() => {
    if (window.PaystackPop) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;

    script.onload = () => {
      setScriptLoaded(true);
    };

    script.onerror = () => {
      console.error('Failed to load Paystack Inline script.');
      setScriptError(true);
    };

    document.body.appendChild(script);

    return () => {
      // Keep script in body to avoid multiple loads across mounts if unnecessary
    };
  }, []);

  const quickAmounts = [500, 1000, 5000, 10000];

  const handlePaystackPayment = () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Please enter a valid deposit amount greater than zero.');
      return;
    }

    if (!scriptLoaded) {
      alert('Paystack secure gateway is initializing. Please wait a moment.');
      return;
    }

    setIsPaying(true);

    // Retrieve Paystack Public Key from environment, or use sandboxed fallback
    const paystackKey = (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_d3bd3cdb2b2b10931eb6ea637be5c0d68fbd6e78';
    
    const reference = `EFD_PSTK_${Math.floor(100 + Math.random() * 900)}_${Date.now()}`;

    try {
      const handler = window.PaystackPop.setup({
        key: paystackKey,
        email: user.email,
        amount: Math.round(numericAmount * 100), // convert to kobo
        currency: 'NGN',
        ref: reference,
        callback: (response: any) => {
          setIsPaying(false);
          if (response && (response.status === 'success' || response.message === 'Approved')) {
            onSuccess({
              reference: response.reference || reference,
              amount: numericAmount
            });
          } else {
            alert('Payment execution did not return a successful receipt. Please verify details.');
          }
        },
        onClose: () => {
          setIsPaying(false);
          if (onCancel) onCancel();
        }
      });

      handler.openIframe();
    } catch (err) {
      console.error('Error invoking Paystack Pop Client:', err);
      setIsPaying(false);
      alert('Could not start Paystack checkout process. Ensure your internet connection is active.');
    }
  };

  return (
    <div id="paystack-deposit-container" className="space-y-6">
      {/* Section A: Amount Input */}
      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
          Deposit Amount (NGN ₦)
        </label>
        <div className="relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">₦</span>
          <input
            id="paystack-amount-input"
            type="number"
            min="100"
            placeholder="e.g. 5000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-10 pr-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-black focus:outline-none focus:border-indigo-600 transition-all text-black"
          />
        </div>
        
        {/* Quick buttons */}
        <div className="grid grid-cols-4 gap-2">
          {quickAmounts.map((amt) => (
            <button
              id={`quick-amt-${amt}`}
              key={amt}
              type="button"
              onClick={() => setAmount(amt.toString())}
              className={`py-3 px-2 border-2 rounded-xl text-xs font-black tracking-tighter transition-all ${
                amount === amt.toString()
                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'
              }`}
            >
              ₦{amt.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Section B: Payment Methods Grid */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">
          Payment Methods Covered
        </span>
        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
          <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            <CreditCard className="w-3.5 h-3.5 text-indigo-500" /> Card
          </span>
          <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            💬 USSD
          </span>
          <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            🏦 Transfer
          </span>
        </div>
      </div>

      {scriptError && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p className="font-medium leading-relaxed">
            Failed to connect with Paystack security nodes. Please reload or check if a browser ad blocker is blocking paystack.co.
          </p>
        </div>
      )}

      {/* Section C: Action Button */}
      <div className="pt-2">
        <button
          id="paystack-secure-pay-btn"
          type="button"
          disabled={!scriptLoaded || isPaying}
          onClick={handlePaystackPayment}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15"
        >
          {isPaying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Opening Paystack Terminal...
            </>
          ) : !scriptLoaded ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Syncing Security Credentials...
            </>
          ) : (
            'Pay Now Securely with Paystack'
          )}
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
        <Shield className="w-3 h-3 text-emerald-500" />
        Funds reflect in 3-5 seconds. Powered by Paystack
      </div>
    </div>
  );
};
