/* Seamless Studio – export to ZIP / share */

(function () {
  const $ = SS.el;
  const dlg = $('exportDlg');

  $('btnExport').onclick = () => {
    dlg.classList.remove('hidden');
    $('expShare').classList.toggle('hidden', !navigator.canShare);
  };
  $('expCancel').onclick = () => dlg.classList.add('hidden');

  async function renderSlides(scale, format) {
    const { W, H, slideW, slideH, n } = SS.canvasSize();
    const full = document.createElement('canvas');
    full.width = W * scale; full.height = H * scale;
    const c = full.getContext('2d');
    c.scale(scale, scale);
    SS.paintScene(c, W, H, { forExport: true });

    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const q = 0.95;
    const blobs = [];
    for (let i = 0; i < n; i++) {
      const sc = document.createElement('canvas');
      sc.width = slideW * scale; sc.height = slideH * scale;
      sc.getContext('2d').drawImage(full, -i * slideW * scale, 0);
      const blob = await new Promise(r => sc.toBlob(r, mime, q));
      blobs.push(blob);
      $('expProgress').firstElementChild.style.width = Math.round((i + 1) / (n + 1) * 100) + '%';
    }
    const panoBlob = await new Promise(r => full.toBlob(r, mime, 0.92));
    return { blobs, panoBlob, n, ext: format === 'png' ? 'png' : 'jpg' };
  }

  $('expGo').onclick = async () => {
    try {
      $('expProgress').classList.remove('hidden');
      $('expGo').disabled = true;
      const scale = +$('expScale').value;
      const format = $('expFormat').value;
      const { blobs, panoBlob, n, ext } = await renderSlides(scale, format);

      const zip = new JSZip();
      const folder = zip.folder('Seamless_Carousel');
      blobs.forEach((b, i) => folder.file(`Slide_${String(i + 1).padStart(2, '0')}.${ext}`, b));
      folder.file(`00_Panorama_Gesamt.${ext}`, panoBlob);
      const zipBlob = await zip.generateAsync({ type: 'blob' }, (m) => {
        $('expProgress').firstElementChild.style.width = Math.round(90 + m.percent / 10) + '%';
      });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = 'Seamless_Carousel.zip';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 8000);
      SS.toast(`✓ ${n} Slides exportiert`);
    } catch (e) {
      SS.toast('Export fehlgeschlagen: ' + e.message);
    } finally {
      $('expProgress').classList.add('hidden');
      $('expProgress').firstElementChild.style.width = '0';
      $('expGo').disabled = false;
      dlg.classList.add('hidden');
    }
  };

  $('expShare').onclick = async () => {
    try {
      $('expProgress').classList.remove('hidden');
      const scale = +$('expScale').value;
      const format = $('expFormat').value;
      const { blobs, ext } = await renderSlides(scale, format);
      const files = blobs.map((b, i) =>
        new File([b], `Slide_${String(i + 1).padStart(2, '0')}.${ext}`, { type: b.type }));
      if (navigator.canShare && navigator.canShare({ files })) {
        await navigator.share({ files, title: 'Seamless Carousel' });
      } else {
        SS.toast('Teilen wird auf diesem Gerät nicht unterstützt – nutze den ZIP-Download.');
      }
    } catch (e) {
      if (e.name !== 'AbortError') SS.toast('Teilen fehlgeschlagen');
    } finally {
      $('expProgress').classList.add('hidden');
      $('expProgress').firstElementChild.style.width = '0';
      dlg.classList.add('hidden');
    }
  };
})();
