import { db, doc, getDoc, setDoc, updateDoc, serverTimestamp } from '../firebase';
import { CreatorStats, WalletsDoc } from '../types';

export const LAUNCH_BONUS_END_DATE = '2026-12-01';
export const BASE_PAYOUT_RATE = 200; // ₦200 per 1000 qualified views
export const LAUNCH_BONUS_RATE = 500; // ₦500 per 1000 qualified views
export const QUALIFIED_VIEW_REWARD = 0.20; // ₦0.20 per qualified view (>= 5s)
export const MIN_WITHDRAWAL_AMOUNT = 1000; // ₦1000 min withdrawal
export const INVITE_BONUS_AMOUNT = 50; // ₦50 to both users
export const MAX_MONTHLY_INVITE_BONUS = 5000; // ₦5,000 max monthly

export const INITIAL_CREATOR_STATS: CreatorStats = {
  availableBalance: 3200,
  pendingBalance: 1150,
  totalViews: 24520,
  todayViews: 142,
  todayEarnings: 28.4,
  inviteBonus: 650,
  rate: BASE_PAYOUT_RATE,
  launchBonusRate: LAUNCH_BONUS_RATE,
  launchBonusEnd: LAUNCH_BONUS_END_DATE,
  qualifiedViews: 18400,
  followersCount: 1240
};

export const INITIAL_WALLETS_DOC: WalletsDoc = {
  mainWallet: {
    balance: 5400
  },
  creatorWallet: {
    available: 3200,
    pending: 1150
  }
};

/**
 * Load or initialize creator stats for user
 */
