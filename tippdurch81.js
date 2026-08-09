/* Seamless Studio – durch gestapelte Elemente tippen (v8.1)
   ============================================================================
   In einer Collage liegen Fotos, Clips und Sticker übereinander. `interact.js`
   greift beim Tippen immer das **oberste** Element an dieser Stelle:

       for (let i = list.length - 1; i >= 0; i--) { … return el; }

   Was darunter liegt, ist damit nicht erreichbar – auch nicht über das
   Ebenen-Fenster: sobald man es dort wählt und dann auf der Leinwand anfasst,
   springt die Auswahl wieder auf das obere Element. Genau so fühlt es sich an,
   als „ließe sich ein Clip nicht mehr bewegen", obwohl mit dem Clip alles in
   Ordnung ist.

   Nachgemessen über alle 23 Szenen: in **10 von ihnen** liegt die Mitte
   mindestens eines Fotoplatzes unter einem anderen Element – meist unter einem
   Nachbarfoto, manchmal unter Washi-Tape oder Fotoecken. Beim Highschool-Heft
   sind es vier Plätze von vierzig.

   Hier wird daraus ein Durchtippen: **nochmal auf dieselbe Stelle tippen holt
   das nächste Element darunter.** Ein kurzer Hinweis sagt, das wievielte von
   wie vielen gerade dran ist – sonst würde niemand darauf kommen.

   Der Kniff ist derselbe wie bei `SS.HANDLE` in `frei80.js`: nicht
   `interact.js` umschreiben, sondern die öffentliche Funktion umhüllen, aus
   der es seine Trefferliste zieht. `SS.pickableElements` liefert für die Dauer
   einer Berührung eine Liste, in der das gewählte Element **oben** steht.
   Damit greifen `interact.js`, `platzhalter7.js` und alles andere dasselbe
   Element, ohne davon zu wissen.

   Gezählt wird nur weiter, wenn die vorige Berührung ein **Tipp** war (unter
   8 px Weg). Nach einem echten Zug fängt die Zählung wieder oben an – sonst
   würde das zweite Anfassen desselben Fotos versehentlich das Nachbarfoto
   greifen.
   ========================================================================= */

(function () {
  const canvas = document.getElementById('canvas');
  if (!canvas || !SS.state || typeof SS.pickableElements !== 'function') return;
  const st = SS.state;

  const NAH = 12;        // Bildschirmpunkte, die als „dieselbe Stelle" gelten
  const FRIST = 2600;    // ms, in denen weitergezählt wird
  const ZUG = 8;         // ab hier war es ein Zug, kein Tipp

  let obenauf = null;    // Element, das für diese Berührung oben liegen soll
  let letzter = null;    // { sx, sy, t, idx, ids }
  let lauf = null;       // { sx, sy, stapel, idx }

  /* ------------------------------------------------------------------
     1 · Trefferliste umsortieren – nur solange eine Berührung läuft
     ------------------------------------------------------------------ */
  const origPick = SS.pickableElements;
  SS.pickableElements = function () {
    const liste = origPick.apply(this, arguments);
    const w = obenauf;
    if (!w) return liste;
    const i = liste.indexOf(w);
    if (i < 0) return liste;
    const out = liste.slice(0, i).concat(liste.slice(i + 1));
    out.push(w);
    return out;
  };

  function frei() { obenauf = null; }

  /* ------------------------------------------------------------------
     2 · Was liegt unter dem Finger? Oberstes zuerst.
     ------------------------------------------------------------------ */
  function stapelUnter(wx, wy) {
    const liste = origPick.call(SS);
    const out = [];
    for (let i = liste.length - 1; i >= 0; i--) {
      const el = liste[i];
      let s;
      try { s = SS.elSize(el); } catch (e) { continue; }
      const [lx, ly] = SS.toLocal(wx, wy, el.x, el.y, el.rot || 0);
      if (Math.abs(lx) <= s.w / 2 && Math.abs(ly) <= s.h / 2) out.push(el);
    }
    return out;
  }
  SS.stapelUnter = stapelUnter;

  function name(el) {
    if (!el) return '';
    if (el.type === 'photo') return el.ph && !(el.imgId && SS.images[el.imgId]) ? 'Platzhalter' : 'Foto';
    if (el.type === 'video') return 'Clip';
    if (el.type === 'text') return 'Text';
    if (el.type === 'emoji') return 'Emoji';
    if (el.type === 'sticker') return 'Sticker';
    if (el.type === 'blur') return 'Weichzeichner';
    return el.type;
  }

  /* ------------------------------------------------------------------
     3 · Berührung
     ------------------------------------------------------------------ */
  function darf(ev) {
    if (ev.button) return false;
    if (ev.target !== canvas) return false;
    if (SS.panMode || SS._spacePan || SS.lassoMode || SS.addMode || SS.pickMode) return false;
    if (SS.pfadEdit) return false;
    if (ev.shiftKey || ev.ctrlKey || ev.metaKey) return false;
    return true;
  }

  window.addEventListener('pointerdown', (ev) => {
    lauf = null;
    if (!darf(ev)) { frei(); return; }
    /* Griffe von frei80.js haben Vorrang: liegt die Berührung auf einem Griff,
       hat frei80 die Weitergabe schon gestoppt und wir kommen nie hierher. */
    const r = canvas.getBoundingClientRect();
    const sx = ev.clientX - r.left, sy = ev.clientY - r.top;
    const wx = (sx - st.panX) / st.zoom, wy = (sy - st.panY) / st.zoom;

    const stapel = stapelUnter(wx, wy);
    if (stapel.length < 2) { frei(); letzter = null; return; }

    const ids = stapel.map(e => e.id).join(',');
    const jetzt = performance.now();
    let idx = 0;
    if (letzter && letzter.ids === ids && jetzt - letzter.t < FRIST
        && Math.hypot(sx - letzter.sx, sy - letzter.sy) < NAH) {
      idx = (letzter.idx + 1) % stapel.length;
    }
    letzter = { sx, sy, t: jetzt, idx, ids };
    obenauf = idx > 0 ? stapel[idx] : null;
    lauf = { sx, sy, stapel, idx };
  }, true);

  function schluss(ev) {
    const l = lauf; lauf = null;
    /* Erst freigeben, wenn ALLE Dienste dieser Berührung durch sind – auch
       `platzhalter7.js`, das erst am pointerup nachsieht, was getroffen wurde. */
    setTimeout(frei, 0);
    if (!l) return;
    const r = canvas.getBoundingClientRect();
    const weg = Math.hypot((ev.clientX - r.left) - l.sx, (ev.clientY - r.top) - l.sy);
    if (weg > ZUG) { letzter = null; return; }      // war ein Zug: Zählung zurück
    letzter.t = performance.now();                   // Frist ab dem Loslassen
    if (SS.toast && l.stapel.length > 1) {
      const el = l.stapel[l.idx];
      SS.toast(`${name(el)} – ${l.idx + 1} von ${l.stapel.length} an dieser Stelle. `
        + 'Nochmal tippen holt das nächste darunter.', 2600, 'info');
    }
  }
  window.addEventListener('pointerup', schluss, false);
  window.addEventListener('pointercancel', () => { lauf = null; setTimeout(frei, 0); }, false);
  window.addEventListener('blur', () => { lauf = null; frei(); });

  SS.TIPPDURCH81 = { bereit: true, version: '8.1.0' };
})();
