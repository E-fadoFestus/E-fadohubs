import crypto from 'crypto';
import type { Express, NextFunction, Request, Response } from 'express';
import { getServerDb, getServerTimestamp } from './server-firestore.js';
import {
  acquireInFlightLock,
  checkRateLimit,
  createWalletAlert,
  decryptSensitive,
  encryptSensitive,
  fromMinorUnits,
  generateNumericOtp,
  hashOtp,
  hashPin,
  maskAccountNumber,
  recordSecurityEvent,
  releaseInFlightLock,
  sendSecurityOtpDelivery,
  toIsoStringSafe,
  toMinorUnits,
  verifyBearerUser,
  verifyPinHash
} from './wallet-security.js';
import {
  createTransferRecipient,
  initializePaystackPayment,
  initiateTransfer,
  verifyPaystackPayment,
  verifyPaystackSignature
} from './paystack.js';

interface AuthedRequest extends Request {
  rawBody?: Buffer;
}

const ADMIN_EMAILS = new Set([
  'efado226@gmail.com',
  'efadofestus@gmail.com',
  'festdanemh@gmail.com'
]);

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
const SERVICE_CHARGE_RATE = 0.013; // 1.3%
const HIGH_VALUE_OTP_THRESHOLD_KOBO = 100000 * 100; // ₦100,000

const SEED_SELLER_ID = 'efado_verified_official_store';
const CEO_OFFICIAL_SELLER_ID = 'efado_official_store_bonny';
let ceoStoreVerifiedThisBoot = false;

function isOfficialSeedSeller(sellerId?: string): boolean {
  return sellerId === SEED_SELLER_ID || sellerId === CEO_OFFICIAL_SELLER_ID;
}

function formatNairaPlain(n: number): string {
  return `₦${Number(n || 0).toLocaleString('en-NG', {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2
  })}`;
}

function generatePickupCode(): string {
  return String(crypto.randomInt(100000, 999999));
}

function getAuthTokenSecret(): string {
  return (
    process.env.ENCRYPTION_KEY ||
    process.env.PAYSTACK_SECRET_KEY ||
    'efado-modern-market-session-key'
  );
}

function signOrderAuthToken(orderId: string, buyerId: string, expiresAtIso: string): string {
  return crypto
    .createHmac('sha256', getAuthTokenSecret())
    .update(`${orderId}:${buyerId}:${expiresAtIso}`)
    .digest('hex');
}

function stripSellerSensitiveFields(seller: any) {
  if (!seller) return null;
  return {
    sellerId: seller.sellerId || seller.id || '',
    storeName: seller.storeName || 'EFADO Verified Store',
    verified: Boolean(seller.verified ?? true),
    rating: Number(seller.rating ?? 4.8),
    salesCount: Number(seller.salesCount ?? 0),
    location: seller.location || 'Lagos, Nigeria',
    storeAddress: seller.storeAddress || 'Victoria Island Retail Plaza, Lagos',
    joinedAt: seller.joinedAt || '2024-01-15T00:00:00.000Z'
  };
}

function sanitizeProductForPublic(docData: any, uid?: string) {
  const waitlist: any[] = Array.isArray(docData.waitlist) ? docData.waitlist : [];
  const priceKobo = Number(docData.priceKobo || toMinorUnits(Number(docData.price || 0)));
  const deliveryFeeKobo = docData.freeDelivery
    ? 0
    : Number(docData.deliveryFeeKobo || toMinorUnits(Number(docData.deliveryFee || 0)));
  return {
    id: docData.id,
    sellerId: docData.sellerId,
    sellerName: docData.sellerName || 'EFADO Verified Store',
    sellerVerified: Boolean(docData.sellerVerified ?? true),
    sellerRating: Number(docData.sellerRating ?? 4.8),
    sellerSalesCount: Number(docData.sellerSalesCount ?? 0),
    sellerLocation: docData.sellerLocation || 'Lagos, Nigeria',
    sellerJoinedAt: docData.sellerJoinedAt || '2024-01-15T00:00:00.000Z',
    name: docData.name,
    brand: docData.brand || 'Genuine',
    price: fromMinorUnits(priceKobo),
    priceKobo,
    stock: Math.max(0, Number(docData.stock ?? 0)),
    category: docData.category,
    condition: 'BRAND_NEW' as const,
    warrantyMonths: Number(docData.warrantyMonths ?? 12),
    photos: Array.isArray(docData.photos) && docData.photos.length > 0 ? docData.photos : ['/assets/market/iphone_13_pro_max.jpg'],
    description: docData.description || '',
    specs: docData.specs || {},
    freeDelivery: Boolean(docData.freeDelivery),
    deliveryFee: fromMinorUnits(deliveryFeeKobo),
    deliveryFeeKobo,
    estimatedDelivery: docData.estimatedDelivery || 'Arrives Tomorrow',
    returnDays: Number(docData.returnDays ?? 7),
    rating: Number(docData.rating ?? 4.8),
    reviewsCount: Number(docData.reviewsCount ?? 0),
    salesCount: Number(docData.salesCount ?? 0),
    status: docData.status || (Number(docData.stock ?? 0) > 0 ? 'ACTIVE' : 'SOLD'),
    soldAt: docData.soldAt || null,
    archivedAt: docData.archivedAt || null,
    waitlistCount: waitlist.length,
    isOnWaitlist: Boolean(uid && waitlist.some((w) => (typeof w === 'string' ? w === uid : w?.userId === uid))),
    createdAt: docData.createdAt || new Date().toISOString(),
    updatedAt: docData.updatedAt || new Date().toISOString()
  };
}

async function createMarketAlert(params: {
  userId: string;
  type: 'ORDER' | 'ESCROW' | 'WAITLIST' | 'CHAT' | 'DISPUTE' | 'SECURITY' | 'SELLER_SALE' | 'VENDOR';
  title: string;
  message: string;
  orderId?: string;
  productId?: string;
}) {
  try {
    const db = getServerDb();
    const id = `MALT-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    await db.doc(`modern_market_alerts/${id}`).set({
      id,
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      orderId: params.orderId || null,
      productId: params.productId || null,
      read: false,
      createdAt: new Date().toISOString(),
      timestamp: getServerTimestamp()
    });
  } catch (err) {
    console.warn('[Marketplace Alert] Non-fatal error:', err);
  }
}

async function writeAuditLog(action: string, actorId: string, details: Record<string, any>) {
  try {
    const db = getServerDb();
    const id = `MAUD-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    await db.doc(`modern_market_audit_logs/${id}`).set({
      id,
      action,
      actorId,
      details,
      createdAt: new Date().toISOString(),
      timestamp: getServerTimestamp()
    });
  } catch (err) {
    console.warn('[Marketplace Audit] Non-fatal error:', err);
  }
}

async function isAdminUser(uid: string, email?: string): Promise<boolean> {
  if (email && ADMIN_EMAILS.has(email.toLowerCase())) return true;
  try {
    const db = getServerDb();
    const snap = await db.doc(`users/${uid}`).get();
    if (snap.exists) {
      const d = snap.data() || {};
      if (d.role === 'admin' || d.is_super_admin === true) return true;
    }
  } catch {
    // ignore
  }
  return false;
}

async function ensureCeoOfficialStoreSeed(db: any) {
  if (ceoStoreVerifiedThisBoot) return;
  ceoStoreVerifiedThisBoot = true;
  try {
    const nowIso = new Date().toISOString();
    const ceoSellerRef = db.doc(`modern_market_sellers/${CEO_OFFICIAL_SELLER_ID}`);
    const ceoSellerSnap = await ceoSellerRef.get();
    if (!ceoSellerSnap.exists) {
      await ceoSellerRef.set({
        sellerId: CEO_OFFICIAL_SELLER_ID,
        storeName: 'EFADO Official Store',
        verified: true,
        rating: 5.0,
        salesCount: 615,
        location: 'Bonny, Rivers State',
        storeAddress: 'EFADO Official Flagship Store, Hospital Road, Bonny Island, Rivers State',
        joinedAt: '2024-01-01T00:00:00.000Z',
        payoutPreference: 'wallet',
        updatedAt: nowIso
      });
    }

    const ceoProdId = 'prod_efado_official_watch_ultra2';
    const ceoProdRef = db.doc(`modern_market_products/${ceoProdId}`);
    const ceoProdSnap = await ceoProdRef.get();
    if (!ceoProdSnap.exists) {
      await ceoProdRef.set({
        id: ceoProdId,
        sellerId: CEO_OFFICIAL_SELLER_ID,
        sellerName: 'EFADO Official Store',
        sellerVerified: true,
        sellerRating: 5.0,
        sellerSalesCount: 615,
        sellerLocation: 'Bonny, Rivers State',
        sellerJoinedAt: '2024-01-01T00:00:00.000Z',
        name: 'Apple Watch Ultra 2 Titanium 49mm (Official Sealed)',
        brand: 'Apple',
        price: 1150000,
        priceKobo: 115000000,
        stock: 7,
        category: 'Accessories',
        condition: 'BRAND_NEW',
        warrantyMonths: 12,
        photos: ['/assets/market/smartwatch_ultra.jpg'],
        description:
          'Direct from EFADO Official Store (Bonny, Rivers State). Factory sealed Brand New Apple Watch Ultra 2 (49mm Titanium, Slate Ocean Band, S9 SiP, 12-month official warranty & Escrow protected).',
        specs: {
          ram: 'S9 Dual-Core SiP',
          storage: '64GB Internal',
          color: 'Natural Titanium / Slate',
          battery: 'Up to 72 Hours',
          model: 'MREG3LL/A',
          colorsAvailable: ['Natural Titanium'],
          sizesAvailable: ['49mm']
        },
        freeDelivery: true,
        deliveryFee: 0,
        deliveryFeeKobo: 0,
        estimatedDelivery: 'Arrives in 1-2 Days',
        returnDays: 7,
        rating: 5.0,
        reviewsCount: 39,
        salesCount: 92,
        status: 'ACTIVE',
        soldAt: null,
        waitlist: [],
        createdAt: nowIso,
        updatedAt: nowIso
      });
    }
  } catch (err) {
    ceoStoreVerifiedThisBoot = false;
    console.warn('[CEO Official Store Seed Notice]:', err);
  }
}

