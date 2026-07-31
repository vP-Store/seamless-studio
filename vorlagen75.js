/* Seamless Studio – Vier weitere Video-Vorlagen
   ============================================================================
   Titelkarte, Countdown, Vorher/Nachher, Rezeptschritte – die vier Wuensche
   aus der Uebergabe. Alle vier stellen wie die vv-*-Vorlagen aus vorlagen7.js
   nur die Video-Leinwand ein und legen Schrift darueber.

   Sie werden NICHT in vorlagen7.js eingetragen (Regel: neue Funktionen als
   neue Datei ans Ende), sondern hier ueber SS.VORLAGEN nachgeschoben:
   SS.ui.vorlageAnwenden sucht in genau diesem Array, deshalb reicht ein
   push – nur die Vorschaukachel im Vorlagen-Tab muss diese Datei selbst
   bauen und an #vorlagenGrid anhaengen.

   Gestalterische Regeln, alle aus vorlagen7.js uebernommen:
   * Text ueber Video braucht IMMER shadow: true – der Untergrund ist nicht
     vorhersehbar, ohne Schatten verschwindet die Schrift in hellen Stellen.
   * Wo Lesbarkeit wichtiger ist als Leichtigkeit (Rezeptschritte), bekommt
     die Zeile zusaetzlich ein dunkles 'label' hinterlegt.
   * Positionen je Slide ueber slide/xr – die Leinwandbreite wird erst NACH
     dem Umstellen der Leinwand gelesen (macht vorlageAnwenden selbst).
   ========================================================================= */

