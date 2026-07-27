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

  // initial view
  SS.ui.syncTop();
  SS.ui.zoomFit();
  SS.pushHistory();

  window.addEventListener('resize', () => { SS.ui.zoomFit(); });

  // live animation loop: only renders while animated stickers exist
  (function tick() {
    if (SS.hasAnimation && SS.hasAnimation() && !document.hidden) {
      SS.animT = performance.now() / 1000;
      SS.render();
    }
    requestAnimationFrame(tick);
  })();

  // PWA service worker
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
    });
  }

  // install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    SS.toast('💡 Tipp: Seamless Studio lässt sich als App installieren (Menü → „Zum Startbildschirm hinzufügen")', 5000);
  });

  // haptic feedback on snapping (Android)
  SS.buzz = () => { try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {} };

  // prevent accidental navigation loss
  window.addEventListener('beforeunload', (e) => {
    if (SS.state.elements.length > 0) { e.preventDefault(); e.returnValue = ''; }
  });
})();
