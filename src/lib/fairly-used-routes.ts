import { AsyncLocalStorage } from 'node:async_hooks';
import crypto from 'crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Express, NextFunction, Request, Response } from 'express';
import { getServerDb as getRawServerDb, getServerTimestamp } from './server-firestore.js';
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
const ONLINE_WINDOW_MS = 5 * 60 * 1000;
const SERVICE_CHARGE_RATE = 0.013; // 1.3%
const HIGH_VALUE_OTP_THRESHOLD_KOBO = 100000 * 100; // ₦100,000

const SEED_SELLER_ID = 'efado_fairly_used_warri_hub';
const SEED_SELLER_2_ID = 'efado_fairly_used_relocation_lagos';
const CEO_OFFICIAL_STORE_ID = 'efado_official_store_bonny_fu';
let fuSeedVerifiedThisBoot = false;

const fuBearerStorage = new AsyncLocalStorage<string | null>();
const fallbackSeedSellers = new Map<string, any>();
const fallbackSeedProducts = new Map<string, any>();
const fallbackSeedReviews = new Map<string, any>();

let cachedFuFirebaseCfg: { projectId: string; firestoreDatabaseId: string } | null = null;
function getFuFirebaseConfig() {
  if (cachedFuFirebaseCfg) return cachedFuFirebaseCfg;
  try {
    const cfgPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(cfgPath)) {
      const parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      cachedFuFirebaseCfg = {
        projectId: parsed.projectId || 'efado-market-hubs-8leju',
        firestoreDatabaseId: parsed.firestoreDatabaseId || 'ai-studio-ae55e9a4-6837-4ca3-a2d6-3ec7ce41d18a'
      };
      return cachedFuFirebaseCfg;
    }
  } catch {
    // ignore
  }
  cachedFuFirebaseCfg = {
    projectId: process.env.FIREBASE_PROJECT_ID || 'efado-market-hubs-8leju',
    firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || 'ai-studio-ae55e9a4-6837-4ca3-a2d6-3ec7ce41d18a'
  };
  return cachedFuFirebaseCfg;
}

function isPermissionDeniedErr(err: any): boolean {
  const msg = String(err?.message || err || '');
  return (
    err?.code === 7 ||
    err?.code === 'permission-denied' ||
    msg.includes('PERMISSION_DENIED') ||
    msg.includes('Missing or insufficient permissions')
  );
}

function toFirestoreRestValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return { integerValue: '0' };
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.filter((v) => v !== undefined).map(toFirestoreRestValue) } };
  }
  if (typeof val === 'object') {
    if ('_methodName' in val || 'isEqual' in val || typeof val.toDate === 'function') {
      return { timestampValue: new Date().toISOString() };
    }
    return { mapValue: { fields: toFirestoreRestFields(val) } };
  }
  return { stringValue: String(val) };
}

function toFirestoreRestFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (v === undefined) continue;
    fields[k] = toFirestoreRestValue(v);
  }
  return fields;
}

function getSeedDocFallback(docPath: string): any | null {
  if (docPath.startsWith('fairly_used_products/')) {
    return fallbackSeedProducts.get(docPath.slice('fairly_used_products/'.length)) || null;
  }
  if (docPath.startsWith('fairly_used_sellers/')) {
    return fallbackSeedSellers.get(docPath.slice('fairly_used_sellers/'.length)) || null;
  }
  if (docPath.startsWith('fairly_used_reviews/')) {
    return fallbackSeedReviews.get(docPath.slice('fairly_used_reviews/'.length)) || null;
  }
  return null;
}

function updateSeedDocFallbackIfMatch(docPath: string, data: Record<string, any>) {
  if (docPath.startsWith('fairly_used_products/')) {
    const id = docPath.slice('fairly_used_products/'.length);
    const prev = fallbackSeedProducts.get(id);
    if (prev) fallbackSeedProducts.set(id, { ...prev, ...data, id });
  } else if (docPath.startsWith('fairly_used_sellers/')) {
    const id = docPath.slice('fairly_used_sellers/'.length);
    const prev = fallbackSeedSellers.get(id);
    if (prev) fallbackSeedSellers.set(id, { ...prev, ...data, sellerId: id });
  }
}

async function restWriteDoc(docPath: string, data: Record<string, any>, merge: boolean, bearerToken: string) {
  const cfg = getFuFirebaseConfig();
  let payloadData = { ...data };
  let useMerge = merge;

  // Promote full seed doc if merging onto a seed doc not yet persisted in Firestore
  if (useMerge) {
    const seedFallback = getSeedDocFallback(docPath);
    if (seedFallback) {
      try {
        const existing = await getRawServerDb().doc(docPath).get();
        if (!existing.exists) {
          payloadData = { ...seedFallback, ...data };
          useMerge = false;
        }
      } catch {
        // proceed with merge
      }
    }
  }

  const base = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/${cfg.firestoreDatabaseId}/documents/${docPath}`;
  const cleanEntries = Object.entries(payloadData).filter(([, v]) => v !== undefined);
  const url = useMerge
    ? `${base}?${cleanEntries.map(([k]) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&')}`
    : base;

  const resp = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields: toFirestoreRestFields(payloadData) })
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw Object.assign(new Error(`Firestore REST write failed (${resp.status}): ${txt}`), { status: resp.status });
  }
}

async function restDeleteDoc(docPath: string, bearerToken: string) {
  const cfg = getFuFirebaseConfig();
  const url = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/${cfg.firestoreDatabaseId}/documents/${docPath}`;
  await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${bearerToken}` }
  });
}

function wrapDocRef(docPath: string, rawRef: any): any {
  return {
    _path: docPath,
    id: rawRef?.id || docPath.split('/').pop() || '',
    async get() {
      const snap = await rawRef.get();
      if (snap.exists) return snap;
      const fb = getSeedDocFallback(docPath);
      if (fb) {
        return {
          id: docPath.split('/').pop() || '',
          exists: true,
          data: () => ({ ...fb })
        };
      }
      return snap;
    },
    async set(data: any, options?: { merge?: boolean }) {
      updateSeedDocFallbackIfMatch(docPath, data);
      try {
        return await rawRef.set(data, options);
      } catch (err) {
        const token = fuBearerStorage.getStore();
        if (isPermissionDeniedErr(err) && token) {
          return await restWriteDoc(docPath, data, Boolean(options?.merge), token);
        }
        throw err;
      }
    },
    async update(data: any) {
      updateSeedDocFallbackIfMatch(docPath, data);
      try {
        return await rawRef.update(data);
      } catch (err) {
        const token = fuBearerStorage.getStore();
        if (isPermissionDeniedErr(err) && token) {
          return await restWriteDoc(docPath, data, true, token);
        }
        throw err;
      }
    },
    async delete() {
      try {
        return await rawRef.delete();
      } catch (err) {
        const token = fuBearerStorage.getStore();
        if (isPermissionDeniedErr(err) && token) {
          return await restDeleteDoc(docPath, token);
        }
        throw err;
      }
    }
  };
}

function wrapCollectionQuery(
  colPath: string,
  rawQuery: any,
  eqFilters: Array<{ field: string; op: string; value: any }> = []
): any {
  return {
    where(field: string, op: any, value: any) {
      return wrapCollectionQuery(colPath, rawQuery.where(field, op, value), [...eqFilters, { field, op, value }]);
    },
    orderBy(field: string, dir: 'asc' | 'desc' = 'asc') {
      return wrapCollectionQuery(colPath, rawQuery.orderBy(field, dir), eqFilters);
    },
    limit(n: number) {
      return wrapCollectionQuery(colPath, rawQuery.limit(n), eqFilters);
    },
    doc(docId?: string) {
      const generatedId = docId || `doc_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      return wrapDocRef(`${colPath}/${generatedId}`, rawQuery.doc(generatedId));
    },
    async add(data: any) {
      const generatedId = `doc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      await wrapDocRef(`${colPath}/${generatedId}`, getRawServerDb().doc(`${colPath}/${generatedId}`)).set(data);
      return { id: generatedId, path: `${colPath}/${generatedId}` };
    },
    async get() {
      const snap = await rawQuery.get();
      let seedSource: Map<string, any> | null = null;
      if (colPath === 'fairly_used_products') seedSource = fallbackSeedProducts;
      else if (colPath === 'fairly_used_sellers') seedSource = fallbackSeedSellers;
      else if (colPath === 'fairly_used_reviews') seedSource = fallbackSeedReviews;

      if (!seedSource || seedSource.size === 0) {
        return snap;
      }

      const existingIds = new Set<string>(snap.docs.map((d: any) => d.id));
      const mergedDocs = [...snap.docs];
      for (const [sid, sdata] of seedSource.entries()) {
        if (existingIds.has(sid)) continue;
        const matches = eqFilters.every((f) => {
          if (f.op === '==') return sdata?.[f.field] === f.value;
          return true;
        });
        if (matches) {
          mergedDocs.push({
            id: sid,
            exists: true,
            data: () => ({ ...sdata }),
            ref: {
              _path: `${colPath}/${sid}`,
              delete: () => wrapDocRef(`${colPath}/${sid}`, getRawServerDb().doc(`${colPath}/${sid}`)).delete()
            }
          });
        }
      }

      return {
        empty: mergedDocs.length === 0,
        size: mergedDocs.length,
        docs: mergedDocs,
        forEach(cb: (docSnap: any) => void) {
          mergedDocs.forEach(cb);
        }
      };
    }
  };
}

function getServerDb(): any {
  const rawDb = getRawServerDb();
  return {
    doc(docPath: string) {
      return wrapDocRef(docPath, rawDb.doc(docPath));
    },
    collection(colPath: string) {
      return wrapCollectionQuery(colPath, rawDb.collection(colPath));
    },
    async runTransaction(updateFn: (tx: any) => Promise<any>) {
      try {
        return await rawDb.runTransaction(async (rawTx: any) => {
          const txWrapper = {
            async get(ref: any) {
              const docPath = String(ref?._path || '');
              const r = docPath ? rawDb.doc(docPath) : ref;
              const snap = await rawTx.get(r);
              if (snap.exists) return snap;
              if (docPath) {
                const fb = getSeedDocFallback(docPath);
                if (fb) {
                  return { id: docPath.split('/').pop() || '', exists: true, data: () => ({ ...fb }) };
                }
              }
              return snap;
            },
            set(ref: any, data: any, opts?: { merge?: boolean }) {
              const docPath = String(ref?._path || '');
              if (docPath) updateSeedDocFallbackIfMatch(docPath, data);
              return rawTx.set(docPath ? rawDb.doc(docPath) : ref, data, opts);
            },
            update(ref: any, data: any) {
              const docPath = String(ref?._path || '');
              if (docPath) updateSeedDocFallbackIfMatch(docPath, data);
              return rawTx.update(docPath ? rawDb.doc(docPath) : ref, data);
            },
            delete(ref: any) {
              const docPath = String(ref?._path || '');
              return rawTx.delete(docPath ? rawDb.doc(docPath) : ref);
            }
          };
          return await updateFn(txWrapper);
        });
      } catch (err) {
        const token = fuBearerStorage.getStore();
        if (!isPermissionDeniedErr(err) || !token) {
          throw err;
        }
        const pendingOps: Array<() => Promise<any>> = [];
        const restTx = {
          async get(ref: any) {
            const docPath = String(ref?._path || '');
            return await wrapDocRef(docPath, rawDb.doc(docPath)).get();
          },
          set(ref: any, data: any, opts?: { merge?: boolean }) {
            const docPath = String(ref?._path || '');
            updateSeedDocFallbackIfMatch(docPath, data);
            pendingOps.push(() => restWriteDoc(docPath, data, Boolean(opts?.merge), token));
          },
          update(ref: any, data: any) {
            const docPath = String(ref?._path || '');
            updateSeedDocFallbackIfMatch(docPath, data);
            pendingOps.push(() => restWriteDoc(docPath, data, true, token));
          },
          delete(ref: any) {
            const docPath = String(ref?._path || '');
            pendingOps.push(() => restDeleteDoc(docPath, token));
          }
        };
        const result = await updateFn(restTx);
        for (const op of pendingOps) {
          await op();
        }
        return result;
      }
    }
  };
}

