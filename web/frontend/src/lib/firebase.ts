import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || 'AIzaSyD_VOgjZQ1vtZAXw6eQRGhHXd0cEzdg2Ps',
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || 'prepmateai-bac14.firebaseapp.com',
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || 'prepmateai-bac14',
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || 'prepmateai-bac14.firebasestorage.app',
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || '386376214287',
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID || '1:386376214287:web:eacdba47a9c7c39211407a',
};

export const isFirebaseConfigured = () => Boolean(firebaseConfig.apiKey);

let app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured()) {
  try {
    app = initializeApp(firebaseConfig);
    _auth = getAuth(app);
    _googleProvider = new GoogleAuthProvider();
  } catch (e) {
    console.error('[PrepMate] Firebase initialization failed:', e);
  }
}

export const auth = _auth as Auth;
export const googleProvider = _googleProvider as GoogleAuthProvider;
