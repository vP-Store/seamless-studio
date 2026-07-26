/* Seamless Studio – photo frame styles.
   A frame renders a photo (already filtered) into a "card" canvas. */

SS.FRAMES = [
  { id: 'polaroid',   name: 'Polaroid' },
  { id: 'polaroid-w', name: 'Polaroid breit' },
  { id: 'polaroid-c', name: 'Polaroid creme' },
  { id: 'polaroid-b', name: 'Polaroid schwarz' },
  { id: 'thin',       name: 'Feine Linie' },
  { id: 'double',     name: 'Doppellinie Gold' },
  { id: 'none',       name: 'Ohne Rahmen' },
  { id: 'rounded',    name: 'Abgerundet' },
  { id: 'circle',     name: 'Kreis' },
  { id: 'oval',       name: 'Oval' },
  { id: 'arch',       name: 'Bogen' },
  { id: 'heart',      name: 'Herz' },
  { id: 'blob',       name: 'Organisch' },
  { id: 'tape',       name: 'Tape-Ecken' },
  { id: 'corners',    name: 'Foto-Ecken' },
  { id: 'stamp',      name: 'Briefmarke' },
  { id: 'torn',       name: 'Gerissen' },
  { id: 'film',       name: 'Filmstreifen' },
];

SS.defaultFrame = () => ({ style: 'polaroid', border: 26, color: '#fdfbf8', keyline: true, radius: 24,
  shadow: 55 });

/* Build the framed card canvas for a photo element.
   srcCanvas: filtered photo canvas. h: target photo height in canvas px. */
