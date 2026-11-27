import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Bell,
  Building2,
  Camera,
  CheckCircle2,
  FileCheck2,
  Handshake,
  Home,
  ImagePlus,
  Loader2,
  MessageCircle,
  Mic,
  MicOff,
  Package,
  Phone,
  Plus,
  PlusCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Square,
  Store,
  TrendingDown,
  Trash2,
  UserCheck,
  UserPlus,
  Video,
  VideoOff,
  Wallet
} from 'lucide-react';
import {
  createFairlyUsedProduct,
  fetchAdminVendorApplications,
  fetchChatMessages,
  fetchFairlyUsedAlerts,
  fetchFairlyUsedProducts,
  fetchMyChatThreads,
  fetchMyOrders,
  fetchSellerOrders,
  fetchSellerProfile,
  formatNaira,
  refundDisputedOrder,
  registerVendorApplication,
  relistFairlyUsedProduct,
  resolveVendorBankAccount,
  reviewAdminVendorApplication,
  saveSellerProfile,
  sendChatMessage,
  submitOffer,
  submitProductReview,
  updateProductPrice,
  updateSellerOrderShipping
} from './fairlyUsedApi';
import type {
  AdminVendorApplication,
  BulkListingItem,
  ConditionGrade,
  DeliveryOption,
  FairlyUsedAlert,
  FairlyUsedCategory,
  FairlyUsedChatMessage,
  FairlyUsedChatThread,
  FairlyUsedOrder,
  FairlyUsedProduct,
  HouseDocType,
  ListingMode,
  ReasonForSelling,
  SellerProfilePrivate,
  SellerType,
  VendorIdType
} from '../../types/fairlyUsedMarket';

const SAMPLE_PHOTOS: Array<{ label: string; url: string }> = [
  { label: 'Phone Front/Back', url: '/assets/market/iphone_13_pro_max.jpg' },
  { label: 'Laptop Booting', url: '/assets/market/macbook_pro_14.jpg' },
  { label: 'PS5 Console', url: '/assets/market/ps5_console.jpg' },
  { label: 'Espresso Appliance', url: '/assets/market/espresso_maker.jpg' },
  { label: 'Watch Detail', url: '/assets/market/smartwatch_ultra.jpg' },
  { label: 'Headphones', url: '/assets/market/sony_headphones.jpg' }
];

const DEMO_WORKING_VIDEOS: Array<{ label: string; url: string }> = [
  { label: 'iPhone Boot & FaceID Demo', url: '/assets/fairly-used/demo_iphone.mp4' },
  { label: 'MacBook Booting Demo', url: '/assets/fairly-used/demo_macbook.mp4' },
  { label: 'PS5 Gameplay Proof', url: '/assets/fairly-used/demo_ps5.mp4' },
  { label: 'Appliance Power-ON Demo', url: '/assets/fairly-used/demo_appliance.mp4' },
  { label: 'Watch Screen Demo', url: '/assets/fairly-used/demo_watch.mp4' }
];

const CATEGORIES: Array<Exclude<FairlyUsedCategory, 'All'>> = [
  'Phones',
  'Laptops',
  'Electronics & TV',
  'Home Appliances',
  'Furniture',
  'Vehicles',
  'Houses & Land',
  'Fashion & Luxury',
  'Business Bulk',
  'Gaming'
];

const SELLER_TYPES: Array<{ id: SellerType; label: string; desc: string }> = [
  { id: 'single', label: 'Single Person', desc: 'Selling personal used item' },
  { id: 'business_closing', label: 'Business Closing Down', desc: 'Bulk stock & equipment clearance' },
  { id: 'house_land', label: 'House / Land Seller', desc: 'Rooms, land size & title papers' },
  { id: 'dealer', label: 'Dealer', desc: 'Pre-owned electronics / goods trader' }
];

const HOUSE_DOCS: HouseDocType[] = ['C of O', 'Deed', 'Survey', 'Receipt'];

