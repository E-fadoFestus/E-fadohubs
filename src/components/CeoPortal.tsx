import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Users, 
  Wallet, 
  Megaphone, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp, 
  DollarSign,
  Zap,
  Coins,
  CreditCard,
  X,
  Plus,
  Trash2,
  AlertCircle,
  HardHat,
  HandCoins,
  Briefcase,
  FileText,
  ShieldAlert,
  Globe,
  Brain,
  Mail,
  MessageSquare,
  FileSearch,
  BarChart3,
  Trophy,
  Handshake,
  Building2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar
} from 'recharts';
import { 
  db, 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit,
  runTransaction
} from '../firebase';
import { UserProfile, AdminStats, Announcement, WithdrawalRequest, Transaction, ServiceProvider, ServiceRequest, CSCCGroup, Loan, LoanApplication, LoanVendor, DomainSeller, DomainOrder, QuizSession, EmailAccount } from '../types';

import { Efado3DLogo } from './Efado3DLogo';
import { StrategicReceipt } from './StrategicReceipt';
import { PatronageTracker } from './PatronageTracker';

interface CeoPortalProps {
  onClose: () => void;
  adminStats: AdminStats | null;
}

export const CeoPortal: React.FC<CeoPortalProps> = ({ onClose, adminStats }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'players' | 'transactions' | 'withdrawals' | 'hubs' | 'monetization' | 'announcements' | 'settings'>('dashboard');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPatronageTracker, setShowPatronageTracker] = useState(false);
  const [loginForm, setLoginForm] = useState({
    username: '',
    email: '',
    phone: '',
    password: ''
  });
  const [loginError, setLoginError] = useState('');

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Hub Monitoring State
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [csccGroups, setCsccGroups] = useState<CSCCGroup[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanApplications, setLoanApplications] = useState<LoanApplication[]>([]);
  const [loanVendors, setLoanVendors] = useState<LoanVendor[]>([]);
  const [domainSellers, setDomainSellers] = useState<DomainSeller[]>([]);
  const [domainOrders, setDomainOrders] = useState<DomainOrder[]>([]);
  const [quizSessions, setQuizSessions] = useState<QuizSession[]>([]);
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  
  const [systemSettings, setSystemSettings] = useState({
    minWithdrawal: 50,
    maintenanceMode: false,
    spinWinRate: 0.15,
    maxLoanAmount: 5000
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [creditType, setCreditType] = useState<'playerWallet' | 'cashOutWallet'>('playerWallet');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);

  const handleCeoLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      loginForm.username === 'EFADO' &&
      loginForm.email === 'efadofestus@gmail.com' &&
      loginForm.phone === '08072456836' &&
      loginForm.password === 'pppooolll55555'
    ) {
      setIsUnlocked(true);
      setLoginError('');
    } else {
      setLoginError('Invalid CEO Credentials. Access Denied.');
    }
  };

  useEffect(() => {
    if (!isUnlocked) return;
    
    // Fetch Users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => doc.data() as UserProfile));
    });

    // Fetch Withdrawals
    const unsubWithdrawals = onSnapshot(query(collection(db, 'withdrawals'), orderBy('timestamp', 'desc')), (snapshot) => {
      setWithdrawals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawalRequest)));
    });

    // Fetch Announcements
    const unsubAnnouncements = onSnapshot(query(collection(db, 'announcements'), orderBy('timestamp', 'desc')), (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement)));
    });

    // Hub Monitoring Subscriptions
    const unsubProviders = onSnapshot(collection(db, 'service_providers'), (snap) => {
      setServiceProviders(snap.docs.map(d => ({ id: d.id, ...d.data() } as ServiceProvider)));
    });

    // Fetch System Settings
    const unsubSettings = onSnapshot(doc(db, 'adminStats', 'settings'), (snap) => {
      if (snap.exists()) {
        setSystemSettings(snap.data() as any);
      } else {
        // Init settings if they don't exist
        setDoc(doc(db, 'adminStats', 'settings'), {
          minWithdrawal: 50,
          maintenanceMode: false,
          spinWinRate: 0.15,
          maxLoanAmount: 5000
        });
      }
    });

    const unsubRequests = onSnapshot(collection(db, 'service_requests'), (snap) => {
      setServiceRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as ServiceRequest)));
    });
    const unsubCSCC = onSnapshot(collection(db, 'cscc_groups'), (snap) => {
      setCsccGroups(snap.docs.map(d => ({ id: d.id, ...d.data() } as CSCCGroup)));
    });
    const unsubLoans = onSnapshot(collection(db, 'loans'), (snap) => {
      setLoans(snap.docs.map(d => ({ id: d.id, ...d.data() } as Loan)));
    });
    const unsubLoanApps = onSnapshot(collection(db, 'loan_applications'), (snap) => {
      setLoanApplications(snap.docs.map(d => ({ id: d.id, ...d.data() } as LoanApplication)));
    });
    const unsubLoanVendors = onSnapshot(collection(db, 'loan_vendors'), (snap) => {
      setLoanVendors(snap.docs.map(d => ({ id: d.id, ...d.data() } as LoanVendor)));
    });
    const unsubDomainSellers = onSnapshot(collection(db, 'domain_sellers'), (snap) => {
      setDomainSellers(snap.docs.map(d => ({ id: d.id, ...d.data() } as DomainSeller)));
    });
    const unsubDomainOrders = onSnapshot(collection(db, 'domain_orders'), (snap) => {
      setDomainOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as DomainOrder)));
    });
    const unsubQuizSessions = onSnapshot(collection(db, 'quiz_sessions'), (snap) => {
      setQuizSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as QuizSession)));
    });
    const unsubEmailAccounts = onSnapshot(collection(db, 'email_accounts'), (snap) => {
      setEmailAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() } as EmailAccount)));
    });

    const unsubLogs = onSnapshot(query(collection(db, 'admin_logs'), orderBy('timestamp', 'desc'), limit(50)), (snap) => {
      setAdminLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Fetch All Transactions
    const unsubTransactions = onSnapshot(query(collection(db, 'transactions'), orderBy('timestamp', 'desc'), limit(100)), (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    });

    // Fetch Hub Content
    const unsubPosts = onSnapshot(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50)), (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubAds = onSnapshot(collection(db, 'ads'), (snap) => {
      setAds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubUsers();
      unsubWithdrawals();
      unsubAnnouncements();
      unsubTransactions();
      unsubProviders();
      unsubSettings();
      unsubRequests();
      unsubCSCC();
      unsubLoans();
      unsubLoanApps();
      unsubLoanVendors();
      unsubDomainSellers();
      unsubDomainOrders();
      unsubQuizSessions();
      unsubEmailAccounts();
      unsubLogs();
      unsubPosts();
      unsubAds();
    };
  }, []);

  const handleCreditUser = async (user: UserProfile) => {
    if (creditAmount <= 0) return;
    setIsProcessing(true);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        const txRef = doc(collection(db, 'transactions'));
        const adminRef = doc(db, 'adminStats', 'global');
        
        const adminSnap = await transaction.get(adminRef);
        const adminData = adminSnap.data() as AdminStats;

        transaction.update(userRef, {
          [creditType]: (user as any)[creditType] + creditAmount
        });

        transaction.update(adminRef, {
          adminWallet: adminData.adminWallet - creditAmount,
          lastUpdated: serverTimestamp()
        });

        transaction.set(txRef, {
          userId: user.uid,
          type: creditType === 'playerWallet' ? 'deposit' : 'game_win',
          amount: creditAmount,
          status: 'completed',
          timestamp: serverTimestamp(),
          adminNote: 'CEO Credit'
        });

        // Audit Log
        const logRef = doc(collection(db, 'admin_logs'));
        transaction.set(logRef, {
          action: 'CREDIT_USER',
          targetUser: user.email,
          amount: creditAmount,
          walletType: creditType,
          timestamp: serverTimestamp(),
          admin: 'CEO' // In a multi-admin system, this would be request.auth.email
        });
      });
      setCreditAmount(0);
      setSelectedUser(null);
    } catch (e) {
      console.error("Error crediting user:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessWithdrawal = async (withdrawal: WithdrawalRequest, status: 'completed' | 'failed') => {
    setIsProcessing(true);
    try {
      await runTransaction(db, async (transaction) => {
        const withdrawalRef = doc(db, 'withdrawals', withdrawal.id!);
        const userRef = doc(db, 'users', withdrawal.userId);
        const adminRef = doc(db, 'adminStats', 'global');
        
        // READS FIRST
        const adminSnap = await transaction.get(adminRef);
        const userSnap = await transaction.get(userRef);
        
        const adminData = adminSnap.data() as AdminStats;
        const userData = userSnap.data() as UserProfile;

        // WRITES AFTER
        transaction.update(withdrawalRef, { status });

        if (status === 'completed') {
          transaction.update(adminRef, {
            adminWallet: adminData.adminWallet - withdrawal.amount,
            pendingPayouts: Math.max(0, adminData.pendingPayouts - withdrawal.amount),
            lastUpdated: serverTimestamp()
          });
        } else if (status === 'failed') {
          // Refund the user if withdrawal failed
          transaction.update(userRef, {
            cashOutWallet: userData.cashOutWallet + withdrawal.amount
          });
          
          transaction.update(adminRef, {
            pendingPayouts: Math.max(0, adminData.pendingPayouts - withdrawal.amount),
            lastUpdated: serverTimestamp()
          });
        }
      });
    } catch (e) {
      console.error("Error processing withdrawal:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePostAnnouncement = async () => {
    if (!newAnnouncement.trim()) return;
    try {
      await addDoc(collection(db, 'announcements'), {
        message: newAnnouncement,
        timestamp: serverTimestamp(),
        active: true
      });
      setNewAnnouncement('');
    } catch (e) {
      console.error("Error posting announcement:", e);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    // In a real app, we'd delete or deactivate
    try {
      await updateDoc(doc(db, 'announcements', id), { active: false });
    } catch (e) {
      console.error("Error deleting announcement:", e);
    }
  };

  const handleUpdateSettings = async (field: string, value: any) => {
    try {
      await updateDoc(doc(db, 'adminStats', 'settings'), {
        [field]: value
      });
    } catch (e) {
      console.error("Error updating settings:", e);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.uid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence mode="wait">
      {!isUnlocked ? (
        <motion.div 
          key="ceo-login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/98 backdrop-blur-3xl overflow-hidden"
        >
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
            
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-10">
              <Efado3DLogo size="lg" className="mb-6" />
              <h2 className="text-3xl font-extrabold text-white tracking-tight font-display">Ceo Login</h2>
              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Access Master Control</p>
            </div>

            <form onSubmit={handleCeoLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
                <div className="relative">
                  <input 
                    type="text"
                    required
                    value={loginForm.username}
                    onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                    className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-indigo-500 focus:bg-slate-800 outline-none transition-all placeholder:text-slate-600 font-bold"
                    placeholder="EFADO"
                  />
                  <Users className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <input 
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                    className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-indigo-500 focus:bg-slate-800 outline-none transition-all placeholder:text-slate-600 font-bold"
                    placeholder="efadofestus@gmail.com"
                  />
                  <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                <div className="relative">
                  <input 
                    type="tel"
                    required
                    value={loginForm.phone}
                    onChange={e => setLoginForm({...loginForm, phone: e.target.value})}
                    className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-indigo-500 focus:bg-slate-800 outline-none transition-all placeholder:text-slate-600 font-bold"
                    placeholder="08072456836"
                  />
                  <HandCoins className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Secret Password</label>
                <div className="relative">
                  <input 
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                    className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-indigo-500 focus:bg-slate-800 outline-none transition-all placeholder:text-slate-600 font-bold"
                    placeholder="••••••••••••"
                  />
                  <ShieldAlert className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                </div>
              </div>
              
              {loginError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-black flex items-center gap-3"
                >
                  <XCircle className="w-5 h-5 flex-shrink-0" />
                  {loginError}
                </motion.div>
              )}

              <button 
                type="submit"
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl shadow-indigo-500/20 mt-4 active:scale-95"
              >
                Verify Credentials
              </button>
            </form>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          key="ceo-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl overflow-hidden"
        >
          <div className="relative w-full max-w-7xl h-[90vh] bg-slate-900 border border-white/10 rounded-[3rem] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl z-20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-extrabold text-white tracking-tight">Ceo Portal</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Master Control Center</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

        {/* Navigation Tabs */}
        <div className="flex px-8 border-b border-white/5 bg-slate-900/30 overflow-x-auto no-scrollbar">
          {[
            { id: 'dashboard', icon: TrendingUp, label: 'Dashboard' },
            { id: 'analytics', icon: FileText, label: 'Analytics' },
            { id: 'players', icon: Users, label: 'Players' },
            { id: 'transactions', icon: CreditCard, label: 'Transactions' },
            { id: 'withdrawals', icon: ArrowUpRight, label: 'Withdrawals' },
            { id: 'hubs', icon: Zap, label: 'Hubs' },
            { id: 'monetization', icon: Coins, label: 'Monetization' },
            { id: 'announcements', icon: Megaphone, label: 'Broadcast' },
            { id: 'settings', icon: ShieldCheck, label: 'System' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
                activeTab === tab.id ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-t-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-grow overflow-y-auto p-8 bg-slate-950/20">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-slate-800/50 p-6 rounded-3xl border border-white/5 shadow-xl golden-card-border">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-indigo-500/20 rounded-lg">
                        <Wallet className="w-5 h-5 text-indigo-400" />
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Admin Wallet</span>
                    </div>
                    <p className="text-3xl font-black text-white font-display">${adminStats?.adminWallet.toLocaleString() || '0.00'}</p>
                  </div>
                  <div className="bg-slate-800/50 p-6 rounded-3xl border border-white/5 shadow-xl golden-card-border">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total House Gain</span>
                    </div>
                    <p className="text-3xl font-black text-white font-display">${adminStats?.totalHouseGain.toLocaleString() || '0.00'}</p>
                  </div>
                  <div className="bg-slate-800/50 p-6 rounded-3xl border border-white/5 shadow-xl golden-card-border">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-amber-500/20 rounded-lg">
                        <Users className="w-5 h-5 text-amber-400" />
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Players</span>
                    </div>
                    <p className="text-3xl font-black text-white font-display">{users.length}</p>
                  </div>
                  <div className="bg-slate-800/50 p-6 rounded-3xl border border-white/5 shadow-xl golden-card-border">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-rose-500/20 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-rose-400" />
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Payouts</span>
                    </div>
                    <p className="text-3xl font-black text-white font-display">{withdrawals.filter(w => w.status === 'pending').length}</p>
                  </div>
                </div>

                {/* Tactical Investment Control */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400 border border-white/10">
                          <BarChart3 className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Investment Strategy Terminal</h3>
                          <p className="text-indigo-200/60 text-xs font-bold uppercase tracking-widest mt-1">Analyze patronage & allocate strategic awards</p>
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm mb-8 max-w-xl leading-relaxed">
                        Identify high-density hub patronage across Nigeria, USA, and global regions. Track active loyalty metrics to deploy awards and optimize investment distribution.
                      </p>
                      <button 
                        onClick={() => setShowPatronageTracker(true)}
                        className="px-8 py-5 bg-white text-slate-900 rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all"
                      >
                        <Globe className="w-5 h-5" />
                        Launch Patronage Tracker Hub
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5 flex flex-col justify-center items-center text-center">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/20">
                      <Trophy className="w-10 h-10" />
                    </div>
                    <h4 className="text-xl font-black text-white uppercase mb-2 tracking-tight">Daily Top Hub</h4>
                    <p className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-4">Gist Hub & Loans</p>
                    <div className="w-full bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                       <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Growth Index</p>
                       <p className="text-2xl font-black text-white">+24.5%</p>
                    </div>
                  </div>
                </div>

                {/* Game Wallets */}
                <div className="bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5 golden-card-border">
                  <h3 className="text-xl font-extrabold text-white mb-6 flex items-center gap-3">
                    <Zap className="w-6 h-6 text-yellow-400" />
                    Individual Game Wallets
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <div className="flex items-center gap-3 mb-4">
                        <Coins className="w-5 h-5 text-indigo-400" />
                        <span className="text-sm font-bold text-slate-400">Lucky Spin Arena</span>
                      </div>
                      <p className="text-2xl font-black text-white font-display">${adminStats?.gameWallets?.spinGame.toLocaleString() || '0.00'}</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <div className="flex items-center gap-3 mb-4">
                        <CreditCard className="w-5 h-5 text-orange-400" />
                        <span className="text-sm font-bold text-slate-400">EFADO Money Card</span>
                      </div>
                      <p className="text-2xl font-black text-white font-display">${adminStats?.gameWallets?.moneyCard.toLocaleString() || '0.00'}</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <div className="flex items-center gap-3 mb-4">
                        <Zap className="w-5 h-5 text-blue-400" />
                        <span className="text-sm font-bold text-slate-400">Digital Money Trading</span>
                      </div>
                      <p className="text-2xl font-black text-white font-display">${adminStats?.gameWallets?.tradingGame.toLocaleString() || '0.00'}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div 
                key="analytics"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* User Growth Chart */}
                  <div className="bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5">
                    <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight flex items-center gap-3">
                      <Users className="w-5 h-5 text-indigo-400" />
                      User Acquisition (Last 7 Days)
                    </h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                          { name: 'Mon', users: users.length * 0.4 },
                          { name: 'Tue', users: users.length * 0.5 },
                          { name: 'Wed', users: users.length * 0.6 },
                          { name: 'Thu', users: users.length * 0.7 },
                          { name: 'Fri', users: users.length * 0.8 },
                          { name: 'Sat', users: users.length * 0.9 },
                          { name: 'Sun', users: users.length }
                        ]}>
                          <defs>
                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '1rem' }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Transaction Volume */}
                  <div className="bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5">
                    <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                      Transaction Volume (₦/$)
                    </h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Standard', volume: quizSessions.reduce((a, s) => a + s.stake, 0) },
                          { name: 'Elite', volume: quizSessions.reduce((a, s) => a + s.stake, 0) * 1.5 },
                          { name: 'Loan', volume: loans.reduce((a, l) => a + l.amount, 0) },
                          { name: 'Market', volume: domainOrders.reduce((a, o) => a + o.amountCharged, 0) * 10 }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '1rem' }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Bar dataKey="volume" fill="#10b981" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                  <div className="bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5">
                    <h3 className="text-xl font-extrabold text-white mb-8 tracking-tight">Hub Performance Distribution</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { label: 'Loan Apps', value: loanApplications.length, color: 'text-emerald-400' },
                      { label: 'Domain Sales', value: domainOrders.length, color: 'text-indigo-400' },
                      { label: 'Service Jobs', value: serviceRequests.length, color: 'text-orange-400' },
                      { label: 'Quiz Games', value: quizSessions.length, color: 'text-purple-400' }
                    ].map((item, i) => (
                      <div key={i} className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 text-center">
                        <p className="text-4xl font-black mb-2 text-white">{item.value}</p>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${item.color}`}>{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'players' && (
              <motion.div 
                key="players"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="text"
                    placeholder="Search by email or UID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="bg-slate-800/30 rounded-3xl border border-white/5 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-800/50 border-b border-white/5">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Player</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Wallets</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredUsers.map((user) => (
                        <tr key={user.uid} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-white">{user.email}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{user.uid}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-4">
                              <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-slate-500 uppercase">Player</span>
                                <span className="text-xs font-bold text-indigo-400">${user.playerWallet.toLocaleString()}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-slate-500 uppercase">Cash Out</span>
                                <span className="text-xs font-bold text-emerald-400">${user.cashOutWallet.toLocaleString()}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                              user.role === 'admin' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700/50 text-slate-400'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => setSelectedUser(user)}
                              className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition-all shadow-lg shadow-indigo-500/20"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'transactions' && (
              <motion.div 
                key="transactions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-indigo-400" />
                    Strategic Transaction Command
                  </h3>
                  <div className="flex gap-4">
                    <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Inflow Volume</p>
                      <p className="text-lg font-black text-white">${transactions.filter(t => t.type === 'deposit').reduce((a, t) => a + t.amount, 0).toLocaleString()}</p>
                    </div>
                    <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                      <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Outflow Volume</p>
                      <p className="text-lg font-black text-white">${transactions.filter(t => t.type === 'withdrawal').reduce((a, t) => a + t.amount, 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/30 rounded-3xl border border-white/5 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-800/50 border-b border-white/5">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Transaction ID</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Entity</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Operation</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Value</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Temporal Log</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Integrity</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Audit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-mono text-slate-500">{tx.id || 'INTERNAL'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-white">{users.find(u => u.uid === tx.userId)?.email || 'Unknown Entity'}</span>
                              <span className="text-[10px] text-slate-500 font-mono italic">{tx.userId}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-400' :
                              tx.type === 'withdrawal' ? 'bg-rose-500/10 text-rose-400' :
                              tx.type === 'game_win' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-700/50 text-slate-400'
                            }`}>
                              {tx.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-sm font-black font-display ${tx.type === 'deposit' || tx.type === 'game_win' ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {tx.type === 'deposit' || tx.type === 'game_win' ? '+' : '-'}${tx.amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-bold text-slate-500">{tx.timestamp?.toDate().toLocaleString() || 'PROCESSING'}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 text-right">
                              {tx.status === 'completed' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : tx.status === 'pending' ? (
                                <Clock className="w-4 h-4 text-amber-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-500" />
                              )}
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{tx.status}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => setSelectedReceiptTx(tx)}
                              className="p-2 text-indigo-400 hover:bg-white/5 rounded-xl transition-all"
                            >
                              <FileSearch className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'withdrawals' && (
              <motion.div 
                key="withdrawals"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 gap-4">
                  {withdrawals.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 italic">No withdrawal requests found.</div>
                  ) : (
                    withdrawals.map((w) => (
                      <div key={w.id} className="bg-slate-800/50 p-6 rounded-3xl border border-white/5 flex items-center justify-between shadow-xl">
                        <div className="flex items-center gap-6">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                            w.status === 'pending' ? 'bg-amber-500/20 text-amber-500' : 
                            w.status === 'completed' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'
                          }`}>
                            {w.status === 'pending' ? <Clock className="w-6 h-6" /> : 
                             w.status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-black text-white font-display">${w.amount.toLocaleString()}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                                w.status === 'pending' ? 'bg-amber-500/20 text-amber-500' : 
                                w.status === 'completed' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'
                              }`}>
                                {w.status}
                              </span>
                            </div>
                            <p className="text-sm text-slate-400 font-bold">{w.userEmail}</p>
                            <p className="text-[10px] text-slate-600 font-mono mt-1">ID: {w.id}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {w.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleProcessWithdrawal(w, 'completed')}
                                disabled={isProcessing}
                                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                              >
                                Pay Player
                              </button>
                              <button 
                                onClick={() => handleProcessWithdrawal(w, 'failed')}
                                disabled={isProcessing}
                                className="px-6 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-500 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border border-rose-500/20"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'monetization' && (
              <motion.div 
                key="monetization"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-indigo-900/40 p-8 rounded-[2.5rem] border border-indigo-500/20 shadow-2xl">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-indigo-500/20 rounded-2xl">
                           <Coins className="w-8 h-8 text-indigo-400" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Total Creator Payouts</p>
                           <h4 className="text-3xl font-black text-white italic">
                             ${users.reduce((acc, u) => acc + (u.creatorEarnings?.totalTips || 0), 0).toLocaleString()}
                           </h4>
                        </div>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                         <div className="h-full bg-indigo-500 w-[65%]" />
                      </div>
                   </div>

                   <div className="bg-emerald-900/40 p-8 rounded-[2.5rem] border border-emerald-500/20 shadow-2xl">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-emerald-500/20 rounded-2xl">
                           <Globe className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Global Partner Links</p>
                           <h4 className="text-3xl font-black text-white italic">
                             {users.filter(u => (u.creatorEarnings?.totalTips || 0) > 100).length} Actives
                           </h4>
                        </div>
                      </div>
                      <p className="text-[10px] text-emerald-400 font-bold uppercase">+12 new this week</p>
                   </div>

                   <div className="bg-rose-900/40 p-8 rounded-[2.5rem] border border-rose-500/20 shadow-2xl">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-rose-500/20 rounded-2xl">
                           <Zap className="w-8 h-8 text-rose-400" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-rose-300 uppercase tracking-widest">Ad Revenue Pool</p>
                           <h4 className="text-3xl font-black text-white italic">
                             ${ads.reduce((acc, ad) => acc + (ad.budget || 0), 0).toLocaleString()}
                           </h4>
                        </div>
                      </div>
                      <button className="text-[10px] text-white/60 font-black uppercase tracking-widest hover:text-white transition-colors">
                        Distribute Revenue Pool →
                      </button>
                   </div>
                </div>

                <div className="bg-slate-800/30 p-10 rounded-[3rem] border border-white/5">
                   <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-8">High-Value Creator Leaderboard</h3>
                   <div className="space-y-4">
                      {users
                        .filter(u => u.creatorEarnings)
                        .sort((a,b) => (b.creatorEarnings?.totalTips || 0) - (a.creatorEarnings?.totalTips || 0))
                        .slice(0, 10)
                        .map((u, i) => (
                           <div key={u.uid} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all group">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-white">
                                    {i + 1}
                                 </div>
                                 <div>
                                    <p className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors uppercase italic">{u.email}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{u.creatorEarnings?.level || 'Rising Star'}</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-lg font-black text-emerald-400 italic">${u.creatorEarnings?.totalTips.toLocaleString()}</p>
                                 <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Points: {u.creatorEarnings?.points || 0}</p>
                              </div>
                           </div>
                        ))}
                   </div>
                </div>

                {/* Global Partners Analytics Integration */}
                <div className="bg-slate-800/30 p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-white uppercase italic mb-2 tracking-tighter">Global Affiliate & Partners Hub Monitor</h3>
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Strategic Organizational Monitoring</p>
                    </div>
                    <Handshake className="w-10 h-10 text-amber-500" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: "Verified Orgs", val: "24", icon: Building2, color: "text-blue-400" },
                      { label: "Active Marketers", val: "842", icon: Users, color: "text-emerald-400" },
                      { label: "API Sync Hooks", val: "156", icon: Globe, color: "text-purple-400" },
                      { label: "Pending Payouts", val: "$4.2K", icon: CreditCard, color: "text-rose-400" }
                    ].map((stat, i) => (
                      <div key={i} className="bg-slate-900/60 p-6 rounded-3xl border border-white/5 text-center group hover:scale-105 transition-all">
                        <stat.icon className={`w-8 h-8 mx-auto mb-4 ${stat.color}`} />
                        <p className="text-3xl font-black text-white mb-1 font-mono italic">{stat.val}</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'announcements' && (
              <motion.div 
                key="announcements"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="bg-slate-800/50 p-8 rounded-[2.5rem] border border-white/5 shadow-xl">
                  <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                    <Megaphone className="w-6 h-6 text-indigo-400" />
                    SEND NEW ANNOUNCEMENT
                  </h3>
                  <div className="flex flex-col gap-4">
                    <textarea 
                      placeholder="Type your message here..."
                      value={newAnnouncement}
                      onChange={(e) => setNewAnnouncement(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-3xl p-6 text-white focus:border-indigo-500 outline-none transition-all h-32 resize-none"
                    />
                    <button 
                      onClick={handlePostAnnouncement}
                      className="self-end px-12 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20"
                    >
                      Broadcast Message
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-4">Recent Announcements</h4>
                  {announcements.map((a) => (
                    <div key={a.id} className={`bg-slate-800/30 p-6 rounded-3xl border border-white/5 flex items-center justify-between ${!a.active ? 'opacity-50 grayscale' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                          <Megaphone className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{a.message}</p>
                          <p className="text-[10px] text-slate-500 mt-1">{a.timestamp?.toDate().toLocaleString()}</p>
                        </div>
                      </div>
                      {a.active && (
                        <button 
                          onClick={() => handleDeleteAnnouncement(a.id!)}
                          className="p-2 text-slate-500 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Financial Controls */}
                  <div className="bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5">
                    <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight flex items-center gap-3">
                      <HandCoins className="w-6 h-6 text-emerald-400" />
                      Financial Policy
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Minimum Withdrawal ($)</label>
                        <div className="flex gap-4">
                          <input 
                            type="number"
                            value={systemSettings.minWithdrawal}
                            onChange={(e) => handleUpdateSettings('minWithdrawal', Number(e.target.value))}
                            className="flex-grow bg-slate-900 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-emerald-500 outline-none transition-all font-black text-xl"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Max Loan Amount ($)</label>
                        <div className="flex gap-4">
                          <input 
                            type="number"
                            value={systemSettings.maxLoanAmount}
                            onChange={(e) => handleUpdateSettings('maxLoanAmount', Number(e.target.value))}
                            className="flex-grow bg-slate-900 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-emerald-500 outline-none transition-all font-black text-xl"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Game Algorithms */}
                  <div className="bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5">
                    <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight flex items-center gap-3">
                      <Zap className="w-6 h-6 text-indigo-400" />
                      Game Dynamics
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Spin Win Probability ({Math.round(systemSettings.spinWinRate * 100)}%)</label>
                        <input 
                          type="range"
                          min="0"
                          max="0.5"
                          step="0.01"
                          value={systemSettings.spinWinRate}
                          onChange={(e) => handleUpdateSettings('spinWinRate', Number(e.target.value))}
                          className="w-full accent-indigo-500 h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-600 uppercase">
                          <span>Hard (0%)</span>
                          <span>Medium (25%)</span>
                          <span>Easy (50%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Status */}
                <div className="bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5">
                  <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-rose-400" />
                    Danger Zone
                  </h3>
                  <div className="flex items-center justify-between p-6 bg-slate-900/50 rounded-3xl border border-white/5">
                    <div>
                      <h4 className="text-white font-black uppercase tracking-tight">Maintenance Mode</h4>
                      <p className="text-xs text-slate-500 font-bold">Locks all financial transactions across the platform</p>
                    </div>
                    <button 
                      onClick={() => handleUpdateSettings('maintenanceMode', !systemSettings.maintenanceMode)}
                      className={`relative w-16 h-8 rounded-full transition-all duration-300 ${systemSettings.maintenanceMode ? 'bg-rose-600' : 'bg-slate-700'}`}
                    >
                      <motion.div 
                        animate={{ x: systemSettings.maintenanceMode ? 32 : 4 }}
                        className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                      />
                    </button>
                  </div>
                </div>

                {/* Audit Logs */}
                <div className="bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5">
                  <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight flex items-center gap-3">
                    <FileText className="w-6 h-6 text-slate-400" />
                    Security Audit Logs
                  </h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar scroll-smooth pr-4">
                    {adminLogs.map((log) => (
                      <div key={log.id} className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex items-center justify-between text-xs hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${log.action === 'CREDIT_USER' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                          <div>
                            <span className="text-slate-500 font-bold uppercase tracking-widest">{log.admin}</span>
                            <span className="text-white font-medium ml-2">{log.action}: {log.targetUser}</span>
                            {log.amount && <span className="text-emerald-400 font-black ml-2">+${log.amount} ({log.walletType})</span>}
                          </div>
                        </div>
                        <span className="text-slate-600 font-bold">{log.timestamp?.toDate().toLocaleString()}</span>
                      </div>
                    ))}
                    {adminLogs.length === 0 && (
                      <p className="text-center py-8 text-slate-500 font-bold uppercase tracking-widest">No security events logged</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'hubs' && (
              <motion.div 
                key="hubs"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Service Corps Monitor */}
                <div className="bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5 golden-card-border">
                  <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tight">
                    <HardHat className="w-6 h-6 text-orange-400" />
                    Service Corps Monitor
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Providers</p>
                      <p className="text-3xl font-black text-white">{serviceProviders.length}</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Active Requests</p>
                      <p className="text-3xl font-black text-white">{serviceRequests.filter(r => r.status === 'pending').length}</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Verified Pros</p>
                      <p className="text-3xl font-black text-emerald-400">{serviceProviders.filter(p => p.verified).length}</p>
                    </div>
                  </div>
                </div>

                {/* Community Hubs Monitor */}
                <div className="bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5 golden-card-border">
                  <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tight">
                    <Users className="w-6 h-6 text-purple-400" />
                    Community Hubs (CSCC)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Groups</p>
                      <p className="text-3xl font-black text-white">{csccGroups.length}</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Active Cycles</p>
                      <p className="text-3xl font-black text-white">{csccGroups.filter(g => g.status === 'active').length}</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Volume</p>
                      <p className="text-3xl font-black text-purple-400">
                        ${csccGroups.reduce((acc, g) => acc + (g.contributionAmount * g.maxMembers), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* HEPIHANDS Loan Monitor */}
                <div className="bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5 golden-card-border">
                  <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tight">
                    <HandCoins className="w-6 h-6 text-emerald-400" />
                    HEPIHANDS Loan Monitor
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Active Loans</p>
                      <p className="text-3xl font-black text-white">{loans.filter(l => l.status === 'active').length}</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Pending Apps</p>
                      <p className="text-3xl font-black text-amber-400">{loanApplications.filter(a => a.status === 'submitted').length}</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Active Vendors</p>
                      <p className="text-3xl font-black text-white">{loanVendors.filter(v => v.status === 'verified').length}</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Debt</p>
                      <p className="text-3xl font-black text-rose-400">
                        ${loans.reduce((acc, l) => acc + l.remainingAmount, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* DomainHub Monitor */}
                <div className="bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5 golden-card-border">
                  <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tight">
                    <Globe className="w-6 h-6 text-indigo-400" />
                    Efado DomainHub Monitor
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Orders</p>
                      <p className="text-3xl font-black text-white">{domainOrders.length}</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Active Sellers</p>
                      <p className="text-3xl font-black text-white">{domainSellers.filter(s => s.status === 'active').length}</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Revenue</p>
                      <p className="text-3xl font-black text-emerald-400">
                        ${domainOrders.reduce((acc, o) => acc + o.amountCharged, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Commission</p>
                      <p className="text-3xl font-black text-indigo-400">
                        ${domainOrders.reduce((acc, o) => acc + o.commissionAmount, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Money Quiz Monitor */}
                <div className="bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5">
                  <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tight">
                    <Brain className="w-6 h-6 text-indigo-400" />
                    EFADO Money Quiz Monitor
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Games</p>
                      <p className="text-3xl font-black text-white">{quizSessions.length}</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Stakes</p>
                      <p className="text-3xl font-black text-white">
                        ₦{quizSessions.reduce((acc, s) => acc + s.stake, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Payouts</p>
                      <p className="text-3xl font-black text-emerald-400">
                        ₦{quizSessions.filter(s => s.status === 'won').reduce((acc, s) => acc + s.potentialWin, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Admin Profit</p>
                      <p className="text-3xl font-black text-indigo-400">
                        ₦{quizSessions.filter(s => s.status === 'lost').reduce((acc, s) => acc + s.stake, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* EFADO Gist Hub Monitor */}
                <div className="bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5 golden-card-border">
                  <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tight">
                    <MessageSquare className="w-6 h-6 text-indigo-400" />
                    EFADO Gist Hub Monitor (Social)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Posts</p>
                      <p className="text-3xl font-black text-white">{posts.length}</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Active Ads</p>
                      <p className="text-3xl font-black text-indigo-400">{ads.filter(a => a.status === 'active').length}</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Ad Revenue</p>
                      <p className="text-3xl font-black text-emerald-400">
                        ${ads.reduce((acc, a) => acc + (a.budget || 0), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email Hub Monitor */}
                <div className="bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5">
                  <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tight">
                    <Mail className="w-6 h-6 text-indigo-400" />
                    EFADO Email Hub Monitor
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Accounts</p>
                      <p className="text-3xl font-black text-white">{emailAccounts.length}</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Custom Domains</p>
                      <p className="text-3xl font-black text-white">{emailAccounts.filter(a => a.isCustomDomain).length}</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Premium Users</p>
                      <p className="text-3xl font-black text-emerald-400">{emailAccounts.filter(a => a.plan !== 'free').length}</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Storage</p>
                      <p className="text-3xl font-black text-indigo-400">
                        {Math.round(emailAccounts.reduce((acc, a) => acc + a.storageUsed, 0) / (1024 * 1024))}MB
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {selectedReceiptTx && (
          <StrategicReceipt 
            transaction={selectedReceiptTx}
            userEmail={users.find(u => u.uid === selectedReceiptTx.userId)?.email}
            onClose={() => setSelectedReceiptTx(null)}
          />
        )}
      </AnimatePresence>

      {/* Credit User Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-xl font-black text-white mb-2 uppercase">Credit Player Wallet</h3>
              <p className="text-sm text-slate-400 mb-6 font-bold">{selectedUser.email}</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Wallet Type</label>
                  <div className="flex gap-2 p-1 bg-slate-800 rounded-2xl border border-white/10">
                    <button
                      onClick={() => setCreditType('playerWallet')}
                      className={`flex-grow py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${creditType === 'playerWallet' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                      PLAYER WALLET
                    </button>
                    <button
                      onClick={() => setCreditType('cashOutWallet')}
                      className={`flex-grow py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${creditType === 'cashOutWallet' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                      CASH OUT WALLET
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Enter Amount ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
                    <input 
                      type="number"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white focus:border-indigo-500 outline-none transition-all text-xl font-black font-display"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => handleCreditUser(selectedUser)}
                    disabled={isProcessing || creditAmount <= 0}
                    className="flex-grow py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing...' : 'Confirm Credit'}
                  </button>
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl font-black uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Patronage Tracker Platform */}
      <AnimatePresence>
        {showPatronageTracker && (
          <PatronageTracker 
            onClose={() => setShowPatronageTracker(false)}
          />
        )}
      </AnimatePresence>

        </motion.div>
      )}
    </AnimatePresence>
  );
};
