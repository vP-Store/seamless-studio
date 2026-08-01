/* Seamless Studio – Beitrags-Tagebuch
   ============================================================================
   Nach dem Posten drei Zahlen eintragen (Reichweite, Gespeichert, neue
   Follower) – und die App zeigt unter "Was funktioniert", welche Hooks und
   Vorlagen bei DEINEM Publikum ziehen. Keine Anbindung, kein Tracking:
   du traegst ein, was Instagram dir zeigt, die App rechnet die Quote.

   Damit die Auswertung etwas zum Gruppieren hat, merkt sich die App beim
   Anwenden einer Vorlage deren Namen am Projekt, und beim Eintragen der
   Zahlen den Hook (groesster Text auf Slide 1).
   ========================================================================= */

(function () {
  const P = SS.projekte;
  if (!SS.ui || !P) return;

  /* Vorlagen-Namen am Projekt vermerken */
  if (typeof SS.ui.vorlageAnwenden === 'function') {
    const alt = SS.ui.vorlageAnwenden;
    SS.ui.vorlageAnwenden = async function (id) {
      const r = await alt.apply(this, arguments);
      try {
        const m = P.index.find(x => x.id === P.aktuellId);
        const v = SS.VORLAGEN && SS.VORLAGEN.find(x => x.id === id);
        if (m && v) m.vorlage = v.name;
      } catch (e) {}
      return r;
    };
  }

  function hookAusSzene() {
    const k = SS.canvasSize();
    const t = SS.state.elements
      .filter(e => e.type === 'text' && !e._wz && e.x < k.slideW)
      .sort((a, b) => (b.size || 0) - (a.size || 0))[0];
    return t ? (t.content || '').replace(/\n/g, ' ').trim().slice(0, 70) : '';
  }

  /* ------------------------------------------------------------ Eintragen */
  const box = document.getElementById('projekteBox');
  if (!box) return;
  const feld = document.createElement('div');
  feld.id = 'tagebuchBox';
  feld.innerHTML =
    '<div class="ctl" style="margin-top:12px;display:block">' +
      '<span style="opacity:.75;font-size:13px">Ergebnis (nach dem Posten eintragen)</span></div>' +
    '<div class="ctl"><span>Reichweite</span><input type="number" id="tbReich" min="0" style="flex:1"></div>' +
    '<div class="ctl"><span>Gespeichert</span><input type="number" id="tbSaves" min="0" style="flex:1"></div>' +
    '<div class="ctl"><span>Neue Follower</span><input type="number" id="tbFollow" min="0" style="flex:1"></div>' +
    '<button id="tbAuswertung" class="wide">Was funktioniert? – Auswertung</button>';
  const hinweis = box.querySelector('p.hint');
  box.insertBefore(feld, hinweis);

  const $ = (id) => document.getElementById(id);

  function ladeFelder() {
    const m = P.index.find(x => x.id === P.aktuellId);
    const e = (m && m.ergebnis) || {};
    $('tbReich').value = e.reichweite || '';
    $('tbSaves').value = e.saves || '';
    $('tbFollow').value = e.follower || '';
  }

  function merken() {
    const m = P.index.find(x => x.id === P.aktuellId);
    if (!m) { SS.toast('Erst ein Projekt öffnen (die Zahlen gehören zu einem Beitrag)', 3600, 'warn'); return; }
    m.ergebnis = {
      reichweite: +$('tbReich').value || 0,
      saves: +$('tbSaves').value || 0,
      follower: +$('tbFollow').value || 0,
      wann: Date.now(),
    };
    if (!m.hook) m.hook = hookAusSzene();
    P.sichernAktuell();
    SS.toast('Ergebnis gemerkt', 2000, 'ok');
  }
  ['tbReich', 'tbSaves', 'tbFollow'].forEach(id => {
    $(id).addEventListener('change', merken);
  });

  /* Beim Projektwechsel die Felder nachziehen */
  const altOeffnen = P.oeffnen;
  P.oeffnen = async function () {
    const r = await altOeffnen.apply(this, arguments);
    try { ladeFelder(); } catch (e) {}
    return r;
  };
  setTimeout(ladeFelder, 800);

  /* ----------------------------------------------------------- Auswertung */
  function auswertung() {
    const mit = P.index.filter(m => m.ergebnis && m.ergebnis.reichweite > 0);
    let d = document.getElementById('tbDlg');
    if (d) d.remove();
    d = document.createElement('div');
    d.id = 'tbDlg';
    d.className = 'modal';
    let inhalt;
    if (!mit.length) {
      inhalt = '<p class="hint">Noch keine Ergebnisse eingetragen. Öffne ein gepostetes Projekt ' +
        'und trage Reichweite, Gespeichert und neue Follower ein – ab drei Beiträgen wird es interessant.</p>';
    } else {
      const zeilen = mit
        .map(m => ({ m, quote: m.ergebnis.saves / m.ergebnis.reichweite }))
        .sort((a, b) => b.quote - a.quote);
      inhalt = '<p class="hint">Sortiert nach Speicherquote (Gespeichert ÷ Reichweite) – das ehrlichste ' +
        'Signal dafür, dass ein Beitrag wirklich etwas gegeben hat.</p>' +
        zeilen.map(({ m, quote }) =>
          '<div class="ctl" style="display:block;border-bottom:1px solid var(--line);padding:7px 0">' +
          '<b>' + m.name + '</b> <span style="opacity:.6">· ' + (m.geplant || '') + '</span><br>' +
          '<span style="opacity:.85">' + (quote * 100).toFixed(1) + ' % gespeichert · ' +
          m.ergebnis.reichweite + ' erreicht · +' + (m.ergebnis.follower || 0) + ' Follower</span><br>' +
          (m.hook ? '<span style="opacity:.6;font-size:12px">Hook: „' + m.hook + '"</span> ' : '') +
          (m.vorlage ? '<span style="opacity:.6;font-size:12px">· Vorlage: ' + m.vorlage + '</span>' : '') +
          '</div>').join('');
      /* Bestes-Muster-Zeile */
      const besteVorlage = {};
      zeilen.forEach(({ m, quote }) => {
        if (!m.vorlage) return;
        (besteVorlage[m.vorlage] = besteVorlage[m.vorlage] || []).push(quote);
      });
      const rang = Object.entries(besteVorlage)
        .map(([name, qs]) => [name, qs.reduce((a, b) => a + b, 0) / qs.length, qs.length])
        .sort((a, b) => b[1] - a[1]);
      if (rang.length >= 2) {
        inhalt = '<p class="hint"><b>Deine stärkste Vorlage:</b> ' + rang[0][0] + ' (' +
          (rang[0][1] * 100).toFixed(1) + ' % über ' + rang[0][2] + ' Beiträge)</p>' + inhalt;
      }
    }
    d.innerHTML = '<div class="modal-card" style="max-width:440px">' +
      '<div class="sort-head"><h3>Was funktioniert</h3><button id="tbClose">✕</button></div>' +
      '<div style="max-height:380px;overflow:auto">' + inhalt + '</div></div>';
    document.body.appendChild(d);
    d.querySelector('#tbClose').onclick = () => d.remove();
    d.addEventListener('pointerdown', (e) => { if (e.target === d) d.remove(); });
  }
  $('tbAuswertung').onclick = auswertung;

  SS.TAGEBUCH7 = { bereit: true };
})();
