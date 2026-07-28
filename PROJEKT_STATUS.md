# Seamless Studio – Projekt-Status & Roadmap
Stand: 28.07.2026 · Version 4.1.1 (**deployed**)

## Live (dort läuft v4.1.1)
- **App:** https://vp-store.github.io/seamless-studio/
- **Repo:** https://github.com/vP-Store/seamless-studio (Branch main, GitHub Pages aktiv)
- **PWA:** installierbar, offline-fähig, Service Worker Cache-Version `ss-v4.1.1`

> Regel bleibt: **niemals ungefragt hochladen** – erst lokal testen, dann auf Ansage deployen.

---

# NEU in v4.1

## 🅐 Text-Animation – jetzt wirklich für alles
Der Befund: die 76 Animationen liefen technisch auf Textfeldern (nachgemessen, alle 76 bewegen Pixel) —
gefehlt hat die Sorte, die man bei CapCut sieht: **jeder Buchstabe einzeln**. Genau das ist jetzt da.

- **20 neue Buchstaben-Animationen** (`textOnly`), eigene Gruppe **🅐 Buchstaben** im Animations-Panel:
  Schreibmaschine, Einblenden, Pop-In, Fallen, Aufsteigen, Einfliegen, Streuen, Welle, Hüpfen je Zeichen,
  Springen, Schwingen, Zoom, Flip, Zittern, Leucht-Lauf, Neon-Einschalten, Wort-Fade, Wort-Pop,
  Kaskade, Atmen je Zeichen
- Render-Weg: `drawLinePerChar` misst jede Zeile zeichenweise, respektiert Ausrichtung, Laufweite,
  Füllung, Kontur, Schatten und Leuchten — die Zeichen werden einzeln transformiert gezeichnet
- `SS.animFrame` liefert für `perChar`-Animationen bewusst `null`, damit der ganze Block nicht doppelt
  bewegt wird; der **Textfeld-Hintergrund folgt** trotzdem der Animation (geprüft)
- Die Gruppe erscheint nur, wenn ein Textfeld ausgewählt ist — bei Fotos und Stickern bleibt sie aus
- Gesamt jetzt **97 Animationen**, keine davon ohne Wirkung (automatisch nachgemessen)

## 🌙 Sticker – 52 neue, davon 33 spirituelle
Neue Datei `js/stickers2.js`, gezeichnet statt Emoji: Radialverläufe, Glanzlichter, Schlagschatten.

- **Spirituell (33)**: Mondsichel, Vollmond, Halbmond, Mondphasen, Sonne & Mond, Mandala,
  Blume des Lebens, Metatron-Würfel, Sri Yantra, Merkaba, Lotus, Chakra-Rad, Chakra-Säule,
  Drittes Auge, Nazar, Hamsa, Om, Kristall-Cluster, Kristall-Gruppe, Kristallkugel, Feder,
  Engelsflügel, Triquetra, Pentagramm, Baum des Lebens, Räucherbündel, Kerze mit Aura,
  Traumfänger, Sternbild, Aura-Kreis, Unendlichkeit u. a.
- **Glanz & Effekt (19)**: Glanz-Herz, Glanz-Stern, Seifenblase, Lichtstrahl, Linsenreflex,
  Glitzer-Streu, Bokeh, Rauch, Neon-Rahmen, Neon-Herz, Neon-Stern, Verlaufs-Blob, Perlenkette,
  Goldband, 3D-Schleife, Sticker-Rahmen, Funken, Farbklecks, Marmorkugel
- **131 Sticker gesamt**, 0 Zeichenfehler (Kontaktbogen gerendert und einzeln durchgesehen;
  Merkaba, Engelsflügel, Mondphasen, Om und Feder wurden nach der Sichtprüfung nachgebessert)

## 🅣 20 Textvorlagen
Neue Datei `js/texttpl.js`, eigener Abschnitt im Text-Panel mit gerenderten Vorschau-Kacheln.
Editorial, Soft Script, Statement, Spirituell, Handschrift, Luxus, Neon, Vintage, Minimal, Romantik,
Magazin, Zitat, Baby, Boho, Label, Outline, Retro-3D, Sanft, Schreibmaschine, Welle.
Jede Vorlage bringt aufeinander abgestimmte Schriftpaare, Größen, Farben, Kontur, Schatten und Abstände
mit; mehrteilige Vorlagen werden beim Einsetzen **automatisch gruppiert** und landen mittig auf der
gerade sichtbaren Slide. Die Vorschauen werden erst nach `document.fonts.ready` gebaut und zeilenweise
eingepasst, damit nichts überlappt.

