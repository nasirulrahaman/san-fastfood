const CACHE_NAME = 'san-cache-v7';
const RUNTIME_CACHE = 'san-runtime-cache-v5';

const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json'
];

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names => 
      Promise.all(
        names.map(name => {
          if (name !== CACHE_NAME && name !== RUNTIME_CACHE) {
            return caches.delete(name);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET') return;

  // Skip chrome-extension and non-http requests
  if (!request.url.startsWith('http')) return;

  // Skip Supabase API calls - don't cache dynamic data
  if (request.url.includes('supabase.co')) {
    event.respondWith(fetch(request));
    return;
  }

  // HTML: network first
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request).then(response => {
        if (response?.ok) {
          const cache = caches.open(CACHE_NAME);
          cache.then(c => c.put(request, response.clone()));
        }
        return response;
      }).catch(() => caches.match(request))
    );
    return;
  }

  // Images: cache first
  if (request.destination === 'image' || request.destination === 'media') {
    event.respondWith(
      caches.match(request).then(async cached => {
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response?.ok && response?.status === 200) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          return new Response('Unavailable', { status: 404 });
        }
      })
    );
    return;
  }

  // Everything else: cache first
  event.respondWith(
    caches.match(request)
      .then(cached => cached || fetch(request))
      .catch(() => new Response('Offline', { status: 503 }))
  );
});




