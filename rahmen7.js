/* Seamless Studio – drei zusaetzliche Rahmen
   ============================================================================
   Fuer die neuen Vorlagen fehlten drei Rahmen, die in den Vorbildern immer
   wieder vorkommen:

     photobooth   schmaler weisser Streifen mit breitem Rand oben und unten,
                  wie ein Bild aus dem Fotoautomaten. Vier davon nebeneinander
                  ergeben den klassischen Streifen.
     riss         kraeftig ausgerissene Papierkante auf allen vier Seiten,
                  deutlich staerker als der vorhandene `torn`
     washi        zwei Klebestreifen ueber den Ecken, sichtbar und schief

   SS.buildCard ist eine grosse Fallunterscheidung ueber f.style und kennt
   diese Namen nicht. Statt die Funktion anzufassen wird sie umschlossen:
   fuer die neuen Namen wird hier gezeichnet, fuer alle anderen laeuft das
   Original unveraendert.
   ========================================================================= */

(function () {
  if (!SS.FRAMES || typeof SS.buildCard !== 'function') return;

  const NEU = [
    { id: 'photobooth', name: 'Fotoautomat' },
    { id: 'riss', name: 'Rissrand' },
    { id: 'washi', name: 'Washi-Tape' },
  ];
  for (const n of NEU) {
    if (!SS.FRAMES.some(f => (f.id || f) === n.id)) SS.FRAMES.push(n);
  }

  /* Ein wiederholbarer, aber stabiler Zufall: derselbe Rahmen sieht bei
     jedem Neuzeichnen gleich aus, sonst flackert er im Video. */
  function zufall(saat) {
    let x = saat * 16807 % 2147483647;
    return () => (x = x * 16807 % 2147483647) / 2147483647;
  }

  function saatVon(el) {
    const s = String(el && el.id || 'x');
    let n = 7;
    for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) % 100000;
    return n + 1;
  }

  /* ---------- Rissrand: unregelmaessige Kante als Pfad ---------- */
  function risspfad(c, x, y, w, h, tiefe, rnd) {
    const schritt = Math.max(6, Math.min(w, h) / 26);
    c.beginPath();
    const kante = (x0, y0, x1, y1) => {
      const laenge = Math.hypot(x1 - x0, y1 - y0);
      const n = Math.max(4, Math.round(laenge / schritt));
      const nx = (y1 - y0) / laenge, ny = -(x1 - x0) / laenge;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const abw = (i === 0 || i === n) ? 0 : (rnd() - 0.45) * tiefe;
        const px = x0 + (x1 - x0) * t + nx * abw;
        const py = y0 + (y1 - y0) * t + ny * abw;
        if (i === 0 && x0 === x && y0 === y) c.moveTo(px, py); else c.lineTo(px, py);
      }
    };
    kante(x, y, x + w, y);
    kante(x + w, y, x + w, y + h);
    kante(x + w, y + h, x, y + h);
    kante(x, y + h, x, y);
    c.closePath();
  }

  const alt = SS.buildCard;
  SS.buildCard = function (el, srcCanvas, h) {
    const f = el && el.frame;
    const stil = f && f.style;
    if (stil !== 'photobooth' && stil !== 'riss' && stil !== 'washi') {
      return alt.apply(this, arguments);
    }
    const ar = srcCanvas.width / srcCanvas.height;
    const w = h * ar;
    const rnd = zufall(saatVon(el));
    const rand = Math.max(6, f.border || 26);

    if (stil === 'photobooth') {
      /* Schmaler Streifen: seitlich wenig, oben und unten viel Rand –
         unten am meisten, wie beim Abriss aus dem Automaten. */
      const seite = rand * 0.55;
      const oben = rand * 0.75;
      const unten = rand * 2.4;
      const cw = Math.ceil(w + seite * 2), ch = Math.ceil(h + oben + unten);
      const cv = SS.makeCanvas(cw, ch);
      const c = cv.getContext('2d');
      c.fillStyle = f.color || '#fdfbf8';
      c.fillRect(0, 0, cw, ch);
      c.drawImage(srcCanvas, seite, oben, w, h);
      /* feine Perforation am unteren Rand */
      c.fillStyle = 'rgba(0,0,0,.10)';
      const lochR = Math.max(1.2, seite * 0.16);
      for (let x = lochR * 2; x < cw - lochR; x += lochR * 4) {
        c.beginPath(); c.arc(x, ch - unten * 0.30, lochR, 0, 7); c.fill();
      }
      if (f.keyline) {
        c.strokeStyle = 'rgba(0,0,0,.10)'; c.lineWidth = 1;
        c.strokeRect(seite - 0.5, oben - 0.5, w + 1, h + 1);
      }
      return cv;
    }

    if (stil === 'riss') {
      const tiefe = Math.max(5, rand * 0.62);
      const pad = Math.ceil(tiefe + rand + 4);
      const cw = Math.ceil(w + pad * 2), ch = Math.ceil(h + pad * 2);
      const cv = SS.makeCanvas(cw, ch);
      const c = cv.getContext('2d');
      /* Papier */
      c.save();
      risspfad(c, pad - rand, pad - rand, w + rand * 2, h + rand * 2, tiefe, rnd);
      c.fillStyle = f.color || '#fdfbf8';
      c.shadowColor = 'rgba(60,45,35,.28)';
      c.shadowBlur = rand * 0.7; c.shadowOffsetY = rand * 0.22;
      c.fill();
      c.restore();
      /* angerissene Faser: heller Saum innen */
      c.save();
      risspfad(c, pad - rand, pad - rand, w + rand * 2, h + rand * 2, tiefe, zufall(saatVon(el)));
      c.clip();
      c.globalAlpha = 0.5;
      c.strokeStyle = 'rgba(255,255,255,.9)';
      c.lineWidth = Math.max(2, rand * 0.3);
      risspfad(c, pad - rand, pad - rand, w + rand * 2, h + rand * 2, tiefe, zufall(saatVon(el)));
      c.stroke();
      c.restore();
      c.drawImage(srcCanvas, pad, pad, w, h);
      return cv;
    }

    /* washi: Foto mit duennem Rand, darueber zwei Klebestreifen */
    const b = rand * 0.45;
    const pad = Math.ceil(rand * 1.5);
    const cw = Math.ceil(w + b * 2 + pad * 2), ch = Math.ceil(h + b * 2 + pad * 2);
    const cv = SS.makeCanvas(cw, ch);
    const c = cv.getContext('2d');
    c.save();
    c.shadowColor = 'rgba(60,45,35,.26)';
    c.shadowBlur = rand * 0.6; c.shadowOffsetY = rand * 0.2;
    c.fillStyle = f.color || '#fdfbf8';
    c.fillRect(pad, pad, w + b * 2, h + b * 2);
    c.restore();
    c.drawImage(srcCanvas, pad + b, pad + b, w, h);

    const streifenFarbe = f.tapeColor || 'rgba(226,206,178,.78)';
    function streifen(cx, cy, laenge, dicke, winkel) {
      c.save();
      c.translate(cx, cy); c.rotate(winkel);
      c.fillStyle = streifenFarbe;
      c.fillRect(-laenge / 2, -dicke / 2, laenge, dicke);
      /* gezackte Enden */
      c.fillStyle = 'rgba(255,255,255,.22)';
      for (let i = 0; i < 6; i++) {
        const y = -dicke / 2 + dicke * (i + 0.5) / 6;
        c.fillRect(-laenge / 2, y - dicke * 0.03, laenge, dicke * 0.02);
      }
      c.restore();
    }
    const L = Math.min(w, h) * 0.52, D = Math.max(8, rand * 0.7);
    streifen(pad + b * 0.6, pad + b * 0.6, L, D, -0.72 + (rnd() - 0.5) * 0.2);
    streifen(cw - pad - b * 0.6, ch - pad - b * 0.6, L, D, -0.72 + (rnd() - 0.5) * 0.2);
    return cv;
  };

  SS.RAHMEN7 = { neu: NEU.map(n => n.id), rahmen_gesamt: SS.FRAMES.length };
})();
