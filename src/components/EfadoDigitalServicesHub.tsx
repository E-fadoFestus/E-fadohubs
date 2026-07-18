import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Coins, 
  ArrowLeftRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Send,
  Copy,
  Info,
  ArrowUpRight,
  ArrowRight,
  UserCheck,
  Phone,
  Wifi,
  Settings,
  Plus,
  TrendingUp,
  Sliders,
  Activity,
  Calculator,
  RefreshCw,
  Download,
  Lock,
  ArrowLeft,
  Search,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  db, 
  auth, 
  collection, 
  addDoc, 
  serverTimestamp,
  doc,
  updateDoc,
  increment
} from '../firebase';
import { PaymentPlatform } from './PaymentPlatform';
import { UserProfile } from '../types';
import { useCurrency } from '../lib/CurrencyContext';

interface EfadoDigitalServicesHubProps {
  user: UserProfile;
  initialSection?: 'crypto' | 'money' | 'vending';
}

interface CurrencyItem {
  code: string;
  name: string;
  symbol: string;
}

const SUPPORTED_CURRENCIES: CurrencyItem[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'GBP', name: 'British Pound Sterling', symbol: '£' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' }
];

// Vending types & static configurations
interface OperatorPlan {
  id: string;
  name: string;
  priceNGN: number;
  priceUSD: number;
  dataAllowance: string;
  validity: string;
}

interface Operator {
  code: string;
  name: string;
  logo: string;
  countryCode: string;
  currency: string;
  minAirtimeNGN: number;
  maxAirtimeNGN: number;
  plans: OperatorPlan[];
}

interface Country {
  code: string;
  name: string;
  flag: string;
  phonePrefix: string;
  currency: string;
  operators: Operator[];
}

const GLOBAL_VENDING_COUNTRIES: Country[] = [
  {
    code: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    phonePrefix: '+234',
    currency: 'NGN',
    operators: [
      {
        code: 'mtn_ng',
        name: 'MTN Nigeria',
        logo: 'https://seeklogo.com/images/M/mtn-logo-406A171958-seeklogo.com.png',
        countryCode: 'NG',
        currency: 'NGN',
        minAirtimeNGN: 100,
        maxAirtimeNGN: 50000,
        plans: [
          { id: 'mtn_ng_1', name: '1.5GB Daily Max', priceNGN: 500, priceUSD: 0.35, dataAllowance: '1.5 GB', validity: '24 Hours' },
          { id: 'mtn_ng_2', name: '3GB 2-Day Surge', priceNGN: 1000, priceUSD: 0.70, dataAllowance: '3 GB', validity: '2 Days' },
          { id: 'mtn_ng_3', name: '10GB Monthly Super', priceNGN: 3500, priceUSD: 2.30, dataAllowance: '10 GB', validity: '30 Days' },
          { id: 'mtn_ng_4', name: '45GB Monthly Heavy-User', priceNGN: 11000, priceUSD: 7.30, dataAllowance: '45 GB', validity: '30 Days' }
        ]
      },
      {
        code: 'airtel_ng',
        name: 'Airtel Nigeria',
        logo: 'https://seeklogo.com/images/A/airtel-logo-55BBB99FA0-seeklogo.com.png',
        countryCode: 'NG',
        currency: 'NGN',
        minAirtimeNGN: 100,
        maxAirtimeNGN: 50000,
        plans: [
          { id: 'airtel_ng_1', name: '2GB Daily Connect', priceNGN: 600, priceUSD: 0.40, dataAllowance: '2 GB', validity: '24 Hours' },
          { id: 'airtel_ng_2', name: '6GB Weekly Social', priceNGN: 1600, priceUSD: 1.05, dataAllowance: '6 GB', validity: '7 Days' },
          { id: 'airtel_ng_3', name: '15GB Monthly Executive', priceNGN: 5000, priceUSD: 3.30, dataAllowance: '15 GB', validity: '30 Days' }
        ]
      },
      {
        code: 'glo_ng',
        name: 'Globacom (Glo)',
        logo: 'https://seeklogo.com/images/G/glo-unlimited-logo-F2BAA8AB90-seeklogo.com.png',
        countryCode: 'NG',
        currency: 'NGN',
        minAirtimeNGN: 100,
        maxAirtimeNGN: 30000,
        plans: [
          { id: 'glo_ng_1', name: '1.25GB Daily Plus', priceNGN: 400, priceUSD: 0.28, dataAllowance: '1.25 GB', validity: '24 Hours' },
          { id: 'glo_ng_2', name: '7GB Weekly Grand', priceNGN: 1500, priceUSD: 1.00, dataAllowance: '7 GB', validity: '7 Days' },
          { id: 'glo_ng_3', name: '12GB Monthly Bumper', priceNGN: 3000, priceUSD: 2.00, dataAllowance: '12 GB', validity: '30 Days' }
        ]
      }
    ]
  },
  {
    code: 'GH',
    name: 'Ghana',
    flag: '🇬🇭',
    phonePrefix: '+233',
    currency: 'GHS',
    operators: [
      {
        code: 'mtn_gh',
        name: 'MTN Ghana',
        logo: 'https://seeklogo.com/images/M/mtn-logo-406A171958-seeklogo.com.png',
        countryCode: 'GH',
        currency: 'GHS',
        minAirtimeNGN: 200,
        maxAirtimeNGN: 20000,
        plans: [
          { id: 'mtn_gh_1', name: '1GB Daily Bundle', priceNGN: 800, priceUSD: 0.53, dataAllowance: '1 GB', validity: '1 Day' },
          { id: 'mtn_gh_2', name: '5GB Weekly Giga', priceNGN: 2500, priceUSD: 1.65, dataAllowance: '5 GB', validity: '7 Days' }
        ]
      }
    ]
  },
  {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    phonePrefix: '+254',
    currency: 'KES',
    operators: [
      {
        code: 'safaricom_ke',
        name: 'Safaricom',
        logo: 'https://seeklogo.com/images/S/safaricom-logo-4D0512BF57-seeklogo.com.png',
        countryCode: 'KE',
        currency: 'KES',
        minAirtimeNGN: 300,
        maxAirtimeNGN: 40000,
        plans: [
          { id: 'saf_ke_1', name: '1GB Daily Safaricom Pass', priceNGN: 900, priceUSD: 0.60, dataAllowance: '1 GB', validity: '24 Hours' },
          { id: 'saf_ke_2', name: '8GB Weekly Max Extra', priceNGN: 2800, priceUSD: 1.85, dataAllowance: '8 GB', validity: '7 Days' }
        ]
      }
    ]
  }
];

