/* Seamless Studio – Service Worker (offline cache) */
const VERSION = 'ss-v1.0.0';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './fonts.css',
  './manifest.webmanifest',
  './jszip.min.js',
  './util.js',
  './backgrounds.js',
  './frames.js',
  './stickers.js',
  './render.js',
  './interact.js',
  './ui.js',
  './exporter.js',
  './main.js',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './lora-latin-400-normal.woff2',
  './lora-latin-400-italic.woff2',
  './lora-latin-700-normal.woff2',
  './playfair-display-latin-400-normal.woff2',
  './playfair-display-latin-400-italic.woff2',
  './playfair-display-latin-700-normal.woff2',
  './cormorant-garamond-latin-500-normal.woff2',
  './cormorant-garamond-latin-500-italic.woff2',
  './poppins-latin-400-normal.woff2',
  './poppins-latin-600-normal.woff2',
  './montserrat-latin-400-normal.woff2',
  './montserrat-latin-700-normal.woff2',
  './dancing-script-latin-400-normal.woff2',
  './caveat-latin-400-normal.woff2',
  './great-vibes-latin-400-normal.woff2',
  './amatic-sc-latin-400-normal.woff2',
  './amatic-sc-latin-700-normal.woff2',
  './courier-prime-latin-400-normal.woff2'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => hit ||
      fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match('./index.html'))
    )
  );
});
