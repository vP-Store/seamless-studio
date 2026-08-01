/* Seamless Studio – Vorlagen als Produkt
   ============================================================================
   Die "eigenen Vorlagen" (marke7.js) werden zur Ware:

   * EINZELN: jede Vorlage als Datei sichern (.ssvorlage.json, Fassung 1,
     Vorschaubild eingebettet) und fremde Vorlagen-Dateien oeffnen.
   * ALS PACK: Vorlagen ankreuzen -> ZIP mit den Dateien, einer Anleitung
     (deutsch + englisch, mit dem Link zur kostenlosen App) und einem
     Deckblatt-Bild (Collage der Vorschaubildchen, 2000x2000 - das erste
     Produktfoto fuer Etsy).

   Vorlagen enthalten keine Fotos und keine Bilddaten ausser dem kleinen
   Vorschaubild - keine Lizenzfragen. Import prueft die Fassungsnummer.
   ========================================================================= */

(function () {
  if (!SS.ui || typeof SS.szeneAnwenden !== 'function') return;

  const APP_LINK = 'https://vp-store.github.io/seamless-studio/';

  function eigeneLesen() {
    try { return JSON.parse(localStorage.getItem('ss-eigene') || '[]'); }
    catch (e) { return []; }
  }
  function eigeneSchreiben(liste) {
    try { localStorage.setItem('ss-eigene', JSON.stringify(liste)); } catch (e) {}
  }

  /* ------------------------------------------------------------- Einzeln */
  function alsDatei(v) {
    const d = Object.assign({ ssvorlage: 1 }, v);
    const blob = new Blob([JSON.stringify(d, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (v.name || 'Vorlage').replace(/[^\wäöüÄÖÜß -]/g, '') + '.ssvorlage.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 9000);
  }

  async function dateienOeffnen(dateien) {
    let neu = 0;
    for (const f of dateien) {
      try {
        const d = JSON.parse(await f.text());
        if (d.ssvorlage !== 1 || !Array.isArray(d.andere)) {
          SS.toast(f.name + ': keine lesbare Vorlagen-Datei', 3600, 'err');
          continue;
        }
        delete d.ssvorlage;
        d.name = d.name || f.name.replace(/\.ssvorlage\.json$/i, '');
        d.wann = Date.now();
        SS.eigeneVorlageDazu(d);      // sofort im Raster, marke7 sichert mit
        neu++;
      } catch (e) { SS.toast(f.name + ': keine lesbare Datei', 3200, 'err'); }
    }
    if (neu) SS.toast(neu + ' Vorlagen übernommen – sie stehen bei „Deine Vorlagen"', 3600, 'ok');
  }

  /* ---------------------------------------------------------------- Pack */
  function anleitung(deutsch) {
    return deutsch
      ? 'SEAMLESS STUDIO VORLAGEN-PACK\r\n=============================\r\n\r\n' +
        '1. Öffne die kostenlose App im Browser: ' + APP_LINK + '\r\n' +
        '   (funktioniert auf Handy, Tablet und Computer – keine Anmeldung nötig)\r\n' +
        '2. Gehe zum Studio-Tab → „Deine Vorlagen" → „Vorlagen-Datei öffnen".\r\n' +
        '3. Wähle die .ssvorlage.json-Dateien aus diesem Pack aus.\r\n' +
        '4. Lade die App neu – die Vorlagen liegen jetzt in deinem Raster.\r\n' +
        '5. Eigene Fotos hinzufügen, Vorlage antippen – fertig ist dein Karussell.\r\n\r\n' +
        'Tipp: Trage im Marken-Set deinen @handle ein – die Vorlagen setzen ihn\r\n' +
        'automatisch ein.\r\n'
      : 'SEAMLESS STUDIO TEMPLATE PACK\r\n=============================\r\n\r\n' +
        '1. Open the free app in your browser: ' + APP_LINK + '\r\n' +
        '   (works on phone, tablet and desktop - no account needed)\r\n' +
        '2. Go to the Studio tab -> "Deine Vorlagen" -> "Vorlagen-Datei öffnen".\r\n' +
        '3. Select the .ssvorlage.json files from this pack.\r\n' +
        '4. Reload the app - the templates now sit in your grid.\r\n' +
        '5. Add your photos, tap a template - your carousel is ready.\r\n';
  }

  function deckblatt(vorlagen) {
    const G = 2000;
    const cv = SS.makeCanvas(G, G);
    const c = cv.getContext('2d');
    const g = c.createLinearGradient(0, 0, G, G);
    g.addColorStop(0, '#f6efe4'); g.addColorStop(1, '#eadfce');
    c.fillStyle = g; c.fillRect(0, 0, G, G);
    c.fillStyle = '#2f2a26';
    c.font = '600 92px "Playfair Display", serif';
    c.textAlign = 'center';
    c.fillText(vorlagen.length + ' Carousel-Vorlagen', G / 2, 170);
    c.font = '44px Poppins, sans-serif';
    c.fillStyle = '#8a7d6d';
    c.fillText('für Instagram · im kostenlosen Seamless Studio', G / 2, 245);
    /* Collage: bis zu 8 Vorschaubildchen, leicht gedreht */
    const bilder = vorlagen.filter(v => v.bildchen).slice(0, 8);
    const proReihe = Math.min(4, Math.max(2, Math.ceil(bilder.length / 2)));
    const bw = G / (proReihe + 0.8), bh = bw * 168 / 135;
    return Promise.all(bilder.map((v, i) => new Promise((fertig) => {
      const img = new Image();
      img.onload = () => fertig({ img, i });
      img.onerror = () => fertig(null);
      img.src = v.bildchen;
    }))).then((geladen) => {
      geladen.filter(Boolean).forEach(({ img, i }) => {
        const r = Math.floor(i / proReihe), s = i % proReihe;
        const x = G / 2 + (s - (proReihe - 1) / 2) * bw * 1.06;
        const y = 340 + bh / 2 + r * bh * 1.12;
        c.save();
        c.translate(x, y);
        c.rotate(((i % 2 ? 1 : -1) * (2 + i % 3)) * Math.PI / 180);
        c.fillStyle = '#fff';
        c.fillRect(-bw / 2 - 12, -bh / 2 - 12, bw + 24, bh + 24);
        c.drawImage(img, -bw / 2, -bh / 2, bw, bh);
        c.restore();
      });
      c.fillStyle = '#8a7d6d';
      c.font = '36px Poppins, sans-serif';
      c.fillText('Sofort-Download · keine Anmeldung · Handy & Computer', G / 2, G - 90);
      return new Promise((fertig) => cv.toBlob((b) => { SS.freeCanvas(cv); fertig(b); }, 'image/jpeg', 0.9));
    });
  }

  async function packSchnueren(ausgewaehlt) {
    const zip = new JSZip();
    const ordner = zip.folder('Vorlagen-Pack');
    for (const v of ausgewaehlt) {
      const d = Object.assign({ ssvorlage: 1 }, v);
      ordner.file((v.name || 'Vorlage').replace(/[^\wäöüÄÖÜß -]/g, '') + '.ssvorlage.json',
        JSON.stringify(d, null, 1));
    }
    ordner.file('ANLEITUNG.txt', anleitung(true));
    ordner.file('INSTRUCTIONS.txt', anleitung(false));
    try {
      const bild = await deckblatt(ausgewaehlt);
      if (bild) ordner.file('Deckblatt_2000x2000.jpg', bild);
    } catch (e) {}
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Vorlagen-Pack.zip';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 9000);
    SS.toast('Pack mit ' + ausgewaehlt.length + ' Vorlagen liegt in deinen Downloads', 3600, 'ok');
  }

  /* Auswahl-Dialog */
  function packDialog() {
    const liste = eigeneLesen();
    if (!liste.length) { SS.toast('Erst eigene Vorlagen sichern (Studio-Tab)', 3200, 'warn'); return; }
    let d = document.getElementById('packDlg');
    if (d) d.remove();
    d = document.createElement('div');
    d.id = 'packDlg';
    d.className = 'modal';
    d.innerHTML = '<div class="modal-card" style="max-width:420px">' +
      '<div class="sort-head"><h3>Pack schnüren</h3><button id="pkClose">✕</button></div>' +
      '<div id="pkListe" style="display:grid;gap:6px;max-height:300px;overflow:auto">' +
      liste.map((v, i) =>
        '<label class="ctl" style="cursor:pointer"><input type="checkbox" checked data-i="' + i + '"> ' +
        '<span>' + (v.name || 'Vorlage ' + (i + 1)) + '</span></label>').join('') +
      '</div>' +
      '<button id="pkGo" class="wide primary" style="margin-top:10px">ZIP bauen</button>' +
      '<p class="hint">Das ZIP enthält die Vorlagen-Dateien, eine Anleitung (DE/EN) und ein ' +
      'Deckblatt-Bild 2000×2000 – fertig zum Hochladen als Etsy-Produkt.</p></div>';
    document.body.appendChild(d);
    d.querySelector('#pkClose').onclick = () => d.remove();
    d.addEventListener('pointerdown', (e) => { if (e.target === d) d.remove(); });
    d.querySelector('#pkGo').onclick = async () => {
      const idx = [...d.querySelectorAll('input:checked')].map(x => +x.dataset.i);
      if (!idx.length) { SS.toast('Nichts angekreuzt', 2200, 'warn'); return; }
      d.remove();
      await packSchnueren(idx.map(i => liste[i]));
    };
  }

  /* ------------------------------------------------------------ Bedienung */
  const kasten = document.getElementById('markeBox');
  if (!kasten) return;
  const grid = document.getElementById('eigeneGrid');

  const reihe = document.createElement('div');
  reihe.className = 'chips';
  reihe.innerHTML =
    '<button id="vpDatei">Vorlagen-Datei öffnen …</button>' +
    '<button id="vpExport">Alle als Dateien sichern</button>' +
    '<button id="vpPack">Pack schnüren …</button>';
  kasten.insertBefore(reihe, grid.nextSibling);

  const inp = document.createElement('input');
  inp.type = 'file'; inp.multiple = true;
  inp.accept = '.json,application/json'; inp.style.display = 'none';
  kasten.appendChild(inp);

  document.getElementById('vpDatei').onclick = () => inp.click();
  inp.addEventListener('change', (e) => {
    const dateien = [...e.target.files];
    e.target.value = '';
    if (dateien.length) dateienOeffnen(dateien);
  });
  document.getElementById('vpExport').onclick = () => {
    const liste = eigeneLesen();
    if (!liste.length) { SS.toast('Noch keine eigenen Vorlagen', 2600, 'warn'); return; }
    liste.forEach((v, i) => setTimeout(() => alsDatei(v), i * 350));
  };
  document.getElementById('vpPack').onclick = packDialog;

  SS.VORLAGENPACK7 = { bereit: true, fassung: 1 };
})();
