import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Coins, 
  Plus, 
  ChevronDown, 
  ChevronUp,
  Volume2,
  VolumeX,
  Music,
  Users,
  MessageSquareIcon,
  Zap,
  TrendingUp,
  Star
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface Reel {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  videoUrl: string;
  caption: string;
  likes: string[];
  comments: any[];
  shares: number;
  tags?: string[];
}

interface ReelFeedProps {
  user: any;
  onOpenCreator: () => void;
  onLike: (id: string) => void;
  onShare: (item: any) => void;
  onTip: (id: string) => void;
}

export const ReelFeed: React.FC<ReelFeedProps> = ({ user, onOpenCreator, onLike, onShare, onTip }) => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showPulseEffect, setShowPulseEffect] = useState(false);
  const [pulseComments, setPulseComments] = useState<{id: string, text: string, x: number, y: number}[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'reels'), orderBy('createdAt', 'desc'), limit(10));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reel));
      if (data.length > 0) {
        setReels(data);
      } else {
        // Fallback mock reels if none in DB
        setReels([
          {
            id: 'mock-1',
            authorId: 'system',
            authorName: 'EFADO Viral',
            authorPhoto: 'https://picsum.photos/seed/efado/100/100',
            videoUrl: 'https://picsum.photos/seed/reels/1080/1920',
            caption: 'Welcome to the new era of EFADO Hubs! 🚀 #Tactical #Viral',
            likes: [],
            comments: [],
            shares: 124,
            tags: ['#Future', '#EFADO']
          },
          {
             id: 'mock-2',
             authorId: 'system',
             authorName: 'Tech Hub',
             authorPhoto: 'https://picsum.photos/seed/tech/100/100',
             videoUrl: 'https://picsum.photos/seed/techreel/1080/1920',
             caption: 'Deploying intelligence across global nodes. 💻 #Tech #Innovation',
             likes: [],
             comments: [],
             shares: 89,
             tags: ['#Build', '#Scale']
          }
        ]);
      }
    });
    return unsub;
  }, []);

  const handleScroll = (direction: 'UP' | 'DOWN') => {
    if (direction === 'DOWN' && activeIndex < reels.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else if (direction === 'UP' && activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  // Viral Pulse Effect Simulation
  useEffect(() => {
    const interval = setInterval(() => {
       if (Math.random() > 0.7) {
         const id = Math.random().toString();
         const texts = ["OMG! 🔥", "Tactical!", "EFADO 🚀", "Big vibes", "Let's gooo", "💯 💯", "Wow!!"];
         setPulseComments(prev => [...prev, {
            id,
            text: texts[Math.floor(Math.random() * texts.length)],
            x: 20 + Math.random() * 60,
            y: 50 + Math.random() * 30
         }].slice(-5));
         
         setTimeout(() => {
            setPulseComments(prev => prev.filter(c => c.id !== id));
         }, 2000);
       }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-lg h-full aspect-[9/16] bg-black md:rounded-[3rem] shadow-infinite relative overflow-hidden group">
      <AnimatePresence mode="wait">
        <motion.div 
          key={reels[activeIndex]?.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-0"
        >
          {reels[activeIndex]?.videoUrl && (
            reels[activeIndex].videoUrl.startsWith('data:video') || 
            reels[activeIndex].videoUrl.startsWith('blob:') || 
            reels[activeIndex].videoUrl.includes('.mp4') || 
            reels[activeIndex].videoUrl.includes('.webm') || 
            reels[activeIndex].videoUrl.includes('movie') ||
            reels[activeIndex].videoUrl.includes('video') ||
            (reels[activeIndex].id !== 'mock_1' && reels[activeIndex].id !== 'mock_2' && reels[activeIndex].id !== 'mock_3')
          ) ? (
            <video 
              src={reels[activeIndex]?.videoUrl} 
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover transition-all duration-700 hover:scale-105"
            />
          ) : (
            <img 
              src={reels[activeIndex]?.videoUrl} 
              alt="Reel" 
              className="w-full h-full object-cover grayscale brightness-90 transition-all duration-700 hover:scale-105" 
              referrerPolicy="no-referrer" 
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
        </motion.div>
      </AnimatePresence>

      {/* Floating Pulse Comments */}
      <div className="absolute inset-0 pointer-events-none z-10">
         <AnimatePresence>
            {pulseComments.map(comment => (
               <motion.div 
                 key={comment.id}
                 initial={{ opacity: 0, scale: 0.5, y: 0 }}
                 animate={{ opacity: 1, scale: 1, y: -100 }}
                 exit={{ opacity: 0 }}
                 className="absolute text-white font-black uppercase tracking-tighter italic text-xs drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                 style={{ left: `${comment.x}%`, top: `${comment.y}%` }}
               >
                 {comment.text}
               </motion.div>
            ))}
         </AnimatePresence>
      </div>
      
      {/* Navigation Controls Overlay */}
      <div className="absolute inset-y-0 left-0 right-0 z-20 flex flex-col items-center justify-between pointer-events-none p-6">
         <div className="w-full flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
               <TrendingUp className="w-4 h-4 text-amber-500" />
               <span className="text-[9px] font-black text-white uppercase tracking-widest">Viral Pulse: High</span>
            </div>
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
            >
               {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
         </div>

         <div className="flex flex-col gap-4 pointer-events-auto">
            <button 
              onClick={() => handleScroll('UP')}
              disabled={activeIndex === 0}
              className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white disabled:opacity-30 hover:bg-white/20"
            >
               <ChevronUp className="w-6 h-6" />
            </button>
            <button 
              onClick={() => handleScroll('DOWN')}
              disabled={activeIndex === reels.length - 1}
              className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white disabled:opacity-30 hover:bg-white/20"
            >
               <ChevronDown className="w-6 h-6" />
            </button>
         </div>
         <div className="h-20" />
      </div>

      {/* Reel UI Overlays */}
      <div className="absolute bottom-12 left-0 right-0 p-8 z-30">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 rounded-full border-2 border-indigo-500 p-0.5 shadow-2xl overflow-hidden scale-110">
            <img src={reels[activeIndex]?.authorPhoto || 'https://picsum.photos/seed/user1/100/100'} alt="Author" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
          </div>
          <div className="flex flex-col">
             <div className="flex items-center gap-2">
               <p className="text-white font-black uppercase tracking-tight text-sm">@{reels[activeIndex]?.authorName.toLowerCase().replace(/\s/g, '_')}</p>
               <button className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest transition-all">Follow</button>
             </div>
             <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                <Music className="w-2 h-2" />
                Original Audio - EFADO Tactical Hub
             </p>
          </div>
        </div>
        <p className="text-white font-medium text-sm mb-8 line-clamp-2 max-w-[85%] leading-relaxed drop-shadow-lg">
           {reels[activeIndex]?.caption}
        </p>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={onOpenCreator}
            className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-500/20 group/create"
          >
            <Plus className="w-5 h-5 text-white" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Create Reel</span>
          </button>
          
          <div className="flex -space-x-3">
             {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-black overflow-hidden bg-slate-800">
                   <img src={`https://picsum.photos/seed/${i + 10}/50/50`} alt="Watcher" referrerPolicy="no-referrer" />
                </div>
             ))}
             <div className="w-8 h-8 rounded-full border-2 border-black bg-indigo-900 flex items-center justify-center text-[8px] font-black text-white">
                +4K
             </div>
          </div>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="absolute right-6 bottom-24 flex flex-col items-center gap-8 z-40">
        <button 
          onClick={() => onLike(reels[activeIndex]?.id)}
          className="flex flex-col items-center gap-2 group/action"
        >
          <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 flex items-center justify-center group-hover/action:bg-rose-500 group-hover/action:border-rose-400 transition-all shadow-3xl">
            <Heart className="w-7 h-7 text-white fill-transparent group-hover/action:fill-white transition-all" />
          </div>
          <span className="text-[11px] font-black text-white uppercase tracking-widest">{reels[activeIndex]?.likes.length || '12.4K'}</span>
        </button>

        <button className="flex flex-col items-center gap-2 group/action">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 flex items-center justify-center group-hover/action:bg-indigo-600 group-hover/action:border-indigo-500 transition-all shadow-3xl">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <span className="text-[11px] font-black text-white uppercase tracking-widest">{reels[activeIndex]?.comments.length || '842'}</span>
        </button>

        <button 
          onClick={() => onTip(reels[activeIndex]?.id)}
          className="flex flex-col items-center gap-2 group/action"
        >
          <div className="w-14 h-14 bg-amber-600 rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-xl shadow-amber-500/20">
            <Coins className="w-7 h-7 text-white" />
          </div>
          <span className="text-[11px] font-black text-white uppercase tracking-widest">Tip</span>
        </button>

        <button 
          onClick={() => onShare(reels[activeIndex])}
          className="flex flex-col items-center gap-2 group/action"
        >
          <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 flex items-center justify-center group-hover/action:bg-emerald-600 group-hover/action:border-emerald-500 transition-all shadow-3xl">
            <Share2 className="w-7 h-7 text-white" />
          </div>
          <span className="text-[11px] font-black text-white uppercase tracking-widest">{reels[activeIndex]?.shares || 'Share'}</span>
        </button>
      </div>

      {/* Hub Branding */}
      <div className="absolute top-12 right-12 z-40 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2">
         <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
         <span className="text-[10px] font-black text-white uppercase tracking-widest">EFADO Elite Hub</span>
      </div>
    </div>
  );
};
