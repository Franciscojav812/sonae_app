/*
 * Service worker: makes the app shell (HTML, CSS, JS modules, fixtures) work
 * offline. API responses are NOT cached here: the data layer already keeps the
 * last good payload per source with an explicit staleness limit, so the UI can
 * tell the user how old the data is. Two caches would disagree.
 */
const VERSION = 'sonae-v1.1.0';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/main.js',
  './js/config.js',
  './js/i18n.js',
  './js/store.js',
  './js/data/cities.js',
  './js/data/content.js',
  './js/data/geography.js',
  './js/domain/alerts.js',
  './js/domain/eew.js',
  './js/domain/hazards.js',
  './js/domain/quakes.js',
  './js/domain/tsunami.js',
  './js/domain/typhoons.js',
  './js/domain/weather.js',
  './js/lib/format.js',
  './js/lib/geo.js',
  './js/lib/http.js',
  './js/lib/mercator.js',
  './js/lib/storage.js',
  './js/services/realtime.js',
  './js/services/scheduler.js',
  './js/services/sources.js',
  './js/ui/alerts.js',
  './js/ui/common.js',
  './js/ui/header.js',
  './js/ui/map.js',
  './js/ui/slippymap.js',
  './js/ui/views/hazards.js',
  './js/ui/views/overview.js',
  './js/ui/views/quakes.js',
  './js/ui/views/weather.js',
  './fixtures/p2p-551.json',
  './fixtures/p2p-552.json',
  './fixtures/usgs.json',
  './fixtures/open-meteo.json',
  './fixtures/gdacs.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** Same-origin GETs: stale-while-revalidate. Everything else goes straight to the network. */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: true });
      const network = fetch(request)
        .then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached ?? network;
    }),
  );
});
