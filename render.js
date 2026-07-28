/* Seamless Studio – rendering engine */

SS.FILTER_PRESETS = [
  { id: 'original', name: 'Original', f: {} },
  { id: 'warm',     name: 'Warm',        f: { warmth: 25, saturate: 108 } },
  { id: 'golden',   name: 'Golden Hour', f: { warmth: 45, brightness: 104, contrast: 104, saturate: 112 } },
  { id: 'softfilm', name: 'Soft Film',   f: { contrast: 92, brightness: 105, saturate: 90, grain: 14 } },
  { id: 'creamy',   name: 'Creamy',      f: { brightness: 107, contrast: 90, saturate: 88, warmth: 18 } },
  { id: 'fade',     name: 'Fade',        f: { contrast: 82, brightness: 108, saturate: 82 } },
  { id: 'matte',    name: 'Matte',       f: { contrast: 88, saturate: 92, vignette: 18 } },
  { id: 'cool',     name: 'Cool',        f: { warmth: -25, saturate: 96 } },
  { id: 'vivid',    name: 'Vivid',       f: { saturate: 135, contrast: 110 } },
  { id: 'sepia',    name: 'Sepia',       f: { sepia: 65, warmth: 10, contrast: 96 } },
  { id: 'bw',       name: 'S/W',         f: { saturate: 0, contrast: 104 } },
  { id: 'bwhard',   name: 'S/W Kontrast',f: { saturate: 0, contrast: 128, brightness: 104 } },
];

SS.defaultFilter = () => ({ preset: 'original', brightness: 100, contrast: 100, saturate: 100,
  warmth: 0, sepia: 0, blur: 0, vignette: 0, grain: 0,
  highlights: 0, shadows: 0, black: 0, white: 0 });

/* Tonwert-Kurve: Lichter, Tiefen, Schwarz- und Weißpunkt als 256er-Tabelle.
   Wirkt auf alle drei Kanäle gleich, damit Farben erhalten bleiben. */
SS.toneLUT = function (fl) {
  const hi = (fl.highlights || 0) / 100, sh = (fl.shadows || 0) / 100;
  const bp = (fl.black || 0) / 100 * 0.42, wp = (fl.white || 0) / 100 * 0.42;
  const lut = new Uint8ClampedArray(256);
  const lo = bp * 255, up = 255 - wp * 255;
  const span = Math.max(1, up - lo);
  for (let i = 0; i < 256; i++) {
    let v = (i - lo) / span;             // Schwarz- und Weißpunkt
    v = Math.max(0, Math.min(1, v));
    v += sh * 0.55 * Math.pow(1 - v, 2);  // Tiefen öffnen oder schließen
    v += hi * 0.55 * Math.pow(v, 2);      // Lichter zurückholen oder anheben
    lut[i] = Math.round(Math.max(0, Math.min(1, v)) * 255);
  }
  return lut;
};
SS.hasTone = (fl) => !!(fl && (fl.highlights || fl.shadows || fl.black || fl.white || fl.curve || fl.hsl));

/* Freie Kurve: vier Stützpunkte, monoton interpoliert, als 256er-Tabelle */
SS.curveLUT = function (pts) {
  const p = [{ x: 0, y: 0 }].concat(pts.map(q => ({ x: q.x, y: q.y }))).concat([{ x: 1, y: 1 }])
    .sort((a, b) => a.x - b.x);
  const lut = new Uint8ClampedArray(256);
  for (let i = 0; i < 256; i++) {
    const x = i / 255;
    let k = 0;
    while (k < p.length - 2 && p[k + 1].x < x) k++;
    const a = p[k], b = p[k + 1];
    const t = b.x === a.x ? 0 : (x - a.x) / (b.x - a.x);
    const e = t * t * (3 - 2 * t);            // weiche Schulter statt Knick
    lut[i] = Math.round(Math.max(0, Math.min(1, a.y + (b.y - a.y) * e)) * 255);
  }
  return lut;
};

/* Farbbereiche für den HSL-Mischer */
SS.HSL_RANGES = [
  ['rot', 'Rot', 350, 15], ['orange', 'Orange', 15, 45], ['gelb', 'Gelb', 45, 70],
  ['gruen', 'Grün', 70, 165], ['blau', 'Blau', 165, 265], ['magenta', 'Magenta', 265, 350],
];

SS.rgb2hsl = function (r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  const l = (mx + mn) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return [h, s, l];
};
SS.hsl2rgb = function (h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
};

/* ---------- filtered photo cache ---------- */
const _photoCache = {}; // el.id -> {key, canvas}
SS.photoCacheClear = (id) => { if (id) delete _photoCache[id]; else Object.keys(_photoCache).forEach(k => delete _photoCache[k]); };

/* Quellbild zuschneiden: 90°-Drehung, Rechteck, Begradigen.
   Fällt auf den alten Zoom/Versatz-Zuschnitt zurück, wenn kein Rechteck gesetzt ist. */
SS.cropSource = function (rec, cr) {
  let img = rec.img, iw = rec.w, ih = rec.h;

  // 1) Vielfache von 90°
  const q = ((cr.rot90 || 0) % 360 + 360) % 360;
  if (q) {
    const swap = q === 90 || q === 270;
    const cv = SS.makeCanvas(swap ? ih : iw, swap ? iw : ih);
    const c = cv.getContext('2d');
    c.translate(cv.width / 2, cv.height / 2);
    c.rotate(SS.deg2rad(q));
    c.drawImage(img, -iw / 2, -ih / 2);
    img = cv; iw = cv.width; ih = cv.height;
  }

  // 2) Rechteck (mit Begradigung)
  if (cr.rect) {
    const r = cr.rect;
    const w = Math.max(8, Math.round(r.w)), h = Math.max(8, Math.round(r.h));
    const ang = SS.deg2rad(cr.angle || 0);
    if (!ang) {
      const cv = SS.makeCanvas(w, h);
      cv.getContext('2d').drawImage(img, r.x, r.y, r.w, r.h, 0, 0, w, h);
      return { canvas: cv, w, h };
    }
    const co = Math.abs(Math.cos(ang)), si = Math.abs(Math.sin(ang));
    const bw = Math.ceil(w * co + h * si), bh = Math.ceil(w * si + h * co);
    const tmp = SS.makeCanvas(bw, bh);
    const tc = tmp.getContext('2d');
    tc.translate(bw / 2, bh / 2);
    tc.drawImage(img, -(r.x + r.w / 2), -(r.y + r.h / 2));
    const out = SS.makeCanvas(w, h);
    const oc = out.getContext('2d');
    oc.translate(w / 2, h / 2);
    oc.rotate(-ang);
    oc.drawImage(tmp, -bw / 2, -bh / 2);
    SS.freeCanvas(tmp);
    return { canvas: out, w, h };
  }

  // 3) alter Zoom-/Versatz-Zuschnitt
  if (cr.zoom > 1.001) {
    const vw = iw / cr.zoom, vh = ih / cr.zoom;
    const sx = (iw - vw) / 2 * (1 + SS.clamp(cr.ox, -1, 1));
    const sy = (ih - vh) / 2 * (1 + SS.clamp(cr.oy, -1, 1));
    const cv = SS.makeCanvas(vw, vh);
    cv.getContext('2d').drawImage(img, sx, sy, vw, vh, 0, 0, cv.width, cv.height);
    return { canvas: cv, w: cv.width, h: cv.height };
  }
  return { canvas: img, w: iw, h: ih };
};

