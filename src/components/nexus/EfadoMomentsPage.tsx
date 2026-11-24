import React, { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  Bookmark,
  Camera,
  Compass,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  Send,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { db, collection, doc, limit, onSnapshot, query, where } from '../../firebase';
import { UserProfile } from '../../types';
import { efadoNexusApi } from '../../services/efadoNexusApi';
import { compressNexusImage, formatRelativeTime } from './nexusTypes';

interface EfadoMomentsPageProps {
  user: UserProfile;
  onBack: () => void;
}

type MomentsTab = 'PHOTOS' | 'STORIES' | 'EXPLORE' | 'CLOSE_FRIENDS' | 'ARCHIVES' | 'DIRECT' | 'SAVED';

export const EfadoMomentsPage: React.FC<EfadoMomentsPageProps> = ({ user, onBack }) => {
  const [activeTab, setActiveTab] = useState<MomentsTab>('PHOTOS');
  const [moments, setMoments] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [closeFriends, setCloseFriends] = useState<string[]>([]);
  const [newFriendInput, setNewFriendInput] = useState('');

  // Upload Moment form
  const [photoUrl, setPhotoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [highlightTitle, setHighlightTitle] = useState('');
  const [audience, setAudience] = useState<'public' | 'close_friends' | 'archive'>('public');
  const [publishing, setPublishing] = useState(false);

  // Comments & Direct Moments chat
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [directMsgs, setDirectMsgs] = useState<any[]>([]);
  const [directText, setDirectText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsubMoments = onSnapshot(query(collection(db, 'nexus_moments'), limit(100)), (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setMoments(items);
    });

    const unsubStories = onSnapshot(query(collection(db, 'nexus_stories'), limit(50)), (snap) => {
      setStories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubDirect = onSnapshot(
      query(collection(db, 'gist_chat_messages'), where('roomId', '==', 'moments-direct'), limit(50)),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a: any, b: any) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
        setDirectMsgs(list);
      }
    );

    let unsubUser: (() => void) | undefined;
    if (user?.uid && user.uid !== 'guest-preview') {
      unsubUser = onSnapshot(doc(db, 'users', user.uid), (snap) => {
        if (snap.exists()) {
          const cf = snap.data()?.closeFriends;
          if (Array.isArray(cf)) setCloseFriends(cf);
        }
      });
    }

    return () => {
      unsubMoments();
      unsubStories();
      unsubDirect();
      unsubUser?.();
    };
  }, [user?.uid]);

  const displayedMoments = useMemo(() => {
    return moments.filter((m) => {
      if (activeTab === 'ARCHIVES') return m.status === 'archived' && m.userId === user.uid;
      if (activeTab === 'SAVED') return Array.isArray(m.savedBy) && m.savedBy.includes(user.uid);
      if (activeTab === 'CLOSE_FRIENDS') return m.audience === 'close_friends';
      if (activeTab === 'EXPLORE') return m.status !== 'archived' && m.audience === 'public';
      return m.status !== 'archived';
    });
  }, [moments, activeTab, user.uid]);

  const handleUploadMoment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishing(true);
    setFeedback(null);
    try {
      await efadoNexusApi.moments.createMoment(user, {
        photoUrl,
        caption,
        audience,
        highlightTitle,
      });
      setPhotoUrl('');
      setCaption('');
      setHighlightTitle('');
      setFeedback('Your Moment has been saved!');
    } catch (err: any) {
      setFeedback(err?.message || 'Not sent, please try again.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-purple-100 px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-semibold text-sm flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Hub</span>
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">EFADO Moments</h1>
              <p className="text-xs text-slate-600">Photos, stories, highlights, close friends & saved memories</p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'PHOTOS', label: 'Photos', icon: ImageIcon },
              { id: 'STORIES', label: 'Stories & Highlights', icon: Sparkles },
              { id: 'EXPLORE', label: 'Explore', icon: Compass },
              { id: 'CLOSE_FRIENDS', label: 'Close Friends', icon: Users },
              { id: 'ARCHIVES', label: 'Archives', icon: Archive },
              { id: 'DIRECT', label: 'Moments Chat', icon: MessageCircle },
              { id: 'SAVED', label: 'Saved', icon: Bookmark },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as MomentsTab)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap flex items-center gap-1.5 border ${
                    activeTab === t.id
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-purple-50 text-purple-900 border-purple-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {feedback && (
          <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-sm flex items-center justify-between">
            <span>{feedback}</span>
            <button onClick={() => setFeedback(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Share a Photo Moment */}
        {(activeTab === 'PHOTOS' || activeTab === 'STORIES') && (
          <form onSubmit={handleUploadMoment} className="p-5 rounded-3xl bg-purple-50 border border-purple-200 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Share a Photo Moment</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="min-h-[48px] px-4 py-3 rounded-2xl bg-white border border-purple-200 text-sm font-semibold text-purple-800 flex items-center justify-center gap-2 cursor-pointer">
                <Camera className="w-5 h-5" />
                <span>{photoUrl ? 'Photo Ready' : 'Pick Photo from Phone / PC'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) setPhotoUrl(await compressNexusImage(f));
                  }}
                />
              </label>

              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as any)}
                className="min-h-[48px] px-4 py-2 rounded-2xl bg-white border border-purple-200 text-sm font-medium"
              >
                <option value="public">Visible to Everyone</option>
                <option value="close_friends">Close Friends Only</option>
                <option value="archive">Save Private in Archive</option>
              </select>
            </div>

            {photoUrl && <img src={photoUrl} alt="Moment preview" className="h-44 rounded-2xl object-cover border border-purple-200" />}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a story or caption..."
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-purple-200 text-sm"
              />
              <input
                type="text"
                value={highlightTitle}
                onChange={(e) => setHighlightTitle(e.target.value)}
                placeholder="Highlight album name (optional)"
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-purple-200 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={publishing}
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm"
            >
              {publishing ? 'Saving...' : 'Share Moment'}
            </button>
          </form>
        )}

        {activeTab === 'STORIES' && (
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stories.map((st) => (
              <div key={st.id} className="p-3 rounded-2xl bg-pink-50 border border-pink-200 space-y-2">
                {st.mediaUrl && <img src={st.mediaUrl} alt={st.caption} className="w-full h-32 rounded-xl object-cover" />}
                <p className="text-xs font-bold text-slate-900 truncate">{st.ownerName || st.authorName}</p>
                <p className="text-xs text-slate-700 line-clamp-2">{st.caption}</p>
              </div>
            ))}
          </section>
        )}

        {activeTab === 'CLOSE_FRIENDS' && (
          <section className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Your Close Friends List</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={newFriendInput}
                onChange={(e) => setNewFriendInput(e.target.value)}
                placeholder="Add a close friend name or phone..."
                className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-white border border-emerald-200 text-sm"
              />
              <button
                onClick={async () => {
                  if (!newFriendInput.trim()) return;
                  try {
                    await efadoNexusApi.moments.toggleCloseFriend(user, newFriendInput.trim(), false);
                    setNewFriendInput('');
                    setFeedback('Added to Close Friends!');
                  } catch (err: any) {
                    setFeedback(err?.message || 'Not sent, please try again.');
                  }
                }}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold"
              >
                Add Friend
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {closeFriends.map((f) => (
                <button
                  key={f}
                  onClick={() => efadoNexusApi.moments.toggleCloseFriend(user, f, true)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-emerald-200 text-sm font-medium flex items-center gap-2"
                >
                  <span>{f}</span>
                  <X className="w-3.5 h-3.5 text-rose-500" />
                </button>
              ))}
              {closeFriends.length === 0 && <p className="text-sm text-slate-600">No close friends added yet.</p>}
            </div>
          </section>
        )}

        {activeTab === 'DIRECT' && (
          <section className="p-5 rounded-3xl bg-sky-50 border border-sky-200 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Direct Moments Replies</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {directMsgs.map((m) => (
                <div key={m.id} className="p-3 rounded-2xl bg-white border border-sky-100">
                  <p className="text-xs font-bold text-sky-900">{m.senderName || m.ownerName}</p>
                  <p className="text-sm text-slate-800">{m.content}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={directText}
                onChange={(e) => setDirectText(e.target.value)}
                placeholder="Send a message about a moment..."
                className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-white border border-sky-200 text-sm"
              />
              <button
                onClick={async () => {
                  try {
                    await efadoNexusApi.connect.sendMessage(user, {
                      roomId: 'moments-direct',
                      content: directText,
                    });
                    setDirectText('');
                  } catch (err: any) {
                    setFeedback(err?.message || 'Not sent, please try again.');
                  }
                }}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-sky-600 text-white text-sm font-semibold flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </div>
          </section>
        )}

        {/* Photo Moments Grid */}
        {activeTab !== 'DIRECT' && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedMoments.map((m) => {
              const liked = Array.isArray(m.likes) && m.likes.includes(user.uid);
              const saved = Array.isArray(m.savedBy) && m.savedBy.includes(user.uid);
              return (
                <article key={m.id} className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
                  <div>
                    <img src={m.photoUrl} alt={m.caption} className="w-full h-56 object-cover bg-purple-50" />
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-slate-900">{m.ownerName || m.authorName}</p>
                        <span className="text-xs text-slate-500">{formatRelativeTime(m.createdAt)}</span>
                      </div>
                      {m.highlightTitle && (
                        <span className="inline-block text-xs font-semibold text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded-lg">
                          Highlight: {m.highlightTitle}
                        </span>
                      )}
                      <p className="text-sm text-slate-700">{m.caption}</p>
                    </div>
                  </div>
                  <div className="px-4 pb-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => efadoNexusApi.moments.toggleLikeMoment(user, m.id, liked).catch((e) => setFeedback(e.message))}
                        className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border ${
                          liked ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <Heart className="w-4 h-4" />
                        <span>{(m.likes || []).length}</span>
                      </button>
                      <button
                        onClick={() => efadoNexusApi.moments.toggleSaveMoment(user, m.id, saved).catch((e) => setFeedback(e.message))}
                        className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border ${
                          saved ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <Bookmark className="w-4 h-4" />
                        <span>{saved ? 'Saved' : 'Save'}</span>
                      </button>
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={commentDrafts[m.id] || ''}
                        onChange={(e) => setCommentDrafts((p) => ({ ...p, [m.id]: e.target.value }))}
                        placeholder="Add comment..."
                        className="flex-1 min-h-[38px] px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      />
                      <button
                        onClick={async () => {
                          try {
                            await efadoNexusApi.moments.addMomentComment(user, m.id, commentDrafts[m.id] || '');
                            setCommentDrafts((p) => ({ ...p, [m.id]: '' }));
                          } catch (err: any) {
                            setFeedback(err?.message || 'Not sent, please try again.');
                          }
                        }}
                        className="min-h-[38px] px-3 py-1 rounded-xl bg-purple-600 text-white text-xs font-semibold"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
            {displayedMoments.length === 0 && (
              <div className="col-span-full p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center text-sm text-slate-600">
                No photo moments in this view yet. Upload one above!
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};
