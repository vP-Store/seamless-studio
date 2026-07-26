/* Seamless Studio – shared state & helpers */
window.SS = {};

// ---------- global state ----------
SS.state = {
  format: '4:5',          // '4:5' | '1:1' | '9:16'
  slides: 5,
  elements: [],           // list of element objects (z-order = array order)
  bg: { type: 'preset', id: 'aq-blush-1', custom: null },
  selectedId: null,
  guides: true,
  zoom: 1, panX: 0, panY: 0,
  _idSeq: 1,
};

SS.SLIDE = { '4:5': [1080, 1350], '1:1': [1080, 1080], '9:16': [1080, 1920] };

SS.canvasSize = function () {
  const [w, h] = SS.SLIDE[SS.state.format];
  const n = SS.state.format === '9:16' ? 1 : SS.state.slides;
  return { W: w * n, H: h, slideW: w, slideH: h, n };
};

SS.uid = () => 'e' + (SS.state._idSeq++);

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

SS.pushHistory = function () {
  const h = SS.history;
  const snap = SS.serialize();
  if (h.stack[h.idx] === snap) return;
  h.stack = h.stack.slice(0, h.idx + 1);
  h.stack.push(snap);
  if (h.stack.length > h.max) h.stack.shift();
  h.idx = h.stack.length - 1;
  SS.autosave && SS.autosave();
};

SS.restore = function (snap) {
  const d = JSON.parse(snap);
  SS.state.format = d.format; SS.state.slides = d.slides;
  SS.state.elements = d.elements; SS.state.bg = d.bg;
  SS.state.selectedId = null;
  SS.bgCacheInvalidate();
  SS.ui.syncTop(); SS.ui.showProps();
  SS.requestRender();
};

SS.undo = function () {
  const h = SS.history;
  if (h.idx > 0) { h.idx--; SS.restore(h.stack[h.idx]); }
};
SS.redo = function () {
  const h = SS.history;
  if (h.idx < h.stack.length - 1) { h.idx++; SS.restore(h.stack[h.idx]); }
};

// ---------- misc ----------
SS.toast = function (msg, ms = 2600) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(SS._toastT);
  SS._toastT = setTimeout(() => t.classList.add('hidden'), ms);
};

SS.el = (id) => document.getElementById(id);

SS.getSel = () => SS.state.elements.find(e => e.id === SS.state.selectedId) || null;

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

let _asT = null;
SS.autosave = function () {
  clearTimeout(_asT);
  _asT = setTimeout(() => {
    const imgs = {};
    for (const el of SS.state.elements) {
      if (el.type === 'photo' && SS.images[el.imgId]) imgs[el.imgId] = SS.images[el.imgId].dataURL;
    }
    if (SS.state.bg.custom && SS.state.bg.customURL) imgs.__bg = SS.state.bg.customURL;
    SS.dbPut('autosave', { snap: SS.serialize(), imgs });
    const s = SS.el('saveState'); if (s) s.textContent = 'Automatisch gespeichert ✓';
  }, 1200);
};
