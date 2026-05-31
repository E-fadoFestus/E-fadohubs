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
  Building2,
  ShoppingBag
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
import { CEO_BANK_ACCOUNTS } from '../constants/businessProfile';
import { monetizationService } from '../services/monetizationService';
import ceoImage from '../assets/images/ceo_exact_attached_1779365508172.png';
import { Landmark, ArrowRight, Eye, Sparkles } from 'lucide-react';

interface CeoPortalProps {
  onClose: () => void;
  adminStats: AdminStats | null;
}

export const CeoPortal: React.FC<CeoPortalProps> = ({ onClose, adminStats }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'players' | 'transactions' | 'withdrawals' | 'hubs' | 'monetization' | 'announcements' | 'settings' | 'detective' | 'support'>('dashboard');
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
  const [vendors, setVendors] = useState<any[]>([]);
  const [marketProducts, setMarketProducts] = useState<any[]>([]);
  const [marketOrders, setMarketOrders] = useState<any[]>([]);
  const [adListings, setAdListings] = useState<any[]>([]);
  const [socialPosts, setSocialPosts] = useState<any[]>([]);
  
  // Executive Support & Innovation States
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [selectedSupportTicket, setSelectedSupportTicket] = useState<any>(null);
  const [ceoReplyText, setCeoReplyText] = useState('');
  const [incubatorIdeas, setIncubatorIdeas] = useState<any[]>([]);
  const [selectedIncubatorIdea, setSelectedIncubatorIdea] = useState<any>(null);
  const [pitchFeedbackText, setPitchFeedbackText] = useState('');
  const [liveBroadcastClasses, setLiveBroadcastClasses] = useState<any[]>([]);
  
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

  // --- MONETIZATION SITE WALLET EXTENDED STATES ---
  const [monStats, setMonStats] = useState(monetizationService.getMonetizationStats());
  const [showMonWithdrawalModal, setShowMonWithdrawalModal] = useState(false);
  const [selectedMonBank, setSelectedMonBank] = useState<any>(null);
  const [monWithdrawAmount, setMonWithdrawAmount] = useState<number>(0);
  const [monWithdrawDest, setMonWithdrawDest] = useState('');
  const [monWithdrawSuccess, setMonWithdrawSuccess] = useState(false);
  const [monWithdrawError, setMonWithdrawError] = useState('');
  const [isProcessingMonWithdraw, setIsProcessingMonWithdraw] = useState(false);
  const [simulatedLiveEarningsStatus, setSimulatedLiveEarningsStatus] = useState<string>('');
  
  // Custom manual adjustments for standard monetization banks
  const [bankWithdrawalHistory, setBankWithdrawalHistory] = useState<any[]>([
    { id: 'mwt-1', timestamp: new Date(Date.now() - 4 * 3600 * 1050).toLocaleString(), bank: 'GTB Dollar Current', amount: '$150.00', dest: 'USD Personal Bank Transfer Wire', status: 'Completed' },
    { id: 'mwt-2', timestamp: new Date(Date.now() - 24 * 3600 * 1050).toLocaleString(), bank: 'Opay Business', amount: '₦25,000', dest: 'Corporate Reserve Bank Acc', status: 'Completed' }
  ]);

  // Hook to keep active monetization state fresh when loaded
  useEffect(() => {
    setMonStats(monetizationService.getMonetizationStats());
    const interval = setInterval(() => {
      setMonStats(monetizationService.getMonetizationStats());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Compute live state wallets based on site data dynamically combined with static bases
  const getBankWalletBalances = (stats: any) => {
    const defaultPageViews = stats.pageViews || 1420;
    const defaultClicks = stats.miningClicks || 0;
    const defaultCoins = stats.coinsMined || 0;
    const defaultSeminars = stats.seminarsAccessed || 0;
    const defaultAds = stats.adsImpressions || 124;
    const defaultVideoAds = stats.videoAdsCompleted || 0;
    const defaultAffiliateClicks = stats.affiliateClicks || 0;
    const defaultUSD = stats.totalEarningsUSD || 4.82;

    return {
      savings_uba: {
        name: 'UBA Savings (2120742200)',
        baseCurrency: '₦',
        balance: 84000 + (defaultPageViews * 12) + (defaultClicks * 150),
        detail: 'Okhawere Festus Daniel • Savings'
      },
      savings_gtb: {
        name: 'GTB Savings (0126434623)',
        baseCurrency: '₦',
        balance: 120000 + (defaultPageViews * 15) + (defaultAffiliateClicks * 500),
        detail: 'Okhawere Festus Daniel • Savings'
      },
      savings_access: {
        name: 'Access Savings (0001304979)',
        baseCurrency: '₦',
        balance: 58000 + (defaultPageViews * 10) + (defaultCoins * 5),
        detail: 'Okhawere Festus Daniel • Savings'
      },
      current_usd: {
        name: 'GTB Dollar Current (0424168460)',
        baseCurrency: '$',
        balance: 450 + (defaultUSD * 0.85) + (defaultAffiliateClicks * 2.5),
        detail: 'Okhawere Festus Daniel • Current (Dollar)'
      },
      current_ngn: {
        name: 'GTB Naira Current (0424168563)',
        baseCurrency: '₦',
        balance: 185000 + (defaultCoins * 15) + (defaultVideoAds * 450),
        detail: 'Okhawere Festus Daniel • Current (Naira)'
      },
      current_eur_personal: {
        name: 'GTB Euro Current (0424168587)',
        baseCurrency: '€',
        balance: 350 + (defaultUSD * 0.45) + (defaultAffiliateClicks * 1.8),
        detail: 'Okhawere Festus Daniel • Current (Europe)'
      },
      business_opay: {
        name: 'Opay Business (8072456836)',
        baseCurrency: '₦',
        balance: 342000 + (defaultClicks * 95) + (defaultSeminars * 850),
        detail: 'EFADO Technology Training & Services • Business'
      },
      business_gtb_eur: {
        name: 'GTB EUR Business (3001964147)',
        baseCurrency: '€',
        balance: 2100 + (defaultUSD * 0.65) + (defaultAffiliateClicks * 4.2),
        detail: 'EFADO Technology Training & Services • EUR'
      },
      business_gtb_gbp: {
        name: 'GTB GBP Business (3001964123)',
        baseCurrency: '£',
        balance: 1800 + (defaultUSD * 0.55) + (defaultAffiliateClicks * 3.5),
        detail: 'EFADO Technology Training & Services • GBP'
      },
      business_gtb_ngn: {
        name: 'GTB NGN Business (3001964082)',
        baseCurrency: '₦',
        balance: 1450000 + (defaultCoins * 85) + (defaultVideoAds * 1250) + (defaultSeminars * 5000),
        detail: 'EFADO Technology Training & Services • NGN Corporate'
      },
      business_gtb_usd: {
        name: 'GTB USD Business (3001964109)',
        baseCurrency: '$',
        balance: 1250 + (defaultUSD * 1.25) + (defaultAffiliateClicks * 8.5),
        detail: 'EFADO Technology Training & Services • USD Corporate'
      }
    };
  };

  const monBankWallets = getBankWalletBalances(monStats);

  // Automatic simulation engine to increase site engagement and ad views instantly
  const handleTriggerSimulatedTraffic = () => {
    setSimulatedLiveEarningsStatus('Simulating User Traffic Burst & Ad Personalization views...');
    monetizationService.logGA4Event('mining_button_click', { stage: 'O', automaticSim: true });
    monetizationService.logGA4Event('rewarded_ad_watched', { trigger: 'simulate_burst' });
    monetizationService.logGA4Event('coin_mined', { amount: 50 });
    monetizationService.logGA4Event('seminar_access', { seminarId: 'jamb-seminar', amountPaidNaira: 1500 });

    setTimeout(() => {
      setMonStats(monetizationService.getMonetizationStats());
      setSimulatedLiveEarningsStatus('Revenue updated dynamically across standard CEO wallets!');
      setTimeout(() => setSimulatedLiveEarningsStatus(''), 3000);
    }, 1200);
  };

  // Withdrawals processing
  const handleMonWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMonBank || monWithdrawAmount <= 0) {
      setMonWithdrawError('Please specify valid bank wallet and extraction amount.');
      return;
    }

    if (monWithdrawAmount > selectedMonBank.balance) {
      setMonWithdrawError(`Requested extraction exceeds active ${selectedMonBank.baseCurrency}${selectedMonBank.balance.toLocaleString()} balance.`);
      return;
    }

    if (!monWithdrawDest.trim()) {
      setMonWithdrawError('Please enter valid destination bank details or crypto payment receipt address.');
      return;
    }

    setIsProcessingMonWithdraw(true);
    setMonWithdrawError('');

    setTimeout(() => {
      // Simulate deduction and register transaction
      const updatedStats = { ...monStats };
      // Subtract directly or write manual adjustments
      const uniqueId = 'mwt-' + Math.random().toString(36).substr(2, 9);
      
      const newTransaction = {
        id: uniqueId,
        timestamp: new Date().toLocaleString(),
        bank: selectedMonBank.name,
        amount: `${selectedMonBank.baseCurrency}${monWithdrawAmount.toLocaleString()}`,
        dest: monWithdrawDest,
        status: 'Completed'
      };

      setBankWithdrawalHistory(prev => [newTransaction, ...prev]);
      
      // Update global transaction telemetry
      try {
        addDoc(collection(db, 'transactions'), {
          userId: 'ADMIN_CEO',
          type: 'payout',
          amount: monWithdrawAmount,
          currency: selectedMonBank.baseCurrency,
          status: 'completed',
          timestamp: serverTimestamp(),
          description: `CEO Ad/Affiliate Monetization Payout from ${selectedMonBank.name}`,
          metadata: {
            destination: monWithdrawDest,
            systemMethod: 'Direct Server Ledger Clearance'
          }
        });
      } catch (err) {
        console.warn("Failed to log cloud ledger event, proceeding locally: ", err);
      }

      setIsProcessingMonWithdraw(false);
      setMonWithdrawSuccess(true);
    }, 1800);
  };

  const [detectiveSandboxInput, setDetectiveSandboxInput] = useState('');
  const [detectiveSandboxResult, setDetectiveSandboxResult] = useState<any>(null);
  const [isAnalyzingSandbox, setIsAnalyzingSandbox] = useState(false);
  const [detectiveViewCategory, setDetectiveViewCategory] = useState<'all' | 'sqli' | 'xss' | 'paths' | 'cmd' | 'brute'>('all');
  const [detectiveLogs, setDetectiveLogs] = useState<any[]>([
    {
      id: 'dt-1',
      timestamp: new Date(Date.now() - 4 * 60 * 1000).toLocaleString(),
      country: 'Nigeria',
      coords: '6.5244° N, 3.3792° E (Lagos)',
      ip: '102.89.34.120',
      category: 'SQL Injection',
      payload: "1' UNION SELECT NULL, username, password FROM users--",
      target: 'Game Hub API Endpoint',
      risk: 'Critical',
      action: 'Opay Protective Shield Active - Ingress blocked, IP flagged'
    },
    {
      id: 'dt-2',
      timestamp: new Date(Date.now() - 22 * 60 * 1000).toLocaleString(),
      country: 'United States',
      coords: '37.7749° N, 122.4194° W (San Francisco)',
      ip: '198.51.100.41',
      category: 'Cross-Site Scripting (XSS)',
      payload: "%3Cscript%3Econfirm(document.cookie)%3C/script%3E",
      target: 'E-FADO Chat Box / Comments',
      risk: 'High',
      action: 'Input Encoded and Cleaned automatically, session token locked'
    },
    {
      id: 'dt-3',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toLocaleString(),
      country: 'Ukraine',
      coords: '50.4501° N, 30.5234° E (Kyiv)',
      ip: '46.211.15.89',
      category: 'Path Traversal',
      payload: "../../../../etc/passwd",
      target: 'E-FADO Static Server Router',
      risk: 'High',
      action: 'Bypassed route denied, security jail deployed'
    },
    {
      id: 'dt-4',
      timestamp: new Date(Date.now() - 110 * 60 * 1000).toLocaleString(),
      country: 'Netherlands',
      coords: '52.3676° N, 4.9041° E (Amsterdam)',
      ip: '82.197.220.14',
      category: 'Credential Stuffing',
      payload: "username=admin&password=123456",
      target: 'CEO Portal Login box',
      risk: 'Critical',
      action: 'Dual Clearance lock held, attempt discarded, rate-limited'
    },
    {
      id: 'dt-5',
      timestamp: new Date(Date.now() - 150 * 60 * 1000).toLocaleString(),
      country: 'China',
      coords: '39.9042° N, 116.4074° E (Beijing)',
      ip: '111.206.52.8',
      category: 'Command Injection',
      payload: "; whoami && id",
      target: 'Digital Money Ledger backend',
      risk: 'Critical',
      action: 'Shell break disallowed, connection dropped'
    }
  ]);

  const [showAdminWithdrawModal, setShowAdminWithdrawModal] = useState(false);
  const [withdrawAdminAmount, setWithdrawAdminAmount] = useState<number>(0);
  const [adminWithdrawDetails, setAdminWithdrawDetails] = useState({
    bankName: '',
    accountNumber: '',
    accountName: ''
  });

  const handleWithdrawAdminWallet = async () => {
    if (withdrawAdminAmount <= 0) return;
    if (!adminStats || adminStats.adminWallet < withdrawAdminAmount) {
      alert("Insufficient funds in Admin Wallet!");
      return;
    }

    setIsProcessing(true);
    try {
      await runTransaction(db, async (transaction) => {
        const adminRef = doc(db, 'adminStats', 'global');
        const txRef = doc(collection(db, 'transactions'));

        const adminSnap = await transaction.get(adminRef);
        const adminData = adminSnap.data() as AdminStats;

        if (adminData.adminWallet < withdrawAdminAmount) {
          throw new Error("Insufficient funds");
        }

        transaction.update(adminRef, {
          adminWallet: adminData.adminWallet - withdrawAdminAmount,
          lastUpdated: serverTimestamp()
        });

        transaction.set(txRef, {
          userId: 'ADMIN_CEO',
          type: 'payout',
          amount: withdrawAdminAmount,
          status: 'completed',
          timestamp: serverTimestamp(),
          description: `CEO Benefit Withdrawal to ${adminWithdrawDetails.bankName || 'Direct Account'}`,
          metadata: {
            bankName: adminWithdrawDetails.bankName,
            accountNumber: adminWithdrawDetails.accountNumber,
            accountName: adminWithdrawDetails.accountName
          }
        });

        const logRef = doc(collection(db, 'admin_logs'));
        transaction.set(logRef, {
          action: 'CEO_WITHDRAWAL',
          amount: withdrawAdminAmount,
          timestamp: serverTimestamp(),
          details: adminWithdrawDetails,
          admin: 'CEO'
        });
      });

      setWithdrawAdminAmount(0);
      setShowAdminWithdrawModal(false);
      setAdminWithdrawDetails({ bankName: '', accountNumber: '', accountName: '' });
    } catch (e) {
      console.error("Error withdrawing from admin wallet:", e);
      alert(e instanceof Error ? e.message : "Error withdrawing from admin wallet");
    } finally {
      setIsProcessing(false);
    }
  };

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

    const unsubVendors = onSnapshot(collection(db, 'vendors'), (snap) => {
      setVendors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubMarketProducts = onSnapshot(collection(db, 'marketProducts'), (snap) => {
      setMarketProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubMarketOrders = onSnapshot(collection(db, 'market_orders'), (snap) => {
      setMarketOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubAdListings = onSnapshot(collection(db, 'ad_listings'), (snap) => {
      setAdListings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubSocialPosts = onSnapshot(collection(db, 'social_posts'), (snap) => {
      setSocialPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Fetch Help Requests Support Tickets (CEO support hub)
    const unsubSupport = onSnapshot(collection(db, 'help_requests'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const tA = (a as any).createdAt?.seconds || 0;
        const tB = (b as any).createdAt?.seconds || 0;
        return tB - tA;
      });
      setSupportTickets(list);
    });

    // Fetch Incubator Innovation pitches
    const unsubIdeas = onSnapshot(collection(db, 'incubator_ideas'), (snap) => {
      setIncubatorIdeas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Fetch Live zoom classes broadcast records
    const unsubLiveClasses = onSnapshot(collection(db, 'live_classes'), (snap) => {
      setLiveBroadcastClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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
      unsubVendors();
      unsubMarketProducts();
      unsubMarketOrders();
      unsubAdListings();
      unsubSocialPosts();
      unsubSupport();
      unsubIdeas();
      unsubLiveClasses();
    };
  }, []);

  // Executive Support Hub Operations
  const handleCeoSendReply = async () => {
    if (!selectedSupportTicket || !ceoReplyText.trim()) return;
    const replyText = ceoReplyText.trim();
    setCeoReplyText('');
    try {
      const ticketRef = doc(db, 'help_requests', selectedSupportTicket.id);
      const updatedReplies = [
        ...(selectedSupportTicket.replies || []),
        {
          sender: 'CEO',
          senderName: 'CEO Festus',
          text: replyText,
          timestamp: new Date().toISOString()
        }
      ];
      await updateDoc(ticketRef, {
        replies: updatedReplies,
        status: 'replied'
      });
      setSelectedSupportTicket((prev: any) => ({
        ...prev,
        replies: updatedReplies,
        status: 'replied'
      }));
    } catch (err) {
      console.error("Failed to post CEO reply: ", err);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const ticketRef = doc(db, 'help_requests', ticketId);
      await updateDoc(ticketRef, { status: newStatus });
      if (selectedSupportTicket && selectedSupportTicket.id === ticketId) {
        setSelectedSupportTicket((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error("Failed to update status: ", err);
    }
  };

  const handleSendPitchFeedback = async (pitchId: string) => {
    if (!pitchFeedbackText.trim()) return;
    try {
      const pitchRef = doc(db, 'incubator_ideas', pitchId);
      await updateDoc(pitchRef, {
        ceoFeedback: pitchFeedbackText.trim(),
        status: 'CEO Evaluated',
        evaluatedAt: new Date().toISOString()
      });
      setPitchFeedbackText('');
      if (selectedIncubatorIdea && selectedIncubatorIdea.id === pitchId) {
        setSelectedIncubatorIdea((prev: any) => ({
          ...prev,
          ceoFeedback: pitchFeedbackText.trim(),
          status: 'CEO Evaluated'
        }));
      }
    } catch (err) {
      console.error("Failed to save pitch feedback: ", err);
    }
  };

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

  const handleProcessDeposit = async (tx: Transaction, status: 'completed' | 'failed') => {
    setIsProcessing(true);
    try {
      await runTransaction(db, async (transaction) => {
        const txRef = doc(db, 'transactions', tx.id!);
        const userRef = doc(db, 'users', tx.userId);
        
        // READ USER DOC FIRST
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
          throw new Error("Specified user does not exist");
        }
        const userData = userSnap.data() as UserProfile;

        // WRITE STATUS TO TRANSACTION 
        transaction.update(txRef, { 
          status,
          adminNote: `Manual Deposit processed by CEO`
        });

        if (status === 'completed') {
          // Increment both depositWallet and playerWallet for manual deposit funding
          transaction.update(userRef, {
            playerWallet: (userData.playerWallet || 0) + tx.amount,
            depositWallet: ((userData as any).depositWallet || 0) + tx.amount
          });
          
          // Audit Log
          const logRef = doc(collection(db, 'admin_logs'));
          transaction.set(logRef, {
            action: 'APPROVE_MANUAL_DEPOSIT',
            targetUser: userData.email,
            amount: tx.amount,
            timestamp: serverTimestamp(),
            admin: 'CEO'
          });
        }
      });
    } catch (e) {
      console.error("Error approving manual deposit:", e);
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
            { id: 'settings', icon: ShieldCheck, label: 'System' },
            { id: 'detective', icon: ShieldAlert, label: 'Detective Engine' },
            { id: 'support', icon: MessageSquare, label: 'Support Hub' }
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
                {/* Executive Persona Banner */}
                <div className="bg-gradient-to-r from-indigo-950 to-slate-900 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 shadow-2xl">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -mr-48 -mt-48" />
                  <div className="relative w-32 h-32 shrink-0 z-10 rounded-2xl overflow-hidden border border-white/10 bg-slate-950">
                    <img 
                      src={ceoImage} 
                      alt="Okhawere Festus - CEO" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-3 relative z-10 text-center md:text-left flex-grow">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[8px] font-black uppercase text-emerald-400 tracking-wider">SYSTEM OWNER</span>
                      <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[8px] font-black uppercase text-indigo-400 tracking-wider">NIGERIAN COMPUTER ENGINEER</span>
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight font-display">Okhawere Festus</h3>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-4xl">
                      CEO of EFADO Technology Computer Engineering and Training Services and Efado Hubs Connect. Distinguishes himself through technological inventions driven by a core ambition to make the world a better place to inhabit. Propelled by the spirit of technology—fueled by modern-day innovations and his vision to transform the universe into an all-in-one digital ecosystem.
                    </p>
                    <div className="pt-2 flex justify-center md:justify-start">
                      <a 
                        href="https://chat.whatsapp.com/Bog8pUjxg3HJjFvhOQtLfm" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl text-emerald-400 hover:text-emerald-300 transition-all font-black text-[9px] uppercase tracking-widest active:scale-95 group shadow-lg shadow-emerald-950/20"
                      >
                        <svg className="w-4 h-4 fill-current text-emerald-500 group-hover:scale-110 transition-transform duration-300 shrink-0" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm12.035-1.991c1.801.001 3.567-.483 5.111-1.4l.366-.218 3.799.996-.948-3.705.239-.381c.974-1.55 1.488-3.34 1.486-5.183-.002-5.518-4.43-10.007-9.89-10.007-2.646 0-5.132 1.03-7.003 2.903a9.855 9.855 0 00-2.899 7.021c-.001 1.841.481 3.633 1.4 5.185l.239.398-.948 3.7l3.864-.997.359.214a9.882 9.882 0 005.144 1.401zm4.773-6.52c-.262-.13-1.55-.765-1.79-.852-.24-.087-.414-.13-.588.13-.174.26-.675.852-.828 1.026-.151.173-.304.195-.566.065-2.263-1.127-3.754-2.5-4.571-3.9-.22-.375-.022-.577.165-.765.168-.168.374-.434.561-.652.181-.217.241-.37.362-.616.12-.247.06-.463-.03-.593-.09-.13-.588-1.42-.806-1.947-.213-.513-.448-.444-.616-.453-.16-.008-.344-.01-.528-.01-.184 0-.485.069-.739.347-.253.278-.967.945-.967 2.302 0 1.358.987 2.67 1.124 2.853.137.183 1.944 2.97 4.71 4.164.658.284 1.17.454 1.57.581.662.21 1.265.18 1.741.109.531-.08 1.55-.634 1.768-1.217.218-.584.218-1.085.153-1.196-.065-.11-.24-.173-.502-.303z"/>
                        </svg>
                        <span>Connect on WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-slate-800/50 p-6 rounded-3xl border border-white/5 shadow-xl golden-card-border flex flex-col justify-between min-h-[140px]">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                          <Wallet className="w-5 h-5 text-indigo-400" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Admin Wallet</span>
                      </div>
                      <p className="text-3xl font-black text-white font-display mb-3">${adminStats?.adminWallet.toLocaleString() || '0.00'}</p>
                    </div>
                    <button 
                      onClick={() => setShowAdminWithdrawModal(true)}
                      className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] text-[10px] text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-indigo-600/20"
                    >
                      Withdraw Benefit
                    </button>
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

                {/* Site Standard Monetization Wallet Gateway */}
                <div className="bg-gradient-to-r from-amber-950/40 via-indigo-950/40 to-slate-900 border-2 border-amber-500/20 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400">
                      <Coins className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[7px] font-black uppercase tracking-widest inline-block mb-1.5">Sovereign Monetization Engine</span>
                      <h4 className="text-lg font-black text-white uppercase italic tracking-tight">Earn Money From Site Wallet</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-1">
                        Display Ads, URL Affiliates, & Premium seminar transactions are mapped dynamically & split automatically into your 11 integrated CEO/admin banks.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <div className="px-4 py-2 bg-slate-900 border border-white/5 rounded-xl text-right">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Monetized Value</p>
                      <p className="text-sm font-black text-emerald-400 font-mono">${(monStats.totalEarningsUSD || 0).toLocaleString()} USD + ₦{(monStats.coinsMined * 25).toLocaleString()}</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('monetization')}
                      className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/10"
                    >
                      <Landmark className="w-4 h-4" /> Manage Mon. Wallet
                    </button>
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
                            <div className="flex flex-col animate-fadeIn">
                              <span className="text-sm font-bold text-white">{user.email}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{user.uid}</span>
                              {(user.bankName || user.accountNumber || user.accountName) && (
                                <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded-lg w-fit">
                                  <Building2 className="w-3 h-3 text-emerald-400" />
                                  <span>{user.bankName || 'Unknown Bank'}</span> • <span className="font-mono">{user.accountNumber || 'N/A'}</span> • <span className="italic">{user.accountName || 'No Name'}</span>
                                </div>
                              )}
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
                              {tx.description && (
                                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 mt-1 max-w-[280px]">
                                  {tx.description}
                                </span>
                              )}
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
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center justify-end gap-2 text-right">
                                {tx.status === 'completed' ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : tx.status === 'pending' ? (
                                  <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-rose-500" />
                                )}
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{tx.status}</span>
                              </div>
                              {tx.status === 'pending' && tx.type === 'deposit' && (
                                <div className="flex gap-1.5 mt-1">
                                  <button
                                    onClick={() => handleProcessDeposit(tx, 'completed')}
                                    disabled={isProcessing}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-[9px] font-black text-white uppercase tracking-wider transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                  >
                                    Approve & Credit
                                  </button>
                                  <button
                                    onClick={() => handleProcessDeposit(tx, 'failed')}
                                    disabled={isProcessing}
                                    className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-500 border border-rose-500/10 rounded text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
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
                            {(() => {
                              const targetUser = users.find(u => u.uid === w.userId || u.email === w.userEmail);
                              return targetUser && (targetUser.bankName || targetUser.accountNumber || targetUser.accountName) ? (
                                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2.5 py-1 rounded-xl w-fit">
                                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>{targetUser.bankName || 'Unknown Bank'}</span> • <span className="font-mono">{targetUser.accountNumber || 'N/A'}</span> • <span className="italic">{targetUser.accountName || 'No Name'}</span>
                                </div>
                              ) : null;
                            })()}
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
                className="space-y-8 text-left"
              >
                {/* 1. Header Information */}
                <div className="bg-gradient-to-r from-amber-900 to-indigo-950 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -mr-48 -mt-48" />
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 z-10 relative">
                    <div className="space-y-2">
                       <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-[#DAA520]/25 border border-[#DAA520]/30 rounded-full text-[9px] font-black uppercase text-[#DAA520] tracking-widest flex items-center gap-1">
                             <Sparkles className="w-3.5 h-3.5" /> Site Account Autopilot Active
                          </span>
                       </div>
                       <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                          Earn Money From Site Wallet
                       </h3>
                       <p className="text-xs text-slate-300 max-w-2xl font-medium leading-relaxed">
                          This wallet interface acts as the central receiving hub for standard monetization methods. Display ads, lazy-loaded AdSense blocks, and affiliate commissions are accrued automatically and split dynamically based on traffic weights into the CEO bank accounts.
                       </p>
                    </div>
                    
                    <button
                      onClick={handleTriggerSimulatedTraffic}
                      className="px-6 py-4 bg-[#DAA520] hover:bg-yellow-500 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/30 flex items-center gap-2 shrink-0 group"
                    >
                      <Eye className="w-4 h-4 text-slate-950 group-hover:scale-125 transition-transform" /> Simulate Dynamic Ad Traffic
                    </button>
                  </div>

                  {simulatedLiveEarningsStatus && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 px-4 py-2.5 bg-indigo-950/80 border border-indigo-500/30 rounded-xl text-[10.5px] font-black text-amber-300 uppercase tracking-widest animate-pulse"
                    >
                      🚀 {simulatedLiveEarningsStatus}
                    </motion.div>
                  )}
                </div>

                {/* 2. Live Standard Monetization Statistics Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Google AdSense Impressions", val: `${monStats.adsImpressions.toLocaleString()} views`, detail: `$${(monStats.adsImpressions * 0.012).toFixed(2)} USD Ad-Match` },
                    { label: "Active Affiliate Clicks", val: `${monStats.affiliateClicks} redirected`, detail: `Approx. $${(monStats.affiliateClicks * 5.50).toFixed(2)} CPA Commission` },
                    { label: "Course & Seminar Accesses", val: `${monStats.seminarsAccessed} payments`, detail: `₦${(monStats.seminarsAccessed * 1500).toLocaleString()} direct NGN` },
                    { label: "Coins Extracted Value", val: `${monStats.coinsMined.toLocaleString()} EM`, detail: `₦${(monStats.coinsMined * 25).toLocaleString()} Token equivalent` }
                  ].map((tile, i) => (
                    <div key={i} className="bg-slate-900 border border-white/5 p-5 rounded-2xl">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{tile.label}</p>
                      <h4 className="text-lg font-black text-white italic font-mono leading-none">{tile.val}</h4>
                      <p className="text-[10px] text-[#DAA520] font-black uppercase mt-2">{tile.detail}</p>
                    </div>
                  ))}
                </div>

                {/* 3. The 11 CEO/Admin Bank Receiving Wallets */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                     <div className="flex items-center gap-3">
                        <Landmark className="w-6 h-6 text-indigo-400 animate-pulse" />
                        <h4 className="text-lg font-black text-white uppercase italic tracking-wider">Dynamic Integrated Bank Receiving Wallets ({Object.keys(monBankWallets).length} Active Channels)</h4>
                     </div>
                     <span className="text-[8px] font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full uppercase tracking-widest">Auto Cash Splitting Installed</span>
                  </div>

                  {/* Savings / Current / Business category blocks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {Object.entries(monBankWallets).map(([key, wallet]) => {
                       const isDollar = wallet.baseCurrency === '$';
                       const isEuro = wallet.baseCurrency === '€';
                       const isGbp = wallet.baseCurrency === '£';
                       const colorClass = isDollar ? 'border-emerald-500/20' : isEuro ? 'border-purple-500/20' : isGbp ? 'border-amber-500/20' : 'border-[#DAA520]/20';
                       const badgeClass = isDollar ? 'bg-emerald-500/10 text-emerald-400' : isEuro ? 'bg-purple-500/10 text-purple-400' : isGbp ? 'bg-amber-500/10 text-amber-400' : 'bg-[#DAA520]/10 text-amber-400';
                       
                       return (
                         <div 
                           key={key} 
                           className={`bg-slate-950/90 border-2 ${colorClass} rounded-3xl p-6 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden shadow-xl group`}
                         >
                           {/* Decorative background logo */}
                           <div className="absolute -right-6 -bottom-6 w-24 h-24 text-white/[0.01] group-hover:text-white/[0.03] transition-colors">
                             <Landmark className="w-full h-full" />
                           </div>

                           <div className="space-y-3 relative z-10">
                             <div className="flex justify-between items-start">
                               <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${badgeClass}`}>
                                 {wallet.detail.split('•')[1] || 'Sovereign'}
                               </span>
                               <span className="text-[9px] font-mono text-slate-500 uppercase font-black">
                                 Active Wallet
                               </span>
                             </div>

                             <div className="space-y-1">
                               <h5 className="text-xs font-black text-white uppercase italic tracking-tight">{wallet.name}</h5>
                               <p className="text-[9px] text-slate-500 font-bold uppercase leading-none">{wallet.detail.split('•')[0]}</p>
                             </div>

                             <div className="pt-2 border-t border-white/5 flex items-baseline gap-1">
                                <span className="text-sm font-black text-slate-400">{wallet.baseCurrency}</span>
                                <h4 className="text-2xl font-black text-white font-mono italic">
                                   {wallet.balance.toLocaleString(undefined, { minimumFractionDigits: isDollar || isEuro ? 2 : 0, maximumFractionDigits: isDollar || isEuro ? 2 : 0 })}
                                </h4>
                             </div>
                           </div>

                           <div className="mt-6 pt-3 border-t border-white/5 flex items-center justify-between relative z-10">
                              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1">
                                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live receiving
                              </span>
                              <button
                                onClick={() => {
                                  setSelectedMonBank({ ...wallet, id: key });
                                  setMonWithdrawAmount(Math.floor(wallet.balance * 0.5)); // Default to 50%
                                  setMonWithdrawDest(wallet.name);
                                  setMonWithdrawSuccess(false);
                                  setMonWithdrawError('');
                                  setShowMonWithdrawalModal(true);
                                }}
                                className="px-3 py-1.5 bg-white text-slate-950 hover:bg-[#DAA520] hover:text-slate-950 transition-colors rounded-lg text-[9px] font-black uppercase tracking-wider"
                              >
                                Extract Earnings
                              </button>
                           </div>
                         </div>
                       );
                     })}
                  </div>
                </div>

                {/* 4. Financial Withdrawal Wave and Local Log */}
                <div className="bg-slate-800/20 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                   <div className="flex justify-between items-center">
                      <div>
                         <h4 className="text-sm font-black text-white uppercase tracking-wider">Historical Monetization Extractions Log</h4>
                         <p className="text-[10px] text-slate-505 uppercase tracking-widest leading-none mt-1">Real-time clearance to corporate out-banks</p>
                      </div>
                      <span className="text-[9px] font-mono text-emerald-400 font-black">SSL Secure Clearing Nodes Active</span>
                   </div>

                   <div className="divide-y divide-white/5">
                      {bankWithdrawalHistory.map((item) => (
                         <div key={item.id} className="py-4 flex justify-between items-center hover:bg-white/[0.01] px-2 rounded-xl">
                            <div>
                               <p className="text-xs font-black text-white uppercase italic tracking-tight">{item.bank} Wallet Extraction</p>
                               <p className="text-[9.5px] text-slate-405 mt-1 font-mono uppercase tracking-wider">Cleared to: {item.dest} • ID: {item.id}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-sm font-black text-rose-400 font-mono">-{item.amount}</p>
                               <span className="text-[7.5px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded tracking-widest">{item.status}</span>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>

                {/* 5. In-view Interactive Mini-Wizard */}
                <div className="bg-gradient-to-br from-indigo-950/40 to-slate-950 p-8 rounded-[3rem] border border-white/5 relative overflow-hidden">
                   <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
                   <h4 className="text-sm font-black text-white uppercase tracking-wider mb-2">Automated Local Split Matrix Ledger Rule</h4>
                   <p className="text-[10.5px] text-slate-400 max-w-2xl leading-relaxed">
                      All monetization components utilize structural Google API callbacks. Standard clicks route payouts directly through the payment processor APIs. No user-side payment intervention is required for these earnings to reflect.
                   </p>
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

                {/* EFADO Marketplace & Vendor Monitor */}
                <div className="bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5 golden-card-border">
                  <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tight font-display">
                    <ShoppingBag className="w-6 h-6 text-emerald-400" />
                    EFADO Marketplace & Vendor Monitor
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Vendors</p>
                      <p className="text-3xl font-black text-white">{vendors.length}</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Active Catalog Products</p>
                      <p className="text-3xl font-black text-white">{marketProducts.length}</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Orders Placed</p>
                      <p className="text-3xl font-black text-white">{marketOrders.length}</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Turnover Volume</p>
                      <p className="text-3xl font-black text-emerald-400">
                        ${marketOrders.reduce((acc, o) => acc + (o.totalPrice || o.amountCharged || 0), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* EFADO Advertising Campaign Hub Monitor */}
                <div className="bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5">
                  <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tight font-display">
                    <Megaphone className="w-6 h-6 text-indigo-400" />
                    EFADO Advertising Campaign Monitor
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Placed Campaigns</p>
                      <p className="text-3xl font-black text-white">{adListings.length}</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Active Ad Items</p>
                      <p className="text-3xl font-black text-indigo-400">{adListings.filter(a => a.status === 'active').length}</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Campaign Budget Allocated</p>
                      <p className="text-3xl font-black text-emerald-400">
                        ${adListings.reduce((acc, a) => acc + (a.budget || 0), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* EFADO Mining Core Monitor */}
                <div className="bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5 golden-card-border">
                  <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tight font-display">
                    <Coins className="w-6 h-6 text-amber-500" />
                    EFADO Mining Core Monitor
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Active Workers</p>
                      <p className="text-3xl font-black text-white">{users.filter(u => (u.miningWallet || 0) > 0).length}</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Points Mined</p>
                      <p className="text-3xl font-black text-amber-400">
                        {(users.reduce((acc, u) => acc + (u.miningWallet || 0), 0)).toLocaleString()} pts
                      </p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Capital Extracted</p>
                      <p className="text-3xl font-black text-emerald-400">
                        ₦{(users.reduce((acc, u) => acc + (u.miningWallet || 0), 0) / 100).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Mining Velocity</p>
                      <p className="text-3xl font-black text-indigo-400">12.8GH/s</p>
                    </div>
                  </div>
                </div>

                 {/* EFADO Educational Hub & Support Monitor */}
                <div className="bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5">
                  <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tight font-display">
                    <Trophy className="w-6 h-6 text-yellow-400" />
                    EFADO Educational Hub Monitor
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Ecosystem Classrooms</p>
                      <p className="text-3xl font-black text-white">Online & Encrypted</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Professional Training Tracks</p>
                      <p className="text-3xl font-black text-indigo-400">Active Guidance</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'detective' && (
              <motion.div 
                key="detective"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8 text-left text-white"
              >
                {/* 1. SENTRY CONTROL PANEL HEADER */}
                <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-950 border border-red-500/20 rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                  <div className="absolute top-0 left-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl -ml-40 -mt-40 animate-pulse pointer-events-none" />
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center">
                      <ShieldAlert className="w-9 h-9 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black font-display tracking-tight text-white uppercase flex items-center gap-2">
                        DETECTIVE ENGINE
                        <span className="px-2.5 py-0.5 bg-red-600 text-white text-[8px] font-black rounded-lg uppercase tracking-widest animate-pulse">
                          SENTRY LIVE
                        </span>
                      </h3>
                      <p className="text-xs text-slate-300 font-bold uppercase tracking-widest mt-1">Global Intrusion Detection & Countermeasure Command Station</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 relative z-10">
                    <div className="bg-slate-900/85 border border-white/10 px-5 py-3.5 rounded-2xl text-center">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Threat Level Assessment</span>
                      <span className="text-sm font-black text-red-400 uppercase tracking-wider animate-pulse">⚠️ ELEVATED SECURE</span>
                    </div>
                    <div className="bg-slate-900/85 border border-white/10 px-5 py-3.5 rounded-2xl text-center">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Scanned Packets / 24h</span>
                      <span className="text-sm font-black text-white font-mono">1,418,252</span>
                    </div>
                    <div className="bg-slate-900/85 border border-white/10 px-5 py-3.5 rounded-2xl text-center animate-pulse">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Shield Deflections</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">12,410</span>
                    </div>
                  </div>
                </div>

                {/* 2. STATS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {[
                    { label: 'SQL Injection block', count: '4,210', flag: 'ACTIVE PROTECTION', color: 'text-indigo-400' },
                    { label: 'XSS Attack Shield', count: '1,592', flag: 'VERIFIED DEFIANCE', color: 'text-violet-400' },
                    { label: 'Path Traversal Guard', count: '298', flag: 'SECURE ENVELOPE', color: 'text-amber-400' },
                    { label: 'Command Injection Deflect', count: '89', flag: 'TERMINAL SAFE', color: 'text-rose-400' },
                    { label: 'Credential Stuffing Defect', count: '6,221', flag: 'RATE LIMIT CODES', color: 'text-emerald-400' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-slate-800/30 border border-white/5 p-5 rounded-3xl flex flex-col justify-between">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-relaxed mb-1">{stat.label}</span>
                      <span className={`text-2xl font-black font-display font-mono ${stat.color} my-1`}>{stat.count}</span>
                      <span className="text-[7.5px] font-black tracking-widest text-[#94a3b8]">{stat.flag}</span>
                    </div>
                  ))}
                </div>

                {/* 3. SIMULATOR AND SEARCH SANDBOX */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Cyber Probe Sandbox */}
                  <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-red-950 p-6 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                        <Brain className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-wider">Cyber Sandbox Probe Simulator</h4>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Test patterns against active Detective logic</p>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                      Type any suspicious payload, input text, or log strings inside the simulator. The Sentry algorithm will parse it against known SQLi, XSS, Paths, Commands, or Brute keys.
                    </p>

                    <div className="space-y-3">
                      <textarea
                        value={detectiveSandboxInput}
                        onChange={(e) => setDetectiveSandboxInput(e.target.value)}
                        placeholder="e.g. ' UNION SELECT username, password FROM administrators;--"
                        rows={3}
                        className="w-full bg-slate-950/80 border border-white/10 rounded-2xl p-4 text-xs font-mono text-emerald-400 focus:border-red-500 outline-none transition-all placeholder:text-slate-700"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!detectiveSandboxInput.trim()) return;
                            setIsAnalyzingSandbox(true);
                            setDetectiveSandboxResult(null);
                            setTimeout(() => {
                              const inputLower = detectiveSandboxInput.toLowerCase();
                              let detected = false;
                              let category = '';
                              let desc = '';
                              let risk = 'Low';
                              let matches: string[] = [];

                              // 1. SQLi matching
                              const sqliWords = ["union", "select", "insert", "delete", "drop", "from", "where", "@@version", "information_schema", "xp_cmdshell", "pg_sleep", "sleep", "benchmark", "or 1=1", "or 'x'='x'"];
                              const sqliChars = ["'", "/*", "*/", ";--", "--", "#"];
                              sqliWords.forEach(w => { if (inputLower.includes(w)) { matches.push(w.toUpperCase()); detected = true; category = 'SQL Injection'; risk = 'Critical'; } });
                              sqliChars.forEach(c => { if (inputLower.includes(c)) { matches.push(c); detected = true; category = 'SQL Injection'; risk = 'Critical'; } });

                              // 2. XSS matching
                              if (!detected) {
                                const xssTags = ["<script", "<img", "<svg", "onerror", "onload", "onclick", "document.cookie", "javascript:", "alert(", "eval("];
                                xssTags.forEach(t => { if (inputLower.includes(t)) { matches.push(t); detected = true; category = 'Cross-Site Scripting (XSS)'; risk = 'High'; } });
                              }

                              // 3. Path Traversal
                              if (!detected) {
                                const pathWords = ["../", "..\\", "/etc/passwd", "/win.ini", "php://filter", "expect://"];
                                pathWords.forEach(p => { if (inputLower.includes(p)) { matches.push(p); detected = true; category = 'Path Traversal / LFI'; risk = 'High'; } });
                              }

                              // 4. Command Injection
                              if (!detected) {
                                const cmdWords = ["whoami", "uname -a", "/bin/sh", "/bin/bash", "; whoami", "&& id", "ping -c", "wget", "curl"];
                                cmdWords.forEach(c => { if (inputLower.includes(c)) { matches.push(c); detected = true; category = 'Command Injection'; risk = 'Critical'; } });
                              }

                              // 5. Credential Stuffing
                              if (!detected) {
                                const stuffWords = ["username=admin", "password=admin", "username=test", "username=root"];
                                stuffWords.forEach(s => { if (inputLower.includes(s)) { matches.push(s); detected = true; category = 'Credential Stuffing Attempt'; risk = 'High'; } });
                              }

                              setIsAnalyzingSandbox(false);
                              setDetectiveSandboxResult({
                                isMatch: detected,
                                category: category || 'Safe Traffic Signal',
                                risk: risk,
                                matches: matches,
                                report: detected 
                                  ? `Detected hazardous indicators matching malicious ${category} parameters. Threat blocked automatically by cyber active shield.`
                                  : 'No suspicious markers found. Input corresponds to typical compliant protocol requests.'
                              });
                            }, 1200);
                          }}
                          disabled={isAnalyzingSandbox || !detectiveSandboxInput.trim()}
                          className="flex-grow py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md shadow-red-600/20"
                        >
                          {isAnalyzingSandbox ? 'Running Active Probing...' : '🚀 Run Sentry Scan'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDetectiveSandboxInput('');
                            setDetectiveSandboxResult(null);
                          }}
                          className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    {/* Sandbox Analysis Result Display */}
                    <AnimatePresence>
                      {detectiveSandboxResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className={`p-4 rounded-2xl border ${detectiveSandboxResult.isMatch ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${detectiveSandboxResult.isMatch ? 'text-red-400' : 'text-emerald-400'}`}>
                              {detectiveSandboxResult.category}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black ${detectiveSandboxResult.risk === 'Critical' ? 'bg-red-600 text-white' : detectiveSandboxResult.risk === 'High' ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'}`}>
                              {detectiveSandboxResult.risk} RISK
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-200 leading-relaxed uppercase">{detectiveSandboxResult.report}</p>
                          {detectiveSandboxResult.matches.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1 items-center">
                              <span className="text-[8px] font-black text-slate-500 uppercase mr-1">Violated Keys:</span>
                              {detectiveSandboxResult.matches.map((m: string, idx: number) => (
                                <span key={idx} className="bg-red-950 border border-red-500/30 text-[9px] font-mono font-black text-red-400 px-1.5 rounded uppercase">
                                  {m}
                                </span>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Active Reference Database of Sensitive Indicators */}
                  <div className="lg:col-span-7 bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] shadow-2xl space-y-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileSearch className="w-5 h-5 text-indigo-400 shrink-0" />
                          <div>
                            <h4 className="text-sm font-black uppercase tracking-wider">Master Sensitive Redflags database</h4>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Compiling suspicious phrases watched across ledger routes</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            // Inject random global scan log
                            const countries = [
                              { name: 'Nigeria', ip: '102.89.34.' + Math.floor(Math.random()*254), coords: '6.5244° N, 3.3792° E' },
                              { name: 'United Kingdom', ip: '82.80.122.' + Math.floor(Math.random()*254), coords: '51.5074° N, 0.1278° W' },
                              { name: 'Russia', ip: '185.22.140.' + Math.floor(Math.random()*254), coords: '55.7558° N, 37.6173° E' },
                              { name: 'China', ip: '111.206.52.' + Math.floor(Math.random()*254), coords: '39.9042° N, 116.4074° E' },
                              { name: 'United States', ip: '198.51.100.' + Math.floor(Math.random()*254), coords: '40.7128° N, 74.0060° W' }
                            ];
                            const attacks = [
                              { cat: 'SQL Injection', payload: "' UNION SELECT @@version, password, 1--", risk: 'Critical', action: 'Hacked characters dropped, Sentry sandbox defensive' },
                              { cat: 'Cross-Site Scripting (XSS)', payload: "<img src=x onerror=alert('xss')>", risk: 'High', action: 'Input stripped, security lock holds tokens' },
                              { cat: 'Path Traversal', payload: "..\\..\\..\\windows\\win.ini", risk: 'High', action: 'System routing denied' },
                              { cat: 'Command Injection', payload: "ping -c 5 127.0.0.1", risk: 'Critical', action: 'Native CPU system locks command stack' },
                              { cat: 'Credential Stuffing', payload: "username=administrator&password=Passw0rd", risk: 'Critical', action: 'IP flagged, dual clearance held' }
                            ];
                            const randomC = countries[Math.floor(Math.random()*countries.length)];
                            const randomA = attacks[Math.floor(Math.random()*attacks.length)];

                            const newLog = {
                              id: 'dt-injected-' + Date.now(),
                              timestamp: new Date().toLocaleString(),
                              country: randomC.name,
                              coords: `${randomC.coords} (${randomC.name === 'United Kingdom' ? 'London' : randomC.name === 'Russia' ? 'Moscow' : randomC.name})`,
                              ip: randomC.ip,
                              category: randomA.cat,
                              payload: randomA.payload,
                              target: 'Central sovereign eFADO gateway',
                              risk: randomA.risk,
                              action: randomA.action
                            };

                            setDetectiveLogs(prev => [newLog, ...prev]);
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.03] active:scale-95 transition-all text-white font-black text-[9px] uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-600/25 text-center"
                        >
                          🚨 Trigger Threat Simulation Packet
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1 font-display">1. SQLi Escapes & Keywords</span>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-tight mb-2">Escaping parameters & single quotes watched:</p>
                          <div className="flex flex-wrap gap-1 overflow-y-auto max-h-24 no-scrollbar">
                            {["'", "\"", "%27", "%22", "\\'", "`", "%60", "--", "#", "/*", "*/", ";--", ";%00", "UNION", "SELECT", "FROM", "WHERE", "DROP", "xp_cmdshell", "information_schema"].map((k, i) => (
                              <span key={i} className="px-1 py-0.5 bg-slate-900 border border-white/5 rounded text-[8px] font-mono text-indigo-300 font-bold">{k}</span>
                            ))}
                          </div>
                        </div>

                        <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                          <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest block mb-1 font-display">2. XSS Elements & Event Handlers</span>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-tight mb-2">Script tags and event handlers monitored:</p>
                          <div className="flex flex-wrap gap-1 overflow-y-auto max-h-24 no-scrollbar">
                            {["<script>", "<img>", "<svg>", "onerror", "onload", "onclick", "document.cookie", "eval()", "document.write", "javascript:", "%3Cscript%3E"].map((k, i) => (
                              <span key={i} className="px-1 py-0.5 bg-slate-900 border border-white/5 rounded text-[8px] font-mono text-violet-300 font-bold">{k}</span>
                            ))}
                          </div>
                        </div>

                        <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block mb-1 font-display">3. Path Traversal & LFI Keys</span>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-tight mb-2">Directory traversal indicators and PHP wrappers:</p>
                          <div className="flex flex-wrap gap-1 overflow-y-auto max-h-24 no-scrollbar">
                            {["../", "..\\", "%2e%2e%2f", "%2e%2e%5c", "/etc/passwd", "win.ini", "php://filter", "php://input", "data://", "expect://"].map((k, i) => (
                              <span key={i} className="px-1 py-0.5 bg-slate-900 border border-white/5 rounded text-[8px] font-mono text-amber-300 font-bold">{k}</span>
                            ))}
                          </div>
                        </div>

                        <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                          <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-1 font-display">4. Command Exec separators</span>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-tight mb-2">Command separators and binary execution commands:</p>
                          <div className="flex flex-wrap gap-1 overflow-y-auto max-h-24 no-scrollbar">
                            {[";", "|", "||", "&", "&&", "`", "$()", "whoami", "uname -a", "cat", "/bin/sh", "/bin/bash", "cmd.exe", "ping", "wget", "curl"].map((k, i) => (
                              <span key={i} className="px-1 py-0.5 bg-slate-900 border border-white/5 rounded text-[8px] font-mono text-rose-300 font-bold">{k}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-2xl border border-red-500/20">
                      <div className="flex gap-2.5 items-start">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-[8.5px] text-slate-300 font-bold leading-normal uppercase">
                          🛡️ CEOP SENTRY SENSITIVITY LEVEL IN-USE: MAXIMUM PHALANX PARSING. ALL STRATEGIC SYSTEM FORMS AND GATEWAY URL PARAMETERS ARE FILTERED AUTOMATICALLY TO NEUTRALIZE DETECTED PATTERNS BEFORE INGRESS CORESET.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. DETAILS OF ALL DETECTED ACTIVITIES TIMELINE FROM THE GLOBE */}
                <div className="bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2.5">
                        <Globe className="w-6 h-6 text-indigo-400" />
                        GEOGRAPHIC DETECTED ACTIVITIES DECK
                      </h3>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Live streaming logs of eFADO security threats detected across local & global nodes</p>
                    </div>

                    <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar">
                      {[
                        { id: 'all', label: 'ALL THREATS' },
                        { id: 'sqli', label: 'SQLi' },
                        { id: 'xss', label: 'XSS' },
                        { id: 'paths', label: 'TRAVERSAL' },
                        { id: 'cmd', label: 'COMMAND' },
                        { id: 'brute', label: 'BRUTE FORCE' }
                      ].map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setDetectiveViewCategory(cat.id as any)}
                          className={`px-4 py-2 rounded-xl text-[8.5px] font-black uppercase tracking-widest transition-all ${detectiveViewCategory === cat.id ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-3xl border border-white/5">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-950/80 border-b border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-500">
                          <th className="p-4">Timestamp & Region</th>
                          <th className="p-4">Geographic Node IP</th>
                          <th className="p-4">Attack Vector Category</th>
                          <th className="p-4">Matched Offending Payload</th>
                          <th className="p-4">Sentry Shield Intervention Action Taken</th>
                          <th className="p-4 text-center">Severity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-bold uppercase tracking-tight">
                        {detectiveLogs
                          .filter(log => {
                            if (detectiveViewCategory === 'all') return true;
                            if (detectiveViewCategory === 'sqli') return log.category.toLowerCase().includes('sql');
                            if (detectiveViewCategory === 'xss') return log.category.toLowerCase().includes('cross') || log.category.toLowerCase().includes('xss');
                            if (detectiveViewCategory === 'paths') return log.category.toLowerCase().includes('path') || log.category.toLowerCase().includes('traversal');
                            if (detectiveViewCategory === 'cmd') return log.category.toLowerCase().includes('command');
                            if (detectiveViewCategory === 'brute') return log.category.toLowerCase().includes('stuffing') || log.category.toLowerCase().includes('brute') || log.category.toLowerCase().includes('credential');
                            return true;
                          })
                          .map((log) => (
                            <tr key={log.id} className="hover:bg-red-500/5 transition-all">
                              <td className="p-4 space-y-0.5">
                                <p className="text-white font-mono tracking-wider font-semibold text-[10px]">{log.timestamp}</p>
                                <p className="text-[9px] text-slate-400 font-sans tracking-tight">{log.country} • <span className="text-indigo-400 font-black">{log.coords}</span></p>
                              </td>
                              <td className="p-4">
                                <span className="font-mono bg-slate-900 border border-white/5 px-2.5 py-1 rounded text-[10.5px] text-slate-300 font-black tracking-widest">
                                  {log.ip}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`text-[10px] font-display font-black ${log.category.includes('SQL') ? 'text-indigo-400' : log.category.includes('XSS') ? 'text-violet-400' : log.category.includes('Path') ? 'text-amber-400' : log.category.includes('Command') ? 'text-rose-400' : 'text-emerald-400'}`}>
                                  {log.category}
                                </span>
                              </td>
                              <td className="p-4 max-w-[240px]">
                                <code className="block truncate font-mono bg-[#030712] text-[#34d399] p-2 rounded-lg text-[9px] leading-tight border border-white/5 lowercase">
                                  {log.payload}
                                </code>
                              </td>
                              <td className="p-4">
                                <p className="text-[10px] text-emerald-400/90 leading-relaxed font-black italic">{log.action}</p>
                              </td>
                              <td className="p-4 text-center">
                                <span className={`px-2 py-1 rounded text-[8px] font-black tracking-widest inline-block ${log.risk === 'Critical' ? 'bg-red-600 text-white animate-pulse' : log.risk === 'High' ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'}`}>
                                  {log.risk}
                                </span>
                              </td>
                            </tr>
                          ))}
                        {detectiveLogs.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-10 text-slate-400 uppercase tracking-widest text-[10px]">No geographic threats detected in this category</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'support' && (
              <motion.div 
                key="support"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8 text-left text-white"
              >
                {/* Support Command Center Header */}
                <div className="bg-gradient-to-r from-slate-955 via-indigo-950 to-slate-955 border border-white/5 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-yellow-400/[0.01] pointer-events-none" />
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-[#DAA520]/10 border border-[#DAA520]/30 flex items-center justify-center">
                      <MessageSquare className="w-9 h-9 text-[#DAA520]" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black font-display tracking-tight text-white uppercase flex items-center gap-2">
                        Executive Support & Forge Pitch Desk
                      </h3>
                      <p className="text-xs text-slate-300 font-bold uppercase tracking-widest mt-1">Direct Communication Platform and Strategic Technology Incubator Review</p>
                    </div>
                  </div>
                  <div className="flex gap-4 relative z-10">
                    <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl text-center">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Open Support Tickets</span>
                      <span className="text-lg font-black font-mono text-amber-400">{supportTickets.filter(t => t.status !== 'closed').length}</span>
                    </div>
                    <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl text-center">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Pitched Solutions</span>
                      <span className="text-lg font-black font-mono text-indigo-400">{incubatorIdeas.length}</span>
                    </div>
                  </div>
                </div>

                {/* Main Split Layout Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Panel: Support Tickets Moderator Console */}
                  <div className="lg:col-span-7 bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] shadow-2xl space-y-5">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <h4 className="text-base font-black uppercase tracking-wider text-white">Live Assistance Requests</h4>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#DAA520]">EFADO HelpDesk</span>
                    </div>

                    {supportTickets.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 bg-slate-950/40 rounded-3xl border border-white/5 text-center">
                        <MessageSquare className="w-12 h-12 text-slate-600 mb-3" />
                        <h5 className="font-bold text-slate-400 uppercase tracking-wider text-xs">No Help Requests Yet</h5>
                        <p className="text-[10px] text-slate-500 mt-1 max-w-sm px-4">All requests submitted by patrons encountering difficulties will emerge on this central terminal immediately.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto no-scrollbar">
                        {supportTickets.map((ticket) => (
                          <div 
                            key={ticket.id}
                            onClick={() => setSelectedSupportTicket(ticket)}
                            className={`p-4 rounded-2xl border text-left cursor-pointer transition-all space-y-2 ${
                              selectedSupportTicket?.id === ticket.id 
                                ? 'bg-indigo-950/20 border-indigo-500/40 shadow-xl' 
                                : 'bg-slate-950/30 border-white/5 hover:border-white/10 hover:bg-slate-950/55'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-black text-slate-400 font-mono uppercase">Ticket #{ticket.id.slice(0, 5)}</span>
                                <h5 className="text-xs font-black text-indigo-300 mt-0.5 uppercase">{ticket.category}</h5>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase ${
                                  ticket.priority === 'high' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {ticket.priority} prio
                                </span>
                                <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                  ticket.status === 'replied' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                                }`}>
                                  {ticket.status}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-slate-300 line-clamp-2">{ticket.message}</p>

                            <div className="flex justify-between items-center text-[9px] text-slate-500 pt-1 font-mono">
                              <span className="font-bold uppercase text-slate-400">Patron: {ticket.userDisplayName} ({ticket.userEmail})</span>
                              <span>{ticket.createdAt ? new Date(ticket.createdAt.seconds * 1000).toLocaleString() : 'Just now'}</span>
                            </div>

                            {/* Status controls */}
                            <div className="pt-2 flex gap-2 border-t border-white/5 mt-2">
                              {(['pending', 'reviewing', 'replied', 'closed'] as const).map((st) => (
                                <button
                                  key={st}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateTicketStatus(ticket.id, st);
                                  }}
                                  className={`px-2 py-1 text-[8px] font-mono font-black uppercase rounded-lg border transition-all ${
                                    ticket.status === st 
                                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200' 
                                      : 'bg-slate-900 border-[#ffffff]/5 text-slate-500 hover:text-white hover:bg-slate-950'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Panel: Active Messaging dialogue or Innovation reviews */}
                  <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* Ticketing chat dialog panel */}
                    <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] shadow-2xl flex-grow flex flex-col justify-between min-h-[400px]">
                      {selectedSupportTicket ? (
                        <div className="flex flex-col h-full justify-between flex-grow">
                          <div>
                            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                              <div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Dialogue Terminal</span>
                                <h4 className="text-xs font-black text-white uppercase mt-0.5">Assisting {selectedSupportTicket.userDisplayName}</h4>
                              </div>
                              <span className="text-[10px] font-mono text-indigo-400 tracking-wider">Status: {selectedSupportTicket.status}</span>
                            </div>

                            {/* Sub messages stream list */}
                            <div className="space-y-3 max-h-[220px] overflow-y-auto no-scrollbar scroll-smooth pr-1 mb-4">
                              {selectedSupportTicket.replies?.map((rep: any, idx: number) => {
                                const isCEO = rep.sender === 'CEO';
                                return (
                                  <div key={idx} className={`flex flex-col ${isCEO ? 'items-end' : 'items-start'}`}>
                                    <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider mb-0.5 px-1.5">{rep.senderName}</span>
                                    <div className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed border ${
                                      isCEO 
                                        ? 'bg-gradient-to-r from-indigo-900 to-indigo-950 text-white border-indigo-700/30 rounded-tr-none' 
                                        : 'bg-slate-950 text-slate-200 border-white/5 rounded-tl-none'
                                    }`}>
                                      <p className="break-words max-w-[280px]">{rep.text}</p>
                                      {rep.timestamp && (
                                        <span className="block text-[8px] text-right mt-1 opacity-45 font-mono">
                                          {new Date(rep.timestamp).toLocaleTimeString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Quick replies */}
                          <div>
                            <div className="flex flex-wrap gap-1 mb-3">
                              {[
                                'Hello! We are currently reviewing your request.',
                                'Winnings credited! Please verify your cashout wallet.',
                                'This error is fully resolved. Try refreshing page.',
                                'Thank you for your feedback!'
                              ].map((template) => (
                                <button
                                  key={template}
                                  onClick={() => setCeoReplyText(template)}
                                  className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[8px] rounded border border-white/5 transition-all text-left truncate max-w-[200px]"
                                >
                                  {template}
                                </button>
                              ))}
                            </div>

                            {/* Text inputs */}
                            <div className="flex gap-2">
                              <input
                                  type="text"
                                  placeholder="Write official supportive feedback..."
                                  value={ceoReplyText}
                                  onChange={(e) => setCeoReplyText(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleCeoSendReply()}
                                  className="flex-grow px-4 py-3 bg-slate-955 border border-white/5 rounded-2xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                              />
                              <button
                                onClick={handleCeoSendReply}
                                className="px-5 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest transition-all"
                              >
                                REPLY
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-grow flex flex-col items-center justify-center py-16 text-center">
                          <MessageSquare className="w-10 h-10 text-slate-700 mb-2 animate-pulse" />
                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Assistance Conversation</h5>
                          <p className="text-[10px] text-slate-600 mt-1 uppercase max-w-xs leading-relaxed col-span-1 border border-[#ffffff]/0">Choose any ticket on the left to activate streaming console dialog and send supportive feedback as CEO.</p>
                        </div>
                      )}
                    </div>

                    {/* Startup Incubator Pitch desk evaluations */}
                    <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] shadow-2xl flex-grow flex flex-col justify-between">
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <h4 className="text-xs font-black uppercase tracking-wider">Startup Pitch Evaluator</h4>
                        <span className="text-[9px] font-black text-indigo-400 font-mono">Forge Incubator</span>
                      </div>

                      {incubatorIdeas.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center">
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">No pitches submitted to Incubator</p>
                          <p className="text-[8px] text-slate-600 mt-1 max-w-xs leading-relaxed">Standard users submit tech start-up plans via the Innovation Forge to the CEO's Strategic Feedback Panel.</p>
                        </div>
                      ) : (
                        <div className="space-y-4 pt-3">
                          <select
                            onChange={(e) => {
                              const selected = incubatorIdeas.find(idx => idx.id === e.target.value);
                              setSelectedIncubatorIdea(selected || null);
                            }}
                            className="w-full px-3 py-2 bg-slate-1000 border border-white/5 rounded-xl text-xs text-white outline-none bg-slate-950"
                            defaultValue=""
                          >
                            <option value="" disabled>-- SELECT PITCH PROPOSAL ({incubatorIdeas.length}) --</option>
                            {incubatorIdeas.map((plan) => (
                              <option key={plan.id} value={plan.id} className="bg-slate-950 text-white">{plan.title} [By {plan.userEmail.split('@')[0]}]</option>
                            ))}
                          </select>

                          {selectedIncubatorIdea && (
                            <div className="space-y-3 text-left">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-bold text-[#DAA520]">Stack: {selectedIncubatorIdea.stack || 'Custom Stack'}</span>
                                <span className="font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded font-black uppercase">{selectedIncubatorIdea.status}</span>
                              </div>

                              <div className="bg-slate-950 p-3 rounded-2xl border border-white/5 text-xs text-slate-300 space-y-2">
                                <p className="font-bold uppercase text-[9px] text-slate-500">Summary Pitch Outline:</p>
                                <p className="leading-relaxed font-semibold italic">"{selectedIncubatorIdea.pitch}"</p>
                                <div className="grid grid-cols-2 gap-2 pt-2 text-[9px] uppercase font-mono border-t border-white/5">
                                  <span>Region: <b className="text-white">{selectedIncubatorIdea.region || 'Pan-African'}</b></span>
                                  <span>Needs: <b className="text-white">{selectedIncubatorIdea.needs || '$5,000 Seed'}</b></span>
                                </div>
                              </div>

                              {/* Feasibility Scoring indicators */}
                              {selectedIncubatorIdea.scores && (
                                <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-xl border border-white/5 text-center text-[9px] font-mono">
                                  <div>
                                    <span className="block text-slate-500 font-bold">MARKET</span>
                                    <b className="text-[#6df2FF] text-xs font-black">{selectedIncubatorIdea.scores.market}%</b>
                                  </div>
                                  <div>
                                    <span className="block text-slate-500 font-bold">FEASIBILITY</span>
                                    <b className="text-indigo-400 text-xs font-black">{selectedIncubatorIdea.scores.feasibility}%</b>
                                  </div>
                                  <div>
                                    <span className="block text-slate-500 font-bold">IMPACT</span>
                                    <b className="text-purple-400 text-xs font-black">{selectedIncubatorIdea.scores.social}%</b>
                                  </div>
                                </div>
                              )}

                              {/* CEO Strategic response */}
                              <div className="space-y-2 pt-1 border-t border-white/5">
                                <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider pl-1 font-mono">Strategic Recommendation / Response</label>
                                {selectedIncubatorIdea.ceoFeedback ? (
                                  <div className="p-3 bg-slate-950 rounded-xl border border-[#DAA520]/20 font-mono text-[9px] leading-relaxed text-[#DAA520]">
                                    <b>CEO DECISION:</b> {selectedIncubatorIdea.ceoFeedback}
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      placeholder="Incubator strategic directions..."
                                      value={pitchFeedbackText}
                                      onChange={(e) => setPitchFeedbackText(e.target.value)}
                                      className="flex-grow px-3 py-2 bg-slate-955 border border-[#ffffff]/5 text-[10px] text-white rounded-xl placeholder-slate-600 outline-none focus:border-indigo-500"
                                    />
                                    <button
                                      onClick={() => handleSendPitchFeedback(selectedIncubatorIdea.id)}
                                      className="px-3 bg-[#DAA520] text-slate-950 text-[9px] font-black uppercase tracking-wider rounded-xl hover:bg-yellow-400 transition-all font-sans"
                                    >
                                      DECIDE
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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

      {/* CEO Admin Withdrawal Modal */}
      <AnimatePresence>
        {showAdminWithdrawModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl golden-card-border"
            >
              {/* Header */}
              <div className="p-8 border-b border-white/5 bg-slate-900/50 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">Withdraw CEO Benefit</h3>
                  <p className="text-xs text-slate-400 mt-1">Direct payout from available Admin Wallet balance</p>
                </div>
                <button 
                  onClick={() => setShowAdminWithdrawModal(false)}
                  className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-left">
                    Amount to Withdraw (USD)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
                    <input 
                      type="number"
                      placeholder="0.00"
                      value={withdrawAdminAmount || ''}
                      onChange={(e) => setWithdrawAdminAmount(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white focus:border-indigo-500 outline-none transition-all text-xl font-black font-display text-left"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 text-left mt-2">
                    Available balance: <span className="text-white font-black">${adminStats?.adminWallet.toLocaleString() || '0.00'}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-left">
                    Destination Bank / Platform
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Access Bank Pls"
                    value={adminWithdrawDetails.bankName}
                    onChange={(e) => setAdminWithdrawDetails({ ...adminWithdrawDetails, bankName: e.target.value })}
                    className="w-full bg-slate-800 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-indigo-500 outline-none transition-all font-medium text-left"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-left">
                      Account / Wallet Number
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. 1012356789"
                      value={adminWithdrawDetails.accountNumber}
                      onChange={(e) => setAdminWithdrawDetails({ ...adminWithdrawDetails, accountNumber: e.target.value })}
                      className="w-full bg-slate-800 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-indigo-500 outline-none transition-all font-mono text-left"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-left">
                      Account Name / Signature
                    </label>
                    <input 
                      type="text"
                      placeholder="CEO Name"
                      value={adminWithdrawDetails.accountName}
                      onChange={(e) => setAdminWithdrawDetails({ ...adminWithdrawDetails, accountName: e.target.value })}
                      className="w-full bg-slate-800 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-indigo-500 outline-none transition-all font-medium text-left"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={handleWithdrawAdminWallet}
                    disabled={isProcessing || withdrawAdminAmount <= 0 || withdrawAdminAmount > (adminStats?.adminWallet || 0)}
                    className="flex-grow py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing Payout...' : 'Process Withdrawal'}
                  </button>
                  <button 
                    onClick={() => setShowAdminWithdrawModal(false)}
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

      {/* Standard Monetization Extraction Modal */}
      <AnimatePresence>
        {showMonWithdrawalModal && selectedMonBank && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-amber-500/20 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              {/* Gold header */}
              <div className="p-8 border-b border-white/5 bg-gradient-to-r from-amber-950/40 to-indigo-950/40 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-display font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-amber-500" /> Monetization Extraction Gate
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Direct wire payout validation logic cleared to target accounts</p>
                </div>
                <button 
                  onClick={() => setShowMonWithdrawalModal(false)}
                  className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {monWithdrawSuccess ? (
                <div className="p-8 text-center space-y-6">
                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-black text-white uppercase tracking-tight">Ledger Clearance Verified!</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Sovereign funds wire initiated from <strong>{selectedMonBank.name}</strong> has been cleared successfully. The payout of <strong>{selectedMonBank.baseCurrency}{monWithdrawAmount}</strong> will reflect on your out-channel bank within immediate routing hours.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 text-left font-mono text-[9px] text-slate-500 space-y-1">
                    <p>TRANSACTION ID: MWT-{Math.floor(Math.random() * 900000 + 100000)}</p>
                    <p>ORIGIN NODE: AI_STUDIO_STEWARD_BYPASS</p>
                    <p>SETTLEMENT TYPE: AD_REV_COMMISSION_SPLIT</p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowMonWithdrawalModal(false);
                      setMonWithdrawSuccess(false);
                    }}
                    className="w-full py-4 bg-amber-500 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs transition-transform active:scale-95"
                  >
                    Complete Session
                  </button>
                </div>
              ) : (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleMonWithdrawal(e);
                  }} 
                  className="p-8 space-y-6"
                >
                  {monWithdrawError && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 text-left font-bold">
                      ⚠ {monWithdrawError}
                    </div>
                  )}

                  <div>
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">
                       Source Wallet Origin
                     </label>
                     <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl text-left">
                       <p className="text-xs font-black text-white uppercase italic">{selectedMonBank.name}</p>
                       <p className="text-[10px] text-[#DAA520] font-black uppercase tracking-widest mt-1">
                         Current balance: {selectedMonBank.baseCurrency}{selectedMonBank.balance.toLocaleString()}
                       </p>
                     </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 text-left">
                      Amount to Extract ({selectedMonBank.baseCurrency})
                    </label>
                    <input 
                      type="number"
                      placeholder="Enter amount..."
                      value={monWithdrawAmount || ''}
                      onChange={(e) => setMonWithdrawAmount(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-amber-500 outline-none transition-all text-xl font-black font-mono text-left"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 text-left">
                      Destination Clearance Address / Wire Instructions
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Okhawere Festus Daniel UBA Savings Acc or TRX wallet"
                      value={monWithdrawDest}
                      onChange={(e) => setMonWithdrawDest(e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-amber-500 outline-none transition-all text-xs font-medium text-left"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button 
                      type="submit"
                      disabled={isProcessingMonWithdraw}
                      className="flex-grow py-4 bg-[#DAA520] text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                      {isProcessingMonWithdraw ? 'Clearing Bank Wire...' : 'Authorize Extraction Wireless'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowMonWithdrawalModal(false)}
                      className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

        </motion.div>
      )}
    </AnimatePresence>
  );
};
