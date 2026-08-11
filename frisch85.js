/* Seamless Studio – App neu laden, Offline-Speicher leeren (v8.5)
   ============================================================================
   Meldung: „Ich habe das Gefühl, dass durch mehrfaches Schließen nichts
   passiert." Das stimmt, und es hat einen Grund.

   Der Service Worker in `sw.js` hat bisher **immer zuerst im Speicher
   nachgesehen**:

   ```js
   caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(...))
   ```

   `hit ||` heißt: liegt die Datei im Offline-Speicher, wird sie genommen –
   ohne einen Blick ins Netz. Und `ignoreSearch: true` heißt: auch
   `index.html?neu=1` trifft denselben Eintrag. Ein Anhängsel an die Adresse
   half also nicht, Neuladen half nicht, Tab schließen half nicht. Erst wenn
   der Browser von sich aus die neue `sw.js` holt (er darf sie bis zu einem
   Tag aus seinem eigenen Zwischenspeicher bedienen), tauscht sich alles aus.

   Zwei Dinge dagegen:

     · **Ein Knopf, der es sofort tut.** „App neu laden" im Reiter *Projekte*
       löscht jeden Offline-Speicher, meldet den Service Worker ab und lädt
       die Seite neu. Projekte, Versionen und Einstellungen bleiben
       unangetastet – die liegen im `localStorage` bzw. in der Datenbank, und
       die werden nicht angefasst. Nur die Programmdateien werden neu geholt.

     · **Eine Prüfung beim Start.** Die App fragt `sw.js` mit `cache: 'no-store'`
       ab, liest die Fassungsnummer heraus und vergleicht sie mit der
       laufenden. Weicht sie ab, erscheint oben eine Leiste: „Neue Fassung ist
       da – jetzt laden." Ein Tipp darauf, und der Rest passiert von selbst.

   Zusätzlich lädt `sw.js` ab v8.5 die Programmdateien **netz-zuerst** und
   nimmt den Speicher nur noch als Rückfall. Offline funktioniert die App
   damit unverändert – online ist sie aber nie mehr veraltet.

   Es wird nichts umgeschrieben. Diese Datei hängt sich an den vorhandenen
   Projekte-Bereich und arbeitet ausschließlich mit `caches` und
   `navigator.serviceWorker`.
   ========================================================================= */

