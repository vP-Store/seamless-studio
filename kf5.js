/* ============================================================
   Seamless Studio 6.3 — Keyframes mit Easing
   Position, Größe, Drehung und Deckkraft frei über die Zeit.
   Hängt an SS.animFrame: liegen Keyframes an einem Element,
   ersetzen sie das Animations-Preset. Gilt für Vorschau und
   Export gleichermaßen, weil beide V.drawFrame benutzen.
   ============================================================ */

(function () {
  const $ = SS.el;

  /* ---------------- Kurven ---------------- */
  const EASE = {
    linear: { name: 'Gleichmäßig', fn: (t) => t },
    out: { name: 'Weich heraus', fn: (t) => 1 - Math.pow(1 - t, 3) },
    in: { name: 'Weich hinein', fn: (t) => t * t * t },
    inout: { name: 'Weich beides', fn: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 },
    back: { name: 'Mit Überschwung', fn: (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2) },
    hold: { name: 'Halten, dann springen', fn: () => 0 },
  };
  SS.KF_EASE = EASE;

  /* ---------------- Zeitpunkt der Auswertung ----------------
     Wird vom Video (Vorschau und Export) je Bild gesetzt und danach
     auf den Wert des Vorschau-Reglers zurückgestellt. Ist er null,
     zeigt die Leinwand das Element in seinem Ruhezustand. */
  SS._kfT = null;
  let scrubT = null;

  const kfList = (el) => (el && el.kf && el.kf.length) ? el.kf.slice().sort((a, b) => a.t - b.t) : null;
  SS.hasKf = (el) => !!(el && el.kf && el.kf.length);

  const V0 = { dx: 0, dy: 0, sc: 100, rot: 0, a: 100 };
  const val = (k, key) => (k && k[key] !== undefined) ? k[key] : V0[key];

  /* Zustand zwischen zwei Punkten berechnen */
  SS.kfAt = function (el, t) {
    const ks = kfList(el);
    if (!ks) return null;
    if (t <= ks[0].t) return ks[0];
    const last = ks[ks.length - 1];
    if (t >= last.t) return last;
    let i = 0;
    while (i < ks.length - 1 && ks[i + 1].t <= t) i++;
    const a = ks[i], b = ks[i + 1];
    const span = Math.max(0.0001, b.t - a.t);
    const raw = (t - a.t) / span;
    const e = (EASE[a.ease] || EASE.out).fn(Math.max(0, Math.min(1, raw)));
    const mix = (key) => val(a, key) + (val(b, key) - val(a, key)) * e;
    return { t, dx: mix('dx'), dy: mix('dy'), sc: mix('sc'), rot: mix('rot'), a: mix('a') };
  };

  /* ---------------- Einhängen in die Animationsstufe ---------------- */
  const origFrame = SS.animFrame;
  SS.animFrame = function (el, size) {
    if (SS._noAnim) return origFrame.apply(this, arguments);
    if (!SS.hasKf(el) || SS._kfT === null) return origFrame.apply(this, arguments);
    const k = SS.kfAt(el, SS._kfT);
    if (!k) return origFrame.apply(this, arguments);
    const sc = Math.max(0.01, val(k, 'sc') / 100);
    return {
      dx: (val(k, 'dx') / 100) * size,
      dy: (val(k, 'dy') / 100) * size,
      sx: sc, sy: sc,
      rot: val(k, 'rot') * Math.PI / 180,
      a: Math.max(0, Math.min(1, val(k, 'a') / 100)),
      glow: 0,
    };
  };

  /* Video setzt die Zeit je Bild — danach zurück auf den Regler */
  function hookVideo() {
    if (!SS.video || !SS.video.drawFrame || SS.video._kfHooked) return;
    SS.video._kfHooked = true;
    const orig = SS.video.drawFrame;
    SS.video.drawFrame = function (oc, outW, outH, t, cam) {
      SS._kfT = t;
      try { return orig.apply(this, arguments); }
      finally { SS._kfT = scrubT; }
    };
  }
  hookVideo();
  if (!SS.video || !SS.video.drawFrame) window.addEventListener('load', hookVideo);

  /* ---------------- Vorlagen ---------------- */
  const PRESETS = [
    { id: 'inLeft', name: 'Von links herein', mk: (d) => [
      { t: 0, dx: -140, dy: 0, sc: 100, rot: 0, a: 0, ease: 'out' },
      { t: Math.min(1.1, d * 0.35), dx: 0, dy: 0, sc: 100, rot: 0, a: 100, ease: 'linear' },
    ] },
    { id: 'grow', name: 'Aufziehen', mk: (d) => [
      { t: 0, dx: 0, dy: 0, sc: 40, rot: -6, a: 0, ease: 'back' },
      { t: Math.min(0.9, d * 0.3), dx: 0, dy: 0, sc: 100, rot: 0, a: 100, ease: 'linear' },
    ] },
    { id: 'driftOut', name: 'Sanft hinaus', mk: (d) => [
      { t: Math.max(0, d - 1.4), dx: 0, dy: 0, sc: 100, rot: 0, a: 100, ease: 'in' },
      { t: d, dx: 0, dy: -60, sc: 108, rot: 0, a: 0, ease: 'linear' },
    ] },
    { id: 'pass', name: 'Durchschwenken', mk: (d) => [
      { t: 0, dx: -160, dy: 0, sc: 100, rot: -4, a: 0, ease: 'out' },
      { t: d * 0.5, dx: 0, dy: 0, sc: 104, rot: 0, a: 100, ease: 'in' },
      { t: d, dx: 160, dy: 0, sc: 100, rot: 4, a: 0, ease: 'linear' },
    ] },
  ];

  /* ---------------- Bedienoberfläche ---------------- */
  const KF_TYPES = ['photo', 'text', 'sticker', 'emoji', 'video', 'blur'];
  let activeIdx = 0;

  const s1 = (v) => v.toFixed(1).replace('.', ',');

  function slider(body, label, v, min, max, step, onInput, onDone, fmt) {
    const d = document.createElement('div'); d.className = 'ctl';
    const s = document.createElement('span'); s.textContent = label;
    const r = document.createElement('input');
    r.type = 'range'; r.min = min; r.max = max; r.step = step; r.value = v;
    const out = document.createElement('span'); out.className = 'val';
    out.textContent = fmt ? fmt(v) : String(v);
    r.addEventListener('input', () => { out.textContent = fmt ? fmt(+r.value) : r.value; onInput(+r.value); });
    r.addEventListener('change', () => onDone && onDone(+r.value));
    d.appendChild(s); d.appendChild(r); d.appendChild(out);
    body.appendChild(d);
    return r;
  }

  function kfSection(sel, body) {
    const dur = (SS.video && SS.video.opts && SS.video.opts.dur) || 8;
    const h = document.createElement('h4');
    h.textContent = 'Bewegung im Video';
    body.appendChild(h);

    if (!SS.hasKf(sel)) {
      const hint = document.createElement('p');
      hint.className = 'hint';
      hint.style.margin = '0 0 8px';
      hint.textContent = 'Setze Punkte auf der Zeitachse — dazwischen bewegt sich das Element von selbst. Ersetzt die Animation aus der Liste.';
      body.appendChild(hint);

      const row = document.createElement('div');
      row.className = 'chips';
      for (const p of PRESETS) {
        const b = document.createElement('button');
        b.textContent = p.name;
        b.onclick = () => {
          sel.kf = p.mk(dur);
          activeIdx = 0;
          scrubT = 0; SS._kfT = 0;
          SS.pushHistory('Bewegung: ' + p.name);
          SS.ui.showProps(); SS.requestRender();
        };
        row.appendChild(b);
      }
      body.appendChild(row);

      const own = document.createElement('button');
      own.className = 'wide';
      own.textContent = 'Leeren Punkt bei 0 s setzen';
      own.onclick = () => {
        sel.kf = [{ t: 0, dx: 0, dy: 0, sc: 100, rot: 0, a: 100, ease: 'out' }];
        activeIdx = 0; scrubT = 0; SS._kfT = 0;
        SS.pushHistory('Bewegung angelegt');
        SS.ui.showProps(); SS.requestRender();
      };
      body.appendChild(own);
      return;
    }

    sel.kf.sort((a, b) => a.t - b.t);
    if (activeIdx >= sel.kf.length) activeIdx = sel.kf.length - 1;
    const cur = sel.kf[activeIdx];
    if (scrubT === null) { scrubT = cur.t; SS._kfT = cur.t; }

    /* Zeitachse mit Punkten */
    const bar = document.createElement('div');
    bar.className = 'kf-bar';
    const play = document.createElement('span');
    play.className = 'kf-play';
    play.style.left = Math.max(0, Math.min(100, (scrubT / dur) * 100)) + '%';
    bar.appendChild(play);
    sel.kf.forEach((k, i) => {
      const m = document.createElement('button');
      m.className = 'kf-mark' + (i === activeIdx ? ' on' : '');
      m.style.left = Math.max(0, Math.min(100, (k.t / dur) * 100)) + '%';
      m.title = s1(k.t) + ' s';
      m.onclick = () => {
        activeIdx = i; scrubT = k.t; SS._kfT = k.t;
        SS.ui.showProps(); SS.requestRender();
      };
      bar.appendChild(m);
    });
    body.appendChild(bar);

    const scale = document.createElement('div');
    scale.className = 'kf-scale';
    scale.innerHTML = '<span>0 s</span><span>' + s1(dur) + ' s</span>';
    body.appendChild(scale);

    /* Vorschau-Zeit */
    slider(body, 'Vorschau-Zeit', scrubT, 0, dur, 0.05,
      v => { scrubT = v; SS._kfT = v; SS.requestRender();
             play.style.left = Math.max(0, Math.min(100, (v / dur) * 100)) + '%'; },
      null, v => s1(v) + ' s');

    /* Punkt-Verwaltung */
    const rowA = document.createElement('div');
    rowA.className = 'chips';
    const setBtn = document.createElement('button');
    setBtn.textContent = 'Punkt hier setzen';
    setBtn.onclick = () => {
      const at = scrubT;
      const near = sel.kf.findIndex(k => Math.abs(k.t - at) < 0.03);
      const base = SS.kfAt(sel, at) || { dx: 0, dy: 0, sc: 100, rot: 0, a: 100 };
      const nk = { t: at, dx: val(base, 'dx'), dy: val(base, 'dy'), sc: val(base, 'sc'),
                   rot: val(base, 'rot'), a: val(base, 'a'), ease: 'out' };
      if (near >= 0) sel.kf[near] = nk; else sel.kf.push(nk);
      sel.kf.sort((a, b) => a.t - b.t);
      activeIdx = sel.kf.findIndex(k => k.t === at);
      SS.pushHistory('Punkt gesetzt');
      SS.ui.showProps(); SS.requestRender();
    };
    rowA.appendChild(setBtn);

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Punkt löschen';
    delBtn.onclick = () => {
      sel.kf.splice(activeIdx, 1);
      if (!sel.kf.length) delete sel.kf;
      activeIdx = 0;
      SS.pushHistory('Punkt gelöscht');
      SS.ui.showProps(); SS.requestRender();
    };
    rowA.appendChild(delBtn);

    const clr = document.createElement('button');
    clr.textContent = 'Alle löschen';
    clr.onclick = () => {
      delete sel.kf; activeIdx = 0; scrubT = null; SS._kfT = null;
      SS.pushHistory('Bewegung entfernt');
      SS.ui.showProps(); SS.requestRender();
    };
    rowA.appendChild(clr);
    body.appendChild(rowA);

    /* Werte des gewählten Punkts */
    const cap = document.createElement('p');
    cap.className = 'hint';
    cap.style.margin = '10px 0 2px';
    cap.textContent = 'Punkt ' + (activeIdx + 1) + ' von ' + sel.kf.length + ' bei ' + s1(cur.t) + ' s';
    body.appendChild(cap);

    const live = () => { SS._kfT = scrubT; SS.requestRender(); };
    const done = () => SS.pushHistory('Bewegung');

    slider(body, 'Zeitpunkt', cur.t, 0, dur, 0.05, v => {
      cur.t = v; scrubT = v; SS._kfT = v;
      play.style.left = Math.max(0, Math.min(100, (v / dur) * 100)) + '%';
      SS.requestRender();
    }, () => { sel.kf.sort((a, b) => a.t - b.t); activeIdx = sel.kf.indexOf(cur); done(); SS.ui.showProps(); },
      v => s1(v) + ' s');

    slider(body, 'Versatz ←→', val(cur, 'dx'), -200, 200, 1,
      v => { cur.dx = v; live(); }, done, v => Math.round(v) + ' %');
    slider(body, 'Versatz ↑↓', val(cur, 'dy'), -200, 200, 1,
      v => { cur.dy = v; live(); }, done, v => Math.round(v) + ' %');
    slider(body, 'Größe', val(cur, 'sc'), 10, 300, 1,
      v => { cur.sc = v; live(); }, done, v => Math.round(v) + ' %');
    slider(body, 'Drehung', val(cur, 'rot'), -180, 180, 1,
      v => { cur.rot = v; live(); }, done, v => Math.round(v) + '°');
    slider(body, 'Deckkraft', val(cur, 'a'), 0, 100, 1,
      v => { cur.a = v; live(); }, done, v => Math.round(v) + ' %');

    const es = document.createElement('div'); es.className = 'ctl';
    es.innerHTML = '<span>Kurve danach</span>';
    const seq = document.createElement('select');
    for (const [id, e] of Object.entries(EASE)) {
      const o = document.createElement('option');
      o.value = id; o.textContent = e.name;
      if ((cur.ease || 'out') === id) o.selected = true;
      seq.appendChild(o);
    }
    seq.onchange = () => { cur.ease = seq.value; done(); SS.requestRender(); };
    es.appendChild(seq);
    body.appendChild(es);

    const note = document.createElement('p');
    note.className = 'hint';
    note.textContent = 'Vor dem ersten und nach dem letzten Punkt hält das Element seinen Zustand. Die Animation aus der Liste ist währenddessen ausgeschaltet.';
    body.appendChild(note);
  }

  /* ---------------- Anhängen an die Eigenschaften ---------------- */
  const origShowProps = SS.ui && SS.ui.showProps;
  if (origShowProps) SS.ui.showProps = function () {
    origShowProps.apply(this, arguments);
    const sel = SS.getSel();
    if (!sel || SS.selCount() !== 1) return;
    if (KF_TYPES.indexOf(sel.type) < 0) return;
    const body = $('propsBody');
    if (!body) return;
    try { kfSection(sel, body); } catch (e) { console.warn('kf5', e); }
  };

  /* Auswahl gewechselt: Punktwahl zurücksetzen */
  const origSet = SS.setSel;
  SS.setSel = function () { activeIdx = 0; return origSet.apply(this, arguments); };
})();
