/* ============================================================
   Seamless Studio 5.0 — Untertitel
   Von Hand getimte Zeilen mit Wort-für-Wort-Hervorhebung.
   Zeichnet in V.drawFrame, gilt also für Vorschau und Export
   gleichermaßen. Die Zeilen wandern mit dem Projekt.
   Lädt nach video.js.
   ============================================================ */

(function () {
  const $ = (id) => document.getElementById(id);
  if (!SS.video || !SS.video.drawFrame) return;
  const V = SS.video;

  /* ================= Daten ================= */

  SS.captions = SS.captions || [];
  SS.capStyle = SS.capStyle || { style: 'karaoke', size: 46, pos: 78, color: '#FAF7F2', hi: '#C8553D' };

  const origSerialize = SS.serialize;
  SS.serialize = function () {
    const d = JSON.parse(origSerialize.apply(this, arguments));
    d.captions = SS.captions;
    d.capStyle = SS.capStyle;
    return JSON.stringify(d);
  };
  const origRestore = SS.restore;
  SS.restore = function (snap) {
    try {
      const d = JSON.parse(snap);
      SS.captions = Array.isArray(d.captions) ? d.captions : [];
      if (d.capStyle) SS.capStyle = d.capStyle;
    } catch (e) {}
    origRestore.apply(this, arguments);
    renderList();
  };

  const fmt = (t) => t.toFixed(1).replace('.', ',') + ' s';

  /* ================= Zeichnen ================= */

  function wrap(oc, text, maxW) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let cur = [];
    for (const w of words) {
      const test = cur.concat([w]).join(' ');
      if (cur.length && oc.measureText(test).width > maxW) { lines.push(cur); cur = [w]; }
      else cur.push(w);
    }
    if (cur.length) lines.push(cur);
    return lines;
  }

  function drawCaptions(oc, outW, outH, t) {
    const list = SS.captions;
    if (!list || !list.length) return;
    const cur = list.find(c => t >= c.t0 && t < c.t1);
    if (!cur || !cur.text) return;

    const S = SS.capStyle;
    const size = Math.round(outH * (S.size / 1000));
    const pad = Math.round(size * 0.42);
    const maxW = outW * 0.84;

    oc.save();
    oc.setTransform(1, 0, 0, 1, 0, 0);
    oc.font = `600 ${size}px Poppins, system-ui, sans-serif`;
    oc.textAlign = 'center';
    oc.textBaseline = 'middle';

    const lines = wrap(oc, cur.text, maxW);
    const lh = size * 1.28;
    const total = lines.length * lh;
    let y = outH * (S.pos / 100) - total / 2 + lh / 2;

    /* Wort-für-Wort: die Zeilendauer gleichmäßig auf die Wörter verteilen */
    const allWords = lines.reduce((a, l) => a + l.length, 0);
    const span = Math.max(0.001, cur.t1 - cur.t0);
    const spoken = Math.floor(((t - cur.t0) / span) * allWords);

    let idx = 0;
    for (const words of lines) {
      const text = words.join(' ');
      const w = oc.measureText(text).width;

      if (S.style === 'balken') {
        oc.fillStyle = 'rgba(20,17,15,.72)';
        oc.fillRect((outW - w) / 2 - pad, y - lh / 2, w + pad * 2, lh);
      } else {
        oc.shadowColor = 'rgba(0,0,0,.6)';
        oc.shadowBlur = size * 0.22;
        oc.shadowOffsetY = size * 0.04;
      }

      if (S.style === 'karaoke') {
        /* Wörter einzeln setzen, das gerade gesprochene farbig hinterlegt */
        const sp = oc.measureText(' ').width;
        let x = (outW - w) / 2;
        for (const word of words) {
          const ww = oc.measureText(word).width;
          const on = idx === spoken;
          if (on) {
            oc.save();
            oc.shadowColor = 'transparent';
            oc.fillStyle = S.hi;
            oc.fillRect(x - sp * 0.4, y - lh * 0.42, ww + sp * 0.8, lh * 0.84);
            oc.restore();
          }
          oc.fillStyle = S.color;
          oc.textAlign = 'left';
          oc.fillText(word, x, y);
          x += ww + sp;
          idx++;
        }
        oc.textAlign = 'center';
      } else {
        oc.fillStyle = S.color;
        oc.fillText(text, outW / 2, y);
        idx += words.length;
      }
      oc.shadowColor = 'transparent';
      y += lh;
    }
    oc.restore();
  }

  const origDraw = V.drawFrame;
  V.drawFrame = function (oc, outW, outH, t, cam) {
    origDraw.apply(this, arguments);
    try { drawCaptions(oc, outW, outH, t); } catch (e) {}
  };

  /* ================= Bedienung ================= */

  const panel = $('panel-video');
  if (!panel) return;

  const box = document.createElement('div');
  const h3 = document.createElement('h3');
  h3.textContent = 'Untertitel';
  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent = 'Rund vier von fünf sehen Reels ohne Ton. Setze die Zeit mit dem Vorschau-Regler und tippe „Zeile hier einsetzen".';
  const list = document.createElement('div');
  list.id = 'capList';
  list.style.display = 'grid';
  list.style.gap = '8px';

  const addBtn = document.createElement('button');
  addBtn.className = 'wide primary';
  addBtn.textContent = 'Zeile hier einsetzen';

  const styleRow = document.createElement('div');
  styleRow.className = 'chips';
  const posCtl = document.createElement('div');

  box.appendChild(h3); box.appendChild(hint); box.appendChild(list);
  box.appendChild(addBtn); box.appendChild(styleRow); box.appendChild(posCtl);

  /* vor dem Export-Knopf einhängen */
  const anchor = $('vidExport');
  panel.insertBefore(box, anchor ? anchor.previousElementSibling : null);

  const now = () => (V.player && typeof V.player.t === 'number') ? V.player.t : 0;
  const dur = () => (V.player && V.player.dur) || +($('vidDur') ? $('vidDur').value : 8) || 8;

  function touch(label) {
    SS.pushHistory(label || 'Untertitel');
    V.refresh && V.refresh(true);
  }

  function numField(val, min, max, onChange) {
    const i = document.createElement('input');
    i.type = 'number';
    i.step = '0.1'; i.min = min; i.max = max; i.value = val.toFixed(1);
    i.style.width = '62px';
    i.style.padding = '7px 8px';
    i.style.borderRadius = '4px';
    i.style.border = '1px solid var(--line)';
    i.style.background = 'var(--bg2)';
    i.style.color = 'var(--ink)';
    i.style.fontSize = '12px';
    i.onchange = () => onChange(Math.max(min, Math.min(max, +i.value || 0)));
    return i;
  }

  function renderList() {
    if (!list) return;
    list.innerHTML = '';
    SS.captions.sort((a, b) => a.t0 - b.t0);
    if (!SS.captions.length) {
      const p = document.createElement('p');
      p.className = 'hint';
      p.style.margin = '0';
      p.textContent = 'Noch keine Zeile.';
      list.appendChild(p);
      return;
    }
    SS.captions.forEach((c, i) => {
      const row = document.createElement('div');
      row.style.display = 'grid';
      row.style.gap = '6px';
      row.style.border = '1px solid var(--line)';
      row.style.padding = '9px';

      const top = document.createElement('div');
      top.style.display = 'flex';
      top.style.gap = '6px';
      top.style.alignItems = 'center';

      const ta = document.createElement('input');
      ta.type = 'text';
      ta.value = c.text || '';
      ta.placeholder = 'Text dieser Zeile';
      ta.style.flex = '1';
      ta.style.minWidth = '0';
      ta.style.padding = '8px';
      ta.style.borderRadius = '4px';
      ta.style.border = '1px solid var(--line)';
      ta.style.background = 'var(--bg2)';
      ta.style.color = 'var(--ink)';
      ta.style.fontSize = '13px';
      ta.oninput = () => { c.text = ta.value; V.refresh && V.refresh(true); };
      ta.onchange = () => touch('Untertitel-Text');

      const del = document.createElement('button');
      del.className = 'lp-ico';
      del.title = 'Zeile löschen';
      del.innerHTML = '<svg><use href="#i-trash"></use></svg>';
      del.style.color = 'var(--danger)';
      del.onclick = () => { SS.captions.splice(i, 1); renderList(); touch('Zeile gelöscht'); };

      top.appendChild(ta); top.appendChild(del);

      const times = document.createElement('div');
      times.style.display = 'flex';
      times.style.gap = '6px';
      times.style.alignItems = 'center';
      times.style.fontSize = '11px';
      times.style.color = 'var(--ink-soft)';

      const lab1 = document.createElement('span'); lab1.textContent = 'von';
      const lab2 = document.createElement('span'); lab2.textContent = 'bis';
      const f1 = numField(c.t0, 0, dur(), v => { c.t0 = Math.min(v, c.t1 - 0.2); renderList(); touch('Untertitel-Zeit'); });
      const f2 = numField(c.t1, 0, dur(), v => { c.t1 = Math.max(v, c.t0 + 0.2); renderList(); touch('Untertitel-Zeit'); });

      const setNow = document.createElement('button');
      setNow.className = 'chip-btn';
      setNow.style.flex = '0 0 auto';
      setNow.textContent = 'Start = jetzt';
      setNow.onclick = () => {
        const t = now();
        c.t1 = Math.max(t + 0.6, c.t1 - c.t0 + t);
        c.t0 = t;
        renderList(); touch('Untertitel-Zeit');
      };

      times.appendChild(lab1); times.appendChild(f1);
      times.appendChild(lab2); times.appendChild(f2);
      times.appendChild(setNow);

      row.appendChild(top); row.appendChild(times);
      list.appendChild(row);
    });
  }

  addBtn.onclick = () => {
    const t = now();
    const end = Math.min(dur(), t + 2.4);
    SS.captions.push({ t0: t, t1: Math.max(end, t + 0.8), text: '' });
    renderList();
    touch('Zeile eingesetzt');
    const inputs = list.querySelectorAll('input[type=text]');
    if (inputs.length) inputs[inputs.length - 1].focus();
  };

  (function buildStyle() {
    const opts = [['karaoke', 'Wort hervorheben'], ['schatten', 'Weißer Text'], ['balken', 'Auf Balken']];
    for (const [id, name] of opts) {
      const b = document.createElement('button');
      b.textContent = name;
      if (SS.capStyle.style === id) b.classList.add('sel');
      b.onclick = () => {
        SS.capStyle.style = id;
        [...styleRow.children].forEach(x => x.classList.remove('sel'));
        b.classList.add('sel');
        touch('Untertitel-Stil');
      };
      styleRow.appendChild(b);
    }

    const mk = (label, key, min, max, unit) => {
      const d = document.createElement('div'); d.className = 'ctl';
      const s = document.createElement('span'); s.textContent = label;
      const r = document.createElement('input');
      r.type = 'range'; r.min = min; r.max = max; r.value = SS.capStyle[key];
      const v = document.createElement('span'); v.className = 'val';
      v.textContent = SS.capStyle[key] + (unit || '');
      r.oninput = () => {
        SS.capStyle[key] = +r.value;
        v.textContent = r.value + (unit || '');
        V.refresh && V.refresh(true);
      };
      r.onchange = () => touch('Untertitel-Stil');
      d.appendChild(s); d.appendChild(r); d.appendChild(v);
      posCtl.appendChild(d);
    };
    mk('Schriftgröße', 'size', 26, 80);
    mk('Höhe', 'pos', 50, 92, ' %');
  })();

  renderList();
  SS.ui.refreshCaptions = renderList;
})();
