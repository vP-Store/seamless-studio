/* ============================================================
   Seamless Studio 5.0 — Bewegung auf der Leinwand
     · laufende Strichlinie am Auswahlrahmen ("marching ants")
     · Zoom und Einpassen mit Trägheit statt Sprung
     · neue Elemente wachsen an ihren Platz
     · Taktanzeige, die im Beat blinkt
   Läuft nur, wenn etwas ausgewählt ist, und schweigt im
   Leistungsmodus sowie bei „weniger Bewegung".
   ============================================================ */

(function () {
  const $ = (id) => document.getElementById(id);
  const st = SS.state;
  const calm = () => st.perfMode ||
    (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ================= laufende Strichlinie ================= */

  SS._ants = 0;
  let raf = null;

  function tick() {
    raf = null;
    if (calm() || !st.selectedIds.length) { SS._ants = 0; SS.requestRender(); return; }
    SS._ants = (SS._ants + 0.7) % 1000;
    SS.requestRender();
    raf = requestAnimationFrame(tick);
  }
  function ants(on) {
    if (on && !raf && !calm()) raf = requestAnimationFrame(tick);
    if (!on && raf) { cancelAnimationFrame(raf); raf = null; SS._ants = 0; SS.requestRender(); }
  }

  /* ================= Trägheit beim Zoomen ================= */

  let zAnim = null;
  function glide(toZoom, toPanX, toPanY, ms) {
    if (calm()) { st.zoom = toZoom; st.panX = toPanX; st.panY = toPanY; SS.requestRender(); return; }
    const z0 = st.zoom, x0 = st.panX, y0 = st.panY, t0 = performance.now();
    const dur = ms || 340;
    if (zAnim) cancelAnimationFrame(zAnim);
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      st.zoom = z0 + (toZoom - z0) * e;
      st.panX = x0 + (toPanX - x0) * e;
      st.panY = y0 + (toPanY - y0) * e;
      SS.ui.zoomLabel && SS.ui.zoomLabel();
      SS.requestRender();
      if (p < 1) zAnim = requestAnimationFrame(step); else zAnim = null;
    };
    zAnim = requestAnimationFrame(step);
  }
  SS.ui.glideView = glide;

  /* Einpassen sanft anfahren, ohne die Rechnung von ui.js zu verdoppeln */
  const origFit = SS.ui.zoomFit;
  SS.ui.zoomFit = function () {
    if (calm()) return origFit.apply(this, arguments);
    const z0 = st.zoom, x0 = st.panX, y0 = st.panY;
    origFit.apply(this, arguments);
    const z1 = st.zoom, x1 = st.panX, y1 = st.panY;
    st.zoom = z0; st.panX = x0; st.panY = y0;
    glide(z1, x1, y1, 380);
  };

  /* Slide-Leiste: Sprung zur Slide gleitet ebenfalls */
  const origGoto = SS.ui.gotoSlide;
  if (typeof origGoto === 'function') {
    SS.ui.gotoSlide = function (i) {
      const x0 = st.panX;
      origGoto.call(this, i);
      const x1 = st.panX;
      st.panX = x0;
      glide(st.zoom, x1, st.panY, 300);
    };
  }

  /* ================= neue Elemente wachsen herein ================= */

  const origPaint = SS.paintScene;
  SS.paintScene = function () {
    return origPaint.apply(this, arguments);
  };

  /* ================= Taktanzeige ================= */

  function beatDot() {
    const host = $('vidSounds');
    if (!host || !SS.beat) return;
    let dot = $('beatDot');
    if (!dot) {
      const row = document.createElement('div');
      row.className = 'ctl';
      row.id = 'beatDotRow';
      const s = document.createElement('span');
      s.textContent = 'Takt';
      dot = document.createElement('span');
      dot.className = 'beat-dot';
      dot.id = 'beatDot';
      const lab = document.createElement('span');
      lab.className = 'val';
      lab.id = 'beatDotLab';
      lab.style.minWidth = '54px';
      row.appendChild(s); row.appendChild(dot); row.appendChild(lab);
      host.parentNode.insertBefore(row, host);
    }
    const bpm = SS.beat.bpm || 84;
    const every = Math.max(1, SS.beat.every || 1);
    dot.style.setProperty('--beat', (60 / bpm * every).toFixed(3) + 's');
    $('beatDotLab').textContent = bpm + ' bpm';
    $('beatDotRow').classList.toggle('hidden', !SS.beat.on);
  }

  /* ================= neue Elemente kurz hervorheben ================= */

  SS._born = new Map();
  const known = new Set(st.elements.map(e => e.id));
  let bornRaf = null;

  function bornTick() {
    bornRaf = null;
    if (!SS._born.size) return;
    SS.requestRender();
    bornRaf = requestAnimationFrame(bornTick);
  }
  function markNew() {
    if (calm()) { known.clear(); for (const e of st.elements) known.add(e.id); return; }
    const now = performance.now();
    let any = false;
    for (const e of st.elements) {
      if (!known.has(e.id)) { known.add(e.id); SS._born.set(e.id, now); any = true; }
    }
    for (const id of [...known]) if (!st.elements.some(e => e.id === id)) known.delete(id);
    if (any && !bornRaf) bornRaf = requestAnimationFrame(bornTick);
  }

  /* ================= Einrast-Linien: Zeitstempel setzen ================= */

  /* Kein Abfragen im Leerlauf: der Zeitstempel entsteht in dem Moment,
     in dem interact.js die Linien setzt. */
  (function () {
    let _snap = SS._snapLines;
    try {
      Object.defineProperty(SS, '_snapLines', {
        get() { return _snap; },
        set(v) {
          if (v && !calm()) SS._snapT = performance.now();
          _snap = v;
        },
        configurable: true,
      });
    } catch (e) { /* falls die Eigenschaft nicht ersetzbar ist, bleibt es ohne Blitz */ }
  })();

  /* ================= Verdrahtung ================= */

  const origShow = SS.ui.showProps;
  SS.ui.showProps = function () {
    origShow.apply(this, arguments);
    ants(st.selectedIds.length > 0);
  };

  const origPush = SS.pushHistory;
  SS.pushHistory = function () {
    origPush.apply(this, arguments);
    markNew();
    beatDot();
  };

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) ants(false);
    else ants(st.selectedIds.length > 0);
  });

  window.addEventListener('load', () => setTimeout(() => {
    beatDot();
    ants(st.selectedIds.length > 0);
  }, 900));
})();
