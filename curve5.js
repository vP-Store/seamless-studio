/* ============================================================
   Seamless Studio 6.2 — Freie Tonwertkurve und HSL-Mischer
   Die Kurve hat vier ziehbare Stützpunkte und wird monoton
   interpoliert; der HSL-Mischer arbeitet in sechs Farbbereichen.
   Beides landet in derselben Rechenstufe wie Lichter und Tiefen,
   kostet also keinen zusätzlichen Durchgang über die Pixel.
   Lädt nach render.js und studio5.js.
   ============================================================ */

(function () {
  const $ = (id) => document.getElementById(id);

  const DEF = () => [{ x: 0.25, y: 0.25 }, { x: 0.5, y: 0.5 }, { x: 0.75, y: 0.75 }];

  const PRESETS = [
    ['linear', 'Neutral', () => DEF()],
    ['film', 'Filmkurve', () => [{ x: 0.25, y: 0.21 }, { x: 0.5, y: 0.52 }, { x: 0.75, y: 0.82 }]],
    ['matt', 'Matt', () => [{ x: 0.25, y: 0.32 }, { x: 0.5, y: 0.54 }, { x: 0.75, y: 0.74 }]],
    ['kontrast', 'Kontrast', () => [{ x: 0.25, y: 0.16 }, { x: 0.5, y: 0.5 }, { x: 0.75, y: 0.86 }]],
  ];

  function refresh(sel, label) {
    SS.photoCacheClear(sel.id);
    SS.cardCacheClear && SS.cardCacheClear(sel.id);
    SS.requestRender();
    if (label) SS.pushHistory(label);
  }

  /* ================= Kurven-Feld ================= */

  function curveWidget(sel, body) {
    const fl = sel.filter;
    if (!fl.curve || !fl.curve.length) fl.curve = DEF();

    const wrap = document.createElement('div');
    wrap.style.cssText = 'margin:8px 0;border:1px solid var(--line);background:var(--bg2);' +
      'padding:8px;display:flex;justify-content:center;';
    const cv = document.createElement('canvas');
    const S = 208;
    cv.width = S * 2; cv.height = S * 2;
    cv.style.width = '100%';
    cv.style.maxWidth = S + 'px';
    cv.style.height = 'auto';
    cv.style.touchAction = 'none';
    cv.style.cursor = 'crosshair';
    wrap.appendChild(cv);
    body.appendChild(wrap);

    const c = cv.getContext('2d');
    c.scale(2, 2);

    function draw() {
      c.clearRect(0, 0, S, S);
      c.fillStyle = '#1A1613'; c.fillRect(0, 0, S, S);
      c.strokeStyle = 'rgba(250,247,242,.10)'; c.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        c.beginPath(); c.moveTo(i * S / 4, 0); c.lineTo(i * S / 4, S); c.stroke();
        c.beginPath(); c.moveTo(0, i * S / 4); c.lineTo(S, i * S / 4); c.stroke();
      }
      c.strokeStyle = 'rgba(250,247,242,.18)';
      c.beginPath(); c.moveTo(0, S); c.lineTo(S, 0); c.stroke();

      const lut = SS.curveLUT(fl.curve);
      c.strokeStyle = '#C8553D'; c.lineWidth = 2;
      c.beginPath();
      for (let i = 0; i < 256; i++) {
        const x = i / 255 * S, y = S - lut[i] / 255 * S;
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();

      c.fillStyle = '#F5F0E9';
      for (const p of fl.curve) {
        c.beginPath();
        c.arc(p.x * S, S - p.y * S, 5, 0, Math.PI * 2);
        c.fill();
      }
    }

    let drag = -1;
    const pos = (ev) => {
      const r = cv.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width;
      const y = 1 - (ev.clientY - r.top) / r.height;
      return [Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y))];
    };
    cv.addEventListener('pointerdown', (ev) => {
      const [x, y] = pos(ev);
      let best = -1, bd = 0.13;
      fl.curve.forEach((p, i) => {
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < bd) { bd = d; best = i; }
      });
      drag = best;
      if (drag >= 0) { cv.setPointerCapture(ev.pointerId); ev.preventDefault(); }
    });
    cv.addEventListener('pointermove', (ev) => {
      if (drag < 0) return;
      const [x, y] = pos(ev);
      const lo = drag === 0 ? 0.02 : fl.curve[drag - 1].x + 0.04;
      const hi = drag === fl.curve.length - 1 ? 0.98 : fl.curve[drag + 1].x - 0.04;
      fl.curve[drag] = { x: Math.max(lo, Math.min(hi, x)), y };
      fl.preset = 'custom';
      draw();
      refresh(sel);
    });
    const end = () => { if (drag >= 0) { drag = -1; SS.pushHistory('Tonwertkurve'); } };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);

    const row = document.createElement('div');
    row.className = 'chips';
    for (const [, name, make] of PRESETS) {
      const b = document.createElement('button');
      b.textContent = name;
      b.onclick = () => { fl.curve = make(); fl.preset = 'custom'; draw(); refresh(sel, 'Tonwertkurve'); };
      row.appendChild(b);
    }
    body.appendChild(row);

    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.textContent = 'Punkte ziehen: unten links die Tiefen, oben rechts die Lichter. Eine flache S-Kurve gibt Kontrast, eine angehobene linke Ecke den matten Look.';
    body.appendChild(hint);

    draw();
  }

  /* ================= HSL-Mischer ================= */

  function hslWidget(sel, body) {
    const fl = sel.filter;
    fl.hsl = fl.hsl || {};
    let cur = SS.HSL_RANGES[0][0];

    const row = document.createElement('div');
    row.className = 'chips';
    const dot = (key) => ({
      rot: '#C8553D', orange: '#D9843D', gelb: '#D9C23D',
      gruen: '#6E9A5E', blau: '#5E7A9A', magenta: '#9A5E86',
    })[key];

    const ctls = document.createElement('div');

    function build() {
      ctls.innerHTML = '';
      const a = fl.hsl[cur] = fl.hsl[cur] || { h: 0, s: 0, l: 0 };
      const mk = (label, key, min, max, unit) => {
        const d = document.createElement('div'); d.className = 'ctl';
        const s = document.createElement('span'); s.textContent = label;
        const r = document.createElement('input');
        r.type = 'range'; r.min = min; r.max = max; r.value = a[key] || 0;
        const v = document.createElement('span'); v.className = 'val';
        v.textContent = (a[key] || 0) + (unit || '');
        r.addEventListener('input', () => {
          a[key] = +r.value; v.textContent = r.value + (unit || '');
          fl.preset = 'custom'; refresh(sel);
        });
        r.addEventListener('change', () => SS.pushHistory('Farbmischer'));
        d.appendChild(s); d.appendChild(r); d.appendChild(v);
        ctls.appendChild(d);
      };
      mk('Farbton', 'h', -40, 40, '°');
      mk('Sättigung', 's', -100, 100, ' %');
      mk('Helligkeit', 'l', -60, 60, ' %');
    }

    for (const [key, name] of SS.HSL_RANGES) {
      const b = document.createElement('button');
      b.textContent = name;
      b.style.borderLeft = '4px solid ' + dot(key);
      if (key === cur) b.classList.add('sel');
      b.onclick = () => {
        cur = key;
        [...row.children].forEach(x => x.classList.remove('sel'));
        b.classList.add('sel');
        build();
      };
      row.appendChild(b);
    }
    body.appendChild(row);
    body.appendChild(ctls);
    build();

    const reset = document.createElement('button');
    reset.className = 'wide';
    reset.textContent = 'Farbmischer zurücksetzen';
    reset.onclick = () => { fl.hsl = {}; refresh(sel, 'Farbmischer zurückgesetzt'); SS.ui.showProps(); };
    body.appendChild(reset);
  }

  /* ================= Einhängen ================= */

  function h4(t) { const e = document.createElement('h4'); e.textContent = t; return e; }

  const origShowProps = SS.ui && SS.ui.showProps;
  if (origShowProps) SS.ui.showProps = function () {
    origShowProps.apply(this, arguments);
    const sel = SS.getSel();
    if (!sel || sel.type !== 'photo' || SS.selCount() !== 1) return;
    const body = $('propsBody');
    if (!body) return;
    sel.filter = sel.filter || SS.defaultFilter();
    body.appendChild(h4('Tonwertkurve'));
    curveWidget(sel, body);
    body.appendChild(h4('Farbmischer'));
    hslWidget(sel, body);
  };

  SS.CURVE5 = true;
})();
