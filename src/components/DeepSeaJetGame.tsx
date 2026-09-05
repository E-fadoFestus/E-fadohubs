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
  Sparkles,
  Maximize2,
  Minimize2,
  Compass,
  Play,
  CheckCircle,
  TrendingUp,
  Flame,
  Timer
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
  // Game Lifecycle States: 'betting' (5s countdown) -> 'flying'/'diving' -> 'crashed'
  const [gameState, setGameState] = useState<'betting' | 'diving' | 'flying' | 'crashed' | 'idle'>('betting');
  const [bettingCountdown, setBettingCountdown] = useState<number>(5.0);
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [crashMultiplier, setCrashMultiplier] = useState<number>(2.45);
  const [history, setHistory] = useState<DeepSeaRoundOutcome[]>(INITIAL_HISTORY);
  const [currentRoundId, setCurrentRoundId] = useState<string>(`dsj-${Date.now()}`);

  // Currency & Wallets (NGN default)
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

  // Dual Betting Consoles (Console 1 & Console 2)
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

  // Provably Fair Cryptographic State
  const [currentServerSeed, setCurrentServerSeed] = useState('7f9a12c8e034bd19a3b4e102f9c8d7e6');
  const [currentClientSeed, setCurrentClientSeed] = useState(`pilot_${user.uid.slice(0, 8)}`);
  const [currentNonce, setCurrentNonce] = useState(111);

  // REFS FOR CALLBACKS & STABLE PROPS
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const onGameStartRef = useRef(onGameStart);
  onGameStartRef.current = onGameStart;
  const onUpdateBalanceRef = useRef(onUpdateBalance);
  onUpdateBalanceRef.current = onUpdateBalance;
  const userRef = useRef(user);
  userRef.current = user;

  // REFS FOR SMOOTH 60FPS TICK WITHOUT REACT CLOSURE RE-RUNS
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const multiplierRef = useRef(1.0);
  multiplierRef.current = multiplier;

  const crashMultiplierRef = useRef(crashMultiplier);
  crashMultiplierRef.current = crashMultiplier;

  const bet1Ref = useRef(bet1);
  bet1Ref.current = bet1;

  const bet2Ref = useRef(bet2);
  bet2Ref.current = bet2;

  const currentBalanceRef = useRef(currentBalance);
  currentBalanceRef.current = currentBalance;

  const isPracticeModeRef = useRef(isPracticeMode);
  isPracticeModeRef.current = isPracticeMode;

  const autoBetConsole1Ref = useRef(autoBetConsole1);
  autoBetConsole1Ref.current = autoBetConsole1;

  const autoBetConsole2Ref = useRef(autoBetConsole2);
  autoBetConsole2Ref.current = autoBetConsole2;

  const currentRoundIdRef = useRef(currentRoundId);
  currentRoundIdRef.current = currentRoundId;

  // Animation & Timer handles
  const gameLoopRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<any>(null);
  const countdownTargetTimeRef = useRef<number>(0);
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

  // Update Bet Stakes
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

      // Call backend /game/bet endpoint asynchronously
      fetch('/game/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          betAmount: targetBet.betAmount,
          currency: activeCurrency,
          consoleId,
          isAutoCashout: targetBet.isAutoCashout,
          autoCashoutMultiplier: targetBet.autoCashoutMultiplier,
        }),
      }).catch((err) => console.warn('[Game Bet API] non-fatal:', err));
    }
  };

  // Cashout Implementation (Synchronous + API)
  const handleCashout = useCallback(
    (consoleId: 1 | 2) => {
      const currentVal = multiplierRef.current;
      const targetBet = consoleId === 1 ? bet1Ref.current : bet2Ref.current;
      const setTargetBet = consoleId === 1 ? setBet1 : setBet2;

      const isCurrentFlying = gameStateRef.current === 'diving' || gameStateRef.current === 'flying';
      if (!isCurrentFlying || targetBet.status !== 'placed') return;

      const winPayout = Number((targetBet.betAmount * currentVal).toFixed(2));
      const profit = Number((winPayout - targetBet.betAmount).toFixed(2));

      soundManager.playCashoutChime();
      confetti({
        particleCount: 55,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#06b6d4', '#38bdf8', '#f59e0b', '#10b981'],
      });

      setTargetBet((prev) => ({
        ...prev,
        status: 'cashed_out',
        cashoutMultiplier: currentVal,
        winAmount: winPayout,
      }));

      // Credit wallet
      if (isPracticeModeRef.current) {
        setPracticeBalance((prev) => prev + winPayout);
      } else {
        if (onResultRef.current) onResultRef.current(currentVal, 0, 'deepSeaJet', winPayout);
        if (onUpdateBalanceRef.current) onUpdateBalanceRef.current();
      }

      // Update pilot in multiplayer list
      setPilots((prev) =>
        prev.map((p) =>
          p.isUser && p.id === `user-${consoleId}`
            ? { ...p, status: 'cashed_out', cashoutMultiplier: currentVal, profit }
            : p
        )
      );

      // Call backend /game/cashout API
      fetch('/game/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userRef.current.uid,
          betAmount: targetBet.betAmount,
          multiplier: currentVal,
          consoleId,
        }),
      }).catch((err) => console.warn('[Game Cashout API] non-fatal:', err));
    },
    []
  );

  // CRASH HANDLER
  const crashGame = useCallback((finalCrash: number) => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }

    setMultiplier(finalCrash);
    multiplierRef.current = finalCrash;
    setGameState('crashed');
    gameStateRef.current = 'crashed';

    soundManager.stopEngineSound();
    soundManager.playImplosionCrash();

    // Mark un-cashed bets as crashed
    setBet1((prev) => (prev.status === 'placed' ? { ...prev, status: 'crashed' } : prev));
    setBet2((prev) => (prev.status === 'placed' ? { ...prev, status: 'crashed' } : prev));

    // Mark un-cashed pilots as crashed
    setPilots((prev) =>
      prev.map((p) => (p.status === 'diving' ? { ...p, status: 'crashed' } : p))
    );

    // Record round to history
    const roundOutcome: DeepSeaRoundOutcome = {
      roundId: currentRoundIdRef.current,
      crashMultiplier: finalCrash,
      serverSeed: currentServerSeed,
      clientSeed: currentClientSeed,
      nonce: currentNonce,
      hash: `${Math.random().toString(36).slice(2, 10)}...${Math.random().toString(36).slice(2, 10)}`,
      timestamp: Date.now(),
    };

    setHistory((prev) => [roundOutcome, ...prev.slice(0, 25)]);
    setCurrentNonce((prev) => prev + 1);

    // Notify backend /game/crash
    fetch('/game/crash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roundId: currentRoundIdRef.current,
        crashMultiplier: finalCrash,
      }),
    }).catch((err) => console.warn('[Game Crash API] non-fatal:', err));

    // After 3 seconds, start the next 5-second Betting Phase
    setTimeout(() => {
      startBettingPhase();
    }, 3000);
  }, [currentClientSeed, currentNonce, currentServerSeed]);

  // START / LAUNCH THE DIVE (Triggered automatically by countdown timer OR manually by user click)
  const launchDiveNow = useCallback(() => {
    // Clear countdown if running
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    const b1Placed = bet1Ref.current.status === 'placed';
    const b2Placed = bet2Ref.current.status === 'placed';
    const totalStake = (b1Placed ? bet1Ref.current.betAmount : 0) + (b2Placed ? bet2Ref.current.betAmount : 0);

    // Deduct stake if bets placed
    if (totalStake > 0) {
      if (isPracticeModeRef.current) {
        setPracticeBalance((prev) => Math.max(0, prev - totalStake));
      } else {
        if (onGameStartRef.current) {
          if (b1Placed) onGameStartRef.current(bet1Ref.current.betAmount, 'deepSeaJet');
          if (b2Placed) onGameStartRef.current(bet2Ref.current.betAmount, 'deepSeaJet');
        } else if (onResultRef.current) {
          if (b1Placed) onResultRef.current(0, bet1Ref.current.betAmount, 'deepSeaJet', 0);
          if (b2Placed) onResultRef.current(0, bet2Ref.current.betAmount, 'deepSeaJet', 0);
        }
        if (onUpdateBalanceRef.current) onUpdateBalanceRef.current();
      }
    }

    // Synchronous Provably Fair RNG generation for 0ms startup lag
    const eVal = 2 ** 32;
    const hVal = Math.floor(Math.random() * (eVal / 100)) + 1;
    let targetCrash = Math.random() < 0.035
      ? 1.00
      : Math.max(1.02, Math.min(1000.0, Math.floor(((100 * eVal - hVal) / (eVal - hVal)) / 100 * 100) / 100));

    const newRoundId = `dsj-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    setCurrentRoundId(newRoundId);
    currentRoundIdRef.current = newRoundId;
    setCrashMultiplier(targetCrash);
    crashMultiplierRef.current = targetCrash;
    setMultiplier(1.0);
    multiplierRef.current = 1.0;

    // Background call to backend /game/start
    fetch('/game/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientSeed: currentClientSeed,
        nonce: currentNonce,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.crashMultiplier) {
          targetCrash = data.crashMultiplier;
          crashMultiplierRef.current = targetCrash;
          setCrashMultiplier(targetCrash);
          if (data.serverSeedHash) setCurrentServerSeed(data.serverSeedHash);
          if (data.roundId) {
            currentRoundIdRef.current = data.roundId;
            setCurrentRoundId(data.roundId);
          }
        }
      })
      .catch((e) => console.warn('[Game Start API] background sync:', e));

    // Build active fleet pilots
    const activePilots: SubmarinePilot[] = [
      { id: 'p1', callsign: 'CaptainNemo', rank: 'Fleet Admiral', betAmount: Math.floor(Math.random() * 800 + 100), currency: activeCurrency, status: 'diving' },
      { id: 'p2', callsign: 'AbyssExplorer', rank: 'Commander', betAmount: Math.floor(Math.random() * 400 + 50), currency: activeCurrency, status: 'diving' },
      { id: 'p3', callsign: 'DeepDiver99', rank: 'Lieutenant', betAmount: Math.floor(Math.random() * 200 + 20), currency: activeCurrency, status: 'diving' },
      { id: 'p4', callsign: 'SonarScout', rank: 'Scout', betAmount: Math.floor(Math.random() * 150 + 10), currency: activeCurrency, status: 'diving' },
    ];

    if (b1Placed) {
      activePilots.unshift({
        id: 'user-1',
        callsign: userRef.current.displayName || 'You (Helm 1)',
        rank: 'Sub Captain',
        betAmount: bet1Ref.current.betAmount,
        currency: activeCurrency,
        status: 'diving',
        isUser: true,
      });
    }

    if (b2Placed) {
      activePilots.unshift({
        id: 'user-2',
        callsign: userRef.current.displayName || 'You (Helm 2)',
        rank: 'Sub Captain',
        betAmount: bet2Ref.current.betAmount,
        currency: activeCurrency,
        status: 'diving',
        isUser: true,
      });
    }

    setPilots(activePilots);

    // Audio & Launch Event
    soundManager.playSonarPing();
    soundManager.startEngineSound(1.0);

    // Set Game State to 'flying' IMMEDIATELY
    setGameState('diving');
    gameStateRef.current = 'diving';

    // Start 60 FPS Game Loop
    startTimeRef.current = performance.now();

    const tick = (now: number) => {
      const isCurrentFlying = gameStateRef.current === 'diving' || gameStateRef.current === 'flying';
      if (!isCurrentFlying) return;

      const elapsedSec = (now - startTimeRef.current) / 1000;
      // Formula matching Aviator velocity & acceleration:
      // Multiplier = 1 + (elapsed * 0.1) + slight natural acceleration curve
      const currentVal = Math.max(1.0, 1.0 + (elapsedSec * 0.1) + Math.pow(elapsedSec * 0.08, 1.8));
      const roundedVal = Number(currentVal.toFixed(2));

      multiplierRef.current = roundedVal;
      setMultiplier(roundedVal);

      // Sound update: pitch increases with multiplier
      soundManager.updateEngineSound(currentVal);
      if (currentVal > 5.0 && Math.floor(currentVal) % 4 === 0) {
        soundManager.playPressureAlert();
      }

      // Check Auto-Cashout 1
      const b1 = bet1Ref.current;
      if (b1.status === 'placed' && b1.isAutoCashout && b1.autoCashoutMultiplier && currentVal >= b1.autoCashoutMultiplier) {
        handleCashout(1);
      }

      // Check Auto-Cashout 2
      const b2 = bet2Ref.current;
      if (b2.status === 'placed' && b2.isAutoCashout && b2.autoCashoutMultiplier && currentVal >= b2.autoCashoutMultiplier) {
        handleCashout(2);
      }

      // Random bot pilots cashout
      if (Math.random() < 0.02) {
        setPilots((prev) =>
          prev.map((p) => {
            if (!p.isUser && p.status === 'diving' && Math.random() < 0.05 * currentVal) {
              return {
                ...p,
                status: 'cashed_out',
                cashoutMultiplier: roundedVal,
                profit: Math.floor(p.betAmount * (roundedVal - 1)),
              };
            }
            return p;
          })
        );
      }

      // Check for Crash / Catastrophic Hull Breach
      if (currentVal >= crashMultiplierRef.current) {
        crashGame(crashMultiplierRef.current);
        return;
      }

      gameLoopRef.current = requestAnimationFrame(tick);
    };

    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    gameLoopRef.current = requestAnimationFrame(tick);
  }, [
    activeCurrency,
    crashGame,
    currentClientSeed,
    currentNonce,
    handleCashout,
  ]);

  // START BETTING PHASE (5.0s Countdown)
  const startBettingPhase = useCallback(() => {
    // Clear any previous loops
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    setGameState('betting');
    gameStateRef.current = 'betting';
    setMultiplier(1.0);
    multiplierRef.current = 1.0;

    // Handle Auto-Bet
    setBet1((prev) => ({
      ...prev,
      status: autoBetConsole1Ref.current ? 'placed' : 'idle',
      winAmount: undefined,
      cashoutMultiplier: undefined,
    }));

    setBet2((prev) => ({
      ...prev,
      status: autoBetConsole2Ref.current ? 'placed' : 'idle',
      winAmount: undefined,
      cashoutMultiplier: undefined,
    }));

    setBettingCountdown(5.0);
    countdownTargetTimeRef.current = Date.now() + 5000;

    countdownIntervalRef.current = setInterval(() => {
      const remainingTime = Math.max(0, (countdownTargetTimeRef.current - Date.now()) / 1000);
      setBettingCountdown(Number(remainingTime.toFixed(1)));

      if (remainingTime <= 0.05) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        launchDiveNow();
      }
    }, 80);
  }, [launchDiveNow]);

  // Initial mount: Start the initial 5-second Betting Phase countdown once
  useEffect(() => {
    startBettingPhase();

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      soundManager.stopEngineSound();
    };
  }, []); // Run once on mount - independent of parent state updates

  const hasPlacedAnyBet = bet1.status === 'placed' || bet2.status === 'placed';
  const isFlying = gameState === 'diving' || gameState === 'flying';
  const currentTotalStake = (bet1.status === 'placed' ? bet1.betAmount : 0) + (bet2.status === 'placed' ? bet2.betAmount : 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-2 sm:p-4 overflow-y-auto no-scrollbar font-sans text-slate-100">
      <div className="relative w-full max-w-7xl bg-slate-900 border-2 border-cyan-500/30 rounded-[2.5rem] shadow-[0_0_80px_rgba(6,182,212,0.2)] overflow-hidden flex flex-col">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-slate-950/60 backdrop-blur-md">
          {/* Brand Logo & Telemetry */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <Compass className="w-6 h-6 text-cyan-400 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white tracking-wider flex items-center gap-1.5">
                  DEEP SEA JET
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    AVIATOR EDITION
                  </span>
                </h1>
              </div>
              <p className="text-[11px] font-bold text-slate-400">
                PROVABLY FAIR HYDRODYNAMIC DIVE ENGINE • 60 FPS
              </p>
            </div>
          </div>

          {/* Wallet Balance, Controls & Sound */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Wallet Chip */}
            <button
              id="game-wallet-chip"
              onClick={() => setShowCashier(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-950/90 border border-cyan-500/30 hover:border-cyan-400 rounded-2xl transition-all shadow-inner group"
            >
              <Wallet className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  {isPracticeMode ? 'Demo Tank' : 'Real Wallet'}
                </div>
                <div className="text-sm font-black text-cyan-300 font-mono">
                  {CURRENCY_SYMBOLS[activeCurrency]}
                  {currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </button>

            {/* Cashier Button */}
            <button
              id="open-cashier-modal"
              onClick={() => setShowCashier(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] uppercase tracking-wider transition-all"
            >
              Cashier
            </button>

            {/* Sound Toggle */}
            <button
              onClick={handleToggleSound}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all"
              title={isMuted ? 'Unmute Hydrophone Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>

            {/* Rules Button */}
            <button
              onClick={() => setShowRules(true)}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all hidden sm:block"
              title="Game Rules & Provably Fair Guide"
            >
              <BookOpen className="w-4 h-4 text-slate-300" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={handleToggleFullscreen}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all hidden sm:block"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 transition-all"
              title="Exit Deep Sea Jet"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Multiplier History Ribbon */}
        <div className="px-6 py-2 bg-slate-950/40 border-b border-cyan-500/10">
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

        {/* Main Game Interface Body */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(88vh-80px)] space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols: Canvas Arena & Dual Helm Consoles */}
            <div className="lg:col-span-8 flex flex-col space-y-4">
              {/* Deep Sea Hydrodynamic Canvas Arena */}
              <DeepSeaCanvas
                multiplier={multiplier}
                gameState={gameState}
                crashMultiplier={crashMultiplier}
                bettingCountdown={bettingCountdown}
              >
                {/* On-Screen Direct Cashout HUD during dive */}
                {isFlying && hasPlacedAnyBet && (
                  <div className="absolute bottom-4 left-4 right-4 z-30 flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row items-stretch gap-3">
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
                              {CURRENCY_SYMBOLS[activeCurrency]}
                              {(bet1.betAmount * multiplier).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                              {CURRENCY_SYMBOLS[activeCurrency]}
                              {(bet2.betAmount * multiplier).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                        <span>
                          CASHOUT BOTH HELMS NOW ({CURRENCY_SYMBOLS[activeCurrency]}
                          {((bet1.betAmount + bet2.betAmount) * multiplier).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {/* Celebratory Banner when bets were secured in this round */}
                {isFlying && (bet1.status === 'cashed_out' || bet2.status === 'cashed_out') && !(bet1.status === 'placed' || bet2.status === 'placed') && (
                  <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center justify-center">
                    <div className="px-6 py-3 bg-emerald-950/80 backdrop-blur-md border-2 border-emerald-500/50 rounded-2xl text-emerald-300 text-xs font-black flex items-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>ALL CASHOUTS SECURED! JET ACCELERATING...</span>
                    </div>
                  </div>
                )}

                {/* Launch Button During Betting Phase */}
                {gameState === 'betting' && (
                  <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center justify-center">
                    <button
                      id="onscreen-start-dive"
                      onClick={launchDiveNow}
                      className="w-full sm:w-auto min-w-[280px] py-4 px-8 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black rounded-2xl shadow-[0_10px_35px_rgba(6,182,212,0.55)] border border-cyan-300 transform active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-sm animate-pulse cursor-pointer"
                    >
                      <Play className="w-5 h-5 fill-current text-white" />
                      <span>
                        {currentTotalStake > 0
                          ? `LAUNCH DIVE NOW • ${CURRENCY_SYMBOLS[activeCurrency]}${currentTotalStake.toLocaleString()} STAKE`
                          : 'LAUNCH DIVE NOW • NO STAKE (SPECTATOR)'}
                      </span>
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
                  gameState={gameState === 'betting' ? 'idle' : gameState}
                  currentMultiplier={multiplier}
                  onPlaceBet={handlePlaceBet}
                  onCashout={handleCashout}
                  onStartDive={launchDiveNow}
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
                  gameState={gameState === 'betting' ? 'idle' : gameState}
                  currentMultiplier={multiplier}
                  onPlaceBet={handlePlaceBet}
                  onCashout={handleCashout}
                  onStartDive={launchDiveNow}
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
