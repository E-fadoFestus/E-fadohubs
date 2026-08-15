import React, { useState, useEffect } from 'react';
import { Loader2, CreditCard, Shield, CheckCircle, RefreshCw, AlertCircle, Info, Smartphone, Building2 } from 'lucide-react';
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
  const [isPaying, setIsPaying] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showManualVerify, setShowManualVerify] = useState(false);
  const [manualReference, setManualReference] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

  // Dynamically load Paystack Inline JS script
  useEffect(() => {
    if (window.PaystackPop) return;

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handlePaystackPayment = async () => {
    setErrorMessage(null);
    setStatusMessage(null);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 100) {
      setErrorMessage('Please enter a deposit amount of at least ₦100.');
      return;
    }

    setIsPaying(true);

    const paystackKey = (
      import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 
      'pk_test_f35adbd6b3c304fda3645194017b9e388da5563a'
    ).trim();

    const reference = `EFD_PST_${Math.floor(100 + Math.random() * 900)}_${Date.now()}`;

    // Try Paystack Inline Popup first
    if (window.PaystackPop && typeof window.PaystackPop.setup === 'function') {
      try {
        const handler = window.PaystackPop.setup({
          key: paystackKey,
          email: user.email || 'customer@e-fado.com',
          amount: Math.round(numericAmount * 100), // amount in kobo
          currency: 'NGN',
          ref: reference,
          metadata: {
            userId: user.uid,
            userName: user.displayName || user.email || 'EFADO Member',
            purpose: 'EFADO Wallet Deposit'
          },
          callback: async (response: any) => {
            setIsPaying(false);
            setIsVerifying(true);
            setStatusMessage('Verifying payment confirmation...');

            const returnedReference = response.reference || reference;
            try {
              const verifyRes = await fetch(`/api/paystack/verify/${returnedReference}?userId=${encodeURIComponent(user.uid)}&amount=${numericAmount}`);
              const verifyResult = await verifyRes.json();

              if (verifyResult.status && (verifyResult.data?.status === 'success' || verifyResult.already_processed)) {
                setIsVerifying(false);
                onSuccess({
                  reference: returnedReference,
                  amount: numericAmount
                });
              } else {
                setIsVerifying(false);
                setErrorMessage('Payment received. If your wallet is not credited instantly, click "Verify Past Reference" below.');
              }
            } catch (err) {
              console.error('Error verifying Paystack payment:', err);
              setIsVerifying(false);
              onSuccess({
                reference: returnedReference,
                amount: numericAmount
              });
            }
          },
          onClose: () => {
            setIsPaying(false);
            if (onCancel) onCancel();
          }
        });

        handler.openIframe();
        setIsPaying(false);
        return;
      } catch (inlineErr) {
        console.warn('Paystack inline popup fallback to hosted initialization:', inlineErr);
      }
    }

    // Fallback: Hosted Checkout Session via Server API
    try {
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email || 'customer@e-fado.com',
          amount: numericAmount,
          userId: user.uid,
          serviceType: 'wallet',
          purpose: 'EFADO Wallet Deposit'
        })
      });

      const resData = await response.json();

      if (resData.status && resData.authorization_url) {
        setIsPaying(false);
        window.location.href = resData.authorization_url;
      } else {
        setIsPaying(false);
        setErrorMessage(resData.message || 'Could not initiate Paystack gateway session. Please try again.');
      }
    } catch (err: any) {
      console.error('Error connecting to Paystack gateway:', err);
      setIsPaying(false);
      setErrorMessage('Unable to connect to Paystack payment gateway. Please check your network or try again.');
    }
  };

  const handleManualVerify = async () => {
    if (!manualReference.trim()) {
      setErrorMessage('Please enter your Paystack reference or Transaction ID.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const cleanRef = manualReference.trim();
      const res = await fetch(`/api/paystack/verify/${encodeURIComponent(cleanRef)}?userId=${encodeURIComponent(user.uid)}`);
      const data = await res.json();

      if (data.status && (data.data?.status === 'success' || data.already_processed)) {
        setIsVerifying(false);
        const creditedAmt = data.data?.amount ? data.data.amount / 100 : parseFloat(amount) || 1000;
        setStatusMessage(`Successfully verified reference ${cleanRef}! Wallet updated with ₦${creditedAmt.toLocaleString()}.`);
        onSuccess({
          reference: cleanRef,
          amount: creditedAmt
        });
      } else {
        setIsVerifying(false);
        setErrorMessage(data.message || 'Transaction reference unconfirmed. If you just sent the bank transfer, please allow 1-2 minutes for interbank clearance.');
      }
    } catch (err: any) {
      console.error('Error verifying reference:', err);
      setIsVerifying(false);
      setErrorMessage('Could not complete verification: ' + (err.message || err));
    }
  };

  const parsedAmount = parseFloat(amount);
  const formattedDisplay = !isNaN(parsedAmount) && parsedAmount > 0 
    ? `₦${parsedAmount.toLocaleString()}` 
    : '₦0';

  return (
    <div id="paystack-deposit-container" className="space-y-6">
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
              id={`paystack-quick-amt-${amt}`}
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

      {/* Payment Channels Info Banner */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
        <span className="text-xs font-semibold text-slate-600 block">
          Supported Paystack Channels
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-800">Debit Card</p>
              <p className="text-[10px] text-emerald-600 font-semibold">Instant confirmation</p>
            </div>
          </div>
          <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-800">Bank Transfer</p>
              <p className="text-[10px] text-slate-500">Virtual account transfer</p>
            </div>
          </div>
          <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-800">USSD Code</p>
              <p className="text-[10px] text-emerald-600 font-semibold">Instant dialing</p>
            </div>
          </div>
          <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-800">OPay / Bank</p>
              <p className="text-[10px] text-slate-500">Direct wallet debit</p>
            </div>
          </div>
        </div>
        
        {/* Helpful explanation regarding Bank Transfer countdown */}
        <div className="pt-1 flex items-start gap-1.5 text-[11px] text-slate-600 leading-snug">
          <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
          <span>
            <strong>Note on Bank Transfer:</strong> If you choose Transfer inside the Paystack modal, Paystack generates a temporary account number. Once you transfer from your bank app, Paystack automatically confirms and credits your wallet.
          </span>
        </div>
      </div>

      {/* Error & Status Messages */}
      {statusMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-800 text-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium leading-relaxed">{statusMessage}</div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {/* Main Pay Button */}
      <div>
        <button
          id="paystack-proceed-pay-btn"
          type="button"
          disabled={isPaying || isVerifying}
          onClick={handlePaystackPayment}
          className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 cursor-pointer"
        >
          {isPaying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Opening Paystack Checkout...</span>
            </>
          ) : isVerifying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Confirming Transaction...</span>
            </>
          ) : (
            <span>Proceed to Pay {formattedDisplay} via Paystack</span>
          )}
        </button>
      </div>

      {/* Manual Verification Option */}
      <div className="pt-1 text-center">
        <button
          type="button"
          onClick={() => setShowManualVerify(!showManualVerify)}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2 transition-all cursor-pointer"
        >
          {showManualVerify ? 'Hide Reference Verification' : 'Already transferred? Verify your reference here'}
        </button>

        {showManualVerify && (
          <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-3">
            <label className="text-xs font-bold text-slate-700 block">
              Enter Paystack Reference or Transaction ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualReference}
                onChange={(e) => setManualReference(e.target.value)}
                placeholder="e.g. EFD_PST_... or Paystack Tx Ref"
                className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <button
                type="button"
                disabled={isVerifying || !manualReference.trim()}
                onClick={handleManualVerify}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 disabled:bg-slate-300 cursor-pointer"
              >
                {isVerifying ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Verify
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              If your bank transfer cleared while the modal was loading, enter the reference from your confirmation to credit your wallet instantly.
            </p>
          </div>
        )}
      </div>

      {/* Trust Badge */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
        <Shield className="w-4 h-4 text-indigo-600" />
        <span>Secured by Paystack 256-bit PCI-DSS Level 1 Encryption</span>
      </div>
    </div>
  );
};
