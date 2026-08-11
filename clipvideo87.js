/* Seamless Studio – Clips laufen im Karussell ab der ersten Sekunde (v8.7)
   ============================================================================
   Meldung: „Ich habe ein Video in einen Bilderrahmen gemacht. Beim Karussell-
   Export bekomme ich zwar ein Video von der Slide, aber das eingefügte Video
   spielt darin nicht ab."

   In der Projektdatei steht am Clip:

   ```json
   "type": "video", "tIn": 3, "trimStart": 0, "trimEnd": 4
   ```

   `tIn` ist die **Startzeit im fertigen Video**. Sie kommt aus `clips5.js`:

   ```js
   tIn: idx * 3,           // Clip 1 bei 0 s, Clip 2 bei 3 s, Clip 3 bei 6 s …
   ```

   Für **ein** durchlaufendes Panorama-Video ergibt das Sinn: die Clips kommen
   nacheinander. Für ein **Karussell** ergibt es keinen: dort wird je Slide eine
   eigene Datei aufgenommen, und Instagram startet beim Wischen **jede** davon
   bei 0. Ein Clip mit `tIn: 3` steht in einem 4-Sekunden-Slide also drei
   Sekunden still und läuft eine – und bei kürzerer Dauer gar nicht.

   `clips5.js` prüft:

   ```js
   const inRange = t >= (el.tIn || 0) && t < (el.tIn || 0) + clipLen(el);
   if (!inRange) { if (!v.paused) v.pause(); continue; }
   ```

   Also: pausiert. Genau das Bild, das beim Zurückstellen zu sehen war.

   Behoben – zwei Dinge, nichts umgeschrieben:

     · **Beim Karussell zählt `tIn` nicht.** Nimmt `SS.slideVideo` gerade auf
       (ein Video je Slide), wird für die Zeitrechnung so getan, als stünde die
       Startzeit auf 0. Jeder Clip läuft damit ab der ersten Sekunde jeder
       Slide. Für das durchgehende Panorama-Video (`V.exportVideo`) bleibt
       alles wie es war – dort ist die Staffelung ja gewollt.
     · **Die vorgeschlagene Dauer passt dazu.** `SV.vorschlagDauer` rechnete
       `tIn + Länge` (im Beispiel 3 + 4 = 7 s) – ein Slide-Video, in dem der
       Clip nach 4 s endet. Ohne Startzeit sind es die 4 s, die der Clip
       wirklich hat.

   Was v7.7 schon richtig macht und hier NICHT angefasst wird: Clips werden
   nicht ins Standbild gebacken (`videoslides77.js` nimmt sie aus `paintScene`
   heraus, zeichnet sie je Bild und legt darüberliegende Rahmen als zweite Lage
   auf), und während der Aufnahme laufen sie (`playing || SV.laeuft`).
   ========================================================================= */

(function () {
  const V = SS.video;
  const SV = SS.slideVideo;
  if (!V || !SV || typeof SS.syncVideoEls !== 'function') return;

  const karussellLaeuft = () => !!SV.laeuft;

  /* ==========================================================
     1 · Während der Karussell-Aufnahme zählt die Startzeit nicht
     ========================================================== */
  const origSync = SS.syncVideoEls;
  SS.syncVideoEls = function (t, playing) {
    if (!karussellLaeuft()) return origSync.apply(this, arguments);
    const merker = [];
    try {
      for (const el of (SS.state.elements || [])) {
        if (el.type === 'video' && el.tIn) { merker.push([el, el.tIn]); el.tIn = 0; }
      }
    } catch (e) {}
    try {
      return origSync.call(this, t, playing);
    } finally {
      for (const [el, alt] of merker) el.tIn = alt;
    }
  };

  /* ==========================================================
     2 · Vorgeschlagene Dauer ohne die Startzeit
     ========================================================== */
  const origDauer = SV.vorschlagDauer;
  if (typeof origDauer === 'function') {
    SV.vorschlagDauer = function () {
      const cl = SS.clip;
      if (cl && cl.ready) return origDauer.apply(this, arguments);
      let m = 0;
      for (const el of (SS.state.elements || [])) {
        if (el.type !== 'video' || el.hidden) continue;
        m = Math.max(m, SS.clipLen ? SS.clipLen(el) : 4);      // ohne tIn
      }
      if (!m) return origDauer.apply(this, arguments);
      return Math.max(2, Math.min(20, Math.round(m * 2) / 2));
    };
  }

  /* ==========================================================
     3 · In den Clip-Eigenschaften sagen, was gilt
     ========================================================== */
  const origProps = SS.ui && SS.ui.showProps;
  if (origProps) SS.ui.showProps = function () {
    origProps.apply(this, arguments);
    try {
      const sel = SS.getSel && SS.getSel();
      if (!sel || sel.type !== 'video' || (SS.selCount && SS.selCount() !== 1)) return;
      const body = document.getElementById('propsBody');
      if (!body) return;
      const alt = body.querySelector('.clip87hin');
      if (alt) alt.remove();
      if (!sel.tIn) return;
      const p = document.createElement('p');
      p.className = 'hint clip87hin';
      p.textContent = 'Die Startzeit von ' + (sel.tIn || 0).toFixed(1).replace('.', ',')
        + ' s gilt nur für ein durchgehendes Video über das ganze Panorama. '
        + 'Im Karussell (ein Video je Slide) läuft der Clip ab der ersten Sekunde jeder Slide.';
      body.appendChild(p);
    } catch (e) {}
  };

  SS.CLIPVIDEO87 = { bereit: true, version: '8.7.0' };
})();
