import React, { useState, useEffect } from 'react';
import { Loader2, CreditCard, Shield, ExternalLink, CheckCircle, RefreshCw } from 'lucide-react';
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
  const [mode, setMode] = useState<'checkout_page' | 'inline_popup' | 'verify_ref'>('checkout_page');
  const [manualReference, setManualReference] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Dynamically load Paystack Inline JS script as an optional fallback
  useEffect(() => {
    if (window.PaystackPop) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;

    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setScriptLoaded(false);

    document.body.appendChild(script);
  }, []);

  const quickAmounts = [500, 1000, 5000, 10000];

  // Route 1: Hosted Paystack Gateway Initialization (/pay or /api/paystack/initialize)
  const handlePaystackHostedCheckout = async () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Please enter a valid deposit amount greater than zero.');
      return;
    }

    setIsPaying(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email || 'customer@e-fado.com',
          amount: numericAmount,
          userId: user.uid,
          serviceType: 'game',
          purpose: 'EFADO Wallet Topup'
        })
      });

      const resData = await response.json();

      if (resData.status && resData.authorization_url) {
        setStatusMessage('Redirecting to secure Paystack payment gateway...');
        // Open Paystack official checkout page
        window.location.href = resData.authorization_url;
      } else {
        setIsPaying(false);
        setErrorMessage(resData.message || 'Failed to initialize Paystack session. Please try again or verify configuration.');
      }
    } catch (err: any) {
      console.error('Error initializing hosted Paystack payment:', err);
      setIsPaying(false);
      setErrorMessage('Network error connecting to Paystack gateway server: ' + (err.message || err));
    }
  };

  // Route 2: Inline JS Pop-up setup
  const handleInlinePaystackPayment = () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Please enter a valid deposit amount greater than zero.');
      return;
    }

    setIsPaying(true);
    setErrorMessage(null);
    setStatusMessage(null);

    const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_f35adbd6b3c304fda3645194017b9e388da5563a';
    const reference = `EFD_PST_${Math.floor(100 + Math.random() * 900)}_${Date.now()}`;

    try {
      if (window.PaystackPop) {
        const handler = window.PaystackPop.setup({
          key: paystackKey,
          email: user.email || 'customer@e-fado.com',
          amount: numericAmount * 100,
          currency: 'NGN',
          ref: reference,
          metadata: {
            userId: user.uid,
            userName: user.displayName || user.email || 'EFADO Member',
            purpose: 'EFADO Wallet Topup'
          },
          callback: async (response: any) => {
            setIsPaying(false);
            setIsVerifying(true);
            
            const returnedReference = response.reference || reference;
            try {
              const verifyRes = await fetch(`/api/paystack/verify/${returnedReference}?userId=${encodeURIComponent(user.uid)}`);
              const verifyResult = await verifyRes.json();

              if (verifyResult.status && (verifyResult.data?.status === 'success' || verifyResult.already_processed)) {
                setIsVerifying(false);
                onSuccess({
                  reference: returnedReference,
                  amount: numericAmount
                });
              } else {
                setIsVerifying(false);
                setErrorMessage('Payment unconfirmed. If charged, enter reference manually below to verify.');
              }
            } catch (err) {
              console.error('Error verifying Paystack payment:', err);
              setIsVerifying(false);
              setErrorMessage('Verification timeout. You can enter transaction reference below to manually verify.');
            }
          },
          onClose: () => {
            setIsPaying(false);
            if (onCancel) onCancel();
          }
        });
        handler.openIframe();
      } else {
        // Fall back to hosted route if inline script didn't load
        handlePaystackHostedCheckout();
      }
    } catch (err: any) {
      console.error('Paystack Inline Error:', err);
      setIsPaying(false);
      handlePaystackHostedCheckout();
    }
  };

  // Route 3: Manual Reference Verification
  const handleManualVerify = async () => {
    if (!manualReference.trim()) {
      alert('Please enter a Paystack reference (e.g. EFD_PST_... or Paystack Tx Ref)');
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
        onSuccess({
          reference: cleanRef,
          amount: creditedAmt
        });
      } else {
        setIsVerifying(false);
        setErrorMessage(data.message || 'Transaction reference not found or unconfirmed on Paystack.');
      }
    } catch (err: any) {
      console.error('Error verifying reference:', err);
      setIsVerifying(false);
      setErrorMessage('Could not verify transaction reference: ' + (err.message || err));
    }
  };

  return (
    <div className="space-y-4 text-slate-100">
      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider">
        <button
          type="button"
          onClick={() => setMode('checkout_page')}
          className={`py-2 rounded-lg transition-all ${mode === 'checkout_page' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          Hosted Checkout
        </button>
        <button
          type="button"
          onClick={() => setMode('inline_popup')}
          className={`py-2 rounded-lg transition-all ${mode === 'inline_popup' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          Inline Modal
        </button>
        <button
          type="button"
          onClick={() => setMode('verify_ref')}
          className={`py-2 rounded-lg transition-all ${mode === 'verify_ref' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          Verify Reference
        </button>
      </div>

      {mode !== 'verify_ref' && (
        <>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Enter Deposit Amount (₦)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-emerald-400 font-mono">₦</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isPaying || isVerifying}
                className="w-full bg-slate-950/80 border-2 border-white/5 rounded-2xl pl-10 pr-4 py-3.5 text-lg font-black font-mono text-white focus:border-emerald-500 focus:outline-none transition-all placeholder:text-slate-600"
                placeholder="Min ₦100"
                min="100"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                disabled={isPaying || isVerifying}
                onClick={() => setAmount(amt.toString())}
                className={`py-2 rounded-xl text-xs font-black font-mono border-2 transition-all ${
                  amount === amt.toString()
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-slate-950 border-white/5 text-slate-300 hover:border-slate-800'
                }`}
              >
                ₦{amt.toLocaleString()}
              </button>
            ))}
          </div>
        </>
      )}

      {mode === 'verify_ref' && (
        <div className="space-y-3 bg-slate-950/60 p-4 border border-amber-500/20 rounded-2xl">
          <label className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
            Enter Paystack Reference String
          </label>
          <input
            type="text"
            value={manualReference}
            onChange={(e) => setManualReference(e.target.value)}
            disabled={isVerifying}
            placeholder="e.g. EFD_PST_123456789 or Paystack Reference"
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
          />
          <button
            onClick={handleManualVerify}
            disabled={isVerifying || !manualReference.trim()}
            className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                Querying Paystack Ledger...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Verify & Credit Wallet Now
              </>
            )}
          </button>
        </div>
      )}

      {statusMessage && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-[10px] text-emerald-300 font-bold leading-normal flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-950/40 border border-rose-900/50 rounded-xl text-[10px] text-rose-300 font-bold leading-normal">
          ❌ {errorMessage}
        </div>
      )}

      {mode === 'checkout_page' && (
        <button
          onClick={handlePaystackHostedCheckout}
          disabled={isPaying || isVerifying}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 disabled:bg-emerald-600/40 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
        >
          {isPaying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              Initializing Paystack Gateway...
            </>
          ) : (
            <>
              <ExternalLink className="w-4 h-4 shrink-0" />
              Open Paystack Secure Checkout Page
            </>
          )}
        </button>
      )}

      {mode === 'inline_popup' && (
        <button
          onClick={handleInlinePaystackPayment}
          disabled={isPaying || isVerifying}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 active:scale-98 disabled:bg-indigo-600/40 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
        >
          {isPaying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              Launching Paystack Inline Popup...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 shrink-0" />
              Pay via Paystack Pop-up
            </>
          )}
        </button>
      )}

      <div className="pt-2 flex items-center justify-center gap-1.5 text-[9px] text-slate-400 font-bold">
        <Shield className="w-3.5 h-3.5 text-emerald-500" />
        Paystack Secured 256-Bit Encrypted Gateway (Debit Cards, Transfers, USSD, OPay)
      </div>
    </div>
  );
};

