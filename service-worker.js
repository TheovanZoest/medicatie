/* Zorgt dat de app ook zonder internet opent en zich vanzelf bijwerkt. */
const CACHE = 'medicatie-v1.5.1';
const BESTANDEN = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BESTANDEN)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('medicatie-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // Eerst internet (dan krijgt u altijd de nieuwste versie), anders de bewaarde kopie
  e.respondWith(fetch(req, { cache: 'no-store' }).then(res => {
    if (res.ok) { const kopie = res.clone(); caches.open(CACHE).then(c => c.put(req, kopie)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
});
// Klik op een herinnering (of op "Ingenomen" / "Later") in de melding
self.addEventListener('notificationclick', e => {
  const n = e.notification, data = n.data || {}, action = e.action || 'open';
  n.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const c = list[0];
    if (c) { if (data.doseKey) c.postMessage({ type: 'notif-action', action, doseKey: data.doseKey }); return c.focus(); }
    const url = data.doseKey ? './?dose=' + encodeURIComponent(data.doseKey) + '&action=' + action : './';
    return self.clients.openWindow(url);
  }));
});
