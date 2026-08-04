/* Seamless Studio – Hintergrund-Foto je Slide (v7.6)
   ============================================================================
   Scotts Wunsch: neben „Hintergrund-Foto wählen …" (ein Foto für die GANZE
   Leinwand, szenen75.js) soll man ZUSÄTZLICH pro Slide ein eigenes Bild
   wählen können.

   Datenmodell – neuer Hintergrund-Typ im Zustand:

     st.bg = {
       type: 'perslide',
       fallback: <der vorherige Hintergrund, unverändert>,   // preset/gradient/image
       urls: [dataURL | null, …]                             // Index = Slide
     }

   Die dataURLs liegen bewusst IM Zustand (wie bg.customURL beim Typ 'image')
   – so überleben sie Verlauf, Autosave und Projektdateien ohne dass an den
   vier Sicherungswegen geschnitten werden muss. Je Slide auf 1620 px
   begrenzt gehalten (Slide ist 1080 breit – mehr braucht niemand).

   Zeichnen: eine Hülle um SS.paintBackground. Für 'perslide' wird zuerst der
   fallback über den ORIGINALWEG gemalt (kurz st.bg tauschen, forExport=true,
   damit das Original nicht mit falschem Schlüssel zwischenspeichert), dann
   je Slide das eigene Foto formatfüllend in den Slide-Ausschnitt geclippt.
   Slides ohne eigenes Foto zeigen einfach den fallback – „zusätzlich" eben.

   Bedienung: unter dem Knopf „Hintergrund-Foto wählen …" (Szenen-Abschnitt)
   eine Chip-Zeile „Foto je Slide": [1][2][3]…[✕]. Chip antippen → Foto
   wählen → liegt nur auf dieser Slide. Gefüllte Chips sind markiert,
   nochmal tippen tauscht das Foto. ✕ räumt alle Slide-Fotos weg und stellt
   den vorherigen Hintergrund wieder her. Die Zeile baut sich bei jeder
   Slide-Zahl-Änderung neu (Hülle um SS.ui.syncTop, wie pro5.js es vormacht).

   Wiederherstellen (Verlauf/Autosave/Projekt): die Bilder werden faul
   geladen – fehlt beim Zeichnen ein dekodiertes Bild zu einer URL, wird es
   asynchron erzeugt und danach einmal neu gezeichnet.
   ========================================================================= */

