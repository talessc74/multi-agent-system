import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  browserSessionPersistence,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

// Providers
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');

// Session persistence — default: session only
// Pass true para "lembrar de mim" (local persistence)
export const setSessionPersistence = async (remember: boolean) => {
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
};

// Auth functions
export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);

export const loginWithApple = () => signInWithPopup(auth, appleProvider);

export const getGoogleRedirectResult = () => getRedirectResult(auth);

export const loginWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const registerWithEmail = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);
