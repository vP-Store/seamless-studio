/* Seamless Studio – frei ziehen: Rahmen, Clips und Sticker in jedes Format (v8.0)
   ============================================================================
   Drei Dinge standen dem im Weg, ein Element „passend über jedes Quadrat oder
   Rechteck" zu ziehen.

   **1 · Kleine Elemente ließen sich gar nicht mehr verschieben.**
   `interact.js` misst die Griffzonen in Bildschirmpunkten und rechnet sie in
   Weltpunkte um: `hs = (SS.HANDLE + 9) / zoom`. Bei 10 % Zoom sind das 180
   Weltpunkte. Ein Clip von 170 × 260 ist damit KOMPLETT von Griffzonen
   überdeckt – jeder Zug landet auf einem Griff, für „Verschieben" bleibt
   kein Fleck übrig. Nachgemessen: Zug über die Mitte, 60 px nach rechts →
   x bleibt 1620, w bleibt 170. Nichts passiert.

   Und weil `scaleEl()` in `interact.js` gar keinen Zweig für `video` hat,
   passierte beim Ziehen an einer Ecke eines Clips auch tatsächlich nichts.
   Genau das war der eingekreiste Clip: nicht verschiebbar, nicht skalierbar.

   Hier bekommen die Griffe eine Obergrenze von 30 % der kürzeren Seite. Damit
   bleiben in der Mitte immer mindestens 40 % × 40 % zum Anfassen frei – bei
   jedem Zoom, bei jeder Größe.

   **2 · Frei verzerren ging nur mit Shift – auf dem Handy also nie.**
   `interact.js` liest `SS.arLock` (Standard: an) und macht aus jedem Kantenzug
   ein gleichmäßiges Vergrößern, sofern nicht Shift gedrückt ist. Auf einem
   Telefon gibt es kein Shift. v7.9 hat die Sperre für Sticker aufgehoben,
   für Rahmen und Clips galt sie weiter. Jetzt ziehen Kanten UND Ecken frei;
   „Verhältnis halten" ist der Knopf für die Ausnahme (`SS.freiZiehen`).
   `SS.arLock` bleibt dabei unberührt – daran hängen Text und Weichzeichner,
   und die sollen sich nicht anders verhalten als vorher.

   **3 · Es wurde um die Mitte skaliert.**
   Wer eine Kante auf eine Linie legen will, muss die gegenüberliegende Kante
   stehen lassen. Sonst wandert das Element unter dem Finger weg. Hier bleibt
   beim Ziehen an einer Kante die Gegenkante fest, beim Ziehen an einer Ecke
   die Gegenecke – und die Kante fängt an Nachbarelementen, Slidekanten,
   Mitten und den eingeschalteten Rasterlinien ein. Damit liegt ein Rahmen
   „perfekt an allen Seiten" an, ohne Zahlen eintippen zu müssen.

   Statt `interact.js` umzuschreiben, hängt sich diese Datei in der
   AUFFANGPHASE an `window` – also vor jedem Zeigerdienst auf der Leinwand:

     · Griff getroffen  → diese Datei übernimmt den ganzen Zug
       (`stopImmediatePropagation`), rechnet echte Breite × Höhe und legt sie
       direkt ins Element: `el.w/el.h` beim Clip, `el.s/scaleX` beim Sticker,
       `SS.passeRahmenAn` beim Foto. Was man beim Ziehen sieht, ist das
       Ergebnis – keine Verzerrung, die nachher zurückgerechnet wird.
     · Kein Griff getroffen → `SS.HANDLE` wird für die Dauer dieses einen
       Ereignisses stumm gestellt, damit `interact.js` keinen Griff sieht und
       sauber verschiebt. Danach steht der Wert wieder.

   `SS.HANDLE` ist dabei zu einer gemessenen Eigenschaft geworden: sie liefert
   den Radius, der zum aktuell gewählten Element passt. Dadurch zeichnet
   `render.js` die Griffe genau so groß, wie sie auch treffen.
   ========================================================================= */

