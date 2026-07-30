/* Seamless Studio 6.3.1 – Behebungen
   ============================================================================
   Acht Befunde aus dem systematischen Durchtesten von 6.0.0. Diese Datei
   aendert keine bestehende Datei, sondern ersetzt einzelne Funktionen und
   Felder – so wie es in dieser App ueblich ist. Laedt als letztes Skript.

     1. Negativer Rest in vier Buchstaben-Animationen
     2. Zwei Anordnungen schieben Fotos aus der Leinwand
     3. Der Sprung in der Slide-Leiste gleitet nicht
     4. Zehn Animationen ignorieren den Staerkeregler
     5. Zwei „Papier"-Hintergruende haben keine Textur
     6. SS.restore stuerzt bei unvollstaendigem Untertitel ab
     7. Pfadtext laeuft ohne Warnung ueber den Leinwandrand
     8. Neun Sticker sind groesser als ihre Auswahlbox

   Jeder Punkt ist einzeln nachgemessen; die Zahlen stehen im Kommentar.
   ========================================================================= */

(function () {
  const bericht = {};
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ========================================================================
     1. Negativer Rest in Buchstaben-Animationen
     ------------------------------------------------------------------------
     Vier charFn rechnen  (t * tempo − zeichenIndex * versatz) % periode.
     JavaScript behaelt bei `%` das Vorzeichen des linken Operanden. Bei
     kleinem `t` – also genau am Anfang jeder Videoaufnahme, denn der Export
     setzt SS.animT = 0 und zaehlt hoch – wird der Term fuer die hinteren
     Zeichen negativ, und die Formel rechnet damit weiter:

       t-aufblitzen   pow(1 − p/0.14, 2)  ->  glow 66 statt 0…1
                      daraus sx = 1 + 66*0.12 = 8.9
                      Zeichen neunfach gross, ueberlappend, Text unlesbar
       t-bounce-each  16*ph*(0.5 − ph)    ->  dy bis 10.7 Zeichenhoehen
       t-jump         4*ph*(1 − ph)       ->  dy bis 4.2 Zeichenhoehen
       t-umfallen     sin(...)            ->  begrenzt, falsche Richtung

     t-cascade hat dasselbe Muster, wird aber durch ein nachfolgendes clamp
     gerettet und bleibt unberuehrt.

     Gleiche Formel, positiver Rest. Nachgerechnet an 14 120 Faellen je
     Animation bei t >= 8 s: groesste Abweichung 0.
     ==================================================================== */
  (function () {
    if (!SS.ANIM_BY_ID) return;
    const rest = (x, p) => ((x % p) + p) % p;
    const sin = Math.sin, pow = Math.pow;

    const NEU = {
      't-bounce-each': (g, n, t, A) => {
        const ph = rest(t * 2.2 - g * 0.22, 1);
        const h = ph < 0.5 ? 4 * ph * (0.5 - ph) * 4 : 0;
        return { dy: -h * 0.45 * A };
      },
      't-jump': (g, n, t, A) => {
        const ph = rest(t * 1.6 - g * 0.16, 1);
        const h = 4 * ph * (1 - ph);
        return { dy: -h * 0.55 * A, sy: 1 + h * 0.12 * A, sx: 1 - h * 0.06 * A };
      },
      't-aufblitzen': (g, n, t, A) => {
        const p = rest(t * 1.6 - g * 0.16, 1.6) / 1.6;
        const b = p < 0.14 ? pow(1 - p / 0.14, 2) : 0;
        return { glow: b * A, sx: 1 + b * 0.12 * A, sy: 1 + b * 0.12 * A };
      },
      't-umfallen': (g, n, t, A) => {
        const p = rest(t * 0.8 - g * 0.1, 1.8) / 1.8;
        const k = p < 0.5 ? sin(p / 0.5 * Math.PI) : 0;
        return { rot: k * 0.55 * A, dy: k * 0.08 * A };
      },
    };
    const raus = [];
    for (const id in NEU) {
      const def = SS.ANIM_BY_ID[id];
      if (def && typeof def.charFn === 'function') { def.charFn = NEU[id]; raus.push(id); }
    }
    bericht.buchstabenAnimationen = raus;
  })();

  /* ========================================================================
     4. Zehn Animationen ignorieren den Staerkeregler
     ------------------------------------------------------------------------
     Nachgemessen durch SS.animFrame ueber 241 Zeitpunkte: bei fadeinout,
     flip, flip-y und sieben der sechzehn gang-Animationen aendert sich
     nichts, wenn animAmp von 100 auf 300 geht. Ihre Formeln bekommen A,
     benutzen es aber nicht. Betroffen ist damit ausgerechnet die Gruppe,
     die ein Reel traegt.

     Regel fuer die Behebung: die Staerke skaliert immer die ABWEICHUNG vom
     Ruhezustand, nicht den Absolutwert. Bei A = 1 kommt deshalb exakt das
     alte Ergebnis heraus – nachgerechnet, Abweichung 0. Die Deckkraft
     bleibt unberuehrt: ein Element soll nicht durchsichtiger werden, weil
     man die Bewegung kraeftiger stellt.
     ==================================================================== */
  (function () {
    if (!SS.ANIM_BY_ID) return;
    const cos = Math.cos;
    /* Skalierung: Abstand zu 1 mit A strecken, nie unter 2 % einbrechen.
       Fuer alles, was nur schrumpft und waechst. */
    const sA = (s, A) => Math.max(0.02, 1 + (s - 1) * A);
    /* Dasselbe, aber mit Vorzeichen – fuer Kippbewegungen, bei denen der
       negative Bereich die Rueckseite ist. */
    const sFlip = (s, A) => cl(1 + (s - 1) * A, -4, 4);

    const ZYK = 4.2, EIN = 0.62, AUS = 0.62;
    function phase(t) {
      const p = ((t % ZYK) + ZYK) % ZYK;
      if (p < EIN) return { k: p / EIN, raus: false };
      if (p > ZYK - AUS) return { k: 1 - (p - (ZYK - AUS)) / AUS, raus: true };
      return { k: 1, raus: false };
    }
    const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
    const easeOutBack = (x) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
    const easeOutElastic = (x) => {
      if (x <= 0) return 0; if (x >= 1) return 1;
      return Math.pow(2, -9 * x) * Math.sin((x * 10 - 0.75) * (Math.PI * 2 / 3)) + 1;
    };
    const F = (o) => Object.assign({ dx: 0, dy: 0, sx: 1, sy: 1, rot: 0, a: 1, glow: 0 }, o);
    const gang = (bau) => (t, A) => { const ph = phase(t); return F(bau(ph.k, ph.raus, A)); };

    const NEU = {
      'g-zoom': gang((k, raus, A) => {
        const s = sA(0.2 + 0.8 * easeOutCubic(k), A);
        return { sx: s, sy: s, a: cl(k * 1.5, 0, 1) };
      }),
      'g-zoomraus': gang((k, raus, A) => {
        const s = sA(2.4 - 1.4 * easeOutCubic(k), A);
        return { sx: s, sy: s, a: cl(k * 1.4, 0, 1) };
      }),
      'g-pop': gang((k, raus, A) => {
        const s = sA(0.25 + 0.75 * easeOutBack(k), A);
        return { sx: s, sy: s, a: cl(k * 2, 0, 1) };
      }),
      'g-feder': gang((k, raus, A) => {
        const s = sA(0.3 + 0.7 * easeOutElastic(k), A);
        return { sx: s, sy: s, a: cl(k * 2, 0, 1) };
      }),
      'g-kippen': gang((k, raus, A) => ({
        sx: sA(0.02 + 0.98 * easeOutCubic(k), A), a: cl(k * 2.4, 0, 1),
      })),
      'g-jalousie': gang((k, raus, A) => ({
        sy: sA(0.02 + 0.98 * easeOutCubic(k), A), a: cl(k * 2.4, 0, 1),
      })),
      'g-blende': gang((k, raus, A) => ({
        a: easeOutCubic(k), sx: sA(0.94 + 0.06 * k, A), sy: sA(0.94 + 0.06 * k, A),
      })),
      /* Umblaettern und Salto: A steuert, wie tief das Element durchkippt.
         Hier darf NICHT auf einen positiven Mindestwert geklemmt werden –
         der negative Bereich ist beim Kippen die Rueckseite. sFlip haelt
         deshalb das Vorzeichen; applyAnim faengt die Null selbst ab
         (Betragsuntergrenze 0.001 unter Vorzeichenerhalt, anim.js:443).
         Bei A = 1 exakt cos, bei kleinerem A nur ein Anwippen. */
      'flip': (t, A) => F({ sx: sFlip(cos(t * 1.9), A) }),
      'flip-y': (t, A) => F({ sy: sFlip(cos(t * 1.9), A) }),
      /* Ein- und Ausblenden: A steuert, wie dunkel es zwischendurch wird */
      'fadeinout': (t, A) => F({
        a: cl(1 - (1 - (0.12 + 0.88 * (0.5 + 0.5 * Math.sin(t * 1.4)))) * A, 0, 1),
      }),
    };

    const raus = [];
    for (const id in NEU) {
      const def = SS.ANIM_BY_ID[id];
      if (def && typeof def.fn === 'function') { def.fn = NEU[id]; raus.push(id); }
    }
    bericht.staerkeregler = raus;
  })();

  /* ========================================================================
     2. Zwei Anordnungen schieben Fotos aus der Leinwand
     ------------------------------------------------------------------------
     Von den acht „Fertigen Seiten" begrenzen drei den Slide-Index mit
     Math.min(k.n − 1, i), zwei verteilen ueber k.W * (i + 0.5) / N, eine
     wechselt zwischen zwei festen Plaetzen. „zitat" und „angebot" rechnen
     k.slideW * (i + 0.5) ohne Begrenzung: gibt es mehr Fotos als Slides,
     landet Foto n auf einer Slide, die es nicht gibt.

     Gemessen bei 2 Slides und 9 Fotos: 7 von 9 Fotos unsichtbar, ohne
     jede Meldung. Foto 3 lag 724 px, Foto 4 schon 1804 px hinter dem Rand.

     Behebung: dieselbe Begrenzung wie bei den Geschwistern. Ueberzaehlige
     Fotos werden leicht versetzt gestapelt, damit sie einzeln greifbar
     bleiben.
     ==================================================================== */
  (function () {
    if (!SS.LAYOUTS) return;
    const NEU = {
      zitat: (i, N, k) => {
        const sp = Math.min(k.n - 1, i), ueber = Math.max(0, i - (k.n - 1));
        return { x: k.slideW * (sp + 0.5) + ueber * k.slideW * 0.06,
                 y: k.H * 0.30 + ueber * k.H * 0.05, h: k.H * 0.34, rot: i % 2 ? 2 : -2 };
      },
      angebot: (i, N, k) => {
        const sp = Math.min(k.n - 1, i), ueber = Math.max(0, i - (k.n - 1));
        return { x: k.slideW * (sp + 0.5) + ueber * k.slideW * 0.06,
                 y: k.H * 0.38 + ueber * k.H * 0.05, h: k.H * 0.46, rot: 0 };
      },
    };
    const raus = [];
    for (const id in NEU) {
      const def = SS.LAYOUTS.find(l => l.id === id);
      if (def && typeof def.place === 'function') { def.place = NEU[id]; raus.push(id); }
    }
    bericht.anordnungen = raus;
  })();

  /* ========================================================================
     8. Neun Sticker sind groesser als ihre Auswahlbox
     ------------------------------------------------------------------------
     SS.elSizeRaw rechnet fuer Sticker  w = s * def.ar,  h = s.  Bei neun
     Motiven reicht die Tinte darueber hinaus – bis 1.44 x in der Breite und
     1.28 x in der Hoehe. Folge: ein Teil des Stickers ist nicht greifbar,
     und Snapping wie Culling rechnen mit einer zu kleinen Box.

     Die Breite laesst sich ueber `ar` richtigstellen. Fuer die Hoehe fehlte
     bisher jede Moeglichkeit, weil h fest s war – deshalb kommt hier ein
     optionales Feld `hf` (Hoehenfaktor) dazu, und elSizeRaw beachtet es.
     Das Zeichnen bleibt unberuehrt: `s` bedeutet weiterhin dasselbe, alle
     bestehenden Projekte sehen unveraendert aus. Nur die Box passt jetzt.

     Werte aus der Messung an 276 Motiven (Tinte / Box):
       hi-strahl 1.44 breit · sp-kristall5 1.43 · fx-klecks 1.32 ·
       fx-strahl 1.32 breit und 1.28 hoch · bo2-sukkulente 1.18/1.19 ·
       sp-salbei 1.27 hoch · sp-chakren 1.23 · sp-kerze 1.22 · bo-zweig 1.17
     ==================================================================== */
  (function () {
    if (!SS.STICKERS || !SS.elSizeRaw) return;
    const KORREKTUR = {
      'hi-strahl':      { ar: 1.45 },
      'sp-kristall5':   { ar: 1.45 },
      'fx-klecks':      { ar: 1.35, hf: 1.08 },
      'fx-strahl':      { ar: 1.35, hf: 1.30 },
      'bo2-sukkulente': { ar: 1.20, hf: 1.20 },
      'sp-salbei':      { hf: 1.30 },
      'sp-chakren':     { hf: 1.25 },
      'sp-kerze':       { hf: 1.25 },
      'bo-zweig':       { hf: 1.20 },
    };
    const raus = [];
    for (const id in KORREKTUR) {
      const def = SS.STICKERS.find(s => s.id === id);
      if (!def) continue;
      const k = KORREKTUR[id];
      if (k.ar !== undefined) def.ar = k.ar;
      if (k.hf !== undefined) def.hf = k.hf;
      raus.push(id);
    }
    /* elSizeRaw um den Hoehenfaktor erweitern – Wrapper, nicht Ersatz */
    const orig = SS.elSizeRaw;
    SS.elSizeRaw = function (el) {
      if (el && el.type === 'sticker') {
        const def = SS.stickerDef ? SS.stickerDef(el.kind) : null;
        if (def && def.hf) {
          const s = el.s || 100;
          return { w: s * (def.ar || 1), h: s * def.hf };
        }
      }
      return orig.apply(this, arguments);
    };
    bericht.stickerBoxen = raus;
  })();

  /* ========================================================================
     5. Zwei „Papier"-Hintergruende haben keine Textur
     ------------------------------------------------------------------------
     Gemessen bei 540x240 und bei 1080x1350, also skalenunabhaengig:
     tx-papier-0 hat eine Helligkeitsstreuung von 0.14 von 255,
     tx-papier-1 von 0.40. Das ist eine Vollflaeche mit einem Namen.

     Ursache: paintGrain legt sein Rauschen mit globalCompositeOperation
     'overlay' und Alpha 0.09 auf. Overlay laesst Werte um 128 nahezu
     unveraendert und drueckt auf sehr hellen Untergruenden zusaetzlich
     zusammen – bei einem Grundton um 243 bleibt fast nichts uebrig.

     Behebung: Grundton wie bisher, darueber echte Papierfaser – feines
     Korn, ein Hauch Wolke und ganz zarte Fasern, alles mit normalem
     Aufsetzen statt Overlay. Zielstreuung um 4 bis 6: sichtbar als
     Papier, aber ruhig genug fuer Text darauf.
     ==================================================================== */
  (function () {
    if (!SS.BG_LIB) return;

    function mulb(seed) {
      return function () {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }

    function papier(ctx, W, H, grund, seed) {
      ctx.save();
      ctx.fillStyle = grund;
      ctx.fillRect(0, 0, W, H);

      /* feines Korn als gekacheltes Muster, normal aufgesetzt */
      const K = 128;
      const off = document.createElement('canvas');
      off.width = off.height = K;
      const oc = off.getContext('2d');
      const id = oc.createImageData(K, K);
      const rnd = mulb(seed);
      for (let i = 0; i < id.data.length; i += 4) {
        const dunkel = rnd() < 0.5;
        const st = rnd();
        id.data[i] = id.data[i + 1] = id.data[i + 2] = dunkel ? 40 : 255;
        id.data[i + 3] = Math.round(st * st * (dunkel ? 26 : 20));
      }
      oc.putImageData(id, 0, 0);
      const pat = ctx.createPattern(off, 'repeat');
      ctx.globalAlpha = 1;
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, W, H);

      /* ganz zarte Fasern, in beiden Richtungen, unregelmaessig */
      const r2 = mulb(seed + 77);
      ctx.globalAlpha = 0.05;
      ctx.lineWidth = 1;
      for (let i = 0; i < Math.round((W + H) / 14); i++) {
        const waagerecht = r2() < 0.62;
        ctx.strokeStyle = r2() < 0.5 ? 'rgba(120,104,86,1)' : 'rgba(255,255,255,1)';
        const x = r2() * W, y = r2() * H, l = 12 + r2() * 70;
        ctx.beginPath();
        ctx.moveTo(x, y);
        if (waagerecht) ctx.lineTo(x + l, y + (r2() - 0.5) * 2);
        else ctx.lineTo(x + (r2() - 0.5) * 2, y + l);
        ctx.stroke();
      }

      /* sehr weiche Wolke, damit die Flaeche nicht tot wirkt */
      const r3 = mulb(seed + 191);
      ctx.globalAlpha = 0.045;
      for (let i = 0; i < 16; i++) {
        const cx = r3() * W, cy = r3() * H, r = (0.18 + r3() * 0.4) * Math.max(W, H);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        const dunkel = r3() < 0.5;
        g.addColorStop(0, dunkel ? 'rgba(126,110,92,0.7)' : 'rgba(255,255,255,0.8)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
    }

    const GRUND = { 'tx-papier-0': '#f8f4ec', 'tx-papier-1': '#efe4d2' };
    const raus = [];
    let seed = 5;
    for (const id in GRUND) {
      const def = SS.BG_LIB.find(b => b.id === id);
      if (!def) continue;
      const grund = GRUND[id], s = (seed += 37);
      def.paint = (ctx, W, H) => papier(ctx, W, H, grund, s);
      raus.push(id);
    }
    if (raus.length && SS.bgCacheInvalidate) SS.bgCacheInvalidate();
    bericht.hintergruende = raus;
  })();

  /* ========================================================================
     6. SS.restore stuerzt bei unvollstaendigem Untertitel ab
     ------------------------------------------------------------------------
     Das Untertitel-Modell ist {t0, t1, text}. Fehlt eine der Zeiten, ruft
     das Eigenschaftsblatt val.toFixed(1) auf einem undefined auf
     (caption5.js:175) und wirft. Weil restore auch der Undo-Weg ist,
     bleibt die App dann mitten im Wiederherstellen stehen.

     Behebung: vor dem Wiederherstellen aufraeumen – fehlende Zeiten
     ergaenzen, Reihenfolge sicherstellen, kaputte Eintraege verwerfen.
     ==================================================================== */
  (function () {
    const orig = SS.restore;
    if (typeof orig !== 'function') return;
    SS.restore = function (snap) {
      try {
        const d = JSON.parse(snap);
        if (Array.isArray(d.captions)) {
          d.captions = d.captions
            .filter(c => c && typeof c === 'object')
            .map(c => {
              const t0 = Number(c.t0);
              const t1 = Number(c.t1);
              const a = isFinite(t0) ? Math.max(0, t0) : 0;
              const b = isFinite(t1) ? t1 : a + 1.2;
              return { t0: a, t1: Math.max(a + 0.2, b), text: String(c.text == null ? '' : c.text) };
            });
          arguments[0] = snap = JSON.stringify(d);
        }
      } catch (e) { /* kein JSON – dann soll die Basisfassung meckern */ }
      return orig.apply(this, arguments);
    };
    bericht.untertitel = 'restore abgesichert';
  })();

  /* ========================================================================
     7. Pfadtext laeuft ohne Warnung ueber den Leinwandrand
     ------------------------------------------------------------------------
     Bei y = 0.12*H und amp = 100 reicht der Pfad 108 px ueber die
     Oberkante, und 16 % der Zeichen verschwinden (sichtbare Tinte 20 328
     statt 24 317) – stumm, auch im Export.

     Behebung, dreiteilig und ohne dem Nutzer ins Gestalten zu reden:
       · SS.pfadRandUeberlauf(el) sagt, wie viele Pixel oben und unten
         fehlen. Damit kann jeder Aufrufer selbst pruefen.
       · Neue Pfadtexte werden auf eine sichere Hoehe gesetzt.
       · Wer amp oder y so stellt, dass Zeichen wegfallen, bekommt einen
         Hinweis mit einem Knopf, der es zurechtruecken laesst.
     ==================================================================== */
  (function () {
    if (!SS.pfadPunkt) return;

    SS.pfadRandUeberlauf = function (el) {
      if (!el || el.type !== 'pathtext') return null;
      const k = SS.canvasSize();
      let minY = Infinity, maxY = -Infinity;
      for (let u = 0; u <= 1.0001; u += 0.02) {
        const p = SS.pfadPunkt(el, u, k);
        if (!p || !isFinite(p.y)) continue;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
      if (minY === Infinity) return null;
      const luft = (el.size || 60) * 0.6;
      return {
        oben: Math.max(0, Math.round(luft - minY)),
        unten: Math.max(0, Math.round(maxY + luft - k.H)),
        pfadY: [Math.round(minY), Math.round(maxY)],
      };
    };

    /* Bringt den Pfadtext senkrecht so weit ins Bild, wie es geht. */
    SS.pfadRandRichten = function (el) {
      const u = SS.pfadRandUeberlauf(el);
      if (!u) return false;
      if (u.oben > 0) el.y += u.oben;
      else if (u.unten > 0) el.y -= u.unten;
      else return false;
      const n = SS.pfadRandUeberlauf(el);
      /* Passt es senkrecht gar nicht, den Ausschlag zurueckdrehen */
      if (n && (n.oben > 0 || n.unten > 0) && el.amp > 10) {
        const k = SS.canvasSize();
        const hoch = (u.pfadY[1] - u.pfadY[0]) / 2;
        const platz = k.H / 2 - (el.size || 60) * 0.6;
        el.amp = Math.max(10, Math.round(el.amp * cl(platz / Math.max(1, hoch), 0.1, 1)));
        el.y = k.H / 2;
      }
      SS.pushHistory && SS.pushHistory('Pfadtext ins Bild geholt');
      SS.requestRender && SS.requestRender();
      return true;
    };

    /* Neue Pfadtexte sicher setzen */
    if (SS.ui && typeof SS.ui.addPfadText === 'function') {
      const orig = SS.ui.addPfadText;
      SS.ui.addPfadText = function (form) {
        const el = orig.apply(this, arguments);
        if (el && el.type === 'pathtext') {
          const u = SS.pfadRandUeberlauf(el);
          if (u && (u.oben > 0 || u.unten > 0)) {
            if (u.oben > 0) el.y += u.oben;
            else el.y -= u.unten;
            SS.requestRender && SS.requestRender();
          }
        }
        return el;
      };
    }

    /* Hinweis, wenn ein Pfadtext gerade Zeichen verliert. Nur einmal je
       Element, damit es beim Ziehen am Regler nicht dauernd blinkt. */
    let letzte = '';
    SS.pfadRandHinweis = function (el) {
      const u = SS.pfadRandUeberlauf(el);
      if (!u || (u.oben === 0 && u.unten === 0)) { letzte = ''; return; }
      const marke = el.id + '|' + u.oben + '|' + u.unten;
      if (marke === letzte) return;
      letzte = marke;
      const px = Math.max(u.oben, u.unten);
      SS.toast(`Der Pfad läuft ${px} px über den Rand – dort fehlen Zeichen.`,
        5000, 'warn', { label: 'Zurechtrücken', fn: () => SS.pfadRandRichten(el) });
    };

    bericht.pfadRand = 'Pruefung, Richten und Hinweis vorhanden';
  })();

  /* ========================================================================
     10. Sticker verlieren ihre Kategorie, wenn sie nicht ueber das Panel
         angelegt werden – und damit den Privatsphaeren-Schutz
     ------------------------------------------------------------------------
     Ein Look faerbt alle Sticker um und nimmt dabei bewusst die Abdeck-
     Sticker aus:

         if (el.type === 'sticker' && el.cat !== 'privacy') el.color = ...

     `cat` ist aber ein Feld der Sticker-DEFINITION, nicht des Elements. Das
     Sticker-Panel schreibt es beim Anlegen mit (ui.js:567 und ui.js:930),
     `SS.normalizeEl` dagegen nicht. Wer einen Sticker programmatisch anlegt –
     per Konsole, per MCP, aus einem Rezept – bekommt `cat: undefined`, und
     der Schutz greift nicht mehr.

     Nachgemessen mit demselben Motiv `pv-heart` auf beiden Wegen, danach
     Look „Dark Luxury":
        ueber das Panel   cat: 'privacy'   Farbe #e8a9b4 -> #e8a9b4   bleibt
        programmatisch    cat: undefined   Farbe #ff00ff -> #c9a15f   umgefaerbt

     Ein Abdeck-Sticker liegt ueber einem Gesicht oder einer Hausnummer. Dass
     ein Look ihn einfaerbt, ist genau das, was der Code verhindern will.

     Behebung an der Wurzel: normalizeEl traegt die Kategorie aus der
     Definition nach. Damit stimmt es auf allen Wegen, ohne applyLook
     anzufassen – und auch fuer schon bestehende Projekte, weil restore
     normalizeAll aufruft.
     ==================================================================== */
  (function () {
    const orig = SS.normalizeEl;
    if (typeof orig !== 'function') return;
    SS.normalizeEl = function (el) {
      const r = orig.apply(this, arguments);
      const e = r || el;
      if (e && e.type === 'sticker' && !e.cat && e.kind && SS.stickerDef) {
        const def = SS.stickerDef(e.kind);
        if (def && def.cat) e.cat = def.cat;
      }
      return r;
    };
    /* Was schon in der Sitzung liegt, gleich mitnehmen */
    try { SS.normalizeAll && SS.normalizeAll(); } catch (e) {}
    bericht.stickerKategorie = 'wird von normalizeEl nachgetragen';
  })();

  /* ========================================================================
     9. Zuschnitt-Rechteck ohne Grenze
     ------------------------------------------------------------------------
     SS.cropSource legt fuer el.crop.rect ein Canvas in der Groesse des
     Rechtecks an – ohne Abgleich mit der Quelle und ohne die Flaechengrenze,
     die die App sonst ueberall beachtet. Ein Rechteck von 99 999 x 99 999
     verlangt 10 Milliarden Pixel; der Aufruf endet mit „Out of memory" und
     nimmt den Tab mit. Gemessen und reproduziert.

     Der Zuschnitt-Dialog selbst begrenzt ueber clampRect(), der Weg ist also
     nur ueber beschaedigte oder von Hand geschriebene Projektdaten
     erreichbar – aber dann kostet er die ganze Sitzung.

     Behebung: das Rechteck vor dem Zeichnen auf die Quelle begrenzen und,
     falls es dann immer noch zu gross waere, ueber SS.fitScale auf die
     erlaubte Flaeche herunterrechnen. Gueltige Zuschnitte bleiben exakt
     wie sie sind.
     ==================================================================== */
  (function () {
    const orig = SS.cropSource;
    if (typeof orig !== 'function') return;
    SS.cropSource = function (rec, cr) {
      if (cr && cr.rect) {
        const q = orig.call(this, rec, { rot90: cr.rot90 });   // Quelle nach der 90-Drehung
        const qw = q && q.w, qh = q && q.h;
        const r = cr.rect;
        let x = Number(r.x) || 0, y = Number(r.y) || 0;
        let w = Number(r.w) || 0, h = Number(r.h) || 0;
        if (isFinite(qw) && isFinite(qh) && qw > 0 && qh > 0) {
          x = cl(x, 0, qw - 1); y = cl(y, 0, qh - 1);
          w = cl(w, 1, qw - x); h = cl(h, 1, qh - y);
        }
        w = Math.max(8, Math.round(w)); h = Math.max(8, Math.round(h));
        if (SS.areaOk && !SS.areaOk(w, h)) {
          const k = SS.fitScale(w, h, 1);
          w = Math.max(8, Math.round(w * k)); h = Math.max(8, Math.round(h * k));
        }
        if (w !== Math.round(r.w) || h !== Math.round(r.h) ||
            x !== r.x || y !== r.y) {
          cr = Object.assign({}, cr, { rect: { x, y, w, h } });
        }
      }
      return orig.call(this, rec, cr);
    };
    bericht.zuschnitt = 'Rechteck begrenzt';
  })();

  /* ========================================================================
     11. Der obere Teil des Freisteller-Toleranzreglers loescht immer alles
     ------------------------------------------------------------------------
     Die Flutfuellung schuetzt das Motiv mit einer Schranke:

         const far = tol * 2.3;                       // cutout.js:47
         if (colorDist(d, i, br, bg, bb) > far) continue;

     `colorDist` ist eine gewichtete euklidische Distanz mit den Gewichten
     0.30 + 0.59 + 0.11 = 1. Ihr groesstmoeglicher Wert ist damit genau 255
     (Schwarz gegen Weiss). Sobald `tol * 2.3 >= 255` – also ab **tol = 111** –
     kann die Schranke nie mehr greifen: jedes Pixel ist erreichbar, die
     Flut laeuft durch das ganze Bild, und das Motiv ist weg.

     Der Regler in index.html:538 geht bis **130**. Die oberen 15 % sind also
     fuer JEDES Bild garantiert zerstoererisch – nicht bildabhaengig, sondern
     rechnerisch zwangslaeufig.

     Nachgemessen an einem Testbild (Hintergrund 238/236/230, Motiv
     190/110/95, Abstand rund 110):
        tol   0   1,1 % entfernt   Motiv steht
        tol  42  79,9 % entfernt   Motiv steht      <- guter Bereich
        tol  80   100 % entfernt   Motiv weg
        tol 130   100 % entfernt   Motiv weg

     Behebung, zweiteilig und ohne dem Nutzer etwas wegzunehmen:
       · den Regler auf 110 begrenzen – der Bereich darueber kann per
         Definition nichts Sinnvolles liefern
       · wenn die Flut trotzdem praktisch alles frisst, einmal darauf
         hinweisen, statt den Nutzer vor einem leeren Bild sitzen zu lassen
     ==================================================================== */
  (function () {
    const C = SS.cutout;
    if (!C || typeof C.computeBase !== 'function') return;

    /* Rechnerische Obergrenze: darueber ist die Schutzschranke wirkungslos */
    const OBERGRENZE = Math.floor(255 / 2.3);      // = 110

    const regler = document.getElementById('cutTol');
    if (regler) {
      regler.max = String(OBERGRENZE);
      if (+regler.value > OBERGRENZE) regler.value = String(OBERGRENZE);
    }

    let gewarnt = false;
    const orig = C.computeBase;
    C.computeBase = function () {
      const S = C.state;
      if (S && typeof S.tol === 'number' && S.tol > OBERGRENZE) S.tol = OBERGRENZE;
      const r = orig.apply(this, arguments);
      try {
        if (S && S.mask && S.mask.length) {
          let weg = 0;
          for (let i = 0; i < S.mask.length; i++) if (S.mask[i] < 128) weg++;
          const anteil = weg / S.mask.length;
          const mitte = S.mask[((S.h >> 1) * S.w + (S.w >> 1))] < 128;
          if (anteil > 0.98 && mitte && !gewarnt) {
            gewarnt = true;
            SS.toast('Die Toleranz ist zu hoch – es bleibt fast nichts stehen. '
                     + 'Regler zurückziehen oder mit dem Pinsel zurückholen.', 5200, 'warn');
            setTimeout(() => { gewarnt = false; }, 6000);
          }
        }
      } catch (e) {}
      return r;
    };
    bericht.freisteller = 'Toleranz auf ' + OBERGRENZE + ' begrenzt, Hinweis bei Totalverlust';
  })();

  /* ========================================================================
     3. Der Sprung in der Slide-Leiste gleitet nicht
     ------------------------------------------------------------------------
     motion5.js (Position 27) umhuellt SS.ui.gotoSlide fuer den weichen
     Sprung, studio5.js (Position 39, also spaeter) haelt seine gotoSlide
     aber lokal und legt SS.ui.gotoSlide nie an. Der Wrapper prueft
     typeof === 'function' und stuerzt daher nicht ab – er greift nur nie.

     Behebung hier, weil diese Datei nach beiden laedt.
     ==================================================================== */
  (function () {
    const st = SS.state;
    const stage = document.getElementById('stage');
    if (!stage) { bericht.slideLeiste = 'kein #stage'; return; }
    if (SS.ui.gotoSlide) { bericht.slideLeiste = 'schon vorhanden'; return; }

    const ruhig = () => st.perfMode ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    let raf = null;
    function gleiten(zielX, ms) {
      if (raf) cancelAnimationFrame(raf);
      const vonX = st.panX, t0 = performance.now();
      const kurve = (x) => x * x * x * (x * (x * 6 - 15) + 10);   // smootherstep
      (function schritt(now) {
        const p = Math.min(1, (now - t0) / ms);
        st.panX = vonX + (zielX - vonX) * kurve(p);
        SS.render();
        if (p < 1) raf = requestAnimationFrame(schritt);
        else { raf = null; SS.ui.zoomLabel && SS.ui.zoomLabel(); }
      })(t0);
    }

    SS.ui.gotoSlide = function (i) {
      const { slideW, n } = SS.canvasSize();
      const idx = Math.max(0, Math.min(n - 1, i | 0));
      const ziel = stage.clientWidth / 2 - (idx + 0.5) * slideW * st.zoom;
      if (ruhig()) { st.panX = ziel; SS.requestRender(); }
      else gleiten(ziel, 300);
    };

    const strip = document.getElementById('slideStrip');
    if (strip) {
      strip.addEventListener('click', (ev) => {
        const b = ev.target.closest('[data-slide]');
        if (!b) return;
        ev.stopPropagation();
        SS.ui.gotoSlide(+b.getAttribute('data-slide'));
      }, true);
    }
    bericht.slideLeiste = 'nachgetragen';
  })();

  /* ========================================================================
     12. Ein einziges beschaedigtes Element loescht das ganze Panorama

     Gefunden beim Aufbau eines Karussells. Ein Sticker ohne Groessenfeld `s`
     (etwa aus einem von Hand bearbeiteten oder halb geschriebenen Projekt)
     laesst SS.elSizeRaw  {w: NaN, h: undefined}  liefern. Ist `s` negativ,
     wirft der Zeichenweg sogar:

        Failed to execute 'ellipse': The major-axis radius provided is negative

     Diese Ausnahme faellt bis in SS.paintScene durch. Gemessen mit fuenf
     Textelementen, eines je Slide, Kontrast je Slide 205/206/205/205/205:

        Stoerer an erster Stelle    ->  39 / 15 / 11 / 14 / 10   alles weg
        Stoerer an dritter Stelle   -> 205 / 206 / 11 / 14 / 10  ab da weg

     Der Export merkt davon nichts und schreibt leere Slides. Zwei Riegel:

     a) normalizeEl setzt fuer Sticker und Emoji eine brauchbare Groesse,
        wenn `s` fehlt, keine Zahl ist oder <= 0 – dieselben Werte, die
        addSticker vergibt (160, bei Privacy 320).

     b) Die Zeichenaufrufe je Element werden einzeln abgesichert. Faellt
        eines aus, bleibt der Rest der Szene stehen. Wichtig dabei: eine
        Ausnahme mitten im Zeichnen hinterlaesst offene c.save()-Ebenen.
        Ohne Ruecknahme waeren Transformation und Deckkraft fuer alle
        folgenden Elemente verdreht. Deshalb wird die Ebene ueber ein
        Merkmal im Zeichenzustand (miterLimit) wieder abgetragen.
     ==================================================================== */
  (function () {
    /* ---------- a) Groesse nachtragen ---------- */
    const normAlt = SS.normalizeEl;
    if (typeof normAlt === 'function') {
      SS.normalizeEl = function (el) {
        const r = normAlt.apply(this, arguments);
        const e = r || el;
        if (e && (e.type === 'sticker' || e.type === 'emoji')) {
          const s = +e.s;
          if (!isFinite(s) || s <= 0) e.s = e.cat === 'privacy' ? 320 : 160;
        }
        return r;
      };
      try { SS.normalizeAll && SS.normalizeAll(); } catch (e) {}
    }

    /* ---------- b) Zeichnen je Element absichern ---------- */
    const MARKE = 9631.5, ANDERS = 9632.5;
    bericht.malfehler = [];
    const gemeldet = new Set();

    function absichern(name) {
      const alt = SS[name];
      if (typeof alt !== 'function') return false;
      SS[name] = function (c, el) {
        if (!c || typeof c.save !== 'function') return alt.apply(this, arguments);
        const vorher = c.miterLimit;
        c.miterLimit = MARKE;
        c.save();
        c.miterLimit = ANDERS;
        let fehler = null;
        try {
          return alt.apply(this, arguments);
        } catch (e) {
          fehler = e;
        } finally {
          /* offene Ebenen abtragen, bis wieder die eigene erreicht ist */
          let n = 0;
          while (c.miterLimit !== MARKE && n < 64) { c.restore(); n++; }
          if (c.miterLimit === MARKE) c.miterLimit = vorher;
          if (fehler) {
            const schluessel = name + '|' + (el && el.type) + '|' + (el && el.id);
            if (!gemeldet.has(schluessel)) {
              gemeldet.add(schluessel);
              bericht.malfehler.push({ wo: name, typ: el && el.type, id: el && el.id,
                kind: el && el.kind,
                meldung: String((fehler && fehler.message) || fehler).slice(0, 120) });
              if (SS.toast && bericht.malfehler.length <= 3) {
                SS.toast('Ein Element konnte nicht gezeichnet werden – der Rest bleibt erhalten',
                         3200, 'warn');
              }
            }
          }
        }
        return undefined;
      };
      return true;
    }

    /* SS.paintScene verteilt selbst auf die einzelnen Zeichenwege und ruft
       SS.drawElement nicht auf – deshalb werden die Blaetter abgesichert.
       Die Schleife in paintScene klammert jedes Element schon in save/restore;
       hier drin muessen nur die Ebenen abgetragen werden, die das gescheiterte
       Element selbst geoeffnet hat. */
    bericht.malschutz = ['drawTextEl', 'drawStickerEl', 'drawPfadText',
                         'drawVideoEl', 'drawBlurEl', 'drawElement']
      .filter(absichern).join(', ');

    /* Fotos gehen nicht ueber die obigen Wege: paintScene ruft SS.photoCard
       direkt auf und zeichnet die fertige Karte selbst. Faellt der Kartenbau
       aus (etwa weil el.frame beschaedigt ist – buildCard liest f.style
       ungeprueft), reisst es dieselbe Luecke. Ein null-Rueckgabewert ist hier
       schon vorgesehen: paintScene ueberspringt das Foto dann. */
    (function () {
      const alt = SS.photoCard;
      if (typeof alt !== 'function') return;
      const still = new Set();
      SS.photoCard = function (el) {
        try {
          return alt.apply(this, arguments);
        } catch (e) {
          const id = el && el.id;
          if (!still.has(id)) {
            still.add(id);
            bericht.malfehler.push({ wo: 'photoCard', typ: 'photo', id,
              meldung: String((e && e.message) || e).slice(0, 120) });
            if (SS.toast) SS.toast('Ein Foto konnte nicht aufgebaut werden – der Rest bleibt erhalten',
                                   3200, 'warn');
          }
          return null;
        }
      };
      bericht.malschutz += ', photoCard';
    })();
  })();

  /* ========================================================================
     13. Standbild und erstes Videobild fallen auseinander

     SS.animFrame vergibt jedem Element einen automatischen Phasenversatz,
     damit nicht alles im Gleichtakt wackelt:

        const auto = ((el.id || '').split('')
                        .reduce((s, ch) => s + ch.charCodeAt(0), 0) % 17) * 0.13;
        const t = SS.animT * speed + auto + (el.animPhase || 0);

     Das ist gut gedacht, hat aber eine Folge: bei SS.animT = 0 steht die
     Szene NICHT in der Ruhelage. Der Bildexport rechnet dagegen mit
     SS._noAnim = true, also immer in der Ruhelage. Beides zusammen heisst:

        Standbild einer Slide   !=   erstes Bild des Videos derselben Slide

     Nachgemessen an einer Szene mit 13 Elementen, Panorama auf 1350x338
     gerechnet: mittlere Abweichung 0.412, Spitze 149 – sichtbar an jeder
     Sticker-Kante. Fuer ein Karussell ist das genau die falsche Stelle:
     Instagram startet beim Wischen jedes Slide-Video neu, und wer Standbild
     und Video derselben Szene mischt, sieht den Sprung.

     Es waere falsch, den automatischen Versatz zu entfernen – das wuerde
     jedes bestehende Projekt anders aussehen lassen. Stattdessen zwei neue
     Funktionen, die nur wirken, wenn man sie ruft:

        SS.animAutoPhase(el)     liefert den automatischen Versatz
        SS.animAufRuhelage(els)  setzt animPhase so, dass t=0 die Ruhelage ist

     Die Schleifentreue bleibt dabei erhalten, denn ein fester Versatz
     aendert die Periode nicht.
     ==================================================================== */
  (function () {
    SS.animAutoPhase = function (el) {
      return ((el && el.id || '').split('')
        .reduce((s, ch) => s + ch.charCodeAt(0), 0) % 17) * 0.13;
    };

    SS.animAufRuhelage = function (els) {
      const liste = els || (SS.state && SS.state.elements) || [];
      let n = 0;
      for (const el of liste) {
        if (!el || !el.anim || el.anim === 'none') continue;
        el.animPhase = -SS.animAutoPhase(el);
        n++;
      }
      SS.requestRender && SS.requestRender();
      return n;
    };

    /* Gegenprobe: mit ausgeglichener Phase muss animFrame bei t=0 genau das
       liefern, was die Ruhelage zeigt – also nichts. Geprueft wird das an
       einem Wegwerf-Element, damit die Szene unberuehrt bleibt. */
    let beweis = null;
    try {
      const merk = SS.animT, merkN = SS._noAnim;
      SS._noAnim = false; SS.animT = 0;
      const probe = { id: 'zzz-probe', anim: 'sway', animSpeed: 1, animAmp: 100 };
      const ohne = SS.animFrame(probe, 100);
      probe.animPhase = -SS.animAutoPhase(probe);
      const mit = SS.animFrame(probe, 100);
      SS.animT = merk; SS._noAnim = merkN;
      beweis = { ohne_ausgleich: ohne && +(ohne.dx).toFixed(4),
                 mit_ausgleich: mit && +(mit.dx).toFixed(4) };
    } catch (e) {}
    bericht.ruhelage = { funktionen: 'animAutoPhase, animAufRuhelage', beweis };
  })();

  /* ========================================================================
     14. Die Bildrate im Video ist ein Versprechen, keine Zusage

     V.opts.fps steht fest auf 30 und landet nur an einer Stelle:

        const stream = out.captureStream(V.opts.fps);

     Das ist die Obergrenze, die der Leinwand erlaubt wird – nicht das, was
     hinterher in der Datei steht. Aufgenommen wird in Echtzeit ueber
     requestAnimationFrame, und der Kodierer nimmt, was er schafft.

     Nachgemessen an derselben Szene, jeweils 6 Sekunden, 1080x1350:

        eingestellt 30 fps  ->  53 Bilder in 5,830 s  =   9,09 fps
        eingestellt 60 fps  ->  59 Bilder in 5,886 s  =  10,02 fps

     Die Einstellung zu verdoppeln bringt also fast nichts. Der Engpass ist
     nicht das Zeichnen – V.drawFrame kostet hier 9,5 ms, das reichte fuer
     105 fps – sondern der Kodierer: ohne Hardware-Unterstuetzung faellt
     MediaRecorder auf VP9 in Software zurueck, und der schafft bei dieser
     Groesse rund 10 Bilder je Sekunde. Auf einem Geraet mit Hardware-H.264
     sieht das ganz anders aus.

     Das eigentliche Problem ist nicht die Zahl, sondern dass niemand sie
     erfaehrt: die Datei kommt heraus, sieht ruckelig aus, und die App sagt
     nichts. Deshalb zwei Ergaenzungen:

     a) Die Bildrate wird im Exportfenster waehlbar (24 / 30 / 50 / 60).
     b) Nach jedem Videoexport wird die tatsaechlich gelieferte Bildrate
        gemessen – der fertige Film wird dafuer in einem verborgenen
        <video> im Schnelldurchlauf abgespielt und ueber
        requestVideoFrameCallback jedes Bild gezaehlt. Bleibt das Ergebnis
        deutlich unter dem Gewuenschten, sagt ein Hinweis, woran es liegt.
     ==================================================================== */
  (function () {
    const V = SS.video;
    if (!V || typeof V.exportVideo !== 'function') { bericht.bildrate = 'kein Videoexport'; return; }

    /* ---------- a) Bildrate im Exportfenster waehlbar ---------- */
    const FPS = [24, 30, 50, 60];
    function reiheBauen() {
      const box = SS.el('expVidOpts');
      if (!box || SS.el('expVidFps')) return false;
      const zeile = document.createElement('div');
      zeile.className = 'ctl';
      const label = document.createElement('span');
      label.textContent = 'Bildrate';
      const sel = document.createElement('select');
      sel.id = 'expVidFps';
      for (const f of FPS) {
        const o = document.createElement('option');
        o.value = String(f);
        o.textContent = f + ' Bilder/s' + (f === 30 ? ' (Standard)' : f >= 50 ? ' – fuer schnelle Bewegung' : ' – Kinolook');
        if (f === (V.opts.fps || 30)) o.selected = true;
        sel.appendChild(o);
      }
      sel.addEventListener('change', () => { V.opts.fps = +sel.value; });
      zeile.appendChild(label); zeile.appendChild(sel);
      /* vor den Hinweistext, damit die Erklaerung darunter stehen bleibt */
      const hinweis = box.querySelector('p.hint');
      box.insertBefore(zeile, hinweis || null);
      return true;
    }
    let reiheDa = reiheBauen();
    if (!reiheDa) {
      /* Das Fenster wird erst beim ersten Oeffnen vollstaendig aufgebaut */
      const knopf = SS.el('btnExport');
      if (knopf) knopf.addEventListener('click', () => {
        setTimeout(() => { reiheDa = reiheBauen(); }, 60);
      });
    }

    /* ---------- b) gelieferte Bildrate wirklich messen ---------- */
    const MESS_SEK = 2.0;          // so lange wird wirklich abgespielt
    SS.video.bildratenProbe = function (blob, grenzeMs) {
      return new Promise((fertig) => {
        let schonFertig = false;
        let url = null, vid = null, zeit = null;
        const aufraeumen = (erg) => {
          if (schonFertig) return;
          schonFertig = true;
          if (zeit) clearTimeout(zeit);
          try { if (vid) { vid.pause(); vid.removeAttribute('src'); vid.load(); vid.remove(); } } catch (e) {}
          try { if (url) URL.revokeObjectURL(url); } catch (e) {}
          fertig(erg);
        };
        try {
          vid = document.createElement('video');
          if (typeof vid.requestVideoFrameCallback !== 'function') {
            return aufraeumen({ messbar: false, grund: 'requestVideoFrameCallback fehlt' });
          }
          vid.muted = true; vid.playsInline = true;
          vid.style.cssText = 'position:fixed;left:-9999px;width:2px;height:2px;opacity:0';
          url = URL.createObjectURL(blob);
          vid.src = url;
          document.body.appendChild(vid);

          let bilder = 0, ersteZeit = null, letzteZeit = null;
          const naechstes = () => vid.requestVideoFrameCallback((now, meta) => {
            bilder++;
            const mt = meta && meta.mediaTime;
            if (typeof mt === 'number') {
              if (ersteZeit === null) ersteZeit = mt;
              letzteZeit = mt;
            }
            /* Ein kurzes Stueck reicht: die Bildrate ist ueber den Film
               konstant, und der Export soll nicht warten muessen. */
            if (letzteZeit !== null && ersteZeit !== null && letzteZeit - ersteZeit >= MESS_SEK) {
              return auswerten();
            }
            if (!vid.ended) naechstes();
          });

          const auswerten = () => {
            const spanne = (letzteZeit !== null && ersteZeit !== null)
              ? letzteZeit - ersteZeit : (vid.duration || 0);
            aufraeumen({
              messbar: bilder > 1 && spanne > 0.05,
              bilder,
              dauer: +(+spanne).toFixed(3),
              fps: spanne > 0.05 ? +(( bilder - 1) / spanne).toFixed(2) : null,
            });
          };

          vid.addEventListener('ended', auswerten, { once: true });
          vid.addEventListener('loadedmetadata', () => {
            /* In normaler Geschwindigkeit abspielen, aber nur ein kurzes
               Stueck. Ein Schnelldurchlauf waere verlockend, misst aber
               falsch: requestVideoFrameCallback meldet nur DARGESTELLTE
               Bilder, und bei achtfachem Tempo laesst der Compositor welche
               aus. Nachgemessen an derselben Datei: Schnelldurchlauf 3,69,
               normales Tempo 13,03 – ffprobe sagt 13,03. */
            naechstes();
            const p = vid.play();
            if (p && p.catch) p.catch(() => auswerten());
          }, { once: true });

          zeit = setTimeout(auswerten, grenzeMs || (MESS_SEK * 1000 + 2500));
        } catch (e) {
          aufraeumen({ messbar: false, grund: String(e && e.message || e).slice(0, 90) });
        }
      });
    };

    const altExport = V.exportVideo;
    V.exportVideo = async function (onProgress) {
      const gewuenscht = V.opts.fps || 30;
      const res = await altExport.apply(this, arguments);
      try {
        if (res && res.blob && res.blob.size) {
          const probe = await SS.video.bildratenProbe(res.blob);
          bericht.bildrate = { gewuenscht, gemessen: probe };
          if (probe && probe.messbar && probe.fps && probe.fps < gewuenscht * 0.8) {
            SS.toast(`Video mit ${probe.fps} statt ${gewuenscht} Bildern/s – dein Geraet kommt `
              + 'beim Kodieren nicht mit. Kuerzere Dauer oder kleinere Ausgabe hilft.',
              6000, 'warn');
          }
        }
      } catch (e) {
        bericht.bildrate = { gewuenscht, fehler: String(e && e.message || e).slice(0, 90) };
      }
      return res;
    };

    bericht.bildrate = { gewuenscht: V.opts.fps || 30, gemessen: 'noch kein Export' };
    bericht.bildrateWahl = FPS.join('/') + ' fps im Exportfenster';
  })();

  /* ========================================================================
     15. Vier Anordnungen stapeln Fotos exakt aufeinander

     Nachweis ueber SS.paintScene: die Funktion nimmt eine Menge `skip`. Wird
     die Szene einmal vollstaendig und einmal ohne ein bestimmtes Foto
     gezeichnet und aendert sich dabei kein einziges Pixel, dann traegt dieses
     Foto nichts zum Bild bei. Gemessen auf 1200 px Breite:

        randlos        12 Fotos / 6 Slides   ->  6 von 12 ohne jede Wirkung
        vorstellung    12 Fotos / 6 Slides   ->  6 von 12 ohne jede Wirkung
        schritte        9 Fotos / 5 Slides   ->  4 von  9 ohne jede Wirkung
        vorhernachher   5 Fotos / 3 Slides   ->  3 von  5 ohne jede Wirkung

     Die Ursache steht in layouts6.js und ist in drei Faellen dieselbe Zeile:

        const sp = Math.min(k.n - 1, i);

     Die Klemme soll verhindern, dass Fotos hinter der letzten Slide landen.
     Sie sorgt aber dafuer, dass ab i = n JEDES weitere Foto exakt dieselbe
     Position bekommt. `vorhernachher` hat von vornherein nur zwei Plaetze
     (x bei 0,26 und 0,74 der Breite), also landet Foto 3 exakt auf Foto 1.

     Fuer die Nutzerin sieht das so aus: Anordnung antippen, die Haelfte der
     Fotos ist weg. Sie stehen weiter im Ebenen-Panel, sind aber unsichtbar.

     Behebung, ohne eine einzige Anordnung neu zu erfinden: `place` wird
     umschlossen. Vor dem Setzen werden alle Positionen einmal durchgerechnet;
     Fotos, die auf demselben Platz landen, werden innerhalb ihrer Slide
     nebeneinander aufgefaechert und etwas verkleinert – so wie es die
     Anordnung `duo` von Hand macht. Gibt es keine Doppelbelegung, bleibt
     alles auf das Pixel genau wie vorher.
     ==================================================================== */
  (function () {
    if (!SS.LAYOUTS || !SS.LAYOUTS.length) { bericht.stapel = 'keine Anordnungen'; return; }

    const schluessel = (p, k) =>
      Math.round((p.x || 0) / Math.max(1, k.slideW * 0.02)) + ':' +
      Math.round((p.y || 0) / Math.max(1, k.H * 0.02)) + ':' +
      Math.round((p.h || 0) / Math.max(1, k.H * 0.02));

    let umschlossen = 0;
    for (const L of SS.LAYOUTS) {
      const alt = L.place;
      if (typeof alt !== 'function') continue;
      L.place = function (i, N, k) {
        const eigen = alt.call(this, i, N, k);
        if (!eigen || !N || N < 2) return eigen;

        /* Alle Plaetze einmal durchrechnen und Doppelbelegungen finden.
           Das Ergebnis haengt nur von (N, k) ab, deshalb wird es gemerkt. */
        const merkschluessel = N + '|' + k.W + 'x' + k.H + 'x' + k.n;
        if (L._stapelCache !== merkschluessel) {
          const gruppen = new Map();
          for (let j = 0; j < N; j++) {
            let p = null;
            try { p = alt.call(L, j, N, k); } catch (e) { p = null; }
            if (!p) continue;
            const s = schluessel(p, k);
            if (!gruppen.has(s)) gruppen.set(s, []);
            gruppen.get(s).push(j);
          }
          const platz = {};
          for (const [, liste] of gruppen) {
            if (liste.length < 2) continue;
            liste.forEach((j, rang) => { platz[j] = { rang, von: liste.length }; });
          }
          L._stapelCache = merkschluessel;
          L._stapelPlatz = platz;
        }

        const eintrag = L._stapelPlatz && L._stapelPlatz[i];
        if (!eintrag) return eigen;

        /* Auffaechern: nebeneinander innerhalb der Slide, leicht versetzt in
           der Hoehe, und so weit verkleinert, dass alle nebeneinander passen. */
        const m = eintrag.von;
        const anteil = m === 1 ? 0.5 : eintrag.rang / (m - 1);        // 0 … 1
        const spanne = Math.min(0.78, 0.30 + 0.12 * m);               // Anteil der Slide
        const versatz = (anteil - 0.5) * k.slideW * spanne;
        const kleiner = 1 / Math.sqrt(m);
        const p = Object.assign({}, eigen);
        p.x = eigen.x + versatz;
        p.y = eigen.y + (eintrag.rang % 2 ? 1 : -1) * k.H * 0.045;
        p.h = (eigen.h || k.H * 0.5) * Math.max(0.42, kleiner);
        p.rot = (eigen.rot || 0) + (eintrag.rang % 2 ? 2.5 : -2.5);
        /* nicht ueber den Leinwandrand schieben */
        const halb = (p.h || 0) * 0.5;
        p.x = Math.max(halb * 0.4, Math.min(k.W - halb * 0.4, p.x));
        p.y = Math.max(halb * 0.55, Math.min(k.H - halb * 0.55, p.y));
        return p;
      };
      umschlossen++;
    }
    bericht.stapel = umschlossen + ' Anordnungen gegen Doppelbelegung abgesichert';
  })();

  SS.FIX631 = bericht;
})();
