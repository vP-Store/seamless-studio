/* Seamless Studio – Ton: Sound-Bibliothek (synthetisiert, lizenzfrei),
   Voiceover-Aufnahme (auch iPhone) und Abmischung für den Video-Export.

   Es werden keine Audiodateien mitgeliefert: alle Klänge entstehen live per
   Web-Audio-Synthese im Gerät. Damit bleibt die App klein, offline-fähig und
   vollständig frei von Lizenzfragen. */

SS.audio = {};
(function () {
  const A = SS.audio;

  A.state = {
    soundId: 'none',
    musicVol: 0.55,
    voiceVol: 1.0,
    fadeOut: true,
    voice: null,        // {buffer, dur, url}
    custom: null,       // {buffer, name}
  };

  /* ---------- Kontext ---------- */
  let _ctx = null;
  A.ctx = function () {
    if (!_ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      _ctx = new C();
    }
    if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
    return _ctx;
  };

  /* ---------- deterministischer Zufall (Vorschau = Export) ---------- */
  function rnd(seed) {
    let s = seed | 0;
    return function () {
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function noiseBuffer(ctx, seconds, seed) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    const r = rnd(seed);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = r() * 2 - 1;
      last = 0.86 * last + 0.14 * w;       // leicht geglättet = weniger zischend
      d[i] = last * 1.4;
    }
    return buf;
  }

  /* ================================================================
     Die Bibliothek
     ================================================================ */
  A.SOUNDS = [
    { id: 'none',   name: 'Kein Ton',        icon: '🔇' },
    { id: 'meer',   name: 'Meeresrauschen',  icon: '🌊', build: buildMeer },
    { id: 'wald',   name: 'Wald mit Vögeln', icon: '🌲', build: buildWald },
    { id: 'wind',   name: 'Leichter Wind',   icon: '🍃', build: buildWind },
    { id: 'regen',  name: 'Regen',           icon: '🌧', build: buildRegen },
    { id: 'ruhig',  name: 'Beruhigend',      icon: '🕊', build: buildRuhig },
    { id: 'froh',   name: 'Fröhlich',        icon: '☀️', build: buildFroh },
    { id: 'episch', name: 'Episch',          icon: '⛰', build: buildEpisch },
    { id: 'lulla',  name: 'Baby / Lullaby',  icon: '🌙', build: buildLullaby },
    { id: 'custom', name: 'Eigene MP3',      icon: '📁' },
  ];

  /* --- Naturklänge --------------------------------------------------- */
  function buildMeer(ctx, dur) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, dur, 11); src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 620; lp.Q.value = 0.6;
    const g = ctx.createGain();
    // Wellen: langsames An- und Abschwellen in zwei Geschwindigkeiten
    const t0 = 0;
    for (let t = 0; t < dur; t += 0.05) {
      const v = 0.30 + 0.24 * Math.sin(t * 0.62) + 0.10 * Math.sin(t * 0.23 + 1.1);
      g.gain.setValueAtTime(Math.max(0.05, v), t0 + t);
    }
    src.connect(lp); lp.connect(g);
    src.start(0);
    return g;
  }

  function buildWind(ctx, dur) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, dur, 23); src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 480; bp.Q.value = 0.8;
    const g = ctx.createGain();
    for (let t = 0; t < dur; t += 0.05) {
      bp.frequency.setValueAtTime(380 + 260 * (0.5 + 0.5 * Math.sin(t * 0.44 + 0.7)), t);
      g.gain.setValueAtTime(0.16 + 0.14 * (0.5 + 0.5 * Math.sin(t * 0.31)), t);
    }
    src.connect(bp); bp.connect(g);
    src.start(0);
    return g;
  }

  function buildRegen(ctx, dur) {
    const out = ctx.createGain(); out.gain.value = 0.9;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, dur, 37); src.loop = true;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1100;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6500;
    const g = ctx.createGain(); g.gain.value = 0.26;
    src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(out);
    src.start(0);
    // einzelne Tropfen
    const r = rnd(91);
    for (let t = 0.2; t < dur; t += 0.16 + r() * 0.5) {
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(900 + r() * 1600, t);
      o.frequency.exponentialRampToValueAtTime(300 + r() * 300, t + 0.09);
      const dg = ctx.createGain();
      dg.gain.setValueAtTime(0.0001, t);
      dg.gain.exponentialRampToValueAtTime(0.035 + r() * 0.03, t + 0.006);
      dg.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      o.connect(dg); dg.connect(out); o.start(t); o.stop(t + 0.16);
    }
    return out;
  }

  function buildWald(ctx, dur) {
    const out = ctx.createGain(); out.gain.value = 0.95;
    // Blätterrauschen
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, dur, 53); src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.5;
    const g = ctx.createGain();
    for (let t = 0; t < dur; t += 0.08) g.gain.setValueAtTime(0.08 + 0.06 * (0.5 + 0.5 * Math.sin(t * 0.5)), t);
    src.connect(bp); bp.connect(g); g.connect(out);
    src.start(0);
    // Vogelrufe: kleine Tonfolgen
    const r = rnd(7);
    for (let t = 0.6; t < dur - 0.4; t += 0.9 + r() * 2.2) {
      const notes = 2 + Math.floor(r() * 3);
      const base = 1900 + r() * 1500;
      for (let k = 0; k < notes; k++) {
        const st = t + k * (0.07 + r() * 0.06);
        const o = ctx.createOscillator(); o.type = 'sine';
        const f = base * (1 + (r() - 0.4) * 0.35);
        o.frequency.setValueAtTime(f, st);
        o.frequency.linearRampToValueAtTime(f * (1.1 + r() * 0.3), st + 0.05);
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.0001, st);
        ng.gain.exponentialRampToValueAtTime(0.06, st + 0.012);
        ng.gain.exponentialRampToValueAtTime(0.0001, st + 0.1);
        o.connect(ng); ng.connect(out); o.start(st); o.stop(st + 0.14);
      }
    }
    return out;
  }

  /* --- Musikalische Betten ------------------------------------------- */
  function pad(ctx, out, freq, start, dur, vol, type) {
    const o = ctx.createOscillator(); o.type = type || 'sine';
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + Math.min(1.6, dur * 0.3));
    g.gain.setValueAtTime(vol, start + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(out);
    o.start(start); o.stop(start + dur + 0.05);
  }

  function pluck(ctx, out, freq, start, vol, decay, type) {
    const o = ctx.createOscillator(); o.type = type || 'triangle';
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + (decay || 0.8));
    o.connect(g); g.connect(out);
    o.start(start); o.stop(start + (decay || 0.8) + 0.05);
  }

  const N = (semi) => 440 * Math.pow(2, semi / 12);

  function buildRuhig(ctx, dur) {
    const out = ctx.createGain(); out.gain.value = 0.5;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
    const bus = ctx.createGain(); bus.connect(lp); lp.connect(out);
    // F-Dur → C-Dur → d-moll → B-Dur, jeweils lang
    const chords = [[-16, -9, -4], [-21, -14, -9], [-19, -12, -7], [-23, -16, -11]];
    const len = 4.2;
    for (let i = 0, t = 0; t < dur; i++, t += len * 0.85) {
      const ch = chords[i % chords.length];
      ch.forEach((s, k) => pad(ctx, bus, N(s + 12), t, Math.min(len, dur - t), 0.075 - k * 0.012, 'sine'));
      pad(ctx, bus, N(ch[0]), t, Math.min(len, dur - t), 0.05, 'sine');
    }
    return out;
  }

  function buildFroh(ctx, dur) {
    const out = ctx.createGain(); out.gain.value = 0.42;
    const bus = ctx.createGain(); bus.connect(out);
    // C-Dur-Pentatonik, freundliches Arpeggio
    const scale = [0, 2, 4, 7, 9, 12, 14, 16];
    const r = rnd(19);
    const step = 0.24;
    let i = 0;
    for (let t = 0; t < dur; t += step, i++) {
      const s = scale[(i * 3 + Math.floor(r() * 2)) % scale.length];
      pluck(ctx, bus, N(s - 9), t, 0.09, 0.7, 'triangle');
      if (i % 4 === 0) pluck(ctx, bus, N(s - 21), t, 0.07, 1.4, 'sine');
    }
    for (let t = 0; t < dur; t += 3.2) pad(ctx, bus, N(-21), t, Math.min(3.2, dur - t), 0.05, 'sine');
    return out;
  }

  function buildEpisch(ctx, dur) {
    const out = ctx.createGain(); out.gain.value = 0.5;
    const bus = ctx.createGain(); bus.connect(out);
    // tiefe Quinte als Fundament, darüber langsam anschwellende Lagen
    pad(ctx, bus, N(-33), 0, dur, 0.12, 'sine');
    pad(ctx, bus, N(-26), 0, dur, 0.09, 'sine');
    const swell = 5.5;
    for (let i = 0, t = 0; t < dur; i++, t += swell) {
      const root = [-21, -19, -16, -14][i % 4];
      const d = Math.min(swell * 1.15, dur - t);
      pad(ctx, bus, N(root), t, d, 0.085, 'sawtooth');
      pad(ctx, bus, N(root + 7), t, d, 0.055, 'sawtooth');
      pad(ctx, bus, N(root + 12), t, d, 0.045, 'sine');
    }
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
    bus.disconnect(); bus.connect(lp); lp.connect(out);
    return out;
  }

  function buildLullaby(ctx, dur) {
    const out = ctx.createGain(); out.gain.value = 0.45;
    const bus = ctx.createGain(); bus.connect(out);
    // Spieluhr-Melodie in C, sehr weich
    const mel = [0, 4, 7, 4, 0, 7, 4, 2, 0, 2, 4, 2, -3, 0, 4, 0];
    const step = 0.52;
    for (let i = 0, t = 0; t < dur; i++, t += step) {
      const s = mel[i % mel.length];
      pluck(ctx, bus, N(s + 3), t, 0.085, 1.5, 'sine');
      pluck(ctx, bus, N(s + 15), t, 0.03, 0.9, 'sine');
      if (i % 4 === 0) pad(ctx, bus, N(s - 21), t, Math.min(2.1, dur - t), 0.045, 'sine');
    }
    return out;
  }

  /* ================================================================
     Rendern der Musikspur in einen AudioBuffer
     ================================================================ */
  A.renderMusic = async function (soundId, dur) {
    if (!soundId || soundId === 'none') return null;
    if (soundId === 'custom') return A.state.custom ? A.state.custom.buffer : null;
    const def = A.SOUNDS.find(s => s.id === soundId);
    if (!def || !def.build) return null;
    const OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OC) return null;
    const sr = 44100;
    const ctx = new OC(2, Math.ceil(sr * dur), sr);
    const node = def.build(ctx, dur);
    const master = ctx.createGain();
    master.gain.value = 1;
    // sanftes Ein- und Ausblenden
    master.gain.setValueAtTime(0.0001, 0);
    master.gain.linearRampToValueAtTime(1, Math.min(1.2, dur * 0.15));
    master.gain.setValueAtTime(1, Math.max(0, dur - 1.4));
    master.gain.linearRampToValueAtTime(0.0001, dur);
    node.connect(master); master.connect(ctx.destination);
    return await ctx.startRendering();
  };

  /* ================================================================
     Voiceover
     ================================================================ */
  A.recSupported = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);

  let _rec = null, _recChunks = [], _recStream = null, _recStart = 0, _recTimer = null;

  A.startRecording = async function (onTick) {
    if (!A.recSupported()) throw new Error('Aufnahme wird auf diesem Gerät nicht unterstützt');
    // iOS gibt den Mikrofonzugriff nur nach einer echten Nutzeraktion frei
    _recStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    const cands = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
    const mime = cands.find(m => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m));
    _recChunks = [];
    _rec = new MediaRecorder(_recStream, mime ? { mimeType: mime } : undefined);
    _rec.ondataavailable = (e) => { if (e.data && e.data.size) _recChunks.push(e.data); };
    _rec.start(250);
    _recStart = performance.now();
    if (onTick) {
      _recTimer = setInterval(() => onTick((performance.now() - _recStart) / 1000), 200);
    }
  };

  A.stopRecording = function () {
    return new Promise((resolve, reject) => {
      if (!_rec) return reject(new Error('Keine Aufnahme aktiv'));
      clearInterval(_recTimer);
      _rec.onstop = async () => {
        try {
          const blob = new Blob(_recChunks, { type: _rec.mimeType || 'audio/webm' });
          _recStream.getTracks().forEach(t => t.stop());
          _rec = null; _recStream = null;
          const ctx = A.ctx();
          const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
          A.state.voice = { buffer: buf, dur: buf.duration, url: URL.createObjectURL(blob) };
          resolve(A.state.voice);
        } catch (e) { reject(e); }
      };
      _rec.stop();
    });
  };

  A.isRecording = () => !!_rec;

  A.clearVoice = function () {
    if (A.state.voice && A.state.voice.url) URL.revokeObjectURL(A.state.voice.url);
    A.state.voice = null;
  };

  A.loadCustom = async function (file) {
    const ctx = A.ctx();
    const buf = await ctx.decodeAudioData(await file.arrayBuffer());
    A.state.custom = { buffer: buf, name: file.name };
    A.state.soundId = 'custom';
    return A.state.custom;
  };

  /* ================================================================
     Abmischung: liefert einen AudioBuffer mit Musik + Stimme
     ================================================================ */
  A.mixdown = async function (dur) {
    const s = A.state;
    const music = await A.renderMusic(s.soundId, dur);
    const voice = s.voice ? s.voice.buffer : null;
    if (!music && !voice) return null;
    const OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OC) return null;
    const sr = 44100;
    const ctx = new OC(2, Math.ceil(sr * dur), sr);
    const put = (buf, vol) => {
      if (!buf) return;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      if (buf.duration < dur - 0.2 && buf !== voice) src.loop = true;
      const g = ctx.createGain(); g.gain.value = vol;
      src.connect(g); g.connect(ctx.destination);
      src.start(0);
    };
    put(music, s.musicVol);
    put(voice, s.voiceVol);
    return await ctx.startRendering();
  };

  /* Live-Wiedergabe zur Vorschau. Rückgabe: stop-Funktion. */
  A.playPreview = async function (dur, fromT) {
    A.stopPreview();
    const buf = await A.mixdown(dur);
    if (!buf) return null;
    const ctx = A.ctx();
    if (!ctx) return null;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0, Math.max(0, Math.min(fromT || 0, buf.duration - 0.05)));
    A._preview = src;
    return src;
  };
  A.stopPreview = function () {
    if (A._preview) { try { A._preview.stop(); } catch (e) {} A._preview = null; }
  };

  /* Tonspur als MediaStream für den Video-Export */
  A.streamFor = async function (dur) {
    const buf = await A.mixdown(dur);
    if (!buf) return null;
    const ctx = A.ctx();
    if (!ctx || !ctx.createMediaStreamDestination) return null;
    const dest = ctx.createMediaStreamDestination();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(dest);
    return { stream: dest.stream, start: () => src.start(), stop: () => { try { src.stop(); } catch (e) {} }, buffer: buf };
  };

  /* ---------- WAV-Export (Fallback „getrennte Spuren") ---------- */
  A.bufferToWav = function (buf) {
    const numCh = buf.numberOfChannels, len = buf.length;
    const out = new DataView(new ArrayBuffer(44 + len * numCh * 2));
    const wr = (off, str) => { for (let i = 0; i < str.length; i++) out.setUint8(off + i, str.charCodeAt(i)); };
    wr(0, 'RIFF'); out.setUint32(4, 36 + len * numCh * 2, true); wr(8, 'WAVE');
    wr(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true);
    out.setUint16(22, numCh, true); out.setUint32(24, buf.sampleRate, true);
    out.setUint32(28, buf.sampleRate * numCh * 2, true); out.setUint16(32, numCh * 2, true);
    out.setUint16(34, 16, true); wr(36, 'data'); out.setUint32(40, len * numCh * 2, true);
    const chans = [];
    for (let ch = 0; ch < numCh; ch++) chans.push(buf.getChannelData(ch));
    let off = 44;
    for (let i = 0; i < len; i++) {
      for (let ch = 0; ch < numCh; ch++) {
        const v = Math.max(-1, Math.min(1, chans[ch][i]));
        out.setInt16(off, v < 0 ? v * 0x8000 : v * 0x7FFF, true);
        off += 2;
      }
    }
    return new Blob([out.buffer], { type: 'audio/wav' });
  };
})();
