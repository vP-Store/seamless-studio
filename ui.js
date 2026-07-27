/* Seamless Studio – UI: panels, properties, library grids */

SS.ui = {};
(function () {
  const st = SS.state;
  const $ = SS.el;

  /* ================= tool tabs / side panel ================= */
  const isMobile = () => window.matchMedia('(max-width: 760px)').matches;

  document.querySelectorAll('#toolbar .tool').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.dataset.panel;
      const already = btn.classList.contains('active');
      document.querySelectorAll('#toolbar .tool').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      const sp = $('sidepanel');
      if (isMobile() && already && sp.classList.contains('open')) {
        sp.classList.remove('open');
        return;
      }
      btn.classList.add('active');
      $('panel-' + panel).classList.add('active');
      sp.classList.add('open');
      if (isMobile() && SS.state.selectedId) {   // one sheet at a time on mobile
        SS.state.selectedId = null;
        SS.ui.showProps(); SS.requestRender();
      }
    });
  });

  /* ================= top bar ================= */
  SS.ui.syncTop = function () {
    $('slidesLabel').textContent = isMobile() ? String(st.slides) : st.slides + ' Slides';
    $('formatSel').value = st.format;
    $('slideCtrl').style.display = st.format === '9:16' ? 'none' : 'flex';
  };

  $('slidesMinus').onclick = () => { if (st.slides > 2) { st.slides--; changed(); } };
  $('slidesPlus').onclick = () => { if (st.slides < 20) { st.slides++; changed(); } };
  $('formatSel').onchange = (e) => { st.format = e.target.value; changed(); };
  function changed() {
    SS.bgCacheInvalidate(); SS.ui.syncTop(); SS.pushHistory(); SS.ui.zoomFit(); SS.requestRender();
  }

  $('btnUndo').onclick = SS.undo;
  $('btnRedo').onclick = SS.redo;
  $('btnGuides').onclick = () => {
    st.guides = !st.guides;
    $('btnGuides').classList.toggle('active', st.guides);
    SS.requestRender();
  };
  $('btnTheme').onclick = () => {
    document.body.classList.toggle('light');
    try { localStorage.setItem('ss-theme', document.body.classList.contains('light') ? 'light' : 'dark'); } catch (e) {}
  };

  /* ================= zoom ================= */
  SS.ui.zoomLabel = () => { $('zoomLabel').textContent = Math.round(st.zoom * 100) + '%'; };
  SS.ui.zoomFit = function () {
    const stage = $('stage');
    const { W, H } = SS.canvasSize();
    const pad = 40;
    const z = Math.min((stage.clientWidth - pad) / W, (stage.clientHeight - pad) / H);
    st.zoom = SS.clamp(z, 0.03, 2);
    st.panX = (stage.clientWidth - W * st.zoom) / 2;
    st.panY = (stage.clientHeight - H * st.zoom) / 2;
    SS.ui.zoomLabel();
    SS.requestRender();
  };
  $('zoomFit').onclick = SS.ui.zoomFit;
  $('zoomIn').onclick = () => { st.zoom = SS.clamp(st.zoom * 1.2, 0.05, 4); SS.ui.zoomLabel(); SS.requestRender(); };
  $('zoomOut').onclick = () => { st.zoom = SS.clamp(st.zoom / 1.2, 0.05, 4); SS.ui.zoomLabel(); SS.requestRender(); };

  /* ================= photos panel ================= */
  // The file inputs sit invisibly ON TOP of their buttons (.file-overlay):
  // the tap lands natively on the input — most reliable picker trigger on mobile.
  const fileInput = $('fileInput');
  const fileInput2 = $('fileInput2');
  const panelClose = $('panelClose');
  if (panelClose) panelClose.addEventListener('click', () => $('sidepanel').classList.remove('open'));
  $('dropzone').addEventListener('dragover', e => { e.preventDefault(); e.currentTarget.classList.add('over'); });
  $('dropzone').addEventListener('dragleave', e => e.currentTarget.classList.remove('over'));
  $('dropzone').addEventListener('drop', e => {
    if (e.target === fileInput) return; // native input drop → handled via change
    e.preventDefault(); e.currentTarget.classList.remove('over');
    addFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', () => { addFiles(fileInput.files); fileInput.value = ''; });
  if (fileInput2) fileInput2.addEventListener('change', () => { addFiles(fileInput2.files); fileInput2.value = ''; });

  async function addFiles(files) {
    files = Array.from(files);  // copy: input gets cleared while we load async
    const { H, slideW } = SS.canvasSize();
    let i = 0;
    for (const f of files) {
      if (!f.type.startsWith('image/')) continue;
      try {
        const rec = await SS.loadImageFile(f);
        const imgId = 'img' + Date.now() + '_' + (i++);
        SS.images[imgId] = rec;
        const el = {
          id: SS.uid(), type: 'photo', imgId,
          x: slideW / 2 + (st.elements.length % 3) * 60 + i * 40,
          y: H / 2 + (i % 2 ? 60 : -40),
          rot: (Math.random() * 6 - 3),
          h: Math.min(H * 0.55, 760),
          flip: false, opacity: 1,
          frame: SS.defaultFrame(),
          filter: SS.defaultFilter(),
        };
        st.elements.push(el);
        st.selectedId = el.id;
        addShelfThumb(imgId, rec.dataURL);
      } catch (err) { SS.toast('Foto konnte nicht geladen werden'); }
    }
    SS.pushHistory(); SS.ui.showProps(); SS.requestRender();
    if (isMobile()) $('sidepanel').classList.remove('open');
  }

  function addShelfThumb(imgId, dataURL) {
    const img = document.createElement('img');
    img.src = dataURL; img.title = 'Nochmal einfügen';
    img.onclick = () => {
      const { H, slideW } = SS.canvasSize();
      const el = {
        id: SS.uid(), type: 'photo', imgId,
        x: slideW / 2, y: H / 2, rot: 0,
        h: Math.min(H * 0.55, 760), flip: false, opacity: 1,
        frame: SS.defaultFrame(), filter: SS.defaultFilter(),
      };
      st.elements.push(el); st.selectedId = el.id;
      SS.pushHistory(); SS.ui.showProps(); SS.requestRender();
    };
    $('photoShelf').appendChild(img);
  }
  SS.ui.addShelfThumb = addShelfThumb;

  /* ================= background panel ================= */
  const bgGrid = $('bgGrid');
  function renderBgGrid(cat) {
    bgGrid.innerHTML = '';
    $('bgCustom').classList.toggle('hidden', cat !== 'eigene');
    $('bgHueRow').classList.toggle('hidden', cat === 'eigene' || cat === 'look');
    if (cat === 'eigene') return;
    if (cat === 'look') { renderLooks(); return; }
    for (const def of SS.BG_LIB.filter(b => b.cat === cat)) {
      const sw = document.createElement('button');
      sw.className = 'swatch' + (st.bg.type === 'preset' && st.bg.id === def.id ? ' sel' : '');
      const cv = document.createElement('canvas');
      cv.width = 108; cv.height = 108;
      def.paint(cv.getContext('2d'), 108, 108);
      const lb = document.createElement('label'); lb.textContent = def.name;
      sw.appendChild(cv); sw.appendChild(lb);
      sw.onclick = () => {
        st.bg = { type: 'preset', id: def.id, hue: +$('bgHue').value || 0 };
        SS.bgCacheInvalidate(); SS.pushHistory(); SS.requestRender();
        renderBgGrid(cat);
      };
      bgGrid.appendChild(sw);
    }
  }
  $('bgHue').addEventListener('input', () => {
    if (st.bg.type === 'preset') {
      st.bg.hue = +$('bgHue').value;
      SS.bgCacheInvalidate(); SS.requestRender();
    }
  });
  $('bgHue').addEventListener('change', () => SS.pushHistory());
  $('bgHueReset').onclick = () => {
    $('bgHue').value = 0;
    if (st.bg.type === 'preset') { st.bg.hue = 0; SS.bgCacheInvalidate(); SS.pushHistory(); SS.requestRender(); }
  };

  /* ---- Looks: one tap = coordinated color scheme ---- */
  function isDarkPal(pal) {
    const [r, g, b] = SS.hex2rgb(pal.c[0]);
    return (r * 0.3 + g * 0.6 + b * 0.1) < 120;
  }
  function renderLooks() {
    for (const pal of SS.PALETTES) {
      const sw = document.createElement('button');
      sw.className = 'swatch';
      const cv = document.createElement('canvas');
      cv.width = 108; cv.height = 108;
      const c = cv.getContext('2d');
      pal.c.forEach((col, i) => { c.fillStyle = col; c.fillRect(0, i * 27, 108, 27); });
      c.fillStyle = isDarkPal(pal) ? '#f0e6d8' : '#5c4a42';
      c.font = 'italic 15px Lora'; c.textAlign = 'center';
      c.fillText('Aa ✦', 54, 60);
      const lb = document.createElement('label'); lb.textContent = pal.name;
      sw.appendChild(cv); sw.appendChild(lb);
      sw.onclick = () => applyLook(pal);
      bgGrid.appendChild(sw);
    }
  }
  function applyLook(pal) {
    const dark = isDarkPal(pal);
    st.bg = { type: 'preset', id: `aq-${pal.id}-1`, hue: 0 };
    const inkCol = dark ? '#f2e9dc' : '#5c4a42';
    const accCol = dark ? '#d4af7e' : pal.c[2];
    for (const el of st.elements) {
      if (el.type === 'text') el.color = inkCol;
      if (el.type === 'sticker' && el.cat !== 'privacy') el.color = accCol;
      if (el.type === 'photo') {
        el.frame.color = dark ? '#2e2a26' : '#fdfbf8';
        SS.invalidateEl(el);
      }
    }
    SS.bgCacheInvalidate(); SS.pushHistory(); SS.ui.showProps(); SS.requestRender();
    SS.toast(`✦ Look „${pal.name}" angewendet`);
  }
  document.querySelectorAll('#bgTabs button').forEach(b => {
    b.onclick = () => {
      document.querySelectorAll('#bgTabs button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      renderBgGrid(b.dataset.cat);
    };
  });
  renderBgGrid('aquarell');

  $('bgFileInput').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const rec = await SS.loadImageFile(f, 3200);
    SS.images.__bg = rec;
    st.bg = { type: 'image', blur: +$('bgBlur').value, darken: +$('bgDarken').value, customURL: rec.dataURL, custom: true };
    SS.bgCacheInvalidate(); SS.pushHistory(); SS.requestRender();
    e.target.value = '';
  });
  $('bgBlur').oninput = $('bgDarken').oninput = () => {
    if (st.bg.type === 'image') {
      st.bg.blur = +$('bgBlur').value; st.bg.darken = +$('bgDarken').value;
      SS.bgCacheInvalidate(); SS.requestRender();
    }
  };
  $('bgApplyGradient').onclick = () => {
    st.bg = { type: 'gradient', c1: $('bgCol1').value, c2: $('bgCol2').value, angle: +$('bgAngle').value };
    SS.bgCacheInvalidate(); SS.pushHistory(); SS.requestRender();
  };

  /* ================= text panel ================= */
  SS.FONTS = ['Lora', 'Playfair Display', 'Cormorant Garamond', 'DM Serif Display',
    'Libre Baskerville', 'Marcellus', 'Italiana', 'Cinzel', 'Abril Fatface',
    'Poppins', 'Montserrat', 'Raleway', 'Quicksand', 'Comfortaa',
    'Bebas Neue', 'Anton', 'Archivo Black',
    'Dancing Script', 'Caveat', 'Great Vibes', 'Sacramento', 'Parisienne',
    'Satisfy', 'Pacifico', 'Shadows Into Light', 'Patrick Hand', 'Kalam',
    'Amatic SC', 'Special Elite', 'Courier Prime'];

  const fp = $('fontPreviews');
  SS.FONTS.forEach(f => {
    const d = document.createElement('div');
    d.style.fontFamily = `'${f}'`;
    d.textContent = f;
    fp.appendChild(d);
  });

  function bgIsDark() {
    const id = st.bg.id || '';
    return /nacht|schwarzgold|smaragd|bordeaux|nachtgold|graphit|samt|goldstaub|bokeh|marmorgold/.test(id);
  }
  $('addText').onclick = () => {
    const { H, slideW } = SS.canvasSize();
    const el = {
      id: SS.uid(), type: 'text', content: 'Dein Text',
      x: slideW / 2, y: H * 0.8, rot: 0,
      font: 'Lora', size: 52, color: bgIsDark() ? '#f2e9dc' : '#5c4a42',
      bold: false, italic: true, align: 'center',
      letterSpacing: 0, lineHeight: 1.4, opacity: 1,
      shadow: false, outline: false, outlineColor: '#ffffff',
      effect: 'none', curve: 0,
      bgStyle: 'none', bgColor: '#ffffff', bgAlpha: 0.85,
    };
    st.elements.push(el); st.selectedId = el.id;
    SS.pushHistory(); SS.ui.showProps(); SS.requestRender();
    if (isMobile()) $('sidepanel').classList.remove('open');
  };

  /* ================= sticker panel ================= */
  const stGrid = $('stGrid');
  function renderStGrid(cat) {
    stGrid.innerHTML = '';
    if (cat === 'privacy') {
      // vector privacy stickers + blur tools
      for (const def of SS.STICKERS.filter(s => s.cat === 'privacy')) stGrid.appendChild(stickerSwatch(def));
      for (const bt of SS.BLUR_TOOLS) {
        const sw = document.createElement('button');
        sw.className = 'swatch';
        const cv = document.createElement('canvas');
        cv.width = 108; cv.height = 108;
        const c = cv.getContext('2d');
        c.fillStyle = '#cfc4ba'; c.fillRect(0, 0, 108, 108);
        for (let i = 0; i < 60; i++) {
          c.fillStyle = `hsl(${20 + Math.random() * 30},40%,${55 + Math.random() * 25}%)`;
          c.fillRect((i % 8) * 14, Math.floor(i / 8) * 14, 14, 14);
        }
        const lb = document.createElement('label'); lb.textContent = bt.name;
        sw.appendChild(cv); sw.appendChild(lb);
        sw.onclick = () => addBlur(bt);
        stGrid.appendChild(sw);
      }
      return;
    }
    for (const def of SS.STICKERS.filter(s => s.cat === cat)) stGrid.appendChild(stickerSwatch(def));
  }

  function stickerSwatch(def) {
    const sw = document.createElement('button');
    sw.className = 'swatch';
    const cv = document.createElement('canvas');
    cv.width = 108; cv.height = 108;
    const c = cv.getContext('2d');
    c.translate(54, 54);
    const col = def.cat === 'privacy' ? '#e8a9b4' : (def.cat === 'linien' || def.cat === 'funkeln' ? '#bf9b6c' : '#d68a96');
    def.draw(c, def.ar ? 96 : 78, col);
    const lb = document.createElement('label'); lb.textContent = def.name;
    sw.appendChild(cv); sw.appendChild(lb);
    sw.onclick = () => addSticker(def);
    return sw;
  }

  function addSticker(def) {
    const { H, slideW } = SS.canvasSize();
    const col = def.cat === 'privacy' ? '#e8a9b4' : (def.cat === 'linien' || def.cat === 'funkeln' ? '#bf9b6c' : '#d68a96');
    const el = {
      id: SS.uid(), type: 'sticker', kind: def.id, cat: def.cat,
      x: slideW / 2, y: H / 2, rot: 0,
      s: def.cat === 'privacy' ? 320 : 160, color: col, opacity: 1,
      anim: def.anim || 'none',
    };
    st.elements.push(el); st.selectedId = el.id;
    SS.pushHistory(); SS.ui.showProps(); SS.requestRender();
    if (isMobile()) $('sidepanel').classList.remove('open');
  }

  // custom PNG sticker upload
  $('stickerFile').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const rec = await SS.loadImageFilePNG(f);
    const imgId = 'stk' + Date.now();
    SS.images[imgId] = rec;
    const { H, slideW } = SS.canvasSize();
    st.elements.push({
      id: SS.uid(), type: 'photo', imgId,
      x: slideW / 2, y: H / 2, rot: 0, h: 300, flip: false, opacity: 1,
      frame: Object.assign(SS.defaultFrame(), { style: 'none', shadow: 0 }),
      filter: SS.defaultFilter(),
    });
    st.selectedId = st.elements[st.elements.length - 1].id;
    SS.pushHistory(); SS.ui.showProps(); SS.requestRender();
    e.target.value = '';
    SS.toast('Eigener Sticker eingefügt ✓');
  });

  function addBlur(bt) {
    const { H, slideW } = SS.canvasSize();
    const el = {
      id: SS.uid(), type: 'blur', shape: bt.shape, pixelate: !!bt.pixelate,
      x: slideW / 2, y: H / 2, rot: 0, w: 300, h: 300, strength: 18, opacity: 1,
    };
    st.elements.push(el); st.selectedId = el.id;
    SS.pushHistory(); SS.ui.showProps(); SS.requestRender();
    if (isMobile()) $('sidepanel').classList.remove('open');
  }

  document.querySelectorAll('#stTabs button').forEach(b => {
    b.onclick = () => {
      document.querySelectorAll('#stTabs button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      renderStGrid(b.dataset.cat);
    };
  });
  renderStGrid('herzen');

  $('addEmoji').onclick = () => {
    const v = $('emojiInput').value.trim();
    if (!v) return;
    const { H, slideW } = SS.canvasSize();
    st.elements.push({ id: SS.uid(), type: 'emoji', char: v, x: slideW / 2, y: H / 2, rot: 0, s: 180, opacity: 1 });
    st.selectedId = st.elements[st.elements.length - 1].id;
    SS.pushHistory(); SS.ui.showProps(); SS.requestRender();
  };

  /* ================= auto layout ================= */
  let layoutSeed = 1;
  function autoLayout(seed) {
    const photos = st.elements.filter(e => e.type === 'photo');
    if (!photos.length) { SS.toast('Füge zuerst Fotos hinzu 🙂'); return; }
    const { W, H } = SS.canvasSize();
    const tilt = +$('alTilt').value;
    const stagger = +$('alStagger').value;
    const rnd = (function (s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })(seed);

    // estimate widths at trial height, iterate to fit
    const margin = 60, gap = 26;
    let h = H * 0.55;
    for (let iter = 0; iter < 7; iter++) {
      let total = margin * 2 + gap * (photos.length - 1);
      for (const p of photos) {
        const rec = SS.images[p.imgId];
        const ar = rec ? rec.w / rec.h : 0.8;
        const ph = ar > 1.2 ? h * 0.72 : h;
        total += ph * ar + p.frame.border * 2;
      }
      h = h * Math.pow(W / total, 0.9);
      h = Math.min(h, H * 0.62);
    }
    let x = margin;
    let total = margin * 2 + gap * (photos.length - 1);
    const widths = photos.map(p => {
      const rec = SS.images[p.imgId];
      const ar = rec ? rec.w / rec.h : 0.8;
      const ph = ar > 1.2 ? h * 0.72 : h;
      const w = ph * ar + p.frame.border * 2;
      total += w;
      return { w, ph };
    });
    const extra = Math.max(0, (W - total + margin * 2) / (photos.length + 1));
    x = margin + extra / 2;
    photos.forEach((p, i) => {
      const { w, ph } = widths[i];
      p.h = ph;
      p.x = x + w / 2;
      p.y = H / 2 + (i % 2 === 0 ? -1 : 1) * (stagger + rnd() * 30) * 0.9;
      p.rot = (i % 2 === 0 ? -1 : 1) * (tilt * 0.6 + rnd() * tilt * 0.6);
      x += w + gap + extra;
      SS.invalidateEl(p);
    });
    SS.pushHistory(); SS.requestRender();
  }
  $('autoLayout').onclick = () => autoLayout(1);
  $('autoShuffle').onclick = () => autoLayout(++layoutSeed * 137);

  /* ---- align tools ---- */
  const { } = {};
  $('alignH').onclick = () => {
    const sel = SS.getSel(); if (!sel) return SS.toast('Erst ein Element antippen');
    sel.x = SS.canvasSize().W / 2; SS.pushHistory(); SS.requestRender();
  };
  $('alignV').onclick = () => {
    const sel = SS.getSel(); if (!sel) return SS.toast('Erst ein Element antippen');
    sel.y = SS.canvasSize().H / 2; SS.pushHistory(); SS.requestRender();
  };
  $('alignSlide').onclick = () => {
    const sel = SS.getSel(); if (!sel) return SS.toast('Erst ein Element antippen');
    const { slideW } = SS.canvasSize();
    const idx = SS.clamp(Math.round(sel.x / slideW - 0.5), 0, SS.state.slides - 1);
    sel.x = idx * slideW + slideW / 2;
    SS.pushHistory(); SS.requestRender();
  };
  $('distribute').onclick = () => {
    const photos = st.elements.filter(e => e.type === 'photo');
    if (photos.length < 2) return SS.toast('Mindestens 2 Fotos nötig');
    const { W } = SS.canvasSize();
    photos.sort((a, b) => a.x - b.x);
    photos.forEach((p, i) => { p.x = W * (i + 0.5) / photos.length; });
    SS.pushHistory(); SS.requestRender();
  };
  $('sameSize').onclick = () => {
    const sel = SS.getSel();
    const photos = st.elements.filter(e => e.type === 'photo');
    if (!photos.length) return;
    const h = (sel && sel.type === 'photo') ? sel.h : photos[0].h;
    photos.forEach(p => { p.h = h; SS.invalidateEl(p); });
    SS.pushHistory(); SS.requestRender();
  };

  /* ---- template looks ---- */
  const TEMPLATES = [
    { name: 'Gentle Story', bg: 'aq-blush-1', frame: 'polaroid', filter: 'creamy',
      font: 'Lora', italic: true, tcolor: '#5c4a42', deco: ['thread', 'sparkle', 'heart-aqua'] },
    { name: 'Minimal Editorial', bg: 'aq-ivory-2', frame: 'thin', filter: 'original',
      font: 'Montserrat', italic: false, tcolor: '#3a332c', deco: ['hairline'] },
    { name: 'Golden Hour', bg: 'aq-sunset-1', frame: 'polaroid-c', filter: 'golden',
      font: 'Playfair Display', italic: true, tcolor: '#6b4a2a', deco: ['sun', 'sparkle3'] },
    { name: 'Dark Luxury', bg: 'pr-goldstaub', frame: 'goldfoil', filter: 'matte',
      font: 'Cinzel', italic: false, tcolor: '#e8cf96', deco: ['sparkle', 'starcirc'] },
    { name: 'Scrapbook', bg: 'tx-papier-0', frame: 'tape', filter: 'softfilm',
      font: 'Caveat', italic: false, tcolor: '#4a3b30', deco: ['washi1', 'clip', 'scribble'] },
    { name: 'Soft Film', bg: 'aq-nebel-1', frame: 'polaroid', filter: 'fade',
      font: 'Special Elite', italic: false, tcolor: '#4a4540', deco: ['dots'] },
    { name: 'Baby Dreams', bg: 'aq-himmel-1', frame: 'rounded', filter: 'creamy',
      font: 'Quicksand', italic: false, tcolor: '#4a5a6b', deco: ['mobile', 'cloud', 'moon'] },
    { name: 'Boho', bg: 'pt-boho-8', frame: 'stitch', filter: 'warm',
      font: 'Marcellus', italic: false, tcolor: '#6b503a', deco: ['branch', 'flourish'] },
  ];
  const tplGrid = $('tplGrid');
  TEMPLATES.forEach(tpl => {
    const sw = document.createElement('button');
    sw.className = 'swatch';
    const cv = document.createElement('canvas');
    cv.width = 135; cv.height = 108;
    const c = cv.getContext('2d');
    const def = SS.BG_LIB.find(b => b.id === tpl.bg);
    if (def) def.paint(c, 135, 108);
    c.fillStyle = '#fff';
    c.save(); c.translate(45, 46); c.rotate(-0.06);
    c.fillRect(-24, -28, 48, 60);
    c.fillStyle = '#c9bfae'; c.fillRect(-19, -23, 38, 42); c.restore();
    c.fillStyle = tpl.tcolor;
    c.font = `italic 13px "${tpl.font}"`;
    c.textAlign = 'center';
    c.fillText('Aa', 96, 55);
    const lb = document.createElement('label'); lb.textContent = tpl.name;
    sw.appendChild(cv); sw.appendChild(lb);
    sw.onclick = () => applyTemplate(tpl);
    tplGrid.appendChild(sw);
  });
  function applyTemplate(tpl) {
    st.bg = { type: 'preset', id: tpl.bg, hue: 0 };
    const preset = SS.FILTER_PRESETS.find(p => p.id === tpl.filter);
    for (const el of st.elements) {
      if (el.type === 'photo' && !(el.frame.style === 'none' && el.frame.shadow === 0)) {
        el.frame.style = tpl.frame;
        if (preset) el.filter = Object.assign(SS.defaultFilter(), preset.f, { preset: preset.id });
        SS.photoCacheClear(el.id); SS.invalidateEl(el);
      }
      if (el.type === 'text') {
        el.font = tpl.font; el.italic = tpl.italic; el.color = tpl.tcolor;
      }
    }
    // add up to 3 deco stickers if none present yet
    if (!st.elements.some(e => e.type === 'sticker' && e.cat !== 'privacy')) {
      const { W, H } = SS.canvasSize();
      tpl.deco.slice(0, 3).forEach((kind, i) => {
        const def = SS.STICKERS.find(s => s.id === kind);
        if (!def) return;
        st.elements.push({
          id: SS.uid(), type: 'sticker', kind, cat: def.cat,
          x: W * (0.15 + 0.35 * i), y: H * (i % 2 ? 0.85 : 0.12),
          rot: (i % 2 ? -8 : 8), s: def.ar ? 300 : 130,
          color: tpl.tcolor, opacity: 0.85, anim: def.anim || 'none',
        });
      });
    }
    if (st.elements.some(e => e.type === 'photo')) autoLayout(3);
    SS.bgCacheInvalidate(); SS.pushHistory(); SS.requestRender();
    SS.toast(`✨ Vorlage „${tpl.name}" angewendet`);
  }

  /* ================= project panel ================= */
  $('projSave').onclick = () => {
    const imgs = {};
    for (const el of st.elements) if (el.type === 'photo' && SS.images[el.imgId]) imgs[el.imgId] = SS.images[el.imgId].dataURL;
    if (st.bg.customURL) imgs.__bg = st.bg.customURL;
    const blob = new Blob([JSON.stringify({ snap: SS.serialize(), imgs })], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'projekt.seamless';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  $('projLoad').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      await SS.loadProjectData(data);
      SS.toast('Projekt geladen ✓');
    } catch (err) { SS.toast('Datei konnte nicht gelesen werden'); }
    e.target.value = '';
  });
  $('projNew').onclick = () => {
    if (!confirm('Wirklich alles löschen und neu beginnen?')) return;
    st.elements = []; st.selectedId = null;
    st.bg = { type: 'preset', id: 'aq-blush-1' };
    $('photoShelf').innerHTML = '';
    SS.bgCacheInvalidate(); SS.pushHistory(); SS.ui.showProps(); SS.requestRender();
  };

  /* ---- project gallery (multiple projects with thumbnails) ---- */
  function projectPayload() {
    const imgs = {};
    for (const el of st.elements) if (el.type === 'photo' && SS.images[el.imgId]) imgs[el.imgId] = SS.images[el.imgId].dataURL;
    if (st.bg.customURL) imgs.__bg = st.bg.customURL;
    return { snap: SS.serialize(), imgs };
  }
  function makeThumb() {
    const { W, H } = SS.canvasSize();
    const tw = 320, th = Math.round(320 * H / W);
    const cv = document.createElement('canvas');
    cv.width = tw; cv.height = th;
    const c = cv.getContext('2d');
    c.scale(tw / W, tw / W);
    SS.paintScene(c, W, H, { forExport: true });
    return cv.toDataURL('image/jpeg', 0.7);
  }
  $('projSaveAs').onclick = async () => {
    if (!st.elements.length) return SS.toast('Die Leinwand ist noch leer');
    const id = 'proj:' + Date.now();
    const data = projectPayload();
    data.thumb = makeThumb();
    data.name = 'Projekt ' + new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) +
      ' ' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    SS.dbPut(id, data);
    SS.toast('✓ Projekt gespeichert');
    setTimeout(renderProjList, 300);
  };
  async function renderProjList() {
    const list = $('projList');
    list.innerHTML = '';
    const keys = (await SS.dbKeys()).filter(k => String(k).startsWith('proj:')).sort().reverse();
    for (const k of keys) {
      const data = await SS.dbGet(k);
      if (!data) continue;
      const card = document.createElement('div');
      card.className = 'proj-card';
      const img = document.createElement('img');
      img.src = data.thumb || '';
      const nm = document.createElement('div');
      nm.className = 'pc-name'; nm.textContent = data.name || 'Projekt';
      const del = document.createElement('button');
      del.className = 'pc-del'; del.textContent = '✕';
      del.onclick = (e) => {
        e.stopPropagation();
        if (confirm('Dieses Projekt löschen?')) { SS.dbDel(k); renderProjList(); }
      };
      card.appendChild(img); card.appendChild(nm); card.appendChild(del);
      card.onclick = async () => {
        await SS.loadProjectData(data);
        SS.toast('Projekt geladen ✓');
      };
      list.appendChild(card);
    }
    if (!keys.length) list.innerHTML = '<p class="hint">Noch keine gespeicherten Projekte.</p>';
  }
  setTimeout(renderProjList, 1500);

  SS.loadProjectData = async function (data) {
    for (const [id, url] of Object.entries(data.imgs || {})) {
      const rec = await SS.loadImageURL(url);
      SS.images[id] = rec;
      if (id !== '__bg') addShelfThumb(id, url);
    }
    SS.restore(data.snap);
    // fix id sequence
    let mx = 0;
    for (const el of SS.state.elements) {
      const n = parseInt(el.id.replace(/\D/g, '')) || 0;
      mx = Math.max(mx, n);
    }
    SS.state._idSeq = mx + 1;
    SS.pushHistory();
  };

  SS.loadAutosave = async function () {
    const data = await SS.dbGet('autosave');
    if (data && data.snap) {
      try {
        const parsed = JSON.parse(data.snap);
        if (parsed.elements && parsed.elements.length) {
          await SS.loadProjectData(data);
          SS.toast('Letztes Projekt wiederhergestellt ✓');
        }
      } catch (e) {}
    }
  };

  /* ================= properties ================= */
  const props = $('props');
  const body = $('propsBody');

  $('propsClose').onclick = () => { st.selectedId = null; SS.ui.showProps(); SS.requestRender(); };
  const propsExpand = $('propsExpand');
  if (propsExpand) propsExpand.onclick = () => {
    const mini = props.classList.toggle('mini');
    propsExpand.textContent = mini ? 'Bearbeiten ⌄' : 'Zuklappen ⌃';
  };
  $('elDel').onclick = () => SS.ui.deleteSel();
  $('elDup').onclick = () => SS.ui.dupSel();
  $('elUp').onclick = () => reorder(1);
  $('elDown').onclick = () => reorder(-1);

  SS.ui.deleteSel = function () {
    const i = st.elements.findIndex(e => e.id === st.selectedId);
    if (i >= 0) st.elements.splice(i, 1);
    st.selectedId = null;
    SS.pushHistory(); SS.ui.showProps(); SS.requestRender();
  };
  SS.ui.dupSel = function () {
    const sel = SS.getSel();
    if (!sel) return;
    const cp = JSON.parse(JSON.stringify(sel));
    cp.id = SS.uid(); cp.x += 60; cp.y += 40;
    st.elements.push(cp);
    st.selectedId = cp.id;
    SS.pushHistory(); SS.ui.showProps(); SS.requestRender();
  };
  function reorder(dir) {
    const i = st.elements.findIndex(e => e.id === st.selectedId);
    if (i < 0) return;
    const j = SS.clamp(i + dir, 0, st.elements.length - 1);
    if (i === j) return;
    const [el] = st.elements.splice(i, 1);
    st.elements.splice(j, 0, el);
    SS.pushHistory(); SS.requestRender();
  }

  let boundaryWarned = false;
  SS.ui.warnBoundary = function (bad) {
    if (bad && !boundaryWarned) {
      boundaryWarned = true;
      SS.toast('⚠️ Der Text liegt über einer Schnittkante – er wird beim Wischen zerschnitten!', 3500);
      setTimeout(() => { boundaryWarned = false; }, 6000);
    }
  };

  // control builders
  function ctlRange(label, val, min, max, stp, fn) {
    const d = document.createElement('div'); d.className = 'ctl';
    d.innerHTML = `<span>${label}</span>`;
    const r = document.createElement('input');
    r.type = 'range'; r.min = min; r.max = max; r.step = stp; r.value = val;
    r.addEventListener('input', () => fn(+r.value));
    r.addEventListener('change', () => SS.pushHistory());
    d.appendChild(r);
    return d;
  }
  function ctlColor(label, val, fn) {
    const d = document.createElement('div'); d.className = 'ctl';
    d.innerHTML = `<span>${label}</span>`;
    const inp = document.createElement('input');
    inp.type = 'color'; inp.value = val;
    inp.addEventListener('input', () => fn(inp.value));
    inp.addEventListener('change', () => SS.pushHistory());
    d.appendChild(inp);
    // pipette: pick color from the canvas
    const pick = document.createElement('button');
    pick.className = 'mini-btn'; pick.title = 'Farbe aus dem Bild aufnehmen';
    pick.innerHTML = '<svg style="width:14px;height:14px"><use href="#i-pipette"/></svg>';
    pick.onclick = () => {
      SS.pickMode = (hex) => { inp.value = hex; fn(hex); SS.pushHistory(); SS.ui.showProps(); };
      SS.toast('💧 Tippe auf die Leinwand, um eine Farbe aufzunehmen');
      if (isMobile()) props.classList.add('mini');
    };
    d.appendChild(pick);
    return d;
  }
  function nudgeRow(sel) {
    const d = document.createElement('div'); d.className = 'nudge-row';
    [['←', -10, 0], ['↑', 0, -10], ['↓', 0, 10], ['→', 10, 0]].forEach(([t, dx, dy]) => {
      const b = document.createElement('button');
      b.textContent = t;
      b.onclick = () => { sel.x += dx; sel.y += dy; SS.requestRender(); };
      d.appendChild(b);
    });
    return d;
  }
  function ctlSelect(label, val, options, fn) {
    const d = document.createElement('div'); d.className = 'ctl';
    d.innerHTML = `<span>${label}</span>`;
    const s = document.createElement('select');
    for (const [v, name] of options) {
      const o = document.createElement('option');
      o.value = v; o.textContent = name; if (v === val) o.selected = true;
      s.appendChild(o);
    }
    s.addEventListener('change', () => { fn(s.value); SS.pushHistory(); });
    d.appendChild(s);
    return d;
  }
  function chips(items, isSel, fn) {
    const d = document.createElement('div'); d.className = 'chips';
    for (const it of items) {
      const b = document.createElement('button');
      b.textContent = it.name;
      if (isSel(it)) b.classList.add('sel');
      b.onclick = () => { fn(it); SS.pushHistory(); SS.ui.showProps(); };
      d.appendChild(b);
    }
    return d;
  }
  function h4(t) { const e = document.createElement('h4'); e.textContent = t; return e; }

  SS.ui.showProps = function () {
    const sel = SS.getSel();
    if (!sel) { props.classList.add('hidden'); return; }
    props.classList.remove('hidden');
    if (isMobile()) {
      $('sidepanel').classList.remove('open');   // one sheet at a time
      props.classList.add('mini');               // start slim — canvas stays visible
      const pe = $('propsExpand');
      if (pe) pe.textContent = 'Bearbeiten ⌄';
    } else {
      props.classList.remove('mini');
    }
    body.innerHTML = '';
    const titles = { photo: '📷 Foto', text: '🅣 Text', sticker: '💛 Sticker', emoji: '😊 Emoji', blur: '🔒 Blur' };
    $('propsTitle').textContent = titles[sel.type] || 'Element';

    body.appendChild(nudgeRow(sel));

    if (sel.type === 'photo') {
      body.appendChild(h4('Rahmen'));
      body.appendChild(chips(SS.FRAMES, f => f.id === sel.frame.style, f => {
        sel.frame.style = f.id; SS.invalidateEl(sel); SS.requestRender();
      }));
      body.appendChild(ctlRange('Randbreite', sel.frame.border, 0, 80, 1, v => { sel.frame.border = v; SS.invalidateEl(sel); SS.requestRender(); }));
      body.appendChild(ctlColor('Randfarbe', sel.frame.color, v => { sel.frame.color = v; SS.invalidateEl(sel); SS.requestRender(); }));
      const key = document.createElement('div'); key.className = 'ctl';
      key.innerHTML = `<span>Gold-Keyline</span>`;
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = sel.frame.keyline;
      cb.onchange = () => { sel.frame.keyline = cb.checked; SS.invalidateEl(sel); SS.pushHistory(); SS.requestRender(); };
      key.appendChild(cb); body.appendChild(key);
      body.appendChild(ctlRange('Eckenradius', sel.frame.radius, 0, 200, 2, v => { sel.frame.radius = v; SS.invalidateEl(sel); SS.requestRender(); }));
      body.appendChild(ctlRange('Schatten', sel.frame.shadow, 0, 100, 1, v => { sel.frame.shadow = v; SS.requestRender(); }));

      body.appendChild(h4('Filter'));
      body.appendChild(chips(SS.FILTER_PRESETS, p => sel.filter.preset === p.id, p => {
        sel.filter = Object.assign(SS.defaultFilter(), p.f, { preset: p.id });
        SS.photoCacheClear(sel.id); SS.invalidateEl(sel); SS.requestRender();
      }));
      const F = sel.filter;
      const upd = () => { F.preset = 'custom'; SS.photoCacheClear(sel.id); SS.invalidateEl(sel); SS.requestRender(); };
      body.appendChild(ctlRange('Helligkeit', F.brightness, 50, 150, 1, v => { F.brightness = v; upd(); }));
      body.appendChild(ctlRange('Kontrast', F.contrast, 50, 160, 1, v => { F.contrast = v; upd(); }));
      body.appendChild(ctlRange('Sättigung', F.saturate, 0, 200, 1, v => { F.saturate = v; upd(); }));
      body.appendChild(ctlRange('Wärme', F.warmth, -60, 60, 1, v => { F.warmth = v; upd(); }));
      body.appendChild(ctlRange('Weichzeichner', F.blur, 0, 12, 0.5, v => { F.blur = v; upd(); }));
      body.appendChild(ctlRange('Vignette', F.vignette, 0, 60, 1, v => { F.vignette = v; upd(); }));
      body.appendChild(ctlRange('Filmkorn', F.grain, 0, 40, 1, v => { F.grain = v; upd(); }));

      body.appendChild(h4('Zuschnitt im Rahmen'));
      if (!sel.crop) sel.crop = { zoom: 1, ox: 0, oy: 0 };
      const updCrop = () => { SS.photoCacheClear(sel.id); SS.invalidateEl(sel); SS.requestRender(); };
      body.appendChild(ctlRange('Zoom', sel.crop.zoom * 100, 100, 300, 2, v => { sel.crop.zoom = v / 100; updCrop(); }));
      body.appendChild(ctlRange('Ausschnitt ↔', sel.crop.ox * 100, -100, 100, 2, v => { sel.crop.ox = v / 100; updCrop(); }));
      body.appendChild(ctlRange('Ausschnitt ↕', sel.crop.oy * 100, -100, 100, 2, v => { sel.crop.oy = v / 100; updCrop(); }));

      body.appendChild(h4('Allgemein'));
      const flipB = document.createElement('button'); flipB.className = 'wide'; flipB.textContent = '↔️ Spiegeln';
      flipB.onclick = () => { sel.flip = !sel.flip; SS.photoCacheClear(sel.id); SS.invalidateEl(sel); SS.pushHistory(); SS.requestRender(); };
      body.appendChild(flipB);
      const copyB = document.createElement('button'); copyB.className = 'wide';
      copyB.textContent = '📋 Stil auf alle Fotos übertragen';
      copyB.onclick = () => {
        for (const el of st.elements) {
          if (el.type === 'photo' && el.id !== sel.id) {
            el.frame = JSON.parse(JSON.stringify(sel.frame));
            el.filter = JSON.parse(JSON.stringify(sel.filter));
            SS.photoCacheClear(el.id); SS.invalidateEl(el);
          }
        }
        SS.pushHistory(); SS.requestRender();
        SS.toast('✓ Rahmen & Filter auf alle Fotos übertragen');
      };
      body.appendChild(copyB);
      body.appendChild(ctlRange('Deckkraft', (sel.opacity ?? 1) * 100, 10, 100, 1, v => { sel.opacity = v / 100; SS.requestRender(); }));
      body.appendChild(ctlRange('Drehung', sel.rot, -45, 45, 0.5, v => { sel.rot = v; SS.requestRender(); }));
    }

    if (sel.type === 'text') {
      const ta = document.createElement('textarea');
      ta.value = sel.content;
      ta.addEventListener('input', () => { sel.content = ta.value; SS.requestRender(); });
      ta.addEventListener('change', () => SS.pushHistory());
      body.appendChild(ta);
      body.appendChild(h4('Schrift'));
      body.appendChild(ctlSelect('Schriftart', sel.font, SS.FONTS.map(f => [f, f]), v => { sel.font = v; SS.requestRender(); }));
      body.appendChild(ctlRange('Größe', sel.size, 14, 260, 1, v => { sel.size = v; SS.requestRender(); }));
      body.appendChild(ctlColor('Farbe', sel.color, v => { sel.color = v; SS.requestRender(); }));
      const styleRow = document.createElement('div'); styleRow.className = 'chips';
      const mk = (name, get, set) => {
        const b = document.createElement('button'); b.textContent = name;
        if (get()) b.classList.add('sel');
        b.onclick = () => { set(); SS.pushHistory(); SS.ui.showProps(); SS.requestRender(); };
        return b;
      };
      styleRow.appendChild(mk('Fett', () => sel.bold, () => sel.bold = !sel.bold));
      styleRow.appendChild(mk('Kursiv', () => sel.italic, () => sel.italic = !sel.italic));
      styleRow.appendChild(mk('Schatten', () => sel.shadow, () => sel.shadow = !sel.shadow));
      styleRow.appendChild(mk('Kontur', () => sel.outline, () => sel.outline = !sel.outline));
      body.appendChild(styleRow);
      body.appendChild(ctlSelect('Ausrichtung', sel.align, [['center', 'Zentriert'], ['left', 'Links'], ['right', 'Rechts']], v => { sel.align = v; SS.requestRender(); }));
      body.appendChild(ctlRange('Buchstabenabst.', sel.letterSpacing, -3, 30, 0.5, v => { sel.letterSpacing = v; SS.requestRender(); }));
      body.appendChild(ctlRange('Zeilenhöhe', sel.lineHeight * 100, 90, 220, 5, v => { sel.lineHeight = v / 100; SS.requestRender(); }));

      body.appendChild(h4('Effekt'));
      body.appendChild(chips([
        { id: 'none', name: 'Kein' }, { id: 'gold', name: '✨ Gold' },
        { id: 'neon', name: '💡 Neon' }, { id: '3d', name: '3D' },
        { id: 'kontur', name: 'Kontur' },
      ], e => (sel.effect || 'none') === e.id, e => { sel.effect = e.id; SS.requestRender(); }));
      body.appendChild(ctlRange('Bogen', sel.curve || 0, -100, 100, 2, v => { sel.curve = v; SS.requestRender(); }));

      body.appendChild(h4('Text-Hintergrund'));
      body.appendChild(ctlSelect('Stil', sel.bgStyle, [
        ['none', 'Keiner'], ['label', 'Insta-Label'], ['pill', 'Pill'], ['card', 'Karte'],
        ['glass', 'Milchglas'], ['marker', 'Highlighter'], ['sticky', 'Notizzettel'],
        ['ribbon', 'Banner'], ['torn', 'Gerissen'], ['stamp', 'Stempel'],
        ['kreis', 'Marker-Kreis'], ['underline', 'Unterstrichen'],
      ], v => { sel.bgStyle = v; SS.requestRender(); }));
      body.appendChild(ctlColor('BG-Farbe', sel.bgColor, v => { sel.bgColor = v; SS.requestRender(); }));
      body.appendChild(ctlRange('BG-Deckkraft', sel.bgAlpha * 100, 10, 100, 1, v => { sel.bgAlpha = v / 100; SS.requestRender(); }));
      body.appendChild(ctlRange('Drehung', sel.rot, -45, 45, 0.5, v => { sel.rot = v; SS.requestRender(); }));
    }

    if (sel.type === 'sticker') {
      body.appendChild(ctlColor('Farbe', sel.color, v => { sel.color = v; SS.requestRender(); }));
      body.appendChild(ctlRange('Größe', sel.s, 20, 1500, 5, v => { sel.s = v; SS.requestRender(); }));
      body.appendChild(ctlRange('Deckkraft', (sel.opacity ?? 1) * 100, 5, 100, 1, v => { sel.opacity = v / 100; SS.requestRender(); }));
      body.appendChild(ctlRange('Drehung', sel.rot, -180, 180, 1, v => { sel.rot = v; SS.requestRender(); }));
      body.appendChild(h4('✨ Animation (Video)'));
      body.appendChild(chips([
        { id: 'none', name: 'Keine' }, { id: 'pulse', name: '💗 Pulsieren' },
        { id: 'twinkle', name: '✦ Funkeln' }, { id: 'float', name: '☁ Schweben' },
        { id: 'spin', name: '↻ Drehen' }, { id: 'wobble', name: '〰 Wackeln' },
      ], a => (sel.anim || 'none') === a.id, a => { sel.anim = a.id; SS.requestRender(); }));
      const p = document.createElement('p'); p.className = 'hint';
      p.textContent = 'Animationen sind live auf der Leinwand sichtbar und werden im Video-Export mitgerendert. Bilder-Export bleibt gestochen scharf & statisch.';
      body.appendChild(p);
    }
    if (sel.type === 'emoji') {
      body.appendChild(ctlRange('Größe', sel.s, 30, 1200, 5, v => { sel.s = v; SS.requestRender(); }));
      body.appendChild(ctlRange('Deckkraft', (sel.opacity ?? 1) * 100, 5, 100, 1, v => { sel.opacity = v / 100; SS.requestRender(); }));
      body.appendChild(ctlRange('Drehung', sel.rot, -180, 180, 1, v => { sel.rot = v; SS.requestRender(); }));
    }
    if (sel.type === 'blur') {
      body.appendChild(ctlRange('Stärke', sel.strength, 4, 60, 1, v => { sel.strength = v; SS.requestRender(); }));
      body.appendChild(ctlRange('Breite', sel.w, 40, 2000, 5, v => { sel.w = v; SS.requestRender(); }));
      body.appendChild(ctlRange('Höhe', sel.h, 40, 2000, 5, v => { sel.h = v; SS.requestRender(); }));
      body.appendChild(ctlRange('Drehung', sel.rot, -90, 90, 1, v => { sel.rot = v; SS.requestRender(); }));
      const p = document.createElement('p'); p.className = 'hint';
      p.textContent = 'Der Bereich verwischt alles, was darunter liegt – perfekt für Gesichter oder Namen.';
      body.appendChild(p);
    }
  };
})();
