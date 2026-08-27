import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAhqdttQjk8YEaYzXboBmVOF83ATK29Te4",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "meal-mates-16030.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "meal-mates-16030",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "meal-mates-16030.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "466012209013",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:466012209013:web:6ae368531d05cef29e9d3c",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-Y8N33GLFCS",
};

let app = null;
let auth = null;
let provider = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account",
  });
} catch (e) {
  console.warn("Firebase client initialization warning:", e);
}

export { auth, provider, signInWithPopup };
