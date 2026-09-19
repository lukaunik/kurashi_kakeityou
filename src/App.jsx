import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  nowYM,
  blank,
  normalize,
} from './utils/calculations.js';
import {
  getStoredFirebaseConfig,
  initFirebase,
  doc,
  getDoc,
  setDoc,
} from './services/firebase.js';
import { FirebaseConfigModal } from './components/Modals.jsx';
import { Settlement } from './pages/Settlement.jsx';
import { Cashflow } from './pages/Cashflow.jsx';
import { Analytics } from './pages/Analytics.jsx';
import { Points } from './pages/Points.jsx';
import { Settings } from './pages/Settings.jsx';

export function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(() => normalize(null));
  const [ym, setYm] = useState(nowYM);
  const [tab, setTab] = useState("settlement");
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const isInitialLoaded = useRef(false);

  const handleSaveFirebaseConfig = async (cfg) => {
    try {
      localStorage.setItem("kakeibo_firebase_config", JSON.stringify(cfg));
      const res = await initFirebase(cfg);
      if (!res || !res.db || !res.user) {
        throw new Error("Firebaseへの接続または匿名認証に失敗しました。設定とFirebase Console『匿名』認証の有効化をご確認ください。");
      }
      setConfigModalOpen(false);
      window.location.reload();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  // 初回Firestoreデータ取得（UIDベースマルチユーザー対応）
  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      try {
        const config = getStoredFirebaseConfig();
        if (!config) {
          if (isMounted) {
            setIsLoading(false);
            setConfigModalOpen(true);
          }
          return;
        }

        const res = await initFirebase(config);
        if (!res || !res.db || !res.user) {
          console.error("Firebase初期化/認証失敗");
          if (isMounted) {
            setIsLoading(false);
            setConfigModalOpen(true);
          }
          return;
        }

        const { db, user } = res;
        const docRef = doc(db, "users", user.uid, "kakeibo_data", "main");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const fetched = docSnap.data();
          if (isMounted) {
            setData(normalize(fetched));
            isInitialLoaded.current = true;
          }
        } else {
          // 旧共有ドキュメント（kakeibo_data/main_doc）からのマイグレーションチェック
          let initialData = normalize(null);
          try {
            const legacyRef = doc(db, "kakeibo_data", "main_doc");
            const legacySnap = await getDoc(legacyRef);
            if (legacySnap.exists()) {
              initialData = normalize(legacySnap.data());
            }
          } catch (e) {
            console.log("旧データチェックをスキップ:", e);
          }

          await setDoc(docRef, initialData);
          if (isMounted) {
            setData(initialData);
            isInitialLoaded.current = true;
          }
        }
      } catch (err) {
        console.error("Firestoreからのデータ取得に失敗しました:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  // データ更新時のFirestore非同期保存（デバウンス: 1000ms、UIDベースパス）
  useEffect(() => {
    if (!isInitialLoaded.current) return;
    const currentDb = window.firebaseDb;
    const currentUser = window.firebaseUser;
    if (!currentDb || !currentUser) return;

    const timer = setTimeout(async () => {
      try {
        const docRef = doc(currentDb, "users", currentUser.uid, "kakeibo_data", "main");
        await setDoc(docRef, data);
      } catch (err) {
        console.error("Firestoreへの保存に失敗しました:", err);
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [data]);

  // バックアップ警告判定（7日以上経過）
  const showBackupAlert = useMemo(() => {
    if (!data.settings?.lastBackupDate) return true;
    const diffDays =
      (new Date() - new Date(data.settings.lastBackupDate)) /
      (1000 * 60 * 60 * 24);
    return diffDays > 7;
  }, [data.settings?.lastBackupDate]);

  const m = useMemo(
    () => ({
      ...blank(),
      ...(data.monthly[ym] || {}),
    }),
    [data.monthly, ym]
  );

  const put = (field, value) => {
    setData((d) => ({
      ...d,
      monthly: {
        ...d.monthly,
        [ym]: {
          ...blank(),
          ...(d.monthly[ym] || {}),
          [field]: value,
        },
      },
    }));
  };

  const putMany = (obj) => {
    setData((d) => ({
      ...d,
      monthly: {
        ...d.monthly,
        [ym]: {
          ...blank(),
          ...(d.monthly[ym] || {}),
          ...obj,
        },
      },
    }));
  };

  const tabs = [
    ["settlement", "生活費の精算"],
    ["cashflow", "個人資金管理"],
    ["analytics", "分析"],
    ["points", "ポイント・マイル"],
    ["settings", "設定"],
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-600">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
        <p className="mt-4 text-base font-bold">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 safe-bottom">
      {/* バックアップリマインダー */}
      {showBackupAlert && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <span>
            ⚠️ データのバックアップが1週間以上行われていません。設定画面からJSON保存をおすすめします。
          </span>
          <button
            onClick={() => setTab("settings")}
            className="font-bold underline ml-2"
          >
            設定へ
          </button>
        </div>
      )}

      <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-indigo-600">くらし家計帳</h1>
        <nav className="flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-200/60 p-1 max-w-full">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`whitespace-nowrap flex-shrink-0 rounded-lg px-3 py-2 text-sm font-bold transition-all ${
                tab === id
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {tab === "settlement" && (
          <Settlement
            data={data}
            m={m}
            put={put}
            putMany={putMany}
            ym={ym}
            setYm={setYm}
          />
        )}
        {tab === "cashflow" && (
          <Cashflow
            data={data}
            m={m}
            put={put}
            putMany={putMany}
            ym={ym}
            setYm={setYm}
          />
        )}
        {tab === "analytics" && (
          <Analytics data={data} ym={ym} setYm={setYm} />
        )}
        {tab === "points" && <Points data={data} setData={setData} />}
        {tab === "settings" && (
          <Settings
            data={data}
            setData={setData}
            openConfigModal={() => setConfigModalOpen(true)}
          />
        )}
      </main>

      <FirebaseConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        onSave={handleSaveFirebaseConfig}
        canClose={!!(typeof window !== "undefined" && window.firebaseDb)}
      />
    </div>
  );
}
