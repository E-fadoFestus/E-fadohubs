import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Video, 
  GraduationCap, 
  Lightbulb, 
  ShoppingBag, 
  CloudUpload, 
  Megaphone,
  Search,
  Filter,
  X,
  ChevronRight,
  TrendingUp,
  Zap,
  Star,
  Globe,
  Settings,
  Plus
} from 'lucide-react';
import { UserProfile, TechContent } from '../../types';
import { ContentCard } from './ContentCard';
import { SearchFilter } from './SearchFilter';
import { useCurrency } from '../../lib/CurrencyContext';
import { techService } from '../../services/techService';

interface EfadoTechHubProps {
  user: UserProfile;
  onClose: () => void;
}

type TechView = 'home' | 'live' | 'learn' | 'showcase' | 'marketplace' | 'publish' | 'advertise';

export const EfadoTechHub: React.FC<EfadoTechHubProps> = ({ user, onClose }) => {
  const [activeView, setActiveView] = useState<TechView>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { formatPrice } = useCurrency();

  // Mock Data Generation
  const [content, setContent] = useState<TechContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await techService.getContent();
      setContent(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    const data = await techService.getContent({ search: q });
    setContent(data);
  };

  const handleFilterChange = async (filters: any) => {
    const data = await techService.getContent(filters);
    setContent(data);
  };

  const renderTabs = () => (
    <div className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 px-6 py-4 flex items-center justify-between overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-2">
        <TabButton icon={Home} label="Home" active={activeView === 'home'} onClick={() => setActiveView('home')} />
        <TabButton icon={Video} label="Live & Events" active={activeView === 'live'} onClick={() => setActiveView('live')} />
        <TabButton icon={GraduationCap} label="Learn" active={activeView === 'learn'} onClick={() => setActiveView('learn')} />
        <TabButton icon={Lightbulb} label="Showcase" active={activeView === 'showcase'} onClick={() => setActiveView('showcase')} />
        <TabButton icon={ShoppingBag} label="Marketplace" active={activeView === 'marketplace'} onClick={() => setActiveView('marketplace')} />
        <TabButton icon={CloudUpload} label="Publish" active={activeView === 'publish'} onClick={() => setActiveView('publish')} />
        <TabButton icon={Megaphone} label="Advertise" active={activeView === 'advertise'} onClick={() => setActiveView('advertise')} />
      </div>

      <div className="flex items-center gap-4 ml-8">
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
           {['EN', 'FR', 'AR', 'SW', 'PCM'].map(lang => (
             <button key={lang} className="px-2 py-1 text-[8px] font-black hover:text-white text-slate-500 transition-colors uppercase tracking-widest">{lang}</button>
           ))}
        </div>
        <div className="relative hidden md:block">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
           <input 
             type="text" 
             placeholder="Search EFADO Tech..." 
             className="pl-11 pr-4 py-2.5 bg-white border border-white/5 rounded-2xl text-xs font-bold text-gray-950 w-64 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
        </div>
        <button 
          onClick={onClose}
          className="p-2.5 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="space-y-12 py-8 px-6">
      {/* Hero Section */}
      <section className="relative h-[480px] rounded-[3rem] overflow-hidden group">
        <img 
          src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop" 
          alt="Tech Innovation" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-center p-12 lg:p-20 max-w-3xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-6"
          >
            <span className="px-3 py-1 bg-indigo-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white">Innovation Alpha</span>
            <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">EFADO Technology Hub</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl lg:text-7xl font-black text-white italic tracking-tighter leading-[0.9] mb-8"
          >
            WHERE IDEAS MEET IMPACT. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-emerald-400 to-indigo-400">THE WORLD CONNECTS.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-300 text-lg leading-relaxed mb-10 max-w-xl"
          >
            Access a vetted global network of tactical experts, from deep-stack engineering to strategic consultancy—deploy intelligence at scale.
          </motion.p>
          <div className="flex items-center gap-4">
            <button className="px-8 py-4 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-100 transition-all shadow-xl shadow-white/10 active:scale-95">Explore Forge</button>
            <button className="px-8 py-4 bg-indigo-600/20 backdrop-blur-3xl border border-indigo-500/30 text-indigo-400 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-600/30 transition-all active:scale-95">Submit Idea</button>
          </div>
        </div>
      </section>

      {/* Live Now Horizontal Scroll */}
      <section>
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
             <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Live Operations</h2>
          </div>
          <button className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1 group">
            View Protocol <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        <div className="flex gap-6 overflow-x-auto no-scrollbar pb-6 px-2">
           {content.filter(c => c.isLive).map(item => (
             <div key={item.id} className="min-w-[400px]">
               <ContentCard content={item} />
             </div>
           ))}
        </div>
      </section>

      {/* Trending Grid */}
      <section>
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-3">
             <TrendingUp className="w-5 h-5 text-emerald-400" />
             <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Trending Assets</h2>
          </div>
          <div className="flex gap-2">
             <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-slate-400 hover:text-white cursor-pointer transition-all">AI</span>
             <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-slate-400 hover:text-white cursor-pointer transition-all">Blockchain</span>
             <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-slate-400 hover:text-white cursor-pointer transition-all">SaaS</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
           {content.slice(0, 4).map(item => (
             <ContentCard key={item.id} content={item} />
           ))}
        </div>
      </section>

      {/* Personalized For You */}
      <section>
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-3">
             <Zap className="w-5 h-5 text-indigo-400" />
             <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Personalized Intel</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
           {content.slice(2, 6).map(item => (
             <ContentCard key={item.id} content={item} />
           ))}
        </div>
      </section>
    </div>
  );

  const renderLive = () => (
    <div className="p-8 space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase mb-2">Tactical Comms</h2>
          <p className="text-slate-500 text-sm font-medium">Real-time deployments and synchronized mission briefs.</p>
        </div>
      </div>

      <SearchFilter onSearch={handleSearch} onFilterChange={handleFilterChange} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {content.filter(c => c.contentType === 'live').map(item => (
          <ContentCard key={item.id} content={item} />
        ))}
      </div>
    </div>
  );

  const renderLearn = () => (
    <div className="p-8 space-y-12">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase mb-2">Cognitive Upgrade</h2>
          <p className="text-slate-500 text-sm font-medium">Synchronize with leading-edge intelligence and skill modules.</p>
        </div>
      </div>

      <SearchFilter onSearch={handleSearch} onFilterChange={handleFilterChange} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {content.filter(c => c.contentType === 'learning').map(item => (
          <ContentCard key={item.id} content={item} />
        ))}
      </div>
    </div>
  );

  const renderMarketplace = () => (
    <div className="p-8 space-y-12">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase mb-2">Asset Exchange</h2>
          <p className="text-slate-500 text-sm font-medium">Procure verified tools and proprietary technical assets.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {content.filter(c => c.contentType === 'product').map(item => (
          <ContentCard key={item.id} content={item} />
        ))}
      </div>
    </div>
  );

  const renderShowcase = () => (
    <div className="p-8 space-y-12">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase mb-2">The Foundry</h2>
          <p className="text-slate-500 text-sm font-medium">Showcasing the world's most innovative technological deployments.</p>
        </div>
      </div>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {content.map((item, i) => (
          <div key={item.id} className="break-inside-avoid">
             <ContentCard content={item} />
          </div>
        ))}
      </div>
    </div>
  );

  const renderPublish = () => (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
       <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-[3rem] p-12 text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-[100px]" />
         <h2 className="text-4xl font-black uppercase tracking-tighter italic italic mb-4">Command Center</h2>
         <p className="text-indigo-100 max-w-xl text-lg font-medium">Manage your tactical broadcasts, educational modules, and technical assets from a unified interface.</p>
         
         <div className="mt-12 flex flex-wrap gap-4">
            <CommandButton icon={Plus} label="New Intel" />
            <CommandButton icon={Video} label="Start Deployment" />
            <CommandButton icon={ShoppingBag} label="List Asset" />
         </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
           <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Active Deployments</h3>
           <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl">
             <table className="w-full text-left">
               <thead>
                 <tr className="border-b border-white/5">
                   <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Asset</th>
                   <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                   <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Engagement</th>
                   <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</th>
                 </tr>
               </thead>
               <tbody>
                  <tr className="border-b border-white/5 hover:bg-white/5 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800" />
                        <span className="text-sm font-bold text-white">Advanced AI Patterns</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md text-[9px] font-black uppercase">Active</span></td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">12.5k / 450</td>
                    <td className="px-6 py-4"><Settings className="w-4 h-4 text-slate-500 cursor-pointer" /></td>
                  </tr>
               </tbody>
             </table>
           </div>
         </div>

         <div className="space-y-6">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Impact Stats</h3>
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl space-y-6">
              <StatItem label="Total Impressions" value="1.2M" trend="+12%" />
              <StatItem label="Ecosystem Revenue" value={formatPrice(45000)} trend="+5.4%" />
              <StatItem label="Reputation Score" value="98.5" trend="Elite" />
            </div>
         </div>
       </div>
    </div>
  );

  const renderAdvertise = () => (
    <div className="p-8 max-w-6xl mx-auto space-y-16">
       <section className="text-center space-y-6">
         <h2 className="text-6xl font-black text-white tracking-tighter italic uppercase">Promote with EFADO</h2>
         <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
           Place your brand at the center of global innovation. Reach the world's most tactical technical professionals, strategic investors, and influential creators.
         </p>
         <button className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 active:scale-95">Launch Campaign</button>
       </section>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <PricingCard 
           title="Tactical" 
           price="33" 
           features={['Sidebar Placement', 'Standard Impressions', 'General Tech Audience', 'Weekly Performance Brief']} 
         />
         <PricingCard 
           title="Strategic" 
           price="166" 
           recommended
           features={['Homepage Placement', 'In-Feed Native Ads', 'Segmented Targeting', 'Real-time Analytics Portal']} 
         />
         <PricingCard 
           title="Enterprise" 
           price="333" 
           features={['Category Sponsorship', 'Sub-page Takeover', 'Direct Deal Access', 'Dedicated Account Sync']} 
         />
       </div>

       <section className="bg-white/5 border border-white/10 rounded-[3rem] p-12 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Custom Deployment?</h3>
            <p className="text-slate-400 text-sm">Need deep ecosystem integration? Talk to our tactical partnership team.</p>
          </div>
          <button className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all">Request Intelligence</button>
       </section>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'home': return renderHome();
      case 'live': return renderLive();
      case 'learn': return renderLearn();
      case 'showcase': return renderShowcase();
      case 'marketplace': return renderMarketplace();
      case 'publish': return renderPublish();
      case 'advertise': return renderAdvertise();
      default: return renderHome();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto overflow-x-hidden no-scrollbar"
    >
      {/* Background Decorative */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-[150px] -mr-40 -mt-40" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[150px] -ml-40 -mb-40" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {renderTabs()}
        
        <main className="flex-grow">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-7xl mx-auto w-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="bg-slate-950/80 backdrop-blur-3xl border-t border-white/5 py-12 px-6">
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-6">
                 <h4 className="text-xl font-black text-white italic uppercase tracking-tighter">EFADO TECH</h4>
                 <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                   <a href="#" className="hover:text-white transition-colors">Privacy</a>
                   <a href="#" className="hover:text-white transition-colors">Terms</a>
                   <a href="#" className="hover:text-white transition-colors">Contact</a>
                 </div>
              </div>
              <div className="text-xs font-medium text-slate-600">
                &copy; {new Date().getFullYear()} Strategic Core. Powered by EFADO Ecosystem.
              </div>
           </div>
        </footer>
      </div>
    </motion.div>
  );
};

interface TabButtonProps {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded-2xl flex items-center gap-2 transition-all group ${
      active 
        ? 'bg-white/10 text-white border border-white/10' 
        : 'text-slate-500 hover:text-white hover:bg-white/5'
    }`}
  >
    <Icon className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'} transition-colors`} />
    <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>{label}</span>
  </button>
);

