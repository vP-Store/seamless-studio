/* Seamless Studio – Posting-Erinnerungen als Kalenderdatei
   ============================================================================
   Der Projekt-Kalender weiss, WANN gepostet werden soll – jetzt kann er es
   dem Handy sagen: ein Knopf baut eine .ics-Datei (offener Kalender-
   Standard, komplett offline erzeugt). Am iPhone antippen -> "Zu Kalender
   hinzufuegen" -> jeder geplante Beitrag wird ein Termin um 18:00 mit
   Erinnerung 15 Minuten vorher. Die Bruecke zwischen Planen und Tun.
   ========================================================================= */

(function () {
  const P = SS.projekte;
  if (!SS.ui || !P) return;

  function icsZeit(datum, stunde) {
    return datum.replace(/-/g, '') + 'T' + String(stunde).padStart(2, '0') + '0000';
  }
  const saubern = (t) => String(t || '').replace(/[\\;,]/g, ' ').replace(/\n/g, ' ');

  function icsBauen() {
    const geplant = P.index.filter(m => m.geplant);
    if (!geplant.length) {
      SS.toast('Nichts geplant – gib Projekten erst ein Datum', 3200, 'warn');
      return null;
    }
    const z = [
      'BEGIN:VCALENDAR', 'VERSION:2.0',
      'PRODID:-//Seamless Studio//Posting-Plan//DE',
      'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    ];
    for (const m of geplant) {
      z.push('BEGIN:VEVENT');
      z.push('UID:' + m.id + '@seamless-studio');
      z.push('DTSTAMP:' + icsZeit(m.geplant, 12) + 'Z');
      z.push('DTSTART:' + icsZeit(m.geplant, 18));
      z.push('DTEND:' + icsZeit(m.geplant, 18).replace('T180000', 'T183000'));
      z.push('SUMMARY:Posten: ' + saubern(m.name));
      if (m.serie) z.push('DESCRIPTION:Serie: ' + saubern(m.serie) + ' – Export liegt in Seamless Studio bereit.');
      z.push('BEGIN:VALARM');
      z.push('TRIGGER:-PT15M');
      z.push('ACTION:DISPLAY');
      z.push('DESCRIPTION:Gleich posten: ' + saubern(m.name));
      z.push('END:VALARM');
      z.push('END:VEVENT');
    }
    z.push('END:VCALENDAR');
    return z.join('\r\n');
  }

  const kal = document.getElementById('pjKalender');
  if (!kal || !kal.parentElement) return;
  const b = document.createElement('button');
  b.id = 'btnIcs';
  b.className = 'wide';
  b.textContent = 'Erinnerungen für den Handy-Kalender (.ics)';
  kal.parentElement.insertBefore(b, kal.nextSibling);
  b.onclick = () => {
    const text = icsBauen();
    if (!text) return;
    const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Posting-Plan.ics';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 9000);
    SS.toast('Kalenderdatei gebaut – am Handy antippen und übernehmen (18 Uhr, 15 Min vorher Erinnerung)', 4600, 'ok');
  };

  SS.ERINNERUNG7 = { bereit: true, icsBauen };
})();
