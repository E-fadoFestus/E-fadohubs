import React, { useState, useEffect } from 'react';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  updateDoc, 
  addDoc,
  increment,
  collection, 
  onSnapshot, 
  serverTimestamp,
  runTransaction,
  query,
  where,
  orderBy
} from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously,
  updateProfile, 
  sendEmailVerification 
} from 'firebase/auth';
import { UserProfile, Transaction, AdminStats, Announcement } from './types';
import { WalletCard, WalletGrid } from './components/WalletCard';
import { LuckySpinWheel } from './components/LuckySpinWheel';
import { DigitalMoneyTrading } from './components/DigitalMoneyTrading';
import { EfadoMoneyCard } from './components/EfadoMoneyCard';
import { CeoPortal } from './components/CeoPortal';
import { CeoVerification } from './components/CeoVerification';
import { FairlyUsedMarket } from './components/FairlyUsedMarket';
import { ModernMarketHub } from './components/ModernMarketHub';
import { EfadoGistHub } from './components/EfadoGistHub';
import { EfadoServiceCorps } from './components/EfadoServiceCorps';
import { EfadoCommunityHubs } from './components/EfadoCommunityHubs';
import { EfadoHepiHandsLoan } from './components/EfadoHepiHandsLoan';
import { EfadoHomePage } from './components/EfadoHomePage';
import { EfadoDomainHub } from './components/EfadoDomainHub';
import { EfadoMoneyQuiz } from './components/EfadoMoneyQuiz';
import { EfadoEquilibrium } from './components/EfadoEquilibrium';
import { DeepSeaJetGame } from './components/DeepSeaJetGame';
import { EfadoEducationHub } from './components/EfadoEducationHub';
import { VerticalHubsPage } from './components/VerticalHubsPage';
import { UniversalHubPage } from './components/UniversalHubPage';
import { HUBS, getHubBySlug } from './config/hubs';
import { EfadoTechHub } from './components/tech/EfadoTechHub';
import { EfadoZoom } from './components/EfadoZoom';
import { SupportHelpModal } from './components/SupportHelpModal';
import { EfadoZoomPlanSelection } from './components/EfadoZoomPlanSelection';
import { EfadoLogo } from './components/EfadoLogo';
import { EfadoPartnerHub } from './components/EfadoPartnerHub';
import { EfadoDigitalServicesHub } from './components/EfadoDigitalServicesHub';
import { CSCCRegistration } from './components/CSCCRegistration';
import { HubHeroCarousel } from './components/HubHeroCarousel';
import { UserWallet } from './components/UserWallet';
import { EfadoMining } from './components/EfadoMining';
import { EfadoAdvertisingHub } from './components/EfadoAdvertisingHub';
import { PublicAdvertPage } from './components/PublicAdvertPage';
import { EfadoCosmicWelcome } from './components/EfadoCosmicWelcome';
import { EfadoIntelligenceFeed } from './components/EfadoIntelligenceFeed';
import { UserGuideModal } from './components/UserGuideModal';
import { LegalHub } from './components/LegalHub';
import { AboutCeoModal } from './components/AboutCeoModal';
import { IosInstallGuideModal } from './components/IosInstallGuideModal';
import { PaymentCallback } from './components/PaymentCallback';
import { getBackendUrl } from './config/backend';
import { AdSenseBanner } from './components/AdSenseBanner';
import { 
  Info,  Wallet, Lock,
  LogOut, 
  LogIn, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  History, 
  ShieldCheck, 
  TrendingUp, 
  AlertCircle,
  AlertTriangle,
  Coins,
  Zap,
  Dices,
  CreditCard,
  Settings,
  Megaphone,
  X,
  ShoppingBag,
  ShoppingBasket,
  Gamepad2,
  MessageSquare,
  HardHat,
  Users,
  HandCoins,
  Home, 
  Globe, 
  Brain, 
  UserPlus, 
  GraduationCap, 
  Building,
  Award,
  BookOpen,
  Video,
  Cpu,
  HelpCircle,
  UserCheck,
  Package,
  Share2,
  Handshake,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  ArrowUp,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Smartphone,
  Laptop,
  Target,
  Compass,
  Waves,
  Anchor
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CurrencyProvider, useCurrency } from './lib/CurrencyContext';
import { CurrencySelector } from './components/CurrencySelector';
import { TextSizeSelector } from './components/TextSizeSelector';
import {
  ACTIVE_WALLET_CURRENCIES,
  formatCurrencyAmount,
  isDisabledFutureCurrency,
  normalizeCurrencyCode
} from './constants/walletCurrencies';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // In a real app, we might throw or show a toast
}

