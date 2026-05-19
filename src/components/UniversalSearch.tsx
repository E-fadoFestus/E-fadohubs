import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Globe, 
  Zap, 
  X, 
  ArrowRight, 
  Shield, 
  Cpu, 
  Network,
  ExternalLink,
  MessageSquare,
  ShoppingBag,
  GraduationCap,
  Briefcase
} from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  category: 'hubs' | 'external' | 'community';
  description: string;
  icon: any;
  link?: string;
}

export const UniversalSearch: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'hubs' | 'external'>('all');
  const [results, setResults] = useState<SearchResult[]>([]);

  const HUB_RESULTS: SearchResult[] = [
    { id: '1', title: 'Fairly Used Market', category: 'hubs', description: 'Trade quality pre-owned assets in the strategic marketplace.', icon: ShoppingBag },
    { id: '2', title: 'Service Corps Hub', category: 'hubs', description: 'Connect with verified strategic service providers globally.', icon: Briefcase },
    { id: '3', title: 'Education Hub', category: 'hubs', description: 'Access industrial knowledge and strategic learning patterns.', icon: GraduationCap },
    { id: '4', title: 'Gist Hub', category: 'hubs', description: 'Join high-intellect community discussions and strategic news.', icon: MessageSquare },
  ];

  const EXTERNAL_ENGINES = [
    { name: 'Google Strategic Search', url: 'https://www.google.com/search?q=', color: 'text-blue-500' },
    { name: 'Bing Global Intelligence', url: 'https://www.bing.com/search?q=', color: 'text-cyan-500' },
    { name: 'DuckDuckGo Secure Protocol', url: 'https://duckduckgo.com/?q=', color: 'text-orange-500' },
  ];

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const filtered = HUB_RESULTS.filter(r => 
      r.title.toLowerCase().includes(query.toLowerCase()) || 
      r.description.toLowerCase().includes(query.toLowerCase())
    );

    const externalResults: SearchResult[] = query.length > 2 ? EXTERNAL_ENGINES.map(e => ({
      id: `ext_${e.name}`,
      title: `${e.name}: "${query}"`,
      category: 'external',
      description: `Bridge to external intelligence via ${e.name} secure protocol.`,
      icon: Globe,
      link: `${e.url}${encodeURIComponent(query)}`
    })) : [];

    setResults([...filtered, ...externalResults]);
  }, [query]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8"
    >
      <div className="max-w-4xl w-full bg-white rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden h-[90vh]">
        {/* Search Header */}
        <div className="p-8 border-b border-gray-100 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Network className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-black text-slate-900 uppercase tracking-tighter">Unified Intelligence Search</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Connecting Global Hubs in One Space</p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              autoFocus
              placeholder="Search EFADO Hubs or External Intelligence..."
              className="w-full pl-18 pr-8 py-8 bg-slate-50 border-2 border-slate-50 rounded-[2.5rem] text-2xl font-black text-slate-900 focus:border-indigo-600 focus:bg-white transition-all outline-none italic placeholder:text-slate-400"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
               <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] bg-white border border-slate-100 px-3 py-1.5 rounded-full shadow-sm">AI Pulse Active</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {['all', 'hubs', 'external'].map(tab => (
               <button 
                 key={tab}
                 onClick={() => setActiveTab(tab as any)}
                 className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
               >
                 {tab === 'all' ? 'Universal' : tab === 'hubs' ? 'Local Hubs' : 'Global Bridges'}
               </button>
             ))}
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar bg-slate-50/30">
          {!query ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
               <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-xl border border-slate-100 animate-bounce">
                  <Globe className="w-10 h-10 text-indigo-400" />
               </div>
               <div className="space-y-2">
                 <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter italic">World Intelligence Bridge</h3>
                 <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto">Start typing to bridge the gap between EFADO local hubs and global external search protocols.</p>
               </div>
               <div className="grid grid-cols-2 gap-4 max-w-md w-full">
                  {HUB_RESULTS.slice(0, 4).map(hub => (
                    <button key={hub.id} className="p-4 bg-white border border-slate-100 rounded-3xl text-left hover:border-indigo-600 transition-all group">
                       <hub.icon className="w-6 h-6 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                       <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{hub.title}</h4>
                    </button>
                  ))}
               </div>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
               <AnimatePresence mode="popLayout">
                 {results
                   .filter(r => activeTab === 'all' || r.category === activeTab)
                   .map((result) => (
                   <motion.button
                     key={result.id}
                     layout
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     onClick={() => result.link && window.open(result.link, '_blank')}
                     className="w-full text-left p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-indigo-600 transition-all group flex items-start gap-6 relative overflow-hidden"
                   >
                     {result.category === 'external' && (
                       <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-transform">
                          <ExternalLink className="w-12 h-12 text-indigo-600" />
                       </div>
                     )}
                     
                     <div className={`w-16 h-16 shrink-0 rounded-3xl flex items-center justify-center transition-all group-hover:scale-110 ${result.category === 'hubs' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        <result.icon className="w-8 h-8" />
                     </div>
                     
                     <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                           <h4 className="text-lg font-black text-slate-900 uppercase italic tracking-tight italic">{result.title}</h4>
                           <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${result.category === 'hubs' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                             {result.category}
                           </span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium italic">{result.description}</p>
                        
                        {result.category === 'external' ? (
                          <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                             Deploy External Bridge <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                          </div>
                        ) : (
                          <div className="mt-4 flex items-center gap-4">
                             <div className="flex items-center gap-1">
                                <Zap className="w-3 h-3 text-amber-500" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Fast Load Active</span>
                             </div>
                             <div className="flex items-center gap-1">
                                <Shield className="w-3 h-3 text-indigo-400" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Secured Hub</span>
                             </div>
                          </div>
                        )}
                     </div>
                   </motion.button>
                 ))}
               </AnimatePresence>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
               <Cpu className="w-12 h-12 text-slate-300 animate-pulse" />
               <p className="text-slate-400 font-black uppercase tracking-widest text-xs italic">No Strategic Matches Found for "{query}"</p>
            </div>
          )}
        </div>

        {/* Search Footer */}
        <div className="p-8 bg-slate-900 text-white border-t border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                 <Shield className="w-4 h-4 text-emerald-400" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End-to-End Encryption Terminal</span>
              </div>
              <div className="flex items-center gap-2">
                 <Globe className="w-4 h-4 text-indigo-400" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Universal Bridge Protocol v2.5</span>
              </div>
           </div>
           
           <div className="hidden md:flex items-center gap-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">
             Connect the World as a Unified Body
           </div>
        </div>
      </div>
    </motion.div>
  );
};
