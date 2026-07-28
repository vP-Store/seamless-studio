/* Seamless Studio 6.0 – Anordnungen
   ============================================================================
   Aus acht reinen Fotorastern werden 30 Anordnungen in drei Gruppen:

     ▦ Fotoraster            klassische Verteilungen auf der Fläche
     ⇔ Panorama              Kompositionen, die die volle Breite ausnutzen
     ▤ Fertige Seiten        Fotos + Text + passender Look in einem Rutsch

   Jede Anordnung ist eine Funktion, die für Foto Nr. i seine Position liefert.
   Die Vorschaukachel benutzt **dieselbe Funktion** – die Kachel kann also gar
   nicht etwas anderes zeigen als das, was danach passiert.
   ========================================================================= */

(function () {
  const $ = SS.el;
  const S = Math.sin, C = Math.cos, PI = Math.PI;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));

  /* Gleichmäßig verteilte Position 0…1 über alle Fotos */
  const t01 = (i, N) => (N <= 1 ? 0.5 : i / (N - 1));

  /* ================================================================
     Die Anordnungen
     place(i, N, k) -> { x, y, h, rot }
       k = { W, H, slideW, n }   Maße der Leinwand
     ================================================================ */
  const L = [];
  const add = (id, name, gruppe, hint, place, extra) =>
    L.push(Object.assign({ id, name, gruppe, hint, place }, extra || {}));

  /* ---------------- ▦ Fotoraster ---------------- */

  add('reihe', 'Reihe', 'raster', 'Gleichmäßig nebeneinander, alles auf einer Höhe',
    (i, N, k) => ({ x: k.W * (i + 0.5) / N, y: k.H / 2, h: Math.min(k.H * 0.58, k.W / N * 0.9), rot: 0 }));

  add('versetzt', 'Versetzt', 'raster', 'Zickzack – der Klassiker',
    (i, N, k) => ({ x: k.W * (i + 0.5) / N, y: k.H * (i % 2 ? 0.60 : 0.40),
      h: Math.min(k.H * 0.52, k.W / N * 0.85), rot: i % 2 ? 3.5 : -3.5 }));

  add('diagonal', 'Diagonal', 'raster', 'Steigt von links nach rechts',
    (i, N, k) => ({ x: k.W * (i + 0.5) / N, y: k.H * (0.72 - 0.44 * t01(i, N)),
      h: Math.min(k.H * 0.48, k.W / N * 0.85), rot: -6 + 12 * t01(i, N) }));

  add('held', '1 groß + Rest', 'raster', 'Ein Hauptfoto, der Rest klein daneben',
    (i, N, k) => {
      if (i === 0) return { x: k.W * 0.18, y: k.H / 2, h: k.H * 0.72, rot: -2 };
      const m = Math.max(1, N - 1), j = i - 1;
      return { x: k.W * (0.40 + 0.56 * (j + 0.5) / m), y: k.H * (j % 2 ? 0.70 : 0.30),
        h: k.H * 0.34, rot: j % 2 ? 4 : -4 };
    });

  add('zweier', 'Zwei Reihen', 'raster', 'Oben und unten abwechselnd',
    (i, N, k) => {
      const sp = Math.ceil(N / 2), j = Math.floor(i / 2);
      return { x: k.W * (j + (i % 2 ? 0.72 : 0.28)) / sp, y: i % 2 ? k.H * 0.72 : k.H * 0.28,
        h: k.H * 0.40, rot: i % 2 ? 3 : -3 };
    });

  add('mittig', 'Je Slide eins', 'raster', 'Ein Foto mittig auf jeder Slide',
    (i, N, k) => ({ x: Math.min(k.n - 1, i) * k.slideW + k.slideW / 2, y: k.H / 2,
      h: k.H * 0.66, rot: 0 }));

  add('textlast', 'Text-lastig', 'raster', 'Fotos oben, viel Platz für Text darunter',
    (i, N, k) => ({ x: k.W * (i + 0.5) / N, y: k.H * 0.30, h: k.H * 0.38, rot: i % 2 ? 2.5 : -2.5 }));

  add('collage', 'Collage-Raster', 'raster', '2×2 je Slide, enge Abstände',
    (i, N, k) => {
      const je = Math.max(1, Math.ceil(N / k.n));
      const sp = Math.min(k.n - 1, Math.floor(i / je)), j = i % je;
      const cols = je > 2 ? 2 : 1, rows = Math.ceil(je / cols);
      const cx = j % cols, cy = Math.floor(j / cols);
      return { x: sp * k.slideW + k.slideW * (cx + 0.5) / cols,
        y: k.H * (cy + 0.5) / rows, h: (k.H * 0.92) / rows, rot: 0 };
    });

  add('treppe', 'Treppe', 'raster', 'Stufe für Stufe nach oben und wieder herunter',
    (i, N, k) => {
      const t = t01(i, N);
      const stufe = 1 - Math.abs(t * 2 - 1);          // 0…1…0
      return { x: k.W * (i + 0.5) / N, y: k.H * (0.70 - stufe * 0.36),
        h: k.H * 0.42, rot: 0 };
    });

  add('faecher', 'Fächer', 'raster', 'Wie aufgefächerte Karten in der Hand',
    (i, N, k) => {
      const t = t01(i, N) - 0.5;
      return { x: k.W * (i + 0.5) / N + t * k.slideW * 0.05,
        y: k.H * (0.50 + Math.abs(t) * 0.10), h: k.H * 0.54, rot: t * 26 };
    });

  add('streuung', 'Polaroid-Streuung', 'raster', 'Locker verstreut wie auf dem Tisch',
    (i, N, k) => {
      const p = (i * 2654435761) % 1000 / 1000;
      const q = (i * 1013904223 + 7) % 1000 / 1000;
      return { x: k.W * (i + 0.5) / N + (p - 0.5) * k.slideW * 0.20,
        y: k.H * (0.34 + q * 0.32), h: k.H * (0.38 + p * 0.10),
        rot: (p - 0.5) * 22 };
    });

  add('randlos', 'Randlos', 'raster', 'Jedes Foto füllt seine Slide ganz aus',
    (i, N, k) => ({ x: Math.min(k.n - 1, i) * k.slideW + k.slideW / 2, y: k.H / 2,
      h: k.H * 1.02, rot: 0 }), { rahmenLos: true });

  add('duo', 'Zwei je Slide', 'raster', 'Immer zwei Fotos nebeneinander pro Slide',
    (i, N, k) => {
      const sp = Math.min(k.n - 1, Math.floor(i / 2)), j = i % 2;
      return { x: sp * k.slideW + k.slideW * (j ? 0.72 : 0.28),
        y: k.H * (j ? 0.56 : 0.44), h: k.H * 0.50, rot: j ? 3 : -3 };
    });

  /* ---------------- ⇔ Panorama-Kompositionen ---------------- */

  add('zeitstrahl', 'Zeitstrahl', 'panorama', 'Auf einer durchgehenden Linie, abwechselnd oben und unten',
    (i, N, k) => ({ x: k.W * (i + 0.5) / N, y: k.H * (i % 2 ? 0.66 : 0.34),
      h: k.H * 0.32, rot: 0 }), { linie: true });

  add('filmstreifen', 'Filmstreifen', 'panorama', 'Gleich große Kader dicht an dicht',
    (i, N, k) => ({ x: k.W * (i + 0.5) / N, y: k.H / 2,
      h: Math.min(k.H * 0.60, k.W / N * 1.05), rot: 0 }), { film: true });

  add('reissverschluss', 'Reißverschluss', 'panorama', 'Greift oben und unten ineinander',
    (i, N, k) => ({ x: k.W * (i + 0.5) / N, y: k.H * (i % 2 ? 0.62 : 0.38),
      h: k.H * 0.56, rot: i % 2 ? 2 : -2 }));

  add('welle', 'Welle', 'panorama', 'Läuft in einer Welle durch das ganze Panorama',
    (i, N, k) => {
      const t = i / Math.max(1, N - 1);
      return { x: k.W * (i + 0.5) / N, y: k.H * (0.5 + S(t * PI * 2.2) * 0.22),
        h: k.H * 0.40, rot: C(t * PI * 2.2) * 8 };
    });

  add('bogen', 'Bogen', 'panorama', 'Ein weiter Bogen über die ganze Breite',
    (i, N, k) => {
      const t = t01(i, N);
      return { x: k.W * (i + 0.5) / N, y: k.H * (0.66 - S(t * PI) * 0.30),
        h: k.H * 0.40, rot: (t - 0.5) * 20 };
    });

  add('taldiagonal', 'Durchgehende Diagonale', 'panorama', 'Eine einzige Linie quer über alle Slides',
    (i, N, k) => ({ x: k.W * (i + 0.5) / N, y: k.H * (0.16 + 0.68 * t01(i, N)),
      h: k.H * 0.36, rot: 8 }));

  add('zoomreihe', 'Zoom-Reihe', 'panorama', 'Wächst von klein nach groß',
    (i, N, k) => {
      const t = t01(i, N);
      return { x: k.W * (i + 0.5) / N, y: k.H * (0.56 - t * 0.06),
        h: k.H * (0.24 + t * 0.48), rot: 0 };
    });

  add('fokusmitte', 'Fokus Mitte', 'panorama', 'Das mittlere Foto am größten',
    (i, N, k) => {
      const t = Math.abs(t01(i, N) - 0.5) * 2;
      return { x: k.W * (i + 0.5) / N, y: k.H / 2, h: k.H * (0.74 - t * 0.36), rot: 0 };
    });

  add('karussell', 'Karussell', 'panorama', 'Auf einer großen liegenden Ellipse',
    (i, N, k) => {
      const a = -PI / 2 + (i / N) * PI * 2;
      return { x: k.W / 2 + C(a) * k.W * 0.40, y: k.H / 2 + S(a) * k.H * 0.28,
        h: k.H * 0.30, rot: a * 180 / PI * 0.12 };
    });

  add('band', 'Laufendes Band', 'panorama', 'Dicht überlappend wie ein Filmband schräg im Bild',
    (i, N, k) => ({ x: k.W * (i + 0.4) / N, y: k.H * (0.5 + (t01(i, N) - 0.5) * 0.18),
      h: k.H * 0.52, rot: -7 }));

  /* ---------------- ▤ Fertige Seiten ---------------- */

  add('cover', 'Cover + Inhalt', 'seite', 'Titelseite, dann ein Foto je Slide',
    (i, N, k) => {
      if (i === 0) return { x: k.slideW * 0.5, y: k.H * 0.56, h: k.H * 0.62, rot: 0 };
      const sp = Math.min(k.n - 1, i);
      return { x: sp * k.slideW + k.slideW / 2, y: k.H * 0.46, h: k.H * 0.60, rot: 0 };
    }, {
      texte: [
        { slide: 0, y: 0.13, size: 0.085, font: 'Playfair Display', content: 'DEIN TITEL', spacing: 6 },
        { slide: 0, y: 0.90, size: 0.038, font: 'Poppins', content: 'weiterwischen  →' },
      ],
    });

  add('vorhernachher', 'Vorher / Nachher', 'seite', 'Zwei Fotos gegenübergestellt',
    (i, N, k) => ({ x: k.W * (i % 2 ? 0.74 : 0.26), y: k.H * 0.54, h: k.H * 0.62, rot: 0 }),
    {
      texte: [
        { xr: 0.26, y: 0.14, size: 0.055, font: 'Poppins', content: 'VORHER', spacing: 4 },
        { xr: 0.74, y: 0.14, size: 0.055, font: 'Poppins', content: 'NACHHER', spacing: 4 },
      ],
    });

  add('zitat', 'Zitatseite', 'seite', 'Ein Foto, viel Weißraum, ein Zitat',
    (i, N, k) => ({ x: k.slideW * (i + 0.5), y: k.H * 0.30, h: k.H * 0.34, rot: i % 2 ? 2 : -2 }),
    {
      texte: [
        { slide: 0, y: 0.62, size: 0.070, font: 'Cormorant Garamond', italic: true, content: '„Der beste Moment\nist jetzt."' },
        { slide: 0, y: 0.85, size: 0.030, font: 'Poppins', content: '— unbekannt', spacing: 3 },
      ],
    });

  add('schritte', 'Schritt für Schritt', 'seite', 'Nummerierte Anleitung, ein Schritt je Slide',
    (i, N, k) => {
      const sp = Math.min(k.n - 1, i);
      return { x: sp * k.slideW + k.slideW / 2, y: k.H * 0.44, h: k.H * 0.54, rot: 0 };
    },
    { nummern: true, texte: [{ slide: 0, y: 0.88, size: 0.036, font: 'Poppins', content: 'So geht es' }] });

  add('angebot', 'Angebot', 'seite', 'Bild, Aussage, Handlungsaufruf',
    (i, N, k) => ({ x: k.slideW * (i + 0.5), y: k.H * 0.38, h: k.H * 0.46, rot: 0 }),
    {
      texte: [
        { slide: 0, y: 0.72, size: 0.060, font: 'Poppins', bold: true, content: 'NUR DIESE WOCHE' },
        { slide: 0, y: 0.84, size: 0.036, font: 'Poppins', content: 'Alle Angebote im Profil-Link' },
      ],
    });

  add('reise', 'Reisetagebuch', 'seite', 'Ort, Datum, Bilderfolge',
    (i, N, k) => ({ x: k.W * (i + 0.5) / N, y: k.H * (i % 2 ? 0.58 : 0.42), h: k.H * 0.46,
      rot: i % 2 ? 3 : -3 }),
    {
      texte: [
        { slide: 0, y: 0.12, size: 0.062, font: 'Cormorant Garamond', italic: true, content: 'Lissabon' },
        { slide: 0, y: 0.21, size: 0.028, font: 'Poppins', content: 'Juli 2026', spacing: 5 },
      ],
    });

  add('vorstellung', 'Vorstellung', 'seite', 'Ein großes Bild und ein paar Zeilen über dich',
    (i, N, k) => {
      if (i === 0) return { x: k.slideW * 0.34, y: k.H * 0.52, h: k.H * 0.72, rot: -2 };
      const sp = Math.min(k.n - 1, i);
      return { x: sp * k.slideW + k.slideW / 2, y: k.H * 0.5, h: k.H * 0.56, rot: 0 };
    },
    {
      texte: [
        { xr: 0.76, y: 0.36, size: 0.055, font: 'Playfair Display', content: 'Hallo,\nich bin …' },
        { xr: 0.76, y: 0.60, size: 0.028, font: 'Poppins', content: 'Ein Satz darüber,\nwas du machst.' },
      ],
    });

  add('rezept', 'Rezept', 'seite', 'Titel oben, Bilder in der Mitte, Schritte unten',
    (i, N, k) => ({ x: k.W * (i + 0.5) / N, y: k.H * 0.46, h: k.H * 0.42, rot: 0 }),
    {
      texte: [
        { slide: 0, y: 0.13, size: 0.060, font: 'Playfair Display', content: 'Sonntagskuchen' },
        { slide: 0, y: 0.84, size: 0.030, font: 'Poppins', content: '30 Min · 8 Stücke', spacing: 4 },
      ],
    });

  SS.LAYOUTS = L;
  SS.LAYOUT_GRUPPEN = [
    { id: 'raster',   name: '▦ Fotoraster' },
    { id: 'panorama', name: '⇔ Panorama' },
    { id: 'seite',    name: '▤ Fertige Seiten' },
  ];

  /* ================================================================
     Anwenden
     ================================================================ */
  SS.ui = SS.ui || {};
  SS.ui.applyLayout = function (id) {
    const st = SS.state;
    const def = L.find(x => x.id === id);
    if (!def) return;
    const fotos = st.elements.filter(e => (e.type === 'photo' || e.type === 'video') && !e.hidden && !e.locked);
    if (!fotos.length) return SS.toast('Füge zuerst Fotos hinzu', 2600, 'warn');

    const k = SS.canvasSize();
    const N = fotos.length;
    fotos.forEach((p, i) => {
      const r = def.place(i, N, k);
      p.x = r.x; p.y = r.y; p.rot = r.rot || 0;
      if (p.type === 'video') { const ar = (p.w || 1) / (p.h || 1); p.h = r.h; p.w = r.h * ar; }
      else p.h = r.h;
      if (def.rahmenLos && p.frame) { p.frame.style = 'none'; p.frame.border = 0; p.frame.shadow = 0; }
      if (def.film && p.frame) { p.frame.style = 'none'; p.frame.border = 0; }
      SS.invalidateEl && SS.invalidateEl(p);
    });

    // Textbausteine der „fertigen Seiten"
    const neu = [];
    if (def.texte) {
      const dunkel = SS.ui.bgIstDunkel ? SS.ui.bgIstDunkel() : false;
      const farbe = dunkel ? '#f2e9dc' : '#4a3d36';
      for (const t of def.texte) {
        const x = t.xr !== undefined ? k.W * t.xr : (t.slide || 0) * k.slideW + k.slideW / 2;
        neu.push(SS.normalizeEl({
          id: SS.uid(), type: 'text', content: t.content,
          x, y: k.H * t.y, rot: 0,
          font: t.font || 'Poppins', size: Math.round(k.H * t.size),
          color: farbe, bold: !!t.bold, italic: !!t.italic, align: 'center',
          letterSpacing: t.spacing || 0, lineHeight: 1.3, opacity: 1,
        }));
      }
    }
    if (def.nummern) {
      for (let i = 0; i < Math.min(k.n, N); i++) {
        neu.push(SS.normalizeEl({
          id: SS.uid(), type: 'text', content: String(i + 1),
          x: i * k.slideW + k.slideW * 0.5, y: k.H * 0.12, rot: 0,
          font: 'Playfair Display', size: Math.round(k.H * 0.085),
          color: '#C8553D', align: 'center', letterSpacing: 0, lineHeight: 1.2, opacity: 1,
        }));
      }
    }
    neu.forEach(e => st.elements.push(e));

    SS.pushHistory('Anordnung: ' + def.name);
    SS.ui.refreshLayers && SS.ui.refreshLayers();
    SS.ui.showProps && SS.ui.showProps();
    SS.requestRender();
    SS.toast('Anordnung „' + def.name + '" angewendet' + (neu.length ? ' – Text antippen und überschreiben' : ''),
      neu.length ? 3600 : 2400, 'ok');
    if (window.matchMedia('(max-width: 760px)').matches) {
      const sp = $('sidepanel'); if (sp) sp.classList.remove('open');
    }
  };

  /* ================================================================
     Vorschaukacheln – gezeichnet mit derselben place()-Funktion
     ================================================================ */
  function vorschau(def, w, h) {
    const cv = SS.makeCanvas(w, h);
    const c = cv.getContext('2d');
    c.fillStyle = '#efe6dc'; c.fillRect(0, 0, w, h);

    // virtuelle Leinwand: 3 Slides im Verhältnis 4:5
    const n = 3, sh = 1350, sw = 1080;
    const k = { W: sw * n, H: sh, slideW: sw, n };
    const sc = Math.min(w / k.W, h / k.H);
    const ox = (w - k.W * sc) / 2, oy = (h - k.H * sc) / 2;

    // Schnittkanten
    c.strokeStyle = 'rgba(200,85,61,.35)';
    c.setLineDash([3, 3]); c.lineWidth = 1;
    for (let i = 1; i < n; i++) {
      const x = ox + i * sw * sc;
      c.beginPath(); c.moveTo(x, oy); c.lineTo(x, oy + sh * sc); c.stroke();
    }
    c.setLineDash([]);

    const N = def.gruppe === 'seite' ? 3 : (def.id === 'collage' || def.id === 'duo' ? 6 : 5);

    if (def.linie) {
      c.strokeStyle = 'rgba(120,95,80,.5)'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(ox, oy + sh * sc / 2); c.lineTo(ox + k.W * sc, oy + sh * sc / 2); c.stroke();
    }

    for (let i = 0; i < N; i++) {
      const r = def.place(i, N, k);
      const ph = r.h * sc, pw = ph * 0.78;
      c.save();
      c.translate(ox + r.x * sc, oy + r.y * sc);
      c.rotate((r.rot || 0) * PI / 180);
      c.fillStyle = 'rgba(40,28,22,.16)';
      c.fillRect(-pw / 2 + 1.5, -ph / 2 + 2, pw, ph);
      c.fillStyle = def.rahmenLos || def.film ? '#c9bfae' : '#fff';
      c.fillRect(-pw / 2, -ph / 2, pw, ph);
      if (!def.rahmenLos && !def.film) {
        c.fillStyle = '#c9bfae';
        c.fillRect(-pw / 2 + 2, -ph / 2 + 2, pw - 4, ph - 4);
      }
      c.restore();
    }

    // Textbalken andeuten
    const balken = (x, y, br, hh) => {
      c.fillStyle = 'rgba(74,61,54,.55)';
      c.fillRect(ox + x * sc - br * sc / 2, oy + y * sc, br * sc, Math.max(1.5, hh * sc));
    };
    if (def.texte) {
      for (const t of def.texte) {
        const x = t.xr !== undefined ? k.W * t.xr : (t.slide || 0) * k.slideW + k.slideW / 2;
        const zeilen = String(t.content).split('\n').length;
        for (let z = 0; z < zeilen; z++) {
          balken(x, k.H * t.y + z * k.H * t.size * 1.3, k.slideW * (0.30 + t.size * 4), k.H * t.size * 0.55);
        }
      }
    }
    if (def.nummern) {
      for (let i = 0; i < n; i++) balken(i * sw + sw / 2, k.H * 0.10, sw * 0.08, k.H * 0.06);
    }
    return cv;
  }

  /* ================================================================
     Gitter mit Gruppenreitern
     ================================================================ */
  let gruppe = 'raster';
  function bauen() {
    const g = $('layoutGrid');
    if (!g) return;

    let tabs = document.getElementById('layoutTabs');
    if (!tabs) {
      tabs = document.createElement('div');
      tabs.id = 'layoutTabs';
      tabs.className = 'subtabs';
      g.parentNode.insertBefore(tabs, g);
    }
    tabs.innerHTML = '';
    SS.LAYOUT_GRUPPEN.forEach(gr => {
      const b = document.createElement('button');
      b.textContent = gr.name + ' (' + L.filter(x => x.gruppe === gr.id).length + ')';
      if (gr.id === gruppe) b.classList.add('active');
      b.onclick = () => { gruppe = gr.id; bauen(); };
      tabs.appendChild(b);
    });

    g.innerHTML = '';
    L.filter(x => x.gruppe === gruppe).forEach(def => {
      const sw = document.createElement('button');
      sw.className = 'swatch';
      sw.title = def.hint;
      sw.appendChild(vorschau(def, 270, 216));
      const lb = document.createElement('label');
      lb.textContent = def.name;
      sw.appendChild(lb);
      sw.onclick = () => SS.ui.applyLayout(def.id);
      g.appendChild(sw);
    });

    let h = g.parentNode.querySelector('.layout-hint');
    if (!h) {
      h = document.createElement('p');
      h.className = 'hint layout-hint';
      g.parentNode.insertBefore(h, g.nextSibling);
    }
    h.textContent = gruppe === 'seite'
      ? 'Diese Anordnungen setzen auch Textfelder – antippen und überschreiben.'
      : 'Die Vorschau zeigt drei Slides. Die Anordnung passt sich deiner Slide- und Fotoanzahl an.';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bauen);
  else bauen();
  SS.ui.buildLayoutGrid = bauen;
})();
