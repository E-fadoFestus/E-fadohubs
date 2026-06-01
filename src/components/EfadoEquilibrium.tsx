import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { 
  Dices, 
  Trophy, 
  RotateCw, 
  Sparkles, 
  X, 
  TrendingUp, 
  Target, 
  Coins, 
  ShieldCheck, 
  Zap,
  Info,
  Wallet,
  PlayCircle,
  Plus,
  ArrowUpRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, Transaction } from '../types';
import { useCurrency } from '../lib/CurrencyContext';
import { EasyPaymentPlatform } from './EasyPaymentPlatform';

interface EfadoEquilibriumProps {
  user: UserProfile;
  onClose: () => void;
  onResult: (multiplier: number, bet: number, gameId: 'spinGame' | 'moneyCard' | 'tradingGame' | 'equilibrium', payoutOverride?: number) => Promise<void>;
  onGameStart?: (bet: number, gameId: string) => Promise<void>;
  onUpdateBalance: (amount: number, type: 'deposit' | 'withdrawal') => Promise<void>;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => Promise<void>;
}

// Slot Value Interpretation
const VALUE_MAP: Record<number, number> = {
  1: 100,
  2: 200,
  3: 300
};

export const EfadoEquilibrium: React.FC<EfadoEquilibriumProps> = ({ 
  user, 
  onClose, 
  onResult, 
  onGameStart,
  onUpdateBalance,
  onAddTransaction
}) => {
  const { formatPrice } = useCurrency();
  const [isSpinning, setIsSpinning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [slots, setSlots] = useState<number[]>([1, 2, 3]);
  const [result, setResult] = useState<{ 
    type: 'none' | 'pair' | 'triple';
    payout: number;
  } | null>(null);
  
  const [currentStage, setCurrentStage] = useState(0); // 0 = Starter, 1-20 = Advanced
  
  // Base values for Starter Stage
  const baseStake = 100;
  const baseBigWin = 300;
  const baseSmallWin = 50;

  // Calculate current stage values (Doubling sequence)
  const stakeAmount = baseStake * Math.pow(2, currentStage);
  const bigWinAmount = baseBigWin * Math.pow(2, currentStage);
  const smallWinAmount = baseSmallWin * Math.pow(2, currentStage);

  const [showRules, setShowRules] = useState(false);
  const [shake, setShake] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentType, setPaymentType] = useState<'deposit' | 'withdraw'>('deposit');
  const [isProcessing, setIsProcessing] = useState(false);

  const controls1 = useAnimation();
  const controls2 = useAnimation();
  const controls3 = useAnimation();
  const machineControls = useAnimation();
  const isSpinningRef = React.useRef(false);

  // Particle colors for comets
  const starColors = ['#FACC15', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#FFFFFF'];

  // Audio generation for "sweet to the ear" counting background
  const playCountingSound = (frequency: number = 440, duration: number = 0.1, type: OscillatorType = 'sine') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

      // Softer gain for "sweet to the ear"
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
      
      // Cleanup
      setTimeout(() => audioCtx.close(), duration * 1000 + 100);
    } catch (e) {
      // Audio might be blocked by browser policy
    }
  };

  const rollSlots = async () => {
    if (isSpinning || user.depositWallet < stakeAmount) return;

    setIsSpinning(true);
    isSpinningRef.current = true;
    setResult(null);
    setTimeLeft(30);

    // Deduct stake upfront to ensure Admin always gets it
    if (onGameStart) {
      await onGameStart(stakeAmount, 'equilibrium');
    }

    // Initial sound
    playCountingSound(880, 0.2, 'triangle');

    // Rapidly update slots for visual "spin" effect
    const spinInterval = setInterval(() => {
      if (!isSpinningRef.current) {
        clearInterval(spinInterval);
        return;
      }
      setSlots([
        Math.floor(Math.random() * 3) + 1,
        Math.floor(Math.random() * 3) + 1,
        Math.floor(Math.random() * 3) + 1
      ]);
    }, 100);

    // Continuous sound and countdown logic
    const countdownInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          isSpinningRef.current = false;
          return 0;
        }
        
        // Rhythmic "sweet" chime every second
        const freq = prev % 2 === 0 ? 523.25 : 659.25; // C5 and E5
        playCountingSound(freq, 0.1, 'sine');
        
        return prev - 1;
      });
    }, 1000);

    const newSlots = [
      Math.floor(Math.random() * 3) + 1,
      Math.floor(Math.random() * 3) + 1,
      Math.floor(Math.random() * 3) + 1
    ];

    // Animation sequences - adjusted for 30 seconds
    const animateSlot = async (controls: any, index: number, finalValue: number) => {
      // Fast jitter spin
      await controls.start({
        y: [-15, 15],
        transition: { 
          duration: 0.15, 
          repeat: Infinity, 
          ease: "linear" 
        }
      });

      // Wait for the 30 second countdown to finish
      while (isSpinningRef.current) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Stop and land
      await controls.stop();
      setSlots(prev => {
        const next = [...prev];
        next[index] = finalValue;
        return next;
      });
      
      await controls.start({
        y: [20, 0],
        scale: [1.2, 1],
        transition: { duration: 0.5, type: "spring" }
      });
    };

    // Start all slots
    await Promise.all([
      animateSlot(controls1, 0, newSlots[0]),
      animateSlot(controls2, 1, newSlots[1]),
      animateSlot(controls3, 2, newSlots[2])
    ]);

    // Final "success" sound
    playCountingSound(1046.50, 0.4, 'triangle'); // C6 Chime

    // Calculate outcomes
    const uniqueValues = new Set(newSlots).size;
    let winType: 'none' | 'pair' | 'triple' = 'none';
    let multiplier = 0;
    let payout = 0;

    if (uniqueValues === 1) {
      winType = 'triple';
      multiplier = 3; 
      payout = bigWinAmount;
      setShake(true);
      machineControls.start({
        scale: [1, 1.1, 1],
        x: [0, -10, 10, -10, 10, 0],
        y: [0, 5, -5, 5, -5, 0],
        transition: { duration: 0.5, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }
      });
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#FACC15', '#F59E0B', '#FFFFFF']
      });
    } else if (uniqueValues === 2) {
      winType = 'pair';
      multiplier = 0.5;
      payout = smallWinAmount;
      setShake(true);
      machineControls.start({
        scale: [1, 1.05, 1],
        x: [0, -5, 5, -5, 5, 0],
        transition: { duration: 0.4 }
      });
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
    }

    setResult({ type: winType, payout });
    setTimeout(() => setShake(false), 1000);

    // Update Wallets via App's central logic
    // Using 'equilibrium' ID to track stats accurately.
    // We pass multiplier=0 and bet=0 because the stake was already deducted upfront.
    // The payout is passed as the 4th parameter (payoutOverride) to credit it directly.
    await onResult(0, 0, 'equilibrium', payout);
    
    setIsSpinning(false);
  };

  const handlePaymentComplete = async (amount: number, method: string) => {
    setIsProcessing(true);
    try {
      if (paymentType === 'deposit') {
        await onUpdateBalance(amount, 'deposit');
        await onAddTransaction({
          userId: user.uid,
          type: 'deposit',
          amount: amount,
          currency: 'USD',
          status: 'completed',
          method: method || 'Direct Deposit',
          description: 'Equilibrium Wallet Top-up'
        });
      } else {
        // Withdrawal from playerWallet (linked cash out)
        await onUpdateBalance(amount, 'withdrawal');
        await onAddTransaction({
          userId: user.uid,
          type: 'withdrawal',
          amount: amount,
          currency: 'USD',
          status: 'pending',
          method: method || 'Bank Transfer',
          description: 'Equilibrium Cash Out Request'
        });
      }
      setShowPayment(false);
    } catch (error) {
      console.error('Payment processing failed', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-6 lg:p-10 shadow-2xl overflow-hidden glass-card-ultra">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500" />
        
        <AnimatePresence>
          {showPayment && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
              <div className="w-full max-w-[500px] h-[90vh] max-h-[750px] flex flex-col">
                <EasyPaymentPlatform 
                  user={user}
                  type={paymentType}
                  onClose={() => setShowPayment(false)}
                  onComplete={handlePaymentComplete}
                  hub="EQUILIBRIUM"
                  purpose={paymentType === 'deposit' ? "EFADO Equilibrium Stake Funding" : "EFADO Equilibrium Dividend Extraction"}
                />
              </div>
            </div>
          )}
        </AnimatePresence>

        <div className="absolute -top-24 -left-24 w-64 h-64 bg-yellow-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-orange-500/10 rounded-full blur-[100px] animate-pulse" />

        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all z-50"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Info & Stats */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-yellow-500/20 rounded-2xl border border-yellow-500/30">
                  <Dices className="w-8 h-8 text-yellow-500" />
                </div>
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                  EFADO <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Equilibrium</span>
                </h2>
              </div>
              <p className="text-slate-400 font-medium leading-relaxed">
                A round-based tactical matching engine. Align the values {'{1, 2, 3}'} for high-frequency payouts. 
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Win Wallet</div>
                  <div className="text-2xl font-black text-white">{formatPrice(user.playerWallet)}</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Stake Req.</div>
                  <div className="text-2xl font-black text-yellow-500">{formatPrice(stakeAmount)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4">
                   <div className="flex justify-between items-center mb-1">
                      <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Deposit Wallet</div>
                      <Plus className="w-3 h-3 text-indigo-400 cursor-pointer" onClick={() => { setPaymentType('deposit'); setShowPayment(true); }} />
                   </div>
                   <div className="text-xl font-black text-white">{formatPrice(user.depositWallet)}</div>
                   <button 
                    onClick={() => { setPaymentType('deposit'); setShowPayment(true); }}
                    className="w-full mt-2 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all"
                  >
                    Fund Wallet
                  </button>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                   <div className="flex justify-between items-center mb-1">
                      <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Cash Out Wallet</div>
                      <ArrowUpRight className="w-3 h-3 text-emerald-400 cursor-pointer" onClick={() => { setPaymentType('withdraw'); setShowPayment(true); }} />
                   </div>
                   <div className="text-xl font-black text-white">{formatPrice(user.playerWallet)}</div>
                    <button 
                    onClick={() => { setPaymentType('withdraw'); setShowPayment(true); }}
                    className="w-full mt-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all"
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-sm font-bold text-slate-200">Big Win (Triple)</span>
                </div>
                <span className="text-lg font-black text-emerald-500">+{formatPrice(bigWinAmount)}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-sm font-bold text-slate-200">Small Win (Pair)</span>
                </div>
                <span className="text-lg font-black text-blue-500">+{formatPrice(smallWinAmount)}</span>
              </div>
            </div>

            {/* Stage Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Tactical Stages</span>
                <span className="text-[10px] font-black text-yellow-500 uppercase">2x Incremental Power</span>
              </div>
              <div className="grid grid-cols-5 gap-2 max-h-[160px] overflow-y-auto no-scrollbar p-1">
                {[...Array(21)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => !isSpinning && setCurrentStage(i)}
                    disabled={isSpinning}
                    className={`
                      aspect-square flex flex-col items-center justify-center rounded-xl border transition-all
                      ${currentStage === i 
                        ? 'bg-yellow-500 border-yellow-400 text-slate-900 shadow-[0_0_15px_rgba(234,179,8,0.4)] scale-105' 
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }
                    `}
                  >
                    <span className="text-[9px] font-black">{i === 0 ? 'START' : `S${i}`}</span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setShowRules(!showRules)}
              className="flex items-center gap-2 text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors mb-2"
            >
              <Info className="w-4 h-4" /> Game Rules & Stake Handling
            </button>
            <AnimatePresence>
              {showRules && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-slate-800/50 rounded-2xl p-4 border border-white/5 overflow-hidden text-[11px] text-slate-400 leading-normal space-y-2 no-scrollbar"
                >
                  <p>• Tactical Stages: 21 tiers (Starter + 20 Stages).</p>
                  <p>• Incremental Power: Each stage doubles the stake and payouts of the previous one (2x Multiple).</p>
                  <p>• High-Frequency Alignments: Use the Selector to match your risk profile.</p>
                  <p>• Result: 1 → 100, 2 → 200, 3 → 300 (Raw Values).</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Game Area */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center relative">
            {/* Slot Machine Display */}
            <motion.div 
              animate={machineControls}
              className="relative p-8 rounded-[3rem] border border-white/20 shadow-[0_0_80px_rgba(245,158,11,0.2)] w-full max-w-xl mb-12 overflow-hidden bg-slate-900 group"
              style={{
                backgroundImage: isSpinning 
                  ? 'linear-gradient(-45deg, #FF0000, #00FF00, #0000FF, #FFFF00, #800080, #FFD700)'
                  : undefined,
                backgroundSize: '400% 400%',
              }}
            >
              {/* Internal Animated Background when spinning */}
              {isSpinning && (
                <style>
                  {`
                    @keyframes gradientShift {
                      0% { background-position: 0% 50%; filter: hue-rotate(0deg); }
                      50% { background-position: 100% 50%; filter: hue-rotate(180deg); }
                      100% { background-position: 0% 50%; filter: hue-rotate(360deg); }
                    }
                    .animate-slot-gradient {
                      animation: gradientShift 4s linear infinite;
                    }
                  `}
                </style>
              )}
              
              <div className={`absolute inset-0 opacity-40 pointer-events-none mix-blend-screen bg-slate-950 transition-all duration-1000 ${isSpinning ? 'animate-slot-gradient' : ''}`} />

              {/* Comet/Star Emission during gameplay - dropping from boxes */}
              {isSpinning && (
                <div className="absolute inset-0 pointer-events-none z-10">
                  {[0, 1, 2].map(slotIndex => (
                    <React.Fragment key={slotIndex}>
                      {Array.from({ length: 35 }).map((_, i) => (
                        <motion.div
                          key={`${slotIndex}-${i}`}
                          initial={{ 
                            x: `${33 * slotIndex + 16.5}%`, 
                            y: "40%", 
                            scale: Math.random() * 0.5 + 0.1,
                            opacity: 0,
                            rotate: Math.random() * 360
                          }}
                          animate={{ 
                            y: ["40%", "130%"], 
                            x: [
                              `${33 * slotIndex + 16.5}%`, 
                              `${33 * slotIndex + 16.5 + (Math.random() * 80 - 40)}%`
                            ],
                            opacity: [0, 1, 1, 0],
                            rotate: Math.random() * 1080
                          }}
                          transition={{ 
                            duration: Math.random() * 2.5 + 1.5, 
                            repeat: Infinity, 
                            delay: Math.random() * 5,
                            ease: "linear"
                          }}
                          style={{
                            position: 'absolute',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: starColors[Math.floor(Math.random() * starColors.length)],
                            boxShadow: `0 0 20px ${starColors[Math.floor(Math.random() * starColors.length)]}`,
                            filter: 'blur(0.5px)'
                          }}
                        />
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              )}
              
              {/* Visual Timer Progress Bar */}
              {isSpinning && (
                <div className="absolute top-0 left-12 right-12 mt-4 space-y-2 z-20">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-yellow-500 uppercase tracking-tighter drop-shadow-md">Synchronizing Neural Patterns</span>
                    <span className="text-xl font-display font-black text-white italic drop-shadow-lg">{timeLeft}s</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/5 backdrop-blur-sm">
                    <motion.div 
                      initial={{ width: '100%' }}
                      animate={{ width: `${(timeLeft / 30) * 100}%` }}
                      transition={{ duration: 1, ease: "linear" }}
                      className="h-full bg-gradient-to-r from-yellow-400 via-white to-orange-500 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-center gap-4 lg:gap-6 mt-12 relative z-20">
                {[controls1, controls2, controls3].map((controls, i) => (
                   <div key={i} className="relative w-28 h-36 lg:w-40 lg:h-52 bg-slate-800/80 backdrop-blur-xl rounded-[2rem] border-2 border-white/10 overflow-hidden flex items-center justify-center shadow-2xl glass-card">
                    <div className="absolute top-0 right-0 h-full w-2 bg-gradient-to-b from-transparent via-yellow-500/50 to-transparent" />
                    <div className="absolute top-0 left-0 h-full w-2 bg-gradient-to-b from-transparent via-yellow-500/50 to-transparent" />
                    
                    {/* Dropping Stars Effect */}
                    {isSpinning && (
                      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
                        {[...Array(6)].map((_, j) => (
                          <motion.div
                            key={j}
                            initial={{ y: -20, x: Math.random() * 100, opacity: 0 }}
                            animate={{ 
                              y: [0, 200], 
                              opacity: [0, 1, 0],
                              scale: [0.5, 1, 0.5]
                            }}
                            transition={{ 
                              duration: 0.8 + Math.random() * 0.5, 
                              repeat: Infinity,
                              delay: j * 0.2
                            }}
                            className="absolute"
                          >
                            <TrendingUp className="w-2 h-2 text-yellow-400 rotate-45" />
                          </motion.div>
                        ))}
                      </div>
                    )}

                    <motion.div 
                      key={slots[i]}
                      initial={{ opacity: 0, y: 20, scale: 0.5 }}
                      animate={isSpinning ? {
                         backgroundColor: ['rgba(30, 41, 59, 0.8)', 'rgba(79, 70, 229, 0.4)', 'rgba(16, 185, 129, 0.4)', 'rgba(30, 41, 59, 0.8)'],
                         opacity: 1, y: 0, scale: 1
                      } : { opacity: 1, y: 0, scale: 1 }}
                      transition={isSpinning ? { duration: 1, repeat: Infinity } : { type: "spring", stiffness: 300, damping: 20 }}
                      className="text-5xl lg:text-7xl font-black text-white font-display z-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] tabular-nums"
                    >
                      {VALUE_MAP[slots[i]]}
                    </motion.div>
                    
                    {/* Bead decoration inside slots */}
                    <div className="absolute top-4 left-4 flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                      <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse delay-75" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Status Header */}
              <div className="mt-8 text-center min-h-[40px]">
                <AnimatePresence mode="wait">
                  {result && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex items-center gap-3 px-6 py-2 bg-white/5 rounded-full border border-white/10"
                    >
                      {result.type !== 'none' ? (
                        <>
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm font-black text-emerald-400 uppercase tracking-widest font-display">
                            {result.type === 'triple' ? `TRIPLE MATCH! + ${formatPrice(bigWinAmount)}` : `PAIR MATCH! + ${formatPrice(smallWinAmount)}`}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-black text-rose-500 uppercase tracking-widest font-display">
                          NO PAIN NO WIN
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Launch Controls */}
            <div className="w-full max-w-sm space-y-6">
              <div className="flex items-center justify-between px-6 py-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-slate-500" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Entry Fee</span>
                </div>
                <div className="text-lg font-black text-yellow-500">{formatPrice(stakeAmount)}</div>
              </div>

              <button 
                onClick={rollSlots}
                disabled={isSpinning || user.depositWallet < stakeAmount}
                className={`
                  relative w-full py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-4 transition-all uppercase tracking-[0.2em] shadow-2xl overflow-hidden
                  ${isSpinning || user.depositWallet < stakeAmount
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5' 
                    : 'bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-600 text-white hover:scale-[1.02] active:scale-[0.98] shadow-orange-500/20'
                  }
                `}
              >
                {isSpinning ? (
                  <>
                    <RotateCw className="w-6 h-6 animate-spin opacity-50" />
                    <span className="relative z-10">ANALYZING ({timeLeft}S)</span>
                    <motion.div 
                      className="absolute inset-0 bg-white/5"
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-6 h-6" />
                    Execute Round
                  </>
                )}
              </button>

              {user.depositWallet < stakeAmount && !isSpinning && (
                <p className="text-center text-rose-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                  Insufficient Funds / Balance
                </p>
              )}
              
              <div className="flex items-center justify-center gap-3 py-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.3em]">Neural Gaming System Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
