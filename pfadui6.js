/* Seamless Studio 6.0 – Bedienung des Pfadtexts
   ============================================================================
   Knopf im Text-Panel, Formenwahl mit Vorschaukacheln, Eigenschaften und der
   Punkt-Modus zum Ziehen eines eigenen Verlaufs auf der Leinwand.
   ========================================================================= */

(function () {
  const $ = SS.el;
  const PI = Math.PI;

  /* ---------------- Vorschau einer Pfadform ---------------- */
  function formVorschau(formId, w, h) {
    const cv = SS.makeCanvas(w, h);
    const c = cv.getContext('2d');
    c.fillStyle = '#efe6dc'; c.fillRect(0, 0, w, h);
    // virtuelle Leinwand
    const k = { W: 1080 * 3, H: 1350, slideW: 1080, n: 3 };
    const sc = Math.min(w / k.W, h / k.H) * 0.92;
    const ox = w / 2, oy = h / 2;
    const el = { pfad: formId, x: k.W / 2, y: k.H / 2, amp: 100, freq: 1.5, spanne: 0.9 };
    if (formId === 'frei') el.punkte = SS.pfadStandardPunkte(k);
    c.save();
    c.translate(ox, oy); c.scale(sc, sc); c.translate(-k.W / 2, -k.H / 2);
    c.strokeStyle = 'rgba(200,85,61,.30)'; c.lineWidth = 3 / sc;
    c.setLineDash([16 / sc, 14 / sc]);
    for (let i = 1; i < 3; i++) { c.beginPath(); c.moveTo(i * k.slideW, 0); c.lineTo(i * k.slideW, k.H); c.stroke(); }
    c.setLineDash([]);
    // Pfad
    c.strokeStyle = 'rgba(120,95,80,.35)'; c.lineWidth = 5 / sc;
    c.beginPath();
    for (let i = 0; i <= 120; i++) {
      const p = SS.pfadPunkt(el, i / 120, k);
      i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y);
    }
    c.stroke();
    // Buchstaben als Punkte andeuten
    c.fillStyle = '#4a3d36';
    for (let i = 0; i <= 26; i++) {
      const p = SS.pfadPunkt(el, 0.05 + (i / 26) * 0.9, k);
      c.beginPath(); c.arc(p.x, p.y, 26 / sc, 0, PI * 2); c.fill();
    }
    c.restore();
    return cv;
  }

  /* ---------------- Knopf und Formengitter im Text-Panel ---------------- */
  function bauen() {
    const panel = document.getElementById('panel-text');
    if (!panel || document.getElementById('pfadGrid')) return;

    const h = document.createElement('h3');
    h.innerHTML = 'Pfadtext <small>(läuft durch das ganze Panorama)</small>';

    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.textContent = 'Schrift, die einem Verlauf folgt – quer über alle Slides. Form antippen, ' +
      'dann Text überschreiben. Bei „Eigener Pfad" ziehst du die Punkte direkt auf der Leinwand.';

    const g = document.createElement('div');
    g.id = 'pfadGrid';
    g.className = 'grid tpl-grid';

    SS.PFAD_FORMEN.forEach(f => {
      const sw = document.createElement('button');
      sw.className = 'swatch';
      sw.title = f.hint;
      sw.appendChild(formVorschau(f.id, 200, 160));
      const lb = document.createElement('label');
      lb.textContent = f.name;
      sw.appendChild(lb);
      sw.onclick = () => {
        const sel = SS.getSel();
        if (sel && sel.type === 'pathtext') {
          sel.pfad = f.id;
          if (f.id === 'frei' && (!sel.punkte || !sel.punkte.length)) sel.punkte = SS.pfadStandardPunkte(SS.canvasSize());
          SS.pfadEdit = f.id === 'frei' ? sel.id : null;
          SS.pushHistory('Pfadform: ' + f.name);
          SS.ui.showProps(); SS.requestRender();
        } else {
          const el = SS.ui.addPfadText(f.id);
          if (f.id === 'frei') SS.pfadEdit = el.id;
          SS.requestRender();
        }
      };
      g.appendChild(sw);
    });

    // vor „Schriften" einhängen
    const anker = [...panel.querySelectorAll('h3')].find(x => /Schriften/.test(x.textContent));
    if (anker) {
      panel.insertBefore(h, anker);
      panel.insertBefore(hint, anker);
      panel.insertBefore(g, anker);
    } else {
      panel.appendChild(h); panel.appendChild(hint); panel.appendChild(g);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bauen);
  else bauen();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(bauen);

  /* ================================================================
     Eigenschaften – hängt sich an showProps an
     ================================================================ */
  const zeigeAlt = SS.ui.showProps;
  SS.ui.showProps = function () {
    zeigeAlt.apply(SS.ui, arguments);
    const sel = SS.getSel();
    if (!sel || sel.type !== 'pathtext') { if (SS.pfadEdit) { SS.pfadEdit = null; SS.requestRender(); } return; }
    if (SS.getSelAll().length > 1) return;

    const t = document.getElementById('propsTitle');
    if (t) t.textContent = 'Pfadtext';
    const body = document.getElementById('propsBody');
    if (!body) return;

    const h4 = (s) => { const e = document.createElement('h4'); e.textContent = s; return e; };
    const reihe = (label) => { const d = document.createElement('div'); d.className = 'ctl';
      const s = document.createElement('span'); s.textContent = label; d.appendChild(s); return d; };
    const regler = (label, val, min, max, step, fn, fmt) => {
      const d = reihe(label);
      const r = document.createElement('input');
      r.type = 'range'; r.min = min; r.max = max; r.step = step; r.value = val;
      const v = document.createElement('span'); v.className = 'val';
      v.textContent = fmt ? fmt(val) : val;
      r.addEventListener('input', () => { v.textContent = fmt ? fmt(+r.value) : r.value; fn(+r.value); SS.requestRender(); });
      r.addEventListener('change', () => SS.pushHistory('Pfadtext'));
      d.appendChild(r); d.appendChild(v);
      return d;
    };
    const knopf = (txt, fn, klasse) => {
      const b = document.createElement('button');
      b.className = klasse || 'wide';
      b.textContent = txt; b.onclick = fn; return b;
    };
    const schalter = (label, an, fn) => {
      const d = reihe(label);
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!an;
      cb.onchange = () => { fn(cb.checked); SS.pushHistory('Pfadtext'); SS.ui.showProps(); SS.requestRender(); };
      d.appendChild(cb); return d;
    };

    // ---- Text
    body.appendChild(h4('Text'));
    const ta = document.createElement('textarea');
    ta.rows = 2; ta.value = sel.content || '';
    ta.oninput = () => { sel.content = ta.value; SS.requestRender(); };
    ta.onchange = () => SS.pushHistory('Text geändert');
    body.appendChild(ta);

    // ---- Form
    body.appendChild(h4('Form des Pfads'));
    const chips = document.createElement('div'); chips.className = 'chips';
    SS.PFAD_FORMEN.forEach(f => {
      const b = document.createElement('button');
      b.textContent = f.name;
      if (f.id === sel.pfad) b.classList.add('sel');
      b.onclick = () => {
        sel.pfad = f.id;
        if (f.id === 'frei' && (!sel.punkte || !sel.punkte.length)) sel.punkte = SS.pfadStandardPunkte(SS.canvasSize());
        SS.pfadEdit = f.id === 'frei' ? sel.id : null;
        SS.pushHistory('Pfadform'); SS.ui.showProps(); SS.requestRender();
      };
      chips.appendChild(b);
    });
    body.appendChild(chips);

    if (sel.pfad === 'frei') {
      const an = SS.pfadEdit === sel.id;
      body.appendChild(knopf(an ? '✓ Punkte werden angezeigt – tippen zum Ausblenden' : 'Punkte auf der Leinwand zeigen',
        () => { SS.pfadEdit = an ? null : sel.id; SS.ui.showProps(); SS.requestRender(); }));
      const zeile = document.createElement('div'); zeile.className = 'chips';
      zeile.appendChild(knopf('＋ Punkt', () => {
        const p = sel.punkte;
        const i = Math.max(1, Math.floor(p.length / 2));
        p.splice(i, 0, { x: (p[i - 1].x + p[i].x) / 2, y: (p[i - 1].y + p[i].y) / 2 });
        SS.pfadEdit = sel.id;
        SS.pushHistory('Punkt hinzugefügt'); SS.ui.showProps(); SS.requestRender();
      }, ''));
      zeile.appendChild(knopf('− Punkt', () => {
        if (sel.punkte.length <= 2) return SS.toast('Zwei Punkte braucht der Pfad mindestens', 2400, 'warn');
        sel.punkte.splice(Math.floor(sel.punkte.length / 2), 1);
        SS.pushHistory('Punkt entfernt'); SS.ui.showProps(); SS.requestRender();
      }, ''));
      zeile.appendChild(knopf('Zurücksetzen', () => {
        sel.punkte = SS.pfadStandardPunkte(SS.canvasSize());
        SS.pushHistory('Pfad zurückgesetzt'); SS.requestRender();
      }, ''));
      body.appendChild(zeile);
      const hh = document.createElement('p'); hh.className = 'hint';
      hh.textContent = 'Die nummerierten Punkte lassen sich direkt auf der Leinwand ziehen.';
      body.appendChild(hh);
    } else {
      body.appendChild(regler('Ausschlag', sel.amp === undefined ? 100 : sel.amp, 0, 220, 5,
        v => { sel.amp = v; }, v => v + ' %'));
      if (sel.pfad === 'welle' || sel.pfad === 'zickzack') {
        body.appendChild(regler('Wellen', sel.freq === undefined ? 1.5 : sel.freq, 0.5, 6, 0.25,
          v => { sel.freq = v; }, v => v.toFixed(2).replace('.', ',')));
      }
      body.appendChild(regler('Breite', Math.round((sel.spanne === undefined ? 0.9 : sel.spanne) * 100), 20, 100, 1,
        v => { sel.spanne = v / 100; }, v => v + ' %'));
    }

    // ---- Lage auf dem Pfad
    body.appendChild(h4('Lage auf dem Pfad'));
    body.appendChild(regler('Anfang', Math.round((sel.start || 0) * 100), 0, 90, 1,
      v => { sel.start = v / 100; if (sel.start >= (sel.ende === undefined ? 1 : sel.ende)) sel.ende = Math.min(1, sel.start + 0.1); },
      v => v + ' %'));
    body.appendChild(regler('Ende', Math.round((sel.ende === undefined ? 1 : sel.ende) * 100), 10, 100, 1,
      v => { sel.ende = v / 100; if (sel.ende <= (sel.start || 0)) sel.start = Math.max(0, sel.ende - 0.1); },
      v => v + ' %'));
    body.appendChild(regler('Abstand zur Linie', sel.versatz || 0, -200, 200, 2,
      v => { sel.versatz = v; }, v => v + ' px'));
    body.appendChild(schalter('Über die ganze Länge verteilen', sel.strecken !== false, v => { sel.strecken = v; }));
    body.appendChild(schalter('Am Pfad ausrichten', sel.aufPfad !== false, v => { sel.aufPfad = v; }));
    body.appendChild(schalter('Auf die andere Seite', !!sel.unten, v => { sel.unten = v; }));

    const ausr = document.createElement('div'); ausr.className = 'chips';
    [['left', 'Am Anfang'], ['center', 'Mittig'], ['right', 'Am Ende']].forEach(([id, nm]) => {
      const b = document.createElement('button');
      b.textContent = nm;
      if ((sel.align || 'center') === id) b.classList.add('sel');
      b.onclick = () => { sel.align = id; SS.pushHistory('Ausrichtung'); SS.ui.showProps(); SS.requestRender(); };
      ausr.appendChild(b);
    });
    body.appendChild(ausr);

    // ---- Schrift
    body.appendChild(h4('Schrift'));
    const fs = document.createElement('select');
    (SS.FONT_GROUPS || []).forEach(gr => {
      const og = document.createElement('optgroup'); og.label = gr.name;
      gr.fonts.forEach(f => {
        const o = document.createElement('option'); o.value = f; o.textContent = f;
        if (f === sel.font) o.selected = true;
        og.appendChild(o);
      });
      fs.appendChild(og);
    });
    fs.onchange = () => { sel.font = fs.value; SS.pushHistory('Schrift'); SS.requestRender(); };
    const fr = reihe('Schriftart'); fr.appendChild(fs); body.appendChild(fr);

    body.appendChild(regler('Größe', sel.size, 16, Math.round(SS.canvasSize().H * 0.3), 1,
      v => { sel.size = v; }));
    body.appendChild(regler('Laufweite', sel.letterSpacing || 0, -10, 60, 1,
      v => { sel.letterSpacing = v; }));

    const cr = reihe('Farbe');
    const ci = document.createElement('input'); ci.type = 'color'; ci.value = sel.color || '#3a2f28';
    ci.oninput = () => { sel.color = ci.value; SS.requestRender(); };
    ci.onchange = () => SS.pushHistory('Farbe');
    cr.appendChild(ci); body.appendChild(cr);

    const stil = document.createElement('div'); stil.className = 'chips';
    [['bold', 'Fett'], ['italic', 'Kursiv'], ['outline', 'Kontur'], ['hollow', 'Nur Kontur'],
     ['shadow', 'Schatten'], ['glow', 'Leuchten']].forEach(([f, nm]) => {
      const b = document.createElement('button');
      b.textContent = nm;
      if (sel[f]) b.classList.add('sel');
      b.onclick = () => { sel[f] = !sel[f]; if (f === 'hollow' && sel[f]) sel.outline = true;
        SS.pushHistory('Textstil'); SS.ui.showProps(); SS.requestRender(); };
      stil.appendChild(b);
    });
    body.appendChild(stil);
    if (sel.outline || sel.hollow) {
      const or_ = reihe('Konturfarbe');
      const oi = document.createElement('input'); oi.type = 'color'; oi.value = sel.outlineColor || '#ffffff';
      oi.oninput = () => { sel.outlineColor = oi.value; SS.requestRender(); };
      or_.appendChild(oi); body.appendChild(or_);
      body.appendChild(regler('Konturbreite', sel.outlineWidth || 6, 1, 24, 1, v => { sel.outlineWidth = v; }));
    }
    if (sel.glow) {
      const gr_ = reihe('Leuchtfarbe');
      const gi = document.createElement('input'); gi.type = 'color'; gi.value = sel.glowColor || '#ffd9a0';
      gi.oninput = () => { sel.glowColor = gi.value; SS.requestRender(); };
      gr_.appendChild(gi); body.appendChild(gr_);
    }

    // ---- Buchstaben-Animationen
    body.appendChild(h4('Animation der Buchstaben'));
    const aus = document.createElement('button');
    aus.className = 'wide anim-off' + ((sel.anim || 'none') === 'none' ? ' sel' : '');
    aus.textContent = (sel.anim || 'none') === 'none' ? '✓ Keine Animation' : '✕ Animation entfernen';
    aus.onclick = () => { sel.anim = 'none'; SS.pushHistory(); SS.ui.showProps(); SS.requestRender(); };
    body.appendChild(aus);

    const gitter = document.createElement('div'); gitter.className = 'anim-grid';
    SS.ANIMS.filter(a => a.perChar).forEach(a => {
      const b = document.createElement('button');
      b.className = 'anim-kachel' + (a.id === sel.anim ? ' sel' : '');
      b.title = a.desc || '';
      const cv = document.createElement('canvas');
      cv.width = 108; cv.height = 108;
      cv.dataset.anim = a.id; cv.dataset.typ = 'text';
      b.appendChild(cv);
      const lb = document.createElement('span'); lb.textContent = a.name; b.appendChild(lb);
      b.onclick = () => { sel.anim = a.id; SS.pushHistory(); SS.ui.showProps(); SS.requestRender(); };
      gitter.appendChild(b);
    });
    body.appendChild(gitter);
    SS.animPreviewStart && SS.animPreviewStart(gitter);

    if ((sel.anim || 'none') !== 'none') {
      body.appendChild(regler('Tempo', sel.animSpeed === undefined ? 1 : sel.animSpeed, 0.2, 3, 0.1,
        v => { sel.animSpeed = v; }, v => v.toFixed(1).replace('.', ',') + '×'));
      body.appendChild(regler('Stärke', sel.animAmp === undefined ? 100 : sel.animAmp, 10, 200, 5,
        v => { sel.animAmp = v; }, v => v + ' %'));
    }
  };
})();
