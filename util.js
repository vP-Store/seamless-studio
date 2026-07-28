/* Seamless Studio – shared state & helpers */
window.SS = {};

// ---------- global state ----------
SS.state = {
  format: '4:5',          // '4:5' | '1:1' | '9:16'
  slides: 5,
  elements: [],           // list of element objects (z-order = array order)
  bg: { type: 'preset', id: 'aq-blush-1', custom: null },
  selectedIds: [],        // Mehrfachauswahl; das letzte ist das „primäre" Element
  overlays: { thirds: false, grid: false, golden: false, safe: false, profile: false },
  perfMode: false,
  guides: true,
  zoom: 1, panX: 0, panY: 0,
  _idSeq: 1,
};

SS.SLIDE = { '4:5': [1080, 1350], '1:1': [1080, 1080], '9:16': [1080, 1920] };

/* _sizeOverride erlaubt dem Export, dieselbe Szene in anderen Formaten zu rendern */
SS._sizeOverride = null;
SS.canvasSize = function () {
  const ov = SS._sizeOverride;
  const fmt = ov ? ov.format : SS.state.format;
  const [w, h] = SS.SLIDE[fmt] || SS.SLIDE['4:5'];
  if (ov) return { W: w * ov.slides, H: h, slideW: w, slideH: h, n: ov.slides };
  const clip = !!(SS.clip && SS.clip.ready);
  const n = (clip || fmt === '9:16') ? 1 : SS.state.slides;
  return { W: w * n, H: h, slideW: w, slideH: h, n };
};

SS.uid = () => 'e' + (SS.state._idSeq++);
SS.gid = () => 'g' + (SS.state._idSeq++);

// ---------- Auswahl ----------
SS.getSel = () => {
  const ids = SS.state.selectedIds;
  if (!ids.length) return null;
  return SS.state.elements.find(e => e.id === ids[ids.length - 1]) || null;
};
SS.getSelAll = () => SS.state.elements.filter(e => SS.state.selectedIds.indexOf(e.id) >= 0);
SS.selCount = () => SS.getSelAll().length;
SS.isSel = (id) => SS.state.selectedIds.indexOf(id) >= 0;

/* Setzt die Auswahl. Gehört das Element zu einer Gruppe, wird die ganze Gruppe gewählt. */
SS.setSel = function (id) {
  if (!id) { SS.state.selectedIds = []; return; }
  const el = SS.state.elements.find(e => e.id === id);
  if (el && el.gid) {
    SS.state.selectedIds = SS.state.elements.filter(e => e.gid === el.gid).map(e => e.id);
    // das angetippte Element bleibt das primäre
    SS.state.selectedIds = SS.state.selectedIds.filter(x => x !== id).concat([id]);
  } else {
    SS.state.selectedIds = [id];
  }
};
SS.addSel = function (id) {
  const el = SS.state.elements.find(e => e.id === id);
  const ids = el && el.gid
    ? SS.state.elements.filter(e => e.gid === el.gid).map(e => e.id)
    : [id];
  for (const i of ids) if (SS.state.selectedIds.indexOf(i) < 0) SS.state.selectedIds.push(i);
};
SS.toggleSel = function (id) {
  const el = SS.state.elements.find(e => e.id === id);
  const ids = el && el.gid
    ? SS.state.elements.filter(e => e.gid === el.gid).map(e => e.id)
    : [id];
  const on = SS.state.selectedIds.indexOf(id) >= 0;
  if (on) SS.state.selectedIds = SS.state.selectedIds.filter(x => ids.indexOf(x) < 0);
  else for (const i of ids) if (SS.state.selectedIds.indexOf(i) < 0) SS.state.selectedIds.push(i);
};
SS.setSelMany = function (ids) {
  const out = [];
  for (const id of ids) {
    const el = SS.state.elements.find(e => e.id === id);
    if (el && el.gid) {
      for (const g of SS.state.elements) if (g.gid === el.gid && out.indexOf(g.id) < 0) out.push(g.id);
    } else if (out.indexOf(id) < 0) out.push(id);
  }
  SS.state.selectedIds = out;
};
SS.clearSel = () => { SS.state.selectedIds = []; };

// ---------- sichtbare, greifbare Elemente ----------
/* Alles, was gezeichnet wird (ausgeblendete Elemente fallen raus). */
SS.liveElements = () => SS.state.elements.filter(e => !e.hidden);
/* Alles, was per Zeigegerät gegriffen werden darf. */
SS.pickableElements = () => SS.state.elements.filter(e => !e.hidden && !e.locked);

