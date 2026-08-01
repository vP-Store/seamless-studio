/* Seamless Studio – Kinetische Texte
   ============================================================================
   Texte, die sich im Video AUFBAUEN – das, was Reels ihren Rhythmus gibt:

     tippen      Zeichen fuer Zeichen, wie eine Schreibmaschine
     wortweise   Wort fuer Wort
     zeilen      Zeile fuer Zeile

   Umgesetzt als Umhuellung von SS.drawTextEl: waehrend Video-Vorschau und
   -Export (SS._kfT ist gesetzt) wird der Inhalt des Elements fuer genau
   einen Zeichenvorgang auf den bereits "erschienenen" Teil gekuerzt.
   Auf der stillen Leinwand und im Bildexport steht immer der ganze Text.
   Einstellung je Text im Eigenschaftsblatt (Beginn + Dauer in Sekunden).
   ========================================================================= */

(function () {
  if (!SS.ui || typeof SS.drawTextEl !== 'function') return;

  function sichtbarerTeil(el, t) {
    const dauer = Math.max(0.2, el.kinetikDauer || 1.6);
    const start = el.kinetikStart || 0;
    const u = Math.max(0, Math.min(1, (t - start) / dauer));
    if (u >= 1) return el.content;
    const voll = el.content || '';
    if (el.kinetik === 'tippen') {
      return voll.slice(0, Math.round(voll.length * u));
    }
    if (el.kinetik === 'wortweise') {
      const woerter = voll.split(/(\s+)/);        // Trenner behalten
      const anzWoerter = woerter.filter(w => w.trim()).length;
      let zeigen = Math.round(anzWoerter * u);
      const teile = [];
      for (const w of woerter) {
        if (w.trim()) {
          if (zeigen <= 0) break;
          zeigen--;
        }
        teile.push(w);
      }
      return teile.join('');
    }
    if (el.kinetik === 'zeilen') {
      const zeilen = voll.split('\n');
      const anz = Math.max(1, Math.round(zeilen.length * u));
      return zeilen.slice(0, anz).join('\n');
    }
    return voll;
  }

  const alt = SS.drawTextEl;
  SS.drawTextEl = function (c, el) {
    const t = SS._kfT;
    if (t == null || SS._noAnim || !el || !el.kinetik || el.kinetik === 'keine' || !el.content) {
      return alt.apply(this, arguments);
    }
    const teil = sichtbarerTeil(el, t);
    if (teil === el.content) return alt.apply(this, arguments);
    if (!teil) return;                            // noch nichts zu sehen
    const ganz = el.content;
    el.content = teil;
    try { return alt.apply(this, arguments); }
    finally { el.content = ganz; }
  };

  /* ------------------------------------ Einstellung im Eigenschaftsblatt */
  if (typeof SS.ui.showProps === 'function') {
    const altProps = SS.ui.showProps;
    SS.ui.showProps = function () {
      const r = altProps.apply(this, arguments);
      try {
        const ids = SS.state.selectedIds || [];
        if (ids.length !== 1) return r;
        const el = SS.state.elements.find(e => e.id === ids[0]);
        if (!el || el.type !== 'text') return r;
        const body = document.getElementById('propsBody');
        if (!body || body.querySelector('#kinSel')) return r;
        const zeile = document.createElement('div');
        zeile.className = 'ctl';
        zeile.style.display = 'block';
        zeile.innerHTML =
          '<span style="opacity:.7;font-size:12px">Im Video aufbauen</span>' +
          '<div class="ctl"><select id="kinSel" style="flex:1">' +
            '<option value="keine">Nein – steht sofort da</option>' +
            '<option value="tippen">Schreibmaschine (Zeichen für Zeichen)</option>' +
            '<option value="wortweise">Wort für Wort</option>' +
            '<option value="zeilen">Zeile für Zeile</option>' +
          '</select></div>' +
          '<div class="ctl" id="kinZeitRow"><span>ab Sek.</span>' +
            '<input type="number" id="kinStart" step="0.1" min="0" style="width:70px">' +
            '<span>Dauer</span>' +
            '<input type="number" id="kinDauer" step="0.1" min="0.2" style="width:70px"></div>';
        body.appendChild(zeile);
        const sel = zeile.querySelector('#kinSel');
        const st = zeile.querySelector('#kinStart');
        const du = zeile.querySelector('#kinDauer');
        sel.value = el.kinetik || 'keine';
        st.value = el.kinetikStart || 0;
        du.value = el.kinetikDauer || 1.6;
        const zeit = zeile.querySelector('#kinZeitRow');
        const zeigen = () => zeit.classList.toggle('hidden', sel.value === 'keine');
        zeigen();
        sel.onchange = () => {
          el.kinetik = sel.value === 'keine' ? undefined : sel.value;
          zeigen();
          SS.pushHistory('Text-Aufbau');
          SS.video && SS.video.refresh && SS.video.refresh(true);
        };
        st.onchange = () => { el.kinetikStart = Math.max(0, +st.value || 0); SS.pushHistory('Text-Aufbau'); };
        du.onchange = () => { el.kinetikDauer = Math.max(0.2, +du.value || 1.6); SS.pushHistory('Text-Aufbau'); };
      } catch (e) {}
      return r;
    };
  }

  SS.KINETIK7 = { bereit: true, sichtbarerTeil };
})();
