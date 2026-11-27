import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Bell,
  Camera,
  CheckCircle2,
  FileCheck2,
  ImagePlus,
  Loader2,
  Lock,
  MessageCircle,
  Package,
  PlusCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Store,
  Trash2,
  Truck,
  UserCheck,
  UserPlus,
  Wallet
} from 'lucide-react';
import {
  createMarketplaceProduct,
  fetchAdminVendorApplications,
  fetchChatMessages,
  fetchMarketAlerts,
  fetchMarketplaceProducts,
  fetchMyChatThreads,
  fetchMyOrders,
  fetchSellerOrders,
  fetchSellerProfile,
  formatNaira,
  refundDisputedOrder,
  registerVendorApplication,
  relistMarketplaceProduct,
  resolveVendorBankAccount,
  reviewAdminVendorApplication,
  saveSellerProfile,
  sendChatMessage,
  submitProductReview,
  updateSellerOrderShipping
} from './marketApi';
import type {
  AdminVendorApplication,
  ModernMarketAlert,
  ModernMarketCategory,
  ModernMarketChatMessage,
  ModernMarketChatThread,
  ModernMarketOrder,
  ModernProduct,
  SellerProfilePrivate,
  VendorIdType
} from '../../types/modernMarket';

const STUDIO_PHOTOS: Array<{ label: string; url: string }> = [
  { label: 'Smartphone Sealed', url: '/assets/market/iphone_13_pro_max.jpg' },
  { label: 'Pro Laptop', url: '/assets/market/macbook_pro_14.jpg' },
  { label: 'ANC Headphones', url: '/assets/market/sony_headphones.jpg' },
  { label: 'Gaming Console', url: '/assets/market/ps5_console.jpg' },
  { label: 'Espresso Appliance', url: '/assets/market/espresso_maker.jpg' },
  { label: 'Smartwatch Titanium', url: '/assets/market/smartwatch_ultra.jpg' },
  { label: 'Leather Sneakers', url: '/assets/market/fashion_sneakers.jpg' },
  { label: 'Skincare Set', url: '/assets/market/beauty_skincare.jpg' }
];

const CATEGORIES: Array<Exclude<ModernMarketCategory, 'All'>> = [
  'Phones',
  'Laptops',
  'Audio',
  'Home Appliances',
  'Fashion New',
  'Beauty New',
  'Gaming',
  'Accessories'
];

const NIGERIA_STATES: string[] = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers State', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
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

