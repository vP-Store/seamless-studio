/* Seamless Studio – Textvorlagen
   Fertig gestaltete Schriftkombinationen zum Antippen: Schrift, Größe,
   Farbe, Effekte und passende Zweitzeile in einem Rutsch. */

(function () {
  const $ = SS.el;

  /* Grundgerüst eines Textfelds */
  function T(o) {
    return Object.assign({
      type: 'text', rot: 0, bold: false, italic: false, align: 'center',
      letterSpacing: 0, lineHeight: 1.3, opacity: 1, curve: 0,
      bgStyle: 'none', bgColor: '#ffffff', bgAlpha: 0.85,
      fill: 'none', hollow: false, outline: false, outlineColor: '#ffffff', outlineWidth: 8,
      shadow: false, shadowColor: '#1e0f08', shadowBlur: 18, shadowX: 0, shadowY: 5,
      glow: false, glowColor: '#ffd9a0', glowStrength: 45,
      anim: 'none',
    }, o);
  }

  /* Jede Vorlage: eine oder zwei Zeilen. dy = Versatz in Anteilen der Slide-Höhe. */
  SS.TEXT_TEMPLATES = [
    { id: 'editorial', name: 'Editorial', hell: '#2f2a26',
      teile: [
        T({ content: 'MOMENTE', font: 'Bodoni Moda', size: 120, color: '#2f2a26', letterSpacing: 6, dy: -0.04 }),
        T({ content: 'die bleiben', font: 'Tenor Sans', size: 40, color: '#6b6058', letterSpacing: 10, dy: 0.05 }),
      ] },

    { id: 'softscript', name: 'Soft Script', hell: '#8a5a6b',
      teile: [
        T({ content: 'Für immer', font: 'Alex Brush', size: 140, color: '#8a5a6b', dy: -0.03 }),
        T({ content: 'UNSERE GESCHICHTE', font: 'Poppins', size: 30, color: '#a08590', letterSpacing: 9, dy: 0.06 }),
      ] },

    { id: 'statement', name: 'Bold Statement', hell: '#1c1815',
      teile: [
        T({ content: 'EINFACH\nMACHEN', font: 'Anton', size: 132, color: '#1c1815', lineHeight: 0.98, dy: -0.02 }),
        T({ content: 'kein Plan B', font: 'Montserrat', size: 34, color: '#8a7f74', letterSpacing: 5, dy: 0.11 }),
      ] },

    { id: 'spirituell', name: 'Spirituell', hell: '#6b5a3e',
      teile: [
        T({ content: 'Vertraue\ndem Weg', font: 'Cormorant Upright', size: 116, color: '#6b5a3e',
          italic: true, lineHeight: 1.05, fill: 'gold', glow: true, glowColor: '#e8cf96', glowStrength: 35, dy: -0.02 }),
        T({ content: '✦  A T M E N  ✦', font: 'Julius Sans One', size: 30, color: '#9a8a6e', letterSpacing: 6, dy: 0.1 }),
      ] },

    { id: 'handschrift', name: 'Handschrift', hell: '#4a3b30',
      teile: [
        T({ content: 'kleine Freuden', font: 'Caveat', size: 116, color: '#4a3b30', rot: -3, dy: -0.02 }),
        T({ content: 'jeden Tag ein bisschen', font: 'Patrick Hand', size: 40, color: '#7a6a5c', rot: -1.5, dy: 0.07 }),
      ] },

    { id: 'luxus', name: 'Luxury Gold', hell: '#e8cf96', dunkel: true,
      teile: [
        T({ content: 'ELEGANZ', font: 'Cinzel', size: 108, color: '#e8cf96', letterSpacing: 10,
          fill: 'gold', shadow: true, shadowColor: '#120d07', shadowBlur: 26, dy: -0.03 }),
        T({ content: 'zeitlos schön', font: 'Cormorant Garamond', size: 44, color: '#c9b184', italic: true, dy: 0.06 }),
      ] },

    { id: 'neon', name: 'Neon Night', hell: '#ff5fa2', dunkel: true,
      teile: [
        T({ content: 'GOOD VIBES', font: 'Bebas Neue', size: 122, color: '#ff5fa2', letterSpacing: 4,
          fill: 'neon', glow: true, glowColor: '#ff5fa2', glowStrength: 70, anim: 't-neonon', dy: -0.02 }),
        T({ content: 'only', font: 'Bebas Neue', size: 62, color: '#7ce0ff', fill: 'neon',
          glow: true, glowColor: '#7ce0ff', glowStrength: 70, dy: 0.07 }),
      ] },

    { id: 'vintage', name: 'Vintage Film', hell: '#4a4540',
      teile: [
        T({ content: 'SUMMER \'26', font: 'Special Elite', size: 92, color: '#4a4540', letterSpacing: 3, dy: -0.02 }),
        T({ content: '— roll 03 —', font: 'Courier Prime', size: 34, color: '#7d766e', letterSpacing: 4, dy: 0.06 }),
      ] },

    { id: 'minimal', name: 'Minimal Serif', hell: '#3a332c',
      teile: [
        T({ content: 'S T I L L E', font: 'Marcellus', size: 96, color: '#3a332c', letterSpacing: 14, dy: 0 }),
      ] },

    { id: 'romantik', name: 'Romantisch', hell: '#a8607a',
      teile: [
        T({ content: 'Du & Ich', font: 'Great Vibes', size: 150, color: '#a8607a', dy: -0.03 }),
        T({ content: 'seit 2019', font: 'Cormorant Garamond', size: 44, color: '#b98d9c', italic: true, letterSpacing: 3, dy: 0.07 }),
      ] },

    { id: 'magazin', name: 'Magazin-Cover', hell: '#ffffff', dunkel: true,
      teile: [
        T({ content: 'THE\nGUIDE', font: 'Archivo Black', size: 128, color: '#ffffff', lineHeight: 0.94,
          shadow: true, shadowColor: '#000000', shadowBlur: 30, shadowY: 8, dy: -0.03 }),
        T({ content: 'AUSGABE 04  ·  JULI', font: 'Montserrat', size: 28, color: '#e8ded2', letterSpacing: 8, dy: 0.1 }),
      ] },

    { id: 'zitat', name: 'Zitat', hell: '#4a4038',
      teile: [
        T({ content: '„Alles zu seiner Zeit."', font: 'Prata', size: 78, color: '#4a4038', italic: false, lineHeight: 1.3, dy: -0.02 }),
        T({ content: '— unbekannt', font: 'Tenor Sans', size: 32, color: '#8a7f74', letterSpacing: 3, dy: 0.08 }),
      ] },

    { id: 'baby', name: 'Baby', hell: '#5f7d95',
      teile: [
        T({ content: 'Willkommen', font: 'Quicksand', size: 96, color: '#5f7d95', bold: true, dy: -0.03 }),
        T({ content: 'kleiner Sonnenschein', font: 'Comfortaa', size: 40, color: '#8fa9bd', dy: 0.06 }),
      ] },

    { id: 'boho', name: 'Boho', hell: '#7a5a3e',
      teile: [
        T({ content: 'WILD & FREI', font: 'Forum', size: 100, color: '#7a5a3e', letterSpacing: 8, dy: -0.03 }),
        T({ content: 'wohin der Wind uns trägt', font: 'Tangerine', size: 76, color: '#a4794f', dy: 0.07 }),
      ] },

    { id: 'label', name: 'Insta-Label', hell: '#2b2521',
      teile: [
        T({ content: 'NEU HIER?', font: 'Poppins', size: 62, color: '#2b2521', bold: true,
          bgStyle: 'label', bgColor: '#ffffff', bgAlpha: 0.95, dy: -0.03 }),
        T({ content: 'swipe für mehr →', font: 'Poppins', size: 38, color: '#2b2521',
          bgStyle: 'label', bgColor: '#f0d7c4', bgAlpha: 0.95, dy: 0.06 }),
      ] },

    { id: 'outline', name: 'Outline Pop', hell: '#ffffff', dunkel: true,
      teile: [
        T({ content: 'LOOK', font: 'Anton', size: 150, color: '#ffffff', hollow: true, outline: true,
          outlineColor: '#ffffff', outlineWidth: 5, letterSpacing: 4, dy: -0.03 }),
        T({ content: 'BOOK', font: 'Anton', size: 150, color: '#ffd27f', letterSpacing: 4, dy: 0.06 }),
      ] },

    { id: 'retro3d', name: '3D Retro', hell: '#e8543f',
      teile: [
        T({ content: 'RETRO', font: 'Archivo Black', size: 128, color: '#e8543f', fill: '3d',
          outline: true, outlineColor: '#2b2521', outlineWidth: 4, letterSpacing: 3, dy: -0.02 }),
        T({ content: 'good times', font: 'Yellowtail', size: 66, color: '#2b2521', rot: -4, dy: 0.08 }),
      ] },

    { id: 'sanft', name: 'Sanftes Leuchten', hell: '#8e7ba8', dunkel: true,
      teile: [
        T({ content: 'atme durch', font: 'Philosopher', size: 104, color: '#f2e9f7', italic: true,
          glow: true, glowColor: '#b79fd4', glowStrength: 60, anim: 'breathe', dy: -0.02 }),
        T({ content: 'du darfst langsam machen', font: 'Cormorant Upright', size: 42, color: '#cbbadd', dy: 0.07 }),
      ] },

    { id: 'schreibmaschine', name: 'Tipp-Effekt', hell: '#3a332c',
      teile: [
        T({ content: 'Kapitel eins', font: 'Courier Prime', size: 86, color: '#3a332c',
          letterSpacing: 2, anim: 't-typewriter', dy: 0 }),
      ] },

    { id: 'welle', name: 'Wellen-Titel', hell: '#c9663f',
      teile: [
        T({ content: 'SOMMERTAGE', font: 'Bebas Neue', size: 116, color: '#c9663f',
          letterSpacing: 5, anim: 't-wave', dy: 0 }),
      ] },
  ];

  /* ---------- Vorschaukachel ---------- */
  function preview(tpl, w, h) {
    const cv = SS.makeCanvas(w, h);
    const c = cv.getContext('2d');
    c.fillStyle = tpl.dunkel ? '#241f1b' : '#f6efe7';
    c.fillRect(0, 0, w, h);
    c.textAlign = 'center';
    c.textBaseline = 'middle';

    // alle Zeilen sammeln (mehrzeilige Inhalte zählen einzeln)
    const zeilen = [];
    tpl.teile.forEach(t => String(t.content).split('\n').forEach(z => zeilen.push({ t, z })));
    const n = zeilen.length;
    const nutzH = h * 0.92;                // etwas Luft oben und unten
    const mitteY = h / 2;
    const platz = nutzH / (n + 0.5);       // Höhe je Zeile inklusive Luft
    const rand = w * 0.88;

    zeilen.forEach((row, i) => {
      const t = row.t, zeile = row.z;
      // Schriftgröße so wählen, dass die Zeile in die Kachel passt
      let g = platz * 0.78;
      const setz = (px) => {
        c.font = `${t.italic ? 'italic ' : ''}${t.bold ? '700 ' : '400 '}${px}px "${t.font}"`;
      };
      setz(g);
      const breite = c.measureText(zeile).width || 1;
      if (breite > rand) { g = Math.max(7, g * rand / breite); setz(g); }
      const y = mitteY + (i - (n - 1) / 2) * platz;

      if (t.bgStyle === 'label') {
        const tw = c.measureText(zeile).width;
        c.fillStyle = t.bgColor;
        c.fillRect(w / 2 - tw / 2 - 5, y - g * 0.66, tw + 10, g * 1.3);
      }
      c.fillStyle = t.color;
      if (t.glow) { c.save(); c.shadowColor = t.glowColor; c.shadowBlur = g * 0.6; }
      if (t.hollow) {
        c.strokeStyle = t.outlineColor;
        c.lineWidth = Math.max(0.8, g * 0.055);
        c.strokeText(zeile, w / 2, y);
      } else {
        c.fillText(zeile, w / 2, y);
      }
      if (t.glow) c.restore();
    });
    return cv;
  }

  /* ---------- Vorlage einsetzen ---------- */
  SS.ui.applyTextTemplate = function (tpl) {
    const st = SS.state;
    const { H, slideW, W } = SS.canvasSize();
    // in die gerade sichtbare Slide setzen
    const mitte = SS.clamp((-st.panX + document.getElementById('stage').clientWidth / 2) / st.zoom, 0, W);
    const slide = Math.floor(mitte / slideW);
    const cx = SS.clamp(slide * slideW + slideW / 2, slideW / 2, W - slideW / 2);
    const neu = [];
    tpl.teile.forEach((t) => {
      const el = SS.normalizeEl(Object.assign({}, t, {
        id: SS.uid(),
        x: cx,
        y: H * (0.5 + (t.dy || 0)),
      }));
      delete el.dy;
      st.elements.push(el);
      neu.push(el);
    });
    if (neu.length > 1) {
      const g = SS.gid();
      neu.forEach(e => { e.gid = g; });
    }
    SS.setSelMany(neu.map(e => e.id));
    SS.buzz();
    SS.pushHistory('Textvorlage: ' + tpl.name);
    SS.ui.showProps(); SS.requestRender();
    SS.toast(`Vorlage „${tpl.name}" eingefügt – Text antippen und überschreiben`, 3400, 'ok');
    if (window.matchMedia('(max-width: 760px)').matches) $('sidepanel').classList.remove('open');
  };

  /* ---------- Gitter aufbauen ---------- */
  function build() {
    const g = $('textTplGrid');
    if (!g) return;
    g.innerHTML = '';
    SS.TEXT_TEMPLATES.forEach(tpl => {
      const sw = document.createElement('button');
      sw.className = 'swatch';
      sw.title = tpl.teile.map(t => t.font).join(' + ');
      sw.appendChild(preview(tpl, 300, 224));
      const lb = document.createElement('label');
      lb.textContent = tpl.name;
      sw.appendChild(lb);
      sw.onclick = () => SS.ui.applyTextTemplate(tpl);
      g.appendChild(sw);
    });
  }

  // Erst bauen, wenn die Schriften geladen sind – sonst zeigt die Vorschau Ersatzschriften
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => setTimeout(build, 60));
  } else {
    setTimeout(build, 600);
  }
  SS.ui.buildTextTemplates = build;
})();
