import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Rss, 
  Bell, 
  TrendingUp, 
  Globe, 
  ShieldCheck, 
  ChevronRight, 
  Clock,
  ExternalLink,
  Layers,
  Search,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UpdateItem {
  id: string;
  category: 'EXAMS' | 'ADMISSIONS' | 'SCHOLARSHIPS' | 'SYSTEM' | 'MARKET';
  group: 'NATIONAL' | 'INTERNATIONAL' | 'HUB-SPECIFIC';
  title: string;
  source: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high';
}

const FEED_DATA: UpdateItem[] = [
  {
    id: '1',
    category: 'EXAMS',
    group: 'NATIONAL',
    title: 'JAMB 2026 Profile Code portal now optimized for low-latency nodes.',
    source: 'Efado Digital Core',
    timestamp: '2 mins ago',
    priority: 'high'
  },
  {
    id: '2',
    category: 'ADMISSIONS',
    group: 'NATIONAL',
    title: 'UNILAG Post-UTME Tactical screening results uploaded for Level 1 candidates.',
    source: 'Edu-Central',
    timestamp: '15 mins ago',
    priority: 'medium'
  },
  {
    id: '3',
    category: 'SYSTEM',
    group: 'HUB-SPECIFIC',
    title: 'Efado Wallet Hub v4.2 deployed with biometric payment sync.',
    source: 'Efado System',
    timestamp: '45 mins ago',
    priority: 'low'
  },
  {
    id: '4',
    category: 'SCHOLARSHIPS',
    group: 'INTERNATIONAL',
    title: 'Commonwealth Masters grant window open for Strategic Tech applicants.',
    source: 'Global Hub',
    timestamp: '1h ago',
    priority: 'high'
  },
  {
    id: '5',
    category: 'MARKET',
    group: 'HUB-SPECIFIC',
    title: 'Modern Market Hub adds 15 new verified service corps vendors.',
    source: 'Market Intelligence',
    timestamp: '2h ago',
    priority: 'medium'
  },
  {
    id: '6',
    category: 'EXAMS',
    group: 'NATIONAL',
    title: 'WAEC Strategic syllabus update released for 2026 Science tracks.',
    source: 'WAEC Portal',
    timestamp: '3h ago',
    priority: 'medium'
  },
  {
    id: '7',
    category: 'ADMISSIONS',
    group: 'NATIONAL',
    title: 'OAU Direct Entry verification window extended until end of month.',
    source: 'OAU Admissions',
    timestamp: '5h ago',
    priority: 'low'
  },
  {
    id: '8',
    category: 'SCHOLARSHIPS',
    group: 'NATIONAL',
    title: 'NNPC/Chevron JV Scholarship list of shortlisted candidates out.',
    source: 'Strategic Partners',
    timestamp: 'Yesterday',
    priority: 'high'
  }
];

interface IntelligenceFeedProps {
  mode?: 'full' | 'ticker-only';
}

