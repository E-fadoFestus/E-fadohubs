import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Play, Info, Zap, ShieldCheck, TrendingUp, ShoppingBag, Gamepad2, Video, MonitorPlay, Activity } from 'lucide-react';

interface Slide {
  title: string;
  description: string;
  image: string;
  tag: string;
  color: string;
  action?: string;
  subview?: string;
}

interface HubHeroCarouselProps {
  hubType: 'HOME' | 'DASHBOARD' | 'GAMES' | 'MARKET' | 'GIST' | 'SERVICE_CORPS' | 'COMMUNITY_HUBS' | 'HEPIHANDS_LOAN' | 'DOMAIN_HUB' | 'QUIZ' | 'EDUCATION' | 'ZOOM' | 'TECH' | 'ADVERTISING' | 'PARTNER_HUB' | 'TECH_HUB' | 'FAIRLY_USED';
  onAction?: (view: string, subview?: string) => void;
}

const DASHBOARD_SLIDES: Slide[] = [
  { title: "Empower Your Community", description: "Join the movement changing the face of commerce, education, and finance globally.", image: "https://picsum.photos/seed/efado1/1280/720", tag: "Global Leader", color: "from-indigo-900 via-slate-900 to-purple-900", action: 'DASHBOARD' },
  { title: "Fair Markets Hub", description: "Buy smarter, sell sustainably, and keep value within your community with elite vendors.", image: "https://picsum.photos/seed/efado2/1280/720", tag: "Commerce", color: "from-emerald-900 via-slate-900 to-teal-900", action: 'MARKET' },
  { title: "Elite Games Arena", description: "Win big, learn fast, and dominate our provably fair gaming environments.", image: "https://picsum.photos/seed/efado3/1280/720", tag: "Gaming Hub", color: "from-orange-800 via-slate-900 to-red-900", action: 'GAMES' },
  { title: "Universal Educational Hub", description: "From Primary school to PhD levels, access resources that empower your growth.", image: "https://picsum.photos/seed/edu1/1280/720", tag: "Academia", color: "from-indigo-900 via-slate-900 to-slate-950", action: 'EDUCATION' },
  { title: "EFADO Zoom Live", description: "The ultimate interactive outreach for preachers, teachers, and elite broadcasters.", image: "https://picsum.photos/seed/zoom1/1280/720", tag: "Live Platform", color: "from-indigo-600 via-slate-900 to-indigo-900", action: 'ZOOM' },
  { title: "HEPIHANDS Loan Hub", description: "Transparent, fast, and community-backed credit to fuel your next venture.", image: "https://picsum.photos/seed/efado4/1280/720", tag: "Finance", color: "from-emerald-600 via-slate-900 to-green-900", action: 'HEPIHANDS_LOAN' },
  { title: "EFADO Service Corps", description: "Direct access to top-tier technical consultancy and construction professionals.", image: "https://picsum.photos/seed/efado6/1280/720", tag: "Services", color: "from-slate-700 via-slate-900 to-slate-950", action: 'SERVICE_CORPS' },
  { title: "Global Community Hubs", description: "Synchronize your savings and growth with community-first financial cycles.", image: "https://picsum.photos/seed/efado7/1280/720", tag: "Community", color: "from-purple-900 via-slate-900 to-pink-900", action: 'COMMUNITY_HUBS' },
  { title: "Domain & Tech Hub", description: "Register global domains and manage your digital identity with military security.", image: "https://picsum.photos/seed/efado9/1280/720", tag: "Digital Assets", color: "from-blue-900 via-slate-900 to-indigo-950", action: 'DOMAIN_HUB' },
  { title: "EFADO Gist Hub", description: "Stay informed with the latest tech trends, career tips, and community gossip.", image: "https://picsum.photos/seed/efado10/1280/720", tag: "Community Feed", color: "from-cyan-900 via-slate-900 to-blue-950", action: 'GIST' },
  { title: "Advertisement Center", description: "Reach thousands of verified patrons globally with tactical brand placement.", image: "https://picsum.photos/seed/efado8/1280/720", tag: "Marketing", action: 'GIST', subview: 'ADS', color: "from-indigo-800 via-slate-900 to-purple-950" },
  { title: "Raffle Arena", description: "Commit, reveal, and win in our high-stakes transparency-backed raffle draws.", image: "https://picsum.photos/seed/game14/1280/720", tag: "Jackpot", action: 'GAMES', color: "from-orange-700 via-slate-900 to-rose-900" },
  { title: "Digital Money Trading", description: "Master the charts and multiply your wealth with real-time market logic.", image: "https://picsum.photos/seed/game5/1280/720", tag: "Strategy", action: 'GAMES', color: "from-emerald-800 via-slate-900 to-teal-950" },
  { title: "Fairly Used Market", description: "Premium pre-owned goods at unbeatable community prices.", image: "https://picsum.photos/seed/market6/1280/720", tag: "Savings", action: 'MARKET', color: "from-slate-800 via-slate-900 to-slate-950" },
  { title: "Modern Tech Hub", description: "The latest gadgets and electronics directly from the core vendor network.", image: "https://picsum.photos/seed/market3/1280/720", tag: "Innovation", action: 'MARKET', color: "from-blue-600 via-slate-900 to-indigo-900" },
  { title: "Universal User Guide", description: "Master the EFADO ecosystem with our comprehensive operational manual and strategic guides.", image: "https://picsum.photos/seed/guide1/1280/720", tag: "System Guide", color: "from-indigo-600 to-slate-900", action: 'USER_GUIDE' },
  { title: "Founder's Vision Portal", description: "Direct oversight and updates from EFADO leadership ensuring total fairness.", image: "https://picsum.photos/seed/efado16/1280/720", tag: "Executive", color: "from-slate-900 via-slate-900 to-black", action: 'HOME' },
  { title: "Secure Wallet Ecosystem", description: "Isolated, multi-token wallets protecting your digital wealth 24/7.", image: "https://picsum.photos/seed/efado9/1280/720", tag: "Security", color: "from-slate-950 via-indigo-950 to-black", action: 'DASHBOARD' },
  { title: "Joint Venture Growth", description: "Pool resources with elite community partners for massive returns.", image: "https://picsum.photos/seed/efado17/1280/720", tag: "Venture", color: "from-indigo-950 via-slate-900 to-purple-950", action: 'COMMUNITY_HUBS' },
  { title: "Infinite Interactive Feed", description: "Real-time updates, voice notes, and video discourse across all hubs.", image: "https://picsum.photos/seed/zoom2/1280/720", tag: "Interactive", color: "from-blue-900 via-slate-900 to-indigo-950", action: 'ZOOM' },
  { title: "The Future of Hubs", description: "Sign up today and experience the synchronised ecosystem of tomorrow.", image: "https://picsum.photos/seed/efado20/1280/720", tag: "Coming Soon", color: "from-slate-900 via-slate-900 to-indigo-900", action: 'HOME' },
  { 
    title: "EFADO Connects Your World", 
    description: "In a divided world, EFADO is the North Star Hubs where talent finds a stage and innovation has no limits.", 
    image: "https://picsum.photos/seed/efado21/1280/720", 
    tag: "Vision", 
    color: "from-indigo-600 via-slate-900 to-purple-900", 
    action: 'HOME' 
  },
];

