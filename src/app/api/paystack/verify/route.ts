import { verifyPaystackPayment } from '../../../../lib/paystack.js';
import { getServerDb, getServerTimestamp, auth } from '../../../../lib/server-firestore.js';

const ACTIVE_CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'CAD', 'AUD', 'GHS', 'ZAR', 'XOF'];

async function verifyLogic(reference: string, userId: string) {
  if (!reference) {
    return Response.json({ success: false, error: 'reference parameter is required' }, { status: 400 });
  }

  const db = getServerDb();
  if (!db) {
    return Response.json({ success: false, error: 'Server Firestore not configured' }, { status: 500 });
  }

  const paystackResult = await verifyPaystackPayment(reference);
  const data = paystackResult?.data;

  if (!paystackResult?.status || data?.status !== 'success') {
    return Response.json({
      success: false,
      error: data?.gateway_response || 'Payment not successful on Paystack',
      message: 'Payment not successful',
      status: data?.status || 'failed'
    }, { status: 400 });
  }

  const paidAmount = Number(data.amount) / 100;
  const paymentMetaUserId = data.metadata?.userId;

  // Security guard: Ensure transaction belongs to the authenticated user if specified in metadata
  if (paymentMetaUserId && paymentMetaUserId !== userId) {
    console.error(`[Paystack Verify Security] Token user ${userId} does not match payment metadata user ${paymentMetaUserId}`);
    return Response.json({ success: false, error: 'Unauthorized: Payment does not match user account' }, { status: 403 });
  }

  const txRefDoc = db.doc(`transactions/${reference}`);
  const txSnapshot = await txRefDoc.get();
  const existingTx = txSnapshot.exists ? txSnapshot.data() : null;

  const txCurrency = String(data.currency || existingTx?.currency || 'NGN').trim().toUpperCase();
  if (txCurrency === 'SIRA' || !ACTIVE_CURRENCIES.includes(txCurrency)) {
    return Response.json({
      success: false,
      error: `Unsupported transaction currency "${txCurrency}"`
    }, { status: 400 });
  }

  if (existingTx && (existingTx.status === 'success' || existingTx.status === 'completed') && existingTx.credited === true) {
    return Response.json({
      success: true,
      credited: true,
      alreadyCredited: true,
      amount: existingTx.amount || paidAmount,
      currency: existingTx.currency || txCurrency,
      reference,
      message: 'Transaction already credited'
    });
  }

  if (existingTx && existingTx.amount && Math.abs(Number(existingTx.amount) - paidAmount) > 0.01) {
    return Response.json({
      success: false,
      error: 'Payment amount mismatch. Transaction rejected.'
    }, { status: 400 });
  }

  // Canonical single location per currency: wallets/{uid}/{currency}/depositWallet
  const walletRef = db.doc(`wallets/${userId}/${txCurrency}/depositWallet`);
  const userTxRef = db.doc(`wallets/${userId}/transactions/${reference}`);
  const serverTime = getServerTimestamp();

  let updatedBalance = 0;

  await db.runTransaction(async (transaction: any) => {
    const freshTxSnap = await transaction.get(txRefDoc);
    if (freshTxSnap.exists && freshTxSnap.data()?.credited === true) {
      const existingWalletSnap = await transaction.get(walletRef);
      updatedBalance = existingWalletSnap.exists
        ? Number(existingWalletSnap.data()?.balance ?? existingWalletSnap.data()?.depositWallet ?? 0)
        : 0;
      return;
    }

    const walletSnap = await transaction.get(walletRef);
    const oldBalance = walletSnap.exists ? Number(walletSnap.data()?.balance ?? walletSnap.data()?.depositWallet ?? 0) : 0;
    updatedBalance = oldBalance + paidAmount;

    transaction.set(walletRef, {
      balance: updatedBalance,
      depositWallet: updatedBalance,
      currency: txCurrency,
      userId,
      lastFundedRef: reference,
      createdAt: walletSnap.exists ? (walletSnap.data()?.createdAt || serverTime) : serverTime,
      updatedAt: serverTime
    }, { merge: true });

    if (txCurrency === 'NGN') {
      transaction.set(db.doc(`users/${userId}`), {
        depositWallet: updatedBalance,
        updatedAt: serverTime
      }, { merge: true });
    }

    const successRecord = {
      type: 'deposit',
      status: 'completed',
      credited: true,
      amount: paidAmount,
      balanceAfter: updatedBalance,
      currency: txCurrency,
      reference,
      userId,
      gateway: 'paystack',
      method: 'Paystack Gateway',
      purpose: 'Wallet Top-up',
      description: `Verified Paystack Deposit (${txCurrency}) [Ref: ${reference}]`,
      creditedPocket: `wallets/${userId}/${txCurrency}/depositWallet`,
      timestamp: serverTime,
      createdAt: existingTx?.createdAt || serverTime,
      updatedAt: serverTime
    };

    transaction.set(txRefDoc, successRecord, { merge: true });
    transaction.set(userTxRef, successRecord, { merge: true });
  });

  return Response.json({
    success: true,
    credited: true,
    amount: paidAmount,
    currency: txCurrency,
    newBalance: updatedBalance,
    reference,
    creditedPocket: `wallets/${userId}/${txCurrency}/depositWallet`,
    message: 'Payment verified and wallet credited successfully'
  });
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1]?.trim() : null;
    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = await auth().verifyIdToken(token);
    } catch {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = decoded.uid;
    const { searchParams } = new URL(req.url);
    const reference = (searchParams.get('reference') || '').trim();
    return await verifyLogic(reference, userId);
  } catch (error: any) {
    console.error('[Next.js Paystack Verify Error]:', error);
    return Response.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1]?.trim() : null;
    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = await auth().verifyIdToken(token);
    } catch {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = decoded.uid;
    const body = await req.json().catch(() => ({}));
    const reference = (body?.reference || '').trim();
    return await verifyLogic(reference, userId);
  } catch (error: any) {
    console.error('[Next.js Paystack Verify POST Error]:', error);
    return Response.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
