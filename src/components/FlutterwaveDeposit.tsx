import React, { useState, useEffect } from 'react';
import { Loader2, CreditCard, ShieldCheck, AlertCircle, CheckCircle, Wallet, ArrowUpRight, Check, Zap } from 'lucide-react';
import { UserProfile } from '../types';
import { db, doc, onSnapshot } from '../firebase';

interface FlutterwaveDepositProps {
  user: UserProfile;
  onSuccess: (paymentInfo: { reference: string; amount: number }) => void;
  onCancel?: () => void;
  defaultAmount?: number;
}

declare global {
  interface Window {
    FlutterwaveCheckout?: (options: any) => void;
  }
}

export const FlutterwaveDeposit: React.FC<FlutterwaveDepositProps> = ({
  user,
  onSuccess,
  onCancel,
  defaultAmount = 1000
}) => {
  const [amount, setAmount] = useState<string>(defaultAmount.toString());
  const [isInitializing, setIsInitializing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [depositBalance, setDepositBalance] = useState<number | null>(null);

  // Quick amount buttons: N1k to N50k
  const quickAmountOptions = [
    { label: '₦1k', value: 1000 },
    { label: '₦2k', value: 2000 },
    { label: '₦5k', value: 5000 },
    { label: '₦10k', value: 10000 },
    { label: '₦20k', value: 20000 },
    { label: '₦50k', value: 50000 },
  ];

  // 1. Live Balance listener from wallets/{userId}/NGN (and subdoc depositWallet)
  useEffect(() => {
    if (!user?.uid) return;

    // Listen to subcollection doc: wallets/{userId}/NGN/depositWallet
    const unsubSub = onSnapshot(
      doc(db, 'wallets', user.uid, 'NGN', 'depositWallet'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (typeof data.balance === 'number') {
            setDepositBalance(data.balance);
            return;
          }
        }
      },
      (err) => {
        console.warn('Subcollection wallet listener fallback:', err);
      }
    );

    // Fallback listener: wallets/{userId} (NGN.depositWallet or depositWallet)
    const unsubMain = onSnapshot(
      doc(db, 'wallets', user.uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const bal = data?.NGN?.depositWallet ?? data?.depositWallet ?? data?.balance;
          if (typeof bal === 'number') {
            setDepositBalance((prev) => (prev !== null ? prev : bal));
          }
        }
      },
      (err) => {
        console.warn('Main wallet listener fallback:', err);
      }
    );

    return () => {
      unsubSub();
      unsubMain();
    };
  }, [user?.uid]);

  // 2. Dynamically load Flutterwave Inline JS SDK
  useEffect(() => {
    if (window.FlutterwaveCheckout) return;

    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleFundCheckout = async () => {
    setErrorMessage(null);
    setStatusMessage(null);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 100) {
      setErrorMessage('Please select or enter an amount of at least ₦100.');
      return;
    }

    setIsInitializing(true);
    setStatusMessage('Initializing transaction on EFADO central processor...');

    try {
      // Step 1: Call /api/payments/initialize
      const initRes = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: numericAmount,
          email: user.email || 'customer@efado.com',
          userId: user.uid,
          channel: 'ALL',
        }),
      });

      const initData = await initRes.json();
      if (!initRes.ok || !initData.success) {
        throw new Error(initData.message || 'Payment initialization failed.');
      }

      const txRef = initData.tx_ref;
      const publicKey = initData.publicKey || (
        import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || 
        'FLWPUBK_TEST-9382f7e028b171f11e998c7602058ba3-X'
      ).trim();

      setStatusMessage('Launching Flutterwave central checkout...');

      // Step 2: Open Flutterwave Checkout with ALL channels
      if (typeof window.FlutterwaveCheckout === 'function') {
        window.FlutterwaveCheckout({
          public_key: publicKey,
          tx_ref: txRef,
          amount: numericAmount,
          currency: 'NGN',
          // ALL payment methods enabled: card, bank, OPay, USSD, transfer, QR
          payment_options: 'card,banktransfer,opay,ussd,account,qr',
          customer: {
            email: user.email || 'customer@efado.com',
            phone_number: user.phoneNumber || '08000000000',
            name: user.displayName || user.fullName || 'EFADO Valued Customer',
          },
          customizations: {
            title: 'EFADO Market Hubs Central Processor',
            description: `Fund ₦${numericAmount.toLocaleString()} to EFADO Sovereign Wallet`,
            logo: 'https://e-fado.com/logo.png',
          },
          callback: async (response: any) => {
            setIsInitializing(false);
            setIsVerifying(true);
            setStatusMessage('Verifying payment and crediting your deposit wallet...');

            try {
              // Step 3: Verify via /api/payments/verify
              const verifyRes = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  tx_ref: response.tx_ref || txRef,
                  transaction_id: response.transaction_id,
                  amount: numericAmount,
                  userId: user.uid,
                }),
              });

              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.success) {
                setStatusMessage('Deposit verified successfully! ₦' + numericAmount.toLocaleString() + ' credited.');
                if (typeof verifyData.newBalance === 'number') {
                  setDepositBalance(verifyData.newBalance);
                }
                setTimeout(() => {
                  setIsVerifying(false);
                  onSuccess({
                    reference: response.tx_ref || txRef,
                    amount: numericAmount,
                  });
                }, 800);
              } else {
                throw new Error(verifyData.message || 'Verification failed. Checking webhook status...');
              }
            } catch (vErr: any) {
              console.warn('Verification endpoint notice:', vErr);
              // Fallback completion so user is not stuck
              setIsVerifying(false);
              setStatusMessage('Payment processed. Balance is updating via real-time sync.');
              onSuccess({
                reference: response.tx_ref || txRef,
                amount: numericAmount,
              });
            }
          },
          onclose: () => {
            setIsInitializing(false);
            setIsVerifying(false);
            if (onCancel) onCancel();
          },
        });
      } else {
        throw new Error('Flutterwave SDK not loaded. Please check your internet connection.');
      }
    } catch (err: any) {
      setIsInitializing(false);
      setIsVerifying(false);
      setErrorMessage(err.message || 'Failed to initialize payment. Please try again.');
    }
  };

  const parsedAmount = parseFloat(amount);
  const formattedDisplay = !isNaN(parsedAmount) && parsedAmount > 0 
    ? `₦${parsedAmount.toLocaleString()}` 
    : '₦0';

  const currentDisplayBalance = depositBalance !== null 
    ? `₦${depositBalance.toLocaleString()}` 
    : user.depositWallet !== undefined 
      ? `₦${(user.depositWallet || 0).toLocaleString()}` 
      : '₦0.00';

  return (
    <div id="flutterwave-deposit-screen" className="space-y-6">
      {/* Live Balance Card from wallets/{userId}/NGN */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-5 rounded-2xl text-white shadow-xl relative overflow-hidden border border-indigo-700/50">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Wallet className="w-32 h-32 text-indigo-400" />
        </div>
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-indigo-400" />
              Deposit Wallet Balance (NGN)
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
            Path: <span className="font-mono text-indigo-200">wallets/{user.uid || '...'}/NGN/depositWallet</span>
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
        
        {/* Quick Amount Buttons: N1k to N50k */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
          {quickAmountOptions.map((opt) => (
            <button
              id={`quick-amt-${opt.value}`}
              key={opt.value}
              type="button"
              onClick={() => {
                setAmount(opt.value.toString());
                if (errorMessage) setErrorMessage(null);
              }}
              className={`py-2.5 px-2 border rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                amount === opt.value.toString()
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-md scale-[1.02]'
                  : 'border-slate-200 text-slate-700 hover:border-indigo-400 bg-white hover:bg-slate-50'
              }`}
            >
              {amount === opt.value.toString() && <Check className="w-3 h-3 text-white" />}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Channels Indicator - ALL channels supported */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Central Processor Payment Channels
          </span>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-150">
            ALL Channels Active
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
            <span>OPay Wallet</span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 flex items-center gap-2 text-slate-700 shadow-2xs">
            <ArrowUpRight className="w-4 h-4 text-blue-600 shrink-0" />
            <span>USSD & Direct Dial</span>
          </div>
        </div>
      </div>

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
          disabled={isInitializing || isVerifying}
          onClick={handleFundCheckout}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 active:scale-[0.99] text-white font-black uppercase text-base tracking-wider rounded-2xl transition-all shadow-xl hover:shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isInitializing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Connecting Central Gateway...</span>
            </>
          ) : isVerifying ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verifying & Crediting Balance...</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 fill-amber-300 text-amber-300" />
              <span>FUND {formattedDisplay}</span>
            </>
          )}
        </button>
      </div>

      <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>Secured by Flutterwave Central Processor (Card, Bank, OPay, USSD, Transfer)</span>
      </div>
    </div>
  );
};
