import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredFirebaseConfig, initFirebase, doc, getDoc, setDoc } from './firebase.js';

const FirebaseContext = createContext({
  db: null,
  auth: null,
  user: null,
  config: null,
  isLoading: true,
  error: null,
  saveConfig: async () => {},
  reinitialize: async () => {},
});

export function FirebaseProvider({ children }) {
  const [firebaseState, setFirebaseState] = useState({
    db: null,
    auth: null,
    user: null,
    config: null,
    isLoading: true,
    error: null,
  });

  const initialize = async (customConfig = null) => {
    try {
      setFirebaseState((s) => ({ ...s, isLoading: true, error: null }));
      const config = customConfig || getStoredFirebaseConfig();
      if (!config) {
        setFirebaseState({
          db: null,
          auth: null,
          user: null,
          config: null,
          isLoading: false,
          error: null,
        });
        return null;
      }

      const res = await initFirebase(config);
      if (res && res.db && res.user) {
        setFirebaseState({
          db: res.db,
          auth: res.auth,
          user: res.user,
          config,
          isLoading: false,
          error: null,
        });
        return res;
      } else {
        throw new Error("Firebaseの初期化または匿名認証に失敗しました。");
      }
    } catch (err) {
      console.error("FirebaseContext Init Error:", err);
      setFirebaseState({
        db: null,
        auth: null,
        user: null,
        config: customConfig || getStoredFirebaseConfig(),
        isLoading: false,
        error: err.message || "接続エラー",
      });
      return null;
    }
  };

  useEffect(() => {
    initialize();
  }, []);

  const saveConfig = async (newConfig) => {
    localStorage.setItem("kakeibo_firebase_config", JSON.stringify(newConfig));
    const res = await initialize(newConfig);
    if (!res) {
      throw new Error("入力されたFirebase設定への接続に失敗しました。キーの内容および「匿名認証」の設定をご確認ください。");
    }
    return res;
  };

  return (
    <FirebaseContext.Provider
      value={{
        ...firebaseState,
        saveConfig,
        reinitialize: initialize,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  return useContext(FirebaseContext);
}

export { doc, getDoc, setDoc };
