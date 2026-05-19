import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, TrendingUp, Wallet, Zap, Coins, CreditCard, Info } from 'lucide-react';
import { AdminStats } from '../types';

interface EcosystemStatsProps {
  stats: AdminStats | null;
}

export const EcosystemStats: React.FC<EcosystemStatsProps> = ({ stats }) => {
  if (!stats) return null;

  const totalHouseGain = stats.totalHouseGain || 0;
  const adminWallet = stats.adminWallet || 0;
  
  // Calculate a percentage for the progress bar (e.g., reserve vs total gain)
  const reservePercentage = Math.min(100, (adminWallet / (totalHouseGain || 1)) * 100);

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
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Global Ecosystem Transparency</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">PWA Ecosystem Ready</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Feed Active</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Main Stats Card */}
          <div className="bg-slate-800/50 p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Ecosystem Gain</span>
              </div>
              
              <div className="mb-8">
                <span className="text-5xl md:text-7xl font-display font-black text-white tracking-tighter">
                  ${totalHouseGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ecosystem Reserve</span>
                  </div>
                  <span className="text-sm font-black text-white">${adminWallet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                
                <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${reservePercentage}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 shadow-[0_0_20px_rgba(79,70,229,0.5)]"
                  />
                </div>
                
                <p className="text-[10px] text-slate-500 italic flex items-center gap-2">
                  <Info className="w-3 h-3" />
                  * Randomization is weighted to ensure a 25% house edge on every spin. This ensures long-term profitability for the ecosystem.
                </p>
              </div>
            </div>
          </div>

          {/* Game Distribution */}
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
                  <p className="text-xl font-black text-white font-display">${game.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              ))}
              
              <div className="bg-indigo-600/10 p-5 rounded-2xl border border-indigo-500/20 flex flex-col justify-center items-center text-center">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Total Players</p>
                <p className="text-3xl font-black text-white font-display">{stats.totalPlayers || 0}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-2xl border border-white/5">
              <p className="text-xs text-slate-400 leading-relaxed">
                EFADO Hubs Connect is a fully transparent ecosystem. All game outcomes are provably fair, and ecosystem reserves are maintained to ensure instant payouts for all winners.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
