/* Seamless Studio – Video-Clip in einen Fotoplatz legen (v8.1)
   ============================================================================
   Ein Fotoplatzhalter kannte bisher nur Fotos. Der Wähler aus
   `platzhalter7.js` heißt „Foto für Platz N" und bietet geladene Bilder und
   „Neue Fotos wählen …" – ein Clip ging dort nicht hinein. Wer in einer Szene
   an einer bestimmten Stelle ein Video wollte, musste den Clip über den
   Video-Bereich einsetzen (er landet dann mittig auf einer Slide, 68 % der
   Slidebreite) und ihn anschließend von Hand auf Größe, Winkel und Rahmen des
   Platzes bringen. Bei einem gekippten Polaroid zwischen Stickern ist das
   Millimeterarbeit.

   Hier bekommt derselbe Wähler einen zweiten Abschnitt: **Video-Clip**. Er
   zeigt die schon geladenen Clips als Miniaturen (das laufende Videobild) und
   einen Knopf für eine neue Datei. Der Clip übernimmt dann vom Platz

     · Ort, Winkel und Deckkraft,
     · die sichtbare Größe der Karte (`SS.rahmenGroesse`),
     · den Rahmen samt Rand, Farbe, Schatten und Eckenradius,
     · und **die Stelle in der Ebenenliste** – das ist der Punkt: in einer
       Szene liegen Sticker über den Plätzen, und der Clip soll genauso
       darunter liegen wie das Foto vorher.

   Liegt der Clip schon auf der Leinwand, wird **er umgezogen** statt ein
   zweiter angelegt. Wer also erst einen Clip einsetzt und dann merkt, dass er
   in den Platz gehört, verliert nichts und bekommt keine Dublette.

   Der Wähler wird nicht nachgebaut, sondern beobachtet: `platzhalter7.js` ruft
   seine eigene, private `waehler()`-Funktion auf, `SS.platzhalterWaehler` zu
   umhüllen würde den Tipp auf die Leinwand also nicht erfassen. Stattdessen
   merkt sich diese Datei beim Zeigerdruck den Platzhalter unter dem Finger und
   ergänzt den Dialog, sobald er im Seitenbaum erscheint.
   ========================================================================= */

