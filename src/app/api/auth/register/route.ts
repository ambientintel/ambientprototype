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

function purge() {
  const store = getStore();
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (now - v.createdAt > 15 * 60 * 1000) store.delete(k);
  }
}

export async function POST(req: NextRequest) {
  const { name, email, role } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  purge();

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const store = getStore();
  store.set(email.toLowerCase(), { code, name, email: email.toLowerCase(), role, createdAt: Date.now() });

  return NextResponse.json({ success: true, code });
}
