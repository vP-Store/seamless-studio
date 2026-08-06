/* Seamless Studio – Karussell als Videos: ein Video je Slide (v7.7)
   ============================================================================
   Ein Instagram-Karussell aus Videos ist kein einzelnes Video, sondern eines
   je Slide. Es gab dafür bisher nur einen Knopf im Video-Bereich, und den auch
   nur, wenn ein Video als HINTERGRUND geladen war. Wer seine Clips wie Fotos
   auf die Leinwand legt (Rahmen, Platzhalter, Szenen), kam gar nicht daran.

   Schlimmer noch – und das ist der eigentliche Kern dieser Datei:

     V.prepare() backt alles Unbewegte EINMAL in ein Standbild und zeichnet je
     Bild nur noch die animierten Elemente darüber. Ein Video-Element ohne
     Animations-Preset galt als „unbewegt" und landete damit im Standbild:
     im fertigen Video stand der Clip STILL. Auf der Leinwand lief er, im
     Export war er eingefroren. Nachgemessen im Container: über 1,6 Sekunden
     Laufzeit änderte sich in drawFrame kein einziger Bildpunkt (0 von 90 990),
     während dieselbe Szene über paintScene 3 226 geänderte Punkte zeigte.

   Hier wird das an vier Stellen geradegezogen:

     1. Clips bleiben aus dem Standbild heraus und werden je Bild live
        gezeichnet – dadurch laufen sie im Video wirklich.
     2. Alles, was ÜBER einem Clip liegt (Rahmen, Text, Sticker), kommt in
        eine zweite, durchsichtige Lage und wird nach den Clips gezeichnet.
        Sonst läge der Rahmen plötzlich hinter dem Video.
     3. Während der Aufnahme laufen die Clips (sonst hält clips5.js sie an,
        weil kein Vorschau-Player läuft).
     4. Vor JEDER Slide werden alle Clips wieder auf ihren Anfang gestellt –
        beim Wischen startet Instagram jedes Slide-Video von vorn.

   Dazu die Bedienung: eine neue Art im Export-Dialog, Länge je Slide,
   ruhige Slides wahlweise als Foto, und der Ton der Clips, bei denen „Ton an"
   steht, als echte Tonspur im Video ihrer Slide.

     SS.slideVideo.aufnehmen({dur, quality, ton, nurSlides}, fortschritt)
       -> [{blob, ext, slide, bildrate}]
   ========================================================================= */

