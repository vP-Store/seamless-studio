/* Seamless Studio – Video-Studio
   Kamera-Stile, Vorschau-Player und Video-Export (Bild + Ton).

   Die Kamera liefert für jeden Zeitpunkt einen Bildausschnitt {cx, cy, vw, vh}
   in Leinwand-Koordinaten. Alles andere – Vorschau wie Export – benutzt
   exakt dieselbe Funktion, damit die Vorschau nicht lügt. */

SS.video = {};
(function () {
  const V = SS.video;
  const $ = SS.el;

  V.opts = {
    style: 'pan',      // pan | spotlight | kombi | kenburns | still
    dur: 8,
    out: 'auto',       // auto | 9:16 | 1:1 | 4:5 | 16:9
    fps: 30,
    zoom: 150,         // Spotlight-Nähe in % (100 = knapp, 200 = weit)
    quality: 1,        // 1 = 1080, 2 = 2K
    speed: 1,          // Tempo der Kamerafahrt
    curve: 'soft',     // soft | linear | swing
    mute: false,
  };

  V.STYLES = [
    { id: 'pan',       name: 'Kamerafahrt',    desc: 'Fährt sanft über das ganze Panorama' },
    { id: 'spotlight', name: 'Foto-Spotlight', desc: 'Zoomt Foto für Foto, folgt auch dem Höhenversatz' },
    { id: 'kombi',     name: 'Kombi',          desc: 'Überblick → jedes Foto → Überblick' },
    { id: 'kenburns',  name: 'Ken Burns',      desc: 'Langsames Hineinzoomen auf das Gesamtbild' },
    { id: 'still',     name: 'Standbild',      desc: 'Kamera steht still – nur die Elemente bewegen sich' },
  ];

  const OUT_SIZES = {
    '9:16': [1080, 1920], '1:1': [1080, 1080], '4:5': [1080, 1350], '16:9': [1920, 1080],
  };

  V.outSize = function () {
    if (V.opts.out !== 'auto' && OUT_SIZES[V.opts.out]) return OUT_SIZES[V.opts.out].slice();
    const { slideW, slideH } = SS.canvasSize();
    return [slideW, slideH];
  };

  /* ================================================================
     Kamera
     ================================================================ */
  const EASE = {
    soft: (x) => x * x * x * (x * (x * 6 - 15) + 10),          // smootherstep
    linear: (x) => x,
    swing: (x) => x < 0.5
      ? 4 * x * x * x
      : 1 - Math.pow(-2 * x + 2, 2.4) / 2,                      // kräftiger Schwung
  };
  const smooth = (x) => (EASE[V.opts.curve] || EASE.soft)(x);

  function clampView(cx, cy, vw, vh, W, H) {
    const x = vw >= W ? W / 2 : SS.clamp(cx, vw / 2, W - vw / 2);
    const y = vh >= H ? H / 2 : SS.clamp(cy, vh / 2, H - vh / 2);
    return [x, y];
  }

  function fitView(W, H, ar) {
    // größtmöglicher Ausschnitt mit Seitenverhältnis ar, der ganz hineinpasst
    let vw = H * ar, vh = H;
    if (vw > W) { vw = W; vh = W / ar; }
    return [vw, vh];
  }

  function photoTargets() {
    return SS.state.elements
      .filter(e => e.type === 'photo')
      .map(e => { const s = SS.elSize(e); return { x: e.x, y: e.y, w: s.w, h: s.h }; })
      .sort((a, b) => a.x - b.x);
  }

  /* Baut die Keyframe-Liste. Rückgabe: Funktion (tSekunden) → {cx,cy,vw,vh} */
  V.buildCamera = function (style, dur, ar) {
    const { W, H } = SS.canvasSize();
    const [fitW, fitH] = fitView(W, H, ar);
    const keys = [];
    const push = (t, cx, cy, vw) => {
      const vh = vw / ar;
      const [x, y] = clampView(cx, cy, vw, vh, W, H);
      keys.push({ t, cx: x, cy: y, vw, vh });
    };

    const photos = photoTargets();
    const near = SS.clamp(V.opts.zoom, 100, 260) / 100;

    if (style === 'still') {
      push(0, W / 2, H / 2, fitW);
      push(dur, W / 2, H / 2, fitW);
    } else if (style === 'kenburns') {
      push(0, W / 2, H / 2, fitW);
      push(dur, W / 2 + fitW * 0.03, H / 2 - fitH * 0.02, fitW * 0.86);
    } else if (style === 'pan' || (style === 'kombi' && photos.length < 2)) {
      const vw = Math.min(H * ar, W);
      if (vw >= W - 2) {                       // nichts zu fahren → Ken Burns
        push(0, W / 2, H / 2, fitW);
        push(dur, W / 2, H / 2, fitW * 0.88);
      } else {
        const hold = dur * 0.08;
        push(0, vw / 2, H / 2, vw);
        push(hold, vw / 2, H / 2, vw);
        push(dur - hold, W - vw / 2, H / 2, vw);
        push(dur, W - vw / 2, H / 2, vw);
      }
    } else if (style === 'spotlight') {
      if (!photos.length) return V.buildCamera('kenburns', dur, ar);
      const seg = dur / photos.length;
      photos.forEach((p, i) => {
        const vw = SS.clamp(Math.max(p.w, p.h * ar) * near, 200, W);
        const t0 = i * seg;
        push(t0 + (i === 0 ? 0 : seg * 0.30), p.x, p.y, vw);          // angekommen
        push(t0 + seg * (i === photos.length - 1 ? 1 : 0.92), p.x + vw * 0.02, p.y, vw * 0.93); // Ken Burns im Halt
      });
      keys[0].t = 0;
      keys[keys.length - 1].t = dur;
    } else if (style === 'kombi') {
      const n = photos.length;
      const intro = dur * 0.18, outro = dur * 0.18;
      const body = dur - intro - outro;
      const seg = body / n;
      push(0, W / 2, H / 2, fitW);
      push(intro * 0.55, W / 2, H / 2, fitW);
      photos.forEach((p, i) => {
        const vw = SS.clamp(Math.max(p.w, p.h * ar) * near, 200, W);
        const t0 = intro + i * seg;
        push(t0 + seg * 0.32, p.x, p.y, vw);
        push(t0 + seg * 0.94, p.x + vw * 0.02, p.y, vw * 0.94);
      });
      push(dur - outro * 0.35, W / 2, H / 2, fitW);
      push(dur, W / 2, H / 2, fitW * 0.97);
    } else {
      push(0, W / 2, H / 2, fitW);
      push(dur, W / 2, H / 2, fitW);
    }

    keys.sort((a, b) => a.t - b.t);
    return function (tRaw) {
      const t = SS.clamp(tRaw * (V.opts.speed || 1), 0, dur);
      if (t <= keys[0].t) return keys[0];
      const last = keys[keys.length - 1];
      if (t >= last.t) return last;
      let i = 0;
      while (i < keys.length - 2 && keys[i + 1].t < t) i++;
      const a = keys[i], b = keys[i + 1];
      const span = Math.max(0.0001, b.t - a.t);
      const p = smooth(SS.clamp((t - a.t) / span, 0, 1));
      return {
        cx: a.cx + (b.cx - a.cx) * p,
        cy: a.cy + (b.cy - a.cy) * p,
        vw: a.vw + (b.vw - a.vw) * p,
        vh: a.vh + (b.vh - a.vh) * p,
      };
    };
  };

  /* ================================================================
     Szene vorbereiten: alles Unbewegte einmal in ein Bild backen
     ================================================================ */
  let _scene = null;

  V.prepare = function () {
    const { W, H } = SS.canvasSize();
    const animEls = SS.state.elements.filter(e => e.anim && e.anim !== 'none');
    const skip = new Set(animEls.map(e => e.id));
    const clip = !!(SS.clip && SS.clip.ready);
    // sehr breite Panoramen für das Video herunterrechnen (Speicher & Tempo)
    const s = Math.min(1, 12000 / Math.max(W, 1));
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.round(W * s));
    cv.height = Math.max(1, Math.round(H * s));
    const c = cv.getContext('2d');
    c.scale(s, s);
    SS.paintScene(c, W, H, { forExport: true, skip, noBg: clip });
    _scene = { cv, W, H, animEls, clip };
    return _scene;
  };

  V.release = function () { _scene = null; };

  /* Ein Videobild zeichnen. t = Sekunden, oc = Ziel-Kontext (outW × outH) */
  V.drawFrame = function (oc, outW, outH, t, cam) {
    const sc = _scene || V.prepare();
    const view = cam(t);
    oc.save();
    oc.setTransform(1, 0, 0, 1, 0, 0);
    oc.fillStyle = '#0d0b0a';
    oc.fillRect(0, 0, outW, outH);
    const k = outW / view.vw;
    oc.scale(k, k);
    oc.translate(-(view.cx - view.vw / 2), -(view.cy - view.vh / 2));
    if (sc.clip) SS.drawClipFrame(oc, sc.W, sc.H);
    oc.drawImage(sc.cv, 0, 0, sc.W, sc.H);
    for (const el of sc.animEls) SS.drawElement(oc, el);
    oc.restore();
  };

  /* ================================================================
     Vorschau-Player
     ================================================================ */
  const player = { playing: false, t: 0, raf: null, last: 0, cam: null, dur: 8 };
  V.player = player;

  function previewCanvas() { return $('vidPreview'); }

  function fitPreview() {
    const cv = previewCanvas();
    if (!cv) return null;
    const [ow, oh] = V.outSize();
    const box = cv.parentElement;
    const maxW = box.clientWidth || 300;
    const maxH = Math.min(360, window.innerHeight * 0.42);
    let w = maxW, h = w * oh / ow;
    if (h > maxH) { h = maxH; w = h * ow / oh; }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    cv.style.width = Math.round(w) + 'px'; cv.style.height = Math.round(h) + 'px';
    return cv;
  }
  V.fitPreview = fitPreview;

  V.refresh = function (keepTime) {
    const cv = fitPreview();
    if (!cv) return;
    V.prepare();
    player.dur = V.opts.dur;
    const [ow, oh] = V.outSize();
    player.cam = V.buildCamera(V.opts.style, player.dur, ow / oh);
    if (!keepTime) player.t = 0;
    drawPreview();
    syncSeek();
  };

  function drawPreview() {
    const cv = previewCanvas();
    if (!cv || !player.cam) return;
    const oc = cv.getContext('2d');
    SS.animT = player.t;
    V.drawFrame(oc, cv.width, cv.height, player.t, player.cam);
  }
  V.drawPreview = drawPreview;

  function syncSeek() {
    const s = $('vidSeek');
    if (s) s.value = String(Math.round(player.t / player.dur * 1000));
    const l = $('vidTime');
    if (l) l.textContent = player.t.toFixed(1) + ' / ' + player.dur.toFixed(1) + ' s';
  }

  V.play = async function () {
    if (player.playing) return V.pause();
    if (!player.cam) V.refresh(true);
    if (player.t >= player.dur - 0.02) player.t = 0;
    player.playing = true;
    $('vidPlay').textContent = '⏸ Pause';
    if (SS.clip && SS.clip.ready) await SS.clipStartPlayback();
    if (!V.opts.mute) { try { await SS.audio.playPreview(player.dur, player.t); } catch (e) {} }
    player.last = performance.now();
    const step = (now) => {
      if (!player.playing) return;
      const dt = Math.min(0.1, (now - player.last) / 1000);
      player.last = now;
      player.t += dt;
      if (player.t >= player.dur) { player.t = player.dur; V.pause(); drawPreview(); syncSeek(); return; }
      drawPreview(); syncSeek();
      player.raf = requestAnimationFrame(step);
    };
    player.raf = requestAnimationFrame(step);
  };

  V.pause = function () {
    player.playing = false;
    if (player.raf) cancelAnimationFrame(player.raf);
    player.raf = null;
    SS.audio.stopPreview();
    if (SS.clip && SS.clip.ready) SS.clipStopPlayback();
    const b = $('vidPlay');
    if (b) b.textContent = '▶ Abspielen';
  };

  /* ================================================================
     Export
     ================================================================ */
  V.exportVideo = async function (onProgress) {
    const dur = V.opts.dur;
    const [baseW, baseH] = V.outSize();
    const q = V.opts.quality;
    const outW = Math.round(baseW * q / 2) * 2, outH = Math.round(baseH * q / 2) * 2;
    const cam = V.buildCamera(V.opts.style, dur, baseW / baseH);
    V.prepare();

    const out = document.createElement('canvas');
    out.width = outW; out.height = outH;
    const oc = out.getContext('2d');

    if (!window.MediaRecorder) throw new Error('Video wird auf diesem Gerät nicht unterstützt');
    const stream = out.captureStream(V.opts.fps);

    // Ton dazumischen (wenn möglich)
    let audio = null, audioSeparate = null;
    if (!V.opts.mute) { try { audio = await SS.audio.streamFor(dur); } catch (e) { audio = null; } }
    if (audio) {
      try {
        audio.stream.getAudioTracks().forEach(tr => stream.addTrack(tr));
      } catch (e) {
        audioSeparate = audio.buffer;   // Fallback: Tonspur getrennt liefern
        audio = null;
      }
    }

    const withAudio = !!audio;
    const cands = withAudio
      ? ['video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
      : ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
    const mime = cands.find(m => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m));
    if (!mime) throw new Error('Video wird auf diesem Gerät nicht unterstützt');

    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: q > 1 ? 16000000 : 9000000 });
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    const stopped = new Promise(r => { rec.onstop = r; });

    await SS.wakeOn();
    // Clip von vorn starten
    if (SS.clip && SS.clip.ready) await SS.clipStartPlayback();

    rec.start(200);
    if (audio) { try { audio.start(); } catch (e) {} }

    const t0 = performance.now();
    await new Promise((resolve) => {
      function frame(now) {
        const t = Math.min(dur, (now - t0) / 1000);
        SS.animT = t;
        V.drawFrame(oc, outW, outH, t, cam);
        if (onProgress) onProgress(Math.round(t / dur * 92));
        if (t < dur) requestAnimationFrame(frame);
        else resolve();
      }
      requestAnimationFrame(frame);
    });

    rec.stop();
    if (audio) audio.stop();
    if (SS.clip && SS.clip.ready) SS.clipStopPlayback();
    await stopped;
    SS.wakeOff();
    if (onProgress) onProgress(100);
    V.release();

    const ext = mime.indexOf('mp4') >= 0 ? 'mp4' : 'webm';
    return {
      blob: new Blob(chunks, { type: mime }),
      ext,
      hasAudio: withAudio,
      audioBlob: audioSeparate ? SS.audio.bufferToWav(audioSeparate) : null,
    };
  };
})();

