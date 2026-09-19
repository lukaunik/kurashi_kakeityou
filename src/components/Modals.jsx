import React, { useState } from 'react';

export function CopyModal({ isOpen, onClose, onCopy }) {
  const [options, setOptions] = useState({
    incomes: true,
    bills: true,
    securities: true,
  });
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-bold">前月データをコピー</h3>
        <p className="text-sm text-slate-500">
          コピーしたい項目を選択してください。現在の入力値は上書きされます。
        </p>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={options.incomes}
              onChange={(e) =>
                setOptions({ ...options, incomes: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />{" "}
            収入項目
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={options.bills}
              onChange={(e) =>
                setOptions({ ...options, bills: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />{" "}
            固定費・支払額
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={options.securities}
              onChange={(e) =>
                setOptions({ ...options, securities: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />{" "}
            証券評価額・評価損益
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100"
          >
            キャンセル
          </button>
          <button
            onClick={() => {
              onCopy(options);
              onClose();
            }}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-indigo-700"
          >
            コピー実行
          </button>
        </div>
      </div>
    </div>
  );
}

// 安全な設定オブジェクトパーサー (new Function() を完全排除)
function safeParseConfigSnippet(input) {
  let text = input.trim();
  if (!text) return null;

  // JSON形式の場合は直接パース
  try {
    const directParsed = JSON.parse(text);
    if (directParsed && typeof directParsed === "object") {
      return directParsed;
    }
  } catch (_) {}

  // const firebaseConfig = { ... }; または { ... } の中身を抽出
  const braceStart = text.indexOf("{");
  const braceEnd = text.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
    text = text.substring(braceStart, braceEnd + 1);
  }

  // 標準的なJSON形式に変換 (キーにダブルクォートを付与、シングルクォートをダブルクォートに変換、末尾カンマ削除)
  try {
    let jsonFormatted = text
      .replace(/\/\/.*$/gm, "") // 1行コメント除去
      .replace(/\/\*[\s\S]*?\*\//g, "") // ブロックコメント除去
      .replace(/,\s*([\]}])/g, "$1") // 末尾カンマ除去
      .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":') // キーをダブルクォート
      .replace(/:\s*'([^']*)'/g, ':"$1"') // シングルクォート値をダブルクォート
      .replace(/,\s*([\]}])/g, "$1"); // 再度末尾カンマ除去
    return JSON.parse(jsonFormatted);
  } catch (_) {}

  // 正規表現による個別キー・値の確実な抽出フォールバック
  const keys = [
    "apiKey",
    "authDomain",
    "projectId",
    "storageBucket",
    "messagingSenderId",
    "appId",
    "measurementId",
  ];
  const extracted = {};
  for (const k of keys) {
    const re = new RegExp(`(?:['"]?${k}['"]?\\s*:\\s*['"]([^'"]+)['"])`, "i");
    const m = text.match(re);
    if (m && m[1]) {
      extracted[k] = m[1].trim();
    }
  }

  if (extracted.apiKey && extracted.projectId) {
    return extracted;
  }

  return null;
}

export function FirebaseConfigModal({
  isOpen,
  onClose,
  onSave,
  canClose = true,
}) {
  const [rawJson, setRawJson] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handlePasteExtract = async () => {
    try {
      setError("");
      const text = rawJson.trim();
      if (!text) return setError("設定テキストを入力してください。");

      const parsed = safeParseConfigSnippet(text);

      if (!parsed || !parsed.apiKey || !parsed.projectId) {
        return setError(
          "apiKey または projectId を検出できませんでした。Firebase Consoleの設定スニペットを確認してください。"
        );
      }

      setIsSubmitting(true);
      await onSave(parsed);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || "接続または設定の保存に失敗しました。キーの内容およびFirebase Consoleの「匿名認証」設定を確認してください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>🔥</span> Firebase クラウド接続設定
          </h3>
          {canClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Firebase Console の「プロジェクトの設定」＞「マイアプリ（ウェブ）」に表示される{" "}
          <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">
            const firebaseConfig = &#123; ... &#125;
          </code>{" "}
          の内容をそのまま貼り付けてください。
        </p>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">
            設定スニペット / JSON貼り付け
          </label>
          <textarea
            rows="7"
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            placeholder={`const firebaseConfig = {\n  apiKey: "YOUR_API_KEY",\n  authDomain: "your-app.firebaseapp.com",\n  projectId: "your-app",\n  ...\n};`}
            className="w-full font-mono text-xs rounded-xl border border-slate-300 p-3 outline-none focus:border-indigo-500 bg-slate-50"
          />
          {error && <p className="text-xs font-bold text-rose-600">{error}</p>}
        </div>

        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-900 space-y-1">
          <p className="font-bold">🔒 セキュリティ安心設計</p>
          <p>
            入力された設定はお使いのブラウザ内（LocalStorage）にのみ安全に保存され、GitHub等の公開リポジトリには送信・記録されません。
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          {canClose && (
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100"
            >
              キャンセル
            </button>
          )}
          <button
            onClick={handlePasteExtract}
            disabled={isSubmitting}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting ? "接続中..." : "接続して保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