// ---------- Standardfelder ergänzen (Migration alter Projekte) ----------
SS.normalizeEl = function (el) {
  if (el.locked === undefined) el.locked = false;
  if (el.hidden === undefined) el.hidden = false;
  if (el.scaleX === undefined) el.scaleX = 1;
  if (el.scaleY === undefined) el.scaleY = 1;
  if (el.opacity === undefined) el.opacity = 1;
  if (el.rot === undefined) el.rot = 0;
  if (SS.animDefaults) SS.animDefaults(el);
  if (el.type === 'text') SS.normalizeText(el);
  if (el.type === 'photo' && !el.crop) el.crop = { zoom: 1, ox: 0, oy: 0 };
  return el;
};
SS.normalizeAll = function () {
  for (const el of SS.state.elements) SS.normalizeEl(el);
};

/* Anzeigename eines Elements für das Ebenen-Panel */
SS.elName = function (el) {
  if (el.name) return el.name;
  if (el.type === 'text') return (el.content || 'Text').split('\n')[0].slice(0, 22) || 'Text';
  if (el.type === 'photo') return el.cutout ? 'Freisteller' : 'Foto';
  if (el.type === 'sticker') {
    const d = SS.STICKERS && SS.STICKERS.find(s => s.id === el.kind);
    return d ? d.name : 'Sticker';
  }
  if (el.type === 'emoji') return el.char || 'Emoji';
  if (el.type === 'blur') return el.pixelate ? 'Pixel-Bereich' : 'Unschärfe';
  return 'Element';
};

SS.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
SS.deg2rad = (d) => d * Math.PI / 180;

// rotate point (px,py) around (cx,cy) by -rot to get local coords
SS.toLocal = function (px, py, cx, cy, rotDeg) {
  const r = -SS.deg2rad(rotDeg);
  const dx = px - cx, dy = py - cy;
  return [dx * Math.cos(r) - dy * Math.sin(r), dx * Math.sin(r) + dy * Math.cos(r)];
};

// ---------- images store (photos keep their dataURL for save/undo) ----------
SS.images = {};   // imgId -> {img: HTMLImageElement|ImageBitmap, dataURL, w, h}

SS.loadImageFile = function (file, maxDim = 2600) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width: w, height: h } = img;
        const sc = Math.min(1, maxDim / Math.max(w, h));
        const cv = document.createElement('canvas');
        cv.width = Math.round(w * sc); cv.height = Math.round(h * sc);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        const dataURL = cv.toDataURL('image/jpeg', 0.92);
        const out = new Image();
        out.onload = () => resolve({ img: out, dataURL, w: cv.width, h: cv.height });
        out.src = dataURL;
      };
      img.onerror = reject;
      img.src = fr.result;
    };
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
};

SS.loadImageFilePNG = function (file, maxDim = 1400) {
  // like loadImageFile but keeps transparency (for custom stickers/logos)
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const sc = Math.min(1, maxDim / Math.max(img.width, img.height));
        const cv = document.createElement('canvas');
        cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        const dataURL = cv.toDataURL('image/png');
        const out = new Image();
        out.onload = () => resolve({ img: out, dataURL, w: cv.width, h: cv.height });
        out.src = dataURL;
      };
      img.onerror = reject;
      img.src = fr.result;
    };
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
};

SS.loadImageURL = function (dataURL) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ img, dataURL, w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = reject;
    img.src = dataURL;
  });
};

// ---------- undo / redo ----------
SS.history = { stack: [], idx: -1, max: 50 };

SS.serialize = function () {
  return JSON.stringify({
    format: SS.state.format, slides: SS.state.slides,
    elements: SS.state.elements, bg: SS.state.bg,
  });
};

SS.pushHistory = function (label) {
  const h = SS.history;
  const snap = SS.serialize();
  if (h.stack[h.idx] && h.stack[h.idx].snap === snap) return;
  h.stack = h.stack.slice(0, h.idx + 1);
  h.stack.push({ snap, label: label || 'Änderung' });
  if (h.stack.length > h.max) h.stack.shift();
  h.idx = h.stack.length - 1;
  SS.autosave && SS.autosave();
  SS.ui && SS.ui.refreshHistory && SS.ui.refreshHistory();
};

/* Zu einem bestimmten Schritt springen (History-Leiste) */
SS.gotoHistory = function (idx) {
  const h = SS.history;
  if (idx < 0 || idx >= h.stack.length) return;
  h.idx = idx;
  SS.restore(h.stack[idx].snap);
  SS.ui && SS.ui.refreshHistory && SS.ui.refreshHistory();
};

