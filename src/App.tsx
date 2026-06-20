import React, { useState, useEffect } from 'react';
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
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
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
import { EfadoEducationHub } from './components/EfadoEducationHub';
import { EfadoTechHub } from './components/tech/EfadoTechHub';
import { EfadoZoom } from './components/EfadoZoom';
import { EfadoHelpChat } from './components/EfadoHelpChat';
import { EfadoZoomPlanSelection } from './components/EfadoZoomPlanSelection';
import { EfadoLogo } from './components/EfadoLogo';
import { EfadoPartnerHub } from './components/EfadoPartnerHub';
import { CSCCRegistration } from './components/CSCCRegistration';
import { HubHeroCarousel } from './components/HubHeroCarousel';
import { UserWallet } from './components/UserWallet';
import { EfadoMining } from './components/EfadoMining';
import { EfadoAdvertisingHub } from './components/EfadoAdvertisingHub';
import { EfadoIntelligenceFeed } from './components/EfadoIntelligenceFeed';
import { UserGuideModal } from './components/UserGuideModal';
import { LegalHub } from './components/LegalHub';
import { AboutCeoModal } from './components/AboutCeoModal';
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
  Video,
  Cpu,
  HelpCircle,
  UserCheck,
  Package,
  Share2,
  Handshake,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CurrencyProvider, useCurrency } from './lib/CurrencyContext';
import { CurrencySelector } from './components/CurrencySelector';

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
    <CurrencyProvider>
      <AppContent />
    </CurrencyProvider>
  );
}

