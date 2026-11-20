import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServerDb, getServerTimestamp, auth } from '../../src/lib/server-firestore';

const ACTIVE_CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'CAD', 'AUD', 'GHS', 'ZAR', 'XOF'];

const cleanKey = (k?: string) =>
  (k || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/[;\s]/g, '');

function normalizeFlutterwaveBankCode(code: string): string {
  const clean = String(code || '').trim();
  if (clean === '999992') return '100004'; // OPay
  if (clean === '999991') return '100033'; // PalmPay
  if (clean === '50211') return '090267';  // Kuda
  return clean;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const authHeader = (req.headers.authorization || req.headers.Authorization || '') as string;
    const token = authHeader.startsWith('Bearer ') ? authHeader.split('Bearer ')[1]?.trim() : null;
    if (!token) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    let decoded: any;
    try {
      decoded = await auth().verifyIdToken(token);
      if (!decoded?.uid) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
    } catch {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const userId = decoded.uid;
    const body = req.body || {};
    const {
      amount,
      account_number,
      bank_code,
      account_bank,
      account_name,
      beneficiary_name,
      source_wallet,
      currency: rawCurrency,
      narration
    } = body;

    const wdCurrency = String(rawCurrency || 'NGN').trim().toUpperCase();
    if (wdCurrency === 'SIRA') {
      return res.status(400).json({
        success: false,
        error: 'SIRA currency is Coming Soon and disabled for withdrawals.'
      });
    }
    if (!ACTIVE_CURRENCIES.includes(wdCurrency)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported currency "${wdCurrency}"`
      });
    }

    const targetWalletField =
      source_wallet === 'playerWallet'
        ? 'playerWallet'
        : source_wallet === 'cashOutWallet'
          ? 'cashOutWallet'
          : 'depositWallet';

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount < 100 || numAmount > 10000000) {
      return res.status(400).json({
        success: false,
        error: `Invalid amount: Must be between 100 and 10,000,000 ${wdCurrency}`
      });
    }

    const cleanAccount = String(account_number || '').trim().replace(/\D/g, '');
    const cleanBank = String(bank_code || account_bank || '').trim();
    const flwBankCode = normalizeFlutterwaveBankCode(cleanBank);
    const providedName = String(account_name || beneficiary_name || '').trim();

    if (!cleanAccount || cleanAccount.length !== 10 || !flwBankCode || !providedName) {
      return res.status(400).json({
        success: false,
        error: 'Please verify destination bank account first (10-digit account number & bank).'
      });
    }

    const flwSecret = cleanKey(
      process.env.FLWSECK_LIVE ||
        process.env.FLW_SECRET_KEY ||
        process.env.FLUTTERWAVE_SECRET_KEY ||
        process.env.FLWSECK
    );
    if (!flwSecret) {
      return res.status(500).json({
        success: false,
        error: 'Flutterwave secret key (FLW_SECRET_KEY / FLWSECK_LIVE) is not configured in Vercel environment.'
      });
    }

    const db = getServerDb();
    if (!db) {
      return res.status(500).json({ success: false, error: 'Server Firestore not configured' });
    }

    // 1. Check user wallet pocket balance on server BEFORE initiating payout
    const walletRef = db.doc(`wallets/${userId}/${wdCurrency}/depositWallet`);
    const userRef = db.doc(`users/${userId}`);
    const [walletSnap, userSnap] = await Promise.all([walletRef.get(), userRef.get()]);
    const pocketBal = walletSnap.exists ? Number(walletSnap.data()?.balance ?? walletSnap.data()?.depositWallet ?? 0) : 0;
    const userFieldBal = userSnap.exists ? Number(userSnap.data()?.[targetWalletField] || 0) : 0;
    const availableBalance = targetWalletField === 'depositWallet' ? pocketBal : userFieldBal;

    if (numAmount > availableBalance) {
      return res.status(400).json({
        success: false,
        error: `INSUFFICIENT FUNDS in ${targetWalletField === 'depositWallet' ? `${wdCurrency} Deposit Pocket` : targetWalletField} (Available: ${wdCurrency} ${availableBalance.toLocaleString()})`
      });
    }

    // 2. Verify destination bank account via Flutterwave with 10s timeout
    const resolveCtrl = new AbortController();
    const resolveTimer = setTimeout(() => resolveCtrl.abort(), 10000);
    try {
      const resolveRes = await fetch('https://api.flutterwave.com/v3/accounts/resolve', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${flwSecret}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account_number: cleanAccount,
          account_bank: flwBankCode
        }),
        signal: resolveCtrl.signal
      });
      clearTimeout(resolveTimer);
      const resolveData = await resolveRes.json().catch(() => null);
      if (!resolveData?.status || resolveData?.status !== 'success' || !resolveData?.data?.account_name) {
        return res.status(400).json({
          success: false,
          error: resolveData?.message || 'Invalid account number or destination bank could not be resolved.'
        });
      }
    } catch (resErr: any) {
      clearTimeout(resolveTimer);
      return res.status(resErr?.name === 'AbortError' ? 504 : 400).json({
        success: false,
        error:
          resErr?.name === 'AbortError'
            ? 'Bank not responding. Please try again.'
            : 'Could not verify destination bank account. Check details and try again.'
      });
    }

    // 3. Atomic debit + pending transaction creation
    const reference = `EFADO-FLW-WD-${userId.substring(0, 8)}-${Date.now()}`;
    const serverTime = getServerTimestamp();
    const txDoc = db.doc(`transactions/${reference}`);
    const userTxDoc = db.doc(`wallets/${userId}/transactions/${reference}`);

    let debitedBalance = 0;

    try {
      await db.runTransaction(async (t: any) => {
        if (targetWalletField === 'depositWallet') {
          const freshWalletSnap = await t.get(walletRef);
          const bal = freshWalletSnap.exists
            ? Number(freshWalletSnap.data()?.balance ?? freshWalletSnap.data()?.depositWallet ?? 0)
            : 0;
          if (numAmount > bal) {
            throw new Error(`INSUFFICIENT FUNDS (Available: ${wdCurrency} ${bal.toLocaleString()})`);
          }
          debitedBalance = bal - numAmount;
          t.set(
            walletRef,
            {
              balance: debitedBalance,
              depositWallet: debitedBalance,
              currency: wdCurrency,
              updatedAt: serverTime
            },
            { merge: true }
          );
        } else {
          const freshUserSnap = await t.get(userRef);
          const bal = freshUserSnap.exists ? Number(freshUserSnap.data()?.[targetWalletField] || 0) : 0;
          if (numAmount > bal) {
            throw new Error(`INSUFFICIENT FUNDS (Available: ${wdCurrency} ${bal.toLocaleString()})`);
          }
          debitedBalance = bal - numAmount;
          t.set(
            userRef,
            {
              [targetWalletField]: debitedBalance,
              updatedAt: serverTime
            },
            { merge: true }
          );
        }

        const wdRecord = {
          type: 'withdrawal',
          status: 'pending',
          amount: numAmount,
          currency: wdCurrency,
          sourceWallet: targetWalletField,
          account_number: cleanAccount,
          bank_code: flwBankCode,
          account_name: providedName,
          reference,
          userId,
          gateway: 'flutterwave',
          method: 'Flutterwave Bank Transfer',
          purpose: 'Cash Out Request',
          description: `Flutterwave Withdrawal to ${providedName} (${cleanAccount})`,
          timestamp: serverTime,
          createdAt: serverTime,
          updatedAt: serverTime
        };

        t.set(txDoc, wdRecord, { merge: true });
        t.set(userTxDoc, wdRecord, { merge: true });
      });
    } catch (txErr: any) {
      if (String(txErr?.message || '').includes('INSUFFICIENT FUNDS')) {
        return res.status(400).json({ success: false, error: txErr.message });
      }
      throw txErr;
    }

    // 4. Execute live Flutterwave V3 Transfer
    const trfCtrl = new AbortController();
    const trfTimer = setTimeout(() => trfCtrl.abort(), 12000);
    try {
      const originHeader = req.headers.origin as string | undefined;
      const baseAppUrl = (originHeader || process.env.APP_URL || 'https://www.e-fado.com').replace(/\/$/, '');

      const flwTrfRes = await fetch('https://api.flutterwave.com/v3/transfers', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${flwSecret}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account_bank: flwBankCode,
          account_number: cleanAccount,
          amount: numAmount,
          narration: narration || 'EFADO Wallet Withdrawal',
          currency: wdCurrency,
          reference,
          debit_currency: wdCurrency,
          callback_url: `${baseAppUrl}/api/webhook/flutterwave`
        }),
        signal: trfCtrl.signal
      });
      clearTimeout(trfTimer);
      const trfData = await flwTrfRes.json().catch(() => null);

      if (!flwTrfRes.ok || trfData?.status !== 'success') {
        throw new Error(trfData?.message || 'Flutterwave transfer rejected by gateway');
      }

      await Promise.all([
        txDoc.set(
          {
            transfer_id: trfData?.data?.id || '',
            transfer_status: trfData?.data?.status || 'NEW',
            updatedAt: getServerTimestamp()
          },
          { merge: true }
        ),
        userTxDoc.set(
          {
            transfer_id: trfData?.data?.id || '',
            transfer_status: trfData?.data?.status || 'NEW',
            updatedAt: getServerTimestamp()
          },
          { merge: true }
        )
      ]);

      return res.status(200).json({
        success: true,
        status: true,
        debitedOnServer: true,
        message: 'Withdrawal processing via Flutterwave, you will receive funds shortly',
        reference,
        amount: numAmount,
        currency: wdCurrency,
        newBalance: debitedBalance,
        data: trfData?.data
      });
    } catch (transferErr: any) {
      clearTimeout(trfTimer);
      console.error('[Vercel Flutterwave Withdraw Failed -> Refunding]:', transferErr);

      try {
        await db.runTransaction(async (t: any) => {
          const refundTime = getServerTimestamp();
          if (targetWalletField === 'depositWallet') {
            const wSnap = await t.get(walletRef);
            const cur = wSnap.exists ? Number(wSnap.data()?.balance ?? wSnap.data()?.depositWallet ?? 0) : 0;
            t.set(
              walletRef,
              {
                balance: cur + numAmount,
                depositWallet: cur + numAmount,
                currency: wdCurrency,
                updatedAt: refundTime
              },
              { merge: true }
            );
          } else {
            const uSnap = await t.get(userRef);
            const cur = uSnap.exists ? Number(uSnap.data()?.[targetWalletField] || 0) : 0;
            t.set(
              userRef,
              {
                [targetWalletField]: cur + numAmount,
                updatedAt: refundTime
              },
              { merge: true }
            );
          }

          const failUpdate = {
            status: 'failed',
            refunded: true,
            error: transferErr?.message || 'Transfer failed, balance refunded to wallet',
            updatedAt: refundTime
          };
          t.set(txDoc, failUpdate, { merge: true });
          t.set(userTxDoc, failUpdate, { merge: true });
        });
      } catch (refundErr) {
        console.error('[Vercel Flutterwave Critical Refund Error]:', refundErr);
      }

      return res.status(transferErr?.name === 'AbortError' ? 504 : 500).json({
        success: false,
        error: transferErr?.message
          ? `Transfer failed (${transferErr.message}). Balance has been refunded to your wallet.`
          : 'Transfer failed, balance refunded to wallet'
      });
    }
  } catch (error: any) {
    console.error('[Vercel Flutterwave Withdraw Crash]:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Server error processing withdrawal'
    });
  }
}
