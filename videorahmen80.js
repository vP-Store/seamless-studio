/* Seamless Studio – Clips in Rahmen füllen die gezogene Fläche (v8.0)
   ============================================================================
   Zwei Dinge gingen bei einem Video-Clip in einem Rahmen schief.

   **Erstens ging das Videobild zweimal durch den Zuschnitt.**
   `videorahmen77.js` legt das laufende Videobild formatfüllend in eine Fläche
   in CLIPGRÖSSE; danach beschneidet die Hülle aus `rahmenfrei78.js` genau
   dieselbe Fläche ein zweites Mal auf `el.rahmenAR`. Beim Retro-TV sind das
   1,50 → 1,64: oben und unten ging ein Streifen verloren, den niemand
   angefordert hat, und die Auflösung sank mit. Hier wird das Videobild gleich
   im richtigen Verhältnis abgelegt – einmal beschneiden, nie zweimal.

   **Zweitens füllten elf Rahmen die gezogene Fläche gar nicht.**
   Kreis, Herz, Herz-Polaroid, Stern, Blume, Wolke, Hexagon, Raute, CD,
   Retro-Kamera und Perlen-Herz schneiden in `frames.js` mit `Math.min(w, h)`
   – sie bleiben also quadratisch, egal was hineingeht. Für Fotos löst
   `SS.passeRahmenAn` das seit v7.9 in einer zweiten Phase (Karte strecken,
   Quelle gegenläufig vorstauchen); für Clips gab es diese Phase nie.
   Nachgemessen an 600 × 600 kam beim Perlen-Herz 373 × 320 heraus, bei
   900 × 500 gar 310 × 267 – bis zu 72 % daneben.

   Der Weg hier ist derselbe wie bei den Fotos, nur ohne Iteration je Bild:

     1 · **Plan bestimmen** (gemessen, nicht geraten): gesucht ist das
         Seitenverhältnis der Pufferfläche, bei dem die fertige Karte genau
         die Form der gezogenen Fläche hat. Klappt das – 39 Rahmen –, heißt
         der Plan „schnitt".
     2 · Bleibt die Karte trotzdem bei ihrer eigenen Form, heißt der Plan
         „stauch": die Karte wird beim Zeichnen gestreckt und die Quelle
         vorher waagerecht um den Kehrwert gestaucht. Die beiden Verzerrungen
         heben sich auf, das Videobild bleibt gerade, die Form wird gestreckt
         – aus dem Kreis eine Ellipse. Genau wie beim Foto.

   **Bei „stauch" darf das Videobild NICHT selbst beschnitten werden.** Der
   Rahmen füllt sein Quadrat danach selbst formatfüllend auf – wie bei einem
   Foto, dem `stauche()` die Quelle vorstaucht. Die Pufferfläche bekommt
   deshalb das Verhältnis der gestauchten Quelle (`vw/vh · vorX`) und das
   Videobild wird ohne eigenen Zuschnitt hineingezogen. Ein formatfüllender
   Zuschnitt davor ergäbe einen ANDEREN Ausschnitt als beim Foto.

   Der Plan hängt nur an Rahmen, Clipformat und Videoformat und wird NEBEN dem
   Element gemerkt (`SS.clipPlanWeg` wirft ihn weg) – nicht je Videobild neu
   bestimmt, und er wandert auch nicht in `serialize` mit. Während gezogen
   wird (`SS._frei80Zieht`), genügt eine gröbere Stufung, damit auch der
   teuerste Rahmen flüssig bleibt.

   Es wird nichts überschrieben, nur umhüllt.
   ========================================================================= */

