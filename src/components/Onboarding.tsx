"use client";

import { useState } from "react";
import type { SimState, PricingPlan } from "@/types";

interface Props {
  onComplete: (state: SimState) => void;
}

interface Template {
  id: string;
  name: string;
  emoji: string;
  description: string;
  detail: string;
  state: Partial<SimState>;
}

const templates: Template[] = [
  {
    id: "saas", name: "SaaS", emoji: "💻", description: "月額課金のWebサービス", detail: "複数プラン / エンジニア中心 / 低解約率 / 長期成長",
    state: {
      revenueModel: { type: "mrr", plans: [
        { id: "starter", name: "Starter", unitPrice: 3000, initialCustomers: 0, monthlyNewCustomers: 8, monthlyChurnRate: 0.04 },
        { id: "basic", name: "Basic", unitPrice: 10000, initialCustomers: 0, monthlyNewCustomers: 4, monthlyChurnRate: 0.03 },
        { id: "pro", name: "Pro", unitPrice: 30000, initialCustomers: 0, monthlyNewCustomers: 1, monthlyChurnRate: 0.02 },
      ]},
      employees: [
        { id: "eng1", name: "エンジニア1", role: "エンジニア", monthlySalary: 350000, hireMonth: 12, onboardingCost: 250000, annualRaiseRate: 0.03, monthlyAcquisition: 0, rampUpMonths: 0, incentive: { type: "none", rate: 0, fixedAmount: 0 } },
      ],
      fixedCosts: [{ id: "infra", name: "インフラ", monthlyAmount: 30000 }, { id: "tools", name: "開発ツール", monthlyAmount: 15000 }],
      oneTimeCosts: [{ id: "inc", name: "法人設立費", amount: 250000, month: 1 }, { id: "pc", name: "開発用PC", amount: 300000, month: 1 }],
      loans: [{ id: "jfc", name: "日本政策金融公庫", amount: 5000000, annualRate: 0.02, termMonths: 60, graceMonths: 6, startMonth: 1, repaymentType: "equal-payment" }],
      tax: { corporateTaxRate: 0.25, consumptionTaxRate: 0.10, consumptionTaxExemptMonths: 24 },
      simulationMonths: 36, initialCash: 3000000,
    },
  },
  {
    id: "agency", name: "受託・制作", emoji: "🔧", description: "Web制作やシステム開発", detail: "月額保守 / 人月ビジネス / 人件費が主コスト",
    state: {
      revenueModel: { type: "mrr", plans: [
        { id: "maintenance", name: "月額保守", unitPrice: 50000, initialCustomers: 2, monthlyNewCustomers: 1, monthlyChurnRate: 0.03 },
        { id: "small", name: "小規模案件", unitPrice: 100000, initialCustomers: 0, monthlyNewCustomers: 1, monthlyChurnRate: 0.50 },
      ]},
      employees: [{ id: "eng1", name: "エンジニア", role: "エンジニア", monthlySalary: 300000, hireMonth: 6, onboardingCost: 250000, annualRaiseRate: 0.03, monthlyAcquisition: 0, rampUpMonths: 0, incentive: { type: "none", rate: 0, fixedAmount: 0 } }],
      fixedCosts: [{ id: "rent", name: "オフィス家賃", monthlyAmount: 100000 }, { id: "tools", name: "ツール", monthlyAmount: 20000 }],
      oneTimeCosts: [{ id: "inc", name: "法人設立費", amount: 250000, month: 1 }, { id: "pc", name: "PC", amount: 500000, month: 1 }],
      loans: [{ id: "jfc", name: "日本政策金融公庫", amount: 3000000, annualRate: 0.02, termMonths: 48, graceMonths: 6, startMonth: 1, repaymentType: "equal-payment" }],
      tax: { corporateTaxRate: 0.25, consumptionTaxRate: 0.10, consumptionTaxExemptMonths: 24 },
      simulationMonths: 24, initialCash: 5000000,
    },
  },
  {
    id: "school", name: "スクール・教室", emoji: "📚", description: "プログラミング教室、学習塾など", detail: "月謝制 / 生徒数がKPI / 講師の採用がカギ",
    state: {
      revenueModel: { type: "mrr", plans: [
        { id: "kids", name: "キッズコース", unitPrice: 12000, initialCustomers: 5, monthlyNewCustomers: 3, monthlyChurnRate: 0.05 },
        { id: "adult", name: "大人コース", unitPrice: 20000, initialCustomers: 0, monthlyNewCustomers: 2, monthlyChurnRate: 0.08 },
      ]},
      employees: [{ id: "t1", name: "講師1", role: "講師", monthlySalary: 250000, hireMonth: 6, onboardingCost: 100000, annualRaiseRate: 0.02, monthlyAcquisition: 0, rampUpMonths: 0, incentive: { type: "none", rate: 0, fixedAmount: 0 } }],
      fixedCosts: [{ id: "rent", name: "教室家賃", monthlyAmount: 150000 }, { id: "util", name: "光熱費", monthlyAmount: 25000 }],
      oneTimeCosts: [{ id: "inc", name: "法人設立費", amount: 250000, month: 1 }, { id: "int", name: "内装工事", amount: 500000, month: 1 }, { id: "eq", name: "PC・机", amount: 400000, month: 1 }],
      loans: [{ id: "jfc", name: "日本政策金融公庫", amount: 5000000, annualRate: 0.015, termMonths: 60, graceMonths: 6, startMonth: 1, repaymentType: "equal-payment" }],
      tax: { corporateTaxRate: 0.25, consumptionTaxRate: 0.10, consumptionTaxExemptMonths: 24 },
      simulationMonths: 36, initialCash: 3000000,
    },
  },
  {
    id: "consulting", name: "コンサル・士業", emoji: "💼", description: "経営コンサル、税理士、社労士など", detail: "顧問契約 / 高単価 / 少数精鋭",
    state: {
      revenueModel: { type: "mrr", plans: [
        { id: "adv", name: "顧問契約", unitPrice: 100000, initialCustomers: 1, monthlyNewCustomers: 1, monthlyChurnRate: 0.02 },
        { id: "spot", name: "スポット", unitPrice: 200000, initialCustomers: 0, monthlyNewCustomers: 1, monthlyChurnRate: 0.80 },
      ]},
      employees: [],
      fixedCosts: [{ id: "rent", name: "オフィス", monthlyAmount: 80000 }, { id: "net", name: "交際費", monthlyAmount: 30000 }],
      oneTimeCosts: [{ id: "inc", name: "法人設立費", amount: 250000, month: 1 }, { id: "hp", name: "Webサイト", amount: 300000, month: 1 }],
      loans: [],
      tax: { corporateTaxRate: 0.25, consumptionTaxRate: 0.10, consumptionTaxExemptMonths: 24 },
      simulationMonths: 24, initialCash: 5000000,
    },
  },
  {
    id: "retail", name: "店舗・飲食", emoji: "🍽️", description: "カフェ、レストラン、物販店", detail: "客単価×来客数 / 家賃・仕入が重い",
    state: {
      revenueModel: { type: "mrr", plans: [
        { id: "dine", name: "店内", unitPrice: 1200, initialCustomers: 100, monthlyNewCustomers: 30, monthlyChurnRate: 0.20 },
        { id: "take", name: "テイクアウト", unitPrice: 800, initialCustomers: 30, monthlyNewCustomers: 20, monthlyChurnRate: 0.30 },
      ]},
      employees: [
        { id: "s1", name: "スタッフ", role: "ホール", monthlySalary: 200000, hireMonth: 1, onboardingCost: 50000, annualRaiseRate: 0.02, monthlyAcquisition: 0, rampUpMonths: 0, incentive: { type: "none", rate: 0, fixedAmount: 0 } },
      ],
      fixedCosts: [{ id: "rent", name: "店舗家賃", monthlyAmount: 250000 }, { id: "util", name: "光熱費", monthlyAmount: 60000 }, { id: "cogs", name: "仕入", monthlyAmount: 150000 }],
      oneTimeCosts: [{ id: "inc", name: "法人設立費", amount: 250000, month: 1 }, { id: "int", name: "内装", amount: 3000000, month: 1 }, { id: "eq", name: "設備", amount: 2000000, month: 1 }],
      loans: [{ id: "jfc", name: "日本政策金融公庫", amount: 10000000, annualRate: 0.02, termMonths: 84, graceMonths: 12, startMonth: 1, repaymentType: "equal-payment" }],
      tax: { corporateTaxRate: 0.25, consumptionTaxRate: 0.10, consumptionTaxExemptMonths: 24 },
      simulationMonths: 36, initialCash: 5000000,
    },
  },
  {
    id: "ec", name: "EC・物販", emoji: "📦", description: "ネットショップ、D2C", detail: "仕入・在庫 / 広告費 / リピート率",
    state: {
      revenueModel: { type: "mrr", plans: [
        { id: "single", name: "単品", unitPrice: 5000, initialCustomers: 0, monthlyNewCustomers: 30, monthlyChurnRate: 0.60 },
        { id: "sub", name: "定期", unitPrice: 4000, initialCustomers: 0, monthlyNewCustomers: 10, monthlyChurnRate: 0.08 },
      ]},
      employees: [],
      fixedCosts: [{ id: "wh", name: "倉庫", monthlyAmount: 50000 }, { id: "ads", name: "広告費", monthlyAmount: 100000 }, { id: "cogs", name: "仕入", monthlyAmount: 80000 }],
      oneTimeCosts: [{ id: "inc", name: "開業届", amount: 250000, month: 1 }, { id: "inv", name: "初期在庫", amount: 500000, month: 1 }, { id: "site", name: "EC構築", amount: 300000, month: 1 }],
      loans: [],
      tax: { corporateTaxRate: 0.25, consumptionTaxRate: 0.10, consumptionTaxExemptMonths: 24 },
      simulationMonths: 24, initialCash: 2000000,
    },
  },
  {
    id: "blank", name: "白紙から", emoji: "📝", description: "テンプレなし", detail: "全部自分で設定",
    state: {
      revenueModel: { type: "mrr", plans: [] },
      employees: [], fixedCosts: [], oneTimeCosts: [], loans: [],
      tax: { corporateTaxRate: 0.25, consumptionTaxRate: 0.10, consumptionTaxExemptMonths: 24 },
      simulationMonths: 24, initialCash: 3000000,
    },
  },
];

