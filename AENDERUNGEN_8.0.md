# Seamless Studio v8.0.0 – frei ziehen, und Clips liegen an (09.08.2026)

Zwei Dinge waren gemeldet: **ein Clip im Rahmen ließ sich nicht mehr bewegen**,
und Rahmen und Sticker sollen sich **frei in Breite × Höhe ziehen** lassen, bis
sie über jedem Quadrat und jedem Rechteck an allen Seiten anliegen.

Beim Nachmessen kamen vier Ursachen heraus – drei in der Bedienung, eine im
Zeichnen.

## Der Clip ließ sich wirklich nicht bewegen

`interact.js` misst die Griffzonen in Bildschirmpunkten und rechnet sie in
Weltpunkte um:

```js
const hs = (SS.HANDLE + 9) / st.zoom;      // 18 / 0,105 = 171 Weltpunkte
```

Bei 10 % Zoom sind das 171 Weltpunkte Griffradius. Ein Clip von 170 × 260 ist
damit **vollständig von Griffzonen überdeckt** – jeder Zug landet auf einem
Griff, für „Verschieben" bleibt kein Fleck übrig. Nachgemessen an genau dem
Aufbau aus dem Bildschirmfoto:

| Zug | vorher | nachher |
|---|---|---|
| Mitte, 60 px nach rechts | x 1620 | x 1620 – **nichts** |

Und weil `scaleEl()` in `interact.js` gar keinen Zweig für `video` hat,
passierte beim Ziehen an einer Ecke eines Clips auch tatsächlich nichts. Nicht
verschiebbar, nicht skalierbar – genau der eingekreiste Clip.

**Behoben:** Die Griffzone ist jetzt höchstens **30 % der kürzeren Seite**.
Damit bleiben in der Mitte immer mindestens 40 % × 40 % zum Anfassen frei – bei
jedem Zoom, bei jeder Größe. `SS.HANDLE` ist dafür zu einer gemessenen
Eigenschaft geworden: sie liefert den Radius, der zum gewählten Element passt,
und `render.js` zeichnet damit genau die Griffe, die auch treffen. Das gilt für
alle Arten, auch für kleine Textfelder.

## Frei verzerren ging nur mit Shift – auf dem Handy also nie

`interact.js` liest `SS.arLock` (Standard: an) und macht aus jedem Kantenzug ein
gleichmäßiges Vergrößern, sofern nicht Shift gedrückt ist. Auf einem Telefon
gibt es kein Shift. v7.9 hatte die Sperre für **Sticker** aufgehoben; für Rahmen
und Clips galt sie weiter.

**Jetzt ziehen Kanten und Ecken frei**, ohne Zusatztaste – Rahmen, Clips,
Sticker, Emojis. `SS.freiZiehen = false` (Knopf **🔗 Verhältnis halten** in den
Eigenschaften) schaltet auf gleichmäßiges Vergrößern um. `SS.arLock` bleibt
unberührt: daran hängen Text und Weichzeichner, die sich nicht anders verhalten
sollen als vorher.

## Die Gegenkante bleibt stehen, und die Kante rastet ein

Wer eine Kante auf eine Linie legen will, muss die gegenüberliegende Kante
stehen lassen – sonst wandert das Element unter dem Finger weg. Beim Ziehen an
einer Kante bleibt jetzt die Gegenkante fest, beim Ziehen an einer Ecke die
Gegenecke. Dazu fängt die gezogene Kante ein an

* Kanten und Mitten aller anderen Elemente,
* Slidekanten, Slidemitten, Leinwandmitte,
* den eingeschalteten Rasterlinien (4 × 4, Drittel, Goldener Schnitt).

Gemessen: Kante bis 6 px vor die Nachbarkante gezogen → liegt danach auf
**850,0 statt 850,0** – die letzten Punkte schließt das Fangen, mit kurzem
Summen wie beim Verschieben.

Was man beim Ziehen sieht, ist auch das Ergebnis: die echte Breite × Höhe
landet direkt im Element (`el.w/el.h` beim Clip, `el.s/scaleX` beim Sticker,
`SS.passeRahmenAn` beim Foto), nicht eine Verzerrung, die nachher
zurückgerechnet wird. Nur bei den teuersten Rahmen (Retro-Kamera, 58 ms je
Einpassung) wird während des Zugs eine Vorschau gestreckt und beim Loslassen
genau eingepasst – **gemessen** entschieden, nicht nach einer Rahmenliste.

## Clips in Rahmen füllen die gezogene Fläche

Hier lagen zwei Fehler im Zeichnen.

**Das Videobild ging zweimal durch den Zuschnitt.** `videorahmen77.js` legt es
formatfüllend in eine Fläche in Clipgröße; danach beschnitt die Hülle aus
`rahmenfrei78.js` dieselbe Fläche ein zweites Mal auf `rahmenAR`. Beim Retro-TV
sind das 1,50 → 1,64: oben und unten ging ein Streifen verloren, den niemand
angefordert hat, und die Auflösung sank mit.

**Und elf Rahmen füllten die Fläche gar nicht.** Kreis, Herz, Herz-Polaroid,
Stern, Blume, Wolke, Hexagon, Raute, CD, Retro-Kamera und Perlen-Herz schneiden
in `frames.js` mit `Math.min(w, h)` und bleiben quadratisch. Für Fotos löst
`SS.passeRahmenAn` das seit v7.9 in einer zweiten Phase; für Clips gab es diese
Phase nie:

| Rahmen | gezogen | Clip zeichnete | daneben |
|---|---|---|---|
| Perlen-Herz | 600 × 600 | 373 × 320 | 38 % / 47 % |
| Perlen-Herz | 900 × 500 | 310 × 267 | 66 % / 47 % |
| Wolke | 900 × 500 | 431 × 380 | 52 % / 24 % |
| Herz | 500 × 900 | 444 × 406 | 11 % / 55 % |

