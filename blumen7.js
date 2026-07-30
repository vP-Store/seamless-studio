/* Seamless Studio – Blumensticker
   ============================================================================
   31 gezeichnete Blumen in Farbe: Margeriten, Sonnenblumen, Plumeria,
   Kirschblueten, Hibiskus, Kosmeen, Rosen, Mohn, Anemonen, Lavendel und
   kleine Straeusse.

   Unterschied zu den Symbolen: die Blumen werden NICHT eingefaerbt. Ihre
   Farbe ist der Punkt, deshalb liegen sie als RGBA vor und `el.color` bleibt
   ohne Wirkung. Damit ein Look sie nicht trotzdem umfaerbt, tragen sie die
   Kategorie `bl-blumen`, und applyLook wird so umschlossen, dass es sie
   auslaesst – genau wie es das bei Privacy-Stickern schon tut.

   Laedt nach blumen7_daten.js.
   ========================================================================= */

(function () {
  const BILDER = SS.BLUMEN_BILDER;
  const META = SS.BLUMEN_META;
  if (!BILDER || !META || !SS.STICKERS) return;

  const KAT = { id: 'bl-blumen', name: '❀ Blumen' };

  /* ---------- Laden ---------- */
  const geladen = {};
  let offen = 0, geplant = false;

  function nachschieben() {
    if (geplant) return;
    geplant = true;
    setTimeout(() => {
      geplant = false;
      SS.requestRender && SS.requestRender();
      if (SS.ui && SS.ui.blumenNeuZeichnen) SS.ui.blumenNeuZeichnen();
    }, 60);
  }

  function bild(id) {
    let e = geladen[id];
    if (e) return e;
    const url = BILDER[id];
    if (!url) return null;
    const img = new Image();
    e = geladen[id] = { img, fertig: false, fehler: false };
    offen++;
    img.onload = () => { e.fertig = true; offen--; nachschieben(); };
    img.onerror = () => { e.fehler = true; offen--; nachschieben(); };
    img.src = url;
    return e;
  }

  SS.blumen = {
    bereit(ids) {
      const liste = ids || (SS.state && SS.state.elements || [])
        .filter(el => el && el.type === 'sticker' && BILDER[el.kind])
        .map(el => el.kind);
      for (const id of liste) bild(id);
      return new Promise((fertig) => {
        const pruefen = () => {
          const offenNoch = liste.some(id => {
            const e = geladen[id];
            return e && !e.fertig && !e.fehler;
          });
          if (!offenNoch) return fertig(true);
          setTimeout(pruefen, 40);
        };
        pruefen();
      });
    },
    stand() {
      const ids = Object.keys(BILDER);
      let fertig = 0, fehler = 0;
      for (const id of ids) {
        const e = geladen[id];
        if (!e) continue;
        if (e.fertig) fertig++;
        if (e.fehler) fehler++;
      }
      return { gesamt: ids.length, angefordert: Object.keys(geladen).length,
               fertig, fehler, offen };
    },
  };

  /* ---------- Anmelden ---------- */
  let angemeldet = 0;
  for (const m of META) {
    if (!BILDER[m.id] || SS.STICKERS.some(s => s.id === m.id)) continue;
    const ar = m.ar || 1;
    SS.STICKERS.push({
      id: m.id, cat: m.cat, name: m.name, ar,
      draw(c, s) {
        const e = bild(m.id);
        if (!e || !e.fertig) return;
        const w = s * ar, h = s;
        c.drawImage(e.img, -w / 2, -h / 2, w, h);
      },
    });
    angemeldet++;
  }

  /* ---------- Reiter ---------- */
  (function () {
    const tabs = SS.el('stTabs');
    if (!tabs || tabs.querySelector(`[data-cat="${KAT.id}"]`)) return;
    const muster = tabs.querySelector('[data-cat="herzen"]')
                || tabs.querySelector('button[data-cat]');
    if (!muster || typeof muster.onclick !== 'function') return;

    function zeige(knopf) {
      const merk = muster.getAttribute('data-cat');
      muster.setAttribute('data-cat', KAT.id);
      try { muster.onclick(); } finally { muster.setAttribute('data-cat', merk); }
      tabs.querySelectorAll('button').forEach(x => x.classList.remove('active'));
      if (knopf) knopf.classList.add('active');
      for (const s of SS.STICKERS) if (s.cat === KAT.id) bild(s.id);
    }
    const b = document.createElement('button');
    b.setAttribute('data-cat', KAT.id);
    b.textContent = KAT.name;
    b.onclick = () => zeige(b);
    const nach = tabs.querySelector('[data-cat="funkeln"]');
    if (nach) tabs.insertBefore(b, nach); else tabs.appendChild(b);

    SS.ui = SS.ui || {};
    SS.ui.blumenNeuZeichnen = function () {
      const aktiv = tabs.querySelector('button.active');
      if (aktiv && aktiv.getAttribute('data-cat') === KAT.id) zeige(aktiv);
    };
  })();

  /* ---------- Looks duerfen Blumen nicht umfaerben ----------
     applyLook faerbt jeden Sticker ausser Privacy. Bei einer roten Mohnblume
     waere das Unsinn. Der Wert wird deshalb vor dem Look gesichert und
     danach zurueckgeschrieben – ohne applyLook selbst anzufassen, denn die
     Funktion ist modulintern und nur ueber die Kachel erreichbar. */
  (function () {
    const panel = SS.el('bgGrid') || document;
    panel.addEventListener('click', () => {
      const merk = (SS.state.elements || [])
        .filter(e => e.type === 'sticker' && e.cat === KAT.id)
        .map(e => [e, e.color]);
      if (!merk.length) return;
      setTimeout(() => {
        let geaendert = 0;
        for (const [el, farbe] of merk) {
          if (el.color !== farbe) { el.color = farbe; geaendert++; }
        }
        if (geaendert) SS.requestRender && SS.requestRender();
      }, 0);
    }, true);
  })();

  /* ---------- Export absichern ---------- */
  let gesichert = false;
  if (typeof SS.wakeOn === 'function') {
    const alt = SS.wakeOn;
    SS.wakeOn = async function () {
      const r = await alt.apply(this, arguments);
      try { await SS.blumen.bereit(); } catch (e) {}
      return r;
    };
    gesichert = true;
  }

  SS.BLUMEN = { angemeldet, kategorie: KAT.id,
                exportgesichert: gesichert ? 'ueber SS.wakeOn' : 'NICHT gesichert' };
})();