SS.filteredPhoto = function (el) {
  const rec = SS.images[el.imgId];
  if (!rec) return null;
  const fl = el.filter;
  const cr = el.crop || { zoom: 1, ox: 0, oy: 0 };
  const key = JSON.stringify(fl) + (el.flip ? 'F' : '') + JSON.stringify(cr);
  const hit = _photoCache[el.id];
  if (hit && hit.key === key) return hit.canvas;

  const src = SS.cropSource(rec, cr);
  let srcImg = src.canvas, sw = src.w, sh = src.h;

  const cv = document.createElement('canvas');
  cv.width = sw; cv.height = sh;
  const c = cv.getContext('2d');
  const parts = [];
  if (fl.brightness !== 100) parts.push(`brightness(${fl.brightness}%)`);
  if (fl.contrast !== 100) parts.push(`contrast(${fl.contrast}%)`);
  if (fl.saturate !== 100) parts.push(`saturate(${fl.saturate}%)`);
  if (fl.sepia) parts.push(`sepia(${fl.sepia}%)`);
  if (fl.blur) parts.push(`blur(${fl.blur}px)`);
  if (parts.length) c.filter = parts.join(' ');
  c.save();
  if (el.flip) { c.translate(cv.width, 0); c.scale(-1, 1); }
  c.drawImage(srcImg, 0, 0, cv.width, cv.height);
  c.restore();
  c.filter = 'none';

  if (SS.hasTone(fl)) {
    const lut = SS.toneLUT(fl);
    const clut = fl.curve && fl.curve.length ? SS.curveLUT(fl.curve) : null;
    const hsl = fl.hsl;
    const img = c.getImageData(0, 0, cv.width, cv.height);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      let r = lut[d[i]], g = lut[d[i + 1]], b = lut[d[i + 2]];
      if (clut) { r = clut[r]; g = clut[g]; b = clut[b]; }
      if (hsl) {
        const [h0, s0, l0] = SS.rgb2hsl(r, g, b);
        if (s0 > 0.04) {
          for (const [key, , from, to] of SS.HSL_RANGES) {
            const adj = hsl[key];
            if (!adj || (!adj.h && !adj.s && !adj.l)) continue;
            const inRange = from > to ? (h0 >= from || h0 < to) : (h0 >= from && h0 < to);
            if (!inRange) continue;
            const nh = (h0 + (adj.h || 0) + 360) % 360;
            const ns = Math.max(0, Math.min(1, s0 * (1 + (adj.s || 0) / 100)));
            const nl = Math.max(0, Math.min(1, l0 * (1 + (adj.l || 0) / 100)));
            const out = SS.hsl2rgb(nh, ns, nl);
            r = out[0]; g = out[1]; b = out[2];
            break;
          }
        }
      }
      d[i] = r; d[i + 1] = g; d[i + 2] = b;
    }
    c.putImageData(img, 0, 0);
  }

  /* Freisteller: Schlagschatten und Kontur ansetzen, damit das Motiv
     nicht aufgeklebt wirkt. drop-shadow arbeitet auf dem Alphakanal. */
  if (el.cutout && (el.cutShadow || el.cutOutline)) {
    const tmp = SS.makeCanvas(cv.width, cv.height);
    tmp.getContext('2d').drawImage(cv, 0, 0);
    c.clearRect(0, 0, cv.width, cv.height);
    const u = Math.max(cv.width, cv.height) / 100;
    const parts = [];
    if (el.cutOutline) {
      const d = Math.max(1, (el.cutOutlineWidth ?? 6) * u * 0.16);
      const col = el.cutOutlineColor || '#ffffff';
      for (const [dx, dy] of [[d, 0], [-d, 0], [0, d], [0, -d], [d * .7, d * .7], [-d * .7, d * .7], [d * .7, -d * .7], [-d * .7, -d * .7]])
        parts.push(`drop-shadow(${dx.toFixed(2)}px ${dy.toFixed(2)}px 0 ${col})`);
    }
    if (el.cutShadow) {
      const o = (el.cutShadowOffset ?? 24) * u * 0.14;
      const bl = (el.cutShadowBlur ?? 30) * u * 0.2;
      parts.push(`drop-shadow(${o.toFixed(2)}px ${(o * 1.2).toFixed(2)}px ${bl.toFixed(2)}px rgba(20,14,10,${(el.cutShadowAlpha ?? 45) / 100}))`);
    }
    c.filter = parts.join(' ');
    c.drawImage(tmp, 0, 0);
    c.filter = 'none';
    SS.freeCanvas(tmp);
  }

  if (fl.warmth) {
    c.save();
    c.globalCompositeOperation = fl.warmth > 0 ? 'overlay' : 'overlay';
    c.globalAlpha = Math.abs(fl.warmth) / 130;
    c.fillStyle = fl.warmth > 0 ? '#ff9a3c' : '#3c78ff';
    c.fillRect(0, 0, cv.width, cv.height);
    c.restore();
  }
  if (fl.vignette) {
    const g = c.createRadialGradient(cv.width / 2, cv.height / 2, Math.min(cv.width, cv.height) * 0.35,
      cv.width / 2, cv.height / 2, Math.max(cv.width, cv.height) * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(20,10,5,${fl.vignette / 100})`);
    c.fillStyle = g; c.fillRect(0, 0, cv.width, cv.height);
  }
  if (fl.grain) {
    const off = document.createElement('canvas');
    off.width = 128; off.height = 128;
    const oc = off.getContext('2d');
    const idata = oc.createImageData(128, 128);
    for (let i = 0; i < idata.data.length; i += 4) {
      const v = 100 + Math.random() * 90;
      idata.data[i] = idata.data[i + 1] = idata.data[i + 2] = v; idata.data[i + 3] = 255;
    }
    oc.putImageData(idata, 0, 0);
    c.save(); c.globalAlpha = fl.grain / 100; c.globalCompositeOperation = 'overlay';
    c.fillStyle = c.createPattern(off, 'repeat'); c.fillRect(0, 0, cv.width, cv.height);
    c.restore();
  }
  _photoCache[el.id] = { key, canvas: cv };
  return cv;
};

/* ---------- card cache (frame applied) ---------- */
const _cardCache = {};
SS.cardCacheClear = (id) => { if (id) delete _cardCache[id]; else Object.keys(_cardCache).forEach(k => delete _cardCache[k]); };

SS.photoCard = function (el) {
  const src = SS.filteredPhoto(el);
  if (!src) return null;
  const key = JSON.stringify([el.frame, el.h, el.flip, el.filter]);
  const hit = _cardCache[el.id];
  if (hit && hit.key === key) return hit.canvas;
  const cv = SS.buildCard(el, src, el.h);
  _cardCache[el.id] = { key, canvas: cv };
  return cv;
};

/* ---------- element size helper (inklusive freier Verzerrung) ---------- */
SS.elSizeRaw = function (el) {
  if (el.type === 'photo') {
    const card = SS.photoCard(el);
    return card ? { w: card.width, h: card.height } : { w: 100, h: 100 };
  }
  if (el.type === 'text') {
    const m = SS.measureText(el);
    return { w: m.w, h: m.h };
  }
  if (el.type === 'sticker' || el.type === 'emoji') {
    const def = el.type === 'sticker' ? SS.STICKERS.find(s => s.id === el.kind) : null;
    const ar = def && def.ar ? def.ar : 1;
    return { w: el.s * ar, h: el.s };
  }
  if (el.type === 'blur') return { w: el.w, h: el.h };
  if (el.type === 'video') return { w: el.w, h: el.h };
  return { w: 100, h: 100 };
};
SS.elSize = function (el) {
  const r = SS.elSizeRaw(el);
  return { w: r.w * (el.scaleX || 1), h: r.h * (el.scaleY || 1) };
};

/* Gemeinsame, achsenparallele Hülle einer Elementliste */
SS.boundsOf = function (list) {
  if (!list || !list.length) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const el of list) {
    const { w, h } = SS.elSize(el);
    const r = SS.deg2rad(el.rot || 0);
    const co = Math.cos(r), si = Math.sin(r);
    for (const [dx, dy] of [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]) {
      const px = el.x + dx * co - dy * si;
      const py = el.y + dx * si + dy * co;
      if (px < x0) x0 = px; if (px > x1) x1 = px;
      if (py < y0) y0 = py; if (py > y1) y1 = py;
    }
  }
  return { x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
};
SS.selBounds = () => SS.boundsOf(SS.getSelAll());

/* ---------- Textmodell: Füllung, Kontur, Schatten und Glow sind unabhängig ---------- */
SS.normalizeText = function (el) {
  if (el.fill === undefined) {
    const e = el.effect || 'none';
    if (e === 'kontur') { el.fill = 'none'; el.hollow = true; el.outline = true; el.outlineColor = el.outlineColor || el.color; }
    else if (e === 'neon') { el.fill = 'neon'; el.glow = true; el.glowColor = el.glowColor || el.color; }
    else el.fill = (e === 'gold' || e === '3d') ? e : 'none';
  }
  if (el.hollow === undefined) el.hollow = false;
  if (el.outline === undefined) el.outline = false;
  if (el.outlineColor === undefined) el.outlineColor = '#ffffff';
  if (el.outlineWidth === undefined) el.outlineWidth = 8;      // Prozent der Schriftgröße
  if (el.shadow === undefined) el.shadow = false;
  if (el.shadowColor === undefined) el.shadowColor = '#1e0f08';
  if (el.shadowBlur === undefined) el.shadowBlur = 18;         // Prozent
  if (el.shadowX === undefined) el.shadowX = 0;
  if (el.shadowY === undefined) el.shadowY = 5;
  if (el.glow === undefined) el.glow = false;
  if (el.glowColor === undefined) el.glowColor = el.color || '#ffd9a0';
  if (el.glowStrength === undefined) el.glowStrength = 45;     // Prozent
  return el;
};

/* ---------- text measuring & drawing ---------- */
SS.fontCSS = function (el, scale = 1) {
  const it = el.italic ? 'italic ' : '';
  const wt = el.bold ? '700 ' : '400 ';
  return `${it}${wt}${el.size * scale}px "${el.font}"`;
};

SS.measureText = function (el) {
  const c = SS._measureCtx || (SS._measureCtx = document.createElement('canvas').getContext('2d'));
  c.font = SS.fontCSS(el);
  const lines = (el.content || ' ').split('\n');
  let w = 0;
  for (const ln of lines) {
    const m = c.measureText(ln);
    w = Math.max(w, m.width + Math.abs(el.letterSpacing || 0) * ln.length);
  }
  const lh = el.size * (el.lineHeight || 1.35);
  const padX = el.bgStyle !== 'none' ? el.size * 0.7 : 6;
  const padY = el.bgStyle !== 'none' ? el.size * 0.45 : 4;
  return { w: w + padX * 2, h: lines.length * lh + padY * 2, lh, padX, padY };
};

function roundRectPath(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/* text background painters — behind the glyphs */
function paintTextBg(c, el, m, lineWidths) {
  const style = el.bgStyle;
  if (!style || style === 'none' || style === 'glass') return;
  const alpha = (el.opacity ?? 1) * (el.bgAlpha ?? 0.85);
  const col = el.bgColor || '#ffffff';
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = col;
  const x = -m.w / 2, y = -m.h / 2;

  if (style === 'pill' || style === 'card') {
    roundRectPath(c, x, y, m.w, m.h, style === 'pill' ? m.h / 2 : Math.min(18, m.h / 4));
    c.fill();
  } else if (style === 'label' || style === 'marker') {
    // per-line boxes like the Instagram text tool
    lineWidths.forEach((lw, i) => {
      const bw = lw + m.padX * 1.5;
      const by = y + m.padY + m.lh * i + m.lh * 0.06;
      const bh = m.lh * 0.92;
      let bx = -bw / 2;
      if (el.align === 'left') bx = x + m.padX * 0.25;
      if (el.align === 'right') bx = -x - m.padX * 0.25 - bw;
      if (style === 'label') { roundRectPath(c, bx, by, bw, bh, bh * 0.34); c.fill(); }
      else {
        c.save(); c.transform(1, 0, -0.1, 1, 0, 0);
        const rr = mulbT(i * 7 + el.id.length);
        c.beginPath();
        c.moveTo(bx + rr() * 6, by + bh * 0.16 + rr() * 4);
        c.lineTo(bx + bw - rr() * 6, by + bh * 0.1 + rr() * 5);
        c.lineTo(bx + bw - rr() * 8, by + bh * 0.9 - rr() * 4);
        c.lineTo(bx + rr() * 8, by + bh * 0.86 + rr() * 4);
        c.closePath(); c.fill();
        c.restore();
      }
    });
  } else if (style === 'sticky') {
    c.save();
    c.shadowColor = 'rgba(30,20,10,.3)'; c.shadowBlur = 16; c.shadowOffsetY = 8;
    c.fillRect(x, y, m.w, m.h);
    c.restore();
    c.globalAlpha = alpha * 0.85;
    c.fillStyle = '#efe6cf';
    c.save(); c.translate(0, y + 4); c.rotate(-0.03);
    c.fillRect(-m.w * 0.14, -m.padY * 0.7, m.w * 0.28, m.padY * 1.1);
    c.restore();
  } else if (style === 'ribbon') {
    const fold = m.h * 0.42;
    c.fillStyle = shadeHex(col, -35);
    c.beginPath();
    c.moveTo(x - fold, y + m.h * 0.18); c.lineTo(x + 2, y + m.h * 0.18);
    c.lineTo(x + 2, y + m.h * 0.82); c.lineTo(x - fold, y + m.h * 0.82);
    c.lineTo(x - fold * 0.55, y + m.h / 2); c.closePath(); c.fill();
    c.beginPath();
    c.moveTo(-x + fold, y + m.h * 0.18); c.lineTo(-x - 2, y + m.h * 0.18);
    c.lineTo(-x - 2, y + m.h * 0.82); c.lineTo(-x + fold, y + m.h * 0.82);
    c.lineTo(-x + fold * 0.55, y + m.h / 2); c.closePath(); c.fill();
    c.fillStyle = col;
    c.fillRect(x, y, m.w, m.h);
  } else if (style === 'torn') {
    const rr = mulbT(el.id.length * 3);
    c.save();
    c.shadowColor = 'rgba(30,20,10,.22)'; c.shadowBlur = 10; c.shadowOffsetY = 5;
    c.beginPath();
    const jag = Math.max(5, m.h * 0.05);
    const edge = (x0, y0, x1, y1, n) => {
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        c.lineTo(x0 + (x1 - x0) * t + (rr() - 0.5) * jag * 2, y0 + (y1 - y0) * t + (rr() - 0.5) * jag * 2);
      }
    };
    c.moveTo(x, y);
    edge(x, y, x + m.w, y, 14); edge(x + m.w, y, x + m.w, y + m.h, 8);
    edge(x + m.w, y + m.h, x, y + m.h, 14); edge(x, y + m.h, x, y, 8);
    c.closePath(); c.fill();
    c.restore();
  } else if (style === 'stamp') {
    c.strokeStyle = col; c.lineWidth = Math.max(2.5, m.h * 0.03);
    c.setLineDash([m.h * 0.12, m.h * 0.08]);
    roundRectPath(c, x, y, m.w, m.h, 10);
    c.stroke();
    c.setLineDash([]);
  } else if (style === 'kreis') {
    c.strokeStyle = col; c.lineWidth = Math.max(3, m.h * 0.035);
    c.lineCap = 'round';
    c.beginPath();
    c.ellipse(0, 0, m.w * 0.58, m.h * 0.72, -0.04, 0.25, Math.PI * 2 + 0.55);
    c.stroke();
  } else if (style === 'underline') {
    c.strokeStyle = col; c.lineWidth = Math.max(3, el.size * 0.09);
    c.lineCap = 'round';
    lineWidths.forEach((lw, i) => {
      const by = y + m.padY + m.lh * (i + 0.92);
      let bx = -lw / 2;
      if (el.align === 'left') bx = x + m.padX;
      if (el.align === 'right') bx = -x - m.padX - lw;
      c.beginPath();
      c.moveTo(bx, by);
      c.quadraticCurveTo(bx + lw / 2, by + el.size * 0.1, bx + lw, by - el.size * 0.02);
      c.stroke();
    });
  }
  c.restore();
}
function shadeHex(hex, amt) {
  const h = hex.replace('#', '');
  const n = [0, 2, 4].map(i => Math.max(0, Math.min(255, parseInt(h.slice(i, i + 2), 16) + amt)));
  return '#' + n.map(v => v.toString(16).padStart(2, '0')).join('');
}
function mulbT(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* ---------- Glow-Helfer für die Animations-Engine ---------- */
/* Zeichnet erst einen weichen Schein, dann die Form selbst. */
SS.paintWithGlow = function (c, glow, paint) {
  if (glow && glow.blur > 0.5) {
    c.save();
    c.shadowColor = glow.color;
    c.shadowBlur = glow.blur;
    c.save(); paint(); c.restore();
    if (glow.power > 0.45) { c.save(); paint(); c.restore(); }   // kräftiger Schein
    c.restore();
  }
  c.save(); paint(); c.restore();
};

let _textGlow = null;   // Leucht-Schein aus der Animation (überlagert den festen Glow)

/* Kontur und Füllung – ohne Schatten und ohne Glow */
function paintGlyph(c, el, ln, x, y) {
  const fill = el.fill || 'none';
  if (el.outline) {
    c.save();
    c.strokeStyle = el.outlineColor || '#ffffff';
    c.lineWidth = Math.max(1, el.size * (el.outlineWidth === undefined ? 8 : el.outlineWidth) / 100);
    c.lineJoin = 'round'; c.miterLimit = 2;
    c.strokeText(ln, x, y);
    c.restore();
  }
  if (el.hollow) return;
  if (fill === 'gold') {
    const w = Math.max(10, c.measureText(ln).width);
    const g = c.createLinearGradient(x - w / 2, y - el.size / 2, x + w / 2, y + el.size / 2);
    ['#8c6a2f', '#e8cf96', '#c9a15f', '#f6e7b8', '#a37d3d'].forEach((col, i) => g.addColorStop(i / 4, col));
    c.fillStyle = g;
    c.fillText(ln, x, y);
  } else if (fill === 'neon') {
    c.fillStyle = el.color; c.fillText(ln, x, y);
    c.save();
    c.shadowColor = el.color; c.shadowBlur = el.size * 0.18;
    c.fillStyle = '#ffffff'; c.fillText(ln, x, y);
    c.restore();
  } else if (fill === '3d') {
    c.fillStyle = shadeHex(el.color, -70);
    const off = Math.max(2, el.size * 0.045);
    c.fillText(ln, x + off, y + off);
    c.fillText(ln, x + off * 0.6, y + off * 0.6);
    c.fillStyle = el.color;
    c.fillText(ln, x, y);
  } else {
    c.fillStyle = el.color;
    c.fillText(ln, x, y);
  }
}

/* Welcher Schein gilt gerade? Animation schlägt die feste Einstellung. */
function glowSpec(el) {
  if (_textGlow) return _textGlow;
  if (el.glow) {
    const p = (el.glowStrength === undefined ? 45 : el.glowStrength) / 100;
    return { color: el.glowColor || el.color, blur: Math.max(2, el.size * 0.5 * p), power: p };
  }
  return null;
}

/* Eine Zeile zeichnen: Schatten → Glow → Kontur/Füllung */
function drawStyledLine(c, el, ln, x, y) {
  if (el.shadow) {
    c.save();
    c.shadowColor = el.shadowColor || 'rgba(30,15,8,.55)';
    c.shadowBlur = el.size * (el.shadowBlur === undefined ? 18 : el.shadowBlur) / 100;
    c.shadowOffsetX = el.size * (el.shadowX || 0) / 100;
    c.shadowOffsetY = el.size * (el.shadowY === undefined ? 5 : el.shadowY) / 100;
    paintGlyph(c, el, ln, x, y);
    c.restore();
  }
  const g = glowSpec(el);
  if (g && g.blur > 0.5) {
    c.save();
    c.shadowColor = g.color; c.shadowBlur = g.blur;
    paintGlyph(c, el, ln, x, y);
    if (g.power > 0.45) paintGlyph(c, el, ln, x, y);
    c.restore();
  }
  paintGlyph(c, el, ln, x, y);
}

/* curved single line (per-char along an arc) */
function drawCurvedLine(c, el, ln, cy) {
  const curve = SS.clamp(el.curve || 0, -100, 100);
  const chars = [...ln];
  const widths = chars.map(ch => c.measureText(ch).width + (el.letterSpacing || 0));
  const total = widths.reduce((a, b) => a + b, 0);
  const R = Math.max(total * 0.6, 26000 / Math.abs(curve));
  const dir = curve > 0 ? 1 : -1;
  const totalAngle = total / R;
  let a = -totalAngle / 2;
  c.save();
  c.translate(0, cy + dir * R);
  c.textAlign = 'center';
  for (let i = 0; i < chars.length; i++) {
    const half = widths[i] / 2 / R;
    a += half;
    c.save();
    c.rotate(a * dir);
    c.translate(0, -dir * R);
    drawStyledLine(c, el, chars[i], 0, 0);
    c.restore();
    a += half;
  }
  c.restore();
}

/* Eine Zeile Buchstabe für Buchstabe zeichnen (Buchstaben-Animationen) */
function drawLinePerChar(c, el, chars, wordIdx, startIdx, total, x, y, def) {
  const ls = el.letterSpacing || 0;
  if (el.letterSpacing) c.letterSpacing = '0px';      // Abstand rechnen wir selbst
  const widths = chars.map(ch => c.measureText(ch).width);
  const lineW = widths.reduce((a, b) => a + b, 0) + ls * Math.max(0, chars.length - 1);

  let cx;
  if (el.align === 'left') cx = x;
  else if (el.align === 'right') cx = x - lineW;
  else cx = -lineW / 2;

  const t = SS.animT * (el.animSpeed === undefined ? 1 : el.animSpeed) + (el.animPhase || 0);
  const A = (el.animAmp === undefined ? 100 : el.animAmp) / 100;
  const oldAlign = c.textAlign;
  c.textAlign = 'center';

  for (let i = 0; i < chars.length; i++) {
    const w = widths[i];
    if (chars[i] !== ' ') {
      const f = def.charFn(startIdx + i, total, t, A, wordIdx[i]) || {};
      const a = f.a === undefined ? 1 : f.a;
      if (a > 0.004) {
        c.save();
        c.translate(cx + w / 2 + (f.dx || 0) * el.size, y + (f.dy || 0) * el.size);
        if (f.rot) c.rotate(f.rot);
        const sx = f.sx === undefined ? 1 : f.sx, sy = f.sy === undefined ? 1 : f.sy;
        if (sx !== 1 || sy !== 1) c.scale(Math.abs(sx) < 0.002 ? 0.002 : sx, Math.abs(sy) < 0.002 ? 0.002 : sy);
        c.globalAlpha *= a;
        const merk = _textGlow;
        if (f.glow > 0.01) _textGlow = { color: el.animGlowColor || el.glowColor || el.color,
          blur: Math.max(2, el.size * 0.5 * f.glow), power: f.glow };
        drawStyledLine(c, el, chars[i], 0, 0);
        _textGlow = merk;
        c.restore();
      }
    }
    cx += w + ls;
  }
  c.textAlign = oldAlign;
  if (el.letterSpacing) c.letterSpacing = el.letterSpacing + 'px';
}

SS.drawTextEl = function (c, el) {
  const m = SS.measureText(el);
  const lines = (el.content || ' ').split('\n');
  c.save();
  c.translate(el.x, el.y);
  c.rotate(SS.deg2rad(el.rot));
  c.globalAlpha = el.opacity ?? 1;
  // Animation (Hüpfen, Herzschlag, Leuchten …) – Glow wirkt nur auf die Buchstaben
  _textGlow = SS.applyAnim ? SS.applyAnim(c, el, Math.max(m.h, el.size)) : null;
  if (_textGlow) _textGlow.color = el.animGlowColor || el.glowColor || el.color;
  if ((el.scaleX || 1) !== 1 || (el.scaleY || 1) !== 1) c.scale(el.scaleX || 1, el.scaleY || 1);

  c.font = SS.fontCSS(el);
  c.textBaseline = 'middle';
  if (el.letterSpacing) c.letterSpacing = el.letterSpacing + 'px';
  const lineWidths = lines.map(ln => c.measureText(ln).width);

  paintTextBg(c, el, m, lineWidths);

  const innerW = m.w - m.padX * 2;

  // Buchstaben-Animation vorbereiten (Zeichen- und Wortzählung über alle Zeilen)
  const pcDef = (!SS._noAnim && el.anim && SS.ANIM_BY_ID && SS.ANIM_BY_ID[el.anim]
    && SS.ANIM_BY_ID[el.anim].perChar) ? SS.ANIM_BY_ID[el.anim] : null;
  let meta = null;
  if (pcDef) {
    let total = 0, wordNr = 0;
    meta = lines.map(ln => {
      const chars = [...ln];
      const wi = [];
      let inWord = false;
      for (const ch of chars) {
        if (ch === ' ') { if (inWord) { wordNr++; inWord = false; } wi.push(wordNr); }
        else { inWord = true; wi.push(wordNr); }
      }
      if (inWord) wordNr++;
      const o = { chars, wi, start: total };
      total += chars.length;
      return o;
    });
    meta.total = total;
  }

  lines.forEach((ln, i) => {
    let x;
    if (el.align === 'left') { x = -innerW / 2; c.textAlign = 'left'; }
    else if (el.align === 'right') { x = innerW / 2; c.textAlign = 'right'; }
    else { x = 0; c.textAlign = 'center'; }
    const y = -m.h / 2 + m.padY + m.lh * (i + 0.5);
    if (pcDef && !el.curve) {
      const mm = meta[i];
      drawLinePerChar(c, el, mm.chars, mm.wi, mm.start, meta.total, x, y, pcDef);
    } else if (el.curve) {
      drawCurvedLine(c, el, ln, y);
    } else {
      drawStyledLine(c, el, ln, x, y);
    }
  });
  if (el.letterSpacing) c.letterSpacing = '0px';
  _textGlow = null;
  c.restore();
};

/* ---------- sticker / emoji drawing (animation via anim.js) ---------- */
SS.animT = 0;   // Sekunden; wird von der Live-Schleife bzw. vom Video-Export gesetzt
SS.drawStickerEl = function (c, el) {
  c.save();
  c.translate(el.x, el.y);
  c.rotate(SS.deg2rad(el.rot));
  c.globalAlpha = el.opacity ?? 1;
  const glow = SS.applyAnim ? SS.applyAnim(c, el, el.s || 100) : null;
  if ((el.scaleX || 1) !== 1 || (el.scaleY || 1) !== 1) c.scale(el.scaleX || 1, el.scaleY || 1);
  const paint = () => {
    if (el.type === 'emoji') {
      c.font = `${el.s * 0.9}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(el.char, 0, el.s * 0.05);
    } else {
      const def = SS.STICKERS.find(s => s.id === el.kind);
      if (def) def.draw(c, el.s, el.color);
    }
  };
  SS.paintWithGlow(c, glow, paint);
  c.restore();
};

