/* Seamless Studio – Objekt-Rahmen (v7.5)
   ============================================================================
   Fünf Rahmen, die aus jedem Foto ein Retro-Objekt machen – auf Scotts
   Wunsch dieselben Motive, die bisher nur Sticker oder Szenen-Bausteine
   waren, jetzt als ECHTE Rahmenstile für jedes Foto und jeden Platzhalter:

     filmhoch   Filmstreifen-Einzelbild, Lochreihen LINKS und RECHTS
                (das vorhandene `film` hat sie oben und unten – zusammen
                lassen sich damit waagerechte UND senkrechte Streifen legen)
     cd         das Foto ist das Platten-Label, außen die schimmernde CD
     browser    Browser-Fenster: Kopfzeile mit drei Punkten und Adresszeile
     tv         Retro-Fernseher: Foto als Bildschirm, Antenne, Knöpfe, Füße
     kamera     Retro-Kamera: Foto rund im Objektiv, Gehäuse mit Blitz

   Wie rahmen7.js: SS.buildCard wird umschlossen, die neuen Namen zeichnen
   hier, alles andere läuft unverändert durch das Original. Weil auch die
   Platzhalter-Karten (platzhalter7.js) durch SS.buildCard laufen, zeigen
   leere Plätze automatisch das Objekt mit gestrichelter Fläche darin.

   `frame.color` färbt bei tv/kamera das Gehäuse, bei browser die Kopfzeile,
   bei cd das ungenutzte Randlicht; `frame.border` skaliert die Randstärke.
   ========================================================================= */

