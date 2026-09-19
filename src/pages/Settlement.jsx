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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 tracking-wide">生活費の精算</h2>
          <p className="mt-1 text-xs text-ink-500">{ym} の精算管理</p>
        </div>
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
          <MonthPick ym={ym} setYm={setYm} />
          <button
            onClick={resetSettlement}
            className="rounded-xl border border-hanko-400/20 bg-hanko-50 px-3.5 py-2.5 min-h-[44px] text-xs font-bold text-hanko-600 hover:bg-hanko-50/80 transition-all"
          >
            当月リセット
          </button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="生活費合計" value={yen(life)} />
        <Stat label="予算合計" value={yen(budget)} tone="border border-ink-900/10 bg-paper-100/50 text-ink-900" />
        <Stat
          label="回収対象額"
          value={yen(due)}
          tone="bg-sumi-700 text-white shadow-sm"
        />
        <Stat
          label="回収済み額"
          value={yen(m.recoveredAmount)}
          tone="bg-moss-500 text-white shadow-sm"
        />
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-ink-900 text-sm">パートナーからの回収ステータス</h3>
            <p className="mt-0.5 text-xs text-ink-500">
              当月の回収状態を管理します（月ごとに保持されます）。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={toggleStatus}
              className={`rounded-xl px-4 py-2.5 min-h-[44px] text-xs font-bold transition-all ${
                isPaid
                  ? "bg-moss-500 text-white shadow-sm"
                  : "bg-paper-100 text-ink-700 border border-ink-900/10 hover:bg-paper-100/80"
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
              className="rounded-xl border border-sumi-600/30 bg-sumi-50 px-3.5 py-2.5 min-h-[44px] text-xs font-bold text-sumi-700 hover:bg-sumi-100/50 transition-all"
            >
              全額回収をセット
            </button>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-end gap-3 text-xs pt-3 border-t border-ink-900/5">
          <span className="font-bold text-ink-700">実回収額:</span>
          <Money
            value={m.recoveredAmount}
            onChange={(v) => put("recoveredAmount", p(v))}
          />
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 font-bold text-ink-900 text-sm">カテゴリ別支出</h3>
        <div className="divide-y divide-ink-900/5">
          {data.categories.map((c) => {
            const value = p(ex[c.id]);
            const rate = c.budget
              ? Math.min((value / c.budget) * 100, 100)
              : 0;
            const diff = c.budget - value;
            return (
              <div
                key={c.id}
                className="grid grid-cols-[1fr_auto] items-center gap-4 py-3.5"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-ink-900 text-sm">{c.name}</span>
                    <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
                      <span className="text-ink-500">
                        予算 {yen(c.budget)}
                      </span>
                      {c.budget > 0 && (
                        <span
                          className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                            diff < 0
                              ? "bg-hanko-50 text-hanko-500 border border-hanko-400/20"
                              : "bg-moss-400/20 text-moss-500"
                          }`}
                        >
                          {diff < 0
                            ? `+${yen(Math.abs(diff))} 超過`
                            : `残り ${yen(diff)}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-paper-100">
                    <div
                      className={`${
                        value > c.budget ? "bg-hanko-500" : "bg-sumi-600"
                      } h-full transition-all duration-300`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-ink-500 font-mono tabular-nums">
                    回収対象 {yen(recoveryFor(c, ex))} ・ 予算の
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
