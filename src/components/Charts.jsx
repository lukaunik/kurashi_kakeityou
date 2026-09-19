import React from 'react';
import { yen, signedYen } from '../utils/calculations.js';

export function Donut({ rows, title = "生活費割合" }) {
  const total = rows.reduce((s, x) => s + x.amount, 0);
  const colors = [
    "#2C5566", // sumi-600
    "#4C7C8C", // sumi-400
    "#7C9973", // moss-400
    "#C97256", // hanko-400
    "#6E685D", // ink-500
    "#204252", // sumi-700
  ];
  let offset = 0;
  if (total <= 0)
    return (
      <div className="flex h-52 items-center justify-center text-xs text-ink-500 font-medium">
        データを入力するとグラフが表示されます。
      </div>
    );

  const segments = rows
    .filter((x) => x.amount > 0)
    .map((x, index) => {
      const percent = (x.amount / total) * 100;
      const node = (
        <circle
          key={x.id || index}
          cx="21"
          cy="21"
          r="15.9155"
          fill="transparent"
          stroke={colors[index % colors.length]}
          strokeWidth="7"
          strokeDasharray={`${percent} ${100 - percent}`}
          strokeDashoffset={-offset}
        />
      );
      offset += percent;
      return node;
    });

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row min-w-0 max-w-full">
      <svg
        viewBox="0 0 42 42"
        className="h-36 w-36 flex-shrink-0 -rotate-90 sm:h-44 sm:w-44"
      >
        <circle
          cx="21"
          cy="21"
          r="15.9155"
          fill="transparent"
          stroke="#F3F0E9"
          strokeWidth="7"
        />
        {segments}
        <circle cx="21" cy="21" r="10" fill="white" />
        <text
          x="21"
          y="20"
          textAnchor="middle"
          className="fill-ink-500 text-[3px] rotate-90 origin-center font-bold"
        >
          {title}
        </text>
        <text
          x="21"
          y="24"
          textAnchor="middle"
          className="fill-ink-900 text-[3px] font-bold font-mono rotate-90 origin-center"
        >
          {yen(total)}
        </text>
      </svg>
      <div className="w-full space-y-2 min-w-0">
        {rows.map((x, index) => (
          <div
            key={x.id || index}
            className="flex items-center justify-between gap-2 text-xs"
          >
            <span className="flex items-center gap-1.5 min-w-0 truncate">
              <i
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ background: colors[index % colors.length] }}
              />
              <span className="truncate font-medium text-ink-700">{x.name}</span>
            </span>
            <strong className="flex-shrink-0 ml-1 font-mono tabular-nums text-ink-900">
              {((x.amount / total) * 100).toFixed(1)}% ({yen(x.amount)})
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Chart({ data, color = "bg-sumi-600", signed = false }) {
  const values = data.map((x) => x.value);
  const hasNegative = signed && values.some((v) => v < 0);
  const maxVal = Math.max(...values, 1);
  const minVal = hasNegative ? Math.min(...values, 0) : 0;
  const range = hasNegative ? maxVal - minVal || 1 : maxVal;
  const minChartWidth =
    data.length > 3 ? `${Math.max(data.length * 58, 320)}px` : "100%";

  if (!hasNegative) {
    return (
      <div className="mt-4 w-full max-w-full overflow-x-auto pb-1">
        <div
          className="flex h-44 items-end gap-2 border-b border-ink-900/10 px-1"
          style={{ minWidth: minChartWidth }}
        >
          {data.map((x) => (
            <div
              key={x.label}
              className="flex min-w-[52px] flex-1 flex-col items-center justify-end gap-1"
            >
              <span className="text-[9px] sm:text-[10px] text-ink-500 font-mono tabular-nums whitespace-nowrap px-0.5">
                {signed ? signedYen(x.value) : yen(x.value)}
              </span>
              <div
                title={`${x.label}: ${
                  signed ? signedYen(x.value) : yen(x.value)
                }`}
                className={`w-full max-w-8 sm:max-w-10 rounded-t ${color}`}
                style={{ height: `${Math.max((x.value / maxVal) * 130, 2)}px` }}
              />
              <span className="whitespace-nowrap text-[10px] text-ink-500 font-mono">
                {x.label.length > 5
                  ? x.label.slice(5).replace("-", "/")
                  : x.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 負数を含む場合のゼロライン付きレイアウト
  const zeroPos = (maxVal / range) * 110;
  return (
    <div className="mt-4 w-full max-w-full overflow-x-auto pb-1">
      <div
        className="flex h-48 items-center gap-2 px-1"
        style={{ minWidth: minChartWidth }}
      >
        {data.map((x) => {
          const isNeg = x.value < 0;
          const barH = Math.max((Math.abs(x.value) / range) * 110, 2);
          return (
            <div
              key={x.label}
              className="flex min-w-[52px] flex-1 flex-col items-center justify-between h-full py-1"
            >
              <span
                className={`text-[9px] sm:text-[10px] font-mono tabular-nums whitespace-nowrap px-0.5 ${
                  isNeg
                    ? "font-bold text-hanko-500"
                    : "font-semibold text-ink-700"
                }`}
              >
                {signedYen(x.value)}
              </span>
              <div className="relative w-full h-[110px] flex items-center justify-center">
                <div
                  className="absolute w-full border-t border-ink-900/15"
                  style={{ top: `${zeroPos}px` }}
                />
                <div
                  title={`${x.label}: ${signedYen(x.value)}`}
                  className={`absolute w-full max-w-7 sm:max-w-8 ${
                    isNeg
                      ? "bg-hanko-500 rounded-b"
                      : "bg-sumi-600 rounded-t"
                  }`}
                  style={
                    isNeg
                      ? { top: `${zeroPos}px`, height: `${barH}px` }
                      : { bottom: `${110 - zeroPos}px`, height: `${barH}px` }
                  }
                />
              </div>
              <span className="whitespace-nowrap text-[10px] text-ink-500 font-mono">
                {x.label.length > 5
                  ? x.label.slice(5).replace("-", "/")
                  : x.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
