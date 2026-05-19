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
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SearchFilterProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: any) => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({ onSearch, onFilterChange }) => {
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [showDrawer, setShowDrawer] = useState(false);

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
      <div className="flex items-center gap-4 bg-slate-900/50 border border-white/5 p-2 rounded-[2rem] backdrop-blur-xl">
        <div className="relative flex-grow">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Query tactical intel, tools, or deployments..."
            className="w-full pl-16 pr-6 py-4 bg-transparent text-white font-bold placeholder:text-slate-600 outline-none"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowDrawer(!showDrawer)}
          className="flex items-center gap-3 px-8 py-4 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all"
        >
          <Filter className="w-4 h-4" />
          Refine
        </button>
      </div>

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
