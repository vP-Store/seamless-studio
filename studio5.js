/* ============================================================
   Seamless Studio 5.0 — Bedienoberfläche
   Ergänzt, ohne bestehende Module anzufassen:
     1. Suche + Favoriten in Bibliotheken (Hintergrund, Sticker,
        Textvorlagen, Schriften)
     2. Slide-Leiste unter der Leinwand
     3. Kontextabhängige Werkzeugleiste am Motiv
     4. Ebenen-Panel dauerhaft rechts angedockt (Desktop)
   Lädt als letztes Skript, nutzt nur die öffentliche SS-API.
   ============================================================ */

(function () {
  const $ = (id) => document.getElementById(id);
  const st = SS.state;
  const isMobile = () => window.matchMedia('(max-width: 760px)').matches;
  /* Angedockt nur, wenn danach noch genug Leinwand bleibt (Werkzeugleiste 76 + Panel 296 + Dock 300) */
  const canDock = () => window.matchMedia('(min-width: 1280px)').matches;

  /* ================= 1. Favoriten + Suche ================= */

  const FAVK = 'ss5.favs';
  let favs = new Set();
  try { favs = new Set(JSON.parse(localStorage.getItem(FAVK) || '[]')); } catch (e) {}
  const saveFavs = () => { try { localStorage.setItem(FAVK, JSON.stringify([...favs])); } catch (e) {} };

  function library(grid, placeholder, itemSel, labelOf) {
    if (!grid) return null;

    const bar = document.createElement('div');
    bar.className = 'lib-bar';

    const box = document.createElement('label');
    box.className = 'lib-search';
    box.innerHTML = '<svg><use href="#i-search"></use></svg>';
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.placeholder = placeholder;
    inp.autocomplete = 'off';
    box.appendChild(inp);

    const favBtn = document.createElement('button');
    favBtn.className = 'lib-fav';
    favBtn.title = 'Nur Favoriten zeigen';
    favBtn.innerHTML = '<svg><use href="#i-star"></use></svg>';

    const cnt = document.createElement('span');
    cnt.className = 'lib-count';

    bar.appendChild(box); bar.appendChild(favBtn); bar.appendChild(cnt);
    grid.parentNode.insertBefore(bar, grid);

    let favOnly = false;
    favBtn.onclick = () => { favOnly = !favOnly; favBtn.classList.toggle('on', favOnly); apply(); };
    inp.oninput = apply;

    const key = (it) => grid.id + '|' + (labelOf(it) || '');

    function decorate() {
      for (const it of grid.querySelectorAll(itemSel)) {
        if (!it.dataset.ss5) {
          it.dataset.ss5 = '1';
          const b = document.createElement('button');
          b.className = 'fav-star';
          b.type = 'button';
          b.title = 'Zu Favoriten';
          b.textContent = '★';
          b.addEventListener('click', (e) => {
            e.stopPropagation(); e.preventDefault();
            const k = key(it);
            if (favs.has(k)) favs.delete(k); else favs.add(k);
            saveFavs(); decorate(); apply();
            SS.buzz && SS.buzz(6);
          });
          it.appendChild(b);
        }
        it.classList.toggle('is-fav', favs.has(key(it)));
      }
    }

    function apply() {
      const q = (inp.value || '').trim().toLowerCase();
      let vis = 0, tot = 0;
      for (const it of grid.querySelectorAll(itemSel)) {
        tot++;
        const t = (labelOf(it) || '').toLowerCase();
        const ok = (!q || t.indexOf(q) >= 0) && (!favOnly || favs.has(key(it)));
        it.classList.toggle('lib-off', !ok);
        if (ok) vis++;
      }
      cnt.textContent = (q || favOnly) ? vis + ' / ' + tot : String(tot);
      let empty = bar.parentNode.querySelector('.lib-empty');
      if (!vis && tot) {
        if (!empty) {
          empty = document.createElement('p');
          empty.className = 'hint lib-empty';
          grid.parentNode.insertBefore(empty, grid.nextSibling);
        }
        empty.textContent = favOnly && !q
          ? 'Noch keine Favoriten hier. Tippe den Stern auf einer Kachel.'
          : 'Nichts gefunden für „' + inp.value + '".';
        empty.classList.remove('hidden');
      } else if (empty) empty.classList.add('hidden');
    }

    new MutationObserver(() => { decorate(); apply(); }).observe(grid, { childList: true });
    decorate(); apply();
    return { apply, decorate };
  }

  const labelOfSwatch = (it) => {
    const l = it.querySelector('label');
    return l ? l.textContent : (it.title || '');
  };

  library($('bgGrid'), 'Aquarell, Salbei, Milchstraße …', '.swatch', labelOfSwatch);
  library($('stGrid'), 'Mond, Lotus, Bokeh …', '.swatch', labelOfSwatch);
  library($('textTplGrid'), 'Editorial, Neon, Boho …', '.swatch', labelOfSwatch);
  library($('fontPreviews'), 'Schrift suchen …', 'div:not(.fp-group)', (it) => it.textContent);

  /* ================= 2. Slide-Leiste ================= */

  const stage = $('stage');
  const strip = document.createElement('div');
  strip.id = 'slideStrip';
  strip.className = 'hidden';
  stage.appendChild(strip);

  function slideThumb(i, k, slideW, slideH, n) {
    const cv = SS.makeCanvas(slideW * k, slideH * k);
    const c = cv.getContext('2d');
    c.scale(k, k);
    c.translate(-i * slideW, 0);
    const before = SS._noAnim;
    SS._noAnim = true;
    try { SS.paintScene(c, slideW * n, slideH, { forExport: true }); }
    catch (e) { c.fillStyle = '#241F1B'; c.fillRect(i * slideW, 0, slideW, slideH); }
    finally { SS._noAnim = before; }
    cv.style.width = Math.round(slideW * k) + 'px';
    cv.style.height = Math.round(slideH * k) + 'px';
    return cv;
  }

  function buildStrip() {
    const { n, slideW, slideH } = SS.canvasSize();
    if (n < 2 || !st.elements.length) { strip.classList.add('hidden'); return; }
    strip.classList.remove('hidden');
    strip.innerHTML = '';

    const h = isMobile() ? 52 : 64;
    const k = h / slideH;

    for (let i = 0; i < n; i++) {
      const b = document.createElement('button');
      b.className = 'ss-slide';
      b.title = 'Slide ' + (i + 1);
      b.appendChild(slideThumb(i, k, slideW, slideH, n));
      const num = document.createElement('span');
      num.className = 'ss-num';
      num.textContent = String(i + 1);
      b.appendChild(num);
      b.onclick = () => gotoSlide(i);
      strip.appendChild(b);
    }
    if (st.slides < 20) {
      const add = document.createElement('button');
      add.className = 'ss-slide ss-add';
      add.title = 'Slide hinzufügen';
      add.style.width = Math.round(slideW * k) + 'px';
      add.style.height = h + 'px';
      add.innerHTML = '<svg><use href="#i-plus"></use></svg>';
      add.onclick = () => $('slidesPlus').click();
      strip.appendChild(add);
    }
    markActive();
  }

  function gotoSlide(i) {
    const { slideW } = SS.canvasSize();
    st.panX = stage.clientWidth / 2 - (i + 0.5) * slideW * st.zoom;
    SS.requestRender();
    markActive();
  }

  function markActive() {
    const { slideW, n } = SS.canvasSize();
    if (n < 2) return;
    const cx = (stage.clientWidth / 2 - st.panX) / st.zoom;
    const idx = Math.max(0, Math.min(n - 1, Math.floor(cx / slideW)));
    let i = 0;
    for (const el of strip.children) {
      if (!el.classList.contains('ss-add')) el.classList.toggle('on', i === idx);
      i++;
    }
  }

  let stripT = null;
  const stripSoon = (ms) => { clearTimeout(stripT); stripT = setTimeout(buildStrip, ms || 500); };

  /* ================= 3. Kontextleiste ================= */

  const ctx = document.createElement('div');
  ctx.id = 'ctxBar';
  ctx.className = 'hidden';
  stage.appendChild(ctx);
  const props = $('props');

  function ico(name, size) {
    return '<svg style="width:' + (size || 16) + 'px;height:' + (size || 16) + 'px"><use href="#i-' + name + '"></use></svg>';
  }
  function ctxBtn(icon, title, fn, cls) {
    const b = document.createElement('button');
    b.className = 'cx-btn' + (cls ? ' ' + cls : '');
    b.title = title;
    b.innerHTML = ico(icon);
    b.onclick = fn;
    return b;
  }
  function sep() {
    const d = document.createElement('span');
    d.className = 'cx-sep';
    return d;
  }
  function openProps(open) {
    props.classList.toggle('ss-collapsed', open === undefined ? !props.classList.contains('ss-collapsed') : !open);
  }

  const TYPNAME = { photo: 'Foto', text: 'Text', sticker: 'Sticker', emoji: 'Emoji', blur: 'Bereich' };

  function syncCtx() {
    if (isMobile()) { ctx.classList.add('hidden'); return; }
    const sel = SS.getSel();
    if (!sel || props.classList.contains('hidden')) { ctx.classList.add('hidden'); return; }

    const many = SS.selCount() > 1;
    ctx.classList.remove('hidden');
    ctx.innerHTML = '';

    const head = document.createElement('div');
    head.className = 'cx-head';
    head.innerHTML = ico(sel.type === 'text' ? 'text' : sel.type === 'photo' ? 'photo' : 'sticker', 15);
    const nm = document.createElement('b');
    nm.textContent = many ? SS.selCount() + ' Elemente' : (TYPNAME[sel.type] || 'Element');
    head.appendChild(nm);
    if (!many) {
      const detail = SS.elName(sel);
      if (detail && detail !== nm.textContent) {
        const sub = document.createElement('span');
        sub.textContent = detail;
        head.appendChild(sub);
      }
    }
    ctx.appendChild(head);
    ctx.appendChild(sep());

    if (!many && sel.type === 'photo') {
      ctx.appendChild(ctxBtn('crop', 'Zuschneiden, drehen, begradigen', () => SS.crop.open(sel)));
      ctx.appendChild(ctxBtn('cut', sel.cutout ? 'Freisteller nachbessern' : 'Hintergrund entfernen', () => SS.cutout.open(sel)));
    }
    ctx.appendChild(ctxBtn('anim', 'Animation', () => openProps(true)));
    ctx.appendChild(sep());
    ctx.appendChild(ctxBtn('copy', 'Duplizieren', () => SS.ui.dupSel()));
    ctx.appendChild(ctxBtn('layers', 'Ebenen', () => SS.ui.toggleLayers(true)));
    ctx.appendChild(ctxBtn('trash', 'Löschen', () => SS.ui.deleteSel(), 'danger'));
    ctx.appendChild(sep());

    const more = document.createElement('button');
    more.className = 'cx-more';
    more.innerHTML = ico('sliders', 15) + '<span>Alle Einstellungen</span>' + ico('chev', 13);
    more.onclick = () => openProps();
    ctx.appendChild(more);
  }

  /* ================= 4. Ebenen-Dock ================= */

  const layers = $('layersPanel');
  function syncDock() {
    const open = !layers.classList.contains('hidden');
    const docked = canDock() && open;
    document.body.classList.toggle('ss-float', open && !docked && !isMobile());
    if (document.body.classList.contains('ss-dock') === docked) return;
    document.body.classList.toggle('ss-dock', docked);
    requestAnimationFrame(() => { SS.ui.zoomFit(); SS.requestRender(); markActive(); });
  }
  new MutationObserver(syncDock).observe(layers, { attributes: true, attributeFilter: ['class'] });

  /* ================= Mobil: Sheet-Zustand ================= */

  const sheets = [$('sidepanel'), $('props'), layers].filter(Boolean);
  function syncSheet() {
    if (!isMobile()) { document.body.classList.remove('ss-sheet'); return; }
    const open = sheets.some(s => s.classList.contains('open')
      || (s !== $('sidepanel') && !s.classList.contains('hidden')));
    document.body.classList.toggle('ss-sheet', open);
  }
  for (const s of sheets) new MutationObserver(syncSheet).observe(s, { attributes: true, attributeFilter: ['class'] });

  /* ================= Tonwerte + Filter-Rezepte ================= */

  const RECK = 'ss5.recipes';
  let recipes = [];
  try { recipes = JSON.parse(localStorage.getItem(RECK) || '[]'); } catch (e) {}
  const saveRecipes = () => { try { localStorage.setItem(RECK, JSON.stringify(recipes)); } catch (e) {} };

  const TONE = [
    ['Lichter', 'highlights', -100, 100],
    ['Tiefen', 'shadows', -100, 100],
    ['Schwarzpunkt', 'black', 0, 100],
    ['Weißpunkt', 'white', 0, 100],
  ];
  const FKEYS = ['brightness', 'contrast', 'saturate', 'warmth', 'sepia', 'vignette', 'grain',
    'highlights', 'shadows', 'black', 'white'];

  function h4(t) { const e = document.createElement('h4'); e.textContent = t; return e; }

  function slider(label, val, min, max, onInput, onDone) {
    const d = document.createElement('div'); d.className = 'ctl';
    const s = document.createElement('span'); s.textContent = label;
    const r = document.createElement('input');
    r.type = 'range'; r.min = min; r.max = max; r.value = val;
    const v = document.createElement('span'); v.className = 'val'; v.textContent = val;
    r.addEventListener('input', () => { v.textContent = r.value; onInput(+r.value); });
    r.addEventListener('change', () => onDone && onDone(+r.value));
    d.appendChild(s); d.appendChild(r); d.appendChild(v);
    return d;
  }

  function toneSection(sel, body) {
    const fl = sel.filter || (sel.filter = SS.defaultFilter());
    for (const k of FKEYS) if (fl[k] === undefined) fl[k] = 0;

    body.appendChild(h4('Tonwerte'));
    for (const [label, key, min, max] of TONE) {
      body.appendChild(slider(label, fl[key] || 0, min, max, (v) => {
        fl[key] = v; fl.preset = 'custom';
        SS.photoCacheClear(sel.id); SS.cardCacheClear && SS.cardCacheClear(sel.id);
        SS.requestRender();
      }, () => SS.pushHistory('Tonwerte')));
    }

    const reset = document.createElement('button');
    reset.className = 'wide';
    reset.textContent = 'Tonwerte zurücksetzen';
    reset.onclick = () => {
      for (const [, key] of TONE) fl[key] = 0;
      SS.photoCacheClear(sel.id); SS.cardCacheClear && SS.cardCacheClear(sel.id);
      SS.pushHistory('Tonwerte zurückgesetzt'); SS.ui.showProps(); SS.requestRender();
    };
    body.appendChild(reset);

    body.appendChild(h4('Eigene Rezepte'));
    const row = document.createElement('div'); row.className = 'chips';
    for (const rec of recipes) {
      const b = document.createElement('button');
      b.textContent = rec.name;
      b.title = 'Anwenden — lange drücken zum Löschen';
      b.onclick = () => {
        Object.assign(fl, rec.f, { preset: 'custom' });
        SS.photoCacheClear(sel.id); SS.cardCacheClear && SS.cardCacheClear(sel.id);
        SS.pushHistory('Rezept „' + rec.name + '"'); SS.ui.showProps(); SS.requestRender();
        SS.toast('Rezept „' + rec.name + '" angewendet', 2200, 'ok');
      };
      b.oncontextmenu = (e) => {
        e.preventDefault();
        recipes = recipes.filter(x => x !== rec); saveRecipes(); SS.ui.showProps();
      };
      row.appendChild(b);
    }
    if (!recipes.length) {
      const hint = document.createElement('span');
      hint.className = 'hint'; hint.style.margin = '0';
      hint.textContent = 'Noch keine. Sichere den aktuellen Look, dann liegt er in jedem Projekt bereit.';
      row.appendChild(hint);
    }
    body.appendChild(row);

    const add = document.createElement('button');
    add.className = 'wide primary';
    add.textContent = 'Aktuellen Look als Rezept sichern';
    add.onclick = () => {
      const name = prompt('Name des Rezepts', 'Sommer ' + new Date().getFullYear());
      if (name === null) return;
      const f = {};
      for (const k of FKEYS) f[k] = fl[k] || (k === 'brightness' || k === 'contrast' || k === 'saturate' ? 100 : 0);
      recipes.push({ name: name.trim() || 'Rezept', f });
      recipes = recipes.slice(-12);
      saveRecipes(); SS.ui.showProps();
      SS.toast('Rezept gesichert', 2200, 'ok');
    };
    body.appendChild(add);

    const all = document.createElement('button');
    all.className = 'wide';
    all.textContent = 'Tonwerte auf alle Fotos übertragen';
    all.onclick = () => {
      let n = 0;
      for (const el of SS.state.elements) {
        if (el.type !== 'photo' || el === sel) continue;
        el.filter = el.filter || SS.defaultFilter();
        for (const [, key] of TONE) el.filter[key] = fl[key] || 0;
        SS.photoCacheClear(el.id); SS.cardCacheClear && SS.cardCacheClear(el.id);
        n++;
      }
      SS.pushHistory('Tonwerte übertragen'); SS.requestRender();
      SS.toast(n ? 'Auf ' + n + ' Fotos übertragen' : 'Kein weiteres Foto da', 2400, n ? 'ok' : 'warn');
    };
    body.appendChild(all);
  }

  function toggleRowSS(body, items) {
    const d = document.createElement('div'); d.className = 'chips toggle-row';
    for (const [label, on, fn] of items) {
      const b = document.createElement('button');
      b.textContent = label;
      if (on) b.classList.add('sel');
      b.onclick = fn;
      d.appendChild(b);
    }
    body.appendChild(d);
  }

  /* Freisteller-Nachbearbeitung: Schatten, Kontur, Text hinter dem Motiv */
  function cutSection(sel, body) {
    body.appendChild(h4('Freisteller-Wirkung'));

    const refresh = (label) => {
      SS.photoCacheClear(sel.id);
      SS.cardCacheClear && SS.cardCacheClear(sel.id);
      SS.pushHistory(label);
      SS.ui.showProps();
      SS.requestRender();
    };

    toggleRowSS(body, [
      ['Schlagschatten', !!sel.cutShadow, () => { sel.cutShadow = !sel.cutShadow; refresh('Schlagschatten'); }],
      ['Kontur', !!sel.cutOutline, () => { sel.cutOutline = !sel.cutOutline; refresh('Kontur'); }],
      ['Text dahinter', !!sel.overlay, () => { sel.overlay = !sel.overlay; refresh('Text hinter Motiv'); }],
    ]);

    if (sel.cutShadow) {
      const live = () => { SS.photoCacheClear(sel.id); SS.cardCacheClear && SS.cardCacheClear(sel.id); SS.requestRender(); };
      body.appendChild(slider('Versatz', sel.cutShadowOffset ?? 24, 0, 80, v => { sel.cutShadowOffset = v; live(); }, () => SS.pushHistory('Schatten')));
      body.appendChild(slider('Weichheit', sel.cutShadowBlur ?? 30, 0, 90, v => { sel.cutShadowBlur = v; live(); }, () => SS.pushHistory('Schatten')));
      body.appendChild(slider('Stärke', sel.cutShadowAlpha ?? 45, 5, 90, v => { sel.cutShadowAlpha = v; live(); }, () => SS.pushHistory('Schatten')));
    }
    if (sel.cutOutline) {
      const live = () => { SS.photoCacheClear(sel.id); SS.cardCacheClear && SS.cardCacheClear(sel.id); SS.requestRender(); };
      body.appendChild(slider('Konturbreite', sel.cutOutlineWidth ?? 6, 1, 24, v => { sel.cutOutlineWidth = v; live(); }, () => SS.pushHistory('Kontur')));
      const d = document.createElement('div'); d.className = 'ctl';
      const s = document.createElement('span'); s.textContent = 'Konturfarbe';
      const inp = document.createElement('input');
      inp.type = 'color'; inp.value = sel.cutOutlineColor || '#ffffff';
      inp.oninput = () => { sel.cutOutlineColor = inp.value; live(); };
      inp.onchange = () => SS.pushHistory('Konturfarbe');
      d.appendChild(s); d.appendChild(inp); body.appendChild(d);
    }
    if (sel.overlay) {
      const p = document.createElement('p');
      p.className = 'hint';
      p.textContent = 'Das Motiv wird zusätzlich über allen Texten und Stickern gezeichnet. Lege dieselbe Ebene darunter noch einmal ab, wenn du den Hintergrund behalten willst.';
      body.appendChild(p);
    }
  }

  /* ================= Video: Ducking-Bedienung ================= */

  const duck = $('vidDuck'), duckAmt = $('vidDuckAmt'), duckL = $('vidDuckL'), duckRow = $('vidDuckRow');
  if (duck && SS.audio) {
    const A = SS.audio;
    const syncDuck = () => {
      A.state.ducking = duck.checked;
      A.state.duckAmount = (+duckAmt.value) / 100;
      duckL.textContent = duckAmt.value + ' %';
      duckRow.classList.toggle('hidden', !duck.checked);
    };
    duck.addEventListener('change', syncDuck);
    duckAmt.addEventListener('input', syncDuck);
    syncDuck();
  }

  /* ================= Verdrahtung ================= */

  let lastSelKey = null;

  const origShowProps = SS.ui.showProps;
  SS.ui.showProps = function () {
    origShowProps.apply(this, arguments);
    const sel = SS.getSel();
    if (sel && sel.type === 'photo' && SS.selCount() === 1 && !props.classList.contains('hidden')) {
      const body = $('propsBody');
      if (body) {
        toneSection(sel, body);
        if (sel.cutout) cutSection(sel, body);
      }
    }
    /* Nur beim Wechsel der Auswahl einklappen — sonst würde jeder Regler
       im Panel es zuschlagen. */
    if (!isMobile()) {
      const key = sel ? (SS.state.selectedIds.join(',')) : '';
      if (key !== lastSelKey) {
        props.classList.add('ss-collapsed');
        lastSelKey = key;
      }
    }
    syncCtx();
    syncSheet();
  };

  const origPush = SS.pushHistory;
  SS.pushHistory = function () {
    origPush.apply(this, arguments);
    stripSoon(600);
    if (SS.ui.refreshLayers) SS.ui.refreshLayers();
  };

  const origRender = SS.render;
  SS.render = function () {
    origRender.apply(this, arguments);
    markActive();
  };

  const origRestore = SS.restore;
  SS.restore = function () {
    origRestore.apply(this, arguments);
    stripSoon(200);
    if (SS.ui.refreshLayers) SS.ui.refreshLayers();
  };

  window.addEventListener('resize', () => { stripSoon(300); syncDock(); });

  SS.ui.rebuildStrip = buildStrip;

  window.addEventListener('load', () => {
    setTimeout(() => {
      if (canDock()) SS.ui.toggleLayers(true);
      buildStrip();
      syncCtx();
    }, 700);
  });
})();
