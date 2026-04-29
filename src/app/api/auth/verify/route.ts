import { NextRequest, NextResponse } from "next/server";

declare global {
  // eslint-disable-next-line no-var
  var __ambientPending: Map<string, { name: string; email: string; role: string; code: string; createdAt: number }> | undefined;
}

const pending = (globalThis.__ambientPending ??= new Map());

export async function POST(req: NextRequest) {
  const { email, code } = await req.json();
  if (!email || !code) {
    return NextResponse.json({ error: "Email and code are required." }, { status: 400 });
  }

  const entry = pending.get(email.toLowerCase());
  if (!entry) {
    return NextResponse.json({ error: "No pending verification for this email. Please register again." }, { status: 404 });
  }

  const age = Date.now() - entry.createdAt;
  if (age > 15 * 60 * 1000) {
    pending.delete(email.toLowerCase());
    return NextResponse.json({ error: "Code has expired. Please register again." }, { status: 410 });
  }

  if (entry.code !== String(code).trim()) {
    return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
  }

  pending.delete(email.toLowerCase());
  return NextResponse.json({ success: true, name: entry.name, email: entry.email, role: entry.role });
}
