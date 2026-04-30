const CACHE = 'ambient-v5';
const PRECACHE = ['/', '/mobile', '/mobilelab'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

self.addEventListener('push', e => {
  let data = {};
  try { data = e.data?.json() ?? {}; } catch { data = {}; }

  const isCritical = data.severity === 'critical';

  const title = isCritical
    ? `FALL DETECTED — Room ${data.room ?? '—'}`
    : `FALL ALERT — Room ${data.room ?? '—'}`;

  const body = [
    data.patient,
    data.floor,
    data.confidence ? `${data.confidence}% confidence` : null,
    data.sensor,
  ].filter(Boolean).join('  ·  ');

  const options = {
    body,
    icon:  '/icon-192.png',
    badge: '/badge-96.png',
    image: isCritical
      ? 'https://ambientprototype.vercel.app/notif-critical.png'
      : 'https://ambientprototype.vercel.app/notif-warning.png',
    tag:   `fall-${data.room ?? 'alert'}`,
    data:  { url: '/mobilelab' },
  };

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      // Broadcast to all open PWA windows so they can show an in-app banner
      list.forEach(client => client.postMessage({ type: 'PUSH_ALERT', payload: data }));
      // Always show the OS notification (covers lock screen + background)
      return self.registration.showNotification(title, options);
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url ?? '/mobilelab';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const match = list.find(c => c.url.includes('ambientprototype'));
      return match ? match.focus() : clients.openWindow(url);
    })
  );
});
