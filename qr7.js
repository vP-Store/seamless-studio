/* Seamless Studio – QR-Codes, komplett im Geraet
   ============================================================================
   Ein QR-Code ist reine Mathematik – hier steht ein vollstaendiger Erzeuger:
   Byte-Modus, Fehlerkorrektur-Stufe M, Versionen 1–10 (bis ~210 Zeichen),
   Reed-Solomon ueber GF(256), Maske fest (Muster 0 – jede angesagte Maske
   ist gueltig und wird von allen Lesern verstanden; gegen einen echten
   Decoder verifiziert).

   Der Code landet als Bild-Element auf der Slide (Rahmen aus) – damit
   wandert er automatisch in jeden Export, auch in die Druck-PDFs.
   ========================================================================= */

(function () {
  if (!SS.ui || typeof SS.loadImageURL !== 'function') return;

  /* ---------------- GF(256) fuer Reed-Solomon ---------------- */
  const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
  (function () {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      EXP[i] = x; LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();
  const mul = (a, b) => (a && b) ? EXP[LOG[a] + LOG[b]] : 0;

  function rsGenerator(grad) {
    let g = [1];
    for (let i = 0; i < grad; i++) {
      const n = new Array(g.length + 1).fill(0);
      for (let j = 0; j < g.length; j++) {
        n[j] ^= mul(g[j], EXP[i]);
        n[j + 1] ^= g[j];
      }
      g = n;
    }
    return g.reverse();          // hoechster Grad zuerst
  }

  function rsRest(daten, grad) {
    const gen = rsGenerator(grad);
    const rest = new Uint8Array(daten.length + grad);
    rest.set(daten);
    for (let i = 0; i < daten.length; i++) {
      const f = rest[i];
      if (!f) continue;
      for (let j = 0; j < gen.length; j++) rest[i + j] ^= mul(gen[j], f);
    }
    return rest.slice(daten.length);
  }

  /* ---------------- Versionsdaten (Stufe M) ---------------- */
  /* [Gesamt-Codewoerter, EC je Block, [Datencodewoerter je Block …]] */
  const VERSIONEN = {
    1: [26, 10, [16]],
    2: [44, 16, [28]],
    3: [70, 26, [44]],
    4: [100, 18, [32, 32]],
    5: [134, 24, [43, 43]],
    6: [172, 16, [27, 27, 27, 27]],
    7: [196, 18, [31, 31, 31, 31]],
    8: [242, 22, [38, 38, 39, 39]],
    9: [292, 22, [36, 36, 36, 37, 37]],
    10: [346, 26, [43, 43, 43, 43, 44]],
  };
  const AUSRICHT = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
    6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50] };

  /* BCH-Rest: wert um Grad(poly) hochschieben, dann Mod-2-Division. */
  function bch(wert, poly) {
    const gradPoly = 32 - Math.clz32(poly) - 1;
    let v = wert << gradPoly;
    while (v && (32 - Math.clz32(v) - 1) >= gradPoly) {
      v ^= poly << ((32 - Math.clz32(v)) - (32 - Math.clz32(poly)));
    }
    return v;
  }

  SS.qrMatrix = function (text) {
    const bytes = new TextEncoder().encode(text);

    /* Version finden: Datenkapazitaet = Summe Datencodewoerter − 2 Kopf */
    let version = 0;
    for (let v = 1; v <= 10; v++) {
      const kap = VERSIONEN[v][2].reduce((a, b) => a + b, 0);
      const kopfBits = 4 + (v <= 9 ? 8 : 16);
      if (bytes.length * 8 + kopfBits + 4 <= kap * 8) { version = v; break; }
    }
    if (!version) return null;
    const [gesamt, ecJe, bloecke] = VERSIONEN[version];
    const datenKw = bloecke.reduce((a, b) => a + b, 0);

    /* Bitstrom: Modus 0100, Laenge, Daten, Terminator, Fueller */
    const bits = [];
    const schieb = (wert, anz) => { for (let i = anz - 1; i >= 0; i--) bits.push((wert >> i) & 1); };
    schieb(4, 4);
    schieb(bytes.length, version <= 9 ? 8 : 16);
    for (const b of bytes) schieb(b, 8);
    schieb(0, Math.min(4, datenKw * 8 - bits.length));
    while (bits.length % 8) bits.push(0);
    const daten = [];
    for (let i = 0; i < bits.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
      daten.push(b);
    }
    const fueller = [0xEC, 0x11];
    let fi = 0;
    while (daten.length < datenKw) daten.push(fueller[(fi++) % 2]);

    /* Bloecke + EC, dann verschraenken */
    const datBloecke = [], ecBloecke = [];
    let p = 0;
    for (const groesse of bloecke) {
      const teil = Uint8Array.from(daten.slice(p, p + groesse));
      p += groesse;
      datBloecke.push(teil);
      ecBloecke.push(rsRest(teil, ecJe));
    }
    const strom = [];
    const maxDat = Math.max(...bloecke);
    for (let i = 0; i < maxDat; i++) for (const bl of datBloecke) if (i < bl.length) strom.push(bl[i]);
    for (let i = 0; i < ecJe; i++) for (const bl of ecBloecke) strom.push(bl[i]);

    /* ---------------- Matrix ---------------- */
    const G = 17 + version * 4;
    const m = Array.from({ length: G }, () => new Array(G).fill(null));
    const setz = (r, c, v) => { m[r][c] = v ? 1 : 0; };

    function sucher(r, c) {
      for (let dr = -1; dr <= 7; dr++) for (let dc = -1; dc <= 7; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= G || cc >= G) continue;
        const im = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const rand = im && (dr === 0 || dr === 6 || dc === 0 || dc === 6);
        const kern = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setz(rr, cc, rand || kern);
      }
    }
    sucher(0, 0); sucher(0, G - 7); sucher(G - 7, 0);

    for (let i = 8; i < G - 8; i++) {
      if (m[6][i] === null) setz(6, i, i % 2 === 0);
      if (m[i][6] === null) setz(i, 6, i % 2 === 0);
    }
    for (const r of AUSRICHT[version]) for (const c of AUSRICHT[version]) {
      /* Nur die drei Sucher-Ecken auslassen. NICHT nach "schon belegt"
         pruefen: Muster auf der Taktspur (z. B. Zentrum 6,22) MUESSEN
         gezeichnet werden – ihre Ringe stimmen mit der Taktspur ueberein.
         Der alte Wächter hat genau sie verschluckt; ab Version 7 lasen
         weder zbar noch OpenCV den Code. */
      const ecke = (r === 6 && c === 6) || (r === 6 && c === G - 7) || (r === G - 7 && c === 6);
      if (ecke) continue;
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
        setz(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
      }
    }
    setz(G - 8, 8, 1);                                   // das dunkle Modul

    /* Formatfelder freihalten */
    const formatPlaetze = [];
    for (let i = 0; i <= 8; i++) {
      if (i !== 6) { formatPlaetze.push([8, i]); formatPlaetze.push([i, 8]); }
    }
    formatPlaetze.push([8, 8]);
    for (let i = 0; i < 8; i++) formatPlaetze.push([8, G - 1 - i]);
    for (let i = 0; i < 7; i++) formatPlaetze.push([G - 1 - i, 8]);
    for (const [r, c] of formatPlaetze) if (m[r][c] === null) m[r][c] = 0;

    /* Versionsinfo (ab Version 7) */
    if (version >= 7) {
      const vi = (version << 12) | bch(version, 0x1F25);
      for (let i = 0; i < 18; i++) {
        const bit = (vi >> i) & 1;
        setz(Math.floor(i / 3), G - 11 + (i % 3), bit);
        setz(G - 11 + (i % 3), Math.floor(i / 3), bit);
      }
    }

    /* Daten im Zickzack, Maske 0: (r+c) % 2 === 0 */
    let bitNr = 0;
    const holBit = () => {
      const byte = strom[bitNr >> 3];
      const bit = byte === undefined ? 0 : (byte >> (7 - (bitNr & 7))) & 1;
      bitNr++;
      return bit;
    };
    let col = G - 1, richtung = -1;
    while (col > 0) {
      if (col === 6) col--;
      let r = richtung < 0 ? G - 1 : 0;
      for (let s = 0; s < G; s++, r += richtung) {
        for (const cc of [col, col - 1]) {
          if (m[r][cc] !== null) continue;
          const bit = holBit();
          const maske = (r + cc) % 2 === 0 ? 1 : 0;
          m[r][cc] = bit ^ maske;
        }
      }
      col -= 2;
      richtung = -richtung;
    }

    /* Formatinfo: Stufe M (00) + Maske 0 (000) -> BCH + fester XOR */
    const fmtDaten = (0b00 << 3) | 0;
    const fmt = ((fmtDaten << 10) | bch(fmtDaten, 0x537)) ^ 0x5412;
    const fbit = (i) => (fmt >> i) & 1;
    /* Kopie 1 um das linke obere Suchmuster */
    const K1 = [[8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
                [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]];
    for (let i = 0; i < 15; i++) m[K1[i][0]][K1[i][1]] = fbit(14 - i);
    /* Kopie 2: unten links + oben rechts */
    for (let i = 0; i < 7; i++) m[G - 1 - i][8] = fbit(14 - i);
    for (let i = 7; i < 15; i++) m[8][G - 1 - (14 - i)] = fbit(14 - i);

    return m;
  };

  /* ---------------- Als Bild auf die Slide ---------------- */
  SS.qrBild = function (text, o) {
    const m = SS.qrMatrix(text);
    if (!m) return null;
    o = o || {};
    const px = o.px || 16, rand = 4;
    const G = m.length, B = (G + rand * 2) * px;
    const cv = SS.makeCanvas(B, B);
    const c = cv.getContext('2d');
    c.fillStyle = o.hell || '#ffffff';
    c.fillRect(0, 0, B, B);
    c.fillStyle = o.dunkel || '#1c1815';
    for (let r = 0; r < G; r++) for (let cc = 0; cc < G; cc++) {
      if (m[r][cc]) c.fillRect((cc + rand) * px, (r + rand) * px, px, px);
    }
    const url = cv.toDataURL('image/png');
    SS.freeCanvas(cv);
    return url;
  };

  async function einfuegen(text, dunkel, hell) {
    const url = SS.qrBild(text, { dunkel, hell });
    if (!url) { SS.toast('Der Text ist zu lang für einen QR-Code (max. ~210 Zeichen)', 3600, 'err'); return; }
    const rec = await SS.loadImageURL(url);
    const imgId = 'qr' + Date.now().toString(36);
    SS.images[imgId] = rec;
    const k = SS.canvasSize();
    const mitte = SS.aktuelleSlideMitte ? SS.aktuelleSlideMitte() : { x: k.slideW / 2, y: k.H / 2 };
    const el = SS.normalizeEl({
      id: SS.uid(), type: 'photo', imgId,
      x: mitte.x, y: k.H * 0.72, rot: 0,
      h: Math.round(k.H * 0.20),
      flip: false, opacity: 1,
      frame: Object.assign(SS.defaultFrame(), { style: 'none', border: 0, shadow: 0 }),
      filter: SS.defaultFilter(),
    });
    SS.state.elements.push(el);
    SS.state.selectedIds = [el.id];
    SS.pushHistory('QR-Code');
    SS.ui.refreshLayers && SS.ui.refreshLayers();
    SS.ui.showProps && SS.ui.showProps();
    SS.requestRender();
    SS.toast('QR-Code liegt auf der Slide – verschieben und skalieren wie ein Foto', 3200, 'ok');
  }

  function dialog() {
    let d = document.getElementById('qrDlg');
    if (d) d.remove();
    d = document.createElement('div');
    d.id = 'qrDlg';
    d.className = 'modal';
    const vorschlag = (SS.marke && SS.marke.website) || 'https://';
    d.innerHTML = '<div class="modal-card" style="max-width:420px">' +
      '<div class="sort-head"><h3>QR-Code einfügen</h3><button id="qrClose">✕</button></div>' +
      '<div class="ctl"><span>Ziel</span><input type="text" id="qrText" style="flex:1" value="' + vorschlag + '"></div>' +
      '<div class="ctl"><span>Farbe</span><input type="color" id="qrDunkel" value="#1c1815">' +
      '<input type="color" id="qrHell" value="#ffffff"></div>' +
      '<button id="qrGo" class="wide primary" style="margin-top:10px">Auf die Slide legen</button>' +
      '<p class="hint">Für Shop-Link auf der letzten Slide, in Stories – und in den Druck-PDFs: ' +
      'ein gedrucktes Produkt mit QR ist Werbung, die im Wohnzimmer hängt. ' +
      'Dunkle Farbe dunkel lassen, sonst lesen ihn Handys schlecht.</p></div>';
    document.body.appendChild(d);
    d.querySelector('#qrClose').onclick = () => d.remove();
    d.addEventListener('pointerdown', (e) => { if (e.target === d) d.remove(); });
    d.querySelector('#qrGo').onclick = () => {
      const text = d.querySelector('#qrText').value.trim();
      if (text.length < 4) { SS.toast('Bitte einen Link eintragen', 2400, 'warn'); return; }
      const dunkel = d.querySelector('#qrDunkel').value;
      const hell = d.querySelector('#qrHell').value;
      d.remove();
      einfuegen(text, dunkel, hell);
    };
  }

  const kasten = document.getElementById('markeBox');
  if (kasten) {
    const kn = document.createElement('button');
    kn.id = 'btnQr';
    kn.className = 'wide';
    kn.textContent = 'QR-Code einfügen … (Shop-Link)';
    kasten.appendChild(kn);
    kn.onclick = dialog;
  }

  SS.QR7 = { bereit: true };
})();