export const EfadoIntelligenceFeed: React.FC<IntelligenceFeedProps> = ({ mode = 'full' }) => {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % FEED_DATA.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const categories = ['ALL', 'EXAMS', 'ADMISSIONS', 'SCHOLARSHIPS', 'SYSTEM', 'MARKET'];
  const groups = ['ALL', 'NATIONAL', 'INTERNATIONAL', 'HUB-SPECIFIC'];

  const [activeGroup, setActiveGroup] = useState<string>('ALL');

  const filteredData = FEED_DATA.filter(item => {
    const categoryMatch = activeCategory === 'ALL' || item.category === activeCategory;
    const groupMatch = activeGroup === 'ALL' || item.group === activeGroup;
    return categoryMatch && groupMatch;
  });

  return (
    <div className="w-full space-y-6">
      {/* Dynamic Ticker - The "Always Displayed" part */}
      <div className={`bg-slate-900 border-y border-white/5 py-3 overflow-hidden relative group ${mode === 'ticker-only' ? 'sticky top-0 z-[100] backdrop-blur-md bg-slate-950/80 shadow-2xl' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-6">
          <div className="flex items-center gap-2 shrink-0 bg-indigo-600 px-3 py-1 rounded-lg shadow-lg shadow-indigo-500/20">
            <Zap className="w-3 h-3 text-white animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Live Update</span>
          </div>
          
          <div className="flex-1 overflow-hidden h-6 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={tickerIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center gap-4 whitespace-nowrap"
              >
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">[{FEED_DATA[tickerIndex].category}] {FEED_DATA[tickerIndex].group}</span>
                <p className="text-sm font-bold text-white uppercase tracking-tight italic truncate">
                  {FEED_DATA[tickerIndex].title}
                </p>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
                <span className="text-[10px] text-slate-500 font-mono tracking-tighter italic">{FEED_DATA[tickerIndex].timestamp}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="hidden md:flex items-center gap-4 text-slate-500 border-l border-white/10 pl-6">
            <Globe className="w-4 h-4" />
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Efado Global Network</span>
          </div>
        </div>
      </div>

      {mode === 'full' && (
        <>
          {/* Intelligence Hub Grid */}
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm overflow-hidden relative group">
         <div className="absolute top-0 right-0 p-8 opacity-5">
            <Rss className="w-24 h-24 text-indigo-600" />
         </div>

         <div className="flex flex-col gap-8 mb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
               <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic underline decoration-indigo-500 decoration-4 underline-offset-8">Intelligence Hub</h3>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-4">Automated strategic updates across all Efado nodes.</p>
               </div>
               
               <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                     <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeCategory === cat 
                           ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                           : 'bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white'
                        }`}
                     >
                        {cat}
                     </button>
                  ))}
               </div>
            </div>

            <div className="flex items-center gap-4 border-t border-slate-50 pt-6">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Filter Group:</span>
               <div className="flex flex-wrap gap-2">
                  {groups.map(grp => (
                     <button
                        key={grp}
                        onClick={() => setActiveGroup(grp)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                        activeGroup === grp 
                           ? 'bg-slate-900 text-white' 
                           : 'text-slate-400 hover:bg-slate-100'
                        }`}
                     >
                        {grp}
                     </button>
                  ))}
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
               {filteredData.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-6 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:shadow-xl transition-all group/card relative overflow-hidden"
                  >
                    <div className={`absolute top-0 left-0 w-1 h-full ${
                      item.priority === 'high' ? 'bg-rose-500' : 
                      item.priority === 'medium' ? 'bg-indigo-500' : 'bg-emerald-500'
                    }`} />
                    
                    <div className="flex justify-between items-start mb-4">
                       <span className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest italic group-hover/card:bg-slate-900 group-hover/card:text-white transition-colors">
                          {item.group}
                       </span>
                       <Clock className="w-4 h-4 text-slate-200" />
                    </div>

                    <h4 className="text-sm font-black text-slate-900 uppercase italic tracking-tighter mb-4 leading-tight group-hover/card:text-indigo-600 transition-colors">
                       {item.title}
                    </h4>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
                       <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${item.priority === 'high' ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{item.timestamp}</span>
                       </div>
                       <button className="p-2 bg-white border border-slate-100 rounded-lg text-slate-400 hover:bg-slate-900 hover:text-white transition-all shrink-0">
                          <ChevronRight className="w-4 h-4" />
                       </button>
                    </div>
                  </motion.div>
               ))}
            </AnimatePresence>
         </div>

         <div className="mt-10 p-6 bg-slate-900 rounded-[2rem] text-white flex items-center justify-between group-hover:bg-indigo-600 transition-all">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Subscription Protocol</p>
                  <p className="text-xs font-black italic uppercase tracking-tighter">Enable neural desktop notifications for instant alerts</p>
               </div>
            </div>
            <button className="px-6 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
               Activate Alerts
            </button>
         </div>
      </div>
        </>
      )}
    </div>
  );
};
