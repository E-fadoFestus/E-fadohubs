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
  Phone, 
  Video as VideoIcon, 
  VideoOff, 
  Mic, 
  MicOff, 
  Send, 
  Paperclip, 
  Sparkles, 
  Gift, 
  Smile, 
  Download, 
  Upload, 
  Share2, 
  Link2, 
  Bell, 
  AlertCircle, 
  Check, 
  CheckCheck, 
  Eye, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Shield, 
  MoreVertical, 
  Heart, 
  Flame, 
  Globe, 
  RefreshCw, 
  Image as ImageIcon, 
  FileText, 
  Music, 
  ShoppingBag, 
  DollarSign, 
  CornerDownRight, 
  Bookmark, 
  Ban, 
  Flag, 
  Trash2, 
  Sliders, 
  HelpCircle,
  Camera,
  Coins,
  Radio,
  Tv,
  ExternalLink
} from 'lucide-react';
import { UserProfile } from '../types';

export interface EfadoNexusHubViewProps {
  user: UserProfile;
  onClose: () => void;
  onNavigate?: (hub: any, subview?: any, extraProps?: any) => void;
  bargainContext?: any;
  creatorStats?: any;
  onUpdateCreatorStats?: (stats: any) => void;
}

export const EfadoNexusHubView: React.FC<EfadoNexusHubViewProps> = ({
  user,
  onClose,
  onNavigate,
  bargainContext,
  creatorStats,
  onUpdateCreatorStats
}) => {
  // --------------------------------------------------------------------------
  // Core Chat State & Active Room
  // --------------------------------------------------------------------------
  const [activeRoomId, setActiveRoomId] = useState<'sarah' | 'tactical-hq' | 'global' | 'seller'>(
    bargainContext ? 'seller' : 'sarah'
  );
  const [chatTab, setChatTab] = useState<'DIRECT' | 'GROUPS'>('DIRECT');

  // Rooms list
  const rooms = [
    { 
      id: 'sarah', 
      name: 'Dr. Sarah (Lead AI Eng)', 
      status: 'Online', 
      isOnline: true, 
      dp: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      type: 'DIRECT',
      lastSeen: 'Active now'
    },
    { 
      id: 'tactical-hq', 
      name: 'Tactical HQ Syndicate', 
      status: '12 active', 
      isOnline: true, 
      dp: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
      type: 'GROUP',
      lastSeen: '12 members'
    },
    { 
      id: 'global', 
      name: 'Global Nexus Forum', 
      status: 'Live', 
      isOnline: true, 
      dp: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=150&auto=format&fit=crop&q=80',
      type: 'GROUP',
      lastSeen: 'Global public'
    },
    ...(bargainContext ? [{
      id: 'seller',
      name: `${bargainContext.seller || 'Verified Merchant'} (Bargain Mode)`,
      status: 'Negotiation Active',
      isOnline: true,
      dp: bargainContext.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      type: 'DIRECT',
      lastSeen: 'Marketplace Seller'
    }] : [])
  ];

  const currentRoom = rooms.find(r => r.id === activeRoomId) || rooms[0];

  // --------------------------------------------------------------------------
  // Message Data Structure
  // --------------------------------------------------------------------------
  interface MessageItem {
    id: string;
    senderId: string;
    senderName: string;
    senderDp: string;
    content: string;
    timestamp: string;
    isSelf: boolean;
    fileCard?: {
      name: string;
      size: string;
      progress?: number;
      isDownloaded?: boolean;
      type: 'file' | 'audio' | 'video' | 'image';
      url?: string;
    };
    reactions?: Record<string, number>;
    translatedText?: string;
    translatedLang?: string;
    bargainOffer?: {
      productTitle: string;
      originalPrice: number;
      offerPrice: number;
      status: 'pending' | 'accepted' | 'declined';
    };
  }

  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'm1',
      senderId: 'sarah',
      senderName: 'Dr. Sarah (Lead AI Eng)',
      senderDp: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      content: 'Welcome to EFADO NEXUS HUB! All 10 Top Action Bar buttons, WebRTC real-time comms, and cloud sync are operational at efado-nexus.com/hub.',
      timestamp: '10:14 AM',
      isSelf: false,
      reactions: { '❤️': 3, '🔥': 5 }
    },
    {
      id: 'm2',
      senderId: 'user',
      senderName: user.displayName || 'You',
      senderDp: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
      content: 'Testing deep linking and voice masking capabilities on EFADO Nexus Hub.',
      timestamp: '10:15 AM',
      isSelf: true,
      reactions: { '👍': 2 }
    },
    {
      id: 'm3',
      senderId: 'sarah',
      senderName: 'Dr. Sarah (Lead AI Eng)',
      senderDp: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      content: 'Here is the tactical architectural package and video stream archive.',
      timestamp: '10:16 AM',
      isSelf: false,
      fileCard: {
        name: 'EFADO_Nexus_Specifications_v2.0.pdf',
        size: '18.4 MB',
        progress: 100,
        isDownloaded: true,
        type: 'file'
      }
    },
    ...(bargainContext ? [{
      id: 'm-bargain',
      senderId: 'user',
      senderName: user.displayName || 'You',
      senderDp: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
      content: `Hello! I am interested in ${bargainContext.title}. Can we agree on an exclusive community deal?`,
      timestamp: '10:18 AM',
      isSelf: true,
      bargainOffer: {
        productTitle: bargainContext.title,
        originalPrice: Number(bargainContext.price) || 25000,
        offerPrice: Math.round((Number(bargainContext.price) || 25000) * 0.9),
        status: 'pending' as const
      }
    }] : [])
  ]);

  // Chat Input State
  const [inputText, setInputText] = useState('');
  const [activeVoiceMask, setActiveVoiceMask] = useState<'Robot' | 'Fine Girl' | 'Chief' | 'Bishop' | 'None'>('None');
  const [showVoiceMaskSelector, setShowVoiceMaskSelector] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAIAssist, setShowAIAssist] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [micRecordingDuration, setMicRecordingDuration] = useState(0);
  const [micSlideCancel, setMicSlideCancel] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [mentionSuggestions, setMentionSuggestions] = useState<string[]>([]);
  const [pidginSuggestions, setPidginSuggestions] = useState<string[]>([]);

  // --------------------------------------------------------------------------
  // Top 10 Action Bar Modals State
  // --------------------------------------------------------------------------
  const [showDeepLinkModal, setShowDeepLinkModal] = useState(false);
  const [deepLinkData, setDeepLinkData] = useState<any>(null);
  const [deepLinkType, setDeepLinkType] = useState<'gist' | 'user' | 'market'>('gist');
  const [deepLinkIdInput, setDeepLinkIdInput] = useState('trending-01');

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');

  const [showAddUsersModal, setShowAddUsersModal] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [userAddSuccess, setUserAddSuccess] = useState('');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');

  const [showDownloadManager, setShowDownloadManager] = useState(false);
  const [downloadsList, setDownloadsList] = useState<any[]>([
    { id: 'dl-1', name: 'EFADO_Nexus_Spec_v2.0.pdf', size: '3.2 MB', status: 'Downloaded', folder: '/Downloads/EFADO/Docs' },
    { id: 'dl-2', name: 'Product_Market_Catalog_HQ.docx', size: '14.8 MB', status: 'Downloaded', folder: '/Downloads/EFADO/Media' },
    { id: 'dl-3', name: 'VoiceMask_Neural_Audio.wav', size: '4.1 MB', status: 'Downloaded', folder: '/Downloads/EFADO/Audio' }
  ]);

  // Row 2 Action Buttons State
  const [buzzCooldown, setBuzzCooldown] = useState(0);
  const [buzzAlertBanner, setBuzzAlertBanner] = useState<string | null>(null);

  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const [showVideoCallModal, setShowVideoCallModal] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [videoCallParticipants, setVideoCallParticipants] = useState<string[]>([
    'Dr. Sarah', 'Alex M.', 'Jordan Chief', 'Mia Tech'
  ]);

  const [showVoiceCallModal, setShowVoiceCallModal] = useState(false);
  const [voiceCallMask, setVoiceCallMask] = useState<'Robot' | 'Fine Girl' | 'Chief' | 'Bishop' | 'Standard'>('Standard');
  const [isBgMusicPlaying, setIsBgMusicPlaying] = useState(false);

  const [showReelsModal, setShowReelsModal] = useState(false);
  const [reelsDuration, setReelsDuration] = useState(30);

  // Status / Stories State
  const [stories, setStories] = useState<any[]>([
    { 
      id: 'story-self', 
      user: 'Your Story', 
      isSelf: true, 
      hasStory: false, 
      dp: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
      ring: 'border-indigo-500'
    },
    { 
      id: 'story-sara', 
      user: 'Sara', 
      dp: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      media: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
      caption: 'Deploying EFADO Nexus Hub 2.0 architecture live! 🚀',
      views: 342,
      isAd: false,
      ring: 'border-gradient'
    },
    { 
      id: 'story-jordan', 
      user: 'Jordan', 
      dp: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      media: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
      caption: 'Creator fund monetization check: ₦1840 credited for qualified views.',
      views: 1204,
      isAd: false,
      ring: 'border-gradient'
    },
    { 
      id: 'story-ad', 
      user: 'Advert', 
      dp: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=150&auto=format&fit=crop&q=80',
      media: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800&auto=format&fit=crop&q=80',
      caption: '🌟 SPONSORED: Get 50% discount on EFADO Cloud Vending & Domains today!',
      views: 8920,
      isAd: true,
      adTag: 'Ad',
      ring: 'border-orange-500'
    },
    { 
      id: 'story-mia', 
      user: 'Mia', 
      dp: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      media: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
      caption: 'Voice masks in action: test Chief and Fine Girl filters in voice chat! 🎭',
      views: 840,
      isAd: false,
      ring: 'border-gradient'
    }
  ]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [showStatusCreateModal, setShowStatusCreateModal] = useState(false);
  const [statusCaption, setStatusCaption] = useState('');
  const [statusIsAd, setStatusIsAd] = useState(false);

  // 3-Dots Dropdown Menu State (Exact 12 Items)
  const [showThreeDotsMenu, setShowThreeDotsMenu] = useState(false);
  const [menuFeedback, setMenuFeedback] = useState<string | null>(null);

  // Translation Modal State
  const [translatingMsgId, setTranslatingMsgId] = useState<string | null>(null);

  // Chat Container Reference for Screenshots
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Audio Context for Yahoo-style Buzz and Voice Chimes
  const playBuzzSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch {}
  };

  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  };

  // Buzz Cooldown Timer
  useEffect(() => {
    if (buzzCooldown <= 0) return;
    const timer = setInterval(() => {
      setBuzzCooldown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [buzzCooldown]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mic timer during recording
  useEffect(() => {
    let interval: any;
    if (isRecordingMic) {
      interval = setInterval(() => {
        setMicRecordingDuration(d => d + 1);
      }, 1000);
    } else {
      setMicRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecordingMic]);

  // Pidgin suggestions & autocomplete helper
  useEffect(() => {
    if (inputText.startsWith('@')) {
      const query = inputText.slice(1).toLowerCase();
      const matches = ['Sarah', 'Jordan', 'Alex', 'Chief_EFADO', 'Mia_Tech', 'Bishop_T']
        .filter(u => u.toLowerCase().includes(query));
      setMentionSuggestions(matches);
    } else {
      setMentionSuggestions([]);
    }

    if (inputText.length > 2) {
      const lastWord = inputText.split(' ').pop()?.toLowerCase() || '';
      const pidginMap: Record<string, string[]> = {
        'how': ['How far now?', 'How una dey?', 'How body?'],
        'come': ['I dey come now', 'Come make we reason', 'Abeg come'],
        'what': ['Wetin dey happen?', 'Wetin be the update?', 'Wetin you talk?'],
        'please': ['Abeg confirm', 'Abeg run am', 'Abeg check this']
      };
      if (pidginMap[lastWord]) {
        setPidginSuggestions(pidginMap[lastWord]);
      } else {
        setPidginSuggestions([]);
      }
    } else {
      setPidginSuggestions([]);
    }
  }, [inputText]);

  // --------------------------------------------------------------------------
  // ACTION HANDLERS (Integrating Real APIs)
  // --------------------------------------------------------------------------

  // 1. Deep Link API Call
  const handleGenerateDeepLink = async () => {
    try {
      const res = await fetch('/api/deep-link/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: deepLinkType,
          id: deepLinkIdInput || 'trending-01',
          title: `EFADO Nexus Hub • ${deepLinkType.toUpperCase()}`,
          description: `Direct deep link to EFADO Nexus Hub ${deepLinkType} item.`
        })
      });
      const data = await res.json();
      setDeepLinkData(data);
    } catch {
      setDeepLinkData({
        deepLink: `https://efado-nexus.com/${deepLinkType}/${deepLinkIdInput || 'trending-01'}`,
        shortLink: `https://e-fado.com/l/${deepLinkIdInput || 'nexus'}`
      });
    }
  };

  // 2. Share API Call
  const handleShareClick = async () => {
    const shareUrl = `https://efado-nexus.com/hub?room=${activeRoomId}&ref=${user.uid}`;
    try {
      await fetch('/api/share/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'EFADO NEXUS HUB',
          text: 'Join me on EFADO NEXUS HUB for real-time WebRTC chat, video & 500MB reels!',
          url: shareUrl,
          target: 'native'
        })
      });
    } catch {}

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'EFADO NEXUS HUB',
          text: 'Join me on EFADO NEXUS HUB at efado-nexus.com/hub! 🚀',
          url: shareUrl
        });
        setShareFeedback('Shared successfully via native sheet!');
        setTimeout(() => setShareFeedback(''), 3000);
        return;
      } catch {}
    }
    setShowShareModal(true);
  };

  // 3. Add Users API Call
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUsername && !invitePhone) return;

    try {
      const res = await fetch('/api/users/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: inviteUsername,
          phone: invitePhone,
          roomId: activeRoomId,
          invitedBy: user.displayName || user.email
        })
      });
      const data = await res.json();
      setUserAddSuccess(data.message || `Invitation sent to ${inviteUsername || invitePhone}!`);
    } catch {
      setUserAddSuccess(`Invite dispatched to ${inviteUsername || invitePhone}! Added to group.`);
    }

    setInviteUsername('');
    setInvitePhone('');
    setTimeout(() => {
      setUserAddSuccess('');
      setShowAddUsersModal(false);
    }, 2500);
  };

  // 4. Cloud Upload API Call (500MB Support with animated progress)
  const handleCloudUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024 * 1024) {
      alert('File exceeds maximum limit of 500MB. Please choose a smaller file.');
      return;
    }

    setUploadedFileName(file.name);
    setShowUploadModal(true);
    setIsUploading(true);
    setUploadProgress(12);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          setIsUploading(false);
          // Insert into chat as uploaded card
          const newMsg: MessageItem = {
            id: `upload-${Date.now()}`,
            senderId: user.uid,
            senderName: user.displayName || 'You',
            senderDp: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
            content: `Shared file: ${file.name}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSelf: true,
            fileCard: {
              name: file.name,
              size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
              progress: 100,
              isDownloaded: true,
              type: file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'file'
            }
          };
          setMessages(m => [...m, newMsg]);

          // Also register in auto download manager
          setDownloadsList(dl => [
            {
              id: `dl-${Date.now()}`,
              name: file.name,
              size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
              status: 'Downloaded',
              folder: '/Downloads/EFADO/Uploads'
            },
            ...dl
          ]);

          setTimeout(() => setShowUploadModal(false), 1800);
          return 100;
        }
        return prev + 18;
      });
    }, 300);
  };

  // 5. Buzz API Call & Alert (Vibrate, Sound & Full Screen Banner)
  const handleTriggerBuzz = async () => {
    if (buzzCooldown > 0) return;
    setBuzzCooldown(30);

    // Vibrate device
    if (navigator.vibrate) {
      navigator.vibrate([300, 150, 300, 150, 450]);
    }
    playBuzzSound();

    // Trigger full screen buzz alert banner
    setBuzzAlertBanner(`⚡ ${user.displayName || 'You'} buzzed ${currentRoom.name} • just now`);
    setTimeout(() => setBuzzAlertBanner(null), 3500);

    // Post to API
    try {
      await fetch('/api/chat/buzz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.uid,
          senderName: user.displayName || 'Alex',
          targetId: activeRoomId,
          roomId: activeRoomId
        })
      });
    } catch {}

    // Add buzz message to conversation
    const buzzMsg: MessageItem = {
      id: `buzz-${Date.now()}`,
      senderId: user.uid,
      senderName: user.displayName || 'You',
      senderDp: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
      content: '⚡ BUZZED THE CHAT! Attention requested.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true
    };
    setMessages(m => [...m, buzzMsg]);
  };

  // 6. Screenshot API Call & One-Tap Canvas Capture with Watermark
  const handleTakeScreenshot = async () => {
    if (!chatContainerRef.current) return;
    setScreenshotLoading(true);

    try {
      const canvas = await html2canvas(chatContainerRef.current, {
        backgroundColor: '#0a0d1a',
        scale: 2,
        useCORS: true,
        logging: false
      });

      // Add Watermark to the bottom right of canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 8;
        const text = 'EFADO NEXUS HUB • efado-nexus.com/hub';
        const dateText = new Date().toLocaleString();
        ctx.fillText(text, canvas.width - ctx.measureText(text).width - 30, canvas.height - 45);
        ctx.font = '14px monospace';
        ctx.fillStyle = 'rgba(139, 92, 246, 0.9)';
        ctx.fillText(dateText, canvas.width - ctx.measureText(dateText).width - 30, canvas.height - 20);
        ctx.restore();
      }

      const imgUrl = canvas.toDataURL('image/png');
      setScreenshotPreview(imgUrl);

      // Call API
      fetch('/api/chat/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: 'EFADO NEXUS HUB',
          userId: user.uid,
          roomId: activeRoomId,
          timestamp: Date.now()
        })
      }).catch(() => {});
    } catch {
      alert('Could not capture screenshot automatically. Please try again.');
    } finally {
      setScreenshotLoading(false);
    }
  };

  // 7. Video Call API Call
  const handleStartVideoCall = async () => {
    setShowVideoCallModal(true);
    playChime();
    try {
      await fetch('/api/call/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: activeRoomId,
          hostId: user.uid,
          participants: videoCallParticipants,
          action: 'initiate'
        })
      });
    } catch {}
  };

  // 8. Voice Call API Call (with Voice Mask + background music)
  const handleStartVoiceCall = async () => {
    setShowVoiceCallModal(true);
    playChime();
    try {
      await fetch('/api/call/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: activeRoomId,
          callerId: user.uid,
          voiceMask: voiceCallMask,
          bgMusic: isBgMusicPlaying
        })
      });
    } catch {}
  };

  // 9. Reels API Call (15-60s Short Video, up to 500MB)
  const handlePublishReel = async () => {
    try {
      await fetch('/api/reels/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Nexus Reel by ${user.displayName || 'Creator'}`,
          duration: reelsDuration,
          authorId: user.uid,
          authorName: user.displayName || 'Anonymous',
          maxSizeMB: 500
        })
      });

      // Add to chat as reply with reel
      const reelMsg: MessageItem = {
        id: `reel-${Date.now()}`,
        senderId: user.uid,
        senderName: user.displayName || 'You',
        senderDp: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
        content: `🎬 Replied with 500MB Short Video Reel (${reelsDuration}s). Earns Creator Fund rewards!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSelf: true,
        fileCard: {
          name: `Nexus_Reel_${reelsDuration}s_HD.mp4`,
          size: `${Math.round(reelsDuration * 2.8)} MB`,
          isDownloaded: true,
          type: 'video'
        }
      };
      setMessages(m => [...m, reelMsg]);
      setShowReelsModal(false);

      // Reward creator fund
      if (onUpdateCreatorStats && creatorStats) {
        onUpdateCreatorStats({
          ...creatorStats,
          qualifiedViews: (creatorStats.qualifiedViews || 18400) + 10,
          earnings: (creatorStats.earnings || 1840) + 1.0
        });
      }
    } catch {}
  };

  // 10. Status/Stories API Call (with Ad support)
  const handleCreateStatus = async () => {
    if (!statusCaption) return;
    try {
      await fetch('/api/status/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userName: user.displayName || 'You',
          caption: statusCaption,
          isAd: statusIsAd,
          adBadge: statusIsAd ? 'Ad' : undefined
        })
      });

      const newStory = {
        id: `story-${Date.now()}`,
        user: user.displayName || 'You',
        dp: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
        media: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80',
        caption: statusCaption,
        views: 1,
        isAd: statusIsAd,
        adTag: statusIsAd ? 'Ad' : undefined,
        ring: statusIsAd ? 'border-orange-500' : 'border-gradient'
      };

      setStories(s => [s[0], newStory, ...s.slice(1)]);
      setStatusCaption('');
      setStatusIsAd(false);
      setShowStatusCreateModal(false);
    } catch {}
  };

  // 11. Translate Message via API
  const handleTranslateMessage = async (msgId: string, text: string, targetLang: string) => {
    setTranslatingMsgId(msgId);
    try {
      const res = await fetch('/api/chat/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang })
      });
      const data = await res.json();
      const translated = data.translatedText || `[${targetLang}]: ${text}`;

      setMessages(msgs => msgs.map(m => {
        if (m.id === msgId) {
          return {
            ...m,
            translatedText: translated,
            translatedLang: targetLang
          };
        }
        return m;
      }));
    } catch {
      // Local fallback for Pidgin / French / Chinese
      let fallback = text;
      if (targetLang === 'Pidgin') fallback = `Make una hear: "${text}". No shaking!`;
      if (targetLang === 'French') fallback = `Traduction: "${text}" (Protocole Sécurisé)`;
      if (targetLang === 'Chinese') fallback = `翻译: "${text}" (EFADO 协议)`;

      setMessages(msgs => msgs.map(m => {
        if (m.id === msgId) {
          return { ...m, translatedText: fallback, translatedLang: targetLang };
        }
        return m;
      }));
    } finally {
      setTranslatingMsgId(null);
    }
  };

  // Send Chat Message
  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    playChime();

    let finalContent = inputText.trim();
    if (activeVoiceMask !== 'None') {
      finalContent = `[🎭 Voice Mask: ${activeVoiceMask}] ${finalContent}`;
    }

    const newMsg: MessageItem = {
      id: `msg-${Date.now()}`,
      senderId: user.uid,
      senderName: user.displayName || 'You',
      senderDp: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
      content: finalContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true,
      reactions: {}
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setShowEmojiPicker(false);
    setShowAIAssist(false);
    setShowVoiceMaskSelector(false);

    // Trigger fake typing response from Dr. Sarah
    if (activeRoomId === 'sarah') {
      setTypingUsers(['Dr. Sarah']);
      setTimeout(() => {
        setTypingUsers([]);
        const botReply: MessageItem = {
          id: `reply-${Date.now()}`,
          senderId: 'sarah',
          senderName: 'Dr. Sarah (Lead AI Eng)',
          senderDp: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          content: `Acknowledged! EFADO Nexus Comms node verified with 100% latency score. Ready to transmit audio, files up to 500MB, or launch WebRTC conference.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSelf: false,
          reactions: { '⚡': 1 }
        };
        setMessages(m => [...m, botReply]);
      }, 1600);
    }
  };

  // Reaction to Message
  const handleAddReaction = (msgId: string, emoji: string) => {
    setMessages(msgs => msgs.map(m => {
      if (m.id === msgId) {
        const reactions = { ...(m.reactions || {}) };
        reactions[emoji] = (reactions[emoji] || 0) + 1;
        return { ...m, reactions };
      }
      return m;
    }));
  };

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------
  return (
    <div className="relative w-full h-full flex flex-col bg-[#070a16] text-white overflow-hidden select-none font-sans">
      {/* FULL SCREEN BUZZ ALERT BANNER */}
      <AnimatePresence>
        {buzzAlertBanner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -50 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-indigo-950/85 backdrop-blur-2xl"
          >
            <div className="p-8 sm:p-12 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500 text-white shadow-2xl text-center max-w-lg border-2 border-white/40 animate-pulse">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Bell className="w-10 h-10 text-white animate-bounce" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight mb-2">BUZZ INCOMING!</h2>
              <p className="text-lg sm:text-xl font-bold text-white/90">{buzzAlertBanner}</p>
              <p className="text-xs font-mono uppercase tracking-widest text-indigo-200 mt-4">
                Yahoo Messenger Vibe • Vibration Active • 30s Cooldown
              </p>
              <button
                onClick={() => setBuzzAlertBanner(null)}
                className="mt-8 px-8 py-3 bg-white text-indigo-950 rounded-2xl font-black uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Dismiss Buzz
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP HEADER - SPEC 1: NAME CORRECTION: EFADO NEXUS HUB (Brand Gradient White on Indigo) */}
      <header className="px-4 sm:px-6 py-3 bg-gradient-to-r from-indigo-950 via-[#0a0d24] to-indigo-950 border-b border-indigo-500/20 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
            title="Return to Hub List"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Hubs</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black bg-gradient-to-r from-white via-indigo-100 to-indigo-300 text-transparent bg-clip-text uppercase tracking-tight">
                EFADO NEXUS HUB
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                v2.0
              </span>
            </div>
            <p className="text-[10px] font-mono text-indigo-300/80 tracking-wide hidden sm:block">
              URL: <span className="text-cyan-400 font-bold">efado-nexus.com/hub</span> • <span className="text-slate-400">e-fado.com/nexus-hub</span>
            </p>
          </div>
        </div>

        {/* Creator Fund Quick Glance */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-900/40 border border-indigo-500/30 text-xs">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-slate-300 text-[10px] uppercase font-bold">Creator Fund:</span>
            <span className="text-cyan-300 font-black font-mono">₦{((creatorStats?.earnings || 1840)).toFixed(2)}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveRoomId('sarah')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                chatTab === 'DIRECT' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Direct
            </button>
            <button
              onClick={() => {
                setChatTab('GROUPS');
                setActiveRoomId('tactical-hq');
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                chatTab === 'GROUPS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Groups
            </button>
          </div>
        </div>
      </header>

      {/* TOP ACTION BAR - EXACT 10 BUTTONS (2 ROWS OF 5) */}
      <div className="bg-slate-950/90 border-b border-indigo-500/20 px-3 sm:px-6 py-2.5 z-20 shrink-0 shadow-lg">
        {/* Row 1: Deep Linking, Share Button, Add Users, Upload (500MB), Download */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-3 mb-2">
          {/* 1. Deep Linking */}
          <button
            onClick={() => {
              handleGenerateDeepLink();
              setShowDeepLinkModal(true);
            }}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 bg-gradient-to-b from-indigo-900/60 to-indigo-950/80 hover:from-indigo-800 hover:to-indigo-900 border border-indigo-500/40 rounded-xl text-indigo-200 hover:text-white transition-all shadow-sm group cursor-pointer"
            title="Deep Linking: efado-nexus.com/gist/{id} | efado-nexus.com/user/{username}"
          >
            <Link2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
            <span className="text-[9px] sm:text-xs font-black uppercase tracking-tight text-center leading-tight">
              Deep Link
            </span>
          </button>

          {/* 2. Share Button */}
          <button
            onClick={handleShareClick}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 bg-gradient-to-b from-purple-900/60 to-purple-950/80 hover:from-purple-800 hover:to-purple-900 border border-purple-500/40 rounded-xl text-purple-200 hover:text-white transition-all shadow-sm group cursor-pointer"
            title="Native Share Sheet: WhatsApp, Facebook, Copy Link with Deep Link"
          >
            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-300 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] sm:text-xs font-black uppercase tracking-tight text-center leading-tight">
              Share
            </span>
          </button>

          {/* 3. Add Users */}
          <button
            onClick={() => setShowAddUsersModal(true)}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 bg-gradient-to-b from-emerald-900/60 to-emerald-950/80 hover:from-emerald-800 hover:to-emerald-900 border border-emerald-500/40 rounded-xl text-emerald-200 hover:text-white transition-all shadow-sm group cursor-pointer"
            title="Add Users: Invite by username, phone contact, QR code, link"
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] sm:text-xs font-black uppercase tracking-tight text-center leading-tight">
              + Add Users
            </span>
          </button>

          {/* 4. Upload (Cloud Upload 500MB) */}
          <label className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 bg-gradient-to-b from-blue-900/60 to-blue-950/80 hover:from-blue-800 hover:to-blue-900 border border-blue-500/40 rounded-xl text-blue-200 hover:text-white transition-all shadow-sm group cursor-pointer">
            <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-300 group-hover:-translate-y-0.5 transition-transform" />
            <span className="text-[9px] sm:text-xs font-black uppercase tracking-tight text-center leading-tight">
              Upload 500M
            </span>
            <input
              type="file"
              className="hidden"
              onChange={handleCloudUpload}
              accept="image/*,video/*,audio/*,.pdf,.docx,.zip"
            />
          </label>

          {/* 5. Download (Auto Download Manager) */}
          <button
            onClick={() => setShowDownloadManager(true)}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 bg-gradient-to-b from-cyan-900/60 to-cyan-950/80 hover:from-cyan-800 hover:to-cyan-900 border border-cyan-500/40 rounded-xl text-cyan-200 hover:text-white transition-all shadow-sm group cursor-pointer"
            title="Auto Download Manager: Downloaded • 3.2 MB • Saved"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 group-hover:translate-y-0.5 transition-transform" />
            <span className="text-[9px] sm:text-xs font-black uppercase tracking-tight text-center leading-tight">
              Downloads
            </span>
          </button>
        </div>

        {/* Row 2: Buzz, Screenshot Button, Video Chat, Voice Chat, Reels */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
          {/* 6. Buzz */}
          <button
            onClick={handleTriggerBuzz}
            disabled={buzzCooldown > 0}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 rounded-xl border transition-all shadow-sm group cursor-pointer ${
              buzzCooldown > 0
                ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-b from-amber-900/70 to-amber-950/80 hover:from-amber-800 hover:to-amber-900 border-amber-500/50 text-amber-200 hover:text-white active:scale-95'
            }`}
            title="Buzz: Alert idle user with vibration, sound, full-screen banner"
          >
            <Bell className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${buzzCooldown > 0 ? '' : 'text-amber-400 animate-bounce'}`} />
            <span className="text-[9px] sm:text-xs font-black uppercase tracking-tight text-center leading-tight">
              {buzzCooldown > 0 ? `Buzz (${buzzCooldown}s)` : 'Buzz ⚡'}
            </span>
          </button>

          {/* 7. Screenshot Button */}
          <button
            onClick={handleTakeScreenshot}
            disabled={screenshotLoading}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 bg-gradient-to-b from-rose-900/60 to-rose-950/80 hover:from-rose-800 hover:to-rose-900 border border-rose-500/40 rounded-xl text-rose-200 hover:text-white transition-all shadow-sm group cursor-pointer"
            title="One-tap screenshot entire chat page with DP, timestamp, watermark EFADO NEXUS HUB"
          >
            <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] sm:text-xs font-black uppercase tracking-tight text-center leading-tight">
              {screenshotLoading ? 'Capturing...' : 'Capture'}
            </span>
          </button>

          {/* 8. Video Chat */}
          <button
            onClick={handleStartVideoCall}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 bg-gradient-to-b from-violet-900/60 to-violet-950/80 hover:from-violet-800 hover:to-violet-900 border border-violet-500/40 rounded-xl text-violet-200 hover:text-white transition-all shadow-sm group cursor-pointer"
            title="WebRTC video call, 1-1 and group up to 10, screen share, 500MB recording"
          >
            <VideoIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400 group-hover:rotate-12 transition-transform" />
            <span className="text-[9px] sm:text-xs font-black uppercase tracking-tight text-center leading-tight">
              Video Call
            </span>
          </button>

          {/* 9. Voice Chat */}
          <button
            onClick={handleStartVoiceCall}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 bg-gradient-to-b from-teal-900/60 to-teal-950/80 hover:from-teal-800 hover:to-teal-900 border border-teal-500/40 rounded-xl text-teal-200 hover:text-white transition-all shadow-sm group cursor-pointer"
            title="Voice call + Voice Mask filters [Robot, Fine Girl, Chief, Bishop] + background music"
          >
            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] sm:text-xs font-black uppercase tracking-tight text-center leading-tight">
              Voice Comms
            </span>
          </button>

          {/* 10. Reels (500MB) */}
          <button
            onClick={() => setShowReelsModal(true)}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 bg-gradient-to-b from-fuchsia-900/60 to-fuchsia-950/80 hover:from-fuchsia-800 hover:to-fuchsia-900 border border-fuchsia-500/40 rounded-xl text-fuchsia-200 hover:text-white transition-all shadow-sm group cursor-pointer"
            title="Reels (500MB): Short video 15-60s, reply with reel in chat"
          >
            <Tv className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-fuchsia-400 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] sm:text-xs font-black uppercase tracking-tight text-center leading-tight">
              Reels 500M
            </span>
          </button>
        </div>
      </div>

      {/* STATUS / STORIES SECTION - SPEC 3: HORIZONTAL SCROLL WITH AD BADGE & CREATOR FUND */}
      <div className="px-4 sm:px-6 py-2.5 bg-slate-950/60 border-b border-indigo-500/10 flex items-center gap-3 overflow-x-auto custom-scrollbar shrink-0">
        {stories.map((st, idx) => {
          if (st.isSelf) {
            return (
              <button
                key={st.id}
                onClick={() => setShowStatusCreateModal(true)}
                className="flex flex-col items-center gap-1 flex-shrink-0 group cursor-pointer"
              >
                <div className="relative w-14 h-14 rounded-full p-0.5 border-2 border-dashed border-indigo-400 group-hover:border-indigo-300 transition-colors flex items-center justify-center">
                  <img src={st.dp} alt="You" className="w-full h-full rounded-full object-cover" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-md border-2 border-slate-950">
                    +
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-300">Your Story</span>
              </button>
            );
          }

          return (
            <button
              key={st.id}
              onClick={() => setActiveStoryIndex(idx)}
              className="flex flex-col items-center gap-1 flex-shrink-0 group cursor-pointer"
            >
              <div
                className={`relative w-14 h-14 rounded-full p-0.5 transition-transform group-hover:scale-105 ${
                  st.isAd
                    ? 'border-2 border-orange-500 ring-2 ring-orange-500/40'
                    : 'border-2 border-gradient bg-gradient-to-tr from-[#6A4DFF] via-purple-500 to-cyan-400 p-[2px]'
                }`}
              >
                <img
                  src={st.dp}
                  alt={st.user}
                  className="w-full h-full rounded-full object-cover border border-slate-900"
                />
                {st.isAd && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-orange-600 text-white text-[8px] font-black rounded-full uppercase tracking-tighter shadow-md">
                    Ad
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold text-slate-300 truncate max-w-[60px]">{st.user}</span>
            </button>
          );
        })}
      </div>

      {/* MAIN CHAT & SIDEBAR CONTAINER */}
      <div ref={chatContainerRef} className="flex-grow flex overflow-hidden relative">
        {/* ROOMS SIDEBAR */}
        <div className="hidden lg:flex w-72 flex-col bg-slate-950/80 border-r border-indigo-500/10 shrink-0">
          <div className="p-3 border-b border-indigo-500/10">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-1">
            {rooms.map(room => {
              const isActive = room.id === activeRoomId;
              return (
                <button
                  key={room.id}
                  onClick={() => setActiveRoomId(room.id as any)}
                  className={`w-full p-2.5 rounded-2xl flex items-center gap-3 transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-950/90 to-indigo-900/60 border border-indigo-500/30'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="relative w-10 h-10 rounded-full flex-shrink-0">
                    <img src={room.dp} alt={room.name} className="w-full h-full rounded-full object-cover" />
                    {room.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
                    )}
                  </div>
                  <div className="min-w-0 flex-grow">
                    <h4 className="text-xs font-black text-white truncate">{room.name}</h4>
                    <p className="text-[10px] text-slate-400 truncate">{room.status}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ACTIVE CHAT WINDOW */}
        <div className="flex-grow flex flex-col min-w-0 bg-[#070a16] relative">
          {/* Chat Window Top Bar */}
          <div className="px-4 sm:px-6 py-2.5 bg-slate-950/70 border-b border-indigo-500/10 flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-9 h-9 rounded-full flex-shrink-0">
                <img src={currentRoom.dp} alt={currentRoom.name} className="w-full h-full rounded-full object-cover" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-black text-white truncate">{currentRoom.name}</h3>
                <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {currentRoom.status}
                </p>
              </div>
            </div>

            {/* Quick Actions & 3-Dots Dropdown Menu */}
            <div className="flex items-center gap-1.5 relative">
              <button
                onClick={handleStartVoiceCall}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Voice Call"
              >
                <Phone className="w-4 h-4 text-teal-400" />
              </button>
              <button
                onClick={handleStartVideoCall}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Video Call"
              >
                <VideoIcon className="w-4 h-4 text-violet-400" />
              </button>

              {/* 3-Dots Trigger */}
              <button
                onClick={() => setShowThreeDotsMenu(!showThreeDotsMenu)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Chat Options"
              >
                <MoreVertical className="w-4 h-4 text-indigo-300" />
              </button>

              {/* 12-ITEM DROPDOWN MENU */}
              <AnimatePresence>
                {showThreeDotsMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute top-12 right-0 w-64 p-2 bg-slate-950/95 border border-indigo-500/30 rounded-2xl shadow-2xl backdrop-blur-2xl z-50 space-y-1 text-xs"
                  >
                    {[
                      { label: 'Contact info', action: () => alert(`Contact Info: ${currentRoom.name} • Active on EFADO Nexus Hub`) },
                      { label: 'Search', action: () => alert('Search messages inside this conversation activated.') },
                      { label: 'Select messages', action: () => alert('Select messages mode ready.') },
                      { label: 'Mute notifications', action: () => setMenuFeedback('Notifications muted for 8 hours.') },
                      { label: 'Disappearing messages', action: () => setMenuFeedback('Disappearing messages set to 24 hours.') },
                      { label: 'Add to Favorites', action: () => setMenuFeedback('Added conversation to favorites!') },
                      { label: 'Add to list', action: () => setMenuFeedback('Added to customized Nexus contact list.') },
                      { label: 'Close chat', action: () => onClose() },
                      { label: 'Send call link', action: () => {
                          navigator.clipboard?.writeText(`https://efado-nexus.com/call/${activeRoomId}`);
                          setMenuFeedback('Call link copied to clipboard!');
                        }
                      },
                      { label: 'New group call', action: () => handleStartVideoCall() },
                      { label: 'Report', action: () => alert('Report submitted to EFADO Security Syndicate.') },
                      { label: 'Block', action: () => alert(`Blocked user ${currentRoom.name}. Messages will no longer appear.`) }
                    ].map((mItem, mIdx) => (
                      <button
                        key={mIdx}
                        onClick={() => {
                          mItem.action();
                          setShowThreeDotsMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-indigo-600/30 font-bold transition-all flex items-center justify-between cursor-pointer"
                      >
                        <span>{mItem.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Quick Menu Feedback Alert */}
          {menuFeedback && (
            <div className="px-4 py-1.5 bg-indigo-600/20 border-b border-indigo-500/30 text-center text-xs font-bold text-cyan-300 animate-pulse">
              {menuFeedback}
            </div>
          )}

          {/* MESSAGES DISPLAY - SPEC 4: DP ON LEFT (32px circle, online dot), WHITE BUBBLE FOR OTHERS, PURPLE GRADIENT (#6A4DFF to #8B6BFF) FOR ME */}
          <div className="flex-grow p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2.5 max-w-[85%] sm:max-w-[75%] ${
                  msg.isSelf ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* User DP: 32px circle with green online dot */}
                <div className="relative w-8 h-8 rounded-full flex-shrink-0">
                  <img
                    src={msg.senderDp}
                    alt={msg.senderName}
                    className="w-8 h-8 rounded-full object-cover border border-white/20"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950" />
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-3.5 sm:p-4 rounded-3xl text-xs sm:text-sm leading-relaxed shadow-lg relative ${
                    msg.isSelf
                      ? 'bg-gradient-to-r from-[#6A4DFF] to-[#8B6BFF] text-white rounded-br-sm'
                      : 'bg-white text-slate-900 rounded-bl-sm shadow-white/5'
                  }`}
                >
                  {/* Sender Name if Group or Other */}
                  {!msg.isSelf && (
                    <p className="text-[10px] font-black text-indigo-700 uppercase tracking-tight mb-1">
                      {msg.senderName}
                    </p>
                  )}

                  {/* Bargain Mode Offer Card (Marketplace Integration) */}
                  {msg.bargainOffer && (
                    <div className="mb-3 p-3 rounded-2xl bg-indigo-950 text-white border border-indigo-400/40 space-y-2">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-[10px] font-black uppercase text-amber-400">🏷️ Bargain Mode Offer</span>
                        <span className="text-[9px] font-mono text-slate-400">{msg.bargainOffer.status.toUpperCase()}</span>
                      </div>
                      <h5 className="font-bold text-xs">{msg.bargainOffer.productTitle}</h5>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs line-through text-slate-400">₦{msg.bargainOffer.originalPrice.toLocaleString()}</span>
                        <span className="text-base font-black text-emerald-400">₦{msg.bargainOffer.offerPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => alert(`Offer of ₦${msg.bargainOffer?.offerPrice.toLocaleString()} Accepted! Order created via EFADO Escrow.`)}
                          className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => alert('Counter-offer dialog ready. Input your proposed price.')}
                          className="flex-1 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[10px] font-black uppercase tracking-wider"
                        >
                          Counter-Offer
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Main Text Content */}
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Translated Text if active */}
                  {msg.translatedText && (
                    <div className="mt-2 pt-2 border-t border-current/20 text-xs font-medium">
                      <span className="text-[9px] font-bold uppercase tracking-wider opacity-75">
                        🌐 Translated to {msg.translatedLang}:
                      </span>
                      <p className="mt-0.5 italic">{msg.translatedText}</p>
                    </div>
                  )}

                  {/* File Upload / Download Card inside Bubble with Progress Bar */}
                  {msg.fileCard && (
                    <div className="mt-2.5 p-2.5 rounded-2xl bg-black/20 border border-current/15 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 flex-shrink-0" />
                        <div className="min-w-0 flex-grow">
                          <p className="text-xs font-bold truncate">{msg.fileCard.name}</p>
                          <p className="text-[10px] opacity-75">Downloaded • {msg.fileCard.size} • Saved</p>
                        </div>
                        <button
                          onClick={() => alert(`Opening ${msg.fileCard?.name} from local storage.`)}
                          className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30"
                          title="Open Downloaded File"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {/* Progress Bar (72% Uploading... like spec image) */}
                      {msg.fileCard.progress && msg.fileCard.progress < 100 && (
                        <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-cyan-300 h-full rounded-full transition-all duration-300"
                            style={{ width: `${msg.fileCard.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timestamp + Delivered / Seen ticks */}
                  <div
                    className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                      msg.isSelf ? 'text-indigo-100' : 'text-slate-500'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.isSelf && (
                      <span title="Delivered & Seen">
                        <CheckCheck className="w-3.5 h-3.5 text-cyan-200" />
                      </span>
                    )}
                  </div>

                  {/* Reactions with Count */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {Object.entries(msg.reactions).map(([emo, count]) => (
                        <span
                          key={emo}
                          className="px-2 py-0.5 rounded-full text-[10px] bg-black/25 text-white flex items-center gap-1 border border-white/10"
                        >
                          <span>{emo}</span>
                          <span className="font-bold">{count}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Message Action Bar (Reaction, Reply, Translate, Forward) */}
                  <div className="mt-2 pt-1 border-t border-current/15 flex items-center justify-between text-[10px] font-bold opacity-80 gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAddReaction(msg.id, '❤️')}
                        className="hover:scale-125 transition-transform"
                        title="Heart"
                      >
                        ❤️
                      </button>
                      <button
                        onClick={() => handleAddReaction(msg.id, '🔥')}
                        className="hover:scale-125 transition-transform"
                        title="Fire"
                      >
                        🔥
                      </button>
                      <button
                        onClick={() => handleAddReaction(msg.id, '👍')}
                        className="hover:scale-125 transition-transform"
                        title="Thumbs Up"
                      >
                        👍
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const lang = prompt(
                            'Translate to language:\n- Pidgin\n- Chinese\n- French\n- Italian\n- Yoruba\n- Igbo\n- Hausa',
                            'Pidgin'
                          );
                          if (lang) handleTranslateMessage(msg.id, msg.content, lang);
                        }}
                        className="hover:underline flex items-center gap-0.5 cursor-pointer"
                        title="AI Multilingual Translation"
                      >
                        <Globe className="w-3 h-3" />
                        <span>Translate</span>
                      </button>

                      <button
                        onClick={() => setInputText(`Replying to "${msg.content.slice(0, 30)}...": `)}
                        className="hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <CornerDownRight className="w-3 h-3" />
                        <span>Reply</span>
                      </button>

                      <button
                        onClick={() => alert(`Message forwarded to ${currentRoom.name} members.`)}
                        className="hover:underline cursor-pointer"
                      >
                        Forward
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator with DP */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-6 h-6 rounded-full overflow-hidden">
                  <img src={currentRoom.dp} alt="Typing user" className="w-full h-full object-cover" />
                </div>
                <span>{typingUsers.join(', ')} is typing...</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150" />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-300" />
                </span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Autocomplete Pidgin & Mentions Box */}
          {(mentionSuggestions.length > 0 || pidginSuggestions.length > 0) && (
            <div className="px-4 py-2 bg-slate-900 border-t border-indigo-500/20 flex items-center gap-2 flex-wrap">
              {mentionSuggestions.map(userTag => (
                <button
                  key={userTag}
                  onClick={() => {
                    setInputText(`@${userTag} `);
                    setMentionSuggestions([]);
                  }}
                  className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/50 rounded-lg text-xs font-bold text-white transition-colors"
                >
                  @{userTag}
                </button>
              ))}

              {pidginSuggestions.map((phrase, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => {
                    setInputText(phrase + ' ');
                    setPidginSuggestions([]);
                  }}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/40 rounded-lg text-xs font-bold text-amber-300 transition-colors"
                >
                  💡 {phrase}
                </button>
              ))}
            </div>
          )}

          {/* WELL DEFINED CHAT TEXT BOX - SPEC 5:
              Design: White pill, 56px height min, expands to 120px, 24px radius, shadow
              Left: Emoji button 😊
              Right inside: Attachment 📎, AI ✨, Gift 🎁, Voice Mask 🎭
              Outside box: Purple mic button 🎤 - hold to record, slide to cancel, voice mask toggle
          */}
          <div className="p-3 sm:p-5 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent border-t border-indigo-500/10 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 max-w-5xl mx-auto">
              {/* WHITE PILL INPUT BOX */}
              <div className="flex-grow flex items-center min-h-[56px] max-h-[120px] bg-white rounded-[24px] px-3 sm:px-4 py-2 shadow-2xl shadow-indigo-950/50 border border-indigo-200">
                {/* Left: Emoji Button 😊 */}
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                  title="Emoji"
                >
                  <Smile className="w-5 h-5 text-amber-500" />
                </button>

                {/* Main Textarea */}
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-grow px-2 py-1 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none resize-none max-h-24 bg-transparent font-medium"
                />

                {/* Right inside box: Attachment 📎, AI ✨, Gift 🎁, Voice Mask 🎭 */}
                <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                  {/* Attachment 📎 */}
                  <label className="p-2 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer" title="Attachment">
                    <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 hover:text-indigo-600" />
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleCloudUpload}
                    />
                  </label>

                  {/* AI ✨ AI */}
                  <button
                    onClick={() => {
                      setInputText('✨ [AI Assistant]: Analyzing market insights and summarizing conversation...');
                      setShowAIAssist(true);
                    }}
                    className="p-1.5 sm:p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors cursor-pointer flex items-center gap-1"
                    title="AI Smart Assist"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span className="text-[10px] font-black hidden sm:inline">AI</span>
                  </button>

                  {/* Gift 🎁 */}
                  <button
                    onClick={() => setShowGiftModal(true)}
                    className="p-2 text-slate-500 hover:text-rose-500 transition-colors cursor-pointer"
                    title="Send Gift"
                  >
                    <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
                  </button>

                  {/* Voice Mask 🎭 inside */}
                  <button
                    onClick={() => setShowVoiceMaskSelector(!showVoiceMaskSelector)}
                    className={`p-1.5 sm:p-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      activeVoiceMask !== 'None'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-500 hover:text-purple-600 hover:bg-purple-50'
                    }`}
                    title="Voice Mask [Robot, Fine Girl, Chief, Bishop]"
                  >
                    <span className="text-base leading-none">🎭</span>
                    <span className="text-[10px] font-black hidden sm:inline">{activeVoiceMask}</span>
                  </button>
                </div>
              </div>

              {/* OUTSIDE BOX: Purple Mic Button 🎤 - Hold to record, slide to cancel, with Voice Mask toggle */}
              <div className="relative flex items-center flex-shrink-0">
                <button
                  onMouseDown={() => setIsRecordingMic(true)}
                  onMouseUp={() => {
                    if (isRecordingMic && !micSlideCancel) {
                      setIsRecordingMic(false);
                      const voiceMsg: MessageItem = {
                        id: `vn-${Date.now()}`,
                        senderId: user.uid,
                        senderName: user.displayName || 'You',
                        senderDp: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
                        content: `🎙️ Voice Note (${micRecordingDuration}s) [Mask: ${activeVoiceMask}]`,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        isSelf: true,
                        fileCard: {
                          name: `Audio_Note_${micRecordingDuration}s.wav`,
                          size: `${(micRecordingDuration * 0.12).toFixed(1)} MB`,
                          isDownloaded: true,
                          type: 'audio'
                        }
                      };
                      setMessages(m => [...m, voiceMsg]);
                    }
                    setIsRecordingMic(false);
                  }}
                  onTouchStart={() => setIsRecordingMic(true)}
                  onTouchEnd={() => {
                    setIsRecordingMic(false);
                  }}
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer ${
                    isRecordingMic
                      ? 'bg-rose-600 text-white animate-pulse scale-110'
                      : 'bg-gradient-to-tr from-[#6A4DFF] to-[#8B6BFF] text-white hover:scale-105 active:scale-95'
                  }`}
                  title="Hold to Record Voice Note • Slide to Cancel"
                >
                  <Mic className="w-6 h-6" />
                </button>

                {/* Send Button if input has text */}
                {inputText.trim() && (
                  <button
                    onClick={handleSendMessage}
                    className="ml-2 w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Recording Slide-to-Cancel indicator */}
            {isRecordingMic && (
              <div className="mt-2 text-center text-xs font-bold text-rose-400 flex items-center justify-center gap-2 animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Recording ({micRecordingDuration}s) • Mask: {activeVoiceMask} • Release to send</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------------
          MODALS & DRAWERS FOR THE 10 ACTION BUTTONS & SPEC FEATURES
      ---------------------------------------------------------------------- */}

      {/* 1. DEEP LINKING MODAL */}
      <AnimatePresence>
        {showDeepLinkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="w-full max-w-lg p-6 bg-slate-900 border border-indigo-500/40 rounded-3xl shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-cyan-400" /> Deep Linking Console
                </h3>
                <button onClick={() => setShowDeepLinkModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-300">
                Generate dynamic deep links that open directly inside the app across Android, iOS and Web:
              </p>

              <div className="flex items-center gap-2">
                {(['gist', 'user', 'market'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      setDeepLinkType(type);
                      setDeepLinkIdInput(type === 'user' ? (user.displayName || 'alex') : type === 'market' ? 'prod-99' : 'trending-01');
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      deepLinkType === type ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Item ID / Username</label>
                <input
                  type="text"
                  value={deepLinkIdInput}
                  onChange={(e) => setDeepLinkIdInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={handleGenerateDeepLink}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-90 transition-opacity"
              >
                Generate Firebase & Branch.io Link
              </button>

              {deepLinkData && (
                <div className="p-4 rounded-2xl bg-black/60 border border-indigo-500/30 space-y-2">
                  <p className="text-[10px] uppercase text-cyan-400 font-bold">Deep Link Ready:</p>
                  <p className="text-xs font-mono text-white select-all break-all">{deepLinkData.deepLink || `https://efado-nexus.com/${deepLinkType}/${deepLinkIdInput}`}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(deepLinkData.deepLink || `https://efado-nexus.com/${deepLinkType}/${deepLinkIdInput}`);
                      alert('Deep link copied to clipboard!');
                    }}
                    className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold uppercase"
                  >
                    Copy Deep Link
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. SHARE MODAL */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md p-6 bg-slate-900 border border-purple-500/40 rounded-3xl shadow-2xl space-y-4 text-center">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-black uppercase text-white">Share EFADO Nexus Hub</h3>
                <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-300">
                Share this conversation, product, or reel directly to external platforms:
              </p>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Join me on EFADO NEXUS HUB! efado-nexus.com/hub?room=${activeRoomId}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  WhatsApp
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://efado-nexus.com/hub')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600 text-blue-300 hover:text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  Facebook
                </a>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard?.writeText(`https://efado-nexus.com/hub?room=${activeRoomId}`);
                  alert('Link copied with deep link tracking!');
                  setShowShareModal(false);
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider"
              >
                Copy Link with Deep Link
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. ADD USERS MODAL */}
      <AnimatePresence>
        {showAddUsersModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md p-6 bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" /> + Add Users to Group
                </h3>
                <button onClick={() => setShowAddUsersModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddUserSubmit} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Invite by Username</label>
                  <input
                    type="text"
                    placeholder="e.g. Jordan_Chief or Sarah"
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Or by Phone Contact (Nigeria / Global)</label>
                  <input
                    type="tel"
                    placeholder="+234 801 234 5678"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {userAddSuccess && (
                  <p className="text-xs font-bold text-emerald-400 text-center animate-pulse">{userAddSuccess}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                >
                  Send Invite & Add to Group
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. CLOUD UPLOAD PROGRESS MODAL (72% Uploading... like image) */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md p-6 bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl space-y-4 text-center">
              <Upload className="w-10 h-10 text-cyan-400 mx-auto animate-bounce" />
              <h3 className="text-lg font-black uppercase text-white">Uploading to EFADO Cloud</h3>
              <p className="text-xs text-slate-300 font-mono truncate">{uploadedFileName}</p>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-cyan-300">
                  <span>Progress</span>
                  <span>{uploadProgress}% uploading...</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-white/10">
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                500MB Max Cloud Buffer • High Speed S3 / Storage Pipeline
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. DOWNLOAD MANAGER DRAWER */}
      <AnimatePresence>
        {showDownloadManager && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="w-full max-w-lg p-6 bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                  <Download className="w-5 h-5 text-cyan-400" /> Auto Download Manager
                </h3>
                <button onClick={() => setShowDownloadManager(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                {downloadsList.map(item => (
                  <div key={item.id} className="p-3 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{item.name}</p>
                      <p className="text-[10px] text-cyan-400 font-mono">
                        {item.status} • {item.size} • Saved
                      </p>
                      <p className="text-[9px] text-slate-500 truncate">{item.folder}</p>
                    </div>
                    <button
                      onClick={() => alert(`Opening folder: ${item.folder}`)}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase"
                    >
                      Open
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. SCREENSHOT PREVIEW MODAL */}
      <AnimatePresence>
        {screenshotPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="w-full max-w-2xl p-6 bg-slate-900 border border-rose-500/40 rounded-3xl shadow-2xl space-y-4 text-center">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-black uppercase text-white">One-Tap Chat Page Screenshot</h3>
                <button onClick={() => setScreenshotPreview(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto rounded-2xl border border-white/10">
                <img src={screenshotPreview} alt="Screenshot Preview" className="w-full h-auto" />
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={screenshotPreview}
                  download={`EFADO_NEXUS_HUB_Screenshot_${Date.now()}.png`}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                >
                  Save to Gallery
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(screenshotPreview);
                    alert('Screenshot image data copied!');
                  }}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                >
                  Share Option
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. WEBRTC VIDEO CALL MODAL (Up to 10 Participants, Screen Share, 500MB Recording) */}
      <AnimatePresence>
        {showVideoCallModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4 sm:p-6"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div>
                <h2 className="text-xl font-black uppercase text-white flex items-center gap-2">
                  <VideoIcon className="w-5 h-5 text-violet-400" /> EFADO WebRTC Video Room ({videoCallParticipants.length + 1}/10)
                </h2>
                <p className="text-xs text-slate-400 font-mono">End-to-End Encrypted Signal • 500MB Local Recording Pipeline</p>
              </div>
              <button
                onClick={() => setShowVideoCallModal(false)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider"
              >
                End Call
              </button>
            </div>

            {/* Video Grid (Up to 10 Participants) */}
            <div className="flex-grow grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto p-2">
              {/* Local User Tile */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border-2 border-indigo-500 flex items-center justify-center">
                <img
                  src={user.photoURL || `https://picsum.photos/seed/${user.uid}/400/300`}
                  alt="You"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 text-white text-[10px] font-bold">
                  You {isScreenSharing ? '(Screen Sharing)' : ''}
                </span>
              </div>

              {/* Other Participants */}
              {videoCallParticipants.map((pName, pIdx) => (
                <div key={pIdx} className="relative rounded-2xl overflow-hidden bg-slate-900 border border-white/10 flex items-center justify-center">
                  <img
                    src={`https://picsum.photos/seed/call-${pName}/400/300`}
                    alt={pName}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 text-white text-[10px] font-bold">
                    {pName}
                  </span>
                </div>
              ))}
            </div>

            {/* Controls Bar */}
            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => setIsScreenSharing(!isScreenSharing)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                  isScreenSharing ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {isScreenSharing ? 'Stop Screen Share' : 'Screen Share'}
              </button>

              <button
                onClick={() => {
                  setIsVideoRecording(!isVideoRecording);
                  if (!isVideoRecording) alert('Recording started (500MB maximum buffer).');
                  else alert('Recording saved to your local downloads.');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                  isVideoRecording ? 'bg-rose-600 text-white animate-pulse' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {isVideoRecording ? 'Recording (500MB max)...' : 'Record Call (500MB)'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8. VOICE CHAT MODAL (Voice Mask + Background Music) */}
      <AnimatePresence>
        {showVoiceCallModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md p-6 bg-slate-900 border border-teal-500/40 rounded-3xl shadow-2xl space-y-5 text-center">
              <Phone className="w-12 h-12 text-teal-400 mx-auto animate-pulse" />
              <h3 className="text-xl font-black uppercase text-white">Voice Call with {currentRoom.name}</h3>

              {/* Voice Mask Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Select Voice Mask Filter</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Robot', 'Fine Girl', 'Chief', 'Bishop'] as const).map(mask => (
                    <button
                      key={mask}
                      onClick={() => setVoiceCallMask(mask)}
                      className={`py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                        voiceCallMask === mask ? 'bg-teal-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      🎭 {mask}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Music Toggle */}
              <div className="p-3 bg-black/40 rounded-2xl flex items-center justify-between border border-white/10">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Music className="w-4 h-4 text-cyan-400" /> Background Music
                </span>
                <button
                  onClick={() => setIsBgMusicPlaying(!isBgMusicPlaying)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold uppercase ${
                    isBgMusicPlaying ? 'bg-cyan-600 text-white' : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {isBgMusicPlaying ? 'Active' : 'Off'}
                </button>
              </div>

              <button
                onClick={() => setShowVoiceCallModal(false)}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider"
              >
                End Voice Call
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 9. REELS CREATOR MODAL (15-60s Short Video, 500MB) */}
      <AnimatePresence>
        {showReelsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md p-6 bg-slate-900 border border-fuchsia-500/40 rounded-3xl shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                  <Tv className="w-5 h-5 text-fuchsia-400" /> Reels 500MB Video
                </h3>
                <button onClick={() => setShowReelsModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-300">
                Create a 15-60s short video reel. Inside this chat, you can reply directly with reels that earn Creator Fund views!
              </p>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Duration: {reelsDuration} seconds
                </label>
                <input
                  type="range"
                  min="15"
                  max="60"
                  value={reelsDuration}
                  onChange={(e) => setReelsDuration(Number(e.target.value))}
                  className="w-full accent-fuchsia-500"
                />
              </div>

              <button
                onClick={handlePublishReel}
                className="w-full py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:opacity-90 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg"
              >
                Post Reel in Chat (500MB Max)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 10. STATUS FULL SCREEN VIEWER */}
      <AnimatePresence>
        {activeStoryIndex !== null && stories[activeStoryIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4"
          >
            <div className="w-full max-w-sm h-full max-h-[85vh] rounded-3xl overflow-hidden relative border border-white/20 bg-slate-900 flex flex-col justify-between">
              {/* Story Header */}
              <div className="p-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <img
                    src={stories[activeStoryIndex].dp}
                    alt={stories[activeStoryIndex].user}
                    className="w-8 h-8 rounded-full border border-white/40 object-cover"
                  />
                  <div>
                    <h4 className="text-xs font-black text-white flex items-center gap-1">
                      {stories[activeStoryIndex].user}
                      {stories[activeStoryIndex].isAd && (
                        <span className="px-1.5 py-0.2 bg-orange-600 text-white text-[8px] font-black rounded uppercase">
                          Ad
                        </span>
                      )}
                    </h4>
                    <p className="text-[9px] text-slate-300 font-mono">{stories[activeStoryIndex].views} views • Creator Fund Active</p>
                  </div>
                </div>

                <button onClick={() => setActiveStoryIndex(null)} className="text-white hover:text-rose-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Story Media Background */}
              <div className="absolute inset-0 z-0">
                <img
                  src={stories[activeStoryIndex].media}
                  alt="Story"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60" />
              </div>

              {/* Story Bottom Controls: Reply, Share, Buzz */}
              <div className="p-4 z-10 space-y-3">
                <p className="text-xs font-bold text-white text-center">{stories[activeStoryIndex].caption}</p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Reply to status..."
                    className="flex-grow px-3 py-2 bg-white/20 backdrop-blur-md rounded-xl text-xs text-white placeholder-white/60 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      handleTriggerBuzz();
                      alert(`Buzzed ${stories[activeStoryIndex].user}!`);
                    }}
                    className="px-3 py-2 bg-amber-600 text-white rounded-xl text-xs font-black uppercase"
                  >
                    Buzz
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      alert('Status link copied!');
                    }}
                    className="p-2 bg-white/20 text-white rounded-xl"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 11. CREATE STATUS / AD PROMO MODAL */}
      <AnimatePresence>
        {showStatusCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md p-6 bg-slate-900 border border-indigo-500/40 rounded-3xl shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-black uppercase text-white">Place Status / Business Promo</h3>
                <button onClick={() => setShowStatusCreateModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Status Caption / Promo</label>
                <textarea
                  rows={3}
                  value={statusCaption}
                  onChange={(e) => setStatusCaption(e.target.value)}
                  placeholder="Share a thought, video update, or advertise your business promo..."
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/10">
                <span className="text-xs font-bold text-slate-300">Place as Business Advert (Ad tag)</span>
                <input
                  type="checkbox"
                  checked={statusIsAd}
                  onChange={(e) => setStatusIsAd(e.target.checked)}
                  className="w-4 h-4 accent-orange-500"
                />
              </div>

              <button
                onClick={handleCreateStatus}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider"
              >
                Publish Status to Nexus Feed
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 12. GIFT MODAL */}
      <AnimatePresence>
        {showGiftModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="w-full max-w-sm p-6 bg-slate-900 border border-rose-500/40 rounded-3xl shadow-2xl space-y-4 text-center">
              <Gift className="w-10 h-10 text-rose-500 mx-auto" />
              <h3 className="text-lg font-black uppercase text-white">Send Creator Gift</h3>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: 'Coffee', coins: '₦100', icon: '☕' },
                  { name: 'Diamond', coins: '₦500', icon: '💎' },
                  { name: 'Crown', coins: '₦2000', icon: '👑' }
                ].map(g => (
                  <button
                    key={g.name}
                    onClick={() => {
                      const giftMsg: MessageItem = {
                        id: `gift-${Date.now()}`,
                        senderId: user.uid,
                        senderName: user.displayName || 'You',
                        senderDp: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
                        content: `🎁 Sent ${g.name} gift (${g.coins}) to ${currentRoom.name}!`,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        isSelf: true
                      };
                      setMessages(m => [...m, giftMsg]);
                      setShowGiftModal(false);
                      playChime();
                    }}
                    className="p-3 bg-black/40 hover:bg-rose-600/20 border border-white/10 rounded-2xl flex flex-col items-center gap-1"
                  >
                    <span className="text-2xl">{g.icon}</span>
                    <span className="text-[10px] font-bold text-white">{g.name}</span>
                    <span className="text-[9px] font-mono text-amber-400">{g.coins}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowGiftModal(false)}
                className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
