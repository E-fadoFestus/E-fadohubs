import React, { useState, useEffect, useRef } from 'react';
import { 
  Pickaxe, 
  Trophy, 
  Coins, 
  ChevronRight, 
  X, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Gem, 
  Crown,
  Sparkles,
  ArrowRight,
  Wallet,
  Megaphone,
  ShoppingBag,
  Shield,
  Eye,
  PlayCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { monetizationService, DEFAULT_AFFILIATE_LINKS, MEMBERSHIP_PLANS } from '../services/monetizationService';

interface MiningStage {
  id: 'E' | 'F' | 'A' | 'D' | 'O';
  name: string;
  theme: string;
  color: string;
  coinIcon: any;
  requirement: number;
}

const STAGES: MiningStage[] = [
  { id: 'E', name: 'Bronze Node', theme: 'from-orange-900 to-orange-700', color: 'orange', coinIcon: Coins, requirement: 1000 },
  { id: 'F', name: 'Silver Node', theme: 'from-slate-400 to-slate-200', color: 'slate', coinIcon: TrendingUp, requirement: 1000 },
  { id: 'A', name: 'Gold Node', theme: 'from-yellow-600 to-yellow-400', color: 'yellow', coinIcon: Crown, requirement: 1000 },
  { id: 'D', name: 'Diamond Node', theme: 'from-cyan-600 to-cyan-400', color: 'cyan', coinIcon: Gem, requirement: 1000 },
  { id: 'O', name: 'Lord Node', theme: 'from-purple-900 to-indigo-950', color: 'purple', coinIcon: ShieldCheck, requirement: 1000 },
];

export const EfadoMining: React.FC<{ user: UserProfile; onClose: () => void; onUpdateBalance?: (amount: number) => void }> = ({ user, onClose, onUpdateBalance }) => {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [isFinalSovereign, setIsFinalSovereign] = useState(false);
  const [sessionCoins, setSessionCoins] = useState(0);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [isMining, setIsMining] = useState(false);
  const [floatingCoins, setFloatingCoins] = useState<{ id: number; x: number; y: number; isCredit?: boolean }[]>([]);
  const [totalMined, setTotalMined] = useState(user.miningWallet || 0);
  const [showEfadoButton, setShowEfadoButton] = useState(false);

  // Monetization Added States
  const [isCmpConsentOpen, setIsCmpConsentOpen] = useState(!monetizationService.hasConsent() && !localStorage.getItem('efado_monetization_pref'));
  const [isCoinsShopOpen, setIsCoinsShopOpen] = useState(false);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [interstitialCountdown, setInterstitialCountdown] = useState(3);
  const [monetizationStats, setMonetizationStats] = useState(monetizationService.getMonetizationStats());
  const [stickyFooterAdClosed, setStickyFooterAdClosed] = useState(false);

  // Stripe & coins billing states
  const [selectedCoinPackage, setSelectedCoinPackage] = useState<'mild' | 'heavy' | 'sovereign' | null>(null);
  const [isProcessingStripePayment, setIsProcessingStripePayment] = useState(false);
  const [stripePaymentSuccess, setStripePaymentSuccess] = useState(false);

  const stage = STAGES[currentStageIdx];
  const progress = (sessionCoins / stage.requirement) * 100;
  const isFinalStage = currentStageIdx === STAGES.length - 1 && sessionCoins >= stage.requirement;

  const triggerInterstitialAd = (onDone: () => void) => {
    // Show premium full-screen interstitial ad
    setShowInterstitial(true);
    setInterstitialCountdown(3);
    monetizationService.logGA4Event('interstitial_ad_triggered', { stage: stage.id });
    
    const interval = setInterval(() => {
      setInterstitialCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-close countdown helper
    setTimeout(() => {
      setShowInterstitial(false);
      onDone();
      // rewarded CPM earnings
      monetizationService.logGA4Event('rewarded_ad_watched', { type: 'interstitial_claim' });
      setMonetizationStats(monetizationService.getMonetizationStats());
    }, 3200);
  };

  const handleMine = (e: React.MouseEvent | React.TouchEvent) => {
    if ((isCelebrating && !isFinalSovereign) || showEfadoButton) return;
    
    // Log real performance analytics events matching AdSense setup requirements
    monetizationService.logGA4Event('mining_button_click', { stage: stage.id, userEmail: user.email });
    monetizationService.logGA4Event('coin_mined', { amount: 1 });
    
    // Update live metrics
    setMonetizationStats(monetizationService.getMonetizationStats());

    // Get click position
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const newCoin = { id: Date.now(), x, y };
    setFloatingCoins(prev => [...prev, newCoin]);
    
    setSessionCoins(prev => prev + 1);
    setTotalMined(prev => prev + 1);
    
    // Monetary credit logic: 100 mining = 1.00 Naira
    if (isFinalSovereign) {
       if ((sessionCoins + 1) % 100 === 0) {
          // Epic zoom out credit animation
          setFloatingCoins(prev => [...prev, { id: Date.now() + 1, x: window.innerWidth / 2, y: window.innerHeight / 2, isCredit: true }]);
          
          // Add extra burst particles for celebration
          for (let i = 0; i < 8; i++) {
            setTimeout(() => {
              setFloatingCoins(prev => [...prev, { 
                id: Date.now() + 100 + i, 
                x: (window.innerWidth / 2) + (Math.random() * 200 - 100), 
                y: (window.innerHeight / 2) + (Math.random() * 200 - 100) 
              }]);
            }, i * 50);
          }
          
          // Credit 1.00 Naira per 100 mining
          if (onUpdateBalance) onUpdateBalance(1.00);
       }
    }

    setIsMining(true);
    setTimeout(() => setIsMining(false), 100);

    // Remove coin after animation
    setTimeout(() => {
      setFloatingCoins(prev => prev.filter(c => c.id !== newCoin.id));
    }, 1200);
  };

  useEffect(() => {
    if (sessionCoins >= stage.requirement && !isCelebrating && !isFinalSovereign) {
      if (currentStageIdx === STAGES.length - 1) {
        setShowEfadoButton(true);
      } else {
        setIsCelebrating(true);
      }
    }
  }, [sessionCoins, stage.requirement, isCelebrating, isFinalSovereign, currentStageIdx]);

  const handleNextStage = () => {
    triggerInterstitialAd(() => {
      if (currentStageIdx < STAGES.length - 1) {
        setCurrentStageIdx(prev => prev + 1);
        setSessionCoins(0);
        setIsCelebrating(false);
      } else {
        setIsFinalSovereign(true);
        setIsCelebrating(false);
        setShowEfadoButton(false);
        setSessionCoins(0);
      }
    });
  };

  // Cookie/Consent save
  const handleConsentChoice = (approved: boolean) => {
    monetizationService.saveConsent(approved);
    setIsCmpConsentOpen(false);
    setMonetizationStats(monetizationService.getMonetizationStats());
  };

  // Affiliate click tracking
  const handleAffiliateClick = (key: string) => {
    monetizationService.logGA4Event('affiliate_link_click', { affiliateId: key });
    setMonetizationStats(monetizationService.getMonetizationStats());
  };

  // Stripe Billing Purchase coin packages
  const handleBuyCoinPackage = (pkg: 'mild' | 'heavy' | 'sovereign') => {
    setSelectedCoinPackage(pkg);
    setIsProcessingStripePayment(true);
    setStripePaymentSuccess(false);

    // Mock Stripe checkout process
    setTimeout(() => {
      setIsProcessingStripePayment(false);
      setStripePaymentSuccess(true);
      
      let coinsToAdd = 0;
      let costNaira = 0;
      if (pkg === 'mild') {
         coinsToAdd = 1000;
         costNaira = 1000;
      } else if (pkg === 'heavy') {
         coinsToAdd = 6000;
         costNaira = 5000;
      } else {
         coinsToAdd = 15000;
         costNaira = 12000;
      }

      setTotalMined(prev => prev + coinsToAdd);
      setSessionCoins(prev => Math.min(stage.requirement, prev + coinsToAdd));
      if (onUpdateBalance) onUpdateBalance(coinsToAdd / 100); // monetary credit boost
      
      monetizationService.logGA4Event('premium_coin_package_purchased', { package: pkg, amountPaidNaira: costNaira });
      setMonetizationStats(monetizationService.getMonetizationStats());
      
      setTimeout(() => {
         setStripePaymentSuccess(false);
         setIsCoinsShopOpen(false);
         setSelectedCoinPackage(null);
      }, 2000);
    }, 1500);
  };


  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#020617] flex flex-col overflow-hidden font-sans"
    >
      {/* Dynamic Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-b ${isFinalSovereign ? 'from-indigo-600 to-black' : stage.theme} opacity-5 transition-colors duration-1000`} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-[120px] animate-pulse" />
      </div>

      {/* Strategic Header */}
      <div className="relative z-10 h-24 border-b border-white/5 flex items-center justify-between px-8 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
            <Pickaxe className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white italic tracking-tighter uppercase">
              {isFinalSovereign ? 'EFADO Sovereign Node' : 'EFADO Mining Node'}
            </h1>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
               <span className="text-[9px] font-black text-white uppercase tracking-widest">
                 {isFinalSovereign ? 'Monetary Direct Credit: Enabled' : 'Protocol Sync Active'}
               </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="hidden md:flex items-center gap-4 px-6 py-3 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Mining Assets</span>
                <div className="flex items-center gap-2">
                   <Coins className="w-4 h-4 text-amber-400" />
                   <span className="text-sm font-black text-white italic tracking-widest">{(totalMined / 100).toFixed(2)}</span>
                   <span className="text-[10px] font-black text-slate-500 uppercase">₦</span>
                </div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <button 
                onClick={() => setIsCoinsShopOpen(true)}
                className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 shadow-md shadow-indigo-500/20"
              >
                 <ShoppingBag className="w-3.5 h-3.5 text-white" /> Buy Coins
              </button>
           </div>
           
           <button 
             onClick={onClose}
             className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all group"
           >
             <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative z-10 flex flex-col items-center overflow-y-auto w-full p-8 pb-32">
        <div className="max-w-4xl w-full flex flex-col items-center gap-12">
          
          {/* TOP AD: Google AdSense Display Ads - Banner unit */}
          <div className="w-full max-w-xl mx-auto p-2.5 bg-slate-950/80 border border-slate-850 rounded-xl flex flex-col justify-center items-center gap-1.5 shadow-md relative overflow-hidden group">
            <span className="absolute top-1 right-2 text-[8px] font-black text-slate-500 uppercase tracking-widest">Sponsored Ads by Google</span>
            <div className="flex items-center gap-3 w-full px-4">
              <div className="w-10 h-10 bg-indigo-600/10 rounded-lg flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <h5 className="text-xs font-black text-white uppercase italic tracking-tight">Protect Your Nodes & Secure Remote Extraction</h5>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Fast Secure VPN connection starting at $1.99. Register now with 65% discount code.</p>
              </div>
              <a 
                href="https://go.nordvpn.net/affiliate?offer_id=15&aff_id=efado-hubs" 
                target="_blank" 
                rel="noreferrer"
                onClick={() => handleAffiliateClick('nordvpn-elite')}
                className="px-4 py-2 bg-[#DAA520] hover:bg-yellow-500 text-slate-950 font-black rounded-lg text-[9px] uppercase tracking-wider transition-all"
              >
                Sign Up
              </a>
            </div>
          </div>
          
          {/* Real-time Session Wallet (Encouragement Indicator) */}
          {isFinalSovereign && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-emerald-500/20 px-8 py-4 rounded-[2rem] backdrop-blur-3xl flex items-center gap-6 shadow-2xl shadow-emerald-500/10"
            >
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-100 uppercase tracking-widest">Sovereign Session Rewards</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-emerald-400 italic tracking-tighter">₦{(sessionCoins / 100).toFixed(2)}</span>
                  <span className="text-[10px] font-black text-white uppercase animate-pulse">Accumulating</span>
                </div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="w-12 h-12 bg-emerald-600/20 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
            </motion.div>
          )}

          {/* Stage Progress Tracker */}
          {!isFinalSovereign ? (
            <div className="w-full space-y-6">
              <div className="flex justify-between items-end px-2">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Operational Cluster</p>
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">{stage.name}</h2>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-white italic">{sessionCoins} / {stage.requirement}</p>
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">Node Capacity</p>
                </div>
              </div>
              
              <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${progress}%` }}
                   className={`h-full bg-gradient-to-r ${stage.theme} shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all`}
                 />
              </div>

              <div className="flex justify-between items-center px-2">
                 <div className="flex gap-2">
                   {STAGES.map((s, idx) => (
                     <div 
                       key={s.id}
                       className={`w-8 h-2 rounded-full transition-all duration-500 ${
                         idx === currentStageIdx ? `bg-white shadow-[0_0_10px_white]` : 
                         idx < currentStageIdx ? `bg-emerald-500` : `bg-white/10`
                       }`}
                     />
                   ))}
                 </div>
                 <span className="text-[10px] font-black text-white uppercase tracking-widest">Stage {currentStageIdx + 1} of 5</span>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className="px-8 py-3 bg-indigo-600 rounded-full inline-block shadow-2xl shadow-indigo-500/20"
               >
                 <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Full EFADO Sovereignty Established</span>
               </motion.div>
               <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter shadow-indigo-500/20">Unlimited Extraction</h2>
               <div className="flex items-center justify-center gap-4 text-emerald-400">
                  <Zap className="w-5 h-5 fill-current" />
                  <span className="text-[11px] font-black uppercase tracking-widest italic">100 Coins = ₦1.00 Direct Credit</span>
               </div>
            </div>
          )}

          {/* Mining Core */}
          <div className="relative">
            {/* Pulsing Back Glow */}
            <AnimatePresence>
               {isMining && (
                 <motion.div 
                   initial={{ scale: 0.8, opacity: 0 }}
                   animate={{ scale: 1.4, opacity: 0.2 }}
                   exit={{ opacity: 0 }}
                   className={`absolute inset-0 rounded-full bg-gradient-to-r ${isFinalSovereign ? 'from-emerald-400 to-indigo-600' : stage.theme} blur-3xl pointer-events-none`}
                 />
               )}
            </AnimatePresence>

            {/* Tap/Click Area */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onMouseDown={handleMine}
              onTouchStart={(e) => {
                e.preventDefault();
                handleMine(e);
              }}
              className="relative w-64 h-64 md:w-80 md:h-80 bg-slate-900 border-8 border-white/10 rounded-[4rem] flex flex-col items-center justify-center shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] group overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${isFinalSovereign ? 'from-indigo-600 to-emerald-600' : stage.theme} opacity-0 group-hover:opacity-10 transition-opacity`} />
              
              <div className="relative z-10 flex flex-col items-center">
                 <motion.div
                   animate={isMining ? { rotate: [0, -10, 10, 0] } : {}}
                   transition={{ duration: 0.2 }}
                 >
                   {isFinalSovereign ? (
                     <Sparkles className="w-24 h-24 md:w-32 md:h-32 text-indigo-400 group-hover:text-white transition-colors" />
                   ) : (
                     <Pickaxe className="w-24 h-24 md:w-32 md:h-32 text-indigo-500 group-hover:text-indigo-400 transition-colors" />
                   )}
                 </motion.div>
                 <span className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em] mt-4">
                   {isFinalSovereign ? 'RFADO' : 'Mine EFADO'}
                 </span>
              </div>

              {/* Floating stage character */}
              <div className="absolute top-4 right-6">
                <span className="text-8xl font-black text-white/5 italic select-none pointer-events-none uppercase">
                  {isFinalSovereign ? 'EFADO' : stage.id}
                </span>
              </div>

              <AnimatePresence>
                {showEfadoButton && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6"
                  >
                    <button 
                      onClick={handleNextStage}
                      className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-[0.3em] text-[12px] shadow-2xl shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all animate-pulse"
                    >
                      EFADO
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Floating Coin Particles */}
            <AnimatePresence>
              {floatingCoins.map(coin => (
                <motion.div
                  key={coin.id}
                  initial={{ 
                    opacity: 1, 
                    y: coin.isCredit ? 0 : coin.y - 100, 
                    x: coin.isCredit ? 0 : coin.x - 50, 
                    scale: coin.isCredit ? 0.5 : 1 
                  }}
                  animate={coin.isCredit ? {
                    scale: [0.5, 3.5, 1],
                    opacity: [0, 1, 0],
                    y: -100
                  } : { 
                    opacity: 0, 
                    y: coin.y - 300, 
                    scale: 1.5 
                  }}
                  transition={coin.isCredit ? { duration: 1.5, ease: "easeOut" } : { duration: 1 }}
                  className={`${coin.isCredit ? 'fixed inset-0 m-auto flex items-center justify-center' : 'fixed'} z-50 pointer-events-none`}
                  style={!coin.isCredit ? { left: 0, top: 0 } : {}}
                >
                  {coin.isCredit ? (
                    <div className="flex flex-col items-center">
                       <span className="text-8xl font-black text-emerald-400 italic drop-shadow-[0_0_40px_rgba(52,211,153,0.5)]">₦1.000</span>
                       <span className="text-sm font-black text-white uppercase tracking-[0.5em] mt-4">Sovereign Credit Synced</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <stage.coinIcon className={`w-8 h-8 md:w-10 md:h-10 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]`} />
                      <span className="text-2xl font-black text-white italic">+1</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="text-center space-y-2">
            <p className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Sector Protocol</p>
            <h3 className="text-xl font-black text-white uppercase italic tracking-widest">
              {isFinalSovereign ? 'EFADO Sovereign Extraction' : stage.id === 'O' ? 'Lord Protocol Engagement' : `${stage.name} Extraction`}
            </h3>
          </div>

          {/* IN-CONTENT AD: Adaptive Native Article Ad */}
          <div className="w-full max-w-xl p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col gap-3 shadow-md relative overflow-hidden group">
            <span className="absolute top-2 right-3 text-[7px] font-black text-[#DAA520]/50 uppercase tracking-widest">AdSense Premium Node Match</span>
            <div className="flex items-center gap-4">
              <img 
                src="https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=200&auto=format&fit=crop" 
                alt="Cloud Hosting" 
                className="w-16 h-16 rounded-xl object-cover border border-slate-850"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 text-left">
                <h5 className="text-sm font-black text-white uppercase italic tracking-tight leading-tight">Elite Cloud VPS Hosting - Scaled For Coin Arbitrage</h5>
                <p className="text-[10px] text-slate-400 font-medium">Get 99.99% uptime powered by blazing-fast CDNs. Perfect for high-volume blockchain traffic extraction hubs.</p>
              </div>
            </div>
            <div className="flex justify-between items-center bg-slate-900 px-3 py-2 rounded-xl">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Estimated CPM: $34.50 • Lazy Loading Enabled</span>
              <a 
                href="https://siteground.com/?aff=efado-sovereign-node"
                target="_blank"
                rel="noreferrer"
                onClick={() => handleAffiliateClick('siteground-hosting')}
                className="px-3 py-1.5 bg-[#DAA520] hover:bg-yellow-500 text-slate-950 font-black rounded-lg text-[9px] uppercase tracking-wider transition-all"
              >
                Deploy Site
              </a>
            </div>
          </div>

          {/* AFFILIATE SECTION: Recommended Mining Tools */}
          <div className="w-full max-w-2xl mt-8 space-y-4">
             <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                   <Megaphone className="w-5 h-5 text-indigo-400" />
                   <h4 className="text-sm font-black text-white uppercase italic tracking-wider">Recommended Mining Acceleration Tools</h4>
                </div>
                <span className="text-[8px] font-black text-[#DAA520] uppercase tracking-widest bg-[#DAA520]/10 px-2 py-1 rounded">FTC Legal Disclosure Active</span>
             </div>
             
             <p className="text-[10.5px] text-slate-400 italic text-left">
                Disclosure: EFADO receives a standard referral commission when you purchase hardware, VPN shields, or packages via our secure links below. This funds direct server hosting & WAEC/JAMB webinar support.
             </p>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DEFAULT_AFFILIATE_LINKS.map(item => (
                   <div key={item.key} className="bg-slate-950 border border-white/5 hover:border-indigo-500/30 rounded-2xl p-4 flex flex-col justify-between transition-all hover:scale-[1.01] text-left">
                      <div className="space-y-2">
                         <div className="flex justify-between items-start">
                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded">
                               {item.category}
                            </span>
                            <span className="text-[9px] font-black text-emerald-400 uppercase">
                               {item.commission}
                            </span>
                         </div>
                         <h5 className="text-xs font-black text-white uppercase italic tracking-tight leading-tight">{item.title}</h5>
                         <p className="text-[10px] text-slate-400 leading-snug">{item.description}</p>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                         <span className="text-[9px] font-mono text-slate-500">{item.prettyUrl}</span>
                         <a 
                            href={item.destinationUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => handleAffiliateClick(item.key)}
                            className="px-3 py-1 bg-white text-black hover:bg-[#DAA520] transition-all rounded-lg text-[9px] font-black uppercase tracking-wider"
                         >
                            Deploy Link
                         </a>
                      </div>
                   </div>
                ))}
             </div>
          </div>

        </div>
      </div>

      {/* Completion Modal */}
      <AnimatePresence>
        {isCelebrating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-8"
          >
            {/* Rain of Confetti (Simplified) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
               {[...Array(20)].map((_, i) => (
                 <motion.div
                   key={i}
                   initial={{ y: -100, x: Math.random() * window.innerWidth }}
                   animate={{ 
                     y: window.innerHeight + 100,
                     rotate: 360,
                     x: (Math.random() * 200) - 100 + (Math.random() * window.innerWidth)
                   }}
                   transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: 'linear' }}
                   className={`w-3 h-3 rounded-full bg-gradient-to-r ${stage.theme}`}
                 />
               ))}
            </div>

            <motion.div 
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md w-full bg-white rounded-[3.5rem] p-12 text-center relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />
              
              <div className="relative z-10 space-y-8">
                <div className="w-24 h-24 bg-slate-950 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl rotate-12 mb-6">
                  <Trophy className="w-12 h-12 text-amber-400" />
                </div>
                
                <h2 className="text-4xl font-black text-slate-950 italic uppercase tracking-tighter">Congratulations!</h2>
                <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 flex items-center gap-4 text-left">
                   <div className={`w-12 h-12 bg-gradient-to-br ${stage.theme} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <span className="text-2xl font-black text-white italic">{stage.id}</span>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-950 uppercase tracking-widest">Achievement Unlocked</p>
                      <p className="text-[11px] font-black text-slate-950 uppercase">
                        EFADO "{stage.id}" {
                          stage.id === 'E' ? 'BRONZE' : 
                          stage.id === 'F' ? 'SILVER' : 
                          stage.id === 'A' ? 'GOLD' : 
                          stage.id === 'D' ? 'DIAMOND' : 'LORD'
                        } COINS
                      </p>
                   </div>
                </div>

                <p className="text-sm font-black text-slate-950 leading-relaxed italic">
                  {stage.id === 'O' ? (
                    'The spell is complete. You have established the Full EFADO Sovereign. Final protocol ready.'
                  ) : (
                    `Congratulations, you have won the EFADO "${stage.id}" ${
                      stage.id === 'E' ? 'BRONZE' : 
                      stage.id === 'F' ? 'SILVER' : 
                      stage.id === 'A' ? 'GOLD' : 
                      stage.id === 'D' ? 'DIAMOND' : 'LORD'
                    } COINS. CLICK NEXT FOR THE NEXT STAGE.`
                  )}
                </p>

                <button 
                  onClick={handleNextStage}
                  className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black uppercase tracking-[0.25em] text-[11px] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-2xl group"
                >
                  {currentStageIdx < STAGES.length - 1 ? (
                    <>
                      Click Next for the next stage "{STAGES[currentStageIdx+1].id} {
                        STAGES[currentStageIdx + 1].id === 'E' ? 'BRONZE' : 
                        STAGES[currentStageIdx + 1].id === 'F' ? 'SILVER' : 
                        STAGES[currentStageIdx + 1].id === 'A' ? 'GOLD' : 
                        STAGES[currentStageIdx + 1].id === 'D' ? 'DIAMOND' : 'LORD'
                      } COINS" <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  ) : (
                    <>
                      Establish Full EFADO Sovereign <Pickaxe className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENDER DYNAMIC MONETIZATION COMPONENTS */}

      {/* 1. Global GDPR Consent Management (CMP) Cookie Banner */}
      <AnimatePresence>
        {isCmpConsentOpen && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-[200] bg-slate-900/95 border-2 border-indigo-500/30 backdrop-blur-2xl p-6 rounded-3xl shadow-2xl text-left"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-indigo-400" />
                <h4 className="text-sm font-black text-white uppercase tracking-wider">Privacy & Consent Protocols</h4>
              </div>
              <p className="text-[10.5px] text-slate-400 leading-relaxed font-medium">
                We utilize essential cookies & strategic display ads (Google AdSense) to fund ongoing servers, WAEC/JAMB simulators, and remote workspace connections. By accepting, you consent to ad personalization & event trackers.
              </p>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => handleConsentChoice(true)}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-505 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                >
                  Accept & Mine
                </button>
                <button 
                  onClick={() => handleConsentChoice(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-705 text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                >
                  Reject
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Full-Screen Interstitial Ad on Node Escalation */}
      <AnimatePresence>
        {showInterstitial && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] bg-slate-950 flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="absolute top-4 right-4 text-[9px] font-mono text-slate-500 uppercase">
              Sovereign Interstitial Ad Space
            </div>
            
            <div className="max-w-lg w-full space-y-8">
              <div className="relative aspect-video w-full bg-slate-900 border border-white/5 rounded-3xl flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 rounded text-[8px] font-black text-[#DAA520] uppercase border border-[#DAA520]/20">
                  Google Sponsored
                </div>
                {/* Simulated high quality ad content */}
                <PlayCircle className="w-16 h-16 text-[#DAA520] animate-pulse mb-3" />
                <h4 className="text-lg font-black text-white uppercase italic tracking-wider px-6">AWS Certified Cloud Practitioner - Premium Course</h4>
                <p className="text-xs text-slate-400 px-8 mt-1">Accelerate your AWS skills with certified instructors. Access templates, exams, and labs.</p>
                <div className="absolute bottom-3 right-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  Estimated eCPM: $18.25
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Node Escalation Ad Playing</h3>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Your next EFADO node tier is unlocking in <span className="text-white font-bold">{interstitialCountdown}s</span>...</p>
                
                <div className="h-2 w-48 bg-white/5 border border-white/10 rounded-full overflow-hidden mx-auto">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: "100%" }}
                     transition={{ duration: 3.2, ease: "linear" }}
                     className="bg-gradient-to-r from-[#DAA520] to-yellow-400 h-full"
                   />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Premium Coins Shop Modal (Stripe billing layout) */}
      <AnimatePresence>
        {isCoinsShopOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 md:p-10 max-w-2xl w-full shadow-2xl relative overflow-y-auto max-h-[90vh]"
            >
              <button 
                onClick={() => setIsCoinsShopOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-4 mb-6 text-left">
                <div className="w-12 h-12 bg-[#DAA520]/10 border border-[#DAA520]/20 rounded-2xl flex items-center justify-center text-[#DAA520] shadow-lg">
                  <Coins className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Premium Coins Node Shop</h3>
                  <p className="text-[9px] font-black text-[#DAA520] uppercase tracking-widest">Bypass resource limits & buy coin packs directly</p>
                </div>
              </div>

              {/* Package cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
                {[
                  { id: 'mild', coins: '1,000 Coins', price: '₦1,000', label: 'Starter Pack', desc: 'Credit 1,000 extraction coins instantly' },
                  { id: 'heavy', coins: '6,000 Coins', price: '₦5,000', label: 'Divine Speed', desc: 'Save ₦1,000. Double mining rates synced' },
                  { id: 'sovereign', coins: '15,000 Coins', price: '₦12,000', label: 'Eminent Lord', desc: 'Sovereign tier status. Priority direct cashouts' }
                ].map(pkg => (
                  <div 
                    key={pkg.id}
                    onClick={() => handleBuyCoinPackage(pkg.id as any)}
                    className="cursor-pointer bg-slate-950 border border-white/5 hover:border-[#DAA520]/40 rounded-2xl p-5 flex flex-col justify-between transition-all hover:scale-[1.02]"
                  >
                    <div className="space-y-2">
                      <span className="text-[8px] font-black text-[#DAA520] uppercase bg-[#DAA520]/10 px-2.5 py-0.5 rounded-full inline-block">
                        {pkg.label}
                      </span>
                      <h4 className="text-lg font-black text-white italic">{pkg.coins}</h4>
                      <p className="text-[10px] text-slate-400">{pkg.desc}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-sm font-black text-emerald-400">{pkg.price}</span>
                      <button className="px-3 py-1 bg-white text-slate-900 rounded-lg text-[9px] font-black uppercase tracking-wider">
                        Procure
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stripe Credit Card Simulated Form block */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 text-left">
                 <h4 className="text-xs font-black text-white uppercase tracking-wider mb-4">Secure Stripe Gateway Connectivity</h4>
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Credit Card Number</label>
                          <input type="text" placeholder="•••• •••• •••• ••••" disabled className="w-full mt-1.5 px-4 py-3 bg-slate-900 border border-white/5 rounded-xl text-slate-400 text-xs focus:outline-none placeholder-slate-600" />
                       </div>
                       <div>
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Cardholder Full Name</label>
                          <input type="text" placeholder={user.displayName || "Okhawere Festus"} disabled className="w-full mt-1.5 px-4 py-3 bg-slate-900 border border-white/5 rounded-xl text-slate-400 text-xs focus:outline-none placeholder-slate-600" />
                       </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                       <div className="col-span-2">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Valid Thru</label>
                          <input type="text" placeholder="MM / YY" disabled className="w-full mt-1.5 px-4 py-3 bg-slate-900 border border-white/5 rounded-xl text-slate-400 text-xs text-center focus:outline-none placeholder-slate-600" />
                       </div>
                       <div>
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider">CVC</label>
                          <input type="text" placeholder="•••" disabled className="w-full mt-1.5 px-4 py-3 bg-slate-900 border border-white/5 rounded-xl text-slate-400 text-xs text-center focus:outline-none" />
                       </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-white/5">
                       <p className="text-[8px] font-mono text-slate-500 uppercase">SSL Encrypted / PCI-DSS Compliant Integration</p>
                       <span className="text-[9px] font-black text-rose-500 uppercase">Stripe Sandbox Active</span>
                    </div>
                 </div>
              </div>

              {/* Sandbox Stripe feedback */}
              <AnimatePresence>
                {isProcessingStripePayment && (
                  <motion.div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 rounded-[2.5rem]">
                     <div className="w-12 h-12 rounded-full border-4 border-[#DAA520] border-t-transparent animate-spin mb-4" />
                     <h4 className="text-sm font-black text-white uppercase tracking-wider">Contacting Stripe Server Nodes...</h4>
                     <p className="text-[10px] text-slate-400">Verifying customer balance & secure key release</p>
                  </motion.div>
                )}
                {stripePaymentSuccess && (
                  <motion.div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 rounded-[2.5rem] text-center">
                     <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mb-4 text-emerald-400 border border-emerald-500/20">
                        <ShieldCheck className="w-8 h-8" />
                     </div>
                     <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Stripe Payment Approved</h3>
                     <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mt-1">Naira equivalents converted & coins credited!</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Sticky Footer Ad Unit */}
      {!stickyFooterAdClosed && (
        <div className="fixed bottom-0 left-0 w-full z-45 bg-slate-950 border-t border-indigo-500/20 backdrop-blur-xl py-3.5 px-6 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-3">
            <span className="px-1.5 py-0.5 bg-[#DAA520] text-slate-950 text-[7px] font-black uppercase tracking-widest rounded leading-none">SPONSORED</span>
            <p className="text-[10.5px] font-black text-slate-305 uppercase italic tracking-wide leading-none">
               Double Your Extractions: Setup premium Cloudflare SSL/CDN on your nodes now! Save 40% globally.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://cloudflare.com/?r=efado-cdn-accel" 
              target="_blank" 
              rel="noreferrer"
              onClick={() => handleAffiliateClick('cloudflare-cdn')}
              className="px-4 py-1.5 bg-[#DAA520] hover:bg-yellow-500 text-slate-950 text-[9px] font-black uppercase tracking-widest rounded-lg transition-transform hover:scale-105"
            >
              Accelerate Sync
            </a>
            <button 
              onClick={() => setStickyFooterAdClosed(true)}
              className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Footer / Mining Terminal Info */}
      <div className="relative z-10 h-20 border-t border-white/5 bg-slate-900/50 backdrop-blur-2xl px-8 flex items-center justify-between">
         <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
               <Zap className="w-4 h-4 text-amber-500" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency: 1.0x</span>
            </div>
            <div className="flex items-center gap-2">
               <Sparkles className="w-4 h-4 text-indigo-400" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hash Rate: Auto-Sync</span>
            </div>
         </div>
         
         <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">
           Protected by EFADO Blockchain Integrity Protocol
         </div>
      </div>
    </motion.div>
  );
};

export const MiningMiniCard: React.FC<{ user: UserProfile; onOpenFull: () => void }> = ({ user, onOpenFull }) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-slate-900 border border-[#DAA520]/30 rounded-[2.5rem] p-6 relative overflow-hidden group cursor-pointer shadow-2xl"
      onClick={onOpenFull}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-600/20 transition-all" />
      
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 bg-[#DAA520]/10 rounded-2xl flex items-center justify-center text-[#DAA520] border border-[#DAA520]/20">
            <Pickaxe className="w-6 h-6" />
          </div>
             <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Balance</p>
                <p className="text-sm font-black text-white italic tracking-widest">₦{((user.miningWallet || 0) / 100).toFixed(2)}</p>
             </div>
        </div>
        
        <div>
          <h4 className="text-sm font-black text-white uppercase italic tracking-tight mb-1">EFADO Mining Core</h4>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Protocol Ready
          </p>
        </div>

        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
           <div className="h-full w-2/3 bg-gradient-to-r from-[#DAA520] to-amber-400 shadow-[0_0_10px_#DAA520]" />
        </div>

        <button className="w-full py-3 bg-[#DAA520] text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg group-hover:scale-105 transition-all">
          Launch Extraction Unit
        </button>
      </div>
    </motion.div>
  );
};

interface AdvertisingMiniCardProps {
  onAdvert: () => void;
  onSell: () => void;
}

export const AdvertisingMiniCard: React.FC<AdvertisingMiniCardProps> = ({ onAdvert, onSell }) => {
  return (
    <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group border border-white/5 text-left">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700" />
      <div className="relative z-10 space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-indigo-400">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-black text-white uppercase tracking-tighter italic leading-none">Strategic Ads</h4>
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-1">Universal Reach</p>
          </div>
        </div>
        
        <p className="text-xs font-black text-slate-300 leading-relaxed uppercase tracking-tighter">
          Manifest your products & services globally. From hotels to farm products.
        </p>

        <div className="flex gap-4">
          <button 
            onClick={onAdvert}
            className="flex-grow py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-500/10"
          >
            Advertise on EFADO
          </button>
          <button 
            onClick={onSell}
            className="flex-grow py-3 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            Sell
          </button>
        </div>
      </div>
    </div>
  );
};
