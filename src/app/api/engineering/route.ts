import { NextRequest, NextResponse } from "next/server";

const TOKEN = process.env.GITHUB_TOKEN;
const REPO  = process.env.GITHUB_REPO ?? "ambientintel/ambientprototype";
const PATH  = "engineering/board.json";

async function ghFetch(method = "GET", body?: object) {
  return fetch(`https://api.github.com/repos/${REPO}/contents/${PATH}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });
}

// GET /api/engineering — fetch current board state
export async function GET() {
  if (!TOKEN) return NextResponse.json({ board: null, sha: null, configured: false });
  const res = await ghFetch();
  if (res.status === 404) return NextResponse.json({ board: null, sha: null, configured: true });
  if (!res.ok) return NextResponse.json({ board: null, sha: null, configured: true });
  const data = await res.json() as { content: string; sha: string };
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  try {
    return NextResponse.json({ board: JSON.parse(content), sha: data.sha, configured: true });
  } catch {
    return NextResponse.json({ board: null, sha: data.sha, configured: true });
  }
}

// PUT /api/engineering — write board state
export async function PUT(req: NextRequest) {
  if (!TOKEN) return NextResponse.json({ error: "GITHUB_TOKEN not set" }, { status: 503 });
  const { board, sha } = await req.json() as { board: object; sha?: string };
  if (!board) return NextResponse.json({ error: "board required" }, { status: 400 });
  const encoded = Buffer.from(JSON.stringify(board, null, 2), "utf-8").toString("base64");
  const body: Record<string, string> = {
    message: "engineering: sync board state",
    content: encoded,
  };
  if (sha) body.sha = sha;
  const res = await ghFetch("PUT", body);
  if (res.status === 409) return NextResponse.json({ error: "SHA conflict" }, { status: 409 });
  if (!res.ok) {
    const err = await res.json() as { message?: string };
    return NextResponse.json({ error: err.message ?? "GitHub write failed" }, { status: 500 });
  }
  const data = await res.json() as { content?: { sha: string } };
  return NextResponse.json({ sha: data.content?.sha });
}
