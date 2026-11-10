import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import cfg from '../../firebase-applet-config.json';

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
 * Singleton Firebase Admin Firestore access for backend routes
 */
export function getServerDb() {
  try {
    const adminApp = getAdminApp();
    return getFirestore(adminApp, cfg.firestoreDatabaseId);
  } catch (err) {
    console.error('[Server Firestore] Failed to initialize Firebase Admin Firestore:', err);
    return null;
  }
}

export function getServerTimestamp() {
  try {
    return FieldValue.serverTimestamp();
  } catch {
    return new Date();
  }
}
