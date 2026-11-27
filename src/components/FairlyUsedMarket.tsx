import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Bell,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Film,
  Handshake,
  Home,
  LayoutGrid,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  Plus,
  RotateCcw,
  Search,
  Share2,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  Store,
  ThumbsUp,
  Truck,
  User as UserIcon,
  UserPlus,
  Video,
  Wallet,
  X,
  ZoomIn
} from 'lucide-react';
import type { UserProfile } from '../types';
import type {
  ConditionGrade,
  FairlyUsedCartItem,
  FairlyUsedCategory,
  FairlyUsedChatThread,
  FairlyUsedFilterState,
  FairlyUsedOrder,
  FairlyUsedProduct,
  FairlyUsedProductReview,
  FairlyUsedReel,
  FairlyUsedSellerPublicInfo,
  PaymentGatewayId,
  PaymentMethodId
} from '../types/fairlyUsedMarket';
import {
  fetchFairlyUsedProductDetail,
  fetchFairlyUsedProducts,
  fetchPinAndWalletStatus,
  formatNaira,
  likeProductVideo,
  sendSellerPresenceHeartbeat,
  submitOffer,
  subscribeNotifyMe,
  validateCartStock,
  verifyFairlyUsedPayment
} from './fairly-used/fairlyUsedApi';
import {
  AuthorizePage,
  CartPage,
  DeliveryPage,
  PaymentPage,
  SuccessPage
} from './fairly-used/FairlyUsedCheckoutPages';
import {
  ActivityPage,
  ProfileSellerHubPage,
  SellerChatPage,
  VendorRegistrationPage
} from './fairly-used/FairlyUsedActivityProfilePages';
import { FairlyUsedReelsView } from './fairly-used/FairlyUsedReelsView';

export interface FairlyUsedMarketProps {
  user: UserProfile;
  onClose: () => void;
  onOpenMining?: () => void;
  onNavigate?: (hub: any, subview?: any, extraProps?: any) => void;
  initialItemId?: string;
}

type PageStep =
  | 'HOME'
  | 'FILTER'
  | 'REELS'
  | 'PRODUCT_DETAIL'
  | 'CART'
  | 'DELIVERY'
  | 'PAYMENT'
  | 'AUTHORIZE'
  | 'SUCCESS'
  | 'CHAT'
  | 'ACTIVITY'
  | 'PROFILE'
  | 'VENDOR_REGISTRATION';

