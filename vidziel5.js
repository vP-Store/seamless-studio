/* Seamless Studio 5.2 – Wohin mit dem Video?
   ============================================================================
   Bisher gab es zwei Wege, die in verschiedenen Panels lagen: der Video-Tab
   machte den Clip zum Hintergrund (und klappte dabei still das ganze Panorama
   auf eine einzige Slide zusammen), das Fotos-Panel legte ihn auf die Leinwand.
   Jetzt fragt die App einmal nach – mit einem echten Standbild aus dem Video
   und dem ehrlichen Hinweis, was der Hintergrund-Weg mit den Slides macht.

   SS.videoZiel(file)  ->  Promise<'leinwand' | 'hintergrund' | null>
   ========================================================================= */

(function () {
  const $ = SS.el;

  /* Erstes brauchbares Standbild holen – für die Vorschau im Dialog. */
  function standbild(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const v = document.createElement('video');
      v.src = url; v.muted = true; v.playsInline = true; v.preload = 'metadata';
      let fertig = false;
      const gib = (data, w, h, dur) => {
        if (fertig) return;
        fertig = true;
        try { v.pause(); } catch (e) {}
        URL.revokeObjectURL(url);
        resolve({ data, w, h, dur });
      };
      v.onloadeddata = () => {
        try {
          v.currentTime = Math.min(0.4, (v.duration || 1) * 0.1);
        } catch (e) { /* manche Formate mögen kein Springen */ }
      };
      v.onseeked = v.onloadeddata2 = () => {
        try {
          const k = 400 / Math.max(1, v.videoWidth || 720);
          const cv = SS.makeCanvas(Math.round((v.videoWidth || 720) * k),
                                   Math.round((v.videoHeight || 1280) * k));
          cv.getContext('2d').drawImage(v, 0, 0, cv.width, cv.height);
          gib(cv.toDataURL('image/jpeg', 0.8), v.videoWidth || 720, v.videoHeight || 1280, v.duration || 0);
        } catch (e) { gib(null, v.videoWidth || 720, v.videoHeight || 1280, v.duration || 0); }
      };
      v.onerror = () => gib(null, 720, 1280, 0);
      setTimeout(() => gib(null, v.videoWidth || 720, v.videoHeight || 1280, v.duration || 0), 4000);
    });
  }

  function bauen() {
    if ($('vidZielDlg')) return;
    const d = document.createElement('div');
    d.id = 'vidZielDlg';
    d.className = 'modal hidden';
    d.innerHTML =
      '<div class="modal-card vz-card">' +
        '<h3>Wohin mit dem Video?</h3>' +
        '<div class="vz-wrap">' +
          '<div class="vz-thumb"><img id="vzThumb" alt=""><span id="vzMeta"></span></div>' +
          '<div class="vz-opts">' +
            '<button class="vz-opt" data-ziel="leinwand">' +
              '<span class="vz-ico" aria-hidden="true">' +
                '<svg viewBox="0 0 44 34"><rect x="1" y="1" width="42" height="32" rx="3" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".45"/>' +
                '<rect x="12" y="7" width="20" height="20" rx="2.5" fill="currentColor" opacity=".22" stroke="currentColor" stroke-width="1.6"/>' +
                '<path d="M19.5 13.5v7l6-3.5z" fill="currentColor"/></svg>' +
              '</span>' +
              '<b>Auf die Leinwand legen</b>' +
              '<small>Liegt da wie ein Foto: verschieben, drehen, skalieren, in Ebenen sortieren. Mehrere Clips gleichzeitig möglich. Dein Panorama bleibt, wie es ist.</small>' +
            '</button>' +
            '<button class="vz-opt" data-ziel="hintergrund">' +
              '<span class="vz-ico" aria-hidden="true">' +
                '<svg viewBox="0 0 44 34"><rect x="1" y="1" width="42" height="32" rx="3" fill="currentColor" opacity=".22" stroke="currentColor" stroke-width="1.6"/>' +
                '<path d="M19 13.5v7l6-3.5z" fill="currentColor"/></svg>' +
              '</span>' +
              '<b>Als Hintergrund über die ganze Fläche</b>' +
              '<small id="vzWarn">Das Video füllt die Leinwand. Achtung: dabei wird aus dem Carousel <b>eine einzige Slide</b>.</small>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<p class="hint">Du kannst später jederzeit umschalten – der Knopf steht in den Eigenschaften des Clips.</p>' +
        '<div class="modal-btns"><button id="vzCancel">Abbrechen</button></div>' +
      '</div>';
    document.body.appendChild(d);
  }

  SS.videoZiel = async function (file) {
    bauen();
    const dlg = $('vidZielDlg');
    const info = await standbild(file);

    const img = $('vzThumb');
    if (info.data) { img.src = info.data; img.style.display = ''; }
    else img.style.display = 'none';
    const sek = info.dur ? Math.round(info.dur) + ' s · ' : '';
    $('vzMeta').textContent = sek + info.w + '×' + info.h;

    const n = SS.state.slides;
    const warn = $('vzWarn');
    if (warn) {
      warn.innerHTML = n > 1
        ? 'Das Video füllt die Leinwand. Achtung: aus deinen <b>' + n + ' Slides wird eine einzige</b>.'
        : 'Das Video füllt die Leinwand.';
    }

    dlg.classList.remove('hidden');
    return new Promise((resolve) => {
      const fertig = (wert) => {
        dlg.classList.add('hidden');
        dlg.querySelectorAll('.vz-opt').forEach(b => { b.onclick = null; });
        $('vzCancel').onclick = null;
        dlg.onpointerdown = null;
        document.removeEventListener('keydown', esc);
        resolve(wert);
      };
      dlg.querySelectorAll('.vz-opt').forEach(b => {
        b.onclick = () => fertig(b.dataset.ziel);
      });
      $('vzCancel').onclick = () => fertig(null);
      dlg.onpointerdown = (e) => { if (e.target === dlg) fertig(null); };
      const esc = (e) => { if (e.key === 'Escape') fertig(null); };
      document.addEventListener('keydown', esc);
    });
  };

  /* ------------------------------------------------------------------
     Nachträglich umschalten
     ------------------------------------------------------------------ */

  /* Leinwand-Clip → Hintergrund */
  SS.clipZuHintergrund = async function (el) {
    const rec = SS.videos && SS.videos[el.vidId];
    if (!rec || !rec.datei) {
      SS.toast('Die Originaldatei ist nicht mehr da – bitte neu laden', 3200, 'warn');
      return;
    }
    const n = SS.state.slides;
    try {
      SS.state.elements = SS.state.elements.filter(e => e.id !== el.id);
      SS.clearSel();
      await SS.loadClip(rec.datei);
      SS.pushHistory('Clip als Hintergrund');
      SS.ui.refreshLayers && SS.ui.refreshLayers();
      SS.ui.showProps && SS.ui.showProps();
      SS.requestRender();
      SS.toast(n > 1
        ? 'Clip liegt jetzt als Hintergrund – aus ' + n + ' Slides wurde eine'
        : 'Clip liegt jetzt als Hintergrund', 4000, 'ok',
        { label: 'Rückgängig', fn: () => { SS.undo && SS.undo(); } });
    } catch (e) {
      SS.toast('Hat nicht geklappt: ' + e.message, 3200, 'err');
    }
  };

  /* Hintergrund-Clip → Leinwand */
  SS.hintergrundZuClip = async function () {
    const cl = SS.clip;
    if (!cl || !cl.datei) {
      SS.toast('Die Originaldatei ist nicht mehr da – bitte neu laden', 3200, 'warn');
      return;
    }
    const datei = cl.datei;
    SS.clipClear(true);
    try {
      await SS.addClipDatei(datei);
      SS.toast('Clip liegt jetzt auf der Leinwand – dein Panorama ist zurück', 3200, 'ok');
    } catch (e) {
      SS.toast('Hat nicht geklappt: ' + e.message, 3200, 'err');
    }
    SS.ui.syncTop && SS.ui.syncTop();
    SS.ui.zoomFit && SS.ui.zoomFit();
    SS.requestRender();
  };
})();
