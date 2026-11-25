import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore, FieldValue as AdminFieldValue } from 'firebase-admin/firestore';
import { initializeApp as initializeClientApp, getApps as getClientApps } from 'firebase/app';
import {
  initializeFirestore as initializeClientFirestore,
  getFirestore as getClientFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  serverTimestamp as clientServerTimestamp,
  type QueryConstraint
} from 'firebase/firestore';
import bundledFirebaseConfig from '../../firebase-applet-config.json';

function loadFirebaseConfig(): any {
  try {
    const cwdPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(cwdPath)) {
      return JSON.parse(fs.readFileSync(cwdPath, 'utf8'));
    }
  } catch {
    // Fall back to statically bundled config
  }
  return bundledFirebaseConfig;
}

const cfg = loadFirebaseConfig();

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

async function getClientDb() {
  const appName = 'efado-server-client-fallback';
  const existing = getClientApps().find((a) => a.name === appName);
  const clientApp = existing || initializeClientApp(cfg, appName);
  const databaseId = cfg.firestoreDatabaseId || '(default)';
  try {
    return initializeClientFirestore(
      clientApp,
      {
        experimentalAutoDetectLongPolling: true,
        ignoreUndefinedProperties: true
      },
      databaseId
    );
  } catch {
    return getClientFirestore(clientApp, databaseId);
  }
}

function wrapClientQuery(
  collectionPath: string,
  filters: Array<{ field: string; op: any; value: any }> = [],
  orders: Array<{ field: string; dir: 'asc' | 'desc' }> = [],
  limitCount?: number
) {
  return {
    where(field: string, op: any, value: any) {
      return wrapClientQuery(collectionPath, [...filters, { field, op, value }], orders, limitCount);
    },
    orderBy(field: string, dir: 'asc' | 'desc' = 'asc') {
      return wrapClientQuery(collectionPath, filters, [...orders, { field, dir }], limitCount);
    },
    limit(n: number) {
      return wrapClientQuery(collectionPath, filters, orders, n);
    },
    async get() {
      const clientDb = await getClientDb();
      const colRef = collection(clientDb, collectionPath);
      const constraints: QueryConstraint[] = [];
      for (const f of filters) {
        constraints.push(where(f.field, f.op, f.value));
      }
      for (const o of orders) {
        constraints.push(orderBy(o.field, o.dir));
      }
      if (typeof limitCount === 'number' && limitCount > 0) {
        constraints.push(limit(limitCount));
      }
      const q = constraints.length ? query(colRef, ...constraints) : colRef;
      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => ({
        id: d.id,
        exists: true,
        data: () => d.data(),
        ref: {
          _path: `${collectionPath}/${d.id}`,
          async delete() {
            return await deleteDoc(d.ref);
          }
        }
      }));
      return {
        empty: snap.empty,
        size: docs.length,
        docs,
        forEach(cb: (docSnap: any) => void) {
          docs.forEach(cb);
        }
      };
    },
    async add(data: any) {
      const clientDb = await getClientDb();
      const colRef = collection(clientDb, collectionPath);
      const added = await addDoc(colRef, data);
      return { id: added.id, path: `${collectionPath}/${added.id}` };
    },
    doc(docId?: string) {
      const generatedId = docId || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      return createClientDocRef(`${collectionPath}/${generatedId}`);
    }
  };
}

function createClientDocRef(docPath: string) {
  return {
    _path: docPath,
    id: docPath.split('/').pop() || '',
    async get() {
      const clientDb = await getClientDb();
      const d = doc(clientDb, docPath);
      const snap = await getDoc(d);
      return {
        id: snap.id,
        exists: snap.exists(),
        data: () => snap.data()
      };
    },
    async set(data: any, options?: { merge?: boolean }) {
      const clientDb = await getClientDb();
      const d = doc(clientDb, docPath);
      return await setDoc(d, data, options || {});
    },
    async update(data: any) {
      const clientDb = await getClientDb();
      const d = doc(clientDb, docPath);
      return await updateDoc(d, data);
    },
    async delete() {
      const clientDb = await getClientDb();
      const d = doc(clientDb, docPath);
      return await deleteDoc(d);
    }
  };
}

/**
 * Creates lazy client SDK adapter for Firestore operations when no service account is provided
 */
function createClientDbAdapter() {
  return {
    doc(docPath: string) {
      return createClientDocRef(docPath);
    },
    collection(collectionPath: string) {
      return wrapClientQuery(collectionPath);
    },
    async runTransaction(updateFn: (tx: any) => Promise<any>) {
      const clientDb = await getClientDb();
      return await runTransaction(clientDb, async (clientTx) => {
        const txAdapter = {
          async get(docRef: any) {
            const rawDoc = docRef._d || (docRef._path ? doc(clientDb, docRef._path) : docRef);
            const snap = await clientTx.get(rawDoc);
            return {
              id: snap.id,
              exists: snap.exists(),
              data: () => snap.data()
            };
          },
          set(docRef: any, data: any, options?: { merge?: boolean }) {
            const rawDoc = docRef._d || (docRef._path ? doc(clientDb, docRef._path) : docRef);
            return clientTx.set(rawDoc, data, options || {});
          },
          update(docRef: any, data: any) {
            const rawDoc = docRef._d || (docRef._path ? doc(clientDb, docRef._path) : docRef);
            return clientTx.update(rawDoc, data);
          },
          delete(docRef: any) {
            const rawDoc = docRef._d || (docRef._path ? doc(clientDb, docRef._path) : docRef);
            return clientTx.delete(rawDoc);
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
    if (useAdminSdkFirestore) {
      return AdminFieldValue.serverTimestamp();
    }
    return clientServerTimestamp();
  } catch {
    return new Date();
  }
}
