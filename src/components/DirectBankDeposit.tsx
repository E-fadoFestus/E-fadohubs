import React, { useState, useEffect } from 'react';
import {
  Loader2,
  Copy,
  Check,
  Upload,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  FileText,
  CheckCircle2,
  Building2,
  ShieldAlert
} from 'lucide-react';
import { PaymentGuidelinesModal } from './PaymentGuidelinesModal';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { UserProfile } from '../types';
import { StrategicReceipt } from './StrategicReceipt';
import { NIGERIAN_BANKS, resolveBankAccount } from '../utils/bankVerification';
import { formatCurrencyAmount, getMinDepositForCurrency } from '../constants/walletCurrencies';

interface DirectBankDepositProps {
  user: UserProfile;
  defaultAmount?: number;
  onSuccess: () => void;
  onClose?: () => void;
}

export const DirectBankDeposit: React.FC<DirectBankDepositProps> = ({
  user,
  defaultAmount = 1000,
  onSuccess,
  onClose
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [currency, setCurrency] = useState<'NGN' | 'USD' | 'GBP' | 'EUR'>('NGN');
  const [amount, setAmount] = useState<string>(defaultAmount.toString());
  const [reference, setReference] = useState<string>('');
  const [showGuidelinesModal, setShowGuidelinesModal] = useState<boolean>(false);

  const [senderBankCode, setSenderBankCode] = useState<string>('044');
  const [senderBankName, setSenderBankName] = useState<string>('Access Bank PLC');
  const [customBankName, setCustomBankName] = useState<string>('');
  const [senderAccountNumber, setSenderAccountNumber] = useState<string>('');

  const [isResolvingAccount, setIsResolvingAccount] = useState<boolean>(false);
  const [resolvedAccountName, setResolvedAccountName] = useState<string>('');
  const [accountResolveError, setAccountResolveError] = useState<string | null>(null);

  const [bankTransactionId, setBankTransactionId] = useState<string>('');
  const [proofFileName, setProofFileName] = useState<string>('');
  const [proofBase64, setProofBase64] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(false);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    const today = new Date();
    const pad = (num: number) => String(num).padStart(2, '0');
    const yyyymmdd = today.getFullYear() + pad(today.getMonth() + 1) + pad(today.getDate());
    const hhmmss = pad(today.getHours()) + pad(today.getMinutes()) + pad(today.getSeconds());
    setReference(`EFD${rand}_${yyyymmdd}_${hhmmss}`);
  }, []);

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

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
    } else {
      setAccountResolveError(result.message || 'Unable to verify account holder name. Please check account number.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 3 * 1024 * 1024) {
        setFormError('File size exceeds 3MB limit. Please upload a smaller screenshot or PDF.');
        return;
      }
      setProofFileName(file.name);
      setUploadProgress(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofBase64(reader.result as string);
        setUploadProgress(false);
      };
      reader.onerror = () => {
        setUploadProgress(false);
        setFormError('Could not read selected file.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBankSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;
    setSenderBankCode(selectedCode);
    const found = NIGERIAN_BANKS.find((b) => b.code === selectedCode);
    if (found) setSenderBankName(found.name);
  };

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const numericAmount = parseFloat(amount);
    const minReq = getMinDepositForCurrency(currency);

    if (isNaN(numericAmount) || numericAmount < minReq) {
      setFormError(`Minimum deposit is ${formatCurrencyAmount(minReq, currency)}.`);
      return;
    }
    if (!senderAccountNumber || senderAccountNumber.trim().length < 8) {
      setFormError('Please enter your 10-digit sender account number.');
      return;
    }
    if (!resolvedAccountName) {
      setFormError('Please wait for your bank account name to be verified first.');
      return;
    }
    if (!bankTransactionId.trim()) {
      setFormError('Please enter your Bank Transaction Reference or Session ID.');
      return;
    }
    if (!proofBase64) {
      setFormError('Please upload a screenshot or PDF receipt.');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const actualBankName = senderBankCode === '000' ? customBankName || 'Other Bank' : senderBankName;

    try {
      const depositDocRef = await addDoc(collection(db, 'deposits'), {
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
        status: 'pending',
        created_at: serverTimestamp()
      });

      const txCustomId = `MAN_DEP_${reference}`;
      await setDoc(doc(db, 'transactions', txCustomId), {
        userId: user.uid,
        type: 'deposit',
        amount: numericAmount,
        currency,
        status: 'pending',
        reference,
        timestamp: serverTimestamp(),
        description: `Bank Transfer (Ref: ${reference}) • Sender: ${resolvedAccountName} (${actualBankName})`,
        metadata: {
          gateway: 'direct_bank_transfer',
          depositDocId: depositDocRef.id,
          senderBank: actualBankName,
          senderAccountName: resolvedAccountName,
          bankTransactionId: bankTransactionId.trim(),
          proofFileName
        }
      });

      setStatusMessage({
        type: 'success',
        text: 'Transfer submitted for verification. Your wallet will be credited once reconciled.'
      });

      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Submission failed: ${err?.message || 'Please try again.'}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const minDeposit = getMinDepositForCurrency(currency);
  const parsedAmount = parseFloat(amount || '0');
  const isBelowMin = isNaN(parsedAmount) || parsedAmount < minDeposit;
  const formattedDisplay = formatCurrencyAmount(isNaN(parsedAmount) ? 0 : parsedAmount, currency);
  const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€';

  return (
    <div id="direct-bank-transfer-container" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
          <span className="text-xs font-bold text-[#16A34A]">Secure Payment - Verified</span>
        </div>
        <button
          type="button"
          onClick={() => setShowGuidelinesModal(true)}
          className="px-3 py-1.5 bg-[#7C3AED] hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Payment Guide</span>
        </button>
      </div>

      {!statusMessage && (
        <div className="flex items-center justify-between bg-purple-50 border border-purple-100 p-3.5 rounded-2xl">
          <div className={`flex items-center gap-2 ${step === 1 ? 'text-[#7C3AED] font-bold' : 'text-slate-500 font-semibold'}`}>
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 1 ? 'bg-[#7C3AED] text-white' : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              1
            </span>
            <span className="text-xs">Transfer Details</span>
          </div>
          <div className="flex-1 mx-3 h-0.5 bg-purple-200" />
          <div className={`flex items-center gap-2 ${step === 2 ? 'text-[#7C3AED] font-bold' : 'text-slate-500 font-semibold'}`}>
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 2 ? 'bg-[#7C3AED] text-white' : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              2
            </span>
            <span className="text-xs">Upload Proof</span>
          </div>
        </div>
      )}

      {statusMessage && statusMessage.type === 'success' ? (
        <div className="p-6 bg-white border border-emerald-200 rounded-2xl text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-50 text-[#16A34A] rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-bold text-slate-900 m-0">Transfer Proof Submitted</h4>
          <p className="text-xs text-slate-600 font-medium mb-0 max-w-none">{statusMessage.text}</p>
          <div className="p-3 bg-purple-50 rounded-xl text-xs font-mono font-bold text-[#7C3AED]">
            Ref: {reference}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowReceiptModal(true)}
              className="flex-1 py-3 bg-[#16A34A] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" /> View Receipt
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
              >
                Done
              </button>
            )}
          </div>
        </div>
      ) : statusMessage && statusMessage.type === 'error' ? (
        <div className="p-5 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-7 h-7 text-[#DC2626] mx-auto" />
          <p className="text-xs text-[#DC2626] font-bold mb-0 max-w-none">{statusMessage.text}</p>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="px-4 py-2 bg-[#DC2626] text-white font-bold rounded-xl text-xs"
          >
            Try Again
          </button>
        </div>
      ) : step === 1 ? (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-slate-700">1. Currency & Amount</label>
              <div className="flex gap-1.5">
                {(['NGN', 'USD', 'GBP', 'EUR'] as const).map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setCurrency(curr)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      currency === curr ? 'bg-[#7C3AED] text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-slate-500">
                {symbol}
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setFormError(null);
                }}
                placeholder="Enter amount"
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-300 rounded-xl text-lg font-bold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>
            {amount !== '' && isBelowMin && (
              <p className="text-xs font-semibold text-[#DC2626] mb-0 max-w-none">
                Minimum deposit is {formatCurrencyAmount(minDeposit, currency)}
              </p>
            )}
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-[#7C3AED] block">
              2. Include This Reference in Your Transfer Remark
            </span>
            <div className="flex items-center justify-between gap-2 p-3 bg-white rounded-xl border border-purple-100">
              <span className="text-sm font-bold font-mono text-slate-900 truncate">{reference}</span>
              <button
                type="button"
                onClick={() => handleCopyText(reference, 'narration_ref')}
                className="px-3 py-1.5 bg-[#7C3AED] text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0"
              >
                {copiedField === 'narration_ref' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'narration_ref' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <Building2 className="w-4 h-4 text-[#7C3AED]" />
              <span>Bank Transfer Instructions</span>
            </div>
            <p className="text-xs text-slate-600 mb-0 max-w-none">
              Send your transfer using your bank app, keep your session ID/receipt, and tap the green button below to upload proof.
            </p>
          </div>

          <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl text-center">
            <p className="text-xs font-semibold text-slate-700 mb-0 max-w-none tabular-nums">
              You pay <strong className="text-slate-900">{formattedDisplay}</strong> — You receive{' '}
              <strong className="text-[#16A34A]">{formattedDisplay}</strong> — No hidden fee
            </p>
          </div>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-[#DC2626]">
              {formError}
            </div>
          )}

          <div className="sticky bottom-16 sm:bottom-2 z-20 pt-2 bg-white/95 backdrop-blur-sm pb-1">
            <button
              type="button"
              disabled={isBelowMin}
              onClick={() => setStep(2)}
              className="w-full py-4 bg-[#16A34A] hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold uppercase tracking-wide shadow-lg flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed tabular-nums"
            >
              <span>FUND {currency} POCKET {formattedDisplay} • NEXT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmitDeposit} className="space-y-4">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-xs font-bold text-[#7C3AED] hover:underline"
          >
            ← Back to Transfer Details
          </button>

          <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
            <h4 className="text-sm font-bold text-slate-900 m-0">Sender Bank Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Sender Bank</label>
                <select
                  value={senderBankCode}
                  onChange={handleBankSelectChange}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                >
                  {NIGERIAN_BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              {senderBankCode === '000' && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Bank Name</label>
                  <input
                    required
                    type="text"
                    value={customBankName}
                    onChange={(e) => setCustomBankName(e.target.value)}
                    placeholder="Enter bank name"
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">10-Digit Account Number</label>
                <input
                  required
                  type="text"
                  maxLength={10}
                  value={senderAccountNumber}
                  onChange={(e) => setSenderAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="0123456789"
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 tabular-nums"
                />
              </div>
            </div>

            {isResolvingAccount ? (
              <div className="p-3 bg-purple-50 rounded-xl flex items-center gap-2 text-xs text-[#7C3AED] font-semibold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying bank account name...</span>
              </div>
            ) : resolvedAccountName ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#16A34A] block">Verified Account Name</span>
                  <span className="text-sm font-bold text-slate-900">{resolvedAccountName}</span>
                </div>
                <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
              </div>
            ) : accountResolveError ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-[#DC2626]">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{accountResolveError}</span>
              </div>
            ) : null}
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
            <h4 className="text-sm font-bold text-slate-900 m-0">Transfer Evidence</h4>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Bank Session ID / Reference</label>
              <input
                required
                type="text"
                value={bankTransactionId}
                onChange={(e) => setBankTransactionId(e.target.value)}
                placeholder="Enter session or transaction reference"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp, application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="payment-proof-file-input"
              />
              <label
                htmlFor="payment-proof-file-input"
                className="w-full h-28 border-2 border-dashed border-purple-200 hover:border-[#7C3AED] bg-purple-50/40 rounded-2xl cursor-pointer flex flex-col items-center justify-center p-4 text-center"
              >
                {uploadProgress ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#7C3AED]" />
                ) : proofFileName ? (
                  <>
                    <Check className="w-5 h-5 text-[#16A34A] mb-1" />
                    <span className="text-xs font-bold text-slate-900 truncate max-w-xs">{proofFileName}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-[#7C3AED] mb-1" />
                    <span className="text-xs font-bold text-slate-800">Upload Screenshot or PDF Receipt</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-[#DC2626]">
              {formError}
            </div>
          )}

          <div className="sticky bottom-16 sm:bottom-2 z-20 pt-2 bg-white/95 backdrop-blur-sm pb-1">
            <button
              type="submit"
              disabled={isSubmitting || uploadProgress || !resolvedAccountName}
              className="w-full py-4 bg-[#16A34A] hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl text-sm font-bold uppercase shadow-lg flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{isSubmitting ? 'Submitting...' : 'Submit Transfer Proof'}</span>
            </button>
          </div>
        </form>
      )}

      <div className="text-center text-xs text-slate-500 font-medium flex items-center justify-center gap-1.5 pt-1">
        <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
        <span>Protected by 256-bit encryption • Compliance: PCI DSS, NDPR, GDPR</span>
      </div>

      {showReceiptModal && (
        <StrategicReceipt
          transaction={{
            id: reference || 'REQ_' + Math.floor(1000 + Math.random() * 9000),
            userId: user.uid,
            type: 'deposit',
            amount: parsedAmount || 0,
            currency,
            status: 'pending',
            method: 'Direct Bank Transfer',
            purpose: `Bank Deposit (${reference})`,
            reference,
            timestamp: { seconds: Math.floor(Date.now() / 1000) }
          }}
          userEmail={user.email}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      <PaymentGuidelinesModal isOpen={showGuidelinesModal} onClose={() => setShowGuidelinesModal(false)} />
    </div>
  );
};
