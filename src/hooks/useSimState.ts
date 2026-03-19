"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SimState, Employee, FixedCost, OneTimeCost, Loan, TaxConfig, PricingPlan, Scenario, MonthActual } from "@/types";

const ONBOARDING_KEY = "mikomi-onboarded";
const PROJECT_KEY = "mikomi-current-project";
const MAX_HISTORY = 50;

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

function migrateState(parsed: SimState): SimState {
  if (!parsed.loans) parsed.loans = [];
  if (!parsed.oneTimeCosts) parsed.oneTimeCosts = [];
  if (!parsed.tax) parsed.tax = defaultState.tax;
  if (!parsed.actuals) parsed.actuals = [];
  const rm = parsed.revenueModel;
  if (!rm?.plans) {
    const legacy = rm as unknown as { unitPrice?: number; initialCustomers?: number; monthlyNewCustomers?: number; monthlyChurnRate?: number };
    parsed.revenueModel = {
      type: "mrr",
      plans: [{
        id: "migrated", name: "Basic",
        unitPrice: legacy?.unitPrice ?? 5000,
        initialCustomers: legacy?.initialCustomers ?? 0,
        monthlyNewCustomers: legacy?.monthlyNewCustomers ?? 10,
        monthlyChurnRate: legacy?.monthlyChurnRate ?? 0.03,
      }],
    };
  }
  return parsed;
}

// API呼び出し
async function apiListProjects(): Promise<string[]> {
  const res = await fetch("/api/projects");
  return res.json();
}

async function apiCreateProject(name: string): Promise<string> {
  const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
  const data = await res.json();
  return data.id;
}

