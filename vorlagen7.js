/* Seamless Studio – Fertige Vorlagen
   ============================================================================
   Bisher gab es zwei getrennte Dinge: die Anordnungen (Position + ein paar
   Textbausteine) und die Vorlagen im Studio-Panel (Hintergrund + Rahmen +
   Filter + Schrift). Fuer die Vorbilder aus Instagram reicht keins von
   beiden – dort haengt alles zusammen: ein Foto randlos, darauf eine grosse
   gelbe Serifenzeile, darunter Kapitaelchen, unten eine Fusszeile.

   Diese Datei bringt beides in einer Beschreibung zusammen:

     bg        Hintergrund
     filter    Filtervorgabe fuer alle Fotos
     rahmen    Rahmen je Foto, reihum
     platz     Position je Foto  (i, N, k) -> {x, y, h, rot}
     texte     Textbausteine mit eigener Schrift, Groesse, Farbe, Drehung
     deko      Sticker mit fester Stelle
     slides    empfohlene Slidezahl

   Angewendet wird alles in einem Rutsch. Was schon in der Szene liegt,
   bleibt liegen – nur Fotos werden neu gesetzt.
   ========================================================================= */

(function () {
  if (!SS.LAYOUTS || !SS.ui) return;

  /* Wie viele Fotos kommen auf eine Slide, wenn N Fotos auf k.n Slides
     sollen? Aufgerundet, mindestens eines. Damit passt sich jede Vorlage an
     die gewaehlte Slidezahl an, statt eine feste Zahl anzunehmen. */
  function verteilen(i, N, k, hoechstens) {
    const proSlide = Math.min(hoechstens || 99,
      Math.max(1, Math.ceil(N / Math.max(1, k.n))));
    return { proSlide, sp: Math.min(k.n - 1, Math.floor(i / proSlide)),
             j: i % proSlide };
  }

  const rel = (k, xr) => k.W * xr;
  const auf = (k, s, xr) => s * k.slideW + k.slideW * xr;

  /* ---------------------------------------------------------------- Vorlagen */
  const V = [];
  const add = (o) => V.push(o);

  /* ===== 1. Editorial mit grosser Farbschrift ===== */
  function editorial(id, name, farbe, ton, bgfilter, titel, unter) {
    add({
      id, name, gruppe: 'editorial',
      hint: 'Randloses Foto, grosse Serifenzeile, Fusszeile',
      slides: 5, filter: bgfilter, rahmen: ['none'],
      randlos: true,
      /* Damit die weisse Schrift auf hellen Fotos lesbar bleibt, wird das
         Bild abgedunkelt und leicht vignettiert – so machen es die Vorbilder
         auch. Ohne das verschwindet die Unterzeile im Schnee. */
      filterWerte: { brightness: 70, contrast: 106, saturate: 88, vignette: 45 },
      platz: (i, N, k) => ({
        x: k.slideW * (Math.min(k.n - 1, i) + 0.5), y: k.H / 2,
        h: k.H * 1.001, rot: 0,
      }),
      texte: [
        { slide: 0, xr: 0.07, y: 0.30, size: 0.115, font: 'Playfair Display',
          color: farbe, align: 'left', lineHeight: 1.06, content: titel },
        { slide: 0, xr: 0.07, y: 0.585, size: 0.026, font: 'Poppins',
          color: ton, align: 'left', spacing: 3, lineHeight: 1.5, content: unter },
        { slide: 0, xr: 0.07, y: 0.93, size: 0.020, font: 'Poppins',
          color: ton, align: 'left', spacing: 4, content: 'WWW.DEINESEITE.DE' },
        { jedeSlide: true, xr: 0.93, y: 0.93, size: 0.020, font: 'Poppins',
          color: ton, align: 'right', spacing: 4, content: 'WEITER →' },
      ],
      deko: [],
    });
  }
  editorial('ed-gelb', 'Gelbe Schlagzeile', '#F2D14E', 'rgba(255,255,255,.86)', 'matte',
    'Habits That\nChanged\nMy Life.',
    'KLEINE ÄNDERUNGEN MIT GROSSER WIRKUNG,\nDIE DEN ALLTAG LEICHTER MACHEN.');
  editorial('ed-creme', 'Creme Schlagzeile', '#F6EEDC', 'rgba(255,255,255,.80)', 'fade',
    'Was mir\nRuhe gibt.',
    'SECHS DINGE, DIE ICH JEDEN TAG MACHE –\nUND WARUM SIE WIRKEN.');
  editorial('ed-terra', 'Terrakotta Schlagzeile', '#E8A87C', 'rgba(255,255,255,.84)', 'warm',
    'Der Weg\nnach oben.',
    'EINE WOCHE IN DEN BERGEN,\nIN FÜNF BILDERN ERZÄHLT.');

  /* ===== 2. Scrapbook / Photo Dump ===== */
  add({
    id: 'sb-dump', name: 'Photo Dump', gruppe: 'scrapbook',
    hint: 'Ausgerissenes Papier, Klebeband, schiefe Bilder',
    slides: 5, bg: 'tx-kraft-0', filter: 'softfilm',
    rahmen: ['riss', 'washi', 'polaroid', 'riss', 'photobooth'],
    platz: (i, N, k) => {
      const { proSlide, sp, j } = verteilen(i, N, k, 4);
      const t = proSlide === 1 ? 0.5 : j / (proSlide - 1);
      const gross = j % 2 === 0;
      return { x: sp * k.slideW + k.slideW * (0.24 + 0.52 * t),
               y: k.H * (gross ? 0.36 : 0.62),
               b: k.slideW * (gross ? 0.52 : 0.46) * (proSlide > 2 ? 0.82 : 1),
               hmax: k.H * 0.54, rot: gross ? -6 - (i % 3) : 5 + (i % 3) };
    },
    texte: [
      { slide: 0, xr: 0.5, y: 0.10, size: 0.075, font: 'Anton', color: '#33302b',
        align: 'center', spacing: 2, rot: -3, content: 'PHOTO DUMP' },
      { slide: 0, xr: 0.5, y: 0.165, size: 0.026, font: 'Caveat', color: '#6b5b4d',
        align: 'center', content: 'ein paar Tage im Juli' },
    ],
    deko: [
      { kind: 'heart-fill', xr: 0.10, y: 0.80, s: 0.11, rot: -12, farbe: '#d8695f', op: 0.9 },
      { kind: 'bl-margerite-weiss', xr: 0.90, y: 0.16, s: 0.13, rot: 10, op: 1 },
      { kind: 'washi1', xr: 0.42, y: 0.90, s: 0.16, rot: -4, farbe: '#c9b89a', op: 0.85 },
      { kind: 'bl-kirschbluete-rosa', xr: 0.62, y: 0.86, s: 0.10, rot: -8, op: 1 },
      { kind: 'sy-funken-03', xr: 0.24, y: 0.24, s: 0.06, rot: 0, farbe: '#c9a15f', op: 0.9 },
    ],
  });

  add({
    id: 'sb-beige', name: 'Beige Scrapbook', gruppe: 'scrapbook',
    hint: 'Ruhiger, mit Handschrift und Blumen',
    slides: 5, bg: 'tx-leinen-1', filter: 'fade',
    rahmen: ['polaroid-w', 'riss', 'washi'],
    platz: (i, N, k) => {
      const { proSlide, sp, j } = verteilen(i, N, k, 4);
      const t = proSlide === 1 ? 0.5 : j / (proSlide - 1);
      return { x: sp * k.slideW + k.slideW * (0.26 + 0.48 * t),
               y: k.H * (j % 2 ? 0.62 : 0.34),
               b: k.slideW * 0.48 * (proSlide > 2 ? 0.8 : 1),
               hmax: k.H * 0.50, rot: j % 2 ? 4 : -4 };
    },
    texte: [
      { slide: 0, xr: 0.5, y: 0.90, size: 0.038, font: 'Caveat', color: '#54473b',
        align: 'center', content: 'Beautiful moments…' },
    ],
    deko: [
      { kind: 'bl-margerite-weiss', xr: 0.13, y: 0.14, s: 0.15, rot: -8, op: 1 },
      { kind: 'bl-plumeria-creme', xr: 0.88, y: 0.82, s: 0.13, rot: 12, op: 1 },
      { kind: 'bl-lavendel-lila', xr: 0.50, y: 0.14, s: 0.12, rot: 4, op: 0.95 },
    ],
  });

  /* ===== 3. Polaroid-Tagebuch und Fotoautomat ===== */
  add({
    id: 'pl-tagebuch', name: 'Polaroid-Tagebuch', gruppe: 'polaroid',
    hint: 'Schiefe Polaroids, Handschrift, Sterne',
    slides: 5, bg: 'aq-ivory-2', filter: 'softfilm',
    rahmen: ['polaroid-w'],
    platz: (i, N, k) => {
      const { proSlide, sp, j } = verteilen(i, N, k, 4);
      const t = proSlide === 1 ? 0.5 : j / (proSlide - 1);
      return { x: sp * k.slideW + k.slideW * (0.24 + 0.52 * t),
               y: k.H * (0.42 + (j % 2) * 0.22),
               b: k.slideW * (proSlide > 2 ? 0.30 : 0.40),
               hmax: k.H * 0.42, rot: [-7, 5, -3, 6][j % 4] };
    },
    texte: [
      { slide: 0, xr: 0.5, y: 0.12, size: 0.070, font: 'Cormorant Garamond',
        color: '#3f382f', align: 'center', italic: true, content: 'mein monat' },
      { slide: 0, xr: 0.5, y: 0.195, size: 0.040, font: 'Caveat',
        color: '#8a6b52', align: 'center', content: 'in bildern' },
      { jedeSlide: true, xr: 0.5, y: 0.94, size: 0.020, font: 'Poppins',
        color: '#7b6f60', align: 'center', spacing: 5, content: '@DEINPROFIL' },
    ],
    deko: [
      { kind: 'sy-funken-05', xr: 0.16, y: 0.30, s: 0.07, rot: 0, farbe: '#e8b53a', op: 1 },
      { kind: 'sy-funken-05', xr: 0.62, y: 0.20, s: 0.05, rot: 0, farbe: '#e8b53a', op: 1 },
      { kind: 'sy-funken-05', xr: 0.86, y: 0.72, s: 0.06, rot: 0, farbe: '#e8b53a', op: 1 },
      { kind: 'sy-funken-05', xr: 0.36, y: 0.80, s: 0.05, rot: 0, farbe: '#e8b53a', op: 1 },
    ],
  });

  add({
    id: 'pl-automat', name: 'Fotoautomat', gruppe: 'polaroid',
    hint: 'Vier Bilder als Streifen, wie aus der Kabine',
    slides: 4, bg: 'tx-papier-1', filter: 'bw',
    rahmen: ['photobooth'],
    platz: (i, N, k) => {
      /* Drei Bilder je Streifen, nicht vier: bei Hochformat-Fotos wuerde ein
         Viererstreifen so schmal, dass man nichts mehr erkennt. */
      const { proSlide, sp, j } = verteilen(i, N, k, 4);
      const hoehe = 0.86 / proSlide;
      return { x: sp * k.slideW + k.slideW * 0.5,
               y: k.H * (0.07 + hoehe * (j + 0.5)),
               b: k.slideW * 0.42, hmax: k.H * hoehe * 0.86,
               ar: (k.slideW * 0.42) / (k.H * hoehe * 0.86), rot: 0 };
    },
    texte: [
      { jedeSlide: true, xr: 0.5, y: 0.975, size: 0.020, font: 'Courier Prime',
        color: '#4a4540', align: 'center', spacing: 4, content: 'PHOTOBOOTH · 2026' },
    ],
    deko: [],
  });

  /* ===== 4. Doodle-Raster mit Handschrift ===== */
  add({
    id: 'dd-raster', name: 'Doodle-Raster', gruppe: 'doodle',
    hint: 'Sechs Bilder je Slide, Handschrift und Kritzeleien',
    slides: 3, bg: 'aq-ivory-1', filter: 'original',
    rahmen: ['thin'],
    platz: (i, N, k) => {
      const { proSlide, sp, j } = verteilen(i, N, k, 8);
      const spalten = proSlide <= 2 ? 1 : 2;
      const zeilen = Math.ceil(proSlide / spalten);
      const sx = j % spalten, sy = Math.floor(j / spalten);
      const zb = 0.86 / spalten, zh = 0.70 / zeilen;
      return { x: sp * k.slideW + k.slideW * (0.07 + zb * (sx + 0.5)),
               y: k.H * (0.22 + zh * (sy + 0.5)),
               b: k.slideW * zb * 0.92, hmax: k.H * zh * 0.90,
               ar: (k.slideW * zb * 0.92) / (k.H * zh * 0.90), rot: 0 };
    },
    texte: [
      { slide: 0, xr: 0.28, y: 0.115, size: 0.030, font: 'Caveat',
        color: '#2f2c28', align: 'center', content: 'so wird\nder Herbst schön' },
      { slide: 0, xr: 0.72, y: 0.115, size: 0.024, font: 'Poppins',
        color: '#54504a', align: 'center', lineHeight: 1.4,
        content: 'sechs kleine Ideen\nfür graue Tage' },
      { jedeSlide: true, xr: 0.5, y: 0.965, size: 0.018, font: 'Poppins',
        color: '#6b665e', align: 'center', spacing: 5, content: 'WEITERWISCHEN →' },
    ],
    deko: [
      { kind: 'scribble', xr: 0.12, y: 0.52, s: 0.10, rot: -14, farbe: '#3a352f', op: 0.8 },
      { kind: 'bl-margerite-gelb', xr: 0.88, y: 0.40, s: 0.09, rot: 8, op: 1 },
      { kind: 'sy-funken-01', xr: 0.50, y: 0.50, s: 0.05, rot: 0, farbe: '#3a352f', op: 0.7 },
    ],
  });

  add({
    id: 'dd-zitat', name: 'Doodle-Zitat', gruppe: 'doodle',
    hint: 'Ein Bild, viel Weissraum, Handschrift',
    slides: 5, bg: 'aq-ivory-1', filter: 'fade',
    rahmen: ['thin'],
    platz: (i, N, k) => ({
      x: k.slideW * (Math.min(k.n - 1, i) + 0.5), y: k.H * 0.60,
      b: k.slideW * 0.62, hmax: k.H * 0.56, rot: i % 2 ? 2 : -2,
    }),
    texte: [
      { jedeSlide: true, xr: 0.5, y: 0.20, size: 0.052, font: 'Caveat',
        color: '#2f2c28', align: 'center', lineHeight: 1.25,
        content: 'hier steht dein Satz' },
    ],
    deko: [
      { kind: 'sy-funken-02', xr: 0.14, y: 0.16, s: 0.05, rot: 0, farbe: '#8a7a60', op: 0.8 },
      { kind: 'bl-kosmee-rosa', xr: 0.88, y: 0.18, s: 0.10, rot: -10, op: 1 },
    ],
  });

  /* ===== 5. Durchgehende Bilder ueber mehrere Slides ===== */
  add({
    id: 'pa-durchgehend', name: 'Durchgehend', gruppe: 'panorama',
    hint: 'Alle Fotos nebeneinander ueber die ganze Breite – die Schnitte fallen mitten hinein',
    slides: 5, filter: 'original', rahmen: ['none'], randlos: true,
    filterWerte: { brightness: 88, contrast: 104, saturate: 98, vignette: 22 },
    platz: (i, N, k) => {
      /* Jedes Foto bekommt genau W/N der Breite und die volle Hoehe. Damit
         ist das Panorama lueckenlos gefuellt, egal wie viele Fotos und wie
         viele Slides gewaehlt sind. */
      const b = k.W / N;
      return { x: b * (i + 0.5), y: k.H / 2, b, hmax: 1e9,
               ar: b / k.H, rot: 0 };
    },
    texte: [
      { slide: 0, xr: 0.08, y: 0.12, size: 0.062, font: 'Julius Sans One',
        color: '#ffffff', align: 'left', spacing: 8, content: 'DEIN TITEL' },
      { jedeSlide: true, xr: 0.92, y: 0.94, size: 0.019, font: 'Poppins',
        color: 'rgba(255,255,255,.85)', align: 'right', spacing: 4, content: 'WEITER →' },
    ],
    deko: [],
  });

  add({
    id: 'pa-vollbild', name: 'Ein Bild über alles', gruppe: 'panorama',
    hint: 'Das erste Foto laeuft ueber alle Slides, die uebrigen liegen als Polaroids darauf',
    slides: 5, filter: 'matte', rahmen: (i) => (i === 0 ? 'none' : 'polaroid-w'),
    filterWerte: { brightness: 78, contrast: 106, saturate: 92, vignette: 30 },
    platz: (i, N, k) => {
      if (i === 0) {
        return { x: k.W / 2, y: k.H / 2, b: k.W * 1.002, hmax: 1e9,
                 ar: k.W / k.H, rot: 0 };
      }
      const rest = Math.max(1, N - 1);
      const t = (i - 1) / rest;
      return { x: k.W * (0.16 + 0.68 * t) + k.slideW * 0.06,
               y: k.H * (i % 2 ? 0.66 : 0.34), b: k.slideW * 0.34,
               hmax: k.H * 0.40, ar: 0.8, rot: i % 2 ? 5 : -5 };
    },
    texte: [
      { slide: 0, xr: 0.5, y: 0.50, size: 0.090, font: 'Playfair Display',
        color: '#ffffff', align: 'center', lineHeight: 1.1, content: 'Ein Tag,\nder bleibt' },
    ],
    deko: [],
  });

  add({
    id: 'pa-band', name: 'Bildband', gruppe: 'panorama',
    hint: 'Ein breites Band aus Fotos, darueber und darunter Platz fuer Text',
    slides: 5, bg: 'aq-ivory-1', filter: 'softfilm', rahmen: ['none'],
    platz: (i, N, k) => {
      const b = k.W / N;
      const hoehe = k.H * 0.46;
      return { x: b * (i + 0.5), y: k.H * 0.52, b, hmax: hoehe,
               ar: b / hoehe, rot: 0 };
    },
    texte: [
      { slide: 0, xr: 0.5, y: 0.16, size: 0.070, font: 'Cormorant Garamond',
        color: '#3f382f', align: 'center', italic: true, content: 'eine Reise' },
      { jedeSlide: true, xr: 0.5, y: 0.88, size: 0.022, font: 'Poppins',
        color: '#6b6154', align: 'center', spacing: 6, content: 'WEITERWISCHEN →' },
    ],
    deko: [
      { kind: 'bl-lavendel-lila', xr: 0.035, y: 0.17, s: 0.17, rot: -8, op: 0.95 },
      { kind: 'bl-margerite-weiss', xr: 0.965, y: 0.17, s: 0.12, rot: 8, op: 0.95 },
      { kind: 'bl-kosmee-rosa', xr: 0.035, y: 0.85, s: 0.11, rot: 6, op: 0.9 },
      { kind: 'bl-plumeria-creme', xr: 0.965, y: 0.85, s: 0.12, rot: -6, op: 0.9 },
    ],
  });

  add({
    id: 'pa-halb', name: 'Halb und halb', gruppe: 'panorama',
    hint: 'Bild und Text teilen sich jede Slide, abwechselnd links und rechts',
    slides: 5, bg: 'tx-leinen-0', filter: 'fade', rahmen: ['none'],
    platz: (i, N, k) => {
      /* Immer dieselbe Seite: bei abwechselnden Seiten stossen der Text von
         Slide 1 und der von Slide 2 an der Schnittkante aneinander und das
         Auge liest sie als einen Block. */
      const sp = Math.min(k.n - 1, i);
      return { x: sp * k.slideW + k.slideW * 0.28, y: k.H * 0.5,
               b: k.slideW * 0.56, hmax: k.H * 1.02,
               ar: (k.slideW * 0.56) / (k.H * 1.02), rot: 0 };
    },
    texte: [
      /* Das Bild sitzt auf geraden Slides links, auf ungeraden rechts –
         der Text jeweils gegenueber, sonst liegt er auf dem Foto. */
      { jedeSlide: true, xr: 0.78, y: 0.44, size: 0.040,
        font: 'Cormorant Garamond', color: '#3d362e', align: 'center',
        italic: true, lineHeight: 1.35, content: 'ein Satz\nzu diesem Bild' },
      { jedeSlide: true, xr: 0.78, y: 0.60, size: 0.018,
        font: 'Poppins', color: '#7a7266', align: 'center', spacing: 5,
        content: 'MEHR DAZU IM PROFIL' },
    ],
    deko: [],
  });

  /* ===== 7. Vorlagen, die aus EINEM Video eine Leinwand machen =====
     Diese Vorlagen setzen keine Fotos. Sie stellen die Video-Leinwand ein
     (Modus, Format, Slidezahl, Überblendung) und legen nur noch Schrift
     darüber. Ein Video hinein, ein Tipp – fertig ist das Panorama.

     Gemessen an den drei Grok-Videos (Nahtfaktoren am Schnitt, 1.0 = so
     unauffällig wie das Bild selbst):
       füllen  1.2 – 7.0     spiegeln  0.8 – 3.7     Zeitpanorama  0.7 – 1.3
     Deshalb ist „zeit" die Vorgabe; „spiegel" nur dort, wo das Motiv keine
     Geschichte erzählt (Wasser, Wolken, Rauch, Bokeh). */
  function videovorlage(o) {
    add(Object.assign({ gruppe: 'video', slides: 5 }, o));
  }

  videovorlage({
    id: 'vv-zeit', name: 'Zeitpanorama',
    hint: 'Jede Slide eine andere Sekunde desselben Videos – links Anfang, rechts Ende',
    video: { modus: 'zeit', feder: 0.42, spanne: 1.0, format: '4:5', slides: 5,
             stil: 'pan', out: '4:5' },
    texte: [
      { slide: 0, xr: 0.5, y: 0.16, size: 0.072, font: 'Playfair Display',
        color: '#F6EEDC', align: 'center', lineHeight: 1.08, shadow: true,
        content: 'Eine Nacht\nin fünf Bildern' },
      { slide: 0, xr: 0.5, y: 0.30, size: 0.020, font: 'Poppins',
        color: 'rgba(255,255,255,.82)', align: 'center', spacing: 5, shadow: true,
        content: 'WISCHEN →' },
      { jedeSlide: true, xr: 0.5, y: 0.945, size: 0.017, font: 'Poppins',
        color: 'rgba(255,255,255,.72)', align: 'center', spacing: 4, shadow: true,
        content: '@DEINPROFIL' },
    ],
    deko: [
      { kind: 'sy-funken-05', xr: 0.5, y: 0.365, s: 0.035, rot: 0, farbe: '#F2D14E', op: 0.9 },
    ],
  });

  videovorlage({
    id: 'vv-gelb', name: 'Video mit gelber Zeile',
    hint: 'Wie die Editorial-Vorlage, aber das Foto ist ein laufendes Video',
    video: { modus: 'zeit', feder: 0.46, spanne: 1.0, format: '4:5', slides: 5,
             stil: 'pan', out: '4:5' },
    texte: [
      { slide: 0, xr: 0.07, y: 0.30, size: 0.112, font: 'Playfair Display',
        color: '#F2D14E', align: 'left', lineHeight: 1.06, shadow: true,
        content: 'Habits That\nChanged\nMy Life.' },
      { slide: 0, xr: 0.07, y: 0.585, size: 0.025, font: 'Poppins',
        color: 'rgba(255,255,255,.88)', align: 'left', spacing: 3, lineHeight: 1.5,
        shadow: true,
        content: 'KLEINE ÄNDERUNGEN MIT GROSSER WIRKUNG,\nDIE DEN ALLTAG LEICHTER MACHEN.' },
      { slide: 0, xr: 0.07, y: 0.93, size: 0.019, font: 'Poppins',
        color: 'rgba(255,255,255,.75)', align: 'left', spacing: 4, shadow: true,
        content: 'WWW.DEINESEITE.DE' },
      { jedeSlide: true, xr: 0.93, y: 0.93, size: 0.019, font: 'Poppins',
        color: 'rgba(255,255,255,.75)', align: 'right', spacing: 4, shadow: true,
        content: 'WEITER →' },
    ],
    deko: [],
  });

  videovorlage({
    id: 'vv-zitat', name: 'Zitat über Video',
    hint: 'Drei Slides, ein großes Zitat in der Mitte',
    slides: 3,
    video: { modus: 'zeit', feder: 0.5, spanne: 0.8, format: '4:5', slides: 3,
             stil: 'pan', out: '4:5' },
    texte: [
      { slide: 1, xr: 0.5, y: 0.44, size: 0.062, font: 'Cormorant Garamond',
        color: '#FBF6EC', align: 'center', italic: true, lineHeight: 1.22, shadow: true,
        content: '„Alles, was du\nsuchst, sucht\nauch dich."' },
      { slide: 1, xr: 0.5, y: 0.63, size: 0.019, font: 'Poppins',
        color: 'rgba(255,255,255,.75)', align: 'center', spacing: 6, shadow: true,
        content: 'RUMI' },
      { slide: 0, xr: 0.5, y: 0.5, size: 0.030, font: 'Poppins',
        color: 'rgba(255,255,255,.85)', align: 'center', spacing: 8, shadow: true,
        content: 'ATMEN' },
      { slide: 2, xr: 0.5, y: 0.5, size: 0.030, font: 'Poppins',
        color: 'rgba(255,255,255,.85)', align: 'center', spacing: 8, shadow: true,
        content: 'BLEIBEN' },
    ],
    deko: [],
  });

  videovorlage({
    id: 'vv-spiegel', name: 'Spiegelband',
    hint: 'Für Wasser, Wolken, Rauch: gekachelt und gespiegelt, ohne jede Naht',
    slides: 4,
    video: { modus: 'spiegel', format: '4:5', slides: 4, stil: 'pan', out: '4:5' },
    texte: [
      { jedeSlide: true, xr: 0.5, y: 0.5, size: 0.055, font: 'Italiana',
        color: '#FFFFFF', align: 'center', spacing: 12, shadow: true, op: 0.95,
        content: 'RUHE' },
      { slide: 0, xr: 0.5, y: 0.90, size: 0.018, font: 'Poppins',
        color: 'rgba(255,255,255,.70)', align: 'center', spacing: 5, shadow: true,
        content: 'ZUM WEITERWISCHEN →' },
    ],
    deko: [],
  });

  videovorlage({
    id: 'vv-reel', name: 'Reel-Fahrt',
    hint: 'Fünf Slides breit, aber als 9:16-Reel exportiert – die Kamera fährt durch',
    video: { modus: 'zeit', feder: 0.42, spanne: 1.0, format: '4:5', slides: 5,
             stil: 'pan', out: '9:16', dur: 8 },
    texte: [
      { slide: 0, xr: 0.5, y: 0.30, size: 0.075, font: 'Anton',
        color: '#FFFFFF', align: 'center', spacing: 2, shadow: true,
        content: 'SIEH DIR DAS AN' },
      { slide: 4, xr: 0.5, y: 0.70, size: 0.040, font: 'Caveat',
        color: '#F6EEDC', align: 'center', shadow: true,
        content: 'bis zum Ende schauen' },
    ],
    deko: [],
  });

  /* ---------------------------------------------------------------- Zuschnitt
     Der Schluessel dafuer, dass eine Vorlage mit JEDEM Bildformat arbeitet:
     el.crop.rect schneidet in Quellpixeln und aendert damit das
     Seitenverhaeltnis. Eine Vorlage sagt nur, welches Verhaeltnis eine Zelle
     hat – der groesstmoegliche mittige Ausschnitt wird daraus gerechnet.
     Ohne das werden 9:16-Fotos in einem Raster zu schmalen Streifen. */
  function zuschnittAuf(el, zielAr) {
    if (!zielAr || !isFinite(zielAr) || el.type !== 'photo') return;
    const rec = SS.images && SS.images[el.imgId];
    if (!rec || !rec.w || !rec.h) return;
    const q = ((el.crop && el.crop.rot90) || 0) % 360;
    const dreh = q === 90 || q === 270;
    const iw = dreh ? rec.h : rec.w;
    const ih = dreh ? rec.w : rec.h;
    let w = iw, h = Math.round(iw / zielAr);
    if (h > ih) { h = ih; w = Math.round(ih * zielAr); }
    w = Math.max(8, Math.min(iw, w));
    h = Math.max(8, Math.min(ih, h));
    el.crop = Object.assign({ zoom: 1, ox: 0, oy: 0 }, el.crop || {}, {
      rect: { x: Math.round((iw - w) / 2), y: Math.round((ih - h) / 2), w, h },
    });
    SS.photoCacheClear && SS.photoCacheClear(el.id);
    SS.invalidateEl && SS.invalidateEl(el);
  }

  /* ---------------------------------------------------------------- Anwenden */
  function textAnlegen(t, k, slideNr) {
    const x = t.xr !== undefined
      ? (t.jedeSlide || t.slide !== undefined
        ? auf(k, slideNr, t.xr) : rel(k, t.xr))
      : k.slideW * (slideNr + 0.5);
    return SS.normalizeEl({
      id: SS.uid(), type: 'text', content: t.content,
      x, y: k.H * t.y, rot: t.rot || 0,
      font: t.font || 'Poppins', size: Math.round(k.H * t.size),
      color: t.color || '#3a3229', bold: !!t.bold, italic: !!t.italic,
      align: t.align || 'center', letterSpacing: t.spacing || 0,
      lineHeight: t.lineHeight || 1.28, opacity: t.op == null ? 1 : t.op,
      bgStyle: t.bgStyle || 'none',
      bgColor: t.bgColor || '#ffffff', bgAlpha: t.bgAlpha == null ? 0.85 : t.bgAlpha,
      /* Ueber einem Video ist der Untergrund nicht vorhersehbar – ein weicher
         Schlagschatten haelt die Schrift auch auf hellen Bildstellen lesbar. */
      shadow: !!t.shadow, shadowColor: t.shadowColor || '#100b07',
      shadowBlur: t.shadowBlur == null ? 26 : t.shadowBlur,
      shadowX: 0, shadowY: t.shadowY == null ? 4 : t.shadowY,
    });
  }

  /* SS.drawTextEl setzt den Textblock IMMER mittig auf el.x; `align` regelt
     nur, wie mehrere Zeilen zueinander stehen. Wer links buendig an einer
     Kante ansetzen will, muss die halbe gemessene Breite dazurechnen. */
  function randAusrichten(el, k, t) {
    if (!t.align || t.align === 'center') return;
    const m = SS.measureText(el);
    if (!m || !isFinite(m.w)) return;
    if (t.align === 'left') el.x += m.w / 2;
    else if (t.align === 'right') el.x -= m.w / 2;
  }

  /* Eine Video-Vorlage stellt zuerst die Leinwand um – Format, Slidezahl und
     Modus. Erst DANACH darf die Leinwandgröße gelesen werden, sonst landen
     alle Texte auf der Breite von vorher (bei einem Clip ist das eine einzige
     Slide) und stehen anschliessend übereinander auf Slide 1. */
  async function videoLeinwandStellen(v) {
    const VL = SS.videoLeinwand;
    const o = v.video;
    if (!VL || !o) return false;
    if (!(SS.clip && SS.clip.ready)) {
      SS.toast('Erst ein Video laden: Video-Tab → „Eigenen Clip laden" → als Hintergrund',
        5200, 'info');
      return false;
    }
    if (o.format) SS.state.format = o.format;
    if (o.slides) SS.state.slides = Math.max(2, Math.min(20, o.slides));
    await VL.setzen(o.modus || 'zeit', { feder: o.feder, spanne: o.spanne, t0: o.t0 });
    if (SS.video && SS.video.opts) {
      if (o.stil) SS.video.opts.style = o.stil;
      if (o.out) SS.video.opts.out = o.out;
      if (o.dur) SS.video.opts.dur = o.dur;
      SS.video.refresh && SS.video.refresh(false);
    }
    return true;
  }

  SS.ui.vorlageAnwenden = async function (id) {
    const st = SS.state;
    const v = V.find(x => x.id === id);
    if (!v) return;
    if (v.video && !(await videoLeinwandStellen(v))) return;
    const k = SS.canvasSize();

    /* Hintergrund und Filter */
    if (v.bg) {
      st.bg = { type: 'preset', id: v.bg, hue: 0 };
      SS.bgCacheInvalidate && SS.bgCacheInvalidate();
    }
    const preset = v.filter && SS.FILTER_PRESETS.find(p => p.id === v.filter);

    /* Fotos setzen – bei einer Video-Vorlage IST der Clip das Bild, da gibt es
       nichts zu platzieren. Vorhandene Fotos bleiben liegen, wo sie sind. */
    const fotos = v.video ? [] : st.elements.filter(e => (e.type === 'photo' || e.type === 'video')
      && !e.hidden && !e.locked);
    fotos.forEach((p, i) => {
      const r = v.platz(i, fotos.length, k);
      if (r.ar) zuschnittAuf(p, r.ar);
      else if (v.zuschnittZurueck && p.crop && p.crop.rect) {
        delete p.crop.rect;
        SS.photoCacheClear && SS.photoCacheClear(p.id);
        SS.invalidateEl && SS.invalidateEl(p);
      }
      p.x = r.x; p.y = r.y; p.rot = r.rot || 0;
      /* Eine Vorlage darf statt der Hoehe eine BREITE vorgeben. Das ist der
         robustere Weg: Rasterzellen haben eine feste Breite, und wie hoch das
         Bild dann wird, haengt an seinem Seitenverhaeltnis. Sonst sehen
         Hochformat-Fotos (9:16) in einem Raster aus wie schmale Streifen. */
      let hoehe = r.h;
      if (r.b) {
        const karte = p.type === 'photo' && SS.photoCard ? SS.photoCard(p) : null;
        const arB = karte ? karte.width / karte.height : (p.w && p.h ? p.w / p.h : 0.75);
        hoehe = Math.min(r.b / Math.max(0.05, arB), r.hmax || 1e9);
      }
      if (v.randlos) {
        /* Randlos heisst: die Slide muss ganz bedeckt sein. Bei einem
           Hochformat 9:16 reicht die Hoehe nicht – dann muss ueber die
           BREITE skaliert werden, sonst bleiben helle Streifen stehen. */
        const karte = p.type === 'photo' && SS.photoCard ? SS.photoCard(p) : null;
        const ar = karte ? karte.width / karte.height
          : (p.w && p.h ? p.w / p.h : 0.75);
        /* 3 % Ueberstand: SS.buildCard legt sechs Pixel Sicherheitsrand um
           jede Karte, sonst blieben duenne helle Streifen an den Nahtstellen. */
        hoehe = Math.max(k.H, k.slideW / Math.max(0.05, ar)) * 1.03;
      }
      if (p.type === 'video') { const ar = (p.w || 1) / (p.h || 1); p.h = hoehe; p.w = hoehe * ar; }
      else p.h = hoehe;
      if (p.frame) {
        const stil = typeof v.rahmen === 'function'
          ? v.rahmen(i, fotos.length)
          : v.rahmen[i % v.rahmen.length];
        p.frame.style = stil;
        if (stil === 'none') { p.frame.border = 0; p.frame.shadow = 0; }
        else if (!p.frame.border) p.frame.border = 26;
      }
      if (preset && p.filter) {
        p.filter = Object.assign(SS.defaultFilter(), preset.f, { preset: preset.id });
      }
      if (v.filterWerte && p.filter) {
        Object.assign(p.filter, v.filterWerte, { preset: 'custom' });
      }
      SS.photoCacheClear && SS.photoCacheClear(p.id);
      SS.invalidateEl && SS.invalidateEl(p);
    });

    /* Texte */
    for (const t of (v.texte || [])) {
      const machen = (slideNr) => {
        const el = textAnlegen(t, k, slideNr);
        randAusrichten(el, k, t);
        st.elements.push(el);
      };
      if (t.jedeSlide) {
        for (let s = 0; s < k.n; s++) {
          if (t.wenn === 'gerade' && s % 2 !== 0) continue;
          if (t.wenn === 'ungerade' && s % 2 === 0) continue;
          machen(s);
        }
      } else machen(t.slide || 0);
    }

    /* Deko */
    for (const d of (v.deko || [])) {
      const def = SS.stickerDef && SS.stickerDef(d.kind);
      if (!def) continue;
      st.elements.push(SS.normalizeEl({
        id: SS.uid(), type: 'sticker', kind: d.kind, cat: def.cat,
        x: k.W * d.xr, y: k.H * d.y, s: Math.round(k.H * d.s),
        rot: d.rot || 0, opacity: d.op == null ? 1 : d.op,
        color: d.farbe || '#c9a15f',
      }));
    }

    SS.pushHistory('Vorlage: ' + v.name);
    SS.ui.refreshLayers && SS.ui.refreshLayers();
    SS.requestRender && SS.requestRender();
    SS.toast('Vorlage „' + v.name + '" gesetzt – Texte antippen und überschreiben',
      3800, 'ok');
  };

  /* ---------------------------------------------------------------- Kacheln */
  (function () {
    const grid = SS.el('tplGrid');
    if (!grid) return;
    const kopf = document.createElement('div');
    kopf.className = 'ctl';
    kopf.style.cssText = 'margin-top:14px;display:block';
    kopf.innerHTML = '<span style="opacity:.75;font-size:13px">Fertige Vorlagen</span>';
    grid.parentElement.insertBefore(kopf, grid.nextSibling);

    const raster = document.createElement('div');
    raster.className = grid.className;
    raster.id = 'vorlagenGrid';
    grid.parentElement.insertBefore(raster, kopf.nextSibling);

    for (const v of V) {
      const sw = document.createElement('button');
      sw.className = 'swatch';
      const cv = document.createElement('canvas');
      cv.width = 135; cv.height = 168;
      const c = cv.getContext('2d');
      /* Vorschau: Hintergrund, ein Bildplatzhalter, die erste Textzeile */
      const bg = v.bg && SS.BG_LIB && SS.BG_LIB.find(b => b.id === v.bg);
      if (bg && bg.paint) { try { bg.paint(c, 135, 168); } catch (e) {} }
      else { c.fillStyle = '#3a3733'; c.fillRect(0, 0, 135, 168); }
      const kk = { W: 135, H: 168, slideW: 135, n: 1 };
      if (v.video) {
        /* Video-Vorlagen haben kein Bildraster – die Vorschau zeigt statt
           Platzhaltern einen Verlauf und das Filmsymbol. */
        const g = c.createLinearGradient(0, 0, 135, 168);
        g.addColorStop(0, v.video.modus === 'spiegel' ? '#2b3b45' : '#241c2e');
        g.addColorStop(0.5, v.video.modus === 'spiegel' ? '#4a6673' : '#5a4463');
        g.addColorStop(1, '#0f0d12');
        c.fillStyle = g; c.fillRect(0, 0, 135, 168);
        c.fillStyle = 'rgba(255,255,255,.13)';
        for (let s = 1; s < 4; s++) c.fillRect(s * 33.75 - 0.5, 0, 1, 168);
        c.fillStyle = 'rgba(255,255,255,.55)';
        c.font = '20px sans-serif'; c.textAlign = 'center';
        c.fillText('▶', 67, 130);
      }
      for (let i = 0; !v.video && i < Math.min(4, v.gruppe === 'doodle' ? 4 : 2); i++) {
        const r = v.platz(i, 4, kk);
        c.save();
        c.translate(r.x, r.y);
        c.rotate((r.rot || 0) * Math.PI / 180);
        const hh = r.h, ww = hh * 0.8;
        c.fillStyle = v.randlos ? 'rgba(120,110,100,.9)' : '#fdfbf8';
        c.fillRect(-ww / 2 - 3, -hh / 2 - 3, ww + 6, hh + 6);
        c.fillStyle = '#b9ada0';
        c.fillRect(-ww / 2, -hh / 2, ww, hh);
        c.restore();
      }
      const t0 = (v.texte || [])[0];
      if (t0) {
        c.fillStyle = t0.color || '#333';
        c.font = `${t0.italic ? 'italic ' : ''}${Math.max(11, Math.round(168 * t0.size))}px "${t0.font}"`;
        c.textAlign = t0.align === 'left' ? 'left' : (t0.align === 'right' ? 'right' : 'center');
        const zeilen = String(t0.content).split('\n').slice(0, 2);
        zeilen.forEach((z, i) => c.fillText(z, 135 * (t0.xr === undefined ? 0.5 : t0.xr),
          168 * t0.y + i * Math.round(168 * t0.size * 1.06)));
      }
      const lb = document.createElement('label');
      lb.textContent = v.name;
      sw.appendChild(cv); sw.appendChild(lb);
      sw.title = v.hint;
      sw.onclick = () => SS.ui.vorlageAnwenden(v.id);
      raster.appendChild(sw);
    }
  })();

  SS.VORLAGEN = V;
  SS.VORLAGEN7 = { anzahl: V.length, ids: V.map(v => v.id) };
})();
