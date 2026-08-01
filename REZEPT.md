# Das Rezeptformat von Seamless Studio (`.ssrezept.json`)

Fassung **1** · gelesen ab App-Version 6.7.0 · Stand 31.07.2026

Ein Rezept beschreibt ein komplettes Karussell ohne Fotos. Die App öffnet
Rezepte im Projekt-Panel („Rezepte öffnen …"): eine Datei wird direkt als
Projekt angewendet, mehrere Dateien werden je ein Projekt im Kalender.

## Aufbau

```json
{
  "ssrezept": 1,
  "meta": {
    "name": "Innere Ruhe · Tag 1",
    "serie": "7 Tage Innere Ruhe",
    "geplant": "2026-08-04",
    "sprache": "de"
  },
  "format": "4:5",
  "slides": 5,
  "bg": { "type": "preset", "id": "aq-ivory-1" },
  "video": null,
  "fotoPlaetze": [
    { "x": 540, "y": 675, "h": 820, "rot": -4, "frame": { "style": "polaroid-w" } }
  ],
  "elemente": [
    { "type": "text", "content": "…", "x": 540, "y": 405, "size": 96,
      "font": "Playfair Display", "color": "#2f2a26", "align": "center",
      "lineHeight": 1.16, "shadow": false }
  ],
  "beitrag": {
    "hook": "…", "geschichte": "…", "hashtags": "#…", "altTexte": ["…"]
  }
}
```

## Regeln

- **Fassungsnummer:** `"ssrezept": 1` ist Pflicht. Unbekannte Fassungen lehnt
  die App ab, statt still falsch zu lesen.
- **Koordinaten** sind Leinwandpixel. Slide-Höhen: 4:5 → 1350, 1:1 → 1080,
  9:16 → 1920. Slide-Breite immer 1080; Slide *i* beginnt bei `x = i * 1080`.
  Textgröße `size` in Pixeln (Faustregeln: Hook ≈ 0.06–0.09 × Höhe,
  Fußzeile ≈ 0.017–0.022 × Höhe).
- **Texte** sind horizontal UND vertikal auf `x`/`y` **zentriert**.
  `align` regelt nur mehrere Zeilen zueinander.
- **Über Video** (wenn `video` gesetzt ist) brauchen Texte `"shadow": true`
  und helle Farben.
- `fotoPlaetze` sind Geometrie-Slots; die App legt vorhandene Fotos der Reihe
  nach darauf. Leer lassen ist erlaubt (reine Text-Karussells).
- **IDs prüfen:** `bg.id` gegen die Hintergrund-Kataloge, Sticker-`kind`
  gegen die Sticker-Kataloge, `anim` gegen die Animations-IDs
  (Kataloglisten: `references/04-kataloge.md` im Arbeits-Skill). Unbekanntes
  lässt die App weg und meldet die Anzahl.
- `@DEINPROFIL` und `WWW.DEINESEITE.DE` in Texten werden beim Anwenden durch
  das Marken-Set ersetzt – in Rezepten absichtlich als Platzhalter schreiben.
- `beitrag.geschichte` ersetzt im Beitragstext die Lücke; `beitrag.hashtags`
  werden ergänzt, wenn sie nicht schon aus dem Marken-Set kommen.

## Bewährte Bauformen

- **Text-Karussell (ohne Fotos):** Slide 1 Hook (Titelschrift groß, y ≈ 0.36·H),
  je Folge-Slide EIN Gedanke (y ≈ 0.42·H) mit kleiner Slide-Nummer darüber,
  letzte Slide Abschluss (Speichern/Folgen). Hintergrund `aq-…`/`tx-…`-Presets.
- **Foto-Karussell:** `fotoPlaetze` je Slide einen, versetzt zur Mitte
  (x = Slide-Mitte ± 0.1·1080), `rot` ±4–7°, Rahmen `polaroid-w`/`riss`/`washi`.
- Fußzeile `@DEINPROFIL` auf jeder Slide: je Slide ein Text-Element bei
  `y ≈ 0.945·H`, `size ≈ 0.017·H`, `letterSpacing` 4.
