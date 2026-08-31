import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Rss, 
  Bell, 
  TrendingUp, 
  Globe, 
  ShieldCheck, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
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
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % FEED_DATA.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full">
      {/* Collapsible Dynamic Ticker - Mobile First & De-cluttered */}
      <div className="bg-slate-900/95 backdrop-blur-xl border border-indigo-500/20 shadow-[0_4px_25px_rgba(0,0,0,0.4)] rounded-2xl my-2 sm:my-4 overflow-hidden transition-all duration-300">
        <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg shadow-md shadow-indigo-500/20">
              <Zap className="w-3.5 h-3.5 text-white animate-pulse" />
              <span className="text-[10px] font-black text-white uppercase tracking-wider">Live Updates</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 font-mono hidden xs:inline">
              [{tickerIndex + 1}/{FEED_DATA.length}]
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{FEED_DATA[tickerIndex].source}</span>
            </div>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all cursor-pointer"
              title={isCollapsed ? "Expand Updates" : "Minimize Updates"}
            >
              <span>{isCollapsed ? "Show" : "Hide"}</span>
              {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden border-t border-white/5"
            >
              <div className="px-4 py-3 sm:py-4 bg-slate-950/60">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tickerIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-black text-indigo-400 bg-indigo-950/70 border border-indigo-500/30 px-2 py-0.5 rounded uppercase tracking-wider">
                        {FEED_DATA[tickerIndex].category}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                        {FEED_DATA[tickerIndex].group}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-bold text-slate-100 leading-snug flex-1">
                      {FEED_DATA[tickerIndex].title}
                    </p>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <span className="text-[9px] font-mono text-slate-400 italic">
                        {FEED_DATA[tickerIndex].timestamp}
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
