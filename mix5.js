/* ============================================================
   Seamless Studio 6.0 — Mischmodi, Clip-Übergänge, Tempo
     · Mischmodi für Fotos und Clips (Multiply, Screen, Overlay …)
     · Ein- und Ausblenden je Clip, damit Schnitte nicht hart sind
     · Abspieltempo je Clip, inklusive Zeitlupe
   Lädt nach clips5.js.
   ============================================================ */

(function () {
  const $ = (id) => document.getElementById(id);
  const st = SS.state;

  const BLEND = [
    ['source-over', 'Normal'],
    ['multiply', 'Multiplizieren'],
    ['screen', 'Negativ multipl.'],
    ['overlay', 'Ineinander'],
    ['soft-light', 'Weiches Licht'],
    ['hard-light', 'Hartes Licht'],
    ['color-burn', 'Nachbelichten'],
    ['color-dodge', 'Abwedeln'],
    ['difference', 'Differenz'],
    ['luminosity', 'Luminanz'],
  ];

  /* ================= Mischmodus beim Zeichnen =================
     Angewendet wird er in render.js direkt im Zeichendurchgang
     (`c.globalCompositeOperation = el.blend`), damit die Ebenen-
     folge unangetastet bleibt. Hier steht nur die Bedienung. */

  /* ================= Clip: Übergänge und Tempo ================= */

  if (SS.drawVideoEl) {
    const origVid = SS.drawVideoEl;
    SS.drawVideoEl = function (c, el) {
      const t = SS.animT || 0;
      const t0 = el.tIn || 0;
      const len = SS.clipLen ? SS.clipLen(el) : 3;
      const fi = el.fadeIn || 0, fo = el.fadeOut || 0;
      let a = 1;
      if (fi > 0 && t < t0 + fi) a = Math.max(0, (t - t0) / fi);
      if (fo > 0 && t > t0 + len - fo) a = Math.min(a, Math.max(0, (t0 + len - t) / fo));
      if (a >= 1) return origVid.call(this, c, el);
      c.save();
      c.globalAlpha = (el.opacity ?? 1) * a;
      origVid.call(this, c, Object.assign({}, el, { opacity: 1 }));
      c.restore();
    };
  }

  const origSync = SS.syncVideoEls;
  if (origSync) {
    SS.syncVideoEls = function (t, playing) {
      origSync.apply(this, arguments);
      for (const el of st.elements) {
        if (el.type !== 'video') continue;
        const rec = SS.videos && SS.videos[el.vidId];
        if (rec && rec.el) {
          const r = el.speed || 1;
          if (rec.el.playbackRate !== r) { try { rec.el.playbackRate = r; } catch (e) {} }
        }
      }
    };
  }

  /* ================= Bedienung ================= */

  function h4(t) { const e = document.createElement('h4'); e.textContent = t; return e; }

  function slider(body, label, val, min, max, step, onInput, onDone, fmt) {
    const d = document.createElement('div'); d.className = 'ctl';
    const s = document.createElement('span'); s.textContent = label;
    const r = document.createElement('input');
    r.type = 'range'; r.min = min; r.max = max; r.step = step; r.value = val;
    const v = document.createElement('span'); v.className = 'val';
    v.textContent = fmt ? fmt(val) : val;
    r.addEventListener('input', () => { v.textContent = fmt ? fmt(+r.value) : r.value; onInput(+r.value); });
    r.addEventListener('change', () => onDone && onDone());
    d.appendChild(s); d.appendChild(r); d.appendChild(v);
    body.appendChild(d);
  }

  function blendSection(sel, body) {
    body.appendChild(h4('Mischmodus'));
    const row = document.createElement('div');
    row.className = 'chips';
    for (const [id, name] of BLEND) {
      const b = document.createElement('button');
      b.textContent = name;
      if ((sel.blend || 'source-over') === id) b.classList.add('sel');
      b.onclick = () => {
        sel.blend = id;
        [...row.children].forEach(x => x.classList.remove('sel'));
        b.classList.add('sel');
        SS.pushHistory('Mischmodus');
        SS.requestRender();
      };
      row.appendChild(b);
    }
    body.appendChild(row);
    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.textContent = 'Multiplizieren dunkelt, Negativ multiplizieren hellt auf. Gut für Texturen, Lichtflecken und Farbstiche über dem Bild.';
    body.appendChild(hint);
  }

  function clipMotion(sel, body) {
    const live = () => SS.requestRender();
    const done = () => SS.pushHistory('Clip-Übergang');
    body.appendChild(h4('Übergang und Tempo'));
    slider(body, 'Einblenden', sel.fadeIn || 0, 0, 2, 0.1,
      v => { sel.fadeIn = v; live(); }, done, v => v.toFixed(1).replace('.', ',') + ' s');
    slider(body, 'Ausblenden', sel.fadeOut || 0, 0, 2, 0.1,
      v => { sel.fadeOut = v; live(); }, done, v => v.toFixed(1).replace('.', ',') + ' s');
    slider(body, 'Tempo', sel.speed || 1, 0.25, 3, 0.05,
      v => { sel.speed = v; live(); }, done, v => v.toFixed(2).replace('.', ',') + '×');
    const p = document.createElement('p');
    p.className = 'hint';
    p.textContent = 'Unter 1× wird es Zeitlupe, über 1× Zeitraffer. Ein- und Ausblenden verhindert harte Schnitte zwischen zwei Clips.';
    body.appendChild(p);
  }

  const origShowProps = SS.ui && SS.ui.showProps;
  if (origShowProps) SS.ui.showProps = function () {
    origShowProps.apply(this, arguments);
    const sel = SS.getSel();
    if (!sel || SS.selCount() !== 1) return;
    const body = $('propsBody');
    if (!body) return;
    if (sel.type === 'video') clipMotion(sel, body);
    if (sel.type === 'photo' || sel.type === 'video' || sel.type === 'sticker') blendSection(sel, body);
  };

  SS.MIX5 = true;
})();
