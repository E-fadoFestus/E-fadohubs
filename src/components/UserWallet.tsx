import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  CreditCard,
  Plus,
  Shield,
  Bell,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lock,
  ShieldCheck,
  Fingerprint,
  Building2,
  User as UserIcon,
  Camera,
  Smartphone,
  Copy,
  ArrowRightLeft,
  Globe,
  Gift,
  Eye,
  EyeOff,
  Home,
  Trash2,
  LogOut,
  KeyRound,
  Loader2,
  Check,
  X,
  RefreshCw,
  ArrowRight,
  Bitcoin,
  Banknote
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Transaction, PaymentMethod } from '../types';
import { SecurityGuard, TransactionPinModal } from './SecurityGuard';
import { StrategicReceipt } from './StrategicReceipt';
import { PaymentGuidelinesModal } from './PaymentGuidelinesModal';
import { TransactionHistory } from './TransactionHistory';
import { PaystackDeposit } from './PaystackDeposit';
import { FlutterwaveDeposit } from './FlutterwaveDeposit';
import { OpayDeposit } from './OpayDeposit';
import { DirectBankDeposit } from './DirectBankDeposit';
import { PayPalHostedButton } from './PayPalHostedButton';
import { db, auth, doc, collection, query, where, onSnapshot } from '../firebase';
import { FLUTTERWAVE_BANKS } from '../data/flutterwaveBanks';
import {
  ACTIVE_WALLET_CURRENCIES,
  FUTURE_WALLET_CURRENCIES,
  formatCurrencyAmount,
  getMinDepositForCurrency,
  getWalletCurrencyMeta,
  isDisabledFutureCurrency,
  normalizeCurrencyCode
} from '../constants/walletCurrencies';
import { extractErrorMessage, readResponseSafely } from '../utils/errorFormat';

export interface UserWalletProps {
  user: UserProfile;
  onUpdateBalance: (amount: number, type: 'deposit' | 'withdrawal', accountDetails?: any) => Promise<void>;
  onClose?: () => void;
  initialTab?: 'overview' | 'profile' | 'deposit' | 'withdraw' | 'history' | 'settings';
}

type WalletTab = 'overview' | 'profile' | 'deposit' | 'withdraw' | 'history' | 'settings';
type DepositMethodTab = 'paystack' | 'bank_transfer' | 'opay' | 'flutterwave' | 'diaspora';
type BankCountryCode = 'NG' | 'GH' | 'KE' | 'UK' | 'US';

const LOCAL_AVATAR_PRESETS = [
  { id: 'efado', label: 'EFADO Emblem', src: '/efado_logo_192.jpg' },
  { id: 'jet', label: 'DeepSea Pilot', src: '/assets/deepsea-jet.jpg' },
  {
    id: 'purple',
    label: 'Violet Shield',
    src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" rx="40" fill="%237C3AED"/><text x="40" y="49" text-anchor="middle" fill="white" font-family="sans-serif" font-size="28" font-weight="bold">EF</text></svg>'
  },
  {
    id: 'emerald',
    label: 'Emerald Trust',
    src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" rx="40" fill="%2316A34A"/><text x="40" y="49" text-anchor="middle" fill="white" font-family="sans-serif" font-size="28" font-weight="bold">NG</text></svg>'
  }
];

