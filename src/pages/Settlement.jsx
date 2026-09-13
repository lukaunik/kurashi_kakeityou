import React from 'react';
import { Card, Stat, Money, MonthPick } from '../components/CommonUI.jsx';
import { p, yen, recoveryFor } from '../utils/calculations.js';

export function Settlement({ data, m, put, putMany, ym, setYm }) {
  const ex = m.expenses || {};
  const life = data.categories.reduce((s, c) => s + p(ex[c.id]), 0);
  const budget = data.categories.reduce((s, c) => s + p(c.budget), 0);
  const due = data.categories.reduce((s, c) => s + recoveryFor(c, ex), 0);
  const isPaid = m.settlementStatus
    ? m.settlementStatus === "paid"
    : due > 0 && p(m.recoveredAmount) >= due;

  const resetSettlement = () => {
    if (confirm(`${ym} の精算データをリセットしますか？`)) {
      putMany({
        expenses: {},
        recoveredAmount: 0,
        settlementStatus: "unpaid",
      });
    }
  };

  const toggleStatus = () => {
    const nextStatus = isPaid ? "unpaid" : "paid";
    const updates = { settlementStatus: nextStatus };
    if (nextStatus === "paid" && p(m.recoveredAmount) < due) {
      updates.recoveredAmount = due;
    }
    putMany(updates);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">生活費の精算</h2>
          <p className="mt-1 text-sm text-slate-500">{ym} の精算管理</p>
        </div>
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
          <MonthPick ym={ym} setYm={setYm} />
          <button
            onClick={resetSettlement}
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs sm:text-sm font-bold text-rose-600 hover:bg-rose-100"
          >
            当月リセット
          </button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="生活費合計" value={yen(life)} />
        <Stat label="予算合計" value={yen(budget)} tone="bg-slate-100" />
        <Stat
          label="回収対象額"
          value={yen(due)}
          tone="bg-indigo-600 text-white"
        />
        <Stat
          label="回収済み額"
          value={yen(m.recoveredAmount)}
          tone="bg-emerald-600 text-white"
        />
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold">パートナーからの回収ステータス</h3>
            <p className="mt-1 text-sm text-slate-500">
              当月の回収状態を管理します（月ごとに保持されます）。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={toggleStatus}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                isPaid
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {isPaid ? "✓ 回収完了" : "未回収（クリックで完了）"}
            </button>
            <button
              onClick={() => {
                putMany({
                  recoveredAmount: due,
                  settlementStatus: "paid",
                });
              }}
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-100"
            >
              全額回収をセット
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2 text-sm">
          <span className="font-medium">実回収額:</span>
          <Money
            value={m.recoveredAmount}
            onChange={(v) => put("recoveredAmount", p(v))}
          />
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 font-bold">カテゴリ別支出</h3>
        <div className="divide-y divide-slate-100">
          {data.categories.map((c) => {
            const value = p(ex[c.id]);
            const rate = c.budget
              ? Math.min((value / c.budget) * 100, 100)
              : 0;
            const diff = c.budget - value;
            return (
              <div
                key={c.id}
                className="grid grid-cols-[1fr_auto] items-center gap-3 py-3"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{c.name}</span>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-500">
                        予算 {yen(c.budget)}
                      </span>
                      {c.budget > 0 && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                            diff < 0
                              ? "bg-rose-100 text-rose-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {diff < 0
                            ? `+${yen(Math.abs(diff))} 超過`
                            : `残り ${yen(diff)}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`${
                        value > c.budget ? "bg-rose-500" : "bg-indigo-500"
                      } h-full`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    回収対象 {yen(recoveryFor(c, ex))} ・予算の
                    {(c.budget ? (value / c.budget) * 100 : 0).toFixed(0)}%
                  </p>
                </div>
                <Money
                  value={value}
                  onChange={(v) =>
                    put("expenses", { ...ex, [c.id]: p(v) })
                  }
                />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
