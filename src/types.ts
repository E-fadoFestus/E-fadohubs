export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  followers?: string[];
  following?: string[];
  playerWallet: number;
  depositWallet: number;
  cashOutWallet: number;
  miningWallet?: number;
  miningProgress?: {
    stage: 'E' | 'F' | 'A' | 'D' | 'O' | 'COMPLETED';
    collectedInStage: number;
  };
  creatorEarnings?: {
    totalTips: number;
    adRevenueShare: number;
    trafficRewards: number;
    level: 'Novice' | 'Rising Star' | 'Influencer' | 'Global Authority';
    points: number;
  };
  role: 'player' | 'admin';
  createdAt: string;
  wallet?: UserWallet;
  csccRegistered?: boolean;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  externalWallet?: string;
  mobileMoneyNumber?: string;
  mobileMoneyProvider?: string;
}

export interface UserWallet {
  id: string;
  userId: string;
  balance: number;
  currency: 'NGN' | 'USD';
  paymentMethods: PaymentMethod[];
  transactionHistory: Transaction[];
  securitySettings: {
    twoFactorEnabled: boolean;
    encryptionEnabled: boolean;
  };
}

export interface PaymentMethod {
  id: string;
  type: 'bank_transfer' | 'credit_card' | 'crypto' | 'paypal';
  name: string;
  details: string; // Masked or encrypted
  isDefault: boolean;
}

export interface Transaction {
  id?: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'game_bet' | 'game_win' | 'payment' | 'payout';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  method?: string;
  fee?: number;
  hub?: string;
  purpose?: string;
  reference?: string;
  timestamp: any;
  description?: string;
  metadata?: any;
}

export interface AdminStats {
  adminWallet: number;
  totalHouseGain: number;
  totalPlayers: number;
  pendingPayouts: number;
  gameWallets: {
    spinGame: number;
    moneyCard: number;
    tradingGame: number;
  };
  lastUpdated: any;
}

export interface Announcement {
  id?: string;
  message: string;
  timestamp: any;
  active: boolean;
}

export interface WithdrawalRequest {
  id?: string;
  userId: string;
  userEmail: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  accountDetails: any;
  timestamp: any;
}

export interface GameOutcome {
  multiplier: number;
  label: string;
  color: string;
  weight: number;
}

export interface VendorProfile {
  id?: string;
  fullName: string;
  businessName: string;
  vendorType: 'Individual' | 'Company' | 'Organization';
  email: string;
  phone: string;
  whatsapp?: string;
  country: string;
  city: string;
  village?: string;
  address: string;
  landmark?: string;
  registrationNumber?: string;
  pickupMethod: 'Pickup' | 'Delivery' | 'Both';
  termsAccepted: boolean;
  createdAt: any;
}

export interface MarketProduct {
  id?: string;
  vendorId: string;
  title: string;
  categoryPath: {
    level1: string;
    level2: string;
    level3: string;
    level4?: string;
  };
  brand?: string;
  condition: 'New' | 'Like New' | 'Good' | 'Fair' | 'Used';
  quantity: number;
  price: number;
  currency: string;
  description: string;
  photos: string[];
  location: string;
  village?: string;
  landmark?: string;
  whatsapp?: string;
  phone?: string;
  email?: string;
  warranty?: string;
  complianceConfirmed: boolean;
  createdAt: any;
  vendorPickupLocation?: string;
}

export interface MarketOrder {
  id?: string;
  orderCode: string; // EDADOxxxx
  userId: string;
  items: {
    productId: string;
    productTitle: string;
    price: number;
    quantity: number;
    photo: string;
  }[];
  totalAmount: number;
  currency: string;
  deliveryDetails: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    method: 'Standard' | 'Expedited' | 'Instant';
    fulfillmentType?: 'DELIVERY' | 'PICKUP';
    landmark?: string;
    instructions?: string;
  };
  paymentMethod: string;
  status: 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  trackingHistory?: {
    status: string;
    location: string;
    timestamp: any;
    description: string;
  }[];
  createdAt: any;
}

export interface SocialPost {
  id?: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  media?: {
    type: 'image' | 'video';
    url: string;
  }[];
  likes: string[];
  comments: SocialComment[];
  category?: string;
  createdAt: any;
}

export interface SocialComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: any;
}

export interface Reel {
  id?: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  videoUrl: string;
  caption: string;
  likes: string[];
  shares: number;
  createdAt: any;
}

export interface ChatMessage {
  id?: string;
  senderId: string;
  senderName?: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'contact' | 'file' | 'sticker' | 'gif' | 'buzz';
  mediaUrl?: string;
  metadata?: any;
  createdAt: any;
}

