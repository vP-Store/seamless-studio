/* Seamless Studio – Foto und Video im Platz austauschen (v8.2)
   ============================================================================
   Nachgemessen an genau dem Fall, den Scott meldet:

   | Zustand | 1 Tipp | 2 Tipps | Doppelklick |
   |---|---|---|---|
   | Platz LEER            | Wähler | – | – |
   | Platz mit FOTO        | nichts | nichts | Wähler |
   | Platz mit CLIP (v8.1) | nichts | nichts | **nichts** |

   Zwei Löcher:

   **1 · Ein gefüllter Fotoplatz geht nur per Doppelklick.** `platzhalter7.js`
   hängt den Wähler für gefüllte Plätze an `dblclick`. Auf einem Telefon ist
   ein Doppeltipp unzuverlässig, und seit dem Durchtippen (v8.1) holt der
   zweite Tipp erst einmal das nächste Element darunter. Praktisch kommt man
   dort also nicht mehr hin.

   **2 · Ein Clip im Platz hat gar keinen Weg zurück.** `SS.clipInPlatz` ersetzt
   das Platzhalter-Element durch ein Video-Element – damit ist `el.ph` weg, und
   `leerIst`/`gefuelltIst` in `platzhalter7.js` prüfen beide auf
   `type === 'photo'`. Für einen Clip gibt es deshalb keinen Wähler, keinen
   Doppelklick-Weg und keinen Knopf. Einmal Video, immer Video.

   Diese Datei macht daraus einen Austausch in beide Richtungen:

     · `SS.medienWaehler(el)` – EIN Fenster für Fotos UND Clips, mit „leer
       machen". Es gilt für jedes Foto- und Video-Element, nicht nur für Plätze.
     · **Ein Knopf in den Eigenschaften** („🔄 Foto oder Video austauschen …").
       Das ist der Weg, der immer funktioniert: Element wählen – notfalls per
       Durchtippen – und antippen. Kein Doppeltipp nötig.
     · Zusätzlich: ein Platz, der **schon ausgewählt** ist und allein unter dem
       Finger liegt, öffnet den Austausch beim nächsten Tipp. Das kollidiert
       nicht mit dem Durchtippen, denn dort liegen ja mehrere Elemente.
     · `SS.fotoStattClip(clip, imgId)` – die Gegenrichtung zu
       `SS.clipInPlatz`: aus dem Clip wird wieder ein Foto oder ein leerer
       Platz, an derselben Stelle, in derselben Größe, mit demselben Rahmen und
       an derselben Stelle in der Ebenenliste.

   Damit der Weg zurück die Nummer und das Format des Platzes kennt, merkt
   `clipInPlatz` sie ab jetzt am Clip (`el.phSlot`). Das ist ein Datenfeld, es
   darf und soll ins Projekt mitwandern – anders als die Zeichen-Zwischenwerte,
   die neben den Elementen liegen.

   `el.ph` wird am Video ABSICHTLICH nicht gesetzt: `platzhalter7.js`,
   `szenen7.js` und `vorlagen7.js` prüfen an mehreren Stellen `type === 'photo'
   && e.ph`, und ein Video mit `ph` würde dort in Sonderpfade geraten, die es
   nicht meint.
   ========================================================================= */

