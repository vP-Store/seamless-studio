/* Seamless Studio – Das Ueberall-Paket
   ============================================================================
   Ein Entwurf, ein Knopf, ein ZIP fuer vier Plattformen:

     Instagram/  die Slides wie gehabt (aktuelles Format)
     Stories/    jede Slide als 9:16 – Inhalt mittig, oben/unten Luft fuer
                 Umfrage-Sticker (die Flaeche fuellt der Hintergrund)
     Pinterest/  jede Slide als 2:3-Pin (1080x1620) – die Nische laeuft dort
     TikTok/     die Slides fuer den Foto-Modus (gleiche Bilder, eigener Text)
     Reel/       optional das Video mit dem gewaehlten Kamera-Stil

   Je Ordner ein eigener Beitragstext. Die Format-Umrechnung ist ein
   eigenstaendiger, getesteter Nachbau des withFormat-Tricks aus exporter.js
   (dort privat): Elemente sichern -> auf die neue Hoehe umrechnen ->
   rendern -> alles exakt zuruecklegen.
   ========================================================================= */

(function () {
  if (!SS.ui || typeof SS.renderSlides !== 'function') return;

  /* Pinterest-Format nur fuer den Export nachruesten. */
  if (!SS.SLIDE['2:3']) SS.SLIDE['2:3'] = [1080, 1620];

  async function mitFormat(zielFmt, fn) {
    const altFmt = SS.state.format;
    const { H: altH } = SS.canvasSize();
    const neuH = SS.SLIDE[zielFmt][1];
    const k = Math.min(1, neuH / altH);
    const backup = SS.state.elements.map(e => ({ e, x: e.x, y: e.y, h: e.h, s: e.s, size: e.size, w: e.w, hh: e.h }));
    for (const b of backup) {
      const e = b.e;
      e.y = (b.y - altH / 2) * k + neuH / 2;
      if (k !== 1) {
        if (e.type === 'photo') e.h = b.h * k;
        else if (e.type === 'text') e.size = b.size * k;
        else if (e.type === 'sticker' || e.type === 'emoji') e.s = b.s * k;
        else if (e.type === 'blur') { e.w = b.w * k; e.h = b.hh * k; }
        SS.invalidateEl(e);
      }
    }
    SS._sizeOverride = { format: zielFmt,
      slides: (SS.clip && SS.clip.ready && SS.videoLeinwand && SS.videoLeinwand.modus === 'fuellen')
        ? SS.state.slides : SS.state.slides };
    SS.bgCacheInvalidate();
    try { return await fn(); }
    finally {
      SS._sizeOverride = null;
      for (const b of backup) {
        const e = b.e;
        e.x = b.x; e.y = b.y;
        if (e.type === 'photo') e.h = b.h;
        else if (e.type === 'text') e.size = b.size;
        else if (e.type === 'sticker' || e.type === 'emoji') e.s = b.s;
        else if (e.type === 'blur') { e.w = b.w; e.h = b.hh; }
        SS.invalidateEl(e);
      }
      SS.state.format = altFmt;
      SS.bgCacheInvalidate();
    }
  }

  /* ----------------------------------------------- Texte je Plattform */
  function hookAusSzene() {
    const k = SS.canvasSize();
    const t = SS.state.elements
      .filter(e => e.type === 'text' && !e._wz && e.x < k.slideW)
      .sort((a, b) => (b.size || 0) - (a.size || 0))[0];
    return t ? (t.content || '').replace(/\n/g, ' ').trim() : '';
  }
  const marke = () => SS.marke || {};

  function textFuer(plattform) {
    const hook = hookAusSzene();
    const tags = marke().hashtags || '';
    const web = marke().website || 'Link im Profil';
    if (plattform === 'pinterest') {
      return 'PIN-TITEL (max. 100 Zeichen)\r\n' + (hook || '[Titel]') + '\r\n\r\n' +
        'PIN-BESCHREIBUNG\r\n' +
        '[2–3 Sätze, was die Leserin hier lernt.] Mehr davon: ' + web + '\r\n\r\n' +
        (tags ? tags + '\r\n\r\n' : '') +
        'Hinweis: Alle Slides einzeln pinnen – jede ist ein eigener Pin auf dasselbe Ziel.\r\n';
    }
    if (plattform === 'tiktok') {
      return (hook || '[Hook]') + ' – swipe durch 📖\r\n\r\n' +
        (tags ? tags + '\r\n\r\n' : '') +
        'Hinweis: Als Foto-Modus-Beitrag hochladen, Musik in TikTok dazuwählen.\r\n';
    }
    if (plattform === 'stories') {
      return 'Reihenfolge wie nummeriert posten. Oben und unten ist bewusst Luft –\r\n' +
        'dort passen Umfrage-, Frage- und Link-Sticker hin, ohne den Inhalt zu verdecken.\r\n';
    }
    return (typeof SS.beitragstext === 'function') ? SS.beitragstext() : '';
  }

  /* ------------------------------------------------------------- Paket */
  async function paket(o, fortschritt) {
    const zip = new JSZip();
    const wurzel = zip.folder('Ueberall-Paket');
    const meld = (p, t) => { if (fortschritt) fortschritt(p, t); };

    meld(5, 'Instagram');
    const ig = await SS.renderSlides(1, 'jpeg');
    const f1 = wurzel.folder('Instagram');
    ig.blobs.forEach((b, i) => f1.file('Slide_' + String(i + 1).padStart(2, '0') + '.jpg', b));
    f1.file('Beitrag.txt', textFuer('instagram'));

    if (o.stories) {
      meld(30, 'Stories');
      const st = await mitFormat('9:16', () => SS.renderSlides(1, 'jpeg'));
      const f = wurzel.folder('Stories');
      st.blobs.forEach((b, i) => f.file('Story_' + String(i + 1).padStart(2, '0') + '.jpg', b));
      f.file('Hinweis.txt', textFuer('stories'));
    }
    if (o.pinterest) {
      meld(55, 'Pinterest');
      const pi = await mitFormat('2:3', () => SS.renderSlides(1, 'jpeg'));
      const f = wurzel.folder('Pinterest');
      pi.blobs.forEach((b, i) => f.file('Pin_' + String(i + 1).padStart(2, '0') + '.jpg', b));
      f.file('Beitrag.txt', textFuer('pinterest'));
    }
    if (o.tiktok) {
      meld(70, 'TikTok');
      const f = wurzel.folder('TikTok');
      ig.blobs.forEach((b, i) => f.file('Foto_' + String(i + 1).padStart(2, '0') + '.jpg', b));
      f.file('Beitrag.txt', textFuer('tiktok'));
    }
    if (o.reel) {
      meld(78, 'Reel (Echtzeit-Aufnahme)');
      try {
        const r = await SS.video.exportVideo(() => {});
        if (r && r.blob) wurzel.folder('Reel').file('Reel.' + (r.ext || 'mp4'), r.blob);
      } catch (e) { SS.toast('Reel-Aufnahme hat nicht geklappt – Paket kommt ohne', 3600, 'warn'); }
    }
    meld(92, 'Packen');
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Ueberall-Paket.zip';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 9000);
    meld(100, 'Fertig');
  }

  /* ------------------------------------------------------------ Dialog */
  function dialog() {
    let d = document.getElementById('uebDlg');
    if (d) d.remove();
    d = document.createElement('div');
    d.id = 'uebDlg';
    d.className = 'modal';
    d.innerHTML = '<div class="modal-card" style="max-width:420px">' +
      '<div class="sort-head"><h3>Überall-Paket</h3><button id="ubClose">✕</button></div>' +
      '<label class="ctl"><input type="checkbox" checked disabled> <span>Instagram (Slides + Beitragstext)</span></label>' +
      '<label class="ctl"><input type="checkbox" id="ubSt" checked> <span>Stories – jede Slide als 9:16</span></label>' +
      '<label class="ctl"><input type="checkbox" id="ubPi" checked> <span>Pinterest – jede Slide als 2:3-Pin</span></label>' +
      '<label class="ctl"><input type="checkbox" id="ubTt" checked> <span>TikTok – Foto-Modus-Paket</span></label>' +
      '<label class="ctl"><input type="checkbox" id="ubRe"> <span>Reel (Kamera-Stil aus dem Video-Tab, Echtzeit)</span></label>' +
      '<button id="ubGo" class="wide primary" style="margin-top:10px">Paket bauen</button>' +
      '<p class="hint" id="ubStand">Ein ZIP mit einem Ordner je Plattform, jeweils mit passendem Beitragstext.</p></div>';
    document.body.appendChild(d);
    d.querySelector('#ubClose').onclick = () => d.remove();
    d.addEventListener('pointerdown', (e) => { if (e.target === d) d.remove(); });
    d.querySelector('#ubGo').onclick = async () => {
      const o = { stories: d.querySelector('#ubSt').checked,
                  pinterest: d.querySelector('#ubPi').checked,
                  tiktok: d.querySelector('#ubTt').checked,
                  reel: d.querySelector('#ubRe').checked };
      const go = d.querySelector('#ubGo'), stand = d.querySelector('#ubStand');
      go.disabled = true;
      try {
        await paket(o, (p, t) => { stand.textContent = t + ' … ' + p + ' %'; });
        stand.textContent = 'Fertig – das ZIP liegt in deinen Downloads.';
        SS.toast('Überall-Paket gebaut', 3000, 'ok');
      } catch (e) {
        stand.textContent = 'Das hat nicht geklappt: ' + e.message;
      }
      go.disabled = false;
    };
  }

  /* Knopf im Export-Dialog */
  const exDlg = document.getElementById('exportDlg');
  if (exDlg) {
    const karte = exDlg.querySelector('.modal-card') || exDlg;
    const kn = document.createElement('button');
    kn.id = 'btnUeberall';
    kn.className = 'wide';
    kn.textContent = 'Überall-Paket … (Stories · Pinterest · TikTok)';
    karte.appendChild(kn);
    kn.onclick = () => { dialog(); };
  }

  SS.ueberallPaket = paket;
  SS.UEBERALL7 = { bereit: true, mitFormat };
})();
