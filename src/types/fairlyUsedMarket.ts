export type FairlyUsedCategory =
  | 'All'
  | 'Phones'
  | 'Laptops'
  | 'Electronics & TV'
  | 'Home Appliances'
  | 'Furniture'
  | 'Vehicles'
  | 'Houses & Land'
  | 'Fashion & Luxury'
  | 'Business Bulk'
  | 'Gaming';

export type FairlyUsedProductStatus = 'ACTIVE' | 'SOLD' | 'ARCHIVED';

export type SellerType = 'single' | 'business_closing' | 'house_land' | 'dealer';
export type ListingMode = 'single' | 'bulk';
export type ConditionGrade = 'A' | 'B' | 'C' | 'D';
export type ReasonForSelling = 'Relocating Abroad' | 'Need Money' | 'Closing Business' | 'Upgraded';
export type DeliveryOption = 'DELIVERY' | 'PICKUP_ONLY' | 'BOTH';

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

export type HouseDocType = 'C of O' | 'Deed' | 'Survey' | 'Receipt';

export interface HouseLandDetails {
  rooms?: string;
  bathrooms?: string;
  landSize?: string;
  documents: HouseDocType[];
  occupied?: 'Yes' | 'No';
  fullAddress: string;
}

export interface BulkListingItem {
  name: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface ProductNegotiationLock {
  buyerId: string;
  buyerName: string;
  offerAmountNgn: number;
  offerAmountKobo: number;
  status: 'PENDING_SELLER' | 'COUNTERED' | 'AGREED';
  proposedBy: 'buyer' | 'seller';
  counterAmountNgn?: number;
  agreedPriceNgn?: number;
  agreedPriceKobo?: number;
  updatedAt: string;
}

export interface FairlyUsedProductSpecs {
  ram?: string;
  storage?: string;
  color?: string;
  battery?: string;
  model?: string;
  colorsAvailable?: string[];
  sizesAvailable?: string[];
  [key: string]: string | string[] | undefined;
}

export interface FairlyUsedSellerPublicInfo {
  sellerId: string;
  efadoId: string;
  storeName: string;
  sellerType?: SellerType;
  verified: boolean;
  rating: number;
  salesCount: number;
  location: string;
  joinedAt: string;
  storeAddress?: string;
  online: boolean;
  lastSeenAt?: string;
}

export interface FairlyUsedProductReview {
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

export interface FairlyUsedProduct {
  id: string;
  sellerId: string;
  sellerEfadoId: string;
  sellerName: string;
  sellerVerified: boolean;
  sellerRating: number;
  sellerSalesCount: number;
  sellerLocation: string;
  sellerJoinedAt: string;
  sellerOnline: boolean;
  sellerLastSeenAt?: string;
  sellerType: SellerType;
  listingMode: ListingMode;
  bulkTotalQuantity?: number;
  bulkItems?: BulkListingItem[];
  bulkTotalPrice?: number;
  houseDetails?: HouseLandDetails | null;
  name: string;
  brand: string;
  price: number; // NGN asking / unit price
  priceKobo: number;
  originalPrice?: number;
  priceDroppedAt?: string | null;
  stock: number;
  category: Exclude<FairlyUsedCategory, 'All'>;
  condition: 'FAIRLY_USED';
  conditionGrade: ConditionGrade;
  reasonForSelling: ReasonForSelling;
  howLongUsed: string;
  workingPerfectly: boolean;
  faultDescription: string;
  canInspect: boolean;
  deliveryOption: DeliveryOption;
  negotiable: boolean;
  keptInEfadoStore: boolean;
  warrantyMonths: number;
  photos: string[];
  videoUrl: string;
  videoLikesCount: number;
  likedVideoByMe?: boolean;
  description: string;
  specs: FairlyUsedProductSpecs;
  freeDelivery: boolean;
  deliveryFee: number; // NGN
  deliveryFeeKobo: number;
  estimatedDelivery: string;
  returnDays: number;
  rating: number;
  reviewsCount: number;
  salesCount: number;
  status: FairlyUsedProductStatus;
  soldAt?: string | null;
  archivedAt?: string | null;
  waitlistCount?: number;
  isOnWaitlist?: boolean;
  activeNegotiation?: ProductNegotiationLock | null;
  createdAt: string;
  updatedAt: string;
}

export interface FairlyUsedCartItem {
  product: FairlyUsedProduct;
  quantity: number;
  agreedPriceNgn?: number;
  agreedPriceKobo?: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface OrderTrackingEvent {
  step: 'ORDERED' | 'PAID' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'COMPLETED' | 'DISPUTED' | 'REFUNDED';
  label: string;
  description: string;
  at: string;
}

export interface FairlyUsedOrderItem {
  productId: string;
  productName: string;
  productPhoto: string;
  sellerId: string;
  sellerName: string;
  sellerEfadoId?: string;
  sellerVerified: boolean;
  quantity: number;
  unitPriceKobo: number;
  unitPrice: number;
  agreedPriceUsed?: boolean;
  selectedColor?: string;
  selectedSize?: string;
}

export interface FairlyUsedOrder {
  id: string;
  orderId: string;
  buyerId: string;
  buyerEmail?: string;
  sellerId: string;
  sellerName: string;
  sellerEfadoId?: string;
  sellerVerified: boolean;
  productId: string;
  productName: string;
  productPhoto: string;
  items: FairlyUsedOrderItem[];
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
  refundChannel?: string | null;
  refundedAt?: string | null;
  trackingHistory: OrderTrackingEvent[];
  createdAt: string;
  updatedAt: string;
}

export type FairlyUsedChatMessageType =
  | 'text'
  | 'voice'
  | 'photo'
  | 'video_call'
  | 'offer'
  | 'counter'
  | 'accept'
  | 'reject';

export interface FairlyUsedChatMessage {
  id: string;
  threadId: string;
  productId: string;
  productName?: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  text: string;
  messageType?: FairlyUsedChatMessageType;
  mediaDataUrl?: string;
  offerAmountNgn?: number;
  offerStatus?: 'PENDING_SELLER' | 'COUNTERED' | 'AGREED' | 'REJECTED';
  createdAt: string;
}

export interface FairlyUsedChatThread {
  threadId: string;
  productId: string;
  productName: string;
  productPhoto: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerEfadoId?: string;
  sellerName: string;
  sellerOnline?: boolean;
  lastMessage: string;
  lastMessageAt: string;
}

export interface FairlyUsedAlert {
  id: string;
  userId: string;
  type: 'ORDER' | 'ESCROW' | 'WAITLIST' | 'CHAT' | 'DISPUTE' | 'SECURITY' | 'SELLER_SALE' | 'VENDOR' | 'PRICE_DROP' | 'NEGOTIATION';
  title: string;
  message: string;
  orderId?: string;
  productId?: string;
  read: boolean;
  createdAt: string;
}

export interface FairlyUsedReel {
  id: string;
  productId: string;
  productName: string;
  price: number;
  videoUrl: string;
  posterUrl: string;
  sellerId: string;
  sellerName: string;
  sellerEfadoId: string;
  sellerLocation: string;
  conditionGrade: ConditionGrade;
  reasonForSelling: ReasonForSelling;
  keptInEfadoStore: boolean;
  videoLikesCount: number;
  likedVideoByMe?: boolean;
  negotiable: boolean;
  status: FairlyUsedProductStatus;
  activeNegotiation?: ProductNegotiationLock | null;
}

export type VendorApplicationStatus = 'NOT_APPLIED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
export type VendorIdType = 'NIN' | "Driver's License" | "Voter's Card";

export interface SellerProfilePrivate {
  sellerId: string;
  efadoId: string;
  sellerType?: SellerType;
  storeName: string;
  ownerFullName?: string;
  phone?: string;
  email?: string;
  state?: string;
  city?: string;
  verified: boolean;
  applicationStatus?: VendorApplicationStatus;
  rejectionReason?: string;
  idType?: VendorIdType;
  idPhotoUploaded?: boolean;
  rulesAccepted?: boolean;
  submittedAt?: string;
  approvedAt?: string;
  isAdmin?: boolean;
  rating: number;
  salesCount: number;
  location: string;
  storeAddress?: string;
  joinedAt: string;
  online?: boolean;
  lastSeenAt?: string;
  payoutPreference: 'wallet' | 'bank';
  bankCode?: string;
  bankName?: string;
  accountName?: string;
  accountNumberMasked?: string;
}

export interface VendorRegistrationPayload {
  storeName: string;
  ownerFullName: string;
  phone: string;
  email: string;
  state: string;
  city: string;
  storeAddress: string;
  sellerType?: SellerType;
  idType: VendorIdType;
  idPhoto: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  payoutPreference: 'wallet' | 'bank';
  rulesAccepted: boolean;
}

export interface AdminVendorApplication extends SellerProfilePrivate {
  idPhotoPreview?: string;
}

export interface FairlyUsedFilterState {
  category: FairlyUsedCategory;
  search: string;
  brand: string;
  location: string;
  conditionGrade: 'all' | ConditionGrade;
  relocationOnly: boolean;
  negotiableOnly: boolean;
  inStoreVerifiedOnly: boolean;
  freeDeliveryOnly: boolean;
  priceMin: string;
  priceMax: string;
  sort: 'newest' | 'price_asc' | 'price_desc' | 'popular';
}
