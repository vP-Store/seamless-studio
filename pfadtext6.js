/* Seamless Studio 6.0 – Pfadtext
   ============================================================================
   Schrift, die an einem frei geformten Pfad entlangläuft – über die GESAMTE
   Panoramabreite, quer durch alle Schnittkanten.

   Warum ein eigener Elementtyp:
     Der bisherige Text kann nur auf einem Kreisbogen liegen (`el.curve`), ist
     einzeilig und gehört zu einer Slide – die App warnt sogar, wenn er eine
     Schnittkante berührt. Genau das soll hier passieren.

   Wie die Buchstaben sitzen:
     Der Pfad wird dicht abgetastet und seine Bogenlänge aufsummiert. Jeder
     Buchstabe bekommt seine Position über die *Länge* (nicht über den
     Parameter) – dadurch bleiben die Abstände gleich, egal wie stark der Pfad
     gerade gekrümmt ist. Jeder Buchstabe wird einzeln gesetzt und gedreht;
     deshalb funktionieren alle 32 Buchstaben-Animationen sofort darauf.

   Vorschau und Export benutzen dieselbe Zeichenfunktion.
   ========================================================================= */

(function () {
  const $ = SS.el;
  const S = Math.sin, C = Math.cos, PI = Math.PI;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ================================================================
     Pfadformen
     Jede liefert für u = 0…1 einen Punkt in Leinwand-Koordinaten.
     ================================================================ */
  SS.PFAD_FORMEN = [
    { id: 'welle',     name: 'Welle',      hint: 'Auf und ab durch das ganze Panorama' },
    { id: 'skurve',    name: 'S-Kurve',    hint: 'Ein großer, ruhiger Schwung' },
    { id: 'bogen',     name: 'Bogen',      hint: 'Ein weiter Bogen nach oben' },
    { id: 'taldiag',   name: 'Diagonale',  hint: 'Steigt gleichmäßig an' },
    { id: 'zickzack',  name: 'Zickzack',   hint: 'Kantig hin und her' },
    { id: 'kreis',     name: 'Kreis',      hint: 'Rundherum auf einer Slide' },
    { id: 'gerade',    name: 'Gerade',     hint: 'Einfach quer durch' },
    { id: 'frei',      name: 'Eigener Pfad', hint: 'Punkte auf der Leinwand ziehen' },
  ];

  /* Catmull-Rom durch die Stützpunkte – ergibt einen weichen eigenen Pfad */
  function frei(el, u, k) {
    const p = el.punkte && el.punkte.length >= 2 ? el.punkte : standardPunkte(k);
    const n = p.length;
    const seg = (n - 1) * cl(u, 0, 0.999999);
    const i = Math.floor(seg), t = seg - i;
    const P = (j) => p[cl(j, 0, n - 1)];
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const t2 = t * t, t3 = t2 * t;
    return {
      x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
      y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
    };
  }

  /* Stützpunkte liegen RELATIV zum Anker (el.x, el.y).
     Dadurch verschiebt sich der ganze Pfad mit, wenn man das Element zieht. */
  function standardPunkte(k) {
    const n = 5, out = [];
    const b = k.W * 0.88;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      out.push({ x: -b / 2 + b * u, y: S(u * PI * 1.6) * k.H * 0.18 });
    }
    return out;
  }
  SS.pfadStandardPunkte = standardPunkte;

  /* Punkt auf dem Pfad – alle Formen sind um (el.x, el.y) zentriert */
  function punkt(el, u, k) {
    const amp = (el.amp === undefined ? 100 : el.amp) / 100;
    const frq = el.freq === undefined ? 1.5 : el.freq;
    const cx = el.x === undefined ? k.W / 2 : el.x;
    const cy = el.y === undefined ? k.H / 2 : el.y;
    const b = k.W * (el.spanne === undefined ? 0.90 : el.spanne);
    const x = cx - b / 2 + b * u;
    switch (el.pfad) {
      case 'skurve':
        return { x, y: cy + S(u * PI * 2) * k.H * 0.22 * amp };
      case 'bogen':
        return { x, y: cy + (0.5 - S(u * PI)) * k.H * 0.34 * amp };
      case 'taldiag':
        return { x, y: cy + (u - 0.5) * k.H * 0.52 * amp };
      case 'zickzack': {
        const z = Math.abs(((u * frq * 2) % 2) - 1) * 2 - 1;
        return { x, y: cy + z * k.H * 0.20 * amp };
      }
      case 'kreis': {
        const r = k.H * 0.34 * amp;
        const a = -PI / 2 + u * PI * 2;
        return { x: cx + C(a) * r, y: cy + S(a) * r };
      }
      case 'gerade':
        return { x, y: cy };
      case 'frei': {
        const p = frei(el, u, k);
        return { x: cx + p.x, y: cy + p.y };
      }
      case 'welle':
      default:
        return { x, y: cy + S(u * PI * 2 * frq) * k.H * 0.20 * amp };
    }
  }
  SS.pfadPunkt = punkt;

  /* Bogenlängen-Tabelle: u → Länge. Wird je Zeichenvorgang einmal gebaut. */
  function tabelle(el, k, n) {
    n = n || 260;
    const pts = [], laenge = [0];
    let ges = 0, letzter = punkt(el, 0, k);
    pts.push(letzter);
    for (let i = 1; i <= n; i++) {
      const p = punkt(el, i / n, k);
      ges += Math.hypot(p.x - letzter.x, p.y - letzter.y);
      pts.push(p); laenge.push(ges); letzter = p;
    }
    return { pts, laenge, ges, n };
  }

  /* Position und Richtung an der Bogenlänge s */
  function beiLaenge(tab, s) {
    const L = tab.laenge;
    if (tab.ges <= 0) return { x: tab.pts[0].x, y: tab.pts[0].y, a: 0 };
    const ss = cl(s, 0, tab.ges);
    let lo = 0, hi = L.length - 1;
    while (lo < hi - 1) { const m = (lo + hi) >> 1; if (L[m] <= ss) lo = m; else hi = m; }
    const d = L[hi] - L[lo] || 1;
    const t = (ss - L[lo]) / d;
    const a = tab.pts[lo], b = tab.pts[hi];
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t,
      a: Math.atan2(b.y - a.y, b.x - a.x) };
  }

  /* ================================================================
     Zeichnen
     ================================================================ */
  SS.drawPfadText = function (c, el) {
    const k = SS.canvasSize();
    const txt = String(el.content == null ? '' : el.content);
    if (!txt) return;
    const tab = tabelle(el, k);
    if (tab.ges <= 0) return;

    const zeichen = Array.from(txt.replace(/\n/g, ' '));
    c.save();
    c.globalAlpha = (el.opacity === undefined ? 1 : el.opacity);
    c.font = `${el.italic ? 'italic ' : ''}${el.bold ? '700 ' : '400 '}${el.size}px "${el.font}", serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';

    let ls = el.letterSpacing || 0;
    const br = zeichen.map(z => c.measureText(z).width);
    const roh = br.reduce((a, b) => a + b, 0);

    const von = (el.start === undefined ? 0 : el.start) * tab.ges;
    const bis = (el.ende === undefined ? 1 : el.ende) * tab.ges;
    const strecke = Math.max(1, bis - von);

    /* „Über die ganze Länge verteilen": die Laufweite wird so gedehnt, dass der
       Text den gewählten Abschnitt des Pfads wirklich ausfüllt. Ohne das säße
       ein kurzer Satz als kleiner Klecks in der Mitte eines 5-Slide-Panoramas. */
    if (el.strecken !== false && zeichen.length > 1) {
      const noetig = (strecke - roh) / (zeichen.length - 1);
      ls = Math.max(ls, Math.min(noetig, el.size * 3));
    }
    const gesamt = roh + ls * Math.max(0, zeichen.length - 1);

    let s0;
    const aus = el.align || 'center';
    if (aus === 'left') s0 = von;
    else if (aus === 'right') s0 = bis - gesamt;
    else s0 = von + (strecke - gesamt) / 2;

    // Buchstaben-Animation (dieselbe Bibliothek wie beim normalen Text)
    const def = el.anim && el.anim !== 'none' ? SS.ANIM_BY_ID[el.anim] : null;
    const perChar = def && def.perChar ? def : null;
    const t = SS._noAnim ? 0
      : SS.animT * (el.animSpeed === undefined ? 1 : el.animSpeed) + (el.animPhase || 0);
    const A = (el.animAmp === undefined ? 100 : el.animAmp) / 100;

    let s = s0;
    zeichen.forEach((z, i) => {
      const mitte = s + br[i] / 2;
      const p = beiLaenge(tab, mitte);
      const f = perChar && !SS._noAnim ? (perChar.charFn(i, zeichen.length, t, A, 0) || {}) : {};

      c.save();
      c.translate(p.x, p.y);
      if (el.aufPfad !== false) c.rotate(p.a + (el.unten ? PI : 0));
      c.translate((f.dx || 0) * el.size, (f.dy || 0) * el.size + (el.versatz || 0));
      if (f.rot) c.rotate(f.rot);
      if (f.sx !== undefined || f.sy !== undefined) {
        const sx = f.sx === undefined ? 1 : f.sx, sy = f.sy === undefined ? 1 : f.sy;
        c.scale(Math.abs(sx) < 0.01 ? 0.01 : sx, Math.abs(sy) < 0.01 ? 0.01 : sy);
      }
      if (f.a !== undefined) c.globalAlpha *= cl(f.a, 0, 1);

      const leucht = (el.glow ? 1 : 0) + (f.glow || 0);
      if (leucht > 0.001) {
        c.shadowColor = el.glowColor || el.color || '#ffd9a0';
        c.shadowBlur = el.size * 0.55 * Math.min(1.4, leucht);
      } else if (el.shadow) {
        c.shadowColor = el.shadowColor || 'rgba(30,20,14,.5)';
        c.shadowBlur = el.size * 0.22;
        c.shadowOffsetY = el.size * 0.06;
      }

      if (el.outline) {
        c.lineJoin = 'round';
        c.strokeStyle = el.outlineColor || '#ffffff';
        c.lineWidth = Math.max(1, el.size * (el.outlineWidth || 6) / 100);
        c.strokeText(z, 0, 0);
      }
      if (!el.hollow) {
        c.fillStyle = el.color || '#3a2f28';
        c.fillText(z, 0, 0);
      }
      c.restore();
      s += br[i] + ls;
    });
    c.restore();
  };

  /* Hülle: grob über die abgetastete Kurve plus Schrifthöhe */
  SS.pfadTextBounds = function (el) {
    const k = SS.canvasSize();
    const tab = tabelle(el, k, 90);
    const cx = el.x === undefined ? k.W / 2 : el.x;
    const cy = el.y === undefined ? k.H / 2 : el.y;
    let rx = 0, ry = 0;
    for (const p of tab.pts) {
      rx = Math.max(rx, Math.abs(p.x - cx));
      ry = Math.max(ry, Math.abs(p.y - cy));
    }
    const m = (el.size || 60) * 0.85;
    rx += m; ry += m;
    return { x0: cx - rx, y0: cy - ry, x1: cx + rx, y1: cy + ry };
  };

  /* ================================================================
     In die vorhandene Maschinerie einhängen
     ================================================================ */

  // Größe (für Auswahlrahmen, Griffe, Treffer)
  const elSizeRawAlt = SS.elSizeRaw;
  SS.elSizeRaw = function (el) {
    if (el && el.type === 'pathtext') {
      const b = SS.pfadTextBounds(el);
      return { w: Math.max(20, b.x1 - b.x0), h: Math.max(20, b.y1 - b.y0) };
    }
    return elSizeRawAlt.call(SS, el);
  };

  // Zeichnen: in paintScene und in den Video-Renderer einklinken
  const drawElementAlt = SS.drawElement;
  SS.drawElement = function (c, el) {
    if (el && el.type === 'pathtext') return SS.drawPfadText(c, el);
    return drawElementAlt.call(SS, c, el);
  };

  /* ================================================================
     Anlegen
     ================================================================ */
  SS.ui = SS.ui || {};
  SS.ui.addPfadText = function (form) {
    const k = SS.canvasSize();
    const dunkel = SS.ui.bgIstDunkel ? SS.ui.bgIstDunkel() : false;
    const el = SS.normalizeEl({
      id: SS.uid(), type: 'pathtext',
      content: 'Dein Text läuft hier entlang',
      pfad: form || 'welle',
      punkte: standardPunkte(k),
      x: k.W / 2, y: k.H * 0.5,
      amp: 100, freq: 1.5, start: 0, ende: 1,
      size: Math.round(k.H * 0.075), font: 'Playfair Display',
      color: dunkel ? '#f2e9dc' : '#3a2f28',
      bold: false, italic: false, align: 'center',
      letterSpacing: 2, strecken: true, opacity: 1,
      aufPfad: true, unten: false, versatz: 0,
      outline: false, outlineColor: '#ffffff', outlineWidth: 6,
      shadow: false, glow: false, glowColor: '#ffd9a0', hollow: false,
      rot: 0, anim: 'none', animSpeed: 1, animAmp: 100,
    });
    SS.state.elements.push(el);
    SS.setSel(el.id);
    SS.pushHistory('Pfadtext hinzugefügt');
    SS.ui.refreshLayers && SS.ui.refreshLayers();
    SS.ui.showProps && SS.ui.showProps();
    SS.requestRender();
    SS.toast('Pfadtext eingesetzt – Text unten überschreiben, Form daneben wählen', 3800, 'ok');
    if (window.matchMedia('(max-width: 760px)').matches) {
      const sp = $('sidepanel'); if (sp) sp.classList.remove('open');
    }
    return el;
  };

  /* ================================================================
     Pfad auf der Leinwand bearbeiten
     ================================================================ */
  SS.pfadEdit = null;          // id des Elements, dessen Punkte gerade sichtbar sind

  SS.pfadPunkteVon = function (el) {
    const k = SS.canvasSize();
    if (el.pfad === 'frei') {
      if (!el.punkte || el.punkte.length < 2) el.punkte = standardPunkte(k);
      return el.punkte;
    }
    return null;
  };

  /* Griffe zeichnen – wird von render.js über den Haken aufgerufen */
  SS.drawPfadGriffe = function (c, zoom) {
    const id = SS.pfadEdit;
    if (!id) return;
    const el = SS.state.elements.find(e => e.id === id);
    if (!el || el.type !== 'pathtext') return;
    const k = SS.canvasSize();

    // Pfadlinie
    c.save();
    c.strokeStyle = 'rgba(200,85,61,.75)';
    c.lineWidth = 1.6 / zoom;
    c.setLineDash([7 / zoom, 6 / zoom]);
    c.beginPath();
    for (let i = 0; i <= 160; i++) {
      const p = punkt(el, i / 160, k);
      i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y);
    }
    c.stroke();
    c.setLineDash([]);

    const pts = SS.pfadPunkteVon(el);
    if (pts) {
      const r = 9 / zoom;
      pts.map(q => ({ x: el.x + q.x, y: el.y + q.y })).forEach((p, i) => {
        c.beginPath(); c.arc(p.x, p.y, r, 0, PI * 2);
        c.fillStyle = '#fff'; c.fill();
        c.lineWidth = 2.2 / zoom; c.strokeStyle = '#C8553D'; c.stroke();
        c.fillStyle = '#C8553D';
        c.font = `${11 / zoom}px Poppins, sans-serif`;
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(String(i + 1), p.x, p.y + 0.5 / zoom);
      });
    }
    c.restore();
  };

  /* Treffer auf einen Pfadpunkt (in Weltkoordinaten) */
  SS.pfadGriffTreffer = function (wx, wy, zoom) {
    const id = SS.pfadEdit;
    if (!id) return null;
    const el = SS.state.elements.find(e => e.id === id);
    if (!el) return null;
    const pts = SS.pfadPunkteVon(el);
    if (!pts) return null;
    const r = 16 / zoom;
    for (let i = pts.length - 1; i >= 0; i--) {
      if (Math.hypot(el.x + pts[i].x - wx, el.y + pts[i].y - wy) <= r) return { el, index: i };
    }
    return null;
  };
})();
