/* Seamless Studio – Eigene Sticker-Bibliothek
   ============================================================================
   Einmal freistellen, fuer immer benutzen: das ausgewaehlte Foto (oder der
   Freisteller, oder das Logo) wird verkleinert (max. 512 px) dauerhaft
   gespeichert und steht ab dann als Kachel bereit – ein Tipp legt es in die
   aktuelle Slide. Technisch sind es Foto-Elemente ohne Rahmen; gespeichert
   wird in localStorage (max. 20 Stueck, damit der Speicher nicht kippt).
   ========================================================================= */

(function () {
  if (!SS.ui || typeof SS.loadImageURL !== 'function') return;

  let bib = [];
  try { bib = JSON.parse(localStorage.getItem('ss-stickerbib') || '[]'); } catch (e) {}
  function merken() {
    try { localStorage.setItem('ss-stickerbib', JSON.stringify(bib)); }
    catch (e) { SS.toast('Speicher voll – bitte einen alten Sticker löschen', 4200, 'err'); }
  }

  /* Auswahl -> verkleinertes PNG (Transparenz bleibt erhalten) */
  function auswahlSichern() {
    const ids = SS.state.selectedIds || [];
    const el = SS.state.elements.find(e => ids.includes(e.id) && e.type === 'photo');
    if (!el) { SS.toast('Erst ein Foto oder einen Freisteller auswählen', 3000, 'warn'); return; }
    const rec = SS.images[el.imgId];
    if (!rec || !rec.img) { SS.toast('Bilddaten nicht gefunden', 2800, 'err'); return; }
    const q = rec.img;
    const qw = q.width || q.naturalWidth, qh = q.height || q.naturalHeight;
    const s = Math.min(1, 512 / Math.max(qw, qh));
    const cv = SS.makeCanvas(Math.round(qw * s), Math.round(qh * s));
    cv.getContext('2d').drawImage(q, 0, 0, cv.width, cv.height);
    const url = cv.toDataURL('image/png');
    SS.freeCanvas(cv);
    if (url.length > 400000) {
      SS.toast('Das Motiv ist zu komplex zum Speichern – erst freistellen hilft', 3600, 'warn');
      return;
    }
    bib.push({ name: 'Sticker ' + (bib.length + 1), url, wann: Date.now() });
    if (bib.length > 20) bib.shift();
    merken(); raster();
    SS.toast('Im Sticker-Vorrat gesichert', 2400, 'ok');
  }

  async function einfuegen(eintrag) {
    const rec = await SS.loadImageURL(eintrag.url);
    const imgId = 'stb' + Date.now().toString(36);
    SS.images[imgId] = rec;
    const k = SS.canvasSize();
    const mitte = SS.aktuelleSlideMitte ? SS.aktuelleSlideMitte() : { x: k.slideW / 2, y: k.H / 2 };
    const el = SS.normalizeEl({
      id: SS.uid(), type: 'photo', imgId,
      x: mitte.x, y: mitte.y, rot: 0,
      h: Math.min(k.H * 0.28, rec.h || 300),
      flip: false, opacity: 1,
      frame: Object.assign(SS.defaultFrame(), { style: 'none', border: 0, shadow: 0 }),
      filter: SS.defaultFilter(),
    });
    SS.state.elements.push(el);
    SS.state.selectedIds = [el.id];
    SS.pushHistory('Eigener Sticker');
    SS.ui.refreshLayers && SS.ui.refreshLayers();
    SS.ui.showProps && SS.ui.showProps();
    SS.requestRender();
  }

  /* ------------------------------------------------------------ Bedienung */
  const kasten = document.getElementById('markeBox');
  if (!kasten) return;
  const kopf = document.createElement('div');
  kopf.className = 'ctl';
  kopf.style.cssText = 'margin-top:14px;display:block';
  kopf.innerHTML = '<span style="opacity:.75;font-size:13px">Dein Sticker-Vorrat</span>';
  const knopf = document.createElement('button');
  knopf.id = 'stbSichern';
  knopf.className = 'wide';
  knopf.textContent = 'Auswahl als Sticker sichern';
  const grid = document.createElement('div');
  grid.className = 'grid tpl-grid';
  grid.id = 'stbGrid';
  kasten.appendChild(kopf);
  kasten.appendChild(knopf);
  kasten.appendChild(grid);
  knopf.onclick = auswahlSichern;

  function raster() {
    grid.innerHTML = '';
    if (!bib.length) {
      const p = document.createElement('p');
      p.className = 'hint';
      p.style.gridColumn = '1 / -1';
      p.textContent = 'Noch leer – Logo oder Freisteller auswählen und sichern.';
      grid.appendChild(p);
      return;
    }
    bib.forEach((eintrag, i) => {
      const sw = document.createElement('button');
      sw.className = 'swatch';
      const img = document.createElement('img');
      img.src = eintrag.url;
      img.style.cssText = 'width:100%;aspect-ratio:1;object-fit:contain;display:block;background:rgba(127,127,127,.08)';
      sw.appendChild(img);
      const lb = document.createElement('label');
      lb.textContent = eintrag.name;
      sw.appendChild(lb);
      sw.title = 'Antippen legt ihn auf die Slide. Lange drücken löscht.';
      let lang = false, timer = null;
      sw.onclick = () => { if (!lang) einfuegen(eintrag); lang = false; };
      sw.addEventListener('pointerdown', () => {
        timer = setTimeout(() => {
          timer = null; lang = true;
          SS.toast('„' + eintrag.name + '" löschen?', 4200, 'warn',
            { label: 'Löschen', fn: () => { bib.splice(i, 1); merken(); raster(); } });
        }, 750);
      });
      const abbr = () => { if (timer) { clearTimeout(timer); timer = null; } };
      sw.addEventListener('pointerup', abbr);
      sw.addEventListener('pointerleave', abbr);
      grid.appendChild(sw);
    });
  }
  raster();

  SS.STICKERBIB7 = { bereit: true };
})();
