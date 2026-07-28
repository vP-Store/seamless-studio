/* Seamless Studio – Freisteller
   Hintergrund von Fotos entfernen. Läuft komplett im Gerät, ohne Server und
   ohne Modell-Download – also auch offline und ohne Datenschutz-Fragen.

   Drei Wege, die sich kombinieren lassen:
     • Auto   – flutet vom Bildrand in den Hintergrund hinein (bestens bei
                ruhigen, einfarbigen Hintergründen)
     • Farbe  – entfernt überall eine mit der Pipette gewählte Farbe
     • Pinsel – von Hand radieren und zurückholen

   Die Maske wird auf einer verkleinerten Fassung berechnet (schnell) und
   anschließend weich auf die volle Auflösung gezogen. Pinselstriche werden
   getrennt gehalten, damit beim Malen nicht jedes Mal neu geflutet wird. */

SS.cutout = {};
(function () {
  const C = SS.cutout;
  const $ = SS.el;
  const MAXW = 860;                 // Arbeitsauflösung der Maske

  /* ================================================================
     Kern
     ================================================================ */
  function colorDist(d, i, r, g, b) {
    const dr = d[i] - r, dg = d[i + 1] - g, db = d[i + 2] - b;
    // wahrgenommene Gewichtung – Grün zählt mehr als Blau
    return Math.sqrt(dr * dr * 0.30 + dg * dg * 0.59 + db * db * 0.11);
  }

  /* Flutfüllung von allen vier Rändern. mask: 255 = sichtbar, 0 = weg */
  function floodFromBorder(img, w, h, tol, mask) {
    const d = img.data;
    let sr = 0, sg = 0, sb = 0, n = 0;
    const add = (x, y) => { const i = (y * w + x) * 4; sr += d[i]; sg += d[i + 1]; sb += d[i + 2]; n++; };
    for (let x = 0; x < w; x++) { add(x, 0); add(x, h - 1); }
    for (let y = 0; y < h; y++) { add(0, y); add(w - 1, y); }
    const br = sr / n, bg = sg / n, bb = sb / n;

    const seen = new Uint8Array(w * h);
    const stack = new Int32Array(w * h);
    let sp = 0;
    const push = (p) => { if (!seen[p]) { seen[p] = 1; stack[sp++] = p; } };
    for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }

    const far = tol * 2.3;          // Grenze gegen Auslaufen ins Motiv
    while (sp > 0) {
      const p = stack[--sp];
      const i = p * 4;
      if (colorDist(d, i, br, bg, bb) > far) continue;
      mask[p] = 0;
      const x = p % w, y = (p / w) | 0;
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const test = (q) => {
        if (seen[q]) return;
        const j = q * 4;
        if (colorDist(d, j, r, g, b) < tol || colorDist(d, j, br, bg, bb) < tol * 0.8) push(q);
      };
      if (x > 0) test(p - 1);
      if (x < w - 1) test(p + 1);
      if (y > 0) test(p - w);
      if (y < h - 1) test(p + w);
    }
  }

  /* Alle Pixel einer Farbe entfernen (Chroma-Key, ohne Zusammenhang) */
  function removeColor(img, w, h, rgb, tol, mask) {
    const d = img.data;
    for (let p = 0, N = w * h; p < N; p++) {
      if (colorDist(d, p * 4, rgb[0], rgb[1], rgb[2]) < tol) mask[p] = 0;
    }
  }

  /* Maske um n Pixel schrumpfen – frisst Farbsäume am Rand weg */
  function erode(mask, w, h, n) {
    for (let k = 0; k < n; k++) {
      const cp = mask.slice();
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const p = y * w + x;
          if (!cp[p]) continue;
          if (!cp[p - 1] || !cp[p + 1] || !cp[p - w] || !cp[p + w]) mask[p] = 0;
        }
      }
    }
  }

  /* ================================================================
     Zustand
     ================================================================ */
  const S = {
    el: null, src: null, work: null, imgData: null,
    w: 0, h: 0,
    base: null,       // Maske aus Auto + Farbe + Rand kürzen
    mask: null,       // base + Pinselstriche
    paint: null,      // 0 = nichts, 1 = radiert, 2 = zurückgeholt
    auto: true,
    pickRGB: null,
    tool: 'none',     // none | color | erase | restore
    tol: 42, feather: 2, trim: 1, brush: 34,
    view: null, drawing: false, last: null,
  };
  C.state = S;

  /* --- Grundmaske (teuer) --- */
  function computeBase() {
    const { w, h } = S;
    S.base = new Uint8Array(w * h).fill(255);
    if (S.auto) floodFromBorder(S.imgData, w, h, S.tol, S.base);
    if (S.pickRGB) removeColor(S.imgData, w, h, S.pickRGB, S.tol, S.base);
    if (S.trim > 0) erode(S.base, w, h, S.trim);
    applyPaint();
  }

  /* --- Pinselstriche darüberlegen (billig) --- */
  function applyPaint() {
    const N = S.w * S.h;
    S.mask = S.base.slice();
    for (let p = 0; p < N; p++) {
      const v = S.paint[p];
      if (v === 1) S.mask[p] = 0;
      else if (v === 2) S.mask[p] = 255;
    }
    drawView();
  }
  C.computeBase = computeBase;

  /* ================================================================
     Maske → Canvas
     ================================================================ */
  let _mk = null, _tmp = null, _checker = null;

  function maskCanvas(feather) {
    const { w, h } = S;
    if (!_mk || _mk.width !== w || _mk.height !== h) {
      _mk = document.createElement('canvas'); _mk.width = w; _mk.height = h;
    }
    const mc = _mk.getContext('2d');
    const id = mc.createImageData(w, h);
    const dd = id.data;
    for (let p = 0, N = w * h; p < N; p++) {
      const i = p * 4;
      dd[i] = dd[i + 1] = dd[i + 2] = 255;
      dd[i + 3] = S.mask[p];
    }
    mc.putImageData(id, 0, 0);
    if (feather > 0) {
      const b = document.createElement('canvas');
      b.width = w; b.height = h;
      const bc = b.getContext('2d');
      bc.filter = `blur(${feather}px)`;
      bc.drawImage(_mk, 0, 0);
      return b;
    }
    return _mk;
  }

  /* Freigestelltes Bild in voller Auflösung */
  C.render = function (fullW, fullH) {
    const out = document.createElement('canvas');
    out.width = fullW; out.height = fullH;
    const c = out.getContext('2d');
    c.imageSmoothingQuality = 'high';
    c.drawImage(S.src, 0, 0, fullW, fullH);
    c.globalCompositeOperation = 'destination-in';
    c.drawImage(maskCanvas(S.feather), 0, 0, fullW, fullH);
    c.globalCompositeOperation = 'source-over';
    return out;
  };

  function checker() {
    if (_checker) return _checker;
    const t = document.createElement('canvas');
    t.width = 20; t.height = 20;
    const c = t.getContext('2d');
    c.fillStyle = '#3a332e'; c.fillRect(0, 0, 20, 20);
    c.fillStyle = '#282320'; c.fillRect(0, 0, 10, 10); c.fillRect(10, 10, 10, 10);
    _checker = t;
    return t;
  }

  function drawView() {
    const cv = S.view;
    if (!cv) return;
    const c = cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, cv.width, cv.height);
    c.fillStyle = c.createPattern(checker(), 'repeat');
    c.fillRect(0, 0, cv.width, cv.height);
    if (!_tmp || _tmp.width !== S.w || _tmp.height !== S.h) {
      _tmp = document.createElement('canvas'); _tmp.width = S.w; _tmp.height = S.h;
    }
    const tc = _tmp.getContext('2d');
    tc.clearRect(0, 0, S.w, S.h);
    tc.globalCompositeOperation = 'source-over';
    tc.drawImage(S.work, 0, 0);
    tc.globalCompositeOperation = 'destination-in';
    tc.drawImage(maskCanvas(Math.max(0.4, S.feather * 0.6)), 0, 0);
    tc.globalCompositeOperation = 'source-over';
    c.drawImage(_tmp, 0, 0, cv.width, cv.height);
  }
  C.drawView = drawView;

  /* ================================================================
     Dialog
     ================================================================ */
  C.open = function (el) {
    const rec = SS.images[el.imgIdOrig || el.imgId];
    if (!rec) { SS.toast('Foto nicht gefunden'); return; }
    S.el = el;
    S.src = rec.img;
    const sc = Math.min(1, MAXW / Math.max(rec.w, rec.h));
    S.w = Math.max(1, Math.round(rec.w * sc));
    S.h = Math.max(1, Math.round(rec.h * sc));
    S.work = document.createElement('canvas');
    S.work.width = S.w; S.work.height = S.h;
    const wc = S.work.getContext('2d', { willReadFrequently: true });
    wc.drawImage(rec.img, 0, 0, S.w, S.h);
    S.imgData = wc.getImageData(0, 0, S.w, S.h);
    S.paint = new Uint8Array(S.w * S.h);
    S.pickRGB = null;
    S.auto = true;
    _mk = null; _tmp = null;

    $('cutDlg').classList.remove('hidden');

    const cv = $('cutCanvas');
    const box = cv.parentElement;
    const maxW = Math.min(box.clientWidth || 320, 500);
    const maxH = Math.min(window.innerHeight * (window.innerWidth < 760 ? 0.33 : 0.44), 440);
    let vw = maxW, vh = vw * S.h / S.w;
    if (vh > maxH) { vh = maxH; vw = vh * S.w / S.h; }
    cv.width = Math.round(vw); cv.height = Math.round(vh);
    cv.style.width = Math.round(vw) + 'px';
    cv.style.height = Math.round(vh) + 'px';
    S.view = cv;

    $('cutTol').value = S.tol;
    $('cutFeather').value = S.feather;
    $('cutTrim').value = S.trim;
    $('cutBrush').value = S.brush;
    syncAuto();
    setTool('none');
    computeBase();
  };

  function close() {
    $('cutDlg').classList.add('hidden');
    S.el = null; S.src = null; S.work = null; S.imgData = null;
    S.base = S.mask = S.paint = null;
    _mk = null; _tmp = null;
  }

  function syncAuto() {
    const b = $('cutAuto');
    b.classList.toggle('sel', S.auto);
    b.textContent = S.auto ? '🪄 Auto ✓' : '🪄 Auto';
  }

  const HINTS = {
    none: 'Auto erkennt den Hintergrund vom Bildrand her. Passt etwas nicht, Toleranz nachregeln oder mit dem Pinsel nachbessern.',
    color: 'Tippe in der Vorschau auf die Farbe, die verschwinden soll – sie wird im ganzen Bild entfernt.',
    erase: 'Male über die Bereiche, die weg sollen.',
    restore: 'Male über Bereiche, die wieder zurückkommen sollen.',
  };

  function setTool(t) {
    S.tool = t;
    document.querySelectorAll('#cutTools button').forEach(b => b.classList.toggle('sel', b.dataset.tool === t));
    $('cutBrushRow').classList.toggle('hidden', t !== 'erase' && t !== 'restore');
    $('cutHint').textContent = HINTS[t] || '';
  }

  /* ---------- Pinsel ---------- */
  function atEvent(ev) {
    const r = S.view.getBoundingClientRect();
    return [(ev.clientX - r.left) / r.width * S.w, (ev.clientY - r.top) / r.height * S.h];
  }

  function stamp(x, y, value) {
    const rad = Math.max(1, S.brush / 2 * (S.w / S.view.width));
    const r2 = rad * rad;
    const x0 = Math.max(0, Math.floor(x - rad)), x1 = Math.min(S.w - 1, Math.ceil(x + rad));
    const y0 = Math.max(0, Math.floor(y - rad)), y1 = Math.min(S.h - 1, Math.ceil(y + rad));
    for (let yy = y0; yy <= y1; yy++) {
      const dy = yy - y;
      for (let xx = x0; xx <= x1; xx++) {
        const dx = xx - x;
        if (dx * dx + dy * dy <= r2) S.paint[yy * S.w + xx] = value;
      }
    }
  }

  /* Strich zwischen zwei Punkten, damit keine Lücken entstehen */
  function stroke(x0, y0, x1, y1, value) {
    const d = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(d / 3));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      stamp(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, value);
    }
  }

  C.initUI = function () {
    const cv = $('cutCanvas');
    if (!cv) return;

    $('cutAuto').onclick = () => { S.auto = !S.auto; syncAuto(); computeBase(); };
    document.querySelectorAll('#cutTools button').forEach(b => {
      b.onclick = () => setTool(b.dataset.tool);
    });

    cv.addEventListener('pointerdown', (ev) => {
      if (!S.el) return;
      ev.preventDefault();
      const [x, y] = atEvent(ev);
      if (S.tool === 'color') {
        const px = Math.min(S.w - 1, Math.max(0, Math.round(x)));
        const py = Math.min(S.h - 1, Math.max(0, Math.round(y)));
        const i = (py * S.w + px) * 4;
        const d = S.imgData.data;
        S.pickRGB = [d[i], d[i + 1], d[i + 2]];
        $('cutHint').textContent = 'Farbe übernommen – jetzt mit der Toleranz feinjustieren.';
        computeBase();
        return;
      }
      if (S.tool === 'erase' || S.tool === 'restore') {
        S.drawing = true;
        S.last = [x, y];
        try { cv.setPointerCapture(ev.pointerId); } catch (e) {}
        stamp(x, y, S.tool === 'erase' ? 1 : 2);
        applyPaint();
      }
    });
    cv.addEventListener('pointermove', (ev) => {
      if (!S.drawing) return;
      ev.preventDefault();
      const [x, y] = atEvent(ev);
      stroke(S.last[0], S.last[1], x, y, S.tool === 'erase' ? 1 : 2);
      S.last = [x, y];
      applyPaint();
    });
    const up = () => { S.drawing = false; S.last = null; };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('pointerleave', up);

    const heavy = (id, key) => {
      const inp = $(id);
      inp.addEventListener('input', () => { S[key] = +inp.value; });
      inp.addEventListener('change', () => { S[key] = +inp.value; computeBase(); });
    };
    heavy('cutTol', 'tol');
    heavy('cutTrim', 'trim');
    // weiche Kante ist billig – direkt live
    $('cutFeather').addEventListener('input', () => { S.feather = +$('cutFeather').value; drawView(); });
    $('cutBrush').addEventListener('input', () => { S.brush = +$('cutBrush').value; });

    $('cutReset').onclick = () => {
      S.paint.fill(0); S.pickRGB = null; S.auto = true;
      S.tol = 42; S.feather = 2; S.trim = 1;
      $('cutTol').value = 42; $('cutFeather').value = 2; $('cutTrim').value = 1;
      syncAuto(); setTool('none'); computeBase();
    };
    $('cutCancel').onclick = close;
    $('cutClose').onclick = close;

    $('cutApply').onclick = () => {
      const el = S.el;
      const rec = SS.images[el.imgIdOrig || el.imgId];
      const out = C.render(rec.w, rec.h);
      const dataURL = out.toDataURL('image/png');
      const img = new Image();
      img.onload = () => {
        if (!el.imgIdOrig) el.imgIdOrig = el.imgId;
        const nid = 'cut' + Date.now();
        SS.images[nid] = { img, dataURL, w: out.width, h: out.height };
        el.imgId = nid;
        el.cutout = true;
        // ein Freisteller wirkt ohne Rahmen am besten
        if (el.frame.style !== 'none') { el.frame.style = 'none'; el.frame.border = 0; }
        SS.photoCacheClear(el.id); SS.invalidateEl(el);
        SS.pushHistory(); SS.ui.showProps(); SS.requestRender();
        SS.toast('✂️ Hintergrund entfernt ✓');
        close();
      };
      img.onerror = () => { SS.toast('Freistellen fehlgeschlagen'); close(); };
      img.src = dataURL;
    };
  };

  /* Original wiederherstellen */
  C.revert = function (el) {
    if (!el.imgIdOrig) return;
    el.imgId = el.imgIdOrig;
    delete el.imgIdOrig;
    el.cutout = false;
    SS.photoCacheClear(el.id); SS.invalidateEl(el);
    SS.pushHistory(); SS.ui.showProps(); SS.requestRender();
    SS.toast('Originalfoto wiederhergestellt');
  };
})();
