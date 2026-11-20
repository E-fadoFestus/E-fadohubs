import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore, FieldValue as AdminFieldValue } from 'firebase-admin/firestore';
import { db as clientDb } from '../firebase';
import { doc, getDoc, setDoc, runTransaction, serverTimestamp as clientServerTimestamp } from 'firebase/firestore';
import cfg from '../../firebase-applet-config.json';

function hasServiceAccount(): boolean {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT);
}

function getAdminApp() {
  const apps = getApps();
  if (apps.length) {
    return apps[0];
  }

  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountRaw) {
    try {
      const trimmed = serviceAccountRaw.trim();
      let serviceAccount: any;
      if (trimmed.startsWith('{')) {
        serviceAccount = JSON.parse(trimmed);
      } else {
        try {
          const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
          serviceAccount = JSON.parse(decoded);
        } catch {
          serviceAccount = JSON.parse(serviceAccountRaw);
        }
      }
      return initializeApp({
        credential: cert(serviceAccount),
        projectId: cfg.projectId
      });
    } catch (err) {
      console.warn('[Server Admin] Failed to parse service account, falling back to projectId:', err);
    }
  }

  return initializeApp({
    projectId: cfg.projectId
  });
}

/**
 * Returns Firebase Admin Auth instance for token verification
 */
export function auth() {
  return getAuth(getAdminApp());
}

/**
 * Creates client SDK adapter for Firestore operations when no service account is provided
 */
function createClientDbAdapter() {
  return {
    doc(path: string) {
      const d = doc(clientDb, path);
      return {
        _d: d,
        async get() {
          const snap = await getDoc(d);
          return {
            exists: snap.exists(),
            data: () => snap.data()
          };
        },
        async set(data: any, options?: { merge?: boolean }) {
          return await setDoc(d, data, options || {});
        }
      };
    },
    async runTransaction(updateFn: (tx: any) => Promise<any>) {
      return await runTransaction(clientDb, async (clientTx) => {
        const txAdapter = {
          async get(docRef: any) {
            const rawDoc = docRef._d || docRef;
            const snap = await clientTx.get(rawDoc);
            return {
              exists: snap.exists(),
              data: () => snap.data()
            };
          },
          set(docRef: any, data: any, options?: { merge?: boolean }) {
            const rawDoc = docRef._d || docRef;
            return clientTx.set(rawDoc, data, options || {});
          }
        };
        return await updateFn(txAdapter);
      });
    }
  };
}

let useAdminSdkFirestore = false;

/**
 * Singleton Firestore access for backend routes
 */
export function getServerDb(): any {
  if (hasServiceAccount()) {
    try {
      const adminApp = getAdminApp();
      const adminDb = cfg.firestoreDatabaseId
        ? getAdminFirestore(adminApp, cfg.firestoreDatabaseId)
        : getAdminFirestore(adminApp);
      useAdminSdkFirestore = true;
      return adminDb;
    } catch (err) {
      console.warn('[Server Firestore] Admin Firestore init failed, falling back to client adapter:', err);
    }
  }
  useAdminSdkFirestore = false;
  return createClientDbAdapter();
}

export function getServerTimestamp() {
  try {
    if (useAdminSdkFirestore || hasServiceAccount()) {
      return AdminFieldValue.serverTimestamp();
    }
    return clientServerTimestamp();
  } catch {
    return new Date();
  }
}
