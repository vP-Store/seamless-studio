/* Seamless Studio – Foto-Platzhalter (v7.3)
   ============================================================================
   Ein Foto-Element darf jetzt LEER sein: `ph: true` und kein (geladenes)
   Bild dahinter. Es wird als gestrichelte Karte mit Berg-Symbol und Nummer
   gezeichnet – mit dem eingestellten Rahmen, denn die Karte entsteht über
   SS.buildCard und läuft damit durch genau denselben Weg wie jedes Foto.
   Auswahl, Griffe, Snapping, Export: alles verhält sich wie gewohnt, weil
   nur SS.photoCard umhüllt wird und alles andere davon abgeleitet ist.

   Füllen geht auf vier Wegen:
     * Antippen eines leeren Platzhalters  → Fotowähler (geladene + neue)
     * Doppeltipp auf einen gefüllten      → Foto tauschen oder entfernen
     * Bild aus der Ablage auf einen Platzhalter ziehen (placePhotoAt-Hülle)
     * „Platzhalter füllen …" im Foto-Bereich: viele Fotos auf einmal,
       der Reihe nach (phNr, sonst von links nach rechts)

   Beim Füllen wird das Foto mittig auf das Seitenverhältnis des Platzes
   zugeschnitten (crop.rect, wie in vorlagen7) – nichts wird verzerrt, und
   die Geometrie der Szene bleibt exakt stehen.

   Dazu: Wer eine fertige Vorlage OHNE geladene Fotos antippt, bekommt die
   Vorlage mit leeren Platzhaltern statt einer leeren Leinwand – die Hülle
   um SS.ui.vorlageAnwenden legt sie vorher an, die Vorlage platziert sie
   wie normale Fotos. Und der Export warnt (ohne zu blockieren), wenn noch
   Platzhalter leer sind – Haken an SS.wakeOn, der ersten Zeile aller fünf
   Exportwege.
   ========================================================================= */