/* ---------- Unschärfe- und Pixelbereiche ----------
   baseInfo = { canvas, matrix } – die Momentaufnahme liegt in Canvas-Pixeln vor,
   die Matrix bildet Szenen- auf Canvas-Koordinaten ab. So stimmt der Ausschnitt
   auch bei 2K/4K und beim slide-weisen Export. */
SS.drawBlurEl = function (c, el, baseInfo) {
  const base = baseInfo && baseInfo.canvas ? baseInfo.canvas : baseInfo;
  const m = baseInfo && baseInfo.matrix ? baseInfo.matrix : null;
  const k = m ? Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1 : 1;

  const ew = el.w * (el.scaleX || 1), eh = el.h * (el.scaleY || 1);
  const pad = el.strength * 2 + 8;
  const bw = Math.ceil(ew + pad * 2), bh = Math.ceil(eh + pad * 2);
  const pw = Math.max(1, Math.round(bw * k)), ph = Math.max(1, Math.round(bh * k));

  const region = SS.makeCanvas(pw, ph);
  const rc = region.getContext('2d');
  rc.save();
  rc.scale(k, k);
  rc.translate(bw / 2, bh / 2);
  rc.rotate(-SS.deg2rad(el.rot));
  rc.translate(-el.x, -el.y);
  if (m) {
    const inv = m.inverse ? m.inverse() : null;
    if (inv) rc.transform(inv.a, inv.b, inv.c, inv.d, inv.e, inv.f);
  }
  try { rc.drawImage(base, 0, 0); } catch (e) {}
  rc.restore();

  const out = SS.makeCanvas(pw, ph);
  const oc = out.getContext('2d');
  if (el.pixelate) {
    const px = Math.max(4, el.strength) * k;
    const small = SS.makeCanvas(Math.max(1, pw / px), Math.max(1, ph / px));
    small.getContext('2d').drawImage(region, 0, 0, small.width, small.height);
    oc.imageSmoothingEnabled = false;
    oc.drawImage(small, 0, 0, pw, ph);
    SS.freeCanvas(small);
  } else {
    oc.filter = `blur(${el.strength * k}px)`;
    oc.drawImage(region, 0, 0);
  }
  SS.freeCanvas(region);

  c.save();
  c.translate(el.x, el.y);
  c.rotate(SS.deg2rad(el.rot));
  SS.blurShapePath(c, el.shape, ew, eh);
  c.clip();
  c.drawImage(out, -bw / 2, -bh / 2, bw, bh);
  c.restore();
  SS.freeCanvas(out);
};