(function () {
  if (typeof SS.drawVideoEl !== 'function' || typeof SS.buildCard !== 'function') return;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const AR_MIN = 0.08, AR_MAX = 12;
  const hatRahmen = (el) => !!(el && el.frame && el.frame.style && el.frame.style !== 'none');

  const origDrawVideo = SS.drawVideoEl;     // Hülle aus rahmenfrei78/videorahmen77
  const puffer = document.createElement('canvas');
  const probe = document.createElement('canvas');

  /* Der Plan liegt NEBEN dem Element, nicht darin: sonst wanderte er in
     `serialize` mit und stünde nach dem Zurückholen veraltet im Projekt. */
  const plaene = {};
  SS.clipPlanWeg = function (el) {
    if (el && el.id) delete plaene[el.id];
    else for (const k of Object.keys(plaene)) delete plaene[k];
  };

  /* ==================================================================
     1 · Messen: welche Form hat die Karte bei einer Quelle im
         Verhältnis `ar`?  Die Hülle um buildCard darf dabei weder
         beschneiden noch stauchen – das machen wir hier selbst.
     ================================================================== */
  function messeKarte(el, ar, ph) {
    const pw = Math.max(2, Math.round(ph * clamp(ar, AR_MIN, AR_MAX)));
    if (probe.width !== pw) probe.width = pw;
    if (probe.height !== ph) probe.height = ph;
    const mAR = el.rahmenAR, mVor = el.rahmenVorX;
    el.rahmenAR = 0; el.rahmenVorX = 1;
    let k = null;
    try { k = SS.buildCard(el, probe, ph); } catch (e) { k = null; }
    el.rahmenAR = mAR; el.rahmenVorX = mVor;
    if (!k || !k.width || !k.height) return null;
    return { w: k.width, h: k.height, ar: k.width / k.height };
  }

  /* ==================================================================
     2 · Der Plan für ein Clipformat
     ================================================================== */
  function planFuer(el, zielW, zielH, vw, vh, grob) {
    const f = el.frame;
    const zielAR = zielW / zielH;
    /* Der Rand schlägt teils in absoluten Kartenpunkten auf – der Plan hängt
       also auch an der Größe. Beim Ziehen genügt eine gröbere Stufung (10 %):
       die AUSSENKANTE stimmt ohnehin immer, weil die Karte in die gezogene
       Fläche gezeichnet wird; nur die Randstärke wäre zwischen zwei Stufen
       um höchstens ein Zehntel unsauber, und beim Loslassen wird sie genau. */
    const stufe = grob ? 0.10 : 0.004;
    const sig = [f.style, Math.round(f.border || 0), Math.round(f.radius || 0),
      Math.round(Math.log(zielAR) / stufe), Math.round(Math.log(Math.max(30, zielH)) / (stufe * 4)),
      Math.round((vw / vh) * 1000)].join('|');
    const alt = plaene[el.id];
    if (alt && alt.sig === sig) return alt;

    const ph = clamp(Math.round(zielH), 90, 700);      // Sollhöhe der Karte in Probepunkten

    /* Höhe der Pufferfläche so nachziehen, dass die KARTE ph hoch wird. Das
       ist nicht bloß Kosmetik: `buildCard` schlägt Rand und Sicherheitssaum
       in absoluten Kartenpunkten auf. Eine zu kleine Karte hat deshalb
       verhältnismäßig mehr Saum – beim Kreis auf 900 × 500 waren das 4,3 %
       Unterschied zum Foto. Dieselbe Nachführung macht `passeRahmenAn`. */
    function ziehHoehe(ar, ih0) {
      let ih = ih0, m = null;
      for (let i = 0; i < 5; i++) {
        m = messeKarte(el, ar, Math.max(8, Math.round(ih)));
        if (!m) return null;
        if (Math.abs(m.h - ph) / ph < 0.004) break;
        ih = clamp(ih * ph / m.h, 8, 4000);
      }
      return { ih, mess: m };
    }

    /* Phase 1 – Bildverhältnis und Pufferhöhe zugleich treffen. */
    let ar = clamp(zielAR, AR_MIN, AR_MAX), ih = ph, mess = null;
    for (let i = 0; i < 9; i++) {
      mess = messeKarte(el, ar, Math.max(8, Math.round(ih)));
      if (!mess) return null;
      const passtAR = Math.abs(mess.ar - zielAR) / zielAR < 0.002;
      const passtH = Math.abs(mess.h - ph) / ph < 0.004;
      if (passtAR && passtH) break;
      ar = clamp(ar * zielAR / mess.ar, AR_MIN, AR_MAX);
      ih = clamp(ih * ph / mess.h, 8, 4000);
    }

    let plan;
    if (mess && Math.abs(mess.ar - zielAR) / zielAR <= 0.02) {
      plan = { modus: 'schnitt', bildAR: ar, hFak: ih / ph, sig };
    } else {
      /* Phase 2 – formfester Rahmen: seine Kartenform kommt vom Rahmen, nicht
         vom Zuschnitt. Gemessen wird mit der UNGESTAUCHTEN Quelle, genau wie
         `passeRahmenAn` es beim Foto tut. */
      const roh = ziehHoehe(vw / vh, ph);
      if (!roh) return null;
      const kartenAR = roh.mess.ar > 0 ? roh.mess.ar : 1;
      const vorX = clamp(kartenAR / zielAR, 0.02, 50);
      const fein = ziehHoehe((vw / vh) * vorX, roh.ih);
      plan = { modus: 'stauch', vorX, kartenAR, hFak: (fein ? fein.ih : roh.ih) / ph, sig };
    }
    plaene[el.id] = plan;
    return plan;
  }

  SS.clipRahmenPlan = function (el) {
    if (!hatRahmen(el) || el.type !== 'video') return null;
    const rec = SS.videos && SS.videos[el.vidId];
    const v = rec && rec.el;
    const vw = (v && v.videoWidth) || (rec && rec.w) || 16;
    const vh = (v && v.videoHeight) || (rec && rec.h) || 9;
    return planFuer(el, Math.max(2, el.w * (el.scaleX || 1)),
      Math.max(2, el.h * (el.scaleY || 1)), vw, vh, false);
  };

  /* ==================================================================
     3 · Zeichnen
     ================================================================== */
  SS.drawVideoEl = function (c, el) {
    if (!hatRahmen(el)) return origDrawVideo.call(SS, c, el);

    const w = Math.max(2, el.w * (el.scaleX || 1));
    const h = Math.max(2, el.h * (el.scaleY || 1));

    const rec = SS.videos && SS.videos[el.vidId];
    const v = rec && rec.el;
    const vw = (v && v.videoWidth) || (rec && rec.w) || 16;
    const vh = (v && v.videoHeight) || (rec && rec.h) || 9;

    const plan = planFuer(el, w, h, vw, vh, !!SS._frei80Zieht);
    if (!plan) return origDrawVideo.call(SS, c, el);

    /* Auflösung an das anpassen, was am Ziel wirklich ankommt (wie v7.7). */
    const m = c.getTransform ? c.getTransform() : null;
    const mass = m ? (Math.hypot(m.a, m.b) || 1) : 1;
    const noetig = Math.max(64, Math.min(1400, Math.max(w, h) * mass));
    const k = Math.min(1, noetig / Math.max(w, h));

    /* `hFak` bringt die Karte auf die Zielhöhe – nur dann fällt der absolute
       Rand genauso ins Gewicht wie bei einem Foto derselben Größe. */
    const ih = clamp(Math.round(h * k * (plan.hFak || 1)), 2, 3000);
    const bildAR = plan.modus === 'schnitt' ? plan.bildAR : (vw / vh) * plan.vorX;
    const iw = Math.max(2, Math.round(ih * clamp(bildAR, AR_MIN, AR_MAX)));

    if (puffer.width !== iw) puffer.width = iw;
    if (puffer.height !== ih) puffer.height = ih;
    const pc = puffer.getContext('2d');
    pc.clearRect(0, 0, iw, ih);

    if (v && v.readyState >= 2) {
      if (plan.modus === 'schnitt') {
        /* EINMAL beschneiden: größter Ausschnitt im Verhältnis der Fläche. */
        const s = Math.max(iw / vw, ih / vh);
        const dw = vw * s, dh = vh * s;
        const ox = clamp((el.rahmenOX || 0), -1, 1), oy = clamp((el.rahmenOY || 0), -1, 1);
        pc.drawImage(v, (iw - dw) / 2 * (1 + ox), (ih - dh) / 2 * (1 + oy), dw, dh);
      } else {
        /* NICHT beschneiden – der Rahmen füllt sein Quadrat selbst auf,
           genau wie bei einem Foto mit vorgestauchter Quelle. */
        pc.drawImage(v, 0, 0, iw, ih);
      }
    } else {
      pc.fillStyle = '#241F1B';
      pc.fillRect(0, 0, iw, ih);
      pc.fillStyle = '#8A8078';
      pc.font = `${Math.round(ih * 0.09)}px Poppins, sans-serif`;
      pc.textAlign = 'center'; pc.textBaseline = 'middle';
      pc.fillText('Clip', iw / 2, ih / 2);
    }

    const mAR = el.rahmenAR, mVor = el.rahmenVorX;
    el.rahmenAR = 0; el.rahmenVorX = 1;
    let karte;
    try { karte = SS.buildCard(el, puffer, ih); } catch (e) { karte = null; }
    el.rahmenAR = mAR; el.rahmenVorX = mVor;
    if (!karte || !karte.width) return origDrawVideo.call(SS, c, el);

    c.save();
    c.translate(el.x, el.y);
    c.rotate(SS.deg2rad(el.rot || 0));
    c.globalAlpha = el.opacity ?? 1;
    const sch = el.frame.shadow || 0;
    if (sch > 0) {
      c.shadowColor = `rgba(45,28,20,${sch / 130})`;
      c.shadowBlur = 16 + sch * 0.35;
      c.shadowOffsetX = 6; c.shadowOffsetY = 12;
    }
    /* Die Karte füllt die gezogene Fläche – bei „schnitt" trifft sie sie
       ohnehin auf 0,2 %, bei „stauch" ist die Streckung gewollt. */
    c.drawImage(karte, -w / 2, -h / 2, w, h);
    c.restore();
  };

  /* Rahmenwechsel und Neuladen: Plan verwerfen. */
  const origInval = SS.invalidateEl;
  if (typeof origInval === 'function') {
    SS.invalidateEl = function (el) {
      if (el && el.type === 'video') { SS.clipPlanWeg(el); el._rahmenSig = null; }
      return origInval.apply(this, arguments);
    };
  }
  const origRestore = SS.restore;
  if (typeof origRestore === 'function') {
    SS.restore = function () {
      const r = origRestore.apply(this, arguments);
      try {
        SS.clipPlanWeg();
        (SS.state.elements || []).forEach(e => { if (e) { e._rahmenSig = null; delete e._plan80; } });
      } catch (e) {}
      return r;
    };
  }

  SS.VIDEORAHMEN80 = { bereit: true, version: '8.0.0' };
})();