function isOfficialSeedSeller(sellerId?: string): boolean {
  return (
    sellerId === SEED_SELLER_ID ||
    sellerId === SEED_SELLER_2_ID ||
    sellerId === CEO_OFFICIAL_STORE_ID
  );
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

function generateEfadoId(seedHint?: string): string {
  if (seedHint) {
    const hash = crypto.createHash('sha1').update(seedHint).digest();
    const num = 1000 + (hash.readUInt16BE(0) % 9000);
    return `EFADO-${num}`;
  }
  return `EFADO-${crypto.randomInt(1000, 9999)}`;
}

function isSellerOnline(lastSeenAt?: string, sellerId?: string): boolean {
  if (sellerId === SEED_SELLER_ID || sellerId === CEO_OFFICIAL_STORE_ID) return true;
  if (sellerId === SEED_SELLER_2_ID) return false;
  if (!lastSeenAt) return false;
  const ms = new Date(lastSeenAt).getTime();
  return Number.isFinite(ms) && Date.now() - ms <= ONLINE_WINDOW_MS;
}

function getAuthTokenSecret(): string {
  return (
    process.env.ENCRYPTION_KEY ||
    process.env.PAYSTACK_SECRET_KEY ||
    'efado-fairly-used-market-session-key'
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
  const sid = seller.sellerId || seller.id || '';
  return {
    sellerId: sid,
    efadoId: seller.efadoId || generateEfadoId(sid),
    storeName: seller.storeName || 'EFADO Fairly Used Seller',
    sellerType: seller.sellerType || 'single',
    verified: Boolean(seller.verified ?? true),
    rating: Number(seller.rating ?? 4.8),
    salesCount: Number(seller.salesCount ?? 0),
    location: seller.location || 'Warri, Delta State',
    storeAddress: seller.storeAddress || 'EFADO Safe Exchange Office, Delta State, Warri',
    joinedAt: seller.joinedAt || '2024-02-01T00:00:00.000Z',
    online: isSellerOnline(seller.lastSeenAt, sid),
    lastSeenAt: seller.lastSeenAt || undefined
  };
}

function sanitizeProductForPublic(docData: any, uid?: string) {
  const waitlist: any[] = Array.isArray(docData.waitlist) ? docData.waitlist : [];
  const likedBy: string[] = Array.isArray(docData.videoLikedBy) ? docData.videoLikedBy : [];
  const priceKobo = Number(docData.priceKobo || toMinorUnits(Number(docData.price || 0)));
  const deliveryFeeKobo = docData.freeDelivery
    ? 0
    : Number(docData.deliveryFeeKobo || toMinorUnits(Number(docData.deliveryFee || 0)));
  const sid = String(docData.sellerId || '');
  const efadoId = docData.sellerEfadoId || generateEfadoId(sid);
  const activeNeg = docData.activeNegotiation || null;

  return {
    id: docData.id,
    sellerId: sid,
    sellerEfadoId: efadoId,
    sellerName: docData.sellerName || 'EFADO Seller',
    sellerVerified: Boolean(docData.sellerVerified ?? true),
    sellerRating: Number(docData.sellerRating ?? 4.8),
    sellerSalesCount: Number(docData.sellerSalesCount ?? 0),
    sellerLocation: docData.sellerLocation || 'Warri, Delta State',
    sellerJoinedAt: docData.sellerJoinedAt || '2024-02-01T00:00:00.000Z',
    sellerOnline: isSellerOnline(docData.sellerLastSeenAt, sid),
    sellerLastSeenAt: docData.sellerLastSeenAt || undefined,
    sellerType: docData.sellerType || 'single',
    listingMode: docData.listingMode || 'single',
    bulkTotalQuantity: docData.bulkTotalQuantity ?? undefined,
    bulkItems: Array.isArray(docData.bulkItems) ? docData.bulkItems : undefined,
    bulkTotalPrice: docData.bulkTotalPrice ?? undefined,
    houseDetails: docData.houseDetails || null,
    name: docData.name,
    brand: docData.brand || 'Pre-Owned',
    price: fromMinorUnits(priceKobo),
    priceKobo,
    originalPrice: docData.originalPrice ? Number(docData.originalPrice) : undefined,
    priceDroppedAt: docData.priceDroppedAt || null,
    stock: Math.max(0, Number(docData.stock ?? 0)),
    category: docData.category,
    condition: 'FAIRLY_USED' as const,
    conditionGrade: docData.conditionGrade || 'B',
    reasonForSelling: docData.reasonForSelling || 'Upgraded',
    howLongUsed: docData.howLongUsed || '6 Months',
    workingPerfectly: Boolean(docData.workingPerfectly ?? true),
    faultDescription: docData.faultDescription || 'None — tested and working properly',
    canInspect: Boolean(docData.canInspect ?? true),
    deliveryOption: docData.deliveryOption || 'BOTH',
    negotiable: Boolean(docData.negotiable ?? true),
    keptInEfadoStore: Boolean(docData.keptInEfadoStore ?? false),
    warrantyMonths: Number(docData.warrantyMonths ?? 0),
    photos:
      Array.isArray(docData.photos) && docData.photos.length > 0
        ? docData.photos
        : ['/assets/market/iphone_13_pro_max.jpg'],
    videoUrl: docData.videoUrl || '/assets/fairly-used/demo_iphone.mp4',
    videoLikesCount: Number(docData.videoLikesCount ?? likedBy.length),
    likedVideoByMe: Boolean(uid && likedBy.includes(uid)),
    description: docData.description || '',
    specs: docData.specs || {},
    freeDelivery: Boolean(docData.freeDelivery),
    deliveryFee: fromMinorUnits(deliveryFeeKobo),
    deliveryFeeKobo,
    estimatedDelivery: docData.estimatedDelivery || '1-2 Days / Safe Meet',
    returnDays: Number(docData.returnDays ?? 3),
    rating: Number(docData.rating ?? 4.8),
    reviewsCount: Number(docData.reviewsCount ?? 0),
    salesCount: Number(docData.salesCount ?? 0),
    status: docData.status || (Number(docData.stock ?? 0) > 0 ? 'ACTIVE' : 'SOLD'),
    soldAt: docData.soldAt || null,
    archivedAt: docData.archivedAt || null,
    waitlistCount: waitlist.length,
    isOnWaitlist: Boolean(uid && waitlist.some((w) => (typeof w === 'string' ? w === uid : w?.userId === uid))),
    activeNegotiation: activeNeg,
    createdAt: docData.createdAt || new Date().toISOString(),
    updatedAt: docData.updatedAt || new Date().toISOString()
  };
}

async function createFairlyUsedAlert(params: {
  userId: string;
  type:
    | 'ORDER'
    | 'ESCROW'
    | 'WAITLIST'
    | 'CHAT'
    | 'DISPUTE'
    | 'SECURITY'
    | 'SELLER_SALE'
    | 'VENDOR'
    | 'PRICE_DROP'
    | 'NEGOTIATION';
  title: string;
  message: string;
  orderId?: string;
  productId?: string;
}) {
  try {
    const db = getServerDb();
    const id = `FUALT-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    await db.doc(`fairly_used_alerts/${id}`).set({
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
    console.warn('[Fairly Used Alert] Non-fatal error:', err);
  }
}

async function writeAuditLog(action: string, actorId: string, details: Record<string, any>) {
  try {
    const db = getServerDb();
    const id = `FUAUD-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    await db.doc(`fairly_used_audit_logs/${id}`).set({
      id,
      action,
      actorId,
      details,
      createdAt: new Date().toISOString(),
      timestamp: getServerTimestamp()
    });
  } catch (err) {
    console.warn('[Fairly Used Audit] Non-fatal error:', err);
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

async function ensureSeedCatalog() {
  const db = getServerDb();
  const now = new Date();
  const nowIso = now.toISOString();
  const recentSoldIso = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();

  const seedSellersList = [
    {
      sellerId: SEED_SELLER_ID,
      efadoId: 'EFADO-8421',
      sellerType: 'dealer',
      storeName: 'Delta Trusted Pre-Owned Hub',
      phone: '0803 442 8421',
      verified: true,
      applicationStatus: 'APPROVED',
      rating: 4.9,
      salesCount: 214,
      location: 'Warri, Delta State',
      storeAddress: 'EFADO Safe Exchange Office, Delta State, Warri',
      joinedAt: '2024-02-10T00:00:00.000Z',
      lastSeenAt: nowIso,
      payoutPreference: 'wallet',
      updatedAt: nowIso
    },
    {
      sellerId: SEED_SELLER_2_ID,
      efadoId: 'EFADO-5104',
      sellerType: 'single',
      storeName: 'Tunde Japa Quick Sale',
      phone: '0809 711 5104',
      verified: true,
      applicationStatus: 'APPROVED',
      rating: 4.8,
      salesCount: 18,
      location: 'Lekki, Lagos',
      storeAddress: 'Lekki Phase 1 Gate Inspection Point',
      joinedAt: '2024-06-05T00:00:00.000Z',
      payoutPreference: 'wallet',
      updatedAt: nowIso
    },
    {
      sellerId: CEO_OFFICIAL_STORE_ID,
      efadoId: 'EFADO-9901',
      sellerType: 'dealer',
      storeName: 'EFADO Official In-Store Custody',
      phone: '0802 900 9901',
      verified: true,
      applicationStatus: 'APPROVED',
      rating: 5.0,
      salesCount: 164,
      location: 'Bonny, Rivers State (CEO Store)',
      storeAddress: 'EFADO CEO Store, Hospital Road, Bonny Island',
      joinedAt: '2024-01-01T00:00:00.000Z',
      lastSeenAt: nowIso,
      payoutPreference: 'wallet',
      updatedAt: nowIso
    }
  ];
  for (const s of seedSellersList) {
    if (!fallbackSeedSellers.has(s.sellerId)) {
      fallbackSeedSellers.set(s.sellerId, s);
    }
  }

  if (!fuSeedVerifiedThisBoot) {
    fuSeedVerifiedThisBoot = true;
    try {
      await Promise.all(
        seedSellersList.map((s) =>
          getRawServerDb().doc(`fairly_used_sellers/${s.sellerId}`).set(s, { merge: true })
        )
      );
    } catch {
      // Fallback map stays active if Firestore write requires authenticated user token
    }
  }

  if (fallbackSeedProducts.size > 0) {
    return;
  }

  try {
    const existing = await getRawServerDb().collection('fairly_used_products').limit(1).get();
    if (!existing.empty && fallbackSeedProducts.size > 0) return;
  } catch {
    // ignore read error
  }

  const seedProducts = [
    {
      id: 'fu_iphone_13_pro_max_used',
      sellerId: SEED_SELLER_ID,
      sellerEfadoId: 'EFADO-8421',
      sellerName: 'Delta Trusted Pre-Owned Hub',
      sellerVerified: true,
      sellerRating: 4.9,
      sellerSalesCount: 214,
      sellerLocation: 'Warri, Delta State',
      sellerJoinedAt: '2024-02-10T00:00:00.000Z',
      sellerLastSeenAt: nowIso,
      sellerType: 'dealer',
      listingMode: 'single',
      name: 'UK Used iPhone 13 Pro Max - 256GB (91% Battery)',
      brand: 'Apple',
      price: 780000,
      priceKobo: 78000000,
      stock: 1,
      category: 'Phones',
      condition: 'FAIRLY_USED',
      conditionGrade: 'A',
      reasonForSelling: 'Upgraded',
      howLongUsed: '7 Months',
      workingPerfectly: true,
      faultDescription: 'No fault — FaceID, TrueTone, cameras & battery tested clean',
      canInspect: true,
      deliveryOption: 'BOTH',
      negotiable: true,
      keptInEfadoStore: true,
      photos: [
        '/assets/market/iphone_13_pro_max.jpg',
        '/assets/market/iphone_13_pro_max.jpg',
        '/assets/market/smartwatch_ultra.jpg',
        '/assets/market/iphone_13_pro_max.jpg',
        '/assets/market/iphone_13_pro_max.jpg'
      ],
      videoUrl: '/assets/fairly-used/demo_iphone.mp4',
      videoLikedBy: ['seed_u1', 'seed_u2'],
      videoLikesCount: 2,
      description:
        'Clean UK Used Grade A iPhone 13 Pro Max kept right inside EFADO Store custody for buyer inspection. Zero cracks, Face ID active, unlocked to all networks.',
      specs: {
        ram: '6GB',
        storage: '256GB',
        color: 'Graphite',
        battery: '91% Health',
        model: 'A2484 UK',
        colorsAvailable: ['Graphite'],
        sizesAvailable: ['256GB']
      },
      freeDelivery: false,
      deliveryFee: 3000,
      deliveryFeeKobo: 300000,
      estimatedDelivery: 'Same Day Warri / 1-2 Days Nationwide',
      returnDays: 3,
      rating: 4.9,
      reviewsCount: 12,
      salesCount: 19,
      status: 'ACTIVE',
      soldAt: null,
      waitlist: [],
      activeNegotiation: null,
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'fu_macbook_bulk_office_close',
      sellerId: SEED_SELLER_ID,
      sellerEfadoId: 'EFADO-8421',
      sellerName: 'Delta Trusted Pre-Owned Hub',
      sellerVerified: true,
      sellerRating: 4.9,
      sellerSalesCount: 214,
      sellerLocation: 'Warri, Delta State',
      sellerJoinedAt: '2024-02-10T00:00:00.000Z',
      sellerLastSeenAt: nowIso,
      sellerType: 'business_closing',
      listingMode: 'bulk',
      bulkTotalQuantity: 10,
      bulkTotalPrice: 6800000,
      bulkItems: [
        { name: 'MacBook Pro 14" M1/M2 (Unit 1-5)', quantity: 5, unitPrice: 700000, notes: 'Grade A clean' },
        { name: 'MacBook Pro 14" (Unit 6-10)', quantity: 5, unitPrice: 660000, notes: 'Minor bottom scratch' }
      ],
      name: '10x Used MacBook Pro Laptops — Office Closing Bulk Deal',
      brand: 'Apple',
      price: 680000,
      priceKobo: 68000000,
      stock: 10,
      category: 'Business Bulk',
      condition: 'FAIRLY_USED',
      conditionGrade: 'B',
      reasonForSelling: 'Closing Business',
      howLongUsed: '1 Year',
      workingPerfectly: true,
      faultDescription: 'Very tiny chassis desk wear on 3 units; all screens, keyboards & SSDs working 100%',
      canInspect: true,
      deliveryOption: 'BOTH',
      negotiable: true,
      keptInEfadoStore: false,
      photos: [
        '/assets/market/macbook_pro_14.jpg',
        '/assets/market/macbook_pro_14.jpg',
        '/assets/market/macbook_pro_14.jpg',
        '/assets/market/macbook_pro_14.jpg',
        '/assets/market/macbook_pro_14.jpg'
      ],
      videoUrl: '/assets/fairly-used/demo_macbook.mp4',
      videoLikedBy: ['seed_u1'],
      videoLikesCount: 1,
      description:
        'Design agency closing branch in Warri! 10 working MacBook Pro units tested booting in video. Buy per unit (₦680,000) or negotiate total batch price.',
      specs: {
        ram: '16GB Unified',
        storage: '512GB SSD',
        color: 'Space Black',
        battery: '85%+ Cycle Good',
        model: 'MacBook Pro 14 (10-Unit Lot)'
      },
      freeDelivery: false,
      deliveryFee: 5000,
      deliveryFeeKobo: 500000,
      estimatedDelivery: 'Meet at EFADO Office Warri or Nationwide Courier',
      returnDays: 3,
      rating: 4.8,
      reviewsCount: 6,
      salesCount: 8,
      status: 'ACTIVE',
      soldAt: null,
      waitlist: [],
      activeNegotiation: null,
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'fu_ps5_relocation_japa',
      sellerId: SEED_SELLER_2_ID,
      sellerEfadoId: 'EFADO-5104',
      sellerName: 'Tunde Japa Quick Sale',
      sellerVerified: true,
      sellerRating: 4.8,
      sellerSalesCount: 18,
      sellerLocation: 'Lekki, Lagos',
      sellerJoinedAt: '2024-06-05T00:00:00.000Z',
      sellerType: 'single',
      listingMode: 'single',
      name: 'Neatly Used PS5 Console + 2 DualSense Pads',
      brand: 'Sony',
      price: 540000,
      priceKobo: 54000000,
      stock: 1,
      category: 'Gaming',
      condition: 'FAIRLY_USED',
      conditionGrade: 'A',
      reasonForSelling: 'Relocating Abroad',
      howLongUsed: '5 Months',
      workingPerfectly: true,
      faultDescription: 'None — plays 4K smoothly, HDMI & 2 controllers working cleanly',
      canInspect: true,
      deliveryOption: 'BOTH',
      negotiable: true,
      keptInEfadoStore: false,
      photos: [
        '/assets/market/ps5_console.jpg',
        '/assets/market/ps5_console.jpg',
        '/assets/market/ps5_console.jpg',
        '/assets/market/ps5_console.jpg',
        '/assets/market/ps5_console.jpg'
      ],
      videoUrl: '/assets/fairly-used/demo_ps5.mp4',
      videoLikedBy: ['seed_u1', 'seed_u2', 'seed_u3'],
      videoLikesCount: 3,
      description:
        'Relocating abroad next week — must go fast! Used lightly indoors for 5 months. Includes 2 controllers + power cable.',
      specs: {
        ram: '16GB GDDR6',
        storage: '825GB SSD',
        color: 'White / Black',
        battery: 'AC Direct',
        model: 'CFI-1216A'
      },
      freeDelivery: false,
      deliveryFee: 4000,
      deliveryFeeKobo: 400000,
      estimatedDelivery: 'Pickup or Fast Rider',
      returnDays: 3,
      rating: 4.9,
      reviewsCount: 5,
      salesCount: 7,
      status: 'ACTIVE',
      soldAt: null,
      waitlist: [],
      activeNegotiation: null,
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'fu_espresso_breville_used',
      sellerId: CEO_OFFICIAL_STORE_ID,
      sellerEfadoId: 'EFADO-9901',
      sellerName: 'EFADO Official In-Store Custody',
      sellerVerified: true,
      sellerRating: 5.0,
      sellerSalesCount: 164,
      sellerLocation: 'Bonny, Rivers State (CEO Store)',
      sellerJoinedAt: '2024-01-01T00:00:00.000Z',
      sellerLastSeenAt: nowIso,
      sellerType: 'dealer',
      listingMode: 'single',
      name: 'Breville Barista Express Used Espresso Maker',
      brand: 'Breville',
      price: 510000,
      priceKobo: 51000000,
      stock: 2,
      category: 'Home Appliances',
      condition: 'FAIRLY_USED',
      conditionGrade: 'B',
      reasonForSelling: 'Need Money',
      howLongUsed: '9 Months',
      workingPerfectly: true,
      faultDescription: 'Light water-tray scratch only; steam wand & grinder pump tested strong',
      canInspect: true,
      deliveryOption: 'BOTH',
      negotiable: false,
      keptInEfadoStore: true,
      photos: [
        '/assets/market/espresso_maker.jpg',
        '/assets/market/espresso_maker.jpg',
        '/assets/market/espresso_maker.jpg',
        '/assets/market/espresso_maker.jpg',
        '/assets/market/espresso_maker.jpg'
      ],
      videoUrl: '/assets/fairly-used/demo_appliance.mp4',
      videoLikedBy: ['seed_u1'],
      videoLikesCount: 1,
      description:
        'Inspected & held inside EFADO Store custody. Fixed fair price — ready for immediate Escrow order without negotiation wait.',
      specs: {
        ram: '15-Bar Pump',
        storage: '2L Tank',
        color: 'Stainless Steel',
        battery: '1850W AC',
        model: 'BES870'
      },
      freeDelivery: true,
      deliveryFee: 0,
      deliveryFeeKobo: 0,
      estimatedDelivery: 'Arrives in 1-2 Days',
      returnDays: 3,
      rating: 4.9,
      reviewsCount: 9,
      salesCount: 11,
      status: 'ACTIVE',
      soldAt: null,
      waitlist: [],
      activeNegotiation: null,
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'fu_warri_4bed_duplex_house',
      sellerId: SEED_SELLER_ID,
      sellerEfadoId: 'EFADO-8421',
      sellerName: 'Delta Trusted Pre-Owned Hub',
      sellerVerified: true,
      sellerRating: 4.9,
      sellerSalesCount: 214,
      sellerLocation: 'Warri, Delta State',
      sellerJoinedAt: '2024-02-10T00:00:00.000Z',
      sellerLastSeenAt: nowIso,
      sellerType: 'house_land',
      listingMode: 'single',
      houseDetails: {
        rooms: '4 Bedrooms',
        bathrooms: '5 Bathrooms',
        landSize: '50 x 100 ft (465 sqm)',
        documents: ['C of O', 'Deed', 'Survey', 'Receipt'],
        occupied: 'No',
        fullAddress: 'Plot 18, Bendel Estate Layout, Effurun-Warri, Delta State'
      },
      name: '4-Bedroom Semi-Detached Duplex (Effurun-Warri, C of O)',
      brand: 'Delta Homes',
      price: 45000000,
      priceKobo: 4500000000,
      stock: 1,
      category: 'Houses & Land',
      condition: 'FAIRLY_USED',
      conditionGrade: 'A',
      reasonForSelling: 'Relocating Abroad',
      howLongUsed: '2 Years',
      workingPerfectly: true,
      faultDescription: 'Exterior compound paint needs light touch-up; structure, POP & borehole spotless',
      canInspect: true,
      deliveryOption: 'PICKUP_ONLY',
      negotiable: true,
      keptInEfadoStore: false,
      photos: [
        '/assets/market/espresso_maker.jpg',
        '/assets/market/fashion_sneakers.jpg',
        '/assets/market/smartwatch_ultra.jpg',
        '/assets/market/macbook_pro_14.jpg',
        '/assets/market/iphone_13_pro_max.jpg'
      ],
      videoUrl: '/assets/fairly-used/demo_appliance.mp4',
      videoLikedBy: ['seed_u1'],
      videoLikesCount: 1,
      description:
        'Well-maintained 4-bedroom duplex with complete verified papers (C of O, Deed, Survey, Receipt). Meet at EFADO Office Delta State, Warri before site inspection.',
      specs: {
        ram: '4 Bedrooms / 5 Baths',
        storage: '465 sqm Land',
        color: 'White / Sand',
        battery: 'Solar + Borehole',
        model: 'C of O + Deed Ready'
      },
      freeDelivery: false,
      deliveryFee: 0,
      deliveryFeeKobo: 0,
      estimatedDelivery: 'Physical Inspection at Warri',
      returnDays: 3,
      rating: 5.0,
      reviewsCount: 2,
      salesCount: 1,
      status: 'ACTIVE',
      soldAt: null,
      waitlist: [],
      activeNegotiation: null,
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'fu_watch_ultra_sold_demo',
      sellerId: SEED_SELLER_ID,
      sellerEfadoId: 'EFADO-8421',
      sellerName: 'Delta Trusted Pre-Owned Hub',
      sellerVerified: true,
      sellerRating: 4.9,
      sellerSalesCount: 214,
      sellerLocation: 'Warri, Delta State',
      sellerJoinedAt: '2024-02-10T00:00:00.000Z',
      sellerLastSeenAt: nowIso,
      sellerType: 'dealer',
      listingMode: 'single',
      name: 'Used Apple Watch Ultra 49mm Titanium (Grade B)',
      brand: 'Apple',
      price: 590000,
      priceKobo: 59000000,
      stock: 0,
      category: 'Fashion & Luxury',
      condition: 'FAIRLY_USED',
      conditionGrade: 'B',
      reasonForSelling: 'Upgraded',
      howLongUsed: '10 Months',
      workingPerfectly: true,
      faultDescription: 'Tiny strap clasp rub mark only; sapphire screen scratch-free',
      canInspect: true,
      deliveryOption: 'BOTH',
      negotiable: true,
      keptInEfadoStore: true,
      photos: [
        '/assets/market/smartwatch_ultra.jpg',
        '/assets/market/smartwatch_ultra.jpg',
        '/assets/market/smartwatch_ultra.jpg',
        '/assets/market/smartwatch_ultra.jpg',
        '/assets/market/smartwatch_ultra.jpg'
      ],
      videoUrl: '/assets/fairly-used/demo_watch.mp4',
      videoLikedBy: ['seed_u1'],
      videoLikesCount: 1,
      description:
        'Clean pre-owned Apple Watch Ultra kept in EFADO Store. Click Notify Me When Back if you want alerts when another unit arrives!',
      specs: {
        ram: 'S8 SiP',
        storage: '32GB',
        color: 'Titanium',
        battery: '94% Health',
        model: 'A2622'
      },
      freeDelivery: true,
      deliveryFee: 0,
      deliveryFeeKobo: 0,
      estimatedDelivery: 'Arrives in 1-2 Days',
      returnDays: 3,
      rating: 4.9,
      reviewsCount: 8,
      salesCount: 14,
      status: 'SOLD',
      soldAt: recentSoldIso,
      waitlist: [],
      activeNegotiation: null,
      createdAt: nowIso,
      updatedAt: recentSoldIso
    }
  ];

  for (const prod of seedProducts) {
    if (!fallbackSeedProducts.has(prod.id)) {
      fallbackSeedProducts.set(prod.id, prod);
    }
  }

  const seedReview = {
    id: 'rev_fu_seed_1',
    productId: 'fu_iphone_13_pro_max_used',
    orderId: 'FU-ORD-SEED-101',
    buyerId: 'seed_buyer_fu_1',
    buyerName: 'Eseoghene Daniels',
    rating: 5,
    comment:
      'Inspected at EFADO Office in Warri! Battery matched 91% just like the video. Money was safe in Escrow until I tested SIM & camera.',
    photos: ['/assets/market/iphone_13_pro_max.jpg'],
    verifiedPurchase: true,
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
  };
  if (!fallbackSeedReviews.has(seedReview.id)) {
    fallbackSeedReviews.set(seedReview.id, seedReview);
  }

  try {
    const existing = await getRawServerDb().collection('fairly_used_products').limit(1).get();
    if (existing.empty) {
      for (const prod of seedProducts) {
        await getRawServerDb().doc(`fairly_used_products/${prod.id}`).set(prod, { merge: true });
      }
      await getRawServerDb().doc('fairly_used_reviews/rev_fu_seed_1').set(seedReview, { merge: true });
    }
  } catch {
    // Fallback seed catalog stays cached in memory cleanly when no service account is present
  }
}

/**
 * Hourly maintenance: Move SOLD >24h -> ARCHIVED + auto-release DELIVERED orders past 48h.
 */
export async function runFairlyUsedLifecycleMaintenance(): Promise<{
  archivedCount: number;
  autoReleasedCount: number;
}> {
  const db = getServerDb();
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  let archivedCount = 0;
  let autoReleasedCount = 0;

  try {
    const soldSnap = await db.collection('fairly_used_products').where('status', '==', 'SOLD').get();
    for (const d of soldSnap.docs) {
      const data = d.data() || {};
      const soldAtMs = data.soldAt ? new Date(data.soldAt).getTime() : 0;
      if (soldAtMs > 0 && nowMs - soldAtMs >= TWENTY_FOUR_HOURS_MS) {
        await db.doc(`fairly_used_products/${d.id}`).set(
          {
            status: 'ARCHIVED',
            archivedAt: nowIso,
            activeNegotiation: null,
            updatedAt: nowIso
          },
          { merge: true }
        );
        archivedCount += 1;
      }
    }
  } catch (err) {
    console.warn('[Fairly Used Maintenance] Archive sweep warning:', err);
  }

  try {
    const deliveredSnap = await db.collection('fairly_used_orders').where('status', '==', 'DELIVERED').get();
    for (const d of deliveredSnap.docs) {
      const ord = d.data() || {};
      const autoReleaseMs = ord.autoReleaseAt ? new Date(ord.autoReleaseAt).getTime() : 0;
      if (ord.escrowStatus === 'HELD' && autoReleaseMs > 0 && nowMs >= autoReleaseMs) {
        const released = await releaseFairlyUsedEscrowToSeller(ord.orderId || d.id, 'system_auto_release', true).catch(
          () => false
        );
        if (released) autoReleasedCount += 1;
      }
    }
  } catch (err) {
    console.warn('[Fairly Used Maintenance] Auto-release sweep warning:', err);
  }

  return { archivedCount, autoReleasedCount };
}

async function releaseFairlyUsedEscrowToSeller(
  orderId: string,
  actorId: string,
  isAutoRelease: boolean = false
): Promise<any> {
  const lockKey = `fu_escrow:${orderId}`;
  if (!acquireInFlightLock(lockKey)) {
    throw Object.assign(new Error('Escrow release already in progress for this order.'), { status: 409 });
  }

  try {
    const db = getServerDb();
    const serverTime = getServerTimestamp();
    const nowIso = new Date().toISOString();
    const orderRef = db.doc(`fairly_used_orders/${orderId}`);
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
    const sellerPayoutKobo =
      Number(order.subtotalKobo || 0) + Number(order.deliveryFeeKobo || 0) ||
      Math.max(0, Number(order.grandTotalKobo || 0) - Number(order.serviceChargeKobo || 0));
    const sellerPayoutNgn = fromMinorUnits(sellerPayoutKobo);

    const sellerSnap = await db.doc(`fairly_used_sellers/${sellerId}`).get();
    const sellerProfile = sellerSnap.exists ? sellerSnap.data() || {} : {};
    const payoutPref = sellerProfile.payoutPreference === 'bank' ? 'bank' : 'wallet';

    const payoutRef = `FU-REL-${orderId}-${Date.now()}`;
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
          await db.doc(`fairly_used_sellers/${sellerId}`).set({ recipientCode }, { merge: true });
        }
      }
      if (!recipientCode) {
        throw Object.assign(new Error('Could not resolve Paystack bank recipient for seller.'), { status: 502 });
      }
      const transferRes = await initiateTransfer(
        sellerPayoutNgn,
        recipientCode,
        payoutRef,
        `EFADO Fairly Used Escrow Payout (${orderId})`
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
          hub: 'FAIRLY_USED_MARKET',
          gateway: 'efado_escrow',
          method: 'EFADO Escrow Release',
          purpose: `Fairly Used Sale +${formatNairaPlain(sellerPayoutNgn)} (${cur.productName || orderId})`,
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
            : 'Buyer confirmed item received and verified.',
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

    if (sellerSnap.exists) {
      await db.doc(`fairly_used_sellers/${sellerId}`).set(
        {
          salesCount: Number(sellerProfile.salesCount || 0) + Number(order.quantity || 1),
          updatedAt: nowIso
        },
        { merge: true }
      );
    }

    await Promise.all([
      createFairlyUsedAlert({
        userId: sellerId,
        type: 'ESCROW',
        title: 'Escrow Money Released!',
        message: `${formatNairaPlain(sellerPayoutNgn)} has been credited to your ${payoutChannelLabel} for order ${orderId}.`,
        orderId
      }),
      createFairlyUsedAlert({
        userId: order.buyerId,
        type: 'ORDER',
        title: 'Order Completed',
        message: `Thank you! You confirmed delivery for ${order.productName}. Escrow funds released to seller.`,
        orderId
      }),
      createWalletAlert(
        sellerId,
        'deposit',
        'Fairly Used Escrow Released',
        `+${formatNairaPlain(sellerPayoutNgn)} credited for order ${orderId}.`,
        { orderId, payoutRef }
      ),
      writeAuditLog(isAutoRelease ? 'FU_ESCROW_AUTO_RELEASED' : 'FU_ESCROW_RELEASED', actorId, {
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

  const pendSnap = await db.doc(`pendingFairlyUsedPayments/${reference}`).get();
  if (!pendSnap.exists) {
    throw Object.assign(new Error('Fairly Used payment reference not found.'), { status: 404 });
  }
  const pending = pendSnap.data() || {};
  const orderId = String(pending.orderId || '').trim();
  const lockKey = `fu_pay:${orderId || reference}`;
  if (!acquireInFlightLock(lockKey)) {
    throw Object.assign(new Error('Payment confirmation already in progress.'), { status: 409 });
  }

  try {
    const orderRef = db.doc(`fairly_used_orders/${orderId}`);
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
        const pRef = db.doc(`fairly_used_products/${it.productId}`);
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

        const refundRef = `FU-SOLDOUT-REF-${orderId}`;
        const refundTx = {
          type: 'deposit',
          status: 'completed',
          credited: true,
          amount: refundNgn,
          currency: 'NGN',
          reference: refundRef,
          userId: ord.buyerId,
          hub: 'FAIRLY_USED_MARKET',
          gateway: 'efado_escrow',
          method: 'Auto Refund',
          purpose: `Fairly Used Auto-Refund (Sold Out) +${formatNairaPlain(refundNgn)}`,
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
          description: `${formatNairaPlain(refundNgn)} was instantly refunded to your EFADO Wallet because the item sold out.`,
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
            activeNegotiation: null,
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
        db.doc(`pendingFairlyUsedPayments/${reference}`),
        { status: 'completed', completedAt: nowIso },
        { merge: true }
      );
    });

    const finalSnap = await orderRef.get();
    const finalOrder = finalSnap.exists ? finalSnap.data() : existingOrder;

    if (soldOutConflict) {
      await createFairlyUsedAlert({
        userId: existingOrder.buyerId,
        type: 'ORDER',
        title: 'Item Just Sold Out - Full Refund Issued',
        message: `Sorry, ${existingOrder.productName} sold out during checkout. Your ${formatNairaPlain(existingOrder.grandTotal)} was refunded to your EFADO Wallet.`,
        orderId
      });
      return { order: finalOrder, soldOutRefunded: true };
    }

    await Promise.all([
      createFairlyUsedAlert({
        userId: existingOrder.buyerId,
        type: 'ORDER',
        title: 'Payment Successful - Escrow Active',
        message: `Order ${orderId} confirmed! Pickup Code: ${pickupCode}. Money stays protected until you confirm delivery.`,
        orderId
      }),
      createFairlyUsedAlert({
        userId: existingOrder.sellerId,
        type: 'SELLER_SALE',
        title: 'New Paid Order! Ship Now',
        message: `${existingOrder.productName} (Qty: ${existingOrder.quantity}) paid in Escrow. Pickup Code ${pickupCode}. Please ship or prepare pickup.`,
        orderId
      }),
      writeAuditLog('FU_ORDER_PAID_GATEWAY', existingOrder.buyerId, {
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

let fuSchedulerStarted = false;
export function startFairlyUsedScheduler() {
  if (fuSchedulerStarted) return;
  fuSchedulerStarted = true;
  setTimeout(() => {
    runFairlyUsedLifecycleMaintenance().catch(() => {});
  }, 20000);
  setInterval(() => {
    runFairlyUsedLifecycleMaintenance().catch(() => {});
  }, 60 * 60 * 1000);
}

export function registerFairlyUsedRoutes(app: Express) {
  startFairlyUsedScheduler();

  app.use('/api/fairly-used', (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = String(req.headers.authorization || '').trim();
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    fuBearerStorage.run(token, () => next());
  });

  // =========================================================================
  // 0. FAIRLY USED WEBHOOK INTERCEPTORS (FU- references, pass others via next)
  // =========================================================================
  app.post('/api/webhooks/paystack', async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      const payload = req.body || {};
      const data = payload.data || {};
      const reference = String(data.reference || '').trim();
      const kind = String(data.metadata?.kind || '').trim();
      const isFairlyUsed = kind === 'fairly_used_order' || reference.startsWith('FU-');
      if (!isFairlyUsed) return next();

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
      console.error('[Fairly Used Paystack Webhook Error]:', err);
      return res.status(200).json({ success: true });
    }
  });

  app.post('/api/webhooks/flutterwave', async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      const payload = req.body || {};
      const data = payload.data || payload;
      const txRef = String(data.tx_ref || payload.tx_ref || '').trim();
      const kind = String(data.meta?.kind || '').trim();
      const isFairlyUsed = kind === 'fairly_used_order' || txRef.startsWith('FU-');
      if (!isFairlyUsed) return next();

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
      console.error('[Fairly Used Flutterwave Webhook Error]:', err);
      return res.status(200).json({ success: true });
    }
  });

  // Hourly Cron Sweep Endpoint
  app.get('/api/fairly-used/cron', async (_req: Request, res: Response) => {
    try {
      const result = await runFairlyUsedLifecycleMaintenance();
      return res.json({
        success: true,
        ...result,
        ranAt: new Date().toISOString()
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Lifecycle cron sweep failed.' });
    }
  });

  // Stream uploaded device videos cleanly without bloating product documents
  app.get('/api/fairly-used/media/:productId/video', async (req: Request, res: Response) => {
    try {
      const productId = String(req.params.productId || '').trim();
      const db = getServerDb();
      const mediaSnap = await db.doc(`fairly_used_media/${productId}`).get();
      if (!mediaSnap.exists) {
        return res.redirect('/assets/fairly-used/demo_iphone.mp4');
      }
      const dataUrl = String(mediaSnap.data()?.videoDataUrl || '');
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        return res.redirect('/assets/fairly-used/demo_iphone.mp4');
      }
      const mimeType = match[1] || 'video/mp4';
      const buf = Buffer.from(match[2], 'base64');
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', String(buf.length));
      res.setHeader('Accept-Ranges', 'bytes');
      return res.send(buf);
    } catch {
      return res.redirect('/assets/fairly-used/demo_iphone.mp4');
    }
  });

  // =========================================================================
  // 1. PRODUCT CATALOG, FILTERS, REELS, VIDEO LIKE, PRICE DROP, ARCHIVE & RELIST
  // =========================================================================
  app.get('/api/fairly-used/products', async (req: Request, res: Response) => {
    try {
      await ensureSeedCatalog();
      await runFairlyUsedLifecycleMaintenance().catch(() => {});

      const optionalUser = await verifyBearerUser(req).catch(() => null);
      const db = getServerDb();
      const [snap, sellersSnap] = await Promise.all([
        db.collection('fairly_used_products').get(),
        db.collection('fairly_used_sellers').get()
      ]);

      const sellerPresenceMap = new Map<string, { lastSeenAt?: string; efadoId?: string }>();
      sellersSnap.forEach((s: any) => {
        const sd = s.data() || {};
        sellerPresenceMap.set(s.id, { lastSeenAt: sd.lastSeenAt, efadoId: sd.efadoId });
      });

      const category = String(req.query.category || 'All').trim();
      const search = String(req.query.search || '').trim().toLowerCase();
      const brand = String(req.query.brand || '').trim().toLowerCase();
      const location = String(req.query.location || '').trim().toLowerCase();
      const conditionGrade = String(req.query.conditionGrade || 'all').trim();
      const relocationOnly = String(req.query.relocationOnly || '').toLowerCase() === 'true';
      const negotiableOnly = String(req.query.negotiableOnly || '').toLowerCase() === 'true';
      const inStoreVerifiedOnly = String(req.query.inStoreVerifiedOnly || '').toLowerCase() === 'true';
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
        const sPres = sellerPresenceMap.get(String(raw.sellerId || ''));
        if (sPres?.lastSeenAt) raw.sellerLastSeenAt = sPres.lastSeenAt;
        if (sPres?.efadoId && !raw.sellerEfadoId) raw.sellerEfadoId = sPres.efadoId;

        if (includeArchivedMine && optionalUser) {
          if (
            raw.sellerId === optionalUser.uid ||
            (optionalUser.email && ADMIN_EMAILS.has(optionalUser.email.toLowerCase()) && isOfficialSeedSeller(raw.sellerId))
          ) {
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
            const hay = `${p.name} ${p.brand} ${p.category} ${p.description} ${p.sellerName} ${p.sellerEfadoId} ${p.sellerLocation} ${p.reasonForSelling}`.toLowerCase();
            return hay.includes(search);
          });
        }
        if (brand && brand !== 'all') {
          list = list.filter((p) => String(p.brand || '').toLowerCase() === brand);
        }
        if (location && location !== 'all') {
          list = list.filter((p) => String(p.sellerLocation || '').toLowerCase().includes(location));
        }
        if (conditionGrade && conditionGrade !== 'all') {
          list = list.filter((p) => p.conditionGrade === conditionGrade);
        }
        if (relocationOnly) {
          list = list.filter((p) => p.reasonForSelling === 'Relocating Abroad');
        }
        if (negotiableOnly) {
          list = list.filter((p) => p.negotiable === true);
        }
        if (inStoreVerifiedOnly) {
          list = list.filter((p) => p.keptInEfadoStore === true);
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

      list.sort((a, b) => {
        if (sort === 'price_asc') return a.priceKobo - b.priceKobo;
        if (sort === 'price_desc') return b.priceKobo - a.priceKobo;
        if (sort === 'popular') return (b.videoLikesCount || 0) + (b.salesCount || 0) - ((a.videoLikesCount || 0) + (a.salesCount || 0));
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
      console.error('[Fairly Used Products GET Error]:', err);
      return res.status(500).json({ success: false, message: err?.message || 'Failed to load Fairly Used products.' });
    }
  });

  app.get('/api/fairly-used/reels', async (req: Request, res: Response) => {
    try {
      await ensureSeedCatalog();
      const optionalUser = await verifyBearerUser(req).catch(() => null);
      const db = getServerDb();
      const snap = await db.collection('fairly_used_products').get();
      const nowMs = Date.now();
      const reels: any[] = [];

      snap.forEach((d: any) => {
        const raw = { id: d.id, ...d.data() };
        if (raw.status === 'ARCHIVED') return;
        if (raw.status === 'SOLD' || Number(raw.stock || 0) === 0) {
          const soldAtMs = raw.soldAt ? new Date(raw.soldAt).getTime() : nowMs;
          if (nowMs - soldAtMs > TWENTY_FOUR_HOURS_MS) return;
        }
        const p = sanitizeProductForPublic(raw, optionalUser?.uid);
        reels.push({
          id: `reel_${p.id}`,
          productId: p.id,
          productName: p.name,
          price: p.price,
          videoUrl: p.videoUrl,
          posterUrl: p.photos[0],
          sellerId: p.sellerId,
          sellerName: p.sellerName,
          sellerEfadoId: p.sellerEfadoId,
          sellerLocation: p.sellerLocation,
          conditionGrade: p.conditionGrade,
          reasonForSelling: p.reasonForSelling,
          keptInEfadoStore: p.keptInEfadoStore,
          videoLikesCount: p.videoLikesCount,
          likedVideoByMe: p.likedVideoByMe,
          negotiable: p.negotiable,
          status: p.status,
          activeNegotiation: p.activeNegotiation || null
        });
      });

      reels.sort((a, b) => (a.status === b.status ? b.videoLikesCount - a.videoLikesCount : a.status === 'ACTIVE' ? -1 : 1));
      return res.json({ success: true, reels });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Could not load E-FADO Reels.' });
    }
  });

  app.get('/api/fairly-used/products/:id', async (req: Request, res: Response) => {
    try {
      await ensureSeedCatalog();
      const optionalUser = await verifyBearerUser(req).catch(() => null);
      const id = String(req.params.id || '').trim();
      const db = getServerDb();
      const snap = await db.doc(`fairly_used_products/${id}`).get();
      if (!snap.exists) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }
      const raw: any = { id: snap.id, ...snap.data() };
      const sellerSnap = await db.doc(`fairly_used_sellers/${raw.sellerId}`).get();
      const sData = sellerSnap.exists ? sellerSnap.data() : null;
      if (sData?.lastSeenAt) raw.sellerLastSeenAt = sData.lastSeenAt;
      if (sData?.efadoId) raw.sellerEfadoId = sData.efadoId;

      const seller = stripSellerSensitiveFields(
        sData || {
          sellerId: raw.sellerId,
          efadoId: raw.sellerEfadoId,
          storeName: raw.sellerName,
          sellerType: raw.sellerType,
          verified: raw.sellerVerified,
          rating: raw.sellerRating,
          salesCount: raw.sellerSalesCount,
          location: raw.sellerLocation,
          joinedAt: raw.sellerJoinedAt
        }
      );

      const revSnap = await db.collection('fairly_used_reviews').where('productId', '==', id).get();
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

  app.post('/api/fairly-used/products', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const body = req.body || {};
      const name = String(body.name || '').trim();
      const brand = String(body.brand || '').trim() || 'Pre-Owned';
      const category = String(body.category || '').trim();
      const price = Number(body.price || 0);
      const listingMode = body.listingMode === 'bulk' ? 'bulk' : 'single';
      const sellerType = ['single', 'business_closing', 'house_land', 'dealer'].includes(body.sellerType)
        ? body.sellerType
        : 'single';
      const conditionGrade = ['A', 'B', 'C', 'D'].includes(body.conditionGrade) ? body.conditionGrade : 'B';
      const reasonForSelling = ['Relocating Abroad', 'Need Money', 'Closing Business', 'Upgraded'].includes(
        body.reasonForSelling
      )
        ? body.reasonForSelling
        : 'Upgraded';
      const howLongUsed = String(body.howLongUsed || '').trim();
      const workingPerfectly = Boolean(body.workingPerfectly ?? true);
      const faultDescription = String(body.faultDescription || '').trim();
      const location = String(body.location || '').trim();
      const canInspect = Boolean(body.canInspect ?? true);
      const deliveryOption = ['DELIVERY', 'PICKUP_ONLY', 'BOTH'].includes(body.deliveryOption)
        ? body.deliveryOption
        : 'BOTH';
      const negotiable = Boolean(body.negotiable ?? true);
      const keptInEfadoStore = Boolean(body.keptInEfadoStore ?? false);
      const description = String(body.description || '').trim();
      const freeDelivery = deliveryOption === 'PICKUP_ONLY' ? false : Boolean(body.freeDelivery);
      const deliveryFee = freeDelivery || deliveryOption === 'PICKUP_ONLY' ? 0 : Math.max(0, Number(body.deliveryFee || 0));

      const rawPhotos = Array.isArray(body.photos)
        ? body.photos.filter((p: any) => typeof p === 'string' && p.trim()).map((p: string) => p.trim())
        : [];
      const photos = rawPhotos.slice(0, 5);
      const rawVideo = String(body.videoUrl || body.videoDataUrl || '').trim();

      if (photos.length < 5) {
        return res.status(400).json({
          success: false,
          message: 'Please attach 5 real product photos showing all angles.'
        });
      }
      if (!rawVideo) {
        return res.status(400).json({
          success: false,
          message: 'Please attach 1 real video showing the item working (e.g. TV ON, laptop booting).'
        });
      }
      if (!name || !category || !Number.isFinite(price) || price <= 0 || !howLongUsed || !faultDescription || !location) {
        return res.status(400).json({
          success: false,
          message: 'Product Name, Price, Category, How Long Used, What Is Fault, and Location are required.'
        });
      }

      const bulkItems = Array.isArray(body.bulkItems)
        ? body.bulkItems
            .map((it: any) => ({
              name: String(it?.name || '').trim(),
              quantity: Math.max(1, Math.floor(Number(it?.quantity || 1))),
              unitPrice: Math.max(0, Number(it?.unitPrice || 0)),
              notes: String(it?.notes || '').trim()
            }))
            .filter((it: any) => it.name)
        : [];
      const stock =
        listingMode === 'bulk'
          ? Math.max(1, Math.floor(Number(body.stock || bulkItems.reduce((s: number, i: any) => s + i.quantity, 0) || 1)))
          : Math.max(1, Math.floor(Number(body.stock || 1)));
      const bulkTotalPrice =
        listingMode === 'bulk'
          ? Number(body.bulkTotalPrice || bulkItems.reduce((s: number, i: any) => s + i.quantity * (i.unitPrice || price), 0) || price * stock)
          : undefined;

      let houseDetails: any = null;
      if (sellerType === 'house_land' || category === 'Houses & Land') {
        const hd = body.houseDetails || {};
        const docs = Array.isArray(hd.documents) ? hd.documents.filter(Boolean) : [];
        if (!String(hd.fullAddress || '').trim() || docs.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'House / Land listing requires Full Address and at least one selected Document (C of O, Deed, Survey, or Receipt).'
          });
        }
        houseDetails = {
          rooms: String(hd.rooms || '').trim(),
          bathrooms: String(hd.bathrooms || '').trim(),
          landSize: String(hd.landSize || '').trim(),
          documents: docs,
          occupied: hd.occupied === 'Yes' ? 'Yes' : 'No',
          fullAddress: String(hd.fullAddress || '').trim()
        };
      }

      const totalPhotoBytes = photos.reduce((sum: number, p: string) => sum + Buffer.byteLength(p, 'utf8'), 0);
      if (totalPhotoBytes > 750 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'Combined 5 photos exceed size limit. Please upload lighter images.'
        });
      }
      if (rawVideo.startsWith('data:') && Buffer.byteLength(rawVideo, 'utf8') > 900 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'Video file is too large (keep short video clip under 700KB / ~8 seconds).'
        });
      }

      const db = getServerDb();
      const nowIso = new Date().toISOString();
      const [sellerSnap, userSnap, isAdmin] = await Promise.all([
        db.doc(`fairly_used_sellers/${user.uid}`).get(),
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
            ? 'Your Seller Registration is Pending Approval. You can list items once Admin approves your store.'
            : 'Complete Seller Registration ("Become a Seller") first so buyers stay protected.';
        return res.status(403).json({
          success: false,
          code: 'VENDOR_NOT_VERIFIED',
          message: statusMsg
        });
      }

      const sellerEfadoId = sellerExisting?.efadoId || generateEfadoId(user.uid);
      const sellerData = sellerExisting
        ? { ...sellerExisting, efadoId: sellerEfadoId, lastSeenAt: nowIso }
        : {
            sellerId: user.uid,
            efadoId: sellerEfadoId,
            sellerType,
            storeName: body.storeName || uData.displayName || user.name || 'EFADO Fairly Used Seller',
            phone: uData.phoneNumber || uData.phone || '',
            verified: true,
            applicationStatus: 'APPROVED',
            rating: 5.0,
            salesCount: 0,
            location,
            storeAddress: 'EFADO Safe Exchange Office, Delta State, Warri',
            joinedAt: nowIso,
            lastSeenAt: nowIso,
            payoutPreference: 'wallet'
          };

      await db.doc(`fairly_used_sellers/${user.uid}`).set(sellerData, { merge: true });

      const id = `fu_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      let storedVideoUrl = rawVideo;
      if (rawVideo.startsWith('data:')) {
        await db.doc(`fairly_used_media/${id}`).set({
          productId: id,
          videoDataUrl: rawVideo,
          createdAt: nowIso
        });
        storedVideoUrl = `/api/fairly-used/media/${id}/video`;
      }

      const productDoc = {
        id,
        sellerId: user.uid,
        sellerEfadoId,
        sellerName: sellerData.storeName,
        sellerVerified: true,
        sellerRating: Number(sellerData.rating ?? 4.9),
        sellerSalesCount: Number(sellerData.salesCount ?? 0),
        sellerLocation: location,
        sellerJoinedAt: sellerData.joinedAt || nowIso,
        sellerLastSeenAt: nowIso,
        sellerType,
        listingMode,
        bulkTotalQuantity: listingMode === 'bulk' ? stock : null,
        bulkItems: listingMode === 'bulk' ? bulkItems : [],
        bulkTotalPrice: listingMode === 'bulk' ? bulkTotalPrice : null,
        houseDetails,
        name,
        brand,
        price,
        priceKobo: toMinorUnits(price),
        stock,
        category,
        condition: 'FAIRLY_USED',
        conditionGrade,
        reasonForSelling,
        howLongUsed,
        workingPerfectly,
        faultDescription,
        canInspect,
        deliveryOption,
        negotiable,
        keptInEfadoStore,
        warrantyMonths: 0,
        photos,
        videoUrl: storedVideoUrl,
        videoLikedBy: [],
        videoLikesCount: 0,
        description:
          description ||
          `Grade ${conditionGrade} Fairly Used ${name}. Used ${howLongUsed}. Reason: ${reasonForSelling}. Fault: ${faultDescription}.`,
        specs: {
          ram: String(body.specs?.ram || '').trim() || `Grade ${conditionGrade}`,
          storage: String(body.specs?.storage || '').trim() || `Used ${howLongUsed}`,
          color: String(body.specs?.color || '').trim() || 'Original',
          battery: String(body.specs?.battery || '').trim() || (workingPerfectly ? 'Tested Working' : 'Check Fault Note'),
          model: String(body.specs?.model || '').trim() || brand
        },
        freeDelivery,
        deliveryFee,
        deliveryFeeKobo: toMinorUnits(deliveryFee),
        estimatedDelivery: deliveryOption === 'PICKUP_ONLY' ? 'Pickup / Inspect Only' : '1-2 Days / Safe Meet',
        returnDays: 3,
        rating: 5.0,
        reviewsCount: 0,
        salesCount: 0,
        status: 'ACTIVE',
        soldAt: null,
        waitlist: [],
        activeNegotiation: null,
        createdAt: nowIso,
        updatedAt: nowIso
      };

      await db.doc(`fairly_used_products/${id}`).set(productDoc);
      return res.json({ success: true, product: sanitizeProductForPublic(productDoc, user.uid) });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to publish listing.' });
    }
  });

  // Like / Confirm Working Video
  app.post('/api/fairly-used/products/:id/like-video', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Sign in to like and confirm video.' });

      const id = String(req.params.id || '').trim();
      const db = getServerDb();
      const prodRef = db.doc(`fairly_used_products/${id}`);
      const snap = await prodRef.get();
      if (!snap.exists) return res.status(404).json({ success: false, message: 'Product not found.' });

      const prod = snap.data() || {};
      const likedBy: string[] = Array.isArray(prod.videoLikedBy) ? [...prod.videoLikedBy] : [];
      if (!likedBy.includes(user.uid)) {
        likedBy.push(user.uid);
        await prodRef.set(
          {
            videoLikedBy: likedBy,
            videoLikesCount: likedBy.length,
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }

      const fresh = await prodRef.get();
      return res.json({
        success: true,
        product: sanitizeProductForPublic({ id, ...fresh.data() }, user.uid),
        message: 'Confirmed! Product tagged "Liked / Buyer Confirmed Video".'
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Could not record video like.' });
    }
  });

  // Price Drop Endpoint + Auto Alerts to Chatted Buyers & Waitlist
  app.patch('/api/fairly-used/products/:id/price', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const id = String(req.params.id || '').trim();
      const newPrice = Number(req.body?.price || 0);
      if (!Number.isFinite(newPrice) || newPrice <= 0) {
        return res.status(400).json({ success: false, message: 'Valid positive NGN price is required.' });
      }

      const db = getServerDb();
      const prodRef = db.doc(`fairly_used_products/${id}`);
      const snap = await prodRef.get();
      if (!snap.exists) return res.status(404).json({ success: false, message: 'Product not found.' });

      const prod = snap.data() || {};
      const isAdmin = await isAdminUser(user.uid, user.email);
      if (prod.sellerId !== user.uid && !(isAdmin && isOfficialSeedSeller(prod.sellerId))) {
        return res.status(403).json({ success: false, message: 'Only the listing seller can update the price.' });
      }

      const oldPrice = Number(prod.price || 0);
      const nowIso = new Date().toISOString();
      const isPriceDrop = newPrice < oldPrice;

      await prodRef.set(
        {
          price: newPrice,
          priceKobo: toMinorUnits(newPrice),
          originalPrice: isPriceDrop ? (prod.originalPrice || oldPrice) : prod.originalPrice || null,
          priceDroppedAt: isPriceDrop ? nowIso : prod.priceDroppedAt || null,
          updatedAt: nowIso
        },
        { merge: true }
      );

      let notifiedCount = 0;
      if (isPriceDrop) {
        const targetUsers = new Set<string>();
        const waitlist: any[] = Array.isArray(prod.waitlist) ? prod.waitlist : [];
        waitlist.forEach((w) => {
          const uid = typeof w === 'string' ? w : w?.userId;
          if (uid && uid !== prod.sellerId) targetUsers.add(uid);
        });
        const threadsSnap = await db.collection('fairly_used_chat_threads').where('productId', '==', id).get();
        threadsSnap.forEach((t: any) => {
          const td = t.data() || {};
          if (td.buyerId && td.buyerId !== prod.sellerId) targetUsers.add(td.buyerId);
        });

        for (const targetUid of targetUsers) {
          notifiedCount += 1;
          await createFairlyUsedAlert({
            userId: targetUid,
            type: 'PRICE_DROP',
            title: `Price Drop Alert: ${prod.name}`,
            message: `Price dropped from ${formatNairaPlain(oldPrice)} to ${formatNairaPlain(newPrice)}! Open Fairly Used Market now.`,
            productId: id
          });
        }
      }

      const fresh = await prodRef.get();
      return res.json({
        success: true,
        notifiedCount,
        product: sanitizeProductForPublic({ id, ...fresh.data() }, user.uid),
        message: isPriceDrop
          ? `Price dropped to ${formatNairaPlain(newPrice)}. Sent Price Drop Alert to ${notifiedCount} interested buyer(s).`
          : `Price updated to ${formatNairaPlain(newPrice)}.`
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Could not update price.' });
    }
  });

  app.post('/api/fairly-used/products/:id/relist', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const id = String(req.params.id || '').trim();
      const stock = Math.max(1, Math.floor(Number(req.body?.stock || 1)));
      const newPrice = Number(req.body?.price || 0);

      const db = getServerDb();
      const prodRef = db.doc(`fairly_used_products/${id}`);
      const snap = await prodRef.get();
      if (!snap.exists) return res.status(404).json({ success: false, message: 'Product not found.' });

      const prod = snap.data() || {};
      const isAdmin = await isAdminUser(user.uid, user.email);
      if (prod.sellerId !== user.uid && !(isAdmin && isOfficialSeedSeller(prod.sellerId))) {
        return res.status(403).json({ success: false, message: 'Only the listing seller can relist this item.' });
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
          activeNegotiation: null,
          updatedAt: nowIso
        },
        { merge: true }
      );

      for (const entry of waitlist) {
        const targetUid = typeof entry === 'string' ? entry : entry?.userId;
        if (!targetUid) continue;
        await createFairlyUsedAlert({
          userId: targetUid,
          type: 'WAITLIST',
          title: 'Back In Stock!',
          message: `${prod.name} is back in Fairly Used Market (${stock} unit available at ${formatNairaPlain(priceToUse)}).`,
          productId: id
        });
      }

      const updated = await prodRef.get();
      return res.json({
        success: true,
        notifiedCount: waitlist.length,
        product: sanitizeProductForPublic({ id, ...updated.data() }, user.uid),
        message: `Product relisted with ${stock} unit(s). Notified ${waitlist.length} waitlisted buyer(s).`
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to relist product.' });
    }
  });

  app.post('/api/fairly-used/product/notify-me', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Sign in to join alerts/waitlist.' });

      const productId = String(req.body?.productId || '').trim();
      if (!productId) return res.status(400).json({ success: false, message: 'productId is required.' });

      const db = getServerDb();
      const prodRef = db.doc(`fairly_used_products/${productId}`);
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
        message: "Subscribed! You'll get immediate Price Drop and Restock Alerts."
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Could not subscribe.' });
    }
  });

  app.post('/api/fairly-used/product/sold-archive', async (_req: Request, res: Response) => {
    try {
      const result = await runFairlyUsedLifecycleMaintenance();
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Archive sweep failed.' });
    }
  });

  // =========================================================================
  // 2. NEGOTIATION & SINGLE-BUYER LOCK ENGINE (1 PRODUCT = 1 NEGOTIATION AT A TIME)
  // =========================================================================
  app.post('/api/fairly-used/offer', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Sign in to negotiate price.' });

      const { productId, action, amountNgn, buyerId: targetBuyerId } = req.body || {};
      const cleanProdId = String(productId || '').trim();
      const cleanAction = String(action || 'offer').trim().toLowerCase();
      const numericAmount = Number(amountNgn || 0);

      if (!cleanProdId || !['offer', 'counter', 'accept', 'reject', 'cancel'].includes(cleanAction)) {
        return res.status(400).json({ success: false, message: 'Valid productId and negotiation action are required.' });
      }
      if ((cleanAction === 'offer' || cleanAction === 'counter') && (!Number.isFinite(numericAmount) || numericAmount <= 0)) {
        return res.status(400).json({ success: false, message: 'Enter a valid offer amount in NGN.' });
      }

      const db = getServerDb();
      const prodRef = db.doc(`fairly_used_products/${cleanProdId}`);
      const uSnap = await db.doc(`users/${user.uid}`).get();
      const uData = uSnap.exists ? uSnap.data() || {} : {};
      const actorName = uData.displayName || user.name || user.email.split('@')[0];
      const isAdmin = await isAdminUser(user.uid, user.email);
      const nowIso = new Date().toISOString();

      let chatSaveInfo: {
        threadId: string;
        buyerId: string;
        buyerName: string;
        sellerId: string;
        sellerEfadoId: string;
        sellerName: string;
        productName: string;
        productPhoto: string;
        receiverId: string;
        msgText: string;
        messageType: string;
        offerAmountNgn?: number;
        offerStatus: string;
      } | null = null;

      let updatedRawProd: any = null;

      await db.runTransaction(async (tx: any) => {
        const pSnap = await tx.get(prodRef);
        if (!pSnap.exists) throw Object.assign(new Error('Product not found.'), { status: 404 });
        const pd = pSnap.data() || {};

        if (pd.status === 'SOLD' || pd.status === 'ARCHIVED' || Number(pd.stock || 0) <= 0) {
          throw Object.assign(new Error('Product is SOLD. Nobody can negotiate again.'), { status: 409, code: 'SOLD_OUT' });
        }
        if (!pd.negotiable) {
          throw Object.assign(new Error('This item is fixed-price and not open to negotiation.'), { status: 400 });
        }

        const isSeller = pd.sellerId === user.uid || (isAdmin && isOfficialSeedSeller(pd.sellerId));
        const curLock = pd.activeNegotiation || null;
        const prodPhoto = (Array.isArray(pd.photos) && pd.photos[0]) || '/assets/market/iphone_13_pro_max.jpg';
        const efadoId = pd.sellerEfadoId || generateEfadoId(pd.sellerId);

        if (cleanAction === 'offer') {
          if (isSeller && !targetBuyerId) {
            throw Object.assign(new Error('Sellers cannot submit buyer offers on their own product.'), { status: 400 });
          }
          if (curLock && curLock.buyerId !== user.uid) {
            throw Object.assign(new Error('In Negotiation - Please Wait. Another buyer is currently negotiating this item.'), {
              status: 409,
              code: 'NEGOTIATION_LOCKED'
            });
          }
          const nextLock = {
            buyerId: user.uid,
            buyerName: actorName,
            offerAmountNgn: numericAmount,
            offerAmountKobo: toMinorUnits(numericAmount),
            status: 'PENDING_SELLER' as const,
            proposedBy: 'buyer' as const,
            updatedAt: nowIso
          };
          tx.set(prodRef, { activeNegotiation: nextLock, updatedAt: nowIso }, { merge: true });
          updatedRawProd = { id: cleanProdId, ...pd, activeNegotiation: nextLock, updatedAt: nowIso };
          chatSaveInfo = {
            threadId: `${cleanProdId}__${user.uid}__${pd.sellerId}`,
            buyerId: user.uid,
            buyerName: actorName,
            sellerId: pd.sellerId,
            sellerEfadoId: efadoId,
            sellerName: pd.sellerName,
            productName: pd.name,
            productPhoto: prodPhoto,
            receiverId: pd.sellerId,
            msgText: `I offer ${formatNairaPlain(numericAmount)}`,
            messageType: 'offer',
            offerAmountNgn: numericAmount,
            offerStatus: 'PENDING_SELLER'
          };
          return;
        }

        if (cleanAction === 'counter') {
          if (!isSeller) {
            throw Object.assign(new Error('Only the seller can send a Counter Offer.'), { status: 403 });
          }
          const bId = curLock?.buyerId || String(targetBuyerId || '').trim();
          if (!bId) {
            throw Object.assign(new Error('No active buyer negotiation to counter.'), { status: 400 });
          }
          if (curLock && curLock.buyerId !== bId) {
            throw Object.assign(new Error('Another buyer currently holds the negotiation lock.'), { status: 409 });
          }
          const nextLock = {
            buyerId: bId,
            buyerName: curLock?.buyerName || 'Buyer',
            offerAmountNgn: numericAmount,
            offerAmountKobo: toMinorUnits(numericAmount),
            counterAmountNgn: numericAmount,
            status: 'COUNTERED' as const,
            proposedBy: 'seller' as const,
            updatedAt: nowIso
          };
          tx.set(prodRef, { activeNegotiation: nextLock, updatedAt: nowIso }, { merge: true });
          updatedRawProd = { id: cleanProdId, ...pd, activeNegotiation: nextLock, updatedAt: nowIso };
          chatSaveInfo = {
            threadId: `${cleanProdId}__${bId}__${pd.sellerId}`,
            buyerId: bId,
            buyerName: curLock?.buyerName || 'Buyer',
            sellerId: pd.sellerId,
            sellerEfadoId: efadoId,
            sellerName: pd.sellerName,
            productName: pd.name,
            productPhoto: prodPhoto,
            receiverId: bId,
            msgText: `Seller Counter Offer: ${formatNairaPlain(numericAmount)}`,
            messageType: 'counter',
            offerAmountNgn: numericAmount,
            offerStatus: 'COUNTERED'
          };
          return;
        }

        if (cleanAction === 'accept') {
          if (!curLock) {
            throw Object.assign(new Error('No active offer to accept.'), { status: 400 });
          }
          if (!isSeller && curLock.buyerId !== user.uid) {
            throw Object.assign(new Error('In Negotiation - Please Wait. Another buyer holds this negotiation.'), {
              status: 409,
              code: 'NEGOTIATION_LOCKED'
            });
          }
          if (!isSeller && curLock.proposedBy !== 'seller') {
            throw Object.assign(new Error('Waiting for seller to Accept or Counter your offer.'), { status: 400 });
          }
          const agreedNgn = Number(curLock.counterAmountNgn || curLock.offerAmountNgn || pd.price);
          const agreedKobo = toMinorUnits(agreedNgn);
          const nextLock = {
            ...curLock,
            status: 'AGREED' as const,
            agreedPriceNgn: agreedNgn,
            agreedPriceKobo: agreedKobo,
            updatedAt: nowIso
          };
          tx.set(prodRef, { activeNegotiation: nextLock, updatedAt: nowIso }, { merge: true });
          updatedRawProd = { id: cleanProdId, ...pd, activeNegotiation: nextLock, updatedAt: nowIso };
          chatSaveInfo = {
            threadId: `${cleanProdId}__${curLock.buyerId}__${pd.sellerId}`,
            buyerId: curLock.buyerId,
            buyerName: curLock.buyerName,
            sellerId: pd.sellerId,
            sellerEfadoId: efadoId,
            sellerName: pd.sellerName,
            productName: pd.name,
            productPhoto: prodPhoto,
            receiverId: isSeller ? curLock.buyerId : pd.sellerId,
            msgText: `Offer Accepted! Agreed Price: ${formatNairaPlain(agreedNgn)} — Ready to Buy Now.`,
            messageType: 'accept',
            offerAmountNgn: agreedNgn,
            offerStatus: 'AGREED'
          };
          return;
        }

        // reject or cancel -> releases lock so other buyers can negotiate
        if (!curLock) {
          throw Object.assign(new Error('No active negotiation to close.'), { status: 400 });
        }
        if (!isSeller && curLock.buyerId !== user.uid) {
          throw Object.assign(new Error('You cannot cancel another buyer’s negotiation.'), { status: 403 });
        }
        tx.set(prodRef, { activeNegotiation: null, updatedAt: nowIso }, { merge: true });
        updatedRawProd = { id: cleanProdId, ...pd, activeNegotiation: null, updatedAt: nowIso };
        chatSaveInfo = {
          threadId: `${cleanProdId}__${curLock.buyerId}__${pd.sellerId}`,
          buyerId: curLock.buyerId,
          buyerName: curLock.buyerName,
          sellerId: pd.sellerId,
          sellerEfadoId: efadoId,
          sellerName: pd.sellerName,
          productName: pd.name,
          productPhoto: prodPhoto,
          receiverId: isSeller ? curLock.buyerId : pd.sellerId,
          msgText: cleanAction === 'reject' ? 'Offer declined by seller. Lock cleared.' : 'Buyer cancelled negotiation lock.',
          messageType: 'reject',
          offerAmountNgn: curLock.offerAmountNgn,
          offerStatus: 'REJECTED'
        };
      });

      if (chatSaveInfo) {
        const c: any = chatSaveInfo;
        const msgId = `FUMS-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
        const messageDoc = {
          id: msgId,
          threadId: c.threadId,
          productId: cleanProdId,
          productName: c.productName,
          senderId: user.uid,
          senderName: actorName,
          receiverId: c.receiverId,
          text: c.msgText,
          messageType: c.messageType,
          offerAmountNgn: c.offerAmountNgn,
          offerStatus: c.offerStatus,
          createdAt: nowIso
        };
        await Promise.all([
          db.doc(`fairly_used_chats/${msgId}`).set(messageDoc),
          db.doc(`fairly_used_chat_threads/${c.threadId}`).set(
            {
              threadId: c.threadId,
              productId: cleanProdId,
              productName: c.productName,
              productPhoto: c.productPhoto,
              buyerId: c.buyerId,
              buyerName: c.buyerName,
              sellerId: c.sellerId,
              sellerEfadoId: c.sellerEfadoId,
              sellerName: c.sellerName,
              lastMessage: c.msgText,
              lastMessageAt: nowIso
            },
            { merge: true }
          ),
          createFairlyUsedAlert({
            userId: c.receiverId,
            type: 'NEGOTIATION',
            title: `Price Negotiation: ${c.productName}`,
            message: c.msgText,
            productId: cleanProdId
          })
        ]);
      }

      return res.json({
        success: true,
        product: sanitizeProductForPublic(updatedRawProd, user.uid),
        message: chatSaveInfo ? (chatSaveInfo as any).msgText : 'Negotiation updated.'
      });
    } catch (err: any) {
      return res.status(err?.status || 500).json({
        success: false,
        code: err?.code,
        message: err?.message || 'Negotiation action failed.'
      });
    }
  });

  // =========================================================================
  // 3. PIN STATUS & OTP PIN RESET (Shared wallets/{uid}/security/config)
  // =========================================================================
  app.get('/api/fairly-used/pin/status', async (req: Request, res: Response) => {
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

  app.post('/api/fairly-used/pin/reset-request', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const rl = checkRateLimit(`fu_pin_reset_req:${user.uid}`, 4, 10 * 60 * 1000);
      if (!rl.allowed) {
        return res.status(429).json({ success: false, message: `Wait ${rl.retryAfterSec}s before requesting another code.` });
      }

      const db = getServerDb();
      const userSnap = await db.doc(`users/${user.uid}`).get();
      const uData = userSnap.exists ? userSnap.data() || {} : {};
      const otp = generateNumericOtp();

      await db.doc(`wallets/${user.uid}/security/fairly_used_pin_reset_otp`).set({
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

  app.post('/api/fairly-used/pin/reset-confirm', async (req: Request, res: Response) => {
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
      const otpRef = db.doc(`wallets/${user.uid}/security/fairly_used_pin_reset_otp`);
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
  // 4. CART STOCK CHECK (AND NEGOTIATION AGREEMENT CHECK), ORDER CREATE, AUTHORIZE, PAY, VERIFY
  // =========================================================================
  app.post('/api/fairly-used/cart/check-stock', async (req: Request, res: Response) => {
    try {
      const optionalUser = await verifyBearerUser(req).catch(() => null);
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

        const pSnap = await db.doc(`fairly_used_products/${productId}`).get();
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
        const cleanProduct = sanitizeProductForPublic(pd, optionalUser?.uid);
        const liveStock = Number(cleanProduct.stock || 0);
        const isActive = pd.status === 'ACTIVE';
        const isSoldOut = !isActive || liveStock < 1;
        let available = isActive && liveStock >= requestedQty;
        let reason: string | null = null;

        if (isSoldOut) {
          reason = 'Sorry, this item just sold out';
        } else if (!available) {
          reason = `Only ${liveStock} left in stock for ${cleanProduct.name}`;
        } else if (cleanProduct.negotiable) {
          const neg = cleanProduct.activeNegotiation;
          if (!neg) {
            available = false;
            reason = 'Please negotiate and agree price first';
          } else if (optionalUser && neg.buyerId !== optionalUser.uid) {
            available = false;
            reason = 'In Negotiation - Please Wait';
          } else if (neg.status !== 'AGREED') {
            available = false;
            reason = 'Please negotiate and agree price first';
          }
        }

        if (!available) {
          allAvailable = false;
          if (!blockedMessage) {
            blockedMessage = reason;
          }
        }

        results.push({
          productId,
          exists: true,
          available,
          soldOut: isSoldOut,
          availableStock: liveStock,
          requestedQty,
          agreedPriceNgn: cleanProduct.activeNegotiation?.agreedPriceNgn,
          agreedPriceKobo: cleanProduct.activeNegotiation?.agreedPriceKobo,
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
        message: err?.message || 'Could not verify live product availability.'
      });
    }
  });

  app.post('/api/fairly-used/order/create', async (req: Request, res: Response) => {
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
            message: 'State, City, and Street Address are required for delivery.'
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
        const pSnap = await db.doc(`fairly_used_products/${productId}`).get();
        if (!pSnap.exists) {
          return res.status(404).json({ success: false, message: 'One or more products were not found.' });
        }
        const pd = pSnap.data() || {};
        if (pd.status !== 'ACTIVE' || Number(pd.stock || 0) < qty) {
          return res.status(409).json({
            success: false,
            code: 'SOLD_OUT',
            message: `Sorry, this item just sold out (${pd.name || productId}).`
          });
        }

        // Strict Agreed Price & Single-Buyer Lock Rule for negotiable items!
        let unitPriceKobo = Number(pd.priceKobo || toMinorUnits(Number(pd.price || 0)));
        let agreedPriceUsed = false;
        if (pd.negotiable) {
          const neg = pd.activeNegotiation;
          if (!neg) {
            return res.status(400).json({
              success: false,
              code: 'NEGOTIATE_FIRST',
              message: `Please negotiate and agree price first (${pd.name}).`
            });
          }
          if (neg.buyerId !== user.uid) {
            return res.status(409).json({
              success: false,
              code: 'NEGOTIATION_LOCKED',
              message: `In Negotiation - Please Wait (${pd.name}).`
            });
          }
          if (neg.status !== 'AGREED' || !Number(neg.agreedPriceKobo || 0)) {
            return res.status(400).json({
              success: false,
              code: 'NEGOTIATE_FIRST',
              message: `Please negotiate and agree price first (${pd.name}).`
            });
          }
          unitPriceKobo = Number(neg.agreedPriceKobo);
          agreedPriceUsed = true;
        }

        subtotalKobo += unitPriceKobo * qty;
        if (deliveryMethod === 'DELIVERY' && !pd.freeDelivery) {
          deliveryFeeKobo = Math.max(deliveryFeeKobo, Number(pd.deliveryFeeKobo || toMinorUnits(Number(pd.deliveryFee || 0))));
        }

        resolvedItems.push({
          productId,
          productName: pd.name,
          productPhoto: (Array.isArray(pd.photos) && pd.photos[0]) || '/assets/market/iphone_13_pro_max.jpg',
          sellerId: pd.sellerId,
          sellerEfadoId: pd.sellerEfadoId || generateEfadoId(pd.sellerId),
          sellerName: pd.sellerName,
          sellerVerified: Boolean(pd.sellerVerified ?? true),
          quantity: qty,
          unitPriceKobo,
          unitPrice: fromMinorUnits(unitPriceKobo),
          agreedPriceUsed,
          selectedColor: reqItem.selectedColor || pd.specs?.color || '',
          selectedSize: reqItem.selectedSize || ''
        });
      }

      const serviceChargeKobo = Math.round(subtotalKobo * SERVICE_CHARGE_RATE);
      const grandTotalKobo = subtotalKobo + serviceChargeKobo + deliveryFeeKobo;
      const primary = resolvedItems[0];
      const orderId = `FU-ORD-${crypto.randomInt(100000, 999999)}`;
      const nowIso = new Date().toISOString();

      const pickupLocationLabel =
        deliveryMethod === 'PICKUP_OFFICE'
          ? 'EFADO Office - Delta State, Warri (Safe Exchange Point)'
          : deliveryMethod === 'PICKUP_SELLER'
            ? `${primary.sellerName} Store Pickup Point`
            : `${address.street}, ${address.city}, ${address.state}`;

      const orderDoc = {
        id: orderId,
        orderId,
        buyerId: user.uid,
        buyerEmail: user.email,
        sellerId: primary.sellerId,
        sellerEfadoId: primary.sellerEfadoId,
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

      await db.doc(`fairly_used_orders/${orderId}`).set(orderDoc);
      await writeAuditLog('FU_ORDER_CREATED', user.uid, {
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

  app.post('/api/fairly-used/order/authorize', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const rl = checkRateLimit(`fu_auth:${user.uid}`, 10, 5 * 60 * 1000);
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
      const orderRef = db.doc(`fairly_used_orders/${cleanOrderId}`);
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

      const items: any[] = Array.isArray(order.items) && order.items.length > 0
        ? order.items
        : [{ productId: order.productId, quantity: order.quantity || 1 }];
      for (const it of items) {
        const pSnap = await db.doc(`fairly_used_products/${it.productId}`).get();
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
              '3 wrong PIN attempts were detected during Fairly Used checkout. Your PIN is locked for 15 minutes.',
              { orderId: cleanOrderId }
            ),
            createFairlyUsedAlert({
              userId: user.uid,
              type: 'SECURITY',
              title: 'Security Alert: PIN Locked for 15 Minutes',
              message: '3 wrong PIN attempts blocked on checkout. If this was not you, reset your PIN immediately.',
              orderId: cleanOrderId
            }),
            recordSecurityEvent(user.uid, 'PIN_LOCKED_3_ATTEMPTS', `Locked 15m on FU order ${cleanOrderId}`, req)
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

      if (Number(sec.pinFailedAttempts || 0) > 0) {
        await secRef.set({ pinFailedAttempts: 0 }, { merge: true });
      }

      const requiresOtp = Number(order.grandTotalKobo || 0) > HIGH_VALUE_OTP_THRESHOLD_KOBO;
      if (requiresOtp) {
        const otpRef = db.doc(`wallets/${user.uid}/security/fairly_used_order_otp_${cleanOrderId}`);
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
            reason: `High-value Fairly Used order ${cleanOrderId} (${formatNairaPlain(order.grandTotal)})`
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

  app.post('/api/fairly-used/order/pay', async (req: Request, res: Response) => {
    const user = await verifyBearerUser(req);
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const rl = checkRateLimit(`fu_pay:${user.uid}`, 8, 5 * 60 * 1000);
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

    const lockKey = `fu_pay:${cleanOrderId}`;
    if (!acquireInFlightLock(lockKey)) {
      return res.status(409).json({ success: false, message: 'Payment already processing. Please wait.' });
    }

    try {
      const db = getServerDb();
      const serverTime = getServerTimestamp();
      const nowIso = new Date().toISOString();
      const orderRef = db.doc(`fairly_used_orders/${cleanOrderId}`);
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

      if (cleanMethod === 'wallet') {
        const pickupCode = generatePickupCode();
        const paymentRef = `FU-WAL-${cleanOrderId}-${Date.now()}`;
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
              const pRef = db.doc(`fairly_used_products/${it.productId}`);
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
              hub: 'FAIRLY_USED_MARKET',
              gateway: 'efado_wallet',
              method: 'EFADO Wallet',
              purpose: `Fairly Used Purchase - ${cur.productName} -${formatNairaPlain(cur.grandTotal)}`,
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
                  activeNegotiation: null,
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
          createFairlyUsedAlert({
            userId: user.uid,
            type: 'ORDER',
            title: 'Payment Successful - Escrow Active',
            message: `Paid ${formatNairaPlain(order.grandTotal)} for ${order.productName}. Pickup Code: ${pickupCode}.`,
            orderId: cleanOrderId
          }),
          createFairlyUsedAlert({
            userId: order.sellerId,
            type: 'SELLER_SALE',
            title: 'New Paid Order - Ship or Prepare Pickup',
            message: `${order.productName} paid via EFADO Escrow. Pickup Code: ${pickupCode}.`,
            orderId: cleanOrderId
          }),
          createWalletAlert(
            user.uid,
            'withdrawal',
            'Fairly Used Purchase Protected',
            `-${formatNairaPlain(order.grandTotal)} held in EFADO Escrow for Order ${cleanOrderId}.`,
            { orderId: cleanOrderId, paymentRef }
          ),
          writeAuditLog('FU_ORDER_PAID_WALLET', user.uid, {
            orderId: cleanOrderId,
            paymentRef,
            amountNgn: order.grandTotal
          })
        ]);

        return res.json({ success: true, paid: true, order: finalOrder });
      }

      // EXTERNAL GATEWAYS: Paystack / Flutterwave / OPay
      const items: any[] = Array.isArray(order.items) && order.items.length > 0
        ? order.items
        : [{ productId: order.productId, quantity: order.quantity || 1 }];
      for (const it of items) {
        const pSnap = await db.doc(`fairly_used_products/${it.productId}`).get();
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

      const paymentRef = `FU-${cleanOrderId}-${Date.now()}`;
      const baseOrigin = String(returnOrigin || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
      const callbackUrl = `${baseOrigin}/?fairly_used_order=${encodeURIComponent(cleanOrderId)}&reference=${encodeURIComponent(paymentRef)}&gateway=${encodeURIComponent(effectiveGateway)}`;

      await db.doc(`pendingFairlyUsedPayments/${paymentRef}`).set({
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
              kind: 'fairly_used_order',
              orderId: cleanOrderId,
              buyerId: user.uid
            },
            customizations: {
              title: 'EFADO Fairly Used Escrow',
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
              description: `EFADO Fairly Used Escrow (${cleanOrderId})`
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

      try {
        const ps = await initializePaystackPayment(
          user.email,
          order.grandTotal,
          paymentRef,
          {
            kind: 'fairly_used_order',
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

  app.post('/api/fairly-used/order/verify-payment', async (req: Request, res: Response) => {
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
        const oSnap = await db.doc(`fairly_used_orders/${cleanOrderId}`).get();
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

      const pendSnap = await db.doc(`pendingFairlyUsedPayments/${resolvedRef}`).get();
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
  // 5. ORDERS, TRACKING, SELLER FULFILMENT, ESCROW RELEASE, DISPUTE, ORIGINAL REFUND
  // =========================================================================
  app.get('/api/fairly-used/orders/my-orders', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const db = getServerDb();
      const snap = await db.collection('fairly_used_orders').where('buyerId', '==', user.uid).get();
      const orders: any[] = [];
      snap.forEach((d: any) => orders.push(sanitizeOrderForViewer({ id: d.id, ...d.data() })));
      orders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      return res.json({ success: true, orders });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to load orders.' });
    }
  });

  app.get('/api/fairly-used/orders/seller-orders', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const db = getServerDb();
      const isAdmin = await isAdminUser(user.uid, user.email);
      const snap = await db.collection('fairly_used_orders').get();
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

  app.get('/api/fairly-used/orders/:id/tracking', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const id = String(req.params.id || '').trim();
      const db = getServerDb();
      const snap = await db.doc(`fairly_used_orders/${id}`).get();
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

  app.post('/api/fairly-used/order/ship', async (req: Request, res: Response) => {
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
      const orderRef = db.doc(`fairly_used_orders/${cleanOrderId}`);
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
        OUT_FOR_DELIVERY: 'Out For Delivery / Ready at EFADO Office',
        DELIVERED: ord.deliveryMethod === 'DELIVERY' ? 'Delivered to Address' : 'Ready For Pickup'
      };

      if (!history.some((h: any) => h.step === targetStage)) {
        history.push({
          step: targetStage,
          label: labelMap[targetStage],
          description: `Seller updated fulfilment stage (${labelMap[targetStage]}).`,
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
        createFairlyUsedAlert({
          userId: ord.buyerId,
          type: 'ORDER',
          title: `Order Update: ${labelMap[targetStage]}`,
          message: `${ord.productName} (${cleanOrderId}) is now ${labelMap[targetStage]}. Confirm receipt when in your hands.`,
          orderId: cleanOrderId
        }),
        writeAuditLog('FU_ORDER_SHIPPING_UPDATED', user.uid, {
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

  app.post('/api/fairly-used/order/confirm-delivery', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const rl = checkRateLimit(`fu_confirm:${user.uid}`, 10, 5 * 60 * 1000);
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
        db.doc(`fairly_used_orders/${cleanOrderId}`).get(),
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

      const updatedOrder = await releaseFairlyUsedEscrowToSeller(cleanOrderId, user.uid, false);
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

  app.post('/api/fairly-used/order/dispute', async (req: Request, res: Response) => {
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
      const orderRef = db.doc(`fairly_used_orders/${cleanOrderId}`);
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
      const disputeId = `FU-DSP-${cleanOrderId}-${Date.now()}`;
      const cleanPhotos = Array.isArray(photos) ? photos.filter((p) => typeof p === 'string').slice(0, 5) : [];

      await db.doc(`fairly_used_disputes/${disputeId}`).set({
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
        createFairlyUsedAlert({
          userId: ord.sellerId,
          type: 'DISPUTE',
          title: 'Order Dispute Opened',
          message: `Buyer opened a dispute on ${cleanOrderId}: "${cleanReason}". Escrow is paused for review.`,
          orderId: cleanOrderId
        }),
        createFairlyUsedAlert({
          userId: user.uid,
          type: 'DISPUTE',
          title: 'Dispute Submitted - Money Protected',
          message: `Your money (${formatNairaPlain(ord.grandTotal)}) remains frozen in Escrow while EFADO Support reviews ${cleanOrderId}.`,
          orderId: cleanOrderId
        }),
        writeAuditLog('FU_ORDER_DISPUTED', user.uid, { orderId: cleanOrderId, disputeId, reason: cleanReason })
      ]);

      const updated = await orderRef.get();
      return res.json({ success: true, disputeId, order: updated.data() });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Could not submit dispute.' });
    }
  });

  app.post('/api/fairly-used/order/refund', async (req: Request, res: Response) => {
    const user = await verifyBearerUser(req);
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const isAdmin = await isAdminUser(user.uid, user.email);
    const { orderId } = req.body || {};
    const cleanOrderId = String(orderId || '').trim();
    if (!cleanOrderId) return res.status(400).json({ success: false, message: 'orderId is required.' });

    const lockKey = `fu_escrow:${cleanOrderId}`;
    if (!acquireInFlightLock(lockKey)) {
      return res.status(409).json({ success: false, message: 'Escrow operation in progress.' });
    }

    try {
      const db = getServerDb();
      const serverTime = getServerTimestamp();
      const nowIso = new Date().toISOString();
      const orderRef = db.doc(`fairly_used_orders/${cleanOrderId}`);
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
      const refundRef = `FU-REF-${cleanOrderId}-${Date.now()}`;

      let refundChannelLabel = 'EFADO Wallet (Original Method)';
      let externalRefundId: string | null = null;

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
            merchant_note: `EFADO Fairly Used Escrow Refund (${cleanOrderId})`,
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
          throw Object.assign(new Error('Order escrow state changed.'), { status: 409 });
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
          hub: 'FAIRLY_USED_MARKET',
          gateway: payGateway,
          method: refundChannelLabel,
          purpose: `Fairly Used Escrow Refund to ${refundChannelLabel} (${cur.orderId})`,
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
        createFairlyUsedAlert({
          userId: ord.buyerId,
          type: 'ESCROW',
          title: 'Escrow Refund Issued',
          message: `${formatNairaPlain(ord.grandTotal)} has been refunded to your ${refundChannelLabel} for ${cleanOrderId}.`,
          orderId: cleanOrderId
        }),
        createFairlyUsedAlert({
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
        writeAuditLog('FU_ORDER_REFUNDED', user.uid, {
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
  // 6. EFADO CHAT (NO WHATSAPP — Type, Voice, Photo, Video Call, Offer + Contact)
  // =========================================================================
  app.get('/api/fairly-used/chat/:productId/:sellerId', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Sign in to open EFADO Chat.' });

      const productId = String(req.params.productId || '').trim();
      const sellerId = String(req.params.sellerId || '').trim();
      const buyerParam = String(req.query.buyerId || '').trim();
      const isSeller = user.uid === sellerId || (await isAdminUser(user.uid, user.email));
      const buyerId = isSeller && buyerParam ? buyerParam : user.uid;
      const threadId = `${productId}__${buyerId}__${sellerId}`;

      const db = getServerDb();
      const [msgSnap, prodSnap, sellerSnap] = await Promise.all([
        db.collection('fairly_used_chats').where('threadId', '==', threadId).get(),
        db.doc(`fairly_used_products/${productId}`).get(),
        db.doc(`fairly_used_sellers/${sellerId}`).get()
      ]);

      const messages: any[] = [];
      msgSnap.forEach((d: any) => {
        const data = d.data() || {};
        if (data.text || data.mediaDataUrl) messages.push({ id: d.id, ...data });
      });
      messages.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

      const pd = prodSnap.exists ? prodSnap.data() || {} : null;
      const sd = sellerSnap.exists ? sellerSnap.data() || {} : null;

      return res.json({
        success: true,
        threadId,
        messages,
        product: pd ? sanitizeProductForPublic({ id: productId, ...pd }, user.uid) : null,
        sellerContact: {
          sellerId,
          efadoId: sd?.efadoId || pd?.sellerEfadoId || generateEfadoId(sellerId),
          storeName: sd?.storeName || pd?.sellerName || 'EFADO Seller',
          phone: sd?.phone || '0803 000 EFADO (In-App Chat Only)',
          location: sd?.location || pd?.sellerLocation || 'Warri, Delta State',
          online: isSellerOnline(sd?.lastSeenAt || pd?.sellerLastSeenAt, sellerId),
          lastSeenAt: sd?.lastSeenAt || pd?.sellerLastSeenAt || null
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to load EFADO Chat.' });
    }
  });

  app.get('/api/fairly-used/chats/my', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const isAdmin = await isAdminUser(user.uid, user.email);
      const db = getServerDb();
      const snap = await db.collection('fairly_used_chat_threads').get();
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

  app.post('/api/fairly-used/chat/send', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const { productId, sellerId, buyerId: targetBuyerId, text, messageType, mediaDataUrl } = req.body || {};
      const cleanProductId = String(productId || '').trim();
      const cleanSellerId = String(sellerId || '').trim();
      const cleanText = String(text || '').trim();
      const cleanType = ['text', 'voice', 'photo', 'video_call'].includes(messageType) ? messageType : 'text';
      const cleanMedia = typeof mediaDataUrl === 'string' && mediaDataUrl.trim() ? mediaDataUrl.trim() : undefined;

      if (!cleanProductId || !cleanSellerId || (!cleanText && !cleanMedia)) {
        return res.status(400).json({ success: false, message: 'productId, sellerId, and message or media are required.' });
      }
      if (cleanText.length > 1000) {
        return res.status(400).json({ success: false, message: 'Message cannot exceed 1000 characters.' });
      }
      if (cleanMedia && Buffer.byteLength(cleanMedia, 'utf8') > 450 * 1024) {
        return res.status(400).json({ success: false, message: 'Voice/Photo attachment too large for chat.' });
      }

      const db = getServerDb();
      const [pSnap, uSnap] = await Promise.all([
        db.doc(`fairly_used_products/${cleanProductId}`).get(),
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
      const msgId = `FUMS-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const displayFallback =
        cleanType === 'voice'
          ? 'Voice Note'
          : cleanType === 'photo'
            ? 'Sent a photo'
            : cleanType === 'video_call'
              ? 'Started EFADO Video Inspection Call'
              : '';
      const finalText = cleanText || displayFallback;

      const messageDoc: any = {
        id: msgId,
        threadId,
        productId: cleanProductId,
        productName: prod.name || 'Fairly Used Inquiry',
        senderId: user.uid,
        senderName,
        receiverId,
        text: finalText,
        messageType: cleanType,
        ...(cleanMedia ? { mediaDataUrl: cleanMedia } : {}),
        createdAt: nowIso
      };

      await db.doc(`fairly_used_chats/${msgId}`).set(messageDoc);
      await db.doc(`fairly_used_chat_threads/${threadId}`).set(
        {
          threadId,
          productId: cleanProductId,
          productName: prod.name || 'Fairly Used Inquiry',
          productPhoto: (Array.isArray(prod.photos) && prod.photos[0]) || '/assets/market/iphone_13_pro_max.jpg',
          buyerId: resolvedBuyerId,
          buyerName: isSellerActing ? (targetBuyerId || 'Buyer') : senderName,
          sellerId: cleanSellerId,
          sellerEfadoId: prod.sellerEfadoId || generateEfadoId(cleanSellerId),
          sellerName: prod.sellerName || 'EFADO Seller',
          lastMessage: finalText,
          lastMessageAt: nowIso
        },
        { merge: true }
      );

      // Update seller heartbeat when seller replies
      if (isSellerActing) {
        await db.doc(`fairly_used_sellers/${cleanSellerId}`).set({ lastSeenAt: nowIso }, { merge: true }).catch(() => {});
      }

      await createFairlyUsedAlert({
        userId: receiverId,
        type: 'CHAT',
        title: `EFADO Chat: ${prod.name || 'Product'}`,
        message: `${senderName}: "${finalText.slice(0, 80)}${finalText.length > 80 ? '...' : ''}"`,
        productId: cleanProductId
      });

      return res.json({ success: true, message: messageDoc });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to send message.' });
    }
  });

  app.post('/api/fairly-used/reviews', async (req: Request, res: Response) => {
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
      const id = `FUREV-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
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
      await db.doc(`fairly_used_reviews/${id}`).set(reviewDoc);

      const pRef = db.doc(`fairly_used_products/${cleanProductId}`);
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

  app.get('/api/fairly-used/alerts', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const db = getServerDb();
      const isAdmin = await isAdminUser(user.uid, user.email);
      const snap = await db.collection('fairly_used_alerts').get();
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

  // =========================================================================
  // 7. SELLER PRESENCE, PROFILE, KYC VENDOR REGISTRATION & ADMIN APPROVALS
  // =========================================================================
  function buildSellerProfileResponse(d: any, uid: string, fallbackEmail: string, fallbackName: string, isAdmin: boolean) {
    const efadoId = d?.efadoId || generateEfadoId(uid);
    if (!d) {
      return {
        sellerId: uid,
        efadoId,
        sellerType: 'single',
        storeName: isAdmin ? fallbackName || 'EFADO Official Fairly Used Desk' : '',
        ownerFullName: fallbackName || '',
        phone: '',
        email: fallbackEmail || '',
        state: 'Delta',
        city: 'Warri',
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
        location: isAdmin ? 'Warri, Delta State' : 'Delta State, Nigeria',
        storeAddress: '',
        joinedAt: new Date().toISOString(),
        online: true,
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
      efadoId,
      sellerType: d.sellerType || 'single',
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
      location: d.location || (d.city && d.state ? `${d.city}, ${d.state}` : 'Warri, Delta State'),
      storeAddress: d.storeAddress || '',
      joinedAt: d.joinedAt || new Date().toISOString(),
      online: isSellerOnline(d.lastSeenAt, uid),
      lastSeenAt: d.lastSeenAt || undefined,
      payoutPreference: d.payoutPreference === 'bank' ? 'bank' : 'wallet',
      bankCode: d.bankCode || '',
      bankName: d.bankName || '',
      accountName: d.accountName || '',
      accountNumberMasked: d.accountNumberMasked || ''
    };
  }

  app.post('/api/fairly-used/seller/presence', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const db = getServerDb();
      const nowIso = new Date().toISOString();
      await db.doc(`fairly_used_sellers/${user.uid}`).set({ lastSeenAt: nowIso }, { merge: true });
      return res.json({ success: true, online: true, lastSeenAt: nowIso });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Heartbeat failed.' });
    }
  });

  app.get('/api/fairly-used/seller/profile', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const db = getServerDb();
      const nowIso = new Date().toISOString();
      const [snap, isAdmin] = await Promise.all([
        db.doc(`fairly_used_sellers/${user.uid}`).get(),
        isAdminUser(user.uid, user.email)
      ]);
      const d = snap.exists ? snap.data() || {} : null;
      if (snap.exists) {
        await db.doc(`fairly_used_sellers/${user.uid}`).set({ lastSeenAt: nowIso }, { merge: true }).catch(() => {});
      }
      return res.json({
        success: true,
        profile: buildSellerProfileResponse(d ? { ...d, lastSeenAt: nowIso } : null, user.uid, user.email, user.name || '', isAdmin)
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to load seller profile.' });
    }
  });

  app.post('/api/fairly-used/seller/register', async (req: Request, res: Response) => {
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
      const sellerType = ['single', 'business_closing', 'house_land', 'dealer'].includes(body.sellerType)
        ? body.sellerType
        : 'single';
      const idType = String(body.idType || '').trim();
      const idPhoto = String(body.idPhoto || '').trim();
      const bankName = String(body.bankName || '').trim();
      const bankCode = String(body.bankCode || '').trim();
      const accountNumber = String(body.accountNumber || '').replace(/\D/g, '');
      const accountName = String(body.accountName || '').trim();
      const payoutPreference = body.payoutPreference === 'bank' ? 'bank' : 'wallet';
      const rulesAccepted = Boolean(body.rulesAccepted);

      if (!storeName || storeName.length < 2) {
        return res.status(400).json({ success: false, message: 'Store or Seller Name is required.' });
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
        return res.status(400).json({ success: false, message: 'State, City, and Address are required.' });
      }
      if (!['NIN', "Driver's License", "Voter's Card"].includes(idType)) {
        return res.status(400).json({ success: false, message: "Select ID Type (NIN, Driver's License, or Voter's Card)." });
      }
      if (!rulesAccepted) {
        return res.status(400).json({ success: false, message: 'You must agree to EFADO Seller Rules to submit.' });
      }

      const db = getServerDb();
      const sellerRef = db.doc(`fairly_used_sellers/${user.uid}`);
      const kycRef = db.doc(`fairly_used_seller_kyc/${user.uid}`);
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
      const efadoId = prev.efadoId || generateEfadoId(user.uid);

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
        efadoId,
        sellerType,
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
        lastSeenAt: nowIso,
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

      const adminSnap = await db.collection('users').where('email', 'in', Array.from(ADMIN_EMAILS)).get().catch(() => null);
      const adminAlertPromises: Promise<any>[] = [
        createFairlyUsedAlert({
          userId: CEO_OFFICIAL_STORE_ID,
          type: 'VENDOR',
          title: `New Fairly Used Seller: ${storeName} (${efadoId})`,
          message: `${ownerFullName} (${locationStr}) applied as ${sellerType} with ${idType}. Review in Seller Hub -> Approvals.`
        }),
        createFairlyUsedAlert({
          userId: user.uid,
          type: 'VENDOR',
          title: `Seller Application Pending Approval (${efadoId})`,
          message: `Your Fairly Used seller application for "${storeName}" (${efadoId}) is submitted and Admin has been alerted.`
        }),
        writeAuditLog('FU_SELLER_REGISTRATION_SUBMITTED', user.uid, {
          efadoId,
          storeName,
          sellerType,
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
              `New Fairly Used Seller: ${storeName}`,
              `${ownerFullName} (${efadoId}, ${locationStr}) submitted KYC (${idType}) for Fairly Used Market.`,
              { sellerId: user.uid, storeName, efadoId }
            )
          );
        });
      }
      await Promise.all(adminAlertPromises);

      return res.json({
        success: true,
        message: `Application submitted! Your EFADO ID is ${efadoId}. Pending Approval — Admin notified.`,
        profile: buildSellerProfileResponse(docData, user.uid, email, ownerFullName, isAdmin)
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Could not submit seller registration.' });
    }
  });

  app.get('/api/fairly-used/admin/sellers', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });
      const isAdmin = await isAdminUser(user.uid, user.email);
      if (!isAdmin) {
        return res.status(403).json({ success: false, message: 'Admin access required.' });
      }

      const db = getServerDb();
      const [sellersSnap, kycSnap] = await Promise.all([
        db.collection('fairly_used_sellers').get(),
        db.collection('fairly_used_seller_kyc').get()
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
      return res.status(500).json({ success: false, message: err?.message || 'Failed to load seller applications.' });
    }
  });

  app.post('/api/fairly-used/admin/sellers/:sellerId/review', async (req: Request, res: Response) => {
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
      const sellerRef = db.doc(`fairly_used_sellers/${targetSellerId}`);
      const snap = await sellerRef.get();
      if (!snap.exists) {
        return res.status(404).json({ success: false, message: 'Seller application not found.' });
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
        createFairlyUsedAlert({
          userId: targetSellerId,
          type: 'VENDOR',
          title: approved ? `Seller Approved (${updated.efadoId}) - List Items Now` : 'Seller Application Update',
          message: approved
            ? `Congratulations! "${updated.storeName}" (${updated.efadoId}) is approved to list in Fairly Used Market.`
            : `Your Fairly Used application was not approved: ${patch.rejectionReason}`
        }),
        createWalletAlert(
          targetSellerId,
          approved ? 'reward' : 'security',
          approved ? 'Fairly Used Seller Approved' : 'Fairly Used Seller Declined',
          approved
            ? `Your store "${updated.storeName}" (${updated.efadoId}) is approved on EFADO Fairly Used Market!`
            : patch.rejectionReason,
          { sellerId: targetSellerId }
        ),
        writeAuditLog(approved ? 'FU_VENDOR_APPROVED' : 'FU_VENDOR_REJECTED', user.uid, {
          targetSellerId,
          storeName: updated.storeName,
          reason: patch.rejectionReason
        })
      ]);

      return res.json({
        success: true,
        message: approved
          ? `Approved — ${updated.storeName} (${updated.efadoId}) can now list items!`
          : `Application declined for ${updated.storeName}.`,
        profile: buildSellerProfileResponse(updated, targetSellerId, updated.email || '', updated.ownerFullName || '', false)
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to review seller application.' });
    }
  });

  app.post('/api/fairly-used/seller/profile', async (req: Request, res: Response) => {
    try {
      const user = await verifyBearerUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const { storeName, sellerType, location, storeAddress, phone, payoutPreference, bankCode, bankName, accountName, accountNumber } =
        req.body || {};

      const db = getServerDb();
      const ref = db.doc(`fairly_used_sellers/${user.uid}`);
      const [existing, isAdmin] = await Promise.all([
        ref.get(),
        isAdminUser(user.uid, user.email)
      ]);
      const prev = existing.exists ? existing.data() || {} : {};
      const nowIso = new Date().toISOString();

      const cleanPref = payoutPreference === 'bank' ? 'bank' : 'wallet';
      const cleanAccNum = String(accountNumber || '').replace(/\D/g, '');
      const patch: any = {
        sellerId: user.uid,
        efadoId: prev.efadoId || generateEfadoId(user.uid),
        sellerType: sellerType || prev.sellerType || 'single',
        storeName: String(storeName || prev.storeName || user.name || 'EFADO Seller').trim(),
        phone: String(phone || prev.phone || '').trim(),
        verified: prev.verified ?? isAdmin,
        applicationStatus: prev.applicationStatus || (prev.verified || isAdmin ? 'APPROVED' : 'NOT_APPLIED'),
        rating: prev.rating ?? 4.9,
        salesCount: prev.salesCount ?? 0,
        location: String(location || prev.location || 'Warri, Delta State').trim(),
        storeAddress: String(storeAddress || prev.storeAddress || '').trim(),
        joinedAt: prev.joinedAt || nowIso,
        lastSeenAt: nowIso,
        payoutPreference: cleanPref,
        updatedAt: nowIso
      };

      if (cleanAccNum.length >= 10) {
        patch.accountNumberEncrypted = encryptSensitive(cleanAccNum);
        patch.accountNumberMasked = maskAccountNumber(cleanAccNum);
        patch.bankCode = String(bankCode || prev.bankCode || '').trim();
        patch.bankName = String(bankName || prev.bankName || '').trim();
        patch.accountName = String(accountName || prev.accountName || '').trim();
        patch.recipientCode = '';
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
