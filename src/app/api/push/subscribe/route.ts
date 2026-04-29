import { NextRequest, NextResponse } from 'next/server';

declare global {
  // eslint-disable-next-line no-var
  var __pushSubscriptions: Map<string, PushSubscriptionJSON> | undefined;
}

function getStore() {
  if (!globalThis.__pushSubscriptions) globalThis.__pushSubscriptions = new Map();
  return globalThis.__pushSubscriptions;
}

export async function POST(req: NextRequest) {
  const sub: PushSubscriptionJSON = await req.json();
  if (!sub?.endpoint) return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
  getStore().set(sub.endpoint, sub);
  return NextResponse.json({ ok: true, count: getStore().size });
}

export async function DELETE(req: NextRequest) {
  const { endpoint } = await req.json();
  getStore().delete(endpoint);
  return NextResponse.json({ ok: true });
}
