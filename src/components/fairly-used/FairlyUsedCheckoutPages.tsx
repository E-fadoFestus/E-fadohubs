import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Fingerprint,
  HelpCircle,
  Landmark,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  Minus,
  Package,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Store,
  Trash2,
  Truck,
  Upload,
  Wallet
} from 'lucide-react';
import {
  authorizeFairlyUsedOrder,
  confirmOrderDeliveryEscrow,
  confirmPinResetWithOtp,
  createFairlyUsedOrder,
  fetchOrderTracking,
  formatNaira,
  openOrderDispute,
  payFairlyUsedOrder,
  requestPinResetOtp,
  validateCartStock
} from './fairlyUsedApi';
import type {
  DeliveryMethod,
  FairlyUsedCartItem,
  FairlyUsedOrder,
  FairlyUsedProduct,
  PaymentGatewayId,
  PaymentMethodId
} from '../../types/fairlyUsedMarket';

export function resolveEffectiveUnitPrice(
  item: FairlyUsedCartItem,
  currentUserId?: string
): { unitNgn: number; unitKobo: number; usingAgreedPrice: boolean } {
  const p = item.product;
  const neg = p.activeNegotiation;
  if (
    p.negotiable &&
    neg?.status === 'AGREED' &&
    (!currentUserId || neg.buyerId === currentUserId) &&
    neg.agreedPriceNgn &&
    neg.agreedPriceKobo
  ) {
    return {
      unitNgn: Number(neg.agreedPriceNgn),
      unitKobo: Number(neg.agreedPriceKobo),
      usingAgreedPrice: true
    };
  }
  if (p.negotiable && item.agreedPriceNgn && item.agreedPriceKobo) {
    return {
      unitNgn: Number(item.agreedPriceNgn),
      unitKobo: Number(item.agreedPriceKobo),
      usingAgreedPrice: true
    };
  }
  return {
    unitNgn: Number(p.price),
    unitKobo: Number(p.priceKobo),
    usingAgreedPrice: false
  };
}

export function getCartItemNegotiationBlock(
  prod: FairlyUsedProduct,
  currentUserId?: string
): string | null {
  if (!prod.negotiable) return null;
  const neg = prod.activeNegotiation;
  if (neg && currentUserId && neg.buyerId !== currentUserId) {
    return 'In Negotiation - Please Wait';
  }
  if (!neg || neg.status !== 'AGREED') {
    return 'Please negotiate and agree price first';
  }
  return null;
}

// ============================================================================
// STEP 3: CART (FRESH FULL PAGE — PURPLE-PINK + BLUE + GOLD + BLACK TEXT)
// ============================================================================
interface CartPageProps {
  cart: FairlyUsedCartItem[];
  currentUserId?: string;
  onBack: () => void;
  onUpdateQty: (productId: string, delta: number, selectedColor?: string, selectedSize?: string) => void;
  onRemoveItem: (productId: string, selectedColor?: string, selectedSize?: string) => void;
  onNegotiateItem: (product: FairlyUsedProduct) => void;
  onProceedToDelivery: () => void;
  errorMsg?: string | null;
  checkingStock?: boolean;
}

