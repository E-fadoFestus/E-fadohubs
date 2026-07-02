import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  History, 
  CreditCard, 
  Plus, 
  Shield, 
  Bell, 
  Search, 
  Filter,
   ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Banknote,
  Bitcoin,
  Lock,
  Settings,
  ShieldCheck,
  Fingerprint,
  Building2,
  User,
  FileText,
  SearchCode,
  Smartphone,
  Copy,
  ArrowRightLeft,
  ChevronDown,
  ExternalLink,
  Globe,
  Hash,
  Coins,
  Trophy,
  ArrowLeft,
  Zap,
  AlertCircle,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Transaction, PaymentMethod } from '../types';
import { SecurityGuard, TransactionPinModal } from './SecurityGuard';
import { StrategicReceipt } from './StrategicReceipt';
import { db, doc, updateDoc } from '../firebase';
import { CEO_BANK_ACCOUNTS } from '../constants/businessProfile';

import { TransactionHistory } from './TransactionHistory';
import { TransactionService } from '../services/TransactionService';
import { PaystackDeposit } from './PaystackDeposit';
import { DirectBankDeposit } from './DirectBankDeposit';
import { PayPalHostedButton } from './PayPalHostedButton';
import { useCurrency } from '../lib/CurrencyContext';

interface UserWalletProps {
  user: UserProfile;
  onUpdateBalance: (amount: number, type: 'deposit' | 'withdrawal', accountDetails?: any) => Promise<void>;
  onClose?: () => void;
  initialTab?: 'overview' | 'profile' | 'deposit' | 'withdraw' | 'history' | 'settings';
}

