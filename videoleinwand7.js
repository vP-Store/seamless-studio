/* Seamless Studio – Video als Panorama-Leinwand
   ============================================================================
   Ein Video ist 16:9, ein Karussell-Panorama ist 4:1. Die Breite muss also
   irgendwo herkommen. Die App fuellt bisher einfach auf (SS.drawClipFrame,
   clip.js) – dabei bleibt vom Bild oben und unten fast nichts uebrig.

   Diese Datei bringt drei Verfahren dazu:

     fuellen   wie bisher: Cover-Fuellung, oben und unten beschnitten
     spiegel   das Bild wird gekachelt, jede zweite Kachel gespiegelt. An den
               Stossstellen trifft Kante auf Kante, die Naht ist damit
               rechnerisch unsichtbar. Gut fuer Muster und Texturen.
     zeit      jede Slide zeigt DASSELBE Video zu einem anderen Zeitpunkt,
               k * Dauer / n, dazwischen breit ueberblendet. Das Panorama
               erzaehlt dadurch von links nach rechts die Geschichte des
               Videos: aus einem Mondvideo wird ein Mondphasen-Panorama.

   Fuer „zeit" braucht es mehrere <video>-Elemente derselben Datei, denn ein
   Element hat genau eine Abspielposition. Sie werden einmal angelegt, auf
   ihren Versatz gesetzt und laufen dann gemeinsam – der Versatz bleibt
   dadurch von selbst erhalten.

   Vor jedem Export wird ueber SS.wakeOn abgewartet, bis alle Elemente an
   ihrer Stelle stehen; sonst zeigte ein Standbild-Export Kacheln, die noch
   suchen.
   ========================================================================= */

