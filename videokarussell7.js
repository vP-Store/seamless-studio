/* Seamless Studio – Karussell-Videos: ein Video je Slide
   ============================================================================
   Ein Instagram-Karussell aus Videos besteht nicht aus EINEM Video, sondern aus
   einem Video je Slide. Die App konnte bisher nur ein einziges ausgeben – für
   ein Video-Panorama fehlte damit genau der letzte Schritt.

   Hier wird für jede Slide einmal aufgenommen. Die Kamera steht dabei fest auf
   dieser Slide (kein Schwenk), und der Clip wird vor JEDER Aufnahme wieder auf
   den Anfang gesetzt. Das ist wichtig: beim Wischen startet Instagram jedes
   Slide-Video von vorn. Liefen die Aufnahmen durch, zeigte Slide 3 beim Start
   die Sekunde 12 – das Panorama wäre beim Wischen auseinandergefallen.

   Aufgenommen wird in Echtzeit (MediaRecorder kann nichts anderes). Fünf
   Slides à 6 s dauern also gut 30 s. Der Fortschritt wird angezeigt.

   SS.video.karussellVideos({dur, fps, quality}, fortschritt) -> [{blob, ext}]
   ========================================================================= */

(function () {
  const V = SS.video;
  if (!V || typeof V.drawFrame !== 'function') return;

  function mimeWaehlen() {
    const cands = ['video/mp4;codecs=avc1', 'video/mp4',
                   'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    return cands.find(m => window.MediaRecorder && MediaRecorder.isTypeSupported
      && MediaRecorder.isTypeSupported(m));
  }

  /* Feste Kamera auf Slide k. Rückgabe hat dieselbe Form wie V.buildCamera. */
  function kameraAuf(k) {
    const { H, slideW, slideH } = SS.canvasSize();
    const blick = { cx: (k + 0.5) * slideW, cy: H / 2, vw: slideW, vh: slideH };
    return () => blick;
  }

  /* Den Clip für alle Kacheln wieder auf Anfang stellen. */
  async function anfangSetzen() {
    const cl = SS.clip;
    if (!cl || !cl.ready) return;
    const VL = SS.videoLeinwand;
    try { cl.video.pause(); } catch (e) {}
    await new Promise((fertig) => {
      let ab = false;
      const los = () => { if (!ab) { ab = true; cl.video.removeEventListener('seeked', los); fertig(); } };
      cl.video.addEventListener('seeked', los);
      setTimeout(los, 1200);
      try { cl.video.currentTime = cl.start || 0; } catch (e) { los(); }
    });
    if (VL && VL.modus === 'zeit') await VL.stellen(Math.max(1, SS.canvasSize().n));
  }

  V.karussellVideos = async function (o, fortschritt) {
    const opt = Object.assign({ fps: V.opts.fps || 30, quality: V.opts.quality || 1 }, o || {});
    const cl = SS.clip;
    const dauerVoll = cl && cl.ready ? Math.max(1, (cl.end || cl.dur) - (cl.start || 0)) : V.opts.dur;
    let dur = Math.max(1, Math.min(30, opt.dur || +dauerVoll.toFixed(2)));
    /* Steht der Regler nahe an der schleifenfesten Periode T − f (weiche
       Schleife aktiv), wird exakt sie genommen: nur bei genau dieser Laenge
       zeigt das Videoende wieder das Bild vom Anfang. */
    if (SS.schleife && SS.schleife.aktiv && SS.schleife.periode) {
      const P = SS.schleife.periode();
      if (P >= 1 && P <= 30 && Math.abs(dur - P) < 0.6) dur = P;
    }
    const { n, slideW, slideH } = SS.canvasSize();
    if (!window.MediaRecorder) throw new Error('Dieses Gerät kann keine Videos aufnehmen');
    const mime = mimeWaehlen();
    if (!mime) throw new Error('Dieses Gerät kann keine Videos aufnehmen');
    const ext = mime.indexOf('mp4') >= 0 ? 'mp4' : 'webm';

    const q = opt.quality;
    const outW = Math.round(slideW * q / 2) * 2;
    const outH = Math.round(slideH * q / 2) * 2;
    const out = document.createElement('canvas');
    out.width = outW; out.height = outH;
    const oc = out.getContext('2d');

    await SS.wakeOn();
    V.prepare();
    const ergebnis = [];
    try {
      for (let k = 0; k < n; k++) {
        await anfangSetzen();
        const cam = kameraAuf(k);
        /* captureStream(0) statt captureStream(fps):
           Bei einer festen Rate nimmt der Browser selbst ab, wann immer er
           mag – und lässt aus, was er nicht schafft. Nachgemessen: 38
           gezeichnete Bilder, 20 im Video. Mit Rate 0 kommt genau dann ein
           Bild an, wenn wir requestFrame() rufen: 43 gezeichnet, 44 im
           Video. Kein Bild geht mehr verloren. */
        let stream = out.captureStream(0);
        let spur = stream.getVideoTracks()[0];
        let takt = () => {};
        if (spur && typeof spur.requestFrame === 'function') takt = () => spur.requestFrame();
        else { stream = out.captureStream(opt.fps); spur = stream.getVideoTracks()[0]; }
        const rec = new MediaRecorder(stream, {
          mimeType: mime, videoBitsPerSecond: q > 1 ? 16000000 : 9000000,
        });
        const stuecke = [];
        rec.ondataavailable = (e) => { if (e.data && e.data.size) stuecke.push(e.data); };
        const gestoppt = new Promise(r => { rec.onstop = r; });

        /* Warmlaufen: die ersten Bilder nach einem Sprung im Video dauern
           lange (Dekoder). Ohne das ist die erste halbe Sekunde ruckelig. */
        SS.animT = 0;
        const warmBis = performance.now() + (k === 0 ? 700 : 300);
        while (performance.now() < warmBis) {
          V.drawFrame(oc, outW, outH, 0, cam);
          await new Promise(r => requestAnimationFrame(r));
        }
        rec.start(200);
        if (cl && cl.ready) await SS.clipStartPlayback();
        /* Nur die drei Kacheln laufen lassen, die auf dieser Slide zu sehen
           sind: die eigene und die beiden Nachbarn, deren Überblendbänder in
           die Slide hineinragen. */
        const VL = SS.videoLeinwand;
        if (VL && VL.modus === 'zeit' && VL.nurLaufen) {
          const noetig = new Set([(k - 1 + n) % n, k, (k + 1) % n]);
          VL.nurLaufen(noetig);
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
            if (fortschritt) fortschritt(Math.round((k + t / dur) / n * 96));
            if (t < dur) requestAnimationFrame(bild); else fertig();
          };
          requestAnimationFrame(bild);
        });

        /* Dem Recorder Zeit lassen, das letzte Stück abzugeben – sonst fehlt
           am Ende jeder Slide ein Viertel Sekunde. */
        await new Promise(r => setTimeout(r, 260));
        rec.stop();
        if (cl && cl.ready) SS.clipStopPlayback();
        await gestoppt;
        try { spur.stop(); } catch (e) {}
        ergebnis.push({ blob: new Blob(stuecke, { type: mime }), ext, slide: k + 1,
                        bildrate: +(gemalt / dur).toFixed(1) });
      }
    } finally {
      V.release();
      SS.wakeOff();
    }
    if (fortschritt) fortschritt(100);
    return ergebnis;
  };

  /* ---------------------------------------------------------------- Bedienung */
  (function () {
    const kasten = document.getElementById('vidClipBox');
    if (!kasten) return;
    const vor = document.getElementById('vidClipToCanvas');

    const box = document.createElement('div');
    box.innerHTML =
      '<h3 style="margin:14px 0 6px">Karussell-Videos</h3>' +
      '<div class="ctl"><span>Länge je Slide</span>' +
        '<input type="range" id="vkDur" min="2" max="20" step="0.5" value="6">' +
        '<span class="val" id="vkDurL">6 s</span></div>' +
      '<button id="vkGo" class="wide primary">Ein Video je Slide aufnehmen</button>' +
      '<div class="progress hidden" id="vkProgress"><div></div></div>' +
      '<p class="hint">Nimmt jede Slide einzeln auf, jede von vorn – so passt beim Wischen ' +
      'die erste Sekunde jeder Slide zusammen. Dauert etwa Länge × Slides in Echtzeit.</p>';
    kasten.insertBefore(box, vor || null);

    const dEl = document.getElementById('vkDur');
    const dL = document.getElementById('vkDurL');
    dEl.addEventListener('input', () => { dL.textContent = dEl.value + ' s'; });

    /* Vorgabe: eine schleifenfeste Runde. Mit weicher Schleife (schleife7.js)
       ist das die Periode T − f – ein Video genau dieser Laenge zeigt am Ende
       exakt das Bild vom Anfang, egal wo die Aufnahme beginnt. Ohne sie die
       getrimmte Cliplaenge wie bisher. */
    const merken = () => {
      const cl = SS.clip;
      if (!cl || !cl.ready) return;
      const roh = (SS.schleife && SS.schleife.aktiv && SS.schleife.periode)
        ? SS.schleife.periode()
        : (cl.end || cl.dur) - (cl.start || 0);
      const t = Math.max(2, Math.min(20, Math.round(roh * 2) / 2));
      dEl.value = String(t); dL.textContent = t + ' s';
    };
    if (SS.ui) {
      const alt = SS.ui.syncTop;
      SS.ui.syncTop = function () { const r = alt.apply(this, arguments); try { merken(); } catch (e) {} return r; };
    }

    document.getElementById('vkGo').onclick = async () => {
      const knopf = document.getElementById('vkGo');
      const prog = document.getElementById('vkProgress');
      const bar = prog.firstElementChild;
      const { n } = SS.canvasSize();
      if (n < 2) {
        SS.toast('Nur eine Slide – stell oben mehr Slides ein (Format 4:5 oder 1:1).', 4000);
        return;
      }
      knopf.disabled = true;
      prog.classList.remove('hidden');
      try {
        SS.video.pause && SS.video.pause();
        const teile = await V.karussellVideos({ dur: +dEl.value },
          p => { bar.style.width = p + '%'; });
        const zip = new JSZip();
        const ordner = zip.folder('Seamless_Karussell_Video');
        teile.forEach(t => ordner.file(
          `Slide_${String(t.slide).padStart(2, '0')}.${t.ext}`, t.blob));
        const rate = Math.min(...teile.map(t => t.bildrate || 0));
        if (typeof SS.beitragstext === 'function') {
          try { ordner.file('Beitrag.txt', SS.beitragstext()); } catch (e) {}
        }
        ordner.file('Hinweis.txt',
          'Ein Video je Slide.\r\n\r\n' +
          'In Instagram alle Videos in EINEN Beitrag laden, in dieser Reihenfolge.\r\n' +
          'Beim Hochladen nicht zuschneiden lassen – sonst verrutschen die Nähte.\r\n' +
          `Länge je Slide: ${dEl.value} s\r\n` +
          `Bildrate: ${rate.toFixed(0)} Bilder je Sekunde (in Echtzeit aufgenommen)\r\n`);
        const blob = await zip.generateAsync({ type: 'blob' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'Seamless_Karussell_Video.zip';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 9000);
        /* Ehrlich sagen, was herausgekommen ist: aufgenommen wird in Echtzeit,
           die Bildrate hängt am Gerät. Lieber die gemessene Zahl nennen als
           eine versprochene, die nicht stimmt. */
        SS.toast(teile.length + ' Slide-Videos gespeichert · ' + rate.toFixed(0)
          + ' Bilder je Sekunde'
          + (rate < 18 ? ' – für mehr: weniger Slides oder kürzere Länge' : ''),
          rate < 18 ? 6000 : 3400, 'ok');
      } catch (e) {
        SS.toast('Aufnahme fehlgeschlagen: ' + e.message, 4200, 'err');
      } finally {
        knopf.disabled = false;
        prog.classList.add('hidden');
        bar.style.width = '0%';
      }
    };
  })();

  SS.VIDEOKARUSSELL = { bereit: true };
})();
