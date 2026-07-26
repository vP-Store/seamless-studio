/* Seamless Studio – pointer & touch interaction */

(function () {
  const canvas = document.getElementById('canvas');
  const st = SS.state;

  let mode = null;        // 'move' | 'scale' | 'rotate' | 'pan' | 'pinch'
  let start = null;
  const pointers = new Map();

  function screenToWorld(sx, sy) {
    return [(sx - st.panX) / st.zoom, (sy - st.panY) / st.zoom];
  }

  function hitHandle(el, wx, wy) {
    const { w, h } = SS.elSize(el);
    const [lx, ly] = SS.toLocal(wx, wy, el.x, el.y, el.rot);
    const hs = (SS.HANDLE + 8) / st.zoom;
    const corners = [[-w / 2, -h / 2], [w / 2, -h / 2], [-w / 2, h / 2], [w / 2, h / 2]];
    for (const [cx, cy] of corners) {
      if (Math.hypot(lx - cx, ly - cy) < hs) return 'scale';
    }
    if (Math.hypot(lx - 0, ly - (-h / 2 - 40 / st.zoom)) < hs) return 'rotate';
    return null;
  }

  function hitElement(wx, wy) {
    for (let i = st.elements.length - 1; i >= 0; i--) {
      const el = st.elements[i];
      const { w, h } = SS.elSize(el);
      const [lx, ly] = SS.toLocal(wx, wy, el.x, el.y, el.rot);
      if (Math.abs(lx) <= w / 2 && Math.abs(ly) <= h / 2) return el;
    }
    return null;
  }

  /* ---------- snapping ---------- */
  function applySnap(el) {
    const { W, H, slideW, n } = SS.canvasSize();
    const T = 10 / st.zoom;
    SS._snapLines = [];
    // vertical: slide centers & boundaries & canvas center
    const vTargets = [];
    for (let i = 0; i < n; i++) vTargets.push(i * slideW + slideW / 2);
    for (let i = 1; i < n; i++) vTargets.push(i * slideW);
    vTargets.push(W / 2);
    for (const t of vTargets) {
      if (Math.abs(el.x - t) < T) { el.x = t; SS._snapLines.push({ v: t }); break; }
    }
    const hTargets = [H / 2];
    for (const t of hTargets) {
      if (Math.abs(el.y - t) < T) { el.y = t; SS._snapLines.push({ h: t }); break; }
    }
    // other element centers
    for (const other of st.elements) {
      if (other.id === el.id) continue;
      if (Math.abs(el.x - other.x) < T) { el.x = other.x; SS._snapLines.push({ v: other.x }); }
      if (Math.abs(el.y - other.y) < T) { el.y = other.y; SS._snapLines.push({ h: other.y }); }
    }
  }

  /* ---------- pointer events ---------- */
  canvas.addEventListener('pointerdown', (ev) => {
    canvas.setPointerCapture(ev.pointerId);
    pointers.set(ev.pointerId, { x: ev.offsetX, y: ev.offsetY });

    if (pointers.size === 2) {
      // pinch: zoom canvas OR scale/rotate selected element
      const pts = [...pointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const ang = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
      const sel = SS.getSel();
      mode = 'pinch';
      start = {
        dist, ang, zoom: st.zoom, panX: st.panX, panY: st.panY,
        el: sel ? { h: sel.h, s: sel.s, w: sel.w, hh: sel.h, size: sel.size, rot: sel.rot, x: sel.x, y: sel.y } : null,
        mid: [(pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2],
      };
      return;
    }

    const [wx, wy] = screenToWorld(ev.offsetX, ev.offsetY);
    const sel = SS.getSel();
    if (sel) {
      const h = hitHandle(sel, wx, wy);
      if (h) {
        mode = h;
        const { w: ew, h: eh } = SS.elSize(sel);
        start = { wx, wy, el: JSON.parse(JSON.stringify(sel)), ew, eh,
          d0: Math.hypot(wx - sel.x, wy - sel.y),
          a0: Math.atan2(wy - sel.y, wx - sel.x) };
        return;
      }
    }
    const hitEl = hitElement(wx, wy);
    if (hitEl) {
      st.selectedId = hitEl.id;
      SS.ui.showProps();
      mode = 'move';
      start = { wx, wy, ex: hitEl.x, ey: hitEl.y };
    } else {
      st.selectedId = null;
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
      const sel = SS.getSel();
      if (sel && start.el) {
        const f = dist / start.dist;
        scaleEl(sel, start.el, f);
        sel.rot = start.el.rot + (ang - start.ang) * 180 / Math.PI;
        SS.invalidateEl(sel);
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
    const sel = SS.getSel();

    if (mode === 'move' && sel) {
      sel.x = start.ex + (wx - start.wx);
      sel.y = start.ey + (wy - start.wy);
      applySnap(sel);
      SS.requestRender();
    } else if (mode === 'scale' && sel) {
      const d = Math.hypot(wx - sel.x, wy - sel.y);
      const f = SS.clamp(d / start.d0, 0.1, 12);
      scaleEl(sel, start.el, f);
      SS.invalidateEl(sel);
      SS.requestRender();
    } else if (mode === 'rotate' && sel) {
      const a = Math.atan2(wy - sel.y, wx - sel.x);
      let rot = start.el.rot + (a - start.a0) * 180 / Math.PI;
      // snap rotation to 0/±90/180 within 4°
      for (const t of [0, 90, 180, -90, -180]) if (Math.abs(rot - t) < 4) rot = t;
      sel.rot = rot;
      SS.requestRender();
    } else if (mode === 'pan') {
      st.panX = start.panX + (ev.offsetX - start.sx);
      st.panY = start.panY + (ev.offsetY - start.sy);
      SS.requestRender();
    }
  });

  function endPointer(ev) {
    pointers.delete(ev.pointerId);
    if (mode && mode !== 'pan') SS.pushHistory();
    if (pointers.size === 0) mode = null;
    SS._snapLines = null;
    SS.requestRender();
  }
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);

  function scaleEl(el, s0, f) {
    if (el.type === 'photo') el.h = SS.clamp(s0.h * f, 60, 4000);
    else if (el.type === 'text') el.size = SS.clamp(s0.size * f, 10, 500);
    else if (el.type === 'sticker' || el.type === 'emoji') el.s = SS.clamp(s0.s * f, 16, 3000);
    else if (el.type === 'blur') { el.w = SS.clamp(s0.w * f, 30, 4000); el.h = SS.clamp(s0.hh * f, 30, 4000); }
  }

  SS.invalidateEl = function (el) {
    if (el.type === 'photo') SS.cardCacheClear(el.id);
  };

  /* ---------- wheel zoom ---------- */
  canvas.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const f = SS.clamp(st.zoom * (ev.deltaY < 0 ? 1.1 : 0.9), 0.05, 4);
    st.panX = ev.offsetX - (ev.offsetX - st.panX) * f / st.zoom;
    st.panY = ev.offsetY - (ev.offsetY - st.panY) * f / st.zoom;
    st.zoom = f;
    SS.ui.zoomLabel();
    SS.requestRender();
  }, { passive: false });

  /* ---------- double click text edit focus ---------- */
  canvas.addEventListener('dblclick', (ev) => {
    const [wx, wy] = screenToWorld(ev.offsetX, ev.offsetY);
    const el = hitElement(wx, wy);
    if (el && el.type === 'text') {
      st.selectedId = el.id;
      SS.ui.showProps();
      setTimeout(() => {
        const ta = document.querySelector('#propsBody textarea');
        if (ta) { ta.focus(); ta.select(); }
      }, 60);
    }
  });

  /* ---------- keyboard ---------- */
  window.addEventListener('keydown', (ev) => {
    if (ev.target.tagName === 'TEXTAREA' || ev.target.tagName === 'INPUT' || ev.target.tagName === 'SELECT') return;
    const sel = SS.getSel();
    if ((ev.ctrlKey || ev.metaKey) && ev.key === 'z') { ev.preventDefault(); SS.undo(); return; }
    if ((ev.ctrlKey || ev.metaKey) && (ev.key === 'y' || (ev.shiftKey && ev.key === 'Z'))) { ev.preventDefault(); SS.redo(); return; }
    if (!sel) return;
    const step = ev.shiftKey ? 20 : 3;
    if (ev.key === 'Delete' || ev.key === 'Backspace') { SS.ui.deleteSel(); }
    else if (ev.key === 'ArrowLeft') { sel.x -= step; SS.requestRender(); }
    else if (ev.key === 'ArrowRight') { sel.x += step; SS.requestRender(); }
    else if (ev.key === 'ArrowUp') { sel.y -= step; SS.requestRender(); }
    else if (ev.key === 'ArrowDown') { sel.y += step; SS.requestRender(); }
    else if (ev.key === 'd' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); SS.ui.dupSel(); }
  });
})();
