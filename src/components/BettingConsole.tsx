import React from 'react';
import { DeepSeaBet, DeepSeaCurrency } from '../types';
import { Play, TrendingUp, CheckCircle, Flame, ShieldAlert, Sparkles } from 'lucide-react';
import { soundManager } from '../services/sound';

interface BettingConsoleProps {
  consoleId: 1 | 2;
  bet: DeepSeaBet;
  onUpdateBet: (updated: Partial<DeepSeaBet>) => void;
  gameState: 'idle' | 'diving' | 'flying' | 'crashed' | 'betting';
  currentMultiplier: number;
  onPlaceBet: (consoleId: 1 | 2) => void;
  onCashout: (consoleId: 1 | 2) => void;
  onStartDive: () => void;
  hasPlacedAnyBet: boolean;
  currencySymbol: string;
  userBalance: number;
  isAutoBetActive: boolean;
  onToggleAutoBet: () => void;
}

export const BettingConsole: React.FC<BettingConsoleProps> = ({
  consoleId,
  bet,
  onUpdateBet,
  gameState,
  currentMultiplier,
  onPlaceBet,
  onCashout,
  onStartDive,
  hasPlacedAnyBet,
  currencySymbol,
  userBalance,
  isAutoBetActive,
  onToggleAutoBet,
}) => {
  const isDiving = gameState === 'diving' || gameState === 'flying';
  const isCrashed = gameState === 'crashed';
  const isBetActive = bet.status === 'placed';
  const isCashedOut = bet.status === 'cashed_out';

  // Live cashout potential
  const liveWinValue = bet.betAmount * currentMultiplier;

  const quickChips = currencySymbol === '₦' ? [
    { label: '+100', val: 100 },
    { label: '+500', val: 500 },
    { label: '+1K', val: 1000 },
    { label: '+5K', val: 5000 },
    { label: '+10K', val: 10000 },
  ] : [
    { label: '+10', val: 10 },
    { label: '+50', val: 50 },
    { label: '+100', val: 100 },
    { label: '+500', val: 500 },
    { label: '+1K', val: 1000 },
  ];

  const handleAdjustBet = (type: 'half' | 'double' | 'max') => {
    soundManager.playClick();
    if (type === 'half') {
      onUpdateBet({ betAmount: Math.max(10, Math.floor(bet.betAmount / 2)) });
    } else if (type === 'double') {
      onUpdateBet({ betAmount: Math.min(userBalance, bet.betAmount * 2) });
    } else if (type === 'max') {
      onUpdateBet({ betAmount: Math.max(10, Math.floor(userBalance)) });
    }
  };

  const handleAddChip = (amount: number) => {
    soundManager.playChipAdd();
    const newAmount = Math.min(userBalance, bet.betAmount + amount);
    onUpdateBet({ betAmount: Math.max(10, newAmount) });
  };

  return (
    <div className="bg-slate-900/95 border-2 border-cyan-500/20 rounded-[2rem] p-5 shadow-xl flex flex-col justify-between relative overflow-hidden backdrop-blur-md">
      {/* Console Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-xs font-black text-cyan-400">
            {consoleId}
          </div>
          <span className="text-xs font-black text-white uppercase tracking-wider">
            Consolidated Helm {consoleId === 1 ? 'Alpha' : 'Beta'}
          </span>
        </div>

        {/* Auto Bet Switch */}
        <button
          onClick={() => {
            soundManager.playClick();
            onToggleAutoBet();
          }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border transition-all ${
            isAutoBetActive
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>AUTO-BET: {isAutoBetActive ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Main Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Left column: Stake Inputs & Chips */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span>STAKE AMOUNT ({currencySymbol})</span>
            <span className="text-cyan-400">Balance: {currencySymbol}{userBalance.toLocaleString()}</span>
          </div>

          <div className="relative">
            <input
              type="number"
              disabled={gameState === 'diving' && isBetActive}
              value={bet.betAmount}
              onChange={(e) => onUpdateBet({ betAmount: Math.max(1, Number(e.target.value) || 0) })}
              className="w-full bg-slate-950/90 border-2 border-slate-800 focus:border-cyan-500 rounded-2xl py-3 px-4 text-white font-black text-lg focus:outline-none transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                disabled={gameState === 'diving' && isBetActive}
                onClick={() => handleAdjustBet('half')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-black transition-all"
              >
                ½
              </button>
              <button
                type="button"
                disabled={gameState === 'diving' && isBetActive}
                onClick={() => handleAdjustBet('double')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-black transition-all"
              >
                2X
              </button>
              <button
                type="button"
                disabled={gameState === 'diving' && isBetActive}
                onClick={() => handleAdjustBet('max')}
                className="px-2 py-1 bg-cyan-950 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-900 rounded-lg text-xs font-black transition-all"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Quick Increment Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {quickChips.map((chip) => (
              <button
                key={chip.val}
                type="button"
                disabled={gameState === 'diving' && isBetActive}
                onClick={() => handleAddChip(chip.val)}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 rounded-xl text-[10px] font-black shrink-0 transition-all"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Auto Cashout Multiplier */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={bet.isAutoCashout}
                onChange={(e) => onUpdateBet({ isAutoCashout: e.target.checked })}
                className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-950 w-4 h-4 cursor-pointer"
              />
              <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider">
                Auto Cashout:
              </span>
            </label>

            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.1"
                min="1.05"
                max="1000"
                disabled={!bet.isAutoCashout || (gameState === 'diving' && isBetActive)}
                value={bet.autoCashoutMultiplier || 2.0}
                onChange={(e) =>
                  onUpdateBet({ autoCashoutMultiplier: Math.max(1.05, Number(e.target.value) || 1.05) })
                }
                className={`w-20 bg-slate-950 border ${
                  bet.isAutoCashout ? 'border-cyan-500/60 text-cyan-300' : 'border-slate-800 text-slate-500'
                } rounded-xl py-1.5 px-2.5 text-right font-black text-xs focus:outline-none transition-all`}
              />
              <span className="text-xs font-black text-slate-500">x</span>
            </div>
          </div>
        </div>

        {/* Right column: Action Button (Stake / Cashout / Start Dive) */}
        <div className="h-full flex flex-col justify-center pt-2 md:pt-0">
          {/* Active Diving State */}
          {isDiving ? (
            isBetActive ? (
              // Cashout Button
              <button
                onClick={() => onCashout(consoleId)}
                className="w-full py-7 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-2xl shadow-[0_10px_35px_rgba(245,158,11,0.4)] transform active:scale-95 transition-all flex flex-col items-center justify-center gap-1 group animate-pulse"
              >
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-950">
                  <TrendingUp className="w-4 h-4 text-slate-950" />
                  <span>CASHOUT NOW</span>
                </div>
                <div className="text-2xl font-black tracking-tight text-slate-950">
                  {currencySymbol}{liveWinValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] font-black text-slate-900/80">
                  AT {currentMultiplier.toFixed(2)}x
                </div>
              </button>
            ) : isCashedOut ? (
              // Already Cashed Out
              <div className="w-full py-6 px-4 bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-300 font-black rounded-2xl flex flex-col items-center justify-center gap-1">
                <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>CASHED OUT</span>
                </div>
                <div className="text-xl font-black">
                  +{currencySymbol}{(bet.winAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-emerald-400/80 font-bold">
                  @ {bet.cashoutMultiplier?.toFixed(2)}x Multiplier
                </div>
              </div>
            ) : (
              // Waiting for Next Round
              <div className="w-full py-6 px-4 bg-slate-950 border border-slate-800 text-slate-500 font-black rounded-2xl flex flex-col items-center justify-center gap-1 text-center">
                <span className="text-xs uppercase tracking-widest">SUBMERSIBLE IN DIVE</span>
                <span className="text-[11px] text-slate-600">Waiting for next round</span>
              </div>
            )
          ) : isCrashed ? (
            // Crashed state
            <div className="w-full py-6 px-4 bg-rose-950/40 border-2 border-rose-500/30 text-rose-400 font-black rounded-2xl flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>HULL BREACHED</span>
              </div>
              <span className="text-xs text-rose-300/80 font-bold">Preparing Next Dive...</span>
            </div>
          ) : (
            // Idle State: Can Place Bet & Start Game
            <div className="flex flex-col gap-2.5">
              {bet.status === 'placed' ? (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => onPlaceBet(consoleId)}
                    className="w-full py-3.5 bg-rose-500/20 border border-rose-500/40 hover:bg-rose-500/30 text-rose-300 font-black rounded-xl text-xs uppercase tracking-widest transition-all"
                  >
                    CANCEL STAKE ({currencySymbol}{bet.betAmount.toLocaleString()})
                  </button>

                  {/* START DIVE BUTTON (Per User Directive: Game starts upon user's stake and start button) */}
                  <button
                    onClick={onStartDive}
                    className="w-full py-5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black rounded-2xl shadow-[0_10px_30px_rgba(6,182,212,0.4)] transform active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-sm animate-pulse"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>LAUNCH DIVE</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => onPlaceBet(consoleId)}
                    className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.3)] transform active:scale-95 transition-all flex flex-col items-center justify-center gap-1 uppercase tracking-widest text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-emerald-300" />
                      <span>PLACE STAKE</span>
                    </div>
                    <span className="text-sm font-black">
                      {currencySymbol}{bet.betAmount.toLocaleString()}
                    </span>
                  </button>

                  {hasPlacedAnyBet && (
                    <button
                      onClick={onStartDive}
                      className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>START DIVE NOW</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
