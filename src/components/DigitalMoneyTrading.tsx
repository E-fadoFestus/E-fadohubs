import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  X, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  History, 
  Zap, 
  Trophy, 
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Info,
  Volume2,
  VolumeX,
  CreditCard,
  Banknote,
  Bitcoin,
  Smartphone,
  DollarSign,
  Building2,
  ShieldCheck,
  Globe,
  QrCode,
  Hash,
  Copy,
  CheckCircle2,
  Sparkles,
  Fingerprint
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine 
} from 'recharts';
import confetti from 'canvas-confetti';

import { UserProfile, AdminStats, Transaction } from '../types';
import { useCurrency } from '../lib/CurrencyContext';
import { db, doc, updateDoc, increment } from '../firebase';
import { EasyPaymentPlatform } from './EasyPaymentPlatform';
import { CurrencySelector } from './CurrencySelector';

function randomGauss(mean = 0, stdDev = 1): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * stdDev + mean;
}

interface Trade {
  id: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice?: number;
  stake: number;
  payout?: number;
  status: 'OPEN' | 'WON' | 'LOST';
  timestamp: number;
  expiryTime: number;
}

interface DigitalMoneyTradingProps {
  onClose: () => void;
  user: UserProfile;
  onResult: (multiplier: number, bet: number, gameId: 'spinGame' | 'moneyCard' | 'tradingGame') => Promise<void>;
}