/* ================================================================
   Bedienoberfläche des Video-Tabs
   ================================================================ */
(function () {
  const V = SS.video;
  const $ = SS.el;
  const A = SS.audio;

  /* ---- Kamera-Stile ---- */
  function renderStyles() {
    const box = $('vidStyles');
    box.innerHTML = '';
    V.STYLES.forEach(s => {
      const b = document.createElement('button');
      b.textContent = s.name;
      b.title = s.desc;
      if (s.id === V.opts.style) b.classList.add('sel');
      b.onclick = () => {
        V.opts.style = s.id;
        renderStyles();
        $('vidStyleDesc').textContent = s.desc;
        $('vidZoomRow').classList.toggle('hidden', s.id !== 'spotlight' && s.id !== 'kombi');
        V.refresh(false);
      };
      box.appendChild(b);
    });
    const cur = V.STYLES.find(s => s.id === V.opts.style);
    $('vidStyleDesc').textContent = cur ? cur.desc : '';
    $('vidZoomRow').classList.toggle('hidden', V.opts.style !== 'spotlight' && V.opts.style !== 'kombi');
  }

  /* ---- Sound-Kacheln ---- */
  function renderSounds() {
    const box = $('vidSounds');
    box.innerHTML = '';
    A.SOUNDS.forEach(s => {
      const b = document.createElement('button');
      b.className = 'swatch snd' + (A.state.soundId === s.id ? ' sel' : '');
      b.innerHTML = `<span class="snd-ico">${s.icon}</span><label>${s.name}</label>`;
      b.onclick = () => {
        if (s.id === 'custom' && !A.state.custom) { SS.toast('Lade zuerst eine eigene Datei', 2400, 'warn'); return; }
        A.state.soundId = s.id;
        renderSounds();
        SS.toast(s.id === 'none' ? 'Ton aus' : s.name);
      };
      box.appendChild(b);
    });
  }

  /* ---- Transport ---- */
  $('vidPlay').onclick = () => V.play();
  $('vidSeek').addEventListener('input', () => {
    V.pause();
    V.player.t = (+$('vidSeek').value / 1000) * V.player.dur;
    if (SS.clip && SS.clip.ready) SS.clipSeek(V.player.t / V.player.dur);
    V.drawPreview();
    $('vidTime').textContent = V.player.t.toFixed(1) + ' / ' + V.player.dur.toFixed(1) + ' s';
  });

  /* ---- Einstellungen ---- */
  $('vidDur').addEventListener('input', () => {
    V.opts.dur = +$('vidDur').value;
    $('vidDurL').textContent = V.opts.dur + ' s';
  });
  $('vidDur').addEventListener('change', () => V.refresh(false));
  $('vidZoom').addEventListener('input', () => { V.opts.zoom = +$('vidZoom').value; });
  $('vidZoom').addEventListener('change', () => V.refresh(true));
  $('vidOut').addEventListener('change', () => { V.opts.out = $('vidOut').value; V.refresh(true); });
  $('vidQual').addEventListener('change', () => { V.opts.quality = +$('vidQual').value; });
  $('vidSpeed').addEventListener('input', () => {
    V.opts.speed = +$('vidSpeed').value / 100;
    $('vidSpeedL').textContent = V.opts.speed.toFixed(1).replace('.', ',') + '×';
  });
  $('vidSpeed').addEventListener('change', () => V.refresh(true));
  $('vidCurve').addEventListener('change', () => { V.opts.curve = $('vidCurve').value; V.refresh(true); });
  $('vidMute').addEventListener('change', () => {
    V.opts.mute = $('vidMute').checked;
    if (V.opts.mute) SS.audio.stopPreview();
  });
  $('vidMusicVol').addEventListener('input', () => { A.state.musicVol = +$('vidMusicVol').value / 100; });
  $('vidVoiceVol').addEventListener('input', () => { A.state.voiceVol = +$('vidVoiceVol').value / 100; });

  $('vidMusicFile').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      await A.loadCustom(f);
      renderSounds();
      SS.toast('Eigene Musik geladen', 2400, 'ok');
    } catch (err) { SS.toast('Diese Audiodatei konnte nicht gelesen werden'); }
    e.target.value = '';
  });

  /* ---- Voiceover ---- */
  const recBtn = $('vidRec');
  recBtn.onclick = async () => {
    if (A.isRecording()) {
      try {
        const v = await A.stopRecording();
        recBtn.textContent = '● Aufnahme starten';
        recBtn.classList.remove('recording');
        $('vidRecState').textContent = `Aufnahme gespeichert – ${v.dur.toFixed(1)} Sekunden.`;
        const au = $('vidVoicePlay');
        au.src = v.url; au.classList.remove('hidden');
        $('vidVoiceDel').classList.remove('hidden');
        SS.toast('Voiceover aufgenommen', 2400, 'ok');
      } catch (err) {
        recBtn.textContent = '● Aufnahme starten';
        recBtn.classList.remove('recording');
        SS.toast('Aufnahme fehlgeschlagen: ' + err.message);
      }
      return;
    }
    try {
      V.pause();
      await A.startRecording((t) => { $('vidRecState').textContent = '● Nimmt auf … ' + t.toFixed(1) + ' s'; });
      recBtn.textContent = '⏹ Aufnahme beenden';
      recBtn.classList.add('recording');
    } catch (err) {
      $('vidRecState').textContent = 'Kein Mikrofonzugriff. Bitte in den Browser-Einstellungen erlauben.';
      SS.toast('Mikrofon nicht verfügbar: ' + err.message);
    }
  };
  $('vidVoiceDel').onclick = () => {
    A.clearVoice();
    $('vidVoicePlay').classList.add('hidden');
    $('vidVoiceDel').classList.add('hidden');
    $('vidRecState').textContent = 'Noch keine Aufnahme.';
  };

  /* ---- Clip laden & trimmen ---- */
  function syncClipUI() {
    const cl = SS.clip;
    $('vidClipBox').classList.toggle('hidden', !cl);
    if (!cl) return;
    $('vidClipName').textContent = `${cl.name} · ${cl.dur.toFixed(1)} s · ${cl.w}×${cl.h}`;
    $('vidClipTrim').textContent =
      `Ausschnitt: ${cl.start.toFixed(1)} s – ${cl.end.toFixed(1)} s (${(cl.end - cl.start).toFixed(1)} s)`;
  }

  $('vidClipFile').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    /* Erst fragen, wohin – bisher wurde hier ungefragt der Hintergrund ersetzt
       und dabei das Panorama auf eine Slide zusammengeklappt. */
    if (SS.videoZiel) {
      const ziel = await SS.videoZiel(f);
      if (!ziel) return;
      if (ziel === 'leinwand') {
        try {
          await SS.addClipDatei(f);
          const t = document.querySelector('#toolbar .tool[data-panel="photos"]'); if (t) t.click();
        } catch (err) { SS.toast('Clip konnte nicht gelesen werden', 3400, 'err'); }
        return;
      }
    }
    try {
      const cl = await SS.loadClip(f);
      cl.datei = f;
      $('vidClipStart').value = '0';
      $('vidClipEnd').value = '1000';
      V.opts.style = 'still';
      V.opts.dur = Math.max(3, Math.min(30, Math.round(cl.dur)));
      $('vidDur').value = String(V.opts.dur);
      $('vidDurL').textContent = V.opts.dur + ' s';
      renderStyles();
      syncClipUI();
      V.refresh(false);
      SS.toast('Clip geladen – jetzt Text und Sticker darüber legen', 3200, 'ok');
    } catch (err) { SS.toast(err.message); }
  });

  function trim() {
    const cl = SS.clip;
    if (!cl) return;
    let a = +$('vidClipStart').value / 1000 * cl.dur;
    let b = +$('vidClipEnd').value / 1000 * cl.dur;
    if (b - a < 0.5) b = Math.min(cl.dur, a + 0.5);
    cl.start = a; cl.end = b;
    V.opts.dur = Math.max(1, Math.min(30, +(b - a).toFixed(1)));
    $('vidDur').value = String(Math.round(V.opts.dur));
    $('vidDurL').textContent = Math.round(V.opts.dur) + ' s';
    syncClipUI();
    SS.clipSeek(0);
    SS.requestRender();
    V.refresh(false);
  }
  $('vidClipStart').addEventListener('change', trim);
  $('vidClipEnd').addEventListener('change', trim);
  $('vidClipStart').addEventListener('input', () => {
    const cl = SS.clip; if (!cl) return;
    SS.clipSeek(0);
  });
  const zurLeinwand = $('vidClipToCanvas');
  if (zurLeinwand) zurLeinwand.onclick = async () => {
    V.pause();
    if (SS.hintergrundZuClip) await SS.hintergrundZuClip();
    syncClipUI();
    V.refresh(false);
  };
  $('vidClipDel').onclick = () => {
    V.pause();
    SS.clipClear();
    syncClipUI();
    V.refresh(false);
    SS.toast('Clip entfernt');
  };

  /* ---- Export ---- */
  $('vidExport').onclick = async () => {
    V.pause();
    const prog = $('vidProgress');
    const bar = prog.firstElementChild;
    prog.classList.remove('hidden');
    $('vidExport').disabled = true;
    try {
      const res = await V.exportVideo(p => { bar.style.width = p + '%'; });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(res.blob);
      a.download = 'Seamless_Video.' + res.ext;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 8000);
      if (res.audioBlob) {
        const b = document.createElement('a');
        b.href = URL.createObjectURL(res.audioBlob);
        b.download = 'Seamless_Ton.wav';
        b.click();
        setTimeout(() => URL.revokeObjectURL(b.href), 8000);
        SS.toast('Video und Tonspur getrennt gespeichert (dein Gerät kann Ton nicht direkt einbetten)', 5000);
      } else {
        SS.toast(res.hasAudio ? 'Video mit Ton exportiert' : 'Video exportiert', 2600, 'ok');
      }
    } catch (e) {
      SS.toast('Export fehlgeschlagen: ' + e.message, 4000);
    } finally {
      prog.classList.add('hidden');
      bar.style.width = '0%';
      $('vidExport').disabled = false;
    }
  };

  $('vidShare').onclick = async () => {
    V.pause();
    const prog = $('vidProgress');
    const bar = prog.firstElementChild;
    prog.classList.remove('hidden');
    $('vidShare').disabled = true;
    try {
      const res = await V.exportVideo(p => { bar.style.width = p + '%'; });
      const files = [new File([res.blob], 'Seamless_Video.' + res.ext, { type: res.blob.type })];
      if (res.audioBlob) files.push(new File([res.audioBlob], 'Seamless_Ton.wav', { type: 'audio/wav' }));
      const r = await SS.shareFiles(files, 'Seamless Studio');
      if (r === 'shared') SS.toast('In der Teilen-Auswahl Instagram wählen → Reel oder Story', 4200);
    } catch (e) {
      SS.toast('Teilen fehlgeschlagen: ' + e.message, 4000);
    } finally {
      prog.classList.add('hidden');
      bar.style.width = '0%';
      $('vidShare').disabled = false;
    }
  };

  /* ---- Tab-Wechsel ---- */
  document.querySelectorAll('#toolbar .tool').forEach(btn => {
    btn.addEventListener('click', () => {
      const isVid = btn.dataset.panel === 'video';
      $('sidepanel').classList.toggle('tall', isVid);
      if (isVid) setTimeout(() => V.refresh(false), 60);
      else V.pause();
    });
  });
  window.addEventListener('resize', () => { if ($('panel-video').classList.contains('active')) V.refresh(true); });

  renderStyles();
  renderSounds();
  syncClipUI();
})();