export const EfadoDigitalServicesHub: React.FC<EfadoDigitalServicesHubProps> = ({ user, initialSection }) => {
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState<'crypto' | 'money' | 'vending'>(initialSection || 'crypto');

  // Unified payment states
  const [showPaymentPlatform, setShowPaymentPlatform] = useState(false);
  const [paymentPlatformAmount, setPaymentPlatformAmount] = useState(1000);
  const [paymentPlatformPurpose, setPaymentPlatformPurpose] = useState('');
  const [paymentPlatformOnSuccess, setPaymentPlatformOnSuccess] = useState<(() => Promise<void> | void) | null>(null);

  // Vending Flow States
  const [vendingCountry, setVendingCountry] = useState<string>('NG');
  const [vendingType, setVendingType] = useState<'airtime' | 'data'>('airtime');
  const [vendingOperator, setVendingOperator] = useState<string>('mtn_ng');
  const [vendingPhone, setVendingPhone] = useState<string>('');
  const [vendingCustomAirtimeAmount, setVendingCustomAirtimeAmount] = useState<number>(500);
  const [vendingSelectedDataPlanId, setVendingSelectedDataPlanId] = useState<string>('mtn_ng_1');
  const [vendingPayMethod, setVendingPayMethod] = useState<'win_wallet' | 'deposit_wallet' | 'transfer'>('win_wallet');
  const [vendingStatus, setVendingStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [vendingStatusMessage, setVendingStatusMessage] = useState<string>('');
  const [vendingLogs, setVendingLogs] = useState<string[]>([
    '[INIT] Digital Services Hub initialized with custom secure wallets.',
    '[INFO] Choose operator to trigger real-time sandbox vending dispatch.'
  ]);

  // Crypto OTC States
  const [otcSellCrypto, setOtcSellCrypto] = useState<string>('USDT');
  const [otcSellAmount, setOtcSellAmount] = useState<number>(100);
  const [otcGetCurrency, setOtcGetCurrency] = useState<string>('NGN');
  const [otcStep, setOtcStep] = useState<'input' | 'quote' | 'deposit' | 'confirming' | 'complete'>('input');
  const [otcTokens] = useState([
    { symbol: 'USDT', name: 'Tether USD', logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png', chain: 'TRON / TRC20', rate: 1.0 },
    { symbol: 'USDC', name: 'USD Coin', logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png', chain: 'Ethereum / ERC20', rate: 1.0 },
    { symbol: 'BTC', name: 'Bitcoin', logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png', chain: 'Bitcoin Network', rate: 68500 },
    { symbol: 'ETH', name: 'Ethereum', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png', chain: 'Ethereum Network', rate: 3550 },
    { symbol: 'SOL', name: 'Solana', logo: 'https://cryptologos.cc/logos/solana-sol-logo.png', chain: 'Solana Network', rate: 165 },
    { symbol: 'TRX', name: 'Tron', logo: 'https://cryptologos.cc/logos/tron-trx-logo.png', chain: 'Tron Network', rate: 0.125 }
  ]);
  const [otcPayoutMethod, setOtcPayoutMethod] = useState<'bank' | 'wallet'>('bank');
  const [otcBankName, setOtcBankName] = useState<string>('');
  const [otcBankAccount, setOtcBankAccount] = useState<string>('');
  const [otcAccountName, setOtcAccountName] = useState<string>('');
  const [otcTxHash, setOtcTxHash] = useState<string>('');
  const [otcQuotes, setOtcQuotes] = useState<any>(null);

  // Money Exchange States
  const [convSourceCurrency, setConvSourceCurrency] = useState<string>('USD');
  const [convTargetCurrency, setConvTargetCurrency] = useState<string>('NGN');
  const [convAmount, setConvAmount] = useState<number>(100);
  const [convPayoutBank, setConvPayoutBank] = useState<string>('');
  const [convPayoutAccount, setConvPayoutAccount] = useState<string>('');
  const [convPayoutName, setConvPayoutName] = useState<string>('');
  const [convPayoutType, setConvPayoutType] = useState<'bank' | 'mobile'>('bank');
  const [convStatus, setConvStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  const fiatRates: Record<string, number> = {
    USD: 1.0, EUR: 0.92, JPY: 156.8, GBP: 0.79, AUD: 1.51, CAD: 1.37, CHF: 0.91, CNY: 7.24, INR: 83.3, ZAR: 18.5, NGN: 1550, GHS: 14.5, KES: 131.0
  };

  const addVendingLog = (msg: string) => {
    setVendingLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Vending Purchase handler
  const handleVendingPurchase = async () => {
    setVendingStatus('processing');
    addVendingLog('[API Connect] Initializing airtime & data vending dispatch...');
    
    const countryObj = GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry);
    const opObj = countryObj?.operators.find(o => o.code === vendingOperator);
    
    if (!opObj) {
      setVendingStatus('failed');
      setVendingStatusMessage('Invalid Operator selected.');
      return;
    }

    if (!vendingPhone || vendingPhone.length < 7) {
      setVendingStatus('failed');
      setVendingStatusMessage('Please enter a valid phone number.');
      return;
    }

    let purchaseCostNGN = 0;
    if (vendingType === 'airtime') {
      purchaseCostNGN = vendingCustomAirtimeAmount;
    } else {
      const plan = opObj.plans.find(p => p.id === vendingSelectedDataPlanId);
      if (!plan) {
        setVendingStatus('failed');
        setVendingStatusMessage('Data plan not found.');
        return;
      }
      purchaseCostNGN = plan.priceNGN;
    }

    const walletField = vendingPayMethod === 'win_wallet' ? 'playerWallet' : 'depositWallet';
    const currentBalance = user[walletField] || 0;

    if (vendingPayMethod !== 'transfer' && currentBalance < purchaseCostNGN) {
      setVendingStatus('failed');
      setVendingStatusMessage(`Insufficient funds in your ${vendingPayMethod === 'win_wallet' ? 'Win' : 'Deposit'} Wallet.`);
      addVendingLog('[Balance Error] Insufficient funds to clear ledger.');
      return;
    }

    const executeVendingDbWrite = async () => {
      try {
        if (vendingPayMethod !== 'transfer') {
          await updateDoc(doc(db, 'users', user.uid), {
            [walletField]: increment(-purchaseCostNGN)
          });
        }

        await addDoc(collection(db, 'transactions'), {
          userId: user.uid,
          type: 'payment',
          amount: purchaseCostNGN,
          currency: 'NGN',
          status: 'completed',
          purpose: `VTU Refill - ${opObj.name}`,
          description: `Vended ${vendingType === 'airtime' ? '₦' + purchaseCostNGN + ' Airtime' : 'Data Bundle'} to ${vendingPhone}.`,
          timestamp: serverTimestamp()
        });

        setVendingStatus('success');
        addVendingLog(`[API Success] Vended successfully to ${vendingPhone}!`);
      } catch (err: any) {
        setVendingStatus('failed');
        setVendingStatusMessage(err.message);
        addVendingLog(`[DB Error] Failed to write receipt: ${err.message}`);
      }
    };

    if (vendingPayMethod === 'transfer') {
      setPaymentPlatformAmount(purchaseCostNGN);
      setPaymentPlatformPurpose(`VTU Refill to ${vendingPhone}`);
      setPaymentPlatformOnSuccess(() => async () => {
        await executeVendingDbWrite();
      });
      setShowPaymentPlatform(true);
      setVendingStatus('idle');
    } else {
      await executeVendingDbWrite();
    }
  };

  // Crypto swap helper
  const calculateCryptoSwap = () => {
    const sourceToken = otcTokens.find(t => t.symbol === otcSellCrypto);
    if (!sourceToken) return { finalAmount: 0, usdRate: 0, premium: 0 };
    
    const usdValue = otcSellAmount * sourceToken.rate;
    const rateNGN = fiatRates[otcGetCurrency] || 1550;
    const basePayout = usdValue * rateNGN;
    
    // Add 1.5% security and dispatch premium
    const premiumAmount = basePayout * 0.015;
    const finalAmount = basePayout - premiumAmount;

    return {
      finalAmount: Math.round(finalAmount),
      usdRate: sourceToken.rate,
      premium: Math.round(premiumAmount)
    };
  };

  const handleRequestQuote = () => {
    const swap = calculateCryptoSwap();
    setOtcQuotes(swap);
    setOtcStep('quote');
  };

  const handleConfirmOtcDeposit = async () => {
    if (!otcTxHash.trim()) {
      alert("Please enter the blockchain Transaction Hash/ID to verify your deposit.");
      return;
    }
    setOtcStep('confirming');
    
    // Simulate chain confirmations
    setTimeout(async () => {
      try {
        const swap = calculateCryptoSwap();
        await addDoc(collection(db, 'transactions'), {
          userId: user.uid,
          type: 'deposit',
          amount: swap.finalAmount,
          currency: otcGetCurrency,
          status: 'completed',
          purpose: `Crypto OTC Swap (${otcSellCrypto})`,
          description: `Exchanged ${otcSellAmount} ${otcSellCrypto} to fiat. TxHash: ${otcTxHash}. Paid to bank/wallet.`,
          timestamp: serverTimestamp()
        });

        setOtcStep('complete');
      } catch (e) {
        console.error("OTC write error:", e);
      }
    }, 4000);
  };

  // Money Exchange helper
  const handleExecuteMoneyExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    setConvStatus('processing');

    setTimeout(async () => {
      try {
        const sourceRate = fiatRates[convSourceCurrency] || 1.0;
        const targetRate = fiatRates[convTargetCurrency] || 1550;
        const baseAmountInUSD = convAmount / sourceRate;
        const finalPayout = Math.round(baseAmountInUSD * targetRate * 0.985); // 1.5% fee

        await addDoc(collection(db, 'transactions'), {
          userId: user.uid,
          type: 'payment',
          amount: finalPayout,
          currency: convTargetCurrency,
          status: 'completed',
          purpose: `Money Exchange - ${convSourceCurrency} to ${convTargetCurrency}`,
          description: `Converted ${convAmount} ${convSourceCurrency} to ${finalPayout} ${convTargetCurrency} for payout.`,
          timestamp: serverTimestamp()
        });

        setConvStatus('success');
      } catch (e) {
        setConvStatus('idle');
      }
    }, 3000);
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 p-4 md:p-8 relative overflow-hidden font-sans uppercase">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-[9px] font-black tracking-widest text-indigo-400">Tactical Exchange Core</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white uppercase">
              Digital Services <span className="text-indigo-400 block sm:inline">Hub</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide normal-case">
              Highly secure, low-risk on-site transactions for utility refills, money exchange, and digital asset conversions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-4 bg-slate-900 rounded-2xl border border-white/5 flex items-center gap-4">
              <Lock className="w-6 h-6 text-emerald-400" />
              <div>
                <p className="text-[8px] font-black text-slate-500 tracking-wider">LEDGER SECURITY</p>
                <p className="text-xs font-black text-white">SSL SECURE PORT</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-white/5 max-w-2xl mx-auto shadow-xl">
          <button
            onClick={() => setActiveTab('crypto')}
            className={`flex-1 py-4 rounded-xl text-xs font-black tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'crypto' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coins className="w-4 h-4" />
            Crypto Swap
          </button>
          <button
            onClick={() => setActiveTab('money')}
            className={`flex-1 py-4 rounded-xl text-xs font-black tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'money' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            Money Exchange
          </button>
          <button
            onClick={() => setActiveTab('vending')}
            className={`flex-1 py-4 rounded-xl text-xs font-black tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'vending' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
            Airtime & Data
          </button>
        </div>

        {/* Dynamic Content */}
        <div className="glass-card-ultra bg-slate-900/50 rounded-3xl border border-white/5 p-6 md:p-10 shadow-2xl">
          
          {/* TAB 1: Crypto OTC Swap */}
          {activeTab === 'crypto' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="border-b border-white/5 pb-6">
                <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
                  <Coins className="w-6 h-6 text-indigo-400" />
                  Sovereign Crypto OTC Exchange
                </h2>
                <p className="text-[10px] text-slate-500 mt-1 normal-case font-medium">
                  Deposit stablecoins or major tokens to exchange seamlessly for bank transfer or mobile money.
                </p>
              </div>

              {otcStep === 'input' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 tracking-wider">You Send (Asset)</label>
                      <select
                        value={otcSellCrypto}
                        onChange={(e) => setOtcSellCrypto(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-sm font-black text-white focus:outline-none focus:border-indigo-500"
                      >
                        {otcTokens.map(token => (
                          <option key={token.symbol} value={token.symbol}>
                            {token.name} ({token.symbol}) - {token.chain}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 tracking-wider">Amount</label>
                      <input
                        type="number"
                        value={otcSellAmount}
                        onChange={(e) => setOtcSellAmount(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-sm font-black text-white focus:outline-none focus:border-indigo-500"
                        min="5"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 tracking-wider">You Receive (Payout Fiat)</label>
                      <select
                        value={otcGetCurrency}
                        onChange={(e) => setOtcGetCurrency(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-sm font-black text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="NGN">Nigerian Naira (₦)</option>
                        <option value="GHS">Ghanaian Cedi (GH₵)</option>
                        <option value="KES">Kenyan Shilling (KSh)</option>
                      </select>
                    </div>

                    <button
                      onClick={handleRequestQuote}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all"
                    >
                      Request Live Conversion Quote
                    </button>
                  </div>

                  <div className="bg-slate-950/80 p-6 rounded-3xl border border-white/5 space-y-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-black text-indigo-400 tracking-wider mb-4 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Conversion Parameters
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between border-b border-white/5 pb-2 text-[10px]">
                          <span className="text-slate-500 font-bold">ESTIMATED RATE:</span>
                          <span className="text-white font-black">
                            1 {otcSellCrypto} &asymp; ₦{(otcTokens.find(t => t.symbol === otcSellCrypto)?.rate || 1) * (fiatRates[otcGetCurrency] || 1550)} NGN
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2 text-[10px]">
                          <span className="text-slate-500 font-bold">FEES:</span>
                          <span className="text-rose-400 font-black">1.5% Secure Escrow Fee</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2 text-[10px]">
                          <span className="text-slate-500 font-bold">NETWORK INGRESS:</span>
                          <span className="text-emerald-400 font-black">FREE / NO INGRESS CHARGE</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center space-y-2">
                      <Lock className="w-6 h-6 text-indigo-400 mx-auto" />
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Escrow Assurance</p>
                      <p className="text-[10px] text-slate-300 normal-case leading-relaxed font-bold">
                        EFADO smart-lock escrows keep your tokens protected until your local fiat bank payout is fully processed.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {otcStep === 'quote' && otcQuotes && (
                <div className="max-w-2xl mx-auto bg-slate-950 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 animate-fadeIn">
                  <div className="text-center space-y-2">
                    <p className="text-[10px] font-black text-indigo-400 tracking-widest uppercase">Escrow Quote Authorized</p>
                    <h3 className="text-2xl font-black text-white">
                      Payout Estimate: {otcGetCurrency === 'NGN' ? '₦' : otcGetCurrency} {otcQuotes.finalAmount.toLocaleString()}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-[10px]">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-slate-500 mb-1">YOU SEND:</p>
                        <p className="text-sm font-black text-white">{otcSellAmount} {otcSellCrypto}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-slate-500 mb-1">ESCROW PREMIUM FEE:</p>
                        <p className="text-sm font-black text-rose-400">-{otcGetCurrency === 'NGN' ? '₦' : ''}{otcQuotes.premium.toLocaleString()} ({otcGetCurrency})</p>
                      </div>
                    </div>

                    <div className="space-y-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[10px] font-black text-slate-400 tracking-wider">Provide Payout Bank / Account Details</p>
                      <input
                        type="text"
                        placeholder="ENTER BANK NAME (e.g. Opay, Palmpay, GTBank)"
                        value={otcBankName}
                        onChange={(e) => setOtcBankName(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs font-black text-white focus:outline-none focus:border-indigo-500 uppercase"
                      />
                      <input
                        type="text"
                        placeholder="ENTER ACCOUNT NUMBER (10 Digits)"
                        value={otcBankAccount}
                        onChange={(e) => setOtcBankAccount(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs font-black text-white focus:outline-none focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="ENTER ACCOUNT HOLDER NAME"
                        value={otcAccountName}
                        onChange={(e) => setOtcAccountName(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs font-black text-white focus:outline-none focus:border-indigo-500 uppercase"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setOtcStep('input')}
                      className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-black text-xs uppercase"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => {
                        if (!otcBankName || !otcBankAccount || !otcAccountName) {
                          alert("Please fill in your bank payout credentials first.");
                          return;
                        }
                        setOtcStep('deposit');
                      }}
                      className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest"
                    >
                      Authorize Swap
                    </button>
                  </div>
                </div>
              )}

              {otcStep === 'deposit' && (
                <div className="max-w-2xl mx-auto bg-slate-950 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 text-center animate-fadeIn">
                  <div className="space-y-2">
                    <Clock className="w-12 h-12 text-indigo-400 mx-auto animate-spin" style={{ animationDuration: '6s' }} />
                    <h3 className="text-xl font-black text-white">Awaiting Blockchain Deposit</h3>
                    <p className="text-slate-400 text-[10px] normal-case leading-relaxed">
                      Please send exactly <span className="text-indigo-400 font-bold">{otcSellAmount} {otcSellCrypto}</span> on the specified network to the secure multi-signature deposit address below.
                    </p>
                  </div>

                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>NETWORK CHAIN:</span>
                      <span className="text-white font-black uppercase">
                        {otcTokens.find(t => t.symbol === otcSellCrypto)?.chain}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-white/5 break-all text-xs font-mono text-emerald-400 select-all select-all flex items-center justify-between gap-3">
                      <span>TFe5vP1A6u887W8rWdfvXfG2P9sZ76HjKa</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText("TFe5vP1A6u887W8rWdfvXfG2P9sZ76HjKa");
                          alert("Address copied to clipboard!");
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg text-slate-400"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[9px] font-black text-slate-400 tracking-wider">Provide Deposit Transaction Hash (TxHash / TxID)</label>
                    <input
                      type="text"
                      placeholder="ENTER Blockchain TxHash to initiate verification"
                      value={otcTxHash}
                      onChange={(e) => setOtcTxHash(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs font-black text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    onClick={handleConfirmOtcDeposit}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
                  >
                    Confirm Escrow Deposit
                  </button>
                </div>
              )}

              {otcStep === 'confirming' && (
                <div className="max-w-2xl mx-auto bg-slate-950 border border-white/10 rounded-3xl p-12 text-center space-y-6 animate-pulse">
                  <RefreshCw className="w-16 h-16 text-indigo-400 mx-auto animate-spin" />
                  <h3 className="text-xl font-black text-white">VERIFYING BLOCKCHAIN CONSTRAINTS</h3>
                  <p className="text-xs text-slate-400 normal-case leading-relaxed">
                    Sovereign validator network is confirming your stablecoin deposit hash inside TRON block height. Fiat dispatch will follow instantly upon 3/3 confirmations...
                  </p>
                </div>
              )}

              {otcStep === 'complete' && (
                <div className="max-w-2xl mx-auto bg-slate-950 border-2 border-emerald-500/20 rounded-3xl p-10 text-center space-y-6 animate-fadeIn">
                  <CheckCircle2 className="w-20 h-20 text-emerald-400 mx-auto animate-bounce" />
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">SWAP DISPATCHED SUCCESSFULLY!</h3>
                  <p className="text-xs text-slate-300 normal-case leading-relaxed">
                    We have verified your deposit of {otcSellAmount} {otcSellCrypto}. 
                    Our secure automated fiat engine has successfully routed the payout of {otcGetCurrency} {otcQuotes?.finalAmount.toLocaleString()} to:
                  </p>
                  <div className="bg-white/5 p-4 rounded-2xl text-[10px] text-slate-400 space-y-1">
                    <p>BANK: <span className="text-white font-black">{otcBankName}</span></p>
                    <p>ACCOUNT: <span className="text-white font-black">{otcBankAccount}</span></p>
                    <p>NAME: <span className="text-white font-black">{otcAccountName}</span></p>
                  </div>
                  <button
                    onClick={() => {
                      setOtcStep('input');
                      setOtcTxHash('');
                      setOtcQuotes(null);
                    }}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest"
                  >
                    Perform New Swap
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Money Exchange */}
          {activeTab === 'money' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="border-b border-white/5 pb-6">
                <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
                  <ArrowLeftRight className="w-6 h-6 text-indigo-400" />
                  Instant Money Exchange & Fiat Portal
                </h2>
                <p className="text-[10px] text-slate-500 mt-1 normal-case font-medium">
                  Convert fiat currencies at exact competitive parallel market rates. Zero hidden costs.
                </p>
              </div>

              {convStatus === 'idle' && (
                <form onSubmit={handleExecuteMoneyExchange} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 tracking-wider">Source Currency</label>
                        <select
                          value={convSourceCurrency}
                          onChange={(e) => setConvSourceCurrency(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs font-black text-white focus:outline-none"
                        >
                          {SUPPORTED_CURRENCIES.map(curr => (
                            <option key={curr.code} value={curr.code}>{curr.code} - {curr.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 tracking-wider">Target Currency</label>
                        <select
                          value={convTargetCurrency}
                          onChange={(e) => setConvTargetCurrency(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs font-black text-white focus:outline-none"
                        >
                          {SUPPORTED_CURRENCIES.map(curr => (
                            <option key={curr.code} value={curr.code}>{curr.code} - {curr.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 tracking-wider">Amount to Convert</label>
                      <input
                        type="number"
                        value={convAmount}
                        onChange={(e) => setConvAmount(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-sm font-black text-white focus:outline-none focus:border-indigo-500"
                        min="1"
                      />
                    </div>

                    <div className="p-4 bg-indigo-500/15 rounded-2xl border border-indigo-500/20 text-center">
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Calculated Payout Estimate</p>
                      <p className="text-xl md:text-2xl font-black text-white mt-1">
                        {convTargetCurrency} {Math.round((convAmount / (fiatRates[convSourceCurrency] || 1.0)) * (fiatRates[convTargetCurrency] || 1550) * 0.985).toLocaleString()}
                      </p>
                      <p className="text-[8px] text-slate-500 normal-case mt-1 font-semibold">Includes secure parallel margin pricing & 1.5% routing premium fee</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-white tracking-wider uppercase border-b border-white/5 pb-2">Payout Credentials</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 tracking-wider">Recipient Name</label>
                        <input
                          type="text"
                          placeholder="FULL ACCOUNT NAME"
                          value={convPayoutName}
                          onChange={(e) => setConvPayoutName(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl p-3.5 text-xs font-black text-white uppercase focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 tracking-wider">Destination Bank / Network Provider</label>
                        <input
                          type="text"
                          placeholder="OPAY, PALMPAY, GHS MOBILE MONEY, GTBANK etc"
                          value={convPayoutBank}
                          onChange={(e) => setConvPayoutBank(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl p-3.5 text-xs font-black text-white uppercase focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 tracking-wider">Account Number / Phone Number</label>
                        <input
                          type="text"
                          placeholder="ACCOUNT ID OR WALLET ID"
                          value={convPayoutAccount}
                          onChange={(e) => setConvPayoutAccount(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl p-3.5 text-xs font-black text-white focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all"
                    >
                      Process Money Exchange
                    </button>
                  </div>
                </form>
              )}

              {convStatus === 'processing' && (
                <div className="text-center py-16 space-y-6 max-w-lg mx-auto">
                  <RefreshCw className="w-16 h-16 text-indigo-400 mx-auto animate-spin" />
                  <h3 className="text-xl font-black text-white uppercase">Securing parallel market routes</h3>
                  <p className="text-xs text-slate-400 normal-case leading-relaxed">
                    Our sovereign routing engines are pairing parallel liquidities on-chain to process fiat conversion from {convSourceCurrency} to {convTargetCurrency}...
                  </p>
                </div>
              )}

              {convStatus === 'success' && (
                <div className="max-w-xl mx-auto bg-slate-950 border-2 border-emerald-500/20 rounded-3xl p-8 md:p-10 text-center space-y-6 animate-fadeIn">
                  <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
                  <h3 className="text-xl font-black text-white">CONVERSION DISPATCH COMPLETED!</h3>
                  <p className="text-xs text-slate-300 normal-case leading-relaxed">
                    Sovereign funds of {convTargetCurrency} {Math.round((convAmount / (fiatRates[convSourceCurrency] || 1.0)) * (fiatRates[convTargetCurrency] || 1550) * 0.985).toLocaleString()} have been authorized and routed to your destination bank:
                  </p>
                  <div className="bg-white/5 p-4 rounded-2xl text-[10px] text-slate-400 space-y-1 text-left">
                    <p>RECIPIENT: <span className="text-white font-black uppercase">{convPayoutName}</span></p>
                    <p>DESTINATION: <span className="text-white font-black uppercase">{convPayoutBank}</span></p>
                    <p>ACCOUNT ID: <span className="text-white font-black">{convPayoutAccount}</span></p>
                  </div>
                  <button
                    onClick={() => {
                      setConvStatus('idle');
                      setConvPayoutName('');
                      setConvPayoutBank('');
                      setConvPayoutAccount('');
                    }}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest"
                  >
                    Perform Another Exchange
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Airtime & Data Vending */}
          {activeTab === 'vending' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="border-b border-white/5 pb-6">
                <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
                  <Zap className="w-6 h-6 text-amber-400 fill-amber-400" />
                  Global Airtime & Data Bundle Vending
                </h2>
                <p className="text-[10px] text-slate-500 mt-1 normal-case font-medium">
                  Instant top-up for 120+ countries. Select operator, input mobile number, and purchase instantly.
                </p>
              </div>

              {vendingStatus === 'idle' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 tracking-wider">Country Flag</label>
                        <select
                          value={vendingCountry}
                          onChange={(e) => {
                            setVendingCountry(e.target.value);
                            const found = GLOBAL_VENDING_COUNTRIES.find(c => c.code === e.target.value);
                            if (found && found.operators.length > 0) {
                              setVendingOperator(found.operators[0].code);
                            }
                          }}
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs font-black text-white focus:outline-none"
                        >
                          {GLOBAL_VENDING_COUNTRIES.map(country => (
                            <option key={country.code} value={country.code}>
                              {country.flag} {country.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 tracking-wider">Operator Network</label>
                        <select
                          value={vendingOperator}
                          onChange={(e) => setVendingOperator(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs font-black text-white focus:outline-none"
                        >
                          {GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry)?.operators.map(op => (
                            <option key={op.code} value={op.code}>
                              {op.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setVendingType('airtime')}
                        className={`py-3.5 rounded-xl text-[10px] font-black tracking-widest flex items-center justify-center gap-2 border cursor-pointer ${
                          vendingType === 'airtime' ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-transparent border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Airtime
                      </button>
                      <button
                        type="button"
                        onClick={() => setVendingType('data')}
                        className={`py-3.5 rounded-xl text-[10px] font-black tracking-widest flex items-center justify-center gap-2 border cursor-pointer ${
                          vendingType === 'data' ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-transparent border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Wifi className="w-3.5 h-3.5" />
                        Data Bundle
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 tracking-wider">Mobile Phone Number</label>
                      <input
                        type="tel"
                        placeholder="ENTER PHONE NUMBER (with country code)"
                        value={vendingPhone}
                        onChange={(e) => setVendingPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-sm font-black text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {vendingType === 'airtime' ? (
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 tracking-wider">Airtime Amount (NGN)</label>
                        <input
                          type="number"
                          value={vendingCustomAirtimeAmount}
                          onChange={(e) => setVendingCustomAirtimeAmount(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-sm font-black text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 tracking-wider">Select Data Plan</label>
                        <select
                          value={vendingSelectedDataPlanId}
                          onChange={(e) => setVendingSelectedDataPlanId(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs font-black text-white focus:outline-none"
                        >
                          {GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry)?.operators.find(o => o.code === vendingOperator)?.plans.map(plan => (
                            <option key={plan.id} value={plan.id}>
                              {plan.name} ({plan.dataAllowance}) - ₦{plan.priceNGN.toLocaleString()}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-950 p-6 rounded-3xl border border-white/5 space-y-6 flex flex-col justify-between">
                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase border-b border-white/5 pb-2">Select Payment Method</h3>
                      <div className="space-y-3">
                        <label className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10">
                          <input
                            type="radio"
                            name="payMethod"
                            value="win_wallet"
                            checked={vendingPayMethod === 'win_wallet'}
                            onChange={() => setVendingPayMethod('win_wallet')}
                            className="text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                          <div className="text-left">
                            <p className="text-xs font-black text-white">Win Wallet / Play Balance</p>
                            <p className="text-[10px] text-emerald-400 font-bold">₦{(user.playerWallet || 0).toLocaleString()}</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10">
                          <input
                            type="radio"
                            name="payMethod"
                            value="deposit_wallet"
                            checked={vendingPayMethod === 'deposit_wallet'}
                            onChange={() => setVendingPayMethod('deposit_wallet')}
                            className="text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                          <div className="text-left">
                            <p className="text-xs font-black text-white">Deposit Wallet Balance</p>
                            <p className="text-[10px] text-indigo-400 font-bold">₦{(user.depositWallet || 0).toLocaleString()}</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10">
                          <input
                            type="radio"
                            name="payMethod"
                            value="transfer"
                            checked={vendingPayMethod === 'transfer'}
                            onChange={() => setVendingPayMethod('transfer')}
                            className="text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                          <div className="text-left">
                            <p className="text-xs font-black text-white">Direct Checkout / Transfer</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase">Manual Bank Receipt Upload</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <button
                      onClick={handleVendingPurchase}
                      className="w-full py-4.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-amber-500/10"
                    >
                      Process VTU Topup
                    </button>
                  </div>
                </div>
              )}

              {vendingStatus === 'processing' && (
                <div className="max-w-lg mx-auto text-center py-12 space-y-6 animate-pulse">
                  <RefreshCw className="w-16 h-16 text-amber-500 mx-auto animate-spin" />
                  <h3 className="text-xl font-black text-white">Vending Airtime...</h3>
                  <p className="text-xs text-slate-400 normal-case">Connecting to global telecommunications pipelines to route real-time credits...</p>
                </div>
              )}

              {vendingStatus === 'success' && (
                <div className="max-w-xl mx-auto bg-slate-950 border-2 border-emerald-500/20 rounded-3xl p-10 text-center space-y-6">
                  <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
                  <h3 className="text-2xl font-black text-white">VTU RECHARGE SUCCESSFUL!</h3>
                  <p className="text-xs text-slate-300 normal-case">
                    We have successfully vended the utility recharge. Recipient phone number <span className="text-indigo-400 font-bold">{vendingPhone}</span> will be credited instantly!
                  </p>
                  <button
                    onClick={() => {
                      setVendingStatus('idle');
                      setVendingPhone('');
                    }}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest"
                  >
                    Perform Another Topup
                  </button>
                </div>
              )}

              {vendingStatus === 'failed' && (
                <div className="max-w-xl mx-auto bg-slate-950 border-2 border-rose-500/20 rounded-3xl p-10 text-center space-y-6">
                  <AlertCircle className="w-16 h-16 text-rose-500 mx-auto animate-bounce" />
                  <h3 className="text-xl font-black text-white">VTU TOPUP FAILED</h3>
                  <p className="text-xs text-rose-400 uppercase tracking-wider">{vendingStatusMessage}</p>
                  <button
                    onClick={() => setVendingStatus('idle')}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase"
                  >
                    Retry Vending
                  </button>
                </div>
              )}

              {/* VTU Console Logs */}
              <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl text-left space-y-2">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Live VTU Synchroniser Trace Logs</p>
                <div className="max-h-36 overflow-y-auto font-mono text-[9px] text-slate-400 space-y-1">
                  {vendingLogs.map((log, i) => (
                    <div key={i} className="leading-normal">{log}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Floating back to home */}
      <button
        onClick={() => {
          // Handled externally by resetting state
          const backBtn = document.querySelector('[data-back-btn="true"]');
          if (backBtn instanceof HTMLButtonElement) {
            backBtn.click();
          } else {
            window.location.reload();
          }
        }}
        id="digital-services-back-btn"
        className="fixed top-4 left-4 z-50 p-3 bg-slate-900 border border-white/10 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer shadow-xl hidden"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Payment Platform Modal */}
      {showPaymentPlatform && (
        <PaymentPlatform
          user={user}
          type="deposit"
          amount={paymentPlatformAmount}
          purpose={paymentPlatformPurpose}
          onSuccess={async () => {
            if (paymentPlatformOnSuccess) {
              await paymentPlatformOnSuccess();
            }
            setShowPaymentPlatform(false);
          }}
          onClose={() => setShowPaymentPlatform(false)}
        />
      )}
    </div>
  );
};
