/* Seamless Studio – Export: Bilder, Panorama, mehrere Formate, Teilen, Wisch-Vorschau

   Wichtig: Es wird **Slide für Slide** gerendert, nie ein Riesen-Canvas über das
   ganze Panorama. WebKit begrenzt ein einzelnes Canvas auf 16.777.216 px² –
   ein 12-Slide-Carousel hätte diese Grenze sonst gesprengt. */

(function () {
  const $ = SS.el;
  const dlg = $('exportDlg');

  const MIMES = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  const EXTS = { jpeg: 'jpg', png: 'png', webp: 'webp' };

  /* welche Zusatzformate sind angehakt */
  const extraFormats = new Set();

  $('btnExport').onclick = () => { dlg.classList.remove('hidden'); syncInfo(); };
  $('expCancel').onclick = () => dlg.classList.add('hidden');

  $('expType').addEventListener('change', () => {
    const v = $('expType').value;
    $('expImgOpts').classList.toggle('hidden', v === 'video');
    $('expVidOpts').classList.toggle('hidden', v !== 'video');
    $('expShare').textContent = v === 'video' ? 'Video teilen → Instagram' : 'Teilen → Instagram';
    $('expPanoRow').classList.toggle('hidden', v !== 'zip');
    $('expFormatsRow').classList.toggle('hidden', v === 'video');
    syncInfo();
  });

  function setProg(p) { $('expProgress').firstElementChild.style.width = p + '%'; }

  /* ---------- Grenzprüfung und Hinweistext ---------- */
  function syncInfo() {
    const scale = +$('expScale').value;
    const { slideW, slideH, W, H, n } = SS.canvasSize();
    const slideArea = slideW * scale * slideH * scale;
    const panoArea = W * scale * H * scale;
    const info = $('expInfo');
    const parts = [];
    parts.push(`${n} Slides à ${Math.round(slideW * scale)}×${Math.round(slideH * scale)} px`);
    if (!SS.areaOk(slideW * scale, slideH * scale)) {
      parts.push('Diese Qualität ist für eine einzelne Slide zu groß – bitte niedriger wählen.');
    } else if ($('expType').value === 'zip' && $('expPano').checked && panoArea > SS.MAX_CANVAS_AREA) {
      const k = SS.fitScale(W, H, scale);
      parts.push(`Panorama wird auf ${Math.round(W * k)}×${Math.round(H * k)} px verkleinert (Gerätegrenze).`);
    }
    void slideArea;
    if (extraFormats.size) parts.push('Zusätzlich: ' + [...extraFormats].join(', '));
    info.textContent = parts.join(' · ');
    $('expGo').disabled = !SS.areaOk(slideW * scale, slideH * scale);
  }
  $('expScale').addEventListener('change', syncInfo);
  $('expPano').addEventListener('change', syncInfo);

  /* ---------- Format-Umschalter ---------- */
  (function buildFormatChips() {
    const box = $('expFormats');
    [['4:5', 'Feed 4:5'], ['1:1', 'Quadrat 1:1'], ['9:16', 'Story 9:16']].forEach(([id, name]) => {
      const b = document.createElement('button');
      b.textContent = name;
      b.onclick = () => {
        if (extraFormats.has(id)) extraFormats.delete(id); else extraFormats.add(id);
        b.classList.toggle('sel', extraFormats.has(id));
        syncInfo();
      };
      box.appendChild(b);
    });
  })();

  /* ================================================================
     Rendern
     ================================================================ */
  const toBlob = (cv, mime, q) => new Promise(r => cv.toBlob(r, mime, q));

  /* Eine einzelne Slide in ein eigenes Canvas – nie das ganze Panorama auf einmal */
  async function renderOneSlide(i, scale, mime, q) {
    const { W, H, slideW, slideH } = SS.canvasSize();
    const cv = SS.makeCanvas(slideW * scale, slideH * scale);
    const c = cv.getContext('2d');
    c.scale(scale, scale);
    c.translate(-i * slideW, 0);
    SS.paintScene(c, W, H, { forExport: true });
    const blob = await toBlob(cv, mime, q);
    SS.freeCanvas(cv);
    return blob;
  }

  /* Panorama als ein Bild – automatisch verkleinert, wenn das Gerät nicht mitmacht */
  async function renderPanorama(scale, mime, q) {
    const { W, H } = SS.canvasSize();
    const k = SS.fitScale(W, H, scale);
    const cv = SS.makeCanvas(W * k, H * k);
    const c = cv.getContext('2d');
    c.scale(k, k);
    SS.paintScene(c, W, H, { forExport: true });
    const blob = await toBlob(cv, mime, q);
    const dims = [cv.width, cv.height];
    SS.freeCanvas(cv);
    return { blob, dims, downscaled: k < scale - 0.001 };
  }

  /* Alle Slides des aktuellen Formats */
  async function renderSlides(scale, format, onProg) {
    const { n } = SS.canvasSize();
    const mime = MIMES[format] || 'image/jpeg';
    const q = format === 'png' ? undefined : 0.95;
    SS._noAnim = true;
    const blobs = [];
    try {
      for (let i = 0; i < n; i++) {
        blobs.push(await renderOneSlide(i, scale, mime, q));
        if (onProg) onProg(Math.round((i + 1) / (n + 1) * 100));
      }
    } finally { SS._noAnim = false; }
    return { blobs, n, ext: EXTS[format] || 'jpg' };
  }
  SS.renderSlides = renderSlides;

  /* ---------- Szene für ein anderes Slide-Format umrechnen ---------- */
  function withFormat(targetFmt, fn) {
    const oldFmt = SS.state.format;
    const { H: oldH } = SS.canvasSize();
    const newH = SS.SLIDE[targetFmt][1];
    const k = Math.min(1, newH / oldH);
    const backup = SS.state.elements.map(e => ({ e, x: e.x, y: e.y, h: e.h, s: e.s, size: e.size, w: e.w, hh: e.h }));
    for (const b of backup) {
      const e = b.e;
      e.y = (b.y - oldH / 2) * k + newH / 2;
      if (k !== 1) {
        if (e.type === 'photo') e.h = b.h * k;
        else if (e.type === 'text') e.size = b.size * k;
        else if (e.type === 'sticker' || e.type === 'emoji') e.s = b.s * k;
        else if (e.type === 'blur') { e.w = b.w * k; e.h = b.hh * k; }
        SS.invalidateEl(e);
      }
    }
    SS._sizeOverride = { format: targetFmt, slides: SS.canvasSize().n };
    // n aus dem ursprünglichen Zustand übernehmen (9:16 würde sonst auf 1 fallen)
    SS._sizeOverride.slides = (SS.clip && SS.clip.ready) ? 1 : SS.state.slides;
    SS.bgCacheInvalidate();
    return Promise.resolve(fn()).finally(() => {
      SS._sizeOverride = null;
      for (const b of backup) {
        const e = b.e;
        e.x = b.x; e.y = b.y;
        if (e.type === 'photo') e.h = b.h;
        else if (e.type === 'text') e.size = b.size;
        else if (e.type === 'sticker' || e.type === 'emoji') e.s = b.s;
        else if (e.type === 'blur') { e.w = b.w; e.h = b.hh; }
        SS.invalidateEl(e);
      }
      SS.state.format = oldFmt;
      SS.bgCacheInvalidate();
    });
  }

  /* ================================================================
     Herunterladen
     ================================================================ */
  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 9000);
  }

  async function buildZip(scale, format, onProg) {
    const zip = new JSZip();
    const root = zip.folder('Seamless_Carousel');
    const mime = MIMES[format] || 'image/jpeg';
    const q = format === 'png' ? undefined : 0.95;

    // aktuelles Format
    const cur = await renderSlides(scale, format, p => onProg(p * 0.55));
    const curName = SS.state.format.replace(':', '-');
    const curFolder = extraFormats.size ? root.folder(curName) : root;
    cur.blobs.forEach((b, i) => curFolder.file(`Slide_${String(i + 1).padStart(2, '0')}.${cur.ext}`, b));

    /* Beitrags-Paket (beitrag7.js): Bildunterschrift-Entwurf, Hashtags und
       Alt-Texte als Textdatei mit ins ZIP – wenn das Modul da ist. */
    if (typeof SS.beitragstext === 'function') {
      try { root.file('Beitrag.txt', SS.beitragstext()); } catch (e) {}
    }

    if ($('expPano').checked) {
      SS._noAnim = true;
      let pano;
      try { pano = await renderPanorama(scale, mime, q); } finally { SS._noAnim = false; }
      curFolder.file(`00_Panorama_${pano.dims[0]}x${pano.dims[1]}.${cur.ext}`, pano.blob);
      if (pano.downscaled) SS.toast('Panorama wurde für dieses Gerät verkleinert', 3200, 'info');
    }

    // Zusatzformate
    let done = 0;
    for (const fmt of extraFormats) {
      if (fmt === SS.state.format) { done++; continue; }
      await withFormat(fmt, async () => {
        const r = await renderSlides(scale, format);
        const f = root.folder(fmt.replace(':', '-'));
        r.blobs.forEach((b, i) => f.file(`Slide_${String(i + 1).padStart(2, '0')}.${r.ext}`, b));
      });
      done++;
      onProg(55 + Math.round(done / extraFormats.size * 30));
    }
    return zip;
  }

  $('expGo').onclick = async () => {
    const type = $('expType').value;
    try {
      $('expProgress').classList.remove('hidden');
      $('expGo').disabled = true;
      await SS.wakeOn();

      if (type === 'video') {
        SS.video.opts.dur = +$('expVidDur').value;
        const res = await SS.video.exportVideo(setProg);
        download(res.blob, 'Seamless_Video.' + res.ext);
        if (res.audioBlob) download(res.audioBlob, 'Seamless_Ton.wav');
        SS.toast('Video exportiert', 2600, 'ok');

      } else if (type === 'pano') {
        const scale = +$('expScale').value;
        const format = $('expFormat').value;
        SS._noAnim = true;
        let pano;
        try { pano = await renderPanorama(scale, MIMES[format], format === 'png' ? undefined : 0.95); }
        finally { SS._noAnim = false; }
        setProg(90);
        download(pano.blob, `Seamless_Panorama_${pano.dims[0]}x${pano.dims[1]}.${EXTS[format]}`);
        SS.toast(pano.downscaled
          ? `Panorama exportiert (auf ${pano.dims[0]}×${pano.dims[1]} verkleinert)`
          : `Panorama exportiert · ${pano.dims[0]}×${pano.dims[1]} px`, 3400, 'ok');

      } else {
        const scale = +$('expScale').value;
        const format = $('expFormat').value;
        const zip = await buildZip(scale, format, setProg);
        const zipBlob = await zip.generateAsync({ type: 'blob' }, (m) => setProg(Math.round(88 + m.percent / 9)));
        download(zipBlob, 'Seamless_Carousel.zip');
        SS.toast('Export fertig', 2600, 'ok');
        SS.buzz(16);
      }
    } catch (e) {
      SS.toast('Export fehlgeschlagen: ' + e.message, 4200, 'err');
    } finally {
      SS.wakeOff();
      $('expProgress').classList.add('hidden');
      setProg(0);
      $('expGo').disabled = false;
      dlg.classList.add('hidden');
    }
  };

  /* ================================================================
     Teilen
     ================================================================ */
  $('expShare').onclick = async () => {
    try {
      $('expProgress').classList.remove('hidden');
      $('expShare').disabled = true;
      await SS.wakeOn();
      let files;
      if ($('expType').value === 'video') {
        SS.video.opts.dur = +$('expVidDur').value;
        const res = await SS.video.exportVideo(setProg);
        files = [new File([res.blob], 'Seamless_Video.' + res.ext, { type: res.blob.type })];
        if (res.audioBlob) files.push(new File([res.audioBlob], 'Seamless_Ton.wav', { type: 'audio/wav' }));
      } else {
        const format = $('expFormat').value;
        const r = await renderSlides(+$('expScale').value, format, setProg);
        files = r.blobs.map((b, i) =>
          new File([b], `Slide_${String(i + 1).padStart(2, '0')}.${r.ext}`, { type: b.type }));
      }
      const res = await SS.shareFiles(files, 'Seamless Studio');
      if (res === 'shared') SS.toast('In der Teilen-Auswahl Instagram wählen → Beitrag, Story oder Reel', 4400, 'ok');
    } catch (e) {
      SS.toast('Teilen fehlgeschlagen: ' + e.message, 3600, 'err');
    } finally {
      SS.wakeOff();
      $('expProgress').classList.add('hidden');
      setProg(0);
      $('expShare').disabled = false;
      dlg.classList.add('hidden');
    }
  };

  /* ================================================================
     Wisch-Vorschau: echte Instagram-Oberfläche
     ================================================================ */
  let previewCrop = 'feed';   // feed 4:5 | profile 3:4

  $('btnPreview').onclick = async () => {
    if (!SS.state.elements.length) return SS.toast('Füge erst Fotos hinzu', 2400, 'warn');
    SS.toast('Erzeuge Vorschau …', 1200);
    const { blobs } = await renderSlides(1, 'jpeg');
    const track = $('previewTrack');
    const dots = $('previewDots');
    track.innerHTML = ''; dots.innerHTML = '';
    blobs.forEach((b, i) => {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(b);
      track.appendChild(img);
      const dot = document.createElement('span');
      if (i === 0) dot.className = 'on';
      dots.appendChild(dot);
    });
    track.scrollLeft = 0;
    track.onscroll = () => {
      const idx = Math.round(track.scrollLeft / track.clientWidth);
      [...dots.children].forEach((d, i) => d.classList.toggle('on', i === idx));
      const c = $('previewCounter');
      if (c) c.textContent = `${idx + 1}/${blobs.length}`;
    };
    const c = $('previewCounter');
    if (c) c.textContent = `1/${blobs.length}`;
    applyCrop();
    $('previewDlg').classList.remove('hidden');
  };

  function applyCrop() {
    const track = $('previewTrack');
    track.classList.toggle('crop-profile', previewCrop === 'profile');
    document.querySelectorAll('#previewCrop button').forEach(b =>
      b.classList.toggle('sel', b.dataset.crop === previewCrop));
    const note = $('previewNote');
    if (note) {
      note.textContent = previewCrop === 'profile'
        ? 'So schneidet Instagram deinen Beitrag im Profilraster (3:4) zu – alles außerhalb verschwindet dort.'
        : 'So sieht dein Beitrag im Feed aus (4:5).';
    }
  }
  document.querySelectorAll('#previewCrop button').forEach(b => {
    b.onclick = () => { previewCrop = b.dataset.crop; applyCrop(); };
  });

  /* Schließen: Knopf, Hintergrund-Tipp, Runterwischen und Escape.
     Vier Wege, damit man nie festhängt – auf dem iPhone lag der Knopf
     bisher hinter Uhrzeit und Akkuanzeige. */
  function previewSchliessen() {
    const dlg = $('previewDlg');
    if (!dlg || dlg.classList.contains('hidden')) return;
    [...$('previewTrack').children].forEach(img => URL.revokeObjectURL(img.src));
    const card = dlg.querySelector('.preview-card');
    if (card) card.style.transform = '';
    dlg.style.background = '';
    dlg.classList.add('hidden');
  }
  SS.previewClose = previewSchliessen;

  $('previewClose').onclick = previewSchliessen;

  // Tipp auf den dunklen Bereich neben der Karte
  $('previewDlg').addEventListener('pointerdown', (e) => {
    if (e.target === $('previewDlg')) previewSchliessen();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('previewDlg').classList.contains('hidden')) previewSchliessen();
  });

  // Runterwischen
  (function () {
    const dlg = $('previewDlg');
    const card = dlg.querySelector('.preview-card');
    if (!card) return;
    let y0 = null, dy = 0, aktiv = false;
    card.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      // nicht wischen, wenn man gerade im Slide-Karussell blättert
      if (e.target.closest('#previewTrack')) return;
      y0 = e.clientY; dy = 0; aktiv = true;
      card.style.transition = 'none';
    });
    card.addEventListener('pointermove', (e) => {
      if (!aktiv || y0 === null) return;
      dy = e.clientY - y0;
      if (dy < 0) dy = 0;
      card.style.transform = 'translateY(' + dy + 'px)';
      dlg.style.background = 'rgba(20,17,15,' + Math.max(0.1, 0.6 - dy / 500) + ')';
    });
    const ende = () => {
      if (!aktiv) return;
      aktiv = false; y0 = null;
      card.style.transition = 'transform .25s var(--ease)';
      if (dy > 90) previewSchliessen();
      else { card.style.transform = ''; dlg.style.background = ''; }
    };
    card.addEventListener('pointerup', ende);
    card.addEventListener('pointercancel', ende);
  })();
})();
