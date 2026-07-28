/* Seamless Studio – Zuschnitt
   Echte Zuschnitt-Box mit Griffen, Seitenverhältnis-Vorgaben, Füllen/Einpassen,
   90°-Drehung und Begradigen. */

SS.crop = {};
(function () {
  const C = SS.crop;
  const $ = SS.el;

  const RATIOS = [
    { id: 'free', name: 'Frei', r: 0 },
    { id: 'orig', name: 'Original', r: -1 },
    { id: '1:1', name: '1:1', r: 1 },
    { id: '4:5', name: '4:5', r: 4 / 5 },
    { id: '3:4', name: '3:4', r: 3 / 4 },
    { id: '2:3', name: '2:3', r: 2 / 3 },
    { id: '16:9', name: '16:9', r: 16 / 9 },
    { id: '9:16', name: '9:16', r: 9 / 16 },
  ];

  const S = {
    el: null, rec: null,
    iw: 0, ih: 0,          // Quellgröße nach 90°-Drehung
    rect: null,            // {x,y,w,h} in Quellpixeln
    rot90: 0, angle: 0,
    ratio: 'free',
    view: null, k: 1,      // Anzeigemaßstab
    drag: null,
  };
  C.state = S;

  function srcSize() {
    const swap = S.rot90 === 90 || S.rot90 === 270;
    return swap ? { w: S.rec.h, h: S.rec.w } : { w: S.rec.w, h: S.rec.h };
  }

  function rotatedSource() {
    const q = S.rot90;
    if (!q) return S.rec.img;
    const s = srcSize();
    const cv = SS.makeCanvas(s.w, s.h);
    const c = cv.getContext('2d');
    c.translate(s.w / 2, s.h / 2);
    c.rotate(SS.deg2rad(q));
    c.drawImage(S.rec.img, -S.rec.w / 2, -S.rec.h / 2);
    return cv;
  }

  /* ---------- Zeichnen ---------- */
  function draw() {
    const cv = S.view;
    if (!cv) return;
    const c = cv.getContext('2d');
    const s = srcSize();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, cv.width, cv.height);

    const img = S._rotCache || (S._rotCache = rotatedSource());
    c.save();
    c.globalAlpha = 0.35;
    if (S.angle) {
      c.translate(cv.width / 2, cv.height / 2);
      c.rotate(SS.deg2rad(S.angle));
      c.translate(-cv.width / 2, -cv.height / 2);
    }
    c.drawImage(img, 0, 0, cv.width, cv.height);
    c.restore();

    const k = cv.width / s.w;
    const r = S.rect;
    const rx = r.x * k, ry = r.y * k, rw = r.w * k, rh = r.h * k;

    // Ausschnitt hell
    c.save();
    c.beginPath(); c.rect(rx, ry, rw, rh); c.clip();
    if (S.angle) {
      c.translate(cv.width / 2, cv.height / 2);
      c.rotate(SS.deg2rad(S.angle));
      c.translate(-cv.width / 2, -cv.height / 2);
    }
    c.drawImage(img, 0, 0, cv.width, cv.height);
    c.restore();

    // Drittelraster
    c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1;
    for (let i = 1; i <= 2; i++) {
      c.beginPath(); c.moveTo(rx + rw * i / 3, ry); c.lineTo(rx + rw * i / 3, ry + rh); c.stroke();
      c.beginPath(); c.moveTo(rx, ry + rh * i / 3); c.lineTo(rx + rw, ry + rh * i / 3); c.stroke();
    }
    // Rahmen und Griffe
    c.strokeStyle = '#f0e2d0'; c.lineWidth = 2;
    c.strokeRect(rx, ry, rw, rh);
    c.fillStyle = '#f0e2d0';
    const hs = 7;
    for (const [hx, hy] of [[rx, ry], [rx + rw, ry], [rx, ry + rh], [rx + rw, ry + rh],
      [rx + rw / 2, ry], [rx + rw / 2, ry + rh], [rx, ry + rh / 2], [rx + rw, ry + rh / 2]]) {
      c.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
    }
    const lbl = `${Math.round(r.w)} × ${Math.round(r.h)}`;
    c.font = '12px Poppins, sans-serif';
    c.textAlign = 'center';
    const tw = c.measureText(lbl).width + 12;
    c.fillStyle = 'rgba(15,12,10,.8)';
    c.fillRect(rx + rw / 2 - tw / 2, ry + rh - 26, tw, 20);
    c.fillStyle = '#f0e2d0';
    c.fillText(lbl, rx + rw / 2, ry + rh - 12);
  }
  C.draw = draw;

  /* ---------- Seitenverhältnis erzwingen ---------- */
  function ratioValue() {
    const def = RATIOS.find(x => x.id === S.ratio);
    if (!def) return 0;
    if (def.r === -1) { const s = srcSize(); return s.w / s.h; }
    return def.r;
  }

  function applyRatio(anchor) {
    const R = ratioValue();
    if (!R) return;
    const s = srcSize();
    const r = S.rect;
    let w = r.w, h = w / R;
    if (h > s.h) { h = s.h; w = h * R; }
    if (w > s.w) { w = s.w; h = w / R; }
    if (anchor === 'center') { r.x = r.x + (r.w - w) / 2; r.y = r.y + (r.h - h) / 2; }
    r.w = w; r.h = h;
    clampRect();
  }

  function clampRect() {
    const s = srcSize(), r = S.rect;
    r.w = SS.clamp(r.w, 24, s.w);
    r.h = SS.clamp(r.h, 24, s.h);
    r.x = SS.clamp(r.x, 0, s.w - r.w);
    r.y = SS.clamp(r.y, 0, s.h - r.h);
  }

  /* ---------- Dialog ---------- */
  C.open = function (el) {
    const rec = SS.images[el.imgId];
    if (!rec) return SS.toast('Foto nicht gefunden', 2200, 'err');
    S.el = el; S.rec = rec;
    S._rotCache = null;
    const cr = el.crop || {};
    S.rot90 = cr.rot90 || 0;
    S.angle = cr.angle || 0;
    S.ratio = cr.ratio || 'free';
    const s = srcSize();
    S.rect = cr.rect ? { x: cr.rect.x, y: cr.rect.y, w: cr.rect.w, h: cr.rect.h }
      : { x: 0, y: 0, w: s.w, h: s.h };
    clampRect();

    $('cropDlg').classList.remove('hidden');
    const cv = $('cropCanvas');
    const box = cv.parentElement;
    const maxW = Math.min(box.clientWidth || 320, 500);
    const maxH = Math.min(window.innerHeight * (window.innerWidth < 760 ? 0.33 : 0.44), 440);
    let vw = maxW, vh = vw * s.h / s.w;
    if (vh > maxH) { vh = maxH; vw = vh * s.w / s.h; }
    cv.width = Math.round(vw); cv.height = Math.round(vh);
    cv.style.width = Math.round(vw) + 'px';
    cv.style.height = Math.round(vh) + 'px';
    S.view = cv;
    S.k = cv.width / s.w;

    $('cropStraight').value = S.angle;
    $('cropStraightL').textContent = S.angle.toFixed(1) + '°';
    renderRatios();
    draw();
  };

  function close() {
    $('cropDlg').classList.add('hidden');
    S.el = null; S.rec = null; S._rotCache = null;
  }

  function renderRatios() {
    const box = $('cropRatios');
    box.innerHTML = '';
    RATIOS.forEach(r => {
      const b = document.createElement('button');
      b.textContent = r.name;
      if (r.id === S.ratio) b.classList.add('sel');
      b.onclick = () => { S.ratio = r.id; applyRatio('center'); renderRatios(); draw(); };
      box.appendChild(b);
    });
  }

  /* ---------- Ziehen ---------- */
  function at(ev) {
    const r = S.view.getBoundingClientRect();
    const s = srcSize();
    return [(ev.clientX - r.left) / r.width * s.w, (ev.clientY - r.top) / r.height * s.h];
  }

  function hitPart(x, y) {
    const r = S.rect;
    const t = 18 / S.k;
    const nearL = Math.abs(x - r.x) < t, nearR = Math.abs(x - (r.x + r.w)) < t;
    const nearT = Math.abs(y - r.y) < t, nearB = Math.abs(y - (r.y + r.h)) < t;
    const inY = y > r.y - t && y < r.y + r.h + t;
    const inX = x > r.x - t && x < r.x + r.w + t;
    if (nearL && nearT) return 'nw';
    if (nearR && nearT) return 'ne';
    if (nearL && nearB) return 'sw';
    if (nearR && nearB) return 'se';
    if (nearL && inY) return 'w';
    if (nearR && inY) return 'e';
    if (nearT && inX) return 'n';
    if (nearB && inX) return 's';
    if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) return 'move';
    return null;
  }

  C.initUI = function () {
    const cv = $('cropCanvas');
    if (!cv) return;

    cv.addEventListener('pointerdown', (ev) => {
      if (!S.el) return;
      ev.preventDefault();
      const [x, y] = at(ev);
      const part = hitPart(x, y);
      if (!part) return;
      S.drag = { part, x, y, r: Object.assign({}, S.rect) };
      try { cv.setPointerCapture(ev.pointerId); } catch (e) {}
    });

    cv.addEventListener('pointermove', (ev) => {
      if (!S.drag) return;
      ev.preventDefault();
      const [x, y] = at(ev);
      const d = S.drag, o = d.r, r = S.rect;
      const dx = x - d.x, dy = y - d.y;
      const R = ratioValue();
      if (d.part === 'move') {
        r.x = o.x + dx; r.y = o.y + dy;
      } else {
        let nx = o.x, ny = o.y, nw = o.w, nh = o.h;
        if (d.part.indexOf('w') >= 0) { nx = o.x + dx; nw = o.w - dx; }
        if (d.part.indexOf('e') >= 0) { nw = o.w + dx; }
        if (d.part.indexOf('n') >= 0) { ny = o.y + dy; nh = o.h - dy; }
        if (d.part.indexOf('s') >= 0) { nh = o.h + dy; }
        if (R) {
          if (d.part === 'n' || d.part === 's') nw = nh * R;
          else nh = nw / R;
          if (d.part.indexOf('w') >= 0) nx = o.x + o.w - nw;
          if (d.part.indexOf('n') >= 0) ny = o.y + o.h - nh;
        }
        r.x = nx; r.y = ny; r.w = Math.max(24, nw); r.h = Math.max(24, nh);
      }
      clampRect();
      draw();
    });
    const up = () => { S.drag = null; };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);

    $('cropStraight').addEventListener('input', () => {
      S.angle = +$('cropStraight').value;
      $('cropStraightL').textContent = S.angle.toFixed(1) + '°';
      draw();
    });

    $('cropFill').onclick = () => {
      // Ausschnitt auf das Format des Elements bringen und maximal füllen
      const el = S.el;
      const size = SS.elSizeRaw(el);
      const target = size.w / size.h;
      const s = srcSize();
      let w = s.w, h = w / target;
      if (h > s.h) { h = s.h; w = h * target; }
      S.rect = { x: (s.w - w) / 2, y: (s.h - h) / 2, w, h };
      S.ratio = 'free'; renderRatios(); draw();
    };
    $('cropFit').onclick = () => {
      const s = srcSize();
      S.rect = { x: 0, y: 0, w: s.w, h: s.h };
      S.ratio = 'free'; renderRatios(); draw();
    };
    $('cropRotL').onclick = () => rotate(-90);
    $('cropRotR').onclick = () => rotate(90);

    function rotate(d) {
      S.rot90 = ((S.rot90 + d) % 360 + 360) % 360;
      S._rotCache = null;
      const s = srcSize();
      S.rect = { x: 0, y: 0, w: s.w, h: s.h };
      // Anzeige neu einpassen
      const cvv = $('cropCanvas');
      const maxW = Math.min(cvv.parentElement.clientWidth || 320, 500);
      const maxH = Math.min(window.innerHeight * (window.innerWidth < 760 ? 0.33 : 0.44), 440);
      let vw = maxW, vh = vw * s.h / s.w;
      if (vh > maxH) { vh = maxH; vw = vh * s.w / s.h; }
      cvv.width = Math.round(vw); cvv.height = Math.round(vh);
      cvv.style.width = Math.round(vw) + 'px'; cvv.style.height = Math.round(vh) + 'px';
      S.k = cvv.width / s.w;
      draw();
    }

    $('cropReset').onclick = () => {
      S.rot90 = 0; S.angle = 0; S.ratio = 'free'; S._rotCache = null;
      $('cropStraight').value = 0; $('cropStraightL').textContent = '0°';
      const s = srcSize();
      S.rect = { x: 0, y: 0, w: s.w, h: s.h };
      renderRatios(); draw();
    };
    $('cropCancel').onclick = close;
    $('cropClose').onclick = close;

    $('cropApply').onclick = () => {
      const el = S.el;
      el.crop = {
        zoom: 1, ox: 0, oy: 0,
        rect: { x: Math.round(S.rect.x), y: Math.round(S.rect.y), w: Math.round(S.rect.w), h: Math.round(S.rect.h) },
        rot90: S.rot90, angle: S.angle, ratio: S.ratio,
      };
      SS.photoCacheClear(el.id); SS.invalidateEl(el);
      SS.pushHistory('Zugeschnitten');
      SS.ui.showProps(); SS.requestRender();
      SS.toast('Zuschnitt übernommen', 2000, 'ok');
      close();
    };
  };
})();
