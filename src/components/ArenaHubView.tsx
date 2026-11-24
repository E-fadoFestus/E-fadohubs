import React, { useState } from 'react';
import {
  TrendingUp,
  RotateCw,
  Waves,
  HelpCircle,
  Scale,
  Play,
  Flame,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { DeepSeaJetGame } from './DeepSeaJetGame';
import { LuckySpinWheel } from './LuckySpinWheel';
import { DigitalMoneyTrading } from './DigitalMoneyTrading';
import { EfadoMoneyCard } from './EfadoMoneyCard';
import { EfadoMoneyQuiz } from './EfadoMoneyQuiz';
import { EfadoEquilibrium } from './EfadoEquilibrium';
import { HubGuideNote } from './HubGuideNote';
import { UserProfile } from '../types';
import { db } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

interface ArenaHubViewProps {
  user: UserProfile | null;
  wallet: number;
  onResult: (winAmount: number, gameId: string, stake: number, metadata?: any) => void;
  onStakeDeduction?: (amount: number, gameId: string) => Promise<void>;
  onOpenCashier?: (tab?: 'overview' | 'profile' | 'deposit' | 'withdraw' | 'history' | 'settings') => void;
  onLogin?: () => void;
  initialGame?: 'jet' | 'spin' | 'dmt' | 'card' | 'quiz' | 'equilibrium';
}

export const ArenaHubView: React.FC<ArenaHubViewProps> = ({
  user,
  onResult,
  onStakeDeduction,
  onOpenCashier,
  onLogin,
  initialGame,
}) => {
  const [activeGame, setActiveGame] = useState<'none' | 'jet' | 'spin' | 'dmt' | 'card' | 'quiz' | 'equilibrium'>(
    initialGame || 'jet'
  );

  const handleGameResult = async (multiplier: number, bet: number, gameId: any, payoutOverride?: number) => {
    const winAmount = payoutOverride !== undefined ? payoutOverride : bet * multiplier;
    onResult(winAmount, String(gameId), bet, { multiplier });
  };

  const handleUpdateBalance = async (amount: number, type?: any) => {
    if (type === 'game_bet' && onStakeDeduction) {
      await onStakeDeduction(amount, 'moneyQuiz');
    } else if (type === 'game_win') {
      onResult(amount, 'moneyQuiz', 0, { multiplier: 1 });
    }
  };

  const handleAddTransaction = async (tx: any) => {
    try {
      await addDoc(collection(db, 'transactions'), {
        ...tx,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Arena transaction log warning:', err);
    }
  };

  const handleGameStart = async (amount: number, gameId: string) => {
    if (onStakeDeduction) {
      await onStakeDeduction(amount, gameId);
    }
  };

  const GAMES = [
    {
      id: 'jet',
      name: 'Deep Sea Jet',
      tag: 'Popular',
      badge: 'Crash Game',
      desc: 'Watch the multiplier climb and cash out before the submarine crashes.',
      accent: 'from-blue-600 to-cyan-500',
      icon: Waves,
      minStake: 100,
      maxMultiplier: 'Up to 10,000x',
    },
    {
      id: 'spin',
      name: 'Lucky Spin Wheel',
      tag: 'Instant Win',
      badge: 'Stage Wheels',
      desc: 'Spin the prize wheel and multiply your stake across bonus rounds.',
      accent: 'from-purple-600 to-pink-600',
      icon: RotateCw,
      minStake: 100,
      maxMultiplier: 'Up to 500x',
    },
    {
      id: 'dmt',
      name: 'Digital Money Trading',
      tag: 'Prediction',
      badge: 'Live Charts',
      desc: 'Predict whether the price will move up or down before the timer ends.',
      accent: 'from-emerald-600 to-teal-500',
      icon: TrendingUp,
      minStake: 200,
      maxMultiplier: 'Up to 2.5x',
    },
    {
      id: 'card',
      name: 'Efado Money Card',
      tag: 'Card Game',
      badge: 'Quick Rounds',
      desc: 'Pick winning cards to grow your payout and cash out whenever you choose.',
      accent: 'from-amber-600 to-orange-600',
      icon: Flame,
      minStake: 100,
      maxMultiplier: 'Up to 100x',
    },
    {
      id: 'quiz',
      name: 'Efado Money Quiz',
      tag: 'Knowledge',
      badge: 'Quiz Contest',
      desc: 'Answer questions accurately and faster than other players to win the pot.',
      accent: 'from-sky-600 to-indigo-600',
      icon: HelpCircle,
      minStake: 100,
      maxMultiplier: 'Prize Pot',
    },
    {
      id: 'equilibrium',
      name: 'Equilibrium Arena',
      tag: 'Choice Game',
      badge: 'Round Payouts',
      desc: 'Choose your side each round and earn rewards based on the winning outcome.',
      accent: 'from-indigo-600 to-purple-700',
      icon: Scale,
      minStake: 100,
      maxMultiplier: 'Dynamic Odds',
    },
  ];

  return (
    <div className="min-h-screen bg-[#070b19] text-white pb-20">
      {/* Top Banner / Game Switcher & Shadow Wallet Bar */}
      <div className="bg-slate-900/95 border-b border-white/10 px-3 sm:px-6 py-3 sticky top-14 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Game Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveGame('none')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                activeGame === 'none'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              All Games
            </button>
            {GAMES.map((g) => {
              const Icon = g.icon;
              const isActive = activeGame === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setActiveGame(g.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{g.name}</span>
                </button>
              );
            })}
          </div>

          {/* Shadow Wallet Summary + Fund / Cash Out (Visible on Phone, Tablet & Desktop) */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-white/10">
                <span className="text-[11px] text-slate-400 block leading-none">Deposit</span>
                <span className="text-xs sm:text-sm font-mono font-bold text-indigo-300 tabular-nums">
                  ₦{(user?.depositWallet || 0).toLocaleString()}
                </span>
              </div>
              <div className="px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-emerald-500/25">
                <span className="text-[11px] text-emerald-400 block leading-none">Winnings</span>
                <span className="text-xs sm:text-sm font-mono font-bold text-emerald-400 tabular-nums">
                  ₦{(user?.playerWallet || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {onOpenCashier && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenCashier('deposit')}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Fund</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenCashier('withdraw')}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Cash Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 mt-4 space-y-4">
        <HubGuideNote guideId="games" variant="dark" />

        {/* Active Game Window */}
        {activeGame === 'jet' && (
          <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 shadow-xl bg-slate-950 p-2 sm:p-4">
            {user ? (
              <DeepSeaJetGame
                user={user}
                onClose={() => setActiveGame('none')}
                onResult={handleGameResult}
                onGameStart={handleGameStart}
                onUpdateBalance={() => {}}
                onOpenWallet={(tab) => onOpenCashier?.(tab)}
              />
            ) : (
              <div className="text-center py-14 px-4">
                <Waves className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Deep Sea Jet</h3>
                <p className="text-slate-300 text-sm max-w-md mx-auto mb-5">
                  Sign in with your EFADO account to play and cash out your winnings directly.
                </p>
                <button
                  type="button"
                  onClick={onLogin}
                  className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-colors"
                >
                  Sign In to Play
                </button>
              </div>
            )}
          </div>
        )}

        {activeGame === 'spin' && (
          <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 shadow-xl bg-slate-950 p-3 sm:p-4">
            {user ? (
              <LuckySpinWheel
                user={user}
                onClose={() => setActiveGame('none')}
                onResult={handleGameResult}
                onOpenWallet={(tab) => onOpenCashier?.(tab)}
              />
            ) : (
              <div className="text-center py-14 px-4">
                <RotateCw className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Lucky Spin Wheel</h3>
                <p className="text-slate-300 text-sm max-w-md mx-auto mb-5">
                  Sign in with your EFADO account to spin the prize wheel.
                </p>
                <button
                  type="button"
                  onClick={onLogin}
                  className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm"
                >
                  Sign In to Play
                </button>
              </div>
            )}
          </div>
        )}

        {activeGame === 'dmt' && (
          <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 shadow-xl bg-slate-950 p-3 sm:p-4">
            {user ? (
              <DigitalMoneyTrading
                user={user}
                onClose={() => setActiveGame('none')}
                onResult={handleGameResult}
                onOpenWallet={(tab) => onOpenCashier?.(tab)}
              />
            ) : (
              <div className="text-center py-14 px-4">
                <TrendingUp className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Digital Money Trading</h3>
                <p className="text-slate-300 text-sm max-w-md mx-auto mb-5">
                  Sign in with your EFADO account to play with your shared wallet.
                </p>
                <button
                  type="button"
                  onClick={onLogin}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm"
                >
                  Sign In to Play
                </button>
              </div>
            )}
          </div>
        )}

        {activeGame === 'card' && (
          <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 shadow-xl bg-slate-950 p-3 sm:p-4">
            {user ? (
              <EfadoMoneyCard
                user={user}
                onClose={() => setActiveGame('none')}
                onResult={handleGameResult}
                onOpenWallet={(tab) => onOpenCashier?.(tab)}
              />
            ) : (
              <div className="text-center py-14 px-4">
                <Flame className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Efado Money Card</h3>
                <button
                  type="button"
                  onClick={onLogin}
                  className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm mt-4"
                >
                  Sign In to Play
                </button>
              </div>
            )}
          </div>
        )}

        {activeGame === 'quiz' && (
          <div className="relative rounded-2xl overflow-hidden border border-sky-500/30 shadow-xl bg-slate-950 p-3 sm:p-4">
            {user ? (
              <EfadoMoneyQuiz
                user={user}
                onUpdateBalance={handleUpdateBalance}
                onAddTransaction={handleAddTransaction}
                onClose={() => setActiveGame('none')}
                onOpenWallet={(tab) => onOpenCashier?.(tab)}
              />
            ) : (
              <div className="text-center py-14 px-4">
                <HelpCircle className="w-12 h-12 text-sky-400 mx-auto mb-3" />
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Efado Money Quiz</h3>
                <button
                  type="button"
                  onClick={onLogin}
                  className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm mt-4"
                >
                  Sign In to Play
                </button>
              </div>
            )}
          </div>
        )}

        {activeGame === 'equilibrium' && (
          <div className="relative rounded-2xl overflow-hidden border border-indigo-500/30 shadow-xl bg-slate-950 p-3 sm:p-4">
            {user ? (
              <EfadoEquilibrium
                user={user}
                onClose={() => setActiveGame('none')}
                onResult={handleGameResult}
                onGameStart={handleGameStart}
                onUpdateBalance={handleUpdateBalance}
                onAddTransaction={handleAddTransaction}
                onOpenWallet={(tab) => onOpenCashier?.(tab)}
              />
            ) : (
              <div className="text-center py-14 px-4">
                <Scale className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Equilibrium Arena</h3>
                <button
                  type="button"
                  onClick={onLogin}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm mt-4"
                >
                  Sign In to Play
                </button>
              </div>
            )}
          </div>
        )}

        {/* All Games Catalog */}
        {activeGame === 'none' && (
          <div className="pt-2">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                All Arena Games
              </h2>
              <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
                Pick any game to play using your main Deposit Pocket. All winnings go straight to your Winning Wallet.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {GAMES.map((g) => {
                const Icon = g.icon;
                return (
                  <div
                    key={g.id}
                    onClick={() => setActiveGame(g.id as any)}
                    className="group rounded-2xl bg-slate-900/90 border border-white/10 hover:border-cyan-400/50 p-5 sm:p-6 flex flex-col justify-between h-full transition-colors cursor-pointer shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div
                          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${g.accent} flex items-center justify-center text-white shadow-md`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-lg">
                          {g.badge}
                        </span>
                      </div>

                      <span className="text-xs font-medium text-slate-400 block mb-1">
                        {g.tag}
                      </span>
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {g.name}
                      </h3>
                      <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                        {g.desc}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                      <div className="text-xs text-slate-400">
                        <span>Reward: </span>
                        <span className="text-emerald-400 font-semibold">{g.maxMultiplier}</span>
                      </div>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors"
                      >
                        <span>Play</span>
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
