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
  Plus,
  ArrowLeft,
  Terminal,
  Cpu,
  Sparkles,
  Award,
  AlertCircle,
  Clock,
  Play,
  Send,
  CheckCircle2,
  Lock,
  BookOpen,
  Book,
  Palette,
  FileText,
  Volume2,
  Check,
  ChevronLeft,
  Tv,
  Trash2
} from 'lucide-react';
import { UserProfile, TechContent } from '../../types';
import { ContentCard } from './ContentCard';
import { SearchFilter } from './SearchFilter';
import { db, collection, addDoc, onSnapshot, query, where, doc, updateDoc } from '../../firebase';
import { useCurrency } from '../../lib/CurrencyContext';
import { techService } from '../../services/techService';

interface EfadoTechHubProps {
  user: UserProfile;
  onClose: () => void;
  onStartZoomSession?: (category: string, title: string) => void;
}

type TechView = 'home' | 'live' | 'learn' | 'showcase' | 'marketplace' | 'publish' | 'advertise';

export const EfadoTechHub: React.FC<EfadoTechHubProps> = ({ user, onClose, onStartZoomSession }) => {
  const [activeView, setActiveView] = useState<TechView>('home');
  const [activePlatform, setActivePlatform] = useState<'forge' | 'incubator' | null>(null);

  // Deep states for live classes and proposals
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [myPitches, setMyPitches] = useState<any[]>([]);

  // Sandbox Code Forge parameters
  const [forgeLanguage, setForgeLanguage] = useState<'python' | 'rust' | 'typescript' | 'motoko'>('python');
  const [forgeCode, setForgeCode] = useState('');
  const [forgeLogs, setForgeLogs] = useState<string[]>([]);
  const [isCompilingForge, setIsCompilingForge] = useState(false);

  // Preaching, Preachers, Books & Creator Sanctuary States
  const [activeForgeSubTab, setActiveForgeSubTab] = useState<'sermon' | 'book' | 'content' | 'presentation'>('sermon');
  
  // 1. Sermon States
  const [sermonTitle, setSermonTitle] = useState('Divine Elevation: Anchoring Faith in Uncertain Times');
  const [sermonScripture, setSermonScripture] = useState('Hebrews 11:1');
  const [sermonCategory, setSermonCategory] = useState('Spiritual Strength');
  const [sermonScriptureText, setSermonScriptureText] = useState('Now faith is the substance of things hoped for, the evidence of things not seen.');
  const [sermonNotes, setSermonNotes] = useState('Preach with passion regarding community development, perseverance, trust, and how clean honest work aligns with spiritual goals.');
  const [sermonDraftResult, setSermonDraftResult] = useState<any>(null);
  const [isDraftingSermon, setIsDraftingSermon] = useState(false);

  // 2. Book Creator States
  const [bookTitle, setBookTitle] = useState('Winds of Destiny: Navigating the Work Markets');
  const [bookSubtitle, setBookSubtitle] = useState('A Celestial Strategy Blueprint for Spiritual Leaders and Visionary Founders');
  const [bookGenre, setBookGenre] = useState('Inspirational Guide & Devotional');
  const [bookCoverBg, setBookCoverBg] = useState<'gold' | 'royal-blue' | 'crimson' | 'emerald'>('gold');
  const [bookOutlineResult, setBookOutlineResult] = useState<any>(null);
  const [isDraftingBook, setIsDraftingBook] = useState(false);

  // 3. Dynamic Writing/Video Content States
  const [scriptTitle, setScriptTitle] = useState('Weekly Spiritual Uplifting Sermon');
  const [scriptFormat, setScriptFormat] = useState('Short Reel & Video Devotional Script');
  const [scriptHook, setScriptHook] = useState('Are you facing a challenge in your business, schooling, or career? Listen to this promise...');
  const [scriptBulletPoints, setScriptBulletPoints] = useState('- Focus on clean efforts.\n- Avoid quick fraudulent routes.\n- Align your service with divine impact.');
  const [isDraftingScript, setIsDraftingScript] = useState(false);
  const [scriptDraftResult, setScriptDraftResult] = useState<any>(null);

  // 4. Visual Presentation Deck States (A live interactive beautiful multi-page visual card renderer!)
  const [activeSlideIdx, setActiveSlideIdx] = useState<number>(0);
  const [presentationSlides, setPresentationSlides] = useState<Array<{title: string, subtitle: string, body: string, bg: string}>>([
    {
      title: "Welcome Beloved Preachers & Teachers",
      subtitle: "The Divine Sanctuary & Creator Core",
      body: "We gather here physically and digitally to expand our thoughts, prepare divine sermons, and scale beautiful ideas globally.",
      bg: "divine-gold"
    },
    {
      title: "Power of Celestial Faith & Focus",
      subtitle: "Key Scripture Reference: Ephesians 6:11-13",
      body: "'Put on the full armor of God, so that you can take your stand against the world\'s schemes.' Every work-market strategy needs deep faith and tactical discipline.",
      bg: "sunset-burgundy"
    },
    {
      title: "Active Solution for the World Market",
      subtitle: "Translating Inspiration Into Impact",
      body: "We translate sacred concepts into beautiful practical entities: local farming cooperatives, smart educational tools, community support systems.",
      bg: "ocean-wisdom"
    }
  ]);

  // Slide builder inputs
  const [newSlideTitle, setNewSlideTitle] = useState('');
  const [newSlideSubtitle, setNewSlideSubtitle] = useState('');
  const [newSlideBody, setNewSlideBody] = useState('');
  const [newSlideBg, setNewSlideBg] = useState('divine-gold');

  // Pitch Incubator parameters (Aligned closely for the Work Markets Venture Hub)
  const [pitchTitle, setPitchTitle] = useState('');
  const [pitchCategory, setPitchCategory] = useState('Christian Devotional & Publishing');
  const [pitchStack, setPitchStack] = useState('');
  const [pitchContent, setPitchContent] = useState('');
  const [pitchNeeds, setPitchNeeds] = useState('$5,000 Seed');
  const [pitchRegion, setPitchRegion] = useState('Pan-African');
  const [isEvaluatingPitch, setIsEvaluatingPitch] = useState(false);
  const [evaluatedScores, setEvaluatedScores] = useState<{ market: number, feasibility: number, social: number } | null>(null);
  const [evaluationFeedback, setEvaluationFeedback] = useState('');
  const [isPublishingPitch, setIsPublishingPitch] = useState(false);

  // Classroom Broadcast states (CEO and trainers)
  const [newClassTitle, setNewClassTitle] = useState('');
  const [newClassCategory, setNewClassCategory] = useState('DeepTech Engineering');
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

    // Setup active live Zoom classes streaming subscription
    let unsubLive = () => {};
    if (user?.uid) {
      const qLive = query(collection(db, 'live_classes'), where('status', '==', 'live'));
      unsubLive = onSnapshot(qLive, (snap) => {
        setLiveSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => {
        console.warn("Live classes subscription deactivated or unauthorized", err);
      });
    }

    // Setup user incubator proposals submission list subscription
    let unsubPitches = () => {};
    if (user?.uid) {
      const qPitches = query(collection(db, 'incubator_ideas'), where('userId', '==', user.uid));
      unsubPitches = onSnapshot(qPitches, (snap) => {
        setMyPitches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => {
        console.warn("My pitches subscription deactivated or unauthorized", err);
      });
    }

    return () => {
      unsubLive();
      unsubPitches();
    };
  }, [user?.uid]);

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
        <TabButton icon={Home} label="Sanctuary Home" active={activeView === 'home'} onClick={() => setActiveView('home')} />
        <TabButton icon={Video} label="Preach & Teach Live" active={activeView === 'live'} onClick={() => setActiveView('live')} />
        <TabButton icon={GraduationCap} label="Creator Academy" active={activeView === 'learn'} onClick={() => setActiveView('learn')} />
        <TabButton icon={Lightbulb} label="Creative Gallery" active={activeView === 'showcase'} onClick={() => setActiveView('showcase')} />
        <TabButton icon={ShoppingBag} label="Books & Market" active={activeView === 'marketplace'} onClick={() => setActiveView('marketplace')} />
        <TabButton icon={CloudUpload} label="Broadcast Studio" active={activeView === 'publish'} onClick={() => setActiveView('publish')} />
        <TabButton icon={Megaphone} label="Promote Ideas" active={activeView === 'advertise'} onClick={() => setActiveView('advertise')} />
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
             placeholder="Search Sanctuary Books & Lessons..." 
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
      {/* Active live stream notification flag */}
      {liveSessions.length > 0 && (
        <div className="bg-gradient-to-r from-red-650 via-rose-950 to-indigo-950 border border-rose-500/30 rounded-[2.5rem] p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 bg-red-650 rounded-2xl flex items-center justify-center font-black text-xs relative shrink-0">
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
              LIVE
            </div>
            <div>
              <span className="text-[9px] font-black text-[#DAA520] tracking-widest uppercase block">EFADO DIVINE SANCTUARY ON AIR</span>
              <h4 className="text-sm font-black uppercase text-white truncate max-w-lg">{liveSessions[0].title}</h4>
              <p className="text-[10px] text-slate-400 uppercase mt-0.5">Spiritual Leader: <b>{liveSessions[0].host}</b> • Sacred Theme: <b>{liveSessions[0].category}</b></p>
            </div>
          </div>
          <button
            onClick={() => onStartZoomSession?.(liveSessions[0].category, liveSessions[0].title)}
            className="px-6 py-3 bg-white text-slate-950 hover:bg-slate-100 rounded-xl text-[10px] tracking-widest font-black uppercase transition-all shrink-0 active:scale-95 shadow-lg shadow-black/20"
          >
            ENTER LECTURE & SANCTUARY ROOM
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative h-[480px] rounded-[3rem] overflow-hidden group">
        <img 
          src="https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=2072&auto=format&fit=crop" 
          alt="Divine Book Inspiration" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-center p-12 lg:p-20 max-w-3xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-6"
          >
            <span className="px-3 py-1 bg-indigo-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white">Sovereign Creators Workspace</span>
            <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">EFADO Sanctuary & Hub</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl lg:text-7xl font-black text-white italic tracking-tighter leading-[0.9] mb-8 animate-pulse"
          >
            WHERE DIVINE INSPIRATION MEETS THE WORLD MARKET. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#DAA520] via-amber-200 to-[#DAA520]">THE SANCTUARY OF SOVEREIGN CREATORS.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-300 text-lg leading-relaxed mb-10 max-w-xl text-shadow"
          >
            A high-end visual sanctuary designed specifically for preachers, teachers, authors, and designers. Draft Books, create stunning sermon slide presentation decks, create content scripts, and pitch your ideas straight to the global work market.
          </motion.p>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActivePlatform('forge')}
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-650 text-slate-950 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-100 transition-all shadow-xl shadow-amber-500/20 active:scale-95"
            >
              Open Creator Forge & Deck
            </button>
            <button 
              onClick={() => setActivePlatform('incubator')}
              className="px-8 py-4 bg-indigo-600/20 backdrop-blur-3xl border border-indigo-500/30 text-indigo-400 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-600/30 transition-all active:scale-95"
            >
              Sow Idea into Work Market
            </button>
          </div>
        </div>
      </section>

      {/* Live Now Horizontal Scroll */}
      <section>
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-red-650 rounded-full animate-pulse" />
             <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Live Broadcasts & Events</h2>
          </div>
          <button className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1 group">
            View Protocol <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        <div className="flex gap-6 overflow-x-auto no-scrollbar pb-6 px-2">
           {content.filter(c => c.isLive).map(item => (
             <div key={item.id} className="min-w-[400px]">
               <ContentCard content={item} onAction={() => handleContentAction(item)} />
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
             <ContentCard key={item.id} content={item} onAction={() => handleContentAction(item)} />
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
             <ContentCard key={item.id} content={item} onAction={() => handleContentAction(item)} />
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
          <ContentCard key={item.id} content={item} onAction={() => handleContentAction(item)} />
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
          <ContentCard key={item.id} content={item} onAction={() => handleContentAction(item)} />
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
          <ContentCard key={item.id} content={item} onAction={() => handleContentAction(item)} />
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
             <ContentCard content={item} onAction={() => handleContentAction(item)} />
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

        {/* EFADO ZOOM LIVE BROADCASTER HUB */}
        <div className="bg-slate-900 border border-[#ffffff]/5 rounded-[2.5rem] p-8 text-left space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <span className="w-2.5 h-2.5 bg-red-650 rounded-full animate-ping shrink-0" />
            <h4 className="text-sm font-black uppercase text-white font-mono tracking-widest">EFADO BROADCAST MASTER CONTROL</h4>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">Instantly announce deep-tech live broadcasts to all users currently online in the platform ecosystem. Pressing launch registers the node and prompts users to join your room.</p>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-5">
              <label className="text-[9.5px] font-black text-rose-450 block uppercase mb-1 tracking-wider font-mono">BROADCAST LECTURE SESSION TITLE</label>
              <input 
                type="text"
                placeholder="e.g. Masterclass: Advanced Smart Ledgers v4"
                value={newClassTitle}
                onChange={(e) => setNewClassTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-955 border border-[ffffff]/5 text-xs text-[#ffffff] rounded-2xl outline-none focus:border-indigo-500 bg-slate-950"
              />
            </div>
            <div className="md:col-span-4">
              <label className="text-[9.5px] font-black text-rose-450 block uppercase mb-1 tracking-wider font-mono">SECTOR DISCIPLINE</label>
              <select
                value={newClassCategory}
                onChange={(e) => setNewClassCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-955 border border-[ffffff]/5 text-xs text-[#ffffff] rounded-2xl outline-none bg-slate-950"
              >
                <option value="DeepTech Engineering" className="bg-slate-955">DeepTech Engineering</option>
                <option value="Blockchain Smart Systems" className="bg-slate-955">Blockchain Smart Systems</option>
                <option value="AI Cognitive Synthetics" className="bg-slate-955">AI Cognitive Synthetics</option>
                <option value="SaaS Strategic Scale" className="bg-slate-955">SaaS Strategic Scale</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <button 
                onClick={handleHostZoomClass}
                className="w-full py-3.5 bg-gradient-to-r from-red-650 to-rose-650 hover:from-red-600 hover:to-rose-600 text-white font-black text-[10px] tracking-widest uppercase rounded-2xl transition-all shadow-xl shadow-red-600/10 active:scale-95 flex items-center justify-center gap-2"
              >
                <Video className="w-3.5 h-3.5" /> START ZOOM CLASS
              </button>
            </div>
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

  const handleHostZoomClass = async () => {
    if (!newClassTitle.trim()) {
      alert("Please provide a classroom lecture title first.");
      return;
    }
    const cat = newClassCategory;
    const title = newClassTitle.trim();
    setNewClassTitle('');
    try {
      await addDoc(collection(db, 'live_classes'), {
        title,
        category: cat,
        host: user.displayName || user.email.split('@')[0] || 'Leader',
        startedAt: new Date().toISOString(),
        status: 'live'
      });
      onStartZoomSession?.(cat, title);
    } catch (err) {
      console.error("Error creating zoom class: ", err);
    }
  };

  const handleContentAction = (item: TechContent) => {
    if (item.isLive || item.contentType === 'live') {
      onStartZoomSession?.(item.topic, item.title);
    } else {
      alert(`Accessing course / asset: "${item.title}". You are automatically authorized via EFADO Premium Protocol!`);
    }
  };

  // ============================================
  // INTERACTIVE CREATOR WORKSPACE: THE CELESTIAL STUDY
  // ============================================
  const renderForgePlatform = () => {
    // Sermon drafting trigger logic
    const handleDraftSermon = () => {
      if (!sermonTitle.trim() || !sermonScripture.trim()) {
        alert("Please prepare a Title and select/input scripture first.");
        return;
      }
      setIsDraftingSermon(true);
      setSermonDraftResult(null);

      setTimeout(() => {
        setSermonDraftResult({
          title: sermonTitle,
          scripture: sermonScripture,
          scriptureText: scriptureMap[sermonScripture] || sermonScriptureText || "The Lord is our guide.",
          theme: sermonCategory,
          points: [
            {
              title: "I. The Foundation of Spiritual Connection",
              body: "How alignment with divine purpose gives strength and ensures clarity in our work, community interactions, and career steps."
            },
            {
              title: "II. Avoiding False Paths and Quick Favour",
              body: "Refusing quick fraudulent strategies or shortcuts. Sowing honest seeds of excellence as taught by pastors and mentors."
            },
            {
              title: "III. Deploying Impact in the Active Work Markets",
              body: "Sovereign action. How local leaders and pastors can build visual presentation guides to inspire the community towards sustainable development."
            }
          ],
          closingPrayer: "Lord, empower our hands, grant deep clarity to publishers and teachers, and let every presentation prepared here sow positive seed. Amen."
        });
        setIsDraftingSermon(false);
      }, 1500);
    };

    // Book Outline drafting trigger logic
    const handleDraftBook = () => {
      if (!bookTitle.trim()) {
        alert("Please enter your Book Title first.");
        return;
      }
      setIsDraftingBook(true);
      setBookOutlineResult(null);

      setTimeout(() => {
        setBookOutlineResult({
          title: bookTitle,
          subtitle: bookSubtitle,
          genre: bookGenre,
          color: bookCoverBg,
          chapters: [
            { num: "Chapter 1", title: "The Sovereign Conception", desc: "Setting clear internal goals. How a simple non-programmer can harness digital systems without coding." },
            { num: "Chapter 2", title: "Unbending Integrity in Work Markets", desc: "Slandering deceitful financial structures. Cultivating community-wide trust, accountability, and divine favor." },
            { num: "Chapter 3", title: "Sowing Seeds of Community Impact", desc: "A practical workbook of action steps, local farming cooperatives layout, and educational initiatives." },
            { num: "Chapter 4", title: "Harvesting the Blessings", desc: "The strategic expansion. How Okhawere Festus's vision powers decentralized enterprise." }
          ]
        });
        setIsDraftingBook(false);
      }, 1800);
    };

    // Script drafting trigger logic
    const handleDraftScript = () => {
      if (!scriptTitle.trim()) {
        alert("Please write a Video Script Topic first.");
        return;
      }
      setIsDraftingScript(true);
      setScriptDraftResult(null);

      setTimeout(() => {
        setScriptDraftResult({
          title: scriptTitle,
          format: scriptFormat,
          segments: [
            { time: "0:00 - 0:15", label: "Dynamic Intro Hook", content: `"${scriptHook}" Show helpful supportive graphics on screen.` },
            { time: "0:15 - 1:00", label: "Core Inspirational Guidance", content: `Expound slowly on the following insights: \n${scriptBulletPoints}` },
            { time: "1:00 - 1:15", label: "Closing Call-to-Action", content: `"Join our weekly preach & teach webinar on EFADO Connect! Share and subscribe to spread the faith."` }
          ]
        });
        setIsDraftingScript(false);
      }, 1200);
    };

    // Scripture default options
    const scriptures = [
      { ref: "Hebrews 11:1", text: "Now faith is the substance of things hoped for, the evidence of things not seen." },
      { ref: "Ephesians 6:11", text: "Put on the full armor of God, so that you can take your stand against the world's schemes." },
      { ref: "Proverbs 3:5-6", text: "Trust in the Lord with all your heart and lean not on your own understanding." },
      { ref: "Philippians 4:13", text: "I can do all things through Christ who strengthens me." },
      { ref: "Genesis 1:1", text: "In the beginning God created the heavens and the earth." }
    ];

    const scriptureMap: Record<string, string> = scriptures.reduce((acc, current) => {
      acc[current.ref] = current.text;
      return acc;
    }, {} as Record<string, string>);

    // Dynamic presentation deck background gradient map
    const slideBgGradients: Record<string, string> = {
      'divine-gold': 'bg-gradient-to-br from-indigo-950 via-slate-900 to-[#DAA520]/40 border-[#DAA520]/30',
      'sunset-burgundy': 'bg-gradient-to-br from-[#450a0a]/90 via-[#1e1b4b] to-[#7f1d1d]/40 border-rose-500/20',
      'ocean-wisdom': 'bg-gradient-to-br from-slate-950 via-[#0f172a] to-[#0369a1]/40 border-sky-500/20',
      'emerald-forest': 'bg-gradient-to-br from-slate-950 via-[#022c22] to-emerald-500/30 border-emerald-500/20',
      'celestial-indigo': 'bg-gradient-to-br from-[#4c1d95] via-[#111827] to-[#6366f1]/40 border-indigo-400/20'
    };

    // Slide manipulator triggers
    const addNewSlide = () => {
      const title = newSlideTitle.trim() || `Sovereign Lesson Slide ${presentationSlides.length + 1}`;
      const subtitle = newSlideSubtitle.trim() || "Prepared directly inside EFADO";
      const body = newSlideBody.trim() || "This is a new custom slide prepared using our visual editor tools.";
      const bg = newSlideBg;

      const updated = [...presentationSlides, { title, subtitle, body, bg }];
      setPresentationSlides(updated);
      setActiveSlideIdx(updated.length - 1);
      setNewSlideTitle('');
      setNewSlideSubtitle('');
      setNewSlideBody('');
      alert("Custom slide successfully designed and appended to your presentation deck!");
    };

    const deleteSlide = (idx: number) => {
      if (presentationSlides.length <= 1) {
        alert("You must keep at least one slide in your presentation deck.");
        return;
      }
      const updated = presentationSlides.filter((_, i) => i !== idx);
      setPresentationSlides(updated);
      setActiveSlideIdx(Math.max(0, idx - 1));
    };

    return (
      <div className="p-8 max-w-6xl mx-auto space-y-8 text-left text-white">
        <button 
          onClick={() => setActivePlatform(null)}
          className="flex items-center gap-2 text-xs font-black uppercase text-[#DAA520] hover:text-white transition-all font-mono"
        >
          <ArrowLeft className="w-4 h-4" /> BACK TO CREATOR SANCTUARY
        </button>

        {/* Studio Top Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#DAA520]/5 rounded-full blur-[100px]" />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-[#DAA520]/15 border border-[#DAA520]/30 text-[#DAA520] text-[9.5px] rounded-lg tracking-widest font-black uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400 animate-spin" /> THE CELESTIAL STUDY
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">NON-PROGRAMMERS WORKSPACE</span>
              </div>
              <h2 className="text-3xl font-black italic tracking-tighter uppercase font-display text-white">Sovereign Creator Sanctuary</h2>
              <p className="text-slate-400 max-w-xl text-xs font-medium leading-relaxed">
                Welcome pastors, preceptors, authors, and storytellers. Type, sketch ideas, generate sermon points, compose inspired book outlines, write scripts, and design visual slide decks beautifully. All codeless, beautiful, and intuitive.
              </p>
            </div>
            <div className="bg-slate-950 px-5 py-3 rounded-2xl border border-white/5 text-center">
              <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Deck Slides</span>
              <span className="text-lg font-mono font-black text-amber-400">{presentationSlides.length} Pages</span>
            </div>
          </div>
        </div>

        {/* Forge Studio Tabs Selection */}
        <div className="flex flex-wrap gap-2 bg-slate-950 p-1.5 rounded-[2rem] border border-white/5 max-w-max">
          <button
            onClick={() => setActiveForgeSubTab('sermon')}
            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeForgeSubTab === 'sermon' ? 'bg-indigo-600 border border-indigo-500/30 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
          >
            ⛪ Preach & Teach Sanctuary
          </button>
          <button
            onClick={() => setActiveForgeSubTab('book')}
            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeForgeSubTab === 'book' ? 'bg-indigo-600 border border-indigo-500/30 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
          >
            📖 Divine Book Author
          </button>
          <button
            onClick={() => setActiveForgeSubTab('content')}
            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeForgeSubTab === 'content' ? 'bg-indigo-600 border border-indigo-500/30 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
          >
            🎬 Dynamic Content Scripts
          </button>
          <button
            onClick={() => setActiveForgeSubTab('presentation')}
            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeForgeSubTab === 'presentation' ? 'bg-indigo-600 border border-indigo-500/30 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
          >
            🎨 Slide Deck Designer
          </button>
        </div>

        {/* SECTION 1: SERMON PREACH & TEACH WORKSPACE */}
        <AnimatePresence mode="wait">
          {activeForgeSubTab === 'sermon' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              <div className="lg:col-span-6 bg-slate-900/60 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-2xl space-y-5">
                <span className="text-[10px] font-black uppercase text-amber-400 font-mono tracking-widest block border-b border-white/5 pb-3">⛪ SERMON & LESSON PLAN DETAILS</span>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Preaching/Lecture Title</label>
                    <input 
                      type="text" 
                      value={sermonTitle}
                      onChange={(e) => setSermonTitle(e.target.value)}
                      placeholder="e.g. Divine Elevation: Anchoring Faith"
                      className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-2xl text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Key Biblical Scripture</label>
                      <select 
                        value={sermonScripture}
                        onChange={(e) => {
                          setSermonScripture(e.target.value);
                          setSermonScriptureText(scriptureMap[e.target.value] || "");
                        }}
                        className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-2xl text-xs outline-none"
                      >
                        {scriptures.map(s => (
                          <option key={s.ref} value={s.ref} className="bg-slate-950 text-white">{s.ref}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Sacred Moral Theme</label>
                      <select 
                        value={sermonCategory}
                        onChange={(e) => setSermonCategory(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-2xl text-xs outline-none"
                      >
                        <option value="Spiritual Strength">Spiritual Strength & Faith</option>
                        <option value="Business Triumph">Honest Business Triumph</option>
                        <option value="Community Empowerment">Community Support & Help</option>
                        <option value="Family Values">Family Pillars & Advice</option>
                        <option value="Wisdom & Prosperity">Divine Wisdom & Prosperity</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Scripture Reading Text</label>
                    <textarea 
                      value={sermonScriptureText}
                      onChange={(e) => setSermonScriptureText(e.target.value)}
                      placeholder="Or write custom moral/inspirational notes..."
                      className="w-full h-16 px-4 py-3 bg-slate-950 border border-white/5 rounded-2xl text-xs outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Speaker Personal Notes & Insights</label>
                    <textarea 
                      value={sermonNotes}
                      onChange={(e) => setSermonNotes(e.target.value)}
                      placeholder="Mention community efforts, honest perseverance..."
                      className="w-full h-24 px-4 py-3 bg-slate-950 border border-white/5 rounded-2xl text-xs outline-none resize-none leading-relaxed"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    disabled={isDraftingSermon}
                    onClick={handleDraftSermon}
                    className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 duration-200 shadow-xl shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-400" /> {isDraftingSermon ? 'Formulating Sacred Truths...' : 'Draft Divine Sermon Plan'}
                  </button>
                </div>
              </div>

              {/* Sermon Output Console */}
              <div className="lg:col-span-6 bg-slate-950 border border-white/5 p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[480px]">
                <div className="space-y-4 h-full flex flex-col">
                  <span className="text-[10px] font-mono tracking-widest text-[#DAA520] block uppercase border-b border-white/5 pb-3">⛪ THE COMPASS BULLETIN OUTLINE</span>
                  
                  {sermonDraftResult ? (
                    <div className="space-y-5 text-left flex-grow overflow-y-auto max-h-[400px] pr-2 no-scrollbar">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-[8px] font-black tracking-widest uppercase block text-[#DAA520] mb-0.5">Sermon Main Theme</span>
                        <h4 className="text-sm font-black text-white italic">"{sermonDraftResult.title}"</h4>
                        <div className="mt-3 bg-slate-900 p-3 rounded-xl border border-[#DAA520]/25 text-[11px] font-mono text-amber-200">
                          <b>KEY SCRIPTURE ({sermonDraftResult.scripture}):</b> "{sermonDraftResult.scriptureText}"
                        </div>
                      </div>

                      <div className="space-y-3">
                        <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">PREACHING LESSON PILLARS</span>
                        {sermonDraftResult.points.map((pt: any, i: number) => (
                          <div key={i} className="p-3 bg-slate-900/50 rounded-xl border border-white/5">
                            <h5 className="text-xs font-bold text-white mb-0.5">{pt.title}</h5>
                            <p className="text-[10.5px] text-slate-400 leading-relaxed font-sans">{pt.body}</p>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 bg-indigo-950/40 border border-[#daa520]/30 rounded-2xl">
                        <span className="text-[8px] font-black text-[#DAA520] uppercase block tracking-wider">SACRED CONCLUDED PRAYER POINTS</span>
                        <p className="text-[11px] font-mono italic text-amber-100/90 mt-1 leading-relaxed">"{sermonDraftResult.closingPrayer}"</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-20 text-slate-600">
                      <BookOpen className="w-12 h-12 text-slate-800 mb-2 animate-pulse" />
                      <span className="text-xs font-mono">Awaiting Divine Sermon drafting trigger...</span>
                    </div>
                  )}
                </div>

                <div className="text-[9px] font-mono text-slate-500 flex items-center justify-between border-t border-white/5 pt-3 mt-4">
                  <span>Auditorium: EFADO SOVEREIGN</span>
                  <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" /> Live Broadcast Ready</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* SECTION 2: BOOK AUTHOR BOOKSTORE & DEVOTIONAL SUITE */}
          {activeForgeSubTab === 'book' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              <div className="lg:col-span-6 bg-slate-900/60 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-2xl space-y-5">
                <span className="text-[10px] font-black uppercase text-amber-400 font-mono tracking-widest block border-b border-white/5 pb-3">📖 DIVINE BOOK COMPOSER</span>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Sacred Book Title</label>
                    <input 
                      type="text" 
                      value={bookTitle}
                      onChange={(e) => setBookTitle(e.target.value)}
                      placeholder="e.g. Winds of Destiny"
                      className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-2xl text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Subheading & Inspiration Focus</label>
                    <input 
                      type="text" 
                      value={bookSubtitle}
                      onChange={(e) => setBookSubtitle(e.target.value)}
                      placeholder="e.g. A Celestial Strategy Blueprint for Spiritual Leaders"
                      className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-2xl text-xs outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Book Category</label>
                      <select 
                        value={bookGenre}
                        onChange={(e) => setBookGenre(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-2xl text-xs outline-none"
                      >
                        <option value="Inspirational Guide & Devotional">Inspirational Devotional</option>
                        <option value="Ethical Business Triumph">Ethical Business Growth</option>
                        <option value="Personal Memoir">Pastoral Memoir & Life</option>
                        <option value="Fiction Lessons">Fictional Moral Story</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Author's Cover Theme</label>
                      <select 
                        value={bookCoverBg}
                        onChange={(e) => setBookCoverBg(e.target.value as any)}
                        className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-2xl text-xs outline-none"
                      >
                        <option value="gold">Sovereign Royal Gold</option>
                        <option value="royal-blue">Infinite Celestial Blue</option>
                        <option value="crimson">Pillar Crimson Red</option>
                        <option value="emerald">Ecosystem Abundance Green</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="text-[10px] text-slate-500 font-mono">
                     Author Signature: <b className="text-[#DAA520]">{user.displayName || 'Venerated Leader'}</b>
                  </div>
                  <button 
                    disabled={isDraftingBook}
                    onClick={handleDraftBook}
                    className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 duration-200 shadow-xl shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Book className="w-4 h-4" /> {isDraftingBook ? 'Drafting Sacred Outlines...' : 'Outline My Book Now'}
                  </button>
                </div>
              </div>

              {/* Book cover visualizer preview & output */}
              <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Visual Cover Preview */}
                <div className="md:col-span-5 flex flex-col items-center">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">SACRED MOCK BOOK COVER</span>
                  <div className={`w-full max-w-[200px] aspect-[2/3] rounded-3xl p-5 shadow-2xl relative flex flex-col justify-between border select-none transition-all duration-300 ${
                    bookCoverBg === 'gold' ? 'bg-gradient-to-br from-indigo-950 via-[#1e1b4b] to-black border-[#DAA520] text-amber-200' :
                    bookCoverBg === 'royal-blue' ? 'bg-gradient-to-br from-indigo-900 via-sky-950 to-slate-950 border-sky-400 text-sky-200' :
                    bookCoverBg === 'crimson' ? 'bg-gradient-to-br from-rose-950 via-red-955 to-[#500a0a] border-rose-500 text-rose-300' :
                    'bg-gradient-to-br from-emerald-950 via-teal-950 to-[#022c22] border-emerald-500 text-emerald-200'
                  }`}>
                    {/* Cover Header and Accents */}
                    <div className="text-center">
                      <div className="w-8 h-8 mx-auto mb-2 border rounded-full flex items-center justify-center border-current opacity-60">
                        <Star className="w-4 h-4" />
                      </div>
                      <span className="text-[7.5px] uppercase font-bold tracking-widest block opacity-70">{bookGenre}</span>
                    </div>

                    {/* Book Main Title */}
                    <div className="text-center py-2">
                      <h4 className="text-sm font-black uppercase italic tracking-tighter leading-tight scale-105">{bookTitle || 'Winds of Destiny'}</h4>
                      <p className="text-[7px] mt-1 opacity-80 leading-normal line-clamp-2">{bookSubtitle || 'A Strategy Blueprint'}</p>
                    </div>

                    {/* Footer Print */}
                    <div className="text-center border-t pt-2 border-white/10">
                      <span className="text-[5.5px] uppercase font-bold tracking-widest block opacity-40">SOVEREIGN PRESS</span>
                      <span className="text-[8px] font-black tracking-wider uppercase mt-0.5 text-white">{user.displayName || 'Venerated Leader'}</span>
                    </div>
                  </div>
                </div>

                {/* Chapter outline Output */}
                <div className="md:col-span-7 bg-slate-955 border border-white/5 p-6 rounded-[2.5rem] bg-slate-950 flex flex-col justify-between">
                  <div className="space-y-4">
                    <span className="text-[10px] font-mono tracking-widest text-[#DAA520] block uppercase border-b border-white/5 pb-2">📖 GENERATED TABLE OF CONTENTS</span>
                    
                    {bookOutlineResult ? (
                      <div className="space-y-3 overflow-y-auto max-h-[290px] pr-2 no-scrollbar text-left">
                        {bookOutlineResult.chapters.map((chap: any, i: number) => (
                          <div key={i} className="p-2 w-full bg-white/5 rounded-xl border border-white/5">
                            <span className="text-[8px] font-black text-amber-500 tracking-wider block uppercase">{chap.num}</span>
                            <h5 className="text-[11px] font-black text-white italic">"{chap.title}"</h5>
                            <p className="text-[9.5px] text-slate-400 leading-relaxed font-sans mt-0.5">{chap.desc}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center flex flex-col items-center text-slate-600">
                        <Award className="w-8 h-8 text-slate-800 mb-2" />
                        <span className="text-[10.5px] font-mono leading-relaxed">Book cover prepared. Click compiler run trigger to outline Chapters.</span>
                      </div>
                    )}
                  </div>

                  <div className="text-[8.5px] text-slate-400 font-mono flex items-center justify-between border-t border-white/5 pt-2 mt-2">
                     <span>Intellectual: EFADO LIT</span>
                     <span className="text-emerald-400">PUBLISH READY</span>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* SECTION 3: MULTI-MEDIA WRITING & VIDEO SCRIPTS FORGE */}
          {activeForgeSubTab === 'content' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              <div className="lg:col-span-6 bg-slate-900/60 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-2xl space-y-5">
                <span className="text-[10px] font-black uppercase text-amber-400 font-mono tracking-widest block border-b border-white/5 pb-3">🎬 MULTI-MEDIA WRITING & SCRIPT STUDIO</span>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Upload/Select Script Format</label>
                    <select 
                      value={scriptFormat}
                      onChange={(e) => setScriptFormat(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-2xl text-xs outline-none"
                    >
                      <option value="Short Reel & Video Devotional Script">Short Reel/Reel Stream Devotional Script</option>
                      <option value="YouTube Inspirational Lecture Script">YouTube In-depth Lecture Script</option>
                      <option value="Inspirational Audio Podcast Outline">Audio Sermon Podcast Outline</option>
                      <option value="Weekly Pastoral blog newsletter">Weekly Pastoral Blog Newsletter</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Video/Article Topic</label>
                    <input 
                      type="text" 
                      value={scriptTitle}
                      onChange={(e) => setScriptTitle(e.target.value)}
                      placeholder="e.g. My Weekly Sermon Video"
                      className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-2xl text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Inspirational Introduction Hook</label>
                    <textarea 
                      value={scriptHook}
                      onChange={(e) => setScriptHook(e.target.value)}
                      placeholder="e.g. Are you facing a trial in your family life..."
                      className="w-full h-16 px-4 py-3 bg-slate-950 border border-white/5 rounded-2xl text-xs outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Inspirational Lessons Outline Bulletpoints</label>
                    <textarea 
                      value={scriptBulletPoints}
                      onChange={(e) => setScriptBulletPoints(e.target.value)}
                      placeholder="Write bullet points here..."
                      className="w-full h-24 px-4 py-3 bg-slate-950 border border-white/5 rounded-2xl text-xs outline-none resize-none leading-relaxed"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    disabled={isDraftingScript}
                    onClick={handleDraftScript}
                    className="px-6 py-3.5 bg-gradient-to-r from-red-650 to-rose-650 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 duration-200 shadow-xl shadow-red-600/20 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Tv className="w-4 h-4" /> {isDraftingScript ? 'Structuring Timelines...' : 'Structure Multi-Media Script'}
                  </button>
                </div>
              </div>

              {/* Script Output Timeline */}
              <div className="lg:col-span-6 bg-slate-950 border border-white/5 p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[480px]">
                <div className="space-y-4 h-full flex flex-col">
                  <span className="text-[10px] font-mono tracking-widest text-[#DAA520] block uppercase border-b border-white/5 pb-3 font-mono">🎬 STRUCTURED MEDIA SEQUENCE TIMELINE</span>
                  
                  {scriptDraftResult ? (
                    <div className="space-y-4 text-left flex-grow overflow-y-auto max-h-[350px] pr-2 no-scrollbar">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-[8px] font-bold uppercase text-[#DAA520]">Topic</span>
                        <h4 className="text-sm font-black text-rose-350 italic">"{scriptDraftResult.title}"</h4>
                        <span className="text-[8.5px] mt-1 font-mono uppercase bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded inline-block">{scriptDraftResult.format}</span>
                      </div>

                      <div className="space-y-3">
                        {scriptDraftResult.segments.map((seg: any, i: number) => (
                          <div key={i} className="p-3 border-l-2 border-red-500 bg-slate-900/60 rounded-r-xl space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono font-black text-[#DAA520]">{seg.time}</span>
                              <span className="text-[9.5px] font-bold text-white uppercase">{seg.label}</span>
                            </div>
                            <p className="text-[11px] text-slate-350 leading-relaxed font-sans">{seg.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-20 text-slate-600">
                      <Volume2 className="w-12 h-12 text-slate-800 mb-2 animate-pulse" />
                      <span className="text-xs font-mono">Awaiting Script outline creation trigger...</span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-900 p-3.5 rounded-2xl border border-white/5 mt-4 flex items-center gap-3">
                   <div className="w-2.5 h-2.5 bg-red-650 rounded-full animate-ping shrink-0" />
                   <p className="text-[9.5px] text-slate-400 font-medium leading-normal">
                     Tip for Preachers: You can copy and print this sequence or present it live via our **Slide Deck Designer** on the next tab.
                   </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* SECTION 4: VISUAL GRAPHICS DESIGNER & PRESENTATION DECK BUILDER */}
          {activeForgeSubTab === 'presentation' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-10"
            >
              {/* Primary Horizontal Interactive Presenter Arena */}
              <div className="bg-slate-900/50 border border-white/5 rounded-[3rem] p-8 md:p-12 text-center space-y-8 backdrop-blur-3xl relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(218,165,32,0.03)_0%,transparent_70%)]" />
                
                <div className="flex justify-between items-center text-[10px] font-mono tracking-widest text-[#DAA520]">
                  <span>INTERACTIVE PRESENTATION SIMULATOR</span>
                  <span className="bg-amber-500/15 px-3 py-1 border border-[#DAA520]/25 rounded-md">PAGE {activeSlideIdx + 1} OF {presentationSlides.length}</span>
                </div>

                {/* Main Slide Card Grid */}
                <div className="max-w-3xl mx-auto">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSlideIdx}
                      initial={{ opacity: 0, scale: 0.98, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.98, x: -25 }}
                      transition={{ duration: 0.3 }}
                      className={`min-h-[280px] md:min-h-[320px] rounded-[2.5rem] p-8 md:p-12 text-left border shadow-2xl flex flex-col justify-between select-none relative transition-all duration-300 ${
                        slideBgGradients[presentationSlides[activeSlideIdx]?.bg || 'divine-gold']
                      }`}
                    >
                      {/* Decorative elements */}
                      <div className="absolute top-6 right-6 w-12 h-12 border rounded-full border-white/10 flex items-center justify-center text-white/20 select-none">
                        <Palette className="w-5 h-5" />
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-black tracking-widest text-amber-500 font-mono italic">
                          {presentationSlides[activeSlideIdx]?.subtitle || 'Sovereign Presentation'}
                        </span>
                        <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic text-white leading-none">
                          {presentationSlides[activeSlideIdx]?.title || 'Slide Title'}
                        </h3>
                      </div>

                      <p className="text-slate-200 text-sm md:text-base leading-relaxed font-sans max-w-2xl mt-6">
                        {presentationSlides[activeSlideIdx]?.body || 'Slide main message text. Edit below to change what appears.'}
                      </p>

                      <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-6">
                         <span className="text-[9px] font-mono text-slate-500">EFADO SOVEREIGN PRESENTATION SUITE</span>
                         <span className="text-[11px] font-bold text-white uppercase tracking-widest">{user.displayName || 'Venerated Leader'}</span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Deck Navigation Controls */}
                <div className="flex justify-center items-center gap-6">
                  <button
                    onClick={() => setActiveSlideIdx(prev => Math.max(0, prev - 1))}
                    disabled={activeSlideIdx === 0}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-colors disabled:opacity-20 text-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex gap-1.5 items-center">
                    {presentationSlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSlideIdx(idx)}
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          idx === activeSlideIdx ? 'w-8 bg-[#DAA520]' : 'w-2.5 bg-slate-700/60 hover:bg-slate-500'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => setActiveSlideIdx(prev => Math.min(presentationSlides.length - 1, prev + 1))}
                    disabled={activeSlideIdx === presentationSlides.length - 1}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-colors disabled:opacity-20 text-white"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => deleteSlide(activeSlideIdx)}
                    title="Delete current slide"
                    className="p-3 bg-red-650/10 hover:bg-red-650/20 border border-red-500/20 rounded-2xl text-red-400 ml-4 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dynamic Slide Generator Form */}
              <div className="bg-slate-900 border border-white/5 p-8 rounded-[2.5rem] text-left">
                <span className="text-[10px] font-black uppercase text-amber-400 font-mono tracking-widest block border-b border-white/5 pb-3 mb-5">🎨 DESIGN & APPEND CUSTOM PRESENTATION SLIDE</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Slide Header Title</label>
                      <input 
                        type="text" 
                        value={newSlideTitle}
                        onChange={(e) => setNewSlideTitle(e.target.value)}
                        placeholder="e.g. Raising up Divine Leaders"
                        className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-2xl text-xs outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Slide Subtitle Wordings</label>
                      <input 
                        type="text" 
                        value={newSlideSubtitle}
                        onChange={(e) => setNewSlideSubtitle(e.target.value)}
                        placeholder="e.g. Setting clear values in the market"
                        className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-2xl text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Choose Luxury Accent Theme Background</label>
                      <div className="grid grid-cols-5 gap-2 pt-1.5">
                        {Object.entries({
                          'divine-gold': 'from-indigo-950 via-slate-900 to-[#DAA520]/60 border-[#DAA520]',
                          'sunset-burgundy': 'from-[#450a0a] via-[#1e1b4b] to-[#7f1d1d] border-red-500',
                          'ocean-wisdom': 'from-slate-950 via-[#0f172a] to-[#0369a1] border-sky-400',
                          'emerald-forest': 'from-slate-950 via-[#022c22] to-emerald-500 border-emerald-400',
                          'celestial-indigo': 'from-[#4c1d95] via-[#111827] to-[#6366f1] border-indigo-400'
                        }).map(([key, value]) => (
                          <button
                            key={key}
                            onClick={() => setNewSlideBg(key)}
                            className={`h-11 rounded-xl bg-gradient-to-r ${value} border flex items-center justify-center text-[8px] font-black uppercase text-white/50 hover:text-white relative transition-all`}
                          >
                            {newSlideBg === key && (
                              <span className="absolute inset-0 bg-white/10 rounded-xl flex items-center justify-center shadow-lg">
                                <Check className="w-5 h-5 text-white animate-bounce" />
                              </span>
                            )}
                            <span className="scale-[0.8] line-clamp-1">{key.split('-')[1] || key}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Body area and compile action */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Slide Description/Core Message Words</label>
                      <textarea 
                        value={newSlideBody}
                        onChange={(e) => setNewSlideBody(e.target.value)}
                        placeholder="Explain the presentation lesson point slowly here..."
                        className="w-full h-32 px-4 py-3 bg-slate-950 border border-white/5 rounded-2xl text-xs outline-none resize-none leading-relaxed"
                      />
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        onClick={addNewSlide}
                        className="px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-650 text-slate-950 font-black text-xs font-bold uppercase tracking-widest rounded-3xl hover:scale-105 active:scale-95 duration-200 shadow-xl shadow-amber-500/10 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Design & Append Current Slide
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    );
  };

  // ============================================
  // EXPERIMENTAL SUB-PLATFORM 2: THE INCUBATOR
  // ============================================
  const renderIncubatorPlatform = () => {
    const handleEvaluatePitch = () => {
      if (!pitchTitle.trim() || !pitchContent.trim()) {
        alert("Please complete the Plan Title and Elevator Pitch fields first.");
        return;
      }
      setIsEvaluatingPitch(true);
      setEvaluatedScores(null);
      setEvaluationFeedback('');

      setTimeout(() => {
        const scores = {
          market: 82 + Math.floor(Math.random() * 15),
          feasibility: 80 + Math.floor(Math.random() * 16),
          social: 85 + Math.floor(Math.random() * 13)
        };
        setEvaluatedScores(scores);
        setEvaluationFeedback(
          `[EVALUATION REPORT SUCCESSFUL] The proposed solution "${pitchTitle}" displays high strategic fit in the Pan-African ecosystem. ` +
          `Market integration potential scored at ${scores.market}%. Technology feasibility index at ${scores.feasibility}%. Strategic Impact Index is outstanding at ${scores.social}%. ` +
          `Recommended decision status: Standard Seed-Fund. Forwarding pitch files directly to CEO Okhawere Festus.`
        );
        setIsEvaluatingPitch(false);
      }, 2500);
    };

    const handleSubmitVenture = async () => {
      if (!evaluatedScores) return;
      setIsPublishingPitch(true);
      try {
        await addDoc(collection(db, 'incubator_ideas'), {
          userId: user.uid,
          userEmail: user.email,
          title: pitchTitle,
          category: pitchCategory,
          stack: pitchStack || 'Custom Sandbox Web Stack',
          pitch: pitchContent,
          needs: pitchNeeds,
          region: pitchRegion,
          scores: evaluatedScores,
          createdAt: new Date().toISOString(),
          status: 'CEO Verification Pending'
        });

        setPitchTitle('');
        setPitchStack('');
        setPitchContent('');
        setEvaluatedScores(null);
        setEvaluationFeedback('');
        alert("Venture proposal submitted securely to CEO Festus's central dashboard!");
      } catch (err) {
        console.error("Venture submission error: ", err);
      } finally {
        setIsPublishingPitch(false);
      }
    };

    return (
      <div className="p-8 max-w-6xl mx-auto space-y-8 text-left text-white">
        <button 
          onClick={() => setActivePlatform(null)}
          className="flex items-center gap-2 text-xs font-black uppercase text-[#DAA520] hover:text-white transition-all font-mono font-black"
        >
          <ArrowLeft className="w-4 h-4" /> BACK TO TECHNOLOGY HIGHWAY
        </button>

        <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px]" />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9.5px] rounded-lg tracking-widest font-black uppercase">EFADO TECHNOLOGY INCUBATOR</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">VENTURE PIPELINE CENTRE</span>
              </div>
              <h2 className="text-3xl font-black italic tracking-tighter uppercase font-display text-white">The Venture Incubator Pitch Deck</h2>
              <p className="text-slate-400 max-w-xl text-xs font-medium leading-relaxed">Publish innovative startup plans, request funding requirements, and check direct strategic feasibility index inputs. Pitch goes straight to Okhawere Festus.</p>
            </div>
            <div className="bg-slate-950/80 px-4 py-3 rounded-2xl border border-white/5 text-center">
              <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">My Ideas Submitted</span>
              <span className="text-lg font-black font-mono text-[#DAA520]">{myPitches.length}</span>
            </div>
          </div>
        </div>

        {/* Development forms grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-slate-900/60 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-2xl space-y-5">
            <h4 className="text-sm font-black uppercase text-white font-mono tracking-wider border-b border-white/5 pb-3">
              VENTURE PROPOSAL DETAILS
            </h4>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block mb-1">Interactive Startup Plan Title</label>
                <input
                  type="text"
                  placeholder="e.g. Pan-African Crop Intelligence Mapping"
                  value={pitchTitle}
                  onChange={(e) => setPitchTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-955 border border-[ffffff]/5 rounded-2xl text-xs text-white outline-none focus:border-emerald-500 bg-slate-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block mb-1">Venture Model Category</label>
                  <select
                    value={pitchCategory}
                    onChange={(e) => setPitchCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-955 border border-[ffffff]/5 rounded-2xl text-xs text-white outline-none bg-slate-950"
                  >
                    <option value="AI SaaS" className="bg-slate-950">AI SaaS Platforms</option>
                    <option value="FinTech Microfinance" className="bg-slate-950">FinTech Microfinance</option>
                    <option value="DeepTech Robotics" className="bg-slate-950">DeepTech & Web Robotics</option>
                    <option value="Sovereign Ledger" className="bg-slate-950">S sovereign Ledgers</option>
                    <option value="Education Technology" className="bg-slate-950">Pan-African Smart Learning</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block mb-1">Technological Stack</label>
                  <input
                    type="text"
                    placeholder="e.g. Python, Motoko, Rust"
                    value={pitchStack}
                    onChange={(e) => setPitchStack(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-955 border border-[ffffff]/5 rounded-2xl text-xs text-white outline-none focus:border-emerald-500 bg-slate-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block mb-1">Target Funding Amount</label>
                  <select
                    value={pitchNeeds}
                    onChange={(e) => setPitchNeeds(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-955 border border-[ffffff]/5 rounded-2xl text-xs text-white outline-none bg-slate-950"
                  >
                    <option value="$1,500 Micro-Grant" className="bg-slate-950">$1,500 Micro-Grant</option>
                    <option value="$5,000 Seed Capital" className="bg-slate-950">$5,000 Seed Capital</option>
                    <option value="$15,500 Acceleration Series" className="bg-slate-950">$15,500 Acceleration Series</option>
                    <option value="$50,000 Major VC Round" className="bg-slate-950">$50,000 Major VC Round</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block mb-1">Geographical Targeting</label>
                  <input
                    type="text"
                    placeholder="e.g. Nigeria, Ghana, Pan-African"
                    value={pitchRegion}
                    onChange={(e) => setPitchRegion(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-955 border border-[ffffff]/5 rounded-2xl text-xs text-white outline-none focus:border-emerald-500 bg-slate-950"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block mb-1">Elevator Pitch Description & Social Impact</label>
                <textarea
                  placeholder="Explain your product's architecture, your strategic solution, the market sizing, and how it targets socio-economic development."
                  value={pitchContent}
                  onChange={(e) => setPitchContent(e.target.value)}
                  className="w-full h-32 bg-slate-950 p-4 rounded-2xl text-xs text-white border border-white/5 focus:border-emerald-500 outline-none resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={handleEvaluatePitch}
                disabled={isEvaluatingPitch}
                className="px-6 py-3 border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
              >
                {isEvaluatingPitch ? 'Scanning Pitch...' : 'Evaluate Feasibility'}
              </button>
              <button
                onClick={handleSubmitVenture}
                disabled={!evaluatedScores || isPublishingPitch}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  evaluatedScores && !isPublishingPitch
                    ? 'bg-[#DAA520] hover:bg-yellow-400 text-slate-950 shadow-xl'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isPublishingPitch ? 'Publishing Pitch...' : 'Submit Strategic Plan'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#6df2ff] font-mono">FEASIBILITY RADAR SUMMARY</span>
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>

              {evaluatedScores ? (
                <div className="space-y-4 text-left">
                  <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-white/5 text-center">
                    <div>
                      <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">MARKET FIT</span>
                      <span className="text-lg font-black text-[#6df2ff]">{evaluatedScores.market}%</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">FEASIBILITY</span>
                      <span className="text-lg font-black text-indigo-400">{evaluatedScores.feasibility}%</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">IMPACT</span>
                      <span className="text-lg font-black text-purple-400">{evaluatedScores.social}%</span>
                    </div>
                  </div>

                  <p className="font-mono text-[9px] text-emerald-400/90 leading-relaxed bg-[#10b981]/5 border border-emerald-500/10 p-3 rounded-xl bg-slate-950">
                    {evaluationFeedback}
                  </p>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center text-slate-500 font-mono text-[9px]">
                  <AlertCircle className="w-8 h-8 text-slate-700 mb-2 animate-pulse" />
                  <span>Awaiting AI Feasibility valuation trigger...</span>
                </div>
              )}
            </div>

            <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] shadow-2xl flex-grow flex flex-col max-h-[300px]">
              <div className="border-b border-white/5 pb-3 mb-3">
                <h4 className="text-xs font-black uppercase text-white tracking-wider">MY SUBMISSION PIPELINES ({myPitches.length})</h4>
              </div>

              <div className="space-y-3 overflow-y-auto no-scrollbar flex-grow">
                {myPitches.length === 0 ? (
                  <div className="py-8 text-center text-slate-600 font-mono text-[8px]">
                    No submission history recorded yet.
                  </div>
                ) : (
                  myPitches.map((item) => (
                    <div key={item.id} className="p-3 bg-slate-950 rounded-xl border border-white/5 text-left space-y-1.5 transition-all hover:border-white/10">
                      <div className="flex items-center justify-between">
                        <h5 className="text-[11px] font-black text-indigo-300 uppercase truncate max-w-[140px]">{item.title}</h5>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-black uppercase ${
                          item.status === 'CEO Evaluated' ? 'bg-[#DAA520]/25 text-[#DAA520]' : 'bg-slate-800 text-slate-400 border border-white/5 animate-pulse'
                        }`}>
                          {item.status === 'CEO Evaluated' ? 'CEO Evaluated' : 'Awaiting CEO'}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 font-mono uppercase">Capital: {item.needs} • Region: {item.region}</p>
                      {item.ceoFeedback && (
                        <div className="bg-[#DAA520]/5 border border-[#DAA520]/20 p-2.5 rounded-lg text-[9px] text-[#DAA520] font-mono leading-relaxed mt-1.5">
                          <b>CEO DIRECT DECISION:</b> "{item.ceoFeedback}"
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (activePlatform === 'forge') return renderForgePlatform();
    if (activePlatform === 'incubator') return renderIncubatorPlatform();

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
