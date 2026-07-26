/* Seamless Studio – bootstrap */

(function () {
  // theme
  try {
    if (localStorage.getItem('ss-theme') === 'dark') document.body.classList.add('dark');
  } catch (e) {}

  // preload fonts so canvas text renders correctly
  const loads = [];
  for (const f of ['Lora', 'Playfair Display', 'Cormorant Garamond', 'Poppins', 'Montserrat',
    'Dancing Script', 'Caveat', 'Great Vibes', 'Amatic SC', 'Courier Prime']) {
    loads.push(document.fonts.load(`32px "${f}"`).catch(() => {}));
    loads.push(document.fonts.load(`italic 32px "${f}"`).catch(() => {}));
    loads.push(document.fonts.load(`700 32px "${f}"`).catch(() => {}));
  }
  Promise.all(loads).then(() => SS.requestRender());

  // initial view
  SS.ui.syncTop();
  SS.ui.zoomFit();
  SS.pushHistory();

  window.addEventListener('resize', () => { SS.ui.zoomFit(); });

  // PWA service worker
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  // install prompt
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    SS.toast('💡 Tipp: Du kannst Seamless Studio als App installieren (Menü → „Zum Startbildschirm hinzufügen")', 5000);
  });

  // prevent accidental navigation loss
  window.addEventListener('beforeunload', (e) => {
    if (SS.state.elements.length > 0) { e.preventDefault(); e.returnValue = ''; }
  });
})();