SS.buildCard = function (el, srcCanvas, h) {
  const ar = srcCanvas.width / srcCanvas.height;
  const w = h * ar;
  const f = el.frame;
  const b = f.style.startsWith('polaroid') || f.style === 'thin' || f.style === 'double' ||
            f.style === 'stamp' || f.style === 'film' ? f.border : 0;
  const bottomExtra = f.style === 'polaroid-w' ? f.border * 3.2 : 0;

  const pad = 6; // safety for stamp scallops etc.
  const cw = Math.ceil(w + b * 2 + pad * 2);
  const ch = Math.ceil(h + b * 2 + bottomExtra + pad * 2);
  const cv = document.createElement('canvas');
  cv.width = cw; cv.height = ch;
  const c = cv.getContext('2d');
  const px = pad + b, py = pad + b;

  const frameColor = f.style === 'polaroid-c' ? '#f6eddc' : f.style === 'polaroid-b' ? '#26221f' : f.color;

  const drawPhoto = () => c.drawImage(srcCanvas, px, py, w, h);
  const gold = '#c9a876';

  switch (f.style) {
    case 'none':
      drawPhoto(); break;

    case 'polaroid': case 'polaroid-w': case 'polaroid-c': case 'polaroid-b': {
      c.fillStyle = frameColor;
      c.fillRect(pad, pad, w + b * 2, h + b * 2 + bottomExtra);
      drawPhoto();
      if (f.keyline) {
        c.strokeStyle = gold; c.lineWidth = 2;
        c.strokeRect(px - 4, py - 4, w + 8, h + 8);
      }
      break;
    }
    case 'thin': {
      c.fillStyle = frameColor;
      c.fillRect(pad, pad, w + b * 2, h + b * 2);
      drawPhoto();
      break;
    }
    case 'double': {
      c.fillStyle = frameColor;
      c.fillRect(pad, pad, w + b * 2, h + b * 2);
      drawPhoto();
      c.strokeStyle = gold; c.lineWidth = 2;
      c.strokeRect(pad + 6, pad + 6, w + b * 2 - 12, h + b * 2 - 12);
      c.strokeRect(pad + 12, pad + 12, w + b * 2 - 24, h + b * 2 - 24);
      break;
    }
    case 'rounded': {
      c.save(); roundPath(c, pad, pad, w, h, f.radius); c.clip();
      c.drawImage(srcCanvas, pad, pad, w, h); c.restore();
      if (f.keyline) { c.strokeStyle = gold; c.lineWidth = 2.5; roundPath(c, pad, pad, w, h, f.radius); c.stroke(); }
      break;
    }
    case 'circle': case 'oval': {
      const rw = f.style === 'circle' ? Math.min(w, h) : w;
      const rh = f.style === 'circle' ? Math.min(w, h) : h;
      cv.width = rw + pad * 2 + 8; cv.height = rh + pad * 2 + 8;
      const c2 = cv.getContext('2d');
      c2.save();
      c2.beginPath();
      c2.ellipse(cv.width / 2, cv.height / 2, rw / 2, rh / 2, 0, 0, 7);
      c2.clip();
      const sc = Math.max(rw / srcCanvas.width, rh / srcCanvas.height);
      c2.drawImage(srcCanvas, cv.width / 2 - srcCanvas.width * sc / 2, cv.height / 2 - srcCanvas.height * sc / 2,
        srcCanvas.width * sc, srcCanvas.height * sc);
      c2.restore();
      if (f.keyline) {
        c2.strokeStyle = gold; c2.lineWidth = 3;
        c2.beginPath(); c2.ellipse(cv.width / 2, cv.height / 2, rw / 2 - 1, rh / 2 - 1, 0, 0, 7); c2.stroke();
      }
      return cv;
    }
    case 'arch': {
      c.save();
      archPath(c, pad, pad, w, h); c.clip();
      c.drawImage(srcCanvas, pad, pad, w, h); c.restore();
      if (f.keyline) { c.strokeStyle = gold; c.lineWidth = 2.5; archPath(c, pad, pad, w, h); c.stroke(); }
      break;
    }
    case 'heart': {
      const s = Math.min(w, h);
      cv.width = s + pad * 2; cv.height = s + pad * 2;
      const c2 = cv.getContext('2d');
      c2.save();
      SS.drawHeartPath(c2, cv.width / 2, cv.height / 2 + s * 0.03, s * 0.52); c2.clip();
      const sc = Math.max(s / srcCanvas.width, s / srcCanvas.height) * 1.1;
      c2.drawImage(srcCanvas, cv.width / 2 - srcCanvas.width * sc / 2, cv.height / 2 - srcCanvas.height * sc / 2,
        srcCanvas.width * sc, srcCanvas.height * sc);
      c2.restore();
      if (f.keyline) { c2.strokeStyle = gold; c2.lineWidth = 3;
        SS.drawHeartPath(c2, cv.width / 2, cv.height / 2 + s * 0.03, s * 0.52); c2.stroke(); }
      return cv;
    }
    case 'blob': {
      c.save(); blobPath(c, pad, pad, w, h, el.id.length * 7); c.clip();
      c.drawImage(srcCanvas, pad, pad, w, h); c.restore();
      if (f.keyline) { c.strokeStyle = gold; c.lineWidth = 2.5; blobPath(c, pad, pad, w, h, el.id.length * 7); c.stroke(); }
      break;
    }
    case 'tape': {
      drawPhoto();
      c.save(); c.globalAlpha = 0.72; c.fillStyle = '#efe6cf';
      const tw = Math.max(60, w * 0.22), th = tw * 0.34;
      [[px, py, -0.6], [px + w, py, 0.6]].forEach(([x, y, r]) => {
        c.save(); c.translate(x, y); c.rotate(r);
        c.fillRect(-tw / 2, -th / 2, tw, th); c.restore();
      });
      c.restore();
      break;
    }
    case 'corners': {
      drawPhoto();
      c.fillStyle = frameColor;
      const s = Math.max(26, w * 0.09);
      [[px, py, 1, 1], [px + w, py, -1, 1], [px, py + h, 1, -1], [px + w, py + h, -1, -1]]
        .forEach(([x, y, sx, sy]) => {
          c.beginPath(); c.moveTo(x, y); c.lineTo(x + s * sx, y); c.lineTo(x, y + s * sy); c.closePath(); c.fill();
        });
      break;
    }
    case 'stamp': {
      const r = 9, step = r * 2.6;
      c.fillStyle = frameColor;
      c.beginPath();
      c.rect(pad, pad, w + b * 2, h + b * 2);
      c.fill();
      c.save(); c.globalCompositeOperation = 'destination-out';
      for (let x = pad; x <= pad + w + b * 2 + 1; x += step) {
        c.beginPath(); c.arc(x, pad, r, 0, 7); c.fill();
        c.beginPath(); c.arc(x, pad + h + b * 2, r, 0, 7); c.fill();
      }
      for (let y = pad; y <= pad + h + b * 2 + 1; y += step) {
        c.beginPath(); c.arc(pad, y, r, 0, 7); c.fill();
        c.beginPath(); c.arc(pad + w + b * 2, y, r, 0, 7); c.fill();
      }
      c.restore();
      drawPhoto();
      break;
    }
    case 'torn': {
      c.save(); tornPath(c, pad, pad, w, h, el.id.length * 13); c.clip();
      c.drawImage(srcCanvas, pad - 4, pad - 4, w + 8, h + 8); c.restore();
      break;
    }
    case 'film': {
      const fb = Math.max(18, b);
      c.fillStyle = '#1c1a18';
      c.fillRect(pad, pad, w + fb * 2, h + fb * 2);
      c.save(); c.globalCompositeOperation = 'destination-out';
      const hw = fb * 0.5, hh = fb * 0.36, stepF = hw * 2.2;
      for (let x = pad + fb * 0.6; x < pad + w + fb * 1.4; x += stepF) {
        roundPath(c, x, pad + fb * 0.28, hw, hh, 3); c.fill();
        roundPath(c, x, pad + h + fb * 2 - fb * 0.28 - hh, hw, hh, 3); c.fill();
      }
      c.restore();
      c.drawImage(srcCanvas, pad + fb, pad + fb, w, h);
      return cv;
    }
  }
  return cv;
};

