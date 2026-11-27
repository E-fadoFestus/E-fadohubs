import { auth } from '../../firebase';
import type {
  AdminVendorApplication,
  DeliveryMethod,
  FairlyUsedAlert,
  FairlyUsedChatMessage,
  FairlyUsedChatMessageType,
  FairlyUsedChatThread,
  FairlyUsedFilterState,
  FairlyUsedOrder,
  FairlyUsedProduct,
  FairlyUsedProductReview,
  FairlyUsedReel,
  FairlyUsedSellerPublicInfo,
  PaymentGatewayId,
  PaymentMethodId,
  SellerProfilePrivate,
  VendorRegistrationPayload
} from '../../types/fairlyUsedMarket';

export function formatNaira(amount: number, showDecimals: boolean = false): string {
  const num = Number(amount || 0);
  const hasDecimals = showDecimals || !Number.isInteger(num);
  return `₦${num.toLocaleString('en-NG', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2
  })}`;
}

async function getBearerHeaders(requireAuth: boolean = true): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  let user = auth.currentUser;
  if (!user && auth.authStateReady) {
    await auth.authStateReady();
    user = auth.currentUser;
  }
  if (user) {
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  } else if (requireAuth) {
    throw new Error('Please sign in to continue.');
  }
  return headers;
}

async function apiJson<T = any>(url: string, options: RequestInit = {}, requireAuth: boolean = true): Promise<T> {
  const headers = await getBearerHeaders(requireAuth);
  const res = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text || 'Unexpected server response' };
  }
  if (!res.ok) {
    const err: any = new Error(data?.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.code = data?.code;
    err.data = data;
    throw err;
  }
  return data as T;
}

export async function fetchFairlyUsedProducts(
  filters: Partial<FairlyUsedFilterState> & { sellerMine?: boolean; page?: number }
) {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== 'All') params.set('category', filters.category);
  if (filters.search) params.set('search', filters.search);
  if (filters.brand && filters.brand !== 'all') params.set('brand', filters.brand);
  if (filters.location && filters.location !== 'all') params.set('location', filters.location);
  if (filters.conditionGrade && filters.conditionGrade !== 'all') params.set('conditionGrade', filters.conditionGrade);
  if (filters.relocationOnly) params.set('relocationOnly', 'true');
  if (filters.negotiableOnly) params.set('negotiableOnly', 'true');
  if (filters.inStoreVerifiedOnly) params.set('inStoreVerifiedOnly', 'true');
  if (filters.freeDeliveryOnly) params.set('freeDelivery', 'true');
  if (filters.priceMin) params.set('priceMin', filters.priceMin);
  if (filters.priceMax) params.set('priceMax', filters.priceMax);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.sellerMine) params.set('sellerMine', 'true');
  if (filters.page) params.set('page', String(filters.page));

  return apiJson<{ success: boolean; products: FairlyUsedProduct[]; total: number; page: number; totalPages: number }>(
    `/api/fairly-used/products?${params.toString()}`,
    { method: 'GET' },
    Boolean(filters.sellerMine)
  );
}

export async function fetchFairlyUsedReels() {
  return apiJson<{ success: boolean; reels: FairlyUsedReel[] }>('/api/fairly-used/reels', { method: 'GET' }, false);
}

export async function fetchFairlyUsedProductDetail(id: string) {
  return apiJson<{
    success: boolean;
    product: FairlyUsedProduct;
    seller: FairlyUsedSellerPublicInfo;
    reviews: FairlyUsedProductReview[];
  }>(`/api/fairly-used/products/${encodeURIComponent(id)}`, { method: 'GET' }, false);
}

