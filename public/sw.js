// Service worker mínimo para que la herramienta siga abriendo sin conexión en la mesa.
// - index.html y data.json: primero la red (así siempre se ve la versión publicada más reciente);
//   si no hay red, la última copia guardada.
// - Archivos con hash en /assets/: primero la caché (nunca cambian).
const CACHE = 'defensa-pliego-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function save(req, res) {
  if (res && res.ok) {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
  }
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const networkFirst = req.mode === 'navigate' || url.pathname.endsWith('/data.json') || url.pathname.endsWith('.html');
  if (networkFirst) {
    e.respondWith(
      fetch(req)
        .then((res) => save(url.pathname.endsWith('/data.json') ? new Request(url.origin + url.pathname) : req, res))
        .catch(() =>
          caches.match(url.pathname.endsWith('/data.json') ? url.origin + url.pathname : req, { ignoreSearch: true })
            .then((m) => m || caches.match('./', { ignoreSearch: true }))
        )
    );
    return;
  }
  e.respondWith(caches.match(req).then((m) => m || fetch(req).then((res) => save(req, res))));
});
