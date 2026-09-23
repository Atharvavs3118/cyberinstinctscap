import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import firebaseConfigJson from '../../../firebase-applet-config.json';

// Build Firebase configuration preferring Vite env variables, falling back to firebase-applet-config.json
const env = (import.meta as any).env || {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
};

const databaseId = env.VITE_FIREBASE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId;

// Initialize Firebase App
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Authentication
export const auth: Auth = getAuth(app);

// Initialize Firestore with experimentalForceLongPolling to avoid WebSocket connection drops in sandboxes/proxies
let firestoreInstance: Firestore;
try {
  const targetDb =
    databaseId && databaseId !== '(default)' && databaseId.trim() !== ''
      ? databaseId
      : undefined;

  firestoreInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  }, targetDb);
} catch (e) {
  try {
    if (databaseId && databaseId !== '(default)' && databaseId.trim() !== '') {
      firestoreInstance = getFirestore(app, databaseId);
    } else {
      firestoreInstance = getFirestore(app);
    }
  } catch (err) {
    console.warn('Fallback to default getFirestore:', err);
    firestoreInstance = getFirestore(app);
  }
}
export const db: Firestore = firestoreInstance;

// Initialize Firebase Storage
export const storage: FirebaseStorage = getStorage(app);

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

