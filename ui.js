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
      if (isMobile() && SS.state.selectedIds.length) {   // am Handy immer nur ein Blatt
        SS.clearSel();
        SS.ui.showProps(); SS.requestRender();
      }
    });
  });

  /* ================= top bar ================= */
  SS.ui.syncTop = function () {
    const clip = !!(SS.clip && SS.clip.ready);
    $('slidesLabel').textContent = isMobile() ? String(st.slides) : st.slides + ' Slides';
    $('formatSel').value = st.format;
    $('slideCtrl').style.display = (clip || st.format === '9:16') ? 'none' : 'flex';
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
  const fileInput3 = $('fileInput3');   // ohne accept – öffnet am iPhone die Dateien-App
  if (fileInput3) fileInput3.addEventListener('change', () => { addFiles(fileInput3.files); fileInput3.value = ''; });

  /* Dateien einlesen und in SS.images ablegen */
  let _imgZaehler = 0;
  async function ladeBilder(files) {
    const liste = Array.from(files).filter(f =>
      f.type ? f.type.startsWith('image/') : /\.(jpe?g|png|gif|webp|heic|heif|avif|bmp)$/i.test(f.name || ''));
    const out = [];
    for (const f of liste) {
      try {
        const rec = await SS.loadImageFile(f);
        const imgId = 'img' + Date.now() + '_' + (_imgZaehler++);
        SS.images[imgId] = rec;
        out.push({ imgId, rec, dataURL: rec.dataURL });
      } catch (err) { SS.toast('Ein Foto konnte nicht geladen werden', 2600, 'err'); }
    }
    return out;
  }

  async function addFiles(files) {
    const anzahl = Array.from(files).length;
    if (!anzahl) return;
    SS.toast(anzahl > 1 ? `Lade ${anzahl} Fotos …` : 'Lade Foto …', 1400);

    const loaded = await ladeBilder(files);
    if (!loaded.length) return;

    let order = loaded.map((_, i) => i);
    let mode = 'auto';
    // Der Sortierdialog kommt auch bei einem einzelnen Foto, wenn schon Fotos da sind –
    // so lassen sich am Handy mehrere Bilder nacheinander sammeln und dann anordnen.
    const zeigeDialog = loaded.length > 1 || (isMobile() && st.elements.some(e => e.type === 'photo'));
    if (zeigeDialog && SS.sortDialog) {
      const res = await SS.sortDialog(loaded, ladeBilder);
      if (!res) { loaded.forEach(l => { delete SS.images[l.imgId]; }); return; }
      order = res.order; mode = res.mode;
    }

    let seq = order.map(i => loaded[i]);
    if (mode === 'auto') seq = autoOrder(seq);

    const { H } = SS.canvasSize();
    const mitte = SS.aktuelleSlideMitte();
    const added = [];
    seq.forEach((it, i) => {
      const el = {
        id: SS.uid(), type: 'photo', imgId: it.imgId,
        x: mitte.x + (st.elements.length % 3) * 60 + i * 40,
        y: H / 2 + (i % 2 ? 60 : -40),
        rot: (Math.random() * 6 - 3),
        h: Math.min(H * 0.55, 760),
        flip: false, opacity: 1,
        frame: SS.defaultFrame(),
        filter: SS.defaultFilter(),
      };
      SS.normalizeEl(el);
      st.elements.push(el);
      added.push(el);
      addShelfThumb(it.imgId, it.dataURL);
    });
    if (added.length) SS.setSelMany(added.map(e => e.id)); else SS.clearSel();

    if (mode === 'order' || mode === 'auto') autoLayout(1);
    SS.pushHistory('Fotos hinzugefügt'); SS.ui.showProps(); SS.requestRender();
    SS.toast(`${seq.length} ${seq.length === 1 ? 'Foto' : 'Fotos'} eingefügt`, 2200, 'ok');
    if (isMobile()) $('sidepanel').classList.remove('open');
  }

  /* „Automatisch": angenehmer Rhythmus – Hoch- und Querformate wechseln sich ab */
  function autoOrder(list) {
    const tall = [], wide = [];
    for (const it of list) ((it.rec.w / it.rec.h) > 1.05 ? wide : tall).push(it);
    const out = [];
    while (tall.length || wide.length) {
      if (tall.length) out.push(tall.shift());
      if (wide.length) out.push(wide.shift());
      if (tall.length > wide.length + 1 && tall.length) out.push(tall.shift());
    }
    return out;
  }

  function addShelfThumb(imgId, dataURL) {
    const img = document.createElement('img');
    img.src = dataURL;
    img.title = 'Antippen zum Einfügen – oder auf die Leinwand ziehen';
    img.draggable = true;
    img.dataset.imgId = imgId;
    img.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/ss-img', imgId);
      e.dataTransfer.effectAllowed = 'copy';
    });
    // Finger: ziehen auf die Leinwand
    img.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      let moved = false;
      const cv = $('canvas');
      const move = (m) => {
        if (Math.hypot(m.clientX - e.clientX, m.clientY - e.clientY) > 14) moved = true;
      };
      const up = (u) => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        if (!moved) return;
        const r = cv.getBoundingClientRect();
        if (u.clientX < r.left || u.clientX > r.right || u.clientY < r.top || u.clientY > r.bottom) return;
        const wx = (u.clientX - r.left - SS.state.panX) / SS.state.zoom;
        const wy = (u.clientY - r.top - SS.state.panY) / SS.state.zoom;
        SS.ui.placePhotoAt(imgId, wx, wy);
        $('sidepanel').classList.remove('open');
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
    img.onclick = () => {
      const { H } = SS.canvasSize();
      const mitte = SS.aktuelleSlideMitte();
      const el = SS.normalizeEl({
        id: SS.uid(), type: 'photo', imgId,
        x: mitte.x, y: mitte.y, rot: 0,
        h: Math.min(H * 0.55, 760), flip: false, opacity: 1,
        frame: SS.defaultFrame(), filter: SS.defaultFilter(),
      });
      st.elements.push(el); SS.setSel(el.id);
      SS.pushHistory('Foto eingefügt'); SS.ui.showProps(); SS.requestRender();
    };
    $('photoShelf').appendChild(img);
  }
  SS.ui.addShelfThumb = addShelfThumb;

  /* Foto aus dem Regal an eine bestimmte Stelle setzen */
  SS.ui.placePhotoAt = function (imgId, x, y) {
    const { H } = SS.canvasSize();
    if (!SS.images[imgId]) return;
    const el = SS.normalizeEl({
      id: SS.uid(), type: 'photo', imgId,
      x, y, rot: 0, h: Math.min(H * 0.55, 760), flip: false, opacity: 1,
      frame: SS.defaultFrame(), filter: SS.defaultFilter(),
    });
    st.elements.push(el);
    SS.setSel(el.id);
    SS.buzz();
    SS.pushHistory('Foto abgelegt'); SS.ui.showProps(); SS.requestRender();
  };

  /* Dateien direkt an der Ablegestelle einfügen (Ziehen und Ablegen) */
  SS.ui.addFilesAt = async function (files, x, y) {
    const list = Array.from(files).filter(f => f.type && f.type.startsWith('image/'));
    if (!list.length) return;
    const { H } = SS.canvasSize();
    let i = 0;
    for (const f of list) {
      try {
        const rec = await SS.loadImageFile(f);
        const imgId = 'img' + Date.now() + '_' + (i);
        SS.images[imgId] = rec;
        addShelfThumb(imgId, rec.dataURL);
        const el = SS.normalizeEl({
          id: SS.uid(), type: 'photo', imgId,
          x: x + i * 50, y: y + (i % 2 ? 40 : -30), rot: 0,
          h: Math.min(H * 0.55, 760), flip: false, opacity: 1,
          frame: SS.defaultFrame(), filter: SS.defaultFilter(),
        });
        st.elements.push(el);
        SS.setSel(el.id);
        i++;
      } catch (e) { SS.toast('Ein Foto konnte nicht geladen werden', 2600, 'err'); }
    }
    SS.pushHistory('Fotos abgelegt'); SS.ui.showProps(); SS.requestRender();
  };

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
  /* Ein Look setzt Hintergrund, Rahmen, Schrift, Textfarbe, Sticker-Palette und Filter zugleich */
  SS.LOOKS = [
    { id: 'gentle',    name: 'Gentle Blush',   bg: 'aq-blush-1',    frame: 'polaroid',   fcol: '#fdfbf8',
      font: 'Lora',              ink: '#5c4a42', acc: '#d68a96', filter: 'creamy',   pal: ['#f3d9d2', '#e6b6b0', '#d68a96'] },
    { id: 'ivory',     name: 'Ivory Minimal',  bg: 'aq-ivory-2',    frame: 'thin',       fcol: '#ffffff',
      font: 'Montserrat',        ink: '#3a332c', acc: '#bf9b6c', filter: 'original', pal: ['#f7f3ec', '#e6dccd', '#bf9b6c'] },
    { id: 'golden',    name: 'Golden Hour',    bg: 'sl-sonnenaufgang', frame: 'polaroid-c', fcol: '#f6eddc',
      font: 'Playfair Display',  ink: '#6b4a2a', acc: '#d9a05b', filter: 'golden',   pal: ['#f7d9c4', '#e7a184', '#d9a05b'] },
    { id: 'noir',      name: 'Dark Luxury',    bg: 'sl-goldband',   frame: 'goldfoil',   fcol: '#26221f',
      font: 'Cinzel',            ink: '#e8cf96', acc: '#c9a15f', filter: 'matte',    pal: ['#1e1a17', '#5a4a33', '#c9a15f'] },
    { id: 'scrap',     name: 'Scrapbook',      bg: 'tx-papier-0',   frame: 'tape',       fcol: '#fffdf7',
      font: 'Caveat',            ink: '#4a3b30', acc: '#c98b6b', filter: 'softfilm', pal: ['#efe6d2', '#d8bf9a', '#c98b6b'] },
    { id: 'film',      name: 'Soft Film',      bg: 'aq-nebel-1',    frame: 'polaroid',   fcol: '#f3f1ee',
      font: 'Special Elite',     ink: '#4a4540', acc: '#8f9a9c', filter: 'fade',     pal: ['#e9e7e3', '#c3c8c9', '#8f9a9c'] },
    { id: 'baby',      name: 'Baby Dreams',    bg: 'aq-himmel-1',   frame: 'rounded',    fcol: '#ffffff',
      font: 'Quicksand',         ink: '#4a5a6b', acc: '#9fc3d9', filter: 'creamy',   pal: ['#e4f0f7', '#c2dcea', '#9fc3d9'] },
    { id: 'boho',      name: 'Boho Terrakotta',bg: 'pt-boho-8',     frame: 'stitch',     fcol: '#f7ece0',
      font: 'Marcellus',         ink: '#6b503a', acc: '#c07a55', filter: 'warm',     pal: ['#f0dcc8', '#d9a37c', '#c07a55'] },
    { id: 'sage',      name: 'Sage & Linen',   bg: 'sl-huegel',     frame: 'arch',       fcol: '#f6f3ec',
      font: 'Cormorant Upright', ink: '#4d5a4c', acc: '#9aab8e', filter: 'matte',    pal: ['#eef1e9', '#c6d2bf', '#9aab8e'] },
    { id: 'romance',   name: 'Romance Script', bg: 'sl-pastellbogen', frame: 'oval',     fcol: '#ffffff',
      font: 'Alex Brush',        ink: '#8a5a6b', acc: '#d691a8', filter: 'creamy',   pal: ['#f9e6ec', '#eec3d3', '#d691a8'] },
    { id: 'night',     name: 'Sternennacht',   bg: 'sl-milchstrasse', frame: 'circle',   fcol: '#1a2240',
      font: 'Julius Sans One',   ink: '#e6ecff', acc: '#a8bce8', filter: 'cool',     pal: ['#0d1224', '#3a4570', '#a8bce8'] },
    { id: 'editorial', name: 'Editorial',      bg: 'sl-diagonalen', frame: 'double',     fcol: '#ffffff',
      font: 'Bodoni Moda',       ink: '#2f2a26', acc: '#bf9b6c', filter: 'bwhard',   pal: ['#f7f1ea', '#cfc2b0', '#bf9b6c'] },
  ];

  function renderLooks() {
    for (const look of SS.LOOKS) {
      const sw = document.createElement('button');
      sw.className = 'swatch';
      const cv = document.createElement('canvas');
      cv.width = 135; cv.height = 108;
      const c = cv.getContext('2d');
      const def = SS.BG_LIB.find(b => b.id === look.bg);
      if (def) def.paint(c, 135, 108); else { c.fillStyle = look.pal[0]; c.fillRect(0, 0, 135, 108); }
      // kleine Foto-Attrappe im Rahmen des Looks
      c.save(); c.translate(42, 52); c.rotate(-0.05);
      c.fillStyle = look.fcol; c.fillRect(-23, -27, 46, 58);
      c.fillStyle = look.pal[1]; c.fillRect(-18, -22, 36, 40);
      c.restore();
      c.fillStyle = look.ink;
      c.font = `italic 15px "${look.font}"`;
      c.textAlign = 'center';
      c.fillText('Aa', 98, 52);
      c.fillStyle = look.acc;
      c.beginPath(); c.arc(98, 72, 5, 0, 7); c.fill();
      const lb = document.createElement('label'); lb.textContent = look.name;
      sw.appendChild(cv); sw.appendChild(lb);
      sw.onclick = () => applyLook(look);
      bgGrid.appendChild(sw);
    }
  }

  function applyLook(look) {
    st.bg = { type: 'preset', id: look.bg, hue: 0 };
    const preset = SS.FILTER_PRESETS.find(p => p.id === look.filter);
    let i = 0;
    for (const el of st.elements) {
      if (el.type === 'text') { el.color = look.ink; el.font = look.font; }
      if ((el.type === 'sticker') && el.cat !== 'privacy') { el.color = look.pal[2 - (i++ % 3)] || look.acc; }
      if (el.type === 'photo') {
        el.frame.style = look.frame;
        el.frame.color = look.fcol;
        if (preset) el.filter = Object.assign(SS.defaultFilter(), preset.f, { preset: preset.id });
        SS.photoCacheClear(el.id); SS.invalidateEl(el);
      }
    }
    SS.bgCacheInvalidate(); SS.pushHistory('Look: ' + look.name);
    SS.ui.showProps(); SS.requestRender();
    SS.toast(`Look „${look.name}" angewendet – Hintergrund, Rahmen, Schrift und Farben`, 3000, 'ok');
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
  SS.FONT_GROUPS = [
    { name: 'Serif & Klassisch', fonts: ['Lora', 'Playfair Display', 'Cormorant Garamond',
      'Cormorant Upright', 'DM Serif Display', 'Libre Baskerville', 'Marcellus', 'Italiana',
      'Cinzel', 'Abril Fatface', 'Gilda Display', 'Prata', 'Bodoni Moda', 'Forum', 'Philosopher'] },
    { name: 'Kalligrafie & Script', fonts: ['Dancing Script', 'Great Vibes', 'Sacramento',
      'Parisienne', 'Satisfy', 'Pacifico', 'Alex Brush', 'Allura', 'Tangerine',
      'Petit Formal Script', 'Mrs Saint Delafield', 'Yellowtail', 'Cookie', 'La Belle Aurore'] },
    { name: 'Modern & Sans', fonts: ['Poppins', 'Montserrat', 'Raleway', 'Quicksand',
      'Comfortaa', 'Julius Sans One', 'Tenor Sans'] },
    { name: 'Plakativ', fonts: ['Bebas Neue', 'Anton', 'Archivo Black'] },
    { name: 'Handschrift & Schreibmaschine', fonts: ['Caveat', 'Shadows Into Light',
      'Patrick Hand', 'Kalam', 'Amatic SC', 'Special Elite', 'Courier Prime'] },
  ];
  SS.FONTS = SS.FONT_GROUPS.reduce((a, g) => a.concat(g.fonts), []);

  const fp = $('fontPreviews');
  SS.FONT_GROUPS.forEach(g => {
    const t = document.createElement('div');
    t.className = 'fp-group';
    t.textContent = g.name;
    fp.appendChild(t);
    g.fonts.forEach(f => {
      const d = document.createElement('div');
      d.style.fontFamily = `'${f}'`;
      d.textContent = f;
      d.title = 'Antippen, um sie beim ausgewählten Text zu verwenden';
      d.onclick = () => {
        const sel = SS.getSel();
        if (sel && sel.type === 'text') {
          sel.font = f; SS.pushHistory('Schriftart'); SS.ui.showProps(); SS.requestRender();
          SS.toast('Schrift: ' + f, 1600, 'ok');
        } else SS.toast('Erst ein Textfeld auswählen', 2000, 'warn');
      };
      fp.appendChild(d);
    });
  });

  /* Schriftauswahl mit Gruppen */
  function ctlFont(val, fn) {
    const d = document.createElement('div'); d.className = 'ctl';
    d.innerHTML = '<span>Schriftart</span>';
    const s = document.createElement('select');
    SS.FONT_GROUPS.forEach(g => {
      const og = document.createElement('optgroup');
      og.label = g.name;
      g.fonts.forEach(f => {
        const o = document.createElement('option');
        o.value = f; o.textContent = f;
        o.style.fontFamily = `'${f}'`;
        if (f === val) o.selected = true;
        og.appendChild(o);
      });
      s.appendChild(og);
    });
    s.addEventListener('change', () => { fn(s.value); SS.pushHistory('Schriftart'); });
    d.appendChild(s);
    return d;
  }

  function bgIsDark() {
    const id = st.bg.id || '';
    return /nacht|schwarzgold|smaragd|bordeaux|nachtgold|graphit|samt|goldstaub|bokeh|marmorgold/.test(id);
  }
  SS.ui.bgIstDunkel = bgIsDark;

  $('addText').onclick = () => {
    const { H } = SS.canvasSize();
    const mitte = SS.aktuelleSlideMitte();
    const el = {
      id: SS.uid(), type: 'text', content: 'Dein Text',
      x: mitte.x, y: H * 0.8, rot: 0,
      font: 'Lora', size: 52, color: bgIsDark() ? '#f2e9dc' : '#5c4a42',
      bold: false, italic: true, align: 'center',
      letterSpacing: 0, lineHeight: 1.4, opacity: 1,
      shadow: false, outline: false, outlineColor: '#ffffff',
      effect: 'none', curve: 0,
      bgStyle: 'none', bgColor: '#ffffff', bgAlpha: 0.85,
    };
    SS.normalizeEl(el);
    st.elements.push(el); SS.setSel(el.id);
    SS.pushHistory('Text hinzugefügt'); SS.ui.showProps(); SS.requestRender();
    if (isMobile()) $('sidepanel').classList.remove('open');
  };

  /* ================= sticker panel ================= */
  const stGrid = $('stGrid');

  /* Zuletzt benutzte Sticker – bei 276 Motiven findet man sonst nichts wieder */
  const ZULETZT_KEY = 'ss5.zuletzt';
  let zuletzt = [];
  try { zuletzt = JSON.parse(localStorage.getItem(ZULETZT_KEY) || '[]'); } catch (e) {}
  SS.stickerBenutzt = function (id) {
    zuletzt = [id].concat(zuletzt.filter(x => x !== id)).slice(0, 24);
    try { localStorage.setItem(ZULETZT_KEY, JSON.stringify(zuletzt)); } catch (e) {}
  };

  function renderStGrid(cat) {
    stGrid.innerHTML = '';
    if (cat === 'zuletzt') {
      const liste = zuletzt.map(id => SS.STICKERS.find(s => s.id === id)).filter(Boolean);
      if (!liste.length) {
        const p = document.createElement('p');
        p.className = 'hint';
        p.textContent = 'Hier sammeln sich die Sticker, die du zuletzt benutzt hast.';
        stGrid.appendChild(p);
        return;
      }
      for (const def of liste) stGrid.appendChild(stickerSwatch(def));
      return;
    }
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
    def.draw(c, def.ar ? 96 : 78, stickerFarbe(def.cat));
    const lb = document.createElement('label'); lb.textContent = def.name;
    sw.appendChild(cv); sw.appendChild(lb);
    sw.onclick = () => addSticker(def);
    return sw;
  }

  function stickerFarbe(cat) {
    if (cat === 'privacy') return '#e8a9b4';
    if (cat === 'linien' || cat === 'funkeln') return '#bf9b6c';
    if (cat === 'spirit') return '#c9a15f';
    if (cat === 'glanz') return '#d691a8';
    return '#d68a96';
  }

  function addSticker(def) {
    const mitte = SS.aktuelleSlideMitte();
    const col = stickerFarbe(def.cat);
    const el = {
      id: SS.uid(), type: 'sticker', kind: def.id, cat: def.cat,
      x: mitte.x, y: mitte.y, rot: 0,
      s: def.cat === 'privacy' ? 320 : 160, color: col, opacity: 1,
      anim: def.anim || 'none',
    };
    SS.normalizeEl(el);
    st.elements.push(el); SS.setSel(el.id);
    SS.stickerBenutzt && SS.stickerBenutzt(def.id);
    SS.pushHistory('Sticker hinzugefügt'); SS.ui.showProps(); SS.requestRender();
    if (isMobile()) $('sidepanel').classList.remove('open');
  }

  // custom PNG sticker upload
  $('stickerFile').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const rec = await SS.loadImageFilePNG(f);
    const imgId = 'stk' + Date.now();
    SS.images[imgId] = rec;
    const mitte = SS.aktuelleSlideMitte();
    st.elements.push(SS.normalizeEl({
      id: SS.uid(), type: 'photo', imgId,
      x: mitte.x, y: mitte.y, rot: 0, h: 300, flip: false, opacity: 1,
      frame: Object.assign(SS.defaultFrame(), { style: 'none', shadow: 0 }),
      filter: SS.defaultFilter(),
    }));
    SS.setSel(st.elements[st.elements.length - 1].id);
    SS.pushHistory('Eigener Sticker'); SS.ui.showProps(); SS.requestRender();
    e.target.value = '';
    SS.toast('Eigener Sticker eingefügt', 2400, 'ok');
  });

  function addBlur(bt) {
    const mitte = SS.aktuelleSlideMitte();
    const el = {
      id: SS.uid(), type: 'blur', shape: bt.shape, pixelate: !!bt.pixelate,
      x: mitte.x, y: mitte.y, rot: 0, w: 300, h: 300, strength: 18, opacity: 1,
    };
    SS.normalizeEl(el);
    st.elements.push(el); SS.setSel(el.id);
    SS.pushHistory('Privacy-Bereich'); SS.ui.showProps(); SS.requestRender();
    if (isMobile()) $('sidepanel').classList.remove('open');
  }

  document.querySelectorAll('#stTabs button').forEach(b => {
    b.onclick = () => {
      document.querySelectorAll('#stTabs button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      // gewählten Reiter in die sichtbare Zeile holen
      try { b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); } catch (e) {}
      renderStGrid(b.dataset.cat);
    };
  });
  renderStGrid('herzen');

  $('addEmoji').onclick = () => {
    const v = $('emojiInput').value.trim();
    if (!v) return;
    const mitte = SS.aktuelleSlideMitte();
    st.elements.push(SS.normalizeEl({ id: SS.uid(), type: 'emoji', char: v, x: mitte.x, y: mitte.y, rot: 0, s: 180, opacity: 1 }));
    SS.setSel(st.elements[st.elements.length - 1].id);
    SS.pushHistory('Emoji hinzugefügt'); SS.ui.showProps(); SS.requestRender();
  };

  /* ================= auto layout ================= */
  let layoutSeed = 1;
  function autoLayout(seed) {
    const photos = st.elements.filter(e => e.type === 'photo' && !e.hidden && !e.locked);
    if (!photos.length) { SS.toast('Füge zuerst Fotos hinzu', 2400, 'warn'); return; }
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
  SS.ui.autoLayout = autoLayout;
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

  /* ================= Layout-Vorlagen ================= */
  SS.LAYOUTS = [
    { id: 'reihe',   name: 'Reihe',            hint: 'Gleichmäßig nebeneinander' },
    { id: 'versetzt', name: 'Versetzt',        hint: 'Zickzack – der Klassiker' },
    { id: 'diagonal', name: 'Diagonal',        hint: 'Steigt von links nach rechts' },
    { id: 'held',    name: '1 groß + Rest',    hint: 'Ein Hauptfoto, der Rest klein' },
    { id: 'zweier',  name: 'Zwei Reihen',      hint: 'Oben und unten abwechselnd' },
    { id: 'mittig',  name: 'Je Slide eins',    hint: 'Ein Foto mittig pro Slide' },
    { id: 'textlast', name: 'Text-lastig',     hint: 'Fotos oben, viel Platz für Text' },
    { id: 'collage', name: 'Collage-Raster',   hint: '2×2 je Slide, enge Abstände' },
  ];

  SS.ui.applyLayout = function (id) {
    const photos = st.elements.filter(e => e.type === 'photo' && !e.hidden && !e.locked);
    if (!photos.length) return SS.toast('Füge zuerst Fotos hinzu', 2400, 'warn');
    const { W, H, slideW, n } = SS.canvasSize();
    const N = photos.length;
    const setAll = (fn) => photos.forEach((p, i) => { fn(p, i); SS.invalidateEl(p); });

    if (id === 'reihe') {
      autoLayout(1);
      setAll(p => { p.rot = 0; p.y = H / 2; });
    } else if (id === 'versetzt') {
      autoLayout(1);
    } else if (id === 'diagonal') {
      const h = Math.min(H * 0.5, 700);
      setAll((p, i) => {
        p.h = h;
        p.x = W * (i + 0.5) / N;
        p.y = H * (0.72 - 0.44 * (i / Math.max(1, N - 1)));
        p.rot = -6 + 12 * (i / Math.max(1, N - 1));
      });
    } else if (id === 'held') {
      const heroH = H * 0.72, smallH = H * 0.34;
      setAll((p, i) => {
        if (i === 0) { p.h = heroH; p.x = W * 0.18; p.y = H / 2; p.rot = -2; }
        else {
          const k = i - 1, m = Math.max(1, N - 1);
          p.h = smallH;
          p.x = W * (0.42 + 0.54 * (k + 0.5) / m);
          p.y = H * (k % 2 ? 0.72 : 0.3);
          p.rot = k % 2 ? 4 : -4;
        }
      });
    } else if (id === 'zweier') {
      const h = H * 0.4;
      setAll((p, i) => {
        p.h = h;
        p.x = W * (Math.floor(i / 2) + (i % 2 ? 0.7 : 0.3)) / Math.ceil(N / 2);
        p.y = i % 2 ? H * 0.72 : H * 0.28;
        p.rot = i % 2 ? 3 : -3;
      });
    } else if (id === 'mittig') {
      setAll((p, i) => {
        const slide = Math.min(n - 1, i);
        p.h = H * 0.66;
        p.x = slide * slideW + slideW / 2;
        p.y = H / 2;
        p.rot = 0;
      });
    } else if (id === 'textlast') {
      const h = H * 0.38;
      setAll((p, i) => {
        p.h = h;
        p.x = W * (i + 0.5) / N;
        p.y = H * 0.3;
        p.rot = i % 2 ? 2.5 : -2.5;
      });
    } else if (id === 'collage') {
      const perSlide = Math.max(1, Math.ceil(N / n));
      const cols = perSlide > 2 ? 2 : 1, rows = Math.ceil(perSlide / cols);
      const h = (H * 0.86) / rows;
      setAll((p, i) => {
        const slide = Math.min(n - 1, Math.floor(i / perSlide));
        const k = i % perSlide;
        const cx = k % cols, cy = Math.floor(k / cols);
        p.h = h;
        p.x = slide * slideW + slideW * ((cx + 0.5) / cols);
        p.y = H * 0.07 + h * (cy + 0.5);
        p.rot = 0;
      });
    }
    SS.pushHistory('Layout: ' + id);
    SS.requestRender();
    const def = SS.LAYOUTS.find(l => l.id === id);
    SS.toast('Layout „' + (def ? def.name : id) + '" angewendet', 2400, 'ok');
  };

  (function buildLayoutGrid() {
    const g = $('layoutGrid');
    if (!g) return;
    SS.LAYOUTS.forEach(L => {
      const sw = document.createElement('button');
      sw.className = 'swatch';
      sw.title = L.hint;
      const cv = document.createElement('canvas');
      cv.width = 135; cv.height = 108;
      const c = cv.getContext('2d');
      c.fillStyle = '#efe6dc'; c.fillRect(0, 0, 135, 108);
      c.strokeStyle = 'rgba(190,120,90,.5)'; c.setLineDash([3, 3]);
      [45, 90].forEach(x => { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 108); c.stroke(); });
      c.setLineDash([]);
      const box = (x, y, w, h, r) => {
        c.save(); c.translate(x, y); c.rotate((r || 0) * Math.PI / 180);
        c.fillStyle = '#fff'; c.fillRect(-w / 2, -h / 2, w, h);
        c.fillStyle = '#c9bfae'; c.fillRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4);
        c.restore();
      };
      const P = {
        reihe: [[22, 54, 26, 34], [67, 54, 26, 34], [112, 54, 26, 34]],
        versetzt: [[22, 40, 26, 34, -5], [67, 66, 26, 34, 5], [112, 40, 26, 34, -5]],
        diagonal: [[22, 74, 26, 32, -7], [67, 54, 26, 32, 0], [112, 32, 26, 32, 7]],
        held: [[30, 54, 42, 60, -2], [80, 34, 20, 24, -4], [80, 76, 20, 24, 4], [116, 54, 20, 24, 3]],
        zweier: [[26, 30, 30, 26], [56, 78, 30, 26], [90, 30, 30, 26], [120, 78, 26, 26]],
        mittig: [[22, 54, 32, 44], [67, 54, 32, 44], [112, 54, 32, 44]],
        textlast: [[22, 32, 26, 26], [67, 32, 26, 26], [112, 32, 26, 26]],
        collage: [[14, 32, 22, 26], [36, 32, 22, 26], [14, 74, 22, 26], [36, 74, 22, 26],
          [59, 32, 22, 26], [81, 32, 22, 26], [59, 74, 22, 26], [81, 74, 22, 26]],
      };
      (P[L.id] || P.reihe).forEach(b => box.apply(null, b));
      if (L.id === 'textlast') {
        c.fillStyle = 'rgba(90,70,60,.5)';
        for (let i = 0; i < 3; i++) c.fillRect(20, 66 + i * 9, 95 - i * 22, 4);
      }
      const lb = document.createElement('label'); lb.textContent = L.name;
      sw.appendChild(cv); sw.appendChild(lb);
      sw.onclick = () => SS.ui.applyLayout(L.id);
      g.appendChild(sw);
    });
  })();

  /* ---- Farben aus dem Bild ---- */
  const palBtn = $('palFromImage');
  if (palBtn) palBtn.onclick = () => {
    const cols = SS.paletteFromCanvas ? SS.paletteFromCanvas() : [];
    if (!cols.length) return SS.toast('Keine Farben gefunden', 2200, 'warn');
    cols.forEach(c => SS.addPaletteColor && SS.addPaletteColor(c));
    const box = $('palPreview');
    box.innerHTML = '';
    cols.forEach(hex => {
      const b = document.createElement('button');
      b.className = 'pal-big'; b.style.background = hex; b.title = hex;
      b.onclick = () => {
        const sel = SS.getSel();
        if (sel && sel.type === 'text') { sel.color = hex; SS.pushHistory('Farbe'); SS.ui.showProps(); SS.requestRender(); }
        else if (sel && sel.type === 'sticker') { sel.color = hex; SS.pushHistory('Farbe'); SS.ui.showProps(); SS.requestRender(); }
        else SS.toast('Farbe gemerkt: ' + hex, 2000, 'ok');
      };
      box.appendChild(b);
    });
    SS.toast(`${cols.length} Hauptfarben übernommen`, 2600, 'ok');
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
        st.elements.push(SS.normalizeEl({
          id: SS.uid(), type: 'sticker', kind, cat: def.cat,
          x: W * (0.15 + 0.35 * i), y: H * (i % 2 ? 0.85 : 0.12),
          rot: (i % 2 ? -8 : 8), s: def.ar ? 300 : 130,
          color: tpl.tcolor, opacity: 0.85, anim: def.anim || 'none',
        }));
      });
    }
    if (st.elements.some(e => e.type === 'photo')) autoLayout(3);
    SS.bgCacheInvalidate(); SS.pushHistory(); SS.requestRender();
    SS.toast(`Vorlage „${tpl.name}" angewendet`);
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
    if (SS.clip) SS.clipClear(true);
    st.elements = []; SS.clearSel();
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
    SS._noAnim = true;
    try { SS.paintScene(c, W, H, { forExport: true }); } finally { SS._noAnim = false; }
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
    SS.normalizeAll();
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

  $('propsClose').onclick = () => { SS.clearSel(); SS.ui.showProps(); SS.requestRender(); };
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
    const ids = st.selectedIds.slice();
    if (!ids.length) return;
    st.elements = st.elements.filter(e => ids.indexOf(e.id) < 0);
    SS.clearSel();
    SS.buzz(14);
    SS.pushHistory(ids.length > 1 ? `${ids.length} Elemente gelöscht` : 'Element gelöscht');
    SS.ui.showProps(); SS.requestRender();
  };

  SS.ui.dupSel = function () {
    const list = SS.getSelAll();
    if (!list.length) return;
    const gidMap = {};
    const copies = list.map(sel => {
      const cp = JSON.parse(JSON.stringify(sel));
      cp.id = SS.uid();
      cp.x += 60; cp.y += 40;                     // sichtbar versetzt, nicht exakt darüber
      if (cp.gid) { gidMap[sel.gid] = gidMap[sel.gid] || SS.gid(); cp.gid = gidMap[sel.gid]; }
      return cp;
    });
    copies.forEach(cp => st.elements.push(cp));
    SS.setSelMany(copies.map(c => c.id));
    SS.buzz();
    SS.pushHistory('Dupliziert'); SS.ui.showProps(); SS.requestRender();
  };

  function reorder(dir) {
    const ids = st.selectedIds;
    if (!ids.length) return;
    const idx = st.elements.map((e, i) => ({ e, i })).filter(o => ids.indexOf(o.e.id) >= 0);
    if (!idx.length) return;
    if (dir > 0) {
      for (let k = idx.length - 1; k >= 0; k--) {
        const i = st.elements.indexOf(idx[k].e);
        if (i < st.elements.length - 1 && ids.indexOf(st.elements[i + 1].id) < 0) {
          st.elements.splice(i, 1); st.elements.splice(i + 1, 0, idx[k].e);
        }
      }
    } else {
      for (let k = 0; k < idx.length; k++) {
        const i = st.elements.indexOf(idx[k].e);
        if (i > 0 && ids.indexOf(st.elements[i - 1].id) < 0) {
          st.elements.splice(i, 1); st.elements.splice(i - 1, 0, idx[k].e);
        }
      }
    }
    SS.pushHistory('Ebene verschoben');
    SS.ui.refreshLayers && SS.ui.refreshLayers();
    SS.requestRender();
  }

  /* ---------- Gruppieren ---------- */
  SS.ui.groupSel = function () {
    const list = SS.getSelAll();
    if (list.length < 2) return SS.toast('Mindestens zwei Elemente auswählen', 2200, 'warn');
    const g = SS.gid();
    list.forEach(e => { e.gid = g; });
    SS.buzz(12);
    SS.pushHistory('Gruppiert'); SS.ui.showProps(); SS.requestRender();
    SS.toast(`${list.length} Elemente gruppiert`, 2000, 'ok');
    SS.ui.refreshLayers && SS.ui.refreshLayers();
  };
  SS.ui.ungroupSel = function () {
    const list = SS.getSelAll().filter(e => e.gid);
    if (!list.length) return SS.toast('Keine Gruppe ausgewählt', 2000, 'warn');
    list.forEach(e => { delete e.gid; });
    SS.pushHistory('Gruppierung aufgehoben'); SS.ui.showProps(); SS.requestRender();
    SS.toast('Gruppierung aufgehoben', 2000, 'ok');
    SS.ui.refreshLayers && SS.ui.refreshLayers();
  };

  SS.ui.toggleLasso = function () {
    SS.lassoMode = !SS.lassoMode;
    if (SS.lassoMode && SS.panMode) SS.ui.setHand(false, true);   // beide zusammen geht nicht
    const b = $('btnLasso');
    if (b) b.classList.toggle('active', SS.lassoMode);
    SS.toast(SS.lassoMode ? 'Lasso an – zieh ein Rechteck über die Elemente' : 'Lasso aus', 2200);
  };

  /* Hand-Modus: die Leinwand verschieben, ohne aus Versehen ein Foto
     oder einen Sticker mitzunehmen. Am Rechner zusätzlich mit der Leertaste. */
  SS.ui.setHand = function (an, still) {
    SS.panMode = !!an;
    if (SS.panMode && SS.lassoMode) {
      SS.lassoMode = false;
      const l = $('btnLasso'); if (l) l.classList.remove('active');
    }
    const b = $('btnHand');
    if (b) b.classList.toggle('active', SS.panMode);
    document.body.classList.toggle('hand-mode', SS.panMode);
    if (!still) {
      SS.buzz && SS.buzz();
      SS.toast(SS.panMode
        ? 'Hand an – ziehen verschiebt nur die Leinwand'
        : 'Hand aus – Elemente lassen sich wieder bewegen', 2200);
    }
  };
  SS.ui.toggleHand = function () { SS.ui.setHand(!SS.panMode); };

  let boundaryWarned = false;
  SS.ui.warnBoundary = function (bad) {
    if (bad && !boundaryWarned) {
      boundaryWarned = true;
      SS.toast('Der Text liegt über einer Schnittkante – er wird beim Wischen zerschnitten!', 3500);
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
      SS.pickMode = (hex) => {
        inp.value = hex; fn(hex);
        SS.addPaletteColor && SS.addPaletteColor(hex);
        SS.pushHistory('Farbe aufgenommen'); SS.ui.showProps();
      };
      SS.toast('Tippe auf die Leinwand, um eine Farbe aufzunehmen');
      if (isMobile()) props.classList.add('mini');
    };
    d.appendChild(pick);
    // Farbmerker
    if (SS.palette && SS.palette.length) {
      const pal = document.createElement('div');
      pal.className = 'pal-row';
      SS.palette.slice(0, 6).forEach(hex => {
        const s = document.createElement('button');
        s.className = 'pal-dot';
        s.style.background = hex;
        s.title = hex;
        s.onclick = () => { inp.value = hex; fn(hex); SS.pushHistory('Farbe'); SS.requestRender(); };
        pal.appendChild(s);
      });
      d.appendChild(pal);
    }
    return d;
  }
  function nudgeRow() {
    const d = document.createElement('div'); d.className = 'nudge-row';
    [['←', -10, 0], ['↑', 0, -10], ['↓', 0, 10], ['→', 10, 0]].forEach(([t, dx, dy]) => {
      const b = document.createElement('button');
      b.textContent = t;
      b.onclick = () => {
        SS.getSelAll().filter(e => !e.locked).forEach(e => { e.x += dx; e.y += dy; });
        SS.requestRender();
      };
      b.addEventListener('pointerup', () => SS.pushHistory('Verschoben'));
      d.appendChild(b);
    });
    return d;
  }

  /* Umschalter-Zeile: Sperren, Ausblenden, Seitenverhältnis */
  function toggleRow(sel) {
    const d = document.createElement('div'); d.className = 'chips toggle-row';
    const mk = (label, on, fn) => {
      const b = document.createElement('button');
      b.textContent = label;
      if (on) b.classList.add('sel');
      b.onclick = () => { fn(); SS.pushHistory('Umgeschaltet'); SS.ui.showProps(); SS.ui.refreshLayers && SS.ui.refreshLayers(); SS.requestRender(); };
      d.appendChild(b);
    };
    const list = SS.getSelAll();
    mk(sel.locked ? 'Gesperrt' : 'Frei', sel.locked, () => {
      const v = !sel.locked; list.forEach(e => { e.locked = v; });
    });
    mk(sel.hidden ? 'Versteckt' : 'Sichtbar', sel.hidden, () => {
      const v = !sel.hidden; list.forEach(e => { e.hidden = v; });
    });
    mk(SS.arLock ? 'Seitenverhältnis' : 'Frei verzerren', SS.arLock, () => { SS.arLock = !SS.arLock; });
    if ((sel.scaleX || 1) !== 1 || (sel.scaleY || 1) !== 1) {
      mk('↺ Verzerrung zurück', false, () => { list.forEach(e => { e.scaleX = 1; e.scaleY = 1; }); });
    }
    return d;
  }

  /* Eigenschaften bei Mehrfachauswahl */
  function multiProps(list) {
    $('propsTitle').textContent = `${list.length} Elemente`;
    body.appendChild(nudgeRow());

    body.appendChild(h4('Gruppe'));
    const gr = document.createElement('div'); gr.className = 'chips';
    const gb = document.createElement('button'); gb.textContent = 'Gruppieren';
    gb.onclick = () => SS.ui.groupSel();
    const ub = document.createElement('button'); ub.textContent = 'Auflösen';
    ub.onclick = () => SS.ui.ungroupSel();
    gr.appendChild(gb); gr.appendChild(ub);
    body.appendChild(gr);

    body.appendChild(h4('Ausrichten'));
    const alignDefs = [
      ['⇤ Links', b => e => e.x += b.x0 - SS.boundsOf([e]).x0],
      ['↔ Mitte', b => e => e.x += b.cx - SS.boundsOf([e]).cx],
      ['⇥ Rechts', b => e => e.x += b.x1 - SS.boundsOf([e]).x1],
      ['⤒ Oben', b => e => e.y += b.y0 - SS.boundsOf([e]).y0],
      ['↕ Mitte', b => e => e.y += b.cy - SS.boundsOf([e]).cy],
      ['⤓ Unten', b => e => e.y += b.y1 - SS.boundsOf([e]).y1],
    ];
    const ar = document.createElement('div'); ar.className = 'chips';
    alignDefs.forEach(([name, maker]) => {
      const b = document.createElement('button'); b.textContent = name;
      b.onclick = () => {
        const bounds = SS.boundsOf(list);
        const fn = maker(bounds);
        list.filter(e => !e.locked).forEach(fn);
        SS.pushHistory('Ausgerichtet'); SS.requestRender();
      };
      ar.appendChild(b);
    });
    body.appendChild(ar);

    const dr = document.createElement('div'); dr.className = 'chips';
    [['⇹ Waagerecht verteilen', 'x'], ['⇳ Senkrecht verteilen', 'y']].forEach(([name, axis]) => {
      const b = document.createElement('button'); b.textContent = name;
      b.onclick = () => {
        const s = list.slice().sort((a, c) => a[axis] - c[axis]);
        if (s.length < 3) return SS.toast('Mindestens drei Elemente nötig', 2200, 'warn');
        const first = s[0][axis], last = s[s.length - 1][axis];
        s.forEach((e, i) => { if (!e.locked) e[axis] = first + (last - first) * i / (s.length - 1); });
        SS.pushHistory('Verteilt'); SS.requestRender();
      };
      dr.appendChild(b);
    });
    body.appendChild(dr);

    body.appendChild(h4('Gemeinsam'));
    body.appendChild(ctlRange('Deckkraft', (list[0].opacity ?? 1) * 100, 5, 100, 1,
      v => { list.forEach(e => { e.opacity = v / 100; }); SS.requestRender(); }));
    body.appendChild(ctlRange('Drehung', list[0].rot || 0, -180, 180, 1,
      v => { list.forEach(e => { e.rot = v; }); SS.requestRender(); }));

    const photos = list.filter(e => e.type === 'photo');
    if (photos.length) {
      body.appendChild(h4(`Filter für ${photos.length} Fotos`));
      body.appendChild(chips(SS.FILTER_PRESETS, () => false, p => {
        photos.forEach(el => {
          el.filter = Object.assign(SS.defaultFilter(), p.f, { preset: p.id });
          SS.photoCacheClear(el.id); SS.invalidateEl(el);
        });
        SS.requestRender();
        SS.toast(`Filter auf ${photos.length} Fotos angewendet`, 2200, 'ok');
      }));
      body.appendChild(h4(`Rahmen für ${photos.length} Fotos`));
      body.appendChild(chips(SS.FRAMES, () => false, f => {
        photos.forEach(el => { el.frame.style = f.id; SS.invalidateEl(el); });
        SS.requestRender();
        SS.toast(`Rahmen auf ${photos.length} Fotos angewendet`, 2200, 'ok');
      }));
    }

    const texts = list.filter(e => e.type === 'text');
    if (texts.length > 1) {
      body.appendChild(h4(`${texts.length} Textfelder`));
      body.appendChild(ctlSelect('Schriftart', texts[0].font, SS.FONTS.map(f => [f, f]),
        v => { texts.forEach(t => { t.font = v; }); SS.requestRender(); }));
      body.appendChild(ctlColor('Farbe', texts[0].color, v => { texts.forEach(t => { t.color = v; }); SS.requestRender(); }));
    }

    body.appendChild(h4('Sichtbarkeit'));
    body.appendChild(toggleRow(list[list.length - 1]));

    // Animation für alle Ausgewählten auf einmal
    const gleich = list.every(e => e.type === list[0].type);
    body.appendChild(h4('Animation für alle'));
    const aGruppen = SS.ANIM_GROUPS.filter(g => !g.textOnly || (gleich && list[0].type === 'text'));
    if (!aGruppen.some(g => g.id === _animGroup)) _animGroup = aGruppen[0].id;
    const aTabs = document.createElement('div'); aTabs.className = 'subtabs anim-tabs';
    aGruppen.forEach(g => {
      const b = document.createElement('button');
      b.textContent = g.name;
      if (g.id === _animGroup) b.classList.add('active');
      b.onclick = () => { _animGroup = g.id; SS.ui.showProps(); };
      aTabs.appendChild(b);
    });
    body.appendChild(aTabs);
    const aOff = document.createElement('button');
    aOff.className = 'wide anim-off';
    aOff.textContent = '✕ Animation bei allen entfernen';
    aOff.onclick = () => {
      list.forEach(e => { e.anim = 'none'; });
      SS.pushHistory('Animation entfernt'); SS.ui.showProps(); SS.requestRender();
    };
    body.appendChild(aOff);
    const aList = document.createElement('div'); aList.className = 'chips anim-list';
    SS.ANIMS.filter(a => a.group === _animGroup).forEach(a => {
      const b = document.createElement('button');
      b.textContent = a.name;
      b.title = a.desc || '';
      b.onclick = () => {
        list.forEach((e, i) => {
          SS.animDefaults(e);
          e.anim = a.id;
          e.animPhase = (i % 6) * 0.2;      // leichter Versatz wirkt lebendiger
        });
        SS.pushHistory('Animation'); SS.ui.showProps(); SS.requestRender();
        SS.toast(`„${a.name}" auf ${list.length} Elemente gelegt`, 2400, 'ok');
      };
      aList.appendChild(b);
    });
    body.appendChild(aList);
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

  /* ---------- Animationen: gilt für Foto, Text, Sticker und Emoji ---------- */
  let _animGroup = 'bounce';
  function animSection(sel) {
    SS.animDefaults(sel);
    const cur = sel.anim || 'none';
    const curDef = SS.ANIM_BY_ID[cur];
    if (curDef && curDef.group) _animGroup = curDef.group;

    body.appendChild(h4('Animation'));

    const off = document.createElement('button');
    off.className = 'wide anim-off' + (cur === 'none' ? ' sel' : '');
    off.textContent = cur === 'none' ? '✓ Keine Animation' : '✕ Animation entfernen';
    off.onclick = () => { sel.anim = 'none'; SS.pushHistory(); SS.ui.showProps(); SS.requestRender(); };
    body.appendChild(off);

    const gruppen = SS.ANIM_GROUPS.filter(g => !g.textOnly || sel.type === 'text');
    if (!gruppen.some(g => g.id === _animGroup)) _animGroup = gruppen[0].id;
    const tabs = document.createElement('div');
    tabs.className = 'subtabs anim-tabs';
    gruppen.forEach(g => {
      const b = document.createElement('button');
      b.textContent = g.name;
      if (g.id === _animGroup) b.classList.add('active');
      b.onclick = () => { _animGroup = g.id; SS.ui.showProps(); };
      tabs.appendChild(b);
    });
    body.appendChild(tabs);
    if (_animGroup === 'text') {
      const h = document.createElement('p');
      h.className = 'hint';
      h.textContent = 'Diese Animationen bewegen jeden Buchstaben einzeln – wie in Video-Apps.';
      body.appendChild(h);
    }

    /* Kacheln mit laufender Vorschau statt bloßer Namen –
       man sieht die Bewegung, bevor man sie auswählt. */
    const list = document.createElement('div');
    list.className = 'anim-grid';
    SS.ANIMS.filter(a => a.group === _animGroup).forEach(a => {
      const b = document.createElement('button');
      b.className = 'anim-kachel' + (a.id === cur ? ' sel' : '');
      b.title = a.desc || '';
      const cv = document.createElement('canvas');
      cv.width = 108; cv.height = 108;
      cv.dataset.anim = a.id;
      cv.dataset.typ = sel.type;
      b.appendChild(cv);
      const lb = document.createElement('span');
      lb.textContent = a.name;
      b.appendChild(lb);
      b.onclick = () => { sel.anim = a.id; SS.pushHistory(); SS.ui.showProps(); SS.requestRender(); };
      list.appendChild(b);
    });
    body.appendChild(list);
    SS.animPreviewStart && SS.animPreviewStart(list);

    if (cur !== 'none') {
      const d = document.createElement('p');
      d.className = 'hint anim-desc';
      d.textContent = (curDef && curDef.desc) ? curDef.desc : '';
      body.appendChild(d);
      body.appendChild(ctlRange('Tempo', Math.round(sel.animSpeed * 100), 20, 300, 5,
        v => { sel.animSpeed = v / 100; SS.requestRender(); }));
      body.appendChild(ctlRange('Stärke', sel.animAmp, 10, 250, 5,
        v => { sel.animAmp = v; SS.requestRender(); }));
      body.appendChild(ctlRange('Versatz', (sel.animPhase || 0) * 10, 0, 40, 1,
        v => { sel.animPhase = v / 10; SS.requestRender(); }));
      if (curDef && curDef.group === 'glow') {
        body.appendChild(ctlColor('Leucht-Farbe', sel.animGlowColor || sel.color || '#ffd9a0',
          v => { sel.animGlowColor = v; SS.requestRender(); }));
      }
      const all = document.createElement('button');
      all.className = 'wide';
      all.textContent = 'Auf alle gleichartigen Elemente übertragen';
      all.onclick = () => {
        let n = 0;
        for (const el of st.elements) {
          if (el.type === sel.type && el.id !== sel.id) {
            el.anim = sel.anim; el.animSpeed = sel.animSpeed;
            el.animAmp = sel.animAmp; el.animGlowColor = sel.animGlowColor;
            el.animPhase = (n % 5) * 0.22;   // leichter Versatz = lebendiger
            n++;
          }
        }
        SS.pushHistory(); SS.requestRender();
        SS.toast(n ? `✓ Animation auf ${n} Elemente übertragen` : 'Keine weiteren Elemente dieser Art');
      };
      body.appendChild(all);
    }

    const p = document.createElement('p');
    p.className = 'hint';
    p.textContent = 'Animationen laufen live auf der Leinwand und werden im Video-Export mitgerendert. Der Bilder-Export bleibt scharf und statisch.';
    body.appendChild(p);
  }

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
    const all = SS.getSelAll();
    if (all.length > 1) { multiProps(all); return; }

    const titles = { photo: 'Foto', text: 'Text', sticker: 'Sticker', emoji: 'Emoji', blur: 'Bereich' };
    $('propsTitle').textContent = (titles[sel.type] || 'Element') + (sel.gid ? ' · Gruppe' : '');

    body.appendChild(nudgeRow());
    body.appendChild(toggleRow(sel));
    if (sel.gid) {
      const ug = document.createElement('button');
      ug.className = 'wide';
      ug.textContent = 'Gruppierung aufheben';
      ug.onclick = () => SS.ui.ungroupSel();
      body.appendChild(ug);
    }

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

      body.appendChild(h4('Freisteller'));
      const cutB = document.createElement('button');
      cutB.className = 'wide primary';
      cutB.textContent = sel.cutout ? 'Freisteller nachbessern' : 'Hintergrund entfernen';
      cutB.onclick = () => SS.cutout.open(sel);
      body.appendChild(cutB);
      if (sel.imgIdOrig) {
        const revB = document.createElement('button');
        revB.className = 'wide';
        revB.textContent = '↺ Originalfoto zurückholen';
        revB.onclick = () => SS.cutout.revert(sel);
        body.appendChild(revB);
      }
      const cutHint = document.createElement('p');
      cutHint.className = 'hint';
      cutHint.textContent = 'Läuft komplett auf deinem Gerät. Am besten bei ruhigem, einfarbigem Hintergrund – nachbessern geht mit Pinsel.';
      body.appendChild(cutHint);

      body.appendChild(h4('Zuschnitt'));
      const cropB = document.createElement('button');
      cropB.className = 'wide primary';
      cropB.textContent = 'Zuschneiden, drehen, begradigen';
      cropB.onclick = () => SS.crop.open(sel);
      body.appendChild(cropB);
      if (sel.crop && sel.crop.rect) {
        const cInfo = document.createElement('p');
        cInfo.className = 'hint';
        cInfo.textContent = `Ausschnitt: ${Math.round(sel.crop.rect.w)}×${Math.round(sel.crop.rect.h)} px` +
          (sel.crop.rot90 ? ` · ${sel.crop.rot90}° gedreht` : '') +
          (sel.crop.angle ? ` · ${sel.crop.angle}° begradigt` : '');
        body.appendChild(cInfo);
        const cRes = document.createElement('button');
        cRes.className = 'wide';
        cRes.textContent = '↺ Zuschnitt zurücksetzen';
        cRes.onclick = () => {
          sel.crop = { zoom: 1, ox: 0, oy: 0 };
          SS.photoCacheClear(sel.id); SS.invalidateEl(sel);
          SS.pushHistory('Zuschnitt zurückgesetzt'); SS.ui.showProps(); SS.requestRender();
        };
        body.appendChild(cRes);
      }

      body.appendChild(h4('Allgemein'));
      const repl = document.createElement('label');
      repl.className = 'wide btn-like';
      repl.textContent = 'Foto ersetzen (Einstellungen bleiben)';
      const rin = document.createElement('input');
      rin.type = 'file'; rin.accept = 'image/*'; rin.className = 'file-overlay';
      rin.addEventListener('change', async (e) => {
        const f = e.target.files[0];
        if (!f) return;
        try {
          const rec = await SS.loadImageFile(f);
          const id = 'img' + Date.now();
          SS.images[id] = rec;
          sel.imgId = id;
          delete sel.imgIdOrig; sel.cutout = false;
          if (sel.crop) sel.crop = { zoom: 1, ox: 0, oy: 0 };
          SS.photoCacheClear(sel.id); SS.invalidateEl(sel);
          addShelfThumb(id, rec.dataURL);
          SS.pushHistory('Foto ersetzt'); SS.ui.showProps(); SS.requestRender();
          SS.toast('Foto ersetzt – Rahmen, Filter und Position bleiben', 2800, 'ok');
        } catch (err) { SS.toast('Foto konnte nicht geladen werden', 2600, 'err'); }
        e.target.value = '';
      });
      repl.appendChild(rin);
      body.appendChild(repl);
      const flipB = document.createElement('button'); flipB.className = 'wide'; flipB.textContent = '↔️ Spiegeln';
      flipB.onclick = () => { sel.flip = !sel.flip; SS.photoCacheClear(sel.id); SS.invalidateEl(sel); SS.pushHistory(); SS.requestRender(); };
      body.appendChild(flipB);
      const copyB = document.createElement('button'); copyB.className = 'wide';
      copyB.textContent = 'Stil auf alle Fotos übertragen';
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
      animSection(sel);
    }

    if (sel.type === 'text') {
      const ta = document.createElement('textarea');
      ta.value = sel.content;
      ta.addEventListener('input', () => { sel.content = ta.value; SS.requestRender(); });
      ta.addEventListener('change', () => SS.pushHistory());
      body.appendChild(ta);
      body.appendChild(h4('Schrift'));
      body.appendChild(ctlFont(sel.font, v => { sel.font = v; SS.requestRender(); }));
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
      body.appendChild(styleRow);
      body.appendChild(ctlSelect('Ausrichtung', sel.align, [['center', 'Zentriert'], ['left', 'Links'], ['right', 'Rechts']], v => { sel.align = v; SS.requestRender(); }));
      body.appendChild(ctlRange('Buchstabenabst.', sel.letterSpacing, -3, 30, 0.5, v => { sel.letterSpacing = v; SS.requestRender(); }));
      body.appendChild(ctlRange('Zeilenhöhe', sel.lineHeight * 100, 90, 220, 5, v => { sel.lineHeight = v / 100; SS.requestRender(); }));

      body.appendChild(h4('Füllung'));
      body.appendChild(chips([
        { id: 'none', name: 'Einfarbig' }, { id: 'gold', name: 'Gold' },
        { id: 'neon', name: 'Neon' }, { id: '3d', name: '3D' },
      ], e => (sel.fill || 'none') === e.id, e => { sel.fill = e.id; SS.requestRender(); }));

      body.appendChild(h4('Kontur, Schatten & Leuchten'));
      const fxRow = document.createElement('div'); fxRow.className = 'chips';
      const fxBtn = (name, get, set) => {
        const b = document.createElement('button'); b.textContent = name;
        if (get()) b.classList.add('sel');
        b.onclick = () => { set(); SS.pushHistory('Texteffekt'); SS.ui.showProps(); SS.requestRender(); };
        fxRow.appendChild(b);
      };
      fxBtn('Kontur', () => sel.outline, () => sel.outline = !sel.outline);
      fxBtn('Schatten', () => sel.shadow, () => sel.shadow = !sel.shadow);
      fxBtn('Leuchten', () => sel.glow, () => sel.glow = !sel.glow);
      fxBtn('Nur Kontur', () => sel.hollow, () => sel.hollow = !sel.hollow);
      body.appendChild(fxRow);
      const fxHint = document.createElement('p'); fxHint.className = 'hint';
      fxHint.textContent = 'Alles frei kombinierbar – Kontur, Schatten und Leuchten gleichzeitig.';
      body.appendChild(fxHint);

      if (sel.outline) {
        body.appendChild(ctlColor('Konturfarbe', sel.outlineColor, v => { sel.outlineColor = v; SS.requestRender(); }));
        body.appendChild(ctlRange('Konturbreite', sel.outlineWidth, 1, 30, 1, v => { sel.outlineWidth = v; SS.requestRender(); }));
      }
      if (sel.shadow) {
        body.appendChild(ctlColor('Schattenfarbe', sel.shadowColor, v => { sel.shadowColor = v; SS.requestRender(); }));
        body.appendChild(ctlRange('Weichheit', sel.shadowBlur, 0, 60, 1, v => { sel.shadowBlur = v; SS.requestRender(); }));
        body.appendChild(ctlRange('Versatz ↔', sel.shadowX, -30, 30, 1, v => { sel.shadowX = v; SS.requestRender(); }));
        body.appendChild(ctlRange('Versatz ↕', sel.shadowY, -30, 30, 1, v => { sel.shadowY = v; SS.requestRender(); }));
      }
      if (sel.glow) {
        body.appendChild(ctlColor('Leuchtfarbe', sel.glowColor, v => { sel.glowColor = v; SS.requestRender(); }));
        body.appendChild(ctlRange('Leuchtstärke', sel.glowStrength, 5, 120, 1, v => { sel.glowStrength = v; SS.requestRender(); }));
      }

      body.appendChild(h4('Bogen'));
      body.appendChild(ctlRange('Krümmung', sel.curve || 0, -100, 100, 1, v => { sel.curve = v; SS.requestRender(); }));
      const arcRow = document.createElement('div'); arcRow.className = 'chips';
      [['◠ Nach oben', 60], ['◡ Nach unten', -60], ['○ Kreis', 100], ['— Gerade', 0]].forEach(([n, v]) => {
        const b = document.createElement('button'); b.textContent = n;
        b.onclick = () => { sel.curve = v; SS.pushHistory('Bogen'); SS.ui.showProps(); SS.requestRender(); };
        arcRow.appendChild(b);
      });
      body.appendChild(arcRow);

      body.appendChild(h4('Schnittkante'));
      const cutRow = document.createElement('div'); cutRow.className = 'chips';
      const mirrorB = document.createElement('button');
      mirrorB.textContent = '↔ An Kante spiegeln';
      mirrorB.title = 'Klappt den Text auf die andere Seite der nächsten Schnittkante';
      mirrorB.onclick = () => { SS.ui.mirrorAtCut(sel); };
      const moveB = document.createElement('button');
      moveB.textContent = 'Automatisch verschieben';
      moveB.title = 'Schiebt den Text vollständig in eine Slide';
      moveB.onclick = () => { SS.ui.moveOffCut(sel); };
      cutRow.appendChild(mirrorB); cutRow.appendChild(moveB);
      body.appendChild(cutRow);

      body.appendChild(h4('Text-Hintergrund'));
      body.appendChild(ctlSelect('Stil', sel.bgStyle, [
        ['none', 'Keiner'], ['label', 'Insta-Label'], ['pill', 'Pill'], ['card', 'Karte'],
        ['glass', 'Milchglas'], ['marker', 'Highlighter'], ['sticky', 'Notizzettel'],
        ['ribbon', 'Banner'], ['torn', 'Gerissen'], ['stamp', 'Stempel'],
        ['kreis', 'Marker-Kreis'], ['underline', 'Unterstrichen'],
      ], v => { sel.bgStyle = v; SS.requestRender(); }));
      body.appendChild(ctlColor('BG-Farbe', sel.bgColor, v => { sel.bgColor = v; SS.requestRender(); }));
      body.appendChild(ctlRange('BG-Deckkraft', sel.bgAlpha * 100, 10, 100, 1, v => { sel.bgAlpha = v / 100; SS.requestRender(); }));

      const cpT = document.createElement('button');
      cpT.className = 'wide';
      cpT.textContent = 'Text-Stil auf alle Texte übertragen';
      cpT.onclick = () => {
        const keys = ['font', 'size', 'color', 'bold', 'italic', 'align', 'letterSpacing', 'lineHeight',
          'fill', 'hollow', 'outline', 'outlineColor', 'outlineWidth', 'shadow', 'shadowColor',
          'shadowBlur', 'shadowX', 'shadowY', 'glow', 'glowColor', 'glowStrength',
          'bgStyle', 'bgColor', 'bgAlpha', 'curve'];
        let n = 0;
        for (const el of st.elements) {
          if (el.type === 'text' && el.id !== sel.id) { keys.forEach(k => { el[k] = sel[k]; }); n++; }
        }
        SS.pushHistory('Text-Stil übertragen'); SS.requestRender();
        SS.toast(n ? `Stil auf ${n} Textfelder übertragen` : 'Keine weiteren Textfelder', 2400, n ? 'ok' : 'warn');
      };
      body.appendChild(cpT);
      body.appendChild(ctlRange('Drehung', sel.rot, -45, 45, 0.5, v => { sel.rot = v; SS.requestRender(); }));
      animSection(sel);
    }

    if (sel.type === 'sticker') {
      body.appendChild(ctlColor('Farbe', sel.color, v => { sel.color = v; SS.requestRender(); }));
      body.appendChild(ctlRange('Größe', sel.s, 20, 1500, 5, v => { sel.s = v; SS.requestRender(); }));
      body.appendChild(ctlRange('Deckkraft', (sel.opacity ?? 1) * 100, 5, 100, 1, v => { sel.opacity = v / 100; SS.requestRender(); }));
      body.appendChild(ctlRange('Drehung', sel.rot, -180, 180, 1, v => { sel.rot = v; SS.requestRender(); }));

      body.appendChild(h4('Schnittkanten'));
      const edgeRow = document.createElement('div'); edgeRow.className = 'chips';
      const e1 = document.createElement('button');
      e1.textContent = '⇲ Auf nächste Kante';
      e1.title = 'Setzt den Sticker mittig auf die nächste Schnittkante – hält das Panorama zusammen';
      e1.onclick = () => SS.ui.snapToCut(sel);
      const e2 = document.createElement('button');
      e2.textContent = '⋮⋮ Auf alle Kanten';
      e2.title = 'Kopiert den Sticker auf jede Schnittkante';
      e2.onclick = () => SS.ui.spreadOnCuts(sel);
      edgeRow.appendChild(e1); edgeRow.appendChild(e2);
      body.appendChild(edgeRow);

      animSection(sel);
    }
    if (sel.type === 'emoji') {
      body.appendChild(ctlRange('Größe', sel.s, 30, 1200, 5, v => { sel.s = v; SS.requestRender(); }));
      body.appendChild(ctlRange('Deckkraft', (sel.opacity ?? 1) * 100, 5, 100, 1, v => { sel.opacity = v / 100; SS.requestRender(); }));
      body.appendChild(ctlRange('Drehung', sel.rot, -180, 180, 1, v => { sel.rot = v; SS.requestRender(); }));
      animSection(sel);
    }
    if (sel.type === 'blur') {
      body.appendChild(h4('Form'));
      body.appendChild(chips([
        { id: 'rect', name: '▭ Rechteck' }, { id: 'rounded', name: '▢ Abgerundet' },
        { id: 'ellipse', name: '◯ Ellipse' }, { id: 'heart', name: '♥ Herz' }, { id: 'star', name: '★ Stern' },
      ], f => (sel.shape || 'rect') === f.id, f => { sel.shape = f.id; SS.requestRender(); }));
      body.appendChild(h4('Wirkung'));
      const pxRow = document.createElement('div'); pxRow.className = 'chips';
      [['Weichzeichnen', false], ['Pixel', true]].forEach(([n, v]) => {
        const b = document.createElement('button'); b.textContent = n;
        if (!!sel.pixelate === v) b.classList.add('sel');
        b.onclick = () => { sel.pixelate = v; SS.pushHistory('Privacy'); SS.ui.showProps(); SS.requestRender(); };
        pxRow.appendChild(b);
      });
      body.appendChild(pxRow);
      body.appendChild(ctlRange(sel.pixelate ? 'Blockgröße' : 'Stärke', sel.strength, 4, 80, 1, v => { sel.strength = v; SS.requestRender(); }));
      body.appendChild(ctlRange('Breite', sel.w, 40, 2000, 5, v => { sel.w = v; SS.requestRender(); }));
      body.appendChild(ctlRange('Höhe', sel.h, 40, 2000, 5, v => { sel.h = v; SS.requestRender(); }));
      body.appendChild(ctlRange('Drehung', sel.rot, -90, 90, 1, v => { sel.rot = v; SS.requestRender(); }));
      const p = document.createElement('p'); p.className = 'hint';
      p.textContent = 'Der Bereich verwischt alles, was darunter liegt – perfekt für Gesichter oder Namen.';
      body.appendChild(p);
    }
  };

  /* ================= Schnittkanten-Werkzeuge ================= */
  function nearestCut(x) {
    const { slideW, n } = SS.canvasSize();
    if (n < 2) return null;
    let best = null, bd = Infinity;
    for (let i = 1; i < n; i++) {
      const bx = i * slideW;
      const d = Math.abs(x - bx);
      if (d < bd) { bd = d; best = bx; }
    }
    return best;
  }

  /* Text auf die andere Seite der nächsten Schnittkante klappen */
  SS.ui.mirrorAtCut = function (el) {
    const bx = nearestCut(el.x);
    if (bx === null) return SS.toast('Es gibt nur eine Slide', 2200, 'warn');
    el.x = bx * 2 - el.x;
    SS.pushHistory('An Kante gespiegelt'); SS.requestRender();
    SS.toast('Text gespiegelt', 1800, 'ok');
  };

  /* Text vollständig in eine Slide schieben */
  SS.ui.moveOffCut = function (el) {
    const { slideW, n } = SS.canvasSize();
    const { w } = SS.elSize(el);
    if (n < 2) return SS.toast('Es gibt nur eine Slide', 2200, 'warn');
    const bx = nearestCut(el.x);
    if (bx === null || Math.abs(el.x - bx) > w / 2) return SS.toast('Der Text liegt bereits sauber', 2200, 'ok');
    const pad = 24;
    const leftTarget = bx - w / 2 - pad;
    const rightTarget = bx + w / 2 + pad;
    el.x = Math.abs(el.x - leftTarget) < Math.abs(el.x - rightTarget) ? leftTarget : rightTarget;
    el.x = SS.clamp(el.x, w / 2 + pad, SS.canvasSize().W - w / 2 - pad);
    void slideW;
    SS.pushHistory('Von Kante weggeschoben'); SS.requestRender();
    SS.toast('Text liegt jetzt in einer Slide', 2200, 'ok');
  };

  /* Sticker mittig auf die nächste Schnittkante setzen */
  SS.ui.snapToCut = function (el) {
    const bx = nearestCut(el.x);
    if (bx === null) return SS.toast('Es gibt nur eine Slide', 2200, 'warn');
    el.x = bx;
    SS.buzz();
    SS.pushHistory('Auf Schnittkante'); SS.requestRender();
    SS.toast('Sticker sitzt auf der Schnittkante', 2200, 'ok');
  };

  /* Sticker auf alle Schnittkanten verteilen */
  SS.ui.spreadOnCuts = function (el) {
    const { slideW, n } = SS.canvasSize();
    if (n < 2) return SS.toast('Es gibt nur eine Slide', 2200, 'warn');
    el.x = slideW;
    const made = [];
    for (let i = 2; i < n; i++) {
      const cp = JSON.parse(JSON.stringify(el));
      cp.id = SS.uid();
      cp.x = i * slideW;
      cp.animPhase = (i % 5) * 0.25;
      st.elements.push(cp);
      made.push(cp);
    }
    SS.pushHistory('Auf alle Kanten verteilt');
    SS.ui.showProps(); SS.requestRender();
    SS.toast(`Sticker auf ${n - 1} Schnittkanten gesetzt`, 2600, 'ok');
  };

  SS.ui.makeThumb = makeThumb;

  /* Platzhalter – layers.js und extras.js liefern die echten Fassungen */
  if (!SS.ui.toggleShortcuts) SS.ui.toggleShortcuts = function () {};
})();
