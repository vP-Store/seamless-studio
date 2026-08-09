# Seamless Studio v8.2.0 – Foto und Video im Platz austauschen (09.08.2026)

Meldung: „Wenn man ein Foto/Video bei einem Platzhalter ausgewählt hat, kann man
es im Nachhinein nicht mehr ändern."

Nachgemessen an genau diesem Aufbau – und es sind zwei Löcher, nicht eines:

| Zustand des Platzes | 1 Tipp | 2 Tipps | Doppelklick |
|---|---|---|---|
| leer | Wähler | – | – |
| mit **Foto** | nichts | nichts | Wähler |
| mit **Clip** (seit v8.1) | nichts | nichts | **nichts** |

## Ein gefüllter Fotoplatz ging nur per Doppelklick

`platzhalter7.js` hängt den Wähler für gefüllte Plätze an `dblclick`. Auf einem
Telefon ist ein Doppeltipp unzuverlässig, und seit dem Durchtippen (v8.1) holt
der zweite Tipp erst einmal das nächste Element darunter. Praktisch kam man
dort also nicht mehr hin.

## Ein Clip im Platz hatte gar keinen Weg zurück

`SS.clipInPlatz` ersetzt das Platzhalter-Element durch ein Video-Element – damit
ist `el.ph` weg, und `leerIst`/`gefuelltIst` in `platzhalter7.js` prüfen beide
auf `type === 'photo'`. Für einen Clip gab es deshalb keinen Wähler, keinen
Doppelklick-Weg und keinen Knopf. Einmal Video, immer Video.

## Jetzt: ein Fenster für beides, in beide Richtungen

**„🔄 Foto oder Video austauschen …"** steht ganz oben in den Eigenschaften
jedes Foto- und Video-Elements. Das ist der Weg, der immer funktioniert:
Element wählen – notfalls per Durchtippen – und antippen. Kein Doppeltipp nötig.

Dazu zwei bequemere Wege:

* Ein **gefüllter Platz, der schon ausgewählt ist** und allein unter dem Finger
  liegt, öffnet den Austausch beim nächsten Tipp. Das kollidiert nicht mit dem
  Durchtippen aus v8.1 – dort liegen ja mehrere Elemente übereinander.
* **Doppelklick** gilt weiter, jetzt auch für Clips.

Im Fenster steht alles zusammen: geladene Fotos, „Neues Foto wählen …",
geladene Clips (mit Miniatur und Namen, der aktuelle ist als „liegt hier"
markiert), „Neues Video wählen …" und **„entfernen – Platz wieder leer"**.

**Ort, Winkel, Größe, Rahmen und Ebene bleiben, egal was darin liegt.**
Nachgemessen an einem gekippten Polaroid-Platz (532 × 372, −8°, Rand 20,
Platz Nr. 3, Deko darüber):

| Schritt | Ergebnis |
|---|---|
| Foto → Clip | 532 × 372, −8°, Rand 20, Index 0 |
| Clip → anderes Foto | 532 × 372, −8°, Rand 20, Index 0, Nr. 3 wieder da |
| Clip → anderer Clip | derselbe Platz, **ein** Video-Element, keine Dublette |
| Clip → leer | leerer Platz, 532 × 372, taucht wieder in `platzhalterLeer()` auf |

Damit der Weg zurück Nummer und Format des Platzes kennt, merkt sich der Clip
sie an `el.phSlot`. Das ist ein **Datenfeld** – es wandert bewusst ins Projekt
und übersteht Sichern und Zurückholen (geprüft).

`el.ph` wird am Video absichtlich **nicht** gesetzt: `platzhalter7.js`,
`szenen7.js` und `vorlagen7.js` prüfen an mehreren Stellen
`type === 'photo' && e.ph`, und ein Video mit `ph` würde dort in Sonderpfade
geraten, die es nicht meint.

## Technik

Eine neue Datei, nichts umgeschrieben: `austausch82.js`.

```js
SS.medienWaehler(el)            // das Austausch-Fenster für Foto- und Video-Elemente
SS.fotoStattClip(clip, imgId)   // Gegenrichtung zu clipInPlatz (imgId null = leer)
SS.fotoTauschen(el, imgId)      // Foto tauschen, Fläche bleibt
SS.platzLeeren(el)              // Foto oder Clip heraus, leerer Platz bleibt
el.phSlot                       // {nr, ar} – was der Platz war
```

`SS.clipInPlatz` ist umhüllt: es schreibt `phSlot` an den Clip und fängt den
Fall ab, dass man denselben Clip in sein eigenes Element legt (das Element wäre
sonst erst herausgenommen worden und hätte seinen Platz nicht mehr gefunden).

Eingetragen in `index.html` und in `ASSETS` in `sw.js`, `VERSION` auf
`ss-v8.2.0`.

## Geprüft

* Foto → Clip → Foto → Clip → anderer Clip → leer, jedes Mal mit Nachmessen von
  Ort, Winkel, Fläche, Rahmen, Ebene und Anzahl der Elemente.
* Derselbe Clip erneut gewählt: nichts passiert (kein Verlust der Ebene).
* Alle drei Wege ins Fenster: zweiter Tipp, Eigenschaften-Knopf, Doppelklick –
  letzterer jetzt auch beim Clip.
* Klick im Fenster tauscht wirklich und schließt es.
* `phSlot` im Projekt vorhanden, nach `restore` unverändert; keine internen
  Zeichenfelder im Projekt.
* `paintScene`, Undo/Redo ohne Fehler.
* Alle Prüfungen aus v8.0 und v8.1 erneut: keine Befunde.
* Testläufe 01, 04, 07, 11, 12, 15 gegen v7.9 gegengelesen: identisch, keine
  Konsolenfehler.
