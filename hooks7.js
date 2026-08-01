/* Seamless Studio – Hook- und Abschluss-Baukasten
   ============================================================================
   Die erste und die letzte Slide entscheiden, ob ein Karussell gespeichert
   und geteilt wird. Slide 1 braucht einen HOOK (einen Satz, der das Wischen
   startet), die letzte Slide einen ABSCHLUSS (Speichern / Teilen / Folgen).

   Dieser Baukasten haengt sich in das Text-Panel:
   * Hook-Formeln zum Antippen – der Satz landet auf der gerade sichtbaren
     Slide, in der Titelschrift aus dem Marken-Set, mit [Klammern] als
     Luecken zum Ueberschreiben.
   * Abschluss-Zeilen zum Antippen – "@DEINPROFIL" wird durch den Handle
     aus dem Marken-Set ersetzt.
   * Zwei Bauknoepfe: "Hook-Slide" richtet Slide 1 komplett ein,
     "Abschluss-Slide" die letzte – Kicker, Hauptzeile, Fusszeile.

   Ueber einem Video (Clip-Leinwand) werden die Texte hell mit Schatten
   angelegt, sonst dunkel – dieselbe Regel wie bei den Vorlagen.
   ========================================================================= */

(function () {
  if (!SS.ui || typeof SS.normalizeEl !== 'function') return;

  const HOOKS = [
    '3 Fehler, die dich [Ziel] kosten',
    'Das hätte ich früher wissen sollen',
    'Niemand redet über [Thema]',
    'Hör auf, [Fehler] zu machen',
    'So habe ich [Ergebnis] geschafft – ohne [Schmerz]',
    'Was ich in 30 Tagen [Thema] gelernt habe',
    'Der Unterschied zwischen [A] und [B]',
    'Lies das, wenn du [Problem] hast',
    '5 Dinge, die ich als [Rolle] nie tun würde',
    'POV: Du willst endlich [Ziel]',
    'Speichere das für schlechte Tage',
    'Die Wahrheit über [Thema]',
  ];

  const ABSCHLUESSE = [
    '🔖 Speichern, um es nicht zu vergessen',
    'Folge @DEINPROFIL für mehr davon',
    'Schick das jemandem, der es braucht',
    'Kommentiere „[Wort]" – ich schicke dir mehr',
    'Mehr dazu im Profil',
    'Teil 2 folgt – nicht verpassen',
  ];

  const ueberVideo = () => !!(SS.clip && SS.clip.ready);
  const marke = () => SS.marke || {};

  function textAnlegen(o) {
    const dunkelBg = ueberVideo();
    const el = SS.normalizeEl(Object.assign({
      id: SS.uid(), type: 'text', align: 'center',
      color: dunkelBg ? '#F6EEDC' : '#2f2a26',
      shadow: dunkelBg, shadowColor: '#100b07', shadowBlur: 24, shadowX: 0, shadowY: 4,
      bgStyle: 'none', lineHeight: 1.18,
    }, o));
    SS.state.elements.push(el);
    return el;
  }

  function handleRein(t) {
    const h = marke().handle;
    return h ? t.replace(/@DEINPROFIL/gi, h) : t;
  }

  /* Einen einzelnen Baustein auf die gerade sichtbare Slide legen. */
  function einsetzen(text, art) {
    const k = SS.canvasSize();
    const m = SS.aktuelleSlideMitte ? SS.aktuelleSlideMitte() : { x: k.slideW / 2, y: k.H / 2 };
    const el = textAnlegen(art === 'hook'
      ? { content: text, font: marke().schriftTitel || 'Playfair Display',
          size: Math.round(k.H * 0.062), x: m.x, y: k.H * 0.36,
          lineHeight: 1.16 }
      : { content: handleRein(text), font: marke().schriftText || 'Poppins',
          size: Math.round(k.H * 0.030), x: m.x, y: k.H * 0.62 });
    /* Lange Saetze umbrechen, damit nichts ueber die Slide hinauslaeuft */
    umbruch(el, k.slideW * 0.84);
    SS.state.selectedIds = [el.id];
    SS.pushHistory(art === 'hook' ? 'Hook eingesetzt' : 'Abschluss eingesetzt');
    SS.ui.refreshLayers && SS.ui.refreshLayers();
    SS.ui.showProps && SS.ui.showProps();
    SS.requestRender();
    SS.toast('Antippen und [Lücken] überschreiben', 2600, 'ok');
  }

  /* Grober Zeilenumbruch nach gemessener Breite. */
  function umbruch(el, maxB) {
    const m = SS.measureText && SS.measureText(el);
    if (!m || m.w <= maxB || el.content.indexOf('\n') >= 0) return;
    const woerter = el.content.split(' ');
    if (woerter.length < 3) return;
    let beste = el.content, besteDiff = Infinity;
    for (let i = 1; i < woerter.length; i++) {
      const a = woerter.slice(0, i).join(' ');
      const b = woerter.slice(i).join(' ');
      const diff = Math.abs(a.length - b.length);
      if (diff < besteDiff) { besteDiff = diff; beste = a + '\n' + b; }
    }
    el.content = beste;
    SS.invalidateEl && SS.invalidateEl(el);
  }

  /* Slide 1 komplett als Hook-Slide einrichten. */
  function hookSlide() {
    const k = SS.canvasSize();
    const mitte = k.slideW / 2;
    textAnlegen({ content: 'LIES DAS', font: marke().schriftText || 'Poppins',
      size: Math.round(k.H * 0.019), x: mitte, y: k.H * 0.20, letterSpacing: 7,
      color: ueberVideo() ? 'rgba(255,255,255,.82)' : '#8a7f74' });
    const hook = textAnlegen({ content: 'Das hätte ich\nfrüher wissen sollen',
      font: marke().schriftTitel || 'Playfair Display',
      size: Math.round(k.H * 0.072), x: mitte, y: k.H * 0.38 });
    textAnlegen({ content: 'WEITER →', font: marke().schriftText || 'Poppins',
      size: Math.round(k.H * 0.019), x: mitte, y: k.H * 0.88, letterSpacing: 5,
      color: ueberVideo() ? 'rgba(255,255,255,.75)' : '#8a7f74' });
    SS.state.selectedIds = [hook.id];
    SS.pushHistory('Hook-Slide');
    SS.ui.refreshLayers && SS.ui.refreshLayers();
    SS.requestRender();
    SS.toast('Slide 1 eingerichtet – Hook antippen und überschreiben', 3200, 'ok');
  }

  /* Die letzte Slide als Abschluss einrichten. */
  function abschlussSlide() {
    const k = SS.canvasSize();
    const mitte = (k.n - 1) * k.slideW + k.slideW / 2;
    textAnlegen({ content: 'Wenn dir das geholfen hat:',
      font: marke().schriftTitel || 'Playfair Display', italic: true,
      size: Math.round(k.H * 0.045), x: mitte, y: k.H * 0.34 });
    textAnlegen({ content: '🔖 Speichern   ·   📤 Teilen',
      font: marke().schriftText || 'Poppins',
      size: Math.round(k.H * 0.028), x: mitte, y: k.H * 0.50 });
    textAnlegen({ content: handleRein('Folge @DEINPROFIL für mehr'),
      font: marke().schriftText || 'Poppins', letterSpacing: 2,
      size: Math.round(k.H * 0.022), x: mitte, y: k.H * 0.60,
      color: ueberVideo() ? 'rgba(255,255,255,.85)' : '#6b6058' });
    SS.pushHistory('Abschluss-Slide');
    SS.ui.refreshLayers && SS.ui.refreshLayers();
    SS.requestRender();
    SS.toast('Letzte Slide eingerichtet', 2800, 'ok');
  }

  /* ------------------------------------------------------------ Bedienung */
  const panel = document.getElementById('panel-text');
  if (!panel) return;
  const box = document.createElement('div');
  box.id = 'hookBox';
  const chips = (liste, art) =>
    liste.map((t, i) => '<button data-art="' + art + '" data-i="' + i + '" ' +
      'style="text-align:left">' + t + '</button>').join('');
  box.innerHTML =
    '<h3 style="margin:16px 0 6px">Hook für Slide 1</h3>' +
    '<div class="chips" id="hookChips">' + chips(HOOKS, 'hook') + '</div>' +
    '<button id="hookBau" class="wide">Slide 1 als Hook-Slide einrichten</button>' +
    '<h3 style="margin:16px 0 6px">Abschluss für die letzte Slide</h3>' +
    '<div class="chips" id="ctaChips">' + chips(ABSCHLUESSE, 'cta') + '</div>' +
    '<button id="ctaBau" class="wide">Letzte Slide als Abschluss einrichten</button>' +
    '<p class="hint">Der Hook entscheidet, ob gewischt wird; der Abschluss, ob gespeichert ' +
    'und gefolgt wird. [Klammern] sind Lücken zum Überschreiben. Schrift und Handle ' +
    'kommen aus deinem Marken-Set (Studio-Tab).</p>';
  panel.appendChild(box);

  box.querySelectorAll('button[data-art]').forEach(b => {
    b.onclick = () => einsetzen(
      (b.dataset.art === 'hook' ? HOOKS : ABSCHLUESSE)[+b.dataset.i], b.dataset.art);
  });
  document.getElementById('hookBau').onclick = hookSlide;
  document.getElementById('ctaBau').onclick = abschlussSlide;

  SS.HOOKS7 = { bereit: true, hooks: HOOKS.length, abschluesse: ABSCHLUESSE.length };
})();
