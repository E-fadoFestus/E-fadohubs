import React, { useState } from 'react';
import { 
  Gamepad2, 
  Sparkles, 
  TrendingUp, 
  RotateCw, 
  Waves, 
  Trophy, 
  HelpCircle, 
  Scale, 
  ArrowRight, 
  Play, 
  Flame,
  ShieldCheck,
  Wallet
} from 'lucide-react';
import { DeepSeaJetGame } from './DeepSeaJetGame';
import { LuckySpinWheel } from './LuckySpinWheel';
import { DigitalMoneyTrading } from './DigitalMoneyTrading';
import { EfadoMoneyCard } from './EfadoMoneyCard';
import { EfadoMoneyQuiz } from './EfadoMoneyQuiz';
import { EfadoEquilibrium } from './EfadoEquilibrium';
import { UserProfile } from '../types';

interface ArenaHubViewProps {
  user: UserProfile | null;
  wallet: number;
  onResult: (winAmount: number, gameId: string, stake: number, metadata?: any) => void;
  onStakeDeduction?: (amount: number, gameId: string) => Promise<void>;
  onOpenCashier?: () => void;
  onLogin?: () => void;
  initialGame?: 'jet' | 'spin' | 'dmt' | 'card' | 'quiz' | 'equilibrium';
}

