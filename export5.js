/* ============================================================
   Seamless Studio 5.0 — Export-Erweiterung
     · Größenschätzung im Export-Dialog
     · PDF-Export (eine Seite je Slide, 300 dpi, druckfertig)
     · 3×3-Feed-Puzzle: ein Bild über 3, 6 oder 9 Profilkacheln
   Lädt nach exporter.js und hängt sich nur an die Oberfläche.
   ============================================================ */

(function () {
  const $ = (id) => document.getElementById(id);

  /* ================= Zusatz-Ziele im Auswahlfeld ================= */

  const sel = $('expType');
  if (!sel) return;
  const add = (v, label) => {
    if ([...sel.options].some(o => o.value === v)) return;
    const o = document.createElement('option');
    o.value = v; o.textContent = label;
    sel.appendChild(o);
  };
  add('pdf', 'PDF – eine Seite je Slide');
  add('grid', 'Feed-Puzzle 3×3 (Profilraster)');

  /* Eigene Optionszeile fürs Puzzle */
  const gridRow = document.createElement('div');
  gridRow.className = 'ctl hidden';
  gridRow.id = 'expGridRow';
  gridRow.innerHTML = '<span>Kacheln</span>';
  const gridSel = document.createElement('select');
  [['3', '3 – eine Reihe'], ['6', '6 – zwei Reihen'], ['9', '9 – drei Reihen']].forEach(([v, t]) => {
    const o = document.createElement('option'); o.value = v; o.textContent = t; gridSel.appendChild(o);
  });
  gridSel.value = '9';
  gridRow.appendChild(gridSel);
  $('expImgOpts').appendChild(gridRow);

  /* Eigene Hinweiszeile: Dateigröße und Erklärung */
  const est = document.createElement('p');
  est.className = 'hint';
  est.id = 'expEstimate';
  $('expInfo').parentNode.insertBefore(est, $('expInfo').nextSibling);

  const mb = (b) => b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.round(b / 1024) + ' kB';

  /* JPEG bei Qualität 0,95 landet erfahrungsgemäß bei ~0,12 Byte je Pixel,
     PNG bei ~1,1 (Fotoinhalt), WebP bei ~0,07. */
  const BYTES = { jpeg: 0.12, png: 1.1, webp: 0.07 };

  function estimate() {
    const type = sel.value;
    const scale = +$('expScale').value;
    const fmt = $('expFormat').value;
    const per = BYTES[fmt] || 0.12;
    const { slideW, slideH, W, H, n } = SS.canvasSize();
    const parts = [];

    if (type === 'video') { est.textContent = ''; return; }

    if (type === 'pdf') {
      const bytes = n * slideW * slideH * 4 * 0.12;
      parts.push(`${n} Seiten à ${(slideW / 300 * 2.54).toFixed(1)} × ${(slideH / 300 * 2.54).toFixed(1)} cm bei 300 dpi`);
      parts.push('≈ ' + mb(bytes));
      parts.push('JPEG im PDF – gut für LinkedIn-Dokumente und zum Ausdrucken');
    } else if (type === 'grid') {
      const tiles = +gridSel.value;
      const tw = 1013 * scale, th = 1350 * scale;
      parts.push(`${tiles} Kacheln à ${Math.round(tw)}×${Math.round(th)} px`);
      parts.push('≈ ' + mb(tiles * tw * th * per));
      parts.push('Reihenfolge im ZIP ist die Reihenfolge zum Hochladen – rückwärts, damit das Raster stimmt');
    } else if (type === 'pano') {
      const k = SS.fitScale(W, H, scale);
      parts.push('≈ ' + mb(W * k * H * k * per));
    } else {
      let bytes = n * slideW * scale * slideH * scale * per;
      if ($('expPano').checked) {
        const k = SS.fitScale(W, H, scale);
        bytes += W * k * H * k * per;
      }
      const extra = [...document.querySelectorAll('#expFormats button.sel')].length;
      bytes *= (1 + extra);
      parts.push('≈ ' + mb(bytes) + ' im ZIP');
    }
    est.textContent = parts.join(' · ');
  }

  function syncRows() {
    const v = sel.value;
    gridRow.classList.toggle('hidden', v !== 'grid');
    $('expPanoRow').classList.toggle('hidden', v !== 'zip');
    $('expFormatsRow').classList.toggle('hidden', v === 'video' || v === 'pdf' || v === 'grid');
    estimate();
  }
  ['change', 'input'].forEach(ev => {
    sel.addEventListener(ev, syncRows);
    $('expScale').addEventListener(ev, estimate);
    $('expFormat').addEventListener(ev, estimate);
    $('expPano').addEventListener(ev, estimate);
    gridSel.addEventListener(ev, estimate);
  });
  $('expFormats').addEventListener('click', () => setTimeout(estimate, 0));
  $('btnExport').addEventListener('click', () => setTimeout(syncRows, 0));

  /* ================= Werkzeuge ================= */

  const toBlob = (cv, mime, q) => new Promise(r => cv.toBlob(r, mime, q));
  const setProg = (p) => {
    const bar = $('expProgress');
    bar.classList.remove('hidden');
    bar.firstElementChild.style.width = p + '%';
  };
  const hideProg = () => { $('expProgress').classList.add('hidden'); setProg(0); };

  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 8000);
  }

  /* ================= PDF ================= */

  /* Minimaler PDF-Schreiber: eine Seite je Slide, das JPEG wird
     unverändert als /DCTDecode eingebettet – kein Neukodieren. */
  async function buildPDF(scale) {
    const { slideW, slideH, n } = SS.canvasSize();
    const pw = slideW * 72 / 300, ph = slideH * 72 / 300;   // 300 dpi → Punkte

    const jpegs = [];
    SS._noAnim = true;
    try {
      for (let i = 0; i < n; i++) {
        const cv = SS.makeCanvas(slideW * scale, slideH * scale);
        const c = cv.getContext('2d');
        c.scale(scale, scale);
        c.translate(-i * slideW, 0);
        SS.paintScene(c, slideW * n, slideH, { forExport: true });
        const blob = await toBlob(cv, 'image/jpeg', 0.94);
        jpegs.push({ bytes: new Uint8Array(await blob.arrayBuffer()), w: cv.width, h: cv.height });
        SS.freeCanvas(cv);
        setProg(Math.round((i + 1) / (n + 1) * 90));
      }
    } finally { SS._noAnim = false; }

    const chunks = [];
    let len = 0;
    const offsets = [];
    const push = (data) => {
      const u = typeof data === 'string' ? new TextEncoder().encode(data) : data;
      chunks.push(u); len += u.length;
    };
    const obj = (num, body) => { offsets[num] = len; push(num + ' 0 obj\n'); push(body); push('\nendobj\n'); };

    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

    const pageIds = [];
    for (let i = 0; i < n; i++) pageIds.push(3 + i * 3);

    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, `<< /Type /Pages /Kids [${pageIds.map(id => id + ' 0 R').join(' ')}] /Count ${n} >>`);

    for (let i = 0; i < n; i++) {
      const pid = 3 + i * 3, cid = pid + 1, iid = pid + 2;
      const img = jpegs[i];
      obj(pid, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw.toFixed(2)} ${ph.toFixed(2)}] ` +
        `/Resources << /XObject << /Im0 ${iid} 0 R >> >> /Contents ${cid} 0 R >>`);
      const stream = `q ${pw.toFixed(2)} 0 0 ${ph.toFixed(2)} 0 0 cm /Im0 Do Q`;
      obj(cid, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
      offsets[iid] = len;
      push(iid + ' 0 obj\n');
      push(`<< /Type /XObject /Subtype /Image /Width ${img.w} /Height ${img.h} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.bytes.length} >>\nstream\n`);
      push(img.bytes);
      push('\nendstream\nendobj\n');
    }

    const maxId = 2 + n * 3;
    const xref = len;
    let table = `xref\n0 ${maxId + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= maxId; i++) table += String(offsets[i] || 0).padStart(10, '0') + ' 00000 n \n';
    push(table);
    push(`trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);

    const out = new Uint8Array(len);
    let p = 0;
    for (const ch of chunks) { out.set(ch, p); p += ch.length; }
    setProg(100);
    return new Blob([out], { type: 'application/pdf' });
  }

  /* ================= 3×3-Feed-Puzzle ================= */

  /* Das Panorama wird auf ein Profilraster gelegt: jede Kachel ist 3:4,
     drei Kacheln je Reihe. Die Dateinamen zählen rückwärts, weil
     Instagram den zuletzt geladenen Beitrag links oben zeigt. */
  async function buildGrid(tiles, scale, mime, ext, q) {
    const cols = 3, rows = Math.ceil(tiles / cols);
    const tw = Math.round(1013 * scale), th = Math.round(1350 * scale);
    const { W, H } = SS.canvasSize();

    const full = SS.makeCanvas(cols * tw, rows * th);
    const fc = full.getContext('2d');
    fc.fillStyle = '#ffffff';
    fc.fillRect(0, 0, full.width, full.height);

    /* Panorama mittig einpassen, ohne es zu verzerren */
    const k = Math.max(full.width / W, full.height / H);
    const src = SS.makeCanvas(W * Math.min(1, k), H * Math.min(1, k));
    const sc = src.getContext('2d');
    const ks = Math.min(1, k);
    sc.scale(ks, ks);
    SS._noAnim = true;
    try { SS.paintScene(sc, W, H, { forExport: true }); } finally { SS._noAnim = false; }
    const dw = src.width * (k / ks), dh = src.height * (k / ks);
    fc.drawImage(src, (full.width - dw) / 2, (full.height - dh) / 2, dw, dh);
    SS.freeCanvas(src);

    const zip = new JSZip();
    let done = 0;
    for (let i = 0; i < tiles; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const cv = SS.makeCanvas(tw, th);
      cv.getContext('2d').drawImage(full, col * tw, row * th, tw, th, 0, 0, tw, th);
      const blob = await toBlob(cv, mime, q);
      const order = tiles - i;   // rückwärts hochladen
      zip.file(`${String(order).padStart(2, '0')}_kachel_r${row + 1}c${col + 1}.${ext}`, blob);
      SS.freeCanvas(cv);
      setProg(Math.round((++done) / (tiles + 1) * 90));
    }
    SS.freeCanvas(full);
    zip.file('SO_HOCHLADEN.txt',
      'Feed-Puzzle\r\n\r\n' +
      'Lade die Bilder in der Nummerierung dieses Ordners hoch: 01 zuerst, dann 02, 03 …\r\n' +
      'Instagram schiebt jeden neuen Beitrag nach links oben, deshalb ist die Reihenfolge rückwärts.\r\n' +
      'Jede Kachel ist 3:4 – genau der Ausschnitt, den das Profilraster zeigt.\r\n');
    setProg(96);
    return zip.generateAsync({ type: 'blob' });
  }

  /* ================= Abfangen des Herunterladen-Knopfs ================= */

  const go = $('expGo');
  go.addEventListener('click', async (e) => {
    const type = sel.value;
    if (type !== 'pdf' && type !== 'grid') return;
    e.stopImmediatePropagation();
    e.preventDefault();

    const scale = +$('expScale').value;
    const fmt = $('expFormat').value;
    const mime = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[fmt] || 'image/jpeg';
    const ext = { jpeg: 'jpg', png: 'png', webp: 'webp' }[fmt] || 'jpg';

    go.disabled = true;
    await SS.wakeOn();
    try {
      if (type === 'pdf') {
        const blob = await buildPDF(scale);
        download(blob, 'Seamless_Carousel.pdf');
        SS.toast('PDF gespeichert – ' + mb(blob.size), 3000, 'ok');
      } else {
        const blob = await buildGrid(+gridSel.value, scale, mime, ext, fmt === 'png' ? undefined : 0.95);
        download(blob, 'Seamless_Feed_Puzzle.zip');
        SS.toast('Feed-Puzzle gespeichert – Reihenfolge steht in der Textdatei', 4000, 'ok');
      }
      $('exportDlg').classList.add('hidden');
    } catch (err) {
      SS.toast('Export fehlgeschlagen: ' + err.message, 4000, 'err');
    } finally {
      go.disabled = false;
      SS.wakeOff();
      hideProg();
    }
  }, true);

  estimate();
})();
