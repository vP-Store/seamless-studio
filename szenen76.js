/* Seamless Studio – Szenen-Vorlagen, dritter Satz (v7.6)
   ============================================================================
   Vier Szenen nach Scotts neuen Pinterest-Vorbildern – „genau so wie auf
   den Bildern":

     sz-wiesenbuch  Wiesen-Scrapbook (Vorbild „Scrapbook Carousel Template"):
                    Spiralbuch mit Fotos auf den Seiten, Polaroids über die
                    Wiese verteilt, Kassette, Vinyl, Notizzettel
                    „i still love you"
     sz-heftwand    Highschool-Heft (Vorbild Karo-Grid): Filmstreifen,
                    gestapelte Polaroids, kleiner TV, Regenbogen, Sterne
     sz-feenwald    Feenmärchen (Vorbild „fairy"): gerissene Mitte,
                    Perlen-Herzen, Ovalspiegel, Schmetterlinge, Feenflügel
     sz-happyplace  Happy Place (Vorbild riu): Poststempel-Briefmarke,
                    Puzzle-Wand, Polaroids auf Notizpapier,
                    „this is my happy place"

   Die Foto-Plätze nutzen die neuen Objekt-Rahmen aus rahmen76.js
   (digicam, puzzle, herzperlen, poststempel) und alles Bewährte aus
   rahmen7/75. Baukasten wie szenen74/75: bewusst eigene Kopie der kleinen
   Helfer, statt in deployte Dateien zu schneiden.
   ========================================================================= */

