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

  const years = useMemo(() => {
    return Array.from(
      new Set([
        new Date().getFullYear().toString(),
        ...Object.keys(data.monthly).map((x) => x.slice(0, 4)),
      ])
    ).sort((a, b) => Number(b) - Number(a));
  }, [data.monthly]);

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

  const rows = useMemo(
    () => keys.map((key) => stats(data, key)),
    [keys, data]
  );

  // データが存在する月数の正確なカウント
  const activeMonthCount = useMemo(() => {
    if (mode === "month") return 1;
    const activeKeys = keys.filter((k) => Boolean(data.monthly[k]));
    return activeKeys.length || 1;
  }, [mode, keys, data.monthly]);

  // 前月・前年比較データの計算準備（useMemoで最適化）
  const comparisonData = useMemo(() => {
    const prevKey = prevYM(ym);
    const prevStats = stats(data, prevKey);

    const prevYearKey = `${Number(ym.slice(0, 4)) - 1}-${ym.slice(5)}`;
    const prevYearStats = stats(data, prevYearKey);

    const prevYearNum = String(Number(year) - 1);
    const prevYearKeys = Array.from(
      { length: 12 },
      (_, i) => `${prevYearNum}-${String(i + 1).padStart(2, "0")}`
    );
    const prevYearRows = prevYearKeys.map((k) => stats(data, k));

    return { prevKey, prevStats, prevYearStats, prevYearRows };
  }, [ym, year, data]);

  // 集計: 資金管理側支出(spending)のみ使用
  const total = useMemo(() => {
    return rows.reduce(
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
  }, [rows]);

  // 精算分析用平均値
  const avgLife = total.life / activeMonthCount;
  const avgDue = total.due / activeMonthCount;
  const avgRecovered = total.recovered / activeMonthCount;

  // カテゴリ別精算実績（useMemoで計算最適化）
  const categoryRows = useMemo(() => {
    const { prevStats, prevYearStats, prevYearRows } = comparisonData;
    return data.categories.map((c) => {
      const amount = rows.reduce((s, r) => s + p(r.ex[c.id]), 0);
      const average = amount / activeMonthCount;

      const prevAmount = mode === "month" ? p(prevStats.ex[c.id]) : 0;
      const diffPrev = amount - prevAmount;

      const prevYearAmount =
        mode === "month"
          ? p(prevYearStats.ex[c.id])
          : prevYearRows.reduce((s, r) => s + p(r.ex[c.id]), 0);
      const diffPrevYear = amount - prevYearAmount;

      return {
        ...c,
        amount,
        average,
        diffPrev,
        diffPrevYear,
      };
    });
  }, [data.categories, rows, activeMonthCount, mode, comparisonData]);

  // 固定費・定期引き落としの項目別詳細分析（useMemoで計算最適化）
  const billRows = useMemo(() => {
    const { prevStats, prevYearStats, prevYearRows } = comparisonData;
    return data.bills.map((b) => {
      const totalAmount = rows.reduce(
        (sum, r) =>
          sum +
          (Object.prototype.hasOwnProperty.call(r.m.billAmounts || {}, b.id)
            ? p(r.m.billAmounts[b.id])
            : 0),
        0
      );
      const average = totalAmount / activeMonthCount;
      const targetBudget = p(b.budget) * (mode === "month" ? 1 : activeMonthCount);
      const rate = targetBudget > 0 ? (totalAmount / targetBudget) * 100 : 0;

      const prevAmount =
        mode === "month" ? p(prevStats.m.billAmounts?.[b.id]) : 0;
      const diffPrev = totalAmount - prevAmount;

      const prevYearAmount =
        mode === "month"
          ? p(prevYearStats.m.billAmounts?.[b.id])
          : prevYearRows.reduce(
              (sum, r) => sum + p(r.m.billAmounts?.[b.id]),
              0
            );
      const diffPrevYear = totalAmount - prevYearAmount;

      return {
        ...b,
        totalAmount,
        average,
        targetBudget,
        rate,
        diffPrev,
        diffPrevYear,
      };
    });
  }, [data.bills, rows, activeMonthCount, mode, comparisonData]);

  const latestKey = useMemo(() => {
    return Object.keys(data.monthly).sort().at(-1) || ym;
  }, [data.monthly, ym]);

  const latest = useMemo(() => stats(data, latestKey), [data, latestKey]);

  const unpaidMonths = useMemo(() => {
    return rows.filter((r) => r.due > 0 && !r.isPaid).map((r) => r.key);
  }, [rows]);

  const net = total.income - total.spending;
  const cash = latest.assets.cash;
  const securities = latest.assets.securities;
  const assetTotal = cash + securities;

  const currentStats = useMemo(() => stats(data, ym), [data, ym]);

  const incomeChart = useMemo(() => rows.map((r) => ({ label: r.key, value: r.income })), [rows]);
  const spendingChart = useMemo(() => rows.map((r) => ({ label: r.key, value: r.spending })), [rows]);
  const netChart = useMemo(() => rows.map((r) => ({ label: r.key, value: r.net })), [rows]);
  const assetChart = useMemo(() => rows.map((r) => ({ label: r.key, value: r.assets.total })), [rows]);

  // 総資産ポートフォリオの銘柄別表示
  const assetPortfolio = useMemo(() => {
    const securitiesItems = (latest.m.securities || []).filter(
      (s) => p(s.value) > 0
    );
    return [
      { name: "現金残高", amount: cash },
      ...(securitiesItems.length > 0
        ? securitiesItems.map((s, idx) => ({
            id: s.id || `sec-${idx}`,
            name: s.name || "銘柄未設定",
            amount: p(s.value),
          }))
        : [{ name: "証券投資評価額", amount: securities }]),
    ];
  }, [latest.m.securities, cash, securities]);

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
            tone="bg-sumi-700 text-white shadow-sm"
          />
          <Stat
            label={
              mode === "month"
                ? "実回収額"
                : `実回収額 (月平均: ${yen(avgRecovered)})`
            }
            value={yen(total.recovered)}
            tone="bg-moss-500 text-white shadow-sm"
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
          <Card className="overflow-hidden p-0">
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
                  {categoryRows.map((c) => {
                    const targetBudget = p(c.budget) * (mode === "month" ? 1 : activeMonthCount);
                    const rate = targetBudget > 0 ? (c.amount / targetBudget) * 100 : 0;
                    return (
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
                              rate > 100
                                ? "bg-hanko-50 text-hanko-500 border border-hanko-400/20"
                                : rate === 0
                                ? "bg-paper-100 text-ink-500"
                                : "bg-moss-400/20 text-moss-500"
                            }`}
                          >
                            {rate.toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* スマホ用カード表示 */}
            <div className="sm:hidden divide-y divide-ink-900/5">
              {categoryRows.map((c) => {
                const targetBudget = p(c.budget) * (mode === "month" ? 1 : activeMonthCount);
                const rate = targetBudget > 0 ? (c.amount / targetBudget) * 100 : 0;
                return (
                  <div key={c.id} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink-900 text-sm">{c.name}</span>
                      <span
                        className={`rounded px-2.5 py-0.5 text-xs font-bold font-mono tabular-nums ${
                          rate > 100
                            ? "bg-hanko-50 text-hanko-500 border border-hanko-400/20"
                            : rate === 0
                            ? "bg-paper-100 text-ink-500"
                            : "bg-moss-400/20 text-moss-500"
                        }`}
                      >
                        達成率 {rate.toFixed(0)}%
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
                );
              })}
            </div>
          </Card>
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
            tone="bg-sumi-600 text-white shadow-sm"
          />
          <Stat label="支出合計（固定+臨時）" value={yen(total.spending)} />
          <Stat
            label="純貯蓄額（収入-支出）"
            value={signedYen(net)}
            tone={net < 0 ? "bg-hanko-500 text-white shadow-sm" : "bg-ink-900 text-white shadow-sm"}
          />
          <Stat
            label="最新総資産（現金+証券）"
            value={yen(assetTotal)}
            tone="bg-sumi-700 text-white shadow-sm"
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
        <Card className="overflow-hidden p-0">
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

        {/* 総資産ポートフォリオ */}
        <div className="min-w-0">
          <Card>
            <h3 className="font-bold text-ink-900 text-sm mb-3">総資産ポートフォリオ（銘柄・資産別）</h3>
            <Donut rows={assetPortfolio} title="資産構成" />
          </Card>
        </div>

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
