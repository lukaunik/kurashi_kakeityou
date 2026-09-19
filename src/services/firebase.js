import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

let db = null;
let auth = null;
let currentUser = null;

export function getStoredFirebaseConfig() {
  if (
    typeof window !== "undefined" &&
    window.FIREBASE_CONFIG &&
    window.FIREBASE_CONFIG.apiKey &&
    window.FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY"
  ) {
    return window.FIREBASE_CONFIG;
  }
  try {
    const stored = localStorage.getItem("kakeibo_firebase_config");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.apiKey) return parsed;
    }
  } catch (e) {
    console.error("Failed to parse stored firebase config:", e);
  }
  return null;
}

export async function initFirebase(config) {
  try {
    const app = getApps().length === 0 ? initializeApp(config) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);

    let user = auth.currentUser;
    if (!user) {
      const userCred = await signInAnonymously(auth);
      user = userCred.user;
    }
    currentUser = user;

    if (typeof window !== "undefined") {
      window.firebaseDb = db;
      window.firebaseAuth = auth;
      window.firebaseUser = user;
      window.firebaseDoc = doc;
      window.firebaseGetDoc = getDoc;
      window.firebaseSetDoc = setDoc;
      window.currentFirebaseConfig = config;
      window.firebaseNeedsConfig = false;
    }
    return { db, auth, user };
  } catch (err) {
    console.error("Firebase初期化/認証エラー:", err);
    return null;
  }
}

export function getFirebaseDb() {
  return db || (typeof window !== "undefined" ? window.firebaseDb : null);
}

export function getCurrentUser() {
  return currentUser || (typeof window !== "undefined" ? window.firebaseUser : null);
}

export { doc, getDoc, setDoc };
