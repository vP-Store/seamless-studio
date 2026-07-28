/* Seamless Studio – Raster-Menü, Tastenkürzel, globale Pipette,
   Leistungsmodus, Beispiel-Carousel, Onboarding und Komplettsicherung */

(function () {
  const $ = SS.el;

  /* ================================================================
     Raster-Menü
     ================================================================ */
  const gm = $('gridMenu');
  $('btnGrid').onclick = (e) => {
    e.stopPropagation();
    gm.classList.toggle('hidden');
    $('btnGrid').classList.toggle('active', !gm.classList.contains('hidden'));
  };
  document.addEventListener('pointerdown', (e) => {
    if (gm.classList.contains('hidden')) return;
    if (gm.contains(e.target) || e.target.closest('#btnGrid')) return;
    gm.classList.add('hidden');
    $('btnGrid').classList.remove('active');
  });
  gm.querySelectorAll('input[data-ov]').forEach(inp => {
    inp.addEventListener('change', () => {
      SS.state.overlays[inp.dataset.ov] = inp.checked;
      const any = Object.values(SS.state.overlays).some(Boolean);
      $('btnGrid').classList.toggle('has', any);
      SS.requestRender();
    });
  });

  /* ================================================================
     Lasso-Knopf
     ================================================================ */
  $('btnLasso').onclick = () => SS.ui.toggleLasso();

  /* ================================================================
     Tastenkürzel-Übersicht
     ================================================================ */
  const SHORTCUTS = [
    ['Strg / ⌘ + Z', 'Rückgängig'],
    ['Strg / ⌘ + Umschalt + Z', 'Wiederholen'],
    ['Strg / ⌘ + A', 'Alles auswählen'],
    ['Strg / ⌘ + D', 'Duplizieren (leicht versetzt)'],
    ['Strg / ⌘ + G', 'Gruppieren'],
    ['Strg / ⌘ + Umschalt + G', 'Gruppierung aufheben'],
    ['Strg / ⌘ + 0', 'Einpassen'],
    ['Umschalt + Klick', 'Auswahl erweitern'],
    ['Umschalt + Ziehen', 'Lasso-Auswahl'],
    ['L', 'Lasso-Modus an/aus'],
    ['Umschalt beim Ziehen einer Kante', 'Frei verzerren'],
    ['Pfeiltasten', 'Um 3 px verschieben'],
    ['Umschalt + Pfeiltasten', 'Um 20 px verschieben'],
    ['Entf / Rücktaste', 'Löschen'],
    ['Esc', 'Auswahl aufheben'],
    ['Doppelklick auf Text', 'Text bearbeiten'],
    ['?', 'Diese Übersicht'],
  ];
  SS.ui.toggleShortcuts = function () {
    const d = $('shortcutsDlg');
    const show = d.classList.contains('hidden');
    if (show) {
      const box = $('scList');
      box.innerHTML = '';
      SHORTCUTS.forEach(([k, v]) => {
        const r = document.createElement('div');
        r.className = 'sc-row';
        r.innerHTML = `<kbd>${k}</kbd><span>${v}</span>`;
        box.appendChild(r);
      });
    }
    d.classList.toggle('hidden', !show);
  };
  $('scClose').onclick = () => $('shortcutsDlg').classList.add('hidden');

  /* ================================================================
     Globale Pipette mit Farbmerker
     ================================================================ */
  SS.palette = [];
  SS.addPaletteColor = function (hex) {
    if (!hex) return;
    SS.palette = [hex].concat(SS.palette.filter(c => c !== hex)).slice(0, 10);
    try { localStorage.setItem('ss-palette', JSON.stringify(SS.palette)); } catch (e) {}
    SS.ui.showProps && SS.ui.showProps();
  };
  try { SS.palette = JSON.parse(localStorage.getItem('ss-palette') || '[]'); } catch (e) {}

  /* Hauptfarben aus dem sichtbaren Bild ziehen */
  SS.paletteFromCanvas = function () {
    const cv = $('canvas');
    const c = cv.getContext('2d');
    let d;
    try { d = c.getImageData(0, 0, cv.width, cv.height).data; } catch (e) { return []; }
    const buckets = {};
    for (let i = 0; i < d.length; i += 4 * 37) {
      if (d[i + 3] < 200) continue;
      const r = d[i] >> 4, g = d[i + 1] >> 4, b = d[i + 2] >> 4;
      const k = (r << 8) | (g << 4) | b;
      buckets[k] = buckets[k] || { n: 0, r: 0, g: 0, b: 0 };
      buckets[k].n++; buckets[k].r += d[i]; buckets[k].g += d[i + 1]; buckets[k].b += d[i + 2];
    }
    return Object.values(buckets).sort((a, b) => b.n - a.n).slice(0, 6).map(o =>
      '#' + [o.r / o.n, o.g / o.n, o.b / o.n].map(v => Math.round(v).toString(16).padStart(2, '0')).join(''));
  };

  /* ================================================================
     Leistungsmodus
     ================================================================ */
  SS.ui.setPerfMode = function (on, silent) {
    SS.state.perfMode = on;
    document.body.classList.toggle('perf', on);
    if (!silent) SS.toast(on ? 'Leistungsmodus an – Animationen pausieren auf der Leinwand' : 'Leistungsmodus aus', 2600);
  };
  /* Automatik: viele Elemente oder einbrechende Bildrate */
  let slowFrames = 0, lastT = performance.now();
  setInterval(() => {
    if (SS.state.perfMode) return;
    const n = SS.state.elements.length;
    const dt = performance.now() - lastT;
    lastT = performance.now();
    if (n > 40 && dt > 1400) slowFrames++; else slowFrames = 0;
    if (slowFrames >= 3) {
      SS.ui.setPerfMode(true, true);
      SS.toast('Viele Elemente – Leistungsmodus wurde eingeschaltet', 3600, 'info',
        { label: 'Aus', fn: () => SS.ui.setPerfMode(false) });
      slowFrames = 0;
    }
  }, 1000);

  /* ================================================================
     Beispiel-Carousel
     ================================================================ */
  SS.ui.loadExample = async function () {
    const pals = [['#f3d9d2', '#d99f96'], ['#dfe6e2', '#9db8ae'], ['#f0e2c8', '#cfa96f'],
      ['#e2dced', '#a99bc4'], ['#f6e0e6', '#d691a8']];
    SS.state.format = '4:5';
    SS.state.slides = 5;
    SS.state.bg = { type: 'preset', id: 'aq-blush-1', hue: 0 };
    SS.state.elements = [];
    SS.clearSel();
    const { H, slideW } = SS.canvasSize();
    for (let i = 0; i < 5; i++) {
      const cv = SS.makeCanvas(700, 900);
      const c = cv.getContext('2d');
      const g = c.createLinearGradient(0, 0, 700, 900);
      g.addColorStop(0, pals[i][0]); g.addColorStop(1, pals[i][1]);
      c.fillStyle = g; c.fillRect(0, 0, 700, 900);
      c.fillStyle = 'rgba(255,255,255,.5)';
      c.beginPath(); c.arc(350, 380, 150, 0, 7); c.fill();
      c.fillStyle = 'rgba(90,70,60,.55)';
      c.font = 'italic 120px Lora, serif'; c.textAlign = 'center';
      c.fillText(String(i + 1), 350, 425);
      const url = cv.toDataURL('image/jpeg', 0.9);
      const rec = await SS.loadImageURL(url);
      const imgId = 'demo' + i;
      SS.images[imgId] = rec;
      SS.ui.addShelfThumb(imgId, url);
      SS.state.elements.push(SS.normalizeEl({
        id: SS.uid(), type: 'photo', imgId,
        x: slideW * (i + 0.5), y: H / 2 + (i % 2 ? 70 : -60), rot: i % 2 ? 3 : -3,
        h: H * 0.55, flip: false, opacity: 1,
        frame: Object.assign(SS.defaultFrame(), { style: 'polaroid' }),
        filter: Object.assign(SS.defaultFilter(), SS.FILTER_PRESETS[4].f, { preset: 'creamy' }),
      }));
    }
    SS.state.elements.push(SS.normalizeEl({
      id: SS.uid(), type: 'text', content: 'Unsere Geschichte',
      x: slideW * 0.5, y: H * 0.13, rot: 0, font: 'Lora', size: 92, color: '#5c4a42',
      bold: false, italic: true, align: 'center', letterSpacing: 1, lineHeight: 1.3, opacity: 1,
      bgStyle: 'none', bgColor: '#ffffff', bgAlpha: 0.85, curve: 0,
      fill: 'none', anim: 'breathe',
    }));
    const heart = SS.STICKERS.find(s => s.id === 'heart-aqua');
    if (heart) {
      SS.state.elements.push(SS.normalizeEl({
        id: SS.uid(), type: 'sticker', kind: 'heart-aqua', cat: 'herzen',
        x: slideW * 2.5, y: H * 0.15, rot: 0, s: 220, color: '#d68a96', opacity: 0.9,
        anim: 'heartbeat',
      }));
    }
    SS.bgCacheInvalidate();
    SS.ui.syncTop(); SS.ui.zoomFit();
    SS.pushHistory('Beispiel geladen');
    SS.requestRender();
    SS.toast('Beispiel geladen – probier ruhig alles aus', 3200, 'ok');
  };

  /* ================================================================
     Onboarding-Tour
     ================================================================ */
  const TOUR = [
    { sel: '#toolbar .tool[data-panel="photos"]', text: 'Hier fügst du Fotos hinzu. Bei mehreren Bildern kannst du gleich die Reihenfolge festlegen.' },
    { sel: '#stage', text: 'Das ist deine Panorama-Leinwand. Die gestrichelten Linien zeigen, wo Instagram später schneidet.' },
    { sel: '#btnLayers', text: 'Über die Ebenen behältst du den Überblick: sperren, ausblenden, umsortieren.' },
    { sel: '#toolbar .tool[data-panel="video"]', text: 'Im Video-Studio wird aus deinem Panorama ein Reel – mit Kamerafahrt, Musik und Stimme.' },
    { sel: '#btnExport', text: 'Und hier geht alles raus: als Bilder, Panorama, Video – oder direkt in die Teilen-Auswahl.' },
  ];
  let tourIdx = 0;

  SS.ui.startTour = function () {
    tourIdx = 0;
    showTourStep();
  };

  function showTourStep() {
    let box = $('tourBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'tourBox';
      box.innerHTML = '<div class="tour-ring"></div><div class="tour-card"><p></p>' +
        '<div class="tour-btns"><button class="tour-skip">Überspringen</button>' +
        '<button class="tour-next primary">Weiter</button></div></div>';
      document.body.appendChild(box);
      box.querySelector('.tour-skip').onclick = endTour;
      box.querySelector('.tour-next').onclick = () => { tourIdx++; showTourStep(); };
    }
    if (tourIdx >= TOUR.length) return endTour();
    const step = TOUR[tourIdx];
    const t = document.querySelector(step.sel);
    if (!t) { tourIdx++; return showTourStep(); }
    const r = t.getBoundingClientRect();
    const ring = box.querySelector('.tour-ring');
    ring.style.left = (r.left - 8) + 'px';
    ring.style.top = (r.top - 8) + 'px';
    ring.style.width = (r.width + 16) + 'px';
    ring.style.height = (r.height + 16) + 'px';
    const card = box.querySelector('.tour-card');
    card.querySelector('p').textContent = step.text;
    const below = r.bottom + 190 < window.innerHeight;
    card.style.top = below ? (r.bottom + 14) + 'px' : Math.max(10, r.top - 170) + 'px';
    card.style.left = Math.max(10, Math.min(window.innerWidth - 300, r.left)) + 'px';
    box.querySelector('.tour-next').textContent = tourIdx === TOUR.length - 1 ? 'Los geht’s' : 'Weiter';
    box.classList.remove('hidden');
  }

  function endTour() {
    const box = $('tourBox');
    if (box) box.classList.add('hidden');
    try { localStorage.setItem('ss-tour', '1'); } catch (e) {}
  }

  SS.ui.maybeTour = function () {
    let seen = '1';
    try { seen = localStorage.getItem('ss-tour'); } catch (e) {}
    if (!seen) setTimeout(() => SS.ui.startTour(), 1200);
  };

  /* ================================================================
     Komplettsicherung aller Projekte
     ================================================================ */
  SS.ui.backupAll = async function () {
    if (typeof JSZip === 'undefined') return SS.toast('Sicherung nicht verfügbar', 2400, 'err');
    SS.toast('Sicherung wird erstellt …', 2000);
    const zip = new JSZip();
    const keys = await SS.dbKeys();
    let n = 0;
    for (const k of keys) {
      const key = String(k);
      if (!key.startsWith('proj:') && !key.startsWith('ver:') && key !== 'autosave') continue;
      const data = await SS.dbGet(k);
      if (!data) continue;
      zip.file(key.replace(':', '_') + '.seamless', JSON.stringify(data));
      n++;
    }
    zip.file('_INFO.txt', 'Seamless Studio – Komplettsicherung\n' +
      'Diese Dateien lassen sich einzeln über „Projekt-Datei laden" zurückspielen.\n');
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Seamless_Sicherung.zip';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 9000);
    SS.toast(`${n} Projekte gesichert`, 2800, 'ok');
  };

  /* ================================================================
     Versionen-Liste
     ================================================================ */
  SS.ui.refreshVersions = async function () {
    const box = $('verList');
    if (!box) return;
    box.innerHTML = '';
    const keys = (await SS.dbKeys()).filter(k => String(k).startsWith('ver:')).sort().reverse();
    for (const k of keys) {
      const data = await SS.dbGet(k);
      if (!data) continue;
      const row = document.createElement('div');
      row.className = 'ver-row';
      const nm = document.createElement('span');
      nm.textContent = data.name || 'Version';
      const load = document.createElement('button');
      load.textContent = '↩';
      load.title = 'Diese Version laden';
      load.onclick = async () => { await SS.loadProjectData(data); SS.toast('Version geladen', 2200, 'ok'); };
      const del = document.createElement('button');
      del.textContent = '✕'; del.className = 'danger';
      del.onclick = () => { SS.dbDel(k); SS.ui.refreshVersions(); };
      row.appendChild(nm); row.appendChild(load); row.appendChild(del);
      box.appendChild(row);
    }
    if (!keys.length) box.innerHTML = '<p class="hint">Noch keine Versionen gesichert.</p>';
  };

  /* ================================================================
     Speicher-Anzeige
     ================================================================ */
  SS.ui.refreshStorage = async function () {
    const el = $('storageInfo');
    if (!el) return;
    const info = await SS.storageInfo();
    if (!info) { el.textContent = ''; return; }
    const mb = (b) => (b / 1048576).toFixed(1) + ' MB';
    el.textContent = `Belegt: ${mb(info.used)}${info.quota ? ' von ' + mb(info.quota) : ''}` +
      (info.persisted ? ' · dauerhaft gesichert ✓' : ' · Tipp: App zum Startbildschirm hinzufügen, dann bleibt alles dauerhaft erhalten');
  };
})();

