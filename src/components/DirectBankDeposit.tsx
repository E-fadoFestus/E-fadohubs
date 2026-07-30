import React, { useState, useEffect } from 'react';
import { Loader2, Copy, Check, Upload, ArrowRight, ShieldCheck, AlertCircle, FileText, CheckCircle2, Building2, Banknote, ShieldAlert } from 'lucide-react';
import { PaymentGuidelinesModal } from './PaymentGuidelinesModal';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { UserProfile } from '../types';
import { StrategicReceipt } from './StrategicReceipt';
import { NIGERIAN_BANKS, resolveBankAccount } from '../utils/bankVerification';

interface DirectBankDepositProps {
  user: UserProfile;
  defaultAmount?: number;
  onSuccess: () => void;
  onClose?: () => void;
}

const OFFICIAL_NGN_ACCOUNTS = [
  { bankName: 'GTBANK PLC', accountName: 'EFADO Technology Computer Engineering Training and Services', accountNo: '3001964082', badge: 'Primary Corporate NGN' },
  { bankName: 'OPAY DIGITAL MFB', accountName: 'EFADO Technology Computer Engineering Training and Services', accountNo: '8072456836', badge: 'OPay Business Instant' },
  { bankName: 'ACCESS BANK PLC', accountName: 'Okhawere Festus Daniel', accountNo: '0001304979', badge: 'Access Corporate / Savings' },
  { bankName: 'UBA BANK PLC', accountName: 'Okhawere Festus Daniel', accountNo: '2120742200', badge: 'UBA Corporate / Savings' },
];

const INTERNATIONAL_ACCOUNTS: Record<string, { bankName: string; accountName: string; accountNo: string; extraLabel?: string; extraValue?: string }> = {
  USD: {
    bankName: 'GTBANK PLC (USD Domiciliary / Wire)',
    accountName: 'EFADO Technology Computer Engineering Training and Services',
    accountNo: '3001964109',
    extraLabel: 'SWIFT / BIC Code',
    extraValue: 'GTBIGBLA'
  },
  GBP: {
    bankName: 'GTBANK PLC (GBP Domiciliary / Wire)',
    accountName: 'EFADO Technology Computer Engineering Training and Services',
    accountNo: '3001964123',
    extraLabel: 'SWIFT / BIC Code',
    extraValue: 'GTBIGBLA'
  },
  EUR: {
    bankName: 'GTBANK PLC (EUR Domiciliary / Wire)',
    accountName: 'EFADO Technology Computer Engineering Training and Services',
    accountNo: '3001964147',
    extraLabel: 'SWIFT / BIC Code',
    extraValue: 'GTBIGBLA'
  }
};

