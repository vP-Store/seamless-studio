# Seamless Studio v8.8.1 – Auto-Update, damit Fixes auch ankommen (15.08.2026)

## Das eigentliche Problem hinter „der Fix funktioniert nicht"

Der Clip-Fix (v8.8.0) war live und im Browser-Test nachweislich korrekt –
trotzdem meldete der Nutzer, dass Slide 2 weiterhin nicht abspielt. Grund:

**Die App lief noch in der alten Version.** Der Service Worker liefert beim
ersten Öffnen nach einem Update die alten Dateien aus dem Cache; der neue
Code kommt erst nach einem manuellen Neuladen. Die App zeigte dafür zwar eine
Leiste („Neue Fassung ist da – Jetzt laden"), aber die ist leicht zu
übersehen – und `frisch85.js` war auf die alte Fassungsnummer hartkodiert,
sodass der Hinweis dauerhaft falsch klingelte.

## Behoben

* **Die App lädt sich selbst neu**, sobald beim Start eine neuere Fassung
  im Netz liegt (nach 400 ms, mit sichtbarem Hinweis). Niemand testet mehr
  versehentlich die alte Version.
* **Schutz:** Läuft gerade eine Video-Aufnahme/Export (`slideVideo.laeuft`
  oder `SS._exporting`) oder ist der Tab verborgen, wird NICHT automatisch
  neu geladen – stattdessen erscheint die Leiste „nach dem Export laden".
* `FASSUNG` in `frisch85.js` auf `ss-v8.8.1` gezogen (muss immer mit
  `VERSION` in `sw.js` übereinstimmen).

# Seamless Studio v8.8 – Clips frieren im Slide-Video nicht mehr ein (15.08.2026)

Meldung: „Ich habe ein Video in einen Bilderrahmen gemacht. Beim Karussell-
Export (ein Video je Slide) spielt der Clip an, hört aber nach ein paar
Sekunden auf – im Slide-Video steht er dann als Standbild, obwohl die
Slide noch weiterläuft."

## Es war die zweite Grenze

v8.7 hat die **Startzeit** entschärft: `tIn` zählt während der Karussell-
Aufnahme nicht, jeder Clip läuft ab der ersten Sekunde jeder Slide an. Das
Anspringen war damit behoben.

Geblieben war die zweite Grenze in `clips5.js` (`SS.syncVideoEls`):

```js
const inRange = t >= (el.tIn || 0) && t < (el.tIn || 0) + clipLen(el);
if (!inRange) { if (!v.paused) v.pause(); continue; }
```

`clipLen` ist der Trimmbereich `trimEnd − trimStart` (beim Einfügen
vorgeschlagen: höchstens 4 s). Sobald die Slide-Zeit `t` diese Länge
erreicht, **pausiert** die App den Clip – und das letzte Bild bleibt
stehen. Die Slide dauert aber weiter (Regler bis 20 s): im fertigen
Slide-Video sieht man ein paar Sekunden Bewegung, dann eingefrorenes Bild.
Nachgemessen am Beispiel Clip 4 s, Slide 6 s:

| | nach 1 s | nach 3 s | nach 4 s | nach 5 s | nach 6 s |
|---|---|---|---|---|---|
| **vorher** | läuft | läuft | **pausiert** | pausiert | pausiert |
| **v8.8** | läuft | läuft | Loop | läuft | läuft |

## Behoben

* **Im Karussell läuft der Clip in Schleife** über seinen Trimmbereich
  (`t % clipLen`), genau wie er auf der Leinwand läuft (`loop=true`). Er
  füllt damit die komplette Slide-Dauer – nach dem Ende des Trimmbereichs
  beginnt er von vorn, statt einzufrieren.
* **Für das durchgehende Panorama-Video bleibt alles wie es war:** dort
  zählen weiterhin `tIn` und die Staffelung der Clips (jeder einmal, in
  seiner Fensterzeit). Die Weiche hängt an `SS.slideVideo.laeuft`.

## Technik

* `clips5.js`, `SS.syncVideoEls`: im Karussell-Fall (`laeuft === true`)
  wird `local = trimStart + (t % clipLen)` gerechnet und die Pause-Grenze
  ausgelassen; der normalen Pfad (mit `tIn`-Fenster) bleibt unberührt.
* Erkennung über das bereits vorhandene Flag `SS.slideVideo.laeuft` – kein
  neuer Zustand, keine neue Datei.
* Geprüft: Karussell Slide 6 s + Clip 4 s → Clip läuft durch (Loop bei
  4 s); Panorama-Export → Clip nur im Fenster 3–7 s aktiv (unverändert).
