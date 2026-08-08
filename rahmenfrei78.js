/* Seamless Studio – Rahmen in jedem Format (v7.8)
   ============================================================================
   Bisher war ein Rahmen an das Seitenverhältnis seines Bildes gekettet.
   `SS.buildCard` liest `ar = src.width / src.height` und rechnet die Breite
   aus der Zielhöhe: ein Hochformatfoto ergab zwingend einen hochformatigen
   Rahmen. Wer die Karte trotzdem breiter zog, benutzte `scaleX` – und
   verzerrte damit alles mit: der Rand wurde links und rechts dünner als oben
   und unten, die Knöpfe des Retro-TV wurden oval, die Perlen des Perlen-
   Herzens zu Ellipsen.

   Der Kniff hier ist, dass NICHT die Karte gedehnt wird, sondern das Bild,
   das in die Rahmenwerkstatt hineingeht:

     · `el.rahmenAR` hält das gewünschte Seitenverhältnis der Bildfläche.
     · Vor `SS.buildCard` wird die Quelle formatfüllend auf dieses Verhältnis
       BESCHNITTEN – nie gedehnt, nie hochgerechnet. Es wird immer der größte
       Ausschnitt genommen, der noch in die Quelle passt, deshalb kostet das
       keine Schärfe.
     · `SS.buildCard` bekommt also eine Quelle, die bereits das Zielformat
       hat, und zeichnet den Rahmen ganz normal darum. Alle 50 Rahmen – auch
       die aus rahmen7.js, rahmen75.js und rahmen76.js – gelten unverändert,
       und der Rand ist auf allen vier Seiten gleich dick.

   Weil die Rahmen ihren Rand teils absolut (`frame.border` in Kartenpixeln),
   teils proportional aufschlagen, lässt sich aus einer Wunschgröße nicht
   direkt zurückrechnen, welche Bildhöhe und welches Bild-Seitenverhältnis
   nötig sind. `passeAn()` misst deshalb: bauen, nachmessen, korrigieren.
   Nachgemessen sind vier bis sechs Durchgänge auf unter einen halben
   Bildpunkt genau, und der Weg gilt für jeden Rahmen – auch für künftige,
   die diese Datei gar nicht kennt.

   Für Video-Clips gilt dasselbe: `videorahmen77.js` legt das laufende
   Videobild in eine Fläche in Clipgröße und schickt sie durch `buildCard`.
   Die fertige Karte wurde dort mit `Math.min` eingepasst – der Rand kam also
   nach innen und ließ an zwei Seiten Luft. Hier wird das Bild-Seitenverhält-
   nis so nachgeführt, dass die fertige Karte die gezogene Fläche exakt füllt.
   Weil das je Bild zu teuer wäre, wird es nur bei Änderung neu bestimmt und
   an `el._rahmenSig` gemerkt.

   Es wird nichts überschrieben, nur umhüllt.
   ========================================================================= */

