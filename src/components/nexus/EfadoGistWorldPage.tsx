import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Bookmark,
  Calendar,
  Flag,
  Heart,
  Image as ImageIcon,
  Layers,
  MapPin,
  MessageCircle,
  Plus,
  Radio,
  Search,
  Send,
  Share2,
  ShoppingBag,
  Tv,
  Users,
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
} from '../../firebase';
import { UserProfile } from '../../types';
import { efadoNexusApi } from '../../services/efadoNexusApi';
import {
  REACTION_LIST,
  ReactionKey,
  compressNexusImage,
  formatRelativeTime,
} from './nexusTypes';

interface EfadoGistWorldPageProps {
  user: UserProfile;
  onBack: () => void;
  initialTab?: string;
}

type WorldTab =
  | 'FEED'
  | 'GROUPS'
  | 'PAGES'
  | 'EVENTS'
  | 'MARKETPLACE'
  | 'LIVE'
  | 'SAVED'
  | 'NOTIFICATIONS'
  | 'STORIES'
  | 'WATCH'
  | 'FRIENDS';

export const EfadoGistWorldPage: React.FC<EfadoGistWorldPageProps> = ({
  user,
  onBack,
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState<WorldTab>(
    initialTab === 'GROUPS' ? 'GROUPS' : 'FEED'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [liveRooms, setLiveRooms] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Post Composer State
  const [postText, setPostText] = useState('');
  const [postCategory, setPostCategory] = useState('GENERAL');
  const [postImage, setPostImage] = useState('');
  const [showPollFields, setShowPollFields] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOpt1, setPollOpt1] = useState('');
  const [pollOpt2, setPollOpt2] = useState('');
  const [showEventFields, setShowEventFields] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [composerError, setComposerError] = useState<string | null>(null);
  const [composerStatus, setComposerStatus] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Comments inline drawer per post
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Create Group & Page modals/panels
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupCat, setNewGroupCat] = useState('Community');
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageCat, setNewPageCat] = useState('Business');
  const [newPageBio, setNewPageBio] = useState('');
  const [newStoryCaption, setNewStoryCaption] = useState('');
  const [newStoryPhoto, setNewStoryPhoto] = useState('');

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(
      onSnapshot(query(collection(db, 'social_posts'), limit(150)), (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        items.sort((a: any, b: any) => {
          const ta = a.createdAt?.seconds || (a.createdAtIso ? Date.parse(a.createdAtIso) / 1000 : 0);
          const tb = b.createdAt?.seconds || (b.createdAtIso ? Date.parse(b.createdAtIso) / 1000 : 0);
          return tb - ta;
        });
        setPosts(items);
      })
    );

    unsubs.push(
      onSnapshot(query(collection(db, 'gist_groups'), limit(80)), (snap) => {
        setGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      })
    );

    unsubs.push(
      onSnapshot(query(collection(db, 'nexus_pages'), limit(80)), (snap) => {
        setPages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      })
    );

    unsubs.push(
      onSnapshot(query(collection(db, 'nexus_stories'), limit(60)), (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        items.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setStories(items);
      })
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'ad_listings'), where('status', '==', 'active'), limit(40)),
        (snap) => {
          setListings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      )
    );

    unsubs.push(
      onSnapshot(query(collection(db, 'gist_live_rooms'), limit(30)), (snap) => {
        setLiveRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      })
    );

    if (user?.uid && user.uid !== 'guest-preview') {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'efado_notifications'), where('userId', '==', user.uid), limit(40)),
          (snap) => {
            setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          }
        )
      );
    }

    return () => unsubs.forEach((u) => u());
  }, [user?.uid]);

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return posts.filter((p) => {
      if (activeTab === 'SAVED') {
        if (!Array.isArray(p.savedBy) || !p.savedBy.includes(user.uid)) return false;
      }
      if (activeTab === 'EVENTS') {
        if (!p.event) return false;
      }
      if (activeTab === 'WATCH') {
        const hasVideo = Array.isArray(p.media) && p.media.some((m: any) => m.type === 'video');
        if (!hasVideo && !String(p.content || '').toLowerCase().includes('video')) return false;
      }
      if (!q) return true;
      return (
        String(p.content || '').toLowerCase().includes(q) ||
        String(p.authorName || p.ownerName || '').toLowerCase().includes(q) ||
        String(p.category || '').toLowerCase().includes(q)
      );
    });
  }, [posts, searchQuery, activeTab, user.uid]);

  const discoveredFriends = useMemo(() => {
    const map = new Map<string, { uid: string; name: string; photo?: string; postsCount: number }>();
    posts.forEach((p) => {
      const uid = p.authorId || p.userId;
      if (!uid || uid === user.uid) return;
      const existing = map.get(uid);
      map.set(uid, {
        uid,
        name: p.authorName || p.ownerName || 'EFADO Member',
        photo: p.authorPhoto || '',
        postsCount: (existing?.postsCount || 0) + 1,
      });
    });
    return Array.from(map.values());
  }, [posts, user.uid]);

  const handlePhotoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressNexusImage(file);
      setPostImage(compressed);
    } catch {
      setComposerError('Could not process the selected photo.');
    }
  };

  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setComposerError(null);
    setComposerStatus(null);
    setIsPublishing(true);
    try {
      const pollPayload =
        showPollFields && pollQuestion.trim() && pollOpt1.trim() && pollOpt2.trim()
          ? {
              question: pollQuestion.trim(),
              options: [
                { label: pollOpt1.trim(), votes: [] },
                { label: pollOpt2.trim(), votes: [] },
              ],
            }
          : undefined;
      const eventPayload =
        showEventFields && eventTitle.trim()
          ? {
              title: eventTitle.trim(),
              date: eventDate.trim() || 'Upcoming',
              location: eventLocation.trim() || 'EFADO Online',
            }
          : undefined;

      await efadoNexusApi.feed.createPost(user, {
        content: postText,
        category: postCategory,
        media: postImage ? [{ type: 'image', url: postImage }] : [],
        poll: pollPayload,
        event: eventPayload,
      });

      setPostText('');
      setPostImage('');
      setShowPollFields(false);
      setPollQuestion('');
      setPollOpt1('');
      setPollOpt2('');
      setShowEventFields(false);
      setEventTitle('');
      setEventDate('');
      setEventLocation('');
      setComposerStatus('Your post is live on EFADO Gist World.');
    } catch (err: any) {
      setComposerError(err?.message || 'Not sent, please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleReact = async (post: any, reaction: ReactionKey) => {
    try {
      await efadoNexusApi.feed.reactToPost(user, post.id, reaction, post.reactions || {});
    } catch (err: any) {
      setActionMsg(err?.message || 'Not sent, please try again.');
    }
  };

  const handleSendComment = async (postId: string) => {
    const text = (commentDrafts[postId] || '').trim();
    if (!text) return;
    try {
      await efadoNexusApi.feed.addComment(user, postId, text);
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
    } catch (err: any) {
      setActionMsg(err?.message || 'Not sent, please try again.');
    }
  };

  const handleShare = async (post: any) => {
    await efadoNexusApi.feed.sharePost(post.id);
    const shareUrl = `${window.location.origin}/hub/nexus-hub/gist-world`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'EFADO Gist World',
          text: String(post.content || '').slice(0, 120),
          url: shareUrl,
        });
      } else {
        await navigator.clipboard?.writeText(shareUrl);
        setActionMsg('Post link copied so you can share it anywhere.');
      }
    } catch {}
  };

  const navTabs: Array<{ id: WorldTab; label: string; icon: any }> = [
    { id: 'FEED', label: 'Feed', icon: MessageCircle },
    { id: 'STORIES', label: 'Stories', icon: ImageIcon },
    { id: 'GROUPS', label: 'Groups', icon: Users },
    { id: 'PAGES', label: 'Pages', icon: Flag },
    { id: 'EVENTS', label: 'Events', icon: Calendar },
    { id: 'MARKETPLACE', label: 'Marketplace Gist', icon: ShoppingBag },
    { id: 'LIVE', label: 'Live Feed', icon: Radio },
    { id: 'WATCH', label: 'Watch', icon: Tv },
    { id: 'FRIENDS', label: 'Friends', icon: Users },
    { id: 'SAVED', label: 'Saved Posts', icon: Bookmark },
    { id: 'NOTIFICATIONS', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-sky-100 px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-semibold text-sm flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Hub</span>
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">EFADO Gist World</h1>
              <p className="text-xs text-slate-600">Community feed, groups, pages, events & stories</p>
            </div>
          </div>

          <div className="relative flex-1 min-w-[210px] max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search gist, people, groups..."
              className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-400"
            />
          </div>
        </div>

        {/* Sub-feature Tabs */}
        <div className="max-w-5xl mx-auto mt-3 flex items-center gap-2 overflow-x-auto pb-1">
          {navTabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap flex items-center gap-1.5 border transition-colors ${
                  active
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-sky-50/70 text-slate-700 border-sky-100 hover:bg-sky-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {actionMsg && (
          <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-sm flex items-center justify-between">
            <span>{actionMsg}</span>
            <button onClick={() => setActionMsg(null)} className="p-1 text-sky-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stories Strip on Feed & Stories tabs */}
        {(activeTab === 'FEED' || activeTab === 'STORIES') && (
          <section className="p-4 sm:p-5 rounded-3xl bg-purple-50 border border-purple-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Community Stories</h2>
              <span className="text-xs font-medium text-purple-700">{stories.length} active</span>
            </div>

            {activeTab === 'STORIES' && (
              <div className="p-4 rounded-2xl bg-white border border-purple-200 space-y-3">
                <input
                  type="text"
                  value={newStoryCaption}
                  onChange={(e) => setNewStoryCaption(e.target.value)}
                  placeholder="Share a quick story update with everyone..."
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <label className="min-h-[44px] px-3.5 py-2 rounded-xl bg-purple-100 text-purple-800 text-sm font-semibold flex items-center gap-2 cursor-pointer">
                    <ImageIcon className="w-4 h-4" />
                    <span>{newStoryPhoto ? 'Photo Ready' : 'Add Story Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) setNewStoryPhoto(await compressNexusImage(f));
                      }}
                    />
                  </label>
                  <button
                    onClick={async () => {
                      try {
                        await efadoNexusApi.stories.createStory(user, {
                          caption: newStoryCaption,
                          mediaUrl: newStoryPhoto,
                        });
                        setNewStoryCaption('');
                        setNewStoryPhoto('');
                        setActionMsg('Your story is now live!');
                      } catch (err: any) {
                        setActionMsg(err?.message || 'Not sent, please try again.');
                      }
                    }}
                    className="min-h-[44px] px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold"
                  >
                    Share Story
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3 overflow-x-auto pb-1">
              {stories.length === 0 ? (
                <div className="text-sm text-slate-600 py-2">
                  No stories yet today. Be the first to share a story in the Stories tab!
                </div>
              ) : (
                stories.map((st) => (
                  <div
                    key={st.id}
                    className="w-36 shrink-0 rounded-2xl bg-white border border-purple-200 p-3 flex flex-col justify-between gap-2 shadow-sm"
                  >
                    {st.mediaUrl ? (
                      <img src={st.mediaUrl} alt={st.caption} className="w-full h-24 rounded-xl object-cover" />
                    ) : (
                      <div className="w-full h-24 rounded-xl bg-purple-100 flex items-center justify-center p-2 text-center text-xs font-medium text-purple-900">
                        {st.caption?.slice(0, 60)}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-900 truncate">{st.ownerName || st.authorName}</p>
                      <p className="text-[11px] text-slate-500">{formatRelativeTime(st.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Composer on FEED & EVENTS */}
        {(activeTab === 'FEED' || activeTab === 'EVENTS') && (
          <form
            onSubmit={handlePublishPost}
            className="p-4 sm:p-6 rounded-3xl bg-sky-50 border border-sky-200 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900">Write Gist or Announcement</h2>
              <select
                value={postCategory}
                onChange={(e) => setPostCategory(e.target.value)}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-sky-200 text-sm font-medium text-slate-800"
              >
                <option value="GENERAL">General Gist</option>
                <option value="BUSINESS">Business & Trade</option>
                <option value="TECH">Tech & Ideas</option>
                <option value="FAMILY">Family & Faith</option>
                <option value="LOCAL">Local News</option>
              </select>
            </div>

            <textarea
              rows={3}
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder={`Share something helpful with the community, ${user.displayName || 'friend'}...`}
              className="w-full p-3.5 rounded-2xl bg-white border border-sky-200 text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />

            {postImage && (
              <div className="relative inline-block">
                <img src={postImage} alt="Preview" className="h-36 rounded-2xl object-cover border border-sky-200" />
                <button
                  type="button"
                  onClick={() => setPostImage('')}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-white text-slate-800 shadow"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {showPollFields && (
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
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                  />
                  <input
                    type="text"
                    value={pollOpt2}
                    onChange={(e) => setPollOpt2(e.target.value)}
                    placeholder="Option 2"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                  />
                </div>
              </div>
            )}

            {showEventFields && (
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
                  placeholder="Date & time (e.g. Sat 4pm)"
                  className="min-h-[42px] px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                />
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="Location or Online link"
                  className="min-h-[42px] px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                />
              </div>
            )}

            {composerError && <p className="text-sm font-medium text-rose-600">{composerError}</p>}
            {composerStatus && <p className="text-sm font-medium text-emerald-700">{composerStatus}</p>}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <label className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-slate-700 text-sm font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-sky-100">
                  <ImageIcon className="w-4 h-4 text-sky-600" />
                  <span>Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoPick} />
                </label>
                <button
                  type="button"
                  onClick={() => setShowPollFields((v) => !v)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-slate-700 text-sm font-semibold flex items-center gap-1.5 hover:bg-sky-100"
                >
                  <Vote className="w-4 h-4 text-purple-600" />
                  <span>Poll</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowEventFields((v) => !v)}
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
        )}

        {/* GROUPS TAB */}
        {activeTab === 'GROUPS' && (
          <section className="space-y-4">
            <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 space-y-3">
              <h2 className="text-base font-bold text-slate-900">Create a Gist Group</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Group name"
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-emerald-200 text-sm"
                />
                <input
                  type="text"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Short description"
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-emerald-200 text-sm"
                />
                <button
                  onClick={async () => {
                    try {
                      await efadoNexusApi.feed.createGroup(user, newGroupName, newGroupDesc, newGroupCat);
                      setNewGroupName('');
                      setNewGroupDesc('');
                      setActionMsg('Group created successfully.');
                    } catch (err: any) {
                      setActionMsg(err?.message || 'Not sent, please try again.');
                    }
                  }}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Group</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((grp) => {
                const isMember = Array.isArray(grp.members) && grp.members.includes(user.uid);
                return (
                  <div
                    key={grp.id}
                    className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-bold text-slate-900">{grp.name}</h3>
                        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                          {grp.memberCount || (grp.members?.length || 1)} members
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{grp.description}</p>
                    </div>
                    <button
                      onClick={() => efadoNexusApi.feed.joinGroup(user, grp.id, isMember).catch((e) => setActionMsg(e.message))}
                      className={`min-h-[44px] px-4 py-2 rounded-xl font-semibold text-sm ${
                        isMember
                          ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {isMember ? 'Joined Group' : 'Join Group'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* PAGES TAB */}
        {activeTab === 'PAGES' && (
          <section className="space-y-4">
            <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 space-y-3">
              <h2 className="text-base font-bold text-slate-900">Create a Public Page</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  placeholder="Page name (brand, ministry, club)"
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-amber-200 text-sm"
                />
                <input
                  type="text"
                  value={newPageBio}
                  onChange={(e) => setNewPageBio(e.target.value)}
                  placeholder="What is your page about?"
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-amber-200 text-sm"
                />
                <button
                  onClick={async () => {
                    try {
                      await efadoNexusApi.feed.createPage(user, newPageTitle, newPageCat, newPageBio);
                      setNewPageTitle('');
                      setNewPageBio('');
                      setActionMsg('Your Page is now live.');
                    } catch (err: any) {
                      setActionMsg(err?.message || 'Not sent, please try again.');
                    }
                  }}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm"
                >
                  Launch Page
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pages.map((pg) => {
                const isFollowing = Array.isArray(pg.followers) && pg.followers.includes(user.uid);
                return (
                  <div key={pg.id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900">{pg.title}</h3>
                      <span className="text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg">
                        {(pg.followers?.length || 1)} followers
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{pg.bio}</p>
                    <button
                      onClick={() => efadoNexusApi.feed.toggleFollowPage(user, pg.id, isFollowing).catch((e) => setActionMsg(e.message))}
                      className={`min-h-[44px] w-full rounded-xl font-semibold text-sm ${
                        isFollowing ? 'bg-slate-100 text-slate-800' : 'bg-amber-600 text-white'
                      }`}
                    >
                      {isFollowing ? 'Following Page' : 'Follow Page'}
                    </button>
                  </div>
                );
              })}
              {pages.length === 0 && (
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
                  No pages created yet. Start the first EFADO Page above!
                </div>
              )}
            </div>
          </section>
        )}

        {/* MARKETPLACE GIST TAB */}
        {activeTab === 'MARKETPLACE' && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((item) => (
              <div key={item.id} className="p-4 rounded-3xl bg-orange-50/70 border border-orange-200 space-y-3 flex flex-col justify-between">
                <div>
                  {item.photos?.[0] && (
                    <img src={item.photos[0]} alt={item.title} className="w-full h-40 rounded-2xl object-cover mb-3" />
                  )}
                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">{item.title}</h3>
                  <p className="text-sm font-bold text-orange-700 mt-0.5">₦{Number(item.price || 0).toLocaleString()}</p>
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{item.city || item.state || 'Nigeria'}</span>
                  </p>
                </div>
                <a
                  href={`/advert/${item.slug || item.id}`}
                  className="min-h-[44px] w-full rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm flex items-center justify-center"
                >
                  View Item Details
                </a>
              </div>
            ))}
            {listings.length === 0 && (
              <div className="col-span-full p-6 rounded-3xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
                No active marketplace listings right now. Check back soon or publish via Sell!
              </div>
            )}
          </section>
        )}

        {/* LIVE FEED TAB */}
        {activeTab === 'LIVE' && (
          <section className="space-y-4">
            <div className="p-5 rounded-3xl bg-rose-50 border border-rose-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Live Broadcasts & Audio Rooms</h2>
                <p className="text-sm text-slate-600">Go live with community members right inside EFADO Gist World.</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    await efadoNexusApi.connect.startCallRoom(user, {
                      title: `${user.displayName || 'Member'} Live Stream`,
                      callType: 'live',
                    });
                    setActionMsg('Your Live room is now open!');
                  } catch (err: any) {
                    setActionMsg(err?.message || 'Not sent, please try again.');
                  }
                }}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm flex items-center gap-2"
              >
                <Radio className="w-4 h-4" />
                <span>Start Live Now</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {liveRooms.map((room) => (
                <div key={room.id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                      {room.status === 'live' ? 'Live Now' : 'Recent Room'}
                    </span>
                    <span className="text-xs text-slate-500">{formatRelativeTime(room.createdAt)}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{room.title || room.hostName}</h3>
                  <p className="text-sm text-slate-600">Hosted by {room.hostName || room.ownerName}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FRIENDS TAB */}
        {activeTab === 'FRIENDS' && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {discoveredFriends.map((friend) => (
              <div key={friend.uid} className="p-5 rounded-3xl bg-indigo-50/60 border border-indigo-200 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-lg shrink-0">
                  {friend.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{friend.name}</p>
                  <p className="text-xs text-slate-600">{friend.postsCount} community updates</p>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'NOTIFICATIONS' && (
          <section className="space-y-3">
            {notifications.length === 0 ? (
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
                You are all caught up! New reactions, replies, and mentions appear here.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => efadoNexusApi.notifications.markAsRead(n.id)}
                  className={`p-4 rounded-2xl border cursor-pointer ${
                    n.isRead ? 'bg-white border-slate-200' : 'bg-sky-50 border-sky-200'
                  }`}
                >
                  <p className="text-sm font-medium text-slate-900">{n.message}</p>
                  <p className="text-xs text-slate-500 mt-1">{formatRelativeTime(n.createdAt)}</p>
                </div>
              ))
            )}
          </section>
        )}

        {/* POSTS FEED (shown on FEED, STORIES, EVENTS, WATCH, SAVED) */}
        {(activeTab === 'FEED' ||
          activeTab === 'STORIES' ||
          activeTab === 'EVENTS' ||
          activeTab === 'WATCH' ||
          activeTab === 'SAVED') && (
          <section className="space-y-4">
            {filteredPosts.map((post) => {
              const reactionsMap: Record<string, string[]> = post.reactions || {};
              const myReaction = REACTION_LIST.find((r) => reactionsMap[r.key]?.includes(user.uid));
              const isSaved = Array.isArray(post.savedBy) && post.savedBy.includes(user.uid);
              const commentsList = Array.isArray(post.comments) ? post.comments : [];

              return (
                <article
                  key={post.id}
                  className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-800 font-bold flex items-center justify-center shrink-0">
                        {String(post.authorName || post.ownerName || 'E').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">
                          {post.authorName || post.ownerName || 'EFADO Member'}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {formatRelativeTime(post.createdAt)} · {post.category || 'GENERAL'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        efadoNexusApi.feed
                          .toggleSavePost(user, post.id, isSaved)
                          .catch((e) => setActionMsg(e.message))
                      }
                      className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border ${
                        isSaved
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <Bookmark className="w-4 h-4" />
                      <span>{isSaved ? 'Saved' : 'Save'}</span>
                    </button>
                  </div>

                  <p className="text-sm sm:text-base text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {post.content}
                  </p>

                  {post.event && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                      <p className="text-sm font-bold text-amber-900">Event: {post.event.title}</p>
                      <p className="text-xs text-amber-800">
                        {post.event.date} · {post.event.location}
                      </p>
                    </div>
                  )}

                  {Array.isArray(post.media) &&
                    post.media.map((m: any, idx: number) =>
                      m.type === 'video' ? (
                        <video key={idx} src={m.url} controls className="w-full max-h-80 rounded-2xl bg-slate-100" />
                      ) : (
                        <img key={idx} src={m.url} alt="Post attachment" className="w-full max-h-96 rounded-2xl object-cover border border-slate-100" />
                      )
                    )}

                  {post.poll && Array.isArray(post.poll.options) && (
                    <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-2">
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
                                .catch((e) => setActionMsg(e.message))
                            }
                            className={`w-full min-h-[42px] px-3.5 py-2 rounded-xl border text-sm font-medium flex items-center justify-between ${
                              voted
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'bg-white text-slate-800 border-purple-200 hover:bg-purple-100'
                            }`}
                          >
                            <span>{opt.label}</span>
                            <span className="text-xs font-bold">{votes.length} votes</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Reactions Bar */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                    {REACTION_LIST.map((r) => {
                      const count = (reactionsMap[r.key] || []).length + (r.key === 'Like' && Array.isArray(post.likes) ? post.likes.length : 0);
                      const isSelected = myReaction?.key === r.key;
                      return (
                        <button
                          key={r.key}
                          onClick={() => handleReact(post, r.key)}
                          className={`min-h-[38px] px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-colors ${
                            isSelected
                              ? 'bg-sky-100 border-sky-300 text-sky-900'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span>{r.emoji}</span>
                          <span>{r.key}</span>
                          {count > 0 && <span className="font-bold">({count})</span>}
                        </button>
                      );
                    })}

                    <button
                      onClick={() =>
                        setOpenCommentsPostId((cur) => (cur === post.id ? null : post.id))
                      }
                      className="min-h-[38px] px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 ml-auto"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Comment ({commentsList.length})</span>
                    </button>

                    <button
                      onClick={() => handleShare(post)}
                      className="min-h-[38px] px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share ({Number(post.shares || 0)})</span>
                    </button>
                  </div>

                  {/* Comments Drawer */}
                  {openCommentsPostId === post.id && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="space-y-2 max-h-56 overflow-y-auto">
                        {commentsList.length === 0 ? (
                          <p className="text-xs text-slate-500">No comments yet. Say hello!</p>
                        ) : (
                          commentsList.map((c: any, ci: number) => (
                            <div key={c.id || ci} className="p-2.5 rounded-xl bg-white border border-slate-200">
                              <p className="text-xs font-bold text-slate-900">{c.authorName || c.user}</p>
                              <p className="text-sm text-slate-700">{c.text}</p>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={commentDrafts[post.id] || ''}
                          onChange={(e) =>
                            setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          placeholder="Write a reply..."
                          className="flex-1 min-h-[42px] px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm"
                        />
                        <button
                          onClick={() => handleSendComment(post.id)}
                          className="min-h-[42px] px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-semibold"
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
                No matching posts here yet. Share the first update above!
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};
