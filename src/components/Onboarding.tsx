"use client";

import { useState } from "react";
import type { SimState } from "@/types";

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
    id: "saas",
    name: "SaaS",
    emoji: "💻",
    description: "月額課金のWebサービス",
    detail: "複数プラン / エンジニア中心 / 低解約率 / 長期成長",
    state: {
      revenueModel: {
        type: "mrr",
        plans: [
          { id: "starter", name: "Starter", unitPrice: 3000, initialCustomers: 0, monthlyNewCustomers: 8, monthlyChurnRate: 0.04 },
          { id: "basic", name: "Basic", unitPrice: 10000, initialCustomers: 0, monthlyNewCustomers: 4, monthlyChurnRate: 0.03 },
          { id: "pro", name: "Pro", unitPrice: 30000, initialCustomers: 0, monthlyNewCustomers: 1, monthlyChurnRate: 0.02 },
        ],
      },
      employees: [
        { id: "eng1", name: "エンジニア1", role: "エンジニア", monthlySalary: 350000, hireMonth: 12, onboardingCost: 250000, annualRaiseRate: 0.03, monthlyAcquisition: 0, rampUpMonths: 0, incentive: { type: "none", rate: 0, fixedAmount: 0 } },
        { id: "sales1", name: "営業1", role: "営業", monthlySalary: 280000, hireMonth: 18, onboardingCost: 200000, annualRaiseRate: 0.03, monthlyAcquisition: 5, rampUpMonths: 3, incentive: { type: "one-time", rate: 0.15, fixedAmount: 0 } },
      ],
      fixedCosts: [
        { id: "infra", name: "インフラ（AWS等）", monthlyAmount: 30000 },
        { id: "tools", name: "開発ツール", monthlyAmount: 15000 },
        { id: "domain", name: "ドメイン・SSL", monthlyAmount: 3000 },
        { id: "accounting", name: "会計ソフト", monthlyAmount: 3000 },
      ],
      oneTimeCosts: [
        { id: "inc", name: "法人設立費", amount: 250000, month: 1 },
        { id: "pc", name: "開発用PC", amount: 300000, month: 1 },
      ],
      loans: [
        { id: "jfc", name: "日本政策金融公庫", amount: 5000000, annualRate: 0.02, termMonths: 60, graceMonths: 6, startMonth: 1, repaymentType: "equal-payment" },
      ],
      tax: { corporateTaxRate: 0.25, consumptionTaxRate: 0.10, consumptionTaxExemptMonths: 24 },
      simulationMonths: 36,
      initialCash: 3000000,
    },
  },
  {
    id: "agency",
    name: "受託・制作",
    emoji: "🔧",
    description: "Web制作やシステム開発",
    detail: "月額保守 / 人月ビジネス / 人件費が主コスト",
    state: {
      revenueModel: {
        type: "mrr",
        plans: [
          { id: "maintenance", name: "月額保守", unitPrice: 50000, initialCustomers: 2, monthlyNewCustomers: 1, monthlyChurnRate: 0.03 },
          { id: "small", name: "小規模案件", unitPrice: 100000, initialCustomers: 0, monthlyNewCustomers: 1, monthlyChurnRate: 0.50 },
        ],
      },
      employees: [
        { id: "eng1", name: "エンジニア", role: "エンジニア", monthlySalary: 300000, hireMonth: 6, onboardingCost: 250000, annualRaiseRate: 0.03, monthlyAcquisition: 0, rampUpMonths: 0, incentive: { type: "none", rate: 0, fixedAmount: 0 } },
        { id: "dir1", name: "ディレクター", role: "ディレクター", monthlySalary: 320000, hireMonth: 12, onboardingCost: 200000, annualRaiseRate: 0.03, monthlyAcquisition: 2, rampUpMonths: 2, incentive: { type: "none", rate: 0, fixedAmount: 0 } },
      ],
      fixedCosts: [
        { id: "rent", name: "オフィス家賃", monthlyAmount: 100000 },
        { id: "tools", name: "ツール・ソフト", monthlyAmount: 20000 },
        { id: "accounting", name: "会計・税理士", monthlyAmount: 30000 },
      ],
      oneTimeCosts: [
        { id: "inc", name: "法人設立費", amount: 250000, month: 1 },
        { id: "pc", name: "PC×2", amount: 500000, month: 1 },
        { id: "furniture", name: "オフィス備品", amount: 200000, month: 1 },
      ],
      loans: [
        { id: "jfc", name: "日本政策金融公庫", amount: 3000000, annualRate: 0.02, termMonths: 48, graceMonths: 6, startMonth: 1, repaymentType: "equal-payment" },
      ],
      tax: { corporateTaxRate: 0.25, consumptionTaxRate: 0.10, consumptionTaxExemptMonths: 24 },
      simulationMonths: 24,
      initialCash: 5000000,
    },
  },
  {
    id: "school",
    name: "スクール・教室",
    emoji: "📚",
    description: "プログラミング教室、学習塾など",
    detail: "月謝制 / 生徒数がKPI / 講師の採用がカギ",
    state: {
      revenueModel: {
        type: "mrr",
        plans: [
          { id: "kids", name: "キッズコース", unitPrice: 12000, initialCustomers: 5, monthlyNewCustomers: 3, monthlyChurnRate: 0.05 },
          { id: "adult", name: "大人コース", unitPrice: 20000, initialCustomers: 0, monthlyNewCustomers: 2, monthlyChurnRate: 0.08 },
        ],
      },
      employees: [
        { id: "teacher1", name: "講師1", role: "講師", monthlySalary: 250000, hireMonth: 6, onboardingCost: 100000, annualRaiseRate: 0.02, monthlyAcquisition: 0, rampUpMonths: 0, incentive: { type: "none", rate: 0, fixedAmount: 0 } },
      ],
      fixedCosts: [
        { id: "rent", name: "教室家賃", monthlyAmount: 150000 },
        { id: "utilities", name: "光熱費・通信", monthlyAmount: 25000 },
        { id: "materials", name: "教材費", monthlyAmount: 15000 },
        { id: "insurance", name: "保険", monthlyAmount: 5000 },
      ],
      oneTimeCosts: [
        { id: "inc", name: "法人設立費", amount: 250000, month: 1 },
        { id: "interior", name: "内装工事", amount: 500000, month: 1 },
        { id: "equip", name: "PC・机・椅子", amount: 400000, month: 1 },
        { id: "signage", name: "看板", amount: 100000, month: 1 },
      ],
      loans: [
        { id: "jfc", name: "日本政策金融公庫", amount: 5000000, annualRate: 0.015, termMonths: 60, graceMonths: 6, startMonth: 1, repaymentType: "equal-payment" },
      ],
      tax: { corporateTaxRate: 0.25, consumptionTaxRate: 0.10, consumptionTaxExemptMonths: 24 },
      simulationMonths: 36,
      initialCash: 3000000,
    },
  },
  {
    id: "consulting",
    name: "コンサル・士業",
    emoji: "💼",
    description: "経営コンサル、税理士、社労士など",
    detail: "顧問契約 / 高単価 / 少数精鋭 / 信用が資産",
    state: {
      revenueModel: {
        type: "mrr",
        plans: [
          { id: "advisory", name: "顧問契約", unitPrice: 100000, initialCustomers: 1, monthlyNewCustomers: 1, monthlyChurnRate: 0.02 },
          { id: "spot", name: "スポット", unitPrice: 200000, initialCustomers: 0, monthlyNewCustomers: 1, monthlyChurnRate: 0.80 },
        ],
      },
      employees: [
        { id: "associate", name: "アソシエイト", role: "コンサル", monthlySalary: 300000, hireMonth: 12, onboardingCost: 150000, annualRaiseRate: 0.05, monthlyAcquisition: 1, rampUpMonths: 3, incentive: { type: "none", rate: 0, fixedAmount: 0 } },
      ],
      fixedCosts: [
        { id: "rent", name: "オフィス", monthlyAmount: 80000 },
        { id: "tools", name: "ツール・書籍", monthlyAmount: 15000 },
        { id: "networking", name: "交際費", monthlyAmount: 30000 },
      ],
      oneTimeCosts: [
        { id: "inc", name: "法人設立費", amount: 250000, month: 1 },
        { id: "hp", name: "Webサイト制作", amount: 300000, month: 1 },
      ],
      loans: [],
      tax: { corporateTaxRate: 0.25, consumptionTaxRate: 0.10, consumptionTaxExemptMonths: 24 },
      simulationMonths: 24,
      initialCash: 5000000,
    },
  },
  {
    id: "retail",
    name: "店舗・飲食",
    emoji: "🍽️",
    description: "カフェ、レストラン、物販店",
    detail: "客単価×来客数 / 家賃・仕入が重い / 立地勝負",
    state: {
      revenueModel: {
        type: "mrr",
        plans: [
          { id: "dine", name: "店内飲食", unitPrice: 1200, initialCustomers: 100, monthlyNewCustomers: 30, monthlyChurnRate: 0.20 },
          { id: "takeout", name: "テイクアウト", unitPrice: 800, initialCustomers: 30, monthlyNewCustomers: 20, monthlyChurnRate: 0.30 },
        ],
      },
      employees: [
        { id: "staff1", name: "スタッフ1", role: "ホール", monthlySalary: 200000, hireMonth: 1, onboardingCost: 50000, annualRaiseRate: 0.02, monthlyAcquisition: 0, rampUpMonths: 0, incentive: { type: "none", rate: 0, fixedAmount: 0 } },
        { id: "chef1", name: "調理1", role: "キッチン", monthlySalary: 250000, hireMonth: 1, onboardingCost: 50000, annualRaiseRate: 0.02, monthlyAcquisition: 0, rampUpMonths: 0, incentive: { type: "none", rate: 0, fixedAmount: 0 } },
      ],
      fixedCosts: [
        { id: "rent", name: "店舗家賃", monthlyAmount: 250000 },
        { id: "utilities", name: "光熱費・水道", monthlyAmount: 60000 },
        { id: "cogs", name: "仕入・原価", monthlyAmount: 150000 },
        { id: "waste", name: "廃棄・清掃", monthlyAmount: 20000 },
      ],
      oneTimeCosts: [
        { id: "inc", name: "法人設立費", amount: 250000, month: 1 },
        { id: "interior", name: "内装工事", amount: 3000000, month: 1 },
        { id: "equipment", name: "厨房設備", amount: 2000000, month: 1 },
        { id: "signage", name: "看板・メニュー", amount: 200000, month: 1 },
      ],
      loans: [
        { id: "jfc", name: "日本政策金融公庫", amount: 10000000, annualRate: 0.02, termMonths: 84, graceMonths: 12, startMonth: 1, repaymentType: "equal-payment" },
      ],
      tax: { corporateTaxRate: 0.25, consumptionTaxRate: 0.10, consumptionTaxExemptMonths: 24 },
      simulationMonths: 36,
      initialCash: 5000000,
    },
  },
  {
    id: "ec",
    name: "EC・物販",
    emoji: "📦",
    description: "ネットショップ、D2Cブランド",
    detail: "仕入・在庫管理 / 広告費 / リピート率がカギ",
    state: {
      revenueModel: {
        type: "mrr",
        plans: [
          { id: "single", name: "単品購入", unitPrice: 5000, initialCustomers: 0, monthlyNewCustomers: 30, monthlyChurnRate: 0.60 },
          { id: "subscription", name: "定期購入", unitPrice: 4000, initialCustomers: 0, monthlyNewCustomers: 10, monthlyChurnRate: 0.08 },
        ],
      },
      employees: [],
      fixedCosts: [
        { id: "warehouse", name: "倉庫・配送", monthlyAmount: 50000 },
        { id: "platform", name: "ECプラットフォーム", monthlyAmount: 10000 },
        { id: "ads", name: "広告費", monthlyAmount: 100000 },
        { id: "cogs", name: "仕入原価", monthlyAmount: 80000 },
      ],
      oneTimeCosts: [
        { id: "inc", name: "開業届・法人設立", amount: 250000, month: 1 },
        { id: "inventory", name: "初期在庫仕入", amount: 500000, month: 1 },
        { id: "site", name: "ECサイト構築", amount: 300000, month: 1 },
        { id: "photo", name: "商品撮影", amount: 100000, month: 1 },
      ],
      loans: [],
      tax: { corporateTaxRate: 0.25, consumptionTaxRate: 0.10, consumptionTaxExemptMonths: 24 },
      simulationMonths: 24,
      initialCash: 2000000,
    },
  },
  {
    id: "blank",
    name: "白紙から",
    emoji: "📝",
    description: "テンプレなし",
    detail: "全部自分で設定する",
    state: {
      revenueModel: { type: "mrr", plans: [] },
      employees: [],
      fixedCosts: [],
      oneTimeCosts: [],
      loans: [],
      tax: { corporateTaxRate: 0.25, consumptionTaxRate: 0.10, consumptionTaxExemptMonths: 24 },
      simulationMonths: 24,
      initialCash: 3000000,
    },
  },
];

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  if (step === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg text-center">
          <h1 className="text-4xl font-bold mb-4">Mikomi</h1>
          <p className="text-xl text-muted mb-2">経営シミュレーター</p>
          <p className="text-muted mb-8">
            売上・採用・資金のタイムラインを可視化して、
            <br />
            経営の意思決定を数字で判断するためのツールです。
          </p>
          <div className="space-y-3 text-left text-sm text-muted mb-8 max-w-sm mx-auto">
            <div className="flex gap-3 items-start">
              <span className="text-blue-400 text-lg">1</span>
              <span>複数の料金プランで売上をシミュレーション</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-blue-400 text-lg">2</span>
              <span>採用タイミングとコストの影響を可視化</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-blue-400 text-lg">3</span>
              <span>融資返済・税金を含む現実的なキャッシュフロー</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-blue-400 text-lg">4</span>
              <span>シナリオ比較で楽観/悲観を並べて判断</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-blue-400 text-lg">5</span>
              <span>予実管理でPDCAを回す</span>
            </div>
          </div>
          <button
            onClick={() => setStep(1)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg"
          >
            はじめる
          </button>
        </div>
      </div>
    );
  }

  const selected = templates.find((t) => t.id === selectedTemplate);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        <h2 className="text-2xl font-bold mb-2">業種を選んでください</h2>
        <p className="text-muted mb-6">テンプレートが読み込まれます。あとから自由に変更可能。</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplate(t.id)}
              className={`text-left p-4 rounded-lg border transition ${
                selectedTemplate === t.id
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-border hover:border-blue-400/50"
              }`}
            >
              <p className="text-2xl mb-1">{t.emoji}</p>
              <p className="font-semibold text-sm">{t.name}</p>
              <p className="text-xs text-muted mt-1">{t.description}</p>
            </button>
          ))}
        </div>

        {selected && selected.id !== "blank" && (
          <div className="border border-border rounded-lg p-4 mb-6">
            <p className="font-semibold mb-2">{selected.emoji} {selected.name}</p>
            <p className="text-sm text-muted mb-3">{selected.detail}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-muted text-xs">料金プラン</p>
                <p className="font-medium">{selected.state.revenueModel?.plans.length ?? 0}個</p>
                {selected.state.revenueModel?.plans.map((p) => (
                  <p key={p.id} className="text-xs text-muted">{p.name} ¥{p.unitPrice.toLocaleString()}</p>
                ))}
              </div>
              <div>
                <p className="text-muted text-xs">社員</p>
                <p className="font-medium">{selected.state.employees?.length ?? 0}人</p>
                {selected.state.employees?.map((e) => (
                  <p key={e.id} className="text-xs text-muted">{e.role} {e.hireMonth}ヶ月目</p>
                ))}
              </div>
              <div>
                <p className="text-muted text-xs">初期費用</p>
                <p className="font-medium">{((selected.state.oneTimeCosts?.reduce((s, c) => s + c.amount, 0) ?? 0) / 10000).toFixed(0)}万円</p>
                {selected.state.oneTimeCosts?.map((c) => (
                  <p key={c.id} className="text-xs text-muted">{c.name}</p>
                ))}
              </div>
              <div>
                <p className="text-muted text-xs">融資</p>
                <p className="font-medium">{selected.state.loans?.length ? `${(selected.state.loans.reduce((s, l) => s + l.amount, 0) / 10000).toFixed(0)}万円` : "なし"}</p>
                {selected.state.loans?.map((l) => (
                  <p key={l.id} className="text-xs text-muted">{l.name}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTemplate && (
          <div className="text-center">
            <button
              onClick={() => {
                const template = templates.find((t) => t.id === selectedTemplate);
                if (template) {
                  const base: SimState = {
                    revenueModel: { type: "mrr", plans: [] },
                    employees: [],
                    fixedCosts: [],
                    oneTimeCosts: [],
                    loans: [],
                    tax: { corporateTaxRate: 0.25, consumptionTaxRate: 0.10, consumptionTaxExemptMonths: 24 },
                    simulationMonths: 24,
                    initialCash: 3000000,
                    actuals: [],
                  };
                  onComplete({ ...base, ...template.state } as SimState);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg"
            >
              このテンプレで開始
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
