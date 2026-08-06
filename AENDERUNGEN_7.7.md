# Seamless Studio v7.7.0 – Karussell als Videos (06.08.2026)

## Neu: „Video je Slide" im Export-Dialog

Export → **Was? → „Video je Slide (Karussell aus Videos)"**

Heraus kommt `Seamless_Karussell_Video.zip` mit einer Datei je Slide:

```
Slide_01.mp4   Video (mit Ton, wenn beim Clip „Ton an" steht)
Slide_02.jpg   Foto  – auf dieser Slide bewegt sich nichts
Slide_03.mp4   Video
Hinweis.txt    was hochzuladen ist, in welcher Reihenfolge
Beitrag.txt    Bildunterschrift, Hashtags, Alt-Texte
```

In Instagram alle Dateien in **einen** Beitrag laden – ein Karussell darf
Fotos und Videos mischen.

Drei Einstellungen:

* **Länge je Slide** – 2 bis 20 s. Vorschlag = längster Clip der Leinwand
  (bei Hintergrund-Video: die schleifenfeste Periode).
* **Ruhige Slides als Foto** – Slides ohne Clip und ohne Animation kommen
  als JPEG. Spart Aufnahmezeit und Dateigröße, ist schärfer.
* **Ton der Clips mitnehmen** – nur die Clips mit „Ton an" (Eigenschaften
  eines Clips), und nur die, die auf dieser Slide liegen.

Jede Slide wird **einzeln und von vorn** aufgenommen: nachgemessen startet
jeder Clip bei seiner Aufnahme auf 0,00 s. Beim Wischen beginnt Instagram
jedes Slide-Video von vorn – so passt die erste Sekunde über alle Slides
zusammen. „Slide-Videos teilen" gibt dieselben Dateien an die Teilen-Auswahl.

## Behoben: Leinwand-Clips standen im Export still

Das war der eigentliche Fund. `V.prepare()` backt alles Unbewegte einmal in
ein Standbild; ein Video-Element ohne Animations-Preset galt als unbewegt und
landete darin. Auf der Leinwand lief der Clip, im fertigen Video stand er.

Nachgemessen im Container über 1,6 s Laufzeit:

| Weg | geänderte Bildpunkte |
|---|---|
| `paintScene` (Bild-Export) | 3 226 von 90 990 |
| `drawFrame` (Video-Export) | **0** |
| `drawFrame` nach der Änderung | **18 547** |

Dazu kam: `SS.drawElement` kannte nur Foto, Text, Sticker und Emoji. Genau
darüber zeichnet der Video-Renderer die lebenden Elemente – ein Clip **mit**
Animations-Preset war im Export deshalb sogar unsichtbar. Beides gilt jetzt
auch für das normale Reel („Video mit Animation") und für den alten Knopf im
Video-Bereich.

## Rahmen bleiben über dem Clip

Alles Unbewegte, das **über** einem Clip liegt (Rahmen, Text, Sticker), kommt
in eine zweite, durchsichtige Lage und wird nach den Clips gezeichnet – sonst
läge der Rahmen plötzlich hinter dem Video. Aufgelegt wird nur der sichtbare
Ausschnitt, nicht das ganze Panorama.

## Tempo

Gemessen im Container (Software-Dekoder, 1080×1350):

| | vorher | nachher |
|---|---|---|
| Bildrate je Slide | 3 – 12 /s | **18 – 34 /s** |

Zwei Kniffe: die obere Lage wird nur im Ausschnitt aufgelegt, und Clips
außerhalb der aufgenommenen Slide werden weder gezeichnet noch abgespielt.
Die tatsächlich erreichte Bildrate steht danach im Hinweis – gemessen, nicht
versprochen.

## Neu: Rahmen für Video-Clips – ein Clip wie ein Foto im Rahmen

Ein Clip lag bisher nackt auf der Leinwand: rechteckig, höchstens runde Ecken.
Jetzt hat er **dieselben 50 Rahmen wie ein Foto** – Polaroid, Filmstreifen,
Retro-TV, Digicam, Herz, Briefmarke, CD und alle anderen. Clip antippen →
„Bearbeiten" → Abschnitt **Rahmen**: Stil, Randbreite, Randfarbe, Schatten,
Eckenradius.

Das laufende Videobild geht dabei durch genau dieselbe Rahmenwerkstatt
(`SS.buildCard`) wie jedes Foto – deshalb sieht ein Clip im Rahmen aus wie ein
Foto im Rahmen, **und der Clip läuft darin weiter**: auf der Leinwand, im
Bild-Export, im Reel und in den Slide-Videos.

Der Rahmen legt sich **nach innen**: der Clip bleibt genau so groß, wie du ihn
gezogen hast, Griffe und Auswahl verschieben sich nicht.

Die Karte wird je Bild neu gebaut (das Videobild ändert sich ja auch) – die
Auflösung richtet sich nach dem, was am Ziel wirklich ankommt. Auf der
Leinwand bei 27 % Zoom ist das ein Bruchteil, im Export die volle Größe.
Gemessen kostet das je Slide-Video etwa ein Fünftel der Bildrate
(12/16 → 10,5/12 Bilder je Sekunde im Container-Test).

## Technik

Zwei neue Dateien `videoslides77.js` und `videorahmen77.js` (nach
`install76.js` geladen), dazu die Skript-Einträge in `index.html` und `sw.js`
auf `ss-v7.7.0`. Sonst nichts angefasst – alle Änderungen sind Umhüllungen.

Neue API: `SS.slideVideo.aufnehmen({dur, quality, ton, nurSlides}, fortschritt)`
→ `[{blob, ext, slide, bildrate, ton}]`. `SS.video.karussellVideos` zeigt ab
jetzt auf denselben Weg.

Geprüft: Testläufe Animationen, Grafik, Anordnungen, Pfad/Verlauf, Export
(ZIP · Panorama · PDF · Feed-Puzzle je genau eine Datei), Grenzfälle, Video
(33 Bilder, 0 Ausnahmen, 3,6 ms je Bild), echter Reel-Export – alle ohne
Befund. Zusätzlich end-to-end: ZIP mit 2 Videos + 1 Foto, Tonspur (Opus) im
Video der Slide mit „Ton an", Text sichtbar über dem laufenden Clip,
Polaroid- und Retro-TV-Rahmen sichtbar in den fertigen Slide-Videos,
Clip-Rahmen überleben Sichern und Wiederherstellen.