export const ArenaHubView: React.FC<ArenaHubViewProps> = ({
  user,
  wallet,
  onResult,
  onStakeDeduction,
  onOpenCashier,
  onLogin,
  initialGame
}) => {
  const [activeGame, setActiveGame] = useState<'none' | 'jet' | 'spin' | 'dmt' | 'card' | 'quiz' | 'equilibrium'>(initialGame || 'jet');

  const handleGameResult = async (multiplier: number, bet: number, gameId: any, payoutOverride?: number) => {
    const winAmount = payoutOverride !== undefined ? payoutOverride : (bet * multiplier);
    onResult(winAmount, String(gameId), bet, { multiplier });
  };

  const handleUpdateBalance = async (_amount: number, _type?: any) => {
    // Handled in parent state
  };

  const handleAddTransaction = async (_tx: any) => {
    // Recorded in ledger
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
      tag: 'HOT • AVIATOR STYLE',
      badge: '98.5% RTP',
      desc: 'Uniform velocity acceleration crash dive. Eject your capsule before the pressure crushes the submarine!',
      accent: 'from-blue-600 via-cyan-500 to-indigo-700',
      icon: Waves,
      minStake: 100,
      maxMultiplier: '10,000x'
    },
    {
      id: 'spin',
      name: 'Lucky Spin Wheel',
      tag: 'INSTANT REWARDS',
      badge: 'STAGE WHEELS',
      desc: 'Progressive multi-tier prize wheel. Multiply your stake across consecutive bonus stages.',
      accent: 'from-purple-600 via-pink-600 to-amber-500',
      icon: RotateCw,
      minStake: 100,
      maxMultiplier: '500x'
    },
    {
      id: 'dmt',
      name: 'Digital Money Trading (DMT)',
      tag: 'FINANCIAL PREDICTION',
      badge: 'LIVE CHARTS',
      desc: 'Predict high-frequency currency movements in real-time. High precision candlestick charts.',
      accent: 'from-emerald-600 via-teal-500 to-green-700',
      icon: TrendingUp,
      minStake: 200,
      maxMultiplier: '2.5x'
    },
    {
      id: 'card',
      name: 'Efado Money Card',
      tag: 'CARD DUEL',
      badge: 'PROVABLY FAIR',
      desc: 'High-low probability card challenges with multiplier escalation and strategic cashouts.',
      accent: 'from-amber-600 to-orange-600',
      icon: Flame,
      minStake: 100,
      maxMultiplier: '100x'
    },
    {
      id: 'quiz',
      name: 'Efado Money Quiz',
      tag: 'KNOWLEDGE & SKILL',
      badge: 'P2P COMPETITION',
      desc: 'Test your acumen across academic subjects, general knowledge, and global affairs for cash pots.',
      accent: 'from-sky-600 to-indigo-600',
      icon: HelpCircle,
      minStake: 100,
      maxMultiplier: 'SKILL POT'
    },
    {
      id: 'equilibrium',
      name: 'Equilibrium Arena',
      tag: 'STRATEGY',
      badge: 'WEIGHTED ODDS',
      desc: 'Balance market forces, counter-balance stakes, and capture equilibrium dividends.',
      accent: 'from-indigo-600 to-purple-800',
      icon: Scale,
      minStake: 100,
      maxMultiplier: 'VARIABLE'
    }
  ];

  return (
    <div className="min-h-screen bg-[#070b19] text-white pb-20">
      {/* Top Banner / Game Switcher Tabs */}
      <div className="bg-slate-900/90 border-b border-cyan-500/20 px-4 py-3 sticky top-14 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setActiveGame('none')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeGame === 'none'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              🎮 All Games
            </button>
            {GAMES.map((g) => {
              const Icon = g.icon;
              const isActive = activeGame === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => setActiveGame(g.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/30'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{g.name}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Shared Wallet</span>
              <span className="text-xs font-mono font-black text-emerald-400">₦{wallet.toLocaleString()}</span>
            </div>
            {onOpenCashier && (
              <button
                onClick={onOpenCashier}
                className="px-2.5 py-1 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 text-xs font-bold font-mono transition-colors"
              >
                + Deposit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 mt-4">
        {/* Active Game Window */}
        {activeGame === 'jet' && (
          <div className="relative rounded-3xl overflow-hidden border border-cyan-500/30 shadow-2xl bg-slate-950 p-2 sm:p-4">
            {user ? (
              <DeepSeaJetGame
                user={user}
                onClose={() => setActiveGame('none')}
                onResult={handleGameResult}
                onGameStart={handleGameStart}
                onUpdateBalance={() => {}}
              />
            ) : (
              <div className="text-center py-16 px-4">
                <Waves className="w-16 h-16 text-cyan-400 mx-auto mb-4 animate-bounce" />
                <h3 className="text-2xl font-black mb-2">Deep Sea Jet Crash Game</h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
                  Sign in with your unified EFADO account to place stakes, monitor real-time acceleration, and cash out before collapse!
                </p>
                <button
                  onClick={onLogin}
                  className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/30 transition-all"
                >
                  Sign In to Play
                </button>
              </div>
            )}
          </div>
        )}

        {activeGame === 'spin' && (
          <div className="relative rounded-3xl overflow-hidden border border-purple-500/30 shadow-2xl bg-slate-950 p-4">
            {user ? (
              <LuckySpinWheel
                user={user}
                onClose={() => setActiveGame('none')}
                onResult={handleGameResult}
              />
            ) : (
              <div className="text-center py-16 px-4">
                <RotateCw className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-spin" />
                <h3 className="text-2xl font-black mb-2">Lucky Spin Wheel</h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">Sign in with your account to spin the progressive multiplier wheels.</p>
                <button onClick={onLogin} className="px-6 py-3 rounded-2xl bg-purple-600 text-white font-black text-sm">Sign In to Play</button>
              </div>
            )}
          </div>
        )}

        {activeGame === 'dmt' && (
          <div className="relative rounded-3xl overflow-hidden border border-emerald-500/30 shadow-2xl bg-slate-950 p-4">
            {user ? (
              <DigitalMoneyTrading
                user={user}
                onClose={() => setActiveGame('none')}
                onResult={handleGameResult}
              />
            ) : (
              <div className="text-center py-16 px-4">
                <TrendingUp className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-2xl font-black mb-2">Digital Money Trading</h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">Predict real-time currency movements with 1 shared wallet.</p>
                <button onClick={onLogin} className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-black text-sm">Sign In to Play</button>
              </div>
            )}
          </div>
        )}

        {activeGame === 'card' && (
          <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 shadow-2xl bg-slate-950 p-4">
            {user ? (
              <EfadoMoneyCard
                user={user}
                onClose={() => setActiveGame('none')}
                onResult={handleGameResult}
              />
            ) : (
              <div className="text-center py-16 px-4">
                <Flame className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <h3 className="text-2xl font-black mb-2">Efado Money Card</h3>
                <button onClick={onLogin} className="px-6 py-3 rounded-2xl bg-amber-600 text-white font-black text-sm mt-4">Sign In to Play</button>
              </div>
            )}
          </div>
        )}

        {activeGame === 'quiz' && (
          <div className="relative rounded-3xl overflow-hidden border border-sky-500/30 shadow-2xl bg-slate-950 p-4">
            {user ? (
              <EfadoMoneyQuiz
                user={user}
                onUpdateBalance={handleUpdateBalance}
                onAddTransaction={handleAddTransaction}
                onClose={() => setActiveGame('none')}
              />
            ) : (
              <div className="text-center py-16 px-4">
                <HelpCircle className="w-16 h-16 text-sky-400 mx-auto mb-4" />
                <h3 className="text-2xl font-black mb-2">Efado Money Quiz</h3>
                <button onClick={onLogin} className="px-6 py-3 rounded-2xl bg-sky-600 text-white font-black text-sm mt-4">Sign In to Play</button>
              </div>
            )}
          </div>
        )}

        {activeGame === 'equilibrium' && (
          <div className="relative rounded-3xl overflow-hidden border border-indigo-500/30 shadow-2xl bg-slate-950 p-4">
            {user ? (
              <EfadoEquilibrium
                user={user}
                onClose={() => setActiveGame('none')}
                onResult={handleGameResult}
                onGameStart={handleGameStart}
                onUpdateBalance={handleUpdateBalance}
                onAddTransaction={handleAddTransaction}
              />
            ) : (
              <div className="text-center py-16 px-4">
                <Scale className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
                <h3 className="text-2xl font-black mb-2">Equilibrium Arena</h3>
                <button onClick={onLogin} className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black text-sm mt-4">Sign In to Play</button>
              </div>
            )}
          </div>
        )}

        {/* All Games Grid (Shown when 'none' or as catalog below) */}
        {activeGame === 'none' && (
          <div className="mt-6">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-3xl font-black text-white">Arena Games Catalog</h2>
              <p className="text-slate-400 text-sm mt-2">
                All arena games are backed by the provably fair random seed protocol and payout directly to your unified cashout wallet.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {GAMES.map((g) => {
                const Icon = g.icon;
                return (
                  <div
                    key={g.id}
                    onClick={() => setActiveGame(g.id as any)}
                    className="group relative rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 p-6 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-xl hover:shadow-cyan-950/30 overflow-hidden"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${g.accent} flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded">
                          {g.badge}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block mb-1">
                        {g.tag}
                      </span>
                      <h3 className="text-xl font-black text-white group-hover:text-cyan-300 transition-colors">
                        {g.name}
                      </h3>
                      <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                        {g.desc}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                      <div className="text-[11px] font-mono text-slate-400">
                        <span>Max Win: </span>
                        <span className="text-emerald-400 font-bold">{g.maxMultiplier}</span>
                      </div>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs group-hover:translate-x-0.5 transition-transform">
                        <span>Play Now</span>
                        <Play className="w-3 h-3 fill-current" />
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
