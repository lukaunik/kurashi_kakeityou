import React from 'react';
import { normalize } from '../utils/calculations.js';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = async () => {
    if (
      confirm(
        "クラウドのデータを初期化して再読み込みしますか？\n（事前にバックアップJSONをお持ちの場合は後から設定画面で復元できます）"
      )
    ) {
      try {
        if (
          typeof window !== "undefined" &&
          window.firebaseDb &&
          window.firebaseDoc &&
          window.firebaseSetDoc
        ) {
          const docRef = window.firebaseDoc(
            window.firebaseDb,
            "kakeibo_data",
            "main_doc"
          );
          await window.firebaseSetDoc(docRef, normalize(null));
        }
      } catch (e) {
        console.error("初期化エラー:", e);
      }
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-lg p-6 my-12 bg-white rounded-2xl border border-rose-200 shadow-xl text-center space-y-4">
          <h2 className="text-xl font-bold text-rose-600">
            ⚠️ エラーが発生しました
          </h2>
          <p className="text-sm text-slate-600">
            データの読み込みまたは画面描画中に問題が発生しました。
          </p>
          <div className="p-3 bg-rose-50 rounded-lg text-xs text-rose-800 text-left font-mono overflow-auto max-h-32 whitespace-pre-wrap">
            {this.state.error?.toString()}
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-indigo-700"
            >
              ページ再読み込み
            </button>
            <button
              onClick={this.handleReset}
              className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100"
            >
              データ初期化
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