const EDUCATION_SLIDES: Slide[] = [
  { title: "Universal Academic Hub", description: "Access world-class resources from Primary school to PhD levels.", image: "https://picsum.photos/seed/edu1/1280/720", tag: "Universal", color: "from-indigo-800 to-slate-900", action: 'EDUCATION' },
  { title: "JAMB & Admission Guide", description: "Navigate your academic future with our comprehensive admission tracking tools.", image: "https://picsum.photos/seed/edu2/1280/720", tag: "Admissions", color: "from-blue-700 to-indigo-900", action: 'EDUCATION' },
  { title: "Postgraduate Research", description: "Advanced tools for MSc, MBA, and PhD candidates worldwide.", image: "https://picsum.photos/seed/edu3/1280/720", tag: "Research", color: "from-slate-700 to-indigo-950", action: 'EDUCATION' },
  { title: "Scholarship Intelligence", description: "Unlock funding opportunities and global academic grants.", image: "https://picsum.photos/seed/edu4/1280/720", tag: "Scholarships", color: "from-emerald-700 to-teal-900", action: 'EDUCATION' },
];

const ZOOM_SLIDES: Slide[] = [
  { title: "Stage-Mode Outreach", description: "Coordinate global sessions with high-reach tactical stage infrastructure.", image: "https://picsum.photos/seed/zoom1/1280/720", tag: "Live", color: "from-indigo-900 to-blue-900", action: 'ZOOM' },
  { title: "Strategic Discourse", description: "Reach elite communities through interactive video and voice notes.", image: "https://picsum.photos/seed/zoom2/1280/720", tag: "Interactivity", color: "from-slate-900 to-indigo-950", action: 'ZOOM' },
  { title: "Expert Interviews", description: "Deploy professional interview environments with real-time participation.", image: "https://picsum.photos/seed/zoom3/1280/720", tag: "Professional", color: "from-blue-800 to-slate-900", action: 'ZOOM' },
];