/* ================================================================
   Verdrahtung der neuen Bedienelemente
   ================================================================ */
(function () {
  const $ = SS.el;
  const on = (id, fn) => { const e = $(id); if (e) e.onclick = fn; };

  on('esExample', () => SS.ui.loadExample());
  on('backupAll', () => SS.ui.backupAll());
  on('btnTour', () => SS.ui.startTour());
  on('btnShortcuts', () => SS.ui.toggleShortcuts());

  const perf = $('perfToggle');
  if (perf) {
    try { perf.checked = localStorage.getItem('ss-perf') === '1'; } catch (e) {}
    if (perf.checked) SS.ui.setPerfMode(true, true);
    perf.addEventListener('change', () => {
      SS.ui.setPerfMode(perf.checked);
      try { localStorage.setItem('ss-perf', perf.checked ? '1' : '0'); } catch (e) {}
    });
  }

  // Raster-Häkchen an den Zustand angleichen
  document.querySelectorAll('#gridMenu input[data-ov]').forEach(inp => {
    inp.checked = !!SS.state.overlays[inp.dataset.ov];
  });

  setTimeout(() => {
    SS.ui.refreshVersions && SS.ui.refreshVersions();
    SS.ui.refreshStorage && SS.ui.refreshStorage();
  }, 1800);
})();

