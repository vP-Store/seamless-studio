/* Seamless Studio – Objekt-Rahmen, zweiter Satz (v7.6)
   ============================================================================
   Vier Rahmen nach Scotts neuen Pinterest-Vorbildern:

     digicam     rosa Digitalkamera (Rückseite): das Foto ist das Display,
                 rechts Moduswahlrad, Kreuzwippe und Knöpfe – wie die
                 Sony-Kamera auf dem Blumen-Vorbild. frame.color = Gehäuse.
     puzzle      Puzzleteil: das Foto füllt ein Teil mit Nase oben und
                 rechts, Bucht unten und links – mehrere nebeneinander
                 ergeben die Puzzle-Wand aus dem „Happy Place"-Vorbild.
     herzperlen  Herz aus Perlen: das Foto sitzt herzförmig geclippt hinter
                 einem Kranz aus schimmernden Perlen (Pastell-Journal).
     poststempel Briefmarke mit Wellenrand UND Poststempel-Ringen oben –
                 dichter als der schlichte `stamp`-Rahmen.

   Wie rahmen7.js/rahmen75.js: SS.buildCard wird umschlossen, die neuen
   Stile zeichnen hier, alles andere läuft durchs Original. Platzhalter-
   Karten laufen ebenfalls durch SS.buildCard – leere Plätze zeigen die
   Objekte automatisch mit gestrichelter Fläche.
   ========================================================================= */