(function () {
  const FASSUNG = 'ss-v8.5.0';           // muss zu VERSION in sw.js passen
  SS.APP_FASSUNG = FASSUNG;

  /* ==========================================================
     1 · Leeren und neu laden
     ========================================================== */

  async function offlineSpeicherLeeren() {
    let geleert = 0;
    try {
      if (window.caches) {
        const namen = await caches.keys();
        for (const n of namen) { try { await caches.delete(n); geleert++; } catch (e) {} }
      }
    } catch (e) {}
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) { try { await r.unregister(); } catch (e) {} }
      }
    } catch (e) {}
    return geleert;
  }

  /* Die Adresse bekommt eine Zufallszahl mit – nicht für den Service Worker
     (der ist da schon abgemeldet), sondern für den ganz gewöhnlichen
     Browser-Zwischenspeicher, der `index.html` sonst auch noch aufhebt. */
  function neuLaden() {
    const a = new URL(location.href);
    a.searchParams.set('frisch', String(Date.now()));
    a.hash = '';
    location.replace(a.toString());
  }

  SS.appNeuLaden = async function () {
    try { SS.autosave && SS.autosave(); } catch (e) {}
    SS.toast && SS.toast('Offline-Speicher wird geleert …', 2000);
    await offlineSpeicherLeeren();
    setTimeout(neuLaden, 250);
  };

  /* ==========================================================
     2 · Fassung im Netz nachsehen
     ========================================================== */

  async function fassungImNetz() {
    try {
      const r = await fetch('sw.js?blick=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) return null;
      const t = await r.text();
      const m = t.match(/VERSION\s*=\s*['"]([^'"]+)['"]/);
      return m ? m[1] : null;
    } catch (e) { return null; }
  }

  function leiste(text) {
    if (document.getElementById('frischBar')) return;
    const d = document.createElement('div');
    d.id = 'frischBar';
    d.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:9999;display:flex;'
      + 'gap:10px;align-items:center;justify-content:center;padding:10px 14px;'
      + 'background:#C8553D;color:#fff;font:600 14px/1.3 system-ui,sans-serif;'
      + 'box-shadow:0 2px 12px rgba(0,0,0,.35)';
    const s = document.createElement('span');
    s.textContent = text;
    const b = document.createElement('button');
    b.textContent = 'Jetzt laden';
    b.style.cssText = 'background:#fff;color:#C8553D;border:0;border-radius:999px;'
      + 'padding:7px 14px;font:700 14px system-ui,sans-serif;cursor:pointer';
    b.onclick = () => SS.appNeuLaden();
    const z = document.createElement('button');
    z.textContent = '✕';
    z.setAttribute('aria-label', 'Hinweis schließen');
    z.style.cssText = 'background:transparent;color:#fff;border:0;font:700 16px system-ui,sans-serif;cursor:pointer';
    z.onclick = () => d.remove();
    d.append(s, b, z);
    document.body.appendChild(d);
    /* Sie sitzt über der Werkzeugleiste – nach 15 Sekunden macht sie von
       selbst Platz. Der Knopf im Reiter „Projekte" bleibt ja da. */
    setTimeout(() => { if (d.parentElement) d.remove(); }, 15000);
  }

  async function beimStartPruefen() {
    try {
      if (navigator.serviceWorker) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && reg.update) { try { await reg.update(); } catch (e) {} }
      }
    } catch (e) {}
    const netz = await fassungImNetz();
    SS.APP_FASSUNG_NETZ = netz;
    if (netz && netz !== FASSUNG) leiste('Neue Fassung ' + netz + ' ist da.');
    zeileSetzen(netz);
  }

  /* ==========================================================
     3 · Knopf im Reiter „Projekte"
     ========================================================== */

  let zeile = null;

  function zeileSetzen(netz) {
    if (!zeile) return;
    let t = 'Fassung ' + FASSUNG;
    if (netz && netz !== FASSUNG) t += ' · im Netz liegt ' + netz;
    else if (netz) t += ' · aktuell';
    zeile.textContent = t;
  }

  function knopfBauen() {
    const panel = document.getElementById('panel-project');
    if (!panel || document.getElementById('frischBtn')) return;

    const kasten = document.createElement('div');
    kasten.style.cssText = 'margin:6px 0 10px';

    const b = document.createElement('button');
    b.id = 'frischBtn';
    b.className = 'wide';
    b.textContent = '🔄 App neu laden (Offline-Speicher leeren)';
    b.onclick = () => SS.appNeuLaden();

    zeile = document.createElement('p');
    zeile.className = 'hint';
    zeile.id = 'frischInfo';
    zeile.textContent = 'Fassung ' + FASSUNG;

    const erklaerung = document.createElement('p');
    erklaerung.className = 'hint';
    erklaerung.textContent = 'Holt alle Programmdateien neu aus dem Netz. '
      + 'Projekte, Versionen und Einstellungen bleiben erhalten.';

    kasten.append(b, zeile, erklaerung);

    const nach = document.getElementById('saveState');
    if (nach && nach.parentElement === panel) panel.insertBefore(kasten, nach.nextSibling);
    else panel.insertBefore(kasten, panel.firstChild ? panel.firstChild.nextSibling : null);
  }

  function los() {
    knopfBauen();
    setTimeout(beimStartPruefen, 1500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', los);
  else los();

  SS.FRISCH85 = { bereit: true, version: '8.5.0', fassung: FASSUNG, leeren: offlineSpeicherLeeren };
})();
