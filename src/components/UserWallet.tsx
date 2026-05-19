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
  Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Transaction, PaymentMethod } from '../types';
import { SecurityGuard, TransactionPinModal } from './SecurityGuard';
import { StrategicReceipt } from './StrategicReceipt';

import { TransactionHistory } from './TransactionHistory';
import { TransactionService } from '../services/TransactionService';

interface UserWalletProps {
  user: UserProfile;
  onUpdateBalance: (amount: number, type: 'deposit' | 'withdrawal') => Promise<void>;
  // onAddTransaction is no longer needed here as we use TransactionService
}

export const UserWallet: React.FC<UserWalletProps> = ({ user, onUpdateBalance }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw' | 'history' | 'settings'>('overview');
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notifications, setNotifications] = useState<{id: string, message: string, type: 'info' | 'warning'}[]>([]);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{type: 'deposit' | 'withdraw', amount: number} | null>(null);
  const [accountDetails, setAccountDetails] = useState({
    accountNumber: '',
    bankName: '',
    accountName: '',
    routingNumber: ''
  });
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);
  const [bankSearch, setBankSearch] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const nigerianBanks = [
    // ... same banks
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
    { code: '057', name: 'Zenith Bank' },
    { code: '030', name: 'Heritage Bank' },
    { code: '082', name: 'Keystone Bank' },
    { code: '076', name: 'Polaris Bank' },
    { code: '221', name: 'Stanbic IBTC Bank' },
    { code: '068', name: 'Standard Chartered Bank' },
    { code: '232', name: 'Sterling Bank' },
    { code: '100', name: 'SunTrust Bank' },
    { code: '301', name: 'Jaiz Bank' },
    { code: '090267', name: 'Kuda Bank' },
    { code: '999992', name: 'OPay Digital Services' },
    { code: '50515', name: 'Moniepoint MFB' },
  ].sort((a, b) => a.name.localeCompare(b.name));

  const filteredBanks = nigerianBanks.filter(b => 
    b.name.toLowerCase().includes(bankSearch.toLowerCase()) || 
    b.code.includes(bankSearch)
  );
  const paymentMethods: PaymentMethod[] = [
    { id: 'pm1', type: 'credit_card', name: 'Visa ending in 4242', details: '**** **** **** 4242', isDefault: true },
    { id: 'pm2', type: 'bank_transfer', name: 'GTBank Account', details: '0123456789', isDefault: false },
    { id: 'pm3', type: 'crypto', name: 'Bitcoin Wallet', details: 'bc1qxy2kg...z7v', isDefault: false },
  ];

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
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    setPendingAction({ type: 'deposit', amount: Number(amount) });
    setShowPinModal(true);
  };

  const handleWithdraw = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    const withdrawAmount = Number(amount);
    if (withdrawAmount > user.cashOutWallet) {
      setNotifications(prev => [...prev, { 
        id: Date.now().toString(), 
        message: 'Insufficient funds in Cash Out Wallet', 
        type: 'warning' 
      }]);
      return;
    }
    setPendingAction({ type: 'withdraw', amount: withdrawAmount });
    setShowPinModal(true);
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
        await onUpdateBalance(actionAmount, 'deposit');
        txId = await TransactionService.recordTransaction({
          userId: user.uid,
          type: 'deposit',
          amount: actionAmount,
          currency: 'USD',
          status: 'completed',
          method: selectedMethod || 'Direct Deposit',
          hub: 'WALLET',
          purpose: 'Wallet Top-up',
          reference,
          description: 'Wallet Deposit'
        });
      } else {
        await onUpdateBalance(actionAmount, 'withdrawal');
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
          description: 'Withdrawal Request'
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

          <div className="mt-auto pt-6 border-t border-gray-200">
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
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-8 overflow-y-auto no-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-[2rem] text-white shadow-xl">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Total Balance</p>
                    <h3 className="text-3xl font-black mb-4">₦{(user.depositWallet + user.playerWallet + user.cashOutWallet + (user.miningWallet || 0) * 0.01).toLocaleString()}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold bg-white/10 w-fit px-2 py-1 rounded-full">
                      <Shield className="w-3 h-3" /> Verified Account
                    </div>
                  </div>
                  <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm">
                    <p className="text-xs font-black text-gray-950 uppercase tracking-widest mb-1">Deposit Wallet</p>
                    <h3 className="text-2xl font-black text-gray-950">₦{user.depositWallet.toLocaleString()}</h3>
                    <p className="text-[10px] text-gray-950 font-bold mt-2">Ready for transfer</p>
                  </div>
                  <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Cash Out Wallet</p>
                    <h3 className="text-2xl font-black text-gray-900">₦{user.cashOutWallet.toLocaleString()}</h3>
                    <p className="text-[10px] text-emerald-700 font-bold mt-2">Available for withdrawal</p>
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
                <div className="text-center">
                  <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-2 italic">FUND YOUR ACCOUNT</h3>
                  <p className="text-sm text-gray-950 font-black uppercase tracking-widest">Global & Local Strategic Alliances</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -translate-y-12 translate-x-12" />
                      
                      <label className="block text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">1. TYPE AMOUNT TO DEPOSIT ($)</label>
                      <div className="relative mb-6">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-4xl font-black text-white/20 select-none">$</span>
                        <input 
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="Type Amount Here..."
                          className="w-full pl-8 pr-4 bg-transparent border-b-2 border-white/10 py-4 font-display text-5xl font-black text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-white/20"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {[100, 500, 1000, 5000, 10000, 50000].map(val => (
                          <button 
                            key={val}
                            onClick={() => setAmount(val.toString())}
                            className="py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black tracking-widest transition-all border border-white/5"
                          >
                            +${val.toLocaleString()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-[10px] font-black text-gray-700 uppercase tracking-widest mb-2">Tactical USSD Command</label>
                      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 relative group">
                        <div className="flex items-center justify-between mb-4">
                          <Smartphone className="w-5 h-5 text-rose-500" />
                          <SearchCode className="w-5 h-5 text-indigo-500 opacity-50" />
                        </div>
                        <p className="text-[10px] text-slate-950 font-black mb-3 uppercase">Generated EFADO Code:</p>
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between group-hover:border-rose-500/50 transition-all">
                          <code className="text-rose-400 font-mono font-black text-lg">
                            *555*88*EFADO*{user.uid.slice(0,5).toUpperCase()}*{amount || '0'}#
                          </code>
                          <button className="p-2 text-slate-400 hover:text-white transition-colors">
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="mt-4 text-[9px] text-slate-400 font-medium">Automatic verification enabled. Your account will be credited instantly upon successful USSD execution.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="block text-[11px] font-black text-gray-900 uppercase tracking-widest mb-2">2. CHOOSE SOURCE BANK (FOR TRANSFER)</label>
                      
                      {/* Searchable Bank Selector */}
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
                              className="absolute z-50 left-0 right-0 top-[110%] bg-white border-2 border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-2"
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
                                  <span className="text-[9px] font-mono font-black border border-current/20 px-1.5 rounded">{bank.code}</span>
                                </button>
                              )) : (
                                <div className="p-4 text-center">
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Bank Not Listed? Type it above.</p>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="relative">
                        <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-950" />
                        <input 
                          placeholder="Your 10-Digit Account Number"
                          maxLength={10}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-950"
                          value={accountDetails.accountNumber}
                          onChange={e => setAccountDetails({...accountDetails, accountNumber: e.target.value})}
                        />
                      </div>

                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-950 pointer-events-none" />
                        <input 
                          placeholder="Your Account Name"
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-950"
                          value={accountDetails.accountName}
                          onChange={e => setAccountDetails({...accountDetails, accountName: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-[10px] font-black text-gray-700 uppercase tracking-widest mb-4">Strategic Payment Hub</label>
                      <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
                        {paymentCategories.map((cat) => (
                          <div 
                            key={cat.id}
                            className="bg-gray-50/50 border border-gray-100 rounded-[2.5rem] p-6 hover:border-indigo-100 hover:bg-white transition-all group"
                          >
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                {cat.icon}
                              </div>
                              <div>
                                <h4 className="text-[11px] font-black text-gray-950 uppercase tracking-[0.2em]">{cat.title}</h4>
                                <p className="text-[9px] text-gray-950 font-black uppercase tracking-widest">Tactical Protocol</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {cat.options.map(opt => (
                                <button
                                  key={opt.id}
                                  onClick={() => setSelectedMethod(opt.name)}
                                  className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                                    selectedMethod === opt.name
                                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-200'
                                      : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                                  }`}
                                >
                                  {opt.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={handleDeposit}
                        disabled={isProcessing || !amount || parseFloat(amount) <= 0}
                        className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-indigo-300/50 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 mt-6"
                      >
                        {isProcessing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Synchronizing...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-5 h-5" />
                            Initialize Strategic Deposit
                          </>
                        )}
                      </button>
                    </div>
                  </div>
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
                <div className="text-center">
                  <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-2 italic">STRATEGIC CASH OUT</h3>
                  <p className="text-sm text-gray-950 font-black uppercase tracking-widest">Vault Allocation Terminal</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-emerald-600 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -translate-y-12 translate-x-12" />
                      
                      <p className="text-[10px] font-black text-emerald-100 uppercase tracking-[0.3em] mb-4">Total Liquid Assets</p>
                      <h4 className="text-5xl font-black mb-8 font-display italic tracking-tighter">${user.cashOutWallet.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                      
                      <label className="block text-[11px] font-black text-emerald-100 uppercase tracking-widest mb-2">TYPE WITHDRAWAL AMOUNT ($)</label>
                      <div className="relative mb-6">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-4xl font-black text-white/20 select-none">$</span>
                        <input 
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="Type Amount Here..."
                          className="w-full pl-8 pr-4 bg-transparent border-b-2 border-white/20 py-4 font-display text-4xl font-black text-white focus:outline-none focus:border-white transition-all placeholder:text-white/20 outline-none"
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        {[0.25, 0.5, 0.75, 1].map(percent => (
                          <button 
                            key={percent}
                            onClick={() => setAmount((user.cashOutWallet * percent).toString())}
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
                      <label className="block text-[11px] font-black text-gray-900 uppercase tracking-widest mb-2">2. SELECT DESTINATION BANK</label>
                      
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
                              {filteredBanks.map(bank => (
                                <button
                                  key={bank.code}
                                  onClick={() => {
                                    setAccountDetails({...accountDetails, bankName: bank.name});
                                    setBankSearch(bank.name);
                                    setShowBankDropdown(false);
                                  }}
                                  className="w-full text-left p-3.5 hover:bg-emerald-600 hover:text-white rounded-xl transition-all flex items-center justify-between group"
                                >
                                  <span className="text-[10px] font-black uppercase tracking-widest">{bank.name}</span>
                                  <span className="text-[9px] font-mono font-black border border-current/20 px-1.5 rounded">{bank.code}</span>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="relative">
                        <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-950" />
                        <input 
                          placeholder="10-Digit Account Number"
                          maxLength={10}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-950"
                          value={accountDetails.accountNumber}
                          onChange={e => setAccountDetails({...accountDetails, accountNumber: e.target.value})}
                        />
                      </div>

                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-950 pointer-events-none" />
                        <input 
                          placeholder="Account Holder Name"
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-950"
                          value={accountDetails.accountName}
                          onChange={e => setAccountDetails({...accountDetails, accountName: e.target.value})}
                        />
                      </div>
                    </div>

                    <button 
                      onClick={handleWithdraw}
                      disabled={isProcessing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > user.cashOutWallet}
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
                          <button className="text-[10px] font-bold text-red-500 hover:underline">Remove</button>
                        </div>
                      ))}
                      <button className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-xs font-bold text-gray-400 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
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
    </div>
  );
};