/* Formen für Unschärfe- und Pixelbereiche */
SS.blurShapePath = function (c, shape, w, h) {
  c.beginPath();
  const hw = w / 2, hh = h / 2;
  if (shape === 'ellipse') {
    c.ellipse(0, 0, hw, hh, 0, 0, 7);
  } else if (shape === 'heart') {
    const s = Math.min(hw, hh);
    c.moveTo(0, hh * 0.92);
    c.bezierCurveTo(-hw * 1.25, hh * 0.05, -hw * 0.55, -hh * 1.15, 0, -hh * 0.38);
    c.bezierCurveTo(hw * 0.55, -hh * 1.15, hw * 1.25, hh * 0.05, 0, hh * 0.92);
    void s;
  } else if (shape === 'star') {
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const r = i % 2 ? 0.45 : 1;
      const px = Math.cos(a) * hw * r, py = Math.sin(a) * hh * r;
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.closePath();
  } else if (shape === 'rounded') {
    const r = Math.min(hw, hh) * 0.35;
    c.moveTo(-hw + r, -hh);
    c.arcTo(hw, -hh, hw, hh, r);
    c.arcTo(hw, hh, -hw, hh, r);
    c.arcTo(-hw, hh, -hw, -hh, r);
    c.arcTo(-hw, -hh, hw, -hh, r);
    c.closePath();
  } else {
    c.rect(-hw, -hh, w, h);
  }
};

