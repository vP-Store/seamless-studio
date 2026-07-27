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

  // ---- Feiern ----
  { id: 'balloon',   cat: 'feiern', name: 'Ballon',      anim: 'float', draw: drawBalloon },
  { id: 'balloons3', cat: 'feiern', name: 'Ballon-Trio', anim: 'float', draw: (c, s, col) => { drawBalloonAt(c, -s*0.22, s*0.05, s*0.55, col); drawBalloonAt(c, s*0.18, -s*0.1, s*0.7, shade(col, 20)); drawBalloonAt(c, s*0.3, s*0.18, s*0.45, shade(col, -20)); } },
  { id: 'bunting',   cat: 'feiern', name: 'Wimpelkette', ar: 3, draw: drawBunting },
  { id: 'cake',      cat: 'feiern', name: 'Torte',       draw: drawCake },
  { id: 'candle',    cat: 'feiern', name: 'Kerze',       anim: 'twinkle', draw: drawCandle },
  { id: 'gift',      cat: 'feiern', name: 'Geschenk',    draw: drawGift },
  { id: 'confrain',  cat: 'feiern', name: 'Konfettiregen', draw: drawConfettiRain },
  { id: 'cheers',    cat: 'feiern', name: 'Anstoßen',    draw: drawCheers },
  { id: 'partyhat',  cat: 'feiern', name: 'Partyhut',    draw: drawPartyHat },

  // ---- Liebe+ ----
  { id: 'rose',      cat: 'herzen', name: 'Rose',        draw: drawRose },
  { id: 'ring',      cat: 'herzen', name: 'Ring',        draw: drawRing },
  { id: 'loveletter',cat: 'herzen', name: 'Liebesbrief', draw: drawLetter },
  { id: 'seal',      cat: 'herzen', name: 'Wachssiegel', draw: drawSeal },
  { id: 'heartarrow',cat: 'herzen', name: 'Amor-Herz',   draw: drawHeartArrow },
  { id: 'infinity',  cat: 'herzen', name: 'Unendlich',   draw: drawInfinity },

  // ---- Natur+ ----
  { id: 'tulip',     cat: 'natur', name: 'Tulpe',        draw: drawTulip },
  { id: 'sunflower', cat: 'natur', name: 'Sonnenblume',  draw: drawSunflower },
  { id: 'palm',      cat: 'natur', name: 'Palme',        draw: drawPalm },
  { id: 'cactus',    cat: 'natur', name: 'Kaktus',       draw: drawCactus },
  { id: 'mushroom',  cat: 'natur', name: 'Pilz',         draw: drawMushroom },
  { id: 'raindrop',  cat: 'natur', name: 'Tropfen',      draw: drawDrop },
  { id: 'blossom',   cat: 'natur', name: 'Blütenzweig',  draw: drawBlossomBranch },
  { id: 'lavender',  cat: 'natur', name: 'Lavendel',     draw: drawLavender },

  // ---- Himmel+ ----
  { id: 'shootstar', cat: 'funkeln', name: 'Sternschnuppe', anim: 'twinkle', draw: drawShootingStar },
  { id: 'planet',    cat: 'funkeln', name: 'Planet',        draw: drawPlanet },
  { id: 'bolt',      cat: 'funkeln', name: 'Blitz',         draw: drawBolt },
  { id: 'raincloud', cat: 'funkeln', name: 'Regenwolke',    anim: 'float', draw: drawRainCloud },
  { id: 'starcirc',  cat: 'funkeln', name: 'Sternenkreis',  anim: 'spin', draw: drawStarCircle },

  // ---- Baby+ ----
  { id: 'onesie',    cat: 'baby', name: 'Body',         draw: drawOnesie },
  { id: 'stroller',  cat: 'baby', name: 'Kinderwagen',  draw: drawStroller },
  { id: 'teddy',     cat: 'baby', name: 'Teddy',        draw: drawTeddy },
  { id: 'mobile',    cat: 'baby', name: 'Mobile',       anim: 'float', draw: drawMobileToy },
  { id: 'badge1w',   cat: 'baby', name: 'Badge leer',   draw: drawMilestoneBadge },
  { id: 'storch',    cat: 'baby', name: 'Storch',       draw: drawStork },

  // ---- Deko / Linien+ ----
  { id: 'washi1',    cat: 'linien', name: 'Washi-Tape',   ar: 2.6, draw: (c, s, col) => drawWashi(c, s, col, 0) },
  { id: 'washi2',    cat: 'linien', name: 'Washi Punkte', ar: 2.6, draw: (c, s, col) => drawWashi(c, s, col, 1) },
  { id: 'washi3',    cat: 'linien', name: 'Washi Streifen', ar: 2.6, draw: (c, s, col) => drawWashi(c, s, col, 2) },
  { id: 'cornerorn', cat: 'linien', name: 'Zier-Ecke',    draw: drawCornerOrnament },
  { id: 'flourish',  cat: 'linien', name: 'Schnörkel',    ar: 3.4, draw: drawFlourish },
  { id: 'tag',       cat: 'linien', name: 'Etikett',      draw: drawTag },
  { id: 'clip',      cat: 'linien', name: 'Büroklammer',  draw: drawClip },
  { id: 'pin',       cat: 'linien', name: 'Pinnnadel',    draw: drawPin },
  { id: 'arrow2',    cat: 'linien', name: 'Pfeil gerade', ar: 3, draw: drawArrowStraight },
  { id: 'arrow3',    cat: 'linien', name: 'Pfeil Skizze', ar: 2.4, draw: drawArrowSketch },
  { id: 'framedeco', cat: 'linien', name: 'Zierrahmen',   draw: drawDecoFrame },

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

