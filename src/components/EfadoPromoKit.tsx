import React, { useState } from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'motion/react';
import { 
  Megaphone, 
  Video, 
  Sparkles, 
  Copy, 
  Check, 
  Globe, 
  Download, 
  Play, 
  Pause,
  MessageSquare, 
  FileText, 
  Volume2, 
  Smartphone, 
  Share2, 
  ArrowRight, 
  RefreshCw,
  Mail,
  Zap,
  Tv,
  Eye,
  Settings,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { UserProfile } from '../types';

interface EfadoPromoKitProps {
  user: UserProfile;
  onClose: () => void;
}

// Visual Storyboard Cards for a 30s TikTok/Reels / Shorts Script
const THIRTY_SECOND_STORYBOARD = [
  {
    seconds: "0:00 - 0:05",
    visuals: "A dynamic 3D spinning phone transition with neon green and royal gold lights projecting the bold logo of EFADO HUBS CONNECT. The screen pulses as if communicating with the global network.",
    audio: "💥 Dramatic synth transition sound. Upbeat, high-tempo afrobeat-electronic hybrid background music kicks in instantly.",
    voiceover: "Tired of jumping between 50 different apps just to save, trade, mine, shop, and zoom? Welcome to the future of the digital world!",
    directorNote: "Hold the camera close. Rapid text animations flashing: 'GLOBAL SECURED', 'INSTANT CASH-OUT', 'ALL-IN-ONE'."
  },
  {
    seconds: "0:05 - 0:15",
    visuals: "Screen splits into sharp bento segments showing: 1. Live mining cycle going on, 2. Interactive Lucky Spin wheel rotating, 3. Clean local trade offer being listed, 4. Instant peer-to-peer loan form approving under 3 seconds.",
    audio: "🎵 Rising energetic electronic beat. Sound fx: Coin sounds on spin, soft chime on loan approval.",
    voiceover: "EFADO Hubs Connect synchronizes the globe on one elite network. Mine sovereign assets, secure fast financial credits, and join rotating CSCC savings groups instantly!",
    directorNote: "Use fast cuts, keeping high visual contrast and extreme brightness on the active features."
  },
  {
    seconds: "0:15 - 0:25",
    visuals: "A human user interface illustrating an instant local bank payout receipt generating. Visual graphics highlight a globe with bright nodes linking South America, West Africa, and East Asia, confirming zero limits.",
    audio: "⚡ Low frequency rumble, transition to high-clarity synthesizer music. SFX: Phone chime.",
    voiceover: "Zero boundaries. Native regional currencies and secure escrow protocols protect your trades and earnings globally. It's safe, fast, and unified.",
    directorNote: "Highlight the ease of cashing out. Show the 'EFADO Easy Payment' card lighting up."
  },
  {
    seconds: "0:25 - 0:30",
    visuals: "A bold golden button with animated glow saying 'ESTABLISH CONNECTION'. The primary browser URL 'e-fado.com' zooms in. The tagline 'ALL-IN-ONE DIGITAL ECOSYSTEM' pulses with energy.",
    audio: "🥁 Epic double drum hit & music fades to a sharp harmonic tone.",
    voiceover: "Establish your connection right now. Visit e-fado.com and claim your digital domain today!",
    directorNote: "Display the website address on-screen in bold, ultra-stylized letters."
  }
];

// Visual Storyboard Cards for a 60s Explainer Video Script
const SIXTY_SECOND_STORYBOARD = [
  {
    seconds: "0:00 - 0:12",
    visuals: "Close-up of a person sighing in frustration, looking at a cluttered phone filled with separate financial apps, chatting apps, and online shopping apps. A dark, moody atmosphere shifts suddenly into a brilliant golden explosion of light as EFADO HUBS CONNECT launches.",
    audio: "🌀 Low atmospheric wind, shifting into a powerful celestial chime. High-clarity orchestral-tech soundtrack begins.",
    voiceover: "Why is our digital life so fragmented? We use one app to save, another to chat, a different one to check market items, and yet another to host video calls. It drains your time, leaks your security, and costs too much. Not anymore.",
    directorNote: "Contrast the chaotic, dark screen flow at the beginning with the serene and structured visual of EFADO."
  },
  {
    seconds: "0:12 - 0:28",
    visuals: "The camera zooms into the EFADO Dashboard showing the Hub list: Gist Hub, modern marketplace, and active collaborative saving cycles. Visually render the CEO dashboard showcasing 190+ jurisdictions trading globally.",
    audio: "🎵 Upbeat, inspiring cinematic background music swells.",
    voiceover: "Meet EFADO Hubs Connect—the premier global ecosystem linking your personal identity to advanced trade, finance, education, and social connectivity simultaneously on one premium interface.",
    directorNote: "Hover over the key features interactively. Show professional service lists and domain registrations."
  },
  {
    seconds: "0:28 - 0:45",
    visuals: "A fast montage of: 1. A registered vendor listing a product on the Modern Market with immediate global views, 2. A participant entering a collaborative saving pool and getting a payout, 3. Instant cryptocurrency OTC conversions.",
    audio: "💥 Energetic rhythm transition. Crisp digital click sound effects.",
    voiceover: "Whether you're a farmer seeking urban buyers, a talent wanting global stage exposure, a host scheduling high-security virtual meetings, or an investor seeking zero-risk gaming, EFADO synchronizes it all securely.",
    directorNote: "Stagger the visual modules as cards entering the screen with soft slide-in animations."
  },
  {
    seconds: "0:45 - 0:55",
    visuals: "A hand holding a mobile phone illustrating a flawless, secure transaction, with an EFADO security guard emblem sliding over the balance. Instant notification of a successful domestic pay out.",
    audio: "🛡️ Deep reassuring sonic boom. Sound of a successful cash notification.",
    voiceover: "Protected by elite tactical escrow systems, your capital remains fully shielded while rotating. EFADO simplifies global commerce, turning every connection into real wealth.",
    directorNote: "Show a clear, high-contrast shield graphic. Emphasize trust and speed."
  },
  {
    seconds: "0:55 - 1:00",
    visuals: "The absolute clean, polished EFADO logo fades in alongside a rotating 3D globe. The URL 'e-fado.com' shines at the bottom center. A clear call to action card with interactive buttons.",
    audio: "🎆 Beautiful cymbal roll and epic final tone. Background music resolves to a quiet pulsing beat.",
    voiceover: "Your digital empire starts here. Join EFADO Hubs Connect today at e-fado.com. Your world, synchronized.",
    directorNote: "The final view must feel professional, clean, highly-polished, and unforgettable."
  }
];

export const EfadoPromoKit: React.FC<EfadoPromoKitProps> = ({ user, onClose }) => {
  // Input customizations that dynamically hydrate the scripts!
  const [tagline, setTagline] = useState('EFADO HUBS CONNECT');
  const [targetLocation, setTargetLocation] = useState('Global (190+ Countries)');
  const [customCTA, setCustomCTA] = useState('Build your digital empire at e-fado.com');
  const [phoneNumber, setPhoneNumber] = useState('+234 or your local office');
  
  // Script Type state
  const [scriptView, setScriptView] = useState<'VIRAL' | 'EXPLAINER' | 'SOCIAL' | 'EMAIL' | 'PITCH'>('VIRAL');
  const [pitchSlideIdx, setPitchSlideIdx] = useState(0);
  
  // Interactive Storyboard step tracking
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);
  const [storyboardPlaying, setStoryboardPlaying] = useState(false);
  const [activeStoryboardType, setActiveStoryboardType] = useState<'30S' | '60S'>('30S');

  // Clipboard copies
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const activeStoryboardList = activeStoryboardType === '30S' ? THIRTY_SECOND_STORYBOARD : SIXTY_SECOND_STORYBOARD;

  // Handle Play/Pause of Storyboard
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (storyboardPlaying) {
      interval = setInterval(() => {
        setActiveStoryIdx((prev) => {
          if (prev >= activeStoryboardList.length - 1) {
            setStoryboardPlaying(false);
            return 0; // Reset
          }
          return prev + 1;
        });
      }, 7000); // 7 seconds per slide
    }
    return () => clearInterval(interval);
  }, [storyboardPlaying, activeStoryboardList.length]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 3000);
  };

  const handleDownloadText = (name: string, content: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = `${name.toLowerCase().replace(/\s+/g, '_')}_script_export.txt`;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
  };

  // Hydration helper
  const getHydratedScripts = () => {
    const taglineUpper = tagline.toUpperCase();
    
    const viral = `🎬 TITLE: "THE GLOBAL DECENTRALIZED SYNC" (30 Seconds TikTok/Reels / Shorts)
========================================================================
[🎯 TARGET REGIONS]: ${targetLocation}
[💡 MAIN BRAND/TAGLINE]: ${tagline}
[🚀 CALL TO ACTION]: ${customCTA}
========================================================================

0:00 - 0:05 [SCENE 1 - THE INTRUSION HOOK]
🎥 VISUAL: A sleek 3D phone transition spinning rapidly amidst neon blue and hot gold light arrays. The screen of the phone pulses showing a secure connected hub.
🎵 AUDIO: Dramatic tech riser sound. Instantly kicks in an upbeat, high-tempo African-Acoustic Afrobeat x Electro-Trap background rhythm.
🎙️ VOICEOVER: "Still hopping between 50 different apps to chat, save money, sell items, make video calls, or trade assets? That belongs in the past!"

0:05 - 0:15 [SCENE 2 - THE DESTRUCTIVE SOLUTION]
🎥 VISUAL: Dynamic split screen displaying: 1. Live mining cycle ticking up, 2. Interactive Lucky Spin wheel turning, 3. Fast vendor listing items on a clean local marketplace, 4. Immediate peer-to-peer rotational savings system.
🎵 AUDIO: Rising, highly energetic rhythm. Visual chime and soft coin-dropping sounds on spin.
🎙️ VOICEOVER: "Welcome to ${taglineUpper}! The all-in-one digital ecosystem that links your personal identity to advanced trade, finance, education, and global connectivity simultaneously!"

0:15 - 0:25 [SCENE 3 - THE SECURITY RUMBLE]
🎥 VISUAL: A simple visual mockup highlighting an instant mobile bank transfer receipt populating. Moving coordinates light up high-contrast nodes connecting global hubs from regional capitals.
🎵 AUDIO: Deep harmonic sub-bass. Sharp chime on successful payout execution.
🎙️ VOICEOVER: "Completely borderless. Guided by elite tactical escrows and supporting your native currency, your funds and transactions are completely protected at zero risk."

0:25 - 0:30 [SCENE 4 - THE GLOBAL PIVOT]
🎥 VISUAL: Golden glowing button entering the screen 'ESTABLISH CONNECTION'. Web URL 'e-fado.com' enlarges with magnificent typography alongside the official logo.
🎵 AUDIO: Epic drum crescendo and final harmonic resolution.
🎙️ VOICEOVER: "Establish your connection right now! Visit e-fado.com and claim your digital domain globally!"
📢 [CTA BANNER ON-SCREEN]: ${customCTA} (Contact: ${phoneNumber})`;

    const explainer = `🎬 TITLE: "THE SYNCED EMPIRE EXPLAINER" (60 Seconds YouTube/Facebook/Insta Video)
========================================================================
[🎯 TARGET REGIONS]: ${targetLocation}
[💡 MAIN BRAND/TAGLINE]: ${tagline}
[🚀 CALL TO ACTION]: ${customCTA}
========================================================================

0:00 - 0:12 [SCENE 1 - FRAGMENTATION PROBLEM]
🎥 VISUAL: Screen begins dark and moody. A person is struggling, rubbing their forehead, flipping frustratingly between banking apps, messenger groups, e-commerce stores, and online forums on their mobile phone.
🎵 AUDIO: Distant low synth rumble and clocks ticking. Shifts suddenly into an epic golden celestial sound. Sound of high-end business electronic background music commencing.
🎙️ VOICEOVER: "Why is our modern digital life so divided? We use one software for business chats, a separate app for group savings, a chaotic marketplace for sales, and entirely different avenues for utility payments. It's draining, fragmented, and insecure. There is a better way."

0:12 - 0:28 [SCENE 2 - PROTOCOL REVELATION]
🎥 VISUAL: Brilliant golden streaks of light clean the environment into a gorgeous, sleek nocturnal dashboard representing EFADO HUBS CONNECT. Standard hubs rotate in a 3D cycle.
🎵 AUDIO: Cinematic uplifting music picks up. Sub-bass rises with premium tech vibes.
🎙️ VOICEOVER: "Enter ${taglineUpper}—the premier global ecosystem designed to synchronize your entire online world on a single, clean, hyper-secure interface. Built for high-velocity trade and absolute personal independence."

0:28 - 0:45 [SCENE 3 - THE HUBS DE-CLASSIFICATION]
🎥 VISUAL: The cursor hovers over standard portals: Gist Hub, Modern Market, Community Hub savings cycles, Airtime/Data Vending, Chinese Factory Sourcing pipelines, and the Gaming Arena.
🎵 AUDIO: Uptempo rhythmic drums. Sound fx: Virtual coin clinking, digital typing.
🎙️ VOICEOVER: "Whether you're an artisan selling unique crafts, a farmer shipping bulk livestock, groups managing rotating saving circles, a professional deploying engineering services, or simply scaling web games, EFADO synchronizes high-intent target hubs automatically."

0:45 - 0:55 [SCENE 4 - CAPITAL SECURITY]
🎥 VISUAL: An absolute secure shield icon descends on a transactions panel. A phone vibrates showing a native payout balance confirmation with zero boundaries across regions.
🎵 AUDIO: A heavy base security chime. Reassuring digital tone.
🎙️ VOICEOVER: "No international limits. All trades are backed by professional escrow protocols. Cash out in native funds instantly with next-generation peer-to-peer settlement networks."

0:55 - 1:00 [SCENE 5 - THE ULTIMATE CTA]
🎥 VISUAL: Clean modern EFADO logo floats elegantly. The display text 'e-fado.com' lights up the screen with premium gold and silver details.
🎵 AUDIO: Grand orchestral finale, resolving to a subtle, peaceful electronic background beat.
🎙️ VOICEOVER: "Your digital empire starts here. Join ${taglineUpper} at e-fado.com today. Your life, fully synchronized."
📢 [TEXT OVERLAY]: ${customCTA} (Connect: ${phoneNumber})`;

    const social = `🚀 GLOBAL BROADCAST PROTOCOL: THE EFADO HUBS REVELATION (Ad Copy for WhatsApp, Telegram, X, and Facebook Groups)

💎 *Attention Global Innovators, Merchants, and Operators!* 💎

Are you tired of managing your daily life across dozens of fragmented, slow, and insecure apps? 

The era of digital division is officially OVER. Welcome to *${taglineUpper}*—the ultimate synchronized ecosystem built specifically to empower your financial, collaborative, and social digital presence.

✨ *Explore what you can do on EFADO under a single, highly polished dashboard:*
• 🎮 *Elite Gaming Arena:* Stake in Lucky Spin, Digital Money Trading, and Money Card with real-time risk mitigation and instant withdrawals.
• 🌾 *Agri-Sovereign Hub:* Connects farmers and rural ag-hubs directly with high-frequency urban consumers with zero middleman markups.
• 💵 *Unity Hubs (CSCC):* Organize digital cooperative saving networks with automated rotating contribution logs.
• 📦 *China-Factory Sourcing:* Instant factory pipeline from China. Sea/air freight coordination in one tap.
• 📱 *Airtime & Utilities:* Instant cell top-ups globally across 120+ countries with smart payment gateways.
• ⚡ *Service Corps:* Source top electrical, building, structural, and corporate consultants near you.
• 💰 *HepiHands Credit Line:* Rapid access to fair, transparent small business loans for vetted ecosystem participants.

🔒 *Why millions trust EFADO:*
1. **Ultimate Trust Escrow:** All buy-sell transactions are strictly monitored by next-generation smart escrow protocols.
2. **Instant Local Settlement:** Deposit and withdraw funds in your native local fiat currency or secure international channels instantly.
3. **Optimized Multi-Device Core:** Fast loading times even in low network bandwidth areas.

🌐 *Stop juggling, start synchronizing! Join our global network today:*
👉 **Establish Connection:** e-fado.com

🎯 *Regions:* ${targetLocation}
📩 *E-fado Support:* efado226@gmail.com
📞 *Global Channel:* ${phoneNumber}

*#EFADOHubs #FinancialSovereignty #AllInOneEcosystem #SovereignHubs #DecentralizedSync*`;

    const email = `Subject: Synchronize Your Empire: Meet ${tagline} (Global Launch)

Dear Partner,

In today's digital economy, productivity and growth are choked by fragmentation. Businesses, traders, and community circles are forced to manage digital files, group savings, local listing sales, and utility billing across entirely disconnected platforms. 

This leads to leaked security, massive fees, wasted time, and endless frustration.

Today, we officially announce ${tagline}—the world's first unified, decentralized tactical connection hub. EFADO integrates high-density digital trade, rotating crowd savings, global factory sourcing, professional services, educational curricula, and premium gaming on an elegant, ultra-secure interface.

Here is what EFADO brings to your lifestyle:

1. Unified Commerce: List assets on our sovereign markets (Modern, Fairly Used, Agriculture, and Creative Talents) and instantly propagate to our active global database.
2. Financial Security: All trades are protected by automated escrow systems, with immediate deposits and native standard withdrawals to local banks or international nodes.
3. Rotational Wealth: Join CSCC pools to build trust cycles and access instant business credit options via HepiHands.
4. Professional On-Demand Service: Recruit certified engineers, consultants, and legal specialists immediately.

We invite you to experience the synchronization of digital space at e-fado.com. 

To help you share the word with your network and launch global video promotions, we have integrated a full Global Media & Advertising Kit right into your web dashboard. Tweak your parameters, extract high-converting copy, and launch campaigns on TikTok, YouTube, and Meta instantly.

Visit e-fado.com now and claim your digital sovereignty lock.

In full synchronization,

Sovereign Executive Office
${taglineUpper} Network
Email: efado226@gmail.com
Ecosystem Link: e-fado.com`;

    return { viral, explainer, social, email };
  };

  const { viral, explainer, social, email } = getHydratedScripts();
  const currentActiveScript = () => {
    switch(scriptView) {
      case 'VIRAL': return viral;
      case 'EXPLAINER': return explainer;
      case 'SOCIAL': return social;
      case 'EMAIL': return email;
      default: return "";
    }
  };

  const handleExportAll = () => {
    const combined = `========================================================================
             EFADO HUBS CONNECT - GLOBAL MARKETING MEDIA KIT
             GENERATED FOR: ${user.email} (${user.displayName || 'Sovereign Node'})
========================================================================
Tagline/Brand Name: ${tagline}
Target Markets: ${targetLocation}
CTA Statement: ${customCTA}
Contact Protocol: ${phoneNumber}
Ecosystem URL: e-fado.com / e-fadohubs
========================================================================

------------------------------------------------------------------------
1. VIRAL SHORT VIDEO SCRIPT (TIKTOK/REELS/SHORTS - 30S)
------------------------------------------------------------------------
${viral}

------------------------------------------------------------------------
2. HIGH-IMPACT EXPLAINER VIDEO SCRIPT (YOUTUBE/META - 60S)
------------------------------------------------------------------------
${explainer}

------------------------------------------------------------------------
3. VIRAL SOCIAL BROADCAST COPY (WHATSAPP/TELEGRAM/X)
------------------------------------------------------------------------
${social}

------------------------------------------------------------------------
4. PROFESSIONAL COLD EMAIL & OUTREACH PARTNER PITCH
------------------------------------------------------------------------
${email}

========================================================================
                   GLOBAL CAMPAIGN RUNBOOK & TARGETING GUIDE
========================================================================
* TIKTOK / INSTAGRAM REELS CAMPAIGN GUIDE:
  - Objective: Traffic / Video Views
  - Audience: Age 18 - 45. Tech Enthusiasts, Side-hustle Groups, Online Merchants, Freelancers.
  - Placements: TikTok Feed, Reels Feed, YouTube Shorts.
  - Delivery Strategy: Use high-tempo trending music from the Business Audio Library. Superimpose large visual caption overlays (3-4 words max) to maximize watch-time in first 3 seconds.

* META (FACEBOOK/INSTAGRAM) COMPREHENSIVE ADS PATTERNS:
  - Objective: App Installs / Leads / Conversions
  - Audience: Local Business owners, Agriculture cooperatives, Savings Group chairmen, Digital Marketers.
  - Placements: Instagram Stories, Facebook Marketplace, Messenger Home.
  - Delivery Strategy: Rely on the 'Viral Social Broadcast' script accompanied by high-quality image thumbnails.

* GOOGLE SEARCH ADS (SEM STRATEGIC INDEX):
  - Target Keywords: \"secure rotating savings\", \"P2P business loan instant\", \"China direct factory freight link\", \"airtime top-up multi-currency\", \"trusted escrow domain purchase\".
  - Matching Protocol: Broad match modified to find high-intent operators.

========================================================================
Generated on ${new Date().toISOString()} | EFADO Ecosystem Promotion Core
========================================================================`;
    handleDownloadText("efado_complete_media_kit", combined);
  };

  return (
    <div className="bg-slate-950 text-white min-h-screen py-10 px-6 lg:px-12 rounded-[3.5rem] border border-white/10 relative overflow-hidden custom-scrollbar">
      {/* Dynamic Background */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none animate-pulse" />
      <div className="absolute -bottom-45 -right-45 w-96 h-96 bg-amber-500/10 rounded-full blur-[150px] pointer-events-none animate-pulse" />
      
      {/* Title block */}
      <div className="relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
        
        {/* Left column: Parameters & Storyboard Player */}
        <div className="flex-1 space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-indigo-600 to-amber-500 rounded-2xl text-white shadow-lg animate-bounce duration-1000">
              <Megaphone className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-500/20">GLOBAL AD PLANNER</span>
                <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-400 uppercase tracking-widest"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" /> GLOBAL ON AIR</span>
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-indigo-300">
                E-Fado Video & Promo Kit Hub
              </h2>
            </div>
          </div>

          <p className="text-sm font-semibold text-slate-400 leading-relaxed max-w-xl">
            Empower your marketing. Tweak the core brand parameters below to dynamically auto-hydrate all video storyboards, audio scripts, and broadcast copy. Export your customized package instantly with a single click.
          </p>

          {/* Interactive Customizer Cards */}
          <div className="p-6 bg-slate-900/50 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-500" />
                Live Campaign Parameters
              </span>
              <button 
                onClick={() => {
                  setTagline('EFADO HUBS CONNECT');
                  setTargetLocation('Global (190+ Countries)');
                  setCustomCTA('Build your digital empire at e-fado.com');
                  setPhoneNumber('+234 or your local office');
                }}
                className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors flex items-center gap-1"
                title="Reset Parameters"
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Brand Name / Tagline</label>
                <input 
                  type="text" 
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-950 border border-white/5 rounded-2xl text-sm font-bold text-white focus:outline-none focus:border-amber-500 transition-all focus:ring-1 focus:ring-amber-500"
                  placeholder="e.g. EFADO HUBS CONNECT"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Jurisdictions</label>
                <input 
                  type="text" 
                  value={targetLocation}
                  onChange={(e) => setTargetLocation(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-950 border border-white/5 rounded-2xl text-sm font-bold text-white focus:outline-none focus:border-indigo-500 transition-all focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. West Africa, Europe, US"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Main Call-To-Action (CTA)</label>
                <input 
                  type="text" 
                  value={customCTA}
                  onChange={(e) => setCustomCTA(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-950 border border-white/5 rounded-2xl text-sm font-bold text-white focus:outline-none focus:border-pink-500 transition-all focus:ring-1 focus:ring-pink-500"
                  placeholder="e.g. Build your digital empire at e-fado.com"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Protocol Number (Display)</label>
                <input 
                  type="text" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-950 border border-white/5 rounded-2xl text-sm font-bold text-white focus:outline-none focus:border-amber-500 transition-all focus:ring-1 focus:ring-amber-500"
                  placeholder="e.g. +23480xxxxxxxx"
                />
              </div>
            </div>
          </div>

          {/* Video Storyboard Player */}
          <div className="p-8 bg-slate-900 border border-white/10 rounded-[2.5rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
              <div>
                <h3 className="text-xl font-bold uppercase tracking-tighter text-white italic flex items-center gap-2">
                  <Video className="w-5 h-5 text-indigo-400" /> Live Video Storyboard Mockup
                </h3>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">Simulate scene cuts for promotion videos</p>
              </div>

              {/* Storyboard selector buttons */}
              <div className="flex bg-slate-950 p-1.5 rounded-xl border border-white/5">
                <button 
                  onClick={() => { setActiveStoryboardType('30S'); setActiveStoryIdx(0); setStoryboardPlaying(false); }}
                  className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeStoryboardType === '30S' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  30s Reels/TikTok
                </button>
                <button 
                  onClick={() => { setActiveStoryboardType('60S'); setActiveStoryIdx(0); setStoryboardPlaying(false); }}
                  className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeStoryboardType === '60S' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  60s Explainer
                </button>
              </div>
            </div>

            {/* Simulated TV / Screen Monitor */}
            <div className="aspect-video w-full bg-slate-950 rounded-[2rem] border border-white/10 p-6 md:p-8 relative flex flex-col justify-between shadow-2xl group overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient(from-center, rgba(255,255,255,0.02) 0%, transparent 80%) pointer-events-none" />
              
              {/* Scanlines visual effect */}
              <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none" />

              {/* Status Header inside the Simulated TV */}
              <div className="flex items-center justify-between relative z-10">
                <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-2.5 py-1.5 rounded-full border border-white/5">
                  <Tv className="w-3 h-3 text-indigo-400 animate-pulse" /> SIMULATED MONITOR
                </span>
                <span className="text-[9px] font-black text-rose-500 tracking-widest animate-pulse flex items-center gap-1">
                  🔴 {activeStoryboardList[activeStoryIdx].seconds}
                </span>
              </div>

              {/* Central Director Prompt */}
              <div className="text-center my-6 relative z-10 transition-all duration-500">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">VISUAL SCENE {activeStoryIdx + 1}</p>
                <h4 className="text-base md:text-lg font-bold uppercase tracking-tight text-white select-text leading-snug px-4">
                  "{activeStoryboardList[activeStoryIdx].voiceover}"
                </h4>
              </div>

              {/* Bottom Visual/SFX Cue Details */}
              <div className="space-y-2 pt-4 border-t border-white/5 relative z-10">
                <div className="flex items-start gap-2.5">
                  <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md shrink-0 block mt-0.5">VISUAL:</span>
                  <p className="text-[10px] font-mono text-slate-300 leading-relaxed text-left">{activeStoryboardList[activeStoryIdx].visuals}</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md shrink-0 block mt-0.5">AUDIO:</span>
                  <p className="text-[10px] font-mono text-amber-300 leading-relaxed text-left">{activeStoryboardList[activeStoryIdx].audio}</p>
                </div>
              </div>

              {/* Direction Blueprint Bubble (Appears on Hover) */}
              <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl p-8 flex flex-col justify-center items-center text-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-20 border border-white/5 rounded-[2rem]">
                <Settings className="w-8 h-8 text-amber-500 mb-3 animate-spin duration-3000" />
                <h5 className="text-[11px] font-black uppercase tracking-widest text-amber-400 mb-1">Sovereign Director Notes</h5>
                <p className="text-[12px] font-mono text-slate-200 leading-relaxed max-w-sm">
                  {activeStoryboardList[activeStoryIdx].directorNote}
                </p>
                <span className="text-[8px] text-slate-500 uppercase tracking-widest mt-6 font-extrabold">Move cursor away to return to monitor view</span>
              </div>
            </div>

            {/* Interactive Player Controls */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setStoryboardPlaying(prev => !prev);
                  }}
                  className={`p-3 bg-white text-slate-950 hover:bg-slate-200 rounded-full transition-all shadow-lg flex items-center justify-center`}
                  title={storyboardPlaying ? "Pause Playback" : "Play Storyboard Automatically"}
                >
                  {storyboardPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
                </button>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {storyboardPlaying ? "AUTOPLAY ACTIVE (7S INTERVAL)" : "PLAY SIMULATION"}
                </span>
              </div>

              {/* Next/Prev buttons */}
              <div className="flex gap-2">
                <button 
                  disabled={activeStoryIdx === 0}
                  onClick={() => { setStoryboardPlaying(false); setActiveStoryIdx(p => Math.max(0, p - 1)); }}
                  className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 disabled:opacity-30 transition-all text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3.5 py-2.5 bg-slate-950 border border-white/5 rounded-xl font-mono text-xs font-bold min-w-[50px] text-center">
                  {activeStoryIdx + 1} / {activeStoryboardList.length}
                </span>
                <button 
                  disabled={activeStoryIdx === activeStoryboardList.length - 1}
                  onClick={() => { setStoryboardPlaying(false); setActiveStoryIdx(p => Math.min(activeStoryboardList.length - 1, p + 1)); }}
                  className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 disabled:opacity-30 transition-all text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Formatted Output Viewer & Exporter */}
        <div className="flex-1 flex flex-col space-y-6">
          <div className="p-8 bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] flex-grow flex flex-col">
            
            {/* Header copy buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter text-white italic flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" /> Complete Copy Kit
                </h3>
                <p className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest mt-1">Instantly hydrated scripts & layout copy</p>
              </div>

              <button 
                onClick={handleExportAll}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-indigo-600 hover:scale-[1.03] active:scale-95 text-[10px] text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-amber-500/10"
              >
                <Download className="w-4 h-4 animate-bounce" /> Export All Scripts (.txt)
              </button>
            </div>

            {/* Script section tabs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
              {[
                { id: 'VIRAL', label: '🎥 Short Video', desc: 'TikTok, Shorts, Reels' },
                { id: 'EXPLAINER', label: '📺 Explainer', desc: '60s YouTube, FB' },
                { id: 'SOCIAL', label: '🚀 Social post', desc: 'WhatsApp, Telegram' },
                { id: 'EMAIL', label: '✉️ Partner cold', desc: 'B2B outreach Email' },
                { id: 'PITCH', label: '📊 Pitch Deck', desc: 'Live Presentation' },
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setScriptView(tab.id as any)}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative ${scriptView === tab.id ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-950 border-white/5 hover:border-white/10 text-slate-400 hover:text-white'}`}
                >
                  {scriptView === tab.id && (
                    <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping" />
                  )}
                  <span className="block text-[11px] font-black uppercase tracking-wide truncate">{tab.label}</span>
                  <span className="block text-[8px] font-extrabold uppercase tracking-widest text-slate-500 mt-1 truncate">{tab.desc}</span>
                </button>
              ))}
            </div>

            {/* Interactive Hydrated Code Box or Live Pitch Deck */}
            {scriptView === 'PITCH' ? (
              <div className="relative bg-slate-950 rounded-[2rem] border-2 border-indigo-500/30 flex-grow flex flex-col overflow-hidden min-h-[460px] transition-all">
                <div className="absolute inset-0 bg-radial-gradient(from-center, rgba(99,102,241,0.05) 0%, transparent 80%) pointer-events-none" />
                
                {/* Simulated Glass Slide Content Container */}
                <div className="p-6 md:p-8 flex-grow flex flex-col justify-between relative z-10">
                  <AnimatePresence mode="wait">
                    {pitchSlideIdx === 0 && (
                      <motion.div
                        key="slide0"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center justify-center text-center space-y-4 my-auto w-full"
                      >
                        <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-500/20">SLIDE 1: INTRO</span>
                        <h4 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white italic leading-tight">
                          {tagline}
                        </h4>
                        <p className="text-lg md:text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-indigo-400">
                          Your All-In-One Digital Ecosystem
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Connect · Transact · Thrive</p>
                        <div className="flex gap-3 mt-1">
                          <span className="px-3 py-1.5 bg-slate-900 border border-white/5 rounded-xl text-[9px] items-center text-slate-300 font-semibold flex gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" /> e-fado.com
                          </span>
                        </div>

                        {/* Strategic Voiceover Audio Narration Box */}
                        <div className="w-full text-left bg-slate-900/80 border border-amber-500/15 p-4 rounded-2xl space-y-2 mt-4 select-text">
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-[8px] font-mono font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                              <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Strategic Voiceover Narration
                            </span>
                            <span className="text-[8px] font-mono text-slate-400 uppercase">Duration: 6s | Tone: Welcoming, Confident</span>
                          </div>
                          <p className="text-[10.5px] text-slate-200 leading-relaxed font-semibold">
                            "[Voice actor starts with a warm, energetic, welcoming smile in his tone] Are you tired of switching between fifty different applications every single day just to manage your life? Welcome to the ultimate digital lock. This is <span className="text-amber-400 font-black">{tagline}</span>—your all-in-one digital ecosystem!"
                          </p>
                          <div className="text-[7.5px] font-mono text-slate-500 uppercase tracking-widest">SFX Recommendation: Deep electronic riser fading into smooth Afrobeat chords.</div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(`Are you tired of switching between fifty different applications every single day just to manage your life? Welcome to the ultimate digital lock. This is ${tagline}—your all-in-one digital ecosystem!`, 'VO_S1'); }}
                            className="text-[8px] font-black uppercase text-slate-400 hover:text-white flex items-center gap-1.5 mt-2 transition-all p-1 hover:bg-white/5 rounded-md"
                          >
                            <Copy className="w-3 h-3" /> {copiedSection === 'VO_S1' ? 'VO Script Copied!' : 'Copy VO Script'}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {pitchSlideIdx === 1 && (
                      <motion.div
                        key="slide1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4 text-left my-auto w-full"
                      >
                        <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-500/20 inline-block font-mono">SLIDE 2: MEET THE VISIONARY</span>
                        <h4 className="text-2xl font-black text-white uppercase tracking-tight">Okhawere Festus</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Chief Executive Officer · EFADO Market Hubs</p>
                        <div className="h-0.5 w-12 bg-gradient-to-r from-amber-500 to-transparent" />
                        <p className="text-xs md:text-sm font-semibold text-slate-300 leading-relaxed max-w-xl">
                          A visionary leader dedicated to building Africa's most innovative digital marketplace. With a passion for technology and community empowerment, Festus is driving the revolution that connects millions of people to life-changing opportunities.
                        </p>

                        {/* Strategic Voiceover Audio Narration Box */}
                        <div className="w-full text-left bg-slate-900/80 border border-amber-500/15 p-4 rounded-2xl space-y-2 mt-4 select-text">
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-[8px] font-mono font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                              <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Strategic Voiceover Narration
                            </span>
                            <span className="text-[8px] font-mono text-slate-400 uppercase">Duration: 8s | Tone: Respectful, Reassuring</span>
                          </div>
                          <p className="text-[10.5px] text-slate-200 leading-relaxed font-semibold">
                            "[Voiceover style shifts to professional reassurance] Behind every grand shift, there stands a solid vision. Meet Okhawere Festus, Chief Executive Officer of EFADO Market Hubs. Driven by a relentless passion for modern tech and direct civic empowerment, Festus is steering a model built to launch millions into shared growth."
                          </p>
                          <div className="text-[7.5px] font-mono text-slate-500 uppercase tracking-widest">SFX Recommendation: Light keystroke acoustic pad backing, slow majestic strings.</div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(`Behind every grand shift, there stands a solid vision. Meet Okhawere Festus, Chief Executive Officer of EFADO Market Hubs. Driven by a relentless passion for modern tech and direct civic empowerment, Festus is steering a model built to launch millions into shared growth.`, 'VO_S2'); }}
                            className="text-[8px] font-black uppercase text-slate-400 hover:text-white flex items-center gap-1.5 mt-2 transition-all p-1 hover:bg-white/5 rounded-md"
                          >
                            <Copy className="w-3 h-3" /> {copiedSection === 'VO_S2' ? 'VO Script Copied!' : 'Copy VO Script'}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {pitchSlideIdx === 2 && (
                      <motion.div
                        key="slide2"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6 text-center my-auto w-full"
                      >
                        <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-500/20 inline-block font-mono">SLIDE 3: PLATFORM BLUEPRINT</span>
                        <h4 className="text-2xl font-black text-white uppercase tracking-tight">One Platform. Infinite Possibilities.</h4>
                        <p className="text-xs text-slate-350 max-w-lg mx-auto leading-relaxed">
                          EFADO Hubs Connect is an innovative, unified digital ecosystem linking buyers, sellers, employers, employees, landlords, savers, and gamers securely across physical boundaries.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-xl mx-auto pt-2">
                          {[
                            { value: '8+', label: 'Core Services' },
                            { value: '1', label: 'Ecosystem' },
                            { value: '∞', label: 'Opportunities' },
                            { value: '24/7', label: 'Ecosystem Sync' }
                          ].map((stat, idx) => (
                            <div key={idx} className="p-3 bg-slate-900 border border-white/5 rounded-2xl">
                              <span className="block text-xl font-bold text-amber-500">{stat.value}</span>
                              <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">{stat.label}</span>
                            </div>
                          ))}
                        </div>

                        {/* Strategic Voiceover Audio Narration Box */}
                        <div className="w-full text-left bg-slate-900/80 border border-amber-500/15 p-4 rounded-2xl space-y-2 mt-4 select-text">
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-[8px] font-mono font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                              <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Strategic Voiceover Narration
                            </span>
                            <span className="text-[8px] font-mono text-slate-400 uppercase">Duration: 10s | Tone: High-impact, Data-driven</span>
                          </div>
                          <p className="text-[10.5px] text-slate-200 leading-relaxed font-semibold">
                            "[Voiceover escalates with impressive pace and heavy confidence] One single digital environment. Beautifully engineered with infinite commercial possibilities. Spanning {targetLocation}, EFADO bridges peer connections, rotates community capital, and integrates 8 specialized hubs, serving you completely with no borders."
                          </p>
                          <div className="text-[7.5px] font-mono text-slate-500 uppercase tracking-widest">SFX Recommendation: Upbeat electronic background beats with subtle, metallic typing clicks.</div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(`One single digital environment. Beautifully engineered with infinite commercial possibilities. Spanning ${targetLocation}, EFADO bridges peer connections, rotates community capital, and integrates 8 specialized hubs, serving you completely with no borders.`, 'VO_S3'); }}
                            className="text-[8px] font-black uppercase text-slate-400 hover:text-white flex items-center gap-1.5 mt-2 transition-all p-1 hover:bg-white/5 rounded-md"
                          >
                            <Copy className="w-3 h-3" /> {copiedSection === 'VO_S3' ? 'VO Script Copied!' : 'Copy VO Script'}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {pitchSlideIdx === 3 && (
                      <motion.div
                        key="slide3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4 text-center my-auto w-full"
                      >
                        <div className="mb-2">
                          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-500/20 inline-block font-mono">SLIDE 4: THE APP SERVICES</span>
                          <h4 className="text-xl font-black text-white uppercase mt-2">Everything You Need. One App.</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
                          {[
                            { icon: '🛒', name: 'Marketplace', desc: 'Secure P2P trade' },
                            { icon: '💼', name: 'Job Portal', desc: 'Sovereign careers' },
                            { icon: '🏠', name: 'Real Estate', desc: 'Land & housing lock' },
                            { icon: '🎓', name: 'Education', desc: 'Curriculum & learning' },
                            { icon: '🏦', name: 'Community Savings', desc: 'CSCC rotational pools' },
                            { icon: '💰', name: 'Credit Access', desc: 'HepiHands collateral-free' },
                            { icon: '🏪', name: 'Vendor Hub', desc: 'Merchant global sync' },
                            { icon: '🎮', name: 'Game Arena', desc: 'Risk-free fun stakes' }
                          ].map((svc, idx) => (
                            <div key={idx} className="p-2.5 bg-slate-900 border border-white/5 rounded-xl text-left hover:border-indigo-500/30 transition-all">
                              <div className="text-base mb-1">{svc.icon}</div>
                              <span className="block text-[10px] font-black text-white uppercase tracking-tight truncate">{svc.name}</span>
                              <span className="block text-[8px] text-slate-400 truncate mt-0.5">{svc.desc}</span>
                            </div>
                          ))}
                        </div>

                        {/* Strategic Voiceover Audio Narration Box */}
                        <div className="w-full text-left bg-slate-900/80 border border-amber-500/15 p-4 rounded-2xl space-y-2 mt-4 select-text">
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-[8px] font-mono font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                              <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Strategic Voiceover Narration
                            </span>
                            <span className="text-[8px] font-mono text-slate-400 uppercase">Duration: 12s | Tone: Enterprising, Highly Energetic</span>
                          </div>
                          <p className="text-[10.5px] text-slate-200 leading-relaxed font-semibold">
                            "[Energetic video ad style] Every critical commercial tool seamlessly synchronized. Sell products securely via verified escrow, discover sovereign job pathways, pool decentralized capital under structured communal rotating logs, access fair credit, trade digital assets, and test your luck in risk-free games. It's your complete portal empire inside your pocket!"
                          </p>
                          <div className="text-[7.5px] font-mono text-slate-500 uppercase tracking-widest">SFX Recommendation: Bouncy Afrobeat bass line, chiming alert sound fx on word 'synchronised'.</div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(`Every critical commercial tool seamlessly synchronized. Sell products securely via verified escrow, discover sovereign job pathways, pool decentralized capital under structured communal rotating logs, access fair credit, trade digital assets, and test your luck in risk-free games. It's your complete portal empire inside your pocket!`, 'VO_S4'); }}
                            className="text-[8px] font-black uppercase text-slate-400 hover:text-white flex items-center gap-1.5 mt-2 transition-all p-1 hover:bg-white/5 rounded-md"
                          >
                            <Copy className="w-3 h-3" /> {copiedSection === 'VO_S4' ? 'VO Script Copied!' : 'Copy VO Script'}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {pitchSlideIdx === 4 && (
                      <motion.div
                        key="slide4"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4 text-center my-auto max-w-xl mx-auto w-full"
                      >
                        <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-500/20 inline-block font-mono">SLIDE 5: FOUNDER VISION</span>
                        <div className="text-amber-500 text-3xl font-black">“</div>
                        <blockquote className="text-sm md:text-base font-semibold text-slate-200 italic leading-relaxed">
                          We built {tagline} because we believe every person — no matter where they are — deserves access to a world of digital sovereignty. This is not just an app. It is a movement.
                        </blockquote>
                        <div className="text-[10px] font-black uppercase tracking-widest text-amber-400">— Okhawere Festus, CEO</div>

                        {/* Strategic Voiceover Audio Narration Box */}
                        <div className="w-full text-left bg-slate-900/80 border border-amber-500/15 p-4 rounded-2xl space-y-2 mt-4 select-text">
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-[8px] font-mono font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                              <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Strategic Voiceover Narration
                            </span>
                            <span className="text-[8px] font-mono text-slate-400 uppercase">Duration: 8s | Tone: Inspired, Sincere</span>
                          </div>
                          <p className="text-[10.5px] text-slate-200 leading-relaxed font-semibold">
                            "[Sincere, human interest tone] At the heart of EFADO lies a simple, profound core. High technology is not just for global conglomerates. Every single person deserves to be interconnected. It's time to build a robust safety net where everyone can save, thrive, and own their own data. This is more than technology. It's a digital revolution."
                          </p>
                          <div className="text-[7.5px] font-mono text-slate-500 uppercase tracking-widest">SFX Recommendation: Sincere, warm acoustic guitar notes with smooth ambient reverb.</div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(`At the heart of EFADO lies a simple, profound core. High technology is not just for global conglomerates. Every single person deserves to be interconnected. It's time to build a robust safety net where everyone can save, thrive, and own their own data. This is more than technology. It's a digital revolution.`, 'VO_S5'); }}
                            className="text-[8px] font-black uppercase text-slate-400 hover:text-white flex items-center gap-1.5 mt-2 transition-all p-1 hover:bg-white/5 rounded-md"
                          >
                            <Copy className="w-3 h-3" /> {copiedSection === 'VO_S5' ? 'VO Script Copied!' : 'Copy VO Script'}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {pitchSlideIdx === 5 && (
                      <motion.div
                        key="slide5"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-5 text-left my-auto w-full max-w-xl mx-auto"
                      >
                        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-indigo-500/20 inline-block font-mono">SLIDE 6: CRITICAL WHY</span>
                        <h4 className="text-xl font-black text-white uppercase">Built For Your True Success</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            { icon: '🔒', title: 'Security First', desc: 'Tactical escrow protection protocols' },
                            { icon: '⚡', title: 'All-In-One Ease', desc: 'No more jumping between separate apps' },
                            { icon: '🌍', title: 'Community Led', desc: 'Unlock collective capital & savings' },
                            { icon: '🚀', title: 'Pristine Tech Core', desc: 'Optimized for mobile-first global speed' }
                          ].map((why, idx) => (
                            <div key={idx} className="flex gap-2.5 items-start">
                              <span className="text-lg mt-0.5">{why.icon}</span>
                              <div>
                                <span className="block text-[11px] font-black uppercase text-white tracking-wide">{why.title}</span>
                                <span className="block text-[10px] text-slate-400 mt-1 leading-normal">{why.desc}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Strategic Voiceover Audio Narration Box */}
                        <div className="w-full text-left bg-slate-900/80 border border-amber-500/15 p-4 rounded-2xl space-y-2 mt-4 select-text">
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-[8px] font-mono font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                              <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Strategic Voiceover Narration
                            </span>
                            <span className="text-[8px] font-mono text-slate-400 uppercase">Duration: 10s | Tone: Strategic, Decisive, Convincing</span>
                          </div>
                          <p className="text-[10.5px] text-slate-200 leading-relaxed font-semibold">
                            "[Voiceover shifts to deep strategic authority] Why is EFADO a game changer? Four unyielding pillars: uncompromising security backed by robust escrow system; elegant convenience replacing disjointed apps; community-fueled financial savings programs; and an optimized technology framework built for global high-tempo execution."
                          </p>
                          <div className="text-[7.5px] font-mono text-slate-500 uppercase tracking-widest">SFX Recommendation: Heavy industrial drum hit with constant metallic tech clanks.</div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(`Why is EFADO a game changer? Four unyielding pillars: uncompromising security backed by robust escrow system; elegant convenience replacing disjointed apps; community-fueled financial savings programs; and an optimized technology framework built for global high-tempo execution.`, 'VO_S6'); }}
                            className="text-[8px] font-black uppercase text-slate-400 hover:text-white flex items-center gap-1.5 mt-2 transition-all p-1 hover:bg-white/5 rounded-md"
                          >
                            <Copy className="w-3 h-3" /> {copiedSection === 'VO_S6' ? 'VO Script Copied!' : 'Copy VO Script'}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {pitchSlideIdx === 6 && (
                      <motion.div
                        key="slide6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4 text-center my-auto w-full max-w-2xl mx-auto"
                      >
                        <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-500/20 inline-block font-mono">SLIDE 7: ECOSYSTEM WORKFLOW</span>
                        <h4 className="text-xl font-black text-white uppercase">How It Works in Days</h4>
                        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 pt-2">
                          {[
                            { step: '1', title: 'Register', desc: 'Create account online' },
                            { step: '2', title: 'Profile', desc: 'Add business info' },
                            { step: '3', title: 'Explore', desc: 'Review active hubs' },
                            { step: '4', title: 'Transact', desc: 'Buy, sell & save' },
                            { step: '5', title: 'Harvest', desc: 'Expand net value' }
                          ].map((step, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-indigo-500/10 mb-2">
                                {step.step}
                              </div>
                              <span className="block text-[10px] font-black text-white uppercase">{step.title}</span>
                              <span className="block text-[8px] text-slate-500 text-center mt-1 max-w-[100px] leading-tight">{step.desc}</span>
                            </div>
                          ))}
                        </div>

                        {/* Strategic Voiceover Audio Narration Box */}
                        <div className="w-full text-left bg-slate-900/80 border border-amber-500/15 p-4 rounded-2xl space-y-2 mt-4 select-text">
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-[8px] font-mono font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                              <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Strategic Voiceover Narration
                            </span>
                            <span className="text-[8px] font-mono text-slate-400 uppercase">Duration: 8s | Tone: Explanatory, Streamlined, Clear</span>
                          </div>
                          <p className="text-[10.5px] text-slate-200 leading-relaxed font-semibold">
                            "[Warm, tutorial-style tone] Joining our global ecosystem requires no friction. Just register your master account online, configure your professional business credentials, discover all the robust integrated hubs, transact with complete confidence, and scale your personal network capital immediately."
                          </p>
                          <div className="text-[7.5px] font-mono text-slate-500 uppercase tracking-widest">SFX Recommendation: Smooth, medium-tempo acoustic guitar pluck sounds.</div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(`Joining our global ecosystem requires no friction. Just register your master account online, configure your professional business credentials, discover all the robust integrated hubs, transact with complete confidence, and scale your personal network capital immediately.`, 'VO_S7'); }}
                            className="text-[8px] font-black uppercase text-slate-400 hover:text-white flex items-center gap-1.5 mt-2 transition-all p-1 hover:bg-white/5 rounded-md"
                          >
                            <Copy className="w-3 h-3" /> {copiedSection === 'VO_S7' ? 'VO Script Copied!' : 'Copy VO Script'}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {pitchSlideIdx === 7 && (
                      <motion.div
                        key="slide7"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4 text-center my-auto max-w-md mx-auto w-full"
                      >
                        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-indigo-500/20 inline-block font-mono">SLIDE 8: PORTABLE EMPIRE</span>
                        <h4 className="text-2xl font-black text-white uppercase tracking-tight">Ecosystem Download</h4>
                        <p className="text-xs font-semibold text-slate-400 leading-normal">
                          Grab the fully featured EFADO app directly and launch your decentralized commercial pipeline in minutes under robust secure environments.
                        </p>
                        <button className="w-full py-3 bg-gradient-to-r from-amber-500 to-indigo-600 text-[10px] text-white font-black uppercase tracking-widest rounded-xl hover:scale-102 active:scale-95 transition-all shadow-xl shadow-indigo-500/10">
                          📲 Download The App Now
                        </button>

                        {/* Strategic Voiceover Audio Narration Box */}
                        <div className="w-full text-left bg-slate-900/80 border border-amber-500/15 p-4 rounded-2xl space-y-2 mt-4 select-text">
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-[8px] font-mono font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                              <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Strategic Voiceover Narration
                            </span>
                            <span className="text-[8px] font-mono text-slate-400 uppercase">Duration: 8s | Tone: Urgent, Convincing, Call-to-Action</span>
                          </div>
                          <p className="text-[10.5px] text-slate-200 leading-relaxed font-semibold">
                            "[Bold call-to-action tone] Launching is just a tap away. Bypass standard bulky download channels, download our fully encapsulated sovereign mobile app at e-fado.com directly, and deploy a state-of-the-art secure transactional pipeline right at your fingertips."
                          </p>
                          <div className="text-[7.5px] font-mono text-slate-500 uppercase tracking-widest">SFX Recommendation: Sharp synthetic swoosh and an encouraging upward-building pitch scale.</div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(`Launching is just a tap away. Bypass standard bulky download channels, download our fully encapsulated sovereign mobile app at e-fado.com directly, and deploy a state-of-the-art secure transactional pipeline right at your fingertips.`, 'VO_S8'); }}
                            className="text-[8px] font-black uppercase text-slate-400 hover:text-white flex items-center gap-1.5 mt-2 transition-all p-1 hover:bg-white/5 rounded-md"
                          >
                            <Copy className="w-3 h-3" /> {copiedSection === 'VO_S8' ? 'VO Script Copied!' : 'Copy VO Script'}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {pitchSlideIdx === 8 && (
                      <motion.div
                        key="slide8"
                        initial={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        exit={{ opacity: 0, translateY: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4 text-center my-auto w-full max-w-xl mx-auto"
                      >
                        <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-500/20 inline-block font-mono">SLIDE 9: JOIN THE REVOLUTION</span>
                        <h4 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">Let's Build The Future Together</h4>
                        <p className="text-xs text-slate-350 leading-relaxed font-semibold">
                          Connect, collaborate, and create a better decentralized environment with {tagline} — your ultimate digital commercial ecosystem choice.
                        </p>
                        <div className="flex gap-2.5 justify-center flex-wrap">
                          <span className="px-4 py-2 bg-indigo-600/30 text-indigo-400 text-[8px] font-mono font-black uppercase tracking-widest border border-indigo-500/20 rounded-xl">www.efadohubsconnect.com</span>
                          <span className="px-4 py-2 bg-amber-500/20 text-amber-400 text-[8px] font-mono font-black uppercase tracking-widest border border-amber-500/20 rounded-xl">efado226@gmail.com</span>
                        </div>

                        {/* Strategic Voiceover Audio Narration Box */}
                        <div className="w-full text-left bg-slate-900/80 border border-amber-500/15 p-4 rounded-2xl space-y-2 mt-4 select-text">
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-[8px] font-mono font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                              <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Strategic Voiceover Narration
                            </span>
                            <span className="text-[8px] font-mono text-slate-400 uppercase">Duration: 10s | Tone: Grand, Professional, Melodic sign-off</span>
                          </div>
                          <p className="text-[10.5px] text-slate-200 leading-relaxed font-semibold">
                            "[Broadcaster final signature tone] The global sync has begun. Do not get left behind inside a fragmented web. Join the movement now at www.efadohubsconnect.com or write us at efado226@gmail.com today. EFADO Hubs Connect: Your Entire World, Fully Synchronized."
                          </p>
                          <div className="text-[7.5px] font-mono text-slate-500 uppercase tracking-widest">SFX Recommendation: Symphonic bass swell resolving out to a sparkling, highly-polished electric node chime.</div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(`The global sync has begun. Do not get left behind inside a fragmented web. Join the movement now at www.efadohubsconnect.com or write us at efado226@gmail.com today. EFADO Hubs Connect: Your Entire World, Fully Synchronized.`, 'VO_S9'); }}
                            className="text-[8px] font-black uppercase text-slate-400 hover:text-white flex items-center gap-1.5 mt-2 transition-all p-1 hover:bg-white/5 rounded-md"
                          >
                            <Copy className="w-3 h-3" /> {copiedSection === 'VO_S9' ? 'VO Script Copied!' : 'Copy VO Script'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Pitch Slide Navigation Controllers */}
                  <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/5">
                    <button
                      disabled={pitchSlideIdx === 0}
                      onClick={() => setPitchSlideIdx(p => Math.max(0, p - 1))}
                      className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 disabled:opacity-30 transition-all text-white"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    {/* Navigation Mini-bar Indicator */}
                    <div className="flex gap-1.5 items-center">
                      {[...Array(9)].map((_, i) => (
                        <button 
                          key={i}
                          onClick={() => setPitchSlideIdx(i)}
                          className={`h-1.5 rounded-full transition-all duration-300 ${pitchSlideIdx === i ? 'w-6 bg-gradient-to-r from-amber-500 to-indigo-600' : 'w-1.5 bg-white/10'}`}
                        />
                      ))}
                    </div>

                    <button
                      disabled={pitchSlideIdx === 8}
                      onClick={() => setPitchSlideIdx(p => Math.min(8, p + 1))}
                      className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 disabled:opacity-30 transition-all text-white"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative bg-slate-950 rounded-[2rem] border border-white/10 flex-grow flex flex-col overflow-hidden min-h-[300px]">
                
                {/* Absolute Action over Console */}
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                  <button 
                    onClick={() => handleDownloadText(scriptView, currentActiveScript())}
                    className="p-2 bg-slate-900 border border-white/15 hover:border-white/20 rounded-xl hover:bg-slate-800 transition-all text-slate-300 hover:text-white"
                    title="Download Script text"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => copyToClipboard(currentActiveScript(), scriptView)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-white/15 hover:border-white/20 rounded-xl hover:bg-slate-800 transition-all text-slate-300 hover:text-white"
                  >
                    {copiedSection === scriptView ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Scrollable code text */}
                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-grow select-text selection:bg-amber-500/20">
                  <pre className="text-[11px] md:text-[12px] font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {currentActiveScript()}
                  </pre>
                </div>
              </div>
            )}

            {/* Quick Action Info Tips */}
            <div className="p-5 bg-gradient-to-r from-amber-500/10 to-indigo-600/10 border-2 border-white/5 rounded-2xl mt-6 flex gap-4">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-black uppercase tracking-tight text-amber-400 mb-1">PRO-LEVEL AUDIO RECOMMENDATION</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 leading-normal">
                  Download standard licensing high-tempo Afrobeat track (like 'Onyeka' or 'Burna style') or energetic tech-chill electronic backgrounds. Direct actors to talk in an authoritative, fast-paced tone. Keep titles short. Use visual tags (*#EfadoHubs*, *#AllInOne*).
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Campaign Strategy runbook below */}
      <div className="relative z-10 max-w-7xl mx-auto mt-12 border-t border-white/10 pt-10">
        <h3 className="text-2xl font-black uppercase tracking-tighter text-white italic mb-6 flex items-center gap-2">
          <Globe className="w-6 h-6 text-indigo-400 animate-spin duration-10000" /> Precise Global Targeting Campaign Guide
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-slate-900 border border-white/5 rounded-3xl space-y-4">
            <span className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl inline-block text-[10px] font-black uppercase tracking-widest">TikTok & Reels</span>
            <h4 className="text-sm font-bold uppercase text-white tracking-wide">Short Form Penetration</h4>
            <p className="text-[11px] font-mono text-slate-400 leading-relaxed text-left">
              Create a direct mobile viewport showing actual screen engagement. Set the location targeting to regional commercial zones. Set age to 18-45 to prioritize builders, mobile players, and small retail vendors.
            </p>
          </div>

          <div className="p-6 bg-slate-900 border border-white/5 rounded-3xl space-y-4">
            <span className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl inline-block text-[10px] font-black uppercase tracking-widest">Meta Campaigns</span>
            <h4 className="text-sm font-bold uppercase text-white tracking-wide">Community & P2P Circles</h4>
            <p className="text-[11px] font-mono text-slate-400 leading-relaxed text-left">
              Target microfinance networks, community savings advocates, and group administrators directly on Facebook. Promote the custom 'Rotational Savings' value. Let local merchants understand escrow safety.
            </p>
          </div>

          <div className="p-6 bg-slate-900 border border-white/5 rounded-3xl space-y-4">
            <span className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl inline-block text-[10px] font-black uppercase tracking-widest">Google SEM Protocol</span>
            <h4 className="text-sm font-bold uppercase text-white tracking-wide">High Intent Operator Index</h4>
            <p className="text-[11px] font-mono text-slate-400 leading-relaxed text-left">
              Bid on strategic keywords: "secured rotate savings contributions", "trusted china direct sourcing freight line", and "fast withdraw global top-up app". Captive traffic redirects straight to native browser URLs.
            </p>
          </div>
        </div>

        {/* Master Bottom Action bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-12 bg-white/5 p-6 rounded-[2.5rem] border border-white/5 text-center sm:text-left">
          <div>
            <h4 className="text-base font-bold text-white uppercase tracking-tight">Need specific custom assets generated?</h4>
            <p className="text-[11px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">Talk to the synchronizer core for advanced campaigns</p>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="px-8 py-3.5 bg-white/5 hover:bg-white/10 active:scale-95 text-[10px] text-white font-black uppercase tracking-widest rounded-2xl transition-all border border-white/10"
            >
              Back to Advertising Hub
            </button>
            <button 
              onClick={handleExportAll}
              className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:scale-105 active:scale-95 text-[10px] text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-amber-500/20"
            >
              Export Complete Packet Now
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
