import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Coins,
  Film,
  Flame,
  Heart,
  MessageCircle,
  Music,
  Radio,
  Share2,
  Sparkles,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { db, collection, limit, onSnapshot, query } from '../../firebase';
import { UserProfile } from '../../types';
import { ReelFeed } from '../ReelFeed';
import { efadoNexusApi } from '../../services/efadoNexusApi';
import { fileToSafeDataUrl, formatRelativeTime } from './nexusTypes';

interface EfadoVibesPageProps {
  user: UserProfile;
  onBack: () => void;
  creatorStats?: any;
}

const SOUND_CHOICES = [
  'Original Sound',
  'Afrobeats Happy Groove',
  'Lagos Market Hustle Beat',
  'Calm Acoustic Harmony',
  'Celebration Drums',
];

const FILTER_CHOICES = [
  'Natural Bright',
  'Warm Sunshine',
  'Clean Studio Glow',
  'Pastel Soft',
];

export const EfadoVibesPage: React.FC<EfadoVibesPageProps> = ({
  user,
  onBack,
  creatorStats,
}) => {
  const [activeTab, setActiveTab] = useState<'FOR_YOU' | 'TRENDING' | 'LIVE' | 'STUDIO' | 'EARNINGS'>('FOR_YOU');
  const [reels, setReels] = useState<any[]>([]);
  const [liveRooms, setLiveRooms] = useState<any[]>([]);

  // Creator Studio Upload state
  const [caption, setCaption] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [soundTitle, setSoundTitle] = useState(SOUND_CHOICES[0]);
  const [filterName, setFilterName] = useState(FILTER_CHOICES[0]);
  const [duetFrom, setDuetFrom] = useState('');
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsubReels = onSnapshot(query(collection(db, 'reels'), limit(80)), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a: any, b: any) => (b.likes?.length || 0) - (a.likes?.length || 0));
      setReels(data);
    });
    const unsubLive = onSnapshot(query(collection(db, 'gist_live_rooms'), limit(20)), (snap) => {
      setLiveRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => {
      unsubReels();
      unsubLive();
    };
  }, []);

  const totalViews = useMemo(
    () => reels.reduce((acc, r) => acc + Number(r.views || 1), 0),
    [reels]
  );

  const handleVideoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const url = await fileToSafeDataUrl(f, 2500 * 1024);
      setVideoUrl(url);
    } catch (err: any) {
      setStatusMsg(err?.message || 'Could not load that video file.');
    }
  };

  const handlePublishVibe = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setStatusMsg(null);
    try {
      await efadoNexusApi.vibes.publishVibe(user, {
        caption,
        videoUrl,
        soundTitle,
        filterName,
        duetFrom,
      });
      setCaption('');
      setVideoUrl('');
      setDuetFrom('');
      setStatusMsg('Your short video is live on EFADO Vibes!');
      setActiveTab('FOR_YOU');
    } catch (err: any) {
      setStatusMsg(err?.message || 'Not sent, please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-rose-100 px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-semibold text-sm flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Hub</span>
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">EFADO Vibes</h1>
              <p className="text-xs text-slate-600">Short videos, music, duets, live streams & creator earnings</p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'FOR_YOU', label: 'For You', icon: Film },
              { id: 'TRENDING', label: 'Trending', icon: Flame },
              { id: 'LIVE', label: 'Live Vibes', icon: Radio },
              { id: 'STUDIO', label: 'Create Vibe', icon: Upload },
              { id: 'EARNINGS', label: 'Creator Earnings', icon: Coins },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap flex items-center gap-1.5 border ${
                    activeTab === t.id
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-rose-50 text-rose-900 border-rose-200'
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
        {statusMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-sm flex items-center justify-between">
            <span>{statusMsg}</span>
            <button onClick={() => setStatusMsg(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {activeTab === 'FOR_YOU' && (
          <div className="space-y-6">
            <div className="p-4 sm:p-5 rounded-3xl bg-rose-50 border border-rose-200">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Watch Short Videos</h2>
                  <p className="text-xs text-slate-600">Swipe up or tap arrows to enjoy creator videos</p>
                </div>
                <button
                  onClick={() => setActiveTab('STUDIO')}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-semibold"
                >
                  + Upload Short Video
                </button>
              </div>
              <div className="max-w-md mx-auto rounded-3xl overflow-hidden border border-rose-200 shadow-sm">
                <ReelFeed
                  user={user}
                  onOpenCreator={() => setActiveTab('STUDIO')}
                  onLike={(id) => {
                    const target = reels.find((r) => r.id === id);
                    const liked = Array.isArray(target?.likes) && target.likes.includes(user.uid);
                    efadoNexusApi.vibes.toggleLikeVibe(user, id, liked).catch((e) => setStatusMsg(e.message));
                  }}
                  onShare={(item) => efadoNexusApi.vibes.shareVibe(item.id)}
                  onTip={() => setActiveTab('EARNINGS')}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'TRENDING' && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reels.map((reel) => {
              const liked = Array.isArray(reel.likes) && reel.likes.includes(user.uid);
              return (
                <div key={reel.id} className="p-5 rounded-3xl bg-purple-50/70 border border-purple-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{reel.authorName || reel.ownerName || 'Creator'}</h3>
                      <p className="text-xs text-slate-500">
                        {reel.soundTitle || 'Original Sound'} · {reel.filterName || 'Bright'}
                      </p>
                    </div>
                    {reel.duetFrom && (
                      <span className="text-xs font-semibold text-purple-800 bg-white px-2.5 py-1 rounded-lg border border-purple-200">
                        Duet with {reel.duetFrom}
                      </span>
                    )}
                  </div>
                  {reel.videoUrl && (
                    <video src={reel.videoUrl} controls className="w-full h-56 rounded-2xl bg-slate-100 object-cover" />
                  )}
                  <p className="text-sm text-slate-800">{reel.caption}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => efadoNexusApi.vibes.toggleLikeVibe(user, reel.id, liked).catch((e) => setStatusMsg(e.message))}
                      className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border ${
                        liked ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      <Heart className="w-4 h-4" />
                      <span>{(reel.likes || []).length}</span>
                    </button>
                    <button
                      onClick={() => {
                        setDuetFrom(reel.authorName || 'Creator');
                        setActiveTab('STUDIO');
                      }}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1"
                    >
                      <Users className="w-4 h-4 text-purple-600" />
                      <span>Duet / Remix</span>
                    </button>
                    <button
                      onClick={() => efadoNexusApi.vibes.shareVibe(reel.id)}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share ({reel.shares || 0})</span>
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={commentText[reel.id] || ''}
                      onChange={(e) => setCommentText((p) => ({ ...p, [reel.id]: e.target.value }))}
                      placeholder="Write a comment..."
                      className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs"
                    />
                    <button
                      onClick={async () => {
                        try {
                          await efadoNexusApi.vibes.addVibeComment(user, reel.id, commentText[reel.id] || '');
                          setCommentText((p) => ({ ...p, [reel.id]: '' }));
                        } catch (err: any) {
                          setStatusMsg(err?.message || 'Not sent, please try again.');
                        }
                      }}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-semibold"
                    >
                      Post
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {activeTab === 'STUDIO' && (
          <form onSubmit={handlePublishVibe} className="p-6 rounded-3xl bg-rose-50 border border-rose-200 space-y-4 max-w-2xl mx-auto">
            <h2 className="text-lg font-bold text-slate-900">Create a Short Video Vibe</h2>
            {duetFrom && (
              <div className="p-3 rounded-2xl bg-white border border-rose-200 flex items-center justify-between text-sm">
                <span>Duetting with: <strong>{duetFrom}</strong></span>
                <button type="button" onClick={() => setDuetFrom('')} className="text-rose-600 font-semibold">Clear</button>
              </div>
            )}
            <label className="block p-5 rounded-2xl bg-white border-2 border-dashed border-rose-300 text-center cursor-pointer hover:bg-rose-50/50">
              <Upload className="w-7 h-7 text-rose-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">
                {videoUrl ? 'Video attached and ready!' : 'Tap to choose a short video from your device'}
              </p>
              <input type="file" accept="video/*" className="hidden" onChange={handleVideoPick} />
            </label>

            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a fun title or caption..."
              className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-white border border-rose-200 text-sm"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Music className="w-3.5 h-3.5 text-rose-600" /> Music & Sound
                </label>
                <select
                  value={soundTitle}
                  onChange={(e) => setSoundTitle(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-rose-200 text-sm"
                >
                  {SOUND_CHOICES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Visual Filter
                </label>
                <select
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-rose-200 text-sm"
                >
                  {FILTER_CHOICES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full min-h-[48px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-base"
            >
              {uploading ? 'Publishing...' : 'Publish to EFADO Vibes'}
            </button>
          </form>
        )}

        {activeTab === 'LIVE' && (
          <section className="space-y-4">
            <div className="p-5 rounded-3xl bg-sky-50 border border-sky-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Go Live on EFADO Vibes</h2>
                <p className="text-sm text-slate-600">Host live music, shows, or product demos with viewers.</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    await efadoNexusApi.connect.startCallRoom(user, {
                      title: `${user.displayName || 'Creator'} Live Vibe`,
                      callType: 'live',
                    });
                    setStatusMsg('Live Vibe started!');
                  } catch (err: any) {
                    setStatusMsg(err?.message || 'Not sent, please try again.');
                  }
                }}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-sky-600 text-white text-sm font-semibold"
              >
                Start Live Vibe
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {liveRooms.map((r) => (
                <div key={r.id} className="p-5 rounded-3xl bg-white border border-slate-200 space-y-1">
                  <span className="text-xs font-bold text-rose-600">{r.status === 'live' ? 'Live Now' : 'Ended'}</span>
                  <h3 className="text-base font-bold text-slate-900">{r.title}</h3>
                  <p className="text-xs text-slate-500">Creator: {r.hostName || r.ownerName} · {formatRelativeTime(r.createdAt)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'EARNINGS' && (
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 space-y-1">
              <p className="text-xs font-semibold text-emerald-800">Creator Fund Balance</p>
              <p className="text-2xl font-bold text-slate-900">
                ₦{Number(creatorStats?.earnings || 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-600">₦100 per 1,000 qualified 5s+ views</p>
            </div>
            <div className="p-5 rounded-3xl bg-sky-50 border border-sky-200 space-y-1">
              <p className="text-xs font-semibold text-sky-800">Videos Published</p>
              <p className="text-2xl font-bold text-slate-900">{reels.length}</p>
              <p className="text-xs text-slate-600">Live across EFADO Vibes</p>
            </div>
            <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 space-y-1">
              <p className="text-xs font-semibold text-amber-800">Total Community Views</p>
              <p className="text-2xl font-bold text-slate-900">{totalViews.toLocaleString()}</p>
              <p className="text-xs text-slate-600">Updated automatically</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
