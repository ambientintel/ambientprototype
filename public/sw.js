const CACHE = 'ambient-v3';
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
  try { data = e.data?.json() ?? {}; } catch { data = { title: 'Fall Alert', body: e.data?.text() ?? '' }; }

  // Keep options minimal for iOS compatibility — no vibrate, no actions, no requireInteraction
  const options = {
    body:  data.body  ?? 'A fall event has been detected.',
    icon:  '/icon-192.png',
    badge: '/icon-192.png',
    tag:   data.tag   ?? 'fall-alert',
    data:  { url: data.url ?? '/mobilelab' },
  };

  e.waitUntil(self.registration.showNotification(data.title ?? '🚨 Fall Alert', options));
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
