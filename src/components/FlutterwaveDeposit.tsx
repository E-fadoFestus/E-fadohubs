import React, { useState, useEffect } from 'react';
import { Loader2, CreditCard, Shield, AlertTriangle } from 'lucide-react';
import { UserProfile } from '../types';
import { getFlutterwavePublicKey, saveFlutterwavePublicKey, isDefaultOrInvalidKey } from '../utils/flutterwave';

interface FlutterwaveDepositProps {
  user: UserProfile;
  onSuccess: (paymentInfo: { reference: string; amount: number }) => void;
  onCancel?: () => void;
  defaultAmount?: number;
}

declare global {
  interface Window {
    FlutterwaveCheckout: any;
  }
}

export const FlutterwaveDeposit: React.FC<FlutterwaveDepositProps> = ({
  user,
  onSuccess,
  onCancel,
  defaultAmount = 1000
}) => {
  const [amount, setAmount] = useState<string>(defaultAmount.toString());
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'all' | 'card' | 'ussd' | 'transfer'>('all');
  
  // Custom Public Key override state (stored in localStorage)
  const [customKey, setCustomKey] = useState<string>(() => {
    return localStorage.getItem('efado_flw_public_key') || '';
  });
  const [showKeyConfig, setShowKeyConfig] = useState(false);

  // Compute active key
  const activeKey = getFlutterwavePublicKey();

  // Validate if active key matches expected Flutterwave Public Key format (FLWPUBK...)
  const isValidPublicKeyFormat = activeKey.toUpperCase().startsWith('FLWPUBK');

  // Save custom key
  const handleSaveCustomKey = (key: string) => {
    const trimmed = key.trim();
    setCustomKey(trimmed);
    saveFlutterwavePublicKey(trimmed);
  };

  // Dynamically load Flutterwave Inline JS script
  useEffect(() => {
    if (window.FlutterwaveCheckout) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;

    script.onload = () => {
      setScriptLoaded(true);
    };

    script.onerror = () => {
      console.error('Failed to load Flutterwave Inline script.');
      setScriptError(true);
    };

    document.body.appendChild(script);

    return () => {};
  }, []);

  const quickAmounts = [500, 1000, 5000, 10000];

  const handleFlutterwavePayment = () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Please enter a valid deposit amount greater than zero.');
      return;
    }

    if (!scriptLoaded) {
      alert('Flutterwave secure gateway is initializing. Please wait a moment.');
      return;
    }

    if (!isValidPublicKeyFormat) {
      setShowKeyConfig(true);
      alert('Your configured key is not a valid Flutterwave Public Key. Flutterwave Public Keys start with "FLWPUBK...". Please check the key input box below.');
      return;
    }

    setIsPaying(true);

    const flwKey = activeKey;
    const reference = `EFD_FLW_${Math.floor(100 + Math.random() * 900)}_${Date.now()}`;

    const paymentOptions = selectedMethod === 'all'
      ? 'card, ussd, banktransfer'
      : selectedMethod === 'transfer'
        ? 'banktransfer'
        : selectedMethod;

    try {
      if (typeof window.FlutterwaveCheckout === 'function') {
        window.FlutterwaveCheckout({
          public_key: flwKey,
          tx_ref: reference,
          amount: numericAmount,
          currency: 'NGN',
          payment_options: paymentOptions,
          customer: {
            email: user.email || 'customer@efado.com',
            name: user.displayName || 'EFADO Member',
          },
          customizations: {
            title: 'EFADO Wallet Topup',
            description: 'Instant Wallet Deposit',
            logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&h=120&fit=crop',
          },
          callback: (response: any) => {
            setIsPaying(false);
            if (response && (response.status === 'successful' || response.status === 'completed')) {
              onSuccess({
                reference: response.tx_ref || reference,
                amount: numericAmount
              });
            } else {
              alert('Payment execution did not return a successful receipt. Please verify details.');
            }
          },
          onclose: () => {
            setIsPaying(false);
            if (onCancel) onCancel();
          }
        });
      } else {
        setIsPaying(false);
        alert('Could not launch Flutterwave checkout.');
      }
    } catch (err) {
      console.error('Error invoking Flutterwave Client:', err);
      setIsPaying(false);
      alert('Could not start Flutterwave checkout process. Ensure your internet connection is active.');
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
            Payment Methods Covered (Click to Select / Filter)
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

      {scriptError && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p className="font-medium leading-relaxed">
            Failed to connect with Flutterwave security nodes. Please reload or check if a browser ad blocker is blocking checkout.flutterwave.com.
          </p>
        </div>
      )}

      {/* Key Validation Alert & Config drawer */}
      {(!isValidPublicKeyFormat || showKeyConfig) && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-xs font-black uppercase text-amber-600 tracking-wide">
                Flutterwave Public Key Required
              </h5>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                Flutterwave Inline payment modal requires a <strong>Public Key</strong> starting with <code className="bg-amber-100 text-amber-800 px-1 py-0.5 rounded font-mono font-bold">FLWPUBK...</code> (or <code className="bg-amber-100 text-amber-800 px-1 py-0.5 rounded font-mono font-bold">FLWPUBK_TEST...</code>).
                {activeKey && !isValidPublicKeyFormat && (
                  <span className="block mt-1 text-red-600 font-bold">
                    ⚠️ Current Key (<code className="font-mono text-[10px]">{activeKey.substring(0, 16)}...</code>) is a Client ID, not a Flutterwave Public Key.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-1 border-t border-amber-200/60">
            <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider">
              Paste Your Flutterwave Public Key (Starts with FLWPUBK):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customKey}
                onChange={(e) => handleSaveCustomKey(e.target.value)}
                placeholder="FLWPUBK-xxxxxxxxxxxxxxxxxxxxxxxx-X"
                className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
              />
              {customKey && (
                <button
                  type="button"
                  onClick={() => handleSaveCustomKey('')}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-500">
              💡 Where to find it? Log into your Flutterwave Dashboard &rarr; <strong>Settings &rarr; API keys</strong> &rarr; copy <strong>Public Key</strong> (starts with FLWPUBK).
            </p>
          </div>
        </div>
      )}

      {!isValidPublicKeyFormat && !showKeyConfig && (
        <button
          type="button"
          onClick={() => setShowKeyConfig(true)}
          className="text-[10px] font-black uppercase text-amber-600 hover:text-amber-800 underline block"
        >
          ⚙️ Need to update Flutterwave Public Key? Click here
        </button>
      )}

      {/* Section C: Action Button */}
      <div className="pt-2">
        <button
          id="flutterwave-secure-pay-btn"
          type="button"
          disabled={!scriptLoaded || isPaying}
          onClick={handleFlutterwavePayment}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/15"
        >
          {isPaying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Opening Flutterwave Terminal...
            </>
          ) : !scriptLoaded ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Syncing Security Credentials...
            </>
          ) : (
            'Pay Now Securely with Flutterwave'
          )}
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
        <Shield className="w-3 h-3 text-emerald-500" />
        Funds reflect in 3-5 seconds. Powered by Flutterwave
      </div>
    </div>
  );
};