async function ensureSeedCatalog() {
  const db = getServerDb();
  await ensureCeoOfficialStoreSeed(db);
  const existing = await db.collection('modern_market_products').limit(1).get();
  if (!existing.empty) return;

  const now = new Date();
  const nowIso = now.toISOString();
  const recentSoldIso = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();

  await db.doc(`modern_market_sellers/${SEED_SELLER_ID}`).set(
    {
      sellerId: SEED_SELLER_ID,
      storeName: 'EFADO Direct Tech Hub',
      verified: true,
      rating: 4.9,
      salesCount: 428,
      location: 'Lagos, Nigeria',
      storeAddress: 'Suite 14, Admiralty Way Tech Mall, Lekki Phase 1, Lagos',
      joinedAt: '2024-01-15T00:00:00.000Z',
      payoutPreference: 'wallet',
      updatedAt: nowIso
    },
    { merge: true }
  );

  const seedProducts = [
    {
      id: 'prod_iphone_13_pro_max',
      sellerId: SEED_SELLER_ID,
      sellerName: 'EFADO Direct Tech Hub',
      sellerVerified: true,
      sellerRating: 4.9,
      sellerSalesCount: 428,
      sellerLocation: 'Lagos, Nigeria',
      sellerJoinedAt: '2024-01-15T00:00:00.000Z',
      name: 'iPhone 13 Pro Max - 256GB Graphite',
      brand: 'Apple',
      price: 1232500,
      priceKobo: 123250000,
      stock: 8,
      category: 'Phones',
      condition: 'BRAND_NEW',
      warrantyMonths: 12,
      photos: ['/assets/market/iphone_13_pro_max.jpg'],
      description:
        'Factory sealed Brand New Apple iPhone 13 Pro Max (256GB, Graphite). Super Retina XDR ProMotion display, A15 Bionic chip, Pro camera system, and official 12-month manufacturer warranty.',
      specs: {
        ram: '6GB',
        storage: '256GB NVMe',
        color: 'Graphite',
        battery: '4,352 mAh',
        model: 'A2484 (Global Unlocked)',
        colorsAvailable: ['Graphite', 'Sierra Blue', 'Silver'],
        sizesAvailable: ['256GB', '512GB']
      },
      freeDelivery: true,
      deliveryFee: 0,
      deliveryFeeKobo: 0,
      estimatedDelivery: 'Arrives Tomorrow',
      returnDays: 7,
      rating: 4.9,
      reviewsCount: 38,
      salesCount: 142,
      status: 'ACTIVE',
      soldAt: null,
      waitlist: [],
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'prod_macbook_pro_14',
      sellerId: SEED_SELLER_ID,
      sellerName: 'EFADO Direct Tech Hub',
      sellerVerified: true,
      sellerRating: 4.9,
      sellerSalesCount: 428,
      sellerLocation: 'Lagos, Nigeria',
      sellerJoinedAt: '2024-01-15T00:00:00.000Z',
      name: 'MacBook Pro 14" M3 Pro - 18GB / 512GB',
      brand: 'Apple',
      price: 2450000,
      priceKobo: 245000000,
      stock: 5,
      category: 'Laptops',
      condition: 'BRAND_NEW',
      warrantyMonths: 12,
      photos: ['/assets/market/macbook_pro_14.jpg'],
      description:
        'Brand New factory sealed Apple MacBook Pro 14-inch with M3 Pro chip, 18GB unified memory, 512GB SSD, Liquid Retina XDR display, Space Black finish, and full AppleCare warranty coverage.',
      specs: {
        ram: '18GB Unified',
        storage: '512GB SSD',
        color: 'Space Black',
        battery: 'Up to 18 hrs',
        model: 'MRX33LL/A',
        colorsAvailable: ['Space Black', 'Silver'],
        sizesAvailable: ['18GB / 512GB']
      },
      freeDelivery: true,
      deliveryFee: 0,
      deliveryFeeKobo: 0,
      estimatedDelivery: 'Arrives Tomorrow',
      returnDays: 7,
      rating: 4.9,
      reviewsCount: 24,
      salesCount: 79,
      status: 'ACTIVE',
      soldAt: null,
      waitlist: [],
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'prod_sony_wh1000xm5',
      sellerId: SEED_SELLER_ID,
      sellerName: 'EFADO Direct Tech Hub',
      sellerVerified: true,
      sellerRating: 4.8,
      sellerSalesCount: 428,
      sellerLocation: 'Abuja, Nigeria',
      sellerJoinedAt: '2024-01-15T00:00:00.000Z',
      name: 'Sony WH-1000XM5 Wireless ANC Headphones',
      brand: 'Sony',
      price: 465000,
      priceKobo: 46500000,
      stock: 14,
      category: 'Audio',
      condition: 'BRAND_NEW',
      warrantyMonths: 12,
      photos: ['/assets/market/sony_headphones.jpg'],
      description:
        'Brand New sealed Sony WH-1000XM5 industry-leading Active Noise Cancelling wireless headphones with 8 microphones, 30-hour battery life, multipoint Bluetooth, and carrying case.',
      specs: {
        ram: 'QN1 + V1 Audio',
        storage: 'Bluetooth 5.2',
        color: 'Midnight Black',
        battery: '30 Hours (USB-C Fast Charge)',
        model: 'WH1000XM5/B',
        colorsAvailable: ['Midnight Black', 'Silver'],
        sizesAvailable: ['Standard Fit']
      },
      freeDelivery: true,
      deliveryFee: 0,
      deliveryFeeKobo: 0,
      estimatedDelivery: 'Arrives in 1-2 Days',
      returnDays: 7,
      rating: 4.8,
      reviewsCount: 51,
      salesCount: 184,
      status: 'ACTIVE',
      soldAt: null,
      waitlist: [],
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'prod_ps5_slim_bundle',
      sellerId: SEED_SELLER_ID,
      sellerName: 'EFADO Direct Tech Hub',
      sellerVerified: true,
      sellerRating: 4.9,
      sellerSalesCount: 428,
      sellerLocation: 'Port Harcourt, Nigeria',
      sellerJoinedAt: '2024-01-15T00:00:00.000Z',
      name: 'PlayStation 5 Slim 1TB Console + Controller',
      brand: 'Sony',
      price: 895000,
      priceKobo: 89500000,
      stock: 3,
      category: 'Gaming',
      condition: 'BRAND_NEW',
      warrantyMonths: 12,
      photos: ['/assets/market/ps5_console.jpg'],
      description:
        'Factory sealed Sony PlayStation 5 Slim Disc Edition (1TB ultra-high-speed SSD) with DualSense wireless controller, HDMI 2.1 cable, and 12-month warranty.',
      specs: {
        ram: '16GB GDDR6',
        storage: '1TB Custom SSD',
        color: 'Glacier White / Black',
        battery: 'AC Direct + DualSense',
        model: 'CFI-2016A',
        colorsAvailable: ['Glacier White'],
        sizesAvailable: ['1TB Disc Edition']
      },
      freeDelivery: false,
      deliveryFee: 3500,
      deliveryFeeKobo: 350000,
      estimatedDelivery: 'Arrives in 2 Days',
      returnDays: 7,
      rating: 4.9,
      reviewsCount: 19,
      salesCount: 64,
      status: 'ACTIVE',
      soldAt: null,
      waitlist: [],
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'prod_breville_espresso',
      sellerId: SEED_SELLER_ID,
      sellerName: 'EFADO Direct Tech Hub',
      sellerVerified: true,
      sellerRating: 4.8,
      sellerSalesCount: 428,
      sellerLocation: 'Lagos, Nigeria',
      sellerJoinedAt: '2024-01-15T00:00:00.000Z',
      name: 'Breville Barista Express Espresso Machine',
      brand: 'Breville',
      price: 980000,
      priceKobo: 98000000,
      stock: 6,
      category: 'Home Appliances',
      condition: 'BRAND_NEW',
      warrantyMonths: 24,
      photos: ['/assets/market/espresso_maker.jpg'],
      description:
        'Brand New boxed Breville Barista Express stainless steel automatic espresso machine with conical burr grinder, digital temperature control, steam wand, and 24-month warranty.',
      specs: {
        ram: '15-Bar Italian Pump',
        storage: '2L Water Tank',
        color: 'Brushed Stainless Steel',
        battery: '1850W AC',
        model: 'BES870XL',
        colorsAvailable: ['Brushed Steel'],
        sizesAvailable: ['Standard Countertop']
      },
      freeDelivery: true,
      deliveryFee: 0,
      deliveryFeeKobo: 0,
      estimatedDelivery: 'Arrives Tomorrow',
      returnDays: 7,
      rating: 4.8,
      reviewsCount: 15,
      salesCount: 41,
      status: 'ACTIVE',
      soldAt: null,
      waitlist: [],
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'prod_luna_leather_sneakers',
      sellerId: SEED_SELLER_ID,
      sellerName: 'EFADO Direct Tech Hub',
      sellerVerified: true,
      sellerRating: 4.7,
      sellerSalesCount: 428,
      sellerLocation: 'Abuja, Nigeria',
      sellerJoinedAt: '2024-01-15T00:00:00.000Z',
      name: 'Luna Court Full-Grain Leather Sneakers',
      brand: 'Luna Atelier',
      price: 85000,
      priceKobo: 8500000,
      stock: 16,
      category: 'Fashion New',
      condition: 'BRAND_NEW',
      warrantyMonths: 6,
      photos: ['/assets/market/fashion_sneakers.jpg'],
      description:
        'Brand New in original box. Handcrafted Italian full-grain leather low-top court sneakers in crisp white with lavender heel accent, cushioned insole, and dust bag.',
      specs: {
        ram: 'Full-Grain Calfskin',
        storage: 'Rubber Cup Sole',
        color: 'White / Lavender',
        battery: 'Lightweight 340g',
        model: 'LC-2026-LAV',
        colorsAvailable: ['White / Lavender', 'Triple White'],
        sizesAvailable: ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44']
      },
      freeDelivery: true,
      deliveryFee: 0,
      deliveryFeeKobo: 0,
      estimatedDelivery: 'Arrives Tomorrow',
      returnDays: 7,
      rating: 4.8,
      reviewsCount: 27,
      salesCount: 95,
      status: 'ACTIVE',
      soldAt: null,
      waitlist: [],
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'prod_elixir_botanica_kit',
      sellerId: SEED_SELLER_ID,
      sellerName: 'EFADO Direct Tech Hub',
      sellerVerified: true,
      sellerRating: 4.9,
      sellerSalesCount: 428,
      sellerLocation: 'Lagos, Nigeria',
      sellerJoinedAt: '2024-01-15T00:00:00.000Z',
      name: 'Elixir Botanica Sealed Youth Skincare Duo',
      brand: 'Elixir Botanica',
      price: 42000,
      priceKobo: 4200000,
      stock: 22,
      category: 'Beauty New',
      condition: 'BRAND_NEW',
      warrantyMonths: 12,
      photos: ['/assets/market/beauty_skincare.jpg'],
      description:
        'Factory sealed authentic NAFDAC & EU certified Youth Regenerating Serum (30ml) + Nourishing Ceramide Moisturizer (50ml) gift set. Tamper-proof holographic seal.',
      specs: {
        ram: '30ml Serum + 50ml Cream',
        storage: 'Tamper-Sealed Box',
        color: 'Amber Glass',
        battery: '24-Month Shelf Life',
        model: 'EB-DUO-2026',
        colorsAvailable: ['Standard Pack'],
        sizesAvailable: ['80ml Gift Duo']
      },
      freeDelivery: false,
      deliveryFee: 1500,
      deliveryFeeKobo: 150000,
      estimatedDelivery: 'Arrives Tomorrow',
      returnDays: 7,
      rating: 4.9,
      reviewsCount: 44,
      salesCount: 210,
      status: 'ACTIVE',
      soldAt: null,
      waitlist: [],
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'prod_apple_watch_ultra_2',
      sellerId: SEED_SELLER_ID,
      sellerName: 'EFADO Direct Tech Hub',
      sellerVerified: true,
      sellerRating: 4.9,
      sellerSalesCount: 428,
      sellerLocation: 'Lagos, Nigeria',
      sellerJoinedAt: '2024-01-15T00:00:00.000Z',
      name: 'Apple Watch Ultra 2 Titanium 49mm (Sealed)',
      brand: 'Apple',
      price: 1150000,
      priceKobo: 115000000,
      stock: 0,
      category: 'Accessories',
      condition: 'BRAND_NEW',
      warrantyMonths: 12,
      photos: ['/assets/market/smartwatch_ultra.jpg'],
      description:
        'Brand New Apple Watch Ultra 2 (49mm Aerospace-grade Titanium case, Slate Ocean Band, S9 SiP, 3000-nit Sapphire display, 100m water resistance).',
      specs: {
        ram: 'S9 Dual-Core SiP',
        storage: '64GB Internal',
        color: 'Natural Titanium / Slate',
        battery: 'Up to 72 Hours',
        model: 'MREG3LL/A',
        colorsAvailable: ['Natural Titanium'],
        sizesAvailable: ['49mm']
      },
      freeDelivery: true,
      deliveryFee: 0,
      deliveryFeeKobo: 0,
      estimatedDelivery: 'Arrives Tomorrow',
      returnDays: 7,
      rating: 4.9,
      reviewsCount: 33,
      salesCount: 88,
      status: 'SOLD',
      soldAt: recentSoldIso,
      waitlist: [],
      createdAt: nowIso,
      updatedAt: recentSoldIso
    }
  ];

  for (const prod of seedProducts) {
    await db.doc(`modern_market_products/${prod.id}`).set(prod, { merge: true });
  }

  // Seed initial verified buyer review for flagship iPhone
  await db.doc('modern_market_reviews/rev_seed_iphone_1').set(
    {
      id: 'rev_seed_iphone_1',
      productId: 'prod_iphone_13_pro_max',
      orderId: 'ORD-SEED-9012',
      buyerId: 'seed_buyer_1',
      buyerName: 'Chinedu Okafor',
      rating: 5,
      comment:
        'Arrived factory sealed next morning in Lekki! Verified serial number on Apple Check Coverage before confirming delivery.',
      photos: ['/assets/market/iphone_13_pro_max.jpg'],
      verifiedPurchase: true,
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    { merge: true }
  );
}

/**
 * Moves SOLD products older than 24h to ARCHIVED + auto-releases DELIVERED orders past 48h.
 */
export async function runMarketplaceLifecycleMaintenance(): Promise<{
  archivedCount: number;
  autoReleasedCount: number;
}> {
  const db = getServerDb();
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  let archivedCount = 0;
  let autoReleasedCount = 0;

  try {
    const soldSnap = await db.collection('modern_market_products').where('status', '==', 'SOLD').get();
    for (const d of soldSnap.docs) {
      const data = d.data() || {};
      const soldAtMs = data.soldAt ? new Date(data.soldAt).getTime() : 0;
      if (soldAtMs > 0 && nowMs - soldAtMs >= TWENTY_FOUR_HOURS_MS) {
        await db.doc(`modern_market_products/${d.id}`).set(
          {
            status: 'ARCHIVED',
            archivedAt: nowIso,
            updatedAt: nowIso
          },
          { merge: true }
        );
        archivedCount += 1;
      }
    }
  } catch (err) {
    console.warn('[Marketplace Maintenance] Archive sweep warning:', err);
  }

  try {
    const deliveredSnap = await db.collection('modern_market_orders').where('status', '==', 'DELIVERED').get();
    for (const d of deliveredSnap.docs) {
      const ord = d.data() || {};
      const autoReleaseMs = ord.autoReleaseAt ? new Date(ord.autoReleaseAt).getTime() : 0;
      if (ord.escrowStatus === 'HELD' && autoReleaseMs > 0 && nowMs >= autoReleaseMs) {
        const released = await releaseOrderEscrowToSeller(ord.orderId || d.id, 'system_auto_release', true).catch(
          () => false
        );
        if (released) autoReleasedCount += 1;
      }
    }
  } catch (err) {
    console.warn('[Marketplace Maintenance] Auto-release sweep warning:', err);
  }

  return { archivedCount, autoReleasedCount };
}

/**
 * Releases held escrow funds cleanly to seller Wallet or Bank.
 */
async function releaseOrderEscrowToSeller(
  orderId: string,
  actorId: string,
  isAutoRelease: boolean = false
): Promise<any> {
  const lockKey = `mkt_escrow:${orderId}`;
  if (!acquireInFlightLock(lockKey)) {
    throw Object.assign(new Error('Escrow release already in progress for this order.'), { status: 409 });
  }

  try {
    const db = getServerDb();
    const serverTime = getServerTimestamp();
    const nowIso = new Date().toISOString();
    const orderRef = db.doc(`modern_market_orders/${orderId}`);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      throw Object.assign(new Error('Order not found.'), { status: 404 });
    }

    const order = orderSnap.data() || {};
    if (order.escrowStatus === 'RELEASED' || order.status === 'COMPLETED') {
      return order;
    }
    if (order.escrowStatus !== 'HELD' || order.status === 'DISPUTED' || order.status === 'REFUNDED') {
      throw Object.assign(
        new Error(`Order escrow cannot be released (current status: ${order.status}, escrow: ${order.escrowStatus}).`),
        { status: 400 }
      );
    }

    const sellerId = String(order.sellerId || '').trim();
    // Seller receives product subtotal + delivery fee; EFADO retains the 1.3% service charge.
    const sellerPayoutKobo =
      Number(order.subtotalKobo || 0) + Number(order.deliveryFeeKobo || 0) ||
      Math.max(0, Number(order.grandTotalKobo || 0) - Number(order.serviceChargeKobo || 0));
    const sellerPayoutNgn = fromMinorUnits(sellerPayoutKobo);

    const sellerSnap = await db.doc(`modern_market_sellers/${sellerId}`).get();
    const sellerProfile = sellerSnap.exists ? sellerSnap.data() || {} : {};
    const payoutPref = sellerProfile.payoutPreference === 'bank' ? 'bank' : 'wallet';

    const payoutRef = `MKT-REL-${orderId}-${Date.now()}`;
    let payoutChannelLabel = 'EFADO Wallet';
    let bankTransferCode: string | null = null;

    if (payoutPref === 'bank' && sellerProfile.accountNumberEncrypted && sellerProfile.bankCode) {
      const rawAcc = decryptSensitive(sellerProfile.accountNumberEncrypted);
      if (!rawAcc) {
        throw Object.assign(new Error('Seller bank account could not be decrypted. Seller must update payout details.'), {
          status: 400
        });
      }
      let recipientCode = sellerProfile.recipientCode || '';
      if (!recipientCode) {
        const recRes = await createTransferRecipient(
          sellerProfile.accountName || sellerProfile.storeName || 'EFADO Seller',
          rawAcc,
          sellerProfile.bankCode,
          'NGN'
        );
        recipientCode = recRes?.data?.recipient_code || '';
        if (recipientCode) {
          await db.doc(`modern_market_sellers/${sellerId}`).set({ recipientCode }, { merge: true });
        }
      }
      if (!recipientCode) {
        throw Object.assign(new Error('Could not resolve Paystack bank recipient for seller.'), { status: 502 });
      }
      const transferRes = await initiateTransfer(
        sellerPayoutNgn,
        recipientCode,
        payoutRef,
        `EFADO Modern Market Escrow Payout (${orderId})`
      );
      bankTransferCode = transferRes?.data?.transfer_code || payoutRef;
      payoutChannelLabel = `${sellerProfile.bankName || 'Bank'} (${sellerProfile.accountNumberMasked || '****'})`;
    }

    await db.runTransaction(async (tx: any) => {
      const freshOrd = await tx.get(orderRef);
      if (!freshOrd.exists) throw Object.assign(new Error('Order disappeared.'), { status: 404 });
      const cur = freshOrd.data() || {};
      if (cur.escrowStatus !== 'HELD') {
        throw Object.assign(new Error('Escrow already settled.'), { status: 409 });
      }

      if (payoutPref !== 'bank') {
        const sellerWalletRef = db.doc(`wallets/${sellerId}/NGN/depositWallet`);
        const sellerUserRef = db.doc(`users/${sellerId}`);
        const wSnap = await tx.get(sellerWalletRef);
        const oldBal = wSnap.exists ? Number(wSnap.data()?.balance ?? wSnap.data()?.depositWallet ?? 0) : 0;
        const newBal = fromMinorUnits(toMinorUnits(oldBal) + sellerPayoutKobo);

        tx.set(
          sellerWalletRef,
          { balance: newBal, depositWallet: newBal, currency: 'NGN', userId: sellerId, updatedAt: serverTime },
          { merge: true }
        );
        tx.set(sellerUserRef, { depositWallet: newBal, updatedAt: serverTime }, { merge: true });

        const txRecord = {
          type: 'deposit',
          status: 'completed',
          credited: true,
          amount: sellerPayoutNgn,
          currency: 'NGN',
          reference: payoutRef,
          userId: sellerId,
          hub: 'MODERN_MARKET',
          gateway: 'efado_escrow',
          method: 'EFADO Escrow Release',
          purpose: `Marketplace Sale +${formatNairaPlain(sellerPayoutNgn)} (${cur.productName || orderId})`,
          orderId,
          createdAtIso: nowIso,
          timestamp: serverTime,
          updatedAt: serverTime
        };
        tx.set(db.doc(`transactions/${payoutRef}`), txRecord, { merge: true });
        tx.set(db.doc(`wallets/${sellerId}/transactions/${payoutRef}`), txRecord, { merge: true });
      }

      const history = Array.isArray(cur.trackingHistory) ? [...cur.trackingHistory] : [];
      if (!history.some((h: any) => h.step === 'DELIVERED')) {
        history.push({
          step: 'DELIVERED',
          label: cur.deliveryMethod === 'DELIVERY' ? 'Delivered' : 'Picked Up',
          description: isAutoRelease
            ? 'Delivery window elapsed (48h). Confirmed automatically.'
            : 'Buyer confirmed item received in sealed Brand New condition.',
          at: nowIso
        });
      }
      history.push({
        step: 'COMPLETED',
        label: 'Escrow Released',
        description: `${formatNairaPlain(sellerPayoutNgn)} released to ${cur.sellerName || 'seller'} via ${payoutChannelLabel}.`,
        at: nowIso
      });

      tx.set(
        orderRef,
        {
          status: 'COMPLETED',
          escrowStatus: 'RELEASED',
          escrowReleasedAt: nowIso,
          deliveredAt: cur.deliveredAt || nowIso,
          payoutReference: payoutRef,
          payoutChannel: payoutChannelLabel,
          bankTransferCode,
          trackingHistory: history,
          updatedAt: nowIso
        },
        { merge: true }
      );
    });

    // Update seller stats
    if (sellerSnap.exists) {
      await db.doc(`modern_market_sellers/${sellerId}`).set(
        {
          salesCount: Number(sellerProfile.salesCount || 0) + Number(order.quantity || 1),
          updatedAt: nowIso
        },
        { merge: true }
      );
    }

    await Promise.all([
      createMarketAlert({
        userId: sellerId,
        type: 'ESCROW',
        title: 'Escrow Money Released!',
        message: `${formatNairaPlain(sellerPayoutNgn)} has been credited to your ${payoutChannelLabel} for order ${orderId}.`,
        orderId
      }),
      createMarketAlert({
        userId: order.buyerId,
        type: 'ORDER',
        title: 'Order Completed',
        message: `Thank you! You confirmed delivery for ${order.productName}. Escrow funds released to seller.`,
        orderId
      }),
      createWalletAlert(
        sellerId,
        'deposit',
        'Marketplace Sale Escrow Released',
        `+${formatNairaPlain(sellerPayoutNgn)} credited for order ${orderId}.`,
        { orderId, payoutRef }
      ),
      writeAuditLog(isAutoRelease ? 'ESCROW_AUTO_RELEASED' : 'ESCROW_RELEASED', actorId, {
        orderId,
        sellerId,
        sellerPayoutNgn,
        payoutRef,
        payoutChannelLabel
      })
    ]);

    const updatedSnap = await orderRef.get();
    return updatedSnap.exists ? updatedSnap.data() : null;
  } finally {
    releaseInFlightLock(lockKey);
  }
}

function sanitizeOrderForViewer(ord: any) {
  if (!ord) return ord;
  const { authTokenHash, authTokenExpiresAt, idempotencyKey, ...safe } = ord;
  return safe;
}

/**
 * Idempotently verifies and finalizes a pending external gateway order (Paystack / Flutterwave / OPay).
 */
