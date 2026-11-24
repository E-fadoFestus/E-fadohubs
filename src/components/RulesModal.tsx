import React from 'react';
import { X, BookOpen, Anchor, DollarSign, Lightbulb, MessageCircle } from 'lucide-react';
import { openSupportHelpForm } from '../utils/helpSupport';

interface RulesModalProps {
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  const handleHelp = () => {
    openSupportHelpForm({ hub: 'Game Zone', subject: 'Game Issue' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-slate-900 border border-cyan-500/35 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Deep Sea Jet Guide
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Simple steps to stake, cash out, and win
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Rules"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-slate-200 text-sm leading-relaxed">
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <p>
              <strong className="text-cyan-300">What is this?</strong> Deep Sea Jet is a fast crash game where your multiplier grows as the jet dives — cash out before it implodes to lock in your win.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm uppercase">
              <Anchor className="w-4 h-4 shrink-0" />
              <span>What to do:</span>
            </div>
            <ol className="space-y-2 list-decimal list-inside">
              <li>Check your balance at the top. Need money? Tap <strong>Fund</strong> to top up in your Profile Wallet via Paystack.</li>
              <li>Enter your stake amount (from ₦100) and optionally set Auto-Cashout (e.g. 2.00x).</li>
              <li>Tap <strong>Launch Dive</strong> and watch the multiplier climb from 1.00x upward.</li>
              <li>Hit <strong>Cashout</strong> before the submarine implodes!</li>
            </ol>
          </div>

          <div className="p-4 bg-emerald-950/35 rounded-2xl border border-emerald-500/30 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase">
              <DollarSign className="w-4 h-4 shrink-0" />
              <span>What happens next?</span>
            </div>
            <p>
              If you cash out in time, <strong>Stake × Multiplier</strong> enters your Win Wallet automatically. Tap <strong>Cash Out</strong> in the header anytime to withdraw to your bank from Profile Wallet.
            </p>
          </div>

          <div className="p-4 bg-amber-950/30 rounded-2xl border border-amber-500/30 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase">
              <Lightbulb className="w-4 h-4 shrink-0" />
              <span>Example:</span>
            </div>
            <p>
              If you stake ₦500 and hit Cashout at <strong>2.40x</strong> before implosion, <strong>₦1,200</strong> goes straight into your Win Wallet!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              type="button"
              onClick={handleHelp}
              className="min-h-[44px] flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Need Help? Chat Us</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-sm cursor-pointer"
            >
              Back to Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