/* ===== v2.0 sticker painters ===== */
function shade(hex, amt) {
  const h = hex.replace('#', '');
  const n = [0, 2, 4].map(i => Math.max(0, Math.min(255, parseInt(h.slice(i, i + 2), 16) + amt)));
  return '#' + n.map(v => v.toString(16).padStart(2, '0')).join('');
}
function drawBalloonAt(c, x, y, s, col) {
  c.save(); c.translate(x, y);
  c.strokeStyle = col; c.lineWidth = s * 0.03; c.globalAlpha *= 0.9;
  c.beginPath(); c.moveTo(0, s * 0.32);
  c.quadraticCurveTo(s * 0.1, s * 0.55, -s * 0.05, s * 0.8); c.stroke();
  c.globalAlpha /= 0.9;
  c.fillStyle = col;
  c.beginPath(); c.ellipse(0, 0, s * 0.26, s * 0.32, 0, 0, 7); c.fill();
  c.beginPath(); c.moveTo(0, s * 0.3); c.lineTo(-s * 0.05, s * 0.38); c.lineTo(s * 0.05, s * 0.38); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.45)';
  c.beginPath(); c.ellipse(-s * 0.09, -s * 0.12, s * 0.07, s * 0.1, -0.5, 0, 7); c.fill();
  c.restore();
}
function drawBalloon(c, s, col) { drawBalloonAt(c, 0, -s * 0.08, s, col); }
function drawBunting(c, s, col) {
  c.strokeStyle = col; c.lineWidth = s * 0.012;
  c.beginPath(); c.moveTo(-s * 0.5, -s * 0.1);
  c.quadraticCurveTo(0, s * 0.02, s * 0.5, -s * 0.1); c.stroke();
  const cols = [col, shade(col, 35), shade(col, -30), shade(col, 60), col];
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const x = -s * 0.5 + t * s;
    const y = -s * 0.1 + Math.sin(t * Math.PI) * s * 0.11;
    c.fillStyle = cols[i % cols.length];
    c.beginPath(); c.moveTo(x - s * 0.05, y); c.lineTo(x + s * 0.05, y); c.lineTo(x, y + s * 0.12); c.closePath(); c.fill();
  }
}
function drawCake(c, s, col) {
  c.fillStyle = col;
  c.fillRect(-s * 0.32, s * 0.05, s * 0.64, s * 0.3);
  c.fillStyle = shade(col, 30);
  c.fillRect(-s * 0.24, -s * 0.16, s * 0.48, s * 0.21);
  c.fillStyle = '#fdf6ec';
  for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(-s * 0.32 + s * 0.08 + i * s * 0.12, s * 0.07, s * 0.045, 0, 7); c.fill(); }
  c.strokeStyle = '#e8c48f'; c.lineWidth = s * 0.03; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, -s * 0.16); c.lineTo(0, -s * 0.3); c.stroke();
  c.fillStyle = '#f5b04a';
  c.beginPath(); c.ellipse(0, -s * 0.36, s * 0.035, s * 0.06, 0, 0, 7); c.fill();
}
function drawCandle(c, s, col) {
  c.fillStyle = col;
  c.fillRect(-s * 0.1, -s * 0.1, s * 0.2, s * 0.5);
  c.strokeStyle = shade(col, -35); c.lineWidth = s * 0.015;
  c.beginPath(); c.moveTo(-s * 0.1, 0); c.quadraticCurveTo(0, s * 0.06, s * 0.1, 0); c.stroke();
  c.fillStyle = '#f5b04a';
  c.beginPath(); c.ellipse(0, -s * 0.22, s * 0.06, s * 0.11, 0, 0, 7); c.fill();
  c.fillStyle = '#fde9c8';
  c.beginPath(); c.ellipse(0, -s * 0.2, s * 0.028, s * 0.055, 0, 0, 7); c.fill();
}
function drawGift(c, s, col) {
  c.fillStyle = col;
  c.fillRect(-s * 0.3, -s * 0.08, s * 0.6, s * 0.42);
  c.fillStyle = shade(col, 25);
  c.fillRect(-s * 0.34, -s * 0.2, s * 0.68, s * 0.14);
  c.fillStyle = '#fdf6ec';
  c.fillRect(-s * 0.05, -s * 0.2, s * 0.1, s * 0.54);
  c.strokeStyle = '#fdf6ec'; c.lineWidth = s * 0.05;
  c.beginPath(); c.arc(-s * 0.09, -s * 0.27, s * 0.08, Math.PI * 0.6, Math.PI * 1.9); c.stroke();
  c.beginPath(); c.arc(s * 0.09, -s * 0.27, s * 0.08, Math.PI * 1.1, Math.PI * 2.4); c.stroke();
}
function drawConfettiRain(c, s, col) {
  const r = mulb(17);
  const cols = [col, shade(col, 40), shade(col, -35), '#e8c48f', '#a8c4d9'];
  for (let i = 0; i < 16; i++) {
    c.fillStyle = cols[i % cols.length];
    c.save();
    c.translate((r() - 0.5) * s, (r() - 0.5) * s);
    c.rotate(r() * 6.3);
    r() < 0.4 ? c.fillRect(-s * 0.035, -s * 0.014, s * 0.07, s * 0.028)
      : r() < 0.7 ? (c.beginPath(), c.arc(0, 0, s * 0.022, 0, 7), c.fill())
      : (c.beginPath(), c.moveTo(0, -s * 0.03), c.lineTo(s * 0.026, s * 0.02), c.lineTo(-s * 0.026, s * 0.02), c.closePath(), c.fill());
    c.restore();
  }
}
function drawCheers(c, s, col) {
  c.strokeStyle = col; c.fillStyle = col; c.lineWidth = s * 0.035; c.lineCap = 'round';
  [[-1, -0.18], [1, 0.18]].forEach(([sx, rot]) => {
    c.save(); c.translate(sx * s * 0.18, 0); c.rotate(rot);
    c.beginPath();
    c.moveTo(-s * 0.12, -s * 0.3); c.lineTo(s * 0.12, -s * 0.3);
    c.lineTo(s * 0.08, 0); c.quadraticCurveTo(0, s * 0.05, -s * 0.08, 0); c.closePath(); c.stroke();
    c.beginPath(); c.moveTo(0, s * 0.03); c.lineTo(0, s * 0.3); c.stroke();
    c.beginPath(); c.moveTo(-s * 0.09, s * 0.32); c.lineTo(s * 0.09, s * 0.32); c.stroke();
    c.restore();
  });
  SS.drawTwinklePath(c, 0, -s * 0.42, s * 0.07); c.fill();
}
function drawPartyHat(c, s, col) {
  c.fillStyle = col;
  c.beginPath(); c.moveTo(0, -s * 0.42); c.lineTo(s * 0.28, s * 0.3); c.lineTo(-s * 0.28, s * 0.3); c.closePath(); c.fill();
  c.fillStyle = shade(col, 45);
  c.beginPath(); c.arc(0, -s * 0.42, s * 0.07, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = s * 0.03;
  c.beginPath(); c.moveTo(-s * 0.12, s * 0.02); c.quadraticCurveTo(0, s * 0.1, s * 0.17, 0); c.stroke();
}
function drawRose(c, s, col) {
  c.strokeStyle = '#7a9464'; c.lineWidth = s * 0.035; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, s * 0.05); c.quadraticCurveTo(-s * 0.04, s * 0.28, 0, s * 0.46); c.stroke();
  c.fillStyle = '#7a9464';
  c.beginPath(); c.ellipse(s * 0.09, s * 0.26, s * 0.09, s * 0.04, -0.5, 0, 7); c.fill();
  c.fillStyle = col;
  c.beginPath(); c.arc(0, -s * 0.12, s * 0.22, 0, 7); c.fill();
  c.strokeStyle = shade(col, -45); c.lineWidth = s * 0.022;
  c.beginPath(); c.arc(0, -s * 0.12, s * 0.13, 0.5, 5.5); c.stroke();
  c.beginPath(); c.arc(s * 0.03, -s * 0.14, s * 0.06, 0, 6); c.stroke();
}
function drawRing(c, s, col) {
  c.strokeStyle = col; c.lineWidth = s * 0.06;
  c.beginPath(); c.arc(0, s * 0.08, s * 0.26, 0, 7); c.stroke();
  c.fillStyle = '#dcefff';
  c.save(); c.translate(0, -s * 0.28); c.rotate(Math.PI / 4);
  c.fillRect(-s * 0.09, -s * 0.09, s * 0.18, s * 0.18); c.restore();
  c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = s * 0.015;
  c.beginPath(); c.moveTo(-s * 0.06, -s * 0.34); c.lineTo(s * 0.02, -s * 0.24); c.stroke();
}
function drawLetter(c, s, col) {
  c.fillStyle = '#fdf8f0';
  c.fillRect(-s * 0.34, -s * 0.22, s * 0.68, s * 0.44);
  c.strokeStyle = col; c.lineWidth = s * 0.025;
  c.strokeRect(-s * 0.34, -s * 0.22, s * 0.68, s * 0.44);
  c.beginPath(); c.moveTo(-s * 0.34, -s * 0.22); c.lineTo(0, s * 0.05); c.lineTo(s * 0.34, -s * 0.22); c.stroke();
  c.fillStyle = col;
  SS.drawHeartPath(c, 0, s * 0.1, s * 0.09); c.fill();
}
function drawSeal(c, s, col) {
  c.fillStyle = col;
  c.beginPath();
  for (let i = 0; i <= 80; i++) {
    const a = i / 80 * Math.PI * 2;
    const r = s * 0.42 * (1 + 0.05 * Math.sin(a * 9));
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.closePath(); c.fill();
  c.strokeStyle = shade(col, -50); c.lineWidth = s * 0.02;
  c.beginPath(); c.arc(0, 0, s * 0.3, 0, 7); c.stroke();
  c.fillStyle = shade(col, -50);
  SS.drawHeartPath(c, 0, 0, s * 0.16); c.fill();
}
function drawHeartArrow(c, s, col) {
  c.fillStyle = col;
  SS.drawHeartPath(c, 0, 0, s * 0.42); c.fill();
  c.strokeStyle = shade(col, -60); c.lineWidth = s * 0.035; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-s * 0.42, s * 0.3); c.lineTo(s * 0.38, -s * 0.32); c.stroke();
  c.beginPath(); c.moveTo(s * 0.38, -s * 0.32); c.lineTo(s * 0.22, -s * 0.32);
  c.moveTo(s * 0.38, -s * 0.32); c.lineTo(s * 0.38, -s * 0.16); c.stroke();
  c.beginPath(); c.moveTo(-s * 0.42, s * 0.3); c.lineTo(-s * 0.5, s * 0.24);
  c.moveTo(-s * 0.42, s * 0.3); c.lineTo(-s * 0.36, s * 0.38); c.stroke();
}
function drawInfinity(c, s, col) {
  c.strokeStyle = col; c.lineWidth = s * 0.055; c.lineCap = 'round';
  c.beginPath();
  for (let i = 0; i <= 120; i++) {
    const t = i / 120 * Math.PI * 2;
    const x = s * 0.42 * Math.sin(t);
    const y = s * 0.2 * Math.sin(t) * Math.cos(t) * 2;
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.stroke();
}
function drawTulip(c, s, col) {
  c.strokeStyle = '#7a9464'; c.lineWidth = s * 0.035; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, -s * 0.05); c.lineTo(0, s * 0.45); c.stroke();
  c.fillStyle = '#7a9464';
  c.beginPath(); c.ellipse(-s * 0.1, s * 0.3, s * 0.12, s * 0.045, 0.6, 0, 7); c.fill();
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(-s * 0.18, -s * 0.1);
  c.quadraticCurveTo(-s * 0.2, -s * 0.42, 0, -s * 0.38);
  c.quadraticCurveTo(s * 0.2, -s * 0.42, s * 0.18, -s * 0.1);
  c.quadraticCurveTo(0, s * 0.02, -s * 0.18, -s * 0.1);
  c.fill();
  c.fillStyle = shade(col, -30);
  c.beginPath(); c.moveTo(0, -s * 0.36); c.lineTo(s * 0.09, -s * 0.12); c.lineTo(-s * 0.09, -s * 0.12); c.closePath(); c.fill();
}
function drawSunflower(c, s, col) {
  c.fillStyle = '#e8b93c';
  for (let i = 0; i < 12; i++) {
    c.save(); c.rotate(i * Math.PI / 6);
    c.beginPath(); c.ellipse(0, -s * 0.3, s * 0.09, s * 0.18, 0, 0, 7); c.fill();
    c.restore();
  }
  c.fillStyle = '#6b4a2a';
  c.beginPath(); c.arc(0, 0, s * 0.16, 0, 7); c.fill();
  c.fillStyle = 'rgba(0,0,0,.25)';
  for (let i = 0; i < 8; i++) { const a = i * 0.785; c.beginPath(); c.arc(Math.cos(a) * s * 0.08, Math.sin(a) * s * 0.08, s * 0.015, 0, 7); c.fill(); }
}
function drawPalm(c, s, col) {
  c.strokeStyle = '#9a7448'; c.lineWidth = s * 0.05; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-s * 0.05, s * 0.45); c.quadraticCurveTo(0, s * 0.05, s * 0.06, -s * 0.15); c.stroke();
  c.strokeStyle = col; c.lineWidth = s * 0.035;
  for (const [dx, dy] of [[-0.3, -0.1], [0.35, -0.12], [-0.22, -0.32], [0.25, -0.35], [0, -0.42]]) {
    c.beginPath(); c.moveTo(s * 0.06, -s * 0.15);
    c.quadraticCurveTo(s * (0.06 + dx * 0.6), -s * 0.15 + s * dy * 1.4, s * (0.06 + dx), -s * 0.15 + s * dy);
    c.stroke();
  }
}
function drawCactus(c, s, col) {
  c.fillStyle = col;
  const r = s * 0.13;
  c.beginPath();
  c.moveTo(-r, s * 0.4); c.lineTo(-r, -s * 0.2);
  c.arc(0, -s * 0.2, r, Math.PI, 0);
  c.lineTo(r, s * 0.4); c.closePath(); c.fill();
  c.beginPath();
  c.moveTo(-s * 0.32, -s * 0.02); c.arc(-s * 0.32, -s * 0.08, s * 0.065, Math.PI, 0);
  c.lineTo(-s * 0.19, s * 0.06); c.lineTo(-s * 0.32, s * 0.06); c.closePath(); c.fill();
  c.fillRect(-s * 0.32, -0.02 * s, s * 0.2, s * 0.08);
  c.fillStyle = '#c9856a';
  c.fillRect(-s * 0.22, s * 0.38, s * 0.44, s * 0.1);
}
function drawMushroom(c, s, col) {
  c.fillStyle = '#f6ecdc';
  c.fillRect(-s * 0.09, 0, s * 0.18, s * 0.32);
  c.fillStyle = col;
  c.beginPath(); c.moveTo(-s * 0.36, s * 0.02);
  c.quadraticCurveTo(0, -s * 0.52, s * 0.36, s * 0.02); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.75)';
  for (const [x, y, r] of [[-0.16, -0.14, 0.05], [0.1, -0.2, 0.06], [0.02, -0.05, 0.035]])
    { c.beginPath(); c.arc(s * x, s * y, s * r, 0, 7); c.fill(); }
}
function drawDrop(c, s, col) {
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(0, -s * 0.42);
  c.quadraticCurveTo(s * 0.3, -s * 0.02, s * 0.22, s * 0.14);
  c.arc(0, s * 0.14, s * 0.22, 0, Math.PI);
  c.quadraticCurveTo(-s * 0.3, -s * 0.02, 0, -s * 0.42);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,.4)';
  c.beginPath(); c.ellipse(-s * 0.07, s * 0.1, s * 0.045, s * 0.08, 0.4, 0, 7); c.fill();
}
function drawBlossomBranch(c, s, col) {
  c.strokeStyle = '#8a6a4a'; c.lineWidth = s * 0.025; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-s * 0.45, s * 0.25); c.quadraticCurveTo(0, 0, s * 0.45, -s * 0.28); c.stroke();
  for (const t of [0.2, 0.45, 0.68, 0.88]) {
    const x = -s * 0.45 + t * s * 0.9;
    const y = s * 0.25 - t * s * 0.5 - Math.sin(t * 2.2) * s * 0.05;
    c.fillStyle = col;
    for (let i = 0; i < 5; i++) {
      c.save(); c.translate(x, y); c.rotate(i * Math.PI * 2 / 5);
      c.beginPath(); c.ellipse(0, -s * 0.05, s * 0.028, s * 0.05, 0, 0, 7); c.fill();
      c.restore();
    }
    c.fillStyle = '#e8c48f';
    c.beginPath(); c.arc(x, y, s * 0.022, 0, 7); c.fill();
  }
}
function drawLavender(c, s, col) {
  c.strokeStyle = '#7a9464'; c.lineWidth = s * 0.025; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, s * 0.45); c.lineTo(0, -s * 0.05); c.stroke();
  c.fillStyle = col;
  for (let i = 0; i < 8; i++) {
    const y = -s * 0.05 - i * s * 0.055;
    const w2 = s * 0.075 * (1 - i / 10);
    c.beginPath(); c.ellipse(-w2, y, s * 0.04, s * 0.028, 0.4, 0, 7); c.fill();
    c.beginPath(); c.ellipse(w2, y, s * 0.04, s * 0.028, -0.4, 0, 7); c.fill();
  }
}
function drawShootingStar(c, s, col) {
  c.strokeStyle = col; c.lineWidth = s * 0.03; c.lineCap = 'round';
  c.globalAlpha *= 0.6;
  for (const off of [-0.06, 0, 0.06]) {
    c.beginPath(); c.moveTo(-s * 0.45, s * (0.28 + off));
    c.lineTo(s * (0.05 + off * 0.5), s * (-0.05 + off)); c.stroke();
  }
  c.globalAlpha /= 0.6;
  c.fillStyle = col;
  SS.drawTwinklePath(c, s * 0.22, -s * 0.16, s * 0.22); c.fill();
  c.fillStyle = '#fff'; c.globalAlpha *= 0.85;
  c.beginPath(); c.arc(s * 0.22, -s * 0.16, s * 0.035, 0, 7); c.fill();
  c.globalAlpha /= 0.85;
}
function drawPlanet(c, s, col) {
  c.fillStyle = col;
  c.beginPath(); c.arc(0, 0, s * 0.26, 0, 7); c.fill();
  c.fillStyle = 'rgba(0,0,0,.12)';
  c.beginPath(); c.arc(-s * 0.08, -s * 0.05, s * 0.06, 0, 7); c.fill();
  c.beginPath(); c.arc(s * 0.07, s * 0.08, s * 0.045, 0, 7); c.fill();
  c.strokeStyle = shade(col, 50); c.lineWidth = s * 0.035;
  c.save(); c.rotate(-0.35);
  c.beginPath(); c.ellipse(0, 0, s * 0.42, s * 0.13, 0, 0, 7); c.stroke();
  c.restore();
}
function drawBolt(c, s, col) {
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(s * 0.08, -s * 0.45); c.lineTo(-s * 0.2, s * 0.05); c.lineTo(-s * 0.02, s * 0.05);
  c.lineTo(-s * 0.1, s * 0.45); c.lineTo(s * 0.2, -s * 0.08); c.lineTo(s * 0.02, -s * 0.08);
  c.closePath(); c.fill();
}
function drawRainCloud(c, s, col) {
  drawCloud(c, s * 0.85, col);
  c.strokeStyle = '#8fb2c9'; c.lineWidth = s * 0.035; c.lineCap = 'round';
  for (const x of [-0.18, 0, 0.18]) {
    c.beginPath(); c.moveTo(s * x, s * 0.26); c.lineTo(s * (x - 0.05), s * 0.4); c.stroke();
  }
}
function drawStarCircle(c, s, col) {
  c.fillStyle = col;
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    SS.drawTwinklePath(c, Math.cos(a) * s * 0.36, Math.sin(a) * s * 0.36, s * (i % 2 ? 0.07 : 0.11));
    c.fill();
  }
}
function drawOnesie(c, s, col) {
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(-s * 0.18, -s * 0.3); c.lineTo(s * 0.18, -s * 0.3);
  c.lineTo(s * 0.34, -s * 0.16); c.lineTo(s * 0.24, s * 0.0); c.lineTo(s * 0.16, -s * 0.08);
  c.lineTo(s * 0.16, s * 0.22); c.lineTo(s * 0.05, s * 0.34); c.lineTo(0, s * 0.24);
  c.lineTo(-s * 0.05, s * 0.34); c.lineTo(-s * 0.16, s * 0.22); c.lineTo(-s * 0.16, -s * 0.08);
  c.lineTo(-s * 0.24, s * 0.0); c.lineTo(-s * 0.34, -s * 0.16);
  c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.55)';
  SS.drawHeartPath(c, 0, 0, s * 0.09); c.fill();
}
function drawStroller(c, s, col) {
  c.strokeStyle = col; c.fillStyle = col; c.lineWidth = s * 0.04; c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-s * 0.3, -s * 0.05);
  c.arc(0, -s * 0.05, s * 0.3, Math.PI, Math.PI * 1.5);
  c.lineTo(s * 0.3, -s * 0.35);
  c.stroke();
  c.beginPath();
  c.moveTo(-s * 0.3, -s * 0.05); c.lineTo(s * 0.3, -s * 0.05);
  c.lineTo(s * 0.3, -s * 0.35); c.lineTo(s * 0.44, -s * 0.44);
  c.stroke();
  c.beginPath(); c.arc(-s * 0.16, s * 0.24, s * 0.09, 0, 7); c.stroke();
  c.beginPath(); c.arc(s * 0.16, s * 0.24, s * 0.09, 0, 7); c.stroke();
  c.beginPath(); c.moveTo(-s * 0.16, s * 0.16); c.lineTo(-s * 0.05, -s * 0.05);
  c.moveTo(s * 0.16, s * 0.16); c.lineTo(s * 0.05, -s * 0.05); c.stroke();
}
function drawTeddy(c, s, col) {
  c.fillStyle = col;
  c.beginPath(); c.arc(-s * 0.17, -s * 0.26, s * 0.1, 0, 7); c.fill();
  c.beginPath(); c.arc(s * 0.17, -s * 0.26, s * 0.1, 0, 7); c.fill();
  c.beginPath(); c.arc(0, -s * 0.14, s * 0.22, 0, 7); c.fill();
  c.beginPath(); c.ellipse(0, s * 0.2, s * 0.2, s * 0.24, 0, 0, 7); c.fill();
  c.beginPath(); c.arc(-s * 0.24, s * 0.1, s * 0.08, 0, 7); c.fill();
  c.beginPath(); c.arc(s * 0.24, s * 0.1, s * 0.08, 0, 7); c.fill();
  c.fillStyle = shade(col, 55);
  c.beginPath(); c.ellipse(0, -s * 0.08, s * 0.09, s * 0.07, 0, 0, 7); c.fill();
  c.fillStyle = '#3a2e24';
  c.beginPath(); c.arc(-s * 0.08, -s * 0.18, s * 0.02, 0, 7); c.fill();
  c.beginPath(); c.arc(s * 0.08, -s * 0.18, s * 0.02, 0, 7); c.fill();
  c.beginPath(); c.ellipse(0, -s * 0.1, s * 0.028, s * 0.02, 0, 0, 7); c.fill();
}
function drawMobileToy(c, s, col) {
  c.strokeStyle = col; c.lineWidth = s * 0.025; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-s * 0.35, -s * 0.3); c.quadraticCurveTo(0, -s * 0.42, s * 0.35, -s * 0.3); c.stroke();
  const items = [[-0.3, 0.05, 'star'], [-0.1, 0.2, 'heart'], [0.12, 0.08, 'moon'], [0.3, 0.22, 'star']];
  for (const [x, y, kind] of items) {
    c.beginPath(); c.moveTo(s * x, -s * (0.32 - Math.abs(x) * 0.12)); c.lineTo(s * x, s * (y - 0.12)); c.stroke();
    c.fillStyle = kind === 'heart' ? shade(col, 30) : col;
    if (kind === 'star') { SS.drawTwinklePath(c, s * x, s * y, s * 0.08); c.fill(); }
    else if (kind === 'heart') { SS.drawHeartPath(c, s * x, s * y, s * 0.09); c.fill(); }
    else {
      c.beginPath(); c.arc(s * x, s * y, s * 0.08, 0.6, 5.7);
      c.arc(s * x + s * 0.035, s * y - s * 0.01, s * 0.06, 5.3, 1.1, true);
      c.closePath(); c.fill();
    }
  }
}
function drawMilestoneBadge(c, s, col) {
  c.fillStyle = col;
  c.beginPath();
  for (let i = 0; i <= 80; i++) {
    const a = i / 80 * Math.PI * 2;
    const r = s * 0.46 * (1 + 0.045 * Math.sin(a * 12));
    i ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.92)';
  c.beginPath(); c.arc(0, 0, s * 0.36, 0, 7); c.fill();
  c.strokeStyle = col; c.lineWidth = s * 0.018;
  c.beginPath(); c.arc(0, 0, s * 0.32, 0, 7); c.stroke();
}
function drawStork(c, s, col) {
  c.strokeStyle = col; c.fillStyle = col; c.lineWidth = s * 0.035; c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-s * 0.05, s * 0.05);
  c.quadraticCurveTo(-s * 0.3, s * 0.02, -s * 0.28, -s * 0.22);
  c.quadraticCurveTo(-s * 0.27, -s * 0.34, -s * 0.16, -s * 0.34);
  c.stroke();
  c.beginPath(); c.ellipse(0, s * 0.08, s * 0.2, s * 0.13, -0.15, 0, 7); c.fill();
  c.beginPath(); c.arc(-s * 0.19, -s * 0.34, s * 0.05, 0, 7); c.fill();
  c.beginPath(); c.moveTo(-s * 0.23, -s * 0.36); c.lineTo(-s * 0.42, -s * 0.3); c.lineTo(-s * 0.23, -s * 0.31); c.closePath(); c.fill();
  c.lineWidth = s * 0.022;
  c.beginPath(); c.moveTo(s * 0.02, s * 0.2); c.lineTo(s * 0.05, s * 0.42); c.stroke();
  c.beginPath(); c.moveTo(s * 0.1, s * 0.18); c.lineTo(s * 0.15, s * 0.4); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.6)';
  c.beginPath(); c.ellipse(s * 0.05, s * 0.05, s * 0.1, s * 0.06, -0.2, 0, 7); c.fill();
}
function drawWashi(c, s, col, variant) {
  const w = s * 0.5, h = s * 0.16;
  c.save(); c.globalAlpha *= 0.82;
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(-w, -h); c.lineTo(w, -h);
  c.lineTo(w - h * 0.5, 0); c.lineTo(w, h);
  c.lineTo(-w, h); c.lineTo(-w + h * 0.5, 0);
  c.closePath(); c.fill();
  if (variant === 1) {
    c.fillStyle = 'rgba(255,255,255,.5)';
    for (let x = -w + h * 0.6; x < w; x += h * 0.7) { c.beginPath(); c.arc(x, 0, h * 0.14, 0, 7); c.fill(); }
  } else if (variant === 2) {
    c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = h * 0.16;
    for (let x = -w + h * 0.4; x < w; x += h * 0.6) {
      c.beginPath(); c.moveTo(x, -h); c.lineTo(x + h * 0.5, h); c.stroke();
    }
  }
  c.restore();
}
function drawCornerOrnament(c, s, col) {
  c.strokeStyle = col; c.lineWidth = s * 0.028; c.lineCap = 'round';
  c.beginPath();
  c.moveTo(s * 0.42, -s * 0.42); c.lineTo(-s * 0.28, -s * 0.42);
  c.quadraticCurveTo(-s * 0.42, -s * 0.42, -s * 0.42, -s * 0.28);
  c.lineTo(-s * 0.42, s * 0.42);
  c.stroke();
  c.beginPath(); c.arc(-s * 0.24, -s * 0.24, s * 0.09, 0, Math.PI * 1.6); c.stroke();
  c.fillStyle = col;
  c.beginPath(); c.arc(s * 0.42, -s * 0.42, s * 0.03, 0, 7); c.fill();
  c.beginPath(); c.arc(-s * 0.42, s * 0.42, s * 0.03, 0, 7); c.fill();
}
function drawFlourish(c, s, col) {
  c.strokeStyle = col; c.lineWidth = s * 0.018; c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-s * 0.5, 0);
  c.quadraticCurveTo(-s * 0.25, -s * 0.09, 0, 0);
  c.quadraticCurveTo(s * 0.25, s * 0.09, s * 0.5, 0);
  c.stroke();
  c.beginPath(); c.arc(-s * 0.5, -s * 0.015, s * 0.035, 0, Math.PI * 1.7); c.stroke();
  c.beginPath(); c.arc(s * 0.5, s * 0.015, s * 0.035, Math.PI, Math.PI * 2.7); c.stroke();
  c.fillStyle = col;
  SS.drawHeartPath(c, 0, 0, s * 0.05); c.fill();
}
function drawTag(c, s, col) {
  c.save(); c.rotate(-0.3);
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(-s * 0.32, -s * 0.14);
  c.lineTo(s * 0.14, -s * 0.14); c.lineTo(s * 0.3, 0); c.lineTo(s * 0.14, s * 0.14);
  c.lineTo(-s * 0.32, s * 0.14);
  c.closePath(); c.fill();
  c.fillStyle = '#fdf8f0';
  c.beginPath(); c.arc(s * 0.16, 0, s * 0.04, 0, 7); c.fill();
  c.strokeStyle = shade(col, -40); c.lineWidth = s * 0.02;
  c.beginPath(); c.moveTo(s * 0.2, 0); c.quadraticCurveTo(s * 0.34, -s * 0.1, s * 0.44, -s * 0.06); c.stroke();
  c.restore();
}
function drawClip(c, s, col) {
  c.strokeStyle = col; c.lineWidth = s * 0.045; c.lineCap = 'round';
  c.save(); c.rotate(0.5);
  c.beginPath();
  c.moveTo(0, -s * 0.32);
  c.arc(0, -s * 0.22, s * 0.11, -Math.PI / 2, Math.PI / 2, false);
  c.lineTo(0, s * 0.14);
  c.arc(0, s * 0.14, s * 0.17, Math.PI / 2, Math.PI * 1.5, false);
  c.lineTo(0, -s * 0.14);
  c.arc(0, -s * 0.08, s * 0.06, Math.PI * 1.5, Math.PI / 2, false);
  c.lineTo(-s * 0.0, s * 0.22);
  c.stroke();
  c.restore();
}
function drawPin(c, s, col) {
  c.fillStyle = col;
  c.beginPath(); c.arc(0, -s * 0.16, s * 0.17, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,.4)';
  c.beginPath(); c.arc(-s * 0.06, -s * 0.22, s * 0.05, 0, 7); c.fill();
  c.strokeStyle = shade(col, -50); c.lineWidth = s * 0.04; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, 0); c.lineTo(s * 0.08, s * 0.34); c.stroke();
}
function drawArrowStraight(c, s, col) {
  c.strokeStyle = col; c.lineWidth = s * 0.026; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-s * 0.48, 0); c.lineTo(s * 0.42, 0); c.stroke();
  c.beginPath();
  c.moveTo(s * 0.48, 0); c.lineTo(s * 0.32, -s * 0.07);
  c.moveTo(s * 0.48, 0); c.lineTo(s * 0.32, s * 0.07); c.stroke();
  c.beginPath(); c.moveTo(-s * 0.48, -s * 0.05); c.lineTo(-s * 0.48, s * 0.05); c.stroke();
}
function drawArrowSketch(c, s, col) {
  c.strokeStyle = col; c.lineWidth = s * 0.03; c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-s * 0.42, s * 0.14);
  c.quadraticCurveTo(-s * 0.1, -s * 0.22, s * 0.2, s * 0.02);
  c.quadraticCurveTo(s * 0.3, s * 0.1, s * 0.42, -s * 0.05);
  c.stroke();
  c.beginPath();
  c.moveTo(s * 0.42, -s * 0.05); c.lineTo(s * 0.24, -s * 0.1);
  c.moveTo(s * 0.42, -s * 0.05); c.lineTo(s * 0.36, s * 0.12);
  c.stroke();
}
function drawDecoFrame(c, s, col) {
  c.strokeStyle = col; c.lineWidth = s * 0.022;
  c.strokeRect(-s * 0.42, -s * 0.42, s * 0.84, s * 0.84);
  c.strokeRect(-s * 0.36, -s * 0.36, s * 0.72, s * 0.72);
  c.fillStyle = col;
  for (const [x, y] of [[-0.42, -0.42], [0.42, -0.42], [-0.42, 0.42], [0.42, 0.42]]) {
    SS.drawTwinklePath(c, s * x, s * y, s * 0.06); c.fill();
  }
}
