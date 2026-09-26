import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { useAnalyticsStats } from './useAnalyticsStats.js';
import { normalize } from '../utils/calculations.js';

function renderHook(hookFn) {
  let result;
  function TestComponent() {
    result = hookFn();
    return null;
  }
  renderToStaticMarkup(React.createElement(TestComponent));
  return { current: result };
}

describe('useAnalyticsStats カスタムフックの単体テスト', () => {
  const sampleData = normalize({
    categories: [
      { id: 1, name: '食費', budget: 50000, recovery: 'half' },
      { id: 2, name: '日用品', budget: 20000, recovery: 'full' },
    ],
    bills: [
      { id: 1, name: '電気代', budget: 10000, account: 'メイン' },
      { id: 2, name: '通信費', budget: 5000, account: 'メイン' },
    ],
    accounts: [{ id: 1, name: 'メイン', balance: 100000 }],
    monthly: {
      '2025-03': {
        expenses: { 1: 40000, 2: 15000 },
        billAmounts: { 1: 9000, 2: 5000 },
        incomeItems: [{ id: 'inc-0', name: '給料', amount: 280000 }],
        tempExpenses: [],
        recoveredAmount: 35000,
        settlementStatus: 'paid',
      },
      '2026-02': {
        expenses: { 1: 45000, 2: 18000 },
        billAmounts: { 1: 11000, 2: 5000 },
        incomeItems: [{ id: 'inc-prev', name: '給料', amount: 300000 }],
        tempExpenses: [{ id: 'temp-prev', name: '臨時', amount: 10000 }],
        recoveredAmount: 40500,
        settlementStatus: 'paid',
      },
      '2026-03': {
        expenses: { 1: 48000, 2: 22000 },
        billAmounts: { 1: 12000, 2: 5000 },
        incomeItems: [{ id: 'inc-1', name: '給料', amount: 320000 }],
        tempExpenses: [{ id: 'temp-1', name: '旅行', amount: 30000 }],
        recoveredAmount: 0,
        settlementStatus: 'unpaid',
      },
    },
  });

  describe('「当月 (month)」モードの集計', () => {
    it('当月 (2026-03) の収支・精算・未回収月が正しく集計されること', () => {
      const { current } = renderHook(() =>
        useAnalyticsStats({
          data: sampleData,
          ym: '2026-03',
          mode: 'month',
          year: '2026',
        })
      );

      // 精算: 食費48,000 + 日用品22,000 = 70,000
      expect(current.total.life).toBe(70000);
      // 回収対象: 食費48,000/2 + 日用品22,000 = 24,000 + 22,000 = 46,000
      expect(current.total.due).toBe(46000);
      // 実回収額
      expect(current.total.recovered).toBe(0);

      // 資金繰り: 固定費 (12,000+5,000=17,000) + 臨時 30,000 = 47,000
      expect(current.total.spending).toBe(47000);
      expect(current.total.income).toBe(320000);
      expect(current.net).toBe(320000 - 47000); // 273,000

      // 未回収月
      expect(current.unpaidMonths).toContain('2026-03');
      expect(current.unpaidMonths).not.toContain('2026-02');
    });

    it('categoryRows で targetBudget と rate が事前に正しく算出されていること', () => {
      const { current } = renderHook(() =>
        useAnalyticsStats({
          data: sampleData,
          ym: '2026-03',
          mode: 'month',
          year: '2026',
        })
      );

      const food = current.categoryRows.find((c) => c.name === '食費');
      expect(food).toBeDefined();
      expect(food.amount).toBe(48000);
      expect(food.targetBudget).toBe(50000);
      // 48000 / 50000 * 100 = 96%
      expect(food.rate).toBeCloseTo(96, 1);
      // 前月差 (2026-02 の食費 45,000 との差: 48,000 - 45,000 = +3,000)
      expect(food.diffPrev).toBe(3000);
      // 前年差 (2025-03 の食費 40,000 との差: 48,000 - 40,000 = +8,000)
      expect(food.diffPrevYear).toBe(8000);

      const daily = current.categoryRows.find((c) => c.name === '日用品');
      expect(daily).toBeDefined();
      expect(daily.amount).toBe(22000);
      expect(daily.targetBudget).toBe(20000);
      // 22000 / 20000 * 100 = 110%
      expect(daily.rate).toBeCloseTo(110, 1);
    });
  });

  describe('「年別 (year)」モードの集計', () => {
    it('年別 (2026年) で複数月の合計・平均・予算比率が正しく集計されること', () => {
      const { current } = renderHook(() =>
        useAnalyticsStats({
          data: sampleData,
          ym: '2026-03',
          mode: 'year',
          year: '2026',
        })
      );

      // 2026年は 2026-02 と 2026-03 の 2ヶ月分
      expect(current.activeMonthCount).toBe(2);

      // 食費: 45,000 + 48,000 = 93,000
      const food = current.categoryRows.find((c) => c.name === '食費');
      expect(food).toBeDefined();
      expect(food.amount).toBe(93000);
      expect(food.average).toBe(93000 / 2); // 46,500
      // 年別の場合の targetBudget は 月予算 50,000 × activeMonthCount(2) = 100,000
      expect(food.targetBudget).toBe(100000);
      // rate: 93,000 / 100,000 * 100 = 93%
      expect(food.rate).toBeCloseTo(93, 1);

      // 年別チャートデータ
      expect(current.incomeChart).toHaveLength(12); // 12ヶ月分のキー
    });
  });
});