export const CartPage: React.FC<CartPageProps> = ({
  cart,
  currentUserId,
  onBack,
  onUpdateQty,
  onRemoveItem,
  onNegotiateItem,
  onProceedToDelivery,
  errorMsg,
  checkingStock = false
}) => {
  const subtotalKobo = cart.reduce((acc, item) => {
    const { unitKobo } = resolveEffectiveUnitPrice(item, currentUserId);
    return acc + unitKobo * item.quantity;
  }, 0);
  const serviceChargeKobo = Math.round(subtotalKobo * 0.013);
  const deliveryFeeKobo = cart.reduce(
    (maxFee, item) => (item.product.freeDelivery ? maxFee : Math.max(maxFee, item.product.deliveryFeeKobo)),
    0
  );
  const grandTotalKobo = subtotalKobo + serviceChargeKobo + deliveryFeeKobo;

  const hasStockConflict = cart.some(
    (item) => item.product.status === 'SOLD' || item.product.stock < 1 || item.quantity > item.product.stock
  );
  const negotiationIssue = cart.map((i) => getCartItemNegotiationBlock(i.product, currentUserId)).find(Boolean) || null;

  return (
    <div className="max-w-[900px] mx-auto px-3 sm:px-6 pt-4 pb-36 space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2.5 rounded-xl bg-white border border-pink-200 text-black hover:bg-pink-50 shadow-sm"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-black">Your Fairly Used Cart</h2>
          <p className="text-xs font-medium text-black/70">
            {cart.reduce((s, i) => s + i.quantity, 0)} Fairly Used Item(s) • Agreed Prices Applied
          </p>
        </div>
      </div>

      {/* Escrow Protection Box */}
      <div className="bg-green-50 border border-[#16A34A]/35 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-[#16A34A] text-white flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-extrabold text-[#16A34A] uppercase tracking-wide mb-0.5">
            EFADO Protects Your Money • Secured by EFADO Shield
          </p>
          <p className="text-xs font-medium text-black leading-relaxed mb-0">
            Your money is held safely until you confirm delivery. Seller is NOT paid until you verify the item.
          </p>
        </div>
      </div>

      {(errorMsg || negotiationIssue) && (
        <div className="bg-red-50 border border-[#DC2626]/35 rounded-2xl p-3.5 flex items-center gap-2.5 text-[#DC2626] text-xs font-extrabold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg || negotiationIssue}</span>
        </div>
      )}

      {cart.length === 0 ? (
        <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl border border-pink-200 p-10 text-center space-y-4 shadow-sm">
          <ShoppingBag className="w-12 h-12 text-purple-400 mx-auto" />
          <h3 className="text-lg font-bold text-black">Your Cart Is Empty</h3>
          <p className="text-sm text-black/70">
            Watch working videos, negotiate directly with sellers, and buy safely with EFADO Shield.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 bg-[#F59E0B] hover:bg-[#D97706] text-black rounded-xl font-black text-sm shadow-sm"
          >
            Browse Fairly Used Market
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {cart.map((item) => {
              const p = item.product;
              const isSoldOut = p.status === 'SOLD' || p.stock < 1;
              const exceedsStock = !isSoldOut && item.quantity > p.stock;
              const negBlock = getCartItemNegotiationBlock(p, currentUserId);
              const { unitNgn, usingAgreedPrice } = resolveEffectiveUnitPrice(item, currentUserId);

              return (
                <div
                  key={`${p.id}-${item.selectedColor || ''}-${item.selectedSize || ''}`}
                  className={`bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl border p-4 shadow-sm flex flex-col sm:flex-row gap-4 ${
                    isSoldOut || exceedsStock || negBlock ? 'border-[#DC2626]/45' : 'border-pink-200'
                  }`}
                >
                  <div className="relative w-24 h-24 shrink-0">
                    <img
                      src={p.photos[0]}
                      alt={p.name}
                      className={`w-24 h-24 rounded-xl object-cover bg-white border border-pink-100 ${
                        isSoldOut ? 'grayscale opacity-60' : ''
                      }`}
                    />
                    {isSoldOut && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="px-2 py-0.5 bg-[#DC2626] text-white text-[10px] font-black rounded-md -rotate-6 shadow">
                          SOLD OUT
                        </span>
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-extrabold text-black leading-snug">{p.name}</h3>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(p.id, item.selectedColor, item.selectedSize)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-50 text-[#DC2626] hover:bg-red-100 text-xs font-bold flex items-center gap-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-black/80">
                      <span className="inline-flex items-center gap-1 text-black font-extrabold bg-[#F59E0B]/25 border border-[#F59E0B]/50 px-2 py-0.5 rounded-md">
                        Grade {p.conditionGrade}
                      </span>
                      <span className="font-bold text-[#2563EB]">{p.sellerEfadoId}</span>
                      <span>Seller: {p.sellerName}</span>
                      {usingAgreedPrice && (
                        <span className="px-2 py-0.5 rounded-md bg-green-100 text-[#16A34A] font-extrabold">
                          Agreed Price Applied
                        </span>
                      )}
                    </div>

                    {isSoldOut ? (
                      <p className="text-xs font-extrabold text-[#DC2626] mb-0">
                        Sorry, this item just sold out — remove it to continue checkout.
                      </p>
                    ) : exceedsStock ? (
                      <p className="text-xs font-extrabold text-[#DC2626] mb-0">
                        Only {p.stock} left in stock — reduce quantity to continue.
                      </p>
                    ) : negBlock ? (
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-50 border border-[#F59E0B]/50 rounded-xl p-2.5">
                        <p className="text-xs font-extrabold text-black mb-0">{negBlock}</p>
                        {negBlock !== 'In Negotiation - Please Wait' && (
                          <button
                            type="button"
                            onClick={() => onNegotiateItem(p)}
                            className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-bold flex items-center gap-1"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Chat &amp; Agree Price</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-black/70">
                        Delivery: {p.freeDelivery ? 'FREE' : formatNaira(p.deliveryFee)} • {p.estimatedDelivery} • {p.stock} left
                      </p>
                    )}

                    <div className="pt-1 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-base font-black text-black tabular-nums">
                          {formatNaira(unitNgn * item.quantity)}
                        </span>
                        {usingAgreedPrice && unitNgn !== p.price && (
                          <span className="ml-2 text-xs line-through text-black/45 tabular-nums">
                            {formatNaira(p.price * item.quantity)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 bg-purple-100/70 border border-pink-200 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(p.id, -1, item.selectedColor, item.selectedSize)}
                          className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center shadow-sm hover:bg-pink-50"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-extrabold text-black tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(p.id, 1, item.selectedColor, item.selectedSize)}
                          disabled={isSoldOut || item.quantity >= p.stock}
                          className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center shadow-sm hover:bg-pink-50 disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Safe Exchange Notice */}
          <div className="bg-blue-50 border border-[#2563EB]/25 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <MapPin className="w-5 h-5 text-[#2563EB] shrink-0" />
            <div className="text-xs text-black">
              <span className="font-extrabold text-[#2563EB]">EFADO Safe Meeting Point:</span> Meet At EFADO Office - Delta State, Warri For Safe Exchange (or Doorstep Delivery).
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl border border-pink-200 p-5 shadow-sm space-y-3">
            <h4 className="text-sm font-extrabold text-black">Price Breakdown</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-black/80">
                <span>Subtotal</span>
                <span className="font-bold text-black tabular-nums">{formatNaira(subtotalKobo / 100)}</span>
              </div>
              <div className="flex items-center justify-between text-black/80">
                <span>Delivery</span>
                <span className="font-bold text-[#16A34A] tabular-nums">
                  {deliveryFeeKobo === 0 ? 'FREE' : formatNaira(deliveryFeeKobo / 100)}
                </span>
              </div>
              <div className="flex items-center justify-between text-black/80">
                <span>Service Charge (1.3%)</span>
                <span className="font-bold text-black tabular-nums">
                  {formatNaira(serviceChargeKobo / 100, true)}
                </span>
              </div>
              <div className="pt-3 border-t border-pink-200 flex items-center justify-between">
                <span className="text-base font-extrabold text-black">Grand Total</span>
                <span className="text-xl font-black text-[#2563EB] tabular-nums">
                  {formatNaira(grandTotalKobo / 100, true)}
                </span>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Button */}
          <div className="fixed bottom-16 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-pink-200 px-3 sm:px-6 py-3 shadow-lg">
            <div className="max-w-[900px] mx-auto">
              <button
                type="button"
                disabled={checkingStock || hasStockConflict || Boolean(negotiationIssue)}
                onClick={onProceedToDelivery}
                className="w-full py-3.5 px-6 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 text-black font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {checkingStock && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {hasStockConflict
                    ? 'REMOVE SOLD OUT ITEM TO CONTINUE'
                    : negotiationIssue
                      ? negotiationIssue.toUpperCase()
                      : checkingStock
                        ? 'CHECKING LIVE STOCK...'
                        : 'PROCEED TO DELIVERY'}
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================================
// STEP 4: DELIVERY & PICKUP (DELTA STATE WARRI SAFE EXCHANGE POINT)
// ============================================================================
interface DeliveryPageProps {
  cart: FairlyUsedCartItem[];
  currentUserId?: string;
  defaultName: string;
  defaultPhone: string;
  onBack: () => void;
  onOrderCreated: (order: FairlyUsedOrder) => void;
}

export const DeliveryPage: React.FC<DeliveryPageProps> = ({
  cart,
  currentUserId,
  defaultName,
  defaultPhone,
  onBack,
  onOrderCreated
}) => {
  const pickupOnlyItem = cart.some((c) => c.product.deliveryOption === 'PICKUP_ONLY');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(
    pickupOnlyItem ? 'PICKUP_OFFICE' : 'DELIVERY'
  );
  const [recipientName, setRecipientName] = useState(defaultName);
  const [recipientPhone, setRecipientPhone] = useState(defaultPhone);
  const [stateVal, setStateVal] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [soldOutError, setSoldOutError] = useState(false);

  const subtotalKobo = cart.reduce((acc, item) => {
    const { unitKobo } = resolveEffectiveUnitPrice(item, currentUserId);
    return acc + unitKobo * item.quantity;
  }, 0);
  const deliveryFeeKobo =
    deliveryMethod === 'DELIVERY'
      ? cart.reduce((m, i) => (i.product.freeDelivery ? m : Math.max(m, i.product.deliveryFeeKobo)), 0)
      : 0;
  const serviceChargeKobo = Math.round(subtotalKobo * 0.013);
  const grandTotalKobo = subtotalKobo + serviceChargeKobo + deliveryFeeKobo;

  const primarySeller = cart[0]?.product;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!recipientName.trim() || recipientPhone.trim().length < 7) {
      setErrorMsg('Please enter Recipient Full Name and a valid Phone Number.');
      return;
    }
    if (deliveryMethod === 'DELIVERY' && (!stateVal.trim() || !city.trim() || !street.trim())) {
      setErrorMsg('Please fill in State, City, and Street Address for delivery.');
      return;
    }

    setLoading(true);
    setSoldOutError(false);
    try {
      const res = await createFairlyUsedOrder({
        items: cart.map((c) => ({
          productId: c.product.id,
          quantity: c.quantity,
          selectedColor: c.selectedColor,
          selectedSize: c.selectedSize
        })),
        deliveryMethod,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        address:
          deliveryMethod === 'DELIVERY'
            ? {
                state: stateVal.trim(),
                city: city.trim(),
                street: street.trim(),
                landmark: landmark.trim()
              }
            : null
      });
      onOrderCreated(res.order);
    } catch (err: any) {
      if (err?.code === 'SOLD_OUT' || err?.status === 409) {
        setSoldOutError(true);
        setErrorMsg(err?.message || 'Sorry, this item just sold out');
      } else {
        setErrorMsg(err?.message || 'Could not create order. Please check details and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-[900px] mx-auto px-3 sm:px-6 pt-4 pb-36 space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2.5 rounded-xl bg-white border border-pink-200 text-black hover:bg-pink-50 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-black">Delivery &amp; Pickup - Choose ONE Only</h2>
          <p className="text-xs text-black/70">Select safe delivery or inspect &amp; collect at EFADO Office Warri.</p>
        </div>
      </div>

      {/* 3 Large Radio Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            id: 'DELIVERY' as DeliveryMethod,
            title: 'Deliver To My Address',
            sub: pickupOnlyItem ? 'Seller marked Pickup / Inspect Only' : 'Doorstep Delivery',
            icon: Truck
          },
          {
            id: 'PICKUP_OFFICE' as DeliveryMethod,
            title: 'Meet At EFADO Office - Delta State, Warri',
            sub: 'FREE • For Safe Exchange',
            icon: Building2
          },
          {
            id: 'PICKUP_SELLER' as DeliveryMethod,
            title: 'Pick Up / Inspect With Seller',
            sub: `FREE • ${primarySeller?.sellerLocation || 'Warri, Delta State'}`,
            icon: Store
          }
        ].map((opt) => {
          const Icon = opt.icon;
          const active = deliveryMethod === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setDeliveryMethod(opt.id);
                setErrorMsg(null);
              }}
              className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3 ${
                active
                  ? 'bg-gradient-to-br from-purple-100 via-white to-pink-100 border-[#2563EB] shadow-sm'
                  : 'bg-white border-pink-200 hover:border-purple-400'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  active ? 'bg-[#2563EB] text-white' : 'bg-purple-100 text-[#2563EB]'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-black leading-tight mb-1">{opt.title}</p>
                <p className="text-xs font-medium text-black/70 mb-0">{opt.sub}</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                  active ? 'border-[#2563EB] bg-[#2563EB]' : 'border-slate-300'
                }`}
              >
                {active && <Check className="w-3 h-3 text-white" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Recipient / Address Form */}
      <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl border border-pink-200 p-5 shadow-sm space-y-4">
        {deliveryMethod === 'PICKUP_OFFICE' && (
          <div className="bg-blue-50 border border-[#2563EB]/30 rounded-xl p-3.5 text-xs text-black space-y-1">
            <p className="font-extrabold text-[#2563EB] mb-0.5">Meet At EFADO Office - Delta State, Warri For Safe Exchange</p>
            <p className="mb-0">
              Bring your 6-digit Pickup Code and valid ID. Test the fairly used item at the desk before releasing Escrow.
            </p>
          </div>
        )}
        {deliveryMethod === 'PICKUP_SELLER' && (
          <div className="bg-amber-50 border border-[#F59E0B]/50 rounded-xl p-3.5 text-xs text-black space-y-1">
            <p className="font-extrabold text-black mb-0.5">
              Seller Meetup: {primarySeller?.sellerName} ({primarySeller?.sellerEfadoId})
            </p>
            <p className="mb-0">
              Location: {primarySeller?.sellerLocation} • We recommend meeting at EFADO Office - Delta State, Warri For Safe Exchange.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-black mb-1">Recipient Full Name *</label>
            <input
              type="text"
              required
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. Chinedu Okafor"
              className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-black text-sm font-medium focus:border-[#2563EB] outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-black mb-1">Phone Number *</label>
            <input
              type="tel"
              required
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="e.g. 0803 000 0000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-black text-sm font-medium focus:border-[#2563EB] outline-none"
            />
          </div>
        </div>

        {deliveryMethod === 'DELIVERY' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-black mb-1">State *</label>
                <input
                  type="text"
                  required
                  value={stateVal}
                  onChange={(e) => setStateVal(e.target.value)}
                  placeholder="e.g. Delta State"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-black text-sm font-medium focus:border-[#2563EB] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Warri"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-black text-sm font-medium focus:border-[#2563EB] outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-black mb-1">Street Address *</label>
              <input
                type="text"
                required
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="House number and street name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-black text-sm font-medium focus:border-[#2563EB] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-black mb-1">Landmark (Optional)</label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="Near popular bus stop, junction, or estate gate"
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-black text-sm font-medium focus:border-[#2563EB] outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-[#16A34A]/30 rounded-xl p-3 text-xs font-bold text-[#16A34A]">
            Your 6-digit Pickup Code will be issued after payment. Bring code + ID to inspect &amp; collect safely.
          </div>
        )}
      </div>

      <div className="bg-purple-50 border border-pink-200 rounded-xl p-3.5 flex items-center gap-2.5 text-xs font-bold text-black">
        <MapPin className="w-4 h-4 text-[#2563EB] shrink-0" />
        <span>Check details carefully — Delivery address cannot be changed after payment.</span>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-[#DC2626]/30 rounded-xl p-3.5 text-xs font-bold text-[#DC2626] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          {soldOutError && (
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1.5 rounded-lg bg-[#DC2626] text-white text-xs font-bold"
            >
              Return to Cart
            </button>
          )}
        </div>
      )}

      {/* Price Breakdown */}
      <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl border border-pink-200 p-4 shadow-sm space-y-2 text-sm">
        <div className="flex justify-between text-black/80">
          <span>Subtotal</span>
          <span className="font-bold text-black tabular-nums">{formatNaira(subtotalKobo / 100)}</span>
        </div>
        <div className="flex justify-between text-black/80">
          <span>Delivery</span>
          <span className="font-bold text-[#16A34A] tabular-nums">
            {deliveryFeeKobo === 0 ? 'FREE' : formatNaira(deliveryFeeKobo / 100)}
          </span>
        </div>
        <div className="flex justify-between text-black/80">
          <span>Service Charge (1.3%)</span>
          <span className="font-bold text-black tabular-nums">{formatNaira(serviceChargeKobo / 100, true)}</span>
        </div>
        <div className="pt-2 border-t border-pink-200 flex justify-between items-center">
          <span className="font-extrabold text-black">Total to Pay</span>
          <span className="text-lg font-black text-[#2563EB] tabular-nums">
            {formatNaira(grandTotalKobo / 100, true)}
          </span>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-pink-200 px-3 sm:px-6 py-3 shadow-lg">
        <div className="max-w-[900px] mx-auto">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-60 text-black font-black text-sm rounded-xl shadow-md flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>PROCEED TO PAYMENT</span>
          </button>
        </div>
      </div>
    </form>
  );
};

// ============================================================================
// STEP 5: PAYMENT METHOD SELECTION (FRESH FULL PAGE)
// ============================================================================
interface PaymentPageProps {
  order: FairlyUsedOrder;
  walletBalanceNgn: number;
  selectedMethod: PaymentMethodId;
  selectedGateway: PaymentGatewayId;
  onSelectPayment: (method: PaymentMethodId, gateway: PaymentGatewayId) => void;
  onBack: () => void;
  onBackToCart: () => void;
  onProceedToAuthorize: () => void;
  onFundWallet: () => void;
}

export const PaymentPage: React.FC<PaymentPageProps> = ({
  order,
  walletBalanceNgn,
  selectedMethod,
  selectedGateway,
  onSelectPayment,
  onBack,
  onBackToCart,
  onProceedToAuthorize,
  onFundWallet
}) => {
  const [checkingStock, setCheckingStock] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const walletSufficient = walletBalanceNgn >= order.grandTotal;
  const cannotPaySelected = selectedMethod === 'wallet' && !walletSufficient;

  const handleContinueToAuthorize = async () => {
    setStockError(null);
    setCheckingStock(true);
    try {
      const checkItems =
        Array.isArray(order.items) && order.items.length > 0
          ? order.items.map((it) => ({ productId: it.productId, quantity: it.quantity || 1 }))
          : [{ productId: order.productId, quantity: order.quantity || 1 }];
      const stockRes = await validateCartStock(checkItems);
      if (!stockRes.allAvailable) {
        setStockError(stockRes.blockedMessage || 'Sorry, this item just sold out');
        return;
      }
      onProceedToAuthorize();
    } catch {
      onProceedToAuthorize();
    } finally {
      setCheckingStock(false);
    }
  };

  const deliveryLabel =
    order.deliveryMethod === 'PICKUP_OFFICE'
      ? 'Meet At EFADO Office - Delta State, Warri'
      : order.deliveryMethod === 'PICKUP_SELLER'
        ? 'Pick Up / Inspect With Seller'
        : `Deliver To: ${order.address?.street}, ${order.address?.city}, ${order.address?.state}`;

  return (
    <div className="max-w-[900px] mx-auto px-3 sm:px-6 pt-4 pb-36 space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2.5 rounded-xl bg-white border border-pink-200 text-black hover:bg-pink-50 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-black tabular-nums">
            Secure Checkout - Pay {formatNaira(order.grandTotal, true)}
          </h2>
          <p className="text-xs text-black/70">Order {order.orderId} • Choose your preferred payment method</p>
        </div>
      </div>

      {/* Green Shield Box */}
      <div className="bg-green-50 border border-[#16A34A]/35 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-[#16A34A] text-white flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-extrabold text-[#16A34A] uppercase tracking-wide mb-0.5">
            EFADO Protects Your Money • Secured by EFADO Shield
          </p>
          <p className="text-xs font-medium text-black mb-0">
            Your money is held safely until you confirm delivery of your fairly used item.
          </p>
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl border border-pink-200 p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between border-b border-pink-100 pb-2">
          <span className="text-xs font-bold text-black/60 uppercase">Order Summary</span>
          <span className="text-xs font-extrabold text-[#2563EB] tabular-nums">{order.orderId}</span>
        </div>
        <div className="text-xs text-black space-y-1">
          <p className="mb-0">
            <strong>Product:</strong> {order.productName} (Qty {order.quantity})
          </p>
          <p className="mb-0 flex items-center gap-1">
            <strong>Seller:</strong> {order.sellerName} ({order.sellerEfadoId || 'EFADO'})
            <BadgeCheck className="w-3.5 h-3.5 text-[#16A34A] inline" />
          </p>
          <p className="mb-0">
            <strong>Delivery:</strong> {deliveryLabel}
          </p>
          <p className="mb-0">
            <strong>Recipient:</strong> {order.recipientName} ({order.recipientPhone})
          </p>
        </div>
      </div>

      {/* 4 Open Payment Options */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-black">Choose Payment Method</h3>

        {/* 1. Card */}
        <div
          onClick={() => onSelectPayment('card', selectedGateway === 'flutterwave' ? 'flutterwave' : 'paystack')}
          className={`bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all shadow-sm ${
            selectedMethod === 'card' ? 'border-[#2563EB] bg-purple-50/50' : 'border-pink-200 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#2563EB] flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-black mb-0">Card (Visa, Mastercard, Verve)</p>
                <p className="text-xs text-black/65 mb-0">Pay instantly via Paystack or Flutterwave</p>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedMethod === 'card' ? 'border-[#2563EB] bg-[#2563EB]' : 'border-slate-300'
              }`}
            >
              {selectedMethod === 'card' && <Check className="w-3 h-3 text-white" />}
            </div>
          </div>
          {selectedMethod === 'card' && (
            <div className="mt-3 pt-3 border-t border-pink-100 flex gap-2">
              {(['paystack', 'flutterwave'] as PaymentGatewayId[]).map((gw) => (
                <button
                  key={gw}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPayment('card', gw);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize border ${
                    selectedGateway === gw
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'bg-white text-black border-pink-200'
                  }`}
                >
                  {gw === 'paystack' ? 'Paystack Checkout' : 'Flutterwave Checkout'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. Bank Transfer */}
        <button
          type="button"
          onClick={() => onSelectPayment('bank', 'paystack')}
          className={`w-full text-left bg-white rounded-2xl border-2 p-4 transition-all shadow-sm flex items-center justify-between gap-3 ${
            selectedMethod === 'bank' ? 'border-[#2563EB] bg-purple-50/50' : 'border-pink-200 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#2563EB] flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-black mb-0">Bank Transfer</p>
              <p className="text-xs text-black/65 mb-0">Transfer to verified EFADO checkout account, auto-confirmed</p>
            </div>
          </div>
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selectedMethod === 'bank' ? 'border-[#2563EB] bg-[#2563EB]' : 'border-slate-300'
            }`}
          >
            {selectedMethod === 'bank' && <Check className="w-3 h-3 text-white" />}
          </div>
        </button>

        {/* 3. OPAY / PalmPay / Kuda / Mobile Money */}
        <button
          type="button"
          onClick={() => onSelectPayment('opay', 'opay')}
          className={`w-full text-left bg-white rounded-2xl border-2 p-4 transition-all shadow-sm flex items-center justify-between gap-3 ${
            selectedMethod === 'opay' ? 'border-[#2563EB] bg-purple-50/50' : 'border-pink-200 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#2563EB] flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-black mb-0">OPAY / PalmPay / Kuda / Mobile Money</p>
              <p className="text-xs text-black/65 mb-0">Pay via OPay, PalmPay, Kuda transfer or Mobile Money</p>
            </div>
          </div>
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selectedMethod === 'opay' ? 'border-[#2563EB] bg-[#2563EB]' : 'border-slate-300'
            }`}
          >
            {selectedMethod === 'opay' && <Check className="w-3 h-3 text-white" />}
          </div>
        </button>

        {/* 4. EFADO Wallet */}
        <div
          onClick={() => onSelectPayment('wallet', 'wallet')}
          className={`bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all shadow-sm ${
            selectedMethod === 'wallet'
              ? 'border-[#2563EB] bg-purple-50/50'
              : 'border-pink-200 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#2563EB] flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-black mb-0">EFADO Wallet (1-Click Pay)</p>
                <p className="text-xs text-black/80 mb-0 tabular-nums">
                  Available Balance:{' '}
                  <strong className={walletSufficient ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                    {formatNaira(walletBalanceNgn, true)}
                  </strong>
                </p>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedMethod === 'wallet' ? 'border-[#2563EB] bg-[#2563EB]' : 'border-slate-300'
              }`}
            >
              {selectedMethod === 'wallet' && <Check className="w-3 h-3 text-white" />}
            </div>
          </div>

          {!walletSufficient && (
            <div className="mt-3 pt-3 border-t border-pink-100 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#DC2626]">
                Insufficient balance - Fund Wallet or choose Card above
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFundWallet();
                }}
                className="px-3 py-1.5 rounded-lg bg-[#F59E0B] text-black text-xs font-extrabold hover:bg-[#D97706]"
              >
                Fund Wallet
              </button>
            </div>
          )}
        </div>
      </div>

      {stockError && (
        <div className="bg-red-50 border border-[#DC2626]/30 rounded-xl p-3.5 text-xs font-bold text-[#DC2626] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{stockError}</span>
          </div>
          <button
            type="button"
            onClick={onBackToCart}
            className="px-3 py-1.5 rounded-lg bg-[#DC2626] text-white text-xs font-bold"
          >
            Back to Cart
          </button>
        </div>
      )}

      <p className="text-center text-xs text-black/60 pt-2">
        <Lock className="w-3.5 h-3.5 inline mr-1 text-[#16A34A]" />
        Protected by 256-bit encryption • Secured by EFADO Shield
      </p>

      <div className="fixed bottom-16 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-pink-200 px-3 sm:px-6 py-3 shadow-lg">
        <div className="max-w-[900px] mx-auto">
          <button
            type="button"
            disabled={cannotPaySelected || checkingStock || Boolean(stockError)}
            onClick={handleContinueToAuthorize}
            className="w-full py-3.5 px-6 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 text-black font-black text-sm rounded-xl shadow-md tabular-nums flex items-center justify-center gap-2"
          >
            {checkingStock && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>
              {checkingStock
                ? 'CHECKING AVAILABILITY...'
                : `PAY ${formatNaira(order.grandTotal, true)} - SECURED BY EFADO`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// STEP 6: AUTHORIZE TRANSACTION (FRESH FULL PAGE)
// ============================================================================
interface AuthorizePageProps {
  order: FairlyUsedOrder;
  paymentMethod: PaymentMethodId;
  paymentGateway: PaymentGatewayId;
  hasPin: boolean;
  biometricEnabled: boolean;
  onBackToPayment: () => void;
  onCancelToMarket: () => void;
  onPinUpdated: () => void;
  onSuccessWallet: (paidOrder: FairlyUsedOrder) => void;
}

export const AuthorizePage: React.FC<AuthorizePageProps> = ({
  order,
  paymentMethod,
  paymentGateway,
  hasPin,
  biometricEnabled,
  onBackToPayment,
  onCancelToMarket,
  onPinUpdated,
  onSuccessWallet
}) => {
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpNotice, setOtpNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showResetPin, setShowResetPin] = useState(!hasPin);
  const [resetOtpSentMsg, setResetOtpSentMsg] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPin, setResetNewPin] = useState('');
  const [resetBusy, setResetBusy] = useState(false);

  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  useEffect(() => {
    setShowResetPin(!hasPin);
  }, [hasPin]);

  const handleDigitChange = (idx: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    if (clean.length > 1) {
      const next = [...pinDigits];
      for (let k = 0; k < 4 - idx && k < clean.length; k++) {
        next[idx + k] = clean[k];
      }
      setPinDigits(next);
      setErrorMsg(null);
      const targetFocus = Math.min(3, idx + clean.length);
      pinRefs[targetFocus].current?.focus();
      return;
    }
    const d = clean.slice(-1);
    const next = [...pinDigits];
    next[idx] = d;
    setPinDigits(next);
    setErrorMsg(null);
    if (d && idx < 3) {
      pinRefs[idx + 1].current?.focus();
    }
  };

  const handleDigitKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[idx] && idx > 0) {
      pinRefs[idx - 1].current?.focus();
    }
  };

  const methodLabel =
    paymentMethod === 'wallet'
      ? 'EFADO Wallet'
      : paymentMethod === 'opay'
        ? 'OPAY / Mobile Money'
        : paymentMethod === 'bank'
          ? 'Bank Transfer (Paystack)'
          : `Card (${paymentGateway === 'flutterwave' ? 'Flutterwave' : 'Paystack'})`;

  const handleConfirmPay = async () => {
    const pin = pinDigits.join('');
    if (!/^\d{4}$/.test(pin)) {
      setErrorMsg('Please enter your 4-digit EFADO Transaction PIN.');
      return;
    }
    if (otpRequired && !/^\d{6}$/.test(otpCode.trim())) {
      setErrorMsg('Please enter the 6-digit verification code sent to your Email / SMS.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const authRes = await authorizeFairlyUsedOrder(order.orderId, pin, otpRequired ? otpCode.trim() : undefined);

      if (authRes.otpRequired && !authRes.authorized) {
        setOtpRequired(true);
        setOtpNotice(
          authRes.message ||
            `Orders above ₦100,000 require your 6-digit SMS/Email verification code (${
              authRes.delivery?.maskedEmail || authRes.delivery?.maskedPhone || 'registered contact'
            }).`
        );
        setSubmitting(false);
        return;
      }

      if (!authRes.authToken) {
        throw new Error('Could not complete security authorization. Try again.');
      }

      const idempotencyKey = `IDEM-FU-${order.orderId}-${Date.now()}`;
      const payRes = await payFairlyUsedOrder({
        orderId: order.orderId,
        paymentMethod,
        gateway: paymentGateway,
        authToken: authRes.authToken,
        idempotencyKey,
        returnOrigin: window.location.origin
      });

      if (payRes.paid && payRes.order) {
        onSuccessWallet(payRes.order);
        return;
      }

      if (payRes.redirectUrl) {
        sessionStorage.setItem(
          'efado_pending_fu_order',
          JSON.stringify({
            orderId: order.orderId,
            reference: payRes.reference,
            gateway: payRes.gateway || paymentGateway
          })
        );
        window.location.href = payRes.redirectUrl;
        return;
      }

      throw new Error('Gateway did not return a payment link.');
    } catch (err: any) {
      const reason = err?.message || 'Transaction could not be completed.';
      setErrorMsg(`Payment failed. Your money was NOT taken. ${reason}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestPinOtp = async () => {
    setResetBusy(true);
    setErrorMsg(null);
    try {
      const res = await requestPinResetOtp();
      setResetOtpSentMsg(res.message);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not send reset code.');
    } finally {
      setResetBusy(false);
    }
  };

  const handleConfirmResetPin = async () => {
    setResetBusy(true);
    setErrorMsg(null);
    try {
      await confirmPinResetWithOtp(resetOtp.trim(), resetNewPin.trim());
      setShowResetPin(false);
      setResetOtp('');
      setResetNewPin('');
      setResetOtpSentMsg('');
      onPinUpdated();
      setPinDigits(['', '', '', '']);
    } catch (err: any) {
      setErrorMsg(err?.message || 'PIN reset failed.');
    } finally {
      setResetBusy(false);
    }
  };

  const handleBiometricPrompt = async () => {
    if (!biometricEnabled) {
      setErrorMsg('Fingerprint / Face ID is not enabled in Wallet Security yet. Enter your 4-digit Transaction PIN above.');
      return;
    }
    setErrorMsg('Please enter your 4-digit EFADO Transaction PIN to confirm this protected purchase.');
  };

  return (
    <div className="max-w-[760px] mx-auto px-3 sm:px-6 pt-4 pb-28 space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBackToPayment}
          className="p-2.5 rounded-xl bg-white border border-pink-200 text-black hover:bg-pink-50 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-black">Authorize Transaction</h2>
          <p className="text-xs text-black/70">EFADO Protects Your Money — your money is held safely until delivery</p>
        </div>
      </div>

      {/* Order Verification Card */}
      <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl border border-pink-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-pink-100 pb-3">
          <div>
            <p className="text-xs font-bold text-black/60 uppercase mb-0">Order Total (NGN)</p>
            <p className="text-2xl font-black text-[#2563EB] tabular-nums mb-0">
              {formatNaira(order.grandTotal, true)}
            </p>
          </div>
          <span className="px-3 py-1 rounded-lg bg-green-50 text-[#16A34A] text-xs font-bold flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            Secured by EFADO Shield
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-black">
          <p className="mb-0">
            <strong>Product:</strong> {order.productName}
          </p>
          <p className="mb-0">
            <strong>Seller:</strong> {order.sellerName} ✓
          </p>
          <p className="mb-0">
            <strong>Recipient:</strong> {order.recipientName}
          </p>
          <p className="mb-0">
            <strong>Pay From:</strong> {methodLabel}
          </p>
        </div>
      </div>

      {/* Real 4-Digit PIN Entry */}
      <div className="bg-white rounded-2xl border border-pink-200 p-5 shadow-sm space-y-4">
        <div className="text-center space-y-1">
          <div className="w-11 h-11 rounded-2xl bg-purple-100 text-[#2563EB] flex items-center justify-center mx-auto mb-2">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-black">Enter your EFADO Transaction PIN</h3>
          <p className="text-xs text-black/70 max-w-md mx-auto">
            The 4-digit PIN you set in Security. Never share it with anyone.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 py-2">
          {pinDigits.map((digit, i) => (
            <input
              key={i}
              ref={pinRefs[i]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleDigitKeyDown(i, e)}
              className="w-14 h-14 text-center text-2xl font-black tabular-nums rounded-2xl border-2 border-pink-200 focus:border-[#2563EB] bg-purple-50/40 text-black outline-none transition-all"
              aria-label={`PIN digit ${i + 1}`}
            />
          ))}
        </div>

        {otpRequired && (
          <div className="bg-purple-50 border border-pink-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-[#2563EB] mb-0">{otpNotice}</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit SMS / Email OTP"
              className="w-full px-4 py-3 rounded-xl border border-pink-300 bg-white text-center text-lg font-extrabold tracking-widest tabular-nums text-black outline-none focus:border-[#2563EB]"
            />
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-50 border border-[#DC2626]/30 rounded-xl p-3.5 space-y-2">
            <div className="flex items-start gap-2 text-xs font-bold text-[#DC2626]">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirmPay}
                className="px-3 py-1.5 rounded-lg bg-[#DC2626] text-white text-xs font-bold"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={onBackToPayment}
                className="px-3 py-1.5 rounded-lg bg-white border border-pink-200 text-black text-xs font-bold"
              >
                Change Payment Method
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleConfirmPay}
            disabled={submitting}
            className="w-full py-3.5 px-5 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-60 text-black font-black text-sm rounded-xl shadow-md flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{otpRequired ? 'VERIFY OTP & PAY' : 'CONFIRM & PAY'}</span>
          </button>
          <button
            type="button"
            onClick={onCancelToMarket}
            disabled={submitting}
            className="w-full py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-black font-bold text-sm rounded-xl"
          >
            CANCEL
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-pink-100 text-xs">
          <button
            type="button"
            onClick={() => setShowResetPin(!showResetPin)}
            className="text-[#2563EB] font-bold hover:underline flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{hasPin ? 'Forgot PIN? Reset with OTP' : 'Set Your 4-Digit PIN with OTP'}</span>
          </button>
          <button
            type="button"
            onClick={handleBiometricPrompt}
            className="text-black font-bold hover:text-[#2563EB] flex items-center gap-1"
          >
            <Fingerprint className="w-4 h-4 text-[#2563EB]" />
            <span>Use Fingerprint / Face ID Instead</span>
          </button>
        </div>

        {showResetPin && (
          <div className="bg-purple-50 border border-pink-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-extrabold text-black mb-0">
              {hasPin ? 'Reset Transaction PIN via Email/SMS OTP' : 'Create Your 4-Digit Transaction PIN via OTP'}
            </p>
            <button
              type="button"
              onClick={handleRequestPinOtp}
              disabled={resetBusy}
              className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-bold"
            >
              {resetBusy ? 'Sending OTP...' : 'Send 6-Digit OTP to Email / SMS'}
            </button>
            {resetOtpSentMsg && <p className="text-xs font-bold text-[#16A34A] mb-0">{resetOtpSentMsg}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={resetOtp}
                onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit OTP code"
                className="px-3 py-2 rounded-lg border border-pink-200 bg-white text-sm font-bold text-black"
              />
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={resetNewPin}
                onChange={(e) => setResetNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="New 4-digit PIN"
                className="px-3 py-2 rounded-lg border border-pink-200 bg-white text-sm font-bold text-black"
              />
            </div>
            <button
              type="button"
              onClick={handleConfirmResetPin}
              disabled={resetBusy || resetOtp.length !== 6 || resetNewPin.length !== 4}
              className="px-4 py-2 rounded-lg bg-[#16A34A] disabled:opacity-50 text-white text-xs font-bold"
            >
              Save New 4-Digit PIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// STEP 7: PAYMENT SUCCESS + TRACKING + ESCROW RELEASE / DISPUTE
// ============================================================================
interface SuccessPageProps {
  order: FairlyUsedOrder;
  onOrderUpdated: (updated: FairlyUsedOrder) => void;
  onViewOrders: () => void;
  onContinueShopping: () => void;
}

const TIMELINE_STEPS = [
  { key: 'ORDERED', label: 'Ordered' },
  { key: 'PAID', label: 'Paid' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out For Delivery' },
  { key: 'DELIVERED', label: 'Delivered / Picked Up' }
];

export const SuccessPage: React.FC<SuccessPageProps> = ({
  order,
  onOrderUpdated,
  onViewOrders,
  onContinueShopping
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputePhotos, setDisputePhotos] = useState<string[]>([]);
  const [disputeLinkInput, setDisputeLinkInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshingTrack, setRefreshingTrack] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [scrollToTrack, setScrollToTrack] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (scrollToTrack && trackRef.current) {
      trackRef.current.scrollIntoView({ behavior: 'smooth' });
      setScrollToTrack(false);
    }
  }, [scrollToTrack]);

  const currentStepIndex = (() => {
    if (order.status === 'COMPLETED' || order.status === 'DELIVERED') return 4;
    if (order.status === 'OUT_FOR_DELIVERY') return 3;
    if (order.status === 'SHIPPED') return 2;
    if (order.status === 'PAID_ESCROW_HELD') return 1;
    return 0;
  })();

  const autoReleaseCountdownLabel = (() => {
    if (order.escrowStatus !== 'HELD' || order.status === 'DISPUTED') return null;
    const targetIso =
      order.autoReleaseAt ||
      new Date(
        new Date(order.deliveredAt || order.escrowHeldAt || order.createdAt || Date.now()).getTime() +
          48 * 60 * 60 * 1000
      ).toISOString();
    const diffMs = Math.max(0, new Date(targetIso).getTime() - nowMs);
    if (diffMs <= 0) return 'Auto-release ready (0h 00m)';
    const totalMin = Math.floor(diffMs / 60_000);
    const hrs = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    return `Auto-release in ${hrs}h ${String(mins).padStart(2, '0')}m`;
  })();

  const originalMethodLabel = (() => {
    if (order.refundChannel) return order.refundChannel;
    if (order.paymentMethod === 'bank') return 'Original Bank Account';
    if (order.paymentMethod === 'opay') return 'Original OPay Account';
    if (order.paymentMethod === 'wallet') return 'Original EFADO Wallet';
    return 'Original Payment Card';
  })();

  const handleTrackOrderRefresh = async () => {
    setScrollToTrack(true);
    setRefreshingTrack(true);
    try {
      const res = await fetchOrderTracking(order.orderId);
      if (res.order) onOrderUpdated(res.order);
    } catch {
      // ignore
    } finally {
      setRefreshingTrack(false);
    }
  };

  const handleReleaseEscrow = async () => {
    if (!/^\d{4}$/.test(confirmPin.trim())) {
      setMsg({ type: 'err', text: 'Enter your 4-digit EFADO Transaction PIN to release payment.' });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await confirmOrderDeliveryEscrow(order.orderId, confirmPin.trim());
      onOrderUpdated(res.order);
      setShowConfirmModal(false);
      setConfirmPin('');
      setMsg({ type: 'ok', text: res.message });
    } catch (err: any) {
      setMsg({ type: 'err', text: err?.message || 'Could not confirm delivery.' });
    } finally {
      setBusy(false);
    }
  };

  const handleDisputePhotoUpload = (files?: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files)
      .slice(0, Math.max(0, 4 - disputePhotos.length))
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const raw = String(reader.result || '');
          const img = new Image();
          img.onload = () => {
            const maxSide = 760;
            const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(img.width * scale));
            canvas.height = Math.max(1, Math.round(img.height * scale));
            const ctx = canvas.getContext('2d');
            const compressed = ctx
              ? (ctx.drawImage(img, 0, 0, canvas.width, canvas.height), canvas.toDataURL('image/jpeg', 0.65))
              : raw;
            setDisputePhotos((prev) => (prev.length < 4 ? [...prev, compressed] : prev));
          };
          img.src = raw;
        };
        reader.readAsDataURL(file);
      });
  };

  const handleAddDisputeLink = () => {
    const clean = disputeLinkInput.trim();
    if (!clean) return;
    setDisputePhotos((prev) => (prev.length < 4 ? [...prev, clean] : prev));
    setDisputeLinkInput('');
  };

  const handleOpenDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disputeReason.trim().length < 6) {
      setMsg({ type: 'err', text: 'Please describe what went wrong (at least 6 characters).' });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const photosToSend = disputeLinkInput.trim()
        ? [...disputePhotos, disputeLinkInput.trim()].slice(0, 4)
        : disputePhotos.slice(0, 4);
      const res = await openOrderDispute(order.orderId, disputeReason.trim(), photosToSend);
      onOrderUpdated(res.order);
      setShowDisputeForm(false);
      setDisputePhotos([]);
      setDisputeLinkInput('');
      setMsg({
        type: 'ok',
        text: 'Dispute opened. Your money is held safely while EFADO Support reviews. Any refund returns to your original payment method.'
      });
    } catch (err: any) {
      setMsg({ type: 'err', text: err?.message || 'Could not submit report.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[900px] mx-auto px-3 sm:px-6 pt-5 pb-32 space-y-5">
      {/* Big Green Tick Header */}
      <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl border border-green-300 p-5 sm:p-6 text-center shadow-sm space-y-3">
        <div className="w-16 h-16 rounded-full bg-green-100 text-[#16A34A] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-black">
          {order.status === 'COMPLETED'
            ? 'Delivery Confirmed!'
            : order.status === 'DISPUTED'
              ? 'Dispute Submitted - Money Frozen Safely'
              : order.status === 'REFUNDED'
                ? 'Full Refund Sent To Your Original Payment Method'
                : 'Payment Successful!'}
        </h2>
        <p className="text-xs sm:text-sm text-black/80 max-w-lg mx-auto mb-0">
          Order ID: <strong className="text-black">{order.orderId}</strong> • Amount:{' '}
          <strong className="text-[#2563EB] tabular-nums">{formatNaira(order.grandTotal, true)}</strong>
        </p>
        <p className="text-xs font-bold text-[#16A34A] mb-0">
          Your money is held safely until you confirm delivery.
        </p>

        {order.pickupCode && (
          <div className="inline-block bg-amber-50 border-2 border-[#F59E0B] rounded-2xl px-6 py-3 mt-1">
            <p className="text-[11px] font-bold text-black uppercase tracking-wider mb-0.5">
              Pickup Code (6 Digits)
            </p>
            <p className="text-3xl font-black text-black tracking-[0.25em] tabular-nums mb-0">
              {order.pickupCode}
            </p>
          </div>
        )}
      </div>

      {/* EFADO Shield Escrow Status + 48h Auto-Release Banner */}
      {order.escrowStatus === 'HELD' && order.status !== 'DISPUTED' && (
        <div className="bg-green-50 border border-[#16A34A]/35 rounded-2xl p-4 space-y-2">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-[#16A34A] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-xs font-extrabold text-black mb-0">
                EFADO Protects Your Money • Secured by EFADO Shield
              </p>
              <p className="text-xs font-medium text-black/80 leading-relaxed mb-0">
                Your money is held safely until you confirm delivery ({formatNaira(order.grandTotal, true)}).
              </p>
            </div>
          </div>
          {autoReleaseCountdownLabel && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-pink-200 text-xs font-extrabold text-[#2563EB] tabular-nums">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{autoReleaseCountdownLabel}</span>
            </div>
          )}
        </div>
      )}

      {order.status === 'DISPUTED' && (
        <div className="bg-red-50 border border-[#DC2626]/30 rounded-2xl p-4 space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-extrabold text-[#DC2626] mb-0">
                Dispute Open — Money Held Safely By EFADO
              </p>
              <p className="text-xs text-black mb-0">Reason: {order.disputeReason}</p>
              <p className="text-[11px] text-black/75 mb-0">
                Approved refunds return automatically to your original payment method ({originalMethodLabel}).
              </p>
            </div>
          </div>
          {Array.isArray(order.disputePhotos) && order.disputePhotos.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {order.disputePhotos.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`Evidence ${i + 1}`}
                  className="w-16 h-16 rounded-lg object-cover border border-red-200 bg-white"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {order.status === 'REFUNDED' && (
        <div className="bg-green-50 border border-[#16A34A]/30 rounded-2xl p-4 flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-extrabold text-[#16A34A] mb-0">
              Refund Processed — {formatNaira(order.grandTotal, true)}
            </p>
            <p className="text-xs text-black mb-0">
              Refunded back to your <strong>{originalMethodLabel}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Order Summary Details Card */}
      <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl border border-pink-200 p-4 shadow-sm flex gap-4 items-center">
        <img
          src={order.productPhoto}
          alt={order.productName}
          className="w-20 h-20 rounded-xl object-cover border border-pink-100 shrink-0"
        />
        <div className="flex-1 min-w-0 text-xs text-black space-y-1">
          <h3 className="text-sm font-extrabold text-black truncate mb-0">{order.productName}</h3>
          <p className="mb-0">
            Seller: <strong>{order.sellerName}</strong> ({order.sellerEfadoId || 'EFADO'}) • Qty {order.quantity} •{' '}
            <strong className="text-[#2563EB] tabular-nums">{formatNaira(order.grandTotal, true)}</strong>
          </p>
          <p className="mb-0">
            Delivery Method:{' '}
            <strong>
              {order.deliveryMethod === 'PICKUP_OFFICE'
                ? 'EFADO Office Warri Safe Exchange'
                : order.deliveryMethod === 'PICKUP_SELLER'
                  ? 'Seller Pickup / Inspection'
                  : 'Home Delivery'}
            </strong>{' '}
            • Recipient: {order.recipientName}
          </p>
          {order.pickupLocationLabel && (
            <p className="text-[11px] text-black/65 mb-0">{order.pickupLocationLabel}</p>
          )}
        </div>
      </div>

      {/* Tracking Timeline */}
      <div ref={trackRef} className="bg-white rounded-2xl border border-pink-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold text-black flex items-center gap-2 mb-0">
            <Package className="w-4 h-4 text-[#2563EB]" />
            <span>Tracking Timeline</span>
          </h3>
          <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-[#2563EB] text-xs font-bold">
            {order.status.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="space-y-3">
          {TIMELINE_STEPS.map((st, idx) => {
            const done = order.status !== 'DISPUTED' && order.status !== 'REFUNDED' && idx <= currentStepIndex;
            const current = order.status !== 'DISPUTED' && order.status !== 'REFUNDED' && idx === currentStepIndex;
            const matchedEvent = (order.trackingHistory || []).find((h) => h.step === st.key);
            return (
              <div
                key={st.key}
                className={`flex items-start gap-3 rounded-xl p-2 transition-colors ${
                  current ? 'bg-purple-50 border border-[#2563EB]/30' : ''
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${
                    current
                      ? 'bg-[#2563EB] text-white'
                      : done
                        ? 'bg-[#16A34A] text-white'
                        : 'bg-purple-50 text-black/40 border border-pink-200'
                  }`}
                >
                  {done ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <p
                      className={`text-xs font-bold mb-0 ${
                        current ? 'text-[#2563EB]' : done ? 'text-black' : 'text-black/40'
                      }`}
                    >
                      {st.label}
                      {current ? ' (Current)' : ''}
                    </p>
                    {matchedEvent?.at && (
                      <span className="text-[11px] text-black/50 tabular-nums">
                        {new Date(matchedEvent.at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {matchedEvent?.description && (
                    <p className="text-[11px] text-black/65 mt-0.5 mb-0">{matchedEvent.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {msg && (
        <div
          className={`rounded-xl p-3.5 text-xs font-bold border ${
            msg.type === 'ok'
              ? 'bg-green-50 border-[#16A34A]/30 text-[#16A34A]'
              : 'bg-red-50 border-[#DC2626]/30 text-[#DC2626]'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Buyer Actions */}
      {order.escrowStatus === 'HELD' && order.status !== 'DISPUTED' && (
        <div className="bg-white rounded-2xl border border-pink-200 p-4 shadow-sm space-y-3">
          <h4 className="text-sm font-extrabold text-black mb-0">Buyer Actions</h4>
          <button
            type="button"
            onClick={() => setShowConfirmModal(!showConfirmModal)}
            className="w-full py-3.5 px-4 bg-[#16A34A] hover:bg-green-700 text-white font-extrabold text-sm rounded-xl shadow-sm"
          >
            I Have Received It - Release Money To Seller
          </button>

          {showConfirmModal && (
            <div className="bg-green-50 border border-[#16A34A]/30 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-black mb-0">
                Enter your 4-digit EFADO PIN to release money to {order.sellerName}:
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  onPaste={(e) => {
                    e.preventDefault();
                    setConfirmPin(e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4));
                  }}
                  placeholder="4-digit PIN"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-green-300 bg-white text-center font-extrabold tracking-widest text-black"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleReleaseEscrow}
                  className="px-5 py-2.5 bg-[#16A34A] text-white font-extrabold text-xs rounded-xl"
                >
                  {busy ? 'Releasing...' : 'CONFIRM'}
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowDisputeForm(!showDisputeForm)}
            className="w-full py-3 px-4 bg-white border-2 border-[#DC2626]/40 text-[#DC2626] hover:bg-red-50 font-bold text-xs rounded-xl"
          >
            Report Problem - I Did Not Receive / Wrong Item
          </button>

          {showDisputeForm && (
            <form onSubmit={handleOpenDispute} className="bg-red-50 border border-[#DC2626]/30 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-[#DC2626] mb-0">
                Opening a dispute freezes your money safely. Approved refunds return directly to your{' '}
                {originalMethodLabel}.
              </p>
              <textarea
                rows={3}
                required
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Explain the issue clearly (e.g., item did not match video, undisclosed fault, wrong item)..."
                className="w-full px-3 py-2 rounded-xl border border-red-200 bg-white text-xs text-black"
              />
              <div className="flex flex-wrap items-center gap-2">
                <label className="px-3 py-2 rounded-xl bg-white border border-red-200 text-xs font-bold text-black hover:bg-red-100/40 cursor-pointer flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>Attach Evidence Photos ({disputePhotos.length}/4)</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={disputePhotos.length >= 4}
                    className="hidden"
                    onChange={(e) => handleDisputePhotoUpload(e.target.files)}
                  />
                </label>
              </div>
              {disputePhotos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {disputePhotos.map((src, i) => (
                    <div key={i} className="relative">
                      <img
                        src={src}
                        alt={`Evidence ${i + 1}`}
                        className="w-16 h-16 rounded-lg object-cover border border-red-200 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setDisputePhotos((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#DC2626] text-white text-[10px] font-black flex items-center justify-center"
                        aria-label="Remove photo"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={disputeLinkInput}
                  onChange={(e) => setDisputeLinkInput(e.target.value)}
                  placeholder="Or paste optional photo evidence link"
                  className="flex-1 px-3 py-2 rounded-xl border border-red-200 bg-white text-xs text-black"
                />
                {disputeLinkInput.trim() && (
                  <button
                    type="button"
                    onClick={handleAddDisputeLink}
                    className="px-3 py-2 rounded-xl bg-white border border-red-200 text-xs font-bold text-black"
                  >
                    Add
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={busy}
                className="px-5 py-2.5 bg-[#DC2626] text-white font-bold text-xs rounded-xl"
              >
                {busy ? 'Submitting...' : 'Submit Dispute & Hold Money'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={handleTrackOrderRefresh}
          disabled={refreshingTrack}
          className="py-3 px-4 bg-white border border-pink-200 text-[#2563EB] font-bold text-xs rounded-xl hover:bg-purple-50 flex items-center justify-center gap-1.5"
        >
          <RefreshCw className={`w-4 h-4 ${refreshingTrack ? 'animate-spin' : ''}`} />
          <span>{refreshingTrack ? 'Updating...' : 'Track Order'}</span>
        </button>
        <button
          type="button"
          onClick={onViewOrders}
          className="py-3 px-4 bg-white border border-pink-200 text-black font-bold text-xs rounded-xl hover:bg-purple-50"
        >
          View My Orders
        </button>
        <button
          type="button"
          onClick={onContinueShopping}
          className="py-3 px-4 bg-[#F59E0B] hover:bg-[#D97706] text-black font-black text-xs rounded-xl shadow-sm"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
};
