/* Seamless Studio – Rahmen für Video-Clips (v7.7)
   ============================================================================
   Ein Clip lag bisher nackt auf der Leinwand: rechteckig, höchstens runde
   Ecken und eine dünne Linie. Alle 50 Rahmen – Polaroid, Filmstreifen,
   Retro-TV, Digicam, Herz, Briefmarke … – gab es nur für Fotos, weil sie über
   `SS.buildCard` entstehen und `SS.drawVideoEl` diesen Weg gar nicht ging.

   Hier bekommt ein Clip dieselben Rahmen wie ein Foto:

     · das laufende Videobild wird formatfüllend in eine Fläche gelegt,
     · diese Fläche geht durch `SS.buildCard` – also durch genau dieselbe
       Rahmenwerkstatt wie jedes Foto,
     · die fertige Karte wird in die Fläche des Clips eingepasst. Der Clip
       bleibt damit genau so groß, wie er auf der Leinwand steht; der Rahmen
       wächst nicht über seine Griffe hinaus, Auswahl und Ziehen bleiben
       unverändert.

   Gebaut wird je Bild neu – das Videobild ändert sich ja auch je Bild.
   Nachgemessen kostet das je nach Rahmen 0,01 bis 4,2 ms (der teuerste ist
   die Retro-Kamera). Bei einem Videobild alle 33 ms ist das tragbar; der
   Bild-Export ist ohnehin nicht in Eile.

   Weil `SS.drawVideoEl` von der Leinwand, vom Bild-Export, vom Video-Export
   und von den Ebenen-Vorschaubildern benutzt wird, gilt der Rahmen überall
   gleich – auch in den Slide-Videos aus `videoslides77.js`.
   ========================================================================= */

