import React from 'react';
import { X, BookOpen, Anchor, Zap, ShieldAlert, Award, Compass, DollarSign } from 'lucide-react';

interface RulesModalProps {
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-slate-900 border-2 border-cyan-500/30 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">
                Deep Sea Jet Protocol
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Official Flight & Casino Descent Rules
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto no-scrollbar space-y-5 text-slate-300 text-xs leading-relaxed">
          {/* Section 1 */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-black text-sm uppercase">
              <Anchor className="w-4 h-4" />
              <span>1. Objective & Descent Mechanics</span>
            </div>
            <p>
              The <strong>Deep Sea Jet</strong> is an oceanic Efado crash game. You place your stake on Console 1 (and optionally Console 2). Upon clicking <strong>LAUNCH DIVE</strong>, the titanium submersible descends deep into the abyss.
            </p>
            <p>
              As the jet accelerates and plunges deeper, the multiplier climbs upward from <strong>1.00x</strong> to potential heights exceeding <strong>1,000.00x</strong>!
            </p>
          </div>

          {/* Section 2 */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-black text-sm uppercase">
              <DollarSign className="w-4 h-4" />
              <span>2. Cashing Out & Winning Criteria</span>
            </div>
            <p>
              You must click <strong>CASHOUT</strong> before a catastrophic hull implosion occurs!
            </p>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl font-mono text-emerald-300 text-xs">
              Winning Payout = Stake × Multiplier at Cashout Moment
            </div>
            <p>
              If you enabled <strong>Auto-Cashout</strong>, your funds are automatically secured the moment the target multiplier is reached without needing manual click reaction.
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-black text-sm uppercase">
              <ShieldAlert className="w-4 h-4" />
              <span>3. Implosion & Losing Criteria</span>
            </div>
            <p>
              At any unpredictable depth, hydrostatic pressure may breach the hull, triggering a total implosion. If the Deep Sea Jet implodes before you cash out, your stake for that console is forfeit.
            </p>
          </div>

          {/* Section 4 */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-black text-sm uppercase">
              <Compass className="w-4 h-4" />
              <span>4. Oceanic Depth Zones</span>
            </div>
            <ul className="space-y-1.5 list-disc list-inside text-slate-400">
              <li><strong className="text-cyan-300">Epipelagic Surface (0-200m):</strong> 1.00x - 1.50x — Calm light waters.</li>
              <li><strong className="text-indigo-300">Mesopelagic Twilight (200-1000m):</strong> 1.50x - 3.00x — Bioluminescence begins.</li>
              <li><strong className="text-purple-300">Bathypelagic Midnight (1000-4000m):</strong> 3.00x - 10.00x — Deep dark abyss.</li>
              <li><strong className="text-rose-400">Hadal Trench (4000m+):</strong> 10.00x+ — Extreme volatility & maximum rewards!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
