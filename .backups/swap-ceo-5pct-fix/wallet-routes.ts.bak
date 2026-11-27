import type { Express, Request, Response } from 'express';
import crypto from 'crypto';
import { auth, getServerDb, getServerTimestamp } from './server-firestore.js';
import {
  ACTIVE_WALLET_CURRENCIES,
  FUTURE_WALLET_CURRENCIES,
  getMinDepositForCurrency,
  isDisabledFutureCurrency,
  normalizeCurrencyCode
} from '../constants/walletCurrencies.js';
import {
  initializePaystackPayment,
  verifyPaystackPayment,
  verifyPaystackSignature,
  getPaystackBanks,
  resolveAccountNumber,
  createTransferRecipient,
  initiateTransfer
} from './paystack.js';
import { FLUTTERWAVE_BANKS } from '../data/flutterwaveBanks.js';
import {
  acquireInFlightLock,
  calculateSwapQuote,
  checkRateLimit,
  createWalletAlert,
  decryptSensitive,
  encryptSensitive,
  evaluateWithdrawalSecurityGuards,
  fromMinorUnits,
  generateAccountStatementPdf,
  generateNumericOtp,
  getLiveFxRates,
  hashOtp,
  hashPin,
  maskAccountNumber,
  maskCardNumber,
  maskCryptoAddress,
  maskPhoneNumber,
  namesMatchLegalProfile,
  reconcileLedgerFromTransactions,
  recordSecurityEvent,
  releaseInFlightLock,
  sendSecurityOtpDelivery,
  toIsoStringSafe,
  toMinorUnits,
  validateBackendCurrency,
  verifyBearerUser,
  verifyPinHash,
  type VerifiedAuthUser
} from './wallet-security.js';

type AuthedRequest = Request & { authUser?: VerifiedAuthUser; rawBody?: Buffer };

function hasPaystackSecret(): boolean {
  const raw =
    process.env.PAYSTACK_SECRET_KEY ||
    process.env.PAYSTACK_LIVE ||
    process.env.PAYSTACK_LIVE_SECRET_KEY ||
    process.env.PAYSTACK_SECRET ||
    process.env.VITE_PAYSTACK_SECRET_KEY ||
    '';
  return Boolean(raw.trim().replace(/^['"]|['"]$/g, '').replace(/[;\s]/g, ''));
}

function getFlwSecret(): string {
  return (
    process.env.FLWSECK_LIVE ||
    process.env.FLUTTERWAVE_CLIENT_SECRET ||
    process.env.FLUTTERWAVE_SECRET_KEY ||
    process.env.FLW_SECRET_KEY ||
    process.env.FLWSECK ||
    ''
  )
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/[;\s]/g, '');
}

function getOpayConfig() {
  return {
    secretKey: (process.env.OPAY_SECRET_KEY || '').trim(),
    merchantId: (process.env.OPAY_MERCHANT_ID || process.env.VITE_OPAY_MERCHANT_ID || '').trim()
  };
}

function getBaseUrl(req: Request): string {
  const envUrl = String(process.env.APP_URL || '').trim();
  if (envUrl && !envUrl.includes('MY_APP_URL')) {
    return envUrl.replace(/\/$/, '');
  }
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
  const host = req.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
}

async function requireAuth(req: AuthedRequest, res: Response): Promise<VerifiedAuthUser | null> {
  const user = await verifyBearerUser(req);
  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in to access your EFADO Wallet.'
    });
    return null;
  }
  req.authUser = user;
  return user;
}

function getWithdrawalFee(currency: string): number {
  switch (normalizeCurrencyCode(currency)) {
    case 'NGN':
      return 50;
    case 'GHS':
      return 2;
    case 'ZAR':
      return 10;
    case 'XOF':
      return 200;
    default:
      return 1;
  }
}

async function fetchUserTransactions(db: any, uid: string): Promise<any[]> {
  const items = new Map<string, any>();

  try {
    const subSnap = await db.collection(`wallets/${uid}/transactions`).limit(200).get();
    subSnap.forEach((docSnap: any) => {
      const d = docSnap.data() || {};
      const key = d.reference || docSnap.id;
      items.set(key, {
        id: docSnap.id,
        ...d,
        createdAtIso: toIsoStringSafe(d.createdAtIso || d.timestamp || d.createdAt)
      });
    });
  } catch {
    // Continue to main collection
  }

  try {
    const mainSnap = await db.collection('transactions').where('userId', '==', uid).limit(200).get();
    mainSnap.forEach((docSnap: any) => {
      const d = docSnap.data() || {};
      const key = d.reference || docSnap.id;
      if (!items.has(key)) {
        items.set(key, {
          id: docSnap.id,
          ...d,
          createdAtIso: toIsoStringSafe(d.createdAtIso || d.timestamp || d.createdAt)
        });
      }
    });
  } catch {
    // Safe fallback
  }

  return Array.from(items.values()).sort((a, b) => {
    const ta = new Date(a.createdAtIso || 0).getTime();
    const tb = new Date(b.createdAtIso || 0).getTime();
    return tb - ta;
  });
}

