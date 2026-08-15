/* ============================================================
   Seamless Studio 5.0 — Video-Clips auf der Leinwand
   Clips verhalten sich wie Fotos: hinzufügen, verschieben,
   drehen, skalieren, in der Ebenenliste sortieren. Jeder Clip
   hat einen eigenen Startzeitpunkt und einen Trimmbereich.
   Beim Video-Export laufen alle Clips in Echtzeit mit, weil der
   Export ohnehin in Echtzeit aufzeichnet.
   Lädt nach render.js, ui.js und video.js.
   ============================================================ */

(function () {
  const $ = (id) => document.getElementById(id);
  const st = SS.state;

  SS.videos = SS.videos || {};   // vidId -> { el: HTMLVideoElement, url, w, h, dur, name }

  /* ================= Zeichnen ================= */

  SS.drawVideoEl = function (c, el) {
    const rec = SS.videos[el.vidId];
    const w = el.w * (el.scaleX || 1), h = el.h * (el.scaleY || 1);
    c.save();
    c.translate(el.x, el.y);
    c.rotate(SS.deg2rad(el.rot || 0));
    c.globalAlpha = el.opacity ?? 1;

    if (el.radius) {
      const r = Math.min(el.radius, Math.min(w, h) / 2);
      c.beginPath();
      c.moveTo(-w / 2 + r, -h / 2);
      c.arcTo(w / 2, -h / 2, w / 2, h / 2, r);
      c.arcTo(w / 2, h / 2, -w / 2, h / 2, r);
      c.arcTo(-w / 2, h / 2, -w / 2, -h / 2, r);
      c.arcTo(-w / 2, -h / 2, w / 2, -h / 2, r);
      c.closePath();
      c.clip();
    }

    if (rec && rec.el && rec.el.readyState >= 2) {
      /* Bild formatfüllend einpassen, ohne zu verzerren */
      const vw = rec.el.videoWidth || rec.w, vh = rec.el.videoHeight || rec.h;
      const k = Math.max(w / vw, h / vh);
      const dw = vw * k, dh = vh * k;
      c.drawImage(rec.el, -dw / 2, -dh / 2, dw, dh);
    } else {
      c.fillStyle = '#241F1B';
      c.fillRect(-w / 2, -h / 2, w, h);
      c.fillStyle = '#8A8078';
      c.font = `${Math.round(h * 0.09)}px Poppins, sans-serif`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('Clip', 0, 0);
    }

    if (el.frameCol) {
      c.strokeStyle = el.frameCol;
      c.lineWidth = Math.max(2, Math.min(w, h) * 0.012);
      c.strokeRect(-w / 2, -h / 2, w, h);
    }
    c.restore();
  };

  /* ================= Zeitsteuerung ================= */

  /* Alle Clips auf den Zeitpunkt t der Gesamtdauer stellen */
  SS.syncVideoEls = function (t, playing) {
    /* Karussell-Aufnahme (videoslides77): dort ist jede Slide eine eigene
       Datei, die bei 0 startet. Der Clip läuft dann in Schleife über seinen
       Trimmbereich (wie auf der Leinwand, loop=true) – er füllt die ganze
       Slide-Dauer, statt nach clipLen einzufrieren. `SS.slideVideo` wird
       erst zur Laufzeit belegt (clips5 lädt vor videoslides77), deshalb
       der sichere Zugriff. */
    const karussell = !!(SS.slideVideo && SS.slideVideo.laeuft);
    for (const el of st.elements) {
      if (el.type !== 'video') continue;
      const rec = SS.videos[el.vidId];
      if (!rec || !rec.el) continue;
      const v = rec.el;
      const len = clipLen(el);
      let inRange = true, local;
      if (karussell) {
        local = (el.trimStart || 0) + (t % len);
      } else {
        inRange = t >= (el.tIn || 0) && t < (el.tIn || 0) + len;
        local = (el.trimStart || 0) + Math.max(0, t - (el.tIn || 0));
      }
      if (!inRange) {
        if (!v.paused) v.pause();
        continue;
      }
      /* currentTime zu setzen heißt auf iOS: echter Seek. Der bricht die
         laufende Dekodierung ab. Deshalb nur bei größerer Abweichung und
         höchstens alle 400 ms – dazwischen läuft das Video von selbst weiter. */
      const jetzt = performance.now();
      const abw = Math.abs(v.currentTime - local);
      if (abw > (playing ? 0.5 : 0.12) && jetzt - (rec._seek || 0) > 400) {
        rec._seek = jetzt;
        try { v.currentTime = Math.min(local, (v.duration || 1) - 0.05); } catch (e) {}
      }
      v.muted = el.muted !== false;
      if (playing && v.paused) v.play().catch(() => {});
      if (!playing && !v.paused) v.pause();
    }
  };
  const clipLen = (el) => Math.max(0.2, (el.trimEnd || 0) - (el.trimStart || 0));
  SS.clipLen = clipLen;

  SS.stopVideoEls = function () {
    for (const id in SS.videos) {
      const v = SS.videos[id].el;
      if (v && !v.paused) v.pause();
    }
  };

  /* An den Vorschau-Player und den Export hängen */
  if (SS.video && SS.video.drawFrame) {
    const V = SS.video;
    const origDraw = V.drawFrame;
    V.drawFrame = function (oc, outW, outH, t, cam) {
      const playing = !!(V.player && V.player.playing) || !!SS._exporting;
      SS.syncVideoEls(t, playing);
      return origDraw.apply(this, arguments);
    };
    const origPause = V.pause;
    if (typeof origPause === 'function') {
      V.pause = function () { SS.stopVideoEls(); return origPause.apply(this, arguments); };
    }
  }

  /* Auf der Bearbeitungs-Leinwand laufen die Clips still mit,
     solange nicht der Leistungsmodus an ist. */
  let liveRaf = null, letztes = 0;
  const ZIEL_MS = 1000 / 30;    // Video läuft mit 30 fps – 60 wäre die Hälfte umsonst
  function liveTick(ts) {
    liveRaf = null;
    const clips = st.elements.filter(e => e.type === 'video' && !e.hidden && e.preview !== false);
    if (!clips.length || st.perfMode || document.hidden) return;
    let need = false;
    for (const el of clips) {
      const rec = SS.videos[el.vidId];
      if (rec && rec.el && rec.el.readyState >= 2 && !rec.el.paused) need = true;
    }
    const now = ts || performance.now();
    if (need && now - letztes >= ZIEL_MS - 1) {
      letztes = now;
      SS.motionHint && SS.motionHint(120);   // laufender Clip = Bewegung → gröber zeichnen
      SS.requestRender();
    }
    liveRaf = requestAnimationFrame(liveTick);
  }
  // Läuft die App im Hintergrund, ruht alles
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (liveRaf) { cancelAnimationFrame(liveRaf); liveRaf = null; } }
    else if (!liveRaf && st.elements.some(e => e.type === 'video')) liveRaf = requestAnimationFrame(liveTick);
  });
  /* Wenn der Browser es kann, hängen wir uns direkt an die dekodierten
     Videobilder. Dann wird exakt einmal je Videobild neu gezeichnet –
     kein einziger Durchgang zu viel. Safari kann das seit 15.4. */
  function anVideoBilder(rec) {
    const v = rec.el;
    if (!v.requestVideoFrameCallback || rec._rvfc) return false;
    const schritt = () => {
      rec._rvfc = null;
      if (v.paused || document.hidden || st.perfMode) return;
      SS.motionHint && SS.motionHint(120);
      SS.requestRender();
      rec._rvfc = v.requestVideoFrameCallback(schritt);
    };
    rec._rvfc = v.requestVideoFrameCallback(schritt);
    return true;
  }

  function livePlay(on) {
    let perBild = true;
    for (const el of st.elements) {
      if (el.type !== 'video') continue;
      const rec = SS.videos[el.vidId];
      if (!rec || !rec.el) continue;
      rec.el.muted = true;
      rec.el.loop = true;
      if (on) {
        rec.el.play().catch(() => {});
        if (!anVideoBilder(rec) && !rec.el.requestVideoFrameCallback) perBild = false;
      } else {
        rec.el.pause();
        if (rec._rvfc && rec.el.cancelVideoFrameCallback) {
          try { rec.el.cancelVideoFrameCallback(rec._rvfc); } catch (e) {}
        }
        rec._rvfc = null;
      }
    }
    // Rückfallebene für ältere Browser: 30 Bilder je Sekunde
    if (on && !perBild && !liveRaf) liveRaf = requestAnimationFrame(liveTick);
    if (!on && liveRaf) { cancelAnimationFrame(liveRaf); liveRaf = null; }
  }
  SS.livePlayClips = livePlay;

  /* ================= Laden ================= */

  async function addClip(file) {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.src = url;
    v.playsInline = true; v.muted = true; v.loop = true;
    v.preload = 'auto';
    await new Promise((res, rej) => {
      v.onloadedmetadata = res;
      v.onerror = () => rej(new Error('Format nicht lesbar'));
      setTimeout(res, 4000);
    });
    const vidId = 'v' + Date.now().toString(36);
    SS.videos[vidId] = { el: v, url, datei: file, w: v.videoWidth || 720, h: v.videoHeight || 1280, dur: v.duration || 5, name: file.name };

    const { slideW, H, n } = SS.canvasSize();
    const idx = st.elements.filter(e => e.type === 'video').length;
    const slide = Math.min(n - 1, idx);
    const w = slideW * 0.68;
    const h = w * ((v.videoHeight || 1280) / (v.videoWidth || 720));

    const el = {
      id: SS.uid(), type: 'video', vidId,
      x: slide * slideW + slideW / 2, y: H / 2,
      w, h: Math.min(h, H * 0.8),
      rot: 0, opacity: 1, radius: 0, muted: true,
      tIn: idx * 3, trimStart: 0, trimEnd: Math.min(v.duration || 5, 4),
      name: file.name.replace(/\.[^.]+$/, ''),
    };
    SS.normalizeEl(el);
    st.elements.push(el);
    SS.setSel(el.id);
    SS.pushHistory('Clip hinzugefügt');
    SS.ui.refreshLayers && SS.ui.refreshLayers();
    SS.ui.showProps && SS.ui.showProps();
    SS.requestRender();
    livePlay(true);
    SS.toast('Clip eingesetzt – Dauer und Startzeit stehen unten', 3400, 'ok');
  }

  SS.addClipDatei = addClip;

  /* ================= Bedienung: Fotos-Panel ================= */

  const shelf = $('photoShelf');
  if (shelf) {
    const lab = document.createElement('label');
    lab.className = 'wide btn-like';
    lab.textContent = 'Video-Clip auf die Leinwand legen';
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'video/*';
    inp.multiple = true;
    inp.className = 'file-overlay';
    lab.appendChild(inp);
    inp.addEventListener('change', async (e) => {
      const files = [...(e.target.files || [])];
      e.target.value = '';
      if (!files.length) return;
      // Bei mehreren Dateien ist nur die Leinwand sinnvoll – Hintergrund gibt es einmal
      let ziel = 'leinwand';
      if (files.length === 1 && SS.videoZiel) ziel = await SS.videoZiel(files[0]);
      if (!ziel) return;
      if (ziel === 'hintergrund') {
        try {
          await SS.loadClip(files[0]);
          SS.clip.datei = files[0];
          SS.pushHistory('Video als Hintergrund');
          SS.toast('Video liegt als Hintergrund – Umschalten geht im Video-Tab', 3600, 'ok');
          SS.requestRender();
        } catch (err) { SS.toast('Clip konnte nicht gelesen werden', 3400, 'err'); }
        return;
      }
      for (const f of files) {
        try { await addClip(f); }
        catch (err) { SS.toast('Clip konnte nicht gelesen werden: ' + f.name, 3400, 'err'); }
      }
    });
    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.textContent = 'Clips liegen wie Fotos auf der Leinwand — verschieben, drehen, skalieren, in Ebenen sortieren. Im Video-Export laufen sie nacheinander, je nach eingestellter Startzeit.';
    shelf.parentNode.insertBefore(lab, shelf.nextSibling);
    shelf.parentNode.insertBefore(hint, lab.nextSibling);
  }

  /* ================= Eigenschaften eines Clips ================= */

  function slider(body, label, val, min, max, step, onInput, onDone, fmt) {
    const d = document.createElement('div'); d.className = 'ctl';
    const s = document.createElement('span'); s.textContent = label;
    const r = document.createElement('input');
    r.type = 'range'; r.min = min; r.max = max; r.step = step; r.value = val;
    const v = document.createElement('span'); v.className = 'val';
    v.textContent = fmt ? fmt(val) : val;
    r.addEventListener('input', () => { v.textContent = fmt ? fmt(+r.value) : r.value; onInput(+r.value); });
    r.addEventListener('change', () => onDone && onDone(+r.value));
    d.appendChild(s); d.appendChild(r); d.appendChild(v);
    body.appendChild(d);
    return r;
  }

  function clipProps(sel, body) {
    const rec = SS.videos[sel.vidId];
    const total = (SS.video && SS.video.player && SS.video.player.dur) || 8;
    const vdur = rec ? (rec.dur || 5) : 5;

    const h4 = document.createElement('h4');
    h4.textContent = 'Clip';
    body.appendChild(h4);

    const info = document.createElement('p');
    info.className = 'hint';
    info.style.margin = '0 0 8px';
    info.textContent = (rec ? rec.name : 'Clip') + ' · ' + vdur.toFixed(1).replace('.', ',') + ' s Quellmaterial';
    body.appendChild(info);

    // Nachträglich umschalten
    if (rec && rec.datei && SS.clipZuHintergrund) {
      const um = document.createElement('button');
      um.className = 'wide';
      um.textContent = 'Stattdessen als Hintergrund verwenden';
      um.onclick = () => SS.clipZuHintergrund(sel);
      body.appendChild(um);
      const uh = document.createElement('p');
      uh.className = 'hint';
      uh.style.margin = '6px 0 12px';
      uh.textContent = SS.state.slides > 1
        ? 'Achtung: dabei wird aus deinen ' + SS.state.slides + ' Slides eine einzige.'
        : 'Das Video füllt dann die ganze Leinwand.';
      body.appendChild(uh);
    }

    const live = () => SS.requestRender();
    const done = (l) => SS.pushHistory(l || 'Clip');

    slider(body, 'Startzeit', sel.tIn || 0, 0, Math.max(1, total), 0.1,
      v => { sel.tIn = v; live(); }, () => done('Clip-Start'), v => v.toFixed(1).replace('.', ',') + ' s');
    slider(body, 'Anfang', sel.trimStart || 0, 0, Math.max(0.2, vdur - 0.2), 0.1,
      v => { sel.trimStart = Math.min(v, (sel.trimEnd || vdur) - 0.2); live(); }, () => done('Clip getrimmt'),
      v => v.toFixed(1).replace('.', ',') + ' s');
    slider(body, 'Ende', sel.trimEnd || vdur, 0.2, vdur, 0.1,
      v => { sel.trimEnd = Math.max(v, (sel.trimStart || 0) + 0.2); live(); }, () => done('Clip getrimmt'),
      v => v.toFixed(1).replace('.', ',') + ' s');
    slider(body, 'Ecken', sel.radius || 0, 0, Math.round(Math.min(sel.w, sel.h) / 2), 1,
      v => { sel.radius = v; live(); }, () => done('Clip-Ecken'));

    const row = document.createElement('div');
    row.className = 'chips toggle-row';
    const mk = (label, on, fn) => {
      const b = document.createElement('button');
      b.textContent = label;
      if (on) b.classList.add('sel');
      b.onclick = () => { fn(); SS.pushHistory('Clip'); SS.ui.showProps(); SS.requestRender(); };
      row.appendChild(b);
    };
    mk(sel.muted === false ? 'Ton an' : 'Ton aus', sel.muted === false, () => { sel.muted = !(sel.muted === false); });
    mk('Auf Slide einpassen', false, () => {
      const { slideW, H } = SS.canvasSize();
      const k = Math.min(slideW / sel.w, H / sel.h);
      sel.w *= k; sel.h *= k;
      sel.x = Math.round(sel.x / slideW) * slideW + slideW / 2;
      sel.y = H / 2;
    });
    body.appendChild(row);

    const len = document.createElement('p');
    len.className = 'hint';
    len.textContent = 'Läuft von ' + (sel.tIn || 0).toFixed(1).replace('.', ',') + ' s bis ' +
      ((sel.tIn || 0) + SS.clipLen(sel)).toFixed(1).replace('.', ',') + ' s im fertigen Video.';
    body.appendChild(len);
  }

  const origShowProps = SS.ui && SS.ui.showProps;
  if (origShowProps) SS.ui.showProps = function () {
    origShowProps.apply(this, arguments);
    const sel = SS.getSel();
    if (sel && sel.type === 'video' && SS.selCount() === 1) {
      const body = $('propsBody');
      if (body) {
        const t = $('propsTitle');
        if (t) t.textContent = 'Clip';
        clipProps(sel, body);
      }
    }
  };

  /* Name in der Ebenenliste */
  const origName = SS.elName;
  SS.elName = function (el) {
    if (el && el.type === 'video') return el.name || 'Clip';
    return origName.apply(this, arguments);
  };

  /* Clips laufen auf der Bearbeitungs-Leinwand mit, sobald welche da sind */
  window.addEventListener('load', () => setTimeout(() => {
    if (st.elements.some(e => e.type === 'video')) livePlay(true);
  }, 1200));

  SS.CLIPS5 = true;
})();
