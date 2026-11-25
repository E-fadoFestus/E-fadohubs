export type ModernMarketCategory =
  | 'All'
  | 'Phones'
  | 'Laptops'
  | 'Audio'
  | 'Home Appliances'
  | 'Fashion New'
  | 'Beauty New'
  | 'Gaming'
  | 'Accessories';

export type ModernProductStatus = 'ACTIVE' | 'SOLD' | 'ARCHIVED';

export type DeliveryMethod = 'DELIVERY' | 'PICKUP_OFFICE' | 'PICKUP_SELLER';

export type PaymentMethodId = 'card' | 'bank' | 'opay' | 'wallet';

export type PaymentGatewayId = 'paystack' | 'flutterwave' | 'opay' | 'wallet';

export type MarketOrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID_ESCROW_HELD'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'REFUNDED';

export type EscrowStatus = 'NONE' | 'HELD' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';

export interface ModernProductSpecs {
  ram?: string;
  storage?: string;
  color?: string;
  battery?: string;
  model?: string;
  colorsAvailable?: string[];
  sizesAvailable?: string[];
  [key: string]: string | string[] | undefined;
}

export interface ModernSellerPublicInfo {
  sellerId: string;
  storeName: string;
  verified: boolean;
  rating: number;
  salesCount: number;
  location: string;
  joinedAt: string;
  storeAddress?: string;
}

export interface ModernProductReview {
  id: string;
  productId: string;
  orderId?: string;
  buyerId: string;
  buyerName: string;
  rating: number;
  comment: string;
  photos?: string[];
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface ModernProduct {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerVerified: boolean;
  sellerRating: number;
  sellerSalesCount: number;
  sellerLocation: string;
  sellerJoinedAt: string;
  name: string;
  brand: string;
  price: number; // NGN
  priceKobo: number;
  stock: number;
  category: Exclude<ModernMarketCategory, 'All'>;
  condition: 'BRAND_NEW';
  warrantyMonths: number;
  photos: string[];
  description: string;
  specs: ModernProductSpecs;
  freeDelivery: boolean;
  deliveryFee: number; // NGN
  deliveryFeeKobo: number;
  estimatedDelivery: string;
  returnDays: number;
  rating: number;
  reviewsCount: number;
  salesCount: number;
  status: ModernProductStatus;
  soldAt?: string | null;
  archivedAt?: string | null;
  waitlistCount?: number;
  isOnWaitlist?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModernCartItem {
  product: ModernProduct;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface OrderTrackingEvent {
  step: 'ORDERED' | 'PAID' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'COMPLETED' | 'DISPUTED' | 'REFUNDED';
  label: string;
  description: string;
  at: string;
}

export interface ModernOrderItem {
  productId: string;
  productName: string;
  productPhoto: string;
  sellerId: string;
  sellerName: string;
  sellerVerified: boolean;
  quantity: number;
  unitPriceKobo: number;
  unitPrice: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface ModernMarketOrder {
  id: string;
  orderId: string;
  buyerId: string;
  buyerEmail?: string;
  sellerId: string;
  sellerName: string;
  sellerVerified: boolean;
  productId: string;
  productName: string;
  productPhoto: string;
  items: ModernOrderItem[];
  quantity: number;
  priceKobo: number;
  subtotalKobo: number;
  subtotal: number;
  serviceChargeKobo: number;
  serviceCharge: number;
  deliveryFeeKobo: number;
  deliveryFee: number;
  grandTotalKobo: number;
  grandTotal: number;
  currency: 'NGN';
  deliveryMethod: DeliveryMethod;
  recipientName: string;
  recipientPhone: string;
  address?: {
    state: string;
    city: string;
    street: string;
    landmark?: string;
  } | null;
  pickupLocationLabel?: string;
  status: MarketOrderStatus;
  pickupCode?: string | null;
  paymentMethod?: PaymentMethodId | null;
  paymentGateway?: PaymentGatewayId | null;
  paymentReference?: string | null;
  escrowStatus: EscrowStatus;
  escrowHeldAt?: string | null;
  escrowReleasedAt?: string | null;
  autoReleaseAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  disputeReason?: string | null;
  disputePhotos?: string[] | null;
  trackingHistory: OrderTrackingEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface ModernMarketChatMessage {
  id: string;
  threadId: string;
  productId: string;
  productName?: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  text: string;
  createdAt: string;
}

export interface ModernMarketChatThread {
  threadId: string;
  productId: string;
  productName: string;
  productPhoto: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  lastMessage: string;
  lastMessageAt: string;
}

export interface ModernMarketAlert {
  id: string;
  userId: string;
  type: 'ORDER' | 'ESCROW' | 'WAITLIST' | 'CHAT' | 'DISPUTE' | 'SECURITY' | 'SELLER_SALE';
  title: string;
  message: string;
  orderId?: string;
  productId?: string;
  read: boolean;
  createdAt: string;
}

export interface SellerProfilePrivate {
  sellerId: string;
  storeName: string;
  verified: boolean;
  rating: number;
  salesCount: number;
  location: string;
  storeAddress?: string;
  joinedAt: string;
  payoutPreference: 'wallet' | 'bank';
  bankCode?: string;
  bankName?: string;
  accountName?: string;
  accountNumberMasked?: string;
}

export interface MarketFilterState {
  category: ModernMarketCategory;
  search: string;
  brand: string;
  location: string;
  freeDeliveryOnly: boolean;
  brandNewOnly: boolean;
  priceMin: string;
  priceMax: string;
  sort: 'newest' | 'price_asc' | 'price_desc' | 'popular';
}