export async function loadCreatorStats(userId: string): Promise<CreatorStats> {
  const localKey = `efado_creator_stats_${userId}`;
  let stats: CreatorStats = { ...INITIAL_CREATOR_STATS, userId };

  try {
    const raw = localStorage.getItem(localKey);
    if (raw) {
      stats = { ...stats, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn("Local storage parse error:", e);
  }

  try {
    const ref = doc(db, 'creator_stats', userId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as CreatorStats;
      stats = { ...stats, ...data };
      localStorage.setItem(localKey, JSON.stringify(stats));
    } else {
      // Initialize in Firestore
      await setDoc(ref, {
        ...stats,
        lastUpdated: serverTimestamp()
      }, { merge: true });
    }
  } catch (e) {
    console.warn("Firestore creator_stats fetch fallback:", e);
  }

  return stats;
}

/**
 * Load or initialize wallets doc for user
 */
export async function loadWalletsDoc(userId: string): Promise<WalletsDoc> {
  const localKey = `efado_wallets_${userId}`;
  let wallets: WalletsDoc = { ...INITIAL_WALLETS_DOC, userId };

  try {
    const raw = localStorage.getItem(localKey);
    if (raw) {
      wallets = { ...wallets, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn("Local wallets parse error:", e);
  }

  try {
    const ref = doc(db, 'wallets', userId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as WalletsDoc;
      wallets = { ...wallets, ...data };
      localStorage.setItem(localKey, JSON.stringify(wallets));
    } else {
      await setDoc(ref, {
        ...wallets,
        lastUpdated: serverTimestamp()
      }, { merge: true });
    }
  } catch (e) {
    console.warn("Firestore wallets fetch fallback:", e);
  }

  return wallets;
}

/**
 * Log a 5s qualified view: adds ₦0.20 to pendingBalance in real-time
 */
export async function recordQualifiedView(userId: string): Promise<{
  added: number;
  newPending: number;
  newTodayEarnings: number;
  newTodayViews: number;
}> {
  const localKey = `efado_creator_stats_${userId}`;
  const walletsKey = `efado_wallets_${userId}`;
  
  let stats: CreatorStats = { ...INITIAL_CREATOR_STATS };
  try {
    const raw = localStorage.getItem(localKey);
    if (raw) stats = { ...stats, ...JSON.parse(raw) };
  } catch {}

  const added = QUALIFIED_VIEW_REWARD;
  const newPending = +(stats.pendingBalance + added).toFixed(2);
  const newTodayEarnings = +(stats.todayEarnings + added).toFixed(2);
  const newTodayViews = (stats.todayViews || 0) + 1;
  const newTotalViews = (stats.totalViews || 0) + 1;
  const newQualifiedViews = (stats.qualifiedViews || 0) + 1;

  const updatedStats: CreatorStats = {
    ...stats,
    pendingBalance: newPending,
    todayEarnings: newTodayEarnings,
    todayViews: newTodayViews,
    totalViews: newTotalViews,
    qualifiedViews: newQualifiedViews,
    rate: BASE_PAYOUT_RATE,
    launchBonusRate: LAUNCH_BONUS_RATE,
    launchBonusEnd: LAUNCH_BONUS_END_DATE
  };

  try {
    localStorage.setItem(localKey, JSON.stringify(updatedStats));
    // Also sync to wallets localStorage
    const rawWallets = localStorage.getItem(walletsKey);
    if (rawWallets) {
      const parsedWallets = JSON.parse(rawWallets) as WalletsDoc;
      parsedWallets.creatorWallet.pending = newPending;
      localStorage.setItem(walletsKey, JSON.stringify(parsedWallets));
    }
  } catch (e) {}

  // Sync with Firestore asynchronously
  try {
    const statRef = doc(db, 'creator_stats', userId);
    setDoc(statRef, {
      availableBalance: updatedStats.availableBalance,
      pendingBalance: newPending,
      totalViews: newTotalViews,
      todayViews: newTodayViews,
      todayEarnings: newTodayEarnings,
      inviteBonus: updatedStats.inviteBonus,
      rate: BASE_PAYOUT_RATE,
      launchBonusRate: LAUNCH_BONUS_RATE,
      launchBonusEnd: LAUNCH_BONUS_END_DATE,
      lastUpdated: serverTimestamp()
    }, { merge: true }).catch(() => {});

    const walletRef = doc(db, 'wallets', userId);
    setDoc(walletRef, {
      creatorWallet: {
        available: updatedStats.availableBalance,
        pending: newPending
      },
      lastUpdated: serverTimestamp()
    }, { merge: true }).catch(() => {});
  } catch {}

  // Dispatch custom window event so UI counters animate in real-time
  window.dispatchEvent(new CustomEvent('creator-view-qualified', {
    detail: {
      added,
      pendingBalance: newPending,
      todayEarnings: newTodayEarnings,
      todayViews: newTodayViews,
      totalViews: newTotalViews
    }
  }));

  return {
    added,
    newPending,
    newTodayEarnings,
    newTodayViews
  };
}

/**
 * Release mature 7-day pending funds into available balance
 */
export async function releasePendingFunds(userId: string): Promise<CreatorStats> {
  const localKey = `efado_creator_stats_${userId}`;
  let stats: CreatorStats = { ...INITIAL_CREATOR_STATS };
  try {
    const raw = localStorage.getItem(localKey);
    if (raw) stats = { ...stats, ...JSON.parse(raw) };
  } catch {}

  if (stats.pendingBalance <= 0) return stats;

  const released = stats.pendingBalance;
  const newAvailable = +(stats.availableBalance + released).toFixed(2);
  const newPending = 0;

  const updated: CreatorStats = {
    ...stats,
    availableBalance: newAvailable,
    pendingBalance: newPending
  };

  try {
    localStorage.setItem(localKey, JSON.stringify(updated));
    const walletRef = doc(db, 'wallets', userId);
    setDoc(walletRef, {
      creatorWallet: {
        available: newAvailable,
        pending: 0
      },
      lastUpdated: serverTimestamp()
    }, { merge: true }).catch(() => {});

    const statRef = doc(db, 'creator_stats', userId);
    setDoc(statRef, {
      availableBalance: newAvailable,
      pendingBalance: 0,
      lastUpdated: serverTimestamp()
    }, { merge: true }).catch(() => {});
  } catch {}

  window.dispatchEvent(new CustomEvent('creator-funds-released', { detail: updated }));
  return updated;
}

/**
 * Withdraw from available balance (min ₦1,000)
 */
export async function withdrawCreatorFunds(
  userId: string,
  amount: number,
  method: 'BANK' | 'USSD' | 'CRYPTO_USDT',
  details: Record<string, string>
): Promise<{ success: boolean; message: string; remainingAvailable?: number }> {
  if (amount < MIN_WITHDRAWAL_AMOUNT) {
    return {
      success: false,
      message: `Minimum withdrawal is ₦${MIN_WITHDRAWAL_AMOUNT.toLocaleString()}.`
    };
  }

  const localKey = `efado_creator_stats_${userId}`;
  let stats: CreatorStats = { ...INITIAL_CREATOR_STATS };
  try {
    const raw = localStorage.getItem(localKey);
    if (raw) stats = { ...stats, ...JSON.parse(raw) };
  } catch {}

  if (stats.availableBalance < amount) {
    return {
      success: false,
      message: `Insufficient available balance. You have ₦${stats.availableBalance.toLocaleString()} available. Pending funds release after 7 days.`
    };
  }

  const newAvailable = +(stats.availableBalance - amount).toFixed(2);
  const updated: CreatorStats = {
    ...stats,
    availableBalance: newAvailable,
    withdrawnAmount: (stats.withdrawnAmount || 0) + amount
  };

  try {
    localStorage.setItem(localKey, JSON.stringify(updated));
    const statRef = doc(db, 'creator_stats', userId);
    setDoc(statRef, {
      availableBalance: newAvailable,
      withdrawnAmount: updated.withdrawnAmount,
      lastUpdated: serverTimestamp()
    }, { merge: true }).catch(() => {});

    const walletRef = doc(db, 'wallets', userId);
    setDoc(walletRef, {
      creatorWallet: {
        available: newAvailable,
        pending: stats.pendingBalance
      },
      lastUpdated: serverTimestamp()
    }, { merge: true }).catch(() => {});
  } catch {}

  window.dispatchEvent(new CustomEvent('creator-withdrawal-success', {
    detail: { amount, newAvailable, method, details }
  }));

  return {
    success: true,
    message: `Withdrawal of ₦${amount.toLocaleString()} via ${method} initiated successfully!`,
    remainingAvailable: newAvailable
  };
}

/**
 * Add live gift earning: Creator gets 80% of coin value
 */
export async function addLiveGiftToCreatorWallet(userId: string, coinValue: number): Promise<number> {
  const creatorShare = +(coinValue * 0.8).toFixed(2);
  const localKey = `efado_creator_stats_${userId}`;
  let stats: CreatorStats = { ...INITIAL_CREATOR_STATS };
  try {
    const raw = localStorage.getItem(localKey);
    if (raw) stats = { ...stats, ...JSON.parse(raw) };
  } catch {}

  const newPending = +(stats.pendingBalance + creatorShare).toFixed(2);
  const updated: CreatorStats = {
    ...stats,
    pendingBalance: newPending,
    todayEarnings: +(stats.todayEarnings + creatorShare).toFixed(2)
  };

  try {
    localStorage.setItem(localKey, JSON.stringify(updated));
    const statRef = doc(db, 'creator_stats', userId);
    setDoc(statRef, {
      pendingBalance: newPending,
      todayEarnings: updated.todayEarnings,
      lastUpdated: serverTimestamp()
    }, { merge: true }).catch(() => {});
  } catch {}

  return creatorShare;
}

/**
 * Credit Invite bonus: ₦50 to user
 */
export async function creditInviteBonus(userId: string): Promise<number> {
  const localKey = `efado_creator_stats_${userId}`;
  let stats: CreatorStats = { ...INITIAL_CREATOR_STATS };
  try {
    const raw = localStorage.getItem(localKey);
    if (raw) stats = { ...stats, ...JSON.parse(raw) };
  } catch {}

  const newBonus = (stats.inviteBonus || 0) + INVITE_BONUS_AMOUNT;
  const newAvailable = +(stats.availableBalance + INVITE_BONUS_AMOUNT).toFixed(2);
  const updated: CreatorStats = {
    ...stats,
    inviteBonus: newBonus,
    availableBalance: newAvailable,
    invitedFriends: (stats.invitedFriends || 0) + 1
  };

  try {
    localStorage.setItem(localKey, JSON.stringify(updated));
    const statRef = doc(db, 'creator_stats', userId);
    setDoc(statRef, {
      inviteBonus: newBonus,
      availableBalance: newAvailable,
      invitedFriends: updated.invitedFriends,
      lastUpdated: serverTimestamp()
    }, { merge: true }).catch(() => {});
  } catch {}

  window.dispatchEvent(new CustomEvent('creator-invite-bonus-credited', { detail: updated }));
  return INVITE_BONUS_AMOUNT;
}
