// ZMusic Service Worker — Offline caching for PWA
// Caches app shell + generated audio for offline access

const CACHE_NAME = 'zmusic-v7.4.1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-72.png',
  '/icon-192.png',
  '/icon-512.png',
];

// Install: pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch: cache-first for app shell, network-first for API, stale-while-revalidate for audio
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET
  if (req.method !== 'GET') return;

  // Skip cross-origin (API calls to external services)
  if (url.origin !== self.location.origin) return;

  // Skip Vite HMR in dev
  if (url.pathname.startsWith('/@') || url.pathname.includes('?import')) return;

  // API calls: network-first, no cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  // Audio/video files: stale-while-revalidate (cache for offline playback)
  if (req.destination === 'audio' || req.destination === 'video' ||
      url.pathname.match(/\.(mp3|wav|flac|mp4|webm)$/i)) {
    event.respondWith(
      caches.open(CACHE_NAME + '-media').then(async (cache) => {
        const cached = await cache.match(req);
        const networkPromise = fetch(req).then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        }).catch(() => cached);
        return cached || networkPromise;
      })
    );
    return;
  }

  // Default: stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(req);
      const networkPromise = fetch(req).then((res) => {
        if (res.ok && res.type === 'basic') cache.put(req, res.clone());
        return res;
      }).catch(() => cached);
      return cached || networkPromise;
    })
  );
});

// Message: allow page to trigger skipWaiting
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