function AppContent() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const { selectedCurrency, formatPrice } = useCurrency();
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveUsers, setLiveUsers] = useState(1240);

  // Super Admin login states
  const [loginMode, setLoginMode] = useState<'STANDARD' | 'CEO'>('STANDARD');
  
  // Standard User email-based auth states (for fallback logins on WhatsApp / webview / custom domain errors)
  const [standardEmailMode, setStandardEmailMode] = useState<'GOOGLE' | 'EMAIL_LOGIN' | 'EMAIL_REGISTER'>('GOOGLE');
  const [standardEmail, setStandardEmail] = useState('');
  const [standardPassword, setStandardPassword] = useState('');
  const [standardDisplayName, setStandardDisplayName] = useState('');
  const [standardRegisterSuccess, setStandardRegisterSuccess] = useState<string | null>(null);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

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
  }, []);
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
    // Keep dynamic CEO password synchronized from centralized system settings in Firestore
    const unsub = onSnapshot(doc(db, 'adminStats', 'settings'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.ceoPassword) {
          setDynamicCeoPassword(data.ceoPassword.trim());
          console.log('Centralized CEO Authorization Credential synced safely.');
        }
      }
    });
    return () => unsub();
  }, []);

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
  const [showMoneyQuiz, setShowMoneyQuiz] = useState(false);
  const [showEquilibrium, setShowEquilibrium] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [walletInitialTab, setWalletInitialTab] = useState<'overview' | 'profile' | 'deposit' | 'withdraw' | 'history' | 'settings'>('overview');
  
  const openWalletWithTab = (tab: 'overview' | 'profile' | 'deposit' | 'withdraw' | 'history' | 'settings') => {
    setWalletInitialTab(tab);
    setShowWallet(true);
  };

  const [showEfadoMining, setShowEfadoMining] = useState(false);
  const [showAdvertisingHub, setShowAdvertisingHub] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [showAboutCeo, setShowAboutCeo] = useState(false);
  const [adInitialType, setAdInitialType] = useState<'ADVERT' | 'SELL'>('ADVERT');

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

  const handleStakeDeduction = async (amount: number, gameId: string) => {
    if (!user || user.depositWallet < amount) return;

    if (DEVELOPMENT_MODE) {
      setUser({
        ...user,
        depositWallet: user.depositWallet - amount
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
        const userRef = doc(db, 'users', user.uid);
        const adminRef = doc(db, 'adminStats', 'global');
        
        const statsSnap = await transaction.get(adminRef);
        const stats = statsSnap.data() as AdminStats;

        transaction.update(userRef, {
          depositWallet: increment(-amount)
        });

        transaction.update(adminRef, {
          adminWallet: increment(amount),
          totalHouseGain: increment(amount),
          gameWallets: {
            ...stats.gameWallets,
            [gameId]: ((stats.gameWallets as any)[gameId] || 0) + amount
          },
          lastUpdated: serverTimestamp()
        });
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'stake_deduction');
    }
  };

  const [showEfadoZoom, setShowEfadoZoom] = useState(false);
  const [showZoomPlans, setShowZoomPlans] = useState(false);
  const [selectedZoomPlan, setSelectedZoomPlan] = useState<any>(null);
  const [activeZoomSession, setActiveZoomSession] = useState<any>(null);
  const [gistInitialView, setGistInitialView] = useState<'FEED' | 'REELS' | 'CHAT' | 'ADS' | 'PROFILE' | 'CATEGORIES' | 'BLOG' | 'FAQ' | 'TOOLS'>('FEED');
  const [gistAutoStartLive, setGistAutoStartLive] = useState(false);
  const [activeHub, setActiveHub] = useState<'HOME' | 'DASHBOARD' | 'GAMES' | 'MARKET' | 'GIST' | 'SERVICE_CORPS' | 'COMMUNITY_HUBS' | 'HEPIHANDS_LOAN' | 'DOMAIN_HUB' | 'EDUCATION' | 'ZOOM' | 'TECH' | 'ADVERTISING' | 'QUIZ' | 'PARTNER_HUB' | 'TECH_HUB' | 'FAIRLY_USED'>('HOME');
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [showLegalHub, setShowLegalHub] = useState(false);
  const [legalHubSection, setLegalHubSection] = useState<'TERMS' | 'PRIVACY' | 'GAMING' | 'DISCLAIMER'>('TERMS');
  const [showTechHub, setShowTechHub] = useState(false);

  const handleNavigate = (hub: any, subview?: any) => {
    if (hub === 'COMMUNITY_HUBS') {
      if (user && !user.csccRegistered) {
        setShowCSCCRegistration(true);
      } else {
        setActiveHub('COMMUNITY_HUBS');
      }
      return;
    }

    setActiveHub(hub);
    if (hub === 'GAMES' && !isAgeVerified) {
      setShowAgeGate(true);
      return;
    }
    
    if (hub === 'USER_GUIDE') {
      setShowUserGuide(true);
      return;
    }

    if (hub === 'ZOOM') {
      setShowZoomPlans(true);
      return;
    }
    
    if (hub === 'GIST') {
      setGistInitialView(subview || 'FEED');
      setGistAutoStartLive(false);
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
          tradingGame: 1500
        },
        lastUpdated: new Date()
      });
      setTransactions([
        { id: '1', userId: 'dev-admin', type: 'deposit', amount: 500, status: 'completed', timestamp: { toDate: () => new Date() } as any, currency: 'NGN' },
        { id: '2', userId: 'dev-admin', type: 'game_win', amount: 250, status: 'completed', timestamp: { toDate: () => new Date() } as any, currency: 'NGN' }
      ]);
      setAnnouncements([
        { id: '1', message: 'Welcome to EFADO Hubs! Enjoy our high-stakes games.', timestamp: new Date(), active: true }
      ]);
      setLoading(false);
      return;
    }

    // Handle redirect result from Google Sign-In redirect flow (important for mobile)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('Successfully completed redirect login:', result.user);
        }
      })
      .catch((e: any) => {
        console.error('Redirect login error:', e);
        if (e?.code === 'auth/unauthorized-domain') {
          const currentHost = window.location.hostname;
          setError(
            `This domain (${currentHost}) is not authorized in your Firebase Project. Please add "${currentHost}" to the "Authorized domains" list under Authentication -> Settings -> Authorized domains in your Firebase Console.`
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

    const cleanupFirestore = () => {
      if (unsubUser) { unsubUser(); unsubUser = null; }
      if (unsubTx) { unsubTx(); unsubTx = null; }
      if (unsubAnn) { unsubAnn(); unsubAnn = null; }
      if (unsubAdmin) { unsubAdmin(); unsubAdmin = null; }
    };

    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      // Always cleanup previous Firestore listeners before registering new ones
      cleanupFirestore();

      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // Listen for user profile changes
        unsubUser = onSnapshot(userRef, async (snapshot) => {
          if (snapshot.exists()) {
            setUser(snapshot.data() as UserProfile);
          } else {
            // Create initial user profile
            const newUser: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              playerWallet: 100, // Starting bonus
              depositWallet: 0,
              cashOutWallet: 0,
              miningWallet: 0,
              miningProgress: { stage: 'E', collectedInStage: 0 },
              role: firebaseUser.email === 'efado226@gmail.com' || firebaseUser.email === 'efadofestus@gmail.com' ? 'admin' : 'player',
              createdAt: new Date().toISOString()
            };
            
            try {
              await runTransaction(db, async (transaction) => {
                const adminRef = doc(db, 'adminStats', 'global');
                const statsSnap = await transaction.get(adminRef);
                
                transaction.set(userRef, newUser);
                
                if (statsSnap.exists()) {
                  transaction.update(adminRef, {
                    totalPlayers: (statsSnap.data() as AdminStats).totalPlayers + 1
                  });
                }
              });
            } catch (e) {
              handleFirestoreError(e, OperationType.WRITE, `users/${firebaseUser.uid}`);
            }
            
            setUser(newUser);
          }
          setLoading(false);
        }, (e) => {
          handleFirestoreError(e, OperationType.GET, `users/${firebaseUser.uid}`);
          setLoading(false); // Do not let user hang on white screen if Firestore listener encounters permission or region errors
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
        }, (e) => handleFirestoreError(e, OperationType.GET, 'transactions'));

        // Listen for announcements
        unsubAnn = onSnapshot(collection(db, 'announcements'), (snapshot) => {
          const ann = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Announcement))
            .filter(a => a.active)
            .sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
          setAnnouncements(ann);
        }, (e) => handleFirestoreError(e, OperationType.GET, 'announcements'));

        // Listen for admin stats if admin
        if (firebaseUser.email === 'efado226@gmail.com' || firebaseUser.email === 'efadofestus@gmail.com') {
          unsubAdmin = onSnapshot(doc(db, 'adminStats', 'global'), (snapshot) => {
            if (snapshot.exists()) {
              setAdminStats(snapshot.data() as AdminStats);
            } else {
              const initialStats: AdminStats = {
                adminWallet: 0,
                totalHouseGain: 0,
                totalPlayers: 0,
                pendingPayouts: 0,
                gameWallets: {
                  spinGame: 0,
                  moneyCard: 0,
                  tradingGame: 0
                },
                lastUpdated: serverTimestamp()
              };
              setDoc(doc(db, 'adminStats', 'global'), initialStats).catch(e => handleFirestoreError(e, OperationType.WRITE, 'adminStats/global'));
              setAdminStats(initialStats);
            }
          }, (e) => handleFirestoreError(e, OperationType.GET, 'adminStats/global'));
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

              // Listen for announcements
              unsubAnn = onSnapshot(collection(db, 'announcements'), (snapshot) => {
                const ann = snapshot.docs
                  .map(doc => ({ id: doc.id, ...doc.data() } as Announcement))
                  .filter(a => a.active)
                  .sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
                setAnnouncements(ann);
              });

              // Listen for admin stats
              unsubAdmin = onSnapshot(doc(db, 'adminStats', 'global'), (snapshot) => {
                if (snapshot.exists()) {
                  setAdminStats(snapshot.data() as AdminStats);
                }
              });

              return; // Skip setting user to null
            }
          } catch (e) {
            console.error("Failed to restore Super Admin session:", e);
          }
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

  // Hash Routing Synchronizer - Handles URL mapping (e.g. /#community) on mount and on change
  useEffect(() => {
    const handleHashRoute = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase().trim();
      if (!hash) {
        setActiveHub('HOME');
        return;
      }

      console.log('Synchronizing tactical navigation state for hash:', hash);
      if (hash === 'community' || hash === 'community_hubs') {
        setActiveHub('COMMUNITY_HUBS');
        if (user) {
          if (user.csccRegistered) {
            setShowCommunityHub(true);
          } else {
            setShowCSCCRegistration(true);
          }
        }
      } else if (hash === 'gist') {
        setActiveHub('GIST');
        setShowGistHub(true);
      } else if (hash === 'advertising') {
        setActiveHub('ADVERTISING');
        setShowAdvertisingHub(true);
      } else if (hash === 'zoom') {
        setActiveHub('ZOOM');
        setShowZoomPlans(true);
      } else if (hash === 'servicecorps') {
        setActiveHub('SERVICE_CORPS');
        setShowServiceCorps(true);
      } else if (hash === 'domain') {
        setActiveHub('DOMAIN_HUB');
        setShowDomainHub(true);
      } else if (hash === 'tech' || hash === 'tech_hub') {
        setActiveHub('TECH_HUB');
        setShowTechHub(true);
      } else if (['dashboard', 'games', 'market', 'fairly_used', 'hepihands_loan', 'partner_hub', 'education'].includes(hash)) {
        setActiveHub(hash.toUpperCase() as any);
      } else if (hash === 'loanhub' || hash === 'loan') {
        setActiveHub('HEPIHANDS_LOAN');
      } else if (hash === 'partners') {
        setActiveHub('PARTNER_HUB');
      }
    };

    // Parse the hash if user is logged in & set up
    if (user && !loading) {
      handleHashRoute();
    }

    window.addEventListener('hashchange', handleHashRoute);
    return () => {
      window.removeEventListener('hashchange', handleHashRoute);
    };
  }, [user, loading]);

  // Sync state changes back to url hash for easy link sharing and refreshing
  useEffect(() => {
    if (loading || !user) return;
    
    let targetHash = '';
    if (showCommunityHub) {
      targetHash = 'community';
    } else if (showGistHub) {
      targetHash = 'gist';
    } else if (showAdvertisingHub) {
      targetHash = 'advertising';
    } else if (showZoomPlans) {
      targetHash = 'zoom';
    } else if (showServiceCorps) {
      targetHash = 'servicecorps';
    } else if (showDomainHub) {
      targetHash = 'domain';
    } else if (showTechHub) {
      targetHash = 'tech';
    } else if (activeHub !== 'HOME') {
      targetHash = activeHub.toLowerCase();
    }

    if (window.location.hash.replace('#', '') !== targetHash) {
      const scrollY = window.scrollY; // Preserve scroll position
      window.location.hash = targetHash;
      window.scrollTo(0, scrollY);
    }
  }, [activeHub, showCommunityHub, showGistHub, showAdvertisingHub, showZoomPlans, showServiceCorps, showDomainHub, showTechHub, user, loading]);

  const handleLogin = async () => {
    setError(null);
    try {
      // Prioritize popup for ALL devices because e-fado.com uses a custom domain,
      // and redirect login (signInWithRedirect) loses storage states (ITP) / loops infinitely on
      // iOS Safari and modern mobile browsers like Chrome & Edge on iOS/Android due to third-party cookie restrictions.
      console.log('Initiating secure pop-up connection...');
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      console.error('Login error details:', e);
      if (e?.code === 'auth/unauthorized-domain') {
        const currentHost = window.location.hostname;
        setError(
          `This domain (${currentHost}) is not authorized in your Firebase Project. Please add "${currentHost}" to the "Authorized domains" list under Authentication -> Settings -> Authorized domains in your Firebase Console.`
        );
      } else if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/cancelled-popup-request' || e?.message?.includes('popup')) {
        // Fallback to redirect ONLY if popup is blocked by browser-level pop-up blocker
        try {
          console.log('Popup blocked or cancelled by user, falling back securely to redirect login...');
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectError: any) {
          setError(`Login failed: ${redirectError.message || redirectError}`);
        }
      } else if (e?.message) {
        setError(`Login failed: ${e.message}`);
      } else {
        setError('Login failed. Please try again.');
      }
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
        await updateProfile(cred.user, {
          displayName: standardDisplayName
        });
        
        const userRef = doc(db, 'users', cred.user.uid);
        const newUser: UserProfile = {
          uid: cred.user.uid,
          email: cred.user.email || '',
          displayName: standardDisplayName,
          playerWallet: 100, // Starting bonus
          depositWallet: 0,
          cashOutWallet: 0,
          miningWallet: 0,
          miningProgress: { stage: 'E', collectedInStage: 0 },
          role: cred.user.email === 'efado226@gmail.com' || cred.user.email === 'efadofestus@gmail.com' ? 'admin' : 'player',
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, newUser);
        setStandardRegisterSuccess('Connection established! Loading your ecosystem portfolio...');
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
        setError('Security threshold not met: password must be at least 6 characters.');
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
    setUser(null);
    signOut(auth);
  };

  const handleDeposit = async (amount: number) => {
    if (!user) return;
    if (DEVELOPMENT_MODE) {
      setUser({
        ...user,
        depositWallet: user.depositWallet + amount,
        playerWallet: user.playerWallet + amount
      });
      setTransactions([
        { id: Math.random().toString(), userId: user.uid, type: 'deposit', amount, status: 'completed', timestamp: { toDate: () => new Date() } as any, currency: 'NGN' },
        ...transactions
      ]);
      return;
    }
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        const txRef = doc(collection(db, 'transactions'));
        
        transaction.update(userRef, {
          depositWallet: user.depositWallet + amount,
          playerWallet: user.playerWallet + amount
        });

        transaction.set(txRef, {
          userId: user.uid,
          type: 'deposit',
          amount,
          status: 'completed',
          timestamp: serverTimestamp()
        });
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'deposit_transaction');
    }
  };

  const handleWalletUpdate = async (amount: number, type: 'deposit' | 'withdrawal' | 'game_bet' | 'game_win', withdrawalAccountDetails?: any) => {
    if (!user) return;
    if (DEVELOPMENT_MODE) {
      if (type === 'deposit') {
        setUser({
          ...user,
          depositWallet: user.depositWallet + amount
        });
      } else if (type === 'withdrawal') {
        const fee = amount * 0.03;
        const netAmount = amount - fee;
        const walletToDeduct = withdrawalAccountDetails?.sourceWallet === 'playerWallet' ? 'playerWallet' : 'cashOutWallet';
        setUser({
          ...user,
          [walletToDeduct]: Math.max(0, user[walletToDeduct] - amount)
        });
        if (adminStats) {
          setAdminStats({
            ...adminStats,
            adminWallet: adminStats.adminWallet + fee,
            pendingPayouts: adminStats.pendingPayouts + netAmount,
            lastUpdated: new Date()
          });
        }
      } else if (type === 'game_bet') {
        setUser({
          ...user,
          depositWallet: Math.max(0, user.depositWallet - amount)
        });
        if (adminStats) {
          setAdminStats({
            ...adminStats,
            adminWallet: adminStats.adminWallet + amount,
            totalHouseGain: adminStats.totalHouseGain + amount,
            lastUpdated: new Date()
          });
        }
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
      const adminRef = doc(db, 'adminStats', 'global');

      if (type === 'deposit') {
        await updateDoc(userRef, {
          depositWallet: increment(amount)
        });
      } else if (type === 'withdrawal') {
        const withdrawalRef = doc(collection(db, 'withdrawals'));
        const txRef = doc(db, 'transactions', withdrawalRef.id);

        const fee = amount * 0.03;
        const netAmount = amount - fee;
        const walletToDeduct = withdrawalAccountDetails?.sourceWallet === 'playerWallet' ? 'playerWallet' : 'cashOutWallet';

        await runTransaction(db, async (transaction) => {
          const statsSnap = await transaction.get(adminRef);
          const stats = statsSnap.data() as AdminStats;

          transaction.update(userRef, {
            [walletToDeduct]: increment(-amount)
          });

          transaction.update(adminRef, {
            adminWallet: increment(fee), // Credit 3% fee to admin wallet
            pendingPayouts: increment(netAmount),
            lastUpdated: serverTimestamp()
          });

          transaction.set(withdrawalRef, {
            userId: user.uid,
            userEmail: user.email,
            amount: netAmount,
            originalAmount: amount,
            fee: fee,
            status: 'pending',
            timestamp: serverTimestamp(),
            accountDetails: {
              ...(withdrawalAccountDetails || { method: 'default' }),
              walletSource: walletToDeduct
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
            currency: 'USD',
            description: `Cashout withdrawal of ${amount} to ${withdrawalAccountDetails?.bankName || 'nominated account'}.`,
            method: withdrawalAccountDetails?.method || 'Wallet Payout'
          });
        });
      } else if (type === 'game_bet') {
        await runTransaction(db, async (transaction) => {
          transaction.update(userRef, {
            depositWallet: increment(-amount)
          });
          transaction.update(adminRef, {
            adminWallet: increment(amount),
            totalHouseGain: increment(amount),
            lastUpdated: serverTimestamp()
          });
        });
      } else if (type === 'game_win') {
        await updateDoc(userRef, {
          playerWallet: increment(amount)
        });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `wallet_${type}`);
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
        const adminRef = doc(db, 'adminStats', 'global');
        
        const statsSnap = await transaction.get(adminRef);
        const stats = statsSnap.data() as AdminStats;

        transaction.update(userRef, {
          cashOutWallet: 0
        });

        transaction.update(adminRef, {
          adminWallet: increment(fee), // Credit 3% fee to admin/ceo wallet
          pendingPayouts: increment(netAmount)
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

  const onResult = async (multiplier: number, bet: number, gameId: 'spinGame' | 'moneyCard' | 'tradingGame' | 'equilibrium', payoutOverride?: number) => {
    if (!user) return;
    const winAmount = payoutOverride !== undefined ? payoutOverride : bet * multiplier;

    if (DEVELOPMENT_MODE) {
      // Stake money -> deducted from Player's Deposit Wallet, credited entirely to Admin/CEO Wallet
      // Player wins -> credited to Player's Win Wallet (user.playerWallet)
      setUser({
        ...user,
        depositWallet: Math.max(0, user.depositWallet - bet),
        playerWallet: user.playerWallet + winAmount
      });
      
      if (adminStats) {
        setAdminStats({
          ...adminStats,
          adminWallet: adminStats.adminWallet + bet, // Entire stake is the benefit
          totalHouseGain: adminStats.totalHouseGain + bet,
          gameWallets: {
            ...adminStats.gameWallets,
            [gameId]: ((adminStats.gameWallets as any)[gameId] || 0) + bet
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
        const adminRef = doc(db, 'adminStats', 'global');
        const txRef = doc(collection(db, 'transactions'));

        // READS FIRST
        const statsSnap = await transaction.get(adminRef);
        const stats = statsSnap.data() as AdminStats;

        // Deduct stake from Player's Deposit Wallet, add wins to Player's Win Wallet
        if (bet > 0) {
          transaction.update(userRef, {
            depositWallet: increment(-bet),
            playerWallet: increment(winAmount)
          });
        } else if (winAmount > 0) {
          transaction.update(userRef, {
            playerWallet: increment(winAmount)
          });
        }

        // Entire stake goes to admin wallet
        const currentAdminWalletIncrement = bet;
        const currentTotalHouseGainIncrement = bet;
        const currentGameWalletIncrement = bet;

        // WRITES AFTER
        transaction.update(adminRef, {
          adminWallet: increment(currentAdminWalletIncrement),
          totalHouseGain: increment(currentTotalHouseGainIncrement),
          gameWallets: {
            ...stats.gameWallets,
            [gameId]: ((stats.gameWallets as any)[gameId] || 0) + currentGameWalletIncrement
          },
          lastUpdated: serverTimestamp()
        });

        // Record Transaction
        if (winAmount > 0 || bet > 0) {
          transaction.set(txRef, {
            userId: user.uid,
            type: winAmount > 0 ? 'game_win' : 'game_bet',
            amount: winAmount > 0 ? winAmount : bet,
            status: 'completed',
            timestamp: serverTimestamp()
          });
        }
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'game_result_transaction');
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
            <h3 className="text-xs font-black tracking-[0.3em] text-indigo-400 uppercase">EFADO CONNECT</h3>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Sovereign Link Active...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user && !DEVELOPMENT_MODE) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
        <NocturnalBackground />

        {/* Floating Simulated SMS & Email Broadcast Hub on Login Screen */}
        {otpStep && (adminEmail.trim().toLowerCase() === 'festdanemh@gmail.com' || simulatedSmsCode) && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-sm p-6 bg-slate-900 border-2 border-amber-500 rounded-3xl shadow-2xl backdrop-blur-xl animate-bounce">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl shrink-0">
                <MessageSquare className="w-6 h-6 text-amber-500 animate-pulse" />
              </div>
              <div className="flex-grow text-left space-y-3.5">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.25em] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                    Sovereign dual-key broadcaster
                  </p>
                  <p className="text-[9px] font-mono text-slate-500">Live Secure Transmission Log</p>
                </div>
                
                <div className="space-y-1 text-[10px] font-mono border-t border-b border-white/5 py-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">🛡️ SECURE EMAIL</span>
                    <span className="text-emerald-400 font-bold">● SENT ALWAYS (festdanemh@gmail.com)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">📱 SECURE PHONE</span>
                    <span className="text-emerald-400 font-bold">● DISPATCHED (08072456836)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">🧪 GATEWAY HUB</span>
                    <span className="text-indigo-400">EFADO BROADCAS-NET</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-white/5 text-center space-y-1">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Authentication Key</p>
                  <span className="text-xl font-mono font-black text-amber-400 tracking-[0.25em] block">
                    {simulatedSmsCode || currentOtpCode}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpInput(simulatedSmsCode || currentOtpCode);
                    }}
                    className="flex-grow py-2 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    ⚡ Auto-Fill
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(simulatedSmsCode || currentOtpCode);
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => { setOtpStep(false); }} 
                className="text-slate-500 hover:text-white transition-all p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="bg-slate-900/80 backdrop-blur-2xl p-12 rounded-[3rem] shadow-2xl max-w-md w-full text-center border border-white/10 relative z-10 golden-card-border">
          <EfadoLogo size="lg" className="mb-8" />
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Access Ecosystem</h2>
          <p className="text-slate-400 mb-6 text-sm font-medium leading-relaxed">
            Connect your global identity or authenticate administrative protocols to synchronize with EFADO's tactical financial network.
          </p>

          {/* Secure Login Mode Tabs */}
          <div className="flex border-b border-white/5 mb-6 p-1 bg-slate-950/40 rounded-2xl">
            <button
              onClick={() => { setLoginMode('STANDARD'); setOtpStep(false); setError(null); }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${loginMode === 'STANDARD' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              id="login-mode-standard"
            >
              Standard Link
            </button>
            <button
              onClick={() => { setLoginMode('CEO'); setError(null); }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${loginMode === 'CEO' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              id="login-mode-ceo"
            >
              CEO Console
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col items-center gap-2 text-red-400 text-left text-xs">
              <div className="flex items-center gap-2 font-bold w-full">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>CONNECTION ERROR</span>
              </div>
              <p className="leading-relaxed font-mono">{error}</p>
            </div>
          )}

          {loginMode === 'STANDARD' ? (
            <div className="space-y-4">
              {/* In-app Browser Sandbox Alert Box */}
              {isInAppBrowser && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col gap-2 text-left text-[11px] text-amber-400">
                  <div className="flex items-center gap-2 font-black tracking-widest text-[9px]">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>IN-APP WEBVIEW RUNTIME</span>
                  </div>
                  <p className="leading-relaxed font-semibold">
                    You opened this via WhatsApp, Instagram, or a social proxy. These browsers block Google Sign-In redirect cookies.
                  </p>
                  <p className="leading-relaxed font-bold text-amber-300">
                    💡 Solution: Tap the <span className="font-mono text-xs">(···)</span> menu on your screen's top/bottom right and choose <span className="underline">"Open in Safari"</span> or <span className="underline">"Open in Chrome"</span>.
                  </p>
                  <div className="border-t border-amber-500/10 my-0.5"></div>
                  <p className="leading-relaxed opacity-90">
                    Alternatively, choose the <span className="font-bold underline">Email fallbacks</span> below to login directly!
                  </p>
                </div>
              )}

              {/* Sub-selector for Google vs Email Backup */}
              <div className="flex bg-slate-950/40 p-1 rounded-xl border border-white/5 text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                <button
                  type="button"
                  onClick={() => { setStandardEmailMode('GOOGLE'); setError(null); }}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${standardEmailMode === 'GOOGLE' ? 'bg-indigo-600/30 text-indigo-300' : 'hover:text-slate-300'}`}
                >
                  Google Link
                </button>
                <button
                  type="button"
                  onClick={() => { setStandardEmailMode('EMAIL_LOGIN'); setError(null); }}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${standardEmailMode === 'EMAIL_LOGIN' ? 'bg-indigo-600/30 text-indigo-300' : 'hover:text-slate-300'}`}
                >
                  Email login
                </button>
                <button
                  type="button"
                  onClick={() => { setStandardEmailMode('EMAIL_REGISTER'); setError(null); }}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${standardEmailMode === 'EMAIL_REGISTER' ? 'bg-indigo-600/30 text-indigo-300' : 'hover:text-slate-300'}`}
                >
                  Email signup
                </button>
              </div>

              {standardEmailMode === 'GOOGLE' && (
                <div className="space-y-3">
                  <button 
                    onClick={handleLogin}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
                    id="login-standard-btn"
                  >
                    <LogIn className="w-5 h-5" />
                    Establish Connection
                  </button>

                  <button
                    onClick={async () => {
                      setError(null);
                      try {
                        console.log('User requested redirect login explicitly...');
                        await signInWithRedirect(auth, googleProvider);
                      } catch (e: any) {
                        setError(`Redirect Connection failed: ${e.message || e}`);
                      }
                    }}
                    className="w-full py-3 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 hover:text-indigo-400 transition-all active:scale-95 bg-slate-950/20 rounded-xl hover:bg-slate-950/40"
                    id="login-redirect-btn"
                  >
                    Having issues? Try Redirect Connection
                  </button>
                </div>
              )}

              {standardEmailMode === 'EMAIL_LOGIN' && (
                <form onSubmit={handleStandardEmailLogin} className="space-y-3 text-left">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">Email address</label>
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. name@domain.com"
                      value={standardEmail}
                      onChange={(e) => setStandardEmail(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-950/60 border border-white/5 rounded-xl text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">Password</label>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••••••••"
                      value={standardPassword}
                      onChange={(e) => setStandardPassword(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-950/60 border border-white/5 rounded-xl text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 hover:bg-indigo-500 transition-all shadow-xl active:scale-95 mt-2"
                  >
                    <LogIn className="w-4 h-4" />
                    Secure Login
                  </button>
                </form>
              )}

              {standardEmailMode === 'EMAIL_REGISTER' && (
                <form onSubmit={handleStandardEmailRegister} className="space-y-3 text-left">
                  {standardRegisterSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-semibold leading-relaxed mb-2">
                      {standardRegisterSuccess}
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">Choose Username / Display Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Tactician11"
                      value={standardDisplayName}
                      onChange={(e) => setStandardDisplayName(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-950/60 border border-white/5 rounded-xl text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">Email address</label>
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. name@domain.com"
                      value={standardEmail}
                      onChange={(e) => setStandardEmail(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-950/60 border border-white/5 rounded-xl text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">Password</label>
                    <input 
                      type="password" 
                      required
                      placeholder="At least 6 characters"
                      value={standardPassword}
                      onChange={(e) => setStandardPassword(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-950/60 border border-white/5 rounded-xl text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 hover:bg-emerald-500 transition-all shadow-xl active:scale-95 mt-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Register Account
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="space-y-4 text-left">
              {!otpStep ? (
                <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Sovereign Email</label>
                    <div className="relative">
                      <input 
                        type="email" 
                        required
                        placeholder="festdanemh@gmail.com"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-950/60 border border-white/5 rounded-xl text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Sovereign Password</label>
                    <div className="relative">
                      <input 
                        type="password" 
                        required
                        placeholder="••••••••••••••"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-950/60 border border-white/5 rounded-xl text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 mt-6 bg-amber-500 text-slate-950 rounded-xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/10 active:scale-95"
                    id="admin-login-submit-btn"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    Request Authorization
                  </button>

                  <div className="text-center mt-3">
                    <span className="text-[8px] font-bold font-mono text-slate-600 uppercase tracking-widest">
                      Admin clearance required. Use password EFADO_CEO_2026 or CEO phone number.
                    </span>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400 text-xs">
                    <p className="font-bold uppercase tracking-widest mb-1 pl-1 text-[10px]">Dual-Key Broadcaster</p>
                    <p className="leading-relaxed font-mono">{otpMessage}</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">6-Digit Verification Key</label>
                    <input 
                      type="text" 
                      required
                      maxLength={6}
                      placeholder="000000"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-5 py-4 bg-slate-950/60 border border-white/5 rounded-xl text-center text-xl font-mono font-black tracking-widest text-amber-400 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button 
                      type="button"
                      onClick={() => setOtpStep(false)}
                      className="flex-1 py-4 bg-slate-800 text-slate-300 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-700 transition-all active:scale-95"
                    >
                      Back
                    </button>
                    <button 
                      type="submit"
                      className="flex-[2] py-4 bg-amber-500 text-slate-950 rounded-xl font-black uppercase tracking-[0.15em] text-xs flex items-center justify-center gap-2 hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/10 active:scale-95"
                    >
                      Verify Code <LogIn className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      <NocturnalBackground />
      
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-30 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <EfadoLogo size="sm" className="scale-75" />
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowUserGuide(true)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-bold tracking-widest hover:bg-slate-700 transition-all shadow-lg border border-white/5"
              >
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline uppercase">Guide</span>
                <span className="sm:hidden">?</span>
              </button>

              <button 
                onClick={() => setShowAboutCeo(true)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-bold tracking-widest hover:bg-slate-700 transition-all shadow-lg border border-white/5"
              >
                <Info className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline uppercase">About CEO</span>
                <span className="sm:hidden">CEO</span>
              </button>

              {user.role === 'admin' && (
                <button 
                  onClick={() => isCeoVerified ? setShowCeoPortal(true) : setShowCeoVerification(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold tracking-widest hover:bg-indigo-500 transition-all shadow-lg"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">CEO Portal</span>
                  <span className="sm:hidden">CEO</span>
                </button>
              )}

              <button 
                onClick={() => openWalletWithTab('profile')}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-[10px] font-bold tracking-widest hover:brightness-110 transition-all shadow-lg border border-white/5"
              >
                <UserCheck className="w-4 h-4 text-amber-400" />
                <span className="hidden lg:inline uppercase">My Profile & Payouts</span>
                <span className="lg:hidden uppercase">Profile</span>
              </button>
            </div>

            <CurrencySelector />
            
            <div className="hidden md:flex flex-col items-end px-4 border-r border-white/5">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{liveUsers.toLocaleString()} Hub Active</span>
              </div>
              <span className="text-[7px] font-bold text-slate-500 uppercase tracking-[0.2em]">Synchronising...</span>
            </div>

            <div className="hidden md:flex flex-col items-end">
              <div className="flex items-center gap-1.5">
                {user.is_super_admin && <span className="px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/25 text-amber-400 text-[7px] font-black rounded uppercase tracking-widest animate-pulse">Free CEO Access</span>}
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{user.is_super_admin ? 'OWNER ADMIN' : 'Logged in'}</span>
              </div>
              <span className="text-xs font-bold text-slate-300">{user.email.split('@')[0]}</span>
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
        {/* Hero Carousel - Shifted to Top for immediate visibility */}
        {activeHub !== 'HOME' && (
          <div className="mb-8">
            <HubHeroCarousel hubType={activeHub} onAction={handleNavigate} />
          </div>
        )}

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
          
          <div 
            id="hub-nav-slider"
            className="flex items-center gap-4 overflow-x-auto pb-8 no-scrollbar scroll-smooth px-4"
          >
            {[
              { id: 'HOME', label: 'HomeHub', icon: Home, color: '#FFFFFF', activeColor: 'text-slate-950', bg: 'bg-white' },
              { id: 'DASHBOARD', label: 'Dashboard', icon: TrendingUp, color: '#6366F1', activeColor: 'text-white', bg: 'bg-indigo-600' },
              { id: 'GAMES', label: 'GameArena', icon: Gamepad2, color: '#EA580C', activeColor: 'text-white', bg: 'bg-orange-600' },
              { id: 'MARKET', label: 'ModernMarket', icon: ShoppingBag, color: '#10B981', activeColor: 'text-white', bg: 'bg-emerald-600' },
              { id: 'FAIRLY_USED', label: 'FairlyUsed', icon: Package, color: '#4F46E5', activeColor: 'text-white', bg: 'bg-indigo-700' },
              { id: 'ADVERTISING', label: 'Advertise on EFADO', icon: Megaphone, color: '#6366F1', activeColor: 'text-white', bg: 'bg-indigo-600' },
              { id: 'GIST', label: 'GistHub', icon: MessageSquare, color: '#6366F1', activeColor: 'text-white', bg: 'bg-indigo-600' },
              { id: 'ZOOM', label: 'ZoomLive', icon: Video, color: '#2563EB', activeColor: 'text-white', bg: 'bg-blue-600' },
              { id: 'SERVICE_CORPS', label: 'ServiceCorps', icon: HardHat, color: '#94A3B8', activeColor: 'text-white', bg: 'bg-slate-700' },
              { id: 'COMMUNITY_HUBS', label: 'UnityHubs', icon: Users, color: '#9333EA', activeColor: 'text-white', bg: 'bg-purple-600' },
              { id: 'HEPIHANDS_LOAN', label: 'LoanHub', icon: HandCoins, color: '#10B981', activeColor: 'text-white', bg: 'bg-emerald-600' },
              { id: 'TECH_HUB', label: 'TechHub', icon: Cpu, color: '#0891B2', activeColor: 'text-white', bg: 'bg-cyan-600' },
              { id: 'PARTNER_HUB', label: 'Partners', icon: Handshake, color: '#F59E0B', activeColor: 'text-white', bg: 'bg-amber-600' },
              { id: 'DOMAIN_HUB', label: 'DomainHub', icon: Globe, color: '#6366F1', activeColor: 'text-white', bg: 'bg-indigo-600' },
            ].map((item) => (
              <motion.button 
                key={item.id}
                whileHover={{ 
                  scale: 1.1, 
                  y: -5,
                  boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.2)"
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (item.id === 'ADVERTISING') handleNavigate('ADVERTISING', 'ADVERT');
                  else if (item.id === 'ZOOM') handleNavigate('ZOOM');
                  else if (item.id === 'GIST') handleNavigate('GIST');
                  else if (item.id === 'COMMUNITY_HUBS') handleNavigate('COMMUNITY_HUBS');
                  else setActiveHub(item.id as any);
                }}
                className={`px-8 py-6 rounded-[2.5rem] font-black tracking-widest text-xs transition-all flex flex-col items-center gap-3 min-w-[160px] shadow-sm border border-white/10 group relative transition-all duration-300 ${
                  (activeHub === item.id || 
                   (item.id === 'ADVERTISING' && showAdvertisingHub && adInitialType === 'ADVERT') ||
                   (item.id === 'GIST' && showGistHub))
                    ? `${item.bg} ${item.activeColor} ring-4 ring-white/20 shadow-2xl scale-105 !z-10` 
                    : 'text-white bg-slate-900/60 backdrop-blur-xl hover:bg-slate-800'
                }`}
              >
                <div className={`p-3 rounded-2xl ${activeHub === item.id ? 'bg-white/20' : 'bg-white/5'} mb-1`}>
                  <item.icon className="w-6 h-6" style={{ color: activeHub === item.id ? undefined : item.color }} />
                </div>
                <span className="uppercase whitespace-nowrap text-[10px] tracking-tight">{item.label}</span>
              </motion.button>
            ))}

            <motion.button 
              whileHover={{ scale: 1.05, y: -5 }}
              onClick={() => handleNavigate('ADVERTISING', 'SELL')}
              className={`px-8 py-6 rounded-[2.5rem] font-black tracking-widest text-xs transition-all flex flex-col items-center gap-3 min-w-[160px] shadow-sm border border-white/5 active:scale-95 group ${
                showAdvertisingHub && adInitialType === 'SELL'
                  ? 'bg-rose-600 text-white ring-4 ring-rose-400/20 shadow-2xl' 
                  : 'text-rose-400 bg-rose-600/10 border border-rose-500/20'
              }`}
            >
              <div className={`p-3 rounded-2xl ${showAdvertisingHub && adInitialType === 'SELL' ? 'bg-white/20' : 'bg-rose-600/10'}`}>
                <Zap className="w-6 h-6" />
              </div>
              <span className="uppercase whitespace-nowrap text-[10px] tracking-tight">Sell @ EFADO</span>
            </motion.button>
          </div>

          {/* Navigation Controls */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between pointer-events-none px-2 opacity-0 group-hover/nav:opacity-100 transition-opacity">
            <button 
              onClick={() => document.getElementById('hub-nav-slider')?.scrollBy({ left: -300, behavior: 'smooth' })}
              className="p-4 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-full text-white pointer-events-auto hover:bg-white/20 transition-all shadow-2xl hover:scale-110"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={() => document.getElementById('hub-nav-slider')?.scrollBy({ left: 300, behavior: 'smooth' })}
              className="p-4 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-full text-white pointer-events-auto hover:bg-white/20 transition-all shadow-2xl hover:scale-110"
            >
              <ChevronRight className="w-6 h-6" />
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

        {/* Announcements */}
        {announcements.length > 0 && (
          <div className="mb-8 space-y-2">
            {announcements.map((ann, idx) => (
              <motion.div 
                key={`${ann.id || idx}-${idx}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-indigo-600 text-white rounded-2xl flex items-center justify-between shadow-lg shadow-indigo-200"
              >
                <div className="flex items-center gap-3">
                  <Megaphone className="w-5 h-5" />
                  <span className="text-sm font-bold">{ann.message}</span>
                </div>
                <button className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
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

                {/* Sovereign Confidential & Encrypted Workspace Banner */}
                <div className="p-6 bg-slate-900/80 backdrop-blur-3xl border-2 border-emerald-500/20 rounded-3xl relative overflow-hidden shadow-2xl">
                  {/* Glowing background aura */}
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-950/80 rounded-2xl border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-950/50 shrink-0 mt-1 sm:mt-0">
                        <Lock className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] bg-emerald-950/55 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Sovereign Private Port
                          </span>
                          <span className="text-[9px] font-mono text-slate-500 select-none hidden sm:inline">[NODE PORT: 443_SSL_TLS]</span>
                        </div>
                        <h2 className="text-lg font-black text-white tracking-tight uppercase mt-1">CONFIDENTIAL USER PORTAL</h2>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1">
                          Active Account: <span className="text-emerald-300 font-bold font-mono">{user.email}</span>. Your wallets, transactions, gaming history, and account logs are dynamically encrypted to prevent outside access. This dashboard is <span className="text-emerald-400 font-bold underline">100% CONFIDENTIAL</span> and strictly hidden from other network users, ensuring private sovereign navigation.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wallets */}
                {/* Wallet Section */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tighter">
                      <Wallet className="w-6 h-6 text-indigo-500" />
                      Financial Status
                    </h2>
                    <button 
                      onClick={() => openWalletWithTab('overview')}
                      className="px-6 py-2.5 bg-white/5 backdrop-blur-xl border border-white/10 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all shadow-xl"
                    >
                      Management
                    </button>
                  </div>
                  <WalletGrid wallets={user} isAdmin={false} />
                </section>

                {/* Quick Access Hubs */}
                <section>
                  <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 border-b border-white/5 pb-4">Tactical Quick Access</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <button 
                      onClick={() => setActiveHub('GAMES')}
                      className="glass-card-ultra p-8 rounded-[2rem] text-left group transition-all border-l-4 border-l-orange-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                    >
                      <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-500 transition-all">
                        <Gamepad2 className="w-7 h-7 text-orange-500 group-hover:text-white" />
                      </div>
                      <h3 className="text-xl font-black text-white tracking-tight mb-2 group-hover:text-orange-400 transition-colors">Game Arena</h3>
                      <p className="text-slate-500 text-xs font-medium leading-relaxed">Engage in high-stakes spinning, trading, and tactical card games.</p>
                    </button>

                    <button 
                      onClick={() => setActiveHub('MARKET')}
                      className="glass-card-ultra p-8 rounded-[2rem] text-left group transition-all border-l-4 border-l-emerald-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                    >
                      <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 transition-all">
                        <ShoppingBag className="w-7 h-7 text-emerald-500 group-hover:text-white" />
                      </div>
                      <h3 className="text-xl font-black text-white tracking-tight mb-2 group-hover:text-emerald-400 transition-colors">Digital Market</h3>
                      <p className="text-slate-500 text-xs font-medium leading-relaxed">Exchange modern tech and pre-owned value across the global hub.</p>
                    </button>

                    <button 
                      onClick={() => setActiveHub('GIST')}
                      className="glass-card-ultra p-8 rounded-[2rem] text-left group transition-all border-l-4 border-l-indigo-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                    >
                      <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-500 transition-all">
                        <MessageSquare className="w-7 h-7 text-indigo-500 group-hover:text-white" />
                      </div>
                      <h3 className="text-xl font-black text-white tracking-tight mb-2 group-hover:text-indigo-400 transition-colors">Gist Intelligence</h3>
                      <p className="text-slate-500 text-xs font-medium leading-relaxed">Synchronize with the community for mentorship and career intel.</p>
                    </button>

                    <button 
                      onClick={() => setActiveHub('EDUCATION')}
                      className="glass-card-ultra p-8 rounded-[2rem] text-left group transition-all border-l-4 border-l-indigo-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                    >
                      <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-500 transition-all">
                        <GraduationCap className="w-7 h-7 text-indigo-500 group-hover:text-white" />
                      </div>
                      <h3 className="text-xl font-black text-white tracking-tight mb-2 group-hover:text-indigo-400 transition-colors">Education Hub</h3>
                      <p className="text-slate-500 text-xs font-medium leading-relaxed">Universal academic ecosystem for all levels from Primary to Ph.D.</p>
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
                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                  <h2 className="text-3xl font-black text-white flex items-center gap-3 tracking-tighter">
                    <Gamepad2 className="w-8 h-8 text-orange-500" />
                    Elite Game Arena
                  </h2>
                  <div className="px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-[10px] font-black text-orange-400 uppercase tracking-widest animate-pulse">
                    Live Stakes Active
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Lucky Spin Arena Card */}
                  <div className="glass-card-ultra golden-card-border p-10 rounded-[2.5rem] text-center relative group">
                    <div className="absolute top-0 left-0 w-full h-[6px] bg-indigo-600" />
                    <div className="relative z-10">
                      <div className="w-20 h-20 bg-indigo-600/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:bg-indigo-600 transition-all duration-500">
                        <Coins className="w-10 h-10 text-indigo-400 group-hover:text-white" />
                      </div>
                      <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Elite Spin</h3>
                      <p className="text-slate-500 mb-10 text-sm font-medium leading-relaxed">High-stakes architecture with tier-based rewards. Win up to 100x payload.</p>
                      <button 
                        onClick={() => setShowSpinWheel(true)}
                        className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-[0_10px_30px_rgba(79,70,229,0.3)] hover:bg-white hover:text-slate-950 transition-all uppercase tracking-[0.2em] text-[11px]"
                      >
                        Launch Arena
                      </button>
                    </div>
                  </div>

                  {/* EFADO Money Card Card */}
                  <div className="glass-card-ultra golden-card-border p-10 rounded-[2.5rem] text-center relative group">
                    <div className="absolute top-0 left-0 w-full h-[6px] bg-amber-600" />
                    <div className="relative z-10">
                      <div className="w-20 h-20 bg-amber-600/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:bg-amber-600 transition-all duration-500">
                        <CreditCard className="w-10 h-10 text-amber-400 group-hover:text-white" />
                      </div>
                      <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Money Card</h3>
                      <p className="text-slate-500 mb-10 text-sm font-medium leading-relaxed">Master the tactical shuffle. High-velocity card guessing with multiple stages.</p>
                      <button 
                        onClick={() => setShowMoneyCard(true)}
                        className="w-full py-5 bg-amber-600 text-white font-black rounded-2xl shadow-[0_10px_30px_rgba(217,119,6,0.3)] hover:bg-white hover:text-slate-950 transition-all uppercase tracking-[0.2em] text-[11px]"
                      >
                        Enter Arena
                      </button>
                    </div>
                  </div>

                  {/* Digital Money Trading Card */}
                  <div className="glass-card-ultra golden-card-border p-10 rounded-[2.5rem] text-center relative group">
                    <div className="absolute top-0 left-0 w-full h-[6px] bg-blue-600" />
                    <div className="relative z-10">
                      <div className="w-20 h-20 bg-blue-600/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-500">
                        <Zap className="w-10 h-10 text-blue-400 group-hover:text-white" />
                      </div>
                      <h3 className="text-2xl font-black text-white mb-3 tracking-tight uppercase">Tactical DMT</h3>
                      <p className="text-slate-500 mb-10 text-sm font-medium leading-relaxed">Master high-frequency trends with real-time digital intelligence.</p>
                      <button 
                        onClick={() => setShowTradingGame(true)}
                        className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:bg-white hover:text-slate-950 transition-all uppercase tracking-[0.2em] text-[11px]"
                      >
                        Enter Terminal
                      </button>
                    </div>
                  </div>

                  {/* EFADO Money Quiz Card */}
                  <div className="glass-card-ultra golden-card-border p-10 rounded-[2.5rem] text-center relative group">
                    <div className="absolute top-0 left-0 w-full h-[6px] bg-purple-600" />
                    <div className="relative z-10">
                      <div className="w-20 h-20 bg-purple-600/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:bg-purple-600 transition-all duration-500">
                        <Brain className="w-10 h-10 text-purple-400 group-hover:text-white" />
                      </div>
                      <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Money Quiz</h3>
                      <p className="text-slate-500 mb-10 text-sm font-medium leading-relaxed">Test your tactical intelligence across several categories for major payouts.</p>
                      <button 
                        onClick={() => setShowMoneyQuiz(true)}
                        className="w-full py-5 bg-purple-600 text-white font-black rounded-2xl shadow-[0_10px_30px_rgba(147,51,234,0.3)] hover:bg-white hover:text-slate-950 transition-all uppercase tracking-[0.2em] text-[11px]"
                      >
                        Initiate Quiz
                      </button>
                    </div>
                  </div>

                  {/* EFADO Equilibrium Card */}
                  <div className="glass-card-ultra golden-card-border p-10 rounded-[2.5rem] text-center relative group">
                    <div className="absolute top-0 left-0 w-full h-[6px] bg-yellow-600" />
                    <div className="relative z-10">
                      <div className="w-20 h-20 bg-yellow-600/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:bg-yellow-600 transition-all duration-500">
                        <Dices className="w-10 h-10 text-yellow-400 group-hover:text-white" />
                      </div>
                      <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Equilibrium</h3>
                      <p className="text-slate-500 mb-10 text-sm font-medium leading-relaxed">A round-based matching game. Align the tactical values for high-frequency rewards.</p>
                      <button 
                        onClick={() => setShowEquilibrium(true)}
                        className="w-full py-5 bg-yellow-600 text-white font-black rounded-2xl shadow-[0_10px_30px_rgba(202,138,4,0.3)] hover:bg-white hover:text-slate-950 transition-all uppercase tracking-[0.2em] text-[11px]"
                      >
                        Enter Terminal
                      </button>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {activeHub === 'MARKET' && (
              <motion.section
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                  <h2 className="text-3xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                    <ShoppingBag className="w-8 h-8 text-emerald-500" />
                    Global Market Hubs
                  </h2>
                  <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                    Vetted Vendors Only
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* EFADO Fairly Used Market Hub Card */}
                  <div className="glass-card-ultra golden-card-border p-10 rounded-[2.5rem] text-center relative group">
                    <div className="absolute top-0 left-0 w-full h-[6px] bg-emerald-500" />
                    <div className="relative z-10">
                      <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:bg-emerald-500 transition-all duration-500">
                        <ShoppingBag className="w-10 h-10 text-emerald-400 group-hover:text-white" />
                      </div>
                      <h3 className="text-2xl font-black text-white mb-3 tracking-tight uppercase">Circular Market</h3>
                      <p className="text-slate-500 mb-10 text-sm font-medium leading-relaxed">Sustainable exchange for pre-owned assets. Quality-graded and trusted listings.</p>
                      <button 
                        onClick={() => setShowMarketHub(true)}
                        className="w-full py-5 bg-emerald-500 text-slate-950 font-black rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:bg-white transition-all uppercase tracking-[0.2em] text-[11px]"
                      >
                        Enter Marketplace
                      </button>
                    </div>
                  </div>

                  {/* EFADO Modern Market Hub Card */}
                  <div className="glass-card-ultra golden-card-border p-10 rounded-[2.5rem] text-center relative group">
                    <div className="absolute top-0 left-0 w-full h-[6px] bg-cyan-500" />
                    <div className="relative z-10">
                      <div className="w-20 h-20 bg-cyan-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:bg-cyan-500 transition-all duration-500">
                        <ShoppingBasket className="w-10 h-10 text-cyan-400 group-hover:text-white" />
                      </div>
                      <h3 className="text-2xl font-black text-white mb-3 tracking-tight uppercase">Modern Hub</h3>
                      <p className="text-slate-500 mb-10 text-sm font-medium leading-relaxed">The pinnacle of next-gen retail. Explore a vast taxonomy of premium products.</p>
                      <button 
                        onClick={() => setShowModernMarket(true)}
                        className="w-full py-5 bg-cyan-500 text-slate-950 font-black rounded-2xl shadow-[0_10px_30px_rgba(6,182,212,0.3)] hover:bg-white transition-all uppercase tracking-[0.2em] text-[11px]"
                      >
                        Explore Modern
                      </button>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {activeHub === 'GIST' && (
              <motion.section
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                  <h2 className="text-3xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                    <MessageSquare className="w-8 h-8 text-indigo-500" />
                    Intelligence Network
                  </h2>
                </div>
                <div className="max-w-3xl mx-auto">
                  {/* EFADO Gist Hub Card */}
                  <div className="glass-card-ultra golden-card-border p-12 rounded-[3rem] text-center relative group">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />
                    <div className="relative z-10">
                      <div className="w-24 h-24 bg-indigo-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:shadow-[0_0_50px_rgba(79,70,229,0.5)] transition-all duration-700">
                        <MessageSquare className="w-12 h-12 text-indigo-400 group-hover:text-white" />
                      </div>
                      <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Gist Hub</h3>
                      <p className="text-slate-400 mb-12 text-lg font-medium leading-relaxed max-w-xl mx-auto">Synthetic intelligence layer for community synchronisation. Careers, sports, and deep-tech mentorship.</p>
                      <button 
                        onClick={() => setShowGistHub(true)}
                        className="px-12 py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-[0_10px_40px_rgba(79,70,229,0.3)] hover:scale-105 transition-all uppercase tracking-[0.3em] text-[11px] border border-indigo-500/50"
                      >
                        Synchronize Now
                      </button>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {activeHub === 'EDUCATION' && (
              <motion.section
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                  <h2 className="text-3xl font-black text-white flex items-center gap-3 tracking-tighter">
                    <GraduationCap className="w-8 h-8 text-indigo-500" />
                    Universal Education Hub
                  </h2>
                </div>
                <div className="max-w-3xl mx-auto">
                  {/* EFADO Education Hub Card */}
                  <div className="glass-card-ultra golden-card-border p-12 rounded-[3rem] text-center relative group">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />
                    <div className="relative z-10">
                      <div className="w-24 h-24 bg-indigo-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:shadow-[0_0_50px_rgba(79,70,229,0.5)] transition-all duration-700">
                        <GraduationCap className="w-12 h-12 text-indigo-400 group-hover:text-white" />
                      </div>
                      <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Academic Portal</h3>
                      <p className="text-slate-400 mb-12 text-lg font-medium leading-relaxed max-w-xl mx-auto">Comprehensive academic resources, examination portals, and developmental tools for unified learning.</p>
                      <button 
                        onClick={() => setShowEducationHub(true)}
                        className="px-12 py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-[0_10px_40px_rgba(79,70,229,0.3)] hover:scale-105 transition-all uppercase tracking-[0.3em] text-[11px] border border-indigo-500/50"
                      >
                        Launch Academy
                      </button>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {activeHub === 'SERVICE_CORPS' && (
              <motion.section
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                  <h2 className="text-3xl font-black text-white flex items-center gap-3 tracking-tighter">
                    <HardHat className="w-8 h-8 text-slate-400" />
                    Expert Corps Hub
                  </h2>
                </div>
                <div className="max-w-3xl mx-auto">
                  {/* EFADO Service Corps Card */}
                  <div className="glass-card-ultra golden-card-border p-12 rounded-[3rem] text-center relative group">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-500/5 to-slate-900/5" />
                    <div className="relative z-10">
                      <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 group-hover:scale-110 group-hover:bg-white group-hover:text-slate-950 transition-all duration-700">
                        <HardHat className="w-12 h-12 text-slate-400 group-hover:text-slate-950" />
                      </div>
                      <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Service Corps</h3>
                      <p className="text-slate-400 mb-12 text-lg font-medium leading-relaxed max-w-xl mx-auto">Vetted professional deployments across 14 tactical families. Direct connection to verified human capital.</p>
                      <button 
                        onClick={() => setShowServiceCorps(true)}
                        className="px-12 py-5 bg-white text-slate-950 font-black rounded-2xl shadow-[0_10px_40px_rgba(255,255,255,0.3)] hover:scale-105 transition-all uppercase tracking-[0.3em] text-[11px]"
                      >
                        Deploy Experts
                      </button>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {showSpinWheel && user && (
              <LuckySpinWheel 
                onClose={() => setShowSpinWheel(false)} 
                user={user}
                onResult={onResult}
              />
            )}

            {showTradingGame && user && (
              <DigitalMoneyTrading 
                onClose={() => setShowTradingGame(false)} 
                user={user}
                onResult={onResult}
              />
            )}

            {showMoneyCard && user && (
              <EfadoMoneyCard 
                onClose={() => setShowMoneyCard(false)} 
                user={user}
                onResult={onResult}
                onUpdateBalance={handleWalletUpdate}
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
              />
            )}

            {showEducationHub && user && (
              <EfadoEducationHub 
                onClose={() => setShowEducationHub(false)} 
                user={user}
                onUpdateMining={handleMiningUpdate}
                onNavigate={handleNavigate}
                onOpenMining={() => setShowEfadoMining(true)}
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
              {showWallet && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                >
                  <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto no-scrollbar">
                    <button 
                      onClick={() => setShowWallet(false)}
                      className="absolute top-4 right-4 z-10 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all"
                    >
                      <X className="w-6 h-6" />
                    </button>
                    <UserWallet 
                      user={user} 
                      onUpdateBalance={handleWalletUpdate}
                      onClose={() => setShowWallet(false)}
                      initialTab={walletInitialTab}
                    />
                  </div>
                </motion.div>
              )}

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
                />
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
            </AnimatePresence>

            {activeHub === 'COMMUNITY_HUBS' && user && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-8 rounded-3xl shadow-xl text-white text-center relative overflow-hidden group border border-white/5 golden-card-border">
                  <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
                  <div className="relative z-10">
                    <Users className="w-16 h-16 text-purple-300 mx-auto mb-4 animate-pulse" />
                    <h3 className="text-2xl font-black mb-2 tracking-tight">EFADO Community Hubs</h3>
                    <p className="text-purple-100 mb-6 text-sm">Join community-led collective saving cycles. Grow together with transparent, rotating payouts.</p>
                    <button 
                      onClick={() => setShowCommunityHub(true)}
                      className="w-full py-4 bg-white text-purple-600 font-black rounded-2xl shadow-lg shadow-white/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-sm"
                    >
                      Enter Community Hub
                    </button>
                  </div>
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
                  />
                </div>
              </motion.div>
            )}

            {activeHub === 'HEPIHANDS_LOAN' && user && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 rounded-3xl shadow-xl text-white text-center relative overflow-hidden group border border-white/5 golden-card-border">
                  <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
                  <div className="relative z-10">
                    <HandCoins className="w-16 h-16 text-emerald-300 mx-auto mb-4 animate-pulse" />
                    <h3 className="text-2xl font-black mb-2 tracking-tight">EFADO HEPIHANDS LOAN</h3>
                    <p className="text-emerald-100 mb-6 text-sm">Empowering your growth with transparent, accessible credit. Instant verification and flexible repayments.</p>
                    <button 
                      onClick={() => setShowHepiHandsLoan(true)}
                      className="w-full py-4 bg-white text-emerald-600 font-black rounded-2xl shadow-lg shadow-white/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-sm"
                    >
                      Enter Loan Hub
                    </button>
                  </div>
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
                <div className="bg-gradient-to-br from-indigo-600 to-blue-800 p-12 rounded-[3rem] text-white text-center relative overflow-hidden shadow-2xl golden-card-border">
                  <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
                  <div className="relative z-10 space-y-6">
                    <Globe className="w-20 h-20 text-indigo-300 mx-auto mb-4 animate-pulse" />
                    <h2 className="text-4xl font-black tracking-tighter">EFADO DomainHub</h2>
                    <p className="text-indigo-100 max-w-xl mx-auto">Find and register your perfect domain with top global registrars. Earn commissions and grow your digital presence.</p>
                    <button 
                      onClick={() => setShowDomainHub(true)}
                      className="px-12 py-5 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:scale-105 active:scale-95 transition-all text-slate-900"
                    >
                      Enter Domain Marketplace
                    </button>
                  </div>
                </div>
              </motion.section>
            )}

            {activeHub === 'TECH_HUB' && (
              <motion.section
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="bg-gradient-to-br from-cyan-600 to-teal-850 p-12 rounded-[3rem] text-white text-center relative overflow-hidden shadow-2xl golden-card-border">
                  <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
                  <div className="relative z-10 space-y-6">
                    <Cpu className="w-20 h-20 text-cyan-300 mx-auto mb-4 animate-bounce" style={{ animationDuration: '3s' }} />
                    <h2 className="text-4xl font-black tracking-tighter">EFADO TechHub</h2>
                    <p className="text-cyan-100 max-w-xl mx-auto">Explore high-quality state-of-the-art technological resources, system engineering tutorials, programming modules, and software innovation assets.</p>
                    <button 
                      onClick={() => setShowTechHub(true)}
                      className="px-12 py-5 bg-white text-cyan-700 hover:text-cyan-800 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:scale-105 active:scale-95 transition-all text-slate-900"
                    >
                      Enter Tech Marketplace & Portal
                    </button>
                  </div>
                </div>
              </motion.section>
            )}

            {activeHub === 'FAIRLY_USED' && (
              <motion.section
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="bg-gradient-to-br from-indigo-700 to-slate-900 p-12 rounded-[3rem] text-white text-center relative overflow-hidden shadow-2xl golden-card-border">
                  <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
                  <div className="relative z-10 space-y-6">
                    <Package className="w-20 h-20 text-indigo-300 mx-auto mb-4 animate-bounce" style={{ animationDuration: '3.5s' }} />
                    <h2 className="text-4xl font-black tracking-tighter">EFADO FairlyUsed Market</h2>
                    <p className="text-indigo-100 max-w-xl mx-auto">List or purchase certified pre-owned gadgets, electronics, and tech resources from verified sellers in the EFADO community.</p>
                    <button 
                      onClick={() => setShowMarketHub(true)}
                      className="px-12 py-5 bg-white text-indigo-800 hover:text-indigo-900 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:scale-105 active:scale-95 transition-all text-slate-900"
                    >
                      Enter Fairly Used Marketplace
                    </button>
                  </div>
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
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-400" />
                Recent Transactions
              </h2>
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
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm italic">
                            No transactions yet. Start playing to see your history!
                          </td>
                        </tr>
                      ) : (
                        transactions.map((tx, idx) => (
                          <tr key={`${tx.id || idx}-${idx}`} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <span className={`text-sm font-bold capitalize ${
                                tx.type === 'game_win' ? 'text-green-600' : 
                                tx.type === 'game_bet' ? 'text-red-600' : 
                                tx.type === 'deposit' ? 'text-blue-600' : 'text-orange-600'
                              }`}>
                                {tx.type.replace('_', ' ')}
                              </span>
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
                              {tx.timestamp?.toDate().toLocaleString() || 'Just now'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
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
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total House Gain</span>
                    <p className="text-4xl font-black text-indigo-400 mt-1">${(adminStats.totalHouseGain || 0).toFixed(2)}</p>
                  </div>
                  
                  <div className="pt-6 border-t border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-400">Admin Wallet</span>
                      <span className="text-lg font-bold text-white">${(adminStats.adminWallet || 0).toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-500 italic leading-relaxed">
                    * Randomization is weighted to ensure a 25% house edge on every spin. 
                    This ensures long-term profitability for the site manager.
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

      <LegalHub 
        isOpen={showLegalHub} 
        onClose={() => setShowLegalHub(false)} 
        initialSection={legalHubSection}
      />

      {user && <EfadoHelpChat user={user} />}
    </div>
  );
}
