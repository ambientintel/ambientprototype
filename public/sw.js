const CACHE = 'ambient-v1';
const PRECACHE = ['/', '/mobilelab', '/dashboard'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

// Push notification handler
self.addEventListener('push', e => {
  const data = e.data?.json() ?? {};
  const title = data.title ?? 'Fall Alert';
  const options = {
    body:    data.body    ?? 'A fall event has been detected.',
    icon:    data.icon    ?? '/icon-192.png',
    badge:   data.badge   ?? '/icon-192.png',
    tag:     data.tag     ?? 'fall-alert',
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 400],
    data: { url: data.url ?? '/mobilelab', room: data.room ?? '' },
    actions: [
      { action: 'respond', title: 'Respond' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// Notification click — open or focus the app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  const url = e.notification.data?.url ?? '/mobilelab';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const match = list.find(c => c.url.includes('/mobilelab'));
      return match ? match.focus() : clients.openWindow(url);
    })
  );
});
