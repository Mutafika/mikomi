"use client";

import type { SimState } from "@/types";

interface Props {
  state: SimState;
}

interface Check {
  label: string;
  done: boolean;
}

export function ProgressBar({ state }: Props) {
  const checks: Check[] = [
    { label: "料金プラン", done: state.revenueModel.plans.length > 0 },
    { label: "初期資金", done: state.initialCash > 0 },
    { label: "固定費", done: state.fixedCosts.length > 0 },
    { label: "初期費用", done: state.oneTimeCosts.length > 0 },
    { label: "採用計画", done: state.employees.length > 0 },
    { label: "融資", done: state.loans.length > 0 },
    { label: "税金設定", done: state.tax.corporateTaxRate > 0 },
  ];

  const doneCount = checks.filter((c) => c.done).length;
  const percent = Math.round((doneCount / checks.length) * 100);
  const missing = checks.filter((c) => !c.done);

  if (percent === 100) return null;

  return (
    <div data-print="hide" className="border border-border rounded-lg p-3 mb-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-sm font-medium">シミュレーション精度</span>
        <span className="text-sm font-bold text-blue-400">{percent}%</span>
        <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>
      {missing.length > 0 && (
        <p className="text-xs text-muted">
          未設定: {missing.map((m) => m.label).join("、")}
        </p>
      )}
    </div>
  );
}
