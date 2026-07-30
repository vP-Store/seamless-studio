/* Seamless Studio – Service Worker (offline cache) */
const VERSION = 'ss-v6.4.0';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './fonts.css',
  './manifest.webmanifest',
  './zip5.js',
  './util.js',
  './backgrounds.js',
  './frames.js',
  './stickers.js',
  './stickers2.js',
  './anim.js',
  './render.js',
  './interact.js',
  './clip.js',
  './sortdlg.js',
  './cutout.js',
  './crop.js',
  './layers.js',
  './extras.js',
  './texttpl.js',
  './ui.js',
  './audio.js',
  './video.js',
  './exporter.js',
  './main.js',
  './content5.js',
  './stickers3.js',
  './export5.js',
  './caption5.js',
  './beat5.js',
  './motion5.js',
  './pro5.js',
  './anim52.js',
  './animprev52.js',
  './vidziel5.js',
  './clips5.js',
  './mix5.js',
  './curve5.js',
  './kf5.js',
  './pfadtext6.js',
  './layouts6.js',
  './pfadui6.js',
  './studio5.js',
  './symbole7_daten.js',
  './symbole7.js',
  './blumen7_daten.js',
  './blumen7.js',
  './rahmen7.js',
  './videoleinwand7.js',
  './vorlagen7.js',
  './videokarussell7.js',
  './fix631.js',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
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
  './italiana-latin-400-normal.woff2',
  './alex-brush-latin-400-normal.woff2',
  './allura-latin-400-normal.woff2',
  './tangerine-latin-400-normal.woff2',
  './petit-formal-script-latin-400-normal.woff2',
  './mrs-saint-delafield-latin-400-normal.woff2',
  './yellowtail-latin-400-normal.woff2',
  './cookie-latin-400-normal.woff2',
  './la-belle-aurore-latin-400-normal.woff2',
  './cormorant-upright-latin-400-normal.woff2',
  './gilda-display-latin-400-normal.woff2',
  './prata-latin-400-normal.woff2',
  './bodoni-moda-latin-400-normal.woff2',
  './julius-sans-one-latin-400-normal.woff2',
  './tenor-sans-latin-400-normal.woff2',
  './forum-latin-400-normal.woff2',
  './philosopher-latin-400-normal.woff2'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    // einzeln legen statt addAll: eine fehlende Datei darf nicht die ganze
    // Offline-Installation verhindern
    await Promise.all(ASSETS.map((u) => c.add(u).catch(() => {})));
    await self.skipWaiting();
  })());
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
