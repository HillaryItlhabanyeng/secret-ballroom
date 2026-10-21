// Caches the app itself (HTML, JS, CSS, icons) so it opens fast and starts even offline.
// It NEVER touches the API: journal data always comes straight from the server.
const CACHE = 'ballroom-shell-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // Only our own files. The API lives on another address, so it's skipped.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // Network first, so you always get the newest version; the cache is only for offline
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('/index.html'))),
  );
});