export async function createFairlyUsedProduct(payload: any) {
  return apiJson<{ success: boolean; product: FairlyUsedProduct }>('/api/fairly-used/products', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function likeProductVideo(productId: string) {
  return apiJson<{ success: boolean; product: FairlyUsedProduct; message: string }>(
    `/api/fairly-used/products/${encodeURIComponent(productId)}/like-video`,
    { method: 'POST', body: JSON.stringify({}) }
  );
}

export async function updateProductPrice(productId: string, price: number) {
  return apiJson<{ success: boolean; notifiedCount: number; product: FairlyUsedProduct; message: string }>(
    `/api/fairly-used/products/${encodeURIComponent(productId)}/price`,
    { method: 'PATCH', body: JSON.stringify({ price }) }
  );
}

export async function submitOffer(payload: {
  productId: string;
  action: 'offer' | 'counter' | 'accept' | 'reject' | 'cancel';
  amountNgn?: number;
  buyerId?: string;
}) {
  return apiJson<{ success: boolean; product: FairlyUsedProduct; message: string }>('/api/fairly-used/offer', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function relistFairlyUsedProduct(id: string, stock: number, price?: number) {
  return apiJson<{ success: boolean; product: FairlyUsedProduct; notifiedCount: number; message: string }>(
    `/api/fairly-used/products/${encodeURIComponent(id)}/relist`,
    {
      method: 'POST',
      body: JSON.stringify({ stock, price })
    }
  );
}

export async function subscribeNotifyMe(productId: string) {
  return apiJson<{ success: boolean; isOnWaitlist: boolean; waitlistCount: number; message: string }>(
    '/api/fairly-used/product/notify-me',
    {
      method: 'POST',
      body: JSON.stringify({ productId })
    }
  );
}

export async function fetchPinAndWalletStatus() {
  return apiJson<{
    success: boolean;
    hasPin: boolean;
    biometricEnabled: boolean;
    isLocked: boolean;
    lockedMinutesRemaining: number;
    ngnBalance: number;
    ngnBalanceKobo: number;
  }>('/api/fairly-used/pin/status', { method: 'GET' });
}

export async function requestPinResetOtp() {
  return apiJson<{
    success: boolean;
    sent: boolean;
    channels: string[];
    maskedEmail: string;
    maskedPhone: string;
    message: string;
  }>('/api/fairly-used/pin/reset-request', { method: 'POST', body: JSON.stringify({}) });
}

export async function confirmPinResetWithOtp(otp: string, newPin: string) {
  return apiJson<{ success: boolean; message: string }>('/api/fairly-used/pin/reset-confirm', {
    method: 'POST',
    body: JSON.stringify({ otp, newPin })
  });
}

export async function validateCartStock(items: Array<{ productId: string; quantity: number }>) {
  return apiJson<{
    success: boolean;
    allAvailable: boolean;
    blockedMessage: string | null;
    items: Array<{
      productId: string;
      exists: boolean;
      available: boolean;
      soldOut: boolean;
      availableStock: number;
      requestedQty: number;
      agreedPriceNgn?: number;
      agreedPriceKobo?: number;
      reason: string | null;
      product: FairlyUsedProduct | null;
    }>;
  }>(
    '/api/fairly-used/cart/check-stock',
    {
      method: 'POST',
      body: JSON.stringify({ items })
    },
    false
  );
}

export async function createFairlyUsedOrder(payload: {
  items: Array<{ productId: string; quantity: number; selectedColor?: string; selectedSize?: string }>;
  deliveryMethod: DeliveryMethod;
  recipientName: string;
  recipientPhone: string;
  address?: { state: string; city: string; street: string; landmark?: string } | null;
}) {
  return apiJson<{ success: boolean; order: FairlyUsedOrder }>('/api/fairly-used/order/create', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function authorizeFairlyUsedOrder(orderId: string, pin: string, otp?: string) {
  return apiJson<{
    success: boolean;
    authorized: boolean;
    otpRequired?: boolean;
    authToken?: string;
    delivery?: { sent: boolean; channels: string[]; maskedEmail: string; maskedPhone: string };
    message?: string;
  }>('/api/fairly-used/order/authorize', {
    method: 'POST',
    body: JSON.stringify({ orderId, pin, otp })
  });
}

export async function payFairlyUsedOrder(payload: {
  orderId: string;
  paymentMethod: PaymentMethodId;
  gateway: PaymentGatewayId;
  authToken: string;
  idempotencyKey: string;
  returnOrigin?: string;
}) {
  return apiJson<{
    success: boolean;
    paid: boolean;
    order?: FairlyUsedOrder;
    redirectUrl?: string;
    reference?: string;
    gateway?: string;
  }>('/api/fairly-used/order/pay', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function verifyFairlyUsedPayment(payload: {
  reference?: string;
  orderId?: string;
  gateway?: string;
  transactionId?: string;
}) {
  return apiJson<{ success: boolean; order: FairlyUsedOrder; soldOutRefunded: boolean }>(
    '/api/fairly-used/order/verify-payment',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    }
  );
}

export async function fetchMyOrders() {
  return apiJson<{ success: boolean; orders: FairlyUsedOrder[] }>('/api/fairly-used/orders/my-orders', {
    method: 'GET'
  });
}

export async function fetchSellerOrders() {
  return apiJson<{ success: boolean; orders: FairlyUsedOrder[] }>('/api/fairly-used/orders/seller-orders', {
    method: 'GET'
  });
}

export async function fetchOrderTracking(orderId: string) {
  return apiJson<{ success: boolean; order: FairlyUsedOrder }>(
    `/api/fairly-used/orders/${encodeURIComponent(orderId)}/tracking`,
    { method: 'GET' }
  );
}

export async function updateSellerOrderShipping(orderId: string, stage: 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED') {
  return apiJson<{ success: boolean; order: FairlyUsedOrder }>('/api/fairly-used/order/ship', {
    method: 'POST',
    body: JSON.stringify({ orderId, stage })
  });
}

export async function confirmOrderDeliveryEscrow(orderId: string, pin: string) {
  return apiJson<{ success: boolean; order: FairlyUsedOrder; message: string }>(
    '/api/fairly-used/order/confirm-delivery',
    {
      method: 'POST',
      body: JSON.stringify({ orderId, pin })
    }
  );
}

export async function openOrderDispute(orderId: string, reason: string, photos: string[] = []) {
  return apiJson<{ success: boolean; disputeId: string; order: FairlyUsedOrder }>('/api/fairly-used/order/dispute', {
    method: 'POST',
    body: JSON.stringify({ orderId, reason, photos })
  });
}

export async function refundDisputedOrder(orderId: string) {
  return apiJson<{ success: boolean; order: FairlyUsedOrder }>('/api/fairly-used/order/refund', {
    method: 'POST',
    body: JSON.stringify({ orderId })
  });
}

export async function fetchChatMessages(productId: string, sellerId: string, buyerId?: string) {
  const qs = buyerId ? `?buyerId=${encodeURIComponent(buyerId)}` : '';
  return apiJson<{
    success: boolean;
    threadId: string;
    messages: FairlyUsedChatMessage[];
    product: FairlyUsedProduct | null;
    sellerContact: {
      sellerId: string;
      efadoId: string;
      storeName: string;
      phone: string;
      location: string;
      online: boolean;
      lastSeenAt?: string | null;
    };
  }>(`/api/fairly-used/chat/${encodeURIComponent(productId)}/${encodeURIComponent(sellerId)}${qs}`, {
    method: 'GET'
  });
}

export async function sendChatMessage(payload: {
  productId: string;
  sellerId: string;
  buyerId?: string;
  text: string;
  messageType?: FairlyUsedChatMessageType;
  mediaDataUrl?: string;
}) {
  return apiJson<{ success: boolean; message: FairlyUsedChatMessage }>('/api/fairly-used/chat/send', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function fetchMyChatThreads() {
  return apiJson<{ success: boolean; threads: FairlyUsedChatThread[] }>('/api/fairly-used/chats/my', {
    method: 'GET'
  });
}

export async function fetchFairlyUsedAlerts() {
  return apiJson<{ success: boolean; alerts: FairlyUsedAlert[] }>('/api/fairly-used/alerts', { method: 'GET' });
}

export async function sendSellerPresenceHeartbeat() {
  return apiJson<{ success: boolean; online: boolean; lastSeenAt: string }>('/api/fairly-used/seller/presence', {
    method: 'POST',
    body: JSON.stringify({})
  });
}

export async function fetchSellerProfile() {
  return apiJson<{ success: boolean; profile: SellerProfilePrivate }>('/api/fairly-used/seller/profile', {
    method: 'GET'
  });
}

export async function saveSellerProfile(payload: Partial<SellerProfilePrivate> & { accountNumber?: string }) {
  return apiJson<{ success: boolean; profile: SellerProfilePrivate }>('/api/fairly-used/seller/profile', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function registerVendorApplication(payload: VendorRegistrationPayload) {
  return apiJson<{ success: boolean; profile: SellerProfilePrivate; message: string }>(
    '/api/fairly-used/seller/register',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    }
  );
}

export async function resolveVendorBankAccount(accountNumber: string, bankCode: string, bankName?: string) {
  return apiJson<{
    success: boolean;
    account_name?: string;
    accountName?: string;
    message?: string;
  }>('/api/bank/resolve', {
    method: 'POST',
    body: JSON.stringify({
      account_number: accountNumber,
      bank_code: bankCode,
      bank_name: bankName
    })
  });
}

export async function fetchAdminVendorApplications() {
  return apiJson<{ success: boolean; vendors: AdminVendorApplication[] }>('/api/fairly-used/admin/sellers', {
    method: 'GET'
  });
}

export async function reviewAdminVendorApplication(
  sellerId: string,
  decision: 'approve' | 'reject',
  reason?: string
) {
  return apiJson<{ success: boolean; profile: SellerProfilePrivate; message: string }>(
    `/api/fairly-used/admin/sellers/${encodeURIComponent(sellerId)}/review`,
    {
      method: 'POST',
      body: JSON.stringify({ decision, reason })
    }
  );
}

export async function submitProductReview(payload: {
  productId: string;
  orderId?: string;
  rating: number;
  comment: string;
}) {
  return apiJson<{ success: boolean; review: FairlyUsedProductReview }>('/api/fairly-used/reviews', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
