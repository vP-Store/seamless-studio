/* Seamless Studio – Symbolbibliothek
   ============================================================================
   291 freigestellte Symbole: Monde, Lotus, Lebensbaum, Ankh, Yin & Yang,
   Pentagramme, Mandalas, heilige Geometrie und Funken.

   Gespeichert ist nur der Alphakanal (symbole7_daten.js). Gezeichnet wird
   eingefaerbt, damit sich die Symbole genauso verhalten wie die gezeichneten
   Sticker: der Farbwaehler wirkt, und die Looks faerben sie mit.

   Drei Dinge sind dabei zu beachten:

   1. Bilder aus data:-URLs sind NICHT sofort da. SS.drawStickerEl zeichnet
      synchron. Ein Symbol, dessen Maske noch nicht dekodiert ist, wuerde
      also fehlen – im Bild wie im Export. Deshalb: beim ersten Zeichnen das
      Laden anstossen, nichts zeichnen, und nach dem Laden neu zeichnen.
   2. Der Export darf nicht starten, solange etwas fehlt. Die Exportwege
      werden umschlossen und warten auf SS.symbole.bereit().
   3. Eingefaerbte Fassungen werden zwischengespeichert, sonst kostet jedes
      Bild eines Videos eine neue Komposition.

   Laedt nach symbole7_daten.js.
   ========================================================================= */