export interface Advertisement {
  id?: string;
  advertiserId: string;
  advertiserName: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  budget: number;
  status: 'active' | 'paused' | 'completed';
  createdAt: any;
}

export interface ServiceProvider {
  id?: string;
  userId: string;
  businessName: string;
  serviceFamily: string;
  subcategory: string;
  services: string[];
  location: {
    country: string;
    state: string;
    city: string;
    village?: string;
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  scope: 'Local' | 'International' | 'Both';
  plan: 'Free' | 'Basic' | 'Express' | 'Corporate';
  bio: string;
  contactEmail: string;
  contactPhone: string;
  whatsapp?: string;
  photos: string[];
  workSamples?: string[];
  rating: number;
  reviewsCount: number;
  verified: boolean;
  createdAt: any;
}

export interface ServiceRequest {
  id?: string;
  clientId: string;
  clientName: string;
  providerId?: string;
  serviceFamily: string;
  subcategory: string;
  description: string;
  location: {
    country: string;
    state: string;
    city: string;
    village?: string;
    address: string;
  };
  urgency: 'Low' | 'Medium' | 'High' | 'Emergency';
  budget?: string;
  photos?: string[];
  whatsapp?: string;
  status: 'pending' | 'accepted' | 'bargaining' | 'completed' | 'cancelled';
  plan?: 'Free' | 'Basic' | 'Express' | 'Corporate';
  familyId?: string;
  specialty?: string;
  createdAt: any;
}

export interface ServiceBargain {
  id?: string;
  requestId: string;
  providerId: string;
  clientId: string;
  initialPrice: number;
  currentOffer: number;
  clientAccepted: boolean;
  providerAccepted: boolean;
  offers: {
    authorId: string;
    amount: number;
    message: string;
    timestamp: any;
  }[];
  messages: {
    id?: string;
    senderId: string;
    text: string;
    proposedPrice?: number;
    timestamp: any;
  }[];
  status: 'active' | 'agreed' | 'rejected' | 'negotiating';
  finalAmount?: number;
  createdAt: any;
}

export interface CSCCGroup {
  id?: string;
  adminId: string;
  name: string;
  type?: 'STANDARD' | 'PLUS';
  description: string;
  contributionAmount: number;
  bonusTier?: 25 | 50 | 75 | 100;
  currency: string;
  cycleDuration: 'daily' | 'weekly' | 'monthly' | 'quarterly' | '6-month' | 'yearly';
  maxMembers: number;
  payoutOrder: string[]; // Array of user UIDs in payout order (if predetermined)
  raffleResults?: Record<number, string>; // cycleIndex -> userId (if using raffle)
  useRaffle: boolean;
  status: 'pending' | 'active' | 'completed';
  currentCycleIndex: number;
  nextPayoutDate: any;
  rules: string;
  isPublic: boolean;
  progressivePayments?: Record<number, string[]>; // cycleIndex -> list of userIds who paid
  createdAt: any;
}

export interface CSCCMembership {
  id?: string;
  groupId: string;
  userId: string;
  userName: string;
  status: 'pending' | 'approved' | 'rejected';
  penaltiesPaid?: Record<number, boolean>; // cycleIndex -> true if penalty for that cycle was paid
  joinedAt: any;
}

export interface CSCCCycle {
  id?: string;
  groupId: string;
  cycleIndex: number;
  payoutRecipientId: string;
  status: 'open' | 'processing' | 'completed';
  totalContributed: number;
  payoutAmount: number;
  startDate: any;
  endDate: any;
}

export interface CSCCContribution {
  id?: string;
  groupId: string;
  cycleId: string;
  userId: string;
  amount: number;
  status: 'pending' | 'completed';
  timestamp: any;
}

export interface Loan {
  id?: string;
  userId: string;
  amount: number;
  principal: number;
  interest: number;
  fees: number;
  totalRepayment: number;
  remainingAmount: number;
  tenor: string; // e.g., "3 months"
  status: 'active' | 'overdue' | 'closed';
  nextDueDate: any;
  repaymentSchedule: {
    dueDate: any;
    amount: number;
    status: 'pending' | 'paid' | 'overdue';
  }[];
  createdAt: any;
}

export interface LoanApplication {
  id?: string;
  userId: string;
  amount: number;
  tenor: string;
  purpose?: string;
  status: 'submitted' | 'under_review' | 'approved' | 'disbursed' | 'rejected';
  kycStatus: 'pending' | 'verified' | 'failed';
  eligibilitySignals: {
    walletBalance: number;
    creditScore: number;
    repaymentHistory: string;
  };
  createdAt: any;
}

export interface LoanRepayment {
  id?: string;
  loanId: string;
  userId: string;
  amount: number;
  method: 'wallet' | 'bank' | 'card';
  status: 'completed' | 'pending' | 'failed';
  timestamp: any;
}

export interface LoanOffer {
  id: string;
  amount: number;
  tenor: string;
  interestRate: number;
  fees: number;
  description: string;
}

export interface LoanVendor {
  id?: string;
  userId: string;
  businessName: string;
  registrationNumber: string;
  licenseNumber: string;
  issuingAuthority: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  lendingParameters: {
    minAmount: number;
    maxAmount: number;
    interestRange: string;
    supportedTenors: string[];
  };
  status: 'pending' | 'verified' | 'suspended';
  verifiedAt?: any;
  createdAt: any;
}

export interface DomainSeller {
  id?: string;
  name: string;
  logoUrl: string;
  status: 'active' | 'inactive';
  integrationType: 'reseller_api' | 'affiliate_redirect';
  apiConfig?: {
    endpoint: string;
    apiKey: string;
  };
  affiliateConfig?: {
    baseUrl: string;
    trackingParam: string;
  };
  commissionRate: number;
  supportedTlds: string[];
}

export interface DomainCatalog {
  id?: string;
  sellerId: string;
  tld: string;
  pricing: {
    registration: number;
    renewal: number;
    transfer: number;
  };
  lastUpdated: any;
}

export interface DomainOrder {
  id?: string;
  userId: string;
  sellerId: string;
  domainName: string;
  tld: string;
  termYears: number;
  amountCharged: number;
  commissionAmount: number;
  sellerAmount: number;
  status: 'pending' | 'paid' | 'fulfilled' | 'failed';
  sellerReferenceId?: string;
  createdAt: any;
}

export interface QuizQuestion {
  id: string;
  subject: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index 0-3
}

export interface QuizSession {
  id?: string;
  userId: string;
  stake: number;
  potentialWin: number;
  questions: string[]; // Array of question IDs
  answers: number[]; // User's answers
  score: number;
  status: 'active' | 'won' | 'lost';
  startTime: any;
  endTime?: any;
}

export interface EmailAccount {
  id?: string;
  userId: string;
  emailAddress: string; // e.g., username@efado.com or username@custom.com
  domain: string;
  plan: 'free' | 'basic' | 'premium' | 'business' | 'express';
  storageUsed: number; // in bytes
  storageLimit: number; // in bytes
  status: 'active' | 'suspended' | 'pending_payment';
  isCustomDomain: boolean;
  dnsConfig?: DNSConfig;
  twoFactorEnabled: boolean;
  createdAt: any;
}

export interface EmailMessage {
  id?: string;
  accountId: string;
  sender: string;
  recipients: string[];
  subject: string;
  content: string;
  folder: 'inbox' | 'sent' | 'drafts' | 'trash';
  isRead: boolean;
  hasAttachments: boolean;
  attachments?: {
    name: string;
    url: string;
    size: number;
  }[];
  timestamp: any;
}

export interface DNSConfig {
  mxRecords: string[];
  spfRecord: string;
  dkimRecord: string;
  verificationStatus: 'verified' | 'pending' | 'failed';
}

export interface EmailPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'quarterly' | 'biannually' | 'yearly';
  features: string[];
  storageLimit: number;
}

