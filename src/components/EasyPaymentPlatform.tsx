import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Copy, 
  Check, 
  HelpCircle, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  ShieldCheck, 
  Lock, 
  Zap, 
  Coins, 
  ArrowRight,
  User,
  Fingerprint,
  RotateCcw,
  AlertTriangle,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Transaction } from '../types';
import { useCurrency } from '../lib/CurrencyContext';
import { SecurityGuard, TransactionPinModal } from './SecurityGuard';
import { TransactionService } from '../services/TransactionService';
import { CEO_BANK_ACCOUNTS } from '../constants/businessProfile';
import { db, doc, updateDoc } from '../firebase';

interface EasyPaymentPlatformProps {
  user: UserProfile;
  type: 'deposit' | 'withdraw';
  onComplete?: (amount: number, method: string) => Promise<void>;
  onClose: () => void;
  amount?: number;
  onSuccess?: () => void;
  purpose?: string;
  hub?: string;
}

const NIGERIAN_BANKS = [
  'Opay Digital Services (Opay MFB)',
  'PalmPay Limited',
  'Kuda Bank (Kuda MFB)',
  'Zenith Bank',
  'Guaranty Trust Bank (GTBank)',
  'Access Bank',
  'United Bank for Africa (UBA)',
  'First Bank of Nigeria',
  'Fidelity Bank',
  'First City Monument Bank (FCMB)',
  'Moniepoint MFB',
  'Wema Bank',
  'Union Bank of Nigeria',
  'EcoBank Nigeria',
  'Stanbic IBTC Bank',
  'Polaris Bank',
  'Keystone Bank',
  'Sterling Bank'
].sort();

