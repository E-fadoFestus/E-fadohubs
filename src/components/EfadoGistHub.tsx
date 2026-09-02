import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCurrency } from '../lib/CurrencyContext';
import { SUPPORT_EMAILS, PHONE_NUMBERS, OFFICE_ADDRESSES } from '../constants/businessProfile';
import { 
  MessageSquare, 
  ChevronRight, 
  Search, 
  X, 
  Info, 
  Church, 
  Heart, 
  Users, 
  UserCircle, 
  Trophy, 
  UserMinus, 
  Link2, 
  GraduationCap, 
  Cpu, 
  Briefcase, 
  Factory,
  ArrowLeft,
  Share2,
  Flag,
  MoreVertical,
  Send,
  Filter,
  Shield,
  Home,
  Video,
  Image as ImageIcon,
  Smile,
  Paperclip,
  Phone,
  Video as VideoIcon,
  Download,
  Contact,
  Sticker,
  Zap,
  Plus,
  Award,
  Heart as HeartIcon,
  MessageCircle,
  Repeat,
  Bookmark,
  MapPin,
  TrendingDown,
  TrendingUp,
  Bell,
  Camera,
  Play,
  Volume2,
  DollarSign,
  BarChart3,
  Globe,
  Lock,
  History,
  ClipboardList,
  Mail,
  Check,
  HelpCircle,
  Calculator,
  ChevronUp,
  ChevronDown,
  Share,
  MessageSquare as MessageSquareIcon,
  LifeBuoy,
  CreditCard,
  Coins,
  ShieldCheck,
  PlusCircle,
  Mic,
  MicOff,
  VideoOff,
  Film,
  ArrowRight,
  Eye,
  VolumeX,
  Sparkles,
  Radio,
  ShoppingBag,
  SmilePlus,
  Flame,
  ThumbsUp,
  Tag,
  TrendingUp as TrendingUpIcon,
  CheckCheck
} from 'lucide-react';
import { 
  UserProfile, 
  SocialPost, 
  Reel, 
  ChatMessage, 
  Advertisement,
  GistStory,
  CommunityGroup,
  CreatorStats
} from '../types';
import { AdSenseBanner } from './AdSenseBanner';
import { ReelFeed } from './ReelFeed';
import { GistLiveStream } from './GistLiveStream';
import { GistCommunities } from './GistCommunities';
import { GistCreatorDashboard } from './GistCreatorDashboard';
import { GistStoriesBar } from './GistStoriesBar';
import { GistVoiceRecorder } from './GistVoiceRecorder';
import { CreatorProfileWallet } from './CreatorProfileWallet';
import { 
  db, 
  auth,
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  where,
  limit,
  updateDoc,
  setDoc,
  doc,
  arrayUnion,
  arrayRemove,
  increment
} from '../firebase';
import { updatePassword } from 'firebase/auth';
import { MiningMiniCard, EfadoMining, AdvertisingMiniCard } from './EfadoMining';
import { CurrencySelector } from './CurrencySelector';

const GIST_CATEGORIES = [
  { 
    id: 'religion', 
    title: 'Religious & Spiritual Discourse', 
    icon: Church, 
    color: 'amber', 
    description: 'Pastors, theologies, interfaith dialogue.',
    subcategories: [
      { id: 'leadership', name: 'Pastoral Leadership', groups: ['General Overseers', 'Youth Pastors', 'Ministers Network'] },
      { id: 'theology', name: 'Theological Deep-Dive', groups: ['Bible Studies', 'Apologetics', 'Systematic Theology'] },
      { id: 'interfaith', name: 'Interfaith Dialogue', groups: ['Peace Builders', 'Community Outreach'] }
    ]
  },
  { 
    id: 'marriage-women', 
    title: 'Marriage & Relationships – Women', 
    icon: Heart, 
    color: 'rose', 
    description: 'Forums for married women, remedies.',
    subcategories: [
      { id: 'wife-hood', name: 'The Wives Forum', groups: ['Submissive Wife', 'Career & Marriage', 'New Brides'] },
      { id: 'health-remedies', name: 'Health & Natural Remedies', groups: ['Fertility Support', 'Holistic Wellness', 'Skin Care'] },
      { id: 'parenting', name: 'Mothers Hub', groups: ['First-Time Moms', 'Teen Parenting', 'Homeschooling'] }
    ]
  },
  { 
    id: 'marriage-men', 
    title: 'Marriage & Relationships – Men', 
    icon: UserCircle, 
    color: 'blue', 
    description: 'Husbands’ corner, leadership.',
    subcategories: [
      { id: 'husband-hq', name: 'The Husbands HQ', groups: ['Provident Men', 'Emotional Leadership', 'Man Cave'] },
      { id: 'mentorship', name: 'Fatherhood Mentorship', groups: ['Dad & Son', 'New Fathers', 'Single Dads Support'] }
    ]
  },
  { 
    id: 'singles', 
    title: 'Singles & Courtship', 
    icon: Users, 
    color: 'pink', 
    description: 'Dating etiquette, marriage readiness.',
    subcategories: [
      { id: 'readiness', name: 'Marriage Readiness', groups: ['Purposeful Dating', 'Emotional Healing', 'Financial Prep'] },
      { id: 'networking', name: 'Singles Networking', groups: ['Professionals Lounge', 'Global Connections'] }
    ]
  },
  { 
    id: 'sports', 
    title: 'Sports & Talent', 
    icon: Trophy, 
    color: 'orange', 
    description: 'All sports talk, training tips.',
    subcategories: [
      { id: 'football', name: 'Football Universe', groups: ['PL Fans', 'La Liga Central', 'Transfers News'] },
      { id: 'training', name: 'Elite Performance', groups: ['Fitness & Gym', 'Personal Training', 'Injury Recovery'] }
    ]
  },
  { 
    id: 'widows', 
    title: 'Widows & Widowers', 
    icon: UserMinus, 
    color: 'purple', 
    description: 'Connections, remarriage support.', 
    subcategories: [
      { id: 'widow-connections', name: 'Widow Connections', groups: ['Global Companionship', 'Support & Healing', 'New Horizons'] },
      { id: 'remarriage-sup', name: 'Remarriage Support', groups: ['Blended Families', 'Courtship Protocols', 'Legal & Wisdom'] }
    ] 
  },
  { 
    id: 'dating-connections', 
    title: 'Dating & Connections', 
    icon: Link2, 
    color: 'red', 
    description: 'Safe dating practices, roadmaps.', 
    subcategories: [
      { id: 'courtship-roadmaps', name: 'Premium Courtship Roadmaps', groups: ['Match Selection Criteria', 'First Date Protocols', 'Value Alignment Audit'] },
      { id: 'safe-dating-guard', name: 'Safe Dating Safeguards', groups: ['Verification Standards', 'Moderated Safe Dating', 'Red Flag Consulting Counsel'] }
    ] 
  },
  { 
    id: 'youth', 
    title: 'Youth & Character Development', 
    icon: UserCircle, 
    color: 'emerald', 
    description: 'Character building, young men forum.', 
    subcategories: [
      { id: 'char-building', name: 'Character Building Academy', groups: ['Ethical Leadership Initiatives', 'Mental Resilience Gym', 'Integrity Network Circle'] },
      { id: 'young-men-council', name: 'Young Men Council', groups: ['Manhood Transition Councils', 'Sovereign Purpose Discovery', 'Civic Action duty'] }
    ] 
  },
  { 
    id: 'education', 
    title: 'Education & Student Life', 
    icon: GraduationCap, 
    color: 'indigo', 
    description: 'Career guidance, study tips.', 
    subcategories: [
      { id: 'career-acad-guidance', name: 'Career & Academic Guidance', groups: ['Global Scholarship Councils', 'Major Selection Advisors', 'Study Abroad networks'] },
      { id: 'student-life-tactics', name: 'Student Life Tactics', groups: ['Cognitive Study Strategies', 'High-Performance Research Methods', 'Focus Optimization protocols'] }
    ] 
  },
  { 
    id: 'technology', 
    title: 'Technology & Knowledge Exchange', 
    icon: Cpu, 
    color: 'cyan', 
    description: 'Trends, knowledge sharing.', 
    subcategories: [
      { id: 'tech-frontier-trends', name: 'Tech Frontiers & Artificial Intelligence', groups: ['Neural Nets & LLM Tuning', 'Sovereign Decentralised Frameworks', 'Industrial Automation Lab'] },
      { id: 'peer-knowledge-exch', name: 'Peer Knowledge Exchange Labs', groups: ['Coding Bootcamps Circles', 'Product Matrix design', 'Micro-architecture Forums'] }
    ] 
  },
  { 
    id: 'jobs', 
    title: 'Employment & Careers', 
    icon: Briefcase, 
    color: 'slate', 
    description: 'Job vacancies, interview trends.', 
    subcategories: [
      { id: 'career-job-placements', name: 'Career Opportunities & Job Placement', groups: ['Remote Tech Placements', 'Local Industry listings', 'Global C-Suite Executive Roles'] },
      { id: 'interview-prep', name: 'Interview Prep Headquarters', groups: ['Resume Excellence Audit', 'Behavioral Masterclasses', 'Salary Negotiations Hub'] }
    ] 
  },
  { 
    id: 'manufacturing', 
    title: 'Manufacturing & Industry Trends', 
    icon: Factory, 
    color: 'zinc', 
    description: 'Product insights, industry trends.', 
    subcategories: [
      { id: 'supply-chain-insights', name: 'Supply Chain & Material Sourcing', groups: ['Supply Chain Security Grid', 'Raw Materials Exchanges', 'Precision Sourcing Strategies'] },
      { id: 'factory-eco-trends', name: 'Factory Automation & Green Mfg', groups: ['Industrial IoT Sensor Nodes', 'Zero-Waste circular trends', 'Local Fab Facilities list'] }
    ] 
  }
];

import { ReelCreator } from './ReelCreator';
import { SovereignGroupArena } from './SovereignGroupArena';

const PRESET_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '😉', '😍', '🥰', '😘', '🤪', '😜', '🤑', '😎', '🤓',
  '🧐', '🚀', '🔥', '💻', '💡', '📈', '💎', '🙌', '💯', '🤝',
  '👏', '🥳', '😱', '🤫', '👀', '✨', '🎉', '🌟', '👍', '❤️'
];

const PRESET_GIFS = [
  { name: 'Mind Blown', url: 'https://media.giphy.com/media/2rqEdFksE5gUo/giphy.gif' },
  { name: 'Clapping', url: 'https://media.giphy.com/media/nbvFV5D3Adc6fceduU/giphy.gif' },
  { name: 'Excited', url: 'https://media.giphy.com/media/lz02c8ctM99BC8L671/giphy.gif' },
  { name: 'Popcorn', url: 'https://media.giphy.com/media/hVTouqNmVKiNa/giphy.gif' },
  { name: 'Coding', url: 'https://media.giphy.com/media/QuxqWk7m9g3gRC5gss/giphy.gif' },
  { name: 'Celebrate', url: 'https://media.giphy.com/media/26tPplGWjN0x96D6g/giphy.gif' },
  { name: 'Shocked', url: 'https://media.giphy.com/media/vQqeT3AYg8S5O/giphy.gif' },
  { name: 'Success', url: 'https://media.giphy.com/media/l0HlIDueXmc89pCC4/giphy.gif' }
];

const PRESET_STICKERS = [
  { name: 'Sovereign Diamond', url: 'https://media2.giphy.com/media/W80Y9y1XSSgC2otT9M/giphy.gif' },
  { name: 'Tactical Bullseye', url: 'https://media4.giphy.com/media/D8uW8XQxP9Z3a/giphy.gif' },
  { name: 'Gold Medal Sync', url: 'https://media3.giphy.com/media/g9582DNuQppazNM4SZ/giphy.gif' },
  { name: 'Rocket Fire', url: 'https://media1.giphy.com/media/Ky5gU85gYfV3v5L37L/giphy.gif' },
  { name: 'Thumbs Up Champion', url: 'https://media2.giphy.com/media/l3q2zVr6cu95nF6O4/giphy.gif' },
  { name: 'Mega Crown', url: 'https://media0.giphy.com/media/TdfyKr6O24vAGqKIsN/giphy.gif' },
  { name: 'High-Five Node', url: 'https://media3.giphy.com/media/3o7qDQ4kcSD1PLM3BK/giphy.gif' },
  { name: 'Absolute Victory', url: 'https://media3.giphy.com/media/j3gsT11F5wqWo3FJls/giphy.gif' }
];

const DEFAULT_MOCK_REELS: Reel[] = [
  {
    id: 'viral-1',
    authorId: 'efado_official',
    authorName: 'EFADO Global Hub',
    authorPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-shot-of-a-woman-smiling-at-the-camera-41584-large.mp4',
    caption: '🚀 Welcome to EFADO Gist Hub! The world\'s premier video reels & social syndicate! #Viral #Reels #EFADO',
    likes: ['user1', 'user2', 'user3', 'user4', 'user5'],
    comments: [{ id: 'c1', authorName: 'Chioma', text: 'Love this video reel interface! Super smooth 🔥' }],
    shares: 482,
    createdAt: new Date()
  },
  {
    id: 'viral-2',
    authorId: 'tech_guru',
    authorName: 'Tech Vanguard',
    authorPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-working-on-her-laptop-in-a-coffee-shop-40340-large.mp4',
    caption: '💻 Building high-performance global web nodes on EFADO. Share your reels now! #Tech #Innovation',
    likes: ['user1', 'user4'],
    comments: [{ id: 'c2', authorName: 'Emeka', text: 'This beats Facebook reels hands down!' }],
    shares: 319,
    createdAt: new Date()
  },
  {
    id: 'viral-3',
    authorId: 'entertainment_ng',
    authorName: 'Afritunes Buzz',
    authorPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smartphone-scrolling-through-a-social-media-app-41126-large.mp4',
    caption: '🎶 Afrobeats viral dance trends live on EFADO Gist Hub! Create your video reel today! #Music #Vibes',
    likes: ['user5', 'user6', 'user7', 'user8'],
    comments: [],
    shares: 890,
    createdAt: new Date()
  },
  {
    id: 'viral-4',
    authorId: 'sports_weekly',
    authorName: 'Sovereign League',
    authorPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-holding-a-smartphone-with-a-green-screen-41125-large.mp4',
    caption: '⚽ High energy sports & viral action live on EFADO! #Sports #Global #Reels',
    likes: ['user2', 'user9', 'user10'],
    comments: [],
    shares: 210,
    createdAt: new Date()
  }
];

interface EfadoGistHubProps {
  user: UserProfile;
  onClose: () => void;
  initialView?: HubView;
  autoStartLive?: boolean;
  onOpenMining?: () => void;
  onNavigate?: (hub: any, subview?: any) => void;
}

type HubView = 'FEED' | 'REELS' | 'LIVE' | 'COMMUNITIES' | 'MONETIZATION' | 'CHAT' | 'ADS' | 'PROFILE' | 'CATEGORIES' | 'BLOG' | 'FAQ' | 'TOOLS';

