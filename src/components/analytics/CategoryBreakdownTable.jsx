import React from 'react';
import { Card } from '../CommonUI.jsx';
import { yen, signedYen } from '../../utils/calculations.js';

export function CategoryBreakdownTable({ categoryRows, mode }) {
  return (
    <Card className="overflow-hidden p-0 border border-ink-900/10">
      <div className="p-4 border-b border-ink-900/10 bg-paper-100/50">
        <h3 className="font-bold text-ink-900 text-sm">カテゴリ別精算実績</h3>
        <p className="mt-0.5 text-xs text-ink-500">
          {mode === "month"
            ? "当月のカテゴリ別予算と実績の比較です。"
            : "選択期間におけるカテゴリごとの予算、合計、平均、達成率です。"}
        </p>
      </div>

      {/* PC用テーブル */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-paper-100 text-ink-700 font-bold border-b border-ink-900/10">
            <tr>
              <th className="px-4 py-3 text-left font-bold">カテゴリ</th>
              <th className="px-4 py-3 text-right font-bold">予算</th>
              <th className="px-4 py-3 text-right font-bold">実績合計</th>
              {mode !== "month" && <th className="px-4 py-3 text-right font-bold">月平均</th>}
              {mode === "month" && <th className="px-4 py-3 text-right font-bold">前月差</th>}
              {(mode === "month" || mode === "year") && (
                <th className="px-4 py-3 text-right font-bold">前年差</th>
              )}
              <th className="px-4 py-3 text-right font-bold">達成率</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-900/5">
            {categoryRows.map((c) => (
              <tr key={c.id} className="hover:bg-sumi-50/50 transition-colors">
                <td className="px-4 py-3 font-bold text-ink-900">{c.name}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-500">{yen(c.budget)}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-ink-900">{yen(c.amount)}</td>
                {mode !== "month" && (
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-500">{yen(c.average)}</td>
                )}
                {mode === "month" && (
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-xs">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded font-semibold ${
                        c.diffPrev <= 0
                          ? "text-moss-500 bg-moss-400/15"
                          : "text-hanko-500 bg-hanko-50"
                      }`}
                    >
                      {signedYen(c.diffPrev)}
                    </span>
                  </td>
                )}
                {(mode === "month" || mode === "year") && (
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-xs">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded font-semibold ${
                        c.diffPrevYear <= 0
                          ? "text-moss-500 bg-moss-400/15"
                          : "text-hanko-500 bg-hanko-50"
                      }`}
                    >
                      {signedYen(c.diffPrevYear)}
                    </span>
                  </td>
                )}
                <td className="px-4 py-3 text-right font-mono tabular-nums font-bold">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs ${
                      c.rate > 100
                        ? "bg-hanko-50 text-hanko-500 border border-hanko-400/20"
                        : c.rate === 0
                        ? "bg-paper-100 text-ink-500"
                        : "bg-moss-400/20 text-moss-500"
                    }`}
                  >
                    {c.rate.toFixed(0)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* スマホ用カード表示 */}
      <div className="sm:hidden divide-y divide-ink-900/5">
        {categoryRows.map((c) => (
          <div key={c.id} className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-ink-900 text-sm">{c.name}</span>
              <span
                className={`rounded px-2.5 py-0.5 text-xs font-bold font-mono tabular-nums ${
                  c.rate > 100
                    ? "bg-hanko-50 text-hanko-500 border border-hanko-400/20"
                    : c.rate === 0
                    ? "bg-paper-100 text-ink-500"
                    : "bg-moss-400/20 text-moss-500"
                }`}
              >
                達成率 {c.rate.toFixed(0)}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono tabular-nums">
              <div className="bg-paper-100/60 p-2 rounded-xl border border-ink-900/5">
                <span className="text-ink-500 block text-[10px]">設定予算</span>
                <strong className="text-ink-700 text-xs">{yen(c.budget)}</strong>
              </div>
              <div className="bg-paper-100/60 p-2 rounded-xl border border-ink-900/5">
                <span className="text-ink-500 block text-[10px]">
                  {mode === "month" ? "今月実績" : "実績合計"}
                </span>
                <strong className="text-ink-900 text-xs font-bold">{yen(c.amount)}</strong>
              </div>

              {mode !== "month" && (
                <div className="bg-paper-100/60 p-2 rounded-xl border border-ink-900/5">
                  <span className="text-ink-500 block text-[10px]">月平均</span>
                  <strong className="text-ink-700 text-xs">{yen(c.average)}</strong>
                </div>
              )}

              {mode === "month" && (
                <div className="bg-paper-100/60 p-2 rounded-xl border border-ink-900/5">
                  <span className="text-ink-500 block text-[10px]">前月差</span>
                  <strong className={c.diffPrev <= 0 ? "text-moss-500 text-xs" : "text-hanko-500 text-xs"}>
                    {signedYen(c.diffPrev)}
                  </strong>
                </div>
              )}

              {(mode === "month" || mode === "year") && (
                <div className="bg-paper-100/60 p-2 rounded-xl border border-ink-900/5">
                  <span className="text-ink-500 block text-[10px]">前年差</span>
                  <strong className={c.diffPrevYear <= 0 ? "text-moss-500 text-xs" : "text-hanko-500 text-xs"}>
                    {signedYen(c.diffPrevYear)}
                  </strong>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