## 📱 Mehrere Fotos am Handy
Nachgestellt auf iPhone 13: der Code nahm vier Dateien korrekt an — es ist die **Foto-Auswahl des
Systems**, die je nach App und Einstellung nur ein Bild durchreicht. Deshalb jetzt vier Maßnahmen:

1. Der **Sortierdialog erscheint am Handy auch bei einem einzelnen Foto**, sobald schon Fotos da sind
2. **„＋ Weitere Fotos"** direkt im Dialog: neu gewählte Bilder werden an denselben Stapel angehängt
3. Ein **dritter Dateiauswahl-Eingang ohne `accept`** öffnet die Dateien-App statt der Fotos-App —
   dort geht Mehrfachauswahl zuverlässig
4. Kurzer Hinweistext im Dialog, der das erklärt

Geprüft: 1 Foto → Dialog beim zweiten → „＋ Weitere Fotos" → 4 Fotos in einem Rutsch angeordnet.

## Lokal testen
Im Ordner `seamless-studio` einen kleinen Server starten (wegen Service Worker und Mikrofon):

    python -m http.server 8080

Dann http://localhost:8080 öffnen.

## Ordnerstruktur
- `seamless-studio/` – Quellprojekt (js/, fonts/, icons/, lib/)
- `ss-flat/` – deploy-fertige FLACHE Version → geht 1:1 ins Repo
- Flatten = die Präfixe `js/`, `lib/`, `icons/`, `fonts/` aus index.html, sw.js, fonts.css und
  manifest.webmanifest entfernen. Bei jedem Release `VERSION` in sw.js hochzählen.

---

# NEU in v4.0

## 🔴 Drei Fehler behoben, die still im Bestand steckten

**1. Der Bilder-Export brach auf dem iPhone ab.**
WebKit begrenzt ein einzelnes Canvas auf 16.777.216 px². Bisher wurde für den Export ein einziges
Panorama-Canvas über alle Slides gebaut. Nachgerechnet brach das bei 4:5 ab **12 Slides** und im
**2K-Modus schon ab 3 Slides**. Auf PC und Android fiel es nicht auf.
→ Jetzt wird **Slide für Slide** in ein eigenes Canvas gerendert (`renderOneSlide`), Canvases werden
mit `width = height = 0` freigegeben. Das Gesamt-Panorama ist eine eigene Ausgabe, die automatisch
auf die Flächengrenze herunterskaliert wird – mit Hinweis. Geprüft: 14 Slides in 2K laufen sauber.

**2. iOS löschte gespeicherte Projekte nach 7 Tagen.**
→ `navigator.storage.persist()` wird bei der ersten Nutzergeste angefordert; das Projekt-Panel zeigt
den belegten Speicher und ob er dauerhaft gesichert ist.

**3. Das Display sperrte mitten im Video-Export.**
→ `Screen Wake Lock` um Export, Video-Export und Voiceover-Aufnahme.

Nebenbei repariert: Unschärfe- und Pixelbereiche wurden bei 2K/4K falsch abgetastet (die
Momentaufnahme wird jetzt mit ihrer Abbildungsmatrix geführt), und der Video-Zwischenpuffer deckelt
auf **Fläche** statt auf Breite.

## 🖱 Auswahl und Interaktion
- **Mehrfachauswahl**: Umschalt- oder Strg-Klick, am Handy der Knopf „＋ Mehrere" im Studio-Panel
- **Lasso**: Umschalt+Ziehen oder Taste `L` bzw. der Lasso-Knopf
- **Gemeinsam bewegen, skalieren, drehen** um den Mittelpunkt der Auswahl
- **Gruppieren** (Strg+G / Strg+Umschalt+G): ein Klick wählt die ganze Gruppe
- **Ausrichten** (6 Richtungen) und **Verteilen** für die Auswahl
- **Freie Verzerrung** über neue Kanten-Griffe, mit **Seitenverhältnis-Sperre** (Standard an,
  Umschalt schaltet frei) – intern `scaleX`/`scaleY`, gilt für alle Elementtypen
