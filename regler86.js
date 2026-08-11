/* Seamless Studio – Schieberegler verstellen sich nicht mehr beim Wischen,
   und veränderte Farben sind sichtbar (v8.6)
   ============================================================================
   Der Fall, der drei Anläufe gekostet hat: „Sobald ein Bild im Rahmen ist,
   bekommt mein Gesicht grüne Flecken."

   In der Projektdatei stand auf genau diesem einen Foto:

   ```json
   "preset": "custom", "hsl": { "rot": { "h": 40, "s": 0, "l": 0 } }
   ```

   Im **Farbmischer** stand der Farbton der roten Töne auf **+40°** – dem
   Anschlag des Reglers. Rot ist der Hautton. `render.js` dreht jeden Pixel in
   diesem Bereich um 40° weiter, und 40° weiter als Hautrot ist Oliv.
   Nachgemessen an Scotts Bild: Hautfarbton **+9,1°**, Grünstich **+7,8**.
   Alle anderen Fotos im selben Projekt hatten dort 0.

   Die App hat also nie etwas verfälscht – ein Regler stand am Anschlag. Bleibt
   die Frage, wie er dorthin kam. Und da liegt der eigentliche Fehler:

   **Ein `<input type="range">` hat im Browser `touch-action: none`.** Jede
   Berührung gehört dem Regler, auch eine, die eigentlich scrollen wollte. Wer
   am Handy durch den Eigenschaften-Bereich wischt und dabei einen Regler
   trifft, zieht ihn mit – bis zum Anschlag, wenn der Finger weit genug wandert.
   Genau so entsteht eine 40, die niemand bewusst gesetzt hat.

   Diese Datei behebt beides:

     · **`touch-action: pan-y` auf allen Reglern.** Ein senkrechter Wisch
       gehört ab jetzt der Liste, nicht dem Regler – der Browser nimmt dem
       Regler die Berührung ab (`pointercancel`), der Wert bleibt stehen.
       Waagerecht ziehen funktioniert unverändert.
     · **Veränderte Farben werden sichtbar.** Ist ein Foto ausgewählt, dessen
       Farbwerte von der Voreinstellung abweichen, steht das jetzt oben in den
       Eigenschaften – im Klartext, z. B. „Farbmischer Rot: Farbton +40°" –
       mit einem Knopf zum Zurücksetzen. Dazu ein Knopf im Foto-Bereich, der
       alle Fotos auf einmal zurücksetzt.

   Es wird nichts umgeschrieben: ein `<style>`-Element, eine Hülle um
   `SS.ui.showProps` und ein Knopf.
   ========================================================================= */

