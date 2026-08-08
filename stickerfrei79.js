/* Seamless Studio – Sticker in jedem Format (v7.9)
   ============================================================================
   Ein Sticker war bisher an sein Katalog-Seitenverhältnis gekettet. In
   `SS.elSizeRaw` steht:

       const ar = def && def.ar ? def.ar : 1;
       return { w: el.s * ar, h: el.s };

   `el.s` ist die Höhe, die Breite folgt zwingend daraus. In den Eigenschaften
   gab es deshalb nur einen einzigen Regler „Größe". Breite und Höhe getrennt
   ging nur versteckt: Shift beim Ziehen an einem Kantengriff, was `scaleX`
   und `scaleY` beschreibt – ohne Zahlen, ohne Rückmeldung, und beim nächsten
   Antippen sieht man dem Sticker nicht an, wie groß er eigentlich ist.

   Anders als bei den Rahmen ist Strecken hier genau das Richtige: ein Sticker
   hat keinen Rand, der ungleich dick werden könnte. Ein breitgezogenes Band,
   eine flache Wolke, ein hoher Lichtstrahl – das ist gewollt. Deshalb bleibt
   die Mechanik einfach: die Höhe steckt in `el.s`, die Breite in `el.scaleX`.

       sichtbare Breite = el.s · def.ar · scaleX
       sichtbare Höhe   = el.s · scaleY

   `SS.setzeStickerGroesse` rechnet eine Wunschgröße darauf um und stellt
   `scaleY` dabei immer auf 1, damit `el.s` die Höhe ehrlich wiedergibt.

   Emojis haben kein Katalogverhältnis (`ar = 1`) und laufen über denselben Weg.

   Es wird nichts überschrieben, nur umhüllt.
   ========================================================================= */