/* ---------- shadow for photo cards ---------- */
function drawCardWithShadow(c, el, card) {
  c.save();
  c.translate(el.x, el.y);
  c.rotate(SS.deg2rad(el.rot));
  c.globalAlpha = el.opacity ?? 1;
  const glow = SS.applyAnim ? SS.applyAnim(c, el, card.height) : null;
  if ((el.scaleX || 1) !== 1 || (el.scaleY || 1) !== 1) c.scale(el.scaleX || 1, el.scaleY || 1);
  if (glow) {
    c.save();
    c.shadowColor = el.animGlowColor || '#ffe6b8';
    c.shadowBlur = glow.blur;
    c.drawImage(card, -card.width / 2, -card.height / 2);
    c.restore();
  }
  if (el.frame.shadow > 0 && el.frame.style !== 'none') {
    c.shadowColor = `rgba(45,28,20,${el.frame.shadow / 130})`;
    c.shadowBlur = 16 + el.frame.shadow * 0.35;
    c.shadowOffsetX = 6; c.shadowOffsetY = 12;
  } else if (el.frame.style === 'none' && el.frame.shadow > 0) {
    c.shadowColor = `rgba(45,28,20,${el.frame.shadow / 150})`;
    c.shadowBlur = 20; c.shadowOffsetY = 10;
  }
  c.drawImage(card, -card.width / 2, -card.height / 2);
  c.restore();
}

