"use client";

import { useState, useEffect, useCallback } from "react";
import type { SimState, Employee, FixedCost, OneTimeCost, Loan, TaxConfig, RevenueModel, PricingPlan, Scenario, MonthActual } from "@/types";

const STORAGE_KEY = "mikomi-state-v5";
const SCENARIOS_KEY = "mikomi-scenarios-v2";

const defaultState: SimState = {
  revenueModel: {
    type: "mrr",
    plans: [
      { id: "default", name: "Basic", unitPrice: 5000, initialCustomers: 0, monthlyNewCustomers: 10, monthlyChurnRate: 0.03 },
    ],
  },
  employees: [],
  fixedCosts: [
    { id: "rent", name: "家賃", monthlyAmount: 100000 },
    { id: "infra", name: "インフラ", monthlyAmount: 30000 },
  ],
  oneTimeCosts: [],
  loans: [],
  tax: {
    corporateTaxRate: 0.25,
    consumptionTaxRate: 0.10,
    consumptionTaxExemptMonths: 24,
  },
  simulationMonths: 24,
  initialCash: 3000000,
  actuals: [],
};

function loadState(): SimState {
  if (typeof window === "undefined") return defaultState;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as SimState;
      if (!parsed.loans) parsed.loans = [];
      if (!parsed.oneTimeCosts) parsed.oneTimeCosts = [];
      if (!parsed.tax) parsed.tax = defaultState.tax;
      if (!parsed.actuals) parsed.actuals = [];
      // v4→v5: 単一プラン→配列マイグレーション
      const rm = parsed.revenueModel;
      if (!rm.plans) {
        const legacy = rm as unknown as { unitPrice?: number; initialCustomers?: number; monthlyNewCustomers?: number; monthlyChurnRate?: number };
        parsed.revenueModel = {
          type: "mrr",
          plans: [{
            id: "migrated",
            name: "Basic",
            unitPrice: legacy.unitPrice ?? 5000,
            initialCustomers: legacy.initialCustomers ?? 0,
            monthlyNewCustomers: legacy.monthlyNewCustomers ?? 10,
            monthlyChurnRate: legacy.monthlyChurnRate ?? 0.03,
          }],
        };
      }
      return parsed;
    }
  } catch {
    // ignore
  }
  return defaultState;
}

function loadScenarios(): Scenario[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(SCENARIOS_KEY);
    if (saved) return JSON.parse(saved) as Scenario[];
  } catch {
    // ignore
  }
  return [];
}

const ONBOARDING_KEY = "mikomi-onboarded";

