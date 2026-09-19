import React from 'react';
import { prevYM, nextYM } from '../utils/calculations.js';

export const Card = ({ children, className = "" }) => (
  <section className={`rounded-2xl border border-ink-900/10 bg-white p-5 min-w-0 ${className}`}>
    {children}
  </section>
);

export const Stat = ({ label, value, tone = "" }) => {
  const isCustomTone = Boolean(tone);
  return (
    <div className={`rounded-2xl p-5 ${tone || "border border-ink-900/10 bg-white"}`}>
      <div className={`h-0.5 w-6 mb-2 rounded-full ${isCustomTone ? "bg-white/40" : "bg-sumi-600"}`} />
      <p className={`text-xs font-semibold tracking-wide ${isCustomTone ? "text-white/80" : "text-ink-500"}`}>{label}</p>
      <p className={`mt-1 text-2xl font-bold font-mono tabular-nums ${isCustomTone ? "text-white" : "text-ink-900"}`}>{value}</p>
    </div>
  );
};

// iOS Safari ズーム対策: text-base (16px) を適用
export const Money = ({ value, onChange, small = false }) => (
  <input
    type="number"
    min="0"
    inputMode="numeric"
    value={value ?? ""}
    placeholder="0"
    onFocus={(e) => e.target.select()}
    onChange={(e) => onChange(e.target.value)}
    className={`${small ? "w-28" : "w-36"} rounded-xl border border-ink-900/15 bg-white px-3 py-2 text-right text-base font-semibold font-mono tabular-nums text-ink-900 outline-none focus:border-sumi-600 focus:ring-2 focus:ring-sumi-100 transition-all`}
  />
);

export const SignedMoney = ({ value, onChange, small = false }) => (
  <input
    type="number"
    inputMode="decimal"
    value={value ?? ""}
    placeholder="0"
    onFocus={(e) => e.target.select()}
    onChange={(e) => onChange(e.target.value)}
    className={`${small ? "w-28" : "w-36"} rounded-xl border border-ink-900/15 bg-white px-3 py-2 text-right text-base font-semibold font-mono tabular-nums text-ink-900 outline-none focus:border-sumi-600 focus:ring-2 focus:ring-sumi-100 transition-all`}
  />
);

export const Decimal = ({ value, onChange }) => (
  <input
    type="number"
    step="0.1"
    min="0"
    inputMode="decimal"
    value={value ?? ""}
    onFocus={(e) => e.target.select()}
    onChange={(e) => onChange(e.target.value)}
    className="w-24 rounded-xl border border-ink-900/15 bg-white px-3 py-2 text-right text-base font-semibold font-mono tabular-nums text-ink-900 outline-none focus:border-sumi-600 focus:ring-2 focus:ring-sumi-100 transition-all"
  />
);

export const Text = ({ value, onChange, placeholder = "" }) => (
  <input
    type="text"
    value={value ?? ""}
    placeholder={placeholder}
    onFocus={(e) => e.target.select()}
    onChange={(e) => onChange(e.target.value)}
    className="w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2 text-base font-medium text-ink-900 outline-none focus:border-sumi-600 focus:ring-2 focus:ring-sumi-100 transition-all"
  />
);

export function MonthPick({ ym, setYm }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setYm(prevYM(ym))}
        className="flex items-center justify-center rounded-xl border border-ink-900/15 bg-white min-h-[44px] min-w-[44px] text-base font-bold text-ink-700 hover:bg-paper-100 hover:text-sumi-700 active:bg-sumi-50 transition-all"
        title="前月へ"
        aria-label="前月へ"
      >
        ‹
      </button>
      <label className="text-sm font-medium">
        <input
          type="month"
          value={ym}
          onChange={(e) => setYm(e.target.value)}
          className="rounded-xl border border-ink-900/15 px-3.5 py-2.5 min-h-[44px] text-base sm:text-sm font-bold font-mono text-ink-900 bg-white outline-none focus:border-sumi-600 focus:ring-2 focus:ring-sumi-100 transition-all cursor-pointer"
        />
      </label>
      <button
        type="button"
        onClick={() => setYm(nextYM(ym))}
        className="flex items-center justify-center rounded-xl border border-ink-900/15 bg-white min-h-[44px] min-w-[44px] text-base font-bold text-ink-700 hover:bg-paper-100 hover:text-sumi-700 active:bg-sumi-50 transition-all"
        title="翌月へ"
        aria-label="翌月へ"
      >
        ›
      </button>
    </div>
  );
}
