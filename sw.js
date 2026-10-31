// Health OS — service worker
// Réseau d'abord pour les fichiers de l'app (mises à jour immédiates),
// cache en secours (fonctionnement 100 % hors-ligne).
const CACHE = 'health-os-v11';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './icon.svg',
  './js/app.js',
  './js/store.js',
  './js/data.js',
  './js/lib.js',
  './js/engine.js',
  './js/views.js',
  './js/runners.js',
  './js/coach.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // Uniquement nos propres fichiers en GET (l'API du coach IA passe directement)
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then((hit) => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))
      )
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) if ('focus' in c) return c.focus();
      return clients.openWindow ? clients.openWindow('./') : undefined;
    })
  );
});
