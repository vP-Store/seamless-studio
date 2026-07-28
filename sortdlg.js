/* Seamless Studio – Foto-Import: Sortierdialog
   Nach der Auswahl erscheinen die Fotos als Kacheln. Reihenfolge per Ziehen
   oder mit den Pfeilen ändern, dann anordnen lassen. */

(function () {
  const $ = SS.el;

  /* items: [{dataURL, rec}]  →  Promise<{order:number[], mode:'order'|'auto'|'none'}|null>
     loadMore(FileList) → Promise<neue items>  (werden an items angehängt) */
  SS.sortDialog = function (items, loadMore) {
    return new Promise((resolve) => {
      const dlg = $('sortDlg');
      const grid = $('sortGrid');
      grid.innerHTML = '';
      dlg.classList.remove('hidden');
      $('sortCount').textContent = items.length + (items.length === 1 ? ' Foto' : ' Fotos');

      function addTile(it, i) {
        const tile = document.createElement('div');
        tile.className = 'sort-tile';
        tile.dataset.idx = String(i);
        tile.innerHTML =
          `<img src="${it.dataURL}" draggable="false" alt="">` +
          `<span class="st-num"></span>` +
          `<div class="st-arrows"><button class="st-l" title="Nach vorn">←</button>` +
          `<button class="st-r" title="Nach hinten">→</button></div>`;
        grid.appendChild(tile);
      }
      items.forEach(addTile);
      renumber();
      $('sortCount').textContent = items.length + (items.length === 1 ? ' Foto' : ' Fotos');

      /* ---- weitere Fotos nachladen ---- */
      const moreInp = $('sortMoreInput');
      const onMore = async (e) => {
        const fl = e.target.files;
        if (!fl || !fl.length || !loadMore) return;
        SS.toast('Lade weitere Fotos …', 1600);
        try {
          const neu = await loadMore(fl);
          const ab = items.length;
          neu.forEach((it, k) => { items.push(it); addTile(it, ab + k); });
          renumber();
          $('sortCount').textContent = items.length + (items.length === 1 ? ' Foto' : ' Fotos');
          SS.toast(`${neu.length} weitere Fotos hinzugefügt — jetzt sind es ${items.length}`, 2600, 'ok');
        } catch (err) { SS.toast('Konnte nicht geladen werden', 2400, 'err'); }
        e.target.value = '';
      };
      moreInp.addEventListener('change', onMore);

      function tiles() { return [...grid.children]; }
      function renumber() { tiles().forEach((t, i) => { t.querySelector('.st-num').textContent = i + 1; }); }

      /* ---- Pfeiltasten ---- */
      grid.addEventListener('click', (e) => {
        const l = e.target.closest('.st-l'), r = e.target.closest('.st-r');
        if (!l && !r) return;
        const tile = e.target.closest('.sort-tile');
        const list = tiles(), i = list.indexOf(tile);
        if (l && i > 0) grid.insertBefore(tile, list[i - 1]);
        if (r && i < list.length - 1) grid.insertBefore(list[i + 1], tile);
        renumber();
      });

      /* ---- Ziehen (Maus und Finger) ---- */
      let drag = null;
      grid.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.st-arrows')) return;
        const tile = e.target.closest('.sort-tile');
        if (!tile) return;
        drag = { tile, id: e.pointerId };
        tile.setPointerCapture(e.pointerId);
        tile.classList.add('dragging');
      });
      grid.addEventListener('pointermove', (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        e.preventDefault();
        const under = document.elementFromPoint(e.clientX, e.clientY);
        const over = under && under.closest ? under.closest('.sort-tile') : null;
        if (!over || over === drag.tile || over.parentElement !== grid) return;
        const list = tiles();
        const a = list.indexOf(drag.tile), b = list.indexOf(over);
        if (a < b) grid.insertBefore(over, drag.tile);
        else grid.insertBefore(drag.tile, over);
        renumber();
      });
      const endDrag = () => {
        if (!drag) return;
        drag.tile.classList.remove('dragging');
        drag = null;
      };
      grid.addEventListener('pointerup', endDrag);
      grid.addEventListener('pointercancel', endDrag);

      /* ---- Abschluss ---- */
      function finish(mode) {
        const order = tiles().map(t => +t.dataset.idx);
        cleanup();
        resolve(mode ? { order, mode } : null);
      }
      function cleanup() {
        dlg.classList.add('hidden');
        ['sortApply', 'sortAuto', 'sortCancel', 'sortClose', 'sortReverse', 'sortShuffleBtn']
          .forEach(id => { const b = $(id); if (b) b.onclick = null; });
        moreInp.removeEventListener('change', onMore);
      }
      $('sortApply').onclick = () => finish('order');     // links → rechts wie gezeigt
      $('sortAuto').onclick = () => finish('auto');       // App wählt einen schönen Rhythmus
      $('sortCancel').onclick = () => finish('none');     // nur einfügen, nichts anordnen
      $('sortClose').onclick = () => finish(null);        // Import abbrechen
      $('sortReverse').onclick = () => { tiles().reverse().forEach(t => grid.appendChild(t)); renumber(); };
      $('sortShuffleBtn').onclick = () => {
        const list = tiles();
        for (let i = list.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [list[i], list[j]] = [list[j], list[i]];
        }
        list.forEach(t => grid.appendChild(t));
        renumber();
      };
    });
  };
})();