function roundPath(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
function archPath(c, x, y, w, h) {
  const r = w / 2;
  c.beginPath();
  c.moveTo(x, y + h);
  c.lineTo(x, y + r);
  c.arc(x + r, y + r, r, Math.PI, 0);
  c.lineTo(x + w, y + h);
  c.closePath();
}
function blobPath(c, x, y, w, h, seed) {
  const rnd = mulberrySimple(seed);
  const cx = x + w / 2, cy = y + h / 2;
  const n = 10;
  c.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = i / n * Math.PI * 2;
    const wob = 0.82 + (i === n ? blobFirst : rnd() * 0.18);
    if (i === 0) blobFirst = wob - 0.82;
    const px = cx + Math.cos(a) * w / 2 * wob;
    const py = cy + Math.sin(a) * h / 2 * wob;
    i ? c.quadraticCurveTo(cx + Math.cos(a - Math.PI / n) * w / 2 * 1.0, cy + Math.sin(a - Math.PI / n) * h / 2 * 1.0, px, py)
      : c.moveTo(px, py);
  }
  c.closePath();
}
let blobFirst = 0;
function tornPath(c, x, y, w, h, seed) {
  const rnd = mulberrySimple(seed);
  const j = Math.max(5, w * 0.018);
  c.beginPath();
  const edge = (x0, y0, x1, y1, n) => {
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      c.lineTo(x0 + (x1 - x0) * t + (rnd() - 0.5) * j * 2, y0 + (y1 - y0) * t + (rnd() - 0.5) * j * 2);
    }
  };
  c.moveTo(x, y);
  edge(x, y, x + w, y, 22); edge(x + w, y, x + w, y + h, 22);
  edge(x + w, y + h, x, y + h, 22); edge(x, y + h, x, y, 22);
  c.closePath();
}
function mulberrySimple(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
