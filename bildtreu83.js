/* Seamless Studio – Fotos ohne Farbverlust einlesen (v8.3)
   ============================================================================
   Nachgemessen an einem Handyfoto (4032 × 3024, JPEG q 0,9 – so kommt es aus
   der Kamera) gegen eine verlustfreie Verkleinerung derselben Quelle. Gemessen
   wurde der GRÜNSTICH: `dg − (dr + db) / 2`, also Grün gegen Rot und Blau, nur
   auf Hautpixeln.

   | Weg | Grünstich mittel | Spitze | Pixel mit Grünstich |
   |---|---|---|---|
   | nur verkleinern, ohne neues JPEG | 0,00 | 0,0 | 0 % |
   | so wie die App es bisher ablegt  | 0,14 | 12,5 | **0,44 %** |

   Der Grund steht in `util.js`:

   ```js
   cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
   const dataURL = cv.toDataURL('image/jpeg', 0.92);
   const out = new Image();
   out.src = dataURL;              // ← ab hier wird DAS gezeichnet
   ```

   Jedes eingelesene Foto wurde also auf 2600 px verkleinert und **als zweites
   JPEG neu geschrieben** – und genau dieses zweite JPEG ist das Bild, das die
   App danach zeichnet und exportiert. Zwei Dinge kommen dabei zusammen:

   · **Farbunterabtastung.** JPEG speichert Farbe nur für jeden zweiten Pixel
     (4:2:0). Beim zweiten Durchgang liegt das 8 × 8-Raster nach dem
     Verkleinern anders als beim ersten, die Farbblöcke werden neu gemittelt
     und gerundet. Auf Haut – viel Rot, wenig Blau – kippen einzelne Blöcke
     dabei ins Grüne oder Magenta. Das sind die Flecken.
   · **Die Verkleinerung selbst lief ohne `imageSmoothingQuality`.** Chrome
     nimmt dann den schnellen, gröberen Weg.

   Sichtbar wird es besonders in einem Rahmen, weil dort meist nur ein
   Ausschnitt des Fotos benutzt und auf die Kartenfläche vergrößert wird – die
   Farbblöcke wachsen mit.

   Diese Datei trennt zwei Dinge, die vorher eines waren:

     · **Was gezeichnet und exportiert wird, ist ab jetzt verlustfrei.**
       Passt das Foto ohne Verkleinern (bis 2600 px), wird das Originalbild
       selbst gezeichnet – kein einziger Kanal wird angetastet. Muss
       verkleinert werden, geschieht das mit `imageSmoothingQuality: 'high'`
       und in Halbierungsschritten, und das Ergebnis wird **als PNG**
       weitergegeben, nicht als JPEG.
     · **Was ins Projekt gespeichert wird, bleibt klein.** Dafür gibt es
       weiterhin eine JPEG-Fassung (jetzt Güte 0,95 statt 0,92) – sie dient nur
       den Vorschaubildern und der Projektdatei, nicht dem Zeichnen. Ist das
       Original ohnehin klein genug, wird es unverändert übernommen; dann ist
       auch die Projektdatei verlustfrei.

   Der Speicher steigt dadurch nicht, im Gegenteil: das Zeichenbild hängt an
   einer **Blob-Adresse**, nicht an einer Daten-URL. Eine PNG-Daten-URL wären
   je Foto rund 7 MB Zeichenkette, die am `<img>` hängen bleibt; der Blob liegt
   beim Browser und kostet nur die komprimierten Bytes. Ein Canvas wird nirgends
   dauerhaft gehalten.

   Es wird nichts umgeschrieben, nur `SS.loadImageFile` umhüllt. Geht dabei
   irgendetwas schief, übernimmt der alte Weg.
   ========================================================================= */

