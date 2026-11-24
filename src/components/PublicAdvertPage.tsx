import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Heart,
  MapPin,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Phone,
  Send,
  Share2,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import {
  db,
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  limit,
  onSnapshot,
} from '../firebase';
import { AdListing, AdvertComment, UserProfile } from '../types';
import { useCurrency } from '../lib/CurrencyContext';
import { getBackendUrl } from '../config/backend';
import { efadoAdvertApi } from '../services/efadoAdvertApi';
import { findGroupForCategory, getCategoryLabel } from '../constants/advertCategories';
import { trackGoogleAdvertView } from '../lib/googleAds';
import { AdvertShareBar } from './AdvertShareBar';
import { EfadoLogo } from './EfadoLogo';

interface PublicAdvertPageProps {
  slugOrId: string;
  user: UserProfile | null;
  onLogin: () => void;
  onNavigateHome: () => void;
  onOpenAdvertise: (mode?: 'ADVERT' | 'SELL') => void;
}

export const PublicAdvertPage: React.FC<PublicAdvertPageProps> = ({
  slugOrId,
  user,
  onLogin,
  onNavigateHome,
  onOpenAdvertise,
}) => {
  const { formatPrice } = useCurrency();
  const [ad, setAd] = useState<AdListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const [comments, setComments] = useState<AdvertComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentSending, setCommentSending] = useState(false);
  const [commentStatus, setCommentStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadAdvert() {
      setLoading(true);
      setNotFound(false);
      try {
        // 1. Try public API endpoint first (works cleanly even when unauthenticated)
        const res = await fetch(getBackendUrl(`/api/adverts/public/${encodeURIComponent(slugOrId)}`));
        const json = await res.json().catch(() => null);
        if (!cancelled && json?.success && json.advert) {
          setAd(json.advert as AdListing);
          setLoading(false);
          return;
        }
      } catch {
        // Fall through to direct Firestore read
      }

      try {
        const directSnap = await getDoc(doc(db, 'ad_listings', slugOrId));
        if (!cancelled && directSnap.exists()) {
          setAd({ id: directSnap.id, ...directSnap.data() } as AdListing);
          setLoading(false);
          return;
        }

        const slugQ = query(collection(db, 'ad_listings'), where('slug', '==', slugOrId), limit(1));
        const slugSnap = await getDocs(slugQ);
        if (!cancelled && !slugSnap.empty) {
          const d = slugSnap.docs[0];
          setAd({ id: d.id, ...d.data() } as AdListing);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Public advert lookup error:', err);
      }

      if (!cancelled) {
        setNotFound(true);
        setLoading(false);
      }
    }

    loadAdvert();
    return () => {
      cancelled = true;
    };
  }, [slugOrId]);

  useEffect(() => {
    if (!ad?.id) return;

    // Live sync for likes, shares, comments count
    const unsubAd = onSnapshot(doc(db, 'ad_listings', ad.id), (snap) => {
      if (snap.exists()) {
        setAd({ id: snap.id, ...snap.data() } as AdListing);
      }
    });

    // Live comments listener
    const qComments = query(collection(db, 'advert_comments'), where('adId', '==', ad.id));
    const unsubComments = onSnapshot(qComments, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdvertComment));
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setComments(list);
    });

    // Update page SEO title and fire legal view tracking & remarketing event
    document.title = `${ad.title} | EFADO Marketplace`;
    void efadoAdvertApi.trackView(ad.id);
    trackGoogleAdvertView({
      id: ad.id,
      title: ad.title,
      category: ad.category,
      price: Number(ad.price || 0),
    });

    return () => {
      unsubAd();
      unsubComments();
    };
  }, [ad?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mb-4" />
        <p className="text-base font-semibold text-slate-700">Opening advert details...</p>
      </div>
    );
  }

  if (notFound || !ad) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center space-y-5">
        <EfadoLogo size="md" />
        <h1 className="text-2xl font-bold text-slate-900">This advert is no longer available</h1>
        <p className="text-base text-slate-600 max-w-md">
          The seller may have finished or removed this listing. Explore active offers across EFADO.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={onNavigateHome}
            className="min-h-[44px] px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold text-sm cursor-pointer"
          >
            Go to EFADO Home
          </button>
          <button
            type="button"
            onClick={() => onOpenAdvertise('ADVERT')}
            className="min-h-[44px] px-6 py-3 bg-purple-100 text-purple-900 rounded-xl font-semibold text-sm cursor-pointer"
          >
            Post an Advert
          </button>
        </div>
      </div>
    );
  }

  const group = findGroupForCategory(ad.category);
  const categoryLabel = getCategoryLabel(ad.category, ad.customCategoryName);
  const photos = ad.photos?.length ? ad.photos : [group.image];
  const likesList = Array.isArray(ad.likes) ? ad.likes : [];
  const isLiked = Boolean(user?.uid && likesList.includes(user.uid));

  const handleToggleLike = async () => {
    if (!user?.uid) {
      onLogin();
      return;
    }
    try {
      await efadoAdvertApi.toggleLike(ad.id, user.uid, isLiked);
    } catch {}
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) {
      onLogin();
      return;
    }
    setCommentStatus(null);
    setCommentSending(true);
    try {
      await efadoAdvertApi.addComment(ad.id, user, commentText);
      setCommentText('');
      setCommentStatus('Comment posted.');
    } catch (err: any) {
      setCommentStatus(err?.message || 'Not sent, please try again.');
    } finally {
      setCommentSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Clean Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onNavigateHome}
            className="min-h-[44px] inline-flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 font-semibold text-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>EFADO Home</span>
          </button>

          <div className="flex items-center gap-2">
            <EfadoLogo size="sm" />
            <span className="font-bold text-slate-900 text-sm sm:text-base hidden sm:inline">
              EFADO Hubs Connect
            </span>
          </div>

          <button
            type="button"
            onClick={() => (user ? onOpenAdvertise('ADVERT') : onLogin())}
            className="min-h-[44px] px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold cursor-pointer"
          >
            {user ? 'Post Your Advert' : 'Sign In / Join'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Gallery + Video */}
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-[4/3] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
              <img
                src={photos[activePhotoIdx] || photos[0]}
                alt={ad.title}
                className="w-full h-full object-cover"
              />
            </div>

            {photos.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {photos.map((photo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      activePhotoIdx === idx ? 'border-indigo-600' : 'border-slate-200 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={photo} alt={`${ad.title} photo ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {ad.video && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950">
                <video src={ad.video} controls playsInline className="w-full max-h-[380px]" />
              </div>
            )}
          </div>

          {/* Right Column: Price, Location, Seller Contact */}
          <div className="lg:col-span-5 space-y-5">
            <div className={`p-6 rounded-2xl border ${group.cardBg} ${group.cardBorder} space-y-4`}>
              <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                <span className={`px-3 py-1 rounded-lg ${group.pillBg}`}>{categoryLabel}</span>
                <span className="text-slate-600">{ad.type === 'SELL' ? 'For Sale' : 'Advert'}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                {ad.title}
              </h1>

              <div>
                <p className="text-xs font-medium text-slate-600">Price</p>
                <p className="text-3xl font-bold text-slate-900 tabular-nums mt-0.5">
                  {Number(ad.price || 0) > 0 ? formatPrice(ad.price) : 'Contact Seller'}
                </p>
              </div>

              <div className="pt-3 border-t border-black/10 space-y-2 text-sm text-slate-700">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  <span>
                    {[ad.location?.address, ad.location?.city, ad.location?.state].filter(Boolean).join(', ')}
                  </span>
                </div>
                {ad.ownerName && (
                  <p className="text-sm text-slate-700">
                    Posted by <span className="font-semibold text-slate-900">{ad.ownerName}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {ad.contact?.whatsapp && (
                  <a
                    href={`https://wa.me/${ad.contact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello! I saw your advert "${ad.title}" on EFADO (${window.location.href}).`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[48px] px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat on WhatsApp</span>
                  </a>
                )}
                {ad.contact?.phone && (
                  <a
                    href={`tel:${ad.contact.phone}`}
                    className="min-h-[48px] px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call {ad.contact.phone}</span>
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Meet in a safe public place or verify items before paying.</span>
              </div>
            </div>

            {/* Like + Views Summary */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleToggleLike}
                className={`min-h-[44px] px-4 py-2 rounded-xl border text-sm font-semibold flex items-center gap-2 cursor-pointer ${
                  isLiked
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
                <span>Like ({likesList.length})</span>
              </button>

              <div className="text-xs font-medium text-slate-600 flex items-center gap-4">
                <span>{Number(ad.viewsCount || 0)} views</span>
                <span>{Number(ad.sharesCount || 0)} shares</span>
              </div>
            </div>
          </div>
        </div>

        {/* Full Description & Details */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-3">
              <h2 className="text-lg font-bold text-slate-900">About This {ad.type === 'SELL' ? 'Item' : 'Advert'}</h2>
              <p className="text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {ad.description}
              </p>

              {ad.details && Object.keys(ad.details).length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                  {Object.entries(ad.details)
                    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
                    .map(([key, val]) => (
                      <div key={key} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-xs text-slate-500 capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </p>
                        <p className="text-sm font-semibold text-slate-900 mt-0.5">{String(val)}</p>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <span>Comments ({comments.length})</span>
              </h2>

              <form onSubmit={handleCommentSubmit} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={user ? 'Ask a question or leave a comment...' : 'Sign in to post a comment'}
                  className="flex-1 min-h-[44px] px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={commentSending}
                  className="min-h-[44px] px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{user ? 'Send' : 'Sign In'}</span>
                </button>
              </form>

              {commentStatus && (
                <p className="text-sm font-medium text-indigo-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{commentStatus}</span>
                </p>
              )}

              <div className="space-y-3">
                {comments.length === 0 ? (
                  <p className="text-sm text-slate-500">No comments yet. Be the first to ask a question.</p>
                ) : (
                  comments.map((c, idx) => (
                    <div key={c.id || idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <p className="text-sm font-semibold text-slate-900">{c.userName}</p>
                      <p className="text-sm text-slate-700 mt-1">{c.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Share Everywhere & Promote CTA */}
          <div className="lg:col-span-5 space-y-5">
            <div className="p-6 bg-purple-50 border border-purple-200 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-purple-800" />
                <h2 className="text-lg font-bold text-purple-950">Share This Listing</h2>
              </div>
              <p className="text-sm text-purple-900">
                Help friends or buyers find this offer by sharing it directly.
              </p>
              <AdvertShareBar ad={ad} />
            </div>

            <div className="p-6 bg-blue-50 border border-blue-200 rounded-2xl space-y-4">
              <h2 className="text-lg font-bold text-blue-950">Want to Promote or Sell on EFADO?</h2>
              <p className="text-sm text-blue-900 leading-relaxed">
                Reach thousands of buyers across EFADO, WhatsApp, and Google Search in 3 simple steps.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onOpenAdvertise('ADVERT')}
                  className="min-h-[44px] px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Megaphone className="w-4 h-4" />
                  <span>Advertise</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAdvertise('SELL')}
                  className="min-h-[44px] px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Sell Item</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