(function () {
  const canvas = document.getElementById('canvas');
  if (!canvas || !SS.state || typeof SS.elSize !== 'function' || typeof SS.toLocal !== 'function') return;
  const st = SS.state;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ZIEHBAR = { photo: 1, video: 1, sticker: 1, emoji: 1 };

  const BASIS = SS.HANDLE || 9;      // der gezeichnete Griffradius in Bildschirmpunkten
  const ANTEIL = 0.30;               // Griffzone höchstens 30 % der kürzeren Seite
  let stumm = false;                 // Griffe für dieses eine Ereignis unsichtbar machen

  /* v8.0: für Rahmen, Clips und Sticker ist FREI die Regel und Halten die
     Ausnahme. `SS.arLock` bleibt unangetastet – daran hängen Text und
     Weichzeichner, die interact.js weiter selbst skaliert. */
  SS.freiZiehen = true;

  /* ==================================================================
     1 · Wer ist gemeint?
     ================================================================== */
  /* Einzeln gewählt und anfassbar – gleich welcher Art. Der Griffradius und
     die freie Mitte gelten für JEDES Element; übernommen wird der Zug nur bei
     den Arten, für die es hier einen besseren Weg gibt als scaleX/scaleY. */
  function einzel() {
    try {
      if (SS.selCount() !== 1) return null;
      const el = SS.getSel();
      if (!el || el.locked || el.hidden) return null;
      return el;
    } catch (e) { return null; }
  }
  function ziel() {
    const el = einzel();
    return el && ZIEHBAR[el.type] ? el : null;
  }

  /* Sichtbare Größe und der Griffradius, der dazu passt. */
  function zonen(el) {
    const s = SS.elSize(el);
    const w = Math.max(2, s.w), h = Math.max(2, s.h);
    const voll = (BASIS + 9) / Math.max(0.001, st.zoom);
    const r = Math.max(2 / Math.max(0.001, st.zoom), Math.min(voll, Math.min(w, h) * ANTEIL));
    return { w, h, r };
  }
  SS.freiGriffZone = zonen;          // damit Tests nachmessen können

  /* `SS.HANDLE` liefert jetzt den Radius, der zum gewählten Element passt –
     render.js zeichnet damit genau die Griffe, die auch treffen. */
  try {
    delete SS.HANDLE;
    Object.defineProperty(SS, 'HANDLE', {
      configurable: true,
      get() {
        if (stumm) return -1e6;
        const el = einzel();
        if (!el) return BASIS;
        try { return clamp(zonen(el).r * st.zoom, 2.5, BASIS); } catch (e) { return BASIS; }
      },
      set() { /* der Wert wird gemessen, nicht gesetzt */ },
    });
  } catch (e) { /* dann bleibt es beim festen Wert */ }

  function griffTreffer(el, wx, wy) {
    const z = zonen(el);
    const [lx, ly] = SS.toLocal(wx, wy, el.x, el.y, el.rot || 0);
    const hw = z.w / 2, hh = z.h / 2, r = z.r;
    if (Math.hypot(lx, ly + hh + 40 / st.zoom) < r) return { art: 'dreh', sx: 0, sy: 0 };
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      if (Math.hypot(lx - sx * hw, ly - sy * hh) < r) return { art: 'ecke', sx, sy };
    }
    const d = r * 0.95, innen = Math.max(r * 0.8, 1);
    if (Math.abs(ly + hh) < d && Math.abs(lx) < hw - innen) return { art: 'kante', sx: 0, sy: -1 };
    if (Math.abs(ly - hh) < d && Math.abs(lx) < hw - innen) return { art: 'kante', sx: 0, sy: 1 };
    if (Math.abs(lx + hw) < d && Math.abs(ly) < hh - innen) return { art: 'kante', sx: -1, sy: 0 };
    if (Math.abs(lx - hw) < d && Math.abs(ly) < hh - innen) return { art: 'kante', sx: 1, sy: 0 };
    return null;
  }

  /* ==================================================================
     2 · Größe lesen und setzen – je Elementart auf dem richtigen Weg
     ================================================================== */
  function groesse(el) {
    if (el.type === 'sticker' || el.type === 'emoji') {
      return SS.stickerGroesse ? SS.stickerGroesse(el) : SS.elSize(el);
    }
    if (typeof SS.rahmenGroesse === 'function') return SS.rahmenGroesse(el);
    return SS.elSize(el);
  }

  /* Wie teuer war das letzte genaue Einpassen? Teure Rahmen (Retro-Kamera:
     58 ms) werden beim Ziehen als Vorschau gestreckt und erst beim Loslassen
     genau eingepasst. Gemessen, nicht nach Rahmenliste entschieden. */
  const kosten = {};
  function teuer(el) {
    const k = kosten[(el.frame && el.frame.style) || 'none'];
    return k !== undefined && k > 14;
  }

  function setzeGroesse(el, w, h, genau) {
    w = clamp(w, 24, 6000);
    h = clamp(h, 24, 6000);
    if (el.type === 'sticker' || el.type === 'emoji') {
      if (SS.setzeStickerGroesse) SS.setzeStickerGroesse(el, w, h);
      else { el.s = h; el.scaleX = 1; el.scaleY = 1; }
      return;
    }
    if (el.type === 'video') {
      el.scaleX = 1; el.scaleY = 1;
      el.w = w; el.h = h;
      el._sollW = w; el._sollH = h; el._sollSX = 1; el._sollSY = 1;
      el._rahmenSig = null;
      if (el.radius) el.radius = Math.min(el.radius, Math.min(w, h) / 2);
      return;
    }
    /* Foto: die Karte wirklich in dieses Format bringen (Rand bleibt rundum
       gleich dick), nur bei teuren Rahmen während des Zugs als Vorschau. */
    if (typeof SS.passeRahmenAn !== 'function') {
      const r = SS.elSizeRaw(el);
      el.scaleX = clamp(w / Math.max(1, r.w), 0.05, 40);
      el.scaleY = clamp(h / Math.max(1, r.h), 0.05, 40);
      return;
    }
    if (genau || !teuer(el)) {
      const t0 = performance.now();
      SS.passeRahmenAn(el, w, h);
      const dt = performance.now() - t0;
      const key = (el.frame && el.frame.style) || 'none';
      kosten[key] = kosten[key] === undefined ? dt : kosten[key] * 0.6 + dt * 0.4;
    } else {
      const r = SS.elSizeRaw(el);
      el.scaleX = clamp(w / Math.max(1, r.w), 0.05, 40);
      el.scaleY = clamp(h / Math.max(1, r.h), 0.05, 40);
    }
    if (SS.invalidateEl) SS.invalidateEl(el);
  }

  /* ==================================================================
     3 · Fangen: Kanten legen sich an, was schon da ist
     ================================================================== */
  function zieleX(el) {
    const { W, H, slideW, n } = SS.canvasSize();
    const t = [0, W, W / 2];
    for (let i = 0; i < n; i++) { t.push(i * slideW, i * slideW + slideW / 2); }
    t.push(W);
    const ov = st.overlays || {};
    for (let i = 0; i < n; i++) {
      const a = i * slideW;
      if (ov.grid) for (let k = 1; k < 4; k++) t.push(a + slideW * k / 4);
      if (ov.thirds) { t.push(a + slideW / 3, a + slideW * 2 / 3); }
      if (ov.golden) { t.push(a + slideW * 0.382, a + slideW * 0.618); }
    }
    for (const e of st.elements) {
      if (e === el || e.hidden) continue;
      const b = SS.boundsOf([e]);
      if (b) t.push(b.x0, b.cx, b.x1);
    }
    return t;
  }
  function zieleY(el) {
    const { H, slideH } = SS.canvasSize();
    const t = [0, H, H / 2];
    const ov = st.overlays || {};
    if (ov.grid) for (let k = 1; k < 4; k++) t.push(H * k / 4);
    if (ov.thirds) { t.push(H / 3, H * 2 / 3); }
    if (ov.golden) { t.push(H * 0.382, H * 0.618); }
    if (slideH && slideH !== H) t.push(slideH);
    for (const e of st.elements) {
      if (e === el || e.hidden) continue;
      const b = SS.boundsOf([e]);
      if (b) t.push(b.y0, b.cy, b.y1);
    }
    return t;
  }
  function fang(wert, liste, tol) {
    let best = tol, treffer = null;
    for (const t of liste) {
      const d = Math.abs(t - wert);
      if (d < best) { best = d; treffer = t; }
    }
    return treffer;
  }

  /* ==================================================================
     4 · Der Zug
     ================================================================== */
  let zug = null;

  function weltPunkt(ev) {
    const r = canvas.getBoundingClientRect();
    return [((ev.clientX - r.left) - st.panX) / st.zoom, ((ev.clientY - r.top) - st.panY) / st.zoom];
  }

  function ankerVon(el, sx, sy, w, h) {
    const rad = SS.deg2rad(el.rot || 0), co = Math.cos(rad), si = Math.sin(rad);
    const dx = -sx * w / 2, dy = -sy * h / 2;
    return [el.x + dx * co - dy * si, el.y + dx * si + dy * co];
  }

  function starte(el, g, wx, wy) {
    const gr = groesse(el);
    const anker = ankerVon(el, g.sx, g.sy, gr.w, gr.h);
    zug = {
      el, g, w0: Math.max(2, gr.w), h0: Math.max(2, gr.h),
      anker, rot0: el.rot || 0,
      a0: Math.atan2(wy - el.y, wx - el.x),
      zielW: Math.max(2, gr.w), zielH: Math.max(2, gr.h),
      offen: false, raf: null,
    };
    SS._frei80Zieht = true;
  }

  function rechne(wx, wy) {
    const z = zug, el = z.el;
    if (z.g.art === 'dreh') {
      const a = Math.atan2(wy - el.y, wx - el.x);
      let rot = z.rot0 + (a - z.a0) * 180 / Math.PI;
      for (const t of [0, 90, 180, -90, -180]) if (Math.abs(rot - t) < 4) rot = t;
      el.rot = rot;
      return;
    }
    const rad = SS.deg2rad(el.rot || 0), co = Math.cos(rad), si = Math.sin(rad);
    const px = wx - z.anker[0], py = wy - z.anker[1];
    let du = px * co + py * si;          // längs der Elementbreite, vom Anker aus
    let dv = -px * si + py * co;         // längs der Elementhöhe

    const tol = 9 / Math.max(0.001, st.zoom);
    const gerade = Math.abs(((el.rot || 0) % 360 + 360) % 360) < 0.5;
    SS._snapLines = [];

    let neuW = z.w0, neuH = z.h0, eingerastet = null;

    if (z.g.sx) {
      if (gerade) {
        const kante = z.anker[0] + du;
        const t = fang(kante, zieleX(el), tol);
        if (t !== null) { du = t - z.anker[0]; SS._snapLines.push({ v: t }); eingerastet = 'x' + t; }
      }
      neuW = Math.max(24, Math.abs(du));
    }
    if (z.g.sy) {
      if (gerade) {
        const kante = z.anker[1] + dv;
        const t = fang(kante, zieleY(el), tol);
        if (t !== null) { dv = t - z.anker[1]; SS._snapLines.push({ h: t }); eingerastet = (eingerastet || '') + 'y' + t; }
      }
      neuH = Math.max(24, Math.abs(dv));
    }
    /* Ein kurzes Summen, sobald eine Kante einrastet – wie beim Verschieben. */
    if (eingerastet !== z.rast) { if (eingerastet && SS.buzz) SS.buzz(); z.rast = eingerastet; }

    /* „Verhältnis halten" ist die Ausnahme – dann zieht die zweite Seite mit. */
    if (SS.freiZiehen === false) {
      if (z.g.art === 'ecke') {
        const f = Math.max(neuW / z.w0, neuH / z.h0);
        neuW = z.w0 * f; neuH = z.h0 * f;
      } else if (z.g.sx) {
        neuH = z.h0 * neuW / z.w0;
      } else {
        neuW = z.w0 * neuH / z.h0;
      }
      SS._snapLines = [];
    }

    z.zielW = neuW; z.zielH = neuH;
  }

  /* Anwenden im Bildtakt – so bleibt auch ein teurer Rahmen bedienbar. */
  function anwenden(genau) {
    const z = zug;
    if (!z) return;
    const el = z.el;
    if (z.g.art !== 'dreh') {
      setzeGroesse(el, z.zielW, z.zielH, genau);
      /* Gegenkante festhalten: das Element wandert nicht unter dem Finger weg. */
      const gr = groesse(el);
      const neu = ankerVon(el, z.g.sx, z.g.sy, gr.w, gr.h);
      el.x += z.anker[0] - neu[0];
      el.y += z.anker[1] - neu[1];
    }
    if (SS.motionHint) SS.motionHint(200);
    SS.render();
  }

  function beenden() {
    if (!zug) return;
    const z = zug;
    if (z.raf) cancelAnimationFrame(z.raf);
    SS._frei80Zieht = false;
    if (z.offen) anwenden(true);            // beim Loslassen immer genau
    SS._snapLines = null;
    zug = null;
    if (SS.ui && SS.ui.showProps) SS.ui.showProps();
    SS.requestRender();
    if (z.offen) SS.pushHistory(z.g.art === 'dreh' ? 'Gedreht' : 'Größe geändert');
  }

  /* ==================================================================
     5 · Zeigerereignisse – Auffangphase auf window, also vor allem anderen
     ================================================================== */
  function darf(ev) {
    if (ev.button) return false;
    if (ev.target !== canvas) return false;
    if (SS.panMode || SS._spacePan || SS.lassoMode || SS.addMode || SS.pickMode) return false;
    if (SS.pfadEdit) return false;
    if (ev.shiftKey || ev.ctrlKey || ev.metaKey) return false;
    return true;
  }

  window.addEventListener('pointerdown', (ev) => {
    if (zug) {                       // zweiter Finger: den Zug beenden, Pinch überlassen
      beenden();
      return;
    }
    if (!darf(ev)) return;
    const el = einzel();
    if (!el) return;
    const [wx, wy] = weltPunkt(ev);
    const g = griffTreffer(el, wx, wy);
    if (g) {
      /* Text und Weichzeichner behält interact.js – seine Zonen sind größer
         als diese, treffen also ebenso. Nur die Mitte bleibt jetzt frei. */
      if (!ZIEHBAR[el.type]) return;
      ev.stopImmediatePropagation();
      /* Nur bei der Maus die Vorgabe abbestellen (Textauswahl). Auf iOS können
         Zeiger-Vorgaben am `pointerdown` die folgenden Ereignisse verschlucken –
         dort genügt der Zeigerfang. */
      if (ev.pointerType === 'mouse') ev.preventDefault();
      try { canvas.setPointerCapture(ev.pointerId); } catch (e) {}
      starte(el, g, wx, wy);
      return;
    }
    /* Kein Griff – interact.js soll auch keinen sehen, sonst verschiebt sich
       ein kleines Element bei kleinem Zoom nie. */
    stumm = true;
  }, true);

  /* Nach allen Diensten auf der Leinwand: den Wert wieder freigeben. */
  window.addEventListener('pointerdown', () => { stumm = false; }, false);

  window.addEventListener('pointermove', (ev) => {
    if (!zug) return;
    ev.stopImmediatePropagation();
    const [wx, wy] = weltPunkt(ev);
    rechne(wx, wy);
    zug.offen = true;
    if (!zug.raf) {
      zug.raf = requestAnimationFrame(() => {
        if (!zug) return;
        zug.raf = null;
        anwenden(false);
      });
    }
  }, true);

  function schluss(ev) {
    if (!zug) { stumm = false; return; }
    ev.stopImmediatePropagation();
    try { canvas.releasePointerCapture(ev.pointerId); } catch (e) {}
    beenden();
  }
  window.addEventListener('pointerup', schluss, true);
  window.addEventListener('pointercancel', schluss, true);

  /* Sicherheitsnetz: sollte ein Ereignis ausfallen, darf `stumm` nicht hängen –
     ein negativer Griffradius wäre beim Zeichnen ein Fehler. */
  window.addEventListener('blur', () => { stumm = false; });
  const origRender = SS.render;
  if (typeof origRender === 'function') {
    SS.render = function () { stumm = false; return origRender.apply(this, arguments); };
  }

  /* ==================================================================
     6 · Ein Wort in den Eigenschaften
     ================================================================== */
  const origProps = SS.ui && SS.ui.showProps;
  if (origProps) {
    SS.ui.showProps = function () {
      const r = origProps.apply(this, arguments);
      try {
        const el = ziel();
        const body = document.getElementById('propsBody');
        if (el && body && !body.querySelector('[data-frei80]')) {
          const reihe = document.createElement('div');
          reihe.className = 'chips';
          reihe.setAttribute('data-frei80', '1');
          const kn = document.createElement('button');
          const zeige = () => {
            const halten = SS.freiZiehen === false;
            kn.textContent = halten ? '🔗 Verhältnis halten' : '⛓️‍💥 Frei in Breite × Höhe';
            kn.classList.toggle('sel', halten);
          };
          kn.onclick = () => { SS.freiZiehen = (SS.freiZiehen === false); zeige(); };
          zeige();
          reihe.appendChild(kn);
          body.appendChild(reihe);
          const p = document.createElement('p');
          p.className = 'hint';
          p.textContent = 'Kanten und Ecken ziehen frei in Breite und Höhe – die '
            + 'gegenüberliegende Seite bleibt stehen und fängt an Nachbarn, Slidekanten '
            + 'und eingeschalteten Rasterlinien ein. Der Knopf darüber schaltet auf '
            + 'gleichmäßiges Vergrößern um.';
          body.appendChild(p);
        }
      } catch (e) {}
      return r;
    };
  }

  SS.FREI80 = { bereit: true, version: '8.0.0' };
})();