async function finalizeExternalOrderPayment(params: {
  reference: string;
  gateway: 'paystack' | 'flutterwave' | 'opay';
  paidAmountKobo: number;
  currency: string;
  gatewayTransactionId?: string;
}): Promise<{ order: any; soldOutRefunded: boolean }> {
  const { reference, gateway, paidAmountKobo, currency, gatewayTransactionId } = params;
  const db = getServerDb();
  const serverTime = getServerTimestamp();
  const nowIso = new Date().toISOString();

  const pendSnap = await db.doc(`pendingMarketplacePayments/${reference}`).get();
  if (!pendSnap.exists) {
    throw Object.assign(new Error('Marketplace payment reference not found.'), { status: 404 });
  }
  const pending = pendSnap.data() || {};
  const orderId = String(pending.orderId || '').trim();
  const lockKey = `mkt_pay:${orderId || reference}`;
  if (!acquireInFlightLock(lockKey)) {
    throw Object.assign(new Error('Payment confirmation already in progress.'), { status: 409 });
  }

  try {
    const orderRef = db.doc(`modern_market_orders/${orderId}`);
    const orderPre = await orderRef.get();
    if (!orderPre.exists) {
      throw Object.assign(new Error('Order not found.'), { status: 404 });
    }
    const existingOrder = orderPre.data() || {};
    if (existingOrder.status === 'PAID_ESCROW_HELD' || existingOrder.escrowStatus === 'HELD' || existingOrder.status === 'COMPLETED') {
      return { order: existingOrder, soldOutRefunded: false };
    }

    if (String(currency || 'NGN').toUpperCase() !== 'NGN') {
      throw Object.assign(new Error('Invalid payment currency. Only NGN is supported.'), { status: 400 });
    }
    if (Number(paidAmountKobo) < Number(existingOrder.grandTotalKobo || 0)) {
      throw Object.assign(
        new Error(
          `Paid amount (${formatNairaPlain(fromMinorUnits(paidAmountKobo))}) does not match order total (${formatNairaPlain(fromMinorUnits(existingOrder.grandTotalKobo))}).`
        ),
        { status: 400 }
      );
    }

    let soldOutConflict = false;
    const pickupCode = existingOrder.pickupCode || generatePickupCode();
    const autoReleaseAt = new Date(Date.now() + FORTY_EIGHT_HOURS_MS).toISOString();

    await db.runTransaction(async (tx: any) => {
      const ordSnap = await tx.get(orderRef);
      if (!ordSnap.exists) throw Object.assign(new Error('Order not found.'), { status: 404 });
      const ord = ordSnap.data() || {};
      if (ord.escrowStatus === 'HELD' || ord.status === 'PAID_ESCROW_HELD') return;

      const items: any[] = Array.isArray(ord.items) && ord.items.length > 0
        ? ord.items
        : [{ productId: ord.productId, quantity: ord.quantity || 1 }];

      const prodReads: Array<{ ref: any; snap: any; qty: number }> = [];
      for (const it of items) {
        const pRef = db.doc(`modern_market_products/${it.productId}`);
        const pSnap = await tx.get(pRef);
        prodReads.push({ ref: pRef, snap: pSnap, qty: Number(it.quantity || 1) });
      }

      for (const pr of prodReads) {
        if (!pr.snap.exists) {
          soldOutConflict = true;
          break;
        }
        const pd = pr.snap.data() || {};
        if (pd.status !== 'ACTIVE' || Number(pd.stock || 0) < pr.qty) {
          soldOutConflict = true;
          break;
        }
      }

      if (soldOutConflict) {
        // Auto-refund full NGN payment into buyer's EFADO deposit wallet because another buyer took the last unit
        const refundNgn = fromMinorUnits(ord.grandTotalKobo);
        const buyerWalletRef = db.doc(`wallets/${ord.buyerId}/NGN/depositWallet`);
        const buyerUserRef = db.doc(`users/${ord.buyerId}`);
        const bwSnap = await tx.get(buyerWalletRef);
        const oldBal = bwSnap.exists ? Number(bwSnap.data()?.balance ?? bwSnap.data()?.depositWallet ?? 0) : 0;
        const newBal = fromMinorUnits(toMinorUnits(oldBal) + Number(ord.grandTotalKobo || 0));

        tx.set(
          buyerWalletRef,
          { balance: newBal, depositWallet: newBal, currency: 'NGN', userId: ord.buyerId, updatedAt: serverTime },
          { merge: true }
        );
        tx.set(buyerUserRef, { depositWallet: newBal, updatedAt: serverTime }, { merge: true });

        const refundRef = `MKT-SOLDOUT-REF-${orderId}`;
        const refundTx = {
          type: 'deposit',
          status: 'completed',
          credited: true,
          amount: refundNgn,
          currency: 'NGN',
          reference: refundRef,
          userId: ord.buyerId,
          hub: 'MODERN_MARKET',
          gateway: 'efado_escrow',
          method: 'Auto Refund',
          purpose: `Marketplace Auto-Refund (Sold Out) +${formatNairaPlain(refundNgn)}`,
          orderId,
          createdAtIso: nowIso,
          timestamp: serverTime,
          updatedAt: serverTime
        };
        tx.set(db.doc(`transactions/${refundRef}`), refundTx, { merge: true });
        tx.set(db.doc(`wallets/${ord.buyerId}/transactions/${refundRef}`), refundTx, { merge: true });

        const hist = Array.isArray(ord.trackingHistory) ? [...ord.trackingHistory] : [];
        hist.push({
          step: 'REFUNDED',
          label: 'Auto-Refunded (Item Sold Out)',
          description: `${formatNairaPlain(refundNgn)} was instantly refunded to your EFADO Wallet because the last unit sold out.`,
          at: nowIso
        });
        tx.set(
          orderRef,
          {
            status: 'REFUNDED',
            escrowStatus: 'REFUNDED',
            paymentReference: reference,
            paymentGateway: gateway,
            trackingHistory: hist,
            updatedAt: nowIso
          },
          { merge: true }
        );
        return;
      }

      // Decrement stock safely
      for (const pr of prodReads) {
        const pd = pr.snap.data() || {};
        const nextStock = Math.max(0, Number(pd.stock || 0) - pr.qty);
        const nextSales = Number(pd.salesCount || 0) + pr.qty;
        tx.set(
          pr.ref,
          {
            stock: nextStock,
            salesCount: nextSales,
            status: nextStock === 0 ? 'SOLD' : 'ACTIVE',
            soldAt: nextStock === 0 ? nowIso : pd.soldAt || null,
            updatedAt: nowIso
          },
          { merge: true }
        );
      }

      const history = Array.isArray(ord.trackingHistory) ? [...ord.trackingHistory] : [];
      history.push({
        step: 'PAID',
        label: 'Paid & Protected by EFADO Escrow',
        description: `${formatNairaPlain(ord.grandTotal)} held safely in Escrow via ${gateway.toUpperCase()}. Pickup Code: ${pickupCode}.`,
        at: nowIso
      });

      tx.set(
        orderRef,
        {
          status: 'PAID_ESCROW_HELD',
          escrowStatus: 'HELD',
          escrowHeldAt: nowIso,
          autoReleaseAt,
          pickupCode,
          paymentGateway: gateway,
          paymentReference: reference,
          ...(gatewayTransactionId ? { gatewayTransactionId: String(gatewayTransactionId) } : {}),
          trackingHistory: history,
          updatedAt: nowIso
        },
        { merge: true }
      );
      tx.set(
        db.doc(`pendingMarketplacePayments/${reference}`),
        { status: 'completed', completedAt: nowIso },
        { merge: true }
      );
    });

    const finalSnap = await orderRef.get();
    const finalOrder = finalSnap.exists ? finalSnap.data() : existingOrder;

    if (soldOutConflict) {
      await createMarketAlert({
        userId: existingOrder.buyerId,
        type: 'ORDER',
        title: 'Item Just Sold Out - Full Refund Issued',
        message: `Sorry, ${existingOrder.productName} sold out during checkout. Your ${formatNairaPlain(existingOrder.grandTotal)} was refunded to your EFADO Wallet.`,
        orderId
      });
      return { order: finalOrder, soldOutRefunded: true };
    }

    await Promise.all([
      createMarketAlert({
        userId: existingOrder.buyerId,
        type: 'ORDER',
        title: 'Payment Successful - Escrow Active',
        message: `Order ${orderId} confirmed! Pickup Code: ${pickupCode}. Money stays protected until you confirm delivery.`,
        orderId
      }),
      createMarketAlert({
        userId: existingOrder.sellerId,
        type: 'SELLER_SALE',
        title: 'New Paid Order! Ship Now',
        message: `${existingOrder.productName} (Qty: ${existingOrder.quantity}) paid in Escrow. Pickup Code ${pickupCode}. Please ship within 24h.`,
        orderId
      }),
      writeAuditLog('ORDER_PAID_GATEWAY', existingOrder.buyerId, {
        orderId,
        gateway,
        reference,
        amountNgn: existingOrder.grandTotal
      })
    ]);

    return { order: finalOrder, soldOutRefunded: false };
  } finally {
    releaseInFlightLock(lockKey);
  }
}

let schedulerStarted = false;
export function startMarketplaceScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;
  setTimeout(() => {
    runMarketplaceLifecycleMaintenance().catch(() => {});
  }, 15000);
  setInterval(() => {
    runMarketplaceLifecycleMaintenance().catch(() => {});
  }, 60 * 60 * 1000);
}

