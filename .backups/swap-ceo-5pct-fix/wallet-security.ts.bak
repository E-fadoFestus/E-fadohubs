import crypto from 'crypto';
import { auth, getServerDb, getServerTimestamp } from './server-firestore.js';
import {
  ACTIVE_WALLET_CURRENCIES,
  getWalletCurrencyMeta,
  isActiveWalletCurrency,
  isDisabledFutureCurrency,
  normalizeCurrencyCode
} from '../constants/walletCurrencies.js';

export interface VerifiedAuthUser {
  uid: string;
  email: string;
  name?: string;
}

// Ephemeral fallback key only when ENCRYPTION_KEY env var isn't set (never hardcoded literal secret)
const PROCESS_EPHEMERAL_SECRET = crypto.randomBytes(32);

function getAesKey(): Buffer {
  const envSecret = (
    process.env.ENCRYPTION_KEY ||
    process.env.FLUTTERWAVE_ENCRYPTION_KEY ||
    process.env.WALLET_ENCRYPTION_KEY ||
    ''
  ).trim();
  if (envSecret) {
    return crypto.createHash('sha256').update(envSecret).digest();
  }
  return PROCESS_EPHEMERAL_SECRET;
}

export function encryptSensitive(plaintext: string): string {
  const clean = String(plaintext || '').trim();
  if (!clean) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getAesKey(), iv);
  const encrypted = Buffer.concat([cipher.update(clean, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc_v1:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSensitive(value: string): string {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (!raw.startsWith('enc_v1:')) {
    // Plain legacy string stored before encryption rollout
    return raw;
  }
  try {
    const [, ivHex, tagHex, dataHex] = raw.split(':');
    if (!ivHex || !tagHex || !dataHex) return '';
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      getAesKey(),
      Buffer.from(ivHex, 'hex')
    );
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataHex, 'hex')),
      decipher.final()
    ]);
    return decrypted.toString('utf8');
  } catch {
    return '';
  }
}

export function maskAccountNumber(acc: string): string {
  const clean = String(acc || '').trim();
  if (!clean) return '';
  if (clean.includes('*') && clean.length <= 16) return clean;
  if (clean.length <= 4) return `****${clean}`;
  return `****${clean.slice(-4)}`;
}

export function maskCardNumber(card: string): string {
  const clean = String(card || '').replace(/\s+/g, '');
  if (!clean) return '';
  if (clean.includes('****')) return clean;
  if (clean.length <= 4) return `**** **** **** ${clean}`;
  return `**** **** **** ${clean.slice(-4)}`;
}

export function maskCryptoAddress(addr: string): string {
  const clean = String(addr || '').trim();
  if (!clean) return '';
  if (clean.length <= 10) return `${clean.slice(0, 3)}...${clean.slice(-3)}`;
  return `${clean.slice(0, 6)}...${clean.slice(-4)}`;
}

export function maskPhoneNumber(phone: string): string {
  const clean = String(phone || '').trim();
  if (!clean) return '';
  if (clean.length <= 4) return `****${clean}`;
  return `${clean.slice(0, 4)}****${clean.slice(-4)}`;
}

