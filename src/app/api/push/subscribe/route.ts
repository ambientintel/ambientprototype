import { NextRequest, NextResponse } from 'next/server';

const EC_ID  = process.env.EDGE_CONFIG_ID!;
const V_TOKEN = process.env.VERCEL_TOKEN!;
const TEAM   = 'bribradley-7607s-projects';

async function readSubs(): Promise<Record<string, object>> {
  const res = await fetch(
    `https://api.vercel.com/v1/edge-config/${EC_ID}/items?teamId=${TEAM}`,
    { headers: { Authorization: `Bearer ${V_TOKEN}` }, cache: 'no-store' }
  );
  if (!res.ok) return {};
  const items: { key: string; value: unknown }[] = await res.json();
  const subs: Record<string, object> = {};
  for (const item of items) {
    if (item.key.startsWith('sub_')) subs[item.key] = item.value as object;
  }
  return subs;
}

async function writeSub(key: string, value: object) {
  await fetch(
    `https://api.vercel.com/v1/edge-config/${EC_ID}/items?teamId=${TEAM}`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${V_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ operation: 'upsert', key, value }] }),
    }
  );
}

async function deleteSub(key: string) {
  await fetch(
    `https://api.vercel.com/v1/edge-config/${EC_ID}/items?teamId=${TEAM}`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${V_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ operation: 'delete', key }] }),
    }
  );
}

export async function POST(req: NextRequest) {
  const sub = await req.json();
  if (!sub?.endpoint) return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
  const key = 'sub_' + Buffer.from(sub.endpoint).toString('base64').slice(0, 32).replace(/[^a-z0-9]/gi, '_');
  await writeSub(key, sub);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { endpoint } = await req.json();
  const key = 'sub_' + Buffer.from(endpoint).toString('base64').slice(0, 32).replace(/[^a-z0-9]/gi, '_');
  await deleteSub(key);
  return NextResponse.json({ ok: true });
}
