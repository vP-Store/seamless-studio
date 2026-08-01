/* Seamless Studio – Zweisprachen-Modus (DE | EN)
   ============================================================================
   Scotts Etsy-Publikum ist international, sein Instagram deutsch. Jeder Text
   kann eine englische Fassung tragen (Feld im Eigenschaftsblatt); ein
   Schalter tauscht die Sprache auf der ganzen Leinwand.

   Der Tausch ist SYMMETRISCH und damit verlustfrei: `content` haelt immer
   die angezeigte Fassung, `contentAlt` die jeweils andere. Beide Felder
   haengen am Element und wandern automatisch durch serialize/restore,
   Autosave, Projekte und Rezepte. Undo funktioniert wie immer.

   Dazu: "Beide Sprachen exportieren" – ein ZIP mit DE/- und EN/-Slides.
   ========================================================================= */

(function () {
  if (!SS.ui) return;

  SS.sprache = SS.sprache || { anzeige: 'de' };

  function texte() {
    return SS.state.elements.filter(e => (e.type === 'text' || e.type === 'pathtext') && !e._wz);
  }

  function tauschen() {
    let getauscht = 0;
    for (const t of texte()) {
      if (typeof t.contentAlt !== 'string' || !t.contentAlt.trim()) continue;
      const merk = t.content;
      t.content = t.contentAlt;
      t.contentAlt = merk;
      SS.invalidateEl && SS.invalidateEl(t);
      getauscht++;
    }
    SS.sprache.anzeige = SS.sprache.anzeige === 'de' ? 'en' : 'de';
    const m = SS.projekte && SS.projekte.index.find(x => x.id === SS.projekte.aktuellId);
    if (m) m.sprache = SS.sprache.anzeige;
    SS.pushHistory('Sprache: ' + SS.sprache.anzeige.toUpperCase());
    SS.requestRender();
    schalterMalen();
    if (!getauscht) {
      SS.toast('Noch keine englischen Fassungen – trage sie im Eigenschaftsblatt eines Textes ein', 4200, 'warn');
    } else {
      SS.toast(getauscht + ' Texte auf ' + SS.sprache.anzeige.toUpperCase() + ' getauscht', 2400, 'ok');
    }
  }

  /* --------------------------------------- Feld im Eigenschaftsblatt */
  if (typeof SS.ui.showProps === 'function') {
    const alt = SS.ui.showProps;
    SS.ui.showProps = function () {
      const r = alt.apply(this, arguments);
      try {
        const ids = SS.state.selectedIds || [];
        if (ids.length !== 1) return r;
        const el = SS.state.elements.find(e => e.id === ids[0]);
        if (!el || (el.type !== 'text' && el.type !== 'pathtext')) return r;
        const body = document.getElementById('propsBody');
        if (!body || body.querySelector('#spAltFeld')) return r;
        const zeile = document.createElement('div');
        zeile.className = 'ctl';
        zeile.style.display = 'block';
        const andere = SS.sprache.anzeige === 'de' ? 'Englisch' : 'Deutsch';
        zeile.innerHTML = '<span style="opacity:.7;font-size:12px">' + andere +
          ' (für den Sprachschalter im Projekt-Tab)</span>' +
          '<textarea id="spAltFeld" rows="2" style="width:100%;resize:vertical"></textarea>';
        body.appendChild(zeile);
        const feld = zeile.querySelector('#spAltFeld');
        feld.value = el.contentAlt || '';
        feld.addEventListener('change', () => {
          el.contentAlt = feld.value;
          SS.pushHistory('Zweitsprache');
        });
      } catch (e) {}
      return r;
    };
  }

  /* ------------------------------------------- Beide Sprachen exportieren */
  async function beideExportieren() {
    const habenAlt = texte().some(t => t.contentAlt && t.contentAlt.trim());
    if (!habenAlt) { SS.toast('Erst englische Fassungen eintragen', 3200, 'warn'); return; }
    const zip = new JSZip();
    const wurzel = zip.folder('Zwei_Sprachen');
    const jetzt = SS.sprache.anzeige.toUpperCase();
    const andere = jetzt === 'DE' ? 'EN' : 'DE';
    const r1 = await SS.renderSlides(1, 'jpeg');
    const f1 = wurzel.folder(jetzt);
    r1.blobs.forEach((b, i) => f1.file('Slide_' + String(i + 1).padStart(2, '0') + '.jpg', b));
    tauschen();
    try {
      const r2 = await SS.renderSlides(1, 'jpeg');
      const f2 = wurzel.folder(andere);
      r2.blobs.forEach((b, i) => f2.file('Slide_' + String(i + 1).padStart(2, '0') + '.jpg', b));
    } finally { tauschen(); }
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Beide_Sprachen.zip';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 9000);
    SS.toast('ZIP mit DE- und EN-Slides liegt in den Downloads', 3400, 'ok');
  }

  /* ------------------------------------------------------------ Bedienung */
  let schalterMalen = () => {};
  const box = document.getElementById('projekteBox');
  if (box) {
    const kopf = document.createElement('div');
    kopf.className = 'ctl';
    kopf.style.cssText = 'margin-top:12px;display:block';
    kopf.innerHTML = '<span style="opacity:.75;font-size:13px">Sprache</span>';
    const reihe = document.createElement('div');
    reihe.className = 'chips';
    reihe.id = 'spChips';
    const hinweis = box.querySelector('p.hint');
    box.insertBefore(kopf, hinweis);
    box.insertBefore(reihe, hinweis);

    schalterMalen = function () {
      reihe.innerHTML = '';
      [['de', 'Deutsch'], ['en', 'English']].forEach(([id, name]) => {
        const b = document.createElement('button');
        b.textContent = name;
        if (SS.sprache.anzeige === id) b.classList.add('sel');
        b.onclick = () => { if (SS.sprache.anzeige !== id) tauschen(); };
        reihe.appendChild(b);
      });
      const ex = document.createElement('button');
      ex.textContent = 'Beide exportieren';
      ex.onclick = beideExportieren;
      reihe.appendChild(ex);
    };
    schalterMalen();
  }

  SS.SPRACHE7 = { bereit: true, tauschen, beideExportieren };
})();
