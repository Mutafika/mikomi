import type { SimState, Employee, Loan } from "@/types";
import { SOCIAL_INSURANCE_RATE } from "@/types";

export interface MonthEmployeeDetail {
  name: string;
  role: string;
  salary: number;
  socialInsurance: number;
  rampRate: number;
  actualAcquisition: number;
  incentiveCost: number;
}

export interface MonthLoanDetail {
  name: string;
  principal: number;
  interest: number;
  payment: number;
  remainingBalance: number;
}

export interface MonthData {
  month: number;
  customers: number;
  mrr: number;
  activeEmployees: MonthEmployeeDetail[];
  totalSalary: number;
  totalSocialInsurance: number;
  totalIncentive: number;
  totalPersonnelCost: number;
  totalFixedCosts: number;
  oneTimeCosts: number;
  loanDetails: MonthLoanDetail[];
  totalLoanPayment: number;
  loanDisbursement: number;
  corporateTax: number;
  consumptionTax: number;
  totalCosts: number;
  profitBeforeTax: number;
  profitAfterTax: number;
  cumulativeProfit: number;
  cashBalance: number;
}

export interface BreakEvenAnalysis {
  breakEvenCustomers: number; // 損益分岐顧客数
  breakEvenMrr: number; // 損益分岐MRR
  currentCustomers: number; // 最終月の顧客数
  margin: number; // 損益分岐からの余裕（顧客数）
}

export interface TimelineResult {
  months: MonthData[];
  breakEvenMonth: number | null;
  cashOutMonth: number | null;
  maxEmployeesAffordable: number;
  runway: number | null;
  totalLoanBalance: number;
  breakEvenAnalysis: BreakEvenAnalysis;
}

function getRampRate(employee: Employee, currentMonth: number): number {
  const monthsActive = currentMonth - employee.hireMonth;
  if (monthsActive < 0) return 0;
  if (employee.rampUpMonths <= 0) return 1;
  return Math.min(1, (monthsActive + 1) / (employee.rampUpMonths + 1));
}

// 昇給後の月給を計算（年1回、入社月の年次で昇給）
function getSalaryWithRaise(employee: Employee, currentMonth: number): number {
  const monthsActive = currentMonth - employee.hireMonth;
  if (monthsActive <= 0) return employee.monthlySalary;
  const yearsActive = Math.floor(monthsActive / 12);
  if (yearsActive <= 0 || employee.annualRaiseRate <= 0) return employee.monthlySalary;
  return Math.round(employee.monthlySalary * Math.pow(1 + employee.annualRaiseRate, yearsActive));
}

function calcLoanMonth(
  loan: Loan,
  currentMonth: number,
  remainingBalance: number
): { principal: number; interest: number; payment: number } {
  const monthsSinceStart = currentMonth - loan.startMonth;

  if (monthsSinceStart < 0 || remainingBalance <= 0) {
    return { principal: 0, interest: 0, payment: 0 };
  }

  const monthlyRate = loan.annualRate / 12;
  const interest = Math.round(remainingBalance * monthlyRate);

  if (monthsSinceStart < loan.graceMonths) {
    return { principal: 0, interest, payment: interest };
  }

  const repaymentMonths = loan.termMonths - loan.graceMonths;
  const monthsIntoRepayment = monthsSinceStart - loan.graceMonths;

  if (monthsIntoRepayment >= repaymentMonths) {
    return { principal: 0, interest: 0, payment: 0 };
  }

  let principal: number;

  if (loan.repaymentType === "equal-principal") {
    principal = Math.round(loan.amount / repaymentMonths);
    if (principal > remainingBalance) principal = remainingBalance;
  } else {
    if (monthlyRate === 0) {
      principal = Math.round(remainingBalance / (repaymentMonths - monthsIntoRepayment));
    } else {
      const remaining = repaymentMonths - monthsIntoRepayment;
      const totalPayment = Math.round(
        remainingBalance * (monthlyRate * Math.pow(1 + monthlyRate, remaining)) /
        (Math.pow(1 + monthlyRate, remaining) - 1)
      );
      principal = totalPayment - interest;
      if (principal > remainingBalance) principal = remainingBalance;
    }
  }

  return {
    principal: Math.max(0, principal),
    interest,
    payment: Math.max(0, principal) + interest,
  };
}

