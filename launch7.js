/* Seamless Studio – Launch-Kampagnen-Assistent
   ============================================================================
   Ein Etsy-Drop soll kein einzelner Post sein, sondern eine kleine Kampagne.
   Ein Formular (Produktname, ein Satz, Datum, optional Preis) – und die App
   legt VIER Projekte in den Kalender (Projektverwaltung, projekte7.js):

     D−5  Teaser        "Bald." – Andeutung, ohne alles zu verraten
     D−1  Countdown     grosse Zahlen, morgen ist es soweit
     D    Launch        das Produkt, Preis-Pill, "Link im Profil"
     D+3  Erinnerung    "Schon entdeckt?" – fuer alle, die es verpasst haben

   Gebaut wird ueber die gemeinsame Szenen-Anwendung (SS.szeneAnwenden);
   vorhandene Fotos der Szene landen auf den Foto-Plaetzen von Teaser und
   Launch. Beitragstexte sind je Projekt vorbefuellt.
   ========================================================================= */

(function () {
  const P = SS.projekte;
  if (!SS.ui || !P || typeof SS.szeneAnwenden !== 'function') return;

  const marke = () => SS.marke || {};

  function T(content, slide, yr, sizeR, o) {
    return Object.assign({
      type: 'text', content, x: slide * 1080 + 540, y: Math.round(1350 * yr),
      size: Math.round(1350 * sizeR), align: 'center', lineHeight: 1.2,
      font: 'Poppins', color: '#2f2a26', bgStyle: 'none',
    }, o || {});
  }
  const titelschrift = () => marke().schriftTitel || 'Playfair Display';

  function datumPlus(iso, tage) {
    const d = new Date(iso + 'T12:00:00');
    d.setDate(d.getDate() + tage);
    return d.toISOString().slice(0, 10);
  }
  function datumSchoen(iso) {
    const d = new Date(iso + 'T12:00:00');
    return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.';
  }

  function kampagne(f) {
    const gold = '#c9a15f';
    const fuss = (n) => Array.from({ length: n }, (_, s) =>
      T('@DEINPROFIL', s, 0.945, 0.017, { letterSpacing: 4, color: '#8a7d6d' }));

    const teaser = {
      name: f.name + ' · Teaser', geplant: datumPlus(f.datum, -5),
      slides: 3, bg: { type: 'preset', id: 'aq-ivory-2' },
      plaetze: [{ x: 540, y: 640, h: 760, rot: -4, frame: { style: 'polaroid-w' } }],
      andere: [
        T('BALD BEI ' + (marke().handle || '@DEINPROFIL').replace('@', '').toUpperCase(), 0, 0.14, 0.019, { letterSpacing: 7, color: '#a29380' }),
        T('Es entsteht\netwas Neues …', 1, 0.40, 0.070, { font: titelschrift() }),
        T(f.satz || 'Etwas, das dir gut tun wird.', 1, 0.60, 0.028, { font: 'Cormorant Garamond', italic: true, color: '#5a4f42' }),
        T('AM ' + datumSchoen(f.datum) + ' ERFÄHRST DU ES →', 2, 0.42, 0.026, { letterSpacing: 4 }),
        T('Stell dir eine Erinnerung 🔔', 2, 0.52, 0.022, { color: '#8a7d6d' }),
      ].concat(fuss(3)),
      beitrag: { geschichte: 'Hinter den Kulissen entsteht etwas Neues – am ' + datumSchoen(f.datum) + ' zeige ich es dir.', hashtags: marke().hashtags || '' },
    };

    const countdown = {
      name: f.name + ' · Countdown', geplant: datumPlus(f.datum, -1),
      slides: 3, bg: { type: 'preset', id: 'tx-leinen-1' },
      plaetze: [],
      andere: [
        T('NOCH', 0, 0.30, 0.030, { letterSpacing: 10, color: '#a29380' }),
        T('1', 0, 0.42, 0.30, { font: 'Anton', color: gold }),
        T('TAG', 0, 0.76, 0.030, { letterSpacing: 10, color: '#a29380' }),
        T('Morgen um diese Zeit\nist es online.', 1, 0.42, 0.058, { font: titelschrift() }),
        T(f.name, 2, 0.40, 0.052, { font: titelschrift() }),
        T('AB MORGEN · LINK IM PROFIL', 2, 0.56, 0.024, { letterSpacing: 4, color: '#8a7d6d' }),
      ].concat(fuss(3)),
      beitrag: { geschichte: 'Noch ein Tag – morgen geht „' + f.name + '" online.', hashtags: marke().hashtags || '' },
    };

    const launch = {
      name: f.name + ' · Launch', geplant: f.datum,
      slides: 4, bg: { type: 'preset', id: 'aq-ivory-1' },
      plaetze: [
        { x: 1080 + 540, y: 660, h: 860, rot: -3, frame: { style: 'polaroid-w' } },
        { x: 2160 + 540, y: 660, h: 860, rot: 4, frame: { style: 'polaroid-w' } },
      ],
      andere: [
        T('ES IST DA', 0, 0.20, 0.022, { letterSpacing: 8, color: '#a29380' }),
        T(f.name, 0, 0.40, 0.070, { font: titelschrift() }),
        T(f.satz || '', 0, 0.60, 0.026, { font: 'Cormorant Garamond', italic: true, color: '#5a4f42' }),
        f.preis ? T(f.preis, 3, 0.36, 0.034, { bgStyle: 'pill', bgColor: '#F6EEDC', bgAlpha: 0.95, color: '#2b241d' }) : null,
        T('Jetzt im Shop – Link im Profil', 3, 0.50, 0.030, { font: titelschrift(), italic: true }),
        T('🔖 Speichern · 📤 Einer Freundin schicken', 3, 0.62, 0.022, { color: '#8a7d6d' }),
      ].filter(Boolean).concat(fuss(4)),
      beitrag: { geschichte: '„' + f.name + '" ist ab heute online. ' + (f.satz || ''), hashtags: marke().hashtags || '' },
    };

    const erinnerung = {
      name: f.name + ' · Erinnerung', geplant: datumPlus(f.datum, 3),
      slides: 2, bg: { type: 'preset', id: 'tx-leinen-0' },
      plaetze: [{ x: 540, y: 620, h: 780, rot: 3, frame: { style: 'washi' } }],
      andere: [
        T('SCHON ENTDECKT?', 0, 0.15, 0.020, { letterSpacing: 7, color: '#a29380' }),
        T('Falls du es\nverpasst hast:', 1, 0.36, 0.058, { font: titelschrift() }),
        T('„' + f.name + '" wartet im Shop auf dich.', 1, 0.54, 0.026 ),
        T('LINK IM PROFIL →', 1, 0.64, 0.022, { letterSpacing: 4, color: '#8a7d6d' }),
      ].concat(fuss(2)),
      beitrag: { geschichte: 'Kleiner Reminder: „' + f.name + '" ist online – falls die Woche voll war.', hashtags: marke().hashtags || '' },
    };

    return [teaser, countdown, launch, erinnerung];
  }

  async function anlegen(f) {
    const vorherId = P.aktuellId;
    const teile = kampagne(f);
    for (const t of teile) {
      await P.neu(t.name, {});
      await SS.szeneAnwenden({ name: t.name, still: true, format: '4:5',
        slides: t.slides, bg: t.bg, video: null, plaetze: t.plaetze, andere: t.andere });
      const k = SS.canvasSize();
      SS.state.elements.forEach(el => SS.textUmbrechen && SS.textUmbrechen(el, k.slideW * 0.86));
      const m = P.index.find(x => x.id === P.aktuellId);
      if (m) { m.geplant = t.geplant; m.serie = 'Launch: ' + f.name; m.beitrag = t.beitrag; }
      P.sichernAktuell();
    }
    if (vorherId) await P.oeffnen(vorherId);
    SS.toast('Kampagne angelegt: 4 Projekte im Kalender (Teaser, Countdown, Launch, Erinnerung)', 4600, 'ok');
  }

  /* ------------------------------------------------------------- Dialog */
  function dialog() {
    let d = document.getElementById('lchDlg');
    if (d) d.remove();
    d = document.createElement('div');
    d.id = 'lchDlg';
    d.className = 'modal';
    const heute = new Date();
    heute.setDate(heute.getDate() + 7);
    const vorschlag = heute.toISOString().slice(0, 10);
    d.innerHTML = '<div class="modal-card" style="max-width:420px">' +
      '<div class="sort-head"><h3>Launch planen</h3><button id="lcClose">✕</button></div>' +
      '<div class="ctl"><span>Produkt</span><input type="text" id="lcName" style="flex:1" placeholder="z. B. Mondphasen-Journal"></div>' +
      '<div class="ctl"><span>Ein Satz</span><input type="text" id="lcSatz" style="flex:1" placeholder="Was macht es besonders?"></div>' +
      '<div class="ctl"><span>Launch-Tag</span><input type="date" id="lcDatum" value="' + vorschlag + '" style="flex:1"></div>' +
      '<div class="ctl"><span>Preis</span><input type="text" id="lcPreis" style="flex:1" placeholder="z. B. 9,99 € (optional)"></div>' +
      '<button id="lcGo" class="wide primary" style="margin-top:10px">Kampagne anlegen (4 Projekte)</button>' +
      '<p class="hint">Teaser (5 Tage vorher), Countdown (1 Tag vorher), Launch, Erinnerung (3 Tage danach) – ' +
      'alle landen im Kalender. Fotos der offenen Szene wandern auf die Bild-Plätze von Teaser und Launch.</p></div>';
    document.body.appendChild(d);
    d.querySelector('#lcClose').onclick = () => d.remove();
    d.addEventListener('pointerdown', (e) => { if (e.target === d) d.remove(); });
    d.querySelector('#lcGo').onclick = async () => {
      const f = { name: d.querySelector('#lcName').value.trim(),
                  satz: d.querySelector('#lcSatz').value.trim(),
                  datum: d.querySelector('#lcDatum').value,
                  preis: d.querySelector('#lcPreis').value.trim() };
      if (!f.name || !f.datum) { SS.toast('Produktname und Datum sind nötig', 3000, 'warn'); return; }
      const go = d.querySelector('#lcGo');
      go.disabled = true; go.textContent = 'Legt an …';
      await anlegen(f);
      d.remove();
    };
  }

  const box = document.getElementById('projekteBox');
  if (box) {
    const kn = document.createElement('button');
    kn.id = 'btnLaunch';
    kn.className = 'wide';
    kn.textContent = 'Launch planen … (4-Beiträge-Kampagne)';
    const hinweis = box.querySelector('p.hint');
    box.insertBefore(kn, hinweis);
    kn.onclick = dialog;
  }

  SS.LAUNCH7 = { bereit: true, anlegen };
})();
