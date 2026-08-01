/* Seamless Studio – Reel-Paket: Schnitte auf den Takt + Untertitel mittippen
   ============================================================================
   Reels leben von zwei Dingen, die der App noch fehlten:

   1. SCHNITTE. Die Kamerafahrt ist schoen, aber ein Reel schneidet: Slide 1
      steht, Schnitt, Slide 2 steht, Schnitt. Neuer Kamera-Stil "Schnitte":
      je Slide ein Halt mit leichtem Hineinzoomen (Punch-in), dazwischen ein
      harter Schnitt mit kurzem hellen Aufblitzen. Ist Beat-Sync an, fallen
      die Schnitte auf den Takt des gewaehlten Klangbetts.

   2. MITTIPPEN. Wort-fuer-Wort-Untertitel (Karaoke-Stil) gibt es schon in
      caption5.js – aber die Zeiten je Zeile von Hand einzutragen ist muehsam.
      Neuer Weg: Zeilen schreiben, "Zeiten mittippen" druecken, der Ton
      laeuft, und bei jedem Zeilenanfang einmal tippen. Fertig sind die
      Zeiten, wortgenau hervorgehoben wird automatisch.
   ========================================================================= */

(function () {
  const V = SS.video;
  if (!V || typeof V.buildCamera !== 'function') return;

  /* ================================================= 1. Kamera "Schnitte" */

  let schnitte = [];          // Schnittzeiten des zuletzt gebauten Kamerapfads

  /* Taktangaben der Klangbetten – dieselben Werte wie in beat5.js (dort
     privat). Naturklaenge bekommen einen ruhigen Standardtakt. */
  const BPM = {
    none: 0, meer: 60, wald: 76, wind: 66, regen: 84,
    ruhig: 72, froh: 112, episch: 90, lulla: 66, custom: 100,
  };
  function bpmErmitteln() {
    const b = SS.beat;
    if (!b || !b.on) return 0;
    if (b.bpm > 0) return b.bpm;
    const id = (SS.audio && SS.audio.state && SS.audio.state.soundId) || 'none';
    return BPM[id] || 84;
  }

  /* Schnittzeiten: gleichmaessig ueber die Dauer, bei Beat-Sync auf den
     naechsten Schlag gezogen. Nie enger als 0,35 s. */
  function schnittzeiten(dur, n) {
    const roh = [];
    for (let i = 1; i < n; i++) roh.push(dur * i / n);
    const bpm = bpmErmitteln();
    if (bpm > 0) {
      const schritt = 60 / bpm * Math.max(1, (SS.beat && SS.beat.every) || 1);
      const v = (SS.beat && SS.beat.versatz) || 0;
      for (let i = 0; i < roh.length; i++) {
        roh[i] = Math.round((roh[i] - v) / schritt) * schritt + v;
      }
    }
    const sauber = [];
    for (const t of roh) {
      const v = Math.max(sauber.length ? sauber[sauber.length - 1] + 0.35 : 0.35,
        Math.min(dur - 0.35, t));
      sauber.push(+v.toFixed(3));
    }
    return sauber;
  }

  const altKamera = V.buildCamera;
  V.buildCamera = function (style, dur, ar) {
    if (style !== 'schnitt') return altKamera.apply(this, arguments);
    const { W, H, slideW, n } = SS.canvasSize();
    if (n < 2) return altKamera.call(this, 'kenburns', dur, ar);

    const vw = Math.min(H * ar, W);
    const vh = vw / ar;
    schnitte = schnittzeiten(dur, n);
    const grenzen = [0].concat(schnitte, [dur]);
    const klemm = (x) => SS.clamp(x, vw / 2, W - vw / 2);

    const cam = function (tRaw) {
      const t = SS.clamp(tRaw * (V.opts.speed || 1), 0, dur);
      let i = 0;
      while (i < grenzen.length - 2 && t >= grenzen[i + 1]) i++;
      const a = grenzen[i], b = Math.max(a + 0.01, grenzen[i + 1]);
      const u = SS.clamp((t - a) / (b - a), 0, 1);
      /* Punch-in im Halt: ruhig 100 % -> 93 % */
      const z = 1 - 0.07 * u;
      const zw = vw * z;
      return { cx: klemm((Math.min(i, n - 1) + 0.5) * slideW), cy: H / 2,
               vw: zw, vh: zw / ar };
    };
    cam.schnitte = schnitte.slice();
    return cam;
  };

  /* Aufblitzen am Schnitt – nur Vorschau und Video, nie im Bildexport. */
  const altFrame = V.drawFrame;
  V.drawFrame = function (oc, outW, outH, t) {
    const r = altFrame.apply(this, arguments);
    try {
      if (V.opts.style === 'schnitt' && schnitte.length) {
        const tt = SS.clamp(t * (V.opts.speed || 1), 0, 1e9);
        for (const s of schnitte) {
          const dt = tt - s;
          if (dt >= 0 && dt < 0.14) {
            oc.save();
            oc.setTransform(1, 0, 0, 1, 0, 0);
            oc.globalAlpha = (1 - dt / 0.14) * 0.5;
            oc.fillStyle = '#fff';
            oc.fillRect(0, 0, outW, outH);
            oc.restore();
            break;
          }
        }
      }
    } catch (e) {}
    return r;
  };

  /* Stil anmelden und die Kachelleiste einmal neu aufbauen (die interne
     renderStyles-Funktion liest V.STYLES – ab dem naechsten Klick zeichnet
     sie den neuen Knopf von selbst mit). */
  V.STYLES.push({ id: 'schnitt', name: 'Schnitte',
    desc: 'Harte Schnitte je Slide mit kurzem Aufblitzen – mit Beat-Sync fallen sie auf den Takt' });
  (function () {
    const box = document.getElementById('vidStyles');
    if (!box) return;
    const b = document.createElement('button');
    b.textContent = 'Schnitte';
    b.title = 'Harte Schnitte je Slide mit kurzem Aufblitzen';
    b.onclick = () => {
      V.opts.style = 'schnitt';
      box.querySelectorAll('button').forEach(x => x.classList.toggle('sel', x === b));
      const d = document.getElementById('vidStyleDesc');
      if (d) d.textContent = 'Harte Schnitte je Slide mit kurzem Aufblitzen – mit Beat-Sync fallen sie auf den Takt';
      const z = document.getElementById('vidZoomRow');
      if (z) z.classList.add('hidden');
      V.refresh && V.refresh(false);
    };
    box.appendChild(b);
  })();

  /* ============================================= 2. Untertitel mittippen */

  function dauerHolen() {
    const el = document.getElementById('vidDur');
    return (V.player && V.player.dur) || +(el ? el.value : 8) || 8;
  }

  function mittippen() {
    const zeilen = (SS.captions || []).slice().sort((a, b) => a.t0 - b.t0);
    if (!zeilen.length) {
      SS.toast('Erst Zeilen anlegen („Zeile hier einsetzen"), dann mittippen', 3600, 'warn');
      return;
    }
    const dur = dauerHolen();

    const deck = document.createElement('div');
    deck.id = 'tippDeck';
    deck.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(12,10,9,.92);' +
      'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:20px';
    deck.innerHTML =
      '<p style="color:#a99;margin:0;font-size:14px" id="tippStand"></p>' +
      '<p style="color:#f6eedc;font-size:24px;text-align:center;max-width:80%;margin:0" id="tippZeile"></p>' +
      '<button id="tippKnopf" class="primary" style="font-size:22px;padding:22px 44px;border-radius:16px">' +
        'Tipp!  =  diese Zeile beginnt jetzt</button>' +
      '<button id="tippAbbruch" style="margin-top:6px">Abbrechen</button>' +
      '<p style="color:#887;max-width:70%;text-align:center;font-size:13px;margin:0">' +
        'Der Ton läuft. Tippe in dem Moment, in dem die angezeigte Zeile beginnt. ' +
        'Die letzte Zeile endet automatisch.</p>';
    document.body.appendChild(deck);

    let k = 0;
    const stand = deck.querySelector('#tippStand');
    const zeile = deck.querySelector('#tippZeile');
    const zeigen = () => {
      stand.textContent = 'Zeile ' + (k + 1) + ' von ' + zeilen.length;
      zeile.textContent = '„' + (zeilen[k].text || '(leere Zeile)') + '"';
    };
    zeigen();

    const t0 = performance.now();
    try { SS.audio.playPreview(dur, 0); } catch (e) {}

    const fertig = (abgebrochen) => {
      try { SS.audio.stopPreview(); } catch (e) {}
      deck.remove();
      if (abgebrochen) return;
      SS.ui.refreshCaptions && SS.ui.refreshCaptions();
      SS.pushHistory('Untertitel mitgetippt');
      V.refresh && V.refresh(true);
      SS.toast('Zeiten gesetzt – Feinschliff über die Zahlenfelder', 3400, 'ok');
    };

    deck.querySelector('#tippAbbruch').onclick = () => fertig(true);
    deck.querySelector('#tippKnopf').onclick = () => {
      const t = Math.min(dur - 0.2, (performance.now() - t0) / 1000);
      zeilen[k].t0 = +t.toFixed(2);
      if (k > 0) zeilen[k - 1].t1 = Math.max(zeilen[k - 1].t0 + 0.2, +t.toFixed(2));
      k++;
      if (k >= zeilen.length) {
        const letzte = zeilen[zeilen.length - 1];
        letzte.t1 = +Math.min(dur, letzte.t0 + 2.5).toFixed(2);
        fertig(false);
      } else zeigen();
    };
  }

  const capListe = document.getElementById('capList');
  if (capListe && capListe.parentElement) {
    const b = document.createElement('button');
    b.id = 'capTippen';
    b.className = 'wide';
    b.textContent = 'Zeiten mittippen (Ton läuft)';
    capListe.parentElement.appendChild(b);
    b.onclick = mittippen;
  }

  SS.REEL7 = { bereit: true, schnittzeiten };
})();