(function () {
  if (!SS.elSizeRaw || !SS.ui) return;

  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const istSticker = (el) => !!el && (el.type === 'sticker' || el.type === 'emoji');

  /* Das Seitenverhältnis, das der Katalog vorgibt. */
  SS.stickerQuellAR = function (el) {
    if (!el || el.type !== 'sticker') return 1;
    const def = (SS.STICKERS || []).find(s => s.id === el.kind);
    return (def && def.ar) ? def.ar : 1;
  };

  SS.stickerGroesse = function (el) {
    if (!istSticker(el)) return { w: 0, h: 0 };
    const ar = SS.stickerQuellAR(el);
    return { w: el.s * ar * (el.scaleX || 1), h: el.s * (el.scaleY || 1) };
  };

  SS.setzeStickerGroesse = function (el, zielW, zielH) {
    if (!istSticker(el)) return false;
    zielW = clamp(zielW, 12, 6000);
    zielH = clamp(zielH, 12, 6000);
    const ar = SS.stickerQuellAR(el);
    el.s = clamp(zielH, 12, 4000);
    el.scaleY = 1;
    el.scaleX = clamp(zielW / Math.max(1, el.s * ar), 0.02, 50);
    return true;
  };

  /* ==================================================================
     Bedienung: Breite × Höhe als Zahlen, wie bei den Rahmen
     ================================================================== */

  function h4(text) {
    const e = document.createElement('h4');
    e.textContent = text;
    return e;
  }

  function zahlenfeld(wert) {
    const i = document.createElement('input');
    i.type = 'number';
    i.min = '12'; i.max = '6000'; i.step = '1';
    i.value = Math.round(wert);
    i.style.cssText = 'flex:1;min-width:0;width:100%;background:var(--surface-2,#1c1917);'
      + 'color:var(--ink,#eee);border:1px solid var(--line,#3a3532);border-radius:6px;'
      + 'padding:6px 8px;font:inherit;font-size:12px;';
    return i;
  }

  function groessenAbschnitt(sel, body) {
    const g = SS.stickerGroesse(sel);
    body.appendChild(h4('Größe · Breite × Höhe'));

    const zeile = document.createElement('div');
    zeile.className = 'ctl';
    zeile.style.gap = '6px';

    const bw = zahlenfeld(g.w);
    const bh = zahlenfeld(g.h);

    const kette = document.createElement('button');
    kette.type = 'button';
    kette.title = 'Seitenverhältnis halten';
    kette.style.cssText = 'flex:0 0 auto;width:34px;height:32px;border-radius:6px;'
      + 'border:1px solid var(--line,#3a3532);background:transparent;color:var(--ink-mid,#bbb);'
      + 'cursor:pointer;font-size:14px;line-height:1;';
    let gesperrt = sel._stickerKette !== false;
    const zeigeKette = () => {
      kette.textContent = gesperrt ? '🔗' : '⛓️‍💥';
      kette.style.background = gesperrt ? 'var(--accent,#8a6a4f)' : 'transparent';
      kette.style.color = gesperrt ? '#FAF7F2' : 'var(--ink-mid,#bbb)';
    };
    zeigeKette();
    kette.onclick = () => { gesperrt = !gesperrt; sel._stickerKette = gesperrt; zeigeKette(); };

    const l1 = document.createElement('span'); l1.textContent = 'B';
    l1.style.cssText = 'width:auto;flex:0 0 auto;color:var(--ink-soft,#999);';
    const l2 = document.createElement('span'); l2.textContent = 'H';
    l2.style.cssText = 'width:auto;flex:0 0 auto;color:var(--ink-soft,#999);';

    zeile.appendChild(l1); zeile.appendChild(bw);
    zeile.appendChild(kette);
    zeile.appendChild(l2); zeile.appendChild(bh);
    body.appendChild(zeile);

    function setze(neuW, neuH) {
      SS.setzeStickerGroesse(sel, neuW, neuH);
      if (SS.invalidateEl) SS.invalidateEl(sel);
      SS.requestRender();
      const j = SS.stickerGroesse(sel);
      bw.value = Math.round(j.w);
      bh.value = Math.round(j.h);
    }

    bw.addEventListener('change', () => {
      const alt = SS.stickerGroesse(sel);
      const neu = +bw.value || alt.w;
      setze(neu, gesperrt ? alt.h * neu / Math.max(1, alt.w) : alt.h);
      SS.pushHistory('Stickerformat');
    });
    bh.addEventListener('change', () => {
      const alt = SS.stickerGroesse(sel);
      const neu = +bh.value || alt.h;
      setze(gesperrt ? alt.w * neu / Math.max(1, alt.h) : alt.w, neu);
      SS.pushHistory('Stickerformat');
    });

    const reihe = document.createElement('div');
    reihe.className = 'chips';
    const knopf = (text, fn) => {
      const b = document.createElement('button');
      b.textContent = text;
      b.onclick = () => { fn(); SS.pushHistory('Stickerformat'); SS.ui.showProps(); SS.requestRender(); };
      reihe.appendChild(b);
    };
    knopf('Eigenes Format', () => {
      const alt = SS.stickerGroesse(sel);
      sel.scaleX = 1; sel.scaleY = 1;
      sel.s = clamp(alt.h, 12, 4000);
    });
    knopf('Über die Slide', () => {
      const { slideW } = SS.canvasSize();
      const alt = SS.stickerGroesse(sel);
      SS.setzeStickerGroesse(sel, slideW, alt.h);
    });
    body.appendChild(reihe);

    const p = document.createElement('p');
    p.className = 'hint';
    p.textContent = 'Breite und Höhe frei – so passt ein Sticker über jedes Foto- und '
      + 'Videoformat. Mit der Kette bleibt das Verhältnis erhalten.';
    body.appendChild(p);
  }

  const origProps = SS.ui.showProps;
  if (origProps) {
    SS.ui.showProps = function () {
      const r = origProps.apply(this, arguments);
      try {
        const sel = SS.getSel();
        if (istSticker(sel) && SS.selCount() === 1) {
          const body = $('propsBody');
          if (body && !body.querySelector('[data-stickerfrei]')) {
            const marke = document.createElement('div');
            marke.setAttribute('data-stickerfrei', '1');
            body.appendChild(marke);
            groessenAbschnitt(sel, body);
          }
        }
      } catch (e) {}
      return r;
    };
  }

  /* ==================================================================
     Ziehen: die Seitenverhältnis-Sperre gilt für Sticker nicht mehr
     ==================================================================
     interact.js liest beim Ziehen an einem Kantengriff `SS.arLock`. Steht
     die Sperre, wird jede Kante gleichmäßig skaliert – ein Sticker ließ sich
     also nur mit Shift verzerren. Für Sticker wird die Sperre jetzt beim
     Zeigerdruck aufgehoben und danach wiederhergestellt, damit sie für
     Fotos und Texte unverändert weitergilt.

     Zusätzlich wandert eine reine Höhenänderung anschließend zurück in
     `el.s`, damit der Zahlenwert „Höhe" ehrlich bleibt. */
  const canvas = $('canvas');
  if (canvas) {
    let gemerkt = null;

    canvas.addEventListener('pointerdown', () => {
      const sel = SS.getSel();
      if (istSticker(sel) && SS.selCount() === 1 && !sel.locked) {
        gemerkt = SS.arLock;
        SS.arLock = false;
      }
    }, true);

    canvas.addEventListener('pointerup', () => {
      if (gemerkt !== null) { SS.arLock = gemerkt; gemerkt = null; }
      let geaendert = false;
      for (const el of (SS.getSelAll && SS.getSelAll()) || []) {
        if (!istSticker(el)) continue;
        const sy = el.scaleY || 1;
        if (Math.abs(sy - 1) < 0.004) continue;
        const g = SS.stickerGroesse(el);
        SS.setzeStickerGroesse(el, g.w, g.h);      // Höhe zurück in el.s
        if (SS.invalidateEl) SS.invalidateEl(el);
        geaendert = true;
      }
      if (geaendert) {
        SS.requestRender();
        if (SS.ui.showProps) SS.ui.showProps();
      }
    });
  }

  SS.STICKERFREI79 = { bereit: true, version: '7.9.0' };
})();
