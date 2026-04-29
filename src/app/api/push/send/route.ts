import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

const EC_ID   = process.env.EDGE_CONFIG_ID!;
const V_TOKEN  = process.env.VERCEL_TOKEN!;
const TEAM    = 'bribradley-7607s-projects';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

async function readSubs(): Promise<webpush.PushSubscription[]> {
  const res = await fetch(
    `https://api.vercel.com/v1/edge-config/${EC_ID}/items?teamId=${TEAM}`,
    { headers: { Authorization: `Bearer ${V_TOKEN}` }, cache: 'no-store' }
  );
  if (!res.ok) return [];
  const items: { key: string; value: unknown }[] = await res.json();
  return items
    .filter(i => i.key.startsWith('sub_'))
    .map(i => i.value as webpush.PushSubscription);
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
  const { room, patient, floor, severity, confidence, sensor } = await req.json();

  const payload = JSON.stringify({
    title: severity === 'critical' ? '🚨 Fall Alert — Critical' : '⚠️ Fall Alert',
    body:  `Room ${room} · ${patient} · ${floor} · ${confidence}% confidence`,
    icon:  '/icon-192.png',
    badge: '/icon-192.png',
    tag:   `fall-${room}`,
    url:   '/mobilelab',
    room, patient, floor, severity, sensor,
  });

  const subs = await readSubs();
  if (subs.length === 0) return NextResponse.json({ sent: 0, message: 'No subscriptions' });

  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub, payload);
      sent++;
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        const key = 'sub_' + Buffer.from(sub.endpoint).toString('base64').slice(0, 32).replace(/[^a-z0-9]/gi, '_');
        deleteSub(key);
      }
    }
  }

  return NextResponse.json({ sent, total: subs.length });
}
