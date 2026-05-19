import React, { useState } from 'react';
import { 
  Zap, 
  ShoppingBag, 
  MessageSquare, 
  HardHat, 
  Users, 
  HandCoins, 
  ArrowRight, 
  ShieldCheck, 
  Globe, 
  Building2,
  TrendingUp,
  Gamepad2,
  ChevronRight,
  Star,
  Award,
  Heart,
  Brain,
  GraduationCap,
  Video,
  Megaphone,
  Search,
  Network,
  HelpCircle,
  BookOpen,
  Info,
  CheckCircle,
  UserPlus,
  X,
  Cpu,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCurrency } from '../lib/CurrencyContext';
import { HubHeroCarousel } from './HubHeroCarousel';
import { EfadoLogo } from './EfadoLogo';
import { UniversalSearch } from './UniversalSearch';
import { MiningMiniCard } from './EfadoMining';
import { EfadoIntelligenceFeed } from './EfadoIntelligenceFeed';
import { UserProfile } from '../types';
import { OFFICE_ADDRESSES, PHONE_NUMBERS, SUPPORT_EMAILS } from '../constants/businessProfile';

interface EfadoHomePageProps {
  user: UserProfile;
  onNavigate: (hub: 'HOME' | 'DASHBOARD' | 'GAMES' | 'MARKET' | 'GIST' | 'SERVICE_CORPS' | 'COMMUNITY_HUBS' | 'HEPIHANDS_LOAN' | 'DOMAIN_HUB' | 'EDUCATION' | 'ZOOM' | 'ADVERTISING' | 'PARTNER_HUB', subview?: string) => void;
  onOpenMining: () => void;
}

const HUBS_DATA = [
  {
    id: 'GAMES',
    title: 'Gaming Arena',
    description: 'High-stakes games including Lucky Spin, DMT, and Money Card. Win big and cash out instantly!',
    icon: Gamepad2,
    color: 'from-indigo-600 to-purple-700',
    tag: 'Popular',
    stats: '10k+ Players'
  },
  {
    id: 'MARKET',
    title: 'Market Hubs',
    description: 'Buy and sell fairly used or new products. Connect with vendors globally and locally.',
    icon: ShoppingBag,
    color: 'from-emerald-600 to-teal-700',
    tag: 'Marketplace',
    stats: '5k+ Products'
  },
  {
    id: 'ADVERTISING',
    title: 'EFADO Advertising',
    description: 'Strategic visibility for hotels, farming, real estate, vehicles, and global marketplaces.',
    icon: Megaphone,
    color: 'from-indigo-600 to-indigo-800',
    tag: 'Connections',
    stats: 'Global Reach'
  },
  {
    id: 'GIST',
    title: 'Gist Hub',
    description: 'Community discussions, mentorship, careers, and technology. Stay connected and informed.',
    icon: MessageSquare,
    color: 'from-blue-600 to-cyan-700',
    tag: 'Social',
    stats: '2k+ Topics'
  },
  {
    id: 'SERVICE_CORPS',
    title: 'Service Corps',
    description: 'Professional service providers for home, building, construction, and technical consultancy.',
    icon: HardHat,
    color: 'from-slate-700 to-slate-900',
    tag: 'Professional',
    stats: '500+ Pros'
  },
  {
    id: 'COMMUNITY_HUBS',
    title: 'Community Hubs',
    description: 'Collective saving cycles (CSCC) with rotating payouts. Grow your wealth together.',
    icon: Users,
    color: 'from-purple-600 to-pink-700',
    tag: 'Savings',
    stats: '100+ Groups'
  },
  {
    id: 'HEPIHANDS_LOAN',
    title: 'HEPIHANDS Loan',
    description: 'Transparent and accessible credit for verified members. Instant verification and flexible terms.',
    icon: HandCoins,
    color: 'from-orange-500 to-red-600',
    tag: 'Finance',
    stats: 'Low Rates'
  },
  {
    id: 'DOMAIN_HUB',
    title: 'Domain Hub',
    description: 'Register and manage domains from top global registrars. Earn commissions on every purchase.',
    icon: Globe,
    color: 'from-indigo-600 to-blue-800',
    tag: 'EFADO Mail',
    stats: 'Top Sellers'
  },
  {
    id: 'PARTNER_HUB',
    title: 'Partner Hub',
    description: 'The gateway for global marketers, organizations, and strategic affiliates. Connect, earn, and scale your influence.',
    icon: UserPlus,
    color: 'from-amber-500 to-amber-700',
    tag: 'Affiliate',
    stats: 'Global Program'
  },
  {
    id: 'EDUCATION',
    title: 'Education Hub',
    description: 'Universal academic platform covering all levels from Primary to Postgraduate. Resources, portals, and developmental tools.',
    icon: GraduationCap,
    color: 'from-indigo-700 to-indigo-900',
    tag: 'New Hub',
    stats: 'All Levels'
  }
];

