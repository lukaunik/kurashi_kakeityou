export const n = (v) => Number(String(v ?? "").replace(/[^0-9.-]/g, "")) || 0;
export const p = (v) => Math.max(0, n(v));

export const yen = (v) =>
  new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(p(v));

export const signedYen = (v) =>
  `${n(v) < 0 ? "-" : ""}${yen(Math.abs(n(v)))}`;

// 日本時間 (JST) 基準の YYYY-MM
export const nowYM = () => {
  const d = new Date();
  const jst = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
  }).format(d);
  // jst is formatted as "YYYY/MM" in ja-JP
  return jst.replace("/", "-");
};

export const prevYM = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const nextYM = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const generateId = (prefix = "id") => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

export const blank = () => ({
  expenses: {},
  billAmounts: {},
  balances: {},
  incomeItems: [],
  tempExpenses: [],
  securities: [],
  recoveredAmount: 0,
  settlementStatus: "unpaid", // 'unpaid' | 'paid'
});

export const initial = {
  settings: { settlementStart: 10, cashStart: 15, lastBackupDate: null },
  categories: [
    { id: 1, name: "食費", budget: 50000, recovery: "half", recoveryAmount: 0 },
    { id: 2, name: "日用品", budget: 15000, recovery: "half", recoveryAmount: 0 },
    { id: 3, name: "光熱費", budget: 20000, recovery: "half", recoveryAmount: 0 },
    { id: 4, name: "家賃", budget: 85000, recovery: "full", recoveryAmount: 85000 },
  ],
  bills: [
    { id: 1, name: "家賃", budget: 85000, day: 26, account: "生活口座" },
    { id: 2, name: "電気・ガス", budget: 16000, day: 10, account: "生活口座" },
    { id: 3, name: "スマホ", budget: 9000, day: 27, account: "メイン口座" },
    { id: 4, name: "クレジットカード", budget: 45000, day: 4, account: "メイン口座" },
  ],
  accounts: [
    { id: 1, name: "生活口座", balance: 150000 },
    { id: 2, name: "メイン口座", balance: 70000 },
  ],
  points: [
    { id: 1, name: "楽天ポイント", regularRate: 0.5, campaignRate: 0.75 },
    { id: 2, name: "Vポイント", regularRate: 0.5, campaignRate: 0.5 },
    { id: 3, name: "JALマイルポイント", regularRate: 1, campaignRate: 1 },
  ],
  pointBalances: {},
  monthly: {},
};

export function normalize(raw) {
  const d = raw || {};
  const monthly = {};
  Object.entries(d.monthly || {}).forEach(([ym, m]) => {
    monthly[ym] = {
      ...blank(),
      ...(m || {}),
      incomeItems: Array.isArray(m?.incomeItems)
        ? m.incomeItems
        : p(m?.income) > 0
        ? [{ id: `income-${ym}`, name: "収入", amount: p(m.income) }]
        : [],
      tempExpenses: Array.isArray(m?.tempExpenses) ? m.tempExpenses : [],
      securities: Array.isArray(m?.securities) ? m.securities : [],
    };
  });

  return {
    ...initial,
    ...d,
    settings: { ...initial.settings, ...(d.settings || {}) },
    categories: (d.categories || initial.categories).map((x) => ({
      recovery: "half",
      recoveryAmount: 0,
      ...x,
    })),
    bills: d.bills || initial.bills,
    accounts: d.accounts || initial.accounts,
    points: (d.points || initial.points).map((x) => ({
      ...x,
      regularRate: x.regularRate !== undefined ? n(x.regularRate) : 1,
      campaignRate: x.campaignRate !== undefined ? n(x.campaignRate) : 1,
    })),
    pointBalances: d.pointBalances || {},
    monthly,
  };
}

export const incomeFor = (m) =>
  (m.incomeItems || []).reduce((s, x) => s + p(x.amount), 0);

export const recoveryFor = (c, ex) =>
  c.recovery === "full"
    ? p(ex[c.id])
    : c.recovery === "fixed"
    ? p(c.recoveryAmount)
    : p(ex[c.id]) / 2;

export const billsFor = (data, m) =>
  data.bills.map((b) => ({
    ...b,
    amount: Object.prototype.hasOwnProperty.call(m.billAmounts || {}, b.id)
      ? p(m.billAmounts[b.id])
      : 0,
  }));

export const tempExpensesFor = (m) =>
  (m.tempExpenses || []).reduce((s, x) => s + p(x.amount), 0);

export const assetsFor = (data, m) => {
  const cash = data.accounts.reduce(
    (s, a) =>
      s +
      (Object.prototype.hasOwnProperty.call(m.balances || {}, a.id)
        ? p(m.balances[a.id])
        : 0),
    0
  );
  const securities = (m.securities || []).reduce((s, x) => s + p(x.value), 0);
  const profit = (m.securities || []).reduce((s, x) => s + n(x.profit), 0);
  return { cash, securities, profit, total: cash + securities };
};

export const stats = (data, key) => {
  const m = { ...blank(), ...(data.monthly[key] || {}) };
  const ex = m.expenses || {};
  const bills = billsFor(data, m);
  const life = data.categories.reduce((s, c) => s + p(ex[c.id]), 0);
  const fixed = bills.reduce((s, b) => s + b.amount, 0);
  const temp = tempExpensesFor(m);
  const spending = fixed + temp; // 精算(life)は除外し、資金管理側(固定費+臨時)のみ集計
  const income = incomeFor(m);
  const due = data.categories.reduce((s, c) => s + recoveryFor(c, ex), 0);
  const isPaid = m.settlementStatus
    ? m.settlementStatus === "paid"
    : due > 0 && p(m.recoveredAmount) >= due;
  return {
    key,
    m,
    ex,
    bills,
    life,
    fixed,
    temp,
    spending,
    totalSpending: spending,
    income,
    net: income - spending,
    due,
    recovered: p(m.recoveredAmount),
    isPaid,
    assets: assetsFor(data, m),
  };
};

// CSVエスケープ関数（ダブルクォート囲み & セルインジェクション防止）
export const escapeCSV = (val) => {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  // カンマ、改行、ダブルクォート、または先頭が =, +, -, @ の場合の保護
  const needsQuotes = /[",\r\n]/.test(str) || /^[\=\+\-\@]/.test(str);
  if (/^[\=\+\-\@]/.test(str)) {
    // スプレッドシート等での数式実行インジェクション対策として先頭にシングルクォートを付与
    str = `'${str}`;
  }
  if (needsQuotes) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};
