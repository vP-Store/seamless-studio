/* Seamless Studio – Druck-Export (vom Karussell zum Produkt)
   ============================================================================
   Aus Zitat-Slides werden Wandbilder und Karten fuer den Shop:

     A4-Wandbild   2480 x 3508 px (300 dpi)
     Karte         63 x 88 mm -> 744 x 1039 px (wie die Orakelkarten)
     Quadrat       21 x 21 cm -> 2480 x 2480 px

   Je gewaehlter Slide eine PDF-Seite, 300 dpi, JPEG eingebettet (eigener
   kleiner PDF-Schreiber nach dem Muster von export5.js – der ist dort
   privat). Optionen: 3 mm Beschnittzugabe (die Zugabe kommt aus dem
   Panorama selbst – links und rechts liegt ja echte Nachbarflaeche),
   Schnittmarken, Wasserzeichen weglassen (die _wz-Elemente der Marke).

   Farbraum bleibt sRGB – fuer Heimdruck und Etsy-Downloads ueblich;
   CMYK-Druckereien wollen eh ihr eigenes Profil.
   ========================================================================= */

(function () {
  if (!SS.ui || typeof SS.paintScene !== 'function') return;

  const FORMATE = [
    { id: 'a4', name: 'A4-Wandbild', w: 2480, h: 3508 },
    { id: 'karte', name: 'Karte 63×88 mm', w: 744, h: 1039 },
    { id: 'quadrat', name: 'Quadrat 21×21 cm', w: 2480, h: 2480 },
  ];
  const BLEED = Math.round(3 * 300 / 25.4);   // 3 mm bei 300 dpi = 35 px

  function toBlob(cv, mime, q) {
    return new Promise((fertig, nope) =>
      cv.toBlob(b => b ? fertig(b) : nope(new Error('Bild zu groß für dieses Gerät')), mime, q));
  }

  /* Eine Slide mittig beschnitten in Zielmasse rendern (plus Beschnitt). */
  async function slideRendern(i, fmt, o) {
    const k = SS.canvasSize();
    const b = o.beschnitt ? BLEED : 0;
    const W = fmt.w + 2 * b, H = fmt.h + 2 * b;
    if (SS.areaOk && !SS.areaOk(W, H)) throw new Error('Fläche zu groß');
    const cv = SS.makeCanvas(W, H);
    const c = cv.getContext('2d');
    /* Cover: die Seite (samt Beschnitt) wird aus der Slide-Mitte gefuellt.
       Was seitlich fehlt, liefert das Panorama von selbst. */
    const s = Math.max(W / k.slideW, H / k.H);
    c.save();
    c.translate(W / 2, H / 2);
    c.scale(s, s);
    c.translate(-(i * k.slideW + k.slideW / 2), -k.H / 2);
    SS._noAnim = true;
    try {
      const versteckt = [];
      if (o.ohneWz) {
        for (const e of SS.state.elements) {
          if (e._wz && !e.hidden) { e.hidden = true; versteckt.push(e); }
        }
      }
      try { SS.paintScene(c, k.W, k.H, { forExport: true }); }
      finally { versteckt.forEach(e => { e.hidden = false; }); }
    } finally { SS._noAnim = false; c.restore(); }

    if (o.marken && b) {
      c.strokeStyle = '#000'; c.lineWidth = 1;
      const L = Math.round(b * 0.7);
      [[b, 0, b, L], [W - b, 0, W - b, L], [b, H, b, H - L], [W - b, H, W - b, H - L],
       [0, b, L, b], [0, H - b, L, H - b], [W, b, W - L, b], [W, H - b, W - L, H - b]]
        .forEach(([x1, y1, x2, y2]) => {
          c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
        });
    }
    const blob = await toBlob(cv, 'image/jpeg', 0.95);
    const masse = [cv.width, cv.height];
    SS.freeCanvas(cv);
    return { bytes: new Uint8Array(await blob.arrayBuffer()), w: masse[0], h: masse[1] };
  }

  /* Mehrseitige PDF aus JPEG-Seiten, 300 dpi. */
  function pdfBauen(seiten) {
    const chunks = [];
    let len = 0;
    const offsets = [];
    const push = (data) => {
      const u = typeof data === 'string' ? new TextEncoder().encode(data) : data;
      chunks.push(u); len += u.length;
    };
    const obj = (num, body) => { offsets[num] = len; push(num + ' 0 obj\n'); push(body); push('\nendobj\n'); };
    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    const n = seiten.length;
    const pageIds = [];
    for (let i = 0; i < n; i++) pageIds.push(3 + i * 3);
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, '<< /Type /Pages /Kids [' + pageIds.map(id => id + ' 0 R').join(' ') + '] /Count ' + n + ' >>');
    for (let i = 0; i < n; i++) {
      const pid = 3 + i * 3, cid = pid + 1, iid = pid + 2;
      const img = seiten[i];
      const pw = img.w * 72 / 300, ph = img.h * 72 / 300;
      obj(pid, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pw.toFixed(2) + ' ' + ph.toFixed(2) + '] ' +
        '/Resources << /XObject << /Im0 ' + iid + ' 0 R >> >> /Contents ' + cid + ' 0 R >>');
      const stream = 'q ' + pw.toFixed(2) + ' 0 0 ' + ph.toFixed(2) + ' 0 0 cm /Im0 Do Q';
      obj(cid, '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream');
      offsets[iid] = len;
      push(iid + ' 0 obj\n');
      push('<< /Type /XObject /Subtype /Image /Width ' + img.w + ' /Height ' + img.h +
        ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + img.bytes.length + ' >>\nstream\n');
      push(img.bytes);
      push('\nendstream\nendobj\n');
    }
    const maxId = 2 + n * 3;
    const xref = len;
    let tabelle = 'xref\n0 ' + (maxId + 1) + '\n0000000000 65535 f \n';
    for (let i = 1; i <= maxId; i++) tabelle += String(offsets[i] || 0).padStart(10, '0') + ' 00000 n \n';
    push(tabelle);
    push('trailer\n<< /Size ' + (maxId + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
    const out = new Uint8Array(len);
    let p = 0;
    for (const ch of chunks) { out.set(ch, p); p += ch.length; }
    return new Blob([out], { type: 'application/pdf' });
  }

  SS.druckPdf = async function (slides, fmtId, o) {
    const fmt = FORMATE.find(f => f.id === fmtId) || FORMATE[0];
    const seiten = [];
    for (const i of slides) seiten.push(await slideRendern(i, fmt, o || {}));
    return pdfBauen(seiten);
  };

  /* ------------------------------------------------------------ Dialog */
  function dialog() {
    const k = SS.canvasSize();
    let d = document.getElementById('druckDlg');
    if (d) d.remove();
    d = document.createElement('div');
    d.id = 'druckDlg';
    d.className = 'modal';
    d.innerHTML = '<div class="modal-card" style="max-width:420px">' +
      '<div class="sort-head"><h3>Druck-PDF</h3><button id="drClose">✕</button></div>' +
      '<div class="ctl"><span>Format</span><select id="drFmt" style="flex:1">' +
      FORMATE.map(f => '<option value="' + f.id + '">' + f.name + '</option>').join('') +
      '</select></div>' +
      '<div class="chips" id="drSlides">' +
      Array.from({ length: k.n }, (_, i) =>
        '<button data-i="' + i + '" class="sel">Slide ' + (i + 1) + '</button>').join('') +
      '</div>' +
      '<label class="ctl"><input type="checkbox" id="drBleed" checked> <span>3 mm Beschnittzugabe</span></label>' +
      '<label class="ctl"><input type="checkbox" id="drMarken"> <span>Schnittmarken</span></label>' +
      '<label class="ctl"><input type="checkbox" id="drOhneWz" checked> <span>Wasserzeichen weglassen</span></label>' +
      '<button id="drGo" class="wide primary" style="margin-top:10px">PDF bauen (300 dpi)</button>' +
      '<p class="hint">Mittig beschnitten aufs Zielformat – die Zugabe kommt aus dem Panorama. ' +
      'sRGB, für Heimdruck und Etsy-Downloads; Druckereien mit CMYK-Wunsch wollen ohnehin ihr Profil.</p></div>';
    document.body.appendChild(d);
    d.querySelector('#drClose').onclick = () => d.remove();
    d.addEventListener('pointerdown', (e) => { if (e.target === d) d.remove(); });
    d.querySelectorAll('#drSlides button').forEach(b => {
      b.onclick = () => b.classList.toggle('sel');
    });
    d.querySelector('#drGo').onclick = async () => {
      const slides = [...d.querySelectorAll('#drSlides button.sel')].map(b => +b.dataset.i);
      if (!slides.length) { SS.toast('Keine Slide gewählt', 2200, 'warn'); return; }
      const go = d.querySelector('#drGo');
      go.disabled = true; go.textContent = 'Rendert …';
      try {
        const blob = await SS.druckPdf(slides, d.querySelector('#drFmt').value, {
          beschnitt: d.querySelector('#drBleed').checked,
          marken: d.querySelector('#drMarken').checked,
          ohneWz: d.querySelector('#drOhneWz').checked,
        });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'Druck_' + d.querySelector('#drFmt').value + '.pdf';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 9000);
        SS.toast('Druck-PDF mit ' + slides.length + ' Seiten liegt in den Downloads', 3400, 'ok');
        d.remove();
      } catch (e) {
        SS.toast('Das hat nicht geklappt: ' + e.message, 3600, 'err');
        go.disabled = false; go.textContent = 'PDF bauen (300 dpi)';
      }
    };
  }

  const exDlg = document.getElementById('exportDlg');
  if (exDlg) {
    const karte = exDlg.querySelector('.modal-card') || exDlg;
    const kn = document.createElement('button');
    kn.id = 'btnDruck';
    kn.className = 'wide';
    kn.textContent = 'Druck-PDF … (Wandbild · Karte, 300 dpi)';
    karte.appendChild(kn);
    kn.onclick = dialog;
  }

  SS.DRUCK7 = { bereit: true, formate: FORMATE.map(f => f.id) };
})();
