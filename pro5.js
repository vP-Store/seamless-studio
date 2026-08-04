/* ============================================================
   Seamless Studio 5.0 — Profi-Werkzeuge
     · eigene Schriften laden (offline, FontFace)
     · Master-Elemente über alle Slides: Zähler, Fortschritts-
       balken, Wisch-Pfeil
     · Langtext automatisch auf die Slides verteilen
     · Overlay-Texturen: Halation, Light Leak, Bloom, Staub
     · Alt-Texte je Slide und Kontrastprüfer
     · Teleprompter für die Voiceover-Aufnahme
   Lädt nach ui.js, render.js und video.js.
   ============================================================ */

(function () {
  const $ = (id) => document.getElementById(id);
  const st = SS.state;

  /* ================= im Projekt mitsichern ================= */

  st.master = st.master || { counter: false, bar: false, arrow: false, color: '#FAF7F2' };
  st.overlayTex = st.overlayTex || { id: 'none', amount: 40 };
  st.alt = st.alt || [];

  const origSerialize = SS.serialize;
  SS.serialize = function () {
    const d = JSON.parse(origSerialize.apply(this, arguments));
    d.master = st.master; d.overlayTex = st.overlayTex; d.alt = st.alt;
    return JSON.stringify(d);
  };
  const origRestore = SS.restore;
  SS.restore = function (snap) {
    try {
      const d = JSON.parse(snap);
      if (d.master) st.master = d.master;
      if (d.overlayTex) st.overlayTex = d.overlayTex;
      st.alt = Array.isArray(d.alt) ? d.alt : [];
    } catch (e) {}
    origRestore.apply(this, arguments);
  };

  const touch = (label) => { SS.bgCacheInvalidate && SS.bgCacheInvalidate(); SS.pushHistory(label); SS.requestRender(); };

  /* ================= Overlay-Texturen ================= */

  const TEX = [
    ['none', 'Keine'],
    ['halation', 'Halation'],
    ['leak', 'Light Leak'],
    ['bloom', 'Bloom'],
    ['staub', 'Staub'],
  ];

  function paintOverlay(c, W, H) {
    const o = st.overlayTex;
    if (!o || o.id === 'none') return;
    const a = (o.amount || 40) / 100;
    c.save();
    if (o.id === 'halation') {
      /* Lichter aufblühen lassen: warmer Schein aus der Bildmitte heraus */
      c.globalCompositeOperation = 'screen';
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, `rgba(255,196,140,${(0.16 * a).toFixed(3)})`);
      g.addColorStop(0.55, `rgba(255,150,110,${(0.05 * a).toFixed(3)})`);
      g.addColorStop(1, 'rgba(255,120,90,0)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    } else if (o.id === 'leak') {
      c.globalCompositeOperation = 'screen';
      const n = Math.max(2, Math.round(W / H));
      for (let i = 0; i < n; i++) {
        const x = (i + 0.5) / n * W + Math.sin(i * 2.3) * W * 0.06;
        const g = c.createRadialGradient(x, H * 0.15, 0, x, H * 0.15, H * 0.9);
        g.addColorStop(0, `rgba(255,170,110,${(0.3 * a).toFixed(3)})`);
        g.addColorStop(0.5, `rgba(220,90,80,${(0.1 * a).toFixed(3)})`);
        g.addColorStop(1, 'rgba(200,60,60,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
      }
    } else if (o.id === 'bloom') {
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = `rgba(255,248,236,${(0.07 * a).toFixed(3)})`;
      c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'screen';
      const g = c.createRadialGradient(W / 2, H * 0.4, H * 0.1, W / 2, H * 0.4, Math.max(W, H) * 0.6);
      g.addColorStop(0, `rgba(255,255,255,${(0.12 * a).toFixed(3)})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    } else if (o.id === 'staub') {
      c.globalCompositeOperation = 'screen';
      let s = 12345;
      const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
      const n = Math.round(W * H / 90000);
      for (let i = 0; i < n; i++) {
        const x = rnd() * W, y = rnd() * H, r = Math.min(W, H) * (0.0006 + rnd() * 0.0025);
        c.fillStyle = `rgba(255,250,240,${(0.5 * a * rnd()).toFixed(3)})`;
        c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      }
      c.globalCompositeOperation = 'multiply';
      for (let i = 0; i < n / 3; i++) {
        const x = rnd() * W, y = rnd() * H, l = Math.min(W, H) * (0.01 + rnd() * 0.05);
        c.strokeStyle = `rgba(60,45,35,${(0.18 * a).toFixed(3)})`;
        c.lineWidth = Math.max(1, Math.min(W, H) * 0.0008);
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + l, y + (rnd() - 0.5) * l); c.stroke();
      }
    }
    c.restore();
  }

  /* ================= Master-Elemente ================= */

  function paintMaster(c, W, H) {
    const m = st.master;
    if (!m || (!m.counter && !m.bar && !m.arrow)) return;
    const { slideW, n } = SS.canvasSize();
    if (n < 2) return;
    const u = H / 1350;
    c.save();
    for (let i = 0; i < n; i++) {
      const x0 = i * slideW;
      if (m.counter) {
        c.font = `600 ${Math.round(30 * u)}px Poppins, sans-serif`;
        c.textAlign = 'right'; c.textBaseline = 'top';
        c.fillStyle = 'rgba(20,17,15,.42)';
        c.fillText(`${i + 1} / ${n}`, x0 + slideW - 44 * u + 2 * u, 42 * u + 2 * u);
        c.fillStyle = m.color || '#FAF7F2';
        c.fillText(`${i + 1} / ${n}`, x0 + slideW - 44 * u, 42 * u);
      }
      if (m.bar) {
        const bw = slideW - 88 * u, bh = 5 * u, by = H - 56 * u;
        c.fillStyle = 'rgba(250,247,242,.28)';
        c.fillRect(x0 + 44 * u, by, bw, bh);
        c.fillStyle = m.color || '#FAF7F2';
        c.fillRect(x0 + 44 * u, by, bw * ((i + 1) / n), bh);
      }
      if (m.arrow && i < n - 1) {
        const ax = x0 + slideW - 60 * u, ay = H / 2;
        c.strokeStyle = m.color || '#FAF7F2';
        c.lineWidth = 5 * u; c.lineCap = 'round'; c.lineJoin = 'round';
        c.globalAlpha = 0.9;
        c.beginPath();
        c.moveTo(ax - 14 * u, ay - 18 * u); c.lineTo(ax + 4 * u, ay); c.lineTo(ax - 14 * u, ay + 18 * u);
        c.stroke();
        c.globalAlpha = 1;
      }
    }
    c.restore();
  }

  const origPaint = SS.paintScene;
  SS.paintScene = function (c, W, H, opts) {
    origPaint.apply(this, arguments);
    try { paintOverlay(c, W, H); paintMaster(c, W, H); } catch (e) {}
  };

  /* ================= Bedienung: Text-Panel ================= */

  const textPanel = $('panel-text');
  if (textPanel) {
    const h = document.createElement('h3');
    h.textContent = 'Eigene Schrift';
    const lab = document.createElement('label');
    lab.className = 'wide btn-like';
    lab.textContent = 'Schriftdatei laden (TTF, OTF, WOFF2)';
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.ttf,.otf,.woff,.woff2,font/*';
    inp.className = 'file-overlay';
    lab.appendChild(inp);
    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.textContent = 'Bleibt auf deinem Gerät und steht danach in der Schriftliste. Für dieses Projekt geladen, nicht dauerhaft gespeichert.';

    inp.addEventListener('change', async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      try {
        const name = f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Eigene Schrift';
        const face = new FontFace(name, await f.arrayBuffer());
        await face.load();
        document.fonts.add(face);
        SS.FONTS = SS.FONTS || [];
        if (SS.FONTS.indexOf(name) < 0) SS.FONTS.push(name);
        if (SS.FONT_GROUPS) {
          let g = SS.FONT_GROUPS.find(x => x.name === 'Eigene');
          if (!g) { g = { name: 'Eigene', fonts: [] }; SS.FONT_GROUPS.push(g); }
          if (g.fonts.indexOf(name) < 0) g.fonts.push(name);
        }
        const fp = $('fontPreviews');
        if (fp) {
          const d = document.createElement('div');
          d.style.fontFamily = `"${name}"`;
          d.textContent = name;
          d.onclick = () => {
            const sel = SS.getSel();
            if (sel && sel.type === 'text') { sel.font = name; SS.pushHistory('Schrift'); SS.ui.showProps(); SS.requestRender(); }
            else SS.toast('Wähle zuerst ein Textfeld', 2400, 'warn');
          };
          fp.appendChild(d);
        }
        SS.toast('Schrift „' + name + '" geladen', 2600, 'ok');
      } catch (err) {
        SS.toast('Diese Schriftdatei konnte nicht gelesen werden', 3200, 'err');
      }
      e.target.value = '';
    });

    const h2 = document.createElement('h3');
    h2.textContent = 'Langtext verteilen';
    const ta = document.createElement('textarea');
    ta.placeholder = 'Ganzen Text hier einfügen — die App verteilt ihn auf die Slides.';
    ta.style.width = '100%';
    ta.style.minHeight = '76px';
    ta.style.padding = '10px';
    ta.style.borderRadius = '4px';
    ta.style.border = '1px solid var(--line)';
    ta.style.background = 'var(--bg2)';
    ta.style.color = 'var(--ink)';
    ta.style.fontSize = '13px';
    ta.style.resize = 'vertical';
    const spread = document.createElement('button');
    spread.className = 'wide primary';
    spread.textContent = 'Auf Slides verteilen';
    spread.onclick = () => {
      const raw = ta.value.trim();
      if (!raw) return SS.toast('Erst Text einfügen', 2200, 'warn');
      const { slideW, H, n } = SS.canvasSize();
      /* an Sätzen trennen, dann gleichmäßig auf die Slides verteilen */
      const parts = raw.split(/(?<=[.!?…])\s+|\n+/).map(s => s.trim()).filter(Boolean);
      const per = Math.max(1, Math.ceil(parts.length / n));
      let made = 0;
      for (let i = 0; i < n; i++) {
        const chunk = parts.slice(i * per, (i + 1) * per).join(' ');
        if (!chunk) break;
        const el = {
          id: SS.uid(), type: 'text', content: chunk,
          x: i * slideW + slideW / 2, y: H / 2,
          size: Math.round(H * 0.045), font: 'Lora', color: '#2F2A26',
          align: 'center', rot: 0, opacity: 1, maxW: slideW * 0.76,
          lineHeight: 1.35,
        };
        SS.normalizeEl(el);
        st.elements.push(el);
        made++;
      }
      ta.value = '';
      SS.pushHistory('Text verteilt');
      SS.ui.refreshLayers && SS.ui.refreshLayers();
      SS.requestRender();
      SS.toast(made + ' Textfelder eingesetzt — jetzt Schrift und Farbe anpassen', 3200, 'ok');
    };

    textPanel.appendChild(h); textPanel.appendChild(lab); textPanel.appendChild(hint);
    textPanel.appendChild(h2); textPanel.appendChild(ta); textPanel.appendChild(spread);
  }

  /* ================= Bedienung: Studio-Panel ================= */

  const studio = $('panel-layout');
  if (studio) {
    /* v7.6: Die Abschnitte „Über alle Slides" und „Filmlook über alles" sind
       auf Scotts Wunsch aus dem Studio-Panel entfernt. Zeichnen (paintMaster/
       paintOverlay) und Sichern bleiben erhalten, damit alte Projekte mit
       gesetzten Werten unverändert aussehen – es gibt nur keine Regler mehr. */
    if (false) {
    /* --- Master-Elemente --- */
    const h = document.createElement('h3');
    h.textContent = 'Über alle Slides';
    const row = document.createElement('div');
    row.className = 'chips';
    const mk = (label, key) => {
      const b = document.createElement('button');
      b.textContent = label;
      if (st.master[key]) b.classList.add('sel');
      b.onclick = () => {
        st.master[key] = !st.master[key];
        b.classList.toggle('sel', st.master[key]);
        touch('Master-Element');
      };
      row.appendChild(b);
    };
    mk('Zähler 1/5', 'counter');
    mk('Fortschritt', 'bar');
    mk('Wisch-Pfeil', 'arrow');

    const colRow = document.createElement('div');
    colRow.className = 'ctl';
    const colLab = document.createElement('span'); colLab.textContent = 'Farbe';
    const col = document.createElement('input');
    col.type = 'color'; col.value = st.master.color || '#FAF7F2';
    col.oninput = () => { st.master.color = col.value; SS.requestRender(); };
    col.onchange = () => touch('Master-Farbe');
    colRow.appendChild(colLab); colRow.appendChild(col);

    const mHint = document.createElement('p');
    mHint.className = 'hint';
    mHint.textContent = 'Liegt auf jeder Slide an derselben Stelle. Der Pfeil verschwindet auf der letzten Slide von selbst.';

    /* --- Overlay-Texturen --- */
    const h2 = document.createElement('h3');
    h2.textContent = 'Filmlook über alles';
    const texRow = document.createElement('div');
    texRow.className = 'chips';
    for (const [id, name] of TEX) {
      const b = document.createElement('button');
      b.textContent = name;
      if (st.overlayTex.id === id) b.classList.add('sel');
      b.onclick = () => {
        st.overlayTex.id = id;
        [...texRow.children].forEach(x => x.classList.remove('sel'));
        b.classList.add('sel');
        touch('Filmlook');
      };
      texRow.appendChild(b);
    }
    const amt = document.createElement('div');
    amt.className = 'ctl';
    const aLab = document.createElement('span'); aLab.textContent = 'Stärke';
    const aR = document.createElement('input');
    aR.type = 'range'; aR.min = 5; aR.max = 100; aR.value = st.overlayTex.amount;
    const aV = document.createElement('span'); aV.className = 'val'; aV.textContent = st.overlayTex.amount;
    aR.oninput = () => { st.overlayTex.amount = +aR.value; aV.textContent = aR.value; SS.requestRender(); };
    aR.onchange = () => touch('Filmlook');
    amt.appendChild(aLab); amt.appendChild(aR); amt.appendChild(aV);

    const tHint = document.createElement('p');
    tHint.className = 'hint';
    tHint.textContent = 'Läuft über alle Slides hinweg und kaschiert die Schnittkanten — genau dafür ist der Analog-Look gut.';

    studio.appendChild(h); studio.appendChild(row); studio.appendChild(colRow); studio.appendChild(mHint);
    studio.appendChild(h2); studio.appendChild(texRow); studio.appendChild(amt); studio.appendChild(tHint);
    }

    /* --- Alt-Texte und Kontrast --- */
    const h3 = document.createElement('h3');
    h3.textContent = 'Barrierefreiheit';
    const altBox = document.createElement('div');
    altBox.style.display = 'grid';
    altBox.style.gap = '6px';
    const contrast = document.createElement('p');
    contrast.className = 'hint';

    function luminance(hex) {
      const h = String(hex).replace('#', '');
      if (h.length < 6) return 1;
      const v = [0, 2, 4].map(i => {
        const c = parseInt(h.slice(i, i + 2), 16) / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
    }
    function checkContrast() {
      const texts = st.elements.filter(e => e.type === 'text' && !e.hidden);
      if (!texts.length) { contrast.textContent = 'Noch kein Text auf der Leinwand.'; return; }
      const bad = [];
      for (const t of texts) {
        const bg = t.bgColor && t.bgStyle && t.bgStyle !== 'none' ? t.bgColor : '#F5EFE6';
        const l1 = luminance(t.color || '#000000'), l2 = luminance(bg);
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        if (ratio < 3) bad.push((SS.elName(t) || 'Text') + ' (' + ratio.toFixed(1) + ':1)');
      }
      contrast.textContent = bad.length
        ? 'Zu wenig Kontrast: ' + bad.join(', ') + ' — ab 3:1 ist großer Text gut lesbar.'
        : 'Kontrast in Ordnung: alle Textfelder über 3:1.';
    }

    function renderAlt() {
      const { n } = SS.canvasSize();
      altBox.innerHTML = '';
      for (let i = 0; i < n; i++) {
        const r = document.createElement('div');
        r.className = 'ctl';
        const s = document.createElement('span');
        s.textContent = 'Slide ' + (i + 1);
        s.style.width = '58px';
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.placeholder = 'Was ist zu sehen?';
        inp.value = st.alt[i] || '';
        inp.style.flex = '1';
        inp.style.minWidth = '0';
        inp.style.padding = '8px';
        inp.style.borderRadius = '4px';
        inp.style.border = '1px solid var(--line)';
        inp.style.background = 'var(--bg2)';
        inp.style.color = 'var(--ink)';
        inp.style.fontSize = '12px';
        inp.oninput = () => { st.alt[i] = inp.value; };
        inp.onchange = () => SS.pushHistory('Alt-Text');
        r.appendChild(s); r.appendChild(inp);
        altBox.appendChild(r);
      }
    }

    const altSave = document.createElement('button');
    altSave.className = 'wide';
    altSave.textContent = 'Alt-Texte als Datei sichern';
    altSave.onclick = () => {
      const { n } = SS.canvasSize();
      let out = 'Alt-Texte – beim Hochladen bei Instagram unter „Barrierefreiheit" einfügen\r\n\r\n';
      for (let i = 0; i < n; i++) out += 'Slide ' + (i + 1) + ': ' + (st.alt[i] || '—') + '\r\n';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([out], { type: 'text/plain' }));
      a.download = 'Alt-Texte.txt';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 8000);
    };
    const cBtn = document.createElement('button');
    cBtn.className = 'wide';
    cBtn.textContent = 'Kontrast prüfen';
    cBtn.onclick = checkContrast;

    studio.appendChild(h3); studio.appendChild(altBox);
    studio.appendChild(altSave); studio.appendChild(cBtn); studio.appendChild(contrast);
    renderAlt();
    SS.ui.refreshAlt = renderAlt;

    const origSync = SS.ui.syncTop;
    SS.ui.syncTop = function () { origSync.apply(this, arguments); renderAlt(); };
  }

  /* ================= Teleprompter ================= */

  const vidPanel = $('panel-video');
  if (vidPanel && $('vidRec')) {
    const h = document.createElement('h3');
    h.textContent = 'Teleprompter';
    const ta = document.createElement('textarea');
    ta.placeholder = 'Text, den du sprechen willst …';
    ta.style.width = '100%';
    ta.style.minHeight = '64px';
    ta.style.padding = '10px';
    ta.style.borderRadius = '4px';
    ta.style.border = '1px solid var(--line)';
    ta.style.background = 'var(--bg2)';
    ta.style.color = 'var(--ink)';
    ta.style.fontSize = '13px';
    const start = document.createElement('button');
    start.className = 'wide';
    start.textContent = 'Teleprompter starten';

    const box = document.createElement('div');
    box.id = 'promptBox';
    box.className = 'hidden';
    box.style.cssText = 'position:fixed;inset:auto 0 0 0;top:0;z-index:80;background:rgba(20,17,15,.92);' +
      'backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;padding:40px 28px;';
    const inner = document.createElement('div');
    inner.style.cssText = 'max-width:720px;font-size:30px;line-height:1.5;color:#F5F0E9;text-align:center;' +
      'font-family:Poppins,system-ui,sans-serif;white-space:pre-wrap;';
    const close = document.createElement('button');
    close.textContent = '✕';
    close.style.cssText = 'position:absolute;top:16px;right:16px;width:40px;height:40px;border-radius:4px;' +
      'border:1px solid #4E463F;color:#F5F0E9;background:transparent;font-size:15px;';
    const speedRow = document.createElement('div');
    speedRow.style.cssText = 'position:absolute;bottom:20px;left:50%;transform:translateX(-50%);display:flex;' +
      'gap:10px;align-items:center;color:#8A8078;font-size:12px;font-family:Poppins,sans-serif;';
    const sp = document.createElement('input');
    sp.type = 'range'; sp.min = 10; sp.max = 90; sp.value = 34;
    speedRow.appendChild(Object.assign(document.createElement('span'), { textContent: 'Tempo' }));
    speedRow.appendChild(sp);
    box.appendChild(inner); box.appendChild(close); box.appendChild(speedRow);
    document.body.appendChild(box);

    let raf = null, y = 0;
    const stop = () => { box.classList.add('hidden'); if (raf) cancelAnimationFrame(raf); raf = null; };
    close.onclick = stop;
    start.onclick = () => {
      const text = ta.value.trim();
      if (!text) return SS.toast('Erst den Text eintippen', 2200, 'warn');
      inner.textContent = text;
      box.classList.remove('hidden');
      y = box.clientHeight * 0.5;
      let last = performance.now();
      const step = (now) => {
        const dt = (now - last) / 1000; last = now;
        y -= dt * (+sp.value);
        inner.style.transform = 'translateY(' + y.toFixed(1) + 'px)';
        if (y > -inner.scrollHeight - 200) raf = requestAnimationFrame(step); else raf = null;
      };
      raf = requestAnimationFrame(step);
      SS.toast('Tippe auf ✕, wenn du fertig bist', 2600);
    };

    const anchor = $('vidExport');
    vidPanel.insertBefore(h, anchor ? anchor.previousElementSibling : null);
    vidPanel.insertBefore(ta, h.nextSibling);
    vidPanel.insertBefore(start, ta.nextSibling);
  }

  SS.PRO5 = true;
})();
