import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { 
  MessageSquare, 
  ChevronRight, 
  Search, 
  X, 
  Users, 
  UserCircle, 
  ArrowLeft,
  Share2,
  Send,
  Download,
  Upload,
  Zap,
  Plus,
  Play,
  Volume2,
  DollarSign,
  Globe,
  Check,
  CreditCard,
  Coins,
  Mic,
  MicOff,
  VideoOff,
  Eye,
  Sparkles,
  ShoppingBag,
  Flame,
  ThumbsUp,
  Tag,
  CheckCheck,
  ExternalLink,
  Camera,
  Film,
  Paperclip,
  Smile,
  Gift,
  Phone,
  Video as VideoIcon,
  QrCode,
  Copy,
  Radio,
  Share,
  FileText,
  Music,
  Maximize2,
  FolderDown,
  Languages,
  CheckCircle2,
  Info,
  Clock,
  Sparkle
} from 'lucide-react';
import { UserProfile } from '../types';
import { useCurrency } from '../lib/CurrencyContext';

export interface EfadoNexusHubProps {
  user: UserProfile;
  onClose: () => void;
  initialView?: string;
  autoStartLive?: boolean;
  onOpenMining?: () => void;
  onNavigate?: (hub: any, subview?: any, extraProps?: any) => void;
  bargainContext?: {
    productId?: string;
    productTitle?: string;
    productPrice?: number;
    sellerName?: string;
    sellerAvatar?: string;
  };
}

interface MessageItem {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  isMe: boolean;
  isOnline: boolean;
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'seen';
  reactions: { [key: string]: number };
  replyTo?: { id: string; senderName: string; text: string };
  attachment?: {
    name: string;
    size: string;
    type: 'pdf' | 'docx' | 'image' | 'video' | 'audio' | 'product';
    url: string;
    progress?: number;
  };
  offerTag?: {
    price: number;
    status: 'pending' | 'accepted' | 'declined';
  };
  translated?: {
    lang: string;
    text: string;
  };
}

interface StoryItem {
  id: string;
  userName: string;
  userAvatar: string;
  isAdvert: boolean;
  adTag?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption: string;
  views: number;
  earnings: number;
  duration: number;
}

