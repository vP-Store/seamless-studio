/* Seamless Studio – Sticker-Erweiterung (v4.1)

   Zwei neue Kategorien:
     🔮 Spirituell – Mondphasen, Mandalas, Chakren, Kristalle, Schutzsymbole …
     ✨ Effekte    – plastische Motive mit Verlauf, Glanzlicht und Schatten,
                     wie man sie aus Video-Apps kennt.

   Alles wird prozedural gezeichnet: kein Bild wird nachgeladen, die App
   bleibt offline-fähig und die Sticker lassen sich in jeder Größe und
   jeder Farbe verwenden, ohne unscharf zu werden. */

(function () {
  const TAU = Math.PI * 2;

  /* ---------- Werkzeuge für plastische Optik ---------- */

  // Farbe aufhellen / abdunkeln
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
  // Kugelverlauf: Licht von oben links
  function ball(c, x, y, r, col) {
    const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r);
    g.addColorStop(0, shade(col, 78));
    g.addColorStop(0.45, col);
    g.addColorStop(1, shade(col, -62));
    return g;
  }
  // weiches Glanzlicht
  function glanz(c, x, y, rx, ry, a) {
    c.save();
    const g = c.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
    g.addColorStop(0, `rgba(255,255,255,${a})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.beginPath(); c.ellipse(x, y, rx, ry, -0.5, 0, TAU); c.fill();
    c.restore();
  }
  // Schlagschatten unter einer Form
  function mitSchatten(c, s, fn, alpha) {
    c.save();
    c.shadowColor = `rgba(28,18,12,${alpha === undefined ? 0.34 : alpha})`;
    c.shadowBlur = s * 0.10;
    c.shadowOffsetY = s * 0.045;
    fn();
    c.restore();
  }
  const rnd = (seed) => {
    let x = seed;
    return () => { x = (x * 1103515245 + 12345) & 0x7fffffff; return x / 0x7fffffff; };
  };
  function stern(c, x, y, r, zacken, innen) {
    c.beginPath();
    for (let i = 0; i < zacken * 2; i++) {
      const a = -Math.PI / 2 + i * Math.PI / zacken;
      const rr = i % 2 ? r * innen : r;
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.closePath();
  }
  function polygon(c, x, y, r, n, dreh) {
    c.beginPath();
    for (let i = 0; i < n; i++) {
      const a = (dreh || 0) + i * TAU / n;
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.closePath();
  }

  /* ================================================================
     🔮 SPIRITUELL
     ================================================================ */

  function mondSichel(c, s, col, fuellung) {
    const r = s * 0.45;
    mitSchatten(c, s, () => {
      c.fillStyle = fuellung || ball(c, -r * 0.15, -r * 0.15, r, col);
      c.beginPath();
      c.arc(0, 0, r, Math.PI * 0.42, Math.PI * 1.58);
      c.arc(r * 0.42, 0, r * 0.86, Math.PI * 1.5, Math.PI * 0.5, true);
      c.closePath(); c.fill();
    });
    glanz(c, -r * 0.42, -r * 0.42, r * 0.3, r * 0.5, 0.5);
  }

  function vollmond(c, s, col) {
    const r = s * 0.45;
    mitSchatten(c, s, () => {
      c.fillStyle = ball(c, 0, 0, r, col);
      c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    });
    // Krater
    const R = rnd(7);
    c.save();
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip();
    for (let i = 0; i < 9; i++) {
      const a = R() * TAU, d = R() * r * 0.78;
      const kr = r * (0.06 + R() * 0.12);
      c.fillStyle = rgba(shade(col, -48), 0.35);
      c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d, kr, 0, TAU); c.fill();
      c.fillStyle = rgba(shade(col, 40), 0.22);
      c.beginPath(); c.arc(Math.cos(a) * d - kr * 0.2, Math.sin(a) * d - kr * 0.2, kr * 0.72, 0, TAU); c.fill();
    }
    c.restore();
    glanz(c, -r * 0.38, -r * 0.4, r * 0.34, r * 0.5, 0.45);
  }

  function halbmond(c, s, col) {
    const r = s * 0.45;
    mitSchatten(c, s, () => {
      c.fillStyle = ball(c, -r * 0.2, -r * 0.2, r, col);
      c.beginPath(); c.arc(0, 0, r, -Math.PI / 2, Math.PI / 2); c.lineTo(0, -r); c.closePath(); c.fill();
      c.strokeStyle = rgba(shade(col, -40), 0.6); c.lineWidth = s * 0.012;
      c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
    });
  }

  function mondphasen(c, s, col) {
    // Reihe aller acht Phasen, quer – ar 5
    const n = 8, r = s * 0.075, step = s / (n + 0.6);
    for (let i = 0; i < n; i++) {
      const x = -s * 0.5 + step * (i + 0.8);
      c.save(); c.translate(x, 0);
      c.strokeStyle = rgba(col, 0.55); c.lineWidth = s * 0.006;
      c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
      const p = i / n;                       // 0 = Neumond, 0,5 = Vollmond
      const k = Math.cos(p * TAU);           // 1 = dunkel, -1 = ganz hell
      c.fillStyle = col;
      c.beginPath();
      if (p <= 0.5) {                        // zunehmend: rechte Seite leuchtet
        c.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
        c.ellipse(0, 0, Math.abs(k) * r, r, 0, Math.PI / 2, -Math.PI / 2, k <= 0);
      } else {                               // abnehmend: linke Seite leuchtet
        c.arc(0, 0, r, Math.PI / 2, -Math.PI / 2, false);
        c.ellipse(0, 0, Math.abs(k) * r, r, 0, -Math.PI / 2, Math.PI / 2, k >= 0);
      }
      c.closePath(); c.fill();
      c.restore();
    }
  }

  function mandala(c, s, col, ringe, blatt) {
    const R = s * 0.47;
    c.save();
    c.strokeStyle = col; c.lineWidth = Math.max(1, s * 0.008);
    c.fillStyle = rgba(col, 0.14);
    for (let ring = 0; ring < ringe; ring++) {
      const rr = R * (0.32 + 0.68 * (ring + 1) / ringe);
      const n = 6 + ring * 6;
      for (let i = 0; i < n; i++) {
        const a = i * TAU / n + ring * 0.2;
        const x = Math.cos(a) * rr * 0.78, y = Math.sin(a) * rr * 0.78;
        c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2);
        if (blatt) {
          c.beginPath();
          c.moveTo(0, -rr * 0.2);
          c.quadraticCurveTo(rr * 0.13, 0, 0, rr * 0.2);
          c.quadraticCurveTo(-rr * 0.13, 0, 0, -rr * 0.2);
          c.fill(); c.stroke();
        } else {
          c.beginPath(); c.arc(0, 0, rr * 0.11, 0, TAU); c.fill(); c.stroke();
        }
        c.restore();
      }
      c.beginPath(); c.arc(0, 0, rr, 0, TAU); c.stroke();
    }
    c.fillStyle = col;
    c.beginPath(); c.arc(0, 0, R * 0.1, 0, TAU); c.fill();
    c.restore();
  }

  function blumeDesLebens(c, s, col) {
    const R = s * 0.44, r = R / 3;
    c.strokeStyle = col; c.lineWidth = Math.max(1, s * 0.009);
    c.save();
    c.beginPath(); c.arc(0, 0, R, 0, TAU); c.clip();
    const punkte = [[0, 0]];
    for (let ring = 1; ring <= 2; ring++) {
      for (let i = 0; i < 6 * ring; i++) {
        const a = i * TAU / (6 * ring);
        punkte.push([Math.cos(a) * r * ring, Math.sin(a) * r * ring]);
      }
    }
    for (const [x, y] of punkte) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); }
    c.restore();
    c.beginPath(); c.arc(0, 0, R, 0, TAU); c.stroke();
    c.lineWidth = Math.max(1, s * 0.014);
    c.beginPath(); c.arc(0, 0, R * 0.985, 0, TAU); c.stroke();
  }

  function metatron(c, s, col) {
    const R = s * 0.44, r = R * 0.5;
    const p = [[0, 0]];
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6 - Math.PI / 2; p.push([Math.cos(a) * r, Math.sin(a) * r]); }
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6 - Math.PI / 2; p.push([Math.cos(a) * R, Math.sin(a) * R]); }
    c.strokeStyle = rgba(col, 0.75); c.lineWidth = Math.max(0.8, s * 0.006);
    for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) {
      c.beginPath(); c.moveTo(p[i][0], p[i][1]); c.lineTo(p[j][0], p[j][1]); c.stroke();
    }
    c.fillStyle = col;
    for (const [x, y] of p) { c.beginPath(); c.arc(x, y, s * 0.018, 0, TAU); c.fill(); }
  }

  function sriYantra(c, s, col) {
    const R = s * 0.42;
    c.strokeStyle = col; c.lineWidth = Math.max(1, s * 0.008);
    for (let i = 0; i < 4; i++) {
      const k = 1 - i * 0.19;
      c.beginPath();
      c.moveTo(0, -R * k); c.lineTo(R * 0.87 * k, R * 0.5 * k); c.lineTo(-R * 0.87 * k, R * 0.5 * k);
      c.closePath(); c.stroke();
      c.beginPath();
      c.moveTo(0, R * k); c.lineTo(R * 0.87 * k, -R * 0.5 * k); c.lineTo(-R * 0.87 * k, -R * 0.5 * k);
      c.closePath(); c.stroke();
    }
    c.beginPath(); c.arc(0, 0, R * 1.06, 0, TAU); c.stroke();
    // Lotusblätter außen
    for (let i = 0; i < 16; i++) {
      const a = i * TAU / 16;
      c.save(); c.rotate(a); c.translate(0, -R * 1.16);
      c.beginPath(); c.moveTo(0, R * 0.1);
      c.quadraticCurveTo(R * 0.09, 0, 0, -R * 0.11);
      c.quadraticCurveTo(-R * 0.09, 0, 0, R * 0.1);
      c.stroke(); c.restore();
    }
  }

  function merkaba(c, s, col) {
    const R = s * 0.44;
    c.lineWidth = Math.max(1.2, s * 0.014);
    c.lineJoin = 'round';
    const dreieck = (start) => {
      c.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = start + i * TAU / 3;
        const x = Math.cos(a) * R, y = Math.sin(a) * R;
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.closePath();
    };
    // aufwärts gerichtet (Feuer)
    c.fillStyle = rgba(col, 0.15); c.strokeStyle = col;
    dreieck(-Math.PI / 2); c.fill(); c.stroke();
    // abwärts gerichtet (Wasser)
    c.fillStyle = rgba(shade(col, 60), 0.15); c.strokeStyle = shade(col, 40);
    dreieck(Math.PI / 2); c.fill(); c.stroke();
    // Tiefenlinien zur Mitte
    c.strokeStyle = rgba(col, 0.45); c.lineWidth = Math.max(0.8, s * 0.006);
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + i * TAU / 6;
      c.beginPath(); c.moveTo(0, 0);
      c.lineTo(Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5); c.stroke();
    }
  }

  function lotus(c, s, col, offen) {
    const R = s * 0.46;
    const blaetter = offen ? 9 : 5;
    mitSchatten(c, s, () => {
      for (let i = 0; i < blaetter; i++) {
        const t = (i / (blaetter - 1)) * 2 - 1;
        const a = t * (offen ? 1.15 : 0.55);
        const h = R * (1 - Math.abs(t) * 0.32);
        c.save();
        c.translate(0, R * 0.35);
        c.rotate(a);
        const g = c.createLinearGradient(0, 0, 0, -h);
        g.addColorStop(0, shade(col, -34));
        g.addColorStop(0.55, col);
        g.addColorStop(1, shade(col, 62));
        c.fillStyle = g;
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(R * 0.28, -h * 0.55, 0, -h);
        c.quadraticCurveTo(-R * 0.28, -h * 0.55, 0, 0);
        c.fill();
        c.strokeStyle = rgba(shade(col, -50), 0.35); c.lineWidth = s * 0.006; c.stroke();
        c.restore();
      }
    });
  }

  function chakraRad(c, s, col) {
    const R = s * 0.42;
    c.save();
    c.strokeStyle = col; c.lineWidth = Math.max(1, s * 0.012);
    c.beginPath(); c.arc(0, 0, R * 0.55, 0, TAU); c.stroke();
    for (let i = 0; i < 12; i++) {
      const a = i * TAU / 12;
      c.beginPath();
      c.moveTo(Math.cos(a) * R * 0.55, Math.sin(a) * R * 0.55);
      c.lineTo(Math.cos(a) * R, Math.sin(a) * R);
      c.stroke();
    }
    // Lotusblätter
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8 + 0.2;
      c.save(); c.rotate(a); c.translate(0, -R * 1.02);
      c.fillStyle = rgba(col, 0.35);
      c.beginPath(); c.moveTo(0, R * 0.16);
      c.quadraticCurveTo(R * 0.14, 0, 0, -R * 0.2);
      c.quadraticCurveTo(-R * 0.14, 0, 0, R * 0.16);
      c.fill(); c.stroke(); c.restore();
    }
    c.fillStyle = col;
    c.beginPath(); c.arc(0, 0, R * 0.12, 0, TAU); c.fill();
    c.restore();
  }

  const CHAKRA_FARBEN = ['#c0392b', '#e07b39', '#e8c33d', '#5aa469', '#4a90c2', '#4b4ba8', '#8e5aa8'];
  function chakraSaeule(c, s) {
    const h = s * 0.94, r = s * 0.085;
    for (let i = 0; i < 7; i++) {
      const y = -h / 2 + h * (i / 6);
      const col = CHAKRA_FARBEN[6 - i];
      mitSchatten(c, s, () => {
        c.fillStyle = ball(c, 0, y, r, col);
        c.beginPath(); c.arc(0, y, r, 0, TAU); c.fill();
      }, 0.22);
      c.save();
      c.globalAlpha = 0.35;
      c.strokeStyle = col; c.lineWidth = s * 0.008;
      c.beginPath(); c.arc(0, y, r * 1.5, 0, TAU); c.stroke();
      c.restore();
      glanz(c, -r * 0.3, y - r * 0.35, r * 0.4, r * 0.28, 0.55);
    }
  }

  function drittesAuge(c, s, col) {
    const w = s * 0.48, h = s * 0.3;
    mitSchatten(c, s, () => {
      c.fillStyle = '#fdf8f2';
      c.beginPath();
      c.moveTo(-w, 0);
      c.quadraticCurveTo(0, -h * 1.7, w, 0);
      c.quadraticCurveTo(0, h * 1.7, -w, 0);
      c.fill();
    });
    c.save();
    c.beginPath();
    c.moveTo(-w, 0); c.quadraticCurveTo(0, -h * 1.7, w, 0);
    c.quadraticCurveTo(0, h * 1.7, -w, 0); c.clip();
    c.fillStyle = ball(c, 0, 0, h * 0.95, col);
    c.beginPath(); c.arc(0, 0, h * 0.95, 0, TAU); c.fill();
    c.fillStyle = '#16110d';
    c.beginPath(); c.arc(0, 0, h * 0.44, 0, TAU); c.fill();
    glanz(c, -h * 0.32, -h * 0.35, h * 0.3, h * 0.24, 0.9);
    c.restore();
    c.strokeStyle = shade(col, -60); c.lineWidth = s * 0.014;
    c.beginPath();
    c.moveTo(-w, 0); c.quadraticCurveTo(0, -h * 1.7, w, 0);
    c.quadraticCurveTo(0, h * 1.7, -w, 0); c.stroke();
    // Strahlen
    c.strokeStyle = rgba(col, 0.8); c.lineWidth = s * 0.01;
    for (let i = -2; i <= 2; i++) {
      const a = -Math.PI / 2 + i * 0.34;
      c.beginPath();
      c.moveTo(Math.cos(a) * h * 1.35, Math.sin(a) * h * 1.35);
      c.lineTo(Math.cos(a) * h * 1.9, Math.sin(a) * h * 1.9);
      c.stroke();
    }
  }

  function nazar(c, s) {
    const r = s * 0.44;
    mitSchatten(c, s, () => {
      c.fillStyle = ball(c, 0, 0, r, '#1e5aa8');
      c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    });
    c.fillStyle = '#f4f7fb';
    c.beginPath(); c.arc(0, 0, r * 0.68, 0, TAU); c.fill();
    c.fillStyle = ball(c, 0, 0, r * 0.42, '#3d8fd6');
    c.beginPath(); c.arc(0, 0, r * 0.42, 0, TAU); c.fill();
    c.fillStyle = '#101828';
    c.beginPath(); c.arc(0, 0, r * 0.2, 0, TAU); c.fill();
    glanz(c, -r * 0.34, -r * 0.38, r * 0.28, r * 0.2, 0.95);
  }

  function hamsa(c, s, col) {
    const w = s * 0.36, h = s * 0.44;
    mitSchatten(c, s, () => {
      const g = c.createLinearGradient(0, -h, 0, h);
      g.addColorStop(0, shade(col, 55)); g.addColorStop(1, shade(col, -40));
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(-w, h * 0.2);
      c.quadraticCurveTo(-w * 1.5, -h * 0.35, -w * 0.85, -h * 0.5);
      c.quadraticCurveTo(-w * 0.55, -h * 0.62, -w * 0.5, -h * 0.2);
      c.lineTo(-w * 0.45, -h * 0.25);
      c.quadraticCurveTo(-w * 0.4, -h * 0.95, -w * 0.12, -h * 0.95);
      c.quadraticCurveTo(w * 0.06, -h * 0.95, w * 0.04, -h * 0.3);
      c.quadraticCurveTo(w * 0.2, -h * 0.98, w * 0.42, -h * 0.9);
      c.quadraticCurveTo(w * 0.62, -h * 0.8, w * 0.5, -h * 0.15);
      c.quadraticCurveTo(w * 0.9, -h * 0.5, w * 1.05, -h * 0.3);
      c.quadraticCurveTo(w * 1.2, -h * 0.1, w * 0.85, h * 0.35);
      c.quadraticCurveTo(w * 0.6, h, 0, h);
      c.quadraticCurveTo(-w * 0.75, h, -w, h * 0.2);
      c.fill();
    });
    // Auge in der Handfläche
    c.save(); c.translate(0, h * 0.18); c.scale(0.42, 0.42);
    drittesAuge(c, s, '#3d8fd6');
    c.restore();
  }

  function om(c, s, col) {
    const k = s * 0.01;
    c.save();
    c.translate(-s * 0.06, s * 0.05);
    c.strokeStyle = col;
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.lineWidth = s * 0.09;

    // obere Schleife – öffnet sich nach rechts
    c.beginPath();
    c.arc(-14 * k, -13 * k, 12 * k, Math.PI * 1.75, Math.PI * 0.62);
    c.stroke();

    // untere, größere Schleife – setzt darunter an
    c.beginPath();
    c.arc(-13 * k, 15 * k, 17 * k, Math.PI * 1.62, Math.PI * 0.75);
    c.stroke();

    // Verbindung zwischen den Schleifen
    c.beginPath();
    c.moveTo(-6 * k, -5 * k);
    c.bezierCurveTo(2 * k, -3 * k, 2 * k, 2 * k, -4 * k, 2 * k);
    c.stroke();

    // langer Schwung nach rechts
    c.beginPath();
    c.moveTo(-2 * k, -2 * k);
    c.bezierCurveTo(18 * k, -2 * k, 24 * k, 14 * k, 38 * k, 12 * k);
    c.bezierCurveTo(50 * k, 10 * k, 50 * k, -4 * k, 40 * k, -6 * k);
    c.stroke();

    // Mondsichel und Punkt darüber
    c.lineWidth = s * 0.062;
    c.beginPath();
    c.arc(30 * k, -30 * k, 14 * k, Math.PI * 0.14, Math.PI * 0.86);
    c.stroke();
    c.fillStyle = col;
    c.beginPath(); c.arc(30 * k, -49 * k, s * 0.052, 0, TAU); c.fill();
    c.restore();
  }

  function kristall(c, s, col, spitzen) {
    const R = rnd(19);
    const n = spitzen || 3;
    mitSchatten(c, s, () => {
      for (let i = 0; i < n; i++) {
        const bx = (i - (n - 1) / 2) * s * 0.24;
        const hh = s * (0.36 + R() * 0.36);
        const br = s * (0.07 + R() * 0.05);
        const neig = (i - (n - 1) / 2) * 0.14;
        c.save();
        c.translate(bx, s * 0.4);
        c.rotate(neig);
        // Körper
        const g = c.createLinearGradient(-br, 0, br, -hh);
        g.addColorStop(0, shade(col, -46));
        g.addColorStop(0.42, col);
        g.addColorStop(0.72, shade(col, 66));
        g.addColorStop(1, shade(col, 18));
        c.fillStyle = g;
        c.beginPath();
        c.moveTo(-br, 0); c.lineTo(-br, -hh * 0.66);
        c.lineTo(0, -hh); c.lineTo(br, -hh * 0.66); c.lineTo(br, 0);
        c.closePath(); c.fill();
        // Facette
        c.fillStyle = rgba('#ffffff', 0.28);
        c.beginPath();
        c.moveTo(-br * 0.15, 0); c.lineTo(-br * 0.15, -hh * 0.68);
        c.lineTo(0, -hh); c.lineTo(br * 0.3, -hh * 0.68); c.lineTo(br * 0.3, 0);
        c.closePath(); c.fill();
        c.strokeStyle = rgba(shade(col, -60), 0.5); c.lineWidth = s * 0.006;
        c.beginPath();
        c.moveTo(-br, 0); c.lineTo(-br, -hh * 0.66); c.lineTo(0, -hh);
        c.lineTo(br, -hh * 0.66); c.lineTo(br, 0); c.closePath(); c.stroke();
        c.beginPath(); c.moveTo(-br, -hh * 0.66); c.lineTo(br, -hh * 0.66); c.stroke();
        c.restore();
      }
    });
  }

  function kristallkugel(c, s, col) {
    const r = s * 0.36;
    // Ständer
    mitSchatten(c, s, () => {
      c.fillStyle = '#7a5a3a';
      c.beginPath();
      c.moveTo(-s * 0.22, s * 0.46); c.lineTo(s * 0.22, s * 0.46);
      c.lineTo(s * 0.13, s * 0.3); c.lineTo(-s * 0.13, s * 0.3);
      c.closePath(); c.fill();
    });
    const g = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.05, 0, -s * 0.05, r);
    g.addColorStop(0, 'rgba(255,255,255,.95)');
    g.addColorStop(0.4, rgba(col, 0.75));
    g.addColorStop(1, rgba(shade(col, -55), 0.9));
    mitSchatten(c, s, () => {
      c.fillStyle = g;
      c.beginPath(); c.arc(0, -s * 0.05, r, 0, TAU); c.fill();
    });
    // Sternchen innen
    c.save();
    c.beginPath(); c.arc(0, -s * 0.05, r, 0, TAU); c.clip();
    c.fillStyle = 'rgba(255,255,255,.85)';
    const R = rnd(31);
    for (let i = 0; i < 7; i++) {
      SS.drawTwinklePath(c, (R() - 0.5) * r * 1.4, -s * 0.05 + (R() - 0.5) * r * 1.4, r * (0.06 + R() * 0.09));
      c.fill();
    }
    c.restore();
    glanz(c, -r * 0.4, -s * 0.05 - r * 0.45, r * 0.3, r * 0.2, 0.95);
  }

  function feder(c, s, col) {
    c.save();
    c.rotate(-0.22);
    const h = s * 0.92;
    const yU = h * 0.5;                            // unten (Kielende)
    const achse = t => ({ x: s * 0.06 * Math.sin(Math.PI * t), y: yU - t * h });
    // Breite der Fahne: unten nackter Kiel, dann Bauch, oben spitz
    const breite = t => {
      if (t < 0.24) return 0;
      const u = (t - 0.24) / 0.76;
      return s * 0.185 * Math.sin(Math.PI * Math.pow(u, 0.55)) * (1 - u * 0.08);
    };

    // Fahne als gefüllte Fläche, beide Hälften getrennt
    for (const seite of [-1, 1]) {
      c.beginPath();
      const N = 40;
      for (let i = 0; i <= N; i++) {
        const t = 0.24 + (i / N) * 0.76;
        const a = achse(t);
        if (i === 0) c.moveTo(a.x, a.y); else c.lineTo(a.x, a.y);
      }
      for (let i = N; i >= 0; i--) {
        const t = 0.24 + (i / N) * 0.76;
        const a = achse(t);
        const w = breite(t) * (1 + 0.09 * Math.sin(t * 24 + (seite > 0 ? 0 : 1.7)));
        c.lineTo(a.x + seite * w, a.y - w * 0.30);
      }
      c.closePath();
      const g = c.createLinearGradient(-s * 0.3, 0, s * 0.3, 0);
      g.addColorStop(0, shade(col, seite > 0 ? 2 : 34));
      g.addColorStop(0.5, shade(col, 52));
      g.addColorStop(1, shade(col, seite > 0 ? 34 : 2));
      c.fillStyle = g;
      c.globalAlpha = seite > 0 ? 1 : 0.94;
      c.fill();
      c.globalAlpha = 1;
    }

    // feine Federäste auf der Fahne
    c.lineCap = 'round';
    for (const seite of [-1, 1]) {
      for (let i = 0; i < 30; i++) {
        const t = 0.27 + (i / 29) * 0.71;
        const a = achse(t);
        const w = breite(t);
        if (w <= 0) continue;
        c.strokeStyle = rgba(shade(col, -20), 0.30);
        c.lineWidth = s * 0.006;
        c.beginPath();
        c.moveTo(a.x, a.y);
        c.quadraticCurveTo(a.x + seite * w * 0.55, a.y - w * 0.06, a.x + seite * w, a.y - w * 0.30);
        c.stroke();
      }
    }

    // flauschige Dunen unten am Kiel
    for (const seite of [-1, 1]) {
      for (let i = 0; i < 9; i++) {
        const t = 0.13 + (i / 8) * 0.13;
        const a = achse(t);
        const l = s * (0.03 + 0.09 * (i / 8));
        c.strokeStyle = rgba(shade(col, 55), 0.34);
        c.lineWidth = s * 0.006;
        c.beginPath();
        c.moveTo(a.x, a.y);
        c.quadraticCurveTo(a.x + seite * l * 0.5, a.y - l * 0.25, a.x + seite * l, a.y - l * 0.85);
        c.stroke();
      }
    }

    // Kiel durchgehend, unten deutlich sichtbar
    const a0 = achse(0), a1 = achse(0.5), a2 = achse(1);
    c.strokeStyle = shade(col, -38);
    c.lineWidth = s * 0.022; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(a0.x, a0.y); c.quadraticCurveTo(a1.x + s * 0.04, a1.y, a2.x, a2.y);
    c.stroke();
    c.strokeStyle = rgba('#ffffff', 0.35);
    c.lineWidth = s * 0.007;
    c.beginPath();
    c.moveTo(a0.x - s * 0.004, a0.y); c.quadraticCurveTo(a1.x + s * 0.036, a1.y, a2.x, a2.y);
    c.stroke();
    c.restore();
  }

  function engelsfluegel(c, s, col) {
    // drei Federreihen je Flügel, von hinten nach vorne
    for (const seite of [-1, 1]) {
      c.save();
      c.scale(seite, 1);
      for (let reihe = 0; reihe < 3; reihe++) {
        const n = 5 + reihe * 2;
        const laenge = s * (0.46 - reihe * 0.1);
        const hoch = s * (0.34 - reihe * 0.08);
        for (let i = 0; i < n; i++) {
          const t = i / (n - 1);
          const a = -1.15 + t * 1.55;                 // Fächer nach außen unten
          const l = laenge * (0.55 + 0.45 * Math.sin(Math.PI * (0.25 + t * 0.7)));
          c.save();
          c.translate(s * 0.03, -hoch + reihe * s * 0.05);
          c.rotate(a);
          const g = c.createLinearGradient(0, 0, 0, l);
          g.addColorStop(0, '#ffffff');
          g.addColorStop(0.6, shade(col, 46));
          g.addColorStop(1, shade(col, 8));
          c.fillStyle = g;
          c.beginPath();
          c.moveTo(0, 0);
          c.quadraticCurveTo(l * 0.22, l * 0.5, 0, l);
          c.quadraticCurveTo(-l * 0.14, l * 0.5, 0, 0);
          c.fill();
          c.strokeStyle = rgba(shade(col, -35), 0.3);
          c.lineWidth = s * 0.004;
          c.stroke();
          c.restore();
        }
      }
      c.restore();
    }
  }

  function triquetra(c, s, col) {
    const R = s * 0.3;
    c.strokeStyle = col; c.lineWidth = s * 0.045; c.lineJoin = 'round';
    for (let i = 0; i < 3; i++) {
      c.save(); c.rotate(i * TAU / 3);
      c.beginPath(); c.arc(0, -R * 0.62, R, Math.PI * 0.18, Math.PI * 0.82);
      c.stroke(); c.restore();
    }
    c.lineWidth = s * 0.016;
    c.beginPath(); c.arc(0, 0, R * 1.16, 0, TAU); c.stroke();
  }

  function pentagramm(c, s, col) {
    const R = s * 0.42;
    c.strokeStyle = col; c.lineWidth = s * 0.028; c.lineJoin = 'round';
    c.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * 2 * TAU / 5;
      const x = Math.cos(a) * R, y = Math.sin(a) * R;
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.closePath(); c.stroke();
    c.lineWidth = s * 0.018;
    c.beginPath(); c.arc(0, 0, R * 1.1, 0, TAU); c.stroke();
  }

  function baumDesLebens(c, s, col) {
    const R = s * 0.44;
    c.save();
    c.strokeStyle = col; c.lineWidth = s * 0.02; c.lineCap = 'round';
    // Stamm und Wurzeln
    c.beginPath(); c.moveTo(0, R * 0.9); c.lineTo(0, 0); c.stroke();
    const ast = (x, y, len, a, tiefe) => {
      if (tiefe === 0) return;
      const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
      c.lineWidth = s * 0.02 * (tiefe / 4);
      c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke();
      ast(x2, y2, len * 0.72, a - 0.5, tiefe - 1);
      ast(x2, y2, len * 0.72, a + 0.5, tiefe - 1);
    };
    ast(0, 0, R * 0.42, -Math.PI / 2, 4);
    ast(0, R * 0.9, R * 0.3, Math.PI / 2 - 0.6, 3);
    ast(0, R * 0.9, R * 0.3, Math.PI / 2 + 0.6, 3);
    c.lineWidth = s * 0.016;
    c.beginPath(); c.arc(0, R * 0.1, R, 0, TAU); c.stroke();
    c.restore();
  }

  function raeucherbuendel(c, s, col) {
    c.save();
    c.rotate(0.2);
    mitSchatten(c, s, () => {
      const g = c.createLinearGradient(-s * 0.1, 0, s * 0.1, 0);
      g.addColorStop(0, shade(col, -30)); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, -45));
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(-s * 0.09, s * 0.4); c.lineTo(s * 0.09, s * 0.4);
      c.lineTo(s * 0.07, -s * 0.24); c.lineTo(-s * 0.07, -s * 0.24);
      c.closePath(); c.fill();
    });
    // Schnur
    c.strokeStyle = '#b8452f'; c.lineWidth = s * 0.018;
    for (let i = 0; i < 4; i++) {
      const y = s * (0.3 - i * 0.15);
      c.beginPath(); c.moveTo(-s * 0.085, y); c.lineTo(s * 0.085, y - s * 0.03); c.stroke();
    }
    // Blätterspitze
    c.fillStyle = shade(col, 24);
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.32;
      c.save(); c.translate(0, -s * 0.24); c.rotate(a + Math.PI / 2);
      c.beginPath(); c.ellipse(0, -s * 0.11, s * 0.035, s * 0.12, 0, 0, TAU); c.fill();
      c.restore();
    }
    // Rauch
    c.strokeStyle = 'rgba(220,215,210,.65)'; c.lineWidth = s * 0.012; c.lineCap = 'round';
    for (let k = 0; k < 2; k++) {
      c.beginPath();
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const x = Math.sin(t * 6 + k * 2) * s * 0.07 * t;
        const y = -s * 0.36 - t * s * 0.42;
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
    }
    c.restore();
  }

  function kerzeAura(c, s, col) {
    // Aura
    const g = c.createRadialGradient(0, -s * 0.3, 0, 0, -s * 0.3, s * 0.42);
    g.addColorStop(0, rgba(col, 0.55)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g;
    c.beginPath(); c.arc(0, -s * 0.3, s * 0.42, 0, TAU); c.fill();
    // Körper
    mitSchatten(c, s, () => {
      const bg = c.createLinearGradient(-s * 0.14, 0, s * 0.14, 0);
      bg.addColorStop(0, '#e8ddcb'); bg.addColorStop(0.45, '#fdf7ec'); bg.addColorStop(1, '#d6c8b2');
      c.fillStyle = bg;
      c.beginPath();
      c.moveTo(-s * 0.14, s * 0.44); c.lineTo(s * 0.14, s * 0.44);
      c.lineTo(s * 0.14, -s * 0.16); c.lineTo(-s * 0.14, -s * 0.16); c.closePath(); c.fill();
      c.fillStyle = '#f3ecdd';
      c.beginPath(); c.ellipse(0, -s * 0.16, s * 0.14, s * 0.045, 0, 0, TAU); c.fill();
    });
    // Docht und Flamme
    c.strokeStyle = '#3a2a1c'; c.lineWidth = s * 0.014;
    c.beginPath(); c.moveTo(0, -s * 0.17); c.lineTo(0, -s * 0.24); c.stroke();
    const fg = c.createRadialGradient(0, -s * 0.3, 0, 0, -s * 0.3, s * 0.12);
    fg.addColorStop(0, '#fff9e0'); fg.addColorStop(0.45, '#ffcf5c'); fg.addColorStop(1, 'rgba(255,140,40,0)');
    c.fillStyle = fg;
    c.beginPath(); c.ellipse(0, -s * 0.3, s * 0.075, s * 0.13, 0, 0, TAU); c.fill();
  }

  function traumfaenger(c, s, col) {
    const R = s * 0.32;
    c.save();
    c.translate(0, -s * 0.12);
    c.strokeStyle = col; c.lineWidth = s * 0.022;
    c.beginPath(); c.arc(0, 0, R, 0, TAU); c.stroke();
    // Netz
    c.lineWidth = s * 0.007;
    c.strokeStyle = rgba(col, 0.75);
    const n = 10;
    let punkte = [];
    for (let i = 0; i < n; i++) { const a = i * TAU / n; punkte.push([Math.cos(a) * R, Math.sin(a) * R]); }
    for (let ring = 0; ring < 3; ring++) {
      const naechste = [];
      for (let i = 0; i < punkte.length; i++) {
        const p = punkte[i], q = punkte[(i + 1) % punkte.length];
        c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke();
        naechste.push([(p[0] + q[0]) / 2 * 0.72, (p[1] + q[1]) / 2 * 0.72]);
      }
      punkte = naechste;
    }
    c.fillStyle = col;
    c.beginPath(); c.arc(0, 0, s * 0.02, 0, TAU); c.fill();
    // Federn
    c.restore();
    for (const [dx, len] of [[-R * 0.6, 0.3], [0, 0.42], [R * 0.6, 0.3]]) {
      c.save();
      c.translate(dx, R - s * 0.12);
      c.strokeStyle = rgba(col, 0.8); c.lineWidth = s * 0.008;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(0, s * len * 0.5); c.stroke();
      c.translate(0, s * len * 0.5 + s * 0.1);
      c.scale(0.28, 0.28);
      feder(c, s, col);
      c.restore();
    }
  }

  function sternbild(c, s, col) {
    const R = rnd(23);
    const pts = [];
    for (let i = 0; i < 7; i++) pts.push([(R() - 0.5) * s * 0.85, (R() - 0.5) * s * 0.8]);
    c.strokeStyle = rgba(col, 0.55); c.lineWidth = s * 0.008;
    c.beginPath();
    pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]));
    c.stroke();
    for (const [x, y] of pts) {
      c.fillStyle = col;
      SS.drawTwinklePath(c, x, y, s * 0.05); c.fill();
      c.fillStyle = 'rgba(255,255,255,.85)';
      c.beginPath(); c.arc(x, y, s * 0.011, 0, TAU); c.fill();
    }
  }

  function auraKreis(c, s, col) {
    for (let i = 4; i >= 1; i--) {
      const r = s * 0.1 * i;
      const g = c.createRadialGradient(0, 0, r * 0.55, 0, 0, r);
      g.addColorStop(0, rgba(col, 0));
      g.addColorStop(0.75, rgba(col, 0.3 - i * 0.04));
      g.addColorStop(1, rgba(col, 0));
      c.fillStyle = g;
      c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    }
    c.fillStyle = ball(c, 0, 0, s * 0.1, col);
    c.beginPath(); c.arc(0, 0, s * 0.1, 0, TAU); c.fill();
    glanz(c, -s * 0.035, -s * 0.04, s * 0.04, s * 0.03, 0.9);
  }

  function sonneMond(c, s, col) {
    const r = s * 0.34;
    // Strahlen
    c.strokeStyle = rgba(col, 0.85); c.lineWidth = s * 0.016; c.lineCap = 'round';
    for (let i = 0; i < 16; i++) {
      const a = i * TAU / 16;
      const l = i % 2 ? 0.12 : 0.2;
      c.beginPath();
      c.moveTo(Math.cos(a) * r * 1.12, Math.sin(a) * r * 1.12);
      c.lineTo(Math.cos(a) * r * (1.12 + l), Math.sin(a) * r * (1.12 + l));
      c.stroke();
    }
    mitSchatten(c, s, () => {
      c.fillStyle = ball(c, 0, 0, r, col);
      c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    });
    // Mondsichel innen
    c.save();
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip();
    c.fillStyle = rgba(shade(col, -70), 0.55);
    c.beginPath();
    c.arc(r * 0.22, 0, r * 0.86, 0, TAU);
    c.fill();
    c.restore();
    glanz(c, -r * 0.36, -r * 0.4, r * 0.28, r * 0.2, 0.6);
  }

  function unendlich(c, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.055; c.lineCap = 'round';
    const r = s * 0.19;
    c.beginPath();
    c.moveTo(0, 0);
    c.bezierCurveTo(-r, -r * 1.5, -r * 2.4, -r * 1.5, -r * 2.4, 0);
    c.bezierCurveTo(-r * 2.4, r * 1.5, -r, r * 1.5, 0, 0);
    c.bezierCurveTo(r, -r * 1.5, r * 2.4, -r * 1.5, r * 2.4, 0);
    c.bezierCurveTo(r * 2.4, r * 1.5, r, r * 1.5, 0, 0);
    c.stroke();
  }

  /* ================================================================
     ✨ EFFEKTE – plastisch, mit Verlauf und Glanz
     ================================================================ */

  function glanzHerz(c, s, col) {
    mitSchatten(c, s, () => {
      const g = c.createLinearGradient(-s * 0.3, -s * 0.35, s * 0.25, s * 0.4);
      g.addColorStop(0, shade(col, 80)); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, -55));
      c.fillStyle = g;
      SS.drawHeartPath(c, 0, 0, s * 0.46); c.fill();
    });
    c.save();
    SS.drawHeartPath(c, 0, 0, s * 0.46); c.clip();
    glanz(c, -s * 0.13, -s * 0.17, s * 0.14, s * 0.09, 0.95);
    glanz(c, s * 0.1, -s * 0.1, s * 0.07, s * 0.05, 0.7);
    c.restore();
  }

  function glanzStern(c, s, col) {
    mitSchatten(c, s, () => {
      const g = c.createLinearGradient(0, -s * 0.45, 0, s * 0.45);
      g.addColorStop(0, shade(col, 85)); g.addColorStop(0.55, col); g.addColorStop(1, shade(col, -50));
      c.fillStyle = g;
      stern(c, 0, 0, s * 0.46, 5, 0.44); c.fill();
    });
    c.save(); stern(c, 0, 0, s * 0.46, 5, 0.44); c.clip();
    glanz(c, -s * 0.1, -s * 0.16, s * 0.12, s * 0.08, 0.9);
    c.restore();
  }

  function blase(c, s, col) {
    const r = s * 0.44;
    const g = c.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.05, 0, 0, r);
    g.addColorStop(0, 'rgba(255,255,255,.85)');
    g.addColorStop(0.35, rgba(col, 0.28));
    g.addColorStop(0.82, rgba(col, 0.42));
    g.addColorStop(1, 'rgba(255,255,255,.55)');
    c.fillStyle = g;
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = s * 0.01;
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
    glanz(c, -r * 0.38, -r * 0.42, r * 0.26, r * 0.16, 1);
    glanz(c, r * 0.3, r * 0.35, r * 0.14, r * 0.09, 0.5);
  }

  function lichtstrahl(c, s, col) {
    const g = c.createLinearGradient(0, -s * 0.5, 0, s * 0.5);
    g.addColorStop(0, rgba(col, 0));
    g.addColorStop(0.45, rgba(col, 0.55));
    g.addColorStop(0.5, rgba('#ffffff', 0.85));
    g.addColorStop(0.55, rgba(col, 0.55));
    g.addColorStop(1, rgba(col, 0));
    c.save();
    c.rotate(-0.5);
    c.fillStyle = g;
    c.fillRect(-s * 0.5, -s * 0.5, s, s);
    c.restore();
  }

  function linsenreflex(c, s, col) {
    const R = rnd(41);
    for (let i = 0; i < 7; i++) {
      const t = (i / 6) - 0.5;
      const x = t * s * 0.8, y = -t * s * 0.5;
      const r = s * (0.03 + R() * 0.09);
      c.fillStyle = rgba(i % 2 ? col : '#ffffff', 0.16 + R() * 0.2);
      c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    }
    const g = c.createRadialGradient(0, 0, 0, 0, 0, s * 0.3);
    g.addColorStop(0, 'rgba(255,255,255,.9)');
    g.addColorStop(0.3, rgba(col, 0.45));
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(0, 0, s * 0.3, 0, TAU); c.fill();
    c.strokeStyle = rgba('#ffffff', 0.55); c.lineWidth = s * 0.006;
    for (let i = 0; i < 6; i++) {
      const a = i * TAU / 6;
      c.beginPath();
      c.moveTo(Math.cos(a) * s * 0.08, Math.sin(a) * s * 0.08);
      c.lineTo(Math.cos(a) * s * 0.46, Math.sin(a) * s * 0.46);
      c.stroke();
    }
  }

  function glitzerStreu(c, s, col) {
    const R = rnd(53);
    for (let i = 0; i < 34; i++) {
      const x = (R() - 0.5) * s, y = (R() - 0.5) * s;
      const r = s * (0.012 + R() * 0.045);
      c.globalAlpha = 0.35 + R() * 0.65;
      c.fillStyle = R() > 0.55 ? '#ffffff' : col;
      SS.drawTwinklePath(c, x, y, r); c.fill();
    }
    c.globalAlpha = 1;
  }

  function bokeh(c, s, col) {
    const R = rnd(67);
    for (let i = 0; i < 14; i++) {
      const x = (R() - 0.5) * s, y = (R() - 0.5) * s;
      const r = s * (0.04 + R() * 0.13);
      const g = c.createRadialGradient(x, y, r * 0.2, x, y, r);
      g.addColorStop(0, rgba(i % 3 ? col : '#ffffff', 0.42));
      g.addColorStop(0.7, rgba(col, 0.16));
      g.addColorStop(1, rgba(col, 0));
      c.fillStyle = g;
      c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    }
  }

  function rauch(c, s, col) {
    c.save();
    c.globalAlpha = 0.5;
    const R = rnd(71);
    for (let k = 0; k < 3; k++) {
      c.strokeStyle = rgba(col, 0.3 + k * 0.12);
      c.lineWidth = s * (0.05 + k * 0.03);
      c.lineCap = 'round';
      c.beginPath();
      for (let i = 0; i <= 26; i++) {
        const t = i / 26;
        const x = Math.sin(t * 5.5 + k * 1.7) * s * 0.2 * (0.35 + t);
        const y = s * 0.46 - t * s * 0.92;
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
    }
    void R;
    c.restore();
  }

  function neonRahmen(c, s, col) {
    const r = s * 0.42;
    c.save();
    c.shadowColor = col; c.shadowBlur = s * 0.16;
    c.strokeStyle = col; c.lineWidth = s * 0.03;
    c.beginPath();
    const rr = s * 0.1;
    c.moveTo(-r + rr, -r);
    c.arcTo(r, -r, r, r, rr); c.arcTo(r, r, -r, r, rr);
    c.arcTo(-r, r, -r, -r, rr); c.arcTo(-r, -r, r, -r, rr);
    c.closePath();
    c.stroke(); c.stroke();
    c.shadowBlur = s * 0.05; c.strokeStyle = '#ffffff'; c.lineWidth = s * 0.01;
    c.stroke();
    c.restore();
  }

  function neonHerz(c, s, col) {
    c.save();
    c.shadowColor = col; c.shadowBlur = s * 0.18;
    c.strokeStyle = col; c.lineWidth = s * 0.045; c.lineJoin = 'round';
    SS.drawHeartPath(c, 0, 0, s * 0.42); c.stroke(); c.stroke();
    c.shadowBlur = s * 0.06; c.strokeStyle = '#fff'; c.lineWidth = s * 0.014;
    SS.drawHeartPath(c, 0, 0, s * 0.42); c.stroke();
    c.restore();
  }

  function neonStern(c, s, col) {
    c.save();
    c.shadowColor = col; c.shadowBlur = s * 0.18;
    c.strokeStyle = col; c.lineWidth = s * 0.04; c.lineJoin = 'round';
    stern(c, 0, 0, s * 0.42, 5, 0.45); c.stroke(); c.stroke();
    c.shadowBlur = s * 0.05; c.strokeStyle = '#fff'; c.lineWidth = s * 0.012;
    stern(c, 0, 0, s * 0.42, 5, 0.45); c.stroke();
    c.restore();
  }

  function verlaufsBlob(c, s, col) {
    const R = rnd(83);
    mitSchatten(c, s, () => {
      const g = c.createLinearGradient(-s * 0.4, -s * 0.4, s * 0.4, s * 0.4);
      g.addColorStop(0, shade(col, 70)); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, -45));
      c.fillStyle = g;
      c.beginPath();
      const n = 8;
      const pts = [];
      for (let i = 0; i < n; i++) {
        const a = i * TAU / n;
        const r = s * (0.3 + R() * 0.16);
        pts.push([Math.cos(a) * r, Math.sin(a) * r]);
      }
      c.moveTo((pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2);
      for (let i = 0; i < n; i++) {
        const p = pts[i], q = pts[(i + 1) % n];
        c.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
      }
      c.closePath(); c.fill();
    });
    glanz(c, -s * 0.13, -s * 0.16, s * 0.12, s * 0.07, 0.7);
  }

  function perlenkette(c, s, col) {
    const n = 9;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const x = -s * 0.46 + t * s * 0.92;
      const y = Math.sin(t * Math.PI) * s * 0.1;
      const r = s * 0.055;
      mitSchatten(c, s, () => {
        c.fillStyle = ball(c, x, y, r, col);
        c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      }, 0.2);
      glanz(c, x - r * 0.3, y - r * 0.35, r * 0.35, r * 0.24, 0.85);
    }
  }

  function goldband(c, s, col) {
    const g = c.createLinearGradient(0, -s * 0.08, 0, s * 0.08);
    ['#8c6a2f', '#e8cf96', '#f6e7b8', '#c9a15f', '#8c6a2f'].forEach((cc, i) => g.addColorStop(i / 4, cc));
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-s * 0.5, -s * 0.05);
    for (let i = 0; i <= 40; i++) {
      const t = i / 40, x = -s * 0.5 + t * s;
      c.lineTo(x, Math.sin(t * Math.PI * 2) * s * 0.06 - s * 0.05);
    }
    for (let i = 40; i >= 0; i--) {
      const t = i / 40, x = -s * 0.5 + t * s;
      c.lineTo(x, Math.sin(t * Math.PI * 2) * s * 0.06 + s * 0.05);
    }
    c.closePath(); c.fill();
    void col;
  }

  function schleife3d(c, s, col) {
    const g1 = c.createLinearGradient(-s * 0.3, 0, 0, 0);
    g1.addColorStop(0, shade(col, -40)); g1.addColorStop(1, shade(col, 55));
    mitSchatten(c, s, () => {
      for (const seite of [-1, 1]) {
        c.save(); c.scale(seite, 1);
        c.fillStyle = g1;
        c.beginPath();
        c.moveTo(0, 0);
        c.bezierCurveTo(-s * 0.14, -s * 0.34, -s * 0.46, -s * 0.28, -s * 0.4, -s * 0.05);
        c.bezierCurveTo(-s * 0.36, s * 0.14, -s * 0.12, s * 0.12, 0, 0);
        c.fill();
        c.restore();
      }
      c.fillStyle = shade(col, 25);
      c.beginPath(); c.ellipse(0, 0, s * 0.09, s * 0.075, 0, 0, TAU); c.fill();
      // Bänder
      c.fillStyle = shade(col, -12);
      for (const seite of [-1, 1]) {
        c.save(); c.scale(seite, 1);
        c.beginPath();
        c.moveTo(0, s * 0.03);
        c.quadraticCurveTo(s * 0.14, s * 0.24, s * 0.24, s * 0.42);
        c.lineTo(s * 0.13, s * 0.4);
        c.quadraticCurveTo(s * 0.07, s * 0.2, 0, s * 0.06);
        c.fill(); c.restore();
      }
    });
    glanz(c, -s * 0.2, -s * 0.14, s * 0.09, s * 0.05, 0.7);
  }

  function stickerRahmen(c, s, col) {
    // weißer Sticker-Rand wie in Video-Apps
    c.save();
    mitSchatten(c, s, () => {
      c.fillStyle = '#ffffff';
      c.beginPath();
      const n = 22, R = s * 0.46;
      for (let i = 0; i < n; i++) {
        const a = i * TAU / n;
        const r = R * (i % 2 ? 0.94 : 1);
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.closePath(); c.fill();
    });
    c.fillStyle = ball(c, 0, 0, s * 0.36, col);
    c.beginPath(); c.arc(0, 0, s * 0.36, 0, TAU); c.fill();
    glanz(c, -s * 0.12, -s * 0.14, s * 0.11, s * 0.07, 0.7);
    c.restore();
  }

  function funken(c, s, col) {
    const R = rnd(97);
    c.strokeStyle = col; c.lineCap = 'round';
    for (let i = 0; i < 18; i++) {
      const a = R() * TAU, d = s * (0.1 + R() * 0.4);
      const len = s * (0.03 + R() * 0.09);
      c.globalAlpha = 0.4 + R() * 0.6;
      c.lineWidth = s * (0.006 + R() * 0.01);
      c.beginPath();
      c.moveTo(Math.cos(a) * d, Math.sin(a) * d);
      c.lineTo(Math.cos(a) * (d + len), Math.sin(a) * (d + len));
      c.stroke();
    }
    c.globalAlpha = 1;
    const g = c.createRadialGradient(0, 0, 0, 0, 0, s * 0.16);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, rgba(col, 0.7)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g;
    c.beginPath(); c.arc(0, 0, s * 0.16, 0, TAU); c.fill();
  }

  function farbklecks(c, s, col) {
    const R = rnd(101);
    for (let k = 3; k >= 1; k--) {
      c.globalAlpha = 0.22 * k;
      c.fillStyle = col;
      c.beginPath();
      const n = 11;
      for (let i = 0; i < n; i++) {
        const a = i * TAU / n;
        const r = s * (0.16 + R() * 0.1) * k * 0.9;
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.closePath(); c.fill();
    }
    c.globalAlpha = 1;
  }

  function marmorKugel(c, s, col) {
    const r = s * 0.44;
    mitSchatten(c, s, () => {
      c.fillStyle = ball(c, 0, 0, r, col);
      c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    });
    c.save();
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip();
    const R = rnd(113);
    c.strokeStyle = rgba('#ffffff', 0.4);
    for (let i = 0; i < 6; i++) {
      c.lineWidth = s * (0.004 + R() * 0.012);
      c.beginPath();
      let x = -r, y = (R() - 0.5) * r * 1.6;
      c.moveTo(x, y);
      for (let k = 0; k < 6; k++) {
        x += r / 3; y += (R() - 0.5) * r * 0.5;
        c.lineTo(x, y);
      }
      c.stroke();
    }
    c.restore();
    glanz(c, -r * 0.38, -r * 0.4, r * 0.28, r * 0.18, 0.85);
  }

  /* ================================================================
     Registrierung
     ================================================================ */
  const NEU = [
    // ---- 🔮 Spirituell ----
    { id: 'sp-mond',       cat: 'spirit', name: 'Mondsichel',      anim: 'glow',        draw: (c, s, col) => mondSichel(c, s, col) },
    { id: 'sp-vollmond',   cat: 'spirit', name: 'Vollmond',        anim: 'breathe',     draw: vollmond },
    { id: 'sp-halbmond',   cat: 'spirit', name: 'Halbmond',        draw: halbmond },
    { id: 'sp-phasen',     cat: 'spirit', name: 'Mondphasen', ar: 5, draw: mondphasen },
    { id: 'sp-sonnemond',  cat: 'spirit', name: 'Sonne & Mond',    anim: 'spin-slow',   draw: sonneMond },
    { id: 'sp-mandala1',   cat: 'spirit', name: 'Mandala',         anim: 'spin-slow',   draw: (c, s, col) => mandala(c, s, col, 3, true) },
    { id: 'sp-mandala2',   cat: 'spirit', name: 'Mandala fein',    anim: 'spin-slow',   draw: (c, s, col) => mandala(c, s, col, 4, false) },
    { id: 'sp-blume',      cat: 'spirit', name: 'Blume des Lebens', draw: blumeDesLebens },
    { id: 'sp-metatron',   cat: 'spirit', name: 'Metatron-Würfel', draw: metatron },
    { id: 'sp-sri',        cat: 'spirit', name: 'Sri Yantra',      draw: sriYantra },
    { id: 'sp-merkaba',    cat: 'spirit', name: 'Merkaba',         anim: 'spin-slow',   draw: merkaba },
    { id: 'sp-lotus',      cat: 'spirit', name: 'Lotus',           draw: (c, s, col) => lotus(c, s, col, true) },
    { id: 'sp-lotusknospe',cat: 'spirit', name: 'Lotus-Knospe',    draw: (c, s, col) => lotus(c, s, col, false) },
    { id: 'sp-chakrarad',  cat: 'spirit', name: 'Chakra-Rad',      anim: 'spin-slow',   draw: chakraRad },
    { id: 'sp-chakren',    cat: 'spirit', name: '7 Chakren',       anim: 'breathe',     draw: (c, s) => chakraSaeule(c, s) },
    { id: 'sp-auge',       cat: 'spirit', name: 'Drittes Auge',    anim: 'glow',        draw: drittesAuge },
    { id: 'sp-nazar',      cat: 'spirit', name: 'Nazar-Auge',      draw: (c, s) => nazar(c, s) },
    { id: 'sp-hamsa',      cat: 'spirit', name: 'Hamsa-Hand',      draw: hamsa },
    { id: 'sp-om',         cat: 'spirit', name: 'Om',              draw: om },
    { id: 'sp-kristall',   cat: 'spirit', name: 'Kristall-Cluster', draw: (c, s, col) => kristall(c, s, col, 3) },
    { id: 'sp-kristall5',  cat: 'spirit', name: 'Kristall-Gruppe', draw: (c, s, col) => kristall(c, s, col, 5) },
    { id: 'sp-kugel',      cat: 'spirit', name: 'Kristallkugel',   anim: 'glow',        draw: kristallkugel },
    { id: 'sp-feder',      cat: 'spirit', name: 'Feder',           anim: 'sway',        draw: feder },
    { id: 'sp-fluegel',    cat: 'spirit', name: 'Engelsflügel',    anim: 'breathe',     draw: engelsfluegel },
    { id: 'sp-triquetra',  cat: 'spirit', name: 'Triquetra',       draw: triquetra },
    { id: 'sp-pentagramm', cat: 'spirit', name: 'Pentagramm',      draw: pentagramm },
    { id: 'sp-baum',       cat: 'spirit', name: 'Baum des Lebens', draw: baumDesLebens },
    { id: 'sp-salbei',     cat: 'spirit', name: 'Räucherbündel',   draw: raeucherbuendel },
    { id: 'sp-kerze',      cat: 'spirit', name: 'Kerze mit Aura',  anim: 'candleglow',  draw: kerzeAura },
    { id: 'sp-traum',      cat: 'spirit', name: 'Traumfänger',     anim: 'sway',        draw: traumfaenger },
    { id: 'sp-sternbild',  cat: 'spirit', name: 'Sternbild',       anim: 'twinkle',     draw: sternbild },
    { id: 'sp-aura',       cat: 'spirit', name: 'Aura',            anim: 'breathe',     draw: auraKreis },
    { id: 'sp-unendlich',  cat: 'spirit', name: 'Unendlich',       draw: unendlich },

    // ---- ✨ Effekte ----
    { id: 'fx-herz',       cat: 'glanz', name: 'Herz plastisch',   anim: 'heartbeat',   draw: glanzHerz },
    { id: 'fx-stern',      cat: 'glanz', name: 'Stern plastisch',  anim: 'pulse',       draw: glanzStern },
    { id: 'fx-blase',      cat: 'glanz', name: 'Seifenblase',      anim: 'float',       draw: blase },
    { id: 'fx-kugel',      cat: 'glanz', name: 'Marmorkugel',      anim: 'float',       draw: marmorKugel },
    { id: 'fx-blob',       cat: 'glanz', name: 'Farbblob',         anim: 'bounce-jelly', draw: verlaufsBlob },
    { id: 'fx-klecks',     cat: 'glanz', name: 'Farbklecks',       draw: farbklecks },
    { id: 'fx-strahl',     cat: 'glanz', name: 'Lichtstrahl',      anim: 'shimmer',     draw: lichtstrahl },
    { id: 'fx-reflex',     cat: 'glanz', name: 'Linsenreflex',     anim: 'shimmer',     draw: linsenreflex },
    { id: 'fx-glitzer',    cat: 'glanz', name: 'Glitzerstaub',     anim: 'twinkle',     draw: glitzerStreu },
    { id: 'fx-bokeh',      cat: 'glanz', name: 'Bokeh-Lichter',    anim: 'breathe',     draw: bokeh },
    { id: 'fx-funken',     cat: 'glanz', name: 'Funken',           anim: 'sparkle-burst', draw: funken },
    { id: 'fx-rauch',      cat: 'glanz', name: 'Rauch',            anim: 'float',       draw: rauch },
    { id: 'fx-neonrahmen', cat: 'glanz', name: 'Neon-Rahmen',      anim: 'neon',        draw: neonRahmen },
    { id: 'fx-neonherz',   cat: 'glanz', name: 'Neon-Herz',        anim: 'neon',        draw: neonHerz },
    { id: 'fx-neonstern',  cat: 'glanz', name: 'Neon-Stern',       anim: 'neon',        draw: neonStern },
    { id: 'fx-perlen',     cat: 'glanz', name: 'Perlenkette', ar: 3, draw: perlenkette },
    { id: 'fx-goldband',   cat: 'glanz', name: 'Goldband',    ar: 4, draw: goldband },
    { id: 'fx-schleife',   cat: 'glanz', name: 'Schleife 3D',      draw: schleife3d },
    { id: 'fx-sticker',    cat: 'glanz', name: 'Sticker-Button',   anim: 'wiggle',      draw: stickerRahmen },
  ];

  NEU.forEach(d => SS.STICKERS.push(d));
  SS.STICKER_NEU = NEU.length;
})();
