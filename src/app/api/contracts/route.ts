import { NextRequest, NextResponse } from "next/server";

const TOKEN = process.env.GITHUB_TOKEN;
const REPO  = process.env.GITHUB_REPO ?? "ambientintel/ambientprototype";
const DIR   = "contracts";

async function gh(path: string, method = "GET", body?: object) {
  return fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

// GET /api/contracts — list + fetch all saved contracts
export async function GET() {
  if (!TOKEN) return NextResponse.json({ files: [], configured: false });
  const res = await gh(DIR);
  if (!res.ok) return NextResponse.json({ files: [], configured: true });
  const data = await res.json();
  if (!Array.isArray(data)) return NextResponse.json({ files: [] });

  const files = await Promise.all(
    data
      .filter((f: { name: string }) => f.name.endsWith(".md") || f.name.endsWith(".txt"))
      .map(async (f: { name: string; path: string; sha: string }) => {
        const r = await gh(f.path);
        if (!r.ok) return { name: f.name, path: f.path, sha: f.sha, content: "" };
        const d = await r.json();
        const content = Buffer.from(d.content as string, "base64").toString("utf-8");
        return { name: f.name, path: f.path, sha: f.sha, content };
      })
  );
  return NextResponse.json({ files, configured: true });
}

// POST /api/contracts — save or update a contract
export async function POST(req: NextRequest) {
  if (!TOKEN) return NextResponse.json({ error: "GITHUB_TOKEN not set in Vercel environment variables" }, { status: 503 });
  const { filename, content, sha } = await req.json() as { filename: string; content: string; sha?: string };
  if (!filename || !content) return NextResponse.json({ error: "filename and content required" }, { status: 400 });
  const encoded = Buffer.from(content, "utf-8").toString("base64");
  const body: Record<string, string> = { message: `contracts: save ${filename}`, content: encoded };
  if (sha) body.sha = sha;
  const res = await gh(`${DIR}/${filename}`, "PUT", body);
  if (!res.ok) {
    const err = await res.json() as { message?: string };
    return NextResponse.json({ error: err.message ?? "GitHub write failed" }, { status: 500 });
  }
  const data = await res.json() as { content?: { sha: string; path: string } };
  return NextResponse.json({ sha: data.content?.sha, path: data.content?.path });
}

// DELETE /api/contracts — remove a contract from GitHub
export async function DELETE(req: NextRequest) {
  if (!TOKEN) return NextResponse.json({ error: "GITHUB_TOKEN not set" }, { status: 503 });
  const { filename, sha } = await req.json() as { filename: string; sha: string };
  if (!filename || !sha) return NextResponse.json({ error: "filename and sha required" }, { status: 400 });
  const res = await gh(`${DIR}/${filename}`, "DELETE", { message: `contracts: delete ${filename}`, sha });
  if (!res.ok) return NextResponse.json({ error: "GitHub delete failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