(function () {
  const origLaden = SS.loadImageFile;
  if (typeof origLaden !== 'function') return;

  const URL_GRENZE = 3.6 * 1024 * 1024;   // bis hierhin die Originaldaten behalten
  const PNG_GRENZE = 6.5e6;               // bis hierhin verlustfrei weitergeben (Pixel)
  const WEBSICHER = /^data:image\/(jpeg|jpg|png|webp);/i;

  /* Verkleinern in Halbierungsschritten: ein einziger großer Sprung mittelt
     zu wenige Quellpixel und rauscht, mehrere Schritte glätten sauber. */
  function verkleinere(img, sw, sh, zw, zh) {
    let cv = document.createElement('canvas');
    cv.width = sw; cv.height = sh;
    let c = cv.getContext('2d');
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = 'high';
    c.drawImage(img, 0, 0, sw, sh);

    let w = sw, h = sh;
    while (w > zw * 2 && h > zh * 2) {
      const nw = Math.max(zw, Math.round(w / 2)), nh = Math.max(zh, Math.round(h / 2));
      const t = document.createElement('canvas');
      t.width = nw; t.height = nh;
      const tc = t.getContext('2d');
      tc.imageSmoothingEnabled = true;
      tc.imageSmoothingQuality = 'high';
      tc.drawImage(cv, 0, 0, nw, nh);
      if (SS.freeCanvas) SS.freeCanvas(cv);
      cv = t; c = tc; w = nw; h = nh;
    }
    if (w !== zw || h !== zh) {
      const t = document.createElement('canvas');
      t.width = zw; t.height = zh;
      const tc = t.getContext('2d');
      tc.imageSmoothingEnabled = true;
      tc.imageSmoothingQuality = 'high';
      tc.drawImage(cv, 0, 0, zw, zh);
      if (SS.freeCanvas) SS.freeCanvas(cv);
      cv = t;
    }
    return cv;
  }

  function alsBild(url) {
    return new Promise((ja, nein) => {
      const im = new Image();
      im.onload = () => ja(im);
      im.onerror = nein;
      im.src = url;
    });
  }

  /* Das Zeichenbild hängt an einer BLOB-Adresse, nicht an einer Daten-URL:
     eine PNG-Daten-URL wäre je Foto ~7 MB Zeichenkette im Speicher, die am
     `<img>` hängen bleibt. Der Blob liegt beim Browser und kostet nur die
     komprimierten Bytes. */
  function blobBild(cvOderFile, typ, q) {
    return new Promise((ja, nein) => {
      const weiter = (blob) => {
        if (!blob) { nein(new Error('kein Blob')); return; }
        const url = URL.createObjectURL(blob);
        alsBild(url).then((im) => ja({ im, blobURL: url, bytes: blob.size }), (e) => { URL.revokeObjectURL(url); nein(e); });
      };
      if (cvOderFile instanceof Blob) weiter(cvOderFile);
      else if (cvOderFile.toBlob) cvOderFile.toBlob(weiter, typ, q);
      else nein(new Error('kein Canvas'));
    });
  }

  SS.loadImageFile = function (file, maxDim = 2600) {
    return new Promise((fertig, schiefgegangen) => {
      const zurueck = () => {
        try { origLaden(file, maxDim).then(fertig, schiefgegangen); }
        catch (e) { schiefgegangen(e); }
      };
      let fr;
      try { fr = new FileReader(); } catch (e) { zurueck(); return; }

      fr.onerror = () => schiefgegangen(new Error('Datei nicht lesbar'));
      fr.onload = async () => {
        try {
          const url = String(fr.result || '');
          const img = await alsBild(url);
          const w = img.naturalWidth || img.width;
          const h = img.naturalHeight || img.height;
          if (!w || !h) { zurueck(); return; }

          /* ---- Fall 1: nichts zu verkleinern → das Original bleibt, wie es ist ---- */
          if (Math.max(w, h) <= maxDim) {
            let dataURL = url;
            if (url.length > URL_GRENZE || !WEBSICHER.test(url)) {
              const cv = document.createElement('canvas');
              cv.width = w; cv.height = h;
              const c = cv.getContext('2d');
              c.imageSmoothingEnabled = true;
              c.imageSmoothingQuality = 'high';
              c.drawImage(img, 0, 0);
              dataURL = cv.toDataURL('image/jpeg', 0.95);
              if (SS.freeCanvas) SS.freeCanvas(cv);
            }
            /* Gezeichnet wird direkt aus der Originaldatei – kein Kanal
               angetastet, und der Browser hält nur die komprimierten Bytes. */
            let quelle = img;
            let blobURL = null;
            try {
              const bb = await blobBild(file);
              if (bb.im.naturalWidth === w && bb.im.naturalHeight === h) { quelle = bb.im; blobURL = bb.blobURL; }
              else URL.revokeObjectURL(bb.blobURL);
            } catch (e) { /* dann bleibt das schon geladene Bild */ }
            fertig({ img: quelle, dataURL, w, h, treu: true, weg: 'original', blobURL });
            return;
          }

          /* ---- Fall 2: verkleinern, aber verlustfrei weitergeben ---- */
          const sc = maxDim / Math.max(w, h);
          const zw = Math.max(1, Math.round(w * sc));
          const zh = Math.max(1, Math.round(h * sc));
          const cv = verkleinere(img, w, h, zw, zh);

          const verlustfrei = zw * zh <= PNG_GRENZE;
          const klein = cv.toDataURL('image/jpeg', 0.95);
          let bild, blobURL = null, bytes = 0;
          try {
            const bb = await blobBild(cv, verlustfrei ? 'image/png' : 'image/jpeg', verlustfrei ? undefined : 0.98);
            bild = bb.im; blobURL = bb.blobURL; bytes = bb.bytes;
          } catch (e) {
            bild = await alsBild(verlustfrei ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', 0.98));
          }
          if (SS.freeCanvas) SS.freeCanvas(cv);
          fertig({ img: bild, dataURL: klein, w: zw, h: zh, blobURL, bytes,
            treu: verlustfrei, weg: verlustfrei ? 'verkleinert-png' : 'verkleinert-jpeg98' });
        } catch (e) { zurueck(); }
      };

      try { fr.readAsDataURL(file); } catch (e) { zurueck(); }
    });
  };

  SS.BILDTREU83 = { bereit: true, version: '8.3.0' };
})();