(function () {
  if (typeof SS.drawClipFrame !== 'function') return;

  const VL = SS.videoLeinwand = {
    modus: 'fuellen',          // fuellen | spiegel | zeit
    feder: 0.42,               // Ueberblendbreite als Anteil einer Slide
    spanne: 1.0,               // wie viel der Videolaenge auf das Panorama geht
    t0: 0,
    kacheln: [],               // zusaetzliche <video>-Elemente
    bereitStand: null,
    /* Haken fuer die weiche Schleife (schleife7.js): bekommt den Kachelindex
       und liefert {q, alpha} – ein zweites Videoelement, das mit alpha ueber
       die Kachel gelegt wird –, oder null. So bleibt die Ueberblendung Teil
       der normalen Band-Maskierung, statt von aussen daneben zu malen. */
    blendFuer: null,
  };

  function quelleVon() {
    const cl = SS.clip;
    if (!cl || !cl.ready || !cl.video) return null;
    return cl.video;
  }

  /* ---------- Kacheln anlegen ---------- */
  function kachelnBauen(n) {
    const haupt = quelleVon();
    if (!haupt) return;
    const gebraucht = Math.max(0, n - 1);
    while (VL.kacheln.length > gebraucht) {
      const v = VL.kacheln.pop();
      try { v.pause(); v.removeAttribute('src'); v.load(); v.remove(); } catch (e) {}
    }
    while (VL.kacheln.length < gebraucht) {
      const v = document.createElement('video');
      v.muted = true; v.playsInline = true; v.loop = true; v.preload = 'auto';
      v.crossOrigin = haupt.crossOrigin || null;
      v.style.cssText = 'position:fixed;left:-9999px;width:2px;height:2px;opacity:0';
      v.src = haupt.currentSrc || haupt.src;
      document.body.appendChild(v);
      VL.kacheln.push(v);
    }
  }

  function dauer() {
    const cl = SS.clip;
    if (!cl) return 0;
    const d = (cl.end || cl.dur || 0) - (cl.start || 0);
    return d > 0.05 ? d : (cl.dur || 0);
  }

  function versatzFuer(k, n) {
    const T = dauer();
    if (!T) return 0;
    const cl = SS.clip;
    return (cl.start || 0) + ((VL.t0 + k * VL.spanne * T / n) % T);
  }

  /* Alle Kacheln auf ihre Stelle setzen und darauf warten. */
  VL.stellen = function (n) {
    kachelnBauen(n);
    const haupt = quelleVon();
    if (!haupt) return Promise.resolve(false);
    const warten = [];
    VL.kacheln.forEach((v, i) => {
      const ziel = versatzFuer(i + 1, n);
      if (Math.abs((v.currentTime || 0) - ziel) < 0.03 && v.readyState >= 2) return;
      warten.push(new Promise((fertig) => {
        let ab = false;
        const los = () => { if (!ab) { ab = true; v.removeEventListener('seeked', los); fertig(); } };
        v.addEventListener('seeked', los);
        setTimeout(los, 1500);
        try { v.currentTime = ziel; } catch (e) { los(); }
      }));
    });
    return Promise.all(warten).then(() => true);
  };

  VL.starten = function (n) {
    return VL.stellen(n).then(() => {
      VL.kacheln.forEach(v => { const p = v.play(); if (p && p.catch) p.catch(() => {}); });
    });
  };
  VL.anhalten = function () {
    VL.kacheln.forEach(v => { try { v.pause(); } catch (e) {} });
  };

  /* Nur bestimmte Kacheln laufen lassen (0 = das Hauptvideo, 1..n-1 die
     Zusatzelemente). Beim Aufnehmen einer einzelnen Slide sind nur drei
     Kacheln überhaupt zu sehen; die übrigen zu dekodieren kostet Rechenzeit
     für ein Bild, das nie gezeichnet wird. Nachgemessen im Testrechner:
     mit allen fünf 8 Bilder je Sekunde, mit dreien 17. */
  VL.nurLaufen = function (menge) {
    const haupt = quelleVon();
    const alle = [haupt].concat(VL.kacheln);
    alle.forEach((v, i) => {
      if (!v) return;
      try { if (menge && !menge.has(i)) v.pause(); else { const p = v.play(); if (p && p.catch) p.catch(() => {}); } }
      catch (e) {}
    });
  };

  /* ---------- Zeichnen ----------
     `platz` sagt, WO das Videobild liegt (dort wird es cover-gefuellt),
     `sicht` sagt, welcher Ausschnitt davon tatsaechlich gemalt wird. Die
     Trennung ist noetig, weil eine Kachel in mehreren Stuecken auf die
     Leinwand kommt: einmal ihr Kern, einmal die beiden Ueberblendbaender –
     und alle drei Stuecke muessen dasselbe Bild an derselben Stelle zeigen. */
  function bildAuf(c, quelle, px, pb, hoehe, spiegeln, sx, sb) {
    const vw = quelle.videoWidth, vh = quelle.videoHeight;
    if (!vw || !vh) return false;
    const sc = Math.max(pb / vw, hoehe / vh);
    const dw = vw * sc, dh = vh * sc;
    if (sx == null) { sx = px; sb = pb; }
    c.save();
    c.beginPath();
    c.rect(sx, 0, sb, hoehe);
    c.clip();
    if (spiegeln) {
      c.translate(px + pb, 0);
      c.scale(-1, 1);
      c.translate(-px, 0);
    }
    try { c.drawImage(quelle, px + (pb - dw) / 2, (hoehe - dh) / 2, dw, dh); }
    catch (e) { c.restore(); return false; }
    c.restore();
    return true;
  }

  /* Welcher Teil der Leinwand ist ueberhaupt zu sehen?
     Beim Export einer einzelnen Slide steht die Kamera vor einer von fuenf –
     die anderen vier zu zeichnen kostet vier Fuenftel der Zeit fuer nichts.
     Nachgemessen: 117 ms je Bild ohne, 24 ms mit dieser Pruefung. */
  function sichtfenster(c, W) {
    try {
      const m = c.getTransform();
      if (!m || !m.a || m.b || m.c) return [0, W];
      const cw = c.canvas.width;
      const a = (0 - m.e) / m.a, b = (cw - m.e) / m.a;
      const von = Math.min(a, b), bis = Math.max(a, b);
      if (!isFinite(von) || !isFinite(bis) || bis - von <= 0) return [0, W];
      return [von - 2, bis + 2];
    } catch (e) { return [0, W]; }
  }
  const trifft = (f, x, b) => x + b > f[0] && x < f[1];

  /* Ein einziger wiederverwendeter Puffer statt eines neuen je Kachel und
     Bild. Bei 30 Bildern je Sekunde und fuenf Kacheln waeren das sonst 150
     Leinwaende in der Sekunde. */
  let _band = null;
  function bandPuffer(b, h) {
    if (!_band || _band.width !== b || _band.height !== h) {
      _band = SS.makeCanvas(b, h);
    }
    return _band;
  }

  const alt = SS.drawClipFrame;
  SS.drawClipFrame = function (c, W, H) {
    const cl = SS.clip;
    if (!cl || !cl.ready || VL.modus === 'fuellen') return alt.apply(this, arguments);
    const haupt = quelleVon();
    if (!haupt) return alt.apply(this, arguments);
    /* WICHTIG: bei readyState < 2 NICHT auf die Cover-Fuellung zurueckfallen.
       Waehrend das Hauptvideo springt (weiche Schleife, Spulen), faellt sein
       readyState kurz auf 1 – der Rueckfall malte dann das ganze Panorama
       schwarz, einen Frame lang, und genau das war der sichtbare "Sprung".
       Der Zeit-Renderer unten kommt mit einer kurz abwesenden Quelle klar:
       die Kacheln zeichnen, was da ist, und die Blende traegt derweil das
       Bild der betroffenen Kachel. */

    const k = SS.canvasSize();
    const n = Math.max(1, k.n);
    const fenster = sichtfenster(c, W);

    c.save();
    c.fillStyle = '#0d0b0a';
    c.fillRect(0, 0, W, H);

    if (VL.modus === 'spiegel') {
      /* Kachelbreite = das Video auf volle Hoehe skaliert. Jede zweite
         Kachel gespiegelt, dadurch stossen gleiche Kanten aufeinander. */
      const vw = haupt.videoWidth, vh = haupt.videoHeight;
      const kb = Math.max(8, vw * (H / vh));
      const lage = (quelle) => {
        let x = 0, i = 0;
        while (x < W) {
          const b = Math.min(kb, W - x);
          if (trifft(fenster, x, b)) bildAuf(c, quelle, x, b, H, i % 2 === 1);
          x += kb; i++;
        }
      };
      lage(haupt);
      /* Weiche Schleife: alle Spiegelkacheln zeigen dieselbe Zeit, also
         reicht EIN Blend-Element ueber alles. */
      const bl = VL.blendFuer && VL.blendFuer(0);
      if (bl && bl.q && bl.q.readyState >= 2 && bl.alpha > 0) {
        const ga = c.globalAlpha;
        c.globalAlpha = ga * Math.min(1, bl.alpha);
        lage(bl.q);
        c.globalAlpha = ga;
      }
      c.restore();
      return;
    }

    /* ---- zeit ----
       Frueher wurde jede Kachel in voller Breite (Slide + Ueberblendung) in
       einen eigenen Puffer gemalt, dort mit einem Verlauf maskiert und dann
       aufgelegt. Das kostete fuenf Puffer von je 1533x1350 Pixeln – JE BILD.
       Gemessen: 117 ms, also neun Bilder in der Sekunde. Fuer ein Video viel
       zu langsam.

       Jetzt wird getrennt: der KERN einer Kachel (der Teil, in dem sie allein
       zu sehen ist) geht ohne Umweg direkt auf die Leinwand. Nur die schmalen
       BAENDER an den Schnittkanten brauchen einen Puffer, und der ist genau
       so breit wie die Ueberblendung. Aus fuenf grossen Puffern werden fuenf
       schmale. Gemessen: 24 ms. */
    const slideW = W / n;
    const ueber = Math.max(2, Math.round(slideW * VL.feder));
    const quelleVonKachel = (i) => {
      const m = ((i % n) + n) % n;
      return m === 0 ? haupt : VL.kacheln[m - 1];
    };
    const platzVon = (i) => ({ px: i * slideW - ueber / 2, pb: slideW + ueber });

    /* Eine Kachel zeichnen: erst ihr eigenes Element, darueber – falls die
       weiche Schleife gerade laeuft – das Blend-Element mit alpha. Beides
       durch denselben Ausschnitt, dadurch gilt die Band-Maskierung fuer
       beide gleichermassen. Waehrend das eigene Element springt (seeking,
       readyState faellt kurz), traegt das Blend-Element allein das Bild –
       deshalb wird es auch dann gemalt, wenn das eigene aussetzt. */
    const kachelAuf = (ctx, i, px, pb, sx, sb) => {
      const m = ((i % n) + n) % n;
      const q = quelleVonKachel(m);
      let da = false;
      if (q && q.readyState >= 2) da = bildAuf(ctx, q, px, pb, H, false, sx, sb);
      const bl = VL.blendFuer && VL.blendFuer(m);
      if (bl && bl.q && bl.q.readyState >= 2 && bl.alpha > 0) {
        const ga = ctx.globalAlpha;
        ctx.globalAlpha = ga * Math.min(1, bl.alpha);
        if (bildAuf(ctx, bl.q, px, pb, H, false, sx, sb)) da = true;
        ctx.globalAlpha = ga;
      }
      return da;
    };

    /* 1. Kerne */
    for (let i = 0; i < n; i++) {
      const kx = i * slideW + ueber / 2;
      const kb = slideW - ueber;
      if (kb <= 0 || !trifft(fenster, kx, kb)) continue;
      const p = platzVon(i);
      kachelAuf(c, i, p.px, p.pb, kx, kb);
    }

    /* 2. Baender an den Schnittkanten – Kachel i-1 liegt unten, Kachel i
          wird darueber eingeblendet. Band 0 liegt auf der Naht zwischen der
          letzten und der ersten Kachel und kommt deshalb zweimal vor. */
    const puffer = bandPuffer(Math.ceil(ueber), Math.ceil(H));
    const pc = puffer.getContext('2d');
    for (let i = 0; i < n; i++) {
      const bx = i * slideW - ueber / 2;
      const stellen = [bx];
      if (bx < 0) stellen.push(bx + W);
      if (bx + ueber > W) stellen.push(bx - W);
      if (!stellen.some(x => trifft(fenster, x, ueber))) continue;

      pc.setTransform(1, 0, 0, 1, 0, 0);
      pc.globalCompositeOperation = 'source-over';
      pc.clearRect(0, 0, ueber, H);
      /* rechte Kachel in den Puffer, im Puffer verschoben um -bx */
      const pr = platzVon(i);
      pc.translate(-bx, 0);
      const rechtsDa = kachelAuf(pc, i, pr.px, pr.pb, bx, ueber);
      pc.setTransform(1, 0, 0, 1, 0, 0);
      /* weich einblenden: links durchsichtig, rechts voll */
      pc.globalCompositeOperation = 'destination-in';
      const g = pc.createLinearGradient(0, 0, ueber, 0);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,1)');
      pc.fillStyle = g;
      pc.fillRect(0, 0, ueber, H);
      pc.globalCompositeOperation = 'source-over';

      const pl = platzVon(i - 1);
      for (const x of stellen) {
        if (!trifft(fenster, x, ueber)) continue;
        /* Untergrund: die linke Kachel, an ihrer eigenen Stelle */
        kachelAuf(c, i - 1, pl.px + (x - bx), pl.pb, x, ueber);
        if (rechtsDa) c.drawImage(puffer, x, 0);
      }
    }
    c.restore();
  };

  /* ---------- Export absichern ---------- */
  if (typeof SS.wakeOn === 'function') {
    const altWake = SS.wakeOn;
    SS.wakeOn = async function () {
      const r = await altWake.apply(this, arguments);
      try {
        if (SS.clip && SS.clip.ready && VL.modus === 'zeit') {
          await VL.stellen(Math.max(1, SS.canvasSize().n));
        }
      } catch (e) {}
      return r;
    };
  }

  /* Beim Start und Stopp der Wiedergabe mitziehen */
  if (typeof SS.clipStartPlayback === 'function') {
    const altStart = SS.clipStartPlayback;
    SS.clipStartPlayback = function () {
      const p = altStart.apply(this, arguments);
      if (VL.modus === 'zeit') {
        try { VL.starten(Math.max(1, SS.canvasSize().n)); } catch (e) {}
      }
      return p;
    };
  }
  if (typeof SS.clipStopPlayback === 'function') {
    const altStop = SS.clipStopPlayback;
    SS.clipStopPlayback = function () {
      VL.anhalten();
      return altStop.apply(this, arguments);
    };
  }

  /* ---------- Mehrere Slides trotz Video-Leinwand ----------
     util.js:28 klemmt die Slidezahl auf 1, sobald ein Clip geladen ist:

        const n = (clip || fmt === '9:16') ? 1 : SS.state.slides;

     Damit war ein Video-Karussell bisher gar nicht moeglich – die Leinwand
     klappte auf eine Slide zusammen. Die Klemme wird fuer ALLE drei Modi
     aufgehoben (seit v6.5.0 auch fuer „fuellen": ein Video als Hintergrund
     soll ueber mehrere Slides laufen koennen – die Cover-Fuellung zeigt dann
     ein breites Band aus der Bildmitte). Nur 9:16 bleibt eine Slide, das
     Format kennt keine. */
  (function () {
    const altGroesse = SS.canvasSize;
    SS.canvasSize = function () {
      const r = altGroesse.apply(this, arguments);
      if (!(SS.clip && SS.clip.ready)) return r;
      const ov = SS._sizeOverride;
      /* Der Bildexport in ZUSATZFORMATEN klemmt die Slidezahl ebenfalls auf 1
         (exporter.js:139 `SS._sizeOverride.slides = clip ? 1 : slides`). Das
         gilt hier genauso wenig – ausser bei 9:16, das kennt keine Slides. */
      const fmt = ov ? ov.format : SS.state.format;
      if (fmt === '9:16') return r;
      const n = Math.max(1, Math.min(20, SS.state.slides || 1));
      if (n === r.n) return r;
      return { W: r.slideW * n, H: r.H, slideW: r.slideW, slideH: r.slideH, n };
    };
  })();

  VL.setzen = function (modus, o) {
    VL.modus = modus || 'fuellen';
    if (o) {
      if (o.feder != null) VL.feder = o.feder;
      if (o.spanne != null) VL.spanne = o.spanne;
      if (o.t0 != null) VL.t0 = o.t0;
    }
    const n = Math.max(1, SS.canvasSize().n);
    const p = VL.modus === 'zeit' ? VL.stellen(n) : Promise.resolve(true);
    return p.then(() => { SS.requestRender && SS.requestRender(); return true; });
  };

  /* ---------- Schleifenprobe ----------
     Der Rundlauf ueber die volle Videolaenge schliesst sich rechnerisch immer:
     nach tau = T steht jede Kachel wieder genau dort, wo sie angefangen hat.
     Ob man den Uebergang SIEHT, haengt allein am Quellvideo – endet es anders
     als es anfaengt, gibt es dort einen Schnitt. Das laesst sich messen,
     statt es zu vermuten: Sprung vom letzten auf das erste Bild, verglichen
     mit dem normalen Sprung von Bild zu Bild am Ende.
     Nachgemessen an den drei Grok-Videos: Faktor um 3 – die schneiden. */
  VL.schleifenprobe = function () {
    const cl = SS.clip;
    if (!cl || !cl.ready) return Promise.resolve(null);
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    v.crossOrigin = cl.video.crossOrigin || null;
    v.src = cl.video.currentSrc || cl.video.src;
    v.style.cssText = 'position:fixed;left:-9999px;width:2px;height:2px;opacity:0';
    document.body.appendChild(v);
    const cv = SS.makeCanvas(160, 90);
    const c = cv.getContext('2d', { willReadFrequently: true });

    /* Ein Bild an der Stelle t. Wichtig: nur werten, wenn der Sprung wirklich
       angekommen ist. Beim ersten Versuch wurde nach einer Frist einfach
       genommen, was gerade dastand – und weil das Video noch am Puffern war,
       stand da zweimal dasselbe erste Bild. Ergebnis: Sprung 0, „läuft rund",
       obwohl das Video mitten im Bild endet. Lieber gar nichts sagen als das
       Falsche. */
    const bild = (t) => new Promise((fertig) => {
      let ab = false;
      const nimm = (gelungen) => {
        if (ab) return; ab = true;
        v.removeEventListener('seeked', treffer);
        if (!gelungen || Math.abs((v.currentTime || 0) - t) > 0.35 || v.readyState < 2) {
          return fertig(null);
        }
        try {
          c.drawImage(v, 0, 0, 160, 90);
          fertig(c.getImageData(0, 0, 160, 90).data);
        } catch (e) { fertig(null); }
      };
      const treffer = () => nimm(true);
      v.addEventListener('seeked', treffer);
      setTimeout(() => nimm(false), 5000);
      try { v.currentTime = t; } catch (e) { nimm(false); }
    });
    const abstand = (a, b) => {
      if (!a || !b) return NaN;
      let s = 0;
      for (let i = 0; i < a.length; i += 4) s += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
      return s / (a.length / 4 * 3);
    };

    const a0 = cl.start || 0;
    const a1 = Math.max(a0 + 0.05, (cl.end || cl.dur) - 0.05);
    const schritt = 1 / 24;

    /* Der Vergleichswert darf NICHT aus einem einzigen Bildpaar kommen.
       Zwei Bilder am Videoende sind sich oft fast gleich (Wert 0,55), und
       dann wird jeder Faktor riesig. Gemittelt wird deshalb ueber vier
       Stellen quer durch den Clip. */
    const stellen = [0.2, 0.4, 0.6, 0.8].map(u => a0 + (a1 - a0) * u);

    async function lauf() {
      const anfang = await bild(a0);
      const ende = await bild(a1);
      if (!anfang || !ende) {
        SS.freeCanvas && SS.freeCanvas(cv);
        try { v.remove(); } catch (e) {}
        return null;
      }
      let summe = 0, zahl = 0;
      for (const t of stellen) {
        const a = await bild(t);
        const b = await bild(Math.min(a1, t + schritt));
        const d = abstand(a, b);
        if (isFinite(d)) { summe += d; zahl++; }
      }
      const normal = zahl ? summe / zahl : NaN;
      const sprung = abstand(ende, anfang);
      SS.freeCanvas && SS.freeCanvas(cv);
      try { v.remove(); } catch (e) {}
      return { sprung, normal, faktor: sprung / Math.max(0.5, normal) };
    }

    return new Promise((fertig) => {
      let gestartet = false;
      const los = () => {
        if (gestartet) return; gestartet = true;
        lauf().then(fertig, () => fertig(null));
      };
      /* canplaythrough abwarten, nicht nur loadeddata: sonst kommt der Sprung
         ans Videoende nicht an, weil dort noch nichts gepuffert ist. */
      if (v.readyState >= 4) los();
      else {
        v.addEventListener('canplaythrough', los, { once: true });
        setTimeout(() => { if (v.readyState >= 2) los(); }, 4000);
      }
    });
  };

  VL.setzen = function (modus, o) {
    VL.modus = modus || 'fuellen';
    if (o) {
      if (o.feder != null) VL.feder = o.feder;
      if (o.spanne != null) VL.spanne = o.spanne;
      if (o.t0 != null) VL.t0 = o.t0;
    }
    const n = Math.max(1, SS.canvasSize().n);
    const p = VL.modus === 'zeit' ? VL.stellen(n) : Promise.resolve(true);
    return p.then(() => {
      SS.bgCacheInvalidate && SS.bgCacheInvalidate();
      SS.ui && SS.ui.syncTop && SS.ui.syncTop();
      SS.ui && SS.ui.zoomFit && SS.ui.zoomFit();
      SS.requestRender && SS.requestRender();
      return true;
    });
  };

  /* ---------- Die Slideleiste wieder einblenden ----------
     ui.js blendet sie aus, sobald ein Clip liegt („bei Video gibt es nur eine
     Slide"). In den beiden Panorama-Modi stimmt das nicht mehr. Ausserdem
     muessen die Kacheln neu gesetzt werden, wenn sich die Slidezahl aendert –
     sonst zeigen fuenf Kacheln plus eine neue nur vier Zeitpunkte. */
  if (SS.ui && typeof SS.ui.syncTop === 'function') {
    const altSync = SS.ui.syncTop;
    let letzteN = 0;
    SS.ui.syncTop = function () {
      const r = altSync.apply(this, arguments);
      try {
        /* Seit die Klemme fuer alle Modi aufgehoben ist, gehoert die
           Slideleiste bei jedem geladenen Clip wieder hin – ausser bei 9:16,
           das keine Slides kennt. */
        const breit = !!(SS.clip && SS.clip.ready);
        const el = SS.el('slideCtrl');
        if (el && breit && SS.state.format !== '9:16') el.style.display = 'flex';
        if (breit) {
          const n = SS.canvasSize().n;
          if (n !== letzteN) { letzteN = n; if (VL.modus === 'zeit') VL.stellen(n).then(() => SS.requestRender()); }
        }
      } catch (e) {}
      return r;
    };
  }

  /* ---------- Bedienung im Video-Bereich ---------- */
  (function () {
    const kasten = document.getElementById('vidClipBox');
    if (!kasten) return;
    const vor = document.getElementById('vidClipToCanvas');

    const box = document.createElement('div');
    box.id = 'vlBox';
    box.innerHTML =
      '<h3 style="margin:14px 0 6px">Leinwand aus dem Video</h3>' +
      '<div class="chips" id="vlModi"></div>' +
      '<p class="hint" id="vlHint"></p>' +
      '<div class="ctl hidden" id="vlFederRow"><span>Überblenden</span>' +
        '<input type="range" id="vlFeder" min="10" max="70" value="42"><span class="val" id="vlFederL">42 %</span></div>' +
      '<div class="ctl hidden" id="vlSpanneRow"><span>Zeitspanne</span>' +
        '<input type="range" id="vlSpanne" min="20" max="100" value="100"><span class="val" id="vlSpanneL">100 %</span></div>' +
      '<p class="hint" id="vlProbe"></p>';
    kasten.insertBefore(box, vor || null);

    const MODI = [
      { id: 'fuellen', name: 'Füllen',
        hint: 'Ein Bild über die ganze Fläche – auch über mehrere Slides. Oben und unten wird beschnitten.' },
      { id: 'spiegel', name: 'Spiegeln',
        hint: 'Das Bild wird gekachelt, jede zweite Kachel gespiegelt. Kante trifft auf Kante – nahtlos. Gut für Muster, Wasser, Wolken.' },
      { id: 'zeit', name: 'Zeitpanorama',
        hint: 'Jede Slide zeigt dasselbe Video zu einer anderen Sekunde, breit überblendet. Aus einem Mondvideo wird ein Mondphasen-Panorama.' },
    ];

    const chips = document.getElementById('vlModi');
    function zeichnen() {
      chips.innerHTML = '';
      for (const m of MODI) {
        const b = document.createElement('button');
        b.textContent = m.name;
        b.title = m.hint;
        if (m.id === VL.modus) b.classList.add('sel');
        b.onclick = () => waehlen(m.id);
        chips.appendChild(b);
      }
      const m = MODI.find(x => x.id === VL.modus);
      document.getElementById('vlHint').textContent = m ? m.hint : '';
      document.getElementById('vlFederRow').classList.toggle('hidden', VL.modus !== 'zeit');
      document.getElementById('vlSpanneRow').classList.toggle('hidden', VL.modus !== 'zeit');
    }

    function waehlen(id) {
      /* 9:16 kennt keine Slides – ein Panorama waere dort sinnlos. Also
         auf das Feedformat wechseln, statt still nichts zu tun. */
      if (id !== 'fuellen' && SS.state.format === '9:16') {
        SS.state.format = '4:5';
        SS.toast && SS.toast('Format auf 4:5 gestellt – nur dort gibt es mehrere Slides', 3000);
      }
      VL.setzen(id).then(() => {
        zeichnen();
        if (id !== 'fuellen') probeZeigen();
        else document.getElementById('vlProbe').textContent = '';
      });
    }

    function probeZeigen() {
      const p = document.getElementById('vlProbe');
      p.textContent = 'Schleife wird geprüft …';
      VL.schleifenprobe().then(r => {
        if (!r || !isFinite(r.faktor)) { p.textContent = ''; return; }
        const f = r.faktor;
        const weich = SS.schleife && SS.schleife.aktiv && SS.schleife.dauer;
        p.textContent = f < 1.6
          ? `Schleifenprobe: Faktor ${f.toFixed(1)} – dein Video läuft rund, die Schleife ist unsichtbar.`
          : weich
            ? `Schleifenprobe: Faktor ${f.toFixed(1)} – das Video endet anders als es anfängt. Die App überblendet den Übergang deshalb weich (${SS.schleife.dauer().toFixed(1)} s) – die Schleife schließt sich ohne Sprung.`
            : `Schleifenprobe: Faktor ${f.toFixed(1)} – das Video endet anders als es anfängt. Beim Wiederholen entsteht dort ein Sprung. Kürze den Ausschnitt so, dass Anfang und Ende gleich aussehen.`;
      }).catch(() => { p.textContent = ''; });
    }

    const federEl = document.getElementById('vlFeder');
    const spanneEl = document.getElementById('vlSpanne');
    federEl.addEventListener('input', () => {
      document.getElementById('vlFederL').textContent = federEl.value + ' %';
    });
    federEl.addEventListener('change', () => {
      VL.feder = +federEl.value / 100; SS.requestRender && SS.requestRender();
    });
    spanneEl.addEventListener('input', () => {
      document.getElementById('vlSpanneL').textContent = spanneEl.value + ' %';
    });
    spanneEl.addEventListener('change', () => {
      VL.spanne = +spanneEl.value / 100;
      VL.setzen(VL.modus);
    });

    VL.bedienungAuffrischen = zeichnen;
    zeichnen();
  })();

  /* ---------- Aufraeumen, wenn der Clip geht ---------- */
  if (typeof SS.clipClear === 'function') {
    const altClear = SS.clipClear;
    SS.clipClear = function () {
      VL.anhalten();
      while (VL.kacheln.length) {
        const v = VL.kacheln.pop();
        try { v.pause(); v.removeAttribute('src'); v.load(); v.remove(); } catch (e) {}
      }
      VL.modus = 'fuellen';
      const r = altClear.apply(this, arguments);
      VL.bedienungAuffrischen && VL.bedienungAuffrischen();
      return r;
    };
  }

  SS.VIDEOLEINWAND = { modi: ['fuellen', 'spiegel', 'zeit'] };
})();
