/* Seamless Studio – Farbtreue selbst nachmessen (v8.4)
   ============================================================================
   Zweimal habe ich aus der Ferne die falsche Ursache benannt. Diese Datei baut
   die Messung deshalb dorthin, wo der Fehler auftritt: **auf das Gerät**.

   Der Maßstab ist die Datei selbst, ungefärbt gelesen:

       createImageBitmap(datei, { colorSpaceConversion: 'none' })

   Damit übergeht der Browser seine eigene Farbverwaltung und liefert genau die
   Zahlen, die in der Datei stehen. Alles andere wird dagegen gehalten:

     1 · Datei roh                      – der Maßstab
     2 · Datei normal dekodiert         – rechnet der Browser beim Dekodieren um?
     3 · nach `SS.loadImageFile`        – rechnet der Einleseweg um?
     4 · nach Rahmen (`photoCard`)      – rechnet die Rahmenwerkstatt um?
     5 · nach `paintScene` (Export)     – rechnet der Export um?

   Verglichen wird auf gemeinsamer Größe, mit drei Zahlen je Stufe:

     · mittlere Abweichung je Kanal (R/G/B),
     · **Grünstich** `G − (R + B) / 2` auf Hautpixeln – der Wert, um den es geht,
     · **Farbton** der Haut in Grad; eine Drehung Richtung Gelb ist genau das,
       was als „grüne Flecken" auffällt.

   Hautpixel werden über den Farbton gewählt (5–40°, Sättigung 0,15–0,60), nicht
   über Kanalvergleiche – sonst zählt grünes Laub mit.

   Dazu kommt, was das Gerät über sich verrät: Farbraum der Leinwand, ob der
   Bildschirm P3 kann, Pixelverhältnis, Browserkennung. Das Ergebnis lässt sich
   mit einem Knopf kopieren.

   Diese Datei ändert **nichts** am Zeichnen und nichts an Projekten. Sie misst
   nur.
   ========================================================================= */