(function () {
  if (typeof SS.buildCard !== 'function' || typeof SS.elSizeRaw !== 'function') return;

  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const AR_MIN = 0.08, AR_MAX = 12;

  const hatRahmen = (el) => !!(el && el.frame && el.frame.style && el.frame.style !== 'none');

  /* ==================================================================
     1 · Die Quelle auf ein Seitenverhältnis beschneiden
     ================================================================== */

  const schnitt = document.createElement('canvas');   // einer für alle

  /* Größter Ausschnitt mit Verhältnis `ziel`, der noch in die Quelle passt.
     ox/oy verschieben ihn zwischen den beiden Rändern (-1 … +1, 0 = Mitte). */
  function beschneide(src, ziel, ox, oy) {
    const sw = src.width, sh = src.height;
    if (!sw || !sh) return src;
    const sAR = sw / sh;
    if (Math.abs(sAR - ziel) < 0.002) return src;

    let cw, ch;
    if (ziel >= sAR) { cw = sw; ch = Math.max(1, Math.round(sw / ziel)); }
    else { ch = sh; cw = Math.max(1, Math.round(sh * ziel)); }

    const freiX = sw - cw, freiY = sh - ch;
    const px = clamp(freiX / 2 * (1 + (ox || 0)), 0, freiX);
    const py = clamp(freiY / 2 * (1 + (oy || 0)), 0, freiY);

    if (schnitt.width !== cw) schnitt.width = cw;
    if (schnitt.height !== ch) schnitt.height = ch;
    const c = schnitt.getContext('2d');
    c.clearRect(0, 0, cw, ch);
    c.drawImage(src, -Math.round(px), -Math.round(py));
    return schnitt;
  }

  /* Die Quelle waagerecht stauchen oder dehnen, OHNE zu beschneiden.
     Gebraucht für Rahmen mit vorgegebener Form (Kreis, Herz, Stern …): die
     zeichnen mit `Math.min(w, h)` immer ein Quadrat und füllen das Bild
     darin selbst formatfüllend auf – über das Zuschnittverhältnis ist an die
     Bildform dort also nicht heranzukommen. Wird die fertige Karte
     anschließend gestreckt, hebt diese Vorstauchung die Verzerrung des
     Bildes exakt wieder auf. Die Form selbst bleibt gestreckt – aus dem
     Kreis wird eine Ellipse, aus dem Herz ein hohes Herz. Genau so gewollt. */
  const vorher = document.createElement('canvas');
  function stauche(src, fx) {
    const nw = Math.max(2, Math.round(src.width * fx));
    const nh = Math.max(2, src.height);
    if (vorher.width !== nw) vorher.width = nw;
    if (vorher.height !== nh) vorher.height = nh;
    const c = vorher.getContext('2d');
    c.clearRect(0, 0, nw, nh);
    c.drawImage(src, 0, 0, nw, nh);
    return vorher;
  }

  const origBuildCard = SS.buildCard;
  SS.buildCard = function (el, src, h) {
    if (!el || !src || !src.width) return origBuildCard.call(SS, el, src, h);
    let q = src;

    const fx = +el.rahmenVorX;
    if (fx && isFinite(fx) && fx > 0 && Math.abs(fx - 1) > 0.002) q = stauche(q, fx);

    const ziel = +el.rahmenAR;
    if (ziel && isFinite(ziel) && ziel > 0) {
      /* Auf dem gestauchten Bild wirkt das Wunschverhältnis entsprechend mit. */
      q = beschneide(q, ziel * (fx && isFinite(fx) && fx > 0 ? fx : 1), el.rahmenOX, el.rahmenOY);
    }
    if (q === src) return origBuildCard.call(SS, el, src, h);

    /* beschneide() und stauche() teilen sich nicht dasselbe Canvas, aber wenn
       beide liefen, liegt das Ergebnis im Zuschnitt-Canvas – das ist richtig. */
    return origBuildCard.call(SS, el, q, h);
  };

  /* ==================================================================
     2 · Kartenspeicher: der Schlüssel in render.js kennt die neuen
         Felder nicht, also wird bei Änderung gezielt geleert.
     ================================================================== */

  const merk = {};
  const origPhotoCard = SS.photoCard;
  if (typeof origPhotoCard === 'function' && typeof SS.cardCacheClear === 'function') {
    SS.photoCard = function (el) {
      if (el) {
        const sig = `${el.rahmenAR || 0}|${el.rahmenOX || 0}|${el.rahmenOY || 0}|${el.rahmenVorX || 1}`;
        if (merk[el.id] !== sig) { merk[el.id] = sig; SS.cardCacheClear(el.id); }
      }
      return origPhotoCard.call(SS, el);
    };
  }

  /* Das Seitenverhältnis, das die Quelle von Haus aus hat. */
  SS.rahmenQuellAR = function (el) {
    try {
      if (el && el.type === 'video') {
        const w = el.w * (el.scaleX || 1), h = el.h * (el.scaleY || 1);
        return h > 0 ? w / h : 1;
      }
      const merkAR = el.rahmenAR, merkVor = el.rahmenVorX;
      el.rahmenAR = 0; el.rahmenVorX = 1;    // Original erzwingen
      const src = SS.filteredPhoto && SS.filteredPhoto(el);
      el.rahmenAR = merkAR; el.rahmenVorX = merkVor;
      if (src && src.width && src.height) return src.width / src.height;
    } catch (e) {}
    return 1;
  };

  /* ==================================================================
     3 · Messen und treffen
     ================================================================== */

  /* Die sichtbare Kartengröße eines Fotos, ohne scaleX/scaleY. */
  function misst(el) {
    if (typeof SS.cardCacheClear === 'function') SS.cardCacheClear(el.id);
    merk[el.id] = null;
    const r = SS.elSizeRaw(el);
    return { w: Math.max(1, r.w), h: Math.max(1, r.h) };
  }

  /* Bildhöhe und Bild-Seitenverhältnis so nachziehen, dass die fertige
     Karte zielW × zielH groß ist. Multiplikative Fixpunkt-Iteration:
     jeder Durchgang halbiert den Fehler mehrfach, nach vier bis sechs
     Durchgängen liegt er unter einem halben Bildpunkt. */
  SS.passeRahmenAn = function (el, zielW, zielH) {
    if (!el || el.type !== 'photo') return false;
    zielW = clamp(zielW, 30, 6000);
    zielH = clamp(zielH, 30, 6000);
    el.scaleX = 1; el.scaleY = 1;
    /* Die Vorstauchung gehört zu genau einem Rahmen. Wer von „Herz" auf
       „Oval" wechselt, würde sie sonst mitschleppen und ein schiefes Bild
       bekommen – gemessen ging Oval dadurch 19,5 % daneben. */
    el.rahmenVorX = 1;
    el._formFest = false;
    if (!el.rahmenAR) el.rahmenAR = SS.rahmenQuellAR(el);

    for (let i = 0; i < 7; i++) {
      const r = misst(el);
      const fh = zielH / r.h, fw = zielW / r.w;
      if (Math.abs(r.h - zielH) < 0.5 && Math.abs(r.w - zielW) < 0.5) break;
      el.h = clamp(el.h * fh, 40, 4000);
      el.rahmenAR = clamp(el.rahmenAR * fw / fh, AR_MIN, AR_MAX);
    }

    /* ---- Zweite Phase: Rahmen mit vorgegebener Form ----
       Elf der fünfzig Rahmen zeichnen ihre eigene Form und bleiben dabei
       quadratisch, egal was hineingeht: Kreis, Herz, Herz-Polaroid, Stern,
       Blume, Wolke, Hexagon, Raute, CD, Retro-Kamera, Perlen-Herz. Bei
       ihnen läuft die Iteration oben ins Leere – gemessen kam bei 506 × 900
       ein 332 × 332 heraus.

       Für sie wird die fertige Karte gezielt gestreckt (aus dem Kreis wird
       eine Ellipse, aus dem Herz ein hohes Herz – genau das ist gewollt) und
       die Bildquelle vorher GEGENLÄUFIG beschnitten, damit das Foto darin
       trotzdem unverzerrt und formatfüllend sitzt.

       Das geht in einem Schritt, weil das Verhältnis der Karte bei diesen
       Rahmen von `rahmenAR` unabhängig ist – sonst hätte die erste Phase ja
       gegriffen. Zur Sicherheit wird gemessen statt geglaubt. */
    let r = misst(el);
    const daneben = Math.abs(r.w - zielW) / zielW > 0.02 || Math.abs(r.h - zielH) / zielH > 0.02;
    if (daneben) {
      /* Phase 1 hat `rahmenAR` bei diesen Rahmen wirkungslos verstellt –
         deshalb sauber von vorn anfangen. */
      el.rahmenAR = 0; el.rahmenVorX = 1;
      el.h = clamp(zielH, 40, 4000);
      r = misst(el);

      const kartenAR = r.w / r.h;                 // die feste Form des Rahmens
      const zielAR = zielW / zielH;
      /* Die Karte wird gleich um zielAR/kartenAR waagerecht gestreckt.
         Genau diesen Faktor nimmt die Vorstauchung dem Bild vorweg. */
      el.rahmenVorX = clamp(kartenAR / zielAR, 0.02, 50);

      for (let i = 0; i < 4; i++) {               // Höhe nachziehen, dann sitzt es
        const m = misst(el);
        if (Math.abs(m.h - zielH) < 0.5) break;
        el.h = clamp(el.h * zielH / Math.max(1, m.h), 40, 4000);
      }
      r = misst(el);
      el.scaleX = clamp(zielW / r.w, 0.02, 50);
      el.scaleY = clamp(zielH / r.h, 0.02, 50);
      el._formFest = true;
    } else {
      el.rahmenVorX = 1;
      el._formFest = false;
    }
    el._sollW = zielW; el._sollH = zielH;
    el._sollSX = el.scaleX; el._sollSY = el.scaleY;

    if (typeof SS.cardCacheClear === 'function') SS.cardCacheClear(el.id);
    merk[el.id] = null;
    return true;
  };

  /* Umgekehrt: die aktuelle sichtbare Größe inklusive scaleX/scaleY. */
  SS.rahmenGroesse = function (el) {
    if (!el) return { w: 0, h: 0 };
    if (el.type === 'video') {
      return { w: el.w * (el.scaleX || 1), h: el.h * (el.scaleY || 1) };
    }
    const r = SS.elSizeRaw(el);
    return { w: r.w * (el.scaleX || 1), h: r.h * (el.scaleY || 1) };
  };

  /* ==================================================================
     4 · Video-Clips: die Karte soll die gezogene Fläche füllen
     ================================================================== */

  const origDrawVideoEl = SS.drawVideoEl;
  if (typeof origDrawVideoEl === 'function') {
    SS.drawVideoEl = function (c, el) {
      if (hatRahmen(el)) {
        try { fuehreClipARNach(el); } catch (e) {}
      }
      return origDrawVideoEl.call(SS, c, el);
    };
  }

  /* videorahmen77.js baut eine Fläche in Clipgröße und schickt sie durch
     buildCard. Ohne Korrektur hat die fertige Karte den Rand außen, wird
     dann per Math.min eingepasst und lässt an zwei Seiten Luft. Gesucht ist
     also das Bild-Seitenverhältnis, bei dem die Karte genau die Clipform
     hat. Gemessen wird an einer kleinen Probefläche, gemerkt an el._rahmenSig,
     damit das nicht bei jedem Videobild wieder anfällt. */
  const probe = document.createElement('canvas');
  function fuehreClipARNach(el) {
    const w = Math.max(2, el.w * (el.scaleX || 1));
    const h = Math.max(2, el.h * (el.scaleY || 1));
    const f = el.frame;
    const sig = `${f.style}|${Math.round(f.border || 0)}|${Math.round(f.radius || 0)}|`
      + `${Math.round(w)}x${Math.round(h)}`;
    if (el._rahmenSig === sig) return;

    const zielAR = w / h;
    const ph = clamp(Math.round(h), 80, 900);
    let ar = zielAR;
    const alt = el.rahmenAR;
    for (let i = 0; i < 6; i++) {
      const pw = Math.max(2, Math.round(ph * ar));
      if (probe.width !== pw) probe.width = pw;
      if (probe.height !== ph) probe.height = ph;
      el.rahmenAR = 0;                                  // Probe nicht doppelt beschneiden
      let karte;
      try { karte = origBuildCard.call(SS, el, probe, ph); } catch (e) { karte = null; }
      if (!karte || !karte.width || !karte.height) { el.rahmenAR = alt; return; }
      const ist = karte.width / karte.height;
      if (Math.abs(ist - zielAR) / zielAR < 0.003) break;
      ar = clamp(ar * zielAR / ist, AR_MIN, AR_MAX);
    }
    el.rahmenAR = ar;
    el._rahmenSig = sig;
  }

  /* ==================================================================
     5 · Bedienung: Breite × Höhe als Zahlen
     ================================================================== */

  function h4(text) {
    const e = document.createElement('h4');
    e.textContent = text;
    return e;
  }

  function zahlenfeld(wert) {
    const i = document.createElement('input');
    i.type = 'number';
    i.min = '30'; i.max = '6000'; i.step = '1';
    i.value = Math.round(wert);
    i.style.cssText = 'flex:1;min-width:0;width:100%;background:var(--surface-2,#1c1917);'
      + 'color:var(--ink,#eee);border:1px solid var(--line,#3a3532);border-radius:6px;'
      + 'padding:6px 8px;font:inherit;font-size:12px;';
    return i;
  }

  function groessenAbschnitt(sel, body) {
    const istVideo = sel.type === 'video';
    const g = SS.rahmenGroesse(sel);

    body.appendChild(h4('Größe · Breite × Höhe'));

    const zeile = document.createElement('div');
    zeile.className = 'ctl';
    zeile.style.gap = '6px';

    const bw = zahlenfeld(g.w);
    const bh = zahlenfeld(g.h);

    const kette = document.createElement('button');
    kette.type = 'button';
    kette.title = 'Seitenverhältnis halten';
    kette.style.cssText = 'flex:0 0 auto;width:34px;height:32px;border-radius:6px;'
      + 'border:1px solid var(--line,#3a3532);background:transparent;color:var(--ink-mid,#bbb);'
      + 'cursor:pointer;font-size:14px;line-height:1;';
    let gesperrt = sel._rahmenKette !== false;
    const zeigeKette = () => {
      kette.textContent = gesperrt ? '🔗' : '⛓️‍💥';
      kette.style.background = gesperrt ? 'var(--accent,#8a6a4f)' : 'transparent';
      kette.style.color = gesperrt ? '#FAF7F2' : 'var(--ink-mid,#bbb)';
    };
    zeigeKette();
    kette.onclick = () => {
      gesperrt = !gesperrt;
      sel._rahmenKette = gesperrt;
      zeigeKette();
    };

    const b1 = document.createElement('span'); b1.textContent = 'B';
    b1.style.cssText = 'width:auto;flex:0 0 auto;color:var(--ink-soft,#999);';
    const b2 = document.createElement('span'); b2.textContent = 'H';
    b2.style.cssText = 'width:auto;flex:0 0 auto;color:var(--ink-soft,#999);';

    zeile.appendChild(b1); zeile.appendChild(bw);
    zeile.appendChild(kette);
    zeile.appendChild(b2); zeile.appendChild(bh);
    body.appendChild(zeile);

    function setze(neuW, neuH) {
      neuW = clamp(Math.round(neuW), 30, 6000);
      neuH = clamp(Math.round(neuH), 30, 6000);
      if (istVideo) {
        sel.scaleX = 1; sel.scaleY = 1;
        sel.w = neuW; sel.h = neuH;
        sel._rahmenSig = null;
        sel._sollW = neuW; sel._sollH = neuH;
        sel._sollSX = 1; sel._sollSY = 1;
        if (sel.radius) sel.radius = Math.min(sel.radius, Math.min(neuW, neuH) / 2);
      } else {
        /* Auch ohne Rahmen gilt derselbe Weg: dann ist es schlicht ein
           formatfüllender Zuschnitt statt einer Dehnung. */
        SS.passeRahmenAn(sel, neuW, neuH);
      }
      if (SS.invalidateEl) SS.invalidateEl(sel);
      SS.requestRender();
      const j = SS.rahmenGroesse(sel);
      bw.value = Math.round(j.w);
      bh.value = Math.round(j.h);
    }

    const vorher = () => SS.rahmenGroesse(sel);

    bw.addEventListener('change', () => {
      const alt = vorher();
      const neu = +bw.value || alt.w;
      setze(neu, gesperrt ? alt.h * neu / Math.max(1, alt.w) : alt.h);
      SS.pushHistory('Rahmenformat');
    });
    bh.addEventListener('change', () => {
      const alt = vorher();
      const neu = +bh.value || alt.h;
      setze(gesperrt ? alt.w * neu / Math.max(1, alt.h) : alt.w, neu);
      SS.pushHistory('Rahmenformat');
    });

    /* Ausschnitt verschieben – nur nötig, wenn wirklich beschnitten wird */
    if (!istVideo) {
      const quell = SS.rahmenQuellAR(sel);
      const jetzt = +sel.rahmenAR || quell;
      const beschnitten = Math.abs(jetzt - quell) / Math.max(0.01, quell) > 0.02;
      if (beschnitten) {
        const waag = jetzt > quell;         // breiter als das Bild → oben/unten weg
        const regler = document.createElement('div'); regler.className = 'ctl';
        const s = document.createElement('span');
        s.textContent = waag ? 'Ausschnitt ↕' : 'Ausschnitt ↔';
        const r = document.createElement('input');
        r.type = 'range'; r.min = '-1'; r.max = '1'; r.step = '0.02';
        r.value = String((waag ? sel.rahmenOY : sel.rahmenOX) || 0);
        r.addEventListener('input', () => {
          if (waag) sel.rahmenOY = +r.value; else sel.rahmenOX = +r.value;
          if (SS.invalidateEl) SS.invalidateEl(sel);
          SS.requestRender();
        });
        r.addEventListener('change', () => SS.pushHistory('Bildausschnitt'));
        regler.appendChild(s); regler.appendChild(r);
        body.appendChild(regler);
      }
    }

    const reihe = document.createElement('div');
    reihe.className = 'chips';
    const knopf = (text, fn) => {
      const b = document.createElement('button');
      b.textContent = text;
      b.onclick = () => { fn(); SS.pushHistory('Rahmenformat'); SS.ui.showProps(); SS.requestRender(); };
      reihe.appendChild(b);
    };
    if (!istVideo) {
      knopf('Format des Fotos', () => {
        const alt = SS.rahmenGroesse(sel);
        sel.rahmenAR = 0; sel.rahmenOX = 0; sel.rahmenOY = 0;
        sel.rahmenVorX = 1; sel._formFest = false;
        sel._sollW = 0; sel._sollH = 0;
        sel._sollSX = 1; sel._sollSY = 1;
        sel.scaleX = 1; sel.scaleY = 1;
        if (typeof SS.cardCacheClear === 'function') SS.cardCacheClear(sel.id);
        merk[sel.id] = null;
        const r = misst(sel);
        sel.h = clamp(sel.h * alt.h / Math.max(1, r.h), 40, 4000);   // Höhe beibehalten
      });
    }
    knopf('Auf Slide einpassen', () => {
      const { slideW, H } = SS.canvasSize();
      const g2 = SS.rahmenGroesse(sel);
      const k = Math.min(slideW * 0.92 / Math.max(1, g2.w), H * 0.92 / Math.max(1, g2.h));
      setze(g2.w * k, g2.h * k);
    });
    body.appendChild(reihe);

    const p = document.createElement('p');
    p.className = 'hint';
    p.textContent = hatRahmen(sel)
      ? 'Breite und Höhe frei – der Rand bleibt auf allen vier Seiten gleich dick, '
        + 'das Bild füllt den Innenraum formatfüllend aus.'
      : 'Breite und Höhe frei – das Bild wird formatfüllend zugeschnitten, nie gedehnt.';
    body.appendChild(p);
  }

  /* Anhängen, nachdem alle anderen Eigenschaftsblätter stehen. */
  const origProps = SS.ui && SS.ui.showProps;
  if (origProps) {
    SS.ui.showProps = function () {
      const r = origProps.apply(this, arguments);
      try {
        const sel = SS.getSel();
        if (sel && (sel.type === 'photo' || sel.type === 'video') && SS.selCount() === 1) {
          const body = $('propsBody');
          if (body && !body.querySelector('[data-rahmenfrei]')) {
            const marke = document.createElement('div');
            marke.setAttribute('data-rahmenfrei', '1');
            body.appendChild(marke);
            groessenAbschnitt(sel, body);
          }
        }
      } catch (e) {}
      return r;
    };
  }

  /* ==================================================================
     6 · Ziehen an den Griffen: Verzerrung in echtes Format übersetzen
     ==================================================================
     interact.js schreibt beim freien Ziehen scaleX und scaleY. Für ein
     Element mit Rahmen ist das jetzt der falsche Weg – es würde den Rand
     ungleich dick machen. Dieser Nachläufer greift NACH endPointer und
     rechnet eine ungleiche Verzerrung in Bildhöhe und Bild-Seitenverhältnis
     um. Gleichmäßiges Vergrößern bleibt unangetastet: dort soll der Rand
     mitwachsen. */
  const canvas = $('canvas');
  if (canvas) {
    canvas.addEventListener('pointerup', () => {
      let geaendert = false;
      const liste = (SS.getSelAll && SS.getSelAll()) || [];
      for (const el of liste) {
        if (el.type !== 'photo' && el.type !== 'video') continue;
        const sx = el.scaleX || 1, sy = el.scaleY || 1;
        /* Rahmen mit fester Form tragen dauerhaft ein ungleiches scaleX/scaleY –
           das ist kein Ziehen, sondern das Ergebnis von passeRahmenAn. Verglichen
           wird deshalb nicht gegen 1, sondern gegen den zuletzt gesetzten Stand:
           nur eine UNGLEICHE Änderung seither ist ein echtes Verzerren.
           Gleichmäßiges Vergrößern bleibt unangetastet – dort soll der Rand
           mitwachsen. */
        const bx = el._sollSX || 1, by = el._sollSY || 1;
        const rx = sx / (bx || 1), ry = sy / (by || 1);
        if (Math.abs(rx - ry) < 0.004) continue;
        if (el.type === 'video') {
          if (!hatRahmen(el)) continue;
          el.w = clamp(el.w * sx, 30, 6000);
          el.h = clamp(el.h * sy, 30, 6000);
          el.scaleX = 1; el.scaleY = 1;
          el._rahmenSig = null;
          el._sollW = el.w; el._sollH = el.h;
          el._sollSX = 1; el._sollSY = 1;
          geaendert = true;
        } else if (el.type === 'photo') {
          const r = SS.elSizeRaw(el);
          SS.passeRahmenAn(el, r.w * sx, r.h * sy);
          if (SS.invalidateEl) SS.invalidateEl(el);
          geaendert = true;
        }
      }
      if (geaendert) {
        SS.requestRender();
        if (SS.ui && SS.ui.showProps) SS.ui.showProps();
        SS.pushHistory('Rahmenformat');
      }
    });
  }

  /* ==================================================================
     7 · Altlasten: Projekte ohne die neuen Felder bleiben, wie sie waren
     ================================================================== */

  const origNorm = SS.normalizeEl;
  if (typeof origNorm === 'function') {
    SS.normalizeEl = function (el) {
      const r = origNorm.call(SS, el);
      if (el && (el.type === 'photo' || el.type === 'video')) {
        if (el.rahmenAR === undefined) el.rahmenAR = 0;   // 0 = wie bisher
        if (el.rahmenOX === undefined) el.rahmenOX = 0;
        if (el.rahmenOY === undefined) el.rahmenOY = 0;
        if (el.rahmenVorX === undefined) el.rahmenVorX = 1;
      }
      return r;
    };
  }

  const origRestore = SS.restore;
  if (typeof origRestore === 'function') {
    SS.restore = function () {
      const r = origRestore.apply(this, arguments);
      try {
        for (const k of Object.keys(merk)) delete merk[k];
        (SS.state.elements || []).forEach(e => { if (e) e._rahmenSig = null; });
      } catch (e) {}
      return r;
    };
  }

  SS.RAHMENFREI78 = { bereit: true, version: '7.8.0' };
})();
