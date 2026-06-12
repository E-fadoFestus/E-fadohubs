import React, { useState, useEffect } from 'react';
import { Loader2, Copy, Check, Upload, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '../types';

interface DirectBankDepositProps {
  user: UserProfile;
  defaultAmount?: number;
  onSuccess: () => void;
  onClose?: () => void;
}

const BANK_DATA: Record<string, { country: string; symbol: string; banks: string[] }> = {
  NGN: {
    country: 'Nigeria',
    symbol: '₦',
    banks: ['Access Bank', 'GTBank', 'Zenith Bank', 'First Bank of Nigeria', 'Kuda Bank', 'Moniepoint MFB', 'Other']
  },
  USD: {
    country: 'USA',
    symbol: '$',
    banks: ['Chase Bank', 'Bank of America', 'Wells Fargo', 'Citigroup', 'Other']
  },
  GBP: {
    country: 'UK',
    symbol: '£',
    banks: ['Barclays', 'HSBC UK', 'Lloyds Bank', 'NatWest', 'Other']
  },
  EUR: {
    country: 'Europe',
    symbol: '€',
    banks: ['Deutsche Bank', 'BNP Paribas', 'Societe Generale', 'ING Group', 'Other']
  }
};

const BANK_DETAILS: Record<string, { bankName: string; accountName: string; accountNo: string; extraLabel?: string; extraValue?: string }> = {
  NGN: {
    bankName: 'Sterling Bank',
    accountName: 'E-FADO TECH CO',
    accountNo: '1122334455',
    extraLabel: 'Account Type',
    extraValue: 'Corporate Current'
  },
  USD: {
    bankName: 'Chase Bank USA',
    accountName: 'E-FADO TECH LLC',
    accountNo: '123456789',
    extraLabel: 'SWIFT Code',
    extraValue: 'CHASUS33XXX'
  },
  GBP: {
    bankName: 'Barclays Bank UK',
    accountName: 'E-FADO TECH LTD',
    accountNo: '87654321',
    extraLabel: 'Sort Code',
    extraValue: '20-30-40'
  },
  EUR: {
    bankName: 'Deutsche Bank',
    accountName: 'E-FADO TECH EUROPE GMBH',
    accountNo: 'DE55100700001234567890',
    extraLabel: 'BIC / SWIFT',
    extraValue: 'DEUTDEDBAXX'
  }
};

export const DirectBankDeposit: React.FC<DirectBankDepositProps> = ({
  user,
  defaultAmount = 1000,
  onSuccess,
  onClose
}) => {
  const [currency, setCurrency] = useState<'NGN' | 'USD' | 'GBP' | 'EUR'>('NGN');
  const [country, setCountry] = useState<string>('Nigeria');
  const [amount, setAmount] = useState<string>(defaultAmount.toString());
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [customBankName, setCustomBankName] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  
  // Proof upload state
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofFileName, setProofFileName] = useState<string>('');
  const [proofBase64, setProofBase64] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(false);

  // General state
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  // Re-generate Reference and sync country on Currency Change
  useEffect(() => {
    setCountry(BANK_DATA[currency].country);
    const defaults = BANK_DATA[currency].banks;
    setSelectedBank(defaults[0]);
    generateReference();
  }, [currency]);

  const generateReference = () => {
    const chars = '0123456789';
    let rand = '';
    for (let i = 0; i < 3; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const today = new Date();
    const pad = (num: number) => String(num).padStart(2, '0');
    const yyyymmdd = today.getFullYear() + pad(today.getMonth() + 1) + pad(today.getDate());
    const hhmmss = pad(today.getHours()) + pad(today.getMinutes()) + pad(today.getSeconds());
    setReference(`EFD${rand}_${yyyymmdd}_${hhmmss}`);
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB limit. Please upload a smaller screenshot.');
        return;
      }
      setProofFile(file);
      setProofFileName(file.name);

      // Convert to Base64 so we can save it as an offline proof attachment in Firestore
      setUploadProgress(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofBase64(reader.result as string);
        setUploadProgress(false);
      };
      reader.onerror = () => {
        console.error('FileReader failure');
        setUploadProgress(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    if (!proofBase64) {
      alert('Please upload a screenshot or image copy as proof of your bank transfer receipt.');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const actualBankName = selectedBank === 'Other' ? customBankName : selectedBank;
    const destDetails = BANK_DETAILS[currency];

    try {
      // Save directly to 'deposits' collection in Firestore
      await addDoc(collection(db, 'deposits'), {
        user_id: user.uid,
        user_email: user.email,
        currency,
        amount: numericAmount,
        channel: 'bank_transfer',
        reference,
        bank_account_id: currency, // use the currency as the account detail ID since it's hardcoded
        custom_bank_name: selectedBank === 'Other' ? actualBankName : '',
        transaction_id: transactionId || '',
        proof_url: proofBase64, // local base64 preview stored securely
        proof_name: proofFileName,
        status: 'pending',
        created_at: serverTimestamp(),
        // Extra helpful metadata for auditing
        sender_country: country,
        sender_bank: actualBankName,
        destination_bank: destDetails.bankName,
        destination_account: destDetails.accountNo
      });

      setStatusMessage({
        type: 'success',
        text: 'Sync Complete. Your deposit setup has been routed to CEO Monitory finance queue for verification.'
      });
      
      // Fire success callback (e.g. refresh transactional logs or show alert)
      setTimeout(() => {
        onSuccess();
      }, 5000);
      
    } catch (err: any) {
      console.error('Error recording bank deposit draft:', err);
      setStatusMessage({
        type: 'error',
        text: `Submission failed: ${err.message || String(err)}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDetails = BANK_DETAILS[currency];
  const symbol = BANK_DATA[currency].symbol;

  return (
    <div id="direct-bank-deposit-container" className="space-y-6">
      {statusMessage ? (
        <div 
          id="deposit-receipt-screen" 
          className="p-8 bg-slate-900 border border-[#DAA520]/20 rounded-3xl text-center space-y-6 animate-fade-in"
        >
          <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 text-[#DAA520] rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h4 className="text-xl font-black text-white uppercase tracking-tight">Transmission Synced</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-relaxed">
              REFERENCE: <span className="text-[#DAA520]">{reference}</span>
            </p>
          </div>
          <div className="p-6 bg-slate-950/80 border border-white/5 rounded-2xl text-left space-y-3">
            <p className="text-xs text-slate-300 font-bold leading-normal">
              🛡️ {statusMessage.text}
            </p>
            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest leading-normal">
              🔔 Pending Admin Confirmation. You’ll get SMS + Email once confirmed. Usually 5-30 mins during business hours.
            </p>
          </div>
          <p className="text-[9px] text-slate-500 font-bold leading-none uppercase tracking-widest">
            Redirecting to transaction ledger in 5 seconds...
          </p>
        </div>
      ) : step === 1 ? (
        /* Step 1: Currency selection and amount */
        <div id="step-1-deposit-form" className="space-y-5 animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            {/* Selective Currency Dropdown */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Currency</label>
              <select
                id="deposit-currency-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-black text-black focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                <option value="NGN">NGN (₦) - Naira</option>
                <option value="USD">USD ($) - Dollar</option>
                <option value="GBP">GBP (£) - Pound</option>
                <option value="EUR">EUR (€) - Euro</option>
              </select>
            </div>

            {/* Selective Country Dropdown */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Country</label>
              <select
                id="deposit-country-select"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-black text-black focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                {currency === 'NGN' && <option value="Nigeria">Nigeria</option>}
                {currency === 'USD' && <option value="USA">United States</option>}
                {currency === 'GBP' && <option value="UK">United Kingdom</option>}
                {currency === 'EUR' && (
                  <>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Italy">Italy</option>
                    <option value="Europe">Other Europe</option>
                  </>
                )}
                <option value="Other">Other country / Wire</option>
              </select>
            </div>
          </div>

          {/* Amount input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Amount to deposit</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">{symbol}</span>
              <input
                id="deposit-amount-input"
                type="number"
                placeholder="e.g. 50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-black focus:outline-none focus:border-indigo-600 text-black placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Bank selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Your Sending Bank</label>
              <select
                id="sender-bank-select"
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-black text-black focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                {BANK_DATA[currency].banks.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {selectedBank === 'Other' && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Type your Bank Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Nova Pioneer Bank"
                  value={customBankName}
                  onChange={(e) => setCustomBankName(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-black focus:outline-none focus:border-indigo-600 text-black"
                />
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              id="deposit-proceed-button"
              type="button"
              onClick={() => {
                const num = parseFloat(amount);
                if (isNaN(num) || num <= 0) {
                  alert('Please enter a positive amount first.');
                  return;
                }
                setStep(2);
              }}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-md flex items-center gap-2"
            >
              Continue to Bank Details <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Step 2: Show Bank details, Reference, and Upload form */
        <form onSubmit={handleSubmitDeposit} id="step-2-deposit-form" className="space-y-5 animate-fade-in">
          {/* Back reference link */}
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest transition-colors flex items-center gap-1.5"
          >
            ← Back to amount
          </button>

          {/* Section: Bank details and Account Information */}
          <div className="p-6 bg-slate-900 border border-slate-800 text-white rounded-3xl space-y-4 shadow-xl">
            <span className="text-[9px] font-black text-[#DAA520] uppercase tracking-[0.2em] block pl-1">
              SOVEREIGN ESCROW ENDPOINT
            </span>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <p className="text-[8px] font-bold text-slate-400 uppercase">Settlement Bank</p>
                <p className="font-black text-slate-100">{currentDetails.bankName}</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <p className="text-[8px] font-bold text-slate-400 uppercase">Account Name</p>
                <p className="font-black text-slate-100 truncate">{currentDetails.accountName}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl flex items-center justify-between border border-white/5">
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase">Account Number / IBAN</p>
                <p className="text-sm font-black font-mono text-[#DAA520]">{currentDetails.accountNo}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopyText(currentDetails.accountNo, 'acc')}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-slate-300 hover:text-white transition-all flex items-center justify-center"
              >
                {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {currentDetails.extraLabel && (
              <div className="p-4 bg-slate-950/60 rounded-xl flex items-center justify-between text-xs border border-white/5">
                <span className="text-slate-400 font-bold uppercase text-[9px]">{currentDetails.extraLabel}</span>
                <span className="font-black text-slate-200">{currentDetails.extraValue}</span>
              </div>
            )}

            {/* Crucial unique transaction reference */}
            <div className="p-4 bg-indigo-950/40 border border-indigo-900/40 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-indigo-300 uppercase tracking-wider">Narration / Reference ID</p>
                <p className="text-sm font-black font-mono text-indigo-200 tracking-wider p-0.5">{reference}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopyText(reference, 'ref')}
                className="p-3 bg-indigo-900/40 hover:bg-indigo-900/60 rounded-2xl text-indigo-300 hover:text-white transition-all"
              >
                {copiedField === 'ref' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="p-4 bg-slate-950/20 text-center border-t border-slate-800">
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                Required Deposit: <span className="font-black text-white text-lg">{symbol}{parseFloat(amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </span>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                “Use Reference exactly as shown in transfer narration”
              </p>
            </div>
          </div>

          {/* Form items for Screenshot upload & Txn ID */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label id="upload-label" className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                Proof of Transfer (Screenshot / Image)
              </label>
              
              <div id="file-picker-container" className="relative group">
                <input
                  required
                  type="file"
                  accept="image/png, image/jpeg, application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="screenshot-file-input"
                />
                <label
                  htmlFor="screenshot-file-input"
                  className="w-full h-32 border-2 border-dashed border-slate-200 hover:border-indigo-500 bg-slate-50 rounded-2xl cursor-pointer flex flex-col items-center justify-center p-4 text-center transition-all group-hover:bg-slate-100"
                >
                  {uploadProgress ? (
                    <div className="space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Syncing Image Node...</p>
                    </div>
                  ) : proofFileName ? (
                    <div className="space-y-1">
                      <Check className="w-7 h-7 text-emerald-500 mx-auto mb-1" />
                      <p className="text-xs font-black text-slate-700 truncate max-w-xs">{proofFileName}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tap to replace file (MAX 2MB)</p>
                    </div>
                  ) : (
                    <div className="space-y-1 text-slate-500">
                      <Upload className="w-7 h-7 mx-auto mb-1 text-slate-400 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-black text-slate-700 uppercase tracking-tight">Upload bank screenshot / Alert</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">JPG, PNG, or PDF up to 2MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                Bank Transaction ID / Narration details
              </label>
              <input
                type="text"
                placeholder="Optional - e.g. T20261111832049"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-black text-black focus:outline-none focus:border-indigo-600 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 py-4 border-2 border-slate-200 hover:border-slate-300 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors"
            >
              Back
            </button>
            <button
              id="deposit-submit-button"
              type="submit"
              disabled={isSubmitting || uploadProgress}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-emerald-600/10 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Broadcasting Ledger...
                </>
              ) : (
                'I Have Made Payment'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
