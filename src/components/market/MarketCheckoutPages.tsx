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
  authorizeMarketplaceOrder,
  confirmOrderDeliveryEscrow,
  confirmPinResetWithOtp,
  createMarketplaceOrder,
  fetchOrderTracking,
  formatNaira,
  openOrderDispute,
  payMarketplaceOrder,
  requestPinResetOtp,
  validateCartStock
} from './marketApi';
import type {
  DeliveryMethod,
  ModernCartItem,
  ModernMarketOrder,
  PaymentGatewayId,
  PaymentMethodId
} from '../../types/modernMarket';

// ============================================================================
// STEP 3: CART (FRESH FULL PAGE)
// ============================================================================
interface CartPageProps {
  cart: ModernCartItem[];
  onBack: () => void;
  onUpdateQty: (productId: string, delta: number, selectedColor?: string, selectedSize?: string) => void;
  onRemoveItem: (productId: string, selectedColor?: string, selectedSize?: string) => void;
  onProceedToDelivery: () => void;
  errorMsg?: string | null;
  checkingStock?: boolean;
}

export const CartPage: React.FC<CartPageProps> = ({
  cart,
  onBack,
  onUpdateQty,
  onRemoveItem,
  onProceedToDelivery,
  errorMsg,
  checkingStock = false
}) => {
  const subtotalKobo = cart.reduce((acc, item) => acc + item.product.priceKobo * item.quantity, 0);
  const serviceChargeKobo = Math.round(subtotalKobo * 0.013);
  const deliveryFeeKobo = cart.reduce(
    (maxFee, item) => (item.product.freeDelivery ? maxFee : Math.max(maxFee, item.product.deliveryFeeKobo)),
    0
  );
  const grandTotalKobo = subtotalKobo + serviceChargeKobo + deliveryFeeKobo;
  const hasStockConflict = cart.some(
    (item) => item.product.status === 'SOLD' || item.product.stock < 1 || item.quantity > item.product.stock
  );

  return (
    <div className="max-w-[900px] mx-auto px-3 sm:px-6 pt-4 pb-36 space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2.5 rounded-xl bg-white border border-purple-200 text-slate-800 hover:bg-purple-50 shadow-sm"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Your Cart</h2>
          <p className="text-xs font-medium text-slate-500">
            {cart.reduce((s, i) => s + i.quantity, 0)} Brand New Sealed Item(s)
          </p>
        </div>
      </div>

      {/* Green Escrow Protection Box */}
      <div className="bg-green-50 border border-[#16A34A]/30 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-[#16A34A] text-white flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-extrabold text-[#16A34A] uppercase tracking-wide mb-0.5">
            EFADO ESCROW PROTECTED
          </p>
          <p className="text-xs font-medium text-slate-700 leading-relaxed mb-0">
            Your money is held by EFADO until you confirm you received the correct product. Seller is NOT paid yet.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-[#DC2626]/30 rounded-2xl p-3.5 flex items-center gap-2.5 text-[#DC2626] text-xs font-bold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {cart.length === 0 ? (
        <div className="bg-white rounded-2xl border border-purple-100 p-10 text-center space-y-4 shadow-sm">
          <ShoppingBag className="w-12 h-12 text-purple-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">Your Cart Is Empty</h3>
          <p className="text-sm text-slate-500">
            Explore brand new, sealed phones, laptops, appliances, and accessories with warranty.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl font-bold text-sm shadow-sm"
          >
            Browse Brand New Market
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {cart.map((item) => {
              const p = item.product;
              const isSoldOut = p.status === 'SOLD' || p.stock < 1;
              const exceedsStock = !isSoldOut && item.quantity > p.stock;
              return (
                <div
                  key={`${p.id}-${item.selectedColor || ''}-${item.selectedSize || ''}`}
                  className={`bg-white rounded-2xl border p-4 shadow-sm flex flex-col sm:flex-row gap-4 ${
                    isSoldOut || exceedsStock ? 'border-[#DC2626]/40 bg-red-50/20' : 'border-purple-100'
                  }`}
                >
                  <div className="relative w-24 h-24 shrink-0">
                    <img
                      src={p.photos[0]}
                      alt={p.name}
                      className={`w-24 h-24 rounded-xl object-cover bg-slate-50 border border-slate-100 ${
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
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{p.name}</h3>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(p.id, item.selectedColor, item.selectedSize)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-50 text-[#DC2626] hover:bg-red-100 text-xs font-bold flex items-center gap-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1 text-[#16A34A] font-bold bg-green-50 px-2 py-0.5 rounded-md">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        Condition: Brand New Sealed
                      </span>
                      <span>Seller: {p.sellerName}</span>
                      {(item.selectedColor || item.selectedSize) && (
                        <span className="text-purple-700 font-semibold">
                          {[item.selectedColor, item.selectedSize].filter(Boolean).join(' • ')}
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
                    ) : (
                      <p className="text-xs text-slate-500">
                        Delivery: {p.freeDelivery ? 'FREE' : formatNaira(p.deliveryFee)} • {p.estimatedDelivery} • {p.stock} in stock
                      </p>
                    )}
                    <div className="pt-1 flex items-center justify-between gap-3">
                      <span className="text-base font-extrabold text-slate-900 tabular-nums">
                        {formatNaira(p.price * item.quantity)}
                      </span>
                      <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(p.id, -1, item.selectedColor, item.selectedSize)}
                          className="w-7 h-7 rounded-lg bg-white text-slate-800 flex items-center justify-center shadow-sm hover:bg-purple-100"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-extrabold text-slate-900 tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(p.id, 1, item.selectedColor, item.selectedSize)}
                          disabled={isSoldOut || item.quantity >= p.stock}
                          className="w-7 h-7 rounded-lg bg-white text-slate-800 flex items-center justify-center shadow-sm hover:bg-purple-100 disabled:opacity-40"
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

          {/* Delivery Preview Summary */}
          <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-sm flex items-center gap-3">
            <Truck className="w-5 h-5 text-[#7C3AED] shrink-0" />
            <div className="text-xs text-slate-700">
              <span className="font-bold text-slate-900">Delivery Preview:</span> Home Delivery (
              {deliveryFeeKobo === 0 ? 'FREE' : formatNaira(deliveryFeeKobo / 100)}) or FREE Pick Up at EFADO Office / Seller Store.
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm space-y-3">
            <h4 className="text-sm font-extrabold text-slate-900">Price Breakdown</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900 tabular-nums">{formatNaira(subtotalKobo / 100)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Delivery</span>
                <span className="font-bold text-[#16A34A] tabular-nums">
                  {deliveryFeeKobo === 0 ? 'FREE' : formatNaira(deliveryFeeKobo / 100)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Service Charge (1.3%)</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatNaira(serviceChargeKobo / 100, true)}
                </span>
              </div>
              <div className="pt-3 border-t border-purple-100 flex items-center justify-between">
                <span className="text-base font-extrabold text-slate-900">Grand Total</span>
                <span className="text-xl font-black text-[#7C3AED] tabular-nums">
                  {formatNaira(grandTotalKobo / 100, true)}
                </span>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Button */}
          <div className="fixed bottom-16 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-purple-100 px-3 sm:px-6 py-3 shadow-lg">
            <div className="max-w-[900px] mx-auto">
              <button
                type="button"
                disabled={checkingStock || hasStockConflict}
                onClick={onProceedToDelivery}
                className="w-full py-3.5 px-6 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {checkingStock && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {hasStockConflict
                    ? 'REMOVE SOLD OUT ITEM TO CONTINUE'
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
// STEP 4: DELIVERY & PICKUP (FRESH FULL PAGE)
// ============================================================================
interface DeliveryPageProps {
  cart: ModernCartItem[];
  defaultName: string;
  defaultPhone: string;
  onBack: () => void;
  onOrderCreated: (order: ModernMarketOrder) => void;
}

export const DeliveryPage: React.FC<DeliveryPageProps> = ({
  cart,
  defaultName,
  defaultPhone,
  onBack,
  onOrderCreated
}) => {
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('DELIVERY');
  const [recipientName, setRecipientName] = useState(defaultName);
  const [recipientPhone, setRecipientPhone] = useState(defaultPhone);
  const [stateVal, setStateVal] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [soldOutError, setSoldOutError] = useState(false);

  const subtotalKobo = cart.reduce((acc, item) => acc + item.product.priceKobo * item.quantity, 0);
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
      const res = await createMarketplaceOrder({
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
          className="p-2.5 rounded-xl bg-white border border-purple-200 text-slate-800 hover:bg-purple-50 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Delivery &amp; Pickup - Choose ONE Only</h2>
          <p className="text-xs text-slate-500">Select how you want to receive your Brand New sealed item(s).</p>
        </div>
      </div>

      {/* 3 Large Radio Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            id: 'DELIVERY' as DeliveryMethod,
            title: 'Deliver To My Address',
            sub: deliveryFeeKobo === 0 && cart.every((c) => c.product.freeDelivery) ? 'FREE Doorstep Delivery' : `Doorstep Delivery`,
            icon: Truck
          },
          {
            id: 'PICKUP_OFFICE' as DeliveryMethod,
            title: 'Pick Up At EFADO Office',
            sub: 'FREE • Verified EFADO Hub',
            icon: Building2
          },
          {
            id: 'PICKUP_SELLER' as DeliveryMethod,
            title: 'Pick Up At Seller Store',
            sub: `FREE • ${primarySeller?.sellerLocation || 'Seller Store'}`,
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
                  ? 'bg-purple-50 border-[#7C3AED] shadow-sm'
                  : 'bg-white border-purple-100 hover:border-purple-300'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  active ? 'bg-[#7C3AED] text-white' : 'bg-purple-50 text-[#7C3AED]'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-slate-900 leading-tight mb-1">{opt.title}</p>
                <p className="text-xs font-medium text-slate-600 mb-0">{opt.sub}</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                  active ? 'border-[#7C3AED] bg-[#7C3AED]' : 'border-slate-300'
                }`}
              >
                {active && <Check className="w-3 h-3 text-white" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Recipient / Address Form */}
      <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm space-y-4">
        {deliveryMethod === 'PICKUP_OFFICE' && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-1">
            <p className="font-extrabold text-[#7C3AED] mb-0.5">EFADO Official Pick-Up Office</p>
            <p className="mb-0">EFADO Hubs Corporate Delivery Desk — Bring your 6-digit Pickup Code and valid ID.</p>
          </div>
        )}
        {deliveryMethod === 'PICKUP_SELLER' && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-1">
            <p className="font-extrabold text-[#7C3AED] mb-0.5">
              Seller Store: {primarySeller?.sellerName || 'Verified Seller'}
            </p>
            <p className="mb-0">Location: {primarySeller?.sellerLocation || 'Lagos, Nigeria'}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Full Name *</label>
            <input
              type="text"
              required
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. Chinedu Okafor"
              className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-slate-900 text-sm font-medium focus:border-[#7C3AED] outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
            <input
              type="tel"
              required
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="e.g. 0803 000 0000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-slate-900 text-sm font-medium focus:border-[#7C3AED] outline-none"
            />
          </div>
        </div>

        {deliveryMethod === 'DELIVERY' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">State *</label>
                <input
                  type="text"
                  required
                  value={stateVal}
                  onChange={(e) => setStateVal(e.target.value)}
                  placeholder="e.g. Lagos"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-slate-900 text-sm font-medium focus:border-[#7C3AED] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Lekki Phase 1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-slate-900 text-sm font-medium focus:border-[#7C3AED] outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Street Address *</label>
              <input
                type="text"
                required
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="House number and street name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-slate-900 text-sm font-medium focus:border-[#7C3AED] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Landmark (Optional)</label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="Near popular bus stop, junction, or estate gate"
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-slate-900 text-sm font-medium focus:border-[#7C3AED] outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-[#16A34A]/30 rounded-xl p-3 text-xs font-bold text-[#16A34A]">
            Pickup Code will be sent after payment. Bring code + ID to pickup.
          </div>
        )}
      </div>

      {/* Single Clean Warning (No Duplicates) */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 flex items-center gap-2.5 text-xs font-bold text-slate-800">
        <MapPin className="w-4 h-4 text-[#7C3AED] shrink-0" />
        <span>Check details carefully - Delivery address cannot be changed after payment.</span>
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
      <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-sm space-y-2 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal</span>
          <span className="font-bold text-slate-900 tabular-nums">{formatNaira(subtotalKobo / 100)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Delivery</span>
          <span className="font-bold text-[#16A34A] tabular-nums">
            {deliveryFeeKobo === 0 ? 'FREE' : formatNaira(deliveryFeeKobo / 100)}
          </span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Service Charge (1.3%)</span>
          <span className="font-bold text-slate-900 tabular-nums">{formatNaira(serviceChargeKobo / 100, true)}</span>
        </div>
        <div className="pt-2 border-t border-purple-100 flex justify-between items-center">
          <span className="font-extrabold text-slate-900">Total to Pay</span>
          <span className="text-lg font-black text-[#7C3AED] tabular-nums">
            {formatNaira(grandTotalKobo / 100, true)}
          </span>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-purple-100 px-3 sm:px-6 py-3 shadow-lg">
        <div className="max-w-[900px] mx-auto">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-60 text-white font-extrabold text-sm rounded-xl shadow-md flex items-center justify-center gap-2"
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
  order: ModernMarketOrder;
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
      ? 'Pick Up At EFADO Office'
      : order.deliveryMethod === 'PICKUP_SELLER'
        ? 'Pick Up At Seller Store'
        : `Deliver To: ${order.address?.street}, ${order.address?.city}, ${order.address?.state}`;

  return (
    <div className="max-w-[900px] mx-auto px-3 sm:px-6 pt-4 pb-36 space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2.5 rounded-xl bg-white border border-purple-200 text-slate-800 hover:bg-purple-50 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tabular-nums">
            Secure Checkout - Pay {formatNaira(order.grandTotal, true)}
          </h2>
          <p className="text-xs text-slate-500">Order {order.orderId} • Choose your preferred payment method</p>
        </div>
      </div>

      {/* Green Shield Box */}
      <div className="bg-green-50 border border-[#16A34A]/30 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-[#16A34A] text-white flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-extrabold text-[#16A34A] uppercase tracking-wide mb-0.5">
            EFADO Protects Your Money
          </p>
          <p className="text-xs font-medium text-slate-700 mb-0">
            Held safely by EFADO until you confirm delivery of your Brand New sealed item.
          </p>
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between border-b border-purple-50 pb-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Order Summary</span>
          <span className="text-xs font-extrabold text-[#7C3AED] tabular-nums">{order.orderId}</span>
        </div>
        <div className="text-xs text-slate-700 space-y-1">
          <p className="mb-0">
            <strong className="text-slate-900">Product:</strong> {order.productName} (Qty {order.quantity})
          </p>
          <p className="mb-0 flex items-center gap-1">
            <strong className="text-slate-900">Seller:</strong> {order.sellerName}
            <BadgeCheck className="w-3.5 h-3.5 text-[#16A34A] inline" />
          </p>
          <p className="mb-0">
            <strong className="text-slate-900">Delivery:</strong> {deliveryLabel}
          </p>
          <p className="mb-0">
            <strong className="text-slate-900">Recipient:</strong> {order.recipientName} ({order.recipientPhone})
          </p>
        </div>
      </div>

      {/* 4 Open Payment Options (Wallet Optional) */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900">Choose Payment Method</h3>

        {/* 1. Card */}
        <div
          onClick={() => onSelectPayment('card', selectedGateway === 'flutterwave' ? 'flutterwave' : 'paystack')}
          className={`bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all shadow-sm ${
            selectedMethod === 'card' ? 'border-[#7C3AED] bg-purple-50/40' : 'border-purple-100 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#7C3AED] flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900 mb-0">Card (Visa, Mastercard, Verve)</p>
                <p className="text-xs text-slate-500 mb-0">Pay instantly via Paystack or Flutterwave</p>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedMethod === 'card' ? 'border-[#7C3AED] bg-[#7C3AED]' : 'border-slate-300'
              }`}
            >
              {selectedMethod === 'card' && <Check className="w-3 h-3 text-white" />}
            </div>
          </div>
          {selectedMethod === 'card' && (
            <div className="mt-3 pt-3 border-t border-purple-100 flex gap-2">
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
                      ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                      : 'bg-white text-slate-700 border-purple-200'
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
            selectedMethod === 'bank' ? 'border-[#7C3AED] bg-purple-50/40' : 'border-purple-100 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#7C3AED] flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900 mb-0">Bank Transfer</p>
              <p className="text-xs text-slate-500 mb-0">Transfer to verified EFADO checkout account, auto-confirmed</p>
            </div>
          </div>
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selectedMethod === 'bank' ? 'border-[#7C3AED] bg-[#7C3AED]' : 'border-slate-300'
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
            selectedMethod === 'opay' ? 'border-[#7C3AED] bg-purple-50/40' : 'border-purple-100 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#7C3AED] flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900 mb-0">OPAY / PalmPay / Kuda / Mobile Money</p>
              <p className="text-xs text-slate-500 mb-0">Pay via OPay, PalmPay, Kuda transfer or Mobile Money</p>
            </div>
          </div>
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selectedMethod === 'opay' ? 'border-[#7C3AED] bg-[#7C3AED]' : 'border-slate-300'
            }`}
          >
            {selectedMethod === 'opay' && <Check className="w-3 h-3 text-white" />}
          </div>
        </button>

        {/* 4. EFADO Wallet (Optional) */}
        <div
          onClick={() => onSelectPayment('wallet', 'wallet')}
          className={`bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all shadow-sm ${
            selectedMethod === 'wallet'
              ? 'border-[#7C3AED] bg-purple-50/40'
              : 'border-purple-100 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#7C3AED] flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900 mb-0">EFADO Wallet (1-Click Pay)</p>
                <p className="text-xs text-slate-600 mb-0 tabular-nums">
                  Available Balance:{' '}
                  <strong className={walletSufficient ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                    {formatNaira(walletBalanceNgn, true)}
                  </strong>
                </p>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedMethod === 'wallet' ? 'border-[#7C3AED] bg-[#7C3AED]' : 'border-slate-300'
              }`}
            >
              {selectedMethod === 'wallet' && <Check className="w-3 h-3 text-white" />}
            </div>
          </div>

          {!walletSufficient && (
            <div className="mt-3 pt-3 border-t border-purple-100 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#DC2626]">
                Insufficient balance - Fund Wallet or choose Card above
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFundWallet();
                }}
                className="px-3 py-1.5 rounded-lg bg-[#7C3AED] text-white text-xs font-bold hover:bg-[#6D28D9]"
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

      <p className="text-center text-xs text-slate-500 pt-2">
        <Lock className="w-3.5 h-3.5 inline mr-1 text-[#16A34A]" />
        Protected by 256-bit encryption • PCI DSS, NDPR, GDPR
      </p>

      <div className="fixed bottom-16 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-purple-100 px-3 sm:px-6 py-3 shadow-lg">
        <div className="max-w-[900px] mx-auto">
          <button
            type="button"
            disabled={cannotPaySelected || checkingStock || Boolean(stockError)}
            onClick={handleContinueToAuthorize}
            className="w-full py-3.5 px-6 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-md tabular-nums flex items-center justify-center gap-2"
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
  order: ModernMarketOrder;
  paymentMethod: PaymentMethodId;
  paymentGateway: PaymentGatewayId;
  hasPin: boolean;
  biometricEnabled: boolean;
  onBackToPayment: () => void;
  onCancelToMarket: () => void;
  onPinUpdated: () => void;
  onSuccessWallet: (paidOrder: ModernMarketOrder) => void;
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

  // Forgot PIN / First-time PIN setup via OTP
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
      const authRes = await authorizeMarketplaceOrder(order.orderId, pin, otpRequired ? otpCode.trim() : undefined);

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

      const idempotencyKey = `IDEM-${order.orderId}-${Date.now()}`;
      const payRes = await payMarketplaceOrder({
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
          'efado_pending_market_order',
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
          className="p-2.5 rounded-xl bg-white border border-purple-200 text-slate-800 hover:bg-purple-50 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Authorize Transaction</h2>
          <p className="text-xs text-slate-500">Verify your identity to protect your money in EFADO Escrow</p>
        </div>
      </div>

      {/* Order Verification Card */}
      <div className="bg-white rounded-2xl border border-purple-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-purple-100 pb-3">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase mb-0">Order Total (NGN)</p>
            <p className="text-2xl font-black text-[#7C3AED] tabular-nums mb-0">
              {formatNaira(order.grandTotal, true)}
            </p>
          </div>
          <span className="px-3 py-1 rounded-lg bg-green-50 text-[#16A34A] text-xs font-bold flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            Escrow Protected
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
          <p className="mb-0">
            <strong className="text-slate-900">Product:</strong> {order.productName}
          </p>
          <p className="mb-0">
            <strong className="text-slate-900">Seller:</strong> {order.sellerName} ✓
          </p>
          <p className="mb-0">
            <strong className="text-slate-900">Recipient:</strong> {order.recipientName}
          </p>
          <p className="mb-0">
            <strong className="text-slate-900">Pay From:</strong> {methodLabel}
          </p>
        </div>
      </div>

      {/* Real 4-Digit PIN Entry */}
      <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm space-y-4">
        <div className="text-center space-y-1">
          <div className="w-11 h-11 rounded-2xl bg-purple-100 text-[#7C3AED] flex items-center justify-center mx-auto mb-2">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">Enter your EFADO Transaction PIN</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
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
              className="w-14 h-14 text-center text-2xl font-black tabular-nums rounded-2xl border-2 border-purple-200 focus:border-[#7C3AED] bg-purple-50/40 text-slate-900 outline-none transition-all"
              aria-label={`PIN digit ${i + 1}`}
            />
          ))}
        </div>

        {otpRequired && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-[#7C3AED] mb-0">{otpNotice}</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit SMS / Email OTP"
              className="w-full px-4 py-3 rounded-xl border border-purple-300 bg-white text-center text-lg font-extrabold tracking-widest tabular-nums text-slate-900 outline-none focus:border-[#7C3AED]"
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
                className="px-3 py-1.5 rounded-lg bg-white border border-purple-200 text-slate-800 text-xs font-bold"
              >
                Change Payment Method
              </button>
            </div>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleConfirmPay}
            disabled={submitting}
            className="w-full py-3.5 px-5 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-60 text-white font-extrabold text-sm rounded-xl shadow-md flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{otpRequired ? 'VERIFY OTP & PAY' : 'CONFIRM & PAY'}</span>
          </button>
          <button
            type="button"
            onClick={onCancelToMarket}
            disabled={submitting}
            className="w-full py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-xl"
          >
            CANCEL
          </button>
        </div>

        {/* Forgot PIN & Biometric Options */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-purple-100 text-xs">
          <button
            type="button"
            onClick={() => setShowResetPin(!showResetPin)}
            className="text-[#7C3AED] font-bold hover:underline flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{hasPin ? 'Forgot PIN? Reset with OTP' : 'Set Your 4-Digit PIN with OTP'}</span>
          </button>
          <button
            type="button"
            onClick={handleBiometricPrompt}
            className="text-slate-700 font-bold hover:text-[#7C3AED] flex items-center gap-1"
          >
            <Fingerprint className="w-4 h-4 text-[#7C3AED]" />
            <span>Use Fingerprint / Face ID Instead</span>
          </button>
        </div>

        {/* Inline OTP PIN Setup / Reset Panel */}
        {showResetPin && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-extrabold text-slate-900 mb-0">
              {hasPin ? 'Reset Transaction PIN via Email/SMS OTP' : 'Create Your 4-Digit Transaction PIN via OTP'}
            </p>
            <button
              type="button"
              onClick={handleRequestPinOtp}
              disabled={resetBusy}
              className="px-4 py-2 rounded-lg bg-[#7C3AED] text-white text-xs font-bold hover:bg-[#6D28D9]"
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
                className="px-3 py-2 rounded-lg border border-purple-200 bg-white text-sm font-bold text-slate-900"
              />
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={resetNewPin}
                onChange={(e) => setResetNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="New 4-digit PIN"
                className="px-3 py-2 rounded-lg border border-purple-200 bg-white text-sm font-bold text-slate-900"
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
// STEP 7: PAYMENT SUCCESS + TRACKING + ESCROW RELEASE / DISPUTE (FRESH FULL PAGE)
// ============================================================================
interface SuccessPageProps {
  order: ModernMarketOrder;
  onOrderUpdated: (updated: ModernMarketOrder) => void;
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
      // Keep displaying current cached order state cleanly
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
      <div className="bg-white rounded-2xl border border-green-200 p-5 sm:p-6 text-center shadow-sm space-y-3">
        <div className="w-16 h-16 rounded-full bg-green-100 text-[#16A34A] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900">
          {order.status === 'COMPLETED'
            ? 'Delivery Confirmed!'
            : order.status === 'DISPUTED'
              ? 'Dispute Submitted - Money Frozen Safely'
              : order.status === 'REFUNDED'
                ? 'Full Refund Sent To Your Original Payment Method'
                : 'Payment Successful!'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto mb-0">
          Order ID: <strong className="text-slate-900">{order.orderId}</strong> • Amount:{' '}
          <strong className="text-[#7C3AED] tabular-nums">{formatNaira(order.grandTotal, true)}</strong>
        </p>
        <p className="text-xs font-bold text-[#16A34A] mb-0">
          Your money is protected until you confirm delivery.
        </p>

        {/* Highlighted 6-Digit Pickup / Delivery Code */}
        {order.pickupCode && (
          <div className="inline-block bg-purple-50 border-2 border-[#7C3AED]/30 rounded-2xl px-6 py-3 mt-1">
            <p className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-wider mb-0.5">
              Pickup Code (6 Digits)
            </p>
            <p className="text-3xl font-black text-slate-900 tracking-[0.25em] tabular-nums mb-0">
              {order.pickupCode}
            </p>
          </div>
        )}
      </div>

      {/* EFADO Shield Escrow Status + 48h Auto-Release Banner */}
      {order.escrowStatus === 'HELD' && order.status !== 'DISPUTED' && (
        <div className="bg-green-50 border border-[#16A34A]/30 rounded-2xl p-4 space-y-2">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-[#16A34A] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-xs font-extrabold text-slate-900 mb-0">
                EFADO Protects Your Money • Secured by EFADO Shield
              </p>
              <p className="text-xs font-medium text-slate-700 leading-relaxed mb-0">
                Your money is held safely until you confirm delivery ({formatNaira(order.grandTotal, true)}).
              </p>
            </div>
          </div>
          {autoReleaseCountdownLabel && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-xs font-extrabold text-[#7C3AED] tabular-nums">
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
              <p className="text-xs text-slate-700 mb-0">Reason: {order.disputeReason}</p>
              <p className="text-[11px] text-slate-600 mb-0">
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
            <p className="text-xs text-slate-700 mb-0">
              Refunded back to your <strong>{originalMethodLabel}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Order Summary Details Card (Product, Amount, Seller, Delivery Method — No Bank Details) */}
      <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-sm flex gap-4 items-center">
        <img
          src={order.productPhoto}
          alt={order.productName}
          className="w-20 h-20 rounded-xl object-cover border border-slate-100 shrink-0"
        />
        <div className="flex-1 min-w-0 text-xs text-slate-700 space-y-1">
          <h3 className="text-sm font-extrabold text-slate-900 truncate mb-0">{order.productName}</h3>
          <p className="mb-0">
            Seller: <strong className="text-slate-900">{order.sellerName}</strong> • Qty {order.quantity} •{' '}
            <strong className="text-[#7C3AED] tabular-nums">{formatNaira(order.grandTotal, true)}</strong>
          </p>
          <p className="mb-0">
            Delivery Method:{' '}
            <strong className="text-slate-900">
              {order.deliveryMethod === 'PICKUP_OFFICE'
                ? 'EFADO Office Pickup'
                : order.deliveryMethod === 'PICKUP_SELLER'
                  ? 'Seller Store Pickup'
                  : 'Home Delivery'}
            </strong>{' '}
            • Recipient: {order.recipientName}
          </p>
          {order.pickupLocationLabel && (
            <p className="text-[11px] text-slate-500 mb-0">{order.pickupLocationLabel}</p>
          )}
        </div>
      </div>

      {/* Tracking Timeline */}
      <div ref={trackRef} className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mb-0">
            <Package className="w-4 h-4 text-[#7C3AED]" />
            <span>Tracking Timeline</span>
          </h3>
          <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-[#7C3AED] text-xs font-bold">
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
                  current ? 'bg-purple-50 border border-[#7C3AED]/30' : ''
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${
                    current
                      ? 'bg-[#7C3AED] text-white'
                      : done
                        ? 'bg-[#16A34A] text-white'
                        : 'bg-purple-50 text-slate-400 border border-purple-200'
                  }`}
                >
                  {done ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <p
                      className={`text-xs font-bold mb-0 ${
                        current ? 'text-[#7C3AED]' : done ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      {st.label}
                      {current ? ' (Current)' : ''}
                    </p>
                    {matchedEvent?.at && (
                      <span className="text-[11px] text-slate-400 tabular-nums">
                        {new Date(matchedEvent.at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {matchedEvent?.description && (
                    <p className="text-[11px] text-slate-500 mt-0.5 mb-0">{matchedEvent.description}</p>
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

      {/* Buyer Actions: Release Money To Seller OR Report Problem / Open Dispute */}
      {order.escrowStatus === 'HELD' && order.status !== 'DISPUTED' && (
        <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-sm space-y-3">
          <h4 className="text-sm font-extrabold text-slate-900 mb-0">Buyer Actions</h4>
          <button
            type="button"
            onClick={() => setShowConfirmModal(!showConfirmModal)}
            className="w-full py-3.5 px-4 bg-[#16A34A] hover:bg-green-700 text-white font-extrabold text-sm rounded-xl shadow-sm"
          >
            I Have Received It - Release Money To Seller
          </button>

          {showConfirmModal && (
            <div className="bg-green-50 border border-[#16A34A]/30 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-slate-800 mb-0">
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
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-green-300 bg-white text-center font-extrabold tracking-widest text-slate-900"
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
                placeholder="Explain the issue clearly (e.g., item did not arrive, seal broken, wrong item)..."
                className="w-full px-3 py-2 rounded-xl border border-red-200 bg-white text-xs text-slate-900"
              />
              <div className="flex flex-wrap items-center gap-2">
                <label className="px-3 py-2 rounded-xl bg-white border border-red-200 text-xs font-bold text-slate-800 hover:bg-red-100/40 cursor-pointer flex items-center gap-1.5">
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
                  className="flex-1 px-3 py-2 rounded-xl border border-red-200 bg-white text-xs text-slate-900"
                />
                {disputeLinkInput.trim() && (
                  <button
                    type="button"
                    onClick={handleAddDisputeLink}
                    className="px-3 py-2 rounded-xl bg-white border border-red-200 text-xs font-bold text-slate-800"
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
          className="py-3 px-4 bg-white border border-purple-200 text-[#7C3AED] font-bold text-xs rounded-xl hover:bg-purple-50 flex items-center justify-center gap-1.5"
        >
          <RefreshCw className={`w-4 h-4 ${refreshingTrack ? 'animate-spin' : ''}`} />
          <span>{refreshingTrack ? 'Updating...' : 'Track Order'}</span>
        </button>
        <button
          type="button"
          onClick={onViewOrders}
          className="py-3 px-4 bg-white border border-purple-200 text-slate-800 font-bold text-xs rounded-xl hover:bg-purple-50"
        >
          View My Orders
        </button>
        <button
          type="button"
          onClick={onContinueShopping}
          className="py-3 px-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs rounded-xl shadow-sm"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
};
