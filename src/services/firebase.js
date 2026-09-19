import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

let db = null;
let auth = null;
let currentUser = null;

export function getStoredFirebaseConfig() {
  // 1. LocalStorage の保存済み設定を最優先
  try {
    const stored = localStorage.getItem("kakeibo_firebase_config");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.apiKey) return parsed;
    }
  } catch (e) {
    console.error("Failed to parse stored firebase config:", e);
  }

  // 2. window.FIREBASE_CONFIG のフォールバック
  if (
    typeof window !== "undefined" &&
    window.FIREBASE_CONFIG &&
    window.FIREBASE_CONFIG.apiKey &&
    window.FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY"
  ) {
    return window.FIREBASE_CONFIG;
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
      try {
        const userCred = await signInAnonymously(auth);
        user = userCred.user;
      } catch (authErr) {
        console.error("Firebase 匿名認証エラー:", authErr);
        if (authErr.code === "auth/operation-not-allowed") {
          throw new Error("Firebase Console で『匿名認証 (Anonymous)』が有効になっていません。Authentication ＞ Sign-in method で『匿名』を有効にしてください。");
        }
        throw new Error(`Firebase 認証エラー: ${authErr.message || authErr}`);
      }
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
    console.error("Firebase初期化/接続エラー:", err);
    throw err;
  }
}

export function getFirebaseDb() {
  return db || (typeof window !== "undefined" ? window.firebaseDb : null);
}

export function getCurrentUser() {
  return currentUser || (typeof window !== "undefined" ? window.firebaseUser : null);
}

export { doc, getDoc, setDoc };
