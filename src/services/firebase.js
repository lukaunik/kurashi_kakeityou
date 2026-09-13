import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

let db = null;

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

export function initFirebase(config) {
  try {
    const app = initializeApp(config);
    db = getFirestore(app);
    if (typeof window !== "undefined") {
      window.firebaseDb = db;
      window.firebaseDoc = doc;
      window.firebaseGetDoc = getDoc;
      window.firebaseSetDoc = setDoc;
      window.currentFirebaseConfig = config;
      window.firebaseNeedsConfig = false;
    }
    return db;
  } catch (err) {
    console.error("Firebase初期化エラー:", err);
    return null;
  }
}

export function getFirebaseDb() {
  return db || (typeof window !== "undefined" ? window.firebaseDb : null);
}

export { doc, getDoc, setDoc };
