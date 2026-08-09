# Seamless Studio v8.3.0 – Fotos ohne Farbverlust einlesen (09.08.2026)

Meldung: „Sobald man ein Bild in einen Rahmen setzt, ändert sich die Farbe vom
Bild leicht – in meinem Fall bekommt mein Gesicht grüne Flecken."

## Es ist nicht der Rahmen

Erst nachgemessen, Station für Station, mit einem neutralen Filter und einem
Gesicht-Testbild. Verglichen wurden jeweils nur die Hautpixel:

| Station | mittlere Abweichung (R/G/B) | Farbstich |
|---|---|---|
| `SS.loadImageFile` (Einlesen) | 0,77 / 0,49 / 0,95 | bis 16 |
| `filteredPhoto` (neutraler Filter) | 0 / 0 / 0 | 0 |
| `buildCard` (Rahmen drum) | 0,36 / 0,36 / 0,37 | bis 3 |

Der Rahmen selbst rührt die Farben also nicht an – die 0,36 sind reines
Verkleinern auf die Kartengröße. **Alles passiert schon beim Einlesen.**

## Der Grund: ein zweites JPEG

In `util.js`:

```js
cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
const dataURL = cv.toDataURL('image/jpeg', 0.92);
const out = new Image();
out.src = dataURL;              // ← ab hier wird DAS gezeichnet
```

Jedes eingelesene Foto wurde auf 2600 px verkleinert und **als zweites JPEG neu
geschrieben** – und genau dieses zweite JPEG hat die App danach gezeichnet und
exportiert. Ein Handyfoto ist aber schon ein JPEG. Also:

* **Farbunterabtastung (4:2:0).** JPEG speichert Farbe nur für jeden zweiten
  Pixel. Beim zweiten Durchgang liegt das 8 × 8-Raster nach dem Verkleinern
  anders als beim ersten; die Farbblöcke werden neu gemittelt und gerundet. Auf
  Haut – viel Rot, wenig Blau – kippen einzelne Blöcke dabei ins Grüne oder
  Magenta. **Das sind die Flecken.**
* **Die Verkleinerung lief ohne `imageSmoothingQuality`.** Chrome nimmt dann den
  schnellen, gröberen Weg.

Nachgemessen an einem Handyfoto (4032 × 3024, JPEG q 0,9) gegen eine
verlustfreie Verkleinerung derselben Quelle. Gemessen wurde der Grünstich
`dg − (dr + db) / 2`, nur auf Hautpixeln:

| Weg | Grünstich mittel | Spitze | Hautpixel mit Grünstich |
|---|---|---|---|
| verlustfrei verkleinert (Maßstab) | 0,000 | 0 | 0 % |
| **bisher** (zweites JPEG 0,92) | 0,145 | 13 | **0,45 %** |
| zweites JPEG 0,95 | 0,110 | 12,5 | 0,35 % |
| zweites JPEG 0,98 | 0,080 | 9 | 0,20 % |
| **v8.3** | 0,018 | 2 | **0 %** |

Sichtbar wird das besonders in einem Rahmen, weil dort meist nur ein Ausschnitt
des Fotos benutzt und auf die Kartenfläche gezogen wird – die Farbblöcke wachsen
mit. Höhere JPEG-Güte allein hilft kaum: das Problem ist die zweite Generation,
nicht die Güte.

## Behoben: Zeichnen und Speichern sind jetzt zwei verschiedene Dinge

* **Was gezeichnet und exportiert wird, ist verlustfrei.** Passt das Foto ohne
  Verkleinern (bis 2600 px), wird die **Originaldatei selbst** gezeichnet – kein
  Kanal wird angetastet, nachgemessen 0,000 Abweichung. Muss verkleinert werden,
  geschieht das mit `imageSmoothingQuality: 'high'` **in Halbierungsschritten**
  und das Ergebnis geht als **PNG** weiter, nicht als JPEG.
* **Was ins Projekt gespeichert wird, bleibt klein.** Dafür gibt es weiter eine
  JPEG-Fassung (jetzt 0,95 statt 0,92, 683 kB statt 418 kB bei 2600 × 1950). Sie
  dient nur den Vorschaubildern und der Projektdatei. Ist das Original klein
  genug (bis 3,6 MB), wird es unverändert übernommen – dann ist auch die
  Projektdatei verlustfrei.
* **Der Speicher steigt dabei nicht, er sinkt.** Das Zeichenbild hängt an einer
  **Blob-Adresse**, nicht an einer Daten-URL: eine PNG-Daten-URL wären je Foto
  rund 7 MB Zeichenkette, die am `<img>` hängen bleibt. Der Blob liegt beim
  Browser und kostet nur die komprimierten Bytes. Ein Canvas wird nirgends
  dauerhaft gehalten.

## Was noch Farbe verändert – aber gewollt

* **Vorlagen legen einen Look auf die Fotos.** `vorlagen7.js` setzt bei einigen
  Vorlagen `filterWerte`, z. B. `brightness: 70, contrast: 106, saturate: 88,
  vignette: 45`. Das ist Absicht, sieht aber nach „die App hat meine Farben
  geändert" aus. Zurücksetzen: Foto antippen → **Filter** → **Original**.
* **iPhone-Fotos sind Display-P3.** Der Browser rechnet sie beim Zeichnen nach
  sRGB um; kräftige Töne werden dabei etwas ruhiger. Das betrifft jede
  Canvas-App und ist ein gleichmäßiger Unterschied, keine Flecken.

## Technik

Eine neue Datei, nichts umgeschrieben: `bildtreu83.js` umhüllt
`SS.loadImageFile`. Geht dabei irgendetwas schief, übernimmt der alte Weg
(`origLaden`).

`rec.img` ist weiterhin ein `<img>`-Element, `rec.w`/`rec.h` sind die
Maße der Zeichenquelle – alle bestehenden Wege (`cropSource`, `filteredPhoto`,
`crop.js`, `cutout.js`, `stickerbib7.js`, `hintergrund76.js`, Projekt sichern)
arbeiten unverändert weiter. Neu im Datensatz: `treu`, `weg`, `blobURL`.

Eingetragen in `index.html` und in `ASSETS` in `sw.js`, `VERSION` auf
`ss-v8.3.0`.

## Geprüft

* Kleines Foto (1800 × 1200): Weg `original`, Abweichung **0,000**, die
  Projekt-URL ist bitgleich die Originaldatei.
* Großes Foto (4032 × 3024): Weg `verkleinert-png`, Grünstich 0,018 statt 0,145,
  **kein** Hautpixel mehr mit Grünstich (vorher 0,45 %).
* Beide Größen durch alle Wege, die `rec.img` benutzen: `filteredPhoto`,
  `photoCard`, Zuschnitt über `crop.rect`, Zurückladen aus der Projekt-URL,
  `paintScene` – alles ohne Fehler.
* Alle Prüfungen aus v8.0 bis v8.2 erneut: keine Befunde.
* Testläufe 02, 06, 13 gegen v7.9 gegengelesen: identisch, keine
  Konsolenfehler.

## Offen, falls gewünscht

Die Grenze von **2600 px** bleibt. Ein Foto, das über mehrere Slides läuft
(4:5 × 5 Slides = 5400 px Leinwand), wird dadurch beim Export hochgezogen und
weich. Das ließe sich anheben – kostet aber Arbeitsspeicher auf dem iPhone,
deshalb nicht ohne Absprache.