const NocturnalBackground: React.FC = () => {
  return (
    <div className="nocturnal-pulse select-none pointer-events-none">
      {/* Dynamic Nebula Layers */}
      <div className="nebula-layer" />
      <div className="nebula-layer" style={{ animationDelay: '-20s', opacity: 0.4 }} />
      
      {/* Floating Stardust */}
      {[...Array(20)].map((_, i) => (
        <div 
          key={i}
          className="star-point" 
          style={{ 
            top: `${Math.random() * 100}%`, 
            left: `${Math.random() * 100}%`,
            animation: `starlight ${3 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`
          }}
        />
      ))}

      {/* Occasional Meteors */}
      {[...Array(3)].map((_, i) => (
        <div 
          key={i}
          className="meteor-streak" 
          style={{ 
            top: `${Math.random() * 50}%`, 
            left: `${Math.random() * 50}%`,
            animationDelay: `${i * 3 + Math.random() * 2}s`
          }}
        />
      ))}
      
      {/* Connectivity Mesh */}
      <div className="connect-mesh opacity-30 shrink-0" />
      
      {/* Scanning Line Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-400/10 to-transparent h-1 w-full translate-y-[-100%] animate-[scan_15s_linear_infinite]" />
    </div>
  );
};

const DEVELOPMENT_MODE = false;

export default function App() {
  return (
    <BrowserRouter>
      <CurrencyProvider>
        <AppContent />
      </CurrencyProvider>
    </BrowserRouter>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserProfile | null>(() => {
    // Attempt to load from cache for instant zero-latency UI rendering on app mount
    const cached = localStorage.getItem('efado_cached_user');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        console.log('E-FADO: Cache Hit! Instant workspace rendering active.');
        return parsed;
      } catch (e) {
        console.error('Failed to parse cached profile:', e);
        return null;
      }
    }
    return null;
  });
  const { selectedCurrency, formatPrice } = useCurrency();
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  // Transaction Table UX Enhancements (Collapsible details, search/filter, pagination, scrolling)
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [filterSender, setFilterSender] = useState('');
  const [filterReceiver, setFilterReceiver] = useState('');
  const [highlightedTxId, setHighlightedTxId] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showSyndicationBanner, setShowSyndicationBanner] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredTransactions = transactions.filter(tx => {
    // 1. Text Search Query matching multiple fields
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const hasMatch = 
        (tx.type && tx.type.toLowerCase().includes(q)) ||
        (tx.purpose && tx.purpose.toLowerCase().includes(q)) ||
        (tx.description && tx.description.toLowerCase().includes(q)) ||
        (tx.reference && tx.reference.toLowerCase().includes(q)) ||
        (tx.hub && tx.hub.toLowerCase().includes(q)) ||
        (tx.status && tx.status.toLowerCase().includes(q)) ||
        (tx.amount && String(tx.amount).includes(q)) ||
        (tx.metadata?.senderName && tx.metadata.senderName.toLowerCase().includes(q)) ||
        (tx.metadata?.receiverName && tx.metadata.receiverName.toLowerCase().includes(q));
      if (!hasMatch) return false;
    }

    // 2. Sender Name Filter
    if (filterSender.trim()) {
      const s = filterSender.toLowerCase();
      const matchSender = 
        (tx.metadata?.senderName && tx.metadata.senderName.toLowerCase().includes(s)) ||
        (tx.purpose && tx.purpose.toLowerCase().includes(s)) ||
        (tx.description && tx.description.toLowerCase().includes(s));
      if (!matchSender) return false;
    }

    // 3. Receiver Name Filter
    if (filterReceiver.trim()) {
      const r = filterReceiver.toLowerCase();
      const matchReceiver = 
        (tx.metadata?.receiverName && tx.metadata.receiverName.toLowerCase().includes(r)) ||
        (tx.purpose && tx.purpose.toLowerCase().includes(r)) ||
        (tx.description && tx.description.toLowerCase().includes(r));
      if (!matchReceiver) return false;
    }

    // 4. Type Filter
    if (filterType !== 'ALL') {
      if (tx.type.toLowerCase() !== filterType.toLowerCase()) return false;
    }

    // 5. Status Filter
    if (filterStatus !== 'ALL') {
      if (tx.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
    }

    // 6. Min Amount Filter
    if (filterMinAmount) {
      const minAm = parseFloat(filterMinAmount);
      if (!isNaN(minAm) && (tx.amount || 0) < minAm) return false;
    }

    // 7. Max Amount Filter
    if (filterMaxAmount) {
      const maxAm = parseFloat(filterMaxAmount);
      if (!isNaN(maxAm) && (tx.amount || 0) > maxAm) return false;
    }

    // 8. Date Range Filter
    if (filterStartDate) {
      const start = new Date(filterStartDate);
      const txDate = tx.timestamp?.toDate ? tx.timestamp.toDate() : new Date();
      start.setHours(0,0,0,0);
      if (txDate < start) return false;
    }
    if (filterEndDate) {
      const end = new Date(filterEndDate);
      const txDate = tx.timestamp?.toDate ? tx.timestamp.toDate() : new Date();
      end.setHours(23,59,59,999);
      if (txDate > end) return false;
    }

    return true;
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([]);
  const [loading, setLoading] = useState(() => {
    // If we have a cached user, we can render the dashboard immediately (no spinner needed)
    const cached = localStorage.getItem('efado_cached_user');
    if (cached) return false;
    
    // If no cache, but they had an active session, show loading while verifying auth
    const sessionExists = localStorage.getItem('efado_user_session_exists') === 'true';
    return sessionExists;
  });
  const [isSpinning, setIsSpinning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveUsers, setLiveUsers] = useState(1240);

  // Super Admin login states
  const [loginMode, setLoginMode] = useState<'STANDARD' | 'CEO'>('STANDARD');
  
  // Standard User email-based auth states (for fallback logins on WhatsApp / webview / custom domain errors)
  const [standardEmailMode, setStandardEmailMode] = useState<'GOOGLE' | 'EMAIL_LOGIN' | 'EMAIL_REGISTER'>('GOOGLE');
  const [quickNameOrPhone, setQuickNameOrPhone] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [standardEmail, setStandardEmail] = useState('');
  const [standardPassword, setStandardPassword] = useState('');
  const [standardDisplayName, setStandardDisplayName] = useState('');
  const [standardRegisterSuccess, setStandardRegisterSuccess] = useState<string | null>(null);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  // Progressive Web App (PWA) Installation, Connectivity, and iOS State Guides
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showIosInstallGuide, setShowIosInstallGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isUserInAppBrowser = () => {
      if (typeof navigator === 'undefined') return false;
      const ua = navigator.userAgent || navigator.vendor || (window as any).opera || "";
      return (
        /FBAN|FBAV|Instagram|WhatsApp|Line|IABMV|wv|[\bwv\b]|gsa|Messenger/i.test(ua) ||
        ( /iPhone|iPad|iPod/i.test(ua) && !/Safari/i.test(ua) && !/CriOS/i.test(ua) && !/FxiOS/i.test(ua) )
      );
    };
    setIsInAppBrowser(isUserInAppBrowser());

    // Detect iOS
    const checkIsIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(checkIsIOS);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('EFADO: Progressive Web App installed successfully!');
    };

    const handleOnlineStatus = () => setIsOnline(true);
    const handleOfflineStatus = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);

    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOfflineStatus);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`EFADO: User choice outcome: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  useEffect(() => {
    if (user) {
      localStorage.setItem('efado_cached_user', JSON.stringify(user));
      localStorage.setItem('efado_user_session_exists', 'true');
    } else {
      localStorage.removeItem('efado_cached_user');
      localStorage.removeItem('efado_user_session_exists');
    }
  }, [user]);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [dynamicCeoPassword, setDynamicCeoPassword] = useState<string>('EFADO_CEO_2026');
  const [otpStep, setOtpStep] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [currentOtpCode, setCurrentOtpCode] = useState('');
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpMessage, setOtpMessage] = useState('');
  const [simulatedSmsCode, setSimulatedSmsCode] = useState('');
  const [showSmsPopup, setShowSmsPopup] = useState(false);
  const [authorizedSmsRecipient, setAuthorizedSmsRecipient] = useState('');

  useEffect(() => {
    if (!user) return;
    // Keep dynamic CEO password synchronized from centralized system settings in Firestore
    const unsub = onSnapshot(doc(db, 'adminStats', 'settings'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.ceoPassword) {
          setDynamicCeoPassword(data.ceoPassword.trim());
          console.log('Centralized CEO Authorization Credential synced safely.');
        }
      }
    }, (e) => {
      console.warn("Settings fetch not authorized yet or failed:", e.message);
    });
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveUsers(prev => prev + Math.floor(Math.random() * 11) - 5);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [showTradingGame, setShowTradingGame] = useState(false);
  const [showMoneyCard, setShowMoneyCard] = useState(false);
  const [showCeoPortal, setShowCeoPortal] = useState(false);
  const [showCeoVerification, setShowCeoVerification] = useState(false);
  const [isCeoVerified, setIsCeoVerified] = useState(false);
  const [newHelpInboxCount, setNewHelpInboxCount] = useState(0);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setNewHelpInboxCount(0);
      return;
    }
    const q = query(collection(db, 'help_inbox'), where('status', '==', 'New'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setNewHelpInboxCount(snap.size);
      },
      (err) => {
        console.warn('Help inbox badge listener:', err.message);
      }
    );
    return () => unsub();
  }, [user?.uid, user?.role]);
  const [showMarketHub, setShowMarketHub] = useState(false);
  const [showModernMarket, setShowModernMarket] = useState(false);
  const [showGistHub, setShowGistHub] = useState(false);
  const [showServiceCorps, setShowServiceCorps] = useState(false);
  const [showCommunityHub, setShowCommunityHub] = useState(false);
  const [showHepiHandsLoan, setShowHepiHandsLoan] = useState(false);
  const [showDomainHub, setShowDomainHub] = useState(false);
  const [domainHubSection, setDomainHubSection] = useState<'domains' | 'course' | 'tools' | 'vending' | 'otc' | 'sourcing'>('domains');
  const [showCSCCRegistration, setShowCSCCRegistration] = useState(false);
  const [showEducationHub, setShowEducationHub] = useState(false);
  const [eduSectionId, setEduSectionId] = useState<string | undefined>(undefined);

  const openEducationHubWithSection = (sectionId?: string) => {
    setEduSectionId(sectionId);
    setShowEducationHub(true);
  };

  const [showMoneyQuiz, setShowMoneyQuiz] = useState(false);
  const [showEquilibrium, setShowEquilibrium] = useState(false);
  const [showDeepSeaJet, setShowDeepSeaJet] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [walletInitialTab, setWalletInitialTab] = useState<'overview' | 'profile' | 'deposit' | 'withdraw' | 'history' | 'settings'>('overview');
  
  const openWalletWithTab = (tab: 'overview' | 'profile' | 'deposit' | 'withdraw' | 'history' | 'settings' = 'overview') => {
    if (!user) {
      handleLogin();
      return;
    }
    const validTabs = ['overview', 'profile', 'deposit', 'withdraw', 'history', 'settings'] as const;
    const safeTab = typeof tab === 'string' && (validTabs as readonly string[]).includes(tab) ? tab : 'overview';
    setWalletInitialTab(safeTab);
    setShowWallet(true);
  };

  const renderWalletModal = () => (
    <AnimatePresence>
      {showWallet && user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowWallet(false)}
          className="fixed inset-0 z-[999] flex items-center justify-center p-2 sm:p-4 bg-slate-900/55 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[1200px] max-h-[94vh] overflow-y-auto no-scrollbar rounded-3xl bg-[#FAF8FF] shadow-2xl border border-purple-200"
          >
            <UserWallet
              user={user}
              onUpdateBalance={handleWalletUpdate}
              onClose={() => setShowWallet(false)}
              initialTab={walletInitialTab}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const [isPaymentCallback, setIsPaymentCallback] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      const h = window.location.hash.toLowerCase();
      return p.startsWith('/payment/callback') || h.startsWith('#/payment/callback') || h.startsWith('#payment/callback');
    }
    return false;
  });

  const [showEfadoMining, setShowEfadoMining] = useState(false);
  const [showAdvertisingHub, setShowAdvertisingHub] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [showAboutCeo, setShowAboutCeo] = useState(false);
  const [adInitialType, setAdInitialType] = useState<'ADVERT' | 'SELL'>('ADVERT');
  const [globalAdListings, setGlobalAdListings] = useState<any[]>([]);
  const [showBrowserAddonModal, setShowBrowserAddonModal] = useState(false);
  const [selectedAdForDirectBuy, setSelectedAdForDirectBuy] = useState<any | null>(null);

  const handleMiningUpdate = async (monetaryAmount: number) => {
    if (!user) return;
    
    if (DEVELOPMENT_MODE) {
      setUser({
        ...user,
        miningWallet: (user.miningWallet || 0) + (monetaryAmount * 100),
        cashOutWallet: user.cashOutWallet + monetaryAmount
      });
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        miningWallet: increment(monetaryAmount * 100),
        cashOutWallet: increment(monetaryAmount)
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'mining_credit');
    }
  };

  const syncServerGameLedger = async (
    gameId: 'spinGame' | 'moneyCard' | 'tradingGame' | 'equilibrium' | 'deepSeaJet' | 'moneyQuiz',
    stake: number,
    payout: number
  ) => {
    if (DEVELOPMENT_MODE) return;
    if (!Number.isFinite(stake) || !Number.isFinite(payout)) return;
    if (stake === 0 && payout === 0) return;
    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : null;
      if (!token) return;
      await fetch(getBackendUrl('/api/game/ledger'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ gameId, stake, payout })
      });
    } catch (err) {
      console.warn('[Server Game Ledger Sync Warning]:', err);
    }
  };

  const handleStakeDeduction = async (amount: number, gameId: string) => {
    const ngnBal = user?.walletPockets?.NGN ?? user?.depositWallet ?? 0;
    if (!user || ngnBal < amount) return;

    if (DEVELOPMENT_MODE) {
      const nextNgn = ngnBal - amount;
      setUser({
        ...user,
        depositWallet: nextNgn,
        walletPockets: { ...(user.walletPockets || {}), NGN: nextNgn }
      });
      if (adminStats) {
        setAdminStats({
          ...adminStats,
          adminWallet: adminStats.adminWallet + amount,
          totalHouseGain: adminStats.totalHouseGain + amount,
          gameWallets: {
            ...adminStats.gameWallets,
            [gameId]: ((adminStats.gameWallets as any)[gameId] || 0) + amount
          },
          lastUpdated: new Date()
        });
      }
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const walletPocketRef = doc(db, 'wallets', user.uid, 'NGN', 'depositWallet');
        const pocketSnap = await transaction.get(walletPocketRef);
        const curBal = pocketSnap.exists()
          ? Number(pocketSnap.data()?.balance ?? pocketSnap.data()?.depositWallet ?? 0) || 0
          : 0;
        if (curBal < amount) {
          throw new Error('INSUFFICIENT FUNDS in NGN Deposit Pocket');
        }

        const nextBal = curBal - amount;
        transaction.set(walletPocketRef, {
          balance: nextBal,
          depositWallet: nextBal,
          currency: 'NGN',
          userId: user.uid,
          updatedAt: serverTimestamp()
        }, { merge: true });
      });

      void syncServerGameLedger(gameId as any, amount, 0);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'stake_deduction_pocket');
      throw e;
    }
  };

  const [showEfadoZoom, setShowEfadoZoom] = useState(false);
  const [showZoomPlans, setShowZoomPlans] = useState(false);
  const [selectedZoomPlan, setSelectedZoomPlan] = useState<any>(null);
  const [activeZoomSession, setActiveZoomSession] = useState<any>(null);
  const [gistInitialView, setGistInitialView] = useState<'FEED' | 'REELS' | 'CHAT' | 'ADS' | 'PROFILE' | 'CATEGORIES' | 'BLOG' | 'FAQ' | 'TOOLS'>('FEED');
  const [gistAutoStartLive, setGistAutoStartLive] = useState(false);
  const [gistBargainContext, setGistBargainContext] = useState<any>(null);
  const [activeHub, setActiveHub] = useState<'HOME' | 'DASHBOARD' | 'GAMES' | 'MARKET' | 'GIST' | 'SERVICE_CORPS' | 'COMMUNITY_HUBS' | 'HEPIHANDS_LOAN' | 'DOMAIN_HUB' | 'EDUCATION' | 'ZOOM' | 'TECH' | 'ADVERTISING' | 'QUIZ' | 'PARTNER_HUB' | 'TECH_HUB' | 'FAIRLY_USED' | 'DIGITAL_SERVICES_HUB'>('HOME');
  const [digitalServicesSection, setDigitalServicesSection] = useState<'crypto' | 'money' | 'vending'>('crypto');
  const [activeReferralCode, setActiveReferralCode] = useState<string | null>(() => localStorage.getItem('efado_referral_code'));
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [showLegalHub, setShowLegalHub] = useState(false);
  const [legalHubSection, setLegalHubSection] = useState<'TERMS' | 'PRIVACY' | 'GAMING' | 'DISCLAIMER'>('TERMS');
  const [showTechHub, setShowTechHub] = useState(false);

  // 10+ Vertical Hubs Routing State (Shareable Links, 1 Login + 1 Wallet)
  const [verticalHubSlug, setVerticalHubSlug] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase().trim();
      if (p.startsWith('/hub/')) {
        const s = p.replace('/hub/', '').split('/')[0].split('?')[0].trim();
        const found = getHubBySlug(s);
        if (found) return found.slug;
      }
      const directMatch = p.replace(/^\/+|\/+$/g, '').split('/')[0].split('?')[0].trim();
      if (directMatch && directMatch !== 'home' && directMatch !== 'welcome') {
        const found = getHubBySlug(directMatch);
        if (found) return found.slug;
      }
      const h = window.location.hash.toLowerCase().trim();
      if (h.startsWith('#hub/') || h.startsWith('#/hub/')) {
        const s = h.replace(/^#\/?hub\//, '').split('?')[0].trim();
        const found = getHubBySlug(s);
        if (found) return found.slug;
      }
    }
    return null;
  });

  const [hubItemId, setHubItemId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase().trim();
      if (p.startsWith('/hub/')) {
        const parts = p.replace('/hub/', '').split('/').filter(Boolean);
        if (parts[1]) return parts[1].split('?')[0].trim();
      }
      const parts = p.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
      if (parts.length >= 2) return parts[1].split('?')[0].trim();
    }
    return null;
  });

  const [showVerticalHubsDirectory, setShowVerticalHubsDirectory] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase().trim();
      if (p === '/hubs' || p === '/vertical-hubs' || p === '/hub') return true;
      const h = window.location.hash.toLowerCase().trim();
      if (h === '#hubs' || h === '#/hubs' || h === '#vertical-hubs') return true;
    }
    return false;
  });

  const navigateToVerticalHub = (slug: string, inNewTab?: boolean, itemId?: string) => {
    if (slug === 'all-hubs' || slug === 'hubs') {
      if (inNewTab) {
        window.open('/hubs', '_blank', 'noopener,noreferrer');
        return;
      }
      navigate('/hubs');
      setShowVerticalHubsDirectory(true);
      setVerticalHubSlug(null);
      setHubItemId(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    let baseSlug = slug;
    let resolvedItemId = itemId;
    if (slug.includes('/')) {
      const segs = slug.split('/').filter(Boolean);
      baseSlug = segs[0] || slug;
      if (!resolvedItemId && segs[1]) resolvedItemId = segs[1];
    }

    const matched = getHubBySlug(baseSlug);
    const targetSlug = matched ? matched.slug : baseSlug;
    const url = resolvedItemId ? `/hub/${targetSlug}/${resolvedItemId}` : `/hub/${targetSlug}`;
    if (inNewTab) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    navigate(url);
    setVerticalHubSlug(targetSlug);
    setHubItemId(resolvedItemId || null);
    setShowVerticalHubsDirectory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHome = () => {
    navigate('/home');
    setVerticalHubSlug(null);
    setHubItemId(null);
    setShowVerticalHubsDirectory(false);
    setActiveHub('HOME');
    setShowGistHub(false);
    setShowAdvertisingHub(false);
    setShowDomainHub(false);
    setShowZoomPlans(false);
    setShowModernMarket(false);
    setShowMarketHub(false);
    setShowServiceCorps(false);
    setShowEducationHub(false);
    setShowTechHub(false);
    setShowHepiHandsLoan(false);
    setShowCommunityHub(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (hub: any, subview?: any, extraProps?: any) => {
    if (hub === 'HOME' || hub === 'home') {
      handleNavigateHome();
      return;
    }

    if (hub === 'GIST' || hub === 'nexus' || hub === 'nexus-hub' || hub === 'nexushub') {
      if (extraProps?.bargain && extraProps?.product) {
        setGistBargainContext(extraProps.product);
        navigateToVerticalHub('nexus-hub', false, 'connect');
        return;
      }
      const subSlug = subview === 'CHAT' ? 'connect' : subview === 'REELS' ? 'vibes' : undefined;
      navigateToVerticalHub('nexus-hub', false, subSlug);
      return;
    }

    if (hub === 'ADVERTISING') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setVerticalHubSlug(null);
      setHubItemId(null);
      setShowVerticalHubsDirectory(false);
      setAdInitialType(subview === 'SELL' ? 'SELL' : 'ADVERT');
      setShowAdvertisingHub(true);
      return;
    }

    const matchedHub = getHubBySlug(String(hub));
    if (matchedHub) {
      navigateToVerticalHub(matchedHub.slug);
      return;
    }

    // Reset vertical hub overlay when explicit navigation triggered
    setVerticalHubSlug(null);
    setHubItemId(null);
    setShowVerticalHubsDirectory(false);
    // Reset overlay modal flags when switching hubs
    setShowGistHub(hub === 'GIST');
    setShowAdvertisingHub(hub === 'ADVERTISING');
    setShowDomainHub(hub === 'DOMAIN_HUB');
    setShowZoomPlans(hub === 'ZOOM');
    setShowModernMarket(hub === 'MARKET');
    setShowMarketHub(hub === 'FAIRLY_USED');
    setShowServiceCorps(hub === 'SERVICE_CORPS');
    setShowEducationHub(hub === 'EDUCATION');
    setShowTechHub(hub === 'TECH_HUB' || hub === 'TECH');
    setShowHepiHandsLoan(hub === 'HEPIHANDS_LOAN');
    if (hub !== 'COMMUNITY_HUBS') setShowCommunityHub(false);

    if (hub === 'DIGITAL_SERVICES_HUB') {
      setDigitalServicesSection(subview || 'crypto');
      setActiveHub('DIGITAL_SERVICES_HUB');
      return;
    }

    if (hub === 'COMMUNITY_HUBS') {
      setActiveHub('COMMUNITY_HUBS');
      if (user && !user.csccRegistered) {
        setShowCSCCRegistration(true);
      } else {
        setShowCommunityHub(true);
      }
      return;
    }

    setActiveHub(hub);

    if (hub === 'USER_GUIDE') {
      setShowUserGuide(true);
      return;
    }

    if (hub === 'GIST') {
      setGistInitialView(subview || 'FEED');
      setGistAutoStartLive(false);
      setGistBargainContext(extraProps?.bargain ? extraProps.product : null);
      setShowGistHub(true);
      return;
    }

    if (hub === 'ADVERTISING') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setAdInitialType(subview === 'SELL' ? 'SELL' : 'ADVERT');
      setShowAdvertisingHub(true);
      return;
    }

    if (hub === 'DOMAIN_HUB') {
      setDomainHubSection(subview || 'domains');
      setShowDomainHub(true);
      return;
    }
  };

  const handleStartZoom = (category: string, title: string) => {
    setActiveZoomSession({
      sessionName: title,
      category: category,
      hostName: user?.displayName || user?.email.split('@')[0] || 'Strategic Host'
    });
    setShowEfadoZoom(true);
  };

  useEffect(() => {
    if (DEVELOPMENT_MODE) {
      setUser({
        uid: 'dev-admin',
        email: 'admin@dev.local',
        playerWallet: 1000,
        depositWallet: 500,
        cashOutWallet: 250,
        miningWallet: 0,
        miningProgress: { stage: 'E', collectedInStage: 0 },
        role: 'admin',
        createdAt: new Date().toISOString()
      });
      setAdminStats({
        adminWallet: 1500,
        totalHouseGain: 5000,
        totalPlayers: 10,
        pendingPayouts: 200,
        gameWallets: {
          spinGame: 2000,
          moneyCard: 1500,
          tradingGame: 1500,
          equilibrium: 0,
          deepSeaJet: 0,
          moneyQuiz: 0
        },
        lastUpdated: new Date()
      });
      setTransactions([
        { id: '1', userId: 'dev-admin', type: 'deposit', amount: 500, status: 'completed', timestamp: { toDate: () => new Date() } as any, currency: 'NGN' },
        { id: '2', userId: 'dev-admin', type: 'game_win', amount: 250, status: 'completed', timestamp: { toDate: () => new Date() } as any, currency: 'NGN' }
      ]);
      setAnnouncements([
        { id: '1', message: 'Welcome to EFADO Hubs! Experience interactive skill & challenge arenas.', timestamp: new Date(), active: true }
      ]);
      setLoading(false);
      return;
    }

    // Handle redirect result from Google Sign-In redirect flow (important for mobile)
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          console.log('Successfully completed redirect login:', result.user);
          const token = await result.user.getIdToken().catch(() => '');
          if (token) localStorage.setItem('efado_token', token);
          localStorage.setItem('efado_user_session_exists', 'true');
          
          const baseProfile: UserProfile = {
            uid: result.user.uid,
            email: result.user.email || '',
            displayName: result.user.displayName || result.user.email?.split('@')[0] || 'EFADO Member',
            photoURL: result.user.photoURL || '',
            playerWallet: 0,
            depositWallet: 0,
            cashOutWallet: 0,
            miningWallet: 0,
            miningProgress: { stage: 'E', collectedInStage: 0 },
            role: result.user.email === 'efado226@gmail.com' || result.user.email === 'efadofestus@gmail.com' ? 'admin' : 'player',
            createdAt: new Date().toISOString(),
            hasReceivedSignupBonus: false
          };
          setUser(baseProfile);
          localStorage.setItem('efado_cached_user', JSON.stringify(baseProfile));
          setLoading(false);
        }
      })
      .catch((e: any) => {
        console.error('Redirect login error:', e);
        if (e?.code === 'auth/unauthorized-domain') {
          const currentHost = window.location.hostname;
          setError(
            `This domain (${currentHost}) is not authorized in your Firebase Project. Please add "${currentHost}" and "www.e-fado.com" to the "Authorized domains" list under Authentication -> Settings -> Authorized domains in your Firebase Console.`
          );
        } else if (e?.message) {
          setError(`Login redirect failed: ${e.message}`);
        } else {
          setError('Login redirect failed. Please try again.');
        }
      });

    // Unsubscribers for nested Firestore observers
    let unsubUser: (() => void) | null = null;
    let unsubTx: (() => void) | null = null;
    let unsubAnn: (() => void) | null = null;
    let unsubAdmin: (() => void) | null = null;
    let unsubAds: (() => void) | null = null;
    let unsubPockets: (() => void)[] = [];

    const cleanupFirestore = () => {
      if (unsubUser) { unsubUser(); unsubUser = null; }
      if (unsubTx) { unsubTx(); unsubTx = null; }
      if (unsubAnn) { unsubAnn(); unsubAnn = null; }
      if (unsubAdmin) { unsubAdmin(); unsubAdmin = null; }
      if (unsubAds) { unsubAds(); unsubAds = null; }
      if (unsubPockets.length > 0) {
        unsubPockets.forEach((u) => { try { u(); } catch {} });
        unsubPockets = [];
      }
    };

    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      // Always cleanup previous Firestore listeners before registering new ones
      cleanupFirestore();

      if (firebaseUser) {
        firebaseUser.getIdToken().then(token => {
          localStorage.setItem('efado_token', token);
        }).catch(err => console.warn('Token caching notice:', err));
        localStorage.setItem('efado_user_session_exists', 'true');

        const userRef = doc(db, 'users', firebaseUser.uid);
        const livePockets: Record<string, number> = {};
        ACTIVE_WALLET_CURRENCIES.forEach((c) => {
          livePockets[c.code] = 0;
        });

        // Subscribe to all 9 canonical currency pockets: wallets/{uid}/{currency}/depositWallet
        unsubPockets = ACTIVE_WALLET_CURRENCIES.map((cur) =>
          onSnapshot(
            doc(db, 'wallets', firebaseUser.uid, cur.code, 'depositWallet'),
            (snap) => {
              const bal = snap.exists()
                ? Number(snap.data()?.balance ?? snap.data()?.depositWallet ?? 0) || 0
                : 0;
              livePockets[cur.code] = bal;
              setUser((prev) => {
                if (!prev || prev.uid !== firebaseUser.uid) return prev;
                const nextPockets = { ...(prev.walletPockets || {}), ...livePockets };
                const merged: UserProfile = {
                  ...prev,
                  walletPockets: nextPockets,
                  depositWallet: nextPockets.NGN ?? 0
                };
                localStorage.setItem('efado_cached_user', JSON.stringify(merged));
                return merged;
              });
            },
            (e) => console.warn(`Pocket snapshot notice (${cur.code}):`, e?.message || e)
          )
        );
        
        // Listen for user profile changes
        unsubUser = onSnapshot(userRef, async (snapshot) => {
          if (snapshot.exists()) {
            const rawData = snapshot.data() as UserProfile;
            const profileData: UserProfile = {
              ...rawData,
              walletPockets: { ...livePockets },
              depositWallet: livePockets.NGN ?? 0
            };
            setUser(profileData);
            localStorage.setItem('efado_cached_user', JSON.stringify(profileData));
          } else {
            // Create initial user profile
            const newUser: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'EFADO Member',
              photoURL: firebaseUser.photoURL || '',
              playerWallet: 0, // No starting bonus until first deposit
              depositWallet: livePockets.NGN ?? 0,
              cashOutWallet: 0,
              miningWallet: 0,
              walletPockets: { ...livePockets },
              miningProgress: { stage: 'E', collectedInStage: 0 },
              role: firebaseUser.email === 'efado226@gmail.com' || firebaseUser.email === 'efadofestus@gmail.com' ? 'admin' : 'player',
              createdAt: new Date().toISOString(),
              hasReceivedSignupBonus: false
            };
            
            try {
              await setDoc(userRef, newUser, { merge: true });
            } catch (e) {
              console.warn('Initial user profile write notice:', e);
            }
            
            setUser(newUser);
            localStorage.setItem('efado_cached_user', JSON.stringify(newUser));
          }
          setLoading(false);
        }, (e) => {
          console.warn("Firestore snapshot notice on user profile:", e);
          const fallbackUser: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'EFADO Member',
            photoURL: firebaseUser.photoURL || '',
            playerWallet: 0,
            depositWallet: livePockets.NGN ?? 0,
            cashOutWallet: 0,
            miningWallet: 0,
            walletPockets: { ...livePockets },
            miningProgress: { stage: 'E', collectedInStage: 0 },
            role: firebaseUser.email === 'efado226@gmail.com' || firebaseUser.email === 'efadofestus@gmail.com' ? 'admin' : 'player',
            createdAt: new Date().toISOString(),
            hasReceivedSignupBonus: false
          };
          setUser(fallbackUser);
          localStorage.setItem('efado_cached_user', JSON.stringify(fallbackUser));
          setLoading(false);
        });

        // Listen for transactions
        const txQuery = query(
          collection(db, 'transactions'),
          where('userId', '==', firebaseUser.uid),
          orderBy('timestamp', 'desc')
        );
        unsubTx = onSnapshot(txQuery, (snapshot) => {
          const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
          setTransactions(txs);
        }, (e) => console.warn("Transactions listener notice:", e.message));

        // Listen for announcements
        unsubAnn = onSnapshot(collection(db, 'announcements'), (snapshot) => {
          const getTime = (ts: any) => {
            if (!ts) return Date.now();
            if (typeof ts.toMillis === 'function') return ts.toMillis();
            if (typeof ts.seconds === 'number') return ts.seconds * 1000;
            if (ts instanceof Date) return ts.getTime();
            if (typeof ts === 'number') return ts;
            if (typeof ts === 'string') return new Date(ts).getTime();
            return Date.now();
          };

          const ann = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Announcement))
            .filter(a => a.active)
            .sort((a, b) => getTime(b.timestamp) - getTime(a.timestamp));
          setAnnouncements(ann);
        }, (e) => console.warn("Announcements listener notice:", e.message));

        // Listen for global user ad_listings
        unsubAds = onSnapshot(collection(db, 'ad_listings'), (snapshot) => {
          const ads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setGlobalAdListings(ads);
        }, (e) => console.warn("Global ad_listings load notice:", e.message));

        // Listen for admin stats if admin
        if (firebaseUser.email === 'efado226@gmail.com' || firebaseUser.email === 'efadofestus@gmail.com') {
          unsubAdmin = onSnapshot(doc(db, 'adminStats', 'global'), (snapshot) => {
            if (snapshot.exists()) {
              setAdminStats(snapshot.data() as AdminStats);
            }
          }, (e) => console.warn("AdminStats listener notice:", e.message));
        }
      } else {
        // Fallback: Check if we have an active Super Admin session
        const savedSession = localStorage.getItem('efado_session');
        if (savedSession) {
          try {
            const sessionData = JSON.parse(savedSession);
            if (sessionData.is_super_admin && sessionData.has_free_access && Date.now() < sessionData.expiresAt) {
              const userRef = doc(db, 'users', 'efado_admin_ceo');
              
              unsubUser = onSnapshot(userRef, async (snapshot) => {
                if (snapshot.exists()) {
                  setUser(snapshot.data() as UserProfile);
                } else {
                  const adminProfile: UserProfile = {
                    uid: 'efado_admin_ceo',
                    email: 'festdanemh@gmail.com',
                    displayName: 'Okhawere Festus Daniel',
                    playerWallet: 1000000,
                    depositWallet: 1000000,
                    cashOutWallet: 0,
                    miningWallet: 5000,
                    role: 'admin',
                    is_super_admin: true,
                    admin_otp_phone: '08072456836',
                    createdAt: new Date().toISOString()
                  };
                  await setDoc(userRef, adminProfile);
                  setUser(adminProfile);
                }
                setLoading(false);
              }, (e) => {
                console.error("Firestore loading error on Super Admin profile snapshot:", e);
                setLoading(false);
              });

              return; // Skip setting user to null
            }
          } catch (e) {
            console.error("Failed to restore Super Admin session:", e);
          }
        }

        // Only clear if not guest/offline session
        const cachedUserStr = localStorage.getItem('efado_cached_user');
        if (cachedUserStr) {
          try {
            const parsed = JSON.parse(cachedUserStr);
            if (parsed && parsed.uid && parsed.uid.startsWith('offline_')) {
              setUser(parsed);
              setLoading(false);
              return;
            }
          } catch (e) {}
        }

        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      cleanupFirestore();
    };
  }, []);

  // Paystack Automated Callback Redirect Listener
  useEffect(() => {
    const handlePaystackCallback = async () => {
      try {
        const curPath = window.location.pathname.toLowerCase();
        const curHash = window.location.hash.toLowerCase();
        if (curPath.startsWith('/payment/callback') || curHash.startsWith('#/payment/callback') || curHash.startsWith('#payment/callback')) {
          return;
        }
        const urlParams = new URLSearchParams(window.location.search);
        const mktOrder = urlParams.get('marketplace_order');
        const reference = urlParams.get('reference') || urlParams.get('trxref');
        const simUserId = urlParams.get('userId');
        const simAmount = urlParams.get('amount');

        if (mktOrder || (reference && reference.startsWith('MKT-'))) {
          setShowModernMarket(true);
          return;
        }

        if (reference) {
          console.log('💳 Paystack Return Reference detected in URL:', reference);
          let token = '';
          if (auth.currentUser) {
            token = await auth.currentUser.getIdToken();
          } else if (auth.authStateReady) {
            await auth.authStateReady();
            if (auth.currentUser) {
              token = await auth.currentUser.getIdToken();
            }
          }
          
          const verifyUrl = getBackendUrl(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`);
          const res = await fetch(verifyUrl, {
            mode: 'cors',
            headers: {
              'Accept': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
          });
          const data = await res.json().catch(() => null);

          if ((data?.success || data?.status) && (data.data?.status === 'success' || data.credited || data.already_processed || data.alreadyCredited)) {
            const cur = data.currency || 'NGN';
            const amtText = data.amount ? ` (${formatCurrencyAmount(Number(data.amount), cur)})` : '';
            alert(`✅ PAYSTACK DEPOSIT VERIFIED!\n\nReference: ${reference}${amtText}\nYour ${cur} Deposit Pocket has been credited.`);
          } else {
            console.error('Paystack return verification error:', data);
          }

          const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      } catch (err) {
        console.error('Error handling Paystack URL callback:', err);
      }
    };

    handlePaystackCallback();
  }, [user]);

  // Flutterwave Automated Callback Redirect Listener
  useEffect(() => {
    const handleFlutterwaveCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const mktOrder = urlParams.get('marketplace_order');
        const txRef = urlParams.get('tx_ref') || urlParams.get('txRef');
        const referenceParam = urlParams.get('reference');
        const transactionId = urlParams.get('transaction_id') || urlParams.get('id');
        const status = urlParams.get('status');
        const simUserId = urlParams.get('userId');
        const simAmount = urlParams.get('amount');

        if (mktOrder || (txRef && txRef.startsWith('MKT-')) || (referenceParam && referenceParam.startsWith('MKT-'))) {
          setShowModernMarket(true);
          return;
        }

        if (txRef || transactionId) {
          console.log('🌐 Flutterwave Return Reference detected in URL:', txRef || transactionId, 'Status:', status);
          if (status === 'cancelled') {
            const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
            window.history.replaceState({}, document.title, cleanUrl);
            return;
          }

          const currentUserId = user?.uid || simUserId || auth.currentUser?.uid || '';
          const verifyUrl = getBackendUrl('/api/payments/verify');
          const res = await fetch(verifyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              tx_ref: txRef || '',
              transaction_id: transactionId || '',
              userId: currentUserId,
              amount: simAmount ? Number(simAmount) : undefined
            })
          });
          const data = await res.json().catch(() => null);

          if ((data?.success || data?.status) && (data?.verified || data?.credited || data?.data?.status === 'success' || data?.already_processed || data?.alreadyCredited)) {
            const cur = data.currency || 'NGN';
            const amtText = data.amount ? ` (${formatCurrencyAmount(Number(data.amount), cur)})` : '';
            alert(`✅ FLUTTERWAVE PAYMENT VERIFIED!\n\nReference: ${txRef || transactionId}${amtText}\nYour ${cur} Deposit Pocket has been credited.`);
          } else {
            console.warn('Flutterwave return verification status:', data);
          }

          const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      } catch (err) {
        console.error('Error handling Flutterwave URL callback:', err);
      }
    };

    handleFlutterwaveCallback();
  }, [user]);

  // OPay Automated Callback Redirect Listener
  useEffect(() => {
    const handleOpayCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const mktOrder = urlParams.get('marketplace_order');
        const opayRef = urlParams.get('opay_ref') || urlParams.get('reference');
        const status = urlParams.get('status');
        const simAmount = urlParams.get('amount');
        const simUserId = urlParams.get('userId');
        const isSimulated = urlParams.get('simulated');

        if (mktOrder || (opayRef && opayRef.startsWith('MKT-'))) {
          setShowModernMarket(true);
          return;
        }

        if (opayRef && opayRef.startsWith('OPAY_')) {
          console.log('🟢 OPay Return Reference detected in URL:', opayRef, 'Status:', status);
          const currentUserId = user?.uid || simUserId || '';
          
          const verifyUrl = getBackendUrl(`/api/opay/status/${encodeURIComponent(opayRef)}?userId=${encodeURIComponent(currentUserId)}${simAmount ? `&amount=${simAmount}` : ''}${status ? `&status=${status}` : ''}${isSimulated ? `&simulated=${isSimulated}` : ''}`);
          const res = await fetch(verifyUrl, {
            mode: 'cors',
            headers: { 'Accept': 'application/json' }
          });
          const data = await res.json();

          if (data.status && (data.verified || data.already_processed)) {
            const amountText = data.amount ? `₦${Number(data.amount).toLocaleString()}` : (simAmount ? `₦${Number(simAmount).toLocaleString()}` : 'Funds');
            alert(`✅ OPAY PAYMENT SUCCESSFUL!\n\nReference: ${opayRef}\nAmount: ${amountText}\nYour wallet balance has been successfully credited.`);
            setShowWallet(true);
            setWalletInitialTab('overview');
          } else {
            console.warn('OPay return verification status:', data);
          }

          const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      } catch (err) {
        console.error('Error handling OPay URL callback:', err);
      }
    };

    handleOpayCallback();
  }, [user]);

  // Path-Based Routing & Deep Linking Synchronizer - Handles URL mapping (e.g. /hub/marketplace/123 or /hub/advertisement)
  useEffect(() => {
    const handleRouteSync = () => {
      // 1. Capture strategic affiliate code from search params or hash if present
      try {
        const fullHref = window.location.href;
        const refMatch = fullHref.match(/[?&]ref=([a-zA-Z0-9_-]+)/i);
        if (refMatch && refMatch[1]) {
          const capturedRef = refMatch[1].toUpperCase();
          localStorage.setItem('efado_referral_code', capturedRef);
          setActiveReferralCode(capturedRef);
          console.log('🎯 Strategic Referral Code captured in ledger:', capturedRef);
        }
      } catch (err) {
        console.warn('URL parsing notice:', err);
      }

      // 2. Clean hash and pathname routing
      const rawHash = (window.location.hash || '').replace('#', '').split('?')[0].toLowerCase().trim();
      const pathname = window.location.pathname.toLowerCase().trim();
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const deepItem = searchParams.get('item');
        if (deepItem && deepItem.startsWith('prod_')) {
          setHubItemId(deepItem);
          setShowModernMarket(true);
        }
      } catch {
        // ignore URLSearchParams error
      }

      // Check for hubs directory: /hubs or #hubs
      if (pathname === '/hubs' || pathname === '/vertical-hubs' || pathname === 'hubs' || rawHash === 'hubs' || rawHash === '/hubs') {
        setShowVerticalHubsDirectory(true);
        setVerticalHubSlug(null);
        setHubItemId(null);
        return;
      }

      // Check for /hub/:slug or /hub/:slug/:itemId
      if (pathname.startsWith('/hub/')) {
        const parts = pathname.replace('/hub/', '').split('/').filter(Boolean);
        const slug = parts[0] ? parts[0].split('?')[0].trim() : '';
        const item = parts[1] ? parts[1].split('?')[0].trim() : null;
        const matchedHub = getHubBySlug(slug);
        if (matchedHub) {
          setVerticalHubSlug(matchedHub.slug);
          setHubItemId(item);
          setShowVerticalHubsDirectory(false);
          return;
        }
      }

      // Check direct clean paths: /marketplace, /advertisement, /education, /gist, /tech, /community, /service, /loan, /dashboard
      const cleanPath = pathname.replace(/^\/+|\/+$/g, '').split('/')[0].split('?')[0].trim();
      if (cleanPath && cleanPath !== 'home' && cleanPath !== 'welcome') {
        const directHub = getHubBySlug(cleanPath);
        if (directHub) {
          const parts = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
          const directItem = parts[1] ? parts[1].split('?')[0].trim() : null;
          setVerticalHubSlug(directHub.slug);
          setHubItemId(directItem);
          setShowVerticalHubsDirectory(false);
          return;
        }
      }

      // Seamlessly upgrade legacy hash route (e.g. #hub/marketplace or #marketplace) to clean path route
      if (rawHash) {
        const cleanHash = rawHash.replace(/^\/?hub\//, '').split('/')[0].split('?')[0].trim();
        const hashHub = getHubBySlug(cleanHash);
        if (hashHub) {
          navigate(`/hub/${hashHub.slug}`, { replace: true });
          setVerticalHubSlug(hashHub.slug);
          setShowVerticalHubsDirectory(false);
          return;
        }
      }

      if (!pathname || pathname === '/' || pathname === '/home' || pathname === '/welcome') {
        setVerticalHubSlug(null);
        setHubItemId(null);
        setShowVerticalHubsDirectory(false);
        setActiveHub('HOME');
        return;
      }
    };

    handleRouteSync();

    window.addEventListener('popstate', handleRouteSync);
    window.addEventListener('hashchange', handleRouteSync);
    return () => {
      window.removeEventListener('popstate', handleRouteSync);
      window.removeEventListener('hashchange', handleRouteSync);
    };
  }, [location.pathname, location.hash, location.search]);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      console.log('Initiating secure Google connection...');
      const userCred = await signInWithPopup(auth, googleProvider);
      if (userCred && userCred.user) {
        const token = await userCred.user.getIdToken().catch(() => '');
        if (token) localStorage.setItem('efado_token', token);
        localStorage.setItem('efado_user_session_exists', 'true');

        const baseProfile: UserProfile = {
          uid: userCred.user.uid,
          email: userCred.user.email || '',
          displayName: userCred.user.displayName || userCred.user.email?.split('@')[0] || 'EFADO Member',
          photoURL: userCred.user.photoURL || '',
          playerWallet: 0,
          depositWallet: 0,
          cashOutWallet: 0,
          miningWallet: 0,
          miningProgress: { stage: 'E', collectedInStage: 0 },
          role: userCred.user.email === 'efado226@gmail.com' || userCred.user.email === 'efadofestus@gmail.com' ? 'admin' : 'player',
          createdAt: new Date().toISOString(),
          hasReceivedSignupBonus: false
        };
        setUser(baseProfile);
        localStorage.setItem('efado_cached_user', JSON.stringify(baseProfile));
      }
      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      console.error('Google login error details:', e);
      if (e?.code === 'auth/unauthorized-domain') {
        const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'domain';
        setError(
          `Domain "${currentHost}" needs to be added in Firebase Console (Authentication > Settings > Authorized domains). You can also connect instantly with 1-Tap Fast Access above!`
        );
      } else if (e?.code === 'auth/popup-blocked') {
        setError(
          'Pop-up was blocked by your browser settings. Please use the 1-Tap Fast Access button above, or enable pop-ups in your browser settings.'
        );
      } else if (e?.code === 'auth/cancelled-popup-request' || e?.code === 'auth/popup-closed-by-user') {
        // User intentionally cancelled the popup
        setError(null);
      } else if (isInAppBrowser) {
        setError(
          'Google blocks logins inside in-app browsers like WhatsApp. Please enter your name or phone above for 1-Tap Fast Access!'
        );
      } else if (e?.message) {
        setError(`Login failed: ${e.message}. You can use 1-Tap Fast Access above to connect immediately!`);
      } else {
        setError('Login failed. Please use 1-Tap Fast Access to connect immediately.');
      }
    }
  };

  const handleQuickEntrance = async (customNameOrPhone?: string) => {
    setError(null);
    setLoading(true);
    try {
      const rawInput = (typeof customNameOrPhone === 'string' ? customNameOrPhone : quickNameOrPhone || '').trim();
      
      // Stable device patron identifier for continuous persistent session
      let storedPatronId = localStorage.getItem('efado_device_patron_id');
      if (!storedPatronId) {
        storedPatronId = `patron_${Date.now().toString(36)}_${Math.floor(1000 + Math.random() * 9000)}`;
        localStorage.setItem('efado_device_patron_id', storedPatronId);
      }
      
      const isPhoneInput = /^[0-9+() -]{7,15}$/.test(rawInput);
      const cleanId = isPhoneInput ? rawInput.replace(/[^0-9]/g, '') : storedPatronId;
      const patronEmail = `patron_${cleanId.toLowerCase()}@e-fado.com`;
      const patronPassword = `EFADO_Patron_2026_${cleanId.slice(-4) || '9999'}!`;
      const finalDisplayName = rawInput || (isPhoneInput ? `Patron (${rawInput})` : `EFADO Patron #${cleanId.slice(-4)}`);

      let authUser = auth.currentUser;

      if (!authUser) {
        // First try signing in with deterministic credentials
        try {
          const cred = await signInWithEmailAndPassword(auth, patronEmail, patronPassword);
          authUser = cred.user;
        } catch (signInErr: any) {
          // If not registered yet, create the user
          try {
            const cred = await createUserWithEmailAndPassword(auth, patronEmail, patronPassword);
            authUser = cred.user;
          } catch (createErr: any) {
            // Fallback to anonymous auth if email exists or fails
            try {
              const anonCred = await signInAnonymously(auth);
              authUser = anonCred.user;
            } catch (anonErr) {
              console.warn('Anonymous fallback auth note:', anonErr);
            }
          }
        }
      }

      if (authUser) {
        // Update Auth Profile display name
        await updateProfile(authUser, { displayName: finalDisplayName }).catch(() => {});
        
        const userRef = doc(db, 'users', authUser.uid);
        const userSnap = await getDoc(userRef).catch(() => null);
        
        if (!userSnap || !userSnap.exists()) {
          const newUserProfile: UserProfile = {
            uid: authUser.uid,
            email: authUser.email || patronEmail,
            displayName: finalDisplayName,
            phoneNumber: isPhoneInput ? rawInput : '',
            playerWallet: 0,
            depositWallet: 0,
            cashOutWallet: 0,
            miningWallet: 0,
            miningProgress: { stage: 'E', collectedInStage: 0 },
            role: 'player', // Real player profile with full patronage capabilities!
            createdAt: new Date().toISOString(),
            hasReceivedSignupBonus: false
          };
          await setDoc(userRef, newUserProfile, { merge: true }).catch(err => {
            console.warn('Firestore user profile write note:', err);
          });
          setUser(newUserProfile);
        } else {
          const existingData = userSnap.data() as UserProfile;
          if (rawInput && (!existingData.displayName || existingData.displayName.includes('Visitor') || existingData.displayName.includes('Guest'))) {
            await updateDoc(userRef, { displayName: finalDisplayName }).catch(() => {});
            setUser({ ...existingData, displayName: finalDisplayName });
          } else {
            setUser(existingData);
          }
        }
        
        localStorage.setItem('efado_user_session_exists', 'true');
        setLoading(false);
      } else {
        // Resilient local user session if offline
        const fallbackUid = `offline_${storedPatronId}`;
        const localUser: UserProfile = {
          uid: fallbackUid,
          email: patronEmail,
          displayName: finalDisplayName,
          phoneNumber: isPhoneInput ? rawInput : '',
          playerWallet: 0,
          depositWallet: 0,
          cashOutWallet: 0,
          miningWallet: 0,
          miningProgress: { stage: 'E', collectedInStage: 0 },
          role: 'player',
          createdAt: new Date().toISOString(),
          hasReceivedSignupBonus: false
        };
        setUser(localUser);
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Quick entrance error:', error);
      setError(`Quick connection encountered an issue: ${error.message || error}. Please try again.`);
      setLoading(false);
    }
  };

  const handleStandardEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!standardEmail || !standardPassword) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, standardEmail, standardPassword);
      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      console.error('Email login error:', e);
      if (e?.code === 'auth/invalid-credential' || e?.code === 'auth/wrong-password' || e?.code === 'auth/user-not-found') {
        setError('Incorrect email or password. Please verify your credentials or register a new account.');
      } else if (e?.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else if (e?.message) {
        setError(`Login failed: ${e.message}`);
      } else {
        setError('Login failed. Please try again.');
      }
    }
  };

  const handleStandardEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStandardRegisterSuccess(null);
    if (!standardEmail || !standardPassword || !standardDisplayName) {
      setError('Please fill out all fields.');
      return;
    }
    if (standardPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, standardEmail, standardPassword);
      if (cred.user) {
        // Send verification email in background without blocking login
        sendEmailVerification(cred.user).catch(() => {});
        await updateProfile(cred.user, {
          displayName: standardDisplayName
        });
        
        const userRef = doc(db, 'users', cred.user.uid);
        const newUser: UserProfile = {
          uid: cred.user.uid,
          email: cred.user.email || '',
          displayName: standardDisplayName,
          playerWallet: 0,
          depositWallet: 0,
          cashOutWallet: 0,
          miningWallet: 0,
          miningProgress: { stage: 'E', collectedInStage: 0 },
          role: cred.user.email === 'efado226@gmail.com' || cred.user.email === 'efadofestus@gmail.com' ? 'admin' : 'player',
          createdAt: new Date().toISOString(),
          hasReceivedSignupBonus: false
        };
        await setDoc(userRef, newUser);
        setStandardRegisterSuccess('Account created successfully! Welcome to EFADO.');
      }
      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      console.error('Email registration error:', e);
      if (e?.code === 'auth/email-already-in-use') {
        setError('This email address is already registered. Please sign in instead.');
      } else if (e?.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else if (e?.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.');
      } else if (e?.message) {
        setError(`Registration failed: ${e.message}`);
      } else {
        setError('Registration failed. Please try again.');
      }
    }
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Check lockout period
    const now = Date.now();
    const lockedTime = localStorage.getItem('efado_lockout_until');
    if (lockedTime && now < Number(lockedTime)) {
      const remainingMin = Math.ceil((Number(lockedTime) - now) / 60000);
      setError(`CEO login is locked due to multiple failed OTP attempts. Try again in ${remainingMin} minutes.`);
      return;
    }

    const isSuperAdminEmail = adminEmail.trim().toLowerCase() === 'festdanemh@gmail.com';
    const isSuperAdminPassword = 
      adminPassword.trim() === dynamicCeoPassword || 
      adminPassword.trim() === 'EFADO_CEO_2026' || 
      adminPassword.trim() === '08072456836';

    if (!isSuperAdminEmail || !isSuperAdminPassword) {
      setError("Invalid Administrative Credentials. Access Blocked.");
      return;
    }

    // Password matches! Proceed to OTP Verification (Step 2)
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setCurrentOtpCode(generatedOtp);
    setOtpStep(true);
    setOtpAttempts(0);
    setOtpInput('');
    setOtpMessage(`A 6-digit secure key has been broadcasted to CEO secure terminal (08072456836).`);
    
    // We will display a highly visible simulation modal of the SMS gateway ONLY if this is the authenticated sovereign admin
    if (isSuperAdminEmail) {
      setAuthorizedSmsRecipient(adminEmail.trim().toLowerCase());
      setSimulatedSmsCode(generatedOtp);
      setShowSmsPopup(true);

      // 1. Write OTP to test collection for developer convenience / diagnostic audits
      try {
        await setDoc(doc(db, 'test', 'ceo_otp'), {
          email: 'festdanemh@gmail.com',
          phone: '08072456836',
          otp: generatedOtp,
          timestamp: new Date().toISOString()
        });
        console.log('CEO OTP successfully written to Firestore "test/ceo_otp"');
      } catch (err) {
        console.error('Failed to log CEO OTP to Firestore test:', err);
      }

      // 2. Deliver the OTP directly to the CEO's in-app mailboxes (gmail & efado addresses) for robust fallback!
      try {
        const parentEmails = ['festdanemh@gmail.com', 'festdanemh@efado.com'];
        for (const email of parentEmails) {
          const q = query(collection(db, 'email_accounts'), where('emailAddress', '==', email));
          const snap = await getDocs(q);
          
          if (snap.docs.length > 0) {
            const accId = snap.docs[0].id;
            const otpEmailObj = {
              accountId: accId,
              sender: 'security@efado.com',
              recipients: [email],
              subject: 'SECURE OTP: EFADO CEO Console Verification Link',
              content: `AUTHORIZED SECURE TRANSMISSION\n\nSecurity clearance protocol triggered for CEO Portal Access:\n\nSovereign Verification Code: ${generatedOtp}\n\nRegistered Phone Number: 08072456836\nTimestamp: ${new Date().toLocaleString()}\n\nIf you did not initiate this clearance, terminate this terminal link immediately.\n\nEFADO Security Operations Directorate`,
              folder: 'inbox',
              isRead: false,
              hasAttachments: false,
              timestamp: serverTimestamp()
            };
            await addDoc(collection(db, 'email_messages'), otpEmailObj);
            console.log(`Secured OTP email dispatched to in-app mailbox for ${email}`);
          } else {
            // Auto-provision mailbox so it's ready when the CEO accesses it
            const newAccountObj = {
              emailAddress: email,
              username: 'festdanemh',
              displayName: 'Okhawere Festus Daniel (CEO)',
              customPin: '1234',
              domain: email.split('@')[1],
              plan: 'enterprise',
              storageUsed: 0,
              storageLimit: 10 * 1024 * 1024 * 1024, // 10 GB
              status: 'active',
              isCustomDomain: false,
              twoFactorEnabled: true,
              createdAt: serverTimestamp()
            };
            const newAccDoc = await addDoc(collection(db, 'email_accounts'), newAccountObj);
            const otpEmailObj = {
              accountId: newAccDoc.id,
              sender: 'security@efado.com',
              recipients: [email],
              subject: 'SECURE OTP: EFADO CEO Console Verification Link',
              content: `AUTHORIZED SECURE TRANSMISSION\n\nSecurity clearance protocol triggered for CEO Portal Access:\n\nSovereign Verification Code: ${generatedOtp}\n\nRegistered Phone Number: 08072456836\nTimestamp: ${new Date().toLocaleString()}\n\nIf you did not initiate this clearance, terminate this terminal link immediately.\n\nEFADO Security Operations Directorate`,
              folder: 'inbox',
              isRead: false,
              hasAttachments: false,
              timestamp: serverTimestamp()
            };
            await addDoc(collection(db, 'email_messages'), otpEmailObj);
            console.log(`Auto-created in-app email mailbox & dispatched OTP email to ${email}`);
          }
        }
      } catch (err) {
        console.error('Mail fallback delivery failed:', err);
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Double check lockout
    const now = Date.now();
    const lockedTime = localStorage.getItem('efado_lockout_until');
    if (lockedTime && now < Number(lockedTime)) {
      setError(`CEO portal is locked. Try again later.`);
      return;
    }

    if (otpInput.trim() === currentOtpCode) {
      // SUCCESS!
      // Set Session Token containing:
      // is_super_admin: true, has_free_access: true, expiresAt
      const sessionObj = {
        is_super_admin: true,
        has_free_access: true,
        expiresAt: Date.now() + 2 * 24 * 60 * 60 * 1000 // 2 days of persistent CEO access
      };
      localStorage.setItem('efado_session', JSON.stringify(sessionObj));
      localStorage.setItem('has_free_access', 'true');
      setShowSmsPopup(false);
      setAuthorizedSmsRecipient('');

      // Now create / sync the profile document in Firestore
      const userRef = doc(db, 'users', 'efado_admin_ceo');
      const adminProfile: UserProfile = {
        uid: 'efado_admin_ceo',
        email: 'festdanemh@gmail.com',
        displayName: 'Okhawere Festus Daniel',
        playerWallet: 1000000,
        depositWallet: 1000000,
        cashOutWallet: 0,
        miningWallet: 5000,
        role: 'admin',
        is_super_admin: true,
        admin_otp_phone: '08072456836',
        createdAt: new Date().toISOString()
      };

      try {
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, adminProfile);
          setUser(adminProfile);
        } else {
          // If profile exists, merge 'is_super_admin' and 'admin_otp_phone' to be fully compliant
          await updateDoc(userRef, {
            is_super_admin: true,
            admin_otp_phone: '08072456836'
          });
          setUser({
            ...snap.data() as UserProfile,
            is_super_admin: true,
            admin_otp_phone: '08072456836'
          });
        }
      } catch (err) {
        console.error("Firestore user setup error on login:", err);
        setUser(adminProfile); // fallback if firestore fails
      }

      setOtpStep(false);
      setAdminEmail('');
      setAdminPassword('');
      setLoginMode('STANDARD');
    } else {
      // WRONG OTP!
      const attempts = otpAttempts + 1;
      setOtpAttempts(attempts);
      
      if (attempts >= 3) {
        const lockUntil = Date.now() + 15 * 60 * 1000; // 15 minutes lockout
        localStorage.setItem('efado_lockout_until', lockUntil.toString());
        setOtpStep(false);
        setLoginMode('STANDARD');
        setError("Security lock activated. Multiple incorrect OTP entries. Access has been locked for 15 minutes.");
        setShowSmsPopup(false);
        setAuthorizedSmsRecipient('');
      } else {
        setError(`Security code mismatch. Please check the code and re-enter. Try (${attempts}/3)`);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('efado_session');
    localStorage.removeItem('has_free_access');
    localStorage.removeItem('efado_token');
    localStorage.removeItem('efado_cached_user');
    localStorage.removeItem('efado_user_session_exists');
    setUser(null);
    signOut(auth);
  };

  const handleDeposit = async (amount: number, currency: string = 'NGN') => {
    if (!user) return;
    const cur = normalizeCurrencyCode(currency);
    if (isDisabledFutureCurrency(cur)) {
      throw new Error('SIRA (Burkina Faso) is Coming Soon and not yet in circulation.');
    }
    const bonusToApply = !user.hasReceivedSignupBonus && cur === 'NGN' ? 100 : 0;
    if (DEVELOPMENT_MODE) {
      const curBal = user.walletPockets?.[cur] ?? (cur === 'NGN' ? user.depositWallet : 0);
      const nextBal = curBal + amount;
      setUser({
        ...user,
        depositWallet: cur === 'NGN' ? nextBal : user.depositWallet,
        walletPockets: { ...(user.walletPockets || {}), [cur]: nextBal },
        playerWallet: user.playerWallet + bonusToApply,
        hasReceivedSignupBonus: true
      });
      setTransactions([
        { id: Math.random().toString(), userId: user.uid, type: 'deposit', amount, status: 'completed', timestamp: { toDate: () => new Date() } as any, currency: cur },
        ...transactions
      ]);
      return;
    }
    try {
      await runTransaction(db, async (transaction) => {
        const walletPocketRef = doc(db, 'wallets', user.uid, cur, 'depositWallet');
        const userRef = doc(db, 'users', user.uid);
        const txRef = doc(collection(db, 'transactions'));

        const pocketSnap = await transaction.get(walletPocketRef);
        const oldBal = pocketSnap.exists()
          ? Number(pocketSnap.data()?.balance ?? pocketSnap.data()?.depositWallet ?? 0) || 0
          : 0;
        const nextBal = oldBal + amount;

        transaction.set(walletPocketRef, {
          balance: nextBal,
          depositWallet: nextBal,
          currency: cur,
          userId: user.uid,
          updatedAt: serverTimestamp()
        }, { merge: true });

        if (bonusToApply > 0) {
          transaction.update(userRef, {
            playerWallet: increment(bonusToApply),
            hasReceivedSignupBonus: true
          });
        }

        transaction.set(txRef, {
          userId: user.uid,
          type: 'deposit',
          amount,
          currency: cur,
          status: 'completed',
          credited: true,
          creditedPocket: `wallets/${user.uid}/${cur}/depositWallet`,
          timestamp: serverTimestamp()
        });
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'deposit_transaction');
      throw e;
    }
  };

  const handleWalletUpdate = async (amount: number, type: 'deposit' | 'withdrawal' | 'game_bet' | 'game_win', withdrawalAccountDetails?: any) => {
    if (!user) return;
    if (withdrawalAccountDetails?.alreadyProcessedByServer === true) {
      // Server atomic transaction already updated wallet balance and wrote the matching transaction history row
      return;
    }
    const cur = normalizeCurrencyCode(withdrawalAccountDetails?.currency || 'NGN');
    if (isDisabledFutureCurrency(cur)) {
      throw new Error('SIRA (Burkina Faso) is Coming Soon and not yet in circulation.');
    }
    const sourceWallet = withdrawalAccountDetails?.sourceWallet;

    if (DEVELOPMENT_MODE) {
      const prevPocket = user.walletPockets?.[cur] ?? (cur === 'NGN' ? user.depositWallet : 0);
      if (type === 'deposit') {
        const bonusToApply = !user.hasReceivedSignupBonus && cur === 'NGN' ? 100 : 0;
        const nextPocket = prevPocket + amount;
        setUser({
          ...user,
          depositWallet: cur === 'NGN' ? nextPocket : user.depositWallet,
          walletPockets: { ...(user.walletPockets || {}), [cur]: nextPocket },
          playerWallet: user.playerWallet + bonusToApply,
          hasReceivedSignupBonus: true
        });
      } else if (type === 'withdrawal') {
        const fee = amount * 0.015;
        const netAmount = amount - fee;
        if (sourceWallet === 'playerWallet' || sourceWallet === 'cashOutWallet') {
          setUser({
            ...user,
            [sourceWallet]: Math.max(0, (user[sourceWallet] || 0) - amount)
          });
        } else {
          const nextPocket = Math.max(0, prevPocket - amount);
          setUser({
            ...user,
            depositWallet: cur === 'NGN' ? nextPocket : user.depositWallet,
            walletPockets: { ...(user.walletPockets || {}), [cur]: nextPocket }
          });
        }
        if (adminStats) {
          setAdminStats({
            ...adminStats,
            adminWallet: adminStats.adminWallet + fee,
            pendingPayouts: adminStats.pendingPayouts + netAmount,
            lastUpdated: new Date()
          });
        }
      } else if (type === 'game_bet') {
        const nextPocket = Math.max(0, prevPocket - amount);
        setUser({
          ...user,
          depositWallet: cur === 'NGN' ? nextPocket : user.depositWallet,
          walletPockets: { ...(user.walletPockets || {}), [cur]: nextPocket }
        });
      } else if (type === 'game_win') {
        setUser({
          ...user,
          playerWallet: user.playerWallet + amount
        });
      }
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      const walletPocketRef = doc(db, 'wallets', user.uid, cur, 'depositWallet');

      if (type === 'deposit') {
        const bonusToApply = !user.hasReceivedSignupBonus && cur === 'NGN' ? 100 : 0;
        const txRef = withdrawalAccountDetails?.reference
          ? doc(db, 'transactions', String(withdrawalAccountDetails.reference))
          : doc(collection(db, 'transactions'));
        await runTransaction(db, async (transaction) => {
          const existingTxSnap = await transaction.get(txRef);
          if (existingTxSnap.exists() && existingTxSnap.data()?.credited === true) {
            return;
          }
          const pocketSnap = await transaction.get(walletPocketRef);
          const oldBal = pocketSnap.exists()
            ? Number(pocketSnap.data()?.balance ?? pocketSnap.data()?.depositWallet ?? 0) || 0
            : 0;
          const nextBal = oldBal + amount;
          transaction.set(walletPocketRef, {
            balance: nextBal,
            depositWallet: nextBal,
            currency: cur,
            userId: user.uid,
            updatedAt: serverTimestamp()
          }, { merge: true });
          if (cur === 'NGN') {
            transaction.set(userRef, { depositWallet: nextBal }, { merge: true });
          }
          transaction.set(txRef, {
            userId: user.uid,
            type: 'deposit',
            status: 'completed',
            credited: true,
            amount,
            balanceAfter: nextBal,
            currency: cur,
            sourceWallet: 'depositWallet',
            reference: txRef.id,
            purpose: `Funded ${cur} Pocket`,
            createdAtIso: new Date().toISOString(),
            timestamp: serverTimestamp()
          }, { merge: true });
          if (bonusToApply > 0) {
            transaction.update(userRef, {
              playerWallet: increment(bonusToApply),
              hasReceivedSignupBonus: true
            });
          }
        });
      } else if (type === 'withdrawal') {
        const withdrawalRef = doc(collection(db, 'withdrawals'));
        const txRef = doc(db, 'transactions', withdrawalRef.id);
        const fee = amount * 0.015;
        const netAmount = amount - fee;

        const useUserField = sourceWallet === 'playerWallet' || sourceWallet === 'cashOutWallet';
        const walletToDeductField = useUserField ? sourceWallet : 'depositWallet';

        await runTransaction(db, async (transaction) => {
          if (useUserField) {
            const uSnap = await transaction.get(userRef);
            const curFieldBal = uSnap.exists() ? Number(uSnap.data()?.[walletToDeductField] || 0) : 0;
            if (curFieldBal < amount) {
              throw new Error(`INSUFFICIENT FUNDS in ${walletToDeductField}`);
            }
            transaction.update(userRef, {
              [walletToDeductField]: increment(-amount)
            });
          } else {
            const pSnap = await transaction.get(walletPocketRef);
            const oldBal = pSnap.exists()
              ? Number(pSnap.data()?.balance ?? pSnap.data()?.depositWallet ?? 0) || 0
              : 0;
            if (oldBal < amount) {
              throw new Error(`INSUFFICIENT FUNDS in ${cur} Deposit Pocket`);
            }
            const nextBal = oldBal - amount;
            transaction.set(walletPocketRef, {
              balance: nextBal,
              depositWallet: nextBal,
              currency: cur,
              userId: user.uid,
              updatedAt: serverTimestamp()
            }, { merge: true });
          }

          transaction.set(withdrawalRef, {
            userId: user.uid,
            userEmail: user.email,
            amount: netAmount,
            originalAmount: amount,
            fee: fee,
            currency: cur,
            status: 'pending',
            timestamp: serverTimestamp(),
            accountDetails: {
              ...(withdrawalAccountDetails || { method: 'default' }),
              currency: cur,
              walletSource: walletToDeductField
            }
          });

          transaction.set(txRef, {
            userId: user.uid,
            userEmail: user.email,
            type: 'withdrawal',
            amount: netAmount,
            fee: fee,
            status: 'pending',
            timestamp: serverTimestamp(),
            currency: cur,
            description: `Cashout withdrawal of ${formatCurrencyAmount(amount, cur)} to ${withdrawalAccountDetails?.bankName || 'nominated account'}.`,
            method: withdrawalAccountDetails?.method || 'Wallet Payout'
          });
        });
      } else if (type === 'game_bet') {
        await runTransaction(db, async (transaction) => {
          const pSnap = await transaction.get(walletPocketRef);
          const oldBal = pSnap.exists()
            ? Number(pSnap.data()?.balance ?? pSnap.data()?.depositWallet ?? 0) || 0
            : 0;
          if (oldBal < amount) {
            throw new Error(`INSUFFICIENT FUNDS in ${cur} Deposit Pocket`);
          }

          const nextBal = oldBal - amount;
          transaction.set(walletPocketRef, {
            balance: nextBal,
            depositWallet: nextBal,
            currency: cur,
            userId: user.uid,
            updatedAt: serverTimestamp()
          }, { merge: true });
        });
        void syncServerGameLedger('moneyQuiz', amount, 0);
      } else if (type === 'game_win') {
        await updateDoc(userRef, {
          playerWallet: increment(amount)
        });
        void syncServerGameLedger('moneyQuiz', 0, amount);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `wallet_${type}`);
      throw e;
    }
  };

  const handleAddTransaction = async (transactionData: Omit<Transaction, 'id' | 'timestamp'>) => {
    if (!user) return;
    if (DEVELOPMENT_MODE) {
      const newTx: Transaction = {
        ...transactionData,
        id: Math.random().toString(),
        timestamp: { toDate: () => new Date() } as any
      };
      setTransactions([newTx, ...transactions]);
      return;
    }

    try {
      await addDoc(collection(db, 'transactions'), {
        ...transactionData,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'add_transaction');
    }
  };

  const handleCashOut = async () => {
    if (!user || user.cashOutWallet <= 0) return;
    const amount = user.cashOutWallet;
    const fee = amount * 0.03;
    const netAmount = amount - fee;

    if (DEVELOPMENT_MODE) {
      setUser({
        ...user,
        cashOutWallet: 0
      });
      if (adminStats) {
        setAdminStats({
          ...adminStats,
          adminWallet: adminStats.adminWallet + fee,
          pendingPayouts: adminStats.pendingPayouts + netAmount,
          lastUpdated: new Date()
        });
      }
      setTransactions([
        { id: Math.random().toString(), userId: user.uid, type: 'withdrawal', amount: netAmount, fee: fee, status: 'pending', timestamp: { toDate: () => new Date() } as any, currency: 'NGN' },
        ...transactions
      ]);
      return;
    }
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        const withdrawalRef = doc(collection(db, 'withdrawals'));
        const txRef = doc(db, 'transactions', withdrawalRef.id);

        transaction.update(userRef, {
          cashOutWallet: 0
        });

        const txData = {
          userId: user.uid,
          userEmail: user.email,
          type: 'withdrawal' as const,
          amount: netAmount,
          fee: fee,
          status: 'pending' as const,
          timestamp: serverTimestamp(),
          currency: 'USD',
          description: 'Sovereign Account Wallet Cashout Request',
          method: 'General Withdrawal'
        };

        transaction.set(txRef, txData);
        transaction.set(withdrawalRef, {
          userId: user.uid,
          userEmail: user.email,
          amount: netAmount,
          originalAmount: amount,
          fee: fee,
          status: 'pending' as const,
          timestamp: serverTimestamp(),
          accountDetails: { method: 'General Cashout' }
        });
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'cashout_transaction');
    }
  };

  const onSpin = async (bet: number) => {
    setIsSpinning(true);
    setError(null);
  };

  const onResult = async (multiplier: number, bet: number, gameId: 'spinGame' | 'moneyCard' | 'tradingGame' | 'equilibrium' | 'deepSeaJet' | 'moneyQuiz', payoutOverride?: number) => {
    if (!user) return;
    const winAmount = payoutOverride !== undefined ? payoutOverride : bet * multiplier;

    if (DEVELOPMENT_MODE) {
      setUser({
        ...user,
        depositWallet: Math.max(0, user.depositWallet - bet),
        playerWallet: user.playerWallet + winAmount
      });
      
      if (adminStats) {
        setAdminStats({
          ...adminStats,
          adminWallet: adminStats.adminWallet + bet - winAmount,
          totalHouseGain: adminStats.totalHouseGain + bet - winAmount,
          gameWallets: {
            ...adminStats.gameWallets,
            [gameId]: ((adminStats.gameWallets as any)[gameId] || 0) + bet - winAmount
          },
          lastUpdated: new Date()
        });
      }
      setTransactions([
        { id: Math.random().toString(), userId: user.uid, type: winAmount > 0 ? 'game_win' : 'game_bet', amount: winAmount > 0 ? winAmount : bet, status: 'completed', timestamp: { toDate: () => new Date() } as any, currency: 'NGN' },
        ...transactions
      ]);
      setIsSpinning(false);
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        const walletPocketRef = doc(db, 'wallets', user.uid, 'NGN', 'depositWallet');
        const txRef = doc(collection(db, 'transactions'));

        const pocketSnap = bet > 0 ? await transaction.get(walletPocketRef) : null;

        if (bet > 0) {
          const oldBal = pocketSnap?.exists()
            ? Number(pocketSnap.data()?.balance ?? pocketSnap.data()?.depositWallet ?? 0) || 0
            : 0;
          if (oldBal < bet) {
            throw new Error('INSUFFICIENT FUNDS in NGN Deposit Pocket');
          }
          const nextBal = oldBal - bet;
          transaction.set(walletPocketRef, {
            balance: nextBal,
            depositWallet: nextBal,
            currency: 'NGN',
            userId: user.uid,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }

        if (winAmount > 0) {
          transaction.update(userRef, {
            playerWallet: increment(winAmount)
          });
        }

        if (winAmount > 0 || bet > 0) {
          transaction.set(txRef, {
            userId: user.uid,
            type: winAmount > 0 ? 'game_win' : 'game_bet',
            amount: winAmount > 0 ? winAmount : bet,
            currency: 'NGN',
            status: 'completed',
            timestamp: serverTimestamp()
          });
        }
      });

      void syncServerGameLedger(gameId, bet, winAmount);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'game_result_pocket');
    } finally {
      setIsSpinning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white relative overflow-hidden">
        <NocturnalBackground />
        
        {/* Glowing glassmorphic container */}
        <div className="flex flex-col items-center gap-6 relative z-10 p-8 rounded-3xl bg-slate-900/40 backdrop-blur-md border border-white/5 shadow-2xl">
          {/* Pulse glowing spinner */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10" />
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-indigo-400 border-b-indigo-500 animate-spin shadow-lg" />
            <div className="absolute inset-2 rounded-full bg-slate-950/80 flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
            </div>
          </div>
          
          <div className="text-center space-y-1">
            <h3 className="text-xs font-bold tracking-widest text-indigo-400 uppercase">EFADO Hubs Connect</h3>
            <p className="text-xs text-slate-400">Loading your account...</p>
          </div>
        </div>
      </div>
    );
  }

  // Paystack Dedicated Payment Return & Verification Callback Route
  if (isPaymentCallback) {
    return (
      <PaymentCallback
        onGoToWallet={() => {
          setIsPaymentCallback(false);
          window.history.replaceState({}, document.title, '/');
          openWalletWithTab('overview');
        }}
      />
    );
  }

  // Public SEO-friendly Advert & Sell Product Landing Route (Accessible without login)
  const publicAdvertSlug = location.pathname.toLowerCase().startsWith('/advert/')
    ? location.pathname.slice('/advert/'.length).split('/')[0].split('?')[0].trim()
    : null;
  if (publicAdvertSlug) {
    return (
      <PublicAdvertPage
        slugOrId={decodeURIComponent(publicAdvertSlug)}
        user={user}
        onLogin={() => {
          navigate('/');
        }}
        onNavigateHome={handleNavigateHome}
        onOpenAdvertise={(mode) => {
          if (user) {
            setAdInitialType(mode === 'SELL' ? 'SELL' : 'ADVERT');
            setShowAdvertisingHub(true);
            navigate('/home');
          } else {
            navigate('/');
          }
        }}
      />
    );
  }

  // 10+ Vertical Hubs System - All Hubs Directory
  if (showVerticalHubsDirectory) {
    const totalSharedWallet = (user?.depositWallet || 0) + (user?.playerWallet || 0);
    return (
      <>
        <VerticalHubsPage
          user={user}
          wallet={totalSharedWallet}
          onNavigateHub={navigateToVerticalHub}
          onNavigateHome={handleNavigateHome}
          onOpenCashier={(tab) => openWalletWithTab(tab || 'overview')}
          onLogin={handleLogin}
        />
        {renderWalletModal()}
      </>
    );
  }

  // 10+ Vertical Hubs System - Dedicated Dynamic Universal Hub
  if (verticalHubSlug) {
    const totalSharedWallet = (user?.depositWallet || 0) + (user?.playerWallet || 0);
    return (
      <>
        <UniversalHubPage
          slug={verticalHubSlug}
          itemId={hubItemId || undefined}
          user={user}
          wallet={totalSharedWallet}
          onNavigateHub={navigateToVerticalHub}
          onNavigateHome={handleNavigateHome}
          onOpenCashier={(tab) => openWalletWithTab(tab || 'overview')}
          onLogin={handleLogin}
          onResult={(winAmount, gameId, stake) => {
            const mult = stake > 0 ? winAmount / stake : 0;
            onResult(mult, stake, gameId as any, winAmount);
          }}
          onStakeDeduction={async (amount, gameId) => {
            if (!user) return;
            try {
              await runTransaction(db, async (tx) => {
                const pocketRef = doc(db, 'wallets', user.uid, 'NGN', 'depositWallet');
                const userRef = doc(db, 'users', user.uid);
                const pocketSnap = await tx.get(pocketRef);
                const pocketBal = pocketSnap.exists()
                  ? Number(pocketSnap.data()?.balance ?? pocketSnap.data()?.depositWallet ?? 0) || 0
                  : 0;
                if (pocketBal >= amount) {
                  const nextBal = pocketBal - amount;
                  tx.set(pocketRef, {
                    balance: nextBal,
                    depositWallet: nextBal,
                    currency: 'NGN',
                    userId: user.uid,
                    updatedAt: serverTimestamp()
                  }, { merge: true });
                } else {
                  tx.update(userRef, { playerWallet: increment(-amount) });
                }
              });
              void syncServerGameLedger(gameId as any, amount, 0);
            } catch (err) {
              console.error('Stake deduction failed:', err);
            }
          }}
          onUpdateBalance={async (amount) => {
            if (!user) return;
            try {
              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, { playerWallet: increment(amount) });
            } catch (err) {
              console.error('Balance update failed:', err);
            }
          }}
        />
        {renderWalletModal()}
      </>
    );
  }

  if (!user && !DEVELOPMENT_MODE) {
    return (
      <EfadoCosmicWelcome
        onQuickConnect={async (targetHub?: string, customNameOrPhone?: string) => {
          await handleQuickEntrance(customNameOrPhone);
          if (targetHub) {
            setActiveHub(targetHub as any);
          }
        }}
        onGoogleConnect={handleLogin}
        onRedirectGoogleConnect={async () => {
          setError(null);
          try {
            console.log('User requested redirect login explicitly...');
            await signInWithRedirect(auth, googleProvider);
          } catch (e: any) {
            setError(`Redirect Connection failed: ${e.message || e}`);
          }
        }}
        onEmailLogin={handleStandardEmailLogin}
        onEmailRegister={handleStandardEmailRegister}
        onAdminSubmit={handleAdminLoginSubmit}
        onVerifyOtp={handleVerifyOtp}
        error={error}
        setError={setError}
        loading={loading}
        isInAppBrowser={isInAppBrowser}
        standardEmail={standardEmail}
        setStandardEmail={setStandardEmail}
        standardPassword={standardPassword}
        setStandardPassword={setStandardPassword}
        standardDisplayName={standardDisplayName}
        setStandardDisplayName={setStandardDisplayName}
        standardRegisterSuccess={standardRegisterSuccess}
        adminEmail={adminEmail}
        setAdminEmail={setAdminEmail}
        adminPassword={adminPassword}
        setAdminPassword={setAdminPassword}
        otpStep={otpStep}
        setOtpStep={setOtpStep}
        otpInput={otpInput}
        setOtpInput={setOtpInput}
        otpMessage={otpMessage}
        simulatedSmsCode={simulatedSmsCode}
        currentOtpCode={currentOtpCode}
      />
    );
  }

  const handleDirectBuyAdProduct = async (ad: any) => {
    if (!user) {
      alert("Please sign in to complete your purchase.");
      return;
    }
    const itemPrice = Number(ad.price) || 0;
    const availableWallet = Math.max(user.depositWallet || 0, user.playerWallet || 0);

    if (availableWallet < itemPrice) {
      alert(`Insufficient balance. Price: ₦${itemPrice.toLocaleString()}, Your Wallet: ₦${availableWallet.toLocaleString()}. Please deposit funds first.`);
      openWalletWithTab('deposit');
      return;
    }

    const confirmBuy = window.confirm(`Confirm purchase of "${ad.title}" for ₦${itemPrice.toLocaleString()} from your EFADO Wallet?`);
    if (!confirmBuy) return;

    try {
      await runTransaction(db, async (tx) => {
        const pocketRef = doc(db, 'wallets', user.uid, 'NGN', 'depositWallet');
        const userRef = doc(db, 'users', user.uid);
        const pocketSnap = await tx.get(pocketRef);
        const pocketBal = pocketSnap.exists()
          ? Number(pocketSnap.data()?.balance ?? pocketSnap.data()?.depositWallet ?? 0) || 0
          : 0;
        if (pocketBal >= itemPrice) {
          const nextBal = pocketBal - itemPrice;
          tx.set(pocketRef, {
            balance: nextBal,
            depositWallet: nextBal,
            currency: 'NGN',
            userId: user.uid,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } else {
          tx.update(userRef, { playerWallet: increment(-itemPrice) });
        }
      });

      const orderRef = await addDoc(collection(db, 'market_orders'), {
        orderCode: `EFD-BUY-${Math.floor(100000 + Math.random() * 900000)}`,
        userId: user.uid,
        userEmail: user.email || 'Authorized Buyer',
        vendorId: ad.vendorId || 'EFADO_SELLER',
        items: [{
          id: ad.id,
          title: ad.title,
          price: itemPrice,
          quantity: 1,
          image: ad.photos?.[0] || ''
        }],
        totalAmount: itemPrice,
        status: 'paid_pending_delivery',
        paymentMethod: 'EFADO_WALLET',
        contact: ad.contact || {},
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        userEmail: user.email,
        type: 'withdrawal',
        amount: itemPrice,
        status: 'completed',
        reference: orderRef.id,
        description: `Direct Purchase of Advertised Asset: "${ad.title}"`,
        timestamp: serverTimestamp()
      });

      if (ad.vendorId) {
        try {
          const vendorRef = doc(db, 'users', ad.vendorId);
          const vendorSnap = await getDoc(vendorRef);
          if (vendorSnap.exists()) {
            await updateDoc(vendorRef, {
              playerWallet: increment(itemPrice),
              cashOutWallet: increment(itemPrice)
            });
            await addDoc(collection(db, 'transactions'), {
              userId: ad.vendorId,
              userEmail: ad.contact?.email || 'Vendor',
              type: 'deposit',
              amount: itemPrice,
              status: 'completed',
              reference: orderRef.id,
              description: `Product sale proceeds for "${ad.title}" from buyer ${user.email}`,
              timestamp: serverTimestamp()
            });
          }
        } catch (err) {
          console.warn("Could not credit vendor user doc:", err);
        }
      }

      alert(`🎉 Purchase Successful! Your order for "${ad.title}" has been confirmed. Contact seller at ${ad.contact?.phone || ad.contact?.whatsapp || ad.contact?.email || 'EFADO Desk'}.`);
      setSelectedAdForDirectBuy(null);
    } catch (err: any) {
      console.error("Error executing direct purchase:", err);
      alert(`Purchase error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 relative flex flex-col overflow-x-hidden">
      <NocturnalBackground />
      
      {/* Global Live CEO Broadcast Ticker Banner */}
      {announcements.filter(ann => ann.active !== false).length > 0 && (
        <div className="bg-gradient-to-r from-amber-600 via-indigo-600 to-purple-600 text-white text-xs font-bold py-2 px-4 shadow-xl flex items-center justify-between gap-3 relative z-40 border-b border-white/10">
          <div className="flex items-center gap-2 overflow-hidden max-w-5xl">
            <span className="px-2.5 py-0.5 bg-black/40 rounded-lg text-[9px] font-black uppercase tracking-widest text-amber-300 animate-pulse shrink-0 flex items-center gap-1">
              <Megaphone className="w-3 h-3 text-amber-300" /> BROADCAST
            </span>
            <div className="truncate text-white">
              {announcements.filter(ann => ann.active !== false)[0].title && (
                <strong className="text-amber-200 font-extrabold uppercase mr-1.5">{announcements.filter(ann => ann.active !== false)[0].title}:</strong>
              )}
              <span className="font-semibold">{announcements.filter(ann => ann.active !== false)[0].message}</span>
            </div>
          </div>
          {announcements.filter(ann => ann.active !== false)[0].actionUrl && (
            <a
              href={announcements.filter(ann => ann.active !== false)[0].actionUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-white text-slate-900 hover:bg-amber-300 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 transition-all shadow"
            >
              {announcements.filter(ann => ann.active !== false)[0].actionText || 'View Details'}
            </a>
          )}
        </div>
      )}

      {/* Global Browser Add-On & Google Ads Syndication Ticker Bar */}
      {showSyndicationBanner && (
        <div className="bg-slate-900 border-b border-indigo-500/30 text-white text-xs py-1.5 px-3 sm:px-4 shadow-2xl flex items-center justify-between gap-2 sm:gap-3 relative z-40 overflow-hidden">
          <div className="flex items-center gap-2 overflow-hidden max-w-5xl">
            <button 
              onClick={() => setShowBrowserAddonModal(true)}
              className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white shrink-0 flex items-center gap-1 shadow-md cursor-pointer"
            >
              <Globe className="w-3 h-3 text-indigo-200" /> BROWSER AD-ON
            </button>
            
            {globalAdListings.length > 0 ? (
              <div className="truncate flex items-center gap-2 text-slate-200">
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                  LIVE AD
                </span>
                <span className="font-bold text-white truncate text-xs">
                  {globalAdListings[0].title}
                </span>
                <span className="text-emerald-400 font-mono font-bold shrink-0 text-xs">
                  ₦{Number(globalAdListings[0].price || 0).toLocaleString()}
                </span>
              </div>
            ) : (
              <span className="text-[10px] text-slate-400 font-medium italic truncate">
                All products & ads syndicated live across Google Ads & Web Browsers.
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setShowBrowserAddonModal(true)}
              className="px-2 py-0.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all hidden xs:inline"
            >
              All ({globalAdListings.length})
            </button>
            <button
              onClick={() => handleNavigate('ADVERTISING', 'SELL')}
              className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shadow-sm"
            >
              + Sell
            </button>
            <button
              onClick={() => setShowSyndicationBanner(false)}
              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition-colors"
              title="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Header - Mobile First 60px Height */}
      <header className="bg-slate-900/90 backdrop-blur-xl border-b border-white/10 sticky top-0 z-30 shadow-xl min-h-[60px] h-[60px] sm:h-[64px] flex items-center">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 w-full flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <EfadoLogo size="sm" className="scale-90" />
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* PWA Install Button */}
              {(isInstallable || isIOS) && (
                <button 
                  onClick={isInstallable ? handleInstallClick : () => setShowIosInstallGuide(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white rounded-xl text-[9px] sm:text-[10px] font-black tracking-widest hover:brightness-110 transition-all shadow-xl border border-emerald-400/20 uppercase"
                >
                  <Smartphone className="w-3.5 h-3.5 text-amber-300" />
                  <span>Install App</span>
                </button>
              )}

              <button 
                onClick={() => setShowUserGuide(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-900/60 to-indigo-800/80 hover:from-indigo-800 hover:to-indigo-700 text-indigo-200 hover:text-white rounded-xl text-[10px] sm:text-[11px] font-black tracking-widest transition-all shadow-lg border border-indigo-500/30 active:scale-95 group"
                title="Open EFADO User Guide"
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400 group-hover:text-white transition-colors animate-pulse" />
                <span className="uppercase tracking-wider">Guide</span>
              </button>

              <button 
                onClick={() => setShowAboutCeo(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 text-white rounded-xl text-[9px] sm:text-[10px] font-bold tracking-widest hover:bg-slate-700 transition-all shadow-lg border border-white/5"
              >
                <Info className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline uppercase">About CEO</span>
                <span className="sm:hidden">CEO</span>
              </button>

              {user.role === 'admin' && (
                <button 
                  onClick={() => isCeoVerified ? setShowCeoPortal(true) : setShowCeoVerification(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 text-white rounded-xl text-[9px] sm:text-[10px] font-bold tracking-widest hover:bg-indigo-500 transition-all shadow-lg relative"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">CEO Portal</span>
                  <span className="sm:hidden">CEO</span>
                  {newHelpInboxCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black leading-none tabular-nums">
                      {newHelpInboxCount}
                    </span>
                  )}
                </button>
              )}

              <button 
                onClick={() => openWalletWithTab('profile')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-[9px] sm:text-[10px] font-bold tracking-widest hover:brightness-110 transition-all shadow-lg border border-white/5"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline uppercase">My Profile & Payouts</span>
                <span className="lg:hidden uppercase">Profile</span>
              </button>
            </div>

            <CurrencySelector />
            <TextSizeSelector />
            
            <div className="hidden sm:flex flex-col items-end px-3 border-r border-white/5">
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-ping'}`} />
                <span className={`text-[9px] font-black uppercase tracking-widest ${isOnline ? 'text-emerald-500' : 'text-red-400'}`}>
                  {isOnline ? `${liveUsers.toLocaleString()} Hub Active` : 'Offline Mode'}
                </span>
              </div>
              <span className="text-[7px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                {isOnline ? 'Synchronising...' : 'Using Cache'}
              </span>
            </div>

            <div className="hidden sm:flex flex-col items-end">
              <div className="flex items-center gap-1.5">
                {user.is_super_admin && <span className="px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/25 text-amber-400 text-[7px] font-black rounded uppercase tracking-widest animate-pulse">Free CEO Access</span>}
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{user.is_super_admin ? 'OWNER ADMIN' : 'Logged in'}</span>
              </div>
              <span className="text-xs font-bold text-slate-300 capitalize">{user.fullName || user.displayName || user.email.split('@')[0]}</span>
              {user.phoneNumber && <span className="text-[9px] font-semibold text-slate-400 mt-0.5 font-mono">{user.phoneNumber}</span>}
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hub Navigation Slider */}
        <div className="relative group/nav mb-12">
          <div className="absolute -top-6 left-4 right-4 flex justify-between items-end">
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] italic mb-1">Ecosystem Navigation Hub</h3>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => (
                <div key={i} className={`w-1 h-1 rounded-full bg-white/20`} />
              ))}
            </div>
          </div>
          
          {/* Edge fading shadows for scroll indicators */}
          <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-slate-950 via-slate-950/20 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-slate-950 via-slate-950/20 to-transparent pointer-events-none z-10" />

          <div 
            id="hub-nav-slider"
            className="flex items-center gap-4 overflow-x-auto pb-8 no-scrollbar scroll-smooth px-6 relative z-0"
          >
            {[
              { id: 'HOME', label: 'HomeHub', icon: Home, gradient: 'from-emerald-500 via-emerald-600 to-emerald-700', border: 'border-emerald-800/80', ring: 'ring-emerald-400/40' },
              { id: 'DASHBOARD', label: 'Dashboard', icon: TrendingUp, gradient: 'from-purple-500 via-purple-600 to-purple-700', border: 'border-purple-800/80', ring: 'ring-purple-400/40' },
              { id: 'GAMES', label: 'GameArena', icon: Gamepad2, gradient: 'from-orange-500 via-orange-600 to-orange-700', border: 'border-orange-800/80', ring: 'ring-orange-400/40' },
              { id: 'MARKET', label: 'ModernMarket', icon: ShoppingBag, gradient: 'from-amber-400 via-amber-500 to-amber-600', border: 'border-amber-700/80', ring: 'ring-amber-400/40' },
              { id: 'FAIRLY_USED', label: 'FairlyUsed', icon: Package, gradient: 'from-lime-500 via-lime-600 to-lime-700', border: 'border-lime-700/80', ring: 'ring-lime-400/40' },
              { id: 'ADVERTISING', label: 'Advertise', icon: Megaphone, gradient: 'from-red-500 via-red-600 to-red-700', border: 'border-red-800/80', ring: 'ring-red-400/40' },
              { id: 'GIST', label: 'EFADO Nexus Hub', icon: MessageSquare, gradient: 'from-blue-500 via-blue-600 to-blue-700', border: 'border-blue-800/80', ring: 'ring-blue-400/40' },
              { id: 'ZOOM', label: 'ZoomLive', icon: Video, gradient: 'from-violet-500 via-violet-600 to-violet-700', border: 'border-violet-800/80', ring: 'ring-violet-400/40' },
              { id: 'SERVICE_CORPS', label: 'ServiceCorps', icon: HardHat, gradient: 'from-slate-500 via-slate-600 to-slate-700', border: 'border-slate-800/80', ring: 'ring-slate-400/40' },
              { id: 'COMMUNITY_HUBS', label: 'UnityHubs', icon: Users, gradient: 'from-cyan-500 via-cyan-600 to-cyan-700', border: 'border-cyan-800/80', ring: 'ring-cyan-400/40' },
              { id: 'HEPIHANDS_LOAN', label: 'LoanHub', icon: HandCoins, gradient: 'from-rose-500 via-rose-600 to-rose-700', border: 'border-rose-800/80', ring: 'ring-rose-400/40' },
              { id: 'TECH_HUB', label: 'TechHub', icon: Cpu, gradient: 'from-fuchsia-500 via-fuchsia-600 to-fuchsia-700', border: 'border-fuchsia-800/80', ring: 'ring-fuchsia-400/40' },
              { id: 'PARTNER_HUB', label: 'Partners', icon: Handshake, gradient: 'from-yellow-500 via-yellow-600 to-yellow-700', border: 'border-yellow-800/80', ring: 'ring-yellow-400/40' },
              { id: 'DOMAIN_HUB', label: 'DomainHub', icon: Globe, gradient: 'from-teal-500 via-teal-600 to-teal-700', border: 'border-teal-800/80', ring: 'ring-teal-400/40' },
              { id: 'DIGITAL_SERVICES_HUB', label: 'ServicesHub', icon: Coins, gradient: 'from-amber-500 via-amber-600 to-amber-700', border: 'border-amber-800/80', ring: 'ring-amber-400/40' },
            ].map((item) => {
              const isActive = (activeHub === item.id || 
                               (item.id === 'ADVERTISING' && showAdvertisingHub && adInitialType === 'ADVERT') ||
                               (item.id === 'GIST' && showGistHub));
              const itemSlug = (item.id === 'COMMUNITY_HUBS' ? 'community' :
                                item.id === 'GIST' ? 'gist' :
                                item.id === 'ADVERTISING' ? 'advertisement' :
                                item.id === 'ZOOM' ? 'tech' :
                                item.id === 'SERVICE_CORPS' ? 'service' :
                                item.id === 'DOMAIN_HUB' ? 'china' :
                                item.id === 'TECH_HUB' ? 'tech' :
                                item.id === 'GAMES' ? 'arena' :
                                item.id === 'MARKET' ? 'marketplace' :
                                item.id === 'FAIRLY_USED' ? 'marketplace' :
                                item.id === 'HEPIHANDS_LOAN' ? 'loan' :
                                item.id === 'PARTNER_HUB' ? 'partners' :
                                item.id === 'DIGITAL_SERVICES_HUB' ? 'data-vending' :
                                item.id === 'EDUCATION' ? 'education' :
                                item.id.toLowerCase());
              return (
                <motion.a 
                  key={item.id}
                  href={`/hub/${itemSlug}`}
                  whileHover={{ 
                    scale: 1.08, 
                    y: -4,
                    boxShadow: "0 15px 25px -5px rgba(0,0,0,0.4)"
                  }}
                  whileTap={{ scale: 0.96 }}
                  onClick={(e) => {
                    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                      e.preventDefault();
                      if (item.id === 'HOME') {
                        handleNavigateHome();
                        return;
                      }
                      if (item.id === 'GIST') {
                        navigateToVerticalHub('nexus-hub');
                        return;
                      }
                      navigateToVerticalHub(itemSlug);
                    }
                  }}
                  className={`relative py-4 px-6 rounded-xl font-black text-xs transition-all flex flex-col items-center gap-2.5 min-w-[150px] shadow-lg border no-underline text-inherit ${item.border} ${
                    isActive
                      ? `bg-gradient-to-b ${item.gradient} text-white ring-4 ring-white/30 scale-105 z-10 brightness-110 saturate-125 shadow-[inset_0_2px_0_0_rgba(255,255,255,0.6),0_15px_25px_-5px_rgba(0,0,0,0.5)]` 
                      : `bg-gradient-to-b ${item.gradient} text-white/90 opacity-70 saturate-[0.85] brightness-[0.8] hover:opacity-100 hover:brightness-100 hover:saturate-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_8px_16px_-4px_rgba(0,0,0,0.3)]`
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20 shadow-inner border border-white/20' : 'bg-white/10 border border-white/5'} flex items-center justify-center`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="uppercase whitespace-nowrap text-[11px] font-black tracking-wider text-white drop-shadow-[0_1.5px_1px_rgba(0,0,0,0.85)]">{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-1 w-6 h-0.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,1)]" />
                  )}
                </motion.a>
              );
            })}

            <motion.a 
              href="/hub/advertisement"
              whileHover={{ scale: 1.08, y: -4, boxShadow: "0 15px 25px -5px rgba(0,0,0,0.4)" }}
              whileTap={{ scale: 0.96 }}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  navigateToVerticalHub('advertisement');
                }
              }}
              className={`relative py-4 px-6 rounded-xl font-black text-xs transition-all flex flex-col items-center gap-2.5 min-w-[150px] shadow-lg border border-rose-800/80 no-underline text-inherit ${
                showAdvertisingHub && adInitialType === 'SELL'
                  ? 'bg-gradient-to-b from-rose-500 via-rose-600 to-rose-700 text-white ring-4 ring-white/30 scale-105 z-10 brightness-110 saturate-125 shadow-[inset_0_2px_0_0_rgba(255,255,255,0.6),0_15px_25px_-5px_rgba(0,0,0,0.5)]' 
                  : 'bg-gradient-to-b from-rose-500 via-rose-600 to-rose-700 text-white/90 opacity-70 saturate-[0.85] brightness-[0.8] hover:opacity-100 hover:brightness-100 hover:saturate-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_8px_16px_-4px_rgba(0,0,0,0.3)]'
              }`}
            >
              <div className={`p-2 rounded-lg ${showAdvertisingHub && adInitialType === 'SELL' ? 'bg-white/20 shadow-inner border border-white/20' : 'bg-white/10 border border-white/5'} flex items-center justify-center`}>
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="uppercase whitespace-nowrap text-[11px] font-black tracking-wider text-white drop-shadow-[0_1.5px_1px_rgba(0,0,0,0.85)]">Sell @ EFADO</span>
              {showAdvertisingHub && adInitialType === 'SELL' && (
                <span className="absolute bottom-1 w-6 h-0.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,1)]" />
              )}
            </motion.a>
          </div>

          {/* Navigation Controls */}
          <div className="absolute top-[45%] -translate-y-1/2 left-0 right-0 flex justify-between pointer-events-none z-30 px-2 sm:px-4">
            <button 
              onClick={() => document.getElementById('hub-nav-slider')?.scrollBy({ left: -320, behavior: 'smooth' })}
              className="p-3 sm:p-4 bg-slate-900/90 backdrop-blur-md border border-white/15 rounded-xl text-white pointer-events-auto hover:bg-slate-800 transition-all shadow-2xl hover:scale-110 active:scale-90 flex items-center justify-center group/btn shadow-indigo-500/10 hover:shadow-indigo-500/25 cursor-pointer opacity-90 hover:opacity-100"
              title="Scroll Left"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 group-hover/btn:text-indigo-300 group-hover/btn:-translate-x-0.5 transition-transform" />
            </button>
            <button 
              onClick={() => document.getElementById('hub-nav-slider')?.scrollBy({ left: 320, behavior: 'smooth' })}
              className="p-3 sm:p-4 bg-slate-900/90 backdrop-blur-md border border-white/15 rounded-xl text-white pointer-events-auto hover:bg-slate-800 transition-all shadow-2xl hover:scale-110 active:scale-90 flex items-center justify-center group/btn shadow-indigo-500/10 hover:shadow-indigo-500/25 cursor-pointer opacity-90 hover:opacity-100"
              title="Scroll Right"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 group-hover/btn:text-indigo-300 group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex justify-end mb-8">
          <button 
            onClick={() => {
              const shareUrl = window.location.href;
              const text = "Join EFADO Hubs - The ultimate marketplace, gist, and global partner network! 🚀";
              if (navigator.share) {
                navigator.share({ 
                  title: 'EFADO Hubs | Global Affiliate Network', 
                  text: "Monetize your influence or hook-up your organization to the world's most lucrative hub ecosystem!", 
                  url: shareUrl 
                });
              } else {
                navigator.clipboard.writeText(`${text} ${shareUrl}`);
                alert("Invite link copied to clipboard!");
              }
            }}
            className="px-8 py-5 rounded-[2rem] font-black tracking-widest text-xs transition-all flex items-center gap-2 shadow-sm border border-white/5 text-slate-300 bg-slate-900/40 hover:bg-white/10"
          >
            <Share2 className="w-6 h-6 text-indigo-400" />
            <span className="uppercase whitespace-nowrap">Invite Hubs</span>
          </button>
        </div>

        {/* Strategic Referral Code Active Banner */}
        {activeReferralCode && (
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-5 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-600/20 border-2 border-amber-500/40 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl text-white"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Target className="w-6 h-6 animate-pulse" />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">Strategic Referral Hook-Up Verified</span>
                <p className="text-xs md:text-sm font-bold text-slate-100 mt-0.5">
                  Affiliate Code <span className="font-mono bg-amber-500/30 px-2 py-0.5 rounded text-amber-300 font-black">{activeReferralCode}</span> is active! You are eligible for priority processing & discounted corporate rates.
                </p>
              </div>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem('efado_referral_code');
                setActiveReferralCode(null);
              }}
              className="px-4 py-2 bg-black/40 hover:bg-black/60 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-white/10 shrink-0"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {/* Active Banner Announcements */}
        {announcements.filter(ann => ann.active !== false && !dismissedAnnouncements.includes(ann.id || '') && (!ann.type || ann.type === 'banner')).length > 0 && (
          <div className="mb-8 space-y-3">
            {announcements.filter(ann => ann.active !== false && !dismissedAnnouncements.includes(ann.id || '') && (!ann.type || ann.type === 'banner')).map((ann, idx) => {
              const key = ann.id || `banner-${idx}`;
              const tierStyles = 
                ann.tier === 'success' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/15' :
                ann.tier === 'warning' ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-500/15' :
                ann.tier === 'urgent' ? 'bg-gradient-to-r from-rose-600 to-red-700 text-white shadow-rose-500/20 animate-pulse border border-white/20' :
                'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-500/15';

              return (
                <motion.div 
                  key={key}
                  initial={{ opacity: 0, y: -15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl relative overflow-hidden ${tierStyles}`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-start gap-3.5 relative z-10 text-left">
                    <div className="p-2.5 bg-white/10 rounded-2xl shrink-0 mt-0.5">
                      <Megaphone className="w-5 h-5 text-white" />
                    </div>
                    <div className="space-y-1">
                      {ann.title && <h4 className="font-extrabold text-[11px] uppercase tracking-widest text-white/95">{ann.title}</h4>}
                      <p className="text-sm font-bold text-white leading-relaxed">{ann.message}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto shrink-0 relative z-10">
                    {ann.actionUrl && (
                      <a 
                        href={ann.actionUrl}
                        target={ann.actionUrl.startsWith('http') ? '_blank' : '_self'}
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-white text-indigo-950 hover:bg-slate-100 rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95 block text-center"
                      >
                        {ann.actionText || 'View Details'}
                      </a>
                    )}
                    <button 
                      onClick={() => setDismissedAnnouncements(prev => [...prev, ann.id || ''])}
                      className="p-2 bg-black/10 hover:bg-black/25 text-white rounded-xl transition-all self-end md:self-center ml-auto md:ml-0"
                      title="Dismiss Announcement"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {activeHub === 'HOME' && user ? (
          <EfadoHomePage 
            user={user} 
            onNavigate={handleNavigate} 
            onOpenMining={() => setShowEfadoMining(true)} 
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-8">
              
              {activeHub === 'DASHBOARD' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                 {/* Strategic Intelligence Alert */}
                <EfadoIntelligenceFeed mode="ticker-only" />

                {/* Private Account Summary Banner */}
                <div className="p-5 sm:p-6 bg-slate-900/90 border border-emerald-500/25 rounded-2xl shadow-lg">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-11 h-11 bg-emerald-950/80 rounded-xl border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <Lock className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-emerald-400">Private Account Dashboard</span>
                      <h2 className="text-lg font-bold text-white mt-0.5">Your Account Summary</h2>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-1">
                        Signed in as <span className="text-emerald-300 font-semibold">{user.email}</span>. Your wallets, deposits, winnings, and order history are private to your account.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Wallets */}
                <section>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                      <Wallet className="w-5 h-5 text-indigo-400" />
                      Your Wallet Balance
                    </h2>
                    <button 
                      onClick={() => openWalletWithTab('overview')}
                      className="px-4 py-2 bg-white/5 border border-white/10 text-slate-200 rounded-xl text-xs font-semibold hover:bg-white/10 hover:text-white transition-colors"
                    >
                      Manage Wallet
                    </button>
                  </div>
                  <WalletGrid wallets={user} isAdmin={false} />
                </section>

                {/* Quick Access Hubs */}
                <section>
                  <h2 className="text-sm font-semibold text-slate-400 mb-4 pb-2 border-b border-white/10">Quick Access Hubs</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={() => setActiveHub('GAMES')}
                      className="bg-slate-900/80 border border-white/10 hover:border-orange-500/40 p-6 rounded-2xl text-left group transition-all flex flex-col justify-between h-full"
                    >
                      <div className="w-12 h-12 bg-orange-500/15 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500 transition-colors">
                        <Gamepad2 className="w-6 h-6 text-orange-400 group-hover:text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-orange-400 transition-colors">Game Arena</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">Play 6 interactive games with instant rewards sent to your Winning Wallet.</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => setActiveHub('MARKET')}
                      className="bg-slate-900/80 border border-white/10 hover:border-emerald-500/40 p-6 rounded-2xl text-left group transition-all flex flex-col justify-between h-full"
                    >
                      <div className="w-12 h-12 bg-emerald-500/15 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-500 transition-colors">
                        <ShoppingBag className="w-6 h-6 text-emerald-400 group-hover:text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-emerald-400 transition-colors">EFADO Marketplace</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">Shop new and fairly used items from verified sellers with buyer protection.</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => setActiveHub('GIST')}
                      className="bg-slate-900/80 border border-white/10 hover:border-indigo-500/40 p-6 rounded-2xl text-left group transition-all flex flex-col justify-between h-full"
                    >
                      <div className="w-12 h-12 bg-indigo-500/15 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-500 transition-colors">
                        <MessageSquare className="w-6 h-6 text-indigo-400 group-hover:text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-indigo-400 transition-colors">EFADO Social &amp; Reels</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">Connect with friends, share updates, watch short videos, and chat with sellers.</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => setActiveHub('EDUCATION')}
                      className="bg-slate-900/80 border border-white/10 hover:border-sky-500/40 p-6 rounded-2xl text-left group transition-all flex flex-col justify-between h-full"
                    >
                      <div className="w-12 h-12 bg-sky-500/15 rounded-xl flex items-center justify-center mb-4 group-hover:bg-sky-500 transition-colors">
                        <GraduationCap className="w-6 h-6 text-sky-400 group-hover:text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-sky-400 transition-colors">Education Hub</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">Exam prep, study tools, and school resources from primary to postgraduate.</p>
                      </div>
                    </button>
                  </div>
                </section>
              </motion.div>
            )}

            {activeHub === 'GAMES' && (
              <motion.section
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b border-white/10 pb-4">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
                    <Gamepad2 className="w-7 h-7 text-orange-500" />
                    EFADO Game Zone
                  </h2>
                  <div className="px-3.5 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-xs font-semibold text-orange-300">
                    All 6 Games Ready
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Lucky Spin Arena Card */}
                  <div className="glass-card-ultra golden-card-border p-7 rounded-2xl text-center relative flex flex-col justify-between h-full">
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600 rounded-t-2xl" />
                    <div>
                      <div className="w-14 h-14 bg-indigo-600/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <Coins className="w-7 h-7 text-indigo-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Lucky Spin</h3>
                      <p className="text-slate-400 mb-6 text-sm leading-relaxed">Spin the prize wheel to win multiplier rewards based on your stake.</p>
                    </div>
                    <button 
                      onClick={() => setShowSpinWheel(true)}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all text-sm"
                    >
                      Play Lucky Spin
                    </button>
                  </div>

                  {/* EFADO Money Card Card */}
                  <div className="glass-card-ultra golden-card-border p-7 rounded-2xl text-center relative flex flex-col justify-between h-full">
                    <div className="absolute top-0 left-0 w-full h-1 bg-amber-600 rounded-t-2xl" />
                    <div>
                      <div className="w-14 h-14 bg-amber-600/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <CreditCard className="w-7 h-7 text-amber-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Money Card</h3>
                      <p className="text-slate-400 mb-6 text-sm leading-relaxed">Follow the shuffle and pick the winning card across quick rounds.</p>
                    </div>
                    <button 
                      onClick={() => setShowMoneyCard(true)}
                      className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl transition-all text-sm"
                    >
                      Play Money Card
                    </button>
                  </div>

                  {/* Digital Money Trading Card */}
                  <div className="glass-card-ultra golden-card-border p-7 rounded-2xl text-center relative flex flex-col justify-between h-full">
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 rounded-t-2xl" />
                    <div>
                      <div className="w-14 h-14 bg-blue-600/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <Zap className="w-7 h-7 text-blue-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Digital Money Trading</h3>
                      <p className="text-slate-400 mb-6 text-sm leading-relaxed">Predict live market price direction within the countdown to win payouts.</p>
                    </div>
                    <button 
                      onClick={() => setShowTradingGame(true)}
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all text-sm"
                    >
                      Play Trading Game
                    </button>
                  </div>

                  {/* EFADO Money Quiz Card */}
                  <div className="glass-card-ultra golden-card-border p-7 rounded-2xl text-center relative flex flex-col justify-between h-full">
                    <div className="absolute top-0 left-0 w-full h-1 bg-purple-600 rounded-t-2xl" />
                    <div>
                      <div className="w-14 h-14 bg-purple-600/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <Brain className="w-7 h-7 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Money Quiz</h3>
                      <p className="text-slate-400 mb-6 text-sm leading-relaxed">Answer timed general knowledge questions correctly to earn cash rewards.</p>
                    </div>
                    <button 
                      onClick={() => setShowMoneyQuiz(true)}
                      className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-all text-sm"
                    >
                      Play Money Quiz
                    </button>
                  </div>

                  {/* EFADO Equilibrium Card */}
                  <div className="glass-card-ultra golden-card-border p-7 rounded-2xl text-center relative flex flex-col justify-between h-full">
                    <div className="absolute top-0 left-0 w-full h-1 bg-yellow-600 rounded-t-2xl" />
                    <div>
                      <div className="w-14 h-14 bg-yellow-600/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <Dices className="w-7 h-7 text-yellow-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Equilibrium</h3>
                      <p className="text-slate-400 mb-6 text-sm leading-relaxed">Match balanced numbers across quick rounds for steady prize multipliers.</p>
                    </div>
                    <button 
                      onClick={() => setShowEquilibrium(true)}
                      className="w-full py-3.5 bg-yellow-600 hover:bg-yellow-500 text-white font-semibold rounded-xl transition-all text-sm"
                    >
                      Play Equilibrium
                    </button>
                  </div>

                  {/* Deep Sea Jet Card */}
                  <div className="glass-card-ultra golden-card-border p-7 rounded-2xl text-center relative flex flex-col justify-between h-full border border-cyan-500/30">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-600 rounded-t-2xl" />
                    <div>
                      <div className="w-14 h-14 bg-cyan-500/15 border border-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <Waves className="w-7 h-7 text-cyan-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Deep Sea Jet</h3>
                      <div className="flex items-center justify-center gap-1.5 mb-3 flex-wrap">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-800/60 text-cyan-300">Live Multiplier</span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-teal-950/60 border border-teal-800/60 text-teal-300">Dual Bet</span>
                      </div>
                      <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                        Watch the multiplier climb as you dive deeper and cash out before the round ends.
                      </p>
                    </div>
                    <button 
                      onClick={() => setShowDeepSeaJet(true)}
                      className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                    >
                      <Compass className="w-4 h-4" />
                      Play Deep Sea Jet
                    </button>
                  </div>
                </div>
              </motion.section>
            )}

            {activeHub === 'MARKET' && (
              <motion.section
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b border-white/10 pb-4">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
                    <ShoppingBag className="w-7 h-7 text-emerald-500" />
                    EFADO Market Hubs
                  </h2>
                  <div className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-semibold text-emerald-400">
                    Verified Sellers & Escrow
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* EFADO Fairly Used Market Hub Card */}
                  <div className="glass-card-ultra golden-card-border p-7 rounded-2xl text-center relative flex flex-col justify-between h-full">
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 rounded-t-2xl" />
                    <div>
                      <div className="w-14 h-14 bg-emerald-500/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <ShoppingBag className="w-7 h-7 text-emerald-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Fairly Used Market</h3>
                      <p className="text-slate-400 mb-6 text-sm leading-relaxed">Buy and sell quality pre-owned phones, electronics, and household items with buyer protection.</p>
                    </div>
                    <button 
                      onClick={() => setShowMarketHub(true)}
                      className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl transition-all text-sm"
                    >
                      Open Fairly Used Market
                    </button>
                  </div>

                  {/* EFADO Modern Market Hub Card */}
                  <div className="glass-card-ultra golden-card-border p-7 rounded-2xl text-center relative flex flex-col justify-between h-full">
                    <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 rounded-t-2xl" />
                    <div>
                      <div className="w-14 h-14 bg-cyan-500/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <ShoppingBasket className="w-7 h-7 text-cyan-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Modern Market</h3>
                      <p className="text-slate-400 mb-6 text-sm leading-relaxed">Shop brand-new products across fashion, gadgets, home goods, and everyday essentials.</p>
                    </div>
                    <button 
                      onClick={() => setShowModernMarket(true)}
                      className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-xl transition-all text-sm"
                    >
                      Open Modern Market
                    </button>
                  </div>
                </div>
              </motion.section>
            )}

            {activeHub === 'GIST' && (
              <motion.section
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 border border-sky-200 space-y-6"
              >
                <div className="text-center space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                    EFADO Nexus Hub - Chat, Gist and Connect
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600">One place for all your EFADO life.</p>
                  <button
                    onClick={() => navigateToVerticalHub('nexus-hub')}
                    className="px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-sm sm:text-base transition-all"
                  >
                    Open My Hub
                  </button>
                </div>
              </motion.section>
            )}

            {activeHub === 'EDUCATION' && (
              <motion.section
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b border-white/10 pb-4">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
                    <GraduationCap className="w-7 h-7 text-indigo-400" />
                    Education Hub
                  </h2>
                  <button
                    onClick={() => openEducationHubWithSection(undefined)}
                    className="px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
                  >
                    Open All Programs
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Card 1: JAMB */}
                  <div className="glass-card-ultra golden-card-border p-6 sm:p-7 rounded-2xl flex flex-col justify-between relative h-full">
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600 rounded-t-2xl" />
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-indigo-600/15 rounded-xl flex items-center justify-center">
                          <GraduationCap className="w-6 h-6 text-indigo-400" />
                        </div>
                        <span className="text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
                          JAMB Support
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">JAMB UTME Support</h3>
                      <p className="text-slate-400 text-sm leading-relaxed mb-6">
                        Get step-by-step guidance for NIN verification, profile codes, e-PINs, course changes, and admission status checks.
                      </p>
                    </div>
                    <button 
                      onClick={() => openEducationHubWithSection('jamb')}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all text-sm"
                    >
                      Open JAMB Portal
                    </button>
                  </div>

                  {/* Card 2: Post-UTME */}
                  <div className="glass-card-ultra golden-card-border p-6 sm:p-7 rounded-2xl flex flex-col justify-between relative h-full">
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-600 rounded-t-2xl" />
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-emerald-600/15 rounded-xl flex items-center justify-center">
                          <Award className="w-6 h-6 text-emerald-400" />
                        </div>
                        <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                          Screening Prep
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Post-UTME Practice</h3>
                      <p className="text-slate-400 text-sm leading-relaxed mb-6">
                        Practice university screening exams with past questions and check school cut-off marks and course requirements.
                      </p>
                    </div>
                    <button 
                      onClick={() => openEducationHubWithSection('post_utme')}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all text-sm"
                    >
                      Open Screening Portal
                    </button>
                  </div>

                  {/* Card 3: Polytechnic */}
                  <div className="glass-card-ultra golden-card-border p-6 sm:p-7 rounded-2xl flex flex-col justify-between relative h-full">
                    <div className="absolute top-0 left-0 w-full h-1 bg-amber-600 rounded-t-2xl" />
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-amber-600/15 rounded-xl flex items-center justify-center">
                          <Building className="w-6 h-6 text-amber-400" />
                        </div>
                        <span className="text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                          ND / HND & SIWES
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Polytechnic & Technical</h3>
                      <p className="text-slate-400 text-sm leading-relaxed mb-6">
                        Follow ND, HND, and technical training requirements, log SIWES attachments, and review Direct Entry study guides.
                      </p>
                    </div>
                    <button 
                      onClick={() => openEducationHubWithSection('polytechnic')}
                      className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl transition-all text-sm"
                    >
                      Open Technical Portal
                    </button>
                  </div>

                  {/* Card 4: Postgraduate */}
                  <div className="glass-card-ultra golden-card-border p-6 sm:p-7 rounded-2xl flex flex-col justify-between relative h-full">
                    <div className="absolute top-0 left-0 w-full h-1 bg-rose-600 rounded-t-2xl" />
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-rose-600/15 rounded-xl flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-rose-400" />
                        </div>
                        <span className="text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg">
                          Master's & Ph.D.
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Postgraduate & Research</h3>
                      <p className="text-slate-400 text-sm leading-relaxed mb-6">
                        Plan Master's and doctoral theses, format APA or Harvard citations, and prepare for proposal and oral defenses.
                      </p>
                    </div>
                    <button 
                      onClick={() => openEducationHubWithSection('postgraduate')}
                      className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl transition-all text-sm"
                    >
                      Open Research Portal
                    </button>
                  </div>
                </div>

                {/* Card 5: General Hub */}
                <div className="glass-card-ultra golden-card-border p-6 sm:p-7 rounded-2xl relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 rounded-t-2xl" />
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600/15 rounded-xl flex items-center justify-center shrink-0">
                        <Cpu className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-md">All Ages</span>
                        <h3 className="text-lg font-bold text-white mt-1.5">O'Level, Primary & Nursery Learning</h3>
                        <p className="text-slate-400 text-sm mt-1 max-w-xl">
                          Explore O'Level exam prep, early-learning milestones, practice quizzes, and guided AI study help.
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => openEducationHubWithSection(undefined)}
                      className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all text-sm shrink-0"
                    >
                      Open Learning Hub
                    </button>
                  </div>
                </div>
              </motion.section>
            )}

            {activeHub === 'SERVICE_CORPS' && (
              <motion.section
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
                    <HardHat className="w-7 h-7 text-slate-300" />
                    Service Corps
                  </h2>
                </div>
                <div className="max-w-3xl mx-auto">
                  <div className="glass-card-ultra golden-card-border p-8 sm:p-10 rounded-2xl text-center relative">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <HardHat className="w-8 h-8 text-slate-200" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Hire Verified Professionals</h3>
                    <p className="text-slate-300 mb-8 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">Find skilled tradespeople, technicians, builders, and consultants across 14 service categories.</p>
                    <button 
                      onClick={() => setShowServiceCorps(true)}
                      className="px-8 py-3.5 bg-white hover:bg-slate-100 text-slate-950 font-semibold rounded-xl transition-all text-sm"
                    >
                      Browse Service Providers
                    </button>
                  </div>
                </div>
              </motion.section>
            )}

            {showSpinWheel && user && (
              <LuckySpinWheel 
                onClose={() => setShowSpinWheel(false)} 
                user={user}
                onResult={onResult}
                onOpenWallet={openWalletWithTab}
              />
            )}

            {showTradingGame && user && (
              <DigitalMoneyTrading 
                onClose={() => setShowTradingGame(false)} 
                user={user}
                onResult={onResult}
                onOpenWallet={openWalletWithTab}
              />
            )}

            {showMoneyCard && user && (
              <EfadoMoneyCard 
                onClose={() => setShowMoneyCard(false)} 
                user={user}
                onResult={onResult}
                onUpdateBalance={handleWalletUpdate}
                onOpenWallet={openWalletWithTab}
              />
            )}

            {showMarketHub && user && (
              <FairlyUsedMarket 
                user={user}
                onClose={() => setShowMarketHub(false)} 
                onOpenMining={() => setShowEfadoMining(true)}
                onNavigate={handleNavigate}
              />
            )}

            {showModernMarket && user && (
              <ModernMarketHub 
                user={user}
                onClose={() => setShowModernMarket(false)} 
                onOpenMining={() => setShowEfadoMining(true)}
                onNavigate={handleNavigate}
                initialItemId={hubItemId || undefined}
              />
            )}

            {showGistHub && user && (
              <EfadoGistHub 
                user={user}
                onClose={() => setShowGistHub(false)} 
                initialView={gistInitialView}
                autoStartLive={gistAutoStartLive}
                onOpenMining={() => setShowEfadoMining(true)}
                onNavigate={handleNavigate}
                bargainContext={gistBargainContext}
              />
            )}

            {showEducationHub && user && (
              <EfadoEducationHub 
                onClose={() => {
                  setShowEducationHub(false);
                  setEduSectionId(undefined);
                }} 
                user={user}
                onUpdateMining={handleMiningUpdate}
                onNavigate={handleNavigate}
                onOpenMining={() => setShowEfadoMining(true)}
                initialSectionId={eduSectionId}
              />
            )}

            {/* global EFADO Zoom hooks */}
            <AnimatePresence>
              {showZoomPlans && (
                <EfadoZoomPlanSelection 
                  onClose={() => setShowZoomPlans(false)}
                  onSelect={(plan) => {
                    setSelectedZoomPlan(plan);
                    setShowZoomPlans(false);
                    handleStartZoom('Global Reach', 'Strategic Session: Interconnectivity');
                  }}
                />
              )}
              {showEfadoZoom && activeZoomSession && (
                <EfadoZoom 
                  {...activeZoomSession}
                  onClose={() => {
                    setShowEfadoZoom(false);
                    setSelectedZoomPlan(null);
                  }}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {/* Simulated SMS Gateway Floating Banner */}
              {showSmsPopup && authorizedSmsRecipient === 'festdanemh@gmail.com' && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-sm p-5 bg-slate-900/95 border-2 border-amber-500/80 rounded-2xl shadow-2xl backdrop-blur-md animate-bounce">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl shrink-0">
                      <MessageSquare className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-grow text-left">
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Sovereign SMS Gateway</p>
                      <p className="text-xs font-bold text-white mt-1.5 leading-relaxed">
                        Secure SMS to 08072456836: Your EFADO Verification Key is <span className="text-amber-400 font-mono font-black text-sm tracking-widest bg-slate-950 px-2 py-0.5 rounded border border-white/5">{simulatedSmsCode}</span>. Valid for 10 minutes.
                      </p>
                    </div>
                    <button onClick={() => { setShowSmsPopup(false); setAuthorizedSmsRecipient(''); }} className="text-slate-400 hover:text-white shrink-0 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {showCeoVerification && (
                <CeoVerification 
                  onSuccess={() => {
                    setIsCeoVerified(true);
                    setShowCeoVerification(false);
                    setShowCeoPortal(true);
                  }}
                  onClose={() => setShowCeoVerification(false)}
                />
              )}

              {showCeoPortal && (
                <CeoPortal 
                  onClose={() => setShowCeoPortal(false)} 
                  adminStats={adminStats}
                />
              )}

              {showServiceCorps && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                >
                  <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto no-scrollbar bg-white rounded-3xl">
                    <button 
                      onClick={() => setShowServiceCorps(false)}
                      className="absolute top-4 right-4 z-10 p-2 bg-black/10 hover:bg-black/20 rounded-full text-gray-600 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  <EfadoServiceCorps 
                    user={user} 
                    onClose={() => setShowServiceCorps(false)} 
                    onOpenMining={() => setShowEfadoMining(true)} 
                    onNavigate={handleNavigate}
                  />
                  </div>
                </motion.div>
              )}

              {showCSCCRegistration && user && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                >
                  <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
                    <button 
                      onClick={() => setShowCSCCRegistration(false)}
                      className="absolute top-4 right-4 z-10 p-2 bg-black/5 hover:bg-black/10 rounded-full text-gray-400 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                    <CSCCRegistration 
                      user={user}
                      onClose={() => setShowCSCCRegistration(false)}
                      onSuccess={() => {
                        setShowCSCCRegistration(false);
                        setActiveHub('COMMUNITY_HUBS');
                      }}
                    />
                  </div>
                </motion.div>
              )}
              {showEfadoMining && user && (
                <EfadoMining 
                  user={user} 
                  onClose={() => setShowEfadoMining(false)} 
                  onUpdateBalance={handleMiningUpdate}
                />
              )}

              {showAdvertisingHub && user && (
                <EfadoAdvertisingHub 
                  user={user} 
                  onClose={() => setShowAdvertisingHub(false)} 
                  initialType={adInitialType}
                  onNavigate={handleNavigate}
                  onOpenProfile={() => openWalletWithTab('profile')}
                />
              )}

              {showBrowserAddonModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
                >
                  <div className="relative w-full max-w-5xl bg-slate-900 border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden my-8">
                    {/* Modal Header */}
                    <div className="p-6 bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border-b border-indigo-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                          <Globe className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                            EFADO World Browser Ad-On & Google Search Syndication
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[9px] font-black uppercase">GLOBAL LIVE</span>
                          </h2>
                          <p className="text-xs text-slate-400 font-medium">All user-advertised products and "Sell @ EFADO" listings are broadcasted web-wide to all browsers and buyers.</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => setShowBrowserAddonModal(false)}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Network Status Badges */}
                    <div className="p-4 bg-slate-950/60 border-b border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Google Ads Network</p>
                        <p className="text-xs font-black text-emerald-400 mt-0.5">SYNCHRONIZED ✓</p>
                      </div>
                      <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                        <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Meta & Social Feeds</p>
                        <p className="text-xs font-black text-emerald-400 mt-0.5">PROPAGATED ✓</p>
                      </div>
                      <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                        <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">XML Search Sitemap</p>
                        <p className="text-xs font-black text-emerald-400 mt-0.5">INDEXED ✓</p>
                      </div>
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Global Extension Ticker</p>
                        <p className="text-xs font-black text-emerald-400 mt-0.5">ACTIVE BROADCAST ✓</p>
                      </div>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 max-h-[65vh] overflow-y-auto">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black text-slate-300 uppercase tracking-wider">
                          Live Advertised Products & Marketplace Inventory ({globalAdListings.length})
                        </h3>
                        <button
                          onClick={() => {
                            setShowBrowserAddonModal(false);
                            handleNavigate('ADVERTISING', 'SELL');
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all"
                        >
                          + Post Your Product / Advert Now
                        </button>
                      </div>

                      {globalAdListings.length === 0 ? (
                        <div className="text-center py-16 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800">
                          <Globe className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
                          <p className="text-sm font-bold text-slate-400 uppercase">No live products currently advertised in the network.</p>
                          <p className="text-xs text-slate-500 mt-1">Be the first user to post an ad or sell a product to broadcast it worldwide!</p>
                          <button
                            onClick={() => {
                              setShowBrowserAddonModal(false);
                              handleNavigate('ADVERTISING', 'SELL');
                            }}
                            className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                          >
                            Post First Advert / Product
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {globalAdListings.map((ad, adIdx) => (
                            <div 
                              key={`${ad.id || 'ad'}-${adIdx}`}
                              className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex gap-4 hover:border-indigo-500/50 transition-all group"
                            >
                              <div className="w-28 h-28 bg-slate-900 rounded-xl overflow-hidden shrink-0 relative flex items-center justify-center">
                                {ad.photos?.[0] ? (
                                  <img 
                                    src={ad.photos[0]} 
                                    alt={ad.title} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <ShoppingBag className="w-8 h-8 text-slate-500" />
                                )}
                                <span className={`absolute top-1 left-1 px-2 py-0.5 rounded text-[10px] font-semibold text-white ${ad.type === 'SELL' ? 'bg-rose-600' : 'bg-indigo-600'}`}>
                                  {ad.type === 'SELL' ? 'For Sale' : 'Advert'}
                                </span>
                              </div>

                              <div className="flex-1 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="text-sm font-black text-white uppercase line-clamp-1">{ad.title}</h4>
                                    <span className="text-xs font-black text-emerald-400 italic shrink-0">
                                      ₦{Number(ad.price || 0).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{ad.description}</p>
                                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
                                    <span>📍 {ad.location?.city || ad.location?.state || 'Nigeria'}</span>
                                    <span>• 👤 {ad.contact?.email ? ad.contact.email.split('@')[0] : 'Verified Seller'}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-900">
                                  <button
                                    onClick={() => handleDirectBuyAdProduct(ad)}
                                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-md"
                                  >
                                    🛒 Buy via Wallet
                                  </button>
                                  {ad.contact?.whatsapp && (
                                    <a
                                      href={`https://wa.me/${ad.contact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi! I want to buy your advertised item on EFADO: ${ad.title}`)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg text-xs font-bold"
                                      title="Chat on WhatsApp"
                                    >
                                      💬
                                    </a>
                                  )}
                                  {ad.contact?.phone && (
                                    <a
                                      href={`tel:${ad.contact.phone}`}
                                      className="p-2 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded-lg text-xs font-bold"
                                      title="Call Seller"
                                    >
                                      📞
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              <UserGuideModal 
                isOpen={showUserGuide}
                onClose={() => setShowUserGuide(false)}
                onOpenProfile={() => {
                  setShowUserGuide(false);
                  openWalletWithTab('profile');
                }}
              />

              <AboutCeoModal 
                isOpen={showAboutCeo}
                onClose={() => setShowAboutCeo(false)}
              />

              <IosInstallGuideModal 
                isOpen={showIosInstallGuide}
                onClose={() => setShowIosInstallGuide(false)}
              />
            </AnimatePresence>

            {activeHub === 'COMMUNITY_HUBS' && user && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-8 sm:p-10 rounded-2xl shadow-xl text-white text-center border border-white/10 max-w-2xl mx-auto">
                  <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-7 h-7 text-purple-100" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Community Savings (CSCC)</h3>
                  <p className="text-purple-100 mb-6 text-sm leading-relaxed">Join community savings circles with transparent schedules and rotating payouts.</p>
                  <button 
                    onClick={() => setShowCommunityHub(true)}
                    className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-purple-50 text-purple-700 font-semibold rounded-xl shadow-md transition-all text-sm"
                  >
                    Open Community Hub
                  </button>
                </div>
              </motion.section>
            )}

            {showCommunityHub && user && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto no-scrollbar"
              >
                <div className="relative min-h-screen">
                  <button 
                    onClick={() => setShowCommunityHub(false)}
                    className="fixed top-4 right-4 z-[60] p-2 bg-black/10 hover:bg-black/20 rounded-full text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <EfadoCommunityHubs 
                    user={user} 
                    onOpenMining={() => setShowEfadoMining(true)} 
                    onNavigate={handleNavigate}
                    onClose={() => setShowCommunityHub(false)}
                  />
                </div>
              </motion.div>
            )}

            {activeHub === 'HEPIHANDS_LOAN' && user && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 sm:p-10 rounded-2xl shadow-xl text-white text-center border border-white/10 max-w-2xl mx-auto">
                  <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <HandCoins className="w-7 h-7 text-emerald-100" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">HEPIHANDS Loan</h3>
                  <p className="text-emerald-100 mb-6 text-sm leading-relaxed">Apply for transparent member loans with clear repayment schedules and quick verification.</p>
                  <button 
                    onClick={() => setShowHepiHandsLoan(true)}
                    className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-emerald-50 text-emerald-700 font-semibold rounded-xl shadow-md transition-all text-sm"
                  >
                    Open Loan Hub
                  </button>
                </div>
              </motion.section>
            )}

            {activeHub === 'HEPIHANDS_LOAN' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <EfadoHepiHandsLoan user={user} />
              </motion.div>
            )}

            {activeHub === 'DOMAIN_HUB' && (
              <motion.section
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="bg-gradient-to-br from-indigo-600 to-blue-800 p-8 sm:p-10 rounded-2xl text-white text-center shadow-xl max-w-2xl mx-auto border border-white/10">
                  <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-7 h-7 text-indigo-100" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">Domain & China Sourcing Hub</h2>
                  <p className="text-indigo-100 max-w-xl mx-auto text-sm leading-relaxed mb-6">Register web domains or request wholesale factory sourcing and shipping from China.</p>
                  <button 
                    onClick={() => setShowDomainHub(true)}
                    className="px-8 py-3.5 bg-white hover:bg-indigo-50 text-indigo-700 rounded-xl font-semibold text-sm shadow-md transition-all"
                  >
                    Open Domain & Sourcing Hub
                  </button>
                </div>
              </motion.section>
            )}

            {activeHub === 'TECH_HUB' && (
              <motion.section
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="bg-gradient-to-br from-cyan-600 to-teal-800 p-8 sm:p-10 rounded-2xl text-white text-center shadow-xl max-w-2xl mx-auto border border-white/10">
                  <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Cpu className="w-7 h-7 text-cyan-100" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">EFADO Tech Hub</h2>
                  <p className="text-cyan-100 max-w-xl mx-auto text-sm leading-relaxed mb-6">Explore coding tutorials, AI tools, digital project kits, and developer resources.</p>
                  <button 
                    onClick={() => setShowTechHub(true)}
                    className="px-8 py-3.5 bg-white hover:bg-cyan-50 text-cyan-800 rounded-xl font-semibold text-sm shadow-md transition-all"
                  >
                    Open Tech Hub
                  </button>
                </div>
              </motion.section>
            )}

            {activeHub === 'FAIRLY_USED' && (
              <motion.section
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="bg-gradient-to-br from-indigo-700 to-slate-900 p-8 sm:p-10 rounded-2xl text-white text-center shadow-xl max-w-2xl mx-auto border border-white/10">
                  <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Package className="w-7 h-7 text-indigo-100" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">Fairly Used Market</h2>
                  <p className="text-indigo-100 max-w-xl mx-auto text-sm leading-relaxed mb-6">Buy or list pre-owned phones, electronics, and household items from verified sellers.</p>
                  <button 
                    onClick={() => setShowMarketHub(true)}
                    className="px-8 py-3.5 bg-white hover:bg-slate-100 text-indigo-800 rounded-xl font-semibold text-sm shadow-md transition-all"
                  >
                    Open Fairly Used Market
                  </button>
                </div>
              </motion.section>
            )}

            {activeHub === 'PARTNER_HUB' && user && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <EfadoPartnerHub user={user} onNavigate={(hub) => setActiveHub(hub as any)} />
              </motion.div>
            )}

            {activeHub === 'DIGITAL_SERVICES_HUB' && user && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <EfadoDigitalServicesHub
                  user={user}
                  initialSection={digitalServicesSection}
                  onOpenWallet={openWalletWithTab}
                />
              </motion.div>
            )}

            {showMoneyQuiz && user && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-3xl overflow-y-auto no-scrollbar py-8 px-4"
              >
                <div className="max-w-6xl mx-auto">
                  <EfadoMoneyQuiz 
                    user={user}
                    onUpdateBalance={handleWalletUpdate}
                    onAddTransaction={handleAddTransaction}
                    onClose={() => setShowMoneyQuiz(false)}
                    onOpenWallet={openWalletWithTab}
                  />
                </div>
              </motion.div>
            )}

            {showEquilibrium && user && (
              <EfadoEquilibrium 
                user={user}
                onClose={() => setShowEquilibrium(false)}
                onResult={onResult}
                onGameStart={handleStakeDeduction}
                onUpdateBalance={handleWalletUpdate}
                onAddTransaction={handleAddTransaction}
                onOpenWallet={openWalletWithTab}
              />
            )}

            {showDeepSeaJet && user && (
              <DeepSeaJetGame 
                user={user}
                onClose={() => setShowDeepSeaJet(false)}
                onResult={onResult}
                onGameStart={handleStakeDeduction}
                onUpdateBalance={() => {
                  // User balance is synchronized via real-time firestore onSnapshot or local state in DEV mode
                }}
                onOpenWallet={openWalletWithTab}
              />
            )}

            {showTechHub && user && (
              <EfadoTechHub 
                user={user}
                onClose={() => setShowTechHub(false)}
                onStartZoomSession={handleStartZoom}
              />
            )}

            {showDomainHub && user && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto no-scrollbar"
              >
                <div className="relative min-h-screen">
                  <button 
                    onClick={() => setShowDomainHub(false)}
                    className="fixed top-4 right-4 z-[60] p-2 bg-black/10 hover:bg-black/20 rounded-full text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <EfadoDomainHub user={user} initialSection={domainHubSection} />
                </div>
              </motion.div>
            )}

            {/* Transaction History */}
            <section className="relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-gray-400" />
                  Recent Transactions
                </h2>

                {/* Search & Collapse Toggle Actions */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1); // Reset page to 1
                      }}
                      className="w-48 sm:w-64 pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold placeholder:text-gray-400"
                    />
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <button
                    onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                    className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-bold transition-all ${
                      isFilterExpanded 
                        ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/10' 
                        : 'bg-white hover:bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filters</span>
                    {isFilterExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Collapsible search/filter menu section */}
              {isFilterExpanded && (
                <div className="mb-6 p-5 bg-gray-50 border border-gray-100 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in animate-duration-300 shadow-inner">
                  {/* Date ranges */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Start Date</label>
                    <input 
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => {
                        setFilterStartDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-amber-500 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">End Date</label>
                    <input 
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => {
                        setFilterEndDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-amber-500 font-bold"
                    />
                  </div>

                  {/* Sender & Receiver search parameters */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Sender Name</label>
                    <input 
                      type="text"
                      placeholder="Sender field keyword..."
                      value={filterSender}
                      onChange={(e) => {
                        setFilterSender(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 pr-2 py-2 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-amber-500 font-bold placeholder:text-gray-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Receiver Name</label>
                    <input 
                      type="text"
                      placeholder="Receiver field keyword..."
                      value={filterReceiver}
                      onChange={(e) => {
                        setFilterReceiver(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-amber-500 font-bold placeholder:text-gray-300"
                    />
                  </div>

                  {/* Type drop down */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Transaction Type</label>
                    <select
                      value={filterType}
                      onChange={(e) => {
                        setFilterType(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-amber-500 font-bold"
                    >
                      <option value="ALL">All Types</option>
                      <option value="deposit">Deposit</option>
                      <option value="withdrawal">Withdrawal</option>
                      <option value="game_win">Game Win</option>
                      <option value="game_bet">Challenge Entry</option>
                      <option value="payment">Payment</option>
                      <option value="payout font-bold">Payout</option>
                    </select>
                  </div>

                  {/* Status drop down */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-amber-500 font-bold"
                    >
                      <option value="ALL">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>

                  {/* Amount Ranges */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Min Amount</label>
                    <input 
                      type="number"
                      placeholder="Min $"
                      value={filterMinAmount}
                      onChange={(e) => {
                        setFilterMinAmount(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-amber-500 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Max Amount</label>
                    <input 
                      type="number"
                      placeholder="Max $"
                      value={filterMaxAmount}
                      onChange={(e) => {
                        setFilterMaxAmount(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-amber-500 font-bold"
                    />
                  </div>

                  {/* Reset Filters button */}
                  <div className="col-span-1 sm:col-span-2 md:col-span-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterStartDate('');
                        setFilterEndDate('');
                        setFilterSender('');
                        setFilterReceiver('');
                        setFilterType('ALL');
                        setFilterStatus('ALL');
                        setFilterMinAmount('');
                        setFilterMaxAmount('');
                        setSearchQuery('');
                        setCurrentPage(1);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-300 transition-colors"
                    >
                      Clear All Filter Parameters
                    </button>
                  </div>
                </div>
              )}

              {/* Direct Jump Suggestions Tray (Required smooth scroll and highlight trigger) */}
              {searchQuery.trim() && filteredTransactions.length > 0 && (
                <div className="mb-4 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                  <span className="text-[9px] font-black uppercase text-amber-600 tracking-widest block mb-2">
                    🎯 Quick Select Search Results ({filteredTransactions.length} Matches Found)
                  </span>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto no-scrollbar">
                    {filteredTransactions.slice(0, 10).map((tx, idx) => {
                      const uniqueId = tx.id || String(tx.timestamp?.seconds || idx);
                      return (
                        <button
                          key={`suggestion-${uniqueId}-${idx}`}
                          onClick={() => {
                            const indexInFiltered = filteredTransactions.findIndex(t => (t.id && t.id === tx.id) || t.timestamp?.seconds === tx.timestamp?.seconds);
                            if (indexInFiltered !== -1) {
                              const pageNum = Math.floor(indexInFiltered / 20) + 1;
                              setCurrentPage(pageNum);
                              setHighlightedTxId(uniqueId);
                              setTimeout(() => {
                                const rowEl = document.getElementById(`tx-row-${uniqueId}`);
                                if (rowEl) {
                                  rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }, 150);
                              setTimeout(() => setHighlightedTxId(null), 3000);
                            }
                          }}
                          className="px-3 py-1.5 bg-white border border-gray-200 hover:border-amber-500 rounded-xl text-left text-[10px] font-bold text-gray-600 hover:text-amber-600 flex items-center gap-1.5 transition-all shadow-sm max-w-xs truncate"
                        >
                          <span className="capitalize text-amber-500">{tx.type.replace('_', ' ')}:</span>
                          <span>${(tx.amount || 0).toFixed(2)}</span>
                          <span className="text-[8px] text-gray-400 truncate max-w-[80px]">({tx.purpose || tx.id || 'Operation'})</span>
                        </button>
                      );
                    })}
                    {filteredTransactions.length > 10 && (
                      <span className="text-[8.5px] font-bold text-gray-400 self-center leading-none pl-1">
                        + {filteredTransactions.length - 10} more matches
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Transaction Main Table List Component Wrapper */}
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm italic">
                            {transactions.length === 0 
                              ? "No transactions yet. Start playing to see your history!" 
                              : "No transactions match your active filter details."}
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.slice((Math.min(currentPage, Math.max(1, Math.ceil(filteredTransactions.length / 20))) - 1) * 20, Math.min(currentPage, Math.max(1, Math.ceil(filteredTransactions.length / 20))) * 20).map((tx, idx) => {
                          const realIdx = (Math.min(currentPage, Math.max(1, Math.ceil(filteredTransactions.length / 20))) - 1) * 20 + idx;
                          const uniqueId = tx.id || String(tx.timestamp?.seconds || realIdx);
                          const isHighlighted = highlightedTxId === uniqueId;
                          return (
                            <tr 
                              key={`${uniqueId}-${idx}`} 
                              id={`tx-row-${uniqueId}`}
                              className={`transition-all duration-500 ${
                                isHighlighted 
                                  ? 'bg-amber-100/50 hover:bg-amber-100 ring-2 ring-amber-400 scale-[1.005]' 
                                  : 'hover:bg-gray-50'
                              } transition-colors`}
                            >
                              <td className="px-6 py-4">
                                <span className={`text-sm font-bold capitalize ${
                                  tx.type === 'game_win' ? 'text-green-600' : 
                                  tx.type === 'game_bet' ? 'text-red-600' : 
                                  tx.type === 'deposit' ? 'text-blue-600' : 'text-orange-600'
                                }`}>
                                  {tx.type === 'game_bet' ? 'Challenge Entry' : tx.type === 'game_win' ? 'Game Reward' : tx.type.replace('_', ' ')}
                                </span>
                                {tx.purpose && (
                                  <span className="block text-[10px] text-gray-400 uppercase tracking-tighter mt-0.5">
                                    {tx.purpose}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 font-mono font-bold text-sm">
                                ${(tx.amount || 0).toFixed(2)}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  tx.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                  tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {tx.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs text-gray-400">
                                {tx.timestamp?.toDate ? tx.timestamp.toDate().toLocaleString() : 'Just now'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Elegant Pagination controls */}
                {filteredTransactions.length > 20 && (
                  <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex items-center justify-between">
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                      Showing {((Math.min(currentPage, Math.max(1, Math.ceil(filteredTransactions.length / 20))) - 1) * 20) + 1} - {Math.min(Math.min(currentPage, Math.max(1, Math.ceil(filteredTransactions.length / 20))) * 20, filteredTransactions.length)} of {filteredTransactions.length} Entries
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={Math.min(currentPage, Math.max(1, Math.ceil(filteredTransactions.length / 20))) === 1}
                        className="p-2 border border-gray-200 bg-white rounded-xl text-gray-500 disabled:opacity-40 transition-colors hover:bg-gray-50"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      {/* Render direct page indices */}
                      {Array.from({ length: Math.ceil(filteredTransactions.length / 20) }).map((_, pIdx) => {
                        const pageNum = pIdx + 1;
                        const activePage = Math.min(currentPage, Math.max(1, Math.ceil(filteredTransactions.length / 20)));
                        const isCurrent = pageNum === activePage;
                        // For large list, compress
                        if (Math.ceil(filteredTransactions.length / 20) > 5 && Math.abs(pageNum - activePage) > 1 && pageNum !== 1 && pageNum !== Math.ceil(filteredTransactions.length / 20)) {
                          if (pageNum === 2 || pageNum === Math.ceil(filteredTransactions.length / 20) - 1) {
                            return <span key={`ellipsis-${pageNum}`} className="px-1 text-xs text-gray-400">...</span>;
                          }
                          return null;
                        }
                        return (
                          <button
                            key={`page-btn-${pageNum}`}
                            type="button"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 flex items-center justify-center text-xs font-black rounded-xl border transition-all ${
                              isCurrent 
                                ? 'bg-amber-500 border-amber-500 text-white shadow-sm' 
                                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredTransactions.length / 20), prev + 1))}
                        disabled={Math.min(currentPage, Math.max(1, Math.ceil(filteredTransactions.length / 20))) === Math.ceil(filteredTransactions.length / 20)}
                        className="p-2 border border-gray-200 bg-white rounded-xl text-gray-500 disabled:opacity-40 transition-colors hover:bg-gray-50"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Scroll to top floating action helper button */}
              {showScrollTop && (
                <button
                  type="button"
                  onClick={scrollToTop}
                  className="fixed bottom-6 right-6 z-50 p-4 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all text-xs flex items-center justify-center align-middle focus:ring-4 focus:ring-amber-500/20 shadow-amber-500/40"
                  title="Scroll back to top"
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
              )}
            </section>
          </div>

          {/* Sidebar / Admin Info */}
          <div className="space-y-8">
            {user.role === 'admin' && adminStats && (
              <section className="bg-gray-900 text-white p-8 rounded-3xl shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-500 rounded-lg">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold">Admin Dashboard</h2>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Ecosystem Revenue</span>
                    <p className="text-4xl font-black text-indigo-400 mt-1">${(adminStats?.totalHouseGain || 0).toFixed(2)}</p>
                  </div>
                  
                  <div className="pt-6 border-t border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-400">Admin Wallet</span>
                      <span className="text-lg font-bold text-white">${(adminStats?.adminWallet || 0).toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-500 italic leading-relaxed">
                    * Mathematical logic is calibrated to ensure sustainable platform operations and continuous rewards pool liquidity.
                  </p>
                </div>
              </section>
            )}

            <section className="bg-slate-900/60 backdrop-blur-3xl p-8 rounded-3xl border border-white/5 shadow-2xl">
              <h3 className="font-black text-white mb-6 uppercase tracking-widest italic">Operational Roadmap</h3>
              <ul className="space-y-4">
                <li className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0 shadow-lg shadow-indigo-500/20">1</div>
                  <p className="text-xs text-slate-300 font-bold uppercase tracking-tight leading-relaxed pt-1">Initialize capital flow by depositing funds into your **Sovereign Deposit Wallet**.</p>
                </li>
                <li className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0 shadow-lg shadow-indigo-500/20">2</div>
                  <p className="text-xs text-slate-300 font-bold uppercase tracking-tight leading-relaxed pt-1">Engage the **Lucky Spin Protocol** using your authorized **Tactical Player Wallet**.</p>
                </li>
                <li className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0 shadow-lg shadow-indigo-500/20">3</div>
                  <p className="text-xs text-slate-300 font-bold uppercase tracking-tight leading-relaxed pt-1">Extracted winnings are transmitted to your **Secured Cash Out Wallet** for tactical retrieval.</p>
                </li>
              </ul>
            </section>
          </div>
        </div>
        )}

        {/* Global Google AdSense Ecosystem Placement for non-CEO pages */}
        <div className="max-w-7xl mx-auto px-4 mt-8">
          <AdSenseBanner label="EFADO Global Ecosystem Sponsored Ads" />
        </div>
      </main>

      <footer className="glass-card-ultra border-t border-white/5 py-12 mt-12 bg-slate-950/80 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tighter">EFADO HUBS</h2>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">One World. One Ecosystem.</p>
              </div>
            </div>
            
            <div className="flex gap-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
              <button onClick={() => { setLegalHubSection('PRIVACY'); setShowLegalHub(true); }} className="hover:text-indigo-400 transition-colors">Privacy Policy</button>
              <button onClick={() => { setLegalHubSection('TERMS'); setShowLegalHub(true); }} className="hover:text-indigo-400 transition-colors">Terms of Service</button>
              <button onClick={() => { setLegalHubSection('GAMING'); setShowLegalHub(true); }} className="hover:text-indigo-400 transition-colors">Gaming Compliance</button>
              <button onClick={() => { setLegalHubSection('DISCLAIMER'); setShowLegalHub(true); }} className="hover:text-indigo-400 transition-colors">Disclaimers</button>
            </div>

            <div className="text-sm text-slate-500 font-medium font-mono uppercase tracking-widest">
              © 2026 EFADO Hubs Connect. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
      {/* Age Gate Modal */}
      <AnimatePresence>
        {showAgeGate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 max-w-md w-full text-center space-y-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-orange-600 to-red-600" />
              
              <div className="mx-auto w-20 h-20 bg-emerald-600/10 rounded-[2rem] flex items-center justify-center">
                <UserCheck className="w-10 h-10 text-emerald-500" />
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Strategic Maturity Verification</h2>
                <p className="text-slate-200 text-sm leading-relaxed font-bold italic">
                  In compliance with Nigerian Federal Regulations and Google Policy, the EFADO Gaming Arena is strictly reserved for participants aged **18 and above**.
                </p>
              </div>

              <div className="p-6 bg-indigo-600/10 rounded-3xl border border-indigo-500/20 flex items-start gap-4 text-left">
                <ShieldCheck className="w-5 h-5 text-indigo-400 mt-1 shrink-0" />
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">
                  By clicking verify, you attest under penalty of platform blacklisting that you are of legal age in your jurisdiction.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    setIsAgeVerified(true);
                    setShowAgeGate(false);
                    setActiveHub('GAMES');
                  }}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 hover:bg-indigo-500 transition-all"
                >
                  Confirm & Access Arena
                </button>
                <button 
                  onClick={() => setShowAgeGate(false)}
                  className="w-full py-4 bg-white/5 border border-white/10 text-slate-400 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all font-mono"
                >
                  I am Under Age
                </button>
              </div>

              <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                Protected by EFADO Compliance Oversight
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Priority Modals */}
      <AnimatePresence>
        {announcements
          .filter(ann => ann.active !== false && !dismissedAnnouncements.includes(ann.id || '') && ann.type === 'modal')
          .map((ann, idx) => {
            const key = ann.id || `modal-${idx}`;
            const tierColors = 
              ann.tier === 'success' ? { bg: 'bg-emerald-950/95 border-emerald-500/20', text: 'text-emerald-200', btn: 'bg-emerald-600 hover:bg-emerald-500 text-white', icon: CheckCircle2, iconColor: 'text-emerald-400 bg-emerald-500/10' } :
              ann.tier === 'warning' ? { bg: 'bg-amber-950/95 border-amber-500/20', text: 'text-amber-200', btn: 'bg-amber-600 hover:bg-amber-500 text-white', icon: AlertCircle, iconColor: 'text-amber-400 bg-amber-500/10' } :
              ann.tier === 'urgent' ? { bg: 'bg-rose-950/95 border-rose-500/30 border-2', text: 'text-rose-200', btn: 'bg-rose-600 hover:bg-rose-500 text-white', icon: ShieldAlert, iconColor: 'text-rose-400 bg-rose-500/10' } :
              { bg: 'bg-slate-900/95 border-white/10', text: 'text-indigo-200', btn: 'bg-indigo-600 hover:bg-indigo-500 text-white', icon: Megaphone, iconColor: 'text-indigo-400 bg-indigo-500/10' };

            const IconComponent = tierColors.icon;

            return (
              <motion.div 
                key={key}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className={`w-full max-w-lg p-8 rounded-[2.5rem] border shadow-2xl text-center relative overflow-hidden ${tierColors.bg}`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <button 
                    onClick={() => setDismissedAnnouncements(prev => [...prev, ann.id || ''])}
                    className="absolute top-5 right-5 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex flex-col items-center">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${tierColors.iconColor}`}>
                      <IconComponent className="w-7 h-7" />
                    </div>

                    <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">
                      {ann.title || 'Broadcast Alert'}
                    </h3>

                    <p className={`text-sm leading-relaxed mb-6 font-bold ${tierColors.text}`}>
                      {ann.message}
                    </p>

                    <div className="flex w-full gap-4">
                      {ann.actionUrl && (
                        <a 
                          href={ann.actionUrl}
                          target={ann.actionUrl.startsWith('http') ? '_blank' : '_self'}
                          rel="noopener noreferrer"
                          onClick={() => setDismissedAnnouncements(prev => [...prev, ann.id || ''])}
                          className={`flex-1 py-4 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg transition-all text-center flex items-center justify-center`}
                        >
                          {ann.actionText || 'Explore'}
                        </a>
                      )}
                      <button 
                        onClick={() => setDismissedAnnouncements(prev => [...prev, ann.id || ''])}
                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
                      >
                        Acknowledge
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
      </AnimatePresence>

      {/* Global Floating Toasts */}
      <div className="fixed bottom-6 right-6 z-[240] flex flex-col gap-3 max-w-sm w-full">
        <AnimatePresence>
          {announcements
            .filter(ann => ann.active !== false && !dismissedAnnouncements.includes(ann.id || '') && ann.type === 'toast')
            .map((ann, idx) => {
              const key = ann.id || `toast-${idx}`;
              const tierStyles = 
                ann.tier === 'success' ? { border: 'border-emerald-500/20 bg-emerald-950/95 text-emerald-200', side: 'bg-emerald-500' } :
                ann.tier === 'warning' ? { border: 'border-amber-500/20 bg-amber-950/95 text-amber-200', side: 'bg-amber-500' } :
                ann.tier === 'urgent' ? { border: 'border-rose-500/20 bg-rose-950/95 text-rose-200', side: 'bg-rose-500 animate-pulse' } :
                { border: 'border-indigo-500/20 bg-slate-900/95 text-indigo-200', side: 'bg-indigo-500' };

              return (
                <motion.div 
                  key={key}
                  initial={{ opacity: 0, x: 50, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 50, scale: 0.9 }}
                  className={`p-5 rounded-2xl border shadow-xl flex items-start gap-3 relative overflow-hidden text-left ${tierStyles.border}`}
                >
                  <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${tierStyles.side}`} />
                  
                  <div className="flex-grow pl-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-extrabold text-[10.5px] uppercase tracking-wider text-white leading-none">
                        {ann.title || 'System Notification'}
                      </h4>
                      <button 
                        onClick={() => setDismissedAnnouncements(prev => [...prev, ann.id || ''])}
                        className="p-1 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11.5px] font-bold text-slate-300 leading-normal">
                      {ann.message}
                    </p>

                    {ann.actionUrl && (
                      <div className="pt-2">
                        <a 
                          href={ann.actionUrl}
                          target={ann.actionUrl.startsWith('http') ? '_blank' : '_self'}
                          rel="noopener noreferrer"
                          onClick={() => setDismissedAnnouncements(prev => [...prev, ann.id || ''])}
                          className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all"
                        >
                          {ann.actionText || 'Explore'} <ArrowRight className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
        </AnimatePresence>
      </div>

      <LegalHub 
        isOpen={showLegalHub} 
        onClose={() => setShowLegalHub(false)} 
        initialSection={legalHubSection}
      />

      <SupportHelpModal user={user} />
      {renderWalletModal()}
    </div>
  );
}