(function () {
  if (!SS.state || typeof SS.paintBackground !== 'function') return;
  const st = SS.state;

  /* ---------------- Bild-Vorrat (dekodierte Bilder je Slide) ------------- */
  /* Schlüssel: '__bgS' + i. rec.dataURL dient als Frische-Nachweis. */
  const laufend = {};                     // gerade ladende URLs (kein Doppelstart)
  function lazyLoad(i, url) {
    const key = '__bgS' + i;
    if (laufend[key] === url) return;
    laufend[key] = url;
    const im = new Image();
    im.onload = () => {
      if (laufend[key] !== url) return;   // inzwischen ersetzt
      delete laufend[key];
      SS.images[key] = { img: im, dataURL: url, w: im.width, h: im.height };
      SS.bgCacheInvalidate && SS.bgCacheInvalidate();
      SS.requestRender && SS.requestRender();
    };
    im.onerror = () => { delete laufend[key]; };
    im.src = url;
  }

  /* ---------------- Zeichnen: Hülle um paintBackground ------------------- */
  let _cache = null, _key = '';
  const altInvalidate = SS.bgCacheInvalidate;
  SS.bgCacheInvalidate = function () { _key = ''; if (altInvalidate) altInvalidate.apply(this, arguments); };

  /* Billiger Schlüssel ohne die (großen) dataURLs komplett zu verwursten */
  function schluessel(bg, W, H) {
    const teile = [W, H, bg.type];
    (bg.urls || []).forEach(u => teile.push(u ? u.length : 0));
    teile.push(JSON.stringify(bg.fallback || 0).length);
    return teile.join('|');
  }

  const altPaint = SS.paintBackground;
  SS.paintBackground = function (ctx, W, H, forExport) {
    const bg = st.bg;
    if (!bg || bg.type !== 'perslide') return altPaint.apply(this, arguments);

    const key = schluessel(bg, W, H);
    if (!forExport && _cache && _key === key) { ctx.drawImage(_cache, 0, 0); return; }

    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d');

    /* 1) fallback über den Originalweg. Ist der fallback ein eigenes Foto
       (type 'image') und sein Bild nach einem Projekt-/Verlaufswechsel noch
       nicht dekodiert, wird es faul nachgeladen wie die Slide-Fotos. */
    const fb = bg.fallback && bg.fallback.type ? bg.fallback : { type: 'preset', id: 'aq-blush-1' };
    if (fb.type === 'image' && fb.customURL
      && (!SS.images.__bg || SS.images.__bg.dataURL !== fb.customURL)
      && laufend.__bg !== fb.customURL) {
      laufend.__bg = fb.customURL;
      const im = new Image();
      im.onload = () => {
        if (laufend.__bg !== fb.customURL) return;
        delete laufend.__bg;
        SS.images.__bg = { img: im, dataURL: fb.customURL, w: im.width, h: im.height };
        SS.bgCacheInvalidate(); SS.requestRender && SS.requestRender();
      };
      im.onerror = () => { delete laufend.__bg; };
      im.src = fb.customURL;
    }
    st.bg = fb;
    try { altPaint.call(SS, c, W, H, true); }
    finally { st.bg = bg; }

    /* 2) je Slide das eigene Foto, formatfüllend in den Slide-Ausschnitt */
    const { slideW, n } = SS.canvasSize();
    for (let i = 0; i < n; i++) {
      const url = bg.urls && bg.urls[i];
      if (!url) continue;
      const rec = SS.images['__bgS' + i];
      if (!rec || rec.dataURL !== url) { lazyLoad(i, url); continue; }
      const im = rec.img;
      const sc = Math.max(slideW / im.width, H / im.height);
      const dw = im.width * sc, dh = im.height * sc;
      c.save();
      c.beginPath(); c.rect(i * slideW, 0, slideW, H); c.clip();
      c.drawImage(im, i * slideW + (slideW - dw) / 2, (H - dh) / 2, dw, dh);
      c.restore();
    }

    if (!forExport) { _cache = cv; _key = key; }
    ctx.drawImage(cv, 0, 0);
  };

  /* ---------------- Foto setzen / aufräumen ------------------------------ */
  async function fotoSetzen(i, file) {
    let rec;
    try { rec = await SS.loadImageFile(file, 1620); }
    catch (e) { SS.toast('Das Foto konnte nicht geladen werden', 2600, 'err'); return; }
    if (st.bg.type !== 'perslide') {
      st.bg = {
        type: 'perslide',
        fallback: JSON.parse(JSON.stringify(st.bg)),
        urls: [],
      };
    }
    st.bg.urls[i] = rec.dataURL;
    SS.images['__bgS' + i] = rec;
    SS.bgCacheInvalidate();
    SS.pushHistory('Hintergrund Slide ' + (i + 1));
    SS.requestRender && SS.requestRender();
    SS.toast('Foto liegt als Hintergrund auf Slide ' + (i + 1), 3200, 'ok');
    zeileAuffrischen();
  }

  function alleWeg() {
    if (st.bg.type !== 'perslide') return;
    st.bg = st.bg.fallback && st.bg.fallback.type
      ? st.bg.fallback : { type: 'preset', id: 'aq-blush-1' };
    SS.bgCacheInvalidate();
    SS.pushHistory('Slide-Hintergründe entfernt');
    SS.requestRender && SS.requestRender();
    SS.toast('Alle Slide-Fotos entfernt – vorheriger Hintergrund ist zurück', 3000, 'ok');
    zeileAuffrischen();
  }

  /* ---------------- Bedienung: Chip-Zeile im Szenen-Abschnitt ------------ */
  let zeile = null, hinweis = null;
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*'; inp.style.display = 'none';
  document.body.appendChild(inp);
  let zielSlide = 0;
  inp.addEventListener('change', (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (f) fotoSetzen(zielSlide, f);
  });

  function zeileAuffrischen() {
    if (!zeile) return;
    zeile.innerHTML = '';
    const n = SS.canvasSize().n;
    const urls = st.bg.type === 'perslide' ? (st.bg.urls || []) : [];
    for (let i = 0; i < n; i++) {
      const b = document.createElement('button');
      b.textContent = String(i + 1);
      if (urls[i]) b.classList.add('sel');
      b.title = urls[i]
        ? 'Slide ' + (i + 1) + ' hat ein eigenes Foto – tippen tauscht es'
        : 'Eigenes Foto nur für Slide ' + (i + 1) + ' wählen';
      b.onclick = () => { zielSlide = i; inp.click(); };
      zeile.appendChild(b);
    }
    if (urls.some(Boolean)) {
      const x = document.createElement('button');
      x.textContent = '✕';
      x.title = 'Alle Slide-Fotos entfernen';
      x.onclick = alleWeg;
      zeile.appendChild(x);
    }
  }

  (function einbauen() {
    const anker = document.getElementById('szBgFoto');   // Knopf aus szenen75.js
    if (!anker || !anker.parentElement) return;
    const h = document.createElement('p');
    h.className = 'hint';
    h.textContent = 'Foto je Slide – Nummer antippen und Bild wählen. Slides ohne eigenes Foto behalten den Hintergrund.';
    zeile = document.createElement('div');
    zeile.className = 'chips';
    zeile.id = 'szBgJeSlide';
    anker.parentElement.insertBefore(h, anker.nextSibling);
    anker.parentElement.insertBefore(zeile, h.nextSibling);
    hinweis = h;
    zeileAuffrischen();
  })();

  /* Bei Slide-Zahl-Änderung, Verlauf und Projektwechsel neu aufbauen */
  if (SS.ui && typeof SS.ui.syncTop === 'function') {
    const altSync = SS.ui.syncTop;
    SS.ui.syncTop = function () {
      altSync.apply(this, arguments);
      zeileAuffrischen();
    };
  }

  /* Ein perslide-Hintergrund überlebt das Anwenden jeder Szene – dieselbe
     Rettung, die szenen75.js schon für bg.type 'image' eingebaut hat. */
  if (SS.ui && typeof SS.ui.szeneVorlageAnwenden === 'function') {
    const altSzene = SS.ui.szeneVorlageAnwenden;
    SS.ui.szeneVorlageAnwenden = async function () {
      const vorher = st.bg && st.bg.type === 'perslide'
        ? JSON.parse(JSON.stringify(st.bg)) : null;
      const erg = await altSzene.apply(this, arguments);
      if (vorher) {
        st.bg = vorher;
        SS.bgCacheInvalidate();
        SS.requestRender && SS.requestRender();
      }
      zeileAuffrischen();
      return erg;
    };
  }

  SS.HINTERGRUND76 = { bereit: true };
})();
