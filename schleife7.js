/* Seamless Studio – Die Schleife weich schliessen
   ============================================================================
   Der Rundlauf der Video-Leinwand schliesst sich rechnerisch immer: nach
   tau = T steht jede Kachel wieder am Anfang. SICHTBAR wird der Uebergang
   trotzdem, wenn das Quellvideo anders endet als es anfaengt – bei den drei
   Grok-Videos mit Faktor 3,14 (Schleifenprobe). Offline loest das Ping-Pong,
   aber ein <video> im Browser kann nicht rueckwaerts laufen.

   Der Weg hier: die klassische Schnitt-Technik der Kreuzblende.

     * Jede Kachel spielt ihr Video wie bisher vorwaerts.
     * In den letzten f Sekunden wird ein zweites Element, das am ANFANG des
       Videos steht und mitlaeuft, weich darueber eingeblendet.
     * Am Ende traegt das zweite Element allein das Bild (Inhalt: start+f).
       Das eigene Element springt derweil unsichtbar auf start+f, und sobald
       beide dieselbe Stelle zeigen, uebernimmt es wieder. Das zweite Element
       pausiert und stellt sich fuer die naechste Runde an den Anfang.

   Die Kachel laeuft dadurch mit der Periode P = T − f: von start+f bis zum
   Ende, Blende, wieder start+f. Anfang und Ende der Blende zeigen dasselbe
   Bild – die Schleife schliesst sich ohne Sprung. Und weil JEDE Kachel mit
   genau dieser Periode laeuft, ist auch jedes aufgenommene Slide-Video von
   P Sekunden Laenge in sich schleifenfest, egal wo die Aufnahme beginnt.

   Die Wraps der Kacheln liegen zeitlich versetzt (Zeitpanorama!). Deshalb
   reicht ein kleiner VORRAT von hoechstens zwei Blend-Elementen fuer alle
   Kacheln zusammen – wichtig fuers iPhone, wo jedes <video> einen Dekoder
   kostet. Ist gerade keines frei (sehr kleine Zeitspanne, viele Slides),
   laesst die Kachel diese eine Runde hart springen wie bisher.

   Gezeichnet wird ueber den Haken VL.blendFuer(i) -> {q, alpha}, den
   videoleinwand7.js in Kern- und Band-Zeichnung eingebaut hat. Fuer den
   Modus "fuellen" (eine Slide, Cover-Fuellung) malt diese Datei die Blende
   selbst als zweite Cover-Lage.
   ========================================================================= */