(function () {
  if (typeof SS.drawVideoEl !== 'function' || typeof SS.buildCard !== 'function') return;
  if (!SS.FRAMES || !SS.defaultFrame) return;
  const $ = (id) => document.getElementById(id);

  const origDrawVideo = SS.drawVideoEl;
  const puffer = document.createElement('canvas');   // einer für alle, wiederverwendet

  const hatRahmen = (el) => !!(el && el.frame && el.frame.style && el.frame.style !== 'none');

  SS.drawVideoEl = function (c, el) {
    if (!hatRahmen(el)) return origDrawVideo.call(SS, c, el);

    const w = Math.max(2, el.w * (el.scaleX || 1));
    const h = Math.max(2, el.h * (el.scaleY || 1));

    /* Auflösung an das anpassen, was am Ziel wirklich ankommt: auf der
       Leinwand bei 27 % Zoom braucht niemand 1 400 px, im Export schon.
       Der Maßstab steckt in der Abbildungsmatrix des Kontexts. Ohne diesen
       Schritt kostete ein Bild gemessen 21 ms – mit ihm ein Bruchteil. */
    const m = c.getTransform ? c.getTransform() : null;
    const mass = m ? Math.hypot(m.a, m.b) || 1 : 1;
    const noetig = Math.max(64, Math.min(1400, Math.max(w, h) * mass));
    const k = Math.min(1, noetig / Math.max(w, h));
    const iw = Math.max(2, Math.round(w * k));
    const ih = Math.max(2, Math.round(h * k));
    if (puffer.width !== iw) puffer.width = iw;
    if (puffer.height !== ih) puffer.height = ih;
    const pc = puffer.getContext('2d');
    pc.clearRect(0, 0, iw, ih);

    const rec = SS.videos && SS.videos[el.vidId];
    const v = rec && rec.el;
    if (v && v.readyState >= 2) {
      const vw = v.videoWidth || rec.w || 16, vh = v.videoHeight || rec.h || 9;
      const s = Math.max(iw / vw, ih / vh);          // formatfüllend, nicht verzerrt
      pc.drawImage(v, (iw - vw * s) / 2, (ih - vh * s) / 2, vw * s, vh * s);
    } else {
      pc.fillStyle = '#241F1B';
      pc.fillRect(0, 0, iw, ih);
      pc.fillStyle = '#8A8078';
      pc.font = `${Math.round(ih * 0.09)}px Poppins, sans-serif`;
      pc.textAlign = 'center'; pc.textBaseline = 'middle';
      pc.fillText('Clip', iw / 2, ih / 2);
    }

    let karte;
    try { karte = SS.buildCard(el, puffer, ih); } catch (e) { return origDrawVideo.call(SS, c, el); }
    if (!karte || !karte.width) return origDrawVideo.call(SS, c, el);

    /* Karte in die Fläche des Clips einpassen – der Rahmen legt sich also
       nach innen, statt das Element wachsen zu lassen. */
    const kw = karte.width / k, kh = karte.height / k;
    const s2 = Math.min(w / kw, h / kh);
    const dw = kw * s2, dh = kh * s2;

    c.save();
    c.translate(el.x, el.y);
    c.rotate(SS.deg2rad(el.rot || 0));
    c.globalAlpha = el.opacity ?? 1;
    const sch = el.frame.shadow || 0;
    if (sch > 0) {
      c.shadowColor = `rgba(45,28,20,${sch / 130})`;
      c.shadowBlur = 16 + sch * 0.35;
      c.shadowOffsetX = 6; c.shadowOffsetY = 12;
    }
    c.drawImage(karte, -dw / 2, -dh / 2, dw, dh);
    c.restore();
  };

  /* ================================================================
     Bedienung: Rahmen-Abschnitt in den Eigenschaften eines Clips
     ================================================================ */

  function h4(text) {
    const e = document.createElement('h4');
    e.textContent = text;
    return e;
  }

  function regler(body, label, wert, min, max, schritt, beim, fertig) {
    const d = document.createElement('div'); d.className = 'ctl';
    const s = document.createElement('span'); s.textContent = label;
    const r = document.createElement('input');
    r.type = 'range'; r.min = min; r.max = max; r.step = schritt; r.value = wert;
    const v = document.createElement('span'); v.className = 'val'; v.textContent = wert;
    r.addEventListener('input', () => { v.textContent = r.value; beim(+r.value); });
    r.addEventListener('change', () => fertig && fertig(+r.value));
    d.appendChild(s); d.appendChild(r); d.appendChild(v);
    body.appendChild(d);
  }

  function rahmenAbschnitt(sel, body) {
    if (!sel.frame) sel.frame = Object.assign(SS.defaultFrame(), { style: 'none' });

    body.appendChild(h4('Rahmen'));
    const box = document.createElement('div');
    box.className = 'chips';
    SS.FRAMES.forEach((f) => {
      const id = f.id || f;
      const b = document.createElement('button');
      b.textContent = f.name || id;
      if (sel.frame.style === id) b.classList.add('sel');
      b.onclick = () => {
        sel.frame.style = id;
        [...box.children].forEach(x => x.classList.remove('sel'));
        b.classList.add('sel');
        SS.invalidateEl && SS.invalidateEl(sel);
        SS.pushHistory('Clip-Rahmen');
        SS.requestRender();
      };
      box.appendChild(b);
    });
    body.appendChild(box);

    const live = () => { SS.invalidateEl && SS.invalidateEl(sel); SS.requestRender(); };
    regler(body, 'Randbreite', sel.frame.border ?? 26, 0, 80, 1,
      v => { sel.frame.border = v; live(); }, () => SS.pushHistory('Clip-Rahmen'));

    const zeile = document.createElement('div'); zeile.className = 'ctl';
    const t = document.createElement('span'); t.textContent = 'Randfarbe';
    const cp = document.createElement('input');
    cp.type = 'color'; cp.value = sel.frame.color || '#fdfbf8';
    cp.addEventListener('input', () => { sel.frame.color = cp.value; live(); });
    cp.addEventListener('change', () => SS.pushHistory('Clip-Rahmen'));
    zeile.appendChild(t); zeile.appendChild(cp);
    body.appendChild(zeile);

    regler(body, 'Schatten', sel.frame.shadow ?? 55, 0, 100, 1,
      v => { sel.frame.shadow = v; SS.requestRender(); }, () => SS.pushHistory('Clip-Rahmen'));
    regler(body, 'Eckenradius', sel.frame.radius ?? 24, 0, 200, 2,
      v => { sel.frame.radius = v; live(); }, () => SS.pushHistory('Clip-Rahmen'));

    const p = document.createElement('p');
    p.className = 'hint';
    p.textContent = 'Dieselben Rahmen wie bei Fotos – der Clip läuft darin weiter, '
      + 'auf der Leinwand und in jedem Export. Der Rahmen legt sich nach innen, '
      + 'der Clip bleibt so groß, wie du ihn gezogen hast.';
    body.appendChild(p);
  }

  const origProps = SS.ui && SS.ui.showProps;
  if (origProps) {
    SS.ui.showProps = function () {
      const r = origProps.apply(this, arguments);
      try {
        const sel = SS.getSel();
        if (sel && sel.type === 'video' && SS.selCount() === 1) {
          const body = $('propsBody');
          if (body && !body.querySelector('[data-clip-rahmen]')) {
            const marke = document.createElement('div');
            marke.setAttribute('data-clip-rahmen', '1');
            body.appendChild(marke);
            rahmenAbschnitt(sel, body);
          }
        }
      } catch (e) {}
      return r;
    };
  }

  SS.VIDEORAHMEN77 = { bereit: true };
})();
