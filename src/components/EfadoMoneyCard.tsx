import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Wallet, 
  RotateCcw, 
  Trophy, 
  AlertCircle, 
  Coins,
  Sparkles,
  Volume2,
  VolumeX,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  PlusCircle,
  ArrowUpCircle,
  Smartphone,
  Building2,
  Hash,
  Bitcoin,
  Globe,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  QrCode,
  Maximize
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { UserProfile, AdminStats, Transaction } from '../types';
import { useCurrency } from '../lib/CurrencyContext';
import { EasyPaymentPlatform } from './EasyPaymentPlatform';

interface Card {
  id: number;
  value: number;
  color: string;
  isBigWin: boolean;
}

interface EfadoMoneyCardProps {
  onClose: () => void;
  user: UserProfile;
  onResult: (multiplier: number, bet: number, gameId: 'spinGame' | 'moneyCard' | 'tradingGame' | 'equilibrium', payoutOverride?: number) => Promise<void>;
  onUpdateBalance?: (amount: number, type: 'deposit' | 'withdrawal', accountDetails?: any) => Promise<void>;
}

export const EfadoMoneyCard: React.FC<EfadoMoneyCardProps> = ({ onClose, user, onResult, onUpdateBalance }) => {
  const { formatPrice, selectedCurrency } = useCurrency();
  const [currentStage, setCurrentStage] = useState(0);
  const [cards, setCards] = useState<Card[]>([]);
  const [shuffling, setShuffling] = useState(false);
  const [revealedCardId, setRevealedCardId] = useState<number | null>(null);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'REVEALED'>('IDLE');
  const [isMuted, setIsMuted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentModalType, setPaymentModalType] = useState<'FUND' | 'CASHOUT'>('FUND');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentStep, setPaymentStep] = useState<'METHOD' | 'DETAILS' | 'AMOUNT' | 'QR_SCAN' | 'SUCCESS'>('METHOD');
  const [qrScanning, setQrScanning] = useState(false);
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [isBigWinCelebration, setIsBigWinCelebration] = useState(false);

  // Derived from user prop
  const balance = user.depositWallet;
  const winWallet = user.playerWallet;
  const depositWallet = user.depositWallet;

  // Constants based on user requirements
  const starterBaseValues = [4, 6, 8, 10, 12];
  const multiplier = Math.pow(2, currentStage);
  
  const baseValues = starterBaseValues.map(v => v * multiplier);
  const totalSum = baseValues.reduce((a, b) => a + b, 0);
  const stake = (totalSum / 2) + (totalSum * 0.10);
  const bigWinValue = totalSum;
  const targetPrice = bigWinValue; // Target price is the Big Win value

  const cardColors = [
    'from-emerald-400 to-teal-600',
    'from-blue-500 to-indigo-700',
    'from-violet-500 to-purple-800',
    'from-rose-500 to-red-700',
    'from-cyan-400 to-sky-600',
    'from-amber-400 to-yellow-600' // Big Win Gold
  ];

  const initializeCards = useCallback(() => {
    const allValues = [...baseValues, bigWinValue];
    const newCards = allValues.map((val, index) => ({
      id: index,
      value: val,
      color: cardColors[index],
      isBigWin: index === 5
    }));
    setCards(newCards);
  }, [currentStage]);

  useEffect(() => {
    initializeCards();
    if (currentStage === 0) {
      narrate("Welcome to EFADO Money Card Starter Stage. Place your stake and find the big win!");
    } else {
      narrate(`Stage ${currentStage} activated. Multiplier is ${multiplier}x. Good luck!`);
    }
  }, [initializeCards, currentStage]);

  const playSound = (type: 'win' | 'loss' | 'shuffle' | 'click' | 'applause') => {
    if (isMuted) return;
    const sounds = {
      win: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
      loss: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
      shuffle: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
      click: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
      applause: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3'
    };
    const audio = new Audio(sounds[type]);
    audio.volume = type === 'applause' ? 0.6 : 0.4;
    audio.play().catch(() => {});
  };

  const narrate = (text: string) => {
    if (isMuted) return;
    // Cancel any ongoing speech to prevent overlapping/looping
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  const handleStart = () => {
    if (balance < stake) {
      setMessage("Insufficient Funds / Balance");
      setTimeout(() => setMessage(null), 3500);
      return;
    }

    setGameState('PLAYING');
    setRevealedCardId(null);
    setShuffling(true);
    playSound('shuffle');
    narrate("Shuffling the cards. Keep your eyes on the prize!");

    // Shuffle the cards array AND randomize values across colors
    setTimeout(() => {
      const allValues = [...baseValues, bigWinValue];
      // Shuffle the values independently of the card objects
      const shuffledValues = [...allValues].sort(() => Math.random() - 0.5);
      
      setCards(prev => {
        // Reassign shuffled values to existing card objects (which have fixed colors)
        const updatedCards = prev.map((card, index) => ({
          ...card,
          value: shuffledValues[index],
          isBigWin: shuffledValues[index] === bigWinValue
        }));
        // Then shuffle the positions of the cards themselves
        return [...updatedCards].sort(() => Math.random() - 0.5);
      });
      
      setShuffling(false);
      narrate("Cards are set. Pick your lucky card now!");
    }, 1500);
  };

  const handleCardClick = (card: Card) => {
    if (shuffling || revealedCardId !== null) return;

    if (gameState === 'IDLE') {
      handleStart();
      return;
    }

    if (gameState !== 'PLAYING') return;

    setRevealedCardId(card.id);
    setGameState('REVEALED');
    playSound('click');

    const isWin = card.value >= stake;
    const isBigWin = card.isBigWin;

    setTimeout(async () => {
      if (isWin) {
        setWinAmount(card.value);
        setIsBigWinCelebration(isBigWin);
        setShowWinOverlay(true);
        playSound('win');
        playSound('applause');

        if (isBigWin) {
          // Massive champion sprays for Big Win
          const duration = 7 * 1000;
          const animationEnd = Date.now() + duration;
          const defaults = { startVelocity: 45, spread: 360, ticks: 100, zIndex: 1000 };

          const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

          const interval: any = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
              return clearInterval(interval);
            }

            const particleCount = 150 * (timeLeft / duration);
            // Champion sprays from multiple points
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#FFD700', '#FFA500', '#FF4500', '#FFFFFF'] });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#FFD700', '#FFA500', '#FF4500', '#FFFFFF'] });
            confetti({ ...defaults, particleCount, origin: { x: 0.5, y: 0.5 }, colors: ['#FFD700', '#FFA500', '#FF4500', '#FFFFFF'] });
          }, 250);

          narrate(`UNBELIEVABLE! BIG WIN! You found the EFADO Ultimate Card worth ${formatPrice(card.value)} ${selectedCurrency.name}! You are a champion!`);
        } else {
          // Standard champion sprays
          const count = 200;
          const defaults = {
            origin: { y: 0.7 },
            zIndex: 1000
          };

          function fire(particleRatio: number, opts: any) {
            confetti({
              ...defaults,
              ...opts,
              particleCount: Math.floor(count * particleRatio)
            });
          }

          fire(0.25, { spread: 26, startVelocity: 55 });
          fire(0.2, { spread: 60 });
          fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
          fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
          fire(0.1, { spread: 120, startVelocity: 45 });

          narrate(`Excellent! You won ${formatPrice(card.value)} ${selectedCurrency.name}. Great choice!`);
        }
        
        // Hide overlay after some time
        setTimeout(() => setShowWinOverlay(false), 5000);
      } else {
        playSound('loss');
        narrate(`Not quite the big one. You got ${formatPrice(card.value)} ${selectedCurrency.name}. Try again to hit the jackpot!`);
      }

      // Sync with Firestore
      const multiplier = card.value / stake;
      await onResult(multiplier, stake, 'moneyCard');
    }, 500);
  };

  const resetGame = () => {
    setGameState('IDLE');
    setRevealedCardId(null);
    initializeCards();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl overflow-hidden"
    >
      <div className="relative w-full max-w-7xl h-[95vh] bg-slate-900 border border-white/10 rounded-[3rem] flex flex-col shadow-2xl overflow-hidden isometric-grid">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-950 pointer-events-none" />
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/40 backdrop-blur-xl z-20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 ring-1 ring-white/20 flex-shrink-0">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div className="flex-shrink-0">
              <h2 className="text-lg font-display font-black text-white tracking-tighter uppercase">EFADO <span className="text-yellow-400">Money Card</span> Arena</h2>
              <div className="flex items-center gap-2">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Premium Experience</p>
                <div className="relative group">
                  <select 
                    value={currentStage}
                    onChange={(e) => {
                      setCurrentStage(Number(e.target.value));
                      resetGame();
                    }}
                    className="appearance-none px-2 py-0.5 bg-yellow-400/10 border border-yellow-400/20 rounded text-[8px] font-black text-yellow-400 uppercase tracking-widest cursor-pointer hover:bg-yellow-400/20 transition-all outline-none pr-6"
                  >
                    <option value={0} className="bg-slate-900">Starter Stage</option>
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={i + 1} className="bg-slate-900">Stage {i + 1}</option>
                    ))}
                  </select>
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-yellow-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Wallets and Stats - Centered between Name and Sound */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 mx-2 overflow-x-auto no-scrollbar">
            {/* Stake */}
            <div className="flex items-center gap-2 px-3 border-r border-white/10 shrink-0">
              <Coins className="w-3.5 h-3.5 text-orange-400" />
              <div>
                <p className="text-[6px] font-bold text-slate-500 uppercase tracking-widest">Stake</p>
                <p className="text-xs font-display font-black text-white">{formatPrice(stake)}</p>
              </div>
            </div>
            
            {/* Target Price */}
            <div className="flex items-center gap-2 px-3 border-r border-white/10 shrink-0">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <div>
                <p className="text-[6px] font-bold text-slate-500 uppercase tracking-widest">Target Price</p>
                <p className="text-xs font-display font-black text-yellow-400">{formatPrice(targetPrice)}</p>
              </div>
            </div>

            {/* Player Wallet */}
            <div className="flex items-center gap-2 px-3 border-r border-white/10 shrink-0">
              <Wallet className="w-3.5 h-3.5 text-blue-400" />
              <div>
                <p className="text-[6px] font-bold text-slate-500 uppercase tracking-widest">Wallet</p>
                <p className="text-xs font-display font-black text-white">{formatPrice(balance)}</p>
              </div>
            </div>

            {/* Win Wallet */}
            <div className="flex items-center gap-2 px-3 border-r border-white/10 shrink-0">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              <div>
                <p className="text-[6px] font-bold text-slate-500 uppercase tracking-widest">Win Wallet</p>
                <p className="text-xs font-display font-black text-white">{formatPrice(winWallet)}</p>
              </div>
            </div>

            {/* Deposit Wallet */}
            <div className="flex items-center gap-2 px-3 shrink-0">
              <ArrowDownLeft className="w-3.5 h-3.5 text-indigo-400" />
              <div>
                <p className="text-[6px] font-bold text-slate-500 uppercase tracking-widest">Deposit Wallet</p>
                <p className="text-xs font-display font-black text-white">{formatPrice(depositWallet)}</p>
              </div>
            </div>
          </div>

          {/* Fund and Cashout Buttons */}
          <div className="flex items-center gap-2 mx-2">
            <button 
              onClick={() => {
                setPaymentModalType('FUND');
                setPaymentStep('METHOD');
                setShowPaymentModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 border border-white/10"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Fund Wallet
            </button>
            <button 
              onClick={() => {
                setPaymentModalType('CASHOUT');
                setPaymentStep('METHOD');
                setShowPaymentModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 border border-white/10"
            >
              <ArrowUpCircle className="w-3.5 h-3.5" />
              Cashout
            </button>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 text-slate-400 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-xl border border-white/10"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white transition-colors hover:rotate-90 duration-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Game Area */}
        <div className="flex-grow flex flex-col items-center justify-center p-8 relative z-10">
          
          {/* Win Overlay */}
          <AnimatePresence>
            {showWinOverlay && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
              >
                <motion.div
                  animate={{ 
                    y: [0, -20, 0],
                    scale: isBigWinCelebration ? [1, 1.2, 1] : 1
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className={`flex flex-col items-center justify-center p-12 rounded-[4rem] border-4 ${
                    isBigWinCelebration 
                      ? 'bg-yellow-400/20 border-yellow-400 shadow-[0_0_100px_rgba(234,179,8,0.5)]' 
                      : 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_100px_rgba(16,185,129,0.5)]'
                  } backdrop-blur-3xl`}
                >
                  <Trophy className={`w-24 h-24 mb-6 ${isBigWinCelebration ? 'text-yellow-400' : 'text-emerald-500'}`} />
                  <h3 className={`text-4xl font-display font-black uppercase tracking-widest mb-2 ${isBigWinCelebration ? 'text-yellow-400' : 'text-emerald-500'}`}>
                    {isBigWinCelebration ? 'CHAMPION WIN!' : 'WINNER!'}
                  </h3>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4"
                  >
                    <span className="text-8xl font-display font-black text-white drop-shadow-2xl">
                      {formatPrice(winAmount)}
                    </span>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 max-w-3xl w-full perspective-[2000px]">
            <AnimatePresence mode="popLayout">
              {cards.map((card, index) => (
                <motion.div
                  key={card.id}
                  layout
                  initial={{ scale: 0, opacity: 0, rotateY: -180 }}
                  animate={{ 
                    scale: 1, 
                    opacity: 1,
                    rotateY: 0,
                    x: shuffling ? (Math.random() - 0.5) * 150 : 0,
                    y: shuffling ? (Math.random() - 0.5) * 150 : 0,
                    rotate: shuffling ? (Math.random() - 0.5) * 30 : 0,
                    z: shuffling ? 50 : 0
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 260, 
                    damping: 20,
                    delay: shuffling ? 0 : index * 0.08 
                  }}
                  className="relative aspect-square group"
                >
                  <button
                    disabled={shuffling || revealedCardId !== null}
                    onClick={() => handleCardClick(card)}
                    className={`w-full h-full rounded-full transition-all duration-700 transform-gpu preserve-3d relative ${
                      revealedCardId === card.id ? 'rotate-y-180' : ''
                    } ${!shuffling && revealedCardId === null ? 'hover:-translate-y-4 cursor-pointer' : 'cursor-default'}`}
                  >
                    <motion.div
                      className="w-full h-full preserve-3d"
                      whileHover={!shuffling && revealedCardId === null ? { rotateX: 10, rotateY: 10 } : {}}
                    >
                      {/* Card Back - EFADO Branding with Golden Edge */}
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-b ${card.color} border-[6px] border-yellow-500/90 flex flex-col items-center justify-center shadow-[0_15px_35px_rgba(0,0,0,0.6),inset_0_2px_10px_rgba(255,255,255,0.3),0_0_15px_rgba(234,179,8,0.4)] backface-hidden overflow-hidden ${
                      revealedCardId === card.id ? 'opacity-0' : 'opacity-100'
                    }`}>
                      {/* Glossy Top Highlight */}
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/20 via-transparent to-transparent pointer-events-none" />
                      
                      {/* Inner Golden Ring for Emboss effect */}
                      <div className="absolute inset-[2px] rounded-full border-2 border-yellow-400/50 pointer-events-none" />
                      
                      <div className="relative z-10 flex flex-col items-center w-full h-full justify-center px-4">
                        <span className="text-3xl md:text-4xl font-display font-black text-white uppercase tracking-[0.1em] drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">EFADO</span>
                      </div>

                      {/* Side Highlight for convexity */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-white/10 pointer-events-none" />
                    </div>

                    {/* Card Front - Prize Style with Golden Edge */}
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-b ${card.color} border-[6px] border-yellow-500/90 flex flex-col items-center justify-center shadow-[0_15px_35px_rgba(0,0,0,0.6),inset_0_2px_10px_rgba(255,255,255,0.3),0_0_15px_rgba(234,179,8,0.4)] backface-hidden rotate-y-180 overflow-hidden transition-opacity duration-500 ${
                      revealedCardId === card.id ? 'opacity-100' : 'opacity-0'
                    }`}>
                      {/* Glossy Top Highlight */}
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/20 via-transparent to-transparent pointer-events-none" />
                      
                      {/* Inner Golden Ring for Emboss effect */}
                      <div className="absolute inset-[2px] rounded-full border-2 border-yellow-400/50 pointer-events-none" />
                      
                      <div className="text-center relative z-10 w-full h-full flex flex-col items-center justify-center">
                        <p className="text-[8px] font-black text-white/70 uppercase tracking-[0.4em] mb-2">EFADO</p>
                        <div className="relative inline-block">
                          <p className="text-4xl md:text-5xl font-display font-black text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">{formatPrice(card.value)}</p>
                          <div className="absolute -inset-6 bg-white/10 blur-3xl rounded-full -z-10" />
                        </div>
                        {card.isBigWin && (
                          <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="mt-4 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/20 shadow-lg"
                          >
                            <p className="text-[8px] font-black text-white uppercase tracking-[0.2em]">BIG WIN</p>
                          </motion.div>
                        )}
                      </div>

                      {/* Side Highlight for convexity */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-white/10 pointer-events-none" />
                    </div>
                  </motion.div>
                </button>
              </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="mt-16 flex flex-col items-center gap-8 relative z-20">
            {gameState === 'IDLE' && (
              <motion.button
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStart}
                className="group relative px-16 py-6 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 rounded-2xl font-display font-black text-2xl text-white uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(239,68,68,0.3)] transition-all flex items-center gap-6"
              >
                <Coins className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                Shuffle & Start
                <div className="absolute -top-3 -right-3 bg-white text-orange-600 text-xs font-black px-3 py-1.5 rounded-xl shadow-xl border border-orange-100">
                  {formatPrice(stake)}
                </div>
              </motion.button>
            )}

            {gameState === 'REVEALED' && (
              <motion.button
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStart}
                className="px-16 py-6 bg-blue-600 hover:bg-blue-500 rounded-2xl font-display font-black text-2xl text-white uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(37,99,235,0.3)] transition-all flex items-center gap-6"
              >
                <RotateCcw className="w-8 h-8" />
                Play Again
              </motion.button>
            )}

            {gameState === 'PLAYING' && !shuffling && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 text-slate-400 font-black tracking-widest text-sm"
              >
                <div className="w-12 h-[1px] bg-slate-700" />
                <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
                <span className="uppercase">Pick your card</span>
                <div className="w-12 h-[1px] bg-slate-700" />
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-8 border-t border-white/5 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center gap-12 z-20">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Arena Active</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">3D Engine Verified</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">EFADO Rewards</span>
          </div>
        </div>

        {/* Error/Info Toast */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="absolute bottom-32 left-1/2 -translate-x-1/2 z-[110] bg-red-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 font-black uppercase tracking-widest text-sm"
            >
              <AlertCircle className="w-6 h-6" />
              {message}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Payment Modal Overlay */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-[500px] h-[90vh] max-h-[750px] flex flex-col">
              <EasyPaymentPlatform
                user={user}
                type={paymentModalType === 'FUND' ? 'deposit' : 'withdraw'}
                onComplete={async (amount, method) => {
                  if (onUpdateBalance) {
                    await onUpdateBalance(
                      amount,
                      paymentModalType === 'FUND' ? 'deposit' : 'withdrawal'
                    );
                  }
                }}
                onClose={() => setShowPaymentModal(false)}
                hub="MONEY_CARD"
                purpose={paymentModalType === 'FUND' ? "Efado Money Card Stake Refunding" : "Efado Money Card Win Cashout"}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>

  );
};
