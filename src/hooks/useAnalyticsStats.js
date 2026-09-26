import { useMemo } from 'react';
import { p, prevYM, stats } from '../utils/calculations.js';

export function useAnalyticsStats({ data, ym, mode, year }) {
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

  // 前月・前年比較データの計算準備
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

  // カテゴリ別精算実績
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

  // 固定費・定期引き落としの項目別詳細分析
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

  return {
    years,
    keys,
    rows,
    activeMonthCount,
    comparisonData,
    total,
    avgLife,
    avgDue,
    avgRecovered,
    categoryRows,
    billRows,
    latestKey,
    latest,
    unpaidMonths,
    net,
    cash,
    securities,
    assetTotal,
    currentStats,
    incomeChart,
    spendingChart,
    netChart,
    assetChart,
    assetPortfolio,
  };
}
