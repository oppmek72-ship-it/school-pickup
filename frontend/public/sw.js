const CACHE_NAME = 'school-pickup-v7';
const API_CACHE = 'school-pickup-api-v1';
const STATIC_ASSETS = ['/manifest.json', '/icon-192.png', '/icon-512.png'];

// API endpoints worth caching (GET only) — stale-while-revalidate
const CACHEABLE_API_PATHS = ['/api/students', '/api/pickup/queue', '/api/health'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== API_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // ===== API requests (cross-origin to backend) — stale-while-revalidate for known endpoints =====
  // We cache by pathname (regardless of origin) so backend URL changes still benefit
  const isCacheableApi = CACHEABLE_API_PATHS.some((p) => url.pathname === p || url.pathname.startsWith(p + '?') || url.pathname.startsWith(p + '/'));
  if (isCacheableApi) {
    event.respondWith(
      caches.open(API_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          const networkPromise = fetch(event.request).then((res) => {
            if (res && res.ok) cache.put(event.request, res.clone()).catch(() => {});
            return res;
          }).catch(() => cached); // network failed → fall back to cache
          // Return cache instantly if we have it; otherwise wait for network
          return cached || networkPromise;
        })
      )
    );
    return;
  }

  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/socket.io')) return;

  // Hashed build assets (filenames change on rebuild) — cache-first is safe
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML / index / everything else — NETWORK FIRST so users always get fresh code
  event.respondWith(
    fetch(event.request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'ມີການແຈ້ງເຕືອນໃໝ່',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'school-pickup',
    data: { url: data.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(data.title || 'School Pick-up', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