(function () {
  const VL = SS.videoLeinwand;
  if (!VL || typeof SS.drawClipFrame !== 'function') return;

  const SCH = SS.schleife = {
    aktiv: true,   // weich schliessen an/aus
    f: 0,          // Ueberblenddauer in s; 0 = automatisch
  };

  /* ------------------------------------------------------------ Grundwerte */
  function clip() {
    const c = SS.clip;
    return c && c.ready && c.video ? c : null;
  }
  function dauerT() {
    const c = clip();
    if (!c) return 0;
    const d = (c.end || c.dur || 0) - (c.start || 0);
    return d > 0.05 ? d : (c.dur || 0);
  }
  /* Automatik: 12 % der Laenge, zwischen 0,4 und 1,5 s, nie fast das halbe
     Video. Kurz genug, dass das Motiv erkennbar bleibt, lang genug, dass die
     Blende nicht wie ein Schnitt wirkt. */
  function fEff() {
    const t = dauerT();
    if (!t) return 0;
    const w = SCH.f > 0 ? SCH.f : Math.min(1.5, Math.max(0.4, t * 0.12));
    return Math.min(w, t * 0.45);
  }
  SCH.dauer = fEff;
  SCH.periode = () => Math.max(0.1, dauerT() - fEff());
  /* Fuer Konsole und Tests: was die Kacheln gerade tun, und wie oft eine
     Blende sauber durchgelaufen ist. */
  SCH.zaehler = { blenden: 0, hart: 0, abgebrochen: 0 };
  SCH.status = () => lagen.map((st, i) => st
    ? { kachel: i, phase: st.phase, alpha: +(st.alpha || 0).toFixed(2) }
    : { kachel: i, phase: 'ruhe', alpha: 0 });

  /* --------------------------------------------------- Vorrat an Elementen */
  const vorrat = [];      // {v, frei, beiStart}
  let vorratSrc = null;

  function vorratLeeren() {
    while (vorrat.length) {
      const e = vorrat.pop();
      try { e.v.pause(); e.v.removeAttribute('src'); e.v.load(); e.v.remove(); } catch (x) {}
    }
    vorratSrc = null;
  }

  function anDenAnfang(e) {
    const c = clip();
    e.beiStart = false;
    if (!c) return;
    const ziel = c.start || 0;
    const fertig = () => { e.v.removeEventListener('seeked', fertig); e.beiStart = true; };
    e.v.addEventListener('seeked', fertig);
    setTimeout(fertig, 1500);
    try { e.v.currentTime = ziel; } catch (x) { fertig(); }
  }

  function elementNeu() {
    const c = clip();
    if (!c) return null;
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    v.crossOrigin = c.video.crossOrigin || null;
    v.style.cssText = 'position:fixed;left:-9999px;width:2px;height:2px;opacity:0';
    v.src = c.video.currentSrc || c.video.src;
    document.body.appendChild(v);
    const e = { v, frei: true, beiStart: false };
    anDenAnfang(e);
    return e;
  }

  /* Den Vorrat rechtzeitig anlegen: ein frisches <video> braucht einen
     Moment, bis es abspielbereit ist. Wuerde es erst beim Blendenbeginn
     erzeugt, liefe die erste Blende ins Leere und der Schatten "ploppte"
     mitten im Anstieg auf – als kleine Spitze messbar. */
  function vorbereiten() {
    const c = clip();
    if (!c) return;
    const src = c.video.currentSrc || c.video.src;
    if (vorratSrc !== src) { vorratLeeren(); vorratSrc = src; }
    while (vorrat.length < 2) { const e = elementNeu(); if (!e) break; vorrat.push(e); }
  }

  /* Nur ein Element nehmen, das wirklich am Anfang steht UND abspielbereit
     ist. Ein kaltes oder noch suchendes Element wuerde die ersten Bilder der
     Blende auslassen und dann mitten im Anstieg sichtbar "aufploppen" –
     lieber diese eine Runde hart springen, das faellt weniger auf. */
  function schattenHolen() {
    const c = clip();
    if (!c) return null;
    const src = c.video.currentSrc || c.video.src;
    if (vorratSrc !== src) { vorratLeeren(); vorratSrc = src; return null; }
    const e = vorrat.find(p => p.frei && p.beiStart && p.v.readyState >= 2) || null;
    if (e) e.frei = false;
    return e;
  }

  function schattenLoesen(st) {
    const e = st.sch;
    st.sch = null;
    if (!e) return;
    try { e.v.pause(); } catch (x) {}
    anDenAnfang(e);
    e.frei = true;
  }

  /* --------------------------------------------------------- Die Steuerung
     Eine Lage je Kachel: ruhe -> blende -> wechsel -> ruhe.
     Wird aus dem Zeichenweg aufgerufen und ist je Zeitpunkt idempotent –
     drawClipFrame laeuft beim slide-weisen Export mehrfach je Bild. */
  const lagen = [];

  function primaer(i) {
    const c = clip();
    if (!c) return null;
    if (VL.modus === 'zeit' && i > 0) return VL.kacheln[i - 1] || null;
    return c.video;
  }

  function abbrechen(st) { st.phase = 'ruhe'; st.alpha = 0; schattenLoesen(st); }

  function alleAbbrechen() { lagen.forEach(st => st && st.phase !== 'ruhe' && abbrechen(st)); }

  const glatt = (b) => b <= 0 ? 0 : b >= 1 ? 1 : b * b * (3 - 2 * b);

  function steuern() {
    const c = clip();
    if (!c || !SCH.aktiv) { if (lagen.some(s => s && s.phase !== 'ruhe')) alleAbbrechen(); return; }
    const f = fEff();
    if (f <= 0.05) return;
    vorbereiten();
    const start = c.start || 0;
    const ende = c.end || c.dur;
    const n = VL.modus === 'zeit' ? Math.max(1, SS.canvasSize().n) : 1;
    const jetzt = performance.now();

    for (let i = 0; i < n; i++) {
      const p = primaer(i);
      const st = lagen[i] || (lagen[i] = { phase: 'ruhe', alpha: 0, sch: null, seit: 0 });
      if (!p) { if (st.phase !== 'ruhe') abbrechen(st); continue; }
      const tau = p.currentTime || 0;

      if (st.phase === 'ruhe') {
        /* Blende beginnt, sobald die Kachel in die letzten f Sekunden laeuft. */
        if (p.paused || tau < ende - f || tau > ende - 0.02) continue;
        const e = schattenHolen();
        if (!e) { SCH.zaehler.hart++; continue; }   // kein Element frei: diese Runde hart
        st.sch = e; st.phase = 'blende'; st.seit = jetzt;
        /* Nur wenn wir DEUTLICH spaeter dran sind als der Blendenbeginn,
           zieht der Schatten nach. Ein kleiner Versatz ist unsichtbar –
           ein Sprung dagegen macht das Element kurz unbrauchbar, und die
           Blende poppte sichtbar auf. */
        const soll = start + (tau - (ende - f));
        if (Math.abs((e.v.currentTime || 0) - soll) > 0.5) {
          try { e.v.currentTime = Math.max(start, soll); } catch (x) {}
        }
        const pr = e.v.play(); if (pr && pr.catch) pr.catch(() => {});
      } else if (st.phase === 'blende') {
        if (p.paused) { abbrechen(st); continue; }
        /* Der Anstieg schliesst schon bei 80 % des Fensters auf 1: die
           letzten Bilder vor dem Wrap traegt der Schatten allein. Dadurch
           ist es egal, ob der Waechter in clip.js oder die native Schleife
           der Kacheln den Sprung zuerst ausloest – von dem Moment an ist
           vom eigenen Element ohnehin nichts mehr zu sehen. Wichtig auf
           langsamen Geraeten, wo zwischen zwei Bildern viel Zeit vergeht. */
        st.alpha = glatt(Math.min(1, (tau - (ende - f)) / (f * 0.8)));
        if (tau >= ende - 0.12) {
          /* Kurz vor dem Ende: das eigene Element springt unsichtbar auf die
             Stelle des Schattens – VOR clip.js (springt bei ende-0,03 auf
             start) und vor der nativen Schleife der Kacheln. Kleiner
             Vorhalt, damit der Sprung fertig ist, wenn der Schatten dort
             ankommt. */
          st.alpha = 1;
          st.phase = 'wechsel'; st.seit = jetzt; st.nachgefasst = false;
          try { p.currentTime = (st.sch.v.currentTime || start) + 0.10; } catch (x) {}
        } else if (tau < ende - f - 0.3) {
          /* Jemand hat das Video verstellt (Export stellt Kacheln neu, der
             Waechter in clip.js war schneller, Nutzer hat gespult). Nahe am
             Anfang: der Wrap ist schon passiert -> direkt in den Wechsel.
             Sonst: aufgeben, naechste Runde regulaer. */
          if (tau - start < 0.6) {
            st.alpha = 1; st.phase = 'wechsel'; st.seit = jetzt; st.nachgefasst = false;
            try { p.currentTime = (st.sch.v.currentTime || start) + 0.10; } catch (x) {}
          } else abbrechen(st);
        }
      } else if (st.phase === 'wechsel') {
        /* Der Schatten traegt das Bild, bis das eigene Element wieder an
           derselben Stelle laeuft. */
        st.alpha = 1;
        const sigma = st.sch ? (st.sch.v.currentTime || 0) : 0;
        if (!st.sch) { abbrechen(st); continue; }
        if (p.paused) { abbrechen(st); continue; }
        const dv = tau - sigma;
        if (!p.seeking && Math.abs(dv) < 0.12) {
          /* Beide zeigen (fast) dieselbe Stelle. Nicht hart umschalten – die
             bis zu 0,12 s Unterschied waeren als Mikroruck sichtbar –,
             sondern den Schatten kurz ausklingen lassen. */
          st.phase = 'abklingen'; st.seit = jetzt;
        } else if (Math.abs(dv) > 1.5 || jetzt - st.seit > 2500) {
          abbrechen(st); SCH.zaehler.abgebrochen++;  // verstellt oder festgefahren
        } else if (!p.seeking && jetzt - st.seit > 600 && !st.nachgefasst) {
          st.nachgefasst = true;             // Sprung kam zu weit hinten an
          try { p.currentTime = sigma + 0.12; } catch (x) {}
        }
      } else if (st.phase === 'abklingen') {
        if (p.paused) { abbrechen(st); continue; }
        st.alpha = glatt(1 - (jetzt - st.seit) / 300);
        if (st.alpha <= 0) {
          st.phase = 'ruhe'; st.alpha = 0; schattenLoesen(st);
          SCH.zaehler.blenden++;
        }
      }
    }
  }

  /* ---------------------------------------------- In den Zeichenweg haengen */
  VL.blendFuer = function (i) {
    const st = lagen[i];
    if (!st || st.phase === 'ruhe' || !st.sch || !(st.alpha > 0)) return null;
    return { q: st.sch.v, alpha: st.alpha };
  };

  const altDraw = SS.drawClipFrame;
  SS.drawClipFrame = function (c, W, H) {
    try { steuern(); } catch (e) {}
    const r = altDraw.apply(this, arguments);
    /* "fuellen" zeichnet clip.js selbst – die Blende kommt hier als zweite
       Cover-Lage darueber. Eine Quelle, eine Slide: das ist exakt. */
    try {
      if (VL.modus === 'fuellen') {
        const bl = VL.blendFuer(0);
        const q = bl && bl.q;
        if (q && q.readyState >= 2 && q.videoWidth) {
          const vw = q.videoWidth, vh = q.videoHeight;
          const sc = Math.max(W / vw, H / vh);
          const dw = vw * sc, dh = vh * sc;
          c.save();
          c.globalAlpha = Math.min(1, bl.alpha);
          c.drawImage(q, (W - dw) / 2, (H - dh) / 2, dw, dh);
          c.restore();
        }
      }
    } catch (e) {}
    return r;
  };

  /* Stoppt die Wiedergabe, stoppen auch die Schatten. Geht der Clip, geht
     alles. */
  if (typeof SS.clipStopPlayback === 'function') {
    const altStop = SS.clipStopPlayback;
    SS.clipStopPlayback = function () {
      vorrat.forEach(e => { try { e.v.pause(); } catch (x) {} });
      return altStop.apply(this, arguments);
    };
  }
  if (typeof SS.clipClear === 'function') {
    const altClear = SS.clipClear;
    SS.clipClear = function () {
      alleAbbrechen();
      vorratLeeren();
      lagen.length = 0;
      return altClear.apply(this, arguments);
    };
  }

  /* ------------------------------------------------------------- Bedienung */
  (function () {
    const kasten = document.getElementById('vlBox');
    if (!kasten) return;
    const box = document.createElement('div');
    box.id = 'schlBox';
    box.innerHTML =
      '<h3 style="margin:14px 0 6px">Schleife</h3>' +
      '<div class="chips" id="schlChips"></div>' +
      '<p class="hint" id="schlHint"></p>';
    kasten.appendChild(box);

    const WEGE = [
      { id: true,  name: 'Weich schließen' },
      { id: false, name: 'Hart wiederholen' },
    ];
    const chips = document.getElementById('schlChips');
    const hint = document.getElementById('schlHint');

    function hinweis() {
      if (!SCH.aktiv) {
        hint.textContent = 'Das Video springt am Ende hart auf den Anfang – wie bisher.';
        return;
      }
      const c = clip();
      if (!c) { hint.textContent = 'Die letzten Sekunden werden weich in den Anfang übergeblendet – die Schleife schließt sich ohne Sprung.'; return; }
      hint.textContent = 'Die letzten ' + fEff().toFixed(1) + ' s werden weich in den Anfang übergeblendet – '
        + 'die Schleife schließt sich ohne Sprung. Schleifenfeste Videolänge: '
        + SCH.periode().toFixed(1) + ' s.';
    }

    function malen() {
      chips.innerHTML = '';
      for (const w of WEGE) {
        const b = document.createElement('button');
        b.textContent = w.name;
        if (w.id === SCH.aktiv) b.classList.add('sel');
        b.onclick = () => {
          SCH.aktiv = w.id;
          if (!w.id) alleAbbrechen();
          malen();
        };
        chips.appendChild(b);
      }
      hinweis();
    }
    malen();

    /* Wenn ein anderer Clip geladen wird, stimmen f und Periode neu. */
    if (SS.ui && typeof SS.ui.syncTop === 'function') {
      const altSync = SS.ui.syncTop;
      SS.ui.syncTop = function () {
        const r = altSync.apply(this, arguments);
        try { hinweis(); } catch (e) {}
        return r;
      };
    }
  })();

  SS.SCHLEIFE = { bereit: true };
})();