(function () {
  if (!SS.state || !SS.platzhalterNeu || !SS.SZENEN || !SS.ui
    || typeof SS.ui.szeneVorlageAnwenden !== 'function') return;

  /* ---------------- Baukasten (Kopie wie szenen74/75) -------------------- */
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
  function wurf(b, s, liste) {
    for (const [f, y, h, ar, rot, rahmen] of liste) {
      b.slot(b.xs(s, f), b.H * y, b.H * h, ar, rot, rahmen);
    }
  }

  const POL   = { style: 'polaroid',   border: 20 };
  const POLW  = { style: 'polaroid-w', border: 20 };
  const POLB  = { style: 'polaroid-b', border: 20 };
  const DUENN = { style: 'thin', border: 12 };
  const FILM  = { style: 'film', border: 18 };
  const FILMH = { style: 'filmhoch', border: 18 };
  const RISS  = { style: 'riss' };
  const OVAL  = { style: 'oval' };
  const TV    = { style: 'tv', border: 20 };
  const DIGI  = { style: 'digicam', border: 18, color: '#e9b7c9' };
  const PUZZ  = { style: 'puzzle' };
  const HERZP = { style: 'herzperlen' };
  const POST  = { style: 'poststempel', border: 16 };

  const SZENEN4 = [];

  /* ===== 1. Wiesen-Scrapbook – Spiralbuch, Polaroids, Kassette, Vinyl ==== */
  SZENEN4.push({
    id: 'sz-wiesenbuch', name: 'Wiesen-Scrapbook', bg: 'sl-filmtag',
    hint: 'Spiralbuch mit Fotos, Polaroids über der Wiese, Kassette und Vinyl – wie das Scrapbook-Vorbild',
    slides: 6, format: '1:1',
    bauen(k) {
      const b = neuBau(k), H = b.H;
      const tinte = '#4a4238';
      jeSlide(b, [
        /* Spiralbuch-Slide */
        (s) => {
          const S = H * 0.62, bx = b.xs(s, 0.34), by = H * 0.52;
          b.st('hinten', 'sz-spiralblock', bx, by, S, -2);
          b.slot(bx - S * 0.40, by - S * 0.02, S * 0.56, 0.70, -3, POL);
          b.slot(bx + S * 0.40, by - S * 0.06, S * 0.50, 0.72, 2, DUENN);
          b.st('vorne', 'hd-ausruf', b.xs(s, 0.60), H * 0.22, H * 0.09, 8, '#c9483a');
          b.st('vorne', 'star', b.xs(s, 0.64), H * 0.72, H * 0.06, -12, '#d8a935');
          b.slot(b.xs(s, 0.82), H * 0.62, H * 0.26, 0.78, 6, POLW);
          b.st('vorne', 'ra-washi', b.xs(s, 0.82), H * 0.46, H * 0.07, -18, '#c9b287');
        },
        /* Notizzettel + Polaroids */
        (s) => {
          b.slot(b.xs(s, 0.24), H * 0.30, H * 0.28, 0.80, -5, POLW);
          b.slot(b.xs(s, 0.30), H * 0.70, H * 0.26, 0.80, 4, POL);
          b.st('hinten', 'ra-notiz', b.xs(s, 0.62), H * 0.36, H * 0.30, -4, tinte);
          b.tx('vorne', 'i still\nlove you', b.xs(s, 0.62), H * 0.36, H * 0.055,
            { font: 'Caveat', color: '#3d4c86', rot: -4 });
          b.st('vorne', 'sz-kassette', b.xs(s, 0.66), H * 0.74, H * 0.13, 6, '#4a5568');
          b.slot(b.xs(s, 0.90), H * 0.52, H * 0.28, 0.78, -6, POLW);
          b.st('vorne', 'sparkle', b.xs(s, 0.10), H * 0.58, H * 0.05, 0, '#d8a935');
        },
        /* Fotoreihe + Vinyl */
        (s) => {
          b.slot(b.xs(s, 0.22), H * 0.38, H * 0.34, 0.78, -3, POLW);
          b.slot(b.xs(s, 0.52), H * 0.60, H * 0.30, 0.80, 5, POL);
          b.slot(b.xs(s, 0.50), H * 0.20, H * 0.20, 1.2, -2, DIGI);
          b.st('hinten', 'sz-vinyl', b.xs(s, 0.88), H * 0.34, H * 0.30, 0);
          b.tx('vorne', 'iloveyou', b.xs(s, 0.88), H * 0.62, H * 0.045,
            { font: 'Caveat', color: tinte });
          b.st('vorne', 'sz-kirschen', b.xs(s, 0.10), H * 0.80, H * 0.09, -6);
        },
        /* Stadt in Schwarzweiß */
        (s) => {
          b.slot(b.xs(s, 0.30), H * 0.46, H * 0.40, 0.76, -2, POLB);
          b.slot(b.xs(s, 0.68), H * 0.34, H * 0.26, 0.80, 4, POLW);
          b.slot(b.xs(s, 0.72), H * 0.72, H * 0.24, 0.80, -5, POL);
          b.st('vorne', 'ra-notiz', b.xs(s, 0.92), H * 0.24, H * 0.16, 6, tinte);
          b.tx('vorne', 'boy', b.xs(s, 0.92), H * 0.24, H * 0.04,
            { font: 'Caveat', color: tinte, rot: 6 });
          b.st('vorne', 'hd-herz', b.xs(s, 0.12), H * 0.26, H * 0.06, -8, '#c9483a');
        },
      ]);
      jeKante(b, [
        (e) => b.slot(e * b.sw, H * 0.50, H * 0.28, 0.80, -4, POLW),
        (e) => b.st('vorne', 'ra-washi', e * b.sw, H * 0.30, H * 0.08, 14, '#c9b287'),
        (e) => b.slot(e * b.sw, H * 0.44, H * 0.26, 0.78, 5, POL),
        (e) => b.st('vorne', 'wo-weich', e * b.sw, H * 0.12, H * 0.10, 0),
      ]);
      b.tx('vorne', 'scrapbook ♡', b.xs(0, 0.5), H * 0.94, H * 0.045,
        { font: 'Caveat', color: '#4d6b3a' });
      return b;
    },
  });

  /* ===== 2. Highschool-Heft – Filmstreifen, Stapel, TV, Regenbogen ======= */
  SZENEN4.push({
    id: 'sz-heftwand', name: 'Highschool-Heft', bg: 'sl-galeriewand',
    hint: 'Dichte Heftseite: Filmstreifen, Polaroid-Stapel, kleiner TV, Regenbogen und Sterne',
    slides: 6, format: '1:1',
    bauen(k) {
      const b = neuBau(k), H = b.H;
      jeSlide(b, [
        (s) => {
          wurf(b, s, [
            [0.20, 0.30, 0.26, 0.80, -6, POLW],
            [0.30, 0.42, 0.26, 0.80, 4, POLW],
            [0.62, 0.28, 0.30, 0.75, 2, FILMH],
            [0.86, 0.36, 0.24, 0.80, 7, POL],
            [0.34, 0.78, 0.22, 1.05, -3, TV],
            [0.74, 0.78, 0.20, 1.2, -5, DIGI],
          ]);
          b.st('vorne', 'rainbow', b.xs(s, 0.14), H * 0.66, H * 0.12, -8);
          b.st('vorne', 'star', b.xs(s, 0.52), H * 0.12, H * 0.05, 12, '#d8a935');
          b.tx('vorne', 'high school', b.xs(s, 0.52), H * 0.94, H * 0.05,
            { font: 'Patrick Hand', color: '#b8433a' });
        },
        (s) => {
          wurf(b, s, [
            [0.24, 0.34, 0.34, 0.78, -3, RISS],
            [0.58, 0.24, 0.24, 0.80, 5, POLW],
            [0.64, 0.44, 0.24, 0.80, -4, POLW],
            [0.88, 0.30, 0.22, 0.75, 6, FILMH],
            [0.30, 0.78, 0.24, 0.80, 4, POL],
            [0.70, 0.78, 0.26, 1.30, -2, DUENN],
          ]);
          b.st('vorne', 'hd-herz', b.xs(s, 0.48), H * 0.62, H * 0.06, -10, '#c9483a');
          b.st('vorne', 'hd-kringel', b.xs(s, 0.10), H * 0.14, H * 0.08, 0, '#3d4c86');
          b.st('vorne', 'sz-klee', b.xs(s, 0.92), H * 0.68, H * 0.06, 8, '#4d7b3a');
        },
        (s) => {
          wurf(b, s, [
            [0.22, 0.26, 0.28, 0.75, -2, FILMH],
            [0.22, 0.66, 0.26, 0.80, 5, POLW],
            [0.54, 0.36, 0.34, 0.80, 3, POLW],
            [0.84, 0.24, 0.22, 0.80, -6, POL],
            [0.60, 0.78, 0.22, 0.80, -4, POLB],
            [0.88, 0.68, 0.26, 0.78, 4, POLW],
          ]);
          b.st('vorne', 'sparkle3', b.xs(s, 0.40), H * 0.12, H * 0.07, 0, '#d8a935');
          b.tx('vorne', 'class #1', b.xs(s, 0.40), H * 0.60, H * 0.04,
            { font: 'Patrick Hand', color: '#3d4c86', rot: -3 });
          b.st('vorne', 'hd-pfeil', b.xs(s, 0.72), H * 0.58, H * 0.07, 20, '#4a4238');
        },
      ]);
      jeKante(b, [
        (e) => b.slot(e * b.sw, H * 0.48, H * 0.28, 0.75, -3, FILMH),
        (e) => b.slot(e * b.sw, H * 0.40, H * 0.26, 0.80, 4, POLW),
        (e) => b.st('vorne', 'ra-washi2', e * b.sw, H * 0.24, H * 0.08, -12, '#b8c9a0'),
        (e) => b.slot(e * b.sw, H * 0.56, H * 0.24, 0.80, -5, POL),
      ]);
      return b;
    },
  });

  /* ===== 3. Feenmärchen – Riss, Perlen-Herzen, Ovalspiegel, Falter ======= */
  SZENEN4.push({
    id: 'sz-feenwald', name: 'Feenmärchen', bg: 'sl-wiese',
    hint: 'Gerissene Mitte, Perlen-Herzen, goldener Ovalspiegel, Schmetterlinge – wie das Fairy-Vorbild',
    slides: 6, format: '1:1',
    bauen(k) {
      const b = neuBau(k), H = b.H;
      const gold = '#b98a3a';
      jeSlide(b, [
        (s) => {
          /* fairy-Buchstaben senkrecht + große Fotos */
          const wort = 'fairy';
          for (let i = 0; i < wort.length; i++) {
            b.tx('vorne', wort[i], b.xs(s, 0.09), H * (0.16 + i * 0.16), H * 0.10,
              { font: 'Cormorant Garamond', color: gold, rot: (i % 2 ? 6 : -6) });
          }
          b.slot(b.xs(s, 0.30), H * 0.34, H * 0.34, 0.80, -4, DUENN);
          b.slot(b.xs(s, 0.34), H * 0.74, H * 0.28, 0.80, 3, POLW);
          b.st('vorne', 'butterfly', b.xs(s, 0.52), H * 0.18, H * 0.09, -10, '#a8794a');
          b.slot(b.xs(s, 0.76), H * 0.44, H * 0.42, 0.82, 2, RISS);
          b.st('vorne', 'sk-falter-rosa', b.xs(s, 0.94), H * 0.76, H * 0.10, 12);
        },
        (s) => {
          b.tx('vorne', 'Dreamy life', b.xs(s, 0.36), H * 0.12, H * 0.055,
            { font: 'Great Vibes', color: '#f4efe2' });
          b.slot(b.xs(s, 0.38), H * 0.48, H * 0.44, 1.15, -1, RISS);
          b.slot(b.xs(s, 0.10), H * 0.66, H * 0.20, 1, -6, HERZP);
          b.slot(b.xs(s, 0.72), H * 0.26, H * 0.18, 1, 8, HERZP);
          b.st('vorne', 'sk-fluegel', b.xs(s, 0.84), H * 0.58, H * 0.16, 0);
          b.st('vorne', 'fx-glitzer', b.xs(s, 0.60), H * 0.80, H * 0.10, 0, '#e8cd8a');
          b.st('vorne', 'go-stern', b.xs(s, 0.24), H * 0.28, H * 0.05, 0);
        },
        (s) => {
          b.slot(b.xs(s, 0.26), H * 0.42, H * 0.38, 0.80, -3, OVAL);
          b.st('vorne', 'go-sonne', b.xs(s, 0.12), H * 0.16, H * 0.09, 0);
          b.slot(b.xs(s, 0.60), H * 0.30, H * 0.24, 1, 5, HERZP);
          b.slot(b.xs(s, 0.66), H * 0.68, H * 0.30, 0.78, -4, POLW);
          b.tx('vorne', 'asap', b.xs(s, 0.90), H * 0.20, H * 0.07,
            { font: 'Cormorant Garamond', color: gold, rot: 6 });
          b.slot(b.xs(s, 0.90), H * 0.52, H * 0.24, 0.80, 6, RISS);
          b.st('vorne', 'butterfly', b.xs(s, 0.86), H * 0.80, H * 0.07, -14, '#c9a15f');
          b.tx('vorne', 'Fairy tale', b.xs(s, 0.60), H * 0.92, H * 0.045,
            { font: 'Great Vibes', color: '#f4efe2' });
        },
      ]);
      jeKante(b, [
        (e) => b.slot(e * b.sw, H * 0.46, H * 0.26, 1, -4, HERZP),
        (e) => b.st('vorne', 'sk-falter-tuerkis', e * b.sw, H * 0.26, H * 0.09, 8),
        (e) => b.slot(e * b.sw, H * 0.50, H * 0.28, 0.80, 3, RISS),
        (e) => b.st('vorne', 'wo-rosa', e * b.sw, H * 0.10, H * 0.09, 0),
      ]);
      return b;
    },
  });

  /* ===== 4. Happy Place – Briefmarke, Puzzle-Wand, Notizpapier =========== */
  SZENEN4.push({
    id: 'sz-happyplace', name: 'Happy Place', bg: 'sl-pastellhimmel',
    hint: 'Briefmarke mit Poststempel, Puzzle-Wand und Polaroids – wie das „Happy Place"-Vorbild',
    slides: 6, format: '1:1',
    bauen(k) {
      const b = neuBau(k), H = b.H;
      const tinte = '#4a4238';
      jeSlide(b, [
        (s) => {
          b.tx('vorne', 'This is my Happy place', b.xs(s, 0.34), H * 0.10, H * 0.05,
            { font: 'Caveat', color: tinte });
          wurf(b, s, [
            [0.22, 0.36, 0.26, 0.80, -6, POLW],
            [0.32, 0.52, 0.26, 0.80, 4, POLW],
            [0.24, 0.80, 0.20, 0.80, -3, RISS],
            [0.66, 0.44, 0.30, 0.82, 2, POST],
          ]);
          b.st('vorne', 'hd-stern', b.xs(s, 0.50), H * 0.26, H * 0.06, 12, tinte);
          b.st('vorne', 'sz-klee', b.xs(s, 0.78), H * 0.72, H * 0.06, -8, '#4d7b3a');
          b.st('vorne', 'star', b.xs(s, 0.90), H * 0.18, H * 0.05, 0, '#d8a935');
        },
        (s) => {
          b.st('hinten', 'ra-notiz', b.xs(s, 0.30), H * 0.40, H * 0.34, 3, tinte);
          b.tx('vorne', 'Someday we will find\nwhat we are\nlooking for', b.xs(s, 0.30), H * 0.40, H * 0.028,
            { font: 'Caveat', color: tinte, rot: 3 });
          b.slot(b.xs(s, 0.32), H * 0.76, H * 0.24, 0.80, -4, POLW);
          b.slot(b.xs(s, 0.68), H * 0.34, H * 0.32, 0.80, 3, POST);
          b.slot(b.xs(s, 0.74), H * 0.74, H * 0.24, 0.80, -5, POL);
          b.st('vorne', 'hd-fotoecken', b.xs(s, 0.92), H * 0.24, H * 0.10, 6, tinte);
        },
        (s) => {
          /* Puzzle-Wand: vier Teile dicht an dicht */
          const px = 0.50, py = 0.42, ph = 0.30;
          b.slot(b.xs(s, px - 0.145), H * (py - 0.155), H * ph, 1, 0, PUZZ);
          b.slot(b.xs(s, px + 0.145), H * (py - 0.155), H * ph, 1, 0, PUZZ);
          b.slot(b.xs(s, px - 0.145), H * (py + 0.155), H * ph, 1, 0, PUZZ);
          b.slot(b.xs(s, px + 0.145), H * (py + 0.155), H * ph, 1, 0, PUZZ);
          b.slot(b.xs(s, 0.14), H * 0.56, H * 0.28, 0.80, -5, POLW);
          b.slot(b.xs(s, 0.86), H * 0.66, H * 0.26, 0.80, 4, RISS);
          b.tx('vorne', 'you are the stars in my sky', b.xs(s, 0.50), H * 0.88, H * 0.04,
            { font: 'Caveat', color: tinte });
          b.st('vorne', 'wo-weich', b.xs(s, 0.86), H * 0.16, H * 0.10, 0);
        },
      ]);
      jeKante(b, [
        (e) => b.slot(e * b.sw, H * 0.48, H * 0.28, 0.80, -3, POLW),
        (e) => b.st('vorne', 'ra-washi', e * b.sw, H * 0.28, H * 0.08, 10, '#c9b287'),
        (e) => b.slot(e * b.sw, H * 0.44, H * 0.30, 1, 0, PUZZ),
        (e) => b.st('vorne', 'wo-blau', e * b.sw, H * 0.14, H * 0.09, 0),
      ]);
      return b;
    },
  });

  /* ---------------- In Katalog und Panel hängen -------------------------- */
  SZENEN4.forEach(s => SS.SZENEN.push(s));
  if (SS.SZENEN7) {
    SS.SZENEN7.anzahl = SS.SZENEN.length;
    SS.SZENEN7.ids = SS.SZENEN.map(s => s.id);
  }

  (function () {
    const raster = document.getElementById('szenenGrid');
    if (!raster) return;
    for (const S of SZENEN4) {
      const sw = document.createElement('button');
      sw.className = 'swatch';
      const cv = document.createElement('canvas');
      cv.width = 135; cv.height = 168;
      const c = cv.getContext('2d');
      const bg = SS.BG_LIB && SS.BG_LIB.find(x => x.id === S.bg);
      if (bg && bg.paint) { try { bg.paint(c, 135, 168); } catch (e) { c.fillStyle = '#ddd'; c.fillRect(0, 0, 135, 168); } }
      try {
        const H0 = S.format === '4:5' ? 1350 : 1080;
        const kMini = { W: (S.slides || 6) * 1080, H: H0, slideW: 1080, n: S.slides || 6 };
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

  SS.SZENEN76 = { bereit: true, szenen: SZENEN4.length };
})();
