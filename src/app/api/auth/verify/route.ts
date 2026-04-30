import { NextRequest, NextResponse } from "next/server";

declare global {
  // eslint-disable-next-line no-var
  var __ambientPending: Map<string, { code: string; name: string; email: string; role: string; createdAt: number }> | undefined;
}

function getStore() {
  if (!globalThis.__ambientPending) {
    globalThis.__ambientPending = new Map();
  }
  return globalThis.__ambientPending;
}

export async function POST(req: NextRequest) {
  const { email, code } = await req.json();
  if (!email || !code) {
    return NextResponse.json({ error: "Email and code are required." }, { status: 400 });
  }

  const store = getStore();
  const entry = store.get(email.toLowerCase());
  if (!entry) {
    return NextResponse.json({ error: "No pending verification for this email. Please register again." }, { status: 404 });
  }

  if (Date.now() - entry.createdAt > 15 * 60 * 1000) {
    store.delete(email.toLowerCase());
    return NextResponse.json({ error: "Code has expired. Please register again." }, { status: 410 });
  }

  if (entry.code !== String(code).trim()) {
    return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
  }

  store.delete(email.toLowerCase());
  return NextResponse.json({ success: true, name: entry.name, email: entry.email, role: entry.role });
}
