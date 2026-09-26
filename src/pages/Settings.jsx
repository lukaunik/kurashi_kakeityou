import React, { useRef } from 'react';
import { Card, Text, Money, Decimal } from '../components/CommonUI.jsx';
import {
  n,
  p,
  nowYM,
  normalize,
  billsFor,
  generateId,
  escapeCSV,
} from '../utils/calculations.js';
import { useFirebase } from '../services/FirebaseContext.jsx';

function Master({ title, headers, items, cells, onAdd, onRemove }) {
  return (
    <Card className="overflow-hidden p-0 border border-ink-900/10">
      <div className="flex items-center justify-between p-4 border-b border-ink-900/10 bg-paper-100/50">
        <h3 className="font-bold text-ink-900 text-sm">{title}</h3>
        <button
          onClick={onAdd}
          className="rounded-xl bg-sumi-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-sumi-700 transition-all"
        >
          ＋ 追加
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-xs border-collapse">
          <thead className="bg-paper-100 text-ink-700 font-bold border-b border-ink-900/10">
            <tr>
              {headers.map((x) => (
                <th key={x} className="px-4 py-3 text-left font-bold">
                  {x}
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-900/5">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-sumi-50/50 transition-colors">
                {cells(item).map((cell, i) => (
                  <td key={i} className="px-4 py-2">
                    {cell}
                  </td>
                ))}
                <td className="px-4 text-right">
                  <button
                    onClick={() => {
                      if (confirm("この項目をマスタから削除しますか？"))
                        onRemove(item.id);
                    }}
                    className="rounded-xl px-3 py-1.5 text-xs font-bold text-hanko-500 hover:bg-hanko-50 transition-all"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function Settings({ data, setData, openConfigModal }) {
  const ref = useRef(null);

  const edit = (key, id, field, value) => {
    const isString = ["name", "account", "recovery"].includes(field);
    setData((d) => {
      if (key === "accounts" && field === "name") {
        const oldAcc = d.accounts.find((x) => x.id === id);
        const oldName = oldAcc?.name;
        return {
          ...d,
          accounts: d.accounts.map((x) =>
            x.id === id ? { ...x, name: value } : x
          ),
          bills: oldName
            ? d.bills.map((b) =>
                b.account === oldName ? { ...b, account: value } : b
              )
            : d.bills,
        };
      }
      return {
        ...d,
        [key]: d[key].map((x) =>
          x.id === id ? { ...x, [field]: isString ? value : n(value) } : x
        ),
      };
    });
  };

  const add = (key, value) =>
    setData((d) => ({
      ...d,
      [key]: [...d[key], { ...value, id: generateId(key) }],
    }));
  const remove = (key, id) =>
    setData((d) => ({
      ...d,
      [key]: d[key].filter((x) => x.id !== id),
    }));

  const exportJSON = () => {
    const updatedData = {
      ...data,
      settings: { ...data.settings, lastBackupDate: new Date().toISOString() },
    };
    setData(updatedData);
    const blob = new Blob(
      [
        JSON.stringify(
          { app: "くらし家計帳", version: 8, data: updatedData },
          null,
          2
        ),
      ],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `kakei-backup-${nowYM()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    let csv = "\uFEFF年月,区分,項目名,金額/評価額,メモ/詳細\n";
    Object.entries(data.monthly)
      .sort()
      .forEach(([ym, m]) => {
        (m.incomeItems || []).forEach((i) => {
          csv += `${escapeCSV(ym)},${escapeCSV("収入")},${escapeCSV(i.name)},${i.amount},""\n`;
        });
        billsFor(data, m).forEach((b) => {
          csv += `${escapeCSV(ym)},${escapeCSV("固定費")},${escapeCSV(b.name)},${b.amount},${escapeCSV(`口座:${b.account}`)}\n`;
        });
        (m.tempExpenses || []).forEach((t) => {
          csv += `${escapeCSV(ym)},${escapeCSV("臨時出費")},${escapeCSV(t.name)},${t.amount},""\n`;
        });
        (m.securities || []).forEach((s) => {
          csv += `${escapeCSV(ym)},${escapeCSV("証券")},${escapeCSV(s.name)},${s.value},${escapeCSV(`損益:${s.profit}`)}\n`;
        });
      });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `kakei-export-${nowYM()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const importJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (x) => {
      try {
        const parsed = JSON.parse(x.target.result),
          value = parsed.data || parsed;
        if (!value || typeof value !== "object") throw Error();
        if (confirm("現在のデータを復元内容で置き換えます。よろしいですか？")) {
          setData(normalize(value));
          alert("データを復元しました。");
        }
      } catch {
        alert("JSONファイルを読み込めませんでした。");
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const { db } = useFirebase();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink-900 tracking-wide">設定・マスタ管理</h2>
        <p className="mt-1 text-xs text-ink-500">
          マスタデータ、起算日、エクスポートを管理します。
        </p>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-ink-900 text-sm flex items-center gap-2">
              <span>Firebase クラウド同期</span>
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${
                  db ? "bg-moss-500" : "bg-hanko-500"
                }`}
              ></span>
            </h3>
            <p className="mt-1 text-xs text-ink-500">
              {db
                ? "クラウド（Firestore）に接続されています。"
                : "Firebase設定が未設定または初期化エラーです。"}
            </p>
          </div>
          <button
            onClick={openConfigModal}
            className="rounded-xl border border-ink-900/15 bg-white px-3.5 py-2 text-xs font-bold text-ink-700 hover:bg-paper-100 shadow-sm transition-all"
          >
            設定を変更
          </button>
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-ink-900 text-sm">バックアップ・データ出力</h3>
        <p className="mt-1 text-xs text-ink-500">
          定期的なバックアップを推奨します（CSV出力はExcel等で閲覧可能）。
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <button
            onClick={exportJSON}
            className="rounded-xl bg-sumi-600 px-4 py-2.5 min-h-[44px] text-xs font-bold text-white shadow-sm hover:bg-sumi-700 transition-all"
          >
            JSONバックアップを保存
          </button>
          <button
            onClick={exportCSV}
            className="rounded-xl bg-moss-500 px-4 py-2.5 min-h-[44px] text-xs font-bold text-white shadow-sm hover:bg-moss-600 transition-all"
          >
            CSVエクスポート
          </button>
          <button
            onClick={() => ref.current?.click()}
            className="rounded-xl border border-ink-900/15 bg-white px-4 py-2.5 min-h-[44px] text-xs font-bold text-ink-700 hover:bg-paper-100 shadow-sm transition-all"
          >
            JSON復元
          </button>
          <input
            ref={ref}
            type="file"
            accept=".json,application/json"
            onChange={importJSON}
            className="hidden"
          />
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-ink-900 text-sm">起算日設定</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold text-ink-700">
            精算の起算日
            <div className="mt-1.5 flex items-center">
              <Money
                small
                value={data.settings.settlementStart}
                onChange={(v) =>
                  setData((d) => ({
                    ...d,
                    settings: { ...d.settings, settlementStart: p(v) },
                  }))
                }
              />
              <span className="ml-2 text-xs font-bold text-ink-500">日</span>
            </div>
          </label>
          <label className="text-xs font-bold text-ink-700">
            資金繰りの起算日
            <div className="mt-1.5 flex items-center">
              <Money
                small
                value={data.settings.cashStart}
                onChange={(v) =>
                  setData((d) => ({
                    ...d,
                    settings: { ...d.settings, cashStart: p(v) },
                  }))
                }
              />
              <span className="ml-2 text-xs font-bold text-ink-500">日</span>
            </div>
          </label>
        </div>
      </Card>

      <Master
        title="カテゴリマスタ・回収設定"
        headers={["名称", "予算", "回収方法", "固定回収額"]}
        items={data.categories}
        cells={(c) => [
          <Text
            key="name"
            value={c.name}
            onChange={(v) => edit("categories", c.id, "name", v)}
          />,
          <Money
            key="budget"
            small
            value={c.budget}
            onChange={(v) => edit("categories", c.id, "budget", v)}
          />,
          <select
            key="recovery"
            value={c.recovery}
            onChange={(e) => edit("categories", c.id, "recovery", e.target.value)}
            className="rounded-xl border border-ink-900/15 bg-white px-3 py-2 text-xs font-bold text-ink-900 outline-none focus:border-sumi-600 focus:ring-2 focus:ring-sumi-100 transition-all cursor-pointer"
          >
            <option value="half">折半（50%）</option>
            <option value="full">全額（100%）</option>
            <option value="fixed">固定額回収</option>
          </select>,
          <Money
            key="recoveryAmount"
            small
            value={c.recoveryAmount}
            onChange={(v) => edit("categories", c.id, "recoveryAmount", v)}
          />,
        ]}
        onAdd={() =>
          add("categories", {
            name: "新しいカテゴリ",
            budget: 0,
            recovery: "half",
            recoveryAmount: 0,
          })
        }
        onRemove={(id) => remove("categories", id)}
      />

      <Master
        title="固定費マスタ"
        headers={["名称", "標準予算", "支払日", "引落口座"]}
        items={data.bills}
        cells={(b) => [
          <Text
            key="name"
            value={b.name}
            onChange={(v) => edit("bills", b.id, "name", v)}
          />,
          <Money
            key="budget"
            small
            value={b.budget}
            onChange={(v) => edit("bills", b.id, "budget", v)}
          />,
          <Money
            key="day"
            small
            value={b.day}
            onChange={(v) => edit("bills", b.id, "day", v)}
          />,
          <select
            key="account"
            value={b.account}
            onChange={(e) => edit("bills", b.id, "account", e.target.value)}
            className="rounded-xl border border-ink-900/15 bg-white px-3 py-2 text-xs font-bold text-ink-900 outline-none focus:border-sumi-600 focus:ring-2 focus:ring-sumi-100 transition-all cursor-pointer"
          >
            {data.accounts.map((a) => (
              <option key={a.id} value={a.name}>
                {a.name}
              </option>
            ))}
          </select>,
        ]}
        onAdd={() =>
          add("bills", {
            name: "新しい支出",
            budget: 0,
            day: 15,
            account: data.accounts[0]?.name || "",
          })
        }
        onRemove={(id) => remove("bills", id)}
      />

      <Master
        title="口座マスタ"
        headers={["名称", "初期残高"]}
        items={data.accounts}
        cells={(a) => [
          <Text
            key="name"
            value={a.name}
            onChange={(v) => edit("accounts", a.id, "name", v)}
          />,
          <Money
            key="balance"
            small
            value={a.balance}
            onChange={(v) => edit("accounts", a.id, "balance", v)}
          />,
        ]}
        onAdd={() => add("accounts", { name: "新しい口座", balance: 0 })}
        onRemove={(id) => remove("accounts", id)}
      />

      <Master
        title="ポイント・マイルマスタ"
        headers={["名称", "通常交換倍率", "キャンペーン交換倍率"]}
        items={data.points}
        cells={(x) => [
          <Text
            key="name"
            value={x.name}
            onChange={(v) => edit("points", x.id, "name", v)}
          />,
          <Decimal
            key="regularRate"
            value={x.regularRate}
            onChange={(v) => edit("points", x.id, "regularRate", v)}
          />,
          <Decimal
            key="campaignRate"
            value={x.campaignRate}
            onChange={(v) => edit("points", x.id, "campaignRate", v)}
          />,
        ]}
        onAdd={() =>
          add("points", { name: "新しいポイント", regularRate: 1, campaignRate: 1 })
        }
        onRemove={(id) => remove("points", id)}
      />
    </div>
  );
}
