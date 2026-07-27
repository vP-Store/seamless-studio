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
  { id: 'goldfoil',   name: 'Goldfolie' },
  { id: 'scallop',    name: 'Wellenrand' },
  { id: 'ticket',     name: 'Ticket' },
  { id: 'zeitung',    name: 'Zeitung' },
  { id: 'tapebottom', name: 'Sofortbild + Tape' },
  { id: 'heartframe', name: 'Herz-Polaroid' },
  { id: 'star',       name: 'Stern' },
  { id: 'flower',     name: 'Blume' },
  { id: 'cloudmask',  name: 'Wolke' },
  { id: 'hexagon',    name: 'Hexagon' },
  { id: 'diamond',    name: 'Raute' },
  { id: 'halfcircle', name: 'Halbbogen' },
  { id: 'squircle',   name: 'Squircle' },
  { id: 'zigzag',     name: 'Zickzack' },
  { id: 'lace',       name: 'Spitzenborte' },
  { id: 'stitch',     name: 'Genäht' },
  { id: 'offset',     name: 'Doppelt versetzt' },
  { id: 'baroque',    name: 'Barock-Ecken' },
  { id: 'neon',       name: 'Neon-Glow' },
  { id: 'feather',    name: 'Weicher Verlauf' },
];

SS.defaultFrame = () => ({ style: 'polaroid', border: 26, color: '#fdfbf8', keyline: true, radius: 24,
  shadow: 55 });

/* Build the framed card canvas for a photo element.
   srcCanvas: filtered photo canvas. h: target photo height in canvas px. */