(function () {
  const canvas = document.getElementById('canvas');
  if (!SS.state || !SS.platzhalterNeu || typeof SS.addClipDatei !== 'function') return;
  const st = SS.state;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const istFoto = (el) => !!el && el.type === 'photo';
  const istClip = (el) => !!el && el.type === 'video';
  const istPlatz = (el) => !!el && ((istFoto(el) && el.ph) || (istClip(el) && el.phSlot));
  const tauschbar = (el) => istFoto(el) || istClip(el);

  function groesse(el) {
    if (typeof SS.rahmenGroesse === 'function') return SS.rahmenGroesse(el);
    return SS.elSize(el);
  }
  function cachesWeg(el) {
    SS.photoCacheClear && SS.photoCacheClear(el.id);
    SS.cardCacheClear && SS.cardCacheClear(el.id);
    SS.clipPlanWeg && SS.clipPlanWeg(el);
    el._rahmenSig = null;
    SS.invalidateEl && SS.invalidateEl(el);
  }

  /* ==================================================================
     1 · Der Platz merkt sich am Clip, was er war
     ================================================================== */
  const origClipInPlatz = SS.clipInPlatz;
  if (typeof origClipInPlatz === 'function') {
    SS.clipInPlatz = function (platz, vidId) {
      /* Denselben Clip in sein eigenes Element legen wäre ein Eigentor: das
         Element würde erst herausgenommen und fände seinen Platz nicht mehr. */
      if (platz && platz.type === 'video' && platz.vidId === vidId) return platz;
      const merk = platz && (platz.phSlot || (platz.ph ? {
        nr: platz.phNr || null,
        ar: platz.phAr || null,
      } : null));
      const el = origClipInPlatz.apply(this, arguments);
      if (el && merk) el.phSlot = merk;
      return el;
    };
  }

  /* ==================================================================
     2 · Die Gegenrichtung: aus dem Clip wieder ein Foto (oder ein leerer Platz)
     ================================================================== */
  SS.fotoStattClip = function (clip, imgId) {
    if (!istClip(clip)) return null;
    const g = groesse(clip);
    const slot = clip.phSlot || null;
    const ar = g.h > 0 ? g.w / g.h : 0.8;

    const el = SS.platzhalterNeu({
      x: clip.x, y: clip.y,
      rot: clip.rot || 0,
      opacity: clip.opacity == null ? 1 : clip.opacity,
      h: clamp(Math.round(g.h), 40, 4000),
      phNr: slot && slot.nr ? slot.nr : undefined,
      phAr: (slot && slot.ar) || ar,
      frame: clip.frame ? JSON.parse(JSON.stringify(clip.frame)) : SS.defaultFrame(),
      imgId: (imgId && SS.images[imgId]) ? imgId : null,
    });

    const k = st.elements.indexOf(clip);
    if (k >= 0) st.elements.splice(k, 1, el);
    else st.elements.push(el);

    cachesWeg(el);
    /* Dieselbe sichtbare Fläche wie der Clip – Rand bleibt rundum gleich dick. */
    if (typeof SS.passeRahmenAn === 'function') SS.passeRahmenAn(el, g.w, g.h);
    cachesWeg(el);

    SS.setSel && SS.setSel(el.id);
    SS.ui && SS.ui.refreshLayers && SS.ui.refreshLayers();
    SS.ui && SS.ui.showProps && SS.ui.showProps();
    SS.requestRender();
    return el;
  };

  /* Ein Foto in ein bestehendes Foto-Element legen, ohne die Fläche zu ändern. */
  SS.fotoTauschen = function (el, imgId) {
    if (!istFoto(el) || !SS.images[imgId]) return false;
    const g = groesse(el);
    el.imgId = imgId;
    if (el.crop) delete el.crop.rect;
    cachesWeg(el);
    if (typeof SS.passeRahmenAn === 'function') SS.passeRahmenAn(el, g.w, g.h);
    cachesWeg(el);
    SS.requestRender();
    return true;
  };

  /* Leer machen: Foto heraus, oder aus dem Clip einen leeren Platz. */
  SS.platzLeeren = function (el) {
    if (istClip(el)) return SS.fotoStattClip(el, null);
    if (!istFoto(el)) return null;
    const g = groesse(el);
    el.ph = true;
    if (!el.phAr) el.phAr = g.h > 0 ? g.w / g.h : 0.8;
    el.imgId = null;
    if (el.crop) delete el.crop.rect;
    cachesWeg(el);
    if (typeof SS.passeRahmenAn === 'function') SS.passeRahmenAn(el, g.w, g.h);
    cachesWeg(el);
    SS.ui && SS.ui.showProps && SS.ui.showProps();
    SS.requestRender();
    return el;
  };

  /* ==================================================================
     3 · Miniaturen
     ================================================================== */
  function clipMiniatur(rec, kante) {
    const cv = document.createElement('canvas');
    cv.width = kante; cv.height = kante;
    const c = cv.getContext('2d');
    c.fillStyle = '#241F1B'; c.fillRect(0, 0, kante, kante);
    const v = rec && rec.el;
    if (v && v.readyState >= 2) {
      const vw = v.videoWidth || rec.w || 16, vh = v.videoHeight || rec.h || 9;
      const s = Math.max(kante / vw, kante / vh);
      c.drawImage(v, (kante - vw * s) / 2, (kante - vh * s) / 2, vw * s, vh * s);
    } else {
      c.fillStyle = '#8A8078';
      c.font = `${Math.round(kante * 0.16)}px Poppins, sans-serif`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('Clip', kante / 2, kante / 2);
    }
    return cv.toDataURL();
  }

  /* ==================================================================
     4 · Dateiwahl
     ================================================================== */
  function dateiInput(accept) {
    const i = document.createElement('input');
    i.type = 'file'; i.accept = accept; i.style.display = 'none';
    document.body.appendChild(i);
    return i;
  }
  const bildInp = dateiInput('image/*');
  const vidInp = dateiInput('video/*');
  let ziel = null;

  bildInp.addEventListener('change', async () => {
    const f = bildInp.files && bildInp.files[0];
    bildInp.value = '';
    const el = ziel; ziel = null;
    if (!f || !el || st.elements.indexOf(el) < 0) return;
    let rec;
    try { rec = await SS.loadImageFile(f); }
    catch (e) { SS.toast && SS.toast('Dieses Bild konnte nicht gelesen werden', 3000, 'err'); return; }
    const imgId = 'img' + Date.now().toString(36) + '_t';
    SS.images[imgId] = rec;
    if (istClip(el)) SS.fotoStattClip(el, imgId);
    else SS.fotoTauschen(el, imgId);
    SS.pushHistory('Medium getauscht');
    SS.toast && SS.toast('Foto eingesetzt', 2400, 'ok');
  });

  vidInp.addEventListener('change', async () => {
    const f = vidInp.files && vidInp.files[0];
    vidInp.value = '';
    const el = ziel; ziel = null;
    if (!f || !el || st.elements.indexOf(el) < 0) return;
    const vorher = new Set(Object.keys(SS.videos || {}));
    try { await SS.addClipDatei(f); }
    catch (e) { SS.toast && SS.toast('Dieses Video konnte nicht gelesen werden', 3000, 'err'); return; }
    const neu = Object.keys(SS.videos || {}).find(id => !vorher.has(id));
    if (!neu) return;
    if (st.elements.indexOf(el) < 0) {
      SS.toast && SS.toast('Das Element ist nicht mehr da – der Clip liegt auf der Leinwand', 3200, 'warn');
      return;
    }
    SS.clipInPlatz(el, neu);
    SS.pushHistory('Medium getauscht');
    SS.toast && SS.toast('Clip eingesetzt – Dauer und Startzeit im Video-Bereich', 3400, 'ok');
  });

  /* ==================================================================
     5 · Das Austausch-Fenster
     ================================================================== */
  function weg() {
    const d = document.getElementById('mwDlg');
    if (d) d.remove();
  }

  function raster(spalten) {
    const d = document.createElement('div');
    d.style.cssText = `display:grid;grid-template-columns:repeat(${spalten},1fr);gap:8px;`
      + 'max-height:230px;overflow:auto;margin:6px 0';
    return d;
  }
  function h4(text) {
    const e = document.createElement('h4');
    e.textContent = text;
    e.style.margin = '14px 0 4px';
    return e;
  }
  function breiterKnopf(text, primaer) {
    const b = document.createElement('button');
    b.textContent = text;
    b.className = primaer ? 'wide primary' : 'wide';
    b.style.marginTop = '8px';
    return b;
  }

  SS.medienWaehler = function (el) {
    if (!tauschbar(el)) return;
    weg();
    const platz = istPlatz(el);
    const nr = (el.phSlot && el.phSlot.nr) || el.phNr || null;

    const d = document.createElement('div');
    d.id = 'mwDlg';
    d.className = 'modal';
    const karte = document.createElement('div');
    karte.className = 'modal-card';
    karte.style.maxWidth = '440px';
    d.appendChild(karte);

    const kopf = document.createElement('div');
    kopf.className = 'sort-head';
    const t = document.createElement('h3');
    t.textContent = platz && nr ? `Platz ${nr} – Foto oder Video` : 'Foto oder Video austauschen';
    const zu = document.createElement('button');
    zu.textContent = '✕';
    zu.onclick = weg;
    kopf.appendChild(t); kopf.appendChild(zu);
    karte.appendChild(kopf);

    const jetzt = document.createElement('p');
    jetzt.className = 'hint';
    jetzt.textContent = istClip(el)
      ? 'Hier liegt gerade ein Video-Clip.'
      : (el.imgId && SS.images[el.imgId]) ? 'Hier liegt gerade ein Foto.' : 'Der Platz ist gerade leer.';
    karte.appendChild(jetzt);

    /* ---------- Fotos ---------- */
    karte.appendChild(h4('Foto'));
    const bilder = Object.keys(SS.images || {});
    if (bilder.length) {
      const r = raster(4);
      for (const id of bilder) {
        const b = document.createElement('button');
        b.style.cssText = 'padding:0;border:none;background:none;cursor:pointer;position:relative';
        const im = document.createElement('img');
        im.src = SS.images[id].dataURL;
        im.style.cssText = 'width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;display:block';
        if (istFoto(el) && el.imgId === id) im.style.outline = '2px solid var(--accent,#8a6a4f)';
        b.appendChild(im);
        b.onclick = () => {
          if (st.elements.indexOf(el) < 0) { weg(); return; }
          if (istClip(el)) SS.fotoStattClip(el, id);
          else SS.fotoTauschen(el, id);
          SS.pushHistory('Medium getauscht');
          weg();
          SS.toast && SS.toast('Foto eingesetzt', 2200, 'ok');
        };
        r.appendChild(b);
      }
      karte.appendChild(r);
    } else {
      const p = document.createElement('p');
      p.className = 'hint';
      p.textContent = 'Noch keine Fotos geladen.';
      karte.appendChild(p);
    }
    const neuBild = breiterKnopf('Neues Foto wählen …', true);
    neuBild.onclick = () => { ziel = el; bildInp.click(); };
    karte.appendChild(neuBild);

    /* ---------- Clips ---------- */
    karte.appendChild(h4('Video-Clip'));
    const clips = Object.keys(SS.videos || {});
    if (clips.length) {
      const r = raster(4);
      for (const id of clips) {
        const rec = SS.videos[id];
        const b = document.createElement('button');
        b.style.cssText = 'padding:0;border:none;background:none;cursor:pointer;'
          + 'display:flex;flex-direction:column;gap:3px;color:inherit;font:inherit';
        const huelle = document.createElement('span');
        huelle.style.cssText = 'position:relative;display:block';
        const im = document.createElement('img');
        im.src = clipMiniatur(rec, 120);
        im.style.cssText = 'width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;display:block';
        if (istClip(el) && el.vidId === id) im.style.outline = '2px solid var(--accent,#8a6a4f)';
        huelle.appendChild(im);
        const v = rec && rec.el;
        if (v && v.readyState < 2) {
          v.addEventListener('loadeddata', () => { try { im.src = clipMiniatur(rec, 120); } catch (e) {} }, { once: true });
          try { v.load(); } catch (e) {}
        }
        const marke = document.createElement('span');
        const schon = st.elements.some(e => e.type === 'video' && e.vidId === id && e !== el);
        marke.textContent = (istClip(el) && el.vidId === id) ? '▸ liegt hier' : (schon ? '▸ umziehen' : '▸ einsetzen');
        marke.style.cssText = 'position:absolute;left:4px;bottom:4px;right:4px;font-size:10px;'
          + 'background:rgba(20,18,16,.72);color:#f5f0e9;border-radius:5px;padding:2px 3px;';
        huelle.appendChild(marke);
        b.appendChild(huelle);
        const nam = document.createElement('span');
        nam.textContent = String((rec && rec.name) || 'Clip').replace(/\.[^.]+$/, '');
        nam.style.cssText = 'font-size:10px;line-height:1.15;color:var(--ink-soft,#999);'
          + 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;text-align:center';
        b.appendChild(nam);
        b.onclick = () => {
          if (st.elements.indexOf(el) < 0) { weg(); return; }
          SS.clipInPlatz(el, id);
          SS.pushHistory('Medium getauscht');
          weg();
          SS.toast && SS.toast('Clip eingesetzt', 2200, 'ok');
        };
        r.appendChild(b);
      }
      karte.appendChild(r);
    } else {
      const p = document.createElement('p');
      p.className = 'hint';
      p.textContent = 'Noch keine Clips geladen.';
      karte.appendChild(p);
    }
    const neuVid = breiterKnopf('Neues Video wählen …');
    neuVid.onclick = () => { ziel = el; vidInp.click(); };
    karte.appendChild(neuVid);

    /* ---------- leer machen ---------- */
    const leer = breiterKnopf(istClip(el) ? 'Video entfernen – Platz wieder leer' : 'Foto entfernen – Platz wieder leer');
    leer.onclick = () => {
      if (st.elements.indexOf(el) < 0) { weg(); return; }
      SS.platzLeeren(el);
      SS.pushHistory('Platz geleert');
      weg();
    };
    if (istClip(el) || (el.imgId && SS.images[el.imgId])) karte.appendChild(leer);

    const p = document.createElement('p');
    p.className = 'hint';
    p.textContent = 'Ort, Winkel, Größe, Rahmen und Ebene bleiben, egal ob Foto oder Video '
      + 'darin liegt – nur der Inhalt wechselt.';
    karte.appendChild(p);

    document.body.appendChild(d);
    d.addEventListener('pointerdown', (e) => { if (e.target === d) weg(); });
  };

  /* ==================================================================
     6 · Wege dorthin
     ================================================================== */

  /* a) Knopf in den Eigenschaften – der Weg, der immer geht. */
  const origProps = SS.ui && SS.ui.showProps;
  if (origProps) {
    SS.ui.showProps = function () {
      const r = origProps.apply(this, arguments);
      try {
        const el = SS.getSel();
        const body = document.getElementById('propsBody');
        if (el && tauschbar(el) && SS.selCount() === 1 && body && !body.querySelector('[data-austausch]')) {
          const reihe = document.createElement('div');
          reihe.className = 'chips';
          reihe.setAttribute('data-austausch', '1');
          const b = document.createElement('button');
          b.textContent = '🔄 Foto oder Video austauschen …';
          b.onclick = () => SS.medienWaehler(el);
          reihe.appendChild(b);
          /* nach oben, damit man nicht scrollen muss */
          body.insertBefore(reihe, body.firstChild);
        }
      } catch (e) {}
      return r;
    };
  }

  /* b) Ein Platz, der schon gewählt ist und allein unter dem Finger liegt:
        nächster Tipp öffnet den Austausch. Kollidiert nicht mit dem
        Durchtippen aus v8.1 – dort liegen mehrere Elemente übereinander. */
  if (canvas) {
    let ab = null;
    window.addEventListener('pointerdown', (ev) => {
      ab = null;
      if (ev.button || ev.target !== canvas) return;
      if (SS.panMode || SS._spacePan || SS.lassoMode || SS.addMode || SS.pickMode || SS.pfadEdit) return;
      try {
        const r = canvas.getBoundingClientRect();
        const sx = ev.clientX - r.left, sy = ev.clientY - r.top;
        const wx = (sx - st.panX) / st.zoom, wy = (sy - st.panY) / st.zoom;
        const stapel = SS.stapelUnter ? SS.stapelUnter(wx, wy) : [];
        if (stapel.length !== 1) return;
        const el = stapel[0];
        if (!istPlatz(el)) return;
        const gefuellt = istClip(el) || (el.imgId && SS.images[el.imgId]);
        if (!gefuellt) return;                       // leere Plätze macht platzhalter7 schon
        if (!SS.isSel || !SS.isSel(el.id)) return;   // erst wählen, dann tauschen
        ab = { el, sx, sy };
      } catch (e) { ab = null; }
    }, true);

    window.addEventListener('pointerup', (ev) => {
      const a = ab; ab = null;
      if (!a) return;
      const r = canvas.getBoundingClientRect();
      if (Math.hypot((ev.clientX - r.left) - a.sx, (ev.clientY - r.top) - a.sy) > 8) return;
      if (document.getElementById('phDlg') || document.getElementById('mwDlg')) return;
      if (st.elements.indexOf(a.el) < 0) return;
      SS.medienWaehler(a.el);
    }, false);

    /* c) Doppelklick gilt weiter – jetzt auch für Clips. */
    canvas.addEventListener('dblclick', (ev) => {
      try {
        const r = canvas.getBoundingClientRect();
        const wx = ((ev.clientX - r.left) - st.panX) / st.zoom;
        const wy = ((ev.clientY - r.top) - st.panY) / st.zoom;
        const stapel = SS.stapelUnter ? SS.stapelUnter(wx, wy) : [];
        const el = stapel.find(istClip) || stapel.find(e => istPlatz(e));
        if (el && istClip(el)) SS.medienWaehler(el);
      } catch (e) {}
    });
  }

  SS.AUSTAUSCH82 = { bereit: true, version: '8.2.0' };
})();
