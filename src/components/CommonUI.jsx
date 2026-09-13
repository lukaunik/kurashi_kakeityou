import React from 'react';
import { prevYM, nextYM } from '../utils/calculations.js';

export const Card = ({ children, className = "" }) => (
  <section className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm min-w-0 ${className}`}>
    {children}
  </section>
);

export const Stat = ({ label, value, tone = "" }) => (
  <div className={`rounded-2xl p-4 shadow-sm ${tone || "border border-slate-200 bg-white"}`}>
    <p className="text-sm opacity-70">{label}</p>
    <p className="mt-1 text-xl font-bold">{value}</p>
  </div>
);

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
    className={`${small ? "w-28 sm:w-28" : "w-36 sm:w-36"} rounded-lg border border-slate-300 bg-white px-3 py-2 text-right text-base font-semibold outline-none focus:border-indigo-500`}
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
    className={`${small ? "w-28 sm:w-28" : "w-36 sm:w-36"} rounded-lg border border-slate-300 bg-white px-3 py-2 text-right text-base font-semibold outline-none focus:border-indigo-500`}
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
    className="w-24 rounded border border-slate-300 px-2 py-1.5 text-right text-base outline-none focus:border-indigo-500"
  />
);

export const Text = ({ value, onChange, placeholder = "" }) => (
  <input
    type="text"
    value={value ?? ""}
    placeholder={placeholder}
    onFocus={(e) => e.target.select()}
    onChange={(e) => onChange(e.target.value)}
    className="w-full rounded border border-slate-300 px-2 py-1.5 text-base outline-none focus:border-indigo-500"
  />
);

export function MonthPick({ ym, setYm }) {
  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={() => setYm(prevYM(ym))}
        className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 active:bg-slate-100"
        title="前月へ"
      >
        ‹
      </button>
      <label className="text-sm font-medium">
        <input
          type="month"
          value={ym}
          onChange={(e) => setYm(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-base sm:text-sm font-semibold"
        />
      </label>
      <button
        type="button"
        onClick={() => setYm(nextYM(ym))}
        className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 active:bg-slate-100"
        title="翌月へ"
      >
        ›
      </button>
    </div>
  );
}
