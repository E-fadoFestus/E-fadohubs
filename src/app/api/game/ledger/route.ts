import { auth, getServerDb, getServerTimestamp } from '../../../../lib/server-firestore.js';

const VALID_GAME_IDS = [
  'spinGame',
  'moneyCard',
  'tradingGame',
  'equilibrium',
  'deepSeaJet',
  'moneyQuiz'
] as const;

type ValidGameId = (typeof VALID_GAME_IDS)[number];

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1]?.trim() : null;
    if (!token) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = await auth().verifyIdToken(token);
    } catch {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!decoded?.uid) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const rawGameId = typeof body?.gameId === 'string' ? body.gameId.trim() : '';
    if (!VALID_GAME_IDS.includes(rawGameId as ValidGameId)) {
      return Response.json({ success: false, error: 'Invalid gameId' }, { status: 400 });
    }
    const gameId = rawGameId as ValidGameId;

    const stakeNum = Number(body?.stake ?? 0);
    const payoutNum = Number(body?.payout ?? 0);
    if (
      !Number.isFinite(stakeNum) ||
      !Number.isFinite(payoutNum) ||
      stakeNum < 0 ||
      payoutNum < 0 ||
      stakeNum > 50000000 ||
      payoutNum > 50000000
    ) {
      return Response.json({ success: false, error: 'Invalid stake or payout amount' }, { status: 400 });
    }

    const delta = Number((stakeNum - payoutNum).toFixed(2));
    if (delta === 0 && stakeNum === 0 && payoutNum === 0) {
      return Response.json({ success: true, gameId, delta: 0 });
    }

    const db = getServerDb();
    if (!db) {
      return Response.json({ success: false, error: 'Server database not configured' }, { status: 500 });
    }

    const result = await db.runTransaction(async (tx: any) => {
      const adminRef = db.doc('adminStats/global');
      const snap = await tx.get(adminRef);
      const cur = snap?.exists ? snap.data() || {} : {};
      const curGw = cur.gameWallets || {};

      const nextGameWallets = {
        spinGame: Number(curGw.spinGame || 0),
        moneyCard: Number(curGw.moneyCard || 0),
        tradingGame: Number(curGw.tradingGame || 0),
        equilibrium: Number(curGw.equilibrium || 0),
        deepSeaJet: Number(curGw.deepSeaJet || 0),
        moneyQuiz: Number(curGw.moneyQuiz || 0)
      };
      nextGameWallets[gameId] = Number((nextGameWallets[gameId] + delta).toFixed(2));

      const nextAdminWallet = Number((Number(cur.adminWallet || 0) + delta).toFixed(2));
      const nextTotalHouseGain = Number((Number(cur.totalHouseGain || 0) + delta).toFixed(2));

      tx.set(
        adminRef,
        {
          adminWallet: nextAdminWallet,
          totalHouseGain: nextTotalHouseGain,
          totalPlayers: Number(cur.totalPlayers || 0),
          pendingPayouts: Number(cur.pendingPayouts || 0),
          gameWallets: nextGameWallets,
          lastUpdated: getServerTimestamp()
        },
        { merge: true }
      );

      return {
        adminWallet: nextAdminWallet,
        totalHouseGain: nextTotalHouseGain,
        gameWallets: nextGameWallets
      };
    });

    return Response.json({
      success: true,
      gameId,
      delta,
      ...result
    });
  } catch (err: any) {
    console.error('[Game Ledger Route Error]:', err);
    return Response.json(
      { success: false, error: err?.message || 'Failed to update game ledger' },
      { status: 500 }
    );
  }
}