async function compressImageFileToDataUrl(file: File, maxDim: number = 900, quality: number = 0.76): Promise<string> {
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
          const out = canvas.toDataURL('image/jpeg', quality);
          resolve(out);
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
// REAL BUYER-SELLER CHAT PAGE (FULL PAGE)
// ============================================================================
interface SellerChatPageProps {
  currentUserId: string;
  productId: string;
  productName: string;
  productPhoto: string;
  sellerId: string;
  sellerName: string;
  buyerId?: string;
  onBack: () => void;
}

export const SellerChatPage: React.FC<SellerChatPageProps> = ({
  currentUserId,
  productId,
  productName,
  productPhoto,
  sellerId,
  sellerName,
  buyerId,
  onBack
}) => {
  const [messages, setMessages] = useState<ModernMarketChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadMessages = async () => {
    try {
      const res = await fetchChatMessages(productId, sellerId, buyerId);
      setMessages(res.messages || []);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not load conversation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    const timer = setInterval(loadMessages, 5000);
    return () => clearInterval(timer);
  }, [productId, sellerId, buyerId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = text.trim();
    if (!clean) return;
    setSending(true);
    setErrorMsg(null);
    try {
      const res = await sendChatMessage({ productId, sellerId, buyerId, text: clean });
      setMessages((prev) => [...prev, res.message]);
      setText('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Message failed to send.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-[820px] mx-auto px-3 sm:px-6 pt-4 pb-28 space-y-4">
      <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-sm flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-xl bg-purple-50 text-slate-800 hover:bg-purple-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <img src={productPhoto} alt={productName} className="w-11 h-11 rounded-xl object-cover border border-slate-100" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-extrabold text-slate-900 truncate">{sellerName}</h3>
            <BadgeCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
          </div>
          <p className="text-xs text-slate-500 truncate mb-0">{productName}</p>
        </div>
      </div>

      <div className="bg-green-50 border border-[#16A34A]/25 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-700 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
        <span>Always pay through EFADO Checkout so your money stays protected in Escrow.</span>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-[#DC2626]/30 rounded-xl p-3 text-xs font-bold text-[#DC2626]">
          {errorMsg}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-sm min-h-[340px] max-h-[55vh] overflow-y-auto space-y-3">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#7C3AED]" />
            <span>Loading chat messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <MessageCircle className="w-8 h-8 text-purple-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600 mb-0">Start a conversation with {sellerName}</p>
            <p className="text-xs text-slate-400">Ask about warranty, box contents, or pickup time.</p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === currentUserId;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs space-y-1 ${
                    mine
                      ? 'bg-[#7C3AED] text-white rounded-br-sm'
                      : 'bg-purple-50 text-slate-900 border border-purple-100 rounded-bl-sm'
                  }`}
                >
                  <p className={`text-[10px] font-bold mb-0 ${mine ? 'text-purple-100' : 'text-[#7C3AED]'}`}>
                    {m.senderName}
                  </p>
                  <p className={`text-xs leading-relaxed mb-0 ${mine ? 'text-white' : 'text-slate-800'}`}>{m.text}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your message to seller..."
          className="flex-1 px-4 py-3 rounded-xl border border-purple-200 bg-white text-sm text-slate-900 focus:border-[#7C3AED] outline-none shadow-sm"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="px-5 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white font-bold text-sm rounded-xl flex items-center gap-1.5 shadow-sm"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
};

// ============================================================================
// ACTIVITY PAGE (ORDERS, ESCROW TRACKING, ALERTS, CHATS)
// ============================================================================
interface ActivityPageProps {
  onOpenOrderTracking: (order: ModernMarketOrder) => void;
  onOpenChat: (thread: ModernMarketChatThread) => void;
  onBackToMarket: () => void;
}

export const ActivityPage: React.FC<ActivityPageProps> = ({
  onOpenOrderTracking,
  onOpenChat,
  onBackToMarket
}) => {
  const [tab, setTab] = useState<'orders' | 'chats' | 'alerts' | 'seller_orders'>('orders');
  const [orders, setOrders] = useState<ModernMarketOrder[]>([]);
  const [sellerOrders, setSellerOrders] = useState<ModernMarketOrder[]>([]);
  const [alerts, setAlerts] = useState<ModernMarketAlert[]>([]);
  const [threads, setThreads] = useState<ModernMarketChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellerBusy, setSellerBusy] = useState(false);
  const [sellerFeedback, setSellerFeedback] = useState('');
  const [reviewOrder, setReviewOrder] = useState<ModernMarketOrder | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ordRes, altRes, chatRes, sOrdRes] = await Promise.all([
        fetchMyOrders().catch(() => ({ orders: [] })),
        fetchMarketAlerts().catch(() => ({ alerts: [] })),
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

  const handleSellerStageUpdate = async (
    orderId: string,
    stage: 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED'
  ) => {
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
          <h2 className="text-xl font-extrabold text-slate-900 mb-0">Market Activity</h2>
          <p className="text-xs text-slate-500 mb-0">My Orders, Seller Chats, Alerts &amp; Seller Fulfilment</p>
        </div>
        <button
          type="button"
          onClick={loadAll}
          className="px-3 py-2 rounded-xl bg-white border border-purple-200 text-[#7C3AED] text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* 4 Tabs cleanly responsive on 360px & 1366px */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-1.5 rounded-2xl border border-purple-100 shadow-sm">
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
              tab === t.id ? 'bg-[#7C3AED] text-white shadow-sm' : 'text-slate-600 hover:bg-purple-50'
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
        <div className="bg-white rounded-2xl border border-purple-100 p-10 text-center text-xs text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-[#7C3AED] mx-auto mb-2" />
          Loading activity...
        </div>
      ) : tab === 'orders' ? (
        orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-purple-100 p-10 text-center space-y-3 shadow-sm">
            <Package className="w-10 h-10 text-purple-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No Orders Yet</h3>
            <p className="text-xs text-slate-500">
              EFADO Protects Your Money — your money is held safely until you confirm delivery.
            </p>
            <button
              type="button"
              onClick={onBackToMarket}
              className="px-5 py-2.5 bg-[#7C3AED] text-white rounded-xl text-xs font-bold"
            >
              Shop Brand New Market
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((ord) => (
              <div
                key={ord.orderId}
                className="bg-white rounded-2xl border border-purple-100 p-4 shadow-sm space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-50 pb-2">
                  <span className="text-xs font-extrabold text-[#7C3AED] tabular-nums">{ord.orderId}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {ord.pickupCode && (
                      <span className="px-2.5 py-0.5 rounded-md bg-purple-50 text-[#7C3AED] text-xs font-extrabold tabular-nums">
                        Code: {ord.pickupCode}
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                        ord.status === 'COMPLETED' || ord.status === 'DELIVERED'
                          ? 'bg-green-50 text-[#16A34A]'
                          : ord.status === 'DISPUTED' || ord.status === 'REFUNDED'
                            ? 'bg-red-50 text-[#DC2626]'
                            : 'bg-purple-50 text-[#7C3AED]'
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
                    className="w-16 h-16 rounded-xl object-cover border border-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate mb-0">{ord.productName}</h4>
                    <p className="text-xs text-slate-500 mb-0.5">
                      Seller: {ord.sellerName} • Qty {ord.quantity}
                    </p>
                    <p className="text-sm font-black text-slate-900 tabular-nums mb-0">
                      {formatNaira(ord.grandTotal, true)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onOpenOrderTracking(ord)}
                    className="flex-1 py-2.5 px-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl"
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
          <div className="bg-white rounded-2xl border border-purple-100 p-10 text-center text-xs text-slate-500">
            <MessageCircle className="w-8 h-8 text-purple-300 mx-auto mb-2" />
            No seller chats yet. Tap "Chat With Seller" on any product page.
          </div>
        ) : (
          <div className="space-y-2.5">
            {threads.map((th) => (
              <button
                key={th.threadId}
                type="button"
                onClick={() => onOpenChat(th)}
                className="w-full text-left bg-white rounded-2xl border border-purple-100 p-4 shadow-sm hover:border-[#7C3AED] flex items-center gap-3"
              >
                <img src={th.productPhoto} alt={th.productName} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate mb-0">{th.productName}</p>
                  <p className="text-xs text-[#7C3AED] font-semibold mb-0.5">{th.sellerName}</p>
                  <p className="text-xs text-slate-500 truncate mb-0">{th.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        )
      ) : tab === 'alerts' ? (
        alerts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-purple-100 p-10 text-center text-xs text-slate-500">
            <Bell className="w-8 h-8 text-purple-300 mx-auto mb-2" />
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-2.5">
            {alerts.map((al) => (
              <div key={al.id} className="bg-white rounded-2xl border border-purple-100 p-4 shadow-sm space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#7C3AED]">{al.title}</span>
                  <span className="text-[11px] text-slate-400">{new Date(al.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-700 mb-0">{al.message}</p>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-3">
          {pendingShipmentCount > 0 && (
            <div className="bg-purple-50 border border-[#7C3AED]/30 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs font-bold text-[#7C3AED]">
              <Bell className="w-4 h-4 shrink-0" />
              <span>
                New Order Alert: {pendingShipmentCount} paid order{pendingShipmentCount > 1 ? 's' : ''} awaiting shipment!
              </span>
            </div>
          )}
          {sellerFeedback && (
            <div className="bg-green-50 border border-[#16A34A]/30 rounded-xl p-3 text-xs font-bold text-[#16A34A]">
              {sellerFeedback}
            </div>
          )}
          {sellerOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-purple-100 p-10 text-center text-xs text-slate-500">
              <Store className="w-8 h-8 text-purple-300 mx-auto mb-2" />
              No incoming seller orders yet.
            </div>
          ) : (
            sellerOrders.map((ord) => (
              <div key={ord.orderId} className="bg-white rounded-2xl border border-purple-100 p-4 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-[#7C3AED] tabular-nums">{ord.orderId}</span>
                    {ord.status === 'PAID_ESCROW_HELD' && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-[#7C3AED] text-[10px] font-black">
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
                          : 'bg-purple-50 text-[#7C3AED]'
                    }`}
                  >
                    {ord.escrowStatus}
                  </span>
                </div>

                <div className="flex gap-3 items-start">
                  <img
                    src={ord.productPhoto}
                    alt={ord.productName}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0 text-xs text-slate-700 space-y-1">
                    <p className="font-extrabold text-slate-900 mb-0">
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
                      Pickup Code: <strong className="text-[#7C3AED] tabular-nums">{ord.pickupCode || 'Pending'}</strong> • Stage:{' '}
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
                        className="px-3.5 py-2 bg-[#7C3AED] text-white text-xs font-bold rounded-xl"
                      >
                        Mark As Shipped
                      </button>
                    )}
                    {['PAID_ESCROW_HELD', 'SHIPPED'].includes(ord.status) && (
                      <button
                        type="button"
                        disabled={sellerBusy}
                        onClick={() => handleSellerStageUpdate(ord.orderId, 'OUT_FOR_DELIVERY')}
                        className="px-3.5 py-2 bg-purple-100 text-[#7C3AED] text-xs font-bold rounded-xl"
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
          className="bg-white rounded-2xl border-2 border-[#7C3AED] p-5 shadow-md space-y-3"
        >
          <h4 className="text-sm font-extrabold text-slate-900">Review {reviewOrder.productName}</h4>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setReviewRating(star)}
                className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                  reviewRating >= star ? 'bg-[#7C3AED] text-white border-[#7C3AED]' : 'bg-white text-slate-500'
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
            placeholder="Share your feedback on product seal, speed, and seller..."
            className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs text-slate-900"
          />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-[#16A34A] text-white text-xs font-bold rounded-xl">
              Submit Review
            </button>
            <button
              type="button"
              onClick={() => setReviewOrder(null)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
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
// BECOME A SELLER — VENDOR REGISTRATION FULL PAGE (LIGHT MODE ONLY)
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

  const [storeName, setStoreName] = useState('');
  const [ownerFullName, setOwnerFullName] = useState(userName || '');
  const [phone, setPhone] = useState(userPhone || '');
  const [email, setEmail] = useState(userEmail || '');
  const [stateName, setStateName] = useState('Rivers State');
  const [city, setCity] = useState('');
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
      // unauthenticated or network notice handled cleanly
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
        setFeedback({ type: 'err', text: res.message || 'Could not verify bank account automatically. Check details.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Bank verification lookup unavailable. Verify digits & bank.' });
    } finally {
      setVerifyingBank(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!rulesAccepted) {
      setFeedback({ type: 'err', text: 'Please check Agree to EFADO Seller Rules before submitting.' });
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
      setFeedback({ type: 'ok', text: res.message || 'Pending Approval — Admin has been notified.' });
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
            className="p-2.5 rounded-xl bg-white border border-purple-200 text-slate-800 shadow-sm hover:bg-purple-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Become a Verified Seller</h2>
            <p className="text-xs text-slate-500 mb-0">EFADO Modern Day Market — Brand New &amp; Sealed Stores Only</p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadStatus}
          className="px-3 py-2 rounded-xl bg-white border border-purple-200 text-[#7C3AED] text-xs font-bold flex items-center gap-1.5 shadow-sm"
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
        <div className="bg-white rounded-2xl border border-purple-100 p-10 text-center text-xs text-slate-500 shadow-sm">
          <Loader2 className="w-6 h-6 animate-spin text-[#7C3AED] mx-auto mb-2" />
          Checking your Vendor verification status...
        </div>
      ) : isApproved ? (
        <div className="bg-white rounded-2xl border-2 border-[#16A34A]/40 p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-green-50 text-[#16A34A] flex items-center justify-center shrink-0">
                <BadgeCheck className="w-7 h-7" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#16A34A] text-white text-[11px] font-extrabold mb-1">
                  Verified Badge Active
                </span>
                <h3 className="text-lg font-black text-slate-900 mb-0">You are Verified Vendor</h3>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-green-50 text-[#16A34A] text-xs font-extrabold border border-[#16A34A]/20">
              Vendor Approved - You can now list products
            </span>
          </div>

          <div className="bg-purple-50/70 rounded-xl p-4 border border-purple-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-slate-500 font-bold mb-0.5">Store Name</p>
              <p className="font-extrabold text-slate-900 mb-0">{profile?.storeName || 'EFADO Merchant'}</p>
            </div>
            <div>
              <p className="text-slate-500 font-bold mb-0.5">Store Location</p>
              <p className="font-extrabold text-slate-900 mb-0">{profile?.location || 'Nigeria'}</p>
            </div>
            <div>
              <p className="text-slate-500 font-bold mb-0.5">Escrow Payout</p>
              <p className="font-extrabold text-[#7C3AED] mb-0">
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
              className="px-6 py-3.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-sm rounded-xl shadow-sm flex items-center gap-2"
            >
              <Store className="w-4 h-4" />
              <span>Go To My Seller Hub</span>
            </button>
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-3.5 bg-purple-50 text-[#7C3AED] font-bold text-sm rounded-xl border border-purple-200"
            >
              Back to Market
            </button>
          </div>
        </div>
      ) : isPending ? (
        <div className="bg-white rounded-2xl border-2 border-[#7C3AED]/40 p-6 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#7C3AED] flex items-center justify-center shrink-0">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="inline-block px-3 py-1 rounded-md bg-[#7C3AED] text-white text-xs font-extrabold">
                Pending Approval
              </span>
              <h3 className="text-lg font-black text-slate-900">Your Vendor Application is Under Review</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-0">
                An Alert has been sent to EFADO Admin. Once verified, you will receive{' '}
                <strong>"Vendor Approved - You can now list products"</strong> and your Verified Badge will unlock automatically.
              </p>
            </div>
          </div>

          <div className="bg-purple-50/70 rounded-xl p-4 border border-purple-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-slate-500 font-bold mb-0.5">Store Name</p>
              <p className="font-extrabold text-slate-900 mb-0">{profile?.storeName}</p>
            </div>
            <div>
              <p className="text-slate-500 font-bold mb-0.5">Owner &amp; Phone</p>
              <p className="font-extrabold text-slate-900 mb-0">
                {profile?.ownerFullName} ({profile?.phone})
              </p>
            </div>
            <div>
              <p className="text-slate-500 font-bold mb-0.5">Location</p>
              <p className="font-extrabold text-slate-900 mb-0">{profile?.location}</p>
            </div>
            <div>
              <p className="text-slate-500 font-bold mb-0.5">ID Submitted &amp; Payout</p>
              <p className="font-extrabold text-slate-900 mb-0">
                {profile?.idType} • {profile?.payoutPreference === 'bank' ? `${profile?.bankName} ${profile?.accountNumberMasked}` : 'EFADO Wallet'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadStatus}
              className="px-5 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-xs rounded-xl flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Check Approval Status</span>
            </button>
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-3 bg-purple-50 text-[#7C3AED] font-bold text-xs rounded-xl border border-purple-200"
            >
              Back to Market
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-purple-100 p-5 sm:p-6 shadow-sm space-y-5">
          {isRejected && (
            <div className="bg-red-50 border border-[#DC2626]/30 rounded-xl p-4 text-xs text-[#DC2626] font-bold space-y-1">
              <p className="mb-0">Previous application needs correction:</p>
              <p className="font-semibold text-slate-800 mb-0">{profile?.rejectionReason}</p>
            </div>
          )}

          <div className="bg-green-50 border border-[#16A34A]/25 rounded-xl p-3.5 flex items-center gap-2.5 text-xs font-bold text-[#16A34A]">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span>
              Modern Market Sellers must sell 100% Brand New, Factory-Sealed products with Manufacturer Warranty.
            </span>
          </div>

          {/* 1. Store & Owner Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 border-b border-purple-100 pb-2">
              1. Store &amp; Owner Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Store Name *</label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. Bonny Prime Tech Store"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Owner Full Name *</label>
                <input
                  type="text"
                  required
                  value={ownerFullName}
                  onChange={(e) => setOwnerFullName(e.target.value)}
                  placeholder="Legal full name matching ID & Bank"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08012345678"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Business Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="store@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">State *</label>
                <select
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm text-slate-900"
                >
                  {NIGERIA_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Bonny, Port Harcourt, Ikeja"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm text-slate-900"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Store Address *</label>
              <input
                type="text"
                required
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="Shop number, plaza/building, street address"
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm text-slate-900"
              />
            </div>
          </div>

          {/* 2. Identity Verification */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 border-b border-purple-100 pb-2">
              2. Identity Verification (KYC)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ID Type *</label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value as VendorIdType)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-semibold text-slate-900"
                >
                  <option value="NIN">NIN (National Identity Number)</option>
                  <option value="Driver's License">Driver&apos;s License</option>
                  <option value="Voter's Card">Voter&apos;s Card</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ID Photo Upload *</label>
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
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-dashed border-[#7C3AED]/50 bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-xs font-extrabold flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>{idPhoto ? 'Change ID Photo' : 'Upload Clear ID Photo'}</span>
                </button>
              </div>
            </div>
            {idPhoto && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100">
                <img src={idPhoto} alt="Uploaded ID" className="w-20 h-14 rounded-lg object-cover border border-purple-200" />
                <div className="flex-1 text-xs">
                  <p className="font-bold text-[#16A34A] mb-0">ID Photo Ready ({idType})</p>
                  <p className="text-slate-500 mb-0">Only visible to EFADO Admin for approval verification.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIdPhoto('')}
                  className="p-2 rounded-lg bg-white text-[#DC2626] border border-red-200"
                  aria-label="Remove ID photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* 3. Bank Account & Payout Choice */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 border-b border-purple-100 pb-2">
              3. Settlement Bank &amp; Payout Choice
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPayoutChoice('bank')}
                className={`p-3.5 rounded-xl border-2 text-left flex items-center gap-3 ${
                  payoutChoice === 'bank' ? 'border-[#7C3AED] bg-purple-50' : 'border-purple-100 bg-white'
                }`}
              >
                <Store className="w-5 h-5 text-[#7C3AED] shrink-0" />
                <div>
                  <p className="text-xs font-extrabold text-slate-900 mb-0">Payout Choice: Bank</p>
                  <p className="text-[11px] text-slate-500 mb-0">Direct transfer to your Nigerian bank</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPayoutChoice('wallet')}
                className={`p-3.5 rounded-xl border-2 text-left flex items-center gap-3 ${
                  payoutChoice === 'wallet' ? 'border-[#7C3AED] bg-purple-50' : 'border-purple-100 bg-white'
                }`}
              >
                <Wallet className="w-5 h-5 text-[#7C3AED] shrink-0" />
                <div>
                  <p className="text-xs font-extrabold text-slate-900 mb-0">Payout Choice: EFADO Wallet</p>
                  <p className="text-[11px] text-slate-500 mb-0">Instant credit on buyer confirmation</p>
                </div>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name *</label>
                <select
                  value={bankCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    setBankCode(code);
                    const found = VENDOR_BANKS.find((b) => b.code === code);
                    if (found) setBankName(found.name);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-purple-200 bg-white text-xs font-bold text-slate-900"
                >
                  {VENDOR_BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Number *</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    required={!profile?.accountNumberMasked}
                    maxLength={10}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder={profile?.accountNumberMasked || '10-digit NUBAN'}
                    className="w-full px-3 py-2.5 rounded-xl border border-purple-200 bg-white text-xs font-bold text-slate-900 tabular-nums"
                  />
                  <button
                    type="button"
                    disabled={verifyingBank || accountNumber.length !== 10}
                    onClick={handleVerifyBank}
                    className="px-2.5 py-2 rounded-xl bg-purple-100 text-[#7C3AED] hover:bg-purple-200 disabled:opacity-50 text-[11px] font-extrabold shrink-0"
                  >
                    {verifyingBank ? '...' : 'Verify'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Name *</label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Account holder full name"
                  className="w-full px-3 py-2.5 rounded-xl border border-purple-200 bg-white text-xs font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* 4. Seller Rules & Submit */}
          <label className="flex items-start gap-2.5 p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 cursor-pointer text-xs text-slate-800">
            <input
              type="checkbox"
              checked={rulesAccepted}
              onChange={(e) => setRulesAccepted(e.target.checked)}
              className="w-4 h-4 mt-0.5 accent-[#7C3AED] shrink-0"
            />
            <span>
              <strong>Agree to EFADO Seller Rules:</strong> I confirm I will ONLY list 100% Brand New, factory-sealed products with genuine warranty (zero Fairly Used items), honor fixed prices, ship paid Escrow orders promptly, and maintain accurate stock counts.
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-60 text-white font-black text-sm rounded-xl shadow-md"
          >
            {submitting ? 'Submitting Application...' : 'SUBMIT FOR APPROVAL'}
          </button>
        </form>
      )}
    </div>
  );
};

// ============================================================================
// SELLER & BUYER PROFILE HUB (SELL NEW ITEMS, SOLD ARCHIVE + RELIST, SELLER ORDERS, PAYOUT)
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
  const [section, setSection] = useState<'sell' | 'archive' | 'orders' | 'payout' | 'approvals'>('sell');
  const [sellerOrders, setSellerOrders] = useState<ModernMarketOrder[]>([]);
  const [myProducts, setMyProducts] = useState<ModernProduct[]>([]);
  const [sellerProfile, setSellerProfile] = useState<SellerProfilePrivate | null>(null);
  const [adminVendors, setAdminVendors] = useState<AdminVendorApplication[]>([]);
  const [expandedKycId, setExpandedKycId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Add Product Form State (Brand New Only — up to 5 photos + Full Specs)
  const [prodPhotos, setProdPhotos] = useState<string[]>([STUDIO_PHOTOS[0].url]);
  const [prodName, setProdName] = useState('');
  const [prodBrand, setProdBrand] = useState('');
  const [prodCategory, setProdCategory] = useState<Exclude<ModernMarketCategory, 'All'>>('Phones');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('5');
  const [prodWarranty, setProdWarranty] = useState('12');
  const [prodLocation, setProdLocation] = useState('Lagos, Nigeria');
  const [prodFreeDelivery, setProdFreeDelivery] = useState(true);
  const [prodDeliveryFee, setProdDeliveryFee] = useState('2500');
  const [prodDesc, setProdDesc] = useState('');
  const [specRam, setSpecRam] = useState('');
  const [specStorage, setSpecStorage] = useState('');
  const [specColor, setSpecColor] = useState('');
  const [specBattery, setSpecBattery] = useState('');
  const [specModel, setSpecModel] = useState('');
  const [specColorsAvailable, setSpecColorsAvailable] = useState('');
  const [specSizesAvailable, setSpecSizesAvailable] = useState('');

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Relist stock map
  const [relistStocks, setRelistStocks] = useState<Record<string, string>>({});

  // Payout Config State
  const [payoutPref, setPayoutPref] = useState<'wallet' | 'bank'>('wallet');
  const [storeName, setStoreName] = useState(userName || 'EFADO Merchant');
  const [storeAddress, setStoreAddress] = useState('');
  const [bankName, setBankName] = useState('OPay');
  const [bankCode, setBankCode] = useState('999992');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const loadSellerData = async () => {
    try {
      const [ordRes, prodRes, profRes] = await Promise.all([
        fetchSellerOrders().catch(() => ({ orders: [] })),
        fetchMarketplaceProducts({ sellerMine: true }).catch(() => ({ products: [] })),
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
      setFeedback({ type: 'err', text: 'Maximum 5 photos allowed per product.' });
      return;
    }
    const picked = Array.from(files).slice(0, remainingSlots);
    try {
      const compressedList = await Promise.all(picked.map((f) => compressImageFileToDataUrl(f, 820, 0.72)));
      setProdPhotos((prev) => [...prev, ...compressedList].slice(0, 5));
      setFeedback(null);
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Could not load selected photo.' });
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prodPhotos.length === 0) {
      setFeedback({ type: 'err', text: 'Add at least 1 product photo (up to 5 photos).' });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      await createMarketplaceProduct({
        name: prodName.trim(),
        brand: prodBrand.trim() || 'Genuine',
        category: prodCategory,
        condition: 'BRAND_NEW',
        price: Number(prodPrice),
        stock: Number(prodStock),
        warrantyMonths: Number(prodWarranty),
        location: prodLocation.trim(),
        freeDelivery: prodFreeDelivery,
        deliveryFee: prodFreeDelivery ? 0 : Number(prodDeliveryFee || 0),
        photos: prodPhotos.slice(0, 5),
        description: prodDesc.trim(),
        specs: {
          ram: specRam.trim(),
          storage: specStorage.trim(),
          color: specColor.trim(),
          battery: specBattery.trim(),
          model: specModel.trim(),
          colorsAvailable: specColorsAvailable
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          sizesAvailable: specSizesAvailable
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        }
      });
      setProdName('');
      setProdBrand('');
      setProdPrice('');
      setProdDesc('');
      setSpecRam('');
      setSpecStorage('');
      setSpecColor('');
      setSpecBattery('');
      setSpecModel('');
      setSpecColorsAvailable('');
      setSpecSizesAvailable('');
      setProdPhotos([STUDIO_PHOTOS[0].url]);
      setFeedback({ type: 'ok', text: 'Brand New sealed product published to Modern Day Market!' });
      await loadSellerData();
      onProductChanged();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Could not publish product.' });
    } finally {
      setBusy(false);
    }
  };

  const handleRelist = async (prod: ModernProduct) => {
    const qty = Math.max(1, Number(relistStocks[prod.id] || 5));
    setBusy(true);
    setFeedback(null);
    try {
      const res = await relistMarketplaceProduct(prod.id, qty);
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
      setFeedback({ type: 'ok', text: `Full Escrow refund issued to buyer for ${orderId}.` });
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
  const soldOrArchivedProducts = myProducts.filter((p) => p.status === 'SOLD' || p.status === 'ARCHIVED' || p.stock === 0);
  const pendingAdminCount = adminVendors.filter((v) => v.applicationStatus === 'PENDING_APPROVAL').length;

  return (
    <div className="max-w-[960px] mx-auto px-3 sm:px-6 pt-4 pb-28 space-y-4">
      {/* Top Profile Banner */}
      <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center font-black text-lg">
            {(sellerProfile?.storeName || userName || userEmail || 'E').slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex flex-wrap items-center gap-1.5">
              <span>{sellerProfile?.storeName || userName || 'EFADO Member'}</span>
              {isVerifiedVendor ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 text-[#16A34A] text-[11px] font-extrabold border border-[#16A34A]/20">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Verified Vendor
                </span>
              ) : isPendingVendor ? (
                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-[#7C3AED] text-[11px] font-extrabold">
                  Pending Approval
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold">
                  Unverified
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mb-0">{userEmail}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenVendorRegistration}
            className="px-3.5 py-2 rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-200 text-xs font-extrabold hover:bg-purple-100 flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{isVerifiedVendor ? 'Vendor Status' : 'Vendor Registration'}</span>
          </button>
          <div className="text-right">
            <p className="text-[11px] font-bold text-slate-500 mb-0">EFADO Wallet</p>
            <p className="text-base font-black text-[#16A34A] tabular-nums mb-0">
              {formatNaira(walletBalanceNgn, true)}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenWallet}
            className="px-3.5 py-2 rounded-xl bg-[#7C3AED] text-white text-xs font-bold hover:bg-[#6D28D9]"
          >
            Open Wallet
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className={`grid grid-cols-2 ${sellerProfile?.isAdmin ? 'sm:grid-cols-5' : 'sm:grid-cols-4'} gap-2 bg-white p-1.5 rounded-2xl border border-purple-100 shadow-sm`}>
        {[
          { id: 'sell' as const, label: 'List New Product' },
          { id: 'archive' as const, label: `Sold Archive (${soldOrArchivedProducts.length})` },
          { id: 'orders' as const, label: `Seller Orders (${sellerOrders.length})` },
          { id: 'payout' as const, label: 'Payout Settings' },
          ...(sellerProfile?.isAdmin
            ? [{ id: 'approvals' as const, label: `Vendor Approvals (${pendingAdminCount})` }]
            : [])
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSection(t.id)}
            className={`py-2.5 px-2 rounded-xl text-xs font-extrabold transition-all ${
              section === t.id ? 'bg-[#7C3AED] text-white shadow-sm' : 'text-slate-600 hover:bg-purple-50'
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
        <div className="bg-white rounded-2xl border-2 border-purple-200 p-6 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#7C3AED] flex items-center justify-center mx-auto">
            {isPendingVendor ? <FileCheck2 className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-black text-slate-900">
              {isPendingVendor ? 'Vendor Registration — Pending Approval' : 'Only Verified Vendors Can List Products'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-0">
              {isPendingVendor
                ? 'Your application is awaiting EFADO Admin review. You will be notified as soon as you are approved to list Brand New products.'
                : 'Complete your Vendor Registration with Government ID & Settlement Bank/Wallet details to unlock product publishing.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={onOpenVendorRegistration}
              className="px-6 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-sm rounded-xl shadow-sm"
            >
              {isPendingVendor ? 'View Application Status' : 'Open Vendor Registration'}
            </button>
            <button
              type="button"
              onClick={loadSellerData}
              className="px-4 py-3 bg-purple-50 text-[#7C3AED] font-bold text-xs rounded-xl border border-purple-200"
            >
              Refresh Status
            </button>
          </div>
        </div>
      )}

      {section === 'sell' && isVerifiedVendor && (
        <form onSubmit={handleCreateProduct} className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-0">
              <PlusCircle className="w-5 h-5 text-[#7C3AED]" />
              <span>List New Brand New Product</span>
            </h3>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-[#16A34A]/30 text-[#16A34A] text-xs font-black">
              <Lock className="w-3.5 h-3.5" />
              <span>Condition: BRAND NEW - SEALED (Locked)</span>
            </div>
          </div>

          {/* Photos up to 5 (Camera + Gallery) */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-extrabold text-slate-800">
                Product Photos ({prodPhotos.length}/5) — Camera or Gallery *
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
                  className="px-3 py-1.5 rounded-xl bg-purple-50 border border-[#7C3AED]/40 text-[#7C3AED] text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Camera</span>
                </button>
                <button
                  type="button"
                  disabled={prodPhotos.length >= 5}
                  onClick={() => galleryInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-[#7C3AED] text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                  <span>Gallery</span>
                </button>
              </div>
            </div>

            {/* Thumbnail Preview Grid */}
            <div className="flex flex-wrap gap-2.5">
              {prodPhotos.map((src, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl border border-purple-200 overflow-hidden bg-slate-50">
                  <img src={src} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setProdPhotos((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 p-1 rounded-full bg-[#DC2626] text-white shadow"
                    aria-label="Remove photo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Studio Presets */}
            {prodPhotos.length < 5 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                <span className="text-[11px] font-bold text-slate-500 shrink-0">Quick Sample:</span>
                {STUDIO_PHOTOS.map((sp) => (
                  <button
                    key={sp.url}
                    type="button"
                    onClick={() =>
                      setProdPhotos((prev) => (prev.includes(sp.url) ? prev : [...prev, sp.url].slice(0, 5)))
                    }
                    className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-[11px] font-bold whitespace-nowrap border border-purple-100"
                  >
                    + {sp.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                placeholder="e.g. Samsung Galaxy S25 Ultra - 512GB"
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Price NGN (Fixed) *</label>
              <input
                type="number"
                required
                min={100}
                value={prodPrice}
                onChange={(e) => setProdPrice(e.target.value)}
                placeholder="e.g. 1232500"
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-bold text-slate-900 tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
              <select
                value={prodCategory}
                onChange={(e) => setProdCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm text-slate-900"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Brand</label>
              <input
                type="text"
                value={prodBrand}
                onChange={(e) => setProdBrand(e.target.value)}
                placeholder="e.g. Apple, Samsung, Sony"
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Stock *</label>
              <input
                type="number"
                required
                min={1}
                value={prodStock}
                onChange={(e) => setProdStock(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Warranty Months *</label>
              <input
                type="number"
                required
                min={1}
                value={prodWarranty}
                onChange={(e) => setProdWarranty(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-bold text-slate-900"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Location *</label>
              <input
                type="text"
                required
                value={prodLocation}
                onChange={(e) => setProdLocation(e.target.value)}
                placeholder="e.g. Bonny, Rivers State"
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description *</label>
            <textarea
              rows={2}
              required
              value={prodDesc}
              onChange={(e) => setProdDesc(e.target.value)}
              placeholder="Describe factory seal, included accessories, and official warranty coverage..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm text-slate-900"
            />
          </div>

          {/* Product Specifications */}
          <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-100 space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-0">
              Product Specifications
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">RAM</label>
                <input
                  type="text"
                  value={specRam}
                  onChange={(e) => setSpecRam(e.target.value)}
                  placeholder="e.g. 12GB"
                  className="w-full px-3 py-2 rounded-lg border border-purple-200 bg-white text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Storage</label>
                <input
                  type="text"
                  value={specStorage}
                  onChange={(e) => setSpecStorage(e.target.value)}
                  placeholder="e.g. 512GB NVMe"
                  className="w-full px-3 py-2 rounded-lg border border-purple-200 bg-white text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Color</label>
                <input
                  type="text"
                  value={specColor}
                  onChange={(e) => setSpecColor(e.target.value)}
                  placeholder="e.g. Titanium Black"
                  className="w-full px-3 py-2 rounded-lg border border-purple-200 bg-white text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Battery</label>
                <input
                  type="text"
                  value={specBattery}
                  onChange={(e) => setSpecBattery(e.target.value)}
                  placeholder="e.g. 5,000 mAh"
                  className="w-full px-3 py-2 rounded-lg border border-purple-200 bg-white text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Model</label>
                <input
                  type="text"
                  value={specModel}
                  onChange={(e) => setSpecModel(e.target.value)}
                  placeholder="e.g. SM-S938B"
                  className="w-full px-3 py-2 rounded-lg border border-purple-200 bg-white text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Colors Available (comma)</label>
                <input
                  type="text"
                  value={specColorsAvailable}
                  onChange={(e) => setSpecColorsAvailable(e.target.value)}
                  placeholder="Black, Silver, Blue"
                  className="w-full px-3 py-2 rounded-lg border border-purple-200 bg-white text-xs text-slate-900"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Sizes / Variants Available (comma)</label>
                <input
                  type="text"
                  value={specSizesAvailable}
                  onChange={(e) => setSpecSizesAvailable(e.target.value)}
                  placeholder="e.g. 256GB, 512GB, 1TB (or 42, 43, 44)"
                  className="w-full px-3 py-2 rounded-lg border border-purple-200 bg-white text-xs text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={prodFreeDelivery}
                onChange={(e) => setProdFreeDelivery(e.target.checked)}
                className="w-4 h-4 accent-[#7C3AED]"
              />
              <span>Free Delivery</span>
            </label>
            {!prodFreeDelivery && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700">Delivery Fee (₦):</label>
                <input
                  type="number"
                  min={0}
                  value={prodDeliveryFee}
                  onChange={(e) => setProdDeliveryFee(e.target.value)}
                  placeholder="2500"
                  className="w-28 px-3 py-1.5 rounded-lg border border-purple-200 text-xs font-bold text-slate-900 tabular-nums"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full sm:w-auto px-6 py-3.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-sm rounded-xl shadow-sm"
          >
            {busy ? 'Publishing...' : 'Publish Brand New Product'}
          </button>
        </form>
      )}

      {section === 'archive' && (
        <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm space-y-3">
          <h3 className="text-base font-extrabold text-slate-900">Sold Items Archive &amp; 1-Click Relist</h3>
          <p className="text-xs text-slate-500">
            Sold items move here after 24 hours. Enter new stock and click Relist to go live and notify everyone on the waitlist.
          </p>
          {soldOrArchivedProducts.length === 0 ? (
            <p className="text-xs font-bold text-slate-400 py-6 text-center">No sold or archived products right now.</p>
          ) : (
            soldOrArchivedProducts.map((p) => (
              <div
                key={p.id}
                className="border border-purple-100 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <img src={p.photos[0]} alt={p.name} className="w-14 h-14 rounded-lg object-cover grayscale" />
                  <div>
                    <p className="text-sm font-bold text-slate-900 mb-0">{p.name}</p>
                    <p className="text-xs text-slate-500 mb-0">
                      <span className="text-[#DC2626] font-extrabold">{p.status}</span> •{' '}
                      <strong className="text-[#7C3AED]">{p.waitlistCount || 0} buyer(s) waiting</strong>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="number"
                    min={1}
                    value={relistStocks[p.id] ?? '5'}
                    onChange={(e) => setRelistStocks({ ...relistStocks, [p.id]: e.target.value })}
                    className="w-20 px-2.5 py-2 rounded-lg border border-purple-200 text-xs font-bold text-slate-900 text-center"
                    aria-label="Restock count"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleRelist(p)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-[#16A34A] hover:bg-green-700 text-white text-xs font-extrabold rounded-lg"
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
          {sellerOrders.some((o) => o.status === 'PAID_ESCROW_HELD') && (
            <div className="bg-purple-50 border border-[#7C3AED]/30 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs font-bold text-[#7C3AED]">
              <Bell className="w-4 h-4 shrink-0" />
              <span>New Order Alert: You have paid orders ready to pack and ship.</span>
            </div>
          )}
          {sellerOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-purple-100 p-8 text-center text-xs text-slate-500">
              No incoming customer orders yet.
            </div>
          ) : (
            sellerOrders.map((ord) => (
              <div key={ord.orderId} className="bg-white rounded-2xl border border-purple-100 p-4 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-[#7C3AED] tabular-nums">{ord.orderId}</span>
                    {ord.status === 'PAID_ESCROW_HELD' && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-[#7C3AED] text-[10px] font-black">
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
                          : 'bg-purple-50 text-[#7C3AED]'
                    }`}
                  >
                    {ord.escrowStatus}
                  </span>
                </div>
                <div className="flex gap-3 items-start">
                  <img
                    src={ord.productPhoto}
                    alt={ord.productName}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0 text-xs text-slate-700 space-y-1">
                    <p className="font-bold text-slate-900 mb-0">
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
                      Pickup Code: <strong className="text-[#7C3AED] tabular-nums">{ord.pickupCode || 'Pending'}</strong> • Status:{' '}
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
                        className="px-3.5 py-2 bg-[#7C3AED] text-white text-xs font-bold rounded-xl"
                      >
                        Mark As Shipped
                      </button>
                    )}
                    {['PAID_ESCROW_HELD', 'SHIPPED'].includes(ord.status) && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleUpdateOrderStage(ord.orderId, 'OUT_FOR_DELIVERY')}
                        className="px-3.5 py-2 bg-purple-100 text-[#7C3AED] text-xs font-bold rounded-xl"
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
                  <div className="bg-red-50 border border-[#DC2626]/30 rounded-xl p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#DC2626]">
                        Dispute: {ord.disputeReason}
                      </span>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleApproveRefund(ord.orderId)}
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

      {section === 'payout' && (
        <form onSubmit={handleSavePayout} className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-slate-900">Store &amp; Escrow Payout Destination</h3>
          <p className="text-xs text-slate-500">
            Choose where EFADO Escrow sends your money once buyers confirm delivery. Bank account numbers are encrypted and never shown to buyers.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Store Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Store Pickup Address</label>
              <input
                type="text"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="Shop / Plaza address for local store pickup"
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-sm text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPayoutPref('wallet')}
              className={`p-3.5 rounded-xl border-2 text-left flex items-center gap-3 ${
                payoutPref === 'wallet' ? 'border-[#7C3AED] bg-purple-50' : 'border-purple-100'
              }`}
            >
              <Wallet className="w-5 h-5 text-[#7C3AED]" />
              <div>
                <p className="text-xs font-extrabold text-slate-900 mb-0">EFADO Wallet (Instant)</p>
                <p className="text-[11px] text-slate-500 mb-0">Zero transfer delay</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setPayoutPref('bank')}
              className={`p-3.5 rounded-xl border-2 text-left flex items-center gap-3 ${
                payoutPref === 'bank' ? 'border-[#7C3AED] bg-purple-50' : 'border-purple-100'
              }`}
            >
              <Store className="w-5 h-5 text-[#7C3AED]" />
              <div>
                <p className="text-xs font-extrabold text-slate-900 mb-0">Nigerian Bank Account</p>
                <p className="text-[11px] text-slate-500 mb-0">
                  {sellerProfile?.accountNumberMasked ? `Saved: ${sellerProfile.accountNumberMasked}` : 'Direct NUBAN transfer'}
                </p>
              </div>
            </button>
          </div>

          {payoutPref === 'bank' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-purple-50 p-4 rounded-xl border border-purple-100">
              <select
                value={bankCode}
                onChange={(e) => {
                  const code = e.target.value;
                  setBankCode(code);
                  const found = VENDOR_BANKS.find((b) => b.code === code);
                  if (found) setBankName(found.name);
                }}
                className="px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-bold text-slate-900"
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
                className="px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-bold text-slate-900"
              />
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Verified Account Holder Name"
                className="px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-bold text-slate-900"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="px-6 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-sm rounded-xl shadow-sm"
          >
            {busy ? 'Saving...' : 'Save Payout Settings'}
          </button>
        </form>
      )}

      {section === 'approvals' && sellerProfile?.isAdmin && (
        <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900">Vendor Approvals (Admin)</h3>
            <button
              type="button"
              onClick={loadSellerData}
              className="px-3 py-1.5 rounded-lg bg-purple-50 text-[#7C3AED] text-xs font-bold"
            >
              Refresh List
            </button>
          </div>
          {adminVendors.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No vendor applications submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {adminVendors.map((v) => {
                const vApproved = v.applicationStatus === 'APPROVED' || v.verified;
                const vPending = v.applicationStatus === 'PENDING_APPROVAL';
                return (
                  <div key={v.sellerId} className="border border-purple-100 rounded-xl p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 mb-0">{v.storeName}</h4>
                        <p className="text-xs text-slate-600 mb-0">
                          {v.ownerFullName} • {v.phone} • {v.email}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-extrabold ${
                          vApproved
                            ? 'bg-green-50 text-[#16A34A]'
                            : vPending
                              ? 'bg-purple-100 text-[#7C3AED]'
                              : 'bg-red-50 text-[#DC2626]'
                        }`}
                      >
                        {v.applicationStatus || (vApproved ? 'APPROVED' : 'PENDING')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      <p className="mb-0">
                        <strong>Location:</strong> {v.location} — {v.storeAddress}
                      </p>
                      <p className="mb-0">
                        <strong>Bank / Payout:</strong> {v.payoutPreference.toUpperCase()} ({v.bankName} {v.accountNumberMasked} • {v.accountName})
                      </p>
                      <p className="mb-0">
                        <strong>KYC ID:</strong> {v.idType || 'ID'}
                      </p>
                    </div>

                    {v.idPhotoPreview && (
                      <div>
                        <button
                          type="button"
                          onClick={() => setExpandedKycId(expandedKycId === v.sellerId ? null : v.sellerId)}
                          className="text-xs font-bold text-[#7C3AED] underline"
                        >
                          {expandedKycId === v.sellerId ? 'Hide ID Photo' : 'View Uploaded ID Photo'}
                        </button>
                        {expandedKycId === v.sellerId && (
                          <img
                            src={v.idPhotoPreview}
                            alt="Vendor KYC"
                            className="mt-2 max-h-56 rounded-xl border border-purple-200 object-contain"
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
                          className="px-4 py-2 bg-[#16A34A] hover:bg-green-700 text-white text-xs font-extrabold rounded-xl"
                        >
                          Approve Vendor
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
