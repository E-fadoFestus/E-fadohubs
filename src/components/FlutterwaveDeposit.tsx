import React, { useState, useEffect } from 'react';
import { Loader2, CreditCard, Shield, AlertTriangle, Key } from 'lucide-react';
import { UserProfile } from '../types';
import { 
  getFlutterwavePublicKey, 
  saveFlutterwavePublicKey, 
  getFlutterwaveSecretKey, 
  saveFlutterwaveSecretKey,
  isDefaultOrInvalidKey 
} from '../utils/flutterwave';

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
  
  // Custom Public Key & Secret Key override states
  const [customPubKey, setCustomPubKey] = useState<string>(() => getFlutterwavePublicKey());
  const [customSecKey, setCustomSecKey] = useState<string>(() => getFlutterwaveSecretKey());
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [initErrorMessage, setInitErrorMessage] = useState<string | null>(null);

  // Compute active keys
  const activePubKey = getFlutterwavePublicKey();
  const activeSecKey = getFlutterwaveSecretKey();

  const isValidPublicKeyFormat = activePubKey.toUpperCase().startsWith('FLWPUBK');

  const handleSavePubKey = (key: string) => {
    const trimmed = key.trim();
    setCustomPubKey(trimmed);
    saveFlutterwavePublicKey(trimmed);
    setInitErrorMessage(null);
  };

  const handleSaveSecKey = (key: string) => {
    const trimmed = key.trim();
    setCustomSecKey(trimmed);
    saveFlutterwaveSecretKey(trimmed);
    setInitErrorMessage(null);
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
    setInitErrorMessage(null);
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Please enter a valid deposit amount greater than zero.');
      return;
    }

    setIsPaying(true);

    const reference = `EFD_FLW_${Math.floor(100 + Math.random() * 900)}_${Date.now()}`;

    const paymentOptions = selectedMethod === 'all'
      ? 'card, ussd, banktransfer'
      : selectedMethod === 'transfer'
        ? 'banktransfer'
        : selectedMethod;

    // 1. Try backend server initialization API first (passes Secret Key & Public Key)
    fetch('/api/flutterwave/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email || 'customer@efado.com',
        amount: numericAmount,
        userId: user.uid,
        purpose: 'EFADO Wallet Topup',
        currency: 'NGN',
        secretKey: activeSecKey,
        publicKey: activePubKey
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.status && data.link) {
        setIsPaying(false);
        // Redirect to hosted Flutterwave checkout page
        window.location.href = data.link;
        return;
      }
      
      // If server returned a clear key rejection error from Flutterwave
      if (data.message) {
        throw new Error(data.message);
      }
      throw new Error('Could not initialize Flutterwave session.');
    })
    .catch((serverErr: any) => {
      console.warn('Backend server payment initialization skipped or failed:', serverErr);
      
      // If active public key is missing or doesn't start with FLWPUBK, show key config drawer
      if (!isValidPublicKeyFormat) {
        setIsPaying(false);
        setShowKeyConfig(true);
        setInitErrorMessage('Please enter your valid Flutterwave Public Key (starting with FLWPUBK-) and Secret Key (starting with FLWSECK-) below.');
        return;
      }

      // 2. Fallback to inline Flutterwave modal
      try {
        if (typeof window.FlutterwaveCheckout === 'function') {
          window.FlutterwaveCheckout({
            public_key: activePubKey,
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
          throw new Error('FlutterwaveCheckout script function unavailable');
        }
      } catch (err: any) {
        setIsPaying(false);
        console.error('Flutterwave modal launch error:', err);
        setShowKeyConfig(true);
        setInitErrorMessage(`Flutterwave Key Error: ${serverErr.message || 'Invalid parameter (PBFPubKey)'}. Please confirm your Flutterwave Public Key and Secret Key in the key settings box below.`);
      }
    });
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

      {/* Key Validation Alert & Config drawer */}
      <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
              Flutterwave Key Status:
            </span>
            <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase ${
              activePubKey.startsWith('FLWPUBK_TEST') || activeSecKey.startsWith('FLWSECK_TEST')
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : activePubKey.startsWith('FLWPUBK') || activeSecKey.startsWith('FLWSECK')
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}>
              {activePubKey.startsWith('FLWPUBK_TEST') || activeSecKey.startsWith('FLWSECK_TEST') 
                ? '⚠️ TEST KEYS ACTIVE' 
                : (activePubKey.startsWith('FLWPUBK') || activeSecKey.startsWith('FLWSECK')) 
                  ? '🟢 LIVE KEYS ACTIVE' 
                  : '⚠️ KEY SETUP REQUIRED'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowKeyConfig(!showKeyConfig)}
            className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
          >
            ⚙️ {showKeyConfig ? 'Hide Key Config' : 'Configure Flutterwave Keys'}
          </button>
        </div>

        {showKeyConfig && (
          <div className="space-y-4 pt-3 border-t border-slate-200">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1 text-xs text-indigo-900">
              <p className="font-bold flex items-center gap-1.5 text-[11px]">
                <Shield className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                Configure Merchant Keys (Flutterwave Dashboard):
              </p>
              <p className="text-[10px] leading-relaxed text-indigo-800">
                To accept real live payments from your users, paste your <strong>Public Key</strong> (starts with <code className="font-mono font-bold">FLWPUBK-</code>) and <strong>Secret Key</strong> (starts with <code className="font-mono font-bold">FLWSECK-</code>) from your <a href="https://dashboard.flutterwave.com/" target="_blank" rel="noreferrer" className="underline font-bold">Flutterwave Dashboard</a>.
              </p>
            </div>

            {/* Public Key Input */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider">
                1. Flutterwave Public Key (FLWPUBK-...):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPubKey}
                  onChange={(e) => handleSavePubKey(e.target.value)}
                  placeholder="e.g. FLWPUBK-xxxxxxxxxxxxxxxxxxxxxxxx-X"
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

            {/* Secret Key Input */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider">
                2. Flutterwave Secret Key (FLWSECK-...):
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={customSecKey}
                  onChange={(e) => handleSaveSecKey(e.target.value)}
                  placeholder="e.g. FLWSECK-xxxxxxxxxxxxxxxxxxxxxxxx-X"
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
                {customSecKey && (
                  <button
                    type="button"
                    onClick={() => handleSaveSecKey('')}
                    className="px-3 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] uppercase rounded-xl transition-all flex-shrink-0"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <p className="text-[10px] text-slate-500 font-medium">
              Saved keys are retained securely in your local browser session for processing checkouts.
            </p>
          </div>
        )}
      </div>

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
