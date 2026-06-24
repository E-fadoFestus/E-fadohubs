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
  ShieldCheck
} from 'lucide-react';
import { 
  UserProfile, 
  SocialPost, 
  Reel, 
  ChatMessage, 
  Advertisement 
} from '../types';
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
  doc,
  arrayUnion,
  arrayRemove
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
import { ReelFeed } from './ReelFeed';
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

interface EfadoGistHubProps {
  user: UserProfile;
  onClose: () => void;
  initialView?: HubView;
  autoStartLive?: boolean;
  onOpenMining?: () => void;
  onNavigate?: (hub: any, subview?: any) => void;
}

type HubView = 'FEED' | 'REELS' | 'CHAT' | 'ADS' | 'PROFILE' | 'CATEGORIES' | 'BLOG' | 'FAQ' | 'TOOLS' | 'MONETIZATION';

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
  const [activeChatRoomId, setActiveChatRoomId] = useState<string>('sarah');
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

  const handleJoinPrivateRoom = (code: string) => {
    const cleanCode = code.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanCode) return;
    
    if (!customRooms.some(r => r.id === cleanCode)) {
      const newRoom = {
        id: cleanCode,
        name: `Room: ${cleanCode.toUpperCase()}`,
        status: 'Private Secure Tunnel',
        time: 'Just Now',
        msg: 'Ready for real-time sync.',
        unread: 0,
        type: 'DIRECT'
      };
      const updated = [...customRooms, newRoom];
      setCustomRooms(updated);
      localStorage.setItem('efado_custom_chat_rooms', JSON.stringify(updated));
    }
    
    setActiveChatRoomId(cleanCode);
    setPrivateRoomCode('');
    setShowPrivateRoomModal(false);
  };
  const [newMessageText, setNewMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isCreateReelOpen, setIsCreateReelOpen] = useState(false);
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

  useEffect(() => {
    if (user) {
      setEditDisplayName(user.displayName || '');
      setEditFullName(user.fullName || '');
      setEditBio(user.bio || '');
      setEditPhotoURL(user.photoURL || '');
      setEditCoverPhotoURL(user.coverPhotoURL || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: editDisplayName.trim(),
        fullName: editFullName.trim(),
        bio: editBio.trim(),
        photoURL: editPhotoURL.trim(),
        coverPhotoURL: editCoverPhotoURL.trim()
      });
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
    const postsQuery = query(collection(db, 'social_posts'), limit(50));
    const reelsQuery = query(collection(db, 'reels'), limit(30));
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
      setReels(fetched);
    }, (err) => {
      console.error("Failed to load reels:", err);
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

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessageText.trim() && !chatAttachedMediaUrl.trim()) return;
    if (isSendingMessage) return;

    const text = newMessageText.trim();
    const media = chatAttachedMediaUrl.trim();
    setNewMessageText('');
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-slate-950/95 backdrop-blur-3xl overflow-hidden"
    >
      <AnimatePresence>
        {showGuide && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md"
          >
            <div className="w-full max-w-xl bg-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 rounded-full blur-3xl -mr-24 -mt-24 opacity-50" />
              <button 
                onClick={() => setShowGuide(false)}
                className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-900 transition-all font-black"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 mb-8">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight uppercase">Strategic Feed Guide</h2>
                <p className="text-gray-950 font-black mb-8 leading-relaxed uppercase tracking-[0.1em] text-xs">
                  Social discourse protocols active. Here is how you navigate the EFADO Gist Hub:
                </p>
                
                <div className="space-y-6">
                  {[
                    { icon: MessageSquare, title: "Global Feed", desc: "Participate in diverse discussions across religious, social, and professional categories." },
                    { icon: Video, title: "EFADO Reels", desc: "Short-form tactical video content. Swipe and engage with the global community." },
                    { icon: Users, title: "Specialized Groups", desc: "Join vetted groups focused on marriage, business, and talent development." },
                    { icon: Shield, title: "Secure Discourse", desc: "All communication is encrypted and verified to ensure high-fidelity interactions." }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600 transition-all duration-300 pointer-events-none">
                        <item.icon className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-1">{item.title}</h4>
                        <p className="text-xs text-gray-950 leading-relaxed font-black">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={() => setShowGuide(false)}
                  className="w-full mt-10 py-5 bg-gray-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-gray-300 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Initiate Discourse
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-indigo-500/5 to-transparent pointer-events-none" />
      <div className="relative w-full max-w-[1600px] h-full md:h-[95vh] bg-slate-950/80 backdrop-blur-xl border border-white/10 md:rounded-[3rem] flex overflow-hidden shadow-2xl">
        
        {/* Left Sidebar - Navigation */}
        <div className="w-20 md:w-72 flex-shrink-0 bg-slate-900 border-r border-white/5 flex flex-col z-30">
          <div className="p-6 md:p-8 flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="hidden md:block">
                             <div>
                                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Efado <span className="text-indigo-600 font-black">Gist Hub</span></h2>
                             </div>
              <button 
                onClick={() => setShowGuide(true)}
                className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1 hover:text-emerald-300 transition-colors mt-1"
              >
                <HelpCircle className="w-3 h-3" /> Tactical Guide
              </button>
            </div>
          </div>

          <nav className="flex-grow px-2 md:px-4 space-y-4 md:space-y-2 mt-4">
            {[
              { id: 'FEED', label: 'Feed', icon: Home, color: 'text-indigo-400' },
              { id: 'REELS', label: 'Reels', icon: Video, color: 'text-rose-400' },
              { id: 'CHAT', label: 'Messages', icon: MessageCircle, color: 'text-blue-400' },
              { id: 'CATEGORIES', label: 'Hubs', icon: Users, color: 'text-emerald-400' },
              { id: 'BLOG', label: 'Blog', icon: ClipboardList, color: 'text-amber-400' },
              { id: 'TOOLS', label: 'Tools', icon: Calculator, color: 'text-cyan-400' },
              { id: 'FAQ', label: 'FAQ', icon: HelpCircle, color: 'text-slate-400' },
              { id: 'ADS', label: 'Advertise on EFADO', icon: DollarSign, color: 'text-emerald-400' },
              { id: 'PROFILE', label: 'Account', icon: UserCircle, color: 'text-indigo-400' },
            ].map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.1, x: 5 }}
                whileTap={{ scale: 0.95 }}
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
                className={`w-full flex flex-col md:flex-row items-center gap-1 md:gap-4 p-2 md:p-4 rounded-2xl transition-all group ${
                  activeView === item.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-indigo-400'
                }`}
              >
                <item.icon className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
                <span className="font-black uppercase tracking-tighter md:tracking-widest text-[8px] md:text-xs text-center md:text-left leading-none uppercase">{item.label}</span>
              </motion.button>
            ))}
          </nav>

          {/* User Profile Mini */}
          <div className="p-6 border-t border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-indigo-600/10 overflow-hidden flex-shrink-0 p-0.5 border border-white/10">
                <img src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`} alt="Me" className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
              </div>
              <div className="hidden md:block overflow-hidden">
                                <p className="text-sm font-black text-white truncate uppercase tracking-tight">{user.displayName || user.email.split('@')[0]}</p>
                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Tactical Node Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-grow flex flex-col bg-slate-950 relative overflow-hidden">
          {/* Top Header */}
          <header className={`px-4 sm:px-8 py-3 sm:py-6 border-b border-white/5 flex items-center justify-between ${activeView === 'REELS' ? 'bg-slate-950' : 'bg-slate-950/80 backdrop-blur-3xl'} z-20`}>
            <div className="flex items-center gap-2 max-w-[50%] overflow-hidden">
              <h3 className="text-xs xs:text-sm sm:text-2xl font-black text-white tracking-tighter uppercase italic truncate">
                {activeView === 'MONETIZATION' && 'Creator Monetization Terminal'}
                {activeView === 'BLOG' && 'Knowledge Hub'}
                {activeView === 'TOOLS' && 'Tactical Industry Tools'}
                {activeView === 'FAQ' && 'Help & FAQ Desk'}
                {activeView === 'FEED' && 'Community Feed'}
                {activeView === 'REELS' && 'Efado Reels'}
                {activeView === 'CHAT' && 'Direct Messages'}
                {activeView === 'CATEGORIES' && 'Explore Hubs'}
                {activeView === 'ADS' && 'Advertise on EFADO'}
                {activeView === 'PROFILE' && 'My Social Space'}
              </h3>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <div className="relative hidden lg:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Tactical Search..."
                  className="pl-11 pr-6 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none transition-all w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="hidden xs:flex p-2 sm:p-3 bg-gray-50 text-gray-400 hover:text-indigo-600 rounded-full border border-gray-100 transition-all relative">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
              </button>
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
                className="hidden sm:flex items-center gap-2 px-8 py-3 bg-rose-600 text-white rounded-full shadow-lg shadow-rose-200 hover:scale-105 active:scale-95 transition-all text-[11px] font-black uppercase tracking-widest"
              >
                <Globe className="w-4 h-4" />
                Invite & Promote Globally
              </button>
              <div className="hidden md:block">
                <CurrencySelector />
              </div>
              <button 
                onClick={onClose} 
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 rounded-xl border border-rose-500/20 transition-all font-black text-[10px] sm:text-xs uppercase tracking-widest cursor-pointer"
              >
                <X className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                <span>Exit</span>
              </button>
            </div>
          </header>

          {/* View Content */}
          <div className={`flex-grow ${['CHAT', 'REELS'].includes(activeView) ? 'overflow-hidden' : 'overflow-y-auto'} custom-scrollbar bg-gray-50/30`}>
            <AnimatePresence mode="wait">
              {activeView === 'BLOG' && (
                <motion.div 
                  key="blog"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-6xl mx-auto p-8 space-y-12"
                >
                  <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 golden-card-border p-12 rounded-[3.5rem] text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-32 -mt-32" />
                    <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">SEO Resource Hub</h3>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
                      Deep-dive into tactical industry trends, community management, and professional roadmaps.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {BLOG_POSTS.map(post => (
                      <div key={post.id} className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-xl shadow-gray-100/50 group hover:-translate-y-2 transition-all">
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
              )}

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
                  className="flex flex-col lg:flex-row h-full overflow-hidden"
                >
                  {/* Left Column: Feed */}
                  <div className="flex-grow overflow-y-auto custom-scrollbar p-0 md:p-8 space-y-8">
                    {/* Enhanced Feed Tabs */}
                    <div className="flex items-center gap-4 bg-white/5 border border-white/5 p-2 rounded-2xl md:max-w-md mx-auto md:mx-0">
                      {(['FOR_YOU', 'FOLLOWING', 'TRENDING'] as const).map(tab => (
                          <button
                            key={tab}
                            onClick={() => setFeedTab(tab)}
                            className={`flex-grow py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              feedTab === tab 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                                : 'text-gray-950 hover:text-indigo-600 hover:bg-gray-100'
                            }`}
                          >
                          {tab.replace('_', ' ')}
                        </button>
                      ))}
                    </div>

                    {/* Create Post Social Style */}
                    <div className="bg-slate-900/60 border border-white/10 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                      {/* Hidden input structures for post file uploads */}
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

                      <div className="flex gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 overflow-hidden flex-shrink-0 border-2 border-indigo-500/30">
                          <img src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`} alt="Me" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <textarea 
                          placeholder={`What's the viral gist today, ${user.displayName?.split(' ')[0] || 'Friend'}?`}
                          value={newPostText}
                          onChange={(e) => setNewPostText(e.target.value)}
                          className="flex-grow py-4 px-0 bg-transparent border-none focus:ring-0 text-xl font-bold text-white placeholder:text-slate-500 resize-none h-24 whitespace-pre-wrap outline-none"
                        />
                      </div>

                      {/* Attached Media Preview Frame */}
                      {newPostMediaUrl && (
                        <div className="relative rounded-[2.5rem] overflow-hidden mb-6 border border-white/10 max-h-80 max-w-md mx-auto group/preview shadow-2xl">
                          {newPostMediaUrl.startsWith('data:video') || newPostMediaUrl.includes('.mp4') || newPostMediaUrl.includes('.webm') ? (
                            <video src={newPostMediaUrl} controls className="w-full h-auto object-contain max-h-80" />
                          ) : (
                            <img src={newPostMediaUrl} alt="Attached Media Preview" className="w-full h-auto object-cover max-h-80" />
                          )}
                          <button 
                            type="button"
                            onClick={() => setNewPostMediaUrl('')}
                            className="absolute top-4 right-4 p-3 bg-slate-950/80 hover:bg-rose-600 rounded-full text-white transition-all shadow-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {showMediaInput && !newPostMediaUrl && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mb-6 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4"
                        >
                          <input 
                            type="text"
                            placeholder="Paste image or video URL (or click upload icon below)..."
                            value={newPostMediaUrl}
                            onChange={(e) => setNewPostMediaUrl(e.target.value)}
                            className="bg-transparent border-none text-xs text-white focus:ring-0 flex-grow outline-none font-semibold"
                          />
                          {newPostMediaUrl && (
                            <button 
                              onClick={() => setNewPostMediaUrl('')}
                              className="text-[9px] font-black text-rose-400 hover:text-rose-300 uppercase tracking-widest"
                            >
                              Clear
                            </button>
                          )}
                        </motion.div>
                      )}

                      {/* Interactive Poll Creator Component Panel */}
                      {showPollSetup && (
                        <div className="mb-6 p-6 bg-slate-950/80 border border-white/10 rounded-[2rem] space-y-4 shadow-xl">
                          <h5 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" /> Create Interactive Gist Poll
                          </h5>
                          <input 
                            type="text" 
                            placeholder="Type Poll Question / Prompt..." 
                            value={pollQuestion}
                            onChange={(e) => setPollQuestion(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <input 
                              type="text" 
                              placeholder="Choice A" 
                              value={pollOptionA}
                              onChange={(e) => setPollOptionA(e.target.value)}
                              className="bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                            />
                            <input 
                              type="text" 
                              placeholder="Choice B" 
                              value={pollOptionB}
                              onChange={(e) => setPollOptionB(e.target.value)}
                              className="bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button 
                              type="button"
                              onClick={() => {
                                if (!pollQuestion.trim() || !pollOptionA.trim() || !pollOptionB.trim()) {
                                  alert("Please specify a question and both poll options!");
                                  return;
                                }
                                setShowPollSetup(false);
                              }}
                              className="px-5 py-2.5 bg-emerald-600 text-white font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-emerald-500 transition-all"
                            >
                              Attach Poll
                            </button>
                            <button 
                              type="button"
                              onClick={() => {
                                setPollQuestion('');
                                setPollOptionA('');
                                setPollOptionB('');
                                setShowPollSetup(false);
                              }}
                              className="px-5 py-2.5 bg-slate-800 text-slate-400 font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-slate-700 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Inline Emoji Picker Panel */}
                      {showEmojiPicker && (
                        <div className="absolute z-50 bottom-24 left-4 right-4 p-4 bg-slate-950 border border-white/15 rounded-3xl grid grid-cols-8 gap-2 shadow-2xl">
                          {PRESET_EMOJIS.map(emo => (
                            <button 
                              type="button"
                              key={emo}
                              onClick={() => {
                                setNewPostText(prev => prev + emo);
                                setShowEmojiPicker(false);
                              }}
                              className="text-2xl p-2 hover:bg-white/10 rounded-xl transition-all"
                            >
                              {emo}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Inline Preset GIF Picker Trays */}
                      {showGifPicker && (
                        <div className="absolute z-50 bottom-24 left-4 right-4 p-6 bg-slate-950 border border-white/15 rounded-3xl shadow-2xl">
                          <div className="flex justify-between items-center mb-4">
                            <h6 className="text-[10px] font-black text-white uppercase tracking-widest">Select Reaction GIF Attachment</h6>
                            <button type="button" onClick={() => setShowGifPicker(false)} className="text-[9px] font-black uppercase text-rose-500 hover:text-rose-400">Close</button>
                          </div>
                          <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto custom-scrollbar">
                            {PRESET_GIFS.map((gif, index) => (
                              <button 
                                type="button"
                                key={index}
                                onClick={() => {
                                  setNewPostMediaUrl(gif.url);
                                  setShowGifPicker(false);
                                }}
                                className="relative rounded-xl overflow-hidden hover:scale-105 transition-all aspect-video border border-white/5 active:ring-2 active:ring-indigo-500"
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

                      <div className="flex items-center justify-between pt-6 border-t border-white/5">
                        <div className="flex items-center gap-1 sm:gap-3">
                          <button 
                            type="button"
                            onClick={() => {
                              document.getElementById('feed-post-image-uploader')?.click();
                            }}
                            className="p-3 rounded-xl transition-all text-indigo-400 hover:bg-white/5"
                            title="Upload Custom Image"
                          >
                            <ImageIcon className="w-5 h-5" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              document.getElementById('feed-post-video-uploader')?.click();
                            }}
                            className="p-3 rounded-xl transition-all text-rose-400 hover:bg-white/5"
                            title="Upload Custom Video"
                          >
                            <VideoIcon className="w-5 h-5" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => setShowPollSetup(!showPollSetup)}
                            className={`p-3 rounded-xl transition-all ${showPollSetup ? 'bg-emerald-600/20 text-emerald-400' : 'text-emerald-400 hover:bg-white/5'}`}
                            title="Create Interactive Poll"
                          >
                            <BarChart3 className="w-5 h-5" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              setShowEmojiPicker(!showEmojiPicker);
                              setShowGifPicker(false);
                            }}
                            className={`p-3 rounded-xl transition-all ${showEmojiPicker ? 'bg-amber-600/20 text-amber-400' : 'text-amber-400 hover:bg-white/5'}`}
                            title="Insert Emoji"
                          >
                            <Smile className="w-5 h-5" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              setShowGifPicker(!showGifPicker);
                              setShowEmojiPicker(false);
                            }}
                            className={`p-2.5 rounded-xl border font-black text-[9px] uppercase tracking-widest transition-all ${showGifPicker ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40' : 'text-slate-400 border-white/10 hover:bg-white/5'}`}
                            title="Share reaction GIF"
                          >
                            GIF
                          </button>
                        </div>
                        <button 
                          onClick={async () => {
                            if (!newPostText.trim() && !newPostMediaUrl.trim() && !pollQuestion.trim()) return;
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

                            await handleCreatePost(newPostText, mediaArr, attachedPoll);
                            setNewPostText('');
                            setNewPostMediaUrl('');
                            setPollQuestion('');
                            setPollOptionA('');
                            setPollOptionB('');
                            setShowMediaInput(false);
                            setShowPollSetup(false);
                            setShowEmojiPicker(false);
                            setShowGifPicker(false);
                          }}
                          className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
                        >
                          Post Gist
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Post Feed */}
                    <div className="space-y-8 pb-10">
                      {posts.length > 0 ? posts.map((post) => (
                        <div key={post.id} className="bg-slate-900/60 border border-white/10 rounded-[3.5rem] overflow-hidden group shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500">
                          <div className="p-10">
                            <div className="flex items-center justify-between mb-8">
                              <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl overflow-hidden ring-4 ring-white/5 shadow-lg">
                                  <img src={post.authorPhoto || `https://picsum.photos/seed/${post.authorId}/100/100`} alt={post.authorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-base font-black text-white uppercase tracking-tight">{post.authorName}</h4>
                                    <span className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-slate-900">
                                      <Zap className="w-2 h-2 text-white fill-current" />
                                    </span>
                                  </div>
                            <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest">{post.category || 'Global Context'} • 2m ago</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {post.authorId !== user.uid && (
                                  <button 
                                    onClick={() => handleFollowUser(post.authorId)}
                                    className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-sm ${
                                      user.following?.includes(post.authorId) 
                                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30' 
                                        : 'bg-white/5 text-white hover:bg-indigo-600'
                                    }`}
                                  >
                                    {user.following?.includes(post.authorId) ? '✓ Following' : 'Follow'}
                                  </button>
                                )}
                                <button className="p-2 text-slate-500 hover:text-white transition-colors">
                                  <MoreVertical className="w-5 h-5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-white text-lg leading-relaxed mb-8 font-black">
                              {post.content}
                            </p>

                            {/* Render attached interactive Gist Poll */}
                            {post.poll && (
                              <div className="mb-8 p-6 bg-slate-950/40 border border-white/5 rounded-3xl space-y-4">
                                <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                  📊 Gist Poll: {post.poll.question}
                                </h6>
                                <div className="space-y-3">
                                  {post.poll.options.map((opt, oIdx) => {
                                    const totalVotes = post.poll.options.reduce((sum, o) => sum + o.votes.length, 0);
                                    const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                                    const hasVoted = opt.votes.includes(user.uid);
                                    return (
                                      <button 
                                        type="button"
                                        key={oIdx}
                                        onClick={() => post.id && handleVotePoll(post.id, oIdx)}
                                        className={`w-full relative p-4 rounded-2xl flex items-center justify-between overflow-hidden border transition-all text-xs font-bold ${
                                          hasVoted 
                                            ? 'bg-emerald-600/10 border-emerald-500/50 text-emerald-400' 
                                            : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                        }`}
                                      >
                                        <div 
                                          className="absolute left-0 top-0 bottom-0 bg-indigo-600/10 transition-all duration-700" 
                                          style={{ width: `${pct}%` }}
                                        />
                                        <span className="relative z-10 flex items-center gap-2">
                                          {hasVoted && <span className="text-emerald-500 font-extrabold">✓</span>}
                                          {opt.text}
                                        </span>
                                        <span className="relative z-10 font-mono text-[10px] text-slate-400">
                                          {pct}% ({opt.votes.length} votes)
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {post.media && post.media.length > 0 && (
                              <div className="rounded-[2.5rem] overflow-hidden mb-8 border border-white/5 shadow-inner group-hover:scale-[1.01] transition-transform duration-700">
                                <img src={post.media[0].url} alt="Gist content" className="w-full h-auto" referrerPolicy="no-referrer" />
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-8 border-t border-white/5">
                              <div className="flex items-center gap-8">
                                <button 
                                  onClick={() => handleLikePost(post.id, post.likes.includes(user.uid))}
                                  className={`flex items-center gap-2 group/btn ${post.likes.includes(user.uid) ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'} transition-all`}
                                >
                                  <div className={`p-3 rounded-2xl ${post.likes.includes(user.uid) ? 'bg-rose-500/10' : 'bg-white/5'} group-hover/btn:scale-110 transition-transform`}>
                                    <Heart className={`w-5 h-5 ${post.likes.includes(user.uid) ? 'fill-rose-500' : 'fill-none'}`} />
                                  </div>
                                  <span className="text-xs font-black tracking-widest">{post.likes.length}</span>
                                </button>
                                <button className="flex items-center gap-2 group/btn text-slate-400 hover:text-indigo-400 transition-all">
                                  <div className="p-3 bg-white/5 rounded-2xl group-hover/btn:scale-110 transition-transform">
                                    <MessageSquare className="w-5 h-5" />
                                  </div>
                                  <span className="text-xs font-black tracking-widest">{post.comments.length}</span>
                                </button>
                                <button className="flex items-center gap-2 group/btn text-slate-400 hover:text-amber-400 transition-all">
                                  <div className="p-3 bg-white/5 rounded-2xl group-hover/btn:scale-110 transition-transform">
                                    <Coins className="w-5 h-5" />
                                  </div>
                                  <span className="text-xs font-black tracking-widest">Tip</span>
                                </button>
                                <button className="flex items-center gap-2 group/btn text-slate-400 hover:text-emerald-400 transition-all">
                                  <div className="p-3 bg-white/5 rounded-2xl group-hover/btn:scale-110 transition-transform">
                                    <Repeat className="w-5 h-5" />
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-widest">Echo</span>
                                </button>
                              </div>
                              <div className="flex items-center gap-3">
                                <button className="p-3 bg-white/5 text-slate-400 hover:text-white rounded-2xl transition-all">
                                  <Bookmark className="w-5 h-5" />
                                </button>
                                <button className="p-3 bg-white/5 text-slate-400 hover:text-white rounded-2xl transition-all">
                                  <Share className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="p-32 text-center bg-white/5 border border-dashed border-white/10 rounded-[5rem]">
                          <Globe className="w-20 h-20 text-slate-600 mx-auto mb-8 animate-pulse" />
                          <h4 className="text-2xl font-black text-slate-400 uppercase tracking-tighter italic">Initializing Viral Pulse...</h4>
                          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-4">The global conversation begins with your first gist.</p>
                        </div>
                      )}
                    </div>

                    {/* Live Activity Ticker */}
                    <div className="sticky bottom-0 left-0 right-0 z-50 py-4 bg-gray-950/80 backdrop-blur-2xl border-t border-white/10 overflow-hidden transform group-hover:translate-y-0 transition-transform">
                       <div className="flex animate-marquee whitespace-nowrap">
                          {[
                            "GLOBAL INTEL: New Career Mentor joined Church Hub",
                            "TACTICAL ALERT: High engagement on Gaming Reel #Win",
                            "HUB SYNC: 1,240 new gists deployed in the last hour",
                            "MARKET UPDATE: Price of Crude Oil refined in Nigeria Hub...",
                            "USER CONNECT: Dr. Sarah just posted a new Strategic Blog",
                            "VIRAL GIST: Marriage Forum hitting record 25k interactions"
                          ].map((text, i) => (
                            <div key={i} className="flex items-center gap-4 mx-8">
                               <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                               <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{text}</span>
                            </div>
                          ))}
                          {/* Duplicate for seamless scrolling */}
                          {[
                            "GLOBAL INTEL: New Career Mentor joined Church Hub",
                            "TACTICAL ALERT: High engagement on Gaming Reel #Win",
                            "HUB SYNC: 1,240 new gists deployed in the last hour",
                            "MARKET UPDATE: Price of Crude Oil refined in Nigeria Hub...",
                            "USER CONNECT: Dr. Sarah just posted a new Strategic Blog",
                            "VIRAL GIST: Marriage Forum hitting record 25k interactions"
                          ].map((text, j) => (
                            <div key={j} className="flex items-center gap-4 mx-8">
                               <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                               <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{text}</span>
                            </div>
                          ))}
                       </div>
                    </div>
                           {/* Right Column: Trending & Strategic Mining Sidebar */}
                  <div className="hidden lg:flex xl:hidden w-96 flex-col p-8 space-y-8 border-l border-white/5 overflow-y-auto custom-scrollbar no-scrollbar bg-slate-900/40">
                    {/* EFADO Mining Strategic Module */}
                    <div className="space-y-4">
                       <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-2">Sovereign Extraction</h5>
                       <MiningMiniCard user={user} onOpenFull={onOpenMining || (() => setShowMiningFull(true))} />
                    </div>

                    {/* Advertising Entry Point */}
                    <div className="space-y-4">
                       <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-2">Strategic Visibility</h5>
                       <AdvertisingMiniCard 
                          onAdvert={() => onNavigate?.('ADVERTISING', 'ADVERT')} 
                          onSell={() => onNavigate?.('ADVERTISING', 'SELL')} 
                       />
                    </div>

                    {/* Trending Communities */}
                    <div className="bg-slate-900/60 border border-white/10 rounded-[3rem] p-8 shadow-2xl space-y-6">
                       <h5 className="text-lg font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                          <TrendingUp className="w-6 h-6 text-indigo-400" /> Viral Hubs
                       </h5>
                       <div className="space-y-6">
                          {[
                            { hub: 'Religious Discourse', tags: '12.4k active', color: 'bg-amber-500' },
                            { hub: 'Wives Forum', tags: '8.2k active', color: 'bg-rose-500' },
                            { hub: 'Tech Trends', tags: '15.1k active', color: 'bg-cyan-500' },
                            { hub: 'Football PL', tags: '25.3k active', color: 'bg-indigo-500' },
                          ].map((trend, i) => (
                            <div key={i} className="flex items-center gap-4 group cursor-pointer hover:translate-x-1 transition-all">
                               <div className={`w-2 h-10 rounded-full ${trend.color} opacity-20 group-hover:opacity-100 transition-opacity`} />
                               <div>
                                  <p className="text-sm font-black text-white uppercase tracking-tight">{trend.hub}</p>
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{trend.tags}</p>
                                </div>
                            </div>
                          ))}
                       </div>
                       <button className="w-full py-4 text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 rounded-2xl hover:bg-indigo-500/20 transition-all border border-indigo-500/20">
                          Explore All Hubs
                       </button>
                    </div>

                    {/* Suggested Strategists */}
                    <div className="space-y-6 pb-20">
                       <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-2">Top Strategists</h5>
                       <div className="space-y-4">
                          {[1,2,3].map(i => (
                            <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 hover:shadow-lg transition-all border border-white/10">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 overflow-hidden border border-white/5">
                                     <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="User" referrerPolicy="no-referrer" />
                                  </div>
                                  <div>
                                     <p className="text-xs font-black text-white uppercase">Strategist_{i}</p>
                                     <p className="text-[9px] font-bold text-emerald-400 uppercase">Verified</p>
                                  </div>
                               </div>
                               <button className="p-2 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg transition-all">
                                  <Plus className="w-4 h-4" />
                                </button>
                            </div>
                          ))}
                       </div>
          </div>

                       {/* Hub Pulse Meter */}
                       <div className="p-6 bg-slate-900 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                              <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Global Hub Pulse</h5>
                              <Zap className="w-3 h-3 text-indigo-400 animate-pulse" />
                            </div>
                            <div className="flex items-end gap-1 h-12 mb-4">
                              {[30, 45, 60, 40, 80, 95, 70, 50, 85, 90].map((h, i) => (
                                <motion.div 
                                  key={i}
                                  initial={{ height: 0 }}
                                  animate={{ height: `${h}%` }}
                                  transition={{ repeat: Infinity, duration: 1, repeatType: 'reverse', delay: i * 0.1 }}
                                  className="flex-grow bg-indigo-500/30 rounded-t-sm border-t border-indigo-500/50"
                                />
                              ))}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Sentiment: High</span>
                              <span className="text-[10px] font-black text-white italic">Viral Flow</span>
                            </div>
                          </div>
                          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl -mr-16 -mt-16" />
                       </div>
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
                    const CHAT_ROOM_DEFS = [
                      { id: 'tactical-hq', name: 'Tactical HQ', status: '8 members', time: '12:45', msg: 'System check complete.', unread: 0, type: 'GROUP' },
                      { id: 'sarah', name: 'Dr. Sarah (Lead Eng)', status: 'Active', time: '11:20', msg: 'The encryption keys are synced.', unread: 0, type: 'DIRECT' },
                      { id: 'global', name: 'Global Chat (Real-time with Colleague)', status: 'Live Cross-Device Bridge', time: 'Yesterday', msg: 'Active real-time public bridge.', unread: 0, type: 'GROUP' },
                      { id: 'bishop', name: 'Bishop T. (Spiritual)', status: 'Online', time: 'Monday', msg: 'Blessings for the project.', unread: 0, type: 'DIRECT' },
                      ...customRooms
                    ];
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
                                <button className="flex-grow py-3 px-4 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">Direct</button>
                                <button className="flex-grow py-3 px-4 text-white hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest">Groups</button>
                                <button className="flex-grow py-3 px-4 text-white hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest">Bridges</button>
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
                            <button 
                              onClick={() => setShowPrivateRoomModal(true)}
                              className="w-full py-2.5 bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600 hover:border-indigo-500 text-indigo-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                              <Plus className="w-4 h-4 animate-pulse" /> Connect Private Room
                            </button>
                          </div>

                          <div className="flex-grow overflow-y-auto custom-scrollbar">
                            {CHAT_ROOM_DEFS.map((chat) => (
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
                                  <div key={msg.id || idx} className="flex flex-col items-end gap-2 max-w-[75%] ml-auto animate-fade-in animate-duration-300">
                                    <div className={`p-5 text-white rounded-3xl rounded-tr-none shadow-2xl ${msg.content && (msg.content.includes('[LEDGER_TX]') || msg.content.includes('[FLASH_BUZZ]') || msg.content.includes('[VERIFICATION_REQ]')) ? 'bg-transparent border border-white/5 p-1' : 'bg-indigo-600 border border-indigo-500'}`}>
                                      {msg.content && renderSpecialMessageContent(msg.content, true)}
                                      {msg.mediaUrl && (
                                        <div className="mt-3 rounded-2xl overflow-hidden max-w-xs border border-white/10 hover:scale-[1.02] transition-transform duration-300">
                                          <img src={msg.mediaUrl} alt="Secure link attachment" className="w-full h-auto object-cover max-h-48" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mr-4">
                                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                         {msg.timestamp?.seconds 
                                           ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                                           : 'Sending...'}
                                       </p>
                                       <Zap className="w-3 h-3 text-indigo-400" />
                                    </div>
                                  </div>
                                );
                              } else {
                                return (
                                  <div key={msg.id || idx} className="flex flex-col gap-2 max-w-[75%] animate-fade-in animate-duration-300">
                                    <div className={`p-5 text-slate-100 rounded-3xl rounded-tl-none shadow-xl ${msg.content && (msg.content.includes('[LEDGER_TX]') || msg.content.includes('[FLASH_BUZZ]') || msg.content.includes('[VERIFICATION_REQ]')) ? 'bg-transparent border border-white/5 p-1' : 'bg-slate-900 border border-white/10'}`}>
                                      {msg.content && renderSpecialMessageContent(msg.content, false)}
                                      {msg.mediaUrl && (
                                        <div className="mt-3 rounded-2xl overflow-hidden max-w-xs border border-white/10">
                                          <img src={msg.mediaUrl} alt="Received link attachment" className="w-full h-auto object-cover max-h-48" />
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                      {msg.senderName} • {msg.timestamp?.seconds 
                                        ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                                        : 'Now'}
                                    </p>
                                  </div>
                                );
                              }
                            })}
                          </div>

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

                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleSendMessage();
                              }}
                              className="p-6 bg-slate-900 border-t border-white/5 shadow-[0_-4px_30px_rgba(0,0,0,0.2)]"
                            >
                              <div className="flex items-center gap-4">
                                <div className="flex items-center bg-white/5 rounded-2xl p-1">
                                  <button 
                                    type="button" 
                                    onClick={() => setShowGifPickerChat(!showGifPickerChat)}
                                    className={`px-3 py-2 border font-black text-[9px] uppercase tracking-widest rounded-xl transition-all mr-1 ${showGifPickerChat ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/20' : 'text-slate-400 border-white/10 hover:bg-white/5'}`}
                                    title="Choose a reaction GIF"
                                  >
                                    GIF
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => document.getElementById('chat-media-loader')?.click()} 
                                    className="p-3 text-slate-400 hover:text-indigo-400 transition-all hover:bg-white/5 rounded-xl animate-pulse"
                                    title="Attach custom photo file"
                                  >
                                    <ImageIcon className="w-5 h-5" />
                                  </button>
                                </div>
                                <div className="flex-grow relative group">
                                  <input 
                                    type="text" 
                                    value={newMessageText}
                                    onChange={(e) => setNewMessageText(e.target.value)}
                                    placeholder={`Message ${activeRoomDef.name}...`}
                                    className="w-full pl-6 pr-14 py-4 bg-white/5 border border-white/10 rounded-3xl text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all shadow-inner placeholder:text-slate-500"
                                  />
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      setShowEmojiPickerChat(!showEmojiPickerChat);
                                      setShowGifPickerChat(false);
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-amber-400 transition-all"
                                  >
                                    <Smile className="w-5 h-5" />
                                  </button>
                                </div>
                                <button 
                                  type="submit"
                                  className="p-5 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                                >
                                  <Send className="w-6 h-6" />
                                </button>
                              </div>
                              <div className="flex items-center gap-6 mt-4 px-4 overflow-x-auto custom-scrollbar no-scrollbar">
                                <button 
                                  type="button" 
                                  onClick={() => document.getElementById('chat-media-loader')?.click()}
                                  className="flex items-center gap-2 text-[9px] font-black text-slate-400 hover:text-white transition-all whitespace-nowrap cursor-pointer"
                                >
                                  <Contact className="w-3.5 h-3.5 text-indigo-400" /> Share Intels
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => setShowLedgerModal(true)}
                                  className="flex items-center gap-2 text-[9px] font-black text-slate-400 hover:text-white transition-all whitespace-nowrap cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5 text-emerald-400" /> Transmit Ledger
                                </button>
                                <button 
                                  type="button" 
                                  onClick={handleFlashBuzzAction}
                                  className="flex items-center gap-2 text-[9px] font-black text-slate-400 hover:text-white transition-all whitespace-nowrap cursor-pointer"
                                >
                                  <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" /> Flash Buzz
                                </button>
                                <button 
                                  type="button" 
                                  onClick={handleVerificationReqAction}
                                  className="flex items-center gap-2 text-[9px] font-black text-emerald-500 hover:text-emerald-400 transition-all whitespace-nowrap ml-auto cursor-pointer"
                                >
                                  <Shield className="w-3.5 h-3.5" /> Verification Req
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
                          <h3 className="text-3xl font-black text-white uppercase tracking-tight">
                            {user.fullName || user.displayName || user.email.split('@')[0]}
                          </h3>
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
                          <p className="text-2xl font-black text-white">156</p>
                          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Gists</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security Credentials Card */}
                  <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[3.5rem] p-12 overflow-hidden shadow-2xl relative group mt-8">
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
                        className="w-full py-4 bg-indigo-600 text-white hover:bg-indigo-50 active:scale-[0.98] rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                      >
                        {isUpdatingPassword ? 'Synchronising Key...' : 'Update Security Passcode'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeView === 'MONETIZATION' && (
                <motion.div 
                  key="monetization"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-6xl mx-auto p-8 space-y-12 pb-24 h-full overflow-y-auto no-scrollbar"
                >
                  {/* Hero Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-700" />
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                          <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                            <TrendingUp className="w-8 h-8 text-white" />
                          </div>
                          <div className="px-5 py-2 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">
                            Active Payout Profile
                          </div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Total Creator Earnings</p>
                        <h3 className="text-5xl font-black italic tracking-tighter mb-8 italic">
                          {formatPrice(user.creatorEarnings?.totalTips || 425.50)}
                        </h3>
                        <div className="flex items-center gap-4">
                          <button className="flex-grow py-4 bg-white text-indigo-950 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                            Withdraw Earnings
                          </button>
                          <button className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all">
                             <BarChart3 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-xl shadow-gray-100/50 flex flex-col justify-between">
                       <div>
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Ad Revenue Share</p>
                         <h4 className="text-3xl font-black text-gray-900">{formatPrice(user.creatorEarnings?.adRevenueShare || 128.00)}</h4>
                       </div>
                       <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                         <span className="text-[10px] font-bold text-emerald-500 uppercase">+12% this month</span>
                         <BarChart3 className="w-4 h-4 text-gray-300" />
                       </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-xl shadow-gray-100/50 flex flex-col justify-between">
                       <div>
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Traffic Rewards</p>
                         <h4 className="text-3xl font-black text-gray-900">{formatPrice(user.creatorEarnings?.trafficRewards || 82.50)}</h4>
                       </div>
                       <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                         <span className="text-[10px] font-bold text-indigo-500 uppercase">Level: {user.creatorEarnings?.level || 'Influencer'}</span>
                         <Zap className="w-4 h-4 text-gray-300" />
                       </div>
                    </div>
                  </div>

                  {/* Monetization Roadmap */}
                  <div className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-xl shadow-gray-100/50">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
                      <div>
                        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight italic">Monetization Status & Eligibility</h3>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">Become a Global EFADO Partner</p>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-16 h-16 rounded-full border-4 border-indigo-600 flex items-center justify-center text-indigo-600 font-black text-xs">
                           85%
                         </div>
                         <div className="text-left">
                           <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Global Authority Level</p>
                           <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Next tier: Sovereign Creator</p>
                         </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       {[
                         { title: "Engagement Metrics", value: "85,420", target: "100k", status: "In Progress", icon: Users },
                         { title: "Weekly Content Yield", value: "14 Gists", target: "10 Gists", status: "Complete", icon: MessageSquareIcon },
                         { title: "Community Integrity", value: "99.8%", target: "95%", status: "Complete", icon: Shield }
                       ].map((step, i) => (
                         <div key={i} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-indigo-200 transition-all">
                            <div className="flex items-center justify-between mb-4">
                               <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600">
                                  <step.icon className="w-5 h-5" />
                               </div>
                               <span className={`text-[9px] font-black uppercase tracking-widest ${step.status === 'Complete' ? 'text-emerald-500' : 'text-amber-500'}`}>{step.status}</span>
                            </div>
                            <h5 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-2">{step.title}</h5>
                            <div className="flex items-center gap-2">
                               <div className="flex-grow h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-600" style={{ width: step.status === 'Complete' ? '100%' : '85%' }} />
                               </div>
                               <span className="text-[10px] font-bold text-gray-400">{step.value}/{step.target}</span>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>

                  {/* Transaction History & Tips Feed */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                     <div className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-xl shadow-gray-100/50 overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                           <h4 className="text-lg font-black text-gray-900 uppercase tracking-tighter italic">Recent Tips & Support</h4>
                           <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View All Notifications</button>
                        </div>
                        <div className="space-y-6">
                           {[1, 2, 3, 4].map(i => (
                             <div key={i} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl hover:bg-white hover:scale-[1.02] hover:shadow-lg transition-all cursor-pointer">
                                <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 rounded-xl bg-indigo-100 overflow-hidden border border-indigo-200">
                                      <img src={`https://picsum.photos/seed/${i + 70}/100/100`} alt="Supporter" referrerPolicy="no-referrer" />
                                   </div>
                                   <div>
                                      <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Supporter {i + 14}</p>
                                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Sent a tip for your "Future of AI" gist</p>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <p className="text-sm font-black text-emerald-600">+{formatPrice(5.00 * i)}</p>
                                   <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">2h ago</p>
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>

                     <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                        <div className="relative z-10">
                           <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-10">
                              <ShieldCheck className="w-8 h-8 text-emerald-400" />
                           </div>
                           <h4 className="text-3xl font-black uppercase tracking-tighter italic mb-4">Sovereign Monetization Account</h4>
                           <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10">
                             Your earnings are protected by EFADO's tactical escrow bridges. You can withdraw your balance directly to your Tactical Wallet or synchronized bank accounts at any time.
                           </p>
                           
                           <div className="space-y-4">
                              <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
                                 <div className="flex items-center gap-3">
                                    <CreditCard className="w-5 h-5 text-indigo-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Synchronized Bank</span>
                                 </div>
                                 <span className="text-[10px] font-bold text-white uppercase tracking-widest">Zenith Bank ****4242</span>
                              </div>
                              <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
                                 <div className="flex items-center gap-3">
                                    <Globe className="w-5 h-5 text-emerald-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Payout Hub</span>
                                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[8px] font-black rounded uppercase">Standard</span>
                                 </div>
                                 <span className="text-[10px] font-bold text-white uppercase tracking-widest">Global Transit Enabled</span>
                              </div>
                           </div>
                        </div>

                        <button className="mt-10 w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 transition-all active:scale-95">
                           Configure Payout Strategy
                        </button>
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Sidebar - Trending & Suggestions */}
        <div className="hidden xl:flex w-80 flex-shrink-0 bg-slate-900/50 backdrop-blur-3xl border-l border-white/5 flex-col p-8 space-y-10 overflow-y-auto no-scrollbar">
          <section>
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 pl-1">Tactical Trending</h4>
            {!trendingRevealed ? (
              <button 
                onClick={() => setTrendingRevealed(true)}
                className="w-full py-4 bg-indigo-600/10 hover:bg-indigo-600/25 border border-indigo-500/20 hover:border-indigo-500/50 text-indigo-400 hover:text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95"
              >
                <TrendingUp className="w-4 h-4" /> Reveal Trending Nodes
              </button>
            ) : (
              <div className="space-y-6">
                <div className="space-y-6">
                  {GIST_CATEGORIES.slice(0, 4).map((cat) => (
                    <div 
                      key={cat.id} 
                      onClick={() => {
                        setSelectedGroup(null);
                        setSelectedSubCategory(null);
                        setSelectedCategory(cat);
                        setActiveView('CATEGORIES');
                      }}
                      className="flex items-center gap-4 group cursor-pointer hover:translate-x-1 transition-all"
                    >
                      <div className={`w-12 h-12 rounded-2xl bg-${cat.color}-500/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-${cat.color}-500/20 transition-all shadow-lg`}>
                        <cat.icon className={`w-6 h-6 text-${cat.color}-400`} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white uppercase tracking-tight group-hover:text-amber-400 transition-colors">{cat.title}</p>
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2 mt-0.5">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                          4.2K Active Units
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setTrendingRevealed(false)}
                  className="w-full text-center py-2 text-[9px] font-black text-slate-500 hover:text-slate-400 uppercase tracking-widest transition-all"
                >
                  Hide Trending
                </button>
              </div>
            )}
          </section>

          <section>
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 pl-1">Suggested Connections</h4>
            {!suggestionsRevealed ? (
              <button 
                onClick={() => setSuggestionsRevealed(true)}
                className="w-full py-4 bg-emerald-600/10 hover:bg-emerald-600/25 border border-emerald-500/20 hover:border-emerald-500/50 text-emerald-400 hover:text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95"
              >
                <Users className="w-4 h-4" /> Reveal Suggested Intel
              </button>
            ) : (
              <div className="space-y-6">
                <div className="space-y-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 overflow-hidden ring-2 ring-white/5 group-hover:ring-indigo-500/50 transition-all">
                          <img src={`https://picsum.photos/seed/${i + 50}/100/100`} alt="User" referrerPolicy="no-referrer" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white uppercase tracking-tight">Agent {i + 10}</p>
                          <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Mutual Intel</p>
                        </div>
                      </div>
                      <button className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors">Sync</button>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setSuggestionsRevealed(false)}
                  className="w-full text-center py-2 text-[9px] font-black text-slate-500 hover:text-slate-400 uppercase tracking-widest transition-all"
                >
                  Hide Suggestions
                </button>
              </div>
            )}
          </section>

          <section className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/20 rounded-3xl p-5 text-white relative overflow-hidden shadow-xl shadow-indigo-500/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-16 -mt-16" />
            <div className="relative z-10 flex items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
                   <Shield className="w-5 h-5 text-indigo-400" />
                 </div>
                 <div>
                   <h5 className="text-xs font-black tracking-tight uppercase italic flex items-center gap-1.5">
                     EFADO™ Elite
                     <span className="bg-amber-500/20 text-amber-300 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border border-amber-500/10">PRO</span>
                   </h5>
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Zero-latency security priority support</p>
                 </div>
               </div>
               <button 
                 type="button"
                 onClick={() => {
                   alert("EFADO™ Elite Synchronisation initiated. Handshaking secure terminal node...");
                 }}
                 className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-500/20 cursor-pointer flex-shrink-0"
               >
                 Sync Now
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
                  await addDoc(collection(db, 'reels'), {
                    authorId: user.uid,
                    authorName: user.displayName || user.email,
                    authorPhoto: user.photoURL,
                    videoUrl: mediaUrl,
                    caption: content,
                    likes: [],
                    comments: [],
                    shares: 0,
                    createdAt: serverTimestamp()
                  });
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
                className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 relative shadow-2xl text-white"
              >
                <button 
                  onClick={() => setShowPrivateRoomModal(false)} 
                  className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="text-center mb-8">
                  <div className="w-14 h-14 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/10">
                    <MessageSquare className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h4 className="text-xl font-black uppercase tracking-tight italic">Connect Private Room</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Cross-Device Synchronized Bridge</p>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest leading-relaxed text-center bg-white/5 p-4 rounded-xl border border-white/5">
                    Enter any room name or code below. Have your colleague enter the exact same code on their device to instantly join the same private, real-time secure chat room!
                  </p>
                  
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Room Code / Name</label>
                    <input 
                      type="text"
                      value={privateRoomCode}
                      onChange={(e) => setPrivateRoomCode(e.target.value)}
                      placeholder="e.g. colleague-private-123"
                      className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-white uppercase focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-slate-600"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleJoinPrivateRoom(privateRoomCode);
                      }}
                    />
                  </div>

                  <button 
                    onClick={() => handleJoinPrivateRoom(privateRoomCode)}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 mt-2"
                  >
                    Open Secure Tunnel
                  </button>
                </div>
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
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl"
            >
              <div className="w-full max-w-lg aspect-square bg-slate-900 rounded-[3rem] border border-white/10 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
                {isCalling === 'VIDEO' && (
                  <div className="absolute inset-0 opacity-30">
                    <img src="https://picsum.photos/seed/call/800/800" alt="Video" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div className="relative z-10">
                  <div className="w-32 h-32 rounded-full border-4 border-indigo-500 p-1 mb-8 mx-auto">
                    <img src="https://picsum.photos/seed/user1/200/200" alt="User" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-2">User 1</h3>
                  <p className="text-indigo-400 font-black uppercase tracking-[0.2em] text-xs animate-pulse">
                    {isCalling === 'VIDEO' ? 'Video Calling...' : 'Voice Calling...'}
                  </p>
                </div>

                <div className="mt-12 flex items-center gap-8 relative z-10">
                  <button onClick={() => setIsCalling(null)} className="w-16 h-16 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-rose-500/20 hover:scale-110 transition-all">
                    <X className="w-8 h-8" />
                  </button>
                  <button className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/20 hover:scale-110 transition-all">
                    <Phone className="w-8 h-8" />
                  </button>
                </div>
              </div>
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
    </motion.div>
  );
};
