/* Seamless Studio – Video verschönern
   Einen fertigen Clip laden, Start/Ende trimmen und mit Text, Stickern,
   Animationen und eigenen PNGs überlagern. Bewusst kein Mehrspur-Schnitt. */

(function () {
  const $ = SS.el;

  SS.clip = null;   // {video, url, start, end, dur, ready, w, h}

  /* ---------- Laden ---------- */
  SS.loadClip = function (file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const v = document.createElement('video');
      v.src = url;
      v.muted = true;                  // iOS spielt nur stumm ohne Geste
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.preload = 'auto';
      v.crossOrigin = 'anonymous';
      const fail = () => { URL.revokeObjectURL(url); reject(new Error('Video konnte nicht gelesen werden')); };
      v.onerror = fail;
      v.onloadedmetadata = () => {
        const dur = isFinite(v.duration) ? v.duration : 10;
        SS.clipClear(true);
        SS.clip = {
          video: v, url, dur, start: 0, end: dur, ready: true,
          w: v.videoWidth || 1080, h: v.videoHeight || 1920, name: file.name,
        };
        // Format an das Seitenverhältnis des Clips anpassen
        const ar = SS.clip.w / SS.clip.h;
        const best = [['9:16', 1080 / 1920], ['1:1', 1], ['4:5', 1080 / 1350]]
          .sort((a, b) => Math.abs(a[1] - ar) - Math.abs(b[1] - ar))[0][0];
        SS.state.format = best;
        SS.ui.syncTop();
        v.currentTime = 0;
        const go = () => { SS.ui.zoomFit(); SS.requestRender(); resolve(SS.clip); };
        if (v.readyState >= 2) go(); else v.onloadeddata = go;
      };
    });
  };

  SS.clipClear = function (silent) {
    if (SS.clip) {
      try { SS.clip.video.pause(); } catch (e) {}
      URL.revokeObjectURL(SS.clip.url);
    }
    SS.clip = null;
    if (!silent) { SS.bgCacheInvalidate(); SS.ui.zoomFit(); SS.requestRender(); }
  };

  /* ---------- Zeichnen ---------- */
  SS.drawClipFrame = function (c, W, H) {
    const cl = SS.clip;
    c.save();
    c.fillStyle = '#0d0b0a';
    c.fillRect(0, 0, W, H);
    if (cl && cl.ready && cl.video.readyState >= 2) {
      const vw = cl.video.videoWidth || cl.w, vh = cl.video.videoHeight || cl.h;
      const sc = Math.max(W / vw, H / vh);          // Cover-Füllung
      const dw = vw * sc, dh = vh * sc;
      try { c.drawImage(cl.video, (W - dw) / 2, (H - dh) / 2, dw, dh); } catch (e) {}
    }
    c.restore();
  };

  /* ---------- Wiedergabe ---------- */
  let _watch = null;

  SS.clipSeek = function (p01) {
    const cl = SS.clip;
    if (!cl || !cl.ready || !cl.video.paused) return;
    const t = cl.start + SS.clamp(p01, 0, 1) * Math.max(0.05, cl.end - cl.start);
    try { cl.video.currentTime = Math.min(t, cl.dur - 0.03); } catch (e) {}
  };

  SS.clipStartPlayback = function () {
    const cl = SS.clip;
    if (!cl || !cl.ready) return Promise.resolve();
    return new Promise((resolve) => {
      const v = cl.video;
      const begin = () => {
        v.play().catch(() => {});
        clearInterval(_watch);
        _watch = setInterval(() => {
          if (v.currentTime >= cl.end - 0.03) { try { v.currentTime = cl.start; } catch (e) {} }
        }, 60);
        resolve();
      };
      try { v.currentTime = cl.start; } catch (e) {}
      if (v.readyState >= 2) setTimeout(begin, 30);
      else v.onseeked = begin;
    });
  };

  SS.clipStopPlayback = function () {
    clearInterval(_watch); _watch = null;
    if (SS.clip && SS.clip.ready) { try { SS.clip.video.pause(); } catch (e) {} }
  };

  /* Live-Neuzeichnen, solange ein Clip läuft (die Animationsschleife greift). */
  SS.clipIsPlaying = () => !!(SS.clip && SS.clip.ready && !SS.clip.video.paused);
})();