export function hashPin(pin: string): string {
  const cleanPin = String(pin || '').trim();
  if (!/^\d{4}$/.test(cleanPin)) {
    throw new Error('Transaction PIN must be exactly 4 digits.');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(cleanPin, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

export function verifyPinHash(pin: string, storedHash: string): boolean {
  const cleanPin = String(pin || '').trim();
  if (!/^\d{4}$/.test(cleanPin) || !storedHash) return false;
  const parts = storedHash.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, hexDigest] = parts;
  if (!salt || !hexDigest) return false;
  const candidate = crypto.scryptSync(cleanPin, salt, 64);
  const expected = Buffer.from(hexDigest, 'hex');
  if (candidate.length !== expected.length) return false;
  return crypto.timingSafeEqual(candidate, expected);
}

export function hashOtp(code: string): string {
  return crypto.createHash('sha256').update(String(code || '').trim()).digest('hex');
}

export function generateNumericOtp(): string {
  return String(crypto.randomInt(100000, 999999));
}

export function toMinorUnits(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100);
}

export function fromMinorUnits(minor: number): number {
  if (!Number.isFinite(minor)) return 0;
  return Math.round(minor) / 100;
}

export function normalizePersonName(name: string): string[] {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

/**
 * Checks whether a bank-resolved account name reasonably matches the user's verified legal name.
 * Requires at least 2 matching tokens (or 1 if the user only has 1 name token), preventing payouts to unrelated third parties.
 */
export function namesMatchLegalProfile(profileName: string, bankAccountName: string): boolean {
  const profileTokens = normalizePersonName(profileName);
  const bankTokens = normalizePersonName(bankAccountName);
  if (profileTokens.length === 0 || bankTokens.length === 0) return false;

  const bankSet = new Set(bankTokens);
  let matches = 0;
  for (const tok of profileTokens) {
    if (bankSet.has(tok)) matches += 1;
  }

  const requiredMatches = profileTokens.length === 1 || bankTokens.length === 1 ? 1 : 2;
  return matches >= requiredMatches;
}

// Sliding-window rate limiter in memory
const rateLimitStore = new Map<string, number[]>();

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const cutoff = now - windowMs;
  const history = (rateLimitStore.get(key) || []).filter((ts) => ts > cutoff);
  if (history.length >= maxRequests) {
    const oldest = history[0] || now;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    rateLimitStore.set(key, history);
    return { allowed: false, retryAfterSec };
  }
  history.push(now);
  rateLimitStore.set(key, history);
  if (rateLimitStore.size > 10000) {
    rateLimitStore.clear();
  }
  return { allowed: true, retryAfterSec: 0 };
}

/**
 * Checks if current Lagos/WAT (UTC+1) hour is between 22:00 (10PM) and 06:00 (6AM)
 */
export function isNightSafeWindowWat(date = new Date()): boolean {
  const watHour = (date.getUTCHours() + 1) % 24;
  return watHour >= 22 || watHour < 6;
}

/**
 * Strict Firebase ID Token authentication for wallet endpoints.
 */
export async function verifyBearerUser(req: any): Promise<VerifiedAuthUser | null> {
  const authHeader = String(req?.headers?.authorization || req?.headers?.Authorization || '').trim();
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  try {
    const decoded = await auth().verifyIdToken(token);
    if (!decoded?.uid) return null;
    return {
      uid: decoded.uid,
      email: decoded.email || `${decoded.uid}@efado.com`,
      name: decoded.name || undefined
    };
  } catch (err: any) {
    console.warn('[Wallet Auth] verifyIdToken failed:', err?.message || err);
    return null;
  }
}

export function getClientMeta(req: any) {
  const forwarded = String(req?.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = forwarded || req?.socket?.remoteAddress || 'Unknown IP';
  const ua = String(req?.headers?.['user-agent'] || 'Browser Session').slice(0, 160);
  const city = String(req?.headers?.['x-vercel-ip-city'] || req?.headers?.['cf-ipcity'] || 'Lagos, Nigeria');

  let device = 'Desktop Browser';
  if (/iphone|ipad/i.test(ua)) device = 'Apple iOS Device';
  else if (/android/i.test(ua)) device = 'Android Mobile';
  else if (/mobile/i.test(ua)) device = 'Mobile Device';
  else if (/macintosh/i.test(ua)) device = 'Mac Desktop';
  else if (/windows/i.test(ua)) device = 'Windows PC';

  return { ip, ua, city, device };
}

export async function createWalletAlert(
  userId: string,
  category: 'deposit' | 'withdrawal' | 'swap' | 'security' | 'reward',
  title: string,
  message: string,
  metadata?: Record<string, any>
) {
  try {
    const db = getServerDb();
    if (!db) return;
    const alertId = `ALT-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    await db.doc(`wallets/${userId}/alerts/${alertId}`).set({
      id: alertId,
      userId,
      category,
      title,
      message,
      read: false,
      metadata: metadata || {},
      createdAtIso: new Date().toISOString(),
      createdAt: getServerTimestamp()
    });
  } catch (err) {
    console.warn('[Wallet Alert] Non-fatal alert log error:', err);
  }
}

export async function recordSecurityEvent(
  userId: string,
  eventType: string,
  description: string,
  req?: any
) {
  try {
    const db = getServerDb();
    if (!db) return;
    const meta = req ? getClientMeta(req) : { ip: 'Server', ua: 'System', city: 'Lagos, Nigeria', device: 'System' };
    const logId = `SEC-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    await db.doc(`wallets/${userId}/security_logs/${logId}`).set({
      id: logId,
      userId,
      eventType,
      description,
      ip: meta.ip,
      device: meta.device,
      city: meta.city,
      userAgent: meta.ua,
      createdAtIso: new Date().toISOString(),
      createdAt: getServerTimestamp()
    });
  } catch (err) {
    console.warn('[Security Log] Non-fatal log error:', err);
  }
}

// Live FX rates cache (base USD)
interface FxCache {
  fetchedAt: number;
  rates: Record<string, number>;
}

const DEFAULT_USD_RATES: Record<string, number> = {
  USD: 1,
  NGN: 1550,
  GBP: 0.79,
  EUR: 0.92,
  CAD: 1.38,
  AUD: 1.52,
  GHS: 15.2,
  ZAR: 18.1,
  XOF: 605
};

let fxCache: FxCache = {
  fetchedAt: 0,
  rates: { ...DEFAULT_USD_RATES }
};

export async function getLiveFxRates(): Promise<{ rates: Record<string, number>; source: string; updatedAt: string }> {
  const tenMins = 10 * 60 * 1000;
  if (Date.now() - fxCache.fetchedAt < tenMins) {
    return {
      rates: fxCache.rates,
      source: 'live-cached',
      updatedAt: new Date(fxCache.fetchedAt || Date.now()).toISOString()
    };
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const resp = await fetch('https://open.er-api.com/v6/latest/USD', { signal: ctrl.signal });
    clearTimeout(timer);
    if (resp.ok) {
      const json: any = await resp.json();
      if (json?.result === 'success' && json?.rates) {
        const nextRates: Record<string, number> = { ...DEFAULT_USD_RATES };
        for (const cur of ACTIVE_WALLET_CURRENCIES) {
          const val = Number(json.rates[cur.code]);
          if (Number.isFinite(val) && val > 0) {
            nextRates[cur.code] = val;
          }
        }
        fxCache = { fetchedAt: Date.now(), rates: nextRates };
        return {
          rates: nextRates,
          source: 'live-market',
          updatedAt: new Date(fxCache.fetchedAt).toISOString()
        };
      }
    }
  } catch {
    // Fall back to last known / default table gracefully
  }

  return {
    rates: fxCache.rates,
    source: 'market-reference',
    updatedAt: new Date().toISOString()
  };
}

export async function calculateSwapQuote(fromCur: string, toCur: string, amount: number) {
  const from = String(fromCur || 'NGN').toUpperCase();
  const to = String(toCur || 'USD').toUpperCase();
  const { rates, source, updatedAt } = await getLiveFxRates();

  const fromRate = rates[from] || 1;
  const toRate = rates[to] || 1;
  const marketRate = toRate / fromRate;

  const cleanAmount = Math.max(0, Number(amount) || 0);
  const feeRate = 0.005; // 0.5% transparent swap fee
  const feeAmount = fromMinorUnits(Math.round(toMinorUnits(cleanAmount) * feeRate));
  const netInput = fromMinorUnits(toMinorUnits(cleanAmount) - toMinorUnits(feeAmount));
  const convertedMinor = Math.round(toMinorUnits(netInput) * marketRate);
  const receiveAmount = fromMinorUnits(convertedMinor);

  return {
    from,
    to,
    inputAmount: cleanAmount,
    feeAmount,
    feePercent: 0.5,
    rate: Number(marketRate.toFixed(6)),
    receiveAmount,
    source,
    updatedAt
  };
}

export function toIsoStringSafe(ts: any): string {
  if (!ts) return new Date().toISOString();
  if (typeof ts === 'string') return ts;
  if (typeof ts?.toDate === 'function') return ts.toDate().toISOString();
  if (typeof ts?.seconds === 'number') return new Date(ts.seconds * 1000).toISOString();
  if (ts instanceof Date) return ts.toISOString();
  return new Date().toISOString();
}

export async function generateAccountStatementPdf(params: {
  userName: string;
  userEmail: string;
  fromDate: string;
  toDate: string;
  currency: string;
  openingBalance: number;
  closingBalance: number;
  transactions: any[];
}): Promise<Buffer> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const sym = getWalletCurrencyMeta(params.currency).symbol;
  const fmt = (n: number) => `${params.currency} ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Purple header banner
  pdf.setFillColor(124, 58, 237); // #7C3AED
  pdf.rect(0, 0, 210, 34, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text('EFADO WALLET', 14, 16);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('OFFICIAL ACCOUNT STATEMENT', 14, 24);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, 140, 24);

  // Account summary card
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Account Holder: ${params.userName}`, 14, 46);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.text(`Email: ${params.userEmail}`, 14, 52);
  pdf.text(`Period: ${params.fromDate || 'All Time'} to ${params.toDate || 'Present'}`, 14, 58);

  pdf.setFillColor(245, 243, 255);
  pdf.roundedRect(14, 64, 182, 22, 3, 3, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.text('OPENING BALANCE', 20, 72);
  pdf.text('CLOSING BALANCE', 85, 72);
  pdf.text('TRANSACTIONS', 150, 72);

  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(12);
  pdf.text(fmt(params.openingBalance), 20, 80);
  pdf.setTextColor(22, 163, 74); // #16A34A
  pdf.text(fmt(params.closingBalance), 85, 80);
  pdf.setTextColor(124, 58, 237);
  pdf.text(String(params.transactions.length), 150, 80);

  // Table header
  let y = 96;
  pdf.setFillColor(241, 245, 249);
  pdf.rect(14, y, 182, 8, 'F');
  pdf.setTextColor(71, 85, 105);
  pdf.setFontSize(8.5);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DATE', 16, y + 5.5);
  pdf.text('DESCRIPTION / TYPE', 46, y + 5.5);
  pdf.text('REFERENCE', 112, y + 5.5);
  pdf.text('STATUS', 148, y + 5.5);
  pdf.text('AMOUNT', 172, y + 5.5);

  y += 12;
  pdf.setFont('helvetica', 'normal');

  if (params.transactions.length === 0) {
    pdf.setTextColor(100, 116, 139);
    pdf.text('No transactions recorded for this selected period.', 16, y + 4);
  } else {
    for (const tx of params.transactions.slice(0, 45)) {
      if (y > 272) {
        pdf.addPage();
        y = 20;
      }
      const dateStr = toIsoStringSafe(tx.createdAtIso || tx.timestamp).slice(0, 10);
      const label = String(tx.purpose || tx.description || tx.type || 'Transaction').slice(0, 32);
      const refStr = String(tx.reference || tx.id || '-').slice(0, 16);
      const statusStr = String(tx.status || 'completed').toUpperCase();
      const sign = tx.type === 'deposit' || tx.type === 'reward' || tx.type === 'game_win' ? '+' : '-';
      const displayAmt =
        tx.type === 'withdrawal' && Number(tx.fee || 0) > 0
          ? Number(tx.grossDebit ?? Number(tx.amount || 0) + Number(tx.fee || 0))
          : Number(tx.amount || 0);
      const amtStr = `${sign}${sym}${displayAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

      pdf.setTextColor(51, 65, 85);
      pdf.setFontSize(8.5);
      pdf.text(dateStr, 16, y);
      pdf.text(label, 46, y);
      pdf.text(refStr, 112, y);

      if (statusStr === 'COMPLETED' || statusStr === 'SUCCESS') {
        pdf.setTextColor(22, 163, 74);
      } else if (statusStr === 'FAILED') {
        pdf.setTextColor(220, 38, 38);
      } else {
        pdf.setTextColor(124, 58, 237);
      }
      pdf.text(statusStr, 148, y);

      pdf.setTextColor(15, 23, 42);
      pdf.setFont('helvetica', 'bold');
      pdf.text(amtStr, 172, y);
      pdf.setFont('helvetica', 'normal');

      pdf.setDrawColor(226, 232, 240);
      pdf.line(14, y + 2.5, 196, y + 2.5);
      y += 7.5;
    }
  }

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184);
  pdf.text('Protected by 256-bit encryption • EFADO Wallet Compliance: PCI DSS, NDPR, GDPR', 14, 288);

  const arrayBuffer = pdf.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

/**
 * Strict backend currency validation blocking SIRA and any non-active currency.
 */
export function validateBackendCurrency(currency?: string | null): {
  valid: boolean;
  code: string;
  message?: string;
} {
  const code = normalizeCurrencyCode(currency || 'NGN');
  if (isDisabledFutureCurrency(code)) {
    return {
      valid: false,
      code,
      message: `${code} is Coming Soon and blocked on all backend wallet transactions.`
    };
  }
  if (!isActiveWalletCurrency(code)) {
    return {
      valid: false,
      code,
      message: `Currency "${code}" is not supported.`
    };
  }
  return { valid: true, code };
}

/**
 * Process-level atomic lock preventing concurrent double-click/double-charge races.
 */
const activeLocks = new Set<string>();

export function acquireInFlightLock(key: string): boolean {
  if (activeLocks.has(key)) return false;
  activeLocks.add(key);
  return true;
}

export function releaseInFlightLock(key: string): void {
  activeLocks.delete(key);
}

/**
 * Evaluates Name Match, Night Safe Sentry (10PM-6AM WAT), OPAY Shield (<24h new bank), and 2FA OTP requirements.
 */
export function evaluateWithdrawalSecurityGuards(params: {
  profileLegalName: string;
  bankAccountName: string;
  amount: number;
  currency: string;
  twoFactorEnabled: boolean;
  nightSafeEnabled: boolean;
  opayShieldEnabled: boolean;
  bankAddedAt?: string | number | null;
  now?: Date;
  hasValidOtp?: boolean;
}): {
  allowed: boolean;
  statusCode: number;
  code?: 'LEGAL_NAME_REQUIRED' | 'NAME_MISMATCH' | 'OTP_REQUIRED';
  shieldTriggered?: 'NAME_MISMATCH' | 'NIGHT_SAFE_SENTRY' | 'OPAY_PAYMENT_SHIELD' | 'TWO_FACTOR';
  message?: string;
} {
  const legal = String(params.profileLegalName || '').trim();
  const bankAcc = String(params.bankAccountName || '').trim();
  if (!legal) {
    return {
      allowed: false,
      statusCode: 403,
      code: 'LEGAL_NAME_REQUIRED',
      shieldTriggered: 'NAME_MISMATCH',
      message: 'Please complete your verified Legal Name in My Account Profile before withdrawing.'
    };
  }

  if (!namesMatchLegalProfile(legal, bankAcc)) {
    return {
      allowed: false,
      statusCode: 403,
      code: 'NAME_MISMATCH',
      shieldTriggered: 'NAME_MISMATCH',
      message: 'Account name does not match your verified legal name'
    };
  }

  const now = params.now || new Date();
  const isNightWindow = Boolean(params.nightSafeEnabled && isNightSafeWindowWat(now) && params.amount >= 50000);
  const bankAddedMs = params.bankAddedAt ? new Date(params.bankAddedAt).getTime() : 0;
  const isNewBank = bankAddedMs > 0 && now.getTime() - bankAddedMs < 24 * 60 * 60 * 1000;
  const isOpayShieldTriggered = Boolean(params.opayShieldEnabled && isNewBank && params.amount >= 100000);

  if (!params.hasValidOtp && (isNightWindow || isOpayShieldTriggered || params.twoFactorEnabled)) {
    const shieldTriggered = isNightWindow
      ? 'NIGHT_SAFE_SENTRY'
      : isOpayShieldTriggered
        ? 'OPAY_PAYMENT_SHIELD'
        : 'TWO_FACTOR';

    const message = isNightWindow
      ? 'Night Safe Sentry (10PM-6AM): Enter the 6-digit SMS/Email verification code to approve this transfer.'
      : isOpayShieldTriggered
        ? 'OPAY Payment Shield: Newly added bank account (<24h) requires 6-digit SMS/Email verification for transfers of ₦100,000+.'
        : 'Two-Factor Authentication: Enter your 6-digit SMS/Email verification code to confirm withdrawal.';

    return {
      allowed: false,
      statusCode: 403,
      code: 'OTP_REQUIRED',
      shieldTriggered,
      message
    };
  }

  return { allowed: true, statusCode: 200 };
}

export function maskEmailAddress(email?: string): string {
  const clean = String(email || '').trim();
  const [local, domain] = clean.split('@');
  if (!local || !domain) return '***';
  const head = local.slice(0, 2);
  return `${head}***@${domain}`;
}

/**
 * Delivers 6-digit OTP codes strictly via Email and/or SMS gateways (never returned in HTTP responses).
 */
export async function sendSecurityOtpDelivery(params: {
  email?: string;
  phoneNumber?: string;
  otp: string;
  reason: string;
}): Promise<{
  sent: boolean;
  channels: Array<'email' | 'sms'>;
  maskedEmail: string;
  maskedPhone: string;
}> {
  const channels: Array<'email' | 'sms'> = [];
  const email = String(params.email || '').trim();
  const phone = String(params.phoneNumber || '').trim();
  const subject = 'EFADO Wallet Security Verification Code';
  const textBody = `Your EFADO Wallet 6-digit verification code is ${params.otp}. Valid for 10 minutes (${params.reason}). Never share this code with anyone.`;

  // 1. Email delivery via Resend or SendGrid if configured
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  const sendgridKey = (process.env.SENDGRID_API_KEY || '').trim();
  const fromEmail = (process.env.OTP_FROM_EMAIL || 'security@e-fado.com').trim();

  if (email && email.includes('@')) {
    if (resendKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [email],
            subject,
            text: textBody
          })
        });
        if (res.ok) channels.push('email');
      } catch (err) {
        console.warn('[OTP Email Delivery Notice]:', err);
      }
    } else if (sendgridKey) {
      try {
        const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sendgridKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email }] }],
            from: { email: fromEmail },
            subject,
            content: [{ type: 'text/plain', value: textBody }]
          })
        });
        if (res.ok) channels.push('email');
      } catch (err) {
        console.warn('[OTP SendGrid Notice]:', err);
      }
    }
  }

  // 2. SMS delivery via Termii or Twilio if configured
  const termiiKey = (process.env.TERMII_API_KEY || '').trim();
  const termiiSender = (process.env.TERMII_SENDER_ID || 'EFADO').trim();
  const twilioSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  const twilioToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  const twilioFrom = (process.env.TWILIO_FROM_NUMBER || '').trim();

  if (phone && phone.replace(/\D/g, '').length >= 8) {
    if (termiiKey) {
      try {
        const res = await fetch('https://api.ng.termii.com/api/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: phone.replace(/^\+/, ''),
            from: termiiSender,
            sms: textBody,
            type: 'plain',
            channel: 'generic',
            api_key: termiiKey
          })
        });
        if (res.ok) channels.push('sms');
      } catch (err) {
        console.warn('[OTP Termii SMS Notice]:', err);
      }
    } else if (twilioSid && twilioToken && twilioFrom) {
      try {
        const authBasic = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
        const body = new URLSearchParams({
          To: phone.startsWith('+') ? phone : `+${phone}`,
          From: twilioFrom,
          Body: textBody
        });
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${authBasic}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: body.toString()
        });
        if (res.ok) channels.push('sms');
      } catch (err) {
        console.warn('[OTP Twilio SMS Notice]:', err);
      }
    }
  }

  return {
    sent: channels.length > 0,
    channels,
    maskedEmail: maskEmailAddress(email),
    maskedPhone: maskPhoneNumber(phone)
  };
}

/**
 * Reconciles transaction ledger inflows/outflows (including fees & refunds) against stored balances.
 */
export function reconcileLedgerFromTransactions(
  transactions: any[],
  storedBalancesByCurrency: Record<string, number>
): {
  byCurrency: Record<
    string,
    {
      inflows: number;
      outflows: number;
      fees: number;
      ledgerNet: number;
      storedBalance: number;
      delta: number;
      matches: boolean;
    }
  >;
  allMatched: boolean;
} {
  const byCurrency: Record<
    string,
    {
      inflows: number;
      outflows: number;
      fees: number;
      ledgerNet: number;
      storedBalance: number;
      delta: number;
      matches: boolean;
    }
  > = {};

  const ensure = (cur: string) => {
    const code = normalizeCurrencyCode(cur || 'NGN');
    if (!byCurrency[code]) {
      byCurrency[code] = {
        inflows: 0,
        outflows: 0,
        fees: 0,
        ledgerNet: 0,
        storedBalance: storedBalancesByCurrency[code] ?? 0,
        delta: 0,
        matches: true
      };
    }
    return byCurrency[code];
  };

  for (const cur of Object.keys(storedBalancesByCurrency)) {
    ensure(cur);
  }

  for (const tx of transactions) {
    const status = String(tx.status || '').toLowerCase();
    if (status === 'failed' || tx.refunded === true) continue;

    const txType = String(tx.type || '').toLowerCase();
    // Skip pending deposits that have not been credited by a verified gateway/confirmation
    if (txType === 'deposit' && tx.credited !== true && status === 'pending') {
      continue;
    }

    const bucket = ensure(tx.currency || 'NGN');
    const amtMinor = toMinorUnits(Number(tx.amount || 0));
    const feeMinor = txType === 'withdrawal' ? toMinorUnits(Number(tx.fee || 0)) : 0;

    if (txType === 'deposit' || txType === 'reward' || txType === 'game_win') {
      bucket.inflows = fromMinorUnits(toMinorUnits(bucket.inflows) + amtMinor);
    } else if (txType === 'withdrawal' || txType === 'swap' || txType === 'game_bet' || txType === 'payment' || txType === 'payout') {
      const debitMinor =
        txType === 'withdrawal' && tx.grossDebit !== undefined
          ? toMinorUnits(Number(tx.grossDebit))
          : amtMinor + feeMinor;
      bucket.outflows = fromMinorUnits(toMinorUnits(bucket.outflows) + debitMinor);
      if (feeMinor > 0) {
        bucket.fees = fromMinorUnits(toMinorUnits(bucket.fees) + feeMinor);
      }
    }
  }

  let allMatched = true;
  for (const code of Object.keys(byCurrency)) {
    const row = byCurrency[code];
    row.ledgerNet = fromMinorUnits(toMinorUnits(row.inflows) - toMinorUnits(row.outflows));
    row.storedBalance = fromMinorUnits(toMinorUnits(storedBalancesByCurrency[code] ?? 0));
    row.delta = fromMinorUnits(toMinorUnits(row.storedBalance) - toMinorUnits(row.ledgerNet));
    row.matches = Math.abs(row.delta) < 0.01;
    if (!row.matches) allMatched = false;
  }

  return { byCurrency, allMatched };
}

