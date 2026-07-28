/* Seamless Studio 5.2 – Sticker, dritter Satz
   ============================================================================
   120 neue Motive in sieben Kategorien, die bisher gefehlt haben:

     🎄 Feste      Weihnachten, Ostern, Halloween, Geburtstag, Hochzeit, Baby
     ✈ Reise      Koffer, Karte, Kompass, Palme, Kamera, Ticket
     ☕ Café       Kaffee, Kuchen, Wein, Eis, Picknick
     ◈ Angebot    Preise, Pfeile, Haken, Sterne, Sprechblasen, Siegel
     ❀ Botanik    Eukalyptus, Trockenblumen, Pampas, Kränze, Ranken
     ▣ Rahmen     Zierrahmen, Ecken, Trennlinien, Bänder, Washi-Tape
     ✎ Handschrift Kringel, Unterstreichungen, Pfeile zum Betonen

   Alles wird gerechnet, nichts nachgeladen; alles ist einfärbbar und
   bekommt automatisch den Sticker-Cache aus 5.1.
   ========================================================================= */

(function () {
  const TAU = Math.PI * 2;
  const S = Math.sin, C = Math.cos;

  /* ---------------- Werkzeugkasten ---------------- */
  function shade(hex, amt) {
    const h = String(hex).replace('#', '');
    const n = [0, 2, 4].map(i => Math.max(0, Math.min(255, parseInt(h.slice(i, i + 2), 16) + amt)));
    return '#' + n.map(v => v.toString(16).padStart(2, '0')).join('');
  }
  function rgba(hex, a) {
    const h = String(hex).replace('#', '');
    const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
    return `rgba(${r},${g},${b},${a})`;
  }
  function ball(c, x, y, r, col) {
    const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r);
    g.addColorStop(0, shade(col, 78));
    g.addColorStop(0.45, col);
    g.addColorStop(1, shade(col, -62));
    return g;
  }
  function glanz(c, x, y, rx, ry, a) {
    c.save();
    const g = c.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
    g.addColorStop(0, `rgba(255,255,255,${a})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.beginPath(); c.ellipse(x, y, rx, ry, -0.5, 0, TAU); c.fill();
    c.restore();
  }
  function schatten(c, s, fn, a) {
    c.save();
    c.shadowColor = `rgba(28,18,12,${a === undefined ? 0.30 : a})`;
    c.shadowBlur = s * 0.09; c.shadowOffsetY = s * 0.04;
    fn(); c.restore();
  }
  const rnd = (seed) => { let x = seed; return () => { x = (x * 1103515245 + 12345) & 0x7fffffff; return x / 0x7fffffff; }; };
  function stern(c, x, y, r, z, innen) {
    c.beginPath();
    for (let i = 0; i < z * 2; i++) {
      const a = -Math.PI / 2 + i * Math.PI / z;
      const rr = i % 2 ? r * innen : r;
      i ? c.lineTo(x + C(a) * rr, y + S(a) * rr) : c.moveTo(x + C(a) * rr, y + S(a) * rr);
    }
    c.closePath();
  }
  function rrect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  function blatt(c, x, y, l, b, dreh, col) {
    c.save(); c.translate(x, y); c.rotate(dreh);
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(b, -l * 0.42, 0, -l);
    c.quadraticCurveTo(-b, -l * 0.42, 0, 0);
    c.closePath();
    c.fillStyle = col; c.fill();
    c.strokeStyle = rgba(shade(col, -50), 0.5); c.lineWidth = l * 0.035;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -l * 0.94); c.stroke();
    c.restore();
  }
  /* Löcher stanzen (destination-out) darf NIE direkt auf der Leinwand passieren –
     das würde alles darunter mit auslöschen. Deshalb über ein Zwischenbild. */
  function mitAusschnitt(c, s, malen, stanzen) {
    const px = Math.max(32, Math.min(1200, Math.round(s * 2.2)));
    const cv = SS.makeCanvas(px, px);
    const cc = cv.getContext('2d');
    const k = px / (s * 2.2);
    cc.translate(px / 2, px / 2); cc.scale(k, k);
    malen(cc);
    cc.globalCompositeOperation = 'destination-out';
    stanzen(cc);
    cc.globalCompositeOperation = 'source-over';
    c.drawImage(cv, -s * 1.1, -s * 1.1, s * 2.2, s * 2.2);
    SS.freeCanvas(cv);
  }

  const lin = (c, x1, y1, x2, y2, col, w) => {
    c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  };

  /* ================================================================
     🎄 FESTE & JAHRESZEITEN
     ================================================================ */
  function tannenbaum(c, s, col) {
    const g = shade(col, -10);
    schatten(c, s, () => {
      c.fillStyle = shade(col, -55);
      c.fillRect(-s * 0.045, s * 0.30, s * 0.09, s * 0.14);
      for (let i = 0; i < 3; i++) {
        const y = s * (0.30 - i * 0.20), w = s * (0.40 - i * 0.105);
        c.fillStyle = shade(g, i * 14 - 8);
        c.beginPath(); c.moveTo(0, y - s * 0.28); c.lineTo(w, y); c.lineTo(-w, y); c.closePath(); c.fill();
      }
    });
    c.fillStyle = shade(col, 90);
    stern(c, 0, -s * 0.44, s * 0.09, 5, 0.45); c.fill();
  }
  function kugelSchmuck(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = ball(c, 0, s * 0.05, s * 0.34, col);
      c.beginPath(); c.arc(0, s * 0.05, s * 0.34, 0, TAU); c.fill();
    });
    c.fillStyle = shade(col, -55);
    rrect(c, -s * 0.07, -s * 0.38, s * 0.14, s * 0.12, s * 0.03); c.fill();
    c.strokeStyle = shade(col, -55); c.lineWidth = s * 0.028;
    c.beginPath(); c.arc(0, -s * 0.42, s * 0.06, Math.PI, TAU); c.stroke();
    c.strokeStyle = rgba('#ffffff', 0.5); c.lineWidth = s * 0.018;
    c.beginPath(); c.arc(0, s * 0.05, s * 0.22, 2.5, 4.4); c.stroke();
    glanz(c, -s * 0.12, -s * 0.08, s * 0.10, s * 0.07, 0.85);
  }
  function schneeflocke(c, s, col) {
    c.strokeStyle = col; c.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      c.save(); c.rotate(i * TAU / 6);
      c.lineWidth = s * 0.035;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -s * 0.44); c.stroke();
      c.lineWidth = s * 0.026;
      for (const [d, l] of [[0.20, 0.11], [0.31, 0.09], [0.40, 0.06]]) {
        c.beginPath();
        c.moveTo(0, -s * d); c.lineTo(-s * l, -s * (d + l * 0.75));
        c.moveTo(0, -s * d); c.lineTo(s * l, -s * (d + l * 0.75));
        c.stroke();
      }
      c.restore();
    }
    c.fillStyle = shade(col, 40);
    c.beginPath(); c.arc(0, 0, s * 0.055, 0, TAU); c.fill();
  }
  function geschenk(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = col; rrect(c, -s * 0.34, -s * 0.16, s * 0.68, s * 0.5, s * 0.04); c.fill();
      c.fillStyle = shade(col, 26); rrect(c, -s * 0.38, -s * 0.30, s * 0.76, s * 0.17, s * 0.04); c.fill();
    });
    c.fillStyle = shade(col, -45);
    c.fillRect(-s * 0.055, -s * 0.30, s * 0.11, s * 0.64);
    c.strokeStyle = shade(col, -45); c.lineWidth = s * 0.05;
    c.beginPath();
    c.moveTo(0, -s * 0.30); c.bezierCurveTo(-s * 0.30, -s * 0.44, -s * 0.20, -s * 0.06, 0, -s * 0.30);
    c.bezierCurveTo(s * 0.20, -s * 0.06, s * 0.30, -s * 0.44, 0, -s * 0.30);
    c.stroke();
  }
  function kerzeAdvent(c, s, col) {
    schatten(c, s, () => {
      const g = c.createLinearGradient(-s * 0.14, 0, s * 0.14, 0);
      g.addColorStop(0, shade(col, -28)); g.addColorStop(0.4, shade(col, 40)); g.addColorStop(1, shade(col, -40));
      c.fillStyle = g; rrect(c, -s * 0.14, -s * 0.16, s * 0.28, s * 0.60, s * 0.03); c.fill();
    });
    c.strokeStyle = shade(col, -60); c.lineWidth = s * 0.02;
    c.beginPath(); c.moveTo(0, -s * 0.16); c.lineTo(0, -s * 0.24); c.stroke();
    const fg = c.createRadialGradient(0, -s * 0.32, 0, 0, -s * 0.32, s * 0.14);
    fg.addColorStop(0, 'rgba(255,244,214,1)'); fg.addColorStop(0.5, 'rgba(255,196,90,.9)'); fg.addColorStop(1, 'rgba(255,150,40,0)');
    c.fillStyle = fg;
    c.beginPath(); c.ellipse(0, -s * 0.32, s * 0.08, s * 0.14, 0, 0, TAU); c.fill();
  }
  function zuckerstange(c, s, col) {
    c.lineCap = 'round';
    const w = s * 0.15;
    const pfad = () => {
      c.beginPath();
      c.moveTo(-s * 0.05, s * 0.42);
      c.lineTo(-s * 0.05, -s * 0.16);
      c.arc(s * 0.10, -s * 0.16, s * 0.15, Math.PI, 0);
      c.lineTo(s * 0.25, -s * 0.02);
    };
    c.strokeStyle = shade(col, 88); c.lineWidth = w; pfad(); c.stroke();
    c.save();
    c.lineWidth = w; c.strokeStyle = col;
    c.setLineDash([s * 0.07, s * 0.11]);
    pfad(); c.stroke();
    c.restore();
  }
  function schlittschuh(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(-s * 0.18, -s * 0.34);      // Schaft oben hinten
      c.lineTo(s * 0.04, -s * 0.34);
      c.quadraticCurveTo(s * 0.08, -s * 0.10, s * 0.10, s * 0.02);
      c.quadraticCurveTo(s * 0.16, s * 0.06, s * 0.30, s * 0.08);  // Spitze vorn
      c.quadraticCurveTo(s * 0.36, s * 0.09, s * 0.36, s * 0.16);
      c.lineTo(-s * 0.18, s * 0.16);
      c.closePath(); c.fill();
      c.fillStyle = shade(col, 40);
      rrect(c, -s * 0.20, -s * 0.38, s * 0.26, s * 0.09, s * 0.03); c.fill();
    });
    // Schnürung
    c.strokeStyle = shade(col, 80); c.lineWidth = s * 0.016; c.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const y = -s * (0.28 - i * 0.075);
      c.beginPath(); c.moveTo(-s * 0.14, y); c.lineTo(s * 0.02 + i * s * 0.012, y + s * 0.03); c.stroke();
    }
    // Kufe
    c.strokeStyle = shade(col, -60); c.lineWidth = s * 0.03; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-s * 0.16, s * 0.34);
    c.lineTo(s * 0.26, s * 0.34);
    c.quadraticCurveTo(s * 0.40, s * 0.34, s * 0.38, s * 0.20);
    c.stroke();
    c.lineWidth = s * 0.026;
    c.beginPath(); c.moveTo(-s * 0.10, s * 0.16); c.lineTo(-s * 0.10, s * 0.34);
    c.moveTo(s * 0.20, s * 0.16); c.lineTo(s * 0.20, s * 0.34); c.stroke();
  }

  function osterei(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = ball(c, 0, s * 0.03, s * 0.33, col);
      c.beginPath();
      c.moveTo(0, -s * 0.42);
      c.bezierCurveTo(s * 0.30, -s * 0.24, s * 0.32, s * 0.20, 0, s * 0.40);
      c.bezierCurveTo(-s * 0.32, s * 0.20, -s * 0.30, -s * 0.24, 0, -s * 0.42);
      c.closePath(); c.fill();
    });
    c.save();
    c.beginPath();
    c.moveTo(0, -s * 0.42);
    c.bezierCurveTo(s * 0.30, -s * 0.24, s * 0.32, s * 0.20, 0, s * 0.40);
    c.bezierCurveTo(-s * 0.32, s * 0.20, -s * 0.30, -s * 0.24, 0, -s * 0.42);
    c.clip();
    c.strokeStyle = rgba('#ffffff', 0.6); c.lineWidth = s * 0.035;
    for (let i = -2; i <= 3; i++) {
      c.beginPath();
      c.moveTo(-s * 0.4, s * (i * 0.16 - 0.1));
      c.quadraticCurveTo(0, s * (i * 0.16 - 0.19), s * 0.4, s * (i * 0.16 - 0.1));
      c.stroke();
    }
    c.restore();
    glanz(c, -s * 0.11, -s * 0.18, s * 0.09, s * 0.13, 0.8);
  }
  function hase(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = col;
      c.beginPath(); c.ellipse(0, s * 0.18, s * 0.24, s * 0.21, 0, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(0, -s * 0.08, s * 0.17, s * 0.15, 0, 0, TAU); c.fill();
      for (const d of [-1, 1]) {
        c.save(); c.translate(d * s * 0.08, -s * 0.20); c.rotate(d * 0.22);
        c.beginPath(); c.ellipse(0, -s * 0.13, s * 0.055, s * 0.17, 0, 0, TAU); c.fill();
        c.fillStyle = shade(col, 60);
        c.beginPath(); c.ellipse(0, -s * 0.13, s * 0.028, s * 0.115, 0, 0, TAU); c.fill();
        c.fillStyle = col;
        c.restore();
      }
    });
    c.fillStyle = shade(col, -70);
    for (const d of [-1, 1]) { c.beginPath(); c.arc(d * s * 0.062, -s * 0.10, s * 0.019, 0, TAU); c.fill(); }
    c.beginPath(); c.ellipse(0, -s * 0.045, s * 0.022, s * 0.016, 0, 0, TAU); c.fill();
    c.fillStyle = shade(col, 80);
    c.beginPath(); c.arc(s * 0.21, s * 0.24, s * 0.06, 0, TAU); c.fill();
  }
  function kuerbis(c, s, col) {
    schatten(c, s, () => {
      for (const [dx, r] of [[-0.19, 0.20], [0.19, 0.20], [-0.09, 0.26], [0.09, 0.26], [0, 0.29]]) {
        c.fillStyle = ball(c, dx * s, s * 0.06, s * r, col);
        c.beginPath(); c.ellipse(dx * s, s * 0.06, s * r * 0.72, s * r * 1.06, 0, 0, TAU); c.fill();
      }
    });
    c.strokeStyle = shade(col, -60); c.lineWidth = s * 0.045; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, -s * 0.24); c.quadraticCurveTo(s * 0.06, -s * 0.38, -s * 0.04, -s * 0.42); c.stroke();
  }
  function gespenst(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = shade(col, 74);
      c.beginPath();
      c.moveTo(-s * 0.27, s * 0.30);
      c.lineTo(-s * 0.27, -s * 0.06);
      c.arc(0, -s * 0.06, s * 0.27, Math.PI, 0);
      c.lineTo(s * 0.27, s * 0.30);
      for (let i = 0; i < 3; i++) {
        c.quadraticCurveTo(s * (0.18 - i * 0.18), s * 0.40, s * (0.09 - i * 0.18), s * 0.30);
      }
      c.closePath(); c.fill();
    });
    c.fillStyle = shade(col, -70);
    for (const d of [-1, 1]) { c.beginPath(); c.ellipse(d * s * 0.09, -s * 0.08, s * 0.035, s * 0.048, 0, 0, TAU); c.fill(); }
    c.beginPath(); c.ellipse(0, s * 0.04, s * 0.045, s * 0.035, 0, 0, TAU); c.fill();
  }
  function fledermaus(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(0, s * 0.06);
      c.quadraticCurveTo(-s * 0.14, -s * 0.16, -s * 0.24, -s * 0.02);
      c.quadraticCurveTo(-s * 0.32, -s * 0.16, -s * 0.44, -s * 0.06);
      c.quadraticCurveTo(-s * 0.30, s * 0.10, -s * 0.16, s * 0.20);
      c.lineTo(0, s * 0.14);
      c.lineTo(s * 0.16, s * 0.20);
      c.quadraticCurveTo(s * 0.30, s * 0.10, s * 0.44, -s * 0.06);
      c.quadraticCurveTo(s * 0.32, -s * 0.16, s * 0.24, -s * 0.02);
      c.quadraticCurveTo(s * 0.14, -s * 0.16, 0, s * 0.06);
      c.closePath(); c.fill();
      c.beginPath(); c.ellipse(0, -s * 0.02, s * 0.10, s * 0.12, 0, 0, TAU); c.fill();
      for (const d of [-1, 1]) {
        c.beginPath();
        c.moveTo(d * s * 0.03, -s * 0.10); c.lineTo(d * s * 0.10, -s * 0.22); c.lineTo(d * s * 0.10, -s * 0.08);
        c.closePath(); c.fill();
      }
    });
  }
  function torte(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = shade(col, -18);
      rrect(c, -s * 0.30, s * 0.02, s * 0.60, s * 0.30, s * 0.04); c.fill();
      c.fillStyle = shade(col, 34);
      rrect(c, -s * 0.32, -s * 0.10, s * 0.64, s * 0.16, s * 0.06); c.fill();
    });
    c.fillStyle = shade(col, 68);
    c.beginPath();
    c.moveTo(-s * 0.32, -s * 0.02);
    for (let i = 0; i <= 6; i++) c.arc(-s * 0.32 + i * s * 0.107 + s * 0.053, -s * 0.02, s * 0.053, Math.PI, 0, true);
    c.lineTo(s * 0.32, s * 0.06); c.lineTo(-s * 0.32, s * 0.06); c.closePath(); c.fill();
    for (const dx of [-0.17, 0, 0.17]) {
      c.fillStyle = shade(col, -50);
      c.fillRect(dx * s - s * 0.018, -s * 0.28, s * 0.036, s * 0.18);
      const fg = c.createRadialGradient(dx * s, -s * 0.33, 0, dx * s, -s * 0.33, s * 0.07);
      fg.addColorStop(0, 'rgba(255,246,220,1)'); fg.addColorStop(1, 'rgba(255,170,60,0)');
      c.fillStyle = fg;
      c.beginPath(); c.ellipse(dx * s, -s * 0.33, s * 0.04, s * 0.07, 0, 0, TAU); c.fill();
    }
  }
  function luftballon(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = ball(c, 0, -s * 0.10, s * 0.28, col);
      c.beginPath(); c.ellipse(0, -s * 0.10, s * 0.24, s * 0.29, 0, 0, TAU); c.fill();
      c.beginPath();
      c.moveTo(-s * 0.05, s * 0.17); c.lineTo(s * 0.05, s * 0.17); c.lineTo(0, s * 0.23); c.closePath(); c.fill();
    });
    c.strokeStyle = shade(col, -40); c.lineWidth = s * 0.016;
    c.beginPath(); c.moveTo(0, s * 0.23);
    c.bezierCurveTo(s * 0.10, s * 0.32, -s * 0.08, s * 0.38, s * 0.02, s * 0.46); c.stroke();
    glanz(c, -s * 0.09, -s * 0.20, s * 0.07, s * 0.11, 0.8);
  }
  function konfettiWurf(c, s, col) {
    const R = rnd(77);
    for (let i = 0; i < 46; i++) {
      const a = R() * TAU, r = s * (0.06 + R() * 0.40);
      const x = C(a) * r, y = S(a) * r * 0.9;
      c.save(); c.translate(x, y); c.rotate(R() * TAU);
      c.fillStyle = shade(col, Math.round(R() * 110 - 45));
      if (R() > 0.5) c.fillRect(-s * 0.022, -s * 0.010, s * 0.044, s * 0.020);
      else { c.beginPath(); c.arc(0, 0, s * 0.017, 0, TAU); c.fill(); }
      c.restore();
    }
  }
  function sektglaeser(c, s, col) {
    const glas = (dx, dreh) => {
      c.save(); c.translate(dx, 0); c.rotate(dreh);
      c.fillStyle = rgba(shade(col, 60), 0.55);
      c.beginPath();
      c.moveTo(-s * 0.11, -s * 0.28); c.lineTo(s * 0.11, -s * 0.28);
      c.quadraticCurveTo(s * 0.08, s * 0.00, 0, s * 0.04);
      c.quadraticCurveTo(-s * 0.08, s * 0.00, -s * 0.11, -s * 0.28);
      c.closePath(); c.fill();
      c.strokeStyle = shade(col, -25); c.lineWidth = s * 0.022; c.lineCap = 'round';
      c.stroke();
      c.beginPath(); c.moveTo(0, s * 0.04); c.lineTo(0, s * 0.28); c.stroke();
      c.beginPath(); c.moveTo(-s * 0.09, s * 0.30); c.lineTo(s * 0.09, s * 0.30); c.stroke();
      c.restore();
    };
    glas(-s * 0.16, -0.22); glas(s * 0.16, 0.22);
    const R = rnd(31);
    c.fillStyle = shade(col, 92);
    for (let i = 0; i < 9; i++) {
      c.beginPath(); c.arc((R() - 0.5) * s * 0.5, -s * (0.30 + R() * 0.18), s * 0.014, 0, TAU); c.fill();
    }
  }
  function ringePaar(c, s, col) {
    c.lineWidth = s * 0.055;
    for (const [dx, sh] of [[-0.10, 10], [0.10, -20]]) {
      c.strokeStyle = ball(c, dx * s, 0, s * 0.24, shade(col, sh));
      c.beginPath(); c.arc(dx * s, 0, s * 0.20, 0, TAU); c.stroke();
    }
    c.fillStyle = shade(col, 95);
    stern(c, s * 0.10, -s * 0.22, s * 0.075, 4, 0.34); c.fill();
  }
  function hochzeitstorte(c, s, col) {
    schatten(c, s, () => {
      const lagen = [[0.34, 0.16, 0.24], [0.26, 0.16, 0.06], [0.18, 0.16, -0.12]];
      lagen.forEach(([w, h, y], i) => {
        c.fillStyle = shade(col, 30 + i * 16);
        rrect(c, -s * w, s * y, s * w * 2, s * h, s * 0.03); c.fill();
        c.fillStyle = shade(col, 76);
        c.beginPath();
        c.moveTo(-s * w, s * y + s * 0.03);
        for (let k = 0; k <= 8; k++) c.arc(-s * w + (k + 0.5) * (s * w * 2 / 8), s * y + s * 0.03, s * w / 8, Math.PI, 0, true);
        c.lineTo(s * w, s * y); c.lineTo(-s * w, s * y); c.closePath(); c.fill();
      });
    });
    c.fillStyle = shade(col, -30);
    c.beginPath();
    c.moveTo(0, -s * 0.16);
    c.bezierCurveTo(-s * 0.13, -s * 0.30, -s * 0.05, -s * 0.38, 0, -s * 0.30);
    c.bezierCurveTo(s * 0.05, -s * 0.38, s * 0.13, -s * 0.30, 0, -s * 0.16);
    c.closePath(); c.fill();
  }
  function babyschuhe(c, s, col) {
    schatten(c, s, () => {
      for (const d of [-1, 1]) {
        c.save(); c.translate(d * s * 0.17, 0); c.scale(d, 1);
        c.fillStyle = col;
        c.beginPath();
        c.moveTo(-s * 0.13, s * 0.08);
        c.quadraticCurveTo(-s * 0.15, -s * 0.10, -s * 0.02, -s * 0.12);
        c.quadraticCurveTo(s * 0.14, -s * 0.13, s * 0.15, s * 0.05);
        c.quadraticCurveTo(s * 0.14, s * 0.18, -s * 0.02, s * 0.17);
        c.closePath(); c.fill();
        c.fillStyle = shade(col, 62);
        c.beginPath(); c.ellipse(-s * 0.02, -s * 0.10, s * 0.11, s * 0.05, 0, 0, TAU); c.fill();
        c.restore();
      }
    });
  }
  function schnuller(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = shade(col, 46);
      c.beginPath(); c.ellipse(0, s * 0.02, s * 0.28, s * 0.20, 0, 0, TAU); c.fill();
      c.fillStyle = shade(col, -18);
      c.beginPath(); c.arc(0, s * 0.02, s * 0.12, 0, TAU); c.fill();
    });
    c.strokeStyle = shade(col, -18); c.lineWidth = s * 0.05;
    c.beginPath(); c.arc(0, -s * 0.16, s * 0.11, 0.15 * Math.PI, 0.85 * Math.PI, true); c.stroke();
    c.fillStyle = shade(col, 76);
    c.beginPath();
    c.moveTo(-s * 0.07, s * 0.14);
    c.quadraticCurveTo(-s * 0.06, s * 0.36, 0, s * 0.36);
    c.quadraticCurveTo(s * 0.06, s * 0.36, s * 0.07, s * 0.14);
    c.closePath(); c.fill();
  }
  function storch(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = shade(col, 70);
      c.beginPath(); c.ellipse(-s * 0.02, s * 0.02, s * 0.24, s * 0.15, -0.2, 0, TAU); c.fill();
      c.beginPath(); c.arc(s * 0.19, -s * 0.16, s * 0.085, 0, TAU); c.fill();
    });
    c.fillStyle = shade(col, -20);
    c.beginPath();
    c.moveTo(s * 0.26, -s * 0.17); c.lineTo(s * 0.44, -s * 0.13); c.lineTo(s * 0.26, -s * 0.11);
    c.closePath(); c.fill();
    c.fillStyle = shade(col, -70);
    c.beginPath(); c.arc(s * 0.21, -s * 0.19, s * 0.017, 0, TAU); c.fill();
    c.strokeStyle = shade(col, -20); c.lineWidth = s * 0.022; c.lineCap = 'round';
    for (const d of [-0.04, 0.06]) {
      c.beginPath(); c.moveTo(s * d, s * 0.14); c.lineTo(s * (d - 0.01), s * 0.34);
      c.lineTo(s * (d + 0.07), s * 0.36); c.stroke();
    }
    c.fillStyle = col;
    c.beginPath(); c.ellipse(-s * 0.06, -s * 0.03, s * 0.15, s * 0.08, -0.35, 0, TAU); c.fill();
  }
  function kranzTanne(c, s, col) {
    const R = rnd(19);
    for (let i = 0; i < 34; i++) {
      const a = i * TAU / 34 + R() * 0.1;
      const r = s * (0.30 + (R() - 0.5) * 0.05);
      blatt(c, C(a) * r, S(a) * r, s * (0.13 + R() * 0.05), s * 0.035, a + Math.PI / 2 + (R() - 0.5) * 0.5, shade(col, Math.round(R() * 50 - 25)));
    }
    for (let i = 0; i < 7; i++) {
      const a = i * TAU / 7 + 0.3;
      c.fillStyle = shade(col, 70);
      c.beginPath(); c.arc(C(a) * s * 0.30, S(a) * s * 0.30, s * 0.028, 0, TAU); c.fill();
    }
  }
  function stiefel(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(-s * 0.16, -s * 0.22);
      c.lineTo(s * 0.10, -s * 0.22);
      c.lineTo(s * 0.10, s * 0.10);
      c.quadraticCurveTo(s * 0.36, s * 0.14, s * 0.34, s * 0.30);
      c.lineTo(-s * 0.16, s * 0.30);
      c.closePath(); c.fill();
      c.fillStyle = shade(col, 76);
      rrect(c, -s * 0.20, -s * 0.32, s * 0.34, s * 0.14, s * 0.04); c.fill();
    });
  }
  function herbstblatt(c, s, col) {
    // Ahornblatt: fünf Lappen, gezackter Rand, Stiel unten
    const R = s * 0.40;
    const pkt = [];
    const lappen = [-1.30, -0.66, 0, 0.66, 1.30];
    for (const a0 of lappen) {
      const a = -Math.PI / 2 + a0;
      const laenge = R * (1 - Math.abs(a0) * 0.30);
      // Zacken je Lappen
      pkt.push([C(a - 0.16) * laenge * 0.52, S(a - 0.16) * laenge * 0.52]);
      pkt.push([C(a - 0.09) * laenge * 0.82, S(a - 0.09) * laenge * 0.82]);
      pkt.push([C(a) * laenge * 0.70, S(a) * laenge * 0.70]);
      pkt.push([C(a) * laenge, S(a) * laenge]);
      pkt.push([C(a + 0.09) * laenge * 0.70, S(a + 0.09) * laenge * 0.70]);
      pkt.push([C(a + 0.09) * laenge * 0.82, S(a + 0.09) * laenge * 0.82]);
      pkt.push([C(a + 0.16) * laenge * 0.52, S(a + 0.16) * laenge * 0.52]);
    }
    schatten(c, s, () => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(0, s * 0.12);
      pkt.forEach(([x, y], i) => c.lineTo(x, y + s * 0.06));
      c.closePath(); c.fill();
    });
    c.strokeStyle = rgba(shade(col, -55), 0.55); c.lineWidth = s * 0.020; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, s * 0.42); c.lineTo(0, -s * 0.10); c.stroke();
    for (const a0 of lappen) {
      if (!a0) continue;
      const a = -Math.PI / 2 + a0;
      c.beginPath(); c.moveTo(0, s * 0.06);
      c.lineTo(C(a) * R * (1 - Math.abs(a0) * 0.30) * 0.72, S(a) * R * (1 - Math.abs(a0) * 0.30) * 0.72 + s * 0.06);
      c.stroke();
    }
  }

  function sonneSommer(c, s, col) {
    c.fillStyle = ball(c, 0, 0, s * 0.22, col);
    c.beginPath(); c.arc(0, 0, s * 0.21, 0, TAU); c.fill();
    c.strokeStyle = col; c.lineWidth = s * 0.035; c.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      const a = i * TAU / 12;
      const l = i % 2 ? 0.36 : 0.42;
      c.beginPath();
      c.moveTo(C(a) * s * 0.27, S(a) * s * 0.27);
      c.lineTo(C(a) * s * l, S(a) * s * l);
      c.stroke();
    }
    glanz(c, -s * 0.07, -s * 0.08, s * 0.07, s * 0.05, 0.6);
  }
  function muschel(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = ball(c, 0, s * 0.10, s * 0.36, col);
      c.beginPath();
      c.moveTo(0, s * 0.32);
      c.arc(0, s * 0.32, s * 0.36, Math.PI, TAU);
      c.closePath(); c.fill();
    });
    c.strokeStyle = rgba(shade(col, -55), 0.5); c.lineWidth = s * 0.02;
    for (let i = 1; i < 7; i++) {
      const a = Math.PI + i * Math.PI / 7;
      c.beginPath(); c.moveTo(0, s * 0.32); c.lineTo(C(a) * s * 0.35, s * 0.32 + S(a) * s * 0.35); c.stroke();
    }
    c.fillStyle = shade(col, -30);
    c.beginPath(); c.arc(0, s * 0.32, s * 0.05, Math.PI, TAU); c.fill();
  }

  /* ================================================================
     ✈ REISE
     ================================================================ */
  function koffer(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = col; rrect(c, -s * 0.32, -s * 0.18, s * 0.64, s * 0.50, s * 0.05); c.fill();
      c.fillStyle = shade(col, -35); c.fillRect(-s * 0.32, -s * 0.02, s * 0.64, s * 0.06);
    });
    c.strokeStyle = shade(col, -50); c.lineWidth = s * 0.035; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-s * 0.10, -s * 0.18); c.lineTo(-s * 0.10, -s * 0.30);
    c.lineTo(s * 0.10, -s * 0.30); c.lineTo(s * 0.10, -s * 0.18); c.stroke();
    c.fillStyle = shade(col, 55);
    for (const dx of [-0.18, 0.10]) rrect(c, dx * s, s * 0.06, s * 0.08, s * 0.16, s * 0.02), c.fill();
  }
  function flugzeug(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(s * 0.42, 0);
      c.quadraticCurveTo(s * 0.16, -s * 0.07, -s * 0.06, -s * 0.06);
      c.lineTo(-s * 0.28, -s * 0.28); c.lineTo(-s * 0.40, -s * 0.26);
      c.lineTo(-s * 0.24, -s * 0.04);
      c.lineTo(-s * 0.40, s * 0.00); c.lineTo(-s * 0.44, -s * 0.10);
      c.lineTo(-s * 0.50, -s * 0.08); c.lineTo(-s * 0.48, s * 0.06);
      c.lineTo(-s * 0.24, s * 0.06);
      c.lineTo(-s * 0.34, s * 0.28); c.lineTo(-s * 0.22, s * 0.30);
      c.lineTo(0, s * 0.08);
      c.quadraticCurveTo(s * 0.20, s * 0.06, s * 0.42, 0);
      c.closePath(); c.fill();
    });
  }
  function landkarte(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = shade(col, 62);
      c.beginPath();
      c.moveTo(-s * 0.40, -s * 0.22);
      c.lineTo(-s * 0.13, -s * 0.30); c.lineTo(s * 0.13, -s * 0.20);
      c.lineTo(s * 0.40, -s * 0.28); c.lineTo(s * 0.40, s * 0.24);
      c.lineTo(s * 0.13, s * 0.32); c.lineTo(-s * 0.13, s * 0.22);
      c.lineTo(-s * 0.40, s * 0.30);
      c.closePath(); c.fill();
    });
    c.strokeStyle = rgba(shade(col, -40), 0.55); c.lineWidth = s * 0.018;
    c.beginPath(); c.moveTo(-s * 0.13, -s * 0.30); c.lineTo(-s * 0.13, s * 0.22);
    c.moveTo(s * 0.13, -s * 0.20); c.lineTo(s * 0.13, s * 0.32); c.stroke();
    c.setLineDash([s * 0.035, s * 0.03]);
    c.strokeStyle = shade(col, -45); c.lineWidth = s * 0.024;
    c.beginPath();
    c.moveTo(-s * 0.28, s * 0.14);
    c.bezierCurveTo(-s * 0.05, s * 0.05, s * 0.02, -s * 0.12, s * 0.26, -s * 0.14);
    c.stroke(); c.setLineDash([]);
    c.fillStyle = col;
    c.beginPath(); c.arc(s * 0.26, -s * 0.14, s * 0.045, 0, TAU); c.fill();
  }
  function kompass(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = ball(c, 0, 0, s * 0.36, shade(col, 40));
      c.beginPath(); c.arc(0, 0, s * 0.34, 0, TAU); c.fill();
    });
    c.strokeStyle = shade(col, -50); c.lineWidth = s * 0.03;
    c.beginPath(); c.arc(0, 0, s * 0.34, 0, TAU); c.stroke();
    c.beginPath(); c.arc(0, 0, s * 0.27, 0, TAU); c.lineWidth = s * 0.012; c.stroke();
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8;
      c.beginPath();
      c.moveTo(C(a) * s * 0.22, S(a) * s * 0.22);
      c.lineTo(C(a) * s * 0.27, S(a) * s * 0.27);
      c.lineWidth = i % 2 ? s * 0.012 : s * 0.022; c.stroke();
    }
    c.fillStyle = shade(col, -35);
    c.beginPath(); c.moveTo(0, -s * 0.20); c.lineTo(s * 0.06, 0); c.lineTo(-s * 0.06, 0); c.closePath(); c.fill();
    c.fillStyle = shade(col, 78);
    c.beginPath(); c.moveTo(0, s * 0.20); c.lineTo(s * 0.06, 0); c.lineTo(-s * 0.06, 0); c.closePath(); c.fill();
    c.fillStyle = shade(col, -60);
    c.beginPath(); c.arc(0, 0, s * 0.030, 0, TAU); c.fill();
  }
  function berge2(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = shade(col, -18);
      c.beginPath(); c.moveTo(-s * 0.44, s * 0.28); c.lineTo(-s * 0.10, -s * 0.26); c.lineTo(s * 0.20, s * 0.28); c.closePath(); c.fill();
      c.fillStyle = col;
      c.beginPath(); c.moveTo(-s * 0.08, s * 0.28); c.lineTo(s * 0.18, -s * 0.12); c.lineTo(s * 0.44, s * 0.28); c.closePath(); c.fill();
    });
    c.fillStyle = shade(col, 88);
    c.beginPath(); c.moveTo(-s * 0.10, -s * 0.26); c.lineTo(-s * 0.02, -s * 0.13); c.lineTo(-s * 0.06, -s * 0.10);
    c.lineTo(-s * 0.13, -s * 0.14); c.lineTo(-s * 0.18, -s * 0.12); c.closePath(); c.fill();
    c.fillStyle = shade(col, 92);
    c.beginPath(); c.arc(s * 0.28, -s * 0.28, s * 0.075, 0, TAU); c.fill();
  }
  function palme(c, s, col) {
    // Stamm mit Segmenten
    const stamm = (t) => ({ x: s * (0.06 - 0.10 * t + 0.02 * S(t * 3)), y: s * (0.42 - t * 0.58) });
    c.strokeStyle = shade(col, -30);
    c.lineWidth = s * 0.075; c.lineCap = 'round';
    c.beginPath();
    for (let i = 0; i <= 12; i++) { const p = stamm(i / 12); i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y); }
    c.stroke();
    c.strokeStyle = rgba(shade(col, -60), 0.45); c.lineWidth = s * 0.014;
    for (let i = 1; i < 8; i++) {
      const p = stamm(i / 8);
      c.beginPath(); c.moveTo(p.x - s * 0.035, p.y); c.lineTo(p.x + s * 0.035, p.y - s * 0.012); c.stroke();
    }
    // Wedel: sechs gefüllte, gebogene Blätter – bleibt auch klein lesbar
    const top = stamm(1);
    for (let i = 0; i < 6; i++) {
      const aus = (i / 5 - 0.5) * 2;                 // -1 … 1
      const winkel = aus * 1.05 + (i % 2 ? 0.10 : -0.10);
      const L = s * (0.44 - Math.abs(aus) * 0.06);
      const bieg = s * 0.16 * (aus >= 0 ? 1 : -1);
      c.save(); c.translate(top.x, top.y); c.rotate(winkel);
      c.fillStyle = shade(col, i % 2 ? 16 : -16);
      c.beginPath();
      c.moveTo(0, 0);
      // Oberkante bis zur Spitze
      c.bezierCurveTo(-s * 0.11, -L * 0.42, -s * 0.06, -L * 0.82, bieg * 0.5, -L * 0.96);
      // Spitze
      c.quadraticCurveTo(bieg * 0.8, -L, bieg, -L * 0.92);
      // Unterkante zurück
      c.bezierCurveTo(s * 0.05, -L * 0.72, s * 0.09, -L * 0.36, 0, 0);
      c.closePath(); c.fill();
      // Mittelrippe
      c.strokeStyle = rgba(shade(col, -55), 0.5); c.lineWidth = s * 0.012;
      c.beginPath();
      c.moveTo(0, 0);
      c.quadraticCurveTo(-s * 0.02, -L * 0.55, bieg * 0.7, -L * 0.94);
      c.stroke();
      c.restore();
    }
    // Kokosnüsse
    c.fillStyle = shade(col, -50);
    for (const [dx, dy] of [[-0.045, 0.03], [0.035, 0.05], [-0.005, 0.075]]) {
      c.beginPath(); c.arc(top.x + s * dx, top.y + s * dy, s * 0.030, 0, TAU); c.fill();
    }
  }

  function kamera(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = col; rrect(c, -s * 0.36, -s * 0.20, s * 0.72, s * 0.44, s * 0.06); c.fill();
      c.fillStyle = shade(col, 20); rrect(c, -s * 0.12, -s * 0.28, s * 0.22, s * 0.10, s * 0.03); c.fill();
    });
    c.fillStyle = shade(col, -55);
    c.beginPath(); c.arc(0, s * 0.02, s * 0.155, 0, TAU); c.fill();
    c.fillStyle = shade(col, 26);
    c.beginPath(); c.arc(0, s * 0.02, s * 0.105, 0, TAU); c.fill();
    glanz(c, -s * 0.05, -s * 0.03, s * 0.04, s * 0.03, 0.9);
    c.fillStyle = shade(col, 88);
    c.beginPath(); c.arc(s * 0.26, -s * 0.12, s * 0.028, 0, TAU); c.fill();
  }
  function ticket(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = shade(col, 55);
      c.beginPath();
      c.moveTo(-s * 0.40, -s * 0.20); c.lineTo(s * 0.40, -s * 0.20);
      c.lineTo(s * 0.40, -s * 0.05); c.arc(s * 0.40, 0, s * 0.05, -Math.PI / 2, Math.PI / 2, true);
      c.lineTo(s * 0.40, s * 0.20); c.lineTo(-s * 0.40, s * 0.20);
      c.lineTo(-s * 0.40, s * 0.05); c.arc(-s * 0.40, 0, s * 0.05, Math.PI / 2, -Math.PI / 2, true);
      c.closePath(); c.fill();
    });
    c.setLineDash([s * 0.026, s * 0.026]);
    c.strokeStyle = shade(col, -35); c.lineWidth = s * 0.016;
    c.beginPath(); c.moveTo(s * 0.14, -s * 0.20); c.lineTo(s * 0.14, s * 0.20); c.stroke();
    c.setLineDash([]);
    c.fillStyle = shade(col, -30);
    c.fillRect(-s * 0.32, -s * 0.09, s * 0.34, s * 0.035);
    c.fillRect(-s * 0.32, -s * 0.02, s * 0.24, s * 0.030);
    c.fillRect(-s * 0.32, s * 0.05, s * 0.28, s * 0.030);
  }
  function reisepass(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = col; rrect(c, -s * 0.26, -s * 0.34, s * 0.52, s * 0.68, s * 0.04); c.fill();
      c.fillStyle = shade(col, 22); rrect(c, -s * 0.22, -s * 0.34, s * 0.44, s * 0.68, s * 0.03); c.fill();
    });
    c.strokeStyle = shade(col, 80); c.lineWidth = s * 0.022;
    c.beginPath(); c.arc(0, -s * 0.06, s * 0.11, 0, TAU); c.stroke();
    c.beginPath(); c.ellipse(0, -s * 0.06, s * 0.05, s * 0.11, 0, 0, TAU); c.stroke();
    c.beginPath(); c.moveTo(-s * 0.11, -s * 0.06); c.lineTo(s * 0.11, -s * 0.06); c.stroke();
    c.fillStyle = shade(col, 80);
    c.fillRect(-s * 0.11, s * 0.14, s * 0.22, s * 0.026);
    c.fillRect(-s * 0.07, s * 0.20, s * 0.14, s * 0.022);
  }
  function globus(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = ball(c, 0, -s * 0.04, s * 0.30, col);
      c.beginPath(); c.arc(0, -s * 0.04, s * 0.28, 0, TAU); c.fill();
    });
    c.save();
    c.beginPath(); c.arc(0, -s * 0.04, s * 0.28, 0, TAU); c.clip();
    c.fillStyle = shade(col, -40);
    c.beginPath(); c.ellipse(-s * 0.10, -s * 0.12, s * 0.11, s * 0.07, 0.3, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(s * 0.10, s * 0.03, s * 0.09, s * 0.10, -0.4, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(-s * 0.03, s * 0.14, s * 0.07, s * 0.04, 0, 0, TAU); c.fill();
    c.restore();
    c.strokeStyle = shade(col, -55); c.lineWidth = s * 0.024;
    c.beginPath(); c.moveTo(-s * 0.20, s * 0.28); c.lineTo(s * 0.20, s * 0.28); c.stroke();
    c.beginPath(); c.moveTo(0, s * 0.24); c.lineTo(0, s * 0.28); c.stroke();
  }
  function anker(c, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.055; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, -s * 0.20); c.lineTo(0, s * 0.30); c.stroke();
    c.beginPath(); c.moveTo(-s * 0.16, -s * 0.13); c.lineTo(s * 0.16, -s * 0.13); c.stroke();
    c.lineWidth = s * 0.045;
    c.beginPath(); c.arc(0, s * 0.10, s * 0.28, 0.30, Math.PI - 0.30); c.stroke();
    c.beginPath(); c.moveTo(-s * 0.28, s * 0.06); c.lineTo(-s * 0.28, s * 0.18);
    c.moveTo(s * 0.28, s * 0.06); c.lineTo(s * 0.28, s * 0.18); c.stroke();
    c.lineWidth = s * 0.045;
    c.beginPath(); c.arc(0, -s * 0.28, s * 0.09, 0, TAU); c.stroke();
  }
  function heissluftballon(c, s, col) {
    schatten(c, s, () => {
      for (let i = -2; i <= 2; i++) {
        c.fillStyle = shade(col, i % 2 ? 34 : -12);
        c.beginPath();
        c.moveTo(0, -s * 0.42);
        c.bezierCurveTo(s * i * 0.13, -s * 0.30, s * i * 0.16, s * 0.02, 0, s * 0.12);
        c.bezierCurveTo(s * (i - 1) * 0.16, s * 0.02, s * (i - 1) * 0.13, -s * 0.30, 0, -s * 0.42);
        c.closePath(); c.fill();
      }
    });
    c.strokeStyle = shade(col, -55); c.lineWidth = s * 0.016;
    c.beginPath(); c.moveTo(-s * 0.08, s * 0.12); c.lineTo(-s * 0.06, s * 0.26);
    c.moveTo(s * 0.08, s * 0.12); c.lineTo(s * 0.06, s * 0.26); c.stroke();
    c.fillStyle = shade(col, -40);
    rrect(c, -s * 0.08, s * 0.26, s * 0.16, s * 0.12, s * 0.02); c.fill();
  }
  function leuchtturm(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = shade(col, 60);
      c.beginPath();
      c.moveTo(-s * 0.13, s * 0.36); c.lineTo(-s * 0.08, -s * 0.14);
      c.lineTo(s * 0.08, -s * 0.14); c.lineTo(s * 0.13, s * 0.36);
      c.closePath(); c.fill();
    });
    c.save();
    c.beginPath();
    c.moveTo(-s * 0.13, s * 0.36); c.lineTo(-s * 0.08, -s * 0.14);
    c.lineTo(s * 0.08, -s * 0.14); c.lineTo(s * 0.13, s * 0.36); c.closePath(); c.clip();
    c.fillStyle = col;
    for (let i = 0; i < 3; i++) c.fillRect(-s * 0.2, s * (-0.06 + i * 0.16), s * 0.4, s * 0.08);
    c.restore();
    c.fillStyle = shade(col, -40);
    rrect(c, -s * 0.12, -s * 0.22, s * 0.24, s * 0.08, s * 0.02); c.fill();
    c.fillStyle = shade(col, 88);
    rrect(c, -s * 0.07, -s * 0.34, s * 0.14, s * 0.13, s * 0.02); c.fill();
    const lg = c.createLinearGradient(0, -s * 0.28, s * 0.42, -s * 0.34);
    lg.addColorStop(0, rgba(shade(col, 95), 0.6)); lg.addColorStop(1, rgba(shade(col, 95), 0));
    c.fillStyle = lg;
    c.beginPath(); c.moveTo(s * 0.06, -s * 0.30); c.lineTo(s * 0.44, -s * 0.42); c.lineTo(s * 0.44, -s * 0.16); c.closePath(); c.fill();
  }
  function standort(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(0, s * 0.40);
      c.bezierCurveTo(-s * 0.30, s * 0.02, -s * 0.28, -s * 0.36, 0, -s * 0.36);
      c.bezierCurveTo(s * 0.28, -s * 0.36, s * 0.30, s * 0.02, 0, s * 0.40);
      c.closePath(); c.fill();
    });
    c.fillStyle = shade(col, 88);
    c.beginPath(); c.arc(0, -s * 0.14, s * 0.10, 0, TAU); c.fill();
  }
  function surfbrett(c, s, col) {
    schatten(c, s, () => {
      c.save(); c.rotate(-0.5);
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(0, -s * 0.44);
      c.bezierCurveTo(s * 0.16, -s * 0.16, s * 0.16, s * 0.16, 0, s * 0.44);
      c.bezierCurveTo(-s * 0.16, s * 0.16, -s * 0.16, -s * 0.16, 0, -s * 0.44);
      c.closePath(); c.fill();
      c.strokeStyle = shade(col, 78); c.lineWidth = s * 0.02;
      c.beginPath(); c.moveTo(0, -s * 0.36); c.lineTo(0, s * 0.36); c.stroke();
      c.fillStyle = shade(col, -30);
      c.beginPath(); c.ellipse(0, s * 0.10, s * 0.13, s * 0.06, 0, 0, TAU); c.fill();
      c.restore();
    });
  }
  function sonnenbrille(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = shade(col, -30);
      for (const d of [-1, 1]) {
        c.beginPath(); c.ellipse(d * s * 0.20, 0, s * 0.17, s * 0.13, 0, 0, TAU); c.fill();
      }
      c.lineWidth = s * 0.035; c.strokeStyle = shade(col, -30); c.lineCap = 'round';
      c.beginPath(); c.moveTo(-s * 0.05, -s * 0.03); c.quadraticCurveTo(0, -s * 0.08, s * 0.05, -s * 0.03); c.stroke();
      c.beginPath(); c.moveTo(-s * 0.36, -s * 0.05); c.lineTo(-s * 0.46, -s * 0.11);
      c.moveTo(s * 0.36, -s * 0.05); c.lineTo(s * 0.46, -s * 0.11); c.stroke();
    });
    for (const d of [-1, 1]) glanz(c, d * s * 0.24, -s * 0.05, s * 0.06, s * 0.035, 0.8);
  }

  /* ================================================================
     ☕ CAFÉ & FOOD
     ================================================================ */
  function kaffeetasse(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = shade(col, 70);
      c.beginPath();
      c.moveTo(-s * 0.24, -s * 0.14);
      c.lineTo(s * 0.20, -s * 0.14);
      c.quadraticCurveTo(s * 0.18, s * 0.22, -s * 0.02, s * 0.22);
      c.quadraticCurveTo(-s * 0.22, s * 0.22, -s * 0.24, -s * 0.14);
      c.closePath(); c.fill();
    });
    c.strokeStyle = shade(col, 70); c.lineWidth = s * 0.045;
    c.beginPath(); c.arc(s * 0.22, -s * 0.02, s * 0.11, -1.1, 1.1); c.stroke();
    c.fillStyle = shade(col, -35);
    c.beginPath(); c.ellipse(-s * 0.02, -s * 0.13, s * 0.215, s * 0.055, 0, 0, TAU); c.fill();
    c.fillStyle = shade(col, 88);
    c.beginPath(); c.ellipse(-s * 0.02, s * 0.30, s * 0.30, s * 0.07, 0, 0, TAU); c.fill();
    c.strokeStyle = rgba(shade(col, 60), 0.55); c.lineWidth = s * 0.022; c.lineCap = 'round';
    for (const dx of [-0.09, 0.05]) {
      c.beginPath();
      c.moveTo(s * dx, -s * 0.22);
      c.bezierCurveTo(s * (dx + 0.06), -s * 0.30, s * (dx - 0.04), -s * 0.34, s * (dx + 0.02), -s * 0.42);
      c.stroke();
    }
  }
  function coffeeToGo(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = shade(col, 66);
      c.beginPath();
      c.moveTo(-s * 0.19, -s * 0.20); c.lineTo(s * 0.19, -s * 0.20);
      c.lineTo(s * 0.14, s * 0.34); c.lineTo(-s * 0.14, s * 0.34);
      c.closePath(); c.fill();
      c.fillStyle = shade(col, -20);
      rrect(c, -s * 0.22, -s * 0.30, s * 0.44, s * 0.11, s * 0.03); c.fill();
    });
    c.fillStyle = shade(col, -35);
    c.fillRect(-s * 0.175, -s * 0.02, s * 0.35, s * 0.14);
    c.fillStyle = shade(col, -55);
    rrect(c, -s * 0.05, -s * 0.36, s * 0.10, s * 0.07, s * 0.02); c.fill();
  }
  function croissant(c, s, col) {
    // Hörnchen: dicker Bauch in der Mitte, zwei spitze Enden nach unten
    schatten(c, s, () => {
      c.save(); c.rotate(0.12);
      const seg = 11;
      for (let i = 0; i < seg; i++) {
        const t = i / (seg - 1);
        const a = Math.PI * (0.14 + t * 0.72);          // Bogen von links nach rechts
        const R = s * 0.30;
        const x = -C(a) * R, y = -S(a) * R + s * 0.14;
        const dick = s * (0.055 + 0.075 * S(Math.PI * t));
        c.fillStyle = ball(c, x, y, dick * 1.4, shade(col, Math.round(S(Math.PI * t) * 26 - 8)));
        c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2);
        c.beginPath(); c.ellipse(0, 0, dick * 0.78, dick, 0, 0, TAU); c.fill();
        c.restore();
      }
      c.restore();
    });
    c.save(); c.rotate(0.12);
    c.strokeStyle = rgba(shade(col, -45), 0.32); c.lineWidth = s * 0.014;
    for (let i = 1; i < 10; i++) {
      const t = i / 10;
      const a = Math.PI * (0.14 + t * 0.72), R = s * 0.30;
      const x = -C(a) * R, y = -S(a) * R + s * 0.14;
      const dick = s * (0.055 + 0.075 * S(Math.PI * t));
      c.beginPath();
      c.moveTo(x - C(a + Math.PI / 2) * dick * 0.7, y - S(a + Math.PI / 2) * dick * 0.7);
      c.lineTo(x + C(a + Math.PI / 2) * dick * 0.7, y + S(a + Math.PI / 2) * dick * 0.7);
      c.stroke();
    }
    c.restore();
  }

  function kuchenstueck(c, s, col) {
    // Tortenstück von der Seite: drei Böden, zwei Cremeschichten, Kirsche
    schatten(c, s, () => {
      const links = -s * 0.30, rechts = s * 0.30, unten = s * 0.32;
      // Spitze links, breite Kante rechts
      const kontur = (yo, h) => {
        c.beginPath();
        c.moveTo(links, unten - yo);
        c.lineTo(rechts, unten - yo - s * 0.02);
        c.lineTo(rechts, unten - yo - h);
        c.lineTo(links, unten - yo - h + s * 0.02);
        c.closePath(); c.fill();
      };
      c.fillStyle = shade(col, -14); kontur(0, s * 0.11);
      c.fillStyle = shade(col, 66); kontur(s * 0.11, s * 0.05);
      c.fillStyle = shade(col, -8);  kontur(s * 0.16, s * 0.11);
      c.fillStyle = shade(col, 66); kontur(s * 0.27, s * 0.05);
      c.fillStyle = shade(col, -2);  kontur(s * 0.32, s * 0.11);
      // Sahnehaube oben
      c.fillStyle = shade(col, 80);
      c.beginPath();
      c.moveTo(links, unten - s * 0.43 + s * 0.02);
      for (let i = 0; i <= 5; i++) {
        const x = links + (i + 0.5) * (rechts - links) / 6;
        c.arc(x, unten - s * 0.44, (rechts - links) / 12, Math.PI, 0, true);
      }
      c.lineTo(rechts, unten - s * 0.43);
      c.lineTo(rechts, unten - s * 0.40);
      c.lineTo(links, unten - s * 0.40); c.closePath(); c.fill();
    });
    c.fillStyle = shade(col, -55);
    c.beginPath(); c.arc(s * 0.10, -s * 0.20, s * 0.055, 0, TAU); c.fill();
    c.strokeStyle = shade(col, -55); c.lineWidth = s * 0.016;
    c.beginPath(); c.moveTo(s * 0.10, -s * 0.25); c.quadraticCurveTo(s * 0.16, -s * 0.34, s * 0.20, -s * 0.30); c.stroke();
  }

  function eisWaffel(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = shade(col, -20);
      c.beginPath(); c.moveTo(-s * 0.16, s * 0.02); c.lineTo(s * 0.16, s * 0.02); c.lineTo(0, s * 0.42); c.closePath(); c.fill();
      for (const [dy, r, sh] of [[-0.06, 0.17, 40], [-0.20, 0.15, 70], [-0.30, 0.12, 20]]) {
        c.fillStyle = ball(c, 0, s * dy, s * r, shade(col, sh));
        c.beginPath(); c.arc(0, s * dy, s * r, 0, TAU); c.fill();
      }
    });
    c.strokeStyle = rgba(shade(col, -55), 0.4); c.lineWidth = s * 0.014;
    for (let i = -2; i <= 2; i++) {
      c.beginPath(); c.moveTo(s * i * 0.06, s * 0.03); c.lineTo(s * i * 0.03, s * 0.40); c.stroke();
    }
  }
  function weinglas(c, s, col) {
    c.fillStyle = rgba(shade(col, -10), 0.72);
    c.beginPath();
    c.moveTo(-s * 0.17, -s * 0.32);
    c.quadraticCurveTo(-s * 0.19, s * 0.02, 0, s * 0.06);
    c.quadraticCurveTo(s * 0.19, s * 0.02, s * 0.17, -s * 0.32);
    c.closePath(); c.fill();
    c.strokeStyle = shade(col, -45); c.lineWidth = s * 0.024; c.lineCap = 'round';
    c.stroke();
    c.beginPath(); c.moveTo(0, s * 0.06); c.lineTo(0, s * 0.30); c.stroke();
    c.beginPath(); c.moveTo(-s * 0.13, s * 0.33); c.lineTo(s * 0.13, s * 0.33); c.stroke();
    glanz(c, -s * 0.09, -s * 0.18, s * 0.04, s * 0.10, 0.75);
  }
  function cocktail(c, s, col) {
    c.fillStyle = rgba(shade(col, 20), 0.8);
    c.beginPath();
    c.moveTo(-s * 0.28, -s * 0.28); c.lineTo(s * 0.28, -s * 0.28); c.lineTo(0, s * 0.04); c.closePath(); c.fill();
    c.strokeStyle = shade(col, -45); c.lineWidth = s * 0.024; c.lineCap = 'round'; c.stroke();
    c.beginPath(); c.moveTo(0, s * 0.04); c.lineTo(0, s * 0.28); c.stroke();
    c.beginPath(); c.moveTo(-s * 0.14, s * 0.31); c.lineTo(s * 0.14, s * 0.31); c.stroke();
    c.strokeStyle = shade(col, 70); c.lineWidth = s * 0.03;
    c.beginPath(); c.moveTo(s * 0.10, -s * 0.36); c.lineTo(-s * 0.06, -s * 0.14); c.stroke();
    c.fillStyle = shade(col, 55);
    c.beginPath(); c.arc(-s * 0.24, -s * 0.30, s * 0.075, 0.3, Math.PI + 0.9); c.closePath(); c.fill();
  }
  function macarons(c, s, col) {
    schatten(c, s, () => {
      for (const [dy, sh] of [[0.20, -10], [0.02, 24], [-0.16, 56]]) {
        c.fillStyle = shade(col, sh);
        rrect(c, -s * 0.22, s * dy - s * 0.05, s * 0.44, s * 0.05, s * 0.025); c.fill();
        c.fillStyle = shade(col, 82);
        c.fillRect(-s * 0.21, s * dy, s * 0.42, s * 0.028);
        c.fillStyle = shade(col, sh);
        rrect(c, -s * 0.22, s * dy + s * 0.028, s * 0.44, s * 0.05, s * 0.025); c.fill();
      }
    });
  }
  function donut(c, s, col) {
    mitAusschnitt(c, s, (cc) => {
      cc.fillStyle = ball(cc, 0, 0, s * 0.36, shade(col, -10));
      cc.beginPath(); cc.arc(0, 0, s * 0.34, 0, TAU); cc.fill();
      cc.fillStyle = shade(col, 62);
      cc.beginPath();
      cc.moveTo(s * 0.30, 0);
      for (let i = 0; i <= 40; i++) {
        const a = i * TAU / 40;
        const r = s * (0.30 + S(a * 6) * 0.016);
        cc.lineTo(C(a) * r, S(a) * r);
      }
      cc.closePath(); cc.fill();
      const R = rnd(53);
      for (let i = 0; i < 24; i++) {
        const a = R() * TAU, r = s * (0.15 + R() * 0.13);
        cc.save(); cc.translate(C(a) * r, S(a) * r); cc.rotate(R() * TAU);
        cc.fillStyle = shade(col, Math.round(R() * 120 - 60));
        cc.fillRect(-s * 0.024, -s * 0.008, s * 0.048, s * 0.016);
        cc.restore();
      }
    }, (cc) => {
      cc.beginPath(); cc.arc(0, 0, s * 0.115, 0, TAU); cc.fill();
    });
  }

  function picknickkorb(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = shade(col, -14);
      c.beginPath();
      c.moveTo(-s * 0.32, -s * 0.06); c.lineTo(s * 0.32, -s * 0.06);
      c.lineTo(s * 0.25, s * 0.28); c.lineTo(-s * 0.25, s * 0.28);
      c.closePath(); c.fill();
    });
    c.save();
    c.beginPath();
    c.moveTo(-s * 0.32, -s * 0.06); c.lineTo(s * 0.32, -s * 0.06);
    c.lineTo(s * 0.25, s * 0.28); c.lineTo(-s * 0.25, s * 0.28); c.closePath(); c.clip();
    c.strokeStyle = rgba(shade(col, 46), 0.7); c.lineWidth = s * 0.02;
    for (let i = -4; i <= 4; i++) {
      c.beginPath(); c.moveTo(s * i * 0.08, -s * 0.08); c.lineTo(s * i * 0.065, s * 0.30); c.stroke();
    }
    for (let i = 0; i < 4; i++) {
      c.beginPath(); c.moveTo(-s * 0.34, s * (-0.02 + i * 0.09)); c.lineTo(s * 0.34, s * (-0.02 + i * 0.09)); c.stroke();
    }
    c.restore();
    c.strokeStyle = shade(col, -35); c.lineWidth = s * 0.032;
    c.beginPath(); c.arc(0, -s * 0.06, s * 0.19, Math.PI, 0); c.stroke();
    c.fillStyle = shade(col, 78);
    c.fillRect(-s * 0.34, -s * 0.10, s * 0.68, s * 0.05);
  }
  function avocado(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = shade(col, -30);
      c.beginPath();
      c.moveTo(0, -s * 0.36);
      c.bezierCurveTo(s * 0.24, -s * 0.28, s * 0.30, s * 0.06, s * 0.16, s * 0.26);
      c.bezierCurveTo(s * 0.02, s * 0.42, -s * 0.02, s * 0.42, -s * 0.16, s * 0.26);
      c.bezierCurveTo(-s * 0.30, s * 0.06, -s * 0.24, -s * 0.28, 0, -s * 0.36);
      c.closePath(); c.fill();
    });
    c.fillStyle = shade(col, 55);
    c.beginPath();
    c.moveTo(0, -s * 0.28);
    c.bezierCurveTo(s * 0.18, -s * 0.22, s * 0.23, s * 0.04, s * 0.12, s * 0.20);
    c.bezierCurveTo(s * 0.01, s * 0.33, -s * 0.01, s * 0.33, -s * 0.12, s * 0.20);
    c.bezierCurveTo(-s * 0.23, s * 0.04, -s * 0.18, -s * 0.22, 0, -s * 0.28);
    c.closePath(); c.fill();
    c.fillStyle = shade(col, -55);
    c.beginPath(); c.arc(0, s * 0.10, s * 0.105, 0, TAU); c.fill();
    glanz(c, -s * 0.03, s * 0.06, s * 0.035, s * 0.025, 0.5);
  }
  function erdbeere(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = ball(c, 0, s * 0.04, s * 0.30, col);
      c.beginPath();
      c.moveTo(0, s * 0.40);
      c.bezierCurveTo(-s * 0.30, s * 0.16, -s * 0.28, -s * 0.18, 0, -s * 0.18);
      c.bezierCurveTo(s * 0.28, -s * 0.18, s * 0.30, s * 0.16, 0, s * 0.40);
      c.closePath(); c.fill();
    });
    c.fillStyle = shade(col, 92);
    const R = rnd(11);
    for (let i = 0; i < 12; i++) {
      c.save(); c.translate((R() - 0.5) * s * 0.36, -s * 0.10 + R() * s * 0.38); c.rotate(0.4);
      c.beginPath(); c.ellipse(0, 0, s * 0.016, s * 0.026, 0, 0, TAU); c.fill();
      c.restore();
    }
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.5;
      blatt(c, 0, -s * 0.16, s * 0.16, s * 0.06, a + Math.PI, shade(col, -60));
    }
  }
  function honigglas(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = rgba(shade(col, 20), 0.9);
      rrect(c, -s * 0.22, -s * 0.14, s * 0.44, s * 0.46, s * 0.06); c.fill();
      c.fillStyle = shade(col, -35);
      rrect(c, -s * 0.24, -s * 0.24, s * 0.48, s * 0.11, s * 0.03); c.fill();
    });
    c.fillStyle = shade(col, 70);
    rrect(c, -s * 0.15, s * 0.00, s * 0.30, s * 0.16, s * 0.02); c.fill();
    c.fillStyle = shade(col, -40);
    for (let i = 0; i < 3; i++) {
      const x = -s * 0.09 + i * s * 0.09;
      c.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = k * TAU / 6 + Math.PI / 6;
        const px = x + C(a) * s * 0.028, py = s * 0.08 + S(a) * s * 0.028;
        k ? c.lineTo(px, py) : c.moveTo(px, py);
      }
      c.closePath(); c.fill();
    }
  }
  function baguette(c, s, col) {
    c.save(); c.rotate(-0.42);
    schatten(c, s, () => {
      const g = c.createLinearGradient(0, -s * 0.13, 0, s * 0.13);
      g.addColorStop(0, shade(col, 46)); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, -40));
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(-s * 0.44, 0);
      c.quadraticCurveTo(-s * 0.36, -s * 0.13, -s * 0.16, -s * 0.13);
      c.lineTo(s * 0.16, -s * 0.13);
      c.quadraticCurveTo(s * 0.36, -s * 0.13, s * 0.44, 0);
      c.quadraticCurveTo(s * 0.36, s * 0.13, s * 0.16, s * 0.13);
      c.lineTo(-s * 0.16, s * 0.13);
      c.quadraticCurveTo(-s * 0.36, s * 0.13, -s * 0.44, 0);
      c.closePath(); c.fill();
    });
    // schräge Einschnitte
    c.strokeStyle = rgba(shade(col, 80), 0.85); c.lineWidth = s * 0.030; c.lineCap = 'round';
    for (let i = -2; i <= 2; i++) {
      c.beginPath();
      c.moveTo(s * i * 0.15 - s * 0.05, s * 0.045);
      c.lineTo(s * i * 0.15 + s * 0.045, -s * 0.055);
      c.stroke();
    }
    c.strokeStyle = rgba(shade(col, -55), 0.35); c.lineWidth = s * 0.014;
    for (let i = -2; i <= 2; i++) {
      c.beginPath();
      c.moveTo(s * i * 0.15 - s * 0.065, s * 0.055);
      c.lineTo(s * i * 0.15 + s * 0.03, -s * 0.045);
      c.stroke();
    }
    c.restore();
  }

  function teekanne(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = ball(c, 0, s * 0.04, s * 0.30, col);
      c.beginPath(); c.ellipse(0, s * 0.06, s * 0.28, s * 0.22, 0, 0, TAU); c.fill();
    });
    c.strokeStyle = shade(col, -20); c.lineWidth = s * 0.045; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-s * 0.26, s * 0.00); c.quadraticCurveTo(-s * 0.44, -s * 0.06, -s * 0.40, s * 0.12); c.stroke();
    c.beginPath(); c.arc(s * 0.30, s * 0.06, s * 0.10, -1.2, 1.2); c.stroke();
    c.fillStyle = shade(col, -25);
    c.beginPath(); c.ellipse(0, -s * 0.16, s * 0.12, s * 0.05, 0, 0, TAU); c.fill();
    c.beginPath(); c.arc(0, -s * 0.22, s * 0.045, 0, TAU); c.fill();
    glanz(c, -s * 0.10, -s * 0.04, s * 0.07, s * 0.05, 0.7);
  }

  /* ================================================================
     ◈ ANGEBOT & BUSINESS
     ================================================================ */
  function preisschild(c, s, col) {
    schatten(c, s, () => {
      c.save(); c.rotate(-0.35);
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(-s * 0.34, -s * 0.16); c.lineTo(s * 0.20, -s * 0.16);
      c.lineTo(s * 0.36, 0); c.lineTo(s * 0.20, s * 0.16); c.lineTo(-s * 0.34, s * 0.16);
      c.closePath(); c.fill();
      c.fillStyle = shade(col, 92);
      c.beginPath(); c.arc(s * 0.19, 0, s * 0.045, 0, TAU); c.fill();
      c.restore();
    });
  }
  function prozent(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = col; c.beginPath(); c.arc(0, 0, s * 0.36, 0, TAU); c.fill();
    });
    c.strokeStyle = shade(col, 92); c.lineWidth = s * 0.055; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-s * 0.15, s * 0.16); c.lineTo(s * 0.15, -s * 0.16); c.stroke();
    c.lineWidth = s * 0.045;
    c.beginPath(); c.arc(-s * 0.14, -s * 0.14, s * 0.075, 0, TAU); c.stroke();
    c.beginPath(); c.arc(s * 0.14, s * 0.14, s * 0.075, 0, TAU); c.stroke();
  }
  function haken(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = col; c.beginPath(); c.arc(0, 0, s * 0.34, 0, TAU); c.fill();
    });
    c.strokeStyle = shade(col, 94); c.lineWidth = s * 0.075; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(-s * 0.15, s * 0.01); c.lineTo(-s * 0.03, s * 0.14); c.lineTo(s * 0.17, -s * 0.13); c.stroke();
  }
  function sterneBewertung(c, s, col) {
    for (let i = 0; i < 5; i++) {
      const x = (i - 2) * s * 0.19;
      schatten(c, s, () => {
        c.fillStyle = col;
        stern(c, x, 0, s * 0.085, 5, 0.45); c.fill();
      }, 0.2);
    }
  }
  function sprechblaseCTA(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = col;
      rrect(c, -s * 0.40, -s * 0.28, s * 0.80, s * 0.44, s * 0.10); c.fill();
      c.beginPath();
      c.moveTo(-s * 0.14, s * 0.15); c.lineTo(-s * 0.06, s * 0.36); c.lineTo(s * 0.04, s * 0.15);
      c.closePath(); c.fill();
    });
    c.fillStyle = shade(col, 92);
    c.fillRect(-s * 0.28, -s * 0.13, s * 0.56, s * 0.045);
    c.fillRect(-s * 0.28, -s * 0.03, s * 0.40, s * 0.045);
    c.fillRect(-s * 0.28, s * 0.07, s * 0.30, s * 0.045);
  }
  function pfeilKurve(c, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.05; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-s * 0.36, -s * 0.18);
    c.bezierCurveTo(-s * 0.10, -s * 0.38, s * 0.18, -s * 0.20, s * 0.24, s * 0.12);
    c.stroke();
    c.fillStyle = col;
    c.save(); c.translate(s * 0.24, s * 0.16); c.rotate(1.35);
    c.beginPath(); c.moveTo(0, s * 0.13); c.lineTo(-s * 0.10, -s * 0.07); c.lineTo(s * 0.10, -s * 0.07); c.closePath(); c.fill();
    c.restore();
  }
  function pfeilGerade(c, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.06; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-s * 0.36, 0); c.lineTo(s * 0.18, 0); c.stroke();
    c.fillStyle = col;
    c.beginPath(); c.moveTo(s * 0.40, 0); c.lineTo(s * 0.14, -s * 0.16); c.lineTo(s * 0.14, s * 0.16); c.closePath(); c.fill();
  }
  function siegel(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = col;
      c.beginPath();
      for (let i = 0; i < 24; i++) {
        const a = i * TAU / 24;
        const r = s * (i % 2 ? 0.30 : 0.36);
        i ? c.lineTo(C(a) * r, S(a) * r) : c.moveTo(C(a) * r, S(a) * r);
      }
      c.closePath(); c.fill();
    });
    c.strokeStyle = shade(col, 92); c.lineWidth = s * 0.018;
    c.beginPath(); c.arc(0, 0, s * 0.24, 0, TAU); c.stroke();
    c.fillStyle = shade(col, 92);
    stern(c, 0, -s * 0.05, s * 0.10, 5, 0.45); c.fill();
    c.fillRect(-s * 0.11, s * 0.10, s * 0.22, s * 0.03);
  }
  function schleifeBand(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(-s * 0.42, -s * 0.14); c.lineTo(s * 0.42, -s * 0.14);
      c.lineTo(s * 0.42, s * 0.14); c.lineTo(-s * 0.42, s * 0.14); c.closePath(); c.fill();
      c.fillStyle = shade(col, -30);
      c.beginPath(); c.moveTo(-s * 0.42, -s * 0.14); c.lineTo(-s * 0.50, -s * 0.24); c.lineTo(-s * 0.50, s * 0.24);
      c.lineTo(-s * 0.42, s * 0.14); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(s * 0.42, -s * 0.14); c.lineTo(s * 0.50, -s * 0.24); c.lineTo(s * 0.50, s * 0.24);
      c.lineTo(s * 0.42, s * 0.14); c.closePath(); c.fill();
    });
    c.fillStyle = shade(col, 92);
    c.fillRect(-s * 0.26, -s * 0.03, s * 0.52, s * 0.05);
  }
  function nummernkreis(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = col; c.beginPath(); c.arc(0, 0, s * 0.30, 0, TAU); c.fill();
    });
    c.strokeStyle = shade(col, 92); c.lineWidth = s * 0.02;
    c.beginPath(); c.arc(0, 0, s * 0.23, 0, TAU); c.stroke();
    c.fillStyle = shade(col, 92); c.lineWidth = s * 0.06; c.lineCap = 'round';
    c.strokeStyle = shade(col, 92);
    c.beginPath(); c.moveTo(-s * 0.03, -s * 0.10); c.lineTo(s * 0.02, -s * 0.13);
    c.lineTo(s * 0.02, s * 0.13); c.stroke();
  }
  function zertifikat(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = shade(col, 66);
      rrect(c, -s * 0.32, -s * 0.34, s * 0.64, s * 0.48, s * 0.04); c.fill();
    });
    c.strokeStyle = col; c.lineWidth = s * 0.016;
    rrect(c, -s * 0.27, -s * 0.29, s * 0.54, s * 0.38, s * 0.03); c.stroke();
    c.fillStyle = col;
    c.fillRect(-s * 0.18, -s * 0.21, s * 0.36, s * 0.035);
    c.fillRect(-s * 0.13, -s * 0.13, s * 0.26, s * 0.028);
    c.fillRect(-s * 0.18, -s * 0.05, s * 0.36, s * 0.028);
    c.fillStyle = shade(col, -20);
    c.beginPath(); c.arc(s * 0.14, s * 0.10, s * 0.075, 0, TAU); c.fill();
    c.fillStyle = shade(col, -20);
    c.beginPath(); c.moveTo(s * 0.08, s * 0.14); c.lineTo(s * 0.06, s * 0.34); c.lineTo(s * 0.14, s * 0.26);
    c.lineTo(s * 0.22, s * 0.34); c.lineTo(s * 0.20, s * 0.14); c.closePath(); c.fill();
  }
  function megafon(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(-s * 0.36, -s * 0.24); c.lineTo(-s * 0.36, s * 0.24);
      c.lineTo(-s * 0.06, s * 0.13); c.lineTo(-s * 0.06, -s * 0.13);
      c.closePath(); c.fill();
      c.fillStyle = shade(col, -25);
      rrect(c, -s * 0.06, -s * 0.15, s * 0.14, s * 0.30, s * 0.03); c.fill();
    });
    c.strokeStyle = col; c.lineWidth = s * 0.032; c.lineCap = 'round';
    for (let i = 1; i <= 3; i++) {
      c.beginPath(); c.arc(s * 0.10, 0, s * (0.08 + i * 0.09), -0.7, 0.7); c.stroke();
    }
  }
  function warenkorb(c, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.045; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(-s * 0.36, -s * 0.24); c.lineTo(-s * 0.22, -s * 0.24);
    c.lineTo(-s * 0.08, s * 0.14); c.lineTo(s * 0.26, s * 0.14);
    c.lineTo(s * 0.36, -s * 0.10); c.lineTo(-s * 0.16, -s * 0.10);
    c.stroke();
    c.fillStyle = col;
    c.beginPath(); c.arc(-s * 0.03, s * 0.30, s * 0.055, 0, TAU); c.fill();
    c.beginPath(); c.arc(s * 0.22, s * 0.30, s * 0.055, 0, TAU); c.fill();
  }
  function neuBanner(c, s, col) {
    schatten(c, s, () => {
      c.save(); c.rotate(-0.42);
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(-s * 0.44, -s * 0.11); c.lineTo(s * 0.44, -s * 0.11);
      c.lineTo(s * 0.44, s * 0.11); c.lineTo(-s * 0.44, s * 0.11); c.closePath(); c.fill();
      c.fillStyle = shade(col, 92);
      c.fillRect(-s * 0.22, -s * 0.025, s * 0.44, s * 0.05);
      c.restore();
    });
  }
  function uhrZeit(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = shade(col, 60); c.beginPath(); c.arc(0, 0, s * 0.33, 0, TAU); c.fill();
    });
    c.strokeStyle = col; c.lineWidth = s * 0.035;
    c.beginPath(); c.arc(0, 0, s * 0.33, 0, TAU); c.stroke();
    c.lineWidth = s * 0.02;
    for (let i = 0; i < 12; i++) {
      const a = i * TAU / 12;
      c.beginPath();
      c.moveTo(C(a) * s * 0.26, S(a) * s * 0.26);
      c.lineTo(C(a) * s * 0.30, S(a) * s * 0.30);
      c.stroke();
    }
    c.lineCap = 'round'; c.lineWidth = s * 0.035;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -s * 0.17); c.stroke();
    c.lineWidth = s * 0.026;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(s * 0.14, s * 0.07); c.stroke();
  }
  function gluehbirne(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = ball(c, 0, -s * 0.10, s * 0.24, shade(col, 40));
      c.beginPath(); c.arc(0, -s * 0.10, s * 0.23, 0, TAU); c.fill();
      c.fillStyle = shade(col, -35);
      rrect(c, -s * 0.10, s * 0.10, s * 0.20, s * 0.16, s * 0.03); c.fill();
    });
    c.strokeStyle = shade(col, -55); c.lineWidth = s * 0.018;
    for (let i = 0; i < 3; i++) {
      c.beginPath(); c.moveTo(-s * 0.10, s * (0.13 + i * 0.05)); c.lineTo(s * 0.10, s * (0.13 + i * 0.05)); c.stroke();
    }
    c.strokeStyle = shade(col, -45); c.lineWidth = s * 0.02;
    c.beginPath(); c.moveTo(-s * 0.05, s * 0.09); c.lineTo(-s * 0.03, -s * 0.05);
    c.lineTo(0, -s * 0.12); c.lineTo(s * 0.03, -s * 0.05); c.lineTo(s * 0.05, s * 0.09); c.stroke();
    c.strokeStyle = rgba(shade(col, 90), 0.75); c.lineWidth = s * 0.026; c.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.42;
      c.beginPath();
      c.moveTo(C(a) * s * 0.30, -s * 0.10 + S(a) * s * 0.30);
      c.lineTo(C(a) * s * 0.40, -s * 0.10 + S(a) * s * 0.40);
      c.stroke();
    }
  }

  /* ================================================================
     ❀ BOTANIK
     ================================================================ */
  function eukalyptus(c, s, col) {
    c.strokeStyle = shade(col, -35); c.lineWidth = s * 0.022; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-s * 0.02, s * 0.42); c.quadraticCurveTo(s * 0.05, 0, -s * 0.02, -s * 0.40); c.stroke();
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      const y = s * (0.36 - t * 0.72);
      const x = s * (0.03 * S(t * 3.4));
      const r = s * (0.13 - t * 0.05);
      for (const d of [-1, 1]) {
        c.save(); c.translate(x, y); c.rotate(d * (0.9 - t * 0.35));
        c.fillStyle = shade(col, Math.round(10 + i * 5 - (d > 0 ? 12 : 0)));
        c.beginPath(); c.ellipse(d * r * 0.95, 0, r, r * 0.82, 0, 0, TAU); c.fill();
        c.restore();
      }
    }
  }
  function pampasgras(c, s, col) {
    c.strokeStyle = shade(col, -30); c.lineWidth = s * 0.018; c.lineCap = 'round';
    for (const [dx, dr] of [[-0.14, -0.20], [0.02, 0], [0.16, 0.22]]) {
      c.save(); c.translate(s * dx, s * 0.42); c.rotate(dr);
      c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -s * 0.42); c.stroke();
      const R = rnd(7 + Math.round(dx * 100));
      for (let i = 0; i < 34; i++) {
        const t = R();
        const y = -s * (0.42 + t * 0.34);
        const l = s * (0.06 + R() * 0.09) * (1 - t * 0.3);
        const a = (R() - 0.5) * 1.5;
        c.strokeStyle = rgba(shade(col, 40 + Math.round(R() * 40)), 0.75);
        c.lineWidth = s * 0.012;
        c.beginPath(); c.moveTo(0, y);
        c.quadraticCurveTo(S(a) * l * 0.7, y - l * 0.5, S(a) * l * 1.3, y - l);
        c.stroke();
      }
      c.restore();
    }
  }
  function trockenblume(c, s, col) {
    c.strokeStyle = shade(col, -30); c.lineWidth = s * 0.02; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, s * 0.44); c.quadraticCurveTo(-s * 0.04, 0, s * 0.01, -s * 0.22); c.stroke();
    const R = rnd(23);
    for (let i = 0; i < 16; i++) {
      const t = i / 15;
      const y = s * (0.24 - t * 0.62);
      const d = i % 2 ? 1 : -1;
      c.save(); c.translate(s * 0.01 * (1 - t), y); c.rotate(d * (0.7 - t * 0.3));
      c.fillStyle = shade(col, Math.round(R() * 60 - 10));
      c.beginPath(); c.ellipse(d * s * 0.06, 0, s * (0.075 - t * 0.03), s * 0.028, 0, 0, TAU); c.fill();
      c.restore();
    }
  }
  function rosenzweig(c, s, col) {
    c.strokeStyle = shade(col, -45); c.lineWidth = s * 0.024; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-s * 0.06, s * 0.44); c.quadraticCurveTo(s * 0.06, s * 0.06, -s * 0.02, -s * 0.24); c.stroke();
    for (const [x, y, r, sh] of [[-0.02, -0.30, 0.14, 20], [0.14, -0.05, 0.10, -10], [-0.16, 0.10, 0.09, 40]]) {
      c.save(); c.translate(s * x, s * y);
      c.fillStyle = shade(col, sh);
      c.beginPath(); c.arc(0, 0, s * r, 0, TAU); c.fill();
      c.strokeStyle = rgba(shade(col, -55), 0.5); c.lineWidth = s * 0.016;
      for (let k = 1; k <= 3; k++) {
        c.beginPath(); c.arc(0, 0, s * r * (1 - k * 0.24), k * 1.2, k * 1.2 + 4.2); c.stroke();
      }
      c.restore();
    }
    for (const [x, y, a] of [[0.10, 0.20, 0.9], [-0.14, 0.28, -0.9]]) {
      blatt(c, s * x, s * y, s * 0.17, s * 0.06, a, shade(col, -30));
    }
  }
  function blaetterkranz(c, s, col) {
    for (let i = 0; i < 26; i++) {
      const a = i * TAU / 26;
      const r = s * 0.30;
      blatt(c, C(a) * r, S(a) * r, s * 0.14, s * 0.045, a + Math.PI / 2, shade(col, i % 3 * 20 - 15));
    }
  }
  function blumenkranz(c, s, col) {
    for (let i = 0; i < 20; i++) {
      const a = i * TAU / 20;
      blatt(c, C(a) * s * 0.30, S(a) * s * 0.30, s * 0.12, s * 0.04, a + Math.PI / 2, shade(col, -22));
    }
    for (let i = 0; i < 6; i++) {
      const a = i * TAU / 6 + 0.4;
      const x = C(a) * s * 0.30, y = S(a) * s * 0.30;
      for (let k = 0; k < 5; k++) {
        const b = k * TAU / 5;
        c.fillStyle = shade(col, 55);
        c.beginPath(); c.ellipse(x + C(b) * s * 0.035, y + S(b) * s * 0.035, s * 0.030, s * 0.020, b, 0, TAU); c.fill();
      }
      c.fillStyle = shade(col, 85);
      c.beginPath(); c.arc(x, y, s * 0.020, 0, TAU); c.fill();
    }
  }
  function ranke(c, s, col) {
    c.strokeStyle = shade(col, -20); c.lineWidth = s * 0.018; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-s * 0.44, s * 0.10);
    c.bezierCurveTo(-s * 0.16, -s * 0.24, s * 0.12, s * 0.26, s * 0.44, -s * 0.06);
    c.stroke();
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const x = -s * 0.44 + t * s * 0.88;
      const y = s * (0.10 + S(t * 5.4) * 0.16);
      blatt(c, x, y, s * 0.13, s * 0.045, (i % 2 ? 0.9 : -0.9) + S(t * 4) * 0.3, shade(col, i % 2 ? 18 : -18));
    }
  }
  function farn(c, s, col) {
    c.strokeStyle = shade(col, -30); c.lineWidth = s * 0.018; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, s * 0.44); c.quadraticCurveTo(s * 0.04, 0, -s * 0.02, -s * 0.42); c.stroke();
    for (let i = 0; i < 15; i++) {
      const t = i / 14;
      const y = s * (0.38 - t * 0.76);
      const l = s * (0.22 - t * 0.16);
      for (const d of [-1, 1]) {
        c.strokeStyle = shade(col, Math.round(t * 40 - 10));
        c.lineWidth = s * 0.014;
        c.beginPath();
        c.moveTo(0, y);
        c.quadraticCurveTo(d * l * 0.6, y - l * 0.20, d * l, y - l * 0.55);
        c.stroke();
      }
    }
  }
  function monstera(c, s, col) {
    c.save(); c.rotate(0.2);
    mitAusschnitt(c, s, (cc) => {
      cc.fillStyle = col;
      cc.beginPath();
      cc.moveTo(0, s * 0.42);
      cc.bezierCurveTo(-s * 0.40, s * 0.20, -s * 0.42, -s * 0.24, 0, -s * 0.44);
      cc.bezierCurveTo(s * 0.42, -s * 0.24, s * 0.40, s * 0.20, 0, s * 0.42);
      cc.closePath(); cc.fill();
    }, (cc) => {
      for (let i = 0; i < 4; i++) {
        const y = s * (0.24 - i * 0.20);
        for (const d of [-1, 1]) {
          cc.beginPath();
          cc.moveTo(d * s * 0.07, y);
          cc.quadraticCurveTo(d * s * 0.26, y - s * 0.03, d * s * 0.44, y - s * 0.10);
          cc.lineTo(d * s * 0.44, y + s * 0.05);
          cc.quadraticCurveTo(d * s * 0.24, y + s * 0.07, d * s * 0.07, y + s * 0.035);
          cc.closePath(); cc.fill();
        }
      }
      // Kerbe an der Spitze
      cc.beginPath();
      cc.moveTo(-s * 0.05, -s * 0.44); cc.lineTo(0, -s * 0.24); cc.lineTo(s * 0.05, -s * 0.44);
      cc.closePath(); cc.fill();
    });
    c.strokeStyle = rgba(shade(col, -50), 0.45); c.lineWidth = s * 0.02;
    c.beginPath(); c.moveTo(0, s * 0.42); c.lineTo(0, -s * 0.30); c.stroke();
    c.restore();
  }

  function tulpe(c, s, col) {
    c.strokeStyle = shade(col, -45); c.lineWidth = s * 0.026; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, s * 0.44); c.quadraticCurveTo(s * 0.05, s * 0.10, 0, -s * 0.06); c.stroke();
    blatt(c, -s * 0.02, s * 0.30, s * 0.26, s * 0.07, -0.5, shade(col, -40));
    blatt(c, s * 0.03, s * 0.34, s * 0.22, s * 0.06, 0.55, shade(col, -30));
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(-s * 0.16, -s * 0.06);
    c.quadraticCurveTo(-s * 0.18, -s * 0.34, 0, -s * 0.38);
    c.quadraticCurveTo(s * 0.18, -s * 0.34, s * 0.16, -s * 0.06);
    c.quadraticCurveTo(0, s * 0.04, -s * 0.16, -s * 0.06);
    c.closePath(); c.fill();
    c.strokeStyle = rgba(shade(col, -50), 0.4); c.lineWidth = s * 0.016;
    c.beginPath(); c.moveTo(-s * 0.06, -s * 0.34); c.lineTo(-s * 0.05, -s * 0.02);
    c.moveTo(s * 0.06, -s * 0.34); c.lineTo(s * 0.05, -s * 0.02); c.stroke();
  }
  function gaensebluemchen(c, s, col) {
    c.strokeStyle = shade(col, -45); c.lineWidth = s * 0.022;
    c.beginPath(); c.moveTo(0, s * 0.44); c.quadraticCurveTo(-s * 0.04, s * 0.10, 0, -s * 0.02); c.stroke();
    for (let i = 0; i < 12; i++) {
      const a = i * TAU / 12;
      c.save(); c.translate(0, -s * 0.14); c.rotate(a);
      c.fillStyle = shade(col, 78);
      c.beginPath(); c.ellipse(0, -s * 0.15, s * 0.045, s * 0.13, 0, 0, TAU); c.fill();
      c.restore();
    }
    c.fillStyle = shade(col, 20);
    c.beginPath(); c.arc(0, -s * 0.14, s * 0.075, 0, TAU); c.fill();
    blatt(c, -s * 0.02, s * 0.32, s * 0.18, s * 0.06, -0.7, shade(col, -35));
  }
  function lavendel(c, s, col) {
    for (const [dx, dr] of [[-0.14, -0.22], [0.0, 0], [0.15, 0.22]]) {
      c.save(); c.translate(s * dx, s * 0.44); c.rotate(dr);
      c.strokeStyle = shade(col, -40); c.lineWidth = s * 0.018; c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -s * 0.44); c.stroke();
      for (let i = 0; i < 9; i++) {
        const y = -s * (0.44 + i * 0.035);
        const b = s * (0.045 - i * 0.003);
        for (const d of [-1, 1]) {
          c.fillStyle = shade(col, Math.round(i * 6 - 10));
          c.beginPath(); c.ellipse(d * b * 0.9, y, b, b * 1.5, d * 0.4, 0, TAU); c.fill();
        }
      }
      c.restore();
    }
  }
  function olivenzweig(c, s, col) {
    c.strokeStyle = shade(col, -35); c.lineWidth = s * 0.02; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-s * 0.40, s * 0.24); c.quadraticCurveTo(0, -s * 0.10, s * 0.38, -s * 0.28); c.stroke();
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const x = -s * 0.40 + t * s * 0.78;
      const y = s * (0.24 - t * 0.52) + S(t * 3) * s * 0.02;
      blatt(c, x, y, s * 0.15, s * 0.05, (i % 2 ? 1.0 : -1.0) - 0.5, shade(col, i % 2 ? 12 : -14));
      if (i % 3 === 1) {
        c.fillStyle = shade(col, -50);
        c.beginPath(); c.ellipse(x + s * 0.03, y + s * 0.04, s * 0.038, s * 0.048, 0.3, 0, TAU); c.fill();
      }
    }
  }
  function grasbuschel(c, s, col) {
    for (let i = 0; i < 11; i++) {
      const t = (i - 5) / 5;
      c.strokeStyle = shade(col, Math.round(Math.abs(t) * 30 - 15));
      c.lineWidth = s * 0.022; c.lineCap = 'round';
      c.beginPath();
      c.moveTo(t * s * 0.08, s * 0.40);
      c.quadraticCurveTo(t * s * 0.22, s * 0.05, t * s * 0.40, -s * (0.30 - Math.abs(t) * 0.14));
      c.stroke();
    }
  }
  function zweigBeeren(c, s, col) {
    c.strokeStyle = shade(col, -40); c.lineWidth = s * 0.022; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-s * 0.04, s * 0.44); c.quadraticCurveTo(s * 0.04, 0, -s * 0.02, -s * 0.36); c.stroke();
    const R = rnd(41);
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      const y = s * (0.30 - t * 0.62);
      const d = i % 2 ? 1 : -1;
      c.strokeStyle = shade(col, -40); c.lineWidth = s * 0.014;
      c.beginPath(); c.moveTo(0, y); c.lineTo(d * s * 0.13, y - s * 0.07); c.stroke();
      c.fillStyle = ball(c, d * s * 0.15, y - s * 0.08, s * 0.06, col);
      c.beginPath(); c.arc(d * s * 0.15, y - s * 0.08, s * 0.052, 0, TAU); c.fill();
    }
  }
  function kaktus(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = col;
      rrect(c, -s * 0.10, -s * 0.36, s * 0.20, s * 0.66, s * 0.10); c.fill();
      c.beginPath();
      c.moveTo(-s * 0.10, -s * 0.02);
      c.lineTo(-s * 0.26, -s * 0.02);
      c.quadraticCurveTo(-s * 0.32, -s * 0.02, -s * 0.32, -s * 0.12);
      c.lineTo(-s * 0.32, -s * 0.20);
      c.quadraticCurveTo(-s * 0.32, -s * 0.27, -s * 0.25, -s * 0.27);
      c.quadraticCurveTo(-s * 0.19, -s * 0.27, -s * 0.19, -s * 0.20);
      c.lineTo(-s * 0.19, -s * 0.10);
      c.lineTo(-s * 0.10, -s * 0.10);
      c.closePath(); c.fill();
    });
    c.strokeStyle = rgba(shade(col, -55), 0.4); c.lineWidth = s * 0.014;
    for (const dx of [-0.04, 0.04]) {
      c.beginPath(); c.moveTo(s * dx, -s * 0.30); c.lineTo(s * dx, s * 0.24); c.stroke();
    }
    c.fillStyle = shade(col, -35);
    rrect(c, -s * 0.20, s * 0.28, s * 0.40, s * 0.16, s * 0.03); c.fill();
  }
  function sukkulente(c, s, col) {
    for (let ring = 3; ring >= 0; ring--) {
      const n = 5 + ring * 2;
      const r = s * (0.10 + ring * 0.10);
      for (let i = 0; i < n; i++) {
        const a = i * TAU / n + ring * 0.4;
        c.save(); c.translate(C(a) * r * 0.5, S(a) * r * 0.5); c.rotate(a + Math.PI / 2);
        c.fillStyle = shade(col, Math.round(ring * 18 - 30));
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(s * 0.06, -r * 0.5, 0, -r);
        c.quadraticCurveTo(-s * 0.06, -r * 0.5, 0, 0);
        c.closePath(); c.fill();
        c.restore();
      }
    }
  }
  function weizen(c, s, col) {
    c.strokeStyle = shade(col, -30); c.lineWidth = s * 0.02; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, s * 0.44); c.lineTo(0, -s * 0.10); c.stroke();
    for (let i = 0; i < 8; i++) {
      const y = -s * (0.10 + i * 0.045);
      for (const d of [-1, 1]) {
        c.save(); c.translate(0, y); c.rotate(d * 0.75);
        c.fillStyle = shade(col, Math.round(i * 6 - 5));
        c.beginPath(); c.ellipse(d * s * 0.045, -s * 0.03, s * 0.032, s * 0.062, 0, 0, TAU); c.fill();
        c.restore();
      }
    }
    c.fillStyle = shade(col, 30);
    c.beginPath(); c.ellipse(0, -s * 0.46, s * 0.030, s * 0.058, 0, 0, TAU); c.fill();
  }
  function blattgold(c, s, col) {
    const R = rnd(97);
    for (let i = 0; i < 7; i++) {
      const a = R() * TAU;
      const r = s * (0.06 + R() * 0.28);
      blatt(c, C(a) * r, S(a) * r, s * (0.14 + R() * 0.10), s * 0.05, R() * TAU, shade(col, Math.round(R() * 70 - 20)));
    }
  }
  function pusteblume(c, s, col) {
    c.strokeStyle = shade(col, -40); c.lineWidth = s * 0.02; c.lineCap = 'round';
    c.beginPath(); c.moveTo(s * 0.02, s * 0.44); c.quadraticCurveTo(-s * 0.04, s * 0.06, s * 0.00, -s * 0.06); c.stroke();
    const R = rnd(67);
    for (let i = 0; i < 30; i++) {
      const a = -Math.PI / 2 + (R() - 0.5) * 4.6;
      const r = s * (0.14 + R() * 0.13);
      c.strokeStyle = rgba(shade(col, 40), 0.7); c.lineWidth = s * 0.010;
      c.beginPath(); c.moveTo(0, -s * 0.06); c.lineTo(C(a) * r, -s * 0.06 + S(a) * r); c.stroke();
      c.fillStyle = rgba(shade(col, 78), 0.9);
      c.beginPath(); c.arc(C(a) * r, -s * 0.06 + S(a) * r, s * 0.016, 0, TAU); c.fill();
    }
    for (let i = 0; i < 4; i++) {
      const a = -1.0 + i * 0.28;
      const r = s * (0.34 + i * 0.04);
      c.fillStyle = rgba(shade(col, 78), 0.8);
      c.beginPath(); c.arc(C(a) * r + s * 0.10, -s * 0.06 + S(a) * r, s * 0.014, 0, TAU); c.fill();
    }
  }

  /* ================================================================
     ▣ RAHMEN & BÄNDER
     ================================================================ */
  function zierrahmen(c, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.022;
    rrect(c, -s * 0.42, -s * 0.42, s * 0.84, s * 0.84, s * 0.04); c.stroke();
    c.lineWidth = s * 0.012;
    rrect(c, -s * 0.36, -s * 0.36, s * 0.72, s * 0.72, s * 0.03); c.stroke();
    c.fillStyle = col;
    for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      c.save(); c.translate(dx * s * 0.42, dy * s * 0.42);
      stern(c, 0, 0, s * 0.045, 4, 0.32); c.fill();
      c.restore();
    }
  }
  function ovalRahmen(c, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.028;
    c.beginPath(); c.ellipse(0, 0, s * 0.32, s * 0.42, 0, 0, TAU); c.stroke();
    c.lineWidth = s * 0.012;
    c.beginPath(); c.ellipse(0, 0, s * 0.27, s * 0.37, 0, 0, TAU); c.stroke();
    for (const d of [-1, 1]) {
      c.fillStyle = col;
      c.beginPath(); c.arc(0, d * s * 0.42, s * 0.035, 0, TAU); c.fill();
    }
  }
  function eckenSet(c, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.030; c.lineCap = 'round';
    for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      c.save(); c.scale(dx, dy);
      c.beginPath();
      c.moveTo(-s * 0.42, -s * 0.22);
      c.lineTo(-s * 0.42, -s * 0.42);
      c.lineTo(-s * 0.22, -s * 0.42);
      c.stroke();
      c.restore();
    }
  }
  function washiTape(c, s, col) {
    c.save(); c.rotate(-0.18);
    c.fillStyle = rgba(col, 0.85);
    c.beginPath();
    c.moveTo(-s * 0.46, -s * 0.11);
    for (let i = 0; i <= 6; i++) c.lineTo(-s * 0.46 + i * s * 0.153, -s * (i % 2 ? 0.09 : 0.11));
    c.lineTo(s * 0.46, s * 0.11);
    for (let i = 6; i >= 0; i--) c.lineTo(-s * 0.46 + i * s * 0.153, s * (i % 2 ? 0.09 : 0.11));
    c.closePath(); c.fill();
    c.strokeStyle = rgba(shade(col, 92), 0.55); c.lineWidth = s * 0.018;
    for (let i = -4; i <= 4; i++) {
      c.beginPath(); c.moveTo(s * i * 0.10 - s * 0.03, -s * 0.11); c.lineTo(s * i * 0.10 + s * 0.03, s * 0.11); c.stroke();
    }
    c.restore();
  }
  function washiPunkte(c, s, col) {
    c.save(); c.rotate(0.14);
    c.fillStyle = rgba(col, 0.85);
    c.fillRect(-s * 0.46, -s * 0.10, s * 0.92, s * 0.20);
    c.fillStyle = rgba(shade(col, 92), 0.7);
    for (let i = -4; i <= 4; i++) {
      for (const dy of [-0.045, 0.045]) {
        c.beginPath(); c.arc(s * i * 0.10, s * dy, s * 0.020, 0, TAU); c.fill();
      }
    }
    c.restore();
  }
  function trennlinie(c, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.020; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-s * 0.46, 0); c.lineTo(-s * 0.10, 0);
    c.moveTo(s * 0.10, 0); c.lineTo(s * 0.46, 0); c.stroke();
    c.fillStyle = col;
    for (const [dx, r] of [[-0.05, 0.020], [0, 0.032], [0.05, 0.020]]) {
      c.beginPath(); c.arc(s * dx, 0, s * r, 0, TAU); c.fill();
    }
  }
  function trennRanke(c, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.016; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-s * 0.46, 0); c.lineTo(-s * 0.14, 0);
    c.moveTo(s * 0.14, 0); c.lineTo(s * 0.46, 0); c.stroke();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.55;
      blatt(c, 0, s * 0.02, s * 0.13, s * 0.04, a, col);
    }
  }
  function bogenRahmen(c, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.026;
    c.beginPath();
    c.moveTo(-s * 0.30, s * 0.42);
    c.lineTo(-s * 0.30, -s * 0.10);
    c.arc(0, -s * 0.10, s * 0.30, Math.PI, 0);
    c.lineTo(s * 0.30, s * 0.42);
    c.stroke();
    c.lineWidth = s * 0.012;
    c.beginPath();
    c.moveTo(-s * 0.24, s * 0.42);
    c.lineTo(-s * 0.24, -s * 0.10);
    c.arc(0, -s * 0.10, s * 0.24, Math.PI, 0);
    c.lineTo(s * 0.24, s * 0.42);
    c.stroke();
  }
  function doppelrahmen(c, s, col) {
    c.strokeStyle = col;
    c.lineWidth = s * 0.030; c.strokeRect(-s * 0.42, -s * 0.34, s * 0.84, s * 0.68);
    c.lineWidth = s * 0.014; c.strokeRect(-s * 0.35, -s * 0.27, s * 0.70, s * 0.54);
  }
  function wimpelkette(c, s, col) {
    c.strokeStyle = shade(col, -30); c.lineWidth = s * 0.016;
    c.beginPath();
    c.moveTo(-s * 0.46, -s * 0.18);
    c.quadraticCurveTo(0, s * 0.02, s * 0.46, -s * 0.18);
    c.stroke();
    for (let i = 0; i < 7; i++) {
      const t = (i + 0.5) / 7;
      const x = -s * 0.46 + t * s * 0.92;
      const y = -s * 0.18 + 4 * t * (1 - t) * s * 0.20;
      c.fillStyle = shade(col, i % 2 ? 30 : -12);
      c.beginPath();
      c.moveTo(x - s * 0.055, y); c.lineTo(x + s * 0.055, y); c.lineTo(x, y + s * 0.16);
      c.closePath(); c.fill();
    }
  }
  function bandSchleife(c, s, col) {
    c.fillStyle = col;
    for (const d of [-1, 1]) {
      c.save(); c.scale(d, 1);
      c.beginPath();
      c.moveTo(0, 0);
      c.bezierCurveTo(s * 0.10, -s * 0.28, s * 0.40, -s * 0.24, s * 0.34, -s * 0.04);
      c.bezierCurveTo(s * 0.30, s * 0.10, s * 0.10, s * 0.06, 0, 0);
      c.closePath(); c.fill();
      c.restore();
    }
    c.fillStyle = shade(col, -30);
    for (const d of [-1, 1]) {
      c.beginPath();
      c.moveTo(d * s * 0.04, s * 0.03);
      c.lineTo(d * s * 0.22, s * 0.36);
      c.lineTo(d * s * 0.10, s * 0.34);
      c.lineTo(d * s * 0.02, s * 0.12);
      c.closePath(); c.fill();
    }
    c.fillStyle = shade(col, 40);
    c.beginPath(); c.ellipse(0, 0, s * 0.055, s * 0.045, 0, 0, TAU); c.fill();
  }
  function klammer(c, s, col) {
    c.save(); c.rotate(0.22);
    c.strokeStyle = shade(col, -10); c.lineWidth = s * 0.045; c.lineCap = 'round'; c.lineJoin = 'round';
    const r1 = s * 0.10, r2 = s * 0.055;
    c.beginPath();
    c.moveTo(-r2, s * 0.30);
    c.lineTo(-r2, -s * 0.22);
    c.arc(0, -s * 0.22, r2, Math.PI, 0);
    c.lineTo(r2, s * 0.18);
    c.arc(0, s * 0.18, r1, 0, Math.PI);
    c.lineTo(-r1, -s * 0.30);
    c.arc(0, -s * 0.30, r1, Math.PI, 0);
    c.lineTo(r1, s * 0.10);
    c.stroke();
    c.strokeStyle = rgba('#ffffff', 0.4); c.lineWidth = s * 0.014;
    c.beginPath(); c.moveTo(-r2 - s * 0.008, s * 0.24); c.lineTo(-r2 - s * 0.008, -s * 0.18); c.stroke();
    c.restore();
  }

  function polaroidRahmen(c, s, col) {
    schatten(c, s, () => {
      c.fillStyle = shade(col, 88);
      c.save(); c.rotate(-0.06);
      rrect(c, -s * 0.34, -s * 0.38, s * 0.68, s * 0.80, s * 0.02); c.fill();
      c.fillStyle = rgba(shade(col, -20), 0.35);
      c.fillRect(-s * 0.28, -s * 0.32, s * 0.56, s * 0.56);
      c.restore();
    });
  }
  function sternRahmen(c, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.02;
    c.beginPath(); c.arc(0, 0, s * 0.30, 0, TAU); c.stroke();
    for (let i = 0; i < 12; i++) {
      const a = i * TAU / 12;
      c.fillStyle = col;
      stern(c, C(a) * s * 0.38, S(a) * s * 0.38, s * (i % 2 ? 0.035 : 0.055), 4, 0.32); c.fill();
    }
  }
  function notizzettel(c, s, col) {
    schatten(c, s, () => {
      c.save(); c.rotate(0.05);
      c.fillStyle = shade(col, 62);
      c.beginPath();
      c.moveTo(-s * 0.34, -s * 0.32); c.lineTo(s * 0.34, -s * 0.32);
      c.lineTo(s * 0.34, s * 0.22); c.lineTo(s * 0.20, s * 0.34);
      c.lineTo(-s * 0.34, s * 0.34); c.closePath(); c.fill();
      c.fillStyle = shade(col, 30);
      c.beginPath(); c.moveTo(s * 0.34, s * 0.22); c.lineTo(s * 0.20, s * 0.34); c.lineTo(s * 0.20, s * 0.22); c.closePath(); c.fill();
      c.restore();
    });
    c.strokeStyle = rgba(shade(col, -30), 0.55); c.lineWidth = s * 0.014;
    for (let i = 0; i < 4; i++) {
      c.beginPath(); c.moveTo(-s * 0.26, s * (-0.18 + i * 0.12)); c.lineTo(s * 0.24, s * (-0.18 + i * 0.12)); c.stroke();
    }
  }
  function fotoEcken(c, s, col) {
    c.fillStyle = col;
    for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      c.save(); c.scale(dx, dy);
      c.beginPath();
      c.moveTo(-s * 0.42, -s * 0.42);
      c.lineTo(-s * 0.42, -s * 0.20);
      c.lineTo(-s * 0.20, -s * 0.42);
      c.closePath(); c.fill();
      c.restore();
    }
  }

  /* ================================================================
     ✎ HANDGEZEICHNET – zum Betonen
     ================================================================ */
  function kringelKreis(c, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.030; c.lineCap = 'round';
    for (let k = 0; k < 2; k++) {
      c.beginPath();
      for (let i = 0; i <= 60; i++) {
        const p = i / 60;
        const a = p * TAU * 1.06 - 0.4 + k * 0.18;
        const r = s * (0.36 + S(p * 9 + k) * 0.014) * (1 - k * 0.05);
        const x = C(a) * r, y = S(a) * r * 0.82;
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
    }
  }
  function unterstrich(c, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.034; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-s * 0.44, s * 0.02);
    c.bezierCurveTo(-s * 0.16, -s * 0.06, s * 0.16, s * 0.06, s * 0.44, -s * 0.02);
    c.stroke();
    c.lineWidth = s * 0.022;
    c.beginPath();
    c.moveTo(-s * 0.38, s * 0.12);
    c.bezierCurveTo(-s * 0.10, s * 0.05, s * 0.14, s * 0.16, s * 0.40, s * 0.08);
    c.stroke();
  }
  function zickzackStrich(c, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.030; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(-s * 0.44, s * 0.06);
    for (let i = 0; i < 6; i++) c.lineTo(-s * 0.44 + (i + 1) * s * 0.147, s * (i % 2 ? 0.06 : -0.08));
    c.stroke();
  }
  function pfeilHand(c, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.030; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(-s * 0.38, s * 0.24);
    c.bezierCurveTo(-s * 0.20, -s * 0.16, s * 0.06, -s * 0.30, s * 0.30, -s * 0.14);
    c.stroke();
    c.beginPath();
    c.moveTo(s * 0.12, -s * 0.26); c.lineTo(s * 0.32, -s * 0.13); c.lineTo(s * 0.16, s * 0.02);
    c.stroke();
  }
  function pfeilRund(c, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.030; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.arc(0, 0, s * 0.30, 0.7, TAU - 0.2); c.stroke();
    c.beginPath();
    c.moveTo(s * 0.10, -s * 0.34); c.lineTo(s * 0.30, -s * 0.24); c.lineTo(s * 0.18, -s * 0.05);
    c.stroke();
  }
  function ausrufezeichen(c, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.075; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, -s * 0.36); c.lineTo(s * 0.02, s * 0.10); c.stroke();
    c.fillStyle = col;
    c.beginPath(); c.arc(s * 0.03, s * 0.30, s * 0.055, 0, TAU); c.fill();
  }
  function fragezeichen(c, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.070; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-s * 0.16, -s * 0.22);
    c.bezierCurveTo(-s * 0.12, -s * 0.44, s * 0.22, -s * 0.42, s * 0.16, -s * 0.16);
    c.bezierCurveTo(s * 0.12, s * 0.00, s * 0.00, s * 0.00, s * 0.00, s * 0.14);
    c.stroke();
    c.fillStyle = col;
    c.beginPath(); c.arc(0, s * 0.32, s * 0.055, 0, TAU); c.fill();
  }
  function herzKritzel(c, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.030; c.lineCap = 'round';
    for (let k = 0; k < 2; k++) {
      const o = k * s * 0.018;
      c.beginPath();
      c.moveTo(o, s * 0.34 + o);
      c.bezierCurveTo(-s * 0.42 + o, s * 0.02, -s * 0.22, -s * 0.36 + o, o, -s * 0.10);
      c.bezierCurveTo(s * 0.22, -s * 0.36 - o, s * 0.42 - o, s * 0.02, o, s * 0.34 + o);
      c.stroke();
    }
  }
  function sternKritzel(c, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.028; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath();
    for (let i = 0; i <= 5; i++) {
      const a = -Math.PI / 2 + i * (TAU * 2 / 5);
      const x = C(a) * s * 0.34, y = S(a) * s * 0.34;
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.closePath(); c.stroke();
  }
  function strahlenBetonung(c, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.028; c.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8 + 0.2;
      c.beginPath();
      c.moveTo(C(a) * s * 0.18, S(a) * s * 0.18);
      c.lineTo(C(a) * s * (0.34 + (i % 2) * 0.08), S(a) * s * (0.34 + (i % 2) * 0.08));
      c.stroke();
    }
  }
  function klammerAuf(c, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.028; c.lineCap = 'round';
    for (const d of [-1, 1]) {
      c.beginPath();
      c.moveTo(d * s * 0.24, -s * 0.40);
      c.quadraticCurveTo(d * s * 0.36, -s * 0.36, d * s * 0.34, -s * 0.06);
      c.quadraticCurveTo(d * s * 0.33, s * 0.00, d * s * 0.42, s * 0.00);
      c.quadraticCurveTo(d * s * 0.33, s * 0.00, d * s * 0.34, s * 0.06);
      c.quadraticCurveTo(d * s * 0.36, s * 0.36, d * s * 0.24, s * 0.40);
      c.stroke();
    }
  }
  function wolkeGedanke(c, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.026; c.lineCap = 'round';
    c.beginPath();
    c.arc(-s * 0.18, -s * 0.04, s * 0.15, Math.PI * 0.6, Math.PI * 1.9);
    c.arc(-s * 0.01, -s * 0.16, s * 0.16, Math.PI * 1.15, Math.PI * 1.95);
    c.arc(s * 0.18, -s * 0.04, s * 0.15, Math.PI * 1.35, Math.PI * 0.42);
    c.arc(0, s * 0.06, s * 0.17, Math.PI * 0.06, Math.PI * 0.92);
    c.closePath(); c.stroke();
    c.beginPath(); c.arc(-s * 0.24, s * 0.22, s * 0.048, 0, TAU); c.stroke();
    c.beginPath(); c.arc(-s * 0.33, s * 0.34, s * 0.028, 0, TAU); c.stroke();
  }

  /* ================================================================
     Register
     ================================================================ */
  const NEU = [
    // ---- 🎄 Feste & Jahreszeiten (24) ----
    { id: 'fe-tanne',      cat: 'fest', name: 'Tannenbaum',      anim: 'sway',      draw: tannenbaum },
    { id: 'fe-kugel',      cat: 'fest', name: 'Christbaumkugel', anim: 'swing',     draw: kugelSchmuck },
    { id: 'fe-flocke',     cat: 'fest', name: 'Schneeflocke',    anim: 'spin-slow', draw: schneeflocke },
    { id: 'fe-geschenk',   cat: 'fest', name: 'Geschenk',        anim: 'bounce',    draw: geschenk },
    { id: 'fe-kerze',      cat: 'fest', name: 'Adventskerze',    anim: 'candleglow',    draw: kerzeAdvent },
    { id: 'fe-zucker',     cat: 'fest', name: 'Zuckerstange',    draw: zuckerstange },
    { id: 'fe-schlittsch', cat: 'fest', name: 'Schlittschuh',    anim: 'sway',      draw: schlittschuh },
    { id: 'fe-stiefel',    cat: 'fest', name: 'Nikolausstiefel', draw: stiefel },
    { id: 'fe-kranz',      cat: 'fest', name: 'Tannenkranz',     anim: 'breathe',   draw: kranzTanne },
    { id: 'fe-ei',         cat: 'fest', name: 'Osterei',         anim: 'wiggle-soft', draw: osterei },
    { id: 'fe-hase',       cat: 'fest', name: 'Osterhase',       anim: 'bounce',    draw: hase },
    { id: 'fe-kuerbis',    cat: 'fest', name: 'Kürbis',          anim: 'wiggle',    draw: kuerbis },
    { id: 'fe-geist',      cat: 'fest', name: 'Gespenst',        anim: 'float',     draw: gespenst },
    { id: 'fe-fledermaus', cat: 'fest', name: 'Fledermaus',      anim: 'wiggle-fast',   draw: fledermaus },
    { id: 'fe-torte',      cat: 'fest', name: 'Geburtstagstorte', anim: 'breathe',  draw: torte },
    { id: 'fe-ballon',     cat: 'fest', name: 'Luftballon',      anim: 'float',     draw: luftballon },
    { id: 'fe-konfetti',   cat: 'fest', name: 'Konfetti-Wurf',   anim: 'twinkle',   draw: konfettiWurf },
    { id: 'fe-sekt',       cat: 'fest', name: 'Anstoßen',        anim: 'wiggle-soft', draw: sektglaeser },
    { id: 'fe-ringe',      cat: 'fest', name: 'Eheringe',        anim: 'shimmer',   draw: ringePaar },
    { id: 'fe-hochzeit',   cat: 'fest', name: 'Hochzeitstorte',  draw: hochzeitstorte },
    { id: 'fe-babyschuh',  cat: 'fest', name: 'Babyschuhe',      anim: 'sway',      draw: babyschuhe },
    { id: 'fe-schnuller',  cat: 'fest', name: 'Schnuller',       anim: 'wiggle-soft', draw: schnuller },
    { id: 'fe-storch',     cat: 'fest', name: 'Storch',          anim: 'float',     draw: storch },
    { id: 'fe-herbst',     cat: 'fest', name: 'Herbstblatt',     anim: 'sway',      draw: herbstblatt },

    // ---- ✈ Reise (16) ----
    { id: 're-sonne',      cat: 'reise', name: 'Sommersonne',    anim: 'spin-slow', draw: sonneSommer },
    { id: 're-muschel',    cat: 'reise', name: 'Muschel',        draw: muschel },
    { id: 're-koffer',     cat: 'reise', name: 'Koffer',         anim: 'bounce',    draw: koffer },
    { id: 're-flugzeug',   cat: 'reise', name: 'Flugzeug',       anim: 'float',     draw: flugzeug },
    { id: 're-karte',      cat: 'reise', name: 'Landkarte',      draw: landkarte },
    { id: 're-kompass',    cat: 'reise', name: 'Kompass',        anim: 'wiggle-soft', draw: kompass },
    { id: 're-berge',      cat: 'reise', name: 'Bergpanorama',   draw: berge2 },
    { id: 're-palme',      cat: 'reise', name: 'Palme',          anim: 'sway',      draw: palme },
    { id: 're-kamera',     cat: 'reise', name: 'Kamera',         anim: 'wiggle',    draw: kamera },
    { id: 're-ticket',     cat: 'reise', name: 'Ticket',         draw: ticket },
    { id: 're-pass',       cat: 'reise', name: 'Reisepass',      draw: reisepass },
    { id: 're-globus',     cat: 'reise', name: 'Globus',         anim: 'spin-slow', draw: globus },
    { id: 're-anker',      cat: 'reise', name: 'Anker',          anim: 'swing',     draw: anker },
    { id: 're-heissluft',  cat: 'reise', name: 'Heißluftballon', anim: 'float',     draw: heissluftballon },
    { id: 're-leuchtturm', cat: 'reise', name: 'Leuchtturm',     anim: 'glow', draw: leuchtturm },
    { id: 're-standort',   cat: 'reise', name: 'Standort',       anim: 'bounce',    draw: standort },

    // ---- ☕ Café (16) ----
    { id: 'ca-surf',       cat: 'food', name: 'Surfbrett',       anim: 'sway',      draw: surfbrett },
    { id: 'ca-brille',     cat: 'food', name: 'Sonnenbrille',    anim: 'shimmer',   draw: sonnenbrille },
    { id: 'ca-tasse',      cat: 'food', name: 'Kaffeetasse',     anim: 'breathe',   draw: kaffeetasse },
    { id: 'ca-togo',       cat: 'food', name: 'Coffee to go',    anim: 'wiggle-soft', draw: coffeeToGo },
    { id: 'ca-croissant',  cat: 'food', name: 'Croissant',       draw: croissant },
    { id: 'ca-kuchen',     cat: 'food', name: 'Kuchenstück',     anim: 'bounce',    draw: kuchenstueck },
    { id: 'ca-eis',        cat: 'food', name: 'Eiswaffel',       anim: 'wiggle',    draw: eisWaffel },
    { id: 'ca-wein',       cat: 'food', name: 'Weinglas',        anim: 'shimmer',   draw: weinglas },
    { id: 'ca-cocktail',   cat: 'food', name: 'Cocktail',        anim: 'wiggle-soft', draw: cocktail },
    { id: 'ca-macaron',    cat: 'food', name: 'Macarons',        draw: macarons },
    { id: 'ca-donut',      cat: 'food', name: 'Donut',           anim: 'spin-slow', draw: donut },
    { id: 'ca-picknick',   cat: 'food', name: 'Picknickkorb',    draw: picknickkorb },
    { id: 'ca-avocado',    cat: 'food', name: 'Avocado',         draw: avocado },
    { id: 'ca-erdbeere',   cat: 'food', name: 'Erdbeere',        anim: 'bounce',    draw: erdbeere },
    { id: 'ca-honig',      cat: 'food', name: 'Honigglas',       draw: honigglas },
    { id: 'ca-baguette',   cat: 'food', name: 'Baguette',        draw: baguette },

    // ---- ◈ Angebot (16) ----
    { id: 'bz-teekanne',   cat: 'biz', name: 'Teekanne',         anim: 'breathe',   draw: teekanne },
    { id: 'bz-preis',      cat: 'biz', name: 'Preisschild',      anim: 'swing',     draw: preisschild },
    { id: 'bz-prozent',    cat: 'biz', name: 'Rabatt',           anim: 'pop',       draw: prozent },
    { id: 'bz-haken',      cat: 'biz', name: 'Häkchen',          anim: 'pop',       draw: haken },
    { id: 'bz-sterne',     cat: 'biz', name: '5 Sterne',         anim: 'twinkle',   draw: sterneBewertung },
    { id: 'bz-cta',        cat: 'biz', name: 'Sprechblase',      anim: 'bounce',    draw: sprechblaseCTA },
    { id: 'bz-pfeilkurve', cat: 'biz', name: 'Bogenpfeil',       draw: pfeilKurve },
    { id: 'bz-pfeil',      cat: 'biz', name: 'Pfeil',            anim: 'wiggle-tap',     draw: pfeilGerade },
    { id: 'bz-siegel',     cat: 'biz', name: 'Gütesiegel',       anim: 'shimmer',   draw: siegel },
    { id: 'bz-band',       cat: 'biz', name: 'Banner-Band',      draw: schleifeBand },
    { id: 'bz-nummer',     cat: 'biz', name: 'Nummernkreis',     draw: nummernkreis },
    { id: 'bz-zertifikat', cat: 'biz', name: 'Urkunde',          draw: zertifikat },
    { id: 'bz-megafon',    cat: 'biz', name: 'Megafon',          anim: 'wiggle',    draw: megafon },
    { id: 'bz-korb',       cat: 'biz', name: 'Warenkorb',        anim: 'bounce',    draw: warenkorb },
    { id: 'bz-neu',        cat: 'biz', name: 'Neu-Banner',       anim: 'pop',       draw: neuBanner },
    { id: 'bz-uhr',        cat: 'biz', name: 'Uhr',              draw: uhrZeit },

    // ---- ❀ Botanik (20) ----
    { id: 'bo2-birne',     cat: 'botanik', name: 'Glühbirne',    anim: 'glow', draw: gluehbirne },
    { id: 'bo2-eukalyptus', cat: 'botanik', name: 'Eukalyptus',  anim: 'sway',      draw: eukalyptus },
    { id: 'bo2-pampas',    cat: 'botanik', name: 'Pampasgras',   anim: 'sway',      draw: pampasgras },
    { id: 'bo2-trocken',   cat: 'botanik', name: 'Trockenblume', anim: 'sway',      draw: trockenblume },
    { id: 'bo2-rose',      cat: 'botanik', name: 'Rosenzweig',   draw: rosenzweig },
    { id: 'bo2-blattkranz', cat: 'botanik', name: 'Blätterkranz', anim: 'breathe',  draw: blaetterkranz },
    { id: 'bo2-bluetenkranz', cat: 'botanik', name: 'Blütenkranz', anim: 'breathe', draw: blumenkranz },
    { id: 'bo2-ranke',     cat: 'botanik', name: 'Ranke',        anim: 'sway',      draw: ranke },
    { id: 'bo2-farn',      cat: 'botanik', name: 'Farn',         anim: 'sway',      draw: farn },
    { id: 'bo2-monstera',  cat: 'botanik', name: 'Monstera',     anim: 'sway',      draw: monstera },
    { id: 'bo2-tulpe',     cat: 'botanik', name: 'Tulpe',        anim: 'sway',      draw: tulpe },
    { id: 'bo2-gaense',    cat: 'botanik', name: 'Gänseblümchen', anim: 'sway',     draw: gaensebluemchen },
    { id: 'bo2-lavendel',  cat: 'botanik', name: 'Lavendel',     anim: 'sway',      draw: lavendel },
    { id: 'bo2-olive',     cat: 'botanik', name: 'Olivenzweig',  anim: 'sway',      draw: olivenzweig },
    { id: 'bo2-gras',      cat: 'botanik', name: 'Grasbüschel',  anim: 'sway',      draw: grasbuschel },
    { id: 'bo2-beeren',    cat: 'botanik', name: 'Beerenzweig',  anim: 'sway',      draw: zweigBeeren },
    { id: 'bo2-kaktus',    cat: 'botanik', name: 'Kaktus',       draw: kaktus },
    { id: 'bo2-sukkulente', cat: 'botanik', name: 'Sukkulente',  anim: 'breathe',   draw: sukkulente },
    { id: 'bo2-weizen',    cat: 'botanik', name: 'Weizenähre',   anim: 'sway',      draw: weizen },
    { id: 'bo2-blattgold', cat: 'botanik', name: 'Blattstreu',   anim: 'twinkle',   draw: blattgold },

    // ---- ▣ Rahmen & Bänder (16) ----
    { id: 'ra-puste',      cat: 'rahmen', name: 'Pusteblume',    anim: 'sway',      draw: pusteblume },
    { id: 'ra-zier',       cat: 'rahmen', name: 'Zierrahmen',    draw: zierrahmen },
    { id: 'ra-oval',       cat: 'rahmen', name: 'Oval-Rahmen',   draw: ovalRahmen },
    { id: 'ra-ecken',      cat: 'rahmen', name: 'Eckwinkel',     draw: eckenSet },
    { id: 'ra-washi',      cat: 'rahmen', name: 'Washi-Tape',    ar: 4, draw: washiTape },
    { id: 'ra-washi2',     cat: 'rahmen', name: 'Tape gepunktet', ar: 4, draw: washiPunkte },
    { id: 'ra-trenn',      cat: 'rahmen', name: 'Trennlinie',    ar: 4, draw: trennlinie },
    { id: 'ra-trennranke', cat: 'rahmen', name: 'Trennranke',    ar: 4, draw: trennRanke },
    { id: 'ra-bogen',      cat: 'rahmen', name: 'Bogenrahmen',   draw: bogenRahmen },
    { id: 'ra-doppel',     cat: 'rahmen', name: 'Doppelrahmen',  draw: doppelrahmen },
    { id: 'ra-wimpel',     cat: 'rahmen', name: 'Wimpelkette',   ar: 3, anim: 'sway', draw: wimpelkette },
    { id: 'ra-schleife',   cat: 'rahmen', name: 'Bandschleife',  draw: bandSchleife },
    { id: 'ra-klammer',    cat: 'rahmen', name: 'Büroklammer',   draw: klammer },
    { id: 'ra-polaroid',   cat: 'rahmen', name: 'Polaroid',      draw: polaroidRahmen },
    { id: 'ra-sternkreis', cat: 'rahmen', name: 'Sternenkreis',  anim: 'spin-slow', draw: sternRahmen },
    { id: 'ra-notiz',      cat: 'rahmen', name: 'Notizzettel',   draw: notizzettel },

    // ---- ✎ Handgezeichnet (12) ----
    { id: 'hd-fotoecken',  cat: 'hand', name: 'Fotoecken',       draw: fotoEcken },
    { id: 'hd-kringel',    cat: 'hand', name: 'Kringel',         anim: 'wiggle-soft', draw: kringelKreis },
    { id: 'hd-unterstrich', cat: 'hand', name: 'Unterstreichen', ar: 3, draw: unterstrich },
    { id: 'hd-zickzack',   cat: 'hand', name: 'Zickzack',        ar: 3, draw: zickzackStrich },
    { id: 'hd-pfeil',      cat: 'hand', name: 'Pfeil gemalt',    anim: 'wiggle-tap',     draw: pfeilHand },
    { id: 'hd-pfeilrund',  cat: 'hand', name: 'Rundpfeil',       anim: 'spin-slow', draw: pfeilRund },
    { id: 'hd-ausruf',     cat: 'hand', name: 'Ausrufezeichen',  anim: 'bounce',    draw: ausrufezeichen },
    { id: 'hd-frage',      cat: 'hand', name: 'Fragezeichen',    anim: 'wiggle-soft', draw: fragezeichen },
    { id: 'hd-herz',       cat: 'hand', name: 'Herz gemalt',     anim: 'heartbeat', draw: herzKritzel },
    { id: 'hd-stern',      cat: 'hand', name: 'Stern gemalt',    anim: 'twinkle',   draw: sternKritzel },
    { id: 'hd-strahlen',   cat: 'hand', name: 'Strahlen',        anim: 'pulse',     draw: strahlenBetonung },
    { id: 'hd-klammern',   cat: 'hand', name: 'Klammern',        draw: klammerAuf },
    { id: 'hd-wolke',      cat: 'hand', name: 'Gedankenwolke',   anim: 'float',     draw: wolkeGedanke },
  ];

  NEU.forEach(d => SS.STICKERS.push(d));
  SS.STICKER_52 = NEU.length;
})();
