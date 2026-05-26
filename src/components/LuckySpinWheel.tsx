import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  RotateCw, 
  Sparkles, 
  X, 
  ChevronRight, 
  ChevronDown,
  Gamepad2, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Banknote, 
  Bitcoin, 
  Smartphone, 
  DollarSign, 
  Building2,
  ShieldCheck,
  ShieldAlert,
  Globe,
  QrCode,
  Hash,
  Copy,
  CheckCircle2,
  Menu,
  Coins
} from 'lucide-react';

import { UserProfile, AdminStats, Transaction } from '../types';
import { db, doc, onSnapshot, updateDoc, increment } from '../firebase';
import { PaymentPlatform } from './PaymentPlatform';
import { useCurrency } from '../lib/CurrencyContext';

interface LuckySpinWheelProps {
  onClose: () => void;
  initialStageIdx?: number;
  user: UserProfile;
  onResult: (multiplier: number, bet: number, gameId: 'spinGame' | 'moneyCard' | 'tradingGame') => Promise<void>;
}

const BASE_SEGMENTS = [
  { label: '12', color: '#F97316' }, // Orange (Top)
  { label: '8', color: '#3B82F6' },  // Blue
  { label: '5', color: '#FACC15' },  // Yellow
  { label: '15', color: '#3B82F6' }, // Blue
  { label: '20', color: '#F472B6' }, // Pink
  { label: '2', color: '#A855F7' },  // Purple
  { label: '10', color: '#22C55E' }, // Green
  { label: '18', color: '#06B6D4' }, // Cyan
];

const STAGES = [
  { name: 'STARTER STAGE', stake: 56, target: 112 },
  ...Array.from({ length: 12 }, (_, i) => ({
    name: `STAGE ${i + 1}`,
    stake: 56 * Math.pow(2, i + 1),
    target: 112 * Math.pow(2, i + 1),
  })),
];

const ELITE_TIERS = [
  { name: 'BRONZE', multiplier: 2, color: '#CD7F32', glow: 'shadow-[0_0_20px_rgba(205,127,50,0.5)]' },
  { name: 'SILVER', multiplier: 3, color: '#C0C0C0', glow: 'shadow-[0_0_20px_rgba(192,192,192,0.5)]' },
  { name: 'GOLD', multiplier: 5, color: '#FFD700', glow: 'shadow-[0_0_20px_rgba(255,215,0,0.5)]' },
  { name: 'DIAMOND', multiplier: 10, color: '#B9F2FF', glow: 'shadow-[0_0_20px_rgba(185,242,255,0.5)]' },
  { name: 'LORD', multiplier: 25, color: '#E5E4E2', glow: 'shadow-[0_0_20px_rgba(229,228,226,0.5)]' },
  { name: 'MASTER', multiplier: 50, color: '#FF0000', glow: 'shadow-[0_0_20px_rgba(255,0,0,0.5)]' },
];

