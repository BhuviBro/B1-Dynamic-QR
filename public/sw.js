// Minimal Service Worker to enable PWA installability on mobile devices
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let network handle requests directly, allowing Firebase and real-time operations
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
