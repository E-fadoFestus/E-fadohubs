import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  HelpCircle,
  ShieldCheck,
  ArrowUpRight,
  CreditCard,
  Gamepad2,
  MessageCircle,
  Lightbulb
} from 'lucide-react';
import { openSupportHelpForm } from '../utils/helpSupport';

interface PaymentGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentGuidelinesModal: React.FC<PaymentGuidelinesModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'deposits' | 'payouts' | 'shadow' | 'faq'>('deposits');

  if (!isOpen) return null;

  const handleChatUs = () => {
    openSupportHelpForm({
      hub: 'Wallet & Paystack',
      subject: activeTab === 'payouts' ? 'Withdrawal' : 'Payment Issue',
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[3000] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="relative w-full max-w-4xl bg-slate-900 border border-indigo-500/35 rounded-3xl shadow-2xl text-white overflow-hidden my-auto"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 p-5 sm:p-7 border-b border-white/10 flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Verified Paystack Settlement &amp; Unified Wallet</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                EFADO Payment &amp; Withdrawal Guide
              </h2>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Clear steps to fund your Account Profile Wallet with Paystack, play with your Shadow Wallet, and withdraw cash straight to your bank.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-colors shrink-0 cursor-pointer"
              title="Close Guide"
              aria-label="Close Payment Guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 border-b border-white/10 bg-slate-950/60 overflow-x-auto">
            {[
              { id: 'deposits' as const, label: 'Paystack Deposits', icon: CreditCard },
              { id: 'payouts' as const, label: 'Bank Cash Outs', icon: ArrowUpRight },
              { id: 'shadow' as const, label: 'Shadow Wallet & Games', icon: Gamepad2 },
              { id: 'faq' as const, label: 'Quick Help', icon: HelpCircle }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-h-[44px] px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600/25 border-indigo-400 text-white'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Modal Body Content */}
          <div className="p-5 sm:p-7 space-y-5 max-h-[60vh] overflow-y-auto text-left">
            {activeTab === 'deposits' && (
              <div className="space-y-4 text-sm">
                <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-500/30">
                  <p className="text-slate-200 leading-relaxed">
                    <strong className="text-indigo-300">What is this?</strong> Instant wallet funding via Paystack Checkout (Card, Bank Transfer, or USSD) settled through EFADO&apos;s verified Paystack Settlement Bank.
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-indigo-300 mb-2">What to do:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-950/70 p-4 rounded-xl border border-white/10">
                      <strong className="text-white block mb-1">Step 1: Open Profile Wallet</strong>
                      <p className="text-slate-300 leading-relaxed">Open Wallet → Deposit Funds (or tap Fund inside any hub).</p>
                    </div>
                    <div className="bg-slate-950/70 p-4 rounded-xl border border-white/10">
                      <strong className="text-white block mb-1">Step 2: Enter Amount</strong>
                      <p className="text-slate-300 leading-relaxed">Type how much Naira you want to add and click Pay with Paystack.</p>
                    </div>
                    <div className="bg-slate-950/70 p-4 rounded-xl border border-white/10">
                      <strong className="text-white block mb-1">Step 3: Pay in Checkout</strong>
                      <p className="text-slate-300 leading-relaxed">Choose Card, Bank Transfer, or USSD inside the Paystack popup and finish payment.</p>
                    </div>
                    <div className="bg-slate-950/70 p-4 rounded-xl border border-white/10">
                      <strong className="text-white block mb-1">Step 4: Auto Credit</strong>
                      <p className="text-slate-300 leading-relaxed">Stay on the page for a few seconds until verification finishes and your balance updates.</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-emerald-950/35 border border-emerald-500/30 rounded-2xl">
                  <p className="text-xs font-bold uppercase text-emerald-300 mb-1">What happens next?</p>
                  <p className="text-slate-200 leading-relaxed">Your deposit reflects in your central Profile Wallet immediately and becomes available across Games, VTU, Market, Education, and Ads.</p>
                </div>

                <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-2xl">
                  <p className="text-xs font-bold uppercase text-amber-300 mb-1 flex items-center gap-1.5"><Lightbulb className="w-4 h-4" /> Example:</p>
                  <p className="text-slate-200 leading-relaxed">If you transfer ₦1,000 inside Paystack Checkout, it settles to the platform&apos;s Paystack Settlement Bank and credits your wallet automatically — no PIN manual activator needed.</p>
                </div>
              </div>
            )}

            {activeTab === 'payouts' && (
              <div className="space-y-4 text-sm">
                <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30">
                  <p className="text-slate-200 leading-relaxed">
                    <strong className="text-emerald-300">What is this?</strong> Withdraw your game winnings, creator earnings, or market sales directly into your verified bank account.
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-indigo-300 mb-2">What to do:</p>
                  <div className="space-y-2.5">
                    <div className="bg-slate-950/70 p-4 rounded-xl border border-white/10">
                      <strong className="text-white">Step 1:</strong> Go to <strong>Wallet → My Acc. Profile</strong>, pick your bank, and verify your 10-digit account number first.
                    </div>
                    <div className="bg-slate-950/70 p-4 rounded-xl border border-white/10">
                      <strong className="text-white">Step 2:</strong> Open <strong>Wallet → Withdraw Funds</strong> (or click Cash Out from any game).
                    </div>
                    <div className="bg-slate-950/70 p-4 rounded-xl border border-white/10">
                      <strong className="text-white">Step 3:</strong> Enter your amount and confirm with your 4-digit security PIN.
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-emerald-950/35 border border-emerald-500/30 rounded-2xl">
                  <p className="text-xs font-bold uppercase text-emerald-300 mb-1">What happens next?</p>
                  <p className="text-slate-200 leading-relaxed">Your payout runs through automated Paystack transfer or queues cleanly for quick CEO settlement directly to your saved bank.</p>
                </div>

                <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-2xl">
                  <p className="text-xs font-bold uppercase text-amber-300 mb-1 flex items-center gap-1.5"><Lightbulb className="w-4 h-4" /> Example:</p>
                  <p className="text-slate-200 leading-relaxed">If you win ₦3,500 on Lucky Spin, click Cash Out inside the game — it opens Profile Wallet where your saved bank receives the money cleanly.</p>
                </div>
              </div>
            )}

            {activeTab === 'shadow' && (
              <div className="space-y-4 text-sm">
                <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-500/30">
                  <p className="text-slate-200 leading-relaxed">
                    <strong className="text-cyan-300">What is this?</strong> Every game and hub displays a Shadow Wallet mirroring your central Account Profile Wallet so you never fund separate pockets.
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-indigo-300 mb-2">What to do:</p>
                  <div className="space-y-2.5">
                    <div className="bg-slate-950/70 p-4 rounded-xl border border-white/10">
                      <strong className="text-white">Step 1:</strong> Look at the top of any game — you see your real Deposit Wallet and Win Wallet balances live.
                    </div>
                    <div className="bg-slate-950/70 p-4 rounded-xl border border-white/10">
                      <strong className="text-white">Step 2:</strong> Tap <strong>Fund</strong> inside the game — it takes you straight to Profile Wallet to deposit via Paystack.
                    </div>
                    <div className="bg-slate-950/70 p-4 rounded-xl border border-white/10">
                      <strong className="text-white">Step 3:</strong> Play any of the 6 games. When you win, money enters your Win Wallet automatically; tap <strong>Cash Out</strong> to return to Profile Wallet and withdraw.
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-2xl">
                  <p className="text-xs font-bold uppercase text-amber-300 mb-1 flex items-center gap-1.5"><Lightbulb className="w-4 h-4" /> Example:</p>
                  <p className="text-slate-200 leading-relaxed">You do not need any manual PIN activator anymore. One ₦1,000 Paystack deposit in your Profile Wallet works immediately in Deep Sea Jet, Equilibrium, DMT, Spin, Card, and Quiz.</p>
                </div>
              </div>
            )}

            {activeTab === 'faq' && (
              <div className="space-y-4 text-sm">
                <div className="p-4 bg-slate-950 rounded-2xl border border-white/10 space-y-2">
                  <h4 className="font-bold text-white">Do I transfer to a personal bank account outside Paystack?</h4>
                  <p className="text-slate-300 leading-relaxed">No. Use Paystack Checkout inside Wallet → Deposit Funds. If you pick Bank Transfer inside Paystack, Paystack gives you a live checkout account for that transaction and credits you automatically.</p>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-white/10 space-y-2">
                  <h4 className="font-bold text-white">Where do I see my payment and game receipts?</h4>
                  <p className="text-slate-300 leading-relaxed">Open <strong>Wallet → History</strong> to see every Paystack deposit, game bet/win, VTU recharge, and bank withdrawal.</p>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-white/10 space-y-2">
                  <h4 className="font-bold text-white">What if my network cut off during Paystack payment?</h4>
                  <p className="text-slate-300 leading-relaxed">Do not panic — keep your Paystack reference or receipt screenshot and tap <strong>Need Help? Chat Us</strong> below so support resolves it fast.</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="p-4 sm:p-6 bg-slate-950 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleChatUs}
              className="min-h-[44px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Need Help? Chat Us</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-colors whitespace-nowrap cursor-pointer"
            >
              Got It, Close Guide
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
