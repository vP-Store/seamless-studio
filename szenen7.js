/* Seamless Studio – Szenen-Vorlagen „Feed 1:1" (v7.3)
   ============================================================================
   Zehn durchkomponierte Szenen nach dem Vorbild der verkauften Instagram-
   Feed-Templates: EINE Geschichte über alle Slides – Hintergrundlandschaft,
   Alltagsobjekte (TV, Spiralblock, Filmstreifen, Fenster, Wäscheleine …)
   und darin feste FOTO-PLATZHALTER (platzhalter7.js). Elemente überqueren
   absichtlich die Schnittkanten; genau daraus entsteht beim Wischen der
   „es geht weiter"-Sog.

   Jede Szene ist auf 7 Slides im Format 1:1 komponiert, passt sich aber
   2–20 Slides an: die sieben Slide-Bausteine werden gleichmäßig auf die
   gewählte Slidezahl verteilt (bei weniger Slides fallen mittlere weg, bei
   mehr wiederholen sich welche), die Kanten-Bausteine hängen an den echten
   Schnittkanten und bleiben deshalb immer Kanten-Überquerer.

   Anwenden ersetzt Hintergrund, Deko und Texte (wie SS.szeneAnwenden);
   vorhandene Fotos wandern der Reihe nach in die Slots, fehlende Slots
   werden zu leeren Platzhaltern. Antippen → Foto einlegen. Danach lässt
   sich alles frei verschieben – es sind ganz normale Elemente.
   ========================================================================= */

