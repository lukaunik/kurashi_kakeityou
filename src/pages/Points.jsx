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
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">ポイント・マイル管理</h2>
        <p className="mt-1 text-sm text-slate-500">
          ポイント残高 × 交換倍率でマイルを計算します。
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Stat
          label="通常交換での合計マイル"
          value={`${regular.toLocaleString(undefined, {
            maximumFractionDigits: 1,
          })} mile`}
          tone="bg-slate-900 text-white"
        />
        <Stat
          label="キャンペーン時の合計マイル"
          value={`${campaign.toLocaleString(undefined, {
            maximumFractionDigits: 1,
          })} mile`}
          tone="bg-indigo-600 text-white"
        />
      </div>
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3">ポイント種別</th>
                <th>現在残高</th>
                <th>通常倍率</th>
                <th>通常マイル</th>
                <th className="px-4">キャンペーンマイル</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((x) => (
                <tr key={x.id}>
                  <td className="px-4 py-3 font-medium">{x.name}</td>
                  <td>
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
                  <td>× {n(x.regularRate)}</td>
                  <td>
                    {x.regular.toLocaleString(undefined, {
                      maximumFractionDigits: 1,
                    })}
                  </td>
                  <td className="px-4 font-bold text-indigo-700">
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
