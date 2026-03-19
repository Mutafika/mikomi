import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const BASE_DIR = join(homedir(), ".mikomi", "projects");

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function listProjects(): string[] {
  ensureDir(BASE_DIR);
  return readdirSync(BASE_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

export function getProjectDir(projectId: string): string {
  return join(BASE_DIR, projectId);
}

export function createProject(projectId: string) {
  const dir = getProjectDir(projectId);
  ensureDir(dir);
  const statePath = join(dir, "state.json");
  if (!existsSync(statePath)) {
    writeFileSync(statePath, "{}");
  }
  const scenariosPath = join(dir, "scenarios.json");
  if (!existsSync(scenariosPath)) {
    writeFileSync(scenariosPath, "[]");
  }
}

export function deleteProject(projectId: string) {
  const dir = getProjectDir(projectId);
  if (existsSync(dir)) {
    const files = readdirSync(dir);
    for (const f of files) {
      const { unlinkSync } = require("fs");
      unlinkSync(join(dir, f));
    }
    const { rmdirSync } = require("fs");
    rmdirSync(dir);
  }
}

export function loadState(projectId: string): Record<string, unknown> {
  const filePath = join(getProjectDir(projectId), "state.json");
  if (!existsSync(filePath)) return {};
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return {};
  }
}

export function saveState(projectId: string, data: Record<string, unknown>) {
  const dir = getProjectDir(projectId);
  ensureDir(dir);
  writeFileSync(join(dir, "state.json"), JSON.stringify(data, null, 2));
}

export function loadScenarios(projectId: string): unknown[] {
  const filePath = join(getProjectDir(projectId), "scenarios.json");
  if (!existsSync(filePath)) return [];
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return [];
  }
}

export function saveScenarios(projectId: string, data: unknown[]) {
  const dir = getProjectDir(projectId);
  ensureDir(dir);
  writeFileSync(join(dir, "scenarios.json"), JSON.stringify(data, null, 2));
}
