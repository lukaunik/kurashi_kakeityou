import React, { useState } from 'react';
import { Card, Stat, MonthPick } from '../components/CommonUI.jsx';
import { Donut, Chart } from '../components/Charts.jsx';
import { yen, signedYen } from '../utils/calculations.js';
import { useAnalyticsStats } from '../hooks/useAnalyticsStats.js';
import { CategoryBreakdownTable } from '../components/analytics/CategoryBreakdownTable.jsx';
import { BillBreakdownTable } from '../components/analytics/BillBreakdownTable.jsx';
import { AssetPortfolioCard } from '../components/analytics/AssetPortfolioCard.jsx';

export function Analytics({ data, ym, setYm }) {
  const [mode, setMode] = useState("month");
  const [year, setYear] = useState(ym.slice(0, 4));

  const {
    years,
    comparisonData,
    total,
    avgLife,
    avgDue,
    avgRecovered,
    categoryRows,
    billRows,
    unpaidMonths,
    net,
    assetTotal,
    currentStats,
    incomeChart,
    spendingChart,
    netChart,
    assetChart,
    assetPortfolio,
  } = useAnalyticsStats({ data, ym, mode, year });

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink-900 tracking-wide">分析ダッシュボード</h2>
        <p className="mt-1 text-xs text-ink-500">
          精算・資金繰り・資産状態を統合可視化します。
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl bg-paper-100 p-1 border border-ink-900/5">
            {[
              ["month", "当月"],
              ["year", "年別"],
              ["all", "全期間"],
            ].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setMode(v)}
                className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                  mode === v
                    ? "bg-white text-sumi-700 shadow-sm"
                    : "text-ink-500 hover:text-ink-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {mode === "month" && <MonthPick ym={ym} setYm={setYm} />}
          {mode === "year" && (
            <label className="text-xs font-semibold flex items-center gap-2 text-ink-700">
              <span>対象年</span>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="rounded-xl border border-ink-900/15 px-3 py-2 text-xs font-bold font-mono text-ink-900 bg-white outline-none focus:border-sumi-600"
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
      <section className="space-y-5">
        <div className="flex items-center gap-2 border-b border-ink-900/10 pb-2">
          <span className="h-4 w-1 rounded-full bg-sumi-600" />
          <h3 className="font-display text-lg font-bold text-sumi-700 tracking-wide">精算分析</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat
            label={
              mode === "month"
                ? "生活費合計"
                : `生活費合計 (月平均: ${yen(avgLife)})`
            }
            value={yen(total.life)}
          />
          <Stat
            label={
              mode === "month"
                ? "回収対象額"
                : `回収対象額 (月平均: ${yen(avgDue)})`
            }
            value={yen(total.due)}
            variant="dark"
            tone="bg-sumi-700 shadow-sm"
          />
          <Stat
            label={
              mode === "month"
                ? "実回収額"
                : `実回収額 (月平均: ${yen(avgRecovered)})`
            }
            value={yen(total.recovered)}
            variant="dark"
            tone="bg-moss-500 shadow-sm"
          />
        </div>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-ink-900 text-sm">未回収状態の月</h3>
              <p className="mt-0.5 text-xs text-ink-500">
                対象期間内の回収完了フラグが立っていない月の一覧です。
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold font-mono ${
                unpaidMonths.length === 0
                  ? "bg-moss-400/20 text-moss-500"
                  : "bg-hanko-50 text-hanko-500 border border-hanko-400/20"
              }`}
            >
              {unpaidMonths.length === 0
                ? "全て回収済み"
                : `未回収 ${unpaidMonths.length}ヶ月`}
            </span>
          </div>
          {unpaidMonths.length > 0 && (
            <p className="mt-3 font-semibold text-hanko-500 text-xs font-mono bg-hanko-50 p-2.5 rounded-xl border border-hanko-400/20">
              未回収月: {unpaidMonths.join("、")}
            </p>
          )}
        </Card>

        <div className="grid gap-6 lg:grid-cols-2 min-w-0">
          <CategoryBreakdownTable
            categoryRows={categoryRows}
            mode={mode}
          />
          <Card>
            <h3 className="font-bold text-ink-900 text-sm mb-2">カテゴリ別生活費割合</h3>
            <Donut rows={categoryRows} />
          </Card>
        </div>
      </section>

      {/* 資金繰り・資産セクション */}
      <section className="space-y-5 pt-2">
        <div className="flex items-center gap-2 border-b border-ink-900/10 pb-2">
          <span className="h-4 w-1 rounded-full bg-sumi-600" />
          <h3 className="font-display text-lg font-bold text-sumi-700 tracking-wide">資金繰り・資産分析</h3>
        </div>
        <p className="text-xs text-ink-500 -mt-2">
          ※ 支出合計から精算生活費（生活費の精算）は除外されています。
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="総収入"
            value={yen(total.income)}
            variant="dark"
            tone="bg-sumi-600 shadow-sm"
          />
          <Stat label="支出合計（固定+臨時）" value={yen(total.spending)} />
          <Stat
            label="純貯蓄額（収入-支出）"
            value={signedYen(net)}
            variant="dark"
            tone={net < 0 ? "bg-hanko-500 shadow-sm" : "bg-ink-900 shadow-sm"}
          />
          <Stat
            label="最新総資産（現金+証券）"
            value={yen(assetTotal)}
            variant="dark"
            tone="bg-sumi-700 shadow-sm"
          />
        </div>

        {/* 前月比（当月表示時のみ） */}
        {mode === "month" && (
          <Card>
            <h3 className="font-bold text-ink-900 text-sm mb-3">前月（{comparisonData.prevKey}）との比較</h3>
            <div className="grid gap-3 sm:grid-cols-3 text-sm">
              <div className="bg-paper-100/60 p-3 rounded-xl border border-ink-900/5">
                <p className="text-ink-500 text-xs">収入変化</p>
                <strong
                  className={`text-base font-mono tabular-nums ${
                    currentStats.income >= comparisonData.prevStats.income
                      ? "text-ink-900 font-bold"
                      : "text-hanko-500"
                  }`}
                >
                  {signedYen(currentStats.income - comparisonData.prevStats.income)}
                </strong>
              </div>
              <div className="bg-paper-100/60 p-3 rounded-xl border border-ink-900/5">
                <p className="text-ink-500 text-xs">支出変化</p>
                <strong
                  className={`text-base font-mono tabular-nums ${
                    currentStats.spending <= comparisonData.prevStats.spending
                      ? "text-ink-900 font-bold"
                      : "text-hanko-500"
                  }`}
                >
                  {signedYen(currentStats.spending - comparisonData.prevStats.spending)}
                </strong>
              </div>
              <div className="bg-paper-100/60 p-3 rounded-xl border border-ink-900/5">
                <p className="text-ink-500 text-xs">純貯蓄変化</p>
                <strong
                  className={`text-base font-mono tabular-nums ${
                    currentStats.net >= comparisonData.prevStats.net
                      ? "text-ink-900 font-bold"
                      : "text-hanko-500"
                  }`}
                >
                  {signedYen(currentStats.net - comparisonData.prevStats.net)}
                </strong>
              </div>
            </div>
          </Card>
        )}

        {/* 固定費・定期引き落としの詳細分析 */}
        <BillBreakdownTable billRows={billRows} mode={mode} />

        {/* 総資産ポートフォリオ */}
        <AssetPortfolioCard assetPortfolio={assetPortfolio} />

        {/* 期間・年別推移グラフ */}
        {mode !== "month" && (
          <>
            <div className="pt-2">
              <h3 className="font-display font-bold text-ink-900 text-base">
                {mode === "year"
                  ? `${year}年 年間実績推移（月別）`
                  : "全期間 実績推移"}
              </h3>
            </div>
            <div className="grid gap-6 lg:grid-cols-2 min-w-0">
              <Card>
                <h3 className="font-bold text-ink-900 text-sm">月間純貯蓄（収支）の推移</h3>
                <Chart data={netChart} color="bg-sumi-600" signed />
              </Card>
              <Card>
                <h3 className="font-bold text-ink-900 text-sm">総資産（現金 + 証券評価額）の推移</h3>
                <Chart data={assetChart} color="bg-sumi-700" />
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 min-w-0">
              <Card>
                <h3 className="font-bold text-ink-900 text-sm">収入推移</h3>
                <Chart data={incomeChart} color="bg-moss-500" />
              </Card>
              <Card>
                <h3 className="font-bold text-ink-900 text-sm">支出推移（固定費+臨時出費）</h3>
                <Chart data={spendingChart} color="bg-hanko-500" />
              </Card>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