const CATEGORY_LIST: FairlyUsedCategory[] = [
  'All',
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

const GRADE_LABELS: Record<ConditionGrade, string> = {
  A: 'A - Like New',
  B: 'B - Neatly Used',
  C: 'C - Used With Small Scratch',
  D: 'D - Needs Repair'
};

const CART_STORAGE_KEY = 'efado_fairly_used_cart_v2';

export const FairlyUsedMarket: React.FC<FairlyUsedMarketProps> = ({
  user,
  onClose,
  onNavigate,
  initialItemId
}) => {
  const [step, setStep] = useState<PageStep>('HOME');
  const [products, setProducts] = useState<FairlyUsedProduct[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FairlyUsedFilterState>({
    category: 'All',
    search: '',
    brand: 'all',
    location: 'all',
    conditionGrade: 'all',
    relocationOnly: false,
    negotiableOnly: false,
    inStoreVerifiedOnly: false,
    freeDeliveryOnly: false,
    priceMin: '',
    priceMax: '',
    sort: 'newest'
  });
  const [draftFilters, setDraftFilters] = useState<FairlyUsedFilterState>(filters);

  // Step 2: Product Detail State
  const [selectedProduct, setSelectedProduct] = useState<FairlyUsedProduct | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<FairlyUsedSellerPublicInfo | null>(null);
  const [productReviews, setProductReviews] = useState<FairlyUsedProductReview[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [zoomLightboxOpen, setZoomLightboxOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<'photos' | 'video'>('photos');
  const [likingVideo, setLikingVideo] = useState(false);
  const [detailQty, setDetailQty] = useState(1);

  // Quick Make Offer Modal
  const [offerModalProduct, setOfferModalProduct] = useState<FairlyUsedProduct | null>(null);
  const [offerModalAmount, setOfferModalAmount] = useState('');
  const [offerModalBusy, setOfferModalBusy] = useState(false);

  // Cart & Checkout State (Steps 3 - 7)
  const [cart, setCart] = useState<FairlyUsedCartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [cartError, setCartError] = useState<string | null>(null);
  const [checkingCartStock, setCheckingCartStock] = useState(false);
  const [activeOrder, setActiveOrder] = useState<FairlyUsedOrder | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('card');
  const [paymentGateway, setPaymentGateway] = useState<PaymentGatewayId>('paystack');

  // Security & Wallet Status
  const [walletBalanceNgn, setWalletBalanceNgn] = useState<number>(Number(user?.depositWallet || 0));
  const [hasPin, setHasPin] = useState<boolean>(true);
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(false);

  // EFADO Chat Target
  const [chatTarget, setChatTarget] = useState<{
    productId: string;
    productName: string;
    productPhoto: string;
    sellerId: string;
    sellerName: string;
    sellerEfadoId?: string;
    buyerId?: string;
    initialOfferAmount?: string;
  } | null>(null);

  // Toast & Return Verification
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [verifyingReturn, setVerifyingReturn] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg((prev) => (prev === msg ? null : prev)), 3600);
  };

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage quota
    }
  }, [cart]);

  const refreshWalletAndSecurity = useCallback(async () => {
    try {
      const st = await fetchPinAndWalletStatus();
      setWalletBalanceNgn(st.ngnBalance);
      setHasPin(st.hasPin);
      setBiometricEnabled(st.biometricEnabled);
    } catch {
      setWalletBalanceNgn(Number(user?.depositWallet || 0));
    }
  }, [user?.depositWallet]);

  const loadCatalog = useCallback(
    async (activeFilters: FairlyUsedFilterState = filters) => {
      setLoadingCatalog(true);
      setCatalogError(null);
      try {
        const res = await fetchFairlyUsedProducts(activeFilters);
        setProducts(res.products || []);
      } catch (err: any) {
        setCatalogError(err?.message || 'Could not load Fairly Used Market products.');
      } finally {
        setLoadingCatalog(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    loadCatalog(filters);
  }, [filters, loadCatalog]);

  useEffect(() => {
    refreshWalletAndSecurity();
  }, [refreshWalletAndSecurity]);

  // Seller / User Online Presence Heartbeat (Green Dot: Online Now - Chat Now)
  useEffect(() => {
    if (!user?.uid) return;
    sendSellerPresenceHeartbeat().catch(() => {});
    const id = window.setInterval(() => {
      sendSellerPresenceHeartbeat().catch(() => {});
    }, 90_000);
    return () => window.clearInterval(id);
  }, [user?.uid]);

  const syncCartWithLiveStock = useCallback(async (itemsSnapshot: FairlyUsedCartItem[]): Promise<boolean> => {
    if (itemsSnapshot.length === 0) {
      setCartError(null);
      return true;
    }
    setCheckingCartStock(true);
    try {
      const res = await validateCartStock(
        itemsSnapshot.map((i) => ({ productId: i.product.id, quantity: i.quantity }))
      );
      const map = new Map(res.items.map((r) => [r.productId, r]));
      setCart((prev) =>
        prev.map((item) => {
          const check = map.get(item.product.id);
          if (!check) return item;
          if (!check.exists || !check.product) {
            return { ...item, product: { ...item.product, stock: 0, status: 'SOLD' } };
          }
          return {
            ...item,
            product: check.product,
            agreedPriceNgn: check.agreedPriceNgn ?? item.agreedPriceNgn,
            agreedPriceKobo: check.agreedPriceKobo ?? item.agreedPriceKobo
          };
        })
      );
      if (!res.allAvailable) {
        setCartError(res.blockedMessage || 'Sorry, this item just sold out');
        return false;
      }
      setCartError(null);
      return true;
    } catch {
      return true;
    } finally {
      setCheckingCartStock(false);
    }
  }, []);

  useEffect(() => {
    if (step === 'CART' && cart.length > 0) {
      syncCartWithLiveStock(cart);
    }
  }, [step]);

  useEffect(() => {
    if (initialItemId) {
      openProductDetail(initialItemId);
    }
  }, [initialItemId]);

  // Gateway Return Verification -> Step 7 SUCCESS
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fuOrder = params.get('fairly_used_order');
    const ref = params.get('reference') || params.get('trxref') || params.get('tx_ref');
    const gw = params.get('gateway') || 'paystack';
    const txId = params.get('transaction_id') || undefined;

    if (!fuOrder && !ref) return;
    if (ref && !ref.startsWith('FU-') && !fuOrder) return;

    let active = true;
    (async () => {
      setVerifyingReturn(true);
      setReturnError(null);
      try {
        const res = await verifyFairlyUsedPayment({
          reference: ref || undefined,
          orderId: fuOrder || undefined,
          gateway: gw,
          transactionId: txId
        });
        if (!active) return;
        setActiveOrder(res.order);
        setCart([]);
        setStep('SUCCESS');
        sessionStorage.removeItem('efado_pending_fu_order');
        if (res.soldOutRefunded) {
          showToast('Item sold out concurrently — full refund sent to your EFADO Wallet.');
        }
        window.history.replaceState({}, '', window.location.pathname);
        refreshWalletAndSecurity();
        loadCatalog();
      } catch (err: any) {
        if (!active) return;
        setReturnError(err?.message || 'Payment verification failed. Your money was NOT taken.');
      } finally {
        if (active) setVerifyingReturn(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const syncSingleProductIntoState = (updated: FairlyUsedProduct) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    if (selectedProduct?.id === updated.id) {
      setSelectedProduct(updated);
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === updated.id
          ? {
              ...item,
              product: updated,
              agreedPriceNgn: updated.activeNegotiation?.agreedPriceNgn ?? item.agreedPriceNgn,
              agreedPriceKobo: updated.activeNegotiation?.agreedPriceKobo ?? item.agreedPriceKobo
            }
          : item
      )
    );
  };

  const openProductDetail = async (productId: string, previewObj?: FairlyUsedProduct) => {
    setDetailTab('photos');
    if (previewObj) {
      setSelectedProduct(previewObj);
      setActivePhotoIdx(0);
      setDetailQty(1);
      setStep('PRODUCT_DETAIL');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setDetailLoading(true);
    try {
      const res = await fetchFairlyUsedProductDetail(productId);
      setSelectedProduct(res.product);
      setSelectedSeller(res.seller);
      setProductReviews(res.reviews || []);
      setActivePhotoIdx(0);
      setDetailQty(1);
      setStep('PRODUCT_DETAIL');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      showToast(err?.message || 'Could not open item details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleLikeVideo = async (prod: FairlyUsedProduct, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLikingVideo(true);
    try {
      const res = await likeProductVideo(prod.id);
      syncSingleProductIntoState(res.product);
      showToast(res.message);
    } catch (err: any) {
      showToast(err?.message || 'Sign in to like and confirm this working video.');
    } finally {
      setLikingVideo(false);
    }
  };

  const handleNotifyMe = async (productId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await subscribeNotifyMe(productId);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, isOnWaitlist: true, waitlistCount: res.waitlistCount } : p
        )
      );
      if (selectedProduct?.id === productId) {
        setSelectedProduct({ ...selectedProduct, isOnWaitlist: true, waitlistCount: res.waitlistCount });
      }
      showToast(res.message);
    } catch (err: any) {
      showToast(err?.message || 'Sign in to join alerts.');
    }
  };

  const handleChatWithSeller = (
    prod: FairlyUsedProduct,
    sellerNameOverride?: string,
    e?: React.MouseEvent,
    initialOfferAmount?: string
  ) => {
    if (e) e.stopPropagation();
    const neg = prod.activeNegotiation;
    if (neg && neg.buyerId !== user.uid && prod.sellerId !== user.uid && prod.negotiable) {
      showToast('In Negotiation - Please Wait');
      return;
    }
    setChatTarget({
      productId: prod.id,
      productName: prod.name,
      productPhoto: prod.photos[0] || '/assets/market/iphone_13_pro_max.jpg',
      sellerId: prod.sellerId,
      sellerName: sellerNameOverride || prod.sellerName,
      sellerEfadoId: prod.sellerEfadoId,
      initialOfferAmount
    });
    setStep('CHAT');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenMakeOffer = (prod: FairlyUsedProduct, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (prod.status === 'SOLD' || prod.stock <= 0) {
      showToast('This item is SOLD. Nobody can negotiate again.');
      return;
    }
    const neg = prod.activeNegotiation;
    if (neg && neg.buyerId !== user.uid) {
      showToast('In Negotiation - Please Wait');
      return;
    }
    setOfferModalProduct(prod);
    setOfferModalAmount(String(Math.round(prod.price * 0.9)));
  };

  const handleSubmitQuickOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerModalProduct) return;
    const amt = Number(offerModalAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      showToast('Enter a valid offer amount in Naira.');
      return;
    }
    setOfferModalBusy(true);
    try {
      const res = await submitOffer({
        productId: offerModalProduct.id,
        action: 'offer',
        amountNgn: amt
      });
      if (res.product) {
        syncSingleProductIntoState(res.product);
      }
      const targetProd = res.product || offerModalProduct;
      setOfferModalProduct(null);
      showToast(res.message);
      setChatTarget({
        productId: targetProd.id,
        productName: targetProd.name,
        productPhoto: targetProd.photos[0] || '/assets/market/iphone_13_pro_max.jpg',
        sellerId: targetProd.sellerId,
        sellerName: targetProd.sellerName,
        sellerEfadoId: targetProd.sellerEfadoId
      });
      setStep('CHAT');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      showToast(err?.message || 'Could not submit offer.');
    } finally {
      setOfferModalBusy(false);
    }
  };

  const handleAddToCart = (prod: FairlyUsedProduct, goCart: boolean = false, qty: number = 1) => {
    if (prod.status === 'SOLD' || prod.stock <= 0) {
      showToast('Sorry, this item just sold out');
      return;
    }
    const neg = prod.activeNegotiation;
    if (prod.negotiable) {
      if (neg && neg.buyerId !== user.uid) {
        showToast('In Negotiation - Please Wait');
        return;
      }
      if (!neg || neg.status !== 'AGREED') {
        showToast('Please negotiate and agree price first');
        if (goCart) {
          handleOpenMakeOffer(prod);
          return;
        }
      }
    }

    const agreedNgn =
      prod.negotiable && neg?.status === 'AGREED' && neg.buyerId === user.uid ? neg.agreedPriceNgn : undefined;
    const agreedKobo =
      prod.negotiable && neg?.status === 'AGREED' && neg.buyerId === user.uid ? neg.agreedPriceKobo : undefined;

    const safeQty = Math.max(1, Math.min(prod.stock, qty));
    setCartError(null);
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === prod.id);
      if (idx >= 0) {
        const next = [...prev];
        const nextQty = Math.min(prod.stock, next[idx].quantity + safeQty);
        next[idx] = {
          ...next[idx],
          product: prod,
          quantity: nextQty,
          agreedPriceNgn: agreedNgn,
          agreedPriceKobo: agreedKobo
        };
        return next;
      }
      return [
        ...prev,
        {
          product: prod,
          quantity: safeQty,
          agreedPriceNgn: agreedNgn,
          agreedPriceKobo: agreedKobo
        }
      ];
    });
    if (goCart) {
      setStep('CART');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      showToast(
        agreedNgn
          ? `Added "${prod.name}" at Agreed Price ${formatNaira(agreedNgn)}`
          : `Added "${prod.name}" to cart`
      );
    }
  };

  const handleBuyAtAgreedOrFixed = (prod: FairlyUsedProduct, qty: number = 1) => {
    if (prod.status === 'SOLD' || prod.stock <= 0) {
      showToast('Sorry, this item just sold out');
      return;
    }
    const neg = prod.activeNegotiation;
    if (prod.negotiable) {
      if (neg && neg.buyerId !== user.uid) {
        showToast('In Negotiation - Please Wait');
        return;
      }
      if (!neg || neg.status !== 'AGREED') {
        showToast('Please negotiate and agree price first');
        handleChatWithSeller(prod);
        return;
      }
    }
    const agreedNgn =
      prod.negotiable && neg?.status === 'AGREED' && neg.buyerId === user.uid ? neg.agreedPriceNgn : undefined;
    const agreedKobo =
      prod.negotiable && neg?.status === 'AGREED' && neg.buyerId === user.uid ? neg.agreedPriceKobo : undefined;

    const safeQty = Math.max(1, Math.min(prod.stock, qty));
    setCartError(null);
    setCart([
      {
        product: prod,
        quantity: safeQty,
        agreedPriceNgn: agreedNgn,
        agreedPriceKobo: agreedKobo
      }
    ]);
    setStep('CART');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShareProduct = (prod: FairlyUsedProduct, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const shareUrl = `${window.location.origin}/hub/fairly-used/${prod.id}`;
    if (navigator.share) {
      navigator
        .share({
          title: `${prod.name} — EFADO Fairly Used Market`,
          text: `Grade ${prod.conditionGrade} (${formatNaira(prod.price)}) • Chat ID: ${prod.sellerEfadoId} • Secured by EFADO Shield`,
          url: shareUrl
        })
        .catch(() => {
          navigator.clipboard?.writeText(shareUrl).then(() => showToast('Fairly Used item link copied!'));
        });
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => showToast('Fairly Used item link copied!'))
        .catch(() => showToast(`Share link: ${shareUrl}`));
    } else {
      showToast(`Share link: ${shareUrl}`);
    }
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setCartError(null);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return null;
          return { ...item, quantity: Math.min(Math.max(1, item.product.stock), nextQty) };
        })
        .filter(Boolean) as FairlyUsedCartItem[]
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartError(null);
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleProceedToDelivery = async () => {
    const ok = await syncCartWithLiveStock(cart);
    if (!ok) return;
    const unagreed = cart.find(
      (c) =>
        c.product.negotiable &&
        (!c.product.activeNegotiation ||
          c.product.activeNegotiation.status !== 'AGREED' ||
          c.product.activeNegotiation.buyerId !== user.uid)
    );
    if (unagreed) {
      setCartError('Please negotiate and agree price first');
      return;
    }
    const soldOutItem = cart.find((c) => c.product.status === 'SOLD' || c.product.stock < c.quantity);
    if (soldOutItem) {
      setCartError(`Sorry, this item just sold out: ${soldOutItem.product.name}`);
      return;
    }
    setStep('DELIVERY');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const coreFlowSteps = [
    { key: 'HOME', label: '1 Market' },
    { key: 'PRODUCT_DETAIL', label: '2 Item' },
    { key: 'CART', label: '3 Cart' },
    { key: 'DELIVERY', label: '4 Delivery' },
    { key: 'PAYMENT', label: '5 Payment' },
    { key: 'AUTHORIZE', label: '6 PIN' },
    { key: 'SUCCESS', label: '7 Track' }
  ] as const;

  const activeFlowIndex = coreFlowSteps.findIndex((s) => s.key === step);

  return (
    <div
      className="fairly-used-root min-h-screen overflow-x-hidden bg-gradient-to-b from-[#FDF2F8] via-[#FAF5FF] to-[#FDF2F8] text-black pb-24"
      style={{ fontFamily: "'Inter', 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* BLUE HEADER OVER LIGHT PURPLE-PINK MARKET + GOLD ACCENTS */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#3B82F6] text-white shadow-md">
        <div className="max-w-[1200px] mx-auto px-3 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (step === 'HOME') onClose();
                else setStep('HOME');
              }}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white shrink-0"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <img
              src="/efado_logo_192.jpg"
              alt="EFADO"
              className="w-8 h-8 rounded-xl object-cover border border-white/30 shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate mb-0 leading-tight">
                EFADO FAIRLY USED MARKET
              </h1>
              <p className="text-[10px] sm:text-xs text-blue-100 font-semibold truncate mb-0 leading-tight">
                Video Proof • EFADO ID Chat • Agreed Price • Secured by EFADO Shield
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setStep('VENDOR_REGISTRATION');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-black font-black text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5 shrink-0" />
              <span>Become a Seller</span>
            </button>

            <button
              type="button"
              onClick={() => (onNavigate ? onNavigate('wallet') : onClose())}
              className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-extrabold text-xs tabular-nums flex items-center gap-1 border border-white/25"
              title="EFADO Wallet Balance"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>{formatNaira(walletBalanceNgn)}</span>
            </button>

            <button
              type="button"
              onClick={() => setStep('ACTIVITY')}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white"
              aria-label="Notifications & Orders"
            >
              <Bell className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setStep('CART')}
              className="relative p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white"
              aria-label="Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F59E0B] text-black text-[10px] font-black flex items-center justify-center tabular-nums">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Light Sub-Navigation Tabs */}
        <div className="bg-white border-b border-pink-200 text-black">
          <div className="max-w-[1200px] mx-auto px-3 sm:px-6 flex items-center gap-5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setStep('HOME')}
              className={`py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                step === 'HOME' || step === 'FILTER' || step === 'PRODUCT_DETAIL'
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-black/60 hover:text-black'
              }`}
            >
              Browse Fairly Used
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('REELS');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1 ${
                step === 'REELS'
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-black/60 hover:text-black'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>E-FADO Reels</span>
            </button>
            <button
              type="button"
              onClick={() => setStep('ACTIVITY')}
              className={`py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                step === 'ACTIVITY' || step === 'CHAT'
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-black/60 hover:text-black'
              }`}
            >
              Activity &amp; Tracking
            </button>
            <button
              type="button"
              onClick={() => setStep('PROFILE')}
              className={`py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                step === 'PROFILE' || step === 'VENDOR_REGISTRATION'
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-black/60 hover:text-black'
              }`}
            >
              Seller Hub
            </button>
          </div>
        </div>

        {/* 7-Step Flow Progress Indicator (Left to Right) */}
        {activeFlowIndex >= 0 && (
          <div className="bg-purple-50/90 border-b border-pink-200 px-3 sm:px-6 py-2">
            <div className="max-w-[1200px] mx-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
              {coreFlowSteps.map((st, idx) => {
                const isDone = idx < activeFlowIndex;
                const isCurrent = idx === activeFlowIndex;
                return (
                  <React.Fragment key={st.key}>
                    <button
                      type="button"
                      disabled={idx > activeFlowIndex}
                      onClick={() => {
                        if (idx <= activeFlowIndex) setStep(st.key);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-extrabold whitespace-nowrap transition-colors ${
                        isCurrent
                          ? 'bg-[#F59E0B] text-black shadow-sm'
                          : isDone
                            ? 'bg-green-100 text-[#16A34A] hover:bg-green-200'
                            : 'bg-white text-black/40 border border-pink-100'
                      }`}
                    >
                      {st.label}
                    </button>
                    {idx < coreFlowSteps.length - 1 && <span className="text-pink-300 font-bold">→</span>}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Gateway Return Verification Banner */}
      {verifyingReturn && (
        <div className="max-w-[900px] mx-auto px-4 pt-6">
          <div className="bg-white rounded-2xl border border-pink-200 p-8 text-center shadow-sm space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#2563EB] mx-auto" />
            <h3 className="text-base font-extrabold text-black">Verifying Payment With EFADO Shield...</h3>
            <p className="text-xs text-black/70">Please wait while we secure your funds in Escrow.</p>
          </div>
        </div>
      )}

      {returnError && (
        <div className="max-w-[900px] mx-auto px-4 pt-4">
          <div className="bg-red-50 border border-[#DC2626]/30 rounded-2xl p-4 text-xs font-bold text-[#DC2626] flex items-center justify-between gap-3">
            <span>{returnError}</span>
            <button
              type="button"
              onClick={() => setReturnError(null)}
              className="px-3 py-1 bg-white rounded-lg border border-red-200 text-black"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* STEP 1: HOME — PURPLE + PINK GRADIENT CARDS + BLACK TEXT + GOLD     */}
      {/* =================================================================== */}
      {step === 'HOME' && !verifyingReturn && (
        <main className="max-w-[1200px] mx-auto px-3 sm:px-6 pt-4 space-y-4">
          {/* Search Bar + Filter Toggle */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#2563EB] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                placeholder="Search used iPhone, HP Laptop, House, Grade A..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-pink-200 text-sm text-black placeholder:text-black/45 shadow-sm focus:border-[#2563EB] outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setDraftFilters(filters);
                  setStep('FILTER');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-4 py-3 rounded-xl bg-white border border-pink-200 hover:border-[#2563EB] text-black text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-sm shrink-0"
              >
                <SlidersHorizontal className="w-4 h-4 text-[#2563EB]" />
                <span>Filter &amp; Sort</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('REELS');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-4 py-3 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-black text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 shadow-sm shrink-0"
              >
                <Film className="w-4 h-4" />
                <span>Watch Reels</span>
              </button>
            </div>
          </div>

          {/* Horizontal Category Strip */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {CATEGORY_LIST.map((cat) => {
              const active = filters.category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, category: cat }))}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap border transition-all ${
                    active
                      ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-sm'
                      : 'bg-white text-black border-pink-200 hover:border-[#2563EB]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Quick Traffic Chips: Relocation Sale / Verified In Store / Negotiable */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFilters((p) => ({ ...p, relocationOnly: !p.relocationOnly }))}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border ${
                filters.relocationOnly
                  ? 'bg-[#DC2626] text-white border-[#DC2626]'
                  : 'bg-white text-black border-pink-200'
              }`}
            >
              RELOCATION SALE - Must Go Fast
            </button>
            <button
              type="button"
              onClick={() => setFilters((p) => ({ ...p, inStoreVerifiedOnly: !p.inStoreVerifiedOnly }))}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border ${
                filters.inStoreVerifiedOnly
                  ? 'bg-[#2563EB] text-white border-[#2563EB]'
                  : 'bg-white text-black border-pink-200'
              }`}
            >
              Verified By EFADO - In Store
            </button>
            <button
              type="button"
              onClick={() => setFilters((p) => ({ ...p, negotiableOnly: !p.negotiableOnly }))}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border ${
                filters.negotiableOnly
                  ? 'bg-[#F59E0B] text-black border-[#F59E0B]'
                  : 'bg-white text-black border-pink-200'
              }`}
            >
              Negotiable Only
            </button>
          </div>

          {/* EFADO Shield Escrow + Warri Safe Meeting Point Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-green-50 border border-[#16A34A]/35 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-[#16A34A] shrink-0" />
              <p className="text-xs font-extrabold text-black mb-0">
                EFADO Protects Your Money • Your money is held safely until you confirm delivery.
              </p>
            </div>
            <div className="bg-gradient-to-r from-purple-100 via-white to-pink-100 border border-pink-200 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
              <MapPin className="w-5 h-5 text-[#2563EB] shrink-0" />
              <p className="text-xs font-extrabold text-black mb-0">
                Meet At EFADO Office - Delta State, Warri For Safe Exchange
              </p>
            </div>
          </div>

          {catalogError && (
            <div className="bg-red-50 border border-[#DC2626]/30 rounded-2xl p-4 text-xs font-bold text-[#DC2626]">
              {catalogError}
            </div>
          )}

          {/* Fairly Used Product Grid */}
          {loadingCatalog ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-pink-200 p-4 space-y-3 animate-pulse shadow-sm"
                >
                  <div className="w-full h-44 bg-purple-100 rounded-xl" />
                  <div className="h-4 bg-purple-100 rounded w-3/4" />
                  <div className="h-4 bg-pink-100 rounded w-1/2" />
                  <div className="h-9 bg-purple-100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl border border-pink-200 p-10 text-center space-y-3 shadow-sm">
              <Package className="w-10 h-10 text-purple-300 mx-auto" />
              <h3 className="text-base font-bold text-black">No Fairly Used Items Match That Filter</h3>
              <button
                type="button"
                onClick={() =>
                  setFilters({
                    category: 'All',
                    search: '',
                    brand: 'all',
                    location: 'all',
                    conditionGrade: 'all',
                    relocationOnly: false,
                    negotiableOnly: false,
                    inStoreVerifiedOnly: false,
                    freeDeliveryOnly: false,
                    priceMin: '',
                    priceMax: '',
                    sort: 'newest'
                  })
                }
                className="px-5 py-2.5 bg-[#F59E0B] text-black text-xs font-black rounded-xl"
              >
                Show All Fairly Used Items
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((prod) => {
                const isSoldOut = prod.status === 'SOLD' || prod.stock <= 0;
                const neg = prod.activeNegotiation;
                const lockedByOther = Boolean(neg && neg.buyerId !== user.uid && prod.negotiable && !isSoldOut);
                const agreedWithMe = Boolean(
                  neg && neg.status === 'AGREED' && neg.buyerId === user.uid && !isSoldOut
                );

                return (
                  <div
                    key={prod.id}
                    onClick={() => openProductDetail(prod.id, prod)}
                    className={`bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${
                      isSoldOut ? 'border-pink-200 opacity-95' : 'border-pink-200 hover:border-[#2563EB]'
                    }`}
                  >
                    <div>
                      <div className="relative h-48 bg-white overflow-hidden">
                        <img
                          src={prod.photos[0]}
                          alt={prod.name}
                          className={`w-full h-full object-cover ${isSoldOut ? 'grayscale opacity-65' : ''}`}
                        />

                        {/* Grade Badge */}
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-[#F59E0B] text-black text-[10px] font-black shadow">
                          Grade {prod.conditionGrade}
                        </span>

                        {/* Relocation Sale Tag */}
                        {prod.reasonForSelling === 'Relocating Abroad' && !isSoldOut && (
                          <span className="absolute top-2.5 right-2.5 px-2 py-1 rounded-lg bg-[#DC2626] text-white text-[10px] font-black shadow">
                            RELOCATION SALE - Must Go Fast
                          </span>
                        )}

                        {isSoldOut && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <span className="px-4 py-1.5 rounded-xl bg-[#DC2626] text-white text-xs font-black tracking-widest -rotate-6 shadow-md">
                              SOLD OUT
                            </span>
                          </div>
                        )}

                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1">
                          <span className="px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold flex items-center gap-1">
                            <Video className="w-3 h-3 text-[#F59E0B]" />
                            Video Proof
                          </span>
                          {prod.listingMode === 'bulk' && (
                            <span className="px-2 py-0.5 rounded-md bg-[#2563EB] text-white text-[10px] font-black">
                              BULK ({prod.stock} units)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-3.5 space-y-2">
                        {/* Clickable EFADO ID + Online Status */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleChatWithSeller(prod, prod.sellerName, e)}
                            className="px-2 py-0.5 rounded-md bg-[#2563EB] hover:bg-blue-700 text-white text-[10px] font-black flex items-center gap-1"
                            title="Open EFADO Chat directly"
                          >
                            <MessageCircle className="w-2.5 h-2.5" />
                            <span>{prod.sellerEfadoId}</span>
                          </button>

                          {prod.sellerOnline ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#16A34A]">
                              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                              Online Now - Chat Now
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-black/55">
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              Offline - Leave Message
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-extrabold text-black leading-snug line-clamp-2 min-h-[2.5rem] mb-0">
                          {prod.name}
                        </h3>

                        {/* Verification / Video Like / Lock Badges */}
                        <div className="flex flex-wrap gap-1">
                          {prod.videoLikesCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-100 text-[#16A34A] text-[10px] font-extrabold">
                              <ThumbsUp className="w-2.5 h-2.5" />
                              Liked / Buyer Confirmed Video
                            </span>
                          )}
                          {prod.keptInEfadoStore && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-[#2563EB] text-[10px] font-extrabold">
                              <BadgeCheck className="w-2.5 h-2.5" />
                              Verified By EFADO - In Store
                            </span>
                          )}
                          {lockedByOther && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 border border-[#F59E0B] text-black text-[10px] font-black">
                              In Negotiation - Please Wait
                            </span>
                          )}
                          {agreedWithMe && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F59E0B] text-black text-[10px] font-black">
                              Agreed: {formatNaira(neg?.agreedPriceNgn || prod.price)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-baseline justify-between gap-2 pt-0.5">
                          <div>
                            <p className="text-base font-black text-[#2563EB] tabular-nums mb-0">
                              {formatNaira(agreedWithMe ? neg?.agreedPriceNgn || prod.price : prod.price)}
                            </p>
                            {prod.originalPrice && prod.originalPrice > prod.price && (
                              <span className="text-[11px] line-through text-black/45 tabular-nums">
                                {formatNaira(prod.originalPrice)}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-bold text-black/65 truncate">{prod.sellerLocation}</span>
                        </div>

                        <p className="text-[11px] font-medium text-black/75 line-clamp-1 mb-0">
                          Fault: {prod.faultDescription || 'None — Working Perfectly'}
                        </p>
                      </div>
                    </div>

                    {/* Card Action Buttons */}
                    <div className="px-3.5 pb-3.5 pt-1 space-y-1.5">
                      {isSoldOut ? (
                        <button
                          type="button"
                          onClick={(e) => handleNotifyMe(prod.id, e)}
                          className={`w-full py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 ${
                            prod.isOnWaitlist
                              ? 'bg-purple-100 text-[#2563EB] border border-pink-200'
                              : 'bg-amber-50 text-black border border-[#F59E0B]'
                          }`}
                        >
                          <Bell className="w-3.5 h-3.5" />
                          <span>{prod.isOnWaitlist ? 'Subscribed To Alerts' : 'Notify Me When Back'}</span>
                        </button>
                      ) : (
                        <>
                          {agreedWithMe && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBuyAtAgreedOrFixed(prod, 1);
                              }}
                              className="w-full py-2 px-3 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-black font-black text-xs shadow-sm"
                            >
                              Buy At Agreed Price - {formatNaira(neg?.agreedPriceNgn || prod.price)}
                            </button>
                          )}
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              disabled={lockedByOther}
                              onClick={(e) => handleChatWithSeller(prod, prod.sellerName, e)}
                              className="py-2 px-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 disabled:bg-amber-100 disabled:text-black text-white font-extrabold text-[11px] flex items-center justify-center gap-1 truncate"
                            >
                              <MessageCircle className="w-3 h-3 shrink-0" />
                              <span className="truncate">
                                {lockedByOther ? 'In Negotiation - Please Wait' : 'Chat - Negotiate Price'}
                              </span>
                            </button>
                            <button
                              type="button"
                              disabled={lockedByOther}
                              onClick={(e) => handleOpenMakeOffer(prod, e)}
                              className="py-2 px-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 text-black font-black text-[11px] flex items-center justify-center gap-1"
                            >
                              <Handshake className="w-3 h-3 shrink-0" />
                              <span>Make Offer</span>
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => handleShareProduct(prod, e)}
                              className="py-2 px-2 rounded-xl bg-white border border-pink-200 hover:bg-purple-50 text-black font-bold text-[11px] flex items-center justify-center gap-1"
                            >
                              <Share2 className="w-3 h-3 text-[#2563EB]" />
                              <span>Share</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(prod, false, 1);
                              }}
                              className="py-2 px-2 rounded-xl bg-white border border-pink-200 hover:bg-purple-50 text-black font-extrabold text-[11px] flex items-center justify-center gap-1"
                            >
                              <Plus className="w-3 h-3 text-[#2563EB]" />
                              <span>Add</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* =================================================================== */}
      {/* FILTER FULL PAGE                                                    */}
      {/* =================================================================== */}
      {step === 'FILTER' && (
        <div className="max-w-[780px] mx-auto px-3 sm:px-6 pt-4 pb-28 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setStep('HOME')}
                className="p-2.5 rounded-xl bg-white border border-pink-200 text-black shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-extrabold text-black mb-0">Filter &amp; Sort Fairly Used</h2>
            </div>
            <button
              type="button"
              onClick={() =>
                setDraftFilters({
                  category: 'All',
                  search: '',
                  brand: 'all',
                  location: 'all',
                  conditionGrade: 'all',
                  relocationOnly: false,
                  negotiableOnly: false,
                  inStoreVerifiedOnly: false,
                  freeDeliveryOnly: false,
                  priceMin: '',
                  priceMax: '',
                  sort: 'newest'
                })
              }
              className="text-xs font-extrabold text-[#2563EB] flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>
          </div>

          <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl border border-pink-200 p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-black mb-1">Category</label>
                <select
                  value={draftFilters.category}
                  onChange={(e) =>
                    setDraftFilters((p) => ({ ...p, category: e.target.value as FairlyUsedCategory }))
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-pink-200 bg-white text-sm font-bold text-black"
                >
                  {CATEGORY_LIST.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">Condition Grade</label>
                <select
                  value={draftFilters.conditionGrade}
                  onChange={(e) =>
                    setDraftFilters((p) => ({ ...p, conditionGrade: e.target.value as 'all' | ConditionGrade }))
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-pink-200 bg-white text-sm font-bold text-black"
                >
                  <option value="all">All Grades (A, B, C, D)</option>
                  <option value="A">A - Like New</option>
                  <option value="B">B - Neatly Used</option>
                  <option value="C">C - Used With Small Scratch</option>
                  <option value="D">D - Needs Repair</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">Min Price (₦)</label>
                <input
                  type="number"
                  value={draftFilters.priceMin}
                  onChange={(e) => setDraftFilters((p) => ({ ...p, priceMin: e.target.value }))}
                  placeholder="e.g. 50000"
                  className="w-full px-3 py-2.5 rounded-xl border border-pink-200 bg-white text-sm text-black"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">Max Price (₦)</label>
                <input
                  type="number"
                  value={draftFilters.priceMax}
                  onChange={(e) => setDraftFilters((p) => ({ ...p, priceMax: e.target.value }))}
                  placeholder="e.g. 900000"
                  className="w-full px-3 py-2.5 rounded-xl border border-pink-200 bg-white text-sm text-black"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">Location</label>
                <input
                  type="text"
                  value={draftFilters.location === 'all' ? '' : draftFilters.location}
                  onChange={(e) => setDraftFilters((p) => ({ ...p, location: e.target.value || 'all' }))}
                  placeholder="e.g. Warri, Delta, Lagos"
                  className="w-full px-3 py-2.5 rounded-xl border border-pink-200 bg-white text-sm text-black"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">Sort By</label>
                <select
                  value={draftFilters.sort}
                  onChange={(e) =>
                    setDraftFilters((p) => ({
                      ...p,
                      sort: e.target.value as FairlyUsedFilterState['sort']
                    }))
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-pink-200 bg-white text-sm font-bold text-black"
                >
                  <option value="newest">Newest Listed</option>
                  <option value="price_asc">Lowest Price</option>
                  <option value="price_desc">Highest Price</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-black font-bold">
              <label className="flex items-center gap-2 bg-white p-3 rounded-xl border border-pink-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftFilters.relocationOnly}
                  onChange={(e) => setDraftFilters((p) => ({ ...p, relocationOnly: e.target.checked }))}
                  className="w-4 h-4 accent-[#2563EB]"
                />
                <span>Relocation Sale Only (Must Go Fast)</span>
              </label>
              <label className="flex items-center gap-2 bg-white p-3 rounded-xl border border-pink-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftFilters.inStoreVerifiedOnly}
                  onChange={(e) => setDraftFilters((p) => ({ ...p, inStoreVerifiedOnly: e.target.checked }))}
                  className="w-4 h-4 accent-[#2563EB]"
                />
                <span>Verified By EFADO - In Store Only</span>
              </label>
              <label className="flex items-center gap-2 bg-white p-3 rounded-xl border border-pink-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftFilters.negotiableOnly}
                  onChange={(e) => setDraftFilters((p) => ({ ...p, negotiableOnly: e.target.checked }))}
                  className="w-4 h-4 accent-[#2563EB]"
                />
                <span>Negotiable Items Only</span>
              </label>
              <label className="flex items-center gap-2 bg-white p-3 rounded-xl border border-pink-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftFilters.freeDeliveryOnly}
                  onChange={(e) => setDraftFilters((p) => ({ ...p, freeDeliveryOnly: e.target.checked }))}
                  className="w-4 h-4 accent-[#2563EB]"
                />
                <span>Free Delivery Only</span>
              </label>
            </div>

            <button
              type="button"
              onClick={() => {
                setFilters(draftFilters);
                setStep('HOME');
              }}
              className="w-full py-3.5 bg-[#F59E0B] hover:bg-[#D97706] text-black font-black text-sm rounded-xl shadow-sm"
            >
              Apply Filters &amp; View Results
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* E-FADO REELS FEED                                                   */}
      {/* =================================================================== */}
      {step === 'REELS' && (
        <FairlyUsedReelsView
          onBack={() => setStep('HOME')}
          onBuyThis={(productId) => openProductDetail(productId)}
          onChatSeller={(reel: FairlyUsedReel) => {
            setChatTarget({
              productId: reel.productId,
              productName: reel.productName,
              productPhoto: reel.posterUrl,
              sellerId: reel.sellerId,
              sellerName: reel.sellerName,
              sellerEfadoId: reel.sellerEfadoId
            });
            setStep('CHAT');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onShowToast={showToast}
        />
      )}

      {/* =================================================================== */}
      {/* STEP 2: PRODUCT DETAIL (5 PHOTOS + WORKING VIDEO + LIKE + DETAILS)  */}
      {/* =================================================================== */}
      {step === 'PRODUCT_DETAIL' && selectedProduct && (
        <div className="max-w-[960px] mx-auto px-3 sm:px-6 pt-4 pb-36 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setStep('HOME')}
              className="px-3.5 py-2 rounded-xl bg-white border border-pink-200 text-black text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Market</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleShareProduct(selectedProduct)}
                className="px-3 py-2 rounded-xl bg-white border border-pink-200 text-[#2563EB] text-xs font-extrabold flex items-center gap-1 shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {detailLoading && (
            <div className="bg-white rounded-xl border border-pink-200 px-4 py-2 text-xs font-bold text-[#2563EB] flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Refreshing live item status &amp; negotiation lock...</span>
            </div>
          )}

          {/* Media Card: Switch between 5 Real Photos and 1 Real Working Video */}
          <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between gap-2 p-3 border-b border-pink-100 bg-white">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDetailTab('photos')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold ${
                    detailTab === 'photos' ? 'bg-[#2563EB] text-white' : 'bg-purple-50 text-black'
                  }`}
                >
                  5 Real Photos ({selectedProduct.photos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('video')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 ${
                    detailTab === 'video' ? 'bg-[#2563EB] text-white' : 'bg-[#F59E0B] text-black'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Watch Working Video</span>
                </button>
              </div>
              <button
                type="button"
                disabled={likingVideo}
                onClick={() => handleLikeVideo(selectedProduct)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 border ${
                  selectedProduct.likedVideoByMe
                    ? 'bg-green-100 text-[#16A34A] border-[#16A34A]/40'
                    : 'bg-white text-black border-pink-200 hover:bg-green-50'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>LIKE Video ({selectedProduct.videoLikesCount})</span>
              </button>
            </div>

            {detailTab === 'photos' ? (
              <div className="p-3 sm:p-4 space-y-3">
                <div className="relative rounded-xl overflow-hidden bg-white border border-pink-100 h-72 sm:h-96">
                  <img
                    src={selectedProduct.photos[activePhotoIdx] || selectedProduct.photos[0]}
                    alt={selectedProduct.name}
                    className="w-full h-full object-contain bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setZoomLightboxOpen(true)}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-black/65 text-white hover:bg-black"
                    aria-label="Zoom photo"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  {selectedProduct.photos.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setActivePhotoIdx(
                            (i) => (i - 1 + selectedProduct.photos.length) % selectedProduct.photos.length
                          )
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 text-black shadow"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePhotoIdx((i) => (i + 1) % selectedProduct.photos.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 text-black shadow"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {selectedProduct.photos.map((src, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActivePhotoIdx(idx)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 ${
                        activePhotoIdx === idx ? 'border-[#2563EB]' : 'border-pink-200'
                      }`}
                    >
                      <img src={src} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-3 bg-slate-900">
                <video
                  src={selectedProduct.videoUrl}
                  poster={selectedProduct.photos[0]}
                  controls
                  playsInline
                  className="w-full max-h-[380px] rounded-xl bg-black"
                />
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white">
                  <span>Watch item working live (power ON / booting). Click LIKE if working!</span>
                  <button
                    type="button"
                    disabled={likingVideo}
                    onClick={() => handleLikeVideo(selectedProduct)}
                    className="px-4 py-2 rounded-xl bg-[#16A34A] hover:bg-green-700 text-white font-extrabold flex items-center gap-1.5"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>LIKE — Confirm Video Working ({selectedProduct.videoLikesCount})</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Core Price + Badges + Tags */}
          <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl border border-pink-200 p-5 shadow-sm space-y-3">
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2.5 py-1 rounded-lg bg-[#F59E0B] text-black text-xs font-black">
                Grade {GRADE_LABELS[selectedProduct.conditionGrade]}
              </span>
              {selectedProduct.reasonForSelling === 'Relocating Abroad' && (
                <span className="px-2.5 py-1 rounded-lg bg-[#DC2626] text-white text-xs font-black">
                  RELOCATION SALE - Must Go Fast
                </span>
              )}
              {selectedProduct.videoLikesCount > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-green-100 text-[#16A34A] text-xs font-extrabold flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Liked / Buyer Confirmed Video ({selectedProduct.videoLikesCount})
                </span>
              )}
              {selectedProduct.keptInEfadoStore && (
                <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-[#2563EB] text-xs font-extrabold flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Verified By EFADO - In Store
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-black leading-tight mb-0">{selectedProduct.name}</h2>

            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl font-black text-[#2563EB] tabular-nums">
                  {formatNaira(
                    selectedProduct.activeNegotiation?.status === 'AGREED' &&
                      selectedProduct.activeNegotiation.buyerId === user.uid
                      ? selectedProduct.activeNegotiation.agreedPriceNgn || selectedProduct.price
                      : selectedProduct.price
                  )}
                </span>
                {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                  <span className="text-sm line-through text-black/45 tabular-nums">
                    {formatNaira(selectedProduct.originalPrice)}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-black/75">
                Stock: {selectedProduct.stock} unit(s) • {selectedProduct.negotiable ? 'Negotiable' : 'Fixed Price'}
              </span>
            </div>

            {/* Active Lock / Agreed Banner */}
            {selectedProduct.negotiable && selectedProduct.activeNegotiation && (
              <div
                className={`rounded-xl p-3 border text-xs font-extrabold flex flex-wrap items-center justify-between gap-2 ${
                  selectedProduct.activeNegotiation.buyerId !== user.uid
                    ? 'bg-amber-100 border-[#F59E0B] text-black'
                    : selectedProduct.activeNegotiation.status === 'AGREED'
                      ? 'bg-green-100 border-[#16A34A]/40 text-[#16A34A]'
                      : 'bg-blue-50 border-[#2563EB]/30 text-[#2563EB]'
                }`}
              >
                {selectedProduct.activeNegotiation.buyerId !== user.uid ? (
                  <span>In Negotiation - Please Wait (Another buyer is currently negotiating this item)</span>
                ) : selectedProduct.activeNegotiation.status === 'AGREED' ? (
                  <span>
                    Deal Agreed! Your Agreed Price is{' '}
                    {formatNaira(selectedProduct.activeNegotiation.agreedPriceNgn || selectedProduct.price)}
                  </span>
                ) : (
                  <span>
                    Your Offer Active:{' '}
                    {formatNaira(
                      selectedProduct.activeNegotiation.counterAmountNgn ||
                        selectedProduct.activeNegotiation.offerAmountNgn
                    )}{' '}
                    — Open EFADO Chat to finalize
                  </span>
                )}
              </div>
            )}

            {/* 4 Detail Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <button
                type="button"
                disabled={
                  selectedProduct.status === 'SOLD' ||
                  Boolean(
                    selectedProduct.activeNegotiation &&
                      selectedProduct.activeNegotiation.buyerId !== user.uid &&
                      selectedProduct.negotiable
                  )
                }
                onClick={() => handleChatWithSeller(selectedProduct)}
                className="py-2.5 px-3 rounded-xl bg-[#2563EB] hover:bg-blue-700 disabled:bg-amber-100 disabled:text-black text-white font-extrabold text-xs flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>
                  {selectedProduct.activeNegotiation &&
                  selectedProduct.activeNegotiation.buyerId !== user.uid &&
                  selectedProduct.negotiable
                    ? 'In Negotiation - Please Wait'
                    : 'Chat - Negotiate Price'}
                </span>
              </button>
              <button
                type="button"
                disabled={
                  selectedProduct.status === 'SOLD' ||
                  Boolean(
                    selectedProduct.activeNegotiation &&
                      selectedProduct.activeNegotiation.buyerId !== user.uid &&
                      selectedProduct.negotiable
                  )
                }
                onClick={() => handleOpenMakeOffer(selectedProduct)}
                className="py-2.5 px-3 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 text-black font-black text-xs flex items-center justify-center gap-1.5"
              >
                <Handshake className="w-3.5 h-3.5" />
                <span>Make Offer</span>
              </button>
              <button
                type="button"
                onClick={() => handleShareProduct(selectedProduct)}
                className="py-2.5 px-3 rounded-xl bg-white border border-pink-200 text-black font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Share</span>
              </button>
              <button
                type="button"
                disabled={selectedProduct.status === 'SOLD'}
                onClick={() => handleAddToCart(selectedProduct, false, detailQty)}
                className="py-2.5 px-3 rounded-xl bg-white border border-pink-200 text-black font-extrabold text-xs flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Condition Report & Fault Disclosure Box */}
          <div className="bg-white rounded-2xl border border-pink-200 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-black border-b border-pink-100 pb-2 mb-0">
              Honest Inspection Report &amp; Faults
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-black">
              <div className="bg-purple-50 rounded-xl p-3">
                <span className="text-black/60 font-bold block">Condition Grade</span>
                <strong>{GRADE_LABELS[selectedProduct.conditionGrade]}</strong>
              </div>
              <div className="bg-purple-50 rounded-xl p-3">
                <span className="text-black/60 font-bold block">Reason For Selling</span>
                <strong>{selectedProduct.reasonForSelling}</strong>
              </div>
              <div className="bg-purple-50 rounded-xl p-3">
                <span className="text-black/60 font-bold block">How Long Used</span>
                <strong>{selectedProduct.howLongUsed}</strong>
              </div>
              <div className="bg-purple-50 rounded-xl p-3">
                <span className="text-black/60 font-bold block">Working Perfectly?</span>
                <strong className={selectedProduct.workingPerfectly ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                  {selectedProduct.workingPerfectly ? 'Yes — Tested Working' : 'Has Issue (See Fault Below)'}
                </strong>
              </div>
              <div className="bg-amber-50 border border-[#F59E0B]/40 rounded-xl p-3 sm:col-span-2">
                <span className="text-black/70 font-bold block">What Is Fault? (Seller Disclosure)</span>
                <strong className="text-black">{selectedProduct.faultDescription}</strong>
              </div>
              <div className="bg-purple-50 rounded-xl p-3">
                <span className="text-black/60 font-bold block">Location &amp; Buyer Inspection</span>
                <strong>
                  {selectedProduct.sellerLocation} • Can Buyer Inspect? {selectedProduct.canInspect ? 'Yes' : 'No'}
                </strong>
              </div>
              <div className="bg-purple-50 rounded-xl p-3">
                <span className="text-black/60 font-bold block">Delivery or Pickup Only</span>
                <strong>
                  {selectedProduct.deliveryOption === 'PICKUP_ONLY'
                    ? 'Pickup / Inspection Only'
                    : selectedProduct.deliveryOption === 'DELIVERY'
                      ? 'Delivery Only'
                      : 'Delivery OR Pickup Available'}
                </strong>
              </div>
            </div>

            {selectedProduct.description && (
              <p className="text-xs text-black/80 leading-relaxed pt-1 mb-0">{selectedProduct.description}</p>
            )}
          </div>

          {/* Bulk Business Closing Items Table */}
          {selectedProduct.listingMode === 'bulk' &&
            Array.isArray(selectedProduct.bulkItems) &&
            selectedProduct.bulkItems.length > 0 && (
              <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl border border-pink-200 p-5 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-black text-black mb-0">
                    Bulk / Business Closing Clearance List ({selectedProduct.stock} Units Total)
                  </h3>
                  {selectedProduct.bulkTotalPrice && (
                    <span className="px-3 py-1 rounded-lg bg-[#F59E0B] text-black text-xs font-black tabular-nums">
                      Total For All: {formatNaira(selectedProduct.bulkTotalPrice)}
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-pink-200 text-black/70">
                        <th className="py-2 pr-3">Item Name</th>
                        <th className="py-2 pr-3">Qty</th>
                        <th className="py-2 pr-3">Price / Item</th>
                        <th className="py-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProduct.bulkItems.map((bi, idx) => (
                        <tr key={idx} className="border-b border-pink-100 text-black">
                          <td className="py-2 pr-3 font-bold">{bi.name}</td>
                          <td className="py-2 pr-3 tabular-nums">{bi.quantity}</td>
                          <td className="py-2 pr-3 font-extrabold text-[#2563EB] tabular-nums">
                            {formatNaira(bi.unitPrice)}
                          </td>
                          <td className="py-2 text-black/70">{bi.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          {/* House / Land Details Card */}
          {selectedProduct.houseDetails && (
            <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl border border-pink-200 p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-black text-black flex items-center gap-2 mb-0">
                <Building2 className="w-4 h-4 text-[#2563EB]" />
                <span>House / Land Details &amp; Documents</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-black">
                <div className="bg-white rounded-xl p-3 border border-pink-100">
                  <span className="text-black/60 block font-bold">Rooms</span>
                  <strong>{selectedProduct.houseDetails.rooms || 'N/A'}</strong>
                </div>
                <div className="bg-white rounded-xl p-3 border border-pink-100">
                  <span className="text-black/60 block font-bold">Bathrooms</span>
                  <strong>{selectedProduct.houseDetails.bathrooms || 'N/A'}</strong>
                </div>
                <div className="bg-white rounded-xl p-3 border border-pink-100">
                  <span className="text-black/60 block font-bold">Land Size</span>
                  <strong>{selectedProduct.houseDetails.landSize || 'N/A'}</strong>
                </div>
                <div className="bg-white rounded-xl p-3 border border-pink-100">
                  <span className="text-black/60 block font-bold">Occupied?</span>
                  <strong>{selectedProduct.houseDetails.occupied || 'No'}</strong>
                </div>
                <div className="bg-white rounded-xl p-3 border border-pink-100 col-span-2">
                  <span className="text-black/60 block font-bold">Documents</span>
                  <strong>{selectedProduct.houseDetails.documents.join(', ')}</strong>
                </div>
                <div className="bg-white rounded-xl p-3 border border-pink-100 col-span-2 sm:col-span-3">
                  <span className="text-black/60 block font-bold">Full Address</span>
                  <strong>{selectedProduct.houseDetails.fullAddress}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Seller Card (EFADO Chat ID + Online Status — NO Bank / NO WhatsApp) */}
          <div className="bg-white rounded-2xl border border-pink-200 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleChatWithSeller(selectedProduct)}
                  className="px-2.5 py-1 rounded-lg bg-[#2563EB] text-white text-xs font-black"
                >
                  {selectedSeller?.efadoId || selectedProduct.sellerEfadoId}
                </button>
                <span className="text-sm font-black text-black">
                  {selectedSeller?.storeName || selectedProduct.sellerName}
                </span>
                {selectedSeller?.online || selectedProduct.sellerOnline ? (
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#16A34A]">
                    <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                    Online Now - Chat Now
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-black/55">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    Offline - Leave Message
                  </span>
                )}
              </div>
              <p className="text-xs text-black/70 mb-0">
                Location: {selectedProduct.sellerLocation} • Sales: {selectedSeller?.salesCount ?? selectedProduct.sellerSalesCount}
              </p>
              <p className="text-[11px] font-bold text-[#2563EB] mb-0">
                Meet At EFADO Office - Delta State, Warri For Safe Exchange
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChatWithSeller(selectedProduct)}
              className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Open EFADO Chat</span>
            </button>
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-2xl border border-pink-200 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-black mb-0">Verified Buyer Reviews ({productReviews.length})</h3>
            {productReviews.length === 0 ? (
              <p className="text-xs text-black/60 mb-0">No reviews yet. Be the first verified buyer to review!</p>
            ) : (
              <div className="space-y-2.5">
                {productReviews.map((rv) => (
                  <div key={rv.id} className="bg-purple-50/60 rounded-xl p-3 border border-pink-100 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-black">{rv.buyerName}</span>
                      <span className="text-[#F59E0B] font-black flex items-center gap-0.5">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {rv.rating}/5
                      </span>
                    </div>
                    <p className="text-xs text-black/85 mb-0">{rv.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sticky Bottom Purchase Bar */}
          <div className="fixed bottom-16 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-pink-200 px-3 sm:px-6 py-3 shadow-lg">
            <div className="max-w-[960px] mx-auto flex flex-wrap items-center gap-2.5">
              {selectedProduct.status === 'SOLD' || selectedProduct.stock <= 0 ? (
                <button
                  type="button"
                  onClick={() => handleNotifyMe(selectedProduct.id)}
                  className="w-full py-3.5 px-6 bg-amber-100 border border-[#F59E0B] text-black font-black text-sm rounded-xl"
                >
                  SOLD OUT — Notify Me When Relisted
                </button>
              ) : selectedProduct.negotiable &&
                selectedProduct.activeNegotiation &&
                selectedProduct.activeNegotiation.buyerId !== user.uid ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-3.5 px-6 bg-amber-100 border border-[#F59E0B] text-black font-black text-sm rounded-xl"
                >
                  In Negotiation - Please Wait
                </button>
              ) : selectedProduct.negotiable &&
                selectedProduct.activeNegotiation?.status === 'AGREED' &&
                selectedProduct.activeNegotiation.buyerId === user.uid ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleAddToCart(selectedProduct, false, detailQty)}
                    className="px-4 py-3.5 rounded-xl bg-white border-2 border-pink-200 text-black font-extrabold text-xs sm:text-sm"
                  >
                    Add To Cart
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBuyAtAgreedOrFixed(selectedProduct, detailQty)}
                    className="flex-1 py-3.5 px-5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-black font-black text-xs sm:text-sm shadow-md"
                  >
                    Buy At Agreed Price -{' '}
                    {formatNaira(selectedProduct.activeNegotiation.agreedPriceNgn || selectedProduct.price)}
                  </button>
                </>
              ) : selectedProduct.negotiable ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleChatWithSeller(selectedProduct)}
                    className="flex-1 py-3.5 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat - Negotiate Price</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenMakeOffer(selectedProduct)}
                    className="flex-1 py-3.5 px-4 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-black font-black text-xs sm:text-sm flex items-center justify-center gap-1.5"
                  >
                    <Handshake className="w-4 h-4" />
                    <span>Make Offer</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleAddToCart(selectedProduct, false, detailQty)}
                    className="flex-1 py-3.5 px-4 rounded-xl bg-white border-2 border-[#2563EB] text-[#2563EB] font-extrabold text-xs sm:text-sm"
                  >
                    ADD TO CART
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBuyAtAgreedOrFixed(selectedProduct, detailQty)}
                    className="flex-1 py-3.5 px-5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-black font-black text-xs sm:text-sm shadow-md"
                  >
                    BUY NOW - {formatNaira(selectedProduct.price * detailQty)}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Photo Zoom Lightbox */}
          {zoomLightboxOpen && (
            <div
              onClick={() => setZoomLightboxOpen(false)}
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            >
              <button
                type="button"
                onClick={() => setZoomLightboxOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white text-black"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={selectedProduct.photos[activePhotoIdx] || selectedProduct.photos[0]}
                alt={selectedProduct.name}
                className="max-w-full max-h-[85vh] object-contain rounded-xl"
              />
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* STEP 3: CART                                                        */}
      {/* =================================================================== */}
      {step === 'CART' && (
        <CartPage
          cart={cart}
          currentUserId={user.uid}
          onBack={() => setStep('HOME')}
          onUpdateQty={(pid, delta) => handleUpdateCartQty(pid, delta)}
          onRemoveItem={(pid) => handleRemoveCartItem(pid)}
          onNegotiateItem={(prod) => handleChatWithSeller(prod)}
          onProceedToDelivery={handleProceedToDelivery}
          errorMsg={cartError}
          checkingStock={checkingCartStock}
        />
      )}

      {/* =================================================================== */}
      {/* STEP 4: DELIVERY & PICKUP                                           */}
      {/* =================================================================== */}
      {step === 'DELIVERY' && (
        <DeliveryPage
          cart={cart}
          currentUserId={user.uid}
          defaultName={user?.displayName || user?.fullName || ''}
          defaultPhone={user?.phoneNumber || ''}
          onBack={() => setStep('CART')}
          onOrderCreated={(order) => {
            setActiveOrder(order);
            setStep('PAYMENT');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* =================================================================== */}
      {/* STEP 5: PAYMENT METHOD SELECTION                                    */}
      {/* =================================================================== */}
      {step === 'PAYMENT' && activeOrder && (
        <PaymentPage
          order={activeOrder}
          walletBalanceNgn={walletBalanceNgn}
          selectedMethod={paymentMethod}
          selectedGateway={paymentGateway}
          onSelectPayment={(m, gw) => {
            setPaymentMethod(m);
            setPaymentGateway(gw);
          }}
          onBack={() => setStep('DELIVERY')}
          onBackToCart={() => setStep('CART')}
          onProceedToAuthorize={() => {
            setStep('AUTHORIZE');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onFundWallet={() => {
            if (onNavigate) onNavigate('wallet');
            else showToast('Open your EFADO Wallet to top up balance.');
          }}
        />
      )}

      {/* =================================================================== */}
      {/* STEP 6: AUTHORIZE TRANSACTION (PIN + >100k OTP)                     */}
      {/* =================================================================== */}
      {step === 'AUTHORIZE' && activeOrder && (
        <AuthorizePage
          order={activeOrder}
          paymentMethod={paymentMethod}
          paymentGateway={paymentGateway}
          hasPin={hasPin}
          biometricEnabled={biometricEnabled}
          onBackToPayment={() => setStep('PAYMENT')}
          onCancelToMarket={() => setStep('HOME')}
          onPinUpdated={refreshWalletAndSecurity}
          onSuccessWallet={(paidOrder) => {
            setActiveOrder(paidOrder);
            setCart([]);
            setStep('SUCCESS');
            refreshWalletAndSecurity();
            loadCatalog();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* =================================================================== */}
      {/* STEP 7: SUCCESS + TRACKING + RELEASE + DISPUTE                      */}
      {/* =================================================================== */}
      {step === 'SUCCESS' && activeOrder && (
        <SuccessPage
          order={activeOrder}
          onOrderUpdated={(updated) => setActiveOrder(updated)}
          onViewOrders={() => {
            setStep('ACTIVITY');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onContinueShopping={() => {
            setStep('HOME');
            loadCatalog();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* =================================================================== */}
      {/* IN-APP EFADO CHAT                                                   */}
      {/* =================================================================== */}
      {step === 'CHAT' && chatTarget && (
        <SellerChatPage
          currentUserId={user.uid}
          productId={chatTarget.productId}
          productName={chatTarget.productName}
          productPhoto={chatTarget.productPhoto}
          sellerId={chatTarget.sellerId}
          sellerName={chatTarget.sellerName}
          sellerEfadoId={chatTarget.sellerEfadoId}
          buyerId={chatTarget.buyerId}
          initialOfferAmount={chatTarget.initialOfferAmount}
          onBack={() => setStep('HOME')}
          onBuyAtAgreedPrice={(prod) => handleBuyAtAgreedOrFixed(prod, 1)}
          onProductUpdated={syncSingleProductIntoState}
        />
      )}

      {/* =================================================================== */}
      {/* ACTIVITY (MY ORDERS, CHATS, ALERTS, SELLER ORDERS)                  */}
      {/* =================================================================== */}
      {step === 'ACTIVITY' && (
        <ActivityPage
          onOpenOrderTracking={(ord) => {
            setActiveOrder(ord);
            setStep('SUCCESS');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenChat={(th: FairlyUsedChatThread) => {
            setChatTarget({
              productId: th.productId,
              productName: th.productName,
              productPhoto: th.productPhoto,
              sellerId: th.sellerId,
              sellerName: th.sellerName,
              sellerEfadoId: th.sellerEfadoId,
              buyerId: th.buyerId
            });
            setStep('CHAT');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onBackToMarket={() => setStep('HOME')}
        />
      )}

      {/* =================================================================== */}
      {/* BECOME A SELLER / VENDOR KYC                                        */}
      {/* =================================================================== */}
      {step === 'VENDOR_REGISTRATION' && (
        <VendorRegistrationPage
          userEmail={user?.email || ''}
          userName={user?.displayName || user?.fullName || ''}
          userPhone={user?.phoneNumber || ''}
          onBack={() => setStep('HOME')}
          onGoSellerHub={() => setStep('PROFILE')}
        />
      )}

      {/* =================================================================== */}
      {/* SELLER HUB PROFILE                                                  */}
      {/* =================================================================== */}
      {step === 'PROFILE' && (
        <ProfileSellerHubPage
          userEmail={user?.email || ''}
          userName={user?.displayName || user?.fullName || ''}
          walletBalanceNgn={walletBalanceNgn}
          onProductChanged={() => loadCatalog()}
          onOpenWallet={() => (onNavigate ? onNavigate('wallet') : onClose())}
          onOpenVendorRegistration={() => {
            setStep('VENDOR_REGISTRATION');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* QUICK MAKE OFFER MODAL */}
      {offerModalProduct && (
        <div
          onClick={() => setOfferModalProduct(null)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleSubmitQuickOffer}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl border-2 border-pink-200 p-5 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-black text-black flex items-center gap-2 mb-0">
                <Handshake className="w-5 h-5 text-[#2563EB]" />
                <span>Make Price Offer</span>
              </h3>
              <button
                type="button"
                onClick={() => setOfferModalProduct(null)}
                className="p-1.5 rounded-lg bg-white border border-pink-200 text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-pink-100">
              <img
                src={offerModalProduct.photos[0]}
                alt={offerModalProduct.name}
                className="w-14 h-14 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-black truncate mb-0.5">{offerModalProduct.name}</p>
                <p className="text-xs font-bold text-[#2563EB] mb-0">
                  Asking Price: {formatNaira(offerModalProduct.price)} • {offerModalProduct.sellerEfadoId}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-black mb-1">Your Offer: &quot;I offer ₦&quot; *</label>
              <input
                type="number"
                required
                min={100}
                value={offerModalAmount}
                onChange={(e) => setOfferModalAmount(e.target.value)}
                placeholder="Enter amount in Naira"
                className="w-full px-4 py-3 rounded-xl border-2 border-pink-200 bg-white text-base font-black text-black tabular-nums focus:border-[#2563EB] outline-none"
              />
              <p className="text-[11px] text-black/65 mt-1 mb-0">
                One Product = One Negotiation At A Time. Your offer locks negotiation while seller responds.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOfferModalProduct(null)}
                className="px-4 py-3 rounded-xl bg-white border border-pink-200 text-black text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={offerModalBusy}
                className="flex-1 py-3 px-5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-black text-xs font-black shadow-sm flex items-center justify-center gap-1.5"
              >
                {offerModalBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Send Offer ({offerModalAmount ? formatNaira(Number(offerModalAmount)) : '₦0'})</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-black text-white text-xs font-extrabold shadow-lg max-w-[90vw] text-center">
          {toastMsg}
        </div>
      )}

      {/* =================================================================== */}
      {/* FIXED BOTTOM NAVIGATION BAR (HOME / MARKET / REELS / CART / ACT / P)*/}
      {/* =================================================================== */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-pink-200 shadow-lg">
        <div className="max-w-[960px] mx-auto grid grid-cols-6">
          <button
            type="button"
            onClick={onClose}
            className="py-2 flex flex-col items-center justify-center gap-0.5 text-[10px] sm:text-[11px] font-bold text-black/65 hover:text-[#2563EB]"
          >
            <Home className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Home</span>
          </button>

          <button
            type="button"
            onClick={() => setStep('HOME')}
            className={`py-2 flex flex-col items-center justify-center gap-0.5 text-[10px] sm:text-[11px] font-bold ${
              step === 'HOME' || step === 'FILTER' || step === 'PRODUCT_DETAIL'
                ? 'text-[#2563EB]'
                : 'text-black/65 hover:text-[#2563EB]'
            }`}
          >
            <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Market</span>
          </button>

          <button
            type="button"
            onClick={() => setStep('REELS')}
            className={`py-2 flex flex-col items-center justify-center gap-0.5 text-[10px] sm:text-[11px] font-bold ${
              step === 'REELS' ? 'text-[#2563EB]' : 'text-black/65 hover:text-[#2563EB]'
            }`}
          >
            <Film className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Reels</span>
          </button>

          <button
            type="button"
            onClick={() => setStep('CART')}
            className={`relative py-2 flex flex-col items-center justify-center gap-0.5 text-[10px] sm:text-[11px] font-bold ${
              step === 'CART' || step === 'DELIVERY' || step === 'PAYMENT' || step === 'AUTHORIZE'
                ? 'text-[#2563EB]'
                : 'text-black/65 hover:text-[#2563EB]'
            }`}
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-[#F59E0B] text-black text-[9px] font-black flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <span>Cart</span>
          </button>

          <button
            type="button"
            onClick={() => setStep('ACTIVITY')}
            className={`py-2 flex flex-col items-center justify-center gap-0.5 text-[10px] sm:text-[11px] font-bold ${
              step === 'ACTIVITY' || step === 'CHAT' || step === 'SUCCESS'
                ? 'text-[#2563EB]'
                : 'text-black/65 hover:text-[#2563EB]'
            }`}
          >
            <Package className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Activity</span>
          </button>

          <button
            type="button"
            onClick={() => setStep('PROFILE')}
            className={`py-2 flex flex-col items-center justify-center gap-0.5 text-[10px] sm:text-[11px] font-bold ${
              step === 'PROFILE' || step === 'VENDOR_REGISTRATION'
                ? 'text-[#2563EB]'
                : 'text-black/65 hover:text-[#2563EB]'
            }`}
          >
            <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default FairlyUsedMarket;