SS.restore = function (snap) {
  const d = JSON.parse(snap);
  SS.state.format = d.format; SS.state.slides = d.slides;
  SS.state.elements = d.elements; SS.state.bg = d.bg;
  SS.state.selectedIds = [];
  SS.normalizeAll();
  SS.photoCacheClear(); SS.cardCacheClear();
  SS.bgCacheInvalidate();
  SS.ui.syncTop(); SS.ui.showProps();
  SS.requestRender();
};

SS.undo = function () {
  const h = SS.history;
  if (h.idx > 0) { h.idx--; SS.restore(h.stack[h.idx].snap); SS.ui && SS.ui.refreshHistory && SS.ui.refreshHistory(); }
};
SS.redo = function () {
  const h = SS.history;
  if (h.idx < h.stack.length - 1) { h.idx++; SS.restore(h.stack[h.idx].snap); SS.ui && SS.ui.refreshHistory && SS.ui.refreshHistory(); }
};

// ---------- misc ----------
/* type: 'info' | 'ok' | 'warn' | 'err'   action: {label, fn} */
SS.toast = function (msg, ms = 2600, type = 'info', action = null) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.className = 'toast-' + type;
  t.innerHTML = '';
  const ico = document.createElement('span');
  ico.className = 'toast-ico';
  ico.textContent = { info: '💬', ok: '✓', warn: '⚠️', err: '✕' }[type] || '💬';
  const txt = document.createElement('span');
  txt.textContent = msg;
  t.appendChild(ico); t.appendChild(txt);
  if (action) {
    const b = document.createElement('button');
    b.className = 'toast-act';
    b.textContent = action.label;
    b.onclick = () => { t.classList.add('hidden'); action.fn(); };
    t.appendChild(b);
  }
  clearTimeout(SS._toastT);
  SS._toastT = setTimeout(() => t.classList.add('hidden'), ms);
};

SS.el = (id) => document.getElementById(id);

// ---------- Teilen (Instagram, WhatsApp, Fotos … über die Teilen-Auswahl) ----------
SS.canShareFiles = function (files) {
  try { return !!(navigator.canShare && navigator.canShare({ files })); } catch (e) { return false; }
};

/* Teilt Dateien über die System-Auswahl. Geht das nicht, werden sie heruntergeladen.
   Rückgabe: 'shared' | 'abort' | 'downloaded' */
SS.shareFiles = async function (files, title) {
  if (SS.canShareFiles(files)) {
    try {
      await navigator.share({ files, title: title || 'Seamless Studio', text: 'Erstellt mit Seamless Studio ✦' });
      SS.toast('📤 Geteilt ✓');
      return 'shared';
    } catch (e) {
      if (e && e.name === 'AbortError') return 'abort';
    }
  }
  for (const f of files) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(f);
    a.download = f.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 8000);
  }
  const mobil = /iPhone|iPad|Android/i.test(navigator.userAgent);
  SS.toast(
    mobil
      ? 'Gespeichert. Dieses Gerät reicht Dateien nicht direkt weiter – öffne Instagram und wähle die Dateien aus der Galerie.'
      : 'Am Rechner kann Instagram keine Dateien entgegennehmen. Gespeichert – lade sie am Handy oder über instagram.com hoch.',
    6000, 'info', { label: 'Instagram öffnen', fn: () => SS.openInstagram() });
  return 'downloaded';
};

/* Versucht die Instagram-App, sonst die Website */
SS.openInstagram = function () {
  const mobil = /iPhone|iPad|Android/i.test(navigator.userAgent);
  if (mobil) {
    const t0 = Date.now();
    try { window.location.href = 'instagram://app'; } catch (e) {}
    setTimeout(() => {
      if (Date.now() - t0 < 1600 && !document.hidden) window.open('https://www.instagram.com/', '_blank');
    }, 900);
  } else {
    window.open('https://www.instagram.com/', '_blank');
  }
};

SS.requestRender = function () {
  if (SS._raf) return;
  SS._raf = requestAnimationFrame(() => { SS._raf = null; SS.render(); });
};