const selectAll = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

function buildState(template: Template, overrides: Record<string, number>): SimState {
  const base: SimState = {
    revenueModel: { type: "mrr", plans: [] },
    employees: [], fixedCosts: [], oneTimeCosts: [], loans: [],
    tax: { corporateTaxRate: 0.25, consumptionTaxRate: 0.10, consumptionTaxExemptMonths: 24 },
    simulationMonths: 24, initialCash: 3000000, actuals: [],
  };
  const merged = { ...base, ...template.state } as SimState;

  // overridesを適用
  if (overrides.initialCash) merged.initialCash = overrides.initialCash;
  if (overrides.simulationMonths) merged.simulationMonths = overrides.simulationMonths;
  if (overrides.unitPrice && merged.revenueModel.plans.length > 0) {
    merged.revenueModel.plans[0] = { ...merged.revenueModel.plans[0], unitPrice: overrides.unitPrice };
  }
  if (overrides.monthlyNewCustomers != null && merged.revenueModel.plans.length > 0) {
    merged.revenueModel.plans[0] = { ...merged.revenueModel.plans[0], monthlyNewCustomers: overrides.monthlyNewCustomers };
  }
  if (overrides.firstHireMonth && merged.employees.length > 0) {
    merged.employees[0] = { ...merged.employees[0], hireMonth: overrides.firstHireMonth };
  }

  return merged;
}

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, number>>({});

  // Step 0: ウェルカム
  if (step === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg text-center">
          <h1 className="text-4xl font-bold mb-4">Mikomi</h1>
          <p className="text-xl text-muted mb-2">経営シミュレーター</p>
          <p className="text-muted mb-8">
            売上・採用・資金のタイムラインを可視化して、
            <br />経営の意思決定を数字で判断するためのツールです。
          </p>
          <div className="space-y-3 text-left text-sm text-muted mb-8 max-w-sm mx-auto">
            {["複数の料金プランで売上をシミュレーション", "採用タイミングとコストの影響を可視化", "融資返済・税金を含む現実的なキャッシュフロー", "シナリオ比較で楽観/悲観を並べて判断", "予実管理でPDCAを回す"].map((t, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="text-blue-400 text-lg font-bold">{i + 1}</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setStep(1)} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg">はじめる</button>
        </div>
      </div>
    );
  }

  // Step 1: テンプレ選択
  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-3xl w-full">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setStep(0)} className="text-muted hover:text-foreground">← 戻る</button>
            <div>
              <h2 className="text-2xl font-bold">業種を選んでください</h2>
              <p className="text-muted text-sm">テンプレートが読み込まれます。あとから自由に変更可能。</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {templates.map((t) => (
              <button key={t.id} onClick={() => { setSelectedTemplate(t.id); setStep(2); }}
                className="text-left p-4 rounded-lg border border-border hover:border-blue-400/50 transition">
                <p className="text-2xl mb-1">{t.emoji}</p>
                <p className="font-semibold text-sm">{t.name}</p>
                <p className="text-xs text-muted mt-1">{t.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 2: カスタマイズ
  const template = templates.find((t) => t.id === selectedTemplate);
  if (!template) return null;
  const mainPlan = template.state.revenueModel?.plans[0];
  const firstEmp = template.state.employees?.[0];

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setStep(1)} className="text-muted hover:text-foreground">← 戻る</button>
          <div>
            <h2 className="text-2xl font-bold">{template.emoji} {template.name}の設定</h2>
            <p className="text-muted text-sm">あなたの数字に合わせてください</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <Field label="自己資本（手持ち）" value={overrides.initialCash ?? template.state.initialCash ?? 3000000} onChange={(v) => setOverrides({ ...overrides, initialCash: v })} suffix="円" step={1000000} hint="融資を除いた自己資金・出資金" />
          <Field label="シミュレーション期間" value={overrides.simulationMonths ?? template.state.simulationMonths ?? 24} onChange={(v) => setOverrides({ ...overrides, simulationMonths: v })} suffix="ヶ月" step={6} hint="通常24-36ヶ月" />
          {mainPlan && (
            <>
              <Field label={`${mainPlan.name}の月額単価`} value={overrides.unitPrice ?? mainPlan.unitPrice} onChange={(v) => setOverrides({ ...overrides, unitPrice: v })} suffix="円" step={1000} hint="1顧客あたりの月額料金" />
              <Field label="月間の新規獲得数" value={overrides.monthlyNewCustomers ?? mainPlan.monthlyNewCustomers} onChange={(v) => setOverrides({ ...overrides, monthlyNewCustomers: v })} suffix="社/月" step={1} hint="自然流入やマーケティングで獲得" />
            </>
          )}
          {firstEmp && (
            <Field label="最初の採用タイミング" value={overrides.firstHireMonth ?? firstEmp.hireMonth} onChange={(v) => setOverrides({ ...overrides, firstHireMonth: v })} suffix="ヶ月目" step={1} hint={`${firstEmp.role}を何ヶ月目に雇うか`} />
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onComplete(buildState(template, overrides))}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg flex-1"
          >シミュレーション開始</button>
          <button
            onClick={() => {
              const base: SimState = {
                revenueModel: { type: "mrr", plans: [] }, employees: [], fixedCosts: [], oneTimeCosts: [], loans: [],
                tax: { corporateTaxRate: 0.25, consumptionTaxRate: 0.10, consumptionTaxExemptMonths: 24 },
                simulationMonths: 24, initialCash: 3000000, actuals: [],
              };
              onComplete({ ...base, ...template.state } as SimState);
            }}
            className="text-muted hover:text-foreground text-sm px-4 py-3 border border-border rounded-lg"
          >テンプレのまま開始</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, suffix, step, hint }: {
  label: string; value: number; onChange: (v: number) => void; suffix: string; step: number; hint: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <div className="flex items-center gap-1.5">
          <input type="number" value={value || ""} onChange={(e) => onChange(Number(e.target.value))} onFocus={selectAll}
            className="border border-border rounded px-3 py-2 text-sm text-right w-36" step={step} />
          <span className="text-muted text-sm w-12">{suffix}</span>
        </div>
      </div>
      <p className="text-xs text-muted mt-0.5">{hint}</p>
    </div>
  );
}
