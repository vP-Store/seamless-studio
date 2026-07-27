/* Seamless Studio – Service Worker (offline cache) */
const VERSION = 'ss-v2.0.0';
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
  './courier-prime-latin-400-normal.woff2',
  './cinzel-latin-400-normal.woff2',
  './abril-fatface-latin-400-normal.woff2',
  './dm-serif-display-latin-400-normal.woff2',
  './libre-baskerville-latin-400-normal.woff2',
  './bebas-neue-latin-400-normal.woff2',
  './anton-latin-400-normal.woff2',
  './archivo-black-latin-400-normal.woff2',
  './raleway-latin-400-normal.woff2',
  './quicksand-latin-400-normal.woff2',
  './comfortaa-latin-400-normal.woff2',
  './pacifico-latin-400-normal.woff2',
  './satisfy-latin-400-normal.woff2',
  './sacramento-latin-400-normal.woff2',
  './parisienne-latin-400-normal.woff2',
  './shadows-into-light-latin-400-normal.woff2',
  './patrick-hand-latin-400-normal.woff2',
  './kalam-latin-400-normal.woff2',
  './special-elite-latin-400-normal.woff2',
  './marcellus-latin-400-normal.woff2',
  './italiana-latin-400-normal.woff2'
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