const FilterButton: React.FC<{ label: string }> = ({ label }) => (
   <button className="px-4 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2 group">
     {label}
     <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-indigo-400 transition-colors" />
   </button>
);

const CommandButton: React.FC<{ icon: any, label: string }> = ({ icon: Icon, label }) => (
   <button className="px-6 py-3 bg-white text-indigo-900 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:scale-105 transition-transform active:scale-95 shadow-xl shadow-black/20">
     <Icon className="w-4 h-4" />
     {label}
   </button>
);

const StatItem: React.FC<{ label: string, value: string, trend: string }> = ({ label, value, trend }) => (
  <div className="flex items-center justify-between">
    <div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-white tracking-tighter">{value}</p>
    </div>
    <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
      {trend}
    </div>
  </div>
);

const PricingCard: React.FC<{ title: string, price: string, features: string[], recommended?: boolean }> = ({ title, price, features, recommended }) => (
  <div className={`relative p-8 rounded-[2.5rem] border ${recommended ? 'bg-white text-slate-950 border-white' : 'bg-slate-900/40 text-white border-white/10'} backdrop-blur-xl transition-all hover:scale-[1.02] shadow-2xl overflow-hidden`}>
    {recommended && (
      <div className="absolute top-4 right-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Recommended</div>
    )}
    <h3 className="text-xl font-black uppercase tracking-tighter italic italic mb-4">{title}</h3>
    <div className="flex items-baseline gap-1 mb-8">
      <span className="text-3xl font-black tracking-tighter">$</span>
      <span className="text-6xl font-black tracking-tighter">{price}</span>
      <span className={`text-xs font-bold uppercase ${recommended ? 'text-slate-500' : 'text-slate-400'}`}>/Mo</span>
    </div>
    <ul className="space-y-4 mb-8">
      {features.map((f, i) => (
        <li key={i} className="flex items-center gap-3 text-xs font-medium">
          <Star className={`w-3 h-3 ${recommended ? 'text-indigo-600' : 'text-indigo-400'}`} />
          {f}
        </li>
      ))}
    </ul>
    <button className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${recommended ? 'bg-slate-950 text-white hover:bg-indigo-900' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}>Deploy Tier</button>
  </div>
);
