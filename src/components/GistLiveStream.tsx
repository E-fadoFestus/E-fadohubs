import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Heart, 
  Share2, 
  Send, 
  Gift, 
  Coins, 
  Users, 
  Eye, 
  X, 
  Sparkles, 
  Flame, 
  Trophy, 
  Radio, 
  ChevronRight, 
  Plus, 
  Check, 
  Volume2, 
  VolumeX,
  Camera,
  Crown
} from 'lucide-react';
import { UserProfile } from '../types';
import { db, doc, updateDoc, increment, collection, addDoc, serverTimestamp } from '../firebase';

interface GistLiveStreamProps {
  user: UserProfile;
  onClose?: () => void;
  onNavigate?: (hub: any, subview?: any) => void;
  onTip?: (streamId: string, gift: any) => void;
}

interface LiveChannel {
  id: string;
  hostId: string;
  hostName: string;
  hostPhoto: string;
  title: string;
  category: string;
  viewers: number;
  likes: number;
  videoUrl: string;
  topGifter?: { name: string; amount: number; photo?: string };
}

const DEFAULT_LIVE_CHANNELS: LiveChannel[] = [
  {
    id: 'channel-1',
    hostId: 'dj_vibe',
    hostName: 'DJ Blaze 🎧',
    hostPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    title: 'Afrobeats Midnight Mix & Live Gist! 🔥',
    category: 'Music & Vibes',
    viewers: 2840,
    likes: 18450,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-shot-of-a-woman-smiling-at-the-camera-41584-large.mp4',
    topGifter: { name: 'Chief Emeka', amount: 15000, photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' }
  },
  {
    id: 'channel-2',
    hostId: 'tech_vanguard',
    hostName: 'Kemi Tech 🚀',
    hostPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    title: 'How I scaled my Nigerian startup to $100K/mo 💡',
    category: 'Business & Tech',
    viewers: 1920,
    likes: 12300,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-working-on-her-laptop-in-a-coffee-shop-40340-large.mp4',
    topGifter: { name: 'Victor Crypto', amount: 8500 }
  },
  {
    id: 'channel-3',
    hostId: 'comedy_lord',
    hostName: 'Brother Paul 😂',
    hostPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    title: 'Lagos Traffic Palaver Live Reactions 🚗💨',
    category: 'Comedy & Drama',
    viewers: 3410,
    likes: 29800,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smartphone-scrolling-through-a-social-media-app-41126-large.mp4',
    topGifter: { name: 'Madam Joy', amount: 22000 }
  }
];

const GIFTS_CATALOG = [
  { id: 'rose', name: 'Rose', icon: '🌹', coins: 10, effect: 'sparkle' },
  { id: 'coffee', name: 'Coffee', icon: '☕', coins: 50, effect: 'warmth' },
  { id: 'rocket', name: 'Rocket', icon: '🚀', coins: 500, effect: 'blast' },
  { id: 'crown', name: 'Crown', icon: '👑', coins: 1000, effect: 'royal' },
  { id: 'lion', name: 'Golden Lion', icon: '🦁', coins: 2500, effect: 'roar' },
  { id: 'diamond', name: 'Sovereign Diamond', icon: '💎', coins: 5000, effect: 'galaxy' },
];

export const GistLiveStream: React.FC<GistLiveStreamProps> = ({ user, onClose, onNavigate }) => {
  const [channels] = useState<LiveChannel[]>(DEFAULT_LIVE_CHANNELS);
  const [activeChannelIndex, setActiveChannelIndex] = useState(0);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [showGoLiveModal, setShowGoLiveModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastCategory, setBroadcastCategory] = useState('General Gist');
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isMicActive, setIsMicActive] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  
  // Floating hearts & animations
  const [floatingHearts, setFloatingHearts] = useState<{ id: string; x: number; color: string }[]>([]);
  const [activeGifts, setActiveGifts] = useState<{ id: string; sender: string; gift: any }[]>([]);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [userCoins, setUserCoins] = useState(() => {
    try {
      const saved = localStorage.getItem(`efado_coins_${user.uid}`);
      return saved ? parseInt(saved, 10) : 1500;
    } catch (e) {
      return 1500;
    }
  });

  // Chat comments
  const [comments, setComments] = useState<Array<{ id: string; user: string; text: string; isGift?: boolean }>>([
    { id: '1', user: 'Blessing', text: 'Welcome everyone to the stream! 🔥' },
    { id: '2', user: 'Tunde_NG', text: 'Audio is super clear today 👍' },
    { id: '3', user: 'Chioma99', text: 'Big love from Abuja! ❤️' },
    { id: '4', user: 'Amara_Tech', text: 'Watching on EFADO Gist Hub!' }
  ]);
  const [newComment, setNewComment] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const activeChannel = channels[activeChannelIndex];

  // Auto scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [comments]);

  // Simulated live viewer chat interval
  useEffect(() => {
    const interval = setInterval(() => {
      const randomNames = ['David_K', 'Grace_O', 'Samuel92', 'Fola_Vibe', 'Zainab', 'Ifeanyi_Lagos', 'Mercy_P'];
      const randomMsgs = [
        'Awesome vibes! 🔥',
        'EFADO to the world! 🚀',
        'Send some gifts fam 🎁',
        'Hello from Port Harcourt! 🌍',
        'Love this community 💯',
        'Nice one host! 👏',
        'Drop the link in bio!'
      ];
      const randomUser = randomNames[Math.floor(Math.random() * randomNames.length)];
      const randomText = randomMsgs[Math.floor(Math.random() * randomMsgs.length)];
      
      setComments(prev => [...prev.slice(-25), {
        id: Math.random().toString(),
        user: randomUser,
        text: randomText
      }]);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const handleSendHeart = () => {
    const colors = ['#EC4899', '#8B5CF6', '#EF4444', '#F59E0B', '#06B6D4'];
    const newHeart = {
      id: Math.random().toString(),
      x: 60 + Math.random() * 30,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
    setFloatingHearts(prev => [...prev, newHeart]);
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 2000);
  };

  const handleSendGift = (gift: typeof GIFTS_CATALOG[0]) => {
    if (userCoins < gift.coins) {
      alert(`Insufficient EFADO Coins! You have ${userCoins} coins, but ${gift.name} costs ${gift.coins} coins. Click "Top Up" to purchase coins.`);
      return;
    }

    const remaining = userCoins - gift.coins;
    setUserCoins(remaining);
    localStorage.setItem(`efado_coins_${user.uid}`, remaining.toString());

    // Creator receives 80% of gift value (e.g. 1 coin = ₦1)
    const creatorShare = Math.round(gift.coins * 0.8);

    // Trigger gift visual overlay
    const giftAnim = {
      id: Math.random().toString(),
      sender: user.displayName || user.email.split('@')[0],
      gift
    };
    setActiveGifts(prev => [...prev, giftAnim]);
    setTimeout(() => {
      setActiveGifts(prev => prev.filter(g => g.id !== giftAnim.id));
    }, 3500);

    // Add gift notification in chat
    setComments(prev => [...prev, {
      id: Math.random().toString(),
      user: user.displayName || 'You',
      text: `Sent ${gift.icon} ${gift.name} (${gift.coins} Coins)! 🎁`,
      isGift: true
    }]);

    setShowGiftModal(false);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments(prev => [...prev, {
      id: Math.random().toString(),
      user: user.displayName || user.email.split('@')[0],
      text: newComment.trim()
    }]);
    setNewComment('');
  };

  const handleStartBroadcast = () => {
    if (!broadcastTitle.trim()) {
      alert("Please enter a title for your live stream!");
      return;
    }
    setIsBroadcasting(true);
    setShowGoLiveModal(false);
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row bg-slate-950 overflow-hidden text-white">
      {/* Left / Main Live Stream Player */}
      <div className="flex-grow flex flex-col relative h-full bg-black overflow-hidden">
        {/* Stream Video Container */}
        <div className="relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden">
          {isBroadcasting ? (
            <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-b from-indigo-950 via-slate-900 to-black">
              {isCameraActive ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-600 p-1 mb-4 shadow-2xl animate-pulse">
                    <img 
                      src={user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`} 
                      alt="Broadcaster" 
                      className="w-full h-full rounded-full object-cover" 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                  <span className="px-3 py-1 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-full animate-bounce mb-2">
                    ● YOU ARE LIVE
                  </span>
                  <h3 className="text-xl font-bold text-white max-w-md">{broadcastTitle}</h3>
                  <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mt-1">{broadcastCategory}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500 gap-3">
                  <VideoOff className="w-16 h-16" />
                  <p className="text-sm font-bold uppercase tracking-widest">Camera is Paused</p>
                </div>
              )}
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <video 
                ref={videoRef}
                src={activeChannel.videoUrl} 
                autoPlay 
                loop 
                muted={isMuted} 
                playsInline
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
            </div>
          )}

          {/* Top Live Bar Controls */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-auto">
            <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg">
              <div className="w-10 h-10 rounded-full border-2 border-rose-500 p-0.5 overflow-hidden">
                <img 
                  src={isBroadcasting ? (user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`) : activeChannel.hostPhoto} 
                  alt="Host" 
                  className="w-full h-full object-cover rounded-full" 
                  referrerPolicy="no-referrer" 
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white truncate max-w-[120px] sm:max-w-none">
                    {isBroadcasting ? (user.displayName || 'You') : activeChannel.hostName}
                  </span>
                  <span className="px-2 py-0.5 bg-rose-600 text-white font-black text-[9px] uppercase tracking-wider rounded-full flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> LIVE
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 font-medium truncate max-w-[150px]">
                  {isBroadcasting ? broadcastTitle : activeChannel.title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-bold">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isBroadcasting ? '482' : activeChannel.viewers.toLocaleString()}</span>
              </div>
              {!isBroadcasting && (
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2.5 bg-black/50 backdrop-blur-md hover:bg-black/70 rounded-full border border-white/10 text-white transition-all"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}
              {isBroadcasting ? (
                <button 
                  onClick={() => setIsBroadcasting(false)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-full font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all"
                >
                  End Live
                </button>
              ) : (
                <button 
                  onClick={() => setShowGoLiveModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 rounded-full font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all flex items-center gap-1.5 animate-pulse"
                >
                  <Radio className="w-3.5 h-3.5" /> Go Live
                </button>
              )}
            </div>
          </div>

          {/* Floating Gift Display Layer */}
          <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
            <AnimatePresence>
              {activeGifts.map(g => (
                <motion.div 
                  key={g.id}
                  initial={{ opacity: 0, scale: 0.3, y: 50 }}
                  animate={{ opacity: 1, scale: 1.2, y: 0 }}
                  exit={{ opacity: 0, scale: 1.5, y: -100 }}
                  transition={{ duration: 0.6 }}
                  className="bg-gradient-to-r from-purple-900/90 to-cyan-900/90 border-2 border-amber-400/80 p-6 rounded-3xl backdrop-blur-xl shadow-2xl flex flex-col items-center gap-2 text-center"
                >
                  <span className="text-6xl animate-bounce">{g.gift.icon}</span>
                  <h4 className="text-lg font-black text-amber-300 uppercase tracking-wide drop-shadow-md">
                    {g.sender} sent {g.gift.name}!
                  </h4>
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-black rounded-full border border-amber-500/30">
                    +{g.gift.coins} Coins (Creator Gets 80%)
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Floating Hearts Layer */}
          <div className="absolute inset-0 pointer-events-none z-20">
            <AnimatePresence>
              {floatingHearts.map(h => (
                <motion.div 
                  key={h.id}
                  initial={{ opacity: 1, scale: 0.8, y: 300 }}
                  animate={{ opacity: 0, scale: 1.6, y: 50 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.8, ease: "easeOut" }}
                  className="absolute"
                  style={{ left: `${h.x}%`, bottom: '120px' }}
                >
                  <Heart className="w-8 h-8 fill-current drop-shadow-lg" style={{ color: h.color }} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Broadcaster Controls Bar */}
          {isBroadcasting && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-black/60 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10">
              <button 
                onClick={() => setIsMicActive(!isMicActive)}
                className={`p-3 rounded-full transition-all ${isMicActive ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-rose-600 text-white'}`}
                title={isMicActive ? "Mute Microphone" : "Unmute Microphone"}
              >
                {isMicActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => setIsCameraActive(!isCameraActive)}
                className={`p-3 rounded-full transition-all ${isCameraActive ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-rose-600 text-white'}`}
                title={isCameraActive ? "Turn Off Video" : "Turn On Video"}
              >
                {isCameraActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => alert("Simulating Camera Flip...")}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
                title="Flip Camera"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* In-Stream Action Buttons */}
          <div className="absolute right-4 bottom-24 flex flex-col items-center gap-4 z-20 pointer-events-auto">
            <button 
              onClick={handleSendHeart}
              className="w-12 h-12 bg-white/10 backdrop-blur-md hover:bg-rose-600 border border-white/20 rounded-full flex flex-col items-center justify-center text-white transition-all shadow-xl active:scale-90 group"
            >
              <Heart className="w-6 h-6 text-rose-400 group-hover:text-white fill-current" />
            </button>
            <button 
              onClick={() => setShowGiftModal(true)}
              className="w-12 h-12 bg-gradient-to-tr from-amber-500 to-rose-500 hover:scale-110 rounded-full flex items-center justify-center text-white shadow-xl shadow-amber-500/30 active:scale-95 transition-all"
            >
              <Gift className="w-6 h-6 animate-bounce" />
            </button>
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: 'EFADO Live Stream', text: `Watch ${activeChannel.hostName} live on EFADO Gist Hub!`, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Live stream link copied to clipboard!");
                }
              }}
              className="w-12 h-12 bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center text-white transition-all"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Channel Switcher Bar (Mobile & Desktop) */}
        <div className="bg-slate-900 border-t border-white/10 px-4 py-2.5 flex items-center gap-3 overflow-x-auto custom-scrollbar flex-shrink-0">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-rose-500" /> Channels:
          </span>
          {channels.map((ch, idx) => (
            <button
              key={ch.id}
              onClick={() => {
                setIsBroadcasting(false);
                setActiveChannelIndex(idx);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeChannelIndex === idx && !isBroadcasting
                  ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-md'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>{ch.hostName}</span>
              <span className="text-[9px] opacity-70">({ch.viewers})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Right Sidebar - Real-time Live Comments & Gift Leaderboard */}
      <div className="w-full lg:w-96 flex-shrink-0 flex flex-col bg-[#0A0F1E] border-t lg:border-t-0 lg:border-l border-white/10 h-80 lg:h-full">
        {/* Top Gifter Bar */}
        <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Top Gifter</p>
              <p className="text-xs font-bold text-amber-300">{activeChannel.topGifter?.name || 'Chief Emeka'} • {activeChannel.topGifter?.amount.toLocaleString()} Coins</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full text-amber-300 text-xs font-bold">
            <Coins className="w-3.5 h-3.5" />
            <span>{userCoins} Coins</span>
          </div>
        </div>

        {/* Live Scrolling Comments */}
        <div 
          ref={chatScrollRef}
          className="flex-grow p-4 overflow-y-auto custom-scrollbar space-y-3"
        >
          {comments.map(c => (
            <div 
              key={c.id} 
              className={`text-xs leading-relaxed ${
                c.isGift 
                  ? 'bg-amber-500/15 border border-amber-500/30 p-2.5 rounded-xl text-amber-200' 
                  : 'text-slate-200'
              }`}
            >
              <span className={`font-bold mr-1.5 ${c.isGift ? 'text-amber-300' : 'text-cyan-400'}`}>
                {c.user}:
              </span>
              <span>{c.text}</span>
            </div>
          ))}
        </div>

        {/* Comment Input */}
        <form onSubmit={handlePostComment} className="p-3 border-t border-white/10 bg-slate-900 flex items-center gap-2">
          <input 
            type="text"
            placeholder="Send live comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-grow bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
          />
          <button 
            type="submit"
            className="p-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white rounded-xl shadow-md active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Gift Modal */}
      <AnimatePresence>
        {showGiftModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-[#121A2F] border border-white/15 rounded-3xl p-6 shadow-2xl text-white relative"
            >
              <button 
                onClick={() => setShowGiftModal(false)}
                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold">Send Live Gift</h3>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-amber-300 text-xs font-bold">
                  <Coins className="w-4 h-4" />
                  <span>{userCoins} Coins</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 mb-6">
                Support your favorite host! Creators receive <span className="text-emerald-400 font-bold">80% of all coins</span> directly to their Creator Earnings.
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {GIFTS_CATALOG.map(gift => (
                  <button 
                    key={gift.id}
                    onClick={() => handleSendGift(gift)}
                    className="p-3 bg-white/5 hover:bg-gradient-to-b hover:from-purple-900/40 hover:to-cyan-900/40 border border-white/10 hover:border-purple-500/50 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95 group"
                  >
                    <span className="text-3xl group-hover:scale-125 transition-transform">{gift.icon}</span>
                    <span className="text-xs font-bold text-white">{gift.name}</span>
                    <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                      <Coins className="w-3 h-3" /> {gift.coins}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <button 
                  onClick={() => {
                    const topup = 1000;
                    setUserCoins(prev => {
                      const updated = prev + topup;
                      localStorage.setItem(`efado_coins_${user.uid}`, updated.toString());
                      return updated;
                    });
                    alert(`Added +${topup} EFADO Coins! Balance: ${userCoins + topup}`);
                  }}
                  className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Buy / Top-Up Coins
                </button>
                <button 
                  onClick={() => setShowGiftModal(false)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Go Live Setup Modal */}
      <AnimatePresence>
        {showGoLiveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-[#121A2F] border border-white/15 rounded-3xl p-6 shadow-2xl text-white relative"
            >
              <button 
                onClick={() => setShowGoLiveModal(false)}
                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/20">
                  <Radio className="w-7 h-7 text-white animate-pulse" />
                </div>
                <h3 className="text-xl font-bold">Start EFADO Live Stream</h3>
                <p className="text-xs text-slate-400 mt-1">Broadcast to thousands of viewers globally and earn live gifts!</p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">Stream Title</label>
                  <input 
                    type="text"
                    placeholder="e.g. Talking Tech & Free Money Tips..."
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">Category</label>
                  <select 
                    value={broadcastCategory}
                    onChange={(e) => setBroadcastCategory(e.target.value)}
                    className="w-full bg-[#0A0F1E] border border-white/10 px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 font-medium"
                  >
                    <option value="General Gist">General Gist & Chat</option>
                    <option value="Music & Vibes">Music & Afrobeats Vibes</option>
                    <option value="Business & Tech">Business, Startups & Tech</option>
                    <option value="Comedy & Drama">Comedy & Drama</option>
                    <option value="Dating & Love">Dating & Relationships</option>
                    <option value="Faith & Wisdom">Faith & Spiritual Counsel</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={handleStartBroadcast}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-purple-500/30 active:scale-95 transition-all"
              >
                Go Live Now 🚀
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
