/* Seamless Studio – Foto-Zauberstab
   ============================================================================
   Zwei Handgriffe fuer stimmige Beitraege:

   1. AUFHELLEN MIT AUGENMASS: Histogramm des Fotos lesen (2%- und
      98%-Perzentil der Helligkeit, mittlere Saettigung) und daraus die
      vorhandenen Filterwerte setzen – kein Neurechnen der Pixel, alles
      bleibt der bewaehrte Filterweg der App und laesst sich zuruecknehmen.

   2. PALETTE AUS FOTO: die fuenf tragenden Farben des Bildes (grobes
      Farbwuerfel-Zaehlen, gewichtet nach Saettigung) als Knoepfe – ein Tipp
      faerbt die ausgewaehlten Texte, langer Druck legt die Farbe ins
      Marken-Set.
   ========================================================================= */

(function () {
  if (!SS.ui) return;

  function bildDaten(el) {
    const rec = SS.images[el.imgId];
    if (!rec || !rec.img) return null;
    const q = rec.img;
    const qw = q.width || q.naturalWidth, qh = q.height || q.naturalHeight;
    const s = Math.min(1, 96 / Math.max(qw, qh));
    const cv = SS.makeCanvas(Math.max(8, Math.round(qw * s)), Math.max(8, Math.round(qh * s)));
    const c = cv.getContext('2d', { willReadFrequently: true });
    c.drawImage(q, 0, 0, cv.width, cv.height);
    const d = c.getImageData(0, 0, cv.width, cv.height).data;
    SS.freeCanvas(cv);
    return d;
  }

  /* ------------------------------------------------- 1. Auto-Verbesserung */
  function verbessern() {
    const ids = SS.state.selectedIds || [];
    let fotos = SS.state.elements.filter(e => ids.includes(e.id) && e.type === 'photo');
    if (!fotos.length) fotos = SS.state.elements.filter(e => e.type === 'photo');
    if (!fotos.length) { SS.toast('Kein Foto in der Szene', 2600, 'warn'); return; }
    let angefasst = 0;
    for (const el of fotos) {
      const d = bildDaten(el);
      if (!d) continue;
      const lum = [];
      let satSumme = 0, n = 0;
      for (let i = 0; i < d.length; i += 16) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        lum.push(0.2126 * r + 0.7152 * g + 0.0722 * b);
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        satSumme += mx ? (mx - mn) / mx : 0;
        n++;
      }
      lum.sort((a, b) => a - b);
      const p2 = lum[Math.floor(lum.length * 0.02)];
      const p50 = lum[Math.floor(lum.length * 0.5)];
      const p98 = lum[Math.floor(lum.length * 0.98)];
      const spann = Math.max(1, p98 - p2);
      const sat = satSumme / Math.max(1, n);

      /* Zielwerte mit Augenmass, alle sanft gedeckelt */
      const helligkeit = SS.clamp(Math.round(100 + (128 - p50) * 0.25), 88, 118);
      const kontrast = SS.clamp(Math.round(100 + (200 - spann) * 0.22), 100, 122);
      const saettigung = SS.clamp(Math.round(100 + (0.30 - sat) * 55), 92, 116);
      if (!el.filter) el.filter = SS.defaultFilter();
      Object.assign(el.filter, {
        brightness: helligkeit, contrast: kontrast, saturate: saettigung, preset: 'custom',
      });
      SS.photoCacheClear && SS.photoCacheClear(el.id);
      SS.invalidateEl && SS.invalidateEl(el);
      angefasst++;
    }
    SS.pushHistory('Foto-Zauberstab');
    SS.requestRender();
    SS.toast(angefasst + ' Foto(s) behutsam nachgestellt – Rückgängig geht wie immer', 3200, 'ok');
  }

  /* ------------------------------------------------- 2. Palette aus Foto */
  function palette() {
    const ids = SS.state.selectedIds || [];
    const el = SS.state.elements.find(e => ids.includes(e.id) && e.type === 'photo')
      || SS.state.elements.find(e => e.type === 'photo');
    if (!el) { SS.toast('Kein Foto in der Szene', 2600, 'warn'); return; }
    const d = bildDaten(el);
    if (!d) return;
    /* 4-Bit-Farbwuerfel, gewichtet: satte Toene zaehlen staerker */
    const toepfe = {};
    for (let i = 0; i < d.length; i += 8) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      const gewicht = 1 + ((mx - mn) / 255) * 3;
      const key = (r >> 4) + ',' + (g >> 4) + ',' + (b >> 4);
      const t = toepfe[key] || (toepfe[key] = { n: 0, r: 0, g: 0, b: 0 });
      t.n += gewicht; t.r += r * gewicht; t.g += g * gewicht; t.b += b * gewicht;
    }
    const beste = Object.values(toepfe).sort((a, b) => b.n - a.n).slice(0, 12)
      .map(t => {
        const r = Math.round(t.r / t.n), g = Math.round(t.g / t.n), b = Math.round(t.b / t.n);
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
      });
    /* zu aehnliche raus */
    const farben = [];
    const abstand = (a, b) => {
      const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16));
      const pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
      return Math.abs(pa[0] - pb[0]) + Math.abs(pa[1] - pb[1]) + Math.abs(pa[2] - pb[2]);
    };
    for (const f of beste) {
      if (farben.every(x => abstand(x, f) > 60)) farben.push(f);
      if (farben.length >= 5) break;
    }
    zeigen(farben);
  }

  let reihe = null;
  function zeigen(farben) {
    if (!reihe) return;
    reihe.innerHTML = '';
    farben.forEach(f => {
      const b = document.createElement('button');
      b.style.cssText = 'width:34px;height:34px;border-radius:8px;background:' + f +
        ';border:1px solid rgba(127,127,127,.4)';
      b.title = f + ' – Tipp: auf ausgewählte Texte. Lang drücken: ins Marken-Set (Farbe 1).';
      let lang = false, timer = null;
      b.onclick = () => {
        if (lang) { lang = false; return; }
        const ids = new Set(SS.state.selectedIds || []);
        const texte = SS.state.elements.filter(e => ids.has(e.id) && e.type === 'text');
        if (!texte.length) { SS.toast('Erst Texte auswählen', 2400, 'warn'); return; }
        texte.forEach(t => { t.color = f; SS.invalidateEl && SS.invalidateEl(t); });
        SS.pushHistory('Farbe aus Foto');
        SS.requestRender();
      };
      b.addEventListener('pointerdown', () => {
        timer = setTimeout(() => {
          timer = null; lang = true;
          if (SS.marke) {
            SS.marke.farben[0] = f;
            try { localStorage.setItem('ss-marke', JSON.stringify(SS.marke)); } catch (e) {}
            const feld = document.getElementById('mkF0');
            if (feld) feld.value = f;
            SS.toast(f + ' ist jetzt Markenfarbe 1', 2600, 'ok');
          }
        }, 700);
      });
      const abbr = () => { if (timer) { clearTimeout(timer); timer = null; } };
      b.addEventListener('pointerup', abbr);
      b.addEventListener('pointerleave', abbr);
      reihe.appendChild(b);
    });
  }

  /* ------------------------------------------------------------ Bedienung */
  const kasten = document.getElementById('markeBox');
  if (!kasten) return;
  const kopf = document.createElement('div');
  kopf.className = 'ctl';
  kopf.style.cssText = 'margin-top:14px;display:block';
  kopf.innerHTML = '<span style="opacity:.75;font-size:13px">Foto-Zauberstab</span>';
  const chips = document.createElement('div');
  chips.className = 'chips';
  chips.innerHTML =
    '<button id="zbVerbessern">Fotos aufhellen (Automatik)</button>' +
    '<button id="zbPalette">Palette aus Foto</button>';
  reihe = document.createElement('div');
  reihe.style.cssText = 'display:flex;gap:8px;margin-top:8px;flex-wrap:wrap';
  kasten.appendChild(kopf);
  kasten.appendChild(chips);
  kasten.appendChild(reihe);
  document.getElementById('zbVerbessern').onclick = verbessern;
  document.getElementById('zbPalette').onclick = palette;

  SS.ZAUBER7 = { bereit: true, verbessern, palette };
})();
