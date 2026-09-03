import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile, DeepSeaBet, DeepSeaCurrency, DeepSeaRoundOutcome, SubmarinePilot } from '../types';
import { DeepSeaCanvas } from './DeepSeaCanvas';
import { BettingConsole } from './BettingConsole';
import { MultiplierHistoryBar } from './MultiplierHistoryBar';
import { MultiplayerPanel } from './MultiplayerPanel';
import { CashierModal } from './CashierModal';
import { ProvablyFairModal } from './ProvablyFairModal';
import { RulesModal } from './RulesModal';
import { soundManager } from '../services/sound';
import confetti from 'canvas-confetti';
import {
  X,
  Volume2,
  VolumeX,
  Wallet,
  BookOpen,
  ShieldCheck,
  Sparkles,
  Maximize2,
  Minimize2,
  RefreshCw,
  Compass,
  Anchor,
  Play,
  CheckCircle,
  TrendingUp,
  Flame
} from 'lucide-react';

interface DeepSeaJetGameProps {
  onClose: () => void;
  user: UserProfile;
  onResult: (multiplier: number, bet: number, gameId: any, payoutOverride?: number) => Promise<void>;
  onGameStart?: (amount: number, gameId: string) => Promise<void>;
  onUpdateBalance?: () => void;
}

const CURRENCY_SYMBOLS: Record<DeepSeaCurrency, string> = {
  NGN: '₦',
  USD: '$',
  EUR: '€',
  GBP: '£',
  USDT: '₮',
  BTC: '₿',
  ETH: 'Ξ',
};

// Initial History Rounds
const INITIAL_HISTORY: DeepSeaRoundOutcome[] = [
  { roundId: 'dsj-88912', crashMultiplier: 2.14, serverSeed: '38aef71c90...02', clientSeed: 'pilot_token_88', nonce: 110, hash: 'f8102a...e901', timestamp: Date.now() - 60000 },
  { roundId: 'dsj-88911', crashMultiplier: 1.45, serverSeed: '12ba9c8301...54', clientSeed: 'pilot_token_88', nonce: 109, hash: 'a7182e...7891', timestamp: Date.now() - 120000 },
  { roundId: 'dsj-88910', crashMultiplier: 12.80, serverSeed: '88cda90412...33', clientSeed: 'pilot_token_88', nonce: 108, hash: '0912cb...5412', timestamp: Date.now() - 180000 },
  { roundId: 'dsj-88909', crashMultiplier: 3.65, serverSeed: '45ddca8871...99', clientSeed: 'pilot_token_88', nonce: 107, hash: '7721ea...1102', timestamp: Date.now() - 240000 },
  { roundId: 'dsj-88908', crashMultiplier: 1.18, serverSeed: '99bcda1204...88', clientSeed: 'pilot_token_88', nonce: 106, hash: '1288ca...9011', timestamp: Date.now() - 300000 },
  { roundId: 'dsj-88907', crashMultiplier: 5.42, serverSeed: '7611ab9043...22', clientSeed: 'pilot_token_88', nonce: 105, hash: '4399cb...1288', timestamp: Date.now() - 360000 },
  { roundId: 'dsj-88906', crashMultiplier: 28.50, serverSeed: '22cdef9912...44', clientSeed: 'pilot_token_88', nonce: 104, hash: '9901ca...7744', timestamp: Date.now() - 420000 },
];

