/* Seamless Studio – Szenen-Objekte und Szenen-Hintergründe (v7.3)
   ============================================================================
   Zwölf Sticker für die Feed-Szenen-Vorlagen (szenen7.js) – die Alltags-
   Objekte, in denen dort die Foto-Platzhalter stecken oder die die Slides
   verbinden: Filmstreifen, Retro-TV, Spiralblock, Browser-Fenster, CD,
   Filmklappe, Barcode, ×××, Katze, Zugfenster, Wäscheleine, Schwalbe.

   Dazu fünf nahtlose Hintergründe (Kategorie ∞): Filmtag (Wolkenband und
   Hügel wie in Scotts Vorbild), Blumenwiese, Holztisch, Galeriewand und
   Zugabteil. Alle sind reine Funktionen von x mit weichen Verläufen –
   an den Schnittkanten gibt es daher nichts, was springen könnte.

   Alles prozedural, nichts wird nachgeladen. Zeichenvertrag wie überall:
   draw(c, s, color) zeichnet ZENTRIERT auf (0,0), Höhe s, Breite s*ar.

   Für szenen7.js wichtig – die Fenster-Geometrie der Objekte (Anteile von s):
     sz-tv          Bildschirm: Mitte (-0.15, +0.06), Größe 0.64 × 0.50
     sz-browser     Inhalt:     Mitte (0, +0.075),    Größe 1.20 × 0.77
     sz-fenster     Öffnung:    Mitte (0, -0.02),     Größe 0.64 × 0.76
     sz-spiralblock Seiten:     links (-0.40, 0) rechts (+0.40, 0), je 0.62 × 0.86
   ========================================================================= */

