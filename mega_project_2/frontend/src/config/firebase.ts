import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Firebase / Firestore Configuration
 * Reads configuration from Vite environment variables or defaults gracefully
 * for academic presentation and offline demo modes without exposing secrets.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoAcademicProjectKey2026',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'apana-benefits-welfare.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'apana-benefits-welfare',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'apana-benefits-welfare.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1029384756',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1029384756:web:abcdef1234567890'
};

let app: FirebaseApp;
let db: Firestore | null = null;
let isFirestoreAvailable = false;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  isFirestoreAvailable = true;
} catch (error) {
  console.warn('[Firebase] Firestore initialized with offline fallback mode:', error);
  // Create minimal initialized app
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  try {
    db = getFirestore(app);
    isFirestoreAvailable = true;
  } catch (innerError) {
    console.warn('[Firebase] Offline mode active:', innerError);
  }
}

export { app, db, isFirestoreAvailable };
