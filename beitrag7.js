/* Seamless Studio – Beitrags-Paket
   ============================================================================
   Beim Hochladen braucht es mehr als die Bilder: eine Bildunterschrift,
   Hashtags, Alt-Texte. Bisher musste Scott das zusammensuchen. Jetzt:

   * SS.beitragstext() baut eine Textdatei aus der Szene:
     - Bildunterschrift-Entwurf: der Hook von Slide 1, eine Luecke fuer die
       Geschichte, der Abschluss von der letzten Slide
     - die Hashtags aus dem Marken-Set
     - die Alt-Texte je Slide (aus dem Studio-Panel, pro5.js)
   * Der Slide-Export (ZIP) und die Karussell-Videos legen die Datei als
     "Beitrag.txt" automatisch dazu (je eine geschuetzte Zeile dort).
   * Im Marken-Set gibt es ein Hashtag-Feld und zwei Knoepfe: Text kopieren,
     Text als Datei sichern.
   ========================================================================= */

(function () {
  if (!SS.ui) return;

  /* Hashtags ins Marken-Set aufnehmen */
  const marke = SS.marke || (SS.marke = {});
  if (marke.hashtags === undefined) {
    try { marke.hashtags = (JSON.parse(localStorage.getItem('ss-marke') || '{}').hashtags) || ''; }
    catch (e) { marke.hashtags = ''; }
  }
  function merken() {
    try { localStorage.setItem('ss-marke', JSON.stringify(marke)); } catch (e) {}
  }

  /* ------------------------------------------------------------- Der Text */
  function texteAufSlide(s) {
    const k = SS.canvasSize();
    return SS.state.elements
      .filter(e => e.type === 'text' && !e._wz
        && e.x >= s * k.slideW && e.x < (s + 1) * k.slideW)
      .sort((a, b) => (b.size || 0) - (a.size || 0));
  }
  const zeile = (e) => (e.content || '').replace(/\n/g, ' ').trim();

  SS.beitragstext = function () {
    const k = SS.canvasSize();
    const erste = texteAufSlide(0);
    const letzte = k.n > 1 ? texteAufSlide(k.n - 1) : [];
    const hook = erste.length ? zeile(erste[0]) : '';
    const abschluss = letzte
      .map(zeile)
      .filter(t => t && t !== hook && !/^weiter/i.test(t))
      .slice(0, 2);

    const teile = [];
    teile.push('BILDUNTERSCHRIFT (Entwurf)');
    teile.push('--------------------------');
    if (hook) teile.push(hook);
    teile.push('');
    teile.push('[Hier deine Geschichte in 2–3 Sätzen – warum das Thema dich etwas angeht.]');
    teile.push('');
    abschluss.forEach(t => teile.push(t));
    if (marke.handle) teile.push('Mehr davon: ' + marke.handle);
    teile.push('');
    if (marke.hashtags) {
      teile.push(marke.hashtags.trim());
      teile.push('');
    }
    teile.push('ALT-TEXTE (Barrierefreiheit – beim Hochladen unter „Erweitert")');
    teile.push('---------------------------------------------------------------');
    const alt = SS.state.alt || [];
    for (let i = 0; i < k.n; i++) {
      teile.push('Slide ' + (i + 1) + ': ' + (alt[i] || '—'));
    }
    teile.push('');
    teile.push('KURZ-CHECK VORM POSTEN');
    teile.push('----------------------');
    teile.push('· Slide 1 auch im 3:4-Beschnitt gut? (Raster-Menü → Profil-Vorschau)');
    teile.push('· Erste Zeile der Bildunterschrift = der Hook, nicht „Hallo zusammen"');
    teile.push('· Beim Hochladen nicht zuschneiden lassen – sonst verrutschen die Nähte');
    return teile.join('\r\n');
  };

  /* ------------------------------------------------------------ Bedienung */
  const kasten = document.getElementById('markeBox');
  if (!kasten) return;
  const wz = document.getElementById('mkWz');

  const feld = document.createElement('div');
  feld.className = 'ctl';
  feld.innerHTML = '<span>Hashtags</span>' +
    '<textarea id="mkTags" rows="2" style="flex:1;resize:vertical" ' +
    'placeholder="#deinthema #nische #stadt …"></textarea>';
  kasten.insertBefore(feld, wz);

  const reihe = document.createElement('div');
  reihe.className = 'chips';
  reihe.innerHTML =
    '<button id="btText">Beitragstext kopieren</button>' +
    '<button id="btDatei">Als Datei sichern</button>';
  kasten.insertBefore(reihe, wz);

  const tags = document.getElementById('mkTags');
  tags.value = marke.hashtags || '';
  tags.addEventListener('change', () => { marke.hashtags = tags.value; merken(); });

  document.getElementById('btText').onclick = async () => {
    try {
      await navigator.clipboard.writeText(SS.beitragstext());
      SS.toast('Beitragstext in der Zwischenablage', 2600, 'ok');
    } catch (e) {
      SS.toast('Kopieren ging nicht – nutze „Als Datei sichern"', 3200, 'warn');
    }
  };
  document.getElementById('btDatei').onclick = () => {
    const blob = new Blob([SS.beitragstext()], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Beitrag.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 9000);
  };

  SS.BEITRAG7 = { bereit: true };
})();
