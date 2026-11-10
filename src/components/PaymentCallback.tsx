import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, ArrowRight, Wallet, RefreshCw } from 'lucide-react';
import { auth } from '../firebase';

interface PaymentCallbackProps {
  onGoToWallet?: () => void;
}

export const PaymentCallback: React.FC<PaymentCallbackProps> = ({ onGoToWallet }) => {
  const [reference, setReference] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('reference') || params.get('trxref') || '';
    setReference(ref);

    if (!ref) {
      setLoading(false);
      setErrorMessage('Missing payment transaction reference in URL.');
      return;
    }

    let isMounted = true;

    async function verify() {
      try {
        let token = '';
        if (auth.currentUser) {
          token = await auth.currentUser.getIdToken();
        } else if (auth.authStateReady) {
          await auth.authStateReady();
          if (auth.currentUser) {
            token = await auth.currentUser.getIdToken();
          }
        }

        const res = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(ref)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await res.json().catch(() => null);

        if (!isMounted) return;

        if (res.ok && data?.success) {
          setSuccess(true);
          setAmount(data.amount || null);
        } else {
          console.error('Paystack verify error:', data);
          setSuccess(false);
          const rawErr = data?.error;
          const errStr = typeof rawErr === 'string' ? rawErr : (rawErr?.message || (typeof rawErr === 'object' ? JSON.stringify(rawErr) : null));
          const message = errStr || data?.message || 'Payment verification could not be confirmed.';
          setErrorMessage(message);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Paystack verify error:', err);
        setSuccess(false);
        const message = (typeof err?.message === 'string' ? err.message : null) || 'Network error verifying payment.';
        setErrorMessage(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleWalletNav = () => {
    if (onGoToWallet) {
      onGoToWallet();
    } else {
      window.location.href = '/#wallet';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
        
        {loading && (
          <div className="space-y-4 py-8">
            <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto" />
            <h2 className="text-xl font-black uppercase tracking-wider text-slate-100">
              Confirming Payment...
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Ref: {reference}
            </p>
          </div>
        )}

        {!loading && success && (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/30">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                Payment Confirmed!
              </h2>
              <p className="text-3xl font-black text-emerald-400 font-mono">
                {amount !== null ? `₦${amount.toLocaleString()}` : 'Funds'}
              </p>
              <p className="text-xs text-slate-300 font-medium">
                added to your EFADO Sovereign Wallet.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleWalletNav}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                <span>Go to Wallet</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {!loading && !success && (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-20 h-20 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto border-2 border-rose-500/30">
              <XCircle className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tight text-rose-400">
                Payment Failed
              </h2>
              <p className="text-xs text-rose-200">
                {errorMessage || 'The payment could not be completed.'}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black uppercase tracking-widest text-xs rounded-2xl transition-all border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={handleWalletNav}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                <span>Go to Wallet</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
