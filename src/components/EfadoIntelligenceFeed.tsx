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
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % FEED_DATA.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full">
      {/* Dynamic Ticker - Broader, bolder, and more eye-catching */}
      <div className="bg-slate-900/90 backdrop-blur-xl border-y border-indigo-500/15 py-6 sm:py-8 overflow-hidden relative group shadow-[0_0_50px_rgba(99,102,241,0.1)] rounded-[2.5rem] my-4">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex items-center gap-3 shrink-0 bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 rounded-xl shadow-lg shadow-indigo-500/30 border border-indigo-400/20">
            <Zap className="w-4 h-4 text-white animate-pulse" />
            <span className="text-xs font-black text-white uppercase tracking-widest italic">Live updates</span>
          </div>
          
          <div className="flex-1 overflow-hidden h-8 relative w-full flex items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={tickerIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex items-center gap-4 w-full"
              >
                <span className="text-xs font-black text-indigo-400 bg-indigo-950/50 border border-indigo-500/20 px-2.5 py-1 rounded-md uppercase tracking-widest shrink-0">
                  [{FEED_DATA[tickerIndex].category}]
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 hidden sm:inline">
                  {FEED_DATA[tickerIndex].group}
                </span>
                <div className="h-4 w-px bg-white/10 hidden sm:inline shrink-0" />
                <p className="text-base font-black text-white uppercase tracking-tight italic truncate flex-1">
                  {FEED_DATA[tickerIndex].title}
                </p>
                <div className="w-2 h-2 bg-emerald-500 rounded-full shrink-0 animate-ping" />
                <span className="text-xs text-slate-500 font-mono tracking-tighter italic shrink-0">{FEED_DATA[tickerIndex].timestamp}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="hidden lg:flex items-center gap-4 text-slate-400 border-l border-white/15 pl-6 shrink-0">
            <Globe className="w-4 h-4 text-indigo-400" />
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Efado Academic Node Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
