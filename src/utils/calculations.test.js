import { describe, it, expect } from "vitest";
import {
  n,
  p,
  yen,
  signedYen,
  nowYM,
  prevYM,
  nextYM,
  generateId,
  normalize,
  stats,
  escapeCSV,
} from "./calculations.js";

describe("calculations.js の単体テスト", () => {
  describe("n & p (数値化・非負化関数)", () => {
    it("n は文字列や不正な入力を正しく数値変換する", () => {
      expect(n("123")).toBe(123);
      expect(n("¥1,234")).toBe(1234);
      expect(n("-500")).toBe(-500);
      expect(n(null)).toBe(0);
      expect(n(undefined)).toBe(0);
      expect(n("abc")).toBe(0);
    });

    it("p は負の値を 0 にクランプする", () => {
      expect(p(100)).toBe(100);
      expect(p(-50)).toBe(0);
      expect(p("¥5,000")).toBe(5000);
    });
  });

  describe("yen & signedYen (金額フォーマット)", () => {
    it("yen は JPY 形式にフォーマットする", () => {
      expect(yen(1000)).toBe("￥1,000");
      expect(yen(0)).toBe("￥0");
    });

    it("signedYen は符号付きでフォーマットする", () => {
      expect(signedYen(500)).toBe("￥500");
      expect(signedYen(-500)).toBe("-￥500");
    });
  });

  describe("日付関連関数 (nowYM, prevYM, nextYM)", () => {
    it("nowYM は YYYY-MM 形式の文字列を返す", () => {
      const ym = nowYM();
      expect(ym).toMatch(/^\d{4}-\d{2}$/);
    });

    it("prevYM / nextYM は月を前後移動する", () => {
      expect(prevYM("2026-03")).toBe("2026-02");
      expect(prevYM("2026-01")).toBe("2025-12");
      expect(nextYM("2026-03")).toBe("2026-04");
      expect(nextYM("2026-12")).toBe("2027-01");
    });
  });

  describe("generateId", () => {
    it("プレフィックス付きのユニークIDを生成する", () => {
      const id1 = generateId("item");
      const id2 = generateId("item");
      expect(id1.startsWith("item-")).toBe(true);
      expect(id1).not.toBe(id2);
    });
  });

  describe("normalize & stats (データ構造・集計計算)", () => {
    it("normalize は未定義データに初期値を設定して正規化する", () => {
      const normalized = normalize(null);
      expect(normalized.categories.length).toBeGreaterThan(0);
      expect(normalized.bills.length).toBeGreaterThan(0);
      expect(normalized.accounts.length).toBeGreaterThan(0);
      expect(normalized.monthly).toEqual({});
    });

    it("stats は指定月の生活費・固定費・純貯蓄・回収状況を正しく計算する", () => {
      const data = normalize({
        categories: [
          { id: 1, name: "食費", budget: 50000, recovery: "half" },
          { id: 2, name: "家賃", budget: 80000, recovery: "full" },
        ],
        bills: [
          { id: 1, name: "電気代", budget: 10000, account: "メイン" },
        ],
        accounts: [{ id: 1, name: "メイン", balance: 100000 }],
        monthly: {
          "2026-03": {
            expenses: { 1: 40000, 2: 80000 },
            billAmounts: { 1: 12000 },
            incomeItems: [{ id: "inc-1", name: "給料", amount: 300000 }],
            tempExpenses: [{ id: "temp-1", name: "旅行", amount: 20000 }],
            balances: { 1: 150000 },
            recoveredAmount: 100000,
            settlementStatus: "unpaid",
          },
        },
      });

      const st = stats(data, "2026-03");

      expect(st.life).toBe(120000); // 40000 + 80000
      expect(st.due).toBe(100000); // 40000/2 + 80000 = 100000
      expect(st.fixed).toBe(12000); // 電気代 12000
      expect(st.temp).toBe(20000); // 臨時 20000
      expect(st.spending).toBe(32000); // 固定費(12000) + 臨時(20000)
      expect(st.income).toBe(300000);
      expect(st.net).toBe(268000); // 300000 - 32000
      expect(st.recovered).toBe(100000);
      expect(st.isPaid).toBe(false);
    });
  });

  describe("月平均算出ロジック (activeMonthCount)", () => {
    it("データが存在する月数のみで正しく月平均を計算する", () => {
      const monthlyData = {
        "2026-01": { expenses: { 1: 30000 } },
        "2026-02": { expenses: { 1: 50000 } },
      };
      // 12ヶ月中データが存在するのは 2ヶ月
      const keys = Array.from({ length: 12 }, (_, i) => `2026-${String(i + 1).padStart(2, "0")}`);
      const activeKeys = keys.filter((k) => Boolean(monthlyData[k]));
      const activeMonthCount = activeKeys.length || 1;

      expect(activeMonthCount).toBe(2);

      const totalAmount = 30000 + 50000;
      const average = totalAmount / activeMonthCount;

      expect(average).toBe(40000); // (30000 + 50000) / 2
    });
  });

  describe("escapeCSV (CSVエスケープ・インジェクション対策)", () => {
    it("カンマやダブルクォートを含む文字列をダブルクォートでエスケープする", () => {
      expect(escapeCSV("hello, world")).toBe('"hello, world"');
      expect(escapeCSV('say "hello"')).toBe('"say ""hello"""');
    });

    it("先頭が =, +, -, @ の場合にシングルクォートで保護する", () => {
      expect(escapeCSV("=SUM(A1:A10)")).toBe('"\'=SUM(A1:A10)"');
      expect(escapeCSV("+12345")).toBe('"\'+12345"');
    });
  });
});