(function () {
  /* ==========================================================
     1 · Regler gehören nicht mehr jedem Wisch
     ========================================================== */
  const stil = document.createElement('style');
  stil.id = 'regler86';
  stil.textContent =
    'input[type=range]{touch-action:pan-y!important}'
    + '.farbwarn86{display:flex;flex-wrap:wrap;gap:8px;align-items:center;'
    + 'margin:0 0 10px;padding:9px 11px;border-radius:10px;'
    + 'background:rgba(200,85,61,.14);border:1px solid rgba(200,85,61,.5)}'
    + '.farbwarn86 span{flex:1 1 160px;font-size:12.5px;line-height:1.35}'
    + '.farbwarn86 button{flex:0 0 auto}';
  document.head.appendChild(stil);

  /* `pan-y` allein reicht nicht. Nachgemessen mit einem echten Touch-Wisch
     über einen Regler in einer scrollbaren Liste:

       | Verhalten            | Regler danach | Liste gescrollt |
       |----------------------|---------------|-----------------|
       | vorher (`none`)      | 0 → **25**    | 0 px            |
       | nur `pan-y`          | 0 → **25**    | 158 px          |

     Die Liste scrollt zwar, aber der Wert springt trotzdem – denn ein
     `<input type=range>` übernimmt die Tippstelle **schon beim Aufsetzen des
     Fingers**, bevor überhaupt feststeht, ob eine Wisch- oder eine
     Ziehgeste gemeint war. Wer bei 80 % der Schiene aufsetzt, hat 80 %.

     Deshalb wird die Übernahme aufgeschoben: Bei einer Berührung merkt sich
     die App den Wert von vorher und rollt jede Änderung zurück, bis die
     Geste sich entschieden hat.

       · **waagerecht gezogen** (> 6 px, mehr quer als hoch) → ab jetzt gilt
         alles, ganz normales Ziehen.
       · **senkrecht gewischt** → Scrollen; der Regler bleibt, wo er war.
       · **getippt ohne Bewegung** → bewusst; der Wert der Tippstelle wird
         übernommen und `input`/`change` nachgereicht.

     Mit der Maus ändert sich nichts. */
  let griff = null;

  const reglerVon = (ziel) => (ziel && ziel.closest ? ziel.closest('input[type=range]') : null);

  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    const r = reglerVon(e.target);
    if (!r) return;
    griff = { r, vorher: r.value, tipp: null, x: e.clientX, y: e.clientY,
      lx: e.clientX, ly: e.clientY, frei: false };
  }, true);

  window.addEventListener('input', (e) => {
    if (!griff || e.target !== griff.r || griff.frei) return;
    griff.tipp = griff.r.value;      // das wollte der Browser setzen
    griff.r.value = griff.vorher;    // vorerst zurück
    e.stopImmediatePropagation();
  }, true);

  window.addEventListener('pointermove', (e) => {
    if (!griff || griff.frei) return;
    griff.lx = e.clientX; griff.ly = e.clientY;
    const dx = Math.abs(e.clientX - griff.x), dy = Math.abs(e.clientY - griff.y);
    if (dx > 6 && dx >= dy) griff.frei = true;   // eindeutig eine Ziehgeste
  }, true);

  function loslassen(e) {
    if (!griff) return;
    const r = griff.r;
    if (!griff.frei && griff.tipp !== null && e && e.type === 'pointerup') {
      /* die letzte bekannte Bewegung zählt – manche Geräte liefern beim
         Loslassen keine brauchbaren Koordinaten mehr */
      const dx = Math.abs(griff.lx - griff.x), dy = Math.abs(griff.ly - griff.y);
      if (dx <= 6 && dy <= 6) {                  // ein bewusster Tipp
        r.value = griff.tipp;
        r.dispatchEvent(new Event('input', { bubbles: true }));
        r.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    griff = null;
  }
  window.addEventListener('pointerup', loslassen, true);
  window.addEventListener('pointercancel', loslassen, true);

  /* ==========================================================
     2 · Was weicht ab?
     ========================================================== */
  const HUNDERT = ['brightness', 'contrast', 'saturate'];
  const NULL = ['warmth', 'sepia', 'vignette', 'grain', 'highlights', 'shadows', 'black', 'white', 'blur'];
  const NAME = { brightness: 'Helligkeit', contrast: 'Kontrast', saturate: 'Sättigung',
    warmth: 'Wärme', sepia: 'Sepia', vignette: 'Vignette', grain: 'Korn',
    highlights: 'Lichter', shadows: 'Tiefen', black: 'Schwarzpunkt', white: 'Weißpunkt', blur: 'Unschärfe' };

  function abweichungen(fl) {
    const raus = [];
    if (!fl) return raus;
    for (const k of HUNDERT) if (Math.round(fl[k] ?? 100) !== 100) raus.push({ was: NAME[k], wert: (fl[k] > 100 ? '+' : '') + Math.round(fl[k] - 100) + ' %', schwer: false });
    for (const k of NULL) if (Math.round(fl[k] || 0) !== 0) raus.push({ was: NAME[k], wert: (fl[k] > 0 ? '+' : '') + Math.round(fl[k]), schwer: false });
    const h = fl.hsl;
    if (h && typeof h === 'object') {
      for (const [key, nm] of (SS.HSL_RANGES || [])) {
        const a = h[key];
        if (!a) continue;
        if (a.h) raus.push({ was: 'Farbmischer ' + nm + ' – Farbton', wert: (a.h > 0 ? '+' : '') + a.h + '°', schwer: true });
        if (a.s) raus.push({ was: 'Farbmischer ' + nm + ' – Sättigung', wert: (a.s > 0 ? '+' : '') + a.s + ' %', schwer: true });
        if (a.l) raus.push({ was: 'Farbmischer ' + nm + ' – Helligkeit', wert: (a.l > 0 ? '+' : '') + a.l + ' %', schwer: true });
      }
    }
    const c = fl.curve;
    if (Array.isArray(c) && c.some(p => Math.abs(p.x - p.y) > 0.005)) raus.push({ was: 'Tonwertkurve', wert: 'verändert', schwer: true });
    return raus;
  }

  SS.farbAbweichung = (el) => (el && el.type === 'photo' ? abweichungen(el.filter) : []);

  function zuruecksetzen(el) {
    if (!el || el.type !== 'photo') return;
    el.filter = SS.defaultFilter();
    SS.photoCacheClear && SS.photoCacheClear(el.id);
    SS.cardCacheClear && SS.cardCacheClear(el.id);
    SS.invalidateEl && SS.invalidateEl(el);
  }

  SS.farbenZuruecksetzen = function (nurEines) {
    const liste = nurEines ? [nurEines] : (SS.state.elements || []).filter(e => e.type === 'photo');
    let n = 0;
    for (const el of liste) if (abweichungen(el.filter).length) { zuruecksetzen(el); n++; }
    if (n) {
      SS.pushHistory && SS.pushHistory('Farben zurückgesetzt');
      SS.requestRender && SS.requestRender();
      SS.ui && SS.ui.showProps && SS.ui.showProps();
      SS.toast && SS.toast(n === 1 ? 'Farben zurückgesetzt' : n + ' Fotos zurückgesetzt', 2400, 'ok');
    } else {
      SS.toast && SS.toast('Alle Fotos stehen schon auf Original', 2400);
    }
    return n;
  };

  /* ==========================================================
     3 · Anzeige in den Eigenschaften
     ========================================================== */
  const origProps = SS.ui && SS.ui.showProps;
  if (origProps) SS.ui.showProps = function () {
    origProps.apply(this, arguments);
    try {
      const sel = SS.getSel && SS.getSel();
      if (!sel || sel.type !== 'photo' || (SS.selCount && SS.selCount() !== 1)) return;
      const body = document.getElementById('propsBody');
      if (!body) return;
      const alt = body.querySelector('.farbwarn86');
      if (alt) alt.remove();
      const ab = abweichungen(sel.filter);
      if (!ab.length) return;

      const d = document.createElement('div');
      d.className = 'farbwarn86';
      const t = document.createElement('span');
      const schwer = ab.some(x => x.schwer);
      t.innerHTML = (schwer ? '⚠️ ' : '🎨 ') + '<b>Farbe verändert:</b> '
        + ab.map(x => x.was + ' ' + x.wert).join(' · ');
      const b = document.createElement('button');
      b.textContent = 'Zurücksetzen';
      b.onclick = () => SS.farbenZuruecksetzen(sel);
      d.append(t, b);
      body.insertBefore(d, body.firstChild);
    } catch (e) { /* die Eigenschaften sollen nie an dieser Zeile scheitern */ }
  };

  /* ==========================================================
     4 · Knopf im Foto-Bereich und ein Blick beim Start
     ========================================================== */
  function knopf() {
    const regal = document.getElementById('photoShelf');
    if (!regal || !regal.parentElement || document.getElementById('farbResetAlle')) return;
    const reihe = document.createElement('div');
    reihe.className = 'chips';
    const b = document.createElement('button');
    b.id = 'farbResetAlle';
    b.textContent = '↩︎ Farben aller Fotos zurücksetzen';
    b.onclick = () => SS.farbenZuruecksetzen();
    reihe.appendChild(b);
    regal.parentElement.insertBefore(reihe, regal.nextSibling);
  }

  function blick() {
    try {
      const betroffen = (SS.state.elements || []).filter(e => e.type === 'photo' && abweichungen(e.filter).some(x => x.schwer));
      if (betroffen.length) {
        SS.toast && SS.toast(betroffen.length === 1
          ? 'Ein Foto hat veränderte Farbwerte – antippen zeigt, welche'
          : betroffen.length + ' Fotos haben veränderte Farbwerte', 4200, 'info');
      }
    } catch (e) {}
  }

  function los() { knopf(); setTimeout(blick, 2500); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', los);
  else los();

  SS.REGLER86 = { bereit: true, version: '8.6.0', abweichungen };
})();
