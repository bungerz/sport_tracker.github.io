const CACHE_NAME = 'health-os-cache-v3';
const CDN_CACHE_NAME = 'health-os-cdn-v3';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

const CDN_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)),
      caches.open(CDN_CACHE_NAME).then((cache) => {
        // Cache CDN assets quietly, don't fail install if network is down
        return Promise.allSettled(
          CDN_ASSETS.map((url) =>
            fetch(url, { mode: 'cors' })
              .then((res) => {
                if (res.ok) return cache.put(url, res);
              })
              .catch((e) => console.log('CDN pre-cache skipped for:', url, e.message))
          )
        );
      })
    ])
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== CDN_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // External CDN scripts: Cache-first, network fallback & cache
  if (url.origin.includes('unpkg.com') || url.origin.includes('tailwindcss.com')) {
    event.respondWith(
      caches.open(CDN_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            return cachedResponse;
          });
        });
      })
    );
    return;
  }

  // Local assets: Stale-While-Revalidate with index.html fallback
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            return cachedResponse || cache.match('./index.html');
          });

        return cachedResponse || fetchPromise;
      });
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});
