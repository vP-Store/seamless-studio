/* Seamless Studio – Bewertungs-Karten (Social Proof)
   ============================================================================
   Etsy-Rezensionen sind das staerkste Verkaufsargument – aber als Screenshot
   sehen sie lieblos aus. Dieser Bauhelfer macht daraus Karten im eigenen
   Stil: Sterne, Zitat in ruhiger Serifenschrift, Name, dein Produkt darunter.
   Eine Bewertung = eine Slide; mehrere = das "Was Kundinnen sagen"-Karussell
   mit Titel-Slide und Abschluss.
   ========================================================================= */

(function () {
  if (!SS.ui || typeof SS.textUmbrechen !== 'function') return;

  const marke = () => SS.marke || {};
  const ueberVideo = () => !!(SS.clip && SS.clip.ready);

  function textEl(o) {
    const dunkel = ueberVideo();
    return SS.normalizeEl(Object.assign({
      id: SS.uid(), type: 'text', align: 'center',
      color: dunkel ? '#F6EEDC' : '#2f2a26',
      shadow: dunkel, shadowColor: '#100b07', shadowBlur: 24, shadowX: 0, shadowY: 4,
      bgStyle: 'none', lineHeight: 1.3,
    }, o));
  }
  const sterne = (n) => '★'.repeat(Math.max(1, Math.min(5, n))) + '☆'.repeat(5 - Math.max(1, Math.min(5, n)));

  function slidesSetzen(n) {
    const plus = document.getElementById('slidesPlus');
    const minus = document.getElementById('slidesMinus');
    let schutz = 0;
    while (SS.state.slides < n && schutz++ < 40) plus.click();
    while (SS.state.slides > n && schutz++ < 80) minus.click();
  }

  function bauen(bewertungen, produkt) {
    const einzeln = bewertungen.length === 1;
    const n = einzeln ? 1 : bewertungen.length + 2;
    slidesSetzen(Math.max(2, n) === 1 ? 2 : Math.max(2, n));
    if (einzeln) slidesSetzen(Math.max(2, SS.state.slides)); // eine Karte in bestehendes Layout
    const k = SS.canvasSize();
    const sw = k.slideW;
    const neu = [];
    const start = einzeln ? 0 : 1;

    if (!einzeln) {
      neu.push(textEl({ content: 'ECHTE STIMMEN', x: sw / 2, y: k.H * 0.20,
        size: Math.round(k.H * 0.020), letterSpacing: 7,
        font: marke().schriftText || 'Poppins',
        color: ueberVideo() ? 'rgba(255,255,255,.8)' : '#a29380' }));
      neu.push(textEl({ content: 'Was Kundinnen\nsagen', x: sw / 2, y: k.H * 0.40,
        size: Math.round(k.H * 0.075), font: marke().schriftTitel || 'Playfair Display',
        lineHeight: 1.12 }));
      neu.push(textEl({ content: 'WEITER →', x: sw / 2, y: k.H * 0.88,
        size: Math.round(k.H * 0.018), letterSpacing: 5,
        font: marke().schriftText || 'Poppins',
        color: ueberVideo() ? 'rgba(255,255,255,.75)' : '#a29380' }));
    }

    bewertungen.forEach((bw, i) => {
      const s = start + i;
      neu.push(textEl({ content: sterne(bw.sterne), x: s * sw + sw / 2, y: k.H * 0.22,
        size: Math.round(k.H * 0.045), color: '#c9a15f', shadow: ueberVideo() }));
      neu.push(textEl({ content: '„' + bw.text.trim().replace(/^[„"]|["“]$/g, '') + '“',
        x: s * sw + sw / 2, y: k.H * 0.46,
        size: Math.round(k.H * 0.036), font: 'Cormorant Garamond', italic: true,
        lineHeight: 1.35 }));
      neu.push(textEl({ content: '— ' + (bw.name || 'Etsy-Kundin'),
        x: s * sw + sw / 2, y: k.H * 0.70,
        size: Math.round(k.H * 0.022), letterSpacing: 2,
        color: ueberVideo() ? 'rgba(255,255,255,.85)' : '#8a7d6d' }));
      if (produkt) {
        neu.push(textEl({ content: 'zu „' + produkt + '"', x: s * sw + sw / 2, y: k.H * 0.765,
          size: Math.round(k.H * 0.018),
          color: ueberVideo() ? 'rgba(255,255,255,.7)' : '#a29380' }));
      }
    });

    if (!einzeln) {
      const letzte = n - 1;
      neu.push(textEl({ content: 'Danke für jedes\neinzelne Wort. 🤍', x: letzte * sw + sw / 2,
        y: k.H * 0.38, size: Math.round(k.H * 0.055),
        font: marke().schriftTitel || 'Playfair Display', italic: true, lineHeight: 1.2 }));
      neu.push(textEl({ content: (produkt ? '„' + produkt + '" und mehr: ' : 'Alles Weitere: ') + 'Link im Profil',
        x: letzte * sw + sw / 2, y: k.H * 0.58,
        size: Math.round(k.H * 0.024) }));
    }

    neu.forEach(el => { SS.state.elements.push(el); SS.textUmbrechen(el, sw * 0.82); });
    SS.pushHistory('Bewertungs-Karten');
    SS.ui.refreshLayers && SS.ui.refreshLayers();
    SS.ui.zoomFit && SS.ui.zoomFit();
    SS.requestRender();
    SS.toast(bewertungen.length + ' Bewertung(en) als Karten gebaut', 3000, 'ok');
  }

  /* ------------------------------------------------------------- Dialog */
  function dialog() {
    let d = document.getElementById('bwDlg');
    if (d) d.remove();
    d = document.createElement('div');
    d.id = 'bwDlg';
    d.className = 'modal';
    const zeile = (i) =>
      '<div class="bw-zeile" style="border:1px solid var(--line);border-radius:8px;padding:8px;margin-top:8px">' +
      '<textarea rows="2" style="width:100%;resize:vertical" placeholder="Text der Bewertung ' + i + ' einkleben …"></textarea>' +
      '<div class="ctl"><span>Name</span><input type="text" style="flex:1" placeholder="z. B. Anna K."></div>' +
      '<div class="ctl"><span>Sterne</span><select style="flex:1">' +
      [5, 4].map(s => '<option value="' + s + '">' + '★'.repeat(s) + '</option>').join('') +
      '</select></div></div>';
    d.innerHTML = '<div class="modal-card" style="max-width:440px">' +
      '<div class="sort-head"><h3>Bewertungs-Karten</h3><button id="bwClose">✕</button></div>' +
      '<div class="ctl"><span>Produkt</span><input type="text" id="bwProdukt" style="flex:1" placeholder="optional – z. B. Mond-Orakel"></div>' +
      '<div id="bwListe">' + zeile(1) + '</div>' +
      '<button id="bwMehr" style="margin-top:8px">+ weitere Bewertung</button>' +
      '<button id="bwGo" class="wide primary" style="margin-top:10px">Karten bauen</button>' +
      '<p class="hint">Eine Bewertung wird eine Karte in der offenen Szene; mehrere werden ein ' +
      '„Was Kundinnen sagen"-Karussell mit Titel und Dank-Slide.</p></div>';
    document.body.appendChild(d);
    d.querySelector('#bwClose').onclick = () => d.remove();
    d.addEventListener('pointerdown', (e) => { if (e.target === d) d.remove(); });
    d.querySelector('#bwMehr').onclick = () => {
      const l = d.querySelector('#bwListe');
      if (l.children.length < 6) l.insertAdjacentHTML('beforeend', zeile(l.children.length + 1));
    };
    d.querySelector('#bwGo').onclick = () => {
      const bewertungen = [...d.querySelectorAll('.bw-zeile')].map(z => ({
        text: z.querySelector('textarea').value.trim(),
        name: z.querySelector('input').value.trim(),
        sterne: +z.querySelector('select').value,
      })).filter(bw => bw.text.length > 3);
      if (!bewertungen.length) { SS.toast('Mindestens eine Bewertung einkleben', 2800, 'warn'); return; }
      const produkt = d.querySelector('#bwProdukt').value.trim();
      d.remove();
      bauen(bewertungen, produkt);
    };
  }

  const reihe = document.querySelector('#markeBox .chips [data-mm]');
  if (reihe && reihe.parentElement) {
    const b = document.createElement('button');
    b.id = 'btnBewertung';
    b.textContent = 'Bewertungen';
    b.onclick = dialog;
    reihe.parentElement.appendChild(b);
  }

  SS.BEWERTUNG7 = { bereit: true, bauen };
})();
