/* Seamless Studio – Marken-Set und eigene Vorlagen
   ============================================================================
   Zwei Dinge, die aus einzelnen Beitraegen eine SERIE machen:

   1. MARKEN-SET. Einmal hinterlegen: @handle, Webseite, drei Markenfarben,
      Titel- und Textschrift. Ab dann setzt jede angewendete Vorlage den
      echten Handle statt "@DEINPROFIL" ein, die Profil-Vorschau zeigt ihn,
      und ein Knopf legt das Wasserzeichen auf jede Slide. Die Farben und
      Schriften lassen sich per Knopf auf die ausgewaehlten Texte anwenden.

   2. EIGENE VORLAGEN. Ein gelungenes Karussell als Vorlage sichern (Szene
      ohne die Fotos: Plaetze, Texte, Sticker, Hintergrund, Format) und
      spaeter mit einem Tipp auf neue Fotos anwenden. Gespeichert wird im
      Geraet (localStorage, wie Palette und Einstellungen der App).

   Beides haengt sich unten an das Vorlagen-Raster im Studio-Panel.
   ========================================================================= */

(function () {
  if (!SS.ui || !SS.VORLAGEN) return;

  /* ================================================================ Marke */
  const LEER = {
    handle: '', website: '',
    farben: ['#F2D14E', '#F6EEDC', '#2b241d'],
    schriftTitel: 'Playfair Display', schriftText: 'Poppins',
  };
  let marke = Object.assign({}, LEER);
  try {
    marke = Object.assign({}, LEER, JSON.parse(localStorage.getItem('ss-marke') || '{}'));
  } catch (e) {}
  SS.marke = marke;

  function merken() {
    try { localStorage.setItem('ss-marke', JSON.stringify(marke)); } catch (e) {}
  }

  /* Handle immer mit @ davor, egal wie er eingetippt wurde. */
  function handleSauber(roh) {
    const t = String(roh || '').trim();
    if (!t) return '';
    return '@' + t.replace(/^@+/, '');
  }

  /* In frisch angelegten Vorlagen-Texten die Platzhalter ersetzen. */
  function platzhalterErsetzen(el) {
    if (el.type !== 'text' || !el.content) return;
    if (marke.handle) {
      el.content = el.content.replace(/@DEINPROFIL/gi, marke.handle);
    }
    if (marke.website) {
      el.content = el.content.replace(/WWW\.DEINESEITE\.DE/gi, marke.website.toUpperCase());
    }
  }

  const origAnwenden = SS.ui.vorlageAnwenden;
  SS.ui.vorlageAnwenden = async function (id) {
    const vorher = new Set(SS.state.elements.map(e => e.id));
    const r = await origAnwenden.apply(this, arguments);
    try {
      for (const e of SS.state.elements) {
        if (!vorher.has(e.id)) platzhalterErsetzen(e);
      }
      SS.requestRender && SS.requestRender();
    } catch (e) {}
    return r;
  };

  /* Wasserzeichen: der Handle, klein und ruhig, auf jeder Slide unten. */
  function wasserzeichen() {
    const h = marke.handle;
    if (!h) { SS.toast('Erst den @handle im Marken-Set eintragen', 3200, 'warn'); return; }
    const k = SS.canvasSize();
    const daSchon = SS.state.elements.some(e => e.type === 'text' && e.content === h && e._wz);
    if (daSchon) { SS.toast('Das Wasserzeichen liegt schon auf den Slides', 2600); return; }
    for (let s = 0; s < k.n; s++) {
      const el = SS.normalizeEl({
        id: SS.uid(), type: 'text', content: h,
        x: s * k.slideW + k.slideW / 2, y: k.H * 0.955,
        font: marke.schriftText || 'Poppins', size: Math.round(k.H * 0.017),
        color: 'rgba(255,255,255,.72)', align: 'center', letterSpacing: 4,
        bgStyle: 'none', shadow: true, shadowColor: '#100b07',
        shadowBlur: 18, shadowX: 0, shadowY: 3,
      });
      el._wz = true;
      SS.state.elements.push(el);
    }
    SS.pushHistory('Wasserzeichen');
    SS.ui.refreshLayers && SS.ui.refreshLayers();
    SS.requestRender();
    SS.toast('Wasserzeichen auf ' + k.n + ' Slides gelegt', 2600, 'ok');
  }

  /* Markenschrift/-farbe auf die ausgewaehlten Texte anwenden. */
  function aufAuswahl(was) {
    const ids = new Set(SS.state.selectedIds || []);
    const texte = SS.state.elements.filter(e => ids.has(e.id) && e.type === 'text');
    if (!texte.length) { SS.toast('Erst einen oder mehrere Texte auswählen', 3000, 'warn'); return; }
    for (const t of texte) {
      if (was === 'titel') t.font = marke.schriftTitel;
      else if (was === 'text') t.font = marke.schriftText;
      else if (was.startsWith('farbe')) t.color = marke.farben[+was.slice(5)] || t.color;
      SS.invalidateEl && SS.invalidateEl(t);
    }
    SS.pushHistory('Marke angewendet');
    SS.requestRender();
  }

  /* ====================================================== Eigene Vorlagen */
  let eigene = [];
  try { eigene = JSON.parse(localStorage.getItem('ss-eigene') || '[]'); } catch (e) {}

  function eigeneMerken() {
    try { localStorage.setItem('ss-eigene', JSON.stringify(eigene)); }
    catch (e) { SS.toast('Speicher voll – bitte eine alte eigene Vorlage löschen', 4200, 'err'); }
  }

  /* Die Szene als Beschreibung einfrieren: Fotos nur als PLAETZE (Geometrie),
     alles andere vollstaendig – aber ohne Bilddaten. Auch das Rezeptformat
     (rezept7.js) und der Launch-Assistent bauen auf dieser Form auf. */
  SS.szeneEinfrieren = function () {
    const st = SS.state;
    const k = SS.canvasSize();
    const plaetze = [], andere = [];
    for (const e of st.elements) {
      if (e.type === 'photo' || e.type === 'video') {
        plaetze.push({ x: e.x, y: e.y, h: e.h, rot: e.rot || 0,
          frame: e.frame ? JSON.parse(JSON.stringify(e.frame)) : null,
          filter: e.filter ? JSON.parse(JSON.stringify(e.filter)) : null });
      } else {
        const kopie = JSON.parse(JSON.stringify(e));
        delete kopie.id;
        andere.push(kopie);
      }
    }
    /* Kleines Vorschaubild von Slide 1 */
    let bildchen = null;
    try {
      const cv = SS.makeCanvas(135, 168);
      const c = cv.getContext('2d');
      c.scale(168 / k.H, 168 / k.H);
      SS.paintScene(c, k.W, k.H, { forExport: true });
      bildchen = cv.toDataURL('image/jpeg', 0.7);
      SS.freeCanvas(cv);
    } catch (e) {}
    const vl = SS.videoLeinwand;
    return {
      format: st.format, slides: st.slides,
      bg: st.bg ? JSON.parse(JSON.stringify(st.bg)) : null,
      video: (SS.clip && SS.clip.ready && vl) ? { modus: vl.modus, feder: vl.feder, spanne: vl.spanne } : null,
      plaetze, andere, bildchen,
    };
  };

  /* Von aussen eine Vorlage dazulegen (Vorlagen-Pack-Import) – erscheint
     sofort im Raster, ohne Neuladen. */
  SS.eigeneVorlageDazu = function (v) {
    eigene.push(v);
    eigeneMerken();
    raster();
  };

  function sichern() {
    const name = 'Vorlage ' + (eigene.length + 1);
    eigene.push(Object.assign(SS.szeneEinfrieren(), { name, wann: Date.now() }));
    if (eigene.length > 24) eigene.shift();
    eigeneMerken();
    raster();
    SS.toast('„' + name + '" gesichert – unten bei „Deine Vorlagen"', 3400, 'ok');
  }

  /* Eine eingefrorene Beschreibung auf die Szene anwenden – benutzt von den
     eigenen Vorlagen, vom Rezeptformat und vom Launch-Assistenten. */
  async function anwenden(v) {
    const st = SS.state;
    /* Format und Slides ueber die UI-Wege, nie direkt (Kopfzeile!) */
    const fs = document.getElementById('formatSel');
    if (fs && v.format && fs.value !== v.format) {
      fs.value = v.format; fs.dispatchEvent(new Event('change'));
    }
    const plus = document.getElementById('slidesPlus');
    const minus = document.getElementById('slidesMinus');
    let schutz = 0;
    while (st.slides < v.slides && schutz++ < 30) plus.click();
    while (st.slides > v.slides && schutz++ < 60) minus.click();

    if (v.video && SS.clip && SS.clip.ready && SS.videoLeinwand) {
      await SS.videoLeinwand.setzen(v.video.modus, { feder: v.video.feder, spanne: v.video.spanne });
    }
    if (v.bg) { st.bg = JSON.parse(JSON.stringify(v.bg)); SS.bgCacheInvalidate && SS.bgCacheInvalidate(); }

    /* Alte Nicht-Foto-Elemente raeumen (gesperrte bleiben), neue anlegen.
       Platzhalter (@DEINPROFIL, WWW.DEINESEITE.DE) werden hier ersetzt –
       damit gilt das fuer JEDEN Weg, der Beschreibungen anwendet: eigene
       Vorlagen, Rezepte, Launch-Assistent. */
    st.elements = st.elements.filter(e => e.type === 'photo' || e.type === 'video' || e.locked);
    for (const roh of v.andere) {
      const el = SS.normalizeEl(Object.assign(JSON.parse(JSON.stringify(roh)), { id: SS.uid() }));
      platzhalterErsetzen(el);
      st.elements.push(el);
    }
    /* Vorhandene Fotos der Reihe nach auf die gemerkten Plaetze */
    const fotos = st.elements.filter(e => (e.type === 'photo' || e.type === 'video') && !e.locked);
    fotos.forEach((p, i) => {
      const pl = v.plaetze[i % Math.max(1, v.plaetze.length)];
      if (!pl || !v.plaetze.length) return;
      p.x = pl.x; p.y = pl.y; p.rot = pl.rot;
      if (pl.h) p.h = pl.h;
      if (pl.frame && p.frame) p.frame = JSON.parse(JSON.stringify(pl.frame));
      if (pl.filter && p.filter) p.filter = JSON.parse(JSON.stringify(pl.filter));
      SS.photoCacheClear && SS.photoCacheClear(p.id);
      SS.invalidateEl && SS.invalidateEl(p);
    });

    SS.pushHistory(v.name ? 'Angewendet: ' + v.name : 'Beschreibung angewendet');
    SS.ui.refreshLayers && SS.ui.refreshLayers();
    SS.ui.zoomFit && SS.ui.zoomFit();
    SS.requestRender();
    if (!v.still) SS.toast('„' + (v.name || 'Beschreibung') + '" angewendet', 2800, 'ok');
  }
  SS.szeneAnwenden = anwenden;

  /* ============================================================ Bedienung */
  const wurzel = document.getElementById('vorlagenGrid');
  if (!wurzel) return;
  const elternteil = wurzel.parentElement;

  const kasten = document.createElement('div');
  kasten.id = 'markeBox';
  kasten.innerHTML =
    '<div class="ctl" style="margin-top:16px;display:block">' +
      '<span style="opacity:.75;font-size:13px">Marken-Set</span></div>' +
    '<div class="ctl"><span>@handle</span><input type="text" id="mkHandle" placeholder="@deinprofil" style="flex:1"></div>' +
    '<div class="ctl"><span>Webseite</span><input type="text" id="mkWeb" placeholder="www.deineseite.de" style="flex:1"></div>' +
    '<div class="ctl"><span>Farben</span>' +
      '<input type="color" id="mkF0"><input type="color" id="mkF1"><input type="color" id="mkF2"></div>' +
    '<div class="ctl"><span>Titelschrift</span><select id="mkST" style="flex:1"></select></div>' +
    '<div class="ctl"><span>Textschrift</span><select id="mkSX" style="flex:1"></select></div>' +
    '<div class="chips" id="mkAnwenden">' +
      '<button data-was="titel">Titelschrift auf Auswahl</button>' +
      '<button data-was="text">Textschrift auf Auswahl</button>' +
      '<button data-was="farbe0">Farbe 1</button>' +
      '<button data-was="farbe1">Farbe 2</button>' +
      '<button data-was="farbe2">Farbe 3</button>' +
    '</div>' +
    '<button id="mkWz" class="wide">Wasserzeichen auf alle Slides</button>' +
    '<p class="hint">Vorlagen setzen ab jetzt deinen Handle statt „@DEINPROFIL" ein. ' +
    'Die Knöpfe wirken auf gerade ausgewählte Texte.</p>' +
    '<div class="ctl" style="margin-top:14px;display:block">' +
      '<span style="opacity:.75;font-size:13px">Deine Vorlagen</span></div>' +
    '<button id="mkSichern" class="wide primary">Aktuelle Szene als Vorlage sichern</button>' +
    '<div class="grid tpl-grid" id="eigeneGrid"></div>' +
    '<p class="hint">Gesichert werden Plätze, Texte, Sticker und Hintergrund – ' +
    'nicht die Fotos selbst. Anwenden legt deine aktuellen Fotos auf die gemerkten Plätze.</p>';
  elternteil.appendChild(kasten);

  /* Felder fuellen und verdrahten */
  const $ = (id) => document.getElementById(id);
  $('mkHandle').value = marke.handle;
  $('mkWeb').value = marke.website;
  ['mkF0', 'mkF1', 'mkF2'].forEach((id, i) => { $(id).value = marke.farben[i]; });
  for (const sel of [$('mkST'), $('mkSX')]) {
    for (const f of (SS.FONTS || [])) {
      const o = document.createElement('option');
      o.value = f; o.textContent = f;
      sel.appendChild(o);
    }
  }
  $('mkST').value = marke.schriftTitel;
  $('mkSX').value = marke.schriftText;

  $('mkHandle').addEventListener('change', () => { marke.handle = handleSauber($('mkHandle').value); $('mkHandle').value = marke.handle; merken(); });
  $('mkWeb').addEventListener('change', () => { marke.website = $('mkWeb').value.trim(); merken(); });
  ['mkF0', 'mkF1', 'mkF2'].forEach((id, i) => {
    $(id).addEventListener('change', () => { marke.farben[i] = $(id).value; merken(); });
  });
  $('mkST').addEventListener('change', () => { marke.schriftTitel = $('mkST').value; merken(); });
  $('mkSX').addEventListener('change', () => { marke.schriftText = $('mkSX').value; merken(); });
  $('mkWz').onclick = wasserzeichen;
  $('mkAnwenden').querySelectorAll('button').forEach(b => {
    b.onclick = () => aufAuswahl(b.dataset.was);
  });
  $('mkSichern').onclick = sichern;

  /* Raster der eigenen Vorlagen */
  function raster() {
    const g = $('eigeneGrid');
    g.innerHTML = '';
    if (!eigene.length) {
      const p = document.createElement('p');
      p.className = 'hint';
      p.style.gridColumn = '1 / -1';   // sonst quetscht das Raster den Satz in eine Spalte
      p.textContent = 'Noch keine – baue ein Karussell und sichere es hier.';
      g.appendChild(p);
      return;
    }
    eigene.forEach((v, i) => {
      const sw = document.createElement('button');
      sw.className = 'swatch';
      if (v.bildchen) {
        const img = document.createElement('img');
        img.src = v.bildchen;
        img.style.cssText = 'width:100%;aspect-ratio:135/168;object-fit:cover;display:block';
        sw.appendChild(img);
      } else {
        const cv = document.createElement('canvas');
        cv.width = 135; cv.height = 168;
        const c = cv.getContext('2d');
        c.fillStyle = '#3a3733'; c.fillRect(0, 0, 135, 168);
        sw.appendChild(cv);
      }
      const lb = document.createElement('label');
      lb.textContent = v.name;
      sw.appendChild(lb);
      sw.title = v.name + ' – ' + v.slides + ' Slides, ' + v.format
        + '. Lange drücken zum Löschen.';
      let langGedrueckt = false;
      sw.onclick = () => { if (!langGedrueckt) anwenden(v); langGedrueckt = false; };
      /* Loeschen per langem Druck (wie am Handy ueblich) oder Rechtsklick –
         bestaetigt wird ueber den Toast mit Aktionsknopf, nicht ueber
         confirm(): das passt zur App und blockiert nichts. */
      const loeschenFragen = () => {
        SS.toast('„' + v.name + '" löschen?', 4200, 'warn',
          { label: 'Löschen', fn: () => { eigene.splice(i, 1); eigeneMerken(); raster(); } });
      };
      let timer = null;
      sw.addEventListener('pointerdown', () => {
        timer = setTimeout(() => { timer = null; langGedrueckt = true; loeschenFragen(); }, 750);
      });
      const abbr = () => { if (timer) { clearTimeout(timer); timer = null; } };
      sw.addEventListener('pointerup', abbr);
      sw.addEventListener('pointerleave', abbr);
      sw.addEventListener('contextmenu', (e) => { e.preventDefault(); loeschenFragen(); });
      g.appendChild(sw);
    });
  }
  raster();

  SS.MARKE7 = { bereit: true };
})();
