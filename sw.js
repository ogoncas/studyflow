// Service worker: rede primeiro, cache como reserva (funciona offline)
const CACHE = 'studyflow-v5';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest',
  'css/style.css', 'js/app.js', 'js/store.js', 'js/icons.js', 'js/i18n.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;

  e.respondWith(
    fetch(request, { cache: 'no-cache' })
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(request.mode === 'navigate' ? 'index.html' : request, copy));
        }
        return res;
      })
      .catch(() => request.mode === 'navigate'
        ? caches.match('index.html')
        : caches.match(request, { ignoreSearch: true }).then(hit => hit || Response.error()))
  );
});
