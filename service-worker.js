const CACHE_NAME = 'app-cache-v1';
const STATIC_ASSETS = [
  '',
  'index.html',
  'metronome.css',
  'metronome.js',
  'print.js',
  'script.js',
  'share.js',
  'snow.css',
  'snow.js',
  'style.css',
  'transpose-chords.js',
  'images/icons/chordify.svg',
  'images/icons/copy.svg',
  'images/icons/holychords.svg',
  'images/icons/print.svg',
  'images/icons/reload.svg',
  'images/icons/share.svg',
  'images/icons/telegram.svg',
  'images/icons/whatsapp.svg',
  'images/icons/youtube.svg',
  'images/apple-touch-icon.png',
  'images/favicon.svg',
  'images/favicon-white.svg',
  'images/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.map(key => (key !== CACHE_NAME ? caches.delete(key) : null))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Cache the response dynamically for offline use
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // Fallback to cache if the network is unavailable
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Optional: Provide a fallback response for specific cases
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
