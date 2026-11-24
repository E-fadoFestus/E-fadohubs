import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Bookmark,
  Brain,
  Calendar,
  CheckCircle2,
  Film,
  Heart,
  Home,
  Image as ImageIcon,
  LayoutList,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Plus,
  Radio,
  Search,
  Send,
  Share2,
  ShoppingBag,
  Sparkles,
  User as UserIcon,
  Users,
  Video,
  Vote,
  X,
} from 'lucide-react';
import {
  db,
  collection,
  limit,
  onSnapshot,
  query,
  where,
} from '../firebase';
import { UserProfile } from '../types';
import { HubGuideNote } from './HubGuideNote';
import { efadoNexusApi } from '../services/efadoNexusApi';
import {
  NEXUS_INTEGRATIONS,
  NexusSubPageId,
  compressNexusImage,
  fileToSafeDataUrl,
  formatRelativeTime,
} from './nexus/nexusTypes';
import { EfadoGistWorldPage } from './nexus/EfadoGistWorldPage';
import { EfadoConnectPage } from './nexus/EfadoConnectPage';
import { EfadoVibesPage } from './nexus/EfadoVibesPage';
import { EfadoMomentsPage } from './nexus/EfadoMomentsPage';
import { EfadoAssemblyPage } from './nexus/EfadoAssemblyPage';
import { EfadoMindProPage } from './nexus/EfadoMindProPage';

export interface EfadoNexusHubViewProps {
  user: UserProfile;
  onClose: () => void;
  onNavigate?: (hub: any, subview?: any, extraProps?: any) => void;
  initialPage?: string;
  bargainContext?: any;
  creatorStats?: any;
  onUpdateCreatorStats?: (stats: any) => void;
  onOpenProfile?: () => void;
}

type HubStage = 'DOOR' | 'HUB' | 'SUBPAGE';
type FeedFilterTab = 'FOR_YOU' | 'FOLLOWING' | 'TRENDING' | 'MARKETPLACE' | 'LIVE_NOW';

const SUBPAGE_IDS: NexusSubPageId[] = [
  'gist-world',
  'connect',
  'vibes',
  'moments',
  'assembly',
  'mind-pro',
];

function parseInitialSubpage(raw?: string, bargainContext?: any): NexusSubPageId | null {
  if (bargainContext) return 'connect';
  const clean = String(raw || '').toLowerCase().trim();
  if (SUBPAGE_IDS.includes(clean as NexusSubPageId)) {
    return clean as NexusSubPageId;
  }
  return null;
}

const INTEGRATION_ICONS: Record<NexusSubPageId, any> = {
  'gist-world': MessageSquare,
  connect: MessageCircle,
  vibes: Film,
  moments: Sparkles,
  assembly: Megaphone,
  'mind-pro': Brain,
};

