/* Seamless Studio – dichte Szenen und Foto-Hintergrund (v7.5)
   ============================================================================
   Drei VOLLGEPACKTE Szenen auf Scotts Wunsch: so viele Platzhalter je Slide,
   dass vom Hintergrund kaum etwas zu sehen ist, dazu reichlich Retro-Sticker.
   Die neuen Objekt-Rahmen aus rahmen75.js (cd, browser, tv, kamera,
   filmhoch) kommen hier als Foto-Plätze zum Einsatz:

     sz-retrowand     Retro-Wand: Fernseher, CDs, Kameras, Browserfenster
                      und Filmstreifen dicht an dicht
     sz-collagetotal  Collage total: Scrapbook-Vollpackung auf Kraftpapier,
                      gerissene Ränder, Tape, Stempel – kaum Luft dazwischen
     sz-dumppastell   Fotodump Pastell: weiße Polaroids und Streifen dicht
                      gestapelt, Kirschen, Sonnengesicht, Blumen

   Außerdem:
   * Knopf „Hintergrund-Foto wählen …" im Szenen-Abschnitt – legt ein
     eigenes Foto als Leinwand-Hintergrund unter die fertige Szene
     (derselbe Weg wie Hintergrund → Eigene: bg.type 'image').
   * Eine Hülle um SS.ui.szeneVorlageAnwenden: hat Scott bereits ein
     FOTO als Hintergrund gesetzt, überschreibt das Anwenden einer Szene
     es nicht mehr – die Szene legt nur ihre Objekte darüber.
   ========================================================================= */

