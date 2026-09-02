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
  Bookmark,
  Send,
  X,
  Check,
  Flame,
  Sparkles,
  Zap,
  TrendingUp,
  Gift
} from 'lucide-react';
import { collection, query, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { recordQualifiedView } from '../lib/creatorMonetization';

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
  createdAt?: any;
}

interface ReelFeedProps {
  user: any;
  onOpenCreator: () => void;
  onLike: (id: string) => void;
  onShare: (item: any) => void;
  onTip: (id: string) => void;
  onSelectTag?: (tag: string) => void;
}

export const ReelFeed: React.FC<ReelFeedProps> = ({ 
  user, 
  onOpenCreator, 
  onLike, 
  onShare, 
  onTip,
  onSelectTag 
}) => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [likedReels, setLikedReels] = useState<string[]>([]);
  const [savedReels, setSavedReels] = useState<string[]>([]);
  const [followingAuthors, setFollowingAuthors] = useState<string[]>([]);
  
  // Comments modal state
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [activeComments, setActiveComments] = useState<Array<{ id: string; user: string; text: string }>>([
    { id: '1', user: 'Blessing_N', text: 'This video reel player is super smooth! 🔥' },
    { id: '2', user: 'Tunde_Tech', text: 'EFADO is building the true super app for Africa 🚀' },
    { id: '3', user: 'Chioma_Vibe', text: 'Loving the audio track and quality 🎵' }
  ]);
  const [newCommentText, setNewCommentText] = useState('');

  // 5-second qualified view tracking
  const [watchSeconds, setWatchSeconds] = useState(0);
  const [earnedViewToast, setEarnedViewToast] = useState(false);
  const touchStartYRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'reels'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reel));
      data.sort((a, b) => {
        const tA = a.createdAt?.seconds || (a.createdAt instanceof Date ? a.createdAt.getTime() / 1000 : 0);
        const tB = b.createdAt?.seconds || (b.createdAt instanceof Date ? b.createdAt.getTime() / 1000 : 0);
        return tB - tA;
      });

      if (data.length > 0) {
        setReels(data);
      } else {
        setReels([
          {
            id: 'mock-1',
            authorId: 'dj_vibe',
            authorName: 'DJ Blaze',
            authorPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-shot-of-a-woman-smiling-at-the-camera-41584-large.mp4',
            caption: 'Welcome to the global era of EFADO Reels! 🚀 Create, stream & monetize your craft! #Viral #Reels #EFADO #Music',
            likes: ['user1', 'user2', 'user3', 'user4'],
            comments: [{ id: 'c1', authorName: 'Chioma', text: 'This video reel player is super slick! 🔥' }],
            shares: 482,
            tags: ['#Viral', '#EFADO', '#Music']
          },
          {
            id: 'mock-2',
            authorId: 'tech_guru',
            authorName: 'Tech Vanguard',
            authorPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
            videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-working-on-her-laptop-in-a-coffee-shop-40340-large.mp4',
            caption: 'Building next-gen fintech in Lagos 💻 Share your reels and earn ₦100 per 1k views! #Tech #Innovation #Business',
            likes: ['user1', 'user5'],
            comments: [{ id: 'c2', authorName: 'Emeka', text: 'This beats Facebook reels completely!' }],
            shares: 319,
            tags: ['#Tech', '#Innovation', '#Business']
          },
          {
            id: 'mock-3',
            authorId: 'afritunes',
            authorName: 'Brother Paul',
            authorPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
            videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smartphone-scrolling-through-a-social-media-app-41126-large.mp4',
            caption: 'When you check your bank balance after Lagos weekend 😂🔥 Record & post yours today! #Comedy #Relatable #Viral',
            likes: ['user2', 'user6', 'user7'],
            comments: [],
            shares: 890,
            tags: ['#Comedy', '#Relatable', '#Viral']
          }
        ]);
      }
    }, (error) => {
      console.warn("Index query issue, loading local presets:", error);
    });
    return unsub;
  }, []);

  // Track 5-second qualified views for current reel
  useEffect(() => {
    setWatchSeconds(0);
    const interval = setInterval(() => {
      setWatchSeconds(prev => {
        const next = prev + 1;
        if (next === 5 && reels[activeIndex]) {
          // Qualified view logged: >= 5 seconds watch time!
          // Real-time: adds ₦0.20 to pendingBalance, updates creator_stats & wallets
          if (user?.uid) {
            recordQualifiedView(user.uid).then(() => {
              setEarnedViewToast(true);
              setTimeout(() => setEarnedViewToast(false), 3000);
            }).catch(() => {});
          }
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeIndex, reels, user.uid]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleScroll('DOWN');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleScroll('UP');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, reels.length]);

  const handleScroll = (direction: 'UP' | 'DOWN') => {
    if (direction === 'DOWN' && activeIndex < reels.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else if (direction === 'UP' && activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartYRef.current - touchEndY;
    if (diff > 50) {
      handleScroll('DOWN');
    } else if (diff < -50) {
      handleScroll('UP');
    }
  };

  // Wheel scroll debounce
  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 50) {
      handleScroll('DOWN');
    } else if (e.deltaY < -50) {
      handleScroll('UP');
    }
  };

  const currentReel = reels[activeIndex];
  if (!currentReel) return null;

  const isLiked = likedReels.includes(currentReel.id) || currentReel.likes.includes(user.uid);
  const isSaved = savedReels.includes(currentReel.id);
  const isFollowing = followingAuthors.includes(currentReel.authorId);

  const toggleLike = () => {
    setLikedReels(prev => 
      prev.includes(currentReel.id) 
        ? prev.filter(id => id !== currentReel.id) 
        : [...prev, currentReel.id]
    );
    onLike(currentReel.id);
  };

  const toggleSave = () => {
    setSavedReels(prev => 
      prev.includes(currentReel.id) 
        ? prev.filter(id => id !== currentReel.id) 
        : [...prev, currentReel.id]
    );
  };

  const toggleFollow = () => {
    setFollowingAuthors(prev => 
      prev.includes(currentReel.authorId) 
        ? prev.filter(id => id !== currentReel.authorId) 
        : [...prev, currentReel.authorId]
    );
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    setActiveComments(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        user: user.displayName || 'You',
        text: newCommentText.trim()
      }
    ]);
    setNewCommentText('');
  };

  return (
    <div 
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      className="relative w-full max-w-md h-full aspect-[9/16] bg-black md:rounded-[2.5rem] shadow-2xl overflow-hidden group select-none flex flex-col justify-between"
    >
      {/* Background Video Player */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentReel.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-0 bg-black"
        >
          {currentReel.videoUrl && (
            currentReel.videoUrl.includes('.mp4') || 
            currentReel.videoUrl.includes('.webm') || 
            currentReel.videoUrl.startsWith('data:video') ||
            currentReel.videoUrl.includes('mixkit') ||
            currentReel.videoUrl.includes('pexels')
          ) ? (
            <video 
              src={currentReel.videoUrl} 
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img 
              src={currentReel.videoUrl || `https://picsum.photos/seed/${currentReel.id}/720/1280`} 
              alt="Reel background" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90 pointer-events-none" />
        </motion.div>
      </AnimatePresence>

      {/* Top Header Overlay */}
      <div className="relative z-30 p-4 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-bold text-white">
          <Flame className="w-4 h-4 text-rose-500" />
          <span>Reels ({activeIndex + 1}/{reels.length})</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Create Reel Pulsing Button */}
          <button 
            onClick={onOpenCreator}
            className="px-4 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] hover:from-[#7C3AED] hover:to-[#0891B2] text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-lg shadow-[#8B5CF6]/50 animate-pulse active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Create Reel
          </button>

          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="p-2.5 bg-black/40 backdrop-blur-md hover:bg-black/60 rounded-full text-white transition-all border border-white/10"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Real-time Qualified View Reward Toast */}
      <AnimatePresence>
        {earnedViewToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="absolute top-16 left-4 right-4 z-50 mx-auto max-w-xs bg-gradient-to-r from-[#8B5CF6] via-[#06B6D4] to-[#FACC15] p-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-white"
          >
            <div className="w-7 h-7 rounded-xl bg-black/30 flex items-center justify-center font-black text-xs text-amber-300">
              ₦
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold leading-tight">+₦0.20 Earned!</p>
              <p className="text-[10px] text-white/85 leading-tight">5s Qualified View Logged to Creator Wallet</p>
            </div>
            <Sparkles className="w-4 h-4 text-white animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Sidebar - TikTok Style Action Bar */}
      <div className="absolute right-3 bottom-20 z-40 flex flex-col items-center gap-4 pointer-events-auto">
        {/* Creator Avatar with Follow Ring */}
        <div className="relative mb-1">
          <div className="w-12 h-12 rounded-full border-2 border-[#8B5CF6] p-0.5 bg-slate-900 shadow-xl overflow-hidden">
            <img 
              src={currentReel.authorPhoto || `https://picsum.photos/seed/${currentReel.authorId}/100/100`} 
              alt="Author" 
              className="w-full h-full object-cover rounded-full"
              referrerPolicy="no-referrer"
            />
          </div>
          {!isFollowing && currentReel.authorId !== user.uid && (
            <button 
              onClick={toggleFollow}
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all border-2 border-slate-950"
            >
              <Plus className="w-3 h-3 font-bold" />
            </button>
          )}
        </div>

        {/* Like Button */}
        <button 
          onClick={toggleLike}
          className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
        >
          <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
            isLiked 
              ? 'bg-rose-600/90 border-rose-500 shadow-lg shadow-rose-500/40 text-white' 
              : 'bg-black/40 border-white/20 text-white hover:bg-black/60'
          }`}>
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-white' : ''}`} />
          </div>
          <span className="text-[10px] font-bold text-white drop-shadow-md">
            {(currentReel.likes.length + (isLiked ? 1 : 0)).toLocaleString()}
          </span>
        </button>

        {/* Comments Button */}
        <button 
          onClick={() => setShowCommentsModal(true)}
          className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
        >
          <div className="w-11 h-11 bg-black/40 backdrop-blur-md border border-white/20 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-all">
            <MessageCircle className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-white drop-shadow-md">
            {activeComments.length}
          </span>
        </button>

        {/* Tip / Gift Button */}
        <button 
          onClick={() => onTip(currentReel.id)}
          className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
        >
          <div className="w-11 h-11 bg-gradient-to-tr from-amber-500 to-rose-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-amber-500/30 transition-all">
            <Gift className="w-5 h-5 animate-bounce" />
          </div>
          <span className="text-[10px] font-bold text-amber-300 drop-shadow-md">
            Gift
          </span>
        </button>

        {/* Save / Bookmark Button */}
        <button 
          onClick={toggleSave}
          className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
        >
          <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
            isSaved 
              ? 'bg-amber-500/90 border-amber-400 text-white shadow-md' 
              : 'bg-black/40 border-white/20 text-white hover:bg-black/60'
          }`}>
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-white' : ''}`} />
          </div>
          <span className="text-[10px] font-bold text-white drop-shadow-md">
            Save
          </span>
        </button>

        {/* Share Button */}
        <button 
          onClick={() => onShare(currentReel)}
          className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
        >
          <div className="w-11 h-11 bg-black/40 backdrop-blur-md border border-white/20 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-all">
            <Share2 className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-white drop-shadow-md">
            {currentReel.shares || 120}
          </span>
        </button>
      </div>

      {/* Bottom Info Overlay - TikTok Style */}
      <div className="relative z-30 p-5 space-y-2 pointer-events-auto max-w-[80%]">
        {/* Author Handle & Verified Badge */}
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-white drop-shadow-md truncate">
            @{currentReel.authorName.toLowerCase().replace(/\s/g, '_')}
          </h4>
          <span className="px-1.5 py-0.5 bg-[#8B5CF6]/30 border border-[#8B5CF6]/50 text-[#06B6D4] text-[9px] font-bold uppercase rounded-full">
            Verified
          </span>
        </div>

        {/* Caption & Hashtags */}
        <p className="text-xs text-slate-100 font-normal leading-relaxed drop-shadow-md line-clamp-2">
          {currentReel.caption.split(' ').map((word, i) => {
            if (word.startsWith('#')) {
              return (
                <span 
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectTag) onSelectTag(word);
                  }}
                  className="text-[#06B6D4] font-bold cursor-pointer hover:underline mr-1"
                >
                  {word}{' '}
                </span>
              );
            }
            return <span key={i}>{word} </span>;
          })}
        </p>

        {/* Rotating Music Disc & Sound Track Marquee */}
        <div className="flex items-center gap-3 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
            <Music className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span className="text-[11px] truncate max-w-[160px]">Original Sound - EFADO Viral</span>
          </div>

          {/* Rotating vinyl disc */}
          <div className="w-8 h-8 rounded-full border-2 border-slate-700 bg-slate-950 p-1 flex items-center justify-center animate-spin" style={{ animationDuration: '4s' }}>
            <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-[#8B5CF6] to-[#06B6D4]" />
          </div>
        </div>
      </div>

      {/* Scroll Navigation Arrows */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2 pointer-events-auto opacity-40 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => handleScroll('UP')}
          disabled={activeIndex === 0}
          className="p-2 bg-black/50 hover:bg-black/80 rounded-full text-white disabled:opacity-20 transition-all border border-white/10"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button 
          onClick={() => handleScroll('DOWN')}
          disabled={activeIndex === reels.length - 1}
          className="p-2 bg-black/50 hover:bg-black/80 rounded-full text-white disabled:opacity-20 transition-all border border-white/10"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Comments Drawer */}
      <AnimatePresence>
        {showCommentsModal && (
          <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full bg-[#121A2F] border-t border-white/15 rounded-t-3xl p-5 shadow-2xl flex flex-col max-h-[70%] text-white"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Comments ({activeComments.length})
                </h4>
                <button 
                  onClick={() => setShowCommentsModal(false)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Comments List */}
              <div className="flex-grow overflow-y-auto custom-scrollbar py-4 space-y-3">
                {activeComments.map(c => (
                  <div key={c.id} className="text-xs leading-relaxed">
                    <span className="font-bold text-[#06B6D4] mr-1.5">@{c.user}:</span>
                    <span className="text-slate-200">{c.text}</span>
                  </div>
                ))}
              </div>

              {/* Comment Input */}
              <form onSubmit={handleAddComment} className="pt-2 border-t border-white/10 flex items-center gap-2">
                <input 
                  type="text"
                  placeholder="Add comment..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-grow bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#8B5CF6]"
                />
                <button 
                  type="submit"
                  className="p-2.5 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white rounded-xl shadow-md active:scale-95 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
