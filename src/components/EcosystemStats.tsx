import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, TrendingUp, Wallet, Zap, Coins, CreditCard, Info } from 'lucide-react';
import { AdminStats } from '../types';

interface EcosystemStatsProps {
  stats: AdminStats | null;
}

export const EcosystemStats: React.FC<EcosystemStatsProps> = ({ stats }) => {
  if (!stats) return null;

  const totalHouseGainNGN = stats.totalHouseGain || 0;
  const totalHouseGainUSD = stats.totalHouseGainUSD || 0;
  const totalHouseGainEUR = stats.totalHouseGainEUR || 0;
  const totalHouseGainGBP = stats.totalHouseGainGBP || 0;

  const adminWalletNGN = stats.adminWallet || 0;
  const adminWalletUSD = stats.adminWalletUSD || 0;
  const adminWalletEUR = stats.adminWalletEUR || 0;
  const adminWalletGBP = stats.adminWalletGBP || 0;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl mb-12"
    >
      <div className="p-8 md:p-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-black text-white tracking-tighter uppercase">Admin Dashboard</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Global Multi-Currency Ecosystem Transparency</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Multi-Currency Segregated</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Feed Active</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Main Segregated Stats Card */}
          <div className="bg-slate-800/50 p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Ecosystem Protocol Yields</span>
              </div>
              
              <div className="mb-6 space-y-2">
                <div className="flex items-baseline justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-bold text-slate-400">🇳🇬 NGN Vault Gain:</span>
                  <span className="text-3xl md:text-4xl font-display font-black text-emerald-400">
                    ₦{totalHouseGainNGN.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-baseline justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-bold text-slate-400">🇺🇸 USD Vault Gain:</span>
                  <span className="text-2xl md:text-3xl font-display font-black text-blue-400">
                    ${totalHouseGainUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-400">🇪🇺 EUR:</span>
                    <span className="text-sm font-black text-cyan-300">€{totalHouseGainEUR.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-400">🇬🇧 GBP:</span>
                    <span className="text-sm font-black text-purple-300">£{totalHouseGainGBP.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Segregated Liquid Reserves</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-emerald-500/20 text-center">
                    <span className="text-[9px] text-slate-400 block font-bold">₦ NGN</span>
                    <span className="text-xs font-black text-white font-mono">₦{adminWalletNGN.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-blue-500/20 text-center">
                    <span className="text-[9px] text-slate-400 block font-bold">$ USD</span>
                    <span className="text-xs font-black text-white font-mono">${adminWalletUSD.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-cyan-500/20 text-center">
                    <span className="text-[9px] text-slate-400 block font-bold">€ EUR</span>
                    <span className="text-xs font-black text-white font-mono">€{adminWalletEUR.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-purple-500/20 text-center">
                    <span className="text-[9px] text-slate-400 block font-bold">£ GBP</span>
                    <span className="text-xs font-black text-white font-mono">£{adminWalletGBP.toLocaleString()}</span>
                  </div>
                </div>
                
                <p className="text-[10px] text-slate-500 italic flex items-center gap-2 pt-2">
                  <Info className="w-3 h-3 shrink-0" />
                  * Sovereign vaults are fully segregated. Deposits, earnings, and payouts maintain independent currency ledger accounts.
                </p>
              </div>
            </div>
          </div>

          {/* Game Distribution & Total Players */}
          <div className="space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              Game Wallet Distribution
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Lucky Spin Arena', amount: stats.gameWallets?.spinGame || 0, icon: Coins, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                { label: 'EFADO Money Card', amount: stats.gameWallets?.moneyCard || 0, icon: CreditCard, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                { label: 'Digital Money Trading', amount: stats.gameWallets?.tradingGame || 0, icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10' }
              ].map((game, i) => (
                <div key={i} className="bg-slate-800/30 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 ${game.bg} rounded-lg`}>
                      <game.icon className={`w-4 h-4 ${game.color}`} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{game.label}</span>
                  </div>
                  <p className="text-xl font-black text-white font-display">₦{game.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              ))}
              
              <div className="bg-indigo-600/10 p-5 rounded-2xl border border-indigo-500/20 flex flex-col justify-center items-center text-center">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Total Players</p>
                <p className="text-3xl font-black text-white font-display">{stats.totalPlayers || 0}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-2xl border border-white/5">
              <p className="text-xs text-slate-400 leading-relaxed">
                EFADO Hubs Connect is a fully transparent ecosystem. All game outcomes are provably fair, and multi-currency reserves are segregated to ensure instant, frictionless payouts for all players worldwide.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
