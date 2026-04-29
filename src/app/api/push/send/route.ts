import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

declare global {
  // eslint-disable-next-line no-var
  var __pushSubscriptions: Map<string, PushSubscriptionJSON> | undefined;
}

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { room, patient, floor, severity, confidence, sensor } = body;

  const payload = JSON.stringify({
    title: severity === 'critical' ? '🚨 Fall Alert — Critical' : '⚠️ Fall Alert',
    body:  `Room ${room} · ${patient} · ${floor} · ${confidence}% confidence`,
    icon:  '/icon-192.png',
    badge: '/icon-192.png',
    tag:   `fall-${room}`,
    url:   '/mobilelab',
    room, patient, floor, severity, sensor,
  });

  const store = globalThis.__pushSubscriptions;
  if (!store || store.size === 0) {
    return NextResponse.json({ sent: 0, message: 'No subscriptions registered' });
  }

  let sent = 0;
  const failed: string[] = [];

  for (const [endpoint, sub] of store.entries()) {
    try {
      await webpush.sendNotification(sub as webpush.PushSubscription, payload);
      sent++;
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) store.delete(endpoint);
      else failed.push(endpoint);
    }
  }

  return NextResponse.json({ sent, failed: failed.length });
}
