/* Seamless Studio – vector sticker library.
   Each sticker draws into ctx centered at 0,0 within size s (width). */

SS.STICKERS = [
  // ---- Herzen ----
  { id: 'heart-fill',   cat: 'herzen', name: 'Herz',           draw: (c, s, col) => { c.fillStyle = col; SS.drawHeartPath(c, 0, 0, s * 0.5); c.fill(); } },
  { id: 'heart-line',   cat: 'herzen', name: 'Herz Kontur',    draw: (c, s, col) => { c.strokeStyle = col; c.lineWidth = s * 0.05; SS.drawHeartPath(c, 0, 0, s * 0.47); c.stroke(); } },
  { id: 'heart-double', cat: 'herzen', name: 'Doppelherz',     draw: (c, s, col) => { c.fillStyle = col; c.globalAlpha *= 0.55; SS.drawHeartPath(c, -s * 0.14, -s * 0.06, s * 0.36); c.fill(); c.globalAlpha /= 0.55; SS.drawHeartPath(c, s * 0.12, s * 0.08, s * 0.44); c.fill(); } },
  { id: 'heart-aqua',   cat: 'herzen', name: 'Aquarell-Herz',  draw: (c, s, col) => { for (let i = 3; i >= 1; i--) { c.fillStyle = col; c.globalAlpha = 0.18 * i; SS.drawHeartPath(c, 0, 0, s * 0.5 * (0.7 + i * 0.12)); c.fill(); } c.globalAlpha = 1; } },
  { id: 'heart-band',   cat: 'herzen', name: 'Herzlinie',      draw: (c, s, col) => { c.fillStyle = col; for (let i = -1; i <= 1; i++) SS.drawHeartPath(c, i * s * 0.36, 0, s * 0.15), c.fill(); } },
  { id: 'bow',          cat: 'herzen', name: 'Schleife',       draw: drawBow },
  { id: 'crown',        cat: 'herzen', name: 'Krone',          draw: drawCrown },

  // ---- Funkeln & Himmel ----
  { id: 'sparkle',   cat: 'funkeln', name: 'Funkelstern', draw: (c, s, col) => { c.fillStyle = col; SS.drawTwinklePath(c, 0, 0, s * 0.5); c.fill(); c.fillStyle = '#fff'; c.globalAlpha *= 0.8; c.beginPath(); c.arc(0, 0, s * 0.05, 0, 7); c.fill(); } },
  { id: 'sparkle3',  cat: 'funkeln', name: 'Funkel-Trio', draw: (c, s, col) => { c.fillStyle = col; SS.drawTwinklePath(c, -s * 0.18, s * 0.1, s * 0.3); c.fill(); SS.drawTwinklePath(c, s * 0.22, -s * 0.18, s * 0.2); c.fill(); SS.drawTwinklePath(c, s * 0.25, s * 0.25, s * 0.12); c.fill(); } },
  { id: 'star',      cat: 'funkeln', name: 'Stern',       draw: (c, s, col) => { c.fillStyle = col; starPath(c, 0, 0, s * 0.5, 5); c.fill(); } },
  { id: 'moon',      cat: 'funkeln', name: 'Mond',        draw: (c, s, col) => { c.fillStyle = col; c.beginPath(); c.arc(0, 0, s * 0.42, 0.6, 5.7); c.arc(s * 0.18, -s * 0.05, s * 0.32, 5.3, 1.1, true); c.closePath(); c.fill(); } },
  { id: 'cloud',     cat: 'funkeln', name: 'Wolke',       draw: drawCloud },
  { id: 'rainbow',   cat: 'funkeln', name: 'Regenbogen',  draw: drawRainbow },
  { id: 'sun',       cat: 'funkeln', name: 'Sonne',       draw: drawSun },
  { id: 'dots',      cat: 'funkeln', name: 'Konfetti',    draw: (c, s, col) => { const r = mulb(5); c.fillStyle = col; for (let i = 0; i < 9; i++) { c.globalAlpha = 0.5 + r() * 0.5; c.beginPath(); c.arc((r() - 0.5) * s, (r() - 0.5) * s, s * (0.03 + r() * 0.04), 0, 7); c.fill(); } c.globalAlpha = 1; } },

  // ---- Natur ----
  { id: 'branch',    cat: 'natur', name: 'Zweig',        draw: drawBranch },
  { id: 'leafring',  cat: 'natur', name: 'Kranz',        draw: drawWreath },
  { id: 'flower',    cat: 'natur', name: 'Blüte',        draw: drawFlower },
  { id: 'butterfly', cat: 'natur', name: 'Schmetterling',draw: drawButterfly },
  { id: 'leaf',      cat: 'natur', name: 'Blatt',        draw: drawLeaf },

  // ---- Baby ----
  { id: 'feet',     cat: 'baby', name: 'Babyfüßchen', draw: drawFeet },
  { id: 'pacifier', cat: 'baby', name: 'Schnuller',   draw: drawPacifier },
  { id: 'rattle',   cat: 'baby', name: 'Rassel',      draw: drawRattle },
  { id: 'bottle',   cat: 'baby', name: 'Fläschchen',  draw: drawBottle },

  // ---- Linien & Trenner ----
  { id: 'hairline', cat: 'linien', name: 'Goldlinie',   ar: 5, draw: (c, s, col) => { c.strokeStyle = col; c.lineWidth = s * 0.012; c.beginPath(); c.moveTo(-s * 0.5, 0); c.lineTo(s * 0.5, 0); c.stroke(); c.fillStyle = col; c.beginPath(); c.arc(0, 0, s * 0.02, 0, 7); c.fill(); } },
  { id: 'thread',   cat: 'linien', name: 'Erzählfaden', ar: 5, draw: (c, s, col) => { c.fillStyle = col; for (let x = -s * 0.5; x <= s * 0.5; x += s * 0.045) { const y = Math.sin(x / s * 9) * s * 0.06; c.beginPath(); c.arc(x, y, s * 0.011, 0, 7); c.fill(); } } },
  { id: 'wave',     cat: 'linien', name: 'Wellenlinie', ar: 5, draw: (c, s, col) => { c.strokeStyle = col; c.lineWidth = s * 0.014; c.beginPath(); for (let x = -s * 0.5; x <= s * 0.5; x += 4) { const y = Math.sin(x / s * 14) * s * 0.05; x === -s * 0.5 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); } },
  { id: 'scribble', cat: 'linien', name: 'Kringel',     ar: 3, draw: drawScribble },
  { id: 'arrow',    cat: 'linien', name: 'Pfeil',       ar: 3, draw: drawArrow },
  { id: 'badge',    cat: 'linien', name: 'Kreis-Badge', draw: (c, s, col) => { c.strokeStyle = col; c.lineWidth = s * 0.03; c.beginPath(); c.arc(0, 0, s * 0.45, 0, 7); c.stroke(); c.setLineDash([s * 0.02, s * 0.03]); c.beginPath(); c.arc(0, 0, s * 0.38, 0, 7); c.stroke(); c.setLineDash([]); } },
  { id: 'bubble',   cat: 'linien', name: 'Sprechblase', draw: drawBubble },

  // ---- Privacy ----
  { id: 'pv-heart',  cat: 'privacy', name: 'Herz (deckend)',  draw: (c, s, col) => { c.fillStyle = '#fffcfa'; SS.drawHeartPath(c, 0, 0, s * 0.55); c.fill(); c.fillStyle = col; SS.drawHeartPath(c, 0, 0, s * 0.5); c.fill(); } },
  { id: 'pv-star',   cat: 'privacy', name: 'Stern (deckend)', draw: (c, s, col) => { c.fillStyle = '#fffcfa'; starPath(c, 0, 0, s * 0.55, 5); c.fill(); c.fillStyle = col; starPath(c, 0, 0, s * 0.5, 5); c.fill(); } },
  { id: 'pv-circle', cat: 'privacy', name: 'Kreis (deckend)', draw: (c, s, col) => { c.fillStyle = col; c.beginPath(); c.arc(0, 0, s * 0.5, 0, 7); c.fill(); } },
];

