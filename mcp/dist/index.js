import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";
// データディレクトリ
const PROJECTS_DIR = join(homedir(), ".mikomi", "projects");
let currentProjectId = "";
function ensureDir(dir) {
    if (!existsSync(dir))
        mkdirSync(dir, { recursive: true });
}
function listProjects() {
    ensureDir(PROJECTS_DIR);
    return readdirSync(PROJECTS_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
}
function getProjectDir(id) {
    return join(PROJECTS_DIR, id);
}
function loadData() {
    if (!currentProjectId)
        return {};
    const filePath = join(getProjectDir(currentProjectId), "state.json");
    if (!existsSync(filePath))
        return {};
    return JSON.parse(readFileSync(filePath, "utf-8"));
}
function saveData(data) {
    if (!currentProjectId)
        return;
    const dir = getProjectDir(currentProjectId);
    ensureDir(dir);
    writeFileSync(join(dir, "state.json"), JSON.stringify(data, null, 2));
}
// サーバー
const server = new McpServer({
    name: "mikomi",
    version: "0.1.0",
});
// ツール: プロジェクト一覧
server.tool("list_projects", "Mikomiのプロジェクト一覧を取得する", {}, async () => {
    const projects = listProjects();
    return {
        content: [{ type: "text", text: `プロジェクト一覧:\n${projects.length > 0 ? projects.map((p) => `- ${p}${p === currentProjectId ? " (現在)" : ""}`).join("\n") : "(なし)"}\n\n現在のプロジェクト: ${currentProjectId || "(未選択)"}` }],
    };
});
// ツール: プロジェクト切替/作成
server.tool("switch_project", "プロジェクトを切り替える。存在しなければ新規作成する。", {
    name: z.string().describe("プロジェクト名"),
}, async ({ name }) => {
    const dir = getProjectDir(name);
    ensureDir(dir);
    const statePath = join(dir, "state.json");
    if (!existsSync(statePath))
        writeFileSync(statePath, "{}");
    currentProjectId = name;
    return {
        content: [{ type: "text", text: `プロジェクト「${name}」に切り替えました。` }],
    };
});
// ツール: シミュレーションデータを取得
server.tool("get_simulation", "現在のMikomiシミュレーションデータを取得する", {}, async () => {
    const data = loadData();
    return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
});
// ツール: シミュレーションデータを更新
server.tool("update_simulation", "Mikomiシミュレーションデータを更新する。部分更新OK。", {
    updates: z.string().describe("更新するSimStateのJSON文字列（部分更新可）"),
}, async ({ updates }) => {
    const current = loadData();
    const parsed = JSON.parse(updates);
    const merged = { ...current, ...parsed };
    saveData(merged);
    return {
        content: [{ type: "text", text: `更新しました。\n${JSON.stringify(merged, null, 2)}` }],
    };
});
// ツール: 料金プランを追加
server.tool("add_plan", "料金プランを追加する", {
    name: z.string().describe("プラン名（例: Basic）"),
    unitPrice: z.number().describe("月額単価（円）"),
    monthlyNewCustomers: z.number().describe("月間新規獲得数"),
    monthlyChurnRate: z.number().describe("月間解約率（0.03 = 3%）"),
}, async ({ name, unitPrice, monthlyNewCustomers, monthlyChurnRate }) => {
    const data = loadData();
    const rm = data.revenueModel ?? { type: "mrr", plans: [] };
    const plans = rm.plans ?? [];
    plans.push({
        id: crypto.randomUUID(),
        name,
        unitPrice,
        initialCustomers: 0,
        monthlyNewCustomers,
        monthlyChurnRate,
    });
    rm.plans = plans;
    data.revenueModel = rm;
    saveData(data);
    return {
        content: [{ type: "text", text: `プラン「${name}」を追加しました。月額${unitPrice}円、獲得${monthlyNewCustomers}社/月、解約率${(monthlyChurnRate * 100).toFixed(1)}%` }],
    };
});
// ツール: 社員を追加
server.tool("add_employee", "社員を追加する", {
    name: z.string().describe("社員名"),
    role: z.string().describe("役職（エンジニア、営業など）"),
    monthlySalary: z.number().describe("月給（円）"),
    hireMonth: z.number().describe("採用月（何ヶ月目）"),
    monthlyAcquisition: z.number().optional().describe("月間顧客獲得数（営業の場合）"),
}, async ({ name, role, monthlySalary, hireMonth, monthlyAcquisition }) => {
    const data = loadData();
    const employees = data.employees ?? [];
    employees.push({
        id: crypto.randomUUID(),
        name,
        role,
        monthlySalary,
        hireMonth,
        onboardingCost: 200000,
        annualRaiseRate: 0.03,
        monthlyAcquisition: monthlyAcquisition ?? 0,
        rampUpMonths: monthlyAcquisition ? 3 : 0,
        incentive: { type: "none", rate: 0, fixedAmount: 0 },
    });
    data.employees = employees;
    saveData(data);
    return {
        content: [{ type: "text", text: `「${name}」(${role})を${hireMonth}ヶ月目に月給${monthlySalary.toLocaleString()}円で追加しました。` }],
    };
});
// ツール: 固定費を追加
server.tool("add_fixed_cost", "固定費を追加する", {
    name: z.string().describe("費目名（家賃、インフラなど）"),
    monthlyAmount: z.number().describe("月額（円）"),
}, async ({ name, monthlyAmount }) => {
    const data = loadData();
    const costs = data.fixedCosts ?? [];
    costs.push({ id: crypto.randomUUID(), name, monthlyAmount });
    data.fixedCosts = costs;
    saveData(data);
    return {
        content: [{ type: "text", text: `固定費「${name}」${monthlyAmount.toLocaleString()}円/月を追加しました。` }],
    };
});
// ツール: 融資を追加
server.tool("add_loan", "融資を追加する", {
    name: z.string().describe("借入先名（例: 日本政策金融公庫）"),
    amount: z.number().describe("借入額（円）"),
    annualRate: z.number().describe("年利（0.02 = 2%）"),
    termMonths: z.number().describe("返済期間（月数）"),
    graceMonths: z.number().optional().describe("据置期間（月数）"),
}, async ({ name, amount, annualRate, termMonths, graceMonths }) => {
    const data = loadData();
    const loans = data.loans ?? [];
    loans.push({
        id: crypto.randomUUID(),
        name,
        amount,
        annualRate,
        termMonths,
        graceMonths: graceMonths ?? 0,
        startMonth: 1,
        repaymentType: "equal-payment",
    });
    data.loans = loans;
    saveData(data);
    return {
        content: [{ type: "text", text: `融資「${name}」${(amount / 10000).toFixed(0)}万円（年利${(annualRate * 100).toFixed(1)}%、${termMonths}ヶ月）を追加しました。` }],
    };
});
// ツール: 基本設定を変更
server.tool("set_config", "基本設定を変更する", {
    initialCash: z.number().optional().describe("自己資本（円）。融資は別途add_loanで追加"),
    simulationMonths: z.number().optional().describe("シミュレーション期間（月数）"),
}, async ({ initialCash, simulationMonths }) => {
    const data = loadData();
    if (initialCash != null)
        data.initialCash = initialCash;
    if (simulationMonths != null)
        data.simulationMonths = simulationMonths;
    saveData(data);
    const parts = [];
    if (initialCash != null)
        parts.push(`自己資本: ${(initialCash / 10000).toFixed(0)}万円`);
    if (simulationMonths != null)
        parts.push(`期間: ${simulationMonths}ヶ月`);
    return {
        content: [{ type: "text", text: `設定変更: ${parts.join("、")}` }],
    };
});
// ツール: データをリセット
server.tool("reset", "シミュレーションデータを全てリセットする", {}, async () => {
    saveData({});
    return {
        content: [{ type: "text", text: "データをリセットしました。" }],
    };
});
// ツール: Web UIからエクスポートしたJSONをインポート
server.tool("import_json", "MikomiのWeb UIからエクスポートしたJSONデータをインポートする", {
    json: z.string().describe("エクスポートされたJSONの内容"),
}, async ({ json }) => {
    const parsed = JSON.parse(json);
    const state = parsed.state ?? parsed;
    saveData(state);
    return {
        content: [{ type: "text", text: "インポートしました。" }],
    };
});
// ツール: Web UIにインポートできるJSONをエクスポート
server.tool("export_json", "Web UIにインポートできるJSON形式でエクスポートする", {}, async () => {
    const data = loadData();
    const exportData = { state: data, scenarios: [] };
    return {
        content: [{ type: "text", text: JSON.stringify(exportData, null, 2) }],
    };
});
// 起動
const transport = new StdioServerTransport();
server.connect(transport);
