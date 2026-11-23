import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ShieldCheck,
  Rocket,
  Megaphone,
  HelpCircle,
  Globe,
  ArrowRight,
  CreditCard,
  MessageSquare,
  Video,
  Gamepad2,
  ArrowDownCircle,
  Wallet,
  MessageCircle,
  Check,
  Lightbulb
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile?: () => void;
}

type GuideTab = 'overview' | 'nexus' | 'games' | 'deposits' | 'withdrawals' | 'advertising';

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose, onOpenProfile }) => {
  const [activeTab, setActiveTab] = useState<GuideTab>('overview');

  const tabs = [
    { id: 'overview' as GuideTab, label: 'Quickstart', icon: Rocket },
    { id: 'games' as GuideTab, label: 'Game Zone (6 Games)', icon: Gamepad2 },
    { id: 'deposits' as GuideTab, label: 'Fund Wallet (Paystack)', icon: CreditCard },
    { id: 'withdrawals' as GuideTab, label: 'Cash Out to Bank', icon: ArrowDownCircle },
    { id: 'nexus' as GuideTab, label: 'Nexus & Reels', icon: MessageSquare },
    { id: 'advertising' as GuideTab, label: 'Ads & Market', icon: Megaphone },
  ];

  const handleChatUs = (category: string) => {
    window.dispatchEvent(new CustomEvent('open-help-chat', { detail: { category } }));
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[3000] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/95 backdrop-blur-2xl overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 12 }}
            className="w-full max-w-5xl bg-slate-900 border border-white/15 rounded-3xl overflow-hidden shadow-2xl relative my-auto"
          >
            {/* Top Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 sm:top-5 sm:right-5 min-h-[44px] min-w-[44px] flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-colors z-50 text-slate-200 hover:text-white cursor-pointer"
              aria-label="Close Guide"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Sidebar Header & Tabs */}
              <div className="lg:col-span-4 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-5 sm:p-7 text-white flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10">
                <div>
                  <div className="flex items-center gap-3 mb-3 pr-10">
                    <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0">
                      <HelpCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">EFADO Guide</span>
                      <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">How EFADO Works</h2>
                    </div>
                  </div>

                  <p className="text-slate-300 text-sm leading-relaxed mb-5">
                    Simple step-by-step guide so you do less thinking and get things done fast — from Paystack wallet funding to playing games and cashing out.
                  </p>

                  {/* Navigation Tabs */}
                  <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={`min-h-[44px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-colors whitespace-nowrap shrink-0 text-xs sm:text-sm font-bold cursor-pointer ${
                            isActive
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-6 hidden lg:block border-t border-white/10 space-y-2.5 mt-6">
                  <div className="flex items-center gap-2.5 text-xs text-slate-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>One Central Profile Wallet</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-300">
                    <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Verified Paystack Settlement</span>
                  </div>
                </div>
              </div>

              {/* Main Tab Content Area */}
              <div className="lg:col-span-8 p-5 sm:p-8 overflow-y-auto max-h-[72vh] space-y-5 bg-slate-900 text-white">
                {activeTab === 'overview' && (
                  <div className="space-y-5">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <h3 className="text-lg sm:text-xl font-black text-white">Quickstart on EFADO</h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        <strong className="text-indigo-300">What is this?</strong> One simple account that connects Games, Airtime/Data, Marketplace, Ads, Skills, Education, and Savings.
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-300">What to do:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1.5">
                          <span className="font-bold text-white block">Step 1: Sign in free</span>
                          <p className="text-slate-300 leading-relaxed">Sign in with Google or Email. Your Profile Wallet opens automatically with zero fees.</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1.5">
                          <span className="font-bold text-white block">Step 2: Fund once in Profile Wallet</span>
                          <p className="text-slate-300 leading-relaxed">Add money in Wallet via Paystack Checkout (Card, Bank Transfer, or USSD). No separate game deposit needed.</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1.5">
                          <span className="font-bold text-white block">Step 3: Use any Hub</span>
                          <p className="text-slate-300 leading-relaxed">Play all 6 games, buy MTN/Airtel/Glo data, post ads, buy WAEC e-PINs, or list items for sale.</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1.5">
                          <span className="font-bold text-white block">Step 4: Save your bank & Cash Out</span>
                          <p className="text-slate-300 leading-relaxed">Add your real 10-digit bank account under Wallet → My Acc. Profile so payouts reach your bank fast.</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-950/35 border border-emerald-500/30 rounded-2xl text-sm">
                      <p className="text-xs font-bold uppercase text-emerald-300 mb-1">What happens next?</p>
                      <p className="text-slate-200 leading-relaxed">Every hub reads from your main Profile Wallet (Shadow Wallet sync), so money you fund or win is always in one place.</p>
                    </div>

                    <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-2xl text-sm">
                      <p className="text-xs font-bold uppercase text-amber-300 mb-1 flex items-center gap-1.5"><Lightbulb className="w-4 h-4" /> Example:</p>
                      <p className="text-slate-200 leading-relaxed">If you fund ₦2,000 in Wallet once, you can spend ₦500 on MTN Data, stake ₦500 on Lucky Spin, and still have ₦1,000 left without paying twice.</p>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-1">
                      {onOpenProfile && (
                        <button
                          type="button"
                          onClick={onOpenProfile}
                          className="min-h-[44px] px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer"
                        >
                          <span>Bind Bank Account</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleChatUs('General Help')}
                        className="min-h-[44px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Need Help? Chat Us</span>
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'games' && (
                  <div className="space-y-5">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <h3 className="text-lg sm:text-xl font-black text-white">Game Zone (All 6 Games & Shadow Wallet)</h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        <strong className="text-emerald-300">What is this?</strong> Play Deep Sea Jet, Lucky Spin Wheel, Money Card, Digital Money Trading, Equilibrium, and Money Quiz using your Profile Wallet balance.
                      </p>
                    </div>

                    <div className="space-y-2.5 text-sm">
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-300">What to do:</h4>
                      <ul className="space-y-2.5">
                        <li className="p-3.5 bg-white/5 rounded-xl border border-white/10"><strong>Step 1:</strong> Check your Deposit & Win balances shown at the top of the Arena. Tap <strong>Fund</strong> if you need money — it opens your Profile Wallet directly.</li>
                        <li className="p-3.5 bg-white/5 rounded-xl border border-white/10"><strong>Step 2:</strong> Choose any of the 6 games, enter your stake (from ₦100 or ₦200), and tap Play or Launch.</li>
                        <li className="p-3.5 bg-white/5 rounded-xl border border-white/10"><strong>Step 3:</strong> Cash out in time (for Crash/Jet) or win your round to collect your multiplier payout.</li>
                        <li className="p-3.5 bg-white/5 rounded-xl border border-white/10"><strong>Step 4:</strong> Tap <strong>Cash Out</strong> anytime inside the game to go straight to Profile Wallet and withdraw to your bank.</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-emerald-950/35 border border-emerald-500/30 rounded-2xl text-sm">
                      <p className="text-xs font-bold uppercase text-emerald-300 mb-1">What happens next?</p>
                      <p className="text-slate-200 leading-relaxed">Stakes deduct cleanly, winnings go straight into your Win Wallet (playerWallet), and every game round shows in Wallet → History.</p>
                    </div>

                    <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-2xl text-sm">
                      <p className="text-xs font-bold uppercase text-amber-300 mb-1 flex items-center gap-1.5"><Lightbulb className="w-4 h-4" /> Example:</p>
                      <p className="text-slate-200 leading-relaxed">If you fund ₦1,000 in Profile Wallet and stake ₦300 on Equilibrium or Money Card and win 2x, ₦600 lands straight in your Win Wallet ready for Cash Out.</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleChatUs('Wallet & Payments')}
                      className="min-h-[44px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Need Help? Chat Us</span>
                    </button>
                  </div>
                )}

                {activeTab === 'deposits' && (
                  <div className="space-y-5">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <h3 className="text-lg sm:text-xl font-black text-white">How to Fund Your Wallet via Paystack</h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        <strong className="text-indigo-300">What is this?</strong> Fast, real-money funding straight into your central EFADO Account Profile Wallet using Card, Bank Transfer, or USSD.
                      </p>
                    </div>

                    <div className="space-y-2.5 text-sm">
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-300">What to do:</h4>
                      <ul className="space-y-2.5">
                        <li className="p-3.5 bg-white/5 rounded-xl border border-white/10"><strong>Step 1:</strong> Open <strong>Wallet → Deposit Funds</strong> (or tap Fund inside any game or hub).</li>
                        <li className="p-3.5 bg-white/5 rounded-xl border border-white/10"><strong>Step 2:</strong> Enter the Naira amount you want to deposit and click <strong>Pay with Paystack</strong>.</li>
                        <li className="p-3.5 bg-white/5 rounded-xl border border-white/10"><strong>Step 3:</strong> Inside the Paystack window, pay with Debit Card, Transfer, Bank, or USSD.</li>
                        <li className="p-3.5 bg-white/5 rounded-xl border border-white/10"><strong>Step 4:</strong> Wait a few seconds on the confirmation screen while Paystack verifies your payment automatically.</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-emerald-950/35 border border-emerald-500/30 rounded-2xl text-sm">
                      <p className="text-xs font-bold uppercase text-emerald-300 mb-1">What happens next?</p>
                      <p className="text-slate-200 leading-relaxed">Your payment settles through the verified Paystack Settlement Bank and your Profile Wallet balance updates automatically across all hubs.</p>
                    </div>

                    <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-2xl text-sm">
                      <p className="text-xs font-bold uppercase text-amber-300 mb-1 flex items-center gap-1.5"><Lightbulb className="w-4 h-4" /> Example:</p>
                      <p className="text-slate-200 leading-relaxed">Need ₦1,500 for data and games? Enter 1500, pick Transfer inside Paystack, send to the checkout account shown there, and your Wallet shows ₦1,500 immediately.</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleChatUs('Wallet & Payments')}
                      className="min-h-[44px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Need Help? Chat Us</span>
                    </button>
                  </div>
                )}

                {activeTab === 'withdrawals' && (
                  <div className="space-y-5">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <h3 className="text-lg sm:text-xl font-black text-white">How to Withdraw Money to Your Bank</h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        <strong className="text-emerald-300">What is this?</strong> Send your game winnings, marketplace sales, or creator earnings straight to your Nigerian bank account.
                      </p>
                    </div>

                    <div className="space-y-2.5 text-sm">
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-300">What to do:</h4>
                      <ul className="space-y-2.5">
                        <li className="p-3.5 bg-white/5 rounded-xl border border-white/10"><strong>Step 1:</strong> Open <strong>Wallet → My Acc. Profile</strong>, select your bank, enter your 10-digit account number, and confirm your account name.</li>
                        <li className="p-3.5 bg-white/5 rounded-xl border border-white/10"><strong>Step 2:</strong> Open <strong>Wallet → Withdraw Funds</strong> (or click Cash Out from any game).</li>
                        <li className="p-3.5 bg-white/5 rounded-xl border border-white/10"><strong>Step 3:</strong> Enter the amount to withdraw and confirm with your 4-digit security PIN.</li>
                        <li className="p-3.5 bg-white/5 rounded-xl border border-white/10"><strong>Step 4:</strong> Check <strong>Wallet → History</strong> to track your payout reference.</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-emerald-950/35 border border-emerald-500/30 rounded-2xl text-sm">
                      <p className="text-xs font-bold uppercase text-emerald-300 mb-1">What happens next?</p>
                      <p className="text-slate-200 leading-relaxed">Your payout routes cleanly through automated bank payout settlement or CEO clearance straight into your bank account.</p>
                    </div>

                    <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-2xl text-sm">
                      <p className="text-xs font-bold uppercase text-amber-300 mb-1 flex items-center gap-1.5"><Lightbulb className="w-4 h-4" /> Example:</p>
                      <p className="text-slate-200 leading-relaxed">If you won ₦5,000 in Deep Sea Jet, click Cash Out, verify your saved OPay or GTBank account, type 5000 + PIN, and receive your alert.</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {onOpenProfile && (
                        <button
                          type="button"
                          onClick={onOpenProfile}
                          className="min-h-[44px] px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold cursor-pointer"
                        >
                          Open Bank Profile
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleChatUs('Wallet & Payments')}
                        className="min-h-[44px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Need Help? Chat Us</span>
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'nexus' && (
                  <div className="space-y-5">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <h3 className="text-lg sm:text-xl font-black text-white">EFADO Nexus Hub, Chat & Reels</h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        <strong className="text-cyan-300">What is this?</strong> Post updates, chat directly or in groups, upload short video Reels, and earn Creator income on qualified views.
                      </p>
                    </div>

                    <div className="space-y-2.5 text-sm">
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-300">What to do:</h4>
                      <ul className="space-y-2.5">
                        <li className="p-3.5 bg-white/5 rounded-xl border border-white/10 flex gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-1" /> <span><strong>Step 1:</strong> Write a post or upload photos and videos on your feed or in Reels Studio.</span></li>
                        <li className="p-3.5 bg-white/5 rounded-xl border border-white/10 flex gap-2"><Video className="w-4 h-4 text-rose-400 shrink-0 mt-1" /> <span><strong>Step 2:</strong> Use Direct or Groups at the top to message friends, business partners, and forums.</span></li>
                        <li className="p-3.5 bg-white/5 rounded-xl border border-white/10 flex gap-2"><Wallet className="w-4 h-4 text-amber-400 shrink-0 mt-1" /> <span><strong>Step 3:</strong> Track your 5s+ qualified views and withdraw creator earnings (₦100 per 1,000 views) in Creator Wallet.</span></li>
                      </ul>
                    </div>

                    <div className="p-4 bg-emerald-950/35 border border-emerald-500/30 rounded-2xl text-sm">
                      <p className="text-xs font-bold uppercase text-emerald-300 mb-1">What happens next?</p>
                      <p className="text-slate-200 leading-relaxed">Your posts and reels stream smoothly on any phone, views add to your Creator balance, and you can withdraw earnings anytime.</p>
                    </div>

                    <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-2xl text-sm">
                      <p className="text-xs font-bold uppercase text-amber-300 mb-1 flex items-center gap-1.5"><Lightbulb className="w-4 h-4" /> Example:</p>
                      <p className="text-slate-200 leading-relaxed">If you share a helpful 30-second clip showing how you bake or repair phones, every 5-second viewer helps grow your Creator Wallet.</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleChatUs('General Help')}
                      className="min-h-[44px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Need Help? Chat Us</span>
                    </button>
                  </div>
                )}

                {activeTab === 'advertising' && (
                  <div className="space-y-5">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <h3 className="text-lg sm:text-xl font-black text-white">Advertising & Marketplace Hubs</h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        <strong className="text-purple-300">What is this?</strong> Advertise your products, skills, farm produce, property, or shop items so EFADO buyers can order or chat you directly.
                      </p>
                    </div>

                    <div className="space-y-2.5 text-sm">
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-300">What to do:</h4>
                      <ul className="space-y-2.5">
                        <li className="p-3.5 bg-white/5 rounded-xl border border-white/10"><strong>Step 1:</strong> Open <strong>Advertise</strong> or <strong>Market</strong> (Modern or Fairly Used), and tap Register Ad or Vendor Registration.</li>
                        <li className="p-3.5 bg-white/5 rounded-xl border border-white/10"><strong>Step 2:</strong> Upload real photos, add honest price and location details, and choose Free (3 days) or a paid plan.</li>
                        <li className="p-3.5 bg-white/5 rounded-xl border border-white/10"><strong>Step 3:</strong> Pay safely via Profile Wallet or Paystack when boosting or checking out, then reply to buyers fast.</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-emerald-950/35 border border-emerald-500/30 rounded-2xl text-sm">
                      <p className="text-xs font-bold uppercase text-emerald-300 mb-1">What happens next?</p>
                      <p className="text-slate-200 leading-relaxed">Your listing shows across the Marketplace, Ad Feed, and Search so buyers can pay through Escrow or contact you right away.</p>
                    </div>

                    <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-2xl text-sm">
                      <p className="text-xs font-bold uppercase text-amber-300 mb-1 flex items-center gap-1.5"><Lightbulb className="w-4 h-4" /> Example:</p>
                      <p className="text-slate-200 leading-relaxed">If you are a farmer selling garri, maize, or catfish, post inside Farmers & Agri-Hub with clear photos so wholesale buyers find and pay you fast.</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleChatUs('Technical Hub Issues')}
                      className="min-h-[44px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Need Help? Chat Us</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