export const DirectBankDeposit: React.FC<DirectBankDepositProps> = ({
  user,
  defaultAmount = 1000,
  onSuccess,
  onClose
}) => {
  // Flow state: strictly 2 steps!
  // Step 1 = Payment Instruction Screen (EFADO details + amount due + copyable reference)
  // Step 2 = Payment Confirmation Screen (Sender bank verification + transaction ID + proof upload)
  const [step, setStep] = useState<1 | 2>(1);

  // Currency & Amount
  const [currency, setCurrency] = useState<'NGN' | 'USD' | 'GBP' | 'EUR'>('NGN');
  const [amount, setAmount] = useState<string>(defaultAmount.toString());
  const [reference, setReference] = useState<string>('');
  const [showGuidelinesModal, setShowGuidelinesModal] = useState<boolean>(false);

  // Step 2: Sender Account Verification States
  const [senderBankCode, setSenderBankCode] = useState<string>('044'); // Access Bank default
  const [senderBankName, setSenderBankName] = useState<string>('Access Bank PLC');
  const [customBankName, setCustomBankName] = useState<string>('');
  const [senderAccountNumber, setSenderAccountNumber] = useState<string>('');
  
  // Account Name Enquiry API state
  const [isResolvingAccount, setIsResolvingAccount] = useState<boolean>(false);
  const [resolvedAccountName, setResolvedAccountName] = useState<string>('');
  const [accountResolveError, setAccountResolveError] = useState<string | null>(null);

  // Step 2: Payment Evidence States
  const [bankTransactionId, setBankTransactionId] = useState<string>('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofFileName, setProofFileName] = useState<string>('');
  const [proofBase64, setProofBase64] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(false);

  // General States
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Generate unique transaction reference on mount
  useEffect(() => {
    generateReference();
  }, []);

  const generateReference = () => {
    const chars = '0123456789';
    let rand = '';
    for (let i = 0; i < 4; i++) {
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

  // Automatic Bank Account Name Resolution when 10 digits typed or bank changes
  useEffect(() => {
    if (step === 2) {
      const cleanNo = senderAccountNumber.trim().replace(/\D/g, '');
      if (cleanNo.length === 10) {
        triggerAccountResolution(cleanNo, senderBankCode, senderBankName);
      } else {
        setResolvedAccountName('');
        setAccountResolveError(null);
      }
    }
  }, [senderAccountNumber, senderBankCode, senderBankName, step]);

  const triggerAccountResolution = async (accNum: string, bankCode: string, bankNameStr: string) => {
    setIsResolvingAccount(true);
    setAccountResolveError(null);
    setResolvedAccountName('');

    const effectiveBankName = bankCode === '000' ? customBankName || 'Other Bank' : bankNameStr;
    const result = await resolveBankAccount(accNum, bankCode, effectiveBankName);

    setIsResolvingAccount(false);
    if (result.success && result.accountName) {
      setResolvedAccountName(result.accountName);
      setAccountResolveError(null);
    } else {
      setResolvedAccountName('');
      setAccountResolveError(result.message || 'Unable to resolve account holder name. Please check account number.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 3 * 1024 * 1024) {
        alert('File size exceeds 3MB limit. Please upload a smaller screenshot or PDF.');
        return;
      }
      setProofFile(file);
      setProofFileName(file.name);

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

  const handleBankSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;
    setSenderBankCode(selectedCode);
    const found = NIGERIAN_BANKS.find(b => b.code === selectedCode);
    if (found) {
      setSenderBankName(found.name);
    }
  };

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Please enter a valid deposit amount.');
      return;
    }

    if (!senderAccountNumber || senderAccountNumber.trim().length < 8) {
      alert('Please enter a valid 10-digit sender account number.');
      return;
    }

    if (!resolvedAccountName) {
      alert('Sender Account Name Verification is required! Please verify account number and bank before submitting.');
      return;
    }

    if (!bankTransactionId.trim()) {
      alert('Please enter your Bank Transaction Reference or Session ID.');
      return;
    }

    if (!proofBase64) {
      alert('Please upload a screenshot or PDF document as proof of payment.');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const actualBankName = senderBankCode === '000' ? (customBankName || 'Other Bank') : senderBankName;

    try {
      const depositPayload = {
        user_id: user.uid,
        user_email: user.email,
        currency,
        amount: numericAmount,
        channel: 'bank_transfer',
        reference,
        bank_transaction_id: bankTransactionId.trim(),
        sender_bank_code: senderBankCode,
        sender_bank_name: actualBankName,
        sender_account_number: senderAccountNumber.trim(),
        sender_verified_account_name: resolvedAccountName,
        proof_url: proofBase64,
        proof_name: proofFileName,
        status: 'pending', // 'Pending Review'
        created_at: serverTimestamp(),
        destination_bank: currency === 'NGN' ? 'GTBANK PLC / OPAY / ACCESS / UBA' : INTERNATIONAL_ACCOUNTS[currency]?.bankName || 'GTBank Wire',
        destination_account: currency === 'NGN' ? '3001964082 / 8072456836' : INTERNATIONAL_ACCOUNTS[currency]?.accountNo || '3001964109'
      };

      // 1. Save directly to 'deposits' collection
      const depositDocRef = await addDoc(collection(db, 'deposits'), depositPayload);

      // 2. Also log to 'transactions' collection with unique ID so CEO/Admin panel can view and reconcile
      const txCustomId = `MAN_DEP_${reference}`;
      await setDoc(doc(db, 'transactions', txCustomId), {
        userId: user.uid,
        type: 'deposit',
        amount: numericAmount,
        currency,
        status: 'pending',
        reference,
        timestamp: serverTimestamp(),
        description: `Manual Bank Transfer (Ref: ${reference}) | Sender: ${resolvedAccountName} (${actualBankName} - ${senderAccountNumber}) | TxID: ${bankTransactionId}`,
        metadata: {
          gateway: 'direct_bank_transfer',
          depositDocId: depositDocRef.id,
          senderBank: actualBankName,
          senderAccountNumber: senderAccountNumber.trim(),
          senderAccountName: resolvedAccountName,
          bankTransactionId: bankTransactionId.trim(),
          proofFileName,
          proofUrl: proofBase64
        }
      });

      setStatusMessage({
        type: 'success',
        text: 'Deposit Submitted for Admin Verification! Your transfer record and proof of payment have been safely registered on the EFADO ledger.'
      });

      // Call onSuccess callback
      setTimeout(() => {
        onSuccess();
      }, 4000);

    } catch (err: any) {
      console.error('Error submitting direct bank transfer:', err);
      setStatusMessage({
        type: 'error',
        text: `Submission failed: ${err.message || String(err)}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€';

  return (
    <div id="direct-bank-transfer-container" className="space-y-6">
      {/* Guidelines Action Banner */}
      <div className="flex items-center justify-between bg-slate-900 border border-amber-500/30 p-3.5 rounded-2xl flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-black uppercase text-amber-300 tracking-wider">
            DEFAULT PAYMENT METHOD: DIRECT BANK DEPOSIT
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowGuidelinesModal(true)}
          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase rounded-xl tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5 text-slate-950" />
          <span>📖 Payment & Payout Guide</span>
        </button>
      </div>

      {/* Visual Step Indicator (2 Steps Only) */}
      {!statusMessage && (
        <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
          <div className={`flex items-center gap-2.5 ${step === 1 ? 'text-[#DAA520] font-black' : 'text-slate-400 font-bold'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${step === 1 ? 'bg-[#DAA520] text-slate-950 shadow-md shadow-[#DAA520]/20' : 'bg-slate-800 text-slate-300'}`}>1</span>
            <div>
              <span className="text-[10px] uppercase tracking-wider block font-black">STEP 1: PAYMENT INSTRUCTIONS</span>
              <span className="text-[8px] text-slate-400 block hidden sm:block">EFADO Escrow Details & Reference</span>
            </div>
          </div>

          <div className="flex-1 mx-4 h-[2px] bg-slate-800" />

          <div className={`flex items-center gap-2.5 ${step === 2 ? 'text-[#DAA520] font-black' : 'text-slate-400 font-bold'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${step === 2 ? 'bg-[#DAA520] text-slate-950 shadow-md shadow-[#DAA520]/20' : 'bg-slate-800 text-slate-300'}`}>2</span>
            <div>
              <span className="text-[10px] uppercase tracking-wider block font-black">STEP 2: PAYMENT CONFIRMATION</span>
              <span className="text-[8px] text-slate-400 block hidden sm:block">Account Verification & Proof Upload</span>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS CONFIRMATION RECEIPT SCREEN */}
      {statusMessage && statusMessage.type === 'success' ? (
        <div id="deposit-success-screen" className="p-8 bg-slate-900 border border-[#DAA520]/30 rounded-3xl text-center space-y-6 animate-fade-in shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h4 className="text-xl font-black text-white uppercase tracking-tight">Deposit Pending Review</h4>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              NARRATION REF: <span className="text-[#DAA520] font-mono font-black">{reference}</span>
            </p>
          </div>

          <div className="p-5 bg-slate-950/90 border border-white/10 rounded-2xl text-left space-y-3">
            <p className="text-xs text-slate-200 font-bold leading-relaxed">
              ✅ {statusMessage.text}
            </p>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
              <p className="text-[10px] text-amber-300 font-black uppercase tracking-wider">
                ⏳ Administrator Review Status: Pending Review
              </p>
              <p className="text-[9px] text-amber-200/80 leading-normal">
                An administrator will verify your bank transfer against your uploaded receipt proof. Funds will be credited directly to your wallet upon reconciliation (usually 5 to 30 mins).
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowReceiptModal(true)}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
            >
              <FileText className="w-4 h-4 text-emerald-200" /> View & Print Payment Receipt
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black rounded-2xl text-xs uppercase tracking-widest transition-all"
              >
                Close Window
              </button>
            )}
          </div>
        </div>
      ) : statusMessage && statusMessage.type === 'error' ? (
        <div className="p-6 bg-rose-950/40 border border-rose-500/30 rounded-2xl space-y-3 text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto animate-bounce" />
          <p className="text-xs text-rose-300 font-bold">{statusMessage.text}</p>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="px-4 py-2 bg-rose-600 text-white font-black rounded-xl text-xs uppercase tracking-wider"
          >
            Try Again
          </button>
        </div>
      ) : step === 1 ? (
        /* ================= STEP 1: PAYMENT INSTRUCTION SCREEN ================= */
        <div id="step-1-payment-instructions" className="space-y-6 animate-fade-in">
          {/* Header Notice */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 border border-indigo-500/20 rounded-2xl text-white space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#DAA520]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-[#DAA520]">
                EFADO DIRECT BANK TRANSFER & ESCROW DEPOSIT
              </h3>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
              Please review the company bank accounts below and make your transfer using your bank app or USSD code. No personal form input is required in this step.
            </p>
          </div>

          {/* Amount Due & Currency Selection */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <label className="text-[10px] font-black text-[#DAA520] uppercase tracking-widest block">
                1. Select Currency & Deposit Amount
              </label>
              <div className="flex gap-2">
                {(['NGN', 'USD', 'GBP', 'EUR'] as const).map(curr => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setCurrency(curr)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${
                      currency === curr ? 'bg-[#DAA520] text-slate-950 font-black shadow-md' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Amount Due for Transfer</span>
                <div className="relative mt-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-amber-400">{symbol}</span>
                  <input
                    id="deposit-amount-due-input"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono font-black text-white focus:outline-none focus:border-[#DAA520]"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                <Banknote className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                <div>
                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest block">Calculated Total</span>
                  <p className="text-base font-black text-white font-mono">
                    {symbol}{parseFloat(amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Unique Transaction Reference Display */}
          <div className="p-5 bg-indigo-950/60 border-2 border-indigo-500/40 rounded-2xl text-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                2. Unique Transaction Reference (MUST INCLUDE IN NARRATION)
              </span>
              <span className="text-[8px] bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
                Required Narration Code
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-indigo-500/30">
              <div>
                <p className="text-base font-black font-mono text-[#DAA520] tracking-wider">{reference}</p>
                <p className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase">
                  ⚠️ Add this exact code in your transfer narration / remark box.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopyText(reference, 'narration_ref')}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 shadow-md"
              >
                {copiedField === 'narration_ref' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedField === 'narration_ref' ? 'Copied!' : 'Copy Ref'}</span>
              </button>
            </div>
          </div>

          {/* EFADO Escrow Bank Account List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                3. EFADO Active Escrow Bank Accounts
              </span>
              <span className="text-[9px] text-emerald-600 font-bold uppercase">Verified Corporate Accounts</span>
            </div>

            {currency === 'NGN' ? (
              <div className="space-y-3">
                {OFFICIAL_NGN_ACCOUNTS.map((acc, idx) => (
                  <div key={idx} className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl space-y-3 text-white transition-all shadow-md">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-black text-[#DAA520] uppercase tracking-wide">
                        {acc.bankName}
                      </span>
                      <span className="text-[8px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-black uppercase">
                        {acc.badge}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest block">Account Number</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm font-black font-mono text-white">{acc.accountNo}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(acc.accountNo, `num_${idx}`)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-all active:scale-95"
                            title="Copy Account Number"
                          >
                            {copiedField === `num_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest block">Account Name</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-black text-slate-200 truncate max-w-[180px]">{acc.accountName}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(acc.accountName, `name_${idx}`)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-all active:scale-95"
                            title="Copy Account Name"
                          >
                            {copiedField === `name_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 text-white">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs font-black text-[#DAA520]">{INTERNATIONAL_ACCOUNTS[currency]?.bankName}</span>
                  <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase font-black">
                    International Wire
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[8px] text-slate-400 font-bold uppercase block">Account Holder</span>
                    <span className="text-xs font-black text-white">{INTERNATIONAL_ACCOUNTS[currency]?.accountName}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 font-bold uppercase block">Account Number / IBAN</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-black text-[#DAA520]">{INTERNATIONAL_ACCOUNTS[currency]?.accountNo}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(INTERNATIONAL_ACCOUNTS[currency]?.accountNo || '', 'intl_acc')}
                        className="p-1 bg-slate-800 rounded text-slate-300"
                      >
                        {copiedField === 'intl_acc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                {INTERNATIONAL_ACCOUNTS[currency]?.extraLabel && (
                  <div className="p-3 bg-slate-950 rounded-xl flex items-center justify-between text-xs border border-slate-800">
                    <span className="text-slate-400 font-bold uppercase text-[9px]">{INTERNATIONAL_ACCOUNTS[currency]?.extraLabel}</span>
                    <span className="font-mono font-black text-amber-300">{INTERNATIONAL_ACCOUNTS[currency]?.extraValue}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Button to Proceed to Step 2 */}
          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              id="btn-complete-transfer-step1"
              type="button"
              onClick={() => {
                const num = parseFloat(amount);
                if (isNaN(num) || num <= 0) {
                  alert('Please enter a valid deposit amount.');
                  return;
                }
                setStep(2);
              }}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-95"
            >
              I Have Completed The Transfer <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* ================= STEP 2: PAYMENT CONFIRMATION SCREEN ================= */
        <form onSubmit={handleSubmitDeposit} id="step-2-payment-confirmation" className="space-y-6 animate-fade-in">
          {/* Back Navigation Button */}
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest transition-colors flex items-center gap-1.5"
          >
            ← Back to Step 1 (Payment Instructions)
          </button>

          {/* Transfer Summary Badge */}
          <div className="p-4 bg-slate-900 border border-slate-800 text-white rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[8px] font-black text-[#DAA520] uppercase tracking-widest block">Transfer Summary</span>
              <p className="text-sm font-black font-mono text-white mt-0.5">
                {symbol}{parseFloat(amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Narration Code</span>
              <p className="text-xs font-mono font-black text-indigo-300">{reference}</p>
            </div>
          </div>

          {/* SECTION 1: SENDER ACCOUNT VERIFICATION */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 text-white">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldCheck className="w-4 h-4 text-[#DAA520]" />
              <h4 className="text-xs font-black uppercase tracking-wider text-[#DAA520]">
                1. Sender Account Verification
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sender Bank Name Select Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block">
                  Sender's Bank Name <span className="text-red-400">*</span>
                </label>
                <select
                  id="sender-bank-code-select"
                  value={senderBankCode}
                  onChange={handleBankSelectChange}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-[#DAA520] cursor-pointer"
                >
                  {NIGERIAN_BANKS.map(b => (
                    <option key={b.code} value={b.code}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Custom Bank Name Input if Other is selected */}
              {senderBankCode === '000' && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block">
                    Type Your Custom Bank Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Citibank / International"
                    value={customBankName}
                    onChange={(e) => setCustomBankName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-[#DAA520]"
                  />
                </div>
              )}

              {/* Sender Account Number Input */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block">
                  Sender's 10-Digit Account Number <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  maxLength={10}
                  placeholder="e.g. 0123456789"
                  value={senderAccountNumber}
                  onChange={(e) => setSenderAccountNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-black text-white focus:outline-none focus:border-[#DAA520] placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Account Name Enquiry Output Display */}
            <div className="pt-2">
              {isResolvingAccount ? (
                <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-[#DAA520]" />
                  <div>
                    <p className="text-xs font-black text-indigo-200">Calling Bank Account Name Enquiry API...</p>
                    <p className="text-[9px] text-indigo-300/70 font-mono">Verifying account holder with CBN / NIBSS interbank switch</p>
                  </div>
                </div>
              ) : resolvedAccountName ? (
                <div className="p-4 bg-emerald-950/50 border border-emerald-500/40 rounded-xl flex items-center justify-between animate-fade-in">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-500/30">
                      ✓ Verified Account Holder Name
                    </span>
                    <p className="text-sm font-black font-mono text-emerald-300 mt-1 uppercase tracking-tight">
                      {resolvedAccountName}
                    </p>
                    <p className="text-[9px] text-emerald-400/80 font-bold">
                      Account Verified with {senderBankCode === '000' ? customBankName || 'Bank' : senderBankName}
                    </p>
                  </div>
                  <CheckCircle2 className="w-7 h-7 text-emerald-400 flex-shrink-0" />
                </div>
              ) : accountResolveError ? (
                <div className="p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-rose-300">
                  <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-black text-rose-200">Account Name Lookup Warning</p>
                    <p className="text-[10px] text-rose-300">{accountResolveError}</p>
                  </div>
                </div>
              ) : (
                <p className="text-[9px] text-slate-400 font-medium italic">
                  💡 Type your 10-digit account number above to automatically trigger account name resolution.
                </p>
              )}
            </div>
          </div>

          {/* SECTION 2: PAYMENT EVIDENCE SECTION */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 text-white">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Upload className="w-4 h-4 text-[#DAA520]" />
              <h4 className="text-xs font-black uppercase tracking-wider text-[#DAA520]">
                2. Payment Evidence & Transaction Proof
              </h4>
            </div>

            {/* Bank Transaction Reference / ID / Session ID */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block">
                Sender's Bank Transaction Reference / ID / Session ID <span className="text-red-400">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="e.g. T20260730123984 / Session ID"
                value={bankTransactionId}
                onChange={(e) => setBankTransactionId(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-black text-white focus:outline-none focus:border-[#DAA520] placeholder:text-slate-600"
              />
              <p className="text-[8px] text-slate-400">
                Found on your bank app debit alert receipt or USSD confirmation SMS.
              </p>
            </div>

            {/* File Upload Field for Proof of Payment (Image & PDF) */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block">
                Upload Field for Proof of Payment (Image or PDF) <span className="text-red-400">*</span>
              </label>

              <div className="relative group">
                <input
                  required
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="payment-proof-file-input"
                />
                <label
                  htmlFor="payment-proof-file-input"
                  className="w-full h-32 border-2 border-dashed border-slate-700 hover:border-[#DAA520] bg-slate-950 rounded-2xl cursor-pointer flex flex-col items-center justify-center p-4 text-center transition-all group-hover:bg-slate-900"
                >
                  {uploadProgress ? (
                    <div className="space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#DAA520] mx-auto" />
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Processing Document...</p>
                    </div>
                  ) : proofFileName ? (
                    <div className="space-y-1">
                      <Check className="w-7 h-7 text-emerald-400 mx-auto mb-1" />
                      <p className="text-xs font-black text-white truncate max-w-xs">{proofFileName}</p>
                      <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">✓ File Attached (Tap to replace)</p>
                    </div>
                  ) : (
                    <div className="space-y-1 text-slate-400">
                      <Upload className="w-7 h-7 mx-auto mb-1 text-[#DAA520] group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-black text-slate-200 uppercase tracking-tight">Upload Proof of Payment</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Accepts Image (JPG, PNG) and PDF up to 3MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* ACTION BUTTON: Submit For Admin Verification */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 py-4 border border-slate-300 hover:border-slate-400 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors"
            >
              Back
            </button>

            <button
              id="btn-submit-admin-verification"
              type="submit"
              disabled={isSubmitting || uploadProgress || !resolvedAccountName}
              className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting to Ledger...
                </>
              ) : (
                'Submit For Admin Verification ✓'
              )}
            </button>
          </div>
        </form>
      )}

      {/* STRATEGIC RECEIPT MODAL */}
      {showReceiptModal && (
        <StrategicReceipt
          transaction={{
            id: reference || 'REQ_' + Math.floor(1000 + Math.random() * 9000),
            userId: user.uid,
            type: 'deposit',
            amount: parseFloat(amount) || 0,
            currency: currency,
            status: 'pending',
            method: 'Direct Bank Transfer',
            purpose: `EFADO Bank Deposit - Narration Ref: ${reference}`,
            reference: reference || 'N/A',
            timestamp: { seconds: Math.floor(Date.now() / 1000) },
            description: `Manual Bank Transfer awaiting administrator verification. Sender: ${resolvedAccountName} (${senderBankCode === '000' ? customBankName : senderBankName} - ${senderAccountNumber}). Bank TxID: ${bankTransactionId}.`
          }}
          userEmail={user.email}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      {/* COMPREHENSIVE PAYMENT & PAYOUT GUIDELINES MODAL */}
      <PaymentGuidelinesModal
        isOpen={showGuidelinesModal}
        onClose={() => setShowGuidelinesModal(false)}
      />
    </div>
  );
};