const GAMES_SLIDES: Slide[] = [
  { title: "Elite Spin Arena", description: "The ultimate high-stakes wheel of fortune.", image: "https://picsum.photos/seed/game1/1280/720", tag: "Spin", color: "from-indigo-600 to-purple-700", action: 'GAMES' },
  { title: "Win Up to 100x", description: "Multiply your stake with our elite multiplier tiers.", image: "https://picsum.photos/seed/game2/1280/720", tag: "Jackpot", color: "from-yellow-600 to-orange-700", action: 'GAMES' },
  { title: "Provably Fair Logic", description: "Our algorithms ensure every spin is 100% random and fair.", image: "https://picsum.photos/seed/game3/1280/720", tag: "Fairness", color: "from-blue-600 to-cyan-700", action: 'GAMES' },
  { title: "High-Stakes Thrills", description: "Feel the rush of the arena with every bet you place.", image: "https://picsum.photos/seed/game4/1280/720", tag: "Adrenaline", color: "from-red-600 to-pink-700", action: 'GAMES' },
  { title: "Master EFADO DMT", description: "Digital Money Trading for the modern strategist.", image: "https://picsum.photos/seed/game5/1280/720", tag: "Trading", color: "from-slate-700 to-slate-900", action: 'GAMES' },
  { title: "Real-time Market Trends", description: "Watch the charts and predict the next big move.", image: "https://picsum.photos/seed/game6/1280/720", tag: "Analysis", color: "from-blue-500 to-indigo-600", action: 'GAMES' },
  { title: "Predict and Profit", description: "Your intuition is your greatest asset in the DMT arena.", image: "https://picsum.photos/seed/game7/1280/720", tag: "Strategy", color: "from-emerald-600 to-teal-700", action: 'GAMES' },
  { title: "Fast-Paced Action", description: "Quick rounds and instant results for the busy trader.", image: "https://picsum.photos/seed/game8/1280/720", tag: "Speed", color: "from-orange-600 to-red-600", action: 'GAMES' },
  { title: "EFADO Money Card", description: "The classic card shuffling game reimagined.", image: "https://picsum.photos/seed/game9/1280/720", tag: "Cards", color: "from-red-700 to-orange-800", action: 'GAMES' },
  { title: "Find the Big Win", description: "Keep your eyes on the cards and pick the winner.", image: "https://picsum.photos/seed/game10/1280/720", tag: "Luck", color: "from-yellow-500 to-yellow-700", action: 'GAMES' },
  { title: "Test Your Intuition", description: "Can you beat the shuffle? Prove your skills today.", image: "https://picsum.photos/seed/game11/1280/720", tag: "Skill", color: "from-purple-600 to-indigo-700", action: 'GAMES' },
  { title: "Instant Game Payouts", description: "Winnings are credited to your wallet immediately.", image: "https://picsum.photos/seed/game12/1280/720", tag: "Instant", color: "from-green-600 to-emerald-700", action: 'GAMES' },
  { title: "Global Leaderboards", description: "Compete with players worldwide for the top spot.", image: "https://picsum.photos/seed/game13/1280/720", tag: "Competition", color: "from-blue-600 to-blue-800", action: 'GAMES' },
  { title: "Daily Bonus Rewards", description: "Log in every day for free credits and bonuses.", image: "https://picsum.photos/seed/game14/1280/720", tag: "Bonuses", color: "from-pink-600 to-rose-700", action: 'GAMES' },
  { title: "Secure Game Wallets", description: "Your gaming funds are isolated and protected.", image: "https://picsum.photos/seed/game15/1280/720", tag: "Secure", color: "from-slate-800 to-black", action: 'GAMES' },
  { title: "Immersive Audio", description: "Professional narration and sound effects for every game.", image: "https://picsum.photos/seed/game16/1280/720", tag: "Audio", color: "from-indigo-500 to-purple-500", action: 'GAMES' },
  { title: "Champion Sprays", description: "Celebrate your big wins with epic visual effects.", image: "https://picsum.photos/seed/game17/1280/720", tag: "Celebration", color: "from-yellow-400 to-orange-500", action: 'GAMES' },
  { title: "Professional Narration", description: "Hear the excitement with our live game announcers.", image: "https://picsum.photos/seed/game18/1280/720", tag: "Voice", color: "from-blue-400 to-cyan-500", action: 'GAMES' },
  { title: "Weighted Edge System", description: "A balanced system that ensures long-term sustainability.", image: "https://picsum.photos/seed/game19/1280/720", tag: "System", color: "from-slate-600 to-slate-800", action: 'GAMES' },
  { title: "Become a Legend", description: "Start your winning streak in the EFADO Game Hub.", image: "https://picsum.photos/seed/game20/1280/720", tag: "Legacy", color: "from-indigo-600 to-purple-600", action: 'GAMES' },
];