(function () {
  if (!SS.state || !SS.platzhalterNeu || !SS.SZENEN || !SS.ui
    || typeof SS.ui.szeneVorlageAnwenden !== 'function') return;
  const st = SS.state;

  /* ---------------- Baukasten (bewusst eigene Kopie, wie szenen74) ------- */
  function neuBau(k) {
    const b = { hinten: [], slots: [], vorne: [], H: k.H, sw: k.slideW, n: k.n, k };
    b.xs = (s, f) => Math.min(b.n - 1, s) * b.sw + b.sw * f;
    b.st = (z, kind, x, y, s, rot, color, op) =>
      b[z].push({ typ: 'st', kind, x, y, s, rot: rot || 0, color, op: op == null ? 1 : op });
    b.tx = (z, content, x, y, size, o) =>
      b[z].push(Object.assign({ typ: 'tx', content, x, y, size }, o || {}));
    b.slot = (x, y, h, ar, rot, frame) =>
      b.slots.push({ x, y, h, ar, rot: rot || 0, frame: frame || {} });
    return b;
  }
  function jeSlide(b, module) {
    for (let s = 0; s < b.n; s++) {
      const i = b.n < 2 ? 0 : Math.round(s * (module.length - 1) / (b.n - 1));
      module[i](s, b);
    }
  }
  function jeKante(b, kanten) {
    for (let e = 1; e < b.n; e++) {
      const i = Math.min(kanten.length - 1,
        Math.floor((e - 1) * kanten.length / Math.max(1, b.n - 1)));
      kanten[i](e, b);
    }
  }
  /* Viele Plätze auf einmal: Liste aus [f, y, h, ar, rot, rahmen] je Slide */
  function wurf(b, s, liste) {
    for (const [f, y, h, ar, rot, rahmen] of liste) {
      b.slot(b.xs(s, f), b.H * y, b.H * h, ar, rot, rahmen);
    }
  }

  const POL  = { style: 'polaroid',   border: 20 };
  const POLW = { style: 'polaroid-w', border: 20 };
  const POLB = { style: 'polaroid-b', border: 20 };
  const DUENN = { style: 'thin', border: 12 };
  const FILM = { style: 'film', border: 18 };
  const FILMH = { style: 'filmhoch', border: 18 };
  const RISS = { style: 'riss' };
  const CD = { style: 'cd' };
  const BROWSER = { style: 'browser', border: 12 };
  const TV = { style: 'tv', border: 20 };
  const KAMERA = { style: 'kamera', border: 18 };

  const SZENEN3 = [];

  /* ===== 1. Retro-Wand – die Objekt-Rahmen dicht an dicht ===== */
  SZENEN3.push({
    id: 'sz-retrowand', name: 'Retro-Wand', bg: 'sl-galeriewand',
    hint: 'Fernseher, CDs, Kameras, Browser und Filmstreifen – kaum Wand zu sehen',
    slides: 7, format: '1:1',
    bauen(k) {
      const b = neuBau(k), H = b.H;
      jeSlide(b, [
        (s) => {
          wurf(b, s, [
            [0.26, 0.26, 0.26, 1.05, -3, TV],
            [0.72, 0.22, 0.20, 1, 5, CD],
            [0.22, 0.68, 0.26, 0.75, -2, FILMH],
            [0.62, 0.62, 0.30, 0.80, 4, POL],
            [0.88, 0.80, 0.16, 1, -6, CD],
          ]);
          b.st('vorne', 'sz-kassette', b.xs(s, 0.88), H * 0.46, H * 0.11, 8, '#4a5568');
          b.st('vorne', 'sz-note', b.xs(s, 0.48), H * 0.10, H * 0.06, -8, '#4a4238');
          b.st('vorne', 'star', b.xs(s, 0.08), H * 0.48, H * 0.05, 10, '#d8a935');
          b.tx('vorne', 'RETRO', b.xs(s, 0.5), H * 0.945, H * 0.038,
            { font: 'Bebas Neue', color: '#6b5b4a', letterSpacing: 8 });
        },
        (s) => {
          wurf(b, s, [
            [0.28, 0.30, 0.34, 1, -2, KAMERA],
            [0.74, 0.28, 0.28, 1.25, 3, BROWSER],
            [0.24, 0.76, 0.20, 0.78, -4, FILM],
            [0.56, 0.72, 0.24, 0.80, 5, POLB],
            [0.88, 0.66, 0.18, 1, 8, CD],
          ]);
          b.st('vorne', 'sz-telefon', b.xs(s, 0.52), H * 0.09, H * 0.075, -12);
          b.st('vorne', 'sz-xxx', b.xs(s, 0.08), H * 0.12, H * 0.032, 5, '#6b5b4a');
        },
        (s) => {
          wurf(b, s, [
            [0.30, 0.24, 0.22, 1, -4, CD],
            [0.70, 0.30, 0.30, 1.05, 2, TV],
            [0.24, 0.62, 0.28, 0.80, 3, POLB],
            [0.60, 0.76, 0.24, 0.75, -3, FILMH],
            [0.90, 0.72, 0.18, 0.80, 7, DUENN],
          ]);
          b.st('hinten', 'sz-discokugel', b.xs(s, 0.90), H * 0.14, H * 0.16, 0);
          b.st('vorne', 'sz-player', b.xs(s, 0.32), H * 0.925, H * 0.36, -2, '#8a6b52');
        },
        (s) => {
          wurf(b, s, [
            [0.36, 0.30, 0.30, 1.25, -2, BROWSER],
            [0.80, 0.26, 0.26, 1, 4, KAMERA],
            [0.20, 0.74, 0.22, 0.78, -5, FILM],
            [0.52, 0.74, 0.24, 0.80, 3, POL],
            [0.84, 0.76, 0.20, 1, -4, CD],
          ]);
          b.st('vorne', 'lb-tape', b.xs(s, 0.36), H * 0.115, H * 0.07, -12, '#c9b89a', 0.9);
          b.st('vorne', 'star', b.xs(s, 0.10), H * 0.14, H * 0.045, -8, '#d8a935');
        },
        (s) => {
          wurf(b, s, [
            [0.26, 0.28, 0.30, 1.05, 3, TV],
            [0.70, 0.24, 0.22, 1, -3, CD],
            [0.30, 0.72, 0.26, 1.25, -2, BROWSER],
            [0.72, 0.68, 0.28, 0.80, 5, POLB],
          ]);
          b.st('vorne', 'sz-ipod', b.xs(s, 0.92), H * 0.42, H * 0.14, 8);
          b.st('vorne', 'sz-note', b.xs(s, 0.08), H * 0.60, H * 0.055, -6, '#4a4238');
          b.st('vorne', 'sz-barcode', b.xs(s, 0.50), H * 0.945, H * 0.055, -4);
        },
        (s) => {
          wurf(b, s, [
            [0.30, 0.26, 0.32, 1, -3, KAMERA],
            [0.74, 0.22, 0.24, 0.75, 2, FILMH],
            [0.22, 0.72, 0.20, 1, 5, CD],
            [0.56, 0.70, 0.28, 0.80, -4, POL],
            [0.88, 0.66, 0.20, 0.78, 6, DUENN],
          ]);
          b.st('vorne', 'sz-kassette', b.xs(s, 0.90), H * 0.14, H * 0.10, -8, '#8a5a5f');
          b.st('vorne', 'sz-telefon', b.xs(s, 0.08), H * 0.44, H * 0.07, 14);
        },
        (s) => {
          wurf(b, s, [
            [0.32, 0.28, 0.28, 1.25, -2, BROWSER],
            [0.76, 0.28, 0.28, 1.05, 3, TV],
            [0.26, 0.70, 0.26, 0.80, 4, POLB],
            [0.66, 0.74, 0.22, 1, -5, CD],
          ]);
          b.st('hinten', 'sz-vinyl', b.xs(s, 0.92), H * 0.62, H * 0.20, 0, '#c9634f');
          b.tx('vorne', 'bis bald ✦', b.xs(s, 0.50), H * 0.945, H * 0.042,
            { font: 'Caveat', color: '#6b5b4a' });
        },
      ]);
      jeKante(b, [
        (e) => SS._filmstreifenSlots(b, e * b.sw, H * 0.48, 3, H * 0.17, 0, true),
        (e) => b.st('vorne', 'star', e * b.sw, H * 0.50, H * 0.05, 8, '#d8a935'),
        (e) => SS._filmstreifenSlots(b, e * b.sw, H * 0.50, 3, H * 0.16, -5, false),
        (e) => b.st('vorne', 'sz-note', e * b.sw, H * 0.48, H * 0.055, 6, '#6b5b4a'),
      ]);
      return b;
    },
  });

  /* ===== 2. Collage total – Scrapbook-Vollpackung ===== */
  SZENEN3.push({
    id: 'sz-collagetotal', name: 'Collage total', bg: 'tx-kraft-0',
    hint: 'Sechs Plätze je Slide, gerissen, geklebt, gestempelt – kaum Papier zu sehen',
    slides: 7, format: '1:1',
    bauen(k) {
      const b = neuBau(k), H = b.H;
      const deko = (s, i) => {
        b.st('vorne', ['lb-tape', 'washi1', 'washi2', 'washi3'][i % 4],
          b.xs(s, [0.24, 0.68, 0.44, 0.86][i % 4]), H * [0.16, 0.10, 0.50, 0.86][i % 4],
          H * 0.07, [-14, 10, -6, 12][i % 4], ['#c9b89a', '#a8bba4', '#c9a2a2', '#b9a27a'][i % 4], 0.9);
        b.st('vorne', ['sy-funken-03', 'hd-herz', 'star', 'hd-kringel'][i % 4],
          b.xs(s, [0.90, 0.10, 0.52, 0.08][i % 4]), H * [0.30, 0.76, 0.94, 0.28][i % 4],
          H * 0.05, [0, -8, 10, 0][i % 4], ['#a8895c', '#b0705f', '#d8a935', '#5a4a38'][i % 4]);
      };
      const M = (a) => (s) => { wurf(b, s, a); deko(s, s % 4); };
      jeSlide(b, [
        M([
          [0.22, 0.22, 0.26, 0.80, -6, RISS], [0.64, 0.18, 0.24, 0.78, 4, POLW],
          [0.90, 0.30, 0.20, 0.80, 9, DUENN], [0.30, 0.60, 0.28, 0.80, 5, { style: 'stamp', border: 16 }],
          [0.70, 0.62, 0.30, 0.78, -4, RISS], [0.42, 0.88, 0.18, 1.3, -2, DUENN],
        ]),
        M([
          [0.26, 0.24, 0.28, 0.78, 5, POLW], [0.68, 0.22, 0.26, 0.80, -5, RISS],
          [0.20, 0.66, 0.26, 0.80, -3, { style: 'washi' }], [0.58, 0.68, 0.28, 0.78, 6, POLW],
          [0.90, 0.62, 0.20, 0.80, -8, { style: 'stamp', border: 16 }], [0.88, 0.14, 0.16, 0.80, 6, DUENN],
        ]),
        M([
          [0.24, 0.20, 0.24, 0.80, -4, { style: 'zeitung', border: 18 }], [0.62, 0.24, 0.28, 0.78, 3, RISS],
          [0.30, 0.58, 0.26, 0.80, 6, POLW], [0.72, 0.66, 0.28, 0.80, -6, { style: 'torn' }],
          [0.10, 0.82, 0.18, 0.80, -8, DUENN], [0.50, 0.90, 0.16, 1.3, 2, DUENN],
        ]),
        M([
          [0.28, 0.24, 0.30, 0.78, -5, RISS], [0.72, 0.20, 0.24, 0.80, 6, POLW],
          [0.22, 0.68, 0.24, 0.78, 4, { style: 'stamp', border: 16 }], [0.58, 0.66, 0.30, 0.80, -3, POLW],
          [0.90, 0.58, 0.18, 0.80, 8, RISS], [0.88, 0.88, 0.14, 0.80, -6, DUENN],
        ]),
        M([
          [0.24, 0.22, 0.26, 0.80, 4, POLW], [0.64, 0.18, 0.26, 0.78, -4, { style: 'washi' }],
          [0.28, 0.62, 0.30, 0.80, -5, RISS], [0.68, 0.66, 0.26, 0.78, 5, { style: 'zeitung', border: 18 }],
          [0.92, 0.34, 0.18, 0.80, -8, DUENN], [0.48, 0.90, 0.16, 1.3, -2, DUENN],
        ]),
        M([
          [0.26, 0.20, 0.28, 0.78, -3, { style: 'torn' }], [0.68, 0.24, 0.28, 0.80, 4, RISS],
          [0.20, 0.64, 0.24, 0.80, 6, POLW], [0.58, 0.70, 0.28, 0.78, -5, POLW],
          [0.90, 0.66, 0.18, 0.80, 7, { style: 'stamp', border: 16 }], [0.90, 0.16, 0.16, 0.80, -5, DUENN],
        ]),
        M([
          [0.24, 0.24, 0.28, 0.80, 5, RISS], [0.66, 0.20, 0.26, 0.78, -4, POLW],
          [0.30, 0.64, 0.28, 0.78, -3, POLW], [0.70, 0.68, 0.26, 0.80, 6, { style: 'washi' }],
          [0.92, 0.44, 0.16, 0.80, 8, DUENN],
        ]),
      ]);
      jeKante(b, [
        (e) => b.slot(e * b.sw, H * 0.44, H * 0.26, 0.80, 3, RISS),
        (e) => b.st('vorne', 'washi1', e * b.sw, H * 0.24, H * 0.10, -6, '#b9a27a', 0.9),
        (e) => b.slot(e * b.sw, H * 0.50, H * 0.24, 0.78, -4, POLW),
        (e) => b.st('vorne', 'hd-zickzack', e * b.sw, H * 0.88, H * 0.07, 0, '#6b5b4a'),
        (e) => b.slot(e * b.sw, H * 0.40, H * 0.25, 0.80, 5, { style: 'stamp', border: 16 }),
        (e) => b.st('vorne', 'washi3', e * b.sw, H * 0.70, H * 0.10, 8, '#c9a2a2', 0.9),
      ]);
      b.tx('hinten', 'ERINNERUNGEN', b.xs(0, 0.5), H * 0.06, H * 0.04,
        { font: 'Special Elite', color: '#3d362e', letterSpacing: 3 });
      return b;
    },
  });

  /* ===== 3. Fotodump Pastell – weiße Vollpackung ===== */
  SZENEN3.push({
    id: 'sz-dumppastell', name: 'Fotodump Pastell', bg: 'sl-pastellhimmel',
    hint: 'Weiße Polaroids und Streifen dicht gestapelt, Kirschen und Sonnenschein',
    slides: 7, format: '1:1',
    bauen(k) {
      const b = neuBau(k), H = b.H;
      const rosa = '#e58fa2';
      const deko = (s, i) => {
        b.st('vorne', ['sz-kirschen', 'bl-kirschbluete-rosa', 'butterfly', 'sz-klee'][i % 4],
          b.xs(s, [0.90, 0.08, 0.50, 0.10][i % 4]), H * [0.20, 0.30, 0.08, 0.88][i % 4],
          H * 0.07, [6, -8, 12, -6][i % 4], [undefined, undefined, '#c98da2', undefined][i % 4]);
        b.st('vorne', ['heart-fill', 'sy-funken-05', 'bl-margerite-gelb', 'cloud'][(i + 1) % 4],
          b.xs(s, [0.10, 0.92, 0.88, 0.52][(i + 1) % 4]), H * [0.14, 0.50, 0.90, 0.06][(i + 1) % 4],
          H * 0.05, 0, [rosa, '#d8a935', undefined, '#ffffff'][(i + 1) % 4]);
      };
      const M = (a) => (s) => { wurf(b, s, a); deko(s, s % 4); };
      jeSlide(b, [
        M([
          [0.24, 0.24, 0.28, 0.78, -5, POLW], [0.66, 0.20, 0.26, 0.80, 4, POLW],
          [0.28, 0.66, 0.28, 0.80, 3, POLW], [0.70, 0.68, 0.30, 0.78, -4, POLW],
          [0.92, 0.40, 0.18, 0.75, 8, FILMH],
        ]),
        M([
          [0.26, 0.22, 0.26, 0.75, -2, FILMH], [0.66, 0.24, 0.30, 0.80, 5, POLW],
          [0.22, 0.64, 0.26, 0.80, -5, POLW], [0.60, 0.70, 0.26, 0.78, 3, DUENN],
          [0.90, 0.70, 0.18, 0.80, -7, POLW], [0.90, 0.14, 0.14, 1.3, 5, DUENN],
        ]),
        M([
          [0.5, 0.22, 0.20, 1.9, 0, DUENN], [0.5, 0.47, 0.20, 1.9, 0, DUENN],
          [0.5, 0.72, 0.20, 1.9, 0, DUENN], [0.10, 0.86, 0.16, 0.80, -6, POLW],
          [0.90, 0.88, 0.15, 0.80, 6, POLW],
        ]),
        M([
          [0.24, 0.26, 0.30, 0.80, 4, POLW], [0.68, 0.22, 0.26, 0.78, -5, POLW],
          [0.30, 0.70, 0.26, 0.80, -3, DUENN], [0.68, 0.68, 0.28, 0.80, 5, POLW],
          [0.92, 0.46, 0.16, 0.75, -6, FILMH],
        ]),
        M([
          [0.26, 0.20, 0.26, 0.80, -4, POLW], [0.64, 0.26, 0.30, 0.78, 3, POLW],
          [0.22, 0.66, 0.28, 0.78, 5, POLW], [0.62, 0.72, 0.24, 0.80, -5, DUENN],
          [0.90, 0.16, 0.16, 0.80, 7, POLW], [0.92, 0.78, 0.16, 0.75, -4, FILMH],
        ]),
        M([
          [0.28, 0.24, 0.28, 0.75, -2, FILMH], [0.70, 0.20, 0.26, 0.80, 5, POLW],
          [0.26, 0.68, 0.28, 0.80, 4, POLW], [0.66, 0.70, 0.28, 0.78, -3, POLW],
          [0.92, 0.44, 0.16, 0.80, 8, DUENN],
        ]),
        M([
          [0.24, 0.24, 0.28, 0.80, -4, POLW], [0.64, 0.20, 0.26, 0.78, 4, POLW],
          [0.28, 0.66, 0.26, 0.80, 3, DUENN], [0.68, 0.70, 0.30, 0.80, -5, POLW],
        ]),
      ]);
      jeKante(b, [
        (e) => b.slot(e * b.sw, H * 0.46, H * 0.26, 0.80, -3, POLW),
        (e) => b.st('vorne', 'sz-kirschen', e * b.sw, H * 0.14, H * 0.08, 6),
        (e) => b.slot(e * b.sw, H * 0.50, H * 0.24, 0.78, 4, POLW),
        (e) => b.st('vorne', 'bl-kirschbluete-rosa', e * b.sw, H * 0.88, H * 0.08, -8),
        (e) => b.slot(e * b.sw, H * 0.42, H * 0.25, 0.80, -5, POLW),
        (e) => b.st('hinten', 'sz-sonne', e * b.sw, H * 0.10, H * 0.10, 0),
      ]);
      b.tx('vorne', 'photo dump ♡', b.xs(0, 0.5), H * 0.945, H * 0.05,
        { font: 'Caveat', color: rosa });
      return b;
    },
  });

  /* ---------------- In Katalog und Panel hängen -------------------------- */
  SZENEN3.forEach(s => SS.SZENEN.push(s));
  if (SS.SZENEN7) {
    SS.SZENEN7.anzahl = SS.SZENEN.length;
    SS.SZENEN7.ids = SS.SZENEN.map(s => s.id);
  }

  (function () {
    const raster = document.getElementById('szenenGrid');
    if (!raster) return;
    for (const S of SZENEN3) {
      const sw = document.createElement('button');
      sw.className = 'swatch';
      const cv = document.createElement('canvas');
      cv.width = 135; cv.height = 168;
      const c = cv.getContext('2d');
      const bg = SS.BG_LIB && SS.BG_LIB.find(x => x.id === S.bg);
      if (bg && bg.paint) { try { bg.paint(c, 135, 168); } catch (e) { c.fillStyle = '#ddd'; c.fillRect(0, 0, 135, 168); } }
      try {
        const H0 = S.format === '4:5' ? 1350 : 1080;
        const kMini = { W: (S.slides || 7) * 1080, H: H0, slideW: 1080, n: S.slides || 7 };
        const bb = S.bauen(kMini);
        const sicht = 1.7 * 1080;
        for (const slot of bb.slots) {
          if (slot.x > sicht) continue;
          const x = slot.x / sicht * 135;
          const y = slot.y / H0 * 150;
          const hh = slot.h / H0 * 150;
          const ww = hh * slot.ar;
          c.save();
          c.translate(x, y);
          c.rotate((slot.rot || 0) * Math.PI / 180);
          c.fillStyle = 'rgba(255,255,255,.92)';
          c.fillRect(-ww / 2 - 2, -hh / 2 - 2, ww + 4, hh + 4);
          c.fillStyle = '#b9ada0';
          c.fillRect(-ww / 2, -hh / 2, ww, hh);
          c.restore();
        }
      } catch (e) {}
      const lb = document.createElement('label');
      lb.textContent = S.name;
      sw.appendChild(cv); sw.appendChild(lb);
      sw.title = S.hint;
      sw.onclick = () => SS.ui.szeneVorlageAnwenden(S.id);
      raster.appendChild(sw);
    }
  })();

  /* ================= Eigenes Foto als Szenen-Hintergrund ================= */
  /* 1) Knopf im Szenen-Abschnitt: Foto wählen → bg.type 'image' (derselbe
        Weg wie Hintergrund → Eigene, mit Weichzeichnen-/Abdunkeln-Reglern
        dort weiter einstellbar). */
  (function () {
    const raster = document.getElementById('szenenGrid');
    if (!raster || !raster.parentElement) return;
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*'; inp.style.display = 'none';
    document.body.appendChild(inp);
    const knopf = document.createElement('button');
    knopf.className = 'wide';
    knopf.id = 'szBgFoto';
    knopf.textContent = 'Hintergrund-Foto wählen …';
    /* hinter den „Fotos für die Plätze wählen"-Knopf hängen */
    let anker = raster.nextSibling;
    while (anker && !(anker.tagName === 'BUTTON')) anker = anker.nextSibling;
    raster.parentElement.insertBefore(knopf, anker ? anker.nextSibling : raster.nextSibling);
    knopf.onclick = () => inp.click();
    inp.addEventListener('change', async (e) => {
      const f = e.target.files[0];
      e.target.value = '';
      if (!f) return;
      try {
        const rec = await SS.loadImageFile(f, 3200);
        SS.images.__bg = rec;
        st.bg = { type: 'image', blur: 0, darken: 12, customURL: rec.dataURL, custom: true };
        SS.bgCacheInvalidate && SS.bgCacheInvalidate();
        SS.pushHistory('Hintergrund-Foto');
        SS.requestRender && SS.requestRender();
        SS.toast('Foto liegt als Hintergrund unter der Szene – Weichzeichnen/Abdunkeln: Hintergrund → Eigene', 4600, 'ok');
      } catch (err) { SS.toast('Das Foto konnte nicht geladen werden', 2600, 'err'); }
    });
  })();

  /* 2) Ein bereits gesetztes FOTO als Hintergrund überlebt das Anwenden
        jeder Szene – die Hülle stellt es nach dem Original wieder her. */
  const origAnwenden = SS.ui.szeneVorlageAnwenden;
  SS.ui.szeneVorlageAnwenden = async function (id) {
    const vorher = st.bg && st.bg.type === 'image'
      ? JSON.parse(JSON.stringify(st.bg)) : null;
    const erg = await origAnwenden.apply(this, arguments);
    if (vorher) {
      st.bg = vorher;
      SS.bgCacheInvalidate && SS.bgCacheInvalidate();
      SS.requestRender && SS.requestRender();
    }
    return erg;
  };

  SS.SZENEN75 = { bereit: true, szenen: SZENEN3.length };
})();
