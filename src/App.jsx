import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  nowYM,
  blank,
  normalize,
} from './utils/calculations.js';
import { useFirebase, doc, getDoc, setDoc } from './services/FirebaseContext.jsx';
import { FirebaseConfigModal } from './components/Modals.jsx';
import { Settlement } from './pages/Settlement.jsx';
import { Cashflow } from './pages/Cashflow.jsx';
import { Analytics } from './pages/Analytics.jsx';
import { Points } from './pages/Points.jsx';
import { Settings } from './pages/Settings.jsx';

export function App() {
  const { db, user, config, isLoading: isFirebaseLoading, saveConfig, error: firebaseError } = useFirebase();
  const [data, setData] = useState(() => normalize(null));
  const [ym, setYm] = useState(nowYM);
  const [tab, setTab] = useState("settlement");
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("idle"); // 'idle' | 'saving' | 'saved' | 'error'

  const isInitialLoaded = useRef(false);
  const savedTimerRef = useRef(null);

  const handleSaveFirebaseConfig = async (cfg) => {
    try {
      await saveConfig(cfg);
      setConfigModalOpen(false);
      window.location.reload();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  // 初回Firestoreデータ取得（UIDベースマルチユーザー・旧パス読み込み完全廃止）
  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      if (isFirebaseLoading) return;

      if (!config || !db || !user) {
        if (isMounted) {
          setIsDataLoading(false);
          setConfigModalOpen(true);
        }
        return;
      }

      try {
        const docRef = doc(db, "users", user.uid, "kakeibo_data", "main");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const fetched = docSnap.data();
          if (isMounted) {
            setData(normalize(fetched));
            isInitialLoaded.current = true;
          }
        } else {
          const initialData = normalize(null);
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
          setIsDataLoading(false);
        }
      }
    };

    fetchInitialData();
    return () => {
      isMounted = false;
    };
  }, [db, user, config, isFirebaseLoading]);

  // データ更新時のFirestore非同期保存（デバウンス: 1000ms、ステータスバッジ連動）
  useEffect(() => {
    if (!isInitialLoaded.current || !db || !user) return;

    setSaveStatus("saving");

    const timer = setTimeout(async () => {
      try {
        const docRef = doc(db, "users", user.uid, "kakeibo_data", "main");
        await setDoc(docRef, data);
        setSaveStatus("saved");

        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => {
          setSaveStatus("idle");
        }, 3000);
      } catch (err) {
        console.error("Firestoreへの保存に失敗しました:", err);
        setSaveStatus("error");
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [data, db, user]);

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

  const renderSaveBadge = () => {
    if (saveStatus === "saving") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sumi-50 px-3 py-1 text-xs font-semibold text-sumi-700 animate-pulse border border-sumi-100">
          <span className="h-2 w-2 rounded-full bg-sumi-600 animate-ping" />
          保存中...
        </span>
      );
    }
    if (saveStatus === "saved") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-moss-400/20 px-3 py-1 text-xs font-semibold text-moss-500 border border-moss-400/20 transition-all">
          ✓ 保存済み
        </span>
      );
    }
    if (saveStatus === "error") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-hanko-50 px-3 py-1 text-xs font-semibold text-hanko-500 border border-hanko-400/20">
          ⚠ 保存失敗
        </span>
      );
    }
    return null;
  };

  if (isFirebaseLoading || isDataLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper text-ink-700">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sumi-100 border-t-sumi-600"></div>
        <p className="mt-4 text-base font-bold font-display tracking-widest">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 safe-bottom">
      {/* バックアップリマインダー */}
      {showBackupAlert && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-hanko-400/20 bg-hanko-50 p-4 text-sm text-hanko-600">
          <span className="font-medium">
            ⚠️ データのバックアップが1週間以上行われていません。設定画面からJSON保存をおすすめします。
          </span>
          <button
            onClick={() => setTab("settings")}
            className="font-bold underline ml-3 flex-shrink-0"
          >
            設定へ
          </button>
        </div>
      )}

      <header className="mb-8 border-b border-ink-900/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-sumi-700 tracking-wider">
            くらし家計帳
          </h1>
          <div className="flex items-center gap-3">
            {renderSaveBadge()}
          </div>
        </div>

        <nav className="flex items-center gap-6 overflow-x-auto max-w-full">
          {tabs.map(([id, label]) => {
            const isActive = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`whitespace-nowrap pb-3 text-sm sm:text-base font-bold transition-all relative ${
                  isActive
                    ? "text-sumi-700"
                    : "text-ink-500 hover:text-ink-900"
                }`}
              >
                {label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sumi-600 rounded-full" />
                )}
              </button>
            );
          })}
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
        canClose={!!db}
      />
    </div>
  );
}
