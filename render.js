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
  warmth: 0, sepia: 0, blur: 0, vignette: 0, grain: 0 });

/* ---------- filtered photo cache ---------- */
const _photoCache = {}; // el.id -> {key, canvas}
SS.photoCacheClear = (id) => { if (id) delete _photoCache[id]; else Object.keys(_photoCache).forEach(k => delete _photoCache[k]); };

SS.filteredPhoto = function (el) {
  const rec = SS.images[el.imgId];
  if (!rec) return null;
  const fl = el.filter;
  const key = JSON.stringify(fl) + (el.flip ? 'F' : '');
  const hit = _photoCache[el.id];
  if (hit && hit.key === key) return hit.canvas;

  const cv = document.createElement('canvas');
  cv.width = rec.w; cv.height = rec.h;
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
  c.drawImage(rec.img, 0, 0, cv.width, cv.height);
  c.restore();
  c.filter = 'none';

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

/* ---------- element size helper ---------- */
SS.elSize = function (el) {
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
  return { w: 100, h: 100 };
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

SS.drawTextEl = function (c, el) {
  const m = SS.measureText(el);
  const lines = (el.content || ' ').split('\n');
  c.save();
  c.translate(el.x, el.y);
  c.rotate(SS.deg2rad(el.rot));
  c.globalAlpha = el.opacity ?? 1;

  if (el.bgStyle && el.bgStyle !== 'none') {
    c.fillStyle = el.bgColor || '#ffffff';
    c.globalAlpha = (el.opacity ?? 1) * (el.bgAlpha ?? 0.85);
    const r = el.bgStyle === 'pill' ? m.h / 2 : Math.min(18, m.h / 4);
    const x = -m.w / 2, y = -m.h / 2;
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + m.w, y, x + m.w, y + m.h, r);
    c.arcTo(x + m.w, y + m.h, x, y + m.h, r);
    c.arcTo(x, y + m.h, x, y, r);
    c.arcTo(x, y, x + m.w, y, r);
    c.closePath(); c.fill();
    c.globalAlpha = el.opacity ?? 1;
  }

  c.font = SS.fontCSS(el);
  c.fillStyle = el.color;
  c.textBaseline = 'middle';
  if (el.letterSpacing) c.letterSpacing = el.letterSpacing + 'px';
  if (el.shadow) {
    c.shadowColor = 'rgba(30,15,8,.45)';
    c.shadowBlur = el.size * 0.18; c.shadowOffsetY = el.size * 0.05;
  }
  const innerW = m.w - m.padX * 2;
  lines.forEach((ln, i) => {
    const lw = c.measureText(ln).width;
    let x;
    if (el.align === 'left') { x = -innerW / 2; c.textAlign = 'left'; }
    else if (el.align === 'right') { x = innerW / 2; c.textAlign = 'right'; }
    else { x = 0; c.textAlign = 'center'; }
    const y = -m.h / 2 + m.padY + m.lh * (i + 0.5);
    if (el.outline) {
      c.strokeStyle = el.outlineColor || '#ffffff';
      c.lineWidth = el.size * 0.08;
      c.strokeText(ln, x, y);
    }
    c.fillText(ln, x, y);
  });
  if (el.letterSpacing) c.letterSpacing = '0px';
  c.restore();
};

/* ---------- sticker drawing ---------- */
SS.drawStickerEl = function (c, el) {
  c.save();
  c.translate(el.x, el.y);
  c.rotate(SS.deg2rad(el.rot));
  c.globalAlpha = el.opacity ?? 1;
  if (el.type === 'emoji') {
    c.font = `${el.s * 0.9}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(el.char, 0, el.s * 0.05);
  } else {
    const def = SS.STICKERS.find(s => s.id === el.kind);
    if (def) def.draw(c, el.s, el.color);
  }
  c.restore();
};

/* ---------- blur patch ---------- */
SS.drawBlurEl = function (c, el, baseCanvas) {
  // sample the area beneath from baseCanvas, blur/pixelate it, draw clipped
  const pad = el.strength * 2 + 8;
  const bw = Math.ceil(el.w + pad * 2), bh = Math.ceil(el.h + pad * 2);
  const region = document.createElement('canvas');
  region.width = bw; region.height = bh;
  const rc = region.getContext('2d');
  rc.save();
  rc.translate(bw / 2, bh / 2);
  rc.rotate(-SS.deg2rad(el.rot));
  rc.translate(-el.x, -el.y);
  rc.drawImage(baseCanvas, 0, 0);
  rc.restore();

  const out = document.createElement('canvas');
  out.width = bw; out.height = bh;
  const oc = out.getContext('2d');
  if (el.pixelate) {
    const px = Math.max(4, el.strength);
    const small = document.createElement('canvas');
    small.width = Math.max(1, Math.round(bw / px)); small.height = Math.max(1, Math.round(bh / px));
    small.getContext('2d').drawImage(region, 0, 0, small.width, small.height);
    oc.imageSmoothingEnabled = false;
    oc.drawImage(small, 0, 0, bw, bh);
  } else {
    oc.filter = `blur(${el.strength}px)`;
    oc.drawImage(region, 0, 0);
  }

  c.save();
  c.translate(el.x, el.y);
  c.rotate(SS.deg2rad(el.rot));
  c.beginPath();
  if (el.shape === 'ellipse') c.ellipse(0, 0, el.w / 2, el.h / 2, 0, 0, 7);
  else c.rect(-el.w / 2, -el.h / 2, el.w, el.h);
  c.clip();
  c.drawImage(out, -bw / 2, -bh / 2);
  c.restore();
};

/* ---------- shadow for photo cards ---------- */
function drawCardWithShadow(c, el, card) {
  c.save();
  c.translate(el.x, el.y);
  c.rotate(SS.deg2rad(el.rot));
  c.globalAlpha = el.opacity ?? 1;
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
  SS.paintBackground(c, W, H, opts.forExport);
  // base snapshot for blur patches
  let base = null;
  const hasBlur = SS.state.elements.some(e => e.type === 'blur');
  for (const el of SS.state.elements) {
    if (el.type === 'blur') {
      if (!base) {
        base = document.createElement('canvas');
        base.width = W; base.height = H;
        const bc = base.getContext('2d');
        bc.drawImage(c.canvas, 0, 0);
      } else {
        base.getContext('2d').clearRect(0, 0, W, H);
        base.getContext('2d').drawImage(c.canvas, 0, 0);
      }
      SS.drawBlurEl(c, el, base);
    } else if (el.type === 'photo') {
      const card = SS.photoCard(el);
      if (card) drawCardWithShadow(c, el, card);
    } else if (el.type === 'text') {
      SS.drawTextEl(c, el);
    } else if (el.type === 'sticker' || el.type === 'emoji') {
      SS.drawStickerEl(c, el);
    }
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
  c.shadowColor = 'rgba(50,30,20,.22)'; c.shadowBlur = 30 / st.zoom;
  c.fillStyle = '#fff';
  c.fillRect(0, 0, W, H);
  c.restore();

  c.save();
  c.beginPath(); c.rect(0, 0, W, H); c.clip();
  SS.paintScene(c, W, H);
  c.restore();

  // slide boundary guides
  if (st.guides && n > 1) {
    c.save();
    c.strokeStyle = 'rgba(190,120,90,.75)';
    c.lineWidth = 2 / st.zoom;
    c.setLineDash([14 / st.zoom, 10 / st.zoom]);
    for (let i = 1; i < n; i++) {
      c.beginPath(); c.moveTo(i * slideW, 0); c.lineTo(i * slideW, H); c.stroke();
    }
    c.setLineDash([]);
    // slide numbers
    c.fillStyle = 'rgba(190,120,90,.85)';
    c.font = `${26 / st.zoom}px Poppins, sans-serif`;
    c.textAlign = 'left';
    for (let i = 0; i < n; i++) c.fillText(String(i + 1), i * slideW + 12 / st.zoom, 34 / st.zoom);
    c.restore();
  }

  // snap guide lines (set by interact.js)
  if (SS._snapLines) {
    c.save();
    c.strokeStyle = 'rgba(214,105,140,.9)';
    c.lineWidth = 1.5 / st.zoom;
    for (const g of SS._snapLines) {
      c.beginPath();
      if (g.v !== undefined) { c.moveTo(g.v, 0); c.lineTo(g.v, H); }
      else { c.moveTo(0, g.h); c.lineTo(W, g.h); }
      c.stroke();
    }
    c.restore();
  }

  // selection box
  const sel = SS.getSel();
  if (sel) {
    const { w, h } = SS.elSize(sel);
    c.save();
    c.translate(sel.x, sel.y);
    c.rotate(SS.deg2rad(sel.rot));
    c.strokeStyle = '#bf9b6c';
    c.lineWidth = 2 / st.zoom;
    c.strokeRect(-w / 2, -h / 2, w, h);
    const hs = SS.HANDLE / st.zoom;
    c.fillStyle = '#fff'; c.strokeStyle = '#bf9b6c'; c.lineWidth = 1.6 / st.zoom;
    for (const [hx, hy] of [[-w / 2, -h / 2], [w / 2, -h / 2], [-w / 2, h / 2], [w / 2, h / 2]]) {
      c.beginPath(); c.arc(hx, hy, hs, 0, 7); c.fill(); c.stroke();
    }
    // rotate handle
    c.beginPath(); c.moveTo(0, -h / 2); c.lineTo(0, -h / 2 - 34 / st.zoom); c.stroke();
    c.beginPath(); c.arc(0, -h / 2 - 40 / st.zoom, hs, 0, 7); c.fill(); c.stroke();
    c.restore();

    // warn: text crossing a slide boundary
    if (sel.type === 'text' && n > 1) {
      const halfW = w / 2;
      for (let i = 1; i < n; i++) {
        const bx = i * slideW;
        if (Math.abs(sel.x - bx) < halfW) {
          SS.ui.warnBoundary(true);
          break;
        } else SS.ui.warnBoundary(false);
      }
    }
  }
  c.restore();
};

SS.HANDLE = 9;
