/* Cache-first for the shell so the app opens in a parking garage with no bars.
   Bump CACHE on every deploy or clients keep the old bundle. */
const CACHE = 'keypro-v43';
const ASSETS = [
  './', './index.html', './manifest.json',
  './assets/css/app.css',
  './assets/js/data.js', './assets/js/models.js', './assets/js/vin.js',
  './assets/js/dealer.js', './assets/js/master.js', './assets/js/store.js', './assets/js/app.js',
  './assets/icons/icon-32.png', './assets/icons/icon-96.png', './assets/icons/icon-180.png',
  './assets/icons/icon-192.png', './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-192.png', './assets/icons/icon-maskable-512.png',
  './assets/key-blanks/cat-cg16.png', './assets/key-blanks/cat-de6.png',
  './assets/key-blanks/cat-kw10.png', './assets/key-blanks/cat-m12.png',
  './assets/key-blanks/cat-m13.png', './assets/key-blanks/cat-m2.png',
  './assets/key-blanks/cat-s1.png', './assets/key-blanks/cat-s10.png',
  './assets/key-blanks/cat-sc22.png', './assets/key-blanks/cat-sc6.png',
  './assets/key-blanks/cat-sc8.png', './assets/key-blanks/cat-sc9.png',
  './assets/key-blanks/cat-wk2.png', './assets/key-blanks/cat-wr3.png',
  './assets/key-blanks/cat-y2.png'
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