(function () {
  if (!SS.STICKERS || !SS.BG_LIB) return;
  const TAU = Math.PI * 2;

  function rnd(seed) {          // kleiner, bestimmbarer Zufall (mulberry32)
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  /* ============================================================== Sticker */

  /* Filmstreifen-Band – für Kanten-Überquerungen gedacht. WICHTIG: `s` ist
     hier die BREITE, die Höhe folgt (0,294 s). So bleibt die Tinte im
     2,2-s-Puffer des Bildschirm-Sticker-Caches (render.js:745) – ein Band
     mit Tinte über 2,2 s hinaus würde am Bildschirm beschnitten, nur der
     Export (der direkt zeichnet) wäre vollständig. Gemessen in Test 02. */
  function filmband(c, s, col) {
    const w = s, h = s * 0.294;
    const e = h;                             // alte Höheneinheit
    c.fillStyle = '#2b2825';
    rr(c, -w / 2, -h / 2, w, h, e * 0.05); c.fill();
    /* Lochreihen */
    const loch = e * 0.075, schritt = e * 0.17;
    c.fillStyle = '#efe9dd';
    for (let x = -w / 2 + schritt * 0.6; x < w / 2 - loch; x += schritt) {
      rr(c, x, -h / 2 + e * 0.045, loch, loch, loch * 0.3); c.fill();
      rr(c, x, h / 2 - e * 0.045 - loch, loch, loch, loch * 0.3); c.fill();
    }
    /* Leere Bildfenster – mittig verteilt, kein Reststummel am Rand */
    const fh = h - e * 0.36, gap = e * 0.10;
    const anzahl = Math.max(1, Math.round((w - e * 0.2 + gap) / (e * 0.72 + gap)));
    const fw = (w - e * 0.2 - gap * (anzahl - 1)) / anzahl;
    c.fillStyle = '#d9d2c4';
    for (let i = 0; i < anzahl; i++) {
      rr(c, -w / 2 + e * 0.1 + i * (fw + gap), -fh / 2, fw, fh, e * 0.02); c.fill();
    }
  }

  /* Retro-Fernseher – der Bildschirm bleibt leer, das Foto legt szenen7
     als eigenes Element darüber. */
  function retroTv(c, s, col) {
    const w = s * 1.12;
    /* Antenne */
    c.strokeStyle = '#6e6459'; c.lineWidth = s * 0.028; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-s * 0.05, -s * 0.20); c.lineTo(-s * 0.26, -s * 0.47); c.stroke();
    c.beginPath(); c.moveTo(-s * 0.05, -s * 0.20); c.lineTo(s * 0.18, -s * 0.48); c.stroke();
    c.fillStyle = '#6e6459';
    c.beginPath(); c.arc(-s * 0.26, -s * 0.47, s * 0.035, 0, TAU); c.fill();
    c.beginPath(); c.arc(s * 0.18, -s * 0.48, s * 0.035, 0, TAU); c.fill();
    /* Füße */
    c.strokeStyle = '#5d5348'; c.lineWidth = s * 0.05;
    c.beginPath(); c.moveTo(-s * 0.34, s * 0.40); c.lineTo(-s * 0.42, s * 0.50); c.stroke();
    c.beginPath(); c.moveTo(s * 0.34, s * 0.40); c.lineTo(s * 0.42, s * 0.50); c.stroke();
    /* Gehäuse */
    const g = c.createLinearGradient(0, -s * 0.2, 0, s * 0.42);
    g.addColorStop(0, col || '#a8865f');
    g.addColorStop(1, shade(col || '#a8865f', -34));
    c.fillStyle = g;
    rr(c, -w / 2, -s * 0.20, w, s * 0.62, s * 0.09); c.fill();
    c.strokeStyle = 'rgba(40,32,24,.35)'; c.lineWidth = s * 0.016;
    rr(c, -w / 2, -s * 0.20, w, s * 0.62, s * 0.09); c.stroke();
    /* Bildschirm (leer, leicht gewölbt angedeutet) */
    c.fillStyle = '#26231f';
    rr(c, -s * 0.47, -s * 0.19, s * 0.64, s * 0.50, s * 0.07); c.fill();
    c.fillStyle = 'rgba(255,255,255,.10)';
    c.beginPath(); c.ellipse(-s * 0.32, -s * 0.08, s * 0.10, s * 0.05, -0.5, 0, TAU); c.fill();
    /* Knopfleiste */
    c.fillStyle = 'rgba(35,28,20,.28)';
    rr(c, s * 0.24, -s * 0.16, s * 0.28, s * 0.44, s * 0.04); c.fill();
    c.fillStyle = '#efe6d6';
    c.beginPath(); c.arc(s * 0.38, -s * 0.04, s * 0.055, 0, TAU); c.fill();
    c.beginPath(); c.arc(s * 0.38, s * 0.12, s * 0.055, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(240,230,214,.7)'; c.lineWidth = s * 0.014;
    for (let i = 0; i < 3; i++) {
      c.beginPath(); c.moveTo(s * 0.30, s * 0.22 + i * s * 0.035);
      c.lineTo(s * 0.46, s * 0.22 + i * s * 0.035); c.stroke();
    }
  }

  /* Aufgeschlagener Spiralblock – zwei Seiten, Ringbindung in der Mitte. */
  function spiralblock(c, s, col) {
    const seiteW = s * 0.62, seiteH = s * 0.86;
    c.save();
    /* Schatten unter dem Block */
    c.fillStyle = 'rgba(60,50,40,.18)';
    c.beginPath(); c.ellipse(0, s * 0.42, s * 0.72, s * 0.07, 0, 0, TAU); c.fill();
    for (const seite of [-1, 1]) {
      c.save();
      c.translate(seite * s * 0.40, 0);
      c.rotate(seite * 0.035);
      c.fillStyle = '#fbf7ef';
      rr(c, -seiteW / 2, -seiteH / 2, seiteW, seiteH, s * 0.02); c.fill();
      c.strokeStyle = 'rgba(120,105,88,.25)'; c.lineWidth = s * 0.008;
      rr(c, -seiteW / 2, -seiteH / 2, seiteW, seiteH, s * 0.02); c.stroke();
      /* Linien */
      c.strokeStyle = 'rgba(140,125,105,.18)'; c.lineWidth = s * 0.006;
      for (let i = 1; i <= 8; i++) {
        const y = -seiteH / 2 + (seiteH / 9) * i;
        c.beginPath(); c.moveTo(-seiteW / 2 + s * 0.05, y);
        c.lineTo(seiteW / 2 - s * 0.05, y); c.stroke();
      }
      c.restore();
    }
    /* Spirale */
    c.strokeStyle = col || '#8b7a63'; c.lineWidth = s * 0.020; c.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const y = -seiteH / 2 + s * 0.06 + i * (seiteH - s * 0.12) / 8;
      c.beginPath();
      c.ellipse(0, y, s * 0.055, s * 0.028, 0.25, 0, TAU);
      c.stroke();
    }
    c.restore();
  }

  /* Browser-Fenster – Kopfzeile mit drei Punkten, Inhalt bleibt leer. */
  function browserfenster(c, s, col) {
    const w = s * 1.28, h = s;
    c.fillStyle = 'rgba(60,50,40,.16)';
    rr(c, -w / 2 + s * 0.02, -h / 2 + s * 0.03, w, h, s * 0.06); c.fill();
    c.fillStyle = '#ffffff';
    rr(c, -w / 2, -h / 2, w, h, s * 0.06); c.fill();
    c.strokeStyle = 'rgba(90,80,66,.30)'; c.lineWidth = s * 0.012;
    rr(c, -w / 2, -h / 2, w, h, s * 0.06); c.stroke();
    /* Kopfzeile */
    c.fillStyle = col || '#e8e2d6';
    c.save();
    rr(c, -w / 2, -h / 2, w, s * 0.15, s * 0.06); c.clip();
    c.fillRect(-w / 2, -h / 2, w, s * 0.15);
    c.restore();
    c.strokeStyle = 'rgba(90,80,66,.22)'; c.lineWidth = s * 0.008;
    c.beginPath(); c.moveTo(-w / 2, -h / 2 + s * 0.15); c.lineTo(w / 2, -h / 2 + s * 0.15); c.stroke();
    const punkte = ['#d98a7f', '#e5c07b', '#a3be8c'];
    punkte.forEach((farbe, i) => {
      c.fillStyle = farbe;
      c.beginPath(); c.arc(-w / 2 + s * 0.075 + i * s * 0.075, -h / 2 + s * 0.075, s * 0.026, 0, TAU); c.fill();
    });
    /* Adresszeile */
    c.fillStyle = 'rgba(255,255,255,.85)';
    rr(c, -w / 2 + s * 0.30, -h / 2 + s * 0.035, w * 0.52, s * 0.08, s * 0.04); c.fill();
    c.strokeStyle = 'rgba(90,80,66,.20)'; c.lineWidth = s * 0.007;
    rr(c, -w / 2 + s * 0.30, -h / 2 + s * 0.035, w * 0.52, s * 0.08, s * 0.04); c.stroke();
  }

  /* CD mit Pastell-Schimmer. */
  function cdScheibe(c, s, col) {
    const r = s * 0.5;
    const seg = ['#e8c9c4', '#e6dbc0', '#c9d8c4', '#c2cfe0', '#d8c6dd'];
    c.save();
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip();
    c.fillStyle = '#dedad2'; c.fillRect(-r, -r, r * 2, r * 2);
    for (let i = 0; i < 10; i++) {
      c.fillStyle = seg[i % seg.length];
      c.globalAlpha = 0.5;
      c.beginPath(); c.moveTo(0, 0);
      c.arc(0, 0, r, (i / 10) * TAU + 0.5, ((i + 0.7) / 10) * TAU + 0.5);
      c.closePath(); c.fill();
    }
    c.globalAlpha = 1;
    /* feine Rillen */
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      c.beginPath(); c.arc(0, 0, r * (0.42 + i * 0.1), 0, TAU); c.stroke();
    }
    c.restore();
    /* Innenring und Loch */
    c.fillStyle = '#f2efe8';
    c.beginPath(); c.arc(0, 0, r * 0.30, 0, TAU); c.fill();
    c.fillStyle = '#cfc9be';
    c.beginPath(); c.arc(0, 0, r * 0.115, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(120,110,95,.5)'; c.lineWidth = s * 0.012;
    c.beginPath(); c.arc(0, 0, r * 0.30, 0, TAU); c.stroke();
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
    /* Glanz */
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = s * 0.05;
    c.beginPath(); c.arc(0, 0, r * 0.8, -2.4, -1.7); c.stroke();
  }

  /* Filmklappe. */
  function filmklappe(c, s, col) {
    const w = s * 1.1;
    c.save();
    /* Oberer Balken, leicht geöffnet */
    c.save();
    c.translate(-w / 2 + s * 0.05, -s * 0.28);
    c.rotate(-0.13);
    c.fillStyle = '#2e2b28';
    rr(c, 0, -s * 0.16, w * 0.98, s * 0.16, s * 0.02); c.fill();
    for (let i = 0; i < 6; i++) {
      c.fillStyle = i % 2 ? '#efe9dd' : '#2e2b28';
      c.save();
      c.beginPath();
      const x0 = i * w * 0.98 / 6;
      c.moveTo(x0, -s * 0.16); c.lineTo(x0 + w * 0.09, -s * 0.16);
      c.lineTo(x0 + w * 0.98 / 6, 0); c.lineTo(x0 + w * 0.98 / 6 - w * 0.09, 0);
      c.closePath(); c.fill(); c.restore();
    }
    c.restore();
    /* Scharnier */
    c.fillStyle = '#9a917f';
    c.beginPath(); c.arc(-w / 2 + s * 0.07, -s * 0.26, s * 0.05, 0, TAU); c.fill();
    /* Körper */
    c.fillStyle = '#33302c';
    rr(c, -w / 2, -s * 0.24, w, s * 0.74, s * 0.03); c.fill();
    /* Streifenzeile oben am Körper */
    for (let i = 0; i < 6; i++) {
      c.fillStyle = i % 2 ? '#efe9dd' : '#33302c';
      c.beginPath();
      const x0 = -w / 2 + i * w / 6;
      c.moveTo(x0, -s * 0.24); c.lineTo(x0 + w * 0.09, -s * 0.24);
      c.lineTo(x0 + w / 6, -s * 0.08); c.lineTo(x0 + w / 6 - w * 0.09, -s * 0.08);
      c.closePath(); c.fill();
    }
    /* Beschriftungszeilen */
    c.strokeStyle = 'rgba(240,232,218,.55)'; c.lineWidth = s * 0.014;
    for (let i = 0; i < 3; i++) {
      const y = s * 0.02 + i * s * 0.14;
      c.beginPath(); c.moveTo(-w / 2 + s * 0.08, y); c.lineTo(w / 2 - s * 0.08, y); c.stroke();
    }
    c.restore();
  }

  /* Barcode-Sticker. */
  function barcode(c, s, col) {
    const w = s * 1.7, h = s;
    c.fillStyle = '#fffdf8';
    rr(c, -w / 2, -h / 2, w, h, s * 0.06); c.fill();
    c.strokeStyle = 'rgba(80,72,60,.28)'; c.lineWidth = s * 0.012;
    rr(c, -w / 2, -h / 2, w, h, s * 0.06); c.stroke();
    const r = rnd(42);
    c.fillStyle = '#2c2925';
    let x = -w / 2 + s * 0.13;
    while (x < w / 2 - s * 0.14) {
      const bw = s * (0.015 + r() * 0.045);
      c.fillRect(x, -h / 2 + s * 0.14, bw, h * 0.58);
      x += bw + s * (0.02 + r() * 0.035);
    }
    /* Ziffernzeile als Striche */
    c.fillStyle = '#4a453d';
    for (let i = 0; i < 9; i++) {
      c.fillRect(-w / 2 + s * 0.16 + i * (w - s * 0.36) / 9, h / 2 - s * 0.20, s * 0.05, s * 0.045);
    }
  }

  /* Drei Hand-Kreuze ××× – kompakt genug für den 2,2-s-Cache-Puffer */
  function xxx(c, s, col) {
    c.strokeStyle = col || '#2e2b28';
    c.lineCap = 'round';
    const p = [[-s * 0.70, 0, 1], [0, -s * 0.06, 0.85], [s * 0.70, 0.04 * s, 1.08]];
    for (const [x, y, f] of p) {
      c.lineWidth = s * 0.10 * f;
      const a = s * 0.28 * f;
      c.save(); c.translate(x, y); c.rotate((x / s) * 0.14);
      c.beginPath(); c.moveTo(-a, -a); c.lineTo(a, a); c.stroke();
      c.beginPath(); c.moveTo(a, -a); c.lineTo(-a, a); c.stroke();
      c.restore();
    }
  }

  /* Sitzende Katze, Silhouette mit Schwanz. */
  function katze(c, s, col) {
    c.fillStyle = col || '#2e2b28';
    c.strokeStyle = col || '#2e2b28';
    /* Körper */
    c.beginPath();
    c.moveTo(-s * 0.16, s * 0.5);
    c.bezierCurveTo(-s * 0.30, s * 0.18, -s * 0.22, -s * 0.10, -s * 0.05, -s * 0.16);
    c.bezierCurveTo(s * 0.02, -s * 0.19, s * 0.12, -s * 0.16, s * 0.17, -s * 0.06);
    c.bezierCurveTo(s * 0.26, s * 0.12, s * 0.24, s * 0.34, s * 0.20, s * 0.5);
    c.closePath(); c.fill();
    /* Kopf */
    c.beginPath(); c.arc(-s * 0.05, -s * 0.30, s * 0.17, 0, TAU); c.fill();
    /* Ohren */
    c.beginPath();
    c.moveTo(-s * 0.19, -s * 0.38); c.lineTo(-s * 0.23, -s * 0.55); c.lineTo(-s * 0.08, -s * 0.45);
    c.closePath(); c.fill();
    c.beginPath();
    c.moveTo(s * 0.02, -s * 0.45); c.lineTo(s * 0.12, -s * 0.53); c.lineTo(s * 0.09, -s * 0.36);
    c.closePath(); c.fill();
    /* Schwanz */
    c.lineWidth = s * 0.09; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(s * 0.18, s * 0.46);
    c.bezierCurveTo(s * 0.42, s * 0.44, s * 0.46, s * 0.16, s * 0.30, s * 0.05);
    c.stroke();
    /* Brustfleck */
    c.fillStyle = 'rgba(255,255,255,.85)';
    c.beginPath(); c.ellipse(-s * 0.02, s * 0.08, s * 0.045, s * 0.075, 0, 0, TAU); c.fill();
  }

  /* Zugfenster mit runden Ecken – die Öffnung bleibt leer. */
  function zugfenster(c, s, col) {
    const w = s * 0.82;
    c.fillStyle = col || '#8e9498';
    rr(c, -w / 2, -s / 2, w, s, s * 0.14); c.fill();
    c.strokeStyle = 'rgba(50,48,44,.35)'; c.lineWidth = s * 0.014;
    rr(c, -w / 2, -s / 2, w, s, s * 0.14); c.stroke();
    /* Öffnung */
    c.fillStyle = '#dfe6ea';
    rr(c, -s * 0.32, -s * 0.40, s * 0.64, s * 0.76, s * 0.10); c.fill();
    c.strokeStyle = 'rgba(50,48,44,.30)'; c.lineWidth = s * 0.010;
    rr(c, -s * 0.32, -s * 0.40, s * 0.64, s * 0.76, s * 0.10); c.stroke();
    /* Sims */
    c.fillStyle = shade(col || '#8e9498', -28);
    rr(c, -w / 2 + s * 0.06, s * 0.40, w - s * 0.12, s * 0.045, s * 0.02); c.fill();
  }

  /* Wäscheleinen-Segment. WICHTIG: `s` ist die BREITE (Cache-Puffer, siehe
     filmband). Beide Enden auf gleicher Höhe (-0.05 s), Durchhang bis
     +0.05 s – nebeneinander gesetzt ergibt das eine durchlaufende Leine. */
  function waescheleine(c, s, col) {
    const w = s;
    c.strokeStyle = col || '#7a6a55';
    c.lineWidth = s * 0.006; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-w / 2, -s * 0.05);
    c.quadraticCurveTo(0, s * 0.05, w / 2, -s * 0.05);
    c.stroke();
    /* zwei kleine Klammern als Zierde */
    c.fillStyle = '#c9a15f';
    for (const t of [0.3, 0.72]) {
      const x = -w / 2 + w * t;
      const y = leinenY(t, s);
      c.save(); c.translate(x, y); c.rotate(0.1 - t * 0.2);
      rr(c, -s * 0.003, -s * 0.0017, s * 0.006, s * 0.02, s * 0.0025); c.fill();
      c.restore();
    }
  }
  function leinenY(t, s) {
    /* Punkt auf der Quadratik: (1-t)^2*a + 2(1-t)t*b + t^2*a */
    const a = -0.05 * s, b = 0.05 * s;
    return (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * a;
  }

  /* Vogel im Gleitflug – zwei geschwungene Flügel und ein kleiner Rumpf,
     wie mit zwei Pinselzügen gemalt. */
  function schwalbe(c, s, col) {
    c.strokeStyle = col || '#4a4540';
    c.fillStyle = col || '#4a4540';
    c.lineCap = 'round';
    c.lineWidth = s * 0.09;
    /* linker Flügel */
    c.beginPath();
    c.moveTo(-s * 0.60, -s * 0.16);
    c.quadraticCurveTo(-s * 0.30, -s * 0.34, -s * 0.02, -s * 0.02);
    c.stroke();
    /* rechter Flügel */
    c.beginPath();
    c.moveTo(s * 0.60, -s * 0.16);
    c.quadraticCurveTo(s * 0.30, -s * 0.34, s * 0.02, -s * 0.02);
    c.stroke();
    /* Rumpf */
    c.beginPath();
    c.ellipse(0, s * 0.02, s * 0.10, s * 0.06, 0, 0, TAU);
    c.fill();
  }

  function shade(hex, amt) {
    const h = String(hex).replace('#', '');
    if (h.length !== 6) return hex;
    const n = [0, 2, 4].map(i => Math.max(0, Math.min(255, parseInt(h.slice(i, i + 2), 16) + amt)));
    return '#' + n.map(v => v.toString(16).padStart(2, '0')).join('');
  }

  const NEU = [
    { id: 'sz-filmband',    cat: 'szene', name: 'Filmstreifen',   ar: 1, hf: 0.294, draw: filmband },
    { id: 'sz-tv',          cat: 'szene', name: 'Retro-TV',       ar: 1.12, hf: 1.06, draw: retroTv },
    { id: 'sz-spiralblock', cat: 'szene', name: 'Spiralblock',    ar: 1.5,  draw: spiralblock },
    { id: 'sz-browser',     cat: 'szene', name: 'Browser',        ar: 1.28, draw: browserfenster },
    { id: 'sz-cd',          cat: 'szene', name: 'CD',             ar: 1,    draw: cdScheibe },
    { id: 'sz-klappe',      cat: 'szene', name: 'Filmklappe',     ar: 1.1,  draw: filmklappe },
    { id: 'sz-barcode',     cat: 'szene', name: 'Barcode',        ar: 1.7,  draw: barcode },
    { id: 'sz-xxx',         cat: 'szene', name: '×××',            ar: 2.1,  draw: xxx },
    { id: 'sz-katze',       cat: 'szene', name: 'Katze',          ar: 0.75, hf: 1.05, draw: katze },
    { id: 'sz-fenster',     cat: 'szene', name: 'Zugfenster',     ar: 0.82, draw: zugfenster },
    { id: 'sz-leine',       cat: 'szene', name: 'Wäscheleine',    ar: 1,    hf: 0.12, draw: waescheleine },
    { id: 'sz-vogel',       cat: 'szene', name: 'Schwalbe',       ar: 1.3,  hf: 0.9, draw: schwalbe },
  ];
  NEU.forEach(d => SS.STICKERS.push(d));

  /* =============================================== Nahtlose Hintergründe */

  function himmel(c, W, H, stops) {
    const g = c.createLinearGradient(0, 0, 0, H);
    stops.forEach(([p, f]) => g.addColorStop(p, f));
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  function wolken(c, W, H, seed, n, y0, ys, a) {
    const r = rnd(seed);
    for (let i = 0; i < n; i++) {
      const x = ((i + 0.5) / n) * W + (r() - 0.5) * W * 0.02;
      const y = H * (y0 + Math.sin(i * 1.7) * ys) + (r() - 0.5) * H * 0.05;
      const s = H * (0.05 + r() * 0.07);
      c.fillStyle = `rgba(255,255,255,${a + r() * 0.3})`;
      c.beginPath();
      c.arc(x, y, s, 0, TAU);
      c.arc(x + s * 0.85, y + s * 0.18, s * 0.72, 0, TAU);
      c.arc(x - s * 0.8, y + s * 0.22, s * 0.6, 0, TAU);
      c.arc(x + s * 0.1, y - s * 0.28, s * 0.62, 0, TAU);
      c.fill();
    }
  }
  function huegel(c, W, H, farbe, y0, amp, freq, phase) {
    c.fillStyle = farbe;
    c.beginPath();
    c.moveTo(0, H);
    for (let x = 0; x <= W; x += 6) {
      const t = x / W;
      const y = H * (y0 + amp * Math.sin(t * Math.PI * 2 * freq + phase)
        + amp * 0.4 * Math.sin(t * Math.PI * 2 * freq * 2.7 + phase * 1.9));
      c.lineTo(x, y);
    }
    c.lineTo(W, H);
    c.closePath(); c.fill();
  }

  const BGS = [
    { id: 'sl-filmtag', name: 'Filmtag', paint: (c, W, H) => {
      himmel(c, W, H, [[0, '#bfd9ec'], [0.45, '#dcebf2'], [1, '#eef3ee']]);
      wolken(c, W, H, 7, Math.max(6, Math.round(W / H * 2.2)), 0.16, 0.07, 0.5);
      huegel(c, W, H, '#a9c489', 0.60, 0.035, 2.2, 0.8);
      huegel(c, W, H, '#8db06b', 0.72, 0.045, 1.6, 2.6);
      huegel(c, W, H, '#7ba25c', 0.84, 0.030, 2.8, 5.1);
      /* wenige Grasbüschel auf dem vorderen Hügel */
      const r = rnd(19);
      c.strokeStyle = 'rgba(60,90,45,.35)'; c.lineWidth = Math.max(1, H * 0.002);
      for (let i = 0; i < W / H * 26; i++) {
        const x = r() * W, y = H * (0.86 + r() * 0.11);
        c.beginPath(); c.moveTo(x, y);
        c.quadraticCurveTo(x + H * 0.004, y - H * 0.014, x + H * 0.009, y - H * 0.022);
        c.stroke();
      }
    } },

    { id: 'sl-wiese', name: 'Blumenwiese', paint: (c, W, H) => {
      himmel(c, W, H, [[0, '#d7e8f2'], [0.55, '#eef2ea'], [1, '#f4f2e6']]);
      wolken(c, W, H, 23, Math.max(5, Math.round(W / H * 1.6)), 0.14, 0.05, 0.4);
      huegel(c, W, H, '#b3cb8e', 0.62, 0.03, 1.8, 1.2);
      huegel(c, W, H, '#9dbd7c', 0.72, 0.035, 2.4, 3.9);
      const r = rnd(31);
      for (let i = 0; i < W / H * 40; i++) {
        const x = r() * W, y = H * (0.76 + r() * 0.20);
        c.strokeStyle = 'rgba(90,120,70,.4)'; c.lineWidth = Math.max(1, H * 0.002);
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + H * 0.003, y - H * 0.02); c.stroke();
        if (r() > 0.6) {
          c.fillStyle = ['#f2e6b8', '#f0d9df', '#ffffff'][i % 3];
          c.beginPath(); c.arc(x + H * 0.003, y - H * 0.024, H * 0.005, 0, TAU); c.fill();
        }
      }
    } },

    { id: 'sl-holztisch', name: 'Holztisch', paint: (c, W, H) => {
      c.fillStyle = '#b8905f'; c.fillRect(0, 0, W, H);
      const r = rnd(11);
      const reihen = 5;
      for (let i = 0; i < reihen; i++) {
        const y0 = (i / reihen) * H;
        c.fillStyle = i % 2 ? 'rgba(120,80,40,.10)' : 'rgba(255,235,200,.07)';
        c.fillRect(0, y0, W, H / reihen);
        c.strokeStyle = 'rgba(90,60,30,.35)'; c.lineWidth = Math.max(1, H * 0.0035);
        c.beginPath(); c.moveTo(0, y0); c.lineTo(W, y0); c.stroke();
        /* Maserung: weiche Wellenlinien innerhalb der Planke */
        c.strokeStyle = 'rgba(100,66,32,.16)';
        c.lineWidth = Math.max(1, H * 0.0022);
        for (let m = 0; m < 3; m++) {
          const ym = y0 + H / reihen * (0.25 + m * 0.25);
          c.beginPath();
          for (let x = 0; x <= W; x += 8) {
            const y = ym + Math.sin(x / W * Math.PI * 2 * (3 + m) + i * 2 + m) * H * 0.008;
            x === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
          }
          c.stroke();
        }
      }
      /* wenige Astlöcher */
      for (let i = 0; i < Math.max(2, W / H); i++) {
        const x = r() * W, y = r() * H;
        c.strokeStyle = 'rgba(90,58,28,.4)'; c.lineWidth = Math.max(1, H * 0.002);
        for (let k = 1; k <= 3; k++) {
          c.beginPath(); c.ellipse(x, y, H * 0.008 * k, H * 0.005 * k, 0.3, 0, TAU); c.stroke();
        }
      }
    } },

    { id: 'sl-galeriewand', name: 'Galeriewand', paint: (c, W, H) => {
      himmel(c, W, H, [[0, '#f1ebe1'], [1, '#e6ddcf']]);
      /* Putz: feine helle und dunkle Sprenkel */
      const r = rnd(53);
      for (let i = 0; i < W / H * 420; i++) {
        c.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.16)' : 'rgba(120,105,85,.07)';
        c.beginPath(); c.arc(r() * W, r() * H * 0.86, H * (0.001 + r() * 0.003), 0, TAU); c.fill();
      }
      /* Sockelleiste */
      c.fillStyle = '#d9d0c0';
      c.fillRect(0, H * 0.88, W, H * 0.12);
      c.fillStyle = '#cfc4b1';
      c.fillRect(0, H * 0.88, W, H * 0.018);
      c.strokeStyle = 'rgba(110,95,75,.35)'; c.lineWidth = Math.max(1, H * 0.002);
      c.beginPath(); c.moveTo(0, H * 0.88); c.lineTo(W, H * 0.88); c.stroke();
    } },

    { id: 'sl-abteil', name: 'Zugabteil', paint: (c, W, H) => {
      /* obere Wand, Fensterzone, untere Wand – die Fenster selbst sind Sticker */
      himmel(c, W, H, [[0, '#ddd8cc'], [0.16, '#d6d1c4'], [0.17, '#c6cdd1'],
        [0.72, '#cdd3d6'], [0.73, '#c4bcaa'], [1, '#b3aa96']]);
      /* Zierleisten */
      c.fillStyle = 'rgba(90,80,64,.4)';
      c.fillRect(0, H * 0.158, W, H * 0.012);
      c.fillRect(0, H * 0.72, W, H * 0.012);
      c.fillStyle = 'rgba(255,255,255,.18)';
      c.fillRect(0, H * 0.172, W, H * 0.004);
      /* Sitzlehnen-Andeutung unten */
      c.fillStyle = 'rgba(120,96,70,.18)';
      for (let x = 0; x < W; x += H * 0.9) {
        c.fillRect(x + H * 0.1, H * 0.80, H * 0.7, H * 0.2);
      }
    } },
  ];
  BGS.forEach(b => SS.BG_LIB.push({ id: b.id, cat: 'nahtlos', name: b.name, paint: b.paint }));

  /* ================================================= Reiter im Sticker-Panel
     ui.js hängt die Behandler einmal beim Laden an die vorhandenen Knöpfe;
     neue Knöpfe bekommen nichts ab. Deshalb der bewährte Umweg (symbole7):
     data-cat eines vorhandenen Knopfs kurz umbiegen und dessen Behandler
     rufen – so entstehen die Kacheln mit derselben Funktion wie überall. */
  (function () {
    const tabs = SS.el && SS.el('stTabs');
    if (!tabs) return;
    const muster = tabs.querySelector('[data-cat="herzen"]')
      || tabs.querySelector('button[data-cat]');
    if (!muster || typeof muster.onclick !== 'function') return;
    if (tabs.querySelector('[data-cat="szene"]')) return;
    const b = document.createElement('button');
    b.setAttribute('data-cat', 'szene');
    b.textContent = '🎬 Szene';
    b.onclick = () => {
      const merk = muster.getAttribute('data-cat');
      muster.setAttribute('data-cat', 'szene');
      try { muster.onclick(); } finally { muster.setAttribute('data-cat', merk); }
      tabs.querySelectorAll('button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
    };
    const anker = tabs.querySelector('[data-cat="funkeln"]');
    if (anker && anker.nextSibling) tabs.insertBefore(b, anker.nextSibling);
    else tabs.appendChild(b);
  })();

  SS.SZENENSTICKER7 = { bereit: true, sticker: NEU.length, hintergruende: BGS.length };
})();