export const EfadoHomePage: React.FC<EfadoHomePageProps> = ({ user, onNavigate, onOpenMining }) => {
  const { formatPrice } = useCurrency();
  const [showUniversalSearch, setShowUniversalSearch] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const hubs = HUBS_DATA;

  return (
    <div className="space-y-24 pb-32">
      {/* Global Intelligence Ticker - Always Displayed */}
      <EfadoIntelligenceFeed mode="ticker-only" />

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex flex-col overflow-hidden">
        <HubHeroCarousel hubType="HOME" onAction={(view, subview) => onNavigate(view as any, subview)} />
        
        {/* Scrolling Strategic Text Section - ADLaM Display & Bouncing Animation */}
        <section className="relative z-30 py-24 overflow-hidden" style={{ contain: 'paint' }}>
          <div className="flex whitespace-nowrap">
            <motion.div 
              animate={{ x: ["0%", "-50%"] }}
              transition={{ 
                duration: 60, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              style={{ willChange: 'transform' }}
              className="flex items-center gap-16"
            >
              {[1, 2].map((_, idx) => (
                <div key={idx} className="flex items-center gap-16">
                  <motion.p 
                    animate={{ 
                      y: [0, -15, 0],
                      scale: [1, 1.01, 1],
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{ textShadow: '0 0 20px rgba(0,0,0,0.5)' }}
                    className="text-4xl md:text-5xl lg:text-7xl font-adlam tracking-tight bg-gradient-to-r from-indigo-400 via-purple-300 via-emerald-300 to-amber-300 bg-clip-text text-transparent opacity-95"
                  >
                    world packed with innovations, East meets West. EFADO the North Star Hubs -stage your talents.
                  </motion.p>
                  <div className="w-16 h-16 bg-white/10 rounded-full blur-md shrink-0" />
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Growth Triggers & Hub Shortcuts immediately following hero */}
        <div className="max-w-7xl mx-auto px-4 w-full -mt-12 relative z-30">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                 <MiningMiniCard user={user} onOpenFull={onOpenMining} />
              </div>
              <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-2xl flex flex-col justify-center">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Network Status</p>
                 <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                    <p className="text-sm font-black text-gray-900 uppercase">Universal Protocol Synchronized</p>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Our Mission / Captivating Paragraph */}
      <section className="max-w-6xl mx-auto px-4 text-center space-y-12 py-20 relative">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-1 bg-indigo-500 rounded-full blur-sm" />
        <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-indigo-500/10 rounded-full border border-indigo-500/20 backdrop-blur-xl">
          <Zap className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Core Mission Directive</span>
        </div>
        <h2 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white tracking-tighter leading-tight max-w-4xl mx-auto">
          One Neural Network. <span className="text-indigo-500">Universal Equity.</span>
        </h2>
        <p className="text-xl text-slate-400 leading-relaxed font-medium max-w-4xl mx-auto mb-16">
          Efado Hubs is a global, all-in-one digital financial ecosystem that connects people to opportunity across the world — spanning games, markets, services, education, employment, housing, and community life. We believe economic access should feel intuitive and welcoming for everyone. One world. One ecosystem. Every opportunity. That's the power of connection. Every door. One key. Efado Hubs, a new center of gravity.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-12 pt-8">
           <div className="flex flex-col items-center">
             <p className="text-4xl md:text-5xl font-extrabold text-white tracking-tighter">Omni-Built</p>
             <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-3">Inclusive Engineering</p>
           </div>
           <div className="w-px h-16 bg-white/10 hidden md:block" />
           <div className="flex flex-col items-center">
             <p className="text-4xl md:text-5xl font-extrabold text-white tracking-tighter">Tactical</p>
             <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-3">Real-world Access</p>
           </div>
        </div>
      </section>

      {/* Hubs Grid */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20 border-b border-white/5 pb-12">
          <div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tighter leading-tight mb-4">Tactical Hubs</h2>
            <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl">Synchronised performance layers for the modern ecosystem.</p>
          </div>
          <div className="flex items-center gap-6 p-6 glass-card-ultra rounded-[2rem]">
            <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center">
              <Globe className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Global Presence</p>
              <p className="text-xl font-extrabold text-white">Integrated 100+</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {hubs.map((hub, i) => (
            <motion.div
              key={hub.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02, y: -8 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
              viewport={{ once: true }}
              onClick={() => onNavigate(hub.id as any)}
              className="group cursor-pointer"
            >
              <div className="glass-card-ultra golden-card-border p-10 rounded-[3rem] text-left transition-all duration-500 group-hover:shadow-[0_40px_80px_rgba(0,0,0,0.6)] border-t-[6px] border-t-white/10 group-hover:border-t-indigo-500 h-full flex flex-col">
                <div className="relative z-10 flex flex-col h-full uppercase">
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-16 h-16 bg-white/5 backdrop-blur-3xl rounded-[1.5rem] flex items-center justify-center group-hover:bg-indigo-600 transition-all duration-500 group-hover:scale-110 shadow-lg">
                      <hub.icon className="w-8 h-8 text-white" />
                    </div>
                    <span className="px-4 py-1.5 bg-white/5 text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10 group-hover:bg-indigo-500/20 group-hover:text-indigo-200 transition-all">
                      {hub.tag}
                    </span>
                  </div>
                  <h3 className="text-3xl font-black text-white mb-6 tracking-tighter group-hover:text-indigo-300 transition-colors">{hub.title}</h3>
                  <p className="text-slate-200 text-sm mb-12 flex-grow leading-relaxed font-bold tracking-tight opacity-90 group-hover:opacity-100 transition-opacity">
                    {hub.description}
                  </p>
                  <div className="flex items-center justify-between pt-8 border-t border-white/10 mt-auto">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-100 transition-colors">{hub.stats}</span>
                    <div className="flex items-center gap-3 font-black uppercase tracking-[0.3em] text-[11px] text-indigo-400 group-hover:gap-6 transition-all group-hover:text-indigo-300">
                      Synchronise <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>      {/* Partner Logos / Trust Bar */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-600/5 blur-[120px] rounded-full -left-1/4 -top-1/4" />
        <div className="absolute inset-0 bg-amber-600/5 blur-[120px] rounded-full -right-1/4 -bottom-1/4" />
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center mb-20">
             <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-500 to-transparent mb-8" />
             <h3 className="text-[11px] font-black text-amber-500 tracking-[0.5em] text-center mb-4">Strategic Global Synchronisation</h3>
             <p className="text-3xl md:text-4xl font-black text-white tracking-tighter text-center max-w-2xl">Intelligence Harmonized with Professional Strategic Partners</p>
          </div>

          <div className="relative group/partners">
            {/* Soft gradient edges for the marquee effect */}
            <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-slate-950 to-transparent z-20 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-slate-950 to-transparent z-20 pointer-events-none" />
            
            <div className="flex overflow-hidden relative">
              <motion.div 
                animate={{ x: ["0%", "-50%"] }}
                transition={{ 
                  duration: 25, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
                className="flex items-center gap-16 whitespace-nowrap py-10"
              >
                {[
                  { name: "World Bank", icon: Globe, color: "text-indigo-400" },
                  { name: "Energy Lab", icon: Zap, color: "text-orange-400" },
                  { name: "Unity Corp", icon: Building2, color: "text-emerald-400" },
                  { name: "Secure Node", icon: ShieldCheck, color: "text-rose-400" },
                  { name: "Growth Org", icon: TrendingUp, color: "text-cyan-400" },
                  { name: "Alpha Capital", icon: Star, color: "text-amber-500" },
                  { name: "Global Grid", icon: Globe, color: "text-blue-500" },
                  { name: "Elite Nodes", icon: ShieldCheck, color: "text-indigo-500" }
                ].concat([
                  { name: "World Bank", icon: Globe, color: "text-indigo-400" },
                  { name: "Energy Lab", icon: Zap, color: "text-orange-400" },
                  { name: "Unity Corp", icon: Building2, color: "text-emerald-400" },
                  { name: "Secure Node", icon: ShieldCheck, color: "text-rose-400" },
                  { name: "Growth Org", icon: TrendingUp, color: "text-cyan-400" },
                  { name: "Alpha Capital", icon: Star, color: "text-amber-500" },
                  { name: "Global Grid", icon: Globe, color: "text-blue-500" },
                  { name: "Elite Nodes", icon: ShieldCheck, color: "text-indigo-500" }
                ]).map((partner, i) => (
                  <div 
                    key={i} 
                    className="flex items-center gap-5 transition-all duration-500 hover:scale-110 cursor-alias"
                  >
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 golden-card-border shadow-xl backdrop-blur-md group-hover/partners:opacity-60 hover:!opacity-100 transition-opacity">
                      <partner.icon className={`w-10 h-10 ${partner.color}`} />
                    </div>
                    <span className="text-3xl font-black text-white border-b-2 border-transparent hover:border-amber-500 transition-all tracking-tighter">
                      {partner.name}
                    </span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials / Social Proof */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto mb-24 space-y-6">
             <h2 className="text-5xl md:text-6xl font-extrabold text-white tracking-tighter">Community Intelligence</h2>
             <p className="text-slate-500 text-xl font-medium">Verified tactical feedback from the global network.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
             {[
               {
                 name: "Samuel Okafor",
                 role: "Market Strategist",
                 text: "Efado Market Hubs transformed how I reach customers. The secure payments and tracking make international trade feel like a local transaction.",
                 avatar: "https://picsum.photos/seed/user1/100/100"
               },
               {
                 name: "Aisha Yusuf",
                 role: "Network Lead",
                 text: "The CSCC platform in Community Hubs is a game-changer. We've built true financial trust within our group thanks to Efado's transparency.",
                 avatar: "https://picsum.photos/seed/user2/100/100"
               },
               {
                 name: "Elena Rodriguez",
                 role: "Patron General",
                 text: "Being a patron feels rewarding. I can see exactly how my support helps expand local services and create jobs in different communities.",
                 avatar: "https://picsum.photos/seed/user3/100/100"
               }
             ].map((review, i) => (
               <div key={i} className="glass-card-ultra p-10 rounded-[3rem] border border-white/5 space-y-8 hover:bg-white/5 transition-all group">
                 <div className="flex gap-1.5 ">
                   {[1,2,3,4,5].map(star => <Star key={star} className="w-4 h-4 text-indigo-500 fill-indigo-500" />)}
                 </div>
                 <p className="text-slate-300 italic font-medium leading-[1.8] text-lg">"{review.text}"</p>
                 <div className="flex items-center gap-5 pt-8 border-t border-white/5">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden grayscale group-hover:grayscale-0 transition-all border border-white/10">
                      <img src={review.avatar} alt={review.name} referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-tighter">{review.name}</h4>
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">{review.role}</p>
                    </div>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Advertise on Efado & Patron Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Advertise Card - UPDATED WITH DUAL BUTTONS */}
          <div className="bg-white rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-12 border-l-[8px] md:border-l-[16px] border-l-indigo-600 space-y-10 group hover:shadow-2xl transition-all duration-700">
            <div className="inline-block px-6 py-2 bg-indigo-500/10 rounded-full border border-indigo-500/20 backdrop-blur-xl">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Visibility & Sales Engine</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tighter leading-tight italic">
              Manifest your <span className="text-indigo-600 block">Offerings.</span>
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed font-medium">
              Amplify your presence or liquidate assets across the EFADO neural network. 
              From luxury hotels and farm estates to vehicles and professional services.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6">
               <button 
                onClick={() => onNavigate('ADVERTISING', 'ADVERT')}
                className="flex-grow py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 group/btn"
              >
                Advertise on EFADO <Megaphone className="w-5 h-5" />
              </button>
              <button 
                onClick={() => onNavigate('ADVERTISING', 'SELL')}
                className="flex-grow py-6 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 group/btn"
              >
                Sell it at EFADO <ShoppingBag className="w-5 h-5 text-indigo-400" />
              </button>
            </div>

            <div className="pt-6 border-t border-gray-50 grid grid-cols-3 gap-4">
               {['Hotels', 'Farming', 'Real Estate'].map(item => (
                 <div key={item} className="text-center p-3 bg-gray-50 rounded-2xl">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item}</p>
                 </div>
               ))}
            </div>
          </div>

          {/* Patron Card */}
          <div className="glass-card-ultra rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-12 border-l-[8px] md:border-l-[16px] border-l-emerald-600 space-y-10 group hover:bg-slate-900/40 transition-all duration-700">
            <div className="inline-block px-6 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 backdrop-blur-xl">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Ecosystem Sponsorship</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tighter leading-tight">
              Fund the <span className="text-emerald-500 block">Future Evolution</span>
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed font-medium">
              Patrons are the bedrock of Efado Hubs. Your sponsorship scales tactical development and community synchronisation.
            </p>
            <div className="space-y-4 pb-4">
               {[
                 "Direct structural support for community hubs.",
                 "Zero-barrier access engineering for all.",
                 "Exclusive alpha intelligence and strategic rewards."
               ].map((benefit, i) => (
                 <div key={i} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                   <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                     <ChevronRight className="w-4 h-4 text-slate-950" />
                   </div>
                   <p className="text-xs font-bold text-slate-200">{benefit}</p>
                 </div>
               ))}
            </div>
            <button 
              onClick={() => onNavigate('DASHBOARD')}
              className="w-full py-6 bg-emerald-600 text-slate-950 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_20px_50px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4"
            >
              Enlist as Patron <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-12">
              <h2 className="text-5xl md:text-6xl font-extrabold text-white tracking-tighter leading-tight">
                Core <span className="text-indigo-500">Advantages</span>
              </h2>
              <div className="space-y-10">
                {[
                  { title: 'Hardened Security', desc: 'Symmetric encryption and real-time behavioral monitoring guard every byte.', icon: ShieldCheck },
                  { title: 'Universal Grid', desc: 'Connect across borders with zero latency in a unified global community.', icon: Globe },
                  { title: 'Exponential Yield', desc: 'Tactical tools engineered to multiply capability and capital velocity.', icon: TrendingUp }
                ].map((feature, i) => (
                  <div key={i} className="flex gap-8 group">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 border-t-white/20 transition-all group-hover:bg-indigo-600 group-hover:shadow-[0_0_30px_rgba(79,70,229,0.4)]">
                      <feature.icon className="w-8 h-8 text-indigo-400 group-hover:text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{feature.title}</h3>
                      <p className="text-slate-400 text-base leading-relaxed font-medium max-w-[50ch]">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-20 bg-indigo-600/10 blur-[100px] rounded-full animate-pulse" />
              <div className="relative glass-card-ultra p-12 rounded-[4rem] border border-white/5">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="glass-card-ultra bg-white/5 p-8 rounded-3xl border border-white/5 text-center">
                      <Star className="w-10 h-10 text-yellow-500 mx-auto mb-6" />
                      <p className="text-4xl font-black text-white tracking-tighter uppercase">4.9</p>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-2">Tactical Alpha</p>
                    </div>
                    <div className="bg-indigo-600 p-8 rounded-3xl shadow-2xl text-center">
                      <Award className="w-10 h-10 text-white mx-auto mb-6" />
                      <p className="text-4xl font-black text-white tracking-tighter uppercase">Top 10</p>
                      <p className="text-[10px] text-indigo-200 uppercase font-black tracking-widest mt-2">Network Rank</p>
                    </div>
                  </div>
                  <div className="space-y-6 pt-12">
                    <div className="bg-emerald-600 p-8 rounded-3xl shadow-2xl text-center">
                      <TrendingUp className="w-10 h-10 text-white mx-auto mb-6" />
                      <p className="text-4xl font-black text-white tracking-tighter uppercase">200%</p>
                      <p className="text-[10px] text-emerald-200 uppercase font-black tracking-widest mt-2">Expansion</p>
                    </div>
                    <div className="glass-card-ultra bg-white/5 p-8 rounded-3xl border border-white/5 text-center">
                      <Heart className="w-10 h-10 text-rose-500 mx-auto mb-6" />
                      <p className="text-4xl font-black text-white tracking-tighter uppercase">50k+</p>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-2">Verified Nodes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Strategic Growth & Global Connection */}
      <section className="max-w-7xl mx-auto px-4 py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] -mr-64 -mt-64" />
        <div className="relative z-10 space-y-12">
          <div className="text-center space-y-4">
             <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Expansion Infrastructure</span>
             </div>
             <h2 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter">Strategic <span className="text-indigo-500">Growth Triggers</span></h2>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Reach elite communities and coordinate global discourse in real-time.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* EFADO Zoom Launchpad */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="glass-card-ultra p-12 rounded-[3.5rem] border border-white/5 relative overflow-hidden group cursor-pointer"
              onClick={() => onNavigate('ZOOM')}
            >
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-indigo-500/20 transition-all duration-700" />
               <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                  <div className="w-24 h-24 bg-indigo-600/20 rounded-[2rem] flex items-center justify-center text-indigo-400 border border-indigo-500/30 shadow-2xl relative shadow-indigo-500/20">
                     <Video className="w-10 h-10" />
                     <div className="absolute -top-2 -right-2 px-3 py-1 bg-rose-600 rounded-full text-[8px] font-black uppercase border border-rose-400/50 animate-pulse">Live</div>
                  </div>
                  <div className="flex-grow text-center md:text-left">
                     <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-2">EFADO Zoom: Live Platform</p>
                     <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Coordinate a Global Session</h3>
                     <p className="text-slate-400 text-sm font-bold uppercase tracking-widest leading-relaxed mb-8 opacity-80">
                        Launch stage-mode interactive sessions for preachers, teachers, and interviews. Reach tactical hubs instantly.
                     </p>
                     <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <button className="px-10 py-5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-500/20 flex items-center gap-3">
                           <Zap className="w-4 h-4" /> Deploy Command
                        </button>
                        <div className="flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl">
                           <Users className="w-4 h-4 text-emerald-400" />
                           <span className="text-[10px] font-black text-white uppercase tracking-widest">Active Globally</span>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>

            {/* Campaign Advertisement Center */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="glass-card-ultra p-12 rounded-[3.5rem] border border-white/5 relative overflow-hidden group cursor-pointer"
              onClick={() => onNavigate('GIST', 'ADS')}
            >
               <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-amber-500/20 transition-all duration-700" />
               <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                  <div className="w-24 h-24 bg-amber-600/20 rounded-[2rem] flex items-center justify-center text-amber-400 border border-amber-500/30 shadow-2xl relative shadow-amber-500/20">
                     <Megaphone className="w-10 h-10" />
                     <div className="absolute -top-2 -right-2 px-3 py-1 bg-indigo-600 rounded-full text-[8px] font-black uppercase border border-indigo-400/50">Grow</div>
                  </div>
                  <div className="flex-grow text-center md:text-left">
                     <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-2">Advertisement Center</p>
                     <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Advertise on EFADO</h3>
                     <p className="text-slate-400 text-sm font-bold uppercase tracking-widest leading-relaxed mb-8 opacity-80">
                        Market your brand to verified patrons across our tactical industry hubs. Deploy targeted strategic campaigns.
                     </p>
                     <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <button className="px-10 py-5 bg-amber-500 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all shadow-2xl shadow-amber-500/20 flex items-center gap-3">
                           <TrendingUp className="w-4 h-4" /> Start Campaign
                        </button>
                        <div className="flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl">
                           <Globe className="w-4 h-4 text-indigo-400" />
                           <span className="text-[10px] font-black text-white uppercase tracking-widest">Global Reach</span>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Global Affiliate & Partnership Recruitment Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 relative">
        <div className="absolute inset-0 bg-amber-500/5 blur-[120px] rounded-full" />
        <div className="glass-card-ultra rounded-[4rem] p-12 md:p-20 border border-amber-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -mr-48 -mt-48" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
              <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-amber-500/10 rounded-full border border-amber-500/20 backdrop-blur-xl">
                <UserPlus className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">Affiliate Recruitment Drive</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9]">
                Global <span className="text-amber-500 italic">Affiliate</span> Hub.
              </h2>
              <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-xl">
                We are enlisting global marketers, organizations, and internet users to hook-up, connect, and affiliate with EFADO. Earn high commissions and leverage our global reach.
              </p>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => onNavigate('PARTNER_HUB')}
                  className="px-12 py-5 bg-amber-500 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
                >
                  Join Affiliate Hub <ArrowRight className="w-5 h-5" />
                </button>
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-slate-950 overflow-hidden">
                      <img src={`https://picsum.photos/seed/partner${i}/100/100`} alt="Partner" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                  <div className="w-12 h-12 rounded-full bg-slate-900 border-4 border-slate-950 flex items-center justify-center text-[10px] font-black text-amber-500">
                    +500
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {[
                { title: 'Marketers', desc: 'High conversion tools', icon: TrendingUp },
                { title: 'Organizations', desc: 'Bulk verification & APIs', icon: Building2 },
                { title: 'Citizens', desc: 'Social earning loops', icon: Users },
                { title: 'Developers', desc: 'Secure protocol hooks', icon: Cpu }
              ].map((item, i) => (
                <div key={i} className="p-8 bg-white/5 border border-white/5 rounded-3xl group-hover:bg-white/10 transition-all hover:scale-105">
                  <item.icon className="w-8 h-8 text-amber-500 mb-4" />
                  <h4 className="text-lg font-black text-white uppercase tracking-tighter mb-1">{item.title}</h4>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="glass-card-ultra rounded-[2.5rem] md:rounded-[4rem] p-8 sm:p-16 md:p-32 text-center relative overflow-hidden transition-all duration-1000 border-t-[8px] border-t-indigo-600">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-50" />
          <div className="relative z-10 space-y-12">
            <h2 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-extrabold text-white tracking-tighter leading-[0.9]">
              Ignite <br /> <span className="text-indigo-500">The Power.</span>
            </h2>
            <p className="text-slate-400 text-xl md:text-2xl max-w-2xl mx-auto font-medium leading-relaxed">
              Manifest your presence within the global intelligence grid. Deploy capital, sync with experts, and capture opportunity.
            </p>
            <div className="flex flex-wrap justify-center gap-8">
              <button 
                onClick={() => onNavigate('DASHBOARD')}
                className="px-16 py-6 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-[0_20px_50px_rgba(255,255,255,0.2)] hover:scale-110 hover:-rotate-2 transition-all flex items-center gap-4"
              >
                Become Patron <ArrowRight className="w-6 h-6" />
              </button>
              <button 
                onClick={() => onNavigate('MARKET')}
                className="px-16 py-6 bg-white/5 text-white border border-white/10 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] hover:bg-white/10 transition-all"
              >
                Capture Alpha
              </button>
            </div>
          </div>
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 text-white/10">
             <span className="text-[10px] font-black uppercase tracking-[0.5em]">Global Connection Layer 0</span>
             <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
             <span className="text-[10px] font-black uppercase tracking-[0.5em]">Encrypted Tactical Access</span>
          </div>
        </div>
      </section>

      {/* Floating Universal Search Toggle */}
      <motion.button 
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowUniversalSearch(true)}
        className="fixed bottom-10 right-10 z-[100] w-20 h-20 bg-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-indigo-500/40 flex items-center justify-center border-4 border-white/10 group"
      >
        <Search className="w-8 h-8 group-hover:scale-125 transition-transform" />
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center border-2 border-white text-[8px] font-black italic">AI</div>
      </motion.button>

      {/* Global Footer with Contact Info */}
      <footer className="bg-slate-950 pt-32 pb-16 border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-24">
            {/* Brand Section */}
            <div className="lg:col-span-4 space-y-8">
              <div className="flex items-center gap-4">
                <EfadoLogo size="sm" />
                <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">EFADO Hubs <span className="text-indigo-500">Connect</span></h3>
              </div>
              <p className="text-slate-400 font-medium leading-relaxed max-w-sm">
                A global, all-in-one digital financial ecosystem that connects people to opportunity across the world. One world. One ecosystem. Every door. One key.
              </p>
              <div className="flex gap-4">
                {PHONE_NUMBERS.CONTACT_1 && (
                   <a href={`tel:${PHONE_NUMBERS.CONTACT_1}`} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all border border-white/10">
                      <Phone className="w-5 h-5" />
                   </a>
                )}
                <a href={`mailto:${SUPPORT_EMAILS.DEFAULT}`} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all border border-white/10">
                   <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Office Locations */}
            <div className="lg:col-span-5 space-y-8">
              <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] italic">Physical Intelligence Centers</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <div className="flex items-center gap-3 text-white">
                       <MapPin className="w-4 h-4 text-emerald-500" />
                       <span className="text-xs font-black uppercase tracking-widest">Head Office</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed tracking-wider">
                      {OFFICE_ADDRESSES.HEAD_OFFICE}
                    </p>
                 </div>
                 <div className="space-y-4">
                    <div className="flex items-center gap-3 text-white">
                       <MapPin className="w-4 h-4 text-indigo-500" />
                       <span className="text-xs font-black uppercase tracking-widest">Branch Office</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed tracking-wider">
                      {OFFICE_ADDRESSES.BRANCH_OFFICE}
                    </p>
                 </div>
              </div>
            </div>

            {/* Tactical Support Reach */}
            <div className="lg:col-span-3 space-y-8">
              <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] italic">Direct Support Matrix</h4>
              <div className="space-y-4">
                 <div className="p-4 bg-white/5 border border-white/10 rounded-2xl group hover:border-amber-500/50 transition-all">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">CEO Consultancy</p>
                    <p className="text-xs font-black text-white tracking-widest uppercase">{PHONE_NUMBERS.CONSULTANCY_CEO}</p>
                 </div>
                 <div className="p-4 bg-white/5 border border-white/10 rounded-2xl group hover:border-indigo-500/50 transition-all">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Backup Support 1</p>
                    <p className="text-xs font-black text-white tracking-widest uppercase">{PHONE_NUMBERS.CONTACT_2}</p>
                 </div>
                 <div className="p-4 bg-white/5 border border-white/10 rounded-2xl group hover:border-emerald-500/50 transition-all">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Backup Support 2</p>
                    <p className="text-xs font-black text-white tracking-widest uppercase">{PHONE_NUMBERS.CONTACT_3}</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
              &copy; {new Date().getFullYear()} EFADO TECHNOLOGY HUB. ALL RIGHTS RESERVED. SOVEREIGN ACCESS ONLY.
            </p>
            <div className="flex gap-8">
               <button onClick={() => onNavigate('GIST')} className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Privacy Policy</button>
               <button onClick={() => onNavigate('GIST')} className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Tactical Terms</button>
               <button onClick={() => onNavigate('GIST')} className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Escrow Protection</button>
            </div>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showUniversalSearch && (
          <UniversalSearch onClose={() => setShowUniversalSearch(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};
