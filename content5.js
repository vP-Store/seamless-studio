/* ============================================================
   Seamless Studio 5.0 — Inhalte
   24 neue Sticker in drei Kategorien, 14 neue Hintergründe,
   4 neue Looks. Alles prozedural gezeichnet — nichts wird
   nachgeladen, die App bleibt offline-fähig und jeder Sticker
   ist in jeder Größe und Farbe scharf.
   Lädt nach stickers2.js, backgrounds.js und ui.js.
   ============================================================ */

(function () {
  const TAU = Math.PI * 2;

  const rgba = (hex, a) => {
    const h = String(hex).replace('#', '');
    const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
    return `rgba(${r},${g},${b},${a})`;
  };
  const shade = (hex, amt) => {
    const h = String(hex).replace('#', '');
    return '#' + [0, 2, 4].map(i =>
      Math.max(0, Math.min(255, parseInt(h.slice(i, i + 2), 16) + amt)).toString(16).padStart(2, '0')).join('');
  };
  /* immer gleiche Zufallsfolge – Vorschau und Export sehen identisch aus */
  function rnd(seed) {
    let s = seed || 1;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  }

  /* ============================================================
     1. Sticker
     ============================================================ */

  /* ---- Boho: organische Formen, die auch als Rahmen taugen ---- */

  function bogen(c, s, col) {            // Torbogen, unten offen
    const w = s * 0.62, h = s * 0.9, r = w / 2;
    c.strokeStyle = col; c.lineWidth = s * 0.045; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-r, h / 2);
    c.lineTo(-r, -h / 2 + r);
    c.arc(0, -h / 2 + r, r, Math.PI, 0);
    c.lineTo(r, h / 2);
    c.stroke();
  }
  function sonnenbogen(c, s, col) {      // Halbkreis mit Strahlen
    const r = s * 0.34;
    c.fillStyle = col;
    c.beginPath(); c.arc(0, r * 0.5, r, Math.PI, 0); c.fill();
    c.strokeStyle = col; c.lineWidth = s * 0.035; c.lineCap = 'round';
    for (let i = 0; i <= 6; i++) {
      const a = Math.PI + (i / 6) * Math.PI;
      c.beginPath();
      c.moveTo(Math.cos(a) * r * 1.22, r * 0.5 + Math.sin(a) * r * 1.22);
      c.lineTo(Math.cos(a) * r * 1.5, r * 0.5 + Math.sin(a) * r * 1.5);
      c.stroke();
    }
  }
  function welle(c, s, col) {            // dreifache Wellenlinie
    c.strokeStyle = col; c.lineWidth = s * 0.032; c.lineCap = 'round';
    for (let k = -1; k <= 1; k++) {
      c.beginPath();
      for (let i = 0; i <= 40; i++) {
        const x = -s / 2 + (i / 40) * s;
        const y = k * s * 0.17 + Math.sin((i / 40) * TAU * 1.6) * s * 0.055;
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
    }
  }
  function berge(c, s, col) {
    const w = s, h = s * 0.62;
    c.fillStyle = rgba(col, .45);
    c.beginPath();
    c.moveTo(-w / 2, h / 2); c.lineTo(-w * 0.1, -h / 2); c.lineTo(w * 0.42, h / 2);
    c.closePath(); c.fill();
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(-w * 0.2, h / 2); c.lineTo(w * 0.16, -h * 0.24); c.lineTo(w / 2, h / 2);
    c.closePath(); c.fill();
  }
  function zweig(c, s, col) {
    const h = s * 0.94;
    c.strokeStyle = col; c.lineWidth = s * 0.028; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, h / 2); c.quadraticCurveTo(s * 0.04, 0, 0, -h / 2); c.stroke();
    c.fillStyle = col;
    for (let i = 0; i < 7; i++) {
      const t = i / 6, y = h / 2 - t * h * 0.92, side = i % 2 ? 1 : -1;
      const l = s * (0.3 - t * 0.14);
      c.save(); c.translate(0, y); c.rotate(side * 0.75);
      c.beginPath(); c.ellipse(side * l * 0.5, 0, l * 0.5, l * 0.2, 0, 0, TAU); c.fill();
      c.restore();
    }
  }
  function terrazzo(c, s, col) {
    const r = rnd(7);
    c.fillStyle = rgba(col, .18);
    c.beginPath(); c.arc(0, 0, s * 0.48, 0, TAU); c.fill();
    for (let i = 0; i < 22; i++) {
      const a = r() * TAU, d = Math.sqrt(r()) * s * 0.42;
      const w = s * (0.04 + r() * 0.06);
      c.save();
      c.translate(Math.cos(a) * d, Math.sin(a) * d);
      c.rotate(r() * TAU);
      c.fillStyle = rgba(col, .45 + r() * 0.45);
      c.beginPath(); c.ellipse(0, 0, w, w * (0.5 + r() * 0.5), 0, 0, TAU); c.fill();
      c.restore();
    }
  }
  function perlenbogen(c, s, col) {
    const r = s * 0.4;
    c.fillStyle = col;
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI + (i / 12) * Math.PI;
      const rr = s * (i === 0 || i === 12 ? 0.035 : 0.028);
      c.beginPath(); c.arc(Math.cos(a) * r, r * 0.45 + Math.sin(a) * r, rr, 0, TAU); c.fill();
    }
  }
  function blobRahmen(c, s, col) {
    const r = rnd(3), n = 9, base = s * 0.44;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const rr = base * (0.66 + r() * 0.62);
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    c.strokeStyle = col; c.lineWidth = s * 0.035; c.lineJoin = 'round';
    c.beginPath();
    for (let i = 0; i <= n; i++) {
      const p = pts[i % n], q = pts[(i + 1) % n];
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      i ? c.quadraticCurveTo(p[0], p[1], mx, my) : c.moveTo(mx, my);
    }
    c.closePath(); c.stroke();
  }

  /* ---- Etiketten: Beschriftung, Hinweis, Preis ---- */

  function banner(c, s, col) {           // Wimpelband, ar 3
    const w = s, h = s / 3;
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(-w / 2, -h / 2); c.lineTo(w / 2, -h / 2);
    c.lineTo(w * 0.36, 0); c.lineTo(w / 2, h / 2); c.lineTo(-w / 2, h / 2);
    c.lineTo(-w * 0.36, 0); c.closePath(); c.fill();
    c.fillStyle = rgba('#000000', .12);
    c.fillRect(-w / 2, h * 0.3, w, h * 0.2);
  }
  function etikett(c, s, col) {          // Anhänger mit Loch, ar 1.7
    const w = s, h = s / 1.7, r = h * 0.18;
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(-w / 2 + h * 0.42, -h / 2);
    c.lineTo(w / 2 - r, -h / 2); c.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    c.lineTo(w / 2, h / 2 - r); c.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    c.lineTo(-w / 2 + h * 0.42, h / 2);
    c.lineTo(-w / 2, 0); c.closePath(); c.fill();
    c.fillStyle = rgba('#ffffff', .85);
    c.beginPath(); c.arc(-w / 2 + h * 0.34, 0, h * 0.09, 0, TAU); c.fill();
  }
  function sprechblase(c, s, col) {
    const w = s, h = s * 0.72, r = s * 0.14;
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(-w / 2 + r, -h / 2);
    c.lineTo(w / 2 - r, -h / 2); c.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    c.lineTo(w / 2, h * 0.2 - r); c.quadraticCurveTo(w / 2, h * 0.2, w / 2 - r, h * 0.2);
    c.lineTo(-w * 0.16, h * 0.2); c.lineTo(-w * 0.3, h / 2); c.lineTo(-w * 0.3, h * 0.2);
    c.lineTo(-w / 2 + r, h * 0.2); c.quadraticCurveTo(-w / 2, h * 0.2, -w / 2, h * 0.2 - r);
    c.lineTo(-w / 2, -h / 2 + r); c.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    c.fill();
  }
  function pfeil(c, s, col) {            // handgezeichneter Bogenpfeil, ar 1.6
    const w = s, h = s / 1.6;
    c.strokeStyle = col; c.lineWidth = s * 0.035; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-w * 0.44, -h * 0.22);
    c.bezierCurveTo(-w * 0.1, -h * 0.5, w * 0.24, -h * 0.34, w * 0.4, h * 0.16);
    c.stroke();
    c.beginPath();
    c.moveTo(w * 0.4, h * 0.16); c.lineTo(w * 0.17, h * 0.05);
    c.moveTo(w * 0.4, h * 0.16); c.lineTo(w * 0.3, h * 0.42);
    c.stroke();
  }
  function tapeStreifen(c, s, col) {     // Klebeband, ar 3.4
    const w = s, h = s / 3.4;
    c.fillStyle = rgba(col, .62);
    c.beginPath();
    c.moveTo(-w / 2, -h / 2 + h * 0.12);
    c.lineTo(-w / 2 + h * 0.2, -h / 2);
    c.lineTo(w / 2 - h * 0.16, -h / 2 + h * 0.08);
    c.lineTo(w / 2, h / 2 - h * 0.1);
    c.lineTo(w / 2 - h * 0.22, h / 2);
    c.lineTo(-w / 2 + h * 0.14, h / 2 - h * 0.06);
    c.closePath(); c.fill();
    c.strokeStyle = rgba('#ffffff', .35); c.lineWidth = h * 0.06;
    c.beginPath(); c.moveTo(-w * 0.4, -h * 0.1); c.lineTo(w * 0.4, -h * 0.16); c.stroke();
  }
  function sternRahmen(c, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.03;
    c.strokeRect(-s * 0.44, -s * 0.32, s * 0.88, s * 0.64);
    const star = (x, y, r) => {
      c.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU, rr = i % 2 ? r * 0.4 : r;
        i ? c.lineTo(Math.cos(a) * rr + x, Math.sin(a) * rr + y) : c.moveTo(Math.cos(a) * rr + x, Math.sin(a) * rr + y);
      }
      c.closePath(); c.fill();
    };
    c.fillStyle = col;
    star(-s * 0.44, -s * 0.32, s * 0.07);
    star(s * 0.44, -s * 0.32, s * 0.05);
    star(-s * 0.44, s * 0.32, s * 0.05);
    star(s * 0.44, s * 0.32, s * 0.07);
  }
  function nummernkreis(c, s, col) {
    c.fillStyle = col;
    c.beginPath(); c.arc(0, 0, s * 0.4, 0, TAU); c.fill();
    c.strokeStyle = rgba('#ffffff', .9); c.lineWidth = s * 0.022;
    c.beginPath(); c.arc(0, 0, s * 0.31, 0, TAU); c.stroke();
  }
  function zitatZeichen(c, s, col) {
    c.fillStyle = col;
    const mark = (x) => {
      c.beginPath();
      c.moveTo(x, -s * 0.26);
      c.quadraticCurveTo(x - s * 0.16, -s * 0.26, x - s * 0.16, -s * 0.02);
      c.quadraticCurveTo(x - s * 0.16, s * 0.24, x + s * 0.02, s * 0.26);
      c.quadraticCurveTo(x - s * 0.04, s * 0.06, x + s * 0.04, -s * 0.02);
      c.quadraticCurveTo(x + s * 0.02, -s * 0.24, x, -s * 0.26);
      c.fill();
    };
    mark(-s * 0.06); mark(s * 0.3);
  }

  /* ---- Himmel: Sonne, Mond, Wolken ---- */

  function sonne(c, s, col) {
    const r = s * 0.24;
    c.fillStyle = col;
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.strokeStyle = col; c.lineWidth = s * 0.03; c.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      c.beginPath();
      c.moveTo(Math.cos(a) * r * 1.4, Math.sin(a) * r * 1.4);
      c.lineTo(Math.cos(a) * r * (i % 2 ? 1.7 : 1.95), Math.sin(a) * r * (i % 2 ? 1.7 : 1.95));
      c.stroke();
    }
  }
  function mondSterne(c, s, col) {
    c.fillStyle = col;
    c.beginPath();
    c.arc(s * 0.04, 0, s * 0.34, TAU * 0.16, TAU * 0.84);
    c.quadraticCurveTo(-s * 0.06, 0, s * 0.04 + Math.cos(TAU * 0.16) * s * 0.34, Math.sin(TAU * 0.16) * s * 0.34);
    c.fill();
    const st = (x, y, r) => {
      c.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU - Math.PI / 2, rr = i % 2 ? r * 0.36 : r;
        i ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      c.closePath(); c.fill();
    };
    st(-s * 0.32, -s * 0.3, s * 0.075);
    st(-s * 0.4, s * 0.12, s * 0.05);
    st(-s * 0.2, s * 0.36, s * 0.04);
  }
  function wolke(c, s, col) {             // ar 1.8
    const w = s, h = s / 1.8;
    c.fillStyle = col;
    c.beginPath();
    c.arc(-w * 0.22, h * 0.06, h * 0.3, 0, TAU);
    c.arc(-w * 0.02, -h * 0.12, h * 0.4, 0, TAU);
    c.arc(w * 0.22, h * 0.04, h * 0.32, 0, TAU);
    c.fill();
    c.fillRect(-w * 0.34, h * 0.06, w * 0.68, h * 0.3);
    c.beginPath();
    c.arc(-w * 0.34, h * 0.21, h * 0.15, 0, TAU);
    c.arc(w * 0.34, h * 0.21, h * 0.15, 0, TAU);
    c.fill();
  }
  function regenbogen(c, s, col) {       // ar 1.7
    const w = s, r0 = w * 0.46;
    const cols = [col, shade(col, 26), shade(col, 52), shade(col, 74)];
    c.lineCap = 'butt';
    cols.forEach((cc, i) => {
      c.strokeStyle = cc; c.lineWidth = w * 0.075;
      c.beginPath();
      c.arc(0, w * 0.24, r0 - i * w * 0.082, Math.PI, 0);
      c.stroke();
    });
  }
  function sternschnuppe(c, s, col) {
    c.strokeStyle = rgba(col, .55); c.lineWidth = s * 0.022; c.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(-s * 0.42 + i * s * 0.06, -s * 0.3 + i * s * 0.12);
      c.lineTo(s * 0.06 + i * s * 0.04, s * 0.02 + i * s * 0.08);
      c.stroke();
    }
    c.fillStyle = col;
    c.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU - Math.PI / 2, rr = i % 2 ? s * 0.055 : s * 0.15;
      i ? c.lineTo(s * 0.24 + Math.cos(a) * rr, s * 0.12 + Math.sin(a) * rr)
        : c.moveTo(s * 0.24 + Math.cos(a) * rr, s * 0.12 + Math.sin(a) * rr);
    }
    c.closePath(); c.fill();
  }
  function strahlenFaecher(c, s, col) {
    c.fillStyle = rgba(col, .4);
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + (i - 4) * 0.19;
      c.beginPath();
      c.moveTo(0, s * 0.44);
      c.lineTo(Math.cos(a - 0.045) * s, s * 0.44 + Math.sin(a - 0.045) * s);
      c.lineTo(Math.cos(a + 0.045) * s, s * 0.44 + Math.sin(a + 0.045) * s);
      c.closePath(); c.fill();
    }
  }
  function sternenStreu(c, s, col) {
    const r = rnd(11);
    c.fillStyle = col;
    for (let i = 0; i < 14; i++) {
      const x = (r() - 0.5) * s * 0.94, y = (r() - 0.5) * s * 0.94;
      const rr = s * (0.02 + r() * 0.045);
      c.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * TAU - Math.PI / 2, d = k % 2 ? rr * 0.34 : rr;
        k ? c.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d) : c.moveTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
      }
      c.closePath(); c.fill();
    }
  }
  function wolkenband(c, s, col) {       // ar 3.2 – läuft über Schnittkanten
    const w = s, h = s / 3.2;
    c.fillStyle = rgba(col, .8);
    c.beginPath();
    c.moveTo(-w / 2, h / 2);
    for (let i = 0; i <= 8; i++) {
      const x = -w / 2 + (i / 8) * w;
      c.quadraticCurveTo(x + w / 32, -h / 2 + (i % 2) * h * 0.3, x + w / 8, h * 0.1);
    }
    c.lineTo(w / 2, h / 2); c.closePath(); c.fill();
  }

  const NEU = [
    { id: 'bo-bogen',   cat: 'boho', name: 'Torbogen',      draw: bogen },
    { id: 'bo-sonne',   cat: 'boho', name: 'Sonnenbogen',   anim: 'breathe', draw: sonnenbogen },
    { id: 'bo-welle',   cat: 'boho', name: 'Wellenlinien',  draw: welle },
    { id: 'bo-berge',   cat: 'boho', name: 'Berge',         draw: berge },
    { id: 'bo-zweig',   cat: 'boho', name: 'Blattzweig',    anim: 'sway', draw: zweig },
    { id: 'bo-terra',   cat: 'boho', name: 'Terrazzo',      draw: terrazzo },
    { id: 'bo-perlen',  cat: 'boho', name: 'Perlenbogen',   draw: perlenbogen },
    { id: 'bo-blob',    cat: 'boho', name: 'Blob-Rahmen',   draw: blobRahmen },

    { id: 'lb-banner',  cat: 'label', name: 'Wimpelband',   ar: 3,   draw: banner },
    { id: 'lb-etikett', cat: 'label', name: 'Anhänger',     ar: 1.7, draw: etikett },
    { id: 'lb-blase',   cat: 'label', name: 'Sprechblase',  draw: sprechblase },
    { id: 'lb-pfeil',   cat: 'label', name: 'Bogenpfeil',   ar: 1.6, draw: pfeil },
    { id: 'lb-tape',    cat: 'label', name: 'Klebeband',    ar: 3.4, draw: tapeStreifen },
    { id: 'lb-stern',   cat: 'label', name: 'Sternrahmen',  draw: sternRahmen },
    { id: 'lb-nummer',  cat: 'label', name: 'Nummernkreis', draw: nummernkreis },
    { id: 'lb-zitat',   cat: 'label', name: 'Zitatzeichen', draw: zitatZeichen },

    { id: 'hi-sonne',   cat: 'himmel', name: 'Sonne',        anim: 'rotate-slow', draw: sonne },
    { id: 'hi-mond',    cat: 'himmel', name: 'Mond & Sterne', anim: 'twinkle', draw: mondSterne },
    { id: 'hi-wolke',   cat: 'himmel', name: 'Wolke',        ar: 1.8, anim: 'float', draw: wolke },
    { id: 'hi-regen',   cat: 'himmel', name: 'Regenbogen',   ar: 1.7, draw: regenbogen },
    { id: 'hi-schnupp', cat: 'himmel', name: 'Sternschnuppe', anim: 'sparkle-burst', draw: sternschnuppe },
    { id: 'hi-strahl',  cat: 'himmel', name: 'Strahlenfächer', anim: 'shimmer', draw: strahlenFaecher },
    { id: 'hi-streu',   cat: 'himmel', name: 'Sternenstreu', anim: 'twinkle', draw: sternenStreu },
    { id: 'hi-band',    cat: 'himmel', name: 'Wolkenband',   ar: 3.2, draw: wolkenband },
  ];

  /* Animationen, die es nicht gibt, still fallen lassen */
  if (SS.ANIMS) {
    const known = new Set(SS.ANIMS.map(a => a.id));
    for (const d of NEU) if (d.anim && !known.has(d.anim)) delete d.anim;
  }
  for (const d of NEU) SS.STICKERS.push(d);

  /* ============================================================
     2. Hintergründe
     ============================================================ */

  function band(c, W, H, stops, angle) {
    const g = angle === 'v' ? c.createLinearGradient(0, 0, 0, H) : c.createLinearGradient(0, 0, W, 0);
    stops.forEach(([t, col]) => g.addColorStop(t, col));
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  function korn(c, W, H, amt, seed) {
    const r = rnd(seed || 5);
    c.save();
    for (let i = 0; i < (W * H) / 5200; i++) {
      c.fillStyle = rgba(r() > .5 ? '#ffffff' : '#000000', amt * (0.3 + r() * 0.7));
      const x = r() * W, y = r() * H, s = 1 + r() * 2;
      c.fillRect(x, y, s, s);
    }
    c.restore();
  }

  /* ---- nahtlos über das ganze Panorama ---- */

  function duenen(c, W, H) {
    band(c, W, H, [[0, '#F4E3D0'], [.55, '#E9CBA9'], [1, '#DCB48B']], 'v');
    const r = rnd(21);
    for (let k = 0; k < 5; k++) {
      const base = H * (0.42 + k * 0.13);
      c.fillStyle = rgba(k % 2 ? '#C89A73' : '#E8CFAE', .55);
      c.beginPath(); c.moveTo(0, H);
      for (let x = 0; x <= W; x += W / 60) {
        c.lineTo(x, base + Math.sin(x / W * TAU * (1.2 + k * 0.6) + k) * H * 0.06);
      }
      c.lineTo(W, H); c.closePath(); c.fill();
    }
    korn(c, W, H, .05, 21);
  }
  function nebelwald(c, W, H) {
    band(c, W, H, [[0, '#DCE4DD'], [.6, '#B9C7BC'], [1, '#8FA294']], 'v');
    const r = rnd(31), u = H;
    for (let layer = 0; layer < 3; layer++) {
      const base = H * (0.6 + layer * 0.13);
      const step = u * (0.62 - layer * 0.14);
      c.fillStyle = rgba('#3F5245', .14 + layer * .14);
      for (let x = -step; x < W + step; x += step) {
        const h = u * (0.2 + r() * 0.16) * (1 - layer * 0.2);
        const w = step * 0.16;
        c.beginPath();
        c.moveTo(x, H);
        c.lineTo(x - w, base);
        c.quadraticCurveTo(x - w * 0.55, base - h * 0.55, x, base - h);
        c.quadraticCurveTo(x + w * 0.55, base - h * 0.55, x + w, base);
        c.closePath(); c.fill();
      }
      const g = c.createLinearGradient(0, base - u * 0.16, 0, base + u * 0.12);
      g.addColorStop(0, rgba('#E8EFE9', 0));
      g.addColorStop(.5, rgba('#E8EFE9', .5));
      g.addColorStop(1, rgba('#E8EFE9', 0));
      c.fillStyle = g;
      c.fillRect(0, base - u * 0.16, W, u * 0.28);
    }
    korn(c, W, H, .04, 31);
  }
  function terrazzoBand(c, W, H) {
    c.fillStyle = '#F5EFE6'; c.fillRect(0, 0, W, H);
    const r = rnd(41);
    const pal = ['#C8553D', '#D9A05B', '#8FA294', '#B9A48C', '#6B5B4B'];
    const u = Math.min(W, H), n = Math.round((W / u) * (H / u) * 420);
    for (let i = 0; i < n; i++) {
      const x = r() * W, y = r() * H, s = u * (0.008 + r() * 0.022);
      c.save(); c.translate(x, y); c.rotate(r() * TAU);
      c.fillStyle = rgba(pal[Math.floor(r() * pal.length)], .55 + r() * 0.4);
      c.beginPath(); c.ellipse(0, 0, s, s * (0.5 + r() * 0.6), 0, 0, TAU); c.fill();
      c.restore();
    }
  }
  function leinen(c, W, H) {
    band(c, W, H, [[0, '#F6F1E7'], [1, '#EBE3D4']], 'v');
    const step = Math.max(3, Math.round(Math.min(W, H) / 320));
    c.strokeStyle = rgba('#C9BEA8', .35); c.lineWidth = 1;
    for (let x = 0; x < W; x += step) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
    c.strokeStyle = rgba('#D8CFBC', .5);
    for (let y = 0; y < H; y += step) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    korn(c, W, H, .05, 51);
  }
  function sonnenstrahlen(c, W, H) {
    band(c, W, H, [[0, '#FBE6CE'], [.6, '#F3C9A4'], [1, '#E3A882']], 'v');
    const cx = W * 0.5, cy = H * 1.06;
    for (let i = 0; i < 26; i++) {
      const a = -Math.PI / 2 + (i - 13) * 0.115;
      c.fillStyle = rgba('#FFF6E7', i % 2 ? .16 : .07);
      c.beginPath(); c.moveTo(cx, cy);
      c.lineTo(cx + Math.cos(a - .04) * W * 1.4, cy + Math.sin(a - .04) * W * 1.4);
      c.lineTo(cx + Math.cos(a + .04) * W * 1.4, cy + Math.sin(a + .04) * W * 1.4);
      c.closePath(); c.fill();
    }
    korn(c, W, H, .04, 61);
  }
  function wellenband(c, W, H) {
    band(c, W, H, [[0, '#E8F0F2'], [1, '#C3D8DE']], 'v');
    for (let k = 0; k < 7; k++) {
      c.strokeStyle = rgba('#6E93A0', .18 + k * 0.05);
      c.lineWidth = Math.max(1.5, H * 0.004);
      c.beginPath();
      for (let x = 0; x <= W; x += W / 200) {
        const y = H * (0.2 + k * 0.1) + Math.sin(x / W * TAU * 2.5 + k * 0.6) * H * 0.05;
        x ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
    }
  }
  function streifenverlauf(c, W, H) {
    band(c, W, H, [[0, '#F7E7DE'], [.5, '#E5C3C9'], [1, '#C9AFC4']]);
    const n = 26;
    for (let i = 0; i < n; i++) {
      c.fillStyle = rgba('#FFFFFF', i % 2 ? .16 : .05);
      c.fillRect((i / n) * W, 0, W / n / 2, H);
    }
    korn(c, W, H, .03, 71);
  }
  function bluetenstreu(c, W, H) {
    band(c, W, H, [[0, '#FBF3EE'], [1, '#F2DED6']], 'v');
    const r = rnd(81), u = Math.min(W, H);
    for (let i = 0, n = Math.round((W / u) * (H / u) * 90); i < n; i++) {
      const x = r() * W, y = r() * H, s = u * (0.014 + r() * 0.022);
      c.save(); c.translate(x, y); c.rotate(r() * TAU);
      c.fillStyle = rgba(r() > .6 ? '#C8553D' : '#D9A0A6', .3 + r() * 0.3);
      for (let p = 0; p < 5; p++) {
        c.rotate(TAU / 5);
        c.beginPath(); c.ellipse(0, -s * 0.6, s * 0.3, s * 0.6, 0, 0, TAU); c.fill();
      }
      c.restore();
    }
  }

  /* ---- Texturen und Muster ---- */

  function kalkputz(c, W, H) {
    band(c, W, H, [[0, '#F3EEE6'], [1, '#E4DDD1']], 'v');
    const r = rnd(91), u = Math.min(W, H);
    for (let i = 0, n = Math.round((W / u) * (H / u) * 320); i < n; i++) {
      const x = r() * W, y = r() * H, s = u * (0.012 + r() * 0.06);
      c.fillStyle = rgba(r() > .5 ? '#FFFFFF' : '#CFC6B6', .16);
      c.beginPath(); c.ellipse(x, y, s, s * (0.4 + r() * 0.6), r() * TAU, 0, TAU); c.fill();
    }
    korn(c, W, H, .06, 91);
  }
  function marmorAder(c, W, H) {
    band(c, W, H, [[0, '#F7F4EF'], [1, '#EAE5DC']], 'v');
    const r = rnd(101);
    for (let k = 0; k < 9; k++) {
      c.strokeStyle = rgba(k % 3 ? '#C7BEAE' : '#9A9080', .3 + r() * 0.3);
      c.lineWidth = Math.max(1, Math.min(W, H) * (0.001 + r() * 0.004));
      c.beginPath();
      let x = 0, y = r() * H;
      c.moveTo(x, y);
      while (x < W) {
        x += W / 22;
        y += (r() - 0.5) * H * 0.22;
        c.quadraticCurveTo(x - W / 44, y + (r() - 0.5) * H * 0.1, x, y);
      }
      c.stroke();
    }
  }
  function reispapier(c, W, H) {
    c.fillStyle = '#F8F4EA'; c.fillRect(0, 0, W, H);
    const r = rnd(111);
    c.strokeStyle = rgba('#CFC4AC', .45); c.lineWidth = 1;
    const u0 = Math.min(W, H);
    for (let i = 0, n = Math.round((W / u0) * (H / u0) * 260); i < n; i++) {
      const x = r() * W, y = r() * H, l = u0 * (0.02 + r() * 0.06), a = r() * TAU;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke();
    }
    korn(c, W, H, .04, 111);
  }
  function boucle(c, W, H) {
    c.fillStyle = '#EFE7D9'; c.fillRect(0, 0, W, H);
    const r = rnd(121), step = Math.min(W, H) * 0.03;
    for (let y = 0; y < H + step; y += step) {
      for (let x = 0; x < W + step; x += step) {
        c.strokeStyle = rgba(r() > .5 ? '#FFFFFF' : '#D5C9B4', .5);
        c.lineWidth = step * 0.28;
        c.beginPath(); c.arc(x, y, step * 0.32, 0, TAU * (0.5 + r() * 0.5)); c.stroke();
      }
    }
  }
  function punktRaster(c, W, H) {
    c.fillStyle = '#FAF7F2'; c.fillRect(0, 0, W, H);
    const step = Math.min(W, H) * 0.055;
    c.fillStyle = rgba('#C8553D', .34);
    for (let y = step / 2; y < H; y += step)
      for (let x = step / 2; x < W; x += step) {
        c.beginPath(); c.arc(x, y, step * 0.1, 0, TAU); c.fill();
      }
  }
  function rauten(c, W, H) {
    c.fillStyle = '#F5EFE6'; c.fillRect(0, 0, W, H);
    const step = Math.min(W, H) * 0.085;
    c.strokeStyle = rgba('#B9A48C', .55); c.lineWidth = Math.max(1, step * 0.035);
    for (let x = -H; x < W + H; x += step) {
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x + H, H); c.stroke();
      c.beginPath(); c.moveTo(x + H, 0); c.lineTo(x, H); c.stroke();
    }
  }

  const BG_NEU = [
    { id: 'sl-duenen',    cat: 'nahtlos', name: 'Sanddünen',      paint: duenen },
    { id: 'sl-nebelwald', cat: 'nahtlos', name: 'Nebelwald',      paint: nebelwald },
    { id: 'sl-terrazzo',  cat: 'nahtlos', name: 'Terrazzo',       paint: terrazzoBand },
    { id: 'sl-leinen',    cat: 'nahtlos', name: 'Leinen',         paint: leinen },
    { id: 'sl-strahlen',  cat: 'nahtlos', name: 'Sonnenstrahlen', paint: sonnenstrahlen },
    { id: 'sl-wellen',    cat: 'nahtlos', name: 'Wellenband',     paint: wellenband },
    { id: 'sl-streifen',  cat: 'nahtlos', name: 'Streifenverlauf', paint: streifenverlauf },
    { id: 'sl-blueten',   cat: 'nahtlos', name: 'Blütenstreu',    paint: bluetenstreu },

    { id: 'pr-kalk',      cat: 'textur', name: 'Kalkputz',   paint: kalkputz },
    { id: 'pr-marmor2',   cat: 'textur', name: 'Marmorader', paint: marmorAder },
    { id: 'pr-reis',      cat: 'textur', name: 'Reispapier', paint: reispapier },
    { id: 'pr-boucle',    cat: 'textur', name: 'Bouclé',     paint: boucle },
    { id: 'pt-punkte2',   cat: 'muster', name: 'Punktraster', paint: punktRaster },
    { id: 'pt-rauten',    cat: 'muster', name: 'Rauten',      paint: rauten },
  ];
  for (const d of BG_NEU) SS.BG_LIB.push(d);

  /* ============================================================
     3. Looks
     ============================================================ */

  const LOOK_NEU = [
    { id: 'duene',   name: 'Dune',           bg: 'sl-duenen',    frame: 'arch',     fcol: '#F7ECE0',
      font: 'Marcellus',        ink: '#6B503A', acc: '#C8553D', filter: 'warm',
      pal: ['#F4E3D0', '#DCB48B', '#C8553D'] },
    { id: 'nebel',   name: 'Nebelwald',      bg: 'sl-nebelwald', frame: 'thin',     fcol: '#F2F5F1',
      font: 'Cormorant Upright', ink: '#3F5245', acc: '#8FA294', filter: 'matte',
      pal: ['#DCE4DD', '#B9C7BC', '#3F5245'] },
    { id: 'terra',   name: 'Terrazzo Studio', bg: 'sl-terrazzo', frame: 'rounded',  fcol: '#FFFFFF',
      font: 'Poppins',          ink: '#2F2A26', acc: '#C8553D', filter: 'original',
      pal: ['#F5EFE6', '#D9A05B', '#C8553D'] },
    { id: 'leinen',  name: 'Leinen & Tinte', bg: 'sl-leinen',    frame: 'double',   fcol: '#FFFFFF',
      font: 'Libre Baskerville', ink: '#3A332C', acc: '#6B5B4B', filter: 'fade',
      pal: ['#F6F1E7', '#C9BEA8', '#6B5B4B'] },
  ];
  if (SS.LOOKS) for (const l of LOOK_NEU) SS.LOOKS.push(l);

  SS.CONTENT5 = { stickers: NEU.length, backgrounds: BG_NEU.length, looks: LOOK_NEU.length };
})();