export const DigitalMoneyTrading: React.FC<DigitalMoneyTradingProps> = ({ onClose, user, onResult }) => {
  const { formatPrice, selectedCurrency } = useCurrency();
  const [stake, setStake] = useState(100);
  const [expiry, setExpiry] = useState(60); // seconds
  const [priceData, setPriceData] = useState<{ time: number; price: number }[]>([]);
  const [currentPrice, setCurrentPrice] = useState(24500.50);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ status: 'WON' | 'LOST', amount: number, type: 'BUY' | 'SELL' } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showPaymentUI, setShowPaymentUI] = useState<{ 
    type: 'deposit' | 'cashout', 
    active: boolean,
    selectedMethod: string | null 
  }>({ type: 'deposit', active: false, selectedMethod: null });
  const [copied, setCopied] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Derived from user prop
  const balance = user.depositWallet;
  const userId = user.uid.slice(0, 5).toUpperCase();

  const priceRef = useRef(currentPrice);
  const chartDataRef = useRef<{ time: number; price: number }[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // High-Level Market Dynamics State
  const marketState = useRef({
    trend: 0, // Momentum drift
    volatility: 2.5, // Current volatility scale
    regime: 'SIDEWAYS' as 'BULL' | 'BEAR' | 'SIDEWAYS',
    regimeCountdown: 0,
    macroTrend: 0 // Long term bias
  });

  // Sound Effects
  const playSound = (type: 'win' | 'loss' | 'trade') => {
    if (isMuted) return;
    const sounds = {
      win: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
      loss: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
      trade: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'
    };
    const audio = new Audio(sounds[type]);
    audio.volume = 0.4;
    audio.play().catch(() => {});
  };

  // Narration
  const narrate = (text: string) => {
    if (isMuted) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1.2;
    window.speechSynthesis.speak(utterance);
  };

  // Champion Praises
  const getPraise = () => {
    const praises = [
      "UNSTOPPABLE!",
      "MARKET MASTER!",
      "LEGENDARY TRADE!",
      "PURE GENIUS!",
      "CHAMPION STATUS!",
      "ABSOLUTE DOMINATION!"
    ];
    return praises[Math.floor(Math.random() * praises.length)];
  };

  // Initialize chart data
  useEffect(() => {
    // Background Music
    if (!isMuted) {
      audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/123/123-preview.mp3'); // Soft ambient
      audioRef.current.loop = true;
      audioRef.current.volume = 0.1;
      audioRef.current.play().catch(() => {});
    }

    const initialData = [];
    let lastPrice = 24500.50;
    const now = Date.now();
    
    // Zero-mean random walk with a tiny negative drift
    for (let i = 50; i >= 0; i--) {
      const step = randomGauss(0, 1) - 0.005; // tiny negative drift
      lastPrice = lastPrice + (step * 5);
      initialData.push({ time: now - i * 1000, price: Number(lastPrice.toFixed(2)) });
    }
    setPriceData(initialData);
    chartDataRef.current = initialData;
    setCurrentPrice(lastPrice);
    priceRef.current = lastPrice;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const paymentCategories = [
    {
      id: 'mobile_money',
      title: 'Mobile Money',
      icon: <Smartphone className="w-5 h-5 text-emerald-400" />,
      options: [
        { id: 'Opay', name: 'OPay' },
        { id: 'Palm Pay', name: 'PalmPay' },
        { id: 'Kuda', name: 'Kuda' }
      ]
    },
    {
      id: 'bank_transfer',
      title: 'Bank Transfer',
      icon: <Building2 className="w-5 h-5 text-blue-400" />,
      options: [
        { id: 'Zenith', name: 'Zenith' },
        { id: 'GTBank', name: 'GTBank' },
        { id: 'Access', name: 'Access' },
        { id: 'UBA', name: 'UBA' }
      ]
    },
    {
      id: 'cards',
      title: 'Cards',
      icon: <CreditCard className="w-5 h-5 text-purple-400" />,
      options: [
        { id: 'Visa', name: 'Visa' },
        { id: 'Mastercard', name: 'Mastercard' },
        { id: 'Verve', name: 'Verve' }
      ]
    },
    {
      id: 'ussd',
      title: 'USSD Code',
      icon: <Hash className="w-5 h-5 text-orange-400" />,
      options: [
        { id: 'USSD (EFADO Code)', name: '*EFADO*PAY#' },
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
        { id: 'QR Scan Pay', name: 'Scan & Pay' },
        { id: 'efado_qr', name: 'EFADO QR' }
      ]
    },
    {
      id: 'crypto',
      title: 'Crypto',
      icon: <Bitcoin className="w-5 h-5 text-yellow-400" />,
      options: [
        { id: 'BTC', name: 'BTC' },
        { id: 'ETH', name: 'ETH' },
        { id: 'USDT (TRC20)', name: 'USDT (TRC20)' }
      ]
    },
    {
      id: 'global',
      title: 'Global Payments',
      icon: <Globe className="w-5 h-5 text-indigo-400" />,
      options: [
        { id: 'PayPal', name: 'PayPal' },
        { id: 'Stripe', name: 'Stripe' },
        { id: 'Paystack', name: 'Paystack' }
      ]
    }
  ];

  // Price Simulation - Chaos-Enhanced Stochastic Engine
  useEffect(() => {
    const interval = setInterval(() => {
      const state = marketState.current;

      // Update Market Regime (Bull, Bear, Sideways) for visual decoration
      if (state.regimeCountdown <= 0) {
        const regimes: ('BULL' | 'BEAR' | 'SIDEWAYS')[] = ['BULL', 'BEAR', 'SIDEWAYS', 'SIDEWAYS', 'SIDEWAYS'];
        state.regime = regimes[Math.floor(Math.random() * regimes.length)];
        state.regimeCountdown = 5 + Math.floor(Math.random() * 15);
      }
      state.regimeCountdown--;

      // Zero-mean random walk with a tiny negative drift
      const step = randomGauss(0, 1) - 0.005; // tiny negative drift
      const totalChange = step * 5;
      const newPrice = Number((priceRef.current + totalChange).toFixed(2));
      
      priceRef.current = newPrice;
      setCurrentPrice(newPrice);

      const now = Date.now();
      const newData = [...chartDataRef.current, { time: now, price: newPrice }].slice(-60);
      chartDataRef.current = newData;
      setPriceData(newData);

      // Check for expired trades
      setTrades(prev => {
        let changed = false;
        const updated = prev.map(trade => {
          if (trade.status === 'OPEN' && now >= trade.expiryTime) {
            changed = true;
            const isWin = trade.type === 'BUY' 
              ? newPrice > trade.entryPrice 
              : newPrice < trade.entryPrice;
            
            const payout = isWin ? trade.stake * 1.85 : 0;
            
            // Trigger Result Celebration
            setLastResult({ 
              status: isWin ? 'WON' : 'LOST', 
              amount: isWin ? payout : trade.stake,
              type: trade.type
            });
            
            if (isWin) {
              playSound('win');
              narrate(`Incredible! You won ${formatPrice(payout)} ${selectedCurrency.name}. ${getPraise()}`);
              
              // Champion Sprays (Intense Confetti)
              confetti({
                particleCount: 200,
                spread: 120,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#22c55e', '#ffffff', '#eab308', '#ff00ff']
              });
              
              // Side sprays
              setTimeout(() => {
                confetti({
                  particleCount: 80,
                  angle: 60,
                  spread: 80,
                  origin: { x: 0, y: 0.8 },
                  colors: ['#3b82f6', '#ffffff', '#22c55e']
                });
                confetti({
                  particleCount: 80,
                  angle: 120,
                  spread: 80,
                  origin: { x: 1, y: 0.8 },
                  colors: ['#3b82f6', '#ffffff', '#22c55e']
                });
              }, 250);
            } else {
              playSound('loss');
              narrate(`Trade closed. Loss of ${trade.stake} ${selectedCurrency.name}. Stay focused, champion.`);
            }

            // Sync with Firestore
            const multiplier = isWin ? 1.85 : 0;
            onResult(multiplier, trade.stake, 'tradingGame');

            // Auto-clear result overlay
            setTimeout(() => setLastResult(null), 4000);

            return {
              ...trade,
              exitPrice: newPrice,
              status: (isWin ? 'WON' : 'LOST') as 'WON' | 'LOST',
              payout
            };
          }
          return trade;
        });
        return changed ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isMuted]);

  const handleTrade = (type: 'BUY' | 'SELL') => {
    if (balance < stake) {
      setError("Insufficient Funds / Balance");
      setShowPaymentUI({ type: 'deposit', active: true, selectedMethod: null });
      setTimeout(() => setError(null), 3550);
      return;
    }

    // Enforce "One active bet per player" - check both local state and Firestore (synced in real-time)
    const activeDbBet = user?.activeTradingGameBet;
    if (activeTrades.length > 0 || (activeDbBet && activeDbBet.expiry > Date.now())) {
      setError("Active round in progress. One active bet per player allowed.");
      setTimeout(() => setError(null), 3550);
      return;
    }

    playSound('trade');
    setIsProcessing(true);
    
    const expiryTimestamp = Date.now() + expiry * 1000;

    // Sync bet lock to Firestore immediately to prevent multi-tab exploits
    if (user?.uid) {
      const userRef = doc(db, 'users', user.uid);
      updateDoc(userRef, {
        activeTradingGameBet: { expiry: expiryTimestamp }
      }).catch(err => console.error('Failed to sync bet state:', err));
    }
    
    const newTrade: Trade = {
      id: Math.random().toString(36).substring(7),
      type,
      entryPrice: currentPrice,
      stake,
      status: 'OPEN',
      timestamp: Date.now(),
      expiryTime: expiryTimestamp
    };

    setTrades(prev => [newTrade, ...prev]);
    setTimeout(() => setIsProcessing(false), 500);
  };

  const activeTrades = useMemo(() => trades.filter(t => t.status === 'OPEN'), [trades]);
  const historyTrades = useMemo(() => trades.filter(t => t.status !== 'OPEN'), [trades]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl overflow-hidden"
    >
      <div className="relative w-full max-w-7xl h-[90vh] bg-slate-900 border border-white/10 rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden blueprint-grid">
        
        {/* Technical Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/40 via-transparent to-slate-950/40 pointer-events-none z-0" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(15,23,42,0.4)_100%)] pointer-events-none z-0" />
        
        {/* Technical Coordinate Markers */}
        <div className="absolute top-4 left-4 text-[8px] text-blue-500/30 font-mono pointer-events-none z-10">LAT: 40.7128° N</div>
        <div className="absolute top-4 right-4 text-[8px] text-blue-500/30 font-mono pointer-events-none z-10">LON: 74.0060° W</div>
        <div className="absolute top-10 left-4 text-[8px] text-blue-500/30 font-mono pointer-events-none z-10">REGIME: {marketState.current.regime}_SIGNAL</div>
        <div className="absolute bottom-4 left-4 text-[8px] text-blue-500/30 font-mono pointer-events-none z-10">REF: EFAD-DMT-001</div>
        <div className="absolute bottom-4 right-4 text-[8px] text-blue-500/30 font-mono pointer-events-none z-10">SYS: ACTIVE_MAPPING</div>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-md z-20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-display font-black text-white tracking-tight">EFADO DMT</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Digital Money Trading</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 text-slate-400 hover:text-white transition-colors bg-slate-800/50 rounded-xl border border-white/5"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            {/* Trading Wallet Card */}
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 rounded-2xl border border-white/5 relative overflow-hidden">
              <AnimatePresence mode="wait">
                {lastResult?.status === 'WON' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1.2 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-green-500/20 blur-xl pointer-events-none"
                  />
                )}
              </AnimatePresence>
              <Wallet className="w-4 h-4 text-blue-400" />
              <div className="text-right relative z-10">
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Trading Wallet</p>
                <motion.p 
                  key={balance}
                  initial={{ scale: 1.1, color: '#4ade80' }}
                  animate={{ scale: 1, color: '#ffffff' }}
                  className="text-lg font-display font-black text-white"
                >
                  {formatPrice(balance)}
                </motion.p>
              </div>
            </div>

            {/* Win Wallet Card */}
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 rounded-2xl border border-emerald-500/20 relative overflow-hidden">
              <Trophy className="w-4 h-4 text-emerald-400 animate-pulse" />
              <div className="text-right relative z-10">
                <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Win Wallet</p>
                <motion.p 
                  key={user.playerWallet}
                  initial={{ scale: 1.1, color: '#10b981' }}
                  animate={{ scale: 1, color: '#ffffff' }}
                  className="text-lg font-display font-black text-white"
                >
                  {formatPrice(user.playerWallet || 0)}
                </motion.p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowPaymentUI({ type: 'deposit', active: true, selectedMethod: null })}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 border border-white/20 rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95"
              >
                <ArrowUpRight className="w-4 h-4 text-white" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Fund Wallet</span>
              </button>
              <button 
                onClick={() => setShowPaymentUI({ type: 'cashout', active: true, selectedMethod: null })}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 border border-white/20 rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95"
              >
                <ArrowDownLeft className="w-4 h-4 text-white" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Cash Out</span>
              </button>
            </div>

            <CurrencySelector />

            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-grow flex overflow-hidden">
          {/* Main Chart Area */}
          <div className="flex-grow relative flex flex-col p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">BTC / USD</span>
                  <span className="text-3xl font-display font-black text-white">{formatPrice(currentPrice)}</span>
                </div>
                <div className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${currentPrice > 24500 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {currentPrice > 24500 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  +0.45%
                </div>
              </div>
              <div className="flex gap-2">
                {['1M', '5M', '15M', '1H'].map(t => (
                  <button key={t} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${t === '1M' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-white'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-grow relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="time" 
                    hide 
                  />
                  <YAxis 
                    domain={['dataMin - 10', 'dataMax + 10']} 
                    orientation="right"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => formatPrice(val as number)}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-800 border border-white/10 p-2 rounded-lg shadow-xl">
                            <p className="text-xs font-bold text-white">{formatPrice(payload[0].value as number)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="linear" 
                    dataKey="price" 
                    stroke="#22d3ee" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorPrice)" 
                    animationDuration={0}
                    isAnimationActive={false}
                  />
                  {/* Fractal Momentum Indicator */}
                  <Area
                    type="step"
                    dataKey="price"
                    stroke="#0891b2"
                    strokeWidth={1}
                    strokeOpacity={0.2}
                    fill="none"
                    isAnimationActive={false}
                  />
                  {activeTrades.map(trade => (
                    <React.Fragment key={trade.id}>
                      {/* Entry Price Line */}
                      <ReferenceLine 
                        y={trade.entryPrice} 
                        stroke={trade.type === 'BUY' ? '#22c55e' : '#ef4444'} 
                        strokeDasharray="3 3"
                        strokeWidth={1}
                      />
                      {/* Entry Time Vertical Line */}
                      <ReferenceLine 
                        x={trade.timestamp} 
                        stroke="#ffffff22" 
                        strokeWidth={1}
                        label={{ value: 'START', position: 'top', fill: '#ffffff22', fontSize: 8 }}
                      />
                      {/* Expiry Time Vertical Line (if visible) */}
                      <ReferenceLine 
                        x={trade.expiryTime} 
                        stroke={trade.type === 'BUY' ? '#22c55e44' : '#ef444444'} 
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        label={{ value: 'END', position: 'top', fill: trade.type === 'BUY' ? '#22c55e' : '#ef4444', fontSize: 8, fontWeight: 'bold' }}
                      />
                    </React.Fragment>
                  ))}
                  {/* Current Price Line with Dynamic Payout Label */}
                  <ReferenceLine 
                    y={currentPrice} 
                    stroke={activeTrades.length > 0 ? (activeTrades.some(t => (t.type === 'BUY' ? currentPrice > t.entryPrice : currentPrice < t.entryPrice)) ? '#22c55e' : '#ef4444') : '#3b82f6'} 
                    strokeWidth={2}
                    label={({ viewBox }) => {
                      const { x, y, width } = viewBox;
                      const isWinning = activeTrades.some(t => (t.type === 'BUY' ? currentPrice > t.entryPrice : currentPrice < t.entryPrice));
                      const totalPotential = activeTrades.reduce((acc, t) => {
                        const win = t.type === 'BUY' ? currentPrice > t.entryPrice : currentPrice < t.entryPrice;
                        return acc + (win ? t.stake * 1.85 : 0);
                      }, 0);

                      return (
                        <g>
                          <rect x={width - 80} y={y - 12} width={80} height={24} rx={4} fill={activeTrades.length > 0 ? (isWinning ? '#22c55e' : '#ef4444') : '#3b82f6'} />
                          <text x={width - 40} y={y + 5} textAnchor="middle" fill="white" fontSize={10} fontWeight="black">
                            ${currentPrice.toFixed(2)}
                          </text>
                          {activeTrades.length > 0 && (
                            <text x={width - 40} y={y - 20} textAnchor="middle" fill={isWinning ? '#22c55e' : '#ef4444'} fontSize={10} fontWeight="black">
                              WIN: {formatPrice(totalPotential)}
                            </text>
                          )}
                        </g>
                      );
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              
              {/* Floating Potential Profit Indicator */}
              {activeTrades.length > 0 && (
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                  {activeTrades.map(trade => {
                    const isWinning = trade.type === 'BUY' ? currentPrice > trade.entryPrice : currentPrice < trade.entryPrice;
                    return (
                      <div key={trade.id} className={`px-3 py-1.5 rounded-lg border backdrop-blur-md flex items-center gap-2 ${isWinning ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-red-500/20 border-red-500/40 text-red-400'}`}>
                        <div className={`w-2 h-2 rounded-full animate-ping ${isWinning ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">
                          {trade.type} Payout: {isWinning ? formatPrice(trade.stake * 1.85) : formatPrice(0)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Active Trades Bar */}
            <div className="mt-4 flex gap-4 overflow-x-auto no-scrollbar pb-2">
              <AnimatePresence>
                {activeTrades.map(trade => (
                  <motion.div
                    key={trade.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex-shrink-0 bg-slate-800/80 border border-white/5 rounded-xl p-3 min-w-[180px] flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${trade.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {trade.type}
                        </span>
                        <span className="text-[10px] font-bold text-white">{formatPrice(trade.stake)}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-[8px] text-slate-500">
                          <Clock className="w-2 h-2" />
                          <span>{Math.max(0, Math.ceil((trade.expiryTime - Date.now()) / 1000))}s</span>
                        </div>
                        <div className="w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: (trade.expiryTime - trade.timestamp) / 1000, ease: 'linear' }}
                            className={`h-full ${trade.type === 'BUY' ? 'bg-green-500' : 'bg-red-500'}`}
                          />
                        </div>
                      </div>
                    </div>
                    <div className={`text-sm font-black ${currentPrice > trade.entryPrice === (trade.type === 'BUY') ? 'text-green-400' : 'text-red-400'}`}>
                      {currentPrice > trade.entryPrice === (trade.type === 'BUY') ? `+${formatPrice(trade.stake * 0.85)}` : `-${formatPrice(trade.stake)}`}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Side Control Panel */}
          <div className="w-80 flex-shrink-0 bg-slate-900/50 border-l border-white/5 p-6 flex flex-col gap-6 z-10">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Amount</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[10, 50, 100, 500].map(amt => (
                  <button 
                    key={amt}
                    onClick={() => setStake(amt)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${stake === amt ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                  >
                    {formatPrice(amt)}
                  </button>
                ))}
              </div>
              <div className="relative">
                <input 
                  type="number" 
                  value={stake}
                  onChange={(e) => setStake(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-blue-500 outline-none transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">{selectedCurrency.symbol}</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Time Period</label>
              <div className="grid grid-cols-1 gap-2">
                {[60].map(t => (
                  <button 
                    key={t}
                    onClick={() => setExpiry(t)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${expiry === t ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                  >
                    {t}s
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto space-y-4">
              <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-500 font-bold">Profit</span>
                  <span className="text-xs text-green-400 font-black">+85%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-bold">Payout</span>
                  <span className="text-lg font-display font-black text-white">{formatPrice(stake * 1.85)}</span>
                </div>
              </div>

              <button
                disabled={isProcessing}
                onClick={() => handleTrade('BUY')}
                className="w-full py-5 bg-green-600 hover:bg-green-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-2xl font-display font-black text-xl tracking-widest transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-3 group"
              >
                <TrendingUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
                BUY / UP
              </button>

              <button
                disabled={isProcessing}
                onClick={() => handleTrade('SELL')}
                className="w-full py-5 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-2xl font-display font-black text-xl tracking-widest transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-3 group"
              >
                <TrendingDown className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
                SELL / DOWN
              </button>
            </div>
          </div>
        </div>

        {/* History Toggle */}
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="absolute bottom-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-slate-800/80 backdrop-blur-md border border-white/10 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all"
        >
          <History className="w-4 h-4" />
          Trade History
          <ChevronDown className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
        </button>

        {/* History Overlay */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-2xl border-t border-white/10 z-40 overflow-hidden"
            >
              <div className="p-6 max-h-[400px] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-display font-black text-white uppercase tracking-tight">Recent Trades</h3>
                  <button onClick={() => setShowHistory(false)} className="text-slate-500 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {historyTrades.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <History className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-slate-500 font-bold">No trade history yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyTrades.map(trade => (
                      <div key={trade.id} className="bg-slate-800/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${trade.status === 'WON' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            {trade.type === 'BUY' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-white">{trade.type}</span>
                              <span className="text-[10px] font-bold text-slate-400">{new Date(trade.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-[10px] text-slate-400">Entry: {formatPrice(trade.entryPrice)} • Exit: {trade.exitPrice ? formatPrice(trade.exitPrice) : '...'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-black ${trade.status === 'WON' ? 'text-green-400' : 'text-red-400'}`}>
                            {trade.status === 'WON' ? `+${formatPrice(trade.payout || 0)}` : `-${formatPrice(trade.stake)}`}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{trade.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Overlay */}
        <AnimatePresence>
          {lastResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.5, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className={`relative p-12 rounded-[3rem] text-center max-w-md w-full border-4 ${
                  lastResult.status === 'WON' 
                    ? 'bg-green-500/10 border-green-500/50 shadow-[0_0_100px_rgba(34,197,94,0.3)]' 
                    : 'bg-red-500/10 border-red-500/50 shadow-[0_0_100px_rgba(239,68,68,0.3)]'
                }`}
              >
                <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
                  lastResult.status === 'WON' ? 'bg-green-500 shadow-[0_0_30px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]'
                }`}>
                  {lastResult.status === 'WON' ? <Trophy className="w-12 h-12 text-white" /> : <AlertCircle className="w-12 h-12 text-white" />}
                </div>

                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`text-5xl font-black mb-2 tracking-tighter ${lastResult.status === 'WON' ? 'text-green-400' : 'text-red-400'}`}
                >
                  {lastResult.status === 'WON' ? 'TRADE WON!' : 'TRADE LOST'}
                </motion.h2>

                {lastResult.status === 'WON' && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-yellow-400 font-black text-xl mb-6 tracking-widest uppercase"
                  >
                    {getPraise()}
                  </motion.p>
                )}

                <div className="bg-slate-900/80 rounded-3xl p-8 border border-white/10 mb-8">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                    {lastResult.status === 'WON' ? 'Profit Realized' : 'Loss Amount'}
                  </p>
                  <motion.div 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className={`text-6xl font-display font-black ${lastResult.status === 'WON' ? 'text-white' : 'text-slate-300'}`}
                  >
                    {formatPrice(lastResult.amount)}
                  </motion.div>
                </div>

                <button 
                  onClick={() => setLastResult(null)}
                  className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all border border-white/10"
                >
                  Continue Trading
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Toast */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[70] bg-red-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold"
            >
              <AlertCircle className="w-5 h-5" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Extended Highly-Polished Unified EFADO Payment/Cashout Platform */}
        <AnimatePresence>
          {showPaymentUI.active && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
              <div className="w-full max-w-[500px] h-[90vh] max-h-[750px] flex flex-col">
                <EasyPaymentPlatform 
                  user={user}
                  type={showPaymentUI.type === 'deposit' ? 'deposit' : 'withdraw'}
                  onClose={() => setShowPaymentUI(prev => ({ ...prev, active: false }))}
                  onComplete={async (amount, method) => {
                    try {
                      const userRef = doc(db, 'users', user.uid);
                      if (showPaymentUI.type === 'deposit') {
                        await updateDoc(userRef, {
                          depositWallet: increment(amount),
                          playerWallet: increment(amount)
                        });
                      } else {
                        await updateDoc(userRef, {
                          playerWallet: increment(-amount)
                        });
                      }
                    } catch (err) {
                      console.error('Wallet update failed during trading game payment complete', err);
                      throw err;
                    }
                  }}
                  hub="DMT_GAME"
                  purpose={showPaymentUI.type === 'deposit' ? "Tactical DMT Trading Account Funding" : "Tactical DMT Trading Profit Cashout"}
                />
              </div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
};
