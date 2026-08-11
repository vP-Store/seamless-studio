# Seamless Studio v8.7.0 – Clips laufen im Karussell ab der ersten Sekunde (11.08.2026)

Meldung: „Ich habe ein Video in einen Bilderrahmen gemacht. Beim Karussell-
Export bekomme ich zwar ein Video von der Slide, aber das eingefügte Video
spielt darin nicht ab."

## Es war nicht das Zeichnen

Erster Verdacht war das gebackene Standbild in `V.prepare` – falsch:
`videoslides77.js` nimmt Clips seit v7.7 aus `paintScene` heraus, zeichnet sie
je Einzelbild und legt darüberliegende Rahmen als zweite Lage auf. Auch das
Laufen während der Aufnahme ist dort schon geregelt
(`origSync.call(SS, t, playing || SV.laeuft)`).

Die Antwort stand wieder in der Projektdatei:

```json
"type": "video", "tIn": 3, "trimStart": 0, "trimEnd": 4
```

`tIn` ist die **Startzeit im fertigen Video**, gesetzt von `clips5.js`:

```js
tIn: idx * 3,     // Clip 1 bei 0 s, Clip 2 bei 3 s, Clip 3 bei 6 s …
```

Für **ein** durchlaufendes Panorama-Video ergibt das Sinn – die Clips kommen
nacheinander. Für ein **Karussell** nicht: dort wird je Slide eine eigene Datei
aufgenommen, und Instagram startet beim Wischen jede davon bei 0. `clips5.js`
prüft:

```js
const inRange = t >= (el.tIn || 0) && t < (el.tIn || 0) + clipLen(el);
if (!inRange) { if (!v.paused) v.pause(); continue; }
```

Ein Clip mit `tIn: 3` ist in den ersten drei Sekunden jeder Slide also
**pausiert** – zu sehen ist genau das Bild, auf das er zurückgestellt wurde.
Und weil die vorgeschlagene Dauer `tIn + Länge` rechnete (3 + 4 = 7 s), war das
Slide-Video obendrein länger als das Material.

Nachgemessen, Scotts Werte, der Karussell-Weg:

| | Videozeit nach 0,4 s | nach 1,2 s | nach 2,4 s | Dauer-Vorschlag |
|---|---|---|---|---|
| **vorher** | 0,01 s | 0,01 s | 0,01 s (pausiert) | 7 s |
| **v8.7** | läuft | läuft | läuft | 4 s |

## Behoben

* **Beim Karussell zählt `tIn` nicht.** Nimmt `SS.slideVideo` gerade auf, wird
  für die Zeitrechnung so getan, als stünde die Startzeit auf 0 – jeder Clip
  läuft ab der ersten Sekunde jeder Slide. Für das durchgehende Panorama-Video
  (`V.exportVideo`) bleibt alles wie es war; dort ist die Staffelung gewollt.
* **Die vorgeschlagene Dauer passt dazu:** die Länge des Clips statt
  Startzeit + Länge.
* **In den Clip-Eigenschaften steht es jetzt da:** hat ein Clip eine Startzeit,
  erklärt eine Zeile, dass sie nur für das durchgehende Video gilt.

## Technik

Neue Datei `clipvideo87.js`, nichts umgeschrieben: eine Hülle um
`SS.syncVideoEls` (setzt `tIn` nur für die Dauer des Aufrufs auf 0), eine um
`SS.slideVideo.vorschlagDauer` und eine um `SS.ui.showProps`.

Eingetragen in `index.html` und in `ASSETS` in `sw.js`, `VERSION` auf
`ss-v8.7.0` (auch in `frisch85.js`).

## Geprüft

| Prüfung | Ergebnis |
|---|---|
| Clip mit `tIn: 3`, Karussell-Weg | vorher pausiert bei Videozeit 0,01 s – jetzt läuft er ab 0 |
| Dauer-Vorschlag | 7 s → 4 s |
| Panorama-Video (`exportVideo`) | unberührt, Startzeiten gelten weiter |
| Farb-Warnung und Regler (v8.6) | unverändert, 43 Regler auf `pan-y` |
| App neu laden (v8.5) | netz-zuerst, offline, Leeren – unverändert |
| Clip füllt Rahmen (v8.0) | 0 Befunde von 147 |
| Konsolenfehler | keine |

## Noch offen

Videos wandern **nicht** in die Projektdatei (nur Fotos). Wer ein Projekt mit
Clip auf einem anderen Gerät öffnet, sieht den Platz, aber nicht den Film. Das
ist Absicht (Größe), aber es sagt bisher niemand. Ein Hinweis beim Laden wäre
der nächste sinnvolle Schritt.