/* ================================================================
   Höhenverstellbares Eigenschaften-Blatt am Handy
   ================================================================ */
(function () {
  const props = SS.el('props');
  const head = props ? props.querySelector('.props-head') : null;
  if (!head) return;
  let drag = null;

  head.addEventListener('pointerdown', (e) => {
    if (!window.matchMedia('(max-width: 760px)').matches) return;
    if (e.target.closest('button')) return;
    drag = { y: e.clientY, h: props.getBoundingClientRect().height };
    head.setPointerCapture(e.pointerId);
  });
  head.addEventListener('pointermove', (e) => {
    if (!drag) return;
    e.preventDefault();
    const h = SS.clamp(drag.h + (drag.y - e.clientY), 110, window.innerHeight * 0.86);
    props.style.maxHeight = h + 'px';
    props.classList.remove('mini');
    const pe = SS.el('propsExpand');
    if (pe) pe.textContent = 'Zuklappen ⌃';
  });
  const up = () => { drag = null; };
  head.addEventListener('pointerup', up);
  head.addEventListener('pointercancel', up);
})();

/* ================================================================
   Auswahl- und Ansichtswerkzeuge im Studio-Panel
   (am Handy ist in der Kopfzeile kein Platz mehr)
   ================================================================ */
(function () {
  const $ = SS.el;
  const sync = () => {
    const l = $('stLasso'), m = $('stMulti'), g = $('stGuidesToggle');
    if (l) l.classList.toggle('on', SS.lassoMode);
    if (m) m.classList.toggle('on', SS.addMode);
    if (g) g.classList.toggle('on', SS.state.guides);
  };

  const l = $('stLasso');
  if (l) l.onclick = () => { SS.ui.toggleLasso(); sync(); };

  const m = $('stMulti');
  if (m) m.onclick = () => {
    SS.addMode = !SS.addMode;
    sync();
    SS.toast(SS.addMode
      ? 'Mehrfachauswahl an – jedes angetippte Element kommt dazu'
      : 'Mehrfachauswahl aus', 2600);
  };

  const g = $('stGroup'); if (g) g.onclick = () => SS.ui.groupSel();
  const u = $('stUngroup'); if (u) u.onclick = () => SS.ui.ungroupSel();

  const gt = $('stGuidesToggle');
  if (gt) gt.onclick = () => { $('btnGuides').click(); sync(); };

  const tt = $('stThemeToggle');
  if (tt) tt.onclick = () => $('btnTheme').click();

  sync();
})();
