/* Seamless Studio – procedural background library (seamless over any width) */

SS.PALETTES = [
  { id: 'blush',      name: 'Blush & Gold',  c: ['#f8ece5', '#f0d8d2', '#ecc9c2', '#f6e7d8'] },
  { id: 'rose',       name: 'Rosé',          c: ['#f9e8ea', '#f2d3d8', '#e8b9c1', '#fbf1ee'] },
  { id: 'salbei',     name: 'Salbei',        c: ['#eef1e9', '#d9e0d0', '#c3cfb8', '#f4f4ec'] },
  { id: 'eukalyptus', name: 'Eukalyptus',    c: ['#e8efec', '#cfdcd6', '#b4c8bf', '#f2f5f1'] },
  { id: 'ivory',      name: 'Ivory',         c: ['#faf6ee', '#f3ead9', '#eaddc4', '#fdfaf4'] },
  { id: 'sand',       name: 'Sand & Beige',  c: ['#f4ede2', '#e8dbc8', '#d9c6ab', '#f9f4ea'] },
  { id: 'terra',      name: 'Terracotta',    c: ['#f5e5dc', '#e8c8b5', '#d9a98f', '#f9efe7'] },
  { id: 'lavendel',   name: 'Lavendel',      c: ['#f0ecf5', '#ddd4e8', '#c5b8d8', '#f6f3f8'] },
  { id: 'himmel',     name: 'Himmelblau',    c: ['#e9f1f6', '#d2e2ec', '#b5cede', '#f3f7fa'] },
  { id: 'nebel',      name: 'Nebelgrau',     c: ['#f0efed', '#dedcd8', '#c8c5c0', '#f6f5f3'] },
  { id: 'nacht',      name: 'Mitternacht',   c: ['#2e3244', '#3d4258', '#232637', '#454b63'] },
  { id: 'schwarzgold',name: 'Schwarz & Gold',c: ['#26211c', '#332c24', '#1c1815', '#3d342a'] },
  { id: 'peach',      name: 'Peach Fuzz',    c: ['#ffd9c4', '#ffc4a8', '#ffe8da', '#ffb28f'] },
  { id: 'lavhaze',    name: 'Lavender Haze', c: ['#e6dcf5', '#cdbcec', '#f2ecfa', '#b7a3e0'] },
  { id: 'mocha',      name: 'Mocha',         c: ['#d9c4b2', '#c0a288', '#e8dccf', '#a58265'] },
  { id: 'sunset',     name: 'Sunset',        c: ['#ffd2a8', '#f5a58c', '#fde7c8', '#e88a9a'] },
  { id: 'ocean',      name: 'Ocean',         c: ['#cfe6e4', '#a8cfd2', '#e4f1ef', '#7fb2ba'] },
  { id: 'champagner', name: 'Champagner',    c: ['#f3e5cf', '#e8d3ac', '#faf3e5', '#d9bd8a'] },
  { id: 'smaragd',    name: 'Smaragd',       c: ['#1e4038', '#2a5548', '#16302a', '#38695a'] },
  { id: 'bordeaux',   name: 'Bordeaux',      c: ['#5a2432', '#71303f', '#451a25', '#8a4252'] },
  { id: 'nachtgold',  name: 'Nachtblau Gold',c: ['#1d2436', '#2a3450', '#151a28', '#3a4668'] },
  { id: 'mint',       name: 'Mint',          c: ['#d8efe3', '#b8dfcc', '#eaf7f0', '#98cfb4'] },
  { id: 'puder',      name: 'Puderrosa',     c: ['#f7dfe2', '#f0c9cf', '#fceff0', '#e6afb9'] },
  { id: 'graphit',    name: 'Graphit',       c: ['#3a3a3e', '#4a4a50', '#2c2c30', '#5c5c64'] },
];

