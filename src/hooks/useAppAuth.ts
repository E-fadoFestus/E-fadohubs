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

  // Compute 1 Unified Liquid Wallet
  const depositWallet = user?.depositWallet || 0;
  const playerWallet = user?.playerWallet || 0;
  const cashOutWallet = user?.cashOutWallet || 0;
  const wallet = depositWallet + playerWallet;

  // Synchronize Auth and Firestore User Document in real-time across tabs
  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // Listen to Firestore doc updates in real-time
        unsubscribeUserDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const profile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: data.displayName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'EFADO Member',
              photoURL: data.photoURL || firebaseUser.photoURL || '',
              playerWallet: data.playerWallet ?? 0,
              depositWallet: data.depositWallet ?? 0,
              cashOutWallet: data.cashOutWallet ?? 0,
              miningWallet: data.miningWallet ?? 0,
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
              depositWallet: 0,
              cashOutWallet: 0,
              miningWallet: 0,
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
        if (unsubscribeUserDoc) {
          unsubscribeUserDoc();
          unsubscribeUserDoc = null;
        }
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