(function () {
  if (!SS.state || !SS.buildCard || !SS.normalizeEl) return;
  const st = SS.state;
  const AR_STANDARD = 0.8;
  const TAU = Math.PI * 2;

  const leerIst = (el) => el && el.type === 'photo' && el.ph
    && !(el.imgId && SS.images[el.imgId]);
  const gefuelltIst = (el) => el && el.type === 'photo' && el.ph
    && !!(el.imgId && SS.images[el.imgId]);

  function leere() {
    return st.elements.filter(leerIst)
      .sort((a, b) => (a.phNr || 1e9) - (b.phNr || 1e9) || a.x - b.x || a.y - b.y);
  }
  SS.platzhalterLeer = leere;

  /* ================================================= Karte des Platzhalters */
  const cache = new Map();

  function nummerVon(el) {
    if (el.phNr) return el.phNr;
    let n = 0;
    for (const e of st.elements) {
      if (e.type === 'photo' && e.ph) { n++; if (e === el) return n; }
    }
    return n || 1;
  }

  function phQuelle(ar, nr, hWunsch) {
    const h = Math.max(240, Math.min(1200, Math.round(hWunsch || 600)));
    const w = Math.max(120, Math.round(h * ar));
    const cv = SS.makeCanvas(w, h);
    const c = cv.getContext('2d');
    c.fillStyle = '#ece6da';
    c.fillRect(0, 0, w, h);
    /* gestrichelte Innenlinie */
    const r = Math.min(w, h) * 0.045;
    c.strokeStyle = '#b5a892';
    c.lineWidth = Math.max(3, h * 0.008);
    c.setLineDash([h * 0.035, h * 0.026]);
    const m = Math.min(w, h) * 0.055;
    c.beginPath();
    c.moveTo(m + r, m);
    c.arcTo(w - m, m, w - m, h - m, r);
    c.arcTo(w - m, h - m, m, h - m, r);
    c.arcTo(m, h - m, m, m, r);
    c.arcTo(m, m, w - m, m, r);
    c.closePath();
    c.stroke();
    c.setLineDash([]);
    /* Berg und Sonne */
    const g = Math.min(w, h) * 0.34;
    const cx = w / 2, cy = h / 2 + g * 0.08;
    c.strokeStyle = '#a3967f';
    c.lineWidth = Math.max(3, h * 0.010);
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(cx - g * 0.62, cy + g * 0.34);
    c.lineTo(cx - g * 0.18, cy - g * 0.26);
    c.lineTo(cx + g * 0.08, cy + g * 0.08);
    c.lineTo(cx + g * 0.26, cy - g * 0.12);
    c.lineTo(cx + g * 0.62, cy + g * 0.34);
    c.stroke();
    c.beginPath();
    c.arc(cx + g * 0.36, cy - g * 0.40, g * 0.14, 0, TAU);
    c.stroke();
    /* Nummernkreis */
    const kr = Math.min(w, h) * 0.115;
    c.fillStyle = '#c9a15f';
    c.beginPath();
    c.arc(m + kr * 1.35, m + kr * 1.35, kr, 0, TAU);
    c.fill();
    c.fillStyle = '#ffffff';
    c.font = `600 ${Math.round(kr * 1.15)}px Poppins, sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(String(nr), m + kr * 1.35, m + kr * 1.42);
    return cv;
  }

  const origCard = SS.photoCard;
  SS.photoCard = function (el) {
    if (leerIst(el)) {
      if (!el.frame) el.frame = SS.defaultFrame();
      const ar = el.phAr || AR_STANDARD;
      const nr = nummerVon(el);
      const key = JSON.stringify([el.frame, el.h, ar, nr]);
      const hit = cache.get(el.id);
      if (hit && hit.key === key) return hit.canvas;
      const q = phQuelle(ar, nr, el.h);
      const cv = SS.buildCard(el, q, el.h);
      SS.freeCanvas(q);
      cache.set(el.id, { key, canvas: cv });
      if (cache.size > 60) cache.delete(cache.keys().next().value);
      return cv;
    }
    return origCard.apply(this, arguments);
  };

  /* ======================================================== Anlegen, Füllen */
  SS.platzhalterNeu = function (o) {
    const el = SS.normalizeEl(Object.assign({
      id: SS.uid(), type: 'photo', ph: true, imgId: null,
      x: 0, y: 0, rot: 0, h: 600, flip: false, opacity: 1,
      phAr: AR_STANDARD,
      frame: SS.defaultFrame(), filter: SS.defaultFilter(),
    }, o));
    return el;
  };

  /* Mittiger Zuschnitt auf das Seitenverhältnis des Platzes – dieselbe
     Rechnung wie in vorlagen7: crop.rect in Quellpixeln, nichts verzerrt. */
  function zuschnittAuf(el, zielAr) {
    if (!zielAr || !isFinite(zielAr)) return;
    const rec = SS.images && SS.images[el.imgId];
    if (!rec || !rec.w || !rec.h) return;
    const q = ((el.crop && el.crop.rot90) || 0) % 360;
    const dreh = q === 90 || q === 270;
    const iw = dreh ? rec.h : rec.w;
    const ih = dreh ? rec.w : rec.h;
    let w = iw, h = Math.round(iw / zielAr);
    if (h > ih) { h = ih; w = Math.round(ih * zielAr); }
    w = Math.max(8, Math.min(iw, w));
    h = Math.max(8, Math.min(ih, h));
    el.crop = Object.assign({ zoom: 1, ox: 0, oy: 0 }, el.crop || {}, {
      rect: { x: Math.round((iw - w) / 2), y: Math.round((ih - h) / 2), w, h },
    });
  }
  SS.platzhalterZuschnitt = zuschnittAuf;

  function kartenWeg(el) {
    cache.delete(el.id);
    SS.photoCacheClear && SS.photoCacheClear(el.id);
    SS.cardCacheClear && SS.cardCacheClear(el.id);
    SS.invalidateEl && SS.invalidateEl(el);
  }

  SS.platzhalterFuellen = function (el, imgId) {
    if (!el || el.type !== 'photo' || !SS.images[imgId]) return false;
    el.imgId = imgId;
    if (el.phAr) zuschnittAuf(el, el.phAr);
    kartenWeg(el);
    SS.requestRender && SS.requestRender();
    return true;
  };

  SS.platzhalterLeeren = function (el) {
    if (!el || !el.ph) return;
    el.imgId = null;
    if (el.crop) delete el.crop.rect;
    kartenWeg(el);
    SS.requestRender && SS.requestRender();
  };

  /* ============================================================= Fotoquelle */
  let zaehler = 1;
  const regal = document.getElementById('photoShelf');

  function regalThumb(imgId, dataURL) {
    if (!regal) return;
    const img = document.createElement('img');
    img.src = dataURL;
    img.title = 'Antippen zum Einfügen – oder auf einen Platzhalter ziehen';
    img.draggable = true;
    img.dataset.imgId = imgId;
    img.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/ss-img', imgId);
      e.dataTransfer.effectAllowed = 'copy';
    });
    img.addEventListener('click', () => {
      const l = leere();
      if (l.length) {
        SS.platzhalterFuellen(l[0], imgId);
        SS.pushHistory('Platzhalter gefüllt');
        SS.toast('In Platz ' + nummerVon(l[0]) + ' gelegt', 1800, 'ok');
      } else if (SS.ui.placePhotoAt) {
        const m = SS.aktuelleSlideMitte();
        SS.ui.placePhotoAt(imgId, m.x, m.y);
      }
    });
    regal.appendChild(img);
  }

  async function dateienLaden(files) {
    const liste = Array.from(files).filter(f =>
      f.type ? f.type.startsWith('image/') : /\.(jpe?g|png|gif|webp|heic|heif|avif|bmp)$/i.test(f.name || ''));
    const out = [];
    for (const f of liste) {
      try {
        const rec = await SS.loadImageFile(f);
        const imgId = 'img' + Date.now() + '_ph' + (zaehler++);
        SS.images[imgId] = rec;
        regalThumb(imgId, rec.dataURL);
        out.push(imgId);
      } catch (e) { SS.toast('Ein Foto konnte nicht geladen werden', 2600, 'err'); }
    }
    return out;
  }

  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true;
  inp.style.display = 'none';
  document.body.appendChild(inp);
  let inpZiel = null;     // Element | 'alle'

  inp.addEventListener('change', async () => {
    const files = [...inp.files];
    inp.value = '';
    const ziel = inpZiel; inpZiel = null;
    if (!files.length) return;
    const ids = await dateienLaden(files);
    if (!ids.length) return;
    let reihe;
    if (ziel && ziel !== 'alle') reihe = [ziel, ...leere().filter(e => e !== ziel)];
    else reihe = leere();
    let n = 0;
    for (const el of reihe) {
      if (n >= ids.length) break;
      if (SS.platzhalterFuellen(el, ids[n])) n++;
    }
    if (n) {
      SS.pushHistory('Platzhalter gefüllt');
      SS.toast((n === 1 ? '1 Platz gefüllt' : n + ' Plätze gefüllt')
        + (ids.length > n ? ' – ' + (ids.length - n) + ' Fotos liegen in der Ablage' : ''), 3200, 'ok');
    } else if (ids.length) {
      SS.toast('Keine leeren Platzhalter – die Fotos liegen in der Ablage', 3200, 'info');
    }
    dialogWeg();
  });

  SS.platzhalterAlleFuellen = function () {
    if (!leere().length) { SS.toast('Kein Platzhalter ist leer', 2400, 'info'); return; }
    inpZiel = 'alle';
    inp.click();
  };

  /* ============================================================ Fotowähler */
  function dialogWeg() {
    const d = document.getElementById('phDlg');
    if (d) d.remove();
  }

  function waehler(el) {
    dialogWeg();
    const gefuellt = gefuelltIst(el);
    const d = document.createElement('div');
    d.id = 'phDlg';
    d.className = 'modal';
    const bilder = Object.keys(SS.images);
    d.innerHTML = '<div class="modal-card" style="max-width:440px">' +
      '<div class="sort-head"><h3>Foto für Platz ' + nummerVon(el) + '</h3>' +
      '<button id="phClose">✕</button></div>' +
      (bilder.length
        ? '<div id="phGrid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;' +
          'max-height:300px;overflow:auto;margin:6px 0">' +
          bilder.map(id =>
            '<button data-img="' + id + '" style="padding:0;border:none;background:none;cursor:pointer">' +
            '<img src="' + SS.images[id].dataURL + '" style="width:100%;aspect-ratio:1;object-fit:cover;' +
            'border-radius:8px;display:block"></button>').join('') + '</div>'
        : '<p class="hint">Noch keine Fotos geladen.</p>') +
      '<button id="phNeu" class="wide primary">Neue Fotos wählen …</button>' +
      (gefuellt ? '<button id="phLeer" class="wide" style="margin-top:8px">Foto entfernen</button>' : '') +
      '<p class="hint">Das erste neue Foto kommt in diesen Platz, weitere füllen die übrigen leeren Plätze.</p>' +
      '</div>';
    document.body.appendChild(d);
    d.querySelector('#phClose').onclick = dialogWeg;
    d.addEventListener('pointerdown', (e) => { if (e.target === d) dialogWeg(); });
    d.querySelectorAll('[data-img]').forEach(b => {
      b.onclick = () => {
        SS.platzhalterFuellen(el, b.dataset.img);
        SS.pushHistory('Platzhalter gefüllt');
        dialogWeg();
      };
    });
    d.querySelector('#phNeu').onclick = () => { inpZiel = el; inp.click(); };
    const lb = d.querySelector('#phLeer');
    if (lb) lb.onclick = () => {
      SS.platzhalterLeeren(el);
      SS.pushHistory('Platzhalter geleert');
      dialogWeg();
    };
  }
  SS.platzhalterWaehler = waehler;

  /* ================================================== Antippen und Ablegen */
  const canvas = document.getElementById('canvas');

  function treffer(wx, wy, nurPh) {
    const list = SS.pickableElements();
    for (let i = list.length - 1; i >= 0; i--) {
      const el = list[i];
      if (nurPh && !el.ph) continue;
      const { w, h } = SS.elSize(el);
      const [lx, ly] = SS.toLocal(wx, wy, el.x, el.y, el.rot);
      if (Math.abs(lx) <= w / 2 && Math.abs(ly) <= h / 2) return el;
    }
    return null;
  }

  if (canvas) {
    let down = null;
    canvas.addEventListener('pointerdown', (e) => {
      down = { x: e.offsetX, y: e.offsetY, t: performance.now(), b: e.button };
    });
    canvas.addEventListener('pointerup', (e) => {
      const war = down; down = null;
      if (!war || war.b) return;
      if (Math.hypot(e.offsetX - war.x, e.offsetY - war.y) > 7) return;
      if (performance.now() - war.t > 650) return;
      if (SS.lassoMode || SS.panMode || SS.addMode || SS.pickMode) return;
      const wx = (e.offsetX - st.panX) / st.zoom;
      const wy = (e.offsetY - st.panY) / st.zoom;
      const el = treffer(wx, wy);
      if (leerIst(el)) waehler(el);
    });
    canvas.addEventListener('dblclick', (e) => {
      const wx = (e.offsetX - st.panX) / st.zoom;
      const wy = (e.offsetY - st.panY) / st.zoom;
      const el = treffer(wx, wy);
      if (gefuelltIst(el)) waehler(el);
    });
  }

  /* Bild aus der Ablage auf einen Platzhalter ziehen (oder antippen) */
  if (SS.ui && SS.ui.placePhotoAt) {
    const origPlace = SS.ui.placePhotoAt;
    SS.ui.placePhotoAt = function (imgId, x, y) {
      const el = treffer(x, y, true);
      if (leerIst(el) && SS.images[imgId]) {
        SS.platzhalterFuellen(el, imgId);
        SS.setSel && SS.setSel(el.id);
        SS.buzz && SS.buzz();
        SS.pushHistory('Platzhalter gefüllt');
        SS.ui.showProps && SS.ui.showProps();
        return;
      }
      return origPlace.apply(this, arguments);
    };
  }

  /* ========================= Vorlagen ohne Fotos → Vorlage mit Platzhaltern */
  const PRO_SLIDE = {
    'sb-dump': 2, 'sb-beige': 2, 'pl-tagebuch': 2, 'pl-automat': 3, 'dd-raster': 4,
  };

  if (SS.ui && typeof SS.ui.vorlageAnwenden === 'function') {
    const origVorlage = SS.ui.vorlageAnwenden;
    SS.ui.vorlageAnwenden = async function (id) {
      const v = (SS.VORLAGEN || []).find(x => x.id === id);
      const hatFotos = st.elements.some(e =>
        (e.type === 'photo' || e.type === 'video') && !e.hidden && !e.locked);
      if (v && !hatFotos && typeof v.platz === 'function' && !v.video) {
        const k = SS.canvasSize();
        const N = k.n * (PRO_SLIDE[id] || 1);
        for (let i = 0; i < N; i++) {
          const r = v.platz(i, N, k) || {};
          const el = SS.platzhalterNeu({
            phNr: i + 1,
            phAr: r.ar || (v.randlos ? k.slideW / k.H : AR_STANDARD),
          });
          st.elements.push(el);
        }
        SS.toast('Vorlage mit leeren Platzhaltern – antippen und Fotos einlegen', 4200, 'info');
      }
      return origVorlage.apply(this, arguments);
    };
  }

  /* ============================== Export-Hinweis (blockiert nicht) */
  if (typeof SS.wakeOn === 'function') {
    const origWake = SS.wakeOn;
    SS.wakeOn = async function () {
      const n = leere().length;
      if (n && !SS._phWarnStumm) {
        SS.toast(n === 1
          ? 'Hinweis: 1 Platzhalter ist noch leer'
          : 'Hinweis: ' + n + ' Platzhalter sind noch leer', 3600, 'warn');
      }
      return origWake.apply(this, arguments);
    };
  }

  /* ============================== Knöpfe im Foto-Bereich */
  if (regal && regal.parentElement) {
    const reihe = document.createElement('div');
    reihe.className = 'chips';
    reihe.innerHTML =
      '<button id="phFuellen">Platzhalter füllen …</button>' +
      '<button id="phEinf">+ Leerer Platzhalter</button>';
    regal.parentElement.insertBefore(reihe, regal.nextSibling);
    reihe.querySelector('#phFuellen').onclick = () => SS.platzhalterAlleFuellen();
    reihe.querySelector('#phEinf').onclick = () => {
      const m = SS.aktuelleSlideMitte();
      const { H } = SS.canvasSize();
      const el = SS.platzhalterNeu({ x: m.x, y: m.y, h: Math.min(H * 0.5, 700) });
      st.elements.push(el);
      SS.setSel && SS.setSel(el.id);
      SS.pushHistory('Platzhalter eingefügt');
      SS.ui.showProps && SS.ui.showProps();
      SS.requestRender();
    };
  }

  SS.PLATZHALTER7 = { bereit: true, fassung: 1 };
})();
