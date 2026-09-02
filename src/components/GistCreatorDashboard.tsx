import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  DollarSign, 
  Eye, 
  Award, 
  Clock, 
  Coins, 
  ArrowUpRight, 
  CheckCircle2, 
  Building2, 
  CreditCard, 
  Sparkles, 
  X, 
  BarChart3, 
  ShieldCheck,
  Zap,
  HelpCircle
} from 'lucide-react';
import { UserProfile, CreatorStats } from '../types';

interface GistCreatorDashboardProps {
  user: UserProfile;
  onClose?: () => void;
  onRefresh?: () => void;
  onOpenReels?: () => void;
}

export const GistCreatorDashboard: React.FC<GistCreatorDashboardProps> = ({ user, onClose, onRefresh }) => {
  const [stats, setStats] = useState<CreatorStats>(() => {
    try {
      const saved = localStorage.getItem(`efado_creator_stats_${user.uid}`);
      return saved ? JSON.parse(saved) : {
        userId: user.uid,
        totalViews: 1245000,
        qualifiedViews: 43500,
        totalEarnings: 4350,
        withdrawnAmount: 0
      };
    } catch {
      return {
        userId: user.uid,
        totalViews: 1245000,
        qualifiedViews: 43500,
        totalEarnings: 4350,
        withdrawnAmount: 0
      };
    }
  });

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'BANK' | 'EFADO_WALLET'>('EFADO_WALLET');
  const [bankAccount, setBankAccount] = useState(user.accountNumber || '');
  const [bankName, setBankName] = useState(user.bankName || 'Access Bank');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [lastWithdrawnAmount, setLastWithdrawnAmount] = useState(0);

  const availableBalance = Math.max(0, stats.totalEarnings - (stats.withdrawnAmount || 0));

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid withdrawal amount.");
      return;
    }
    if (amt > availableBalance) {
      alert(`Withdrawal amount exceeds available balance (₦${availableBalance.toLocaleString()})!`);
      return;
    }
    if (amt < 500) {
      alert("Minimum withdrawal threshold is ₦500.");
      return;
    }

    const updatedStats: CreatorStats = {
      ...stats,
      withdrawnAmount: (stats.withdrawnAmount || 0) + amt
    };

    setStats(updatedStats);
    localStorage.setItem(`efado_creator_stats_${user.uid}`, JSON.stringify(updatedStats));
    setLastWithdrawnAmount(amt);
    setWithdrawSuccess(true);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 text-white">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-700 to-cyan-600 p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider">
                EFADO Creator Monetization
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Turn Your Content & Traffic Into Recurring Payouts
            </h2>
            <p className="text-sm text-purple-100 font-normal mt-2 max-w-2xl leading-relaxed">
              Earn <span className="font-bold text-amber-300">₦100 per 1,000 qualified views</span> (5s+ watch duration) across your posts and reels, plus 80% share on all live stream gifts!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowWithdrawModal(true)}
              className="px-6 py-3.5 bg-white text-purple-900 hover:bg-slate-100 font-bold text-xs uppercase tracking-wider rounded-2xl shadow-xl active:scale-95 transition-all flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" /> Withdraw Earnings
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Available Balance */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Balance</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-amber-300 tracking-tight mb-1">
            ₦{availableBalance.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 font-medium">Ready for instant cashout</p>
        </div>

        {/* Card 2: Total Qualified Views */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Qualified Views</span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Eye className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white tracking-tight mb-1">
            {stats.qualifiedViews.toLocaleString()}
          </p>
          <p className="text-xs text-cyan-300 font-medium">≥5 seconds watch time</p>
        </div>

        {/* Card 3: Total Impressions */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Impressions</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white tracking-tight mb-1">
            {(stats.totalViews / 1000000).toFixed(2)}M
          </p>
          <p className="text-xs text-emerald-300 font-medium">+18.4% viral reach this week</p>
        </div>

        {/* Card 4: Creator Level */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Creator Status</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-purple-300 tracking-tight mb-1">
            Rising Star ⭐
          </p>
          <p className="text-xs text-slate-400 font-medium">Next: Global Authority</p>
        </div>
      </div>

      {/* Monetization Rules & Analytics Visual */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Revenue Breakdown Chart */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" /> 7-Day Performance & Payout Growth
            </h3>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-slate-300 uppercase tracking-wider">
              Live Real-Time Tracker
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {[
              { day: 'Mon', views: 8200, earn: '₦820', pct: '75%' },
              { day: 'Tue', views: 9400, earn: '₦940', pct: '82%' },
              { day: 'Wed', views: 11200, earn: '₦1,120', pct: '90%' },
              { day: 'Thu', views: 7800, earn: '₦780', pct: '68%' },
              { day: 'Fri', views: 13500, earn: '₦1,350', pct: '95%' },
              { day: 'Sat', views: 15400, earn: '₦1,540', pct: '100%' },
              { day: 'Sun (Today)', views: 12100, earn: '₦1,210', pct: '88%' },
            ].map(item => (
              <div key={item.day} className="flex items-center gap-4">
                <span className="w-24 text-xs font-bold text-slate-300">{item.day}</span>
                <div className="flex-grow bg-white/5 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full rounded-full transition-all duration-700" 
                    style={{ width: item.pct }} 
                  />
                </div>
                <div className="w-32 text-right">
                  <span className="text-xs font-bold text-white mr-2">{item.views.toLocaleString()} views</span>
                  <span className="text-xs font-bold text-amber-300">{item.earn}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Monetization Guide & Requirements */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" /> How Monetization Works
          </h3>

          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-white/5 rounded-xl border border-white/5">
              <h4 className="font-bold text-purple-300 mb-1">1. Post Video Reels or High-Gist Posts</h4>
              <p className="text-slate-300 font-normal leading-relaxed">
                When readers and viewers consume your content for ≥5 seconds, it logs 1 qualified view.
              </p>
            </div>

            <div className="p-3.5 bg-white/5 rounded-xl border border-white/5">
              <h4 className="font-bold text-cyan-300 mb-1">2. Payout Math (₦100 per 1k views)</h4>
              <p className="text-slate-300 font-normal leading-relaxed">
                10,000 qualified views = ₦1,000. 100,000 views = ₦10,000. 1,000,000 views = ₦100,000 cash!
              </p>
            </div>

            <div className="p-3.5 bg-white/5 rounded-xl border border-white/5">
              <h4 className="font-bold text-amber-300 mb-1">3. Live Stream 80% Gift Revenue</h4>
              <p className="text-slate-300 font-normal leading-relaxed">
                Receive rockets, crowns, and diamonds during live streams with direct instant wallet conversions.
              </p>
            </div>

            <div className="p-3.5 bg-white/5 rounded-xl border border-white/5">
              <h4 className="font-bold text-emerald-300 mb-1">4. Direct Bank & Cashout Wallets</h4>
              <p className="text-slate-300 font-normal leading-relaxed">
                Withdraw anytime directly to your Nigerian commercial bank account or sovereign EFADO Cashout wallet.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-[#121A2F] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl text-white relative"
            >
              <button 
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawSuccess(false);
                }}
                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              {withdrawSuccess ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold">Withdrawal Initiated!</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Successfully requested <span className="text-amber-300 font-bold">₦{lastWithdrawnAmount.toLocaleString()}</span> to {withdrawMethod === 'BANK' ? `${bankName} (${bankAccount})` : 'EFADO Cashout Wallet'}.
                  </p>
                  <p className="text-xs text-slate-400">Funds are typically dispatched within 5 to 15 minutes.</p>
                  <button 
                    onClick={() => {
                      setShowWithdrawModal(false);
                      setWithdrawSuccess(false);
                    }}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-xs uppercase tracking-wider"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold">Withdraw Creator Earnings</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Available Balance: <span className="text-amber-300 font-bold">₦{availableBalance.toLocaleString()}</span>
                    </p>
                  </div>

                  {/* Destination Selector */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">Destination</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button"
                        onClick={() => setWithdrawMethod('EFADO_WALLET')}
                        className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                          withdrawMethod === 'EFADO_WALLET' 
                            ? 'bg-purple-600/20 border-purple-500 text-purple-300' 
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        <CreditCard className="w-5 h-5" />
                        <span>EFADO Cashout</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setWithdrawMethod('BANK')}
                        className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                          withdrawMethod === 'BANK' 
                            ? 'bg-purple-600/20 border-purple-500 text-purple-300' 
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        <Building2 className="w-5 h-5" />
                        <span>Bank Transfer</span>
                      </button>
                    </div>
                  </div>

                  {withdrawMethod === 'BANK' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">Bank Name</label>
                        <select 
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="w-full bg-[#0A0F1E] border border-white/10 px-4 py-2.5 rounded-xl text-sm text-white font-medium"
                        >
                          <option value="Access Bank">Access Bank</option>
                          <option value="GTBank">Guaranty Trust Bank (GTB)</option>
                          <option value="Zenith Bank">Zenith Bank</option>
                          <option value="First Bank">First Bank of Nigeria</option>
                          <option value="UBA">United Bank for Africa (UBA)</option>
                          <option value="Kuda Bank">Kuda Microfinance Bank</option>
                          <option value="Opay">OPay</option>
                          <option value="Palmpay">PalmPay</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">Account Number</label>
                        <input 
                          type="text"
                          placeholder="e.g. 0123456789"
                          value={bankAccount}
                          onChange={(e) => setBankAccount(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-sm text-white font-medium"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">Amount (₦)</label>
                    <input 
                      type="number"
                      placeholder={`Min 500, Max ${availableBalance}`}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 font-bold"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-purple-500/30 active:scale-95 transition-all mt-4"
                  >
                    Confirm Payout
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