(function () {
  if (!SS.VORLAGEN || !SS.ui || typeof SS.ui.vorlageAnwenden !== 'function') return;

  const NEU = [];

  /* ===== 1. Titelkarte =====
     Slide 1 traegt Titel und Unterzeile wie ein Buchdeckel, danach laeuft
     das Panorama frei weiter – nur eine leise Fusszeile bleibt. */
  NEU.push({
    id: 'vv-titel', name: 'Titelkarte', gruppe: 'video', slides: 5,
    hint: 'Slide 1 als Buchdeckel: Titel und Unterzeile, danach läuft das Video frei',
    video: { modus: 'zeit', feder: 0.42, spanne: 1.0, format: '4:5', slides: 5,
             stil: 'pan', out: '4:5' },
    texte: [
      { slide: 0, xr: 0.5, y: 0.185, size: 0.020, font: 'Poppins',
        color: 'rgba(255,255,255,.80)', align: 'center', spacing: 7, shadow: true,
        content: 'EIN NEUER BEITRAG' },
      { slide: 0, xr: 0.5, y: 0.39, size: 0.088, font: 'Playfair Display',
        color: '#F6EEDC', align: 'center', lineHeight: 1.10, shadow: true,
        content: 'Der Titel\ndeiner Story' },
      { slide: 0, xr: 0.5, y: 0.575, size: 0.030, font: 'Cormorant Garamond',
        color: 'rgba(255,255,255,.88)', align: 'center', italic: true, shadow: true,
        content: 'erzählt in fünf Bildern' },
      { slide: 0, xr: 0.5, y: 0.90, size: 0.019, font: 'Poppins',
        color: 'rgba(255,255,255,.78)', align: 'center', spacing: 5, shadow: true,
        content: 'WISCHEN →' },
      { jedeSlide: true, xr: 0.5, y: 0.945, size: 0.017, font: 'Poppins',
        color: 'rgba(255,255,255,.68)', align: 'center', spacing: 4, shadow: true,
        content: '@DEINPROFIL' },
    ],
    deko: [
      { kind: 'sy-funken-05', xr: 0.10, y: 0.53, s: 0.030, rot: 0, farbe: '#F2D14E', op: 0.9 },
    ],
  });

  /* ===== 2. Countdown =====
     Fuenf Slides, eine grosse Zahl je Slide: 5 · 4 · 3 · 2 · 1. Auf der
     letzten steht zusaetzlich, wofuer gezaehlt wurde. */
  NEU.push({
    id: 'vv-count', name: 'Countdown', gruppe: 'video', slides: 5,
    hint: 'Eine große Zahl je Slide, von 5 herunter – die letzte sagt, worauf',
    video: { modus: 'zeit', feder: 0.42, spanne: 1.0, format: '4:5', slides: 5,
             stil: 'pan', out: '4:5' },
    texte: [
      { slide: 0, xr: 0.5, y: 0.115, size: 0.022, font: 'Poppins',
        color: 'rgba(255,255,255,.85)', align: 'center', spacing: 8, shadow: true,
        content: 'COUNTDOWN' },
      { slide: 0, xr: 0.5, y: 0.30, size: 0.30, font: 'Anton',
        color: '#FFFFFF', align: 'center', shadow: true, content: '5' },
      { slide: 1, xr: 0.5, y: 0.30, size: 0.30, font: 'Anton',
        color: '#FFFFFF', align: 'center', shadow: true, content: '4' },
      { slide: 2, xr: 0.5, y: 0.30, size: 0.30, font: 'Anton',
        color: '#FFFFFF', align: 'center', shadow: true, content: '3' },
      { slide: 3, xr: 0.5, y: 0.30, size: 0.30, font: 'Anton',
        color: '#FFFFFF', align: 'center', shadow: true, content: '2' },
      { slide: 4, xr: 0.5, y: 0.30, size: 0.30, font: 'Anton',
        color: '#F2D14E', align: 'center', shadow: true, content: '1' },
      { slide: 4, xr: 0.5, y: 0.70, size: 0.042, font: 'Caveat',
        color: '#F6EEDC', align: 'center', shadow: true,
        content: 'und dafür zählen wir …' },
      { jedeSlide: true, xr: 0.93, y: 0.93, size: 0.018, font: 'Poppins',
        color: 'rgba(255,255,255,.72)', align: 'right', spacing: 4, shadow: true,
        content: 'WEITER →' },
    ],
    deko: [],
  });

  /* ===== 3. Vorher / Nachher =====
     Zwei Slides, Zeitpanorama ueber die volle Spanne: links steht der Anfang
     des Videos, rechts sein Ende – das IST vorher und nachher. Der Pfeil
     sitzt genau auf der Schnittkante. */
  NEU.push({
    id: 'vv-vorher', name: 'Vorher / Nachher', gruppe: 'video', slides: 2,
    hint: 'Zwei Slides: links der Anfang des Videos, rechts sein Ende',
    video: { modus: 'zeit', feder: 0.36, spanne: 1.0, format: '4:5', slides: 2,
             stil: 'pan', out: '4:5' },
    texte: [
      { slide: 0, xr: 0.5, y: 0.115, size: 0.030, font: 'Poppins',
        color: '#FFFFFF', align: 'center', spacing: 7, shadow: true,
        bgStyle: 'label', bgColor: '#14100c', bgAlpha: 0.52,
        content: 'VORHER' },
      { slide: 1, xr: 0.5, y: 0.115, size: 0.030, font: 'Poppins',
        color: '#2b241d', align: 'center', spacing: 7,
        bgStyle: 'label', bgColor: '#F2D14E', bgAlpha: 0.94,
        content: 'NACHHER' },
      { slide: 0, xr: 0.5, y: 0.90, size: 0.019, font: 'Poppins',
        color: 'rgba(255,255,255,.80)', align: 'center', spacing: 5, shadow: true,
        content: 'WISCHE FÜR DAS ERGEBNIS →' },
    ],
    deko: [
      /* xr ist hier panoramaweit – 0.5 ist bei zwei Slides exakt die Naht. */
      { kind: 'arrow', xr: 0.5, y: 0.50, s: 0.12, rot: 0, farbe: '#FFFFFF', op: 0.95 },
    ],
  });

  /* ===== 4. Rezeptschritte =====
     Slide 1 stellt das Gericht vor, die Slides 2–5 tragen je einen Schritt:
     oben ein heller Zaehler, unten die Zeile zum Ueberschreiben – die steht
     auf dunklem Grund, denn Lesbarkeit schlaegt hier Leichtigkeit. */
  (function () {
    const texte = [
      { slide: 0, xr: 0.5, y: 0.24, size: 0.078, font: 'Playfair Display',
        color: '#F6EEDC', align: 'center', lineHeight: 1.1, shadow: true,
        content: 'Das Gericht' },
      { slide: 0, xr: 0.5, y: 0.42, size: 0.021, font: 'Poppins',
        color: 'rgba(255,255,255,.85)', align: 'center', spacing: 5, shadow: true,
        content: 'IN VIER SCHRITTEN →' },
      { slide: 0, xr: 0.5, y: 0.90, size: 0.018, font: 'Poppins',
        color: 'rgba(255,255,255,.72)', align: 'center', spacing: 4, shadow: true,
        content: 'REZEPT ZUM MITKOCHEN' },
    ];
    for (let s = 1; s <= 4; s++) {
      texte.push(
        { slide: s, xr: 0.5, y: 0.115, size: 0.024, font: 'Poppins',
          color: '#2b241d', align: 'center', spacing: 5,
          bgStyle: 'pill', bgColor: '#F6EEDC', bgAlpha: 0.95,
          content: 'SCHRITT ' + s },
        { slide: s, xr: 0.5, y: 0.82, size: 0.026, font: 'Poppins',
          color: '#FFFFFF', align: 'center', lineHeight: 1.45,
          bgStyle: 'label', bgColor: '#14100c', bgAlpha: 0.50,
          content: 'hier steht,\nwas zu tun ist' });
    }
    NEU.push({
      id: 'vv-rezept', name: 'Rezeptschritte', gruppe: 'video', slides: 5,
      hint: 'Slide 1 stellt das Gericht vor, danach ein Schritt je Slide',
      video: { modus: 'zeit', feder: 0.42, spanne: 1.0, format: '4:5', slides: 5,
               stil: 'pan', out: '4:5' },
      texte, deko: [],
    });
  })();

  /* ===== 5. + 6. Video und Fotos mischen =====
     Das Video ist die Leinwand, dar ueber liegen echte Fotos – Polaroids oder
     Klebeband-Schnipsel – samt Stickern. Moeglich macht das ein Satz in
     vorlagen7.js: eine Video-Vorlage MIT eigenem `platz` setzt auch Fotos. */
  NEU.push({
    id: 'vm-polaroid', name: 'Video + Polaroids', gruppe: 'video', slides: 5,
    hint: 'Das Video läuft hinter schiefen Polaroids – ein Bild je Slide',
    video: { modus: 'zeit', feder: 0.42, spanne: 1.0, format: '4:5', slides: 5,
             stil: 'pan', out: '4:5' },
    filter: 'softfilm', rahmen: ['polaroid-w'],
    platz: (i, N, k) => {
      /* Reihum ueber die Slides; ab der zweiten Runde leicht versetzt,
         damit nichts exakt uebereinander liegt. */
      const sp = i % Math.max(1, k.n);
      const runde = Math.floor(i / Math.max(1, k.n));
      /* Versetzt zur Slide-Mitte, damit die Polaroids auch mal auf einer
         Schnittkante liegen – genau das macht den Wisch-Effekt. */
      const wo = [0.62, 0.38, 0.58, 0.42, 0.55][i % 5];
      return { x: sp * k.slideW + k.slideW * wo + runde * k.slideW * 0.10,
               y: k.H * ((i % 2 ? 0.64 : 0.40) + runde * 0.06),
               b: k.slideW * 0.42, hmax: k.H * 0.46,
               rot: [-6, 5, -4, 6, -5][i % 5] };
    },
    texte: [
      { slide: 0, xr: 0.5, y: 0.14, size: 0.055, font: 'Caveat',
        color: '#F6EEDC', align: 'center', shadow: true,
        content: 'bewegte Momente' },
      { jedeSlide: true, xr: 0.5, y: 0.945, size: 0.017, font: 'Poppins',
        color: 'rgba(255,255,255,.70)', align: 'center', spacing: 4, shadow: true,
        content: '@DEINPROFIL' },
    ],
    deko: [
      { kind: 'sy-funken-05', xr: 0.16, y: 0.24, s: 0.05, rot: 0, farbe: '#e8b53a', op: 1 },
      { kind: 'sy-funken-05', xr: 0.52, y: 0.72, s: 0.04, rot: 0, farbe: '#e8b53a', op: 0.9 },
      { kind: 'sy-funken-05', xr: 0.86, y: 0.20, s: 0.045, rot: 0, farbe: '#e8b53a', op: 1 },
    ],
  });

  NEU.push({
    id: 'vm-tape', name: 'Video + Klebeband', gruppe: 'video', slides: 5,
    hint: 'Fotos wie angeklebt über dem laufenden Video, mit Blumen und Funken',
    video: { modus: 'zeit', feder: 0.42, spanne: 1.0, format: '4:5', slides: 5,
             stil: 'pan', out: '4:5' },
    filter: 'fade', rahmen: ['washi', 'riss', 'washi', 'polaroid', 'riss'],
    platz: (i, N, k) => {
      const sp = i % Math.max(1, k.n);
      const runde = Math.floor(i / Math.max(1, k.n));
      const wo = [0.40, 0.60, 0.44, 0.58, 0.46][i % 5];
      return { x: sp * k.slideW + k.slideW * wo + runde * k.slideW * 0.10,
               y: k.H * ((i % 2 ? 0.38 : 0.60) + runde * 0.06),
               b: k.slideW * 0.46, hmax: k.H * 0.48,
               rot: [5, -6, 4, -5, 6][i % 5] };
    },
    texte: [
      { slide: 0, xr: 0.5, y: 0.13, size: 0.062, font: 'Anton',
        color: '#FFFFFF', align: 'center', spacing: 2, rot: -2, shadow: true,
        content: 'MOMENTE' },
      { slide: 0, xr: 0.5, y: 0.20, size: 0.026, font: 'Caveat',
        color: '#F6EEDC', align: 'center', shadow: true,
        content: 'festgehalten & angeklebt' },
      { jedeSlide: true, xr: 0.93, y: 0.93, size: 0.018, font: 'Poppins',
        color: 'rgba(255,255,255,.72)', align: 'right', spacing: 4, shadow: true,
        content: 'WEITER →' },
    ],
    deko: [
      { kind: 'bl-margerite-weiss', xr: 0.07, y: 0.82, s: 0.11, rot: -8, op: 0.95 },
      { kind: 'bl-kirschbluete-rosa', xr: 0.48, y: 0.16, s: 0.09, rot: 10, op: 0.95 },
      { kind: 'sy-funken-05', xr: 0.30, y: 0.70, s: 0.05, rot: 0, farbe: '#e8b53a', op: 1 },
      { kind: 'bl-plumeria-creme', xr: 0.92, y: 0.78, s: 0.10, rot: 8, op: 0.95 },
    ],
  });

  NEU.forEach(v => SS.VORLAGEN.push(v));
  if (SS.VORLAGEN7) {
    SS.VORLAGEN7.anzahl = SS.VORLAGEN.length;
    SS.VORLAGEN7.ids = SS.VORLAGEN.map(v => v.id);
  }

  /* --------------------------------------- Foto-Vorlagen ueber einem Video
     Die dreizehn Foto-Vorlagen rechnen mit hellem Papier: dunkle Schrift,
     kein Schatten. Liegt ein Video auf der Leinwand, ist der Untergrund
     dunkel und unvorhersehbar – dann waere „mein monat" schlicht unsichtbar
     (so gesehen beim Polaroid-Tagebuch ueber dem Mondvideo). Deshalb werden
     die Texte einer Foto-Vorlage nach dem Anwenden angepasst, wenn ein Clip
     die Leinwand ist: Schlagschatten an, dunkle Farben auf warmes Creme.
     Nur die NEU angelegten Elemente – was schon da war, bleibt unberuehrt. */
  (function () {
    function dunkel(farbe) {
      if (!farbe) return false;
      let r, g, b;
      const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(farbe).trim());
      const fn = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i.exec(String(farbe));
      if (hex) {
        let h = hex[1];
        if (h.length === 3) h = h.replace(/./g, (z) => z + z);
        r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
      } else if (fn) { r = +fn[1]; g = +fn[2]; b = +fn[3]; }
      else return false;
      return (0.2126 * r + 0.7152 * g + 0.0722 * b) < 150;
    }

    const orig = SS.ui.vorlageAnwenden;
    SS.ui.vorlageAnwenden = async function (id) {
      const v = SS.VORLAGEN.find(x => x.id === id);
      const clipLeinwand = !!(SS.clip && SS.clip.ready);
      const vorher = new Set(SS.state.elements.map(e => e.id));
      const r = await orig.apply(this, arguments);
      if (clipLeinwand && v && !v.video) {
        for (const e of SS.state.elements) {
          if (vorher.has(e.id) || e.type !== 'text') continue;
          /* Eine Zeile mit eigenem Kasten (label, pill, …) traegt ihren
             Untergrund selbst mit – die bleibt, wie sie ist. */
          if (e.bgStyle && e.bgStyle !== 'none') continue;
          e.shadow = true;
          e.shadowColor = '#100b07';
          if (!e.shadowBlur) e.shadowBlur = 26;
          e.shadowX = 0; if (e.shadowY == null) e.shadowY = 4;
          if (dunkel(e.color)) e.color = '#F6EEDC';
          SS.invalidateEl && SS.invalidateEl(e);
        }
        SS.requestRender && SS.requestRender();
      }
      return r;
    };
  })();

  /* ------------------------------------------------------- Vorschaukacheln
     Gleicher Aufbau wie in vorlagen7.js (Filmstreifen-Verlauf), aber mit
     einer eigenen kleinen Zeichnung je Vorlage, damit man die vier schon an
     der Kachel unterscheiden kann. */
  (function () {
    const raster = document.getElementById('vorlagenGrid');
    if (!raster) return;

    const MALER = {
      'vv-titel': (c) => {
        c.fillStyle = '#F6EEDC';
        c.font = 'italic 19px "Playfair Display", serif';
        c.textAlign = 'center';
        c.fillText('Der Titel', 67, 66);
        c.fillText('deiner Story', 67, 88);
        c.fillStyle = 'rgba(255,255,255,.6)';
        c.font = '9px sans-serif';
        c.fillText('W I S C H E N  →', 67, 146);
      },
      'vv-count': (c) => {
        c.fillStyle = '#FFFFFF';
        c.textAlign = 'center';
        c.font = 'bold 44px "Anton", sans-serif';
        c.fillText('5', 34, 96);
        c.font = 'bold 34px "Anton", sans-serif';
        c.globalAlpha = 0.75; c.fillText('4', 72, 92);
        c.font = 'bold 26px "Anton", sans-serif';
        c.globalAlpha = 0.5; c.fillText('3', 104, 88);
        c.globalAlpha = 1;
      },
      'vv-vorher': (c) => {
        c.fillStyle = 'rgba(20,16,12,.6)';
        c.fillRect(8, 26, 52, 16);
        c.fillStyle = '#fff'; c.font = '9px sans-serif'; c.textAlign = 'center';
        c.fillText('VORHER', 34, 37);
        c.fillStyle = '#F2D14E';
        c.fillRect(75, 26, 54, 16);
        c.fillStyle = '#2b241d';
        c.fillText('NACHHER', 102, 37);
        c.strokeStyle = '#fff'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(56, 90); c.lineTo(80, 90);
        c.moveTo(73, 84); c.lineTo(80, 90); c.lineTo(73, 96); c.stroke();
      },
      'vm-polaroid': (c) => {
        [[38, 66, -8], [92, 96, 7]].forEach(([x, y, w]) => {
          c.save(); c.translate(x, y); c.rotate(w * Math.PI / 180);
          c.fillStyle = '#fdfbf8'; c.fillRect(-22, -26, 44, 56);
          c.fillStyle = '#b9ada0'; c.fillRect(-18, -22, 36, 40);
          c.restore();
        });
        c.fillStyle = '#F6EEDC';
        c.font = 'italic 13px "Caveat", cursive';
        c.textAlign = 'center';
        c.fillText('bewegte Momente', 67, 26);
      },
      'vm-tape': (c) => {
        [[42, 80, 5], [96, 92, -7]].forEach(([x, y, w]) => {
          c.save(); c.translate(x, y); c.rotate(w * Math.PI / 180);
          c.fillStyle = '#f4efe6'; c.fillRect(-24, -28, 48, 56);
          c.fillStyle = '#b9ada0'; c.fillRect(-20, -24, 40, 48);
          c.fillStyle = 'rgba(214,196,150,.9)';
          c.fillRect(-14, -34, 28, 12);
          c.restore();
        });
        c.fillStyle = '#fff';
        c.font = 'bold 14px "Anton", sans-serif';
        c.textAlign = 'center';
        c.fillText('MOMENTE', 67, 28);
      },
      'vv-rezept': (c) => {
        c.textAlign = 'center'; c.font = '8px sans-serif';
        [1, 2, 3].forEach((n, i) => {
          const y = 38 + i * 34;
          c.fillStyle = '#F6EEDC';
          c.beginPath();
          const w = 56, h = 15, x = 67 - w / 2;
          c.moveTo(x + h / 2, y);
          c.arc(x + w - h / 2, y + h / 2, h / 2, -Math.PI / 2, Math.PI / 2);
          c.arc(x + h / 2, y + h / 2, h / 2, Math.PI / 2, -Math.PI / 2);
          c.fill();
          c.fillStyle = '#2b241d';
          c.fillText('SCHRITT ' + n, 67, y + 11);
        });
      },
    };

    for (const v of NEU) {
      const sw = document.createElement('button');
      sw.className = 'swatch';
      const cv = document.createElement('canvas');
      cv.width = 135; cv.height = 168;
      const c = cv.getContext('2d');
      const g = c.createLinearGradient(0, 0, 135, 168);
      g.addColorStop(0, '#241c2e');
      g.addColorStop(0.5, '#5a4463');
      g.addColorStop(1, '#0f0d12');
      c.fillStyle = g; c.fillRect(0, 0, 135, 168);
      c.fillStyle = 'rgba(255,255,255,.13)';
      const n = v.video.slides || 5;
      for (let s = 1; s < Math.min(4, n); s++) c.fillRect(s * 135 / Math.min(4, n) - 0.5, 0, 1, 168);
      c.fillStyle = 'rgba(255,255,255,.5)';
      c.font = '16px sans-serif'; c.textAlign = 'center';
      c.fillText('▶', 121, 160);
      try { MALER[v.id] && MALER[v.id](c); } catch (e) {}
      const lb = document.createElement('label');
      lb.textContent = v.name;
      sw.appendChild(cv); sw.appendChild(lb);
      sw.title = v.hint;
      sw.onclick = () => SS.ui.vorlageAnwenden(v.id);
      raster.appendChild(sw);
    }
  })();

  SS.VORLAGEN75 = { bereit: true, ids: NEU.map(v => v.id) };
})();
