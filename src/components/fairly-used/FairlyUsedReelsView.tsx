import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Film,
  Loader2,
  MapPin,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  ThumbsUp
} from 'lucide-react';
import type { FairlyUsedReel } from '../../types/fairlyUsedMarket';
import { fetchFairlyUsedReels, formatNaira, likeProductVideo } from './fairlyUsedApi';

interface FairlyUsedReelsViewProps {
  onBack: () => void;
  onBuyThis: (productId: string) => void;
  onChatSeller: (reel: FairlyUsedReel) => void;
  onShowToast: (msg: string) => void;
}

export const FairlyUsedReelsView: React.FC<FairlyUsedReelsViewProps> = ({
  onBack,
  onBuyThis,
  onChatSeller,
  onShowToast
}) => {
  const [reels, setReels] = useState<FairlyUsedReel[]>([]);
  const [loading, setLoading] = useState(true);
  const [likingId, setLikingId] = useState<string | null>(null);

  const loadReels = async () => {
    setLoading(true);
    try {
      const res = await fetchFairlyUsedReels();
      setReels(res.reels || []);
    } catch {
      setReels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReels();
  }, []);

  const handleLikeReelVideo = async (reel: FairlyUsedReel) => {
    setLikingId(reel.productId);
    try {
      const res = await likeProductVideo(reel.productId);
      setReels((prev) =>
        prev.map((r) =>
          r.productId === reel.productId
            ? {
                ...r,
                videoLikesCount: res.product.videoLikesCount,
                likedVideoByMe: res.product.likedVideoByMe
              }
            : r
        )
      );
      onShowToast('Liked / Buyer Confirmed Video!');
    } catch (err: any) {
      onShowToast(err?.message || 'Sign in to confirm this video.');
    } finally {
      setLikingId(null);
    }
  };

  return (
    <div className="max-w-[900px] mx-auto px-3 sm:px-6 pt-4 pb-28 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-xl bg-white border border-pink-200 text-black hover:bg-pink-50 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-black flex items-center gap-2 mb-0">
              <Film className="w-5 h-5 text-[#2563EB]" />
              <span>E-FADO Reels</span>
            </h2>
            <p className="text-xs text-black/70 mb-0">
              Watch real seller proof videos before you buy • Tap LIKE to confirm item working
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-pink-200 p-12 text-center text-xs text-black/70">
          <Loader2 className="w-6 h-6 animate-spin text-[#2563EB] mx-auto mb-2" />
          Loading E-FADO Reels...
        </div>
      ) : reels.length === 0 ? (
        <div className="bg-white rounded-2xl border border-pink-200 p-12 text-center space-y-3">
          <Film className="w-10 h-10 text-purple-300 mx-auto" />
          <h3 className="text-base font-bold text-black">No Video Reels Yet</h3>
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl bg-[#F59E0B] text-black text-xs font-black"
          >
            Back to Fairly Used Market
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reels.map((reel) => (
            <div
              key={reel.id}
              className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div className="relative bg-slate-900">
                <video
                  src={reel.videoUrl}
                  poster={reel.posterUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-64 object-cover bg-slate-900"
                />
                <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 pointer-events-none">
                  <span className="px-2.5 py-1 rounded-lg bg-[#F59E0B] text-black text-[10px] font-black shadow">
                    Grade {reel.conditionGrade}
                  </span>
                  {reel.reasonForSelling === 'Relocating Abroad' && (
                    <span className="px-2.5 py-1 rounded-lg bg-[#DC2626] text-white text-[10px] font-black shadow">
                      RELOCATION SALE - Must Go Fast
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {reel.videoLikesCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-100 text-[#16A34A] text-[10px] font-extrabold">
                      <ThumbsUp className="w-3 h-3" />
                      Liked / Buyer Confirmed Video ({reel.videoLikesCount})
                    </span>
                  )}
                  {reel.keptInEfadoStore && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-[#2563EB] text-[10px] font-extrabold">
                      <BadgeCheck className="w-3 h-3" />
                      Verified By EFADO - In Store
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-black leading-snug mb-1">{reel.productName}</h3>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg font-black text-[#2563EB] tabular-nums">
                      {formatNaira(reel.price)}
                    </span>
                    <span className="text-[11px] font-bold text-black/70 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#2563EB]" />
                      {reel.sellerLocation}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-black/70 mb-0">
                    Seller: {reel.sellerName} • <strong className="text-[#2563EB]">{reel.sellerEfadoId}</strong>
                  </p>
                </div>

                <div className="bg-green-50 border border-[#16A34A]/25 rounded-xl px-3 py-2 text-[11px] font-bold text-[#16A34A] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>EFADO Protects Your Money • Secured by EFADO Shield</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={likingId === reel.productId}
                    onClick={() => handleLikeReelVideo(reel)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 border ${
                      reel.likedVideoByMe
                        ? 'bg-green-100 text-[#16A34A] border-[#16A34A]/40'
                        : 'bg-white text-black border-pink-200 hover:bg-green-50'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>LIKE ({reel.videoLikesCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChatSeller(reel)}
                    className="py-2.5 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2563EB] border border-[#2563EB]/30 text-xs font-extrabold flex items-center justify-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>EFADO Chat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onBuyThis(reel.productId)}
                    className="py-2.5 px-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-black text-xs font-black flex items-center justify-center gap-1 shadow-sm"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Buy This</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
