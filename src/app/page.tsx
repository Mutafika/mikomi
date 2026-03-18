"use client";

import { useState, useRef, useEffect } from "react";
import { useSimState } from "@/hooks/useSimState";
import { calcTimeline } from "@/lib/calc";
import type { TimelineResult } from "@/lib/calc";
import { SOCIAL_INSURANCE_RATE } from "@/types";
import type { IncentiveType, RepaymentType } from "@/types";
import { CashFlowChart, ProfitChart } from "@/components/Charts";
import { fixedCostPresets, oneTimeCostPresets, rolePresets } from "@/lib/presets";
import { ComboBox } from "@/components/ComboBox";
import { Onboarding } from "@/components/Onboarding";

const selectAll = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

function fmt(n: number): string {
  return n.toLocaleString("ja-JP");
}

function fmtMan(n: number): string {
  const man = n / 10000;
  if (Math.abs(man) >= 100) return Math.round(man).toLocaleString("ja-JP") + "万";
  return man.toFixed(1) + "万";
}

export default function Home() {
  const {
    state, scenarios, loaded, onboarded,
    completeOnboarding,
    addPlan, updatePlan, removePlan, setSimulationMonths, setInitialCash, updateTax,
    addEmployee, updateEmployee, removeEmployee,
    addFixedCost, updateFixedCost, removeFixedCost,
    addOneTimeCost, updateOneTimeCost, removeOneTimeCost,
    addLoan, updateLoan, removeLoan,
    updateActual,
    saveScenario, loadScenario, deleteScenario,
    importState,
  } = useSimState();

  const [scenarioName, setScenarioName] = useState("");
  const [compareId, setCompareId] = useState<string | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("mikomi-theme", next ? "dark" : "light");
      return next;
    });
  };

  const handleExport = () => {
    const data = JSON.stringify({ state, scenarios }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mikomi-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.state) {
          importState(data);
        }
      } catch {
        alert("ファイルの読み込みに失敗しました");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  useEffect(() => {
    const saved = localStorage.getItem("mikomi-theme");
    const dark = saved !== "light";
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">読み込み中...</p>
      </div>
    );
  }

  if (!onboarded) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  const result = calcTimeline(state);
  const lastMonth = result.months[result.months.length - 1];

  // 比較シナリオ
  const compareScenario = scenarios.find((s) => s.id === compareId);
  const compareResult = compareScenario ? calcTimeline(compareScenario.state) : null;


  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-xl font-bold">Mikomi</h1>
        <span className="text-muted text-sm">
          {activeScenarioId ? scenarios.find((s) => s.id === activeScenarioId)?.name : "未保存"}
          {compareId && <span className="ml-2 text-yellow-400">vs {scenarios.find((s) => s.id === compareId)?.name}</span>}
        </span>

        <div data-print="hide" className="flex items-center gap-1">
          <button onClick={() => setShowScenarioModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded">シナリオ</button>
          <button onClick={handleExport} className="bg-border hover:bg-surface-hover text-foreground text-sm px-2 py-1 rounded">書出</button>
          <button onClick={() => fileInputRef.current?.click()} className="bg-border hover:bg-surface-hover text-foreground text-sm px-2 py-1 rounded">取込</button>
          <button onClick={() => window.print()} className="bg-border hover:bg-surface-hover text-foreground text-sm px-2 py-1 rounded">印刷</button>
          <button onClick={toggleTheme} className="bg-border hover:bg-surface-hover text-foreground text-sm w-8 py-1 rounded text-center">{isDark ? "☀" : "☾"}</button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        </div>
      </div>

      {/* シナリオドロワー */}
      {showScenarioModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowScenarioModal(false)}>
          <div className="bg-background border border-border rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">シナリオ</h2>
              <button onClick={() => setShowScenarioModal(false)} className="text-muted hover:text-foreground text-xl">✕</button>
            </div>

            {/* 保存 */}
            <div className="mb-5">
              <p className="text-sm text-muted mb-2">現在の設定を保存</p>
              <div className="flex gap-2">
                <input
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="シナリオ名"
                  className="border border-border rounded px-3 py-2 text-sm flex-1"
                />
                <button
                  onClick={() => { if (scenarioName.trim()) { saveScenario(scenarioName.trim()); setScenarioName(""); } }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded"
                >保存</button>
              </div>
            </div>

            {/* 一覧 */}
            <p className="text-sm text-muted mb-2">保存済み</p>
            {scenarios.length === 0 ? (
              <p className="text-muted text-sm py-4">なし</p>
            ) : (
              <div className="space-y-2">
                {scenarios.map((s) => (
                  <div key={s.id} className={`p-3 rounded border ${activeScenarioId === s.id ? "border-blue-500 bg-blue-500/10" : compareId === s.id ? "border-yellow-400 bg-yellow-400/10" : "border-border"}`}>
                    <p className="font-medium mb-2">
                      {activeScenarioId === s.id && <span className="text-blue-400 mr-1">●</span>}
                      {compareId === s.id && <span className="text-yellow-400 mr-1">◆</span>}
                      {s.name}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { loadScenario(s.id); setActiveScenarioId(s.id); setShowScenarioModal(false); }}
                        className={`text-sm px-3 py-1 rounded flex-1 ${activeScenarioId === s.id ? "bg-blue-600 text-white" : "bg-surface hover:bg-surface-hover border border-border"}`}
                      >{activeScenarioId === s.id ? "選択中" : "選択"}</button>
                      <button
                        onClick={() => setCompareId(compareId === s.id ? null : s.id)}
                        className={`text-sm px-3 py-1 rounded flex-1 ${compareId === s.id ? "bg-yellow-500 text-black" : "bg-surface hover:bg-surface-hover border border-border"}`}
                      >{compareId === s.id ? "比較中" : "比較"}</button>
                      <button
                        onClick={() => { if (confirm(`「${s.name}」を削除？`)) { deleteScenario(s.id); if (activeScenarioId === s.id) setActiveScenarioId(null); if (compareId === s.id) setCompareId(null); } }}
                        className="text-red-400 hover:text-red-300 text-sm px-2"
                      >✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* KPIカード */}
      <div data-section="kpi" className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <KpiCard label="単月黒字化" value={result.breakEvenMonth ? `${result.breakEvenMonth}ヶ月目` : "期間内に達成せず"} color={result.breakEvenMonth ? "text-green-400" : "text-red-400"} />
        <KpiCard label="最終月MRR" value={lastMonth ? fmtMan(lastMonth.mrr) : "-"} color="text-blue-400" />
        <KpiCard label="最終月キャッシュ" value={lastMonth ? fmtMan(lastMonth.cashBalance) : "-"} color={lastMonth && lastMonth.cashBalance >= 0 ? "text-green-400" : "text-red-400"} />
        <KpiCard
          label={result.runway !== null ? "ランウェイ" : "資金枯渇"}
          value={result.cashOutMonth ? `${result.cashOutMonth}ヶ月目に枯渇` : result.runway !== null ? `残り${result.runway}ヶ月` : "安全"}
          color={result.cashOutMonth ? "text-red-400" : "text-green-400"}
        />
        {state.loans.length > 0 && (
          <KpiCard label="ローン残高" value={fmtMan(result.totalLoanBalance)} color={result.totalLoanBalance > 0 ? "text-yellow-400" : "text-green-400"} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左: 入力 */}
        <div data-print="hide" className="space-y-4 lg:col-span-1">
          {/* 基本設定 */}
          <section className="border border-border rounded-lg p-4">
            <h2 className="text-base font-semibold mb-3">基本設定</h2>
            <div className="space-y-3">
              <NumberInput label="初期資金" value={state.initialCash} onChange={setInitialCash} step={1000000} suffix="円" />
              <NumberInput label="シミュレーション期間" value={state.simulationMonths} onChange={setSimulationMonths} step={6} suffix="ヶ月" min={6} max={60} />
            </div>
          </section>

          {/* 税金 */}
          <section className="border border-border rounded-lg p-4">
            <h2 className="text-base font-semibold mb-3">税金</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm text-muted shrink-0">法人税実効税率</label>
                <div className="flex items-center gap-1.5">
                  <input type="number" value={state.tax.corporateTaxRate ? (state.tax.corporateTaxRate * 100).toFixed(0) : ""} onChange={(e) => updateTax({ corporateTaxRate: Number(e.target.value) / 100 })} onFocus={selectAll} className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1.5 text-sm text-right w-36" step={1} min={0} max={100} />
                  <span className="text-muted text-sm w-8">%</span>
                </div>
              </div>
              <p className="text-sm text-muted-light text-right">中小企業: 約25%</p>
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm text-muted shrink-0">消費税率</label>
                <div className="flex items-center gap-1.5">
                  <input type="number" value={state.tax.consumptionTaxRate ? (state.tax.consumptionTaxRate * 100).toFixed(0) : ""} onChange={(e) => updateTax({ consumptionTaxRate: Number(e.target.value) / 100 })} onFocus={selectAll} className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1.5 text-sm text-right w-36" step={1} min={0} max={100} />
                  <span className="text-muted text-sm w-8">%</span>
                </div>
              </div>
              <NumberInput label="消費税免税期間" value={state.tax.consumptionTaxExemptMonths} onChange={(v) => updateTax({ consumptionTaxExemptMonths: v })} step={12} suffix="ヶ月" min={0} />
              <p className="text-sm text-muted-light text-right">資本金1000万未満: 最大24ヶ月免税</p>
            </div>
          </section>

          {/* 売上モデル */}
          <section className="border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">料金プラン ({state.revenueModel.plans.length})</h2>
              <button onClick={() => addPlan({ name: `プラン${state.revenueModel.plans.length + 1}`, unitPrice: 10000, initialCustomers: 0, monthlyNewCustomers: 5, monthlyChurnRate: 0.03 })} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-2.5 py-1 rounded">+ 追加</button>
            </div>
            {state.revenueModel.plans.length === 0 && <p className="text-muted text-sm">プランを追加してMRRをシミュレーション</p>}
            <div className="space-y-3">
              {state.revenueModel.plans.map((plan) => (
                <div key={plan.id} className="bg-surface rounded p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input value={plan.name} onChange={(e) => updatePlan(plan.id, { name: e.target.value })} placeholder="プラン名" className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1.5 text-sm flex-1" />
                    <button onClick={() => removePlan(plan.id)} className="text-red-400 hover:text-red-300 text-sm px-1.5">×</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-sm text-muted">月額単価</label><input type="number" value={plan.unitPrice || ""} onChange={(e) => updatePlan(plan.id, { unitPrice: Number(e.target.value) })} onFocus={selectAll} className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm text-right w-full" step={1000} /></div>
                    <div><label className="text-sm text-muted">初期顧客数</label><input type="number" value={plan.initialCustomers || ""} onChange={(e) => updatePlan(plan.id, { initialCustomers: Number(e.target.value) })} onFocus={selectAll} className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm text-right w-full" step={1} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-sm text-muted">月間新規獲得</label><input type="number" value={plan.monthlyNewCustomers || ""} onChange={(e) => updatePlan(plan.id, { monthlyNewCustomers: Number(e.target.value) })} onFocus={selectAll} className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm text-right w-full" step={1} /></div>
                    <div><label className="text-sm text-muted">月間解約率</label><div className="flex items-center gap-1"><input type="number" value={plan.monthlyChurnRate ? (plan.monthlyChurnRate * 100).toFixed(1) : ""} onChange={(e) => updatePlan(plan.id, { monthlyChurnRate: Number(e.target.value) / 100 })} onFocus={selectAll} className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm text-right flex-1" step={0.5} min={0} max={100} /><span className="text-sm text-muted">%</span></div></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 社員 */}
          <section className="border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">採用計画 ({state.employees.length}人)</h2>
              <button onClick={() => addEmployee({ name: `社員${state.employees.length + 1}`, role: "エンジニア", monthlySalary: 300000, hireMonth: 6, onboardingCost: 200000, annualRaiseRate: 0.03, monthlyAcquisition: 0, rampUpMonths: 0, incentive: { type: "none", rate: 0, fixedAmount: 0 } })} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-2.5 py-1 rounded">+ 追加</button>
            </div>
            {state.employees.length === 0 && <p className="text-muted text-sm">社員を追加してタイムラインに配置</p>}
            <div className="space-y-3">
              {state.employees.map((emp) => {
                const isSales = emp.monthlyAcquisition > 0 || ["営業", "セールス"].some((k) => emp.role.includes(k));
                return (
                  <div key={emp.id} className="bg-surface rounded p-3 space-y-2">
                    {/* 名前・役職 */}
                    <div className="flex gap-2">
                      <input value={emp.name} onChange={(e) => updateEmployee(emp.id, { name: e.target.value })} placeholder="名前" className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm flex-1" />
                      <ComboBox value={emp.role} options={rolePresets.map((r) => ({ name: r }))} onChange={(name) => updateEmployee(emp.id, { role: name })} placeholder="役職" className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm w-full" />
                      <button onClick={() => removeEmployee(emp.id)} className="text-red-400 hover:text-red-300 text-sm px-1.5">×</button>
                    </div>

                    {/* 基本情報 */}
                    <div className="grid grid-cols-4 gap-2">
                      <div><label className="text-sm text-muted">月給</label><input type="number" value={emp.monthlySalary || ""} onChange={(e) => updateEmployee(emp.id, { monthlySalary: Number(e.target.value) })} onFocus={selectAll} className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm text-right w-full" step={10000} /></div>
                      <div><label className="text-sm text-muted">採用月</label><input type="number" value={emp.hireMonth || ""} onChange={(e) => updateEmployee(emp.id, { hireMonth: Number(e.target.value) })} onFocus={selectAll} className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm text-right w-full" min={1} max={state.simulationMonths} /></div>
                      <div><label className="text-sm text-muted">入社コスト</label><input type="number" value={emp.onboardingCost || ""} onChange={(e) => updateEmployee(emp.id, { onboardingCost: Number(e.target.value) })} onFocus={selectAll} className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm text-right w-full" step={10000} /></div>
                      <div><label className="text-sm text-muted">昇給率</label><div className="flex items-center gap-1"><input type="number" value={emp.annualRaiseRate ? (emp.annualRaiseRate * 100).toFixed(0) : ""} onChange={(e) => updateEmployee(emp.id, { annualRaiseRate: Number(e.target.value) / 100 })} onFocus={selectAll} className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm text-right flex-1" step={1} min={0} /><span className="text-sm text-muted">%</span></div></div>
                    </div>

                    {/* 顧客獲得トグル */}
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSales}
                          onChange={(e) => {
                            if (!e.target.checked) {
                              updateEmployee(emp.id, { monthlyAcquisition: 0, rampUpMonths: 0, incentive: { type: "none", rate: 0, fixedAmount: 0 } });
                            } else {
                              updateEmployee(emp.id, { monthlyAcquisition: 5 });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-muted">顧客獲得あり</span>
                      </label>
                    </div>

                    {/* 営業設定 */}
                    {isSales && (
                      <div className="border-t border-border-light pt-2 space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <div><label className="text-sm text-muted">獲得/月</label><input type="number" value={emp.monthlyAcquisition || ""} onChange={(e) => updateEmployee(emp.id, { monthlyAcquisition: Number(e.target.value) })} onFocus={selectAll} className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm text-right w-full" step={1} min={0} /></div>
                          <div><label className="text-sm text-muted">立ち上がり</label><div className="flex items-center gap-1"><input type="number" value={emp.rampUpMonths || ""} onChange={(e) => updateEmployee(emp.id, { rampUpMonths: Number(e.target.value) })} onFocus={selectAll} className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm text-right flex-1" step={1} min={0} /><span className="text-sm text-muted">月</span></div></div>
                          <div><label className="text-sm text-muted">歩合</label><select value={emp.incentive.type} onChange={(e) => updateEmployee(emp.id, { incentive: { ...emp.incentive, type: e.target.value as IncentiveType } })} className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm w-full"><option value="none">なし</option><option value="one-time">初月MRR×%</option><option value="recurring">継続MRR×%</option><option value="fixed">固定額/社</option></select></div>
                        </div>
                        {emp.incentive.type !== "none" && (
                          <div className="flex items-center gap-2">
                            {(emp.incentive.type === "one-time" || emp.incentive.type === "recurring") && (
                              <div className="flex items-center gap-1 flex-1"><span className="text-sm text-muted">率</span><input type="number" value={emp.incentive.rate ? (emp.incentive.rate * 100).toFixed(0) : ""} onChange={(e) => updateEmployee(emp.id, { incentive: { ...emp.incentive, rate: Number(e.target.value) / 100 } })} onFocus={selectAll} className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm text-right flex-1" step={5} min={0} max={100} /><span className="text-sm text-muted">%</span></div>
                            )}
                            {emp.incentive.type === "fixed" && (
                              <div className="flex items-center gap-1 flex-1"><span className="text-sm text-muted">額</span><input type="number" value={emp.incentive.fixedAmount || ""} onChange={(e) => updateEmployee(emp.id, { incentive: { ...emp.incentive, fixedAmount: Number(e.target.value) } })} onFocus={selectAll} className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm text-right flex-1" step={1000} /><span className="text-sm text-muted">円/社</span></div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* サマリー */}
                    <p className="text-sm text-muted">
                      実コスト {fmt(Math.round(emp.monthlySalary * (1 + SOCIAL_INSURANCE_RATE)))}円/月
                      {emp.onboardingCost > 0 && ` + 初期${fmtMan(emp.onboardingCost)}`}
                      {emp.monthlyAcquisition > 0 && ` / 獲得+${emp.monthlyAcquisition}社/月`}
                      {emp.rampUpMonths > 0 && `（${emp.rampUpMonths}ヶ月で100%）`}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 固定費 */}
          <section className="border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">固定費</h2>
              <button onClick={() => addFixedCost({ name: "", monthlyAmount: 0 })} className="bg-muted hover:bg-muted-light text-white text-sm px-2.5 py-1 rounded">+ 追加</button>
            </div>
            <div className="space-y-2">
              {state.fixedCosts.map((cost) => (
                <div key={cost.id} className="flex items-center gap-2">
                  <ComboBox value={cost.name} options={fixedCostPresets} onChange={(name, amount) => updateFixedCost(cost.id, { name, ...(amount != null ? { monthlyAmount: amount } : {}) })} placeholder="項目名" className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm w-full" />
                  <input type="number" value={cost.monthlyAmount || ""} onChange={(e) => updateFixedCost(cost.id, { monthlyAmount: Number(e.target.value) })} onFocus={selectAll} className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm text-right w-28" step={10000} />
                  <button onClick={() => removeFixedCost(cost.id)} className="text-red-400 hover:text-red-300 text-sm px-1.5">×</button>
                </div>
              ))}
            </div>
          </section>

          {/* 初期費用・設備投資 */}
          <section className="border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">初期費用・設備投資</h2>
              <button onClick={() => addOneTimeCost({ name: "", amount: 0, month: 1 })} className="bg-muted hover:bg-muted-light text-white text-sm px-2.5 py-1 rounded">+ 追加</button>
            </div>
            {state.oneTimeCosts.length === 0 && <p className="text-muted text-sm">設立費、PC、オフィス備品など</p>}
            <div className="space-y-2">
              {state.oneTimeCosts.map((cost) => (
                <div key={cost.id} className="flex items-center gap-2">
                  <ComboBox value={cost.name} options={oneTimeCostPresets} onChange={(name, amount) => updateOneTimeCost(cost.id, { name, ...(amount != null ? { amount } : {}) })} placeholder="項目名" className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm w-full" />
                  <input type="number" value={cost.amount || ""} onChange={(e) => updateOneTimeCost(cost.id, { amount: Number(e.target.value) })} onFocus={selectAll} className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm text-right w-24" step={10000} />
                  <input type="number" value={cost.month || ""} onChange={(e) => updateOneTimeCost(cost.id, { month: Number(e.target.value) })} onFocus={selectAll} className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm text-right w-12" min={1} max={state.simulationMonths} />
                  <span className="text-sm text-muted">月目</span>
                  <button onClick={() => removeOneTimeCost(cost.id)} className="text-red-400 hover:text-red-300 text-sm px-1.5">×</button>
                </div>
              ))}
            </div>
          </section>

          {/* 融資 */}
          <section className="border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">融資 ({state.loans.length}件)</h2>
              <button onClick={() => addLoan({ name: "借入先名", amount: 5000000, annualRate: 0.02, termMonths: 60, graceMonths: 6, startMonth: 1, repaymentType: "equal-payment" })} className="bg-muted hover:bg-muted-light text-white text-sm px-2.5 py-1 rounded">+ 追加</button>
            </div>
            {state.loans.length === 0 && <p className="text-muted text-sm">融資を追加して返済シミュレーション</p>}
            <div className="space-y-3">
              {state.loans.map((loan) => (
                <div key={loan.id} className="bg-surface rounded p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input value={loan.name} onChange={(e) => updateLoan(loan.id, { name: e.target.value })} placeholder="例: 日本政策金融公庫" className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1.5 text-sm flex-1" />
                    <button onClick={() => removeLoan(loan.id)} className="text-red-400 hover:text-red-300 text-sm px-1.5">×</button>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted shrink-0">借入額</span>
                    <div className="flex items-center gap-1.5">
                      <input type="number" value={loan.amount || ""} onChange={(e) => updateLoan(loan.id, { amount: Number(e.target.value) })} onFocus={selectAll} className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1.5 text-sm text-right w-32" step={100000} />
                      <span className="text-sm text-muted shrink-0">円</span>
                    </div>
                    <span className="text-sm text-muted shrink-0">年利</span>
                    <div className="flex items-center gap-1.5">
                      <input type="number" value={loan.annualRate ? (loan.annualRate * 100).toFixed(1) : ""} onChange={(e) => updateLoan(loan.id, { annualRate: Number(e.target.value) / 100 })} onFocus={selectAll} className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1.5 text-sm text-right w-20" step={0.1} min={0} />
                      <span className="text-sm text-muted shrink-0">%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted shrink-0">返済</span>
                    <div className="flex items-center gap-1.5">
                      <input type="number" value={loan.termMonths || ""} onChange={(e) => updateLoan(loan.id, { termMonths: Number(e.target.value) })} onFocus={selectAll} className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1.5 text-sm text-right w-16" step={12} min={1} />
                      <span className="text-sm text-muted shrink-0">月</span>
                    </div>
                    <span className="text-sm text-muted shrink-0">据置</span>
                    <div className="flex items-center gap-1.5">
                      <input type="number" value={loan.graceMonths || ""} onChange={(e) => updateLoan(loan.id, { graceMonths: Number(e.target.value) })} onFocus={selectAll} className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1.5 text-sm text-right w-16" step={1} min={0} />
                      <span className="text-sm text-muted shrink-0">月</span>
                    </div>
                    <span className="text-sm text-muted shrink-0">借入月</span>
                    <div className="flex items-center gap-1.5">
                      <input type="number" value={loan.startMonth || ""} onChange={(e) => updateLoan(loan.id, { startMonth: Number(e.target.value) })} onFocus={selectAll} className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1.5 text-sm text-right w-16" min={1} max={state.simulationMonths} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted shrink-0">返済方式</span>
                    <select value={loan.repaymentType} onChange={(e) => updateLoan(loan.id, { repaymentType: e.target.value as RepaymentType })} className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1.5 text-sm"><option value="equal-payment">元利均等</option><option value="equal-principal">元金均等</option></select>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 右: タイムライン */}
        <div data-panel="timeline" className="lg:col-span-2 space-y-6">
          {/* プロジェクト概要 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* プラン一覧 */}
            <section className="border border-border rounded-lg p-4">
              <h2 className="text-base font-semibold mb-3">料金プラン</h2>
              {state.revenueModel.plans.length === 0 ? (
                <p className="text-muted text-sm">プランなし</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted border-b border-border">
                      <th className="text-left py-1">プラン</th>
                      <th className="text-right py-1">単価</th>
                      <th className="text-right py-1">顧客数</th>
                      <th className="text-right py-1">MRR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.revenueModel.plans.map((plan) => {
                      const lastPlanCustomers = lastMonth ? Math.round(lastMonth.customers * (plan.initialCustomers + plan.monthlyNewCustomers * state.simulationMonths) / Math.max(1, state.revenueModel.plans.reduce((s, p) => s + p.initialCustomers + p.monthlyNewCustomers * state.simulationMonths, 0))) : plan.initialCustomers;
                      return (
                        <tr key={plan.id} className="border-b border-border-light">
                          <td className="py-1.5 font-medium">{plan.name}</td>
                          <td className="py-1.5 text-right">{plan.unitPrice.toLocaleString()}円</td>
                          <td className="py-1.5 text-right">{plan.initialCustomers}→{plan.monthlyNewCustomers}/月</td>
                          <td className="py-1.5 text-right">{fmtMan(plan.initialCustomers * plan.unitPrice)}</td>
                        </tr>
                      );
                    })}
                    <tr className="font-semibold">
                      <td className="py-1.5">合計</td>
                      <td></td>
                      <td className="py-1.5 text-right">{state.revenueModel.plans.reduce((s, p) => s + p.initialCustomers, 0)}社</td>
                      <td className="py-1.5 text-right">{fmtMan(state.revenueModel.plans.reduce((s, p) => s + p.initialCustomers * p.unitPrice, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </section>

            {/* リソース概要 */}
            <section className="border border-border rounded-lg p-4">
              <h2 className="text-base font-semibold mb-3">リソース概要</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">社員</span>
                  <span>{state.employees.length}人（月額 {fmtMan(state.employees.reduce((s, e) => s + e.monthlySalary, 0))}）</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">固定費</span>
                  <span>{fmtMan(state.fixedCosts.reduce((s, c) => s + c.monthlyAmount, 0))}/月</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">初期費用</span>
                  <span>{state.oneTimeCosts.length}件（{fmtMan(state.oneTimeCosts.reduce((s, c) => s + c.amount, 0))}）</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">融資</span>
                  <span>{state.loans.length}件（{fmtMan(state.loans.reduce((s, l) => s + l.amount, 0))}）</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="text-muted">初期資金</span>
                  <span className="font-semibold">{fmtMan(state.initialCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">期間</span>
                  <span>{state.simulationMonths}ヶ月</span>
                </div>
              </div>
            </section>
          </div>

          {/* キャッシュフローグラフ */}
          <section data-section="chart" className="border border-border rounded-lg p-4">
            <h2 className="text-base font-semibold mb-3">キャッシュフロー推移</h2>
            <CashFlowChart months={result.months} breakEvenMonth={result.breakEvenMonth} compareMonths={compareResult?.months} compareName={compareScenario?.name} />
          </section>

          {/* 損益グラフ */}
          <section className="border border-border rounded-lg p-4">
            <h2 className="text-base font-semibold mb-3">月次損益 / 累計損益</h2>
            <ProfitChart months={result.months} />
          </section>

          {/* 損益分岐分析 */}
          <section className="border border-border rounded-lg p-4">
            <h2 className="text-base font-semibold mb-3">損益分岐分析（最終月ベース）</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted mb-1">損益分岐顧客数</p>
                <p className="text-xl font-bold">{result.breakEvenAnalysis.breakEvenCustomers}社</p>
              </div>
              <div>
                <p className="text-muted mb-1">損益分岐MRR</p>
                <p className="text-xl font-bold">{fmtMan(result.breakEvenAnalysis.breakEvenMrr)}</p>
              </div>
              <div>
                <p className="text-muted mb-1">現在の顧客数</p>
                <p className="text-xl font-bold">{result.breakEvenAnalysis.currentCustomers}社</p>
              </div>
              <div>
                <p className="text-muted mb-1">余裕</p>
                <p className={`text-xl font-bold ${result.breakEvenAnalysis.margin >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {result.breakEvenAnalysis.margin >= 0 ? "+" : ""}{result.breakEvenAnalysis.margin}社
                </p>
              </div>
            </div>
          </section>

          {/* 比較テーブル */}
          {compareResult && (
            <section className="border border-yellow-700/50 rounded-lg p-4">
              <h2 className="text-base font-semibold mb-3 text-yellow-400">シナリオ比較: {compareScenario?.name}</h2>
              <CompareKpis current={result} compare={compareResult} />
            </section>
          )}

          {/* テーブル */}
          <section data-section="table" className="border border-border rounded-lg p-4 overflow-x-auto">
            <h2 className="text-base font-semibold mb-3">月次詳細</h2>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted border-b border-border">
                  <th className="text-left py-2 pr-3">月</th>
                  <th className="text-right py-2 px-2">顧客数</th>
                  <th className="text-right py-2 px-2">MRR</th>
                  <th className="text-right py-2 px-2">人件費</th>
                  <th className="text-right py-2 px-2">歩合</th>
                  <th className="text-right py-2 px-2">固定費</th>
                  <th className="text-right py-2 px-2">返済</th>
                  <th className="text-right py-2 px-2">税金</th>
                  <th className="text-right py-2 px-2">損益</th>
                  <th className="text-right py-2 px-2">キャッシュ</th>
                  <th className="text-left py-2 pl-3">イベント</th>
                </tr>
              </thead>
              <tbody>
                {result.months.map((m) => {
                  const hiredThisMonth = state.employees.filter((e) => e.hireMonth === m.month);
                  const oneTimeThisMonth = state.oneTimeCosts.filter((c) => c.month === m.month);
                  const isBreakEven = result.breakEvenMonth === m.month;
                  const isCashOut = result.cashOutMonth === m.month;
                  const totalTax = m.corporateTax + m.consumptionTax;
                  return (
                    <tr key={m.month} className={`border-b border-border-light ${isCashOut ? "bg-red-900/20" : isBreakEven ? "bg-green-900/20" : ""}`}>
                      <td className="py-1.5 pr-3 font-medium">{m.month}</td>
                      <td className="py-1.5 px-2 text-right">{m.customers}</td>
                      <td className="py-1.5 px-2 text-right">{fmtMan(m.mrr)}</td>
                      <td className="py-1.5 px-2 text-right text-muted">{m.totalSalary + m.totalSocialInsurance > 0 ? fmtMan(m.totalSalary + m.totalSocialInsurance) : "-"}</td>
                      <td className="py-1.5 px-2 text-right text-muted">{m.totalIncentive > 0 ? fmtMan(m.totalIncentive) : "-"}</td>
                      <td className="py-1.5 px-2 text-right text-muted">{fmtMan(m.totalFixedCosts)}</td>
                      <td className="py-1.5 px-2 text-right text-muted">{m.totalLoanPayment > 0 ? fmtMan(m.totalLoanPayment) : "-"}</td>
                      <td className="py-1.5 px-2 text-right text-muted">{totalTax > 0 ? fmtMan(totalTax) : "-"}</td>
                      <td className={`py-1.5 px-2 text-right font-medium ${m.profitAfterTax >= 0 ? "text-green-400" : "text-red-400"}`}>{fmtMan(m.profitAfterTax)}</td>
                      <td className={`py-1.5 px-2 text-right font-medium ${m.cashBalance >= 0 ? "text-green-400" : "text-red-400"}`}>{fmtMan(m.cashBalance)}</td>
                      <td className="py-1.5 pl-3 text-muted">
                        {hiredThisMonth.map((e) => <span key={e.id} className="text-blue-400 mr-1">+{e.name}</span>)}
                        {oneTimeThisMonth.map((c) => <span key={c.id} className="text-orange-400 mr-1">{c.name}</span>)}
                        {m.loanDisbursement > 0 && <span className="text-yellow-400 mr-1">融資+{fmtMan(m.loanDisbursement)}</span>}
                        {isBreakEven && <span className="text-green-400">黒字化</span>}
                        {isCashOut && <span className="text-red-400">資金枯渇</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          {/* 予実比較 */}
          <section data-print={state.actuals.length === 0 ? "hide" : undefined} className="border border-border rounded-lg p-4 overflow-x-auto">
            <h2 className="text-base font-semibold mb-3">予実比較</h2>
            <p data-print="hide" className="text-sm text-muted mb-3">実績を入力すると予測との差分が表示されます</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted border-b border-border">
                  <th className="text-left py-2 pr-2">月</th>
                  <th className="text-right py-2 px-1" colSpan={3}>売上</th>
                  <th className="text-right py-2 px-1" colSpan={3}>顧客数</th>
                  <th className="text-right py-2 px-1" colSpan={3}>コスト</th>
                  <th className="text-left py-2 pl-2">メモ</th>
                </tr>
                <tr className="text-muted border-b border-border-light text-[10px]">
                  <th></th>
                  <th className="text-right px-1">予測</th>
                  <th className="text-right px-1">実績</th>
                  <th className="text-right px-1">差異</th>
                  <th className="text-right px-1">予測</th>
                  <th className="text-right px-1">実績</th>
                  <th className="text-right px-1">差異</th>
                  <th className="text-right px-1">予測</th>
                  <th className="text-right px-1">実績</th>
                  <th className="text-right px-1">差異</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {result.months.map((m) => {
                  const actual = state.actuals.find((a) => a.month === m.month);
                  const revDiff = actual?.revenue != null ? actual.revenue - m.mrr : null;
                  const custDiff = actual?.customers != null ? actual.customers - m.customers : null;
                  const costDiff = actual?.costs != null ? actual.costs - m.totalCosts : null;
                  return (
                    <tr key={m.month} className="border-b border-border-light">
                      <td className="py-1.5 pr-2 font-medium">{m.month}</td>
                      <td className="py-1.5 px-1 text-right text-muted">{fmtMan(m.mrr)}</td>
                      <td className="py-1.5 px-1">
                        <input
                          type="number"
                          value={actual?.revenue ?? ""}
                          onChange={(e) => updateActual(m.month, { revenue: e.target.value === "" ? null : Number(e.target.value) })}
                          onFocus={selectAll}
                          className="bg-zinc-800 border border-border rounded px-1 py-0.5 text-sm text-right w-20"
                          step={10000}
                        />
                      </td>
                      <td className={`py-1.5 px-1 text-right ${revDiff != null ? (revDiff >= 0 ? "text-green-400" : "text-red-400") : "text-muted-light"}`}>
                        {revDiff != null ? (revDiff >= 0 ? "+" : "") + fmtMan(revDiff) : "-"}
                      </td>
                      <td className="py-1.5 px-1 text-right text-muted">{m.customers}</td>
                      <td className="py-1.5 px-1">
                        <input
                          type="number"
                          value={actual?.customers ?? ""}
                          onChange={(e) => updateActual(m.month, { customers: e.target.value === "" ? null : Number(e.target.value) })}
                          onFocus={selectAll}
                          className="bg-zinc-800 border border-border rounded px-1 py-0.5 text-sm text-right w-14"
                          step={1}
                        />
                      </td>
                      <td className={`py-1.5 px-1 text-right ${custDiff != null ? (custDiff >= 0 ? "text-green-400" : "text-red-400") : "text-muted-light"}`}>
                        {custDiff != null ? (custDiff >= 0 ? "+" : "") + custDiff : "-"}
                      </td>
                      <td className="py-1.5 px-1 text-right text-muted">{fmtMan(m.totalCosts)}</td>
                      <td className="py-1.5 px-1">
                        <input
                          type="number"
                          value={actual?.costs ?? ""}
                          onChange={(e) => updateActual(m.month, { costs: e.target.value === "" ? null : Number(e.target.value) })}
                          onFocus={selectAll}
                          className="bg-zinc-800 border border-border rounded px-1 py-0.5 text-sm text-right w-20"
                          step={10000}
                        />
                      </td>
                      <td className={`py-1.5 px-1 text-right ${costDiff != null ? (costDiff <= 0 ? "text-green-400" : "text-red-400") : "text-muted-light"}`}>
                        {costDiff != null ? (costDiff >= 0 ? "+" : "") + fmtMan(costDiff) : "-"}
                      </td>
                      <td className="py-1.5 pl-2">
                        <input
                          value={actual?.note ?? ""}
                          onChange={(e) => updateActual(m.month, { note: e.target.value })}
                          placeholder="差異の理由"
                          className="bg-zinc-800 border border-border rounded px-1 py-0.5 text-sm w-full min-w-[100px]"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </div>
      </div>

    </div>
  );
}

function CompareKpis({ current, compare }: { current: TimelineResult; compare: TimelineResult }) {
  const cLast = current.months[current.months.length - 1];
  const pLast = compare.months[compare.months.length - 1];
  const items = [
    { label: "黒字化", c: current.breakEvenMonth ? `${current.breakEvenMonth}ヶ月目` : "-", p: compare.breakEvenMonth ? `${compare.breakEvenMonth}ヶ月目` : "-" },
    { label: "最終MRR", c: cLast ? fmtMan(cLast.mrr) : "-", p: pLast ? fmtMan(pLast.mrr) : "-" },
    { label: "最終キャッシュ", c: cLast ? fmtMan(cLast.cashBalance) : "-", p: pLast ? fmtMan(pLast.cashBalance) : "-" },
    { label: "資金枯渇", c: current.cashOutMonth ? `${current.cashOutMonth}ヶ月目` : "なし", p: compare.cashOutMonth ? `${compare.cashOutMonth}ヶ月目` : "なし" },
  ];
  return (
    <div className="grid grid-cols-4 gap-3 text-sm">
      {items.map((item) => (
        <div key={item.label}>
          <p className="text-muted mb-1">{item.label}</p>
          <p className="text-foreground">現在: {item.c}</p>
          <p className="text-yellow-400">比較: {item.p}</p>
        </div>
      ))}
    </div>
  );
}

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="border border-border rounded-lg p-3">
      <p className="text-sm text-muted mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

function NumberInput({ label, value, onChange, step, suffix, min, max }: {
  label: string; value: number; onChange: (v: number) => void; step: number; suffix: string; min?: number; max?: number;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm text-muted shrink-0">{label}</label>
      <div className="flex items-center gap-1.5">
        {editing ? (
          <input
            type="number"
            value={value || ""}
            onChange={(e) => onChange(Number(e.target.value))}
            onFocus={selectAll}
            onBlur={() => setEditing(false)}
            autoFocus
            className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1.5 text-sm text-right w-36"
            step={step} min={min} max={max}
          />
        ) : (
          <div
            onClick={() => setEditing(true)}
            className="bg-input-bg border border-border rounded px-2 py-1.5 text-sm text-right w-36 cursor-text"
          >
            {value ? value.toLocaleString("ja-JP") : ""}
          </div>
        )}
        <span className="text-muted text-sm shrink-0 w-8">{suffix}</span>
      </div>
    </div>
  );
}
