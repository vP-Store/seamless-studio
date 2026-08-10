# Seamless Studio v8.4.0 – Farbtreue selbst nachmessen (10.08.2026)

Meldung: „Das ist das Foto nach dem Export aus der App und die Verfärbung ist
übel. Bitte mache es so, dass die Qualität 1 zu 1 gleich bleibt."

## Warum erst messen und nicht gleich reparieren

v8.3 hat einen echten Fehler behoben – das zweite JPEG beim Einlesen. Nur: er
war zu klein, um die Flecken zu erklären (Grünstich 0,145 im Mittel, 0,45 % der
Hautpixel). Der gelieferte Export zeigt dagegen **+7,7° Farbtonverschiebung im
Gesicht**, sichtbar olivfarbene Flecken. Das ist eine andere Größenordnung.

Nachgestellt in einer sauberen Umgebung, mit genau demselben Foto, durch genau
dieselbe App: der Farbton bleibt bei **24,7° → 24,8°**. Es passiert hier also
nicht. Der Unterschied liegt am Gerät (Android/Chrome, Bildschirmfarbraum,
Kamera-Farbprofil) oder an der Originaldatei – die Fassung, die mich erreicht
hat, ist durch WhatsApp gelaufen und ist nicht mehr die Datei, die eingefügt
wurde.

Weiter zu raten kostet nur noch einen Anlauf mehr. Deshalb misst die App es ab
jetzt selbst, auf dem Gerät, auf dem es auftritt.

## Was der Selbsttest macht

Foto antippen → im Foto-Bereich der Knopf **„🎨 Farbtreue prüfen …"** → dasselbe
Foto auswählen, das die Flecken bekommt.

Als Maßstab dienen die **Rohdaten der Datei**:

```js
rohBild = await createImageBitmap(datei, { colorSpaceConversion: 'none' });
```

Ohne Farbraumumrechnung – das ist der einzige Punkt in der Kette, an dem der
Browser nichts dazutut. Alles Weitere wird dagegen gehalten, jede Stufe auf
dieselbe Breite (480 px) gebracht, damit die Zahlen vergleichbar sind:

| Stufe | was gemessen wird |
|---|---|
| 1 · Datei roh | der Maßstab |
| 2 · normal dekodiert | was der Browser aus der Datei macht |
| 3 · Einlesen | `SS.loadImageFile`, also der Weg aus v8.3 |
| 4 · Foto im Rahmen | `SS.photoCard` |
| 5 · Export | `SS.paintScene(..., { forExport: true })` |

Je Stufe: mittlere und größte Abweichung pro Kanal, **Grünstich**
`G − (R + B) / 2` und **Hautfarbton in Grad**. Hautpixel werden über den Farbton
ausgewählt (5–40°, Sättigung 0,15–0,60, Helligkeit 0,30–0,99) – eine Auswahl
über Kanalvergleiche zieht sonst grünes Laub mit herein und verfälscht genau
die Zahl, um die es geht.

Dazu kommt, was das Gerät über sich verrät: Browserkennung, Farbraum des
Canvas, ob der Bildschirm P3 kann, Pixelverhältnis, ob ein P3-Canvas überhaupt
möglich ist.

Am Ende steht ein Satz: **die Stufe, bei der der Farbton um mehr als 1,5°
springt.** Das Ergebnis lässt sich mit einem Knopf kopieren.

## Technik

Eine neue Datei, nichts umgeschrieben: `farbcheck84.js` hängt den Knopf per
`MutationObserver` an den Foto-Bereich und stellt `SS.farbCheck()` bereit. Das
letzte Ergebnis liegt unter `SS.FARBCHECK84.letztes`. Das Fenster (`#fcDlg`)
benutzt die vorhandenen Modal-Klassen. Geht eine Stufe schief, steht dort der
Fehler statt der Zahlen – die anderen Stufen laufen trotzdem durch.

Eingetragen in `index.html` und in `ASSETS` in `sw.js`, `VERSION` auf
`ss-v8.4.0`.

## Geprüft

* Selbsttest mit dem echten Foto durchgelaufen: fünf Stufen vollständig,
  Farbtonverlauf 24,7 / 24,7 / 24,9 / 24,8 / 24,8 – kein Sprung, keine
  Konsolenfehler.
* Stufe 5 gegen die tatsächlichen `paintScene`-Optionen geprüft (`forExport`,
  `noBg` – `skipBg` gibt es nicht).
* Alle Prüfungen aus v8.0 bis v8.3 erneut: keine Befunde.

## Wie es weitergeht

Der Selbsttest behebt nichts – er zeigt, **wo** es passiert. Mit der Zahl vom
Gerät wird die Ursache in einem Schritt behebbar, statt in einem vierten
Anlauf.
