import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  Bitcoin, 
  Building2, 
  Hash, 
  ShieldCheck, 
  Lock, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  ChevronRight,
  Globe,
  AlertCircle,
  Clock,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Fingerprint,
  SearchCode,
  Copy,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Search,
  Coins,
  FileText,
  User,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Transaction } from '../types';
import { useCurrency } from '../lib/CurrencyContext';
import { SecurityGuard, TransactionPinModal } from './SecurityGuard';
import { TransactionService } from '../services/TransactionService';
import { StrategicReceipt } from './StrategicReceipt';
import { CEO_BANK_ACCOUNTS, SUPPORT_EMAILS } from '../constants/businessProfile';

interface PaymentPlatformProps {
  user: UserProfile;
  type: 'deposit' | 'withdraw';
  onComplete?: (amount: number, method: string) => Promise<void>;
  onClose: () => void;
  // Optional props for fixed price flows (like registrations)
  amount?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  purpose?: string;
  hub?: string;
}

type PaymentMethodType = 'bank_transfer' | 'paystack' | 'flutterwave' | 'ussd' | 'crypto_btc' | 'crypto_eth' | 'mining_wallet' | 'player_wallet';

export const PaymentPlatform: React.FC<PaymentPlatformProps> = ({ 
  user, 
  type, 
  onComplete, 
  onClose,
  amount: fixedAmount,
  onSuccess,
  onCancel,
  purpose: intentPurpose,
  hub = 'WALLET'
}) => {
  const { formatPrice, selectedCurrency } = useCurrency();
  const [step, setStep] = useState<'method' | 'details' | 'verification' | 'processing' | 'success' | 'failed'>('method');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType | null>(null);
  const [amount, setAmount] = useState(fixedAmount ? fixedAmount.toString() : '');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [accountDetails, setAccountDetails] = useState({
    accountNumber: '',
    bankName: '',
    accountName: '',
    transactionRef: ''
  });
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(id);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const nigerianBanks = [
    { code: '044', name: 'Access Bank' },
    { code: '011', name: 'First Bank of Nigeria' },
    { code: '058', name: 'GTBank' },
    { code: '232', name: 'Zenith Bank' },
    { code: '033', name: 'United Bank for Africa (UBA)' },
    { code: '070', name: 'Fidelity Bank' },
    { code: '214', name: 'First City Monument Bank (FCMB)' },
    { code: '032', name: 'Union Bank of Nigeria' },
    { code: '215', name: 'Unity Bank' },
    { code: '035', name: 'Wema Bank' },
    { code: '030', name: 'Heritage Bank' },
    { code: '082', name: 'Keystone Bank' },
    { code: '076', name: 'Polaris Bank' },
    { code: '221', name: 'Stanbic IBTC Bank' },
    { code: '068', name: 'Standard Chartered Bank' },
    { code: '090267', name: 'Kuda Bank' },
    { code: '999992', name: 'OPay Digital Services' },
    { code: '50515', name: 'Moniepoint MFB' },
  ].sort((a, b) => a.name.localeCompare(b.name));

  const filteredBanks = nigerianBanks.filter(b => 
    b.name.toLowerCase().includes(bankSearch.toLowerCase()) || 
    b.code.includes(bankSearch)
  );

  const paymentCategories = [
    {
      id: 'internal_wallets',
      title: 'EFADO Internal',
      icon: <Wallet className="w-5 h-5 text-indigo-400" />,
      options: [
        { id: 'mining_wallet', name: 'EFADO Mining Wallet' },
        { id: 'player_wallet', name: 'EFADO Player Wallet' }
      ]
    },
    {
      id: 'mobile_money',
      title: 'Mobile Money',
      icon: <Smartphone className="w-5 h-5 text-emerald-400" />,
      options: [
        { id: 'opay', name: 'OPay' },
        { id: 'palmpay', name: 'PalmPay' },
        { id: 'kuda', name: 'Kuda' }
      ]
    },
    {
      id: 'bank_transfer',
      title: 'Bank Transfer',
      icon: <Building2 className="w-5 h-5 text-blue-400" />,
      options: [
        { id: 'zenith', name: 'Zenith' },
        { id: 'gtbank', name: 'GTBank' },
        { id: 'access', name: 'Access' },
        { id: 'uba', name: 'UBA' }
      ]
    },
    {
      id: 'cards',
      title: 'Cards',
      icon: <CreditCard className="w-5 h-5 text-purple-400" />,
      options: [
        { id: 'visa', name: 'Visa' },
        { id: 'mastercard', name: 'Mastercard' },
        { id: 'verve', name: 'Verve' }
      ]
    },
    {
      id: 'ussd',
      title: 'USSD Code',
      icon: <Hash className="w-5 h-5 text-orange-400" />,
      options: [
        { id: 'efado_pay', name: '*EFADO*PAY#' },
        { id: 'ussd_894', name: '*894#' },
        { id: 'ussd_737', name: '*737#' },
        { id: 'ussd_901', name: '*901#' }
      ]
    },
    {
      id: 'qr_pay',
      title: 'QR Pay',
      icon: <Fingerprint className="w-5 h-5 text-pink-400" />,
      options: [
        { id: 'scan_pay', name: 'Scan & Pay' },
        { id: 'efado_qr', name: 'EFADO QR' }
      ]
    },
    {
      id: 'crypto',
      title: 'Crypto',
      icon: <Bitcoin className="w-5 h-5 text-yellow-400" />,
      options: [
        { id: 'btc', name: 'BTC' },
        { id: 'eth', name: 'ETH' },
        { id: 'usdt', name: 'USDT (TRC20)' }
      ]
    },
    {
      id: 'global',
      title: 'Global Payments',
      icon: <Globe className="w-5 h-5 text-indigo-400" />,
      options: [
        { id: 'paypal', name: 'PayPal' },
        { id: 'stripe', name: 'Stripe' },
        { id: 'paystack', name: 'Paystack' }
      ]
    }
  ];

  const calculateFee = (amountVal: number) => {
    if (type === 'withdraw') return amountVal * 0.03; // 3% for cash out
    return amountVal * 0.013; // 1.3% for deposits/payments
  };

  const handleStartProcessing = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (type === 'withdraw' && Number(amount) > user.cashOutWallet) {
      setError('Insufficient funds in Win Wallet');
      return;
    }
    if (selectedMethod === 'mining_wallet' && Number(amount) > (user.miningWallet || 0) * 0.01) {
      setError('Insufficient funds in Mining Wallet');
      return;
    }
    if (selectedMethod === 'player_wallet' && Number(amount) > user.playerWallet) {
      setError('Insufficient funds in Player Wallet');
      return;
    }

    if (type === 'deposit' && (selectedMethod === 'bank_transfer' || selectedMethod === 'ussd' || selectedMethod?.toString().includes('crypto'))) {
      setStep('verification');
    } else {
      setShowPinModal(true);
    }
  };

  const confirmTransaction = () => {
    setShowPinModal(false);
    setStep('processing');
    setError(null);
  };

  const handleVerifyPayment = () => {
    if (!accountDetails.transactionRef && !accountDetails.accountNumber) {
      setError('Please provide tactical proof level 1 (Transaction Ref or Account Number)');
      return;
    }
    setShowPinModal(true);
  };

  useEffect(() => {
    if (step === 'processing') {
      const interval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              const baseAmount = Number(amount);
              const fee = calculateFee(baseAmount);
              const totalAmount = type === 'deposit' ? baseAmount + fee : baseAmount;
              
              const processPromise = onComplete 
                ? onComplete(totalAmount, selectedMethod || 'Unknown') 
                : Promise.resolve();

              processPromise.then(async () => {
                const isManual = selectedMethod === 'bank_transfer' || selectedMethod === 'ussd' || selectedMethod?.toString().includes('crypto');
                const reference = accountDetails.transactionRef || `EFD-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString().slice(-4)}`;
                const txData: Omit<Transaction, 'id' | 'timestamp'> = {
                  userId: user.uid,
                  type: type === 'deposit' ? 'deposit' : 'withdrawal',
                  amount: baseAmount,
                  fee: fee,
                  currency: 'USD',
                  status: isManual ? 'pending' : 'completed',
                  method: selectedMethod || 'Gateway Payment',
                  hub: hub as any,
                  purpose: intentPurpose || (type === 'deposit' ? 'Wallet Top-up' : 'Cash Out'),
                  reference,
                  description: isManual 
                    ? `Verification Pending: ${accountDetails.transactionRef || 'Manual Transfer'}` 
                    : (intentPurpose || (type === 'deposit' ? 'Wallet Funding' : 'Withdrawal Request'))
                };

                const txId = await TransactionService.recordTransaction(txData);
                
                setCompletedTx({
                  ...txData,
                  id: txId,
                  timestamp: new Date()
                });

                setStep('success');
                if (onSuccess) onSuccess();
              }).catch((err) => {
                console.error('Payment processing failed', err);
                setStep('failed');
              });
            }, 500);
            return 100;
          }
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [step, amount, selectedMethod, onComplete]);

  const fee = calculateFee(Number(amount) || 0);
  const totalCharge = type === 'deposit' ? (Number(amount) || 0) + fee : (Number(amount) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
        <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col md:flex-row h-[650px] border border-white/20"
      >
        {/* Sidebar Info - Tactical Control Hub */}
        <div className="w-full md:w-80 bg-[#020617] p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.03] pointer-events-none" />
          <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] -mt-32 -ml-32" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-black text-xl tracking-tighter italic uppercase text-white">Efado Pay</h2>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <p className="text-[10px] font-black text-slate-100 uppercase tracking-widest">Active Gateway</p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-start gap-4 group cursor-help">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-200">Elite Security</p>
                  <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tight">PCI-DSS Level 1 Enforced</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group cursor-help">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-all">
                  <Lock className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-200">Zero Leak Guard</p>
                  <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tight">End-to-End Encryption</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group cursor-help">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:bg-amber-500/20 transition-all">
                  <Zap className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-200">Flash Settlement</p>
                  <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tight">Sub-Second Validation</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-12 bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-2xl">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-[10px] text-slate-100 font-bold uppercase tracking-tight">Active Balance Protocol</p>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Main Content */}
        <div className="flex-1 p-10 flex flex-col relative bg-white">
          <motion.button 
            whileHover={{ rotate: 90, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute top-8 right-8 p-2 bg-slate-50 border border-slate-100 rounded-full transition-all group"
          >
            <XCircle className="w-7 h-7 text-slate-300 group-hover:text-rose-500 transition-colors" />
          </motion.button>

          <AnimatePresence mode="wait">
            {step === 'method' && (
              <motion.div 
                key="method"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                <div className="mb-10">
                  <h3 className="text-3xl font-black text-slate-950 tracking-tighter italic uppercase underline decoration-indigo-500/30 underline-offset-4">
                    {type === 'deposit' ? 'Secure Funding' : 'Tactical Cash Out'}
                  </h3>
                  <p className="text-slate-700 text-[11px] font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-indigo-500" /> Select Intelligence Path
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 overflow-y-auto pr-2 no-scrollbar flex-1 pb-6">
                  {paymentCategories.map((cat, idx) => (
                    <motion.div 
                      key={cat.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-6 hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group cursor-default"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-50 transition-all">
                          {cat.icon}
                        </div>
                        <h4 className="text-[10px] font-black text-slate-950 uppercase tracking-[0.25em]">{cat.title}</h4>
                      </div>

                      <div className="flex flex-wrap gap-2.5">
                        {cat.options.map(opt => (
                          <motion.button
                            key={opt.id}
                            whileHover={{ y: -2, scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSelectedMethod(opt.id as PaymentMethodType);
                              setStep('details');
                            }}
                            className="px-4 py-2.5 bg-indigo-50 border-2 border-indigo-100/50 hover:bg-slate-950 hover:text-white hover:border-slate-950 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm text-slate-950"
                          >
                            {opt.name}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 'details' && (
              <motion.div 
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col overflow-y-auto no-scrollbar"
              >
                <button 
                  onClick={() => setStep('method')}
                  className="flex items-center gap-2 text-[10px] font-black text-slate-600 mb-8 hover:text-indigo-600 transition-all uppercase tracking-widest group"
                >
                  <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" /> Tactical Reset
                </button>

                <div className="mb-8">
                  <h3 className="text-2xl font-black text-slate-950 tracking-tighter italic uppercase">Transaction Parameters</h3>
                  <p className="text-slate-950 text-[10px] font-black uppercase tracking-widest mt-1">Configure your financial deployment.</p>
                </div>

                <div className="space-y-8 flex-1">
                  <div className="bg-[#020617] p-8 rounded-[2.5rem] text-white space-y-6 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[50px] -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
                    
                    <div className="relative z-10">
                      <label className="block text-[11px] font-black text-indigo-400 uppercase tracking-[0.25em] mb-4">
                        {type === 'deposit' ? '1. ENTER AMOUNT TO DEPOSIT' : '1. ENTER AMOUNT TO WITHDRAW'} ({selectedCurrency.code})
                      </label>
                      <div className="relative">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-4xl font-black text-white/10 select-none italic">{selectedCurrency.symbol}</span>
                        <input 
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="Type Amount Here..."
                          className="w-full pl-10 pr-4 bg-transparent border-b-2 border-white/20 py-4 font-black text-5xl focus:outline-none focus:border-indigo-500 transition-all text-white placeholder:text-white/30 italic outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-between mt-4 px-2">
                        <div className="flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tactical Service Charge ({type === 'withdraw' ? '3%' : '1.3%'})</span>
                        </div>
                        <span className="text-xs font-black text-white italic">+{selectedCurrency.symbol}{fee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div className="flex items-center justify-between mt-2 px-2 pt-2 border-t border-white/5">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Total Valuation</span>
                        <span className="text-xl font-black text-white italic">{selectedCurrency.symbol}{totalCharge.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2.5 mt-8">
                        {[100, 500, 1000, 5000].map(val => (
                          <motion.button 
                            key={val}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setAmount(val.toString())}
                            className="px-4 py-2 bg-white/5 hover:bg-indigo-600 border border-white/10 hover:border-indigo-500 rounded-xl text-[10px] font-black tracking-widest transition-all shadow-lg"
                          >
                            +{selectedCurrency.symbol}{val.toLocaleString()}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* CEO Account Integration for Deposits/Payments */}
                  {type === 'deposit' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[10px] font-black text-slate-950 uppercase tracking-[0.2em] italic underline decoration-indigo-500 underline-offset-4">CEO Strategic Accounts</h4>
                        <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-full">Transfer to any account below</span>
                      </div>
                      
                      <div className="space-y-4 max-h-64 overflow-y-auto pr-2 no-scrollbar">
                        {[...CEO_BANK_ACCOUNTS.savings, ...CEO_BANK_ACCOUNTS.current, ...CEO_BANK_ACCOUNTS.business].map((acc, i) => (
                          <div key={i} className="bg-slate-50 border border-slate-100 p-5 rounded-3xl hover:border-indigo-500/30 transition-all group relative">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                                  <Building2 className="w-4 h-4 text-slate-600" />
                                </div>
                                <div>
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{acc.bank} • {acc.type}</p>
                                  <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{acc.accountName}</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleCopy(acc.accountNumber, `acc-${i}`)}
                                className="p-2 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-all relative"
                              >
                                {copySuccess === `acc-${i}` ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                                {copySuccess === `acc-${i}` && (
                                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[8px] px-2 py-1 rounded-lg">COPIED</span>
                                )}
                              </button>
                            </div>
                            <div className="bg-white/50 p-3 rounded-2xl flex items-center justify-between border border-slate-100/50">
                              <span className="text-sm font-black text-slate-900 font-mono tracking-widest">{acc.accountNumber}</span>
                              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter bg-emerald-50 px-2 py-0.5 rounded-full">Verified Site Account</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {selectedMethod === 'bank_transfer' && (
                        <div className="p-5 bg-amber-100/50 rounded-[2rem] border-2 border-amber-200/50 space-y-4">
                          <div className="flex items-start gap-4">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-1" />
                            <div>
                              <p className="text-[10px] font-black text-amber-950 uppercase tracking-widest leading-relaxed">Transfer Protocol</p>
                              <p className="text-[10px] font-black text-amber-900 uppercase leading-snug tracking-tighter mt-1">
                                1. Copy any account above<br/>
                                2. Pay into it using your bank app<br/>
                                3. USE YOUR USER ID <span className="text-amber-950 font-black">[{user.uid.slice(0, 8).toUpperCase()}]</span> AS NARRATION<br/>
                                4. Click the button below to verify
                              </p>
                            </div>
                          </div>
                          
                          <div className="bg-white/50 p-3 rounded-xl border border-amber-200/50 flex items-center justify-between">
                            <span className="text-[8px] font-black text-amber-900 uppercase tracking-widest">Your Unique Ref:</span>
                            <div className="flex items-center gap-2">
                              <code className="text-[10px] font-mono font-black text-amber-950">{user.uid.slice(0, 8).toUpperCase()}</code>
                              <button 
                                onClick={() => handleCopy(user.uid.slice(0, 8).toUpperCase(), 'user-ref')}
                                className="p-1.5 hover:bg-amber-100 rounded-lg transition-colors"
                              >
                                <Copy className="w-3 h-3 text-amber-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="p-5 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                            <Mail className="w-4 h-4 text-indigo-500" />
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Payment Support</p>
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tight">{SUPPORT_EMAILS.GAMES}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => window.location.href = `mailto:${SUPPORT_EMAILS.GAMES}`}
                          className="px-3 py-1.5 bg-white text-indigo-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          Contact Support
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bank/USSD Section (Only for withdrawals) */}
                  {(type === 'withdraw' && (selectedMethod === 'bank_transfer' || selectedMethod === 'ussd')) && (
                    <div className="space-y-8 pt-8 border-t border-slate-100 mt-8">
                       <div className="flex items-center gap-2 mb-2">
                         <label className="block text-[11px] font-black text-black uppercase tracking-[0.2em]">2. SELECT DESTINATION BANK</label>
                       </div>
                       
                       <div className="relative">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black pointer-events-none" />
                         <input 
                           placeholder="Type Bank Name (e.g. Zenith, GTB, Kuda)..."
                           className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:outline-none focus:border-indigo-500 transition-all text-black placeholder:text-gray-500 shadow-sm"
                           value={bankSearch}
                           onChange={e => {
                             setBankSearch(e.target.value);
                             setShowBankDropdown(true);
                           }}
                           onFocus={() => setShowBankDropdown(true)}
                         />
                         
                         <AnimatePresence>
                           {showBankDropdown && (
                             <motion.div 
                               initial={{ opacity: 0, y: 10 }}
                               animate={{ opacity: 1, y: 0 }}
                               exit={{ opacity: 0, y: 10 }}
                               className="absolute z-50 left-0 right-0 top-[115%] bg-white border-2 border-slate-200 rounded-2xl shadow-2xl max-h-56 overflow-y-auto p-2"
                             >
                               {filteredBanks.length > 0 ? filteredBanks.map(bank => (
                                 <button
                                   key={bank.code}
                                   onClick={() => {
                                     setAccountDetails({...accountDetails, bankName: bank.name});
                                     setBankSearch(bank.name);
                                     setShowBankDropdown(false);
                                   }}
                                   className="w-full text-left p-3.5 hover:bg-indigo-600 hover:text-white rounded-xl transition-all flex items-center justify-between group"
                                 >
                                   <span className="text-[10px] font-black uppercase tracking-widest">{bank.name}</span>
                                   <span className="text-[9px] font-mono font-black opacity-70">{bank.code}</span>
                                 </button>
                               )) : (
                                 <div className="p-4 text-center text-[10px] font-black text-gray-950 uppercase tracking-widest">Bank Not Found</div>
                               )}
                             </motion.div>
                           )}
                         </AnimatePresence>
                       </div>

                       <div className="space-y-4">
                         <label className="block text-[11px] font-black text-black uppercase tracking-[0.2em]">3. ACCOUNT DETAILS</label>
                         <div className="relative">
                           <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
                           <input 
                             placeholder="Enter 10-Digit Account Number"
                             maxLength={10}
                             className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:outline-none focus:border-indigo-500 transition-all text-black placeholder:text-gray-500 shadow-sm"
                             value={accountDetails.accountNumber}
                             onChange={e => setAccountDetails({...accountDetails, accountNumber: e.target.value})}
                           />
                         </div>
                         <div className="relative">
                           <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
                           <input 
                             placeholder="Enter Account Holder Name"
                             className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:outline-none focus:border-indigo-500 transition-all text-black placeholder:text-gray-500 shadow-sm"
                             value={accountDetails.accountName}
                             onChange={e => setAccountDetails({...accountDetails, accountName: e.target.value})}
                           />
                         </div>
                       </div>
                    </div>
                  )}

                  {/* QR Entry Protocol */}
                  {(selectedMethod?.toString().includes('qr')) && (
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 flex flex-col items-center gap-6">
                      <div className="w-48 h-48 bg-white p-4 rounded-3xl shadow-xl border border-slate-100 relative group overflow-hidden">
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center relative z-10">
                          <SearchCode className="w-20 h-20 text-slate-200 group-hover:scale-110 transition-transform" />
                          {/* Simulated QR Pattern */}
                          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_2px_2px,black_1px,transparent_0)] bg-[length:10px_10px]" />
                        </div>
                        <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-transparent transition-colors" />
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-950 uppercase tracking-widest mb-1">Optical Payload Sync</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase italic">Scan with EFADO App or Global Wallet</p>
                      </div>
                    </div>
                  )}

                  {/* Crypto Node Protocol */}
                  {(selectedMethod?.toString().includes('btc') || selectedMethod?.toString().includes('eth') || selectedMethod?.toString().includes('usdt')) && (
                    <div className="space-y-6">
                      <div className="p-6 bg-[#171C28] rounded-[2rem] border border-white/5 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Protocol Address ({selectedMethod?.toString().toUpperCase()})</span>
                          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                            <Copy className="w-4 h-4 text-slate-500" />
                          </button>
                        </div>
                        <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                          <code className="text-[10px] font-mono text-slate-400 break-all leading-relaxed">
                            {selectedMethod?.toString().includes('btc') ? 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' : '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'}
                          </code>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping" />
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Waiting for Blockchain confirmation</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedMethod === 'ussd' && amount && (
                    <div className="p-6 bg-indigo-50/50 rounded-[2rem] border-2 border-indigo-100 relative group overflow-hidden">
                      <div className="absolute top-0 right-0 p-4">
                        <Smartphone className="w-12 h-12 text-indigo-500/10 -rotate-12" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.25em]">Live USSD Payload</span>
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
                            <span className="text-[8px] font-black text-indigo-400 uppercase">Synchronized</span>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-indigo-200 flex items-center justify-between shadow-sm">
                          <code className="text-[11px] font-black text-slate-950 tracking-widest">
                            *555*88*EFADO*{user.uid.slice(0,5).toUpperCase()}*{amount}#
                          </code>
                          <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
                            <Copy className="w-4 h-4 text-indigo-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 flex items-center gap-5">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm shrink-0">
                      <ShieldCheck className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-950 uppercase tracking-widest">Neural Fraud Prevention</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase italic leading-tight">EFADO AI is scanning this frequency for integrity.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStartProcessing}
                    className="w-full py-5 bg-slate-950 text-white rounded-[1.5rem] font-black uppercase tracking-[0.25em] text-[11px] shadow-2xl shadow-indigo-200 hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 italic"
                  >
                    Initiate {type === 'deposit' ? 'Funding' : 'Extraction'} Protocol <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 'verification' && (
              <motion.div 
                key="verification"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col overflow-y-auto no-scrollbar"
              >
                <button 
                  onClick={() => setStep('details')}
                  className="flex items-center gap-2 text-[10px] font-black text-slate-400 mb-8 hover:text-indigo-600 transition-all uppercase tracking-widest group"
                >
                  <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" /> Back to Parameters
                </button>
                
                <div className="mb-8">
                  <h3 className="text-2xl font-black text-slate-950 tracking-tighter italic uppercase">Payment Verification</h3>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Provide proof of deployment to sync your balance.</p>
                </div>

                <div className="space-y-6 flex-1">
                  <div className="p-6 bg-indigo-50 border-2 border-indigo-100 rounded-[2rem]">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-indigo-100 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-relaxed">
                          IMPORTANT: Ensure you have transferred <span className="text-indigo-600 italic">{selectedCurrency.symbol}{totalCharge.toLocaleString()}</span> to the CEO Strategic account.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select 
                          className="w-full pl-10 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:outline-none focus:border-indigo-500 transition-all text-slate-950 shadow-sm appearance-none"
                          value={accountDetails.bankName}
                          onChange={e => setAccountDetails({...accountDetails, bankName: e.target.value})}
                        >
                          <option value="">SELECT DESTINATION BANK (WHICH CEO ACCOUNT?)</option>
                          {[...CEO_BANK_ACCOUNTS.savings, ...CEO_BANK_ACCOUNTS.current, ...CEO_BANK_ACCOUNTS.business].map((acc, i) => (
                            <option key={i} value={`${acc.bank} (${acc.accountNumber})`}>
                              {acc.bank} - {acc.accountNumber} ({acc.type})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                      <div className="relative">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          placeholder="PASTE SENDER NAME / TRANSACTION REF"
                          className="w-full pl-10 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:outline-none focus:border-indigo-500 transition-all text-slate-950 placeholder:text-gray-500 shadow-sm"
                          value={accountDetails.transactionRef}
                          onChange={e => setAccountDetails({...accountDetails, transactionRef: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3"
                    >
                      <XCircle className="w-4 h-4 text-rose-500" />
                      <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest">{error}</p>
                    </motion.div>
                  )}

                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-3">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2">Tactical Intelligence</p>
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                      <p className="text-[9px] font-bold text-slate-700 uppercase tracking-tight">System will verify transfer within 2-5 minutes of submission.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleVerifyPayment}
                    className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.25em] text-[11px] shadow-2xl shadow-indigo-200 hover:bg-slate-950 transition-all flex items-center justify-center gap-3 italic"
                  >
                    Deploy Verification Protocol <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 'processing' && (
              <motion.div 
                key="processing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-12"
              >
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle 
                      cx="50" cy="50" r="45" 
                      fill="none" stroke="#f1f5f9" strokeWidth="6" 
                    />
                    <motion.circle 
                      cx="50" cy="50" r="45" 
                      fill="none" stroke="#4f46e5" strokeWidth="6" 
                      strokeDasharray="283"
                      strokeDashoffset={283 - (283 * processingProgress) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-3xl font-black text-slate-950 italic">{processingProgress}%</span>
                    <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Active</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-black text-slate-950 tracking-tighter italic uppercase">Processing Burst</h3>
                  <p className="text-slate-950 text-[10px] font-black uppercase tracking-widest">Rerouting through global nodes...</p>
                </div>
                <div className="flex items-center gap-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                  <span className="flex items-center gap-2 text-[9px] font-black text-slate-950 uppercase tracking-widest"><Lock className="w-3.5 h-3.5 text-indigo-600" /> SSL:256</span>
                  <div className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span className="flex items-center gap-2 text-[9px] font-black text-slate-950 uppercase tracking-widest"><Globe className="w-3.5 h-3.5 text-emerald-600" /> Latency:12ms</span>
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-10"
              >
                <div className="w-28 h-28 bg-emerald-50 border-4 border-white rounded-[2.5rem] flex items-center justify-center shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-emerald-500/10 group-hover:scale-150 transition-transform duration-1000" />
                  <CheckCircle2 className="w-14 h-14 text-emerald-500 relative z-10" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-4xl font-black text-slate-950 tracking-tighter italic uppercase">
                    {completedTx?.status === 'pending' ? 'Verification Initiated' : 'Tactical Win!'}
                  </h3>
                  <p className="text-slate-700 text-[11px] font-bold uppercase tracking-widest leading-relaxed max-w-xs mx-auto">
                    {completedTx?.status === 'pending' 
                      ? 'Payment proof received. Tactical verification in progress. Balance will sync upon payload validation.'
                      : `Your account has been updated with ₦${Number(amount).toLocaleString()}. Operational capacity restored.`}
                  </p>
                </div>
                <div className="bg-[#020617] p-8 rounded-[2.5rem] border border-white/5 w-full space-y-4 shadow-3xl text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5">
                    <Coins className="w-16 h-16 text-white" />
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-white/10">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Operation ID</span>
                    <span className="text-[10px] font-black text-white italic">EFD-{Math.random().toString(36).substring(7).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Network Status</span>
                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase rounded-full tracking-widest">Success Verified</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3 w-full">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowReceipt(true)}
                    className="w-full py-4 bg-amber-500 text-slate-950 rounded-[1.5rem] font-black uppercase tracking-[0.25em] text-[10px] shadow-xl hover:bg-amber-400 transition-all italic flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" /> View Operational Receipt
                  </motion.button>
                  
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="w-full py-5 bg-slate-950 text-white rounded-[1.5rem] font-black uppercase tracking-[0.25em] text-[11px] shadow-2xl hover:bg-emerald-600 transition-all italic"
                  >
                    Return to Dashboard
                  </motion.button>
                </div>

                <AnimatePresence>
                  {showReceipt && completedTx && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="w-full max-w-lg"
                      >
                        <div className="flex justify-end mb-4">
                          <button 
                            onClick={() => setShowReceipt(false)}
                            className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
                          >
                            <XCircle className="w-6 h-6" />
                          </button>
                        </div>
                        <StrategicReceipt 
                          transaction={completedTx} 
                          onClose={() => setShowReceipt(false)} 
                        />
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {step === 'failed' && (
              <motion.div 
                key="failed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-10"
              >
                <div className="w-28 h-28 bg-rose-50 border-4 border-white rounded-[2.5rem] flex items-center justify-center shadow-2xl relative overflow-hidden">
                  <XCircle className="w-14 h-14 text-rose-500" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-4xl font-black text-slate-950 tracking-tighter italic uppercase">Protocol Failed</h3>
                  <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed max-w-xs mx-auto">
                    The transaction block was rejected by the gateway. Verify your parameters and retry the sequence.
                  </p>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep('method')}
                  className="w-full py-5 bg-slate-950 text-white rounded-[1.5rem] font-black uppercase tracking-[0.25em] text-[11px] shadow-2xl hover:bg-rose-600 transition-all italic"
                >
                  Re-Initiate Sequence
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <TransactionPinModal 
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onConfirm={confirmTransaction}
        amount={Number(amount) || 0}
        action={type === 'deposit' ? 'Wallet Funding' : 'Wallet Withdrawal'}
      />
    </div>
  );
};