(function () {
  if (!SS.state || typeof SS.loadImageFile !== 'function') return;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ==================================================================
     1 · Messwerkzeug
     ================================================================== */
  const BREITE = 480;                    // gemeinsame Vergleichsbreite

  function aufMass(quelle, w, h) {
    const zh = Math.max(1, Math.round(BREITE * h / w));
    const cv = document.createElement('canvas');
    cv.width = BREITE; cv.height = zh;
    const c = cv.getContext('2d', { willReadFrequently: true });
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = 'high';
    c.drawImage(quelle, 0, 0, BREITE, zh);
    return c.getImageData(0, 0, BREITE, zh);
  }

  function hautWerte(bild) {
    const d = bild.data;
    let n = 0, sr = 0, sg = 0, sb = 0, st = 0, sh = 0;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), dd = mx - mn;
      if (!dd || !mx) continue;
      let h = mx === r ? ((g - b) / dd) % 6 : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4;
      h *= 60; if (h < 0) h += 360;
      const s = dd / mx, v = mx / 255;
      if (!(h >= 5 && h <= 40 && s >= 0.15 && s <= 0.60 && v >= 0.30 && v <= 0.99)) continue;
      n++; sr += r; sg += g; sb += b; st += g - (r + b) / 2; sh += h;
    }
    if (n < 200) return null;
    return { pixel: n, r: +(sr / n).toFixed(1), g: +(sg / n).toFixed(1), b: +(sb / n).toFixed(1),
      farbton: +(sh / n).toFixed(1), gruenstich: +(st / n).toFixed(2) };
  }

  function abstand(a, b) {
    if (!a || !b || a.data.length !== b.data.length) return null;
    let n = 0, sr = 0, sg = 0, sb = 0, mr = 0, mg = 0, mb = 0;
    for (let i = 0; i < a.data.length; i += 4) {
      const dr = Math.abs(a.data[i] - b.data[i]);
      const dg = Math.abs(a.data[i + 1] - b.data[i + 1]);
      const db = Math.abs(a.data[i + 2] - b.data[i + 2]);
      n++; sr += dr; sg += dg; sb += db;
      if (dr > mr) mr = dr; if (dg > mg) mg = dg; if (db > mb) mb = db;
    }
    return { mittel: [+(sr / n).toFixed(2), +(sg / n).toFixed(2), +(sb / n).toFixed(2)],
      spitze: [mr, mg, mb] };
  }

  /* ==================================================================
     2 · Die Stufen
     ================================================================== */
  async function messen(datei, melde) {
    const erg = { datei: { name: datei.name, kb: Math.round(datei.size / 1024), typ: datei.type } };

    /* Umgebung */
    const pruefCv = document.createElement('canvas');
    const pruefCtx = pruefCv.getContext('2d');
    erg.geraet = {
      browser: navigator.userAgent.slice(0, 110),
      leinwand_farbraum: (pruefCtx.getContextAttributes && pruefCtx.getContextAttributes().colorSpace) || 'unbekannt',
      p3_bildschirm: !!(window.matchMedia && window.matchMedia('(color-gamut: p3)').matches),
      pixelverhaeltnis: window.devicePixelRatio || 1,
      p3_leinwand_moeglich: (() => {
        try {
          const t = document.createElement('canvas').getContext('2d', { colorSpace: 'display-p3' });
          return !!(t && t.getContextAttributes && t.getContextAttributes().colorSpace === 'display-p3');
        } catch (e) { return false; }
      })(),
    };

    /* 1 · roh, ohne jede Farbumrechnung */
    melde('Datei roh lesen …');
    let roh = null, rohBild = null;
    try {
      rohBild = await createImageBitmap(datei, { colorSpaceConversion: 'none' });
      roh = aufMass(rohBild, rohBild.width, rohBild.height);
      erg.stufe1_datei_roh = { groesse: rohBild.width + '×' + rohBild.height, haut: hautWerte(roh) };
    } catch (e) {
      erg.stufe1_datei_roh = { fehler: String(e).slice(0, 80) };
    }

    /* 2 · normal dekodiert – hier greift die Farbverwaltung des Browsers */
    melde('Datei normal dekodieren …');
    try {
      const norm = await createImageBitmap(datei);
      const p = aufMass(norm, norm.width, norm.height);
      erg.stufe2_normal_dekodiert = { haut: hautWerte(p), gegen_roh: abstand(roh, p) };
      norm.close && norm.close();
    } catch (e) { erg.stufe2_normal_dekodiert = { fehler: String(e).slice(0, 80) }; }

    /* 3 · so, wie die App das Foto einliest */
    melde('Einleseweg der App …');
    let rec = null;
    try {
      rec = await SS.loadImageFile(datei);
      const p = aufMass(rec.img, rec.w, rec.h);
      erg.stufe3_einlesen = { weg: rec.weg || 'alt', groesse: rec.w + '×' + rec.h,
        haut: hautWerte(p), gegen_roh: abstand(roh, p) };
    } catch (e) { erg.stufe3_einlesen = { fehler: String(e).slice(0, 80) }; }

    /* 4 · durch die Rahmenwerkstatt, neutraler Filter, ohne Rahmen und mit */
    if (rec) {
      melde('Rahmen …');
      const merkImgs = SS.images['__farbcheck'];
      SS.images['__farbcheck'] = rec;
      const el = SS.normalizeEl({
        id: '__farbcheck_el', type: 'photo', imgId: '__farbcheck',
        x: 0, y: 0, h: Math.min(1200, rec.h), rot: 0, opacity: 1,
        frame: Object.assign(SS.defaultFrame(), { style: 'none', shadow: 0 }),
        filter: SS.defaultFilter(),
      });
      try {
        SS.photoCacheClear && SS.photoCacheClear(el.id);
        SS.cardCacheClear && SS.cardCacheClear(el.id);
        const k = SS.photoCard(el);
        const p = aufMass(k, k.width, k.height);
        erg.stufe4_rahmen_ohne = { karte: k.width + '×' + k.height, haut: hautWerte(p), gegen_roh: abstand(roh, p) };
      } catch (e) { erg.stufe4_rahmen_ohne = { fehler: String(e).slice(0, 80) }; }

      /* 5 · und einmal durch den Export-Maler */
      melde('Export …');
      try {
        const alteEl = SS.state.elements;
        const k = SS.canvasSize();
        el.x = k.slideW / 2; el.y = k.H / 2;
        el.h = Math.min(k.H * 0.92, rec.h);
        SS.state.elements = [el];
        SS.photoCacheClear && SS.photoCacheClear(el.id);
        SS.cardCacheClear && SS.cardCacheClear(el.id);
        const g = SS.elSize(el);
        const cv = document.createElement('canvas');
        cv.width = Math.round(g.w); cv.height = Math.round(g.h);
        const c = cv.getContext('2d', { willReadFrequently: true });
        c.translate(cv.width / 2 - el.x, cv.height / 2 - el.y);
        SS.paintScene(c, k.W, k.H, { forExport: true, noBg: true });
        const p = aufMass(cv, cv.width, cv.height);
        erg.stufe5_export = { flaeche: cv.width + '×' + cv.height, haut: hautWerte(p), gegen_roh: abstand(roh, p) };
        SS.state.elements = alteEl;
      } catch (e) { erg.stufe5_export = { fehler: String(e).slice(0, 80) }; }

      /* aufräumen */
      if (merkImgs === undefined) delete SS.images['__farbcheck']; else SS.images['__farbcheck'] = merkImgs;
      SS.photoCacheClear && SS.photoCacheClear('__farbcheck_el');
      SS.cardCacheClear && SS.cardCacheClear('__farbcheck_el');
      if (rec.blobURL) { try { URL.revokeObjectURL(rec.blobURL); } catch (e) {} }
    }
    if (rohBild && rohBild.close) rohBild.close();

    /* Kurzurteil: wo springt der Farbton? */
    const stufen = [['Datei roh', erg.stufe1_datei_roh], ['normal dekodiert', erg.stufe2_normal_dekodiert],
      ['Einlesen', erg.stufe3_einlesen], ['Rahmen', erg.stufe4_rahmen_ohne], ['Export', erg.stufe5_export]];
    const reihe = stufen.map(([n, s]) => ({ n, ton: s && s.haut ? s.haut.farbton : null,
      stich: s && s.haut ? s.haut.gruenstich : null }));
    erg.farbton_verlauf = reihe;
    let schuld = null;
    for (let i = 1; i < reihe.length; i++) {
      if (reihe[i].ton == null || reihe[i - 1].ton == null) continue;
      const d = reihe[i].ton - reihe[i - 1].ton;
      if (Math.abs(d) >= 1.5 && (!schuld || Math.abs(d) > Math.abs(schuld.drehung))) {
        schuld = { schritt: reihe[i - 1].n + ' → ' + reihe[i].n, drehung: +d.toFixed(1) };
      }
    }
    erg.auffaellig = schuld || 'kein Schritt dreht den Farbton um mehr als 1,5°';
    return erg;
  }

  /* ==================================================================
     3 · Bedienung
     ================================================================== */
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*'; inp.style.display = 'none';
  document.body.appendChild(inp);

  function fenster() {
    const alt = document.getElementById('fcDlg');
    if (alt) alt.remove();
    const d = document.createElement('div');
    d.id = 'fcDlg'; d.className = 'modal';
    d.innerHTML = '<div class="modal-card" style="max-width:520px">'
      + '<div class="sort-head"><h3>Farbtreue prüfen</h3><button id="fcZu">✕</button></div>'
      + '<p class="hint" id="fcStand">Wähle das Foto, um das es geht. Die App vergleicht jede Stufe '
      + 'mit den Rohdaten der Datei und zeigt, wo sich die Farbe ändert.</p>'
      + '<pre id="fcOut" style="white-space:pre-wrap;word-break:break-word;font-size:11px;line-height:1.45;'
      + 'max-height:46vh;overflow:auto;background:var(--surface-2,#1c1917);color:var(--ink,#eee);'
      + 'border:1px solid var(--line,#3a3532);border-radius:8px;padding:10px;margin:8px 0;display:none"></pre>'
      + '<button id="fcWahl" class="wide primary">Foto wählen …</button>'
      + '<button id="fcKopie" class="wide" style="margin-top:8px;display:none">Ergebnis kopieren</button>'
      + '</div>';
    document.body.appendChild(d);
    d.querySelector('#fcZu').onclick = () => d.remove();
    d.addEventListener('pointerdown', (e) => { if (e.target === d) d.remove(); });
    d.querySelector('#fcWahl').onclick = () => inp.click();
    return d;
  }

  inp.addEventListener('change', async () => {
    const f = inp.files && inp.files[0];
    inp.value = '';
    if (!f) return;
    const d = document.getElementById('fcDlg') || fenster();
    const stand = d.querySelector('#fcStand');
    const out = d.querySelector('#fcOut');
    const kopie = d.querySelector('#fcKopie');
    stand.textContent = 'Messe …';
    let erg;
    try { erg = await messen(f, (t) => { stand.textContent = t; }); }
    catch (e) { erg = { fehler: String(e) }; }
    const text = JSON.stringify(erg, null, 1);
    out.style.display = 'block';
    out.textContent = text;
    stand.textContent = 'Fertig. Schick mir diesen Text – die Stufe, bei der der Farbton springt, ist die Ursache.';
    kopie.style.display = 'block';
    kopie.onclick = async () => {
      try { await navigator.clipboard.writeText(text); SS.toast && SS.toast('Ergebnis kopiert', 2200, 'ok'); }
      catch (e) {
        const r = document.createRange(); r.selectNodeContents(out);
        const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        SS.toast && SS.toast('Markiert – bitte von Hand kopieren', 3000, 'info');
      }
    };
    SS.FARBCHECK84.letztes = erg;
  });

  SS.farbCheck = fenster;

  /* Knopf im Foto-Bereich */
  const regal = document.getElementById('photoShelf');
  if (regal && regal.parentElement) {
    const reihe = document.createElement('div');
    reihe.className = 'chips';
    const b = document.createElement('button');
    b.textContent = '🎨 Farbtreue prüfen …';
    b.onclick = () => fenster();
    reihe.appendChild(b);
    regal.parentElement.insertBefore(reihe, regal.nextSibling);
  }

  SS.FARBCHECK84 = { bereit: true, version: '8.4.0', letztes: null };
})();
