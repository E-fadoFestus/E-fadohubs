import { useState, useEffect, useCallback } from 'react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signInWithRedirect,
  signOut,
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { UserProfile } from '../types';
import { ACTIVE_WALLET_CURRENCIES } from '../constants/walletCurrencies';

export function useAppAuth() {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('efado_cached_user');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  // Compute 1 Unified Liquid Wallet from canonical NGN pocket
  const depositWallet = user?.walletPockets?.NGN ?? user?.depositWallet ?? 0;
  const playerWallet = user?.playerWallet || 0;
  const cashOutWallet = user?.cashOutWallet || 0;
  const wallet = depositWallet + playerWallet;

  // Synchronize Auth, User Document, and all 9 canonical Currency Pockets in real-time
  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;
    let pocketUnsubs: (() => void)[] = [];

    const cleanupPockets = () => {
      pocketUnsubs.forEach((u) => {
        try { u(); } catch {}
      });
      pocketUnsubs = [];
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }
      cleanupPockets();

      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const livePockets: Record<string, number> = {};
        ACTIVE_WALLET_CURRENCIES.forEach((c) => {
          livePockets[c.code] = 0;
        });

        pocketUnsubs = ACTIVE_WALLET_CURRENCIES.map((cur) =>
          onSnapshot(
            doc(db, 'wallets', firebaseUser.uid, cur.code, 'depositWallet'),
            (snap) => {
              const bal = snap.exists()
                ? Number(snap.data()?.balance ?? snap.data()?.depositWallet ?? 0) || 0
                : 0;
              livePockets[cur.code] = bal;
              setUser((prev) => {
                if (!prev || prev.uid !== firebaseUser.uid) return prev;
                const nextPockets = { ...(prev.walletPockets || {}), ...livePockets };
                const updated: UserProfile = {
                  ...prev,
                  walletPockets: nextPockets,
                  depositWallet: nextPockets.NGN ?? 0
                };
                localStorage.setItem('efado_cached_user', JSON.stringify(updated));
                return updated;
              });
            },
            (err) => {
              console.warn(`[useAppAuth] Pocket listener notice (${cur.code}):`, err?.message || err);
            }
          )
        );

        // Listen to Firestore user doc updates in real-time
        unsubscribeUserDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const ngnBal = livePockets.NGN ?? 0;
            const profile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: data.displayName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'EFADO Member',
              photoURL: data.photoURL || firebaseUser.photoURL || '',
              playerWallet: data.playerWallet ?? 0,
              depositWallet: ngnBal,
              cashOutWallet: data.cashOutWallet ?? 0,
              miningWallet: data.miningWallet ?? 0,
              walletPockets: { ...livePockets },
              miningProgress: data.miningProgress || { stage: 'E', collectedInStage: 0 },
              role: (firebaseUser.email === 'efado226@gmail.com' || firebaseUser.email === 'efadofestus@gmail.com' || data.role === 'admin') ? 'admin' : 'player',
              createdAt: data.createdAt || new Date().toISOString(),
              csccRegistered: data.csccRegistered || false,
              bankName: data.bankName,
              accountNumber: data.accountNumber,
              accountName: data.accountName,
              hasReceivedSignupBonus: data.hasReceivedSignupBonus || false
            };
            setUser(profile);
            localStorage.setItem('efado_cached_user', JSON.stringify(profile));
            localStorage.setItem('efado_user_session_exists', 'true');
          } else {
            // New user registration
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'EFADO Member',
              photoURL: firebaseUser.photoURL || '',
              playerWallet: 0,
              depositWallet: livePockets.NGN ?? 0,
              cashOutWallet: 0,
              miningWallet: 0,
              walletPockets: { ...livePockets },
              miningProgress: { stage: 'E', collectedInStage: 0 },
              role: (firebaseUser.email === 'efado226@gmail.com' || firebaseUser.email === 'efadofestus@gmail.com') ? 'admin' : 'player',
              createdAt: new Date().toISOString(),
              hasReceivedSignupBonus: false
            };
            setDoc(userRef, newProfile, { merge: true }).catch(console.error);
            setUser(newProfile);
            localStorage.setItem('efado_cached_user', JSON.stringify(newProfile));
          }
          setLoading(false);
        }, (err) => {
          console.warn('[useAppAuth] Firestore snapshot notice:', err);
          setLoading(false);
        });
      } else {
        setUser(null);
        localStorage.removeItem('efado_cached_user');
        localStorage.removeItem('efado_user_session_exists');
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
      }
      cleanupPockets();
    };
  }, []);

  // Cross-tab storage synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'efado_cached_user' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setUser(parsed);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (popupErr: any) {
      console.warn('[useAppAuth] Popup blocked or failed, falling back to redirect:', popupErr);
      if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/cancelled-popup-request') {
        await signInWithRedirect(auth, googleProvider);
      } else {
        throw popupErr;
      }
    }
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    localStorage.removeItem('efado_cached_user');
    localStorage.removeItem('efado_user_session_exists');
  }, []);

  return {
    user,
    wallet,
    depositWallet,
    playerWallet,
    cashOutWallet,
    loading,
    signInWithGoogle,
    signOutUser,
    setUser,
  };
}
