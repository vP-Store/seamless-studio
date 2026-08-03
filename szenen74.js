/* Seamless Studio – Szenen-Vorlagen, zweiter Satz (v7.4)
   ============================================================================
   Sechs weitere Feed-Szenen nach Scotts drei neuen Vorbildern plus drei
   verwandte Eigenkompositionen:

     gr-kollage    Grunge-Kollage: gerissene Papiere, Discokugel, Vinyl,
                   iPod, Player-Leiste, Tape-Zeilen (Vorbild moonhee.png)
     ws-weekend    Pastell-Wochenende: weiße Polaroids, Objektiv-Ring,
                   rosa Handschrift, Kirschen (Vorbild sumin.creates)
     f509          Feed 509: 4:5, 5 Slides, dunkle Filmrahmen, Fotoautomat-
                   Spalten, Kirschen, Telefon (Vorbild nisathalha)
     mixtape       Mixtape: Kassetten, Vinyl mit Foto-Label, Titelliste
     konzert       Konzertnacht: Tickets, schwarze Polaroids, Milchstraße
     picknick      Picknick: Wiese, Torte, Kirschen, Sonnengesicht

   Dazu zwölf neue Sticker (Kategorie `szene`) und der Hintergrund
   sl-pastellhimmel. Die Datei ist bewusst SELBSTSTÄNDIG: sie bringt ihre
   eigenen kleinen Helfer mit (neuBau/jeSlide/jeKante wie in szenen7.js),
   statt in die deployte Datei zu schneiden – Regel „neue Funktionen als
   neue Datei ans Ende".

   Breite Sticker (Player-Leiste) folgen der 2,2-s-Cache-Regel aus v7.3:
   `s` ist die BREITE, die Höhe steht in `hf` – sonst schneidet der
   Bildschirm-Cache die Enden ab (Export wäre komplett, fällt kaum auf).
   ========================================================================= */