export const EasyPaymentPlatform: React.FC<EasyPaymentPlatformProps> = ({
  user,
  type: initialType,
  onComplete,
  onClose,
  amount: fixedAmount,
  onSuccess,
  purpose: intentPurpose,
  hub = 'WALLET'
}) => {
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>(initialType);
  const [amount, setAmount] = useState(fixedAmount ? fixedAmount.toString() : '');
  const [bankName, setBankName] = useState(user.bankName || '');
  const [accountNumber, setAccountNumber] = useState(user.accountNumber || '');
  const [accountName, setAccountName] = useState(user.accountName || user.displayName || '');
  const [proofNote, setProofNote] = useState('');
  
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'failed'>('form');
  const [createdTxId, setCreatedTxId] = useState<string | null>(null);

  // Auto pre-populate user details
  useEffect(() => {
    if (user) {
      setBankName(user.bankName || '');
      setAccountNumber(user.accountNumber || '');
      const defaultName = user.accountName || user.displayName || '';
      setAccountName(defaultName);
    }
  }, [user]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(id);
    setTimeout(() => {
      setCopySuccess(null);
    }, 2000);
  };

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmt = Number(amount);
    if (!amount || isNaN(parsedAmt) || parsedAmt <= 0) {
      setError('Please Enter a valid deposit/withdrawal amount');
      return;
    }

    if (activeTab === 'withdraw' && parsedAmt > user.playerWallet) {
      setError(`Insufficient earnings. Your maximum cashout balance is $${user.playerWallet.toLocaleString()}`);
      return;
    }

    if (!bankName) {
      setError('Please Select or Type your Sending/Receiving Bank');
      return;
    }

    if (!accountNumber || accountNumber.length < 8) {
      setError('Please Enter a valid 8-10 digit Bank Account Number');
      return;
    }

    if (!accountName) {
      setError('Please Enter the Bank Account Holder Name');
      return;
    }

    // Trigger secure verification PIN prompt
    setShowPinModal(true);
  };

  const handlePinConfirm = () => {
    setShowPinModal(false);
    setStep('processing');
    setProcessingProgress(0);
    setError(null);

    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            executeDatabaseTransaction();
          }, 400);
          return 100;
        }
        return prev + 5;
      });
    }, 45);
  };

  const executeDatabaseTransaction = async () => {
    try {
      const parsedAmt = Number(amount);
      const isDeposit = activeTab === 'deposit';
      const reference = `EZP-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString().slice(-4)}`;

      // Invoke optional parent complete triggers
      if (onComplete) {
        await onComplete(parsedAmt, isDeposit ? 'Easy-Deposit' : 'Easy-Withdrawal');
      }

      // Save user bank details to Firestore for future ease
      if (
        bankName !== user.bankName ||
        accountNumber !== user.accountNumber ||
        accountName !== user.accountName
      ) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            bankName,
            accountNumber,
            accountName
          });
        } catch (err) {
          console.error('Failed to auto-save bank profile:', err);
        }
      }

      const txDescription = isDeposit
        ? `Pending Proof Verification: Sender [${bankName} / ${accountNumber} / ${accountName}] ${proofNote ? `(${proofNote})` : ''}`
        : `Pending Cashout Process: Receiver [${bankName} / ${accountNumber} / ${accountName}]`;

      const txData = {
        userId: user.uid,
        userEmail: user.email,
        type: (isDeposit ? 'deposit' : 'withdrawal') as 'deposit' | 'withdrawal',
        amount: parsedAmt,
        fee: isDeposit ? 0 : parsedAmt * 0.015, // Low 1.5% Easy Pay withdrawal fee
        currency: 'USD',
        status: 'pending' as 'pending' | 'completed' | 'failed', // Both manual flows are pending CEO approval
        method: isDeposit ? 'Easy Transfer' : 'Direct PayOut',
        hub: hub as any,
        purpose: intentPurpose || (isDeposit ? 'Easy Wallet Topup' : 'Easy Win Cashout'),
        reference,
        description: txDescription,
        skipWalletUpdate: !!onComplete,
        metadata: {
          senderBankName: bankName,
          senderAccountNumber: accountNumber,
          senderAccountName: accountName,
          transactionRef: reference,
          originalMethod: 'Easy Payment Mode'
        }
      };

      const txId = await TransactionService.recordTransaction(txData);
      setCreatedTxId(txId);
      setStep('success');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Easy transaction failure:', err);
      setError(err.message || 'System failed to register transaction. Try again.');
      setStep('failed');
    }
  };

  return (
    <div className="w-full flex flex-col h-full bg-slate-50 text-slate-900 rounded-3xl overflow-hidden shadow-2xl relative font-sans border-2 border-indigo-200/50">
      
      {/* Header Panel */}
      <div className="bg-[#059669] text-white p-5 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <Coins className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest italic">EFADO Easy-Pay Portal</h2>
            <p className="text-[9px] text-[#a7f3d0] uppercase tracking-wide font-bold">Fast & Clear Settlements</p>
          </div>
        </div>
        
        {/* Safe Badge */}
        <div className="flex items-center gap-1 bg-[#047857] px-2.5 py-1 rounded-full border border-white/10">
          <ShieldCheck className="w-3 h-3 text-white" />
          <span className="text-[8px] font-black uppercase tracking-wider text-white">Safe Hub</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 border-b border-slate-200 shrink-0">
        <button
          onClick={() => {
            setError(null);
            setActiveTab('deposit');
          }}
          className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'deposit' 
              ? 'bg-emerald-50 text-emerald-700 border-b-4 border-emerald-600' 
              : 'text-slate-500 hover:bg-slate-200'
          }`}
        >
          <ArrowDownCircle className="w-4 h-4" />
          <span>Easy Funding</span>
        </button>
        <button
          onClick={() => {
            setError(null);
            setActiveTab('withdraw');
          }}
          className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'withdraw' 
              ? 'bg-blue-50 text-blue-700 border-b-4 border-blue-600' 
              : 'text-slate-500 hover:bg-slate-200'
          }`}
        >
          <ArrowUpCircle className="w-4 h-4" />
          <span>Easy Cashout</span>
        </button>
      </div>

      {/* Main Form Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
        {step === 'form' && (
          <AnimatePresence mode="wait">
            {activeTab === 'deposit' ? (
              <motion.div
                key="deposit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 text-left"
              >
                {/* Visual Instructions Banner */}
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-tight leading-snug">
                    Send real cash from your bank app to any official EFADO corporate account below. Copy the bank details, make the transfer, and fill in your sender info below!
                  </p>
                </div>

                {/* CEO Accounts List Dashboard */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black tracking-widest text-[#047857] uppercase block">
                    STEP 1: SELECT & COPY CO-ORPORATE PAYMENT DETAILS
                  </label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {/* Access Bank Savings */}
                    <div className="bg-white border-2 border-slate-200 hover:border-emerald-400 p-3 rounded-2xl transition-all relative flex flex-col justify-between shadow-sm">
                      <div>
                        <span className="text-[7px] font-black bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded uppercase tracking-widest">Savings Account</span>
                        <p className="text-xs font-black text-slate-800 mt-1">ACCESS BANK</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase leading-tight mt-0.5">Daniel F. Okhawere</p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                        <span className="text-xs font-mono font-bold text-slate-800 tracking-wider">0001304979</span>
                        <button
                          type="button"
                          onClick={() => handleCopy('0001304979', 'acc_access')}
                          className="px-2 py-1 text-[8px] bg-emerald-50 text-emerald-700 font-black uppercase rounded hover:bg-emerald-100 transition-all active:scale-90"
                        >
                          {copySuccess === 'acc_access' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    {/* UBA Savings */}
                    <div className="bg-white border-2 border-slate-200 hover:border-emerald-400 p-3 rounded-2xl transition-all relative flex flex-col justify-between shadow-sm">
                      <div>
                        <span className="text-[7px] font-black bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded uppercase tracking-widest">Savings Account</span>
                        <p className="text-xs font-black text-slate-800 mt-1">UBA BANK</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase leading-tight mt-0.5">Daniel F. Okhawere</p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                        <span className="text-xs font-mono font-bold text-slate-800 tracking-wider">2120742200</span>
                        <button
                          type="button"
                          onClick={() => handleCopy('2120742200', 'acc_uba')}
                          className="px-2 py-1 text-[8px] bg-emerald-50 text-emerald-700 font-black uppercase rounded hover:bg-emerald-100 transition-all active:scale-90"
                        >
                          {copySuccess === 'acc_uba' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    {/* OPay Business */}
                    <div className="bg-white border-2 border-slate-200 hover:border-emerald-400 p-3 rounded-2xl transition-all relative flex flex-col justify-between shadow-sm">
                      <div>
                        <span className="text-[7px] font-black bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded uppercase tracking-widest">OPAY Business (instant)</span>
                        <p className="text-xs font-black text-slate-800 mt-1">OPAY DIGITAL MFB</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase leading-tight mt-0.5 max-h-[16px] overflow-hidden truncate">EFADO Technology Computer Engineering Training</p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                        <span className="text-xs font-mono font-bold text-slate-800 tracking-wider">8072456836</span>
                        <button
                          type="button"
                          onClick={() => handleCopy('8072456836', 'acc_opay')}
                          className="px-2 py-1 text-[8px] bg-emerald-50 text-emerald-700 font-black uppercase rounded hover:bg-emerald-100 transition-all active:scale-90"
                        >
                          {copySuccess === 'acc_opay' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    {/* GTBank NGN Business */}
                    <div className="bg-white border-2 border-slate-200 hover:border-emerald-400 p-3 rounded-2xl transition-all relative flex flex-col justify-between shadow-sm">
                      <div>
                        <span className="text-[7px] font-black bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded uppercase tracking-widest font-mono">GTB Corporate NGN</span>
                        <p className="text-xs font-black text-slate-800 mt-1">GTBANK PLC</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase leading-tight mt-0.5 max-h-[16px] overflow-hidden truncate">EFADO Technology Computer Engineering Training</p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                        <span className="text-xs font-mono font-bold text-slate-800 tracking-wider">3001964082</span>
                        <button
                          type="button"
                          onClick={() => handleCopy('3001964082', 'acc_gtb')}
                          className="px-2 py-1 text-[8px] bg-emerald-50 text-emerald-700 font-black uppercase rounded hover:bg-emerald-100 transition-all active:scale-90"
                        >
                          {copySuccess === 'acc_gtb' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Input fields */}
                <form onSubmit={handleActionSubmit} className="space-y-3 pt-2">
                  <label className="text-[9px] font-black tracking-widest text-[#0f172a] uppercase block border-b pb-1">
                    STEP 2: TYPE YOUR SENDER & AMOUNT PROOF DETAILS
                  </label>

                  {error && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-[10px] font-bold uppercase">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Amount to Topup */}
                  <div>
                    <label className="text-[9px] text-slate-500 font-black uppercase tracking-wider block mb-1">Enter Paid Amount (₦ Equivalent)</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-[#059669]">₦</div>
                      <input
                        type="text"
                        pattern="[0-9]*"
                        disabled={!!fixedAmount}
                        placeholder="ENTER AMOUNT IN NAIRA"
                        className="w-full pl-8 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-[11px] font-mono font-black placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900"
                        value={amount}
                        onChange={e => setAmount(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                    {fixedAmount && (
                      <p className="text-[8px] text-[#059669] font-black uppercase tracking-wider mt-1">✓ FIXED AMOUNT MANDATED FOR TRANSACTION</p>
                    )}
                  </div>

                  {/* Sender Bank List Dropdown */}
                  <div>
                    <label className="text-[9px] text-slate-500 font-black uppercase tracking-wider block mb-1">Your Sending Bank Name</label>
                    <select
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-[11px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                    >
                      <option value="">-- SELECT YOUR SENDING BANK --</option>
                      {NIGERIAN_BANKS.map(bk => (
                        <option key={bk} value={bk}>{bk.toUpperCase()}</option>
                      ))}
                      <option value="Other Manual Bank">OTHER / MANUALLY SPECIFY</option>
                    </select>
                  </div>

                  {/* Custom Bank Name Input if "Other" is chosen */}
                  {bankName === 'Other Manual Bank' && (
                    <div>
                      <input
                        type="text"
                        placeholder="TYPE YOUR BANK NAME MANUALLY"
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-[11px] font-black uppercase text-slate-900"
                        onChange={e => setBankName(e.target.value.toUpperCase())}
                      />
                    </div>
                  )}

                  {/* Sending Account Number */}
                  <div>
                    <label className="text-[9px] text-slate-500 font-black uppercase tracking-wider block mb-1">Your Sending Account Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={10}
                        placeholder="ENTER 10-DIGIT ACCOUNT NUMBER"
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-[11px] font-mono font-black placeholder:text-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={accountNumber}
                        onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                  </div>

                  {/* Sender Name */}
                  <div>
                    <label className="text-[9px] text-slate-500 font-black uppercase tracking-wider block mb-1">Your Sender Account Holder Name</label>
                    <input
                      type="text"
                      placeholder="ENTER SENDER BANK ACCOUNT NAME"
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-[11px] font-black uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={accountName}
                      onChange={e => setAccountName(e.target.value)}
                    />
                  </div>

                  {/* Optional Reference / Proof Code */}
                  <div>
                    <label className="text-[9px] text-slate-500 font-black uppercase tracking-wider block mb-1">Transfer Note / Transaction Ref (Optional)</label>
                    <input
                      type="text"
                      placeholder="E.G. PAYMENT FROM DANIEL TO EFADO"
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-[11px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={proofNote}
                      onChange={e => setProofNote(e.target.value)}
                    />
                  </div>

                  {/* CTA Submit deposit proof */}
                  <button
                    type="submit"
                    className="w-full py-4 mt-3 bg-[#059669] hover:bg-[#047857] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all active:scale-[0.98] shadow-lg shadow-emerald-600/20"
                  >
                    Submit Easy Funding Proof
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="withdraw"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 text-left"
              >
                {/* Available balance display card */}
                <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-5 rounded-3xl border border-blue-500/10 shadow flex items-center justify-between">
                  <div>
                    <p className="text-[9px] text-[#93c5fd] uppercase tracking-widest font-black">Authorized Earnings Account Balance</p>
                    <p className="text-2xl font-black font-mono mt-1">${user.playerWallet.toLocaleString()}</p>
                    <p className="text-[8px] text-indigo-300 uppercase tracking-widest mt-0.5">Win Stake Cashout Active</p>
                  </div>
                  <Coins className="w-10 h-10 text-blue-400 shrink-0 opacity-40" />
                </div>

                <form onSubmit={handleActionSubmit} className="space-y-3">
                  <label className="text-[9px] font-black tracking-widest text-[#1e40af] uppercase block border-b pb-1">
                    ENTER CASHOUT PAYOUT DESTINATION DETAILS
                  </label>

                  {error && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-[10px] font-bold uppercase">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Cashout Payout amount */}
                  <div>
                    <label className="text-[9px] text-slate-500 font-black uppercase tracking-wider block mb-1">Amount to Payout ($)</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">$</div>
                      <input
                        type="text"
                        pattern="[0-9]*"
                        placeholder="ENTER USD AMOUNT TO CASHOUT"
                        className="w-full pl-8 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-[11px] font-mono font-black placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                        value={amount}
                        onChange={e => setAmount(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                  </div>

                  {/* Receiver Bank dropdown */}
                  <div>
                    <label className="text-[9px] text-slate-500 font-black uppercase tracking-wider block mb-1">Your Receiving Bank Name</label>
                    <select
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-[11px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                    >
                      <option value="">-- SELECT YOUR DESTINATION BANK --</option>
                      {NIGERIAN_BANKS.map(bk => (
                        <option key={bk} value={bk}>{bk.toUpperCase()}</option>
                      ))}
                      <option value="Other Manual Bank">OTHER / WRITE MANUALLY</option>
                    </select>
                  </div>

                  {/* Custom Bank Manual type */}
                  {bankName === 'Other Manual Bank' && (
                    <div>
                      <input
                        type="text"
                        placeholder="TYPE RECEIVING BANK NAME MANUALLY"
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-[11px] font-black uppercase text-slate-900"
                        onChange={e => setBankName(e.target.value.toUpperCase())}
                      />
                    </div>
                  )}

                  {/* Receiving Account Number */}
                  <div>
                    <label className="text-[9px] text-slate-500 font-black uppercase tracking-wider block mb-1">Your Receiving Account Number</label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="ENTER 10-DIGIT ACCOUNT NUMBER"
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-[11px] font-mono font-black placeholder:text-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>

                  {/* Account Name */}
                  <div>
                    <label className="text-[9px] text-slate-500 font-black uppercase tracking-wider block mb-1">Your Receiving Account Name</label>
                    <input
                      type="text"
                      placeholder="ENTER DESTINATION ACCOUNT NAME"
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-[11px] font-black uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={accountName}
                      onChange={e => setAccountName(e.target.value)}
                    />
                  </div>

                  {/* Low Withdrawal Fee Notice */}
                  <div className="p-3 bg-blue-50 rounded-2xl flex items-center justify-between border border-blue-200">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Withdrawal Settlement Fee</span>
                    <span className="text-[10px] font-extrabold text-blue-700 tracking-tight">1.5% Easy-Settled</span>
                  </div>

                  {/* Payout Trigger Button */}
                  <button
                    type="submit"
                    className="w-full py-4 mt-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20"
                  >
                    Submit Easy Withdrawal Request
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Processing State with Simulated Progress */}
        {step === 'processing' && (
          <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin" />
              <Coins className={activeTab === 'deposit' ? 'w-8 h-8 text-emerald-600 animate-pulse' : 'w-8 h-8 text-blue-600 animate-pulse'} />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-base font-black uppercase tracking-widest text-slate-800">
                {activeTab === 'deposit' ? 'Registering Deposit Proof' : 'Filing Withdrawal Request'}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                Authenticating with EFADO live transaction ledger...
              </p>
            </div>

            <div className="w-full max-w-xs bg-slate-200 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-100 ${activeTab === 'deposit' ? 'bg-emerald-600' : 'bg-blue-600'}`}
                style={{ width: `${processingProgress}%` }}
              />
            </div>
            <span className="text-xs font-mono font-black text-slate-600">{processingProgress}%</span>
          </div>
        )}

        {/* Success Flow Confirmation */}
        {step === 'success' && (
          <div className="py-8 text-center space-y-6 flex flex-col items-center">
            <div className="w-[72px] h-[72px] bg-emerald-50 text-emerald-600 border border-emerald-200/50 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <Check className="w-10 h-10 text-emerald-600 stroke-[3px]" />
            </div>

            <div className="space-y-2.5 max-w-xs">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-widest italic">Request Received!</h3>
              <p className="text-[10px] text-slate-500 font-extrabold uppercase leading-snug tracking-normal">
                {activeTab === 'deposit' 
                  ? 'Your manual deposit proof has been received! The CEO is notified and will immediately match the bank transfer to credit your wallet.' 
                  : 'Your withdrawal request of specified funds is recorded. The CEO will review and instantly wire the cash to your details.'
                }
              </p>
            </div>

            {/* Receipt Summary info */}
            <div className="bg-white border rounded-3xl p-4 w-full text-left font-mono text-[9px] text-slate-700 space-y-2 max-w-md shadow-sm">
              <div className="flex items-center justify-between border-b pb-1.5 mb-1.5 uppercase font-bold text-slate-950 font-sans">
                <span>Transaction Receipt</span>
                <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black">Success</span>
              </div>
              <div className="flex justify-between">
                <span>TX REFERENCE:</span>
                <span className="font-extrabold text-slate-950">{createdTxId?.toUpperCase().slice(0, 10) || 'PENDING'}</span>
              </div>
              <div className="flex justify-between">
                <span>AMOUNT RECORD:</span>
                <span className="font-extrabold text-slate-950 font-sans">{activeTab === 'deposit' ? '₦' + Number(amount).toLocaleString() : '$' + Number(amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>SENDER/RECEIVER BANK:</span>
                <span className="font-extrabold text-[#000]">{bankName.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span>ACCOUNT ID:</span>
                <span className="font-extrabold text-[#000]">{accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>HOLDER NAME:</span>
                <span className="font-extrabold text-[#000]">{accountName.toUpperCase()}</span>
              </div>
              <div className="flex justify-between border-t pt-1.5 mt-1.5 text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
                <span>AUDIT SECURE STAMP:</span>
                <span>PCI-DSS ENFORCED • EFADO PORTAL</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
            >
              Back to App Hubs
            </button>
          </div>
        )}

        {/* Failed flow option */}
        {step === 'failed' && (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200">
              <RotateCcw className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase text-slate-800">Connection Interrupted</h3>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase">{error || 'Ledger filing broke. Please try again.'}</p>
            </div>
            <button
              onClick={() => setStep('form')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase"
            >
              Retry Submission
            </button>
          </div>
        )}
      </div>

      {/* Footer Info Hub */}
      <div className="bg-slate-100 p-3 mt-auto border-t border-slate-200 text-center shrink-0">
        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
          <Lock className="w-2.5 h-2.5 text-slate-400" />
          <span>Real-time Secure Encryption Escrow • EFADO INC</span>
        </p>
      </div>

      {/* Security Pin Authorization Modal */}
      <TransactionPinModal 
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onConfirm={handlePinConfirm}
        amount={Number(amount)}
        action={activeTab === 'deposit' ? 'Wallet Funding' : 'Wallet Withdrawal'}
      />
    </div>
  );
};