(function () {
  if (!SS.state || !SS.platzhalterNeu || !SS.ui) return;
  const st = SS.state;

  /* ---------------------------------------------------------------- Baukasten */
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

  /* Ein Filmstreifen aus ECHTEN Foto-Slots: `anzahl` Film-Rahmen dicht an
     dicht entlang einer Achse, wahlweise waagerecht oder senkrecht. So ist
     der Streifen, der die Schnittkante überquert, kein Deko-Sticker mit
     leeren Fenstern, sondern nimmt selbst Fotos auf. */
  function filmstreifenSlots(b, cx, cy, anzahl, h, rotGrad, vertikal) {
    const ar = 0.72;
    const rad = (rotGrad || 0) * Math.PI / 180;
    const schritt = vertikal ? (h + 46) : (h * ar + 46);
    const ax = vertikal ? -Math.sin(rad) : Math.cos(rad);
    const ay = vertikal ? Math.cos(rad) : Math.sin(rad);
    for (let i = 0; i < anzahl; i++) {
      const t = i - (anzahl - 1) / 2;
      b.slot(cx + ax * schritt * t, cy + ay * schritt * t, h, ar, rotGrad || 0,
        { style: 'film', border: 20 });
    }
  }
  SS._filmstreifenSlots = filmstreifenSlots;

  /* Rahmen-Kurzformen */
  const POL  = { style: 'polaroid',   border: 22 };
  const POLW = { style: 'polaroid-w', border: 22 };
  const POLB = { style: 'polaroid-b', border: 22 };
  const DUENN = { style: 'thin', border: 14 };
  const FILM = { style: 'film', border: 20 };
  const RUND = (r) => ({ style: 'rounded', radius: r == null ? 14 : r, keyline: false, shadow: 30 });

  /* ================================================================ Szenen */
  const SZENEN = [];

  /* ===== 1. Filmtag – exakt nach dem Vorbild ===== */
  SZENEN.push({
    id: 'sz-filmtag', name: 'Filmtag', bg: 'sl-filmtag',
    hint: 'Wolkenband und Hügel, TV, Spiralblock, Filmstreifen über die Kanten – das Vorbild',
    slides: 7, format: '1:1',
    bauen(k) {
      const b = neuBau(k), H = b.H;
      jeSlide(b, [
        (s) => {   /* Spiralblock mit zwei Bildern */
          b.st('hinten', 'sz-spiralblock', b.xs(s, 0.50), H * 0.58, H * 0.60, -2);
          b.slot(b.xs(s, 0.335), H * 0.555, H * 0.315, 0.78, -6, POLW);
          b.slot(b.xs(s, 0.645), H * 0.585, H * 0.295, 0.78, 5, POL);
          b.st('vorne', 'lb-tape', b.xs(s, 0.335), H * 0.385, H * 0.085, -16, '#c9b89a', 0.9);
          b.tx('hinten', 'ein schöner Tag', b.xs(s, 0.50), H * 0.135, H * 0.052,
            { font: 'Caveat', color: '#41504b' });
          b.st('vorne', 'sz-xxx', b.xs(s, 0.84), H * 0.26, H * 0.038, -6, '#3c4a44');
        },
        (s) => {   /* Filmspalte und Polaroid */
          b.slot(b.xs(s, 0.29), H * 0.345, H * 0.29, 0.75, -3, FILM);
          b.slot(b.xs(s, 0.31), H * 0.665, H * 0.29, 0.75, -3, FILM);
          b.slot(b.xs(s, 0.72), H * 0.545, H * 0.345, 0.80, 6, POLW);
          b.st('hinten', 're-kamera', b.xs(s, 0.75), H * 0.185, H * 0.10, 8, '#4a4540');
          b.st('hinten', 'sz-vogel', b.xs(s, 0.48), H * 0.10, H * 0.05, 4, '#54604f');
        },
        (s) => {   /* Browser-Fenster und Polaroid */
          const bs = H * 0.50;
          b.st('hinten', 'sz-browser', b.xs(s, 0.44), H * 0.40, bs, -2);
          b.slot(b.xs(s, 0.44), H * 0.40 + bs * 0.075, bs * 0.74, 1.55, -2, RUND(8));
          b.slot(b.xs(s, 0.78), H * 0.76, H * 0.29, 0.80, -7, POL);
          b.st('vorne', 'sz-katze', b.xs(s, 0.13), H * 0.665, H * 0.15, 0, '#2e2b28');
        },
        (s) => {   /* Filmstreifen-Mitte */
          b.slot(b.xs(s, 0.50), H * 0.315, H * 0.295, 0.74, 2, FILM);
          b.slot(b.xs(s, 0.50), H * 0.645, H * 0.295, 0.74, 2, FILM);
          b.st('hinten', 'hi-sonne', b.xs(s, 0.15), H * 0.13, H * 0.09, 0, '#e8c76a');
          b.st('vorne', 'sz-barcode', b.xs(s, 0.82), H * 0.88, H * 0.075, -5);
        },
        (s) => {   /* Retro-TV */
          const ts = H * 0.55;
          b.st('hinten', 'sz-tv', b.xs(s, 0.42), H * 0.56, ts, 0, '#a8865f');
          b.slot(b.xs(s, 0.42) - ts * 0.15, H * 0.56 + ts * 0.06, ts * 0.47, 1.28, 0, RUND(10));
          b.slot(b.xs(s, 0.80), H * 0.27, H * 0.25, 0.80, 8, POLW);
          b.st('vorne', 'sz-xxx', b.xs(s, 0.13), H * 0.20, H * 0.036, 4, '#3c4a44');
        },
        (s) => {   /* Polaroid-Paar und Filmklappe */
          b.slot(b.xs(s, 0.36), H * 0.42, H * 0.33, 0.78, -8, POLW);
          b.slot(b.xs(s, 0.63), H * 0.62, H * 0.31, 0.78, 4, POL);
          b.st('vorne', 'sz-klappe', b.xs(s, 0.83), H * 0.77, H * 0.16, -10);
          b.st('hinten', 'bl-margerite-weiss', b.xs(s, 0.12), H * 0.80, H * 0.09, -8);
        },
        (s) => {   /* CD und Abschluss */
          b.st('hinten', 'sz-cd', b.xs(s, 0.28), H * 0.38, H * 0.32, 0);
          b.slot(b.xs(s, 0.28), H * 0.38, H * 0.19, 1, 0, { style: 'circle', shadow: 25 });
          b.slot(b.xs(s, 0.68), H * 0.585, H * 0.34, 0.80, 5, POLW);
          b.tx('vorne', 'bis bald ♡', b.xs(s, 0.68), H * 0.87, H * 0.045,
            { font: 'Caveat', color: '#41504b' });
        },
      ]);
      jeKante(b, [
        /* Filmstreifen über der Kante – aus echten Foto-Slots */
        (e) => filmstreifenSlots(b, e * b.sw, H * 0.80, 3, H * 0.20, -8, false),
        (e) => {
          b.st('hinten', 'sz-vogel', e * b.sw - H * 0.05, H * 0.16, H * 0.05, -4, '#54604f');
          b.st('hinten', 'sz-vogel', e * b.sw + H * 0.06, H * 0.12, H * 0.04, 5, '#54604f');
        },
        (e) => filmstreifenSlots(b, e * b.sw, H * 0.225, 3, H * 0.185, 6, false),
        (e) => b.st('hinten', 'cloud', e * b.sw, H * 0.13, H * 0.10, 0, '#ffffff', 0.9),
        (e) => filmstreifenSlots(b, e * b.sw, H * 0.78, 3, H * 0.19, 5, false),
        (e) => b.st('hinten', 'sz-vogel', e * b.sw, H * 0.15, H * 0.05, 0, '#54604f'),
      ]);
      return b;
    },
  });

  /* ===== 2. Wäscheleine ===== */
  SZENEN.push({
    id: 'sz-waescheleine', name: 'Wäscheleine', bg: 'sl-wiese',
    hint: 'Eine Leine über alle Slides, die Fotos hängen an Klammern',
    slides: 7, format: '1:1',
    bauen(k) {
      const b = neuBau(k), H = b.H;
      const leineS = b.sw * 1.02;
      const klammer = (x, y) => b.st('vorne', 'clip', x, y, H * 0.055, 3, '#b08d5a');
      for (let s = 0; s < b.n; s++) {
        b.st('hinten', 'sz-leine', b.xs(s, 0.5), H * 0.24, leineS, 0, '#7a6a55');
      }
      jeSlide(b, [
        (s) => {
          b.tx('hinten', 'schöne Tage', b.xs(s, 0.50), H * 0.10, H * 0.055,
            { font: 'Caveat', color: '#4a5a43' });
          b.slot(b.xs(s, 0.35), H * 0.455, H * 0.315, 0.78, -4, POLW);
          klammer(b.xs(s, 0.35), H * 0.275);
          b.st('vorne', 'bl-kirschbluete-rosa', b.xs(s, 0.80), H * 0.87, H * 0.09, -8);
        },
        (s) => {
          b.slot(b.xs(s, 0.28), H * 0.47, H * 0.30, 0.78, 3, POLW);
          klammer(b.xs(s, 0.28), H * 0.295);
          b.slot(b.xs(s, 0.70), H * 0.44, H * 0.28, 0.78, -3, POL);
          klammer(b.xs(s, 0.70), H * 0.28);
          b.st('hinten', 'sz-vogel', b.xs(s, 0.50), H * 0.115, H * 0.05, -3, '#5d5348');
        },
        (s) => {
          b.slot(b.xs(s, 0.50), H * 0.48, H * 0.36, 0.80, 2, POLW);
          klammer(b.xs(s, 0.50), H * 0.275);
          b.st('vorne', 'butterfly', b.xs(s, 0.80), H * 0.35, H * 0.07, 12, '#c98da2');
          b.st('vorne', 'bl-margerite-weiss', b.xs(s, 0.14), H * 0.88, H * 0.10, 6);
        },
        (s) => {
          b.slot(b.xs(s, 0.32), H * 0.44, H * 0.29, 0.78, -5, POL);
          klammer(b.xs(s, 0.32), H * 0.27);
          b.slot(b.xs(s, 0.68), H * 0.475, H * 0.31, 0.78, 4, POLW);
          klammer(b.xs(s, 0.68), H * 0.295);
        },
        (s) => {
          b.slot(b.xs(s, 0.45), H * 0.46, H * 0.33, 0.80, -2, POLW);
          klammer(b.xs(s, 0.45), H * 0.27);
          b.st('hinten', 'hi-sonne', b.xs(s, 0.84), H * 0.14, H * 0.10, 0, '#e8c76a');
        },
        (s) => {
          b.slot(b.xs(s, 0.30), H * 0.465, H * 0.30, 0.78, 4, POLW);
          klammer(b.xs(s, 0.30), H * 0.29);
          b.slot(b.xs(s, 0.72), H * 0.44, H * 0.28, 0.78, -4, POL);
          klammer(b.xs(s, 0.72), H * 0.275);
          b.st('vorne', 'bl-lavendel-lila', b.xs(s, 0.90), H * 0.86, H * 0.10, 8);
        },
        (s) => {
          b.slot(b.xs(s, 0.48), H * 0.47, H * 0.34, 0.80, 3, POLW);
          klammer(b.xs(s, 0.48), H * 0.28);
          b.tx('vorne', '♡', b.xs(s, 0.80), H * 0.32, H * 0.05,
            { font: 'Poppins', color: '#b0705f' });
        },
      ]);
      jeKante(b, [
        (e) => b.st('hinten', 'sz-vogel', e * b.sw, H * 0.13, H * 0.05, 3, '#5d5348'),
        (e) => b.st('vorne', 'butterfly', e * b.sw, H * 0.33, H * 0.06, -10, '#c9a15f'),
        (e) => {
          b.st('hinten', 'sz-vogel', e * b.sw - H * 0.04, H * 0.17, H * 0.045, -5, '#5d5348');
          b.st('hinten', 'sz-vogel', e * b.sw + H * 0.05, H * 0.12, H * 0.05, 4, '#5d5348');
        },
        (e) => b.st('hinten', 'cloud', e * b.sw, H * 0.11, H * 0.08, 0, '#ffffff', 0.85),
        (e) => b.st('vorne', 'bl-margerite-gelb', e * b.sw, H * 0.885, H * 0.09, -5),
        (e) => b.st('hinten', 'sz-vogel', e * b.sw, H * 0.14, H * 0.05, 0, '#5d5348'),
      ]);
      return b;
    },
  });

  /* ===== 3. Zugfenster ===== */
  SZENEN.push({
    id: 'sz-zugfenster', name: 'Zugfenster', bg: 'sl-abteil',
    hint: 'Jede Slide ein Abteilfenster, dahinter zieht die Landschaft vorbei',
    slides: 7, format: '1:1',
    bauen(k) {
      const b = neuBau(k), H = b.H;
      jeSlide(b, [
        (s) => fenster(s, true, false),
        (s) => fenster(s, false, true),
        (s) => fenster(s, false, false),
        (s) => fenster(s, true, false),
        (s) => fenster(s, false, true),
        (s) => fenster(s, true, false),
        (s) => fenster(s, false, false),
      ]);
      function fenster(s, koffer, tasse) {
        const fs = H * 0.60;
        b.st('hinten', 'sz-fenster', b.xs(s, 0.5), H * 0.445, fs, 0, '#8e9498');
        b.slot(b.xs(s, 0.5), H * 0.445 - fs * 0.02, fs * 0.72, 0.84, 0, RUND(20));
        if (koffer) b.st('vorne', 're-koffer', b.xs(s, 0.24), H * 0.115, H * 0.085, -3, '#8a6f52');
        if (tasse) b.st('vorne', 'ca-tasse', b.xs(s, 0.80), H * 0.875, H * 0.085, 4, '#7a6a55');
        if (s === 0) {
          b.tx('vorne', 'unterwegs', b.xs(s, 0.5), H * 0.885, H * 0.045,
            { font: 'Italiana', color: '#5a544a', letterSpacing: 6 });
        }
      }
      jeKante(b, [
        (e) => b.st('vorne', 're-ticket', e * b.sw, H * 0.88, H * 0.08, -8, '#c9a15f'),
        (e) => b.st('vorne', 'hi-streu', e * b.sw, H * 0.10, H * 0.05, 0, '#a8a094'),
        (e) => b.st('vorne', 're-karte', e * b.sw, H * 0.885, H * 0.09, 6, '#8a7a63'),
        (e) => b.st('vorne', 'hi-streu', e * b.sw, H * 0.10, H * 0.05, 0, '#a8a094'),
        (e) => b.st('vorne', 're-kamera', e * b.sw, H * 0.88, H * 0.085, -5, '#5d5348'),
        (e) => b.st('vorne', 'hi-streu', e * b.sw, H * 0.10, H * 0.05, 0, '#a8a094'),
      ]);
      return b;
    },
  });

  /* ===== 4. Schreibtisch von oben ===== */
  SZENEN.push({
    id: 'sz-schreibtisch', name: 'Schreibtisch', bg: 'sl-holztisch',
    hint: 'Flatlay auf Holz: verstreute Bilder, Washi-Tape über die Kanten',
    slides: 7, format: '1:1',
    bauen(k) {
      const b = neuBau(k), H = b.H;
      jeSlide(b, [
        (s) => {
          b.st('hinten', 'ra-notiz', b.xs(s, 0.76), H * 0.24, H * 0.19, 5, '#f6efdd');
          b.tx('hinten', 'unsere\nWoche', b.xs(s, 0.76), H * 0.21, H * 0.045,
            { font: 'Caveat', color: '#5a4a38', lineHeight: 1.15 });
          b.slot(b.xs(s, 0.34), H * 0.50, H * 0.36, 0.78, -7, POLW);
          b.st('vorne', 'lb-tape', b.xs(s, 0.34), H * 0.305, H * 0.08, -22, '#c9b89a', 0.88);
          b.st('vorne', 'bo2-eukalyptus', b.xs(s, 0.13), H * 0.82, H * 0.16, -30, '#8fa88c');
        },
        (s) => {
          b.slot(b.xs(s, 0.30), H * 0.34, H * 0.30, 0.80, 4, DUENN);
          b.slot(b.xs(s, 0.62), H * 0.66, H * 0.33, 0.78, -5, POLW);
          b.st('vorne', 'lb-tape', b.xs(s, 0.62), H * 0.48, H * 0.075, 14, '#a8bba4', 0.85);
          b.st('vorne', 'ca-tasse', b.xs(s, 0.85), H * 0.20, H * 0.11, 6, '#6a5a48');
        },
        (s) => {
          b.slot(b.xs(s, 0.48), H * 0.42, H * 0.37, 0.80, 3, POL);
          b.st('vorne', 'clip', b.xs(s, 0.48) - H * 0.13, H * 0.245, H * 0.06, -14, '#b08d5a');
          b.st('vorne', 'sz-barcode', b.xs(s, 0.80), H * 0.82, H * 0.075, 8);
          b.st('hinten', 'hd-kringel', b.xs(s, 0.16), H * 0.18, H * 0.07, 0, '#6a5a48');
        },
        (s) => {
          b.slot(b.xs(s, 0.35), H * 0.62, H * 0.34, 0.78, 6, POLW);
          b.slot(b.xs(s, 0.68), H * 0.32, H * 0.28, 0.80, -4, DUENN);
          b.st('vorne', 'lb-tape', b.xs(s, 0.68), H * 0.185, H * 0.07, 8, '#c9a2a2', 0.85);
          b.st('vorne', 'bo2-gaense', b.xs(s, 0.90), H * 0.72, H * 0.13, 15, '#e0d6c2');
        },
        (s) => {
          b.st('hinten', 'sz-spiralblock', b.xs(s, 0.40), H * 0.42, H * 0.44, 3);
          b.slot(b.xs(s, 0.29), H * 0.40, H * 0.23, 0.78, -3, DUENN);
          b.slot(b.xs(s, 0.51), H * 0.435, H * 0.22, 0.78, 4, POLW);
          b.st('vorne', 're-kamera', b.xs(s, 0.82), H * 0.74, H * 0.13, -8, '#4a4540');
        },
        (s) => {
          b.slot(b.xs(s, 0.38), H * 0.36, H * 0.31, 0.80, -6, POLW);
          b.slot(b.xs(s, 0.64), H * 0.68, H * 0.30, 0.78, 5, POL);
          b.st('vorne', 'hd-herz', b.xs(s, 0.85), H * 0.28, H * 0.06, 8, '#b0705f');
          b.st('vorne', 'bo2-trocken', b.xs(s, 0.12), H * 0.75, H * 0.15, 25, '#c9b08a');
        },
        (s) => {
          b.slot(b.xs(s, 0.46), H * 0.50, H * 0.38, 0.80, -3, POLW);
          b.st('vorne', 'lb-tape', b.xs(s, 0.46), H * 0.295, H * 0.08, -12, '#c9b89a', 0.88);
          b.tx('vorne', 'mehr davon ↓', b.xs(s, 0.78), H * 0.83, H * 0.042,
            { font: 'Caveat', color: '#4a3c2e' });
        },
      ]);
      jeKante(b, [
        (e) => b.st('vorne', 'washi1', e * b.sw, H * 0.68, H * 0.14, 4, '#c9b89a', 0.85),
        (e) => b.st('vorne', 'washi2', e * b.sw, H * 0.26, H * 0.13, -6, '#a8bba4', 0.85),
        (e) => b.st('vorne', 'hairline', e * b.sw, H * 0.90, H * 0.16, 0, '#8a7048', 0.6),
        (e) => b.st('vorne', 'washi3', e * b.sw, H * 0.74, H * 0.13, 5, '#c9a2a2', 0.85),
        (e) => b.st('vorne', 'washi1', e * b.sw, H * 0.22, H * 0.14, -4, '#b9ad9c', 0.85),
        (e) => b.st('vorne', 'hd-pfeil', e * b.sw, H * 0.55, H * 0.08, 10, '#5a4a38'),
      ]);
      return b;
    },
  });

  /* ===== 5. Galeriewand ===== */
  SZENEN.push({
    id: 'sz-galeriewand', name: 'Galeriewand', bg: 'sl-galeriewand',
    hint: 'Gerahmte Bilder an einer Wand – zwei hängen genau auf der Kante',
    slides: 7, format: '1:1',
    bauen(k) {
      const b = neuBau(k), H = b.H;
      const nagel = (x, yTop) => {
        b.st('hinten', 'pin', x, yTop - H * 0.045, H * 0.035, 0, '#8a7a63');
      };
      jeSlide(b, [
        (s) => {
          b.slot(b.xs(s, 0.5), H * 0.46, H * 0.40, 0.78, 0, { style: 'double', border: 30, color: '#f2ead9' });
          nagel(b.xs(s, 0.5), H * 0.46 - H * 0.24);
          b.tx('vorne', 'G A L E R I E', b.xs(s, 0.5), H * 0.83, H * 0.032,
            { font: 'Julius Sans One', color: '#8a7d6b', letterSpacing: 8 });
        },
        (s) => {
          b.slot(b.xs(s, 0.34), H * 0.36, H * 0.26, 0.80, 0, DUENN);
          nagel(b.xs(s, 0.34), H * 0.36 - H * 0.16);
          b.slot(b.xs(s, 0.68), H * 0.60, H * 0.30, 0.80, 0, { style: 'oval', border: 0 });
          nagel(b.xs(s, 0.68), H * 0.60 - H * 0.18);
        },
        (s) => {
          b.slot(b.xs(s, 0.5), H * 0.42, H * 0.34, 1.25, 0, { style: 'baroque', border: 26, color: '#cfb98a' });
          nagel(b.xs(s, 0.5), H * 0.42 - H * 0.21);
          b.st('vorne', 'bo2-monstera', b.xs(s, 0.87), H * 0.83, H * 0.20, -8, '#7d9472');
        },
        (s) => {
          b.slot(b.xs(s, 0.36), H * 0.56, H * 0.32, 0.78, 0, { style: 'arch', border: 22, color: '#efe7d6' });
          nagel(b.xs(s, 0.36), H * 0.56 - H * 0.19);
          b.slot(b.xs(s, 0.70), H * 0.36, H * 0.24, 0.80, 0, DUENN);
          nagel(b.xs(s, 0.70), H * 0.36 - H * 0.145);
        },
        (s) => {
          b.slot(b.xs(s, 0.5), H * 0.47, H * 0.42, 0.80, 0, { style: 'double', border: 28, color: '#e8dfcc' });
          nagel(b.xs(s, 0.5), H * 0.47 - H * 0.25);
        },
        (s) => {
          b.slot(b.xs(s, 0.33), H * 0.40, H * 0.27, 0.80, 0, { style: 'oval', border: 0 });
          nagel(b.xs(s, 0.33), H * 0.40 - H * 0.165);
          b.slot(b.xs(s, 0.67), H * 0.585, H * 0.29, 0.78, 0, DUENN);
          nagel(b.xs(s, 0.67), H * 0.585 - H * 0.175);
          b.st('vorne', 'bo2-blattgold', b.xs(s, 0.90), H * 0.20, H * 0.10, 15, '#c9a15f');
        },
        (s) => {
          b.slot(b.xs(s, 0.5), H * 0.45, H * 0.38, 0.78, 0, { style: 'baroque', border: 26, color: '#cfb98a' });
          nagel(b.xs(s, 0.5), H * 0.45 - H * 0.23);
          b.tx('vorne', 'seit 2026', b.xs(s, 0.5), H * 0.82, H * 0.036,
            { font: 'Cormorant Garamond', color: '#8a7d6b', italic: true });
        },
      ]);
      jeKante(b, [
        (e) => {           /* Bild GENAU auf der Kante – der Wisch-Moment */
          b.slot(e * b.sw, H * 0.50, H * 0.28, 0.80, 2, DUENN);
          nagel(e * b.sw, H * 0.50 - H * 0.17);
        },
        (e) => b.st('hinten', 'hi-streu', e * b.sw, H * 0.16, H * 0.05, 0, '#b9ad9c'),
        (e) => {
          b.slot(e * b.sw, H * 0.44, H * 0.26, 0.80, -2, { style: 'oval', border: 0 });
          nagel(e * b.sw, H * 0.44 - H * 0.16);
        },
        (e) => b.st('hinten', 'hi-streu', e * b.sw, H * 0.16, H * 0.05, 0, '#b9ad9c'),
      ]);
      return b;
    },
  });

  /* ===== 6. Sammelalbum ===== */
  SZENEN.push({
    id: 'sz-sammelalbum', name: 'Sammelalbum', bg: 'tx-kraft-0',
    hint: 'Kraftpapier, Tickets, Tape und Handschrift',
    slides: 7, format: '1:1',
    bauen(k) {
      const b = neuBau(k), H = b.H;
      jeSlide(b, [
        (s) => {
          b.tx('hinten', 'ERINNERUNGEN', b.xs(s, 0.5), H * 0.115, H * 0.055,
            { font: 'Special Elite', color: '#3d362e', letterSpacing: 3 });
          b.tx('hinten', 'gesammelt & aufgeklebt', b.xs(s, 0.5), H * 0.185, H * 0.036,
            { font: 'Caveat', color: '#6b5b4a' });
          b.slot(b.xs(s, 0.5), H * 0.55, H * 0.36, 0.80, -3, { style: 'riss' });
          b.st('vorne', 'lb-tape', b.xs(s, 0.5), H * 0.35, H * 0.08, -14, '#b9a27a', 0.9);
        },
        (s) => {
          b.slot(b.xs(s, 0.32), H * 0.40, H * 0.31, 0.78, 5, POLW);
          b.slot(b.xs(s, 0.68), H * 0.66, H * 0.30, 0.80, -6, { style: 'riss' });
          b.st('vorne', 're-ticket', b.xs(s, 0.76), H * 0.24, H * 0.10, 12, '#c9a15f');
          b.st('vorne', 'sy-funken-03', b.xs(s, 0.14), H * 0.78, H * 0.05, 0, '#a8895c');
        },
        (s) => {
          b.slot(b.xs(s, 0.46), H * 0.44, H * 0.36, 0.80, 2, { style: 'stamp', border: 18 });
          b.st('vorne', 'hd-pfeil', b.xs(s, 0.72), H * 0.68, H * 0.09, 25, '#3d362e');
          b.tx('vorne', 'der beste Tag!', b.xs(s, 0.74), H * 0.80, H * 0.045,
            { font: 'Caveat', color: '#3d362e', rot: -4 });
        },
        (s) => {
          b.slot(b.xs(s, 0.35), H * 0.62, H * 0.33, 0.78, -5, { style: 'washi' });
          b.slot(b.xs(s, 0.67), H * 0.335, H * 0.28, 0.80, 4, POLW);
          b.st('vorne', 'hd-fotoecken', b.xs(s, 0.67), H * 0.335, H * 0.30, 4, '#3d362e', 0.7);
        },
        (s) => {
          b.slot(b.xs(s, 0.5), H * 0.46, H * 0.38, 0.80, 3, { style: 'zeitung', border: 24 });
          b.st('vorne', 'lb-tape', b.xs(s, 0.38), H * 0.265, H * 0.075, -30, '#a8bba4', 0.85);
          b.st('vorne', 'lb-tape', b.xs(s, 0.62), H * 0.655, H * 0.075, 24, '#a8bba4', 0.85);
          b.st('hinten', 'hd-kringel', b.xs(s, 0.84), H * 0.80, H * 0.07, 0, '#6b5b4a');
        },
        (s) => {
          b.slot(b.xs(s, 0.30), H * 0.36, H * 0.28, 0.80, -4, { style: 'riss' });
          b.slot(b.xs(s, 0.64), H * 0.60, H * 0.34, 0.78, 6, POLW);
          b.st('vorne', 'heart-fill', b.xs(s, 0.87), H * 0.26, H * 0.06, -10, '#b0705f');
        },
        (s) => {
          b.slot(b.xs(s, 0.46), H * 0.50, H * 0.36, 0.80, -2, { style: 'torn' });
          b.tx('vorne', 'wird fortgesetzt …', b.xs(s, 0.5), H * 0.855, H * 0.048,
            { font: 'Caveat', color: '#3d362e' });
        },
      ]);
      jeKante(b, [
        (e) => b.st('vorne', 'washi1', e * b.sw, H * 0.28, H * 0.14, -5, '#b9a27a', 0.88),
        (e) => b.st('vorne', 'hd-zickzack', e * b.sw, H * 0.85, H * 0.08, 0, '#6b5b4a'),
        (e) => b.st('vorne', 'washi3', e * b.sw, H * 0.70, H * 0.13, 6, '#c9a2a2', 0.85),
        (e) => b.st('vorne', 'hd-kringel', e * b.sw, H * 0.14, H * 0.07, 0, '#6b5b4a'),
        (e) => b.st('vorne', 'washi2', e * b.sw, H * 0.32, H * 0.13, 4, '#a8bba4', 0.85),
        (e) => b.st('vorne', 'sy-funken-05', e * b.sw, H * 0.20, H * 0.05, 0, '#a8895c'),
      ]);
      return b;
    },
  });

  /* ===== 7. Sternennacht ===== */
  SZENEN.push({
    id: 'sz-sternennacht', name: 'Sternennacht', bg: 'sl-milchstrasse',
    hint: 'Schwarze Polaroids unter der Milchstraße, Sternbilder verbinden',
    slides: 7, format: '1:1',
    bauen(k) {
      const b = neuBau(k), H = b.H;
      const funkeln = (s) => {
        b.st('hinten', 'sparkle', b.xs(s, 0.15 + (s % 3) * 0.3), H * (0.12 + (s % 2) * 0.06),
          H * 0.035, 0, '#f2e6c4', 0.9);
      };
      jeSlide(b, [
        (s) => {
          b.tx('hinten', 'unsere Nacht', b.xs(s, 0.5), H * 0.14, H * 0.065,
            { font: 'Great Vibes', color: '#f2e6c4' });
          b.slot(b.xs(s, 0.5), H * 0.56, H * 0.36, 0.78, -3, POLB);
          funkeln(s);
        },
        (s) => {
          b.slot(b.xs(s, 0.34), H * 0.46, H * 0.30, 0.78, 4, POLB);
          b.slot(b.xs(s, 0.70), H * 0.68, H * 0.28, 0.80, -5, POLB);
          b.st('hinten', 'sy-mond-05', b.xs(s, 0.80), H * 0.18, H * 0.10, 0, '#f2e6c4');
        },
        (s) => {
          b.slot(b.xs(s, 0.5), H * 0.50, H * 0.37, 0.80, 2, POLB);
          b.st('hinten', 'sp-sternbild', b.xs(s, 0.18), H * 0.24, H * 0.13, -10, '#cfe0ff', 0.85);
          funkeln(s);
        },
        (s) => {
          b.slot(b.xs(s, 0.32), H * 0.60, H * 0.31, 0.78, -4, POLB);
          b.slot(b.xs(s, 0.68), H * 0.38, H * 0.29, 0.80, 5, POLB);
          b.st('hinten', 'shootstar', b.xs(s, 0.85), H * 0.13, H * 0.07, -15, '#f2e6c4');
        },
        (s) => {
          b.slot(b.xs(s, 0.5), H * 0.54, H * 0.38, 0.78, 3, POLB);
          b.st('hinten', 'sp-mond', b.xs(s, 0.14), H * 0.16, H * 0.09, 0, '#f2e6c4');
          funkeln(s);
        },
        (s) => {
          b.slot(b.xs(s, 0.36), H * 0.44, H * 0.30, 0.80, -5, POLB);
          b.slot(b.xs(s, 0.70), H * 0.66, H * 0.29, 0.78, 4, POLB);
          b.st('hinten', 'sy-funken-05', b.xs(s, 0.85), H * 0.24, H * 0.05, 0, '#f2e6c4');
        },
        (s) => {
          b.slot(b.xs(s, 0.5), H * 0.52, H * 0.36, 0.80, -2, POLB);
          b.tx('vorne', 'gute Nacht ✦', b.xs(s, 0.5), H * 0.86, H * 0.05,
            { font: 'Great Vibes', color: '#f2e6c4' });
          funkeln(s);
        },
      ]);
      jeKante(b, [
        (e) => b.st('hinten', 'sp-sternbild', e * b.sw, H * 0.20, H * 0.15, 8, '#cfe0ff', 0.9),
        (e) => b.st('hinten', 'sparkle3', e * b.sw, H * 0.30, H * 0.05, 0, '#f2e6c4'),
        (e) => b.st('hinten', 'sp-sternbild', e * b.sw, H * 0.75, H * 0.13, -12, '#cfe0ff', 0.75),
        (e) => b.st('hinten', 'star', e * b.sw, H * 0.12, H * 0.045, 10, '#f2e6c4'),
        (e) => b.st('hinten', 'sp-sternbild', e * b.sw, H * 0.26, H * 0.14, 15, '#cfe0ff', 0.85),
        (e) => b.st('hinten', 'sparkle', e * b.sw, H * 0.70, H * 0.04, 0, '#f2e6c4'),
      ]);
      return b;
    },
  });

  /* ===== 8. Sommer und Dünen ===== */
  SZENEN.push({
    id: 'sz-sommer', name: 'Sommerpost', bg: 'sl-duenen',
    hint: 'Postkarten und Marken im Dünensand, ein Flieger zieht quer durch',
    slides: 7, format: '1:1',
    bauen(k) {
      const b = neuBau(k), H = b.H;
      jeSlide(b, [
        (s) => {
          b.tx('hinten', 'Sommer', b.xs(s, 0.5), H * 0.14, H * 0.085,
            { font: 'Pacifico', color: '#b0705f' });
          b.slot(b.xs(s, 0.5), H * 0.55, H * 0.33, 1.35, -3, POLW);
          b.st('vorne', 're-muschel', b.xs(s, 0.18), H * 0.84, H * 0.08, -10, '#d9b08a');
        },
        (s) => {
          b.slot(b.xs(s, 0.42), H * 0.42, H * 0.32, 1.35, 4, POLW);
          b.slot(b.xs(s, 0.76), H * 0.70, H * 0.20, 0.85, -8, { style: 'stamp', border: 14 });
          b.st('hinten', 're-sonne', b.xs(s, 0.14), H * 0.15, H * 0.10, 0, '#e8b53a');
        },
        (s) => {
          b.slot(b.xs(s, 0.5), H * 0.50, H * 0.36, 0.80, 2, POLW);
          b.st('vorne', 'ca-eis', b.xs(s, 0.82), H * 0.26, H * 0.11, 8, '#d98a96');
          b.st('vorne', 're-muschel', b.xs(s, 0.85), H * 0.86, H * 0.07, 14, '#c9a15f');
        },
        (s) => {
          b.slot(b.xs(s, 0.36), H * 0.60, H * 0.30, 1.35, -4, POLW);
          b.slot(b.xs(s, 0.72), H * 0.34, H * 0.22, 0.85, 6, { style: 'stamp', border: 14 });
          b.st('hinten', 'cloud', b.xs(s, 0.14), H * 0.13, H * 0.08, 0, '#ffffff', 0.9);
        },
        (s) => {
          b.slot(b.xs(s, 0.5), H * 0.46, H * 0.37, 0.80, -2, POLW);
          b.st('vorne', 'bo-welle', b.xs(s, 0.18), H * 0.86, H * 0.07, 0, '#7fa8b8');
        },
        (s) => {
          b.slot(b.xs(s, 0.40), H * 0.40, H * 0.31, 1.35, 5, POLW);
          b.slot(b.xs(s, 0.70), H * 0.68, H * 0.28, 0.80, -5, POL);
          b.st('hinten', 're-palme', b.xs(s, 0.90), H * 0.22, H * 0.14, 4, '#7d9472');
        },
        (s) => {
          b.slot(b.xs(s, 0.5), H * 0.52, H * 0.35, 1.35, 3, POLW);
          b.tx('vorne', 'ab in den Süden ✈', b.xs(s, 0.5), H * 0.855, H * 0.05,
            { font: 'Caveat', color: '#5a4a38' });
        },
      ]);
      jeKante(b, [
        (e) => {           /* Flieger mit gepunkteter Linie über die Kante */
          b.st('hinten', 're-flugzeug', e * b.sw + H * 0.05, H * 0.145, H * 0.075, 8, '#5d6d78');
          b.st('hinten', 'hd-kringel', e * b.sw - H * 0.09, H * 0.175, H * 0.07, -6, '#8a9aa4');
        },
        (e) => b.st('vorne', 'bo-welle', e * b.sw, H * 0.885, H * 0.08, 0, '#7fa8b8'),
        (e) => b.st('hinten', 'cloud', e * b.sw, H * 0.11, H * 0.09, 0, '#ffffff', 0.9),
        (e) => b.st('vorne', 're-muschel', e * b.sw, H * 0.87, H * 0.075, -8, '#d9b08a'),
        (e) => {
          b.st('hinten', 're-flugzeug', e * b.sw + H * 0.04, H * 0.12, H * 0.07, 5, '#5d6d78');
          b.st('hinten', 'hd-kringel', e * b.sw - H * 0.09, H * 0.15, H * 0.065, -4, '#8a9aa4');
        },
        (e) => b.st('vorne', 'bo-welle', e * b.sw, H * 0.885, H * 0.075, 0, '#7fa8b8'),
      ]);
      return b;
    },
  });

  /* ===== 9. Gentle Healing ===== */
  SZENEN.push({
    id: 'sz-gentle', name: 'Gentle Healing', bg: 'aq-champagner-1',
    hint: 'Aquarell, Bögen, Gold und Trockenblumen – deine Linie',
    slides: 7, format: '1:1',
    bauen(k) {
      const b = neuBau(k), H = b.H;
      const gold = '#a8895c';
      jeSlide(b, [
        (s) => {
          b.st('hinten', 'bo-bogen', b.xs(s, 0.5), H * 0.52, H * 0.58, 0, '#d9ba8a', 0.8);
          b.slot(b.xs(s, 0.5), H * 0.52, H * 0.40, 0.75, 0, { style: 'arch', border: 20, color: '#fdfbf8' });
          b.tx('hinten', 'gentle days', b.xs(s, 0.5), H * 0.135, H * 0.075,
            { font: 'Great Vibes', color: gold });
          b.st('vorne', 'sy-funken-05', b.xs(s, 0.82), H * 0.22, H * 0.045, 0, gold);
        },
        (s) => {
          b.slot(b.xs(s, 0.36), H * 0.44, H * 0.32, 0.78, 0, { style: 'oval', border: 0 });
          b.slot(b.xs(s, 0.70), H * 0.64, H * 0.30, 0.75, 0, { style: 'arch', border: 18, color: '#fdfbf8' });
          b.st('vorne', 'bo2-pampas', b.xs(s, 0.12), H * 0.80, H * 0.18, -15, '#d9c4a2');
        },
        (s) => {
          b.st('hinten', 'bo-bogen', b.xs(s, 0.5), H * 0.50, H * 0.52, 180, '#d0b184', 0.7);
          b.slot(b.xs(s, 0.5), H * 0.48, H * 0.38, 0.78, 0, { style: 'thin', border: 16, color: '#fdfbf8', keyline: true });
          b.st('vorne', 'hd-unterstrich', b.xs(s, 0.5), H * 0.76, H * 0.05, 0, gold);
          b.tx('vorne', 'atme. wachse. blühe.', b.xs(s, 0.5), H * 0.84, H * 0.042,
            { font: 'Cormorant Garamond', color: '#6b5b48', italic: true });
        },
        (s) => {
          b.slot(b.xs(s, 0.40), H * 0.56, H * 0.36, 0.75, 0, { style: 'arch', border: 20, color: '#fdfbf8' });
          b.st('hinten', 'sy-geometrie-07', b.xs(s, 0.78), H * 0.28, H * 0.16, 0, gold, 0.5);
          b.st('vorne', 'bo2-eukalyptus', b.xs(s, 0.86), H * 0.78, H * 0.16, 20, '#a8b39a');
        },
        (s) => {
          b.slot(b.xs(s, 0.34), H * 0.40, H * 0.28, 0.80, 0, { style: 'oval', border: 0 });
          b.slot(b.xs(s, 0.68), H * 0.62, H * 0.32, 0.75, 0, { style: 'arch', border: 18, color: '#fdfbf8' });
          b.st('vorne', 'sy-funken-03', b.xs(s, 0.14), H * 0.20, H * 0.05, 0, gold);
        },
        (s) => {
          b.st('hinten', 'bo-bogen', b.xs(s, 0.5), H * 0.54, H * 0.56, 0, '#d9ba8a', 0.75);
          b.slot(b.xs(s, 0.5), H * 0.52, H * 0.39, 0.78, 0, { style: 'thin', border: 16, color: '#fdfbf8', keyline: true });
          b.st('vorne', 'bo2-trocken', b.xs(s, 0.13), H * 0.79, H * 0.17, -20, '#c9b08a');
        },
        (s) => {
          b.slot(b.xs(s, 0.5), H * 0.50, H * 0.40, 0.75, 0, { style: 'arch', border: 20, color: '#fdfbf8' });
          b.tx('vorne', 'du darfst langsam sein', b.xs(s, 0.5), H * 0.855, H * 0.048,
            { font: 'Great Vibes', color: gold });
        },
      ]);
      jeKante(b, [
        (e) => b.st('hinten', 'bo2-ranke', e * b.sw, H * 0.86, H * 0.14, 5, '#a8b39a', 0.9),
        (e) => b.st('hinten', 'hairline', e * b.sw, H * 0.16, H * 0.20, 0, gold, 0.7),
        (e) => b.st('hinten', 'bo2-ranke', e * b.sw, H * 0.14, H * 0.13, -8, '#c9b08a', 0.85),
        (e) => b.st('hinten', 'sy-funken-05', e * b.sw, H * 0.30, H * 0.04, 0, gold),
        (e) => b.st('hinten', 'bo2-ranke', e * b.sw, H * 0.87, H * 0.14, -5, '#a8b39a', 0.9),
        (e) => b.st('hinten', 'hairline', e * b.sw, H * 0.84, H * 0.18, 0, gold, 0.7),
      ]);
      return b;
    },
  });

  /* ===== 10. Monatsrückblick ===== */
  SZENEN.push({
    id: 'sz-monat', name: 'Monatsrückblick', bg: 'tx-leinen-1',
    hint: 'Ein Zeitstrahl zieht durch alle Slides, die Bilder hängen daran',
    slides: 7, format: '1:1',
    bauen(k) {
      const b = neuBau(k), H = b.H;
      /* Der Zeitstrahl: eine Linie auf gleicher Höhe durch JEDE Slide –
         am Schnitt trifft sie sich exakt, der stärkste Wisch-Anker. */
      for (let s = 0; s < b.n; s++) {
        b.st('hinten', 'hairline', b.xs(s, 0.5), H * 0.5, b.sw * 1.02, 0, '#8a7a63', 0.8);
      }
      const oben = (s, f, etikett) => {
        b.slot(b.xs(s, f), H * 0.30, H * 0.28, 0.80, (s % 2 ? 3 : -3), POLW);
        b.st('hinten', 'hairline', b.xs(s, f), H * 0.465, H * 0.055, 90, '#8a7a63', 0.7);
        if (etikett) b.st('vorne', 'lb-etikett', b.xs(s, f + 0.16), H * 0.52, H * 0.06, 20, '#c9a15f');
      };
      const unten = (s, f, etikett) => {
        b.slot(b.xs(s, f), H * 0.70, H * 0.28, 0.80, (s % 2 ? -3 : 3), POLW);
        b.st('hinten', 'hairline', b.xs(s, f), H * 0.535, H * 0.055, 90, '#8a7a63', 0.7);
        if (etikett) b.st('vorne', 'lb-etikett', b.xs(s, f - 0.16), H * 0.475, H * 0.06, -20, '#c9a15f');
      };
      jeSlide(b, [
        (s) => {
          b.tx('hinten', 'MEIN MONAT', b.xs(s, 0.5), H * 0.115, H * 0.065,
            { font: 'Anton', color: '#3d362e', letterSpacing: 2 });
          b.tx('hinten', 'in Bildern, von links nach rechts', b.xs(s, 0.5), H * 0.185, H * 0.032,
            { font: 'Poppins', color: '#7a6f5f', letterSpacing: 2 });
          unten(s, 0.5, true);
        },
        (s) => { oben(s, 0.42, true); unten(s, 0.78, false); },
        (s) => { unten(s, 0.38, true); oben(s, 0.74, false); },
        (s) => {
          oben(s, 0.5, false);
          b.st('vorne', 'sy-funken-03', b.xs(s, 0.82), H * 0.70, H * 0.05, 0, '#a8895c');
        },
        (s) => { unten(s, 0.40, true); oben(s, 0.76, false); },
        (s) => { oben(s, 0.42, false); unten(s, 0.76, true); },
        (s) => {
          oben(s, 0.44, false);
          b.tx('vorne', 'bis nächsten Monat ♡', b.xs(s, 0.52), H * 0.78, H * 0.048,
            { font: 'Caveat', color: '#5a4a38' });
        },
      ]);
      jeKante(b, [
        (e) => b.st('hinten', 'dots', e * b.sw, H * 0.5, H * 0.05, 0, '#c9a15f', 0.9),
        (e) => b.st('hinten', 'sy-funken-05', e * b.sw, H * 0.5, H * 0.04, 0, '#a8895c'),
      ]);
      return b;
    },
  });

  /* ============================================================== Anwenden */
  async function anwenden(id) {
    const S = SZENEN.find(x => x.id === id);
    if (!S) return;

    /* Format und Slides NUR über die UI-Wege (Kopfzeile!) */
    const fs = document.getElementById('formatSel');
    if (fs && S.format && fs.value !== S.format) {
      fs.value = S.format;
      fs.dispatchEvent(new Event('change'));
    }
    const plus = document.getElementById('slidesPlus');
    const minus = document.getElementById('slidesMinus');
    /* Erstes Antippen: die komponierte Slidezahl (7). Ist DIESE Szene schon
       aktiv, gilt die aktuelle Slidezahl – so baut ein erneutes Antippen die
       Szene auf der inzwischen geänderten Zahl neu auf (3–20). */
    const zielN = Math.max(2, Math.min(20,
      SS._szeneAktiv === id ? st.slides : (S.slides || 7)));
    let schutz = 0;
    while (st.slides < zielN && plus && schutz++ < 40) plus.click();
    while (st.slides > zielN && minus && schutz++ < 80) minus.click();

    const k = SS.canvasSize();
    const b = S.bauen(k);

    st.bg = { type: 'preset', id: S.bg, hue: 0 };
    SS.bgCacheInvalidate && SS.bgCacheInvalidate();

    /* Wie SS.szeneAnwenden: alte Deko und Texte weichen, Fotos bleiben.
       LEERE Platzhalter sind Mobiliar der alten Szene und weichen mit –
       gefüllte zählen als Fotos und wandern in die neuen Plätze. */
    st.elements = st.elements.filter(e => (e.type === 'photo' || e.type === 'video' || e.locked)
      && !(e.type === 'photo' && e.ph && !e.locked && !(e.imgId && SS.images[e.imgId])));
    const fotos = st.elements.filter(e => e.type === 'photo' && !e.locked && !e.hidden);

    const mache = (d) => {
      if (d.typ === 'tx') {
        return SS.normalizeEl({
          id: SS.uid(), type: 'text', content: d.content,
          x: d.x, y: d.y, rot: d.rot || 0,
          font: d.font || 'Poppins', size: Math.max(12, Math.round(d.size)),
          color: d.color || '#3a3229', bold: !!d.bold, italic: !!d.italic,
          align: 'center', letterSpacing: d.letterSpacing || 0,
          lineHeight: d.lineHeight || 1.25, opacity: d.op == null ? 1 : d.op,
          bgStyle: 'none', bgColor: '#ffffff', bgAlpha: 0.85,
        });
      }
      const def = SS.stickerDef && SS.stickerDef(d.kind);
      if (!def) return null;
      return SS.normalizeEl({
        id: SS.uid(), type: 'sticker', kind: d.kind, cat: def.cat,
        x: d.x, y: d.y, s: Math.max(16, Math.round(d.s)),
        rot: d.rot || 0, opacity: d.op == null ? 1 : d.op,
        color: d.color || '#c9a15f',
      });
    };

    const neu = [];
    b.hinten.forEach(d => { const el = mache(d); if (el) neu.push(el); });

    /* Füllreihenfolge = Leserichtung: streng von links nach rechts, auch für
       Slots, die an Kanten hängen und deshalb später angelegt wurden. */
    b.slots.sort((a, z) => a.x - z.x || a.y - z.y);

    const slotEls = [];
    b.slots.forEach((slot, i) => {
      let p = fotos[i];
      if (!p) p = SS.platzhalterNeu({});
      p.ph = true;
      p.phNr = i + 1;
      p.phAr = slot.ar;
      p.x = slot.x; p.y = slot.y; p.rot = slot.rot || 0; p.h = slot.h;
      p.scaleX = 1; p.scaleY = 1; p.opacity = 1; p.hidden = false;
      p.frame = Object.assign(SS.defaultFrame(), slot.frame || {});
      if (p.imgId && SS.images[p.imgId]) SS.platzhalterZuschnitt(p, slot.ar);
      else if (p.crop) delete p.crop.rect;
      SS.photoCacheClear && SS.photoCacheClear(p.id);
      SS.cardCacheClear && SS.cardCacheClear(p.id);
      SS.invalidateEl && SS.invalidateEl(p);
      slotEls.push(p);
    });

    b.vorne.forEach(d => { const el = mache(d); if (el) neu.push(el); });

    /* Z-Ordnung neu: hinten → Slots → vorne → alles Übrige (unangetastet) */
    const vergeben = new Set(slotEls.map(e => e.id));
    const uebrige = st.elements.filter(e => !vergeben.has(e.id));
    const nHinten = b.hinten.length;
    st.elements = [
      ...neu.slice(0, nHinten),
      ...slotEls,
      ...neu.slice(nHinten),
      ...uebrige,
    ];

    SS._szeneAktiv = id;
    SS.pushHistory('Szene: ' + S.name);
    SS.ui.refreshLayers && SS.ui.refreshLayers();
    SS.ui.zoomFit && SS.ui.zoomFit();
    SS.requestRender && SS.requestRender();

    const leer = slotEls.filter(e => !(e.imgId && SS.images[e.imgId])).length;
    const rest = fotos.length - b.slots.length;
    SS.toast('Szene „' + S.name + '" steht – '
      + (leer ? leer + ' Platzhalter antippen und Fotos einlegen' : 'alle Plätze gefüllt')
      + (rest > 0 ? ' · ' + rest + ' Fotos ohne Platz liegen unverändert' : ''), 4600, 'ok');
  }
  SS.ui.szeneVorlageAnwenden = anwenden;

  /* ============================================================== Kacheln */
  (function () {
    const wurzel = document.getElementById('vorlagenGrid');
    if (!wurzel) return;
    const eltern = wurzel.parentElement;

    const kopf = document.createElement('div');
    kopf.className = 'ctl';
    kopf.style.cssText = 'margin-top:14px;display:block';
    kopf.innerHTML = '<span style="opacity:.75;font-size:13px">Szenen-Vorlagen · Feed 1:1</span>';
    eltern.insertBefore(kopf, wurzel.nextSibling);

    const raster = document.createElement('div');
    raster.className = wurzel.className;
    raster.id = 'szenenGrid';
    eltern.insertBefore(raster, kopf.nextSibling);

    const knopf = document.createElement('button');
    knopf.className = 'wide';
    knopf.textContent = 'Fotos für die Plätze wählen …';
    knopf.onclick = () => SS.platzhalterAlleFuellen && SS.platzhalterAlleFuellen();
    eltern.insertBefore(knopf, raster.nextSibling);

    const kMini = { W: 7 * 1080, H: 1080, slideW: 1080, n: 7 };
    for (const S of SZENEN) {
      const sw = document.createElement('button');
      sw.className = 'swatch';
      const cv = document.createElement('canvas');
      cv.width = 135; cv.height = 168;
      const c = cv.getContext('2d');
      const bg = SS.BG_LIB && SS.BG_LIB.find(x => x.id === S.bg);
      if (bg && bg.paint) { try { bg.paint(c, 135, 168); } catch (e) { c.fillStyle = '#ddd'; c.fillRect(0, 0, 135, 168); } }
      /* Ausschnitt: die ersten 1,7 Slides der echten Szene als Kästchen */
      try {
        const bb = S.bauen(kMini);
        const sicht = 1.7 * 1080;
        for (const slot of bb.slots) {
          if (slot.x > sicht) continue;
          const x = slot.x / sicht * 135;
          const y = slot.y / 1080 * 150;
          const hh = slot.h / 1080 * 150;
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
      sw.onclick = () => anwenden(S.id);
      raster.appendChild(sw);
    }
  })();

  SS.SZENEN = SZENEN;
  SS.SZENEN7 = { bereit: true, anzahl: SZENEN.length, ids: SZENEN.map(s => s.id) };
})();
