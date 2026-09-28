import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown,
  Globe,
  Tag,
  Monitor,
  DollarSign,
  Calendar,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAI } from '../../hooks/useAI';

interface SearchFilterProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: any) => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({ onSearch, onFilterChange }) => {
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [showDrawer, setShowDrawer] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const { searchWithGrounding, dailyUsage } = useAI();
  const [groundedResult, setGroundedResult] = useState<any>(null);
  const [isGroundingSearching, setIsGroundingSearching] = useState(false);
  const [showGroundedResult, setShowGroundedResult] = useState(false);

  const handleGroundedSearch = async (term?: string) => {
    const q = (term || searchValue).trim();
    if (!q) return;
    setIsGroundingSearching(true);
    try {
      const res = await searchWithGrounding(q);
      if (res.success) {
        setGroundedResult(res);
        setShowGroundedResult(true);
      }
    } catch (e) {
      console.warn('Grounding search failed:', e);
    } finally {
      setIsGroundingSearching(false);
    }
  };

  const filtersConfig = [
    { id: 'topic', label: 'Topic', icon: Tag, options: ['AI', 'Blockchain', 'Cybersecurity', 'Web4', 'Energy'] },
    { id: 'format', label: 'Format', icon: Monitor, options: ['Video', 'Course', 'Live Event', 'Tool'] },
    { id: 'price', label: 'Price', icon: DollarSign, options: ['Free', 'Paid', '< $50', '> $100'] },
    { id: 'language', label: 'Language', icon: Globe, options: ['English', 'French', 'Arabic', 'Swahili'] },
    { id: 'date', label: 'Date', icon: Calendar, options: ['Today', 'This Week', 'This Month'] },
  ];

  const toggleFilter = (id: string, value: string) => {
    const newFilters = { ...activeFilters };
    if (newFilters[id] === value) {
      delete newFilters[id];
    } else {
      newFilters[id] = value;
    }
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const removeFilter = (id: string) => {
    const newFilters = { ...activeFilters };
    delete newFilters[id];
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="space-y-6">
      {/* Main Search Bar */}
      <div className="flex items-center gap-3 bg-slate-900/50 border border-white/5 p-2 rounded-[2rem] backdrop-blur-xl relative">
        <div className="relative flex-grow">
          <Search 
            onClick={() => handleGroundedSearch()}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 hover:text-emerald-400 cursor-pointer transition-colors" 
          />
          <input 
            type="text" 
            placeholder="Query tactical intel, tools, or deployments with live web data..."
            className="w-full pl-16 pr-32 py-4 bg-transparent text-white font-bold placeholder:text-slate-600 outline-none"
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              onSearch(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleGroundedSearch();
            }}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 uppercase font-black">
              AI Powered
            </span>
          </div>
        </div>

        <button 
          onClick={() => handleGroundedSearch()}
          disabled={isGroundingSearching || !searchValue.trim()}
          className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-md shadow-emerald-600/20"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isGroundingSearching ? 'Searching...' : 'AI Grounded'}</span>
        </button>

        <button 
          onClick={() => setShowDrawer(!showDrawer)}
          className="flex items-center gap-3 px-6 py-4 bg-white/10 hover:bg-white/15 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
        >
          <Filter className="w-4 h-4" />
          Refine
        </button>
      </div>

      {/* Grounded Search Result Drawer */}
      <AnimatePresence>
        {showGroundedResult && groundedResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 bg-slate-900/90 border border-emerald-500/40 rounded-3xl backdrop-blur-xl space-y-4 shadow-2xl relative"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  Live Grounded Intelligence: "{searchValue}"
                </h4>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  AI Powered
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400 font-mono">{dailyUsage.usageText}</span>
                <button
                  onClick={() => setShowGroundedResult(false)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
              {groundedResult.text}
            </div>

            {groundedResult.sources && groundedResult.sources.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sources:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {groundedResult.sources.map((s: any, idx: number) => (
                    <a
                      key={idx}
                      href={s.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 p-2 bg-slate-950 hover:bg-slate-850 rounded-xl border border-white/10 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <span className="truncate font-semibold">{s.title || 'Source'}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filter Chips */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(activeFilters).map(([id, value]) => (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            key={id}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/10 border border-indigo-500/30 rounded-xl text-[10px] font-black text-indigo-400 uppercase tracking-widest"
          >
            <span>{id}: {value}</span>
            <button onClick={() => removeFilter(id)}><X className="w-3 h-3 hover:text-white transition-colors" /></button>
          </motion.div>
        ))}
      </div>

      {/* Filter Drawer/Dropdown */}
      <AnimatePresence>
        {showDrawer && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-slate-900/30 border border-white/5 rounded-[2rem] p-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {filtersConfig.map((config) => (
                <div key={config.id} className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <config.icon className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{config.label}</span>
                  </div>
                  <div className="space-y-2">
                    {config.options.map((opt) => (
                      <button 
                        key={opt}
                        onClick={() => toggleFilter(config.id, opt)}
                        className={`block text-xs font-bold transition-all ${
                          activeFilters[config.id] === opt 
                            ? 'text-indigo-400 translate-x-1' 
                            : 'text-slate-400 hover:text-white hover:translate-x-1'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