(function () {
  if (!SS.state || !SS.platzhalterNeu || !SS.SZENEN || !SS.ui
    || typeof SS.ui.szeneVorlageAnwenden !== 'function') return;
  const TAU = Math.PI * 2;

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
  function shade(hex, amt) {
    const h = String(hex).replace('#', '');
    if (h.length !== 6) return hex;
    const n = [0, 2, 4].map(i => Math.max(0, Math.min(255, parseInt(h.slice(i, i + 2), 16) + amt)));
    return '#' + n.map(v => v.toString(16).padStart(2, '0')).join('');
  }
  function rnd(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ============================================================== Sticker */

  function discokugel(c, s, col) {
    const r = s * 0.44;
    /* Aufhängung */
    c.strokeStyle = '#8a8378'; c.lineWidth = s * 0.02;
    c.beginPath(); c.moveTo(0, -s * 0.5); c.lineTo(0, -r); c.stroke();
    c.save();
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip();
    const g = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.4);
    g.addColorStop(0, '#f4f6f8'); g.addColorStop(0.55, '#c3c9d2'); g.addColorStop(1, '#8a919c');
    c.fillStyle = g; c.fillRect(-r, -r, r * 2, r * 2);
    /* Facetten: Reihen aus Kacheln, nach außen schmaler */
    const reihen = 7;
    for (let i = 0; i < reihen; i++) {
      const y0 = -r + (2 * r / reihen) * i;
      const y1 = y0 + 2 * r / reihen;
      const versatz = (i % 2) * 0.5;
      for (let j = -4; j < 5; j++) {
        const x0 = (j + versatz) * r * 0.34;
        c.strokeStyle = 'rgba(90,96,108,.5)'; c.lineWidth = Math.max(1, s * 0.008);
        c.strokeRect(x0, y0, r * 0.34, y1 - y0);
        if (((i * 7 + j) % 5) === 0) {
          c.fillStyle = 'rgba(255,255,255,.8)';
          c.fillRect(x0, y0, r * 0.34, y1 - y0);
        }
      }
    }
    c.restore();
    c.strokeStyle = 'rgba(70,76,88,.6)'; c.lineWidth = s * 0.014;
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
    /* Funkeln */
    c.strokeStyle = '#ffffff'; c.lineWidth = s * 0.02; c.lineCap = 'round';
    for (const [fx, fy, fl] of [[-r * 1.15, -r * 0.5, 0.1], [r * 1.1, r * 0.3, 0.08]]) {
      c.beginPath(); c.moveTo(fx - s * fl, fy); c.lineTo(fx + s * fl, fy); c.stroke();
      c.beginPath(); c.moveTo(fx, fy - s * fl); c.lineTo(fx, fy + s * fl); c.stroke();
    }
  }

  function vinyl(c, s, col) {
    const r = s * 0.48;
    c.fillStyle = '#191715';
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.10)'; c.lineWidth = Math.max(1, s * 0.006);
    for (let i = 1; i <= 6; i++) {
      c.beginPath(); c.arc(0, 0, r * (0.42 + i * 0.09), 0, TAU); c.stroke();
    }
    /* Glanzsegment */
    c.fillStyle = 'rgba(255,255,255,.07)';
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r, -2.5, -1.9); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r, 0.6, 1.2); c.closePath(); c.fill();
    /* Label */
    c.fillStyle = col || '#c9634f';
    c.beginPath(); c.arc(0, 0, r * 0.36, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = s * 0.008;
    c.beginPath(); c.arc(0, 0, r * 0.36, 0, TAU); c.stroke();
    c.fillStyle = '#191715';
    c.beginPath(); c.arc(0, 0, r * 0.045, 0, TAU); c.fill();
  }

  function ipod(c, s, col) {
    const w = s * 0.62, h = s;
    c.fillStyle = 'rgba(60,50,40,.18)';
    rr(c, -w / 2 + s * 0.015, -h / 2 + s * 0.02, w, h, s * 0.09); c.fill();
    const g = c.createLinearGradient(-w / 2, 0, w / 2, 0);
    g.addColorStop(0, '#fbfbfa'); g.addColorStop(0.5, '#ececea'); g.addColorStop(1, '#d8d8d4');
    c.fillStyle = g;
    rr(c, -w / 2, -h / 2, w, h, s * 0.09); c.fill();
    c.strokeStyle = 'rgba(120,120,116,.5)'; c.lineWidth = s * 0.012;
    rr(c, -w / 2, -h / 2, w, h, s * 0.09); c.stroke();
    /* Bildschirm */
    c.fillStyle = '#aebdb4';
    rr(c, -w * 0.38, -h * 0.42, w * 0.76, h * 0.34, s * 0.03); c.fill();
    c.strokeStyle = 'rgba(70,70,66,.5)'; c.lineWidth = s * 0.01;
    rr(c, -w * 0.38, -h * 0.42, w * 0.76, h * 0.34, s * 0.03); c.stroke();
    c.strokeStyle = 'rgba(50,60,54,.5)'; c.lineWidth = s * 0.008;
    for (let i = 0; i < 3; i++) {
      c.beginPath(); c.moveTo(-w * 0.30, -h * 0.36 + i * h * 0.075);
      c.lineTo(w * 0.30, -h * 0.36 + i * h * 0.075); c.stroke();
    }
    /* Klickrad */
    c.fillStyle = '#f6f6f4';
    c.beginPath(); c.arc(0, h * 0.20, w * 0.30, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(140,140,136,.6)'; c.lineWidth = s * 0.01;
    c.beginPath(); c.arc(0, h * 0.20, w * 0.30, 0, TAU); c.stroke();
    c.fillStyle = '#e2e2de';
    c.beginPath(); c.arc(0, h * 0.20, w * 0.115, 0, TAU); c.fill();
  }

  /* Musik-Player-Leiste. `s` ist die BREITE (Cache-Regel), Höhe 0,26 s. */
  function playerleiste(c, s, col) {
    const w = s, h = s * 0.26;
    c.fillStyle = col || '#7db65a';
    rr(c, -w / 2, -h / 2, w, h, h * 0.28); c.fill();
    c.fillStyle = 'rgba(0,0,0,.14)';
    rr(c, -w / 2, -h / 2, w, h, h * 0.28); c.fill();
    c.fillStyle = col || '#7db65a';
    rr(c, -w / 2 + h * 0.06, -h / 2 + h * 0.06, w - h * 0.12, h - h * 0.12, h * 0.24); c.fill();
    /* Fortschritt */
    const ly = -h * 0.16;
    c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = h * 0.07; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-w * 0.40, ly); c.lineTo(w * 0.40, ly); c.stroke();
    c.strokeStyle = '#ffffff';
    c.beginPath(); c.moveTo(-w * 0.40, ly); c.lineTo(-w * 0.06, ly); c.stroke();
    c.fillStyle = '#ffffff';
    c.beginPath(); c.arc(-w * 0.06, ly, h * 0.09, 0, TAU); c.fill();
    /* Knöpfe: zurück, Play, vor */
    c.fillStyle = '#ffffff';
    const ky = h * 0.18, kg = h * 0.30;
    c.beginPath(); c.moveTo(-w * 0.16, ky); c.lineTo(-w * 0.16 + kg * 0.6, ky - kg * 0.4);
    c.lineTo(-w * 0.16 + kg * 0.6, ky + kg * 0.4); c.closePath(); c.fill();
    c.fillRect(-w * 0.16 - kg * 0.16, ky - kg * 0.4, kg * 0.14, kg * 0.8);
    c.beginPath(); c.moveTo(-kg * 0.35, ky - kg * 0.45); c.lineTo(kg * 0.5, ky);
    c.lineTo(-kg * 0.35, ky + kg * 0.45); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(w * 0.16, ky); c.lineTo(w * 0.16 - kg * 0.6, ky - kg * 0.4);
    c.lineTo(w * 0.16 - kg * 0.6, ky + kg * 0.4); c.closePath(); c.fill();
    c.fillRect(w * 0.16 + kg * 0.02, ky - kg * 0.4, kg * 0.14, kg * 0.8);
  }

  function kussmund(c, s, col) {
    const w = s * 1.3;
    c.fillStyle = col || '#c2413b';
    /* Oberlippe */
    c.beginPath();
    c.moveTo(-w / 2, 0);
    c.bezierCurveTo(-w * 0.34, -s * 0.42, -w * 0.12, -s * 0.30, 0, -s * 0.12);
    c.bezierCurveTo(w * 0.12, -s * 0.30, w * 0.34, -s * 0.42, w / 2, 0);
    c.closePath(); c.fill();
    /* Unterlippe */
    c.beginPath();
    c.moveTo(-w / 2, 0);
    c.bezierCurveTo(-w * 0.24, s * 0.46, w * 0.24, s * 0.46, w / 2, 0);
    c.closePath(); c.fill();
    c.strokeStyle = shade(col || '#c2413b', -60); c.lineWidth = s * 0.03; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-w * 0.44, 0); c.quadraticCurveTo(0, s * 0.06, w * 0.44, 0); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.35)';
    c.beginPath(); c.ellipse(-w * 0.16, s * 0.16, w * 0.09, s * 0.07, 0.3, 0, TAU); c.fill();
  }

  function kirschen(c, s, col) {
    c.strokeStyle = '#5c7a3f'; c.lineWidth = s * 0.045; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-s * 0.16, s * 0.18); c.quadraticCurveTo(-s * 0.05, -s * 0.25, s * 0.06, -s * 0.42); c.stroke();
    c.beginPath(); c.moveTo(s * 0.22, s * 0.12); c.quadraticCurveTo(s * 0.14, -s * 0.2, s * 0.06, -s * 0.42); c.stroke();
    /* Blatt */
    c.fillStyle = '#6f9450';
    c.save(); c.translate(s * 0.10, -s * 0.40); c.rotate(-0.5);
    c.beginPath(); c.ellipse(s * 0.10, 0, s * 0.14, s * 0.055, 0, 0, TAU); c.fill();
    c.restore();
    for (const [kx, ky] of [[-s * 0.16, s * 0.28], [s * 0.24, s * 0.24]]) {
      const g = c.createRadialGradient(kx - s * 0.05, ky - s * 0.06, s * 0.02, kx, ky, s * 0.19);
      g.addColorStop(0, '#e0684f'); g.addColorStop(0.6, col || '#b8302a'); g.addColorStop(1, '#7e1d1a');
      c.fillStyle = g;
      c.beginPath(); c.arc(kx, ky, s * 0.18, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,.55)';
      c.beginPath(); c.ellipse(kx - s * 0.06, ky - s * 0.07, s * 0.04, s * 0.025, -0.6, 0, TAU); c.fill();
    }
  }

  function sonnengesicht(c, s, col) {
    const r = s * 0.30;
    c.fillStyle = col || '#f2c14e';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      c.save(); c.rotate(a);
      c.beginPath();
      c.moveTo(r * 1.08, -r * 0.16); c.lineTo(r * 1.55, 0); c.lineTo(r * 1.08, r * 0.16);
      c.closePath(); c.fill();
      c.restore();
    }
    const g = c.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r * 1.2);
    g.addColorStop(0, '#f8d97e'); g.addColorStop(1, col || '#f2c14e');
    c.fillStyle = g;
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    /* Gesicht */
    c.fillStyle = '#7a5a28';
    c.beginPath(); c.arc(-r * 0.32, -r * 0.12, r * 0.075, 0, TAU); c.fill();
    c.beginPath(); c.arc(r * 0.32, -r * 0.12, r * 0.075, 0, TAU); c.fill();
    c.strokeStyle = '#7a5a28'; c.lineWidth = s * 0.025; c.lineCap = 'round';
    c.beginPath(); c.arc(0, r * 0.10, r * 0.34, 0.35, Math.PI - 0.35); c.stroke();
    c.fillStyle = 'rgba(226,120,100,.5)';
    c.beginPath(); c.arc(-r * 0.52, r * 0.14, r * 0.11, 0, TAU); c.fill();
    c.beginPath(); c.arc(r * 0.52, r * 0.14, r * 0.11, 0, TAU); c.fill();
  }

  function objektiv(c, s, col) {
    const r = s * 0.48;
    c.fillStyle = '#f4f2ee';
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(90,88,84,.5)'; c.lineWidth = s * 0.014;
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
    c.strokeStyle = '#b9b5ac'; c.lineWidth = s * 0.02;
    c.beginPath(); c.arc(0, 0, r * 0.82, 0, TAU); c.stroke();
    /* Riffelring */
    c.strokeStyle = 'rgba(120,116,108,.55)'; c.lineWidth = s * 0.012;
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * TAU;
      c.beginPath();
      c.moveTo(Math.cos(a) * r * 0.88, Math.sin(a) * r * 0.88);
      c.lineTo(Math.cos(a) * r * 0.97, Math.sin(a) * r * 0.97);
      c.stroke();
    }
    /* Glas */
    const g = c.createRadialGradient(-r * 0.2, -r * 0.25, r * 0.05, 0, 0, r * 0.72);
    g.addColorStop(0, '#5a6a78'); g.addColorStop(0.5, '#242c36'); g.addColorStop(1, '#10141a');
    c.fillStyle = g;
    c.beginPath(); c.arc(0, 0, r * 0.68, 0, TAU); c.fill();
    c.fillStyle = 'rgba(160,190,220,.35)';
    c.beginPath(); c.ellipse(-r * 0.22, -r * 0.26, r * 0.16, r * 0.09, -0.6, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.5)';
    c.beginPath(); c.arc(r * 0.2, r * 0.24, r * 0.05, 0, TAU); c.fill();
  }

  function telefon(c, s, col) {
    c.strokeStyle = col || '#c2413b';
    c.lineWidth = s * 0.16; c.lineCap = 'round';
    /* Hörerbügel */
    c.beginPath();
    c.arc(0, s * 0.16, s * 0.42, Math.PI * 1.12, Math.PI * 1.88);
    c.stroke();
    /* Muscheln */
    c.fillStyle = col || '#c2413b';
    for (const seite of [-1, 1]) {
      c.save();
      c.translate(seite * s * 0.38, s * 0.03);
      c.rotate(seite * 0.5);
      c.beginPath(); c.ellipse(0, 0, s * 0.16, s * 0.20, 0, 0, TAU); c.fill();
      c.restore();
    }
    c.fillStyle = 'rgba(255,255,255,.25)';
    c.beginPath(); c.ellipse(-s * 0.1, -s * 0.2, s * 0.16, s * 0.05, -0.2, 0, TAU); c.fill();
  }

  function kleeblatt(c, s, col) {
    c.fillStyle = col || '#5f8f4a';
    c.strokeStyle = col || '#5f8f4a';
    for (let i = 0; i < 4; i++) {
      c.save();
      c.rotate((i / 4) * TAU + Math.PI / 4);
      c.beginPath();
      c.arc(-s * 0.085, -s * 0.24, s * 0.13, 0, TAU);
      c.arc(s * 0.085, -s * 0.24, s * 0.13, 0, TAU);
      c.moveTo(0, -s * 0.05);
      c.lineTo(-s * 0.14, -s * 0.30);
      c.lineTo(s * 0.14, -s * 0.30);
      c.closePath();
      c.fill();
      c.restore();
    }
    c.lineWidth = s * 0.05; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, s * 0.06); c.quadraticCurveTo(s * 0.10, s * 0.3, s * 0.04, s * 0.48); c.stroke();
  }

  function kassette(c, s, col) {
    const w = s * 1.55, h = s;
    c.fillStyle = col || '#4a5568';
    rr(c, -w / 2, -h / 2, w, h, s * 0.06); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = s * 0.016;
    rr(c, -w / 2, -h / 2, w, h, s * 0.06); c.stroke();
    /* Etikett */
    c.fillStyle = '#f2ecdd';
    rr(c, -w * 0.42, -h * 0.40, w * 0.84, h * 0.52, s * 0.03); c.fill();
    c.fillStyle = shade(col || '#4a5568', 40);
    rr(c, -w * 0.42, -h * 0.40, w * 0.84, h * 0.14, s * 0.03); c.fill();
    /* Sichtfenster + Spulen */
    c.fillStyle = '#2b2a28';
    rr(c, -w * 0.26, -h * 0.16, w * 0.52, h * 0.24, s * 0.05); c.fill();
    for (const seite of [-1, 1]) {
      c.fillStyle = '#f4f1ea';
      c.beginPath(); c.arc(seite * w * 0.145, -h * 0.04, h * 0.085, 0, TAU); c.fill();
      c.fillStyle = '#2b2a28';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU;
        c.fillRect(seite * w * 0.145 + Math.cos(a) * h * 0.05 - s * 0.008,
          -h * 0.04 + Math.sin(a) * h * 0.05 - s * 0.008, s * 0.016, s * 0.016);
      }
    }
    /* Schrauben + Fußfenster */
    c.fillStyle = 'rgba(255,255,255,.4)';
    for (const [px, py] of [[-w * 0.46, -h * 0.42], [w * 0.46, -h * 0.42], [-w * 0.46, h * 0.40], [w * 0.46, h * 0.40]]) {
      c.beginPath(); c.arc(px, py, s * 0.028, 0, TAU); c.fill();
    }
    c.fillStyle = 'rgba(0,0,0,.25)';
    c.beginPath();
    c.moveTo(-w * 0.22, h * 0.5); c.lineTo(-w * 0.16, h * 0.24);
    c.lineTo(w * 0.16, h * 0.24); c.lineTo(w * 0.22, h * 0.5);
    c.closePath(); c.fill();
    /* Beschriftungslinie */
    c.strokeStyle = 'rgba(90,80,66,.6)'; c.lineWidth = s * 0.012;
    c.beginPath(); c.moveTo(-w * 0.34, -h * 0.10); c.lineTo(w * 0.34, -h * 0.10); c.stroke();
  }

  function note(c, s, col) {
    c.fillStyle = col || '#2e2b28';
    c.strokeStyle = col || '#2e2b28';
    c.lineWidth = s * 0.07; c.lineCap = 'round';
    /* zwei Achtel mit Balken */
    c.beginPath(); c.ellipse(-s * 0.26, s * 0.32, s * 0.14, s * 0.10, -0.3, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(s * 0.24, s * 0.24, s * 0.14, s * 0.10, -0.3, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(-s * 0.13, s * 0.30); c.lineTo(-s * 0.13, -s * 0.30); c.stroke();
    c.beginPath(); c.moveTo(s * 0.37, s * 0.22); c.lineTo(s * 0.37, -s * 0.38); c.stroke();
    c.lineWidth = s * 0.16;
    c.beginPath(); c.moveTo(-s * 0.15, -s * 0.30); c.lineTo(s * 0.39, -s * 0.38); c.stroke();
  }

  const NEU = [
    { id: 'sz-discokugel', cat: 'szene', name: 'Discokugel',   ar: 1.15, draw: discokugel },
    { id: 'sz-vinyl',      cat: 'szene', name: 'Schallplatte', ar: 1,    draw: vinyl },
    { id: 'sz-ipod',       cat: 'szene', name: 'Musikspieler', ar: 0.66, draw: ipod },
    { id: 'sz-player',     cat: 'szene', name: 'Player-Leiste', ar: 1, hf: 0.26, draw: playerleiste },
    { id: 'sz-kussmund',   cat: 'szene', name: 'Kussmund',     ar: 1.35, draw: kussmund },
    { id: 'sz-kirschen',   cat: 'szene', name: 'Kirschen',     ar: 0.9,  draw: kirschen },
    { id: 'sz-sonne',      cat: 'szene', name: 'Sonnengesicht', ar: 1,   draw: sonnengesicht },
    { id: 'sz-objektiv',   cat: 'szene', name: 'Objektiv',     ar: 1,    draw: objektiv },
    { id: 'sz-telefon',    cat: 'szene', name: 'Telefonhörer', ar: 1.15, hf: 0.8, draw: telefon },
    { id: 'sz-klee',       cat: 'szene', name: 'Kleeblatt',    ar: 0.85, draw: kleeblatt },
    { id: 'sz-kassette',   cat: 'szene', name: 'Kassette',     ar: 1.55, draw: kassette },
    { id: 'sz-note',       cat: 'szene', name: 'Noten',        ar: 1,    draw: note },
  ];
  NEU.forEach(d => SS.STICKERS.push(d));

  /* =============================================== Hintergrund Pastellhimmel */
  SS.BG_LIB.push({
    id: 'sl-pastellhimmel', cat: 'nahtlos', name: 'Pastellhimmel',
    paint: (c, W, H) => {
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#cfe6f5'); g.addColorStop(0.55, '#e8f1f2'); g.addColorStop(1, '#f6f4e8');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      /* runde, freundliche Wölkchen */
      const r = rnd(77);
      const n = Math.max(4, Math.round(W / H * 1.4));
      for (let i = 0; i < n; i++) {
        const x = ((i + 0.5) / n) * W + (r() - 0.5) * W * 0.03;
        const y = H * (0.16 + Math.sin(i * 2.1) * 0.08);
        const s = H * (0.05 + r() * 0.05);
        c.fillStyle = 'rgba(255,255,255,.92)';
        c.beginPath();
        c.arc(x, y, s, 0, TAU);
        c.arc(x + s * 0.95, y + s * 0.25, s * 0.7, 0, TAU);
        c.arc(x - s * 0.9, y + s * 0.3, s * 0.62, 0, TAU);
        c.arc(x + s * 0.1, y - s * 0.35, s * 0.6, 0, TAU);
        c.arc(x - s * 0.2, y + s * 0.45, s * 0.75, 0, TAU);
        c.fill();
      }
      /* zwei weiche Hügelbögen, heller als beim Filmtag */
      const huegel = (farbe, y0, amp, freq, phase) => {
        c.fillStyle = farbe;
        c.beginPath(); c.moveTo(0, H);
        for (let x = 0; x <= W; x += 6) {
          const t = x / W;
          c.lineTo(x, H * (y0 + amp * Math.sin(t * Math.PI * 2 * freq + phase)));
        }
        c.lineTo(W, H); c.closePath(); c.fill();
      };
      huegel('#c3d9a4', 0.70, 0.03, 1.8, 0.9);
      huegel('#adcb8b', 0.82, 0.035, 2.3, 3.4);
    },
  });

  /* ================================== Baukasten (Kopie aus szenen7, bewusst) */
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

  const POL  = { style: 'polaroid',   border: 22 };
  const POLW = { style: 'polaroid-w', border: 22 };
  const POLB = { style: 'polaroid-b', border: 22 };
  const FILM = { style: 'film', border: 20 };
  const RISS = { style: 'riss' };
  const DUNKEL = { style: 'thin', border: 18, color: '#1f1c1a' };

  const SZENEN2 = [];

  /* ===== 1. Grunge-Kollage (Vorbild moonhee) ===== */
  SZENEN2.push({
    id: 'sz-grunge', name: 'Grunge-Kollage', bg: 'sl-filmtag',
    hint: 'Gerissene Papiere, Discokugel, Vinyl, Tape-Zeilen – wildes Sammelheft',
    slides: 7, format: '1:1',
    bauen(k) {
      const b = neuBau(k), H = b.H;
      const tape = (z, text, x, y, size, farbe) => b.tx(z, text, x, y, size, {
        font: 'Special Elite', color: '#ffffff', bgStyle: 'marker',
        bgColor: farbe || '#1e1b18', bgAlpha: 0.94, rot: -2 + (x / H) % 4,
      });
      jeSlide(b, [
        (s) => {
          b.st('hinten', 'sz-klappe', b.xs(s, 0.14), H * 0.135, H * 0.13, -8);
          tape('hinten', 'ALL DIE DINGE, DIE ICH WEISS', b.xs(s, 0.58), H * 0.10, H * 0.032);
          tape('hinten', 'UND NIE GESAGT HABE', b.xs(s, 0.52), H * 0.165, H * 0.030, '#c96a78');
          b.slot(b.xs(s, 0.36), H * 0.52, H * 0.37, 0.80, -4, RISS);
          b.slot(b.xs(s, 0.74), H * 0.40, H * 0.26, 0.82, 6, RISS);
          b.st('vorne', 'star', b.xs(s, 0.85), H * 0.66, H * 0.05, 12, '#d8a935');
          b.st('vorne', 'sz-player', b.xs(s, 0.30), H * 0.88, H * 0.52, -2, '#6faf4e');
        },
        (s) => {
          b.st('hinten', 'sz-vinyl', b.xs(s, 0.20), H * 0.36, H * 0.30, 0, '#c9634f');
          b.slot(b.xs(s, 0.62), H * 0.55, H * 0.36, 0.78, 3, RISS);
          b.st('hinten', 'washi1', b.xs(s, 0.80), H * 0.16, H * 0.12, -14, '#7a5c40', 0.85);
          b.st('vorne', 'hd-herz', b.xs(s, 0.14), H * 0.72, H * 0.07, -8, '#ffffff');
          tape('vorne', 'ZU LAUT GEDACHT', b.xs(s, 0.36), H * 0.87, H * 0.030);
        },
        (s) => {
          b.slot(b.xs(s, 0.46), H * 0.44, H * 0.40, 0.82, -2, RISS);
          b.st('vorne', 'fe-torte', b.xs(s, 0.80), H * 0.72, H * 0.16, 5, '#d98a96');
          tape('hinten', 'HEUTE NACHT VIELLEICHT', b.xs(s, 0.46), H * 0.83, H * 0.034, '#1e1b18');
          b.st('hinten', 'heart-line', b.xs(s, 0.14), H * 0.22, H * 0.09, -10, '#ffffff');
        },
        (s) => {
          b.slot(b.xs(s, 0.30), H * 0.38, H * 0.30, 0.78, -6, RISS);
          b.slot(b.xs(s, 0.64), H * 0.66, H * 0.31, 0.80, 4, RISS);
          b.st('hinten', 'sz-ipod', b.xs(s, 0.84), H * 0.30, H * 0.26, 8);
          b.st('vorne', 'sz-xxx', b.xs(s, 0.16), H * 0.80, H * 0.036, 0, '#ffffff');
        },
        (s) => {
          b.slot(b.xs(s, 0.52), H * 0.50, H * 0.40, 0.80, 3, RISS);
          b.st('hinten', 're-kamera', b.xs(s, 0.16), H * 0.26, H * 0.12, -10, '#3a3733');
          tape('vorne', 'ZWISCHEN DEN ZEILEN', b.xs(s, 0.52), H * 0.14, H * 0.030, '#c96a78');
          b.st('vorne', 'star', b.xs(s, 0.86), H * 0.80, H * 0.05, 0, '#d8a935');
        },
        (s) => {
          b.slot(b.xs(s, 0.34), H * 0.58, H * 0.33, 0.78, 5, RISS);
          b.slot(b.xs(s, 0.70), H * 0.34, H * 0.27, 0.82, -5, RISS);
          b.st('vorne', 'sz-kussmund', b.xs(s, 0.16), H * 0.18, H * 0.09, -10);
          b.st('vorne', 'sz-klee', b.xs(s, 0.87), H * 0.72, H * 0.07, 8);
        },
        (s) => {
          b.slot(b.xs(s, 0.48), H * 0.46, H * 0.38, 0.80, -3, RISS);
          b.tx('vorne', 'heute Nacht vielleicht …', b.xs(s, 0.48), H * 0.80, H * 0.055,
            { font: 'La Belle Aurore', color: '#ffffff' });
          b.st('vorne', 'hd-unterstrich', b.xs(s, 0.48), H * 0.85, H * 0.05, 0, '#ffffff');
          b.st('hinten', 'star', b.xs(s, 0.14), H * 0.30, H * 0.05, -14, '#d8a935');
        },
      ]);
      jeKante(b, [
        (e) => b.st('hinten', 'sz-discokugel', e * b.sw, H * 0.16, H * 0.26, 0),
        (e) => b.st('vorne', 'washi2', e * b.sw, H * 0.74, H * 0.13, -8, '#7a5c40', 0.85),
        (e) => {
          b.st('vorne', 'star', e * b.sw - H * 0.04, H * 0.24, H * 0.05, 10, '#d8a935');
          b.st('vorne', 'star', e * b.sw + H * 0.05, H * 0.30, H * 0.035, -12, '#d8a935');
        },
        (e) => b.st('vorne', 'hd-kringel', e * b.sw, H * 0.86, H * 0.08, 0, '#ffffff'),
        (e) => b.st('vorne', 'hd-kringel', e * b.sw, H * 0.20, H * 0.09, 12, '#ffffff'),
        (e) => b.st('vorne', 'hd-herz', e * b.sw, H * 0.70, H * 0.06, 10, '#ffffff'),
      ]);
      return b;
    },
  });

  /* ===== 2. Pastell-Wochenende (Vorbild sumin.creates) ===== */
  SZENEN2.push({
    id: 'sz-wochenende', name: 'Wochenende', bg: 'sl-pastellhimmel',
    hint: 'Weiße Polaroids, rosa Handschrift, Objektiv und Kirschen – zuckersüß',
    slides: 7, format: '1:1',
    bauen(k) {
      const b = neuBau(k), H = b.H;
      const rosa = '#e58fa2';
      const schrift = (z, text, x, y, size, rot) => b.tx(z, text, x, y, size,
        { font: 'Caveat', color: rosa, rot: rot || 0 });
      jeSlide(b, [
        (s) => {
          b.slot(b.xs(s, 0.36), H * 0.42, H * 0.34, 0.80, -6, POLW);
          b.st('vorne', 'washi1', b.xs(s, 0.36), H * 0.235, H * 0.09, -10, '#f2c3cf', 0.9);
          schrift('vorne', 'Wochenende ♡', b.xs(s, 0.66), H * 0.70, H * 0.065, -4);
          b.st('vorne', 'bl-kirschbluete-rosa', b.xs(s, 0.82), H * 0.24, H * 0.08, 10);
        },
        (s) => {   /* senkrechter Filmstreifen */
          b.slot(b.xs(s, 0.34), H * 0.26, H * 0.24, 0.78, -2, FILM);
          b.slot(b.xs(s, 0.35), H * 0.53, H * 0.24, 0.78, -2, FILM);
          b.slot(b.xs(s, 0.36), H * 0.80, H * 0.24, 0.78, -2, FILM);
          schrift('hinten', '#1', b.xs(s, 0.70), H * 0.22, H * 0.09, 6);
          b.st('vorne', 'sz-kirschen', b.xs(s, 0.76), H * 0.62, H * 0.10, 5);
        },
        (s) => {
          b.slot(b.xs(s, 0.52), H * 0.48, H * 0.40, 0.84, 2, { style: 'rounded', radius: 22, keyline: false });
          b.st('vorne', 'sz-objektiv', b.xs(s, 0.26), H * 0.72, H * 0.26, 0);
          b.st('hinten', 'cloud', b.xs(s, 0.82), H * 0.15, H * 0.08, 0, '#ffffff');
        },
        (s) => {
          b.st('hinten', 'sz-sonne', b.xs(s, 0.20), H * 0.16, H * 0.14, 0);
          schrift('hinten', 'der beste Tag', b.xs(s, 0.60), H * 0.13, H * 0.055, -3);
          b.slot(b.xs(s, 0.36), H * 0.56, H * 0.32, 0.78, 4, POLW);
          b.slot(b.xs(s, 0.72), H * 0.42, H * 0.28, 0.80, -5, POLW);
        },
        (s) => {   /* drei breite Streifen übereinander */
          b.slot(b.xs(s, 0.5), H * 0.26, H * 0.21, 1.9, 0, { style: 'thin', border: 12 });
          b.slot(b.xs(s, 0.5), H * 0.52, H * 0.21, 1.9, 0, { style: 'thin', border: 12 });
          b.slot(b.xs(s, 0.5), H * 0.78, H * 0.21, 1.9, 0, { style: 'thin', border: 12 });
          b.st('vorne', 'bl-margerite-weiss', b.xs(s, 0.12), H * 0.14, H * 0.08, -8);
        },
        (s) => {
          b.slot(b.xs(s, 0.34), H * 0.44, H * 0.31, 0.78, -4, POLW);
          b.slot(b.xs(s, 0.68), H * 0.64, H * 0.30, 0.80, 5, POLW);
          schrift('vorne', 'MVP!!!', b.xs(s, 0.76), H * 0.22, H * 0.07, 8);
          b.st('vorne', 'sz-kirschen', b.xs(s, 0.14), H * 0.78, H * 0.09, -8);
        },
        (s) => {
          b.slot(b.xs(s, 0.48), H * 0.48, H * 0.38, 0.80, 3, POLW);
          schrift('vorne', 'bis Montag ♡', b.xs(s, 0.48), H * 0.84, H * 0.06, -2);
          b.st('vorne', 'bl-kirschbluete-rosa', b.xs(s, 0.83), H * 0.28, H * 0.08, 12);
        },
      ]);
      jeKante(b, [
        (e) => b.st('vorne', 'bl-kirschbluete-rosa', e * b.sw, H * 0.20, H * 0.075, -8),
        (e) => b.st('hinten', 'cloud', e * b.sw, H * 0.12, H * 0.085, 0, '#ffffff'),
        (e) => b.st('vorne', 'heart-fill', e * b.sw, H * 0.76, H * 0.05, 10, rosa),
        (e) => b.st('vorne', 'bl-margerite-gelb', e * b.sw, H * 0.86, H * 0.08, 6),
        (e) => b.st('vorne', 'sz-kirschen', e * b.sw, H * 0.30, H * 0.08, 6),
        (e) => b.st('hinten', 'cloud', e * b.sw, H * 0.15, H * 0.08, 0, '#ffffff'),
      ]);
      return b;
    },
  });

  /* ===== 3. Feed 509 (Vorbild nisathalha) – 4:5, 5 Slides ===== */
  SZENEN2.push({
    id: 'sz-feed509', name: 'Feed 509', bg: 'sl-filmtag',
    hint: 'Dunkle Filmrahmen und Fotoautomat-Spalten auf Hügeln – 5 Slides in 4:5',
    slides: 5, format: '4:5',
    bauen(k) {
      const b = neuBau(k), H = b.H;
      jeSlide(b, [
        (s) => {
          b.slot(b.xs(s, 0.54), H * 0.34, H * 0.42, 0.82, 0, DUNKEL);
          b.slot(b.xs(s, 0.24), H * 0.80, H * 0.155, 0.78, 0, FILM);
          b.slot(b.xs(s, 0.50), H * 0.805, H * 0.155, 0.78, 0, FILM);
          b.slot(b.xs(s, 0.76), H * 0.80, H * 0.155, 0.78, 0, FILM);
          b.st('vorne', 'star', b.xs(s, 0.12), H * 0.14, H * 0.045, -10, '#d8a935');
          b.st('vorne', 'washi2', b.xs(s, 0.14), H * 0.60, H * 0.08, -18, '#e5c46a', 0.9);
        },
        (s) => {
          b.slot(b.xs(s, 0.48), H * 0.42, H * 0.52, 0.80, 0, DUNKEL);
          b.tx('vorne', 'MELDE DICH BEI MIR ♡', b.xs(s, 0.48), H * 0.755, H * 0.026, {
            font: 'Poppins', color: '#ffffff', bgStyle: 'pill',
            bgColor: '#6f9ed4', bgAlpha: 0.96, letterSpacing: 2, rot: -3,
          });
          b.st('vorne', 'sz-kirschen', b.xs(s, 0.82), H * 0.86, H * 0.075, 6);
        },
        (s) => {   /* Fotoautomat: zwei Spalten à drei Bilder */
          for (let j = 0; j < 3; j++) {
            b.slot(b.xs(s, 0.30), H * (0.20 + j * 0.255), H * 0.20, 0.80, 0, FILM);
            b.slot(b.xs(s, 0.66), H * (0.30 + j * 0.255), H * 0.20, 0.80, 0, FILM);
          }
          b.st('vorne', 'sz-klee', b.xs(s, 0.88), H * 0.10, H * 0.055, 8);
        },
        (s) => {
          b.slot(b.xs(s, 0.38), H * 0.38, H * 0.46, 0.80, 0, DUNKEL);
          b.slot(b.xs(s, 0.79), H * 0.28, H * 0.185, 0.80, 0, FILM);
          b.slot(b.xs(s, 0.79), H * 0.50, H * 0.185, 0.80, 0, FILM);
          for (let j = 0; j < 5; j++) {
            b.st('vorne', 'heart-fill', b.xs(s, 0.20 + j * 0.075), H * 0.755, H * 0.032, 0, '#c2413b');
          }
          b.st('vorne', 'star', b.xs(s, 0.88), H * 0.70, H * 0.045, 14, '#d8a935');
        },
        (s) => {
          b.slot(b.xs(s, 0.52), H * 0.40, H * 0.48, 0.82, 0, DUNKEL);
          b.st('vorne', 'sz-telefon', b.xs(s, 0.15), H * 0.16, H * 0.10, -14);
          b.st('vorne', 'star', b.xs(s, 0.84), H * 0.13, H * 0.05, 8, '#d8a935');
          b.tx('vorne', 'bis bald', b.xs(s, 0.52), H * 0.80, H * 0.038,
            { font: 'Caveat', color: '#3d4a3a' });
        },
      ]);
      jeKante(b, [
        (e) => SS._filmstreifenSlots(b, e * b.sw, H * 0.46, 3, H * 0.185, 0, true),
        (e) => b.st('vorne', 'star', e * b.sw, H * 0.16, H * 0.05, 10, '#d8a935'),
        (e) => SS._filmstreifenSlots(b, e * b.sw, H * 0.48, 3, H * 0.175, 0, true),
        (e) => b.st('vorne', 'sz-kirschen', e * b.sw, H * 0.87, H * 0.075, -6),
      ]);
      return b;
    },
  });

  /* ===== 4. Mixtape (eigene Komposition) ===== */
  SZENEN2.push({
    id: 'sz-mixtape', name: 'Mixtape', bg: 'tx-leinen-1',
    hint: 'Kassetten, Vinyl mit Foto-Label und eine handschriftliche Titelliste',
    slides: 7, format: '1:1',
    bauen(k) {
      const b = neuBau(k), H = b.H;
      const titel = (z, nr, text, x, y) => {
        b.tx(z, nr + '  ' + text, x, y, H * 0.040, { font: 'Caveat', color: '#4a4238', rot: -1 });
        b.st(z, 'hd-unterstrich', x, y + H * 0.035, H * 0.035, 0, '#b9a27a', 0.7);
      };
      jeSlide(b, [
        (s) => {
          b.tx('hinten', 'MIXTAPE', b.xs(s, 0.5), H * 0.12, H * 0.075,
            { font: 'Anton', color: '#3d362e', letterSpacing: 3 });
          b.tx('hinten', 'Lieder für gute Tage', b.xs(s, 0.5), H * 0.195, H * 0.038,
            { font: 'Caveat', color: '#8a6b52' });
          b.st('hinten', 'sz-kassette', b.xs(s, 0.5), H * 0.44, H * 0.22, -3, '#4a5568');
          b.slot(b.xs(s, 0.5), H * 0.75, H * 0.28, 0.80, 3, POLW);
        },
        (s) => {
          b.st('hinten', 'sz-vinyl', b.xs(s, 0.34), H * 0.38, H * 0.40, 0, '#c9634f');
          b.slot(b.xs(s, 0.34), H * 0.38, H * 0.145, 1, 0, { style: 'circle', shadow: 20 });
          titel('vorne', '01', 'unser Lied', b.xs(s, 0.72), H * 0.66);
          b.st('vorne', 'sz-note', b.xs(s, 0.80), H * 0.20, H * 0.07, 8, '#4a4238');
        },
        (s) => {
          b.slot(b.xs(s, 0.38), H * 0.40, H * 0.34, 0.78, -5, POLW);
          b.st('vorne', 'washi3', b.xs(s, 0.38), H * 0.215, H * 0.08, -12, '#c9a2a2', 0.9);
          titel('vorne', '02', 'laut gesungen', b.xs(s, 0.70), H * 0.72);
          b.st('hinten', 'sz-note', b.xs(s, 0.14), H * 0.76, H * 0.06, -8, '#8a6b52');
        },
        (s) => {
          b.st('hinten', 'sz-kassette', b.xs(s, 0.62), H * 0.30, H * 0.20, 5, '#8a5a5f');
          b.slot(b.xs(s, 0.40), H * 0.62, H * 0.32, 0.80, 4, POLW);
          titel('vorne', '03', 'im Auto, Fenster auf', b.xs(s, 0.66), H * 0.85);
        },
        (s) => {
          b.slot(b.xs(s, 0.30), H * 0.42, H * 0.30, 0.78, -4, POLW);
          b.slot(b.xs(s, 0.66), H * 0.60, H * 0.31, 0.80, 6, POLW);
          b.st('vorne', 'sz-player', b.xs(s, 0.5), H * 0.885, H * 0.46, 0, '#8a6b52');
        },
        (s) => {
          b.st('hinten', 'sz-vinyl', b.xs(s, 0.70), H * 0.34, H * 0.34, 0, '#5f7a8a');
          b.slot(b.xs(s, 0.70), H * 0.34, H * 0.125, 1, 0, { style: 'circle', shadow: 20 });
          b.slot(b.xs(s, 0.32), H * 0.60, H * 0.32, 0.78, -3, POLW);
          titel('vorne', '04', 'zum Mitwippen', b.xs(s, 0.60), H * 0.82);
        },
        (s) => {
          b.slot(b.xs(s, 0.46), H * 0.46, H * 0.36, 0.80, 2, POLW);
          b.tx('vorne', 'Seite B folgt …', b.xs(s, 0.46), H * 0.82, H * 0.05,
            { font: 'Caveat', color: '#4a4238' });
          b.st('vorne', 'sz-note', b.xs(s, 0.82), H * 0.24, H * 0.065, 10, '#8a6b52');
        },
      ]);
      jeKante(b, [
        (e) => b.st('hinten', 'hairline', e * b.sw, H * 0.5, H * 0.2, 0, '#b9a27a', 0.7),
        (e) => b.st('vorne', 'sz-note', e * b.sw, H * 0.18, H * 0.06, -6, '#8a6b52'),
        (e) => b.st('hinten', 'hairline', e * b.sw, H * 0.30, H * 0.18, 0, '#b9a27a', 0.6),
        (e) => b.st('vorne', 'sz-note', e * b.sw, H * 0.78, H * 0.055, 8, '#4a4238'),
      ]);
      return b;
    },
  });

  /* ===== 5. Konzertnacht (eigene Komposition) ===== */
  SZENEN2.push({
    id: 'sz-konzert', name: 'Konzertnacht', bg: 'sl-milchstrasse',
    hint: 'Tickets, schwarze Polaroids und Filmstreifen unter der Milchstraße',
    slides: 7, format: '1:1',
    bauen(k) {
      const b = neuBau(k), H = b.H;
      const gold = '#e8c76a';
      jeSlide(b, [
        (s) => {
          b.tx('hinten', 'LIVE', b.xs(s, 0.5), H * 0.14, H * 0.10,
            { font: 'Bebas Neue', color: gold, letterSpacing: 8 });
          b.tx('hinten', 'die beste Nacht des Jahres', b.xs(s, 0.5), H * 0.225, H * 0.04,
            { font: 'Caveat', color: '#f2e6c4' });
          b.slot(b.xs(s, 0.5), H * 0.58, H * 0.36, 0.80, -3, POLB);
          b.st('vorne', 're-ticket', b.xs(s, 0.82), H * 0.82, H * 0.10, 12, gold);
        },
        (s) => {
          b.slot(b.xs(s, 0.34), H * 0.44, H * 0.31, 0.78, 4, POLB);
          b.slot(b.xs(s, 0.70), H * 0.66, H * 0.29, 0.80, -5, POLB);
          b.st('hinten', 'sz-discokugel', b.xs(s, 0.82), H * 0.16, H * 0.20, 0);
        },
        (s) => {
          b.slot(b.xs(s, 0.30), H * 0.32, H * 0.26, 0.75, -2, FILM);
          b.slot(b.xs(s, 0.31), H * 0.62, H * 0.26, 0.75, -2, FILM);
          b.slot(b.xs(s, 0.70), H * 0.48, H * 0.34, 0.80, 5, POLB);
          b.st('vorne', 'sz-barcode', b.xs(s, 0.82), H * 0.86, H * 0.07, -6);
        },
        (s) => {
          b.slot(b.xs(s, 0.5), H * 0.48, H * 0.40, 0.80, 2, POLB);
          b.st('vorne', 'star', b.xs(s, 0.16), H * 0.22, H * 0.05, -10, gold);
          b.st('vorne', 'star', b.xs(s, 0.84), H * 0.26, H * 0.04, 14, gold);
          b.tx('vorne', 'Zugabe! Zugabe!', b.xs(s, 0.5), H * 0.82, H * 0.045,
            { font: 'Caveat', color: '#f2e6c4', rot: -2 });
        },
        (s) => {
          b.slot(b.xs(s, 0.36), H * 0.58, H * 0.33, 0.78, -6, POLB);
          b.st('hinten', 'sz-vinyl', b.xs(s, 0.74), H * 0.32, H * 0.28, 0, '#8a5a5f');
          b.st('vorne', 're-ticket', b.xs(s, 0.16), H * 0.18, H * 0.09, -15, gold);
        },
        (s) => {
          b.slot(b.xs(s, 0.32), H * 0.36, H * 0.28, 0.80, 4, POLB);
          b.slot(b.xs(s, 0.66), H * 0.62, H * 0.32, 0.78, -4, POLB);
          b.st('vorne', 'sz-note', b.xs(s, 0.86), H * 0.22, H * 0.07, 10, gold);
        },
        (s) => {
          b.slot(b.xs(s, 0.48), H * 0.50, H * 0.38, 0.80, 3, POLB);
          b.tx('vorne', 'bis zum nächsten Mal ✦', b.xs(s, 0.48), H * 0.845, H * 0.048,
            { font: 'Great Vibes', color: '#f2e6c4' });
        },
      ]);
      jeKante(b, [
        (e) => SS._filmstreifenSlots(b, e * b.sw, H * 0.80, 3, H * 0.19, -6, false),
        (e) => b.st('hinten', 'sp-sternbild', e * b.sw, H * 0.18, H * 0.14, 10, '#cfe0ff', 0.85),
        (e) => b.st('vorne', 'star', e * b.sw, H * 0.26, H * 0.05, 8, gold),
        (e) => SS._filmstreifenSlots(b, e * b.sw, H * 0.24, 3, H * 0.18, 5, false),
        (e) => b.st('hinten', 'sparkle', e * b.sw, H * 0.70, H * 0.04, 0, '#f2e6c4'),
        (e) => b.st('hinten', 'sp-sternbild', e * b.sw, H * 0.74, H * 0.12, -8, '#cfe0ff', 0.75),
      ]);
      return b;
    },
  });

  /* ===== 6. Picknick (eigene Komposition) ===== */
  SZENEN2.push({
    id: 'sz-picknick', name: 'Picknick', bg: 'sl-wiese',
    hint: 'Torte, Kirschen und Sonnengesicht auf der Blumenwiese',
    slides: 7, format: '1:1',
    bauen(k) {
      const b = neuBau(k), H = b.H;
      const rosa = '#d98a96';
      jeSlide(b, [
        (s) => {
          b.st('hinten', 'sz-sonne', b.xs(s, 0.18), H * 0.15, H * 0.15, 0);
          b.tx('hinten', 'Picknick ♡', b.xs(s, 0.62), H * 0.14, H * 0.065,
            { font: 'Pacifico', color: '#b0705f', rot: -3 });
          b.slot(b.xs(s, 0.44), H * 0.52, H * 0.36, 0.80, -4, POLW);
          b.st('vorne', 'sz-kirschen', b.xs(s, 0.80), H * 0.72, H * 0.10, 8);
        },
        (s) => {
          b.slot(b.xs(s, 0.32), H * 0.44, H * 0.30, 0.78, 5, POLW);
          b.slot(b.xs(s, 0.68), H * 0.64, H * 0.31, 0.80, -4, POLW);
          b.st('vorne', 'fe-torte', b.xs(s, 0.82), H * 0.26, H * 0.14, 6, rosa);
        },
        (s) => {
          b.slot(b.xs(s, 0.5), H * 0.46, H * 0.38, 1.3, 2, POLW);
          b.st('vorne', 'butterfly', b.xs(s, 0.82), H * 0.20, H * 0.08, 12, '#c98da2');
          b.st('vorne', 'bl-margerite-weiss', b.xs(s, 0.14), H * 0.82, H * 0.10, -6);
        },
        (s) => {
          b.slot(b.xs(s, 0.36), H * 0.58, H * 0.33, 0.78, -5, POLW);
          b.slot(b.xs(s, 0.72), H * 0.36, H * 0.27, 0.80, 6, POLW);
          b.st('vorne', 'ca-picknick', b.xs(s, 0.16), H * 0.20, H * 0.12, -8, '#b0705f');
        },
        (s) => {
          b.slot(b.xs(s, 0.5), H * 0.48, H * 0.40, 0.80, 3, POLW);
          b.st('vorne', 'clip', b.xs(s, 0.38), H * 0.26, H * 0.06, -12, '#b08d5a');
          b.st('vorne', 'sz-kirschen', b.xs(s, 0.84), H * 0.80, H * 0.09, -6);
        },
        (s) => {
          b.slot(b.xs(s, 0.34), H * 0.40, H * 0.29, 0.80, -4, POLW);
          b.slot(b.xs(s, 0.68), H * 0.62, H * 0.32, 0.78, 5, POLW);
          b.st('vorne', 'ca-erdbeere', b.xs(s, 0.14), H * 0.78, H * 0.08, 8, '#c2413b');
        },
        (s) => {
          b.slot(b.xs(s, 0.48), H * 0.50, H * 0.37, 0.80, -2, POLW);
          b.tx('vorne', 'schön war’s ♡', b.xs(s, 0.48), H * 0.84, H * 0.058,
            { font: 'Caveat', color: '#b0705f' });
        },
      ]);
      jeKante(b, [
        (e) => b.st('vorne', 'butterfly', e * b.sw, H * 0.24, H * 0.07, -10, '#c9a15f'),
        (e) => b.st('hinten', 'cloud', e * b.sw, H * 0.12, H * 0.08, 0, '#ffffff', 0.9),
        (e) => b.st('vorne', 'bl-kirschbluete-rosa', e * b.sw, H * 0.86, H * 0.09, 8),
        (e) => b.st('vorne', 'sz-vogel', e * b.sw, H * 0.16, H * 0.05, 0, '#5d5348'),
        (e) => b.st('vorne', 'bl-margerite-gelb', e * b.sw, H * 0.88, H * 0.08, -5),
        (e) => b.st('vorne', 'butterfly', e * b.sw, H * 0.28, H * 0.06, 12, '#c98da2'),
      ]);
      return b;
    },
  });

  /* ============================== In den Szenen-Katalog und ins Panel hängen
     SS.ui.szeneVorlageAnwenden sucht in SS.SZENEN – nachschieben genügt.
     Nur die Kacheln müssen selbst gebaut werden (der Kachel-Bauer in
     szenen7.js läuft einmal beim Laden); gleiche Optik wie dort. */
  SZENEN2.forEach(s => SS.SZENEN.push(s));
  if (SS.SZENEN7) {
    SS.SZENEN7.anzahl = SS.SZENEN.length;
    SS.SZENEN7.ids = SS.SZENEN.map(s => s.id);
  }

  (function () {
    const raster = document.getElementById('szenenGrid');
    if (!raster) return;
    for (const S of SZENEN2) {
      const sw = document.createElement('button');
      sw.className = 'swatch';
      const cv = document.createElement('canvas');
      cv.width = 135; cv.height = 168;
      const c = cv.getContext('2d');
      const bg = SS.BG_LIB && SS.BG_LIB.find(x => x.id === S.bg);
      if (bg && bg.paint) { try { bg.paint(c, 135, 168); } catch (e) { c.fillStyle = '#ddd'; c.fillRect(0, 0, 135, 168); } }
      try {
        const H0 = S.format === '4:5' ? 1350 : 1080;
        const kMini = { W: (S.slides || 7) * 1080, H: H0, slideW: 1080, n: S.slides || 7 };
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

  SS.SZENEN74 = { bereit: true, szenen: SZENEN2.length, sticker: NEU.length };
})();
