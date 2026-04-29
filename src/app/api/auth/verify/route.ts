import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

// Must import the same map — co-locate in a shared module in production.
// For this prototype, re-export the map from the register route isn't straightforward
// across serverless boundaries, so we use a global variable attached to the Node.js
// module scope that both routes share within the same Lambda instance.

declare global {
  // eslint-disable-next-line no-var
  var __ambientPending: Map<string, { name: string; email: string; role: string; createdAt: number }> | undefined;
}

const pending = (globalThis.__ambientPending ??= new Map());

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token." }, { status: 400 });

  const entry = pending.get(token);
  if (!entry) return NextResponse.json({ error: "Invalid or expired token." }, { status: 404 });

  const age = Date.now() - entry.createdAt;
  if (age > 24 * 60 * 60 * 1000) {
    pending.delete(token);
    return NextResponse.json({ error: "This verification link has expired." }, { status: 410 });
  }

  pending.delete(token);
  return NextResponse.json({ success: true, name: entry.name, email: entry.email, role: entry.role });
}
