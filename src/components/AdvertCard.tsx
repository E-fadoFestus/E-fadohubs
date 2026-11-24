import React, { useEffect, useState } from 'react';
import {
  Heart,
  MessageSquare,
  Share2,
  MapPin,
  Phone,
  MessageCircle,
  ExternalLink,
  Send,
  Video,
  X,
} from 'lucide-react';
import {
  db,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from '../firebase';
import { AdListing, AdvertComment, UserProfile } from '../types';
import { useCurrency } from '../lib/CurrencyContext';
import { efadoAdvertApi, getPublicAdvertUrl } from '../services/efadoAdvertApi';
import { findGroupForCategory, getCategoryLabel } from '../constants/advertCategories';
import { AdvertShareBar } from './AdvertShareBar';

interface AdvertCardProps {
  ad: AdListing;
  user?: UserProfile | null;
  onContact?: (ad: AdListing) => void;
  onRequireLogin?: () => void;
  onOpenDetail?: (ad: AdListing) => void;
}

export const AdvertCard: React.FC<AdvertCardProps> = ({
  ad,
  user,
  onContact,
  onRequireLogin,
  onOpenDetail,
}) => {
  const { formatPrice } = useCurrency();
  const group = findGroupForCategory(ad.category);
  const categoryLabel = getCategoryLabel(ad.category, ad.customCategoryName);
  const publicUrl = getPublicAdvertUrl(ad);

  const likesList = Array.isArray(ad.likes) ? ad.likes : [];
  const isLiked = Boolean(user?.uid && likesList.includes(user.uid));
  const [likePending, setLikePending] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<AdvertComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentSending, setCommentSending] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const [showSharePanel, setShowSharePanel] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!showComments || !ad.id) return;
    const q = query(
      collection(db, 'advert_comments'),
      where('adId', '==', ad.id),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdvertComment)));
      },
      () => {
        // Fallback query without composite index if index not yet created
        const simpleQ = query(collection(db, 'advert_comments'), where('adId', '==', ad.id));
        onSnapshot(simpleQ, (s2) => {
          const list = s2.docs.map((d) => ({ id: d.id, ...d.data() } as AdvertComment));
          list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setComments(list);
        });
      }
    );
    return () => unsub();
  }, [showComments, ad.id]);

  const handleToggleLike = async () => {
    if (!user?.uid) {
      onRequireLogin?.();
      return;
    }
    if (likePending) return;
    setLikePending(true);
    try {
      await efadoAdvertApi.toggleLike(ad.id, user.uid, isLiked);
    } catch (err: any) {
      console.warn('Like notice:', err?.message);
    } finally {
      setLikePending(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) {
      onRequireLogin?.();
      return;
    }
    setCommentError(null);
    setCommentSending(true);
    try {
      await efadoAdvertApi.addComment(ad.id, user, commentText);
      setCommentText('');
    } catch (err: any) {
      setCommentError(err?.message || 'Not sent, please try again.');
    } finally {
      setCommentSending(false);
    }
  };

  const handleNativeOrToggleShare = () => {
    setShowSharePanel((prev) => !prev);
  };

  const locationLine = [ad.location?.city, ad.location?.state].filter(Boolean).join(', ');
  const commentCount = Math.max(Number(ad.commentsCount || 0), comments.length);

  return (
    <article
      id={`ad-${ad.id}`}
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full"
    >
      <div>
        {/* Card Media */}
        <a
          href={`/advert/${ad.slug || ad.id}`}
          onClick={(e) => {
            if (onOpenDetail && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
              e.preventDefault();
              onOpenDetail(ad);
            }
          }}
          className="block aspect-[4/3] bg-slate-100 relative overflow-hidden group"
        >
          {ad.photos && ad.photos[0] ? (
            <img
              src={ad.photos[0]}
              alt={ad.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
          ) : (
            <img
              src={group.image}
              alt={categoryLabel}
              className="w-full h-full object-cover opacity-90"
            />
          )}
          {ad.video && (
            <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/80 text-white text-xs font-medium">
              <Video className="w-3.5 h-3.5" /> Video
            </span>
          )}
        </a>

        {/* Clean Metadata + Title + Description */}
        <div className="p-5 space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-600">
            <span className={`px-2.5 py-1 rounded-lg ${group.pillBg}`}>
              {categoryLabel}
            </span>
            <span className="text-slate-500">
              {ad.type === 'SELL' ? 'For Sale' : 'Advert'}
            </span>
          </div>

          <a
            href={`/advert/${ad.slug || ad.id}`}
            onClick={(e) => {
              if (onOpenDetail && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                onOpenDetail(ad);
              }
            }}
            className="block no-underline"
          >
            <h4 className="text-lg font-bold text-slate-900 leading-snug line-clamp-1 hover:text-indigo-700 transition-colors">
              {ad.title}
            </h4>
          </a>

          <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
            {ad.description}
          </p>

          {locationLine && (
            <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 pt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{locationLine}</span>
            </p>
          )}
        </div>
      </div>

      {/* Price + Contact + Like / Comment / Share Bar */}
      <div className="px-5 pb-5 space-y-3">
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div>
            <span className="text-xs text-slate-500 block">Price</span>
            <span className="text-lg font-bold text-slate-900 tabular-nums">
              {Number(ad.price || 0) > 0 ? formatPrice(ad.price) : 'Ask Seller'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {ad.contact?.whatsapp && (
              <a
                href={`https://wa.me/${ad.contact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello! I saw your listing "${ad.title}" on EFADO (${publicUrl}). Is it available?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => (onContact ? onContact(ad) : onOpenDetail?.(ad))}
              className="min-h-[44px] px-4 py-2 bg-slate-900 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              {onContact ? 'Contact' : 'View'}
            </button>
          </div>
        </div>

        {/* Like, Comment, Share Row */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleToggleLike}
            className={`min-h-[44px] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
              isLiked
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
            <span>Like{likesList.length > 0 ? ` (${likesList.length})` : ''}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowComments((p) => !p)}
            className={`min-h-[44px] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
              showComments
                ? 'bg-purple-50 border-purple-200 text-purple-800'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Comment{commentCount > 0 ? ` (${commentCount})` : ''}</span>
          </button>

          <button
            type="button"
            onClick={handleNativeOrToggleShare}
            className={`min-h-[44px] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
              showSharePanel
                ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Share{Number(ad.sharesCount || 0) > 0 ? ` (${ad.sharesCount})` : ''}</span>
          </button>
        </div>

        {/* Expandable Share Drawer */}
        {showSharePanel && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Share this advert</span>
              <button
                type="button"
                onClick={() => setShowSharePanel(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
                aria-label="Close share options"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <AdvertShareBar
              ad={ad}
              compact
              onShared={(_, msg) => {
                if (msg) {
                  setShareFeedback(msg);
                  setTimeout(() => setShareFeedback(null), 3000);
                }
              }}
            />
            {shareFeedback && (
              <p className="text-xs font-medium text-emerald-700">{shareFeedback}</p>
            )}
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:underline pt-1"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open public page
            </a>
          </div>
        )}

        {/* Expandable Real Comments Section */}
        {showComments && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Comments & Questions</span>
              <button
                type="button"
                onClick={() => setShowComments(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
                aria-label="Close comments"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {comments.length > 0 ? (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {comments.map((c, idx) => (
                  <div key={c.id || idx} className="bg-white border border-slate-200 rounded-lg p-2.5">
                    <p className="text-xs font-bold text-slate-900">{c.userName}</p>
                    <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No comments yet. Ask a question about this item.</p>
            )}

            {commentError && (
              <p className="text-xs font-medium text-rose-700">{commentError}</p>
            )}

            <form onSubmit={handlePostComment} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={user ? 'Write a question or comment...' : 'Sign in to leave a comment'}
                className="flex-1 min-h-[44px] px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={commentSending || (Boolean(user) && commentText.trim().length < 2)}
                className="min-h-[44px] px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>

            {ad.contact?.phone && (
              <a
                href={`tel:${ad.contact.phone}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                <Phone className="w-3.5 h-3.5" /> Or call {ad.contact.phone}
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
};
