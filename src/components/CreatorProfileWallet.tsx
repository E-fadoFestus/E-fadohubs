import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coins, 
  ArrowUpRight, 
  Clock, 
  ShieldCheck, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Smartphone, 
  Zap, 
  X, 
  Sparkles,
  Award,
  HelpCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { CreatorStats } from '../types';
import { 
  loadCreatorStats, 
  releasePendingFunds, 
  withdrawCreatorFunds, 
  MIN_WITHDRAWAL_AMOUNT,
  BASE_PAYOUT_RATE,
  LAUNCH_BONUS_RATE,
  LAUNCH_BONUS_END_DATE
} from '../lib/creatorMonetization';

interface CreatorProfileWalletProps {
  userId: string;
  followersCount?: number;
  showEarningsBadge?: boolean;
  onToggleEarningsBadge?: (value: boolean) => void;
  isOwner?: boolean;
}

export const CreatorProfileWallet: React.FC<CreatorProfileWalletProps> = ({
  userId,
  followersCount = 1240,
  showEarningsBadge = true,
  onToggleEarningsBadge,
  isOwner = true
}) => {
  const [stats, setStats] = useState<CreatorStats>({
    availableBalance: 3200,
    pendingBalance: 1150,
    totalViews: 24520,
    todayViews: 142,
    todayEarnings: 28.4,
    inviteBonus: 650,
    rate: BASE_PAYOUT_RATE,
    launchBonusRate: LAUNCH_BONUS_RATE,
    launchBonusEnd: LAUNCH_BONUS_END_DATE
  });

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showMonetizationRules, setShowMonetizationRules] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState<'BANK' | 'USSD' | 'CRYPTO_USDT'>('BANK');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('1000');
  const [bankName, setBankName] = useState('Access Bank');
  const [accountNumber, setAccountNumber] = useState('0123456789');
  const [accountName, setAccountName] = useState('Festus Efado');
  const [ussdPhone, setUssdPhone] = useState('+234 803 123 4567');
  const [ussdNetwork, setUssdNetwork] = useState('MTN');
  const [cryptoAddress, setCryptoAddress] = useState('TXYZ9876543210TRC20USDT');
  const [cryptoNetwork, setCryptoNetwork] = useState('TRC-20 (Tron)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [animatedPendingPing, setAnimatedPendingPing] = useState(false);

  // Load initial stats
  useEffect(() => {
    loadCreatorStats(userId).then((res) => {
      setStats(res);
    });

    // Listen for real-time qualified view increments
    const handleViewQualified = (e: any) => {
      const detail = e.detail;
      setStats((prev) => ({
        ...prev,
        pendingBalance: detail.pendingBalance ?? +(prev.pendingBalance + 0.2).toFixed(2),
        todayEarnings: detail.todayEarnings ?? +(prev.todayEarnings + 0.2).toFixed(2),
        todayViews: detail.todayViews ?? prev.todayViews + 1,
        totalViews: detail.totalViews ?? prev.totalViews + 1
      }));
      setAnimatedPendingPing(true);
      setTimeout(() => setAnimatedPendingPing(false), 2000);
    };

    const handleFundsReleased = (e: any) => {
      setStats(e.detail);
    };

    const handleBonusCredited = (e: any) => {
      setStats(e.detail);
    };

    window.addEventListener('creator-view-qualified', handleViewQualified);
    window.addEventListener('creator-funds-released', handleFundsReleased);
    window.addEventListener('creator-invite-bonus-credited', handleBonusCredited);

    return () => {
      window.removeEventListener('creator-view-qualified', handleViewQualified);
      window.removeEventListener('creator-funds-released', handleFundsReleased);
      window.removeEventListener('creator-invite-bonus-credited', handleBonusCredited);
    };
  }, [userId]);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum < MIN_WITHDRAWAL_AMOUNT) {
      setStatusMessage({
        type: 'error',
        text: `Minimum withdrawal is ₦${MIN_WITHDRAWAL_AMOUNT.toLocaleString()} from available balance.`
      });
      return;
    }

    if (amountNum > stats.availableBalance) {
      setStatusMessage({
        type: 'error',
        text: `Insufficient available balance! You can only withdraw up to ₦${stats.availableBalance.toLocaleString()} (Pending funds cannot be withdrawn until 7-day maturity).`
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const details: Record<string, string> = 
      withdrawMethod === 'BANK' ? { bankName, accountNumber, accountName } :
      withdrawMethod === 'USSD' ? { ussdPhone, ussdNetwork } :
      { cryptoAddress, cryptoNetwork };

    const result = await withdrawCreatorFunds(userId, amountNum, withdrawMethod, details);

    setIsSubmitting(false);
    if (result.success) {
      setStatusMessage({
        type: 'success',
        text: result.message
      });
      setStats((prev) => ({
        ...prev,
        availableBalance: result.remainingAvailable ?? prev.availableBalance - amountNum
      }));
      setTimeout(() => {
        setShowWithdrawModal(false);
        setStatusMessage(null);
      }, 2500);
    } else {
      setStatusMessage({
        type: 'error',
        text: result.message
      });
    }
  };

  const handleReleasePending = async () => {
    setIsSubmitting(true);
    const updated = await releasePendingFunds(userId);
    setStats(updated);
    setIsSubmitting(false);
    alert(`Successfully released ₦${stats.pendingBalance.toLocaleString()} to Available Balance!`);
  };

  // Privacy protection: If viewer is not owner, do not reveal exact balance numbers
  if (!isOwner) {
    if (showEarningsBadge) {
      return (
        <div className="mb-4 flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-2xl">
          <Award className="w-5 h-5 text-[#FACC15]" />
          <div>
            <span className="text-xs font-bold text-white uppercase tracking-wider">Verified Creator</span>
            <p className="text-[11px] text-amber-300 font-semibold">🏆 ₦10K+ Earner Tier</p>
          </div>
        </div>
      );
    }
    return null;
  }

  const availableBalance = stats.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pendingBalance = stats.pendingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const todayEarnings = stats.todayEarnings.toFixed(2);
  const todayViews = stats.todayViews.toLocaleString();
  const totalViews = stats.totalViews.toLocaleString();
  const inviteBonus = stats.inviteBonus.toLocaleString();
  const followers = followersCount.toLocaleString();

  return (
    <div className="w-full">
      {/* 1. SEPARATE CREATOR WALLET - EXACT PROMPT SPECIFIED MARKUP */}
      <div className="bg-gradient-to-r from-[#8B5CF6] via-[#06B6D4] to-[#FACC15] p-4 rounded-2xl shadow-2xl mb-4 text-white relative overflow-hidden group">
        
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex justify-between items-center mb-2 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-white/80 text-xs font-bold tracking-wider">CREATOR WALLET</p>
              <button 
                type="button"
                onClick={() => setShowMonetizationRules(true)}
                className="text-white/70 hover:text-white transition-colors"
                title="Monetization Rules & Payout Rates"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
            <h2 className="text-white font-bold text-3xl tracking-tight">₦{availableBalance}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-white/80 text-xs font-medium">
                ₦{pendingBalance} Pending - Release in 7d
              </p>
              {animatedPendingPing && (
                <span className="inline-block px-1.5 py-0.2 bg-emerald-400 text-slate-950 text-[9px] font-black rounded-full animate-bounce">
                  +₦0.20
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => setShowWithdrawModal(true)}
              className="bg-white text-[#8B5CF6] px-4 py-2 rounded-xl font-bold shadow-lg hover:bg-white/95 active:scale-95 transition-all text-sm cursor-pointer"
            >
              Withdraw
            </button>
          </div>
        </div>
        
        <p className="text-white text-sm font-semibold tracking-wide relative z-10">
          +₦{todayEarnings} Today from {todayViews} Views
        </p>

        <div className="grid grid-cols-3 gap-2 mt-3 text-center relative z-10">
          <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
            <p className="text-white font-bold text-sm sm:text-base">{totalViews}</p>
            <p className="text-white/70 text-xs font-medium">Total Views</p>
          </div>
          <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
            <p className="text-white font-bold text-sm sm:text-base">₦{inviteBonus}</p>
            <p className="text-white/70 text-xs font-medium">Invite Bonus</p>
          </div>
          <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
            <p className="text-white font-bold text-sm sm:text-base">{followers}</p>
            <p className="text-white/70 text-xs font-medium">Followers</p>
          </div>
        </div>

        {/* Action micro-bar: Fast release demo & quick tips */}
        <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-[11px] text-white/80">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Min ₦1,000 Payout • Nigerian Banks & USDT</span>
          </span>
          <div className="flex items-center gap-2">
            {stats.pendingBalance > 0 && (
              <button 
                type="button"
                onClick={handleReleasePending}
                disabled={isSubmitting}
                className="underline hover:text-white font-bold cursor-pointer"
                title="Transfer mature 7-day pending views to available balance"
              >
                Release Mature (7d)
              </button>
            )}
            <button 
              type="button"
              onClick={() => setShowMonetizationRules(true)}
              className="bg-black/20 hover:bg-black/30 px-2 py-0.5 rounded-md font-bold transition-all text-[10px]"
            >
              Rates & Rules →
            </button>
          </div>
        </div>
      </div>

      {/* WITHDRAWAL MODAL */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-[#0E1528] border border-white/15 rounded-3xl p-6 shadow-2xl text-white space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#06B6D4] flex items-center justify-center text-white shadow-lg">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">Withdraw Creator Earnings</h3>
                    <p className="text-xs text-slate-400">
                      Available: <span className="text-emerald-400 font-bold">₦{availableBalance}</span> (Min ₦1,000)
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowWithdrawModal(false)}
                  className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Message */}
              {statusMessage && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  statusMessage.type === 'success' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              {/* Payout Channels Tabs: Bank, USSD, Crypto USDT */}
              <div className="grid grid-cols-3 gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setWithdrawMethod('BANK')}
                  className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    withdrawMethod === 'BANK' ? 'bg-[#8B5CF6] text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Bank</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWithdrawMethod('USSD')}
                  className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    withdrawMethod === 'USSD' ? 'bg-[#06B6D4] text-black shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>USSD</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWithdrawMethod('CRYPTO_USDT')}
                  className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    withdrawMethod === 'CRYPTO_USDT' ? 'bg-[#FACC15] text-black shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>USDT</span>
                </button>
              </div>

              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                {/* Amount input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300">Withdrawal Amount (₦)</label>
                    <button 
                      type="button"
                      onClick={() => setWithdrawAmount(Math.floor(stats.availableBalance).toString())}
                      className="text-[10px] font-bold text-[#06B6D4] hover:underline"
                    >
                      Max Available (₦{availableBalance})
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₦</span>
                    <input 
                      type="number"
                      min={MIN_WITHDRAWAL_AMOUNT}
                      max={stats.availableBalance}
                      step="50"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="1000"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-9 pr-4 py-3 text-sm text-white font-bold outline-none focus:border-[#8B5CF6] transition-all"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    * Minimum withdrawal threshold: ₦1,000. Funds deduct from Available Balance only.
                  </p>
                </div>

                {/* Bank Fields */}
                {withdrawMethod === 'BANK' && (
                  <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Select Nigerian Bank</label>
                      <select 
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full bg-[#0A0F1E] border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#8B5CF6]"
                      >
                        <option value="Access Bank">Access Bank</option>
                        <option value="GTBank (Guaranty Trust)">GTBank (Guaranty Trust)</option>
                        <option value="Zenith Bank">Zenith Bank</option>
                        <option value="First Bank of Nigeria">First Bank of Nigeria</option>
                        <option value="United Bank for Africa (UBA)">United Bank for Africa (UBA)</option>
                        <option value="Kuda Microfinance Bank">Kuda Microfinance Bank</option>
                        <option value="OPay">OPay</option>
                        <option value="Palmpay">Palmpay</option>
                        <option value="Moniepoint">Moniepoint</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Account Number (10 Digits)</label>
                      <input 
                        type="text"
                        maxLength={10}
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#8B5CF6]"
                        placeholder="0123456789"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Account Beneficiary Name</label>
                      <input 
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#8B5CF6]"
                        placeholder="Account name as on BVN"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* USSD Fields */}
                {withdrawMethod === 'USSD' && (
                  <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Mobile Telecom Network</label>
                      <select 
                        value={ussdNetwork}
                        onChange={(e) => setUssdNetwork(e.target.value)}
                        className="w-full bg-[#0A0F1E] border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#06B6D4]"
                      >
                        <option value="MTN">MTN Nigeria (*777# / MoMo)</option>
                        <option value="Airtel">Airtel Nigeria (*903# / SmartCash)</option>
                        <option value="Glo">Glo Nigeria (*805#)</option>
                        <option value="9mobile">9mobile (*996#)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Phone Number for USSD Payout</label>
                      <input 
                        type="tel"
                        value={ussdPhone}
                        onChange={(e) => setUssdPhone(e.target.value)}
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#06B6D4]"
                        placeholder="08031234567"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Crypto USDT Fields */}
                {withdrawMethod === 'CRYPTO_USDT' && (
                  <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Crypto Network</label>
                      <select 
                        value={cryptoNetwork}
                        onChange={(e) => setCryptoNetwork(e.target.value)}
                        className="w-full bg-[#0A0F1E] border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FACC15]"
                      >
                        <option value="TRC-20 (Tron)">USDT (TRC-20 - Lowest Fees)</option>
                        <option value="BEP-20 (BNB Smart Chain)">USDT (BEP-20 BSC)</option>
                        <option value="Polygon">USDT (Polygon)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">USDT Wallet Address</label>
                      <input 
                        type="text"
                        value={cryptoAddress}
                        onChange={(e) => setCryptoAddress(e.target.value.trim())}
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-[#FACC15]"
                        placeholder="e.g. TXyz..."
                        required
                      />
                    </div>
                    <p className="text-[10px] text-amber-300/80">
                      * Converted at real-time official peer rate (₦1,500 ≈ $1 USDT).
                    </p>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting || stats.availableBalance < MIN_WITHDRAWAL_AMOUNT}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] hover:from-[#7C3AED] hover:to-[#0891B2] text-white text-xs font-bold shadow-lg shadow-[#8B5CF6]/30 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? 'Processing Payout...' : 'Confirm Withdrawal ₦'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MONETIZATION RULES & LOGIC DRAWER */}
      <AnimatePresence>
        {showMonetizationRules && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#0E1528] border border-white/15 rounded-3xl p-6 shadow-2xl text-white space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#8B5CF6]/20 rounded-xl text-[#8B5CF6]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">EFADO Creator Monetization Rules</h3>
                    <p className="text-[11px] text-[#06B6D4]">Logical Earnings Engine & Payout Rates</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowMonetizationRules(false)}
                  className="p-1.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Payout rates */}
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Payout Rates
                  </h4>
                  <p className="text-slate-300">
                    <span className="font-bold text-white">1. Base Rate:</span> ₦200 per 1,000 qualified views (₦0.20 per qualified view).
                  </p>
                  <p className="text-slate-300">
                    <span className="font-bold text-amber-300">2. LAUNCH BONUS:</span> ₦500 per 1,000 qualified views until <span className="text-white font-semibold">2026-12-01</span>. Max ₦25,000 bonus per creator during promotional period.
                  </p>
                </div>

                {/* Qualified view definition */}
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-1.5">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#06B6D4]" />
                    Qualified View Definition
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    A view is qualified and counted towards earnings only when:
                  </p>
                  <ul className="list-disc list-inside text-slate-400 space-y-1 pl-1">
                    <li>Watch time <span className="text-white font-semibold">&gt;= 5 seconds</span> on any Reel or Video post.</li>
                    <li>Unique viewer IP and session.</li>
                    <li>Verified non-bot human audience.</li>
                  </ul>
                </div>

                {/* Earnings flow */}
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-1.5">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 text-[#8B5CF6]" />
                    Earnings Flow & 7-Day Escrow
                  </h4>
                  <ol className="list-decimal list-inside text-slate-300 space-y-1.5 pl-1">
                    <li><span className="font-bold text-white">Real-time:</span> ₦0.20 added instantly to your <span className="text-amber-300 font-semibold">pendingBalance</span> per qualified 5s view. Animated live counter.</li>
                    <li><span className="font-bold text-white">After 7 Days:</span> Amount automatically moves from <span className="text-amber-300 font-semibold">pendingBalance</span> into <span className="text-emerald-400 font-semibold">availableBalance</span>.</li>
                    <li><span className="font-bold text-white">Withdrawal:</span> Min ₦1,000 from <span className="text-emerald-400 font-semibold">availableBalance</span> only via Bank, USSD, or USDT.</li>
                  </ol>
                </div>

                {/* Other creator earnings */}
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-1.5">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Coins className="w-4 h-4 text-[#FACC15]" />
                    Other Streams to Creator Wallet
                  </h4>
                  <ul className="space-y-1 text-slate-300">
                    <li>• <span className="font-bold text-white">Live Gifts:</span> Creator receives 80% of coin value.</li>
                    <li>• <span className="font-bold text-white">Invite Bonus:</span> ₦50 to both users after new user signs up &amp; posts 1 gist (Max ₦5,000/mo).</li>
                    <li>• <span className="font-bold text-white">Ad Revenue Share:</span> 50% of ad revenue shown on your content.</li>
                  </ul>
                </div>

                {/* Privacy policy */}
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-[11px] text-indigo-200">
                  🔒 <span className="font-bold text-white">Privacy Guarantee:</span> Your Creator Wallet balances are strictly private and only visible to you. Other users only see the "₦10K+ Earner" badge if enabled in Profile Settings.
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  type="button"
                  onClick={() => setShowMonetizationRules(false)}
                  className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
