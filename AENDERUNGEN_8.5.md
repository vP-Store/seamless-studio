# Seamless Studio v8.5.0 – App neu laden, Offline-Speicher leeren (11.08.2026)

Meldung: „Ich habe das Gefühl, dass durch mehrfaches Schließen nichts
passiert. Wir brauchen einen Knopf, der die App neu lädt."

## Das Gefühl war richtig

In `sw.js` stand bisher:

```js
caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(...))
```

`hit ||` heißt: liegt eine Datei im Offline-Speicher, wird sie genommen – ohne
einen Blick ins Netz. Und `ignoreSearch: true` heißt: selbst
`index.html?neu=1` trifft denselben Eintrag. Also half kein Anhängsel an der
Adresse, kein Neuladen und kein Schließen des Tabs. Ausgetauscht wurde erst,
wenn der Browser von sich aus die neue `sw.js` holte – und die darf er bis zu
einem Tag aus seinem eigenen Zwischenspeicher bedienen.

## Behoben, auf drei Wegen

**1 · Ein Knopf.** Reiter **Projekte**, gleich oben:
**„🔄 App neu laden (Offline-Speicher leeren)"**. Er löscht jeden
Offline-Speicher, meldet den Service Worker ab und lädt die Seite mit einem
frischen Anhängsel neu. Darunter steht die laufende Fassung und, falls im Netz
eine andere liegt, auch die.

Projekte, Versionen und Einstellungen bleiben unangetastet – die liegen im
`localStorage` und in der Datenbank, und beides wird nicht angefasst. Vor dem
Leeren wird `SS.autosave()` ausgelöst.

**2 · Eine Prüfung beim Start.** Die App holt `sw.js` mit `cache: 'no-store'`,
liest die Fassungsnummer heraus und vergleicht. Weicht sie ab, erscheint oben
eine Leiste: „Neue Fassung ss-vX ist da." mit **Jetzt laden**. Nach 15 Sekunden
macht sie von selbst Platz, damit sie nicht auf der Werkzeugleiste sitzen
bleibt.

**3 · `sw.js` lädt Programmdateien netz-zuerst.** Dokument, `.js`, `.css` und
`.webmanifest` kommen ab jetzt aus dem Netz, der Speicher ist nur noch der
Rückfall. Schriften, Symbole und Bilder ändern sich nie und kommen weiter
sofort aus dem Speicher. **Offline funktioniert die App unverändert** – ohne
Netz greift der Rückfall.

## Technik

Neue Datei `frisch85.js`, nichts umgeschrieben: `SS.appNeuLaden()`,
`SS.APP_FASSUNG`, `SS.APP_FASSUNG_NETZ`, `SS.FRISCH85.leeren()`. In `sw.js`
kamen ein zweiter Zweig im `fetch`-Ereignis und ein `message`-Ereignis dazu
(`{ typ: 'leeren' }`, `{ typ: 'uebernehmen' }`).

Eingetragen in `index.html` und in `ASSETS` in `sw.js`, `VERSION` auf
`ss-v8.5.0`.

## Geprüft

| Prüfung | Ergebnis |
|---|---|
| Knopf sitzt im Reiter „Projekte" | ja, mit Fassungszeile „ss-v8.5.0 · aktuell" |
| Datei im Netz geändert, ohne Neuladen abgefragt | `/* A */` → **`/* B */`** – netz-zuerst greift |
| dieselbe Datei ohne Netz | `/* B */` aus dem Speicher |
| App-Start ohne Netz | startet, `SS` ist da |
| `SS.FRISCH85.leeren()` | Speicher `[]`, Service-Worker-Anmeldungen `0` |
| Knopf gedrückt | Seite lädt neu, `SS` wieder da, Speicher baut sich neu auf |
| Fassung im Netz künstlich auf `ss-v8.6.0` gesetzt | Leiste erscheint, Zeile zeigt „im Netz liegt ss-v8.6.0" |
| Farbtreue-Prüfung aus v8.4 | läuft unverändert durch |
| Konsolenfehler | keine |

## Nebenbei

Damit ist auch der Grund weg, warum die Farbtreue-Prüfung aus v8.4 auf dem
Handy nicht auftauchte: nicht der Knopf fehlte, sondern die alte Fassung lag
noch im Offline-Speicher.