`videorahmen80.js` bestimmt einmal je Rahmen und Format einen **Plan**
(gemessen, nicht geraten):

* **„schnitt"** – 39 Rahmen: gesucht ist das Verhältnis der Pufferfläche, bei
  dem die fertige Karte genau die Form der gezogenen Fläche hat. Das Videobild
  wird gleich in diesem Verhältnis abgelegt – **einmal** beschnitten.
* **„stauch"** – die elf formfesten: die Karte wird beim Zeichnen gestreckt und
  die Quelle vorher waagerecht um den Kehrwert gestaucht. Die beiden
  Verzerrungen heben sich auf, das Videobild bleibt gerade, die Form wird
  gestreckt – aus dem Kreis eine Ellipse. Genau wie beim Foto. Dabei wird das
  Videobild **nicht** selbst beschnitten; der Rahmen füllt sein Quadrat danach
  selbst auf.

Dazu wird die Pufferhöhe so nachgezogen, dass die Karte die Zielhöhe erreicht.
Das ist keine Kosmetik: `buildCard` schlägt Rand und Sicherheitssaum in
absoluten Kartenpunkten auf, eine zu kleine Karte hat verhältnismäßig mehr
Saum – beim Kreis auf 900 × 500 waren das 4,3 % Unterschied zum Foto.

### Der Prüfmaßstab: Clip gegen **Foto**, nicht gegen die Zielgröße

Rahmen wie Perlen-Herz haben auch beim Foto viel leere Fläche im Kartencanvas.
Wer gegen die Zielgröße misst, sieht dort einen Fehler, wo keiner ist. Gemessen
wird deshalb dasselbe Motiv einmal als Foto (über `passeRahmenAn`) und einmal
als Clip, und die Tintenhülle beider verglichen:

**49 Rahmen × 3 Formate = 147 Fälle → 0 Abweichungen über 3 %.**
Vorher: 42 Befunde, bis zu 72 % daneben.

## Tempo

Zeichendauer während eines echten Zugs (30 Schritte, Zoom 50 %):

| Fall | Median | p90 | Höchstwert |
|---|---|---|---|
| Clip · Retro-Kamera | 2,4 ms | 7,2 ms | 44 ms |
| Clip · Perlen-Herz | 1,9 ms | 6,7 ms | 41 ms |
| Clip · Polaroid | 1,3 ms | 5,1 ms | 14 ms |
| Foto · Retro-Kamera | 2,8 ms | 8,5 ms | 18 ms |

Während gezogen wird, genügt dem Plan eine gröbere Stufung (10 %): die
Außenkante stimmt ohnehin immer, weil die Karte in die gezogene Fläche
gezeichnet wird; nur die Randstärke wäre zwischen zwei Stufen um höchstens ein
Zehntel unsauber, und beim Loslassen wird sie genau.

## Technik

Zwei neue Dateien, nichts umgeschrieben:

| Datei | Aufgabe |
|---|---|
| `videorahmen80.js` | Clip im Rahmen: einmal beschneiden, formfeste Rahmen strecken |
| `frei80.js` | Griffzonen, freies Ziehen, feste Gegenkante, Fangen |

`frei80.js` hängt sich in der **Auffangphase an `window`** – also vor jedem
Zeigerdienst auf der Leinwand. Griff getroffen → es übernimmt den ganzen Zug.
Kein Griff getroffen → `SS.HANDLE` wird für die Dauer dieses einen Ereignisses
stumm gestellt, damit `interact.js` keinen Griff sieht und sauber verschiebt;
danach steht der Wert wieder. `interact.js` selbst bleibt unangetastet.

Neue API:

```js
SS.freiZiehen          // true = Kanten und Ecken ziehen frei (Standard)
SS.freiGriffZone(el)   // → {w, h, r}  gemessene Griffzone
SS.clipRahmenPlan(el)  // → {modus:'schnitt'|'stauch', …}
SS.clipPlanWeg(el)     // Plan verwerfen (liegt neben dem Element, nicht darin)
```

Eingetragen in `index.html` und in `ASSETS` in `sw.js`, `VERSION` auf
`ss-v8.0.0`.

## Geprüft

* Der Aufbau aus dem Bildschirmfoto: kleiner Clip mit Rahmen bei 16 % Zoom –
  verschiebt sich, behält dabei seine Größe.
* Kante, Ecke, Drehgriff je mit Maus **und mit echten Berührungsereignissen**
  auf einer iPhone-Ansicht (390 × 844, kein Shift verfügbar).
* Gegenkante bleibt stehen; Fangen trifft die Nachbarkante auf 0,0 px.
* 50 Rahmen × 3 Formate über Foto und Clip: Zielgröße getroffen (300 Fälle).
* 80 Sticker × 3 Formate: Zielgröße getroffen (240 Fälle).
* 49 Rahmen × 3 Formate Clip gegen Foto: keine Abweichung über 3 %.
* Gesperrte Elemente bleiben liegen; Mehrfachauswahl unverändert.
* Text und Weichzeichner verhalten sich wie vorher (`SS.arLock` unberührt).
* `serialize`/`restore`, Undo/Redo, `paintScene` – der Plan wandert **nicht**
  ins Projekt.
* Die vorhandenen Testläufe 01–15 gegen v7.9 gegengelesen: identische
  Ergebnisse, keine Konsolenfehler. (Einzige Abweichung: die Bytes des
  Reel-Exports, der Videokodierer arbeitet nicht bitgenau gleich.)
