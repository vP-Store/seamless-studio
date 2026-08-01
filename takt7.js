/* Seamless Studio – Takt-Erkennung fuer eigene Musik
   ============================================================================
   Beat-Sync und die "Schnitte" rasten bisher nur bei den eingebauten
   Klangbetten auf den Takt, weil deren Tempo bekannt ist. Fuer eigene MP3s
   schaetzt diese Datei Tempo UND ersten Schlag – komplett im Geraet:

     1. Mono-Hüllkurve (RMS je 512 Samples, ~86 Werte je Sekunde)
     2. Onset-Staerke = positiver Anstieg der Hüllkurve
     3. Autokorrelation der Onsets im Bereich 60–180 bpm (mit Bonus fuer
        Verdopplungen, damit 60 nicht faelschlich statt 120 gewinnt)
     4. Phase: der Versatz, unter dem ein Kammfilter die meiste Energie trifft

   Ehrlichkeit vor Eleganz: die App zeigt ein VERTRAUEN an, bietet ein
   Klick-Vorhoeren zum Nachpruefen, und bei beatloser Musik sagt sie
   "kein klarer Takt" statt zu raten. beat5.js kennt dafuer jetzt
   SS.beat.versatz (Standard 0).
   ========================================================================= */

(function () {
  const A = SS.audio;
  if (!A || !SS.ui) return;

  /* ------------------------------------------------------------- Analyse */
  SS.taktSchaetzen = function (buffer) {
    const sr = buffer.sampleRate;
    const hop = 512;
    const laenge = Math.min(buffer.length, sr * 60);      // max. 60 s reichen
    const kanaele = [];
    for (let c = 0; c < buffer.numberOfChannels; c++) kanaele.push(buffer.getChannelData(c));

    /* 1. Hüllkurve */
    const n = Math.floor(laenge / hop);
    const huelle = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      let s = 0;
      const von = i * hop;
      for (let j = 0; j < hop; j += 4) {
        let v = 0;
        for (const k of kanaele) v += k[von + j] || 0;
        v /= kanaele.length;
        s += v * v;
      }
      huelle[i] = Math.sqrt(s / (hop / 4));
    }

    /* 2. Onsets: positiver Anstieg, leicht geglaettet */
    const onset = new Float32Array(n);
    for (let i = 2; i < n; i++) {
      const d = huelle[i] - huelle[i - 2];
      onset[i] = d > 0 ? d : 0;
    }
    const proSek = sr / hop;

    /* 3. Autokorrelation ueber die Taktlaengen 60–180 bpm */
    const minLag = Math.round(proSek * 60 / 180);
    const maxLag = Math.round(proSek * 60 / 60);
    let bester = { lag: 0, wert: 0 };
    let summeWerte = 0, zahlWerte = 0;
    const korr = {};
    for (let lag = minLag; lag <= maxLag; lag++) {
      let s = 0;
      for (let i = 0; i + lag < n; i++) s += onset[i] * onset[i + lag];
      korr[lag] = s;
      summeWerte += s; zahlWerte++;
    }
    for (let lag = minLag; lag <= maxLag; lag++) {
      /* Bonus, wenn auch der halbe Lag (doppeltes Tempo) stark ist –
         zieht die Schaetzung weg von Halbtempo-Fehlern */
      const halb = Math.round(lag / 2);
      const wert = korr[lag] + (korr[halb] ? korr[halb] * 0.35 : 0);
      if (wert > bester.wert) bester = { lag, wert };
    }
    if (!bester.lag) return null;
    /* Halbtempo-Falle: ist der halbe Lag selbst fast so stark, ist das
       DOPPELTE Tempo das richtige (128 wurde sonst als 64 erkannt). Von
       den beiden Kandidaten (ab- und aufgerundet) nimmt der staerkere. */
    const h1 = Math.floor(bester.lag / 2), h2 = Math.ceil(bester.lag / 2);
    const halber = (korr[h2] || 0) > (korr[h1] || 0) ? h2 : h1;
    if (halber >= minLag && korr[halber] >= korr[bester.lag] * 0.5) {
      bester = { lag: halber, wert: korr[halber] };
    }
    const mittel = summeWerte / Math.max(1, zahlWerte);
    /* Vertrauen = wie weit der Gipfel ueber dem Mittel liegt. Reines
       Rauschen kommt auf ~0,5, echte Schlaege weit ueber 2. */
    const vertrauen = mittel > 0 ? (korr[bester.lag] / mittel - 1) : 0;
    /* Parabel um den Gipfel: bei hohen Tempi ist ein ganzzahliger Lag zu
       grob (±1 Lag ≈ ±3 bpm) – die Interpolation holt die Nachkommastelle. */
    let lagFein = bester.lag;
    const kA = korr[bester.lag - 1], kB = korr[bester.lag], kC = korr[bester.lag + 1];
    if (kA !== undefined && kC !== undefined) {
      const nenner = kA - 2 * kB + kC;
      if (Math.abs(nenner) > 1e-9) {
        const d = 0.5 * (kA - kC) / nenner;
        if (isFinite(d) && Math.abs(d) <= 1) lagFein = bester.lag + d;
      }
    }
    const bpm = 60 * proSek / lagFein;

    /* 4. Phase: Kammfilter ueber eine Taktlaenge – mit der VERFEINERTEN
       Laenge, nicht dem ganzzahligen Lag. Sonst wandert der Kamm bei hohen
       Tempi ueber 30 Sekunden um etliche Hops aus der Spur. */
    let besterVersatz = 0, besteEnergie = 0;
    for (let ph = 0; ph < lagFein; ph += 1) {
      let s = 0;
      for (let t = ph; t < n; t += lagFein) s += onset[Math.round(t)] || 0;
      if (s > besteEnergie) { besteEnergie = s; besterVersatz = ph; }
    }
    /* Phasenkorrektur: RMS-Fenster und Onset-Differenz verschieben die
       gemessene Phase um einige Hops – an Klickspuren mit bekannter Lage
       nachgemessen. Ehrliche Genauigkeit: etwa ±0,1 s; deshalb gibt es das
       Klick-Vorhoeren zum Nachpruefen. */
    const beatS = 60 / bpm;
    let versatz = (besterVersatz + 3) / proSek;
    versatz = ((versatz % beatS) + beatS) % beatS;
    return {
      bpm: Math.round(bpm * 2) / 2,
      versatz: +versatz.toFixed(3),
      vertrauen: Math.min(5, +vertrauen.toFixed(2)),
    };
  };

  /* ------------------------------------------------ Klicks zum Nachhoeren */
  let klickQuellen = [];
  function klickVorhoeren(bpm, versatz) {
    klickStopp();
    const buf = A.state.custom && A.state.custom.buffer;
    if (!buf) return;
    const ctx = A.ctx();
    const start = ctx.currentTime + 0.08;
    const dauer = Math.min(8, buf.duration);
    const q = ctx.createBufferSource();
    q.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = 0.5;
    q.connect(g); g.connect(ctx.destination);
    q.start(start, 0, dauer);
    klickQuellen.push(q);
    const beat = 60 / bpm;
    for (let t = versatz; t < dauer; t += beat) {
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.frequency.value = 1660;
      og.gain.setValueAtTime(0.6, start + t);
      og.gain.exponentialRampToValueAtTime(0.001, start + t + 0.05);
      o.connect(og); og.connect(ctx.destination);
      o.start(start + t); o.stop(start + t + 0.06);
      klickQuellen.push(o);
    }
  }
  function klickStopp() {
    klickQuellen.forEach(q => { try { q.stop(); } catch (e) {} });
    klickQuellen = [];
  }

  /* ------------------------------------------------------------ Bedienung */
  const soundBox = document.getElementById('vidSounds');
  if (!soundBox || !soundBox.parentElement) return;

  const box = document.createElement('div');
  box.id = 'taktBox';
  box.innerHTML =
    '<div class="chips" style="margin-top:8px">' +
      '<button id="tkErkennen">Takt der eigenen Musik erkennen</button>' +
      '<button id="tkKlick" class="hidden">Mit Klicks vorhören</button>' +
      '<button id="tkNehmen" class="hidden">Übernehmen</button>' +
    '</div>' +
    '<p class="hint" id="tkStand">Für „Eigene MP3": Tempo und ersten Schlag schätzen – ' +
    'dann fallen Beat-Sync und die „Schnitte" auf deinen Song.</p>';
  soundBox.parentElement.insertBefore(box, soundBox.nextSibling);

  let letzte = null;
  const $ = (id) => document.getElementById(id);

  $('tkErkennen').onclick = () => {
    const buf = A.state.custom && A.state.custom.buffer;
    const stand = $('tkStand');
    if (!buf) { stand.textContent = 'Erst über „Eigene MP3" ein Musikstück laden.'; return; }
    stand.textContent = 'Hört hin …';
    setTimeout(() => {
      const r = SS.taktSchaetzen(buf);
      if (!r || r.vertrauen < 1) {
        letzte = null;
        stand.textContent = 'Kein klarer Takt gefunden – das Stück ist zu frei (Ambient?). ' +
          'Beat-Sync bleibt aus, die Schnitte kommen gleichmäßig.';
        $('tkKlick').classList.add('hidden');
        $('tkNehmen').classList.add('hidden');
        return;
      }
      letzte = r;
      const wie = r.vertrauen >= 2.5 ? 'hoch' : (r.vertrauen >= 1.5 ? 'mittel' : 'niedrig');
      stand.textContent = 'Geschätzt: ' + r.bpm + ' bpm, erster Schlag bei ' +
        r.versatz.toFixed(2) + ' s (±0,1) · Vertrauen: ' + wie + '. Erst vorhören, dann übernehmen.';
      $('tkKlick').classList.remove('hidden');
      $('tkNehmen').classList.remove('hidden');
    }, 30);
  };

  $('tkKlick').onclick = () => { if (letzte) klickVorhoeren(letzte.bpm, letzte.versatz); };
  $('tkNehmen').onclick = () => {
    if (!letzte) return;
    klickStopp();
    SS.beat.on = true;
    SS.beat.bpm = letzte.bpm;
    SS.beat.versatz = letzte.versatz;
    $('tkStand').textContent = 'Übernommen: ' + letzte.bpm + ' bpm. Beat-Sync ist an – ' +
      'Kamera und „Schnitte" rasten jetzt auf deinen Song.';
    SS.toast('Takt übernommen: ' + letzte.bpm + ' bpm', 2800, 'ok');
  };

  SS.TAKT7 = { bereit: true };
})();
