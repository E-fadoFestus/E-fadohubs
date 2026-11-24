import React, { useState, useEffect } from 'react';
import { Bell, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UpdateItem {
  id: string;
  category: 'EXAMS' | 'ADMISSIONS' | 'SCHOLARSHIPS' | 'PLATFORM' | 'MARKET';
  group: 'NATIONAL' | 'INTERNATIONAL' | 'EFADO HUBS';
  title: string;
  source: string;
  timestamp: string;
}

const FEED_DATA: UpdateItem[] = [
  {
    id: '1',
    category: 'EXAMS',
    group: 'NATIONAL',
    title: 'JAMB 2026 profile code and registration updates available in Education Hub.',
    source: 'EFADO Education',
    timestamp: 'Today',
  },
  {
    id: '2',
    category: 'PLATFORM',
    group: 'EFADO HUBS',
    title: 'Fund your Account Profile Wallet once to shop, buy airtime/data, and play games.',
    source: 'EFADO Wallet',
    timestamp: 'Updated',
  },
  {
    id: '3',
    category: 'SCHOLARSHIPS',
    group: 'INTERNATIONAL',
    title: 'Commonwealth and partner scholarship deadlines updated inside Education Hub.',
    source: 'Global Scholarships',
    timestamp: 'This week',
  },
  {
    id: '4',
    category: 'MARKET',
    group: 'EFADO HUBS',
    title: 'Verified merchants have added new electronics and home items to Market Hubs.',
    source: 'EFADO Market',
    timestamp: 'Today',
  },
  {
    id: '5',
    category: 'EXAMS',
    group: 'NATIONAL',
    title: 'WAEC & Post-UTME past question practice sets are ready in Education Hub.',
    source: 'Study Portal',
    timestamp: 'Today',
  },
];

interface IntelligenceFeedProps {
  mode?: 'full' | 'ticker-only';
}

export const EfadoIntelligenceFeed: React.FC<IntelligenceFeedProps> = () => {
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
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const currentItem = FEED_DATA[tickerIndex];

  return (
    <div className="w-full">
      <div className="bg-slate-900/90 border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600 rounded-lg text-xs font-semibold text-white shrink-0">
              <Bell className="w-3.5 h-3.5" />
              <span>Updates</span>
            </span>
            <span className="text-xs text-slate-400 font-mono tabular-nums shrink-0">
              {tickerIndex + 1} / {FEED_DATA.length}
            </span>
            <span className="hidden md:inline text-xs text-slate-400 truncate">
              • {currentItem.source}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors cursor-pointer shrink-0"
          >
            <span>{isCollapsed ? 'Show' : 'Hide'}</span>
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-white/10"
            >
              <div className="px-4 py-3 bg-slate-950/60">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tickerIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4"
                  >
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-semibold text-indigo-300 bg-indigo-950/80 border border-indigo-500/30 px-2 py-0.5 rounded">
                        {currentItem.category}
                      </span>
                      <span className="text-xs text-slate-400">{currentItem.group}</span>
                    </div>

                    <p className="text-sm text-slate-100 leading-snug flex-1">
                      {currentItem.title}
                    </p>

                    <span className="text-xs text-slate-400 shrink-0">
                      {currentItem.timestamp}
                    </span>
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