(function () {
  const V = SS.video;
  if (!V || typeof V.drawFrame !== 'function' || typeof V.prepare !== 'function') return;
  const $ = (id) => document.getElementById(id);

  const SV = { laeuft: false };
  SS.slideVideo = SV;

  /* ================================================================
     1. Clips im Videobild: nicht einbacken, sondern je Bild zeichnen
     ================================================================ */

  const istClip = (e) => e.type === 'video' && !e.hidden;
  const hatAnim = (e) => !!(e.anim && e.anim !== 'none');

  let _szene = null;          // dieselbe Objektreferenz, die video.js hält

  const origPrepare = V.prepare;
  V.prepare = function () {
    const els = SS.state.elements;
    const clips = els.filter(e => istClip(e) && !hatAnim(e));
    if (!clips.length) { _szene = origPrepare.apply(this, arguments); return _szene; }

    /* Kurz verstecken, damit origPrepare sie nicht ins Standbild backt.
       So bleibt es bei EINEM Backvorgang – ein zweiter über das ganze
       Panorama wäre bei 5 400 px Breite spürbar teuer. */
    clips.forEach(e => { e._svWeg = true; e.hidden = true; });
    let sc;
    try { sc = origPrepare.apply(this, arguments); }
    finally { clips.forEach(e => { e.hidden = false; delete e._svWeg; }); }

    const lebend = new Set(sc.animEls.map(e => e.id));
    clips.forEach(e => lebend.add(e.id));
    /* In der Ebenenfolge einsortieren, nicht anhängen. */
    sc.animEls = els.filter(e => lebend.has(e.id) && !e.hidden);

    /* Zweite Lage: alles Unbewegte OBERHALB des ersten lebenden Elements.
       Ohne sie läge ein Rahmen, der eigentlich vor dem Clip sitzt, hinter
       ihm – im Video sähe man den Clip über seinem eigenen Rahmen. */
    sc.svOben = null;
    const ersteLebend = els.findIndex(e => lebend.has(e.id) && !e.hidden);
    const oben = ersteLebend < 0 ? []
      : els.slice(ersteLebend + 1).filter(e => !lebend.has(e.id) && !e.hidden);
    if (oben.length) {
      const { W, H } = SS.canvasSize();
      const s = Math.min(1, 12000 / Math.max(W, 1));
      const cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.round(W * s));
      cv.height = Math.max(1, Math.round(H * s));
      const c = cv.getContext('2d');
      c.scale(s, s);
      const nurOben = new Set(oben.map(e => e.id));
      const weg = new Set(els.filter(e => !nurOben.has(e.id)).map(e => e.id));
      SS.paintScene(c, W, H, { forExport: true, noBg: true, skip: weg });
      sc.svOben = cv;
    }
    _szene = sc;
    return sc;
  };

  /* SS.drawElement kennt nur Foto, Text, Sticker und Emoji – ein Video kam
     dort gar nicht vor. Genau darüber zeichnet drawFrame aber die lebenden
     Elemente. Ohne diese Ergänzung bliebe der Clip auch weiterhin weg (ein
     Clip MIT Animations-Preset war deshalb im Export sogar unsichtbar). */
  const origDrawEl = SS.drawElement;
  SS.drawElement = function (c, el) {
    if (el && el.type === 'video' && SS.drawVideoEl) {
      /* Beim Aufnehmen einer einzelnen Slide steht die Kamera vor genau
         einer Stelle des Panoramas – Clips weit daneben zu zeichnen kostet
         nur Zeit. (Derselbe Kniff wie das Sichtfenster der Video-Leinwand.) */
      const f = SV.sicht;
      if (f) {
        const g = SS.elSize ? SS.elSize(el) : { w: el.w || 0 };
        const halb = (g.w || 0) / 2 + 4;
        if (el.x + halb < f[0] || el.x - halb > f[1]) return;
      }
      c.save();
      if (el.blend && el.blend !== 'source-over') c.globalCompositeOperation = el.blend;
      SS.drawVideoEl(c, el);
      c.restore();
      return;
    }
    return origDrawEl.apply(this, arguments);
  };

  const origRelease = V.release;
  V.release = function () { _szene = null; return origRelease.apply(this, arguments); };

  const origDraw = V.drawFrame;      // clips5.js hängt hier schon davor
  V.drawFrame = function (oc, outW, outH, t, cam) {
    const r = origDraw.apply(this, arguments);
    const sc = _szene;
    if (sc && sc.svOben) {
      /* Nur den sichtbaren Ausschnitt der oberen Lage auflegen. Die ganze
         Lage (bei 5 Slides 5 400 px breit) je Bild zu skalieren kostete
         messbar Zeit, obwohl 4/5 davon gar nicht ins Bild fallen. */
      const view = cam(t);
      const s = sc.svOben.width / sc.W;
      oc.save();
      oc.setTransform(1, 0, 0, 1, 0, 0);
      oc.drawImage(sc.svOben,
        (view.cx - view.vw / 2) * s, (view.cy - view.vh / 2) * s,
        view.vw * s, view.vh * s, 0, 0, outW, outH);
      oc.restore();
    }
    return r;
  };

  /* Während der Aufnahme läuft kein Vorschau-Player – ohne diesen Zusatz
     hielte clips5.js jeden Clip an und der Export zeigte Standbilder. */
  if (typeof SS.syncVideoEls === 'function') {
    const origSync = SS.syncVideoEls;
    SS.syncVideoEls = function (t, playing) {
      const r = origSync.call(SS, t, playing || SV.laeuft);
      /* Beim Aufnehmen einer Slide sollen nur deren eigene Clips laufen.
         Sonst laufen die anderen im Hintergrund weiter, verbrauchen Dekoder
         und stehen bei ihrer eigenen Aufnahme nicht mehr am Anfang. */
      const f = SV.sicht;
      if (f) {
        for (const el of SS.state.elements) {
          if (el.type !== 'video') continue;
          const g = SS.elSize ? SS.elSize(el) : { w: el.w || 0 };
          const halb = (g.w || 0) / 2 + 4;
          if (el.x + halb >= f[0] && el.x - halb <= f[1]) continue;
          const rec = SS.videos && SS.videos[el.vidId];
          if (rec && rec.el && !rec.el.paused) { try { rec.el.pause(); } catch (e) {} }
        }
      }
      return r;
    };
  }

  /* ================================================================
     2. Werkzeuge
     ================================================================ */

  function slideVon(el) {
    const g = SS.elSize ? SS.elSize(el) : { w: el.w || 0, h: el.h || 0 };
    const halb = (g.w || 0) / 2;
    return [el.x - halb, el.x + halb];
  }

  function aufSlide(el, k, rand) {
    const { slideW } = SS.canvasSize();
    const [l, r] = slideVon(el);
    return r + (rand || 0) > k * slideW && l - (rand || 0) < (k + 1) * slideW;
  }

  /* Bewegt sich auf dieser Slide überhaupt etwas? Ruhige Slides müssen nicht
     in Echtzeit aufgenommen werden – ein Foto ist schärfer, kleiner und
     sofort da. Instagram nimmt Fotos und Videos in EINEM Karussell. */
  function slideBewegt(k) {
    if (SS.clip && SS.clip.ready) return true;
    const { slideW } = SS.canvasSize();
    const rand = slideW * 0.08;
    return SS.state.elements.some((el) => {
      if (el.hidden) return false;
      const lebt = el.type === 'video' || hatAnim(el) || (el.kf && el.kf.length > 1);
      return lebt && aufSlide(el, k, rand);
    });
  }
  SV.slideBewegt = slideBewegt;

  /* Clips mit „Ton an", die auf dieser Slide liegen */
  function tonClips(k) {
    return SS.state.elements.filter(el =>
      el.type === 'video' && !el.hidden && el.muted === false && aufSlide(el, k));
  }

  /* Alle Leinwand-Clips auf ihren Anfang stellen und dort warten, bis das
     Bild wirklich steht. Ohne das Warten nimmt die erste halbe Sekunde noch
     das alte Bild auf. */
  async function clipsAufAnfang() {
    const jobs = [];
    for (const el of SS.state.elements) {
      if (el.type !== 'video') continue;
      const rec = SS.videos && SS.videos[el.vidId];
      if (!rec || !rec.el) continue;
      const v = rec.el;
      const ziel = Math.max(0, el.trimStart || 0);
      try { v.pause(); } catch (e) {}
      rec._seek = performance.now();     // Drossel in clips5.js beruhigen
      if (Math.abs(v.currentTime - ziel) < 0.05) continue;
      jobs.push(new Promise((fertig) => {
        let ab = false;
        const los = () => { if (ab) return; ab = true; v.removeEventListener('seeked', los); fertig(); };
        v.addEventListener('seeked', los);
        setTimeout(los, 1400);
        try { v.currentTime = ziel; } catch (e) { los(); }
      }));
    }
    if (jobs.length) await Promise.all(jobs);
  }

  /* Hintergrund-Clip und Video-Leinwand ebenso zurückstellen (wie bisher) */
  async function hintergrundAufAnfang() {
    const cl = SS.clip;
    if (!cl || !cl.ready) return;
    try { cl.video.pause(); } catch (e) {}
    await new Promise((fertig) => {
      let ab = false;
      const los = () => { if (ab) return; ab = true; cl.video.removeEventListener('seeked', los); fertig(); };
      cl.video.addEventListener('seeked', los);
      setTimeout(los, 1400);
      try { cl.video.currentTime = cl.start || 0; } catch (e) { los(); }
    });
    const VL = SS.videoLeinwand;
    if (VL && VL.modus === 'zeit' && VL.stellen) await VL.stellen(Math.max(1, SS.canvasSize().n));
  }

  /* Ton der Clips in den Aufnahmestrom hängen.
     Ein <video> darf nur EINEN MediaElementSource bekommen – deshalb wird er
     je Clip einmal angelegt und gemerkt. Er wird zusätzlich auf den normalen
     Ausgang gelegt, sonst wäre der Clip in der App danach für immer stumm. */
  function tonAnhaengen(stream, clips) {
    if (!clips.length || !SS.audio || typeof SS.audio.ctx !== 'function') return null;
    let ctx;
    try { ctx = SS.audio.ctx(); } catch (e) { return null; }
    if (!ctx) return null;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    const ziel = ctx.createMediaStreamDestination();
    const dran = [];
    for (const el of clips) {
      const rec = SS.videos && SS.videos[el.vidId];
      if (!rec || !rec.el) continue;
      try {
        if (!rec._tonQuelle) {
          rec._tonQuelle = ctx.createMediaElementSource(rec.el);
          rec._tonQuelle.connect(ctx.destination);
        }
        rec._tonQuelle.connect(ziel);
        rec.el.muted = false;
        dran.push(rec);
      } catch (e) { /* Quelle schon vergeben o. ä. – dann eben ohne diesen Clip */ }
    }
    if (!dran.length) return null;
    let ok = false;
    ziel.stream.getAudioTracks().forEach((tr) => { try { stream.addTrack(tr); ok = true; } catch (e) {} });
    if (!ok) return null;
    return {
      loesen() { dran.forEach(r => { try { r._tonQuelle.disconnect(ziel); } catch (e) {} }); },
    };
  }

  function mimeWaehlen(mitTon) {
    const cands = mitTon
      ? ['video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus',
         'video/webm;codecs=vp8,opus', 'video/webm']
      : ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9',
         'video/webm;codecs=vp8', 'video/webm'];
    return cands.find(m => window.MediaRecorder && MediaRecorder.isTypeSupported
      && MediaRecorder.isTypeSupported(m));
  }

  /* Kamera steht fest auf Slide k – kein Schwenk. */
  function kameraAuf(k) {
    const { H, slideW, slideH } = SS.canvasSize();
    const blick = { cx: (k + 0.5) * slideW, cy: H / 2, vw: slideW, vh: slideH };
    return () => blick;
  }

  /* Eine ruhige Slide als Foto – genau derselbe Weg wie im Bild-Export. */
  async function slideFoto(k, scale) {
    const { W, H, slideW, slideH } = SS.canvasSize();
    const cv = SS.makeCanvas(slideW * scale, slideH * scale);
    const c = cv.getContext('2d');
    c.scale(scale, scale);
    c.translate(-k * slideW, 0);
    SS._noAnim = true;
    try { SS.paintScene(c, W, H, { forExport: true }); } finally { SS._noAnim = false; }
    const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.95));
    SS.freeCanvas(cv);
    return blob;
  }
  SV.slideFoto = slideFoto;

  /* ================================================================
     3. Die Aufnahme
     ================================================================ */

  SV.aufnehmen = async function (o, fortschritt) {
    const opt = Object.assign({
      fps: V.opts.fps || 30,
      quality: V.opts.quality || 1,
      ton: true,
    }, o || {});

    const cl = SS.clip;
    const dauerVoll = cl && cl.ready
      ? Math.max(1, (cl.end || cl.dur) - (cl.start || 0))
      : laengsterClip() || V.opts.dur;
    let dur = Math.max(1, Math.min(30, opt.dur || +dauerVoll.toFixed(2)));
    /* Steht der Regler nahe an der schleifenfesten Periode (weiche Schleife),
       wird exakt sie genommen – nur dann zeigt das Videoende wieder das Bild
       vom Anfang. */
    if (SS.schleife && SS.schleife.aktiv && SS.schleife.periode) {
      const P = SS.schleife.periode();
      if (P >= 1 && P <= 30 && Math.abs(dur - P) < 0.6) dur = P;
    }

    const { n, slideW, slideH } = SS.canvasSize();
    const slides = (opt.nurSlides && opt.nurSlides.length)
      ? opt.nurSlides.slice() : Array.from({ length: n }, (_, i) => i);
    if (!window.MediaRecorder) throw new Error('Dieses Gerät kann keine Videos aufnehmen');

    const q = opt.quality;
    const outW = Math.round(slideW * q / 2) * 2;
    const outH = Math.round(slideH * q / 2) * 2;
    const out = document.createElement('canvas');
    out.width = outW; out.height = outH;
    const oc = out.getContext('2d');

    await SS.wakeOn();
    SV.laeuft = true;
    V.prepare();
    const ergebnis = [];
    try {
      for (let i = 0; i < slides.length; i++) {
        const k = slides[i];
        await hintergrundAufAnfang();
        await clipsAufAnfang();
        const cam = kameraAuf(k);
        SV.sicht = [k * slideW - 8, (k + 1) * slideW + 8];

        /* captureStream(0) statt fester Rate: bei fester Rate nimmt der
           Browser ab, wann er mag, und lässt aus, was er nicht schafft
           (gemessen 38 gezeichnet / 20 im Video). Mit Rate 0 kommt genau
           dann ein Bild an, wenn wir requestFrame() rufen: 43 / 44. */
        let stream = out.captureStream(0);
        let spur = stream.getVideoTracks()[0];
        let takt = () => {};
        if (spur && typeof spur.requestFrame === 'function') takt = () => spur.requestFrame();
        else { stream = out.captureStream(opt.fps); spur = stream.getVideoTracks()[0]; }

        const klaenge = opt.ton ? tonClips(k) : [];
        const ton = klaenge.length ? tonAnhaengen(stream, klaenge) : null;
        const mime = mimeWaehlen(!!ton);
        if (!mime) throw new Error('Dieses Gerät kann keine Videos aufnehmen');
        const ext = mime.indexOf('mp4') >= 0 ? 'mp4' : 'webm';

        const rec = new MediaRecorder(stream, {
          mimeType: mime, videoBitsPerSecond: q > 1 ? 16000000 : 9000000,
        });
        const stuecke = [];
        rec.ondataavailable = (e) => { if (e.data && e.data.size) stuecke.push(e.data); };
        const gestoppt = new Promise(r => { rec.onstop = r; });

        /* Warmlaufen: die ersten Bilder nach einem Sprung im Video dauern
           lange (Dekoder). Ohne Vorlauf ruckelt die erste halbe Sekunde. */
        SS.animT = 0;
        SV.laeuft = false;      // Clips stehen währenddessen auf ihrem ersten Bild
        const warmBis = performance.now() + (i === 0 ? 700 : 300);
        while (performance.now() < warmBis) {
          V.drawFrame(oc, outW, outH, 0, cam);
          await new Promise(r => requestAnimationFrame(r));
        }

        /* Erst jetzt laufen lassen: sonst wäre der Clip beim ersten
           aufgenommenen Bild schon eine halbe Sekunde weiter, und beim
           Wischen zeigte jede Slide einen anderen Anfang. */
        SV.laeuft = true;
        rec.start(200);
        if (cl && cl.ready) await SS.clipStartPlayback();
        const VL = SS.videoLeinwand;
        if (VL && VL.modus === 'zeit' && VL.nurLaufen) {
          VL.nurLaufen(new Set([(k - 1 + n) % n, k, (k + 1) % n]));
        }

        let gemalt = 0;
        const t0 = performance.now();
        await new Promise((fertig) => {
          const bild = (jetzt) => {
            const t = Math.min(dur, (jetzt - t0) / 1000);
            SS.animT = t;
            V.drawFrame(oc, outW, outH, t, cam);
            takt();
            gemalt++;
            if (fortschritt) fortschritt(Math.round((i + t / dur) / slides.length * 96));
            if (t < dur) requestAnimationFrame(bild); else fertig();
          };
          requestAnimationFrame(bild);
        });

        /* Nachlauf: ohne ihn fehlt am Ende jeder Slide eine Viertelsekunde. */
        await new Promise(r => setTimeout(r, 260));
        rec.stop();
        if (cl && cl.ready) SS.clipStopPlayback();
        await gestoppt;
        if (ton) ton.loesen();
        try { spur.stop(); } catch (e) {}
        ergebnis.push({
          blob: new Blob(stuecke, { type: mime }), ext, slide: k + 1,
          bildrate: +(gemalt / dur).toFixed(1), ton: !!ton,
        });
      }
    } finally {
      SV.laeuft = false;
      SV.sicht = null;
      V.release();
      if (SS.stopVideoEls) SS.stopVideoEls();
      if (SS.livePlayClips) SS.livePlayClips(true);
      SS.wakeOff();
      SS.requestRender && SS.requestRender();
    }
    if (fortschritt) fortschritt(100);
    return ergebnis;
  };

  function laengsterClip() {
    let m = 0;
    for (const el of SS.state.elements) {
      if (el.type !== 'video' || el.hidden) continue;
      m = Math.max(m, (el.tIn || 0) + (SS.clipLen ? SS.clipLen(el) : 4));
    }
    return m ? Math.min(20, Math.round(m * 2) / 2) : 0;
  }
  SV.vorschlagDauer = function () {
    const cl = SS.clip;
    if (cl && cl.ready) {
      const roh = (SS.schleife && SS.schleife.aktiv && SS.schleife.periode)
        ? SS.schleife.periode() : (cl.end || cl.dur) - (cl.start || 0);
      return Math.max(2, Math.min(20, Math.round(roh * 2) / 2));
    }
    return Math.max(2, laengsterClip() || 6);
  };

  /* Der alte Knopf im Video-Bereich benutzt ab jetzt denselben Weg –
     damit laufen auch dort die Leinwand-Clips wirklich mit. */
  V.karussellVideos = SV.aufnehmen;

  /* ================================================================
     4. Neue Art im Export-Dialog
     ================================================================ */

  const sel = $('expType');
  if (!sel) return;
  if (![...sel.options].some(o => o.value === 'vidslides')) {
    const o = document.createElement('option');
    o.value = 'vidslides';
    o.textContent = 'Video je Slide (Karussell aus Videos)';
    sel.appendChild(o);
  }

  const box = document.createElement('div');
  box.id = 'expSlideVidOpts';
  box.className = 'hidden';
  box.innerHTML =
    '<div class="ctl"><span>Länge je Slide</span>' +
      '<input type="range" id="svDur" min="2" max="20" step="0.5" value="6">' +
      '<span class="val" id="svDurL">6 s</span></div>' +
    '<div class="ctl"><span>Ruhige Slides als Foto</span>' +
      '<input type="checkbox" id="svFoto" checked></div>' +
    '<div class="ctl"><span>Ton der Clips mitnehmen</span>' +
      '<input type="checkbox" id="svTon" checked></div>' +
    '<p class="hint" id="svInfo"></p>' +
    '<p class="hint">Jede Slide wird einzeln und von vorn aufgenommen – so passt beim ' +
    'Wischen die erste Sekunde jeder Slide zusammen. Aufgenommen wird in Echtzeit: ' +
    'Länge × Slides. In Instagram alle Dateien in EINEN Beitrag laden, in der ' +
    'Reihenfolge der Nummern.</p>';
  const vidOpts = $('expVidOpts');
  vidOpts.parentNode.insertBefore(box, vidOpts.nextSibling);

  const svDur = $('svDur'), svDurL = $('svDurL'), svInfo = $('svInfo');
  svDur.addEventListener('input', () => { svDurL.textContent = svDur.value + ' s'; infoSchreiben(); });
  $('svFoto').addEventListener('change', infoSchreiben);
  $('svTon').addEventListener('change', infoSchreiben);

  function infoSchreiben() {
    const { n } = SS.canvasSize();
    const dur = +svDur.value;
    const alsFoto = $('svFoto').checked;
    let filme = 0, fotos = 0, mitTon = 0;
    for (let k = 0; k < n; k++) {
      if (alsFoto && !slideBewegt(k)) { fotos++; continue; }
      filme++;
      if ($('svTon').checked && tonClips(k).length) mitTon++;
    }
    const zeit = Math.round(filme * (dur + 1.4));
    const teile = [`${filme} Video${filme === 1 ? '' : 's'}` + (fotos ? ` · ${fotos} Foto${fotos === 1 ? '' : 's'}` : '')];
    teile.push(`Aufnahme etwa ${zeit < 60 ? zeit + ' s' : Math.round(zeit / 60) + ' min'} in Echtzeit`);
    if (mitTon) teile.push(`${mitTon}× mit Ton`);
    if (!filme) teile.push('Nichts bewegt sich – es kämen nur Fotos heraus');
    svInfo.textContent = teile.join(' · ');
  }

  function reihenSetzen() {
    const ist = sel.value === 'vidslides';
    box.classList.toggle('hidden', !ist);
    if (ist) {
      $('expImgOpts').classList.add('hidden');
      $('expVidOpts').classList.add('hidden');
      $('expShare').textContent = 'Slide-Videos teilen';
      svDur.value = String(SV.vorschlagDauer());
      svDurL.textContent = svDur.value + ' s';
      infoSchreiben();
    } else if ($('expShare').textContent === 'Slide-Videos teilen') {
      $('expShare').textContent = sel.value === 'video' ? 'Video teilen → Instagram' : 'Teilen → Instagram';
    }
  }
  sel.addEventListener('change', reihenSetzen);
  $('btnExport').addEventListener('click', () => setTimeout(reihenSetzen, 0));

  /* ---------------------------------------------------------------- Bauen */

  function setProg(p) {
    const bar = $('expProgress');
    bar.classList.remove('hidden');
    bar.firstElementChild.style.width = p + '%';
  }

  async function teileBauen() {
    const scale = Math.min(2, +$('expScale').value || 1);
    const dur = +svDur.value;
    const alsFoto = $('svFoto').checked;
    const mitTon = $('svTon').checked;
    const { n } = SS.canvasSize();

    const filmSlides = [], fotoSlides = [];
    for (let k = 0; k < n; k++) {
      if (alsFoto && !slideBewegt(k)) fotoSlides.push(k); else filmSlides.push(k);
    }

    const teile = [];
    if (filmSlides.length) {
      const videos = await SV.aufnehmen(
        { dur, quality: scale, ton: mitTon, nurSlides: filmSlides },
        p => setProg(Math.round(p * 0.88)));
      videos.forEach(v => teile.push(v));
    }
    for (let i = 0; i < fotoSlides.length; i++) {
      const k = fotoSlides[i];
      teile.push({ blob: await slideFoto(k, scale), ext: 'jpg', slide: k + 1, foto: true });
      setProg(88 + Math.round((i + 1) / fotoSlides.length * 6));
    }
    teile.sort((a, b) => a.slide - b.slide);
    return teile;
  }

  function name(t) { return `Slide_${String(t.slide).padStart(2, '0')}.${t.ext}`; }

  function hinweisText(teile, dur) {
    const raten = teile.filter(t => !t.foto).map(t => t.bildrate || 0);
    const rate = raten.length ? Math.min(...raten) : 0;
    return 'Karussell aus Videos – eine Datei je Slide.\r\n\r\n' +
      'In Instagram alle Dateien in EINEN Beitrag laden, in der Reihenfolge der Nummern.\r\n' +
      'Beim Hochladen nicht zuschneiden lassen – sonst verrutschen die Nähte.\r\n' +
      'Fotos und Videos dürfen in einem Karussell gemischt sein.\r\n\r\n' +
      `Länge je Video: ${dur} s\r\n` +
      (rate ? `Bildrate: ${rate.toFixed(0)} Bilder je Sekunde (in Echtzeit aufgenommen)\r\n` : '') +
      teile.map(t => name(t) + (t.foto ? '  (Foto, nichts bewegt sich)' : t.ton ? '  (Video mit Ton)' : '  (Video)')).join('\r\n') + '\r\n';
  }

  async function alsZip(teile, dur) {
    const zip = new JSZip();
    const ordner = zip.folder('Seamless_Karussell_Video');
    teile.forEach(t => ordner.file(name(t), t.blob));
    if (typeof SS.beitragstext === 'function') {
      try { ordner.file('Beitrag.txt', SS.beitragstext()); } catch (e) {}
    }
    ordner.file('Hinweis.txt', hinweisText(teile, dur));
    return zip.generateAsync({ type: 'blob' });
  }

  function laden(blob, dateiname) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = dateiname;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 9000);
  }

  function fertigMelden(teile) {
    const filme = teile.filter(t => !t.foto);
    const raten = filme.map(t => t.bildrate || 0);
    const rate = raten.length ? Math.min(...raten) : 0;
    const fotos = teile.length - filme.length;
    SS.toast(
      `${filme.length} Slide-Video${filme.length === 1 ? '' : 's'}`
      + (fotos ? ` und ${fotos} Foto${fotos === 1 ? '' : 's'}` : '') + ' gespeichert'
      + (rate ? ` · ${rate.toFixed(0)} Bilder je Sekunde` : '')
      + (rate && rate < 18 ? ' – für mehr: kürzere Länge oder weniger Slides' : ''),
      rate && rate < 18 ? 6000 : 3600, 'ok');
  }

  /* Den Herunterladen-Knopf übernehmen – für alle anderen Arten läuft der
     bisherige Weg unverändert weiter. */
  const go = $('expGo');
  const altGo = go.onclick;
  go.onclick = function (ev) {
    if (sel.value !== 'vidslides') return altGo ? altGo.call(this, ev) : undefined;
    if (ev && ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    return los(false);
  };

  const share = $('expShare');
  const altShare = share.onclick;
  share.onclick = function (ev) {
    if (sel.value !== 'vidslides') return altShare ? altShare.call(this, ev) : undefined;
    if (ev && ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    return los(true);
  };

  let laeuftGerade = false;
  async function los(teilen) {
    if (laeuftGerade) return;
    const { n } = SS.canvasSize();
    if (n < 2) { SS.toast('Nur eine Slide – stell oben mehr Slides ein.', 4000, 'warn'); return; }
    laeuftGerade = true;
    go.disabled = true; share.disabled = true;
    setProg(2);
    try {
      const dur = +svDur.value;
      const teile = await teileBauen();
      if (!teile.length) throw new Error('Keine Slides');
      if (teilen && SS.shareFiles) {
        const dateien = teile.map(t => new File([t.blob], name(t), { type: t.blob.type }));
        const r = await SS.shareFiles(dateien, 'Seamless Studio');
        if (r === 'shared') SS.toast('In der Auswahl Instagram wählen → Beitrag', 4400, 'ok');
        else fertigMelden(teile);
      } else {
        setProg(96);
        laden(await alsZip(teile, dur), 'Seamless_Karussell_Video.zip');
        fertigMelden(teile);
        SS.buzz && SS.buzz(16);
      }
      $('exportDlg').classList.add('hidden');
    } catch (e) {
      SS.toast('Aufnahme fehlgeschlagen: ' + e.message, 4600, 'err');
    } finally {
      laeuftGerade = false;
      go.disabled = false; share.disabled = false;
      $('expProgress').classList.add('hidden');
      setProg(0);
    }
  }

  SS.VIDEOSLIDES77 = { bereit: true };
})();
