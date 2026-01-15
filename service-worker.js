const CACHE_NAME = 'san-cache-v1';
const RUNTIME_CACHE = 'san-runtime-cache-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json'
];

// Install: Cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).then(() => {
        self.skipWaiting(); // Activate immediately
      });
    })
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      self.clients.claim(); // Claim all clients
    })
  );
});

// Fetch: Network first, fallback to cache
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // For HTML pages: network first, fallback to cache
  if (request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // For images & media: cache first
  if (request.destination === 'image' || request.destination === 'media') {
    event.respondWith(
      caches.match(request)
        .then(response => {
          return response || fetch(request)
            .then(response => {
              if (response.ok) {
                caches.open(RUNTIME_CACHE).then(cache => cache.put(request, response.clone()));
              }
              return response;
            });
        })
        .catch(() => {
          // Return placeholder for failed images
          return new Response('Image unavailable', { status: 404 });
        })
    );
    return;
  }

  // For everything else: cache first, fallback to network
  event.respondWith(
    caches.match(request)
      .then(response => response || fetch(request))
      .catch(() => new Response('Offline - resource unavailable', { status: 503 }))
  );
});