// ---------- IndexedDB autosave ----------
SS.db = null;
(function () {
  try {
    const req = indexedDB.open('seamless-studio', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('kv');
    req.onsuccess = () => { SS.db = req.result; SS.loadAutosave && SS.loadAutosave(); };
    req.onerror = () => {};
  } catch (e) { /* private mode etc. */ }
})();

SS.dbPut = function (key, val) {
  if (!SS.db) return;
  try {
    const tx = SS.db.transaction('kv', 'readwrite');
    tx.objectStore('kv').put(val, key);
  } catch (e) {}
};
SS.dbGet = function (key) {
  return new Promise((resolve) => {
    if (!SS.db) return resolve(null);
    try {
      const tx = SS.db.transaction('kv', 'readonly');
      const rq = tx.objectStore('kv').get(key);
      rq.onsuccess = () => resolve(rq.result || null);
      rq.onerror = () => resolve(null);
    } catch (e) { resolve(null); }
  });
};

SS.dbKeys = function () {
  return new Promise((resolve) => {
    if (!SS.db) return resolve([]);
    try {
      const rq = SS.db.transaction('kv', 'readonly').objectStore('kv').getAllKeys();
      rq.onsuccess = () => resolve(rq.result || []);
      rq.onerror = () => resolve([]);
    } catch (e) { resolve([]); }
  });
};
SS.dbDel = function (key) {
  if (!SS.db) return;
  try { SS.db.transaction('kv', 'readwrite').objectStore('kv').delete(key); } catch (e) {}
};

let _asT = null;
SS.autosave = function () {
  clearTimeout(_asT);
  _asT = setTimeout(() => {
    const imgs = {};
    for (const el of SS.state.elements) {
      if (el.type !== 'photo') continue;
      if (SS.images[el.imgId]) imgs[el.imgId] = SS.images[el.imgId].dataURL;
      if (el.imgIdOrig && SS.images[el.imgIdOrig]) imgs[el.imgIdOrig] = SS.images[el.imgIdOrig].dataURL;
    }
    if (SS.state.bg.custom && SS.state.bg.customURL) imgs.__bg = SS.state.bg.customURL;
    SS.dbPut('autosave', { snap: SS.serialize(), imgs });
    SS.persistStorage && SS.persistStorage();
    const s = SS.el('saveState'); if (s) s.textContent = 'Automatisch gespeichert ✓';
  }, 1200);
};

/* ================================================================
   Speicher, Display und Canvas-Grenzen
   ================================================================ */

/* iOS/Safari räumt Browserspeicher nach 7 Tagen ohne Nutzung ab.
   Als installierte Web-App wird dauerhafter Speicher normalerweise gewährt. */
SS.persistStorage = async function () {
  if (SS._persistTried) return SS._persisted;
  SS._persistTried = true;
  try {
    if (navigator.storage && navigator.storage.persist) {
      SS._persisted = (await navigator.storage.persisted()) || (await navigator.storage.persist());
    }
  } catch (e) { SS._persisted = false; }
  return SS._persisted;
};

SS.storageInfo = async function () {
  try {
    if (!navigator.storage || !navigator.storage.estimate) return null;
    const e = await navigator.storage.estimate();
    return { used: e.usage || 0, quota: e.quota || 0, persisted: !!SS._persisted };
  } catch (e) { return null; }
};

/* Display während Export und Aufnahme wach halten */
let _wake = null;
SS.wakeOn = async function () {
  try {
    if ('wakeLock' in navigator && !_wake) _wake = await navigator.wakeLock.request('screen');
  } catch (e) {}
};
SS.wakeOff = function () {
  try { if (_wake) { _wake.release(); _wake = null; } } catch (e) {}
};
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && _wake === null) return;
});

/* WebKit begrenzt ein einzelnes Canvas auf 16.777.216 px² (4096 × 4096).
   Alles, was größer wäre, muss gekachelt oder herunterskaliert werden. */
SS.MAX_CANVAS_AREA = 16777216;

SS.areaOk = (w, h) => (w * h) <= SS.MAX_CANVAS_AREA;

/* Größter Faktor ≤ wunsch, der die Flächengrenze einhält */
SS.fitScale = function (w, h, wish) {
  const max = Math.sqrt(SS.MAX_CANVAS_AREA / (w * h));
  return Math.min(wish, max);
};

SS.makeCanvas = function (w, h) {
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.round(w));
  cv.height = Math.max(1, Math.round(h));
  return cv;
};

/* Unter WebKit gibt nur das Nullsetzen den Canvas-Speicher wirklich frei */
SS.freeCanvas = function (cv) {
  if (!cv) return;
  try { cv.width = 0; cv.height = 0; } catch (e) {}
};

/* Haptik */
SS.buzz = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms || 8); } catch (e) {} };
