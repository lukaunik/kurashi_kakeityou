import React from 'react';
import { Card } from '../CommonUI.jsx';
import { yen, signedYen } from '../../utils/calculations.js';

export function BillBreakdownTable({ billRows, mode }) {
  return (
    <Card className="overflow-hidden p-0 border border-ink-900/10">
      <div className="p-4 border-b border-ink-900/10 bg-paper-100/50">
        <h3 className="font-bold text-ink-900 text-sm">固定費・定期引き落とし 詳細分析</h3>
        <p className="mt-0.5 text-xs text-ink-500">
          {mode === "month"
            ? "当月の固定費・定期引き落としの予定/実績と予算達成状況です。"
            : "選択期間における項目ごとの設定予算、実績累計、月平均、達成率です。"}
        </p>
      </div>

      {/* PC用テーブル */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-paper-100 text-ink-700 font-bold border-b border-ink-900/10">
            <tr>
              <th className="px-4 py-3 text-left font-bold">項目名</th>
              <th className="px-4 py-3 text-left font-bold">引落口座</th>
              <th className="px-4 py-3 text-right font-bold">設定予算 (月額)</th>
              <th className="px-4 py-3 text-right font-bold">{mode === "month" ? "今月実績額" : "実績合計"}</th>
              {mode !== "month" && <th className="px-4 py-3 text-right font-bold">月平均</th>}
              {mode === "month" && <th className="px-4 py-3 text-right font-bold">前月差</th>}
              {(mode === "month" || mode === "year") && (
                <th className="px-4 py-3 text-right font-bold">前年差</th>
              )}
              <th className="px-4 py-3 text-right font-bold">達成率</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-900/5">
            {billRows.map((b) => (
              <tr key={b.id} className="hover:bg-sumi-50/50 transition-colors">
                <td className="px-4 py-3 font-bold text-ink-900">{b.name}</td>
                <td className="px-4 py-3 text-ink-500">{b.account}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-500">{yen(b.budget)}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-ink-900">{yen(b.totalAmount)}</td>
                {mode !== "month" && <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-500">{yen(b.average)}</td>}
                {mode === "month" && (
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-xs">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded font-semibold ${
                        b.diffPrev <= 0
                          ? "text-moss-500 bg-moss-400/15"
                          : "text-hanko-500 bg-hanko-50"
                      }`}
                    >
                      {signedYen(b.diffPrev)}
                    </span>
                  </td>
                )}
                {(mode === "month" || mode === "year") && (
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-xs">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded font-semibold ${
                        b.diffPrevYear <= 0
                          ? "text-moss-500 bg-moss-400/15"
                          : "text-hanko-500 bg-hanko-50"
                      }`}
                    >
                      {signedYen(b.diffPrevYear)}
                    </span>
                  </td>
                )}
                <td className="px-4 py-3 text-right font-mono tabular-nums font-bold">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs ${
                      b.rate > 100
                        ? "bg-hanko-50 text-hanko-500 border border-hanko-400/20"
                        : b.rate === 0
                        ? "bg-paper-100 text-ink-500"
                        : "bg-moss-400/20 text-moss-500"
                    }`}
                  >
                    {b.rate.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* スマホ用カード表示 */}
      <div className="sm:hidden divide-y divide-ink-900/5">
        {billRows.map((b) => (
          <div key={b.id} className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-ink-900 text-sm">{b.name}</span>
              <span
                className={`rounded px-2.5 py-0.5 text-xs font-bold font-mono tabular-nums ${
                  b.rate > 100
                    ? "bg-hanko-50 text-hanko-500 border border-hanko-400/20"
                    : b.rate === 0
                    ? "bg-paper-100 text-ink-500"
                    : "bg-moss-400/20 text-moss-500"
                }`}
              >
                達成率 {b.rate.toFixed(1)}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono tabular-nums">
              <div className="bg-paper-100/60 p-2 rounded-xl border border-ink-900/5">
                <span className="text-ink-500 block text-[10px]">口座</span>
                <span className="text-ink-900 text-xs font-sans font-medium">{b.account}</span>
              </div>
              <div className="bg-paper-100/60 p-2 rounded-xl border border-ink-900/5">
                <span className="text-ink-500 block text-[10px]">月予算</span>
                <strong className="text-ink-700 text-xs">{yen(b.budget)}</strong>
              </div>
              <div className="bg-paper-100/60 p-2 rounded-xl border border-ink-900/5">
                <span className="text-ink-500 block text-[10px]">
                  {mode === "month" ? "今月実績" : "実績合計"}
                </span>
                <strong className="text-ink-900 text-xs font-bold">{yen(b.totalAmount)}</strong>
              </div>
              {mode !== "month" && (
                <div className="bg-paper-100/60 p-2 rounded-xl border border-ink-900/5">
                  <span className="text-ink-500 block text-[10px]">月平均</span>
                  <strong className="text-ink-700 text-xs">{yen(b.average)}</strong>
                </div>
              )}
              {mode === "month" && (
                <div className="bg-paper-100/60 p-2 rounded-xl border border-ink-900/5">
                  <span className="text-ink-500 block text-[10px]">前月差</span>
                  <strong
                    className={
                      b.diffPrev <= 0 ? "text-moss-500 text-xs" : "text-hanko-500 text-xs"
                    }
                  >
                    {signedYen(b.diffPrev)}
                  </strong>
                </div>
              )}
              {(mode === "month" || mode === "year") && (
                <div className="bg-paper-100/60 p-2 rounded-xl border border-ink-900/5">
                  <span className="text-ink-500 block text-[10px]">前年差</span>
                  <strong
                    className={
                      b.diffPrevYear <= 0 ? "text-moss-500 text-xs" : "text-hanko-500 text-xs"
                    }
                  >
                    {signedYen(b.diffPrevYear)}
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
