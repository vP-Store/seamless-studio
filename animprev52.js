/* Seamless Studio 5.2 – laufende Vorschau in den Animations-Kacheln
   ============================================================================
   Statt nur des Namens zeigt jede Kachel die Bewegung als Schleife. Ein einziger
   Zeitgeber bedient alle sichtbaren Kacheln, mit 24 Bildern je Sekunde und nur
   solange das Panel wirklich sichtbar ist. Bei „weniger Bewegung" im System und
   im Leistungsmodus steht das Bild still.
   ========================================================================= */

(function () {
  let raf = null, letztes = 0, aktiv = null;
  const ZIEL = 1000 / 24;

  const ruhig = () => (SS.state && SS.state.perfMode) ||
    (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* Ein einfacher Stellvertreter für das ausgewählte Element */
  function motiv(c, typ, s, farbe) {
    c.lineJoin = 'round'; c.lineCap = 'round';
    if (typ === 'text') {
      c.fillStyle = farbe;
      c.font = '600 ' + (s * 0.62) + 'px Poppins, system-ui, sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('Aa', 0, s * 0.02);
    } else if (typ === 'photo' || typ === 'video') {
      const w = s * 0.78, h = s * 0.98;
      c.fillStyle = farbe;
      const r = s * 0.10;
      c.beginPath();
      c.moveTo(-w / 2 + r, -h / 2);
      c.arcTo(w / 2, -h / 2, w / 2, h / 2, r);
      c.arcTo(w / 2, h / 2, -w / 2, h / 2, r);
      c.arcTo(-w / 2, h / 2, -w / 2, -h / 2, r);
      c.arcTo(-w / 2, -h / 2, w / 2, -h / 2, r);
      c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.30)';
      c.beginPath(); c.arc(-w * 0.16, -h * 0.16, s * 0.10, 0, Math.PI * 2); c.fill();
      c.beginPath();
      c.moveTo(-w / 2, h * 0.22); c.lineTo(-w * 0.08, -h * 0.06);
      c.lineTo(w * 0.16, h * 0.16); c.lineTo(w / 2, h * 0.02);
      c.lineTo(w / 2, h / 2); c.lineTo(-w / 2, h / 2); c.closePath(); c.fill();
    } else {
      // Sticker / Emoji: ein Herz, gut erkennbar auch klein
      const r = s * 0.42;
      c.fillStyle = farbe;
      c.beginPath();
      c.moveTo(0, r * 0.82);
      c.bezierCurveTo(-r * 1.28, r * 0.05, -r * 0.62, -r * 1.05, 0, -r * 0.36);
      c.bezierCurveTo(r * 0.62, -r * 1.05, r * 1.28, r * 0.05, 0, r * 0.82);
      c.closePath(); c.fill();
    }
  }

  function zeichne(cv, t) {
    const c = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, W, H);
    const id = cv.dataset.anim;
    const typ = cv.dataset.typ || 'sticker';
    const s = W * 0.42;

    const stil = getComputedStyle(document.body);
    const farbe = (stil.getPropertyValue('--accent') || '#C8553D').trim();

    const def = SS.ANIM_BY_ID[id];
    c.save();
    c.translate(W / 2, H / 2);

    if (def && def.perChar && def.charFn) {
      // Buchstaben-Animation: drei Zeichen einzeln bewegen
      const zeichen = ['A', 'b', 'c'];
      const n = zeichen.length;
      c.font = '600 ' + (s * 0.62) + 'px Poppins, system-ui, sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      const breite = zeichen.map(z => c.measureText(z).width);
      const ges = breite.reduce((a, b) => a + b, 0);
      let x = -ges / 2;
      for (let g = 0; g < n; g++) {
        const f = def.charFn(g, n, t, 1, 0) || {};
        c.save();
        c.translate(x + breite[g] / 2 + (f.dx || 0) * s, (f.dy || 0) * s);
        if (f.rot) c.rotate(f.rot);
        if (f.sx !== undefined || f.sy !== undefined) c.scale(f.sx === undefined ? 1 : f.sx, f.sy === undefined ? 1 : f.sy);
        c.globalAlpha = f.a === undefined ? 1 : Math.max(0, Math.min(1, f.a));
        if (f.glow) { c.shadowColor = farbe; c.shadowBlur = s * 0.5 * f.glow; }
        c.fillStyle = farbe;
        c.fillText(zeichen[g], 0, 0);
        c.restore();
        x += breite[g];
      }
      c.restore();
      return;
    }

    const f = def && def.fn ? def.fn(t, 1) : null;
    if (f) {
      c.translate((f.dx || 0) * s, (f.dy || 0) * s);
      if (f.rot) c.rotate(f.rot);
      const sx = f.sx === undefined ? 1 : f.sx, sy = f.sy === undefined ? 1 : f.sy;
      if (sx !== 1 || sy !== 1) c.scale(Math.abs(sx) < 0.01 ? 0.01 : sx, Math.abs(sy) < 0.01 ? 0.01 : sy);
      c.globalAlpha = Math.max(0, Math.min(1, f.a === undefined ? 1 : f.a));
      if (f.glow > 0.001) { c.shadowColor = farbe; c.shadowBlur = s * 0.9 * f.glow; }
    }
    motiv(c, typ, s, farbe);
    c.restore();
  }

  function tick(ts) {
    raf = null;
    if (!aktiv || !aktiv.isConnected) { aktiv = null; return; }
    const now = ts || performance.now();
    if (now - letztes >= ZIEL - 1) {
      letztes = now;
      const t = now / 1000;
      const kacheln = aktiv.querySelectorAll('canvas[data-anim]');
      for (const cv of kacheln) {
        // Nur zeichnen, was auch zu sehen ist
        const r = cv.getBoundingClientRect();
        if (r.bottom < -60 || r.top > window.innerHeight + 60 || r.width === 0) continue;
        zeichne(cv, t);
      }
    }
    if (!ruhig()) raf = requestAnimationFrame(tick);
  }

  SS.animPreviewStart = function (container) {
    aktiv = container;
    // Einmal statisch zeichnen, damit auch im Ruhemodus etwas zu sehen ist
    requestAnimationFrame(() => {
      if (!aktiv) return;
      for (const cv of aktiv.querySelectorAll('canvas[data-anim]')) zeichne(cv, 0.9);
      if (!ruhig() && !raf) raf = requestAnimationFrame(tick);
    });
  };

  SS.animPreviewStop = function () {
    aktiv = null;
    if (raf) { cancelAnimationFrame(raf); raf = null; }
  };

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = null; } }
    else if (aktiv && !ruhig() && !raf) raf = requestAnimationFrame(tick);
  });
})();
