/* Seamless Studio – bootstrap */

(function () {
  // theme: dark is the premium default; 'light' is the stored opt-in
  try {
    if (localStorage.getItem('ss-theme') === 'light') document.body.classList.add('light');
  } catch (e) {}

  // preload fonts so canvas text renders correctly
  const loads = [];
  for (const f of (SS.FONTS || ['Lora', 'Poppins'])) {
    loads.push(document.fonts.load(`32px "${f}"`).catch(() => {}));
    loads.push(document.fonts.load(`italic 32px "${f}"`).catch(() => {}));
  }
  loads.push(document.fonts.load('700 32px "Lora"').catch(() => {}));

  const splash = document.getElementById('splash');
  const hideSplash = () => { if (splash) splash.classList.add('gone'); };
  Promise.all(loads).then(() => { SS.requestRender(); setTimeout(hideSplash, 350); });
  setTimeout(hideSplash, 3500);   // never hang on the splash

  // Dialoge verdrahten
  if (SS.cutout && SS.cutout.initUI) SS.cutout.initUI();
  if (SS.crop && SS.crop.initUI) SS.crop.initUI();

  // dauerhaften Speicher anfordern, sobald der Nutzer das erste Mal etwas tut
  const askPersist = () => {
    SS.persistStorage();
    window.removeEventListener('pointerdown', askPersist);
    window.removeEventListener('keydown', askPersist);
  };
  window.addEventListener('pointerdown', askPersist);
  window.addEventListener('keydown', askPersist);

  // initial view
  SS.ui.syncTop();
  SS.ui.zoomFit();
  SS.pushHistory();

  window.addEventListener('resize', () => { SS.ui.zoomFit(); });

  // live animation loop: only renders while animated stickers exist
  (function tick() {
    if (SS.hasAnimation && SS.hasAnimation() && !document.hidden && !SS.state.perfMode) {
      SS.animT = performance.now() / 1000;
      // requestRender statt render: fällt mit dem Clip-Takt in EIN Bild zusammen,
      // statt zweimal pro Bild die ganze Leinwand zu zeichnen
      SS.requestRender();
    }
    requestAnimationFrame(tick);
  })();

  // kurze Einführung beim allerersten Start
  SS.ui.maybeTour && SS.ui.maybeTour();

  // PWA service worker
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
    });
  }

  // install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    SS.toast('Tipp: Seamless Studio lässt sich als App installieren (Menü → „Zum Startbildschirm hinzufügen")', 5000);
  });

  // prevent accidental navigation loss
  window.addEventListener('beforeunload', (e) => {
    if (SS.state.elements.length > 0) { e.preventDefault(); e.returnValue = ''; }
  });

  // Display beim Verlassen wieder freigeben
  window.addEventListener('pagehide', () => SS.wakeOff());
})();
