/* Seamless Studio – Orakel-Formate
   ============================================================================
   Die App lernt Scotts Kerngeschaeft kennen: Kartendecks.

   1. "ZIEH EINE KARTE": Slide 1 laedt ein ("Atme ein und wische, wenn du
      bereit bist"), dann liegt je Slide eine Karte aus den geladenen
      Fotos, der Abschluss fragt nach der gezogenen Nummer – Kommentare
      garantiert.

   2. "TAGESKARTEN-SERIE": aus den geladenen Kartenbildern wird je Karte ein
      eigenes Projekt im Kalender (taeglich ab Wunschdatum) – Kartenbild,
      Titel, Platz fuer die Bedeutung, Handle. Ein Deck = ein Monat Content,
      und jeder Beitrag wirbt fuer das Produkt, aus dem er stammt.
   ========================================================================= */

(function () {
  const P = SS.projekte;
  if (!SS.ui || typeof SS.textUmbrechen !== 'function') return;

  const marke = () => SS.marke || {};

  function textEl(o) {
    return SS.normalizeEl(Object.assign({
      id: SS.uid(), type: 'text', align: 'center',
      color: '#2f2a26', bgStyle: 'none', lineHeight: 1.25,
    }, o));
  }
  function slidesSetzen(n) {
    const plus = document.getElementById('slidesPlus');
    const minus = document.getElementById('slidesMinus');
    let schutz = 0;
    while (SS.state.slides < n && schutz++ < 40) plus.click();
    while (SS.state.slides > n && schutz++ < 80) minus.click();
  }
  function kartenFotos() {
    return SS.state.elements.filter(e => e.type === 'photo' && !e.hidden);
  }

  /* ------------------------------------------------ 1. Zieh eine Karte */
  function ziehenBauen() {
    const karten = kartenFotos().slice(0, 4);
    if (karten.length < 2) {
      SS.toast('Erst 2–4 Kartenbilder als Fotos hinzufügen', 3400, 'warn');
      return;
    }
    const n = karten.length + 2;
    slidesSetzen(n);
    const k = SS.canvasSize();
    const sw = k.slideW;
    const neu = [];

    neu.push(textEl({ content: 'ZIEH EINE KARTE', x: sw / 2, y: k.H * 0.20,
      size: Math.round(k.H * 0.022), letterSpacing: 8,
      font: marke().schriftText || 'Poppins', color: '#a29380' }));
    neu.push(textEl({ content: 'Atme einmal tief ein.\nWische, wenn du\nbereit bist.',
      x: sw / 2, y: k.H * 0.44, size: Math.round(k.H * 0.062),
      font: marke().schriftTitel || 'Playfair Display', lineHeight: 1.22 }));
    neu.push(textEl({ content: 'DEINE KARTE FINDET DICH →', x: sw / 2, y: k.H * 0.85,
      size: Math.round(k.H * 0.019), letterSpacing: 5,
      font: marke().schriftText || 'Poppins', color: '#a29380' }));

    karten.forEach((foto, i) => {
      const s = i + 1;
      foto.x = s * sw + sw / 2;
      foto.y = k.H * 0.50;
      foto.h = k.H * 0.62;
      foto.rot = 0;
      if (foto.frame) { foto.frame.style = 'thin'; }
      SS.photoCacheClear && SS.photoCacheClear(foto.id);
      SS.invalidateEl && SS.invalidateEl(foto);
      neu.push(textEl({ content: 'KARTE ' + (s), x: s * sw + sw / 2, y: k.H * 0.115,
        size: Math.round(k.H * 0.020), letterSpacing: 6,
        font: marke().schriftText || 'Poppins', color: '#a29380' }));
    });

    const letzte = n - 1;
    neu.push(textEl({ content: 'Welche hat dich\ngefunden?', x: letzte * sw + sw / 2,
      y: k.H * 0.38, size: Math.round(k.H * 0.062),
      font: marke().schriftTitel || 'Playfair Display', lineHeight: 1.18 }));
    neu.push(textEl({ content: 'Kommentiere ' +
      Array.from({ length: karten.length }, (_, i) => i + 1).join(', ').replace(/, (\d)$/, ' oder $1') +
      ' – die Bedeutung\nschicke ich dir in die Antworten 🤍',
      x: letzte * sw + sw / 2, y: k.H * 0.60, size: Math.round(k.H * 0.024), lineHeight: 1.45,
      color: '#8a7d6d' }));

    for (let s = 0; s < n; s++) {
      neu.push(textEl({ content: marke().handle || '@DEINPROFIL', x: s * sw + sw / 2,
        y: k.H * 0.945, size: Math.round(k.H * 0.017), letterSpacing: 4, color: '#8a7d6d' }));
    }
    neu.forEach(el => { SS.state.elements.push(el); SS.textUmbrechen(el, sw * 0.84); });
    SS.pushHistory('Zieh eine Karte');
    SS.ui.refreshLayers && SS.ui.refreshLayers();
    SS.ui.zoomFit && SS.ui.zoomFit();
    SS.requestRender();
    SS.toast('„Zieh eine Karte" mit ' + karten.length + ' Karten gebaut', 3200, 'ok');
  }

  /* --------------------------------------------- 2. Tageskarten-Serie */
  async function serieBauen(startDatum, deckName) {
    if (!P) { SS.toast('Projektverwaltung fehlt', 2600, 'err'); return; }
    const karten = kartenFotos();
    if (!karten.length) { SS.toast('Erst Kartenbilder als Fotos hinzufügen', 3200, 'warn'); return; }
    const imgIds = karten.map(f => f.imgId);
    const vorherId = P.aktuellId;
    P.sichernAktuell();

    for (let i = 0; i < imgIds.length; i++) {
      const datum = new Date(startDatum + 'T12:00:00');
      datum.setDate(datum.getDate() + i);
      const iso = datum.toISOString().slice(0, 10);
      await P.neu('Tageskarte ' + (i + 1) + (deckName ? ' · ' + deckName : ''), {});
      slidesSetzen(2);
      const k = SS.canvasSize();
      const sw = k.slideW;
      const foto = SS.normalizeEl({
        id: SS.uid(), type: 'photo', imgId: imgIds[i],
        x: sw / 2, y: k.H * 0.47, rot: 0, h: k.H * 0.58,
        flip: false, opacity: 1,
        frame: Object.assign(SS.defaultFrame(), { style: 'thin' }),
        filter: SS.defaultFilter(),
      });
      SS.state.elements.push(foto);
      const neu = [
        textEl({ content: 'DEINE KARTE FÜR HEUTE', x: sw / 2, y: k.H * 0.10,
          size: Math.round(k.H * 0.020), letterSpacing: 7,
          font: marke().schriftText || 'Poppins', color: '#a29380' }),
        textEl({ content: 'WAS SIE DIR SAGEN WILL →', x: sw / 2, y: k.H * 0.88,
          size: Math.round(k.H * 0.018), letterSpacing: 5,
          font: marke().schriftText || 'Poppins', color: '#a29380' }),
        textEl({ content: '[Hier die Bedeutung der Karte –\nzwei, drei ruhige Sätze.]',
          x: sw + sw / 2, y: k.H * 0.40, size: Math.round(k.H * 0.036),
          font: 'Cormorant Garamond', italic: true, lineHeight: 1.4 }),
        textEl({ content: (deckName ? 'Aus „' + deckName + '" – ' : '') + 'das ganze Deck: Link im Profil',
          x: sw + sw / 2, y: k.H * 0.68, size: Math.round(k.H * 0.021), color: '#8a7d6d' }),
        textEl({ content: marke().handle || '@DEINPROFIL', x: sw / 2, y: k.H * 0.945,
          size: Math.round(k.H * 0.017), letterSpacing: 4, color: '#8a7d6d' }),
        textEl({ content: marke().handle || '@DEINPROFIL', x: sw + sw / 2, y: k.H * 0.945,
          size: Math.round(k.H * 0.017), letterSpacing: 4, color: '#8a7d6d' }),
      ];
      neu.forEach(el => { SS.state.elements.push(el); SS.textUmbrechen(el, sw * 0.84); });
      const m = P.index.find(x => x.id === P.aktuellId);
      if (m) {
        m.geplant = iso;
        m.serie = 'Tageskarten' + (deckName ? ': ' + deckName : '');
        m.beitrag = { geschichte: 'Die Karte von heute – nimm sie als sanften Impuls für deinen Tag.',
          hashtags: marke().hashtags || '' };
      }
      SS.pushHistory('Tageskarte ' + (i + 1));
      P.sichernAktuell();
    }
    if (vorherId) await P.oeffnen(vorherId);
    SS.toast(imgIds.length + ' Tageskarten im Kalender – täglich ab ' + startDatum, 4600, 'ok');
  }

  /* ------------------------------------------------------------- Dialog */
  function dialog() {
    let d = document.getElementById('orDlg');
    if (d) d.remove();
    d = document.createElement('div');
    d.id = 'orDlg';
    d.className = 'modal';
    const morgen = new Date();
    morgen.setDate(morgen.getDate() + 1);
    d.innerHTML = '<div class="modal-card" style="max-width:430px">' +
      '<div class="sort-head"><h3>Orakel-Formate</h3><button id="orClose">✕</button></div>' +
      '<p class="hint">Beide nutzen die Fotos der offenen Szene als Karten (' +
      kartenFotos().length + ' geladen).</p>' +
      '<button id="orZiehen" class="wide primary">„Zieh eine Karte"-Karussell bauen</button>' +
      '<div class="ctl" style="margin-top:12px"><span>Deck</span>' +
      '<input type="text" id="orDeck" style="flex:1" placeholder="Name des Decks (optional)"></div>' +
      '<div class="ctl"><span>Täglich ab</span>' +
      '<input type="date" id="orStart" value="' + morgen.toISOString().slice(0, 10) + '" style="flex:1"></div>' +
      '<button id="orSerie" class="wide">Tageskarten-Serie in den Kalender legen</button>' +
      '<p class="hint">Die Serie macht aus jedem Kartenbild ein eigenes Projekt: Karte auf Slide 1, ' +
      'Bedeutung zum Ausfüllen auf Slide 2 – ein Deck wird ein Monat Content.</p></div>';
    document.body.appendChild(d);
    d.querySelector('#orClose').onclick = () => d.remove();
    d.addEventListener('pointerdown', (e) => { if (e.target === d) d.remove(); });
    d.querySelector('#orZiehen').onclick = () => { d.remove(); ziehenBauen(); };
    d.querySelector('#orSerie').onclick = async () => {
      const start = d.querySelector('#orStart').value;
      const deck = d.querySelector('#orDeck').value.trim();
      if (!start) { SS.toast('Startdatum wählen', 2400, 'warn'); return; }
      const go = d.querySelector('#orSerie');
      go.disabled = true; go.textContent = 'Legt an …';
      await serieBauen(start, deck);
      d.remove();
    };
  }

  const anker = document.getElementById('btnAntwort');
  if (anker && anker.parentElement) {
    const b = document.createElement('button');
    b.id = 'btnOrakel';
    b.textContent = 'Orakel';
    b.onclick = dialog;
    anker.parentElement.appendChild(b);
  }

  SS.ORAKEL7 = { bereit: true, ziehenBauen, serieBauen };
})();
