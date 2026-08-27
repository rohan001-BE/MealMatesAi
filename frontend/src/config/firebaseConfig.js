import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCpqZM6i33s692uhB6VBdnbbOW_ImROIhk",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "meal-mates-16030.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "meal-mates-16030",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "meal-mates-16030.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1064353787393",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1064353787393:web:f27f9906b79d3d3bc27ec1",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-11HTNN68NP",
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