export const EfadoNexusHubView: React.FC<EfadoNexusHubViewProps> = ({
  user,
  onClose,
  onNavigate,
  initialPage,
  bargainContext,
  creatorStats,
  onOpenProfile,
}) => {
  const detectedSubpage = parseInitialSubpage(initialPage, bargainContext);
  const [stage, setStage] = useState<HubStage>(detectedSubpage ? 'SUBPAGE' : 'DOOR');
  const [activeSubpage, setActiveSubpage] = useState<NexusSubPageId | null>(detectedSubpage);

  // Top Bar interactive state (Door & Super Hub)
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);

  // Real-time Firestore state
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [marketListings, setMarketListings] = useState<any[]>([]);
  const [liveRooms, setLiveRooms] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Second Page Feed & Composer
  const [feedTab, setFeedTab] = useState<FeedFilterTab>('FOR_YOU');
  const [composerText, setComposerText] = useState('');
  const [composerMedia, setComposerMedia] = useState<Array<{ type: 'image' | 'video'; url: string }>>([]);
  const [showPollBox, setShowPollBox] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOpt1, setPollOpt1] = useState('');
  const [pollOpt2, setPollOpt2] = useState('');
  const [showEventBox, setShowEventBox] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [feedActionMsg, setFeedActionMsg] = useState<string | null>(null);
  const [openCommentsId, setOpenCommentsId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Quick Story composer on Second Page
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [storyCaption, setStoryCaption] = useState('');
  const [storyPhoto, setStoryPhoto] = useState('');

  // Sync URL sub-page cleanly with browser Back/Forward
  useEffect(() => {
    const sub = parseInitialSubpage(initialPage, bargainContext);
    if (sub) {
      setActiveSubpage(sub);
      setStage('SUBPAGE');
    }
  }, [initialPage, bargainContext]);

  useEffect(() => {
    const onPopState = () => {
      const p = window.location.pathname.toLowerCase();
      const matched = SUBPAGE_IDS.find((id) => p.endsWith(`/nexus-hub/${id}`));
      if (matched) {
        setActiveSubpage(matched);
        setStage('SUBPAGE');
      } else if (p.includes('/nexus-hub')) {
        setActiveSubpage(null);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Firestore Live Listeners
  useEffect(() => {
    const unsubPosts = onSnapshot(query(collection(db, 'social_posts'), limit(120)), (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a: any, b: any) => {
        const ta = a.createdAt?.seconds || (a.createdAtIso ? Date.parse(a.createdAtIso) / 1000 : 0);
        const tb = b.createdAt?.seconds || (b.createdAtIso ? Date.parse(b.createdAtIso) / 1000 : 0);
        return tb - ta;
      });
      setPosts(items);
    });

    const unsubStories = onSnapshot(query(collection(db, 'nexus_stories'), limit(40)), (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setStories(items);
    });

    const unsubMarket = onSnapshot(
      query(collection(db, 'ad_listings'), where('status', '==', 'active'), limit(30)),
      (snap) => {
        setMarketListings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    );

    const unsubLive = onSnapshot(query(collection(db, 'gist_live_rooms'), limit(20)), (snap) => {
      setLiveRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    let unsubNotifs: (() => void) | undefined;
    if (user?.uid && user.uid !== 'guest-preview') {
      unsubNotifs = onSnapshot(
        query(collection(db, 'efado_notifications'), where('userId', '==', user.uid), limit(25)),
        (snap) => {
          setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      );
    }

    return () => {
      unsubPosts();
      unsubStories();
      unsubMarket();
      unsubLive();
      unsubNotifs?.();
    };
  }, [user?.uid]);

  const unreadNotifs = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const openDedicatedSubpage = (id: NexusSubPageId) => {
    setActiveSubpage(id);
    setStage('SUBPAGE');
    if (typeof window !== 'undefined') {
      const targetUrl = `/hub/nexus-hub/${id}`;
      if (window.location.pathname !== targetUrl) {
        window.history.pushState({}, '', targetUrl);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const backToSuperHub = () => {
    setActiveSubpage(null);
    setStage('HUB');
    if (typeof window !== 'undefined' && window.location.pathname !== '/hub/nexus-hub') {
      window.history.pushState({}, '', '/hub/nexus-hub');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenMyHub = () => {
    setStage('HUB');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBottomNav = (target: 'HOME' | 'GIST' | 'SELL' | 'MY_ADVERTS' | 'PROFILE') => {
    if (target === 'HOME') {
      onClose();
      return;
    }
    if (target === 'GIST') {
      setActiveSubpage(null);
      setStage('HUB');
      return;
    }
    if (target === 'SELL') {
      if (onNavigate) onNavigate('ADVERTISING', 'SELL');
      return;
    }
    if (target === 'MY_ADVERTS') {
      if (onNavigate) onNavigate('ADVERTISING', 'ADVERT');
      return;
    }
    if (target === 'PROFILE') {
      if (onOpenProfile) onOpenProfile();
      else if (onNavigate) onNavigate('dashboard');
    }
  };

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = [...posts];
    if (feedTab === 'FOLLOWING' && Array.isArray(user.following) && user.following.length > 0) {
      list = list.filter((p) => user.following?.includes(p.authorId || p.userId));
    } else if (feedTab === 'TRENDING') {
      list.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    }
    if (q) {
      list = list.filter(
        (p) =>
          String(p.content || '').toLowerCase().includes(q) ||
          String(p.authorName || p.ownerName || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [posts, feedTab, user.following, searchQuery]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setComposerError(null);
    setFeedActionMsg(null);
    setIsPublishing(true);
    try {
      const pollPayload =
        showPollBox && pollQuestion.trim() && pollOpt1.trim() && pollOpt2.trim()
          ? {
              question: pollQuestion.trim(),
              options: [
                { label: pollOpt1.trim(), votes: [] },
                { label: pollOpt2.trim(), votes: [] },
              ],
            }
          : undefined;
      const eventPayload =
        showEventBox && eventTitle.trim()
          ? {
              title: eventTitle.trim(),
              date: eventDate.trim() || 'Upcoming',
              location: eventLocation.trim() || 'EFADO Online',
            }
          : undefined;

      await efadoNexusApi.feed.createPost(user, {
        content: composerText,
        media: composerMedia,
        poll: pollPayload,
        event: eventPayload,
      });

      setComposerText('');
      setComposerMedia([]);
      setShowPollBox(false);
      setPollQuestion('');
      setPollOpt1('');
      setPollOpt2('');
      setShowEventBox(false);
      setEventTitle('');
      setEventDate('');
      setEventLocation('');
      setFeedActionMsg('Published live to EFADO Nexus Hub!');
    } catch (err: any) {
      setComposerError(err?.message || 'Not sent, please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  // ============================================================================
  // RENDER DEDICATED FULL PAGE (ANY OF THE 6 APPS)
  // ============================================================================
  if (stage === 'SUBPAGE' && activeSubpage) {
    if (activeSubpage === 'gist-world') {
      return <EfadoGistWorldPage user={user} onBack={backToSuperHub} />;
    }
    if (activeSubpage === 'connect') {
      return <EfadoConnectPage user={user} onBack={backToSuperHub} bargainContext={bargainContext} />;
    }
    if (activeSubpage === 'vibes') {
      return <EfadoVibesPage user={user} onBack={backToSuperHub} creatorStats={creatorStats} />;
    }
    if (activeSubpage === 'moments') {
      return <EfadoMomentsPage user={user} onBack={backToSuperHub} />;
    }
    if (activeSubpage === 'assembly') {
      return <EfadoAssemblyPage user={user} onBack={backToSuperHub} />;
    }
    if (activeSubpage === 'mind-pro') {
      return <EfadoMindProPage user={user} onBack={backToSuperHub} />;
    }
  }

  // ============================================================================
  // SHARED CLEAN WHITE TOP BAR (EFADO Logo, Search, Notifications, Profile)
  // ============================================================================
  const renderTopBar = () => (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Left: EFADO Logo + Back to Home */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onClose}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold flex items-center gap-1.5 transition-colors"
            title="Back to EFADO Home"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </button>

          <button
            onClick={() => {
              setStage('DOOR');
              setActiveSubpage(null);
            }}
            className="flex items-center gap-2.5 text-left"
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-bold text-base flex items-center justify-center shadow-sm">
              E
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold text-slate-900 block leading-tight">
                EFADO
              </span>
              <span className="text-xs text-slate-500 block leading-tight">Nexus Hub</span>
            </div>
          </button>
        </div>

        {/* Right: Search, Notifications, Profile */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearchBar((s) => !s)}
            className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-900 text-sm font-semibold flex items-center justify-center gap-1.5"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </button>

          <button
            onClick={() => setShowNotificationsDrawer((s) => !s)}
            className="relative min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-sm font-semibold flex items-center justify-center gap-1.5"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
            {unreadNotifs > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-bold">
                {unreadNotifs}
              </span>
            )}
          </button>

          <button
            onClick={() => handleBottomNav('PROFILE')}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-sm font-semibold flex items-center gap-2"
            aria-label="Profile"
          >
            <UserIcon className="w-4 h-4" />
            <span className="hidden sm:inline max-w-[110px] truncate">
              {user.displayName?.split(' ')[0] || 'Profile'}
            </span>
          </button>
        </div>
      </div>

      {/* Expandable Search Input */}
      {showSearchBar && (
        <div className="max-w-6xl mx-auto mt-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (stage === 'DOOR' && e.target.value.trim().length > 1) {
                  setStage('HUB');
                }
              }}
              placeholder="Search gist, people, chats, or products..."
              className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setShowSearchBar(false);
            }}
            className="min-h-[44px] px-4 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold"
          >
            Close
          </button>
        </div>
      )}

      {/* Notifications Dropdown */}
      {showNotificationsDrawer && (
        <div className="max-w-6xl mx-auto mt-3 p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recent Notifications</h3>
            <button onClick={() => setShowNotificationsDrawer(false)} className="p-1 text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-600">No new alerts right now. You are up to date.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {notifications.slice(0, 6).map((n) => (
                <div
                  key={n.id}
                  onClick={() => efadoNexusApi.notifications.markAsRead(n.id)}
                  className="p-3 rounded-xl bg-white border border-purple-100 text-sm text-slate-800 cursor-pointer"
                >
                  {n.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );

  // ============================================================================
  // SHARED BOTTOM NAV (Home, Gist, Sell, My Adverts, Profile)
  // ============================================================================
  const renderBottomNav = () => (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 px-2 py-2">
      <div className="max-w-4xl mx-auto grid grid-cols-5 gap-1">
        {[
          { key: 'HOME' as const, label: 'Home', icon: Home, active: false },
          { key: 'GIST' as const, label: 'Gist', icon: MessageSquare, active: true },
          { key: 'SELL' as const, label: 'Sell', icon: ShoppingBag, active: false },
          { key: 'MY_ADVERTS' as const, label: 'My Adverts', icon: LayoutList, active: false },
          { key: 'PROFILE' as const, label: 'Profile', icon: UserIcon, active: false },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => handleBottomNav(item.key)}
              className={`min-h-[48px] py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors ${
                item.active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );

  // ============================================================================
  // FIRST PAGE — DOOR PAGE (clean white background, title, big blue Open My Hub button, 3 pastel cards)
  // ============================================================================
  if (stage === 'DOOR') {
    return (
      <div className="min-h-screen bg-white text-slate-900 pb-24 flex flex-col">
        {renderTopBar()}

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-center space-y-8">
          {/* Middle Hero Box */}
          <section className="p-6 sm:p-10 rounded-3xl bg-sky-50/70 border border-sky-200 text-center space-y-5 shadow-sm">
            <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-snug">
              EFADO Nexus Hub - Chat, Gist and Connect
            </h1>
            <p className="text-base sm:text-lg text-slate-700 max-w-xl mx-auto">
              One place for all your EFADO life.
            </p>

            <div className="pt-2">
              <button
                onClick={handleOpenMyHub}
                className="min-h-[54px] px-8 sm:px-10 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-base sm:text-lg shadow-sm inline-flex items-center justify-center gap-2.5 transition-all"
              >
                <span>Open My Hub</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </section>

          {/* ONLY 3 small pastel cards below button */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => openDedicatedSubpage('connect')}
              className="p-5 rounded-3xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-left flex items-center gap-4 transition-colors min-h-[92px]"
            >
              <div className="w-12 h-12 rounded-2xl bg-sky-200/70 text-sky-800 flex items-center justify-center shrink-0">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">My Chats</h2>
                <p className="text-sm text-slate-600">Private messages, voice notes & calls</p>
              </div>
            </button>

            <button
              onClick={() => openDedicatedSubpage('assembly')}
              className="p-5 rounded-3xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-left flex items-center gap-4 transition-colors min-h-[92px]"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-200/70 text-purple-800 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Group Gist</h2>
                <p className="text-sm text-slate-600">Channels, community groups & polls</p>
              </div>
            </button>

            <button
              onClick={() => openDedicatedSubpage('vibes')}
              className="p-5 rounded-3xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-left flex items-center gap-4 transition-colors min-h-[92px]"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-200/70 text-rose-800 flex items-center justify-center shrink-0">
                <Film className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Reels</h2>
                <p className="text-sm text-slate-600">Short videos, music & creator rewards</p>
              </div>
            </button>
          </section>
        </main>

        {renderBottomNav()}
      </div>
    );
  }

  // ============================================================================
  // SECOND PAGE — SUPER HUB PAGE (after clicking "Open My Hub")
  // ============================================================================
  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24">
      {renderTopBar()}

      {/* Top Connected Status Strip */}
      <div className="bg-emerald-50 border-b border-emerald-200 px-4 sm:px-6 py-2.5">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm sm:text-base font-semibold text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>All Connected - 6 integrations active</span>
          </div>
          <button
            onClick={() => setStage('DOOR')}
            className="text-sm font-semibold text-emerald-800 hover:underline"
          >
            Back to Door Page
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
        <HubGuideNote guideId="nexus" variant="light" />
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT SIDEBAR: Hub Integrations - Manage your EFADO apps */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Hub Integrations - Manage your EFADO apps
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">
                Tap any EFADO app below to open its full workspace.
              </p>
            </div>

            <div className="space-y-3">
              {NEXUS_INTEGRATIONS.map((app) => {
                const Icon = INTEGRATION_ICONS[app.id];
                return (
                  <button
                    key={app.id}
                    onClick={() => openDedicatedSubpage(app.id)}
                    className={`w-full text-left p-4 rounded-2xl border ${app.cardBg} ${app.cardBorder} hover:shadow-sm transition-all flex items-start gap-3.5`}
                  >
                    <div className={`w-11 h-11 rounded-xl ${app.iconBg} flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">
                          {app.name}
                        </h3>
                        <ArrowRight className={`w-4 h-4 shrink-0 ${app.accentText}`} />
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 leading-snug">
                        {app.shortDesc}
                      </p>
                      <p className={`text-xs font-bold pt-0.5 ${app.accentText}`}>
                        Opens a complete new page
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* MAIN AREA: Top Tabs, Stories row, Publish Gist box, Live Feed */}
        <section className="lg:col-span-8 space-y-5">
          {/* Top Tabs: For You, Following, Trending, Marketplace, Live Now */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'FOR_YOU' as const, label: 'For You' },
              { id: 'FOLLOWING' as const, label: 'Following' },
              { id: 'TRENDING' as const, label: 'Trending' },
              { id: 'MARKETPLACE' as const, label: 'Marketplace' },
              { id: 'LIVE_NOW' as const, label: 'Live Now' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFeedTab(t.id)}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap border transition-colors ${
                  feedTab === t.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-sky-50 text-slate-800 border-sky-200 hover:bg-sky-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Stories Row */}
          <div className="p-4 rounded-3xl bg-purple-50 border border-purple-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Stories</h3>
              <button
                onClick={() => setShowStoryModal(true)}
                className="min-h-[36px] px-3 py-1 rounded-xl bg-purple-600 text-white text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Story</span>
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1">
              {stories.map((st) => (
                <div
                  key={st.id}
                  onClick={() => openDedicatedSubpage('moments')}
                  className="w-32 shrink-0 p-2.5 rounded-2xl bg-white border border-purple-200 cursor-pointer space-y-1.5"
                >
                  {st.mediaUrl ? (
                    <img src={st.mediaUrl} alt={st.caption} className="w-full h-20 rounded-xl object-cover" />
                  ) : (
                    <div className="w-full h-20 rounded-xl bg-purple-100 p-2 flex items-center justify-center text-center text-xs font-medium text-purple-900">
                      {String(st.caption || '').slice(0, 48)}
                    </div>
                  )}
                  <p className="text-xs font-bold text-slate-900 truncate">{st.ownerName || st.authorName}</p>
                </div>
              ))}
              {stories.length === 0 && (
                <p className="text-sm text-slate-600 py-2">
                  No stories yet today. Tap "Add Story" to share a quick update!
                </p>
              )}
            </div>
          </div>

          {feedActionMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center justify-between">
              <span>{feedActionMsg}</span>
              <button onClick={() => setFeedActionMsg(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Publish Gist Box (Photo, Video, Poll, Event, Publish) */}
          <form onSubmit={handlePublish} className="p-5 rounded-3xl bg-sky-50 border border-sky-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Share Gist</h3>
            <textarea
              rows={3}
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              placeholder={`What is happening today, ${user.displayName?.split(' ')[0] || 'friend'}?`}
              className="w-full p-3.5 rounded-2xl bg-white border border-sky-200 text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />

            {composerMedia.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {composerMedia.map((m, idx) =>
                  m.type === 'video' ? (
                    <video key={idx} src={m.url} controls className="h-32 rounded-xl" />
                  ) : (
                    <img key={idx} src={m.url} alt="Upload preview" className="h-32 rounded-xl object-cover" />
                  )
                )}
              </div>
            )}

            {showPollBox && (
              <div className="p-3.5 rounded-2xl bg-white border border-sky-200 space-y-2">
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Poll question..."
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={pollOpt1}
                    onChange={(e) => setPollOpt1(e.target.value)}
                    placeholder="Option 1"
                    className="min-h-[42px] px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                  />
                  <input
                    type="text"
                    value={pollOpt2}
                    onChange={(e) => setPollOpt2(e.target.value)}
                    placeholder="Option 2"
                    className="min-h-[42px] px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                  />
                </div>
              </div>
            )}

            {showEventBox && (
              <div className="p-3.5 rounded-2xl bg-white border border-sky-200 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Event title"
                  className="min-h-[42px] px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                />
                <input
                  type="text"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  placeholder="When (e.g. Friday 5pm)"
                  className="min-h-[42px] px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                />
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="Where (City or Online)"
                  className="min-h-[42px] px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                />
              </div>
            )}

            {composerError && <p className="text-sm font-medium text-rose-600">{composerError}</p>}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <label className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-slate-700 text-sm font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-sky-100">
                  <ImageIcon className="w-4 h-4 text-sky-600" />
                  <span>Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const url = await compressNexusImage(f);
                      setComposerMedia((prev) => [...prev, { type: 'image', url }]);
                    }}
                  />
                </label>

                <label className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-slate-700 text-sm font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-sky-100">
                  <Video className="w-4 h-4 text-rose-600" />
                  <span>Video</span>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      try {
                        const url = await fileToSafeDataUrl(f, 2000 * 1024);
                        setComposerMedia((prev) => [...prev, { type: 'video', url }]);
                      } catch (err: any) {
                        setComposerError(err?.message || 'Could not load video.');
                      }
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setShowPollBox((v) => !v)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-slate-700 text-sm font-semibold flex items-center gap-1.5 hover:bg-sky-100"
                >
                  <Vote className="w-4 h-4 text-purple-600" />
                  <span>Poll</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowEventBox((v) => !v)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-slate-700 text-sm font-semibold flex items-center gap-1.5 hover:bg-sky-100"
                >
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>Event</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isPublishing}
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{isPublishing ? 'Publishing...' : 'Publish'}</span>
              </button>
            </div>
          </form>

          {/* Feed Body based on selected top tab */}
          {feedTab === 'MARKETPLACE' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {marketListings.map((item) => (
                <div key={item.id} className="p-4 rounded-3xl bg-amber-50/70 border border-amber-200 space-y-2">
                  {item.photos?.[0] && (
                    <img src={item.photos[0]} alt={item.title} className="w-full h-40 rounded-2xl object-cover" />
                  )}
                  <h4 className="text-base font-bold text-slate-900">{item.title}</h4>
                  <p className="text-sm font-bold text-amber-800">₦{Number(item.price || 0).toLocaleString()}</p>
                  <a
                    href={`/advert/${item.slug || item.id}`}
                    className="min-h-[42px] w-full rounded-xl bg-amber-600 text-white text-sm font-semibold flex items-center justify-center"
                  >
                    Open Listing
                  </a>
                </div>
              ))}
              {marketListings.length === 0 && (
                <div className="col-span-full p-6 rounded-3xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
                  No active listings right now. Tap Sell below to post yours!
                </div>
              )}
            </div>
          ) : feedTab === 'LIVE_NOW' ? (
            <div className="space-y-3">
              <div className="p-5 rounded-3xl bg-rose-50 border border-rose-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-base font-bold text-slate-900">Live Rooms Now</h4>
                  <p className="text-sm text-slate-600">Start a live stream or audio room anytime.</p>
                </div>
                <button
                  onClick={() => openDedicatedSubpage('vibes')}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-semibold"
                >
                  Open Live Vibes
                </button>
              </div>
              {liveRooms.map((room) => (
                <div key={room.id} className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{room.title || 'Live Room'}</p>
                    <p className="text-xs text-slate-500">Host: {room.hostName || room.ownerName}</p>
                  </div>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                    {room.status || 'live'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => {
                const likesArr = Array.isArray(post.likes) ? post.likes : [];
                const liked = likesArr.includes(user.uid);
                const commentsArr = Array.isArray(post.comments) ? post.comments : [];

                return (
                  <article key={post.id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0">
                        {String(post.authorName || post.ownerName || 'E').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900">
                          {post.authorName || post.ownerName || 'EFADO Member'}
                        </h4>
                        <p className="text-xs text-slate-500">{formatRelativeTime(post.createdAt)}</p>
                      </div>
                    </div>

                    <p className="text-sm sm:text-base text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {post.content}
                    </p>

                    {post.event && (
                      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                        <p className="text-sm font-bold text-amber-900">{post.event.title}</p>
                        <p className="text-xs text-amber-800">{post.event.date} · {post.event.location}</p>
                      </div>
                    )}

                    {Array.isArray(post.media) &&
                      post.media.map((m: any, idx: number) =>
                        m.type === 'video' ? (
                          <video key={idx} src={m.url} controls className="w-full max-h-80 rounded-2xl bg-slate-100" />
                        ) : (
                          <img key={idx} src={m.url} alt="Post attachment" className="w-full max-h-96 rounded-2xl object-cover" />
                        )
                      )}

                    {post.poll && Array.isArray(post.poll.options) && (
                      <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 space-y-2">
                        <p className="text-sm font-bold text-slate-900">{post.poll.question}</p>
                        {post.poll.options.map((opt: any, idx: number) => {
                          const votes = Array.isArray(opt.votes) ? opt.votes : [];
                          const voted = votes.includes(user.uid);
                          return (
                            <button
                              key={idx}
                              onClick={() =>
                                efadoNexusApi.feed
                                  .votePoll(user, post.id, post.poll, idx)
                                  .catch((e) => setFeedActionMsg(e.message))
                              }
                              className={`w-full min-h-[40px] px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                                voted ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-800 border-purple-200'
                              }`}
                            >
                              <span>{opt.label}</span>
                              <span>{votes.length} votes</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Like, Comment, Share */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() =>
                          efadoNexusApi.feed
                            .toggleLikePost(user, post.id, liked)
                            .catch((e) => setFeedActionMsg(e.message))
                        }
                        className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border ${
                          liked
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Heart className="w-4 h-4" />
                        <span>Like ({likesArr.length})</span>
                      </button>

                      <button
                        onClick={() =>
                          setOpenCommentsId((cur) => (cur === post.id ? null : post.id))
                        }
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-100"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Comment ({commentsArr.length})</span>
                      </button>

                      <button
                        onClick={async () => {
                          await efadoNexusApi.feed.sharePost(post.id);
                          const url = `${window.location.origin}/hub/nexus-hub/gist-world`;
                          try {
                            if (navigator.share) {
                              await navigator.share({ title: 'EFADO Gist', text: String(post.content || '').slice(0, 120), url });
                            } else {
                              await navigator.clipboard?.writeText(url);
                              setFeedActionMsg('Post link copied to share!');
                            }
                          } catch {}
                        }}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-100"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Share ({Number(post.shares || 0)})</span>
                      </button>
                    </div>

                    {openCommentsId === post.id && (
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                        {commentsArr.map((c: any, ci: number) => (
                          <div key={c.id || ci} className="p-2.5 rounded-xl bg-white border border-slate-200">
                            <p className="text-xs font-bold text-slate-900">{c.authorName || c.user}</p>
                            <p className="text-sm text-slate-700">{c.text}</p>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={commentInputs[post.id] || ''}
                            onChange={(e) =>
                              setCommentInputs((p) => ({ ...p, [post.id]: e.target.value }))
                            }
                            placeholder="Write a comment..."
                            className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-sm"
                          />
                          <button
                            onClick={async () => {
                              try {
                                await efadoNexusApi.feed.addComment(user, post.id, commentInputs[post.id] || '');
                                setCommentInputs((p) => ({ ...p, [post.id]: '' }));
                              } catch (err: any) {
                                setFeedActionMsg(err?.message || 'Not sent, please try again.');
                              }
                            }}
                            className="min-h-[40px] px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}

              {filteredPosts.length === 0 && (
                <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center text-sm text-slate-600">
                  No posts yet. Write something friendly above and tap Publish!
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Quick Add Story Modal (clean white pastel dialog) */}
      {showStoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white border border-purple-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Share a Story</h3>
              <button onClick={() => setShowStoryModal(false)} className="p-1 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              value={storyCaption}
              onChange={(e) => setStoryCaption(e.target.value)}
              placeholder="Write your story update..."
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm"
            />
            <label className="min-h-[44px] px-4 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer">
              <ImageIcon className="w-4 h-4" />
              <span>{storyPhoto ? 'Photo Selected' : 'Add Photo (Optional)'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) setStoryPhoto(await compressNexusImage(f));
                }}
              />
            </label>
            <button
              onClick={async () => {
                try {
                  await efadoNexusApi.stories.createStory(user, {
                    caption: storyCaption,
                    mediaUrl: storyPhoto,
                  });
                  setStoryCaption('');
                  setStoryPhoto('');
                  setShowStoryModal(false);
                  setFeedActionMsg('Story shared!');
                } catch (err: any) {
                  setFeedActionMsg(err?.message || 'Not sent, please try again.');
                }
              }}
              className="w-full min-h-[46px] rounded-xl bg-purple-600 text-white font-semibold text-sm"
            >
              Publish Story
            </button>
          </div>
        </div>
      )}

      {renderBottomNav()}
    </div>
  );
};