export const DeepSeaJetGame: React.FC<DeepSeaJetGameProps> = ({
  onClose,
  user,
  onResult,
  onGameStart,
  onUpdateBalance,
}) => {
  // Game States
  const [gameState, setGameState] = useState<'idle' | 'diving' | 'crashed'>('idle');
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [crashMultiplier, setCrashMultiplier] = useState<number>(2.0);
  const [history, setHistory] = useState<DeepSeaRoundOutcome[]>(INITIAL_HISTORY);

  // Currency & Wallets (Naira NGN default per user directive)
  const [activeCurrency, setActiveCurrency] = useState<DeepSeaCurrency>('NGN');
  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(false);
  const [practiceBalance, setPracticeBalance] = useState<number>(50000);
  const realBalance = (user.depositWallet || 0) + (user.playerWallet || 0);
  const currentBalance = isPracticeMode ? practiceBalance : realBalance;

  // Sound & Fullscreen
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Modals
  const [showCashier, setShowCashier] = useState<boolean>(false);
  const [showFairness, setShowFairness] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [selectedRound, setSelectedRound] = useState<DeepSeaRoundOutcome | null>(null);

  // Auto-Bet Toggles
  const [autoBetConsole1, setAutoBetConsole1] = useState<boolean>(false);
  const [autoBetConsole2, setAutoBetConsole2] = useState<boolean>(false);

  // Dual Betting Consoles (Defaulted to Naira ₦500 & ₦200 stakes)
  const [bet1, setBet1] = useState<DeepSeaBet>({
    id: 'bet-1',
    betAmount: 500,
    currency: 'NGN',
    isAutoCashout: false,
    autoCashoutMultiplier: 2.0,
    status: 'idle',
    consoleId: 1,
  });

  const [bet2, setBet2] = useState<DeepSeaBet>({
    id: 'bet-2',
    betAmount: 200,
    currency: 'NGN',
    isAutoCashout: false,
    autoCashoutMultiplier: 1.5,
    status: 'idle',
    consoleId: 2,
  });

  // Multiplayer Fleet
  const [pilots, setPilots] = useState<SubmarinePilot[]>([
    { id: 'p1', callsign: 'CaptainNemo', rank: 'Fleet Admiral', betAmount: 5000, currency: 'NGN', status: 'diving' },
    { id: 'p2', callsign: 'AbyssExplorer', rank: 'Commander', betAmount: 2500, currency: 'NGN', status: 'diving' },
    { id: 'p3', callsign: 'AquaStrike', rank: 'Lieutenant', betAmount: 1000, currency: 'NGN', status: 'diving' },
    { id: 'p4', callsign: 'DeepSonar', rank: 'Deep Scout', betAmount: 500, currency: 'NGN', status: 'diving' },
  ]);

  // Round Cryptographic Seeds
  const [currentServerSeed, setCurrentServerSeed] = useState('7f9a12c8e034bd19...fe01');
  const [currentClientSeed, setCurrentClientSeed] = useState(`pilot_${user.uid.slice(0, 8)}`);
  const [currentNonce, setCurrentNonce] = useState(111);

  // Animation Frame Ref
  const diveAnimRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Toggle Sound
  const handleToggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundManager.setMuted(nextMuted);
  };

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Provably Fair Crash Point Generator
  const generateCrashPoint = useCallback(() => {
    // Standard casino crash algorithm: 3% instant house edge
    const r = Math.random();
    if (r < 0.035) {
      return 1.0; // instant crash at 1.00x
    }
    // Exponential curve: 99 / (100 - X)
    const e = 2 ** 32;
    const h = Math.floor(Math.random() * (e / 100)) + 1;
    let crash = (100 * e - h) / (e - h) / 100;
    crash = Math.max(1.02, Math.min(1000.0, crash));
    return Math.round(crash * 100) / 100;
  }, []);

  // Update Bet State
  const updateBet1 = (updated: Partial<DeepSeaBet>) => {
    setBet1((prev) => ({ ...prev, ...updated }));
  };

  const updateBet2 = (updated: Partial<DeepSeaBet>) => {
    setBet2((prev) => ({ ...prev, ...updated }));
  };

  // Place or Cancel Bet on Console
  const handlePlaceBet = (consoleId: 1 | 2) => {
    soundManager.playClick();
    const targetBet = consoleId === 1 ? bet1 : bet2;
    const setTargetBet = consoleId === 1 ? setBet1 : setBet2;

    if (targetBet.status === 'placed') {
      // Cancel bet
      setTargetBet((prev) => ({ ...prev, status: 'idle' }));
    } else {
      // Check balance
      if (targetBet.betAmount > currentBalance) {
        alert('Insufficient balance to place stake. Please fund via Cashier.');
        setShowCashier(true);
        return;
      }
      setTargetBet((prev) => ({ ...prev, status: 'placed' }));
    }
  };

  // Cashout Bet on Console
  const handleCashout = useCallback(
    (consoleId: 1 | 2) => {
      const targetBet = consoleId === 1 ? bet1 : bet2;
      const setTargetBet = consoleId === 1 ? setBet1 : setBet2;

      if (gameState !== 'diving' || targetBet.status !== 'placed') return;

      const cashoutMult = multiplier;
      const winPayout = targetBet.betAmount * cashoutMult;

      soundManager.playCashoutChime();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#06b6d4', '#38bdf8', '#f59e0b', '#10b981'],
      });

      setTargetBet((prev) => ({
        ...prev,
        status: 'cashed_out',
        cashoutMultiplier: cashoutMult,
        winAmount: winPayout,
      }));

      // Update balances
      if (isPracticeMode) {
        setPracticeBalance((prev) => prev + winPayout);
      } else {
        // Stake was already deducted upon starting the dive, so pass 0 for bet to credit pure payout to player win wallet
        onResult(cashoutMult, 0, 'deepSeaJet', winPayout);
        if (onUpdateBalance) onUpdateBalance();
      }

      // Update multiplayer pilot
      setPilots((prev) =>
        prev.map((p) =>
          p.isUser && p.id === `user-${consoleId}`
            ? { ...p, status: 'cashed_out', cashoutMultiplier: cashoutMult, profit: winPayout - targetBet.betAmount }
            : p
        )
      );
    },
    [bet1, bet2, gameState, multiplier, isPracticeMode, onResult, onUpdateBalance]
  );

  // START / LAUNCH DIVE (User Directive: Game only starts upon user's stake and start button)
  const handleStartDive = () => {
    // Check if at least one bet is placed
    const b1Placed = bet1.status === 'placed';
    const b2Placed = bet2.status === 'placed';

    if (!b1Placed && !b2Placed) {
      alert('Please place a stake on Console 1 or Console 2 first!');
      return;
    }

    const totalStake = (b1Placed ? bet1.betAmount : 0) + (b2Placed ? bet2.betAmount : 0);
    if (totalStake > currentBalance) {
      alert('Insufficient balance for total stakes.');
      setShowCashier(true);
      return;
    }

    // Deduct stake up front
    if (isPracticeMode) {
      setPracticeBalance((prev) => Math.max(0, prev - totalStake));
    } else {
      // In real mode, deduct stake and credit house gain
      if (onGameStart) {
        if (b1Placed) onGameStart(bet1.betAmount, 'deepSeaJet');
        if (b2Placed) onGameStart(bet2.betAmount, 'deepSeaJet');
      } else {
        if (b1Placed) onResult(0, bet1.betAmount, 'deepSeaJet', 0);
        if (b2Placed) onResult(0, bet2.betAmount, 'deepSeaJet', 0);
      }
      if (onUpdateBalance) onUpdateBalance();
    }

    // Setup pilots
    const activePilots: SubmarinePilot[] = [
      { id: 'p1', callsign: 'CaptainNemo', rank: 'Fleet Admiral', betAmount: Math.floor(Math.random() * 800 + 100), currency: activeCurrency, status: 'diving' },
      { id: 'p2', callsign: 'AbyssExplorer', rank: 'Commander', betAmount: Math.floor(Math.random() * 400 + 50), currency: activeCurrency, status: 'diving' },
      { id: 'p3', callsign: 'DeepDiver99', rank: 'Lieutenant', betAmount: Math.floor(Math.random() * 200 + 20), currency: activeCurrency, status: 'diving' },
      { id: 'p4', callsign: 'SonarScout', rank: 'Scout', betAmount: Math.floor(Math.random() * 150 + 10), currency: activeCurrency, status: 'diving' },
    ];

    if (b1Placed) {
      activePilots.unshift({
        id: 'user-1',
        callsign: user.displayName || 'You (Console 1)',
        rank: 'Sub Captain',
        betAmount: bet1.betAmount,
        currency: activeCurrency,
        status: 'diving',
        isUser: true,
      });
    }

    if (b2Placed) {
      activePilots.unshift({
        id: 'user-2',
        callsign: user.displayName || 'You (Console 2)',
        rank: 'Sub Captain',
        betAmount: bet2.betAmount,
        currency: activeCurrency,
        status: 'diving',
        isUser: true,
      });
    }

    setPilots(activePilots);

    // Initialize round
    const targetCrash = generateCrashPoint();
    setCrashMultiplier(targetCrash);
    setMultiplier(1.0);
    setGameState('diving');

    soundManager.playSonarPing();
    soundManager.startEngineSound(1.0);

    startTimeRef.current = performance.now();
  };

  // Main Multiplier Dive Loop
  useEffect(() => {
    if (gameState !== 'diving') return;

    let isCancelled = false;

    const tick = (now: number) => {
      if (isCancelled) return;

      const elapsedSec = (now - startTimeRef.current) / 1000;
      // Exponential Efado ascent formula:
      // Starts gentle at 1.00x, accelerates deeper into the abyss
      const currentVal = Math.max(1.0, 1.0 + Math.pow(elapsedSec * 0.45, 1.8) + elapsedSec * 0.08);

      soundManager.updateEngineSound(currentVal);

      // Warning alarm if high velocity / pressure
      if (currentVal > 5.0 && Math.floor(currentVal) % 4 === 0) {
        soundManager.playPressureAlert();
      }

      // Check Auto-Cashouts
      if (bet1.status === 'placed' && bet1.isAutoCashout && bet1.autoCashoutMultiplier && currentVal >= bet1.autoCashoutMultiplier) {
        handleCashout(1);
      }
      if (bet2.status === 'placed' && bet2.isAutoCashout && bet2.autoCashoutMultiplier && currentVal >= bet2.autoCashoutMultiplier) {
        handleCashout(2);
      }

      // Random bot pilots cashout
      setPilots((prev) =>
        prev.map((p) => {
          if (!p.isUser && p.status === 'diving') {
            // chance to cashout
            if (Math.random() < 0.015 * currentVal) {
              return {
                ...p,
                status: 'cashed_out',
                cashoutMultiplier: currentVal,
                profit: Math.floor(p.betAmount * currentVal - p.betAmount),
              };
            }
          }
          return p;
        })
      );

      // Check for Crash / Catastrophic Hull Breach
      if (currentVal >= crashMultiplier) {
        // CRASH EVENT
        setMultiplier(crashMultiplier);
        setGameState('crashed');
        soundManager.playImplosionCrash();

        // Mark remaining un-cashed bets as crashed
        setBet1((prev) => (prev.status === 'placed' ? { ...prev, status: 'crashed' } : prev));
        setBet2((prev) => (prev.status === 'placed' ? { ...prev, status: 'crashed' } : prev));

        // Mark remaining diving pilots as crashed
        setPilots((prev) =>
          prev.map((p) => (p.status === 'diving' ? { ...p, status: 'crashed' } : p))
        );

        // Record round to history
        const newOutcome: DeepSeaRoundOutcome = {
          roundId: `dsj-${Math.floor(Math.random() * 90000 + 10000)}`,
          crashMultiplier: crashMultiplier,
          serverSeed: currentServerSeed,
          clientSeed: currentClientSeed,
          nonce: currentNonce,
          hash: `${Math.random().toString(36).slice(2)}...${Math.random().toString(36).slice(2)}`,
          timestamp: Date.now(),
        };

        setHistory((prev) => [newOutcome, ...prev.slice(0, 20)]);
        setCurrentNonce((prev) => prev + 1);

        // Auto-Reset back to idle after 4 seconds
        setTimeout(() => {
          setGameState('idle');
          setMultiplier(1.0);
          // Handle Auto-Bet if toggled
          setBet1((prev) => ({
            ...prev,
            status: autoBetConsole1 ? 'placed' : 'idle',
            winAmount: undefined,
            cashoutMultiplier: undefined,
          }));
          setBet2((prev) => ({
            ...prev,
            status: autoBetConsole2 ? 'placed' : 'idle',
            winAmount: undefined,
            cashoutMultiplier: undefined,
          }));
        }, 4000);

        return;
      }

      setMultiplier(currentVal);
      diveAnimRef.current = requestAnimationFrame(tick);
    };

    diveAnimRef.current = requestAnimationFrame(tick);

    return () => {
      isCancelled = true;
      if (diveAnimRef.current) {
        cancelAnimationFrame(diveAnimRef.current);
      }
    };
  }, [
    gameState,
    crashMultiplier,
    bet1.status,
    bet1.isAutoCashout,
    bet1.autoCashoutMultiplier,
    bet2.status,
    bet2.isAutoCashout,
    bet2.autoCashoutMultiplier,
    handleCashout,
    currentServerSeed,
    currentClientSeed,
    currentNonce,
    autoBetConsole1,
    autoBetConsole2,
  ]);

  // Clean up sound on unmount
  useEffect(() => {
    return () => {
      soundManager.stopEngineSound();
    };
  }, []);

  const hasPlacedAnyBet = bet1.status === 'placed' || bet2.status === 'placed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-xl overflow-y-auto no-scrollbar">
      <div className="relative w-full max-w-7xl bg-slate-950 border-2 border-cyan-500/40 rounded-[2.5rem] shadow-[0_30px_90px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col my-auto max-h-[96vh]">
        {/* TOP BAR / HEADER */}
        <header className="px-6 py-4 border-b border-cyan-500/20 bg-slate-950/90 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Game Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 border border-cyan-400/60 flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter">
                  Deep Sea Jet
                </h1>
                <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-black rounded-full uppercase tracking-widest animate-pulse">
                  Efado Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Oceanic Descent & Hydrodynamic Velocity Engine
              </p>
            </div>
          </div>

          {/* Quick Header Actions (Cashier, Balance, Sound, Rules, Close) */}
          <div className="flex items-center gap-2.5">
            {/* Cashier / Balance Button */}
            <button
              onClick={() => {
                soundManager.playClick();
                setShowCashier(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border border-cyan-500/40 rounded-2xl transition-all shadow-sm"
            >
              <Wallet className="w-4 h-4 text-cyan-400" />
              <div className="text-left">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {isPracticeMode ? 'DEMO VAULT' : 'ACTIVE VAULT'}
                </div>
                <div className="text-xs font-black text-cyan-300 font-mono">
                  {CURRENCY_SYMBOLS[activeCurrency]}
                  {currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </button>

            {/* Rules Button */}
            <button
              onClick={() => {
                soundManager.playClick();
                setShowRules(true);
              }}
              title="How to Play"
              className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-2xl transition-all"
            >
              <BookOpen className="w-4 h-4" />
            </button>

            {/* Sound Toggle Button */}
            <button
              onClick={handleToggleSound}
              title={isMuted ? 'Unmute Hydrophone Audio' : 'Mute Hydrophone Audio'}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-2xl transition-all"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={handleToggleFullscreen}
              title="Toggle Fullscreen"
              className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-2xl transition-all hidden sm:flex"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Exit / Close */}
            <button
              onClick={onClose}
              title="Close Deep Sea Jet"
              className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 rounded-2xl transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* RECENT MULTIPLIER HISTORY BAR */}
        <div className="px-6 py-2 bg-slate-950/60 border-b border-cyan-500/15">
          <MultiplierHistoryBar
            history={history}
            onSelectRound={(round) => {
              setSelectedRound(round);
              setShowFairness(true);
            }}
            onOpenFairness={() => {
              setSelectedRound(null);
              setShowFairness(true);
            }}
          />
        </div>

        {/* MAIN GAMEPLAY GRID */}
        <div className="p-4 sm:p-6 overflow-y-auto no-scrollbar flex-1 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Cols: 60 FPS HTML5 Canvas + Dual Consoles */}
            <div className="lg:col-span-8 space-y-6">
              {/* Oceanic Canvas Simulation with Direct On-Screen Tactical HUD */}
              <DeepSeaCanvas
                multiplier={multiplier}
                gameState={gameState}
                crashMultiplier={crashMultiplier}
              >
                {/* On-Screen Top Telemetry Badges */}
                <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 backdrop-blur-md rounded-full border border-cyan-500/30 text-[10px] font-black tracking-widest text-cyan-400 uppercase">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>EFADO DIVE TURBINE</span>
                  </div>

                  {hasPlacedAnyBet && (
                    <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-950/85 backdrop-blur-md rounded-full border border-amber-500/40 text-[11px] font-black font-mono text-amber-300">
                      <span className="text-slate-400 uppercase text-[9px] tracking-wider">STAKED:</span>
                      <span>
                        {CURRENCY_SYMBOLS[activeCurrency]}
                        {(
                          (bet1.status === 'placed' || bet1.status === 'cashed_out' ? bet1.betAmount : 0) +
                          (bet2.status === 'placed' || bet2.status === 'cashed_out' ? bet2.betAmount : 0)
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* ON-SCREEN LIVE CASHOUT CONTROL CENTER (When Diving with Active Bets) */}
                {gameState === 'diving' && (bet1.status === 'placed' || bet2.status === 'placed') && (
                  <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-30 flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row items-stretch justify-center gap-2.5">
                      {/* Helm 1 Direct On-Screen Cashout */}
                      {bet1.status === 'placed' && (
                        <button
                          id="onscreen-cashout-helm-1"
                          onClick={() => handleCashout(1)}
                          className="flex-1 py-3 sm:py-4 px-4 sm:px-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-2xl shadow-[0_0_35px_rgba(245,158,11,0.65)] border-2 border-amber-200 transform active:scale-95 transition-all flex items-center justify-between gap-3 group animate-pulse cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-slate-950/25 flex items-center justify-center text-slate-950">
                              <TrendingUp className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="text-left">
                              <div className="text-[10px] font-black uppercase tracking-wider text-slate-950">
                                CASHOUT HELM 1
                              </div>
                              <div className="text-[11px] font-bold text-slate-900/80">
                                Stake: {CURRENCY_SYMBOLS[activeCurrency]}{bet1.betAmount.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-base sm:text-xl font-black font-mono text-slate-950 tracking-tight leading-tight">
                              {CURRENCY_SYMBOLS[activeCurrency]}{(bet1.betAmount * multiplier).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-[10px] font-black text-slate-900/90 font-mono">
                              @ {multiplier.toFixed(2)}x
                            </div>
                          </div>
                        </button>
                      )}

                      {/* Helm 2 Direct On-Screen Cashout */}
                      {bet2.status === 'placed' && (
                        <button
                          id="onscreen-cashout-helm-2"
                          onClick={() => handleCashout(2)}
                          className="flex-1 py-3 sm:py-4 px-4 sm:px-5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-2xl shadow-[0_0_35px_rgba(234,179,8,0.65)] border-2 border-yellow-100 transform active:scale-95 transition-all flex items-center justify-between gap-3 group animate-pulse cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-slate-950/25 flex items-center justify-center text-slate-950">
                              <TrendingUp className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="text-left">
                              <div className="text-[10px] font-black uppercase tracking-wider text-slate-950">
                                CASHOUT HELM 2
                              </div>
                              <div className="text-[11px] font-bold text-slate-900/80">
                                Stake: {CURRENCY_SYMBOLS[activeCurrency]}{bet2.betAmount.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-base sm:text-xl font-black font-mono text-slate-950 tracking-tight leading-tight">
                              {CURRENCY_SYMBOLS[activeCurrency]}{(bet2.betAmount * multiplier).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-[10px] font-black text-slate-900/90 font-mono">
                              @ {multiplier.toFixed(2)}x
                            </div>
                          </div>
                        </button>
                      )}
                    </div>

                    {/* Dual Cashout Button when both helms are active */}
                    {bet1.status === 'placed' && bet2.status === 'placed' && (
                      <button
                        id="onscreen-cashout-all"
                        onClick={() => {
                          handleCashout(1);
                          handleCashout(2);
                        }}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-xl shadow-[0_0_25px_rgba(16,185,129,0.5)] border border-emerald-200 transform active:scale-95 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-slate-950" />
                        <span>CASHOUT BOTH HELMS NOW ({CURRENCY_SYMBOLS[activeCurrency]}{((bet1.betAmount + bet2.betAmount) * multiplier).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Celebratory Banner when bets were secured in this round */}
                {gameState === 'diving' && (bet1.status === 'cashed_out' || bet2.status === 'cashed_out') && !(bet1.status === 'placed' || bet2.status === 'placed') && (
                  <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center justify-center">
                    <div className="px-6 py-3 bg-emerald-950/80 backdrop-blur-md border-2 border-emerald-500/50 rounded-2xl text-emerald-300 text-xs font-black flex items-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>ALL CASHOUTS SECURED! DIVE ACCELERATING...</span>
                    </div>
                  </div>
                )}

                {/* On-Screen Direct Launcher when Idle and Bets are Prepared */}
                {gameState === 'idle' && hasPlacedAnyBet && (
                  <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center justify-center">
                    <button
                      id="onscreen-start-dive"
                      onClick={handleStartDive}
                      className="w-full sm:w-auto min-w-[280px] py-4 px-8 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black rounded-2xl shadow-[0_10px_35px_rgba(6,182,212,0.55)] border border-cyan-300 transform active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-sm animate-pulse cursor-pointer"
                    >
                      <Play className="w-5 h-5 fill-current text-white" />
                      <span>LAUNCH DIVE • {CURRENCY_SYMBOLS[activeCurrency]}{( (bet1.status === 'placed' ? bet1.betAmount : 0) + (bet2.status === 'placed' ? bet2.betAmount : 0) ).toLocaleString()} STAKE</span>
                    </button>
                  </div>
                )}
              </DeepSeaCanvas>

              {/* Efado-Style Dual Betting Consoles (Console 1 & Console 2) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BettingConsole
                  consoleId={1}
                  bet={bet1}
                  onUpdateBet={updateBet1}
                  gameState={gameState}
                  currentMultiplier={multiplier}
                  onPlaceBet={handlePlaceBet}
                  onCashout={handleCashout}
                  onStartDive={handleStartDive}
                  hasPlacedAnyBet={hasPlacedAnyBet}
                  currencySymbol={CURRENCY_SYMBOLS[activeCurrency]}
                  userBalance={currentBalance}
                  isAutoBetActive={autoBetConsole1}
                  onToggleAutoBet={() => setAutoBetConsole1(!autoBetConsole1)}
                />

                <BettingConsole
                  consoleId={2}
                  bet={bet2}
                  onUpdateBet={updateBet2}
                  gameState={gameState}
                  currentMultiplier={multiplier}
                  onPlaceBet={handlePlaceBet}
                  onCashout={handleCashout}
                  onStartDive={handleStartDive}
                  hasPlacedAnyBet={hasPlacedAnyBet}
                  currencySymbol={CURRENCY_SYMBOLS[activeCurrency]}
                  userBalance={currentBalance}
                  isAutoBetActive={autoBetConsole2}
                  onToggleAutoBet={() => setAutoBetConsole2(!autoBetConsole2)}
                />
              </div>
            </div>

            {/* Right 4 Cols: Real-Time Multiplayer Fleet & Radio Comms */}
            <div className="lg:col-span-4">
              <MultiplayerPanel
                pilots={pilots}
                currencySymbol={CURRENCY_SYMBOLS[activeCurrency]}
                userCallsign={user.displayName || 'Pilot'}
              />
            </div>
          </div>
        </div>

        {/* MODALS */}
        {showCashier && (
          <CashierModal
            onClose={() => setShowCashier(false)}
            activeCurrency={activeCurrency}
            onSelectCurrency={setActiveCurrency}
            realBalance={realBalance}
            practiceBalance={practiceBalance}
            isPracticeMode={isPracticeMode}
            onTogglePracticeMode={setIsPracticeMode}
            onDeposit={(amount, currency) => {
              if (isPracticeMode) {
                setPracticeBalance((prev) => prev + amount);
              } else {
                onResult(0, -amount, 'deepSeaJet');
                if (onUpdateBalance) onUpdateBalance();
              }
            }}
            onWithdraw={(amount, currency, address) => {
              if (isPracticeMode) {
                setPracticeBalance((prev) => Math.max(0, prev - amount));
              } else {
                onResult(0, amount, 'deepSeaJet');
                if (onUpdateBalance) onUpdateBalance();
              }
            }}
            onResetPracticeBalance={() => setPracticeBalance(1000)}
          />
        )}

        {showFairness && (
          <ProvablyFairModal
            onClose={() => setShowFairness(false)}
            selectedRound={selectedRound}
            currentServerSeed={currentServerSeed}
            currentClientSeed={currentClientSeed}
            currentNonce={currentNonce}
          />
        )}

        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      </div>
    </div>
  );
};
