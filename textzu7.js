/* Seamless Studio – Text zu Karussell (der eBook-Verwerter)
   ============================================================================
   Scotts eBooks, Journale und Kartentexte sind eine Content-Goldgrube.
   Dieser Dialog macht daraus Karussells: Text einkleben, die App schlaegt
   die Kernsaetze vor (GLIEDERUNGSVORSCHAU - an/abwaehlbar und umformulierbar,
   denn eine Heuristik raet nur), "Bauen" setzt daraus die Szene:

     Slide 1: Hook (staerkster Satz, Titelschrift aus dem Marken-Set)
     dazwischen: EIN Gedanke je Slide, mit kleinem Zaehler
     letzte Slide: Abschluss mit Speichern-Aufruf und Handle

   Bewusst OHNE Sprachmodell - alles offline und nachvollziehbar. Wer
   Feineres will, laesst sich Serien ueber das Rezeptformat liefern.
   ========================================================================= */

(function () {
  if (!SS.ui || typeof SS.textUmbrechen !== 'function') return;

  const SIGNAL = /\b(fehler|schritt|tipp|wichtig|nie|immer|warum|wie du|geheimnis|wahrheit|regel|niemand|jeder|sofort|einfach|hör auf|beginne|merke)\b/i;

  /* ------------------------------------------------------ Satz-Heuristik */
  function saetze(text) {
    /* Absaetze -> Saetze. Abkuerzungen grob geschuetzt (z.B., u.a., Nr.). */
    const geschuetzt = text.replace(/\b(z|u|o|d|Nr|bzw|ca|evtl|ggf|inkl|etc)\.\s/gi, '$1․ ');
    const roh = [];
    geschuetzt.split(/\n{2,}/).forEach((absatz, ai) => {
      absatz.split(/(?<=[.!?…])\s+/).forEach((s, si) => {
        const satz = s.replace(/․/g, '.').replace(/\s+/g, ' ').trim();
        if (satz.length >= 15) roh.push({ satz, absatz: ai, ersterImAbsatz: si === 0 });
      });
    });
    return roh;
  }

  function bewerten(k) {
    let p = 0;
    const n = k.satz.length;
    if (n >= 40 && n <= 160) p += 3;
    else if (n < 40) p += 1;
    if (SIGNAL.test(k.satz)) p += 2;
    if (/\d/.test(k.satz)) p += 1;
    if (/\?$/.test(k.satz)) p += 2;
    if (k.ersterImAbsatz) p += 1;
    if (n > 220) p -= 2;
    return p;
  }

  function aehnlich(a, b) {
    const wa = new Set(a.toLowerCase().split(/\W+/).filter(w => w.length > 3));
    const wb = b.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    if (!wa.size || !wb.length) return 0;
    return wb.filter(w => wa.has(w)).length / Math.max(wa.size, wb.length);
  }

  function gliedern(text, ziel) {
    const alle = saetze(text).map(k => Object.assign(k, { punkte: bewerten(k) }));
    /* Hook: bester kurzer Satz aus dem ersten Drittel */
    const drittel = alle.slice(0, Math.max(3, Math.ceil(alle.length / 3)));
    const hook = drittel.slice().sort((a, b) => b.punkte - a.punkte)[0] || alle[0];
    /* Gedanken: beste uebrige, Redundanz raus, Reihenfolge des Textes */
    const rest = alle.filter(k => k !== hook)
      .sort((a, b) => b.punkte - a.punkte);
    const gewaehlt = [];
    for (const k of rest) {
      if (gewaehlt.length >= ziel - 2) break;
      if (gewaehlt.some(g => aehnlich(g.satz, k.satz) > 0.5)) continue;
      if (hook && aehnlich(hook.satz, k.satz) > 0.5) continue;
      gewaehlt.push(k);
    }
    gewaehlt.sort((a, b) => alle.indexOf(a) - alle.indexOf(b));
    return { hook: hook ? hook.satz : '', gedanken: gewaehlt.map(k => k.satz) };
  }

  /* ------------------------------------------------------------- Bauen */
  const marke = () => SS.marke || {};
  const ueberVideo = () => !!(SS.clip && SS.clip.ready);

  function textEl(o) {
    const dunkelBg = ueberVideo();
    return SS.normalizeEl(Object.assign({
      id: SS.uid(), type: 'text', align: 'center',
      color: dunkelBg ? '#F6EEDC' : '#2f2a26',
      shadow: dunkelBg, shadowColor: '#100b07', shadowBlur: 24, shadowX: 0, shadowY: 4,
      bgStyle: 'none', lineHeight: 1.25,
    }, o));
  }

  function bauen(hook, gedanken, kicker) {
    const st = SS.state;
    const n = gedanken.length + 2;
    /* Slidezahl ueber die UI-Wege */
    const plus = document.getElementById('slidesPlus');
    const minus = document.getElementById('slidesMinus');
    let schutz = 0;
    while (st.slides < n && schutz++ < 30) plus.click();
    while (st.slides > n && schutz++ < 60) minus.click();
    const k = SS.canvasSize();
    const sw = k.slideW;
    const neu = [];

    neu.push(textEl({ content: (kicker || 'ZUM MITNEHMEN').toUpperCase(),
      x: sw / 2, y: k.H * 0.185, size: Math.round(k.H * 0.019),
      font: marke().schriftText || 'Poppins', letterSpacing: 7,
      color: ueberVideo() ? 'rgba(255,255,255,.8)' : '#a29380' }));
    neu.push(textEl({ content: hook, x: sw / 2, y: k.H * 0.40,
      size: Math.round(k.H * 0.068), font: marke().schriftTitel || 'Playfair Display',
      lineHeight: 1.14 }));
    neu.push(textEl({ content: 'WEITER →', x: sw / 2, y: k.H * 0.88,
      size: Math.round(k.H * 0.018), font: marke().schriftText || 'Poppins',
      letterSpacing: 5, color: ueberVideo() ? 'rgba(255,255,255,.75)' : '#a29380' }));

    gedanken.forEach((g, i) => {
      const s = i + 1;
      neu.push(textEl({ content: (s) + ' / ' + (n - 1), x: s * sw + sw / 2,
        y: k.H * 0.14, size: Math.round(k.H * 0.019),
        font: marke().schriftText || 'Poppins', letterSpacing: 5,
        color: ueberVideo() ? 'rgba(255,255,255,.7)' : '#a29380' }));
      neu.push(textEl({ content: g, x: s * sw + sw / 2, y: k.H * 0.42,
        size: Math.round(k.H * 0.036), font: 'Cormorant Garamond', italic: true,
        lineHeight: 1.35 }));
    });

    const letzte = n - 1;
    neu.push(textEl({ content: 'Wenn dir das gut tut:', x: letzte * sw + sw / 2,
      y: k.H * 0.34, size: Math.round(k.H * 0.042),
      font: marke().schriftTitel || 'Playfair Display', italic: true }));
    neu.push(textEl({ content: '🔖 Speichern, um es nicht zu vergessen',
      x: letzte * sw + sw / 2, y: k.H * 0.50, size: Math.round(k.H * 0.028) }));
    neu.push(textEl({ content: 'Folge ' + (marke().handle || '@DEINPROFIL') + ' für mehr',
      x: letzte * sw + sw / 2, y: k.H * 0.62, size: Math.round(k.H * 0.021),
      letterSpacing: 2, color: ueberVideo() ? 'rgba(255,255,255,.85)' : '#8a7d6d' }));
    for (let s = 0; s < n; s++) {
      neu.push(textEl({ content: marke().handle || '@DEINPROFIL',
        x: s * sw + sw / 2, y: k.H * 0.945, size: Math.round(k.H * 0.017),
        letterSpacing: 4, color: ueberVideo() ? 'rgba(255,255,255,.68)' : '#8a7d6d' }));
    }

    neu.forEach(el => {
      st.elements.push(el);
      SS.textUmbrechen(el, sw * 0.86);
    });
    SS.pushHistory('Aus Text gebaut');
    SS.ui.refreshLayers && SS.ui.refreshLayers();
    SS.ui.zoomFit && SS.ui.zoomFit();
    SS.requestRender();
    SS.toast(n + ' Slides gebaut – Texte antippen zum Feinschliff', 3600, 'ok');
  }

  /* ------------------------------------------------------------- Dialog */
  function dialog() {
    let d = document.getElementById('txtDlg');
    if (d) d.remove();
    d = document.createElement('div');
    d.id = 'txtDlg';
    d.className = 'modal';
    d.innerHTML = '<div class="modal-card" style="max-width:460px">' +
      '<div class="sort-head"><h3>Aus Text bauen</h3><button id="txClose">✕</button></div>' +
      '<textarea id="txQuelle" rows="7" style="width:100%;resize:vertical" ' +
        'placeholder="Kapitel, Kartentext oder Notizen hier einkleben …"></textarea>' +
      '<div class="ctl"><span>Slides</span>' +
        '<input type="range" id="txZiel" min="4" max="10" value="6">' +
        '<span class="val" id="txZielL">6</span></div>' +
      '<button id="txGliedern" class="wide">Gliederung vorschlagen</button>' +
      '<div id="txListe" style="display:grid;gap:6px;max-height:260px;overflow:auto;margin-top:8px"></div>' +
      '<button id="txBauen" class="wide primary hidden" style="margin-top:8px">Karussell bauen</button>' +
      '<p class="hint">Die App wählt Kernsätze nach einfachen Regeln – kein Raten im Verborgenen: ' +
      'alles lässt sich abwählen und überschreiben. Slide 1 wird der Hook, die letzte der Abschluss.</p></div>';
    document.body.appendChild(d);
    const $ = (id) => d.querySelector('#' + id);
    $('txClose').onclick = () => d.remove();
    d.addEventListener('pointerdown', (e) => { if (e.target === d) d.remove(); });
    $('txZiel').addEventListener('input', () => { $('txZielL').textContent = $('txZiel').value; });

    $('txGliedern').onclick = () => {
      const text = $('txQuelle').value.trim();
      if (text.length < 60) { SS.toast('Da ist noch zu wenig Text', 2600, 'warn'); return; }
      const g = gliedern(text, +$('txZiel').value);
      const liste = $('txListe');
      const zeile = (wert, art, i) =>
        '<div class="ctl"><input type="checkbox" checked data-art="' + art + '" data-i="' + (i || 0) + '">' +
        '<span style="min-width:64px;opacity:.6;font-size:12px">' +
        (art === 'hook' ? 'Hook' : 'Gedanke') + '</span>' +
        '<input type="text" value="' + wert.replace(/"/g, '&quot;') + '" style="flex:1"></div>';
      liste.innerHTML = zeile(g.hook, 'hook') +
        g.gedanken.map((s, i) => zeile(s, 'gedanke', i)).join('');
      $('txBauen').classList.remove('hidden');
    };

    $('txBauen').onclick = () => {
      const felder = [...$('txListe').querySelectorAll('.ctl')];
      let hook = '';
      const gedanken = [];
      for (const f of felder) {
        if (!f.querySelector('input[type=checkbox]').checked) continue;
        const wert = f.querySelector('input[type=text]').value.trim();
        if (!wert) continue;
        if (f.querySelector('[data-art="hook"]')) hook = wert;
        else gedanken.push(wert);
      }
      if (!hook || !gedanken.length) { SS.toast('Hook und mindestens ein Gedanke nötig', 3000, 'warn'); return; }
      d.remove();
      bauen(hook, gedanken.slice(0, 8));
    };
  }

  /* Knopf im Studio-Panel, direkt unter den Marken-Sachen */
  const kasten = document.getElementById('markeBox');
  if (kasten) {
    const kn = document.createElement('button');
    kn.id = 'btnTextzu';
    kn.className = 'wide';
    kn.textContent = 'Aus Text bauen … (eBook-Verwerter)';
    kasten.appendChild(kn);
    kn.onclick = dialog;
  }

  SS.TEXTZU7 = { bereit: true, gliedern };
})();