- **Smart Guides**: fängt an Kanten *und* Mitten, zeigt Abstände in Pixeln und hebt gleiche
  Abstände hervor

## 🗂 Ebenen-Panel
Eigener Knopf in der Kopfzeile (kein achter Reiter – dafür ist am Handy kein Platz).
Pro Ebene: Miniatur, Typ-Symbol, Name (Doppeltippen zum Umbenennen), Deckkraft-Regler,
Auge (Ausblenden), Schloss (Sperren), Ziehgriff zum Umsortieren. Gruppen sind eingerückt markiert.
Darunter die **Verlaufs-Leiste**: jeder Schritt mit Beschriftung, anklickbar zum Zurückspringen.

## 📷 Foto-Werkzeuge
- **Richtiger Zuschnitt-Dialog**: Zieh- und größenveränderbare Box mit 8 Griffen, Drittelraster,
  Seitenverhältnisse (Frei, Original, 1:1, 4:5, 3:4, 2:3, 16:9, 9:16), **Füllen**/**Einpassen**,
  90°-Drehung und **Begradigen** (−15°…+15°)
- **Foto ersetzen**: tauscht nur das Bild, Rahmen, Filter, Position, Größe und Animation bleiben
- **Batch**: Filter und Rahmen auf die gesamte Auswahl
- **Text-Stil übertragen** auf alle Textfelder (ergänzt „Foto-Stil übertragen")

## 🅣 Text
- **46 Schriften** (16 neue): Alex Brush, Allura, Tangerine, Petit Formal Script,
  Mrs Saint Delafield, Yellowtail, Cookie, La Belle Aurore, Cormorant Upright, Gilda Display,
  Prata, Bodoni Moda, Julius Sans One, Tenor Sans, Forum, Philosopher – in fünf Gruppen sortiert,
  antippbare Vorschau, alle offline mitgeliefert (OFL)
- **Schatten, Leuchten, Kontur und Füllung frei kombinierbar** statt eines einzigen Effekts;
  je mit Farbe, Breite, Weichheit und Versatz. „Nur Kontur" für Hohlschrift.
- **Bogen** mit Krümmungsregler und Schnellwahl (oben, unten, Kreis, gerade)
- **Schnittkanten-Hilfe**: rote gestrichelte Warnlinie genau an der betroffenen Kante,
  „↔ An Kante spiegeln" und „➡ Automatisch verschieben"

## 💛 Sticker, Privacy, Hintergründe, Looks
- **„Auf nächste Kante"** und **„Auf alle Kanten"** – der Trick, der ein Panorama zusammenhält
- **Privacy**: Formen Rechteck, Abgerundet, Ellipse, **Herz**, **Stern**; Weichzeichnen oder Pixel
  mit einstellbarer Blockgröße
- **12 nahtlose Panorama-Hintergründe**, die über die **gesamte Breite** durchlaufen statt pro
  Slide zu kacheln: Sonnenaufgang, Dämmerung, Aquarell-Welle, Goldband, Bergkette, Sanfte Hügel,
  Pastellbogen, Diagonalen, Konfetti-Bogen, Blätterranke, Wolkenband, Milchstraße
- **12 Looks** setzen jetzt gleichzeitig Hintergrund, Rahmenstil, Rahmenfarbe, Schrift, Textfarbe,
  Sticker-Palette und Filter
- **8 Layout-Vorlagen**: Reihe, Versetzt, Diagonal, 1 groß + Rest, Zwei Reihen, Je Slide eins,
  Text-lastig, Collage-Raster

## ⬇️ Export
- **Nur Panorama** als eigene Ausgabe (ein langes Bild), mit automatischer Flächendeckelung
- **Mehrere Formate auf einmal**: 4:5, 1:1 und 9:16 landen als eigene Ordner im ZIP.
  Die Umrechnung ist nicht-destruktiv – der Arbeitsstand bleibt unangetastet (getestet).
- **1× / 2× / 4×** mit Grenzprüfung: unmögliche Kombinationen werden ausgegraut und erklärt
- **JPG, PNG und WebP**
- **Kamera-Tempo** (0,4×–2×) und **Bewegungskurve** (weich, gleichmäßig, schwungvoll)
- **Video ohne Ton** als Schalter
- **Instagram**: Teilen-Auswahl mit Beschriftung, dazu „Instagram öffnen" als Rückfallebene

## 👁 Vorschau
Die Wisch-Vorschau zeigt jetzt die echte Instagram-Oberfläche – Profilzeile, Zähler, Aktionsleiste,
Bildunterschrift – und lässt zwischen **Feed 4:5** und **Profil 3:4** umschalten. Damit sieht man
vorher, was Instagram im Profilraster wegschneidet.

## ⚙️ Profi und Politur
- **Raster-Menü**: Drittelregel, 4×4-Raster, Goldener Schnitt, **Story/Reel-Safe-Zone**,
  **3:4-Profilraster**
- **Versionen** mit Namen sichern und zurückholen
- **Komplettsicherung**: alle Projekte als eine ZIP-Datei (ersetzt die Cloud-Sicherung, die ohne
  Server nicht geht)
- **Globale Farbpalette**: Pipette merkt sich Farben, „Farben aus dem Bild ziehen" liefert die
  sechs Hauptfarben
- **Tastenkürzel-Übersicht** über `?`
- **Leistungsmodus**, manuell und automatisch bei vielen Elementen
- **Beispiel-Carousel** im leeren Zustand, kurze **Einführung** beim ersten Start
- **Toasts** mit Typ, Symbol und optionaler Aktion; mehr **Haptik**
- **Fotos aus dem Regal auf die Leinwand ziehen** (Maus und Finger)
- Eigenschaften-Blatt am Handy höher und per Ziehen verstellbar

---

## Was bewusst NICHT gebaut wurde (und warum)
| Wunsch | Grund |
|---|---|
| Cloud-Backup | Ohne Server nicht möglich. Ersatz: „Alle Projekte als ZIP sichern". |
| Direkt-Upload zu Instagram | Instagram bietet dafür keine offene Schnittstelle. Die Teilen-Auswahl ist der kürzeste mögliche Weg. |
| Automatische Untertitel, KI-Freisteller, generatives Erweitern | Bräuchte Modelle von 25 MB bis mehrere GB. Siehe ANALYSE_v4.md für die machbaren Varianten. |

## Roadmap v5 (Ideen)
- WebCodecs statt MediaRecorder für den Video-Export (~10× schneller, echtes MP4;
  seit Safari 26 auch auf iOS möglich)
- Mehrere Clips mit Übergängen, manuelle Untertitel, Beat-Sync auf die eigenen Musikbetten
- Nachladbares MediaPipe-Modell (~1 MB) als „Motiv vorschlagen" im Freisteller

## Technik-Notizen
- Vanilla JS + Canvas, keine Frameworks, kein Build-Schritt. JSZip für den Export.
- Auswahl: `st.selectedIds` (Array) mit `SS.setSel/addSel/toggleSel/setSelMany/clearSel/getSel/getSelAll`.
  `SS.getSel()` liefert weiterhin das primäre Element.
- Elementfelder neu: `locked`, `hidden`, `gid`, `scaleX`, `scaleY`, `name`.
  `SS.liveElements()` (sichtbar) und `SS.pickableElements()` (greifbar) statt verstreuter Abfragen.
- Migration alter Projekte über `SS.normalizeEl` / `SS.normalizeAll`; Text-Effekte werden von
  `effect` auf `fill`/`outline`/`shadow`/`glow` abgebildet (getestet mit einem v3.1-Projekt).
- Canvas-Grenzen: `SS.MAX_CANVAS_AREA`, `SS.areaOk`, `SS.fitScale`, `SS.makeCanvas`, `SS.freeCanvas`.
- Ladereihenfolge (wichtig, `layers`/`extras`/`texttpl` **müssen** nach `ui` kommen):
  util, backgrounds, frames, stickers, **stickers2**, anim, render, interact, clip, sortdlg,
  cutout, crop, ui, layers, extras, **texttpl**, audio, video, exporter, main.
- Deutsch als UI-Sprache, dunkles Theme Standard (`body.light` = hell).
