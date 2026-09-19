import React, { useState } from 'react';
import { Card, Stat, Money, SignedMoney, Text, MonthPick } from '../components/CommonUI.jsx';
import { CopyModal } from '../components/Modals.jsx';
import {
  p,
  n,
  yen,
  signedYen,
  prevYM,
  incomeFor,
  billsFor,
  tempExpensesFor,
  assetsFor,
  generateId,
} from '../utils/calculations.js';

export function Cashflow({ data, m, put, putMany, ym, setYm }) {
  const incomeItems = m.incomeItems || [];
  const securities = m.securities || [];
  const tempExpenses = m.tempExpenses || [];
  const amounts = m.billAmounts || {};
  const balances = m.balances || {};
  const bills = billsFor(data, m);

  const income = incomeFor(m);
  const fixedSpending = bills.reduce((s, b) => s + b.amount, 0);
  const tempSpending = tempExpensesFor(m);
  const spending = fixedSpending + tempSpending;
  const net = income - spending;
  const assets = assetsFor(data, m);
  const [modalOpen, setModalOpen] = useState(false);

  const setIncome = (x) => put("incomeItems", x);
  const setSecurities = (x) => put("securities", x);
  const setTempExpenses = (x) => put("tempExpenses", x);

  const resetCashflow = () => {
    if (confirm(`${ym} の資金管理データをリセットしますか？`)) {
      putMany({
        incomeItems: [],
        billAmounts: {},
        tempExpenses: [],
        securities: [],
        balances: {},
      });
    }
  };

  const copyPrevious = (opts) => {
    const previous = data.monthly[prevYM(ym)];
    if (!previous) return alert("前月の保存データがありません。");
    const updates = {};
    if (opts.bills) updates.billAmounts = { ...(previous.billAmounts || {}) };
    if (opts.incomes)
      updates.incomeItems = (previous.incomeItems || []).map((x) => ({
        ...x,
        id: generateId("income"),
      }));
    if (opts.securities)
      updates.securities = (previous.securities || []).map((x) => ({
        ...x,
        id: generateId("security"),
      }));
    putMany(updates);
  };

  const removeItem = (type, id, list, setter) => {
    if (confirm("この項目を削除しますか？")) {
      setter(list.filter((x) => x.id !== id));
    }
  };

  const prevMonthData = data.monthly[prevYM(ym)];
  const hasPrevBalances =
    prevMonthData?.balances && Object.keys(prevMonthData.balances).length > 0;

  return (
    <div className="space-y-8">
      <CopyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCopy={copyPrevious}
      />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 tracking-wide">個人資金管理</h2>
          <p className="mt-1 text-xs text-ink-500">{ym} の収支・資産管理</p>
        </div>
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
          <MonthPick ym={ym} setYm={setYm} />
          <button
            onClick={resetCashflow}
            className="rounded-xl border border-hanko-400/20 bg-hanko-50 px-3.5 py-2.5 min-h-[44px] text-xs font-bold text-hanko-600 hover:bg-hanko-50/80 transition-all"
          >
            当月リセット
          </button>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-ink-900 text-sm">収入項目</h3>
            <p className="mt-0.5 text-xs text-ink-500">
              給与・副収入などを自由に追加できます。
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-xl border border-sumi-600/30 bg-sumi-50 px-3.5 py-2.5 min-h-[44px] text-xs font-bold text-sumi-700 hover:bg-sumi-100/50 transition-all"
          >
            前月の入力値をコピー
          </button>
        </div>
        <div className="mt-4 space-y-2.5">
          {incomeItems.map((x) => (
            <div key={x.id} className="flex flex-wrap items-center gap-2">
              <Text
                value={x.name}
                placeholder="項目名"
                onChange={(v) =>
                  setIncome(
                    incomeItems.map((i) =>
                      i.id === x.id ? { ...i, name: v } : i
                    )
                  )
                }
              />
              <Money
                value={x.amount}
                onChange={(v) =>
                  setIncome(
                    incomeItems.map((i) =>
                      i.id === x.id ? { ...i, amount: p(v) } : i
                    )
                  )
                }
              />
              <button
                onClick={() =>
                  removeItem("income", x.id, incomeItems, setIncome)
                }
                className="rounded-xl px-3 py-2 text-xs font-bold text-hanko-500 hover:bg-hanko-50 transition-all"
              >
                削除
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-ink-900/5">
          <button
            onClick={() =>
              setIncome([
                ...incomeItems,
                { id: generateId("income"), name: "給与", amount: 0 },
              ])
            }
            className="rounded-xl bg-sumi-600 px-4 py-2.5 min-h-[44px] text-xs font-bold text-white shadow-sm hover:bg-sumi-700 transition-all"
          >
            ＋ 収入項目を追加
          </button>
          <strong className="text-base font-display font-bold text-ink-900 font-mono tabular-nums">
            総収入 {yen(income)}
          </strong>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="総収入"
          value={yen(income)}
          tone="bg-sumi-600 text-white shadow-sm"
        />
        <Stat label="支出合計（固定費+臨時）" value={yen(spending)} />
        <Stat
          label="月間純貯蓄（収入 − 支出）"
          value={signedYen(net)}
          tone={net < 0 ? "bg-hanko-500 text-white shadow-sm" : "bg-sumi-700 text-white shadow-sm"}
        />
      </div>

      {/* 固定費テーブル */}
      <Card className="overflow-hidden p-0">
        <div className="p-4 border-b border-ink-900/10 bg-paper-100/50">
          <h3 className="font-bold text-ink-900 text-sm">固定費・定期引き落とし</h3>
        </div>
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-paper-100 text-ink-700 font-bold border-b border-ink-900/10">
              <tr>
                <th className="px-4 py-3 text-left font-bold">名称</th>
                <th className="px-4 py-3 text-left font-bold">支払日</th>
                <th className="px-4 py-3 text-left font-bold">引落口座</th>
                <th className="px-4 py-3 text-right font-bold">今月支払額</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/5">
              {bills.map((b) => (
                <tr key={b.id} className="hover:bg-sumi-50/50 transition-colors">
                  <td className="px-4 py-3 font-bold text-ink-900">{b.name}</td>
                  <td className="px-4 py-3 font-mono text-ink-500">{b.day}日</td>
                  <td className="px-4 py-3 text-ink-500">{b.account}</td>
                  <td className="px-4 py-2 text-right">
                    <Money
                      small
                      value={b.amount}
                      onChange={(v) =>
                        put("billAmounts", { ...amounts, [b.id]: p(v) })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="sm:hidden divide-y divide-ink-900/5">
          {bills.map((b) => (
            <div key={b.id} className="p-3.5 flex items-center justify-between gap-2">
              <div>
                <p className="font-bold text-ink-900 text-sm">{b.name}</p>
                <p className="text-xs text-ink-500">
                  {b.day}日・{b.account}
                </p>
              </div>
              <Money
                small
                value={b.amount}
                onChange={(v) =>
                  put("billAmounts", { ...amounts, [b.id]: p(v) })
                }
              />
            </div>
          ))}
        </div>
      </Card>

      {/* 臨時出費 */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-hanko-600 text-sm">当月の臨時出費</h3>
            <p className="mt-0.5 text-xs text-ink-500">
              冠婚葬祭・旅行など今月限りの特別な出費を入力します。
            </p>
          </div>
          <button
            onClick={() =>
              setTempExpenses([
                ...tempExpenses,
                { id: generateId("temp"), name: "臨時出費", amount: 0 },
              ])
            }
            className="rounded-xl bg-hanko-500 px-4 py-2.5 min-h-[44px] text-xs font-bold text-white shadow-sm hover:bg-hanko-600 transition-all"
          >
            ＋ 臨時出費を追加
          </button>
        </div>
        <div className="mt-4 space-y-2.5">
          {tempExpenses.map((x) => (
            <div key={x.id} className="flex flex-wrap items-center gap-2">
              <Text
                value={x.name}
                placeholder="臨時出費名"
                onChange={(v) =>
                  setTempExpenses(
                    tempExpenses.map((t) =>
                      t.id === x.id ? { ...t, name: v } : t
                    )
                  )
                }
              />
              <Money
                value={x.amount}
                onChange={(v) =>
                  setTempExpenses(
                    tempExpenses.map((t) =>
                      t.id === x.id ? { ...t, amount: p(v) } : t
                    )
                  )
                }
              />
              <button
                onClick={() =>
                  removeItem("temp", x.id, tempExpenses, setTempExpenses)
                }
                className="rounded-xl px-3 py-2 text-xs font-bold text-hanko-500 hover:bg-hanko-50 transition-all"
              >
                削除
              </button>
            </div>
          ))}
        </div>
        {tempExpenses.length > 0 && (
          <div className="mt-4 text-right text-xs font-bold font-mono tabular-nums text-hanko-600 pt-3 border-t border-ink-900/5">
            臨時出費合計: {yen(tempSpending)}
          </div>
        )}
      </Card>

      {/* 証券口座 */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-ink-900 text-sm">証券口座・投資資産</h3>
            <p className="mt-0.5 text-xs text-ink-500">
              月ごとの評価額と含み損益を記録します。
            </p>
          </div>
          <button
            onClick={() =>
              setSecurities([
                ...securities,
                {
                  id: generateId("security"),
                  name: "証券口座",
                  value: 0,
                  profit: 0,
                },
              ])
            }
            className="rounded-xl bg-sumi-600 px-4 py-2.5 min-h-[44px] text-xs font-bold text-white shadow-sm hover:bg-sumi-700 transition-all"
          >
            ＋ 証券口座を追加
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-paper-100 text-ink-700 font-bold border-b border-ink-900/10">
              <tr>
                <th className="px-3 py-2.5 text-left font-bold">銘柄 / 口座名</th>
                <th className="px-3 py-2.5 text-left font-bold">評価額</th>
                <th className="px-3 py-2.5 text-left font-bold">含み損益</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/5">
              {securities.map((s) => (
                <tr key={s.id} className="hover:bg-sumi-50/50 transition-colors">
                  <td className="py-2 pr-2">
                    <Text
                      value={s.name}
                      onChange={(v) =>
                        setSecurities(
                          securities.map((x) =>
                            x.id === s.id ? { ...x, name: v } : x
                          )
                        )
                      }
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <Money
                      small
                      value={s.value}
                      onChange={(v) =>
                        setSecurities(
                          securities.map((x) =>
                            x.id === s.id ? { ...x, value: p(v) } : x
                          )
                        )
                      }
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <SignedMoney
                      small
                      value={s.profit}
                      onChange={(v) =>
                        setSecurities(
                          securities.map((x) =>
                            x.id === s.id ? { ...x, profit: n(v) } : x
                          )
                        )
                      }
                    />
                  </td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() =>
                        removeItem("security", s.id, securities, setSecurities)
                      }
                      className="text-xs font-bold text-hanko-500 hover:underline"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex gap-4 text-xs font-mono tabular-nums pt-3 border-t border-ink-900/5">
          <strong className="text-ink-900">証券評価額合計 {yen(assets.securities)}</strong>
          <strong
            className={assets.profit < 0 ? "text-hanko-500" : "text-ink-900"}
          >
            含み損益合計 {signedYen(assets.profit)}
          </strong>
        </div>
      </Card>

      {/* 口座残高 */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-ink-900 text-sm">口座別の不足チェック</h3>
            <p className="mt-0.5 text-xs text-ink-500">
              引き落とし予定額に対する時点残高の過不足を確認します。
            </p>
          </div>
          {hasPrevBalances && (
            <button
              type="button"
              onClick={() => {
                put("balances", { ...prevMonthData.balances });
              }}
              className="rounded-xl border border-sumi-600/30 bg-sumi-50 px-3.5 py-2.5 min-h-[44px] text-xs font-bold text-sumi-700 hover:bg-sumi-100/50 transition-all"
            >
              前月の口座残高を反映
            </button>
          )}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {data.accounts.map((a) => {
            const debit = bills
              .filter((b) => b.account === a.name)
              .reduce((s, b) => s + b.amount, 0);
            const balance = Object.prototype.hasOwnProperty.call(balances, a.id)
              ? p(balances[a.id])
              : 0;
            const remaining = balance - debit;
            const prevBalance = prevMonthData?.balances?.[a.id];
            return (
              <div
                key={a.id}
                className={`rounded-2xl border p-4 ${
                  remaining < 0
                    ? "border-hanko-400/30 bg-hanko-50/50"
                    : "border-ink-900/10 bg-white"
                }`}
              >
                <div className="flex justify-between gap-2 font-mono tabular-nums text-xs">
                  <strong className="text-ink-900 text-sm">{a.name}</strong>
                  <strong
                    className={
                      remaining < 0 ? "text-hanko-500 font-bold" : "text-ink-900 font-bold"
                    }
                  >
                    {remaining < 0
                      ? `不足 ${yen(-remaining)}`
                      : `想定残高 ${yen(remaining)}`}
                  </strong>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex flex-col">
                    <span className="font-bold text-ink-700">時点残高</span>
                    {prevBalance !== undefined &&
                      !Object.prototype.hasOwnProperty.call(balances, a.id) && (
                        <span className="text-[11px] text-ink-500 font-mono">
                          前月: {yen(prevBalance)}
                        </span>
                      )}
                  </div>
                  <Money
                    small
                    value={balance}
                    onChange={(v) =>
                      put("balances", { ...balances, [a.id]: p(v) })
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
