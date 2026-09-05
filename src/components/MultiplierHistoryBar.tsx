import React from 'react';
import { DeepSeaRoundOutcome } from '../types';
import { ShieldCheck, History } from 'lucide-react';

interface MultiplierHistoryBarProps {
  history: DeepSeaRoundOutcome[];
  onSelectRound: (round: DeepSeaRoundOutcome) => void;
  onOpenFairness: () => void;
}

export const MultiplierHistoryBar: React.FC<MultiplierHistoryBarProps> = ({
  history,
  onSelectRound,
  onOpenFairness,
}) => {
  const getBadgeStyle = (mult: number) => {
    if (mult >= 10.0) {
      return 'bg-gradient-to-r from-amber-500/20 to-purple-500/20 border-amber-400/50 text-amber-300 hover:border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
    } else if (mult >= 2.0) {
      return 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300 hover:border-cyan-300';
    } else {
      return 'bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-500';
    }
  };

  return (
    <div className="flex items-center gap-3 w-full overflow-x-auto no-scrollbar py-2.5 px-4 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-cyan-500/20 shadow-lg">
      <div className="flex items-center gap-1.5 text-xs font-black text-cyan-400 uppercase tracking-widest shrink-0 mr-1">
        <History className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Dives:</span>
      </div>

      <div className="flex items-center gap-2 flex-1 overflow-x-auto no-scrollbar">
        {history.slice(0, 15).map((item, idx) => (
          <button
            key={`${item.roundId || 'round'}-${idx}`}
            onClick={() => onSelectRound(item)}
            className={`px-3 py-1 rounded-xl text-xs font-black border transition-all duration-200 shrink-0 transform active:scale-95 ${getBadgeStyle(
              item.crashMultiplier
            )}`}
            title={`Round #${item.roundId.slice(0, 8)} • Click to verify Provably Fair`}
          >
            {item.crashMultiplier.toFixed(2)}x
          </button>
        ))}
      </div>

      <button
        onClick={onOpenFairness}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-[11px] font-black text-cyan-300 transition-all uppercase tracking-wider shrink-0"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Provably Fair</span>
      </button>
    </div>
  );
};