export function calcTimeline(state: SimState): TimelineResult {
  const { revenueModel, employees, fixedCosts, oneTimeCosts, loans, tax, simulationMonths, initialCash } = state;
  const months: MonthData[] = [];
  const plans = revenueModel.plans;

  // プランごとの顧客数を追跡
  const planCustomers = new Map<string, number>();
  for (const plan of plans) {
    planCustomers.set(plan.id, plan.initialCustomers);
  }

  let cumulativeProfit = 0;
  let cashBalance = initialCash;
  let breakEvenMonth: number | null = null;
  let cashOutMonth: number | null = null;

  const cumulativeAcquisitions = new Map<string, number>();
  const loanBalances = new Map<string, number>();
  for (const loan of loans) {
    loanBalances.set(loan.id, loan.amount);
  }

  // 平均単価（インセンティブ計算用）
  const avgUnitPrice = plans.length > 0
    ? plans.reduce((s, p) => s + p.unitPrice, 0) / plans.length
    : 0;

  for (let m = 1; m <= simulationMonths; m++) {
    // 融資実行
    let loanDisbursement = 0;
    for (const loan of loans) {
      if (loan.startMonth === m) {
        loanDisbursement += loan.amount;
        cashBalance += loan.amount;
      }
    }

    // 社員（昇給込み）
    const activeEmployees: MonthEmployeeDetail[] = employees
      .filter((e) => e.hireMonth <= m)
      .map((e) => {
        const rampRate = getRampRate(e, m);
        const currentSalary = getSalaryWithRaise(e, m);
        const actualAcquisition = Math.round(e.monthlyAcquisition * rampRate);
        const prevCum = cumulativeAcquisitions.get(e.id) ?? 0;
        cumulativeAcquisitions.set(e.id, prevCum + actualAcquisition);

        let incentiveCost = 0;
        switch (e.incentive.type) {
          case "one-time":
            incentiveCost = Math.round(actualAcquisition * avgUnitPrice * e.incentive.rate);
            break;
          case "recurring":
            incentiveCost = Math.round(
              (prevCum + actualAcquisition) * avgUnitPrice * e.incentive.rate
            );
            break;
          case "fixed":
            incentiveCost = actualAcquisition * e.incentive.fixedAmount;
            break;
        }

        return {
          name: e.name, role: e.role, salary: currentSalary,
          socialInsurance: Math.round(currentSalary * SOCIAL_INSURANCE_RATE),
          rampRate, actualAcquisition, incentiveCost,
        };
      });

    const employeeAcquisition = activeEmployees.reduce((sum, e) => sum + e.actualAcquisition, 0);

    // プランごとの顧客数更新 + MRR計算
    let customers = 0;
    let mrr = 0;
    for (const plan of plans) {
      let pc = planCustomers.get(plan.id) ?? 0;
      if (m > 1) {
        const churned = Math.round(pc * plan.monthlyChurnRate);
        // 営業獲得はプランの新規獲得比率に応じて按分
        const totalBaseNew = plans.reduce((s, p) => s + p.monthlyNewCustomers, 0);
        const ratio = totalBaseNew > 0 ? plan.monthlyNewCustomers / totalBaseNew : 1 / plans.length;
        const empAcq = Math.round(employeeAcquisition * ratio);
        pc = Math.max(0, pc - churned + plan.monthlyNewCustomers + empAcq);
      }
      planCustomers.set(plan.id, pc);
      customers += pc;
      mrr += pc * plan.unitPrice;
    }

    // ローン
    const loanDetails: MonthLoanDetail[] = loans.map((loan) => {
      const balance = loanBalances.get(loan.id) ?? 0;
      const result = calcLoanMonth(loan, m, balance);
      const newBalance = Math.max(0, balance - result.principal);
      loanBalances.set(loan.id, newBalance);
      return { name: loan.name, ...result, remainingBalance: newBalance };
    });
    const totalLoanPayment = loanDetails.reduce((s, l) => s + l.payment, 0);

    // 入社時コスト
    const onboardingThisMonth = employees
      .filter((e) => e.hireMonth === m && e.onboardingCost > 0)
      .reduce((s, e) => s + e.onboardingCost, 0);

    const oneTimeThisMonth = oneTimeCosts
      .filter((c) => c.month === m)
      .reduce((s, c) => s + c.amount, 0) + onboardingThisMonth;

    // コスト集計
    const totalSalary = activeEmployees.reduce((s, e) => s + e.salary, 0);
    const totalSocialInsurance = activeEmployees.reduce((s, e) => s + e.socialInsurance, 0);
    const totalIncentive = activeEmployees.reduce((s, e) => s + e.incentiveCost, 0);
    const totalPersonnelCost = totalSalary + totalSocialInsurance + totalIncentive;
    const totalFixedCosts = fixedCosts.reduce((sum, c) => sum + c.monthlyAmount, 0);

    const costsBeforeTax = totalPersonnelCost + totalFixedCosts + totalLoanPayment + oneTimeThisMonth;
    const profitBeforeTax = mrr - costsBeforeTax;

    let consumptionTax = 0;
    if (m > tax.consumptionTaxExemptMonths && tax.consumptionTaxRate > 0) {
      consumptionTax = Math.round(mrr * tax.consumptionTaxRate / (1 + tax.consumptionTaxRate));
    }

    let corporateTax = 0;
    if (profitBeforeTax > 0 && tax.corporateTaxRate > 0) {
      corporateTax = Math.round(profitBeforeTax * tax.corporateTaxRate);
    }

    const totalCosts = costsBeforeTax + corporateTax + consumptionTax;
    const profitAfterTax = mrr - totalCosts;
    cumulativeProfit += profitAfterTax;
    cashBalance += profitAfterTax;

    if (breakEvenMonth === null && profitAfterTax >= 0 && m > 1) {
      breakEvenMonth = m;
    }
    if (cashOutMonth === null && cashBalance < 0) {
      cashOutMonth = m;
    }

    months.push({
      month: m, customers, mrr, activeEmployees,
      totalSalary, totalSocialInsurance, totalIncentive, totalPersonnelCost,
      totalFixedCosts, oneTimeCosts: oneTimeThisMonth,
      loanDetails, totalLoanPayment, loanDisbursement,
      corporateTax, consumptionTax,
      totalCosts, profitBeforeTax, profitAfterTax,
      cumulativeProfit, cashBalance,
    });
  }

  const lastMonth = months[months.length - 1];
  const avgSalary = employees.length > 0
    ? employees.reduce((s, e) => s + e.monthlySalary, 0) / employees.length
    : 250000;
  const avgCostPerPerson = avgSalary * (1 + SOCIAL_INSURANCE_RATE);
  const maxEmployeesAffordable = lastMonth
    ? Math.max(0, Math.floor((lastMonth.mrr - lastMonth.totalCosts) / avgCostPerPerson) + employees.filter((e) => e.hireMonth <= simulationMonths).length)
    : 0;

  let runway: number | null = null;
  if (lastMonth && lastMonth.profitAfterTax < 0 && lastMonth.cashBalance > 0) {
    runway = Math.floor(lastMonth.cashBalance / Math.abs(lastMonth.profitAfterTax));
  }

  const totalLoanBalance = Array.from(loanBalances.values()).reduce((s, b) => s + b, 0);

  // 損益分岐分析（最終月ベース、加重平均単価で計算）
  const lastMonthCosts = lastMonth ? lastMonth.totalCosts - lastMonth.corporateTax - lastMonth.consumptionTax : 0;
  const weightedAvgPrice = lastMonth && lastMonth.customers > 0
    ? lastMonth.mrr / lastMonth.customers
    : avgUnitPrice;
  const breakEvenCustomers = weightedAvgPrice > 0
    ? Math.ceil(lastMonthCosts / weightedAvgPrice)
    : 0;
  const breakEvenMrr = Math.round(breakEvenCustomers * weightedAvgPrice);
  const currentCustomers = lastMonth ? lastMonth.customers : 0;

  const breakEvenAnalysis: BreakEvenAnalysis = {
    breakEvenCustomers,
    breakEvenMrr,
    currentCustomers,
    margin: currentCustomers - breakEvenCustomers,
  };

  return { months, breakEvenMonth, cashOutMonth, maxEmployeesAffordable, runway, totalLoanBalance, breakEvenAnalysis };
}
