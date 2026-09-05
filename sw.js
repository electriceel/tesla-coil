/* Cache-first for the shell so the app opens in a parking garage with no bars.
   Bump CACHE on every deploy or clients keep the old bundle. */
const CACHE = 'keypro-v18';
const ASSETS = [
  './', './index.html', './manifest.json',
  './assets/css/app.css',
  './assets/js/data.js', './assets/js/models.js', './assets/js/vin.js',
  './assets/js/master.js', './assets/js/store.js', './assets/js/app.js',
  './assets/icons/icon.svg', './assets/icons/icon-192.png', './assets/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  /* Never cache the NHTSA lookup — stale vehicle data is worse than no data. */
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