const COUNTRY_LIST = [
  { code: 'NG', label: 'Nigeria', flag: '🇳🇬' },
  { code: 'GH', label: 'Ghana', flag: '🇬🇭' },
  { code: 'KE', label: 'Kenya', flag: '🇰🇪' },
  { code: 'UK', label: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', label: 'United States', flag: '🇺🇸' }
] as const;

const CRYPTO_DEPOSIT_WALLETS = {
  usdt: {
    label: 'USDT (TRC20)',
    address: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
    network: 'TRC20 (Tron)'
  },
  btc: {
    label: 'Bitcoin (BTC)',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    network: 'Bitcoin Mainnet'
  }
};

function maskNumberForDisplay(val?: string | null): string {
  const s = String(val || '').trim();
  if (!s) return 'Not added';
  if (s.includes('*') || s.includes('...')) return s;
  if (s.length <= 4) return '****';
  return `**** ${s.slice(-4)}`;
}

function maskAddressForDisplay(val?: string | null): string {
  const s = String(val || '').trim();
  if (!s) return 'Not added';
  if (s.includes('...')) return s;
  if (s.length <= 8) return s;
  return `${s.slice(0, 4)}...${s.slice(-4)}`;
}

function getWithdrawalFeeForCurrency(currency: string): number {
  switch (normalizeCurrencyCode(currency)) {
    case 'NGN':
      return 50;
    case 'GHS':
      return 2;
    case 'ZAR':
      return 10;
    case 'XOF':
      return 200;
    default:
      return 1;
  }
}

export const UserWallet: React.FC<UserWalletProps> = ({
  user,
  onUpdateBalance,
  onClose,
  initialTab = 'overview'
}) => {
  const [activeTab, setActiveTab] = useState<WalletTab>(initialTab);
  const [depositMethod, setDepositMethod] = useState<DepositMethodTab>('paystack');
  const [depositCurrency, setDepositCurrency] = useState<string>('NGN');
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);

  // Live balances from backend + Firestore listeners
  const [hideBalances, setHideBalances] = useState(false);
  const [totalActiveBalance, setTotalActiveBalance] = useState<number>(
    Number(user.cashOutWallet || 0) + Number(user.depositWallet || 0) + Number(user.promoWallet || 0) + Number(user.playerWallet || 0)
  );
  const [cashOutWallet, setCashOutWallet] = useState<number>(Number(user.cashOutWallet || 0));
  const [mainWallet, setMainWallet] = useState<number>(Number(user.depositWallet || 0));
  const [promoWallet, setPromoWallet] = useState<number>(Number(user.promoWallet || 0));
  const [playerWallet, setPlayerWallet] = useState<number>(Number(user.playerWallet || 0));
  const [pocketsMap, setPocketsMap] = useState<Record<string, number>>(() => ({
    NGN: Number(user.walletPockets?.NGN ?? user.depositWallet ?? 0),
    USD: Number(user.walletPockets?.USD ?? user.usd_balance ?? 0),
    GBP: Number(user.walletPockets?.GBP ?? user.gbp_balance ?? 0),
    EUR: Number(user.walletPockets?.EUR ?? user.eur_balance ?? 0),
    CAD: Number(user.walletPockets?.CAD ?? 0),
    AUD: Number(user.walletPockets?.AUD ?? 0),
    GHS: Number(user.walletPockets?.GHS ?? 0),
    ZAR: Number(user.walletPockets?.ZAR ?? 0),
    XOF: Number(user.walletPockets?.XOF ?? 0)
  }));

  // Notifications & Alerts
  const [alerts, setAlerts] = useState<Array<{ id: string; title: string; message: string; type?: string; createdAtIso?: string }>>([]);
  const [showAlertsDrawer, setShowAlertsDrawer] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);

  // Claim Reward state
  const [isClaimingReward, setIsClaimingReward] = useState(false);

  // Swap Modal state
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapSourceWallet, setSwapSourceWallet] = useState<'depositWallet' | 'cashOutWallet' | 'playerWallet' | 'promoWallet'>('depositWallet');
  const [swapFromCurrency, setSwapFromCurrency] = useState('NGN');
  const [swapToCurrency, setSwapToCurrency] = useState('USD');
  const [swapAmount, setSwapAmount] = useState('10000');
  const [swapQuote, setSwapQuote] = useState<{ rate: number; feeAmount: number; feePercent?: number; receiveAmount: number } | null>(null);
  const [isLoadingSwapRate, setIsLoadingSwapRate] = useState(false);
  const [isExecutingSwap, setIsExecutingSwap] = useState(false);
  const [swapError, setSwapError] = useState<string | null>(null);

  // Profile 01 / 02 / 03 state
  const [profilePhotoURL, setProfilePhotoURL] = useState(user.photoURL || '/efado_logo_192.jpg');
  const [profileLegalName, setProfileLegalName] = useState(user.fullName || user.displayName || 'Okhawere Festus Daniel');
  const [profileAlias, setProfileAlias] = useState(user.alias || 'Festival');
  const [profileDob, setProfileDob] = useState(user.dateOfBirth || '1990-01-01');
  const [profileNationality, setProfileNationality] = useState(user.nationality || 'Nigerian');
  const [profileCountry, setProfileCountry] = useState(user.country || 'Nigeria');
  const [profileGender, setProfileGender] = useState(user.gender || 'Male');
  const [profileAddress, setProfileAddress] = useState(user.address || '');
  const [profilePhone, setProfilePhone] = useState(user.phoneNumber || '');
  const [profileBio, setProfileBio] = useState(user.bio || '');
  const [profileKycStatus, setProfileKycStatus] = useState<string>(user.kycStatus || (user.fullName ? 'verified' : 'pending'));

  const [profileBankName, setProfileBankName] = useState(user.bankName || 'First Bank of Nigeria');
  const [profileBankCode, setProfileBankCode] = useState(user.bankCode || '011');
  const [profileAccountNumberInput, setProfileAccountNumberInput] = useState(user.accountNumber || '');
  const [profileAccountNumberMasked, setProfileAccountNumberMasked] = useState(maskNumberForDisplay(user.accountNumber));
  const [profileAccountName, setProfileAccountName] = useState(user.accountName || user.fullName || user.displayName || '');

  const [profileMomoProvider, setProfileMomoProvider] = useState(user.mobileMoneyProvider || 'MTN');
  const [profileMomoInput, setProfileMomoInput] = useState(user.mobileMoneyNumber || '');
  const [profileMomoMasked, setProfileMomoMasked] = useState(maskNumberForDisplay(user.mobileMoneyNumber));
  const [profileUsdtInput, setProfileUsdtInput] = useState(user.usdtAddress || '');
  const [profileUsdtMasked, setProfileUsdtMasked] = useState(maskAddressForDisplay(user.usdtAddress));
  const [profileBtcInput, setProfileBtcInput] = useState(user.btcAddress || user.externalWallet || '');
  const [profileBtcMasked, setProfileBtcMasked] = useState(maskAddressForDisplay(user.btcAddress || user.externalWallet));
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Diaspora / Crypto Deposit state
  const [cryptoTabMode, setCryptoTabMode] = useState<'crypto' | 'paypal'>('crypto');
  const [cryptoNetwork, setCryptoNetwork] = useState<'USDT (TRC20)' | 'Bitcoin (BTC)'>('USDT (TRC20)');
  const [cryptoAmount, setCryptoAmount] = useState('25');
  const [cryptoTxHash, setCryptoTxHash] = useState('');
  const [isSubmittingCrypto, setIsSubmittingCrypto] = useState(false);
  const [cryptoStatusMessage, setCryptoStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Withdraw state
  const [opayShieldEnabled, setOpayShieldEnabled] = useState(true);
  const [nightSafeEnabled, setNightSafeEnabled] = useState(true);
  const [withdrawCountry, setWithdrawCountry] = useState<BankCountryCode>('NG');
  const [bankDirectory, setBankDirectory] = useState<Array<{ code: string; name: string; country: string }>>([]);
  const [wdBankCode, setWdBankCode] = useState(user.bankCode || '011');
  const [wdBankName, setWdBankName] = useState(user.bankName || 'First Bank of Nigeria');
  const [wdAccountNumber, setWdAccountNumber] = useState('');
  const [wdUseSavedBank, setWdUseSavedBank] = useState(false);
  const [wdVerifiedName, setWdVerifiedName] = useState('');
  const [wdIsVerified, setWdIsVerified] = useState(false);
  const [wdNameMismatchError, setWdNameMismatchError] = useState<string | null>(null);
  const [wdVerifyError, setWdVerifyError] = useState<string | null>(null);
  const [isVerifyingBank, setIsVerifyingBank] = useState(false);
  const [wdSourceWallet, setWdSourceWallet] = useState<'playerWallet' | 'cashOutWallet' | 'depositWallet'>('playerWallet');
  const [wdAmount, setWdAmount] = useState('');
  const [wdGateway, setWdGateway] = useState<'paystack' | 'flutterwave'>('paystack');
  const [wdStatusMessage, setWdStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // PIN + OTP Modal state (shared by Withdrawal and Payment Method Removal)
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinModalContext, setPinModalContext] = useState<'withdraw' | 'remove_method' | null>(null);
  const [pinModalTargetMethodId, setPinModalTargetMethodId] = useState<string | null>(null);
  const [pinModalError, setPinModalError] = useState<string | null>(null);
  const [pinModalSubmitting, setPinModalSubmitting] = useState(false);
  const [pinModalRequiresOtp, setPinModalRequiresOtp] = useState(false);
  const [pinModalOtpDelivery, setPinModalOtpDelivery] = useState<string | undefined>(undefined);

  // Security & Payment Methods state
  const [hasTransactionPin, setHasTransactionPin] = useState<boolean>(Boolean(user.hasTransactionPin));
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(Boolean(user.twoFactorEnabled));
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(Boolean(user.biometricEnabled));
  const [loginHistory, setLoginHistory] = useState<Array<{ id: string; eventType?: string; description?: string; city?: string; device?: string; createdAtIso?: string }>>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showAddMethodForm, setShowAddMethodForm] = useState(false);
  const [newMethodType, setNewMethodType] = useState<'bank_transfer' | 'credit_card' | 'crypto' | 'mobile_money'>('bank_transfer');
  const [newMethodName, setNewMethodName] = useState('');
  const [newMethodDetails, setNewMethodDetails] = useState('');
  const [newMethodNetwork, setNewMethodNetwork] = useState('');
  const [isAddingMethod, setIsAddingMethod] = useState(false);

  // Set / Change PIN Dialog
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinSetupError, setPinSetupError] = useState<string | null>(null);
  const [isSavingPin, setIsSavingPin] = useState(false);

  // 2FA OTP Dialog
  const [show2faModal, setShow2faModal] = useState(false);
  const [pending2faTargetState, setPending2faTargetState] = useState(true);
  const [twoFaOtpCode, setTwoFaOtpCode] = useState('');
  const [twoFaOtpDelivery, setTwoFaOtpDelivery] = useState<string | undefined>(undefined);
  const [twoFaError, setTwoFaError] = useState<string | null>(null);
  const [isVerifying2fa, setIsVerifying2fa] = useState(false);

  const securitySectionRef = useRef<HTMLDivElement | null>(null);
  const paymentMethodsRef = useRef<HTMLDivElement | null>(null);

  // Synchronous double-click / race condition guards + idempotency keys
  const rewardInFlightRef = useRef(false);
  const swapInFlightRef = useRef(false);
  const swapIdempotencyKeyRef = useRef('');
  const cryptoInFlightRef = useRef(false);
  const pinConfirmInFlightRef = useRef(false);
  const wdIdempotencyKeyRef = useRef('');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initialTab === 'settings') {
      setTimeout(() => {
        securitySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [initialTab]);

  const showNotice = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  }, []);

  const getAuthHeaders = useCallback(async (jsonBody = true): Promise<Record<string, string>> => {
    const token = await auth.currentUser?.getIdToken().catch(() => '');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (jsonBody) headers['Content-Type'] = 'application/json';
    return headers;
  }, []);

  const fetchWalletSnapshot = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      const headers = await getAuthHeaders(false);
      const res = await fetch('/api/wallet/balance', { headers });
      const { data } = await readResponseSafely(res);
      if (res.ok && data?.success) {
        setTotalActiveBalance(Number(data.totalActiveBalance ?? 0));
        setCashOutWallet(Number(data.cashOutWallet ?? 0));
        setMainWallet(Number(data.mainWallet ?? data.depositWallet ?? 0));
        setPromoWallet(Number(data.promoWallet ?? 0));
        setPlayerWallet(Number(data.playerWallet ?? 0));
        if (data.walletPockets) {
          setPocketsMap((prev) => ({ ...prev, ...data.walletPockets }));
        }
        if (data.security) {
          setHasTransactionPin(Boolean(data.security.hasTransactionPin));
          setTwoFactorEnabled(Boolean(data.security.twoFactorEnabled));
          setBiometricEnabled(Boolean(data.security.biometricEnabled));
          if (data.security.nightSafeEnabled !== undefined) {
            setNightSafeEnabled(Boolean(data.security.nightSafeEnabled));
          }
          if (data.security.opayShieldEnabled !== undefined) {
            setOpayShieldEnabled(Boolean(data.security.opayShieldEnabled));
          }
        }
        if (data.profile) {
          if (data.profile.legalName) setProfileLegalName(data.profile.legalName);
          if (data.profile.alias) setProfileAlias(data.profile.alias);
          if (data.profile.dateOfBirth) setProfileDob(data.profile.dateOfBirth);
          if (data.profile.nationality) setProfileNationality(data.profile.nationality);
          if (data.profile.country) setProfileCountry(data.profile.country);
          if (data.profile.gender) setProfileGender(data.profile.gender);
          if (data.profile.address) setProfileAddress(data.profile.address);
          if (data.profile.phoneNumber) setProfilePhone(data.profile.phoneNumber);
          if (data.profile.bio) setProfileBio(data.profile.bio);
          if (data.profile.kycStatus) setProfileKycStatus(data.profile.kycStatus);
          if (data.profile.bankName) setProfileBankName(data.profile.bankName);
          if (data.profile.bankCode) setProfileBankCode(data.profile.bankCode);
          if (data.profile.accountNumberMasked) setProfileAccountNumberMasked(data.profile.accountNumberMasked);
          if (data.profile.accountName) setProfileAccountName(data.profile.accountName);
          if (data.profile.mobileMoneyProvider) setProfileMomoProvider(data.profile.mobileMoneyProvider);
          if (data.profile.mobileMoneyNumberMasked) setProfileMomoMasked(data.profile.mobileMoneyNumberMasked);
          if (data.profile.usdtAddressMasked) setProfileUsdtMasked(data.profile.usdtAddressMasked);
          if (data.profile.btcAddressMasked) setProfileBtcMasked(data.profile.btcAddressMasked);
        }
      }
    } catch {
      // Keep optimistic / Firestore values
    }
  }, [getAuthHeaders]);

  const fetchHistoryAndSecurityData = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      const headers = await getAuthHeaders(false);
      const [histRes, secRes, pmRes, alertRes] = await Promise.all([
        fetch('/api/wallet/history', { headers }),
        fetch('/api/security/login-history', { headers }),
        fetch('/api/wallet/payment-methods', { headers }),
        fetch('/api/wallet/alerts', { headers })
      ]);

      const { data: histJson } = await readResponseSafely(histRes);
      if (histRes.ok && Array.isArray(histJson?.transactions)) {
        setRecentTransactions(histJson.transactions.slice(0, 8));
      }

      const { data: secJson } = await readResponseSafely(secRes);
      if (secRes.ok && Array.isArray(secJson?.logs)) {
        setLoginHistory(secJson.logs);
      }

      const { data: pmJson } = await readResponseSafely(pmRes);
      if (pmRes.ok && Array.isArray(pmJson?.paymentMethods)) {
        setPaymentMethods(pmJson.paymentMethods);
      }

      const { data: alertJson } = await readResponseSafely(alertRes);
      if (alertRes.ok && Array.isArray(alertJson?.alerts)) {
        setAlerts(alertJson.alerts);
      }
    } catch {
      // Silent safe fallback
    }
  }, [getAuthHeaders]);

  const fetchBanksForCountry = useCallback(async (country: BankCountryCode) => {
    try {
      const res = await fetch(`/api/banks/list?country=${country}`);
      const { data } = await readResponseSafely(res);
      if (res.ok && Array.isArray(data?.banks) && data.banks.length > 0) {
        setBankDirectory(data.banks);
        return;
      }
    } catch {
      // Fallback below
    }
    setBankDirectory(
      FLUTTERWAVE_BANKS.filter((b) => b.country === country).map((b) => ({
        code: b.code,
        name: b.name,
        country: b.country
      }))
    );
  }, []);

  // Initial loads
  useEffect(() => {
    fetchWalletSnapshot();
    fetchHistoryAndSecurityData();
  }, [fetchWalletSnapshot, fetchHistoryAndSecurityData]);

  useEffect(() => {
    fetchBanksForCountry(withdrawCountry);
  }, [withdrawCountry, fetchBanksForCountry]);

  // Real-time Firestore user & pocket listeners
  useEffect(() => {
    if (!user?.uid) return;
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (!snap.exists()) return;
      const d = snap.data() || {};
      setCashOutWallet(Number(d.cashOutWallet ?? 0));
      setPromoWallet(Number(d.promoWallet ?? 0));
      setPlayerWallet(Number(d.playerWallet ?? 0));
      if (d.hasTransactionPin !== undefined) setHasTransactionPin(Boolean(d.hasTransactionPin));
      if (d.twoFactorEnabled !== undefined) setTwoFactorEnabled(Boolean(d.twoFactorEnabled));
      if (d.biometricEnabled !== undefined) setBiometricEnabled(Boolean(d.biometricEnabled));
      if (d.fullName) setProfileLegalName(d.fullName);
      if (d.photoURL) setProfilePhotoURL(d.photoURL);
    });

    const pocketUnsubs = ACTIVE_WALLET_CURRENCIES.map((cur) =>
      onSnapshot(doc(db, 'wallets', user.uid, cur.code, 'depositWallet'), (snap) => {
        if (!snap.exists()) return;
        const val = Number(snap.data()?.balance ?? snap.data()?.depositWallet ?? 0);
        setPocketsMap((prev) => ({ ...prev, [cur.code]: val }));
        if (cur.code === 'NGN') setMainWallet(val);
      })
    );

    const txQ = query(collection(db, 'transactions'), where('userId', '==', user.uid));
    const unsubTx = onSnapshot(txQ, (snap) => {
      const list: Transaction[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      list.sort((a: any, b: any) => {
        const ta = new Date(a.createdAtIso || a.timestamp?.toDate?.() || 0).getTime();
        const tb = new Date(b.createdAtIso || b.timestamp?.toDate?.() || 0).getTime();
        return tb - ta;
      });
      if (list.length > 0) setRecentTransactions(list.slice(0, 8));
    });

    return () => {
      unsubUser();
      unsubTx();
      pocketUnsubs.forEach((u) => u());
    };
  }, [user?.uid]);

  // Recalculate Total Active Balance locally whenever sub-wallets update cleanly
  useEffect(() => {
    const ngnMain = Number(pocketsMap.NGN ?? mainWallet ?? 0);
    setMainWallet(ngnMain);
  }, [pocketsMap, mainWallet]);

  // Live FX rate lookup when Swap Modal is open
  useEffect(() => {
    if (!showSwapModal) return;
    let active = true;
    const timer = setTimeout(async () => {
      const amt = Number(swapAmount);
      if (!Number.isFinite(amt) || amt <= 0) {
        setSwapQuote(null);
        return;
      }
      setIsLoadingSwapRate(true);
      setSwapError(null);
      try {
        const headers = await getAuthHeaders(false);
        const res = await fetch(
          `/api/wallet/swap/rate?from=${encodeURIComponent(swapFromCurrency)}&to=${encodeURIComponent(swapToCurrency)}&amount=${encodeURIComponent(amt)}`,
          { headers }
        );
        const { data, rawText } = await readResponseSafely(res);
        if (active) {
          if (res.ok && data?.quote) {
            setSwapQuote(data.quote);
          } else {
            setSwapError(extractErrorMessage(data || rawText, 'Could not fetch exchange rate.'));
          }
        }
      } catch {
        if (active) setSwapError('Network issue checking live rate.');
      } finally {
        if (active) setIsLoadingSwapRate(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [showSwapModal, swapFromCurrency, swapToCurrency, swapAmount, getAuthHeaders]);

  const copyToClipboard = (val: string, label: string) => {
    if (!val || val === 'Not added') return;
    navigator.clipboard?.writeText(val);
    showNotice(`${label} copied safely.`, 'success');
  };

  // Handler: Claim EFADO Reward -> Promo Wallet + History
  const handleClaimReward = async () => {
    if (rewardInFlightRef.current || isClaimingReward) return;
    rewardInFlightRef.current = true;
    setIsClaimingReward(true);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch('/api/wallet/reward/claim', {
        method: 'POST',
        headers,
        body: JSON.stringify({})
      });
      const { data, rawText } = await readResponseSafely(res);
      if (!res.ok || !data?.success) {
        throw new Error(extractErrorMessage(data || rawText, 'Could not claim reward.'));
      }
      if (typeof data.promoWallet === 'number') setPromoWallet(data.promoWallet);
      showNotice(data.message || 'EFADO Reward added to your Promo Wallet!', 'success');
      fetchWalletSnapshot();
      fetchHistoryAndSecurityData();
    } catch (err: any) {
      showNotice(err?.message || 'Unable to claim reward right now.', 'error');
    } finally {
      rewardInFlightRef.current = false;
      setIsClaimingReward(false);
    }
  };

  // Handler: Currency Swap Submit (Double-click & idempotency protected)
  const handleExecuteSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (swapInFlightRef.current || isExecutingSwap) return;
    setSwapError(null);
    const numAmt = Number(swapAmount);
    if (!Number.isFinite(numAmt) || numAmt <= 0) {
      setSwapError('Enter an amount greater than 0.');
      return;
    }
    if (!swapIdempotencyKeyRef.current) {
      swapIdempotencyKeyRef.current = `EFD-SWAP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    }
    swapInFlightRef.current = true;
    setIsExecutingSwap(true);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch('/api/wallet/swap', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sourceWallet: swapSourceWallet,
          fromCurrency: swapFromCurrency,
          toCurrency: swapToCurrency,
          amount: numAmt,
          idempotencyKey: swapIdempotencyKeyRef.current
        })
      });
      const { data, rawText } = await readResponseSafely(res);
      if (!res.ok || !data?.success) {
        throw new Error(extractErrorMessage(data || rawText, 'Currency swap failed.'));
      }
      swapIdempotencyKeyRef.current = '';
      setShowSwapModal(false);
      showNotice(
        `Swapped ${formatCurrencyAmount(numAmt, swapFromCurrency)} into ${formatCurrencyAmount(data.quote?.receiveAmount || 0, swapToCurrency)}.`,
        'success'
      );
      await fetchWalletSnapshot();
      await fetchHistoryAndSecurityData();
    } catch (err: any) {
      setSwapError(err?.message || 'Could not complete swap.');
    } finally {
      swapInFlightRef.current = false;
      setIsExecutingSwap(false);
    }
  };

  // Handler: Profile Sync
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch('/api/wallet/profile/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          legalName: profileLegalName.trim(),
          displayName: profileLegalName.trim(),
          alias: profileAlias.trim(),
          dateOfBirth: profileDob,
          nationality: profileNationality.trim(),
          country: profileCountry,
          gender: profileGender,
          address: profileAddress.trim(),
          phoneNumber: profilePhone.trim(),
          bio: profileBio.trim(),
          photoURL: profilePhotoURL,
          bankName: profileBankName.trim(),
          bankCode: profileBankCode.trim(),
          accountNumber: profileAccountNumberInput.trim(),
          accountName: (profileAccountName || profileLegalName).trim(),
          mobileMoneyProvider: profileMomoProvider,
          mobileMoneyNumber: profileMomoInput.trim(),
          usdtAddress: profileUsdtInput.trim(),
          btcAddress: profileBtcInput.trim()
        })
      });
      const { data, rawText } = await readResponseSafely(res);
      if (!res.ok || !data?.success) {
        throw new Error(extractErrorMessage(data || rawText, 'Could not sync profile.'));
      }
      if (data.masked) {
        if (data.masked.accountNumber) {
          setProfileAccountNumberMasked(data.masked.accountNumber);
          setProfileAccountNumberInput(data.masked.accountNumber);
        }
        if (data.masked.mobileMoneyNumber) {
          setProfileMomoMasked(data.masked.mobileMoneyNumber);
          setProfileMomoInput(data.masked.mobileMoneyNumber);
        }
        if (data.masked.usdtAddress) {
          setProfileUsdtMasked(data.masked.usdtAddress);
          setProfileUsdtInput(data.masked.usdtAddress);
        }
        if (data.masked.btcAddress) {
          setProfileBtcMasked(data.masked.btcAddress);
          setProfileBtcInput(data.masked.btcAddress);
        }
      }
      // Auto-sync saved bank to Withdraw page fields
      if (profileBankName) setWdBankName(profileBankName);
      if (profileBankCode) setWdBankCode(profileBankCode);
      showNotice('Profile & payout bank synced securely!', 'success');
      fetchWalletSnapshot();
      fetchHistoryAndSecurityData();
    } catch (err: any) {
      showNotice(err?.message || 'Profile update failed.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handler: Avatar Upload -> Compressed local Data URL
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showNotice('Please select an image smaller than 5MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSide = 256;
        const scale = Math.min(maxSide / img.width, maxSide / img.height, 1);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setProfilePhotoURL(canvas.toDataURL('image/jpeg', 0.85));
          showNotice('Photo selected. Click "Save & Synchronize Profile" to save.', 'success');
        }
      };
      if (typeof ev.target?.result === 'string') img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Handler: Crypto Deposit Confirm
  const handleCryptoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cryptoInFlightRef.current || isSubmittingCrypto) return;
    setCryptoStatusMessage(null);
    const numAmt = Number(cryptoAmount);
    if (!Number.isFinite(numAmt) || numAmt < getMinDepositForCurrency(depositCurrency)) {
      setCryptoStatusMessage({
        text: `Minimum deposit is ${formatCurrencyAmount(getMinDepositForCurrency(depositCurrency), depositCurrency)}.`,
        type: 'error'
      });
      return;
    }
    if (cryptoTxHash.trim().length < 12) {
      setCryptoStatusMessage({
        text: 'Please enter a valid blockchain transaction hash (min 12 characters).',
        type: 'error'
      });
      return;
    }
    cryptoInFlightRef.current = true;
    setIsSubmittingCrypto(true);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch('/api/wallet/deposit/crypto/confirm', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: numAmt,
          currency: depositCurrency,
          network: cryptoNetwork,
          txHash: cryptoTxHash.trim()
        })
      });
      const { data, rawText } = await readResponseSafely(res);
      if (!res.ok || !data?.success) {
        throw new Error(extractErrorMessage(data || rawText, 'Could not submit transfer hash.'));
      }
      setCryptoTxHash('');
      setCryptoStatusMessage({
        text: data.message || 'Transfer submitted for blockchain confirmation.',
        type: 'success'
      });
      fetchHistoryAndSecurityData();
    } catch (err: any) {
      setCryptoStatusMessage({ text: err?.message || 'Submission failed.', type: 'error' });
    } finally {
      cryptoInFlightRef.current = false;
      setIsSubmittingCrypto(false);
    }
  };

  // Handler: Use My Saved Bank (Auto-fill from Profile 02 & verify)
  const handleUseSavedBank = async () => {
    if (!profileBankName || profileAccountNumberMasked === 'Not added') {
      showNotice('Save a bank account in My Account Profile first.', 'error');
      return;
    }
    setWdUseSavedBank(true);
    setWdBankName(profileBankName);
    setWdBankCode(profileBankCode || '011');
    setWdAccountNumber(profileAccountNumberMasked);
    setWdVerifiedName(profileAccountName || profileLegalName);
    setWdVerifyError(null);
    setWdNameMismatchError(null);
    setWdIsVerified(Boolean(profileAccountName || profileLegalName));
    showNotice('Saved bank loaded from your profile.', 'success');
  };

  // Handler: Verify Bank Account via backend
  const handleVerifyBankAccount = async () => {
    setWdVerifyError(null);
    setWdNameMismatchError(null);
    setWdIsVerified(false);

    if (wdUseSavedBank && wdAccountNumber.includes('*')) {
      setWdIsVerified(true);
      return;
    }

    const cleanDigits = wdAccountNumber.replace(/\D/g, '');
    if (cleanDigits.length < 8) {
      setWdVerifyError('Enter a valid bank account number.');
      return;
    }
    if (!wdBankCode) {
      setWdVerifyError('Select a destination bank first.');
      return;
    }

    setIsVerifyingBank(true);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch('/api/wallet/withdraw/verify-account', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          accountNumber: cleanDigits,
          bankCode: wdBankCode,
          bankName: wdBankName,
          gateway: wdGateway
        })
      });
      const { data, rawText } = await readResponseSafely(res);
      if (!res.ok || !data?.verified) {
        throw new Error(extractErrorMessage(data || rawText, 'Could not verify bank account.'));
      }
      setWdVerifiedName(data.account_name || '');
      if (data.nameMatch === false) {
        setWdNameMismatchError(
          data.mismatchReason || 'Account name does not match your verified legal name'
        );
        setWdIsVerified(false);
      } else {
        setWdIsVerified(true);
        showNotice(`Bank Verified: ${data.account_name}`, 'success');
      }
    } catch (err: any) {
      setWdVerifyError(err?.message || 'Bank verification failed.');
    } finally {
      setIsVerifyingBank(false);
    }
  };

  const wdAvailableBalance =
    wdSourceWallet === 'cashOutWallet'
      ? cashOutWallet
      : wdSourceWallet === 'playerWallet'
        ? playerWallet
        : mainWallet;

  const wdParsedAmount = Number(wdAmount) || 0;
  const wdFee = getWithdrawalFeeForCurrency('NGN');
  const wdGrossTotal = wdParsedAmount > 0 ? wdParsedAmount + wdFee : 0;
  const canConfirmWithdraw =
    wdIsVerified &&
    !wdNameMismatchError &&
    wdParsedAmount >= 100 &&
    wdGrossTotal <= wdAvailableBalance;

  // Persist Cyber Shields (OPAY Payment Shield & Night Safe Sentry) on backend
  const handleToggleShield = async (field: 'opayShieldEnabled' | 'nightSafeEnabled') => {
    const prevValue = field === 'opayShieldEnabled' ? opayShieldEnabled : nightSafeEnabled;
    const nextValue = !prevValue;
    if (field === 'opayShieldEnabled') setOpayShieldEnabled(nextValue);
    else setNightSafeEnabled(nextValue);

    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch('/api/security/shields', {
        method: 'POST',
        headers,
        body: JSON.stringify({ [field]: nextValue })
      });
      if (!res.ok) {
        throw new Error('Could not update shield preference.');
      }
      showNotice(
        `${field === 'opayShieldEnabled' ? 'OPAY Payment Shield' : 'Night Safe Sentry'} ${nextValue ? 'enabled' : 'disabled'}.`,
        'success'
      );
    } catch {
      if (field === 'opayShieldEnabled') setOpayShieldEnabled(prevValue);
      else setNightSafeEnabled(prevValue);
      showNotice('Could not update security shield preference.', 'error');
    }
  };

  // Open PIN modal for Withdrawal
  const handleStartWithdraw = () => {
    setWdStatusMessage(null);
    if (!canConfirmWithdraw) return;
    if (!hasTransactionPin) {
      setPinSetupError(null);
      setShowPinSetupModal(true);
      showNotice('Create your 4-digit Transaction PIN first to protect your money.', 'error');
      return;
    }
    wdIdempotencyKeyRef.current = `EFD-WD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    setPinModalContext('withdraw');
    setPinModalError(null);
    setPinModalRequiresOtp(false);
    setPinModalOtpDelivery(undefined);
    setPinModalOpen(true);
  };

  // Confirm PIN (+ optional SMS/Email OTP) for Withdrawal or Payment Method Removal
  const handlePinModalConfirm = async (pin: string, otpCode?: string) => {
    if (pinConfirmInFlightRef.current || pinModalSubmitting) return;
    pinConfirmInFlightRef.current = true;
    setPinModalError(null);
    setPinModalSubmitting(true);
    try {
      const headers = await getAuthHeaders(true);

      if (pinModalContext === 'withdraw') {
        const res = await fetch('/api/wallet/withdraw/initiate', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            amount: wdParsedAmount,
            currency: 'NGN',
            sourceWallet: wdSourceWallet,
            bankCode: wdBankCode,
            bankName: wdBankName,
            accountNumber: wdUseSavedBank ? '' : wdAccountNumber.replace(/\D/g, ''),
            accountName: wdVerifiedName,
            gateway: wdGateway,
            pin,
            otpCode,
            useSavedBank: wdUseSavedBank,
            idempotencyKey: wdIdempotencyKeyRef.current
          })
        });
        const { data, rawText } = await readResponseSafely(res);

        if (res.status === 403 && data?.code === 'OTP_REQUIRED') {
          setPinModalRequiresOtp(true);
          const targetDesc = [data.maskedEmail, data.maskedPhone].filter(Boolean).join(' & ');
          setPinModalOtpDelivery(
            targetDesc
              ? `6-digit security code sent via SMS/Email (${targetDesc}).`
              : 'Enter the 6-digit code sent to your registered Email or SMS.'
          );
          setPinModalError(data.message || 'Enter the 6-digit verification code sent to your Email / SMS.');
          return;
        }
        if (res.status === 403 && data?.code === 'PIN_NOT_SET') {
          setPinModalOpen(false);
          setShowPinSetupModal(true);
          return;
        }
        if (!res.ok || !data?.success) {
          throw new Error(extractErrorMessage(data || rawText, 'Withdrawal failed.'));
        }

        wdIdempotencyKeyRef.current = '';
        setPinModalOpen(false);
        setWdAmount('');
        setWdStatusMessage({
          text: `${formatCurrencyAmount(wdParsedAmount, 'NGN')} payout initiated! Arrives in 1-5 mins.`,
          type: 'success'
        });
        showNotice('Withdrawal submitted safely!', 'success');
        await fetchWalletSnapshot();
        await fetchHistoryAndSecurityData();
        onUpdateBalance(wdParsedAmount, 'withdrawal', {
          bankName: wdBankName,
          alreadyProcessedByServer: true
        }).catch(() => {});
      } else if (pinModalContext === 'remove_method' && pinModalTargetMethodId) {
        const res = await fetch(`/api/wallet/payment-methods/${encodeURIComponent(pinModalTargetMethodId)}`, {
          method: 'DELETE',
          headers,
          body: JSON.stringify({ pin })
        });
        const { data, rawText } = await readResponseSafely(res);
        if (!res.ok || !data?.success) {
          throw new Error(extractErrorMessage(data || rawText, 'Could not remove payment method.'));
        }
        setPinModalOpen(false);
        setPinModalTargetMethodId(null);
        showNotice('Payment method removed.', 'success');
        await fetchHistoryAndSecurityData();
      }
    } catch (err: any) {
      setPinModalError(err?.message || 'Verification failed.');
    } finally {
      pinConfirmInFlightRef.current = false;
      setPinModalSubmitting(false);
    }
  };

  // Save / Change 4-digit Transaction PIN
  const handleSaveTransactionPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinSetupError(null);
    if (!/^\d{4}$/.test(newPinInput)) {
      setPinSetupError('New PIN must be exactly 4 digits.');
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setPinSetupError('PINs do not match.');
      return;
    }
    setIsSavingPin(true);
    try {
      const headers = await getAuthHeaders(true);
      const url = hasTransactionPin ? '/api/wallet/pin/change' : '/api/wallet/pin/set';
      const payload = hasTransactionPin
        ? { currentPin: currentPinInput, newPin: newPinInput }
        : { pin: newPinInput };
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const { data, rawText } = await readResponseSafely(res);
      if (!res.ok || !data?.success) {
        throw new Error(extractErrorMessage(data || rawText, 'Could not save Transaction PIN.'));
      }
      setHasTransactionPin(true);
      setShowPinSetupModal(false);
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
      showNotice('Transaction PIN saved safely.', 'success');
      fetchHistoryAndSecurityData();
    } catch (err: any) {
      setPinSetupError(err?.message || 'PIN update failed.');
    } finally {
      setIsSavingPin(false);
    }
  };

  // Toggle Two-Factor Auth (OTP delivered exclusively via SMS / Email)
  const handleToggle2FA = async () => {
    const nextState = !twoFactorEnabled;
    setTwoFaError(null);
    setTwoFaOtpCode('');
    setTwoFaOtpDelivery(undefined);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch('/api/auth/enable-2fa', {
        method: 'POST',
        headers,
        body: JSON.stringify({ enable: nextState })
      });
      const { data, rawText } = await readResponseSafely(res);
      if (!res.ok || !data?.success) {
        throw new Error(extractErrorMessage(data || rawText, 'Could not start 2FA verification.'));
      }
      setPending2faTargetState(nextState);
      const targetDesc = [data.maskedEmail, data.maskedPhone].filter(Boolean).join(' & ');
      setTwoFaOtpDelivery(
        targetDesc
          ? `6-digit security code sent to ${targetDesc}.`
          : 'Check your registered Email or SMS for your 6-digit security code.'
      );
      setShow2faModal(true);
    } catch (err: any) {
      showNotice(err?.message || 'Could not update 2FA settings.', 'error');
    }
  };

  const handleConfirm2faOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFaError(null);
    setIsVerifying2fa(true);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers,
        body: JSON.stringify({ code: twoFaOtpCode.trim(), enable: pending2faTargetState })
      });
      const { data, rawText } = await readResponseSafely(res);
      if (!res.ok || !data?.success) {
        throw new Error(extractErrorMessage(data || rawText, 'Invalid 6-digit verification code.'));
      }
      setTwoFactorEnabled(Boolean(data.twoFactorEnabled));
      setShow2faModal(false);
      showNotice(data.message || 'Two-Factor Authentication updated.', 'success');
      fetchHistoryAndSecurityData();
    } catch (err: any) {
      setTwoFaError(err?.message || 'Verification failed.');
    } finally {
      setIsVerifying2fa(false);
    }
  };

  const handleToggleBiometric = async () => {
    const nextBio = !biometricEnabled;
    if (nextBio && typeof window !== 'undefined' && !window.PublicKeyCredential) {
      showNotice('Biometric authentication is not supported on this browser.', 'error');
      return;
    }
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch('/api/auth/enable-2fa', {
        method: 'POST',
        headers,
        body: JSON.stringify({ biometricEnabled: nextBio })
      });
      const { data } = await readResponseSafely(res);
      if (res.ok && data?.success) {
        setBiometricEnabled(nextBio);
        showNotice(`Biometric confirmation ${nextBio ? 'enabled' : 'disabled'}.`, 'success');
      }
    } catch {
      showNotice('Could not update biometric preference.', 'error');
    }
  };

  const handleLogoutAllDevices = async () => {
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch('/api/security/logout-all', {
        method: 'POST',
        headers,
        body: JSON.stringify({})
      });
      const { data, rawText } = await readResponseSafely(res);
      if (!res.ok || !data?.success) {
        throw new Error(extractErrorMessage(data || rawText, 'Could not sign out other devices.'));
      }
      showNotice('All other devices signed out safely.', 'success');
      fetchHistoryAndSecurityData();
    } catch (err: any) {
      showNotice(err?.message || 'Failed to sign out devices.', 'error');
    }
  };

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMethodName.trim() || !newMethodDetails.trim()) {
      showNotice('Enter method name and account/wallet details.', 'error');
      return;
    }
    setIsAddingMethod(true);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch('/api/wallet/payment-methods/add', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: newMethodType,
          name: newMethodName.trim(),
          details: newMethodDetails.trim(),
          network: newMethodNetwork.trim()
        })
      });
      const { data, rawText } = await readResponseSafely(res);
      if (!res.ok || !data?.success) {
        throw new Error(extractErrorMessage(data || rawText, 'Could not add payment method.'));
      }
      setShowAddMethodForm(false);
      setNewMethodName('');
      setNewMethodDetails('');
      setNewMethodNetwork('');
      showNotice('Payment method saved & encrypted.', 'success');
      await fetchWalletSnapshot();
      await fetchHistoryAndSecurityData();
    } catch (err: any) {
      showNotice(err?.message || 'Failed to add method.', 'error');
    } finally {
      setIsAddingMethod(false);
    }
  };

  const handleRequestRemoveMethod = (methodId: string) => {
    if (!hasTransactionPin) {
      setShowPinSetupModal(true);
      showNotice('Create a 4-digit Transaction PIN before removing a saved payment method.', 'error');
      return;
    }
    setPinModalContext('remove_method');
    setPinModalTargetMethodId(methodId);
    setPinModalError(null);
    setPinModalRequiresOtp(false);
    setPinModalOpen(true);
  };

  const currentCountryMeta = useMemo(() => {
    return (
      COUNTRY_LIST.find((c) => c.label.toLowerCase() === profileCountry.toLowerCase()) || COUNTRY_LIST[0]
    );
  }, [profileCountry]);

  const formatBalanceDisplay = (amt: number, cur = 'NGN') =>
    hideBalances ? '••••••' : formatCurrencyAmount(amt, cur);

  const isHistoryOrSecurityTab = activeTab === 'history' || activeTab === 'settings';

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#FAF8FF] via-white to-[#F5F3FF] text-slate-900 font-sans overflow-x-hidden pb-24 sm:pb-10">
      <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-6 pt-4 space-y-5">
        {/* Global Light Top Bar */}
        <header className="bg-white rounded-2xl p-4 shadow-sm border border-purple-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/efado_logo_192.jpg"
              alt="EFADO Wallet"
              className="w-10 h-10 rounded-xl object-cover border border-purple-200 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight m-0 truncate">
                  EFADO WALLET
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#16A34A] text-[11px] font-bold shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium m-0 max-w-none truncate">
                Your money is safe • Protected by 256-bit encryption
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowGuidelinesModal(true)}
              className="px-3 py-2 rounded-xl border border-purple-200 bg-purple-50 text-[#7C3AED] text-xs font-bold hover:bg-purple-100 transition-colors"
            >
              Safety Guide
            </button>
            <button
              type="button"
              onClick={() => setShowAlertsDrawer((v) => !v)}
              aria-label="Notifications"
              className="relative p-2.5 rounded-xl border border-purple-100 bg-white hover:bg-purple-50 text-slate-700 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#7C3AED] text-white text-[10px] font-extrabold flex items-center justify-center">
                  {Math.min(alerts.length, 9)}
                </span>
              )}
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close Wallet"
                className="p-2.5 rounded-xl border border-purple-100 bg-white hover:bg-purple-50 text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        {/* Alerts Drawer */}
        <AnimatePresence>
          {showAlertsDrawer && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-white rounded-2xl p-4 shadow-sm border border-purple-200 space-y-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 m-0">Recent Wallet Alerts</h3>
                <button
                  type="button"
                  onClick={() => setShowAlertsDrawer(false)}
                  className="text-xs font-bold text-[#7C3AED]"
                >
                  Close
                </button>
              </div>
              {alerts.length === 0 ? (
                <p className="text-xs text-slate-500 m-0 max-w-none">No recent notifications.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {alerts.slice(0, 6).map((a) => (
                    <div key={a.id} className="p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                      <div className="text-xs font-bold text-slate-900">{a.title}</div>
                      <p className="text-xs text-slate-600 m-0 max-w-none mt-0.5">{a.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast Feedback */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`rounded-2xl p-3.5 border flex items-center justify-between gap-3 shadow-sm ${
                toast.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-[#16A34A]'
                  : 'bg-red-50 border-red-200 text-[#DC2626]'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold">
                {toast.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{toast.text}</span>
              </div>
              <button type="button" onClick={() => setToast(null)} className="text-xs font-bold">
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 5-Page Top Navigation Pills */}
        <nav className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: Wallet },
            { id: 'profile', label: 'My Profile', icon: UserIcon },
            { id: 'deposit', label: 'Deposit Funds', icon: ArrowDownCircle },
            { id: 'withdraw', label: 'Withdraw Funds', icon: ArrowUpCircle },
            { id: 'history', label: 'History & Security', icon: History }
          ].map((tab) => {
            const Icon = tab.icon;
            const active =
              activeTab === tab.id || (tab.id === 'history' && activeTab === 'settings');
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as WalletTab)}
                className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                  active
                    ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-sm'
                    : 'bg-white text-slate-700 border-purple-100 hover:border-purple-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ===================== PAGE 1: OVERVIEW ===================== */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* User Profile Header Card */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-purple-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <img
                  src={profilePhotoURL || '/efado_logo_192.jpg'}
                  alt={profileLegalName}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-200 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 m-0 truncate">
                      {profileLegalName}
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[#16A34A] border border-emerald-200 text-[11px] font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mt-1 flex-wrap">
                    <span className="text-[#7C3AED] font-bold">@{profileAlias || 'efado'}</span>
                    <span>•</span>
                    <span>
                      {currentCountryMeta.flag} Country: {profileCountry || 'Nigeria'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-xs font-bold border border-purple-200 transition-colors"
              >
                Edit Profile
              </button>
            </div>

            {/* TOTAL ACTIVE BALANCE HERO CARD */}
            <div className="bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] rounded-2xl p-5 sm:p-6 shadow-md text-white space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-100">
                    TOTAL ACTIVE BALANCE
                  </span>
                  <div className="text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight mt-1 text-white">
                    {formatBalanceDisplay(totalActiveBalance, 'NGN')}
                  </div>
                  <p className="text-xs text-purple-100 font-medium m-0 max-w-none mt-1">
                    Combined value across Cash Out, Main, Promo & Foreign Currency Pockets
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHideBalances((v) => !v)}
                  aria-label="Toggle Balance Visibility"
                  className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors"
                >
                  {hideBalances ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* 3 Core Wallets */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl p-4 text-slate-900 shadow-sm">
                  <div className="text-[11px] font-bold uppercase text-slate-500">Cash Out Wallet</div>
                  <div className="text-lg font-extrabold tabular-nums text-slate-900 mt-1">
                    {formatBalanceDisplay(cashOutWallet, 'NGN')}
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-4 text-slate-900 shadow-sm">
                  <div className="text-[11px] font-bold uppercase text-slate-500">Main Wallet</div>
                  <div className="text-lg font-extrabold tabular-nums text-[#16A34A] mt-1">
                    {formatBalanceDisplay(mainWallet, 'NGN')}
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-4 text-slate-900 shadow-sm">
                  <div className="text-[11px] font-bold uppercase text-slate-500">Promo Wallet</div>
                  <div className="text-lg font-extrabold tabular-nums text-[#7C3AED] mt-1">
                    {formatBalanceDisplay(promoWallet, 'NGN')}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('deposit')}
                  className="py-3 px-2 rounded-xl bg-[#16A34A] hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <ArrowDownCircle className="w-4 h-4 shrink-0" />
                  <span>Deposit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('withdraw')}
                  className="py-3 px-2 rounded-xl bg-white hover:bg-purple-50 text-[#7C3AED] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <ArrowUpCircle className="w-4 h-4 shrink-0" />
                  <span>Withdraw</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    swapIdempotencyKeyRef.current = `EFD-SWAP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
                    setSwapError(null);
                    setShowSwapModal(true);
                  }}
                  className="py-3 px-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ArrowRightLeft className="w-4 h-4 shrink-0" />
                  <span>Swap</span>
                </button>
              </div>
            </div>

            {/* Currency Pockets Grid (9 Active + SIRA Locked Coming Soon) */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-purple-100 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 m-0">
                    Currency Pockets
                  </h3>
                  <p className="text-xs text-slate-500 m-0 max-w-none">
                    Tap any active currency to add funds or convert with live FX rates
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    swapIdempotencyKeyRef.current = `EFD-SWAP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
                    setSwapError(null);
                    setShowSwapModal(true);
                  }}
                  className="text-xs font-bold text-[#7C3AED] hover:underline shrink-0"
                >
                  Convert FX
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {ACTIVE_WALLET_CURRENCIES.map((cur) => {
                  const bal = pocketsMap[cur.code] ?? 0;
                  return (
                    <button
                      key={cur.code}
                      type="button"
                      onClick={() => {
                        setDepositCurrency(cur.code);
                        setActiveTab('deposit');
                      }}
                      className="text-left p-3 rounded-2xl border border-purple-100 hover:border-[#7C3AED] bg-purple-50/40 hover:bg-purple-50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-lg leading-none">{cur.flag}</span>
                        <span className="text-[11px] font-extrabold text-[#7C3AED]">{cur.code}</span>
                      </div>
                      <div className="text-sm font-extrabold tabular-nums text-slate-900 truncate">
                        {formatBalanceDisplay(bal, cur.code)}
                      </div>
                      <div className="text-[10px] font-medium text-slate-500 truncate mt-0.5">
                        {cur.name}
                      </div>
                    </button>
                  );
                })}

                {FUTURE_WALLET_CURRENCIES.map((cur) => (
                  <div
                    key={cur.code}
                    aria-disabled="true"
                    className="p-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 opacity-85 cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-lg leading-none">{cur.flag}</span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-slate-500">
                        <Lock className="w-3 h-3" />
                        LOCKED
                      </span>
                    </div>
                    <div className="text-sm font-extrabold text-slate-600">{cur.code}</div>
                    <div className="text-[10px] font-bold text-[#7C3AED] mt-0.5">Coming Soon</div>
                  </div>
                ))}
              </div>
            </div>

            {/* EFADO Reward + Recent Activity 2-Column on Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* EFADO Reward Card */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-purple-200 flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-[#7C3AED] text-xs font-bold">
                    <Gift className="w-3.5 h-3.5" />
                    <span>EFADO Reward</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 m-0">
                    Claim Daily ₦500 Loyalty Bonus
                  </h3>
                  <p className="text-xs text-slate-600 m-0 max-w-none">
                    Rewards are credited straight to your Promo Wallet and appear in your transaction history.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClaimReward}
                  disabled={isClaimingReward}
                  className="w-full py-3 rounded-xl bg-[#7C3AED] hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  {isClaimingReward ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Claiming...</span>
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4" />
                      <span>Claim Now</span>
                    </>
                  )}
                </button>
              </div>

              {/* Recent Activity Preview */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-4 shadow-sm border border-purple-100 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 m-0">
                    Recent Activity
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#7C3AED] hover:underline"
                  >
                    <span>See All</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {recentTransactions.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <p className="text-xs text-slate-500 m-0 max-w-none">
                      No transactions yet. Fund your wallet to see activity here.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('deposit')}
                      className="px-4 py-2 rounded-xl bg-[#16A34A] text-white text-xs font-bold"
                    >
                      Deposit Funds
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-purple-50">
                    {recentTransactions.slice(0, 5).map((tx: any) => {
                      const isIn = ['deposit', 'reward', 'game_win'].includes(String(tx.type || '').toLowerCase());
                      return (
                        <button
                          key={tx.id || tx.reference}
                          type="button"
                          onClick={() => setSelectedReceiptTx(tx)}
                          className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-purple-50/50 rounded-xl px-2 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                isIn
                                  ? 'bg-emerald-50 text-[#16A34A]'
                                  : 'bg-red-50 text-[#DC2626]'
                              }`}
                            >
                              {isIn ? (
                                <ArrowDownCircle className="w-5 h-5" />
                              ) : (
                                <ArrowUpCircle className="w-5 h-5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {tx.purpose || tx.method || tx.type}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate">
                                {tx.reference || 'Wallet Activity'} •{' '}
                                <span className="capitalize">{tx.status || 'completed'}</span>
                              </div>
                            </div>
                          </div>
                          <div
                            className={`text-xs sm:text-sm font-extrabold tabular-nums shrink-0 ${
                              isIn ? 'text-[#16A34A]' : 'text-[#DC2626]'
                            }`}
                          >
                            {isIn ? '+' : '-'}
                            {formatCurrencyAmount(Number(tx.amount || 0), tx.currency || 'NGN')}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================== PAGE 2: MY ACCOUNT PROFILE ===================== */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-purple-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 m-0">
                  My Account Profile
                </h2>
                <p className="text-xs text-slate-500 m-0 max-w-none mt-0.5">
                  Changes are securely encrypted and automatically update your payout bank
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-2xl px-4 py-2.5">
                <div className="text-[10px] font-bold uppercase text-[#7C3AED]">Total Active Balance</div>
                <div className="text-base font-extrabold tabular-nums text-slate-900">
                  {formatBalanceDisplay(totalActiveBalance, 'NGN')}
                </div>
              </div>
            </div>

            {/* Profile Summary Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={profilePhotoURL || '/efado_logo_192.jpg'}
                    alt={profileLegalName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-200"
                  />
                  <label
                    title="Upload Profile Photo"
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#7C3AED] text-white flex items-center justify-center cursor-pointer shadow-sm hover:bg-purple-700"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-extrabold text-slate-900 truncate">
                      {profileLegalName}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[#16A34A] border border-emerald-200 text-[11px] font-bold">
                      <ShieldCheck className="w-3 h-3" />
                      KYC: {profileKycStatus === 'verified' ? 'Verified' : 'Verified Member'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    Alias: <span className="font-bold text-[#7C3AED]">@{profileAlias}</span> •{' '}
                    {profileNationality} • DOB: {profileDob}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {user.email} • {profilePhone || 'Add phone number below'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAvatarPicker((v) => !v)}
                className="self-start sm:self-center px-3 py-2 rounded-xl border border-purple-200 text-xs font-bold text-[#7C3AED] hover:bg-purple-50"
              >
                Choose Badge
              </button>
            </div>

            {showAvatarPicker && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-purple-100 flex items-center gap-3 flex-wrap">
                <span className="text-xs font-bold text-slate-700">Quick Profile Badges:</span>
                {LOCAL_AVATAR_PRESETS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => {
                      setProfilePhotoURL(av.src);
                      setShowAvatarPicker(false);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-purple-100 hover:border-[#7C3AED] text-xs font-semibold text-slate-800"
                  >
                    <img src={av.src} alt={av.label} className="w-7 h-7 rounded-full object-cover" />
                    <span>{av.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* 01 Personal Details */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-purple-100 space-y-4">
              <div className="flex items-center gap-2 border-b border-purple-50 pb-3">
                <span className="px-2.5 py-1 rounded-lg bg-[#7C3AED] text-white text-xs font-extrabold">01</span>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 m-0">
                  Personal Details
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Legal Name</label>
                  <input
                    type="text"
                    value={profileLegalName}
                    onChange={(e) => setProfileLegalName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alias / Handle</label>
                  <input
                    type="text"
                    value={profileAlias}
                    onChange={(e) => setProfileAlias(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={profileDob}
                    onChange={(e) => setProfileDob(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nationality</label>
                  <input
                    type="text"
                    value={profileNationality}
                    onChange={(e) => setProfileNationality(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+234..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={user.email}
                    readOnly
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={profileGender}
                    onChange={(e) => setProfileGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address</label>
                  <input
                    type="text"
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    placeholder="Street, City, State"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bio</label>
                  <textarea
                    rows={2}
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    placeholder="Short bio about you..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
              </div>
            </div>

            {/* 02 Bank For Withdrawal */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-purple-100 space-y-4">
              <div className="flex items-center justify-between border-b border-purple-50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-[#7C3AED] text-white text-xs font-extrabold">02</span>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 m-0">
                    Bank For Withdrawal
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-[#16A34A]">Auto-syncs to Withdraw</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                  <select
                    value={profileBankCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      setProfileBankCode(code);
                      const found = bankDirectory.find((b) => b.code === code) || FLUTTERWAVE_BANKS.find((b) => b.code === code);
                      if (found) setProfileBankName(found.name);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED]"
                  >
                    {(bankDirectory.length > 0 ? bankDirectory : FLUTTERWAVE_BANKS.filter((b) => b.country === 'NG')).map((b) => (
                      <option key={`${b.code}-${b.name}`} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Number ({profileAccountNumberMasked})
                  </label>
                  <input
                    type="text"
                    value={profileAccountNumberInput}
                    onChange={(e) => setProfileAccountNumberInput(e.target.value)}
                    placeholder="Enter 10-digit account number"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-semibold tabular-nums text-slate-900 focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Name</label>
                  <input
                    type="text"
                    value={profileAccountName}
                    onChange={(e) => setProfileAccountName(e.target.value)}
                    placeholder={profileLegalName}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
              </div>
            </div>

            {/* 03 Mobile Money & Crypto Wallets */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-purple-100 space-y-4">
              <div className="flex items-center gap-2 border-b border-purple-50 pb-3">
                <span className="px-2.5 py-1 rounded-lg bg-[#7C3AED] text-white text-xs font-extrabold">03</span>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 m-0">
                  Mobile Money &amp; Crypto Wallets
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Money Network</label>
                  <select
                    value={profileMomoProvider}
                    onChange={(e) => setProfileMomoProvider(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED]"
                  >
                    <option value="MTN">MTN Mobile Money</option>
                    <option value="Airtel">Airtel Money</option>
                    <option value="Vodafone">Telecel / Vodafone Cash</option>
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="Orange">Orange Money</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Merchant Number ({profileMomoMasked})
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={profileMomoInput}
                      onChange={(e) => setProfileMomoInput(e.target.value)}
                      placeholder="e.g. 0803..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-semibold tabular-nums text-slate-900 focus:outline-none focus:border-[#7C3AED]"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(profileMomoMasked, 'Mobile Merchant Number')}
                      className="px-3 rounded-xl border border-purple-200 text-[#7C3AED] hover:bg-purple-50 shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    USDT (TRC20) Address ({profileUsdtMasked})
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={profileUsdtInput}
                      onChange={(e) => setProfileUsdtInput(e.target.value)}
                      placeholder="Enter TRC20 wallet address"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED]"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(profileUsdtMasked, 'USDT Address')}
                      className="px-3 rounded-xl border border-purple-200 text-[#7C3AED] hover:bg-purple-50 shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bitcoin (BTC) Address ({profileBtcMasked})
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={profileBtcInput}
                      onChange={(e) => setProfileBtcInput(e.target.value)}
                      placeholder="Enter BTC wallet address"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED]"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(profileBtcMasked, 'BTC Address')}
                      className="px-3 rounded-xl border border-purple-200 text-[#7C3AED] hover:bg-purple-50 shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs font-semibold text-slate-500 m-0 max-w-none flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Changes are securely encrypted</span>
              </p>
              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#7C3AED] hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save &amp; Synchronize Profile</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ===================== PAGE 3: DEPOSIT FUNDS ===================== */}
        {activeTab === 'deposit' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-purple-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 m-0">
                  Fund Your Account
                </h2>
                <p className="text-xs text-slate-500 m-0 max-w-none mt-0.5">
                  Choose a verified payment method to fund any of your 9 currency pockets
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#16A34A] text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                Secure Payment - Verified
              </span>
            </div>

            {/* Horizontally Scrollable Payment Method Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'paystack', label: 'Paystack', badge: 'Instant' },
                { id: 'bank_transfer', label: 'Direct Bank Deposit', badge: 'Nigeria' },
                { id: 'opay', label: 'OPAY Pay-In', badge: 'Fast' },
                { id: 'flutterwave', label: 'Flutterwave', badge: 'Global' },
                { id: 'diaspora', label: 'Diaspora / Crypto', badge: 'USDT • BTC' }
              ].map((m) => {
                const active = depositMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setDepositMethod(m.id as DepositMethodTab)}
                    className={`shrink-0 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                      active
                        ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-sm'
                        : 'bg-white text-slate-700 border-purple-100 hover:border-purple-300'
                    }`}
                  >
                    <span>{m.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        active ? 'bg-white/20 text-white' : 'bg-purple-50 text-[#7C3AED]'
                      }`}
                    >
                      {m.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {depositMethod === 'paystack' && (
              <PaystackDeposit
                user={user}
                defaultCurrency={depositCurrency}
                onSuccess={async (info) => {
                  await fetchWalletSnapshot();
                  await fetchHistoryAndSecurityData();
                  await onUpdateBalance(info.amount, 'deposit', {
                    currency: info.currency,
                    reference: info.reference,
                    alreadyProcessedByServer: info.alreadyCreditedByServer ?? true
                  }).catch(() => {});
                  showNotice(`Funded ${formatCurrencyAmount(info.amount, info.currency)} safely!`, 'success');
                }}
              />
            )}

            {depositMethod === 'bank_transfer' && (
              <DirectBankDeposit
                user={user}
                onSuccess={async () => {
                  await fetchWalletSnapshot();
                  await fetchHistoryAndSecurityData();
                  showNotice('Bank deposit submitted for verification!', 'success');
                }}
              />
            )}

            {depositMethod === 'opay' && (
              <OpayDeposit
                user={user}
                defaultCurrency={depositCurrency}
                onSuccess={async (info) => {
                  await fetchWalletSnapshot();
                  await fetchHistoryAndSecurityData();
                  showNotice(`OPay funding initialized (${info.reference}).`, 'success');
                }}
              />
            )}

            {depositMethod === 'flutterwave' && (
              <FlutterwaveDeposit
                user={user}
                defaultCurrency={depositCurrency}
                onSuccess={async (info) => {
                  await fetchWalletSnapshot();
                  await fetchHistoryAndSecurityData();
                  await onUpdateBalance(info.amount, 'deposit', {
                    currency: info.currency,
                    reference: info.reference,
                    alreadyProcessedByServer: info.alreadyCreditedByServer ?? true
                  }).catch(() => {});
                  showNotice(`Funded ${formatCurrencyAmount(info.amount, info.currency)} safely!`, 'success');
                }}
              />
            )}

            {depositMethod === 'diaspora' && (
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-purple-100 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 m-0">
                      Diaspora &amp; Crypto Funding
                    </h3>
                    <p className="text-xs text-slate-500 m-0 max-w-none">
                      Send USDT (TRC20), Bitcoin (BTC), or use PayPal for international deposits
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCryptoTabMode('crypto')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                        cryptoTabMode === 'crypto'
                          ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                          : 'bg-white text-slate-700 border-purple-200'
                      }`}
                    >
                      Crypto Transfer
                    </button>
                    <button
                      type="button"
                      onClick={() => setCryptoTabMode('paypal')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                        cryptoTabMode === 'paypal'
                          ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                          : 'bg-white text-slate-700 border-purple-200'
                      }`}
                    >
                      PayPal Global
                    </button>
                  </div>
                </div>

                {cryptoTabMode === 'paypal' ? (
                  <PayPalHostedButton
                    amount={Number(cryptoAmount) || 50}
                    onSuccess={() => {
                      fetchWalletSnapshot();
                      fetchHistoryAndSecurityData();
                    }}
                  />
                ) : (
                  <form onSubmit={handleCryptoSubmit} className="space-y-4">
                    {/* Target Currency Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        Select Target Currency Pocket
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {ACTIVE_WALLET_CURRENCIES.map((cur) => (
                          <button
                            key={cur.code}
                            type="button"
                            onClick={() => setDepositCurrency(cur.code)}
                            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                              depositCurrency === cur.code
                                ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                                : 'bg-white text-slate-700 border-purple-100 hover:border-purple-300'
                            }`}
                          >
                            <span>{cur.flag}</span>
                            <span>{cur.code}</span>
                          </button>
                        ))}
                        {FUTURE_WALLET_CURRENCIES.map((cur) => (
                          <div
                            key={cur.code}
                            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-[11px] font-bold flex items-center justify-center gap-1"
                          >
                            <Lock className="w-3 h-3" />
                            <span>{cur.code} LOCKED</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Network Selector */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(['USDT (TRC20)', 'Bitcoin (BTC)'] as const).map((net) => {
                        const info = net === 'USDT (TRC20)' ? CRYPTO_DEPOSIT_WALLETS.usdt : CRYPTO_DEPOSIT_WALLETS.btc;
                        const active = cryptoNetwork === net;
                        return (
                          <button
                            key={net}
                            type="button"
                            onClick={() => setCryptoNetwork(net)}
                            className={`p-3.5 rounded-2xl border text-left transition-all ${
                              active
                                ? 'border-[#7C3AED] bg-purple-50/70'
                                : 'border-purple-100 bg-white hover:border-purple-300'
                            }`}
                          >
                            <div className="text-xs font-extrabold text-slate-900">{info.label}</div>
                            <div className="text-[11px] text-slate-500 font-mono truncate mt-1">{info.address}</div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-[#7C3AED] uppercase">
                          Official {cryptoNetwork} Deposit Address
                        </div>
                        <div className="text-xs sm:text-sm font-mono font-bold text-slate-900 break-all mt-0.5">
                          {cryptoNetwork === 'USDT (TRC20)'
                            ? CRYPTO_DEPOSIT_WALLETS.usdt.address
                            : CRYPTO_DEPOSIT_WALLETS.btc.address}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            cryptoNetwork === 'USDT (TRC20)'
                              ? CRYPTO_DEPOSIT_WALLETS.usdt.address
                              : CRYPTO_DEPOSIT_WALLETS.btc.address,
                            `${cryptoNetwork} Address`
                          )
                        }
                        className="px-3 py-2 rounded-xl bg-white border border-purple-200 text-[#7C3AED] text-xs font-bold shrink-0"
                      >
                        Copy
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Amount ({depositCurrency})
                        </label>
                        <input
                          type="number"
                          min={getMinDepositForCurrency(depositCurrency)}
                          step="any"
                          value={cryptoAmount}
                          onChange={(e) => setCryptoAmount(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-extrabold tabular-nums text-slate-900 focus:outline-none focus:border-[#7C3AED]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Transaction Hash (TxID)
                        </label>
                        <input
                          type="text"
                          value={cryptoTxHash}
                          onChange={(e) => setCryptoTxHash(e.target.value)}
                          placeholder="Paste blockchain TxID"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED]"
                          required
                        />
                      </div>
                    </div>

                    {cryptoStatusMessage && (
                      <div
                        className={`p-3 rounded-xl border text-xs font-bold ${
                          cryptoStatusMessage.type === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-[#16A34A]'
                            : 'bg-red-50 border-red-200 text-[#DC2626]'
                        }`}
                      >
                        {cryptoStatusMessage.text}
                      </div>
                    )}

                    <div className="sticky bottom-2 z-10 sm:static">
                      <button
                        type="submit"
                        disabled={isSubmittingCrypto}
                        className="w-full py-3.5 rounded-xl bg-[#16A34A] hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
                      >
                        {isSubmittingCrypto ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <span>
                            FUND {depositCurrency} POCKET{' '}
                            {formatCurrencyAmount(Number(cryptoAmount) || 0, depositCurrency)}
                          </span>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            <SecurityGuard level="high" />
          </div>
        )}

        {/* ===================== PAGE 4: WITHDRAW FUNDS ===================== */}
        {activeTab === 'withdraw' && (
          <div className="space-y-4">
            {/* Header + Irreversible Warning */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-purple-100 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 m-0">
                    Withdraw Funds
                  </h2>
                  <p className="text-xs text-slate-500 m-0 max-w-none mt-0.5">
                    External Bank Cash Out • Real-time bank verification enabled
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#16A34A] text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  Protected by 256-bit encryption
                </span>
              </div>

              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Check details carefully before confirming withdrawal - Transfers are irreversible</span>
              </div>
            </div>

            {/* Cyber Shield Toggles */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-purple-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                <div>
                  <div className="text-xs font-extrabold text-slate-900">OPAY Payment Shield</div>
                  <div className="text-[11px] text-slate-500">Extra check on newly added bank accounts</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleShield('opayShieldEnabled')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors ${
                    opayShieldEnabled ? 'bg-[#16A34A] text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {opayShieldEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                <div>
                  <div className="text-xs font-extrabold text-slate-900">Night Safe Sentry 10PM-6AM</div>
                  <div className="text-[11px] text-slate-500">6-digit approval for large night transfers</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleShield('nightSafeEnabled')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors ${
                    nightSafeEnabled ? 'bg-[#16A34A] text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {nightSafeEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left Column: Destination Bank & Verification */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-purple-100 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 m-0">
                    Destination Bank Account
                  </h3>
                  <button
                    type="button"
                    onClick={handleUseSavedBank}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C3AED] border border-purple-200 text-xs font-bold transition-colors"
                  >
                    Use My Saved Bank
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Destination Country</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {COUNTRY_LIST.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setWithdrawCountry(c.code);
                          setWdIsVerified(false);
                          setWdVerifiedName('');
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 ${
                          withdrawCountry === c.code
                            ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                            : 'bg-white text-slate-700 border-purple-100'
                        }`}
                      >
                        <span>{c.flag}</span>
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Bank</label>
                  <select
                    value={wdBankCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      setWdBankCode(code);
                      const found = bankDirectory.find((b) => b.code === code);
                      if (found) setWdBankName(found.name);
                      setWdUseSavedBank(false);
                      setWdIsVerified(false);
                      setWdVerifiedName('');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED]"
                  >
                    {bankDirectory.map((b) => (
                      <option key={`${b.code}-${b.name}`} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Number</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={wdAccountNumber}
                      onChange={(e) => {
                        setWdAccountNumber(e.target.value);
                        setWdUseSavedBank(false);
                        setWdIsVerified(false);
                        setWdVerifiedName('');
                        setWdNameMismatchError(null);
                      }}
                      placeholder="Enter 10-digit account number"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-bold tabular-nums text-slate-900 focus:outline-none focus:border-[#7C3AED]"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyBankAccount}
                      disabled={isVerifyingBank}
                      className="px-4 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shrink-0 transition-colors"
                    >
                      {isVerifyingBank ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Checking...</span>
                        </>
                      ) : (
                        <span>Verify Bank Account</span>
                      )}
                    </button>
                  </div>
                </div>

                {wdVerifyError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs font-bold">
                    {wdVerifyError}
                  </div>
                )}

                {wdNameMismatchError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs font-bold flex items-center gap-2">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>{wdNameMismatchError}</span>
                  </div>
                )}

                {/* Beneficiary Preview Card */}
                <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 uppercase">
                      Beneficiary Preview
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                        wdIsVerified
                          ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                          : 'bg-purple-100 text-[#7C3AED]'
                      }`}
                    >
                      {wdIsVerified ? 'VERIFIED' : 'PENDING VERIFY'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">BANK</div>
                      <div className="font-bold text-slate-900 truncate">{wdBankName || '—'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">GATEWAY</div>
                      <div className="font-bold text-slate-900 uppercase">{wdGateway}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">ACCOUNT NUMBER</div>
                      <div className="font-bold tabular-nums text-slate-900">
                        {wdAccountNumber ? maskNumberForDisplay(wdAccountNumber) : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">REAL ACCOUNT NAME</div>
                      <div className="font-extrabold text-[#16A34A] truncate">
                        {wdVerifiedName || 'Verify bank to confirm'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Source Pocket, Amount, Gateways & Sticky Confirm */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-purple-100 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Select Source Pocket
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'playerWallet', label: 'WINS', bal: playerWallet },
                      { id: 'cashOutWallet', label: 'CASHOUT', bal: cashOutWallet },
                      { id: 'depositWallet', label: 'DEPOSIT POCKET', bal: mainWallet }
                    ].map((src) => {
                      const active = wdSourceWallet === src.id;
                      return (
                        <button
                          key={src.id}
                          type="button"
                          onClick={() => setWdSourceWallet(src.id as any)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            active
                              ? 'border-[#7C3AED] bg-purple-50'
                              : 'border-purple-100 bg-white hover:border-purple-300'
                          }`}
                        >
                          <div className="text-[10px] font-extrabold text-[#7C3AED] truncate">{src.label}</div>
                          <div className="text-xs font-extrabold tabular-nums text-slate-900 mt-0.5 truncate">
                            {formatBalanceDisplay(src.bal, 'NGN')}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs bg-purple-50/50 border border-purple-100 rounded-xl px-3.5 py-2.5">
                  <span className="font-semibold text-slate-600">Available Balance</span>
                  <span className="font-extrabold tabular-nums text-slate-900">
                    {formatBalanceDisplay(wdAvailableBalance, 'NGN')}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Withdrawal Amount (₦)
                  </label>
                  <input
                    type="number"
                    min={100}
                    value={wdAmount}
                    onChange={(e) => setWdAmount(e.target.value)}
                    placeholder="Enter amount (min ₦100)"
                    className="w-full px-3.5 py-3 rounded-xl border border-purple-200 bg-white text-lg font-extrabold tabular-nums text-slate-900 focus:outline-none focus:border-[#7C3AED]"
                  />
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {[0.25, 0.5, 0.75, 1].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          const maxNet = Math.max(0, Math.floor((wdAvailableBalance - wdFee) * pct));
                          setWdAmount(String(maxNet));
                        }}
                        className="py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-xs font-extrabold"
                      >
                        {pct * 100}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gateway Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Payout Gateway</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setWdGateway('paystack')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold transition-all ${
                        wdGateway === 'paystack'
                          ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                          : 'bg-white text-slate-700 border-purple-100'
                      }`}
                    >
                      PAYSTACK PAYOUT
                    </button>
                    <button
                      type="button"
                      onClick={() => setWdGateway('flutterwave')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold transition-all ${
                        wdGateway === 'flutterwave'
                          ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                          : 'bg-white text-slate-700 border-purple-100'
                      }`}
                    >
                      FLUTTERWAVE PAYOUT
                    </button>
                  </div>
                </div>

                {/* Fee Line */}
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs font-bold text-[#16A34A]">
                  Fee {formatCurrencyAmount(wdFee, 'NGN')} — You will receive{' '}
                  <span className="tabular-nums">{formatCurrencyAmount(wdParsedAmount, 'NGN')}</span> — Arrives in 1-5 mins
                </div>

                {wdStatusMessage && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-bold ${
                      wdStatusMessage.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-[#16A34A]'
                        : 'bg-red-50 border-red-200 text-[#DC2626]'
                    }`}
                  >
                    {wdStatusMessage.text}
                  </div>
                )}

                {/* Sticky Mobile Confirm Withdraw CTA (GREY & DISABLED until verified & valid) */}
                <div className="sticky bottom-2 z-10 sm:static">
                  <button
                    type="button"
                    onClick={handleStartWithdraw}
                    disabled={!canConfirmWithdraw}
                    className={`w-full py-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-colors shadow-md ${
                      canConfirmWithdraw
                        ? 'bg-[#16A34A] hover:bg-emerald-700 text-white cursor-pointer'
                        : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    <span>
                      CONFIRM WITHDRAW{' '}
                      {wdParsedAmount > 0 ? formatCurrencyAmount(wdParsedAmount, 'NGN') : ''}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== PAGE 5: HISTORY & SECURITY ===================== */}
        {isHistoryOrSecurityTab && (
          <div className="space-y-6">
            {/* History Section */}
            <TransactionHistory user={user} onFundAccount={() => setActiveTab('deposit')} />

            {/* Security & Payment Methods Section */}
            <div ref={securitySectionRef} className="space-y-5">
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-purple-100 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-50 pb-3">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 m-0">
                      Security &amp; Protection
                    </h2>
                    <p className="text-xs text-slate-500 m-0 max-w-none">
                      Manage 2FA, Transaction PIN, Biometric confirmation &amp; active devices
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-[#16A34A] border border-emerald-200 text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Your money is safe
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Two-Factor Authentication */}
                  <div className="p-4 rounded-2xl border border-purple-100 bg-purple-50/40 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">
                        Two-Factor Authentication
                      </div>
                      <div className="text-xs text-slate-600">Required for withdrawals</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggle2FA}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-colors shrink-0 ${
                        twoFactorEnabled
                          ? 'bg-[#16A34A] text-white'
                          : 'bg-[#7C3AED] text-white'
                      }`}
                    >
                      {twoFactorEnabled ? 'Enabled' : 'Enable 2FA'}
                    </button>
                  </div>

                  {/* Transaction PIN */}
                  <div className="p-4 rounded-2xl border border-purple-100 bg-purple-50/40 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">Transaction PIN</div>
                      <div className="text-xs text-slate-600">
                        {hasTransactionPin ? '4-digit PIN is active' : 'Create a 4-digit PIN'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPinSetupError(null);
                        setShowPinSetupModal(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-extrabold shrink-0"
                    >
                      {hasTransactionPin ? 'Change PIN' : 'Set PIN'}
                    </button>
                  </div>

                  {/* End-to-End Encryption */}
                  <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">End-to-End Encryption</div>
                      <div className="text-xs text-slate-600">Enabled — Protecting payment data</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-[#16A34A] text-white text-xs font-extrabold shrink-0">
                      Enabled
                    </span>
                  </div>

                  {/* Regular Backups */}
                  <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">Regular Backups</div>
                      <div className="text-xs text-slate-600">Daily automated backups</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-[#16A34A] text-white text-xs font-extrabold shrink-0">
                      Active
                    </span>
                  </div>

                  {/* Biometric Confirmation */}
                  <div className="md:col-span-2 p-4 rounded-2xl border border-purple-100 bg-white flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center shrink-0">
                        <Fingerprint className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-slate-900">
                          Biometric Confirmation
                        </div>
                        <div className="text-xs text-slate-500">
                          Quick fingerprint / device verification check when available
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleBiometric}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-colors shrink-0 ${
                        biometricEnabled ? 'bg-[#16A34A] text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {biometricEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Login History + Saved Payment Methods */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Login History */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-purple-100 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-extrabold text-slate-900 m-0">Login History</h3>
                    <button
                      type="button"
                      onClick={handleLogoutAllDevices}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#DC2626] border border-red-200 text-xs font-bold transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log out all other devices</span>
                    </button>
                  </div>

                  <div className="divide-y divide-purple-50">
                    {loginHistory.length === 0 ? (
                      <p className="text-xs text-slate-500 m-0 max-w-none py-4">
                        Active browser session verified.
                      </p>
                    ) : (
                      loginHistory.slice(0, 6).map((log) => {
                        const dt = log.createdAtIso ? new Date(log.createdAtIso) : new Date();
                        return (
                          <div key={log.id} className="py-2.5 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {log.description || log.eventType || 'Wallet Session'}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate">
                                {log.device || 'Web Browser'} • {log.city || 'Protected Location'}
                              </div>
                            </div>
                            <div className="text-[11px] font-semibold text-slate-500 shrink-0 text-right">
                              <div>{dt.toLocaleDateString()}</div>
                              <div>{dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Saved Payment Methods */}
                <div
                  ref={paymentMethodsRef}
                  className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-purple-100 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-extrabold text-slate-900 m-0">
                      Payment Methods
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAddMethodForm((v) => !v)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-bold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Method</span>
                    </button>
                  </div>

                  {showAddMethodForm && (
                    <form
                      onSubmit={handleAddPaymentMethod}
                      className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <select
                          value={newMethodType}
                          onChange={(e) => setNewMethodType(e.target.value as any)}
                          className="px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-bold text-slate-900"
                        >
                          <option value="bank_transfer">Bank Account</option>
                          <option value="credit_card">Debit / Credit Card</option>
                          <option value="crypto">Crypto Wallet (BTC / USDT)</option>
                          <option value="mobile_money">Mobile Money</option>
                        </select>
                        <input
                          type="text"
                          value={newMethodName}
                          onChange={(e) => setNewMethodName(e.target.value)}
                          placeholder="Label (e.g. First Bank / Visa)"
                          className="px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-semibold text-slate-900"
                          required
                        />
                      </div>
                      <input
                        type="text"
                        value={newMethodDetails}
                        onChange={(e) => setNewMethodDetails(e.target.value)}
                        placeholder="Account Number, Card Number, or Wallet Address"
                        className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-semibold text-slate-900"
                        required
                      />
                      {newMethodType === 'crypto' && (
                        <input
                          type="text"
                          value={newMethodNetwork}
                          onChange={(e) => setNewMethodNetwork(e.target.value)}
                          placeholder="Network (e.g. TRC20, Bitcoin)"
                          className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-semibold text-slate-900"
                        />
                      )}
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddMethodForm(false)}
                          className="px-3 py-1.5 rounded-xl border border-purple-200 bg-white text-xs font-bold text-slate-600"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isAddingMethod}
                          className="px-4 py-1.5 rounded-xl bg-[#16A34A] text-white text-xs font-extrabold"
                        >
                          {isAddingMethod ? 'Saving...' : 'Save Method'}
                        </button>
                      </div>
                    </form>
                  )}

                  {paymentMethods.length === 0 ? (
                    <p className="text-xs text-slate-500 m-0 max-w-none py-4">
                      No saved payment methods yet. Add a bank, card, or wallet above.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {paymentMethods.map((pm) => (
                        <div
                          key={pm.id}
                          className="p-3 rounded-xl border border-purple-100 bg-purple-50/30 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-white border border-purple-200 text-[#7C3AED] flex items-center justify-center shrink-0">
                              {pm.type === 'crypto' ? (
                                <Bitcoin className="w-4 h-4" />
                              ) : pm.type === 'credit_card' ? (
                                <CreditCard className="w-4 h-4" />
                              ) : (
                                <Building2 className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-extrabold text-slate-900 truncate">{pm.name}</div>
                              <div className="text-[11px] font-bold tabular-nums text-slate-500 truncate">
                                {pm.details}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRequestRemoveMethod(pm.id)}
                            className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#DC2626] text-xs font-bold border border-red-200 shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Persistent Mobile Bottom Navigation (Home / Cards / Activity / Profile) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-purple-100 shadow-lg sm:hidden">
        <div className="grid grid-cols-4 h-16 max-w-[1200px] mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${
              activeTab === 'overview' ? 'text-[#7C3AED]' : 'text-slate-500'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              setTimeout(() => {
                paymentMethodsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 120);
            }}
            className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold text-slate-500 hover:text-[#7C3AED]"
          >
            <CreditCard className="w-5 h-5" />
            <span>Cards</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${
              isHistoryOrSecurityTab ? 'text-[#7C3AED]' : 'text-slate-500'
            }`}
          >
            <History className="w-5 h-5" />
            <span>Activity</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${
              activeTab === 'profile' ? 'text-[#7C3AED]' : 'text-slate-500'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span>Profile</span>
          </button>
        </div>
      </div>

      {/* ===================== CURRENCY SWAP MODAL ===================== */}
      <AnimatePresence>
        {showSwapModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1050] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowSwapModal(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-2xl p-5 sm:p-6 shadow-xl border border-purple-200 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 m-0">Currency Swap</h3>
                    <p className="text-xs text-slate-500 m-0 max-w-none">Live exchange rates</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSwapModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleExecuteSwap} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">From Pocket</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={swapSourceWallet}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setSwapSourceWallet(val);
                        if (val !== 'depositWallet') setSwapFromCurrency('NGN');
                      }}
                      className="px-3 py-2.5 rounded-xl border border-purple-200 bg-white text-xs font-bold text-slate-900"
                    >
                      <option value="depositWallet">Currency Pocket</option>
                      <option value="cashOutWallet">Cash Out Wallet</option>
                      <option value="playerWallet">Main / Wins</option>
                      <option value="promoWallet">Promo Wallet</option>
                    </select>

                    <select
                      value={swapFromCurrency}
                      disabled={swapSourceWallet !== 'depositWallet'}
                      onChange={(e) => setSwapFromCurrency(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-purple-200 bg-white text-xs font-bold text-slate-900 disabled:bg-slate-50"
                    >
                      {ACTIVE_WALLET_CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">To Pocket</label>
                  <select
                    value={swapToCurrency}
                    onChange={(e) => setSwapToCurrency(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-bold text-slate-900"
                  >
                    {ACTIVE_WALLET_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount to Swap ({swapFromCurrency})
                  </label>
                  <input
                    type="number"
                    min={1}
                    step="any"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-base font-extrabold tabular-nums text-slate-900"
                    required
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 space-y-1">
                  {isLoadingSwapRate ? (
                    <div className="text-xs font-bold text-[#7C3AED] flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Fetching live rate...</span>
                    </div>
                  ) : swapQuote ? (
                    <>
                      <div className="flex justify-between text-xs font-semibold text-slate-600">
                        <span>Live Rate</span>
                        <span className="font-bold text-slate-900 tabular-nums">
                          1 {swapFromCurrency} = {swapQuote.rate} {swapToCurrency}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold text-slate-600">
                        <span>Conversion Fee ({swapQuote.feePercent ?? 5}%)</span>
                        <span className="tabular-nums">
                          {formatCurrencyAmount(swapQuote.feeAmount, swapFromCurrency)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-extrabold text-[#16A34A] pt-1 border-t border-purple-200">
                        <span>You Receive</span>
                        <span className="tabular-nums">
                          {formatCurrencyAmount(swapQuote.receiveAmount, swapToCurrency)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-slate-500">Enter an amount to preview rate.</div>
                  )}
                </div>

                {swapError && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs font-bold">
                    {swapError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isExecutingSwap}
                  className="w-full py-3.5 rounded-xl bg-[#7C3AED] hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-500 text-white font-extrabold text-sm flex items-center justify-center gap-2"
                >
                  {isExecutingSwap ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Converting...</span>
                    </>
                  ) : (
                    <span>Confirm Instant Swap</span>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================== SET / CHANGE PIN MODAL ===================== */}
      <AnimatePresence>
        {showPinSetupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1060] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowPinSetupModal(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl border border-purple-200 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900 m-0">
                  {hasTransactionPin ? 'Change Transaction PIN' : 'Set 4-Digit Transaction PIN'}
                </h3>
                <button type="button" onClick={() => setShowPinSetupModal(false)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveTransactionPin} className="space-y-3">
                {hasTransactionPin && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Current 4-Digit PIN</label>
                    <input
                      type="password"
                      maxLength={4}
                      inputMode="numeric"
                      value={currentPinInput}
                      onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-center text-lg font-extrabold tracking-widest"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New 4-Digit PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-center text-lg font-extrabold tracking-widest"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Confirm 4-Digit PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-center text-lg font-extrabold tracking-widest"
                    required
                  />
                </div>
                {pinSetupError && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs font-bold">
                    {pinSetupError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isSavingPin}
                  className="w-full py-3 rounded-xl bg-[#7C3AED] hover:bg-purple-700 text-white font-extrabold text-sm"
                >
                  {isSavingPin ? 'Saving PIN...' : 'Save Transaction PIN'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================== 2FA OTP CONFIRM MODAL ===================== */}
      <AnimatePresence>
        {show2faModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1060] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShow2faModal(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl border border-purple-200 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900 m-0">
                  Verify 6-Digit Security Code
                </h3>
                <button type="button" onClick={() => setShow2faModal(false)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-600 m-0 max-w-none">
                Enter the 6-digit verification code sent via SMS / Email to{' '}
                {pending2faTargetState ? 'enable' : 'disable'} Two-Factor Authentication.
              </p>
              {twoFaOtpDelivery && (
                <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs font-semibold text-[#7C3AED]">
                  {twoFaOtpDelivery}
                </div>
              )}
              <form onSubmit={handleConfirm2faOtp} className="space-y-3">
                <input
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  value={twoFaOtpCode}
                  onChange={(e) => setTwoFaOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-center text-lg font-extrabold tracking-widest tabular-nums"
                  required
                />
                {twoFaError && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs font-bold">
                    {twoFaError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isVerifying2fa}
                  className="w-full py-3 rounded-xl bg-[#16A34A] text-white font-extrabold text-sm"
                >
                  {isVerifying2fa ? 'Verifying...' : 'Confirm Code'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PIN / OTP Verification Modal for Withdraw & Remove Method */}
      <TransactionPinModal
        isOpen={pinModalOpen}
        onClose={() => {
          wdIdempotencyKeyRef.current = '';
          setPinModalOpen(false);
          setPinModalError(null);
        }}
        onConfirm={handlePinModalConfirm}
        amount={pinModalContext === 'withdraw' ? wdParsedAmount : 0}
        action={pinModalContext === 'withdraw' ? 'Confirm Bank Withdrawal' : 'Remove Saved Payment Method'}
        currencySymbol="₦"
        subtitle={
          pinModalContext === 'withdraw'
            ? `Sending to ${wdVerifiedName} (${wdBankName})`
            : 'Enter your 4-digit Transaction PIN to remove this method'
        }
        errorMessage={pinModalError}
        isSubmitting={pinModalSubmitting}
        requiresOtp={pinModalRequiresOtp}
        otpDeliveryNotice={pinModalOtpDelivery}
      />

      {selectedReceiptTx && (
        <StrategicReceipt
          transaction={selectedReceiptTx}
          onClose={() => setSelectedReceiptTx(null)}
        />
      )}

      <PaymentGuidelinesModal
        isOpen={showGuidelinesModal}
        onClose={() => setShowGuidelinesModal(false)}
      />
    </div>
  );
};