/* ---------- compose scene into ctx at full canvas coordinates ---------- */
SS.paintScene = function (c, W, H, opts = {}) {
  if (!opts.noBg) {
    if (SS.clip && SS.clip.ready) SS.drawClipFrame(c, W, H);
    else SS.paintBackground(c, W, H, opts.forExport);
  }
  const skip = opts.skip;
  // Momentaufnahme für Unschärfebereiche (in Canvas-Pixeln, mit Abbildungsmatrix)
  let base = null;
  const snap = () => {
    const cw = c.canvas.width, ch = c.canvas.height;
    if (!base) base = { canvas: SS.makeCanvas(cw, ch), matrix: null };
    const bc = base.canvas.getContext('2d');
    bc.setTransform(1, 0, 0, 1, 0, 0);
    bc.clearRect(0, 0, cw, ch);
    bc.drawImage(c.canvas, 0, 0);
    base.matrix = c.getTransform ? c.getTransform() : null;
    return base;
  };
  for (const el of SS.state.elements) {
    if (el.hidden) continue;
    if (skip && skip.has(el.id)) continue;
    /* Mischmodus gilt genau für dieses Element – die Ebenenfolge bleibt unberührt */
    c.save();
    if (el.blend && el.blend !== 'source-over') c.globalCompositeOperation = el.blend;
    if (el.type === 'blur') {
      SS.drawBlurEl(c, el, snap());
    } else if (el.type === 'photo') {
      const card = SS.photoCard(el);
      if (card) drawCardWithShadow(c, el, card);
    } else if (el.type === 'text') {
      if (el.bgStyle === 'glass') {
        // Milchglas: den Bereich unter dem Textfeld weichzeichnen – folgt der Animation
        const m = SS.measureText(el);
        const af = SS.animFrame ? SS.animFrame(el, Math.max(m.h, el.size)) : null;
        const gx = el.x + (af ? af.dx : 0), gy = el.y + (af ? af.dy : 0);
        const grot = el.rot + (af && af.rot ? af.rot * 180 / Math.PI : 0);
        const gsx = (el.scaleX || 1) * (af ? af.sx : 1);
        const gsy = (el.scaleY || 1) * (af ? af.sy : 1);
        SS.drawBlurEl(c, { x: gx, y: gy, rot: grot, w: m.w, h: m.h,
          shape: 'rounded', strength: 14, pixelate: false, scaleX: gsx, scaleY: gsy }, snap());
        c.save();
        c.translate(gx, gy); c.rotate(SS.deg2rad(grot));
        if (gsx !== 1 || gsy !== 1) c.scale(gsx, gsy);
        c.globalAlpha = (el.bgAlpha ?? 0.85) * 0.4;
        c.fillStyle = el.bgColor || '#ffffff';
        roundRectPath(c, -m.w / 2, -m.h / 2, m.w, m.h, Math.min(18, m.h / 4));
        c.fill();
        c.globalAlpha = 0.5;
        c.strokeStyle = 'rgba(255,255,255,.65)'; c.lineWidth = 1.5;
        roundRectPath(c, -m.w / 2, -m.h / 2, m.w, m.h, Math.min(18, m.h / 4));
        c.stroke();
        c.restore();
      }
      SS.drawTextEl(c, el);
    } else if (el.type === 'sticker' || el.type === 'emoji') {
      SS.drawStickerEl(c, el);
    } else if (el.type === 'video' && SS.drawVideoEl) {
      SS.drawVideoEl(c, el);
    }
    c.restore();
  }
  /* Zweiter Durchgang: freigestellte Motive, die über dem Text liegen sollen.
     Damit entsteht „Text hinter dem Motiv" ohne zweites Element. */
  for (const el of SS.state.elements) {
    if (el.hidden || el.type !== 'photo' || !el.overlay) continue;
    if (skip && skip.has(el.id)) continue;
    const card = SS.photoCard(el);
    if (card) drawCardWithShadow(c, el, card);
  }

  /* Neu eingesetzte Elemente kurz umreißen, damit man sieht, was entstanden ist */
  if (SS._born && !opts.forExport) {
    const now = performance.now();
    for (const el of SS.state.elements) {
      const t0 = SS._born.get(el.id);
      if (!t0) continue;
      const p = (now - t0) / 620;
      if (p >= 1) { SS._born.delete(el.id); continue; }
      const s = SS.elSize(el);
      const grow = 1 + 0.16 * (1 - p) * (1 - p);
      c.save();
      c.translate(el.x, el.y);
      c.rotate(SS.deg2rad(el.rot || 0));
      c.globalAlpha = 1 - p;
      c.strokeStyle = '#C8553D';
      c.lineWidth = 2.4 / (SS.state.zoom || 1);
      c.strokeRect(-s.w * grow / 2, -s.h * grow / 2, s.w * grow, s.h * grow);
      c.restore();
    }
  }
  if (base) { SS.freeCanvas(base.canvas); base = null; }
};