(function () {
  if (!SS.FRAMES || typeof SS.buildCard !== 'function') return;
  const TAU = Math.PI * 2;

  const NEU = [
    { id: 'digicam',     name: 'Digicam rosa' },
    { id: 'puzzle',      name: 'Puzzleteil' },
    { id: 'herzperlen',  name: 'Perlen-Herz' },
    { id: 'poststempel', name: 'Poststempel' },
  ];
  for (const n of NEU) {
    if (!SS.FRAMES.some(f => (f.id || f) === n.id)) SS.FRAMES.push(n);
  }
  const MEINE = new Set(NEU.map(n => n.id));

  function rp(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  function shade(hex, amt) {
    const h = String(hex || '').replace('#', '');
    if (h.length !== 6) return hex;
    const n = [0, 2, 4].map(i => Math.max(0, Math.min(255, parseInt(h.slice(i, i + 2), 16) + amt)));
    return '#' + n.map(v => v.toString(16).padStart(2, '0')).join('');
  }

  /* Herz-Pfad, zentriert auf (cx, cy), Größe r (halbe Breite) */
  function herz(c, cx, cy, r) {
    c.beginPath();
    c.moveTo(cx, cy + r * 0.9);
    c.bezierCurveTo(cx - r * 1.24, cy + r * 0.15, cx - r * 0.96, cy - r * 0.86, cx, cy - r * 0.36);
    c.bezierCurveTo(cx + r * 0.96, cy - r * 0.86, cx + r * 1.24, cy + r * 0.15, cx, cy + r * 0.9);
    c.closePath();
  }

  /* Puzzleteil-Pfad: Nase oben + rechts, Bucht unten + links */
  function puzzlePfad(c, x, y, w, h) {
    const k = Math.min(w, h) * 0.18;      // Nasen-Radius
    c.beginPath();
    c.moveTo(x, y);
    /* oben mit Nase nach außen */
    c.lineTo(x + w * 0.38, y);
    c.arc(x + w * 0.5, y - k * 0.55, k * 0.62, Math.PI * 0.82, Math.PI * 0.18, true);
    c.lineTo(x + w * 0.62, y);
    c.lineTo(x + w, y);
    /* rechts mit Nase nach außen */
    c.lineTo(x + w, y + h * 0.38);
    c.arc(x + w + k * 0.55, y + h * 0.5, k * 0.62, Math.PI * 1.32, Math.PI * 0.68, true);
    c.lineTo(x + w, y + h * 0.62);
    c.lineTo(x + w, y + h);
    /* unten mit Bucht nach innen */
    c.lineTo(x + w * 0.62, y + h);
    c.arc(x + w * 0.5, y + h - k * 0.55, k * 0.62, Math.PI * 0.18, Math.PI * 0.82, true);
    c.lineTo(x + w * 0.38, y + h);
    c.lineTo(x, y + h);
    /* links mit Bucht nach innen */
    c.lineTo(x, y + h * 0.62);
    c.arc(x + k * 0.55, y + h * 0.5, k * 0.62, Math.PI * 0.68, Math.PI * 1.32, true);
    c.lineTo(x, y + h * 0.38);
    c.closePath();
  }

  const alt = SS.buildCard;
  SS.buildCard = function (el, srcCanvas, h) {
    const f = el && el.frame;
    const stil = f && f.style;
    if (!stil || !MEINE.has(stil)) return alt.apply(this, arguments);

    const ar = srcCanvas.width / srcCanvas.height;
    const w = h * ar;
    const pad = 6;

    /* ---------------- rosa Digitalkamera (Rückseite) --------------------- */
    if (stil === 'digicam') {
      const body = f.color && f.color !== '#fdfbf8' ? f.color : '#e9b7c9';
      const rand = Math.max(14, (f.border || 18));
      const rechts = w * 0.34;                       // Bedienfeld rechts
      const bw = w + rand * 2 + rechts, bh = h + rand * 2.6;
      const cv = document.createElement('canvas');
      cv.width = Math.ceil(bw + pad * 2);
      cv.height = Math.ceil(bh + pad * 2);
      const c = cv.getContext('2d');
      const bx = pad, by = pad;
      /* Gehäuse mit sanftem Verlauf */
      const g = c.createLinearGradient(bx, by, bx, by + bh);
      g.addColorStop(0, shade(body, 26));
      g.addColorStop(0.5, body);
      g.addColorStop(1, shade(body, -18));
      c.fillStyle = g;
      rp(c, bx, by, bw, bh, Math.max(12, bh * 0.07)); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.30)'; c.lineWidth = Math.max(2, bh * 0.012);
      rp(c, bx, by, bw, bh, Math.max(12, bh * 0.07)); c.stroke();
      /* Oberkante: Auslöser + Zoomwippe angedeutet */
      c.fillStyle = shade(body, -35);
      rp(c, bx + bw * 0.72, by + bh * 0.015, bw * 0.16, bh * 0.045, bh * 0.02); c.fill();
      /* Schriftzug */
      c.fillStyle = 'rgba(90,60,70,.75)';
      c.font = `600 ${Math.max(9, Math.round(bh * 0.035))}px Poppins, sans-serif`;
      c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText('SUPER STEADY', bx + rand, by + rand * 0.62);
      /* Display = Foto, dunkler Displayrand */
      const dx = bx + rand, dy = by + rand * 1.3;
      c.fillStyle = '#1c1a1e';
      rp(c, dx - rand * 0.35, dy - rand * 0.35, w + rand * 0.7, h + rand * 0.7, 6); c.fill();
      c.drawImage(srcCanvas, dx, dy, w, h);
      c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1.5;
      c.strokeRect(dx, dy, w, h);
      /* Bedienfeld rechts */
      const px = bx + rand * 1.6 + w + rand * 0.4, pw = bw - (px - bx) - rand * 0.6;
      const cx = px + pw / 2;
      /* Moduswahlrad */
      const modY = by + bh * 0.20, modR = Math.min(pw * 0.42, bh * 0.11);
      c.fillStyle = shade(body, -55);
      c.beginPath(); c.arc(cx, modY, modR, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = Math.max(1.5, modR * 0.08);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU;
        c.beginPath();
        c.moveTo(cx + Math.cos(a) * modR * 0.7, modY + Math.sin(a) * modR * 0.7);
        c.lineTo(cx + Math.cos(a) * modR * 0.95, modY + Math.sin(a) * modR * 0.95);
        c.stroke();
      }
      /* Kreuzwippe */
      const kwY = by + bh * 0.56, kwR = Math.min(pw * 0.40, bh * 0.10);
      c.fillStyle = shade(body, -45);
      c.beginPath(); c.arc(cx, kwY, kwR, 0, TAU); c.fill();
      c.fillStyle = shade(body, 40);
      c.beginPath(); c.arc(cx, kwY, kwR * 0.42, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,.55)';
      [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([mx, my]) => {
        c.beginPath();
        c.arc(cx + mx * kwR * 0.72, kwY + my * kwR * 0.72, kwR * 0.10, 0, TAU);
        c.fill();
      });
      /* zwei kleine Knöpfe */
      c.fillStyle = shade(body, -50);
      [[-0.28, 0.80], [0.28, 0.80]].forEach(([fx, fy]) => {
        c.beginPath(); c.arc(px + pw * (0.5 + fx), by + bh * fy, kwR * 0.28, 0, TAU); c.fill();
      });
      return cv;
    }

    /* ---------------- Puzzleteil ----------------------------------------- */
    if (stil === 'puzzle') {
      const k = Math.min(w, h) * 0.18;
      const cv = document.createElement('canvas');
      cv.width = Math.ceil(w + k * 1.6 + pad * 2);
      cv.height = Math.ceil(h + k * 1.6 + pad * 2);
      const c = cv.getContext('2d');
      const x = pad + k * 0.8, y = pad + k * 0.8;
      /* weißer Rand wie ausgestanzt */
      c.save();
      puzzlePfad(c, x, y, w, h);
      c.lineJoin = 'round';
      c.strokeStyle = f.color && f.color !== '#fdfbf8' ? f.color : '#ffffff';
      c.lineWidth = Math.max(6, Math.min(w, h) * 0.05);
      c.stroke();
      c.clip();
      const sc = Math.max(w / srcCanvas.width, h / srcCanvas.height) * 1.15;
      c.drawImage(srcCanvas, x + w / 2 - srcCanvas.width * sc / 2,
        y + h / 2 - srcCanvas.height * sc / 2,
        srcCanvas.width * sc, srcCanvas.height * sc);
      c.restore();
      puzzlePfad(c, x, y, w, h);
      c.strokeStyle = 'rgba(60,50,45,.35)';
      c.lineWidth = Math.max(2, Math.min(w, h) * 0.012);
      c.stroke();
      return cv;
    }

    /* ---------------- Herz aus Perlen ------------------------------------ */
    if (stil === 'herzperlen') {
      const R = Math.min(w, h) * 0.52;
      const cv = document.createElement('canvas');
      cv.width = cv.height = Math.ceil(R * 2.9 + pad * 2);
      const c = cv.getContext('2d');
      const cx = cv.width / 2, cy = cv.height / 2 - R * 0.06;
      /* Foto herzförmig geclippt */
      c.save();
      herz(c, cx, cy, R);
      c.clip();
      const sc = Math.max((R * 2.5) / srcCanvas.width, (R * 2.2) / srcCanvas.height);
      c.drawImage(srcCanvas, cx - srcCanvas.width * sc / 2, cy - srcCanvas.height * sc / 2 - R * 0.05,
        srcCanvas.width * sc, srcCanvas.height * sc);
      c.restore();
      /* Perlenkranz auf dem Herzumriss entlanglegen */
      const perle = (px2, py2, r2) => {
        const gg = c.createRadialGradient(px2 - r2 * 0.35, py2 - r2 * 0.35, r2 * 0.1, px2, py2, r2);
        gg.addColorStop(0, '#ffffff');
        gg.addColorStop(0.55, '#f3ebe4');
        gg.addColorStop(1, '#cfc0b4');
        c.fillStyle = gg;
        c.beginPath(); c.arc(px2, py2, r2, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,255,255,.9)';
        c.beginPath(); c.arc(px2 - r2 * 0.3, py2 - r2 * 0.35, r2 * 0.22, 0, TAU); c.fill();
      };
      /* Umriss abtasten und in gleichmäßigen Abständen Perlen setzen */
      const punkte = [];
      const N = 220;
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        /* die zwei Bezier-Hälften des Herzens parametrisch nachfahren */
        let px2, py2;
        if (t < 0.5) {
          const u = t * 2;
          px2 = bez(cx, cx - R * 1.24, cx - R * 0.96, cx, u);
          py2 = bez(cy + R * 0.9, cy + R * 0.15, cy - R * 0.86, cy - R * 0.36, u);
        } else {
          const u = (t - 0.5) * 2;
          px2 = bez(cx, cx + R * 0.96, cx + R * 1.24, cx, u);
          py2 = bez(cy - R * 0.36, cy - R * 0.86, cy + R * 0.15, cy + R * 0.9, u);
        }
        punkte.push([px2, py2]);
      }
      const pr = Math.max(4, R * 0.085);
      let dist = 0, letzter = punkte[0];
      perle(letzter[0], letzter[1], pr);
      for (const p of punkte) {
        dist += Math.hypot(p[0] - letzter[0], p[1] - letzter[1]);
        if (dist >= pr * 1.75) { perle(p[0], p[1], pr); dist = 0; }
        letzter = p;
      }
      return cv;
    }

    /* ---------------- Briefmarke mit Poststempel ------------------------- */
    if (stil === 'poststempel') {
      const b = Math.max(12, f.border || 16);
      const zack = b * 0.55;
      const cv = document.createElement('canvas');
      cv.width = Math.ceil(w + b * 2 + pad * 2);
      cv.height = Math.ceil(h + b * 2 + pad * 2);
      const c = cv.getContext('2d');
      const x = pad, y = pad, bw = w + b * 2, bh = h + b * 2;
      /* Wellenrand: Papier mit ausgestanzten Halbkreisen */
      c.fillStyle = f.color && f.color !== '#fdfbf8' ? f.color : '#f6f1e6';
      c.fillRect(x, y, bw, bh);
      c.save();
      c.globalCompositeOperation = 'destination-out';
      const schritt = zack * 2.1;
      for (let px2 = x + schritt / 2; px2 < x + bw; px2 += schritt) {
        c.beginPath(); c.arc(px2, y, zack * 0.6, 0, TAU); c.fill();
        c.beginPath(); c.arc(px2, y + bh, zack * 0.6, 0, TAU); c.fill();
      }
      for (let py2 = y + schritt / 2; py2 < y + bh; py2 += schritt) {
        c.beginPath(); c.arc(x, py2, zack * 0.6, 0, TAU); c.fill();
        c.beginPath(); c.arc(x + bw, py2, zack * 0.6, 0, TAU); c.fill();
      }
      c.restore();
      c.drawImage(srcCanvas, x + b, y + b, w, h);
      c.strokeStyle = 'rgba(90,80,66,.4)'; c.lineWidth = 1.5;
      c.strokeRect(x + b, y + b, w, h);
      /* Poststempel oben rechts, halb über dem Foto */
      const sx = x + bw * 0.82, sy = y + bh * 0.16, sr = Math.min(bw, bh) * 0.16;
      c.strokeStyle = 'rgba(70,62,52,.55)';
      c.lineWidth = Math.max(1.5, sr * 0.08);
      c.beginPath(); c.arc(sx, sy, sr, 0, TAU); c.stroke();
      c.beginPath(); c.arc(sx, sy, sr * 0.72, 0, TAU); c.stroke();
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.moveTo(sx - sr * 1.7, sy - sr * 0.35 + i * sr * 0.25);
        c.lineTo(sx - sr * 1.05, sy - sr * 0.35 + i * sr * 0.25);
        c.stroke();
      }
      return cv;
    }

    return alt.apply(this, arguments);
  };

  function bez(a, b2, c2, d, t) {
    const u = 1 - t;
    return u * u * u * a + 3 * u * u * t * b2 + 3 * u * t * t * c2 + t * t * t * d;
  }

  SS.RAHMEN76 = { bereit: true, neu: NEU.map(n => n.id), rahmen_gesamt: SS.FRAMES.length };
})();
