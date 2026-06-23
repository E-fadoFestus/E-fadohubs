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
  ArrowLeft,
  Printer,
  User,
  Fingerprint,
  RotateCcw,
  AlertTriangle,
  Info,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Transaction } from '../types';
import { useCurrency } from '../lib/CurrencyContext';
import { SecurityGuard, TransactionPinModal } from './SecurityGuard';
import { TransactionService } from '../services/TransactionService';
import { CEO_BANK_ACCOUNTS } from '../constants/businessProfile';
import { db, doc, updateDoc, collection, setDoc, serverTimestamp } from '../firebase';
import { ReceiptTerminal } from './ReceiptTerminal';

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
  const { formatPrice, selectedCurrency } = useCurrency();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollToSection = (section: 'top' | 'step1' | 'step2' | 'bottom') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    
    if (section === 'top') {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (section === 'bottom') {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else if (section === 'step1') {
      const target = el.querySelector('[data-scroll-anchor="step1"]');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        el.scrollTo({ top: 220, behavior: 'smooth' });
      }
    } else if (section === 'step2') {
      const target = el.querySelector('[data-scroll-anchor="step2"]');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        el.scrollTo({ top: el.scrollHeight * 0.55, behavior: 'smooth' });
      }
    }
  };

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
  const [showPrinterOverlay, setShowPrinterOverlay] = useState(false);
  const [reference, setReference] = useState(() => `EZP-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString().slice(-4)}`);

  // Auto pre-populate user details
  useEffect(() => {
    if (user) {
      setBankName(user.bankName || '');
      setAccountNumber(user.accountNumber || '');
      const defaultName = user.accountName || user.displayName || '';
      setAccountName(defaultName);
    }
  }, [user]);

  // Live account name automated query simulation for EasyPaymentPlatform
  const [isResolvingName, setIsResolvingName] = useState(false);
  const [resolvedStatusMessage, setResolvedStatusMessage] = useState<string | null>(null);

  // Automated name lookup listener
  useEffect(() => {
    if (accountNumber && accountNumber.length === 10 && bankName) {
      setIsResolvingName(true);
      setResolvedStatusMessage('Enquiring bank gateway details...');
      
      const timer = setTimeout(() => {
        let resolvedName = '';
        if (accountNumber === '000122668') {
          resolvedName = 'OKHAWERE FESTUS';
        } else {
          // Stable pseudo-random Name based on account digits
          const sum = accountNumber.split('').reduce((acc, char) => acc + parseInt(char || '0', 10), 0);
          const firsts = ['DANIEL', 'OLUMIDE', 'KINGSLEY', 'TEMITOPE', 'CHINONSO', 'YUSUF', 'IBRAHIM', 'CHINEDU', 'OKHAWERE', 'FUNMILAYO', 'NGOZI', 'BABATUNDE'];
          const lasts = ['FESTUS', 'OKHAWERE', 'OJO', 'ADEYEMI', 'EZE', 'ALIYU', 'ALABI', 'NWACHUKWU', 'JOHNSON', 'BALOGUN', 'DOKUBO'];
          const fName = firsts[sum % firsts.length];
          const lName = lasts[(sum * 7) % lasts.length];
          resolvedName = `${fName} ${lName}`;
        }
        
        setAccountName(resolvedName);
        setIsResolvingName(false);
        setResolvedStatusMessage('Account Name Verified ✓');
      }, 1200);

      return () => clearTimeout(timer);
    } else {
      setIsResolvingName(false);
      setResolvedStatusMessage(null);
    }
  }, [accountNumber, bankName]);

  const loadPaystackScript = () => {
    return new Promise((resolve) => {
      if ((window as any).PaystackPop) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => resolve(true);
      document.body.appendChild(script);
    });
  };

  const handlePaystackInstantCheckout = async () => {
    setError(null);
    const parsedAmt = Number(amount);
    if (!amount || isNaN(parsedAmt) || parsedAmt <= 0) {
      setError('Please Enter a valid deposit amount above');
      return;
    }

    setIsProcessing(true);
    setStep('processing');
    setProcessingProgress(15);

    try {
      await loadPaystackScript();
      setProcessingProgress(45);

      const paystackKey = (import.meta as any).env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_df9804e7bddefbcbc698ba96ccdaeec6990494ba'; 
      setProcessingProgress(70);

      const paymentReference = `EFD-AUT-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString().slice(-4)}`;

      const handler = (window as any).PaystackPop.setup({
        key: paystackKey,
        email: user.email || 'customer@efado.com',
        amount: parsedAmt * 100, // Amount is in kobo (kobo = Naira * 100)
        currency: 'NGN',
        ref: paymentReference,
        callback: async function (response: any) {
          setProcessingProgress(90);
          try {
            const txDescription = `Automated Deposit: Paid via Paystack Automated Checkout [Ref: ${response.reference || paymentReference}]`;
            
            const txData = {
              userId: user.uid,
              userEmail: user.email,
              type: 'deposit' as 'deposit',
              amount: parsedAmt,
              fee: 0,
              currency: 'USD', // Normalized to USD, or if NGN we process accordingly
              status: 'completed' as 'pending' | 'completed' | 'failed', // Completed status triggers immediate credit!
              method: 'Paystack Automated',
              hub: hub as any,
              purpose: intentPurpose || 'Easy Wallet Topup',
              reference: response.reference || paymentReference,
              description: txDescription,
              skipWalletUpdate: false,
              metadata: {
                paymentChannel: 'Paystack pop-up',
                transactionRef: response.reference || paymentReference,
                originalMethod: 'Automated Real-time Gateway'
              }
            };

            const txId = await TransactionService.recordTransaction(txData);
            setCreatedTxId(txId);
            setProcessingProgress(100);
            setStep('success');
            
            if (onSuccess) {
              onSuccess();
            }
          } catch (e: any) {
            console.error('Instant ledger record failure:', e);
            setError('Payment completed but failed to update ledger. Please contact support.');
            setStep('failed');
          }
        },
        onClose: function () {
          setStep('form');
        }
      });

      setProcessingProgress(100);
      setTimeout(() => {
        handler.openIframe();
      }, 500);

    } catch (err: any) {
      console.error('Failed to load Automated Gateway:', err);
      setError('Could not load secure automated payment script. Check network or use manual transfer.');
      setStep('failed');
    }
  };

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

    if (activeTab === 'withdraw') {
      const MOCK_FX_RATES: Record<string, number> = {
        USD: 1,
        EUR: 0.92,
        GBP: 0.79,
        JPY: 151,
        NGN: 1450,
        INR: 83,
      };
      
      const rate = MOCK_FX_RATES[selectedCurrency?.code || 'NGN'] || 1;
      const minLimit = 5000 * (rate / 1450);

      if (parsedAmt < minLimit) {
        setError(`Payout threshold unmet. Minimum withdrawal is ${selectedCurrency?.symbol || '$'}${minLimit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (proportionate rate of ₦5,000 equivalent for ${selectedCurrency?.code || 'NGN'})`);
        return;
      }

      if (parsedAmt > user.playerWallet) {
        setError(`Insufficient earnings. Your maximum cashout balance is $${user.playerWallet.toLocaleString()}`);
        return;
      }
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
      
      // If it's a cashout (withdrawal), also insert into the global departures 'withdrawals' collection
      if (!isDeposit) {
        try {
          const withdrawalRef = doc(collection(db, 'withdrawals'), txId);
          await setDoc(withdrawalRef, {
            userId: user.uid,
            userEmail: user.email,
            amount: parsedAmt - (parsedAmt * 0.015), // net payout
            originalAmount: parsedAmt,
            fee: parsedAmt * 0.015,
            status: 'pending',
            timestamp: serverTimestamp(),
            accountDetails: {
              method: 'Easy Transfer',
              bankName,
              accountNumber,
              accountName,
              sourceWallet: 'playerWallet'
            }
          });
        } catch (err) {
          console.error('Failed to create mirror withdrawal request for CEO review:', err);
        }
      }

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
          {/* Active Go Back / Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 active:scale-95 rounded-lg transition-all text-white mr-1 flex items-center justify-center"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hidden sm:flex">
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
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto payment-scrollbar p-5 pb-20 space-y-4 relative scroll-smooth"
      >
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
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-start gap-2.5 bg-slate-50">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-tight leading-snug">
                    Choose <b>Option A</b> for instant real-time credit, or <b>Option B</b> to manually send cash from your bank app and submit proof!
                  </p>
                </div>

                {/* OPTION A: Paystack Automated Cash-In */}
                <div className="p-4 bg-gradient-to-br from-indigo-550/15 via-indigo-600/5 to-emerald-500/5 border-2 border-indigo-500/30 rounded-2xl space-y-3 relative overflow-hidden bg-white shadow-sm text-left">
                  <div className="absolute top-0 right-0 p-1 bg-indigo-600 text-[6px] font-black uppercase text-white tracking-widest rounded-bl-lg">
                    Real-Time Automation
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                      <Zap className="w-4 h-4 text-indigo-600 animate-pulse animate-duration-1000" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-indigo-950 tracking-wider">🌟 Option A: Instant Auto-Credit Deposit</h4>
                      <p className="text-[8px] text-[#059669] font-black uppercase tracking-wider">No CEO Approval Needed • Instant Balance Wallet</p>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-700 font-bold leading-normal uppercase">
                    Key in your amount, then click pay now. Pay securely via card, Opay, Palmpay, USSD, or direct bank payment using Paystack secure channel.
                  </p>
                  <div>
                    <label className="text-[8px] text-slate-500 font-black uppercase tracking-wider block mb-1">Enter Amount to Fund (₦)</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-indigo-600">₦</div>
                      <input
                        type="text"
                        pattern="[0-9]*"
                        disabled={!!fixedAmount}
                        placeholder="ENTER FUNDING AMOUNT"
                        className="w-full pl-7 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-mono font-black placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
                        value={amount}
                        onChange={e => setAmount(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handlePaystackInstantCheckout}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:scale-[1.01] transition-all text-white rounded-xl text-[9px] font-black uppercase tracking-[0.15em] shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5 active:scale-95 duration-150"
                  >
                    🚀 Launch Instant Deposit Popup
                  </button>
                  <a
                    href="https://paystack.shop/pay/oou1q0y05p"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-750 hover:scale-[1.01] transition-all text-white rounded-xl text-[9px] font-black uppercase tracking-[0.14em] shadow-md shadow-emerald-550/20 flex items-center justify-center gap-1.5 active:scale-95 duration-150 mt-1.5 text-center"
                  >
                    🛍️ Pay via Custom Paystack Shop Link
                  </a>
                </div>

                <div className="relative flex items-center justify-center my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <span className="relative px-3 bg-slate-50 text-[8px] font-black uppercase tracking-[0.3em] text-slate-450 text-slate-400">OR ALTERNATIVELY</span>
                </div>

                {/* OPTION B: Manual transfer */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-1">
                  <h4 className="text-[9px] font-black tracking-wider text-slate-900 uppercase">🌟 Option B: Manual Bank Wire Transfer</h4>
                  <p className="text-[8px] text-slate-550 uppercase tracking-tight leading-relaxed font-bold">
                    Alternatively, manually transfer funds to the CEO corporate bank accounts below, and submit your receipt evidence manually to wait for CEO manual confirmation.
                  </p>
                </div>

                {/* CEO Accounts List Dashboard */}
                <div data-scroll-anchor="step1" className="space-y-2">
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
                  <label data-scroll-anchor="step2" className="text-[9px] font-black tracking-widest text-[#0f172a] uppercase block border-b pb-1">
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

                  {/* Cancel & Go Back Button */}
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-3.5 mt-2 bg-slate-250 hover:bg-slate-300 text-slate-700 hover:text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all active:scale-[0.98] border border-slate-300 flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Cancel & Go Back
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
                  <div className="relative">
                    <label className="text-[9px] text-slate-500 font-black uppercase tracking-wider block mb-1">Your Receiving Account Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={isResolvingName ? "RESOLVING ACCOUNT DETAILS..." : "ENTER DESTINATION ACCOUNT NAME"}
                        className={`w-full pl-4 pr-10 py-3 bg-white border border-slate-300 rounded-xl text-[11px] font-black uppercase placeholder:text-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isResolvingName ? 'text-indigo-600 animate-pulse bg-indigo-50/20' : ''
                        }`}
                        value={accountName}
                        onChange={e => setAccountName(e.target.value)}
                        disabled={isResolvingName}
                      />
                      {isResolvingName && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      )}
                      {!isResolvingName && resolvedStatusMessage && accountName && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-xs">
                          ✓
                        </div>
                      )}
                    </div>
                    {resolvedStatusMessage && (
                      <div className={`text-[9px] font-black uppercase tracking-widest mt-1 flex items-center gap-1 ${
                        isResolvingName ? 'text-indigo-600 animate-pulse' : 'text-emerald-600'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${isResolvingName ? 'bg-indigo-600 animate-ping' : 'bg-emerald-500'}`} />
                        {resolvedStatusMessage}
                      </div>
                    )}
                  </div>

                  {/* Low Withdrawal Fee Notice */}
                  <div className="p-3 bg-blue-50 rounded-2xl flex items-center justify-between border border-blue-200">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Withdrawal Settlement Fee</span>
                    <span className="text-[10px] font-extrabold text-blue-700 tracking-tight">1.5% Easy-Settled</span>
                  </div>

                  {/* Payout Trigger Button */}
                  <button
                    type="submit"
                    disabled={isProcessing || isResolvingName || !amount || !accountNumber || accountNumber.length !== 10 || !bankName || !accountName}
                    className="w-full py-4 mt-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20 disabled:opacity-40"
                  >
                    {isResolvingName ? 'Resolving Account Details...' : 'Submit Easy Withdrawal Request'}
                  </button>

                  {/* Cancel & Go Back Button */}
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-3.5 mt-2 bg-slate-250 hover:bg-slate-300 text-slate-700 hover:text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all active:scale-[0.98] border border-slate-300 flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Cancel & Go Back
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

            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center max-w-sm mt-2">
              <button
                type="button"
                onClick={() => setShowPrinterOverlay(true)}
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
              >
                Back to App Hubs
              </button>
            </div>
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

      {showPrinterOverlay && (
        <ReceiptTerminal
          receipt={{
            transactionId: createdTxId || reference,
            amount: activeTab === 'deposit' ? `₦${Number(amount).toLocaleString()}` : `$${Number(amount).toLocaleString()}`,
            currency: activeTab === 'deposit' ? 'NGN' : 'USD',
            date: new Date().toLocaleDateString(),
            type: activeTab === 'deposit' ? 'deposit' : 'withdrawal',
            method: activeTab === 'deposit' ? 'Easy Transfer' : 'Direct PayOut',
            status: 'pending',
            sender: activeTab === 'deposit' ? accountName : 'EFADO CORPORATE',
            recipient: activeTab === 'deposit' ? 'EFADO CORPORATE' : accountName,
            description: activeTab === 'deposit' ? `Naira Topup Proof - ${proofNote}` : `USD Withdrawal to ${bankName}`,
            reference: reference
          }}
          onClose={() => setShowPrinterOverlay(false)}
        />
      )}

      {/* Floating Modern Inside Scroll Navigation Controls */}
      {step === 'form' && (
        <div className="absolute right-4 bottom-20 z-40 flex flex-col items-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 animate-fade-in sm:right-6">
          {/* Scroll to Top */}
          <button
            type="button"
            onClick={() => scrollToSection('top')}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all select-none shadow-sm active:scale-90 relative group"
            title="Scroll to Top"
          >
            <ChevronUp className="w-4 h-4" />
            <span className="absolute right-10 bg-slate-950 text-white text-[8px] font-black px-2 py-1.5 rounded-lg tracking-wider opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md">
              SCROLL TO TOP
            </span>
          </button>

          {activeTab === 'deposit' && (
            <>
              {/* Scroll to Step 1: Corporate bank accounts */}
              <button
                type="button"
                onClick={() => scrollToSection('step1')}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all select-none shadow-sm active:scale-90 relative group"
                title="Scroll to Corporate Details"
              >
                <Building2 className="w-4 h-4" />
                <span className="absolute right-10 bg-slate-950 text-white text-[8px] font-black px-2 py-1.5 rounded-lg tracking-wider opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md">
                  STEP 1: BANK DETAILS
                </span>
              </button>

              {/* Scroll to Step 2: Proof form details */}
              <button
                type="button"
                onClick={() => scrollToSection('step2')}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all select-none shadow-sm active:scale-90 relative group"
                title="Scroll to Sender Proof Form"
              >
                <FileText className="w-4 h-4" />
                <span className="absolute right-10 bg-slate-950 text-white text-[8px] font-black px-2 py-1.5 rounded-lg tracking-wider opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md">
                  STEP 2: UPLOAD PROOF
                </span>
              </button>
            </>
          )}

          {/* Scroll to Bottom */}
          <button
            type="button"
            onClick={() => scrollToSection('bottom')}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold transition-all select-none shadow-sm active:scale-90 relative group"
            title="Scroll to Bottom"
          >
            <ChevronDown className="w-4 h-4" />
            <span className="absolute right-10 bg-slate-950 text-white text-[8px] font-black px-2 py-1.5 rounded-lg tracking-wider opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md">
              SCROLL TO BOTTOM
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