export const LuckySpinWheel: React.FC<LuckySpinWheelProps> = ({ onClose, initialStageIdx = 0, user, onResult }) => {
  const { formatPrice, selectedCurrency } = useCurrency();
  const [gameMode, setGameMode] = useState<'standard' | 'elite'>('standard');
  const [eliteTierIdx, setEliteTierIdx] = useState(0);
  const [customStake, setCustomStake] = useState<number>(100);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [isTargetWin, setIsTargetWin] = useState(false);
  const [currentStageIdx, setCurrentStageIdx] = useState(initialStageIdx);
  const [showStageDropdown, setShowStageDropdown] = useState(false);
  const [currentView, setCurrentView] = useState<'game' | 'wallets'>('game');
  const [showPaymentUI, setShowPaymentUI] = useState<{ 
    type: 'deposit' | 'cashout', 
    active: boolean,
    selectedMethod: string | null 
  }>({ type: 'deposit', active: false, selectedMethod: null });
  
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [maintenanceError, setMaintenanceError] = useState(false);
  const [insufficientFundsError, setInsufficientFundsError] = useState(false);
  const [systemSettings, setSystemSettings] = useState({
    minWithdrawal: 50,
    maintenanceMode: false,
    spinWinRate: 0.15,
    maxLoanAmount: 5000
  });
  
  // User ID for unique USSD
  const userId = user.uid.slice(0, 5).toUpperCase();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'adminStats', 'settings'), (snap) => {
      if (snap.exists()) {
        setSystemSettings(snap.data() as any);
      }
    });
    return () => unsub();
  }, []);
  
  // Wallet States (Now derived from user prop)
  const wallets = {
    playerWin: user.playerWallet,
    deposit: user.depositWallet,
    admin: 0, // Admin wallet is handled by App.tsx
    cashOut: user.playerWallet
  };

  const controls = useAnimation();
  
  const currentStage = STAGES[currentStageIdx];
  const currentEliteTier = ELITE_TIERS[eliteTierIdx];
  
  // Dynamic segments based on mode and stage
  const multiplier = Math.pow(2, currentStageIdx);
  
  const segments = gameMode === 'standard' 
    ? BASE_SEGMENTS.map((s, i) => {
        // Replace one segment with the target for standard mode
        if (i === 0) return { label: currentStage.target.toString(), color: '#F97316' };
        return { ...s, label: (parseInt(s.label) * multiplier).toString() };
      })
    : Array.from({ length: 8 }, (_, i) => {
        const winCounts: Record<string, number> = {
          'BRONZE': 5,
          'SILVER': 4,
          'GOLD': 3,
          'DIAMOND': 2,
          'LORD': 1,
          'MASTER': 2
        };
        const winCount = winCounts[currentEliteTier.name] || 1;
        
        // Spacing logic for 8 segments
        const patterns: Record<number, number[]> = {
          5: [0, 1, 2, 4, 6], 
          4: [0, 2, 4, 6],    
          3: [0, 3, 5],       
          2: [0, 4],          
          1: [0]              
        };
        const activeIndices = patterns[winCount] || [0];
        const isWinningSegment = activeIndices.includes(i);

        const label = isWinningSegment 
          ? (customStake * currentEliteTier.multiplier).toString()
          : "0";
        
        return {
          label,
          color: BASE_SEGMENTS[i].color
        };
      });

  const spinWheel = async () => {
    if (isSpinning) return;
    if (systemSettings.maintenanceMode) {
      setMaintenanceError(true);
      setTimeout(() => setMaintenanceError(false), 3000);
      return;
    }

    const stakeAmount = gameMode === 'standard' ? currentStage.stake : customStake;
    if (user.depositWallet < stakeAmount) {
      setInsufficientFundsError(true);
      setTimeout(() => setInsufficientFundsError(false), 4000);
      setShowPaymentUI({ type: 'deposit', active: true, selectedMethod: null });
      return;
    }

    setIsSpinning(true);
    setWinner(null);

    const extraDegrees = Math.floor(Math.random() * 360);
    const totalDegrees = 1800 + extraDegrees;

    await controls.start({
      rotate: totalDegrees,
      transition: {
        duration: 5,
        ease: [0.15, 0, 0.15, 1],
      },
    });

    const actualDegrees = totalDegrees % 360;
    const segmentAngle = 360 / segments.length;
    const winningIndex = Math.floor(((360 - actualDegrees) % 360) / segmentAngle);
    const winningLabel = segments[winningIndex].label;
    
    const isTarget = gameMode === 'standard' 
      ? winningLabel === currentStage.target.toString()
      : parseInt(winningLabel) > 0; // In Elite mode, only non-zero wins are champion wins
    
    setWinner(winningLabel);
    setIsTargetWin(isTarget);
    setIsSpinning(false);

    // Celebration Effects
    if (parseInt(winningLabel) > 0) {
      const applause = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
      applause.play().catch(e => console.log('Audio play failed:', e));

      // Voice Announcement
      if ('speechSynthesis' in window) {
        const announcement = new SpeechSynthesisUtterance();
        announcement.text = isTarget 
          ? `Champion Win! You have won ${winningLabel} ${selectedCurrency.name}!` 
          : `Congratulations! You won ${winningLabel} ${selectedCurrency.name}!`;
        announcement.rate = 1;
        announcement.pitch = 1.1;
        window.speechSynthesis.speak(announcement);
      }

      if (isTarget) {
        // Massive champion celebration spray - Multi-burst
        const end = Date.now() + 4000; // Increased duration
        const colors = ['#FFD700', '#FFA500', '#FF4500', '#FFFFFF', '#00FFFF'];

        (function frame() {
          confetti({
            particleCount: 6, // Doubled
            angle: 60,
            spread: 80, // Increased spread
            origin: { x: 0, y: 0.6 },
            colors: colors,
            scalar: 1.5 // Larger particles
          });
          confetti({
            particleCount: 6, // Doubled
            angle: 120,
            spread: 80, // Increased spread
            origin: { x: 1, y: 0.6 },
            colors: colors,
            scalar: 1.5 // Larger particles
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        }());

        confetti({
          particleCount: 400, // Significantly increased
          spread: 150, // Wider spread
          origin: { y: 0.5 }, // Higher origin
          colors: colors,
          scalar: 2.5, // Much larger particles
          drift: 0,
          ticks: 300
        });
      } else {
        // Large sprays for regular wins
        confetti({
          particleCount: 200, // Increased from 60
          spread: 100, // Increased from 50
          origin: { y: 0.6 },
          colors: ['#3B82F6', '#F97316', '#22C55E', '#FFFFFF'],
          scalar: 1.8, // Larger particles
          ticks: 200
        });
        
        // Add a secondary burst for regular wins
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.7 },
            colors: ['#3B82F6', '#F97316', '#22C55E'],
            scalar: 1.2
          });
        }, 300);
      }
    } else {
      // Loss announcement
      if ('speechSynthesis' in window) {
        const announcement = new SpeechSynthesisUtterance();
        announcement.text = "Better luck next time! You won 0 dollars.";
        announcement.rate = 1;
        announcement.pitch = 0.9;
        window.speechSynthesis.speak(announcement);
      }
    }

    // Update Player Win Wallet on win
    const winAmount = parseInt(winningLabel);
    const stake = gameMode === 'standard' ? currentStage.stake : customStake;
    const multiplier = winAmount / stake;
    
    await onResult(multiplier, stake, 'spinGame');
  };

  const resetWheel = () => {
    controls.set({ rotate: 0 });
    setWinner(null);
    setIsTargetWin(false);
  };

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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl overflow-y-auto"
    >
      <div className="relative w-full max-w-6xl bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-4 lg:p-6 shadow-2xl overflow-hidden my-4 glass-card-ultra">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white transition-colors z-50"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Navigation Tabs */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex bg-white/5 p-1 rounded-2xl border border-white/5 z-50 backdrop-blur-xl">
          <button
            onClick={() => setCurrentView('game')}
            className={`px-8 py-2.5 rounded-xl text-xs font-bold tracking-tight transition-all flex items-center gap-2 ${currentView === 'game' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            Arena
          </button>
          <button
            onClick={() => setCurrentView('wallets')}
            className={`px-8 py-2.5 rounded-xl text-xs font-bold tracking-tight transition-all flex items-center gap-2 ${currentView === 'wallets' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}
          >
            <Wallet className="w-3.5 h-3.5" />
            Wealth
          </button>
        </div>
 streams:

        <div className="relative">
          {currentView === 'game' ? (
            <>
              {/* Top Wallet Bar - Desktop */}
          <div className="hidden lg:flex absolute top-0 left-0 right-0 justify-between items-start z-50 pointer-events-none">
            <div className="flex gap-3">
                {/* Win Wallet */}
                 <button 
                  onClick={() => setCurrentView('wallets')}
                  className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 min-w-[180px] shadow-2xl hover:bg-white/10 hover:border-white/20 transition-all text-left pointer-events-auto"
                >
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Win Wallet</div>
                  <div className="text-3xl font-black text-white font-display tracking-tighter">{formatPrice(wallets.playerWin)}</div>
                </button>
                {/* Deposit Wallet */}
                <button 
                  onClick={() => setShowPaymentUI({ type: 'deposit', active: true, selectedMethod: null })}
                  className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 min-w-[180px] shadow-2xl hover:bg-white/10 hover:border-indigo-500/50 transition-all text-left pointer-events-auto group"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Bank</span>
                    <ArrowUpRight className="w-3 h-3 text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                  <div className="text-3xl font-black text-white font-display tracking-tighter">{formatPrice(wallets.deposit)}</div>
                </button>
              </div>
              {/* Cash Out Wallet (Repositioned below Win) */}
              <button 
                onClick={() => setShowPaymentUI({ type: 'cashout', active: true, selectedMethod: null })}
                className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 min-w-[180px] shadow-2xl hover:bg-white/10 hover:border-rose-500/50 transition-all text-left pointer-events-auto group"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em]">Earnings</span>
                  <ArrowDownLeft className="w-3 h-3 text-rose-400 group-hover:-translate-x-0.5 group-hover:translate-y-0.5 transition-transform" />
                </div>
                <div className="text-3xl font-black text-white font-display tracking-tighter">{formatPrice(wallets.cashOut)}</div>
              </button>
            </div>

          {/* Game Area */}
          <div className="flex flex-col items-center pt-24 lg:pt-32">
            <div className="text-center mb-4 relative z-40">
              <div className="flex flex-col items-center gap-4">
                {/* Mode Toggle */}
                <div className="flex bg-slate-800/50 p-1 rounded-2xl border border-white/10 mb-2">
                  <button
                    onClick={() => {
                      setGameMode('standard');
                      resetWheel();
                    }}
                    className={`px-6 py-2 rounded-xl text-xs font-bold tracking-tight transition-all ${gameMode === 'standard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => {
                      setGameMode('elite');
                      resetWheel();
                    }}
                    className={`px-6 py-2 rounded-xl text-xs font-bold tracking-tight transition-all ${gameMode === 'elite' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                  >
                    Elite (High Stakes)
                  </button>
                </div>

                {gameMode === 'standard' ? (
                  /* Stage Dropdown Selector */
                  <div className="relative">
                    <button
                      onClick={() => setShowStageDropdown(!showStageDropdown)}
                      className="flex items-center gap-3 px-6 py-3 bg-slate-800/80 border border-white/10 rounded-2xl hover:border-blue-500/50 transition-all group"
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Current Stage</span>
                        <span className="text-lg font-black font-display text-white">
                          {currentStageIdx === 0 ? 'STARTER STAGE' : `STAGE ${currentStageIdx}`}
                        </span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showStageDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {showStageDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[300px] overflow-y-auto no-scrollbar"
                        >
                          {STAGES.map((stage, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setCurrentStageIdx(idx);
                                setShowStageDropdown(false);
                                resetWheel();
                              }}
                              className={`
                                w-full flex items-center justify-between px-6 py-4 border-b border-white/5 last:border-0 transition-colors
                                ${currentStageIdx === idx 
                                  ? 'bg-blue-600/20 text-blue-400' 
                                  : 'hover:bg-white/5 text-slate-400 hover:text-white'
                                }
                              `}
                            >
                              <div className="flex flex-col items-start">
                                <span className="text-[10px] font-bold uppercase">{idx === 0 ? 'Starter' : `Stage ${idx}`}</span>
                                <span className="text-sm font-black font-display">{formatPrice(stage.target)}</span>
                              </div>
                              {currentStageIdx === idx && <Sparkles className="w-4 h-4" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-6">
                    {/* Tier Selector */}
                    <div className="flex flex-wrap justify-center gap-2 max-w-md">
                      {ELITE_TIERS.map((tier, idx) => (
                        <button
                          key={tier.name}
                          onClick={() => {
                            setEliteTierIdx(idx);
                            resetWheel();
                          }}
                          className={`px-3 py-2 rounded-xl border transition-all flex flex-col items-center min-w-[80px] ${eliteTierIdx === idx ? `bg-white/10 border-white/40 ${tier.glow}` : 'bg-slate-800/50 border-white/5 opacity-50 hover:opacity-100'}`}
                          style={{ color: tier.color }}
                        >
                          <span className="text-[9px] font-black tracking-widest">{tier.name}</span>
                          <div className="text-xs font-black text-white/90">{tier.multiplier}X</div>
                        </button>
                      ))}
                    </div>
                    
                    {/* Custom Stake Input */}
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Type Your Stake</span>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-500" />
                        <input 
                          type="number"
                          value={customStake}
                          onChange={(e) => setCustomStake(Math.max(1, parseInt(e.target.value) || 0))}
                          className="bg-slate-800/80 border border-white/10 rounded-2xl pl-12 pr-6 py-3 text-xl font-black font-display text-white w-44 focus:border-purple-500 outline-none transition-all text-center"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-cyan-400 animate-pulse">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-black font-display tracking-tight">TARGET WIN: {formatPrice(customStake * currentEliteTier.multiplier)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-4 mt-6">
                {/* Cash Out Button */}
                <button 
                  onClick={() => setShowPaymentUI({ type: 'cashout', active: true, selectedMethod: null })}
                  className="group flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 border border-white/20 rounded-2xl transition-all shadow-lg hover:scale-105 active:scale-95"
                >
                  <ArrowDownLeft className="w-4 h-4 text-white" />
                  <span className="text-xs font-black text-white uppercase tracking-widest">Cash Out</span>
                </button>

                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 bg-slate-800/50 rounded-lg border border-white/5">
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mr-2">Stake</span>
                    <span className="text-sm font-display font-black text-yellow-500">
                      {gameMode === 'standard' ? formatPrice(currentStage.stake) : formatPrice(customStake)}
                    </span>
                  </div>
                  <div className="px-3 py-1.5 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                    <span className="text-[9px] text-cyan-500 uppercase font-bold tracking-wider mr-2">Target</span>
                    <span className="text-sm font-display font-black text-white">
                      {gameMode === 'standard' ? formatPrice(currentStage.target) : formatPrice(customStake * currentEliteTier.multiplier)}
                    </span>
                  </div>
                </div>

                {/* Fund Wallet Button */}
                <button 
                  onClick={() => setShowPaymentUI({ type: 'deposit', active: true, selectedMethod: null })}
                  className="group flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 border border-white/20 rounded-2xl transition-all shadow-lg hover:scale-105 active:scale-95"
                >
                  <span className="text-xs font-black text-white uppercase tracking-widest">Fund Wallet</span>
                  <ArrowUpRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            <div className="relative flex flex-col items-center justify-center min-h-[400px] lg:min-h-[650px] w-full">
              {/* Mobile/Tablet Wallet Bar (Visible when HUD is hidden) */}
              <div className="xl:hidden w-full mb-6 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-2 bg-slate-800/50 rounded-xl border border-white/5 flex flex-col">
                  <span className="text-[7px] font-bold text-yellow-500 uppercase">Win</span>
                  <span className="text-sm font-black text-white">{formatPrice(wallets.playerWin)}</span>
                </div>
                <button 
                  onClick={() => setShowPaymentUI({ type: 'deposit', active: true, selectedMethod: null })}
                  className="p-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-xl border border-blue-500/30 flex flex-col text-left transition-colors"
                >
                  <span className="text-[7px] font-bold text-blue-400 uppercase">Deposit</span>
                  <span className="text-sm font-black text-white">{formatPrice(wallets.deposit)}</span>
                </button>
                <button 
                  onClick={() => setShowPaymentUI({ type: 'cashout', active: true, selectedMethod: null })}
                  className="p-2 bg-purple-600/20 hover:bg-purple-600/30 rounded-xl border border-purple-500/30 flex flex-col text-left transition-colors"
                >
                  <span className="text-[7px] font-bold text-purple-400 uppercase">Cash Out</span>
                  <span className="text-sm font-black text-white">{formatPrice(wallets.cashOut)}</span>
                </button>
              </div>

              {/* 3D Wheel Container - ENLARGED */}
              <div className="relative w-[300px] h-[300px] sm:w-[480px] sm:h-[480px] lg:w-[620px] lg:h-[620px] perspective-[1500px] transition-all duration-500">
                
                {/* Multicolor Bead Ring Effect (Spooling & Bubbling) */}
                <div className="absolute inset-[-40px] sm:inset-[-60px] lg:inset-[-80px] pointer-events-none z-0">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                    className="w-full h-full relative"
                  >
                    {[...Array(60)].map((_, i) => {
                      const colors = [
                        '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3',
                        '#FF1493', '#00CED1', '#FFD700', '#ADFF2F', '#FF4500'
                      ];
                      const color = colors[i % colors.length];
                      return (
                        <div 
                          key={i}
                          className="absolute top-0 left-1/2 w-0 h-full -translate-x-1/2"
                          style={{ transform: `rotate(${i * 6}deg)` }}
                        >
                          <motion.div 
                            animate={{ 
                              scale: [1, 1.5, 1],
                              filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"],
                            }}
                            transition={{ 
                              duration: 2 + (i % 3), 
                              repeat: Infinity, 
                              delay: i * 0.1,
                              ease: "easeInOut"
                            }}
                            className="w-4 h-4 sm:w-6 sm:h-6 lg:w-9 lg:h-9 rounded-full"
                            style={{ 
                              backgroundColor: color,
                              boxShadow: `0 0 25px ${color}cc, inset 0 -4px 8px rgba(0,0,0,0.5), inset 0 4px 8px rgba(255,255,255,0.7)`
                            }}
                          />
                        </div>
                      );
                    })}
                  </motion.div>
                </div>

                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-40">
                  <div className="w-10 h-14 bg-gradient-to-b from-red-500 to-red-700 shadow-[0_10px_20px_rgba(0,0,0,0.5)]" 
                       style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
                </div>

                {/* The Wheel with 3D Emboss Effect */}
                <motion.div
                  animate={controls}
                  className={`w-full h-full rounded-full border-[24px] relative overflow-hidden transition-all duration-500 border-yellow-600 shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_0_0_6px_rgba(0,0,0,0.5),0_50px_100px_-20px_rgba(0,0,0,1),inset_0_15px_30px_rgba(255,255,255,0.4),inset_0_-15px_30px_rgba(0,0,0,0.6)] ${
                    gameMode === 'elite' ? currentEliteTier.glow : ''
                  }`}
                  style={{ 
                    background: `conic-gradient(${segments.map((seg, i) => `${seg.color} ${(i * 360) / segments.length}deg ${((i + 1) * 360) / segments.length}deg`).join(', ')})`
                  }}
                >
                  {/* Lighting Overlay for Emboss Effect */}
                  <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.3)_0%,transparent_60%)] pointer-events-none z-20" />
                  <div className="absolute inset-0 rounded-full shadow-[inset_0_0_120px_rgba(0,0,0,0.5)] pointer-events-none z-20" />
                  <div className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,rgba(255,255,255,0.1)_0%,transparent_50%,rgba(0,0,0,0.2)_100%)] pointer-events-none z-20" />

                  {/* Rim Lights */}
                  <div className="absolute inset-[-24px] rounded-full pointer-events-none z-30">
                    {[...Array(24)].map((_, i) => (
                      <div 
                        key={i}
                        className="absolute w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,1)] animate-pulse"
                        style={{
                          top: '50%',
                          left: '50%',
                          transform: `rotate(${i * 15}deg) translateY(-50%) translateX(-50%) translateY(-300px)`,
                          animationDelay: `${i * 0.1}s`
                        }}
                      />
                    ))}
                  </div>

                  {/* Dividers */}
                  <div className="absolute inset-0 rounded-full pointer-events-none z-10">
                    {segments.map((_, i) => (
                      <div 
                        key={i}
                        className="absolute top-0 left-1/2 w-1 h-1/2 bg-black/20 origin-bottom -translate-x-1/2"
                        style={{ transform: `rotate(${i * (360 / segments.length)}deg)` }}
                      />
                    ))}
                  </div>

                  {/* Labels */}
                  {segments.map((seg, i) => {
                    const angle = 360 / segments.length;
                    const rotation = i * angle + angle / 2;
                    return (
                      <div
                        key={i}
                        className="absolute top-0 left-1/2 w-0 h-1/2 origin-bottom flex items-start justify-center pt-10 -translate-x-1/2 z-20"
                        style={{ transform: `rotate(${rotation}deg)` }}
                      >
                        <div className="text-black font-display font-black text-xl sm:text-2xl tracking-tighter whitespace-nowrap drop-shadow-[0_2px_4px_rgba(255,255,255,0.4)]">
                          {seg.label}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Center Cap - Enhanced 3D Hub */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-br from-white via-slate-200 to-slate-400 rounded-full border-[6px] border-yellow-500 z-40 flex items-center justify-center shadow-[0_15px_30px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.8)]">
                    <div className="flex flex-col items-center">
                      <span className="text-red-600 font-display font-black text-[10px] leading-none mb-0.5">EFADO</span>
                      <div className="w-2 h-2 bg-slate-800 rounded-full shadow-inner" />
                    </div>
                  </div>
                </motion.div>

                {/* 3D Base/Shadow */}
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-[95%] h-16 bg-black/70 blur-3xl rounded-full -z-10" />
              </div>

              {/* Controls */}
              <div className="mt-12 flex flex-col items-center gap-6">
                <AnimatePresence mode="wait">
                  {winner ? (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="flex flex-col items-center p-8 rounded-[2rem] transition-all duration-500 border border-white/5 bg-slate-800/20 backdrop-blur-xl"
                    >
                      <div className="flex items-center gap-3 text-yellow-400 mb-4">
                        <Trophy className={`w-8 h-8 ${isTargetWin ? 'animate-bounce' : ''}`} />
                        <h2 className={`font-extrabold tracking-tight ${isTargetWin ? 'text-5xl text-yellow-500' : 'text-3xl text-yellow-500'}`}>
                          Winner!
                        </h2>
                      </div>
                      <motion.div 
                        initial={{ scale: 1 }}
                        animate={isTargetWin ? { 
                          scale: [1, 1.2, 1],
                          filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
                        } : { scale: 1.1 }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className={`font-display font-extrabold text-white mb-8 ${isTargetWin ? 'text-7xl md:text-8xl' : 'text-5xl md:text-6xl'}`}
                      >
                        {formatPrice(parseInt(winner))}
                      </motion.div>
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <button 
                          onClick={resetWheel}
                          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-bold"
                        >
                          <RotateCw className="w-4 h-4" /> Spin Again
                        </button>
                        <button 
                          onClick={() => {
                            onClose();
                            window.location.hash = 'games';
                          }}
                          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold"
                        >
                          <Gamepad2 className="w-4 h-4" /> Change Stage
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      {maintenanceError && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="px-6 py-2 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-2"
                        >
                          <ShieldAlert className="w-3 h-3" />
                          System Maintenance - Spins Locked
                        </motion.div>
                      )}
                      {insufficientFundsError && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="px-6 py-2 bg-red-650 text-white border border-red-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-2"
                        >
                          <ShieldAlert className="w-3 h-3 text-red-100" />
                          Insufficient Funds / Balance
                        </motion.div>
                      )}
                      <button
                        disabled={isSpinning || systemSettings.maintenanceMode}
                        onClick={spinWheel}
                        className={`
                          px-20 py-6 rounded-2xl font-display font-extrabold text-2xl tracking-tight transition-all
                          ${isSpinning 
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                            : gameMode === 'standard'
                              ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_20px_40px_rgba(79,70,229,0.3)] hover:scale-105 active:scale-95'
                              : 'bg-purple-600 text-white hover:bg-purple-500 shadow-[0_20px_40px_rgba(147,51,234,0.3)] hover:scale-105 active:scale-95'
                          }
                        `}
                      >
                        {isSpinning ? 'Spinning...' : gameMode === 'standard' ? 'Spin Now' : 'Elite Spin'}
                      </button>
                      
                      {!isSpinning && (
                        <button 
                          onClick={() => {
                            onClose();
                            window.location.hash = 'games';
                          }}
                          className="text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                        >
                          <Gamepad2 className="w-3 h-3" /> Back to Arena
                        </button>
                      )}
                    </div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Target: {gameMode === 'standard' ? formatPrice(currentStage.target) : formatPrice(customStake * currentEliteTier.multiplier)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
      /* Wallets View */
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="pt-24 lg:pt-32 px-4 lg:px-8 pb-12"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
              <Wallet className="w-8 h-8 text-purple-500" />
            </div>
            <div>
              <h3 className="text-4xl font-display font-black text-white uppercase tracking-tighter">Your Wallets</h3>
              <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Manage your game funds and rewards</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowPaymentUI({ type: 'deposit', active: true, selectedMethod: null })}
              className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-display font-black text-white uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
            >
              <ArrowDownLeft className="w-5 h-5" />
              Deposit {formatPrice(50)}
            </button>
            <button 
              onClick={() => setShowPaymentUI({ type: 'cashout', active: true, selectedMethod: null })}
              className="flex items-center gap-3 px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-2xl font-display font-black text-white uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
            >
              <ArrowUpRight className="w-5 h-5" />
              Cash Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Deposit Wallet Card */}
          <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl group hover:border-blue-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-blue-600/20 rounded-2xl border border-blue-500/30">
                  <ArrowDownLeft className="w-8 h-8 text-blue-500" />
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-white font-display">{formatPrice(wallets.deposit)}</div>
                </div>
              </div>
              <h4 className="text-xl font-black text-white uppercase tracking-tight mb-2">Deposit Wallet</h4>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">Total funds deposited into your account for playing games.</p>
            </div>
            <button
              onClick={() => setShowPaymentUI({ type: 'deposit', active: true, selectedMethod: null })}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              <ArrowDownLeft className="w-4 h-4 animate-bounce" />
              Fund Your Wallet
            </button>
          </div>

          {/* Player Wallet Card (Win Wallet) */}
          <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl group hover:border-yellow-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-yellow-500/20 rounded-2xl border border-yellow-500/30">
                  <Coins className="w-8 h-8 text-yellow-500" />
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-white font-display">{formatPrice(wallets.playerWin)}</div>
                </div>
              </div>
              <h4 className="text-xl font-black text-white uppercase tracking-tight mb-2">Player Wallet</h4>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">Funds available for playing the Lucky Spin and other games.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowPaymentUI({ type: 'deposit', active: true, selectedMethod: null })}
                className="py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-1.5"
              >
                Fund Wallet
              </button>
              <button
                onClick={() => setShowPaymentUI({ type: 'cashout', active: true, selectedMethod: null })}
                className="py-4 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-1.5"
              >
                Withdraw Wins
              </button>
            </div>
          </div>

          {/* Cash Out Wallet Card */}
          <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl group hover:border-green-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-green-500/20 rounded-2xl border border-green-500/30">
                  <ArrowUpRight className="w-8 h-8 text-green-500" />
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-white font-display">{formatPrice(wallets.cashOut)}</div>
                </div>
              </div>
              <h4 className="text-xl font-black text-white uppercase tracking-tight mb-2">Cash Out Wallet</h4>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">Winnings ready to be withdrawn to your bank or crypto wallet.</p>
            </div>
            <button
              onClick={() => setShowPaymentUI({ type: 'cashout', active: true, selectedMethod: null })}
              className="w-full py-4 bg-green-500 hover:bg-green-400 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
            >
              <ArrowUpRight className="w-4 h-4 animate-pulse" />
              Cash Out / Withdraw Profit
            </button>
          </div>

          {/* Partner Wallet/Admin Card */}
          <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl group hover:border-purple-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-purple-600/20 rounded-2xl border border-purple-500/30">
                  <ShieldCheck className="w-8 h-8 text-purple-500" />
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-white/30 font-display">{formatPrice(wallets.admin)}</div>
                </div>
              </div>
              <h4 className="text-xl font-black text-white/50 uppercase tracking-tight mb-2">Admin Wallet</h4>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">Total house profit from game operations (System View).</p>
            </div>
            <div className="p-4 bg-purple-950/20 rounded-2xl border border-purple-500/20 text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Locked Platform Settlement Node</span>
            </div>
          </div>
        </div>
      </motion.div>
    )}
    </div>

        {/* Extended Highly-Polished Unified EFADO Payment/Cashout Platform */}
        <AnimatePresence>
          {showPaymentUI.active && (
            <div className="fixed inset-0 z-[110]">
              <PaymentPlatform 
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
                    console.error('Wallet update failed during spin wheel payment complete', err);
                    throw err;
                  }
                }}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
