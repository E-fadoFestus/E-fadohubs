import React, { useState } from 'react';
import { UserProfile } from '../types';
import { OpayService } from '../services/OpayService';
import { Zap, AlertCircle, Wallet, CheckCircle2 } from 'lucide-react';
import { soundManager } from '../services/sound';
import { db, doc, updateDoc, increment } from '../firebase';
import { TransactionService } from '../services/TransactionService';

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

  const presetAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

  const handleFundWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (amount < 100) {
      setErrorMessage('Minimum is ₦100');
      return;
    }

    setIsLoading(true);
    soundManager.playClick();

    try {
      const initData = await OpayService.initializePayment(amount, user.uid, phoneNumber);

      if (initData.status && initData.cashierUrl) {
        // TEST MODE - CREDIT WALLET DIRECTLY
        if (initData.cashierUrl.includes('simulated=true') || initData.cashierUrl.includes('verify=EFADO-')) {
          const url = new URL(initData.cashierUrl, window.location.origin);
          const reference = url.searchParams.get('verify') || initData.reference || `EFADO-${Date.now()}`;

          // 1. Credit Firebase wallet
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            depositWallet: increment(amount)
          });

          // 2. Record transaction
          await TransactionService.recordTransaction({
            userId: user.uid,
            type: 'deposit',
            amount: amount,
            currency: 'NGN',
            status: 'completed',
            method: 'OPay Test',
            hub: 'WALLET',
            purpose: 'Wallet Top-up',
            reference: reference,
            description: `OPay Test Funding ₦${amount}`,
            skipWalletUpdate: true
          });

          setSuccessMessage(`✅ SUCCESS! ₦${amount.toLocaleString()} added to your Deposit Wallet! Check Overview!`);
          soundManager.playCashoutChime();
          
          if (onSuccess) {
            onSuccess({ reference, amount });
          }

          setIsLoading(false);
          return;
        }

        // Real OPay Live
        window.open(initData.cashierUrl, '_blank');
        setSuccessMessage(`OPay checkout opened in new tab.`);
        setIsLoading(false);
      } else {
        throw new Error(initData.message || 'Failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed. Try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl">
        <span className="text-xs font-black uppercase text-emerald-900">OPay Pay-In Gateway - TEST MODE</span>
        <p className="text-xs text-emerald-800 font-semibold mt-1">Test mode instantly credits wallet for testing.</p>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />{errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl text-sm text-emerald-800 font-black flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />{successMessage}
        </div>
      )}

      <form onSubmit={handleFundWallet} className="space-y-5">
        <div>
          <label className="text-xs font-black uppercase">Funding Amount (NGN)</label>
          <input type="number" min="100" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} className="w-full mt-2 px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-lg font-black outline-none" required />
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {presetAmounts.map((preset) => (
            <button key={preset} type="button" onClick={() => setAmount(preset)} className={`py-2 rounded-xl text-xs font-black border ${amount === preset? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-200'}`}>₦{preset.toLocaleString()}</button>
          ))}
        </div>

        <button type="submit" disabled={isLoading} className="w-full py-4 bg-emerald-600 text-white font-black uppercase rounded-2xl">
          {isLoading? 'Crediting...' : `Fund Wallet with OPay (₦${amount.toLocaleString()})`}
        </button>
      </form>
    </div>
  );
};