async function apiDeleteProject(id: string) {
  await fetch("/api/projects", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
}

async function apiLoadProject(id: string): Promise<{ state: SimState; scenarios: Scenario[] }> {
  const res = await fetch(`/api/projects/${encodeURIComponent(id)}`);
  const data = await res.json();
  return {
    state: data.state && Object.keys(data.state).length > 0 ? migrateState(data.state) : defaultState,
    scenarios: data.scenarios ?? [],
  };
}

async function apiSaveProject(id: string, state: SimState, scenarios: Scenario[]) {
  await fetch(`/api/projects/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state, scenarios }),
  });
}

export function useSimState() {
  const [state, setState] = useState<SimState>(defaultState);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [currentProject, setCurrentProject] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [onboarded, setOnboarded] = useState(true);
  const [history, setHistory] = useState<SimState[]>([]);
  const [future, setFuture] = useState<SimState[]>([]);
  const skipHistoryRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 初期ロード
  useEffect(() => {
    (async () => {
      const projectList = await apiListProjects();
      setProjects(projectList);

      const savedProject = localStorage.getItem(PROJECT_KEY);
      if (savedProject && projectList.includes(savedProject)) {
        const data = await apiLoadProject(savedProject);
        setState(data.state);
        setScenarios(data.scenarios);
        setCurrentProject(savedProject);
        setOnboarded(true);
      } else if (projectList.length > 0) {
        const first = projectList[0];
        const data = await apiLoadProject(first);
        setState(data.state);
        setScenarios(data.scenarios);
        setCurrentProject(first);
        localStorage.setItem(PROJECT_KEY, first);
        setOnboarded(true);
      } else {
        setOnboarded(localStorage.getItem(ONBOARDING_KEY) === "true");
      }
      setLoaded(true);
    })();
  }, []);

  // 自動保存（デバウンス500ms）
  useEffect(() => {
    if (!loaded || !currentProject) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      apiSaveProject(currentProject, state, scenarios);
    }, 500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [state, scenarios, loaded, currentProject]);

  // history追跡付きsetState
  const setStateWithHistory = useCallback((updater: SimState | ((prev: SimState) => SimState)) => {
    setState((prev) => {
      if (!skipHistoryRef.current) {
        setHistory((h) => [...h.slice(-MAX_HISTORY), prev]);
        setFuture([]);
      }
      skipHistoryRef.current = false;
      return typeof updater === "function" ? updater(prev) : updater;
    });
  }, []);

  // プロジェクト操作
  const createProjectAndSwitch = useCallback(async (name: string) => {
    const id = await apiCreateProject(name);
    setProjects((prev) => [...prev, id]);
    setCurrentProject(id);
    localStorage.setItem(PROJECT_KEY, id);
    return id;
  }, []);

  const switchProject = useCallback(async (id: string) => {
    // 現在のプロジェクトを保存してから切替
    if (currentProject) {
      await apiSaveProject(currentProject, state, scenarios);
    }
    const data = await apiLoadProject(id);
    setState(data.state);
    setScenarios(data.scenarios);
    setCurrentProject(id);
    localStorage.setItem(PROJECT_KEY, id);
    setHistory([]);
    setFuture([]);
  }, [currentProject, state, scenarios]);

  const deleteProjectById = useCallback(async (id: string) => {
    await apiDeleteProject(id);
    setProjects((prev) => prev.filter((p) => p !== id));
    if (currentProject === id) {
      const remaining = projects.filter((p) => p !== id);
      if (remaining.length > 0) {
        await switchProject(remaining[0]);
      } else {
        setCurrentProject(null);
        setState(defaultState);
        setScenarios([]);
      }
    }
  }, [currentProject, projects, switchProject]);

  // プラン操作
  const addPlan = useCallback((plan: Omit<PricingPlan, "id">) => {
    setStateWithHistory((prev) => ({
      ...prev,
      revenueModel: { ...prev.revenueModel, plans: [...prev.revenueModel.plans, { ...plan, id: crypto.randomUUID() }] },
    }));
  }, [setStateWithHistory]);

  const updatePlan = useCallback((id: string, updates: Partial<Omit<PricingPlan, "id">>) => {
    setStateWithHistory((prev) => ({
      ...prev,
      revenueModel: { ...prev.revenueModel, plans: prev.revenueModel.plans.map((p) => p.id === id ? { ...p, ...updates } : p) },
    }));
  }, [setStateWithHistory]);

  const removePlan = useCallback((id: string) => {
    setStateWithHistory((prev) => ({
      ...prev,
      revenueModel: { ...prev.revenueModel, plans: prev.revenueModel.plans.filter((p) => p.id !== id) },
    }));
  }, [setStateWithHistory]);

  const setSimulationMonths = useCallback((simulationMonths: number) => {
    setStateWithHistory((prev) => ({ ...prev, simulationMonths }));
  }, [setStateWithHistory]);

  const setInitialCash = useCallback((initialCash: number) => {
    setStateWithHistory((prev) => ({ ...prev, initialCash }));
  }, [setStateWithHistory]);

  const updateTax = useCallback((updates: Partial<TaxConfig>) => {
    setStateWithHistory((prev) => ({ ...prev, tax: { ...prev.tax, ...updates } }));
  }, [setStateWithHistory]);

  const addEmployee = useCallback((employee: Omit<Employee, "id">) => {
    setStateWithHistory((prev) => ({ ...prev, employees: [...prev.employees, { ...employee, id: crypto.randomUUID() }] }));
  }, [setStateWithHistory]);

  const updateEmployee = useCallback((id: string, updates: Partial<Omit<Employee, "id">>) => {
    setStateWithHistory((prev) => ({ ...prev, employees: prev.employees.map((e) => e.id === id ? { ...e, ...updates } : e) }));
  }, [setStateWithHistory]);

  const removeEmployee = useCallback((id: string) => {
    setStateWithHistory((prev) => ({ ...prev, employees: prev.employees.filter((e) => e.id !== id) }));
  }, [setStateWithHistory]);

  const addFixedCost = useCallback((cost: Omit<FixedCost, "id">) => {
    setStateWithHistory((prev) => ({ ...prev, fixedCosts: [...prev.fixedCosts, { ...cost, id: crypto.randomUUID() }] }));
  }, [setStateWithHistory]);

  const updateFixedCost = useCallback((id: string, updates: Partial<Omit<FixedCost, "id">>) => {
    setStateWithHistory((prev) => ({ ...prev, fixedCosts: prev.fixedCosts.map((c) => c.id === id ? { ...c, ...updates } : c) }));
  }, [setStateWithHistory]);

  const removeFixedCost = useCallback((id: string) => {
    setStateWithHistory((prev) => ({ ...prev, fixedCosts: prev.fixedCosts.filter((c) => c.id !== id) }));
  }, [setStateWithHistory]);

  const addOneTimeCost = useCallback((cost: Omit<OneTimeCost, "id">) => {
    setStateWithHistory((prev) => ({ ...prev, oneTimeCosts: [...prev.oneTimeCosts, { ...cost, id: crypto.randomUUID() }] }));
  }, [setStateWithHistory]);

  const updateOneTimeCost = useCallback((id: string, updates: Partial<Omit<OneTimeCost, "id">>) => {
    setStateWithHistory((prev) => ({ ...prev, oneTimeCosts: prev.oneTimeCosts.map((c) => c.id === id ? { ...c, ...updates } : c) }));
  }, [setStateWithHistory]);

  const removeOneTimeCost = useCallback((id: string) => {
    setStateWithHistory((prev) => ({ ...prev, oneTimeCosts: prev.oneTimeCosts.filter((c) => c.id !== id) }));
  }, [setStateWithHistory]);

  const addLoan = useCallback((loan: Omit<Loan, "id">) => {
    setStateWithHistory((prev) => ({ ...prev, loans: [...prev.loans, { ...loan, id: crypto.randomUUID() }] }));
  }, [setStateWithHistory]);

  const updateLoan = useCallback((id: string, updates: Partial<Omit<Loan, "id">>) => {
    setStateWithHistory((prev) => ({ ...prev, loans: prev.loans.map((l) => l.id === id ? { ...l, ...updates } : l) }));
  }, [setStateWithHistory]);

  const removeLoan = useCallback((id: string) => {
    setStateWithHistory((prev) => ({ ...prev, loans: prev.loans.filter((l) => l.id !== id) }));
  }, [setStateWithHistory]);

  // 実績
  const updateActual = useCallback((month: number, updates: Partial<Omit<MonthActual, "month">>) => {
    setStateWithHistory((prev) => {
      const existing = prev.actuals.find((a) => a.month === month);
      if (existing) {
        return { ...prev, actuals: prev.actuals.map((a) => a.month === month ? { ...a, ...updates } : a) };
      }
      return { ...prev, actuals: [...prev.actuals, { month, revenue: null, customers: null, costs: null, note: "", ...updates }] };
    });
  }, [setStateWithHistory]);

  // シナリオ
  const saveScenario = useCallback((name: string) => {
    setScenarios((prev) => [...prev, { id: crypto.randomUUID(), name, state: structuredClone(state) }]);
  }, [state]);

  const overwriteScenario = useCallback((id: string) => {
    setScenarios((prev) => prev.map((s) => s.id === id ? { ...s, state: structuredClone(state) } : s));
  }, [state]);

  const renameScenario = useCallback((id: string, name: string) => {
    setScenarios((prev) => prev.map((s) => s.id === id ? { ...s, name } : s));
  }, []);

  const loadScenario = useCallback((id: string) => {
    const scenario = scenarios.find((s) => s.id === id);
    if (scenario) setState(structuredClone(scenario.state));
  }, [scenarios]);

  const duplicateScenario = useCallback((id: string) => {
    const scenario = scenarios.find((s) => s.id === id);
    if (scenario) {
      setScenarios((prev) => [...prev, { id: crypto.randomUUID(), name: `${scenario.name} (コピー)`, state: structuredClone(scenario.state) }]);
    }
  }, [scenarios]);

  const deleteScenario = useCallback((id: string) => {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Undo/Redo
  const undo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setFuture((f) => [state, ...f]);
    setHistory((h) => h.slice(0, -1));
    skipHistoryRef.current = true;
    setState(prev);
  }, [history, state]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory((h) => [...h, state]);
    setFuture((f) => f.slice(1));
    skipHistoryRef.current = true;
    setState(next);
  }, [future, state]);

  const importState = useCallback((data: { state: SimState; scenarios: Scenario[] }) => {
    setState(data.state);
    setScenarios(data.scenarios);
  }, []);

  const completeOnboarding = useCallback(async (initialState: SimState) => {
    // 新規プロジェクトを作成
    const name = prompt("プロジェクト名を入力してください（例: KitamiTechnica）");
    if (!name) return;
    const id = await apiCreateProject(name);
    setProjects((prev) => [...prev, id]);
    setCurrentProject(id);
    localStorage.setItem(PROJECT_KEY, id);
    setState(initialState);
    setOnboarded(true);
    localStorage.setItem(ONBOARDING_KEY, "true");
    await apiSaveProject(id, initialState, []);
  }, []);

  return {
    state, scenarios, loaded, onboarded,
    projects, currentProject,
    canUndo: history.length > 0, canRedo: future.length > 0,
    undo, redo,
    completeOnboarding,
    createProjectAndSwitch, switchProject, deleteProjectById,
    addPlan, updatePlan, removePlan, setSimulationMonths, setInitialCash, updateTax,
    addEmployee, updateEmployee, removeEmployee,
    addFixedCost, updateFixedCost, removeFixedCost,
    addOneTimeCost, updateOneTimeCost, removeOneTimeCost,
    addLoan, updateLoan, removeLoan,
    updateActual,
    saveScenario, overwriteScenario, renameScenario, loadScenario, duplicateScenario, deleteScenario,
    importState,
  };
}