const MARKET_SLIDES: Slide[] = [
  { title: "Modern Market Hub", description: "The ultimate destination for new and pre-owned goods.", image: "https://picsum.photos/seed/market1/1280/720", tag: "Market", color: "from-emerald-600 to-teal-700", action: 'MARKET' },
  { title: "Thousands of Products", description: "Explore a massive taxonomy across all categories.", image: "https://picsum.photos/seed/market2/1280/720", tag: "Variety", color: "from-blue-600 to-indigo-700", action: 'MARKET' },
  { title: "Electronics & Gadgets", description: "The latest smartphones, laptops, and smart home tech.", image: "https://picsum.photos/seed/market3/1280/720", tag: "Tech", color: "from-slate-700 to-slate-900", action: 'MARKET' },
  { title: "Fashion for Everyone", description: "Trendy clothing and accessories for men and women.", image: "https://picsum.photos/seed/market4/1280/720", tag: "Fashion", color: "from-pink-600 to-rose-700", action: 'MARKET' },
  { title: "Home & Kitchen", description: "Upgrade your living space with modern appliances.", image: "https://picsum.photos/seed/market5/1280/720", tag: "Home", color: "from-orange-600 to-red-700", action: 'MARKET' },
  { title: "Fairly Used Deals", description: "Quality pre-owned items at a fraction of the cost.", image: "https://picsum.photos/seed/market6/1280/720", tag: "Deals", color: "from-purple-600 to-indigo-700", action: 'MARKET' },
  { title: "Connect with Vendors", description: "Direct communication between buyers and sellers.", image: "https://picsum.photos/seed/market7/1280/720", tag: "Connect", color: "from-cyan-600 to-blue-700", action: 'MARKET' },
  { title: "Sell Your Products", description: "Turn your unused items into cash today.", image: "https://picsum.photos/seed/market8/1280/720", tag: "Sell", color: "from-emerald-500 to-green-600", action: 'MARKET' },
  { title: "Easy Registration", description: "Become a verified vendor in just a few steps.", image: "https://picsum.photos/seed/market9/1280/720", tag: "Vendor", color: "from-indigo-600 to-purple-600", action: 'MARKET' },
  { title: "Global Categories", description: "Browse international brands and local favorites.", image: "https://picsum.photos/seed/market10/1280/720", tag: "Global", color: "from-blue-500 to-cyan-500", action: 'MARKET' },
  { title: "Secure Payments", description: "Your transactions are protected by EFADO escrow.", image: "https://picsum.photos/seed/market11/1280/720", tag: "Secure", color: "from-slate-800 to-black", action: 'MARKET' },
  { title: "Verified Conditions", description: "Every item is graded for transparency and trust.", image: "https://picsum.photos/seed/market12/1280/720", tag: "Quality", color: "from-emerald-400 to-teal-500", action: 'MARKET' },
  { title: "Detailed Descriptions", description: "Know exactly what you're buying with full specs.", image: "https://picsum.photos/seed/market13/1280/720", tag: "Info", color: "from-indigo-500 to-blue-500", action: 'MARKET' },
  { title: "High-Res Photos", description: "See every detail with our multi-photo listings.", image: "https://picsum.photos/seed/market14/1280/720", tag: "Visual", color: "from-purple-500 to-pink-500", action: 'MARKET' },
  { title: "Responsive Support", description: "Our market moderators are here to help you.", image: "https://picsum.photos/seed/market15/1280/720", tag: "Support", color: "from-blue-400 to-indigo-500", action: 'MARKET' },
  { title: "Join the Community", description: "Be part of the fastest growing digital market.", image: "https://picsum.photos/seed/market16/1280/720", tag: "Community", color: "from-emerald-600 to-green-700", action: 'MARKET' },
  { title: "Modern Furniture", description: "Stylish pieces for your office and home.", image: "https://picsum.photos/seed/market17/1280/720", tag: "Style", color: "from-orange-500 to-yellow-600", action: 'MARKET' },
  { title: "Sports & Fitness", description: "Get active with our wide range of gym gear.", image: "https://picsum.photos/seed/market18/1280/720", tag: "Fitness", color: "from-red-500 to-orange-600", action: 'MARKET' },
  { title: "Musical Instruments", description: "From guitars to keyboards, find your sound.", image: "https://picsum.photos/seed/market19/1280/720", tag: "Music", color: "from-indigo-700 to-purple-800", action: 'MARKET' },
  { title: "Start Shopping", description: "Your next great find is just a click away.", image: "https://picsum.photos/seed/market20/1280/720", tag: "Shop Now", color: "from-emerald-600 to-teal-600", action: 'MARKET' },
];