SS.buildCard = function (el, srcCanvas, h) {
  const ar = srcCanvas.width / srcCanvas.height;
  const w = h * ar;
  const f = el.frame;
  const bordered = ['thin', 'double', 'stamp', 'film', 'goldfoil', 'scallop', 'ticket',
    'zeitung', 'tapebottom', 'zigzag', 'lace', 'stitch', 'baroque'];
  const b = f.style.startsWith('polaroid') || bordered.includes(f.style) ? f.border : 0;
  const bottomExtra = f.style === 'polaroid-w' || f.style === 'tapebottom' ? f.border * 3.2 : 0;

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
    case 'goldfoil': {
      const g = c.createLinearGradient(pad, pad, pad + w + b * 2, pad + h + b * 2);
      ['#8c6a2f', '#e8cf96', '#c9a15f', '#f6e7b8', '#a37d3d', '#e0c184'].forEach((col, i) =>
        g.addColorStop(i / 5, col));
      c.fillStyle = g;
      c.fillRect(pad, pad, w + b * 2, h + b * 2);
      c.fillStyle = '#fdfbf8';
      c.fillRect(pad + b * 0.55, pad + b * 0.55, w + b * 0.9, h + b * 0.9);
      drawPhoto();
      break;
    }
    case 'scallop': {
      const r = Math.max(10, b * 0.55);
      c.fillStyle = frameColor;
      c.fillRect(pad + r, pad + r, w + b * 2 - r * 2, h + b * 2 - r * 2);
      for (let x = pad + r; x <= pad + w + b * 2 - r + 1; x += r * 1.7) {
        c.beginPath(); c.arc(x, pad + r, r, 0, 7); c.fill();
        c.beginPath(); c.arc(x, pad + h + b * 2 - r, r, 0, 7); c.fill();
      }
      for (let y = pad + r; y <= pad + h + b * 2 - r + 1; y += r * 1.7) {
        c.beginPath(); c.arc(pad + r, y, r, 0, 7); c.fill();
        c.beginPath(); c.arc(pad + w + b * 2 - r, y, r, 0, 7); c.fill();
      }
      drawPhoto();
      break;
    }
    case 'ticket': {
      c.fillStyle = frameColor;
      roundPath(c, pad, pad, w + b * 2, h + b * 2, 16); c.fill();
      c.save(); c.globalCompositeOperation = 'destination-out';
      const holes = 8, hr = Math.max(7, b * 0.32);
      for (let i = 1; i < holes; i++) {
        const y = pad + (h + b * 2) * i / holes;
        c.beginPath(); c.arc(pad, y, hr, 0, 7); c.fill();
        c.beginPath(); c.arc(pad + w + b * 2, y, hr, 0, 7); c.fill();
      }
      c.restore();
      drawPhoto();
      c.setLineDash([8, 7]);
      c.strokeStyle = 'rgba(120,100,80,.55)'; c.lineWidth = 2;
      c.strokeRect(px - b * 0.4, py - b * 0.4, w + b * 0.8, h + b * 0.8);
      c.setLineDash([]);
      break;
    }
    case 'zeitung': {
      c.fillStyle = '#f4efe3';
      c.fillRect(pad, pad, w + b * 2, h + b * 2);
      c.fillStyle = 'rgba(60,50,40,.14)';
      for (let y = pad + 6; y < pad + h + b * 2 - 4; y += 7) {
        if (Math.random() < 0.6) c.fillRect(pad + 4, y, (w + b * 2 - 8) * (0.4 + Math.random() * 0.55), 2.5);
      }
      const src2 = document.createElement('canvas');
      src2.width = srcCanvas.width; src2.height = srcCanvas.height;
      const s2 = src2.getContext('2d');
      s2.filter = 'grayscale(35%) contrast(105%) sepia(18%)';
      s2.drawImage(srcCanvas, 0, 0);
      c.drawImage(src2, px, py, w, h);
      c.strokeStyle = '#3a332b'; c.lineWidth = 2.5;
      c.strokeRect(px, py, w, h);
      break;
    }
    case 'tapebottom': {
      c.fillStyle = frameColor;
      c.fillRect(pad, pad, w + b * 2, h + b * 2 + bottomExtra);
      drawPhoto();
      c.save(); c.globalAlpha = 0.72; c.fillStyle = '#efe6cf';
      const tw = Math.max(80, w * 0.34), th2 = tw * 0.28;
      c.save(); c.translate(px + w / 2, pad + 4); c.rotate(-0.03);
      c.fillRect(-tw / 2, -th2 / 2, tw, th2); c.restore();
      c.restore();
      break;
    }
    case 'heartframe': {
      const s = Math.min(w, h);
      cv.width = s + pad * 2 + 30; cv.height = s + pad * 2 + 30;
      const c2 = cv.getContext('2d');
      const cx0 = cv.width / 2, cy0 = cv.height / 2 + s * 0.03;
      c2.fillStyle = frameColor;
      SS.drawHeartPath(c2, cx0, cy0, s * 0.56); c2.fill();
      c2.save(); SS.drawHeartPath(c2, cx0, cy0, s * 0.485); c2.clip();
      const sc = Math.max(s / srcCanvas.width, s / srcCanvas.height) * 1.06;
      c2.drawImage(srcCanvas, cx0 - srcCanvas.width * sc / 2, cv.height / 2 - srcCanvas.height * sc / 2,
        srcCanvas.width * sc, srcCanvas.height * sc);
      c2.restore();
      if (f.keyline) { c2.strokeStyle = gold; c2.lineWidth = 2.5; SS.drawHeartPath(c2, cx0, cy0, s * 0.52); c2.stroke(); }
      return cv;
    }
    case 'star': case 'flower': case 'cloudmask': case 'hexagon': case 'diamond': {
      const s = Math.min(w, h);
      cv.width = s + pad * 2; cv.height = s + pad * 2;
      const c2 = cv.getContext('2d');
      const cx0 = cv.width / 2, cy0 = cv.height / 2;
      const path = () => {
        if (f.style === 'star') shapeStar(c2, cx0, cy0, s * 0.5, 5);
        else if (f.style === 'flower') shapeFlower(c2, cx0, cy0, s * 0.5);
        else if (f.style === 'cloudmask') shapeCloud(c2, cx0, cy0, s * 0.5);
        else if (f.style === 'hexagon') shapePoly(c2, cx0, cy0, s * 0.5, 6, -Math.PI / 2);
        else shapePoly(c2, cx0, cy0, s * 0.5, 4, -Math.PI / 2);
      };
      c2.save(); path(); c2.clip();
      const sc = Math.max(s / srcCanvas.width, s / srcCanvas.height) * 1.05;
      c2.drawImage(srcCanvas, cx0 - srcCanvas.width * sc / 2, cy0 - srcCanvas.height * sc / 2,
        srcCanvas.width * sc, srcCanvas.height * sc);
      c2.restore();
      if (f.keyline) { c2.strokeStyle = gold; c2.lineWidth = 3; path(); c2.stroke(); }
      return cv;
    }
    case 'halfcircle': {
      c.save();
      c.beginPath();
      c.moveTo(pad, pad + h);
      c.lineTo(pad, pad + h * 0.45);
      c.quadraticCurveTo(pad, pad, pad + w / 2, pad);
      c.quadraticCurveTo(pad + w, pad, pad + w, pad + h * 0.45);
      c.lineTo(pad + w, pad + h);
      c.closePath();
      const hp = () => {
        c.beginPath();
        c.moveTo(pad, pad + h); c.lineTo(pad, pad + h * 0.45);
        c.quadraticCurveTo(pad, pad, pad + w / 2, pad);
        c.quadraticCurveTo(pad + w, pad, pad + w, pad + h * 0.45);
        c.lineTo(pad + w, pad + h); c.closePath();
      };
      c.clip();
      c.drawImage(srcCanvas, pad, pad, w, h);
      c.restore();
      if (f.keyline) { c.strokeStyle = gold; c.lineWidth = 2.5;
        c.beginPath(); c.moveTo(pad, pad + h); c.lineTo(pad, pad + h * 0.45);
        c.quadraticCurveTo(pad, pad, pad + w / 2, pad);
        c.quadraticCurveTo(pad + w, pad, pad + w, pad + h * 0.45);
        c.lineTo(pad + w, pad + h); c.closePath(); c.stroke(); }
      break;
    }
    case 'squircle': {
      c.save(); roundPath(c, pad, pad, w, h, Math.min(w, h) * 0.28); c.clip();
      c.drawImage(srcCanvas, pad, pad, w, h); c.restore();
      if (f.keyline) { c.strokeStyle = gold; c.lineWidth = 2.5;
        roundPath(c, pad, pad, w, h, Math.min(w, h) * 0.28); c.stroke(); }
      break;
    }
    case 'zigzag': {
      const z = Math.max(9, b * 0.5);
      c.fillStyle = frameColor;
      c.beginPath();
      const x0 = pad, y0 = pad, x1 = pad + w + b * 2, y1 = pad + h + b * 2;
      c.moveTo(x0, y0 + z);
      for (let x = x0; x < x1; x += z * 2) { c.lineTo(x + z, y0); c.lineTo(x + z * 2, y0 + z); }
      for (let y = y0 + z; y < y1; y += z * 2) { c.lineTo(x1 - z, y + z); c.lineTo(x1, y + z * 2); }
      for (let x = x1; x > x0; x -= z * 2) { c.lineTo(x - z, y1); c.lineTo(x - z * 2, y1 - z); }
      for (let y = y1 - z; y > y0; y -= z * 2) { c.lineTo(x0 + z, y - z); c.lineTo(x0, y - z * 2); }
      c.closePath(); c.fill();
      drawPhoto();
      break;
    }
    case 'lace': {
      const r = Math.max(8, b * 0.45);
      c.fillStyle = frameColor;
      c.fillRect(pad + r, pad + r, w + b * 2 - r * 2, h + b * 2 - r * 2);
      for (let x = pad + r; x <= pad + w + b * 2 - r + 1; x += r * 1.6) {
        for (const y of [pad + r, pad + h + b * 2 - r]) {
          c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
        }
      }
      for (let y = pad + r; y <= pad + h + b * 2 - r + 1; y += r * 1.6) {
        for (const x of [pad + r, pad + w + b * 2 - r]) {
          c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
        }
      }
      drawPhoto();
      c.fillStyle = gold; c.globalAlpha = 0.6;
      for (let x = pad + r * 1.4; x < pad + w + b * 2 - r; x += r * 1.6) {
        c.beginPath(); c.arc(x, py - b * 0.45, 1.8, 0, 7); c.fill();
        c.beginPath(); c.arc(x, py + h + b * 0.45, 1.8, 0, 7); c.fill();
      }
      c.globalAlpha = 1;
      break;
    }
    case 'stitch': {
      c.fillStyle = frameColor;
      roundPath(c, pad, pad, w + b * 2, h + b * 2, 10); c.fill();
      drawPhoto();
      c.setLineDash([9, 6]);
      c.strokeStyle = f.keyline ? gold : 'rgba(120,95,75,.7)';
      c.lineWidth = 2.5;
      roundPath(c, pad + b * 0.4, pad + b * 0.4, w + b * 1.2, h + b * 1.2, 8);
      c.stroke();
      c.setLineDash([]);
      break;
    }
    case 'offset': {
      c.strokeStyle = f.keyline ? gold : frameColor;
      c.lineWidth = 3;
      c.strokeRect(pad + 14, pad + 14, w, h);
      c.fillStyle = frameColor;
      c.fillRect(pad, pad, w + 8, h + 8);
      c.drawImage(srcCanvas, pad + 4, pad + 4, w, h);
      break;
    }
    case 'baroque': {
      c.fillStyle = frameColor;
      c.fillRect(pad, pad, w + b * 2, h + b * 2);
      drawPhoto();
      c.strokeStyle = gold; c.lineWidth = 2; c.lineCap = 'round';
      const o = b * 0.5, L = Math.min(w, h) * 0.16;
      [[px - o, py - o, 1, 1], [px + w + o, py - o, -1, 1],
       [px - o, py + h + o, 1, -1], [px + w + o, py + h + o, -1, -1]].forEach(([x, y, sx, sy]) => {
        c.beginPath();
        c.moveTo(x + L * sx, y);
        c.quadraticCurveTo(x, y, x, y + L * sy);
        c.stroke();
        c.beginPath();
        c.arc(x + L * 0.62 * sx, y + L * 0.14 * sy, L * 0.15, 0, 7); c.stroke();
        c.beginPath();
        c.arc(x + L * 0.14 * sx, y + L * 0.62 * sy, L * 0.15, 0, 7); c.stroke();
      });
      break;
    }
    case 'neon': {
      drawPhoto();
      const col = f.keyline ? '#59f0d8' : '#ff7ab8';
      c.save();
      c.shadowColor = col; c.shadowBlur = 22;
      c.strokeStyle = col; c.lineWidth = 4;
      roundPath(c, px - 3, py - 3, w + 6, h + 6, 14);
      c.stroke(); c.stroke();
      c.shadowBlur = 0; c.strokeStyle = '#ffffff'; c.lineWidth = 1.5;
      roundPath(c, px - 3, py - 3, w + 6, h + 6, 14); c.stroke();
      c.restore();
      break;
    }
    case 'feather': {
      const m = Math.max(24, Math.min(w, h) * 0.12);
      const tmp = document.createElement('canvas');
      tmp.width = Math.ceil(w) + pad * 2; tmp.height = Math.ceil(h) + pad * 2;
      const t = tmp.getContext('2d');
      t.drawImage(srcCanvas, pad, pad, w, h);
      t.globalCompositeOperation = 'destination-in';
      const gx = t.createLinearGradient(pad, 0, pad + m, 0);
      gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)');
      // build alpha mask via two passes (x then y)
      const mask = document.createElement('canvas');
      mask.width = tmp.width; mask.height = tmp.height;
      const mc = mask.getContext('2d');
      const gh = mc.createLinearGradient(pad, 0, pad + w, 0);
      gh.addColorStop(0, 'rgba(0,0,0,0)'); gh.addColorStop(m / w, 'rgba(0,0,0,1)');
      gh.addColorStop(1 - m / w, 'rgba(0,0,0,1)'); gh.addColorStop(1, 'rgba(0,0,0,0)');
      mc.fillStyle = gh; mc.fillRect(pad, pad, w, h);
      mc.globalCompositeOperation = 'destination-in';
      const gv = mc.createLinearGradient(0, pad, 0, pad + h);
      gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(m / h, 'rgba(0,0,0,1)');
      gv.addColorStop(1 - m / h, 'rgba(0,0,0,1)'); gv.addColorStop(1, 'rgba(0,0,0,0)');
      mc.fillStyle = gv; mc.fillRect(pad, pad, w, h);
      t.drawImage(mask, 0, 0);
      cv.width = tmp.width; cv.height = tmp.height;
      cv.getContext('2d').drawImage(tmp, 0, 0);
      return cv;
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
function shapeStar(c, cx, cy, r, n) {
  c.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + i * Math.PI / n;
    const rad = i % 2 === 0 ? r : r * 0.52;
    const px = cx + rad * Math.cos(a), py = cy + rad * Math.sin(a);
    i ? c.lineTo(px, py) : c.moveTo(px, py);
  }
  c.closePath();
}
function shapeFlower(c, cx, cy, r) {
  c.beginPath();
  const petals = 8;
  for (let i = 0; i <= 120; i++) {
    const a = i / 120 * Math.PI * 2;
    const rad = r * (0.78 + 0.22 * Math.cos(a * petals));
    const px = cx + rad * Math.cos(a), py = cy + rad * Math.sin(a);
    i ? c.lineTo(px, py) : c.moveTo(px, py);
  }
  c.closePath();
}
function shapeCloud(c, cx, cy, r) {
  c.beginPath();
  c.arc(cx - r * 0.45, cy + r * 0.15, r * 0.42, 0, 7);
  c.arc(cx + r * 0.05, cy - r * 0.25, r * 0.52, 0, 7);
  c.arc(cx + r * 0.48, cy + r * 0.18, r * 0.4, 0, 7);
  c.arc(cx, cy + r * 0.32, r * 0.45, 0, 7);
  c.closePath();
}
function shapePoly(c, cx, cy, r, n, rot) {
  c.beginPath();
  for (let i = 0; i < n; i++) {
    const a = rot + i * Math.PI * 2 / n;
    const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a);
    i ? c.lineTo(px, py) : c.moveTo(px, py);
  }
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