export interface TechContent {
  id: string;
  title: string;
  slug: string;
  creatorId: string;
  creatorName: string;
  isVerified: boolean;
  topic: string;
  format: 'video' | 'event' | 'course' | 'tool';
  region: string;
  language: string;
  price?: number;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  industry: string;
  thumbnail: string;
  views: number;
  duration?: string;
  isLive?: boolean;
  contentType: 'video' | 'live' | 'learning' | 'product' | 'showcase';
  rating?: number;
  createdAt: any;
}

export interface TechCreator {
  id: string;
  name: string;
  photo?: string;
  isVerified: boolean;
  specialization: string;
  followers: number;
}

export interface AdListing {
  id: string;
  vendorId: string;
  type: 'ADVERT' | 'SELL';
  category: 'HOTEL' | 'FARM' | 'LAND' | 'HOUSING' | 'RESTAURANT' | 'VEHICLE' | 'STORES' | 'LEGAL' | 'RELIGIOUS_EVENTS' | 'TRAVEL' | 'TECH';
  title: string;
  description: string;
  price: number;
  location: {
    state: string;
    city: string;
    village?: string;
    address: string;
    landmark?: string;
  };
  details: Record<string, any>;
  photos: string[];
  plan: 'Free' | 'Weekly' | 'Monthly' | 'Quarterly' | 'BiAnnual' | 'Yearly' | 'Express';
  expiryDate: any;
  status: 'active' | 'expired' | 'pending';
  createdAt: any;
}

export interface AdPlan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  features: string[];
}