// deterministic pseudo random
function mulberry(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function hex2rgb(h) {
  h = h.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
SS.hex2rgb = hex2rgb;

// ---- painters (draw into ctx sized W×H) ----

function paintWatercolor(ctx, W, H, pal, variant) {
  const rnd = mulberry(1000 + variant * 77 + pal.id.length);
  const cols = pal.c;
  const g = ctx.createLinearGradient(0, 0, W * 0.15, H);
  g.addColorStop(0, cols[3] || cols[0]);
  g.addColorStop(1, cols[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // blurred blobs on low-res offscreen for speed
  const s = 8;
  const off = document.createElement('canvas');
  off.width = Math.ceil(W / s); off.height = Math.ceil(H / s);
  const octx = off.getContext('2d');
  octx.fillStyle = cols[0]; octx.fillRect(0, 0, off.width, off.height);
  const nBlobs = Math.max(14, Math.round(W / 260));
  for (let i = 0; i < nBlobs; i++) {
    const c = cols[Math.floor(rnd() * cols.length)];
    octx.fillStyle = c;
    octx.globalAlpha = 0.5 + rnd() * 0.4;
    octx.beginPath();
    octx.ellipse(rnd() * off.width, rnd() * off.height,
      (30 + rnd() * 60) / s * 8, (22 + rnd() * 42) / s * 8, rnd() * Math.PI, 0, Math.PI * 2);
    octx.fill();
  }
  octx.globalAlpha = 1;
  ctx.save();
  ctx.filter = 'blur(60px)';
  ctx.globalAlpha = 0.55;
  ctx.drawImage(off, -60, -60, W + 120, H + 120);
  ctx.restore();
  // grain
  paintGrain(ctx, W, H, pal.id === 'nacht' || pal.id === 'schwarzgold' ? 0.05 : 0.035, variant);
}

function paintGrain(ctx, W, H, amount, seed) {
  const s = 3;
  const off = document.createElement('canvas');
  off.width = 256; off.height = 256;
  const octx = off.getContext('2d');
  const id = octx.createImageData(256, 256);
  const rnd = mulberry(42 + seed);
  for (let i = 0; i < id.data.length; i += 4) {
    const v = 118 + rnd() * 60;
    id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
    id.data[i + 3] = 255;
  }
  octx.putImageData(id, 0, 0);
  ctx.save();
  ctx.globalAlpha = amount;
  ctx.globalCompositeOperation = 'overlay';
  const pat = ctx.createPattern(off, 'repeat');
  ctx.fillStyle = pat; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function paintTexture(ctx, W, H, kind, tintHex) {
  const [r, g, b] = hex2rgb(tintHex);
  ctx.fillStyle = tintHex; ctx.fillRect(0, 0, W, H);
  const rnd = mulberry(kind.length * 131);
  ctx.save();
  if (kind === 'papier') {
    paintGrain(ctx, W, H, 0.09, 3);
  } else if (kind === 'leinen') {
    ctx.globalAlpha = 0.07;
    ctx.strokeStyle = `rgb(${r - 30},${g - 30},${b - 30})`;
    ctx.lineWidth = 1;
    for (let y = 0; y < H; y += 3) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (let x = 0; x < W; x += 3) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    paintGrain(ctx, W, H, 0.05, 4);
  } else if (kind === 'kraft') {
    paintGrain(ctx, W, H, 0.12, 5);
    ctx.globalAlpha = 0.05;
    for (let i = 0; i < W / 3; i++) {
      ctx.fillStyle = rnd() > 0.5 ? '#fff' : '#000';
      ctx.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2, 1 + rnd() * 2);
    }
  } else if (kind === 'marmor') {
    ctx.globalAlpha = 0.13;
    ctx.strokeStyle = `rgb(${r - 40},${g - 40},${b - 35})`;
    for (let i = 0; i < Math.max(10, W / 300); i++) {
      ctx.lineWidth = 1 + rnd() * 2.5;
      ctx.beginPath();
      let x = rnd() * W, y = rnd() * H;
      ctx.moveTo(x, y);
      for (let k = 0; k < 14; k++) {
        x += (rnd() - 0.5) * 340; y += (rnd() - 0.5) * 260;
        ctx.quadraticCurveTo(x + (rnd() - 0.5) * 120, y + (rnd() - 0.5) * 120, x, y);
      }
      ctx.stroke();
    }
    paintGrain(ctx, W, H, 0.03, 6);
  } else if (kind === 'beton') {
    paintGrain(ctx, W, H, 0.14, 7);
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = '#000';
    for (let i = 0; i < W / 8; i++) {
      ctx.beginPath();
      ctx.ellipse(rnd() * W, rnd() * H, 1 + rnd() * 22, 1 + rnd() * 10, rnd() * 3, 0, 7);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ---- premium textures ----
function paintPremiumTexture(ctx, W, H, kind, seed) {
  const rnd = mulberry(700 + seed);
  if (kind === 'samt') {
    const g = ctx.createLinearGradient(0, 0, W * 0.3, H);
    g.addColorStop(0, '#4a2436'); g.addColorStop(0.5, '#5f2e44'); g.addColorStop(1, '#3a1b2a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 6; i++) {
      const sh = ctx.createRadialGradient(rnd() * W, rnd() * H, 50, rnd() * W, rnd() * H, 500);
      sh.addColorStop(0, 'rgba(255,255,255,0.06)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sh; ctx.fillRect(0, 0, W, H);
    }
    paintGrain(ctx, W, H, 0.06, seed);
  } else if (kind === 'seide') {
    const g = ctx.createLinearGradient(0, 0, W, H * 0.6);
    ['#efe6dc', '#fdf8f1', '#e2d5c6', '#f8f0e6', '#e8dccd'].forEach((c, i) => g.addColorStop(i / 4, c));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 10; i++) {
      const x = rnd() * W;
      const lg = ctx.createLinearGradient(x - 200, 0, x + 200, 0);
      lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,0.7)');
      lg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = lg; ctx.fillRect(x - 200, 0, 400, H);
    }
    ctx.globalAlpha = 1;
  } else if (kind === 'goldstaub') {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#241d16'); g.addColorStop(1, '#171310');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < W * H / 2600; i++) {
      const a = 0.15 + rnd() * 0.85;
      ctx.fillStyle = `rgba(${205 + rnd() * 50},${160 + rnd() * 50},${90 + rnd() * 40},${a})`;
      const r = rnd() < 0.94 ? 0.8 + rnd() * 1.8 : 2.5 + rnd() * 3;
      ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, r, 0, 7); ctx.fill();
    }
  } else if (kind === 'bokeh') {
    const g = ctx.createLinearGradient(0, 0, W * 0.2, H);
    g.addColorStop(0, '#2a2030'); g.addColorStop(1, '#1a1420');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const cols = ['255,205,150', '255,170,160', '210,170,255', '255,230,180'];
    for (let i = 0; i < Math.max(24, W / 130); i++) {
      const r = 20 + rnd() * 90;
      const col = cols[Math.floor(rnd() * cols.length)];
      const gr = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
      gr.addColorStop(0, `rgba(${col},${0.25 + rnd() * 0.3})`);
      gr.addColorStop(0.8, `rgba(${col},${0.12 + rnd() * 0.15})`);
      gr.addColorStop(1, `rgba(${col},0)`);
      ctx.save(); ctx.translate(rnd() * W, rnd() * H);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.restore();
    }
  } else if (kind === 'marmorgold') {
    ctx.fillStyle = '#232122'; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.16; ctx.strokeStyle = '#4a4648';
    for (let i = 0; i < Math.max(12, W / 260); i++) {
      ctx.lineWidth = 1 + rnd() * 3; ctx.beginPath();
      let x = rnd() * W, y = rnd() * H; ctx.moveTo(x, y);
      for (let k = 0; k < 12; k++) { x += (rnd() - 0.5) * 380; y += (rnd() - 0.5) * 300; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    ctx.globalAlpha = 0.75; ctx.strokeStyle = '#c9a15f';
    for (let i = 0; i < Math.max(5, W / 700); i++) {
      ctx.lineWidth = 0.8 + rnd() * 1.6; ctx.beginPath();
      let x = rnd() * W, y = rnd() * H; ctx.moveTo(x, y);
      for (let k = 0; k < 16; k++) {
        x += (rnd() - 0.5) * 300; y += (rnd() - 0.5) * 240;
        ctx.quadraticCurveTo(x + (rnd() - 0.5) * 90, y + (rnd() - 0.5) * 90, x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else if (kind === 'putz') {
    ctx.fillStyle = '#dfb9a2'; ctx.fillRect(0, 0, W, H);
    paintGrain(ctx, W, H, 0.16, seed);
    ctx.globalAlpha = 0.07; ctx.fillStyle = '#8a5a40';
    for (let i = 0; i < W / 4; i++) ctx.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 60, 1 + rnd() * 2);
    ctx.globalAlpha = 1;
  } else if (kind === 'aquanass') {
    ctx.fillStyle = '#fbf7f0'; ctx.fillRect(0, 0, W, H);
    const cols = ['#e8b4b8aa', '#b8cfc4aa', '#d9c4e0aa', '#e8d3a8aa', '#a8c4d9aa'];
    for (let i = 0; i < Math.max(8, W / 420); i++) {
      const cx = rnd() * W, cy = rnd() * H, r = 120 + rnd() * 260;
      const gr = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
      const col = cols[Math.floor(rnd() * cols.length)];
      gr.addColorStop(0, col); gr.addColorStop(0.85, col.slice(0, 7) + '33'); gr.addColorStop(1, col.slice(0, 7) + '00');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
      ctx.strokeStyle = col.slice(0, 7) + '66'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, r * (0.75 + rnd() * 0.2), 0, 7); ctx.stroke();
    }
    paintGrain(ctx, W, H, 0.05, seed);
  }
}

function paintPattern(ctx, W, H, kind, baseHex, inkHex) {
  ctx.fillStyle = baseHex; ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.fillStyle = inkHex; ctx.strokeStyle = inkHex;
  ctx.globalAlpha = 0.5;
  const step = 90;
  if (kind === 'punkte') {
    for (let y = step / 2; y < H; y += step)
      for (let x = step / 2 + (Math.floor(y / step) % 2) * step / 2; x < W; x += step) {
        ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill();
      }
  } else if (kind === 'sterne') {
    for (let y = step / 2; y < H; y += step)
      for (let x = step / 2 + (Math.floor(y / step) % 2) * step / 2; x < W; x += step)
        drawTwinklePath(ctx, x, y, 11), ctx.fill();
  } else if (kind === 'herzen') {
    for (let y = step / 2; y < H; y += step)
      for (let x = step / 2 + (Math.floor(y / step) % 2) * step / 2; x < W; x += step)
        drawHeartPath(ctx, x, y, 13), ctx.fill();
  } else if (kind === 'streifen') {
    ctx.lineWidth = 3;
    for (let x = -H; x < W; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + H, 0); ctx.stroke();
    }
  } else if (kind === 'karo') {
    ctx.lineWidth = 2; ctx.globalAlpha = 0.35;
    for (let x = 0; x < W; x += 70) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 70) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  } else if (kind === 'terrazzo') {
    const rnd = mulberry(99);
    for (let i = 0; i < W * H / 14000; i++) {
      ctx.globalAlpha = 0.35 + rnd() * 0.3;
      ctx.beginPath();
      const x = rnd() * W, y = rnd() * H, r = 4 + rnd() * 14;
      ctx.moveTo(x + r, y);
      for (let a = 0.9; a < 6.3; a += 0.9 + rnd() * 0.7)
        ctx.lineTo(x + Math.cos(a) * r * (0.6 + rnd() * 0.6), y + Math.sin(a) * r * (0.6 + rnd() * 0.6));
      ctx.closePath(); ctx.fill();
    }
  } else if (kind === 'boho') {
    const s = 160;
    ctx.lineWidth = 3; ctx.globalAlpha = 0.45;
    for (let y = 0; y < H + s; y += s * 0.62)
      for (let x = ((y / (s * 0.62)) % 2) * s / 2; x < W + s; x += s) {
        for (let r = s * 0.42; r > 6; r -= s * 0.11) {
          ctx.beginPath(); ctx.arc(x, y, r, Math.PI, 0); ctx.stroke();
        }
      }
  } else if (kind === 'checker') {
    const s = 110;
    for (let y = 0; y < H; y += s)
      for (let x = (Math.floor(y / s) % 2) * s; x < W; x += s * 2)
        ctx.fillRect(x, y, s, s);
  } else if (kind === 'wellen') {
    ctx.lineWidth = 3.5; ctx.globalAlpha = 0.4;
    for (let y = 30; y < H; y += 64) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 6) {
        const yy = y + Math.sin(x / 52) * 14;
        x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  } else if (kind === 'konfetti') {
    const rnd = mulberry(31);
    const cols = [inkHex, '#d9a8b4', '#c9b88a', '#a8bfc9', '#c4aed0'];
    for (let i = 0; i < W * H / 16000; i++) {
      ctx.fillStyle = cols[Math.floor(rnd() * cols.length)];
      ctx.globalAlpha = 0.5 + rnd() * 0.4;
      ctx.save(); ctx.translate(rnd() * W, rnd() * H); ctx.rotate(rnd() * 6.3);
      rnd() < 0.5 ? ctx.fillRect(-6, -2.5, 12, 5) : (ctx.beginPath(), ctx.arc(0, 0, 4, 0, 7), ctx.fill());
      ctx.restore();
    }
  } else if (kind === 'dotgrid') {
    ctx.globalAlpha = 0.5;
    for (let y = 30; y < H; y += 46)
      for (let x = 30; x < W; x += 46) { ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 7); ctx.fill(); }
  } else if (kind === 'karopapier') {
    ctx.lineWidth = 1.2; ctx.globalAlpha = 0.4;
    for (let x = 0; x < W; x += 44) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 44) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }
  ctx.restore();
}

// shared path helpers (also used by stickers)
function drawHeartPath(ctx, cx, cy, s) {
  ctx.beginPath();
  for (let i = 0; i <= 60; i++) {
    const t = 2 * Math.PI * i / 60;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    const px = cx + x * s / 17, py = cy - y * s / 17;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}
function drawTwinklePath(ctx, cx, cy, r, rot = Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = rot + i * Math.PI / 4;
    const rad = i % 2 === 0 ? r : r * 0.22;
    const px = cx + rad * Math.cos(a), py = cy + rad * Math.sin(a);
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}
SS.drawHeartPath = drawHeartPath;
SS.drawTwinklePath = drawTwinklePath;

// ---- library definition ----
SS.BG_LIB = [];
(function build() {
  for (const pal of SS.PALETTES)
    for (let v = 1; v <= 4; v++)
      SS.BG_LIB.push({ id: `aq-${pal.id}-${v}`, cat: 'aquarell', name: `${pal.name} ${v}`,
        paint: (ctx, W, H) => paintWatercolor(ctx, W, H, pal, v) });

  const texTints = { papier: ['#f8f4ec', '#efe4d2'], leinen: ['#f3eee4', '#e6ddd0'],
    kraft: ['#d9c1a0', '#c8ab85'], marmor: ['#f4f2ee', '#e8e2d8'], beton: ['#dcd8d2', '#c9c4bc'] };
  const texNames = { papier: 'Papier', leinen: 'Leinen', kraft: 'Kraftpapier', marmor: 'Marmor', beton: 'Beton' };
  for (const kind of Object.keys(texTints))
    texTints[kind].forEach((tint, i) =>
      SS.BG_LIB.push({ id: `tx-${kind}-${i}`, cat: 'textur', name: texNames[kind] + (i ? ' getönt' : ''),
        paint: (ctx, W, H) => paintTexture(ctx, W, H, kind, tint) }));

  const premium = [
    ['samt', 'Samt Bordeaux'], ['seide', 'Seide'], ['goldstaub', 'Goldstaub'],
    ['bokeh', 'Bokeh-Lichter'], ['marmorgold', 'Marmor & Gold'], ['putz', 'Terrakotta-Putz'],
    ['aquanass', 'Aquarell nass'],
  ];
  premium.forEach(([kind, name], i) =>
    SS.BG_LIB.push({ id: `pr-${kind}`, cat: 'textur', name,
      paint: (ctx, W, H) => paintPremiumTexture(ctx, W, H, kind, i) }));

  const patDefs = [
    ['punkte', 'Punkte', '#f8f0ea', '#d9b8ad'], ['punkte', 'Punkte dunkel', '#2e3244', '#5d647e'],
    ['sterne', 'Sternchen', '#faf5ec', '#d4b483'], ['sterne', 'Sterne Nacht', '#2b2f40', '#c9a876'],
    ['herzen', 'Herzchen', '#faefee', '#dfa8b2'], ['streifen', 'Streifen', '#f6efe7', '#e3cdbb'],
    ['karo', 'Karo', '#f5f1ea', '#d8c8b4'], ['terrazzo', 'Terrazzo', '#f6f1e9', '#cdb9a4'],
    ['boho', 'Boho-Bögen', '#f4ead9', '#c9a382'], ['boho', 'Boho Nacht', '#2c2620', '#8a744f'],
    ['checker', 'Checkerboard', '#f6f0e6', '#e0d2ba'], ['wellen', 'Wellen', '#eef2f0', '#a8c4bc'],
    ['konfetti', 'Konfetti', '#fdf9f2', '#d9a8b4'], ['dotgrid', 'Dot-Grid', '#f8f5ef', '#b8a890'],
    ['karopapier', 'Karopapier', '#fbf8f2', '#c9d4e0'],
  ];
  patDefs.forEach(([kind, name, base, ink], i) =>
    SS.BG_LIB.push({ id: `pt-${kind}-${i}`, cat: 'muster', name,
      paint: (ctx, W, H) => paintPattern(ctx, W, H, kind, base, ink) }));
})();

// ---- background cache & painting ----
let _bgCache = null, _bgKey = '';
SS.bgCacheInvalidate = () => { _bgKey = ''; };

SS.paintBackground = function (ctx, W, H, forExport) {
  const bg = SS.state.bg;
  const key = JSON.stringify([bg, W, H]);
  if (!forExport && _bgCache && _bgKey === key) {
    ctx.drawImage(_bgCache, 0, 0);
    return;
  }
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  if (bg.type === 'preset') {
    const def = SS.BG_LIB.find(b => b.id === bg.id) || SS.BG_LIB[0];
    def.paint(c, W, H);
    if (bg.hue) {  // global hue-shift → every preset becomes any color world
      const tmp = document.createElement('canvas');
      tmp.width = W; tmp.height = H;
      const tc = tmp.getContext('2d');
      tc.filter = `hue-rotate(${bg.hue}deg)`;
      tc.drawImage(cv, 0, 0);
      c.clearRect(0, 0, W, H);
      c.drawImage(tmp, 0, 0);
    }
  } else if (bg.type === 'gradient') {
    const a = SS.deg2rad(bg.angle || 115);
    const r = Math.max(W, H);
    const g = c.createLinearGradient(W / 2 - Math.cos(a) * r / 2, H / 2 - Math.sin(a) * r / 2,
      W / 2 + Math.cos(a) * r / 2, H / 2 + Math.sin(a) * r / 2);
    g.addColorStop(0, bg.c1); g.addColorStop(1, bg.c2);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    paintGrain(c, W, H, 0.03, 9);
  } else if (bg.type === 'image' && SS.images.__bg) {
    const im = SS.images.__bg.img;
    const sc = Math.max(W / im.width, H / im.height);
    const dw = im.width * sc, dh = im.height * sc;
    c.save();
    if (bg.blur) c.filter = `blur(${bg.blur}px)`;
    c.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh);
    c.restore();
    if (bg.darken) { c.fillStyle = `rgba(20,12,8,${bg.darken / 100})`; c.fillRect(0, 0, W, H); }
  } else {
    c.fillStyle = '#f6ede8'; c.fillRect(0, 0, W, H);
  }
  if (!forExport) { _bgCache = cv; _bgKey = key; }
  ctx.drawImage(cv, 0, 0);
};
