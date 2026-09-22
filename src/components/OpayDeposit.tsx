import React, { useState } from 'react';
import { UserProfile } from '../types';
import { OpayService } from '../services/OpayService';
import { Zap, AlertCircle, ArrowRight, Wallet, CheckCircle2 } from 'lucide-react';
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const merchantIdDisplay = import.meta.env.VITE_OPAY_MERCHANT_ID || '';
  const publicKeyDisplay = import.meta.env.VITE_OPAY_PUBLIC_KEY || '';

  const presetAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

  const handleFundWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

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
      const initData = await OpayService.initializePayment(amount, user.uid, phoneNumber);

      if (initData.status && initData.cashierUrl) {
        soundManager.playCashoutChime();

        // TEST MODE FIX - No crash, no reload
        if (initData.cashierUrl.includes('simulated=true') || initData.cashierUrl.includes('verify=EFADO-')) {
          const url = new URL(initData.cashierUrl, window.location.origin);
          const reference = url.searchParams.get('verify') || initData.reference;

          setSuccessMessage(`✅ Success! Wallet funded with ₦${amount.toLocaleString()} (Test Mode). Your balance will update!`);

          if (onSuccess) {
            onSuccess({ reference: reference || '', amount });
          }

          setIsLoading(false);
          return;
        }

        // Real OPay Live
        window.open(initData.cashierUrl, '_blank');
        setSuccessMessage(`OPay checkout opened in new tab. Complete payment.`);
        setIsLoading(false);

      } else {
        throw new Error(initData.message || 'Failed to initialize OPay payment.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment failed. Try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black">
          <Zap className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <span className="text-xs font-black uppercase text-emerald-900">OPay Pay-In Gateway - TEST MODE</span>
          <p className="text-xs text-emerald-800 font-semibold mt-1">Instant wallet funding. Funds credited instantly.</p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl text-sm text-emerald-800 font-black flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleFundWallet} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-800 uppercase">Funding Amount (NGN)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 font-black text-lg">₦</div>
            <input type="number" min="100" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 rounded-2xl text-lg font-black outline-none" required />
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {presetAmounts.map((preset) => (
            <button key={preset} type="button" onClick={() => setAmount(preset)} className={`py-2 rounded-xl text-xs font-black border ${amount === preset? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'}`}>₦{preset.toLocaleString()}</button>
          ))}
        </div>

        <button type="submit" disabled={isLoading} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase rounded-2xl shadow-xl flex items-center justify-center gap-2">
          {isLoading? 'Initializing...' : `Fund Wallet with OPay (₦${amount.toLocaleString()})`}
        </button>
      </form>
    </div>
  );
};