export function registerMarketplaceRoutes(app: Express) {
  startMarketplaceScheduler();

  // =========================================================================
  // 0. MARKETPLACE WEBHOOK INTERCEPTORS (Run BEFORE wallet-routes webhooks)
  // Pass through via next() if the webhook is NOT for a marketplace order!
  // =========================================================================
  app.post('/api/webhooks/paystack', async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      const payload = req.body || {};
      const data = payload.data || {};
      const reference = String(data.reference || '').trim();
      const kind = String(data.metadata?.kind || '').trim();
      const isMarketplace = kind === 'marketplace_order' || reference.startsWith('MKT-');
      if (!isMarketplace) return next();

      const signature = String(req.headers['x-paystack-signature'] || '');
      const rawBody = req.rawBody || JSON.stringify(payload);
      if (!verifyPaystackSignature(rawBody, signature)) {
        return res.status(401).json({ success: false, message: 'Invalid Paystack webhook signature' });
      }

      if (payload.event === 'charge.success' && reference) {
        const verified = await verifyPaystackPayment(reference).catch(() => null);
        const vData = verified?.status && verified?.data?.status === 'success' ? verified.data : data;
        if (vData.status === 'success') {
          await finalizeExternalOrderPayment({
            reference,
            gateway: 'paystack',
            paidAmountKobo: Number(vData.amount || 0),
            currency: String(vData.currency || 'NGN')
          });
        }
      }
      return res.json({ success: true });
    } catch (err: any) {
      console.error('[Marketplace Paystack Webhook Error]:', err);
      return res.status(200).json({ success: true });
    }
  });

  app.post('/api/webhooks/flutterwave', async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      const payload = req.body || {};
      const data = payload.data || payload;
      const txRef = String(data.tx_ref || payload.tx_ref || '').trim();
      const kind = String(data.meta?.kind || '').trim();
      const isMarketplace = kind === 'marketplace_order' || txRef.startsWith('MKT-');
      if (!isMarketplace) return next();

      const verifHash = String(req.headers['verif-hash'] || '').trim();
      const expected = (process.env.FLW_VERIFY_HASH || 'efadowallet2026secureconnecthubsoperation').trim();
      if (!verifHash || verifHash !== expected) {
        return res.status(401).json({ success: false, message: 'Unauthorized Flutterwave webhook signature' });
      }

      const status = String(data.status || '').toLowerCase();
      if (txRef && (status === 'successful' || status === 'completed')) {
        await finalizeExternalOrderPayment({
          reference: txRef,
          gateway: 'flutterwave',
          paidAmountKobo: toMinorUnits(Number(data.amount || 0)),
          currency: String(data.currency || 'NGN')
        });
      }
      return res.json({ success: true });
    } catch (err: any) {
      console.error('[Marketplace Flutterwave Webhook Error]:', err);
      return res.status(200).json({ success: true });
    }
  });

  // Hourly Cron Sweep Endpoint (SOLD >24h -> Sold Archive, DELIVERED >48h -> Auto-Release Escrow)
  app.get('/api/marketplace/cron', async (_req: Request, res: Response) => {
    try {
      const result = await runMarketplaceLifecycleMaintenance();
      return res.json({
        success: true,
        ...result,
        ranAt: new Date().toISOString()
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Lifecycle cron sweep failed.' });
    }
  });

  // =========================================================================
  // 1. PRODUCT CATALOG, SEARCH, FILTERS, SOLD ARCHIVE, WAITLIST & RELIST
  // =========================================================================
  app.get('/api/marketplace/products', async (req: Request, res: Response) => {
    try {
      await ensureSeedCatalog();
      // Opportunistic 24h archive check
      await runMarketplaceLifecycleMaintenance().catch(() => {});

      const optionalUser = await verifyBearerUser(req).catch(() => null);
      const db = getServerDb();
      const snap = await db.collection('modern_market_products').get();

      const category = String(req.query.category || 'All').trim();
      const search = String(req.query.search || '').trim().toLowerCase();
      const brand = String(req.query.brand || '').trim().toLowerCase();
      const location = String(req.query.location || '').trim().toLowerCase();
      const freeDelivery = String(req.query.freeDelivery || '').toLowerCase() === 'true';
      const priceMin = Number(req.query.priceMin || 0);
      const priceMax = Number(req.query.priceMax || 0);
      const sort = String(req.query.sort || 'newest').trim();
      const includeArchivedMine = String(req.query.sellerMine || '').toLowerCase() === 'true';
      const page = Math.max(1, Number(req.query.page || 1));
      const limitCount = Math.min(50, Math.max(1, Number(req.query.limit || 24)));

      const nowMs = Date.now();
      let list: any[] = [];
      snap.forEach((d: any) => {
        const raw = { id: d.id, ...d.data() };
        // Strictly Modern Day Market only (Brand New)
        if (raw.condition !== 'BRAND_NEW') return;

        if (includeArchivedMine && optionalUser) {
          if (raw.sellerId === optionalUser.uid || (optionalUser.email && ADMIN_EMAILS.has(optionalUser.email.toLowerCase()) && isOfficialSeedSeller(raw.sellerId))) {
            list.push(sanitizeProductForPublic(raw, optionalUser.uid));
          }
          return;
        }

        if (raw.status === 'ARCHIVED') return;
        if (raw.status === 'SOLD' || Number(raw.stock || 0) === 0) {
          const soldAtMs = raw.soldAt ? new Date(raw.soldAt).getTime() : nowMs;
          if (nowMs - soldAtMs > TWENTY_FOUR_HOURS_MS) return;
        }
        list.push(sanitizeProductForPublic(raw, optionalUser?.uid));
      });

      if (!includeArchivedMine) {
        if (category && category !== 'All') {
          list = list.filter((p) => String(p.category || '').toLowerCase() === category.toLowerCase());
        }
        if (search) {
          list = list.filter((p) => {
            const hay = `${p.name} ${p.brand} ${p.category} ${p.description} ${p.sellerName} ${p.sellerLocation}`.toLowerCase();
            return hay.includes(search);
          });
        }
        if (brand && brand !== 'all') {
          list = list.filter((p) => String(p.brand || '').toLowerCase() === brand);
        }
        if (location && location !== 'all') {
          list = list.filter((p) => String(p.sellerLocation || '').toLowerCase().includes(location));
        }
        if (freeDelivery) {
          list = list.filter((p) => p.freeDelivery === true);
        }
        if (priceMin > 0) {
          list = list.filter((p) => p.price >= priceMin);
        }
        if (priceMax > 0) {
          list = list.filter((p) => p.price <= priceMax);
        }
      }

      // Active items come before SOLD items on Home unless specifically sorting by price
      list.sort((a, b) => {
        if (sort === 'price_asc') return a.priceKobo - b.priceKobo;
        if (sort === 'price_desc') return b.priceKobo - a.priceKobo;
        if (sort === 'popular') return (b.salesCount || 0) - (a.salesCount || 0);
        // newest: keep active items first, then newest
        if (a.status !== b.status) return a.status === 'ACTIVE' ? -1 : 1;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

      const total = list.length;
      const start = (page - 1) * limitCount;
      const paged = list.slice(start, start + limitCount);

      return res.json({
        success: true,
        products: paged,
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limitCount))
      });
    } catch (err: any) {
      console.error('[Marketplace Products GET Error]:', err);
      return res.status(500).json({ success: false, message: err?.message || 'Failed to load products.' });
    }
  });

  app.get('/api/marketplace/products/:id', async (req: Request, res: Response) => {
    try {
      await ensureSeedCatalog();
      const optionalUser = await verifyBearerUser(req).catch(() => null);
      const id = String(req.params.id || '').trim();
      const db = getServerDb();
      const snap = await db.doc(`modern_market_products/${id}`).get();
      if (!snap.exists) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }
      const raw = { id: snap.id, ...snap.data() };
      const sellerSnap = await db.doc(`modern_market_sellers/${raw.sellerId}`).get();
      const seller = stripSellerSensitiveFields(
        sellerSnap.exists
          ? sellerSnap.data()
          : {
              sellerId: raw.sellerId,
              storeName: raw.sellerName,
              verified: raw.sellerVerified,
              rating: raw.sellerRating,
              salesCount: raw.sellerSalesCount,
              location: raw.sellerLocation,
              joinedAt: raw.sellerJoinedAt
            }
      );

      const revSnap = await db.collection('modern_market_reviews').where('productId', '==', id).get();
      const reviews: any[] = [];
      revSnap.forEach((r: any) => reviews.push({ id: r.id, ...r.data() }));
      reviews.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      return res.json({
        success: true,
        product: sanitizeProductForPublic(raw, optionalUser?.uid),
        seller,
        reviews
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to load product.' });
    }
  });

  app.post('/api/marketplace/products', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const body = req.body || {};
      const name = String(body.name || '').trim();
      const brand = String(body.brand || '').trim() || 'Genuine';
      const category = String(body.category || '').trim();
      const price = Number(body.price || 0);
      const stock = Math.floor(Number(body.stock || 0));
      const warrantyMonths = Math.max(1, Math.floor(Number(body.warrantyMonths || 12)));
      const description = String(body.description || '').trim();
      const freeDelivery = Boolean(body.freeDelivery);
      const deliveryFee = freeDelivery ? 0 : Math.max(0, Number(body.deliveryFee || 0));
      const rawPhotos = Array.isArray(body.photos)
        ? body.photos.filter((p: any) => typeof p === 'string' && p.trim()).map((p: string) => p.trim())
        : [];
      const photos = rawPhotos.slice(0, 5);

      if (!name || !category || !Number.isFinite(price) || price <= 0 || stock < 1) {
        return res.status(400).json({
          success: false,
          message: 'Product name, category, positive NGN price, and stock (>= 1) are required.'
        });
      }

      const totalPhotoBytes = photos.reduce((sum: number, p: string) => sum + Buffer.byteLength(p, 'utf8'), 0);
      if (totalPhotoBytes > 850 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'Uploaded product photos are too large combined. Please use smaller images (up to 5 photos).'
        });
      }

      const db = getServerDb();
      const nowIso = new Date().toISOString();
      const [sellerSnap, userSnap, isAdmin] = await Promise.all([
        db.doc(`modern_market_sellers/${user.uid}`).get(),
        db.doc(`users/${user.uid}`).get(),
        isAdminUser(user.uid, user.email)
      ]);
      const uData = userSnap.exists ? userSnap.data() || {} : {};
      const sellerExisting = sellerSnap.exists ? sellerSnap.data() || {} : null;

      const isSellerVerified =
        isAdmin ||
        Boolean(
          sellerExisting &&
            (sellerExisting.verified === true || sellerExisting.applicationStatus === 'APPROVED')
        );

      if (!isSellerVerified) {
        const statusMsg =
          sellerExisting?.applicationStatus === 'PENDING_APPROVAL'
            ? 'Your Vendor Registration is Pending Approval. You can list products once Admin approves your store.'
            : 'Only Verified Vendors can list products. Complete Vendor Registration first.';
        return res.status(403).json({
          success: false,
          code: 'VENDOR_NOT_VERIFIED',
          message: statusMsg
        });
      }

      const sellerData = sellerExisting
        ? sellerExisting
        : {
            sellerId: user.uid,
            storeName: body.storeName || uData.displayName || user.name || 'EFADO Official Merchant',
            verified: true,
            applicationStatus: 'APPROVED',
            rating: 5.0,
            salesCount: 0,
            location: body.location || 'Lagos, Nigeria',
            storeAddress: body.storeAddress || 'EFADO Official Hub',
            joinedAt: nowIso,
            payoutPreference: 'wallet'
          };

      if (!sellerExisting && isAdmin) {
        await db.doc(`modern_market_sellers/${user.uid}`).set(sellerData, { merge: true });
      }

      const parseList = (v: any): string[] => {
        if (Array.isArray(v)) return v.map((x) => String(x || '').trim()).filter(Boolean);
        if (typeof v === 'string') return v.split(',').map((x) => x.trim()).filter(Boolean);
        return [];
      };

      const specColor = String(body.specs?.color || '').trim();
      const colorsAvailable = parseList(body.specs?.colorsAvailable);
      if (colorsAvailable.length === 0 && specColor) {
        colorsAvailable.push(specColor);
      }
      const sizesAvailable = parseList(body.specs?.sizesAvailable);

      const id = `prod_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const productDoc = {
        id,
        sellerId: user.uid,
        sellerName: sellerData.storeName,
        sellerVerified: true,
        sellerRating: Number(sellerData.rating ?? 4.9),
        sellerSalesCount: Number(sellerData.salesCount ?? 0),
        sellerLocation: String(body.location || sellerData.location || 'Lagos, Nigeria').trim(),
        sellerJoinedAt: sellerData.joinedAt || nowIso,
        name,
        brand,
        price,
        priceKobo: toMinorUnits(price),
        stock,
        category,
        condition: 'BRAND_NEW', // Locked: Modern Market accepts Brand New - Sealed only
        warrantyMonths,
        photos: photos.length > 0 ? photos : ['/assets/market/iphone_13_pro_max.jpg'],
        description:
          description ||
          `Brand New factory sealed ${name} with ${warrantyMonths} months manufacturer warranty and 7-day return protection.`,
        specs: {
          ram: String(body.specs?.ram || '').trim() || 'Standard',
          storage: String(body.specs?.storage || '').trim() || 'Factory Sealed',
          color: specColor || colorsAvailable[0] || 'Original',
          battery: String(body.specs?.battery || '').trim() || 'Full Capacity',
          model: String(body.specs?.model || '').trim() || brand,
          colorsAvailable,
          sizesAvailable
        },
        freeDelivery,
        deliveryFee,
        deliveryFeeKobo: toMinorUnits(deliveryFee),
        estimatedDelivery: body.estimatedDelivery || 'Arrives Tomorrow',
        returnDays: 7,
        rating: 5.0,
        reviewsCount: 0,
        salesCount: 0,
        status: 'ACTIVE',
        soldAt: null,
        waitlist: [],
        createdAt: nowIso,
        updatedAt: nowIso
      };

      await db.doc(`modern_market_products/${id}`).set(productDoc);
      return res.json({ success: true, product: sanitizeProductForPublic(productDoc, user.uid) });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to publish product.' });
    }
  });

  app.post('/api/marketplace/products/:id/relist', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const id = String(req.params.id || '').trim();
      const stock = Math.max(1, Math.floor(Number(req.body?.stock || 5)));
      const newPrice = Number(req.body?.price || 0);

      const db = getServerDb();
      const prodRef = db.doc(`modern_market_products/${id}`);
      const snap = await prodRef.get();
      if (!snap.exists) return res.status(404).json({ success: false, message: 'Product not found.' });

      const prod = snap.data() || {};
      const isAdmin = await isAdminUser(user.uid, user.email);
      if (prod.sellerId !== user.uid && !(isAdmin && isOfficialSeedSeller(prod.sellerId))) {
        return res.status(403).json({ success: false, message: 'Only the product seller can relist this item.' });
      }

      const nowIso = new Date().toISOString();
      const waitlist: any[] = Array.isArray(prod.waitlist) ? prod.waitlist : [];
      const priceToUse = Number.isFinite(newPrice) && newPrice > 0 ? newPrice : Number(prod.price);

      await prodRef.set(
        {
          stock,
          price: priceToUse,
          priceKobo: toMinorUnits(priceToUse),
          status: 'ACTIVE',
          soldAt: null,
          archivedAt: null,
          waitlist: [],
          updatedAt: nowIso
        },
        { merge: true }
      );

      // Alert every user on the waitlist
      for (const entry of waitlist) {
        const targetUid = typeof entry === 'string' ? entry : entry?.userId;
        if (!targetUid) continue;
        await createMarketAlert({
          userId: targetUid,
          type: 'WAITLIST',
          title: 'Back In Stock!',
          message: `${prod.name} is back in stock (${stock} brand new units available at ${formatNairaPlain(priceToUse)}). Tap to buy before it sells out!`,
          productId: id
        });
        await createWalletAlert(
          targetUid,
          'reward',
          'Waitlist Item Restocked',
          `${prod.name} is back in stock in Modern Day Market!`,
          { productId: id }
        );
      }

      const updated = await prodRef.get();
      return res.json({
        success: true,
        notifiedCount: waitlist.length,
        product: sanitizeProductForPublic({ id, ...updated.data() }, user.uid),
        message: `Product relisted with ${stock} units. Notified ${waitlist.length} waitlisted buyer(s).`
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to relist product.' });
    }
  });

  app.post('/api/marketplace/product/notify-me', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Sign in to join the restock waitlist.' });

      const productId = String(req.body?.productId || '').trim();
      if (!productId) return res.status(400).json({ success: false, message: 'productId is required.' });

      const db = getServerDb();
      const prodRef = db.doc(`modern_market_products/${productId}`);
      const snap = await prodRef.get();
      if (!snap.exists) return res.status(404).json({ success: false, message: 'Product not found.' });

      const prod = snap.data() || {};
      const waitlist: any[] = Array.isArray(prod.waitlist) ? [...prod.waitlist] : [];
      const already = waitlist.some((w) => (typeof w === 'string' ? w === user.uid : w?.userId === user.uid));
      if (!already) {
        waitlist.push({ userId: user.uid, email: user.email, addedAt: new Date().toISOString() });
        await prodRef.set({ waitlist, updatedAt: new Date().toISOString() }, { merge: true });
      }

      return res.json({
        success: true,
        isOnWaitlist: true,
        waitlistCount: waitlist.length,
        message: "You're on the waitlist! We'll alert you immediately when this item is relisted."
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Could not subscribe to waitlist.' });
    }
  });

  app.post('/api/marketplace/product/sold-archive', async (_req: Request, res: Response) => {
    try {
      const result = await runMarketplaceLifecycleMaintenance();
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Archive sweep failed.' });
    }
  });

  // =========================================================================
  // 2. PIN STATUS & OTP PIN RESET (Uses wallets/{uid}/security/config)
  // =========================================================================
  app.get('/api/marketplace/pin/status', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const db = getServerDb();
      const [secSnap, walletSnap] = await Promise.all([
        db.doc(`wallets/${user.uid}/security/config`).get(),
        db.doc(`wallets/${user.uid}/NGN/depositWallet`).get()
      ]);
      const sec = secSnap.exists ? secSnap.data() || {} : {};
      const walletBal = walletSnap.exists ? Number(walletSnap.data()?.balance ?? walletSnap.data()?.depositWallet ?? 0) : 0;

      const lockedUntil = Number(sec.pinLockedUntil || 0);
      const isLocked = lockedUntil > Date.now();

      return res.json({
        success: true,
        hasPin: Boolean(sec.pinHash),
        biometricEnabled: Boolean(sec.biometricEnabled),
        isLocked,
        lockedMinutesRemaining: isLocked ? Math.ceil((lockedUntil - Date.now()) / 60000) : 0,
        ngnBalance: walletBal,
        ngnBalanceKobo: toMinorUnits(walletBal)
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to check security status.' });
    }
  });

  app.post('/api/marketplace/pin/reset-request', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const rl = checkRateLimit(`mkt_pin_reset_req:${user.uid}`, 4, 10 * 60 * 1000);
      if (!rl.allowed) {
        return res.status(429).json({ success: false, message: `Wait ${rl.retryAfterSec}s before requesting another code.` });
      }

      const db = getServerDb();
      const userSnap = await db.doc(`users/${user.uid}`).get();
      const uData = userSnap.exists ? userSnap.data() || {} : {};
      const otp = generateNumericOtp();

      await db.doc(`wallets/${user.uid}/security/marketplace_pin_reset_otp`).set({
        otpHash: hashOtp(otp),
        expiresAt: Date.now() + 10 * 60 * 1000,
        createdAt: new Date().toISOString()
      });

      const delivery = await sendSecurityOtpDelivery({
        email: uData.email || user.email,
        phoneNumber: uData.phoneNumber || uData.phone || '',
        otp,
        reason: 'EFADO Transaction PIN Reset'
      });

      return res.json({
        success: true,
        sent: delivery.sent,
        channels: delivery.channels,
        maskedEmail: delivery.maskedEmail,
        maskedPhone: delivery.maskedPhone,
        message: delivery.sent
          ? `6-digit OTP sent to ${delivery.maskedEmail || delivery.maskedPhone}.`
          : '6-digit verification requested. Ensure your verified email or phone is configured for OTP delivery.'
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to initiate PIN reset.' });
    }
  });

  app.post('/api/marketplace/pin/reset-confirm', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const { otp, newPin } = req.body || {};
      const cleanOtp = String(otp || '').trim();
      const cleanPin = String(newPin || '').trim();
      if (!/^\d{6}$/.test(cleanOtp)) {
        return res.status(400).json({ success: false, message: 'Enter the 6-digit verification code sent to your Email/SMS.' });
      }
      if (!/^\d{4}$/.test(cleanPin)) {
        return res.status(400).json({ success: false, message: 'New Transaction PIN must be exactly 4 digits.' });
      }

      const db = getServerDb();
      const otpRef = db.doc(`wallets/${user.uid}/security/marketplace_pin_reset_otp`);
      const otpSnap = await otpRef.get();
      if (!otpSnap.exists) {
        return res.status(400).json({ success: false, message: 'No active PIN reset request found. Request a new OTP.' });
      }
      const otpData = otpSnap.data() || {};
      if (Date.now() > Number(otpData.expiresAt || 0)) {
        return res.status(400).json({ success: false, message: 'OTP expired. Request a new code.' });
      }
      if (hashOtp(cleanOtp) !== otpData.otpHash) {
        return res.status(403).json({ success: false, message: 'Invalid verification code.' });
      }

      await db.doc(`wallets/${user.uid}/security/config`).set(
        {
          pinHash: hashPin(cleanPin),
          pinFailedAttempts: 0,
          pinLockedUntil: 0,
          updatedAt: getServerTimestamp()
        },
        { merge: true }
      );
      await db.doc(`users/${user.uid}`).set({ hasTransactionPin: true }, { merge: true });
      await otpRef.delete().catch(() => {});
      await recordSecurityEvent(user.uid, 'PIN_RESET_OTP', '4-digit Transaction PIN reset via OTP', req);

      return res.json({ success: true, message: 'Your 4-digit EFADO Transaction PIN has been updated.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Could not reset PIN.' });
    }
  });

  // =========================================================================
  // 3. CART STOCK CHECK, ORDER CREATION, AUTHORIZATION (PIN + >₦100K OTP), PAYMENT & VERIFY
  // =========================================================================
  app.post('/api/marketplace/cart/check-stock', async (req: Request, res: Response) => {
    try {
      const { items } = req.body || {};
      if (!Array.isArray(items) || items.length === 0) {
        return res.json({ success: true, allAvailable: true, blockedMessage: null, items: [] });
      }

      const db = getServerDb();
      const results: any[] = [];
      let allAvailable = true;
      let blockedMessage: string | null = null;

      for (const reqItem of items.slice(0, 40)) {
        const productId = String(reqItem?.productId || '').trim();
        const requestedQty = Math.max(1, Math.floor(Number(reqItem?.quantity || 1)));
        if (!productId) continue;

        const pSnap = await db.doc(`modern_market_products/${productId}`).get();
        if (!pSnap.exists) {
          allAvailable = false;
          blockedMessage = blockedMessage || 'Sorry, this item just sold out';
          results.push({
            productId,
            exists: false,
            available: false,
            soldOut: true,
            availableStock: 0,
            requestedQty,
            reason: 'Sorry, this item just sold out',
            product: null
          });
          continue;
        }

        const pd = { id: pSnap.id, ...(pSnap.data() || {}) };
        const cleanProduct = sanitizeProductForPublic(pd);
        const liveStock = Number(cleanProduct.stock || 0);
        const isActiveBrandNew = pd.status === 'ACTIVE' && pd.condition === 'BRAND_NEW';
        const isSoldOut = !isActiveBrandNew || liveStock < 1;
        const available = isActiveBrandNew && liveStock >= requestedQty;

        let reason: string | null = null;
        if (isSoldOut) {
          reason = 'Sorry, this item just sold out';
        } else if (!available) {
          reason = `Only ${liveStock} left in stock for ${cleanProduct.name}`;
        }

        if (!available) {
          allAvailable = false;
          if (!blockedMessage) {
            blockedMessage = isSoldOut ? 'Sorry, this item just sold out' : reason;
          }
        }

        results.push({
          productId,
          exists: true,
          available,
          soldOut: isSoldOut,
          availableStock: liveStock,
          requestedQty,
          reason,
          product: cleanProduct
        });
      }

      return res.json({
        success: true,
        allAvailable,
        blockedMessage,
        items: results
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err?.message || 'Could not verify live product stock.'
      });
    }
  });

  app.post('/api/marketplace/order/create', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Please sign in to place an order.' });

      const { items, deliveryMethod, recipientName, recipientPhone, address } = req.body || {};
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Your cart is empty.' });
      }

      const validDeliveryMethods = new Set(['DELIVERY', 'PICKUP_OFFICE', 'PICKUP_SELLER']);
      if (!validDeliveryMethods.has(deliveryMethod)) {
        return res.status(400).json({ success: false, message: 'Choose a valid Delivery or Pickup option.' });
      }

      const cleanName = String(recipientName || '').trim();
      const cleanPhone = String(recipientPhone || '').trim();
      if (!cleanName || cleanPhone.length < 7) {
        return res.status(400).json({ success: false, message: 'Recipient Full Name and Phone Number are required.' });
      }

      if (deliveryMethod === 'DELIVERY') {
        if (!address?.state?.trim() || !address?.city?.trim() || !address?.street?.trim()) {
          return res.status(400).json({
            success: false,
            message: 'State, City, and Street Address are required for home delivery.'
          });
        }
      }

      const db = getServerDb();
      const resolvedItems: any[] = [];
      let subtotalKobo = 0;
      let deliveryFeeKobo = 0;

      for (const reqItem of items) {
        const productId = String(reqItem?.productId || '').trim();
        const qty = Math.floor(Number(reqItem?.quantity || 0));
        if (!productId || qty < 1) {
          return res.status(400).json({ success: false, message: 'Invalid item quantity.' });
        }
        const pSnap = await db.doc(`modern_market_products/${productId}`).get();
        if (!pSnap.exists) {
          return res.status(404).json({ success: false, message: 'One or more products were not found.' });
        }
        const pd = pSnap.data() || {};
        if (pd.condition !== 'BRAND_NEW') {
          return res.status(400).json({ success: false, message: 'Only Brand New products are allowed in Modern Day Market.' });
        }
        if (pd.status !== 'ACTIVE' || Number(pd.stock || 0) < qty) {
          return res.status(409).json({
            success: false,
            code: 'SOLD_OUT',
            message: `Sorry, this item just sold out (${pd.name || productId}).`
          });
        }

        const unitPriceKobo = Number(pd.priceKobo || toMinorUnits(Number(pd.price || 0)));
        subtotalKobo += unitPriceKobo * qty;
        if (deliveryMethod === 'DELIVERY' && !pd.freeDelivery) {
          deliveryFeeKobo = Math.max(deliveryFeeKobo, Number(pd.deliveryFeeKobo || toMinorUnits(Number(pd.deliveryFee || 0))));
        }

        resolvedItems.push({
          productId,
          productName: pd.name,
          productPhoto: (Array.isArray(pd.photos) && pd.photos[0]) || '/assets/market/iphone_13_pro_max.jpg',
          sellerId: pd.sellerId,
          sellerName: pd.sellerName,
          sellerVerified: Boolean(pd.sellerVerified ?? true),
          quantity: qty,
          unitPriceKobo,
          unitPrice: fromMinorUnits(unitPriceKobo),
          selectedColor: reqItem.selectedColor || pd.specs?.color || '',
          selectedSize: reqItem.selectedSize || ''
        });
      }

      const serviceChargeKobo = Math.round(subtotalKobo * SERVICE_CHARGE_RATE);
      const grandTotalKobo = subtotalKobo + serviceChargeKobo + deliveryFeeKobo;
      const primary = resolvedItems[0];
      const orderId = `ORD-${crypto.randomInt(100000, 999999)}`;
      const nowIso = new Date().toISOString();

      const pickupLocationLabel =
        deliveryMethod === 'PICKUP_OFFICE'
          ? 'EFADO Official Delivery & Pick-Up Station (Warri / Regional Hub)'
          : deliveryMethod === 'PICKUP_SELLER'
            ? `${primary.sellerName} Store Pickup Point`
            : `${address.street}, ${address.city}, ${address.state}`;

      const orderDoc = {
        id: orderId,
        orderId,
        buyerId: user.uid,
        buyerEmail: user.email,
        sellerId: primary.sellerId,
        sellerName: primary.sellerName,
        sellerVerified: primary.sellerVerified,
        productId: primary.productId,
        productName: resolvedItems.length > 1 ? `${primary.productName} (+${resolvedItems.length - 1} more)` : primary.productName,
        productPhoto: primary.productPhoto,
        items: resolvedItems,
        quantity: resolvedItems.reduce((acc, i) => acc + i.quantity, 0),
        priceKobo: primary.unitPriceKobo,
        subtotalKobo,
        subtotal: fromMinorUnits(subtotalKobo),
        serviceChargeKobo,
        serviceCharge: fromMinorUnits(serviceChargeKobo),
        deliveryFeeKobo,
        deliveryFee: fromMinorUnits(deliveryFeeKobo),
        grandTotalKobo,
        grandTotal: fromMinorUnits(grandTotalKobo),
        currency: 'NGN',
        deliveryMethod,
        recipientName: cleanName,
        recipientPhone: cleanPhone,
        address: deliveryMethod === 'DELIVERY' ? {
          state: String(address.state).trim(),
          city: String(address.city).trim(),
          street: String(address.street).trim(),
          landmark: String(address.landmark || '').trim()
        } : null,
        pickupLocationLabel,
        status: 'PENDING_PAYMENT',
        pickupCode: null,
        paymentMethod: null,
        paymentGateway: null,
        paymentReference: null,
        escrowStatus: 'NONE',
        trackingHistory: [
          {
            step: 'ORDERED',
            label: 'Order Created',
            description: 'Waiting for payment authorization.',
            at: nowIso
          }
        ],
        createdAt: nowIso,
        updatedAt: nowIso
      };

      await db.doc(`modern_market_orders/${orderId}`).set(orderDoc);
      await writeAuditLog('ORDER_CREATED', user.uid, {
        orderId,
        sellerId: primary.sellerId,
        productName: orderDoc.productName,
        amountNgn: orderDoc.grandTotal,
        deliveryMethod
      });
      return res.json({ success: true, order: sanitizeOrderForViewer(orderDoc) });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to create order.' });
    }
  });

  app.post('/api/marketplace/order/authorize', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const rl = checkRateLimit(`mkt_auth:${user.uid}`, 10, 5 * 60 * 1000);
      if (!rl.allowed) {
        return res.status(429).json({ success: false, message: `Too many attempts. Wait ${rl.retryAfterSec}s.` });
      }

      const { orderId, pin, otp } = req.body || {};
      const cleanOrderId = String(orderId || '').trim();
      const cleanPin = String(pin || '').trim();
      const cleanOtp = String(otp || '').trim();

      if (!cleanOrderId) {
        return res.status(400).json({ success: false, message: 'orderId is required.' });
      }
      if (!/^\d{4}$/.test(cleanPin)) {
        return res.status(400).json({ success: false, message: 'Enter your 4-digit EFADO Transaction PIN.' });
      }

      const db = getServerDb();
      const orderRef = db.doc(`modern_market_orders/${cleanOrderId}`);
      const secRef = db.doc(`wallets/${user.uid}/security/config`);

      const [orderSnap, secSnap, userSnap] = await Promise.all([
        orderRef.get(),
        secRef.get(),
        db.doc(`users/${user.uid}`).get()
      ]);

      if (!orderSnap.exists) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }
      const order = orderSnap.data() || {};
      if (order.buyerId !== user.uid) {
        return res.status(403).json({ success: false, message: 'You are not authorized for this order.' });
      }

      // Live stock check before accepting PIN
      const items: any[] = Array.isArray(order.items) && order.items.length > 0
        ? order.items
        : [{ productId: order.productId, quantity: order.quantity || 1 }];
      for (const it of items) {
        const pSnap = await db.doc(`modern_market_products/${it.productId}`).get();
        const pd = pSnap.exists ? pSnap.data() || {} : null;
        if (!pd || pd.status !== 'ACTIVE' || Number(pd.stock || 0) < Number(it.quantity || 1)) {
          return res.status(409).json({
            success: false,
            code: 'SOLD_OUT',
            message: 'Sorry, this item just sold out'
          });
        }
      }

      const sec = secSnap.exists ? secSnap.data() || {} : {};
      const lockedUntil = Number(sec.pinLockedUntil || 0);
      if (lockedUntil > Date.now()) {
        const mins = Math.ceil((lockedUntil - Date.now()) / 60000);
        return res.status(423).json({
          success: false,
          code: 'PIN_LOCKED',
          message: `Transaction PIN locked due to multiple wrong attempts. Try again in ${mins} minute(s).`
        });
      }

      if (!sec.pinHash) {
        return res.status(400).json({
          success: false,
          code: 'PIN_NOT_SET',
          message: 'No Transaction PIN set yet. Tap "Forgot PIN? Reset with OTP" below to create your 4-digit PIN.'
        });
      }

      const pinOk = verifyPinHash(cleanPin, sec.pinHash);
      if (!pinOk) {
        const nextFails = Number(sec.pinFailedAttempts || 0) + 1;
        if (nextFails >= 3) {
          const lockMs = Date.now() + 15 * 60 * 1000;
          await secRef.set({ pinFailedAttempts: 0, pinLockedUntil: lockMs }, { merge: true });
          await Promise.all([
            createWalletAlert(
              user.uid,
              'security',
              'Transaction PIN Locked (15 mins)',
              '3 wrong PIN attempts were detected during Modern Market checkout. Your PIN is locked for 15 minutes.',
              { orderId: cleanOrderId }
            ),
            createMarketAlert({
              userId: user.uid,
              type: 'SECURITY',
              title: 'Security Alert: PIN Locked for 15 Minutes',
              message: '3 wrong PIN attempts blocked on checkout. If this was not you, reset your PIN immediately.',
              orderId: cleanOrderId
            }),
            recordSecurityEvent(user.uid, 'PIN_LOCKED_3_ATTEMPTS', `Locked 15m on order ${cleanOrderId}`, req)
          ]);
          return res.status(403).json({
            success: false,
            code: 'PIN_LOCKED',
            message: '3 wrong PIN attempts. Locked for 15 minutes for your security.'
          });
        }

        await secRef.set({ pinFailedAttempts: nextFails }, { merge: true });
        return res.status(403).json({
          success: false,
          code: 'INVALID_PIN',
          remainingAttempts: 3 - nextFails,
          message: `Incorrect Transaction PIN (${3 - nextFails} attempt${3 - nextFails === 1 ? '' : 's'} remaining).`
        });
      }

      // Reset failed counter on success
      if (Number(sec.pinFailedAttempts || 0) > 0) {
        await secRef.set({ pinFailedAttempts: 0 }, { merge: true });
      }

      // High-value > ₦100,000 requires 6-digit OTP via SMS/Email
      const requiresOtp = Number(order.grandTotalKobo || 0) > HIGH_VALUE_OTP_THRESHOLD_KOBO;
      if (requiresOtp) {
        const otpRef = db.doc(`wallets/${user.uid}/security/marketplace_order_otp_${cleanOrderId}`);
        if (!cleanOtp) {
          const uData = userSnap.exists ? userSnap.data() || {} : {};
          const code = generateNumericOtp();
          await otpRef.set({
            otpHash: hashOtp(code),
            expiresAt: Date.now() + 10 * 60 * 1000,
            createdAt: new Date().toISOString()
          });
          const delivery = await sendSecurityOtpDelivery({
            email: uData.email || user.email,
            phoneNumber: uData.phoneNumber || uData.phone || order.recipientPhone || '',
            otp: code,
            reason: `High-value order ${cleanOrderId} (${formatNairaPlain(order.grandTotal)})`
          });
          return res.json({
            success: true,
            authorized: false,
            otpRequired: true,
            delivery: {
              sent: delivery.sent,
              channels: delivery.channels,
              maskedEmail: delivery.maskedEmail,
              maskedPhone: delivery.maskedPhone
            },
            message: `Orders above ₦100,000 require a 6-digit SMS/Email OTP (${delivery.maskedEmail || delivery.maskedPhone}).`
          });
        }

        const otpSnap = await otpRef.get();
        if (!otpSnap.exists) {
          return res.status(400).json({ success: false, code: 'OTP_REQUIRED', message: 'Request a 6-digit OTP first.' });
        }
        const otpRecord = otpSnap.data() || {};
        if (Date.now() > Number(otpRecord.expiresAt || 0)) {
          return res.status(400).json({ success: false, code: 'OTP_EXPIRED', message: 'OTP expired. Request a new one.' });
        }
        if (hashOtp(cleanOtp) !== otpRecord.otpHash) {
          return res.status(403).json({ success: false, code: 'INVALID_OTP', message: 'Incorrect 6-digit OTP code.' });
        }
        await otpRef.delete().catch(() => {});
      }

      const expiresAtIso = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const authToken = signOrderAuthToken(cleanOrderId, user.uid, expiresAtIso);
      await orderRef.set(
        {
          authTokenHash: crypto.createHash('sha256').update(authToken).digest('hex'),
          authTokenExpiresAt: expiresAtIso,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      return res.json({
        success: true,
        authorized: true,
        otpRequired: requiresOtp,
        authToken,
        expiresAt: expiresAtIso
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Authorization failed.' });
    }
  });

  app.post('/api/marketplace/order/pay', async (req: Request, res: Response) => {
    const user = await verifyBearerUser(req);
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const rl = checkRateLimit(`mkt_pay:${user.uid}`, 8, 5 * 60 * 1000);
    if (!rl.allowed) {
      return res.status(429).json({ success: false, message: `Too many payment requests. Wait ${rl.retryAfterSec}s.` });
    }

    const { orderId, paymentMethod, gateway, authToken, idempotencyKey, returnOrigin } = req.body || {};
    const cleanOrderId = String(orderId || '').trim();
    const cleanMethod = String(paymentMethod || '').trim().toLowerCase();
    const cleanGateway = String(gateway || (cleanMethod === 'wallet' ? 'wallet' : cleanMethod === 'opay' ? 'opay' : 'paystack')).trim().toLowerCase();

    if (!cleanOrderId || !['wallet', 'card', 'bank', 'opay'].includes(cleanMethod)) {
      return res.status(400).json({ success: false, message: 'Valid orderId and paymentMethod are required.' });
    }
    if (!idempotencyKey || String(idempotencyKey).trim().length < 6) {
      return res.status(400).json({ success: false, message: 'Missing idempotencyKey.' });
    }

    const lockKey = `mkt_pay:${cleanOrderId}`;
    if (!acquireInFlightLock(lockKey)) {
      return res.status(409).json({ success: false, message: 'Payment already processing. Please wait.' });
    }

    try {
      const db = getServerDb();
      const serverTime = getServerTimestamp();
      const nowIso = new Date().toISOString();
      const orderRef = db.doc(`modern_market_orders/${cleanOrderId}`);
      const preSnap = await orderRef.get();
      if (!preSnap.exists) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }
      const order = preSnap.data() || {};
      if (order.buyerId !== user.uid) {
        return res.status(403).json({ success: false, message: 'Access denied for this order.' });
      }
      if (order.status === 'PAID_ESCROW_HELD' || order.escrowStatus === 'HELD' || order.status === 'COMPLETED') {
        if (order.idempotencyKey === idempotencyKey) {
          return res.json({ success: true, order, paid: true });
        }
        return res.status(409).json({ success: false, message: 'This order has already been paid.' });
      }

      // Verify fresh authorization token from Step 6
      const providedHash = crypto.createHash('sha256').update(String(authToken || '')).digest('hex');
      if (
        !authToken ||
        !order.authTokenHash ||
        providedHash !== order.authTokenHash ||
        Date.now() > new Date(order.authTokenExpiresAt || 0).getTime()
      ) {
        return res.status(403).json({
          success: false,
          code: 'AUTH_REQUIRED',
          message: 'Please authorize this transaction with your 4-digit EFADO PIN first.'
        });
      }

      // WALLET PAYMENT: 100% atomic DB transaction (balance + zero-drift ledger + stock + escrow + pickupCode)
      if (cleanMethod === 'wallet') {
        const pickupCode = generatePickupCode();
        const paymentRef = `MKT-WAL-${cleanOrderId}-${Date.now()}`;
        const autoReleaseAt = new Date(Date.now() + FORTY_EIGHT_HOURS_MS).toISOString();

        try {
          await db.runTransaction(async (tx: any) => {
            const ordSnap = await tx.get(orderRef);
            if (!ordSnap.exists) throw Object.assign(new Error('Order not found.'), { status: 404 });
            const cur = ordSnap.data() || {};
            if (cur.status === 'PAID_ESCROW_HELD' || cur.escrowStatus === 'HELD') {
              throw Object.assign(new Error('This order has already been paid.'), { status: 409 });
            }

            const items: any[] = Array.isArray(cur.items) && cur.items.length > 0
              ? cur.items
              : [{ productId: cur.productId, quantity: cur.quantity || 1 }];

            const prodEntries: Array<{ ref: any; snap: any; qty: number }> = [];
            for (const it of items) {
              const pRef = db.doc(`modern_market_products/${it.productId}`);
              const pSnap = await tx.get(pRef);
              prodEntries.push({ ref: pRef, snap: pSnap, qty: Number(it.quantity || 1) });
            }

            const walletRef = db.doc(`wallets/${user.uid}/NGN/depositWallet`);
            const userRef = db.doc(`users/${user.uid}`);
            const wSnap = await tx.get(walletRef);

            for (const pr of prodEntries) {
              if (!pr.snap.exists) {
                throw Object.assign(new Error('Sorry, this item just sold out'), { status: 409, code: 'SOLD_OUT' });
              }
              const pd = pr.snap.data() || {};
              if (pd.status !== 'ACTIVE' || Number(pd.stock || 0) < pr.qty) {
                throw Object.assign(new Error('Sorry, this item just sold out'), { status: 409, code: 'SOLD_OUT' });
              }
            }

            const curBal = wSnap.exists ? Number(wSnap.data()?.balance ?? wSnap.data()?.depositWallet ?? 0) : 0;
            const curBalKobo = toMinorUnits(curBal);
            const totalKobo = Number(cur.grandTotalKobo || 0);
            if (curBalKobo < totalKobo) {
              throw Object.assign(
                new Error('Insufficient EFADO Wallet NGN balance. Fund Wallet or choose Card / Bank Transfer.'),
                { status: 400, code: 'INSUFFICIENT_BALANCE' }
              );
            }

            const nextBal = fromMinorUnits(curBalKobo - totalKobo);
            tx.set(
              walletRef,
              { balance: nextBal, depositWallet: nextBal, currency: 'NGN', userId: user.uid, updatedAt: serverTime },
              { merge: true }
            );
            tx.set(userRef, { depositWallet: nextBal, updatedAt: serverTime }, { merge: true });

            const ledgerRecord = {
              type: 'payment',
              status: 'completed',
              credited: false,
              amount: cur.grandTotal,
              currency: 'NGN',
              reference: paymentRef,
              userId: user.uid,
              hub: 'MODERN_MARKET',
              gateway: 'efado_wallet',
              method: 'EFADO Wallet',
              purpose: `Marketplace Purchase - ${cur.productName} -${formatNairaPlain(cur.grandTotal)}`,
              orderId: cleanOrderId,
              createdAtIso: nowIso,
              timestamp: serverTime,
              updatedAt: serverTime
            };
            tx.set(db.doc(`transactions/${paymentRef}`), ledgerRecord, { merge: true });
            tx.set(db.doc(`wallets/${user.uid}/transactions/${paymentRef}`), ledgerRecord, { merge: true });

            for (const pr of prodEntries) {
              const pd = pr.snap.data() || {};
              const nextStock = Math.max(0, Number(pd.stock || 0) - pr.qty);
              const nextSales = Number(pd.salesCount || 0) + pr.qty;
              tx.set(
                pr.ref,
                {
                  stock: nextStock,
                  salesCount: nextSales,
                  status: nextStock === 0 ? 'SOLD' : 'ACTIVE',
                  soldAt: nextStock === 0 ? nowIso : pd.soldAt || null,
                  updatedAt: nowIso
                },
                { merge: true }
              );
            }

            const history = Array.isArray(cur.trackingHistory) ? [...cur.trackingHistory] : [];
            history.push({
              step: 'PAID',
              label: 'Paid & Protected by EFADO Escrow',
              description: `${formatNairaPlain(cur.grandTotal)} held safely by EFADO. Pickup Code: ${pickupCode}.`,
              at: nowIso
            });

            tx.set(
              orderRef,
              {
                status: 'PAID_ESCROW_HELD',
                escrowStatus: 'HELD',
                escrowHeldAt: nowIso,
                autoReleaseAt,
                pickupCode,
                paymentMethod: 'wallet',
                paymentGateway: 'wallet',
                paymentReference: paymentRef,
                idempotencyKey,
                trackingHistory: history,
                updatedAt: nowIso
              },
              { merge: true }
            );
          });
        } catch (txErr: any) {
          return res.status(txErr?.status || 400).json({
            success: false,
            code: txErr?.code,
            message: txErr?.message || 'Wallet payment could not be completed. Your money was NOT taken.'
          });
        }

        const finalOrdSnap = await orderRef.get();
        const finalOrder = finalOrdSnap.exists ? finalOrdSnap.data() : order;

        await Promise.all([
          createMarketAlert({
            userId: user.uid,
            type: 'ORDER',
            title: 'Payment Successful - Escrow Active',
            message: `Paid ${formatNairaPlain(order.grandTotal)} for ${order.productName}. Pickup Code: ${pickupCode}.`,
            orderId: cleanOrderId
          }),
          createMarketAlert({
            userId: order.sellerId,
            type: 'SELLER_SALE',
            title: 'New Paid Order - Ship Within 24h',
            message: `${order.productName} paid via EFADO Escrow. Pickup Code: ${pickupCode}.`,
            orderId: cleanOrderId
          }),
          createWalletAlert(
            user.uid,
            'withdrawal',
            'Marketplace Purchase Protected',
            `-${formatNairaPlain(order.grandTotal)} held in EFADO Escrow for Order ${cleanOrderId}.`,
            { orderId: cleanOrderId, paymentRef }
          ),
          writeAuditLog('ORDER_PAID_WALLET', user.uid, {
            orderId: cleanOrderId,
            paymentRef,
            amountNgn: order.grandTotal
          })
        ]);

        return res.json({ success: true, paid: true, order: finalOrder });
      }

      // EXTERNAL GATEWAYS: Paystack / Flutterwave / OPay (never fake payment!)
      const items: any[] = Array.isArray(order.items) && order.items.length > 0
        ? order.items
        : [{ productId: order.productId, quantity: order.quantity || 1 }];
      for (const it of items) {
        const pSnap = await db.doc(`modern_market_products/${it.productId}`).get();
        const pd = pSnap.exists ? pSnap.data() || {} : null;
        if (!pd || pd.status !== 'ACTIVE' || Number(pd.stock || 0) < Number(it.quantity || 1)) {
          return res.status(409).json({
            success: false,
            code: 'SOLD_OUT',
            message: 'Sorry, this item just sold out'
          });
        }
      }

      const opayMerchantId = (process.env.OPAY_MERCHANT_ID || '').trim();
      const opaySecret = (process.env.OPAY_SECRET_KEY || '').trim();
      const effectiveGateway: 'paystack' | 'flutterwave' | 'opay' =
        cleanGateway === 'flutterwave'
          ? 'flutterwave'
          : cleanGateway === 'opay' && opayMerchantId && opaySecret
            ? 'opay'
            : 'paystack';

      const paymentRef = `MKT-${cleanOrderId}-${Date.now()}`;
      const baseOrigin = String(returnOrigin || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
      const callbackUrl = `${baseOrigin}/?marketplace_order=${encodeURIComponent(cleanOrderId)}&reference=${encodeURIComponent(paymentRef)}&gateway=${encodeURIComponent(effectiveGateway)}`;

      await db.doc(`pendingMarketplacePayments/${paymentRef}`).set({
        reference: paymentRef,
        orderId: cleanOrderId,
        buyerId: user.uid,
        amountKobo: order.grandTotalKobo,
        gateway: effectiveGateway,
        paymentMethod: cleanMethod,
        status: 'pending',
        createdAt: nowIso
      });

      await orderRef.set(
        {
          paymentMethod: cleanMethod,
          paymentGateway: effectiveGateway,
          paymentReference: paymentRef,
          idempotencyKey,
          updatedAt: nowIso
        },
        { merge: true }
      );

      if (effectiveGateway === 'flutterwave') {
        const flwSecret = (process.env.FLUTTERWAVE_CLIENT_SECRET || process.env.FLUTTERWAVE_SECRET_KEY || '').trim();
        if (!flwSecret) {
          return res.status(400).json({
            success: false,
            message: 'Flutterwave payment key is not configured on the server. Choose Paystack Card or EFADO Wallet.'
          });
        }
        const flwResp = await fetch('https://api.flutterwave.com/v3/payments', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${flwSecret}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tx_ref: paymentRef,
            amount: order.grandTotal,
            currency: 'NGN',
            redirect_url: callbackUrl,
            customer: {
              email: user.email,
              name: order.recipientName,
              phonenumber: order.recipientPhone
            },
            meta: {
              kind: 'marketplace_order',
              orderId: cleanOrderId,
              buyerId: user.uid
            },
            customizations: {
              title: 'EFADO Modern Market Escrow',
              description: `${order.productName} (${cleanOrderId})`
            }
          })
        });
        const flwJson: any = await flwResp.json().catch(() => ({}));
        if (!flwResp.ok || flwJson?.status !== 'success' || !flwJson?.data?.link) {
          return res.status(502).json({
            success: false,
            message: flwJson?.message || 'Could not start Flutterwave checkout. Your money was NOT taken.'
          });
        }
        return res.json({
          success: true,
          paid: false,
          gateway: 'flutterwave',
          reference: paymentRef,
          redirectUrl: flwJson.data.link
        });
      }

      if (effectiveGateway === 'opay') {
        const opayEnv = (process.env.OPAY_ENV || 'TEST').toUpperCase();
        const opayUrl =
          opayEnv === 'LIVE'
            ? 'https://api.opaycheckout.com/api/v1/international/cashier/create'
            : 'https://testapi.opaycheckout.com/api/v1/international/cashier/create';
        const opayRes = await fetch(opayUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${opaySecret}`,
            MerchantId: opayMerchantId
          },
          body: JSON.stringify({
            amount: { total: order.grandTotalKobo, currency: 'NGN' },
            reference: paymentRef,
            orderNo: paymentRef,
            country: 'NG',
            callbackUrl,
            returnUrl: callbackUrl,
            userId: user.uid,
            product: {
              name: order.productName,
              description: `EFADO Modern Market Escrow (${cleanOrderId})`
            }
          })
        });
        const opayJson: any = await opayRes.json().catch(() => ({}));
        if (opayJson?.code !== '00000' || !opayJson?.data?.cashierUrl) {
          return res.status(502).json({
            success: false,
            message: opayJson?.message || 'OPay checkout initialization failed. Your money was NOT taken.'
          });
        }
        return res.json({
          success: true,
          paid: false,
          gateway: 'opay',
          reference: paymentRef,
          redirectUrl: opayJson.data.cashierUrl
        });
      }

      // Default external gateway: Paystack (Card / Bank Transfer)
      try {
        const ps = await initializePaystackPayment(
          user.email,
          order.grandTotal,
          paymentRef,
          {
            kind: 'marketplace_order',
            orderId: cleanOrderId,
            buyerId: user.uid
          },
          callbackUrl,
          'NGN'
        );
        if (!ps?.status || !ps?.data?.authorization_url) {
          return res.status(502).json({
            success: false,
            message: ps?.message || 'Could not initialize Paystack checkout. Your money was NOT taken.'
          });
        }
        return res.json({
          success: true,
          paid: false,
          gateway: 'paystack',
          reference: paymentRef,
          redirectUrl: ps.data.authorization_url
        });
      } catch (psErr: any) {
        return res.status(psErr?.status || 502).json({
          success: false,
          message: psErr?.message || 'Paystack checkout unavailable. Your money was NOT taken.'
        });
      }
    } finally {
      releaseInFlightLock(lockKey);
    }
  });

  app.post('/api/marketplace/order/verify-payment', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const { reference, orderId, gateway, transactionId } = req.body || {};
      const cleanRef = String(reference || '').trim();
      const cleanOrderId = String(orderId || '').trim();
      if (!cleanRef && !cleanOrderId) {
        return res.status(400).json({ success: false, message: 'Payment reference or orderId is required.' });
      }

      const db = getServerDb();
      let resolvedRef = cleanRef;
      let resolvedGateway = String(gateway || 'paystack').toLowerCase();

      if (!resolvedRef && cleanOrderId) {
        const oSnap = await db.doc(`modern_market_orders/${cleanOrderId}`).get();
        if (oSnap.exists) {
          const od = oSnap.data() || {};
          if (od.buyerId !== user.uid) return res.status(403).json({ success: false, message: 'Forbidden.' });
          if (od.status === 'PAID_ESCROW_HELD' || od.escrowStatus === 'HELD' || od.status === 'COMPLETED') {
            return res.json({ success: true, order: od, soldOutRefunded: false });
          }
          resolvedRef = String(od.paymentReference || '');
          resolvedGateway = String(od.paymentGateway || resolvedGateway);
        }
      }

      if (!resolvedRef) {
        return res.status(400).json({ success: false, message: 'Missing payment reference.' });
      }

      const pendSnap = await db.doc(`pendingMarketplacePayments/${resolvedRef}`).get();
      if (!pendSnap.exists) {
        return res.status(404).json({ success: false, message: 'Payment record not found.' });
      }
      const pend = pendSnap.data() || {};
      if (pend.buyerId !== user.uid) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
      resolvedGateway = String(pend.gateway || resolvedGateway);

      if (resolvedGateway === 'flutterwave') {
        const flwSecret = (process.env.FLUTTERWAVE_CLIENT_SECRET || process.env.FLUTTERWAVE_SECRET_KEY || '').trim();
        if (!flwSecret) return res.status(400).json({ success: false, message: 'Flutterwave secret not configured.' });
        const verifyUrl = transactionId
          ? `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(String(transactionId))}/verify`
          : `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(resolvedRef)}`;
        const flwRes = await fetch(verifyUrl, { headers: { Authorization: `Bearer ${flwSecret}` } });
        const flwData: any = await flwRes.json().catch(() => ({}));
        if (!flwRes.ok || flwData?.status !== 'success' || String(flwData?.data?.status || '').toLowerCase() !== 'successful') {
          return res.status(400).json({
            success: false,
            message: flwData?.message || 'Flutterwave payment could not be confirmed.'
          });
        }
        const finalized = await finalizeExternalOrderPayment({
          reference: resolvedRef,
          gateway: 'flutterwave',
          paidAmountKobo: toMinorUnits(Number(flwData.data.amount || 0)),
          currency: String(flwData.data.currency || 'NGN'),
          gatewayTransactionId: flwData?.data?.id ? String(flwData.data.id) : transactionId ? String(transactionId) : undefined
        });
        return res.json({ success: true, order: sanitizeOrderForViewer(finalized.order), soldOutRefunded: finalized.soldOutRefunded });
      }

      if (resolvedGateway === 'opay') {
        const merchantId = (process.env.OPAY_MERCHANT_ID || '').trim();
        const opaySecret = (process.env.OPAY_SECRET_KEY || '').trim();
        if (!merchantId || !opaySecret) {
          return res.status(400).json({ success: false, message: 'OPay merchant keys not configured.' });
        }
        const opayEnv = (process.env.OPAY_ENV || 'TEST').toUpperCase();
        const statusUrl =
          opayEnv === 'LIVE'
            ? 'https://api.opaycheckout.com/api/v1/international/cashier/status'
            : 'https://testapi.opaycheckout.com/api/v1/international/cashier/status';
        const opayRes = await fetch(statusUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${opaySecret}`,
            MerchantId: merchantId
          },
          body: JSON.stringify({ reference: resolvedRef, orderNo: resolvedRef })
        });
        const opayJson: any = await opayRes.json().catch(() => ({}));
        const st = String(opayJson?.data?.status || '').toUpperCase();
        if (opayJson?.code !== '00000' || (st !== 'SUCCESS' && st !== 'PAY_SUCCESS')) {
          return res.status(400).json({ success: false, message: 'OPay payment has not succeeded yet.' });
        }
        const finalized = await finalizeExternalOrderPayment({
          reference: resolvedRef,
          gateway: 'opay',
          paidAmountKobo: Number(opayJson?.data?.amount?.total || pend.amountKobo),
          currency: 'NGN',
          gatewayTransactionId: opayJson?.data?.orderNo ? String(opayJson.data.orderNo) : undefined
        });
        return res.json({ success: true, order: sanitizeOrderForViewer(finalized.order), soldOutRefunded: finalized.soldOutRefunded });
      }

      // Paystack Verification
      const psVerify = await verifyPaystackPayment(resolvedRef);
      if (!psVerify?.status || psVerify?.data?.status !== 'success') {
        return res.status(400).json({
          success: false,
          message: `Paystack status: ${psVerify?.data?.gateway_response || psVerify?.data?.status || 'unconfirmed'}.`
        });
      }

      const finalized = await finalizeExternalOrderPayment({
        reference: resolvedRef,
        gateway: 'paystack',
        paidAmountKobo: Number(psVerify.data.amount || 0),
        currency: String(psVerify.data.currency || 'NGN'),
        gatewayTransactionId: psVerify?.data?.id ? String(psVerify.data.id) : undefined
      });
      return res.json({ success: true, order: sanitizeOrderForViewer(finalized.order), soldOutRefunded: finalized.soldOutRefunded });
    } catch (err: any) {
      return res.status(err?.status || 500).json({
        success: false,
        message: err?.message || 'Payment verification failed.'
      });
    }
  });

  // =========================================================================
  // 4. BUYER ORDERS, TRACKING, ESCROW CONFIRMATION, DISPUTES, ADMIN REFUND
  // =========================================================================
  app.get('/api/marketplace/orders/my-orders', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const db = getServerDb();
      const snap = await db.collection('modern_market_orders').where('buyerId', '==', user.uid).get();
      const orders: any[] = [];
      snap.forEach((d: any) => orders.push(sanitizeOrderForViewer({ id: d.id, ...d.data() })));
      orders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      return res.json({ success: true, orders });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to load orders.' });
    }
  });

  app.get('/api/marketplace/orders/seller-orders', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const db = getServerDb();
      const isAdmin = await isAdminUser(user.uid, user.email);
      const snap = await db.collection('modern_market_orders').get();
      const orders: any[] = [];
      snap.forEach((d: any) => {
        const od = d.data() || {};
        if (od.sellerId === user.uid || (isAdmin && isOfficialSeedSeller(od.sellerId))) {
          const safe = sanitizeOrderForViewer({ id: d.id, ...od });
          delete safe.buyerEmail;
          orders.push(safe);
        }
      });
      orders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return res.json({ success: true, orders });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to load seller orders.' });
    }
  });

  app.get('/api/marketplace/orders/:id/tracking', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const id = String(req.params.id || '').trim();
      const db = getServerDb();
      const snap = await db.doc(`modern_market_orders/${id}`).get();
      if (!snap.exists) return res.status(404).json({ success: false, message: 'Order not found.' });

      const od = snap.data() || {};
      const isAdmin = await isAdminUser(user.uid, user.email);
      if (od.buyerId !== user.uid && od.sellerId !== user.uid && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
      return res.json({ success: true, order: sanitizeOrderForViewer({ id: snap.id, ...od }) });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to fetch tracking.' });
    }
  });

  app.post('/api/marketplace/order/ship', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const { orderId, stage } = req.body || {};
      const cleanOrderId = String(orderId || '').trim();
      const targetStage = String(stage || 'SHIPPED').toUpperCase();
      if (!['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(targetStage)) {
        return res.status(400).json({ success: false, message: 'Invalid shipping stage.' });
      }

      const db = getServerDb();
      const orderRef = db.doc(`modern_market_orders/${cleanOrderId}`);
      const snap = await orderRef.get();
      if (!snap.exists) return res.status(404).json({ success: false, message: 'Order not found.' });

      const ord = snap.data() || {};
      const isAdmin = await isAdminUser(user.uid, user.email);
      if (ord.sellerId !== user.uid && !(isAdmin && isOfficialSeedSeller(ord.sellerId))) {
        return res.status(403).json({ success: false, message: 'Only the seller can update shipping status.' });
      }
      if (!['PAID_ESCROW_HELD', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(ord.status)) {
        return res.status(400).json({ success: false, message: `Order cannot move to ${targetStage} from ${ord.status}.` });
      }

      const nowIso = new Date().toISOString();
      const history = Array.isArray(ord.trackingHistory) ? [...ord.trackingHistory] : [];
      const labelMap: Record<string, string> = {
        SHIPPED: 'Shipped by Seller',
        OUT_FOR_DELIVERY: 'Out For Delivery / Ready at Pickup',
        DELIVERED: ord.deliveryMethod === 'DELIVERY' ? 'Delivered to Address' : 'Arrived at Pickup Point'
      };

      if (!history.some((h: any) => h.step === targetStage)) {
        history.push({
          step: targetStage,
          label: labelMap[targetStage],
          description: `Seller updated dispatch status (${labelMap[targetStage]}).`,
          at: nowIso
        });
      }

      await orderRef.set(
        {
          status: targetStage,
          shippedAt: ord.shippedAt || nowIso,
          deliveredAt: targetStage === 'DELIVERED' ? nowIso : ord.deliveredAt || null,
          autoReleaseAt:
            targetStage === 'DELIVERED' ? new Date(Date.now() + FORTY_EIGHT_HOURS_MS).toISOString() : ord.autoReleaseAt,
          trackingHistory: history,
          updatedAt: nowIso
        },
        { merge: true }
      );

      await Promise.all([
        createMarketAlert({
          userId: ord.buyerId,
          type: 'ORDER',
          title: `Order Update: ${labelMap[targetStage]}`,
          message: `${ord.productName} (${cleanOrderId}) is now ${labelMap[targetStage]}. Confirm receipt when in your hands.`,
          orderId: cleanOrderId
        }),
        writeAuditLog('ORDER_SHIPPING_UPDATED', user.uid, {
          orderId: cleanOrderId,
          stage: targetStage,
          buyerId: ord.buyerId
        })
      ]);

      const updated = await orderRef.get();
      return res.json({ success: true, order: sanitizeOrderForViewer(updated.data()) });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to update shipping.' });
    }
  });

  app.post('/api/marketplace/order/confirm-delivery', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const rl = checkRateLimit(`mkt_confirm:${user.uid}`, 10, 5 * 60 * 1000);
      if (!rl.allowed) {
        return res.status(429).json({ success: false, message: `Too many attempts. Wait ${rl.retryAfterSec}s.` });
      }

      const { orderId, pin } = req.body || {};
      const cleanOrderId = String(orderId || '').trim();
      const cleanPin = String(pin || '').trim();
      if (!cleanOrderId || !/^\d{4}$/.test(cleanPin)) {
        return res.status(400).json({ success: false, message: 'Order ID and your 4-digit EFADO PIN are required.' });
      }

      const db = getServerDb();
      const [orderSnap, secSnap] = await Promise.all([
        db.doc(`modern_market_orders/${cleanOrderId}`).get(),
        db.doc(`wallets/${user.uid}/security/config`).get()
      ]);

      if (!orderSnap.exists) return res.status(404).json({ success: false, message: 'Order not found.' });
      const ord = orderSnap.data() || {};
      if (ord.buyerId !== user.uid) {
        return res.status(403).json({ success: false, message: 'Only the buyer can release Escrow funds.' });
      }

      const sec = secSnap.exists ? secSnap.data() || {} : {};
      if (!sec.pinHash || !verifyPinHash(cleanPin, sec.pinHash)) {
        return res.status(403).json({ success: false, message: 'Incorrect 4-digit Transaction PIN.' });
      }

      const updatedOrder = await releaseOrderEscrowToSeller(cleanOrderId, user.uid, false);
      return res.json({
        success: true,
        order: updatedOrder,
        message: 'Delivery confirmed! Escrow funds have been released to the seller.'
      });
    } catch (err: any) {
      return res.status(err?.status || 500).json({
        success: false,
        message: err?.message || 'Could not confirm delivery.'
      });
    }
  });

  app.post('/api/marketplace/order/dispute', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const { orderId, reason, photos } = req.body || {};
      const cleanOrderId = String(orderId || '').trim();
      const cleanReason = String(reason || '').trim();
      if (!cleanOrderId || cleanReason.length < 6) {
        return res.status(400).json({ success: false, message: 'Describe the problem clearly (minimum 6 characters).' });
      }

      const db = getServerDb();
      const orderRef = db.doc(`modern_market_orders/${cleanOrderId}`);
      const snap = await orderRef.get();
      if (!snap.exists) return res.status(404).json({ success: false, message: 'Order not found.' });

      const ord = snap.data() || {};
      if (ord.buyerId !== user.uid) {
        return res.status(403).json({ success: false, message: 'Only the buyer can open a dispute on this order.' });
      }
      if (ord.status === 'COMPLETED' || ord.escrowStatus === 'RELEASED') {
        return res.status(400).json({ success: false, message: 'Order has already been completed and released.' });
      }

      const nowIso = new Date().toISOString();
      const disputeId = `DSP-${cleanOrderId}-${Date.now()}`;
      const cleanPhotos = Array.isArray(photos) ? photos.filter((p) => typeof p === 'string').slice(0, 5) : [];

      await db.doc(`modern_market_disputes/${disputeId}`).set({
        id: disputeId,
        orderId: cleanOrderId,
        buyerId: user.uid,
        buyerEmail: user.email,
        sellerId: ord.sellerId,
        productName: ord.productName,
        amountNgn: ord.grandTotal,
        reason: cleanReason,
        photos: cleanPhotos,
        status: 'OPEN',
        createdAt: nowIso
      });

      const history = Array.isArray(ord.trackingHistory) ? [...ord.trackingHistory] : [];
      history.push({
        step: 'DISPUTED',
        label: 'Dispute Opened - Escrow Frozen',
        description: `Buyer reported issue: ${cleanReason}`,
        at: nowIso
      });

      await orderRef.set(
        {
          status: 'DISPUTED',
          escrowStatus: 'DISPUTED',
          disputeReason: cleanReason,
          disputePhotos: cleanPhotos,
          trackingHistory: history,
          updatedAt: nowIso
        },
        { merge: true }
      );

      await Promise.all([
        createMarketAlert({
          userId: ord.sellerId,
          type: 'DISPUTE',
          title: 'Order Dispute Opened',
          message: `Buyer opened a dispute on ${cleanOrderId}: "${cleanReason}". Escrow is paused for review.`,
          orderId: cleanOrderId
        }),
        createMarketAlert({
          userId: user.uid,
          type: 'DISPUTE',
          title: 'Dispute Submitted - Money Protected',
          message: `Your money (${formatNairaPlain(ord.grandTotal)}) remains frozen in Escrow while EFADO Support reviews ${cleanOrderId}.`,
          orderId: cleanOrderId
        }),
        writeAuditLog('ORDER_DISPUTED', user.uid, { orderId: cleanOrderId, disputeId, reason: cleanReason })
      ]);

      const updated = await orderRef.get();
      return res.json({ success: true, disputeId, order: updated.data() });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Could not submit dispute.' });
    }
  });

  app.post('/api/marketplace/order/refund', async (req: Request, res: Response) => {
    const user = await verifyBearerUser(req);
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const isAdmin = await isAdminUser(user.uid, user.email);
    const { orderId } = req.body || {};
    const cleanOrderId = String(orderId || '').trim();
    if (!cleanOrderId) return res.status(400).json({ success: false, message: 'orderId is required.' });

    const lockKey = `mkt_escrow:${cleanOrderId}`;
    if (!acquireInFlightLock(lockKey)) {
      return res.status(409).json({ success: false, message: 'Escrow operation in progress.' });
    }

    try {
      const db = getServerDb();
      const serverTime = getServerTimestamp();
      const nowIso = new Date().toISOString();
      const orderRef = db.doc(`modern_market_orders/${cleanOrderId}`);
      const snap = await orderRef.get();
      if (!snap.exists) return res.status(404).json({ success: false, message: 'Order not found.' });

      const ord = snap.data() || {};
      if (!isAdmin && ord.sellerId !== user.uid) {
        return res.status(403).json({ success: false, message: 'Only EFADO Admin or Seller can approve an escrow refund.' });
      }
      if (!['HELD', 'DISPUTED'].includes(ord.escrowStatus)) {
        return res.status(400).json({ success: false, message: 'Order escrow cannot be refunded in current state.' });
      }

      const payGateway = String(ord.paymentGateway || 'wallet').toLowerCase();
      const payMethod = String(ord.paymentMethod || 'wallet').toLowerCase();
      const paymentRef = String(ord.paymentReference || '').trim();
      const refundRef = `MKT-REF-${cleanOrderId}-${Date.now()}`;

      let refundChannelLabel = 'EFADO Wallet (Original Method)';
      let externalRefundId: string | null = null;

      // Refund MUST go back to ORIGINAL payment method:
      // Card -> Card, Bank Transfer -> Bank Account, OPay -> OPay, Wallet -> Wallet
      if (payGateway === 'paystack') {
        const psSecret = (process.env.PAYSTACK_SECRET_KEY || '').trim();
        if (!psSecret || !paymentRef) {
          return res.status(400).json({
            success: false,
            message: 'Paystack refund key or payment reference missing.'
          });
        }
        const psRefundRes = await fetch('https://api.paystack.co/refund', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${psSecret}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            transaction: paymentRef,
            amount: Number(ord.grandTotalKobo || toMinorUnits(Number(ord.grandTotal || 0))),
            merchant_note: `EFADO Escrow Refund (${cleanOrderId})`,
            customer_note: `Refund returned to your original ${payMethod === 'bank' ? 'Bank Account' : payMethod === 'opay' ? 'OPay / Transfer Method' : 'Card'} for ${cleanOrderId}`
          })
        });
        const psRefundJson: any = await psRefundRes.json().catch(() => ({}));
        if (!psRefundRes.ok || !psRefundJson?.status) {
          return res.status(502).json({
            success: false,
            message: psRefundJson?.message || 'Paystack original-method refund could not be processed.'
          });
        }
        externalRefundId = String(psRefundJson?.data?.id || paymentRef);
        refundChannelLabel =
          payMethod === 'bank'
            ? 'Original Bank Account (Paystack)'
            : payMethod === 'opay'
              ? 'Original OPay / Mobile Money (Paystack)'
              : 'Original Card (Paystack)';
      } else if (payGateway === 'flutterwave') {
        const flwSecret = (process.env.FLUTTERWAVE_CLIENT_SECRET || process.env.FLUTTERWAVE_SECRET_KEY || '').trim();
        if (!flwSecret || !paymentRef) {
          return res.status(400).json({
            success: false,
            message: 'Flutterwave refund key or payment reference missing.'
          });
        }
        let flwTxId = String(ord.gatewayTransactionId || '').trim();
        if (!flwTxId) {
          const lookup = await fetch(
            `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(paymentRef)}`,
            { headers: { Authorization: `Bearer ${flwSecret}` } }
          );
          const lookupJson: any = await lookup.json().catch(() => ({}));
          flwTxId = String(lookupJson?.data?.id || '').trim();
        }
        if (!flwTxId) {
          return res.status(400).json({ success: false, message: 'Original Flutterwave transaction ID not found.' });
        }
        const flwRefRes = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(flwTxId)}/refund`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${flwSecret}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ amount: Number(ord.grandTotal || 0) })
        });
        const flwRefJson: any = await flwRefRes.json().catch(() => ({}));
        if (!flwRefRes.ok || flwRefJson?.status !== 'success') {
          return res.status(502).json({
            success: false,
            message: flwRefJson?.message || 'Flutterwave card refund failed.'
          });
        }
        externalRefundId = String(flwRefJson?.data?.id || flwTxId);
        refundChannelLabel = 'Original Card (Flutterwave)';
      } else if (payGateway === 'opay') {
        const opayMerchantId = (process.env.OPAY_MERCHANT_ID || '').trim();
        const opaySecret = (process.env.OPAY_SECRET_KEY || '').trim();
        if (!opayMerchantId || !opaySecret || !paymentRef) {
          return res.status(400).json({ success: false, message: 'OPay merchant credentials missing for refund.' });
        }
        const opayEnv = (process.env.OPAY_ENV || 'TEST').toUpperCase();
        const opayRefundUrl =
          opayEnv === 'LIVE'
            ? 'https://api.opaycheckout.com/api/v1/international/cashier/refund'
            : 'https://testapi.opaycheckout.com/api/v1/international/cashier/refund';
        const opayRefRes = await fetch(opayRefundUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${opaySecret}`,
            MerchantId: opayMerchantId
          },
          body: JSON.stringify({
            reference: paymentRef,
            orderNo: ord.gatewayTransactionId || paymentRef,
            refundOriginalAmount: { total: Number(ord.grandTotalKobo || 0), currency: 'NGN' },
            refundType: 'REFUND2ORIGINAL'
          })
        });
        const opayRefJson: any = await opayRefRes.json().catch(() => ({}));
        if (opayRefJson?.code !== '00000') {
          return res.status(502).json({
            success: false,
            message: opayRefJson?.message || 'OPay original-account refund failed.'
          });
        }
        externalRefundId = String(opayRefJson?.data?.orderNo || paymentRef);
        refundChannelLabel = 'Original OPay Account';
      }

      await db.runTransaction(async (tx: any) => {
        const fresh = await tx.get(orderRef);
        const cur = fresh.data() || {};
        if (!['HELD', 'DISPUTED'].includes(cur.escrowStatus)) {
          throw Object.assign(new Error('Order already settled.'), { status: 409 });
        }

        if (payGateway === 'wallet') {
          const buyerWalletRef = db.doc(`wallets/${cur.buyerId}/NGN/depositWallet`);
          const buyerUserRef = db.doc(`users/${cur.buyerId}`);
          const bwSnap = await tx.get(buyerWalletRef);
          const oldBal = bwSnap.exists ? Number(bwSnap.data()?.balance ?? bwSnap.data()?.depositWallet ?? 0) : 0;
          const newBal = fromMinorUnits(toMinorUnits(oldBal) + Number(cur.grandTotalKobo || 0));

          tx.set(
            buyerWalletRef,
            { balance: newBal, depositWallet: newBal, currency: 'NGN', userId: cur.buyerId, updatedAt: serverTime },
            { merge: true }
          );
          tx.set(buyerUserRef, { depositWallet: newBal, updatedAt: serverTime }, { merge: true });
        }

        const txRec = {
          type: 'refund',
          status: 'completed',
          credited: payGateway === 'wallet',
          amount: cur.grandTotal,
          currency: 'NGN',
          reference: refundRef,
          externalRefundId,
          userId: cur.buyerId,
          hub: 'MODERN_MARKET',
          gateway: payGateway,
          method: refundChannelLabel,
          purpose: `Marketplace Escrow Refund to ${refundChannelLabel} (${cur.orderId})`,
          orderId: cleanOrderId,
          createdAtIso: nowIso,
          timestamp: serverTime,
          updatedAt: serverTime
        };
        tx.set(db.doc(`transactions/${refundRef}`), txRec, { merge: true });
        tx.set(db.doc(`wallets/${cur.buyerId}/transactions/${refundRef}`), txRec, { merge: true });

        const history = Array.isArray(cur.trackingHistory) ? [...cur.trackingHistory] : [];
        history.push({
          step: 'REFUNDED',
          label: 'Full Escrow Refund Issued',
          description: `${formatNairaPlain(cur.grandTotal)} refunded to ${refundChannelLabel}.`,
          at: nowIso
        });

        tx.set(
          orderRef,
          {
            status: 'REFUNDED',
            escrowStatus: 'REFUNDED',
            refundReference: refundRef,
            refundChannel: refundChannelLabel,
            externalRefundId,
            refundedAt: nowIso,
            trackingHistory: history,
            updatedAt: nowIso
          },
          { merge: true }
        );
      });

      await Promise.all([
        createMarketAlert({
          userId: ord.buyerId,
          type: 'ESCROW',
          title: 'Escrow Refund Issued',
          message: `${formatNairaPlain(ord.grandTotal)} has been refunded to your ${refundChannelLabel} for ${cleanOrderId}.`,
          orderId: cleanOrderId
        }),
        createMarketAlert({
          userId: ord.sellerId,
          type: 'ESCROW',
          title: 'Order Refunded to Buyer',
          message: `${formatNairaPlain(ord.grandTotal)} for ${cleanOrderId} was refunded to the buyer's ${refundChannelLabel}.`,
          orderId: cleanOrderId
        }),
        createWalletAlert(
          ord.buyerId,
          'deposit',
          'Escrow Refund Issued',
          `+${formatNairaPlain(ord.grandTotal)} refunded to ${refundChannelLabel} for Order ${cleanOrderId}.`,
          { orderId: cleanOrderId, refundRef, refundChannel: refundChannelLabel }
        ),
        writeAuditLog('ORDER_REFUNDED', user.uid, {
          orderId: cleanOrderId,
          refundRef,
          refundChannel: refundChannelLabel,
          externalRefundId,
          amountNgn: ord.grandTotal
        })
      ]);

      const updated = await orderRef.get();
      return res.json({ success: true, order: sanitizeOrderForViewer(updated.data()) });
    } catch (err: any) {
      return res.status(err?.status || 500).json({ success: false, message: err?.message || 'Refund failed.' });
    } finally {
      releaseInFlightLock(lockKey);
    }
  });

  // =========================================================================
  // 5. BUYER-SELLER CHAT, REVIEWS, ALERTS & SELLER PROFILE (Encrypted Bank)
  // =========================================================================
  app.get('/api/marketplace/chat/:productId/:sellerId', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Sign in to chat with seller.' });

      const productId = String(req.params.productId || '').trim();
      const sellerId = String(req.params.sellerId || '').trim();
      const buyerParam = String(req.query.buyerId || '').trim();
      const isSeller = user.uid === sellerId || (await isAdminUser(user.uid, user.email));
      const buyerId = isSeller && buyerParam ? buyerParam : user.uid;
      const threadId = `${productId}__${buyerId}__${sellerId}`;

      const db = getServerDb();
      const msgSnap = await db.collection('modern_market_chats').where('threadId', '==', threadId).get();
      const messages: any[] = [];
      msgSnap.forEach((d: any) => {
        const data = d.data() || {};
        if (data.text) messages.push({ id: d.id, ...data });
      });
      messages.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

      return res.json({ success: true, threadId, messages });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to load chat.' });
    }
  });

  app.get('/api/marketplace/chats/my', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const isAdmin = await isAdminUser(user.uid, user.email);
      const db = getServerDb();
      const snap = await db.collection('modern_market_chat_threads').get();
      const threads: any[] = [];
      snap.forEach((d: any) => {
        const t = d.data() || {};
        if (t.buyerId === user.uid || t.sellerId === user.uid || (isAdmin && isOfficialSeedSeller(t.sellerId))) {
          threads.push({ id: d.id, ...t });
        }
      });
      threads.sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());
      return res.json({ success: true, threads });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to load chat threads.' });
    }
  });

  app.post('/api/marketplace/chat/send', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const { productId, sellerId, buyerId: targetBuyerId, text } = req.body || {};
      const cleanProductId = String(productId || '').trim();
      const cleanSellerId = String(sellerId || '').trim();
      const cleanText = String(text || '').trim();

      if (!cleanProductId || !cleanSellerId || !cleanText) {
        return res.status(400).json({ success: false, message: 'productId, sellerId, and message text are required.' });
      }
      if (cleanText.length > 1000) {
        return res.status(400).json({ success: false, message: 'Message cannot exceed 1000 characters.' });
      }

      const db = getServerDb();
      const [pSnap, uSnap] = await Promise.all([
        db.doc(`modern_market_products/${cleanProductId}`).get(),
        db.doc(`users/${user.uid}`).get()
      ]);
      const prod = pSnap.exists ? pSnap.data() || {} : {};
      const uData = uSnap.exists ? uSnap.data() || {} : {};
      const senderName = uData.displayName || user.name || user.email.split('@')[0];

      const isAdmin = await isAdminUser(user.uid, user.email);
      const isSellerActing = user.uid === cleanSellerId || (isAdmin && isOfficialSeedSeller(cleanSellerId));
      const resolvedBuyerId = isSellerActing && targetBuyerId ? String(targetBuyerId).trim() : user.uid;
      const receiverId = isSellerActing ? resolvedBuyerId : cleanSellerId;
      const threadId = `${cleanProductId}__${resolvedBuyerId}__${cleanSellerId}`;

      const nowIso = new Date().toISOString();
      const msgId = `MMSG-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const messageDoc = {
        id: msgId,
        threadId,
        productId: cleanProductId,
        productName: prod.name || 'Product Inquiry',
        senderId: user.uid,
        senderName,
        receiverId,
        text: cleanText,
        createdAt: nowIso
      };

      await db.doc(`modern_market_chats/${msgId}`).set(messageDoc);
      await db.doc(`modern_market_chat_threads/${threadId}`).set(
        {
          threadId,
          productId: cleanProductId,
          productName: prod.name || 'Product Inquiry',
          productPhoto: (Array.isArray(prod.photos) && prod.photos[0]) || '/assets/market/iphone_13_pro_max.jpg',
          buyerId: resolvedBuyerId,
          buyerName: isSellerActing ? (targetBuyerId || 'Buyer') : senderName,
          sellerId: cleanSellerId,
          sellerName: prod.sellerName || 'EFADO Verified Seller',
          lastMessage: cleanText,
          lastMessageAt: nowIso
        },
        { merge: true }
      );

      await createMarketAlert({
        userId: receiverId,
        type: 'CHAT',
        title: `New Message about ${prod.name || 'Product'}`,
        message: `${senderName}: "${cleanText.slice(0, 80)}${cleanText.length > 80 ? '...' : ''}"`,
        productId: cleanProductId
      });

      return res.json({ success: true, message: messageDoc });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to send message.' });
    }
  });

  app.post('/api/marketplace/reviews', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const { productId, orderId, rating, comment } = req.body || {};
      const cleanProductId = String(productId || '').trim();
      const numRating = Math.min(5, Math.max(1, Math.round(Number(rating || 5))));
      const cleanComment = String(comment || '').trim();
      if (!cleanProductId || cleanComment.length < 4) {
        return res.status(400).json({ success: false, message: 'Product ID and review comment are required.' });
      }

      const db = getServerDb();
      const uSnap = await db.doc(`users/${user.uid}`).get();
      const uData = uSnap.exists ? uSnap.data() || {} : {};
      const id = `MREV-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
      const reviewDoc = {
        id,
        productId: cleanProductId,
        orderId: orderId || null,
        buyerId: user.uid,
        buyerName: uData.displayName || user.name || user.email.split('@')[0],
        rating: numRating,
        comment: cleanComment,
        photos: [],
        verifiedPurchase: Boolean(orderId),
        createdAt: new Date().toISOString()
      };
      await db.doc(`modern_market_reviews/${id}`).set(reviewDoc);

      const pRef = db.doc(`modern_market_products/${cleanProductId}`);
      const pSnap = await pRef.get();
      if (pSnap.exists) {
        const pd = pSnap.data() || {};
        const count = Number(pd.reviewsCount || 0) + 1;
        const avg = Number((((Number(pd.rating || 5) * Number(pd.reviewsCount || 0)) + numRating) / count).toFixed(1));
        await pRef.set({ reviewsCount: count, rating: avg }, { merge: true });
      }

      return res.json({ success: true, review: reviewDoc });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to submit review.' });
    }
  });

  app.get('/api/marketplace/alerts', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const db = getServerDb();
      const isAdmin = await isAdminUser(user.uid, user.email);
      const snap = await db.collection('modern_market_alerts').get();
      const alerts: any[] = [];
      snap.forEach((d: any) => {
        const a = d.data() || {};
        if (a.userId === user.uid || (isAdmin && isOfficialSeedSeller(a.userId))) {
          alerts.push({ id: d.id, ...a });
        }
      });
      alerts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return res.json({ success: true, alerts: alerts.slice(0, 40) });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to load alerts.' });
    }
  });

  function buildSellerProfileResponse(d: any, uid: string, fallbackEmail: string, fallbackName: string, isAdmin: boolean) {
    if (!d) {
      return {
        sellerId: uid,
        storeName: isAdmin ? fallbackName || 'EFADO Official Admin Store' : '',
        ownerFullName: fallbackName || '',
        phone: '',
        email: fallbackEmail || '',
        state: '',
        city: '',
        verified: isAdmin,
        applicationStatus: isAdmin ? 'APPROVED' : 'NOT_APPLIED',
        rejectionReason: '',
        idType: undefined,
        idPhotoUploaded: false,
        rulesAccepted: isAdmin,
        submittedAt: '',
        approvedAt: '',
        isAdmin,
        rating: 4.9,
        salesCount: 0,
        location: isAdmin ? 'Bonny, Rivers State' : 'Lagos, Nigeria',
        storeAddress: '',
        joinedAt: new Date().toISOString(),
        payoutPreference: 'wallet',
        bankCode: '',
        bankName: '',
        accountName: '',
        accountNumberMasked: ''
      };
    }

    const derivedStatus = d.applicationStatus
      ? d.applicationStatus
      : d.verified === true
        ? 'APPROVED'
        : 'NOT_APPLIED';
    const isVerified = derivedStatus === 'APPROVED' || Boolean(d.verified === true);

    return {
      sellerId: d.sellerId || uid,
      storeName: d.storeName || '',
      ownerFullName: d.ownerFullName || '',
      phone: d.phone || '',
      email: d.email || fallbackEmail || '',
      state: d.state || '',
      city: d.city || '',
      verified: isVerified,
      applicationStatus: derivedStatus,
      rejectionReason: d.rejectionReason || '',
      idType: d.idType || undefined,
      idPhotoUploaded: Boolean(d.idPhotoUploaded),
      rulesAccepted: Boolean(d.rulesAccepted),
      submittedAt: d.submittedAt || '',
      approvedAt: d.approvedAt || '',
      isAdmin,
      rating: Number(d.rating ?? 4.9),
      salesCount: Number(d.salesCount ?? 0),
      location: d.location || (d.city && d.state ? `${d.city}, ${d.state}` : 'Lagos, Nigeria'),
      storeAddress: d.storeAddress || '',
      joinedAt: d.joinedAt || new Date().toISOString(),
      payoutPreference: d.payoutPreference === 'bank' ? 'bank' : 'wallet',
      bankCode: d.bankCode || '',
      bankName: d.bankName || '',
      accountName: d.accountName || '',
      accountNumberMasked: d.accountNumberMasked || ''
    };
  }

  app.get('/api/marketplace/seller/profile', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const db = getServerDb();
      const [snap, isAdmin] = await Promise.all([
        db.doc(`modern_market_sellers/${user.uid}`).get(),
        isAdminUser(user.uid, user.email)
      ]);
      const d = snap.exists ? snap.data() || {} : null;
      return res.json({
        success: true,
        profile: buildSellerProfileResponse(d, user.uid, user.email, user.name || '', isAdmin)
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to load seller profile.' });
    }
  });

  app.post('/api/marketplace/seller/register', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const body = req.body || {};
      const storeName = String(body.storeName || '').trim();
      const ownerFullName = String(body.ownerFullName || '').trim();
      const phone = String(body.phone || '').trim();
      const email = String(body.email || user.email || '').trim();
      const state = String(body.state || '').trim();
      const city = String(body.city || '').trim();
      const storeAddress = String(body.storeAddress || '').trim();
      const idType = String(body.idType || '').trim();
      const idPhoto = String(body.idPhoto || '').trim();
      const bankName = String(body.bankName || '').trim();
      const bankCode = String(body.bankCode || '').trim();
      const accountNumber = String(body.accountNumber || '').replace(/\D/g, '');
      const accountName = String(body.accountName || '').trim();
      const payoutPreference = body.payoutPreference === 'bank' ? 'bank' : 'wallet';
      const rulesAccepted = Boolean(body.rulesAccepted);

      if (!storeName || storeName.length < 2) {
        return res.status(400).json({ success: false, message: 'Store Name is required.' });
      }
      if (!ownerFullName || ownerFullName.length < 2) {
        return res.status(400).json({ success: false, message: 'Owner Full Name is required.' });
      }
      if (!phone || phone.length < 8) {
        return res.status(400).json({ success: false, message: 'Valid Phone Number is required.' });
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, message: 'Valid Email Address is required.' });
      }
      if (!state || !city || !storeAddress || storeAddress.length < 5) {
        return res.status(400).json({ success: false, message: 'State, City, and full Store Address are required.' });
      }
      if (!['NIN', "Driver's License", "Voter's Card"].includes(idType)) {
        return res.status(400).json({ success: false, message: 'Select ID Type (NIN, Driver\'s License, or Voter\'s Card).' });
      }
      if (!rulesAccepted) {
        return res.status(400).json({ success: false, message: 'You must agree to EFADO Seller Rules to submit.' });
      }

      const db = getServerDb();
      const sellerRef = db.doc(`modern_market_sellers/${user.uid}`);
      const kycRef = db.doc(`modern_market_seller_kyc/${user.uid}`);
      const [existingSnap, kycSnap, isAdmin] = await Promise.all([
        sellerRef.get(),
        kycRef.get(),
        isAdminUser(user.uid, user.email)
      ]);
      const prev = existingSnap.exists ? existingSnap.data() || {} : {};

      if (!idPhoto && !kycSnap.exists) {
        return res.status(400).json({ success: false, message: 'Please upload a clear photo of your Government ID.' });
      }
      if (idPhoto && Buffer.byteLength(idPhoto, 'utf8') > 800 * 1024) {
        return res.status(400).json({ success: false, message: 'ID photo is too large. Please upload a smaller image.' });
      }

      const hasAccountNum = accountNumber.length === 10 || Boolean(prev.accountNumberEncrypted);
      if (!bankName || !hasAccountNum || !accountName) {
        return res.status(400).json({
          success: false,
          message: 'Bank Name, 10-digit Account Number, and Account Name are required.'
        });
      }

      const nowIso = new Date().toISOString();
      const locationStr = `${city}, ${state}`;

      if (idPhoto) {
        await kycRef.set(
          {
            sellerId: user.uid,
            idType,
            idPhoto,
            updatedAt: nowIso
          },
          { merge: true }
        );
      }

      const docData: any = {
        sellerId: user.uid,
        storeName,
        ownerFullName,
        phone,
        email,
        state,
        city,
        location: locationStr,
        storeAddress,
        idType,
        idPhotoUploaded: true,
        payoutPreference,
        bankName,
        bankCode: bankCode || prev.bankCode || '',
        accountName,
        rulesAccepted: true,
        rulesAcceptedAt: nowIso,
        applicationStatus: 'PENDING_APPROVAL',
        verified: false,
        rejectionReason: '',
        submittedAt: nowIso,
        rating: prev.rating ?? 4.9,
        salesCount: prev.salesCount ?? 0,
        joinedAt: prev.joinedAt || nowIso,
        updatedAt: nowIso
      };

      if (accountNumber.length === 10) {
        docData.accountNumberEncrypted = encryptSensitive(accountNumber);
        docData.accountNumberMasked = maskAccountNumber(accountNumber);
        docData.recipientCode = '';
      } else if (prev.accountNumberEncrypted) {
        docData.accountNumberEncrypted = prev.accountNumberEncrypted;
        docData.accountNumberMasked = prev.accountNumberMasked || '';
      }

      await sellerRef.set(docData, { merge: true });

      // Alert Admin + Applicant
      const adminSnap = await db.collection('users').where('email', 'in', Array.from(ADMIN_EMAILS)).get().catch(() => null);
      const adminAlertPromises: Promise<any>[] = [
        createMarketAlert({
          userId: CEO_OFFICIAL_SELLER_ID,
          type: 'VENDOR',
          title: `New Vendor Application: ${storeName}`,
          message: `${ownerFullName} (${locationStr}) applied to sell Brand New products with ${idType}. Review in Seller Hub -> Vendor Approvals.`
        }),
        createMarketAlert({
          userId: user.uid,
          type: 'VENDOR',
          title: 'Vendor Application Pending Approval',
          message: `Your application for "${storeName}" has been submitted and Admin has been alerted.`
        }),
        writeAuditLog('SELLER_REGISTRATION_SUBMITTED', user.uid, {
          storeName,
          ownerFullName,
          location: locationStr,
          idType,
          payoutPreference
        })
      ];
      if (adminSnap && !adminSnap.empty) {
        adminSnap.forEach((ad: any) => {
          adminAlertPromises.push(
            createWalletAlert(
              ad.id,
              'security',
              `New Vendor Application: ${storeName}`,
              `${ownerFullName} (${phone}, ${locationStr}) submitted KYC (${idType}) for Modern Market Vendor Approval.`,
              { sellerId: user.uid, storeName }
            )
          );
        });
      }
      await Promise.all(adminAlertPromises);

      return res.json({
        success: true,
        message: 'Application submitted! Pending Approval — Admin has been notified.',
        profile: buildSellerProfileResponse(docData, user.uid, email, ownerFullName, isAdmin)
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Could not submit vendor registration.' });
    }
  });

  app.get('/api/marketplace/admin/sellers', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });
      const isAdmin = await isAdminUser(user.uid, user.email);
      if (!isAdmin) {
        return res.status(403).json({ success: false, message: 'Admin access required.' });
      }

      const db = getServerDb();
      const [sellersSnap, kycSnap] = await Promise.all([
        db.collection('modern_market_sellers').get(),
        db.collection('modern_market_seller_kyc').get()
      ]);

      const kycMap = new Map<string, string>();
      kycSnap.forEach((k: any) => {
        const kd = k.data() || {};
        if (kd.idPhoto) kycMap.set(k.id, kd.idPhoto);
      });

      const vendors: any[] = [];
      sellersSnap.forEach((s: any) => {
        const d = s.data() || {};
        if (isOfficialSeedSeller(s.id)) return;
        const prof = buildSellerProfileResponse(d, s.id, d.email || '', d.ownerFullName || '', false);
        vendors.push({
          ...prof,
          idPhotoPreview: kycMap.get(s.id) || ''
        });
      });

      vendors.sort((a, b) => {
        const rank = (st?: string) => (st === 'PENDING_APPROVAL' ? 0 : st === 'REJECTED' ? 1 : 2);
        if (rank(a.applicationStatus) !== rank(b.applicationStatus)) {
          return rank(a.applicationStatus) - rank(b.applicationStatus);
        }
        return new Date(b.submittedAt || b.joinedAt || 0).getTime() - new Date(a.submittedAt || a.joinedAt || 0).getTime();
      });

      return res.json({ success: true, vendors });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to load vendor applications.' });
    }
  });

  app.post('/api/marketplace/admin/sellers/:sellerId/review', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });
      const isAdmin = await isAdminUser(user.uid, user.email);
      if (!isAdmin) {
        return res.status(403).json({ success: false, message: 'Admin access required.' });
      }

      const targetSellerId = String(req.params.sellerId || '').trim();
      const decision = String(req.body?.decision || '').trim().toLowerCase();
      const reason = String(req.body?.reason || '').trim();
      if (!targetSellerId || !['approve', 'reject'].includes(decision)) {
        return res.status(400).json({ success: false, message: 'Valid sellerId and decision (approve/reject) required.' });
      }

      const db = getServerDb();
      const sellerRef = db.doc(`modern_market_sellers/${targetSellerId}`);
      const snap = await sellerRef.get();
      if (!snap.exists) {
        return res.status(404).json({ success: false, message: 'Vendor application not found.' });
      }
      const prev = snap.data() || {};
      const nowIso = new Date().toISOString();
      const approved = decision === 'approve';

      const patch = {
        applicationStatus: approved ? 'APPROVED' : 'REJECTED',
        verified: approved,
        approvedAt: approved ? nowIso : prev.approvedAt || '',
        approvedBy: user.email,
        rejectionReason: approved ? '' : reason || 'Application declined. Please verify your ID photo and bank details.',
        updatedAt: nowIso
      };
      await sellerRef.set(patch, { merge: true });

      const updated = { ...prev, ...patch };
      await Promise.all([
        createMarketAlert({
          userId: targetSellerId,
          type: 'VENDOR',
          title: approved ? 'Vendor Approved - You can now list products' : 'Vendor Application Update',
          message: approved
            ? `Congratulations! "${updated.storeName}" is now a Verified EFADO Seller. Open Seller Hub to list Brand New Sealed products.`
            : `Your vendor application was not approved: ${patch.rejectionReason}`
        }),
        createWalletAlert(
          targetSellerId,
          approved ? 'reward' : 'security',
          approved ? 'Vendor Approved - You can now list products' : 'Vendor Application Declined',
          approved
            ? `Your store "${updated.storeName}" is verified on EFADO Modern Market!`
            : patch.rejectionReason,
          { sellerId: targetSellerId }
        ),
        writeAuditLog(approved ? 'VENDOR_APPROVED' : 'VENDOR_REJECTED', user.uid, {
          targetSellerId,
          storeName: updated.storeName,
          reason: patch.rejectionReason
        })
      ]);

      return res.json({
        success: true,
        message: approved
          ? `Vendor Approved — ${updated.storeName} can now list products!`
          : `Application declined for ${updated.storeName}.`,
        profile: buildSellerProfileResponse(updated, targetSellerId, updated.email || '', updated.ownerFullName || '', false)
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to review vendor application.' });
    }
  });

  app.post('/api/marketplace/seller/profile', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const { storeName, location, storeAddress, payoutPreference, bankCode, bankName, accountName, accountNumber } =
        req.body || {};

      const db = getServerDb();
      const ref = db.doc(`modern_market_sellers/${user.uid}`);
      const [existing, isAdmin] = await Promise.all([
        ref.get(),
        isAdminUser(user.uid, user.email)
      ]);
      const prev = existing.exists ? existing.data() || {} : {};

      const cleanPref = payoutPreference === 'bank' ? 'bank' : 'wallet';
      const cleanAccNum = String(accountNumber || '').replace(/\D/g, '');
      const patch: any = {
        sellerId: user.uid,
        storeName: String(storeName || prev.storeName || user.name || 'EFADO Merchant').trim(),
        verified: prev.verified ?? isAdmin,
        applicationStatus: prev.applicationStatus || (prev.verified || isAdmin ? 'APPROVED' : 'NOT_APPLIED'),
        rating: prev.rating ?? 4.9,
        salesCount: prev.salesCount ?? 0,
        location: String(location || prev.location || 'Lagos, Nigeria').trim(),
        storeAddress: String(storeAddress || prev.storeAddress || '').trim(),
        joinedAt: prev.joinedAt || new Date().toISOString(),
        payoutPreference: cleanPref,
        updatedAt: new Date().toISOString()
      };

      if (cleanAccNum.length >= 10) {
        patch.accountNumberEncrypted = encryptSensitive(cleanAccNum);
        patch.accountNumberMasked = maskAccountNumber(cleanAccNum);
        patch.bankCode = String(bankCode || prev.bankCode || '').trim();
        patch.bankName = String(bankName || prev.bankName || '').trim();
        patch.accountName = String(accountName || prev.accountName || '').trim();
        patch.recipientCode = ''; // force recipient refresh if bank changed
      }

      await ref.set(patch, { merge: true });
      const merged = { ...prev, ...patch };
      return res.json({
        success: true,
        profile: buildSellerProfileResponse(merged, user.uid, user.email, user.name || '', isAdmin)
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to save seller profile.' });
    }
  });
}