(function () {
  const canvas = document.getElementById('canvas');
  if (!SS.state || typeof SS.addClipDatei !== 'function' || !SS.platzhalterNeu) return;
  const st = SS.state;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const istPlatz = (el) => !!(el && el.type === 'photo' && el.ph);

  /* ==================================================================
     1 · Der Umzug in den Platz
     ================================================================== */
  SS.clipInPlatz = function (platz, vidId) {
    const rec = SS.videos && SS.videos[vidId];
    if (!platz || !rec) return null;

    const g = (typeof SS.rahmenGroesse === 'function' ? SS.rahmenGroesse(platz) : SS.elSize(platz));

    /* Liegt dieser Clip schon auf der Leinwand? Dann diesen umziehen. */
    let el = st.elements.find(e => e.type === 'video' && e.vidId === vidId);
    if (el) {
      const j = st.elements.indexOf(el);
      if (j >= 0) st.elements.splice(j, 1);
    } else {
      el = SS.normalizeEl({
        id: SS.uid(), type: 'video', vidId,
        x: 0, y: 0, w: 100, h: 100, rot: 0, opacity: 1, radius: 0, muted: true,
        tIn: 0, trimStart: 0, trimEnd: Math.min(rec.dur || 5, 6),
        name: String(rec.name || 'Clip').replace(/\.[^.]+$/, ''),
      });
    }

    el.x = platz.x; el.y = platz.y;
    el.rot = platz.rot || 0;
    el.opacity = platz.opacity == null ? 1 : platz.opacity;
    el.w = clamp(Math.round(g.w), 24, 6000);
    el.h = clamp(Math.round(g.h), 24, 6000);
    el.scaleX = 1; el.scaleY = 1;
    el._sollW = el.w; el._sollH = el.h; el._sollSX = 1; el._sollSY = 1;
    el.frame = platz.frame ? JSON.parse(JSON.stringify(platz.frame)) : SS.defaultFrame();
    el.radius = 0;                       // der Rahmen bringt seinen Radius mit
    el._rahmenSig = null;
    if (SS.clipPlanWeg) SS.clipPlanWeg(el);

    /* An DIE STELLE des Platzes in der Ebenenliste – darüber liegende
       Sticker bleiben darüber. */
    const k = st.elements.indexOf(platz);
    if (k >= 0) st.elements.splice(k, 1, el);
    else st.elements.push(el);

    if (SS.invalidateEl) SS.invalidateEl(el);
    SS.setSel && SS.setSel(el.id);
    SS.livePlayClips && SS.livePlayClips(true);
    SS.ui && SS.ui.refreshLayers && SS.ui.refreshLayers();
    SS.ui && SS.ui.showProps && SS.ui.showProps();
    SS.requestRender();
    return el;
  };

  /* ==================================================================
     2 · Miniatur eines Clips
     ================================================================== */
  function miniatur(rec, kante) {
    const cv = document.createElement('canvas');
    cv.width = kante; cv.height = kante;
    const c = cv.getContext('2d');
    c.fillStyle = '#241F1B';
    c.fillRect(0, 0, kante, kante);
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
     3 · Dateiwahl für ein neues Video
     ================================================================== */
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'video/*';
  inp.style.display = 'none';
  document.body.appendChild(inp);
  let ziel = null;

  inp.addEventListener('change', async () => {
    const f = inp.files && inp.files[0];
    inp.value = '';
    const platz = ziel; ziel = null;
    if (!f || !platz) return;
    const vorher = new Set(Object.keys(SS.videos || {}));
    try {
      await SS.addClipDatei(f);
    } catch (e) {
      SS.toast && SS.toast('Dieses Video konnte nicht gelesen werden', 3000, 'err');
      return;
    }
    const neu = Object.keys(SS.videos || {}).find(id => !vorher.has(id));
    if (!neu) return;
    /* addClipDatei hat den Clip schon mittig auf eine Slide gelegt –
       clipInPlatz zieht genau dieses Element in den Platz um. */
    if (st.elements.indexOf(platz) < 0) {
      SS.toast && SS.toast('Der Platz ist nicht mehr da – der Clip liegt auf der Leinwand', 3200, 'warn');
      return;
    }
    SS.clipInPlatz(platz, neu);
    SS.pushHistory('Clip in den Platz gelegt');
    SS.toast && SS.toast('Clip sitzt im Platz – Dauer und Startzeit stehen im Video-Bereich', 3600, 'ok');
  });

  /* ==================================================================
     4 · Den Wähler von platzhalter7.js ergänzen
     ================================================================== */
  let letzterPlatz = null;
  window.addEventListener('pointerdown', (ev) => {
    if (ev.target !== canvas) return;
    try {
      const r = canvas.getBoundingClientRect();
      const wx = ((ev.clientX - r.left) - st.panX) / st.zoom;
      const wy = ((ev.clientY - r.top) - st.panY) / st.zoom;
      const stapel = SS.stapelUnter ? SS.stapelUnter(wx, wy) : [];
      letzterPlatz = stapel.find(istPlatz) || null;
    } catch (e) { letzterPlatz = null; }
  }, true);

  function knopf(text, primaer) {
    const b = document.createElement('button');
    b.textContent = text;
    b.className = primaer ? 'wide primary' : 'wide';
    b.style.marginTop = '8px';
    return b;
  }

  function ergaenze(dlg) {
    const karte = dlg.querySelector('.modal-card');
    const platz = letzterPlatz;
    if (!karte || !platz || karte.querySelector('[data-videoplatz]')) return;

    const box = document.createElement('div');
    box.setAttribute('data-videoplatz', '1');

    const h = document.createElement('h4');
    h.textContent = 'Oder ein Video-Clip';
    h.style.margin = '14px 0 6px';
    box.appendChild(h);

    const ids = Object.keys(SS.videos || {});
    if (ids.length) {
      const raster = document.createElement('div');
      raster.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:8px;'
        + 'max-height:240px;overflow:auto;margin:6px 0';
      for (const id of ids) {
        const rec = SS.videos[id];
        const b = document.createElement('button');
        b.style.cssText = 'padding:0;border:none;background:none;cursor:pointer;position:relative;'
          + 'display:flex;flex-direction:column;gap:3px;color:inherit;font:inherit';
        const huelle = document.createElement('span');
        huelle.style.cssText = 'position:relative;display:block';
        const im = document.createElement('img');
        im.src = miniatur(rec, 120);
        im.style.cssText = 'width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;display:block';
        huelle.appendChild(im);
        /* Ist das Videobild noch nicht da, sobald es kommt nachziehen. */
        const v = rec && rec.el;
        if (v && v.readyState < 2) {
          const nach = () => { try { im.src = miniatur(rec, 120); } catch (e) {} };
          v.addEventListener('loadeddata', nach, { once: true });
          try { v.load(); } catch (e) {}
        }
        const marke = document.createElement('span');
        const schon = st.elements.some(e => e.type === 'video' && e.vidId === id);
        marke.textContent = schon ? '▸ umziehen' : '▸ einsetzen';
        marke.style.cssText = 'position:absolute;left:4px;bottom:4px;right:4px;font-size:10px;'
          + 'background:rgba(20,18,16,.72);color:#f5f0e9;border-radius:5px;padding:2px 3px;';
        huelle.appendChild(marke);
        b.appendChild(huelle);
        const titel = document.createElement('span');
        titel.textContent = String((rec && rec.name) || 'Clip').replace(/\.[^.]+$/, '');
        titel.style.cssText = 'font-size:10px;line-height:1.15;color:var(--ink-soft,#999);'
          + 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;text-align:center';
        b.appendChild(titel);
        b.title = (rec && rec.name) || 'Clip';
        b.onclick = () => {
          if (st.elements.indexOf(platz) < 0) { dlg.remove(); return; }
          SS.clipInPlatz(platz, id);
          SS.pushHistory('Clip in den Platz gelegt');
          dlg.remove();
          SS.toast && SS.toast('Clip sitzt im Platz – Größe, Winkel und Rahmen übernommen', 3400, 'ok');
        };
        raster.appendChild(b);
      }
      box.appendChild(raster);
    }

    const neu = knopf(ids.length ? 'Neues Video wählen …' : 'Video-Clip wählen …', !ids.length);
    neu.onclick = () => { ziel = platz; inp.click(); };
    box.appendChild(neu);

    const p = document.createElement('p');
    p.className = 'hint';
    p.textContent = 'Der Clip übernimmt Größe, Winkel, Rahmen und die Ebene des Platzes – '
      + 'er liegt also genauso unter der Deko wie ein Foto. Ein Clip, der schon auf der '
      + 'Leinwand liegt, zieht um statt sich zu verdoppeln.';
    box.appendChild(p);

    /* Vor dem Hinweistext ganz unten einhängen, damit die Fotoauswahl oben bleibt. */
    const letzterHinweis = [...karte.querySelectorAll('.hint')].pop();
    if (letzterHinweis && letzterHinweis.parentElement === karte) karte.insertBefore(box, letzterHinweis);
    else karte.appendChild(box);
  }

  const wache = new MutationObserver((liste) => {
    for (const m of liste) {
      for (const n of m.addedNodes) {
        if (n && n.nodeType === 1 && n.id === 'phDlg') { try { ergaenze(n); } catch (e) {} }
      }
    }
  });
  wache.observe(document.body, { childList: true });

  /* Wird der Wähler von woanders aufgerufen (z. B. aus einem Rezept), reicht
     das gemerkte Ziel nicht – dann den übergebenen Platz benutzen. */
  const origWaehler = SS.platzhalterWaehler;
  if (typeof origWaehler === 'function') {
    SS.platzhalterWaehler = function (el) {
      if (istPlatz(el)) letzterPlatz = el;
      return origWaehler.apply(this, arguments);
    };
  }

  SS.VIDEOPLATZ81 = { bereit: true, version: '8.1.0' };
})();
