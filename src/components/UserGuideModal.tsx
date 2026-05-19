import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  UserPlus, 
  ShieldCheck, 
  Rocket, 
  Megaphone, 
  Coins, 
  Target, 
  Zap,
  CheckCircle2,
  HelpCircle,
  Cpu,
  Globe,
  ArrowRight
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-5xl bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all z-50 group"
            >
              <X className="w-6 h-6 text-slate-400 group-hover:text-white" />
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[70vh]">
              {/* Sidebar Info */}
              <div className="lg:col-span-4 bg-indigo-600 p-10 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md">
                    <HelpCircle className="w-10 h-10" />
                  </div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter leading-none mb-6 italic">
                    Universal <br /> <span className="text-indigo-200">User Protocol</span>
                  </h2>
                  <p className="text-indigo-100 font-medium leading-relaxed uppercase tracking-tighter text-sm opacity-80">
                    Your complete operational manual for the EFADO ecosystem. Master the neural grid and unlock sovereign equity.
                  </p>
                </div>

                <div className="relative z-10 pt-12 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                       <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Identity Guard</p>
                      <p className="text-xs font-bold">Encrypted Account Logic</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                       <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Fast Propogation</p>
                      <p className="text-xs font-bold">Instant Signal Delivery</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Sections */}
              <div className="lg:col-span-8 p-8 md:p-12 overflow-y-auto max-h-[85vh] custom-scrollbar space-y-16 bg-slate-900">
                
                {/* 1. Account Creation */}
                <section className="space-y-8">
                  <div className="flex items-center gap-4 border-l-4 border-indigo-500 pl-6">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
                      <UserPlus className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Establish Your Identity</h3>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Protocol 01: Account Deployment</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">Free Registration</h4>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">Creating an account on EFADO is 100% free. Simply establish a connection using your Google identity to instantly synchronize with the grid.</p>
                      <ul className="space-y-2">
                        {['Single Sign-On (SSO)', 'Cloud Identity Sync', 'Zero Setup Cost'].map(f => (
                          <li key={f} className="flex items-center gap-2 text-[10px] font-bold text-slate-300 uppercase">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">Profile Synchronisation</h4>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">Your profile acts as your neural signature. Complete your details to unlock premium patronage and tactical community access.</p>
                      <button className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 hover:translate-x-2 transition-all">
                        Update Profile <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </section>

                {/* 2. User Benefits */}
                <section className="space-y-8">
                  <div className="flex items-center gap-4 border-l-4 border-amber-500 pl-6">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                      <Rocket className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Strategic Benefits</h3>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Protocol 02: Utility & Equity</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { icon: Coins, title: "Sovereign Wealth", desc: "Access high-stakes games and mining cores to build capital." },
                      { icon: Globe, title: "Global Marketplace", desc: "List products or services to reach international patrons." },
                      { icon: Cpu, title: "Tech Integration", desc: "Deploy tactical tech solutions and digital assets effortlessly." }
                    ].map((item, i) => (
                      <div key={i} className="p-6 bg-slate-800/50 rounded-[2rem] border border-white/5 space-y-4 group hover:bg-slate-800 transition-all">
                        <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
                           <item.icon className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest leading-none">{item.title}</h4>
                        <p className="text-[10px] font-bold text-slate-400 leading-normal uppercase">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 3. Advertising Hub Guide */}
                <section className="space-y-8">
                  <div className="flex items-center gap-4 border-l-4 border-rose-500 pl-6">
                    <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500">
                      <Megaphone className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Advertising Protocol</h3>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Protocol 03: Visibility Engine</p>
                    </div>
                  </div>

                  <div className="p-8 bg-rose-500/5 border border-rose-500/10 rounded-[2.5rem] space-y-8">
                    <p className="text-sm font-medium text-slate-300 leading-relaxed uppercase tracking-tighter">The EFADO Advertising Hub is a tactical visibility engine designed to propagate your mission to the correct nodes.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                       <div className="space-y-3">
                         <div className="flex items-center gap-2 text-rose-400 font-black text-xs uppercase tracking-widest">
                           <Target className="w-4 h-4" /> Targeted Listing
                         </div>
                         <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">Choose from 11 strategic categories: Hotels, Farm Lands, Housing, Machineries, etc. Each has specialized fields for high-fidelity data.</p>
                       </div>
                       <div className="space-y-3">
                         <div className="flex items-center gap-2 text-rose-400 font-black text-xs uppercase tracking-widest">
                           <Zap className="w-4 h-4" /> Strategic Placement
                         </div>
                         <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">Select an exposure plan ranging from Free Lite Protocol (3 days) to Universal Annual (365 days) for maximum neural grid presence.</p>
                       </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-600 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-[10px] font-black text-white uppercase tracking-widest italic">100% Secure Transaction Grid</p>
                      </div>
                      <button 
                        onClick={onClose}
                        className="px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-rose-600/20 active:scale-95"
                      >
                        Start Advertising Now
                      </button>
                    </div>
                  </div>
                </section>

                <div className="bg-white/5 rounded-[2rem] p-8 text-center border border-white/5">
                   <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-4">Neural Ecosystem Integrity</p>
                   <p className="text-xs font-bold text-slate-300 uppercase tracking-tighter leading-relaxed italic">EFADO is more than a website; it is an intelligent gateway to sovereign networking and financial equity. Master the tools, seize the mission.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
