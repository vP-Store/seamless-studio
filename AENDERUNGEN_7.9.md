# Seamless Studio v7.9.0 – nichts ist mehr fest (08.08.2026)

Nachtrag zu v7.8. Beim Nachmessen der Live-Fassung stellte sich heraus, dass
v7.8 nur **39 der 50 Rahmen** wirklich frei machte, und die Sticker gar nicht.
Beides ist jetzt erledigt.

## Elf Rahmen zwangen weiter ihre Form auf

Kreis, Herz, Herz-Polaroid, Stern, Blume, Wolke, Hexagon, Raute, CD,
Retro-Kamera und Perlen-Herz zeichnen in `frames.js` mit `Math.min(w, h)` –
sie schneiden also immer ein Quadrat, egal was hineingeht, und füllen das Bild
darin selbst formatfüllend auf. Gemessen kam bei einem Wunsch von 506 × 900
ein 332 × 332 heraus, also 63 % daneben. Die Zahlenfelder logen dort.

Über das Zuschnittverhältnis ist an diese Rahmen nicht heranzukommen: sie
ignorieren es. Deshalb gibt es jetzt einen zweiten Weg – `el.rahmenVorX`:

1. Die fertige Karte wird gezielt gestreckt (`scaleX`/`scaleY`). Aus dem Kreis
   wird eine Ellipse, aus dem Herz ein hohes Herz. **Das ist gewollt** – die
   App hat mit *Oval* neben *Kreis* dieselbe Idee schon immer gehabt.
2. Damit das **Bild** darin trotzdem gerade bleibt, wird die Quelle vorher
   waagerecht um genau den Kehrwert gestaucht. Die beiden Verzerrungen heben
   sich exakt auf.

Nachgemessen mit einem Prüfkreis im Testbild – bleibt er rund, ist das Bild
gerade:

| Rahmen | Wunschformat | Prüfkreis | Rundheit |
|---|---|---|---|
| Kreis | 506 × 900 | 228 × 228 | 1,000 |
| Herz | 900 × 506 | 167 × 167 | 1,000 |
| Stern | 506 × 900 | 242 × 242 | 1,000 |
| Retro-Kamera | 700 × 700 | 689 × 680 | 1,013 |
| Perlen-Herz | 560 × 900 | 174 × 175 | 0,994 |
| CD | 900 × 506 | 73 × 72 | 1,014 |
| Polaroid (Vergleich) | 506 × 900 | 216 × 217 | 0,995 |

**Alle 50 Rahmen × 4 Formate (1:1, 16:9, 9:16, 4:5) treffen die Zielgröße
jetzt auf ≤ 2 %.** Elf davon über diesen Streckweg, 39 wie in v7.8 über den
Zuschnitt.

## Zwei Fehler aus v7.8 mitbehoben

**Die Vorstauchung blieb beim Rahmenwechsel hängen.** Wer von „Herz" auf
„Oval" wechselte, schleppte sie mit – Oval ging dadurch 19,5 % daneben, ebenso
Organisch, Halbbogen, Browser, Digicam und Poststempel. `passeRahmenAn` setzt
`rahmenVorX` jetzt zu Beginn zurück.

**Gleichmäßiges Vergrößern wurde fälschlich umgerechnet.** Rahmen mit fester
Form tragen dauerhaft ein ungleiches `scaleX`/`scaleY` – das ist kein Ziehen,
sondern das Ergebnis von `passeRahmenAn`. Der Nachläufer am Zeigerereignis
vergleicht deshalb nicht mehr gegen 1, sondern gegen den zuletzt gesetzten
Stand (`_sollSX`/`_sollSY`). Gleichmäßiges Vergrößern bleibt unangetastet,
dort soll der Rand mitwachsen.

## Sticker: Breite und Höhe frei

`SS.elSizeRaw` rechnet für Sticker `w = el.s * def.ar` – die Höhe steckt in
`el.s`, die Breite folgte zwingend aus dem Katalog. Getrennt ging es nur
versteckt über Shift beim Ziehen, ohne Zahlen und ohne Rückmeldung.

Anders als bei den Rahmen ist Strecken hier genau richtig: ein Sticker hat
keinen Rand, der ungleich dick werden könnte. Ein breitgezogenes Band, eine
flache Wolke, ein hoher Lichtstrahl – das ist der Zweck. Die Mechanik bleibt
deshalb einfach:

```
sichtbare Breite = el.s · def.ar · scaleX
sichtbare Höhe   = el.s · scaleY          (scaleY wird immer auf 1 gestellt)
```

Nachgemessen, jeweils über `SS.stickerGroesse` **und** über `SS.elSize`:

| Wunsch | Ergebnis |
|---|---|
| 600 × 200 | 600 × 200 |
| 200 × 600 | 200 × 600 |
| 400 × 400 | 400 × 400 |
| 1080 × 300 | 1080 × 300 |

Bedienung: Sticker antippen → **Alle Einstellungen** → **Größe · Breite × Höhe**,
zwei Zahlenfelder mit Kettensymbol, dazu **Eigenes Format** (zurück zum
Katalogverhältnis) und **Über die Slide** (volle Slidebreite). Beim Ziehen an
den Kantengriffen ist die Seitenverhältnis-Sperre für Sticker aufgehoben; für
Fotos und Texte gilt sie unverändert weiter.

## Technik

`rahmenfrei78.js` erweitert (zweite Phase, `rahmenVorX`, `_sollSX`/`_sollSY`),
neue Datei `stickerfrei79.js`, Skript-Eintrag in `index.html`, `sw.js` auf
`ss-v7.9.0` samt Aufnahme in `ASSETS`.

Neue API:

```js
SS.setzeStickerGroesse(el, breite, hoehe)   // → true
SS.stickerGroesse(el)                       // → {w, h}
SS.stickerQuellAR(el)                       // → Katalogverhältnis
el.rahmenVorX                               // Vorstauchung der Quelle, 1 = keine
```

Geprüft: alle 50 Rahmen × 4 Formate, Prüfkreis-Messung auf Verzerrung,
fünfmaliges Antippen bei form-festem Rahmen (kein Neuberechnen), Randstärke
der v7.8-Rahmen unverändert (Polaroid 21/20/21/20 über alle Formate), Sticker
in vier Formaten, Video-Clips in drei Formaten, Migration alter Projekte,
`paintScene`, `serialize`/`restore`, Undo/Redo – keine Befunde, keine
Konsolenfehler.
