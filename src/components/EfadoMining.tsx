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
  Megaphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';

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

  const stage = STAGES[currentStageIdx];
  const progress = (sessionCoins / stage.requirement) * 100;
  const isFinalStage = currentStageIdx === STAGES.length - 1 && sessionCoins >= stage.requirement;

  const handleMine = (e: React.MouseEvent | React.TouchEvent) => {
    if ((isCelebrating && !isFinalSovereign) || showEfadoButton) return;
    
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
              <button className="p-2 bg-indigo-600 rounded-lg shadow-lg hover:scale-110 transition-transform">
                 <Wallet className="w-4 h-4 text-white" />
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
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center p-8">
        <div className="max-w-4xl w-full flex flex-col items-center gap-12">
          
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