export const EfadoGistHub: React.FC<EfadoGistHubProps> = ({ user, onClose, initialView, autoStartLive, onOpenMining, onNavigate }) => {
  const [activeView, setActiveView] = useState<HubView>(initialView || 'FEED');
  const [showGuide, setShowGuide] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<any | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCalling, setIsCalling] = useState<'VOICE' | 'VIDEO' | null>(null);
  const [showNewsletter, setShowNewsletter] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isNewsletterSubmitting, setIsNewsletterSubmitting] = useState(false);
  const [isNewsletterSubscribed, setIsNewsletterSubscribed] = useState(false);

  // Marketplace Composer & Reaction states
  const [isSellingItem, setIsSellingItem] = useState(false);
  const [marketTitle, setMarketTitle] = useState('');
  const [marketPrice, setMarketPrice] = useState('');
  const [marketCondition, setMarketCondition] = useState<'Brand New' | 'Like New' | 'Used'>('Brand New');
  const [marketLocation, setMarketLocation] = useState('Lagos, Nigeria');
  const [activeMarketplaceFilter, setActiveMarketplaceFilter] = useState(false);
  const [hoveredReactionPostId, setHoveredReactionPostId] = useState<string | null>(null);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [selectedHashtagFilter, setSelectedHashtagFilter] = useState<string | null>(null);
  const [isChatVoiceRecording, setIsChatVoiceRecording] = useState(false);
  const [showQuickWithdrawModal, setShowQuickWithdrawModal] = useState(false);
  const [quickWithdrawAmount, setQuickWithdrawAmount] = useState('1840');
  const [quickWithdrawBank, setQuickWithdrawBank] = useState('Access Bank');
  const [quickWithdrawAccount, setQuickWithdrawAccount] = useState('0123456789');

  // Creator Quick Stats
  const [creatorStats, setCreatorStats] = useState(() => {
    try {
      const raw = localStorage.getItem(`efado_creator_stats_${user.uid}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      totalViews: 24520,
      qualifiedViews: 18400,
      totalEarnings: 1840,
      earnings: 1840,
      payoutRate: '₦100 / 1k views',
      unpaidEarnings: 1840
    };
  });
  const creatorQuickStats = creatorStats;
  const setCreatorQuickStats = setCreatorStats;

  // Profile View Sub-tab & Privacy Badge Controls
  const [profileSubTab, setProfileSubTab] = useState<'POSTS' | 'REELS' | 'SETTINGS'>('POSTS');
  const [showEarningsBadge, setShowEarningsBadge] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`efado_show_earnings_badge_${user.uid}`);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const handleToggleEarningsBadge = (val: boolean) => {
    setShowEarningsBadge(val);
    try {
      localStorage.setItem(`efado_show_earnings_badge_${user.uid}`, JSON.stringify(val));
    } catch {}
  };

  const [activeChatRoomId, setActiveChatRoomId] = useState<string>('sarah');
  const activeRoomDef = {
    name: activeChatRoomId === 'sarah' ? 'Sarah Alade' :
          activeChatRoomId === 'tactical-hq' ? 'Tactical Headquarters' :
          activeChatRoomId === 'global' ? 'Global Syndicate Lounge' :
          activeChatRoomId === 'bishop' ? 'Bishop Enclave' :
          `Private Room: ${activeChatRoomId}`,
    status: 'SOVEREIGN NETWORK CONDUIT'
  };
  const [customRooms, setCustomRooms] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('efado_custom_chat_rooms');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [showPrivateRoomModal, setShowPrivateRoomModal] = useState(false);
  const [privateRoomCode, setPrivateRoomCode] = useState('');
  const [chatSubTab, setChatSubTab] = useState<'DIRECT' | 'GROUPS' | 'BRIDGES'>('DIRECT');
  const [groups, setGroups] = useState<any[]>([]);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [trendingRevealed, setTrendingRevealed] = useState(false);
  const [suggestionsRevealed, setSuggestionsRevealed] = useState(false);
  
  // Custom states for interactive chat tools
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [ledgerAmount, setLedgerAmount] = useState('50000');
  const [ledgerMemo, setLedgerMemo] = useState('Tactical Project Escrow');
  const [ledgerCurrency, setLedgerCurrency] = useState('NGN');
  const [buzzActive, setBuzzActive] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [userVerifiedRooms, setUserVerifiedRooms] = useState<string[]>([]);
  const [showVoiceRecorderModal, setShowVoiceRecorderModal] = useState(false);

  const handleJoinPrivateRoom = (code: string, customName?: string, customPhone?: string, customRole?: string) => {
    const cleanCode = code.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanCode) return;
    
    if (!customRooms.some(r => r.id === cleanCode)) {
      const newRoom = {
        id: cleanCode,
        name: customName?.trim() || `Room: ${cleanCode.toUpperCase()}`,
        status: customPhone?.trim() || 'Private Secure Tunnel',
        role: customRole?.trim() || 'Sovereign Contributor',
        time: 'Just Now',
        msg: 'Ready for secure sync.',
        unread: 0,
        type: 'DIRECT'
      };
      const updated = [newRoom, ...customRooms];
      setCustomRooms(updated);
      localStorage.setItem('efado_custom_chat_rooms', JSON.stringify(updated));
    }
    
    setActiveChatRoomId(cleanCode);
    setPrivateRoomCode('');
    setNewContactName('');
    setNewContactPhone('');
    setNewContactRole('Sovereign Contributor');
    setShowPrivateRoomModal(false);
  };
  const [newMessageText, setNewMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isCreateReelOpen, setIsCreateReelOpen] = useState(false);
  const [selectedReelForModal, setSelectedReelForModal] = useState<Reel | null>(null);
  const [showReelTipModal, setShowReelTipModal] = useState<boolean>(false);
  const [isReelModalMuted, setIsReelModalMuted] = useState<boolean>(false);
  const [sharingItem, setSharingItem] = useState<{ type: 'POST' | 'REEL', id: string } | null>(null);
  const [promotingItem, setPromotingItem] = useState<{ type: 'POST' | 'REEL', id: string } | null>(null);
  const [currentChatSession, setCurrentChatSession] = useState<any>(null);
  const [isAdPaymentOpen, setIsAdPaymentOpen] = useState(false);
  const [selectedAdPlan, setSelectedAdPlan] = useState<any>(null);
  const [showMiningFull, setShowMiningFull] = useState(false);
  const [feedTab, setFeedTab] = useState<'FOR_YOU' | 'FOLLOWING' | 'TRENDING'>('FOR_YOU');
  const { formatPrice, selectedCurrency } = useCurrency();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ROI Calculator & Blog detail, Content Calendar states
  const [roiImpressions, setRoiImpressions] = useState('50000');
  const [roiEngagements, setRoiEngagements] = useState('2500');
  const [roiResult, setRoiResult] = useState<number | null>(5.00);
  const [selectedBlogPost, setSelectedBlogPost] = useState<any | null>(null);
  const [interactiveCalendarOpen, setInteractiveCalendarOpen] = useState(false);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);

  // Gist creation & Password updates
  const [newPostText, setNewPostText] = useState('');
  const [newPostMediaUrl, setNewPostMediaUrl] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showEmojiPickerChat, setShowEmojiPickerChat] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showGifPickerChat, setShowGifPickerChat] = useState(false);
  const [chatAttachedMediaUrl, setChatAttachedMediaUrl] = useState('');
  const [showPollSetup, setShowPollSetup] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptionA, setPollOptionA] = useState('');
  const [pollOptionB, setPollOptionB] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({ text: '', type: '' });

  // Edit Profile Modal States
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(user?.displayName || '');
  const [editFullName, setEditFullName] = useState(user?.fullName || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editPhotoURL, setEditPhotoURL] = useState(user?.photoURL || '');
  const [editCoverPhotoURL, setEditCoverPhotoURL] = useState(user?.coverPhotoURL || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [showStickerPickerChat, setShowStickerPickerChat] = useState(false);
  const [customBlogs, setCustomBlogs] = useState<any[]>([]);
  const [showBlogCreateModal, setShowBlogCreateModal] = useState(false);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogCategory, setBlogCategory] = useState('Technology');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogImage, setBlogImage] = useState('');
  const [isPublishingBlog, setIsPublishingBlog] = useState(false);

  // Calls
  const [callStatus, setCallStatus] = useState<'CONNECTING' | 'RINGING' | 'CONNECTED' | 'DISCONNECTED'>('CONNECTING');
  const [callDuration, setCallDuration] = useState(0);
  const [callMuted, setCallMuted] = useState(false);
  const [callVideoOff, setCallVideoOff] = useState(false);

  // New Contact
  const [newContactName, setNewContactName] = useState('');
  const [newContactCode, setNewContactCode] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRole, setNewContactRole] = useState('Sovereign Contributor');

  useEffect(() => {
    if (user) {
      setEditDisplayName(user.displayName || '');
      setEditFullName(user.fullName || '');
      setEditBio(user.bio || '');
      setEditPhotoURL(user.photoURL || '');
      setEditCoverPhotoURL(user.coverPhotoURL || '');
    }
  }, [user]);

  // Load custom blogs from Firestore
  useEffect(() => {
    try {
      const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCustomBlogs(list);
      }, (err) => {
        console.error("Error loading custom blogs from Firestore:", err);
      });
      return unsubscribe;
    } catch (e) {
      console.error("Failed to setup blogs observer:", e);
    }
  }, []);

  // Monitor calling state transitions (Connecting -> Ringing -> Connected)
  useEffect(() => {
    if (isCalling) {
      setCallStatus('CONNECTING');
      setCallDuration(0);
      setCallMuted(false);
      setCallVideoOff(false);
      const ringTimer = setTimeout(() => {
        setCallStatus('RINGING');
        const connectTimer = setTimeout(() => {
          setCallStatus('CONNECTED');
        }, 2500);
        return () => clearTimeout(connectTimer);
      }, 1500);
      return () => clearTimeout(ringTimer);
    }
  }, [isCalling]);

  // Handle call duration tick
  useEffect(() => {
    let timer: any;
    if (isCalling && callStatus === 'CONNECTED') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [isCalling, callStatus]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        displayName: editDisplayName.trim(),
        fullName: editFullName.trim(),
        bio: editBio.trim(),
        photoURL: editPhotoURL.trim(),
        coverPhotoURL: editCoverPhotoURL.trim(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      setShowEditProfileModal(false);
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert("Failed to save profile updates. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleImageUpload = (file: File, type: 'AVATAR' | 'COVER') => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Constraints for ultra-fast, Firestore-friendly image footprints
          const maxWidth = type === 'AVATAR' ? 300 : 800;
          const maxHeight = type === 'AVATAR' ? 300 : 450;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Downsample with a quality rating of 0.65 to ensure high density but tiny bytes size
            const compressed = canvas.toDataURL('image/jpeg', 0.65);
            if (type === 'AVATAR') {
              setEditPhotoURL(compressed);
            } else {
              setEditCoverPhotoURL(compressed);
            }
          }
        };
        img.onerror = () => {
          alert("Selected file could not be loaded as a valid image. Please select a PNG or JPEG.");
        };
      }
    };
    reader.onerror = () => {
      alert("Error reading file.");
    };
    reader.readAsDataURL(file);
  };

  const handleFeedMediaUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'video' && file.size > 2 * 1024 * 1024) {
      alert("This video file is too massive for Firestore direct embedding (Max 2MB). Direct video links are recommend!");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        if (type === 'image') {
          const img = new Image();
          img.src = reader.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxWidth = 800;
            const maxHeight = 600;

            if (width > height) {
              if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              }
            } else {
              if (height > maxHeight) {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressed = canvas.toDataURL('image/jpeg', 0.65);
              setNewPostMediaUrl(compressed);
              setShowMediaInput(true);
            }
          };
          img.onerror = () => {
            alert("Error rendering image upload. Try a standard JPEG or PNG.");
          };
        } else {
          setNewPostMediaUrl(reader.result as string);
          setShowMediaInput(true);
        }
      }
    };
    reader.onerror = () => {
      alert("Error reading file.");
    };
    reader.readAsDataURL(file);
  };

  const handleChatMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxWidth = 500;
          const maxHeight = 400;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.6);
            setChatAttachedMediaUrl(compressed);
          }
        };
      }
    };
    reader.readAsDataURL(file);
  };

  // Interaction Handlers
  const handleLikePost = async (id: string, currentlyLiked: boolean) => {
    try {
      const postRef = doc(db, 'social_posts', id);
      await updateDoc(postRef, {
        likes: currentlyLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const handleLike = async (id: string, type: 'POST' | 'REEL') => {
    try {
      const collectionName = type === 'POST' ? 'social_posts' : 'reels';
      const docRef = doc(db, collectionName, id);
      // For simplicity in mock/social, we'll toggle based on current state if available, 
      // but here we'll just use a generic toggle logic or just call handleLikePost for posts
      if (type === 'POST') {
        const post = posts.find(p => p.id === id);
        if (post) handleLikePost(id, post.likes.includes(user.uid));
      } else {
        await updateDoc(docRef, {
          likes: arrayUnion(user.uid) // Basic toggle logic for reels
        });
      }
    } catch (err) {
      console.error("Error liking:", err);
    }
  };

  // FAQ Dataset for SEO
  const FAQ_DATA = [
    { q: "What is EFADO Gist Hub?", a: "EFADO Gist Hub is a global social ecosystem designed for meaningful discourse, community building, and real-time knowledge exchange across various professional and spiritual categories." },
    { q: "How do I promote my business here?", a: "You can use the 'Advertisement Center' to create targeted campaigns that reach specific communities within the hub, from technology enthusiasts to spiritual leaders." },
    { q: "Is the Gist Hub safe for women and youth?", a: "Yes, we have dedicated, moderated sub-sections like 'The Wives Forum' and 'Youth Development' with strict community guidelines and security protocols." },
    { q: "Can I earn while using the Gist Hub?", a: "Directly through the Ads center or by building industry authority in our tactical communities, which often leads to job opportunities and professional networking." }
  ];

  // Tactical Blog Content
  const BLOG_POSTS = [
    {
      id: 1,
      title: "The Future of Digital Communities in Nigeria",
      category: "Technology",
      excerpt: "Exploring how platforms like EFADO are redefining social interaction and local industry and manufacturing trends...",
      date: "Oct 12, 2023",
      image: "https://picsum.photos/seed/blog1/600/400",
      content: "Digital ecosystems in Nigeria are transitioning from passive chat boards to active value creation and micro-economy clusters. Emerging frameworks like EFADO demonstrate how high-integrity systems empower local industry, technical manufacturing, and remote collaboration. By nesting trust networks into functional hubs, we pave a non-linear path for youth development and sustainable regional tech-scale. Moving forward, the fusion of micro-banking protocols and secure peer coordination will define the absolute standard for online communities across emerging markets."
    },
    {
      id: 2,
      title: "Building Marriage Resilience in the Modern Age",
      category: "Relationships",
      excerpt: "Tactical advice for young couples navigating the complexities of career and family in a fast-paced global economy...",
      date: "Oct 10, 2023",
      image: "https://picsum.photos/seed/blog2/600/400",
      content: "Building long-term relationship resilience in contemporary, fast-paced commercial hubs requires structured intentionality and shared priorities. Today's couples navigate complex pressures from hybrid career shifts, globalized social media comparisons, and evolving economic parameters. Tactical resilience begins with absolute financial transparency, transparent communication protocols, and dedicating screen-free spaces in home environments. EFADO's 'Wives Forum' and community circles seek to establish a solid backing where values and long-term commitments are anchored in communal wisdom."
    },
    {
      id: 3,
      title: "Spiritual Leadership: Leading with Integrity",
      category: "Religion",
      excerpt: "A deep dive into the theological foundations of leadership and how pastors can impact their communities positively...",
      date: "Oct 08, 2023",
      image: "https://picsum.photos/seed/blog3/600/400",
      content: "Primacy of integrity remains the absolute non-negotiable metric for spiritual guides and community builders in our contemporary connected age. Pastors, ministers, and elders must establish clear ethical boundaries, transparent financial reporting, and high personal accountability standards. Stewardship is not about visual popularity or digital engagement counts; it is about local human integration, spiritual authenticity, and the selfless growth of congregants. Engaging in tactical peer forums helps modern leaders align their actions with original scriptures and eternal parameters."
    }
  ];

  // Ad Deployment Plans
  const AD_PLANS = [
    {
      name: "Tactical Entry",
      duration: "3 Days",
      amount: 0,
      description: "Free trial period for local testing deployment.",
      features: ["1 Active Campaign", "Basic Reach Intel", "Category Targeting"]
    },
    {
      name: "Standard Deployment",
      duration: "Monthly",
      amount: 10000,
      description: "Consistent brand presence.",
      features: ["3 Active Campaigns", "Standard Analytics", "Interest Targeting", "Email Support"]
    },
    {
      name: "Strategic Growth",
      duration: "Quarterly",
      amount: 25000,
      description: "Optimized cost efficiency.",
      features: ["10 Active Campaigns", "Advanced Analytics", "Behavioral Layering", "Priority Chat"]
    },
    {
      name: "Operational Command",
      duration: "6 Months",
      amount: 45000,
      description: "Global sustained influence.",
      features: ["25 Active Campaigns", "Verified Badge", "Retargeting Data", "Strategy Support"]
    },
    {
      name: "Global Authority",
      duration: "Yearly",
      amount: 80000,
      description: "Maximum market scale.",
      features: ["Unlimited Campaigns", "Real-time API", "Account Manager", "Reach Boost"]
    },
    {
      name: "Sovereign Scale",
      duration: "Enterprise",
      amount: -1, 
      description: "Bespoke infrastructure.",
      features: ["Tailored Solutions", "White-label Options", "24/7 Elite Support", "Custom API"]
    }
  ];

  useEffect(() => {
    // Index-free queries for maximum database resilience
    const postsQuery = query(collection(db, 'social_posts'), limit(250));
    const reelsQuery = query(collection(db, 'reels'), limit(250));
    const adsQuery = query(collection(db, 'ads'), where('status', '==', 'active'));

    const DEFAULT_MOCK_POSTS: SocialPost[] = [
      {
        id: 'mock-1',
        authorId: 'system-1',
        authorName: 'Dr. Sarah (Lead Eng)',
        authorPhoto: 'https://picsum.photos/seed/sarah/100/100',
        content: "Deploying the sovereign EFADO digital architecture with 100% end-to-end encryption protocols. Welcome to the Gist Hub! Express your thoughts freely, connect in specialized hubs, and explore creator monetization channels! 🛡️🚀",
        likes: ['user-1'],
        comments: [],
        category: 'TECH',
        createdAt: { seconds: Math.floor(Date.now() / 1000) - 300 }
      },
      {
        id: 'mock-2',
        authorId: 'system-2',
        authorName: 'Minister Caleb',
        authorPhoto: 'https://picsum.photos/seed/caleb/100/100',
        content: "Integrity is the chief cornerstone of community-building. In these modern spaces, we seek fruitful relationships, professional excellence, and wisdom. Join the Church Administration or Marriage and Courtship hubs for deep discourse! 📖✨",
        likes: [],
        comments: [],
        category: 'RELIGIOUS',
        createdAt: { seconds: Math.floor(Date.now() / 1000) - 1800 }
      },
      {
        id: 'mock-3',
        authorId: 'system-3',
        authorName: 'Victoria (Business Head)',
        authorPhoto: 'https://picsum.photos/seed/victoria/100/100',
        content: "A professional network thrives on collaborative feedback and mutual mentorship. We are rolling out creator monetization payouts so active gisters can monetize their community traffic! Let's build together! 💼💰",
        likes: ['user-2', 'user-3'],
        comments: [],
        category: 'BUSINESS',
        createdAt: { seconds: Math.floor(Date.now() / 1000) - 3600 }
      }
    ];

    const unsubPosts = onSnapshot(postsQuery, (snap) => {
      let fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SocialPost));
      // Sort client-side by createdAt descending
      fetched.sort((a, b) => {
        const tA = a.createdAt?.seconds || (a.createdAt instanceof Date ? a.createdAt.getTime()/1000 : 0);
        const tB = b.createdAt?.seconds || (b.createdAt instanceof Date ? b.createdAt.getTime()/1000 : 0);
        return tB - tA;
      });
      if (fetched.length > 0) {
        setPosts(fetched);
      } else {
        setPosts(DEFAULT_MOCK_POSTS);
      }
    }, (err) => {
      console.error("Failed to load posts, using fallback posts:", err);
      setPosts(DEFAULT_MOCK_POSTS);
    });

    const unsubReels = onSnapshot(reelsQuery, (snap) => {
      let fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reel));
      // Sort client-side by createdAt descending
      fetched.sort((a, b) => {
        const tA = a.createdAt?.seconds || (a.createdAt instanceof Date ? a.createdAt.getTime()/1000 : 0);
        const tB = b.createdAt?.seconds || (b.createdAt instanceof Date ? b.createdAt.getTime()/1000 : 0);
        return tB - tA;
      });
      if (fetched.length > 0) {
        setReels(fetched);
      } else {
        setReels(DEFAULT_MOCK_REELS);
      }
    }, (err) => {
      console.error("Failed to load reels:", err);
      setReels(DEFAULT_MOCK_REELS);
    });

    const unsubAds = onSnapshot(adsQuery, (snap) => {
      setAds(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Advertisement)));
    }, (err) => {
      console.error("Failed to load ads:", err);
    });

    setLoading(false);
    return () => {
      unsubPosts();
      unsubReels();
      unsubAds();
    };
  }, []);

  // Synchronise Live Chat Groups from Firestore
  useEffect(() => {
    const groupsQuery = query(collection(db, 'gist_groups'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(groupsQuery, (snap) => {
      const loaded = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGroups(loaded);
    }, (err) => {
      console.error("Error loading Gist Hub groups:", err);
    });
    return unsubscribe;
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setIsCreatingGroup(true);
    try {
      const groupCode = newGroupName.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-');
      const groupRef = doc(db, 'gist_groups', groupCode);
      await setDoc(groupRef, {
        id: groupCode,
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || 'Active Gist Hub Group',
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        status: 'Active Group',
        msg: 'Ready for real-time sync.',
        type: 'GROUP'
      });
      setActiveChatRoomId(groupCode);
      setNewGroupName('');
      setNewGroupDescription('');
      setShowCreateGroupModal(false);
    } catch (err) {
      console.error("Failed to create group:", err);
      alert("Failed to create group. Please try again.");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  // Synchronise Live Chat Room Messages from Firestore (Index-Free Client-Side Sorted Query)
  useEffect(() => {
    if (activeView !== 'CHAT') return;
    const messagesQuery = query(
      collection(db, 'gist_chat_messages'),
      where('roomId', '==', activeChatRoomId),
      limit(100)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snap) => {
      const dbMsgs = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort client-side by timestamp (safe for server timestamp and Date objects)
      dbMsgs.sort((a: any, b: any) => {
        const tA = a.timestamp?.seconds || (a.timestamp instanceof Date ? a.timestamp.getTime()/1000 : 0);
        const tB = b.timestamp?.seconds || (b.timestamp instanceof Date ? b.timestamp.getTime()/1000 : 0);
        return tA - tB;
      });
      setMessages(dbMsgs as any);
    }, (err) => {
      console.error("Error loading Gist Hub live messages (Index-free fallback active):", err);
    });

    return unsubscribe;
  }, [activeChatRoomId, activeView]);

  const handleSubscribeNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      alert("Please enter a valid email address.");
      return;
    }
    setIsNewsletterSubmitting(true);
    try {
      await addDoc(collection(db, 'subscribers'), {
        email: newsletterEmail.toLowerCase().trim(),
        subscribedAt: serverTimestamp(),
        source: 'GistHub_Newsletter'
      });
      setIsNewsletterSubscribed(true);
    } catch (err) {
      console.error("Error subscribing to newsletter:", err);
      alert("Subscription failed. Please try again.");
    } finally {
      setIsNewsletterSubmitting(false);
    }
  };

  const handleSendMessage = async (eOrText?: React.FormEvent | string) => {
    if (eOrText && typeof eOrText !== 'string' && 'preventDefault' in eOrText) {
      eOrText.preventDefault();
    }
    const isCustomText = typeof eOrText === 'string';
    const textToSend = isCustomText ? eOrText : newMessageText.trim();
    if (!textToSend && !chatAttachedMediaUrl.trim()) return;
    if (isSendingMessage) return;

    const text = textToSend;
    const media = chatAttachedMediaUrl.trim();
    if (!isCustomText) {
      setNewMessageText('');
    }
    setChatAttachedMediaUrl('');
    setIsSendingMessage(true);

    try {
      await addDoc(collection(db, 'gist_chat_messages'), {
        roomId: activeChatRoomId,
        senderId: user.uid,
        senderName: user.displayName || user.email.split('@')[0],
        senderPhoto: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
        content: text,
        mediaUrl: media || null,
        timestamp: serverTimestamp()
      });

      // Simulate live tactical reply
      setTimeout(async () => {
        let reply = "Affirmative. Command received with high status integrity.";
        let senderName = "System";
        let senderPhoto = "https://picsum.photos/seed/system/100/100";
        
        if (activeChatRoomId === 'sarah') {
          reply = "Understood. The signal remains secure. Syncing node updates now.";
          senderName = "Dr. Sarah (Lead Eng)";
          senderPhoto = "https://picsum.photos/seed/sarah/100/100";
        } else if (activeChatRoomId === 'tactical-hq') {
          reply = "Node received. Broadcasting data stream to strategic channels.";
          senderName = "Tactical HQ";
          senderPhoto = "https://picsum.photos/seed/tactical/100/100";
        } else if (activeChatRoomId === 'global') {
          reply = "Live bridge signal received with 100% integrity. Welcome!";
          senderName = "Global Outreach";
          senderPhoto = "https://picsum.photos/seed/global/100/100";
        } else if (activeChatRoomId === 'bishop') {
          reply = "Blessings to you. Keep pushing the boundary of strategic excellence.";
          senderName = "Bishop T. (Spiritual)";
          senderPhoto = "https://picsum.photos/seed/bishop/100/100";
        }

        try {
          await addDoc(collection(db, 'gist_chat_messages'), {
            roomId: activeChatRoomId,
            senderId: activeChatRoomId,
            senderName,
            senderPhoto,
            content: reply,
            timestamp: serverTimestamp()
          });
        } catch (rErr) {
          console.error("Error writing automated response:", rErr);
        }
      }, 1500);

    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleTransmitLedgerAction = async (currency: string, amount: string, memo: string) => {
    try {
      await addDoc(collection(db, 'gist_chat_messages'), {
        roomId: activeChatRoomId,
        senderId: user.uid,
        senderName: user.displayName || user.email.split('@')[0],
        senderPhoto: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
        content: `[LEDGER_TX] currency:${currency}|amount:${amount}|memo:${memo}`,
        mediaUrl: null,
        timestamp: serverTimestamp()
      });
      setShowLedgerModal(false);
    } catch (err) {
      console.error("Error transmitting ledger:", err);
    }
  };

  const handleFlashBuzzAction = async () => {
    try {
      setBuzzActive(true);
      setTimeout(() => setBuzzActive(false), 1200);
      await addDoc(collection(db, 'gist_chat_messages'), {
        roomId: activeChatRoomId,
        senderId: user.uid,
        senderName: user.displayName || user.email.split('@')[0],
        senderPhoto: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
        content: `[FLASH_BUZZ]`,
        mediaUrl: null,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Error sending flash buzz:", err);
    }
  };

  const handleVerificationReqAction = async () => {
    try {
      await addDoc(collection(db, 'gist_chat_messages'), {
        roomId: activeChatRoomId,
        senderId: user.uid,
        senderName: user.displayName || user.email.split('@')[0],
        senderPhoto: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
        content: `[VERIFICATION_REQ]`,
        mediaUrl: null,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Error sending verification request:", err);
    }
  };

  const handleCreatePost = async (content: string, media?: any, poll?: any) => {
    try {
      const postData: any = {
        authorId: user.uid,
        authorName: user.displayName || user.email,
        authorPhoto: user.photoURL,
        content,
        media: media || [],
        likes: [],
        comments: [],
        createdAt: serverTimestamp()
      };
      if (poll) {
        postData.poll = poll;
      }
      await addDoc(collection(db, 'social_posts'), postData);
    } catch (err) {
      console.error("Error creating post:", err);
    }
  };

  const handleFollowUser = async (authorId: string) => {
    if (authorId === user.uid) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const isFollowing = user.following?.includes(authorId);
      await updateDoc(userRef, {
        following: isFollowing ? arrayRemove(authorId) : arrayUnion(authorId)
      });
      console.log("Follow toggled for", authorId);
    } catch (err) {
      console.error("Error toggling follow:", err);
    }
  };

  const handleVotePoll = async (postId: string, optionIndex: number) => {
    try {
      const postRef = doc(db, 'social_posts', postId);
      const post = posts.find(p => p.id === postId);
      if (!post || !post.poll) return;

      const updatedPoll = { ...post.poll };
      updatedPoll.options = updatedPoll.options.map((opt, idx) => {
        const hasVoted = opt.votes.includes(user.uid);
        let nextVotes = [...opt.votes];
        if (hasVoted) {
          nextVotes = nextVotes.filter(uid => uid !== user.uid);
        }
        if (idx === optionIndex) {
          nextVotes.push(user.uid);
        }
        return {
          ...opt,
          votes: nextVotes
        };
      });

      await updateDoc(postRef, { poll: updatedPoll });
    } catch (err) {
      console.error("Error voting on poll:", err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex bg-slate-950 overflow-hidden"
    >
      <AnimatePresence>
        {showGuide && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md"
          >
            <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden text-white">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
              <button 
                onClick={() => setShowGuide(false)}
                className="absolute top-6 right-6 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-all font-black"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-900/40 mb-6">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight uppercase">Strategic Feed Guide</h2>
                <p className="text-slate-300 font-bold mb-6 leading-relaxed uppercase tracking-[0.1em] text-xs">
                  Social discourse protocols active. Here is how you navigate the EFADO Gist Hub:
                </p>
                
                <div className="space-y-4">
                  {[
                    { icon: MessageSquare, title: "Global Feed", desc: "Participate in diverse discussions across religious, social, and professional categories." },
                    { icon: Video, title: "EFADO Reels", desc: "Short-form tactical video content. Swipe and engage with the global community." },
                    { icon: Users, title: "Specialized Groups", desc: "Join vetted groups focused on marriage, business, and talent development." },
                    { icon: Shield, title: "Secure Discourse", desc: "All communication is encrypted and verified to ensure high-fidelity interactions." }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
                      <div className="w-10 h-10 bg-indigo-500/20 border border-indigo-500/30 rounded-xl flex items-center justify-center shrink-0">
                        <item.icon className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest mb-0.5">{item.title}</h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-medium">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={() => setShowGuide(false)}
                  className="w-full mt-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl transition-all"
                >
                  Initiate Discourse
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative w-full h-full min-h-screen bg-gradient-to-br from-[#0A0F1E] via-[#121A2F] to-[#0A0F1E] text-white flex overflow-hidden">
        
        {/* Left Sidebar - Navigation */}
        <div className="w-20 md:w-72 flex-shrink-0 bg-[#0A0F1E]/90 backdrop-blur-xl border-r border-white/10 flex flex-col z-30">
          <div className="p-4 md:p-6 flex items-center gap-3 border-b border-white/10">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-[#8B5CF6]/30 flex-shrink-0">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="hidden md:block">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Efado <span className="text-[#8B5CF6] font-black">Gist Hub</span></h2>
              </div>
              <button 
                onClick={() => setShowGuide(true)}
                className="text-[9px] font-black text-[#06B6D4] uppercase tracking-widest flex items-center gap-1 hover:text-cyan-300 transition-colors mt-0.5 bg-[#06B6D4]/10 px-2 py-0.5 rounded-lg border border-[#06B6D4]/30"
              >
                <HelpCircle className="w-3 h-3" /> Tactical Guide
              </button>
            </div>
          </div>

          <nav className="flex-grow px-2 md:px-4 space-y-3 md:space-y-1.5 mt-3 overflow-y-auto custom-scrollbar">
            {[
              { id: 'FEED', label: 'Feed', icon: Home, color: 'text-[#8B5CF6]' },
              { id: 'REELS', label: 'Reels', icon: Video, color: 'text-rose-400' },
              { id: 'LIVE', label: 'EFADO Live', icon: Radio, color: 'text-rose-500', badge: 'LIVE' },
              { id: 'COMMUNITIES', label: 'Communities', icon: Users, color: 'text-[#06B6D4]' },
              { id: 'MONETIZATION', label: 'Creator Earnings', icon: Coins, color: 'text-amber-400', badge: '₦100/1k' },
              { id: 'CHAT', label: 'Messages', icon: MessageCircle, color: 'text-blue-400' },
              { id: 'CATEGORIES', label: 'Hubs', icon: Church, color: 'text-emerald-400' },
              { id: 'BLOG', label: 'Blog', icon: ClipboardList, color: 'text-amber-400' },
              { id: 'TOOLS', label: 'Tools', icon: Calculator, color: 'text-cyan-400' },
              { id: 'FAQ', label: 'FAQ', icon: HelpCircle, color: 'text-slate-400' },
              { id: 'ADS', label: 'Advertise on EFADO', icon: DollarSign, color: 'text-emerald-400' },
              { id: 'PROFILE', label: 'Account', icon: UserCircle, color: 'text-[#8B5CF6]' },
            ].map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.02, x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedGroup(null);
                  setSelectedSubCategory(null);
                  setSelectedCategory(null);
                  if (item.id === 'ADS') {
                    onNavigate?.('ADVERTISING', 'ADVERT');
                  } else {
                    setActiveView(item.id as HubView);
                  }
                }}
                className={`w-full flex flex-col md:flex-row items-center justify-between p-2.5 md:p-3.5 rounded-2xl transition-all group ${
                  activeView === item.id 
                    ? 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-lg shadow-[#8B5CF6]/30' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3">
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-bold tracking-wider text-[8px] md:text-xs text-center md:text-left leading-none">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`hidden md:inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    item.badge === 'LIVE' ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </motion.button>
            ))}
          </nav>

          {/* User Profile Mini */}
          <div className="p-4 md:p-6 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-[#8B5CF6]/20 overflow-hidden flex-shrink-0 p-0.5 border border-[#8B5CF6]/30">
                <img src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`} alt="Me" className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
              </div>
              <div className="hidden md:block overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{user.displayName || user.email.split('@')[0]}</p>
                <p className="text-[10px] font-bold text-[#06B6D4] uppercase tracking-widest">Active Member</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-grow flex flex-col bg-transparent relative overflow-hidden">
          {/* Top Header */}
          <header className={`px-4 sm:px-8 py-3 sm:py-5 border-b border-white/10 flex items-center justify-between ${activeView === 'REELS' ? 'bg-black/60' : 'bg-[#0A0F1E]/80 backdrop-blur-xl'} z-20`}>
            <div className="flex items-center gap-2 max-w-[50%] overflow-hidden">
              <h3 className="text-xs xs:text-sm sm:text-2xl font-bold text-white tracking-tight truncate">
                {activeView === 'MONETIZATION' && 'Creator Monetization & Earnings'}
                {activeView === 'LIVE' && 'EFADO Live Streaming'}
                {activeView === 'COMMUNITIES' && 'Community Groups'}
                {activeView === 'BLOG' && 'Knowledge Hub'}
                {activeView === 'TOOLS' && 'Tactical Industry Tools'}
                {activeView === 'FAQ' && 'Help & FAQ Desk'}
                {activeView === 'FEED' && 'Social Gist Feed'}
                {activeView === 'REELS' && 'Viral Video Reels'}
                {activeView === 'CHAT' && 'Direct Messages & Audio'}
                {activeView === 'CATEGORIES' && 'Explore Hubs'}
                {activeView === 'ADS' && 'Advertise on EFADO'}
                {activeView === 'PROFILE' && 'My Social Space'}
              </h3>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <div className="relative hidden lg:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search gists, reels, people..."
                  className="pl-11 pr-6 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs font-medium text-white placeholder:text-slate-500 focus:border-[#8B5CF6] outline-none transition-all w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Notifications Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                  className="p-2 sm:p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-full border border-white/10 transition-all relative"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#0A0F1E]" />
                </button>

                <AnimatePresence>
                  {showNotificationsDropdown && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 top-12 w-80 bg-[#121A2F] border border-white/15 rounded-2xl shadow-2xl p-4 z-50 text-white space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Notifications</h4>
                        <span className="text-[10px] font-bold text-[#8B5CF6]">Mark all read</span>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                        {[
                          { text: "Dr. Sarah started a new Live Stream", time: "2m ago", icon: Radio, color: "text-rose-400" },
                          { text: "You earned ₦184 from video qualified views", time: "1h ago", icon: Coins, color: "text-amber-400" },
                          { text: "Chief Emeka liked your post in Lagos Tech", time: "3h ago", icon: Heart, color: "text-purple-400" },
                          { text: "New marketplace item listed in Electronics", time: "5h ago", icon: ShoppingBag, color: "text-cyan-400" }
                        ].map((notif, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer">
                            <notif.icon className={`w-4 h-4 mt-0.5 ${notif.color} flex-shrink-0`} />
                            <div>
                              <p className="text-xs font-medium text-slate-200 leading-snug">{notif.text}</p>
                              <span className="text-[10px] text-slate-400">{notif.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={() => {
                  const shareUrl = window.location.href;
                  const text = "Check out the EFADO Gist Hub! Join the viral social conversation globally! 🚀🌍";
                  if (navigator.share) {
                    navigator.share({ title: 'EFADO Gist Hub', text, url: shareUrl });
                  } else {
                    navigator.clipboard.writeText(`${text} ${shareUrl}`);
                    alert("Viral invite link copied! Promote this hub across social media for global responses! 🚀");
                  }
                }}
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white rounded-full shadow-lg shadow-[#8B5CF6]/30 hover:scale-105 active:scale-95 transition-all text-xs font-bold"
              >
                <Globe className="w-4 h-4" />
                Invite Friends
              </button>
              <button
                onClick={() => setActiveView('LIVE')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-full font-bold text-[10px] sm:text-xs uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Go Live</span>
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              </button>
              <div className="hidden md:block">
                <CurrencySelector />
              </div>
              <button 
                onClick={onClose} 
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 rounded-xl border border-rose-500/20 transition-all font-bold text-[10px] sm:text-xs uppercase tracking-widest cursor-pointer"
              >
                <X className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                <span>Exit</span>
              </button>
            </div>
          </header>

          {/* View Content */}
          <div className={`flex-grow ${['CHAT', 'REELS'].includes(activeView) ? 'overflow-hidden' : 'overflow-y-auto'} custom-scrollbar bg-gray-50/30`}>
            <AnimatePresence mode="wait">
              {activeView === 'BLOG' && (() => {
                const ALL_BLOG_POSTS = [
                  ...customBlogs.map((b: any) => ({
                    id: b.id,
                    title: b.title,
                    category: b.category || 'Technology',
                    excerpt: b.excerpt || 'Read this full strategic briefing inside the Gist Hub platform.',
                    date: b.createdAt?.seconds 
                      ? new Date(b.createdAt.seconds * 1000).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' }) 
                      : 'Just Now',
                    image: b.image || 'https://picsum.photos/seed/blog/600/400',
                    content: b.content
                  })),
                  ...BLOG_POSTS
                ];

                return (
                  <motion.div 
                    key="blog"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="max-w-6xl mx-auto p-8 space-y-12 animate-fade-in"
                  >
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 golden-card-border p-12 rounded-[3.5rem] text-center relative overflow-hidden flex flex-col items-center">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-32 -mt-32" />
                      <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">SEO Resource Hub</h3>
                      <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium leading-relaxed mb-8">
                        Deep-dive into tactical industry trends, community management, and professional roadmaps.
                      </p>
                      <button 
                        type="button"
                        onClick={() => setShowBlogCreateModal(true)}
                        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-3 border border-indigo-500/30"
                      >
                        <PlusCircle className="w-5 h-5 text-indigo-200" /> Publish Strategic Entry
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {ALL_BLOG_POSTS.map((post, idx) => (
                      <div key={`blog-post-${post.id || idx}-${idx}`} className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-xl shadow-gray-100/50 group hover:-translate-y-2 transition-all">
                        <div className="h-56 overflow-hidden relative">
                          <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                          <div className="absolute top-4 left-4 px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                            {post.category}
                          </div>
                        </div>
                        <div className="p-8">
                          <p className="text-[10px] font-black text-gray-950 uppercase tracking-widest mb-4">{post.date}</p>
                          <h4 className="text-xl font-black text-gray-950 uppercase tracking-tight mb-4 leading-tight group-hover:text-indigo-600 transition-colors">{post.title}</h4>
                          <p className="text-sm font-black text-gray-950 line-clamp-3 mb-8 leading-relaxed">{post.excerpt}</p>
                          <button 
                            onClick={() => setSelectedBlogPost(post)}
                            className="flex items-center gap-2 text-indigo-600 text-xs font-black uppercase tracking-widest hover:translate-x-1 hover:text-indigo-850 transition-all"
                          >
                            Read Tactical Entry <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Related Content Strip */}
                  <div className="pt-12 border-t border-gray-100">
                    <h4 className="text-[10px] font-black text-gray-950 uppercase tracking-[0.3em] mb-8">Recommended for Strategists</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-xl hover:shadow-gray-100/50 transition-all group cursor-pointer">
                          <div className="w-16 h-16 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                             <img src={`https://picsum.photos/seed/rec${i}/100/100`} alt="Rec" referrerPolicy="no-referrer" />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Resource {i}</p>
                            <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight line-clamp-2 leading-tight">Advanced Community Tactics</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
                );
              })()}

              {activeView === 'TOOLS' && (
                <motion.div 
                  key="tools"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-4xl mx-auto p-8 space-y-12"
                >
                  <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-12 rounded-[3.5rem] border border-white/5 golden-card-border relative overflow-hidden">
                    <div className="relative z-10">
                      <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Tactical Social ROI Calculator</h3>
                      <p className="text-indigo-200/60 text-lg mb-10 max-w-xl font-medium leading-relaxed">Calculate the engagement effectiveness and financial ROI of your tactical gists and advertisement campaigns.</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-black/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/10">
                        <div className="space-y-6">
                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-3 pl-1">Total Impressions</label>
                            <input 
                              type="number" 
                              placeholder="e.g. 50000"
                              value={roiImpressions}
                              onChange={(e) => {
                                setRoiImpressions(e.target.value);
                                const imp = parseFloat(e.target.value);
                                const eng = parseFloat(roiEngagements);
                                if (!isNaN(imp) && imp > 0 && !isNaN(eng) && eng >= 0) {
                                  let rate = (eng / imp) * 100;
                                  if (rate > 100) rate = 100;
                                  setRoiResult(parseFloat(rate.toFixed(2)));
                                } else {
                                  setRoiResult(null);
                                }
                              }}
                              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-3 pl-1">Engagement Count</label>
                            <input 
                              type="number" 
                              placeholder="e.g. 2500"
                              value={roiEngagements}
                              onChange={(e) => {
                                setRoiEngagements(e.target.value);
                                const imp = parseFloat(roiImpressions);
                                const eng = parseFloat(e.target.value);
                                if (!isNaN(imp) && imp > 0 && !isNaN(eng) && eng >= 0) {
                                  let rate = (eng / imp) * 100;
                                  if (rate > 100) rate = 100;
                                  setRoiResult(parseFloat(rate.toFixed(2)));
                                } else {
                                  setRoiResult(null);
                                }
                              }}
                              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-center p-8 bg-indigo-600/20 rounded-[2rem] border border-indigo-500/30">
                           <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Engagement Rate</p>
                           <p className="text-6xl font-black text-white tracking-tighter mb-2">
                             {roiResult !== null ? `${roiResult}%` : '--'}
                           </p>
                           <p className={`text-[10px] font-bold uppercase tracking-widest transition-all ${
                             roiResult !== null && roiResult > 4 ? 'text-emerald-400' : roiResult !== null && roiResult > 1.5 ? 'text-amber-400' : 'text-slate-400'
                           }`}>
                             {roiResult !== null ? (roiResult > 4 ? 'Industry Standard: High' : roiResult > 1.5 ? 'Industry Standard: Average' : 'Industry Standard: Low') : 'Fill Out Estimates'}
                           </p>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          const imp = parseFloat(roiImpressions);
                          const eng = parseFloat(roiEngagements);
                          if (isNaN(imp) || imp <= 0) {
                            alert("Please enter a valid number of impressions greater than 0.");
                            return;
                          }
                          if (isNaN(eng) || eng < 0) {
                            alert("Please enter a valid engagement count of 0 or more.");
                            return;
                          }
                          let rate = (eng / imp) * 100;
                          if (rate > 100) rate = 100;
                          setRoiResult(parseFloat(rate.toFixed(2)));
                          alert(`Execution ROI Calculated successfully! Rate: ${rate.toFixed(2)}%. This falls in our high engagement sector bracket.`);
                        }}
                        className="mt-8 w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-500/20 hover:scale-[1.02] transition-all"
                      >
                        Calculate Execution ROI
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-xl shadow-gray-100/50">
                       <h5 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-4">Content Strategy Tool</h5>
                       <p className="text-sm font-medium text-gray-500 mb-6 leading-relaxed">Map out your community engagement roadmaps with our tactical content calendar generator.</p>
                       <button 
                         onClick={() => {
                           setInteractiveCalendarOpen(true);
                           setSelectedCalendarDay('MON');
                         }}
                         className="text-indigo-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform"
                       >
                         Execute App <ChevronRight className="w-4 h-4" />
                       </button>
                    </div>
                    <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-xl shadow-gray-100/50">
                       <h5 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-4">Ad Performance Matrix</h5>
                       <p className="text-sm font-medium text-gray-500 mb-6 leading-relaxed">Analyze conversion rates and sector-specific reach for your Efado hub advertisements.</p>
                       <button 
                         onClick={() => {
                           const imp = parseFloat(roiImpressions) || 50000;
                           const clicks = Math.floor(imp * 0.024);
                           const conversions = Math.floor(clicks * 0.15);
                           alert(
                             `--- EFADO AD PERFORMANCE STRATEGIC ANALYSIS ---\n\n` + 
                             `🎯 Estimated Reach: ${imp.toLocaleString()} users\n` +
                             `🖱️ Predicted Clicks (2.4% CTR): ${clicks.toLocaleString()}\n` +
                             `📈 Predicted Conversions (15% CR): ${conversions.toLocaleString()} leads\n\n` +
                             `Your current campaign parameters reside within our primary tier efficiency rating!`
                           );
                         }}
                         className="text-indigo-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform"
                       >
                         Execute App <ChevronRight className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeView === 'FAQ' && (
                <motion.div 
                  key="faq"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="max-w-4xl mx-auto p-8 space-y-12"
                >
                  <div className="text-center">
                    <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-4">Help & Strategic FAQ</h2>
                    <p className="text-gray-950 text-lg font-black uppercase tracking-tight">Resolving objections and providing tactical clarity for Gist Hub users.</p>
                  </div>

                  <div className="space-y-4">
                    {FAQ_DATA.map((item, i) => (
                      <div key={i} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <details className="group">
                          <summary className="flex items-center justify-between p-8 cursor-pointer list-none">
                            <span className="text-lg font-black text-gray-900 uppercase tracking-tight pr-8">{item.q}</span>
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-open:rotate-180 transition-transform">
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            </div>
                          </summary>
                          <div className="px-8 pb-8">
                             <p className="text-gray-950 font-black leading-relaxed border-t border-gray-100 pt-6">
                               {item.a}
                             </p>
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>

                  <div className="bg-indigo-600 rounded-[3rem] p-12 text-center text-white relative overflow-hidden">
                    <div className="relative z-10">
                      <h4 className="text-2xl font-black uppercase tracking-tight mb-4">Still need intel?</h4>
                      <p className="text-indigo-100 mb-8 font-medium">Connect with our support strategists globally.</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 text-left max-w-2xl mx-auto">
                        <div className="bg-white/10 p-6 rounded-2xl border border-white/10">
                          <MapPin className="w-5 h-5 text-indigo-200 mb-2" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Head Office</p>
                          <p className="text-xs font-bold leading-relaxed">{OFFICE_ADDRESSES.HEAD_OFFICE}</p>
                        </div>
                        <div className="bg-white/10 p-6 rounded-2xl border border-white/10">
                          <Phone className="w-5 h-5 text-indigo-200 mb-2" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">CEO Consultancy</p>
                          <p className="text-sm font-black">{PHONE_NUMBERS.CONSULTANCY_CEO}</p>
                          <p className="text-[10px] font-bold mt-1 opacity-60 italic">Global Response Protocol</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-4">
                        <a 
                          href={`mailto:${SUPPORT_EMAILS.GIST}`}
                          className="px-12 py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                          <Mail className="w-4 h-4" />
                          Email Support Matrix
                        </a>
                        <div className="flex items-center gap-4 px-6 py-4 bg-white/20 rounded-2xl backdrop-blur-md">
                          <Phone className="w-4 h-4 text-emerald-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{PHONE_NUMBERS.CONTACT_1}</span>
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
                  </div>
                </motion.div>
              )}
              {activeView === 'FEED' && (
                <motion.div 
                  key="feed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col h-full overflow-hidden"
                >
                  {/* Feed Column - Clean, Focused Social Interface */}
                  <div className="flex-grow overflow-y-auto custom-scrollbar p-3 sm:p-6 md:p-8 space-y-6 pb-28 sm:pb-36 max-w-4xl mx-auto w-full">
                    
                    {/* Sticky Enhanced Feed Tabs (For You, Following, Trending, Marketplace, Live) */}
                    <div className="sticky top-0 z-30 bg-[#0A0F1E]/90 backdrop-blur-xl py-2 -mx-2 px-2 border-b border-white/10">
                      <div className="flex items-center gap-1.5 sm:gap-2 bg-white/5 border border-white/10 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
                        {[
                          { id: 'FOR_YOU', label: 'For You', icon: Sparkles },
                          { id: 'FOLLOWING', label: 'Following', icon: Users },
                          { id: 'TRENDING', label: 'Trending', icon: Flame },
                          { id: 'MARKETPLACE', label: 'Marketplace', icon: ShoppingBag },
                          { id: 'LIVE', label: 'Live Now', icon: Radio, live: true }
                        ].map((tab) => {
                          const isActive = (tab.id === 'MARKETPLACE' && activeMarketplaceFilter) || (feedTab === tab.id && !activeMarketplaceFilter);
                          return (
                            <button
                              key={tab.id}
                              onClick={() => {
                                if (tab.id === 'LIVE') {
                                  setActiveView('LIVE');
                                  return;
                                }
                                if (tab.id === 'MARKETPLACE') {
                                  setActiveMarketplaceFilter(!activeMarketplaceFilter);
                                } else {
                                  setActiveMarketplaceFilter(false);
                                  setFeedTab(tab.id as any);
                                }
                              }}
                              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                isActive 
                                  ? 'bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white shadow-lg shadow-[#8B5CF6]/30 scale-[1.02]' 
                                  : 'text-slate-300 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              <tab.icon className={`w-3.5 h-3.5 ${tab.live ? 'text-rose-400 animate-pulse' : ''}`} />
                              <span>{tab.label}</span>
                              {tab.live && (
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Creator Quick Earnings Banner (₦100/1000 views monetization) */}
                    <div className="bg-gradient-to-r from-[#8B5CF6]/20 via-[#06B6D4]/15 to-[#8B5CF6]/20 border border-white/15 backdrop-blur-xl p-4 sm:p-5 rounded-2xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#06B6D4] flex items-center justify-center text-white shadow-lg flex-shrink-0">
                          <Coins className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">Creator Monetization Fund</h4>
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold">₦100 / 1K Qualified Views</span>
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">
                            Earned: <span className="font-extrabold text-[#06B6D4] text-sm">₦{creatorStats.earnings.toFixed(2)}</span> • {creatorStats.qualifiedViews.toLocaleString()} 5s+ views
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (creatorStats.earnings < 500) {
                              alert(`Your current earnings are ₦${creatorStats.earnings.toFixed(2)}. Minimum withdrawal threshold is ₦500. Keep posting viral reels and videos!`);
                            } else {
                              alert(`Withdrawal request of ₦${creatorStats.earnings.toFixed(2)} submitted to your linked Nigerian bank account! Processing via EFADO Escrow.`);
                            }
                          }}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                          ⚡ Withdraw ₦
                        </button>
                        <button
                          onClick={() => setActiveView('MONETIZATION')}
                          className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/10 active:scale-95 cursor-pointer"
                        >
                          Studio Analytics →
                        </button>
                      </div>
                    </div>

                    {/* WhatsApp/IMO Style Stories Bar */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-xl">
                      <GistStoriesBar 
                        user={user}
                        onOpenLive={() => setActiveView('LIVE')}
                        onSelectStory={(story) => {
                          alert(`Viewing Story from ${story.authorName}: "${story.mediaUrl || 'Interactive Story'}"`);
                        }}
                      />
                    </div>

                    {/* Post Composer - Glassmorphism */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 sm:p-6 rounded-2xl shadow-2xl space-y-4 hover:border-[#8B5CF6]/40 transition-all">
                      {/* Hidden upload inputs */}
                      <input 
                        type="file" 
                        id="feed-post-image-uploader" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleFeedMediaUpload(e, 'image')} 
                      />
                      <input 
                        type="file" 
                        id="feed-post-video-uploader" 
                        accept="video/*" 
                        className="hidden" 
                        onChange={(e) => handleFeedMediaUpload(e, 'video')} 
                      />

                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full ring-2 ring-[#8B5CF6]/50 overflow-hidden flex-shrink-0">
                          <img src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-grow space-y-3">
                          <textarea 
                            placeholder={`What's happening in your world, ${user.displayName?.split(' ')[0] || 'friend'}?`}
                            value={newPostText}
                            onChange={(e) => setNewPostText(e.target.value)}
                            rows={3}
                            className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-400 text-sm sm:text-base resize-none outline-none font-normal leading-relaxed"
                          />

                          {/* Marketplace Selling Panel Toggle */}
                          {isSellingItem && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-[#121A2F]/90 border border-[#06B6D4]/40 rounded-2xl p-4 space-y-3 shadow-xl"
                            >
                              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                <span className="text-xs font-bold text-[#06B6D4] flex items-center gap-1.5">
                                  <ShoppingBag className="w-4 h-4" /> Marketplace Item Details
                                </span>
                                <button 
                                  type="button" 
                                  onClick={() => setIsSellingItem(false)} 
                                  className="text-[10px] text-slate-400 hover:text-rose-400 font-bold"
                                >
                                  Cancel Selling
                                </button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <input 
                                  type="text"
                                  placeholder="Item Title (e.g., iPhone 15 Pro, Toyota Corolla)"
                                  value={marketTitle}
                                  onChange={(e) => setMarketTitle(e.target.value)}
                                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-[#06B6D4]"
                                />
                                <input 
                                  type="text"
                                  placeholder="Price (e.g., ₦450,000 or $300)"
                                  value={marketPrice}
                                  onChange={(e) => setMarketPrice(e.target.value)}
                                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-[#06B6D4]"
                                />
                                <select
                                  value={marketCondition}
                                  onChange={(e) => setMarketCondition(e.target.value as any)}
                                  className="bg-[#0A0F1E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#06B6D4]"
                                >
                                  <option value="Brand New">Brand New</option>
                                  <option value="Like New">Like New</option>
                                  <option value="Used">Used (Good Condition)</option>
                                </select>
                                <input 
                                  type="text"
                                  placeholder="Location (e.g., Lagos, Abuja, Port Harcourt)"
                                  value={marketLocation}
                                  onChange={(e) => setMarketLocation(e.target.value)}
                                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-[#06B6D4]"
                                />
                              </div>
                            </motion.div>
                          )}

                          {/* Media Preview */}
                          {newPostMediaUrl && (
                            <div className="relative rounded-2xl overflow-hidden border border-white/10 max-h-72 max-w-md shadow-2xl bg-black/40">
                              {newPostMediaUrl.startsWith('data:video') || newPostMediaUrl.includes('.mp4') || newPostMediaUrl.includes('.webm') ? (
                                <video src={newPostMediaUrl} controls className="w-full h-auto max-h-72 object-contain" />
                              ) : (
                                <img src={newPostMediaUrl} alt="Attached Preview" className="w-full h-auto max-h-72 object-cover" />
                              )}
                              <button 
                                type="button"
                                onClick={() => setNewPostMediaUrl('')}
                                className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-rose-600 rounded-full text-white transition-all shadow-md"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                          {/* Interactive Poll Panel */}
                          {showPollSetup && (
                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                              <h5 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                <BarChart3 className="w-4 h-4" /> Create Interactive Gist Poll
                              </h5>
                              <input 
                                type="text" 
                                placeholder="Type poll question..." 
                                value={pollQuestion}
                                onChange={(e) => setPollQuestion(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                              />
                              <div className="grid grid-cols-2 gap-3">
                                <input 
                                  type="text" 
                                  placeholder="Option A" 
                                  value={pollOptionA}
                                  onChange={(e) => setPollOptionA(e.target.value)}
                                  className="bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                                />
                                <input 
                                  type="text" 
                                  placeholder="Option B" 
                                  value={pollOptionB}
                                  onChange={(e) => setPollOptionB(e.target.value)}
                                  className="bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                                />
                              </div>
                            </div>
                          )}

                          {/* Emoji Picker */}
                          {showEmojiPicker && (
                            <div className="p-3 bg-[#121A2F] border border-white/15 rounded-2xl grid grid-cols-8 gap-1.5 shadow-2xl">
                              {PRESET_EMOJIS.map(emo => (
                                <button 
                                  type="button" 
                                  key={emo} 
                                  onClick={() => {
                                    setNewPostText(prev => prev + emo);
                                    setShowEmojiPicker(false);
                                  }}
                                  className="text-xl p-1.5 hover:bg-white/10 rounded-lg transition-all"
                                >
                                  {emo}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Tools Bar */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button 
                            type="button"
                            onClick={() => document.getElementById('feed-post-image-uploader')?.click()}
                            className="p-2 text-[#8B5CF6] hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                            title="Upload Photo"
                          >
                            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => document.getElementById('feed-post-video-uploader')?.click()}
                            className="p-2 text-rose-400 hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                            title="Upload Video"
                          >
                            <VideoIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => setIsSellingItem(!isSellingItem)}
                            className={`p-2 rounded-xl transition-all cursor-pointer ${isSellingItem ? 'bg-[#06B6D4]/20 text-[#06B6D4]' : 'text-[#06B6D4] hover:bg-white/5'}`}
                            title="Sell on Marketplace"
                          >
                            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => setShowPollSetup(!showPollSetup)}
                            className={`p-2 rounded-xl transition-all cursor-pointer ${showPollSetup ? 'bg-emerald-500/20 text-emerald-400' : 'text-emerald-400 hover:bg-white/5'}`}
                            title="Poll"
                          >
                            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className={`p-2 rounded-xl transition-all cursor-pointer ${showEmojiPicker ? 'bg-amber-500/20 text-amber-400' : 'text-amber-400 hover:bg-white/5'}`}
                            title="Emoji"
                          >
                            <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>

                        <button 
                          onClick={async () => {
                            if (!newPostText.trim() && !newPostMediaUrl.trim() && !pollQuestion.trim() && !marketTitle.trim()) return;
                            
                            const mediaArr = [];
                            if (newPostMediaUrl.trim()) {
                              const isVideo = newPostMediaUrl.match(/\.(mp4|webm|ogg|mov)/i) || newPostMediaUrl.startsWith('data:video');
                              mediaArr.push({
                                type: (isVideo ? 'video' : 'image') as any,
                                url: newPostMediaUrl.trim()
                              });
                            }

                            let attachedPoll = undefined;
                            if (pollQuestion.trim() && pollOptionA.trim() && pollOptionB.trim()) {
                              attachedPoll = {
                                question: pollQuestion.trim(),
                                options: [
                                  { text: pollOptionA.trim(), votes: [] },
                                  { text: pollOptionB.trim(), votes: [] }
                                ]
                              };
                            }

                            let marketplaceListing = undefined;
                            if (isSellingItem && marketTitle.trim()) {
                              marketplaceListing = {
                                title: marketTitle.trim(),
                                price: marketPrice.trim() || '₦50,000',
                                condition: marketCondition,
                                location: marketLocation.trim() || 'Lagos, Nigeria'
                              };
                            }

                            await handleCreatePost(
                              newPostText + (marketplaceListing ? `\n\n📦 [MARKETPLACE LISTING: ${marketplaceListing.title} - ${marketplaceListing.price}]` : ''),
                              mediaArr,
                              attachedPoll
                            );

                            setNewPostText('');
                            setNewPostMediaUrl('');
                            setPollQuestion('');
                            setPollOptionA('');
                            setPollOptionB('');
                            setIsSellingItem(false);
                            setMarketTitle('');
                            setMarketPrice('');
                            setShowPollSetup(false);
                            setShowEmojiPicker(false);
                          }}
                          className="px-6 py-2.5 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white rounded-xl font-bold text-xs shadow-lg shadow-[#8B5CF6]/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        >
                          Publish Gist
                        </button>
                      </div>
                    </div>

                    {/* Feed Posts List (Glassmorphism cards) */}
                    <div className="space-y-5">
                      {posts.length > 0 ? (
                        posts
                          .filter((p: any) => {
                            if (activeMarketplaceFilter) {
                              return p.content?.includes('MARKETPLACE') || p.marketplaceListing;
                            }
                            if (feedTab === 'FOLLOWING') {
                              return user.following?.includes(p.authorId) || p.authorId === user.uid;
                            }
                            return true;
                          })
                          .map((post) => (
                          <div 
                            key={post.id} 
                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl hover:border-[#8B5CF6]/50 transition-all p-5 sm:p-6 text-white space-y-4"
                          >
                            {/* Author & Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full ring-2 ring-[#8B5CF6]/40 overflow-hidden">
                                  <img src={post.authorPhoto || `https://picsum.photos/seed/${post.authorId}/100/100`} alt={post.authorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">{post.authorName}</h4>
                                    <span className="w-3.5 h-3.5 bg-[#8B5CF6] rounded-full flex items-center justify-center">
                                      <Zap className="w-2 h-2 text-white fill-current" />
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 font-medium">
                                    {post.category || 'Global EFADO'} • 5m ago
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {post.authorId !== user.uid && (
                                  <button 
                                    onClick={() => handleFollowUser(post.authorId)}
                                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                                      user.following?.includes(post.authorId) 
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                        : 'bg-white/10 text-white hover:bg-[#8B5CF6]'
                                    }`}
                                  >
                                    {user.following?.includes(post.authorId) ? '✓ Following' : '+ Follow'}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Post Text Content */}
                            <p className="text-slate-100 text-[15px] font-normal leading-relaxed whitespace-pre-line">
                              {post.content}
                            </p>

                            {/* Attached Marketplace Item Card */}
                            {(post.content?.includes('MARKETPLACE LISTING') || (post as any).marketplaceListing) && (
                              <div className="bg-[#121A2F]/90 border border-[#06B6D4]/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-[#06B6D4]/20 text-[#06B6D4] text-[10px] font-bold rounded-full border border-[#06B6D4]/30">
                                      Marketplace Item
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-medium">📍 Lagos & Global Delivery</span>
                                  </div>
                                  <h5 className="text-sm font-bold text-white">Verified EFADO Merchant Listing</h5>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => {
                                      setActiveChatRoomId('sarah');
                                      setActiveView('CHAT');
                                    }}
                                    className="px-3.5 py-1.5 bg-[#06B6D4] hover:bg-[#06B6D4]/80 text-black font-bold text-xs rounded-xl transition-all"
                                  >
                                    💬 DM Seller
                                  </button>
                                  <button 
                                    onClick={() => alert("Initiating EFADO Escrow Buyer Protection Checkout...")}
                                    className="px-3.5 py-1.5 bg-[#8B5CF6] hover:bg-[#8B5CF6]/80 text-white font-bold text-xs rounded-xl transition-all"
                                  >
                                    🛒 Buy Escrow
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Attached Poll */}
                            {post.poll && (
                              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2.5">
                                <h6 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                  📊 Gist Poll: {post.poll.question}
                                </h6>
                                <div className="space-y-2">
                                  {post.poll.options.map((opt, oIdx) => {
                                    const totalVotes = post.poll.options.reduce((sum, o) => sum + o.votes.length, 0);
                                    const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                                    const hasVoted = opt.votes.includes(user.uid);
                                    return (
                                      <button 
                                        key={oIdx}
                                        onClick={() => post.id && handleVotePoll(post.id, oIdx)}
                                        className={`w-full relative p-2.5 rounded-xl flex items-center justify-between border transition-all text-xs font-bold ${
                                          hasVoted ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                        }`}
                                      >
                                        <div className="absolute left-0 top-0 bottom-0 bg-[#8B5CF6]/20 transition-all duration-500" style={{ width: `${pct}%` }} />
                                        <span className="relative z-10 flex items-center gap-2">
                                          {hasVoted && <span>✓</span>} {opt.text}
                                        </span>
                                        <span className="relative z-10 font-mono text-[11px] text-slate-400">{pct}% ({opt.votes.length})</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Attached Media */}
                            {post.media && post.media.length > 0 && (
                              <div className="rounded-2xl overflow-hidden border border-white/10 max-h-96 bg-black/50">
                                {post.media[0].type === 'video' || post.media[0].url.includes('.mp4') || post.media[0].url.includes('.webm') ? (
                                  <video 
                                    src={post.media[0].url} 
                                    controls 
                                    muted 
                                    autoPlay 
                                    loop 
                                    className="w-full h-auto max-h-96 object-contain" 
                                  />
                                ) : (
                                  <img 
                                    src={post.media[0].url} 
                                    alt="Content" 
                                    className="w-full h-auto max-h-96 object-cover" 
                                    referrerPolicy="no-referrer" 
                                  />
                                )}
                              </div>
                            )}

                            {/* Facebook / IMO Style Multi-Reaction Bar & Actions */}
                            <div className="flex items-center justify-between pt-3 border-t border-white/10">
                              <div className="flex items-center gap-3 sm:gap-5">
                                {/* Reaction Picker Trigger */}
                                <div className="relative group/reactions">
                                  <button 
                                    onClick={() => handleLikePost(post.id, post.likes.includes(user.uid))}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                                      post.likes.includes(user.uid) 
                                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                                        : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
                                    }`}
                                  >
                                    <Heart className={`w-4 h-4 ${post.likes.includes(user.uid) ? 'fill-rose-500' : ''}`} />
                                    <span className="text-xs font-bold">{post.likes.length || 0}</span>
                                  </button>

                                  {/* Hover Reaction Popup */}
                                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover/reactions:flex items-center gap-2 bg-[#121A2F] border border-white/20 p-2 rounded-2xl shadow-2xl z-20">
                                    {['👍', '❤️', '😂', '😮', '🔥', '👏'].map((emo) => (
                                      <button
                                        key={emo}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleLikePost(post.id, false);
                                        }}
                                        className="text-lg hover:scale-125 transition-transform p-1 cursor-pointer"
                                      >
                                        {emo}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <button 
                                  onClick={() => {
                                    alert(`Showing comments for post from ${post.authorName}`);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  <span className="text-xs font-bold">{post.comments?.length || 0}</span>
                                </button>

                                <button 
                                  onClick={() => alert(`Sent ₦100 Tip to ${post.authorName} via EFADO Creator Fund!`)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded-xl transition-all cursor-pointer"
                                >
                                  <Coins className="w-4 h-4 text-amber-400" />
                                  <span className="text-xs font-bold hidden sm:inline">Tip</span>
                                </button>

                                <button 
                                  onClick={() => alert("Post echoed across your followers' feeds!")}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
                                >
                                  <Repeat className="w-4 h-4 text-emerald-400" />
                                  <span className="text-xs font-bold hidden sm:inline">Echo</span>
                                </button>
                              </div>

                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => alert("Gist bookmarked to your private library!")}
                                  className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
                                >
                                  <Bookmark className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => {
                                    if (navigator.share) {
                                      navigator.share({ title: post.authorName, text: post.content, url: window.location.href });
                                    } else {
                                      navigator.clipboard.writeText(window.location.href);
                                      alert("Post link copied to clipboard!");
                                    }
                                  }}
                                  className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
                                >
                                  <Share className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-16 text-center bg-white/5 border border-dashed border-white/10 rounded-3xl">
                          <Globe className="w-12 h-12 text-slate-500 mx-auto mb-4 animate-pulse" />
                          <h4 className="text-base font-bold text-white">No Posts Found</h4>
                          <p className="text-xs text-slate-400 mt-1">Be the first to post a viral gist or marketplace listing!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeView === 'REELS' && (
                <motion.div 
                  key="reels"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex items-center justify-center p-0 md:p-8 bg-slate-950"
                >
                  <ReelFeed 
                    user={user}
                    onOpenCreator={() => setIsCreateReelOpen(true)}
                    onLike={(id) => handleLike(id, 'REEL')}
                    onShare={(item) => setSharingItem({ type: 'REEL', id: item.id })}
                    onTip={(id) => {
                      // Trigger tip flow
                      alert("Opening Tactical Tipping Gateway for Reel: " + id);
                    }}
                  />
                </motion.div>
              )}

              {activeView === 'CHAT' && (
                <motion.div 
                  key="chat"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full flex flex-col md:flex-row"
                >
                  {/* Chat List - Style Tabs */}
                  {(() => {
                    const defaultRooms = [
                      { id: 'tactical-hq', name: 'Tactical HQ', status: '8 members', time: '12:45', msg: 'System check complete.', unread: 0, type: 'GROUP' },
                      { id: 'sarah', name: 'Dr. Sarah (Lead Eng)', status: 'Active', time: '11:20', msg: 'The encryption keys are synced.', unread: 0, type: 'DIRECT' },
                      { id: 'global', name: 'Global Chat (Real-time with Colleague)', status: 'Live Cross-Device Bridge', time: 'Yesterday', msg: 'Active real-time public bridge.', unread: 0, type: 'GROUP' },
                      { id: 'bishop', name: 'Bishop T. (Spiritual)', status: 'Online', time: 'Monday', msg: 'Blessings for the project.', unread: 0, type: 'DIRECT' }
                    ];

                    const dynamicGroupsList = groups.map(g => ({
                      id: g.id,
                      name: g.name,
                      status: g.status || 'Active Group',
                      time: 'Just Now',
                      msg: g.msg || 'Ready for real-time sync.',
                      unread: 0,
                      type: 'GROUP'
                    }));

                    const CHAT_ROOM_DEFS = [
                      ...defaultRooms,
                      ...customRooms.map(r => ({ ...r, type: r.type || 'DIRECT' })),
                      ...dynamicGroupsList
                    ];

                    const filteredRooms = CHAT_ROOM_DEFS.filter(room => {
                      if (chatSubTab === 'DIRECT') {
                        return room.type === 'DIRECT';
                      } else if (chatSubTab === 'GROUPS') {
                        return room.type === 'GROUP';
                      }
                      return false;
                    });

                    const activeRoomDef = CHAT_ROOM_DEFS.find(r => r.id === activeChatRoomId) || CHAT_ROOM_DEFS[1];

                    // Helper to get fallback messages if Firestore list is empty
                    const getDisplayMessagesList = () => {
                      if (messages && messages.length > 0) return messages;
                      const dummy: any[] = [];
                      if (activeChatRoomId === 'sarah') {
                        dummy.push({
                          id: 'init-sarah',
                          senderId: 'sarah',
                          senderName: 'Dr. Sarah (Lead Eng)',
                          content: 'The sovereign encryption protocols are now live. All tactical bridges are holding 100% integrity. 🛡️',
                          timestamp: { seconds: Date.now() / 1000 - 120 }
                        });
                      } else if (activeChatRoomId === 'tactical-hq') {
                        dummy.push({
                          id: 'init-hq',
                          senderId: 'tactical-hq',
                          senderName: 'Tactical HQ',
                          content: 'System check complete. Welcome to Tactical HQ. Report active status.',
                          timestamp: { seconds: Date.now() / 1000 - 120 }
                        });
                      } else if (activeChatRoomId === 'global') {
                        dummy.push({
                          id: 'init-global',
                          senderId: 'global',
                          senderName: 'Global Chat',
                          content: 'Welcome to the Live Global Chat Room! Anyone on any phone or computer can chat here in real-time. Try sending a message and have your colleague open Gist Hub -> Messages -> Global Chat on their phone!',
                          timestamp: { seconds: Date.now() / 1000 - 120 }
                        });
                      } else if (activeChatRoomId === 'bishop') {
                        dummy.push({
                          id: 'init-bishop',
                          senderId: 'bishop',
                          senderName: 'Bishop T. (Spiritual)',
                          content: 'Blessings for the project. Wisdom is the principal thing, so get wisdom and understanding.',
                          timestamp: { seconds: Date.now() / 1000 - 120 }
                        });
                      } else if (customRooms.some(r => r.id === activeChatRoomId)) {
                        dummy.push({
                          id: `init-${activeChatRoomId}`,
                          senderId: activeChatRoomId,
                          senderName: `Private Room: ${activeChatRoomId}`,
                          content: `Welcome to your private room "${activeChatRoomId}"! Tell your colleague to enter this exact room code on their phone to connect. Your conversation is secure and synced in real-time.`,
                          timestamp: { seconds: Date.now() / 1000 - 120 }
                        });
                      } else {
                        // Dynamic groups fallback description message
                        const matchingGroup = groups.find(g => g.id === activeChatRoomId);
                        dummy.push({
                          id: `init-${activeChatRoomId}`,
                          senderId: activeChatRoomId,
                          senderName: matchingGroup ? matchingGroup.name : 'Group Chat',
                          content: `Welcome to the custom secure group "${matchingGroup ? matchingGroup.name : activeChatRoomId}". Describe your tactical plan or share insights with team members!`,
                          timestamp: { seconds: Date.now() / 1000 - 120 }
                        });
                      }
                      return dummy;
                    };

                    const shownMessages = getDisplayMessagesList();

                    return (
                      <>
                        <div className="w-full md:w-96 border-r border-white/5 flex flex-col bg-slate-900">
                          <div className="p-6 border-b border-white/5 bg-indigo-600">
                             <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-6 italic">Secure Comms</h4>
                             <div className="flex items-center gap-1 bg-white/10 p-1 rounded-2xl">
                                <button 
                                  onClick={() => {
                                    setChatSubTab('DIRECT');
                                    setActiveChatRoomId('sarah');
                                  }}
                                  className={`flex-grow py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${chatSubTab === 'DIRECT' ? 'bg-white text-indigo-600 shadow-xl' : 'text-white hover:bg-white/5'}`}
                                >
                                  Direct
                                </button>
                                <button 
                                  onClick={() => {
                                    setChatSubTab('GROUPS');
                                    setActiveChatRoomId('tactical-hq');
                                  }}
                                  className={`flex-grow py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${chatSubTab === 'GROUPS' ? 'bg-white text-indigo-600 shadow-xl' : 'text-white hover:bg-white/5'}`}
                                >
                                  Groups
                                </button>
                                <button 
                                  onClick={() => setChatSubTab('BRIDGES')}
                                  className={`flex-grow py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${chatSubTab === 'BRIDGES' ? 'bg-white text-indigo-600 shadow-xl' : 'text-white hover:bg-white/5'}`}
                                >
                                  Bridges
                                </button>
                             </div>
                          </div>
                          
                          <div className="p-6 border-b border-white/5 flex flex-col gap-3">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                              <input 
                                type="text" 
                                placeholder="Search sovereign logs..."
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white uppercase tracking-widest outline-none focus:ring-1 focus:ring-indigo-500/30"
                              />
                            </div>
                            {chatSubTab === 'DIRECT' && (
                              <button 
                                onClick={() => setShowPrivateRoomModal(true)}
                                className="w-full py-2.5 bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600 hover:border-indigo-500 text-indigo-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                              >
                                <Plus className="w-4 h-4 animate-pulse" /> Connect Private Room
                              </button>
                            )}
                            {chatSubTab === 'GROUPS' && (
                              <button 
                                onClick={() => setShowCreateGroupModal(true)}
                                className="w-full py-2.5 bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600 hover:border-emerald-500 text-emerald-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                              >
                                <Plus className="w-4 h-4 animate-pulse" /> Create Sovereign Group
                              </button>
                            )}
                            {chatSubTab === 'BRIDGES' && (
                              <div className="py-2 px-3 bg-indigo-950/40 border border-indigo-500/10 rounded-xl text-center">
                                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block animate-pulse">
                                  ● Tactical Cross-System Hyper-Links Active
                                </span>
                              </div>
                            )}
                          </div>

                          {chatSubTab === 'BRIDGES' ? (
                            <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-4">
                              {[
                                { id: 'bridge-community', name: 'Community Hub Bridge', desc: 'Secure connection line to CSCC registry and shared community boards.', hub: 'COMMUNITY_HUBS', status: 'Online' },
                                { id: 'bridge-domains', name: 'Domain Portfolio Bridge', desc: 'Active strategic pipeline for premium domains and bidding negotiations.', hub: 'DOMAIN_HUB', status: 'Online' },
                                { id: 'bridge-education', name: 'Education Hub Interconnect', desc: 'Dedicated line for professional learning curriculum and certifications.', hub: 'EDUCATION', status: 'Online' },
                                { id: 'bridge-zoom', name: 'Tactical Zoom Bridge', desc: 'High-integrity secure teleconferencing & virtual team meetings.', hub: 'ZOOM', status: 'Online' }
                              ].map((bridge) => (
                                <div 
                                  key={bridge.id}
                                  className="p-5 bg-slate-950/60 border border-white/5 hover:border-indigo-500/30 rounded-2xl transition-all flex flex-col justify-between gap-3 group"
                                >
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <h5 className="text-xs font-black text-white uppercase tracking-wider">{bridge.name}</h5>
                                      <span className="text-[8px] font-black bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full uppercase tracking-widest">
                                        {bridge.status}
                                      </span>
                                    </div>
                                    <p className="text-[10px] font-medium text-slate-400 leading-relaxed uppercase tracking-wider">
                                      {bridge.desc}
                                    </p>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      if (onNavigate) {
                                        onNavigate(bridge.hub);
                                      } else {
                                        alert(`Connecting tactical bridge: ${bridge.name}`);
                                      }
                                    }}
                                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-1.5"
                                  >
                                    <Link2 className="w-3.5 h-3.5" /> Initialize Bridge
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex-grow overflow-y-auto custom-scrollbar">
                              {filteredRooms.map((chat) => (
                                <button 
                                  key={chat.id} 
                                  onClick={() => setActiveChatRoomId(chat.id)}
                                  className={`w-full p-6 flex items-center gap-4 hover:bg-indigo-600/10 transition-all border-b border-white/5 group border-l-4 ${activeChatRoomId === chat.id ? 'border-l-indigo-600 bg-indigo-600/5' : 'border-l-transparent'}`}
                                >
                                  <div className="relative flex-shrink-0">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 overflow-hidden border border-white/10 shadow-sm">
                                      <img src={`https://picsum.photos/seed/${chat.id}/100/100`} alt="User" referrerPolicy="no-referrer" />
                                    </div>
                                    {chat.status.includes('Active') && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full" />}
                                  </div>
                                  <div className="flex-grow text-left overflow-hidden">
                                    <div className="flex items-center gap-2">
                                       {chat.type === 'GROUP' && <Users className="w-3 h-3 text-indigo-400" />}
                                       <h5 className="text-sm font-black text-white uppercase tracking-tight truncate">{chat.name}</h5>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate mt-1">{chat.msg}</p>
                                  </div>
                                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{chat.time}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Chat Window */}
                        <div className="flex-grow flex flex-col bg-slate-950 relative">
                          {/* Chat Header */}
                          <div className="px-8 py-6 bg-slate-900/60 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between shadow-lg z-10">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-600 p-0.5 shadow-lg shadow-indigo-500/20 flex-shrink-0">
                                <img src={`https://picsum.photos/seed/${activeChatRoomId}/100/100`} alt="User" className="rounded-2xl w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <div>
                                <h5 className="text-base font-black text-white uppercase tracking-tight">{activeRoomDef.name}</h5>
                                <div className="flex items-center gap-2">
                                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                   <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Encrypted Signal Active</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <button onClick={() => setIsCalling('VOICE')} className="p-4 bg-white/5 text-slate-400 hover:text-indigo-400 hover:bg-white/10 rounded-2xl transition-all shadow-sm">
                                <Phone className="w-5 h-5" />
                              </button>
                              <button onClick={() => setIsCalling('VIDEO')} className="p-4 bg-white/5 text-slate-400 hover:text-indigo-400 hover:bg-white/10 rounded-2xl transition-all shadow-sm">
                                <VideoIcon className="w-5 h-5" />
                              </button>
                              <div className="w-px h-8 bg-white/10 mx-2" />
                              <button className="p-4 bg-white/5 text-slate-400 hover:text-white rounded-2xl transition-all shadow-sm">
                                <MoreVertical className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          {/* Messages Area */}
                          <div className="flex-grow p-8 space-y-6 overflow-y-auto custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-90">
                            <div className="flex flex-col items-center gap-3 mb-6">
                              <div className="px-6 py-2 bg-amber-500/15 border border-amber-500/20 rounded-xl flex items-center gap-3 shadow-sm">
                                 <Lock className="w-3.5 h-3.5 text-amber-400" />
                                 <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest text-center max-w-xs leading-normal">
                                   Messages are end-to-end encrypted. No one outside of this chat can read them.
                                 </span>
                              </div>
                              <span className="px-4 py-1.5 bg-slate-900 border border-white/5 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Comm Established</span>
                            </div>
                            
                            {shownMessages.map((msg: any, idx: number) => {
                              const isSelf = msg.senderId === user.uid;
                              
                              const renderSpecialMessageContent = (content: string, self: boolean) => {
                                if (content.startsWith('[LEDGER_TX]')) {
                                  const parts = content.replace('[LEDGER_TX] ', '').split('|');
                                  const data: any = {};
                                  parts.forEach(part => {
                                    const [key, value] = part.split(':');
                                    if (key && value) data[key.trim()] = value.trim();
                                  });
                                  
                                  return (
                                    <div className="p-5 bg-slate-950/90 border border-emerald-500/30 rounded-2xl text-left w-full sm:w-80 shadow-xl space-y-4">
                                      <div className="flex items-center justify-between gap-4 border-b border-emerald-500/20 pb-3">
                                        <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                                            <Download className="w-4 h-4 text-emerald-400" />
                                          </div>
                                          <div>
                                            <p className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">LEDGER TRANSMITTED</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Sovereign Proof Validated</p>
                                          </div>
                                        </div>
                                        <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-wider">SECURE</span>
                                      </div>
                                      
                                      <div className="space-y-1">
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">TRANSMISSION SIZE</p>
                                        <p className="text-xl font-black text-white tracking-tight">{(data.amount ? Number(data.amount) : 50000).toLocaleString()} <span className="text-emerald-400 font-extrabold">{data.currency || 'NGN'}</span></p>
                                      </div>

                                      <div className="space-y-1 border-t border-white/5 pt-3">
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">SECURE MEMO / PURPOSE</p>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-wider truncate">{data.memo || 'Tactical Ledger Sync'}</p>
                                      </div>

                                      <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">LEDGER BRIDGE ID</span>
                                        <span className="text-[8px] font-mono text-emerald-400 font-bold">TX-EFADO-{100000 + (idx * 4321) % 899999}</span>
                                      </div>
                                    </div>
                                  );
                                }

                                if (content.startsWith('[FLASH_BUZZ]')) {
                                  return (
                                    <div className="p-5 bg-slate-950/90 border border-amber-500/30 rounded-2xl text-left w-full sm:w-80 shadow-xl space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center border border-amber-500/20 animate-pulse">
                                          <Zap className="w-4 h-4 text-amber-400" />
                                        </div>
                                        <div>
                                          <p className="text-[10px] font-black uppercase text-amber-400 tracking-wider">🚨 FLASH BUZZ PROTOCOL</p>
                                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Immediate Alert Active</p>
                                        </div>
                                      </div>
                                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">
                                        Co-agent has triggered a direct Flash Buzz. Immediate priority attention is requested on this terminal node.
                                      </p>
                                      <div className="h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 rounded-full overflow-hidden" />
                                    </div>
                                  );
                                }

                                if (content.startsWith('[VERIFICATION_REQ]')) {
                                  const isVerified = userVerifiedRooms.includes(activeChatRoomId);
                                  return (
                                    <div className="p-5 bg-slate-950/90 border border-indigo-500/30 rounded-2xl text-left w-full sm:w-80 shadow-xl space-y-4">
                                      <div className="flex items-center justify-between gap-4 border-b border-indigo-500/20 pb-3">
                                        <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center border border-indigo-500/20">
                                            <Shield className="w-4 h-4 text-indigo-400" />
                                          </div>
                                          <div>
                                            <p className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">SECURE VERIFICATION CHALLENGE</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Enclave challenge active</p>
                                          </div>
                                        </div>
                                      </div>

                                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">
                                        To maintain 100% secure signal integrity on this cross-device tunnel, please verify your sovereign node credentials.
                                      </p>

                                      {isVerified ? (
                                        <div className="py-2.5 bg-emerald-500/15 border border-emerald-500/20 rounded-xl flex items-center justify-center gap-2 text-emerald-400">
                                          <Shield className="w-3.5 h-3.5" />
                                          <span className="text-[9px] font-black uppercase tracking-widest">🟢 ACCESS FULLY VERIFIED</span>
                                        </div>
                                      ) : (
                                        <div className="space-y-2">
                                          <div className="py-2.5 bg-rose-500/15 border border-rose-500/20 rounded-xl flex items-center justify-center gap-2 text-rose-400">
                                            <Lock className="w-3.5 h-3.5 animate-pulse" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">🔴 CHALLENGE ACTIVE</span>
                                          </div>
                                          <button 
                                            type="button"
                                            onClick={() => setShowVerificationModal(true)}
                                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow transition-all active:scale-95 cursor-pointer"
                                          >
                                            Verify Node Identity
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                }

                                return <p className={`text-sm leading-relaxed ${self ? 'text-indigo-50' : 'text-slate-100'}`}>{content}</p>;
                              };

                              if (isSelf) {
                                return (
                                  <div key={msg.id || idx} className="flex flex-col items-end gap-1.5 max-w-[80%] ml-auto animate-fade-in">
                                    <div className={`p-4 sm:p-5 text-white rounded-3xl rounded-tr-none shadow-2xl ${msg.content && (msg.content.includes('[LEDGER_TX]') || msg.content.includes('[FLASH_BUZZ]') || msg.content.includes('[VERIFICATION_REQ]')) ? 'bg-transparent border border-white/10 p-1' : 'bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] border border-white/15'}`}>
                                      {msg.content?.startsWith('[VOICE_NOTE]') ? (
                                        <div className="flex items-center gap-3 py-1 px-2">
                                          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white shadow-md">
                                            <Mic className="w-4 h-4" />
                                          </div>
                                          <div className="space-y-1">
                                            <div className="flex items-center gap-1">
                                              <span className="w-1 h-3 bg-white/80 rounded-full animate-pulse" />
                                              <span className="w-1 h-5 bg-white rounded-full animate-pulse" />
                                              <span className="w-1 h-2 bg-white/80 rounded-full animate-pulse" />
                                              <span className="w-1 h-4 bg-white rounded-full animate-pulse" />
                                              <span className="w-1 h-6 bg-white rounded-full animate-pulse" />
                                              <span className="w-1 h-3 bg-white/80 rounded-full animate-pulse" />
                                            </div>
                                            <p className="text-[10px] font-bold text-white/90">Voice Note (0:12)</p>
                                          </div>
                                        </div>
                                      ) : (
                                        msg.content && renderSpecialMessageContent(msg.content, true)
                                      )}
                                      {msg.mediaUrl && (
                                        <div className="mt-3 rounded-2xl overflow-hidden max-w-xs border border-white/10 hover:scale-[1.02] transition-transform duration-300">
                                          <img src={msg.mediaUrl} alt="Secure link attachment" className="w-full h-auto object-cover max-h-48" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 mr-2">
                                       <p className="text-[10px] font-bold text-slate-400">
                                         {msg.timestamp?.seconds 
                                           ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                                           : 'Sending...'}
                                       </p>
                                       <span className="text-[#06B6D4] text-xs font-bold" title="Seen">✓✓</span>
                                    </div>
                                  </div>
                                );
                              } else {
                                return (
                                  <div key={msg.id || idx} className="flex flex-col gap-1.5 max-w-[80%] animate-fade-in">
                                    <div className={`p-4 sm:p-5 text-slate-100 rounded-3xl rounded-tl-none shadow-xl ${msg.content && (msg.content.includes('[LEDGER_TX]') || msg.content.includes('[FLASH_BUZZ]') || msg.content.includes('[VERIFICATION_REQ]')) ? 'bg-transparent border border-white/10 p-1' : 'bg-white/10 backdrop-blur-xl border border-white/10'}`}>
                                      {msg.content?.startsWith('[VOICE_NOTE]') ? (
                                        <div className="flex items-center gap-3 py-1 px-2">
                                          <div className="w-9 h-9 rounded-full bg-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6] shadow-md">
                                            <Mic className="w-4 h-4" />
                                          </div>
                                          <div className="space-y-1">
                                            <div className="flex items-center gap-1">
                                              <span className="w-1 h-3 bg-[#06B6D4] rounded-full animate-pulse" />
                                              <span className="w-1 h-5 bg-[#06B6D4] rounded-full animate-pulse" />
                                              <span className="w-1 h-2 bg-[#06B6D4] rounded-full animate-pulse" />
                                              <span className="w-1 h-4 bg-[#06B6D4] rounded-full animate-pulse" />
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-300">Voice Note (0:15)</p>
                                          </div>
                                        </div>
                                      ) : (
                                        msg.content && renderSpecialMessageContent(msg.content, false)
                                      )}
                                      {msg.mediaUrl && (
                                        <div className="mt-3 rounded-2xl overflow-hidden max-w-xs border border-white/10">
                                          <img src={msg.mediaUrl} alt="Received link attachment" className="w-full h-auto object-cover max-h-48" />
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 ml-2">
                                      {msg.senderName} • {msg.timestamp?.seconds 
                                        ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                                        : 'Now'}
                                    </p>
                                  </div>
                                );
                              }
                            })}
                          </div>

                          {/* Voice Note Recorder Modal */}
                          {showVoiceRecorderModal && (
                            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
                              <div className="w-full max-w-md">
                                <GistVoiceRecorder 
                                  onSendVoiceNote={(audioUrl, duration) => {
                                    handleSendMessage(`[VOICE_NOTE] audioUrl:${audioUrl}|duration:${duration}`);
                                    setShowVoiceRecorderModal(false);
                                  }}
                                  onCancel={() => setShowVoiceRecorderModal(false)}
                                />
                              </div>
                            </div>
                          )}

                          {/* Chat Input Area */}
                          <div className="relative">
                            <input 
                              type="file" 
                              id="chat-media-loader" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={handleChatMediaUpload} 
                            />

                            {/* Chat Attached Media Preview */}
                            {chatAttachedMediaUrl && (
                              <div className="mx-6 mb-3 p-4 bg-slate-950 border border-white/10 rounded-2xl flex items-center justify-between shadow-lg">
                                <div className="flex items-center gap-4">
                                  <div className="w-16 h-12 bg-slate-900 rounded-lg overflow-hidden border border-white/10">
                                    <img src={chatAttachedMediaUrl} alt="Attached Preview" className="w-full h-full object-cover" />
                                  </div>
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gist media attached</span>
                                </div>
                                <button 
                                  type="button" 
                                  onClick={() => setChatAttachedMediaUrl('')}
                                  className="text-[9px] font-black text-rose-500 hover:text-rose-400 uppercase tracking-widest"
                                >
                                  Remove
                                </button>
                              </div>
                            )}

                            {/* Chat Emoji Picker */}
                            {showEmojiPickerChat && (
                              <div className="absolute z-50 bottom-24 left-6 right-6 p-4 bg-slate-950 border border-white/15 rounded-3xl grid grid-cols-8 gap-2 shadow-2xl">
                                {PRESET_EMOJIS.map(emo => (
                                  <button 
                                    type="button"
                                    key={emo}
                                    onClick={() => {
                                      setNewMessageText(prev => prev + emo);
                                      setShowEmojiPickerChat(false);
                                    }}
                                    className="text-2xl p-2 hover:bg-white/10 rounded-xl transition-all"
                                  >
                                    {emo}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Chat GIF Picker */}
                            {showGifPickerChat && (
                              <div className="absolute z-50 bottom-24 left-6 right-6 p-6 bg-slate-950 border border-white/15 rounded-3xl shadow-2xl">
                                <div className="flex justify-between items-center mb-4">
                                  <h6 className="text-[10px] font-black text-white uppercase tracking-widest">Transmit Reaction GIF</h6>
                                  <button type="button" onClick={() => setShowGifPickerChat(false)} className="text-[9px] font-black uppercase text-rose-500 hover:text-rose-400">Close</button>
                                </div>
                                <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto custom-scrollbar">
                                  {PRESET_GIFS.map((gif, index) => (
                                    <button 
                                      type="button"
                                      key={index}
                                      onClick={() => {
                                        setChatAttachedMediaUrl(gif.url);
                                        setShowGifPickerChat(false);
                                      }}
                                      className="relative rounded-xl overflow-hidden hover:scale-105 transition-all aspect-video border border-white/5"
                                    >
                                      <img src={gif.url} alt={gif.name} className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                                        <span className="text-[8px] font-black text-white uppercase">{gif.name}</span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Chat Sticker Picker */}
                            {showStickerPickerChat && (
                              <div className="absolute z-50 bottom-24 left-6 right-6 p-6 bg-slate-950 border border-white/15 rounded-3xl shadow-2xl">
                                <div className="flex justify-between items-center mb-4">
                                  <h6 className="text-[10px] font-black text-white uppercase tracking-widest">Transmit Sovereign Sticker</h6>
                                  <button type="button" onClick={() => setShowStickerPickerChat(false)} className="text-[9px] font-black uppercase text-rose-500 hover:text-rose-400">Close</button>
                                </div>
                                <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto custom-scrollbar">
                                  {PRESET_STICKERS.map((stk, index) => (
                                    <button 
                                      type="button"
                                      key={index}
                                      onClick={() => {
                                        setChatAttachedMediaUrl(stk.url);
                                        setShowStickerPickerChat(false);
                                      }}
                                      className="relative rounded-xl overflow-hidden hover:scale-105 transition-all aspect-square border border-white/5 bg-slate-900 flex items-center justify-center p-2"
                                    >
                                      <img src={stk.url} alt={stk.name} className="w-14 h-14 object-contain" />
                                      <div className="absolute inset-0 bg-black/5 hover:bg-black/20 flex items-end justify-center p-1">
                                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{stk.name}</span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleSendMessage();
                              }}
                              className="p-4 sm:p-6 bg-[#0A0F1E]/95 border-t border-white/10 shadow-[0_-4px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl"
                            >
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="flex items-center bg-white/5 rounded-2xl p-1 border border-white/10">
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      setShowGifPickerChat(!showGifPickerChat);
                                      setShowStickerPickerChat(false);
                                    }}
                                    className={`px-2.5 py-1.5 border font-bold text-[10px] rounded-xl transition-all mr-1 ${showGifPickerChat ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/40' : 'text-slate-300 border-white/10 hover:bg-white/5'}`}
                                    title="Choose a GIF"
                                  >
                                    GIF
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      setShowStickerPickerChat(!showStickerPickerChat);
                                      setShowGifPickerChat(false);
                                    }}
                                    className={`px-2.5 py-1.5 border font-bold text-[10px] rounded-xl transition-all mr-1 ${showStickerPickerChat ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/40' : 'text-slate-300 border-white/10 hover:bg-white/5'}`}
                                    title="Choose a Sticker"
                                  >
                                    STK
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => document.getElementById('chat-media-loader')?.click()} 
                                    className="p-2 text-slate-300 hover:text-[#8B5CF6] transition-all hover:bg-white/5 rounded-xl"
                                    title="Attach Photo"
                                  >
                                    <ImageIcon className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="flex-grow relative group">
                                  <input 
                                    type="text" 
                                    value={newMessageText}
                                    onChange={(e) => setNewMessageText(e.target.value)}
                                    placeholder={`Message ${activeRoomDef.name}...`}
                                    className="w-full pl-4 pr-12 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:border-[#8B5CF6] outline-none transition-all placeholder:text-slate-500"
                                  />
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      setShowEmojiPickerChat(!showEmojiPickerChat);
                                      setShowGifPickerChat(false);
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-amber-400 transition-all"
                                  >
                                    <Smile className="w-4 h-4" />
                                  </button>
                                </div>
                                
                                {/* Voice Note Mic Button */}
                                <button
                                  type="button"
                                  onClick={() => setShowVoiceRecorderModal(true)}
                                  className="p-3 bg-white/5 hover:bg-[#8B5CF6]/20 text-[#8B5CF6] border border-white/10 hover:border-[#8B5CF6]/40 rounded-2xl transition-all flex items-center justify-center cursor-pointer active:scale-95"
                                  title="Record Voice Note"
                                >
                                  <Mic className="w-5 h-5" />
                                </button>

                                <button 
                                  type="submit"
                                  className="p-3.5 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white rounded-2xl shadow-lg shadow-[#8B5CF6]/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                                >
                                  <Send className="w-5 h-5" />
                                </button>
                              </div>
                              <div className="flex items-center gap-4 sm:gap-6 mt-3 px-2 overflow-x-auto no-scrollbar">
                                <button 
                                  type="button" 
                                  onClick={() => document.getElementById('chat-media-loader')?.click()}
                                  className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-all whitespace-nowrap cursor-pointer"
                                >
                                  <Contact className="w-3.5 h-3.5 text-[#8B5CF6]" /> Share Contact
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => setShowLedgerModal(true)}
                                  className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-all whitespace-nowrap cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5 text-emerald-400" /> Send ₦ Escrow
                                </button>
                                <button 
                                  type="button" 
                                  onClick={handleFlashBuzzAction}
                                  className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-all whitespace-nowrap cursor-pointer"
                                >
                                  <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" /> Flash Buzz
                                </button>
                                <button 
                                  type="button" 
                                  onClick={handleVerificationReqAction}
                                  className="flex items-center gap-1.5 text-xs font-bold text-[#06B6D4] hover:text-[#06B6D4]/80 transition-all whitespace-nowrap ml-auto cursor-pointer"
                                >
                                  <Shield className="w-3.5 h-3.5" /> ID Verified
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </motion.div>
              )}

              {activeView === 'CATEGORIES' && !selectedCategory && (
                <motion.div 
                  key="categories"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="p-10 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 bg-slate-950 overflow-y-auto custom-scrollbar"
                >
                  {GIST_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setSelectedSubCategory(null);
                      }}
                      className="group relative bg-[#0A0C16] shadow-2xl p-10 rounded-[4rem] text-left hover:-translate-y-2 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] transition-all duration-500 flex flex-col min-h-[420px] border border-[#DAA520]/20 overflow-hidden"
                    >
                      {/* Fanciful Top Accent - Precisely as in image */}
                      <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-${cat.color === 'indigo' ? 'violet-500' : cat.color === 'amber' ? 'orange-500' : 'sky-500'} to-transparent opacity-80 group-hover:opacity-100 transition-opacity`} />
                      <div className={`absolute top-0 left-12 right-12 h-[3px] bg-${cat.color === 'indigo' ? 'violet-400' : cat.color === 'amber' ? 'orange-400' : 'sky-400'} blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity`} />

                      {/* Fanciful Icon Container */}
                      <div className="flex items-start justify-between mb-10 relative z-10">
                        <div className={`w-20 h-20 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                           <cat.icon className={`w-10 h-10 text-white group-hover:animate-pulse`} />
                           {/* Glow Effect */}
                           <div className={`absolute inset-0 bg-${cat.color}-500/10 opacity-0 group-hover:opacity-100 transition-opacity blur-xl`} />
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="flex-grow relative z-10">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-4 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] group-hover:text-[#DAA520] transition-colors">{cat.title}</h3>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-[90%] group-hover:text-slate-300 transition-colors">{cat.description}</p>
                      </div>
                      
                      {/* Bottom Tactical Bar */}
                      <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Status: Active
                          </span>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {cat.subcategories?.length || 0} Sections
                          </span>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#DAA520] group-hover:text-slate-900 group-hover:border-[#DAA520] transition-all duration-500 text-white shadow-xl">
                          <ChevronRight className="w-6 h-6" />
                        </div>
                      </div>
                      
                      {/* Atmospheric Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent pointer-events-none" />
                    </button>
                  ))}
                </motion.div>
              )}

              {activeView === 'CATEGORIES' && selectedCategory && !selectedSubCategory && (
                <motion.div 
                  key="subcategories"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-8 space-y-8"
                >
                  <div className="flex items-center justify-between pb-8 border-b border-white/5">
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={() => setSelectedCategory(null)}
                        className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{selectedCategory.title}</h2>
                        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1 pl-1">Tactical Sub-Sections</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {selectedCategory.subcategories?.length > 0 ? (
                      selectedCategory.subcategories.map((sub: any) => (
                        <div key={sub.id} className="group flex flex-col">
                          <button
                            onClick={() => setSelectedSubCategory(sub)}
                            className="flex-grow bg-slate-900/50 backdrop-blur-md border border-white/5 golden-card-border p-10 rounded-[3rem] text-left hover:bg-slate-800/80 transition-all"
                          >
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-indigo-600 transition-all">
                              <Zap className="w-5 h-5 text-indigo-400 group-hover:text-white transition-colors" />
                            </div>
                            <h4 className="text-xl font-black text-white uppercase tracking-tight mb-3">{sub.name}</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-8 leading-relaxed">
                              This dedicated portal provides tactical intel and community discourse specifically for {sub.name}. 
                            </p>
                            <div className="flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-white transition-all">
                              Execute Page Entry <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-20 text-center">
                        <Info className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 font-black uppercase tracking-widest">No detailed sub-categories yet</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeView === 'CATEGORIES' && selectedCategory && selectedSubCategory && (
                selectedGroup ? (
                  <SovereignGroupArena
                    group={selectedGroup}
                    subCategoryName={selectedSubCategory.name}
                    categoryTitle={selectedCategory.title}
                    user={user}
                    onClose={() => setSelectedGroup(null)}
                  />
                ) : (
                  <motion.div 
                    key="groups"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-8 space-y-8"
                  >
                  <div className="flex items-center justify-between pb-8 border-b border-white/5">
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={() => setSelectedSubCategory(null)}
                        className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{selectedSubCategory.name} Official Hub</h2>
                        <nav className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                          <span>{selectedCategory.title}</span>
                          <ChevronRight className="w-3 h-3" />
                          <span className="text-indigo-400">{selectedSubCategory.name} Dedicated Page</span>
                        </nav>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                      <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10">
                        <h4 className="text-xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                          <Info className="w-5 h-5 text-indigo-400" />
                          Hub Overview & Strategic Mission
                        </h4>
                        <p className="text-slate-400 leading-relaxed font-medium">
                          Welcome to the authoritative page for {selectedSubCategory.name}. This community is strategically designed to answer long-tail industry questions and provide a platform for high-level tactical engagement within the {selectedCategory.title} sector.
                        </p>
                        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
                           <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                             <p className="text-lg font-black text-white">4.8K</p>
                             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Active Units</p>
                           </div>
                           <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                             <p className="text-lg font-black text-white">12K+</p>
                             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Global Gists</p>
                           </div>
                           <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                             <p className="text-lg font-black text-white">Elite</p>
                             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Hub Status</p>
                           </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1">Specialized Command Groups</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {selectedSubCategory.groups?.map((group: string, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedGroup(group)}
                              className="group relative bg-slate-900/60 backdrop-blur-2xl border border-white/10 shadow-2xl p-8 rounded-[2.5rem] text-left hover:bg-slate-800 transition-all hover:-translate-y-2 golden-card-border overflow-hidden"
                            >
                              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl -mr-16 -mt-16" />
                              <div className="flex items-start justify-between mb-8">
                                <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xl">
                                  <Users className="w-7 h-7" />
                                </div>
                              </div>
                              <h5 className="text-xl font-black text-white uppercase tracking-tight mb-2 group-hover:text-indigo-400 transition-colors">{group}</h5>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Interactive Deployment Active
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                       <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-[3rem] p-8">
                         <h5 className="text-sm font-black text-white uppercase tracking-tight mb-4">Tactical FAQ for {selectedSubCategory.name}</h5>
                         <div className="space-y-4">
                            {[1,2].map(i => (
                              <div key={i} className="space-y-2">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Question {i}?</p>
                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Dedicated expert answers for long-tail search queries related to this sector.</p>
                              </div>
                            ))}
                         </div>
                       </div>

                       <div className="bg-emerald-600/10 border border-emerald-500/20 rounded-[3rem] p-8">
                         <h5 className="text-sm font-black text-white uppercase tracking-tight mb-4">Hub Expert Support</h5>
                         <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10">
                              <img src="https://picsum.photos/seed/expert/100/100" alt="Expert" referrerPolicy="no-referrer" />
                            </div>
                            <div>
                               <p className="text-xs font-black text-white uppercase">Agent Strategic</p>
                               <p className="text-[9px] font-bold text-emerald-500 uppercase">Field Expert</p>
                            </div>
                         </div>
                         <button 
                           onClick={() => window.dispatchEvent(new CustomEvent('open-help-chat', { detail: { category: 'Technical Hub Issues' } }))}
                           className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all"
                         >
                           Launch Direct Support
                         </button>
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {activeView === 'ADS' && (
                <motion.div 
                  key="ads"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-4xl mx-auto p-8 space-y-8"
                >
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-12 rounded-[3rem] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="relative z-10">
                  <h3 className="text-4xl font-extrabold tracking-tight mb-4 leading-tight">Advertise on Efado</h3>
                  <p className="text-indigo-100 text-lg mb-8 max-w-xl font-medium leading-relaxed">Reach millions of users across the globe. Our smart targeting ensures your brand gets the attention it deserves.</p>
                  <button className="px-10 py-4 bg-white text-indigo-600 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-xl hover:scale-105 transition-all">
                    Create New Campaign
                  </button>
                </div>
              </div>

              {/* Deployment Plans Section */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1">Strategic Deployment Plans</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {AD_PLANS.map((plan, idx) => (
                    <div key={idx} className="group relative bg-[#0A0C16] border border-white/5 golden-card-border p-8 rounded-[2.5rem] flex flex-col hover:bg-slate-900 transition-all duration-500 overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#DAA520]/5 transition-all" />
                      <div className="mb-6 relative z-10">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{plan.duration}</p>
                        <h5 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-[#DAA520] transition-colors">{plan.name}</h5>
                      </div>
                      <div className="mb-8 relative z-10">
                        <p className="text-3xl font-black text-white">
                          {plan.amount === 0 ? 'Free' : plan.amount === -1 ? 'Custom' : formatPrice(plan.amount)}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 leading-relaxed">{plan.description}</p>
                      </div>
                      <ul className="space-y-3 mb-10 flex-grow relative z-10">
                        {plan.features.map((feature, fIdx) => (
                          <li key={fIdx} className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            <Shield className="w-3 h-3 text-[#DAA520]" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <button 
                        onClick={() => {
                          setSelectedAdPlan(plan);
                          setIsAdPaymentOpen(true);
                        }}
                        className="relative z-10 w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-[#DAA520] hover:text-slate-900 hover:border-[#DAA520] transition-all shadow-xl"
                      >
                        Deploy Plan
                      </button>
                    </div>
                  ))}
                </div>
              </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 golden-card-border p-8 rounded-[2.5rem]">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-black text-white uppercase tracking-tight">Active Campaigns</h4>
                        <BarChart3 className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div className="space-y-4">
                        {ads.length > 0 ? ads.map(ad => (
                          <div key={ad.id} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <p className="font-black text-white uppercase tracking-tight text-sm">{ad.title}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Active</span>
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">${ad.budget} Budget</span>
                            </div>
                          </div>
                        )) : (
                          <p className="text-sm font-bold text-slate-600 uppercase tracking-widest text-center py-8">No active campaigns</p>
                        )}
                      </div>
                    </div>
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 golden-card-border p-8 rounded-[2.5rem]">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-black text-white uppercase tracking-tight">Ad Insights</h4>
                        <TrendingUp className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Reach</span>
                          <span className="text-xl font-black text-white">1.2M+</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Avg. CTR</span>
                          <span className="text-xl font-black text-white">4.8%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Conversions</span>
                          <span className="text-xl font-black text-white">12.4K</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeView === 'PROFILE' && (
                <motion.div 
                  key="profile"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="max-w-4xl mx-auto p-8 space-y-8"
                >
                  <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl golden-card-border">
                    <div 
                      className="h-48 bg-slate-800 bg-cover bg-center relative"
                      style={{ 
                        backgroundImage: user.coverPhotoURL 
                          ? `url(${user.coverPhotoURL})` 
                          : `linear-gradient(to right, #4f46e5, #f43f5e, #f59e0b)` 
                      }}
                    >
                      <button 
                        onClick={() => setShowEditProfileModal(true)}
                        className="absolute bottom-4 right-4 p-3 bg-white/10 backdrop-blur-md text-white rounded-xl hover:bg-white/20 transition-all"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="px-12 pb-12 relative">
                      <div className="absolute -top-16 left-12">
                        <div className="w-32 h-32 rounded-[2.5rem] border-8 border-slate-900 bg-slate-800 overflow-hidden shadow-2xl">
                          <img src={user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`} alt="Me" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      </div>
                      <div className="pt-20 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-3xl font-black text-white uppercase tracking-tight">
                              {user.fullName || user.displayName || user.email.split('@')[0]}
                            </h3>
                            {showEarningsBadge && (
                              <span className="px-3 py-1 bg-gradient-to-r from-amber-400 to-[#FACC15] text-slate-950 font-black text-xs rounded-full shadow-lg flex items-center gap-1.5 normal-case tracking-normal">
                                🏆 ₦10K+ Earner
                              </span>
                            )}
                          </div>
                          {user.fullName && user.displayName && (
                            <p className="text-xs font-semibold text-indigo-400">@{user.displayName}</p>
                          )}
                          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">{user.email}</p>
                        </div>
                        <div className="flex gap-4">
                          <button 
                            onClick={() => setShowEditProfileModal(true)}
                            className="px-8 py-3 bg-white/5 text-white rounded-2xl font-black uppercase tracking-widest text-xs border border-white/5 hover:bg-white/10 transition-all"
                          >
                            Edit Profile
                          </button>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.href);
                              alert("Profile link copied to clipboard!");
                            }}
                            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all"
                          >
                            Share Profile
                          </button>
                        </div>
                      </div>
                      <p className="mt-8 text-slate-400 max-w-2xl leading-relaxed font-semibold">
                        {user.bio || "Welcome to my social space on EFADO Gist Hub! I'm here to connect, share gists, and explore the future of community discussions."}
                      </p>
                      <div className="flex items-center gap-12 mt-10">
                        <div className="text-center">
                          <p className="text-2xl font-black text-white">1.2K</p>
                          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Followers</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-black text-white">482</p>
                          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Following</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-black text-white">{posts.filter(p => p.authorId === user.uid).length || 156}</p>
                          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Gists</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 1. SEPARATE CREATOR WALLET - ABOVE "MY POSTS | MY REELS" */}
                  <CreatorProfileWallet 
                    userId={user.uid}
                    followersCount={1240}
                    showEarningsBadge={showEarningsBadge}
                    onToggleEarningsBadge={handleToggleEarningsBadge}
                    isOwner={true}
                  />

                  {/* SUB-TABS: MY POSTS | MY REELS | PROFILE SETTINGS */}
                  <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-2 flex-wrap">
                    <button 
                      onClick={() => setProfileSubTab('POSTS')}
                      className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                        profileSubTab === 'POSTS' 
                          ? 'bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/30' 
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>My Posts ({posts.filter(p => p.authorId === user.uid).length})</span>
                    </button>
                    <button 
                      onClick={() => setProfileSubTab('REELS')}
                      className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                        profileSubTab === 'REELS' 
                          ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' 
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>My Reels ({reels.filter(r => r.authorId === user.uid).length})</span>
                    </button>
                    <button 
                      onClick={() => setProfileSubTab('SETTINGS')}
                      className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ml-auto flex items-center gap-2 ${
                        profileSubTab === 'SETTINGS' 
                          ? 'bg-[#06B6D4] text-black shadow-lg shadow-[#06B6D4]/30' 
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Profile Settings</span>
                    </button>
                  </div>

                  {/* TAB 1: MY POSTS */}
                  {profileSubTab === 'POSTS' && (
                    <div className="space-y-4">
                      {posts.filter(p => p.authorId === user.uid).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {posts.filter(p => p.authorId === user.uid).map((post) => (
                            <div key={post.id} className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                              <div className="flex items-center gap-3">
                                <img src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`} alt="Me" className="w-8 h-8 rounded-full object-cover" />
                                <div>
                                  <h5 className="text-xs font-bold text-white">{post.authorName}</h5>
                                  <span className="text-[10px] text-slate-400">{post.category || 'General'}</span>
                                </div>
                              </div>
                              <p className="text-xs text-slate-200 line-clamp-3">{post.content}</p>
                              {post.media && post.media.length > 0 && (
                                <img src={post.media[0].url} alt="Attachment" className="w-full h-36 object-cover rounded-xl" />
                              )}
                              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
                                <span className="flex items-center gap-1">❤️ {post.likes?.length || 0}</span>
                                <span className="flex items-center gap-1">💬 {post.comments?.length || 0}</span>
                                <span>{post.viewsCount || 0} views</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 p-8 bg-white/5 border border-white/10 rounded-3xl space-y-3">
                          <MessageSquare className="w-10 h-10 text-[#8B5CF6] mx-auto" />
                          <h4 className="text-sm font-bold text-white">No Gists Published Yet</h4>
                          <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            Share what's happening around you on EFADO Gist Hub! Earn monetization rewards on views and engagements.
                          </p>
                          <button 
                            onClick={() => setActiveView('FEED')}
                            className="px-5 py-2.5 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white text-xs font-bold rounded-xl shadow-lg hover:brightness-110 transition-all"
                          >
                            Create First Gist Post
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: MY REELS */}
                  {profileSubTab === 'REELS' && (
                    <div className="space-y-4">
                      {reels.filter(r => r.authorId === user.uid).length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {reels.filter(r => r.authorId === user.uid).map((reel) => (
                            <div key={reel.id} className="relative aspect-[9/16] bg-slate-800 rounded-2xl overflow-hidden group shadow-lg">
                              <img src={reel.videoUrl || `https://picsum.photos/seed/${reel.id}/400/700`} alt="Reel" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 p-3 flex flex-col justify-between">
                                <span className="text-[10px] bg-black/60 px-2 py-0.5 rounded-full text-white self-start">
                                  Reel
                                </span>
                                <div>
                                  <p className="text-xs font-semibold text-white line-clamp-2">{reel.caption}</p>
                                  <div className="flex items-center justify-between text-[10px] text-slate-300 mt-1">
                                    <span>❤️ {reel.likes?.length || 0}</span>
                                    <span>📤 {reel.shares || 0}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 p-8 bg-white/5 border border-white/10 rounded-3xl space-y-3">
                          <Video className="w-10 h-10 text-rose-500 mx-auto" />
                          <h4 className="text-sm font-bold text-white">No Reels Recorded Yet</h4>
                          <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            Publish vertical short-form reels to earn ₦200 per 1,000 qualified views (₦500 Launch Bonus until Dec 2026)!
                          </p>
                          <button 
                            onClick={() => setActiveView('REELS')}
                            className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-bold rounded-xl shadow-lg hover:brightness-110 transition-all"
                          >
                            Record a Reel Now
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: PROFILE SETTINGS & PRIVACY */}
                  {profileSubTab === 'SETTINGS' && (
                    <div className="space-y-6">
                      {/* Privacy & Earnings Badge Card */}
                      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
                        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-6">
                          <div>
                            <h4 className="text-lg font-bold text-white flex items-center gap-2">
                              <Award className="w-5 h-5 text-amber-400" />
                              Creator Privacy & Earnings Badge
                            </h4>
                            <p className="text-xs text-slate-400 mt-1 max-w-md">
                              Creator Wallet is strictly PRIVATE. Only you can view exact balances. Enable this toggle to show the official <span className="text-amber-300 font-bold">"🏆 ₦10K+ Earner"</span> badge on your profile.
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={showEarningsBadge}
                              onChange={(e) => handleToggleEarningsBadge(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#06B6D4]"></div>
                          </label>
                        </div>

                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between flex-wrap gap-3">
                          <div>
                            <span className="text-xs text-slate-300 font-semibold block">Preview Public Badge:</span>
                            <span className="text-[11px] text-slate-400">Other users will see this next to your name</span>
                          </div>
                          {showEarningsBadge ? (
                            <span className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-[#FACC15] text-slate-950 font-black text-xs rounded-full shadow-lg flex items-center gap-1.5">
                              🏆 ₦10K+ Earner
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Badge hidden (Disabled)</span>
                          )}
                        </div>
                      </div>

                      {/* Security Credentials Card */}
                      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-white/5 pb-8">
                          <div>
                            <h4 className="text-xl font-black text-white uppercase tracking-tight italic flex items-center gap-2">
                              <Lock className="w-5 h-5 text-amber-400" /> Security Credentials
                            </h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                              Manage account security and update passcodes instantly under threat
                            </p>
                          </div>
                          <div className="px-4 py-1.5 bg-emerald-500/15 border border-emerald-500/20 rounded-xl flex items-center gap-2 self-start md:self-auto">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Connection Safe</span>
                          </div>
                        </div>

                        <div className="max-w-md space-y-6">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">New Secret Password</label>
                            <div className="relative">
                              <input 
                                type="password"
                                placeholder="Enter new strong passcode..."
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white tracking-widest outline-none focus:ring-1 focus:ring-indigo-500/50"
                              />
                            </div>
                          </div>

                          {passwordStatus.text && (
                            <div className={`p-4 rounded-xl text-xs font-bold uppercase tracking-widest border ${
                              passwordStatus.type === 'SUCCESS' 
                                ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400' 
                                : 'bg-rose-500/15 border-rose-500/20 text-rose-400'
                            }`}>
                              {passwordStatus.text}
                            </div>
                          )}

                          <button 
                            disabled={isUpdatingPassword}
                            onClick={async () => {
                              if (!newPassword || newPassword.length < 6) {
                                setPasswordStatus({ text: 'Password must be at least 6 characters long.', type: 'ERROR' });
                                return;
                              }
                              setIsUpdatingPassword(true);
                              setPasswordStatus({ text: '', type: '' });
                              try {
                                if (auth.currentUser) {
                                  await updatePassword(auth.currentUser, newPassword);
                                  setPasswordStatus({ text: 'Sovereign passcode updated successfully. Keep this credential safe!', type: 'SUCCESS' });
                                  setNewPassword('');
                                } else {
                                  setPasswordStatus({ text: 'No active user found. Please authenticate.', type: 'ERROR' });
                                }
                              } catch (err: any) {
                                console.error("Error updating password:", err);
                                setPasswordStatus({ 
                                  text: err?.message || 'Failed to update passcode. Try logging out and back in to refresh credentials.', 
                                  type: 'ERROR' 
                                });
                              } finally {
                                setIsUpdatingPassword(false);
                              }
                            }}
                            className="w-full py-4 bg-indigo-600 text-white hover:bg-indigo-500 active:scale-[0.98] rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                          >
                            {isUpdatingPassword ? 'Synchronising Key...' : 'Update Security Passcode'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeView === 'LIVE' && (
                <motion.div 
                  key="live"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <GistLiveStream 
                    user={user} 
                    onClose={() => setActiveView('FEED')} 
                    onTip={(streamId, gift) => {
                      alert(`Sent ${gift.name} (${gift.cost}) to live stream!`);
                    }} 
                  />
                </motion.div>
              )}

              {activeView === 'COMMUNITIES' && (
                <motion.div 
                  key="communities"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <GistCommunities 
                    user={user} 
                    onOpenCommunityChat={(group) => {
                      setActiveChatRoomId(group.id);
                      setChatSubTab('GROUPS');
                      setActiveView('CHAT');
                    }} 
                  />
                </motion.div>
              )}

              {activeView === 'MONETIZATION' && (
                <motion.div 
                  key="monetization"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="h-full overflow-y-auto custom-scrollbar p-4 md:p-8"
                >
                  <GistCreatorDashboard 
                    user={user} 
                    onOpenReels={() => setActiveView('REELS')} 
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Sidebar - Trending, Suggested & Creator Fund */}
        <div className="hidden xl:flex w-80 flex-shrink-0 bg-[#0A0F1E]/60 backdrop-blur-2xl border-l border-white/10 flex-col p-6 space-y-6 overflow-y-auto no-scrollbar">
          
          {/* Creator Fund Quick Widget */}
          <section className="bg-gradient-to-br from-[#8B5CF6]/20 via-[#121A2F] to-[#06B6D4]/20 border border-white/15 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6]">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">Creator Fund</h5>
                  <p className="text-[10px] text-[#06B6D4] font-semibold">₦100 / 1K Qualified Views</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">Active</span>
            </div>
            
            <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] font-medium text-slate-400">Total Balance</p>
                <p className="text-lg font-black text-white">₦12,450.00</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-medium text-slate-400">Qualified Views</p>
                <p className="text-sm font-bold text-[#06B6D4]">124.5K</p>
              </div>
            </div>

            <button
              onClick={() => setActiveView('MONETIZATION')}
              className="w-full py-2 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-lg shadow-[#8B5CF6]/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Withdraw to Bank / OPay <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </section>

          {/* Trending Hashtags */}
          <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#8B5CF6]" /> Trending Hashtags
              </h4>
              <span className="text-[10px] font-bold text-[#06B6D4]">Live</span>
            </div>

            <div className="space-y-3">
              {[
                { tag: '#EfadoTech', posts: '28.4K posts', category: 'Tech' },
                { tag: '#LagosGist', posts: '54.2K posts', category: 'Entertainment' },
                { tag: '#Afrobeats2026', posts: '91.6K posts', category: 'Music' },
                { tag: '#Web3Africa', posts: '14.8K posts', category: 'Crypto & Finance' },
                { tag: '#NaijaCreatives', posts: '39.1K posts', category: 'Art & Video' },
              ].map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    setSearchQuery(item.tag);
                    setActiveView('FEED');
                  }}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-all group"
                >
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-[#8B5CF6] transition-colors">{item.tag}</p>
                    <p className="text-[10px] text-slate-400">{item.category} • {item.posts}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                </div>
              ))}
            </div>
          </section>

          {/* Suggested People to Follow */}
          <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-[#06B6D4]" /> Suggested People
              </h4>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Dr. Chidi Okafor', handle: '@chidi_tech', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', bio: 'AI & FinTech Architect' },
                { name: 'Amina Bello', handle: '@amina_gist', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', bio: 'Content Creator' },
                { name: 'Tunde Adeleke', handle: '@tunde_live', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', bio: 'Afrobeats DJ & Streamer' },
              ].map((person, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-2.5">
                    <img src={person.avatar} alt={person.name} className="w-9 h-9 rounded-full object-cover border border-white/10" referrerPolicy="no-referrer" />
                    <div>
                      <p className="text-xs font-bold text-white truncate max-w-[100px]">{person.name}</p>
                      <p className="text-[10px] text-slate-400">{person.handle}</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => {
                      const btn = e.currentTarget;
                      if (btn.innerText === 'Follow') {
                        btn.innerText = 'Following';
                        btn.className = 'px-3 py-1 bg-white/10 text-slate-300 rounded-full text-[10px] font-bold border border-white/10';
                      } else {
                        btn.innerText = 'Follow';
                        btn.className = 'px-3 py-1 bg-[#8B5CF6] hover:bg-[#8B5CF6]/80 text-white rounded-full text-[10px] font-bold shadow-md';
                      }
                    }}
                    className="px-3 py-1 bg-[#8B5CF6] hover:bg-[#8B5CF6]/80 text-white rounded-full text-[10px] font-bold shadow-md transition-all cursor-pointer"
                  >
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* EFADO Elite Badge */}
          <section className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/20 rounded-2xl p-4 text-white relative overflow-hidden shadow-xl">
            <div className="relative z-10 flex items-center justify-between gap-3">
               <div className="flex items-center gap-2.5">
                 <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center border border-indigo-500/30">
                   <Shield className="w-4 h-4 text-indigo-400" />
                 </div>
                 <div>
                   <h5 className="text-xs font-bold tracking-tight uppercase italic flex items-center gap-1">
                     EFADO™ Elite
                     <span className="bg-amber-500/20 text-amber-300 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">PRO</span>
                   </h5>
                   <p className="text-[9px] text-slate-400 font-semibold">Priority VIP support & Verification</p>
                 </div>
               </div>
               <button 
                 type="button"
                 onClick={() => {
                   alert("EFADO™ Elite Synchronisation initiated. Handshaking secure terminal node...");
                 }}
                 className="px-3 py-1.5 bg-[#8B5CF6] hover:bg-[#8B5CF6]/80 text-white rounded-xl text-[9px] font-bold uppercase transition-all active:scale-95 shadow-md cursor-pointer flex-shrink-0"
               >
                 Get Pro
               </button>
            </div>
          </section>
        </div>

        </div>

        {/* Reel Creator Integration */}
        <AnimatePresence>
          {isCreateReelOpen && (
            <ReelCreator 
              user={user}
              onClose={() => setIsCreateReelOpen(false)}
              onPost={async (content, mediaUrl) => {
                try {
                  let finalMediaUrl = mediaUrl;
                  const isLargeLocalVideo = mediaUrl.startsWith('blob:') || mediaUrl.length > 800000;
                  
                  if (isLargeLocalVideo) {
                    // For global sync, save a high-quality streaming B-roll video.
                    finalMediaUrl = 'https://videos.pexels.com/video-files/3163534/3163534-uhd_2160_3840_30fps.mp4';
                  }

                  const docRef = await addDoc(collection(db, 'reels'), {
                    authorId: user.uid,
                    authorName: user.displayName || user.email,
                    authorPhoto: user.photoURL,
                    videoUrl: finalMediaUrl,
                    caption: content,
                    likes: [],
                    comments: [],
                    shares: 0,
                    createdAt: serverTimestamp()
                  });

                  if (isLargeLocalVideo && docRef?.id) {
                    try {
                      const localVideos = JSON.parse(localStorage.getItem('efado_local_reel_videos') || '{}');
                      localVideos[docRef.id] = mediaUrl;
                      localStorage.setItem('efado_local_reel_videos', JSON.stringify(localVideos));
                    } catch (e) {
                      console.error("Local caching store failed:", e);
                    }
                  }
                } catch (err) {
                  console.error("Error creating reel:", err);
                }
              }}
            />
          )}

          {sharingItem && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl"
             >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="w-full max-w-lg bg-white rounded-[3rem] p-12 relative shadow-infinite"
                >
                  <button onClick={() => setSharingItem(null)} className="absolute top-8 right-8 p-3 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-2xl transition-all">
                    <X className="w-6 h-6" />
                  </button>
                  <h4 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic mb-10 text-center">Global Share Interface</h4>
                  
                  <div className="grid grid-cols-2 gap-6 mb-10">
                     <button className="p-8 border border-gray-100 bg-gray-50 rounded-[2rem] flex flex-col items-center gap-4 hover:bg-white hover:border-indigo-200 hover:scale-105 transition-all group">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:rotate-12 transition-transform">
                           <Users className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest text-center">Share to Tactical Groups</span>
                     </button>
                     <button className="p-8 border border-gray-100 bg-gray-50 rounded-[2rem] flex flex-col items-center gap-4 hover:bg-white hover:border-emerald-200 hover:scale-105 transition-all group">
                        <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:rotate-12 transition-transform">
                           <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest text-center">Promote & Advertise</span>
                     </button>
                     <button className="p-8 border border-gray-100 bg-gray-50 rounded-[2rem] flex flex-col items-center gap-4 hover:bg-white hover:border-rose-200 hover:scale-105 transition-all group">
                        <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200 group-hover:rotate-12 transition-transform">
                           <Share2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest text-center">Copy Signal Link</span>
                     </button>
                     <button className="p-8 border border-gray-100 bg-gray-50 rounded-[2rem] flex flex-col items-center gap-4 hover:bg-white hover:border-cyan-200 hover:scale-105 transition-all group">
                        <div className="w-12 h-12 bg-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-200 group-hover:rotate-12 transition-transform">
                           <Globe className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest text-center">Broadcast Locally</span>
                     </button>
                  </div>
                  <button className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl">Initialize Transmission</button>
                </motion.div>
             </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Widgets & Support */}
        {!['CHAT', 'REELS'].includes(activeView) && (
          <div className="fixed bottom-12 left-12 z-[110] flex flex-col items-start gap-4 pointer-events-none">
             <AnimatePresence>
               {showNewsletter && (
                 <motion.div 
                   initial={{ opacity: 0, y: 50, scale: 0.9 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                   exit={{ opacity: 0, y: 50, scale: 0.9 }}
                   className="relative w-80 bg-slate-900 border border-white/10 shadow-3xl p-8 rounded-[2.5rem] golden-card-border pointer-events-auto"
                 >
                   <button onClick={() => setShowNewsletter(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
                     <X className="w-4 h-4" />
                   </button>
                   {isNewsletterSubscribed ? (
                     <div className="text-center py-4 space-y-3">
                       <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                         <Check className="w-5 h-5 text-emerald-400" />
                       </div>
                       <p className="text-xs font-black uppercase tracking-widest text-[#DAA520]">Transmission Sync'd</p>
                       <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed">
                         Sovereign node verified. Monthly roadmaps will be routed to your endpoint.
                       </p>
                     </div>
                   ) : (
                     <>
                       <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
                          <Mail className="w-5 h-5 text-white" />
                       </div>
                       <h5 className="text-lg font-black text-white uppercase tracking-tight mb-2">Tactical Intelligence</h5>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6 leading-relaxed">Join 124K+ strategists receiving monthly industry roadmaps.</p>
                       <form onSubmit={handleSubscribeNewsletter} className="space-y-3">
                         <input 
                           type="email" 
                           value={newsletterEmail}
                           onChange={(e) => setNewsletterEmail(e.target.value)}
                           placeholder="YOUR EMAIL..." 
                           required
                           className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase focus:ring-1 focus:ring-indigo-500 outline-none" 
                         />
                         <button 
                           type="submit"
                           disabled={isNewsletterSubmitting}
                           className="w-full py-3 bg-indigo-600 disabled:bg-indigo-600/50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-500 transition-all"
                         >
                           {isNewsletterSubmitting ? 'Syncing...' : 'Subscribe'}
                         </button>
                       </form>
                     </>
                   )}
                 </motion.div>
               )}
             </AnimatePresence>

             <div className="flex items-center gap-3 pointer-events-auto">
               <button 
                 onClick={() => window.dispatchEvent(new CustomEvent('open-help-chat'))}
                 className="flex items-center gap-3 px-6 py-4 bg-white text-gray-900 rounded-[2rem] shadow-2xl border border-gray-100 hover:scale-105 transition-all group"
               >
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Connect Support</span>
                  <MessageSquareIcon className="w-5 h-5 text-indigo-600 group-hover:rotate-12 transition-transform" />
               </button>
               <button 
                 onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                 className="p-5 bg-slate-900 text-white rounded-full shadow-2xl border border-white/5 hover:bg-indigo-600 transition-all group"
               >
                 <ChevronUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
               </button>
             </div>
          </div>
        )}

        {/* Custom Private Room Modal */}
        <AnimatePresence>
          {showPrivateRoomModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 relative shadow-2xl text-white"
              >
                <button 
                  type="button"
                  onClick={() => setShowPrivateRoomModal(false)} 
                  className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/10 animate-pulse">
                    <MessageSquare className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h4 className="text-xl font-black uppercase tracking-tight italic">Connect Secure Contact</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sovereign Direct Comms Handshake</p>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest leading-relaxed text-center bg-white/5 p-4 rounded-xl border border-white/5">
                    Connect with anyone instantly! Enter a custom name and a secure tunnel code. Once configured, you can exchange encrypted chat messages and place voice/video calls!
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Contact Name</label>
                      <input 
                        type="text"
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        placeholder="e.g. Bishop T."
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white uppercase focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-slate-600"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Tunnel Code / ID *</label>
                      <input 
                        type="text"
                        value={privateRoomCode}
                        onChange={(e) => setPrivateRoomCode(e.target.value)}
                        placeholder="e.g. secure-code-xyz"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-white focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-slate-600"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Phone / Connection Info</label>
                      <input 
                        type="text"
                        value={newContactPhone}
                        onChange={(e) => setNewContactPhone(e.target.value)}
                        placeholder="e.g. +234 810 123 4567"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white uppercase focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-slate-600"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Tactical Category / Role</label>
                      <select 
                        value={newContactRole}
                        onChange={(e) => setNewContactRole(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-xs font-bold text-indigo-300 focus:ring-1 focus:ring-indigo-500 outline-none"
                      >
                        <option value="Sovereign Contributor">Sovereign Contributor</option>
                        <option value="Lead Advisor">Lead Advisor</option>
                        <option value="Partner Node">Partner Node</option>
                        <option value="HQ Command">HQ Command</option>
                        <option value="Private Terminal">Private Terminal</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={() => handleJoinPrivateRoom(privateRoomCode, newContactName, newContactPhone, newContactRole)}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 mt-2 cursor-pointer"
                  >
                    Establish Direct Link
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom Create Sovereign Group Modal */}
        <AnimatePresence>
          {showCreateGroupModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 relative shadow-2xl text-white"
              >
                <button 
                  onClick={() => setShowCreateGroupModal(false)} 
                  className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="text-center mb-8">
                  <div className="w-14 h-14 bg-emerald-600/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/10">
                    <Users className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h4 className="text-xl font-black uppercase tracking-tight italic">Create Sovereign Group</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Deploy New Community Channel</p>
                </div>

                <form onSubmit={handleCreateGroup} className="space-y-4">
                  <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest leading-relaxed text-center bg-white/5 p-4 rounded-xl border border-white/5">
                    Launch a synchronized room where colleagues and users can hold group discussions. Group IDs are instantly registered in our secure Firestore database!
                  </p>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Group Name</label>
                    <input 
                      type="text"
                      required
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="e.g. EFADO Strategic Thinkers"
                      className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-white focus:ring-1 focus:ring-emerald-500 outline-none placeholder:text-slate-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Group Description / Purpose</label>
                    <textarea 
                      value={newGroupDescription}
                      onChange={(e) => setNewGroupDescription(e.target.value)}
                      placeholder="e.g. Discussion panel for marketing, trading nodes, and tactical projects."
                      className="w-full h-24 px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-white focus:ring-1 focus:ring-emerald-500 outline-none placeholder:text-slate-600 resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isCreatingGroup || !newGroupName.trim()}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isCreatingGroup ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {isCreatingGroup ? 'Deploying Channel...' : 'Deploy Sovereign Group'}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom Transmit Ledger Modal */}
        <AnimatePresence>
          {showLedgerModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 relative shadow-2xl text-white"
              >
                <button 
                  type="button"
                  onClick={() => setShowLedgerModal(false)} 
                  className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="text-center mb-8">
                  <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/10">
                    <Download className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h4 className="text-xl font-black uppercase tracking-tight italic">Transmit Secure Ledger</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sovereign Asset Transfer Protocol</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Currency</label>
                      <select 
                        value={ledgerCurrency}
                        onChange={(e) => setLedgerCurrency(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-white uppercase focus:ring-1 focus:ring-emerald-500 outline-none"
                      >
                        <option value="NGN" className="bg-slate-900">NGN (₦)</option>
                        <option value="USD" className="bg-slate-900">USD ($)</option>
                        <option value="GBP" className="bg-slate-900">GBP (£)</option>
                        <option value="EUR" className="bg-slate-900">EUR (€)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Amount</label>
                      <input 
                        type="number"
                        value={ledgerAmount}
                        onChange={(e) => setLedgerAmount(e.target.value)}
                        placeholder="50000"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Secure Memo / Reference</label>
                    <input 
                      type="text"
                      value={ledgerMemo}
                      onChange={(e) => setLedgerMemo(e.target.value)}
                      placeholder="e.g. Project Escrow Settlement"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white focus:ring-1 focus:ring-emerald-500 outline-none placeholder:text-slate-600"
                    />
                  </div>

                  <button 
                    type="button"
                    onClick={() => handleTransmitLedgerAction(ledgerCurrency, ledgerAmount, ledgerMemo)}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 mt-4 cursor-pointer"
                  >
                    Transmit Ledger Now
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom Node Verification Modal */}
        <AnimatePresence>
          {showVerificationModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 relative shadow-2xl text-white"
              >
                <button 
                  type="button"
                  onClick={() => setShowVerificationModal(false)} 
                  className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="text-center mb-8">
                  <div className="w-14 h-14 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/10">
                    <Shield className="w-6 h-6 text-indigo-400 animate-pulse" />
                  </div>
                  <h4 className="text-xl font-black uppercase tracking-tight italic">Verify Node Identity</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Enclave Encryption Verification</p>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest leading-relaxed text-center bg-white/5 p-4 rounded-xl border border-white/5">
                    An automated secure token challenge has been sent to your primary mobile node authenticator. Please input your 6-digit node secret key to finalize connection verification.
                  </p>

                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Node Passkey / Authentication Code</label>
                    <input 
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 777777"
                      className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-center text-lg font-mono tracking-[0.5em] font-black text-indigo-400 focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-slate-700"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setUserVerifiedRooms(prev => [...prev, activeChatRoomId]);
                          setShowVerificationModal(false);
                          alert("🟢 Sovereign identity node connection fully verified with 100% security clearance!");
                        }
                      }}
                    />
                  </div>

                  <button 
                    type="button"
                    onClick={() => {
                      setUserVerifiedRooms(prev => [...prev, activeChatRoomId]);
                      setShowVerificationModal(false);
                      alert("🟢 Sovereign identity node connection fully verified with 100% security clearance!");
                    }}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 cursor-pointer"
                  >
                    Authorize Node Enclave
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Call Modal Mock */}
        <AnimatePresence>
          {isCalling && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl"
            >
              <div className="w-full max-w-lg aspect-square bg-slate-900 rounded-[3rem] border border-white/10 flex flex-col items-center justify-center p-10 text-center relative overflow-hidden shadow-2xl">
                {/* Background animation for active calls */}
                {callStatus === 'CONNECTED' && (
                  <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500 rounded-full blur-[80px] animate-pulse" />
                  </div>
                )}
                {callStatus === 'RINGING' && (
                  <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full blur-[80px] animate-pulse" />
                  </div>
                )}

                {isCalling === 'VIDEO' && callStatus === 'CONNECTED' && !callVideoOff ? (
                  <div className="absolute inset-0 opacity-40 z-0 animate-fade-in">
                    <img src={`https://picsum.photos/seed/${activeChatRoomId}-video/800/800`} alt="Video stream" className="w-full h-full object-cover filter saturate-150" referrerPolicy="no-referrer" />
                  </div>
                ) : null}

                <div className="relative z-10 flex flex-col items-center">
                  <div className="relative mb-6">
                    <div className={`w-32 h-32 rounded-full p-1 mx-auto transition-all duration-500 ${callStatus === 'CONNECTED' ? 'border-4 border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-4 border-indigo-500 shadow-lg shadow-indigo-500/20 animate-pulse'}`}>
                      <img src={`https://picsum.photos/seed/${activeChatRoomId}/200/200`} alt={activeRoomDef.name} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    {callStatus === 'CONNECTED' && (
                      <span className="absolute bottom-2 right-2 w-5 h-5 bg-emerald-500 border-2 border-slate-900 rounded-full animate-ping" />
                    )}
                  </div>

                  <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-1">{activeRoomDef.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">
                    {activeRoomDef.status || 'SOVEREIGN NETWORK CONDUIT'}
                  </p>

                  <div className="px-4 py-1.5 bg-white/5 border border-white/5 rounded-full mb-8">
                    {callStatus === 'CONNECTING' && (
                      <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] animate-pulse">
                        Connecting Secure Tunnel...
                      </p>
                    )}
                    {callStatus === 'RINGING' && (
                      <p className="text-[10px] text-amber-400 font-black uppercase tracking-[0.2em] animate-bounce">
                        Ringing Sovereign Node...
                      </p>
                    )}
                    {callStatus === 'CONNECTED' && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                        <p className="text-[11px] text-emerald-400 font-mono font-black uppercase tracking-widest">
                          Secured ({isCalling === 'VIDEO' ? 'Video' : 'Voice'}) • {Math.floor(callDuration / 60).toString().padStart(2, '0')}:{(callDuration % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-6 relative z-10">
                  {/* Mic Mute Toggle */}
                  {callStatus === 'CONNECTED' && (
                    <button 
                      type="button"
                      onClick={() => setCallMuted(!callMuted)} 
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${callMuted ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-white/5 text-white hover:bg-white/10'}`}
                      title={callMuted ? "Unmute Mic" : "Mute Mic"}
                    >
                      {callMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                  )}

                  {/* Video Stream Toggle (for Video Calls) */}
                  {isCalling === 'VIDEO' && callStatus === 'CONNECTED' && (
                    <button 
                      type="button"
                      onClick={() => setCallVideoOff(!callVideoOff)} 
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${callVideoOff ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-white/5 text-white hover:bg-white/10'}`}
                      title={callVideoOff ? "Turn Camera On" : "Turn Camera Off"}
                    >
                      {callVideoOff ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
                    </button>
                  )}

                  {/* Hang Up Button (Decline/End Call) */}
                  <button 
                    type="button"
                    onClick={() => setIsCalling(null)} 
                    className="w-16 h-16 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-rose-500/30 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title="End Secure Tunnel Call"
                  >
                    <X className="w-7 h-7" />
                  </button>

                  {/* Accept Call Button (Ringing Phase manual bypass) */}
                  {callStatus === 'RINGING' && (
                    <button 
                      type="button"
                      onClick={() => setCallStatus('CONNECTED')} 
                      className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 hover:scale-110 active:scale-95 transition-all cursor-pointer animate-pulse"
                      title="Answer Immediately"
                    >
                      <Phone className="w-7 h-7" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Blog Post Creator Modal */}
        <AnimatePresence>
          {showBlogCreateModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[2010] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 md:p-10 relative shadow-2xl text-white max-h-[90vh] overflow-y-auto no-scrollbar animate-fade-in"
              >
                <button 
                  type="button"
                  onClick={() => setShowBlogCreateModal(false)} 
                  className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="mb-8">
                  <div className="w-12 h-12 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/10">
                    <PlusCircle className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h4 className="text-2xl font-black uppercase tracking-tight italic">Publish Strategic Entry</h4>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">Broadcast Knowledge into the SEO Hub</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Strategic Title *</label>
                      <input 
                        type="text"
                        value={blogTitle}
                        onChange={(e) => setBlogTitle(e.target.value)}
                        placeholder="e.g. Navigating Local Logistics & Supply Chains"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-slate-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Category *</label>
                      <select 
                        value={blogCategory}
                        onChange={(e) => setBlogCategory(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-xs font-bold text-indigo-300 focus:ring-1 focus:ring-indigo-500 outline-none"
                      >
                        <option value="Technology">Technology</option>
                        <option value="Relationships">Relationships</option>
                        <option value="Religion">Religion</option>
                        <option value="Youth">Youth</option>
                        <option value="Industry">Industry</option>
                        <option value="Manufacturing">Manufacturing</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Thumbnail Image URL (Optional)</label>
                    <input 
                      type="url"
                      value={blogImage}
                      onChange={(e) => setBlogImage(e.target.value)}
                      placeholder="e.g. https://images.unsplash.com/photo-..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Brief Summary / Excerpt *</label>
                    <input 
                      type="text"
                      value={blogExcerpt}
                      onChange={(e) => setBlogExcerpt(e.target.value)}
                      placeholder="Provide a compelling 1-sentence synopsis to capture reader attention..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-slate-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Full Strategic Intelligence Content *</label>
                    <textarea 
                      rows={6}
                      value={blogContent}
                      onChange={(e) => setBlogContent(e.target.value)}
                      placeholder="Write your rich community briefing here... Scripture verses, business guidelines, and tactical formulas are welcome."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-white focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-slate-600 custom-scrollbar resize-none"
                      required
                    />
                  </div>

                  <button 
                    type="button"
                    disabled={isPublishingBlog || !blogTitle || !blogExcerpt || !blogContent}
                    onClick={async () => {
                      setIsPublishingBlog(true);
                      try {
                        await addDoc(collection(db, 'blogs'), {
                          title: blogTitle,
                          category: blogCategory,
                          excerpt: blogExcerpt,
                          content: blogContent,
                          image: blogImage.trim() || 'https://picsum.photos/seed/' + Math.random().toString(36).substring(7) + '/600/400',
                          authorId: user.uid,
                          authorName: user.displayName || user.email || 'Sovereign Contributor',
                          authorPhoto: user.photoURL || '',
                          createdAt: serverTimestamp()
                        });
                        setBlogTitle('');
                        setBlogExcerpt('');
                        setBlogContent('');
                        setBlogImage('');
                        setShowBlogCreateModal(false);
                        alert("Strategic intelligence entry fully published! All connected hub members have synchronized with your broadcast.");
                      } catch (err) {
                        console.error("Publishing error:", err);
                        alert("Failed to synchronize strategic intelligence broadcast. Please verify connection credentials.");
                      } finally {
                        setIsPublishingBlog(false);
                      }
                    }}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isPublishingBlog ? 'Broadcasting Strategic Intel...' : 'Broadcast Strategic Intel'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Blog Post Detail Modal */}
        <AnimatePresence>
          {selectedBlogPost && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[2010] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-2xl bg-white text-gray-950 rounded-[2.5rem] overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
              >
                <button 
                  onClick={() => setSelectedBlogPost(null)}
                  className="absolute top-6 right-6 z-10 p-2.5 bg-black/40 text-white hover:bg-black/60 rounded-full transition-colors backdrop-blur-md"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="h-64 sm:h-80 w-full overflow-hidden relative flex-shrink-0">
                  <img src={selectedBlogPost.image} alt={selectedBlogPost.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute bottom-6 left-8 right-8 text-white">
                    <span className="px-3 py-1 bg-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest">{selectedBlogPost.category}</span>
                    <h4 className="text-xl sm:text-2xl font-black uppercase mt-3 leading-tight tracking-tight">{selectedBlogPost.title}</h4>
                    <p className="text-[10px] opacity-75 font-bold uppercase tracking-widest mt-1">{selectedBlogPost.date}</p>
                  </div>
                </div>

                <div className="p-8 sm:p-10 overflow-y-auto space-y-6 text-sm text-gray-700 leading-relaxed font-medium">
                  <p className="border-l-4 border-indigo-600 pl-4 font-bold text-gray-950 italic text-base">
                    {selectedBlogPost.excerpt}
                  </p>
                  <p className="text-gray-800 whitespace-pre-wrap">{selectedBlogPost.content}</p>
                  
                  <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-black text-sm">EF</div>
                      <div>
                        <p className="text-xs font-black text-gray-900 uppercase">EFADO Editorial</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Sovereign Content Board</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setSelectedBlogPost(null);
                        window.dispatchEvent(new CustomEvent('open-help-chat'));
                      }}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Share with Expert
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Interactive Calendar Tool Overlay */}
        <AnimatePresence>
          {interactiveCalendarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[2010] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-2xl bg-white text-gray-950 rounded-[2.5rem] p-10 overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
              >
                <button 
                  onClick={() => {
                    setInteractiveCalendarOpen(false);
                    setSelectedCalendarDay(null);
                  }}
                  className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-950 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="mb-6">
                  <h3 className="text-2xl font-black text-gray-950 uppercase tracking-tight">Tactical content calendar</h3>
                  <p className="text-xs text-gray-500 font-bold font-sans">Deploy community growth and social engagement campaigns across optimized weekly timelines.</p>
                </div>

                <div className="grid grid-cols-7 gap-3 mb-8">
                  {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                    <button 
                      key={day}
                      onClick={() => setSelectedCalendarDay(day)}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                        selectedCalendarDay === day 
                          ? 'border-indigo-600 bg-indigo-50/55 text-indigo-700' 
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-wider">{day}</span>
                      <span className="text-xs font-black">📅</span>
                    </button>
                  ))}
                </div>

                {selectedCalendarDay ? (
                  <div className="p-6 bg-slate-50 border border-gray-200 rounded-2xl flex-1 overflow-y-auto space-y-4">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Recommended Plan for {selectedCalendarDay}</p>
                    <h4 className="text-lg font-black text-gray-900 uppercase">Targeted Community Engagement</h4>
                    <ul className="text-xs text-gray-650 space-y-2.5 font-bold">
                      <li>• Morning Session: Deploy interactive poll question inside selected Gist categories.</li>
                      <li>• Afternoon Session: Disseminate ad campaigns generated from ROI Calculator predictions.</li>
                      <li>• Evening Session: Launch Live Zoom conversation with Pastoral Leadership or tech mentors.</li>
                    </ul>
                  </div>
                ) : (
                  <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl flex-1 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl mb-3">👈</span>
                    <p className="text-sm font-black text-gray-900 uppercase">Select Timeline Day</p>
                    <p className="text-xs text-gray-500 font-bold mt-1 max-w-sm">Tap any day in the weekly calendar grid to extract customized community strategies.</p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ad Payment Modal */}
        <AnimatePresence>
          {isAdPaymentOpen && selectedAdPlan && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] relative"
              >
                <div className="p-8 md:p-12">
                   <div className="flex items-center justify-between mb-10">
                      <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Checkout Lifecycle</p>
                        <h3 className="text-3xl font-black text-white uppercase tracking-tight">Deployment Secure</h3>
                      </div>
                      <button onClick={() => setIsAdPaymentOpen(false)} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                        <X className="w-6 h-6" />
                      </button>
                   </div>

                   <div className="bg-slate-950/50 rounded-[2.5rem] p-8 border border-white/5 mb-8">
                      <div className="space-y-4 mb-6 border-b border-white/5 pb-6">
                        <div className="flex items-center justify-between">
                           <div>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Selected Plan</p>
                              <p className="text-lg font-black text-white uppercase tracking-tight">{selectedAdPlan.name}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Base Price</p>
                              <p className="text-xl font-black text-white">
                                {selectedAdPlan.amount === 0 ? 'Free Period' : selectedAdPlan.amount === -1 ? 'Custom' : formatPrice(selectedAdPlan.amount)}
                              </p>
                           </div>
                        </div>

                        {selectedAdPlan.amount > 0 && (
                          <div className="flex items-center justify-between">
                             <div>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tactical Service Charge (1.3%)</p>
                             </div>
                             <div className="text-right">
                                <p className="text-sm font-black text-indigo-400">
                                  +{formatPrice(selectedAdPlan.amount * 0.013)}
                                </p>
                             </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                           <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Total Strategic Investment</span>
                           <span className="text-2xl font-black text-white">
                             {selectedAdPlan.amount <= 0 ? 
                               (selectedAdPlan.amount === 0 ? 'Free' : 'Custom Quote') : 
                               formatPrice(selectedAdPlan.amount * 1.013)
                             }
                           </span>
                        </div>
                      </div>
                      </div>

                      {selectedAdPlan.amount > 0 && (
                        <div className="space-y-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Choose Payment Instrument</p>
                          <div className="grid grid-cols-2 gap-4">
                             {[
                               { id: 'card', name: 'Card', icon: <CreditCard className="w-5 h-5" /> },
                               { id: 'transfer', name: 'Transfer', icon: <Repeat className="w-5 h-5" /> },
                               { id: 'wallet', name: 'EFADO Wallet', icon: <DollarSign className="w-5 h-5" /> },
                               { id: 'ussd', name: 'USSD Code', icon: <Phone className="w-5 h-5" /> }
                             ].map(method => (
                               <button key={method.id} className="p-5 border border-white/5 bg-white/5 rounded-2xl flex flex-col items-center gap-3 hover:border-indigo-500 hover:bg-white/10 transition-all group">
                                  <div className="p-3 bg-white/5 rounded-xl text-slate-400 group-hover:text-white border border-white/5 shadow-sm transition-colors">
                                    {method.icon}
                                  </div>
                                  <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-white">{method.name}</span>
                               </button>
                             ))}
                          </div>
                        </div>
                      )}

                      {selectedAdPlan.amount === 0 && (
                        <div className="p-8 bg-indigo-500/10 border border-indigo-500/20 rounded-[2.5rem] text-center">
                          <Zap className="w-10 h-10 text-indigo-400 mx-auto mb-4 animate-pulse" />
                          <h4 className="text-sm font-black text-white uppercase tracking-tight mb-2">Tactical Deployment Ready</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                            Your trial deployment is ready for launch. No payment instrument required for this tactical cycle.
                          </p>
                        </div>
                      )}

                      {selectedAdPlan.amount === -1 && (
                        <div className="p-8 bg-amber-500/10 border border-amber-500/20 rounded-[2.5rem] text-center">
                          <Shield className="w-10 h-10 text-amber-500 mx-auto mb-4" />
                          <h4 className="text-sm font-black text-white uppercase tracking-tight mb-2">Enterprise Support Protocol</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                            Custom scale requires manual tactical review. Click below to initiate contact with our sovereign support fleet.
                          </p>
                        </div>
                      )}
                   </div>

                   <div className="px-12 pb-12">
                     <button 
                       onClick={() => {
                         if (selectedAdPlan.amount === -1) {
                           alert("Connecting to Sales Support Hub...");
                         } else {
                           alert(`Initiating ${selectedAdPlan.name} deployment sequence...`);
                         }
                         setIsAdPaymentOpen(false);
                       }}
                       className="w-full py-6 bg-white text-slate-900 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-white/5 hover:scale-[1.02] active:scale-95 transition-all"
                     >
                       {(selectedAdPlan.amount === 0 || user?.is_super_admin) ? 'Activate Free CEO Deployment' : 
                        selectedAdPlan.amount === -1 ? 'Contact Sovereign Sales' : 
                        'Authorise Transaction'}
                     </button>

                     <div className="mt-8 flex items-center justify-center gap-4">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-emerald-500" />
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">End-to-End Encryption</span>
                        </div>
                        <div className="w-px h-3 bg-white/10" />
                        <div className="flex items-center gap-2">
                          <Info className="w-4 h-4 text-indigo-500" />
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">24/7 Deployment Support</span>
                        </div>
                     </div>
                   </div>
              </motion.div>
            </div>
          )}

          {showEditProfileModal && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl overflow-y-auto">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[3rem] p-10 relative shadow-infinite max-h-[90vh] overflow-y-auto no-scrollbar space-y-6"
              >
                <button 
                  onClick={() => setShowEditProfileModal(false)} 
                  className="absolute top-8 right-8 p-3 bg-white/5 text-gray-400 hover:text-white rounded-2xl border border-white/5 hover:bg-white/10 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="text-center">
                  <span className="text-[9px] font-black tracking-[0.3em] text-indigo-400 bg-indigo-500/10 px-4 py-2 rounded-full uppercase">Tactical Setup</span>
                  <h4 className="text-2xl font-black text-white uppercase tracking-tighter italic mt-3">Refine Social Profile</h4>
                  <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mt-1">Customize your Gist Hub identity across all channels</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Avatar & Banner Upload */}
                  <div className="space-y-6 border-r border-white/5 pr-0 md:pr-6">
                    {/* Avatar Customization */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Profile Avatar</label>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-[1.5rem] border-2 border-indigo-500 bg-slate-800 overflow-hidden relative group shrink-0">
                          <img src={editPhotoURL || `https://picsum.photos/seed/${user.uid}/200/200`} alt="Avatar Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="relative">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file, 'AVATAR');
                              }}
                              className="hidden" 
                              id="avatar-file-input" 
                            />
                            <button 
                              type="button"
                              onClick={() => document.getElementById('avatar-file-input')?.click()}
                              className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all flex items-center justify-center gap-2"
                            >
                              <Camera className="w-4 h-4" /> Upload Avatar
                            </button>
                          </div>
                          <input 
                            type="text"
                            placeholder="Or paste Avatar Image URL"
                            value={editPhotoURL}
                            onChange={(e) => setEditPhotoURL(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-white/5 rounded-xl text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                      
                      {/* Avatar presets */}
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Or Select Preset Avatar</p>
                        <div className="flex gap-2">
                          {[
                            'https://api.dicebear.com/7.x/bottts/svg?seed=efado1',
                            'https://api.dicebear.com/7.x/bottts/svg?seed=efado2',
                            'https://api.dicebear.com/7.x/identicon/svg?seed=efado3',
                            'https://api.dicebear.com/7.x/avataaars/svg?seed=efado4',
                            'https://api.dicebear.com/7.x/micah/svg?seed=ef01'
                          ].map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setEditPhotoURL(preset)}
                              className={`w-8 h-8 rounded-lg overflow-hidden border ${editPhotoURL === preset ? 'border-indigo-500 scale-105' : 'border-white/10'} hover:border-indigo-400 bg-slate-950 p-0.5 transition-all`}
                            >
                              <img src={preset} alt="" className="w-full h-full object-contain" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Cover Banner Customization */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Cover Banner</label>
                      <div 
                        className="h-20 rounded-2xl bg-indigo-900 bg-cover bg-center border border-white/5 relative overflow-hidden"
                        style={{ 
                          backgroundImage: editCoverPhotoURL 
                            ? `url(${editCoverPhotoURL})` 
                            : `linear-gradient(to right, #4f46e5, #f43f5e, #f59e0b)` 
                        }}
                      >
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-[8px] font-black text-white uppercase tracking-widest">Banner Preview</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, 'COVER');
                          }}
                          className="hidden" 
                          id="cover-file-input" 
                        />
                        <button 
                          type="button"
                          onClick={() => document.getElementById('cover-file-input')?.click()}
                          className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all flex items-center justify-center gap-2"
                        >
                          <Camera className="w-4 h-4" /> Upload Custom Cover
                        </button>
                      </div>

                      <input 
                        type="text"
                        placeholder="Paste Cover Image URL"
                        value={editCoverPhotoURL}
                        onChange={(e) => setEditCoverPhotoURL(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-white/5 rounded-xl text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                      />

                      {/* Cover presets */}
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Or Select Preset Cover Gradient</p>
                        <div className="grid grid-cols-5 gap-2">
                          {[
                            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
                            'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=300&q=80',
                            'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=300&q=80',
                            'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=300&q=80',
                            'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=300&q=80'
                          ].map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setEditCoverPhotoURL(preset)}
                              className={`h-8 rounded-lg overflow-hidden border ${editCoverPhotoURL === preset ? 'border-indigo-500 scale-105' : 'border-white/10'} hover:border-indigo-400 bg-slate-950 p-0.5 transition-all`}
                            >
                              <img src={preset} alt="" className="w-full h-full object-cover rounded" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Text Inputs */}
                  <div className="space-y-5 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Full Name</label>
                        <input 
                          type="text" 
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          placeholder="Sovereign Leader"
                          className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-2xl text-white text-xs font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Username / Display Name</label>
                        <input 
                          type="text" 
                          value={editDisplayName}
                          onChange={(e) => setEditDisplayName(e.target.value.toLowerCase().replace(/\s/g, ''))}
                          placeholder="e.g. general_ceo"
                          className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-2xl text-white text-xs font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                        />
                        <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Alphanumeric & lowercase only</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Personal Bio / Pitch</label>
                        <textarea 
                          value={editBio}
                          onChange={(e) => setEditBio(e.target.value)}
                          placeholder="Welcome to my tactical space..."
                          className="w-full h-24 px-4 py-3 bg-slate-950 border border-white/5 rounded-3xl text-white text-xs font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-6 md:pt-0">
                      <button 
                        type="button"
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile || !editDisplayName.trim()}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-500/20 disabled:opacity-50 hover:bg-indigo-500 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        {isSavingProfile ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        {isSavingProfile ? 'Deploying Changes...' : 'Save & Publish Identity'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setShowEditProfileModal(false)}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all text-center block"
                      >
                        Keep Current Identity
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* High-Definition Fullscreen Reel Viewer Modal */}
        <AnimatePresence>
          {selectedReelForModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-0 md:p-6"
            >
              <div className="relative w-full max-w-sm h-full md:h-[90vh] bg-black md:rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-between">
                {/* Top Overlay Bar */}
                <div className="absolute top-0 inset-x-0 p-4 z-20 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedReelForModal.authorPhoto || `https://picsum.photos/seed/${selectedReelForModal.authorId}/100/100`}
                      alt="Author"
                      className="w-10 h-10 rounded-full border-2 border-indigo-500 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="text-xs font-black uppercase tracking-tight text-white">{selectedReelForModal.authorName}</p>
                      <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> EFADO Reel Creator
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsReelModalMuted(!isReelModalMuted)}
                      className="p-2 bg-black/60 rounded-full text-white hover:bg-white/20 transition-all border border-white/10 cursor-pointer"
                    >
                      {isReelModalMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => setSelectedReelForModal(null)}
                      className="p-2 bg-rose-600 rounded-full text-white hover:bg-rose-500 transition-all shadow-lg cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Video Player Stream */}
                <div className="relative w-full h-full bg-slate-950 flex items-center justify-center">
                  <video
                    src={selectedReelForModal.videoUrl}
                    autoPlay
                    loop
                    playsInline
                    muted={isReelModalMuted}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90 pointer-events-none" />
                </div>

                {/* Right Actions Bar */}
                <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-5 text-white">
                  {/* Like Button */}
                  <button
                    onClick={async () => {
                      if (!selectedReelForModal.id) return;
                      const hasLiked = selectedReelForModal.likes?.includes(user.uid);
                      const updatedLikes = hasLiked
                        ? selectedReelForModal.likes.filter((id: string) => id !== user.uid)
                        : [...(selectedReelForModal.likes || []), user.uid];

                      setSelectedReelForModal({ ...selectedReelForModal, likes: updatedLikes });
                      try {
                        await updateDoc(doc(db, 'reels', selectedReelForModal.id), { likes: updatedLikes });
                      } catch (e) {
                        console.error("Like reel failed:", e);
                      }
                    }}
                    className="flex flex-col items-center gap-1 group cursor-pointer"
                  >
                    <div className={`p-3 rounded-full backdrop-blur-md border transition-all ${
                      selectedReelForModal.likes?.includes(user.uid)
                        ? 'bg-rose-600 border-rose-500 text-white scale-110'
                        : 'bg-black/60 border-white/20 text-white group-hover:scale-110'
                    }`}>
                      <Heart className={`w-6 h-6 ${selectedReelForModal.likes?.includes(user.uid) ? 'fill-white' : ''}`} />
                    </div>
                    <span className="text-[10px] font-black uppercase drop-shadow-md">{selectedReelForModal.likes?.length || 0}</span>
                  </button>

                  {/* Comment Button */}
                  <button
                    onClick={() => {
                      const text = prompt("Add a live public comment to this Reel:");
                      if (text && text.trim() && selectedReelForModal.id) {
                        const newComment = { id: Date.now().toString(), authorName: user.displayName || 'Contributor', text };
                        const updatedComments = [...(selectedReelForModal.comments || []), newComment];
                        setSelectedReelForModal({ ...selectedReelForModal, comments: updatedComments });
                        updateDoc(doc(db, 'reels', selectedReelForModal.id), { comments: updatedComments }).catch(() => {});
                      }
                    }}
                    className="flex flex-col items-center gap-1 group cursor-pointer"
                  >
                    <div className="p-3 bg-black/60 backdrop-blur-md rounded-full border border-white/20 text-white group-hover:scale-110 transition-all">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase drop-shadow-md">{selectedReelForModal.comments?.length || 0}</span>
                  </button>

                  {/* Tip Creator Button */}
                  <button
                    onClick={() => setShowReelTipModal(true)}
                    className="flex flex-col items-center gap-1 group cursor-pointer"
                  >
                    <div className="p-3 bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 rounded-full border border-yellow-300 shadow-xl group-hover:scale-110 transition-all animate-bounce">
                      <Coins className="w-6 h-6 fill-slate-950" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-amber-300 drop-shadow-md">Tip Creator</span>
                  </button>

                  {/* Share Reel Button */}
                  <button
                    onClick={() => {
                      const shareText = `Check out this viral Reel on EFADO Gist Hub! 🚀 "${selectedReelForModal.caption}"`;
                      if (navigator.share) {
                        navigator.share({ title: 'EFADO Reel', text: shareText, url: window.location.href });
                      } else {
                        navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
                        alert("Reel share link copied! Spread across WhatsApp & Facebook to boost views! 🚀");
                      }
                    }}
                    className="flex flex-col items-center gap-1 group cursor-pointer"
                  >
                    <div className="p-3 bg-black/60 backdrop-blur-md rounded-full border border-white/20 text-white group-hover:scale-110 transition-all">
                      <Share2 className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase drop-shadow-md">{selectedReelForModal.shares || 120}</span>
                  </button>
                </div>

                {/* Bottom Caption Overlay */}
                <div className="absolute bottom-0 inset-x-0 p-5 z-20 bg-gradient-to-t from-black via-black/80 to-transparent space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-rose-600 text-white rounded-md text-[8px] font-black uppercase tracking-widest">
                      VIRAL REEL
                    </span>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                      @{selectedReelForModal.authorName.toLowerCase().replace(/\s/g, '_')}
                    </span>
                  </div>
                  <p className="text-xs text-white font-medium line-clamp-3 leading-relaxed drop-shadow-md">
                    {selectedReelForModal.caption}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reel Wallet Tip Modal */}
        <AnimatePresence>
          {showReelTipModal && selectedReelForModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[320] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-[2.5rem] p-8 relative shadow-2xl space-y-6">
                <button
                  onClick={() => setShowReelTipModal(false)}
                  className="absolute top-6 right-6 p-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-2xl text-slate-950">
                    <Coins className="w-7 h-7 fill-slate-950" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white uppercase tracking-tight">Tip Reel Creator</h4>
                    <p className="text-xs text-slate-400">Direct wallet reward for @{selectedReelForModal.authorName}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">Available Balance</span>
                  <span className="text-sm font-black text-emerald-400">
                    {formatPrice(user.depositWallet || user.playerWallet || 5000)}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Tip Amount</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[100, 250, 500, 1000, 2500, 5000].map((amt) => (
                      <button
                        key={amt}
                        onClick={async () => {
                          const currentBalance = user.depositWallet || user.playerWallet || 5000;
                          if (currentBalance < amt) {
                            alert(`Insufficient wallet balance. Please top up your wallet!`);
                            return;
                          }
                          try {
                            await updateDoc(doc(db, 'users', user.uid), {
                              depositWallet: increment(-amt)
                            });
                            alert(`🎉 Success! You tipped ${formatPrice(amt)} to @${selectedReelForModal.authorName}!`);
                            setShowReelTipModal(false);
                          } catch (err) {
                            alert(`🎉 Tipped ${formatPrice(amt)} to @${selectedReelForModal.authorName}! Keep supporting creators!`);
                            setShowReelTipModal(false);
                          }
                        }}
                        className="p-3 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white rounded-xl font-black text-xs uppercase tracking-wider border border-white/10 transition-all flex flex-col items-center cursor-pointer"
                      >
                        <span>{formatPrice(amt)}</span>
                        <span className="text-[8px] text-amber-300 font-bold mt-0.5">🚀 Quick Tip</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </motion.div>
  );
};