/* Einzelnes Element zeichnen (für den Video-Renderer). */
SS.drawElement = function (c, el) {
  if (el.type === 'photo') {
    const card = SS.photoCard(el);
    if (card) drawCardWithShadow(c, el, card);
  } else if (el.type === 'text') {
    SS.drawTextEl(c, el);
  } else if (el.type === 'sticker' || el.type === 'emoji') {
    SS.drawStickerEl(c, el);
  }
};

/* ---------- screen render ---------- */
SS.render = function () {
  const es = document.getElementById('emptyState');
  if (es) es.style.display = SS.state.elements.length ? 'none' : 'flex';
  const canvas = SS.el('canvas');
  const stage = SS.el('stage');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const sw = stage.clientWidth, sh = stage.clientHeight;
  if (canvas.width !== sw * dpr || canvas.height !== sh * dpr) {
    canvas.width = sw * dpr; canvas.height = sh * dpr;
    canvas.style.width = sw + 'px'; canvas.style.height = sh + 'px';
  }
  const c = canvas.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, sw, sh);

  const { W, H, slideW, n } = SS.canvasSize();
  const st = SS.state;
  c.save();
  c.translate(st.panX, st.panY);
  c.scale(st.zoom, st.zoom);

  // canvas frame
  c.save();
  c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 30 / st.zoom;
  c.fillStyle = '#fff';
  c.fillRect(0, 0, W, H);
  c.restore();

  c.save();
  c.beginPath(); c.rect(0, 0, W, H); c.clip();
  SS.paintScene(c, W, H);
  c.restore();

  // slide boundary guides
  if (st.guides && n > 1 && !(SS.clip && SS.clip.ready)) {
    c.save();
    c.strokeStyle = 'rgba(200,85,61,.75)';
    c.lineWidth = 2 / st.zoom;
    c.setLineDash([14 / st.zoom, 10 / st.zoom]);
    for (let i = 1; i < n; i++) {
      c.beginPath(); c.moveTo(i * slideW, 0); c.lineTo(i * slideW, H); c.stroke();
    }
    c.setLineDash([]);
    // slide numbers
    c.fillStyle = 'rgba(200,85,61,.85)';
    c.font = `${26 / st.zoom}px Poppins, sans-serif`;
    c.textAlign = 'left';
    for (let i = 0; i < n; i++) c.fillText(String(i + 1), i * slideW + 12 / st.zoom, 34 / st.zoom);
    c.restore();
  }

  // snap guide lines (set by interact.js)
  if (SS._snapLines) {
    /* Einrast-Linien blitzen auf und verblassen wieder */
    const age = SS._snapT ? (performance.now() - SS._snapT) / 420 : 0;
    const a = Math.max(0.25, 1 - age);
    c.save();
    c.strokeStyle = `rgba(200,85,61,${(0.9 * a).toFixed(3)})`;
    c.lineWidth = (1.5 + 1.6 * (1 - Math.min(1, age))) / st.zoom;
    for (const g of SS._snapLines) {
      c.beginPath();
      if (g.v !== undefined) { c.moveTo(g.v, 0); c.lineTo(g.v, H); }
      else { c.moveTo(0, g.h); c.lineTo(W, g.h); }
      c.stroke();
    }
    c.restore();
  }

  // Raster, Drittelregel, Goldener Schnitt, Safe-Zones
  SS.drawGuides(c, W, H, slideW, n, st.zoom);

  // Auswahl
  const selAll = SS.getSelAll();
  const sel = SS.getSel();
  const multi = selAll.length > 1;

  if (multi) {
    c.save();
    c.strokeStyle = 'rgba(200,85,61,.55)';
    c.lineWidth = 1.5 / st.zoom;
    c.setLineDash([6 / st.zoom, 5 / st.zoom]);
    c.lineDashOffset = -(SS._ants || 0) / st.zoom;
    for (const e of selAll) {
      const s = SS.elSize(e);
      c.save();
      c.translate(e.x, e.y); c.rotate(SS.deg2rad(e.rot || 0));
      c.strokeRect(-s.w / 2, -s.h / 2, s.w, s.h);
      c.restore();
    }
    c.setLineDash([]);
    c.lineDashOffset = 0;
    c.restore();
  }

  if (sel) {
    const hs = SS.HANDLE / st.zoom;
    if (multi) {
      const b = SS.selBounds();
      c.save();
      c.translate(b.cx, b.cy);
      c.strokeStyle = '#C8553D'; c.lineWidth = 2 / st.zoom;
      c.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);
      c.fillStyle = '#F5F0E9'; c.lineWidth = 1.6 / st.zoom;
      for (const [hx, hy] of [[-b.w / 2, -b.h / 2], [b.w / 2, -b.h / 2], [-b.w / 2, b.h / 2], [b.w / 2, b.h / 2]]) {
        c.beginPath(); c.arc(hx, hy, hs, 0, 7); c.fill(); c.stroke();
      }
      c.beginPath(); c.moveTo(0, -b.h / 2); c.lineTo(0, -b.h / 2 - 34 / st.zoom); c.stroke();
      c.beginPath(); c.arc(0, -b.h / 2 - 40 / st.zoom, hs, 0, 7); c.fill(); c.stroke();
      c.restore();
    } else {
      const { w, h } = SS.elSize(sel);
      c.save();
      c.translate(sel.x, sel.y);
      c.rotate(SS.deg2rad(sel.rot));
      c.strokeStyle = sel.locked ? '#8A8078' : '#C8553D';
      c.lineWidth = 2 / st.zoom;
      /* Auswahlrahmen als laufende Strichlinie – gesperrt weiter gestrichelt */
      c.setLineDash(sel.locked ? [8 / st.zoom, 6 / st.zoom] : [11 / st.zoom, 7 / st.zoom]);
      c.lineDashOffset = -(SS._ants || 0) / st.zoom;
      c.strokeRect(-w / 2, -h / 2, w, h);
      c.setLineDash([]);
      c.lineDashOffset = 0;
      if (!sel.locked) {
        c.fillStyle = '#F5F0E9'; c.strokeStyle = '#C8553D'; c.lineWidth = 1.6 / st.zoom;
        // Ecken = proportional
        for (const [hx, hy] of [[-w / 2, -h / 2], [w / 2, -h / 2], [-w / 2, h / 2], [w / 2, h / 2]]) {
          c.beginPath(); c.arc(hx, hy, hs, 0, 7); c.fill(); c.stroke();
        }
        // Kanten = freie Verzerrung
        c.fillStyle = '#f3e6d2';
        const eh2 = hs * 0.78;
        for (const [hx, hy, vw, vh] of [[0, -h / 2, eh2 * 2.6, eh2 * 1.1], [0, h / 2, eh2 * 2.6, eh2 * 1.1],
          [-w / 2, 0, eh2 * 1.1, eh2 * 2.6], [w / 2, 0, eh2 * 1.1, eh2 * 2.6]]) {
          c.beginPath(); c.rect(hx - vw / 2, hy - vh / 2, vw, vh); c.fill(); c.stroke();
        }
        // Drehgriff
        c.beginPath(); c.moveTo(0, -h / 2); c.lineTo(0, -h / 2 - 34 / st.zoom); c.stroke();
        c.beginPath(); c.arc(0, -h / 2 - 40 / st.zoom, hs, 0, 7); c.fill(); c.stroke();
      }
      c.restore();

      // Warnung: Text liegt auf einer Schnittkante
      if (sel.type === 'text' && n > 1) {
        const halfW = w / 2;
        let bad = null;
        for (let i = 1; i < n; i++) {
          const bx = i * slideW;
          if (Math.abs(sel.x - bx) < halfW) { bad = bx; break; }
        }
        if (bad !== null) {
          c.save();
          c.strokeStyle = 'rgba(178,58,72,.95)';
          c.lineWidth = 4 / st.zoom;
          c.setLineDash([16 / st.zoom, 10 / st.zoom]);
          c.beginPath(); c.moveTo(bad, 0); c.lineTo(bad, H); c.stroke();
          c.setLineDash([]);
          c.restore();
        }
        SS.ui.warnBoundary(bad !== null);
      }
    }
  }

  // Lasso-Rechteck
  if (SS._lasso) {
    const L = SS._lasso;
    c.save();
    c.strokeStyle = '#C8553D'; c.lineWidth = 1.6 / st.zoom;
    c.setLineDash([7 / st.zoom, 5 / st.zoom]);
    c.fillStyle = 'rgba(200,85,61,.10)';
    c.fillRect(L.x0, L.y0, L.x1 - L.x0, L.y1 - L.y0);
    c.strokeRect(L.x0, L.y0, L.x1 - L.x0, L.y1 - L.y0);
    c.setLineDash([]);
    c.restore();
  }

  // Abstandsanzeige (Smart Guides)
  if (SS._distMarks) SS.drawDistMarks(c, st.zoom);

  c.restore();
};