const NIGERIA_STATES: string[] = [
  'Delta', 'Rivers State', 'Lagos', 'FCT Abuja', 'Edo', 'Bayelsa', 'Anambra', 'Enugu', 'Oyo', 'Ogun',
  'Abia', 'Adamawa', 'Akwa Ibom', 'Bauchi', 'Benue', 'Borno', 'Cross River', 'Ebonyi', 'Ekiti',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Nasarawa', 'Niger', 'Ondo', 'Osun', 'Plateau', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

const VENDOR_BANKS: Array<{ code: string; name: string }> = [
  { code: '999992', name: 'OPay' },
  { code: '999991', name: 'PalmPay' },
  { code: '50211', name: 'Kuda Bank' },
  { code: '50515', name: 'Moniepoint MFB' },
  { code: '058', name: 'GTBank' },
  { code: '044', name: 'Access Bank' },
  { code: '057', name: 'Zenith Bank' },
  { code: '033', name: 'UBA' },
  { code: '011', name: 'First Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '214', name: 'FCMB' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '221', name: 'Stanbic IBTC' },
  { code: '050', name: 'Ecobank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '032', name: 'Union Bank' }
];

async function compressImageFileToDataUrl(file: File, maxDim: number = 800, quality: number = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.onload = () => {
      const src = String(reader.result || '');
      const img = new Image();
      img.onerror = () => resolve(src);
      img.onload = () => {
        try {
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w >= h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(src);
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch {
          resolve(src);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

// ============================================================================
// EFADO IN-APP CHAT PAGE (NO WHATSAPP — VOICE, PHOTO, VIDEO CALL, MAKE OFFER)
// ============================================================================
interface SellerChatPageProps {
  currentUserId: string;
  productId: string;
  productName: string;
  productPhoto: string;
  sellerId: string;
  sellerName: string;
  sellerEfadoId?: string;
  buyerId?: string;
  initialOfferAmount?: string;
  onBack: () => void;
  onBuyAtAgreedPrice: (prod: FairlyUsedProduct) => void;
  onProductUpdated: (prod: FairlyUsedProduct) => void;
}

export const SellerChatPage: React.FC<SellerChatPageProps> = ({
  currentUserId,
  productId,
  productName,
  productPhoto,
  sellerId,
  sellerName,
  sellerEfadoId,
  buyerId,
  initialOfferAmount,
  onBack,
  onBuyAtAgreedPrice,
  onProductUpdated
}) => {
  const [messages, setMessages] = useState<FairlyUsedChatMessage[]>([]);
  const [liveProduct, setLiveProduct] = useState<FairlyUsedProduct | null>(null);
  const [sellerContact, setSellerContact] = useState<{
    efadoId: string;
    storeName: string;
    phone: string;
    location: string;
    online: boolean;
  } | null>(null);

  const [text, setText] = useState('');
  const [offerInput, setOfferInput] = useState(initialOfferAmount || '');
  const [counterInput, setCounterInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [offerBusy, setOfferBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Voice Note State
  const [recordingVoice, setRecordingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);

  // Photo picker inside chat
  const chatPhotoInputRef = useRef<HTMLInputElement>(null);

  // In-app Video Call Panel State
  const [videoCallActive, setVideoCallActive] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const loadMessages = async () => {
    try {
      const res = await fetchChatMessages(productId, sellerId, buyerId);
      setMessages(res.messages || []);
      if (res.product) {
        setLiveProduct(res.product);
        onProductUpdated(res.product);
      }
      if (res.sellerContact) setSellerContact(res.sellerContact);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not load EFADO Chat.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    const timer = setInterval(loadMessages, 5000);
    return () => {
      clearInterval(timer);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [productId, sellerId, buyerId]);

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = text.trim();
    if (!clean) return;
    setSending(true);
    setErrorMsg(null);
    try {
      const res = await sendChatMessage({ productId, sellerId, buyerId, text: clean, messageType: 'text' });
      setMessages((prev) => [...prev, res.message]);
      setText('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Message failed to send.');
    } finally {
      setSending(false);
    }
  };

  const handleChatPhotoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSending(true);
    setErrorMsg(null);
    try {
      const dataUrl = await compressImageFileToDataUrl(file, 700, 0.65);
      const res = await sendChatMessage({
        productId,
        sellerId,
        buyerId,
        text: 'Shared an inspection photo',
        messageType: 'photo',
        mediaDataUrl: dataUrl
      });
      setMessages((prev) => [...prev, res.message]);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not send photo.');
    } finally {
      setSending(false);
      e.target.value = '';
    }
  };

  const handleToggleVoiceRecord = async () => {
    if (recordingVoice) {
      mediaRecorderRef.current?.stop();
      setRecordingVoice(false);
      return;
    }

    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      voiceChunksRef.current = [];
      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) voiceChunksRef.current.push(ev.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(voiceChunksRef.current, { type: rec.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async () => {
          const dataUrl = String(reader.result || '');
          setSending(true);
          try {
            const res = await sendChatMessage({
              productId,
              sellerId,
              buyerId,
              text: 'Voice Note',
              messageType: 'voice',
              mediaDataUrl: dataUrl.length < 400 * 1024 ? dataUrl : undefined
            });
            setMessages((prev) => [...prev, res.message]);
          } catch (err: any) {
            setErrorMsg(err?.message || 'Voice note could not send.');
          } finally {
            setSending(false);
          }
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorderRef.current = rec;
      rec.start();
      setRecordingVoice(true);
    } catch {
      // Clean fallback if microphone blocked in browser iframe
      setSending(true);
      try {
        const res = await sendChatMessage({
          productId,
          sellerId,
          buyerId,
          text: 'Voice Note: "Please send live working update or call via EFADO Video Call."',
          messageType: 'voice'
        });
        setMessages((prev) => [...prev, res.message]);
      } finally {
        setSending(false);
      }
    }
  };

  const handleToggleVideoCall = async () => {
    if (videoCallActive) {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      setVideoCallActive(false);
      return;
    }
    setVideoCallActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch {
      // Camera permissions optional; in-app inspection banner stays active
    }
    try {
      const res = await sendChatMessage({
        productId,
        sellerId,
        buyerId,
        text: 'Started in-app EFADO Live Video Inspection Call',
        messageType: 'video_call'
      });
      setMessages((prev) => [...prev, res.message]);
    } catch {
      // ignore chat log error
    }
  };

  const handleOfferAction = async (
    action: 'offer' | 'counter' | 'accept' | 'reject' | 'cancel',
    amountNgn?: number
  ) => {
    setOfferBusy(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const res = await submitOffer({
        productId,
        action,
        amountNgn,
        buyerId: liveProduct?.activeNegotiation?.buyerId || buyerId
      });
      if (res.product) {
        setLiveProduct(res.product);
        onProductUpdated(res.product);
      }
      setStatusMsg(res.message);
      setOfferInput('');
      setCounterInput('');
      await loadMessages();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Negotiation action failed.');
    } finally {
      setOfferBusy(false);
    }
  };

  const isSellerViewer = currentUserId === sellerId || Boolean(buyerId && buyerId !== currentUserId);
  const neg = liveProduct?.activeNegotiation || null;
  const isSold = liveProduct?.status === 'SOLD' || (liveProduct ? liveProduct.stock <= 0 : false);
  const lockedByOtherBuyer = Boolean(neg && neg.buyerId !== currentUserId && !isSellerViewer);
  const agreedForCurrentBuyer = Boolean(neg && neg.status === 'AGREED' && (neg.buyerId === currentUserId || isSellerViewer));
  const resolvedEfadoId = sellerContact?.efadoId || liveProduct?.sellerEfadoId || sellerEfadoId || 'EFADO-8421';

  return (
    <div className="max-w-[820px] mx-auto px-3 sm:px-6 pt-4 pb-28 space-y-4">
      {/* Pinned Top Card: Product Photo + EFADO ID + Online Status + Seller Contact (CHAT ONLY) */}
      <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl border border-pink-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-white border border-pink-200 text-black hover:bg-pink-50 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img
            src={liveProduct?.photos?.[0] || productPhoto}
            alt={liveProduct?.name || productName}
            className="w-14 h-14 rounded-xl object-cover border border-pink-200 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-[#2563EB] text-white text-[10px] font-black">
                {resolvedEfadoId}
              </span>
              <h3 className="text-sm font-extrabold text-black truncate mb-0">
                {sellerContact?.storeName || sellerName}
              </h3>
              <BadgeCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
            </div>
            <p className="text-xs font-bold text-black truncate mb-0.5">{liveProduct?.name || productName}</p>
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              {liveProduct && (
                <span className="font-black text-[#2563EB] tabular-nums">
                  Asking: {formatNaira(liveProduct.price)}
                </span>
              )}
              {sellerContact?.online ? (
                <span className="inline-flex items-center gap-1 font-extrabold text-[#16A34A]">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                  Online Now - Chat Now
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-black/55">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  Offline - Leave Message
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Seller Contact shown ONLY inside EFADO Chat */}
        <div className="bg-white rounded-xl border border-pink-100 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-black">
            <Phone className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>
              <strong>Seller Contact (EFADO Chat Only):</strong> {sellerContact?.phone || 'Available in Chat'} •{' '}
              {sellerContact?.location || 'Delta State, Warri'}
            </span>
          </div>
          <span className="text-[11px] font-bold text-[#16A34A]">Meet At EFADO Office - Delta State, Warri</span>
        </div>
      </div>

      {/* Live Negotiation + Single-Buyer Lock Box */}
      {liveProduct && (
        <div className="bg-white rounded-2xl border-2 border-pink-200 p-4 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-black text-black uppercase tracking-wide flex items-center gap-1.5 mb-0">
              <Handshake className="w-4 h-4 text-[#2563EB]" />
              <span>Price Negotiation &amp; Lock</span>
            </h4>
            {isSold ? (
              <span className="px-2.5 py-1 rounded-md bg-[#DC2626] text-white text-[11px] font-black">
                SOLD — Negotiation Closed
              </span>
            ) : !liveProduct.negotiable ? (
              <span className="px-2.5 py-1 rounded-md bg-green-50 text-[#16A34A] text-[11px] font-extrabold">
                Fixed Fair Price — Ready to Buy
              </span>
            ) : lockedByOtherBuyer ? (
              <span className="px-2.5 py-1 rounded-md bg-amber-100 text-black text-[11px] font-black border border-[#F59E0B]">
                In Negotiation - Please Wait
              </span>
            ) : agreedForCurrentBuyer ? (
              <span className="px-2.5 py-1 rounded-md bg-[#16A34A] text-white text-[11px] font-black">
                Agreed Price: {formatNaira(neg?.agreedPriceNgn || liveProduct.price)}
              </span>
            ) : neg ? (
              <span className="px-2.5 py-1 rounded-md bg-blue-50 text-[#2563EB] text-[11px] font-extrabold">
                Active Offer: {formatNaira(neg.counterAmountNgn || neg.offerAmountNgn)} ({neg.status.replace(/_/g, ' ')})
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-md bg-purple-100 text-black text-[11px] font-bold">
                Open to Reasonable Offers
              </span>
            )}
          </div>

          {isSold ? (
            <p className="text-xs font-bold text-[#DC2626] mb-0">
              This item is SOLD. Nobody can negotiate again.
            </p>
          ) : !liveProduct.negotiable ? (
            <button
              type="button"
              onClick={() => onBuyAtAgreedPrice(liveProduct)}
              className="w-full py-2.5 px-4 bg-[#F59E0B] hover:bg-[#D97706] text-black font-black text-xs rounded-xl"
            >
              Buy Now at Fixed Price - {formatNaira(liveProduct.price)}
            </button>
          ) : lockedByOtherBuyer ? (
            <p className="text-xs font-bold text-black/75 mb-0">
              One buyer is currently negotiating this item. Others cannot negotiate until the current deal finishes or is declined.
            </p>
          ) : agreedForCurrentBuyer ? (
            <div className="space-y-2">
              <div className="bg-green-50 border border-[#16A34A]/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-extrabold text-[#16A34A] mb-0">
                  Price agreed with {neg?.buyerName}: {formatNaira(neg?.agreedPriceNgn || liveProduct.price)}!
                </p>
                {!isSellerViewer && (
                  <button
                    type="button"
                    onClick={() => onBuyAtAgreedPrice(liveProduct)}
                    className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-black text-xs rounded-xl shadow-sm"
                  >
                    Buy At Agreed Price - {formatNaira(neg?.agreedPriceNgn || liveProduct.price)}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Buyer Offer Controls */}
              {!isSellerViewer && (
                <div className="flex flex-wrap gap-2">
                  <input
                    type="number"
                    min={100}
                    value={offerInput}
                    onChange={(e) => setOfferInput(e.target.value)}
                    placeholder={`Enter offer in ₦ (e.g. ${Math.round(liveProduct.price * 0.9)})`}
                    className="flex-1 min-w-[160px] px-3 py-2 rounded-xl border border-pink-200 text-xs font-bold text-black tabular-nums"
                  />
                  <button
                    type="button"
                    disabled={offerBusy || !Number(offerInput)}
                    onClick={() => handleOfferAction('offer', Number(offerInput))}
                    className="px-4 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 text-black font-black text-xs"
                  >
                    {offerBusy ? 'Sending...' : 'Make Offer'}
                  </button>
                </div>
              )}

              {/* Buyer response to Seller Counter Offer */}
              {!isSellerViewer && neg?.status === 'COUNTERED' && neg.proposedBy === 'seller' && (
                <div className="bg-amber-50 border border-[#F59E0B] rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-black">
                    Seller Counter Offer: {formatNaira(neg.counterAmountNgn || neg.offerAmountNgn)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={offerBusy}
                      onClick={() => handleOfferAction('accept')}
                      className="px-3 py-1.5 rounded-lg bg-[#16A34A] text-white text-xs font-extrabold"
                    >
                      Accept Counter Price
                    </button>
                    <button
                      type="button"
                      disabled={offerBusy}
                      onClick={() => handleOfferAction('cancel')}
                      className="px-3 py-1.5 rounded-lg bg-white border border-red-200 text-[#DC2626] text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Seller Controls: Accept / Reject / Counter Offer */}
              {isSellerViewer && neg && (
                <div className="bg-purple-50 border border-pink-200 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-extrabold text-black mb-0">
                    Buyer Offer ({neg.buyerName}): {formatNaira(neg.offerAmountNgn)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={offerBusy}
                      onClick={() => handleOfferAction('accept')}
                      className="px-3.5 py-2 rounded-lg bg-[#16A34A] text-white text-xs font-extrabold"
                    >
                      Accept Offer
                    </button>
                    <button
                      type="button"
                      disabled={offerBusy}
                      onClick={() => handleOfferAction('reject')}
                      className="px-3.5 py-2 rounded-lg bg-[#DC2626] text-white text-xs font-bold"
                    >
                      Reject
                    </button>
                    <input
                      type="number"
                      value={counterInput}
                      onChange={(e) => setCounterInput(e.target.value)}
                      placeholder="Counter ₦"
                      className="w-28 px-2.5 py-1.5 rounded-lg border border-pink-200 bg-white text-xs font-bold text-black"
                    />
                    <button
                      type="button"
                      disabled={offerBusy || !Number(counterInput)}
                      onClick={() => handleOfferAction('counter', Number(counterInput))}
                      className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-bold"
                    >
                      Counter Offer
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Live Video Call Inspection Drawer */}
      {videoCallActive && (
        <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3 border-2 border-[#2563EB]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-extrabold">
              <Video className="w-4 h-4 text-[#F59E0B] animate-pulse" />
              <span>EFADO Live Video Inspection Call — {resolvedEfadoId}</span>
            </div>
            <button
              type="button"
              onClick={handleToggleVideoCall}
              className="px-3 py-1 rounded-lg bg-[#DC2626] text-white text-xs font-bold flex items-center gap-1"
            >
              <VideoOff className="w-3.5 h-3.5" />
              <span>End Call</span>
            </button>
          </div>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-44 rounded-xl object-cover bg-slate-800"
          />
          <p className="text-[11px] text-slate-300 mb-0">
            Inspect the item live inside EFADO Chat (zero external apps needed). Pay only through EFADO Escrow when satisfied.
          </p>
        </div>
      )}

      <div className="bg-green-50 border border-[#16A34A]/25 rounded-xl px-4 py-2.5 text-xs font-bold text-[#16A34A] flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 shrink-0" />
        <span>EFADO Protects Your Money — Always complete payment inside EFADO Checkout after agreement.</span>
      </div>

      {statusMsg && (
        <div className="bg-green-50 border border-[#16A34A]/30 rounded-xl p-3 text-xs font-bold text-[#16A34A]">
          {statusMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-[#DC2626]/30 rounded-xl p-3 text-xs font-bold text-[#DC2626]">
          {errorMsg}
        </div>
      )}

      {/* Chat Messages Feed */}
      <div className="bg-white rounded-2xl border border-pink-200 p-4 shadow-sm min-h-[300px] max-h-[50vh] overflow-y-auto space-y-3">
        {loading ? (
          <div className="py-12 text-center text-black/60 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
            <span>Loading EFADO Chat...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <MessageCircle className="w-8 h-8 text-purple-300 mx-auto" />
            <p className="text-xs font-bold text-black mb-0">
              Start chatting with {sellerName} ({resolvedEfadoId})
            </p>
            <p className="text-xs text-black/60">
              Send text, Voice Note, Photo, Video Call, or make a price offer below.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === currentUserId;
            const isOfferMsg = ['offer', 'counter', 'accept', 'reject'].includes(m.messageType || '');
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs space-y-1.5 ${
                    isOfferMsg
                      ? 'bg-amber-50 text-black border-2 border-[#F59E0B]'
                      : mine
                        ? 'bg-[#2563EB] text-white rounded-br-sm'
                        : 'bg-gradient-to-br from-purple-50 to-pink-50 text-black border border-pink-200 rounded-bl-sm'
                  }`}
                >
                  <p
                    className={`text-[10px] font-extrabold mb-0 ${
                      isOfferMsg ? 'text-black/70' : mine ? 'text-blue-100' : 'text-[#2563EB]'
                    }`}
                  >
                    {m.senderName}
                  </p>
                  {m.mediaDataUrl && m.messageType === 'photo' && (
                    <img src={m.mediaDataUrl} alt="Chat attachment" className="max-h-48 rounded-xl object-cover" />
                  )}
                  {m.mediaDataUrl && m.messageType === 'voice' && (
                    <audio controls src={m.mediaDataUrl} className="w-56 h-8" />
                  )}
                  <p className={`text-xs leading-relaxed mb-0 ${mine && !isOfferMsg ? 'text-white' : 'text-black'}`}>
                    {m.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Rich Chat Composer: Type + Voice Note + Photo + Video Call */}
      <div className="bg-white rounded-2xl border border-pink-200 p-3 shadow-sm space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={chatPhotoInputRef}
            type="file"
            accept="image/*"
            onChange={handleChatPhotoPick}
            className="hidden"
          />
          <button
            type="button"
            disabled={sending}
            onClick={handleToggleVoiceRecord}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border ${
              recordingVoice
                ? 'bg-[#DC2626] text-white border-[#DC2626] animate-pulse'
                : 'bg-purple-50 text-black border-pink-200 hover:bg-pink-50'
            }`}
          >
            {recordingVoice ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-[#2563EB]" />}
            <span>{recordingVoice ? 'Stop & Send Voice' : 'Voice Note'}</span>
          </button>
          <button
            type="button"
            disabled={sending}
            onClick={() => chatPhotoInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl bg-purple-50 text-black border border-pink-200 hover:bg-pink-50 text-xs font-extrabold flex items-center gap-1.5"
          >
            <ImagePlus className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Photo</span>
          </button>
          <button
            type="button"
            onClick={handleToggleVideoCall}
            className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#2563EB] border border-[#2563EB]/30 hover:bg-blue-100 text-xs font-extrabold flex items-center gap-1.5"
          >
            <Video className="w-3.5 h-3.5" />
            <span>{videoCallActive ? 'Close Video' : 'Video Call'}</span>
          </button>
        </div>

        <form onSubmit={handleSendText} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type message inside EFADO Chat..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-pink-200 bg-white text-sm text-black focus:border-[#2563EB] outline-none"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="px-5 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 text-black font-black text-sm rounded-xl flex items-center gap-1.5 shadow-sm"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// ACTIVITY PAGE (MY ORDERS, CHATS, ALERTS, SELLER ORDERS)
// ============================================================================
interface ActivityPageProps {
  onOpenOrderTracking: (order: FairlyUsedOrder) => void;
  onOpenChat: (thread: FairlyUsedChatThread) => void;
  onBackToMarket: () => void;
}

export const ActivityPage: React.FC<ActivityPageProps> = ({
  onOpenOrderTracking,
  onOpenChat,
  onBackToMarket
}) => {
  const [tab, setTab] = useState<'orders' | 'chats' | 'alerts' | 'seller_orders'>('orders');
  const [orders, setOrders] = useState<FairlyUsedOrder[]>([]);
  const [sellerOrders, setSellerOrders] = useState<FairlyUsedOrder[]>([]);
  const [alerts, setAlerts] = useState<FairlyUsedAlert[]>([]);
  const [threads, setThreads] = useState<FairlyUsedChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellerBusy, setSellerBusy] = useState(false);
  const [sellerFeedback, setSellerFeedback] = useState('');
  const [reviewOrder, setReviewOrder] = useState<FairlyUsedOrder | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ordRes, altRes, chatRes, sOrdRes] = await Promise.all([
        fetchMyOrders().catch(() => ({ orders: [] })),
        fetchFairlyUsedAlerts().catch(() => ({ alerts: [] })),
        fetchMyChatThreads().catch(() => ({ threads: [] })),
        fetchSellerOrders().catch(() => ({ orders: [] }))
      ]);
      setOrders(ordRes.orders || []);
      setAlerts(altRes.alerts || []);
      setThreads(chatRes.threads || []);
      setSellerOrders(sOrdRes.orders || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSellerStageUpdate = async (orderId: string, stage: 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED') => {
    setSellerBusy(true);
    setSellerFeedback('');
    try {
      const res = await updateSellerOrderShipping(orderId, stage);
      setSellerOrders((prev) => prev.map((o) => (o.orderId === orderId ? res.order : o)));
      setSellerFeedback(`Order ${orderId} updated & buyer alert sent.`);
    } catch (err: any) {
      setSellerFeedback(err?.message || 'Could not update shipping.');
    } finally {
      setSellerBusy(false);
    }
  };

  const handleSellerRefund = async (orderId: string) => {
    setSellerBusy(true);
    setSellerFeedback('');
    try {
      const res = await refundDisputedOrder(orderId);
      setSellerOrders((prev) => prev.map((o) => (o.orderId === orderId ? res.order : o)));
      setSellerFeedback(`Refund sent back to buyer's original payment method.`);
    } catch (err: any) {
      setSellerFeedback(err?.message || 'Could not process refund.');
    } finally {
      setSellerBusy(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewOrder) return;
    try {
      await submitProductReview({
        productId: reviewOrder.productId,
        orderId: reviewOrder.orderId,
        rating: reviewRating,
        comment: reviewComment.trim()
      });
      setReviewFeedback('Thank you! Verified review published.');
      setReviewOrder(null);
      setReviewComment('');
    } catch (err: any) {
      setReviewFeedback(err?.message || 'Could not publish review.');
    }
  };

  const pendingShipmentCount = sellerOrders.filter((o) => o.status === 'PAID_ESCROW_HELD').length;

  return (
    <div className="max-w-[960px] mx-auto px-3 sm:px-6 pt-4 pb-32 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold text-black mb-0">Fairly Used Activity</h2>
          <p className="text-xs text-black/70 mb-0">My Orders, EFADO Chats, Price Alerts &amp; Seller Fulfilment</p>
        </div>
        <button
          type="button"
          onClick={loadAll}
          className="px-3 py-2 rounded-xl bg-white border border-pink-200 text-[#2563EB] text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* 4 Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-1.5 rounded-2xl border border-pink-200 shadow-sm">
        {[
          { id: 'orders' as const, label: `My Orders (${orders.length})` },
          { id: 'chats' as const, label: `Chats (${threads.length})` },
          { id: 'alerts' as const, label: `Alerts (${alerts.length})` },
          { id: 'seller_orders' as const, label: `Seller Orders (${sellerOrders.length})` }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`py-2.5 px-2 rounded-xl text-xs font-extrabold transition-all truncate ${
              tab === t.id ? 'bg-[#2563EB] text-white shadow-sm' : 'text-black/70 hover:bg-purple-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {reviewFeedback && (
        <div className="bg-green-50 border border-[#16A34A]/30 rounded-xl p-3 text-xs font-bold text-[#16A34A]">
          {reviewFeedback}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-pink-200 p-10 text-center text-xs text-black/60">
          <Loader2 className="w-6 h-6 animate-spin text-[#2563EB] mx-auto mb-2" />
          Loading activity...
        </div>
      ) : tab === 'orders' ? (
        orders.length === 0 ? (
          <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl border border-pink-200 p-10 text-center space-y-3 shadow-sm">
            <Package className="w-10 h-10 text-purple-300 mx-auto" />
            <h3 className="text-base font-bold text-black">No Orders Yet</h3>
            <p className="text-xs text-black/70">
              EFADO Protects Your Money — your money is held safely until you confirm delivery.
            </p>
            <button
              type="button"
              onClick={onBackToMarket}
              className="px-5 py-2.5 bg-[#F59E0B] text-black rounded-xl text-xs font-black"
            >
              Shop Fairly Used Market
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((ord) => (
              <div
                key={ord.orderId}
                className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl border border-pink-200 p-4 shadow-sm space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pink-100 pb-2">
                  <span className="text-xs font-extrabold text-[#2563EB] tabular-nums">{ord.orderId}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {ord.pickupCode && (
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-black text-xs font-extrabold tabular-nums">
                        Code: {ord.pickupCode}
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                        ord.status === 'COMPLETED' || ord.status === 'DELIVERED'
                          ? 'bg-green-50 text-[#16A34A]'
                          : ord.status === 'DISPUTED' || ord.status === 'REFUNDED'
                            ? 'bg-red-50 text-[#DC2626]'
                            : 'bg-blue-50 text-[#2563EB]'
                      }`}
                    >
                      {ord.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 items-center">
                  <img
                    src={ord.productPhoto}
                    alt={ord.productName}
                    className="w-16 h-16 rounded-xl object-cover border border-pink-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-black truncate mb-0">{ord.productName}</h4>
                    <p className="text-xs text-black/70 mb-0.5">
                      Seller: {ord.sellerName} • Qty {ord.quantity}
                    </p>
                    <p className="text-sm font-black text-black tabular-nums mb-0">
                      {formatNaira(ord.grandTotal, true)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onOpenOrderTracking(ord)}
                    className="flex-1 py-2.5 px-4 bg-[#F59E0B] hover:bg-[#D97706] text-black text-xs font-black rounded-xl"
                  >
                    Track &amp; Manage
                  </button>
                  {ord.status === 'COMPLETED' && (
                    <button
                      type="button"
                      onClick={() => setReviewOrder(ord)}
                      className="py-2.5 px-4 bg-green-50 text-[#16A34A] border border-[#16A34A]/30 text-xs font-bold rounded-xl"
                    >
                      Write Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : tab === 'chats' ? (
        threads.length === 0 ? (
          <div className="bg-white rounded-2xl border border-pink-200 p-10 text-center text-xs text-black/60">
            <MessageCircle className="w-8 h-8 text-purple-300 mx-auto mb-2" />
            No EFADO Chats yet. Tap "Chat - Negotiate Price" on any product card!
          </div>
        ) : (
          <div className="space-y-2.5">
            {threads.map((th) => (
              <button
                key={th.threadId}
                type="button"
                onClick={() => onOpenChat(th)}
                className="w-full text-left bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl border border-pink-200 p-4 shadow-sm hover:border-[#2563EB] flex items-center gap-3"
              >
                <img src={th.productPhoto} alt={th.productName} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-black truncate mb-0">{th.productName}</p>
                  <p className="text-xs text-[#2563EB] font-bold mb-0.5">
                    {th.sellerName} • {th.sellerEfadoId || 'EFADO'}
                  </p>
                  <p className="text-xs text-black/65 truncate mb-0">{th.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        )
      ) : tab === 'alerts' ? (
        alerts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-pink-200 p-10 text-center text-xs text-black/60">
            <Bell className="w-8 h-8 text-purple-300 mx-auto mb-2" />
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-2.5">
            {alerts.map((al) => (
              <div key={al.id} className="bg-white rounded-2xl border border-pink-200 p-4 shadow-sm space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#2563EB]">{al.title}</span>
                  <span className="text-[11px] text-black/45">{new Date(al.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-xs text-black mb-0">{al.message}</p>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-3">
          {pendingShipmentCount > 0 && (
            <div className="bg-amber-50 border border-[#F59E0B] rounded-2xl p-3.5 flex items-center gap-2.5 text-xs font-extrabold text-black">
              <Bell className="w-4 h-4 text-[#F59E0B] shrink-0" />
              <span>
                New Order Alert: {pendingShipmentCount} paid order{pendingShipmentCount > 1 ? 's' : ''} awaiting shipment or Warri office exchange!
              </span>
            </div>
          )}
          {sellerFeedback && (
            <div className="bg-green-50 border border-[#16A34A]/30 rounded-xl p-3 text-xs font-bold text-[#16A34A]">
              {sellerFeedback}
            </div>
          )}
          {sellerOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-pink-200 p-10 text-center text-xs text-black/60">
              <Store className="w-8 h-8 text-purple-300 mx-auto mb-2" />
              No incoming seller orders yet.
            </div>
          ) : (
            sellerOrders.map((ord) => (
              <div key={ord.orderId} className="bg-white rounded-2xl border border-pink-200 p-4 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pink-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-[#2563EB] tabular-nums">{ord.orderId}</span>
                    {ord.status === 'PAID_ESCROW_HELD' && (
                      <span className="px-2 py-0.5 rounded-md bg-[#F59E0B] text-black text-[10px] font-black">
                        NEW ORDER ALERT
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-xs font-extrabold ${
                      ord.escrowStatus === 'RELEASED'
                        ? 'bg-green-50 text-[#16A34A]'
                        : ord.escrowStatus === 'DISPUTED' || ord.escrowStatus === 'REFUNDED'
                          ? 'bg-red-50 text-[#DC2626]'
                          : 'bg-blue-50 text-[#2563EB]'
                    }`}
                  >
                    {ord.escrowStatus}
                  </span>
                </div>

                <div className="flex gap-3 items-start">
                  <img
                    src={ord.productPhoto}
                    alt={ord.productName}
                    className="w-14 h-14 rounded-xl object-cover border border-pink-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0 text-xs text-black space-y-1">
                    <p className="font-extrabold mb-0">
                      {ord.productName} (Qty {ord.quantity}) — {formatNaira(ord.subtotal + ord.deliveryFee, true)}
                    </p>
                    <p className="mb-0">
                      Buyer: <strong>{ord.recipientName}</strong> ({ord.recipientPhone})
                    </p>
                    <p className="mb-0">
                      {ord.deliveryMethod === 'DELIVERY' && ord.address
                        ? `Delivery Address: ${ord.address.street}, ${ord.address.city}, ${ord.address.state}${ord.address.landmark ? ` (${ord.address.landmark})` : ''}`
                        : `Pickup Method: ${ord.pickupLocationLabel || ord.deliveryMethod.replace(/_/g, ' ')}`}
                    </p>
                    <p className="mb-0">
                      Pickup Code: <strong className="text-[#2563EB] tabular-nums">{ord.pickupCode || 'Pending'}</strong> • Stage:{' '}
                      <strong>{ord.status.replace(/_/g, ' ')}</strong>
                    </p>
                  </div>
                </div>

                {['PAID_ESCROW_HELD', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(ord.status) && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {ord.status === 'PAID_ESCROW_HELD' && (
                      <button
                        type="button"
                        disabled={sellerBusy}
                        onClick={() => handleSellerStageUpdate(ord.orderId, 'SHIPPED')}
                        className="px-3.5 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-xl"
                      >
                        Mark As Shipped
                      </button>
                    )}
                    {['PAID_ESCROW_HELD', 'SHIPPED'].includes(ord.status) && (
                      <button
                        type="button"
                        disabled={sellerBusy}
                        onClick={() => handleSellerStageUpdate(ord.orderId, 'OUT_FOR_DELIVERY')}
                        className="px-3.5 py-2 bg-purple-100 text-black text-xs font-bold rounded-xl"
                      >
                        Mark As Out For Delivery
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={sellerBusy}
                      onClick={() => handleSellerStageUpdate(ord.orderId, 'DELIVERED')}
                      className="px-3.5 py-2 bg-[#16A34A] text-white text-xs font-bold rounded-xl"
                    >
                      Mark As Delivered / Ready For Pickup
                    </button>
                  </div>
                )}

                {ord.status === 'DISPUTED' && (
                  <div className="bg-red-50 border border-[#DC2626]/30 rounded-xl p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#DC2626]">
                        Dispute: {ord.disputeReason}
                      </span>
                      <button
                        type="button"
                        disabled={sellerBusy}
                        onClick={() => handleSellerRefund(ord.orderId)}
                        className="px-3 py-1.5 bg-[#DC2626] text-white text-xs font-bold rounded-lg"
                      >
                        Issue Full Refund
                      </button>
                    </div>
                    {Array.isArray(ord.disputePhotos) && ord.disputePhotos.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {ord.disputePhotos.map((src, i) => (
                          <img
                            key={i}
                            src={src}
                            alt={`Evidence ${i + 1}`}
                            className="w-12 h-12 rounded-lg object-cover border border-red-200 bg-white"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {reviewOrder && (
        <form
          onSubmit={handleReviewSubmit}
          className="bg-white rounded-2xl border-2 border-[#2563EB] p-5 shadow-md space-y-3"
        >
          <h4 className="text-sm font-extrabold text-black">Review {reviewOrder.productName}</h4>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setReviewRating(star)}
                className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                  reviewRating >= star ? 'bg-[#F59E0B] text-black border-[#F59E0B]' : 'bg-white text-black/60'
                }`}
              >
                {star} ★
              </button>
            ))}
          </div>
          <textarea
            rows={2}
            required
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Share how item matched video, condition grade, and seller honesty..."
            className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs text-black"
          />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-[#16A34A] text-white text-xs font-bold rounded-xl">
              Submit Review
            </button>
            <button
              type="button"
              onClick={() => setReviewOrder(null)}
              className="px-4 py-2 bg-slate-100 text-black text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

// ============================================================================
// BECOME A SELLER — VENDOR REGISTRATION (AUTO EFADO-XXXX + 4 SELLER TYPES)
// ============================================================================
interface VendorRegistrationPageProps {
  userEmail: string;
  userName: string;
  userPhone?: string;
  onBack: () => void;
  onGoSellerHub: () => void;
}

export const VendorRegistrationPage: React.FC<VendorRegistrationPageProps> = ({
  userEmail,
  userName,
  userPhone,
  onBack,
  onGoSellerHub
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verifyingBank, setVerifyingBank] = useState(false);
  const [profile, setProfile] = useState<SellerProfilePrivate | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [sellerType, setSellerType] = useState<SellerType>('single');
  const [storeName, setStoreName] = useState('');
  const [ownerFullName, setOwnerFullName] = useState(userName || '');
  const [phone, setPhone] = useState(userPhone || '');
  const [email, setEmail] = useState(userEmail || '');
  const [stateName, setStateName] = useState('Delta');
  const [city, setCity] = useState('Warri');
  const [storeAddress, setStoreAddress] = useState('');
  const [idType, setIdType] = useState<VendorIdType>('NIN');
  const [idPhoto, setIdPhoto] = useState('');
  const [bankCode, setBankCode] = useState('999992');
  const [bankName, setBankName] = useState('OPay');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [payoutChoice, setPayoutChoice] = useState<'wallet' | 'bank'>('bank');
  const [rulesAccepted, setRulesAccepted] = useState(false);

  const idInputRef = useRef<HTMLInputElement>(null);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await fetchSellerProfile();
      const p = res.profile;
      setProfile(p);
      if (p) {
        if (p.sellerType) setSellerType(p.sellerType);
        if (p.storeName) setStoreName(p.storeName);
        if (p.ownerFullName) setOwnerFullName(p.ownerFullName);
        if (p.phone) setPhone(p.phone);
        if (p.email) setEmail(p.email);
        if (p.state) setStateName(p.state);
        if (p.city) setCity(p.city);
        if (p.storeAddress) setStoreAddress(p.storeAddress);
        if (p.idType) setIdType(p.idType);
        if (p.bankCode) setBankCode(p.bankCode);
        if (p.bankName) setBankName(p.bankName);
        if (p.accountName) setAccountName(p.accountName);
        if (p.payoutPreference) setPayoutChoice(p.payoutPreference);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleIdPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFileToDataUrl(file, 960, 0.78);
      setIdPhoto(compressed);
      setFeedback(null);
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Could not process ID photo.' });
    }
  };

  const handleVerifyBank = async () => {
    const cleanNum = accountNumber.replace(/\D/g, '');
    if (cleanNum.length !== 10) {
      setFeedback({ type: 'err', text: 'Enter your 10-digit Bank Account Number first.' });
      return;
    }
    setVerifyingBank(true);
    setFeedback(null);
    try {
      const res = await resolveVendorBankAccount(cleanNum, bankCode, bankName);
      const resolvedName = res.account_name || res.accountName || '';
      if (resolvedName) {
        setAccountName(resolvedName);
        setFeedback({ type: 'ok', text: `Account Verified: ${resolvedName}` });
      } else {
        setFeedback({ type: 'err', text: res.message || 'Could not verify bank account automatically.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Bank verification lookup unavailable.' });
    } finally {
      setVerifyingBank(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!rulesAccepted) {
      setFeedback({ type: 'err', text: 'Please agree to EFADO Fairly Used Seller Rules before submitting.' });
      return;
    }
    if (!idPhoto && !profile?.idPhotoUploaded) {
      setFeedback({ type: 'err', text: 'Please upload a clear photo of your ID document.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await registerVendorApplication({
        storeName: storeName.trim(),
        ownerFullName: ownerFullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        state: stateName.trim(),
        city: city.trim(),
        storeAddress: storeAddress.trim(),
        sellerType,
        idType,
        idPhoto,
        bankName,
        bankCode,
        accountNumber: accountNumber.replace(/\D/g, ''),
        accountName: accountName.trim(),
        payoutPreference: payoutChoice,
        rulesAccepted
      });
      setProfile(res.profile);
      setFeedback({ type: 'ok', text: res.message || 'Application submitted! Admin has been notified.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Could not submit application.' });
    } finally {
      setSubmitting(false);
    }
  };

  const isApproved = Boolean(profile && (profile.verified || profile.applicationStatus === 'APPROVED'));
  const isPending = profile?.applicationStatus === 'PENDING_APPROVAL';
  const isRejected = profile?.applicationStatus === 'REJECTED';

  return (
    <div className="max-w-[820px] mx-auto px-3 sm:px-6 pt-4 pb-28 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-xl bg-white border border-pink-200 text-black shadow-sm hover:bg-pink-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-black">Become a Fairly Used Seller</h2>
            <p className="text-xs text-black/70 mb-0">Get Your EFADO-XXXX Chat ID &amp; Sell With EFADO Escrow Protection</p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadStatus}
          className="px-3 py-2 rounded-xl bg-white border border-pink-200 text-[#2563EB] text-xs font-bold flex items-center gap-1.5 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`rounded-2xl p-4 text-xs font-bold border ${
            feedback.type === 'ok'
              ? 'bg-green-50 border-[#16A34A]/30 text-[#16A34A]'
              : 'bg-red-50 border-[#DC2626]/30 text-[#DC2626]'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-pink-200 p-10 text-center text-xs text-black/60 shadow-sm">
          <Loader2 className="w-6 h-6 animate-spin text-[#2563EB] mx-auto mb-2" />
          Checking your Fairly Used seller status...
        </div>
      ) : isApproved ? (
        <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl border-2 border-[#16A34A]/40 p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-green-50 text-[#16A34A] flex items-center justify-center shrink-0">
                <BadgeCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#16A34A] text-white text-[11px] font-extrabold">
                    Approved Seller
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-[#2563EB] text-white text-[11px] font-black">
                    EFADO ID: {profile?.efadoId}
                  </span>
                </div>
                <h3 className="text-lg font-black text-black mb-0">You Can List Fairly Used Items</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-pink-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-black/60 font-bold mb-0.5">Store / Seller Name</p>
              <p className="font-extrabold text-black mb-0">{profile?.storeName || 'EFADO Seller'}</p>
            </div>
            <div>
              <p className="text-black/60 font-bold mb-0.5">Seller Type</p>
              <p className="font-extrabold text-black mb-0">
                {SELLER_TYPES.find((s) => s.id === profile?.sellerType)?.label || 'Single Person'}
              </p>
            </div>
            <div>
              <p className="text-black/60 font-bold mb-0.5">Escrow Payout</p>
              <p className="font-extrabold text-[#2563EB] mb-0">
                {profile?.payoutPreference === 'bank'
                  ? `${profile?.bankName || 'Bank'} (${profile?.accountNumberMasked || 'Linked'})`
                  : 'EFADO Wallet (Instant)'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onGoSellerHub}
              className="px-6 py-3.5 bg-[#F59E0B] hover:bg-[#D97706] text-black font-black text-sm rounded-xl shadow-sm flex items-center gap-2"
            >
              <Store className="w-4 h-4" />
              <span>Go To Seller Hub &amp; List Items</span>
            </button>
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-3.5 bg-white text-black font-bold text-sm rounded-xl border border-pink-200"
            >
              Back to Market
            </button>
          </div>
        </div>
      ) : isPending ? (
        <div className="bg-white rounded-2xl border-2 border-[#2563EB]/40 p-6 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#2563EB] flex items-center justify-center shrink-0">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-md bg-[#2563EB] text-white text-xs font-extrabold">
                  Pending Approval
                </span>
                {profile?.efadoId && (
                  <span className="px-3 py-1 rounded-md bg-[#F59E0B] text-black text-xs font-black">
                    Assigned EFADO ID: {profile.efadoId}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-black">Your Fairly Used Seller Application Is Under Review</h3>
              <p className="text-xs text-black/75 leading-relaxed mb-0">
                An alert has been sent to EFADO Admin. Once approved, you can list items using your{' '}
                <strong>{profile?.efadoId}</strong> EFADO Chat ID.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadStatus}
              className="px-5 py-3 bg-[#2563EB] text-white font-extrabold text-xs rounded-xl flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Check Approval Status</span>
            </button>
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-3 bg-purple-50 text-black font-bold text-xs rounded-xl border border-pink-200"
            >
              Back to Market
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-pink-200 p-5 sm:p-6 shadow-sm space-y-5">
          {isRejected && (
            <div className="bg-red-50 border border-[#DC2626]/30 rounded-xl p-4 text-xs text-[#DC2626] font-bold space-y-1">
              <p className="mb-0">Previous application needs correction:</p>
              <p className="font-semibold text-black mb-0">{profile?.rejectionReason}</p>
            </div>
          )}

          {/* Seller Type Selection */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-black text-black border-b border-pink-100 pb-2">
              1. Who Are You Selling As? *
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SELLER_TYPES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSellerType(st.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    sellerType === st.id
                      ? 'border-[#2563EB] bg-gradient-to-br from-purple-50 to-pink-50'
                      : 'border-pink-100 bg-white'
                  }`}
                >
                  <p className="text-xs font-extrabold text-black mb-0.5">{st.label}</p>
                  <p className="text-[11px] text-black/65 mb-0">{st.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Store & Owner Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-black border-b border-pink-100 pb-2">
              2. Seller &amp; Contact Information (Shown inside EFADO Chat Only)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-black mb-1">Display / Store Name *</label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. Chinedu Electronics or Warri Deals"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-sm text-black"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">Owner Full Name *</label>
                <input
                  type="text"
                  required
                  value={ownerFullName}
                  onChange={(e) => setOwnerFullName(e.target.value)}
                  placeholder="Legal full name matching ID & Bank"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-sm text-black"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08012345678"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-sm text-black"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seller@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-sm text-black"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">State *</label>
                <select
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-sm text-black"
                >
                  {NIGERIA_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Warri, Ughelli, Lekki"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-sm text-black"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-black mb-1">Address / Meeting Location *</label>
              <input
                type="text"
                required
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="Street address or Warri safe meetup area"
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-sm text-black"
              />
            </div>
          </div>

          {/* 3. Identity Verification */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-black border-b border-pink-100 pb-2">
              3. Identity Verification (KYC)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-black mb-1">ID Type *</label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value as VendorIdType)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-sm font-semibold text-black"
                >
                  <option value="NIN">NIN (National Identity Number)</option>
                  <option value="Driver's License">Driver&apos;s License</option>
                  <option value="Voter's Card">Voter&apos;s Card</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">ID Photo Upload *</label>
                <input
                  ref={idInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleIdPhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => idInputRef.current?.click()}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-dashed border-[#2563EB]/50 bg-blue-50 hover:bg-blue-100 text-[#2563EB] text-xs font-extrabold flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>{idPhoto ? 'Change ID Photo' : 'Upload Clear ID Photo'}</span>
                </button>
              </div>
            </div>
            {idPhoto && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-pink-200">
                <img src={idPhoto} alt="Uploaded ID" className="w-20 h-14 rounded-lg object-cover border border-pink-200" />
                <div className="flex-1 text-xs">
                  <p className="font-bold text-[#16A34A] mb-0">ID Photo Ready ({idType})</p>
                  <p className="text-black/60 mb-0">Only visible to EFADO Admin for approval verification.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIdPhoto('')}
                  className="p-2 rounded-lg bg-white text-[#DC2626] border border-red-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* 4. Bank Account & Payout Choice */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-black border-b border-pink-100 pb-2">
              4. Settlement Bank &amp; Payout Choice
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPayoutChoice('bank')}
                className={`p-3.5 rounded-xl border-2 text-left flex items-center gap-3 ${
                  payoutChoice === 'bank' ? 'border-[#2563EB] bg-blue-50' : 'border-pink-200 bg-white'
                }`}
              >
                <Store className="w-5 h-5 text-[#2563EB] shrink-0" />
                <div>
                  <p className="text-xs font-extrabold text-black mb-0">Payout Choice: Bank</p>
                  <p className="text-[11px] text-black/60 mb-0">Direct transfer to your Nigerian bank</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPayoutChoice('wallet')}
                className={`p-3.5 rounded-xl border-2 text-left flex items-center gap-3 ${
                  payoutChoice === 'wallet' ? 'border-[#2563EB] bg-blue-50' : 'border-pink-200 bg-white'
                }`}
              >
                <Wallet className="w-5 h-5 text-[#2563EB] shrink-0" />
                <div>
                  <p className="text-xs font-extrabold text-black mb-0">Payout Choice: EFADO Wallet</p>
                  <p className="text-[11px] text-black/60 mb-0">Instant credit on buyer confirmation</p>
                </div>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-black mb-1">Bank Name *</label>
                <select
                  value={bankCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    setBankCode(code);
                    const found = VENDOR_BANKS.find((b) => b.code === code);
                    if (found) setBankName(found.name);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-pink-200 bg-white text-xs font-bold text-black"
                >
                  {VENDOR_BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">Account Number *</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    required={!profile?.accountNumberMasked}
                    maxLength={10}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder={profile?.accountNumberMasked || '10-digit NUBAN'}
                    className="w-full px-3 py-2.5 rounded-xl border border-pink-200 bg-white text-xs font-bold text-black tabular-nums"
                  />
                  <button
                    type="button"
                    disabled={verifyingBank || accountNumber.length !== 10}
                    onClick={handleVerifyBank}
                    className="px-2.5 py-2 rounded-xl bg-blue-100 text-[#2563EB] hover:bg-blue-200 disabled:opacity-50 text-[11px] font-extrabold shrink-0"
                  >
                    {verifyingBank ? '...' : 'Verify'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">Account Name *</label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Account holder full name"
                  className="w-full px-3 py-2.5 rounded-xl border border-pink-200 bg-white text-xs font-bold text-black"
                />
              </div>
            </div>
          </div>

          <label className="flex items-start gap-2.5 p-3.5 rounded-xl bg-purple-50 border border-pink-200 cursor-pointer text-xs text-black">
            <input
              type="checkbox"
              checked={rulesAccepted}
              onChange={(e) => setRulesAccepted(e.target.checked)}
              className="w-4 h-4 mt-0.5 accent-[#2563EB] shrink-0"
            />
            <span>
              <strong>Agree to EFADO Fairly Used Seller Rules:</strong> I will upload 5 honest photos + 1 real working video, state every fault clearly, honor agreed negotiation prices, and complete payments via EFADO Escrow.
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-60 text-black font-black text-sm rounded-xl shadow-md"
          >
            {submitting ? 'Submitting Application...' : 'SUBMIT FOR APPROVAL & GET EFADO ID'}
          </button>
        </form>
      )}
    </div>
  );
};

// ============================================================================
// SELLER & BUYER PROFILE HUB (BULK / HOUSE / 5 PHOTOS + 1 VIDEO + PRICE DROP)
// ============================================================================
interface ProfileSellerHubPageProps {
  userEmail: string;
  userName: string;
  walletBalanceNgn: number;
  onProductChanged: () => void;
  onOpenWallet: () => void;
  onOpenVendorRegistration: () => void;
}

export const ProfileSellerHubPage: React.FC<ProfileSellerHubPageProps> = ({
  userEmail,
  userName,
  walletBalanceNgn,
  onProductChanged,
  onOpenWallet,
  onOpenVendorRegistration
}) => {
  const [section, setSection] = useState<'sell' | 'my_listings' | 'archive' | 'orders' | 'payout' | 'approvals'>('sell');
  const [sellerOrders, setSellerOrders] = useState<FairlyUsedOrder[]>([]);
  const [myProducts, setMyProducts] = useState<FairlyUsedProduct[]>([]);
  const [sellerProfile, setSellerProfile] = useState<SellerProfilePrivate | null>(null);
  const [adminVendors, setAdminVendors] = useState<AdminVendorApplication[]>([]);
  const [expandedKycId, setExpandedKycId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Listing Mode & Seller Type (Section 3)
  const [listingMode, setListingMode] = useState<ListingMode>('single');
  const [sellerType, setSellerType] = useState<SellerType>('single');

  // 5 Required Photos + 1 Required Working Video
  const [prodPhotos, setProdPhotos] = useState<string[]>([]);
  const [prodVideoUrl, setProdVideoUrl] = useState<string>(DEMO_WORKING_VIDEOS[0].url);
  const [prodName, setProdName] = useState('');
  const [prodBrand, setProdBrand] = useState('');
  const [prodCategory, setProdCategory] = useState<Exclude<FairlyUsedCategory, 'All'>>('Phones');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('1');
  const [conditionGrade, setConditionGrade] = useState<ConditionGrade>('B');
  const [reasonForSelling, setReasonForSelling] = useState<ReasonForSelling>('Upgraded');
  const [howLongUsed, setHowLongUsed] = useState('');
  const [workingPerfectly, setWorkingPerfectly] = useState(true);
  const [faultDescription, setFaultDescription] = useState('');
  const [prodLocation, setProdLocation] = useState('Warri, Delta State');
  const [canInspect, setCanInspect] = useState(true);
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>('BOTH');
  const [negotiable, setNegotiable] = useState(true);
  const [keptInEfadoStore, setKeptInEfadoStore] = useState(false);
  const [prodFreeDelivery, setProdFreeDelivery] = useState(true);
  const [prodDeliveryFee, setProdDeliveryFee] = useState('2500');
  const [prodDesc, setProdDesc] = useState('');

  // Bulk / Business Closing Down items
  const [bulkItems, setBulkItems] = useState<BulkListingItem[]>([
    { name: 'Dell Latitude 7420 Core i7', quantity: 5, unitPrice: 380000, notes: 'Grade A' },
    { name: 'HP EliteBook 840 G7', quantity: 5, unitPrice: 340000, notes: 'Grade B' }
  ]);
  const [bulkTotalPriceInput, setBulkTotalPriceInput] = useState('');

  // House / Land Seller fields
  const [houseRooms, setHouseRooms] = useState('');
  const [houseBathrooms, setHouseBathrooms] = useState('');
  const [houseLandSize, setHouseLandSize] = useState('');
  const [houseDocs, setHouseDocs] = useState<HouseDocType[]>(['C of O']);
  const [houseOccupied, setHouseOccupied] = useState<'Yes' | 'No'>('No');
  const [houseFullAddress, setHouseFullAddress] = useState('');

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Price Drop & Relist inputs
  const [relistStocks, setRelistStocks] = useState<Record<string, string>>({});
  const [priceDropInputs, setPriceDropInputs] = useState<Record<string, string>>({});

  // Payout Config State
  const [payoutPref, setPayoutPref] = useState<'wallet' | 'bank'>('wallet');
  const [storeName, setStoreName] = useState(userName || 'EFADO Seller');
  const [storeAddress, setStoreAddress] = useState('');
  const [bankName, setBankName] = useState('OPay');
  const [bankCode, setBankCode] = useState('999992');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const loadSellerData = async () => {
    try {
      const [ordRes, prodRes, profRes] = await Promise.all([
        fetchSellerOrders().catch(() => ({ orders: [] })),
        fetchFairlyUsedProducts({ sellerMine: true }).catch(() => ({ products: [] })),
        fetchSellerProfile().catch(() => ({ profile: null }))
      ]);
      setSellerOrders(ordRes.orders || []);
      setMyProducts(prodRes.products || []);
      if (profRes.profile) {
        const p = profRes.profile;
        setSellerProfile(p);
        setPayoutPref(p.payoutPreference);
        setStoreName(p.storeName || userName);
        setStoreAddress(p.storeAddress || '');
        if (p.sellerType) setSellerType(p.sellerType);
        if (p.location) setProdLocation(p.location);
        if (p.bankName) setBankName(p.bankName);
        if (p.bankCode) setBankCode(p.bankCode);
        if (p.accountName) setAccountName(p.accountName);
        if (p.isAdmin) {
          const adm = await fetchAdminVendorApplications().catch(() => ({ vendors: [] }));
          setAdminVendors(adm.vendors || []);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadSellerData();
  }, []);

  const handleProductFilePhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remainingSlots = 5 - prodPhotos.length;
    if (remainingSlots <= 0) {
      setFeedback({ type: 'err', text: '5 real photos already added.' });
      return;
    }
    const picked = Array.from(files).slice(0, remainingSlots);
    try {
      const compressedList = await Promise.all(picked.map((f) => compressImageFileToDataUrl(f, 760, 0.7)));
      setProdPhotos((prev) => [...prev, ...compressedList].slice(0, 5));
      setFeedback(null);
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Could not load selected photo.' });
    }
  };

  const handleProductVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 680 * 1024) {
      setFeedback({
        type: 'err',
        text: 'Video clip is larger than 680KB. Upload a short 5–8 second clip or pick a demo video below.'
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProdVideoUrl(String(reader.result || ''));
      setFeedback(null);
    };
    reader.readAsDataURL(file);
  };

  const computedBulkQty = bulkItems.reduce((s, it) => s + Number(it.quantity || 0), 0);
  const computedBulkTotal = bulkItems.reduce((s, it) => s + Number(it.quantity || 0) * Number(it.unitPrice || 0), 0);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prodPhotos.length < 5) {
      setFeedback({ type: 'err', text: 'Please add ALL 5 real photos (all sides + working screen/label).' });
      return;
    }
    if (!prodVideoUrl.trim()) {
      setFeedback({ type: 'err', text: 'Please attach 1 real video showing the item working (TV ON / Laptop booting).' });
      return;
    }
    if (!faultDescription.trim()) {
      setFeedback({ type: 'err', text: 'Please write What Is Fault? (or write "None — working perfectly" if zero faults).' });
      return;
    }
    if ((sellerType === 'house_land' || prodCategory === 'Houses & Land') && (!houseFullAddress.trim() || houseDocs.length === 0)) {
      setFeedback({ type: 'err', text: 'House / Land listing requires Full Address and at least 1 Document selected.' });
      return;
    }

    setBusy(true);
    setFeedback(null);
    try {
      const effectiveStock = listingMode === 'bulk' ? Math.max(1, Number(prodStock) || computedBulkQty || 1) : Math.max(1, Number(prodStock) || 1);
      const effectivePrice = Number(prodPrice) || (listingMode === 'bulk' ? Math.round((Number(bulkTotalPriceInput) || computedBulkTotal) / effectiveStock) : 0);

      await createFairlyUsedProduct({
        listingMode,
        sellerType,
        name: prodName.trim(),
        brand: prodBrand.trim() || 'Pre-Owned',
        category: sellerType === 'house_land' ? 'Houses & Land' : prodCategory,
        price: effectivePrice,
        stock: effectiveStock,
        conditionGrade,
        reasonForSelling,
        howLongUsed: howLongUsed.trim(),
        workingPerfectly,
        faultDescription: faultDescription.trim(),
        location: prodLocation.trim(),
        canInspect,
        deliveryOption,
        negotiable,
        keptInEfadoStore,
        freeDelivery: deliveryOption === 'PICKUP_ONLY' ? false : prodFreeDelivery,
        deliveryFee: deliveryOption === 'PICKUP_ONLY' || prodFreeDelivery ? 0 : Number(prodDeliveryFee || 0),
        photos: prodPhotos.slice(0, 5),
        videoUrl: prodVideoUrl.trim(),
        description: prodDesc.trim(),
        bulkItems: listingMode === 'bulk' ? bulkItems : [],
        bulkTotalPrice: listingMode === 'bulk' ? Number(bulkTotalPriceInput) || computedBulkTotal : undefined,
        houseDetails:
          sellerType === 'house_land' || prodCategory === 'Houses & Land'
            ? {
                rooms: houseRooms.trim(),
                bathrooms: houseBathrooms.trim(),
                landSize: houseLandSize.trim(),
                documents: houseDocs,
                occupied: houseOccupied,
                fullAddress: houseFullAddress.trim()
              }
            : null
      });

      setProdName('');
      setProdBrand('');
      setProdPrice('');
      setProdDesc('');
      setHowLongUsed('');
      setFaultDescription('');
      setProdPhotos([]);
      setFeedback({ type: 'ok', text: 'Fairly Used listing published + E-FADO Reel auto-created!' });
      await loadSellerData();
      onProductChanged();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Could not publish listing.' });
    } finally {
      setBusy(false);
    }
  };

  const handlePriceDropSubmit = async (p: FairlyUsedProduct) => {
    const newPrice = Number(priceDropInputs[p.id] || 0);
    if (!Number.isFinite(newPrice) || newPrice <= 0) {
      setFeedback({ type: 'err', text: 'Enter a valid lower price in NGN.' });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const res = await updateProductPrice(p.id, newPrice);
      setFeedback({ type: 'ok', text: res.message });
      await loadSellerData();
      onProductChanged();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Could not update price.' });
    } finally {
      setBusy(false);
    }
  };

  const handleRelist = async (prod: FairlyUsedProduct) => {
    const qty = Math.max(1, Number(relistStocks[prod.id] || 1));
    setBusy(true);
    setFeedback(null);
    try {
      const res = await relistFairlyUsedProduct(prod.id, qty);
      setFeedback({ type: 'ok', text: res.message });
      await loadSellerData();
      onProductChanged();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Failed to relist item.' });
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateOrderStage = async (orderId: string, stage: 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED') => {
    setBusy(true);
    setFeedback(null);
    try {
      await updateSellerOrderShipping(orderId, stage);
      setFeedback({ type: 'ok', text: `Order ${orderId} updated to ${stage.replace(/_/g, ' ')}.` });
      await loadSellerData();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Could not update order.' });
    } finally {
      setBusy(false);
    }
  };

  const handleApproveRefund = async (orderId: string) => {
    setBusy(true);
    setFeedback(null);
    try {
      await refundDisputedOrder(orderId);
      setFeedback({ type: 'ok', text: `Full Escrow refund sent to buyer's original payment method for ${orderId}.` });
      await loadSellerData();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Could not refund order.' });
    } finally {
      setBusy(false);
    }
  };

  const handleSavePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const res = await saveSellerProfile({
        storeName: storeName.trim(),
        sellerType,
        storeAddress: storeAddress.trim(),
        payoutPreference: payoutPref,
        bankName,
        bankCode,
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim()
      });
      setSellerProfile(res.profile);
      setAccountNumber('');
      setFeedback({ type: 'ok', text: 'Seller store & encrypted payout settings saved!' });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Failed to save settings.' });
    } finally {
      setBusy(false);
    }
  };

  const handleAdminReviewVendor = async (sellerId: string, decision: 'approve' | 'reject') => {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await reviewAdminVendorApplication(sellerId, decision);
      setFeedback({ type: 'ok', text: res.message });
      await loadSellerData();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Could not update vendor status.' });
    } finally {
      setBusy(false);
    }
  };

  const isVerifiedVendor = Boolean(
    sellerProfile &&
      (sellerProfile.isAdmin || sellerProfile.verified || sellerProfile.applicationStatus === 'APPROVED')
  );
  const isPendingVendor = sellerProfile?.applicationStatus === 'PENDING_APPROVAL';
  const activeListings = myProducts.filter((p) => p.status === 'ACTIVE' && p.stock > 0);
  const soldOrArchivedProducts = myProducts.filter((p) => p.status === 'SOLD' || p.status === 'ARCHIVED' || p.stock === 0);
  const pendingAdminCount = adminVendors.filter((v) => v.applicationStatus === 'PENDING_APPROVAL').length;

  return (
    <div className="max-w-[960px] mx-auto px-3 sm:px-6 pt-4 pb-28 space-y-4">
      {/* Top Profile Banner */}
      <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl border border-pink-200 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center font-black text-lg">
            {(sellerProfile?.storeName || userName || userEmail || 'E').slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-black flex flex-wrap items-center gap-1.5">
              <span>{sellerProfile?.storeName || userName || 'EFADO Member'}</span>
              {sellerProfile?.efadoId && (
                <span className="px-2 py-0.5 rounded-md bg-[#2563EB] text-white text-[11px] font-black">
                  {sellerProfile.efadoId}
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 text-[#16A34A] text-[11px] font-extrabold border border-[#16A34A]/20">
                <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                Online Now
              </span>
            </h2>
            <p className="text-xs text-black/65 mb-0">{userEmail}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenVendorRegistration}
            className="px-3.5 py-2 rounded-xl bg-white text-[#2563EB] border border-pink-200 text-xs font-extrabold hover:bg-pink-50 flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{isVerifiedVendor ? 'Seller KYC Status' : 'Become a Seller'}</span>
          </button>
          <div className="text-right">
            <p className="text-[11px] font-bold text-black/60 mb-0">EFADO Wallet</p>
            <p className="text-base font-black text-[#16A34A] tabular-nums mb-0">
              {formatNaira(walletBalanceNgn, true)}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenWallet}
            className="px-3.5 py-2 rounded-xl bg-[#F59E0B] text-black text-xs font-black hover:bg-[#D97706]"
          >
            Open Wallet
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className={`grid grid-cols-2 ${sellerProfile?.isAdmin ? 'sm:grid-cols-6' : 'sm:grid-cols-5'} gap-2 bg-white p-1.5 rounded-2xl border border-pink-200 shadow-sm`}>
        {[
          { id: 'sell' as const, label: 'List Fairly Used' },
          { id: 'my_listings' as const, label: `Active (${activeListings.length})` },
          { id: 'archive' as const, label: `Archive (${soldOrArchivedProducts.length})` },
          { id: 'orders' as const, label: `Orders (${sellerOrders.length})` },
          { id: 'payout' as const, label: 'Payout' },
          ...(sellerProfile?.isAdmin
            ? [{ id: 'approvals' as const, label: `Approvals (${pendingAdminCount})` }]
            : [])
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSection(t.id)}
            className={`py-2.5 px-2 rounded-xl text-xs font-extrabold transition-all truncate ${
              section === t.id ? 'bg-[#2563EB] text-white shadow-sm' : 'text-black/70 hover:bg-purple-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {feedback && (
        <div
          className={`rounded-xl p-3.5 text-xs font-bold border ${
            feedback.type === 'ok'
              ? 'bg-green-50 border-[#16A34A]/30 text-[#16A34A]'
              : 'bg-red-50 border-[#DC2626]/30 text-[#DC2626]'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {section === 'sell' && !isVerifiedVendor && (
        <div className="bg-white rounded-2xl border-2 border-pink-200 p-6 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#2563EB] flex items-center justify-center mx-auto">
            {isPendingVendor ? <FileCheck2 className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-black text-black">
              {isPendingVendor ? 'Seller Registration — Pending Approval' : 'Complete Seller KYC to List Fairly Used Items'}
            </h3>
            <p className="text-xs text-black/70 leading-relaxed mb-0">
              {isPendingVendor
                ? 'Your application is awaiting EFADO Admin review. You will get an alert once approved.'
                : 'Register with Government ID & Payout Bank/Wallet to unlock your EFADO-XXXX Chat ID and product publishing.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={onOpenVendorRegistration}
              className="px-6 py-3 bg-[#F59E0B] hover:bg-[#D97706] text-black font-black text-sm rounded-xl shadow-sm"
            >
              {isPendingVendor ? 'View Application Status' : 'Become a Seller Now'}
            </button>
            <button
              type="button"
              onClick={loadSellerData}
              className="px-4 py-3 bg-purple-50 text-black font-bold text-xs rounded-xl border border-pink-200"
            >
              Refresh Status
            </button>
          </div>
        </div>
      )}

      {section === 'sell' && isVerifiedVendor && (
        <form onSubmit={handleCreateProduct} className="bg-white rounded-2xl border border-pink-200 p-5 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pink-100 pb-3">
            <h3 className="text-base font-extrabold text-black flex items-center gap-2 mb-0">
              <PlusCircle className="w-5 h-5 text-[#2563EB]" />
              <span>List Fairly Used Product</span>
            </h3>
            <span className="px-3 py-1 rounded-lg bg-[#2563EB] text-white text-xs font-black">
              Auto EFADO ID: {sellerProfile?.efadoId || 'EFADO-XXXX'}
            </span>
          </div>

          {/* 3. SINGLE vs MANY/BULK + 4 SELLER TYPES */}
          <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl border border-pink-200 p-4 space-y-4">
            <div>
              <label className="block text-xs font-black text-black mb-2">
                Are you selling 1 item or Many / Bulk? *
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setListingMode('single');
                    setProdStock('1');
                  }}
                  className={`py-2.5 px-3 rounded-xl border-2 text-xs font-extrabold ${
                    listingMode === 'single' ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]' : 'border-pink-200 bg-white text-black'
                  }`}
                >
                  1 Item (Single)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setListingMode('bulk');
                    setSellerType('business_closing');
                    setProdStock(String(computedBulkQty || 10));
                  }}
                  className={`py-2.5 px-3 rounded-xl border-2 text-xs font-extrabold ${
                    listingMode === 'bulk' ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]' : 'border-pink-200 bg-white text-black'
                  }`}
                >
                  Many / Bulk (e.g. 10 Laptops)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-black mb-2">Seller Type *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SELLER_TYPES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setSellerType(st.id);
                      if (st.id === 'business_closing') {
                        setListingMode('bulk');
                        setReasonForSelling('Closing Business');
                      } else if (st.id === 'house_land') {
                        setListingMode('single');
                        setProdCategory('Houses & Land');
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold ${
                      sellerType === st.id
                        ? 'border-[#2563EB] bg-[#2563EB] text-white'
                        : 'border-pink-200 bg-white text-black'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4a. 5 REAL PHOTOS (REQUIRED) */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-extrabold text-black">
                5 Real Photos Required ({prodPhotos.length}/5) — Camera or Gallery *
              </label>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleProductFilePhotos(e.target.files)}
                  className="hidden"
                />
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleProductFilePhotos(e.target.files)}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={prodPhotos.length >= 5}
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 border border-pink-200 text-black text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Camera className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Camera</span>
                </button>
                <button
                  type="button"
                  disabled={prodPhotos.length >= 5}
                  onClick={() => galleryInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                  <span>Gallery</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {prodPhotos.map((src, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl border border-pink-200 overflow-hidden bg-slate-50">
                  <img src={src} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setProdPhotos((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 p-1 rounded-full bg-[#DC2626] text-white shadow"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {prodPhotos.length < 5 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                <span className="text-[11px] font-bold text-black/60 shrink-0">Quick Fill Sample Photos:</span>
                {SAMPLE_PHOTOS.map((sp) => (
                  <button
                    key={sp.url}
                    type="button"
                    onClick={() =>
                      setProdPhotos((prev) => [...prev, sp.url].slice(0, 5))
                    }
                    className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-pink-50 text-black text-[11px] font-bold whitespace-nowrap border border-pink-200"
                  >
                    + {sp.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 4b. 1 REAL WORKING VIDEO (REQUIRED) */}
          <div className="bg-purple-50/70 rounded-xl border border-pink-200 p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-extrabold text-black flex items-center gap-1.5">
                <Video className="w-4 h-4 text-[#2563EB]" />
                <span>1 Real Video of Item Working (TV ON, Laptop Booting) *</span>
              </label>
              <div>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/*"
                  onChange={handleProductVideoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold"
                >
                  Upload Working Video (&lt;680KB)
                </button>
              </div>
            </div>
            {prodVideoUrl && (
              <video src={prodVideoUrl} controls className="w-full max-h-48 rounded-xl bg-black" />
            )}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-black/60 shrink-0">Working Demo Clip:</span>
              {DEMO_WORKING_VIDEOS.map((dv) => (
                <button
                  key={dv.url}
                  type="button"
                  onClick={() => setProdVideoUrl(dv.url)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap border ${
                    prodVideoUrl === dv.url
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'bg-white text-black border-pink-200'
                  }`}
                >
                  {dv.label}
                </button>
              ))}
            </div>
          </div>

          {/* Core Required Listing Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-black mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                placeholder="e.g. UK Used iPhone 14 Pro 256GB or 10 Office Laptops"
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-sm text-black"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-black mb-1">
                {listingMode === 'bulk' ? 'Price Per Item (₦) *' : 'Asking Price (₦) *'}
              </label>
              <input
                type="number"
                required
                min={100}
                value={prodPrice}
                onChange={(e) => setProdPrice(e.target.value)}
                placeholder="e.g. 480000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-sm font-bold text-black tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-black mb-1">Category *</label>
              <select
                value={prodCategory}
                onChange={(e) => setProdCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-sm text-black"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-black mb-1">Condition Grade *</label>
              <select
                value={conditionGrade}
                onChange={(e) => setConditionGrade(e.target.value as ConditionGrade)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-sm font-bold text-black"
              >
                <option value="A">A - Like New</option>
                <option value="B">B - Neatly Used</option>
                <option value="C">C - Used With Small Scratch</option>
                <option value="D">D - Needs Repair</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-black mb-1">Reason For Selling *</label>
              <select
                value={reasonForSelling}
                onChange={(e) => setReasonForSelling(e.target.value as ReasonForSelling)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-sm font-bold text-black"
              >
                <option value="Relocating Abroad">Relocating Abroad (Red Urgent Tag)</option>
                <option value="Need Money">Need Money</option>
                <option value="Closing Business">Closing Business</option>
                <option value="Upgraded">Upgraded</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-black mb-1">How Long Used *</label>
              <input
                type="text"
                required
                value={howLongUsed}
                onChange={(e) => setHowLongUsed(e.target.value)}
                placeholder="e.g. 6 Months, 1 Year, 2 Years"
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-sm text-black"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-black mb-1">Working Perfectly? *</label>
              <select
                value={workingPerfectly ? 'Yes' : 'No'}
                onChange={(e) => setWorkingPerfectly(e.target.value === 'Yes')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-sm font-bold text-black"
              >
                <option value="Yes">Yes - Working Perfectly</option>
                <option value="No">No - Has Minor/Major Issue</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-black mb-1">Quantity *</label>
              <input
                type="number"
                required
                min={1}
                value={prodStock}
                onChange={(e) => setProdStock(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-sm font-bold text-black"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-black mb-1">
                What Is Fault? (Must write exact fault or "None - everything tested OK") *
              </label>
              <input
                type="text"
                required
                value={faultDescription}
                onChange={(e) => setFaultDescription(e.target.value)}
                placeholder="e.g. Battery at 89%, tiny scratch at corner — or None, works 100%"
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-sm text-black"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-black mb-1">Location *</label>
              <input
                type="text"
                required
                value={prodLocation}
                onChange={(e) => setProdLocation(e.target.value)}
                placeholder="e.g. Warri, Delta State"
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-sm text-black"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-black mb-1">Brand</label>
              <input
                type="text"
                value={prodBrand}
                onChange={(e) => setProdBrand(e.target.value)}
                placeholder="e.g. Apple, HP, Toyota, LG"
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-sm text-black"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-black mb-1">Delivery or Pickup Only? *</label>
              <select
                value={deliveryOption}
                onChange={(e) => setDeliveryOption(e.target.value as DeliveryOption)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-sm font-bold text-black"
              >
                <option value="BOTH">Delivery &amp; Warri Office / Seller Pickup</option>
                <option value="DELIVERY">Delivery Nationwide</option>
                <option value="PICKUP_ONLY">Pickup / Inspection Only</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-black mb-1">Negotiable? *</label>
              <select
                value={negotiable ? 'Yes' : 'No'}
                onChange={(e) => setNegotiable(e.target.value === 'Yes')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-sm font-bold text-black"
              >
                <option value="Yes">Yes - Buyers Can Make Offers</option>
                <option value="No">No - Fixed Fair Price</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-black">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={canInspect}
                onChange={(e) => setCanInspect(e.target.checked)}
                className="w-4 h-4 accent-[#2563EB]"
              />
              <span>Can Buyer Inspect Before Release? Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={keptInEfadoStore}
                onChange={(e) => setKeptInEfadoStore(e.target.checked)}
                className="w-4 h-4 accent-[#2563EB]"
              />
              <span>Item Kept Inside EFADO Store (Gives "Verified By EFADO - In Store" badge)</span>
            </label>
          </div>

          {/* Conditional Business Closing / Bulk Listing Table */}
          {(listingMode === 'bulk' || sellerType === 'business_closing') && (
            <div className="bg-amber-50 border border-[#F59E0B] rounded-2xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-black text-black uppercase mb-0">
                  Bulk / Business Closing Items List (Total Qty: {computedBulkQty} • Total Value:{' '}
                  {formatNaira(Number(bulkTotalPriceInput) || computedBulkTotal)})
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    setBulkItems((prev) => [...prev, { name: '', quantity: 1, unitPrice: 0, notes: '' }])
                  }
                  className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Row</span>
                </button>
              </div>
              <div className="space-y-2">
                {bulkItems.map((bi, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      value={bi.name}
                      onChange={(e) =>
                        setBulkItems((prev) => prev.map((r, i) => (i === idx ? { ...r, name: e.target.value } : r)))
                      }
                      placeholder="Item name (e.g. HP Laptop)"
                      className="col-span-5 px-2.5 py-2 rounded-lg border border-pink-200 bg-white text-xs text-black"
                    />
                    <input
                      type="number"
                      min={1}
                      value={bi.quantity}
                      onChange={(e) =>
                        setBulkItems((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, quantity: Number(e.target.value || 1) } : r))
                        )
                      }
                      placeholder="Qty"
                      className="col-span-2 px-2 py-2 rounded-lg border border-pink-200 bg-white text-xs font-bold text-black"
                    />
                    <input
                      type="number"
                      min={0}
                      value={bi.unitPrice}
                      onChange={(e) =>
                        setBulkItems((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, unitPrice: Number(e.target.value || 0) } : r))
                        )
                      }
                      placeholder="Price/item"
                      className="col-span-4 px-2 py-2 rounded-lg border border-pink-200 bg-white text-xs font-bold text-black"
                    />
                    <button
                      type="button"
                      onClick={() => setBulkItems((prev) => prev.filter((_, i) => i !== idx))}
                      className="col-span-1 p-1.5 rounded-lg bg-red-50 text-[#DC2626] flex justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Total Price For All Items (₦) — Optional Override
                </label>
                <input
                  type="number"
                  value={bulkTotalPriceInput}
                  onChange={(e) => setBulkTotalPriceInput(e.target.value)}
                  placeholder={String(computedBulkTotal)}
                  className="w-full sm:w-64 px-3 py-2 rounded-xl border border-pink-200 bg-white text-xs font-bold text-black"
                />
              </div>
            </div>
          )}

          {/* Conditional House / Land Seller Fields */}
          {(sellerType === 'house_land' || prodCategory === 'Houses & Land') && (
            <div className="bg-blue-50 border border-[#2563EB]/30 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-black text-[#2563EB] uppercase flex items-center gap-1.5 mb-0">
                <Home className="w-4 h-4" />
                <span>House / Land Details &amp; Title Documents *</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-black mb-1">Rooms</label>
                  <input
                    type="text"
                    value={houseRooms}
                    onChange={(e) => setHouseRooms(e.target.value)}
                    placeholder="e.g. 4 Bedrooms"
                    className="w-full px-3 py-2 rounded-lg border border-pink-200 bg-white text-xs text-black"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-black mb-1">Bathrooms</label>
                  <input
                    type="text"
                    value={houseBathrooms}
                    onChange={(e) => setHouseBathrooms(e.target.value)}
                    placeholder="e.g. 5 Bathrooms"
                    className="w-full px-3 py-2 rounded-lg border border-pink-200 bg-white text-xs text-black"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-black mb-1">Land Size</label>
                  <input
                    type="text"
                    value={houseLandSize}
                    onChange={(e) => setHouseLandSize(e.target.value)}
                    placeholder="e.g. 50 x 100 ft (465 sqm)"
                    className="w-full px-3 py-2 rounded-lg border border-pink-200 bg-white text-xs text-black"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-black mb-1">Documents Available *</label>
                <div className="flex flex-wrap gap-2">
                  {HOUSE_DOCS.map((docItem) => {
                    const checked = houseDocs.includes(docItem);
                    return (
                      <button
                        key={docItem}
                        type="button"
                        onClick={() =>
                          setHouseDocs((prev) =>
                            checked ? prev.filter((d) => d !== docItem) : [...prev, docItem]
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                          checked ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-white text-black border-pink-200'
                        }`}
                      >
                        {docItem}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-black mb-1">Occupied? *</label>
                  <select
                    value={houseOccupied}
                    onChange={(e) => setHouseOccupied(e.target.value as 'Yes' | 'No')}
                    className="w-full px-3 py-2 rounded-lg border border-pink-200 bg-white text-xs font-bold text-black"
                  >
                    <option value="No">No (Vacant)</option>
                    <option value="Yes">Yes (Currently Occupied)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-black mb-1">Full Property Address *</label>
                  <input
                    type="text"
                    required
                    value={houseFullAddress}
                    onChange={(e) => setHouseFullAddress(e.target.value)}
                    placeholder="Full street, estate, and town (e.g. Effurun-Warri, Delta State)"
                    className="w-full px-3 py-2 rounded-lg border border-pink-200 bg-white text-xs text-black"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-black mb-1">Description &amp; Notes</label>
            <textarea
              rows={2}
              value={prodDesc}
              onChange={(e) => setProdDesc(e.target.value)}
              placeholder="Add accessories included, history, inspection schedule in Warri..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-sm text-black"
            />
          </div>

          {deliveryOption !== 'PICKUP_ONLY' && (
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-bold text-black cursor-pointer">
                <input
                  type="checkbox"
                  checked={prodFreeDelivery}
                  onChange={(e) => setProdFreeDelivery(e.target.checked)}
                  className="w-4 h-4 accent-[#2563EB]"
                />
                <span>Free Delivery</span>
              </label>
              {!prodFreeDelivery && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-black">Delivery Fee (₦):</label>
                  <input
                    type="number"
                    min={0}
                    value={prodDeliveryFee}
                    onChange={(e) => setProdDeliveryFee(e.target.value)}
                    className="w-28 px-3 py-1.5 rounded-lg border border-pink-200 text-xs font-bold text-black tabular-nums"
                  />
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full sm:w-auto px-6 py-3.5 bg-[#F59E0B] hover:bg-[#D97706] text-black font-black text-sm rounded-xl shadow-sm"
          >
            {busy ? 'Publishing...' : 'Publish Fairly Used Listing + Reel'}
          </button>
        </form>
      )}

      {/* MY ACTIVE LISTINGS & PRICE DROP ALERT TRIGGER */}
      {section === 'my_listings' && (
        <div className="bg-white rounded-2xl border border-pink-200 p-5 shadow-sm space-y-3">
          <h3 className="text-base font-extrabold text-black flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-[#2563EB]" />
            <span>Active Listings — Reduce Price &amp; Alert Chatted Buyers</span>
          </h3>
          {activeListings.length === 0 ? (
            <p className="text-xs text-black/60 py-6 text-center">You have no active Fairly Used listings yet.</p>
          ) : (
            activeListings.map((p) => (
              <div
                key={p.id}
                className="border border-pink-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-br from-purple-50/50 to-pink-50/50"
              >
                <div className="flex items-center gap-3">
                  <img src={p.photos[0]} alt={p.name} className="w-14 h-14 rounded-lg object-cover border border-pink-100" />
                  <div>
                    <p className="text-sm font-bold text-black mb-0">{p.name}</p>
                    <p className="text-xs text-black/70 mb-0">
                      Current: <strong className="text-[#2563EB]">{formatNaira(p.price)}</strong> • Grade {p.conditionGrade} • Stock: {p.stock}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="number"
                    min={100}
                    value={priceDropInputs[p.id] ?? ''}
                    onChange={(e) => setPriceDropInputs({ ...priceDropInputs, [p.id]: e.target.value })}
                    placeholder="New Lower ₦"
                    className="w-32 px-2.5 py-2 rounded-lg border border-pink-200 bg-white text-xs font-bold text-black"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handlePriceDropSubmit(p)}
                    className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black text-xs font-black rounded-lg"
                  >
                    Drop Price &amp; Alert
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {section === 'archive' && (
        <div className="bg-white rounded-2xl border border-pink-200 p-5 shadow-sm space-y-3">
          <h3 className="text-base font-extrabold text-black">Sold Items Archive &amp; 1-Click Relist</h3>
          <p className="text-xs text-black/65">
            Sold items move here after 24 hours. Enter quantity and click Relist to go live &amp; notify waitlisted buyers.
          </p>
          {soldOrArchivedProducts.length === 0 ? (
            <p className="text-xs font-bold text-black/45 py-6 text-center">No sold or archived products right now.</p>
          ) : (
            soldOrArchivedProducts.map((p) => (
              <div
                key={p.id}
                className="border border-pink-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <img src={p.photos[0]} alt={p.name} className="w-14 h-14 rounded-lg object-cover grayscale" />
                  <div>
                    <p className="text-sm font-bold text-black mb-0">{p.name}</p>
                    <p className="text-xs text-black/65 mb-0">
                      <span className="text-[#DC2626] font-extrabold">{p.status}</span> •{' '}
                      <strong className="text-[#2563EB]">{p.waitlistCount || 0} buyer(s) waiting</strong>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="number"
                    min={1}
                    value={relistStocks[p.id] ?? '1'}
                    onChange={(e) => setRelistStocks({ ...relistStocks, [p.id]: e.target.value })}
                    className="w-20 px-2.5 py-2 rounded-lg border border-pink-200 text-xs font-bold text-black text-center"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleRelist(p)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-[#16A34A] text-white text-xs font-extrabold rounded-lg"
                  >
                    Relist Now
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {section === 'orders' && (
        <div className="space-y-3">
          {sellerOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-pink-200 p-8 text-center text-xs text-black/60">
              No incoming Fairly Used seller orders yet.
            </div>
          ) : (
            sellerOrders.map((ord) => (
              <div key={ord.orderId} className="bg-white rounded-2xl border border-pink-200 p-4 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pink-100 pb-2">
                  <span className="text-xs font-extrabold text-[#2563EB] tabular-nums">{ord.orderId}</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-[#2563EB] text-xs font-extrabold">
                    {ord.escrowStatus}
                  </span>
                </div>
                <div className="flex gap-3 items-start">
                  <img src={ord.productPhoto} alt={ord.productName} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0 text-xs text-black space-y-1">
                    <p className="font-bold mb-0">
                      {ord.productName} (Qty {ord.quantity}) — {formatNaira(ord.subtotal + ord.deliveryFee, true)}
                    </p>
                    <p className="mb-0">
                      Buyer: <strong>{ord.recipientName}</strong> ({ord.recipientPhone})
                    </p>
                    <p className="mb-0">
                      Pickup Code: <strong className="text-[#2563EB]">{ord.pickupCode || 'Pending'}</strong> • Stage:{' '}
                      <strong>{ord.status.replace(/_/g, ' ')}</strong>
                    </p>
                  </div>
                </div>
                {['PAID_ESCROW_HELD', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(ord.status) && (
                  <div className="flex flex-wrap gap-2">
                    {ord.status === 'PAID_ESCROW_HELD' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleUpdateOrderStage(ord.orderId, 'SHIPPED')}
                        className="px-3.5 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-xl"
                      >
                        Mark As Shipped
                      </button>
                    )}
                    {['PAID_ESCROW_HELD', 'SHIPPED'].includes(ord.status) && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleUpdateOrderStage(ord.orderId, 'OUT_FOR_DELIVERY')}
                        className="px-3.5 py-2 bg-purple-100 text-black text-xs font-bold rounded-xl"
                      >
                        Mark As Out For Delivery
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleUpdateOrderStage(ord.orderId, 'DELIVERED')}
                      className="px-3.5 py-2 bg-[#16A34A] text-white text-xs font-bold rounded-xl"
                    >
                      Mark As Delivered / Ready For Pickup
                    </button>
                  </div>
                )}
                {ord.status === 'DISPUTED' && (
                  <div className="bg-red-50 border border-[#DC2626]/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#DC2626]">Dispute: {ord.disputeReason}</span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleApproveRefund(ord.orderId)}
                      className="px-3 py-1.5 bg-[#DC2626] text-white text-xs font-bold rounded-lg"
                    >
                      Issue Full Refund
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {section === 'payout' && (
        <form onSubmit={handleSavePayout} className="bg-white rounded-2xl border border-pink-200 p-5 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-black">Store &amp; Escrow Payout Destination</h3>
          <p className="text-xs text-black/65">
            Bank account numbers are encrypted and NEVER shown to buyers. Your EFADO ID:{' '}
            <strong className="text-[#2563EB]">{sellerProfile?.efadoId || 'EFADO-XXXX'}</strong>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-black mb-1">Store / Seller Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 text-sm text-black"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-black mb-1">Meeting / Pickup Address</label>
              <input
                type="text"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="Warri office or seller inspection address"
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 text-sm text-black"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPayoutPref('wallet')}
              className={`p-3.5 rounded-xl border-2 text-left flex items-center gap-3 ${
                payoutPref === 'wallet' ? 'border-[#2563EB] bg-blue-50' : 'border-pink-200'
              }`}
            >
              <Wallet className="w-5 h-5 text-[#2563EB]" />
              <div>
                <p className="text-xs font-extrabold text-black mb-0">EFADO Wallet (Instant)</p>
                <p className="text-[11px] text-black/60 mb-0">Zero transfer delay</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setPayoutPref('bank')}
              className={`p-3.5 rounded-xl border-2 text-left flex items-center gap-3 ${
                payoutPref === 'bank' ? 'border-[#2563EB] bg-blue-50' : 'border-pink-200'
              }`}
            >
              <Store className="w-5 h-5 text-[#2563EB]" />
              <div>
                <p className="text-xs font-extrabold text-black mb-0">Nigerian Bank Account</p>
                <p className="text-[11px] text-black/60 mb-0">
                  {sellerProfile?.accountNumberMasked ? `Saved: ${sellerProfile.accountNumberMasked}` : 'Direct NUBAN transfer'}
                </p>
              </div>
            </button>
          </div>

          {payoutPref === 'bank' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-purple-50 p-4 rounded-xl border border-pink-200">
              <select
                value={bankCode}
                onChange={(e) => {
                  const code = e.target.value;
                  setBankCode(code);
                  const found = VENDOR_BANKS.find((b) => b.code === code);
                  if (found) setBankName(found.name);
                }}
                className="px-3 py-2 rounded-xl border border-pink-200 bg-white text-xs font-bold text-black"
              >
                {VENDOR_BANKS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
              <input
                type="text"
                maxLength={10}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                placeholder={sellerProfile?.accountNumberMasked || '10-digit Account Number'}
                className="px-3 py-2 rounded-xl border border-pink-200 bg-white text-xs font-bold text-black"
              />
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Verified Account Holder Name"
                className="px-3 py-2 rounded-xl border border-pink-200 bg-white text-xs font-bold text-black"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="px-6 py-3 bg-[#F59E0B] hover:bg-[#D97706] text-black font-black text-sm rounded-xl shadow-sm"
          >
            {busy ? 'Saving...' : 'Save Payout Settings'}
          </button>
        </form>
      )}

      {section === 'approvals' && sellerProfile?.isAdmin && (
        <div className="bg-white rounded-2xl border border-pink-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-black">Fairly Used Seller Approvals (Admin)</h3>
            <button
              type="button"
              onClick={loadSellerData}
              className="px-3 py-1.5 rounded-lg bg-purple-50 text-[#2563EB] text-xs font-bold"
            >
              Refresh List
            </button>
          </div>
          {adminVendors.length === 0 ? (
            <p className="text-xs text-black/60 text-center py-6">No seller applications submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {adminVendors.map((v) => {
                const vApproved = v.applicationStatus === 'APPROVED' || v.verified;
                return (
                  <div key={v.sellerId} className="border border-pink-200 rounded-xl p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-extrabold text-black mb-0">
                          {v.storeName} ({v.efadoId})
                        </h4>
                        <p className="text-xs text-black/70 mb-0">
                          {v.ownerFullName} • {v.phone} • {v.email}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-extrabold ${
                          vApproved ? 'bg-green-50 text-[#16A34A]' : 'bg-blue-50 text-[#2563EB]'
                        }`}
                      >
                        {v.applicationStatus || (vApproved ? 'APPROVED' : 'PENDING')}
                      </span>
                    </div>

                    {v.idPhotoPreview && (
                      <div>
                        <button
                          type="button"
                          onClick={() => setExpandedKycId(expandedKycId === v.sellerId ? null : v.sellerId)}
                          className="text-xs font-bold text-[#2563EB] underline"
                        >
                          {expandedKycId === v.sellerId ? 'Hide ID Photo' : 'View Uploaded ID Photo'}
                        </button>
                        {expandedKycId === v.sellerId && (
                          <img
                            src={v.idPhotoPreview}
                            alt="Seller KYC"
                            className="mt-2 max-h-56 rounded-xl border border-pink-200 object-contain"
                          />
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {!vApproved && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleAdminReviewVendor(v.sellerId, 'approve')}
                          className="px-4 py-2 bg-[#16A34A] text-white text-xs font-extrabold rounded-xl"
                        >
                          Approve Seller
                        </button>
                      )}
                      {v.applicationStatus !== 'REJECTED' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleAdminReviewVendor(v.sellerId, 'reject')}
                          className="px-4 py-2 bg-red-50 text-[#DC2626] border border-[#DC2626]/30 text-xs font-extrabold rounded-xl"
                        >
                          Decline
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
