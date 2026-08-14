import React, { useState } from 'react';
import { Loader2, CreditCard, Shield, AlertTriangle, Key } from 'lucide-react';
import { UserProfile } from '../types';
import { 
  getFlutterwavePublicKey, 
  saveFlutterwavePublicKey, 
  createFlutterwavePaymentLink 
} from '../utils/flutterwave';

interface FlutterwaveDepositProps {
  user: UserProfile;
  onSuccess: (paymentInfo: { reference: string; amount: number }) => void;
  onCancel?: () => void;
  defaultAmount?: number;
}

export const FlutterwaveDeposit: React.FC<FlutterwaveDepositProps> = ({
  user,
  onSuccess,
  onCancel,
  defaultAmount = 1000
}) => {
  const [amount, setAmount] = useState<string>(defaultAmount.toString());
  const [isPaying, setIsPaying] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'all' | 'card' | 'ussd' | 'transfer'>('all');
  
  // Custom Public Key (Client ID) override state
  const [customPubKey, setCustomPubKey] = useState<string>(() => getFlutterwavePublicKey());
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [initErrorMessage, setInitErrorMessage] = useState<string | null>(null);

  // Compute active public key
  const activePubKey = getFlutterwavePublicKey();

  const handleSavePubKey = (key: string) => {
    const trimmed = key.trim();
    setCustomPubKey(trimmed);
    saveFlutterwavePublicKey(trimmed);
    setInitErrorMessage(null);
  };

  const quickAmounts = [500, 1000, 5000, 10000];

  const handleFlutterwavePayment = async () => {
    setInitErrorMessage(null);
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Please enter a valid deposit amount greater than zero.');
      return;
    }

    setIsPaying(true);
    const reference = `EFD_FLW_${Math.floor(100 + Math.random() * 900)}_${Date.now()}`;

    try {
      // V4 Pattern: Call Firebase Function / Backend API to generate hosted payment link
      const result = await createFlutterwavePaymentLink({
        email: user.email || 'customer@efado.com',
        name: user.displayName || 'EFADO Member',
        amount: numericAmount,
        currency: 'NGN',
        tx_ref: reference,
        purpose: 'EFADO Wallet Topup',
        meta: {
          userId: user.uid,
          selectedMethod
        },
        customizations: {
          title: 'EFADO Wallet Topup',
          description: 'Instant Wallet Deposit via Flutterwave V4'
        }
      });

      if (result.status && result.link) {
        setIsPaying(false);
        // Direct redirection to official Flutterwave Hosted checkout
        window.location.href = result.link;
        return;
      }

      throw new Error(result.message || 'Could not generate secure Flutterwave checkout session.');
    } catch (err: any) {
      setIsPaying(false);
      console.error('Flutterwave payment initialization error:', err);
      setInitErrorMessage(err.message || 'Unable to establish secure connection to Flutterwave.');
    }
  };

  return (
    <div id="flutterwave-deposit-container" className="space-y-6">
      {/* Section A: Amount Input */}
      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
          Deposit Amount (NGN ₦)
        </label>
        <div className="relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">₦</span>
          <input
            id="flutterwave-amount-input"
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
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Payment Methods Covered
          </span>
          {selectedMethod !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedMethod('all')}
              className="text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setSelectedMethod(selectedMethod === 'card' ? 'all' : 'card')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all hover:scale-105 active:scale-95 ${
              selectedMethod === 'card'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20 font-black'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <CreditCard className={`w-3.5 h-3.5 ${selectedMethod === 'card' ? 'text-white' : 'text-indigo-500'}`} /> Card
          </button>
          <button
            type="button"
            onClick={() => setSelectedMethod(selectedMethod === 'ussd' ? 'all' : 'ussd')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all hover:scale-105 active:scale-95 ${
              selectedMethod === 'ussd'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20 font-black'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            💬 USSD
          </button>
          <button
            type="button"
            onClick={() => setSelectedMethod(selectedMethod === 'transfer' ? 'all' : 'transfer')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all hover:scale-105 active:scale-95 ${
              selectedMethod === 'transfer'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20 font-black'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            🏦 Transfer
          </button>
        </div>
      </div>

      {/* Error Message Alert */}
      {initErrorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Flutterwave Payment Session Issue</span>
          </div>
          <p className="text-[11px] text-rose-800 leading-relaxed font-medium">
            {initErrorMessage}
          </p>
        </div>
      )}

      {/* Key Status & Optional Client ID config */}
      <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
              Integration Architecture:
            </span>
            <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
              🔒 V4 SECURE CHECKOUT (Backend Encrypted)
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowKeyConfig(!showKeyConfig)}
            className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
          >
            ⚙️ {showKeyConfig ? 'Hide Config' : 'Client ID Config'}
          </button>
        </div>

        {showKeyConfig && (
          <div className="space-y-4 pt-3 border-t border-slate-200">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1 text-xs text-indigo-900">
              <p className="font-bold flex items-center gap-1.5 text-[11px]">
                <Shield className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                Client Public Key / Client ID:
              </p>
              <p className="text-[10px] leading-relaxed text-indigo-800">
                The frontend uses only the <strong>Public Key / Client ID</strong>. All API secrets are securely retained strictly in backend server environment variables or Firebase Secrets.
              </p>
            </div>

            {/* Public Key Input */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider">
                Flutterwave Public Key / Client ID:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPubKey}
                  onChange={(e) => handleSavePubKey(e.target.value)}
                  placeholder="e.g. FLWPUBK_TEST-xxxxxxxxxxxxxxxx-X"
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
                {customPubKey && (
                  <button
                    type="button"
                    onClick={() => handleSavePubKey('')}
                    className="px-3 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] uppercase rounded-xl transition-all flex-shrink-0"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section C: Action Button */}
      <div className="pt-2">
        <button
          id="flutterwave-secure-pay-btn"
          type="button"
          disabled={isPaying}
          onClick={handleFlutterwavePayment}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/15 cursor-pointer"
        >
          {isPaying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Opening Flutterwave Checkout...
            </>
          ) : (
            'Pay Now Securely with Flutterwave'
          )}
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
        <Shield className="w-3 h-3 text-emerald-500" />
        Funds reflect instantly. Powered by Flutterwave V4 Hosted Gateway
      </div>
    </div>
  );
};
