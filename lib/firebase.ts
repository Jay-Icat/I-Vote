import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDjMLZZ9KRX6y4Dwqizw3MaH3EonDGuEks",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "icatvote.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "icatvote",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "icatvote.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "188239743752",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:188239743752:web:38d9d214b9700bddb63abd"
};

// Initialize Firebase safely (avoid multiple initializations during SSR/HMR)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const db = getFirestore(app);

export default app;
