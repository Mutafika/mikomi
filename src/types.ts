export interface PricingPlan {
  id: string;
  name: string; // "Basic", "Pro" 等
  unitPrice: number; // 月額単価
  initialCustomers: number;
  monthlyNewCustomers: number;
  monthlyChurnRate: number; // 0.0 - 1.0
}

export interface RevenueModel {
  type: "mrr";
  plans: PricingPlan[];
}

export type IncentiveType = "none" | "one-time" | "recurring" | "fixed";

export interface Employee {
  id: string;
  name: string;
  role: string;
  monthlySalary: number;
  hireMonth: number;
  onboardingCost: number; // 入社時コスト（PC、デスク、採用費等）
  annualRaiseRate: number; // 年間昇給率 (0.0-1.0) 例: 0.03 = 3%
  monthlyAcquisition: number;
  rampUpMonths: number;
  incentive: {
    type: IncentiveType;
    rate: number;
    fixedAmount: number;
  };
}

export interface FixedCost {
  id: string;
  name: string;
  monthlyAmount: number;
}

export interface OneTimeCost {
  id: string;
  name: string;
  amount: number;
  month: number; // 発生月 (1始まり)
}

export type RepaymentType = "equal-payment" | "equal-principal";

export interface Loan {
  id: string;
  name: string;
  amount: number;
  annualRate: number;
  termMonths: number;
  graceMonths: number;
  startMonth: number;
  repaymentType: RepaymentType;
}

export interface TaxConfig {
  corporateTaxRate: number; // 法人税実効税率 (0.0-1.0) 中小企業 ~25%
  consumptionTaxRate: number; // 消費税率 (0.0-1.0) 10%
  consumptionTaxExemptMonths: number; // 消費税免税期間（設立から）通常24ヶ月
}

export interface SimState {
  revenueModel: RevenueModel;
  employees: Employee[];
  fixedCosts: FixedCost[];
  oneTimeCosts: OneTimeCost[];
  loans: Loan[];
  tax: TaxConfig;
  simulationMonths: number;
  initialCash: number;
  actuals: MonthActual[]; // 月次実績データ
}

export interface MonthActual {
  month: number;
  revenue: number | null; // 実績売上（null=未入力）
  customers: number | null; // 実績顧客数
  costs: number | null; // 実績コスト合計
  note: string; // メモ（差異の理由等）
}

export interface Scenario {
  id: string;
  name: string;
  state: SimState;
}

// 法定福利費率（会社負担分の概算）
export const SOCIAL_INSURANCE_RATE = 0.15;
