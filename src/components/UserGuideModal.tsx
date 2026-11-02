import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  UserPlus, 
  ShieldCheck, 
  Rocket, 
  Megaphone, 
  Coins, 
  Zap,
  CheckCircle2,
  HelpCircle,
  Globe,
  ArrowRight,
  Building2,
  CreditCard,
  MessageSquare,
  Video,
  Download,
  Gamepad2,
  ArrowDownCircle,
  Wallet,
  PlayCircle,
  Sparkles,
  Lock,
  Compass,
  Check
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
    { id: 'overview' as GuideTab, label: 'Quickstart', icon: Rocket, badge: 'Basics' },
    { id: 'nexus' as GuideTab, label: 'Nexus Hub & Reels', icon: MessageSquare, badge: 'Social & Media' },
    { id: 'games' as GuideTab, label: 'Gaming & Bets', icon: Gamepad2, badge: 'Fair Play' },
    { id: 'deposits' as GuideTab, label: 'Deposit & Flutterwave', icon: CreditCard, badge: 'Instant' },
    { id: 'withdrawals' as GuideTab, label: 'Cashouts & Bank', icon: ArrowDownCircle, badge: 'Payouts' },
    { id: 'advertising' as GuideTab, label: 'Ads & Market', icon: Megaphone, badge: 'Growth' },
  ];

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
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className="w-full max-w-5xl bg-slate-900 border border-white/10 rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-2xl relative my-auto"
          >
            {/* Top Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 sm:p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all z-50 text-slate-400 hover:text-white"
              aria-label="Close Guide"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[75vh]">
              {/* Sidebar Header & Tabs */}
              <div className="lg:col-span-4 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-6 sm:p-8 lg:p-10 text-white flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-900/40">
                      <HelpCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">EFADO Ecosystem</span>
                      <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight italic">
                        User Guide
                      </h2>
                    </div>
                  </div>

                  <p className="text-slate-300 font-medium text-xs leading-relaxed mb-6">
                    Master the EFADO platform: Social feed, reels streaming, provably fair games, multi-currency wallet deposits & fast bank withdrawals.
                  </p>

                  {/* Navigation Tab Selector (Scrollable on Mobile, List on Desktop) */}
                  <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 custom-scrollbar">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all whitespace-nowrap lg:whitespace-normal shrink-0 lg:shrink text-xs font-black uppercase tracking-wider ${
                            isActive 
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                              : 'bg-white/5 hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                          <span className="flex-1">{tab.label}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-md hidden sm:inline ${
                            isActive ? 'bg-white/20 text-white' : 'bg-black/30 text-slate-400'
                          }`}>
                            {tab.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="relative z-10 pt-6 hidden lg:block border-t border-white/10 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>256-Bit SSL & Sovereign Ledger</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Global Currency & Real Payouts</span>
                  </div>
                </div>
              </div>

              {/* Main Tab Content Area */}
              <div className="lg:col-span-8 p-5 sm:p-8 md:p-10 overflow-y-auto max-h-[75vh] custom-scrollbar space-y-8 bg-slate-900/90 text-white">
                
                {/* TAB 1: OVERVIEW & QUICKSTART */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="border-l-4 border-indigo-500 pl-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Step 1 of 5</span>
                      <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight italic">Getting Started on EFADO</h3>
                      <p className="text-xs text-slate-400 mt-1">Free instant account creation, universal access, and profile identity verification.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                          1
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-wider text-white">100% Free Registration</h4>
                        <p className="text-xs text-slate-300 leading-relaxed font-normal">
                          Sign in instantly using your Google account or email. There are zero signup fees or hidden subscription costs.
                        </p>
                        <ul className="space-y-1.5 pt-2 text-[11px] text-slate-300">
                          <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> One-Click Google Authentication</li>
                          <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Immediate Multi-Currency Wallet Provisioning</li>
                        </ul>
                      </div>

                      <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                          2
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-wider text-white">Bank Account Binding</h4>
                        <p className="text-xs text-slate-300 leading-relaxed font-normal">
                          Go to <strong>Wallet → Profile</strong> to bind your local or international bank details. This ensures instant withdrawals for any winnings or creator earnings.
                        </p>
                        <button 
                          onClick={onOpenProfile} 
                          className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-all pt-2"
                        >
                          Bind Bank Profile <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-5 bg-gradient-to-r from-indigo-950/60 to-purple-950/60 rounded-2xl border border-indigo-500/20 space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" /> What Can You Do on EFADO?
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div className="p-3 bg-black/30 rounded-xl">
                          <MessageSquare className="w-5 h-5 mx-auto text-cyan-400 mb-1" />
                          <span className="text-[10px] font-bold uppercase block text-white">Nexus Social</span>
                        </div>
                        <div className="p-3 bg-black/30 rounded-xl">
                          <Video className="w-5 h-5 mx-auto text-rose-400 mb-1" />
                          <span className="text-[10px] font-bold uppercase block text-white">Reels Studio</span>
                        </div>
                        <div className="p-3 bg-black/30 rounded-xl">
                          <Gamepad2 className="w-5 h-5 mx-auto text-emerald-400 mb-1" />
                          <span className="text-[10px] font-bold uppercase block text-white">Games Arena</span>
                        </div>
                        <div className="p-3 bg-black/30 rounded-xl">
                          <Wallet className="w-5 h-5 mx-auto text-amber-400 mb-1" />
                          <span className="text-[10px] font-bold uppercase block text-white">Instant Payouts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: NEXUS HUB (FEED, CHAT, REELS & DOWNLOADS) */}
                {activeTab === 'nexus' && (
                  <div className="space-y-6">
                    <div className="border-l-4 border-cyan-500 pl-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Step 2 of 5</span>
                      <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight italic">EFADO Nexus Hub: Chat, Reels & Posts</h3>
                      <p className="text-xs text-slate-400 mt-1">High-integrity social networking, real-time messaging, and high-speed video streaming.</p>
                    </div>

                    <div className="space-y-4">
                      {/* Reels Studio */}
                      <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-2">
                            <Video className="w-4 h-4" /> 1. EFADO Reels Studio (Video Uploads)
                          </span>
                          <span className="text-[9px] font-bold px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded">0% → 100% Real Progress</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-normal">
                          Upload videos of any size (including HD and 4MB+ videos). The studio uses direct Firebase Storage resumable upload (`uploadBytesResumable`) with automatic 1MB chunked fallback, ensuring no uploads get stuck at 0%.
                        </p>
                        <div className="p-3 bg-slate-950/60 rounded-xl text-[11px] text-slate-400 space-y-1">
                          <p><strong className="text-white">Instant Playback:</strong> Uploaded videos are served via HTTP 206 Partial Content byte-range streaming, so viewers can play instantly without downloading the whole file.</p>
                          <p><strong className="text-white">Creator Earnings:</strong> Earn real funds (up to ₦100 per 1k views) credited directly to your sovereign wallet balance.</p>
                        </div>
                      </div>

                      {/* Chat Integrity */}
                      <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                        <span className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" /> 2. Real-Time Chat & Group Rooms
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed font-normal">
                          Chat directly with other members or join specialized communities (Business, Talent, Marriage, Education).
                        </p>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                          <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> End-to-end secured socket & Firestore listeners</li>
                          <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Image, file, and voice message support</li>
                          <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Online presence & read receipt indicators</li>
                          <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Strict anti-spam & community moderation</li>
                        </ul>
                      </div>

                      {/* Media Download & Upload Integrity */}
                      <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                          <Download className="w-4 h-4" /> 3. Post Uploads & Media Download Integrity
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed font-normal">
                          Posts support rich text, multiple photos, and downloadable attachments. Every downloadable asset preserves its original MIME type and binary checksum to guarantee files are never corrupted in transit.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: GAMING ARENA & PROVABLY FAIR */}
                {activeTab === 'games' && (
                  <div className="space-y-6">
                    <div className="border-l-4 border-emerald-500 pl-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Step 3 of 5</span>
                      <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight italic">EFADO Gaming Arena & Provably Fair Play</h3>
                      <p className="text-xs text-slate-400 mt-1">Multiplayer skill games, verified mathematical seeds, and automated instant wallet crediting.</p>
                    </div>

                    <div className="space-y-4">
                      {/* Deep Sea Jet Crash */}
                      <div className="p-5 bg-gradient-to-br from-cyan-950/40 to-slate-800 rounded-2xl border border-cyan-500/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                            <Compass className="w-4 h-4 text-cyan-400" /> Deep Sea Jet Game (Efado Crash)
                          </span>
                          <span className="text-[9px] font-black px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/40">Game Hub Exclusive</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Place your stake, watch the submarine dive deeper, and cash out before the pressure wave collapses!
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-2.5 bg-black/40 rounded-xl">
                            <span className="text-[10px] text-slate-400 block uppercase">1. Set Stake</span>
                            <strong className="text-cyan-300">Min ₦100 / $1</strong>
                          </div>
                          <div className="p-2.5 bg-black/40 rounded-xl">
                            <span className="text-[10px] text-slate-400 block uppercase">2. Watch Multiplier</span>
                            <strong className="text-amber-300">1.01x up to 100x+</strong>
                          </div>
                          <div className="p-2.5 bg-black/40 rounded-xl">
                            <span className="text-[10px] text-slate-400 block uppercase">3. Hit Cashout</span>
                            <strong className="text-emerald-300">Instant Wallet Credit</strong>
                          </div>
                        </div>
                      </div>

                      {/* Provably Fair Cryptographic Verification */}
                      <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                          <Lock className="w-4 h-4 text-amber-400" /> Provably Fair Verification
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed font-normal">
                          All crash multipliers are generated using cryptographic SHA-256 server seeds combined with client seeds and nonces. Neither EFADO nor the player can alter the outcome once the round starts.
                        </p>
                      </div>

                      {/* Other Games */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-1">
                          <h5 className="text-xs font-bold text-white uppercase">Spin & Win / Fortune Wheel</h5>
                          <p className="text-[11px] text-slate-400">Spin for instant multipliers, bonus tokens, and daily jackpots.</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-1">
                          <h5 className="text-xs font-bold text-white uppercase">Efado Money Quiz</h5>
                          <p className="text-[11px] text-slate-400">Test academic, business, and general knowledge for real monetary rewards.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: DEPOSITS & FLUTTERWAVE */}
                {activeTab === 'deposits' && (
                  <div className="space-y-6">
                    <div className="border-l-4 border-amber-500 pl-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Step 4 of 5</span>
                      <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight italic">How to Deposit Funds (Flutterwave & Bank)</h3>
                      <p className="text-xs text-slate-400 mt-1">Multi-currency deposits via debit/credit cards, USSD, bank transfer, and direct CEO accounts.</p>
                    </div>

                    <div className="space-y-4">
                      {/* Method 1: Flutterwave */}
                      <div className="p-5 bg-indigo-950/40 rounded-2xl border border-indigo-500/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-indigo-400" /> Method A: Flutterwave Checkout (Instant & Automated)
                          </span>
                          <span className="text-[9px] font-bold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded">Global & Local</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Best for instant top-ups from anywhere in the world. Supports MasterCard, Visa, Verve, Bank USSD, Bank Transfer, Apple Pay, and Google Pay.
                        </p>
                        <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300">
                          <li>Open your <strong>Wallet</strong> and click <strong>Deposit</strong>.</li>
                          <li>Select the <strong>⚡ Flutterwave Checkout</strong> tab.</li>
                          <li>Enter your deposit amount (e.g. ₦1,000, $10, etc.) and click <strong>Pay with Flutterwave</strong>.</li>
                          <li>Complete payment in the secure popup. Your wallet balance is automatically credited in real time!</li>
                        </ol>
                      </div>

                      {/* Method 2: Direct CEO Bank Transfer */}
                      <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                          <Building2 className="w-4 h-4" /> Method B: Direct Bank Deposit (CEO Accounts)
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed font-normal">
                          For large sums or direct bank mobile app transfers:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-3 bg-black/30 rounded-xl space-y-1">
                            <strong className="text-white block uppercase text-[10px]">1. Copy CEO Account</strong>
                            <p className="text-slate-400 text-[11px]">Choose an authorized bank from the list and transfer via your banking app.</p>
                          </div>
                          <div className="p-3 bg-black/30 rounded-xl space-y-1">
                            <strong className="text-white block uppercase text-[10px]">2. Enter Sender Details</strong>
                            <p className="text-slate-400 text-[11px]">Type your Sender Bank, Account Number, and Name so admin can verify and credit you instantly.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: CASHOUTS & WITHDRAWALS */}
                {activeTab === 'withdrawals' && (
                  <div className="space-y-6">
                    <div className="border-l-4 border-rose-500 pl-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Step 5 of 5</span>
                      <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight italic">How to Withdraw Winnings & Balances</h3>
                      <p className="text-xs text-slate-400 mt-1">Direct payouts straight to your local or international bank account.</p>
                    </div>

                    <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                      <h4 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                        <ArrowDownCircle className="w-4 h-4 text-rose-400" /> Easy 3-Step Withdrawal Process
                      </h4>
                      
                      <div className="space-y-3 text-xs text-slate-300">
                        <div className="flex gap-3 p-3 bg-slate-950/60 rounded-xl">
                          <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">1</div>
                          <div>
                            <strong className="text-white uppercase block text-[11px]">Bind Your Bank Account in Profile</strong>
                            <p className="text-slate-400 text-[11px] mt-0.5">Go to Wallet → Profile. Choose your bank from the dropdown and enter your 10-digit account number.</p>
                          </div>
                        </div>

                        <div className="flex gap-3 p-3 bg-slate-950/60 rounded-xl">
                          <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">2</div>
                          <div>
                            <strong className="text-white uppercase block text-[11px]">Initiate Withdrawal Request</strong>
                            <p className="text-slate-400 text-[11px] mt-0.5">Go to Wallet → Withdraw. Enter the amount you wish to withdraw and confirm with your secure 4-digit PIN.</p>
                          </div>
                        </div>

                        <div className="flex gap-3 p-3 bg-slate-950/60 rounded-xl">
                          <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">3</div>
                          <div>
                            <strong className="text-white uppercase block text-[11px]">Fast Processing & Settlement</strong>
                            <p className="text-slate-400 text-[11px] mt-0.5">Withdrawal requests are processed immediately through automated gateway settlement or CEO approval queue.</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row gap-3">
                        <button 
                          onClick={onOpenProfile}
                          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                        >
                          Bind Bank Account Now
                        </button>
                        <button 
                          onClick={onClose}
                          className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                        >
                          Got It
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 6: ADS & MARKETPLACE */}
                {activeTab === 'advertising' && (
                  <div className="space-y-6">
                    <div className="border-l-4 border-purple-500 pl-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Bonus</span>
                      <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight italic">Advertising & Marketplace Hubs</h3>
                      <p className="text-xs text-slate-400 mt-1">Promote products, real estate, vehicles, and services to global EFADO users.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">Targeted Listings</h4>
                        <p className="text-xs text-slate-300 leading-relaxed font-normal">
                          Post in 11 categories (Hotels, Farmland, Housing, Machinery, Electronics) with rich image galleries and instant WhatsApp/phone contacts.
                        </p>
                      </div>
                      <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">Strategic Exposure</h4>
                        <p className="text-xs text-slate-300 leading-relaxed font-normal">
                          Choose from Free Lite (3 days) to Featured Plans to place your adverts at the top of the Global Feed and Search results.
                        </p>
                      </div>
                    </div>
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
