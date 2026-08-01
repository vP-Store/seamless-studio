/* Seamless Studio – Sprecher-Studio (Teleprompter)
   ============================================================================
   Fuer Sprech-Reels: Skript schreiben, "Mit Teleprompter aufnehmen" – der
   Text scrollt gross und ruhig, waehrend die vorhandene Sprachaufnahme
   (SS.audio.startRecording) laeuft. Danach ein Knopf: das Skript wird
   satzweise zu Untertitel-Zeilen, und das Mittippen (reel7.js) verteilt
   die Zeiten wortgenau. Einsprechen -> mittippen -> fertig.
   ========================================================================= */

(function () {
  const A = SS.audio;
  if (!A || !SS.ui) return;

  let skript = '';
  try { skript = localStorage.getItem('ss-skript') || ''; } catch (e) {}

  function saetze(text) {
    return text.replace(/\s+/g, ' ')
      .split(/(?<=[.!?…])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 1);
  }

  /* ------------------------------------------------------------ Prompter */
  function prompter() {
    if (!skript.trim()) { SS.toast('Erst ein Skript schreiben', 2600, 'warn'); return; }
    if (!A.recSupported || !A.recSupported()) {
      SS.toast('Dieses Gerät erlaubt keine Aufnahme im Browser', 3600, 'err'); return;
    }
    const deck = document.createElement('div');
    deck.id = 'prompterDeck';
    deck.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(10,9,8,.97);' +
      'display:flex;flex-direction:column;align-items:center;overflow:hidden';
    deck.innerHTML =
      '<div id="ppLauf" style="flex:1;overflow:hidden;width:min(720px,92vw);position:relative">' +
        '<div id="ppText" style="position:absolute;top:40%;width:100%;color:#f6eedc;' +
        'font-size:30px;line-height:1.7;text-align:center;white-space:pre-wrap"></div>' +
      '</div>' +
      '<div style="padding:14px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:center">' +
        '<span id="ppStand" style="color:#a99">Bereit.</span>' +
        '<label style="color:#a99">Tempo <input type="range" id="ppTempo" min="10" max="60" value="26"></label>' +
        '<button id="ppStart" class="primary" style="padding:12px 26px">Aufnahme + Prompter starten</button>' +
        '<button id="ppStop" class="hidden" style="padding:12px 26px">Stopp</button>' +
        '<button id="ppZu">Schließen</button>' +
      '</div>';
    document.body.appendChild(deck);
    const $$ = (id) => deck.querySelector('#' + id);
    $$('ppText').textContent = skript;

    let raf = null, laeuft = false, y = 0, letztes = 0;
    const rollen = (ts) => {
      if (!laeuft) return;
      if (letztes) {
        y += (+$$('ppTempo').value) * (ts - letztes) / 1000;
        $$('ppText').style.transform = 'translateY(' + (-y) + 'px)';
      }
      letztes = ts;
      raf = requestAnimationFrame(rollen);
    };

    const aufhoeren = (behalten) => {
      laeuft = false;
      if (raf) cancelAnimationFrame(raf);
      if (A.isRecording && A.isRecording()) {
        A.stopRecording();
        if (behalten) SS.toast('Aufnahme gespeichert – jetzt „Zeiten mittippen" im Untertitel-Bereich', 4600, 'ok');
      }
      deck.remove();
    };

    $$('ppZu').onclick = () => aufhoeren(false);
    $$('ppStart').onclick = async () => {
      $$('ppStart').classList.add('hidden');
      for (const z of ['3', '2', '1']) {
        $$('ppStand').textContent = z + ' …';
        await new Promise(r => setTimeout(r, 800));
      }
      try {
        await A.startRecording((t) => { $$('ppStand').textContent = '● ' + t.toFixed(1) + ' s'; });
      } catch (e) {
        $$('ppStand').textContent = 'Kein Mikrofonzugriff – in den Browser-Einstellungen erlauben.';
        $$('ppStart').classList.remove('hidden');
        return;
      }
      $$('ppStop').classList.remove('hidden');
      laeuft = true; letztes = 0;
      raf = requestAnimationFrame(rollen);
    };
    $$('ppStop').onclick = () => aufhoeren(true);
  }

  /* ------------------------------------------- Skript -> Untertitel-Zeilen */
  function zeilenAnlegen() {
    const teile = saetze(skript);
    if (!teile.length) { SS.toast('Das Skript ist leer', 2400, 'warn'); return; }
    const dur = (SS.video && SS.video.player && SS.video.player.dur) ||
      +((document.getElementById('vidDur') || {}).value || 8) || 8;
    SS.captions.splice(0);
    const je = Math.max(0.8, (dur - 0.4) / teile.length);
    teile.forEach((t, i) => {
      SS.captions.push({ t0: +(0.2 + i * je).toFixed(2), t1: +(0.2 + (i + 1) * je).toFixed(2), text: t });
    });
    SS.ui.refreshCaptions && SS.ui.refreshCaptions();
    SS.pushHistory('Skript zu Untertiteln');
    SS.toast(teile.length + ' Zeilen angelegt – grob verteilt; „Zeiten mittippen" macht sie genau', 4200, 'ok');
  }

  /* ------------------------------------------------------------ Bedienung */
  const anker = document.getElementById('vidRecState');
  if (!anker || !anker.parentElement) return;
  const box = document.createElement('div');
  box.id = 'sprecherBox';
  box.innerHTML =
    '<h3 style="margin:14px 0 6px">Sprecher-Studio</h3>' +
    '<textarea id="spSkript" rows="4" style="width:100%;resize:vertical" ' +
      'placeholder="Dein Sprechtext – Satz für Satz, wie du ihn sagen willst …"></textarea>' +
    '<div class="chips">' +
      '<button id="spPrompt">Mit Teleprompter aufnehmen</button>' +
      '<button id="spZeilen">Skript → Untertitel-Zeilen</button>' +
    '</div>' +
    '<p class="hint">Der Text scrollt beim Einsprechen ruhig mit (Tempo regelbar). Danach werden ' +
    'die Sätze zu Untertitel-Zeilen – und das Mittippen setzt die Zeiten wortgenau.</p>';
  anker.parentElement.insertBefore(box, anker.nextSibling);

  const feld = document.getElementById('spSkript');
  feld.value = skript;
  feld.addEventListener('change', () => {
    skript = feld.value;
    try { localStorage.setItem('ss-skript', skript); } catch (e) {}
  });
  document.getElementById('spPrompt').onclick = () => { skript = feld.value; prompter(); };
  document.getElementById('spZeilen').onclick = () => { skript = feld.value; zeilenAnlegen(); };

  SS.SPRECHER7 = { bereit: true, saetze };
})();
