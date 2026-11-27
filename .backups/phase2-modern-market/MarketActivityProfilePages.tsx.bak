import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Bell,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Package,
  PlusCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Store,
  Truck,
  UserCheck,
  Wallet
} from 'lucide-react';
import {
  createMarketplaceProduct,
  fetchChatMessages,
  fetchMarketAlerts,
  fetchMarketplaceProducts,
  fetchMyChatThreads,
  fetchMyOrders,
  fetchSellerOrders,
  fetchSellerProfile,
  formatNaira,
  refundDisputedOrder,
  relistMarketplaceProduct,
  saveSellerProfile,
  sendChatMessage,
  submitProductReview,
  updateSellerOrderShipping
} from './marketApi';
import type {
  ModernMarketAlert,
  ModernMarketCategory,
  ModernMarketChatMessage,
  ModernMarketChatThread,
  ModernMarketOrder,
  ModernProduct,
  SellerProfilePrivate
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
  const [tab, setTab] = useState<'orders' | 'alerts' | 'chats'>('orders');
  const [orders, setOrders] = useState<ModernMarketOrder[]>([]);
  const [alerts, setAlerts] = useState<ModernMarketAlert[]>([]);
  const [threads, setThreads] = useState<ModernMarketChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewOrder, setReviewOrder] = useState<ModernMarketOrder | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ordRes, altRes, chatRes] = await Promise.all([
        fetchMyOrders().catch(() => ({ orders: [] })),
        fetchMarketAlerts().catch(() => ({ alerts: [] })),
        fetchMyChatThreads().catch(() => ({ threads: [] }))
      ]);
      setOrders(ordRes.orders || []);
      setAlerts(altRes.alerts || []);
      setThreads(chatRes.threads || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

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

  return (
    <div className="max-w-[960px] mx-auto px-3 sm:px-6 pt-4 pb-28 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Market Activity</h2>
          <p className="text-xs text-slate-500">Orders, live escrow tracking, waitlist alerts, and seller chats</p>
        </div>
        <button
          type="button"
          onClick={loadAll}
          className="px-3 py-2 rounded-xl bg-white border border-purple-200 text-[#7C3AED] text-xs font-bold flex items-center gap-1.5 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-2 bg-white p-1.5 rounded-2xl border border-purple-100 shadow-sm">
        {[
          { id: 'orders' as const, label: `Orders (${orders.length})` },
          { id: 'alerts' as const, label: `Alerts (${alerts.length})` },
          { id: 'chats' as const, label: `Chats (${threads.length})` }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`py-2.5 rounded-xl text-xs font-extrabold transition-all ${
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
              Every Brand New item you purchase is protected by EFADO Escrow until you confirm delivery.
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
                  <div className="flex items-center gap-2">
                    {ord.pickupCode && (
                      <span className="px-2.5 py-0.5 rounded-md bg-purple-50 text-[#7C3AED] text-xs font-extrabold tabular-nums">
                        Code: {ord.pickupCode}
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                        ord.status === 'COMPLETED'
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
                    <h4 className="text-sm font-bold text-slate-900 truncate">{ord.productName}</h4>
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
                    {ord.escrowStatus === 'HELD' ? 'Track / Confirm Delivery' : 'View Order Receipt'}
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
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#7C3AED]">{al.title}</span>
                  <span className="text-[11px] text-slate-400">{new Date(al.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-700 mb-0">{al.message}</p>
              </div>
            ))}
          </div>
        )
      ) : threads.length === 0 ? (
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
// SELLER & BUYER PROFILE HUB (SELL NEW ITEMS, SOLD ARCHIVE + RELIST, SELLER ORDERS, PAYOUT)
// ============================================================================
interface ProfileSellerHubPageProps {
  userEmail: string;
  userName: string;
  walletBalanceNgn: number;
  onProductChanged: () => void;
  onOpenWallet: () => void;
}

export const ProfileSellerHubPage: React.FC<ProfileSellerHubPageProps> = ({
  userEmail,
  userName,
  walletBalanceNgn,
  onProductChanged,
  onOpenWallet
}) => {
  const [section, setSection] = useState<'sell' | 'archive' | 'orders' | 'payout'>('sell');
  const [sellerOrders, setSellerOrders] = useState<ModernMarketOrder[]>([]);
  const [myProducts, setMyProducts] = useState<ModernProduct[]>([]);
  const [sellerProfile, setSellerProfile] = useState<SellerProfilePrivate | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Add Product Form State (Brand New Only)
  const [prodName, setProdName] = useState('');
  const [prodBrand, setProdBrand] = useState('');
  const [prodCategory, setProdCategory] = useState<Exclude<ModernMarketCategory, 'All'>>('Phones');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('5');
  const [prodWarranty, setProdWarranty] = useState('12');
  const [prodLocation, setProdLocation] = useState('Lagos, Nigeria');
  const [prodFreeDelivery, setProdFreeDelivery] = useState(true);
  const [prodDeliveryFee, setProdDeliveryFee] = useState('2500');
  const [prodPhoto, setProdPhoto] = useState(STUDIO_PHOTOS[0].url);
  const [prodDesc, setProdDesc] = useState('');

  // Relist stock map
  const [relistStocks, setRelistStocks] = useState<Record<string, string>>({});

  // Payout Config State
  const [payoutPref, setPayoutPref] = useState<'wallet' | 'bank'>('wallet');
  const [storeName, setStoreName] = useState(userName || 'EFADO Merchant');
  const [storeAddress, setStoreAddress] = useState('');
  const [bankName, setBankName] = useState('GTBank');
  const [bankCode, setBankCode] = useState('058');
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
        setSellerProfile(profRes.profile);
        setPayoutPref(profRes.profile.payoutPreference);
        setStoreName(profRes.profile.storeName || userName);
        setStoreAddress(profRes.profile.storeAddress || '');
        if (profRes.profile.bankName) setBankName(profRes.profile.bankName);
        if (profRes.profile.bankCode) setBankCode(profRes.profile.bankCode);
        if (profRes.profile.accountName) setAccountName(profRes.profile.accountName);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadSellerData();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      await createMarketplaceProduct({
        name: prodName.trim(),
        brand: prodBrand.trim() || 'Genuine',
        category: prodCategory,
        price: Number(prodPrice),
        stock: Number(prodStock),
        warrantyMonths: Number(prodWarranty),
        location: prodLocation.trim(),
        freeDelivery: prodFreeDelivery,
        deliveryFee: prodFreeDelivery ? 0 : Number(prodDeliveryFee || 0),
        photos: [prodPhoto],
        description: prodDesc.trim()
      });
      setProdName('');
      setProdBrand('');
      setProdPrice('');
      setProdDesc('');
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

  const soldOrArchivedProducts = myProducts.filter((p) => p.status === 'SOLD' || p.status === 'ARCHIVED' || p.stock === 0);

  return (
    <div className="max-w-[960px] mx-auto px-3 sm:px-6 pt-4 pb-28 space-y-4">
      {/* Top Profile Banner */}
      <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center font-black text-lg">
            {(userName || userEmail || 'E').slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-1.5">
              <span>{sellerProfile?.storeName || userName || 'EFADO Member'}</span>
              <BadgeCheck className="w-4 h-4 text-[#16A34A]" />
            </h2>
            <p className="text-xs text-slate-500 mb-0">{userEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[11px] font-bold text-slate-500 mb-0">EFADO Wallet</p>
            <p className="text-base font-black text-[#16A34A] tabular-nums mb-0">
              {formatNaira(walletBalanceNgn, true)}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenWallet}
            className="px-3.5 py-2 rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-200 text-xs font-bold hover:bg-purple-100"
          >
            Open Wallet
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-1.5 rounded-2xl border border-purple-100 shadow-sm">
        {[
          { id: 'sell' as const, label: 'Sell Brand New' },
          { id: 'archive' as const, label: `Sold Archive (${soldOrArchivedProducts.length})` },
          { id: 'orders' as const, label: `Seller Orders (${sellerOrders.length})` },
          { id: 'payout' as const, label: 'Payout Settings' }
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

      {section === 'sell' && (
        <form onSubmit={handleCreateProduct} className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#7C3AED]" />
              <span>List a Brand New, Sealed Product</span>
            </h3>
            <span className="px-2.5 py-1 rounded-md bg-green-50 text-[#16A34A] text-xs font-bold">
              Brand New + Warranty Only
            </span>
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Fixed Price (NGN ₦) *</label>
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Stock Quantity *</label>
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Warranty (Months)</label>
              <input
                type="number"
                min={1}
                value={prodWarranty}
                onChange={(e) => setProdWarranty(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City / Location</label>
              <input
                type="text"
                value={prodLocation}
                onChange={(e) => setProdLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Product Studio Image</label>
              <select
                value={prodPhoto}
                onChange={(e) => setProdPhoto(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm text-slate-900"
              >
                {STUDIO_PHOTOS.map((sp) => (
                  <option key={sp.url} value={sp.url}>
                    {sp.label}
                  </option>
                ))}
              </select>
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
              <span>Offer Free Delivery</span>
            </label>
            {!prodFreeDelivery && (
              <input
                type="number"
                min={0}
                value={prodDeliveryFee}
                onChange={(e) => setProdDeliveryFee(e.target.value)}
                placeholder="Delivery fee (₦)"
                className="px-3 py-1.5 rounded-lg border border-purple-200 text-xs font-bold text-slate-900"
              />
            )}
          </div>

          <textarea
            rows={2}
            value={prodDesc}
            onChange={(e) => setProdDesc(e.target.value)}
            placeholder="Describe factory seal, included accessories, and warranty coverage..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm text-slate-900"
          />

          <button
            type="submit"
            disabled={busy}
            className="w-full sm:w-auto px-6 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-sm rounded-xl shadow-sm"
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
          {sellerOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-purple-100 p-8 text-center text-xs text-slate-500">
              No incoming customer orders yet.
            </div>
          ) : (
            sellerOrders.map((ord) => (
              <div key={ord.orderId} className="bg-white rounded-2xl border border-purple-100 p-4 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#7C3AED]">{ord.orderId}</span>
                  <span className="text-xs font-bold text-slate-700">
                    {ord.status.replace(/_/g, ' ')} • Escrow: {ord.escrowStatus}
                  </span>
                </div>
                <div className="text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-slate-900 mb-0">
                    {ord.productName} (Qty {ord.quantity}) — {formatNaira(ord.subtotal + ord.deliveryFee, true)}
                  </p>
                  <p className="mb-0">
                    Recipient: {ord.recipientName} ({ord.recipientPhone}) • Pickup Code: <strong>{ord.pickupCode || 'Pending'}</strong>
                  </p>
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
                        Mark Shipped
                      </button>
                    )}
                    {['PAID_ESCROW_HELD', 'SHIPPED'].includes(ord.status) && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleUpdateOrderStage(ord.orderId, 'OUT_FOR_DELIVERY')}
                        className="px-3.5 py-2 bg-purple-100 text-[#7C3AED] text-xs font-bold rounded-xl"
                      >
                        Out For Delivery
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleUpdateOrderStage(ord.orderId, 'DELIVERED')}
                      className="px-3.5 py-2 bg-[#16A34A] text-white text-xs font-bold rounded-xl"
                    >
                      Mark Delivered
                    </button>
                  </div>
                )}
                {ord.status === 'DISPUTED' && (
                  <div className="bg-red-50 border border-[#DC2626]/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
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
                  const names: Record<string, string> = {
                    '058': 'GTBank',
                    '044': 'Access Bank',
                    '057': 'Zenith Bank',
                    '033': 'UBA',
                    '011': 'First Bank',
                    '999992': 'OPay',
                    '50211': 'Kuda Bank'
                  };
                  setBankName(names[code] || 'Bank');
                }}
                className="px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-bold text-slate-900"
              >
                <option value="058">GTBank (058)</option>
                <option value="044">Access Bank (044)</option>
                <option value="057">Zenith Bank (057)</option>
                <option value="033">UBA (033)</option>
                <option value="011">First Bank (011)</option>
                <option value="999992">OPay (999992)</option>
                <option value="50211">Kuda Bank (50211)</option>
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
    </div>
  );
};
