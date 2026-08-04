# Seamless Studio v7.6.0 – Änderungen (04.08.2026)

## Entfernt (Studio-Panel, auf Scotts Wunsch)
- **Layout-Vorlagen** (Fotoraster / Panorama / Fertige Seiten) samt Reiter
- **Farbpalette** („Farben aus dem Bild ziehen")
- **Über alle Slides** (Zähler / Fortschritt / Wisch-Pfeil)
- **Filmlook über alles** (Halation / Light Leak / Bloom / Staub)

Zeichnen und Sichern bleiben erhalten – alte Projekte mit gesetzten Werten
sehen unverändert aus, es gibt nur keine Regler mehr. „Vorlagen-Looks" und
„Barrierefreiheit" bleiben.

## Neu: Hintergrund-Foto je Slide (hintergrund76.js)
Unter „Hintergrund-Foto wählen …" (Szenen-Abschnitt) eine Chip-Zeile
„Foto je Slide": Nummer antippen → Bild wählen → liegt nur auf dieser
Slide. Slides ohne eigenes Foto behalten den bisherigen Hintergrund
(preset/gradient/eigenes Foto). ✕ räumt alle Slide-Fotos weg und stellt
den vorherigen Hintergrund wieder her. Überlebt Verlauf, Autosave,
Projektdateien und das Anwenden jeder Szene.

## Neu: 4 Objekt-Rahmen (rahmen76.js) – 50 Rahmen gesamt
- **Digicam rosa** – Foto als Display der rosa Kamera (Blumen-Vorbild)
- **Puzzleteil** – mehrere ergeben die Puzzle-Wand
- **Perlen-Herz** – Foto herzförmig hinter Perlenkranz
- **Poststempel** – Briefmarke mit Wellenrand und Stempelringen

## Neu: 35 Sticker in 4 Kategorien (sticker76.js) – 657 gesamt
- **Wolken** (9), **Muscheln** (9), **Gold** (9), **Schätze** (8)
  – nach Scotts Pinterest-Blättern, alles prozedural

## Neu: 4 Szenen (szenen76.js) – 23 gesamt
- **Wiesen-Scrapbook** – Spiralbuch, Polaroids, Kassette, Vinyl, Digicam
- **Highschool-Heft** – Filmstreifen, Stapel, TV, Regenbogen
- **Feenmärchen** – Riss-Mitte, Perlen-Herzen, Ovalspiegel, Falter
- **Happy Place** – Poststempel, Puzzle-Wand, Notizzettel

## Technik
sw.js VERSION ss-v7.6.0, vier neue Dateien in index.html + sw.js.
Geprüft: Grafik-, Anordnungs-, Grenzfall- und Looks-Testlauf ohne Befund;
Sichtprüfung aller Szenen, Rahmen und Sticker im Container.