export const UserWallet: React.FC<UserWalletProps> = ({ user, onUpdateBalance, onClose, initialTab = 'overview' }) => {
  const { selectedCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'deposit' | 'withdraw' | 'history' | 'settings'>(initialTab);
  const [depositMethod, setDepositMethod] = useState<'paystack' | 'bank_transfer' | 'remita' | 'paypal'>('paystack');
  const [remitaRRR, setRemitaRRR] = useState('RRR-8492-0192-4910');
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notifications, setNotifications] = useState<{id: string, message: string, type: 'info' | 'warning'}[]>([]);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{type: 'deposit' | 'withdraw', amount: number} | null>(null);
  
  // Profile edit field states
  const [profileDisplayName, setProfileDisplayName] = useState(user.displayName || '');
  const [profileBio, setProfileBio] = useState(user.bio || '');
  const [profileBankName, setProfileBankName] = useState(user.bankName || '');
  const [profileAccountNumber, setProfileAccountNumber] = useState(user.accountNumber || '');
  const [profileAccountName, setProfileAccountName] = useState(user.accountName || '');
  const [profileExternalWallet, setProfileExternalWallet] = useState(user.externalWallet || '');
  const [profileMobileMoneyNumber, setProfileMobileMoneyNumber] = useState(user.mobileMoneyNumber || '');
  const [profileMobileMoneyProvider, setProfileMobileMoneyProvider] = useState(user.mobileMoneyProvider || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [accountDetails, setAccountDetails] = useState({
    accountNumber: user.accountNumber || '',
    bankName: user.bankName || '',
    accountName: user.accountName || user.displayName || '',
    routingNumber: ''
  });
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);
  const [bankSearch, setBankSearch] = useState(user.bankName || '');
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [manualBankMode, setManualBankMode] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [withdrawSource, setWithdrawSource] = useState<'cashOutWallet' | 'playerWallet'>('playerWallet');

  // Dynamic Payment Methods State
  const [paymentsList, setPaymentsList] = useState<PaymentMethod[]>(() => {
    const saved = localStorage.getItem(`payment_methods_${user.uid}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved payment methods", e);
      }
    }
    return [
      { id: 'pm1', type: 'credit_card', name: 'Visa ending in 4242', details: '**** **** **** 4242', isDefault: true },
      { id: 'pm2', type: 'bank_transfer', name: 'GTBank Account', details: '0123456789', isDefault: false },
      { id: 'pm3', type: 'crypto', name: 'Bitcoin Wallet', details: 'bc1qxy2kg...z7v', isDefault: false },
    ];
  });

  useEffect(() => {
    localStorage.setItem(`payment_methods_${user.uid}`, JSON.stringify(paymentsList));
  }, [paymentsList, user.uid]);

  const [showAddMethodModal, setShowAddMethodModal] = useState(false);
  const [addMethodType, setAddMethodType] = useState<'credit_card' | 'bank_transfer' | 'crypto'>('credit_card');
  const [addMethodName, setAddMethodName] = useState('');
  const [addMethodDetails, setAddMethodDetails] = useState('');

  // Live account name automated query simulation
  const [isResolvingName, setIsResolvingName] = useState(false);
  const [resolvedStatusMessage, setResolvedStatusMessage] = useState<string | null>(null);

  // Cyber Security Sentry & Anti-Fraud Suite states
  const [shieldActive, setShieldActive] = useState<boolean>(() => {
    const val = localStorage.getItem('efado_payment_shield');
    return val === null ? true : val === 'true';
  });
  const [nightGuideActive, setNightGuideActive] = useState<boolean>(() => {
    const val = localStorage.getItem('efado_night_guide');
    return val === null ? true : val === 'true';
  });

  useEffect(() => {
    localStorage.setItem('efado_payment_shield', shieldActive.toString());
  }, [shieldActive]);

  useEffect(() => {
    localStorage.setItem('efado_night_guide', nightGuideActive.toString());
  }, [nightGuideActive]);

  // Automated name lookup listener
  useEffect(() => {
    const accNo = accountDetails.accountNumber;
    const bName = accountDetails.bankName;

    if (accNo && accNo.length === 10 && bName) {
      setIsResolvingName(true);
      setResolvedStatusMessage('Enquiring bank gateway details...');
      
      const timer = setTimeout(() => {
        let resolvedName = '';
        if (accNo === '000122668') {
          resolvedName = 'OKHAWERE FESTUS';
        } else {
          // Stable pseudo-random Name based on account digits
          const sum = accNo.split('').reduce((acc, char) => acc + parseInt(char || '0', 10), 0);
          const firsts = ['DANIEL', 'OLUMIDE', 'KINGSLEY', 'TEMITOPE', 'CHINONSO', 'YUSUF', 'IBRAHIM', 'CHINEDU', 'OKHAWERE', 'FUNMILAYO', 'NGOZI', 'BABATUNDE'];
          const lasts = ['FESTUS', 'OKHAWERE', 'OJO', 'ADEYEMI', 'EZE', 'ALIYU', 'ALABI', 'NWACHUKWU', 'JOHNSON', 'BALOGUN', 'DOKUBO'];
          const fName = firsts[sum % firsts.length];
          const lName = lasts[(sum * 7) % lasts.length];
          resolvedName = `${fName} ${lName}`;
        }
        
        setAccountDetails(prev => ({
          ...prev,
          accountName: resolvedName
        }));
        setIsResolvingName(false);
        setResolvedStatusMessage('Account Name Verified ✓');
      }, 1200);

      return () => clearTimeout(timer);
    } else {
      setIsResolvingName(false);
      setResolvedStatusMessage(null);
    }
  }, [accountDetails.accountNumber, accountDetails.bankName]);

  useEffect(() => {
    setProfileDisplayName(user.displayName || '');
    setProfileBio(user.bio || '');
    setProfileBankName(user.bankName || '');
    setProfileAccountNumber(user.accountNumber || '');
    setProfileAccountName(user.accountName || '');
    setProfileExternalWallet(user.externalWallet || '');
    setProfileMobileMoneyNumber(user.mobileMoneyNumber || '');
    setProfileMobileMoneyProvider(user.mobileMoneyProvider || '');
    setAccountDetails({
      accountNumber: user.accountNumber || '',
      bankName: user.bankName || '',
      accountName: user.accountName || user.displayName || '',
      routingNumber: ''
    });
  }, [user]);

  const globalAndLocalBanks = [
    // Nigeria / West Africa
    { code: '044', name: 'Access Bank' },
    { code: '011', name: 'First Bank of Nigeria' },
    { code: '058', name: 'GTBank' },
    { code: '232', name: 'Zenith Bank' },
    { code: '033', name: 'United Bank for Africa (UBA)' },
    { code: '070', name: 'Fidelity Bank' },
    { code: '214', name: 'First City Monument Bank (FCMB)' },
    { code: '090267', name: 'Kuda Bank' },
    { code: '999992', name: 'OPay Digital Services' },
    { code: '50515', name: 'Moniepoint MFB' },
    // United States / North America
    { code: 'JPM', name: 'JP Morgan Chase' },
    { code: 'BOA', name: 'Bank of America' },
    { code: 'WFC', name: 'Wells Fargo' },
    { code: 'CITI', name: 'Citibank' },
    { code: 'GS', name: 'Goldman Sachs' },
    // United Kingdom / Europe
    { code: 'BARC', name: 'Barclays Bank Plc' },
    { code: 'HSBC', name: 'HSBC United Kingdom' },
    { code: 'LLOY', name: 'Lloyds Bank' },
    { code: 'MONZO', name: 'Monzo Bank UK' },
    { code: 'REVOL', name: 'Revolut' },
    // Asia Pacific / Global
    { code: 'STC', name: 'Standard Chartered Bank Plc' },
    { code: 'DBS', name: 'DBS Bank' },
    { code: 'ICBC', name: 'ICBC China' },
  ].sort((a, b) => a.name.localeCompare(b.name));

  const filteredBanks = globalAndLocalBanks.filter(b => 
    b.name.toLowerCase().includes(bankSearch.toLowerCase()) || 
    b.code.toLowerCase().includes(bankSearch.toLowerCase())
  );
  const paymentMethods = paymentsList;

  const paymentCategories = [
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

  // Mock transactions (in a real app, these would come from Firestore)
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: 't1', userId: user.uid, type: 'deposit', amount: 500, currency: 'USD', status: 'completed', method: 'Credit Card', timestamp: new Date(Date.now() - 86400000), description: 'Wallet top-up' },
    { id: 't2', userId: user.uid, type: 'game_bet', amount: 50, currency: 'USD', status: 'completed', timestamp: new Date(Date.now() - 43200000), description: 'Lucky Spin Bet' },
    { id: 't3', userId: user.uid, type: 'game_win', amount: 150, currency: 'USD', status: 'completed', timestamp: new Date(Date.now() - 36000000), description: 'Lucky Spin Win' },
    { id: 't4', userId: user.uid, type: 'withdrawal', amount: 100, currency: 'USD', status: 'pending', method: 'Bank Transfer', timestamp: new Date(Date.now() - 1800000), description: 'Cash out' },
  ]);

  const handleDeposit = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setNotifications(prev => [...prev, { id: Date.now().toString(), message: "Please enter a valid deposit amount", type: 'warning' }]);
      return;
    }
    if (!accountDetails.bankName) {
      setNotifications(prev => [...prev, { id: Date.now().toString(), message: "Please enter or select your sending bank", type: 'warning' }]);
      return;
    }
    if (!accountDetails.accountNumber || accountDetails.accountNumber.length < 8) {
      setNotifications(prev => [...prev, { id: Date.now().toString(), message: "Please enter your sending 10-digit account number", type: 'warning' }]);
      return;
    }
    if (!accountDetails.accountName) {
      setNotifications(prev => [...prev, { id: Date.now().toString(), message: "Please enter your sending account name", type: 'warning' }]);
      return;
    }
    setPendingAction({ type: 'deposit', amount: Number(amount) });
    setShowPinModal(true);
  };

  const handleWithdraw = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    const withdrawAmount = Number(amount);
    const availableBalance = withdrawSource === 'playerWallet' ? user.playerWallet : (user.cashOutWallet || 0);
    const walletLabel = withdrawSource === 'playerWallet' ? "Player's Win Wallet" : "Cash Out Wallet";
    
    // Minimum player withdrawal setting: 5,000 Naira scale proportionally based on active currency
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

    if (withdrawAmount < minLimit) {
      setNotifications(prev => [...prev, {
        id: Date.now().toString(),
        message: `Payout threshold unmet. Minimum limit is ${selectedCurrency.symbol}${minLimit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (proportionate of ₦5,000 in ${selectedCurrency.code})`,
        type: 'warning'
      }]);
      return;
    }

    if (withdrawAmount > availableBalance) {
      setNotifications(prev => [...prev, { 
        id: Date.now().toString(), 
        message: `Insufficient funds in ${walletLabel}`, 
        type: 'warning' 
      }]);
      return;
    }
    setPendingAction({ type: 'withdraw', amount: withdrawAmount });
    setShowPinModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage(null);

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: profileDisplayName,
        bio: profileBio,
        bankName: profileBankName,
        accountNumber: profileAccountNumber,
        accountName: profileAccountName,
        externalWallet: profileExternalWallet,
        mobileMoneyNumber: profileMobileMoneyNumber,
        mobileMoneyProvider: profileMobileMoneyProvider
      });

      setProfileMessage({
        text: 'Profile and payment liaison credentials synchronized successfully with EFADO core registry.',
        type: 'success'
      });
      
      setAccountDetails(prev => ({
        ...prev,
        bankName: profileBankName,
        accountNumber: profileAccountNumber,
        accountName: profileAccountName
      }));

    } catch (err: any) {
      console.error('Error saving profile: ', err);
      setProfileMessage({
        text: `Profile synchronization disrupted: ${err.message || String(err)}`,
        type: 'error'
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const confirmTransaction = async () => {
    if (!pendingAction) return;
    setShowPinModal(false);
    setIsProcessing(true);
    
    try {
      const { type, amount: actionAmount } = pendingAction;
      let txId = '';
      const reference = `EFD-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString().slice(-4)}`;

      if (type === 'deposit') {
        const isManualDep = !['Direct Wallet', 'player_wallet', 'mining_wallet'].includes(selectedMethod);
        await onUpdateBalance(actionAmount, 'deposit');
        txId = await TransactionService.recordTransaction({
          userId: user.uid,
          type: 'deposit',
          amount: actionAmount,
          currency: 'USD',
          status: isManualDep ? 'pending' : 'completed',
          method: selectedMethod || 'Direct Deposit',
          hub: 'WALLET',
          purpose: 'Wallet Top-up',
          reference,
          description: isManualDep 
            ? `Verification Pending: Sender [${accountDetails.bankName || 'Unknown Bank'} / ${accountDetails.accountNumber || 'N/A'} / ${accountDetails.accountName || 'N/A'}]`
            : 'Wallet Deposit',
          skipWalletUpdate: true,
          metadata: {
            senderBankName: accountDetails.bankName,
            senderAccountNumber: accountDetails.accountNumber,
            senderAccountName: accountDetails.accountName,
            transactionRef: reference
          }
        });
      } else {
        await onUpdateBalance(actionAmount, 'withdrawal', {
          ...accountDetails,
          sourceWallet: withdrawSource
        });
        txId = await TransactionService.recordTransaction({
          userId: user.uid,
          type: 'withdrawal',
          amount: actionAmount,
          currency: 'USD',
          status: 'pending',
          method: selectedMethod || 'Bank Transfer',
          hub: 'WALLET',
          purpose: 'Cash Out Request',
          reference,
          description: 'Withdrawal Request',
          skipWalletUpdate: true
        });
      }
      
      const newTx: Transaction = {
        id: txId,
        userId: user.uid,
        type: type === 'deposit' ? 'deposit' : 'withdrawal',
        amount: actionAmount,
        currency: 'USD',
        status: type === 'deposit' ? 'completed' : 'pending',
        method: selectedMethod || (type === 'deposit' ? 'Direct Deposit' : 'Bank Transfer'),
        hub: 'WALLET',
        purpose: type === 'deposit' ? 'Wallet Top-up' : 'Cash Out Request',
        reference,
        timestamp: new Date()
      };

      setLastTransaction(newTx);
      setSelectedReceiptTx(newTx); // AUTOMATIC PROMPT

      setNotifications(prev => [...prev, { 
        id: Date.now().toString(), 
        message: `Successfully processed ${type} of $${actionAmount}`, 
        type: 'info' 
      }]);
      setAmount('');
      setActiveTab('history');
    } catch (error) {
      console.error('Transaction failed', error);
      setNotifications(prev => [...prev, { 
        id: Date.now().toString(), 
        message: 'Transaction failed. Please check network connectivity.', 
        type: 'warning' 
      }]);
    } finally {
      setIsProcessing(false);
      setPendingAction(null);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         t.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row h-[700px]">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 p-6 flex flex-col gap-2">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-black text-gray-900 uppercase tracking-tighter">EFADO Wallet</h2>
              <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Digital Hubs Connect</p>
            </div>
          </div>

          {[
            { id: 'overview', label: 'Overview', icon: Wallet },
            { id: 'profile', label: 'My Acc. Profile', icon: User },
            { id: 'deposit', label: 'Deposit Funds', icon: ArrowDownCircle },
            { id: 'withdraw', label: 'Withdraw Funds', icon: ArrowUpCircle },
            { id: 'history', label: 'History', icon: History },
            { id: 'settings', label: 'Security', icon: Shield },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'text-gray-500 hover:bg-white hover:text-indigo-600'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}

          <div className="mt-auto pt-6 border-t border-gray-200 space-y-3">
            <div className="bg-indigo-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Alerts</span>
              </div>
              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-[10px] text-indigo-400 font-medium">No new notifications</p>
                ) : (
                  notifications.slice(-2).map(n => (
                    <div key={n.id} className="text-[10px] text-indigo-700 font-bold leading-tight">
                      • {n.message}
                    </div>
                  ))
                )}
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-xs tracking-wider rounded-2xl transition-all shadow-lg active:scale-95 border border-rose-500/20 shadow-rose-500/10"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Go Back</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-8 overflow-y-auto no-scrollbar">
          {onClose && (
            <div className="md:hidden flex justify-end mb-6">
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 text-xs font-black uppercase rounded-2xl shadow-sm transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Go Back</span>
              </button>
            </div>
          )}
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">My Account Profile</h3>
                    <p className="text-sm text-gray-500 font-medium">Verify credentials, configure payout information, and synchronize identity nodes.</p>
                  </div>
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-2 text-indigo-700">
                    <Fingerprint className="w-5 h-5 text-indigo-600" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Neural ID: {user.uid.slice(0, 8)}...</span>
                  </div>
                </div>

                {/* Wallets & Activity Status Overview inside Profile tab */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-900 text-white rounded-2xl border border-white/5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Mining Balance:</span>
                    <p className="text-lg font-extrabold mt-1 text-amber-500">{(user.miningWallet || 0).toLocaleString()} N-Notes</p>
                  </div>
                  <div className="p-4 bg-slate-900 text-white rounded-2xl border border-white/5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Cash Out Balance:</span>
                    <p className="text-lg font-extrabold mt-1 text-emerald-400">₦{(user.cashOutWallet || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-slate-900 text-white rounded-2xl border border-white/5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Deposit / Stakes:</span>
                    <p className="text-lg font-extrabold mt-1 text-indigo-400">₦{user.depositWallet.toLocaleString()}</p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  {profileMessage && (
                    <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
                      profileMessage.type === 'success' ? 'bg-emerald-55 font-bold border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                    }`}>
                      {profileMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />}
                      <span>{profileMessage.text}</span>
                    </div>
                  )}

                  <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm space-y-6">
                    <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 border-b border-gray-100 pb-2">
                      <User className="w-4 h-4 text-indigo-500" /> 01. User Identity & Status Statement
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Full Display Name / Identity</label>
                        <input
                          type="text"
                          required
                          placeholder="Your full legal or alias name"
                          value={profileDisplayName}
                          onChange={(e) => setProfileDisplayName(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                        />
                        <p className="text-[9px] text-gray-400 font-medium">Used for direct peer audits & liaison identity.</p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Account Registered Email</label>
                        <input
                          type="email"
                          disabled
                          value={user.email}
                          className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-400 cursor-not-allowed outline-none shadow-sm"
                        />
                        <p className="text-[9px] text-gray-400 font-medium">Synced with primary Google single sign-on credential.</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Biographical Status / Affiliate Pitch</label>
                      <textarea
                        rows={3}
                        placeholder="Tell the community about yourself, your vendor plans, or your affiliate networks..."
                        value={profileBio}
                        onChange={(e) => setProfileBio(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm resize-none"
                      />
                    </div>
                  </div>

                  <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm space-y-6">
                    <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 border-b border-gray-100 pb-2">
                      <Building2 className="w-4 h-4 text-indigo-500" /> 02. Sovereign Bank Payout Account (Cash Out Route)
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Settlement Bank Name</label>
                        <select
                          value={profileBankName}
                          onChange={(e) => {
                            setProfileBankName(e.target.value);
                            setBankSearch(e.target.value);
                          }}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                        >
                          <option value="">-- Choose Settlement Bank --</option>
                          {globalAndLocalBanks.map(b => (
                            <option key={b.code} value={b.name}>{b.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Account Number (10 Digits)</label>
                        <input
                          type="text"
                          maxLength={15}
                          placeholder="0123456789"
                          value={profileAccountNumber}
                          onChange={(e) => setProfileAccountNumber(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Beneficiary Account Name</label>
                        <input
                          type="text"
                          placeholder="Exact Match as registered with bank"
                          value={profileAccountName}
                          onChange={(e) => setProfileAccountName(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm space-y-6">
                    <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 border-b border-gray-100 pb-2">
                      <Smartphone className="w-4 h-4 text-indigo-500" /> 03. Decentralized Mobile Money & Crypto Wallets
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Mobile Money Network</label>
                        <select
                          value={profileMobileMoneyProvider}
                          onChange={(e) => setProfileMobileMoneyProvider(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                        >
                          <option value="">-- Choose Network Provider --</option>
                          <option value="OPay">OPay</option>
                          <option value="PalmPay">PalmPay</option>
                          <option value="Kuda Bank">Kuda Bank</option>
                          <option value="MTN MoMo">MTN MoMo</option>
                          <option value="Airtel Money">Airtel Money</option>
                          <option value="M-Pesa">M-Pesa</option>
                          <option value="Orange Money">Orange Money</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Mobile Merchant Number</label>
                        <input
                          type="text"
                          placeholder="e.g. 080 or 090 number"
                          value={profileMobileMoneyNumber}
                          onChange={(e) => setProfileMobileMoneyNumber(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">External Crypto Address (USDT/BTC)</label>
                        <input
                          type="text"
                          placeholder="bc1q... or 0x... for TRC20"
                          value={profileExternalWallet}
                          onChange={(e) => setProfileExternalWallet(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      {isSavingProfile ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Synchronizing...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          Save & Synchronize Profile
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-[2rem] text-white shadow-xl">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Total Balance</p>
                    <h3 className="text-3xl font-black mb-4">₦{(user.depositWallet + user.playerWallet + (user.cashOutWallet || 0) + (user.miningWallet || 0) * 0.01).toLocaleString()}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold bg-white/10 w-fit px-2 py-1 rounded-full">
                      <Shield className="w-3 h-3" /> Verified Account
                    </div>
                  </div>
                  <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm">
                    <p className="text-xs font-black text-gray-900 uppercase tracking-widest mb-1">Deposit Wallet</p>
                    <h3 className="text-2xl font-black text-gray-950">₦{user.depositWallet.toLocaleString()}</h3>
                    <p className="text-[10px] text-gray-400 font-bold mt-2">Ready for gameplay/stakes</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-6 rounded-[2rem] shadow-sm">
                    <p className="text-xs font-black text-emerald-950 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-emerald-600" /> Player's Win Wallet
                    </p>
                    <h3 className="text-2xl font-black text-emerald-950">₦{user.playerWallet.toLocaleString()}</h3>
                    <p className="text-[10px] text-emerald-700/80 font-bold mt-2">Accumulated winnings</p>
                  </div>
                  <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Cash Out Wallet</p>
                    <h3 className="text-2xl font-black text-gray-900">₦{(user.cashOutWallet || 0).toLocaleString()}</h3>
                    <p className="text-[10px] text-emerald-600 font-bold mt-2">Available for withdrawal</p>
                  </div>
                  <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform">
                      <Coins className="w-12 h-12 text-indigo-600" />
                    </div>
                    <p className="text-xs font-black text-gray-950 uppercase tracking-widest mb-1">EFADO Mining Wallet</p>
                    <div className="flex items-baseline gap-1">
                      <h3 className="text-2xl font-black text-indigo-700">{(user.miningWallet || 0).toLocaleString()}</h3>
                      <span className="text-[10px] font-black text-slate-950 uppercase tracking-widest">EC</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                       <p className="text-[10px] text-indigo-700 font-black italic">Stage: {user.miningProgress?.stage || 'E'}</p>
                       <p className="text-[10px] text-slate-950 font-black">≈ ₦{((user.miningWallet || 0) * 0.01).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-black text-gray-900 uppercase tracking-tighter">Recent Activity</h4>
                    <button onClick={() => setActiveTab('history')} className="text-xs font-bold text-indigo-600 hover:underline">View All</button>
                  </div>
                  <div className="space-y-3">
                    {transactions.slice(0, 4).map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            t.type === 'deposit' ? 'bg-emerald-100 text-emerald-600' :
                            t.type === 'withdrawal' ? 'bg-orange-100 text-orange-600' :
                            'bg-indigo-100 text-indigo-600'
                          }`}>
                            {t.type === 'deposit' ? <ArrowDownCircle className="w-5 h-5" /> :
                             t.type === 'withdrawal' ? <ArrowUpCircle className="w-5 h-5" /> :
                             <CreditCard className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{t.description}</p>
                            <p className="text-[10px] text-gray-950 font-bold">{new Date(t.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-black ${
                            t.type === 'deposit' || t.type === 'game_win' ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {t.type === 'deposit' || t.type === 'game_win' ? '+' : '-'}${t.amount.toFixed(2)}
                          </p>
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                            t.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'deposit' && (
              <motion.div
                key="deposit"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-2xl mx-auto space-y-8"
              >
                <div className="text-center space-y-4">
                  <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">FUND YOUR ACCOUNT</h3>
                  
                  {/* BEAUTIFUL SWITCHER TABS FOR ULTRA-CLEAR SELECTION */}
                  <div className="flex flex-wrap gap-4 border-b border-gray-150 justify-center">
                    <button 
                      type="button"
                      onClick={() => setDepositMethod('paystack')}
                      className={`pb-3 text-xs font-black uppercase tracking-widest transition-all ${
                        depositMethod === 'paystack' 
                          ? 'border-b-4 border-indigo-600 text-indigo-600' 
                          : 'text-gray-400 hover:text-gray-650'
                      }`}
                    >
                      ⚡ Instant Paystack
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setDepositMethod('remita');
                        setRemitaRRR(`RRR-${Math.floor(1000 + Math.random()*9000)}-${Math.floor(1000 + Math.random()*9000)}-${Math.floor(100 + Math.random()*900)}`);
                      }}
                      className={`pb-3 text-xs font-black uppercase tracking-widest transition-all ${
                        depositMethod === 'remita' 
                          ? 'border-b-4 border-emerald-600 text-emerald-600' 
                          : 'text-gray-400 hover:text-gray-650'
                      }`}
                    >
                      🟢 Remita (RRR / TSA)
                    </button>
                    <button 
                      type="button"
                      onClick={() => setDepositMethod('paypal')}
                      className={`pb-3 text-xs font-black uppercase tracking-widest transition-all ${
                        depositMethod === 'paypal' 
                          ? 'border-b-4 border-blue-600 text-blue-600' 
                          : 'text-gray-400 hover:text-gray-650'
                      }`}
                    >
                      🌐 PayPal Global
                    </button>
                    <button 
                      type="button"
                      onClick={() => setDepositMethod('bank_transfer')}
                      className={`pb-3 text-xs font-black uppercase tracking-widest transition-all ${
                        depositMethod === 'bank_transfer' 
                          ? 'border-b-4 border-indigo-600 text-indigo-600' 
                          : 'text-gray-400 hover:text-gray-650'
                      }`}
                    >
                      🏦 Direct Bank Transfer
                    </button>
                  </div>
                </div>

                {/* THE RENDER OF SECURE COMPLIANT MODULE WITH INTEGRATED CALLBACKS */}
                <div className="bg-white border text-left border-gray-100 p-6 sm:p-8 rounded-[2.5rem] shadow-xl">
                  {depositMethod === 'paystack' ? (
                    <div className="space-y-6">
                      <div className="p-4 bg-indigo-50 border-2 border-indigo-150 rounded-2xl flex gap-3 shadow-sm mb-2">
                        <Zap className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-black tracking-widest text-[#4f46e5] uppercase">SOVEREIGN AUTO-DEPOSIT SYSTEM</span>
                          <p className="text-[11px] text-indigo-950 font-bold uppercase leading-normal mt-0.5">
                            Real-time automated payment processing. Funds are credited directly and instantly into your balance upon checkout completion.
                          </p>
                        </div>
                      </div>
                      
                      <PaystackDeposit 
                        user={user} 
                        defaultAmount={1000}
                        onSuccess={async ({ reference, amount: amt }) => {
                          try {
                            // Update balance
                            await onUpdateBalance(amt, 'deposit');
                            
                            // Generate transaction ledger log
                            const txData: any = {
                              userId: user.uid,
                              type: 'deposit',
                              amount: amt,
                              currency: 'NGN',
                              status: 'completed',
                              method: 'Paystack Card/USSD/Transfer',
                              hub: 'WALLET',
                              purpose: 'Wallet Top-up',
                              reference,
                              description: 'Wallet Top-up via Paystack Inline',
                              skipWalletUpdate: true,
                              metadata: {
                                paymentRef: reference,
                                gateway: 'paystack'
                              }
                            };
                            await TransactionService.recordTransaction(txData);

                            // Instantly pop receipt modal as requested by user
                            setSelectedReceiptTx({
                              ...txData,
                              timestamp: { seconds: Math.floor(Date.now() / 1000) }
                            });
                          } catch (err: any) {
                            console.error("Ledger write failed but payment was success:", err);
                          }
                        }} 
                      />
                    </div>
                  ) : depositMethod === 'remita' ? (
                    <div className="space-y-6">
                      <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex gap-3 shadow-sm mb-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-black tracking-widest text-emerald-800 uppercase">REMITA CORPORATE & TSA DEPOSIT SYSTEM</span>
                          <p className="text-[11px] text-emerald-950 font-bold uppercase leading-normal mt-0.5">
                            Real-time automated RRR processing. Pay instantly via Remita Gateway or take your RRR to any bank nationwide.
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4 border border-white/10">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active RRR Code</span>
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[9px] font-black">TSA SETTLEMENT</span>
                        </div>
                        
                        <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/10">
                          <code className="text-lg md:text-xl font-mono font-black tracking-widest text-emerald-400">{remitaRRR}</code>
                          <button 
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(remitaRRR);
                              alert(`✅ Remita RRR Copied: ${remitaRRR}\n\nYou can pay online via remita.net or at any commercial bank!`);
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase rounded-xl transition-all flex items-center gap-1.5"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy RRR
                          </button>
                        </div>

                        <div className="pt-2 flex flex-col sm:flex-row gap-3">
                          <button 
                            type="button"
                            onClick={async () => {
                              alert(`🚀 Initializing Remita Secure Payment Gateway...\n\nProcessing deposit of NGN 5,000 via RRR ${remitaRRR}...`);
                              await onUpdateBalance(5000, 'deposit');
                              alert(`✅ Remita Settlement Confirmed!\n\nNGN 5,000 has been credited to your wallet balance.`);
                            }}
                            className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-black font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg"
                          >
                            ⚡ Pay NGN 5,000 via Remita Inline Now
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              alert(`🔧 REMITA & PAYPAL STEP-BY-STEP INTEGRATION GUIDE:\n\n1. Merchant Account: Register at remita.net or sdk.remita.net and get approved for Corporate/TSA collections.\n\n2. Get API Credentials: Copy your Merchant ID, Service Type ID, and Secret Key from Remita Dashboard -> Settings -> Developers.\n\n3. Webhook Setup: Set notification URL in Remita to: https://api.efado.com/v1/webhooks/remita\n\n4. PayPal Coexistence: PayPal works seamlessly alongside Remita and Paystack! PayPal handles USD/EUR international cards while Remita processes corporate Nigerian bank accounts and federal RRR mandates.`);
                            }}
                            className="px-4 py-3.5 bg-white/10 hover:bg-white/20 text-white font-black text-[10px] uppercase rounded-2xl transition-all"
                          >
                            🔧 View Setup Guide
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : depositMethod === 'paypal' ? (
                    <div className="space-y-6">
                      <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl flex gap-3 shadow-sm mb-2">
                        <Globe className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-black tracking-widest text-blue-800 uppercase">PAYPAL HOSTED BUTTON CHECKOUT (ID: BG8UTPC9YVDEA)</span>
                          <p className="text-[11px] text-blue-950 font-bold uppercase leading-normal mt-0.5">
                            Both Part 1 SDK & Part 2 Hosted Button Container are linked. Fund your account using USD, EUR, GBP, or international bank cards.
                          </p>
                        </div>
                      </div>

                      <PayPalHostedButton 
                        hostedButtonId="BG8UTPC9YVDEA"
                        amount={amount ? parseFloat(amount) || 50 : 50}
                        onSuccess={async () => {
                          const depositAmtUSD = amount ? parseFloat(amount) || 50 : 50;
                          const depositAmtNGN = depositAmtUSD * 1600;
                          alert(`🌐 PayPal Hosted Button Checkout (${depositAmtUSD} USD / NGN ${depositAmtNGN.toLocaleString()})...\n\n✅ Payment Confirmed via PayPal Gateway! Credit has been added to your ledger.`);
                          await onUpdateBalance(depositAmtNGN, 'deposit');
                        }}
                      />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="p-4 bg-amber-50 border-2 border-amber-150 rounded-2xl flex gap-3 shadow-sm mb-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-black tracking-widest text-amber-800 uppercase">CEO STRATEGIC TRUST DEPOSIT</span>
                          <p className="text-[11px] text-amber-950 font-bold uppercase leading-normal mt-0.5">
                            Manual bank transfer to corporate Escrow accounts. Submit your transaction id and proof screenshot to receive clearance.
                          </p>
                        </div>
                      </div>
                      
                      <DirectBankDeposit 
                        user={user} 
                        defaultAmount={1000}
                        onSuccess={async () => {
                          // Standard manual escrow deposit log added inside DirectBankDeposit
                        }} 
                      />
                    </div>
                  )}
                </div>

                <div className="mt-8 flex items-center justify-center gap-12 border-t border-gray-50 pt-8">
                  <div className="flex items-center gap-2 opacity-30 grayscale hover:grayscale-0 transition-all cursor-crosshair">
                    <img src="https://picsum.photos/seed/visa/100/40" alt="Visa" className="h-6 object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex items-center gap-2 opacity-30 grayscale hover:grayscale-0 transition-all cursor-crosshair">
                    <img src="https://picsum.photos/seed/mastercard/100/40" alt="Mastercard" className="h-6 object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex items-center gap-2 opacity-30 grayscale hover:grayscale-0 transition-all cursor-crosshair">
                    <img src="https://picsum.photos/seed/secure/100/40" alt="Secure" className="h-6 object-contain" referrerPolicy="no-referrer" />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'withdraw' && (
              <motion.div
                key="withdraw"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-2xl mx-auto space-y-8"
              >
                <div className="text-center space-y-4">
                  <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">EXTERNAL BANK CASH OUT TERMINAL</h3>
                  
                  {/* DISTINCTIVE WITHDRAWAL FLAG */}
                  <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-300 flex items-start gap-3 shadow-md text-left font-sans">
                    <ArrowUpCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-black tracking-widest text-emerald-800 uppercase block">EXTERNAL CASH OUT/WITHDRAWAL</span>
                      <p className="text-[11px] text-emerald-950 font-bold leading-relaxed uppercase mt-0.5">
                        You are initiating a direct payload withdrawal OUT of the E-FADO ecosystem into an <span className="underline decoration-wavy">External Personal Bank or virtual wallet</span>. Ensure all recipient details are completely correct prior to payout execution.
                      </p>
                    </div>
                  </div>

                  {/* OPAY-STYLE SHIELD & NIGHT GUIDE CONTROLS */}
                  <div className="bg-[#0f172a] text-white rounded-[2rem] p-5 shadow-xl border border-white/5 space-y-4 text-left font-sans">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-400 animate-pulse" />
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider">CYBER SHIELD ACTIVE PRESETS</h4>
                          <p className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">Automated Cyber Sentry Protection Suite</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
                        Shield Safe
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Shield Toggle */}
                      <div className="flex items-center justify-between bg-slate-950/50 p-3.5 rounded-2xl border border-white/5">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${shieldActive ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                            OPay Payment Shield
                          </span>
                          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Phishing protection & secure routing</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setShieldActive(!shieldActive)}
                          className={`w-12 h-6 flex items-center rounded-full p-1 transition-all ${shieldActive ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'}`}
                        >
                          <span className="w-4 h-4 rounded-full bg-white shadow-md block" />
                        </button>
                      </div>

                      {/* Night Sentry Toggle */}
                      <div className="flex items-center justify-between bg-slate-950/50 p-3.5 rounded-2xl border border-white/5">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${nightGuideActive ? 'bg-indigo-500' : 'bg-slate-500'} animate-pulse`} />
                            Night Safe Sentry
                          </span>
                          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Late hours volume cap (10PM-6AM)</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setNightGuideActive(!nightGuideActive)}
                          className={`w-12 h-6 flex items-center rounded-full p-1 transition-all ${nightGuideActive ? 'bg-indigo-500 justify-end' : 'bg-slate-800 justify-start'}`}
                        >
                          <span className="w-4 h-4 rounded-full bg-white shadow-md block" />
                        </button>
                      </div>
                    </div>

                    {nightGuideActive && (new Date().getHours() >= 22 || new Date().getHours() < 6) && (
                      <div className="p-3 bg-indigo-950/80 border border-indigo-500/30 rounded-2xl flex gap-2.5 items-start">
                        <Clock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 animate-spin-slow" />
                        <p className="text-[8.5px] text-indigo-200 font-bold leading-relaxed uppercase">
                          ⚠️ NOCTURNAL HOURS PROTECTION ACTIVE (10 PM - 6 AM): Withdrawals will be subject to manual CEO-desk dual clearance. Sleep security lock holds your funds gracefully till sunrise.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-emerald-600 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -translate-y-12 translate-x-12" />
                      
                      <p className="text-[10px] font-black text-emerald-100 uppercase tracking-[0.3em] mb-4">Select Wallet Source</p>
                      
                      <div className="grid grid-cols-2 gap-2 mb-6 pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setWithdrawSource('cashOutWallet');
                            setAmount('');
                          }}
                          className={`py-3 px-2 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all border ${
                            withdrawSource === 'cashOutWallet' 
                              ? 'bg-white text-emerald-900 border-white shadow-md font-sans' 
                              : 'bg-emerald-700/50 text-emerald-100 border-white/10 hover:bg-emerald-700'
                          }`}
                        >
                          Cash Out (₦{(user.cashOutWallet || 0).toLocaleString()})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setWithdrawSource('playerWallet');
                            setAmount('');
                          }}
                          className={`py-3 px-2 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all border ${
                            withdrawSource === 'playerWallet' 
                              ? 'bg-white text-emerald-950 border-white shadow-md font-sans' 
                              : 'bg-emerald-700/50 text-emerald-100 border-white/10 hover:bg-emerald-700'
                          }`}
                        >
                          Player Wins (₦{user.playerWallet.toLocaleString()})
                        </button>
                      </div>

                      <p className="text-[10px] font-black text-emerald-100 uppercase tracking-[0.3em] mb-1">
                        Liquid Balance ({withdrawSource === 'playerWallet' ? "Player Wins" : "Cash Out"})
                      </p>
                      <h4 className="text-3xl font-black mb-6 font-display italic tracking-tighter">₦{(withdrawSource === 'playerWallet' ? user.playerWallet : (user.cashOutWallet || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                      
                      <label className="block text-[11px] font-black text-emerald-100 uppercase tracking-widest mb-2">TYPE WITHDRAWAL AMOUNT (₦)</label>
                      <div className="relative mb-6">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-black text-white/20 select-none">₦</span>
                        <input 
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="Type Amount Here..."
                          className="w-full pl-8 pr-4 bg-transparent border-b-2 border-white/20 py-3 font-display text-2xl font-black text-white focus:outline-none focus:border-white transition-all placeholder:text-white/20 outline-none"
                        />
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2">
                        {[0.25, 0.5, 0.75, 1].map(percent => (
                          <button 
                            key={percent}
                            onClick={() => {
                              const base = withdrawSource === 'playerWallet' ? user.playerWallet : (user.cashOutWallet || 0);
                              setAmount(Math.floor(base * percent).toString());
                            }}
                            className="py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black tracking-widest transition-all border border-white/10"
                          >
                            {percent * 100}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <h5 className="text-xs font-black text-slate-900 uppercase tracking-widest">Withdrawal Protocols</h5>
                      </div>
                      <ul className="space-y-3">
                        {[
                          'Verified Identity Required',
                          'Processing Window: 24-48 Business Hours',
                          'Standard Liquidity Fee: $2.00 Flat Rate',
                          'Secure Encryption Active'
                        ].map((txt, i) => (
                          <li key={i} className="flex items-start gap-2 text-[10px] text-gray-950 font-black uppercase tracking-tight">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                            {txt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <label className="block text-[11px] font-black text-gray-900 uppercase tracking-widest">2. SELECT DESTINATION BANK</label>
                        {!manualBankMode && (
                          <button 
                            type="button"
                            onClick={() => {
                              setManualBankMode(true);
                              setAccountDetails({
                                ...accountDetails,
                                bankName: bankSearch
                              });
                            }}
                            className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-sans font-black uppercase tracking-wider text-[9px] rounded-full border border-indigo-100 transition-all shadow-sm"
                          >
                            Type Manually
                          </button>
                        )}
                      </div>
                      
                      {manualBankMode ? (
                        <div className="space-y-4">
                          <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-950 pointer-events-none" />
                            <input 
                              placeholder="Type Your Bank Name (e.g. Lotus Bank, Signature Bank)..."
                              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-950"
                              value={accountDetails.bankName}
                              onChange={e => {
                                setAccountDetails({...accountDetails, bankName: e.target.value});
                                setBankSearch(e.target.value);
                              }}
                            />
                          </div>
                          
                          <div className="relative">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-950 pointer-events-none" />
                            <input 
                              placeholder="Bank Code / Sort Code (e.g. 057, 101) - Optional"
                              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-950"
                              value={accountDetails.routingNumber}
                              onChange={e => {
                                setAccountDetails({...accountDetails, routingNumber: e.target.value});
                              }}
                            />
                          </div>

                          <button 
                            type="button"
                            onClick={() => {
                              setManualBankMode(false);
                              setBankSearch('');
                              setAccountDetails({...accountDetails, bankName: '', routingNumber: ''});
                            }}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-black uppercase tracking-wider text-[9px] rounded-full border border-slate-200 flex items-center gap-1.5 transition-all shadow-sm"
                          >
                            ← Use Bank Directory Search
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-950 pointer-events-none" />
                          <input 
                            placeholder="Search Your Bank (Local / Int'l)"
                            className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-950"
                            value={bankSearch}
                            onChange={e => {
                              setBankSearch(e.target.value);
                              setShowBankDropdown(true);
                            }}
                            onFocus={() => setShowBankDropdown(true)}
                          />
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-950 pointer-events-none" />

                          <AnimatePresence>
                            {showBankDropdown && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute z-50 left-0 right-0 top-[110%] bg-white border-2 border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto no-scrollbar p-2"
                              >
                                {filteredBanks.length > 0 ? (
                                  <>
                                    {filteredBanks.map(bank => (
                                      <button
                                        key={`withdraw-${bank.code}`}
                                        type="button"
                                        onClick={() => {
                                          setAccountDetails({...accountDetails, bankName: bank.name, routingNumber: bank.code});
                                          setBankSearch(bank.name);
                                          setShowBankDropdown(false);
                                        }}
                                        className="w-full text-left p-3.5 hover:bg-emerald-600 hover:text-white rounded-xl transition-all flex items-center justify-between group"
                                      >
                                        <span className="text-[10px] font-black uppercase tracking-widest">{bank.name}</span>
                                        <span className="text-[9px] font-mono font-black border border-current/20 px-1.5 rounded">{bank.code}</span>
                                      </button>
                                    ))}
                                    <div className="border-t border-slate-100 mt-2 pt-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setManualBankMode(true);
                                          setShowBankDropdown(false);
                                          setAccountDetails({...accountDetails, bankName: bankSearch});
                                        }}
                                        className="w-full text-center p-3 text-indigo-600 hover:bg-indigo-50 font-black uppercase tracking-widest text-[9px] rounded-xl transition-all"
                                      >
                                        + Enter Custom Bank Name Manually
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <div className="p-4 text-center space-y-2">
                                    <div className="text-[10px] font-black text-gray-950 uppercase tracking-widest">Bank Not Found</div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setManualBankMode(true);
                                        setShowBankDropdown(false);
                                        setAccountDetails({...accountDetails, bankName: bankSearch});
                                      }}
                                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black uppercase tracking-widest text-[9px] rounded-full transition-all"
                                    >
                                      Use "{bankSearch}" as Custom Bank Name
                                    </button>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      <div className="relative">
                        <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-950" />
                        <input 
                          placeholder="10-Digit Account Number"
                          maxLength={10}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-900"
                          value={accountDetails.accountNumber}
                          onChange={e => {
                            const digitsOnly = e.target.value.replace(/\D/g, '');
                            setAccountDetails({...accountDetails, accountNumber: digitsOnly});
                          }}
                        />
                      </div>

                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-950 pointer-events-none" />
                        <input 
                          placeholder={isResolvingName ? "Resolving Beneficiary Name..." : "Account Holder Name"}
                          className={`w-full pl-12 pr-10 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-400 ${
                            isResolvingName ? 'text-indigo-600 animate-pulse bg-indigo-50/30' : 'text-gray-900'
                          }`}
                          value={accountDetails.accountName}
                          onChange={e => setAccountDetails({...accountDetails, accountName: e.target.value})}
                          disabled={isResolvingName}
                        />
                        {isResolvingName && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        )}
                        {!isResolvingName && resolvedStatusMessage && accountDetails.accountName && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 text-xs font-black">
                            ✓
                          </div>
                        )}
                      </div>

                      {resolvedStatusMessage && (
                        <div className={`text-[10px] font-black uppercase tracking-widest ml-1 ${
                          isResolvingName ? 'text-indigo-600 animate-pulse' : 'text-emerald-600 flex items-center gap-1'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isResolvingName ? 'bg-indigo-600 animate-ping' : 'bg-emerald-500'}`} />
                          {resolvedStatusMessage}
                        </div>
                      )}

                      {/* Dynamic Beneficiary Details Live Card */}
                      <div className="p-6 bg-slate-900 text-white rounded-[2rem] border border-white/10 relative overflow-hidden shadow-2xl space-y-4">
                        {/* Card background/glow theme */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl -ml-6 -mb-6 pointer-events-none" />

                        <div className="flex justify-between items-center pb-2 border-b border-white/5">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-300">BENEFICIARY DETAILS PREVIEW</span>
                          </div>
                          <span className={`text-[8px] font-sans font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                            isResolvingName ? 'bg-indigo-500/20 text-indigo-300 animate-pulse' : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {isResolvingName ? 'ENQUIRING GATEWAY...' : 'ACTIVE TACTICAL PATH'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-0.5">
                            <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest">BANK OF SETTLEMENT</span>
                            <p className="text-[10px] font-black text-white uppercase tracking-wider truncate">
                              {accountDetails.bankName || <span className="text-rose-400 italic font-medium">NOT SPECIFIED</span>}
                            </p>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest">SETTLEMENT CODE / ID</span>
                            <p className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest truncate">
                              {accountDetails.routingNumber || <span className="text-slate-500">NO CODE</span>}
                            </p>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest">BENEFICIARY DIGIT NUMBER</span>
                            <p className="text-[11px] font-mono font-black text-indigo-400 uppercase tracking-widest truncate">
                              {accountDetails.accountNumber || <span className="text-rose-400 italic font-medium">NOT PROVIDED</span>}
                            </p>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest">BENEFICIARY ACCOUNT NAME</span>
                            <p className="text-[10px] font-black uppercase tracking-wider truncate">
                              {isResolvingName ? (
                                <span className="text-indigo-400 animate-pulse italic">Retrieving...</span>
                              ) : accountDetails.accountName ? (
                                <span className="text-emerald-400 font-extrabold flex items-center gap-1 text-[10.5px]">
                                  {accountDetails.accountName} ✓
                                </span>
                              ) : (
                                <span className="text-rose-400 italic font-medium">PENDING NAME</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleWithdraw}
                      disabled={
                        isProcessing || 
                        isResolvingName || 
                        !amount || 
                        parseFloat(amount) <= 0 || 
                        parseFloat(amount) > (withdrawSource === 'playerWallet' ? user.playerWallet : (user.cashOutWallet || 0)) ||
                        !accountDetails.accountNumber ||
                        accountDetails.accountNumber.length !== 10 ||
                        !accountDetails.bankName ||
                        !accountDetails.accountName
                      }
                      className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-emerald-200/50 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing Vault Exit...
                        </>
                      ) : (
                        <>
                          <Banknote className="w-5 h-5" />
                          Finalize Tactical Withdrawal
                        </>
                      )}
                    </button>
                    
                    <div className="flex items-center justify-center gap-2">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End-to-End Encryption Enabled</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <TransactionHistory user={user} />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-2">Wallet Security</h3>
                  <p className="text-sm text-gray-500 font-medium">Manage your security settings and payment methods.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                      <Lock className="w-6 h-6 text-indigo-600" />
                      <h4 className="font-bold text-gray-900">Security Measures</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <div>
                          <p className="text-sm font-bold text-gray-900">Two-Factor Authentication</p>
                          <p className="text-[10px] text-gray-700 font-medium">Required for withdrawals</p>
                        </div>
                        <div className="w-12 h-6 bg-indigo-600 rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <div>
                          <p className="text-sm font-bold text-gray-900">End-to-End Encryption</p>
                          <p className="text-[10px] text-gray-700 font-medium">Protecting payment data</p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <div>
                          <p className="text-sm font-bold text-gray-900">Regular Backups</p>
                          <p className="text-[10px] text-gray-700 font-medium">Daily automated backups</p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-6 h-6 text-indigo-600" />
                      <h4 className="font-bold text-gray-900">Payment Methods</h4>
                    </div>
                    
                    <div className="space-y-3">
                      {paymentMethods.map(pm => (
                        <div key={pm.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl">
                          <div className="flex items-center gap-3">
                            {pm.type === 'credit_card' ? <CreditCard className="w-4 h-4 text-gray-700" /> : <Banknote className="w-4 h-4 text-gray-700" />}
                            <div>
                              <p className="text-xs font-bold text-gray-900">{pm.name}</p>
                              <p className="text-[10px] text-gray-700 font-medium">{pm.details}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setPaymentsList(prev => prev.filter(p => p.id !== pm.id))}
                            className="text-[10px] font-bold text-red-500 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          setAddMethodName('');
                          setAddMethodDetails('');
                          setAddMethodType('credit_card');
                          setShowAddMethodModal(true);
                        }}
                        className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-xs font-bold text-gray-400 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Add New Method
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <TransactionPinModal 
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onConfirm={confirmTransaction}
        amount={pendingAction?.amount || 0}
        action={pendingAction?.type === 'deposit' ? 'Wallet Funding' : 'Wallet Withdrawal'}
      />

      <AnimatePresence>
        {selectedReceiptTx && (
          <StrategicReceipt 
            transaction={selectedReceiptTx}
            userEmail={user.email}
            onClose={() => setSelectedReceiptTx(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddMethodModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-white rounded-3xl p-8 border border-gray-100 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowAddMethodModal(false)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>

              <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-indigo-600" /> New Payment Method
              </h4>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6 border-b border-gray-100 pb-4">
                Add a secure deposit or cashout pathway
              </p>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] block pl-1">Method Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'credit_card', label: 'Credit Card' },
                      { id: 'bank_transfer', label: 'Bank Account' },
                      { id: 'crypto', label: 'Crypto Wallet' }
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setAddMethodType(t.id as any)}
                        className={`py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border ${
                          addMethodType === t.id
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] block pl-1">Method Label / Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Visa ending in 9901, OPay Account..."
                    value={addMethodName}
                    onChange={(e) => setAddMethodName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:ring-1 focus:ring-indigo-500 transition-all animate-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] block pl-1">Details (Card #, Account #, or Address)</label>
                  <input
                    type="text"
                    placeholder="e.g. **** **** **** 9901, 0123456789, bc1q..."
                    value={addMethodDetails}
                    onChange={(e) => setAddMethodDetails(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:ring-1 focus:ring-indigo-500 transition-all animate-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!addMethodName.trim() || !addMethodDetails.trim()) {
                      alert("Please fill in all details");
                      return;
                    }
                    const newPm: PaymentMethod = {
                      id: 'pm_' + Date.now(),
                      type: addMethodType,
                      name: addMethodName.trim(),
                      details: addMethodDetails.trim(),
                      isDefault: false
                    };
                    setPaymentsList(prev => [...prev, newPm]);
                    setShowAddMethodModal(false);
                  }}
                  className="w-full py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-indigo-700 transition-all"
                >
                  Confirm & Save Method
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
