# Seamless Studio v8.1.0 – an verdeckte Elemente kommen, Video in den Fotoplatz (09.08.2026)

Zwei Meldungen: „das mit dem Video klappt immer noch nicht" und „wenn man einen
Fotoplatzhalter anklickt, sollte man auch ein Video einfügen können".

Beim Nachmessen hängen die zwei zusammen.

## Warum sich ein Clip in einer Collage nicht anfassen lässt

`interact.js` greift beim Tippen immer das **oberste** Element an dieser Stelle:

```js
for (let i = list.length - 1; i >= 0; i--) { … return el; }
```

Was darunter liegt, war nicht erreichbar – auch nicht über das Ebenen-Fenster:
dort wählen und dann auf der Leinwand anfassen setzt die Auswahl wieder auf das
obere Element. Genau so fühlt es sich an, als „ließe sich ein Clip nicht
bewegen", obwohl mit dem Clip alles in Ordnung ist. v8.0 hat die Griffzonen
behoben – dieser Fall war ein zweiter, unabhängiger.

Nachgemessen über **alle 23 Szenen**: in **10 davon** liegt die Mitte
mindestens eines Fotoplatzes unter einem anderen Element.

| Szene | Plätze | Mitte verdeckt | verdeckt durch |
|---|---|---|---|
| Highschool-Heft | 40 | 4 | Nachbarfotos, Washi-Tape |
| Happy Place | 29 | 3 | Nachbarfotos |
| Feenmärchen | 23 | 2 | Nachbarfotos |
| Sammelalbum | 10 | 1 | Fotoecken |
| Filmtag | 24 | 1 | Nachbarfoto |
| … | | | (10 Szenen von 23) |

**Behoben durch Durchtippen:** Nochmal auf dieselbe Stelle tippen holt das
nächste Element darunter, im Kreis. Ein kurzer Hinweis sagt, was gerade dran
ist – „Clip – 2 von 3 an dieser Stelle. Nochmal tippen holt das nächste
darunter." Ohne den Hinweis käme niemand darauf.

Weitergezählt wird nur nach einem **Tipp** (unter 8 px Weg) und innerhalb von
2,6 s an derselben Stelle (12 px). Nach einem echten Zug fängt die Zählung
wieder oben an – sonst würde das zweite Anfassen desselben Fotos versehentlich
das Nachbarfoto greifen.

Auch das ohne Eingriff in `interact.js`: `SS.pickableElements` – die öffentliche
Funktion, aus der es seine Trefferliste zieht – liefert für die Dauer einer
Berührung eine Liste, in der das gewählte Element oben steht. Damit greifen
`interact.js`, `platzhalter7.js` und alles andere dasselbe Element, ohne davon
zu wissen.

Nebeneffekt, der genau richtig ist: **so kommt man an einen verdeckten
Platzhalter** – zweimal tippen, und der Fotowähler geht auf.

## Video-Clip in einen Fotoplatz

Der Wähler aus `platzhalter7.js` hieß „Foto für Platz N" und kannte nur Bilder.
Wer in einer Szene an einer bestimmten Stelle ein Video wollte, musste den Clip
über den Video-Bereich einsetzen – er landet mittig auf einer Slide mit 68 % der
Slidebreite – und ihn dann von Hand auf Größe, Winkel und Rahmen des Platzes
bringen. Bei einem gekippten Polaroid zwischen Stickern ist das Millimeterarbeit.

Jetzt hat derselbe Wähler einen zweiten Abschnitt **„Oder ein Video-Clip"**: die
schon geladenen Clips als Miniaturen mit Namen (das laufende Videobild, es wird
nachgezogen, sobald es da ist) und **„Neues Video wählen …"** für eine Datei.

Der Clip übernimmt dabei vom Platz:

* Ort, Winkel und Deckkraft,
* die sichtbare Größe der Karte (`SS.rahmenGroesse`),
* den Rahmen samt Rand, Farbe, Schatten und Eckenradius,
* **die Stelle in der Ebenenliste** – das ist der Punkt: in einer Szene liegen
  Sticker über den Plätzen, und der Clip liegt genauso darunter wie das Foto.

Nachgemessen an einem gekippten Polaroid-Platz (312 × 376, −7°, Deckkraft 0,95,
Rand 22, Schatten 40): der Clip kommt auf 312 × 376, −7°, 0,95, Rand 22,
Schatten 40 heraus und steht an Index 0, die Deko bleibt darüber.

**Liegt der Clip schon auf der Leinwand, zieht er um statt sich zu verdoppeln.**
Wer also erst einen Clip einsetzt und dann merkt, dass er in den Platz gehört,
verliert nichts – geprüft: ein Clip vorher, ein Clip nachher.

## Technik

Zwei neue Dateien, nichts umgeschrieben:

| Datei | Aufgabe |
|---|---|
| `tippdurch81.js` | Durch gestapelte Elemente tippen (`SS.stapelUnter`) |
| `videoplatz81.js` | Video-Abschnitt im Fotowähler, `SS.clipInPlatz` |

Der Wähler wird nicht nachgebaut, sondern **beobachtet**: `platzhalter7.js` ruft
seine eigene, private `waehler()`-Funktion auf – `SS.platzhalterWaehler` zu
umhüllen erfasst den Tipp auf die Leinwand also nicht. Stattdessen merkt sich
`videoplatz81.js` beim Zeigerdruck den Platzhalter unter dem Finger und ergänzt
den Dialog per `MutationObserver`, sobald er im Seitenbaum erscheint.

Neue API:

```js
SS.stapelUnter(wx, wy)          // → Elemente unter dem Punkt, oberstes zuerst
SS.clipInPlatz(platz, vidId)    // → das Clip-Element im Platz
```

Eingetragen in `index.html` und in `ASSETS` in `sw.js`, `VERSION` auf
`ss-v8.1.0`.

## Geprüft

* Drei Elemente übereinander: Tipp 1 → oben, Tipp 2 → Mitte, Tipp 3 → unten,
  Tipp 4 → wieder oben. Nach einem Zug beginnt die Zählung neu oben.
* Verdeckter Platzhalter unter einem Sticker: erster Tipp greift den Sticker,
  zweiter öffnet den Wähler – samt Video-Abschnitt.
* Umzug in den Platz: Ort, Winkel, Größe, Deckkraft, Rahmen, Ebene – alles
  übernommen; Platzhalter ersetzt, nicht verdoppelt.
* Derselbe Clip in einen zweiten Platz: zieht um, keine Dublette.
* Klick auf die Miniatur im echten Dialog setzt den Clip ein und schließt ihn.
* `serialize` enthält keine internen Felder; `paintScene` läuft nach dem Umzug.
* Alle v8.0-Prüfungen erneut: Clip gegen Foto 0 von 147 Befunden, freies Ziehen
  mit Maus und Finger, Rahmen- und Stickerkatalog – keine Befunde.
* Die vorhandenen Testläufe 01, 02b, 03, 04, 07, 11, 12, 13, 14, 15 gegen v7.9
  gegengelesen: identische Ergebnisse, keine Konsolenfehler.
