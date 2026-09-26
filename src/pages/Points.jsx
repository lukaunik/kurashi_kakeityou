import React from 'react';
import { Card, Stat, Money } from '../components/CommonUI.jsx';
import { p, n } from '../utils/calculations.js';

export function Points({ data, setData }) {
  const rows = data.points.map((point) => {
    const balance = p(data.pointBalances?.[point.id]);
    return {
      ...point,
      balance,
      regular: balance * n(point.regularRate),
      campaign: balance * n(point.campaignRate),
    };
  });
  const regular = rows.reduce((s, x) => s + x.regular, 0);
  const campaign = rows.reduce((s, x) => s + x.campaign, 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink-900 tracking-wide">ポイント・マイル管理</h2>
        <p className="mt-1 text-xs text-ink-500">
          ポイント残高 × 交換倍率でマイルを計算します。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Stat
          label="通常交換での合計マイル"
          value={`${regular.toLocaleString(undefined, {
            maximumFractionDigits: 1,
          })} mile`}
          tone="bg-sumi-700 text-white shadow-sm"
        />
        <Stat
          label="キャンペーン時の合計マイル"
          value={`${campaign.toLocaleString(undefined, {
            maximumFractionDigits: 1,
          })} mile`}
          tone="bg-sumi-600 text-white shadow-sm"
        />
      </div>

      <Card className="overflow-hidden p-0 border border-ink-900/10">
        <div className="p-4 border-b border-ink-900/10 bg-paper-100/50">
          <h3 className="font-bold text-ink-900 text-sm">ポイント別交換一覧</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-xs border-collapse">
            <thead className="bg-paper-100 text-ink-700 font-bold border-b border-ink-900/10">
              <tr>
                <th className="px-4 py-3 text-left font-bold">ポイント種別</th>
                <th className="px-4 py-3 text-left font-bold">現在残高</th>
                <th className="px-4 py-3 text-right font-bold">通常倍率</th>
                <th className="px-4 py-3 text-right font-bold">通常マイル</th>
                <th className="px-4 py-3 text-right font-bold">キャンペーンマイル</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/5">
              {rows.map((x) => (
                <tr key={x.id} className="hover:bg-sumi-50/50 transition-colors">
                  <td className="px-4 py-3 font-bold text-ink-900">{x.name}</td>
                  <td className="px-4 py-2">
                    <Money
                      small
                      value={x.balance}
                      onChange={(v) =>
                        setData((d) => ({
                          ...d,
                          pointBalances: {
                            ...d.pointBalances,
                            [x.id]: p(v),
                          },
                        }))
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-500">× {n(x.regularRate)}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-ink-900">
                    {x.regular.toLocaleString(undefined, {
                      maximumFractionDigits: 1,
                    })}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-sumi-700">
                    {x.campaign.toLocaleString(undefined, {
                      maximumFractionDigits: 1,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