export function useSimState() {
  const [state, setState] = useState<SimState>(defaultState);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [onboarded, setOnboarded] = useState(true);

  useEffect(() => {
    setState(loadState());
    setScenarios(loadScenarios());
    setOnboarded(localStorage.getItem(ONBOARDING_KEY) === "true");
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, loaded]);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(SCENARIOS_KEY, JSON.stringify(scenarios));
    }
  }, [scenarios, loaded]);

  const addPlan = useCallback((plan: Omit<PricingPlan, "id">) => {
    setState((prev) => ({
      ...prev,
      revenueModel: {
        ...prev.revenueModel,
        plans: [...prev.revenueModel.plans, { ...plan, id: crypto.randomUUID() }],
      },
    }));
  }, []);

  const updatePlan = useCallback((id: string, updates: Partial<Omit<PricingPlan, "id">>) => {
    setState((prev) => ({
      ...prev,
      revenueModel: {
        ...prev.revenueModel,
        plans: prev.revenueModel.plans.map((p) => p.id === id ? { ...p, ...updates } : p),
      },
    }));
  }, []);

  const removePlan = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      revenueModel: {
        ...prev.revenueModel,
        plans: prev.revenueModel.plans.filter((p) => p.id !== id),
      },
    }));
  }, []);

  const setSimulationMonths = useCallback((simulationMonths: number) => {
    setState((prev) => ({ ...prev, simulationMonths }));
  }, []);

  const setInitialCash = useCallback((initialCash: number) => {
    setState((prev) => ({ ...prev, initialCash }));
  }, []);

  const updateTax = useCallback((updates: Partial<TaxConfig>) => {
    setState((prev) => ({ ...prev, tax: { ...prev.tax, ...updates } }));
  }, []);

  const addEmployee = useCallback((employee: Omit<Employee, "id">) => {
    setState((prev) => ({
      ...prev,
      employees: [...prev.employees, { ...employee, id: crypto.randomUUID() }],
    }));
  }, []);

  const updateEmployee = useCallback((id: string, updates: Partial<Omit<Employee, "id">>) => {
    setState((prev) => ({
      ...prev,
      employees: prev.employees.map((e) => e.id === id ? { ...e, ...updates } : e),
    }));
  }, []);

  const removeEmployee = useCallback((id: string) => {
    setState((prev) => ({ ...prev, employees: prev.employees.filter((e) => e.id !== id) }));
  }, []);

  const addFixedCost = useCallback((cost: Omit<FixedCost, "id">) => {
    setState((prev) => ({
      ...prev,
      fixedCosts: [...prev.fixedCosts, { ...cost, id: crypto.randomUUID() }],
    }));
  }, []);

  const updateFixedCost = useCallback((id: string, updates: Partial<Omit<FixedCost, "id">>) => {
    setState((prev) => ({
      ...prev,
      fixedCosts: prev.fixedCosts.map((c) => c.id === id ? { ...c, ...updates } : c),
    }));
  }, []);

  const removeFixedCost = useCallback((id: string) => {
    setState((prev) => ({ ...prev, fixedCosts: prev.fixedCosts.filter((c) => c.id !== id) }));
  }, []);

  const addOneTimeCost = useCallback((cost: Omit<OneTimeCost, "id">) => {
    setState((prev) => ({
      ...prev,
      oneTimeCosts: [...prev.oneTimeCosts, { ...cost, id: crypto.randomUUID() }],
    }));
  }, []);

  const updateOneTimeCost = useCallback((id: string, updates: Partial<Omit<OneTimeCost, "id">>) => {
    setState((prev) => ({
      ...prev,
      oneTimeCosts: prev.oneTimeCosts.map((c) => c.id === id ? { ...c, ...updates } : c),
    }));
  }, []);

  const removeOneTimeCost = useCallback((id: string) => {
    setState((prev) => ({ ...prev, oneTimeCosts: prev.oneTimeCosts.filter((c) => c.id !== id) }));
  }, []);

  const addLoan = useCallback((loan: Omit<Loan, "id">) => {
    setState((prev) => ({
      ...prev,
      loans: [...prev.loans, { ...loan, id: crypto.randomUUID() }],
    }));
  }, []);

  const updateLoan = useCallback((id: string, updates: Partial<Omit<Loan, "id">>) => {
    setState((prev) => ({
      ...prev,
      loans: prev.loans.map((l) => l.id === id ? { ...l, ...updates } : l),
    }));
  }, []);

  const removeLoan = useCallback((id: string) => {
    setState((prev) => ({ ...prev, loans: prev.loans.filter((l) => l.id !== id) }));
  }, []);

  // 実績
  const updateActual = useCallback((month: number, updates: Partial<Omit<MonthActual, "month">>) => {
    setState((prev) => {
      const existing = prev.actuals.find((a) => a.month === month);
      if (existing) {
        return {
          ...prev,
          actuals: prev.actuals.map((a) => a.month === month ? { ...a, ...updates } : a),
        };
      }
      return {
        ...prev,
        actuals: [...prev.actuals, { month, revenue: null, customers: null, costs: null, note: "", ...updates }],
      };
    });
  }, []);

  // シナリオ
  const saveScenario = useCallback((name: string) => {
    setScenarios((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name, state: structuredClone(state) },
    ]);
  }, [state]);

  const loadScenario = useCallback((id: string) => {
    const scenario = scenarios.find((s) => s.id === id);
    if (scenario) setState(structuredClone(scenario.state));
  }, [scenarios]);

  const deleteScenario = useCallback((id: string) => {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const importState = useCallback((data: { state: SimState; scenarios: Scenario[] }) => {
    setState(data.state);
    setScenarios(data.scenarios);
  }, []);

  const completeOnboarding = useCallback((initialState: SimState) => {
    setState(initialState);
    setOnboarded(true);
    localStorage.setItem(ONBOARDING_KEY, "true");
  }, []);

  return {
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
  };
}
