/* Seamless Studio – Ebenen-Panel, Verlaufs-Leiste und Versionen */

(function () {
  const $ = SS.el;
  const panel = $('layersPanel');
  const list = $('lpList');
  const hist = $('lpHistory');

  /* ---------- Miniatur eines einzelnen Elements ---------- */
  function elThumb(el, px) {
    const cv = SS.makeCanvas(px, px);
    const c = cv.getContext('2d');
    c.fillStyle = 'rgba(255,255,255,.05)';
    c.fillRect(0, 0, px, px);
    try {
      const s = SS.elSize(el);
      const k = Math.min(px / Math.max(1, s.w), px / Math.max(1, s.h)) * 0.86;
      c.translate(px / 2, px / 2);
      c.scale(k, k);
      c.translate(-el.x, -el.y);
      const noAnim = SS._noAnim; SS._noAnim = true;
      if (el.type === 'blur') {
        c.save();
        c.translate(el.x, el.y);
        c.rotate(SS.deg2rad(el.rot || 0));
        c.fillStyle = 'rgba(200,180,170,.55)';
        SS.blurShapePath(c, el.shape, el.w * (el.scaleX || 1), el.h * (el.scaleY || 1));
        c.fill();
        c.restore();
      } else {
        SS.drawElement(c, el);
      }
      SS._noAnim = noAnim;
    } catch (e) {}
    return cv.toDataURL('image/png');
  }

  const TYPE_ICON = { photo: '📷', text: '🅣', sticker: '💛', emoji: '😊', blur: '🔒' };

  /* ---------- Liste aufbauen ---------- */
  let dragRow = null;

  SS.ui.refreshLayers = function () {
    if (panel.classList.contains('hidden')) return;
    list.innerHTML = '';
    const els = SS.state.elements;
    for (let i = els.length - 1; i >= 0; i--) {
      const el = els[i];
      const row = document.createElement('div');
      row.className = 'lp-row' + (SS.isSel(el.id) ? ' sel' : '') + (el.gid ? ' grouped' : '');
      row.dataset.id = el.id;
      row.draggable = true;

      const grip = document.createElement('span');
      grip.className = 'lp-grip'; grip.textContent = '⋮⋮';

      const th = document.createElement('img');
      th.className = 'lp-thumb';
      th.src = elThumb(el, 40);

      const nameBox = document.createElement('div');
      nameBox.className = 'lp-name';
      const nm = document.createElement('span');
      nm.textContent = (el.gid ? '🔗 ' : '') + (TYPE_ICON[el.type] || '•') + ' ' + SS.elName(el);
      nm.title = 'Doppeltippen zum Umbenennen';
      nm.ondblclick = () => {
        const v = prompt('Name der Ebene', SS.elName(el));
        if (v !== null) { el.name = v.trim() || undefined; SS.pushHistory('Ebene benannt'); SS.ui.refreshLayers(); }
      };
      nameBox.appendChild(nm);

      const op = document.createElement('input');
      op.type = 'range'; op.min = 5; op.max = 100; op.className = 'lp-op';
      op.value = Math.round((el.opacity ?? 1) * 100);
      op.addEventListener('input', () => { el.opacity = +op.value / 100; SS.requestRender(); });
      op.addEventListener('change', () => SS.pushHistory('Deckkraft'));
      op.addEventListener('pointerdown', e => e.stopPropagation());

      const eye = document.createElement('button');
      eye.className = 'lp-ico' + (el.hidden ? ' off' : '');
      eye.textContent = el.hidden ? '🙈' : '👁';
      eye.title = el.hidden ? 'Einblenden' : 'Ausblenden';
      eye.onclick = (e) => {
        e.stopPropagation();
        el.hidden = !el.hidden;
        SS.pushHistory(el.hidden ? 'Ausgeblendet' : 'Eingeblendet');
        SS.ui.refreshLayers(); SS.ui.showProps(); SS.requestRender();
      };

      const lock = document.createElement('button');
      lock.className = 'lp-ico' + (el.locked ? ' on' : '');
      lock.textContent = el.locked ? '🔒' : '🔓';
      lock.title = el.locked ? 'Entsperren' : 'Sperren';
      lock.onclick = (e) => {
        e.stopPropagation();
        el.locked = !el.locked;
        if (el.locked && SS.isSel(el.id)) SS.state.selectedIds = SS.state.selectedIds.filter(x => x !== el.id);
        SS.pushHistory(el.locked ? 'Gesperrt' : 'Entsperrt');
        SS.ui.refreshLayers(); SS.ui.showProps(); SS.requestRender();
      };

      row.appendChild(grip);
      row.appendChild(th);
      row.appendChild(nameBox);
      row.appendChild(op);
      row.appendChild(eye);
      row.appendChild(lock);

      row.addEventListener('click', (e) => {
        if (e.target.closest('.lp-ico') || e.target.closest('.lp-op')) return;
        if (e.shiftKey || e.ctrlKey || e.metaKey) SS.toggleSel(el.id);
        else SS.setSel(el.id);
        SS.ui.refreshLayers(); SS.ui.showProps(); SS.requestRender();
      });

      /* Ziehen zum Umsortieren – Maus und Finger */
      row.addEventListener('dragstart', (e) => {
        dragRow = row; row.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', el.id); } catch (err) {}
      });
      row.addEventListener('dragend', () => { row.classList.remove('dragging'); dragRow = null; commitOrder(); });
      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (!dragRow || dragRow === row) return;
        const rows = [...list.children];
        if (rows.indexOf(dragRow) < rows.indexOf(row)) list.insertBefore(row, dragRow);
        else list.insertBefore(dragRow, row);
      });

      row.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse') return;
        if (!e.target.closest('.lp-grip')) return;
        dragRow = row; row.classList.add('dragging');
        row.setPointerCapture(e.pointerId);
        const move = (m) => {
          const under = document.elementFromPoint(m.clientX, m.clientY);
          const over = under && under.closest ? under.closest('.lp-row') : null;
          if (!over || over === row || over.parentElement !== list) return;
          const rows = [...list.children];
          if (rows.indexOf(row) < rows.indexOf(over)) list.insertBefore(over, row);
          else list.insertBefore(row, over);
        };
        const up = () => {
          row.removeEventListener('pointermove', move);
          row.removeEventListener('pointerup', up);
          row.classList.remove('dragging'); dragRow = null;
          commitOrder();
        };
        row.addEventListener('pointermove', move);
        row.addEventListener('pointerup', up);
      });

      list.appendChild(row);
    }
    if (!els.length) list.innerHTML = '<p class="hint" style="padding:10px">Noch keine Ebenen.</p>';
    SS.ui.refreshHistory();
  };

  function commitOrder() {
    const ids = [...list.children].map(r => r.dataset.id).filter(Boolean).reverse();
    if (!ids.length) return;
    const map = {};
    SS.state.elements.forEach(e => { map[e.id] = e; });
    const next = ids.map(id => map[id]).filter(Boolean);
    if (next.length !== SS.state.elements.length) return;
    SS.state.elements = next;
    SS.pushHistory('Ebenen sortiert');
    SS.requestRender();
  }

  /* ---------- Verlaufs-Leiste ---------- */
  SS.ui.refreshHistory = function () {
    if (!hist || panel.classList.contains('hidden')) return;
    hist.innerHTML = '';
    const h = SS.history;
    h.stack.forEach((entry, i) => {
      const b = document.createElement('button');
      b.className = 'hs-step' + (i === h.idx ? ' now' : '') + (i > h.idx ? ' future' : '');
      b.innerHTML = `<span class="hs-dot"></span><span class="hs-label">${entry.label || 'Änderung'}</span>`;
      b.onclick = () => { SS.gotoHistory(i); SS.ui.refreshLayers(); };
      hist.appendChild(b);
    });
    hist.scrollTop = hist.scrollHeight;
  };

  /* ---------- Panel ein- und ausblenden ---------- */
  SS.ui.toggleLayers = function (force) {
    const show = force === undefined ? panel.classList.contains('hidden') : force;
    panel.classList.toggle('hidden', !show);
    $('btnLayers').classList.toggle('active', show);
    if (show) SS.ui.refreshLayers();
  };
  $('btnLayers').onclick = () => SS.ui.toggleLayers();
  $('lpClose').onclick = () => SS.ui.toggleLayers(false);
  $('lpGroup').onclick = () => SS.ui.groupSel();
  $('lpUngroup').onclick = () => SS.ui.ungroupSel();
  $('lpAll').onclick = () => {
    SS.setSelMany(SS.pickableElements().map(e => e.id));
    SS.ui.refreshLayers(); SS.ui.showProps(); SS.requestRender();
  };

  /* ---------- Versionen ---------- */
  $('lpSnapshot').onclick = async () => {
    if (!SS.state.elements.length) return SS.toast('Die Leinwand ist noch leer', 2200, 'warn');
    const name = prompt('Name dieser Version', 'Version ' +
      new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }));
    if (name === null) return;
    const imgs = {};
    for (const el of SS.state.elements) {
      if (el.type !== 'photo') continue;
      if (SS.images[el.imgId]) imgs[el.imgId] = SS.images[el.imgId].dataURL;
      if (el.imgIdOrig && SS.images[el.imgIdOrig]) imgs[el.imgIdOrig] = SS.images[el.imgIdOrig].dataURL;
    }
    SS.dbPut('ver:' + Date.now(), { snap: SS.serialize(), imgs, name, thumb: SS.ui.makeThumb ? SS.ui.makeThumb() : null });
    SS.toast('Version gesichert', 2200, 'ok');
    SS.ui.refreshVersions && SS.ui.refreshVersions();
  };

  /* Klick außerhalb schließt das Panel am Handy */
  document.addEventListener('pointerdown', (e) => {
    if (panel.classList.contains('hidden')) return;
    if (!window.matchMedia('(max-width: 760px)').matches) return;
    if (panel.contains(e.target) || e.target.closest('#btnLayers')) return;
    SS.ui.toggleLayers(false);
  });
})();
