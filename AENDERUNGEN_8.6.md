# Seamless Studio v8.6.0 – die grünen Flecken, gefunden (11.08.2026)

Vier Anläufe, drei falsche Verdächtige. Gelöst hat es Scotts Projektdatei.

## Was wirklich los war

In `projekt.seamless` stand auf genau dem einen Foto:

```json
"preset": "custom",
"hsl": { "rot": { "h": 40, "s": 0, "l": 0 } }
```

Im **Farbmischer** stand der Farbton der roten Töne auf **+40°** – dem Anschlag
des Reglers. Rot ist der Hautton. `render.js` dreht jeden Pixel in diesem
Bereich um 40° weiter, und 40° weiter als Hautrot ist Oliv. Alle anderen Fotos
im selben Projekt hatten dort 0.

Nachgemessen an genau diesem Bild, einmal wie gespeichert und einmal mit dem
Mischer auf 0, Pixel gegen Pixel:

| | Hautfarbton | Grünstich |
|---|---|---|
| wie gespeichert | **+9,1°** | **+7,8** |
| Mischer auf 0 | 0 | 0 |

Das deckt sich mit dem Export, den Scott geschickt hatte (+7,7°, Grün +10).
**Die App hat nie etwas verfälscht** – der Selbsttest aus v8.4 hatte recht:
Einlesen +0,1°, Rahmen −0,2°, Export 0,0°.

## Wie die 40 dorthin kam

Ein `<input type="range">` hat im Browser `touch-action: none`. Jede Berührung
gehört dem Regler – auch eine, die eigentlich scrollen wollte. Und den Wert der
Tippstelle übernimmt er **schon beim Aufsetzen des Fingers**, bevor feststeht,
ob gewischt oder gezogen wird.

Echter Touch-Wisch über einen Regler in einer scrollbaren Liste, gemessen:

| Verhalten | Regler danach | Liste gescrollt |
|---|---|---|
| **vorher** | 0 → **25** | 0 px |
| nur `touch-action: pan-y` | 0 → **25** | 158 px |
| **v8.6** | **0** | 160 px |

Wer am Handy durch die Foto-Eigenschaften wischt und dabei einen Regler trifft,
zieht ihn mit. So entsteht eine 40, die niemand gesetzt hat.

## Behoben

**1 · Regler gehören nicht mehr jedem Wisch.** `touch-action: pan-y` auf allen
Reglern, und die Übernahme des Werts wird aufgeschoben, bis die Geste sich
entschieden hat: waagerecht gezogen (> 6 px, mehr quer als hoch) → normales
Ziehen; senkrecht gewischt → Scrollen, der Regler bleibt stehen; getippt ohne
Bewegung → bewusst, der Wert wird übernommen. Mit der Maus ändert sich nichts.

**2 · Veränderte Farben sind sichtbar.** Ist ein Foto ausgewählt, dessen
Farbwerte von der Voreinstellung abweichen, steht das jetzt oben in den
Eigenschaften – im Klartext, z. B. „⚠️ Farbe verändert: Farbmischer Rot –
Farbton +40°" – mit einem Knopf **Zurücksetzen**. Beim Öffnen eines Projekts
mit solchen Werten kommt einmal ein Hinweis.

**3 · Ein Knopf für alle.** Im Foto-Bereich: **„↩︎ Farben aller Fotos
zurücksetzen"**.

## Technik

Neue Datei `regler86.js`, nichts umgeschrieben: ein `<style>`-Element, vier
Ereignisse in der Capture-Phase am `window`, eine Hülle um `SS.ui.showProps`
und ein Knopf. Neu: `SS.farbAbweichung(el)`, `SS.farbenZuruecksetzen(el?)`.

Eingetragen in `index.html` und in `ASSETS` in `sw.js`, `VERSION` auf
`ss-v8.6.0` (auch in `frisch85.js`).

## Geprüft

| Prüfung | Ergebnis |
|---|---|
| Scotts Element eingesetzt | Abweichung erkannt: „Farbmischer Rot – Farbton +40°" |
| Warnzeile in den Eigenschaften | da, mit Knopf |
| Zurücksetzen | 1 Foto, danach keine Abweichung mehr, Warnzeile weg |
| `touch-action` auf allen 43 Reglern | `pan-y` |
| Wisch über einen Regler | ohne v8.6 **25**, mit v8.6 **0** – Liste scrollt beide Male |
| Ziehen | funktioniert unverändert (−3) |
| Knopf im Foto-Bereich | da |
| Farbtreue-Prüfung (v8.4) | unverändert, kein Schritt über 1,5° |
| App neu laden (v8.5) | netz-zuerst, offline, Leeren – alles unverändert |
| Clip füllt Rahmen (v8.0) | 0 Befunde von 147 |
| Austausch im Platzhalter (v8.2) | keine Befunde |
| Konsolenfehler | keine |

## Für das bestehende Projekt

Scotts Projektdatei wurde einmal repariert (nur dieser eine Wert, sonst nichts
angefasst). In der App geht es ab jetzt über den Knopf **Zurücksetzen**.
