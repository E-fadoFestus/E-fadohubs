import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Handshake, 
  Globe, 
  ExternalLink, 
  Users, 
  TrendingUp, 
  Zap, 
  ShieldCheck, 
  Building2, 
  MessageSquare,
  ArrowRight,
  Code,
  Share2,
  PieChart,
  Target,
  Rocket
} from 'lucide-react';
import { UserProfile } from '../types';

interface PartnerHubProps {
  user: UserProfile | null;
  onNavigate: (hub: string) => void;
}

export const EfadoPartnerHub: React.FC<PartnerHubProps> = ({ user, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ORGANIZATIONS' | 'MARKETERS' | 'TOOLS'>('OVERVIEW');

  const PARTNER_BENEFITS = [
    {
      title: "Global Visibility",
      desc: "Get featured in our directory accessible to millions of global citizens.",
      icon: Globe,
      color: "text-blue-400"
    },
    {
      title: "Revenue Sharing",
      desc: "Earn commissions from every transaction made through your affiliate hook-ups.",
      icon: TrendingUp,
      color: "text-emerald-400"
    },
    {
      title: "API Hook-up",
      desc: "Connect your external website directly to our transactional backbone.",
      icon: Code,
      color: "text-purple-400"
    },
    {
      title: "Organization Status",
      desc: "Verified badges for companies and non-profits to build trust.",
      icon: ShieldCheck,
      color: "text-indigo-400"
    }
  ];

  const MOCK_PARTNERS = [
    { name: "Global Tech Solutions", sector: "Software", country: "USA", rating: 4.8 },
    { name: "African Agri-Trade", sector: "Agriculture", country: "Nigeria", rating: 4.9 },
    { name: "Euro Logistics Hub", sector: "Logistics", country: "Germany", rating: 4.7 }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      {/* Hero Section */}
      <div className="relative h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/80 to-slate-950" />
        
        <div className="relative z-10 text-center max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-6"
          >
            <Handshake className="w-4 h-4" />
            Strategic Affiliation Hub
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black italic tracking-tighter mb-6 leading-none"
          >
            HOOK-UP YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">ORGANIZATION</span> TO THE GLOBE
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto"
          >
            A unified connection portal for marketers, companies, and global citizens to affiliate, patronize, and synchronize.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-[-60px] relative z-20">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-12 overflow-x-auto pb-4 no-scrollbar">
          {[
            { id: 'OVERVIEW', label: 'Overview Hub', icon: Zap },
            { id: 'ORGANIZATIONS', label: 'Company Portal', icon: Building2 },
            { id: 'MARKETERS', label: 'Marketer Center', icon: Target },
            { id: 'TOOLS', label: 'Tech Hook-ups', icon: Code },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`px-8 py-5 rounded-[2rem] font-black tracking-widest text-xs transition-all flex items-center gap-3 whitespace-nowrap shadow-xl border ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white border-indigo-400 scale-105 shadow-indigo-500/20' 
                  : 'bg-slate-900/60 backdrop-blur-xl text-slate-400 border-white/5'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="uppercase">{item.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'OVERVIEW' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Benefits Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {PARTNER_BENEFITS.map((benefit, i) => (
                  <div key={i} className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/5 hover:border-indigo-500/30 transition-all group">
                    <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${benefit.color}`}>
                      <benefit.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-black text-white italic mb-3">{benefit.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{benefit.desc}</p>
                  </div>
                ))}
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                  <div className="relative z-10">
                    <h2 className="text-3xl font-black text-white mb-6 uppercase tracking-tighter italic">FOR COMPANIES & ORGANIZATIONS</h2>
                    <p className="text-indigo-100/80 mb-8 text-lg font-medium">Verify your business, connect your external platforms, and gain access to high-density global patronage.</p>
                    <button className="px-8 py-5 bg-white text-indigo-600 rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-xl hover:scale-105 transition-all">
                      Register My Organization <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 shadow-2xl group">
                  <h2 className="text-3xl font-black text-white mb-6 uppercase tracking-tighter italic">FOR MARKETERS & AFFILIATES</h2>
                  <p className="text-slate-400 mb-8 text-lg font-medium">Earn strategic commissions by connecting new users and businesses to the EFADO ecosystem across the globe.</p>
                  <button className="px-8 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-xl hover:scale-105 transition-all">
                    Start Marketing Now <Rocket className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Partner Directory Preview */}
              <div className="bg-slate-900/30 p-10 rounded-[3rem] border border-white/5">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Global Strategic Partners</h3>
                  <button className="text-xs font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300">View Full Directory →</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {MOCK_PARTNERS.map((partner, i) => (
                    <div key={i} className="bg-slate-900/60 p-6 rounded-3xl border border-white/5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                        <Users className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">{partner.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{partner.sector} • {partner.country}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'MARKETERS' && (
             <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="space-y-8"
             >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/5">
                      <div className="flex items-center justify-between mb-6">
                        <Share2 className="w-8 h-8 text-indigo-400" />
                        <span className="px-3 py-1 bg-indigo-500/10 rounded-full text-[8px] font-black text-indigo-400 uppercase tracking-widest">Active Links</span>
                      </div>
                      <h4 className="text-xl font-black text-white uppercase italic mb-2">Invite Hubs</h4>
                      <p className="text-slate-500 text-xs mb-6">Share your unique link and earn from every new sign-up and subsequent transactions.</p>
                      <button className="w-full py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10">Copy My Link</button>
                   </div>
                   
                   <div className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/5">
                      <div className="flex items-center justify-between mb-6">
                        <PieChart className="w-8 h-8 text-emerald-400" />
                        <span className="px-3 py-1 bg-emerald-500/10 rounded-full text-[8px] font-black text-emerald-400 uppercase tracking-widest">Commission</span>
                      </div>
                      <h4 className="text-xl font-black text-white uppercase italic mb-2">Performance Tracker</h4>
                      <p className="text-slate-500 text-xs mb-6">Real-time tracking of your clicks, conversions, and total earnings across hubs.</p>
                      <p className="text-3xl font-black text-emerald-400 italic font-mono">$0.00</p>
                   </div>
 
                   <div className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/5">
                      <div className="flex items-center justify-between mb-6">
                        <Target className="w-8 h-8 text-rose-400" />
                        <span className="px-3 py-1 bg-rose-500/10 rounded-full text-[8px] font-black text-rose-400 uppercase tracking-widest">Incentives</span>
                      </div>
                      <h4 className="text-xl font-black text-white uppercase italic mb-2">Marketer Rewards</h4>
                      <p className="text-slate-500 text-xs mb-6">Reach strategic milestones to unlock higher commission rates and verified badges.</p>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                         <div className="h-full bg-rose-500 w-[10%]" />
                      </div>
                   </div>
                </div>
             </motion.div>
          )}

          {activeTab === 'ORGANIZATIONS' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 text-center max-w-3xl mx-auto">
                <Building2 className="w-20 h-20 text-indigo-400 mx-auto mb-8 animate-bounce" />
                <h3 className="text-3xl font-black text-white uppercase italic mb-4">Organizational Verification</h3>
                <p className="text-slate-400 mb-10 leading-relaxed font-medium">
                  Elevate your company status on EFADO. Verified organizations receive priority listing in market hubs, lower transaction fees, and a "Global Strategic Partner" badge.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-10">
                  {[
                    "Corporate Identity Check",
                    "Tax Registration Validation",
                    "Global Reach Analysis",
                    "Patron Trust Scoring"
                  ].map((check, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      <span className="text-xs font-black text-white/80 uppercase">{check}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full py-6 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] shadow-2xl hover:scale-105 transition-all">
                  Upload Corporate Documents
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'TOOLS' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 text-center max-w-4xl mx-auto"
            >
              <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-purple-500/10 rounded-full border border-purple-500/20 mb-8">
                <Code className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400">Developer & External Sync</span>
              </div>
              <h3 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-8">
                THE EFADO <span className="text-indigo-400 italic">BACKBONE</span> HOOK-UP
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-900/60 p-10 rounded-[2.5rem] border border-white/5 text-left group hover:border-purple-500/30 transition-all">
                  <div className="w-14 h-14 bg-purple-600/20 rounded-2xl flex items-center justify-center mb-6 text-purple-400">
                    <ExternalLink className="w-7 h-7" />
                  </div>
                  <h4 className="text-xl font-black text-white uppercase italic mb-4">External Site Integration</h4>
                  <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                    Hook-up your existing e-commerce site, blog, or logistics portal to EFADO the North Star Hubs. Sync inventory and payments seamlessly.
                  </p>
                  <code className="block p-4 bg-black/40 rounded-xl text-[10px] font-mono text-purple-300 mb-8 border border-white/5">
                    {`<script src="https://api.efado.com/v1/sync.js"></script>`}
                  </code>
                  <button className="w-full py-4 bg-white/5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white border border-white/5 group-hover:bg-purple-600 transition-all">
                    Documentation
                  </button>
                </div>

                <div className="bg-slate-900/60 p-10 rounded-[2.5rem] border border-white/5 text-left group hover:border-indigo-500/30 transition-all">
                  <div className="w-14 h-14 bg-indigo-600/20 rounded-2xl flex items-center justify-center mb-6 text-indigo-400">
                    <Zap className="w-7 h-7" />
                  </div>
                  <h4 className="text-xl font-black text-white uppercase italic mb-4">Transaction Webhooks</h4>
                  <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                    Receive real-time notifications for affiliate sign-ups, commission payouts, and market activity directly to your server.
                  </p>
                  <div className="flex items-center gap-3 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 mb-8">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-400 uppercase">Live Webhook Status: Active</span>
                  </div>
                  <button className="w-full py-4 bg-white/5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white border border-white/5 group-hover:bg-indigo-600 transition-all">
                    Generate Secret Key
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
