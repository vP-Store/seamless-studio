/* Seamless Studio – Als App installieren (v7.6.1)
   ============================================================================
   Scott fand auf Handy und Tablet keinen Weg, die App zu installieren.
   Die Technik war komplett da (Manifest, Icons, Service Worker mit
   fetch-Handler, HTTPS) – aber:

     * iPhone/iPad (Safari): Es gibt vom System aus NIE einen Install-Knopf
       oder eine Aufforderung. Der einzige Weg ist Teilen → „Zum
       Home-Bildschirm". Wer das nicht weiß, findet es nicht.
     * Android/Chrome: „App installieren" versteckt sich im ⋮-Menü;
       die kleine Leiste erscheint nur manchmal.

   Deshalb jetzt ein sichtbarer Abschnitt „Als App installieren" oben im
   Projekt-Panel:

     * Chrome/Edge/Android: fängt `beforeinstallprompt` ab und öffnet den
       echten Install-Dialog direkt per Knopf.
     * iPhone/iPad: zeigt die Schritt-für-Schritt-Anleitung
       (Teilen-Symbol → „Zum Home-Bildschirm").
     * Andere Browser: zeigt den Weg über das Browser-Menü.
     * Läuft die App schon installiert (standalone), zeigt der Abschnitt
       nur noch „✓ läuft bereits als App".
   ========================================================================= */

(function () {
  const panel = document.getElementById('panel-project');
  if (!panel) return;

  /* ---------------- Zustand erkennen ------------------------------------- */
  const standalone =
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
    || window.navigator.standalone === true;   // iOS Safari

  const ua = navigator.userAgent || '';
  /* iPadOS 13+ meldet sich als „Macintosh" mit Touch */
  const iOS = /iPhone|iPad|iPod/.test(ua)
    || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);

  /* ---------------- Abschnitt bauen -------------------------------------- */
  const h = document.createElement('h3');
  h.textContent = 'Als App installieren';

  const knopf = document.createElement('button');
  knopf.className = 'wide primary';
  knopf.id = 'pwaInstall';

  const hinweis = document.createElement('p');
  hinweis.className = 'hint';
  hinweis.id = 'pwaInstallHint';

  /* Anleitung (iOS / Fallback) – einfache Liste im Panel-Stil */
  const anleitung = document.createElement('div');
  anleitung.id = 'pwaAnleitung';
  anleitung.style.cssText = 'display:none;border:1px solid var(--line);border-radius:6px;' +
    'padding:12px;margin-top:8px;font-size:13px;line-height:1.55;color:var(--ink);background:var(--bg2);';

  function zeigeAnleitung(html) {
    anleitung.innerHTML = html;
    anleitung.style.display = anleitung.style.display === 'none' ? 'block' : 'none';
  }

  /* ganz oben ins Projekt-Panel, vor den ersten vorhandenen Inhalt */
  const erster = panel.firstElementChild;
  panel.insertBefore(h, erster);
  panel.insertBefore(knopf, erster);
  panel.insertBefore(hinweis, erster);
  panel.insertBefore(anleitung, erster);

  /* ---------------- 1) Läuft schon als App ------------------------------- */
  if (standalone) {
    knopf.textContent = '✓ Läuft bereits als App';
    knopf.disabled = true;
    knopf.classList.remove('primary');
    hinweis.textContent = 'Seamless Studio ist installiert und startet vom Home-Bildschirm – auch offline.';
    return;
  }

  /* ---------------- 2) Chrome/Edge/Android: echter Dialog ---------------- */
  let gemerkt = null;                       // das beforeinstallprompt-Ereignis
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    gemerkt = e;
    knopf.textContent = 'App installieren …';
    hinweis.textContent = 'Ein Fingertipp – danach startet Seamless Studio wie eine normale App, komplett offline.';
  });

  window.addEventListener('appinstalled', () => {
    gemerkt = null;
    knopf.textContent = '✓ Installiert – auf dem Home-Bildschirm';
    knopf.disabled = true;
    knopf.classList.remove('primary');
    anleitung.style.display = 'none';
    hinweis.textContent = 'Fertig! Die App liegt jetzt auf deinem Home-Bildschirm.';
    if (window.SS && SS.toast) SS.toast('✓ Seamless Studio ist installiert', 3600, 'ok');
  });

  /* ---------------- 3) Beschriftung je Gerät ----------------------------- */
  if (iOS) {
    knopf.textContent = 'Auf iPhone/iPad installieren – so geht’s';
    hinweis.textContent = 'Auf dem iPhone und iPad gibt es keinen automatischen Hinweis – Apple erlaubt die Installation nur über das Teilen-Menü in Safari.';
  } else {
    knopf.textContent = 'App installieren …';
    hinweis.textContent = 'Falls kein Dialog erscheint: der Knopf zeigt dir den Weg über das Browser-Menü.';
  }

  knopf.onclick = async () => {
    /* Chrome/Edge: echter Install-Dialog */
    if (gemerkt) {
      const ev = gemerkt; gemerkt = null;
      try {
        ev.prompt();
        const wahl = await ev.userChoice;
        if (!wahl || wahl.outcome !== 'accepted') {
          gemerkt = ev;                     // abgelehnt → Knopf bleibt nutzbar
          if (window.SS && SS.toast) SS.toast('Kein Problem – der Knopf bleibt hier', 2600, 'ok');
        }
      } catch (e2) { gemerkt = ev; }
      return;
    }
    /* iOS: Anleitung */
    if (iOS) {
      zeigeAnleitung(
        '<b>In Safari:</b><br>' +
        '1. Unten (iPhone) bzw. oben (iPad) das <b>Teilen-Symbol</b> antippen &nbsp;–&nbsp; das Quadrat mit dem Pfeil nach oben ⬆︎<br>' +
        '2. In der Liste nach unten wischen und <b>„Zum Home-Bildschirm"</b> wählen<br>' +
        '3. Oben rechts <b>„Hinzufügen"</b> antippen<br><br>' +
        'Danach liegt Seamless Studio als App-Symbol auf dem Home-Bildschirm und läuft komplett offline.<br>' +
        '<span style="opacity:.75">Wichtig: Das klappt nur in <b>Safari</b> – nicht im Instagram- oder Chrome-Browser auf iOS.</span>'
      );
      return;
    }
    /* Andere Browser ohne beforeinstallprompt (Firefox, Samsung Internet …) */
    zeigeAnleitung(
      '<b>Über das Browser-Menü:</b><br>' +
      '1. Oben rechts das <b>⋮-Menü</b> (oder ≡) öffnen<br>' +
      '2. <b>„App installieren"</b> oder <b>„Zum Startbildschirm hinzufügen"</b> wählen<br>' +
      '3. Bestätigen – fertig<br><br>' +
      '<span style="opacity:.75">Am zuverlässigsten klappt es in <b>Chrome</b> oder <b>Edge</b>.</span>'
    );
  };

  SS.INSTALL76 = { bereit: true, iOS, standalone };
})();