export function registerWalletRoutes(app: Express) {
  // 1. Authenticated Balance & Currency Pockets
  app.get(['/api/wallet/balance', '/api/wallet/pockets'], async (req: AuthedRequest, res: Response) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const db = getServerDb();

      const [userSnap, secSnap, ...pocketSnaps] = await Promise.all([
        db.doc(`users/${user.uid}`).get(),
        db.doc(`wallets/${user.uid}/security/config`).get(),
        ...ACTIVE_WALLET_CURRENCIES.map((cur) =>
          db.doc(`wallets/${user.uid}/${cur.code}/depositWallet`).get()
        )
      ]);

      const userData = userSnap.exists ? (userSnap.data() || {}) : {};
      const secData = secSnap.exists ? (secSnap.data() || {}) : {};

      const pockets: Array<{
        code: string;
        name: string;
        symbol: string;
        flag: string;
        balance: number;
        locked: boolean;
        note?: string;
      }> = [];
      const pocketMap: Record<string, number> = {};

      ACTIVE_WALLET_CURRENCIES.forEach((cur, idx) => {
        const snap = pocketSnaps[idx];
        const rawBal = snap?.exists ? Number(snap.data()?.balance ?? snap.data()?.depositWallet ?? 0) : 0;
        const safeBal = Number.isFinite(rawBal) && rawBal >= 0 ? fromMinorUnits(toMinorUnits(rawBal)) : 0;
        pocketMap[cur.code] = safeBal;
        pockets.push({
          code: cur.code,
          name: cur.name,
          symbol: cur.symbol,
          flag: cur.flag,
          balance: safeBal,
          locked: false
        });
      });

      FUTURE_WALLET_CURRENCIES.forEach((cur) => {
        pockets.push({
          code: cur.code,
          name: cur.name,
          symbol: cur.symbol,
          flag: cur.flag,
          balance: 0,
          locked: true,
          note: cur.note
        });
      });

      const cashOutWallet = Number(userData.cashOutWallet || 0) || 0;
      const mainWallet = pocketMap.NGN ?? Number(userData.depositWallet || 0) ?? 0;
      const promoWallet = Number(userData.promoWallet || 0) || 0;
      const playerWallet = Number(userData.playerWallet || 0) || 0;

      // Convert foreign currency pockets into NGN equivalent for Total Active Balance
      const { rates } = await getLiveFxRates();
      const ngnPerUsd = rates.NGN || 1550;
      let pocketsInNgn = mainWallet;
      for (const cur of ACTIVE_WALLET_CURRENCIES) {
        if (cur.code === 'NGN') continue;
        const bal = pocketMap[cur.code] || 0;
        if (bal > 0) {
          const usdRate = rates[cur.code] || 1;
          pocketsInNgn += (bal / usdRate) * ngnPerUsd;
        }
      }

      const totalActiveBalance = fromMinorUnits(
        toMinorUnits(cashOutWallet + promoWallet + playerWallet + pocketsInNgn)
      );

      return res.json({
        success: true,
        userId: user.uid,
        totalActiveBalance,
        cashOutWallet,
        mainWallet,
        depositWallet: mainWallet,
        promoWallet,
        playerWallet,
        walletPockets: pocketMap,
        pockets,
        security: {
          hasTransactionPin: Boolean(secData.pinHash || userData.hasTransactionPin),
          twoFactorEnabled: Boolean(secData.twoFactorEnabled ?? userData.twoFactorEnabled),
          biometricEnabled: Boolean(secData.biometricEnabled ?? userData.biometricEnabled),
          nightSafeEnabled: secData.nightSafeEnabled !== undefined ? Boolean(secData.nightSafeEnabled) : true,
          opayShieldEnabled: secData.opayShieldEnabled !== undefined ? Boolean(secData.opayShieldEnabled) : true,
          encryptionEnabled: true
        },
        profile: {
          legalName: userData.fullName || userData.displayName || user.name || '',
          alias: userData.alias || '',
          dateOfBirth: userData.dateOfBirth || '',
          nationality: userData.nationality || 'Nigerian',
          country: userData.country || 'Nigeria',
          gender: userData.gender || '',
          address: userData.address || '',
          phoneNumber: userData.phoneNumber || '',
          email: userData.email || user.email,
          bio: userData.bio || '',
          kycStatus: userData.kycStatus || (userData.fullName ? 'verified' : 'pending'),
          bankName: userData.bankName || '',
          bankCode: userData.bankCode || '',
          accountNumberMasked: maskAccountNumber(decryptSensitive(userData.accountNumberEncrypted || userData.accountNumber || '')),
          accountName: userData.accountName || '',
          bankAddedAt: userData.bankAddedAt || null,
          mobileMoneyProvider: userData.mobileMoneyProvider || '',
          mobileMoneyNumberMasked: maskPhoneNumber(decryptSensitive(userData.mobileMoneyEncrypted || userData.mobileMoneyNumber || '')),
          usdtAddressMasked: maskCryptoAddress(decryptSensitive(userData.usdtEncrypted || userData.usdtAddress || '')),
          btcAddressMasked: maskCryptoAddress(decryptSensitive(userData.btcEncrypted || userData.btcAddress || userData.externalWallet || ''))
        }
      });
    } catch (err: any) {
      console.error('[Wallet Balance Error]:', err);
      return res.status(500).json({ success: false, message: 'Could not load wallet balance.' });
    }
  });

  // 2. Deposit Initiation (Paystack, Flutterwave, OPay, Direct Bank, Crypto)
  app.post('/api/wallet/deposit/initiate', async (req: AuthedRequest, res: Response) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;

      const {
        method = 'paystack',
        amount,
        currency = 'NGN',
        phoneNumber = '',
        txHash = '',
        network = 'TRC20'
      } = req.body || {};

      const cleanCurrency = normalizeCurrencyCode(currency);
      if (isDisabledFutureCurrency(cleanCurrency)) {
        return res.status(400).json({
          success: false,
          message: 'SIRA (Burkina Faso) is Coming Soon and not yet enabled.'
        });
      }

      const numAmount = Number(amount);
      const minDeposit = getMinDepositForCurrency(cleanCurrency);
      if (!Number.isFinite(numAmount) || numAmount < minDeposit) {
        return res.status(400).json({
          success: false,
          message: `Minimum deposit for ${cleanCurrency} is ${minDeposit}.`
        });
      }
      if (numAmount > 50000000) {
        return res.status(400).json({
          success: false,
          message: 'Amount exceeds single transaction limit.'
        });
      }

      const db = getServerDb();
      const serverTime = getServerTimestamp();
      const normalizedMethod = String(method).toLowerCase();
      const reference = `EFD-${normalizedMethod.slice(0, 3).toUpperCase()}-${user.uid.slice(0, 6).toUpperCase()}-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

      const pendingRecord = {
        userId: user.uid,
        email: user.email,
        type: 'deposit',
        method: normalizedMethod,
        gateway: normalizedMethod,
        amount: fromMinorUnits(toMinorUnits(numAmount)),
        currency: cleanCurrency,
        reference,
        status: 'pending',
        credited: false,
        createdAtIso: new Date().toISOString(),
        timestamp: serverTime,
        updatedAt: serverTime
      };

      await db.doc(`pendingPayments/${reference}`).set(pendingRecord, { merge: true });
      await db.doc(`transactions/${reference}`).set(pendingRecord, { merge: true });
      await db.doc(`wallets/${user.uid}/transactions/${reference}`).set(pendingRecord, { merge: true });

      const callbackUrl = `${getBaseUrl(req)}/payment/callback?ref=${encodeURIComponent(reference)}`;

      if (normalizedMethod === 'paystack') {
        try {
          const psResp = await initializePaystackPayment(
            user.email,
            numAmount,
            reference,
            { userId: user.uid, currency: cleanCurrency, pocket: cleanCurrency },
            callbackUrl,
            cleanCurrency
          );
          return res.json({
            success: true,
            gateway: 'paystack',
            reference,
            authorization_url: psResp?.data?.authorization_url,
            access_code: psResp?.data?.access_code,
            amount: numAmount,
            currency: cleanCurrency
          });
        } catch (psErr: any) {
          return res.status(psErr?.status || 400).json({
            success: false,
            message: psErr?.message || 'Paystack payment setup failed.'
          });
        }
      }

      if (normalizedMethod === 'flutterwave') {
        const flwSecret = getFlwSecret();
        if (!flwSecret) {
          return res.status(400).json({
            success: false,
            message: 'Flutterwave server key is not configured yet.'
          });
        }
        const flwResp = await fetch('https://api.flutterwave.com/v3/payments', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${flwSecret}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tx_ref: reference,
            amount: numAmount,
            currency: cleanCurrency,
            redirect_url: callbackUrl,
            customer: {
              email: user.email,
              phonenumber: phoneNumber || undefined,
              name: user.name || 'EFADO Member'
            },
            meta: {
              userId: user.uid,
              currency: cleanCurrency
            },
            customizations: {
              title: 'EFADO Wallet Top-Up',
              description: `Fund ${cleanCurrency} Pocket`
            }
          })
        });
        const flwJson: any = await flwResp.json().catch(() => ({}));
        if (!flwResp.ok || flwJson?.status !== 'success' || !flwJson?.data?.link) {
          return res.status(400).json({
            success: false,
            message: flwJson?.message || 'Flutterwave could not initialize payment.'
          });
        }
        return res.json({
          success: true,
          gateway: 'flutterwave',
          reference,
          tx_ref: reference,
          link: flwJson.data.link,
          authorization_url: flwJson.data.link,
          amount: numAmount,
          currency: cleanCurrency
        });
      }

      if (normalizedMethod === 'opay') {
        const { secretKey, merchantId } = getOpayConfig();
        if (secretKey && merchantId) {
          const isTest = secretKey.toLowerCase().includes('test') || secretKey.startsWith('OPAYPUB');
          const opayBase = isTest
            ? 'https://testapi.opaycheckout.com/api/v1/international/cashier/create'
            : 'https://liveapi.opaycheckout.com/api/v1/international/cashier/create';
          try {
            const opayRes = await fetch(opayBase, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${secretKey}`,
                MerchantId: merchantId,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                country: 'NG',
                reference,
                amount: { total: toMinorUnits(numAmount), currency: cleanCurrency },
                returnUrl: callbackUrl,
                callbackUrl: `${getBaseUrl(req)}/api/opay/webhook`,
                cancelUrl: `${getBaseUrl(req)}/`,
                expireAt: 30,
                product: { name: `EFADO ${cleanCurrency} Wallet Top-up`, description: 'Wallet Funding' },
                userInfo: { userEmail: user.email, userId: user.uid, userMobile: phoneNumber || '' }
              })
            });
            const opayJson: any = await opayRes.json().catch(() => ({}));
            const cashierUrl = opayJson?.data?.cashierUrl;
            if (opayRes.ok && cashierUrl) {
              return res.json({
                success: true,
                gateway: 'opay',
                reference,
                cashierUrl,
                amount: numAmount,
                currency: cleanCurrency
              });
            }
          } catch (err) {
            console.warn('[OPay Init Notice]:', err);
          }
        }
        return res.json({
          success: true,
          gateway: 'opay',
          reference,
          requiresVerification: true,
          message: 'OPay reference registered. Complete payment and verify to credit your pocket.',
          amount: numAmount,
          currency: cleanCurrency
        });
      }

      if (normalizedMethod === 'crypto' || normalizedMethod === 'diaspora') {
        return res.json({
          success: true,
          gateway: 'crypto',
          reference,
          network,
          txHash: txHash || '',
          message: 'Crypto / Diaspora deposit reference generated. Submit transaction hash to confirm.',
          amount: numAmount,
          currency: cleanCurrency
        });
      }

      // Direct Bank Transfer pending instructions
      return res.json({
        success: true,
        gateway: 'direct_bank',
        reference,
        amount: numAmount,
        currency: cleanCurrency,
        message: 'Bank transfer reference generated. Upload transfer proof to complete verification.'
      });
    } catch (err: any) {
      console.error('[Deposit Initiate Error]:', err);
      return res.status(500).json({ success: false, message: err?.message || 'Could not start deposit.' });
    }
  });

  // 3. Deposit Verification (Paystack & Flutterwave server verification + atomic credit + concurrency lock)
  app.post('/api/wallet/deposit/verify', async (req: AuthedRequest, res: Response) => {
    let lockKey = '';
    try {
      const user = await requireAuth(req, res);
      if (!user) return;

      const { reference, tx_ref, transaction_id, gateway = 'paystack', currency } = req.body || {};
      const cleanRef = String(reference || tx_ref || '').trim();
      if (!cleanRef) {
        return res.status(400).json({ success: false, message: 'Transaction reference is required.' });
      }

      lockKey = `deposit-verify:${cleanRef}`;
      if (!acquireInFlightLock(lockKey)) {
        return res.status(409).json({
          success: false,
          credited: false,
          message: 'Verification is already in progress for this payment reference.'
        });
      }

      const db = getServerDb();
      const serverTime = getServerTimestamp();
      let verifiedAmount = 0;
      let verifiedCurrency = normalizeCurrencyCode(currency || 'NGN');
      const gw = String(gateway).toLowerCase();

      if (gw === 'flutterwave') {
        const flwSecret = getFlwSecret();
        if (!flwSecret) {
          return res.status(400).json({ success: false, message: 'Flutterwave server key not configured.' });
        }
        const verifyEndpoint = transaction_id
          ? `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(String(transaction_id))}/verify`
          : `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(cleanRef)}`;
        const flwRes = await fetch(verifyEndpoint, {
          headers: { Authorization: `Bearer ${flwSecret}` }
        });
        const flwData: any = await flwRes.json().catch(() => ({}));
        if (!flwRes.ok || flwData?.status !== 'success' || flwData?.data?.status !== 'successful') {
          return res.status(400).json({
            success: false,
            credited: false,
            message: flwData?.message || 'Payment not confirmed by Flutterwave yet.'
          });
        }
        verifiedAmount = Number(flwData.data.amount || 0);
        verifiedCurrency = normalizeCurrencyCode(flwData.data.currency || verifiedCurrency);
      } else {
        const psVerify = await verifyPaystackPayment(cleanRef);
        if (!psVerify?.status || psVerify?.data?.status !== 'success') {
          return res.status(400).json({
            success: false,
            credited: false,
            message: psVerify?.data?.gateway_response || 'Payment not confirmed by Paystack yet.'
          });
        }
        verifiedAmount = fromMinorUnits(Number(psVerify.data.amount || 0));
        verifiedCurrency = normalizeCurrencyCode(psVerify.data.currency || verifiedCurrency);
      }

      const currencyCheck = validateBackendCurrency(verifiedCurrency);
      if (verifiedAmount <= 0 || !currencyCheck.valid) {
        return res.status(400).json({
          success: false,
          credited: false,
          code: 'CURRENCY_LOCKED',
          message: currencyCheck.message || 'Invalid verified deposit amount or currency.'
        });
      }

      const walletRef = db.doc(`wallets/${user.uid}/${verifiedCurrency}/depositWallet`);
      const globalTxRef = db.doc(`transactions/${cleanRef}`);
      const userTxRef = db.doc(`wallets/${user.uid}/transactions/${cleanRef}`);
      const pendingRef = db.doc(`pendingPayments/${cleanRef}`);
      const userRef = db.doc(`users/${user.uid}`);

      let finalBalance = 0;
      let alreadyCredited = false;

      await db.runTransaction(async (tx: any) => {
        const existingTx = await tx.get(globalTxRef);
        const walletSnap = await tx.get(walletRef);
        const currentBal = walletSnap.exists ? Number(walletSnap.data()?.balance ?? walletSnap.data()?.depositWallet ?? 0) : 0;

        if (existingTx.exists && existingTx.data()?.credited === true) {
          alreadyCredited = true;
          finalBalance = currentBal;
          return;
        }

        finalBalance = fromMinorUnits(toMinorUnits(currentBal) + toMinorUnits(verifiedAmount));
        tx.set(
          walletRef,
          {
            balance: finalBalance,
            depositWallet: finalBalance,
            currency: verifiedCurrency,
            userId: user.uid,
            lastFundedRef: cleanRef,
            updatedAt: serverTime
          },
          { merge: true }
        );

        if (verifiedCurrency === 'NGN') {
          tx.set(userRef, { depositWallet: finalBalance, updatedAt: serverTime }, { merge: true });
        }

        const record = {
          type: 'deposit',
          status: 'completed',
          credited: true,
          amount: verifiedAmount,
          currency: verifiedCurrency,
          balanceAfter: finalBalance,
          sourceWallet: 'depositWallet',
          reference: cleanRef,
          userId: user.uid,
          gateway: gw,
          method: gw === 'flutterwave' ? 'Flutterwave' : 'Paystack',
          purpose: `Funded ${verifiedCurrency} Pocket`,
          description: `Verified ${gw === 'flutterwave' ? 'Flutterwave' : 'Paystack'} deposit to ${verifiedCurrency} pocket`,
          createdAtIso: existingTx.exists ? (existingTx.data()?.createdAtIso || new Date().toISOString()) : new Date().toISOString(),
          timestamp: serverTime,
          updatedAt: serverTime
        };

        tx.set(globalTxRef, record, { merge: true });
        tx.set(userTxRef, record, { merge: true });
        tx.set(pendingRef, { status: 'completed', credited: true, updatedAt: serverTime }, { merge: true });
      });

      if (!alreadyCredited) {
        await createWalletAlert(
          user.uid,
          'deposit',
          'Deposit Successful',
          `Your ${verifiedCurrency} pocket has been credited with ${verifiedAmount.toLocaleString()}.`,
          { reference: cleanRef, amount: verifiedAmount, currency: verifiedCurrency }
        );
      }

      return res.json({
        success: true,
        credited: true,
        alreadyCredited,
        reference: cleanRef,
        amount: verifiedAmount,
        currency: verifiedCurrency,
        newBalance: finalBalance
      });
    } catch (err: any) {
      console.error('[Deposit Verify Error]:', err);
      return res.status(500).json({ success: false, credited: false, message: err?.message || 'Verification failed.' });
    } finally {
      if (lockKey) releaseInFlightLock(lockKey);
    }
  });

  // 4. Crypto Deposit Confirm (blocks SIRA, idempotency protected, pending blockchain confirmation)
  app.post('/api/wallet/deposit/crypto/confirm', async (req: AuthedRequest, res: Response) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const { amount, currency = 'USD', network = 'USDT (TRC20)', txHash = '', reference } = req.body || {};

      const curCheck = validateBackendCurrency(currency);
      if (!curCheck.valid) {
        return res.status(400).json({ success: false, code: 'CURRENCY_LOCKED', message: curCheck.message });
      }

      const cleanCurrency = curCheck.code;
      const numAmount = Number(amount);
      const cleanHash = String(txHash || '').trim();
      if (!Number.isFinite(numAmount) || numAmount < getMinDepositForCurrency(cleanCurrency)) {
        return res.status(400).json({ success: false, message: 'Enter a valid deposit amount above minimum.' });
      }
      if (cleanHash.length < 12) {
        return res.status(400).json({ success: false, message: 'Please provide a valid blockchain transaction hash (min 12 chars).' });
      }

      const db = getServerDb();
      const serverTime = getServerTimestamp();
      const ref = String(reference || `EFD-CRYPTO-${crypto.createHash('sha1').update(`${user.uid}:${cleanHash}`).digest('hex').slice(0, 12).toUpperCase()}`).trim();
      const existingSnap = await db.doc(`transactions/${ref}`).get();
      if (existingSnap.exists) {
        return res.status(409).json({
          success: false,
          message: 'This transaction hash has already been submitted.'
        });
      }

      const record = {
        userId: user.uid,
        type: 'deposit',
        status: 'pending',
        credited: false,
        amount: fromMinorUnits(toMinorUnits(numAmount)),
        currency: cleanCurrency,
        gateway: 'crypto',
        method: `Crypto (${network})`,
        purpose: `${network} Deposit Pending Confirmation`,
        description: `Blockchain Tx Hash: ${cleanHash}`,
        reference: ref,
        metadata: { network, txHash: cleanHash },
        createdAtIso: new Date().toISOString(),
        timestamp: serverTime,
        updatedAt: serverTime
      };

      await db.doc(`transactions/${ref}`).set(record, { merge: true });
      await db.doc(`wallets/${user.uid}/transactions/${ref}`).set(record, { merge: true });

      await createWalletAlert(
        user.uid,
        'deposit',
        'Crypto Deposit Submitted',
        `Your ${network} deposit (${cleanCurrency} ${numAmount}) is awaiting network confirmation.`,
        { reference: ref }
      );

      return res.json({
        success: true,
        status: 'pending',
        reference: ref,
        message: 'Crypto transfer submitted for blockchain confirmation.'
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Could not register crypto deposit.' });
    }
  });

  // 5. Webhook Endpoints (/api/webhooks/paystack, /api/webhooks/flutterwave, /api/webhooks/withdraw)
  app.post('/api/webhooks/paystack', async (req: AuthedRequest, res: Response) => {
    try {
      const signature = String(req.headers['x-paystack-signature'] || '');
      const rawBody = req.rawBody || JSON.stringify(req.body || {});
      if (!verifyPaystackSignature(rawBody, signature)) {
        return res.status(401).json({ success: false, message: 'Invalid signature' });
      }
      const payload = req.body || {};
      const event = payload.event;
      const data = payload.data || {};
      const reference = String(data.reference || '').trim();
      const db = getServerDb();
      const serverTime = getServerTimestamp();

      if (event === 'charge.success' && reference) {
        const verifyRes = await verifyPaystackPayment(reference).catch(() => null);
        const vData = verifyRes?.status && verifyRes?.data?.status === 'success' ? verifyRes.data : data;
        const paidAmount = fromMinorUnits(Number(vData.amount || 0));
        const txCurrency = normalizeCurrencyCode(vData.currency || 'NGN');
        const userId = String(vData.metadata?.userId || '').trim();
        if (userId && paidAmount > 0 && !isDisabledFutureCurrency(txCurrency)) {
          const walletRef = db.doc(`wallets/${userId}/${txCurrency}/depositWallet`);
          const globalTxRef = db.doc(`transactions/${reference}`);
          const userTxRef = db.doc(`wallets/${userId}/transactions/${reference}`);
          await db.runTransaction(async (tx: any) => {
            const existing = await tx.get(globalTxRef);
            if (existing.exists && existing.data()?.credited === true) return;
            const wSnap = await tx.get(walletRef);
            const cur = wSnap.exists ? Number(wSnap.data()?.balance ?? wSnap.data()?.depositWallet ?? 0) : 0;
            const nextBal = fromMinorUnits(toMinorUnits(cur) + toMinorUnits(paidAmount));
            tx.set(walletRef, { balance: nextBal, depositWallet: nextBal, currency: txCurrency, userId, updatedAt: serverTime }, { merge: true });
            const rec = {
              type: 'deposit',
              status: 'completed',
              credited: true,
              amount: paidAmount,
              currency: txCurrency,
              reference,
              userId,
              gateway: 'paystack',
              method: 'Paystack',
              purpose: `Funded ${txCurrency} Pocket`,
              createdAtIso: new Date().toISOString(),
              timestamp: serverTime,
              updatedAt: serverTime
            };
            tx.set(globalTxRef, rec, { merge: true });
            tx.set(userTxRef, rec, { merge: true });
          });
        }
      } else if ((event === 'transfer.success' || event === 'transfer.failed' || event === 'transfer.reversed') && reference) {
        const txSnap = await db.doc(`transactions/${reference}`).get();
        if (txSnap.exists) {
          const txData = txSnap.data() || {};
          const uid = txData.userId;
          if (event === 'transfer.success') {
            await db.doc(`transactions/${reference}`).set({ status: 'completed', updatedAt: serverTime }, { merge: true });
            if (uid) await db.doc(`wallets/${uid}/transactions/${reference}`).set({ status: 'completed', updatedAt: serverTime }, { merge: true });
          } else if (txData.status === 'pending' && !txData.refunded && uid) {
            const refundAmt = Number(txData.grossDebit || txData.amount || 0);
            const cur = normalizeCurrencyCode(txData.currency || 'NGN');
            const sourceWallet = txData.sourceWallet || 'depositWallet';
            await db.runTransaction(async (tx: any) => {
              if (sourceWallet === 'cashOutWallet' || sourceWallet === 'playerWallet') {
                const uRef = db.doc(`users/${uid}`);
                const uSnap = await tx.get(uRef);
                const oldB = uSnap.exists ? Number(uSnap.data()?.[sourceWallet] || 0) : 0;
                tx.set(uRef, { [sourceWallet]: fromMinorUnits(toMinorUnits(oldB) + toMinorUnits(refundAmt)) }, { merge: true });
              } else {
                const wRef = db.doc(`wallets/${uid}/${cur}/depositWallet`);
                const wSnap = await tx.get(wRef);
                const oldB = wSnap.exists ? Number(wSnap.data()?.balance ?? 0) : 0;
                const nextB = fromMinorUnits(toMinorUnits(oldB) + toMinorUnits(refundAmt));
                tx.set(wRef, { balance: nextB, depositWallet: nextB, updatedAt: serverTime }, { merge: true });
              }
              tx.set(db.doc(`transactions/${reference}`), { status: 'failed', refunded: true, updatedAt: serverTime }, { merge: true });
              tx.set(db.doc(`wallets/${uid}/transactions/${reference}`), { status: 'failed', refunded: true, updatedAt: serverTime }, { merge: true });
            });
          }
        }
      }

      return res.json({ success: true });
    } catch (err) {
      console.error('[Paystack Webhook Error]:', err);
      return res.status(200).json({ success: true });
    }
  });

  app.post('/api/webhooks/flutterwave', async (req: Request, res: Response) => {
    const verifHash = String(req.headers['verif-hash'] || '').trim();
    const expected = (process.env.FLW_VERIFY_HASH || 'efadowallet2026secureconnecthubsoperation').trim();
    if (!verifHash || verifHash !== expected) {
      return res.status(401).json({ success: false, message: 'Unauthorized signature' });
    }
    try {
      const payload = req.body || {};
      const data = payload.data || payload;
      const txRef = String(data.tx_ref || payload.tx_ref || '').trim();
      const amount = Number(data.amount || 0);
      const cur = normalizeCurrencyCode(data.currency || 'NGN');
      const status = String(data.status || '').toLowerCase();
      const uid = String(data.meta?.userId || '').trim();
      if (txRef && amount > 0 && uid && (status === 'successful' || status === 'completed')) {
        const db = getServerDb();
        const serverTime = getServerTimestamp();
        const wRef = db.doc(`wallets/${uid}/${cur}/depositWallet`);
        const gRef = db.doc(`transactions/${txRef}`);
        const uRef = db.doc(`wallets/${uid}/transactions/${txRef}`);
        await db.runTransaction(async (tx: any) => {
          const existing = await tx.get(gRef);
          if (existing.exists && existing.data()?.credited === true) return;
          const wSnap = await tx.get(wRef);
          const oldB = wSnap.exists ? Number(wSnap.data()?.balance ?? 0) : 0;
          const nextB = fromMinorUnits(toMinorUnits(oldB) + toMinorUnits(amount));
          tx.set(wRef, { balance: nextB, depositWallet: nextB, currency: cur, userId: uid, updatedAt: serverTime }, { merge: true });
          const rec = {
            type: 'deposit',
            status: 'completed',
            credited: true,
            amount,
            currency: cur,
            reference: txRef,
            userId: uid,
            gateway: 'flutterwave',
            method: 'Flutterwave',
            purpose: `Funded ${cur} Pocket`,
            createdAtIso: new Date().toISOString(),
            timestamp: serverTime,
            updatedAt: serverTime
          };
          tx.set(gRef, rec, { merge: true });
          tx.set(uRef, rec, { merge: true });
        });
      }
      return res.json({ success: true });
    } catch {
      return res.json({ success: true });
    }
  });

  app.post('/api/webhooks/withdraw', async (req: Request, res: Response) => {
    const signature = String(req.headers['x-paystack-signature'] || '');
    const verifHash = String(req.headers['verif-hash'] || '').trim();
    const expectedHash = (process.env.FLW_VERIFY_HASH || 'efadowallet2026secureconnecthubsoperation').trim();
    const rawBody = (req as AuthedRequest).rawBody || JSON.stringify(req.body || {});
    const validPs = signature && verifyPaystackSignature(rawBody, signature);
    const validFlw = verifHash && verifHash === expectedHash;
    if (!validPs && !validFlw) {
      return res.status(401).json({ success: false, message: 'Unauthorized withdrawal webhook' });
    }
    try {
      const payload = req.body || {};
      const data = payload.data || payload;
      const ref = String(data.reference || '').trim();
      const status = String(data.status || '').toLowerCase();
      if (ref) {
        const db = getServerDb();
        const txSnap = await db.doc(`transactions/${ref}`).get();
        if (txSnap.exists) {
          const txData = txSnap.data() || {};
          const nextStatus = status === 'success' || status === 'successful' || status === 'completed' ? 'completed' : status === 'failed' || status === 'reversed' ? 'failed' : txData.status;
          await db.doc(`transactions/${ref}`).set({ status: nextStatus, updatedAt: getServerTimestamp() }, { merge: true });
          if (txData.userId) {
            await db.doc(`wallets/${txData.userId}/transactions/${ref}`).set({ status: nextStatus, updatedAt: getServerTimestamp() }, { merge: true });
          }
        }
      }
      return res.json({ success: true });
    } catch {
      return res.json({ success: true });
    }
  });

  // 6. Bank List (Nigeria + International: Ghana, Kenya, UK, US)
  app.get('/api/banks/list', async (req: Request, res: Response) => {
    const country = String(req.query.country || 'ALL').toUpperCase();
    try {
      let ngBanks: Array<{ code: string; name: string; country: string }> = [];
      try {
        const psResp = await getPaystackBanks('nigeria', 120);
        if (Array.isArray(psResp?.data) && psResp.data.length > 0) {
          ngBanks = psResp.data.map((b: any) => ({
            code: String(b.code),
            name: String(b.name),
            country: 'NG'
          }));
        }
      } catch {
        // Fallback below
      }
      if (ngBanks.length === 0) {
        ngBanks = FLUTTERWAVE_BANKS.filter((b) => b.country === 'NG').map((b) => ({
          code: b.code,
          name: b.name,
          country: 'NG'
        }));
      }
      const intlBanks = FLUTTERWAVE_BANKS.filter((b) => b.country !== 'NG').map((b) => ({
        code: b.code,
        name: b.name,
        country: b.country
      }));
      const combined = [...ngBanks, ...intlBanks];
      const filtered = country === 'ALL' ? combined : combined.filter((b) => b.country === country);
      return res.json({ success: true, banks: filtered });
    } catch (err: any) {
      return res.json({
        success: true,
        banks: FLUTTERWAVE_BANKS.map((b) => ({ code: b.code, name: b.name, country: b.country }))
      });
    }
  });

  // 7. Withdraw Account Verification (with rate limit + Legal Name match validation)
  app.post('/api/wallet/withdraw/verify-account', async (req: AuthedRequest, res: Response) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;

      const rl = checkRateLimit(`verify-bank:${user.uid}`, 20, 5 * 60 * 1000);
      if (!rl.allowed) {
        return res.status(429).json({
          success: false,
          message: `Too many verification checks. Please try again in ${rl.retryAfterSec}s.`
        });
      }

      const { accountNumber, bankCode, bankName, gateway = 'paystack' } = req.body || {};
      const cleanAcc = String(accountNumber || '').replace(/\D/g, '');
      const cleanCode = String(bankCode || '').trim();
      if (!cleanAcc || cleanAcc.length < 8) {
        return res.status(400).json({ success: false, message: 'Enter a valid account number.' });
      }
      if (!cleanCode) {
        return res.status(400).json({ success: false, message: 'Select a destination bank.' });
      }

      let resolvedName = '';
      let resolvedVia = '';
      const paystackConfigured = hasPaystackSecret();
      const flwSecretConfigured = getFlwSecret();

      if (!paystackConfigured && !flwSecretConfigured) {
        return res.status(503).json({
          success: false,
          verified: false,
          code: 'KEY_MISSING',
          message: 'Key missing: PAYSTACK_SECRET_KEY and FLW_SECRET_KEY are missing in server environment.'
        });
      }

      if (gateway === 'flutterwave' || !/^\d{3,6}$/.test(cleanCode)) {
        if (flwSecretConfigured && /^\d{10}$/.test(cleanAcc) && /^\d{3,6}$/.test(cleanCode)) {
          let flwBankCode = cleanCode;
          if (flwBankCode === '999992') flwBankCode = '100004';
          if (flwBankCode === '999991') flwBankCode = '100033';
          if (flwBankCode === '50211') flwBankCode = '090267';

          const flwRes = await fetch('https://api.flutterwave.com/v3/accounts/resolve', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${flwSecretConfigured}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ account_number: cleanAcc, account_bank: flwBankCode })
          });
          const flwData: any = await flwRes.json().catch(() => ({}));
          if (flwRes.ok && flwData?.status === 'success' && flwData?.data?.account_name) {
            resolvedName = flwData.data.account_name;
            resolvedVia = 'Flutterwave';
          }
        }
      }

      if (!resolvedName && /^\d{10}$/.test(cleanAcc) && /^\d{3,6}$/.test(cleanCode)) {
        try {
          const psData = await resolveAccountNumber(cleanAcc, cleanCode);
          if (psData?.status && psData?.data?.account_name) {
            resolvedName = psData.data.account_name;
            resolvedVia = 'Paystack';
          }
        } catch (psErr: any) {
          // Try Flutterwave backup if configured
          if (flwSecretConfigured) {
            let flwBankCode = cleanCode;
            if (flwBankCode === '999992') flwBankCode = '100004';
            if (flwBankCode === '999991') flwBankCode = '100033';
            if (flwBankCode === '50211') flwBankCode = '090267';

            const flwRes = await fetch('https://api.flutterwave.com/v3/accounts/resolve', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${flwSecretConfigured}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ account_number: cleanAcc, account_bank: flwBankCode })
            });
            const flwData: any = await flwRes.json().catch(() => ({}));
            if (flwRes.ok && flwData?.status === 'success' && flwData?.data?.account_name) {
              resolvedName = flwData.data.account_name;
              resolvedVia = 'Flutterwave';
            }
          }
          if (!resolvedName) {
            const msg = String(psErr?.message || '');
            const missingKey = msg.includes('PAYSTACK_SECRET_KEY') && !flwSecretConfigured;
            return res.status(missingKey ? 503 : 400).json({
              success: false,
              verified: false,
              ...(missingKey ? { code: 'KEY_MISSING' } : {}),
              message: missingKey
                ? 'Key missing: PAYSTACK_SECRET_KEY or FLW_SECRET_KEY is missing in Vercel environment.'
                : (msg || 'Could not verify account number with bank.')
            });
          }
        }
      }

      if (!resolvedName) {
        return res.status(400).json({
          success: false,
          verified: false,
          message: !paystackConfigured && gateway !== 'flutterwave'
            ? 'Key missing: PAYSTACK_SECRET_KEY is missing in Vercel environment.'
            : !flwSecretConfigured && gateway === 'flutterwave'
              ? 'Key missing: FLW_SECRET_KEY is missing in Vercel environment.'
              : 'Unable to verify bank account details. Check the account number and bank.'
        });
      }

      const db = getServerDb();
      const userSnap = await db.doc(`users/${user.uid}`).get();
      const userData = userSnap.exists ? (userSnap.data() || {}) : {};
      const profileLegalName = String(userData.fullName || userData.displayName || user.name || '').trim();
      const nameMatch = profileLegalName ? namesMatchLegalProfile(profileLegalName, resolvedName) : false;

      // Save short-lived server verification receipt so withdraw/initiate validates resolved bank holder name
      await db.doc(`wallets/${user.uid}/security/verifiedBank`).set({
        bankCode: cleanCode,
        bankName: bankName || '',
        accountNumberHash: hashOtp(`${cleanCode}:${cleanAcc}`),
        resolvedAccountName: resolvedName,
        nameMatch,
        verifiedAtMs: Date.now()
      });

      return res.json({
        success: true,
        verified: true,
        account_name: resolvedName,
        accountNumberMasked: maskAccountNumber(cleanAcc),
        bankCode: cleanCode,
        bankName: bankName || '',
        resolvedVia: resolvedVia || 'Bank Registry',
        nameMatch,
        profileLegalName,
        mismatchReason: !profileLegalName
          ? 'Complete your Legal Name in My Account Profile before withdrawing'
          : nameMatch
            ? null
            : 'Account name does not match your verified legal name'
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        verified: false,
        message: err?.message || 'Account verification failed.'
      });
    }
  });

  // 8. Withdrawal Initiate (PIN, SMS/Email OTP for 2FA/Night Safe/OPAY Shield, Legal Name match, Double-click lock, Atomic Debit + Auto-Refund)
  app.post('/api/wallet/withdraw/initiate', async (req: AuthedRequest, res: Response) => {
    let lockKey = '';
    try {
      const user = await requireAuth(req, res);
      if (!user) return;

      const rl = checkRateLimit(`withdraw:${user.uid}`, 6, 5 * 60 * 1000);
      if (!rl.allowed) {
        return res.status(429).json({
          success: false,
          message: `Withdrawal rate limit exceeded. Wait ${rl.retryAfterSec}s before trying again.`
        });
      }

      lockKey = `withdraw:${user.uid}`;
      if (!acquireInFlightLock(lockKey)) {
        return res.status(409).json({
          success: false,
          code: 'DUPLICATE_IN_FLIGHT',
          message: 'Your withdrawal is already processing. Duplicate submit blocked.'
        });
      }

      const {
        amount,
        currency = 'NGN',
        sourceWallet = 'playerWallet',
        bankCode,
        bankName,
        accountNumber,
        accountName,
        gateway = 'paystack',
        pin,
        otpCode,
        useSavedBank = false,
        idempotencyKey
      } = req.body || {};

      const curCheck = validateBackendCurrency(currency);
      if (!curCheck.valid) {
        return res.status(400).json({ success: false, code: 'CURRENCY_LOCKED', message: curCheck.message });
      }
      const cleanCurrency = curCheck.code;

      const numAmount = Number(amount);
      if (!Number.isFinite(numAmount) || numAmount < 100) {
        return res.status(400).json({ success: false, message: 'Minimum withdrawal is 100.' });
      }

      const db = getServerDb();
      const [userSnap, secSnap, verifiedBankSnap] = await Promise.all([
        db.doc(`users/${user.uid}`).get(),
        db.doc(`wallets/${user.uid}/security/config`).get(),
        db.doc(`wallets/${user.uid}/security/verifiedBank`).get()
      ]);

      const userData = userSnap.exists ? (userSnap.data() || {}) : {};
      const secData = secSnap.exists ? (secSnap.data() || {}) : {};
      const verifiedBankData = verifiedBankSnap.exists ? (verifiedBankSnap.data() || {}) : null;

      // Resolve account number if using saved bank
      let targetAccNumber = String(accountNumber || '').replace(/\D/g, '');
      let targetBankCode = String(bankCode || '').trim();
      let targetBankName = String(bankName || '').trim();
      let targetAccName = String(accountName || '').trim();

      const savedPlainAcc = decryptSensitive(userData.accountNumberEncrypted || userData.accountNumber || '').replace(/\D/g, '');
      const isMatchingSavedBank = Boolean(
        savedPlainAcc &&
          (useSavedBank || !targetAccNumber || (targetAccNumber === savedPlainAcc && targetBankCode === String(userData.bankCode || '')))
      );

      if (useSavedBank || !targetAccNumber) {
        targetAccNumber = savedPlainAcc;
        targetBankCode = targetBankCode || String(userData.bankCode || '');
        targetBankName = targetBankName || String(userData.bankName || '');
        targetAccName = String(userData.accountName || targetAccName || '');
      } else if (
        verifiedBankData &&
        verifiedBankData.accountNumberHash === hashOtp(`${targetBankCode}:${targetAccNumber}`) &&
        Date.now() - Number(verifiedBankData.verifiedAtMs || 0) < 30 * 60 * 1000
      ) {
        // Authoritatively bind server-resolved account holder name (never trust tampered req.body.accountName)
        targetAccName = String(verifiedBankData.resolvedAccountName || targetAccName);
      }

      if (!targetAccNumber || !targetBankCode || !targetAccName) {
        return res.status(400).json({
          success: false,
          message: 'Please verify your destination bank account before confirming withdrawal.'
        });
      }

      // Transaction PIN check first
      if (!secData.pinHash) {
        return res.status(403).json({
          success: false,
          code: 'PIN_NOT_SET',
          message: 'Please create your 4-digit Transaction PIN in Security settings before withdrawing.'
        });
      }
      if (!pin || !verifyPinHash(String(pin), secData.pinHash)) {
        await recordSecurityEvent(user.uid, 'INVALID_PIN', 'Failed Transaction PIN attempt on withdrawal', req);
        return res.status(403).json({
          success: false,
          code: 'INVALID_PIN',
          message: 'Incorrect Transaction PIN. Please try again.'
        });
      }

      // Verify OTP if provided before running security guard evaluation
      let hasValidOtp = false;
      if (otpCode) {
        const otpSnap = await db.doc(`wallets/${user.uid}/security/otp`).get();
        const otpData = otpSnap.exists ? otpSnap.data() : null;
        if (!otpData || Date.now() > Number(otpData.expiresAt || 0)) {
          return res.status(403).json({
            success: false,
            code: 'OTP_EXPIRED',
            message: 'Verification code expired. Request a new code.'
          });
        }
        if (Number(otpData.attempts || 0) >= 5) {
          return res.status(429).json({
            success: false,
            code: 'OTP_LOCKED',
            message: 'Too many failed code attempts. Try again shortly.'
          });
        }
        if (hashOtp(String(otpCode)) !== otpData.codeHash) {
          await db.doc(`wallets/${user.uid}/security/otp`).set(
            { attempts: Number(otpData.attempts || 0) + 1 },
            { merge: true }
          );
          return res.status(403).json({
            success: false,
            code: 'INVALID_OTP',
            message: 'Invalid 6-digit verification code.'
          });
        }
        hasValidOtp = true;
      }

      // Server-stored Cyber Shield settings (never trust request body to turn shields off)
      const serverNightSafeEnabled = secData.nightSafeEnabled !== undefined ? Boolean(secData.nightSafeEnabled) : true;
      const serverOpayShieldEnabled = secData.opayShieldEnabled !== undefined ? Boolean(secData.opayShieldEnabled) : true;
      const twoFactorActive = Boolean(secData.twoFactorEnabled ?? userData.twoFactorEnabled);

      // If withdrawing to a different bank than the saved bank, treat as new bank (<24h) for OPAY Shield
      const effectiveBankAddedAt = isMatchingSavedBank
        ? (userData.bankAddedAt || new Date().toISOString())
        : new Date().toISOString();

      const profileLegalName = String(userData.fullName || userData.displayName || user.name || '').trim();
      const shieldResult = evaluateWithdrawalSecurityGuards({
        profileLegalName,
        bankAccountName: targetAccName,
        amount: numAmount,
        currency: cleanCurrency,
        twoFactorEnabled: twoFactorActive,
        nightSafeEnabled: serverNightSafeEnabled,
        opayShieldEnabled: serverOpayShieldEnabled,
        bankAddedAt: effectiveBankAddedAt,
        hasValidOtp
      });

      if (!shieldResult.allowed) {
        if (shieldResult.code === 'NAME_MISMATCH' || shieldResult.code === 'LEGAL_NAME_REQUIRED') {
          await createWalletAlert(
            user.uid,
            'security',
            'Withdrawal Blocked',
            shieldResult.message || 'Bank account name did not match your verified profile legal name.',
            { attemptedBank: targetBankName }
          );
          await recordSecurityEvent(user.uid, 'WITHDRAW_BLOCKED_NAME_MISMATCH', 'Blocked withdrawal due to legal name mismatch', req);
          return res.status(403).json({
            success: false,
            code: shieldResult.code,
            shieldTriggered: shieldResult.shieldTriggered,
            message: shieldResult.message
          });
        }

        // OTP_REQUIRED (Night Safe, OPAY Shield, or 2FA) -> Send OTP strictly via SMS / Email ONLY
        const freshOtp = generateNumericOtp();
        await db.doc(`wallets/${user.uid}/security/otp`).set({
          codeHash: hashOtp(freshOtp),
          expiresAt: Date.now() + 10 * 60 * 1000,
          attempts: 0,
          reason: shieldResult.shieldTriggered || 'TWO_FACTOR',
          createdAtIso: new Date().toISOString()
        });

        const delivery = await sendSecurityOtpDelivery({
          email: userData.email || user.email,
          phoneNumber: userData.phoneNumber || userData.admin_otp_phone || '',
          otp: freshOtp,
          reason: shieldResult.shieldTriggered || 'Withdrawal Approval'
        });

        if (process.env.NODE_ENV === 'production' && !delivery.sent) {
          return res.status(503).json({
            success: false,
            code: 'OTP_DELIVERY_UNAVAILABLE',
            shieldTriggered: shieldResult.shieldTriggered,
            message: 'SMS/Email OTP delivery service is not configured. Please contact support or configure SMS/Email keys.'
          });
        }

        return res.status(403).json({
          success: false,
          code: 'OTP_REQUIRED',
          shieldTriggered: shieldResult.shieldTriggered,
          otpSent: delivery.sent,
          channels: delivery.channels,
          maskedEmail: delivery.maskedEmail,
          maskedPhone: delivery.maskedPhone,
          message: shieldResult.message
        });
      }

      if (hasValidOtp) {
        await db.doc(`wallets/${user.uid}/security/otp`).delete();
      }

      const fee = getWithdrawalFee(cleanCurrency);
      const grossDebit = fromMinorUnits(toMinorUnits(numAmount) + toMinorUnits(fee));
      const cleanIdemKey = idempotencyKey
        ? String(idempotencyKey).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80)
        : '';
      const ref = cleanIdemKey || `EFD-WD-${user.uid.slice(0, 6).toUpperCase()}-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      const serverTime = getServerTimestamp();
      const maskedAcc = maskAccountNumber(targetAccNumber);
      const idemRef = db.doc(`wallets/${user.uid}/idempotency/${ref}`);

      // Atomic Debit Transaction with idempotency protection
      let newBalance = 0;
      let existingReplayResult: any = null;
      await db.runTransaction(async (tx: any) => {
        const idemSnap = await tx.get(idemRef);
        const existingTx = await tx.get(db.doc(`transactions/${ref}`));
        if (idemSnap.exists || existingTx.exists) {
          existingReplayResult = idemSnap.exists ? idemSnap.data() : existingTx.data();
          throw new Error('DUPLICATE_WITHDRAWAL_REQUEST');
        }

        if (sourceWallet === 'cashOutWallet' || sourceWallet === 'playerWallet') {
          const uRef = db.doc(`users/${user.uid}`);
          const uSnap = await tx.get(uRef);
          const oldBal = uSnap.exists ? Number(uSnap.data()?.[sourceWallet] || 0) : 0;
          if (toMinorUnits(oldBal) < toMinorUnits(grossDebit)) {
            throw new Error(`INSUFFICIENT_FUNDS:${oldBal}`);
          }
          newBalance = fromMinorUnits(toMinorUnits(oldBal) - toMinorUnits(grossDebit));
          tx.set(uRef, { [sourceWallet]: newBalance, updatedAt: serverTime }, { merge: true });
        } else {
          const wRef = db.doc(`wallets/${user.uid}/${cleanCurrency}/depositWallet`);
          const wSnap = await tx.get(wRef);
          const oldBal = wSnap.exists ? Number(wSnap.data()?.balance ?? wSnap.data()?.depositWallet ?? 0) : 0;
          if (toMinorUnits(oldBal) < toMinorUnits(grossDebit)) {
            throw new Error(`INSUFFICIENT_FUNDS:${oldBal}`);
          }
          newBalance = fromMinorUnits(toMinorUnits(oldBal) - toMinorUnits(grossDebit));
          tx.set(
            wRef,
            { balance: newBalance, depositWallet: newBalance, currency: cleanCurrency, updatedAt: serverTime },
            { merge: true }
          );
          if (cleanCurrency === 'NGN') {
            tx.set(db.doc(`users/${user.uid}`), { depositWallet: newBalance, updatedAt: serverTime }, { merge: true });
          }
        }

        const wdRecord = {
          userId: user.uid,
          type: 'withdrawal',
          status: 'pending',
          amount: fromMinorUnits(toMinorUnits(numAmount)),
          fee,
          grossDebit,
          balanceAfter: newBalance,
          currency: cleanCurrency,
          sourceWallet,
          gateway,
          method: `${gateway === 'flutterwave' ? 'Flutterwave' : 'Paystack'} Payout`,
          purpose: `Withdrawal to ${targetBankName} (${maskedAcc})`,
          description: `Bank payout to ${targetAccName} • ${targetBankName} ${maskedAcc} (Fee: ₦${fee})`,
          reference: ref,
          metadata: {
            bankCode: targetBankCode,
            bankName: targetBankName,
            accountNumberMasked: maskedAcc,
            accountName: targetAccName
          },
          createdAtIso: new Date().toISOString(),
          timestamp: serverTime,
          updatedAt: serverTime
        };

        tx.set(idemRef, { reference: ref, amount: numAmount, status: 'pending', createdAtIso: wdRecord.createdAtIso });
        tx.set(db.doc(`transactions/${ref}`), wdRecord, { merge: true });
        tx.set(db.doc(`wallets/${user.uid}/transactions/${ref}`), wdRecord, { merge: true });
        tx.set(db.doc(`withdrawals/${ref}`), wdRecord, { merge: true });
      });

      void existingReplayResult;

      // Execute Gateway Transfer
      let finalStatus: 'completed' | 'pending' | 'failed' = 'pending';
      let gatewayError = '';

      if (gateway === 'flutterwave') {
        const flwSecret = getFlwSecret();
        if (flwSecret) {
          let flwBankCode = targetBankCode;
          if (flwBankCode === '999992') flwBankCode = '100004';
          if (flwBankCode === '999991') flwBankCode = '100033';
          if (flwBankCode === '50211') flwBankCode = '090267';

          try {
            const flwRes = await fetch('https://api.flutterwave.com/v3/transfers', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${flwSecret}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                account_bank: flwBankCode,
                account_number: targetAccNumber,
                amount: numAmount,
                currency: cleanCurrency,
                narration: `EFADO Withdrawal ${ref}`,
                reference: ref
              })
            });
            const flwJson: any = await flwRes.json().catch(() => ({}));
            if (flwRes.ok && flwJson?.status === 'success') {
              finalStatus = flwJson?.data?.status === 'SUCCESSFUL' ? 'completed' : 'pending';
            } else {
              finalStatus = 'failed';
              gatewayError = flwJson?.message || 'Flutterwave transfer rejected.';
            }
          } catch (e: any) {
            finalStatus = 'failed';
            gatewayError = e?.message || 'Flutterwave connection failed.';
          }
        } else {
          finalStatus = 'failed';
          gatewayError = 'Key missing: FLW_SECRET_KEY is not configured on the server.';
        }
      } else {
        // Paystack payout
        if (!hasPaystackSecret()) {
          finalStatus = 'failed';
          gatewayError = 'Key missing: PAYSTACK_SECRET_KEY is not configured on the server.';
        } else {
          try {
            const recResp = await createTransferRecipient(targetAccName, targetAccNumber, targetBankCode, cleanCurrency);
            const recipientCode = recResp?.data?.recipient_code;
            if (!recipientCode) {
              throw new Error('Could not register transfer recipient on Paystack.');
            }
            const trResp = await initiateTransfer(numAmount, recipientCode, ref, `EFADO Wallet Payout`);
            const trStatus = String(trResp?.data?.status || '').toLowerCase();
            finalStatus = trStatus === 'success' ? 'completed' : 'pending';
          } catch (e: any) {
            finalStatus = 'failed';
            gatewayError = e?.message || 'Paystack transfer could not be processed.';
          }
        }
      }

      if (finalStatus === 'failed') {
        // Automatic Atomic Refund
        await db.runTransaction(async (tx: any) => {
          if (sourceWallet === 'cashOutWallet' || sourceWallet === 'playerWallet') {
            const uRef = db.doc(`users/${user.uid}`);
            const uSnap = await tx.get(uRef);
            const cur = uSnap.exists ? Number(uSnap.data()?.[sourceWallet] || 0) : 0;
            newBalance = fromMinorUnits(toMinorUnits(cur) + toMinorUnits(grossDebit));
            tx.set(uRef, { [sourceWallet]: newBalance, updatedAt: serverTime }, { merge: true });
          } else {
            const wRef = db.doc(`wallets/${user.uid}/${cleanCurrency}/depositWallet`);
            const wSnap = await tx.get(wRef);
            const cur = wSnap.exists ? Number(wSnap.data()?.balance ?? 0) : 0;
            newBalance = fromMinorUnits(toMinorUnits(cur) + toMinorUnits(grossDebit));
            tx.set(wRef, { balance: newBalance, depositWallet: newBalance, updatedAt: serverTime }, { merge: true });
          }
          const failPatch = { status: 'failed', refunded: true, failureReason: gatewayError, updatedAt: serverTime };
          tx.set(db.doc(`transactions/${ref}`), failPatch, { merge: true });
          tx.set(db.doc(`wallets/${user.uid}/transactions/${ref}`), failPatch, { merge: true });
          tx.set(db.doc(`withdrawals/${ref}`), failPatch, { merge: true });
        });

        await createWalletAlert(
          user.uid,
          'withdrawal',
          'Withdrawal Reversed',
          `Your withdrawal failed (${gatewayError}) and ${cleanCurrency} ${grossDebit.toLocaleString()} was returned to your wallet.`,
          { reference: ref }
        );

        return res.status(400).json({
          success: false,
          refunded: true,
          reference: ref,
          newBalance,
          message: `${gatewayError} Your funds have been safely returned to your wallet.`
        });
      }

      await db.doc(`transactions/${ref}`).set({ status: finalStatus, updatedAt: serverTime }, { merge: true });
      await db.doc(`wallets/${user.uid}/transactions/${ref}`).set({ status: finalStatus, updatedAt: serverTime }, { merge: true });
      await db.doc(`withdrawals/${ref}`).set({ status: finalStatus, updatedAt: serverTime }, { merge: true });

      await createWalletAlert(
        user.uid,
        'withdrawal',
        'Withdrawal Initiated',
        `${cleanCurrency} ${numAmount.toLocaleString()} withdrawal to ${targetBankName} (${maskedAcc}) is ${finalStatus}.`,
        { reference: ref }
      );

      return res.json({
        success: true,
        status: finalStatus,
        reference: ref,
        amount: numAmount,
        fee,
        receiveAmount: numAmount,
        currency: cleanCurrency,
        newBalance,
        message: 'Withdrawal submitted successfully! Arrives in 1-5 mins.'
      });
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (msg.startsWith('INSUFFICIENT_FUNDS:')) {
        return res.status(400).json({ success: false, message: 'Insufficient balance including transfer fee.' });
      }
      if (msg === 'DUPLICATE_WITHDRAWAL_REQUEST') {
        return res.status(409).json({
          success: false,
          code: 'DUPLICATE_WITHDRAWAL_REQUEST',
          message: 'Duplicate withdrawal blocked for safety — wallet was not double-charged.'
        });
      }
      console.error('[Withdraw Initiate Error]:', err);
      return res.status(500).json({ success: false, message: msg || 'Withdrawal could not be processed.' });
    } finally {
      if (lockKey) releaseInFlightLock(lockKey);
    }
  });

  // 9. Withdrawals List & Saved Beneficiaries (masked)
  app.get('/api/wallet/withdrawals', async (req: AuthedRequest, res: Response) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const db = getServerDb();
      const txs = await fetchUserTransactions(db, user.uid);
      const withdrawals = txs.filter((t) => String(t.type).toLowerCase() === 'withdrawal');
      return res.json({ success: true, withdrawals });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Could not load withdrawals.' });
    }
  });

  app.get('/api/wallet/beneficiaries', async (req: AuthedRequest, res: Response) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const db = getServerDb();
      const userSnap = await db.doc(`users/${user.uid}`).get();
      const u = userSnap.exists ? (userSnap.data() || {}) : {};
      const beneficiaries: any[] = [];
      const accPlain = decryptSensitive(u.accountNumberEncrypted || u.accountNumber || '');
      if (u.bankName && accPlain) {
        beneficiaries.push({
          id: 'primary-bank',
          type: 'bank_transfer',
          bankName: u.bankName,
          bankCode: u.bankCode || '',
          accountNumberMasked: maskAccountNumber(accPlain),
          accountName: u.accountName || u.fullName || '',
          isDefault: true
        });
      }
      const momoPlain = decryptSensitive(u.mobileMoneyEncrypted || u.mobileMoneyNumber || '');
      if (momoPlain) {
        beneficiaries.push({
          id: 'primary-momo',
          type: 'mobile_money',
          provider: u.mobileMoneyProvider || 'MTN',
          details: maskPhoneNumber(momoPlain),
          isDefault: false
        });
      }
      return res.json({ success: true, beneficiaries });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to load beneficiaries.' });
    }
  });

  // 10. History, Single Receipt & PDF Statement
  app.get('/api/wallet/history', async (req: AuthedRequest, res: Response) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const db = getServerDb();
      const all = await fetchUserTransactions(db, user.uid);

      const typeFilter = String(req.query.type || 'ALL').toUpperCase();
      const statusFilter = String(req.query.status || 'ALL').toLowerCase();
      const currencyFilter = String(req.query.currency || 'ALL').toUpperCase();
      const searchQ = String(req.query.q || '').trim().toLowerCase();
      const fromDate = String(req.query.from || '').trim();
      const toDate = String(req.query.to || '').trim();

      const filtered = all.filter((tx) => {
        const txType = String(tx.type || '').toUpperCase();
        if (typeFilter !== 'ALL') {
          if (typeFilter === 'PAYMENT') {
            if (!['PAYMENT', 'GAME_BET', 'SWAP'].includes(txType)) return false;
          } else if (typeFilter === 'DEPOSIT') {
            if (!['DEPOSIT', 'REWARD', 'GAME_WIN'].includes(txType)) return false;
          } else if (txType !== typeFilter) {
            return false;
          }
        }
        if (statusFilter !== 'all') {
          const st = String(tx.status || '').toLowerCase();
          if (statusFilter === 'success' || statusFilter === 'completed') {
            if (st !== 'completed' && st !== 'success') return false;
          } else if (st !== statusFilter) {
            return false;
          }
        }
        if (currencyFilter !== 'ALL' && String(tx.currency || 'NGN').toUpperCase() !== currencyFilter) {
          return false;
        }
        if (searchQ) {
          const hay = `${tx.purpose || ''} ${tx.description || ''} ${tx.reference || ''} ${tx.method || ''} ${tx.type || ''}`.toLowerCase();
          if (!hay.includes(searchQ)) return false;
        }
        if (fromDate) {
          const d = new Date(tx.createdAtIso);
          const f = new Date(fromDate);
          f.setHours(0, 0, 0, 0);
          if (d < f) return false;
        }
        if (toDate) {
          const d = new Date(tx.createdAtIso);
          const t = new Date(toDate);
          t.setHours(23, 59, 59, 999);
          if (d > t) return false;
        }
        return true;
      });

      // Load live pocket balances for History-to-Balance Reconciliation summary
      const [userDocSnap, ...pocketSnaps] = await Promise.all([
        db.doc(`users/${user.uid}`).get(),
        ...ACTIVE_WALLET_CURRENCIES.map((cur) => db.doc(`wallets/${user.uid}/${cur.code}/depositWallet`).get())
      ]);
      const uData = userDocSnap.exists ? (userDocSnap.data() || {}) : {};
      const storedByCur: Record<string, number> = {};
      ACTIVE_WALLET_CURRENCIES.forEach((cur, idx) => {
        const snap = pocketSnaps[idx];
        storedByCur[cur.code] = snap?.exists ? Number(snap.data()?.balance ?? snap.data()?.depositWallet ?? 0) : 0;
      });
      // Total NGN-denominated pockets (deposit pocket + wins/cashout/promo) for reconciliation
      const storedNgnCombined = fromMinorUnits(
        toMinorUnits(storedByCur.NGN || 0) +
          toMinorUnits(Number(uData.cashOutWallet || 0)) +
          toMinorUnits(Number(uData.playerWallet || 0)) +
          toMinorUnits(Number(uData.promoWallet || 0))
      );
      const reconciliation = reconcileLedgerFromTransactions(all, { ...storedByCur, NGN: storedNgnCombined });

      return res.json({
        success: true,
        transactions: filtered,
        total: filtered.length,
        reconciliation
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to load history.' });
    }
  });

  app.get('/api/wallet/history/:id/receipt', async (req: AuthedRequest, res: Response) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const db = getServerDb();
      const txId = String(req.params.id || '').trim();
      const txs = await fetchUserTransactions(db, user.uid);
      const found = txs.find((t) => t.id === txId || t.reference === txId);
      if (!found) {
        return res.status(404).json({ success: false, message: 'Receipt not found.' });
      }
      return res.json({ success: true, receipt: found });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Receipt lookup failed.' });
    }
  });

  app.get('/api/wallet/statement.pdf', async (req: AuthedRequest, res: Response) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const db = getServerDb();
      const curCheck = validateBackendCurrency(String(req.query.currency || 'NGN'));
      if (!curCheck.valid) {
        return res.status(400).json({ success: false, code: 'CURRENCY_LOCKED', message: curCheck.message });
      }
      const currency = curCheck.code;
      const fromDate = String(req.query.from || '').trim();
      const toDate = String(req.query.to || '').trim();

      const [userSnap, walletSnap, txs] = await Promise.all([
        db.doc(`users/${user.uid}`).get(),
        db.doc(`wallets/${user.uid}/${currency}/depositWallet`).get(),
        fetchUserTransactions(db, user.uid)
      ]);

      const u = userSnap.exists ? (userSnap.data() || {}) : {};
      const closingBalance = walletSnap.exists ? Number(walletSnap.data()?.balance ?? walletSnap.data()?.depositWallet ?? 0) : 0;

      const filtered = txs.filter((tx) => {
        if (String(tx.currency || 'NGN').toUpperCase() !== currency) return false;
        const d = new Date(tx.createdAtIso);
        if (fromDate) {
          const f = new Date(fromDate);
          f.setHours(0, 0, 0, 0);
          if (d < f) return false;
        }
        if (toDate) {
          const t = new Date(toDate);
          t.setHours(23, 59, 59, 999);
          if (d > t) return false;
        }
        return true;
      });

      // Compute exact opening balance backwards from closing balance (accounting for withdrawal fees & excluding uncredited pending/failed rows)
      let netDeltaMinor = 0;
      for (const tx of filtered) {
        const status = String(tx.status || '').toLowerCase();
        if (status === 'failed' || tx.refunded === true) continue;
        if (tx.type === 'deposit' && tx.credited !== true && status === 'pending') continue;
        const amtMinor = toMinorUnits(Number(tx.amount || 0));
        if (tx.type === 'deposit' || tx.type === 'reward' || tx.type === 'game_win') {
          netDeltaMinor += amtMinor;
        } else {
          const feeMinor = tx.type === 'withdrawal' ? toMinorUnits(Number(tx.fee || 0)) : 0;
          const debitMinor = tx.type === 'withdrawal' && tx.grossDebit !== undefined ? toMinorUnits(Number(tx.grossDebit)) : amtMinor + feeMinor;
          netDeltaMinor -= debitMinor;
        }
      }
      const openingBalance = Math.max(0, fromMinorUnits(toMinorUnits(closingBalance) - netDeltaMinor));

      const pdfBuffer = await generateAccountStatementPdf({
        userName: u.fullName || u.displayName || user.name || 'EFADO Member',
        userEmail: u.email || user.email,
        fromDate,
        toDate,
        currency,
        openingBalance,
        closingBalance,
        transactions: filtered
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="EFADO-Statement-${currency}-${new Date().toISOString().slice(0, 10)}.pdf"`);
      return res.status(200).send(pdfBuffer);
    } catch (err: any) {
      console.error('[Statement PDF Error]:', err);
      return res.status(500).json({ success: false, message: 'Could not generate PDF statement.' });
    }
  });

  // 11. Currency Swap (Live Rate & Atomic Swap Execution with SIRA block + Double-Click Idempotency)
  app.get('/api/wallet/swap/rate', async (req: AuthedRequest, res: Response) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const fromCheck = validateBackendCurrency(String(req.query.from || 'NGN'));
      const toCheck = validateBackendCurrency(String(req.query.to || 'USD'));
      const amount = Number(req.query.amount || 1000);
      if (!fromCheck.valid || !toCheck.valid) {
        return res.status(400).json({
          success: false,
          code: 'CURRENCY_LOCKED',
          message: fromCheck.message || toCheck.message || 'SIRA currency is coming soon and locked.'
        });
      }
      const quote = await calculateSwapQuote(fromCheck.code, toCheck.code, amount);
      return res.json({ success: true, quote });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Rate check failed.' });
    }
  });

  app.post('/api/wallet/swap', async (req: AuthedRequest, res: Response) => {
    let lockKey = '';
    try {
      const user = await requireAuth(req, res);
      if (!user) return;

      lockKey = `swap:${user.uid}`;
      if (!acquireInFlightLock(lockKey)) {
        return res.status(409).json({
          success: false,
          code: 'DUPLICATE_IN_FLIGHT',
          message: 'Your currency swap is already processing.'
        });
      }

      const {
        fromCurrency = 'NGN',
        toCurrency = 'USD',
        amount,
        sourceWallet = 'depositWallet',
        idempotencyKey
      } = req.body || {};

      const fromCheck = validateBackendCurrency(fromCurrency);
      const toCheck = validateBackendCurrency(toCurrency);
      if (!fromCheck.valid || !toCheck.valid) {
        return res.status(400).json({
          success: false,
          code: 'CURRENCY_LOCKED',
          message: fromCheck.message || toCheck.message || 'SIRA currency is coming soon and locked.'
        });
      }
      const fromCur = fromCheck.code;
      const toCur = toCheck.code;
      const numAmount = Number(amount);

      if (!Number.isFinite(numAmount) || numAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Enter a positive swap amount.' });
      }
      if (fromCur === toCur && sourceWallet === 'depositWallet') {
        return res.status(400).json({ success: false, message: 'Choose two different currencies to swap.' });
      }

      const quote = await calculateSwapQuote(fromCur, toCur, numAmount);
      if (quote.receiveAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Amount too small to convert.' });
      }

      const db = getServerDb();
      const serverTime = getServerTimestamp();
      const cleanIdem = idempotencyKey ? String(idempotencyKey).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80) : '';
      const refBase = cleanIdem || `EFD-SWAP-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      const idemRef = db.doc(`wallets/${user.uid}/idempotency/${refBase}`);

      await db.runTransaction(async (tx: any) => {
        const idemSnap = await tx.get(idemRef);
        const existingOut = await tx.get(db.doc(`transactions/${refBase}-OUT`));
        if (idemSnap.exists || existingOut.exists) {
          throw new Error('DUPLICATE_SWAP_REQUEST');
        }

        let nextSourceBal = 0;
        // Debit source
        if (sourceWallet === 'cashOutWallet' || sourceWallet === 'playerWallet' || sourceWallet === 'promoWallet') {
          const uRef = db.doc(`users/${user.uid}`);
          const uSnap = await tx.get(uRef);
          const curBal = uSnap.exists ? Number(uSnap.data()?.[sourceWallet] || 0) : 0;
          if (toMinorUnits(curBal) < toMinorUnits(numAmount)) {
            throw new Error(`INSUFFICIENT_FUNDS`);
          }
          nextSourceBal = fromMinorUnits(toMinorUnits(curBal) - toMinorUnits(numAmount));
          tx.set(uRef, { [sourceWallet]: nextSourceBal, updatedAt: serverTime }, { merge: true });
        } else {
          const fromPocketRef = db.doc(`wallets/${user.uid}/${fromCur}/depositWallet`);
          const fromSnap = await tx.get(fromPocketRef);
          const curBal = fromSnap.exists ? Number(fromSnap.data()?.balance ?? fromSnap.data()?.depositWallet ?? 0) : 0;
          if (toMinorUnits(curBal) < toMinorUnits(numAmount)) {
            throw new Error(`INSUFFICIENT_FUNDS`);
          }
          nextSourceBal = fromMinorUnits(toMinorUnits(curBal) - toMinorUnits(numAmount));
          tx.set(
            fromPocketRef,
            { balance: nextSourceBal, depositWallet: nextSourceBal, currency: fromCur, userId: user.uid, updatedAt: serverTime },
            { merge: true }
          );
          if (fromCur === 'NGN') {
            tx.set(db.doc(`users/${user.uid}`), { depositWallet: nextSourceBal }, { merge: true });
          }
        }

        // Credit destination currency pocket
        const toPocketRef = db.doc(`wallets/${user.uid}/${toCur}/depositWallet`);
        const toSnap = await tx.get(toPocketRef);
        const oldToBal = toSnap.exists ? Number(toSnap.data()?.balance ?? toSnap.data()?.depositWallet ?? 0) : 0;
        const nextTo = fromMinorUnits(toMinorUnits(oldToBal) + toMinorUnits(quote.receiveAmount));
        tx.set(
          toPocketRef,
          { balance: nextTo, depositWallet: nextTo, currency: toCur, userId: user.uid, updatedAt: serverTime },
          { merge: true }
        );
        if (toCur === 'NGN') {
          tx.set(db.doc(`users/${user.uid}`), { depositWallet: nextTo }, { merge: true });
        }

        const outTx = {
          userId: user.uid,
          type: 'swap',
          status: 'completed',
          amount: numAmount,
          fee: quote.feeAmount,
          balanceAfter: nextSourceBal,
          sourceWallet,
          currency: fromCur,
          method: 'Currency Swap',
          purpose: `Swap ${fromCur} to ${toCur}`,
          description: `Converted ${numAmount} ${fromCur} -> ${quote.receiveAmount} ${toCur} (Rate: ${quote.rate})`,
          reference: `${refBase}-OUT`,
          createdAtIso: new Date().toISOString(),
          timestamp: serverTime,
          updatedAt: serverTime
        };
        const inTx = {
          userId: user.uid,
          type: 'deposit',
          status: 'completed',
          credited: true,
          amount: quote.receiveAmount,
          balanceAfter: nextTo,
          sourceWallet: 'depositWallet',
          currency: toCur,
          method: 'Currency Swap',
          purpose: `Received from ${fromCur} Swap`,
          description: `Credited ${quote.receiveAmount} ${toCur} from ${fromCur} conversion`,
          reference: `${refBase}-IN`,
          createdAtIso: new Date().toISOString(),
          timestamp: serverTime,
          updatedAt: serverTime
        };

        tx.set(idemRef, { reference: refBase, createdAtIso: outTx.createdAtIso });
        tx.set(db.doc(`transactions/${refBase}-OUT`), outTx, { merge: true });
        tx.set(db.doc(`wallets/${user.uid}/transactions/${refBase}-OUT`), outTx, { merge: true });
        tx.set(db.doc(`transactions/${refBase}-IN`), inTx, { merge: true });
        tx.set(db.doc(`wallets/${user.uid}/transactions/${refBase}-IN`), inTx, { merge: true });
      });

      await createWalletAlert(
        user.uid,
        'swap',
        'Currency Swap Complete',
        `Swapped ${numAmount.toLocaleString()} ${fromCur} into ${quote.receiveAmount.toLocaleString()} ${toCur}.`
      );

      return res.json({ success: true, quote, reference: refBase });
    } catch (err: any) {
      if (err?.message === 'INSUFFICIENT_FUNDS') {
        return res.status(400).json({ success: false, message: 'Insufficient balance in selected pocket.' });
      }
      if (err?.message === 'DUPLICATE_SWAP_REQUEST') {
        return res.status(409).json({ success: false, message: 'Duplicate swap blocked — wallet was not double-charged.' });
      }
      return res.status(500).json({ success: false, message: err?.message || 'Swap failed.' });
    } finally {
      if (lockKey) releaseInFlightLock(lockKey);
    }
  });

  // 12. Claim EFADO Reward -> Credits Promo Wallet + Records History (Concurrency Protected)
  app.post('/api/wallet/reward/claim', async (req: AuthedRequest, res: Response) => {
    let lockKey = '';
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      lockKey = `reward:${user.uid}`;
      if (!acquireInFlightLock(lockKey)) {
        return res.status(409).json({
          success: false,
          message: 'Reward claim is already processing.'
        });
      }

      const db = getServerDb();
      const serverTime = getServerTimestamp();
      const rewardAmount = 500; // NGN 500 daily loyalty reward
      const ref = `EFD-RWD-${user.uid.slice(0, 6).toUpperCase()}-${Date.now()}`;

      let nextPromoBalance = 0;
      await db.runTransaction(async (tx: any) => {
        const uRef = db.doc(`users/${user.uid}`);
        const uSnap = await tx.get(uRef);
        const uData = uSnap.exists ? (uSnap.data() || {}) : {};
        const lastClaim = uData.lastRewardClaimAt ? new Date(uData.lastRewardClaimAt).getTime() : 0;
        if (lastClaim && Date.now() - lastClaim < 24 * 60 * 60 * 1000) {
          throw new Error('ALREADY_CLAIMED_TODAY');
        }
        const curPromo = Number(uData.promoWallet || 0) || 0;
        nextPromoBalance = fromMinorUnits(toMinorUnits(curPromo) + toMinorUnits(rewardAmount));
        tx.set(
          uRef,
          {
            promoWallet: nextPromoBalance,
            lastRewardClaimAt: new Date().toISOString(),
            updatedAt: serverTime
          },
          { merge: true }
        );

        const rwdTx = {
          userId: user.uid,
          type: 'reward',
          status: 'completed',
          credited: true,
          amount: rewardAmount,
          balanceAfter: nextPromoBalance,
          sourceWallet: 'promoWallet',
          currency: 'NGN',
          method: 'EFADO Reward',
          purpose: 'EFADO Loyalty Reward Claimed',
          description: 'Daily EFADO Wallet reward credited to Promo Wallet',
          reference: ref,
          createdAtIso: new Date().toISOString(),
          timestamp: serverTime,
          updatedAt: serverTime
        };
        tx.set(db.doc(`transactions/${ref}`), rwdTx, { merge: true });
        tx.set(db.doc(`wallets/${user.uid}/transactions/${ref}`), rwdTx, { merge: true });
      });

      await createWalletAlert(
        user.uid,
        'reward',
        'Reward Claimed',
        `₦${rewardAmount.toLocaleString()} EFADO Reward added to your Promo Wallet.`
      );

      return res.json({
        success: true,
        amount: rewardAmount,
        promoWallet: nextPromoBalance,
        reference: ref,
        message: `₦${rewardAmount.toLocaleString()} added to your Promo Wallet!`
      });
    } catch (err: any) {
      if (err?.message === 'ALREADY_CLAIMED_TODAY') {
        return res.status(400).json({
          success: false,
          message: 'Today’s EFADO Reward has already been claimed. Come back tomorrow!'
        });
      }
      return res.status(500).json({ success: false, message: err?.message || 'Could not claim reward.' });
    } finally {
      if (lockKey) releaseInFlightLock(lockKey);
    }
  });

  // 13. Profile Sync (Encrypted Storage + Masked Return + Auto-sync to Withdraw & Payment Methods)
  app.post('/api/wallet/profile/sync', async (req: AuthedRequest, res: Response) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const body = req.body || {};
      const db = getServerDb();
      const userRef = db.doc(`users/${user.uid}`);
      const existingSnap = await userRef.get();
      const existing = existingSnap.exists ? (existingSnap.data() || {}) : {};

      const cleanBankNumber = body.accountNumber && !String(body.accountNumber).includes('*')
        ? String(body.accountNumber).replace(/\D/g, '')
        : decryptSensitive(existing.accountNumberEncrypted || existing.accountNumber || '');

      const prevBankNumber = decryptSensitive(existing.accountNumberEncrypted || existing.accountNumber || '');
      const bankChanged = Boolean(cleanBankNumber && cleanBankNumber !== prevBankNumber);

      const cleanMomo = body.mobileMoneyNumber && !String(body.mobileMoneyNumber).includes('*')
        ? String(body.mobileMoneyNumber).trim()
        : decryptSensitive(existing.mobileMoneyEncrypted || existing.mobileMoneyNumber || '');

      const cleanUsdt = body.usdtAddress && !String(body.usdtAddress).includes('...')
        ? String(body.usdtAddress).trim()
        : decryptSensitive(existing.usdtEncrypted || existing.usdtAddress || '');

      const cleanBtc = body.btcAddress && !String(body.btcAddress).includes('...')
        ? String(body.btcAddress).trim()
        : decryptSensitive(existing.btcEncrypted || existing.btcAddress || existing.externalWallet || '');

      const patch: Record<string, any> = {
        fullName: body.legalName ?? body.fullName ?? existing.fullName ?? '',
        displayName: body.displayName ?? body.legalName ?? existing.displayName ?? '',
        alias: body.alias ?? existing.alias ?? '',
        dateOfBirth: body.dateOfBirth ?? existing.dateOfBirth ?? '',
        nationality: body.nationality ?? existing.nationality ?? 'Nigerian',
        country: body.country ?? existing.country ?? 'Nigeria',
        gender: body.gender ?? existing.gender ?? '',
        address: body.address ?? existing.address ?? '',
        phoneNumber: body.phoneNumber ?? existing.phoneNumber ?? '',
        bio: body.bio ?? existing.bio ?? '',
        photoURL: body.photoURL ?? existing.photoURL ?? '',
        bankName: body.bankName ?? existing.bankName ?? '',
        bankCode: body.bankCode ?? existing.bankCode ?? '',
        accountName: body.accountName ?? existing.accountName ?? '',
        accountNumberEncrypted: cleanBankNumber ? encryptSensitive(cleanBankNumber) : existing.accountNumberEncrypted || '',
        accountNumber: maskAccountNumber(cleanBankNumber),
        bankAddedAt: bankChanged ? new Date().toISOString() : (existing.bankAddedAt || new Date().toISOString()),
        mobileMoneyProvider: body.mobileMoneyProvider ?? existing.mobileMoneyProvider ?? 'MTN',
        mobileMoneyEncrypted: cleanMomo ? encryptSensitive(cleanMomo) : existing.mobileMoneyEncrypted || '',
        mobileMoneyNumber: maskPhoneNumber(cleanMomo),
        usdtEncrypted: cleanUsdt ? encryptSensitive(cleanUsdt) : existing.usdtEncrypted || '',
        usdtAddress: maskCryptoAddress(cleanUsdt),
        btcEncrypted: cleanBtc ? encryptSensitive(cleanBtc) : existing.btcEncrypted || '',
        btcAddress: maskCryptoAddress(cleanBtc),
        externalWallet: maskCryptoAddress(cleanBtc || cleanUsdt),
        updatedAt: getServerTimestamp()
      };

      await userRef.set(patch, { merge: true });

      // Sync bank & crypto to saved payment methods collection automatically
      if (patch.bankName && cleanBankNumber) {
        await db.doc(`wallets/${user.uid}/payment_methods/synced_bank`).set(
          {
            id: 'synced_bank',
            type: 'bank_transfer',
            name: `${patch.bankName}`,
            details: maskAccountNumber(cleanBankNumber),
            bankCode: patch.bankCode || '',
            accountName: patch.accountName || patch.fullName,
            encryptedPayload: encryptSensitive(cleanBankNumber),
            isDefault: true,
            updatedAtIso: new Date().toISOString()
          },
          { merge: true }
        );
      }

      if (cleanUsdt) {
        await db.doc(`wallets/${user.uid}/payment_methods/synced_usdt`).set(
          {
            id: 'synced_usdt',
            type: 'crypto',
            network: 'USDT (TRC20)',
            name: 'USDT (TRC20)',
            details: maskCryptoAddress(cleanUsdt),
            encryptedPayload: encryptSensitive(cleanUsdt),
            isDefault: false,
            updatedAtIso: new Date().toISOString()
          },
          { merge: true }
        );
      }

      if (cleanBtc) {
        await db.doc(`wallets/${user.uid}/payment_methods/synced_btc`).set(
          {
            id: 'synced_btc',
            type: 'crypto',
            network: 'Bitcoin (BTC)',
            name: 'Bitcoin (BTC)',
            details: maskCryptoAddress(cleanBtc),
            encryptedPayload: encryptSensitive(cleanBtc),
            isDefault: false,
            updatedAtIso: new Date().toISOString()
          },
          { merge: true }
        );
      }

      await recordSecurityEvent(user.uid, 'PROFILE_SYNC', 'Profile & payout details updated', req);

      return res.json({
        success: true,
        message: 'Profile & payout details synced securely.',
        masked: {
          accountNumber: patch.accountNumber,
          mobileMoneyNumber: patch.mobileMoneyNumber,
          usdtAddress: patch.usdtAddress,
          btcAddress: patch.btcAddress
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Profile sync failed.' });
    }
  });

  // 14. Two-Factor Auth & Cyber Shields (/api/auth/enable-2fa, /api/auth/verify-2fa, /api/security/shields)
  app.post('/api/security/shields', async (req: AuthedRequest, res: Response) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const { nightSafeEnabled, opayShieldEnabled } = req.body || {};
      const db = getServerDb();
      const patch: Record<string, any> = { updatedAt: getServerTimestamp() };
      if (typeof nightSafeEnabled === 'boolean') patch.nightSafeEnabled = nightSafeEnabled;
      if (typeof opayShieldEnabled === 'boolean') patch.opayShieldEnabled = opayShieldEnabled;
      await db.doc(`wallets/${user.uid}/security/config`).set(patch, { merge: true });
      await recordSecurityEvent(
        user.uid,
        'SHIELD_UPDATED',
        `Updated security shields (Night Safe: ${patch.nightSafeEnabled ?? 'unchanged'}, OPAY Shield: ${patch.opayShieldEnabled ?? 'unchanged'})`,
        req
      );
      return res.json({ success: true, ...patch });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Could not update shields.' });
    }
  });

  app.post('/api/auth/enable-2fa', async (req: AuthedRequest, res: Response) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const rl = checkRateLimit(`2fa:${user.uid}`, 10, 5 * 60 * 1000);
      if (!rl.allowed) {
        return res.status(429).json({ success: false, message: `Wait ${rl.retryAfterSec}s before requesting another code.` });
      }
      const { enable = true, biometricEnabled } = req.body || {};
      const db = getServerDb();

      if (typeof biometricEnabled === 'boolean') {
        await db.doc(`wallets/${user.uid}/security/config`).set({ biometricEnabled, updatedAt: getServerTimestamp() }, { merge: true });
        await db.doc(`users/${user.uid}`).set({ biometricEnabled }, { merge: true });
        return res.json({ success: true, biometricEnabled });
      }

      const otp = generateNumericOtp();
      const userSnap = await db.doc(`users/${user.uid}`).get();
      const userData = userSnap.exists ? (userSnap.data() || {}) : {};

      await db.doc(`wallets/${user.uid}/security/otp`).set({
        codeHash: hashOtp(otp),
        pendingTwoFactorState: Boolean(enable),
        expiresAt: Date.now() + 10 * 60 * 1000,
        attempts: 0,
        createdAtIso: new Date().toISOString()
      });

      const delivery = await sendSecurityOtpDelivery({
        email: userData.email || user.email,
        phoneNumber: userData.phoneNumber || userData.admin_otp_phone || '',
        otp,
        reason: 'Two-Factor Authentication'
      });

      if (process.env.NODE_ENV === 'production' && !delivery.sent) {
        return res.status(503).json({
          success: false,
          code: 'OTP_DELIVERY_UNAVAILABLE',
          message: 'SMS/Email OTP delivery provider is not configured. Configure Resend/SendGrid or Termii/Twilio.'
        });
      }

      await createWalletAlert(
        user.uid,
        'security',
        '2FA Verification Code',
        `A 6-digit security verification code was dispatched via ${delivery.channels.join(' & ') || 'SMS/Email'}.`
      );

      return res.json({
        success: true,
        otpSent: delivery.sent,
        channels: delivery.channels,
        maskedEmail: delivery.maskedEmail,
        maskedPhone: delivery.maskedPhone,
        message: 'Enter the 6-digit verification code sent to your registered Email / SMS.'
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Could not initiate 2FA.' });
    }
  });

  app.post('/api/auth/verify-2fa', async (req: AuthedRequest, res: Response) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const { code, enable } = req.body || {};
      const cleanCode = String(code || '').trim();
      if (!/^\d{6}$/.test(cleanCode)) {
        return res.status(400).json({ success: false, message: 'Enter a valid 6-digit verification code.' });
      }
      const db = getServerDb();
      const otpRef = db.doc(`wallets/${user.uid}/security/otp`);
      const otpSnap = await otpRef.get();
      if (!otpSnap.exists) {
        return res.status(400).json({ success: false, message: 'No active code found. Request a new code.' });
      }
      const otpData = otpSnap.data() || {};
      if (Date.now() > Number(otpData.expiresAt || 0)) {
        return res.status(400).json({ success: false, message: 'Verification code expired.' });
      }
      if (Number(otpData.attempts || 0) >= 5) {
        return res.status(429).json({ success: false, message: 'Too many failed attempts. Request a new code.' });
      }
      if (hashOtp(cleanCode) !== otpData.codeHash) {
        await otpRef.set({ attempts: Number(otpData.attempts || 0) + 1 }, { merge: true });
        return res.status(400).json({ success: false, message: 'Incorrect verification code.' });
      }

      const nextEnabled = typeof enable === 'boolean' ? enable : Boolean(otpData.pendingTwoFactorState ?? true);
      await db.doc(`wallets/${user.uid}/security/config`).set({ twoFactorEnabled: nextEnabled, updatedAt: getServerTimestamp() }, { merge: true });
      await db.doc(`users/${user.uid}`).set({ twoFactorEnabled: nextEnabled }, { merge: true });
      await otpRef.delete();

      await recordSecurityEvent(user.uid, nextEnabled ? '2FA_ENABLED' : '2FA_DISABLED', `Two-Factor Authentication ${nextEnabled ? 'enabled' : 'disabled'}`, req);

      return res.json({
        success: true,
        twoFactorEnabled: nextEnabled,
        message: nextEnabled ? 'Two-Factor Authentication enabled.' : 'Two-Factor Authentication disabled.'
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Could not verify code.' });
    }
  });

  // 15. Transaction PIN Endpoints (/api/wallet/pin/set, /verify, /change)
  app.post('/api/wallet/pin/set', async (req: AuthedRequest, res: Response) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const { pin } = req.body || {};
      const cleanPin = String(pin || '').trim();
      if (!/^\d{4}$/.test(cleanPin)) {
        return res.status(400).json({ success: false, message: 'Transaction PIN must be exactly 4 digits.' });
      }
      const db = getServerDb();
      const secRef = db.doc(`wallets/${user.uid}/security/config`);
      const existing = await secRef.get();
      if (existing.exists && existing.data()?.pinHash) {
        return res.status(400).json({ success: false, message: 'PIN already set. Use Change PIN instead.' });
      }

      await secRef.set({ pinHash: hashPin(cleanPin), updatedAt: getServerTimestamp() }, { merge: true });
      await db.doc(`users/${user.uid}`).set({ hasTransactionPin: true }, { merge: true });
      await recordSecurityEvent(user.uid, 'PIN_SET', '4-digit Transaction PIN created', req);

      return res.json({ success: true, hasTransactionPin: true, message: 'Transaction PIN created securely.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Could not set PIN.' });
    }
  });

  app.post('/api/wallet/pin/verify', async (req: AuthedRequest, res: Response) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const rl = checkRateLimit(`pin:${user.uid}`, 8, 5 * 60 * 1000);
      if (!rl.allowed) {
        return res.status(429).json({ success: false, message: `Too many PIN attempts. Wait ${rl.retryAfterSec}s.` });
      }
      const { pin } = req.body || {};
      const db = getServerDb();
      const secSnap = await db.doc(`wallets/${user.uid}/security/config`).get();
      const pinHash = secSnap.exists ? secSnap.data()?.pinHash : '';
      if (!pinHash) {
        return res.status(400).json({ success: false, message: 'No Transaction PIN has been set yet.' });
      }
      const valid = verifyPinHash(String(pin || ''), pinHash);
      if (!valid) {
        return res.status(403).json({ success: false, valid: false, message: 'Incorrect Transaction PIN.' });
      }
      return res.json({ success: true, valid: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'PIN verification failed.' });
    }
  });

  app.post('/api/wallet/pin/change', async (req: AuthedRequest, res: Response) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const { currentPin, newPin } = req.body || {};
      if (!/^\d{4}$/.test(String(newPin || '').trim())) {
        return res.status(400).json({ success: false, message: 'New Transaction PIN must be 4 digits.' });
      }
      const db = getServerDb();
      const secRef = db.doc(`wallets/${user.uid}/security/config`);
      const secSnap = await secRef.get();
      const storedHash = secSnap.exists ? secSnap.data()?.pinHash : '';
      if (storedHash && !verifyPinHash(String(currentPin || ''), storedHash)) {
        return res.status(403).json({ success: false, message: 'Current Transaction PIN is incorrect.' });
      }
      await secRef.set({ pinHash: hashPin(String(newPin).trim()), updatedAt: getServerTimestamp() }, { merge: true });
      await db.doc(`users/${user.uid}`).set({ hasTransactionPin: true }, { merge: true });
      await recordSecurityEvent(user.uid, 'PIN_CHANGED', '4-digit Transaction PIN updated', req);

      return res.json({ success: true, message: 'Transaction PIN updated successfully.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Could not change PIN.' });
    }
  });

  // 16. Security Login History & Log Out All Other Devices
  app.get('/api/security/login-history', async (req: AuthedRequest, res: Response) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const db = getServerDb();
      const snap = await db.collection(`wallets/${user.uid}/security_logs`).limit(30).get();
      let logs: any[] = [];
      snap.forEach((d: any) => logs.push({ id: d.id, ...d.data() }));
      logs.sort((a, b) => new Date(b.createdAtIso || 0).getTime() - new Date(a.createdAtIso || 0).getTime());

      if (logs.length === 0) {
        await recordSecurityEvent(user.uid, 'SESSION_LOGIN', 'Active Wallet Session', req);
        const snap2 = await db.collection(`wallets/${user.uid}/security_logs`).limit(10).get();
        snap2.forEach((d: any) => logs.push({ id: d.id, ...d.data() }));
      }

      return res.json({ success: true, logs: logs.slice(0, 10) });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to load login history.' });
    }
  });

  app.post('/api/security/logout-all', async (req: AuthedRequest, res: Response) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      try {
        await auth().revokeRefreshTokens(user.uid);
      } catch (revokeErr) {
        console.warn('[Logout All] Token revoke notice:', revokeErr);
      }
      await recordSecurityEvent(user.uid, 'LOGOUT_ALL_DEVICES', 'Signed out all other devices', req);
      await createWalletAlert(user.uid, 'security', 'Devices Signed Out', 'All other active sessions were signed out.');
      return res.json({ success: true, message: 'All other devices have been logged out.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Could not log out other devices.' });
    }
  });

  // 17. Payment Methods (Encrypted storage, masked return, PIN required to delete)
  app.get('/api/wallet/payment-methods', async (req: AuthedRequest, res: Response) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const db = getServerDb();
      const snap = await db.collection(`wallets/${user.uid}/payment_methods`).limit(50).get();
      const methods: any[] = [];
      snap.forEach((d: any) => {
        const data = d.data() || {};
        methods.push({
          id: d.id,
          type: data.type || 'bank_transfer',
          name: data.name || 'Saved Method',
          details: data.details || '****',
          network: data.network || undefined,
          isDefault: Boolean(data.isDefault)
        });
      });
      return res.json({ success: true, paymentMethods: methods });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Could not load payment methods.' });
    }
  });

  app.post('/api/wallet/payment-methods/add', async (req: AuthedRequest, res: Response) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const { type = 'bank_transfer', name, details, network = '', bankCode = '' } = req.body || {};
      const rawDetails = String(details || '').trim();
      const cleanName = String(name || '').trim();
      if (!cleanName || !rawDetails) {
        return res.status(400).json({ success: false, message: 'Method name and details are required.' });
      }

      const masked =
        type === 'credit_card'
          ? maskCardNumber(rawDetails)
          : type === 'crypto'
            ? maskCryptoAddress(rawDetails)
            : type === 'mobile_money'
              ? maskPhoneNumber(rawDetails)
              : maskAccountNumber(rawDetails);

      const db = getServerDb();
      const methodId = `pm_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`;
      const record = {
        id: methodId,
        type,
        name: cleanName,
        details: masked,
        network,
        bankCode,
        encryptedPayload: encryptSensitive(rawDetails),
        isDefault: false,
        updatedAtIso: new Date().toISOString()
      };
      await db.doc(`wallets/${user.uid}/payment_methods/${methodId}`).set(record);

      // Sync back to User Profile 02/03 automatically
      if (type === 'bank_transfer') {
        await db.doc(`users/${user.uid}`).set(
          {
            bankName: cleanName,
            bankCode,
            accountNumber: masked,
            accountNumberEncrypted: encryptSensitive(rawDetails),
            bankAddedAt: new Date().toISOString()
          },
          { merge: true }
        );
      } else if (type === 'crypto') {
        const isUsdt = cleanName.toUpperCase().includes('USDT') || network.toUpperCase().includes('TRC20');
        await db.doc(`users/${user.uid}`).set(
          isUsdt
            ? { usdtAddress: masked, usdtEncrypted: encryptSensitive(rawDetails) }
            : { btcAddress: masked, btcEncrypted: encryptSensitive(rawDetails), externalWallet: masked },
          { merge: true }
        );
      } else if (type === 'mobile_money') {
        await db.doc(`users/${user.uid}`).set(
          {
            mobileMoneyProvider: network || cleanName,
            mobileMoneyNumber: masked,
            mobileMoneyEncrypted: encryptSensitive(rawDetails)
          },
          { merge: true }
        );
      }

      await recordSecurityEvent(user.uid, 'PAYMENT_METHOD_ADDED', `Added ${cleanName} (${masked})`, req);

      return res.json({
        success: true,
        paymentMethod: {
          id: methodId,
          type,
          name: cleanName,
          details: masked,
          network,
          isDefault: false
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to add payment method.' });
    }
  });

  app.delete('/api/wallet/payment-methods/:id', async (req: AuthedRequest, res: Response) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const pin = String(req.body?.pin || req.headers['x-wallet-pin'] || '').trim();
      const db = getServerDb();
      const secSnap = await db.doc(`wallets/${user.uid}/security/config`).get();
      const pinHash = secSnap.exists ? secSnap.data()?.pinHash : '';

      if (!pinHash) {
        return res.status(403).json({
          success: false,
          code: 'PIN_NOT_SET',
          message: 'Create a 4-digit Transaction PIN before removing saved payment methods.'
        });
      }
      if (!verifyPinHash(pin, pinHash)) {
        return res.status(403).json({
          success: false,
          code: 'INVALID_PIN',
          message: 'Incorrect Transaction PIN. Removal cancelled.'
        });
      }

      const id = String(req.params.id || '').trim();
      await db.doc(`wallets/${user.uid}/payment_methods/${id}`).delete();
      await recordSecurityEvent(user.uid, 'PAYMENT_METHOD_REMOVED', `Removed payment method ${id}`, req);

      return res.json({ success: true, message: 'Payment method removed safely.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to remove payment method.' });
    }
  });

  // 18. Wallet Alerts
  app.get('/api/wallet/alerts', async (req: AuthedRequest, res: Response) => {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const db = getServerDb();
      const snap = await db.collection(`wallets/${user.uid}/alerts`).limit(30).get();
      const alerts: any[] = [];
      snap.forEach((d: any) => alerts.push({ id: d.id, ...d.data() }));
      alerts.sort((a, b) => new Date(b.createdAtIso || 0).getTime() - new Date(a.createdAtIso || 0).getTime());
      return res.json({ success: true, alerts });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Could not load alerts.' });
    }
  });
}
