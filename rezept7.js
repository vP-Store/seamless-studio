/* Seamless Studio – Das Rezeptformat (.ssrezept.json)
   ============================================================================
   Ein Rezept ist ein komplettes Karussell als kleine Textdatei – ohne Fotos:
   Format, Slides, Hintergrund, alle Texte/Sticker, Foto-Plaetze und die
   Beitragsdaten (Hook, Geschichte, Hashtags, Alt-Texte). Damit koennen
   Dateien Beitraege transportieren: Claude liefert ganze Serien, der
   Launch-Assistent legt Kampagnen an, Vorlagen-Packs reisen zu Kaeufern.

   Fassung 1. Die Fassungsnummer steht in jeder Datei ('ssrezept': 1);
   unbekannte Fassungen werden abgelehnt statt still falsch gelesen.
   Unbekannte Sticker-/Animations-IDs werden weggelassen und gezaehlt.

   Bedienung im Projekt-Panel: "Rezepte oeffnen ..." (eine Datei -> in die
   offene Szene; mehrere -> je ein Projekt mit Datum aus der Datei) und
   "Szene als Rezept sichern". Schema-Doku: REZEPT.md im Repo.
   ========================================================================= */

(function () {
  if (!SS.ui || typeof SS.szeneAnwenden !== 'function' || typeof SS.szeneEinfrieren !== 'function') return;
  const P = SS.projekte;

  /* ------------------------------------------------------------ Sichern */
  SS.rezeptVonSzene = function (metaExtra) {
    const v = SS.szeneEinfrieren();
    const m = P && P.index.find(x => x.id === P.aktuellId);
    return {
      ssrezept: 1,
      meta: Object.assign({
        name: (m && m.name) || 'Beitrag',
        serie: (m && m.serie) || '',
        geplant: (m && m.geplant) || '',
        sprache: 'de',
      }, metaExtra || {}),
      format: v.format, slides: v.slides, bg: v.bg, video: v.video,
      fotoPlaetze: v.plaetze, elemente: v.andere,
      beitrag: (m && m.beitrag) || null,
    };
  };

  /* ------------------------------------------------------------- Pruefen */
  function pruefen(d) {
    if (!d || typeof d !== 'object') return 'keine lesbare Datei';
    if (d.ssrezept !== 1) return 'Rezept-Fassung ' + d.ssrezept + ' kenne ich nicht – bitte App aktualisieren';
    if (!Array.isArray(d.elemente)) return 'es fehlen die Elemente';
    if (d.slides && (d.slides < 1 || d.slides > 20)) return 'unmögliche Slidezahl';
    return null;
  }

  /* Unbekannte IDs aussortieren – ehrlich gezaehlt. */
  function saeubern(d) {
    let weg = 0;
    const elemente = [];
    for (const e of d.elemente) {
      if (!e || !e.type) { weg++; continue; }
      if (e.type === 'sticker' && !(SS.stickerDef && SS.stickerDef(e.kind))) { weg++; continue; }
      if (e.anim && e.anim !== 'none' && !SS.ANIM_BY_ID[e.anim]) e.anim = 'none';
      elemente.push(e);
    }
    if (d.bg && d.bg.type === 'preset' && SS.BG_LIB && !SS.BG_LIB.some(b => b.id === d.bg.id)) {
      d.bg = null; weg++;
    }
    return { elemente, weg };
  }

  /* Texte, die breiter sind als ihre Slide, mehrzeilig umbrechen. Rezepte
     duerfen Fliesstext ohne \n liefern – die App bricht nicht von selbst um,
     also machen wir es hier: gierig Wort fuer Wort, gemessen mit
     SS.measureText. */
  function umbrechen(el, maxB) {
    if (el.type !== 'text' || !el.content || el.content.indexOf('\n') >= 0) return;
    const m = SS.measureText && SS.measureText(el);
    if (!m || !isFinite(m.w) || m.w <= maxB) return;
    const woerter = el.content.split(' ');
    if (woerter.length < 2) return;
    const probe = Object.assign({}, el);
    const passt = (t) => {
      probe.content = t;
      const pm = SS.measureText(probe);
      return pm && pm.w <= maxB;
    };
    const zeilen = [];
    let zeile = woerter[0];
    for (let i = 1; i < woerter.length; i++) {
      const mit = zeile + ' ' + woerter[i];
      if (passt(mit)) zeile = mit;
      else { zeilen.push(zeile); zeile = woerter[i]; }
    }
    zeilen.push(zeile);
    el.content = zeilen.join('\n');
    SS.invalidateEl && SS.invalidateEl(el);
  }

  async function inSzene(d, still) {
    const s = saeubern(d);
    const vorher = new Set(SS.state.elements.map(e => e.id));
    await SS.szeneAnwenden({
      name: d.meta && d.meta.name, still: !!still,
      format: d.format, slides: d.slides, bg: d.bg, video: d.video,
      plaetze: d.fotoPlaetze || [], andere: s.elemente,
    });
    try {
      const k = SS.canvasSize();
      for (const el of SS.state.elements) {
        if (!vorher.has(el.id)) umbrechen(el, k.slideW * 0.86);
      }
      SS.requestRender && SS.requestRender();
    } catch (e) {}
    if (P && P.aktuellId) {
      const m = P.index.find(x => x.id === P.aktuellId);
      if (m && d.beitrag) { m.beitrag = d.beitrag; }
      if (m && d.meta) {
        if (d.meta.serie) m.serie = d.meta.serie;
        if (d.meta.geplant) m.geplant = d.meta.geplant;
      }
    }
    return s.weg;
  }

  /* ------------------------------------------------------------ Oeffnen */
  async function oeffnen(dateien) {
    const gelesen = [];
    for (const f of dateien) {
      try {
        const d = JSON.parse(await f.text());
        const fehler = pruefen(d);
        if (fehler) { SS.toast(f.name + ': ' + fehler, 4200, 'err'); continue; }
        gelesen.push(d);
      } catch (e) { SS.toast(f.name + ': keine lesbare Datei', 3600, 'err'); }
    }
    if (!gelesen.length) return;

    if (gelesen.length === 1 && !(P && P.bereit)) {
      const weg = await inSzene(gelesen[0]);
      if (weg) SS.toast(weg + ' unbekannte Bausteine weggelassen', 3200, 'warn');
      return;
    }

    if (gelesen.length === 1) {
      /* Ein Rezept -> eigenes Projekt, direkt geoeffnet. */
      await P.neu(gelesen[0].meta && gelesen[0].meta.name || 'Rezept', {});
      const weg = await inSzene(gelesen[0]);
      P.sichernAktuell();
      SS.toast('Rezept angewendet' + (weg ? ' – ' + weg + ' Bausteine weggelassen' : ''), 3000, 'ok');
      return;
    }

    /* Mehrere Rezepte -> je ein Projekt anlegen, die Szene von vorher
       kommt am Ende zurueck. */
    P.sichernAktuell();
    const vorherId = P.aktuellId;
    let weg = 0;
    for (const d of gelesen) {
      await P.neu((d.meta && d.meta.name) || 'Rezept', {});
      weg += await inSzene(d, true);
      P.sichernAktuell();
    }
    if (vorherId) await P.oeffnen(vorherId);
    SS.toast(gelesen.length + ' Rezepte als Projekte angelegt – siehe Kalender', 4200, 'ok');
    if (weg) SS.toast(weg + ' unbekannte Bausteine weggelassen', 3200, 'warn');
  }

  /* Beitragsdaten aus dem Rezept in den Beitragstext einweben. */
  if (typeof SS.beitragstext === 'function') {
    const alt = SS.beitragstext;
    SS.beitragstext = function () {
      let text = alt.apply(this, arguments);
      const m = P && P.index.find(x => x.id === P.aktuellId);
      const b = m && m.beitrag;
      if (b) {
        if (b.geschichte) {
          text = text.replace('[Hier deine Geschichte in 2–3 Sätzen – warum das Thema dich etwas angeht.]',
            b.geschichte);
        }
        if (b.hashtags && text.indexOf(b.hashtags) < 0) {
          text = text.replace('ALT-TEXTE', b.hashtags + '\r\n\r\nALT-TEXTE');
        }
      }
      return text;
    };
  }

  /* ------------------------------------------------------------ Bedienung */
  const box = document.getElementById('projekteBox');
  if (!box) return;
  const reihe = document.createElement('div');
  reihe.className = 'chips';
  reihe.innerHTML =
    '<button id="rzOeffnen">Rezepte öffnen …</button>' +
    '<button id="rzSichern">Szene als Rezept sichern</button>';
  const hinweis = box.querySelector('p.hint');
  box.insertBefore(reihe, hinweis);
  const inp = document.createElement('input');
  inp.type = 'file'; inp.id = 'rzDatei'; inp.multiple = true;
  inp.accept = '.json,application/json'; inp.style.display = 'none';
  box.appendChild(inp);

  document.getElementById('rzOeffnen').onclick = () => inp.click();
  inp.addEventListener('change', (e) => {
    const dateien = [...e.target.files];
    e.target.value = '';
    if (dateien.length) oeffnen(dateien);
  });
  document.getElementById('rzSichern').onclick = () => {
    const d = SS.rezeptVonSzene();
    const blob = new Blob([JSON.stringify(d, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (d.meta.name || 'Beitrag').replace(/[^\wäöüÄÖÜß -]/g, '') + '.ssrezept.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 9000);
  };

  SS.rezeptOeffnen = oeffnen;
  SS.REZEPT7 = { bereit: true, fassung: 1 };
})();
