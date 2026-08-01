/* Seamless Studio – Projektverwaltung
   ============================================================================
   Bisher lebte genau EINE Szene in der App (plus Autosave). Jetzt: mehrere
   Projekte, jedes mit Name, geplantem Datum, Serie und Vorschaubild – die
   Grundlage fuer Serien-Fabrik, Kalender, Profil-Planer und Launch-Assistent.

   Gespeichert wird in der VORHANDENEN IndexedDB-Schicht (util.js, Speicher
   'kv'): je Projekt ein Eintrag 'projekt:<id>' in derselben Form wie der
   Autosave ({snap, imgs}) – geladen wird mit SS.loadProjectData, dem
   bewaehrten Weg. Der Index (Metadaten aller Projekte) liegt unter
   'projekteIndex'.

   iOS kann PWA-Speicher nach langer Nichtnutzung raeumen. Deshalb gehoert
   zur Verwaltung von Anfang an das DATEI-BACKUP: alle Projekte als eine
   .ssprojekte.json sichern und wiederherstellen – zugleich der Umzugsweg
   zwischen Geraeten.
   ========================================================================= */

(function () {
  if (!SS.ui || typeof SS.loadProjectData !== 'function') return;

  const P = SS.projekte = { index: [], aktuellId: null, bereit: false };

  /* ------------------------------------------------------------ Grundlagen */
  const neueId = () => 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);

  function bilderSammeln() {
    const imgs = {};
    for (const el of SS.state.elements) {
      if (el.type !== 'photo') continue;
      if (SS.images[el.imgId]) imgs[el.imgId] = SS.images[el.imgId].dataURL;
      if (el.imgIdOrig && SS.images[el.imgIdOrig]) imgs[el.imgIdOrig] = SS.images[el.imgIdOrig].dataURL;
    }
    if (SS.state.bg.custom && SS.state.bg.customURL) imgs.__bg = SS.state.bg.customURL;
    return imgs;
  }

  function bildchen() {
    try {
      const k = SS.canvasSize();
      const cv = SS.makeCanvas(135, 168);
      const c = cv.getContext('2d');
      c.scale(168 / k.H, 168 / k.H);
      SS.paintScene(c, k.W, k.H, { forExport: true });
      const url = cv.toDataURL('image/jpeg', 0.68);
      SS.freeCanvas(cv);
      return url;
    } catch (e) { return null; }
  }

  async function indexLaden() {
    P.index = (await SS.dbGet('projekteIndex')) || [];
    P.aktuellId = (await SS.dbGet('projektAktuell')) || null;
    if (P.aktuellId && !P.index.some(m => m.id === P.aktuellId)) P.aktuellId = null;
    P.bereit = true;
  }
  function indexMerken() {
    SS.dbPut('projekteIndex', JSON.parse(JSON.stringify(P.index)));
    SS.dbPut('projektAktuell', P.aktuellId);
  }
  const meta = (id) => P.index.find(m => m.id === id) || null;

  /* Die offene Szene in ihr Projekt schreiben (falls sie eines hat). */
  P.sichernAktuell = function () {
    if (!P.aktuellId) return;
    const m = meta(P.aktuellId);
    if (!m) return;
    SS.dbPut('projekt:' + P.aktuellId, { snap: SS.serialize(), imgs: bilderSammeln() });
    m.thumb = bildchen() || m.thumb;
    m.wann = Date.now();
    indexMerken();
    raster();
  };

  /* Beim normalen Arbeiten still mitschreiben: der Autosave laeuft ohnehin
     nach jeder Aenderung – wir haengen uns an und halten das Projekt frisch
     (gedrosselt, damit grosse Szenen nicht bei jedem Schritt neu gepackt
     werden). */
  let drossel = 0;
  const altAutosave = SS.autosave;
  SS.autosave = function () {
    const r = altAutosave.apply(this, arguments);
    const jetzt = Date.now();
    if (P.aktuellId && jetzt - drossel > 8000) {
      drossel = jetzt;
      setTimeout(() => { try { P.sichernAktuell(); } catch (e) {} }, 1600);
    }
    return r;
  };

  function szeneLeeren() {
    SS.clearSel();
    SS.state.elements.splice(0);
    if (SS.clip && SS.clip.ready) SS.clipClear(true);
    /* Der Hintergrund bleibt – ein leeres Projekt erbt den aktuellen Look,
       und es gibt keinen "falschen" Hintergrund-Zustand. */
    SS.captions && SS.captions.splice(0);
    SS.state.alt = [];
    SS.bgCacheInvalidate && SS.bgCacheInvalidate();
  }

  /* ------------------------------------------------------------ Handlungen */
  P.neu = async function (name, o) {
    P.sichernAktuell();
    const id = neueId();
    const m = Object.assign({ id, name: name || 'Projekt ' + (P.index.length + 1),
      geplant: '', serie: '', sprache: 'de', beitrag: null, ergebnis: null,
      thumb: null, wann: Date.now() }, o || {});
    P.index.unshift(m);
    P.aktuellId = id;
    if (!o || !o.szeneBehalten) szeneLeeren();
    SS.pushHistory('Projekt: ' + m.name);
    P.sichernAktuell();
    kopf();
    SS.requestRender();
    return id;
  };

  P.oeffnen = async function (id) {
    if (id === P.aktuellId) return;
    const m = meta(id);
    if (!m) return;
    P.sichernAktuell();
    const daten = await SS.dbGet('projekt:' + id);
    szeneLeeren();
    if (daten && daten.snap) await SS.loadProjectData(daten);
    P.aktuellId = id;
    indexMerken();
    kopf(); raster();
    SS.ui.zoomFit && SS.ui.zoomFit();
    SS.requestRender();
    SS.toast('„' + m.name + '" geöffnet', 2200, 'ok');
  };

  P.duplizieren = async function (id) {
    const m = meta(id);
    const daten = await SS.dbGet('projekt:' + id);
    if (!m || !daten) return;
    const nid = neueId();
    P.index.unshift(Object.assign(JSON.parse(JSON.stringify(m)), {
      id: nid, name: m.name + ' (Kopie)', wann: Date.now() }));
    SS.dbPut('projekt:' + nid, daten);
    indexMerken(); raster();
    SS.toast('Kopie angelegt', 2000, 'ok');
  };

  P.loeschen = function (id) {
    const m = meta(id);
    if (!m) return;
    SS.toast('„' + m.name + '" löschen?', 4200, 'warn', {
      label: 'Löschen',
      fn: () => {
        P.index = P.index.filter(x => x.id !== id);
        SS.dbDel('projekt:' + id);
        if (P.aktuellId === id) P.aktuellId = null;
        indexMerken(); kopf(); raster();
      },
    });
  };

  /* --------------------------------------------------------- Datei-Backup */
  async function backupBauen() {
    P.sichernAktuell();
    const daten = {};
    for (const m of P.index) daten[m.id] = await SS.dbGet('projekt:' + m.id);
    return JSON.stringify({ ssprojekte: 1, wann: Date.now(), index: P.index, daten });
  }

  async function backupLaden(text) {
    let d;
    try { d = JSON.parse(text); } catch (e) { SS.toast('Keine lesbare Backup-Datei', 3200, 'err'); return; }
    if (d.ssprojekte !== 1 || !Array.isArray(d.index)) {
      SS.toast('Diese Backup-Fassung kenne ich nicht', 3600, 'err'); return;
    }
    let neu = 0;
    for (const m of d.index) {
      if (!m || !m.id || !d.daten[m.id]) continue;
      if (!meta(m.id)) { P.index.push(m); neu++; }
      SS.dbPut('projekt:' + m.id, d.daten[m.id]);
    }
    P.index.sort((a, b) => (b.wann || 0) - (a.wann || 0));
    indexMerken(); raster();
    SS.toast(neu + ' Projekte wiederhergestellt', 3000, 'ok');
  }

  /* ------------------------------------------------------------- Bedienung */
  const panel = document.getElementById('panel-project');
  if (!panel) return;

  const box = document.createElement('div');
  box.id = 'projekteBox';
  box.innerHTML =
    '<h3 style="margin:4px 0 6px">Deine Projekte</h3>' +
    '<div class="ctl" id="pjKopf" style="display:block"></div>' +
    '<div class="ctl"><span>Name</span><input type="text" id="pjName" style="flex:1"></div>' +
    '<div class="ctl"><span>Geplant für</span><input type="date" id="pjDatum" style="flex:1"></div>' +
    '<div class="ctl"><span>Serie</span><input type="text" id="pjSerie" style="flex:1" placeholder="z. B. 30 Tage Innere Ruhe"></div>' +
    '<div class="chips">' +
      '<button id="pjNeu">Neues Projekt</button>' +
      '<button id="pjDup">Duplizieren</button>' +
      '<button id="pjPlaner">Profil-Planer …</button>' +
    '</div>' +
    '<div class="grid tpl-grid" id="pjGrid"></div>' +
    '<h3 style="margin:14px 0 6px">Kalender</h3>' +
    '<div id="pjKalender"></div>' +
    '<div class="chips" style="margin-top:10px">' +
      '<button id="pjBackup">Alle als Datei sichern</button>' +
      '<button id="pjRestore">Wiederherstellen …</button>' +
    '</div>' +
    '<input type="file" id="pjRestoreFile" accept=".json,application/json" style="display:none">' +
    '<p class="hint">Antippen öffnet ein Projekt, langes Drücken löscht es. Das offene Projekt ' +
    'wird beim Arbeiten automatisch mitgesichert. Die Datei-Sicherung ist dein Backup und ' +
    'der Umzugsweg zwischen Geräten.</p>';
  panel.insertBefore(box, panel.firstChild.nextSibling);

  const $ = (id) => document.getElementById(id);

  function kopf() {
    const m = meta(P.aktuellId);
    $('pjKopf').innerHTML = m
      ? '<span style="opacity:.75;font-size:13px">Offen: <b>' + m.name + '</b></span>'
      : '<span style="opacity:.75;font-size:13px">Die offene Szene gehört noch zu keinem Projekt – „Neues Projekt" nimmt sie auf.</span>';
    $('pjName').value = m ? m.name : '';
    $('pjDatum').value = m && m.geplant ? m.geplant : '';
    $('pjSerie').value = m ? (m.serie || '') : '';
  }

  function datumSchoen(d) {
    if (!d) return '';
    const t = new Date(d + 'T12:00:00');
    if (isNaN(t)) return d;
    return ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][t.getDay()] + ' ' +
      String(t.getDate()).padStart(2, '0') + '.' + String(t.getMonth() + 1).padStart(2, '0') + '.';
  }

  function raster() {
    const g = $('pjGrid');
    if (!g) return;
    g.innerHTML = '';
    if (!P.index.length) {
      const p = document.createElement('p');
      p.className = 'hint'; p.style.gridColumn = '1 / -1';
      p.textContent = 'Noch keine Projekte.';
      g.appendChild(p);
    }
    for (const m of P.index) {
      const sw = document.createElement('button');
      sw.className = 'swatch';
      if (m.id === P.aktuellId) sw.style.outline = '2px solid var(--acc, #e05a46)';
      if (m.thumb) {
        const img = document.createElement('img');
        img.src = m.thumb;
        img.style.cssText = 'width:100%;aspect-ratio:135/168;object-fit:cover;display:block';
        sw.appendChild(img);
      } else {
        const cv = document.createElement('canvas');
        cv.width = 135; cv.height = 168;
        cv.getContext('2d').fillStyle = '#3a3733';
        cv.getContext('2d').fillRect(0, 0, 135, 168);
        sw.appendChild(cv);
      }
      const lb = document.createElement('label');
      lb.textContent = (m.geplant ? datumSchoen(m.geplant) + ' · ' : '') + m.name;
      sw.appendChild(lb);
      sw.title = m.name + (m.serie ? ' – ' + m.serie : '') + '. Lange drücken zum Löschen.';
      let lang = false, timer = null;
      sw.onclick = () => { if (!lang) P.oeffnen(m.id); lang = false; };
      sw.addEventListener('pointerdown', () => {
        timer = setTimeout(() => { timer = null; lang = true; P.loeschen(m.id); }, 750);
      });
      const abbr = () => { if (timer) { clearTimeout(timer); timer = null; } };
      sw.addEventListener('pointerup', abbr);
      sw.addEventListener('pointerleave', abbr);
      sw.addEventListener('contextmenu', (e) => { e.preventDefault(); P.loeschen(m.id); });
      g.appendChild(sw);
    }
    kalender();
  }

  function kalender() {
    const k = $('pjKalender');
    if (!k) return;
    const geplant = P.index.filter(m => m.geplant).sort((a, b) => a.geplant.localeCompare(b.geplant));
    if (!geplant.length) {
      k.innerHTML = '<p class="hint" style="margin:0">Nichts geplant – gib Projekten oben ein Datum.</p>';
      return;
    }
    k.innerHTML = geplant.map(m =>
      '<div class="ctl" style="cursor:pointer" data-id="' + m.id + '">' +
      '<span style="min-width:74px">' + datumSchoen(m.geplant) + '</span>' +
      '<span style="flex:1">' + m.name + (m.serie ? ' <em style="opacity:.6">· ' + m.serie + '</em>' : '') + '</span>' +
      '</div>').join('');
    k.querySelectorAll('[data-id]').forEach(z => {
      z.onclick = () => P.oeffnen(z.dataset.id);
    });
  }

  /* Profil-Planer: die geplanten Projekte als kuenftiges Profilraster. */
  function planer() {
    P.sichernAktuell();
    const geplant = P.index.filter(m => m.thumb)
      .sort((a, b) => (b.geplant || '9999').localeCompare(a.geplant || '9999') || (b.wann - a.wann));
    if (!geplant.length) { SS.toast('Noch keine Projekte mit Vorschaubild', 2800, 'warn'); return; }
    let d = document.getElementById('planerDlg');
    if (!d) {
      d = document.createElement('div');
      d.id = 'planerDlg';
      d.className = 'modal hidden';
      d.innerHTML = '<div class="modal-card" style="max-width:440px">' +
        '<div class="sort-head"><h3>Dein künftiges Profil</h3><button id="plClose">✕</button></div>' +
        '<div id="plRaster" style="display:grid;grid-template-columns:repeat(3,1fr);gap:3px;background:#101012;padding:10px;border-radius:10px"></div>' +
        '<p class="hint">Jüngstes geplantes Datum oben links – so wird dein Raster aussehen, ' +
        'wenn alles gepostet ist. Kacheln zeigen den 3:4-Beschnitt.</p></div>';
      document.body.appendChild(d);
      d.querySelector('#plClose').onclick = () => d.classList.add('hidden');
      d.addEventListener('pointerdown', (e) => { if (e.target === d) d.classList.add('hidden'); });
    }
    const r = d.querySelector('#plRaster');
    r.innerHTML = '';
    geplant.slice(0, 12).forEach(m => {
      const z = document.createElement('div');
      z.style.cssText = 'aspect-ratio:3/4;overflow:hidden;position:relative';
      /* 135x168 (4:5) mittig auf 3:4 beschneiden: leicht hineinzoomen */
      z.innerHTML = '<img src="' + m.thumb + '" style="position:absolute;left:50%;top:50%;' +
        'transform:translate(-50%,-50%);height:100%;width:auto" title="' + m.name + '">';
      r.appendChild(z);
    });
    d.classList.remove('hidden');
  }

  $('pjNeu').onclick = () => {
    /* Die offene Szene wird zum ersten Projekt, wenn sie noch keins hat –
       sonst faengt ein leeres an. */
    const nimmSzene = !P.aktuellId && SS.state.elements.length > 0;
    P.neu('', { szeneBehalten: nimmSzene });
    raster();
  };
  $('pjDup').onclick = () => { if (P.aktuellId) P.duplizieren(P.aktuellId); };
  $('pjPlaner').onclick = planer;
  $('pjName').addEventListener('change', () => {
    const m = meta(P.aktuellId); if (!m) return;
    m.name = $('pjName').value.trim() || m.name;
    indexMerken(); kopf(); raster();
  });
  $('pjDatum').addEventListener('change', () => {
    const m = meta(P.aktuellId); if (!m) return;
    m.geplant = $('pjDatum').value || '';
    indexMerken(); raster();
  });
  $('pjSerie').addEventListener('change', () => {
    const m = meta(P.aktuellId); if (!m) return;
    m.serie = $('pjSerie').value.trim();
    indexMerken(); raster();
  });
  $('pjBackup').onclick = async () => {
    const blob = new Blob([await backupBauen()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Seamless_Projekte.ssprojekte.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 9000);
  };
  $('pjRestore').onclick = () => $('pjRestoreFile').click();
  $('pjRestoreFile').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (f) backupLaden(await f.text());
  });

  /* Start: Index laden, Oberflaeche fuellen. Die Szene selbst stellt der
     bestehende Autosave wieder her – hier nur die Verwaltung darum. */
  indexLaden().then(() => { kopf(); raster(); });

  SS.PROJEKTE7 = { bereit: true };
})();