/* ================================================================
   Hilfsraster: Drittelregel, Gitter, Goldener Schnitt,
   Instagram-Safe-Zones und das 3:4-Profilraster
   ================================================================ */
SS.drawGuides = function (c, W, H, slideW, n, zoom) {
  const o = SS.state.overlays || {};
  if (!o.thirds && !o.grid && !o.golden && !o.safe && !o.profile) return;
  const lw = 1.2 / zoom;
  c.save();

  const perSlide = (fn) => {
    for (let i = 0; i < n; i++) fn(i * slideW, slideW);
  };

  if (o.thirds) {
    c.strokeStyle = 'rgba(255,255,255,.34)'; c.lineWidth = lw;
    perSlide((x0, w) => {
      for (let k = 1; k <= 2; k++) {
        c.beginPath(); c.moveTo(x0 + w * k / 3, 0); c.lineTo(x0 + w * k / 3, H); c.stroke();
        c.beginPath(); c.moveTo(x0, H * k / 3); c.lineTo(x0 + w, H * k / 3); c.stroke();
      }
    });
  }

  if (o.grid) {
    c.strokeStyle = 'rgba(255,255,255,.20)'; c.lineWidth = lw;
    perSlide((x0, w) => {
      for (let k = 1; k <= 3; k++) {
        c.beginPath(); c.moveTo(x0 + w * k / 4, 0); c.lineTo(x0 + w * k / 4, H); c.stroke();
        c.beginPath(); c.moveTo(x0, H * k / 4); c.lineTo(x0 + w, H * k / 4); c.stroke();
      }
    });
  }

  if (o.golden) {
    const g = 0.6180339887;
    c.strokeStyle = 'rgba(212,175,126,.55)'; c.lineWidth = lw * 1.3;
    perSlide((x0, w) => {
      [g, 1 - g].forEach(f => {
        c.beginPath(); c.moveTo(x0 + w * f, 0); c.lineTo(x0 + w * f, H); c.stroke();
        c.beginPath(); c.moveTo(x0, H * f); c.lineTo(x0 + w, H * f); c.stroke();
      });
    });
  }

  // Instagram-Oberfläche: Story/Reel blenden oben, unten und rechts Bedienelemente ein
  if (o.safe) {
    c.fillStyle = 'rgba(224,90,70,.13)';
    c.strokeStyle = 'rgba(224,90,70,.55)'; c.lineWidth = lw * 1.4;
    perSlide((x0, w) => {
      const top = H * (250 / 1920), bot = H * (400 / 1920), right = w * (200 / 1080);
      c.fillRect(x0, 0, w, top);
      c.fillRect(x0, H - bot, w, bot);
      c.fillRect(x0 + w - right, top, right, H - top - bot);
      c.beginPath(); c.moveTo(x0, top); c.lineTo(x0 + w, top); c.stroke();
      c.beginPath(); c.moveTo(x0, H - bot); c.lineTo(x0 + w, H - bot); c.stroke();
      c.beginPath(); c.moveTo(x0 + w - right, top); c.lineTo(x0 + w - right, H - bot); c.stroke();
    });
  }

  // 3:4-Profilraster: so viel schneidet Instagram im Profil seitlich weg
  if (o.profile) {
    const keep = H * 3 / 4;                     // sichtbare Breite im Profil
    c.fillStyle = 'rgba(120,140,190,.20)';
    c.strokeStyle = 'rgba(120,140,190,.75)'; c.lineWidth = lw * 1.4;
    perSlide((x0, w) => {
      const cut = Math.max(0, (w - keep) / 2);
      if (cut <= 0.5) return;
      c.fillRect(x0, 0, cut, H);
      c.fillRect(x0 + w - cut, 0, cut, H);
      c.beginPath(); c.moveTo(x0 + cut, 0); c.lineTo(x0 + cut, H); c.stroke();
      c.beginPath(); c.moveTo(x0 + w - cut, 0); c.lineTo(x0 + w - cut, H); c.stroke();
    });
  }
  c.restore();
};

/* Abstandsanzeige zwischen Elementen (wie in Figma) */
SS.drawDistMarks = function (c, zoom) {
  const marks = SS._distMarks;
  if (!marks || !marks.length) return;
  c.save();
  c.strokeStyle = '#d6698c';
  c.fillStyle = '#d6698c';
  c.lineWidth = 1.4 / zoom;
  c.font = `${12 / zoom}px Poppins, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  for (const m of marks) {
    c.beginPath(); c.moveTo(m.x0, m.y0); c.lineTo(m.x1, m.y1); c.stroke();
    const t = 5 / zoom;
    if (Math.abs(m.y1 - m.y0) < 0.5) {
      c.beginPath(); c.moveTo(m.x0, m.y0 - t); c.lineTo(m.x0, m.y0 + t);
      c.moveTo(m.x1, m.y1 - t); c.lineTo(m.x1, m.y1 + t); c.stroke();
    } else {
      c.beginPath(); c.moveTo(m.x0 - t, m.y0); c.lineTo(m.x0 + t, m.y0);
      c.moveTo(m.x1 - t, m.y1); c.lineTo(m.x1 + t, m.y1); c.stroke();
    }
    const mx = (m.x0 + m.x1) / 2, my = (m.y0 + m.y1) / 2;
    const label = m.label !== undefined ? m.label : String(Math.round(Math.hypot(m.x1 - m.x0, m.y1 - m.y0)));
    const wpx = c.measureText(label).width + 10 / zoom;
    c.fillStyle = 'rgba(20,14,10,.85)';
    c.fillRect(mx - wpx / 2, my - 9 / zoom, wpx, 18 / zoom);
    c.fillStyle = '#f6dbe4';
    c.fillText(label, mx, my);
    c.fillStyle = '#d6698c';
  }
  c.restore();
};

SS.HANDLE = 9;