(function () {
  const MASKEN = SS.SYMBOL_MASKEN;
  if (!MASKEN || !SS.STICKERS) return;

  const KATS = [
    { id: 'sy-mond', name: '☾ Monde' },
    { id: 'sy-lotus', name: '✿ Lotus' },
    { id: 'sy-lebensbaum', name: 'Lebensbaum' },
    { id: 'sy-ankh', name: '☥ Ankh' },
    { id: 'sy-yinyang', name: '☯ Yin & Yang' },
    { id: 'sy-pentagramm', name: '✦ Pentagramm' },
    { id: 'sy-mandala', name: '✺ Mandala' },
    { id: 'sy-geometrie', name: '✧ Geometrie' },
    { id: 'sy-funken', name: '✴ Funken' },
  ];

  /* ---------- Laden ---------- */
  const bilder = {};          // id -> {img, fertig, fehler}
  let offen = 0;
  let neuzeichnenGeplant = false;

  function nachschieben() {
    if (neuzeichnenGeplant) return;
    neuzeichnenGeplant = true;
    setTimeout(() => {
      neuzeichnenGeplant = false;
      SS.requestRender && SS.requestRender();
      if (SS.ui && SS.ui.symboleNeuZeichnen) SS.ui.symboleNeuZeichnen();
    }, 60);
  }

  /* Die Maske kommt als Graustufenbild (das spart mehr als die Haelfte,
     siehe packen.py). Fuer das Einfaerben per 'source-in' muss sie aber im
     ALPHAKANAL liegen – ein deckendes Graubild wuerde als volles Rechteck
     durchkommen. Nachgemessen: genau das passierte beim ersten Versuch.
     Also einmal beim Laden umrechnen: Alpha = Helligkeit, RGB = Weiss. */
  function alphaMaske(img) {
    const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    const cv = SS.makeCanvas(w, h);
    const c = cv.getContext('2d', { willReadFrequently: true });
    c.drawImage(img, 0, 0);
    const d = c.getImageData(0, 0, w, h);
    const p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      p[i + 3] = p[i];              // Helligkeit -> Deckkraft
      p[i] = p[i + 1] = p[i + 2] = 255;
    }
    c.putImageData(d, 0, 0);
    return cv;
  }

  function bild(id) {
    let e = bilder[id];
    if (e) return e;
    const url = MASKEN[id];
    if (!url) return null;
    const img = new Image();
    e = bilder[id] = { img, maske: null, fertig: false, fehler: false };
    offen++;
    img.onload = () => {
      try { e.maske = alphaMaske(img); e.fertig = true; }
      catch (err) { e.fehler = true; }
      offen--; nachschieben();
    };
    img.onerror = () => { e.fehler = true; offen--; nachschieben(); };
    img.src = url;
    return e;
  }

  /* Alles laden, was die Szene gerade braucht, und darauf warten. */
  SS.symbole = {
    bereit(ids) {
      const liste = ids || (SS.state && SS.state.elements || [])
        .filter(el => el && el.type === 'sticker' && MASKEN[el.kind])
        .map(el => el.kind);
      for (const id of liste) bild(id);
      return new Promise((fertig) => {
        const pruefen = () => {
          const offenNoch = liste.some(id => {
            const e = bilder[id];
            return e && !e.fertig && !e.fehler;
          });
          if (!offenNoch) return fertig(true);
          setTimeout(pruefen, 40);
        };
        pruefen();
      });
    },
    alleLaden() {
      for (const id in MASKEN) bild(id);
      return SS.symbole.bereit(Object.keys(MASKEN));
    },
    stand() {
      const ids = Object.keys(MASKEN);
      let fertig = 0, fehler = 0;
      for (const id of ids) {
        const e = bilder[id];
        if (!e) continue;
        if (e.fertig) fertig++;
        if (e.fehler) fehler++;
      }
      return { gesamt: ids.length, angefordert: Object.keys(bilder).length,
               fertig, fehler, offen };
    },
  };

  /* ---------- Einfaerben ---------- */
  /* Die Maske liegt als Graustufenbild vor; source-in stanzt die Farbe hinein.
     Ergebnis wird je (id, Farbe, Groessenstufe) gemerkt. */
  const tonCache = new Map();
  const CACHE_MAX = 160;

  function eingefaerbt(id, farbe, breite, hoehe) {
    const e = bild(id);
    if (!e || !e.fertig) return null;
    /* Groesse in Stufen, damit nicht jede Zwischengroesse eine neue Kopie
       erzeugt. Zwei Stufen je Verdopplung reichen; darueber wird skaliert. */
    const stufe = Math.min(2048, Math.max(32,
      Math.pow(2, Math.ceil(Math.log2(Math.max(breite, hoehe)) * 2) / 2)));
    const schluessel = id + '|' + farbe + '|' + stufe;
    let rec = tonCache.get(schluessel);
    if (rec) { tonCache.delete(schluessel); tonCache.set(schluessel, rec); return rec; }

    const quelle = e.maske || e.img;
    const ar = quelle.width / Math.max(1, quelle.height);
    const w = ar >= 1 ? stufe : Math.max(1, Math.round(stufe * ar));
    const h = ar >= 1 ? Math.max(1, Math.round(stufe / ar)) : stufe;
    const cv = SS.makeCanvas(w, h);
    const c = cv.getContext('2d');
    c.drawImage(quelle, 0, 0, w, h);
    c.globalCompositeOperation = 'source-in';
    c.fillStyle = farbe || '#c9a15f';
    c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'source-over';
    rec = { canvas: cv, w, h };
    tonCache.set(schluessel, rec);
    while (tonCache.size > CACHE_MAX) {
      const alt = tonCache.keys().next().value;
      const weg = tonCache.get(alt);
      tonCache.delete(alt);
      if (weg && weg.canvas && SS.freeCanvas) SS.freeCanvas(weg.canvas);
    }
    return rec;
  }

  /* ---------- Anmelden ---------- */
  const META = SS.SYMBOL_META || null;
  const liste = META || Object.keys(MASKEN).map(id => {
    const teile = id.split('-');
    return { id, cat: 'sy-' + teile[1], name: teile[1] + ' ' + teile[2], ar: 1 };
  });

  let angemeldet = 0;
  for (const m of liste) {
    if (!MASKEN[m.id]) continue;
    if (SS.STICKERS.some(s => s.id === m.id)) continue;
    const ar = m.ar || 1;
    SS.STICKERS.push({
      id: m.id, cat: m.cat, name: m.name, ar,
      draw(c, s, farbe) {
        const w = s * ar, h = s;
        const rec = eingefaerbt(m.id, farbe || '#c9a15f', w, h);
        if (!rec) return;              // noch nicht geladen – kommt gleich
        c.drawImage(rec.canvas, -w / 2, -h / 2, w, h);
      },
    });
    angemeldet++;
  }

  /* ---------- Reiter in der Bibliothek ---------- */
  (function () {
    const tabs = SS.el('stTabs');
    if (!tabs) return;
    /* ui.js haengt die Behandler EINMAL beim Laden an alle vorhandenen
       Knoepfe (`b.onclick = ...`, ui.js:611). Neue Knoepfe bekommen also
       nichts ab. Die Funktion, die das Raster fuellt, ist modulintern und
       von aussen nicht zu erreichen.

       Deshalb der Umweg ueber einen vorhandenen Knopf: dessen data-cat wird
       kurz auf die eigene Kategorie gesetzt, sein Behandler gerufen und der
       Wert danach zurueckgesetzt. Das benutzt genau den Weg der App – die
       Kacheln entstehen also mit derselben Funktion wie ueberall sonst. */
    const muster = tabs.querySelector('[data-cat="herzen"]')
                || tabs.querySelector('button[data-cat]');
    if (!muster || typeof muster.onclick !== 'function') return;

    function zeige(catId, knopf) {
      const merk = muster.getAttribute('data-cat');
      muster.setAttribute('data-cat', catId);
      try { muster.onclick(); } finally { muster.setAttribute('data-cat', merk); }
      tabs.querySelectorAll('button').forEach(x => x.classList.remove('active'));
      if (knopf) knopf.classList.add('active');
      for (const s of SS.STICKERS) if (s.cat === catId) bild(s.id);
    }

    let zuletzt = null;
    for (const k of KATS) {
      if (tabs.querySelector(`[data-cat="${k.id}"]`)) continue;
      const b = document.createElement('button');
      b.setAttribute('data-cat', k.id);
      b.textContent = k.name;
      b.onclick = () => zeige(k.id, b);
      /* Hinter „Funkeln" einsortieren statt ganz ans Ende: die Reiterzeile
         ist schon lang, und was hinten liegt, findet niemand. Dabei hinter
         den ZULETZT eingefuegten haengen – sonst dreht sich die Reihenfolge
         um, weil jeder neue Knopf direkt hinter „Funkeln" landet. */
      const anker = zuletzt || tabs.querySelector('[data-cat="funkeln"]');
      if (anker && anker.nextSibling) tabs.insertBefore(b, anker.nextSibling);
      else if (anker) tabs.appendChild(b);
      else tabs.appendChild(b);
      zuletzt = b;
    }

    /* Die Kacheln zeichnen sich beim Anlegen; solange eine Maske fehlt,
       bleiben sie leer. Deshalb nach dem Laden einmal neu aufbauen. */
    SS.ui = SS.ui || {};
    SS.ui.symboleNeuZeichnen = function () {
      const aktiv = tabs.querySelector('button.active');
      if (!aktiv) return;
      const cat = aktiv.getAttribute('data-cat');
      if (!cat || cat.indexOf('sy-') !== 0) return;
      zeige(cat, aktiv);
    };
  })();

  /* ---------- Export absichern ---------- */
  /* Ohne das koennte ein Export starten, bevor eine Maske dekodiert ist –
     das Symbol fehlte dann still im fertigen Bild und niemand saehe es.

     Die Exportwege sind Klick-Behandler und haben keinen Namen, den man
     umschliessen koennte. Sie haben aber alle dieselbe erste Zeile:
     `await SS.wakeOn()` (exporter.js:208 und :257, export5.js:256,
     video.js:324). Genau dort wird eingehakt – ein Punkt fuer alle fuenf
     Exportwege, ohne einen Behandler anzufassen. */
  let wakeGesichert = false;
  if (typeof SS.wakeOn === 'function') {
    const alt = SS.wakeOn;
    SS.wakeOn = async function () {
      const r = await alt.apply(this, arguments);
      try { await SS.symbole.bereit(); } catch (e) {}
      return r;
    };
    wakeGesichert = true;
  }

  SS.SYMBOLE = { angemeldet, kategorien: KATS.map(k => k.id),
                 exportgesichert: wakeGesichert ? 'ueber SS.wakeOn' : 'NICHT gesichert' };
})();
