/* Seamless Studio – Zeiger- und Berührungssteuerung
   Mehrfachauswahl, Lasso, Gruppen, freie Verzerrung, Fangen mit Abstandsanzeige. */

(function () {
  const canvas = document.getElementById('canvas');
  const st = SS.state;

  let mode = null;        // move | scaleP | stretch | rotate | pan | pinch | lasso
  let start = null;
  let edge = null;        // n | s | w | e  (bei stretch)
  const pointers = new Map();

  SS.lassoMode = false;   // per Knopf am Handy einschaltbar
  SS.addMode = false;     // „Mehrere auswählen" am Handy
  SS.arLock = true;       // Seitenverhältnis-Sperre beim Verzerren

  function screenToWorld(sx, sy) {
    return [(sx - st.panX) / st.zoom, (sy - st.panY) / st.zoom];
  }

  /* ---------- Griffrahmen ---------- */
  function handleBox() {
    const all = SS.getSelAll();
    if (!all.length) return null;
    if (all.length > 1) {
      const b = SS.selBounds();
      return { cx: b.cx, cy: b.cy, w: b.w, h: b.h, rot: 0, multi: true };
    }
    const el = all[0];
    const s = SS.elSize(el);
    return { cx: el.x, cy: el.y, w: s.w, h: s.h, rot: el.rot || 0, multi: false, el };
  }

  function hitHandle(wx, wy) {
    const b = handleBox();
    if (!b) return null;
    if (!b.multi && b.el && b.el.locked) return null;
    const [lx, ly] = SS.toLocal(wx, wy, b.cx, b.cy, b.rot);
    const hs = (SS.HANDLE + 9) / st.zoom;
    const hw = b.w / 2, hh = b.h / 2;
    for (const [cx, cy] of [[-hw, -hh], [hw, -hh], [-hw, hh], [hw, hh]]) {
      if (Math.hypot(lx - cx, ly - cy) < hs) return { kind: 'scaleP' };
    }
    if (Math.hypot(lx, ly - (-hh - 40 / st.zoom)) < hs) return { kind: 'rotate' };
    if (!b.multi) {
      const t = hs * 0.95;
      if (Math.abs(ly + hh) < t && Math.abs(lx) < hw * 0.55) return { kind: 'stretch', edge: 'n' };
      if (Math.abs(ly - hh) < t && Math.abs(lx) < hw * 0.55) return { kind: 'stretch', edge: 's' };
      if (Math.abs(lx + hw) < t && Math.abs(ly) < hh * 0.55) return { kind: 'stretch', edge: 'w' };
      if (Math.abs(lx - hw) < t && Math.abs(ly) < hh * 0.55) return { kind: 'stretch', edge: 'e' };
    }
    return null;
  }

  function hitElement(wx, wy) {
    const list = SS.pickableElements();
    for (let i = list.length - 1; i >= 0; i--) {
      const el = list[i];
      const { w, h } = SS.elSize(el);
      const [lx, ly] = SS.toLocal(wx, wy, el.x, el.y, el.rot);
      if (Math.abs(lx) <= w / 2 && Math.abs(ly) <= h / 2) return el;
    }
    return null;
  }

  /* ---------- Fangen an Kanten und Mitten, mit Abstandsanzeige ---------- */
  function applySnap(prim, movedList) {
    const { W, H, slideW, n } = SS.canvasSize();
    const T = 9 / st.zoom;
    SS._snapLines = [];
    SS._distMarks = [];

    const b = SS.boundsOf(movedList);
    if (!b) return;

    const vT = [];
    for (let i = 0; i < n; i++) vT.push(i * slideW + slideW / 2);
    for (let i = 1; i < n; i++) vT.push(i * slideW);
    vT.push(W / 2, 0, W);
    const hT = [H / 2, 0, H];

    const others = SS.state.elements.filter(e => !e.hidden && movedList.indexOf(e) < 0);
    const oBounds = others.map(e => ({ e, b: SS.boundsOf([e]) })).filter(o => o.b);
    for (const o of oBounds) { vT.push(o.b.x0, o.b.cx, o.b.x1); hT.push(o.b.y0, o.b.cy, o.b.y1); }

    let dx = 0, dy = 0, bestX = T, bestY = T;
    const vLines = [], hLines = [];
    for (const my of [b.x0, b.cx, b.x1]) {
      for (const t of vT) {
        const d = t - my;
        if (Math.abs(d) < bestX) { bestX = Math.abs(d); dx = d; vLines.length = 0; vLines.push({ v: t }); }
      }
    }
    for (const my of [b.y0, b.cy, b.y1]) {
      for (const t of hT) {
        const d = t - my;
        if (Math.abs(d) < bestY) { bestY = Math.abs(d); dy = d; hLines.length = 0; hLines.push({ h: t }); }
      }
    }
    SS._snapLines = vLines.concat(hLines);
    if (dx || dy) {
      for (const el of movedList) { el.x += dx; el.y += dy; }
      if (SS.buzz && (Math.abs(dx) > 0.4 || Math.abs(dy) > 0.4)) SS.buzz();
    }

    // Abstände zu den nächsten Nachbarn
    const nb = SS.boundsOf(movedList);
    let left = null, right = null, up = null, down = null;
    for (const o of oBounds) {
      const vOv = Math.min(nb.y1, o.b.y1) - Math.max(nb.y0, o.b.y0);
      const hOv = Math.min(nb.x1, o.b.x1) - Math.max(nb.x0, o.b.x0);
      if (vOv > 0) {
        if (o.b.x1 <= nb.x0 && (!left || o.b.x1 > left.b.x1)) left = o;
        if (o.b.x0 >= nb.x1 && (!right || o.b.x0 < right.b.x0)) right = o;
      }
      if (hOv > 0) {
        if (o.b.y1 <= nb.y0 && (!up || o.b.y1 > up.b.y1)) up = o;
        if (o.b.y0 >= nb.y1 && (!down || o.b.y0 < down.b.y0)) down = o;
      }
    }
    if (left) SS._distMarks.push({ x0: left.b.x1, y0: nb.cy, x1: nb.x0, y1: nb.cy });
    if (right) SS._distMarks.push({ x0: nb.x1, y0: nb.cy, x1: right.b.x0, y1: nb.cy });
    if (up) SS._distMarks.push({ x0: nb.cx, y0: up.b.y1, x1: nb.cx, y1: nb.y0 });
    if (down) SS._distMarks.push({ x0: nb.cx, y0: nb.y1, x1: nb.cx, y1: down.b.y0 });
    if (left && right) {
      const a = Math.round(nb.x0 - left.b.x1), z = Math.round(right.b.x0 - nb.x1);
      if (Math.abs(a - z) < 2) SS._distMarks.forEach(m => { m.label = '⇔ ' + a; });
    }
  }

  /* ---------- Größe ---------- */
  function scaleEl(el, s0, f) {
    if (el.type === 'photo') el.h = SS.clamp(s0.h * f, 60, 4000);
    else if (el.type === 'text') el.size = SS.clamp(s0.size * f, 10, 500);
    else if (el.type === 'sticker' || el.type === 'emoji') el.s = SS.clamp(s0.s * f, 16, 3000);
    else if (el.type === 'blur') { el.w = SS.clamp(s0.w * f, 30, 4000); el.h = SS.clamp(s0.hh * f, 30, 4000); }
  }
  function snapshotEl(el) {
    return { h: el.h, s: el.s, w: el.w, hh: el.h, size: el.size, rot: el.rot || 0,
      x: el.x, y: el.y, scaleX: el.scaleX || 1, scaleY: el.scaleY || 1 };
  }

  SS.invalidateEl = function (el) {
    if (el.type === 'photo') SS.cardCacheClear(el.id);
  };

  /* Skalieren und Drehen um den Mittelpunkt des Griffrahmens */
  function applyScaleRotate(f, degDelta) {
    const box = start.box;
    const rad = SS.deg2rad(degDelta);
    const co = Math.cos(rad), si = Math.sin(rad);
    start.list.forEach((el, i) => {
      const s0 = start.els[i];
      if (start.list.length > 1) {
        const dx = (s0.x - box.cx) * f, dy = (s0.y - box.cy) * f;
        el.x = box.cx + dx * co - dy * si;
        el.y = box.cy + dx * si + dy * co;
      }
      if (f !== 1) scaleEl(el, s0, f);
      if (degDelta) el.rot = s0.rot + degDelta;
      SS.invalidateEl(el);
    });
  }

  /* ---------- Zeigerereignisse ---------- */
  canvas.addEventListener('pointerdown', (ev) => {
    if (window.matchMedia('(max-width: 760px)').matches)
      document.getElementById('sidepanel').classList.remove('open');
    if (ev.isPrimary) { pointers.clear(); mode = null; }

    if (SS.pickMode) {
      try {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const d = canvas.getContext('2d').getImageData(ev.offsetX * dpr, ev.offsetY * dpr, 1, 1).data;
        const hex = '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join('');
        const cb = SS.pickMode; SS.pickMode = null;
        cb(hex);
        SS.toast('✓ Farbe übernommen: ' + hex, 1800, 'ok');
      } catch (e) { SS.pickMode = null; }
      return;
    }

    canvas.setPointerCapture(ev.pointerId);
    pointers.set(ev.pointerId, { x: ev.offsetX, y: ev.offsetY });

    if (pointers.size === 2) {
      const pts = [...pointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const ang = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
      const all = SS.getSelAll().filter(e => !e.locked);
      mode = 'pinch';
      start = {
        dist, ang, zoom: st.zoom, panX: st.panX, panY: st.panY,
        list: all, els: all.map(snapshotEl), box: handleBox(),
        mid: [(pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2],
      };
      return;
    }

    const [wx, wy] = screenToWorld(ev.offsetX, ev.offsetY);

    const h = hitHandle(wx, wy);
    if (h) {
      const box = handleBox();
      const all = SS.getSelAll().filter(e => !e.locked);
      mode = h.kind;
      edge = h.edge || null;
      start = {
        wx, wy, box, list: all, els: all.map(snapshotEl),
        d0: Math.hypot(wx - box.cx, wy - box.cy),
        a0: Math.atan2(wy - box.cy, wx - box.cx),
      };
      return;
    }

    const hitEl = hitElement(wx, wy);
    const additive = ev.shiftKey || ev.ctrlKey || ev.metaKey || SS.addMode;

    if (hitEl) {
      if (additive) SS.toggleSel(hitEl.id);
      else if (!SS.isSel(hitEl.id)) SS.setSel(hitEl.id);
      else SS.state.selectedIds = SS.state.selectedIds.filter(x => x !== hitEl.id).concat([hitEl.id]);
      SS.ui.showProps();
      const all = SS.getSelAll().filter(e => !e.locked);
      mode = 'move';
      start = { wx, wy, list: all, els: all.map(snapshotEl) };
    } else if (SS.lassoMode || ev.shiftKey) {
      mode = 'lasso';
      start = { wx, wy, keep: additive ? SS.state.selectedIds.slice() : [] };
      SS._lasso = { x0: wx, y0: wy, x1: wx, y1: wy };
    } else {
      SS.clearSel();
      SS.ui.showProps();
      mode = 'pan';
      start = { sx: ev.offsetX, sy: ev.offsetY, panX: st.panX, panY: st.panY };
    }
    SS.requestRender();
  });

  canvas.addEventListener('pointermove', (ev) => {
    if (!pointers.has(ev.pointerId)) return;
    pointers.set(ev.pointerId, { x: ev.offsetX, y: ev.offsetY });
    if (!mode) return;

    if (mode === 'pinch' && pointers.size === 2) {
      const pts = [...pointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const ang = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
      if (start.list.length) {
        applyScaleRotate(dist / start.dist, (ang - start.ang) * 180 / Math.PI);
      } else {
        const f = SS.clamp(start.zoom * dist / start.dist, 0.05, 4);
        const [mx, my] = start.mid;
        st.panX = mx - (mx - start.panX) * f / start.zoom;
        st.panY = my - (my - start.panY) * f / start.zoom;
        st.zoom = f;
        SS.ui.zoomLabel();
      }
      SS.requestRender();
      return;
    }

    const [wx, wy] = screenToWorld(ev.offsetX, ev.offsetY);

    if (mode === 'move' && start.list.length) {
      const ddx = wx - start.wx, ddy = wy - start.wy;
      start.list.forEach((el, i) => { el.x = start.els[i].x + ddx; el.y = start.els[i].y + ddy; });
      applySnap(SS.getSel(), start.list);
      SS.requestRender();
    } else if (mode === 'scaleP' && start.list.length) {
      const d = Math.hypot(wx - start.box.cx, wy - start.box.cy);
      applyScaleRotate(SS.clamp(d / Math.max(1, start.d0), 0.1, 12), 0);
      SS.requestRender();
    } else if (mode === 'stretch' && start.list.length === 1) {
      const el = start.list[0];
      const [lx, ly] = SS.toLocal(wx, wy, start.box.cx, start.box.cy, start.box.rot);
      const raw = SS.elSizeRaw(el);
      const free = !SS.arLock || ev.shiftKey;
      if (edge === 'e' || edge === 'w') {
        const f = SS.clamp(Math.abs(lx) * 2 / Math.max(1, raw.w), 0.1, 8);
        el.scaleX = f;
        if (!free) el.scaleY = f;
      } else {
        const f = SS.clamp(Math.abs(ly) * 2 / Math.max(1, raw.h), 0.1, 8);
        el.scaleY = f;
        if (!free) el.scaleX = f;
      }
      SS.requestRender();
    } else if (mode === 'rotate' && start.list.length) {
      const a = Math.atan2(wy - start.box.cy, wx - start.box.cx);
      const deg = (a - start.a0) * 180 / Math.PI;
      if (start.list.length === 1) {
        let rot = start.els[0].rot + deg;
        for (const t of [0, 90, 180, -90, -180]) if (Math.abs(rot - t) < 4) rot = t;
        start.list[0].rot = rot;
      } else {
        applyScaleRotate(1, deg);
      }
      SS.requestRender();
    } else if (mode === 'lasso') {
      SS._lasso = { x0: Math.min(start.wx, wx), y0: Math.min(start.wy, wy),
        x1: Math.max(start.wx, wx), y1: Math.max(start.wy, wy) };
      SS.requestRender();
    } else if (mode === 'pan') {
      st.panX = start.panX + (ev.offsetX - start.sx);
      st.panY = start.panY + (ev.offsetY - start.sy);
      SS.requestRender();
    }
  });

  function endPointer(ev) {
    pointers.delete(ev.pointerId);
    if (mode === 'lasso' && SS._lasso) {
      const L = SS._lasso;
      const inside = SS.pickableElements().filter(e =>
        e.x >= L.x0 && e.x <= L.x1 && e.y >= L.y0 && e.y <= L.y1).map(e => e.id);
      SS.setSelMany(start.keep.concat(inside));
      SS.ui.showProps();
      if (inside.length) SS.toast(`${SS.selCount()} Elemente ausgewählt`, 1600);
    }
    SS._lasso = null;
    if (mode && mode !== 'pan' && mode !== 'lasso') {
      SS.pushHistory(mode === 'move' ? 'Verschoben' : mode === 'rotate' ? 'Gedreht' : 'Größe geändert');
    }
    if (pointers.size === 0) mode = null;
    SS._snapLines = null;
    SS._distMarks = null;
    SS.requestRender();
  }
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);

  /* ---------- iOS Safari: Seiten-Zoom und Scrollen auf der Leinwand unterbinden ---------- */
  canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('gesturechange', (e) => e.preventDefault());
  document.addEventListener('touchmove', (e) => {
    if (e.scale !== undefined && e.scale !== 1) e.preventDefault();
  }, { passive: false });

  /* ---------- Mausrad ---------- */
  canvas.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const f = SS.clamp(st.zoom * (ev.deltaY < 0 ? 1.1 : 0.9), 0.05, 4);
    st.panX = ev.offsetX - (ev.offsetX - st.panX) * f / st.zoom;
    st.panY = ev.offsetY - (ev.offsetY - st.panY) * f / st.zoom;
    st.zoom = f;
    SS.ui.zoomLabel();
    SS.requestRender();
  }, { passive: false });

  /* ---------- Doppelklick: Text bearbeiten ---------- */
  canvas.addEventListener('dblclick', (ev) => {
    const [wx, wy] = screenToWorld(ev.offsetX, ev.offsetY);
    const el = hitElement(wx, wy);
    if (el && el.type === 'text') {
      SS.setSel(el.id);
      SS.ui.showProps();
      setTimeout(() => {
        const ta = document.querySelector('#propsBody textarea');
        if (ta) { ta.focus(); ta.select(); }
      }, 60);
    }
  });

  /* ---------- Fotos auf die Leinwand ziehen ---------- */
  canvas.addEventListener('dragover', (e) => { e.preventDefault(); });
  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const imgId = e.dataTransfer && e.dataTransfer.getData('text/ss-img');
    const [wx, wy] = screenToWorld(e.offsetX, e.offsetY);
    if (imgId && SS.ui.placePhotoAt) { SS.ui.placePhotoAt(imgId, wx, wy); return; }
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length && SS.ui.addFilesAt)
      SS.ui.addFilesAt(e.dataTransfer.files, wx, wy);
  });

  /* ---------- Tastatur ---------- */
  window.addEventListener('keydown', (ev) => {
    const tag = ev.target.tagName;
    if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return;
    const mod = ev.ctrlKey || ev.metaKey;

    if (mod && ev.key.toLowerCase() === 'z' && !ev.shiftKey) { ev.preventDefault(); SS.undo(); return; }
    if (mod && (ev.key.toLowerCase() === 'y' || (ev.shiftKey && ev.key.toLowerCase() === 'z'))) { ev.preventDefault(); SS.redo(); return; }
    if (mod && ev.key.toLowerCase() === 'a') {
      ev.preventDefault();
      SS.setSelMany(SS.pickableElements().map(e => e.id));
      SS.ui.showProps(); SS.requestRender();
      return;
    }
    if (mod && ev.key === '0') { ev.preventDefault(); SS.ui.zoomFit(); return; }
    if (mod && ev.key.toLowerCase() === 'l') { ev.preventDefault(); SS.ui.toggleLayers && SS.ui.toggleLayers(); return; }
    if (mod && ev.key.toLowerCase() === 'g') {
      ev.preventDefault();
      if (ev.shiftKey) SS.ui.ungroupSel(); else SS.ui.groupSel();
      return;
    }
    if (mod && ev.key.toLowerCase() === 'd') { ev.preventDefault(); SS.ui.dupSel(); return; }
    if (ev.key === '?' || (ev.shiftKey && ev.key === '/')) { ev.preventDefault(); SS.ui.toggleShortcuts(); return; }
    if (ev.key.toLowerCase() === 'l' && !mod) { SS.ui.toggleLasso(); return; }
    if (ev.key === 'Escape') { SS.clearSel(); SS.ui.showProps(); SS.requestRender(); return; }

    const list = SS.getSelAll().filter(e => !e.locked);
    if (!list.length) return;
    const step = ev.shiftKey ? 20 : 3;
    if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); SS.ui.deleteSel(); }
    else if (ev.key === 'ArrowLeft') { list.forEach(e => e.x -= step); SS.requestRender(); }
    else if (ev.key === 'ArrowRight') { list.forEach(e => e.x += step); SS.requestRender(); }
    else if (ev.key === 'ArrowUp') { list.forEach(e => e.y -= step); SS.requestRender(); }
    else if (ev.key === 'ArrowDown') { list.forEach(e => e.y += step); SS.requestRender(); }
  });
})();