// Blur patch is a special element type (needs canvas-under content)
SS.BLUR_TOOLS = [
  { id: 'blur-rect', name: 'Blur-Bereich', shape: 'rect' },
  { id: 'blur-ellipse', name: 'Blur-Kreis', shape: 'ellipse' },
  { id: 'pix-rect', name: 'Pixel-Bereich', shape: 'rect', pixelate: true },
];

function mulb(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function starPath(c, cx, cy, r, n) {
  c.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + i * Math.PI / n;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = cx + rad * Math.cos(a), py = cy + rad * Math.sin(a);
    i ? c.lineTo(px, py) : c.moveTo(px, py);
  }
  c.closePath();
}
function drawCloud(c, s, col) {
  c.fillStyle = col;
  c.beginPath();
  c.arc(-s * 0.22, s * 0.08, s * 0.16, 0, 7);
  c.arc(0, -s * 0.05, s * 0.22, 0, 7);
  c.arc(s * 0.22, s * 0.08, s * 0.17, 0, 7);
  c.fill();
  c.fillRect(-s * 0.22, s * 0.05, s * 0.44, s * 0.19);
}
function drawRainbow(c, s, col) {
  const cols = [col, '#e8c48f', '#d9a8a0', '#b9c9ae', '#a9bfd0'];
  c.lineWidth = s * 0.05;
  cols.forEach((cc, i) => {
    c.strokeStyle = cc;
    c.beginPath(); c.arc(0, s * 0.25, s * 0.42 - i * s * 0.06, Math.PI, 0); c.stroke();
  });
}
function drawSun(c, s, col) {
  c.fillStyle = col; c.strokeStyle = col;
  c.beginPath(); c.arc(0, 0, s * 0.24, 0, 7); c.fill();
  c.lineWidth = s * 0.035; c.lineCap = 'round';
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    c.beginPath();
    c.moveTo(Math.cos(a) * s * 0.32, Math.sin(a) * s * 0.32);
    c.lineTo(Math.cos(a) * s * 0.46, Math.sin(a) * s * 0.46);
    c.stroke();
  }
}
function drawBranch(c, s, col) {
  c.strokeStyle = col; c.fillStyle = col; c.lineWidth = s * 0.02; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-s * 0.45, s * 0.3); c.quadraticCurveTo(0, -s * 0.05, s * 0.45, -s * 0.32); c.stroke();
  for (let i = 0; i < 7; i++) {
    const t = 0.12 + i * 0.13;
    const bx = -s * 0.45 + t * s * 0.9, by = s * 0.3 - t * s * 0.6 - Math.sin(t * 2.5) * s * 0.05;
    const side = i % 2 ? 1 : -1;
    c.save(); c.translate(bx, by); c.rotate(side * 0.9 - t);
    c.beginPath(); c.ellipse(s * 0.075, 0, s * 0.075, s * 0.032, 0, 0, 7); c.fill();
    c.restore();
  }
}
function drawWreath(c, s, col) {
  c.strokeStyle = col; c.fillStyle = col; c.lineWidth = s * 0.015;
  c.beginPath(); c.arc(0, 0, s * 0.36, 0.6, Math.PI * 2 + 0.1); c.stroke();
  for (let i = 0; i < 14; i++) {
    const a = 0.7 + i / 14 * 5.6;
    c.save(); c.translate(Math.cos(a) * s * 0.36, Math.sin(a) * s * 0.36);
    c.rotate(a + Math.PI / 2 + (i % 2 ? 0.7 : -0.7));
    c.beginPath(); c.ellipse(s * 0.05, 0, s * 0.055, s * 0.024, 0, 0, 7); c.fill();
    c.restore();
  }
}
function drawFlower(c, s, col) {
  c.fillStyle = col;
  for (let i = 0; i < 6; i++) {
    c.save(); c.rotate(i * Math.PI / 3);
    c.beginPath(); c.ellipse(0, -s * 0.26, s * 0.12, s * 0.2, 0, 0, 7); c.fill();
    c.restore();
  }
  c.fillStyle = '#e8c48f';
  c.beginPath(); c.arc(0, 0, s * 0.1, 0, 7); c.fill();
}
function drawButterfly(c, s, col) {
  c.fillStyle = col;
  [[-1, -1], [1, -1]].forEach(([sx]) => {
    c.beginPath(); c.ellipse(sx * s * 0.2, -s * 0.12, s * 0.19, s * 0.15, sx * 0.5, 0, 7); c.fill();
  });
  c.globalAlpha *= 0.8;
  [[-1], [1]].forEach(([sx]) => {
    c.beginPath(); c.ellipse(sx * s * 0.15, s * 0.14, s * 0.13, s * 0.11, sx * -0.4, 0, 7); c.fill();
  });
  c.globalAlpha /= 0.8;
  c.strokeStyle = col; c.lineWidth = s * 0.03; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, -s * 0.28); c.lineTo(0, s * 0.26); c.stroke();
}
function drawLeaf(c, s, col) {
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(0, s * 0.45);
  c.quadraticCurveTo(-s * 0.42, s * 0.05, 0, -s * 0.45);
  c.quadraticCurveTo(s * 0.42, s * 0.05, 0, s * 0.45);
  c.fill();
  c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = s * 0.015;
  c.beginPath(); c.moveTo(0, s * 0.4); c.lineTo(0, -s * 0.38); c.stroke();
}
function drawFeet(c, s, col) {
  c.fillStyle = col;
  [[-1, 0.15], [1, -0.05]].forEach(([sx, oy]) => {
    c.save(); c.translate(sx * s * 0.16, oy * s); c.rotate(sx * 0.15);
    c.beginPath(); c.ellipse(0, s * 0.08, s * 0.1, s * 0.16, 0, 0, 7); c.fill();
    for (let i = 0; i < 5; i++) {
      c.beginPath();
      c.arc(-s * 0.075 + i * s * 0.037, -s * 0.115 + Math.abs(i - 1.6) * s * 0.012, s * (0.028 - i * 0.003), 0, 7);
      c.fill();
    }
    c.restore();
  });
}
function drawPacifier(c, s, col) {
  c.strokeStyle = col; c.fillStyle = col; c.lineWidth = s * 0.045;
  c.beginPath(); c.arc(0, s * 0.22, s * 0.13, 0, 7); c.stroke();
  c.beginPath(); c.ellipse(0, -s * 0.02, s * 0.3, s * 0.14, 0, 0, 7); c.fill();
  c.beginPath(); c.ellipse(0, -s * 0.22, s * 0.13, s * 0.15, 0, 0, 7); c.fill();
}
function drawRattle(c, s, col) {
  c.strokeStyle = col; c.fillStyle = col; c.lineWidth = s * 0.05; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-s * 0.28, s * 0.28); c.lineTo(s * 0.1, -s * 0.1); c.stroke();
  c.beginPath(); c.arc(s * 0.22, -s * 0.22, s * 0.2, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,.4)';
  c.beginPath(); c.arc(s * 0.16, -s * 0.28, s * 0.07, 0, 7); c.fill();
}
function drawBottle(c, s, col) {
  c.fillStyle = col;
  const r = s * 0.06;
  c.beginPath();
  c.moveTo(-s * 0.14, -s * 0.12);
  c.lineTo(-s * 0.14, s * 0.38); c.quadraticCurveTo(-s * 0.14, s * 0.44, -s * 0.08, s * 0.44);
  c.lineTo(s * 0.08, s * 0.44); c.quadraticCurveTo(s * 0.14, s * 0.44, s * 0.14, s * 0.38);
  c.lineTo(s * 0.14, -s * 0.12); c.closePath(); c.fill();
  c.fillRect(-s * 0.16, -s * 0.22, s * 0.32, s * 0.1);
  c.beginPath(); c.ellipse(0, -s * 0.3, s * 0.07, s * 0.09, 0, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,.35)';
  c.fillRect(-s * 0.08, s * 0.05, s * 0.05, s * 0.3);
}
function drawBow(c, s, col) {
  c.fillStyle = col;
  c.beginPath(); c.arc(0, 0, s * 0.07, 0, 7); c.fill();
  [[-1], [1]].forEach(([sx]) => {
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(sx * s * 0.3, -s * 0.28, sx * s * 0.42, -s * 0.06);
    c.quadraticCurveTo(sx * s * 0.46, s * 0.1, sx * s * 0.2, s * 0.08);
    c.closePath(); c.fill();
    c.beginPath();
    c.moveTo(0, s * 0.04);
    c.quadraticCurveTo(sx * s * 0.16, s * 0.22, sx * s * 0.1, s * 0.38);
    c.lineTo(sx * s * 0.02, s * 0.3);
    c.closePath(); c.fill();
  });
}
function drawCrown(c, s, col) {
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(-s * 0.4, s * 0.22);
  c.lineTo(-s * 0.45, -s * 0.18); c.lineTo(-s * 0.2, s * 0.0);
  c.lineTo(0, -s * 0.3); c.lineTo(s * 0.2, s * 0.0);
  c.lineTo(s * 0.45, -s * 0.18); c.lineTo(s * 0.4, s * 0.22);
  c.closePath(); c.fill();
  c.fillRect(-s * 0.4, s * 0.24, s * 0.8, s * 0.08);
}
function drawScribble(c, s, col) {
  c.strokeStyle = col; c.lineWidth = s * 0.02; c.lineCap = 'round';
  c.beginPath();
  for (let t = 0; t <= 1; t += 0.01) {
    const x = -s * 0.45 + t * s * 0.9;
    const y = Math.sin(t * 18) * s * 0.09 * (1 - t * 0.4);
    t === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
  }
  c.stroke();
}
function drawArrow(c, s, col) {
  c.strokeStyle = col; c.lineWidth = s * 0.03; c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-s * 0.45, s * 0.08);
  c.quadraticCurveTo(0, -s * 0.18, s * 0.42, 0);
  c.stroke();
  c.beginPath();
  c.moveTo(s * 0.42, 0); c.lineTo(s * 0.26, -s * 0.1);
  c.moveTo(s * 0.42, 0); c.lineTo(s * 0.28, s * 0.12);
  c.stroke();
}
function drawBubble(c, s, col) {
  c.strokeStyle = col; c.lineWidth = s * 0.03;
  roundP(c, -s * 0.45, -s * 0.32, s * 0.9, s * 0.52, s * 0.14); c.stroke();
  c.beginPath();
  c.moveTo(-s * 0.1, s * 0.2); c.lineTo(-s * 0.18, s * 0.42); c.lineTo(s * 0.04, s * 0.2);
  c.stroke();
}
function roundP(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
