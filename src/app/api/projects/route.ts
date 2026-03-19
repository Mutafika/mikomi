import { NextResponse } from "next/server";
import { listProjects, createProject, deleteProject } from "@/lib/storage";

// GET /api/projects — プロジェクト一覧
export async function GET() {
  return NextResponse.json(listProjects());
}

// POST /api/projects — プロジェクト作成
export async function POST(req: Request) {
  const { name } = await req.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  const id = name.replace(/[^a-zA-Z0-9_\-\u3000-\u9FFF\u4E00-\u9FFF]/g, "_");
  createProject(id);
  return NextResponse.json({ id });
}

// DELETE /api/projects — プロジェクト削除
export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  deleteProject(id);
  return NextResponse.json({ ok: true });
}
