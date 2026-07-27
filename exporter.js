/* Seamless Studio – export: ZIP images, animated video, swipe preview */

(function () {
  const $ = SS.el;
  const dlg = $('exportDlg');

  $('btnExport').onclick = () => {
    dlg.classList.remove('hidden');
    $('expShare').classList.toggle('hidden', !navigator.canShare);
  };
  $('expCancel').onclick = () => dlg.classList.add('hidden');

  $('expType').addEventListener('change', () => {
    const vid = $('expType').value === 'video';
    $('expImgOpts').classList.toggle('hidden', vid);
    $('expVidOpts').classList.toggle('hidden', !vid);
    $('expShare').classList.toggle('hidden', vid || !navigator.canShare);
  });

  function setProg(p) { $('expProgress').firstElementChild.style.width = p + '%'; }

  async function renderSlides(scale, format) {
    const { W, H, slideW, slideH, n } = SS.canvasSize();
    const savedT = SS.animT; SS.animT = 0;   // images are always static
    const full = document.createElement('canvas');
    full.width = W * scale; full.height = H * scale;
    const c = full.getContext('2d');
    c.scale(scale, scale);
    SS.paintScene(c, W, H, { forExport: true });
    SS.animT = savedT;

    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const blobs = [];
    for (let i = 0; i < n; i++) {
      const sc = document.createElement('canvas');
      sc.width = slideW * scale; sc.height = slideH * scale;
      sc.getContext('2d').drawImage(full, -i * slideW * scale, 0);
      const blob = await new Promise(r => sc.toBlob(r, mime, 0.95));
      blobs.push(blob);
      setProg(Math.round((i + 1) / (n + 1) * 100));
    }
    const panoBlob = await new Promise(r => full.toBlob(r, mime, 0.92));
    return { blobs, panoBlob, n, ext: format === 'png' ? 'png' : 'jpg' };
  }

  /* ---------- video export: camera pans across the panorama ---------- */
  async function exportVideo(durationS) {
    const { W, H, slideW, slideH, n } = SS.canvasSize();
    // static scene without animated stickers (they are drawn per-frame)
    const animEls = SS.state.elements.filter(e => (e.anim && e.anim !== 'none'));
    const hidden = new Set(animEls.map(e => e.id));
    const staticCv = document.createElement('canvas');
    staticCv.width = W; staticCv.height = H;
    const sc2 = staticCv.getContext('2d');
    const allEls = SS.state.elements;
    SS.state.elements = allEls.filter(e => !hidden.has(e.id));
    SS.paintScene(sc2, W, H, { forExport: true });
    SS.state.elements = allEls;

    const out = document.createElement('canvas');
    out.width = slideW; out.height = slideH;
    const oc = out.getContext('2d');

    const stream = out.captureStream(30);
    const mimes = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
    let mime = mimes.find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m));
    if (!mime) throw new Error('Video wird auf diesem Gerät nicht unterstützt');
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 9_000_000 });
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    const done = new Promise(r => { rec.onstop = r; });
    rec.start(200);

    const t0 = performance.now();
    const durMs = durationS * 1000;
    const maxPan = W - slideW;
    const ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    await new Promise((resolve) => {
      function frame(now) {
        const t = Math.min(1, (now - t0) / durMs);
        SS.animT = (now - t0) / 1000;
        oc.clearRect(0, 0, slideW, slideH);
        oc.save();
        if (n > 1) {
          // pan across the seamless panorama with a soft hold at both ends
          const hold = 0.09;
          const p = SS.clamp((t - hold) / (1 - hold * 2), 0, 1);
          const vx = ease(p) * maxPan;
          oc.translate(-vx, 0);
          oc.drawImage(staticCv, 0, 0);
          for (const el of animEls) SS.drawStickerEl(oc, el);
        } else {
          // single slide: gentle ken-burns zoom
          const z = 1 + 0.07 * ease(t);
          oc.translate(slideW / 2, slideH / 2);
          oc.scale(z, z);
          oc.translate(-slideW / 2, -slideH / 2);
          oc.drawImage(staticCv, 0, 0);
          for (const el of animEls) SS.drawStickerEl(oc, el);
        }
        oc.restore();
        setProg(Math.round(t * 92));
        if (t < 1) requestAnimationFrame(frame);
        else { rec.stop(); resolve(); }
      }
      requestAnimationFrame(frame);
    });
    await done;
    setProg(100);
    const ext = mime.startsWith('video/mp4') ? 'mp4' : 'webm';
    return { blob: new Blob(chunks, { type: mime }), ext };
  }

  $('expGo').onclick = async () => {
    try {
      $('expProgress').classList.remove('hidden');
      $('expGo').disabled = true;
      if ($('expType').value === 'video') {
        const { blob, ext } = await exportVideo(+$('expVidDur').value);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'Seamless_Video.' + ext;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 8000);
        SS.toast('🎬 Video exportiert ✓');
      } else {
        const scale = +$('expScale').value;
        const format = $('expFormat').value;
        const { blobs, panoBlob, n, ext } = await renderSlides(scale, format);
        const zip = new JSZip();
        const folder = zip.folder('Seamless_Carousel');
        blobs.forEach((b, i) => folder.file(`Slide_${String(i + 1).padStart(2, '0')}.${ext}`, b));
        folder.file(`00_Panorama_Gesamt.${ext}`, panoBlob);
        const zipBlob = await zip.generateAsync({ type: 'blob' }, (m) => setProg(Math.round(90 + m.percent / 10)));
        const a = document.createElement('a');
        a.href = URL.createObjectURL(zipBlob);
        a.download = 'Seamless_Carousel.zip';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 8000);
        SS.toast(`✓ ${n} Slides exportiert`);
      }
    } catch (e) {
      SS.toast('Export fehlgeschlagen: ' + e.message);
    } finally {
      $('expProgress').classList.add('hidden');
      setProg(0);
      $('expGo').disabled = false;
      dlg.classList.add('hidden');
    }
  };

  $('expShare').onclick = async () => {
    try {
      $('expProgress').classList.remove('hidden');
      const { blobs, ext } = await renderSlides(+$('expScale').value, $('expFormat').value);
      const files = blobs.map((b, i) =>
        new File([b], `Slide_${String(i + 1).padStart(2, '0')}.${ext}`, { type: b.type }));
      if (navigator.canShare && navigator.canShare({ files })) {
        await navigator.share({ files, title: 'Seamless Carousel' });
      } else {
        SS.toast('Teilen wird hier nicht unterstützt – nutze den Download.');
      }
    } catch (e) {
      if (e.name !== 'AbortError') SS.toast('Teilen fehlgeschlagen');
    } finally {
      $('expProgress').classList.add('hidden');
      setProg(0);
      dlg.classList.add('hidden');
    }
  };

  /* ---------- swipe preview: like the real Instagram feed ---------- */
  $('btnPreview').onclick = async () => {
    if (!SS.state.elements.length) return SS.toast('Füge erst Fotos hinzu 🙂');
    SS.toast('Erzeuge Vorschau …', 1200);
    const { blobs, n } = await renderSlides(1, 'jpeg');
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
    };
    $('previewDlg').classList.remove('hidden');
  };
  $('previewClose').onclick = () => {
    [...$('previewTrack').children].forEach(img => URL.revokeObjectURL(img.src));
    $('previewDlg').classList.add('hidden');
  };
})();
