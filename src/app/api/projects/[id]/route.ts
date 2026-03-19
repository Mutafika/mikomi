import { NextResponse } from "next/server";
import { loadState, saveState, loadScenarios, saveScenarios } from "@/lib/storage";

// GET /api/projects/[id] — state + scenarios取得
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({
    state: loadState(id),
    scenarios: loadScenarios(id),
  });
}

// PUT /api/projects/[id] — state + scenarios保存
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  if (body.state) saveState(id, body.state);
  if (body.scenarios) saveScenarios(id, body.scenarios);
  return NextResponse.json({ ok: true });
}