export const EfadoNexusHub: React.FC<EfadoNexusHubProps> = ({
  user,
  onClose,
  initialView = 'CHAT',
  autoStartLive = false,
  onOpenMining,
  onNavigate,
  bargainContext
}) => {
  const { formatPrice } = useCurrency();

  // Navigation & Sub-views
  const [activeTab, setActiveTab] = useState<string>(initialView);
  const [activeChatRoom, setActiveChatRoom] = useState<string>('sarah');
  const [displayUrl, setDisplayUrl] = useState<'efado-nexus.com/hub' | 'e-fado.com/nexus-hub'>('efado-nexus.com/hub');

  // Creator Fund state
  const [creatorEarnings, setCreatorEarnings] = useState<number>(1840);
  const [qualifiedViews, setQualifiedViews] = useState<number>(18400);
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);

  // Bargain Mode (from Marketplace)
  const [bargainMode, setBargainMode] = useState<boolean>(!!bargainContext);
  const [offerPriceInput, setOfferPriceInput] = useState<string>(bargainContext ? String(bargainContext.productPrice || 15000) : '');

  // 10-Action-Bar Modal States
  const [showDeepLinkModal, setShowDeepLinkModal] = useState<boolean>(false);
  const [deepLinkType, setDeepLinkType] = useState<'gist' | 'user' | 'market'>('gist');
  const [deepLinkIdInput, setDeepLinkIdInput] = useState<string>('viral-gist-77');
  const [generatedDeepLink, setGeneratedDeepLink] = useState<string>('efado-nexus.com/gist/viral-gist-77');

  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [shareFeedback, setShareFeedback] = useState<string>('');

  const [showAddUsersModal, setShowAddUsersModal] = useState<boolean>(false);
  const [addUserInput, setAddUserInput] = useState<string>('');
  const [addMethod, setAddMethod] = useState<'username' | 'phone' | 'qr' | 'link'>('username');

  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);
  const [downloadHistory, setDownloadHistory] = useState<Array<{ id: string; name: string; size: string; status: string; date: string }>>([
    { id: '1', name: 'EFADO_Marketplace_Invoice.pdf', size: '3.2 MB', status: 'Downloaded • 3.2 MB • Saved with folder', date: 'Just now' },
    { id: '2', name: 'Nexus_Creator_Masterclass_Clip.mp4', size: '48.5 MB', status: 'Downloaded • Saved with folder', date: '1 hour ago' },
    { id: '3', name: 'Sovereign_Blueprint_v2.docx', size: '1.8 MB', status: 'Downloaded • Saved with folder', date: 'Yesterday' }
  ]);

  // Buzz state
  const [buzzCooldown, setBuzzCooldown] = useState<number>(0);
  const [fullScreenBuzzAlert, setFullScreenBuzzAlert] = useState<{ sender: string; time: string } | null>(null);

  // Screenshot state
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState<boolean>(false);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  // Calls state (WebRTC video & voice mask)
  const [showVideoCallModal, setShowVideoCallModal] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [isCameraOff, setIsCameraOff] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isCallRecording, setIsCallRecording] = useState<boolean>(false);
  const [callRecordedBytes, setCallRecordedBytes] = useState<number>(0);

  const [showVoiceCallModal, setShowVoiceCallModal] = useState<boolean>(false);
  const [activeVoiceMask, setActiveVoiceMask] = useState<'Normal' | 'Robot' | 'Fine Girl' | 'Chief' | 'Bishop'>('Robot');
  const [backgroundMusic, setBackgroundMusic] = useState<string>('Afrobeats Chill');

  // Reels modal state
  const [showReelsModal, setShowReelsModal] = useState<boolean>(false);
  const [reelReplyChatId, setReelReplyChatId] = useState<string | null>(null);

  // Status / Stories state
  const [showStatusViewer, setShowStatusViewer] = useState<StoryItem | null>(null);
  const [showStatusCreator, setShowStatusCreator] = useState<boolean>(false);
  const [newStatusCaption, setNewStatusCaption] = useState<string>('');
  const [isNewStatusAdvert, setIsNewStatusAdvert] = useState<boolean>(false);
  const [stories, setStories] = useState<StoryItem[]>([
    {
      id: 's_sara',
      userName: 'Sara',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      isAdvert: false,
      mediaUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      mediaType: 'image',
      caption: 'Exploring Lagos tech innovation today! 🚀✨',
      views: 3420,
      earnings: 342,
      duration: 30
    },
    {
      id: 's_jordan',
      userName: 'Jordan',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      isAdvert: false,
      mediaUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
      mediaType: 'image',
      caption: 'Collaborating live on EFADO NEXUS HUB with our Accra team.',
      views: 1890,
      earnings: 189,
      duration: 45
    },
    {
      id: 's_ad',
      userName: 'Advert',
      userAvatar: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=200&q=80',
      isAdvert: true,
      adTag: 'AD',
      mediaUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80',
      mediaType: 'image',
      caption: 'Special 50% discount on Verified Gadgets in EFADO Market! Shop now!',
      views: 12500,
      earnings: 1250,
      duration: 60
    },
    {
      id: 's_mia',
      userName: 'Mia',
      userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
      isAdvert: false,
      mediaUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
      mediaType: 'image',
      caption: 'Creator fund payout arrived! ₦1840 qualified bonus credited to my wallet 🎉',
      views: 5400,
      earnings: 540,
      duration: 35
    }
  ]);

  // Chat message input & state
  const [inputText, setInputText] = useState<string>('');
  const [replyTarget, setReplyTarget] = useState<MessageItem | null>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState<boolean>(false);
  const [showVoiceMaskPopover, setShowVoiceMaskPopover] = useState<boolean>(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [showGiftModal, setShowGiftModal] = useState<boolean>(false);
  const [showMentionList, setShowMentionList] = useState<boolean>(false);
  const [pidginSuggestion, setPidginSuggestion] = useState<string | null>(null);
  const [isPeerTyping, setIsPeerTyping] = useState<boolean>(false);

  // Active chat messages
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'm1',
      senderId: 'sarah',
      senderName: 'Sara (Lead)',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      isMe: false,
      isOnline: true,
      text: 'Welcome to EFADO NEXUS HUB! All systems are synced across Web, Android, and iOS.',
      timestamp: '10:42 AM',
      status: 'seen',
      reactions: { '❤️': 3, '🔥': 2 }
    },
    {
      id: 'm2',
      senderId: user.uid,
      senderName: user.displayName || 'You',
      senderAvatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      isMe: true,
      isOnline: true,
      text: 'Thanks Sara! The 10 action buttons, stories, and WebRTC calls feel super fast.',
      timestamp: '10:43 AM',
      status: 'seen',
      reactions: { '👍': 4 }
    },
    {
      id: 'm3',
      senderId: 'sarah',
      senderName: 'Sara (Lead)',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      isMe: false,
      isOnline: true,
      text: 'Here is the tactical specification document for the Creator Fund and Deep Linking:',
      timestamp: '10:45 AM',
      status: 'seen',
      reactions: {},
      attachment: {
        name: 'Nexus_Creator_Blueprint.pdf',
        size: '3.2 MB',
        type: 'pdf',
        url: '/api/download/nexus_blueprint',
        progress: 100
      }
    }
  ]);

  // Audio recording timer
  useEffect(() => {
    let timer: any;
    if (isRecordingAudio) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecordingAudio]);

  // Buzz cooldown decrementer
  useEffect(() => {
    let timer: any;
    if (buzzCooldown > 0) {
      timer = setInterval(() => {
        setBuzzCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [buzzCooldown]);

  // Handle typing input Pidgin suggestion & mentions
  const handleInputChange = (text: string) => {
    setInputText(text);

    if (text.endsWith('@')) {
      setShowMentionList(true);
    } else if (!text.includes('@')) {
      setShowMentionList(false);
    }

    // Auto-suggest Pidgin equivalent for common phrases
    const lower = text.toLowerCase();
    if (lower.includes('how are you')) {
      setPidginSuggestion('How you dey? Hope you dey kampe?');
    } else if (lower.includes('what is happening')) {
      setPidginSuggestion('Wetin dey happen? Everything intact?');
    } else if (lower.includes('thank you')) {
      setPidginSuggestion('I appreciate you die! Na you biko!');
    } else if (lower.includes('good morning')) {
      setPidginSuggestion('Morning my person! How body today?');
    } else {
      setPidginSuggestion(null);
    }
  };

  // Play Buzz Chime using Web Audio API
  const playBuzzSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, audioCtx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.38);
    } catch (e) {
      console.warn('AudioContext buzz sound skipped:', e);
    }
  };

  // Trigger Buzz
  const handleTriggerBuzz = async () => {
    if (buzzCooldown > 0) {
      alert(`Buzz cooldown active! Please wait ${buzzCooldown}s before buzzing again.`);
      return;
    }

    try {
      // Vibrate mobile device if supported
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 400]);
      }

      playBuzzSound();

      // Send to backend
      fetch('/api/chat/buzz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUser: user.displayName || 'Alex',
          toUser: 'Sara',
          roomId: activeChatRoom
        })
      }).catch((e) => console.warn('Buzz API non-fatal:', e));

      setBuzzCooldown(30);

      // Trigger full screen buzz display
      setFullScreenBuzzAlert({
        sender: user.displayName || 'Alex',
        time: 'just now'
      });

      setTimeout(() => {
        setFullScreenBuzzAlert(null);
      }, 3500);
    } catch (err: any) {
      console.warn('Buzz error:', err);
    }
  };

  // One-tap Screenshot
  const handleTakeScreenshot = async () => {
    if (!chatScrollContainerRef.current) return;
    setIsCapturingScreenshot(true);
    try {
      const canvas = await html2canvas(chatScrollContainerRef.current, {
        backgroundColor: '#F8FAFC',
        scale: 2,
        useCORS: true
      });

      // Add watermark EFADO NEXUS HUB
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.font = 'bold 24px sans-serif';
        ctx.fillStyle = 'rgba(79, 70, 229, 0.85)';
        ctx.textAlign = 'right';
        ctx.fillText('EFADO NEXUS HUB • Verified Snapshot', canvas.width - 24, canvas.height - 24);
        ctx.restore();
      }

      const imgData = canvas.toDataURL('image/png');
      setScreenshotPreview(imgData);

      // Notify backend
      fetch('/api/chat/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: activeChatRoom,
          timestamp: Date.now(),
          watermark: 'EFADO NEXUS HUB'
        })
      }).catch((e) => console.warn('Screenshot API non-fatal:', e));
    } catch (err) {
      console.error('Screenshot capture failed:', err);
      alert('Unable to capture screenshot on this browser. Try on standard mobile/desktop.');
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  // Simulate Cloud Upload with progress bar (up to 500MB)
  const handleStartCloudUpload = (file: File) => {
    setIsUploading(true);
    setUploadedFileName(file.name);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);

          // Append file message to chat
          const newMsg: MessageItem = {
            id: 'm_' + Date.now(),
            senderId: user.uid,
            senderName: user.displayName || 'You',
            senderAvatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
            isMe: true,
            isOnline: true,
            text: `Uploaded file: ${file.name}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent',
            reactions: {},
            attachment: {
              name: file.name,
              size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
              type: file.type.includes('image') ? 'image' : file.type.includes('video') ? 'video' : 'pdf',
              url: URL.createObjectURL(file),
              progress: 100
            }
          };

          setMessages((m) => [...m, newMsg]);

          // Save to download manager history
          setDownloadHistory((prev) => [
            {
              id: 'dl_' + Date.now(),
              name: file.name,
              size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
              status: 'Downloaded • Saved with folder',
              date: 'Just now'
            },
            ...prev
          ]);

          setShowUploadModal(false);
          return 100;
        }
        return prev + 18;
      });
    }, 280);
  };

  // Send Message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: MessageItem = {
      id: 'm_' + Date.now(),
      senderId: user.uid,
      senderName: user.displayName || 'You',
      senderAvatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      isMe: true,
      isOnline: true,
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'delivered',
      reactions: {},
      replyTo: replyTarget ? { id: replyTarget.id, senderName: replyTarget.senderName, text: replyTarget.text } : undefined,
      offerTag: bargainMode && offerPriceInput ? { price: Number(offerPriceInput), status: 'pending' } : undefined
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setReplyTarget(null);
    setPidginSuggestion(null);

    // Simulate peer response after 2 seconds
    setTimeout(() => {
      setIsPeerTyping(true);
      setTimeout(() => {
        setIsPeerTyping(false);
        const replyMsg: MessageItem = {
          id: 'm_reply_' + Date.now(),
          senderId: 'sarah',
          senderName: 'Sara (Lead)',
          senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
          isMe: false,
          isOnline: true,
          text: bargainMode 
            ? `I saw your offer of ₦${Number(offerPriceInput).toLocaleString()}! We can close at that rate. Click Proceed to Checkout.` 
            : 'Got your message on EFADO NEXUS HUB! Syncing response directly.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'seen',
          reactions: { '❤️': 1 }
        };
        setMessages((prev) => [...prev, replyMsg]);
      }, 1500);
    }, 1200);
  };

  // AI Translation handler
  const handleTranslateMessage = async (msgId: string, lang: string) => {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg) return;

    try {
      const res = await fetch('/api/chat/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msg.text, targetLanguage: lang })
      });
      const data = await res.json();
      if (data.success && data.translatedText) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? { ...m, translated: { lang: lang.toUpperCase(), text: data.translatedText } }
              : m
          )
        );
      }
    } catch (err) {
      console.warn('Translate error:', err);
    }
  };

  // React to message
  const handleAddReaction = (msgId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          const count = m.reactions[emoji] || 0;
          return {
            ...m,
            reactions: { ...m.reactions, [emoji]: count + 1 }
          };
        }
        return m;
      })
    );
  };

  // Withdraw Creator Fund earnings
  const handleWithdrawEarnings = () => {
    if (creatorEarnings <= 0) return;
    alert(`Successfully transferred ₦${creatorEarnings.toLocaleString()} from EFADO Creator Fund to your main player balance!`);
    setCreatorEarnings(0);
    setShowWithdrawModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070A16] flex flex-col font-sans select-none overflow-hidden">
      {/* ==================================================================== */}
      {/* 1. TOP HEADER - EVERYWHERE MUST BE: EFADO NEXUS HUB */}
      {/* URL: efado-nexus.com/hub or e-fado.com/nexus-hub */}
      {/* Brand gradient text white on indigo */}
      {/* ==================================================================== */}
      <header className="px-3 sm:px-6 py-2.5 bg-gradient-to-r from-[#201A5B] via-[#312E81] to-[#1E1B4B] border-b border-indigo-500/30 flex items-center justify-between z-30 shadow-xl flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
          {/* Back to Home Button */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-[10px] sm:text-xs uppercase tracking-wider border border-white/20 shadow-md hover:scale-105 active:scale-95 transition-all flex-shrink-0 cursor-pointer"
            title="Return to Home"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-200" />
            <span className="hidden xs:inline">← BACK TO HOME</span>
            <span className="xs:hidden">← HOME</span>
          </button>

          {/* Title & URL Badge */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-xl font-black bg-gradient-to-r from-white via-indigo-100 to-indigo-200 text-transparent bg-clip-text tracking-tight uppercase">
                EFADO NEXUS HUB
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-[9px] font-mono font-bold text-indigo-200 uppercase">
                v2.0 PRO
              </span>
            </div>

            {/* Clickable URL Switcher */}
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => {
                  const nextUrl = displayUrl === 'efado-nexus.com/hub' ? 'e-fado.com/nexus-hub' : 'efado-nexus.com/hub';
                  setDisplayUrl(nextUrl);
                  navigator.clipboard.writeText(`https://${nextUrl}`);
                  alert(`Hub URL copied: https://${nextUrl}`);
                }}
                className="text-[10px] font-mono text-indigo-300 hover:text-white flex items-center gap-1 hover:underline cursor-pointer"
                title="Click to copy & switch active URL"
              >
                <Globe className="w-3 h-3 text-indigo-300" />
                <span>{displayUrl}</span>
                <Copy className="w-2.5 h-2.5 opacity-60" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Section: Creator Fund Balance & Exit */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {/* Creator Fund Earnings Pill */}
          <div 
            onClick={() => setShowWithdrawModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 cursor-pointer transition-all shadow-inner"
            title="Creator Fund: ₦100 per 1,000 views"
          >
            <div className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-[10px]">
              ₦
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[8px] font-bold uppercase text-indigo-300 tracking-wider">Creator Fund</span>
              <span className="text-xs font-black text-amber-300 leading-none">
                ₦{creatorEarnings.toLocaleString()}
              </span>
            </div>
            <button className="hidden sm:block text-[9px] font-bold text-indigo-200 bg-indigo-600/60 hover:bg-indigo-600 px-2 py-0.5 rounded-md border border-indigo-400/30">
              Withdraw
            </button>
          </div>

          {/* Close Hub */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/20 text-white hover:text-rose-300 border border-white/20 transition-all cursor-pointer"
            title="Exit Nexus Hub"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. TOP ACTION BAR - 10 BUTTONS (Build exactly like image): */}
      {/* Row 1: Deep Linking, Share, Add Users, Upload (500MB), Download */}
      {/* Row 2: Buzz (30s cooldown), Screenshot, Video Chat (10p), Voice Chat (Masks), Reels (500MB) */}
      {/* ==================================================================== */}
      <section className="bg-[#11162C] border-b border-indigo-950 px-2 sm:px-6 py-2 flex flex-col gap-1.5 shadow-md flex-shrink-0">
        {/* ROW 1 (5 BUTTONS) */}
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {/* Button 1: Deep Linking */}
          <button
            onClick={() => setShowDeepLinkModal(true)}
            className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-1 rounded-xl bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-500/30 text-white font-bold text-[10px] sm:text-xs transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
            title="Generate & Test efado-nexus.com Deep Links"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span className="truncate">Deep Link</span>
          </button>

          {/* Button 2: Share Button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-1 rounded-xl bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-500/30 text-white font-bold text-[10px] sm:text-xs transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
            title="Share Gist, Chat, Product, Reel to WhatsApp/Facebook"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="truncate">Share</span>
          </button>

          {/* Button 3: Add Users */}
          <button
            onClick={() => setShowAddUsersModal(true)}
            className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-1 rounded-xl bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-500/30 text-white font-bold text-[10px] sm:text-xs transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
            title="Invite by username, contact, QR code or Add to group"
          >
            <Users className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span className="truncate">+ Users</span>
          </button>

          {/* Button 4: Upload */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-1 rounded-xl bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-500/30 text-white font-bold text-[10px] sm:text-xs transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
            title="Cloud upload: Image, Video up to 500MB, PDF, Audio"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="truncate">Upload</span>
          </button>

          {/* Button 5: Download Manager */}
          <button
            onClick={() => setShowDownloadModal(true)}
            className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-1 rounded-xl bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-500/30 text-white font-bold text-[10px] sm:text-xs transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
            title="Auto Download Manager (Downloaded • 3.2 MB • Saved with folder)"
          >
            <FolderDown className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <span className="truncate">Download</span>
          </button>
        </div>

        {/* ROW 2 (5 BUTTONS) */}
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {/* Button 6: Buzz */}
          <button
            onClick={handleTriggerBuzz}
            disabled={buzzCooldown > 0}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-1 rounded-xl font-bold text-[10px] sm:text-xs transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer ${
              buzzCooldown > 0
                ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300 opacity-80 cursor-not-allowed'
                : 'bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/50 text-rose-200'
            }`}
            title="Alert Idle User (>2 mins) -> Full-screen buzz & vibration (30s cooldown)"
          >
            <Zap className={`w-3.5 h-3.5 text-rose-400 flex-shrink-0 ${buzzCooldown > 0 ? '' : 'animate-bounce'}`} />
            <span className="truncate">
              {buzzCooldown > 0 ? `Buzz (${buzzCooldown}s)` : 'Buzz ⚡'}
            </span>
          </button>

          {/* Button 7: Screenshot Button */}
          <button
            onClick={handleTakeScreenshot}
            disabled={isCapturingScreenshot}
            className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-1 rounded-xl bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-500/30 text-white font-bold text-[10px] sm:text-xs transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
            title="One-tap screenshot entire chat page with DP, timestamp & watermark"
          >
            <Camera className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
            <span className="truncate">{isCapturingScreenshot ? 'Capturing...' : 'Capture'}</span>
          </button>

          {/* Button 8: Video Chat */}
          <button
            onClick={() => setShowVideoCallModal(true)}
            className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-1 rounded-xl bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-500/30 text-white font-bold text-[10px] sm:text-xs transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
            title="WebRTC video call, 1-1 & group up to 10, screen share, 500MB recording"
          >
            <VideoIcon className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
            <span className="truncate">Video Chat</span>
          </button>

          {/* Button 9: Voice Chat */}
          <button
            onClick={() => setShowVoiceCallModal(true)}
            className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-1 rounded-xl bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-500/30 text-white font-bold text-[10px] sm:text-xs transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
            title="Voice call + Voice Mask filter [Robot, Fine Girl, Chief, Bishop] + background music"
          >
            <Mic className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <span className="truncate">Voice Chat</span>
          </button>

          {/* Button 10: Reels (500MB) */}
          <button
            onClick={() => setShowReelsModal(true)}
            className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-1 rounded-xl bg-gradient-to-r from-purple-600/40 to-pink-600/40 hover:from-purple-600/60 hover:to-pink-600/60 border border-pink-500/30 text-white font-bold text-[10px] sm:text-xs transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
            title="Short video 60-120s (500MB max) - Reply inside chat with reel"
          >
            <Film className="w-3.5 h-3.5 text-pink-300 flex-shrink-0" />
            <span className="truncate">Reels 500M</span>
          </button>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. STATUS / STORIES SECTION (Horizontal Scroll) */}
      {/* Your Story (+) , Sara, Jordan, Advert, Mia */}
      {/* User can place their video, advert, business promo as Status */}
      {/* Status rings: Gradient border, Ad = orange border + Ad tag */}
      {/* Click status -> full screen view with Reply, Share, Buzz & Creator Fund views */}
      {/* ==================================================================== */}
      <section className="bg-[#0B0F1F] border-b border-white/5 py-2.5 px-3 sm:px-6 flex items-center gap-3 overflow-x-auto custom-scrollbar flex-shrink-0">
        {/* Your Story (+) */}
        <div
          onClick={() => setShowStatusCreator(true)}
          className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0 group"
        >
          <div className="relative w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-full bg-[#11162C] overflow-hidden p-[2px] flex items-center justify-center">
              <img
                src={user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                alt="Your Story"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-indigo-600 rounded-full border-2 border-[#0B0F1F] flex items-center justify-center text-white text-[10px] font-bold shadow-md">
              +
            </div>
          </div>
          <span className="text-[10px] font-medium text-slate-300 group-hover:text-white truncate max-w-[60px]">
            Your Story
          </span>
        </div>

        {/* Stories List: Sara, Jordan, Advert, Mia */}
        {stories.map((story) => (
          <div
            key={story.id}
            onClick={() => setShowStatusViewer(story)}
            className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0 group"
          >
            <div
              className={`relative w-14 h-14 rounded-full p-[2.5px] transition-transform group-hover:scale-105 ${
                story.isAdvert
                  ? 'bg-gradient-to-tr from-orange-500 to-amber-400 ring-2 ring-orange-500/50'
                  : 'bg-gradient-to-tr from-[#6A4DFF] via-pink-500 to-indigo-500'
              }`}
            >
              <div className="w-full h-full rounded-full bg-[#11162C] overflow-hidden p-[2px]">
                <img
                  src={story.userAvatar}
                  alt={story.userName}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>

              {/* Ad Badge for Advert Stories */}
              {story.isAdvert && (
                <div className="absolute -top-1 -right-1 px-1 py-0.2 rounded bg-orange-600 border border-white text-[8px] font-black text-white uppercase shadow-md leading-tight">
                  AD
                </div>
              )}
            </div>
            <span className="text-[10px] font-medium text-slate-300 group-hover:text-white truncate max-w-[60px]">
              {story.userName}
            </span>
          </div>
        ))}
      </section>

      {/* ==================================================================== */}
      {/* 4. CHAT DISPLAY & VIEWPORT */}
      {/* Every message shows Display Picture (DP) on left (32px circle, online green dot) */}
      {/* Message bubble: white for others, purple gradient #6A4DFF to #8B6BFF for me */}
      {/* Timestamp + Delivered/Seen ticks below */}
      {/* Reactions with count, Reply, Translate to Pidgin/Chinese/French/Italian, Forward */}
      {/* Upload/Download card inside bubble with progress bar */}
      {/* Bargain Mode + Price Offer Tag if from Marketplace */}
      {/* ==================================================================== */}
      <div 
        ref={chatScrollContainerRef}
        className="flex-grow overflow-y-auto p-3 sm:p-6 bg-[#0E1326] flex flex-col gap-3 custom-scrollbar relative"
      >
        {/* Bargain Mode Banner (When opened from Marketplace "Chat Seller") */}
        {bargainMode && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 border border-indigo-500/40 flex items-center justify-between shadow-xl flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                <ShoppingBag className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                    Bargain Mode Active
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {bargainContext?.productTitle || 'Verified Market Item'}
                  </span>
                </div>
                <div className="text-xs font-bold text-white mt-0.5">
                  Original Price: <span className="text-amber-400">₦{(bargainContext?.productPrice || 15000).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-indigo-400 font-bold">₦</span>
                <input
                  type="number"
                  value={offerPriceInput}
                  onChange={(e) => setOfferPriceInput(e.target.value)}
                  placeholder="Your Offer"
                  className="w-28 pl-6 pr-2 py-1.5 bg-black/40 border border-indigo-500/40 rounded-xl text-xs text-white outline-none font-bold"
                />
              </div>
              <button
                onClick={() => {
                  setInputText(`I am offering ₦${Number(offerPriceInput).toLocaleString()} for this item! Can we deal?`);
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Send Offer
              </button>
            </div>
          </div>
        )}

        {/* Messages List */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 max-w-[85%] sm:max-w-[70%] group ${
              msg.isMe ? 'self-end flex-row-reverse' : 'self-start flex-row'
            }`}
          >
            {/* Display Picture (DP) of user on left (32px circle, online green dot) */}
            <div className="relative flex-shrink-0 mt-1">
              <img
                src={msg.senderAvatar}
                alt={msg.senderName}
                className="w-8 h-8 rounded-full object-cover border border-white/20 shadow-sm"
              />
              {msg.isOnline && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0E1326]" />
              )}
            </div>

            {/* Bubble & Metadata */}
            <div className="flex flex-col gap-1">
              {/* Sender Name for non-self */}
              {!msg.isMe && (
                <span className="text-[10px] font-bold text-slate-400 px-1">
                  {msg.senderName}
                </span>
              )}

              {/* Quoted Reply if any */}
              {msg.replyTo && (
                <div className="p-2 rounded-xl bg-black/20 border-l-4 border-indigo-400 text-[10px] text-slate-300">
                  <span className="font-bold text-indigo-300">{msg.replyTo.senderName}: </span>
                  <span className="truncate">{msg.replyTo.text}</span>
                </div>
              )}

              {/* Message Bubble: White for others, Purple gradient #6A4DFF to #8B6BFF for me */}
              <div
                className={`p-3.5 rounded-2xl relative shadow-md transition-all ${
                  msg.isMe
                    ? 'bg-gradient-to-r from-[#6A4DFF] to-[#8B6BFF] text-white rounded-tr-none'
                    : 'bg-white text-slate-900 rounded-tl-none border border-slate-200'
                }`}
              >
                {/* Price Offer Tag if in Bargain Mode */}
                {msg.offerTag && (
                  <div className="mb-2 p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center justify-between">
                    <span>🏷️ Price Offer: ₦{msg.offerTag.price.toLocaleString()}</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-600 text-white font-black">
                      {msg.offerTag.status}
                    </span>
                  </div>
                )}

                {/* Main text content */}
                <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  {msg.text}
                </p>

                {/* AI Translated preview if translated */}
                {msg.translated && (
                  <div className="mt-2 pt-2 border-t border-white/20 text-xs text-indigo-100 italic bg-black/20 p-2 rounded-xl">
                    <div className="flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider text-amber-300 not-italic mb-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>{msg.translated.lang} Translation</span>
                    </div>
                    {msg.translated.text}
                  </div>
                )}

                {/* Upload/Download Card inside bubble with progress bar */}
                {msg.attachment && (
                  <div className={`mt-2.5 p-2.5 rounded-xl border flex flex-col gap-2 ${
                    msg.isMe ? 'bg-black/20 border-white/20' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-600">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold truncate max-w-[140px] sm:max-w-[200px]">
                            {msg.attachment.name}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {msg.attachment.size} • Verified Cloud File
                          </span>
                        </div>
                      </div>

                      <a
                        href={msg.attachment.url}
                        download={msg.attachment.name}
                        className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
                        title="Download file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {/* Progress Bar inside bubble */}
                    <div className="w-full bg-slate-200/40 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${msg.attachment.progress || 100}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono text-right">
                      Downloaded • {msg.attachment.size} • Saved with folder
                    </span>
                  </div>
                )}

                {/* Timestamp + Delivered/Seen ticks below */}
                <div
                  className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                    msg.isMe ? 'text-indigo-200' : 'text-slate-400'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.isMe && (
                    <span>
                      {msg.status === 'seen' ? (
                        <CheckCheck className="w-3 h-3 text-cyan-300 inline" />
                      ) : (
                        <Check className="w-3 h-3 text-indigo-300 inline" />
                      )}
                    </span>
                  )}
                </div>

                {/* Reactions badge display */}
                {Object.keys(msg.reactions).length > 0 && (
                  <div className="absolute -bottom-2.5 right-2 flex items-center gap-1 bg-[#1A2238] border border-white/20 rounded-full px-2 py-0.5 text-[10px] shadow-md text-white">
                    {Object.entries(msg.reactions).map(([emoji, count]) => (
                      <span key={emoji} className="flex items-center gap-0.5">
                        {emoji} {count > 1 && <span className="text-[8px] font-bold">{count}</span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Toolbar on Hover/Touch: Reactions, Reply, Translate, Forward */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-1">
                {/* Quick Emoji Reactions */}
                {['❤️', '👍', '😂', '🔥', '😮'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleAddReaction(msg.id, emoji)}
                    className="p-1 rounded-full hover:bg-white/10 text-xs transition-transform hover:scale-125"
                  >
                    {emoji}
                  </button>
                ))}

                {/* Reply */}
                <button
                  onClick={() => setReplyTarget(msg)}
                  className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/15 text-[10px] font-bold text-slate-300 hover:text-white"
                  title="Reply to message"
                >
                  Reply
                </button>

                {/* Translate to Pidgin / Chinese / French / Italian */}
                <div className="relative group/lang">
                  <button
                    onClick={() => handleTranslateMessage(msg.id, 'pidgin')}
                    className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/15 text-[10px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1"
                    title="Translate"
                  >
                    <Languages className="w-2.5 h-2.5" />
                    <span>Translate</span>
                  </button>

                  <div className="hidden group-hover/lang:flex absolute left-0 bottom-full mb-1 bg-[#1A2238] border border-white/20 rounded-xl p-1 shadow-2xl flex-col gap-0.5 z-40 w-28">
                    {[
                      { code: 'pidgin', label: '🇳🇬 Pidgin' },
                      { code: 'chinese', label: '🇨🇳 Chinese' },
                      { code: 'french', label: '🇫🇷 French' },
                      { code: 'italian', label: '🇮🇹 Italian' },
                      { code: 'yoruba', label: '🇳🇬 Yoruba' },
                      { code: 'igbo', label: '🇳🇬 Igbo' },
                      { code: 'hausa', label: '🇳🇬 Hausa' }
                    ].map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleTranslateMessage(msg.id, lang.code)}
                        className="px-2 py-1 rounded-lg text-left text-[10px] font-medium text-slate-200 hover:bg-indigo-600 hover:text-white"
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Forward */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(msg.text);
                    alert('Message copied for forwarding across EFADO NEXUS rooms!');
                  }}
                  className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/15 text-[10px] font-bold text-slate-300 hover:text-white"
                >
                  Forward
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator with DP */}
        {isPeerTyping && (
          <div className="flex items-center gap-2 self-start bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-slate-300 text-xs">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"
              alt="Sara"
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="text-[11px] font-medium">Sara is typing</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce delay-150" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce delay-300" />
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 5. WELL DEFINED CHAT TEXT BOX (Bottom) */}
      {/* Design: White pill, 56px height min, expands to 120px, 24px radius, shadow */}
      {/* Placeholder: Type a message... */}
      {/* Left: Emoji button 😊 */}
      {/* Right inside box: Attachment 📎, AI ✨ AI, Gift 🎁, Voice Mask 🎭 */}
      {/* Outside box: Purple mic button 🎤 - hold to record, slide to cancel, with Voice Mask toggle */}
      {/* Inside features: @mention users, Typing indicator with DP, Auto correct + Pidgin suggestion */}
      {/* ==================================================================== */}
      <footer className="p-3 sm:p-4 bg-[#0A0E1F] border-t border-white/10 flex flex-col gap-2 relative flex-shrink-0">
        {/* Pidgin Suggestion Bar */}
        {pidginSuggestion && (
          <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-indigo-950/90 border border-indigo-500/40 text-xs text-indigo-200 shadow-md">
            <div className="flex items-center gap-2 truncate">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
              <span className="font-bold text-amber-300">Pidgin Suggestion:</span>
              <span className="truncate italic">"{pidginSuggestion}"</span>
            </div>
            <button
              onClick={() => {
                setInputText(pidginSuggestion);
                setPidginSuggestion(null);
              }}
              className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] shadow-sm ml-2 flex-shrink-0 cursor-pointer"
            >
              Use Suggestion
            </button>
          </div>
        )}

        {/* Reply Quote Banner */}
        {replyTarget && (
          <div className="flex items-center justify-between px-4 py-1.5 rounded-xl bg-white/5 border border-indigo-500/30 text-xs text-white">
            <div className="flex items-center gap-2 truncate">
              <span className="text-[10px] font-bold text-indigo-400">Replying to {replyTarget.senderName}:</span>
              <span className="truncate text-slate-300 text-xs">{replyTarget.text}</span>
            </div>
            <button onClick={() => setReplyTarget(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Textbox Row */}
        <div className="flex items-center gap-2.5 max-w-5xl mx-auto w-full">
          {/* White Pill Container: min-h-[56px], max-h-[120px], 24px radius, shadow */}
          <div className="flex-grow flex items-center bg-white rounded-[24px] shadow-2xl px-3 sm:px-4 py-1.5 min-h-[56px] border border-slate-200 transition-all focus-within:ring-2 focus-within:ring-[#6A4DFF]">
            {/* Left: Emoji Button 😊 */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                title="Choose Emoji"
              >
                <Smile className="w-5 h-5 text-amber-500" />
              </button>

              {/* Emoji Picker Popover */}
              {isEmojiPickerOpen && (
                <div className="absolute left-0 bottom-full mb-3 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 grid grid-cols-6 gap-2 z-50 w-64">
                  {['😊', '😂', '🔥', '❤️', '👍', '🎉', '🚀', '💯', '🙏', '🙌', '😎', '✨', '⚡', '💰', '👑', '🤝', '🇳🇬', '🌍'].map((em) => (
                    <button
                      key={em}
                      onClick={() => {
                        setInputText((prev) => prev + em);
                        setIsEmojiPickerOpen(false);
                      }}
                      className="text-lg hover:scale-125 transition-transform"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input Text Area */}
            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              className="flex-grow bg-transparent text-slate-900 placeholder:text-slate-400 text-sm font-medium px-2 py-1 outline-none resize-none max-h-[120px] custom-scrollbar"
            />

            {/* Right Inside Box: Attachment 📎, AI ✨ AI, Gift 🎁, Voice Mask 🎭 */}
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              {/* Attachment 📎 */}
              <label 
                className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                title="Attach Document / Media"
              >
                <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleStartCloudUpload(file);
                  }}
                />
              </label>

              {/* AI ✨ AI Button */}
              <button
                type="button"
                onClick={() => {
                  if (!inputText.trim()) {
                    setInputText("Hello! What is the latest update on EFADO NEXUS HUB?");
                  } else {
                    setInputText((prev) => `${prev} (Refined with EFADO AI ✨)`);
                  }
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold text-[10px] sm:text-xs transition-all shadow-sm cursor-pointer"
                title="AI Pidgin & Smart Assistant"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden xs:inline">AI</span>
              </button>

              {/* Gift 🎁 */}
              <button
                type="button"
                onClick={() => setShowGiftModal(true)}
                className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 text-slate-600 hover:text-amber-600 transition-colors cursor-pointer"
                title="Send Virtual Gift / ₦ Token"
              >
                <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
              </button>

              {/* Voice Mask 🎭 inside box */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowVoiceMaskPopover(!showVoiceMaskPopover)}
                  className={`p-1.5 sm:p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer ${
                    activeVoiceMask !== 'Normal' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600'
                  }`}
                  title={`Voice Mask: ${activeVoiceMask}`}
                >
                  <Music className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                </button>

                {showVoiceMaskPopover && (
                  <div className="absolute right-0 bottom-full mb-3 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2.5 z-50 w-48 text-slate-900">
                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider block mb-1.5">
                      Voice Mask Filter
                    </span>
                    {(['Normal', 'Robot', 'Fine Girl', 'Chief', 'Bishop'] as const).map((mask) => (
                      <button
                        key={mask}
                        onClick={() => {
                          setActiveVoiceMask(mask);
                          setShowVoiceMaskPopover(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                          activeVoiceMask === mask ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span>{mask}</span>
                        {activeVoiceMask === mask && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Send Button or Purple Mic Outside Box 🎤 */}
          {inputText.trim() ? (
            <button
              onClick={() => handleSendMessage()}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#6A4DFF] to-[#8B6BFF] hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-indigo-500/30 flex-shrink-0 cursor-pointer transition-all"
              title="Send message"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          ) : (
            <button
              onMouseDown={() => setIsRecordingAudio(true)}
              onMouseUp={() => {
                setIsRecordingAudio(false);
                if (recordingSeconds > 1) {
                  alert(`Voice note recorded (${recordingSeconds}s) with ${activeVoiceMask} Voice Mask applied! Sent.`);
                }
              }}
              onTouchStart={() => setIsRecordingAudio(true)}
              onTouchEnd={() => {
                setIsRecordingAudio(false);
                if (recordingSeconds > 1) {
                  alert(`Voice note recorded (${recordingSeconds}s) with ${activeVoiceMask} Voice Mask applied! Sent.`);
                }
              }}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-xl flex-shrink-0 cursor-pointer transition-all relative ${
                isRecordingAudio
                  ? 'bg-rose-600 scale-110 animate-pulse ring-4 ring-rose-400'
                  : 'bg-gradient-to-tr from-[#6A4DFF] to-[#8B6BFF] hover:scale-105 active:scale-95 shadow-indigo-500/30'
              }`}
              title="Hold to record audio, slide to cancel"
            >
              <Mic className="w-5 h-5" />
              {activeVoiceMask !== 'Normal' && (
                <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded-full bg-indigo-900 border border-white text-[7px] font-black uppercase text-amber-300">
                  {activeVoiceMask.slice(0, 4)}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Audio Recording overlay banner */}
        {isRecordingAudio && (
          <div className="flex items-center justify-center gap-3 py-1 text-xs text-rose-400 font-bold animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Recording Voice ({recordingSeconds}s) • Voice Mask: [{activeVoiceMask}] • Release to send</span>
          </div>
        )}
      </footer>

      {/* ==================================================================== */}
      {/* FULL SCREEN BUZZ ALERT OVERLAY ("Alex buzzed you • just now") */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {fullScreenBuzzAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 bg-rose-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="w-24 h-24 rounded-full bg-rose-600 flex items-center justify-center text-white text-4xl mb-6 shadow-2xl animate-bounce">
              ⚡
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase mb-2">
              {fullScreenBuzzAlert.sender} buzzed you!
            </h2>
            <p className="text-base text-rose-200 font-medium mb-6">
              • {fullScreenBuzzAlert.time} •
            </p>
            <button
              onClick={() => setFullScreenBuzzAlert(null)}
              className="px-8 py-3 rounded-2xl bg-white text-rose-900 font-black text-sm uppercase tracking-wider shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              Acknowledge Buzz
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* MODAL 1: DEEP LINKING (efado-nexus.com/gist/{id}, user, market) */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {showDeepLinkModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-[#141A33] border border-indigo-500/40 rounded-3xl p-6 text-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-black uppercase tracking-tight">EFADO Deep Linking Gateway</h3>
                </div>
                <button onClick={() => setShowDeepLinkModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-300 mb-4">
                When external links are clicked outside the app (WhatsApp, browser, SMS), they open directly inside EFADO NEXUS HUB using Firebase Dynamic Links & Branch.io.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {(['gist', 'user', 'market'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setDeepLinkType(type);
                        setGeneratedDeepLink(`efado-nexus.com/${type}/${deepLinkIdInput}`);
                      }}
                      className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        deepLinkType === type ? 'bg-indigo-600 text-white shadow-md' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Target ID / Slug</label>
                  <input
                    type="text"
                    value={deepLinkIdInput}
                    onChange={(e) => {
                      setDeepLinkIdInput(e.target.value);
                      setGeneratedDeepLink(`efado-nexus.com/${deepLinkType}/${e.target.value}`);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Formatted Deep Link Preview */}
                <div className="p-3.5 rounded-2xl bg-indigo-950/70 border border-indigo-500/40">
                  <span className="text-[10px] font-bold uppercase text-indigo-300 block mb-1">Generated Universal Link</span>
                  <div className="text-sm font-mono text-cyan-300 font-bold truncate">
                    {generatedDeepLink}
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-1">
                    Universal Dynamic Link: https://efadonexus.page.link/?link=https://e-fado.com/nexus-hub?type={deepLinkType}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://${generatedDeepLink}`);
                      alert(`Universal Deep Link copied: https://${generatedDeepLink}`);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Deep Link</span>
                  </button>
                  <button
                    onClick={() => {
                      alert(`Testing simulated direct app launch into ${generatedDeepLink}!`);
                      setShowDeepLinkModal(false);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase transition-all"
                  >
                    Test Open
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* MODAL 2: NATIVE SHARE SHEET (WhatsApp, Facebook, Copy Link) */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-md bg-[#141A33] border border-indigo-500/40 rounded-3xl p-6 text-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-black uppercase tracking-tight">Share Nexus Comms</h3>
                </div>
                <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    const text = encodeURIComponent(`Check out this on EFADO NEXUS HUB: https://efado-nexus.com/hub`);
                    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                  }}
                  className="w-full p-3 rounded-2xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 flex items-center gap-3 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-white">Share to WhatsApp</div>
                    <div className="text-[10px] text-emerald-300">Fast share with deep link preview</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    const url = encodeURIComponent('https://efado-nexus.com/hub');
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
                  }}
                  className="w-full p-3 rounded-2xl bg-blue-950/70 hover:bg-blue-900 border border-blue-500/40 flex items-center gap-3 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-white">Share to Facebook</div>
                    <div className="text-[10px] text-blue-300">Post directly to timeline & groups</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText('https://efado-nexus.com/hub');
                    alert('Direct EFADO NEXUS HUB deep link copied to clipboard!');
                    setShowShareModal(false);
                  }}
                  className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-3 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                    <Copy className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-white">Copy Direct Link</div>
                    <div className="text-[10px] text-slate-400">efado-nexus.com/hub</div>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* MODAL 3: ADD USERS (+ Add Users to group / invite by QR, contact) */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {showAddUsersModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-md bg-[#141A33] border border-indigo-500/40 rounded-3xl p-6 text-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-black uppercase tracking-tight">Add Users to Nexus Group</h3>
                </div>
                <button onClick={() => setShowAddUsersModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {(['username', 'phone', 'qr', 'link'] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => setAddMethod(method)}
                      className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                        addMethod === method ? 'bg-indigo-600 text-white shadow-md' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                {addMethod === 'username' && (
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Enter Username</label>
                    <input
                      type="text"
                      value={addUserInput}
                      onChange={(e) => setAddUserInput(e.target.value)}
                      placeholder="@alex_nexus"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                {addMethod === 'phone' && (
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Phone Contact</label>
                    <input
                      type="tel"
                      value={addUserInput}
                      onChange={(e) => setAddUserInput(e.target.value)}
                      placeholder="+234 800 000 0000"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                {addMethod === 'qr' && (
                  <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white text-slate-900 gap-2">
                    <QrCode className="w-28 h-28 text-indigo-600" />
                    <span className="text-xs font-bold">Scan to Join This Nexus Group</span>
                    <span className="text-[10px] text-slate-500 font-mono">ROOM_ID: {activeChatRoom}</span>
                  </div>
                )}

                {addMethod === 'link' && (
                  <div className="p-3 rounded-2xl bg-black/30 border border-white/10">
                    <span className="text-[10px] text-slate-400 block mb-1">Invite Link</span>
                    <span className="text-xs font-mono text-cyan-300 block truncate">
                      https://efado-nexus.com/user/{user.uid}?invite=group_{activeChatRoom}
                    </span>
                  </div>
                )}

                <button
                  onClick={() => {
                    alert(`Invitation sent to ${addUserInput || 'contact'}! User added to Nexus Group.`);
                    setShowAddUsersModal(false);
                  }}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
                >
                  + Add Users to Group
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* MODAL 4: CLOUD UPLOAD (Supports up to 500MB, Progress Bar 72%) */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-md bg-[#141A33] border border-indigo-500/40 rounded-3xl p-6 text-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-black uppercase tracking-tight">Cloud Upload (500MB Limit)</h3>
                </div>
                <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isUploading ? (
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white truncate max-w-[200px]">{uploadedFileName}</span>
                    <span className="font-mono text-amber-300 font-bold">{uploadProgress}% uploading...</span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-white/10">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>

                  <p className="text-[10px] text-slate-400 text-center">
                    Streaming securely to EFADO Cloud Storage • Chunk size optimized
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-white/5">
                    <Upload className="w-8 h-8 text-indigo-400" />
                    <span className="text-xs font-bold text-white">Choose File or Drag Here</span>
                    <span className="text-[10px] text-slate-400 text-center">
                      Supports Image, Video up to 500MB, PDF, DOCX, Audio, Product file
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleStartCloudUpload(file);
                      }}
                    />
                  </label>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* MODAL 5: AUTO DOWNLOAD MANAGER (Downloaded • 3.2 MB • Saved with folder) */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {showDownloadModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-[#141A33] border border-indigo-500/40 rounded-3xl p-6 text-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <FolderDown className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-black uppercase tracking-tight">Auto Download Manager</h3>
                </div>
                <button onClick={() => setShowDownloadModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar">
                {downloadHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-[260px]">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-medium">
                          {item.status}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => alert(`Opening ${item.name} in EFADO file viewer!`)}
                      className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold shadow-sm"
                    >
                      Open
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* MODAL 6: SCREENSHOT PREVIEW MODAL */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {screenshotPreview && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#141A33] border border-indigo-500/40 rounded-3xl p-6 text-white shadow-2xl flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-pink-400" />
                  <h3 className="text-sm font-black uppercase">Captured Chat Snapshot</h3>
                </div>
                <button onClick={() => setScreenshotPreview(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden border border-white/10 max-h-80 overflow-y-auto">
                <img src={screenshotPreview} alt="Screenshot" className="w-full h-auto object-contain" />
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={screenshotPreview}
                  download="EFADO_NEXUS_CHAT.png"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Download className="w-4 h-4" /> Save to Gallery
                </a>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: 'EFADO NEXUS HUB Chat', url: window.location.href });
                    } else {
                      alert('Share link copied!');
                    }
                  }}
                  className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase transition-all"
                >
                  Share
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* MODAL 7: WEBRTC VIDEO CALL (1-1 and group up to 10, Screen Share, 500MB Recording) */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {showVideoCallModal && (
          <div className="fixed inset-0 z-50 bg-[#070A18]/95 backdrop-blur-2xl flex flex-col p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
                  <VideoIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase">WebRTC Video Call (Active Group)</h3>
                  <span className="text-[10px] text-teal-400 font-mono">
                    Participants: 4 / 10 • Encrypted P2P Bridge
                  </span>
                </div>
              </div>

              {/* Recording indicator */}
              <div className="flex items-center gap-2">
                {isCallRecording && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600/30 border border-rose-500 text-rose-300 text-[10px] font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>REC (Limit 500MB)</span>
                  </div>
                )}
                <button
                  onClick={() => setShowVideoCallModal(false)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase"
                >
                  End Call
                </button>
              </div>
            </div>

            {/* Video Grid (Up to 10 participants) */}
            <div className="flex-grow grid grid-cols-2 md:grid-cols-4 gap-3 overflow-y-auto mb-4">
              {[
                { name: user.displayName || 'You', avatar: user.photoURL, isSelf: true },
                { name: 'Dr. Sarah (Lead)', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80' },
                { name: 'Chief Emeka', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
                { name: 'Mia (Accra)', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' }
              ].map((p, idx) => (
                <div key={idx} className="relative rounded-2xl overflow-hidden bg-slate-900 border border-white/10 flex items-center justify-center min-h-[160px]">
                  {p.isSelf && isCameraOff ? (
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <VideoOff className="w-8 h-8" />
                      <span className="text-xs">Camera Off</span>
                    </div>
                  ) : (
                    <img src={p.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'} alt={p.name} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 text-[10px] font-bold text-white">
                    {p.name}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Call Controls */}
            <div className="flex items-center justify-center gap-3 py-3 border-t border-white/10">
              <button
                onClick={() => setIsVideoMuted(!isVideoMuted)}
                className={`p-3 rounded-full transition-all ${
                  isVideoMuted ? 'bg-rose-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title="Mute / Unmute"
              >
                {isVideoMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setIsCameraOff(!isCameraOff)}
                className={`p-3 rounded-full transition-all ${
                  isCameraOff ? 'bg-rose-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title="Video Camera On / Off"
              >
                {isCameraOff ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
              </button>

              <button
                onClick={() => {
                  setIsScreenSharing(!isScreenSharing);
                  alert(isScreenSharing ? 'Screen sharing stopped' : 'Screen share initiated with Nexus participants');
                }}
                className={`p-3 rounded-full transition-all ${
                  isScreenSharing ? 'bg-cyan-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title="Share Screen"
              >
                <Maximize2 className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  setIsCallRecording(!isCallRecording);
                  alert(isCallRecording ? 'Recording stopped and saved to download manager!' : 'Recording started (500MB limit)');
                }}
                className={`px-4 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all ${
                  isCallRecording ? 'bg-rose-600 text-white animate-pulse' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {isCallRecording ? 'Stop Recording' : 'Record (500MB)'}
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* MODAL 8: VOICE CHAT WITH VOICE MASKS [Robot, Fine Girl, Chief, Bishop] */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {showVoiceCallModal && (
          <div className="fixed inset-0 z-50 bg-[#070A18]/95 backdrop-blur-2xl flex items-center justify-center p-4 text-white">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#141A33] border border-indigo-500/40 rounded-3xl p-6 text-white shadow-2xl flex flex-col gap-4 text-center"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Mic className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-black uppercase">Voice Chat & Mask Filter</h3>
                </div>
                <button onClick={() => setShowVoiceCallModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 mx-auto flex items-center justify-center text-3xl shadow-xl animate-pulse">
                🎙️
              </div>

              <div>
                <h4 className="text-base font-black">Connected to Dr. Sarah</h4>
                <p className="text-xs text-indigo-300 font-mono">03:14 • Crystal Clear Audio</p>
              </div>

              {/* Voice Mask selector [Robot, Fine Girl, Chief, Bishop] */}
              <div className="text-left space-y-2">
                <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider block">
                  Select Live Voice Mask:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(['Robot', 'Fine Girl', 'Chief', 'Bishop', 'Normal'] as const).map((mask) => (
                    <button
                      key={mask}
                      onClick={() => setActiveVoiceMask(mask)}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                        activeVoiceMask === mask
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300'
                      }`}
                    >
                      <span>{mask}</span>
                      {activeVoiceMask === mask && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Music Selector */}
              <div className="text-left space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider block">
                  Background Music Preset:
                </span>
                <select
                  value={backgroundMusic}
                  onChange={(e) => setBackgroundMusic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs outline-none"
                >
                  <option value="Afrobeats Chill">Afrobeats Chill Vibes</option>
                  <option value="Lofi Ambient">Lofi Study & Work</option>
                  <option value="Church Praise">Spiritual & Gospel Tone</option>
                  <option value="Corporate Calm">Corporate Meeting Acoustic</option>
                </select>
              </div>

              <button
                onClick={() => setShowVoiceCallModal(false)}
                className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-lg transition-all"
              >
                End Voice Call
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* MODAL 9: REELS MODAL (60-120s, up to 500MB, reply in chat with reel) */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {showReelsModal && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-md bg-[#141A33] border border-pink-500/40 rounded-3xl p-6 text-white shadow-2xl flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Film className="w-5 h-5 text-pink-400" />
                  <h3 className="text-sm font-black uppercase">Reels & Video Reply (500MB)</h3>
                </div>
                <button onClick={() => setShowReelsModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  Record or upload a 60-120s viral reel up to 500MB. You can reply directly inside chat with this video reel!
                </p>

                <label className="border-2 border-dashed border-pink-500/40 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/5 transition-all">
                  <Film className="w-8 h-8 text-pink-400" />
                  <span className="text-xs font-bold text-white">Select Video (60-120s, 500MB max)</span>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        alert(`Reel "${file.name}" uploaded and replied to current chat!`);
                        setShowReelsModal(false);
                      }
                    }}
                  />
                </label>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* MODAL 10: STATUS / STORY FULL SCREEN VIEWER */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {showStatusViewer && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6 text-white">
            {/* Top progress bar */}
            <div>
              <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden mb-3">
                <div className="bg-white h-full w-2/3 animate-pulse" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={showStatusViewer.userAvatar}
                    alt={showStatusViewer.userName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black">{showStatusViewer.userName}</span>
                      {showStatusViewer.isAdvert && (
                        <span className="px-1.5 py-0.5 rounded bg-orange-600 text-white font-black text-[9px] uppercase">
                          AD
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-300 font-mono">
                      Views: {showStatusViewer.views.toLocaleString()} • Creator Fund: ₦{showStatusViewer.earnings}
                    </span>
                  </div>
                </div>

                <button onClick={() => setShowStatusViewer(null)} className="text-slate-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Media Display */}
            <div className="flex-grow flex items-center justify-center my-4 max-h-[70vh]">
              <img
                src={showStatusViewer.mediaUrl}
                alt="Status Media"
                className="max-h-full rounded-2xl object-contain shadow-2xl border border-white/10"
              />
            </div>

            {/* Caption & Bottom Controls (Reply, Share, Buzz) */}
            <div className="space-y-3 max-w-lg mx-auto w-full">
              <p className="text-sm font-medium text-center text-slate-200">
                {showStatusViewer.caption}
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Reply to status..."
                  className="flex-grow px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white text-xs outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      alert('Reply sent to user direct message!');
                      setShowStatusViewer(null);
                    }
                  }}
                />

                <button
                  onClick={() => {
                    alert('Status shared to your EFADO story feed!');
                  }}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
                  title="Share Status"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                <button
                  onClick={handleTriggerBuzz}
                  className="p-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white"
                  title="Buzz Status Creator"
                >
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* MODAL 11: STATUS CREATOR (Add video / advert / business promo) */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {showStatusCreator && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-md bg-[#141A33] border border-indigo-500/40 rounded-3xl p-6 text-white shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-black uppercase">Create Story or Business Promo</h3>
                <button onClick={() => setShowStatusCreator(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Status Caption</label>
                <textarea
                  rows={2}
                  value={newStatusCaption}
                  onChange={(e) => setNewStatusCaption(e.target.value)}
                  placeholder="Describe your story or business advert..."
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <span className="text-xs font-bold text-white block">Mark as Business Advert</span>
                  <span className="text-[10px] text-orange-400">Gets orange status ring + AD badge</span>
                </div>
                <input
                  type="checkbox"
                  checked={isNewStatusAdvert}
                  onChange={(e) => setIsNewStatusAdvert(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-500"
                />
              </div>

              <button
                onClick={() => {
                  const newStory: StoryItem = {
                    id: 's_' + Date.now(),
                    userName: user.displayName || 'You',
                    userAvatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
                    isAdvert: isNewStatusAdvert,
                    adTag: isNewStatusAdvert ? 'AD' : undefined,
                    mediaUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
                    mediaType: 'image',
                    caption: newStatusCaption || 'Check out my new status on EFADO NEXUS!',
                    views: 0,
                    earnings: 0,
                    duration: 30
                  };
                  setStories((prev) => [newStory, ...prev]);
                  setShowStatusCreator(false);
                  setNewStatusCaption('');
                  setIsNewStatusAdvert(false);
                  alert('Status published! Views are now linked to your Creator Fund.');
                }}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg"
              >
                Publish Status
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* MODAL 12: CREATOR FUND WITHDRAW MODAL */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-md bg-[#141A33] border border-amber-500/40 rounded-3xl p-6 text-white shadow-2xl space-y-4 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-300 mx-auto flex items-center justify-center text-2xl font-black">
                ₦
              </div>

              <div>
                <h3 className="text-lg font-black uppercase">Creator Fund Wallet</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Rate: ₦100 per 1,000 views • ₦1,840 Qualified bonus applied!
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/30">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Available Creator Balance</span>
                <span className="text-2xl font-black text-amber-300">₦{creatorEarnings.toLocaleString()}</span>
                <span className="text-[10px] text-slate-500 block mt-1">Qualified Views: {qualifiedViews.toLocaleString()}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleWithdrawEarnings}
                  className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all"
                >
                  Withdraw to Player Wallet
                </button>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* MODAL 13: GIFT POPUP */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {showGiftModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-sm bg-[#141A33] border border-amber-500/40 rounded-3xl p-6 text-white shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-black uppercase">Send Virtual Gift</h3>
                </div>
                <button onClick={() => setShowGiftModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: 'Bronze Cup', icon: '🏆', price: 500 },
                  { name: 'Crown', icon: '👑', price: 2000 },
                  { name: 'Diamond Rocket', icon: '🚀', price: 5000 }
                ].map((gift) => (
                  <button
                    key={gift.name}
                    onClick={() => {
                      alert(`Sent ${gift.name} (₦${gift.price}) to recipient!`);
                      setShowGiftModal(false);
                    }}
                    className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center gap-1 transition-all"
                  >
                    <span className="text-2xl">{gift.icon}</span>
                    <span className="text-[10px] font-bold text-white">{gift.name}</span>
                    <span className="text-[9px] text-amber-400 font-mono">₦{gift.price}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EfadoNexusHub;