export const HubHeroCarousel: React.FC<HubHeroCarouselProps> = ({ hubType, onAction }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const slides = React.useMemo(() => {
    switch (hubType) {
      case 'GAMES': 
      case 'QUIZ': return GAMES_SLIDES;
      case 'MARKET': return MARKET_SLIDES;
      case 'EDUCATION': return EDUCATION_SLIDES;
      case 'ZOOM': return ZOOM_SLIDES;
      case 'HOME':
      case 'DASHBOARD':
      default: return DASHBOARD_SLIDES;
    }
  }, [hubType]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  const nextSlide = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative w-full h-[600px] rounded-b-[4rem] md:rounded-[3.5rem] overflow-hidden shadow-2xl mb-12 group border-4 border-white/5">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {/* Background Image with Cinematic Ken Burns Effect - Optimized */}
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: 1.08 }}
            transition={{ duration: 15, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
            className="absolute inset-0"
            style={{ willChange: 'transform' }}
          >
            <img
              src={slides[currentIndex].image}
              alt={slides[currentIndex].title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>

          {/* Cinematic Overlays */}
          <div className={`absolute inset-0 bg-gradient-to-r ${slides[currentIndex].color} opacity-70 mix-blend-multiply`} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-90" />
          
          {/* Live Indicator Overlay (Advert Mode) */}
          <div className="absolute top-10 left-12 z-20 flex items-center gap-4">
             <div className="px-4 py-2 bg-rose-600 text-white rounded-full flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest mt-0.5">Live Broadcast</span>
             </div>
             <div className="flex items-center gap-2 text-white/60">
                <Activity className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Feed Active</span>
             </div>
          </div>

          <div className="absolute inset-0 flex flex-col justify-end pb-24 px-12 md:px-24">
            <div className="max-w-4xl">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-4 mb-8"
              >
                <div className="px-5 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl">
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">
                    {slides[currentIndex].tag}
                  </span>
                </div>
                <div className="h-px w-24 bg-gradient-to-r from-white/40 to-transparent" />
                <MonitorPlay className="w-5 h-5 text-white/60" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                className="text-4xl sm:text-6xl md:text-8xl font-display font-black text-white uppercase tracking-tighter mb-8 leading-[0.85] drop-shadow-2xl"
              >
                {slides[currentIndex].title.split(" ").map((word, i) => (
                  <span key={i} className={i % 2 === 1 ? 'text-indigo-400' : ''}>{word} </span>
                ))}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-xl md:text-2xl text-slate-300 font-medium max-w-2xl mb-12 leading-relaxed drop-shadow-lg"
              >
                {slides[currentIndex].description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-wrap items-center gap-6"
              >
                <button 
                  onClick={() => onAction && onAction(slides[currentIndex].action || 'DASHBOARD', slides[currentIndex].subview)}
                  className="px-12 py-6 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs shadow-[0_20px_50px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
                >
                  <Play className="w-5 h-5 fill-current" /> Enter Arena
                </button>
                <button className="px-12 py-6 bg-white/10 backdrop-blur-2xl text-white border border-white/20 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/20 transition-all flex items-center gap-4 group">
                  <Video className="w-5 h-5 text-indigo-400 group-hover:text-white transition-colors" /> View Intel
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Modern Navigation Controls */}
      <div className="absolute inset-y-0 left-0 w-32 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={prevSlide}
          className="p-6 bg-black/20 backdrop-blur-2xl border border-white/10 rounded-full text-white hover:bg-white/20 transition-all"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      </div>
      <div className="absolute inset-y-0 right-0 w-32 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={nextSlide}
          className="p-6 bg-black/20 backdrop-blur-2xl border border-white/10 rounded-full text-white hover:bg-white/20 transition-all"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      {/* Cinematic Slide Indicators */}
      <div className="absolute bottom-12 right-24 flex items-center gap-4">
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setIsAutoPlaying(false);
                setCurrentIndex(i);
              }}
              className="group relative px-1 py-4"
            >
              <div className={`h-1 transition-all rounded-full ${
                currentIndex === i ? 'w-12 bg-indigo-500' : 'w-4 bg-white/20 group-hover:bg-white/40'
              }`} />
            </button>
          ))}
        </div>
        <div className="h-px w-12 bg-white/20 mx-4" />
        <span className="text-white/60 font-mono text-sm tracking-widest">
          {String(currentIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
        </span>
      </div>

      {/* Floating Status Widgets */}
      <div className="absolute top-10 right-12 flex items-center gap-4 pointer-events-none">
        <div className="glass-card p-4 rounded-2xl flex flex-col items-end">
           <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Ecosystem Status</span>
           <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white">SYNC ACTIVE</span>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
           </div>
        </div>
      </div>
    </div>
  );
};