(function () {
  if (!SS.FRAMES || typeof SS.buildCard !== 'function') return;
  const TAU = Math.PI * 2;

  const NEU = [
    { id: 'filmhoch', name: 'Filmstreifen hoch' },
    { id: 'cd',       name: 'CD' },
    { id: 'browser',  name: 'Browser' },
    { id: 'tv',       name: 'Retro-TV' },
    { id: 'kamera',   name: 'Retro-Kamera' },
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
  /* Foto formatfüllend in einen Kreis zeichnen (wie der circle-Rahmen) */
  function fotoInKreis(c, srcCanvas, cx, cy, r) {
    c.save();
    c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.clip();
    const sc = Math.max((r * 2) / srcCanvas.width, (r * 2) / srcCanvas.height);
    c.drawImage(srcCanvas, cx - srcCanvas.width * sc / 2, cy - srcCanvas.height * sc / 2,
      srcCanvas.width * sc, srcCanvas.height * sc);
    c.restore();
  }

  const alt = SS.buildCard;
  SS.buildCard = function (el, srcCanvas, h) {
    const f = el && el.frame;
    const stil = f && f.style;
    if (!stil || !MEINE.has(stil)) return alt.apply(this, arguments);

    const ar = srcCanvas.width / srcCanvas.height;
    const w = h * ar;
    const pad = 6;

    /* ---------------- Filmstreifen hoch: Löcher links und rechts -------- */
    if (stil === 'filmhoch') {
      const fb = Math.max(18, f.border || 20);
      const cv = document.createElement('canvas');
      cv.width = Math.ceil(w + fb * 2 + pad * 2);
      cv.height = Math.ceil(h + fb * 2 + pad * 2);
      const c = cv.getContext('2d');
      c.fillStyle = '#1c1a18';
      c.fillRect(pad, pad, w + fb * 2, h + fb * 2);
      c.save(); c.globalCompositeOperation = 'destination-out';
      const hw = fb * 0.36, hh = fb * 0.5, stepF = hh * 2.2;
      for (let y = pad + fb * 0.6; y < pad + h + fb * 1.4; y += stepF) {
        rp(c, pad + fb * 0.28, y, hw, hh, 3); c.fill();
        rp(c, pad + w + fb * 2 - fb * 0.28 - hw, y, hw, hh, 3); c.fill();
      }
      c.restore();
      c.drawImage(srcCanvas, pad + fb, pad + fb, w, h);
      return cv;
    }

    /* ---------------- CD: Foto als Platten-Label ------------------------ */
    if (stil === 'cd') {
      const lr = Math.min(w, h) / 2;                 // Label-Radius
      const R = lr * 2.05;                           // Scheibenradius
      const cv = document.createElement('canvas');
      cv.width = cv.height = Math.ceil(R * 2 + pad * 2 + 8);
      const c = cv.getContext('2d');
      const cx = cv.width / 2, cy = cv.height / 2;
      c.save();
      c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.clip();
      c.fillStyle = '#dedad2'; c.fillRect(0, 0, cv.width, cv.height);
      const seg = ['#e8c9c4', '#e6dbc0', '#c9d8c4', '#c2cfe0', '#d8c6dd'];
      for (let i = 0; i < 10; i++) {
        c.fillStyle = seg[i % seg.length];
        c.globalAlpha = 0.5;
        c.beginPath(); c.moveTo(cx, cy);
        c.arc(cx, cy, R, (i / 10) * TAU + 0.5, ((i + 0.7) / 10) * TAU + 0.5);
        c.closePath(); c.fill();
      }
      c.globalAlpha = 1;
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) {
        c.beginPath(); c.arc(cx, cy, R * (0.55 + i * 0.075), 0, TAU); c.stroke();
      }
      c.restore();
      /* Label = Foto */
      fotoInKreis(c, srcCanvas, cx, cy, lr);
      c.strokeStyle = 'rgba(120,110,95,.55)'; c.lineWidth = Math.max(2, R * 0.012);
      c.beginPath(); c.arc(cx, cy, lr, 0, TAU); c.stroke();
      c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
      /* Mittelloch */
      c.fillStyle = '#f2efe8';
      c.beginPath(); c.arc(cx, cy, lr * 0.16, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(90,82,70,.6)'; c.lineWidth = Math.max(2, R * 0.010);
      c.beginPath(); c.arc(cx, cy, lr * 0.16, 0, TAU); c.stroke();
      /* Glanz */
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = R * 0.05;
      c.beginPath(); c.arc(cx, cy, R * 0.82, -2.4, -1.75); c.stroke();
      return cv;
    }

    /* ---------------- Browser-Fenster ----------------------------------- */
    if (stil === 'browser') {
      const rand = Math.max(6, (f.border || 14) * 0.5);
      const kopf = Math.max(34, h * 0.11);
      const cv = document.createElement('canvas');
      cv.width = Math.ceil(w + rand * 2 + pad * 2);
      cv.height = Math.ceil(h + kopf + rand * 2 + pad * 2);
      const c = cv.getContext('2d');
      const rr0 = Math.max(10, kopf * 0.35);
      c.fillStyle = '#ffffff';
      rp(c, pad, pad, w + rand * 2, h + kopf + rand * 2, rr0); c.fill();
      c.strokeStyle = 'rgba(90,80,66,.35)'; c.lineWidth = Math.max(2, kopf * 0.05);
      rp(c, pad, pad, w + rand * 2, h + kopf + rand * 2, rr0); c.stroke();
      /* Kopfzeile */
      c.save();
      rp(c, pad, pad, w + rand * 2, kopf, rr0); c.clip();
      c.fillStyle = f.color && f.color !== '#fdfbf8' ? f.color : '#e8e2d6';
      c.fillRect(pad, pad, w + rand * 2, kopf);
      c.restore();
      c.strokeStyle = 'rgba(90,80,66,.25)'; c.lineWidth = Math.max(1.5, kopf * 0.04);
      c.beginPath(); c.moveTo(pad, pad + kopf); c.lineTo(pad + w + rand * 2, pad + kopf); c.stroke();
      const pk = ['#d98a7f', '#e5c07b', '#a3be8c'];
      pk.forEach((farbe, i) => {
        c.fillStyle = farbe;
        c.beginPath();
        c.arc(pad + kopf * 0.5 + i * kopf * 0.5, pad + kopf / 2, kopf * 0.16, 0, TAU);
        c.fill();
      });
      c.fillStyle = 'rgba(255,255,255,.9)';
      rp(c, pad + kopf * 2.0, pad + kopf * 0.22, (w + rand * 2) * 0.52, kopf * 0.56, kopf * 0.28);
      c.fill();
      c.strokeStyle = 'rgba(90,80,66,.22)'; c.lineWidth = Math.max(1, kopf * 0.03);
      rp(c, pad + kopf * 2.0, pad + kopf * 0.22, (w + rand * 2) * 0.52, kopf * 0.56, kopf * 0.28);
      c.stroke();
      /* Foto */
      c.drawImage(srcCanvas, pad + rand, pad + kopf + rand * 0.4, w, h);
      return cv;
    }

    /* ---------------- Retro-TV ------------------------------------------ */
    if (stil === 'tv') {
      const g = Math.max(18, (f.border || 22));       // Gehäusestärke
      const knopf = Math.max(40, w * 0.16);           // Knopfleiste rechts
      const antenne = Math.max(40, h * 0.16);
      const fuss = Math.max(18, h * 0.07);
      const body = f.color && f.color !== '#fdfbf8' ? f.color : '#a8865f';
      const cv = document.createElement('canvas');
      cv.width = Math.ceil(w + g * 2 + knopf + pad * 2);
      cv.height = Math.ceil(h + g * 2 + antenne + fuss + pad * 2);
      const c = cv.getContext('2d');
      const bx = pad, by = pad + antenne;
      const bw = w + g * 2 + knopf, bh = h + g * 2;
      /* Antenne */
      const ax = bx + bw * 0.42;
      c.strokeStyle = '#6e6459'; c.lineWidth = Math.max(3, g * 0.22); c.lineCap = 'round';
      c.beginPath(); c.moveTo(ax, by + g * 0.3); c.lineTo(ax - antenne * 0.7, pad + antenne * 0.12); c.stroke();
      c.beginPath(); c.moveTo(ax, by + g * 0.3); c.lineTo(ax + antenne * 0.55, pad + antenne * 0.05); c.stroke();
      c.fillStyle = '#6e6459';
      c.beginPath(); c.arc(ax - antenne * 0.7, pad + antenne * 0.12, g * 0.22, 0, TAU); c.fill();
      c.beginPath(); c.arc(ax + antenne * 0.55, pad + antenne * 0.05, g * 0.22, 0, TAU); c.fill();
      /* Füße */
      c.strokeStyle = shade(body, -50); c.lineWidth = Math.max(4, g * 0.4);
      c.beginPath(); c.moveTo(bx + bw * 0.16, by + bh); c.lineTo(bx + bw * 0.10, by + bh + fuss); c.stroke();
      c.beginPath(); c.moveTo(bx + bw * 0.84, by + bh); c.lineTo(bx + bw * 0.90, by + bh + fuss); c.stroke();
      /* Gehäuse */
      const gr = c.createLinearGradient(0, by, 0, by + bh);
      gr.addColorStop(0, body); gr.addColorStop(1, shade(body, -34));
      c.fillStyle = gr;
      rp(c, bx, by, bw, bh, g * 0.8); c.fill();
      c.strokeStyle = 'rgba(40,32,24,.35)'; c.lineWidth = Math.max(2, g * 0.12);
      rp(c, bx, by, bw, bh, g * 0.8); c.stroke();
      /* Bildschirm = Foto, leicht gerundet */
      c.save();
      rp(c, bx + g, by + g, w, h, g * 0.6); c.clip();
      c.drawImage(srcCanvas, bx + g, by + g, w, h);
      c.restore();
      c.strokeStyle = 'rgba(20,16,12,.5)'; c.lineWidth = Math.max(2, g * 0.14);
      rp(c, bx + g, by + g, w, h, g * 0.6); c.stroke();
      /* Knopfleiste */
      const kx = bx + g + w + g * 0.35;
      c.fillStyle = 'rgba(35,28,20,.28)';
      rp(c, kx, by + g * 0.8, knopf - g * 0.7, bh - g * 1.6, g * 0.4); c.fill();
      c.fillStyle = '#efe6d6';
      c.beginPath(); c.arc(kx + (knopf - g * 0.7) / 2, by + bh * 0.28, Math.max(6, knopf * 0.17), 0, TAU); c.fill();
      c.beginPath(); c.arc(kx + (knopf - g * 0.7) / 2, by + bh * 0.52, Math.max(6, knopf * 0.17), 0, TAU); c.fill();
      c.strokeStyle = 'rgba(240,230,214,.7)'; c.lineWidth = Math.max(2, g * 0.1);
      for (let i = 0; i < 3; i++) {
        const ly = by + bh * 0.70 + i * bh * 0.07;
        c.beginPath(); c.moveTo(kx + knopf * 0.14, ly); c.lineTo(kx + knopf * 0.62, ly); c.stroke();
      }
      return cv;
    }

    /* ---------------- Retro-Kamera: Foto im Objektiv --------------------- */
    if (stil === 'kamera') {
      const d = Math.min(w, h);                       // Fotodurchmesser
      const ring = Math.max(14, (f.border || 22));
      const R = d / 2 + ring;                         // Objektiv außen
      const bw = R * 2 * 1.55, bh = R * 2 * 1.18;
      const top = Math.max(24, bh * 0.14);
      const body = f.color && f.color !== '#fdfbf8' ? f.color : '#4a4540';
      const cv = document.createElement('canvas');
      cv.width = Math.ceil(bw + pad * 2);
      cv.height = Math.ceil(bh + top + pad * 2);
      const c = cv.getContext('2d');
      const bx = pad, by = pad + top;
      /* Oberdeck: Auslöser und Blitz */
      c.fillStyle = shade(body, 26);
      rp(c, bx + bw * 0.08, pad, bw * 0.84, top * 1.4, top * 0.4); c.fill();
      c.fillStyle = shade(body, 60);
      rp(c, bx + bw * 0.14, pad + top * 0.15, bw * 0.12, top * 0.5, top * 0.2); c.fill();
      c.fillStyle = '#f2e6c4';
      rp(c, bx + bw * 0.70, pad + top * 0.12, bw * 0.16, top * 0.6, top * 0.16); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = Math.max(1.5, top * 0.06);
      rp(c, bx + bw * 0.70, pad + top * 0.12, bw * 0.16, top * 0.6, top * 0.16); c.stroke();
      /* Body */
      const gr = c.createLinearGradient(0, by, 0, by + bh);
      gr.addColorStop(0, shade(body, 14)); gr.addColorStop(1, shade(body, -26));
      c.fillStyle = gr;
      rp(c, bx, by, bw, bh, Math.max(14, bh * 0.10)); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = Math.max(2, bh * 0.014);
      rp(c, bx, by, bw, bh, Math.max(14, bh * 0.10)); c.stroke();
      /* Griffleiste links */
      c.fillStyle = 'rgba(0,0,0,.22)';
      rp(c, bx + bw * 0.035, by + bh * 0.10, bw * 0.10, bh * 0.80, bw * 0.03); c.fill();
      /* Sucher rechts oben */
      c.fillStyle = '#20242a';
      rp(c, bx + bw * 0.80, by + bh * 0.09, bw * 0.13, bh * 0.15, bh * 0.03); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = Math.max(1.5, bh * 0.01);
      rp(c, bx + bw * 0.80, by + bh * 0.09, bw * 0.13, bh * 0.15, bh * 0.03); c.stroke();
      /* Objektiv */
      const cx = bx + bw / 2, cy = by + bh * 0.55;
      c.fillStyle = shade(body, -50);
      c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(230,222,206,.55)'; c.lineWidth = Math.max(2, ring * 0.16);
      for (let i = 0; i < 42; i++) {
        const a = (i / 42) * TAU;
        c.beginPath();
        c.moveTo(cx + Math.cos(a) * (R - ring * 0.45), cy + Math.sin(a) * (R - ring * 0.45));
        c.lineTo(cx + Math.cos(a) * (R - ring * 0.08), cy + Math.sin(a) * (R - ring * 0.08));
        c.stroke();
      }
      /* Foto im Glas */
      fotoInKreis(c, srcCanvas, cx, cy, d / 2);
      c.strokeStyle = 'rgba(15,18,22,.65)'; c.lineWidth = Math.max(2, ring * 0.2);
      c.beginPath(); c.arc(cx, cy, d / 2, 0, TAU); c.stroke();
      /* Glas-Reflex über dem Foto, dezent */
      c.fillStyle = 'rgba(255,255,255,.14)';
      c.beginPath(); c.ellipse(cx - d * 0.16, cy - d * 0.20, d * 0.16, d * 0.08, -0.6, 0, TAU); c.fill();
      return cv;
    }

    return alt.apply(this, arguments);
  };

  SS.RAHMEN75 = { bereit: true, neu: NEU.map(n => n.id), rahmen_gesamt: SS.FRAMES.length };
})();
