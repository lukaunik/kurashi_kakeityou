import React, { useState, useMemo } from 'react';
import { Card, Stat, MonthPick } from '../components/CommonUI.jsx';
import { Donut, Chart } from '../components/Charts.jsx';
import {
  p,
  yen,
  signedYen,
  prevYM,
  stats,
} from '../utils/calculations.js';

export function Analytics({ data, ym, setYm }) {
  const [mode, setMode] = useState("month");
  const [year, setYear] = useState(ym.slice(0, 4));
  const years = Array.from(
    new Set([
      new Date().getFullYear().toString(),
      ...Object.keys(data.monthly).map((x) => x.slice(0, 4)),
    ])
  ).sort((a, b) => Number(b) - Number(a));

  const keys = useMemo(() => {
    const saved = Object.keys(data.monthly).sort();
    if (mode === "month") return [ym];
    if (mode === "year")
      return Array.from(
        { length: 12 },
        (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`
      );
    return saved.length ? saved : [ym];
  }, [mode, year, ym, data.monthly]);

  const rows = keys.map((key) => stats(data, key));
  const monthCount = rows.length || 1;

  // 集計: 資金管理側支出(spending)のみ使用し、精算(life)は除外
  const total = rows.reduce(
    (o, r) => ({
      life: o.life + r.life,
      due: o.due + r.due,
      recovered: o.recovered + r.recovered,
      fixed: o.fixed + r.fixed,
      temp: o.temp + r.temp,
      spending: o.spending + r.spending,
      income: o.income + r.income,
    }),
    {
      life: 0,
      due: 0,
      recovered: 0,
      fixed: 0,
      temp: 0,
      spending: 0,
      income: 0,
    }
  );

  // 精算分析用平均値
  const avgLife = total.life / monthCount;
  const avgDue = total.due / monthCount;
  const avgRecovered = total.recovered / monthCount;

  const categoryRows = data.categories.map((c) => ({
    ...c,
    amount: rows.reduce((s, r) => s + p(r.ex[c.id]), 0),
    average: rows.length
      ? rows.reduce((s, r) => s + p(r.ex[c.id]), 0) / rows.length
      : 0,
  }));

  // 固定費・定期引き落としの項目別詳細分析
  const billRows = data.bills.map((b) => {
    const totalAmount = rows.reduce(
      (sum, r) => sum + (Object.prototype.hasOwnProperty.call(r.m.billAmounts || {}, b.id) ? p(r.m.billAmounts[b.id]) : 0),
      0
    );
    const average = totalAmount / monthCount;
    const totalBudget = p(b.budget) * monthCount;
    const rate = totalBudget > 0 ? (totalAmount / totalBudget) * 100 : 0;
    return {
      ...b,
      totalAmount,
      average,
      totalBudget,
      rate,
    };
  });

  const latestKey = Object.keys(data.monthly).sort().at(-1) || ym;
  const latest = stats(data, latestKey);

  const unpaidMonths = rows.filter((r) => r.due > 0 && !r.isPaid).map((r) => r.key);
  const net = total.income - total.spending;
  const cash = latest.assets.cash;
  const securities = latest.assets.securities;
  const assetTotal = cash + securities;

  // 前月比データ（当月選択時）
  const prevKey = prevYM(ym);
  const prevStats = stats(data, prevKey);
  const currentStats = stats(data, ym);

  const incomeChart = rows.map((r) => ({ label: r.key, value: r.income }));
  const spendingChart = rows.map((r) => ({ label: r.key, value: r.spending }));
  const netChart = rows.map((r) => ({ label: r.key, value: r.net }));
  const assetChart = rows.map((r) => ({ label: r.key, value: r.assets.total }));

  const assetPortfolio = [
    { name: "現金残高", amount: cash },
    { name: "証券投資評価額", amount: securities },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">分析ダッシュボード</h2>
        <p className="mt-1 text-sm text-slate-500">
          精算・資金繰り・資産状態を統合可視化します。
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg bg-slate-100 p-1">
            {[
              ["month", "当月"],
              ["year", "年別"],
              ["all", "全期間"],
            ].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setMode(v)}
                className={`rounded-md px-3 py-2 text-sm font-bold ${
                  mode === v
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {mode === "month" && <MonthPick ym={ym} setYm={setYm} />}
          {mode === "year" && (
            <label className="text-sm font-medium">
              対象年
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="ml-2 rounded-lg border border-slate-300 px-3 py-2"
              >
                {years.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </label>
          )}
        </div>
      </Card>

      {/* 精算セクション */}
      <section className="space-y-3">
        <h3 className="font-bold text-indigo-800">精算分析</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Stat
            label={mode === "month" ? "生活費合計" : `生活費合計 (月平均: ${yen(avgLife)})`}
            value={yen(total.life)}
          />
          <Stat
            label={mode === "month" ? "回収対象額" : `回収対象額 (月平均: ${yen(avgDue)})`}
            value={yen(total.due)}
            tone="bg-indigo-600 text-white"
          />
          <Stat
            label={mode === "month" ? "実回収額" : `実回収額 (月平均: ${yen(avgRecovered)})`}
            value={yen(total.recovered)}
            tone="bg-emerald-600 text-white"
          />
        </div>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">未回収状態の月</h3>
              <p className="mt-1 text-sm text-slate-500">
                対象期間内の回収完了フラグが立っていない月の一覧です。
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold ${
                unpaidMonths.length === 0
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {unpaidMonths.length === 0
                ? "全て回収済み"
                : `未回収 ${unpaidMonths.length}ヶ月`}
            </span>
          </div>
          {unpaidMonths.length > 0 && (
            <p className="mt-3 font-semibold text-rose-600 text-sm">
              未回収月: {unpaidMonths.join("、")}
            </p>
          )}
        </Card>

        <div className="grid gap-4 lg:grid-cols-2 min-w-0">
          <Card className="overflow-hidden p-0">
            <div className="p-4">
              <h3 className="font-bold">カテゴリ別精算実績</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3">カテゴリ</th>
                    <th>予算</th>
                    <th>実績合計</th>
                    {mode !== "month" && <th>月平均</th>}
                    <th className="px-4">予算達成率</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categoryRows.map((c) => {
                    const rate = c.budget ? (c.average / c.budget) * 100 : 0;
                    return (
                      <tr key={c.id}>
                        <td className="px-4 py-3 font-medium">{c.name}</td>
                        <td>{yen(c.budget)}</td>
                        <td>{yen(c.amount)}</td>
                        {mode !== "month" && <td>{yen(c.average)}</td>}
                        <td
                          className={`px-4 font-bold ${
                            rate > 100 ? "text-rose-600" : "text-emerald-600"
                          }`}
                        >
                          {rate.toFixed(0)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          <Card>
            <h3 className="font-bold">カテゴリ別生活費割合</h3>
            <Donut rows={categoryRows} />
          </Card>
        </div>
      </section>

      {/* 資金繰り・資産セクション */}
      <section className="space-y-3">
        <h3 className="font-bold text-emerald-800">資金繰り・資産分析</h3>
        <p className="text-xs text-slate-500">
          ※ 支出合計から精算生活費（生活費の精算）は除外されています。
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="総収入"
            value={yen(total.income)}
            tone="bg-emerald-600 text-white"
          />
          <Stat label="支出合計（固定+臨時）" value={yen(total.spending)} />
          <Stat
            label="純貯蓄額（収入-支出）"
            value={signedYen(net)}
            tone={net < 0 ? "bg-rose-600 text-white" : "bg-slate-900 text-white"}
          />
          <Stat
            label="最新総資産（現金+証券）"
            value={yen(assetTotal)}
            tone="bg-indigo-600 text-white"
          />
        </div>

        {/* 前月比（当月表示時のみ） */}
        {mode === "month" && (
          <Card>
            <h3 className="font-bold mb-2">前月（{prevKey}）との比較</h3>
            <div className="grid gap-3 sm:grid-cols-3 text-sm">
              <div>
                <p className="text-slate-500">収入変化</p>
                <strong
                  className={
                    currentStats.income >= prevStats.income
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }
                >
                  {signedYen(currentStats.income - prevStats.income)}
                </strong>
              </div>
              <div>
                <p className="text-slate-500">支出変化</p>
                <strong
                  className={
                    currentStats.spending <= prevStats.spending
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }
                >
                  {signedYen(currentStats.spending - prevStats.spending)}
                </strong>
              </div>
              <div>
                <p className="text-slate-500">純貯蓄変化</p>
                <strong
                  className={
                    currentStats.net >= prevStats.net
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }
                >
                  {signedYen(currentStats.net - prevStats.net)}
                </strong>
              </div>
            </div>
          </Card>
        )}

        {/* 固定費・定期引き落としの詳細分析 */}
        <Card className="overflow-hidden p-0">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold">固定費・定期引き落とし 詳細分析</h3>
            <p className="mt-1 text-xs text-slate-500">
              対象期間における項目ごとの設定予算、実績累計、月平均、消化率です。
            </p>
          </div>
          {/* PC用テーブル表示 */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3">項目名</th>
                  <th>引落口座</th>
                  <th>設定予算 (月額)</th>
                  <th>実績合計</th>
                  <th>月平均</th>
                  <th className="px-4 text-right">予算消化率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {billRows.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 font-medium">{b.name}</td>
                    <td className="text-slate-500">{b.account}</td>
                    <td>{yen(b.budget)}</td>
                    <td className="font-semibold">{yen(b.totalAmount)}</td>
                    <td>{yen(b.average)}</td>
                    <td className="px-4 py-3 text-right font-bold">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          b.rate > 100
                            ? "bg-rose-100 text-rose-700"
                            : b.rate === 0
                            ? "bg-slate-100 text-slate-500"
                            : "bg-emerald-50 text-emerald-700"
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
          <div className="sm:hidden divide-y divide-slate-100">
            {billRows.map((b) => (
              <div key={b.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{b.name}</span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-bold ${
                      b.rate > 100
                        ? "bg-rose-100 text-rose-700"
                        : b.rate === 0
                        ? "bg-slate-100 text-slate-500"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    消化率 {b.rate.toFixed(1)}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400">口座: </span>
                    {b.account}
                  </div>
                  <div>
                    <span className="text-slate-400">月予算: </span>
                    {yen(b.budget)}
                  </div>
                  <div>
                    <span className="text-slate-400">実績合計: </span>
                    <strong className="text-slate-900">{yen(b.totalAmount)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">月平均: </span>
                    <strong className="text-slate-900">{yen(b.average)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2 min-w-0">
          <Card>
            <h3 className="font-bold">月間純貯蓄（収支）の推移</h3>
            <Chart data={netChart} color="bg-indigo-500" signed />
          </Card>
          <Card>
            <h3 className="font-bold">総資産ポートフォリオ</h3>
            <Donut rows={assetPortfolio} title="資産構成" />
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 min-w-0">
          <Card>
            <h3 className="font-bold">収入推移</h3>
            <Chart data={incomeChart} color="bg-emerald-500" />
          </Card>
          <Card>
            <h3 className="font-bold">支出推移（固定費+臨時出費）</h3>
            <Chart data={spendingChart} color="bg-rose-500" />
          </Card>
        </div>

        <Card>
          <h3 className="font-bold">総資産（現金 + 証券評価額）の推移</h3>
          <Chart data={assetChart} color="bg-cyan-500" />
        </Card>
      </section>
    </div>
  );
}
