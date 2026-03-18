"use client";

import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { MonthData } from "@/lib/calc";

function fmtMan(n: number): string {
  const man = n / 10000;
  if (Math.abs(man) >= 100) return Math.round(man).toLocaleString("ja-JP") + "万";
  return man.toFixed(1) + "万";
}

function useThemeColors() {
  if (typeof document === "undefined") return { grid: "#333", axis: "#888", tooltipBg: "#1a1a1a", tooltipBorder: "#444" };
  const isDark = document.documentElement.classList.contains("dark");
  return isDark
    ? { grid: "#333", axis: "#888", tooltipBg: "#1a1a1a", tooltipBorder: "#444" }
    : { grid: "#ddd", axis: "#666", tooltipBg: "#fff", tooltipBorder: "#ccc" };
}

interface Props {
  months: MonthData[];
  breakEvenMonth: number | null;
  compareMonths?: MonthData[];
  compareName?: string;
}

export function CashFlowChart({ months, breakEvenMonth, compareMonths, compareName }: Props) {
  const colors = useThemeColors();

  const data = months.map((m, i) => {
    const row: Record<string, number> = {
      month: m.month,
      MRR: m.mrr,
      コスト: m.totalCosts,
      キャッシュ: m.cashBalance,
    };
    if (compareMonths && compareMonths[i]) {
      row[`${compareName ?? "比較"}キャッシュ`] = compareMonths[i].cashBalance;
      row[`${compareName ?? "比較"}MRR`] = compareMonths[i].mrr;
    }
    return row;
  });

  const hasCompare = compareMonths && compareMonths.length > 0;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
        <XAxis dataKey="month" stroke={colors.axis} fontSize={11} />
        <YAxis stroke={colors.axis} fontSize={11} tickFormatter={fmtMan} />
        <Tooltip
          formatter={(value) => fmtMan(Number(value))}
          contentStyle={{ background: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: 6, fontSize: 12 }}
          labelFormatter={(label) => `${label}ヶ月目`}
        />
        <Legend fontSize={11} />
        <Area type="monotone" dataKey="キャッシュ" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} />
        <Line type="monotone" dataKey="MRR" stroke="#3b82f6" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="コスト" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
        {hasCompare && (
          <>
            <Line type="monotone" dataKey={`${compareName ?? "比較"}キャッシュ`} stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="6 3" />
            <Line type="monotone" dataKey={`${compareName ?? "比較"}MRR`} stroke="#f59e0b" strokeWidth={1} dot={false} strokeDasharray="2 2" opacity={0.6} />
          </>
        )}
        {breakEvenMonth && (
          <ReferenceLine x={breakEvenMonth} stroke="#22c55e" strokeDasharray="3 3" label={{ value: "黒字化", fill: "#22c55e", fontSize: 11 }} />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ProfitChart({ months }: { months: MonthData[] }) {
  const colors = useThemeColors();
  const data = months.map((m) => ({
    month: m.month,
    月次損益: m.profitAfterTax,
    累計損益: m.cumulativeProfit,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
        <XAxis dataKey="month" stroke={colors.axis} fontSize={11} />
        <YAxis stroke={colors.axis} fontSize={11} tickFormatter={fmtMan} />
        <Tooltip
          formatter={(value) => fmtMan(Number(value))}
          contentStyle={{ background: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: 6, fontSize: 12 }}
          labelFormatter={(label) => `${label}ヶ月目`}
        />
        <Legend fontSize={11} />
        <ReferenceLine y={0} stroke="#999" />
        <Line type="monotone" dataKey="月次損益" stroke="#f59e0b" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="累計損益" stroke="#8b5cf6" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
