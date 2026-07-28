/* Seamless Studio – Animations-Engine
   Eine zentrale Bibliothek für ALLE Element-Typen (Foto, Text, Sticker, Emoji).

   Jede Animation liefert für einen Zeitpunkt t (Sekunden) ein Frame:
     dx, dy  → Versatz in Vielfachen der Elementgröße (0.1 = 10 % der Größe)
     sx, sy  → Skalierung
     rot     → zusätzliche Drehung in Radiant
     a       → Deckkraft-Faktor
     glow    → Leucht-Stärke 0…1 (wird als Schein um die Form gezeichnet)

   Der Nutzer regelt zusätzlich Tempo (animSpeed) und Stärke (animAmp).
*/

(function () {
  const TAU = Math.PI * 2;
  const sin = Math.sin, cos = Math.cos, abs = Math.abs, pow = Math.pow;

  /* Hilfen ---------------------------------------------------------- */
  // sägezahn 0…1
  const saw = (t, period) => (t % period) / period;
  // weiches Ein-/Ausblenden
  const easeOutQuad = (x) => 1 - (1 - x) * (1 - x);
  const easeInQuad = (x) => x * x;
  // physikalischer Absprung: 0 am Boden, 1 im Scheitel
  function bounceArc(p) {           // p 0…1 innerhalb eines Sprungs
    return 4 * p * (1 - p);         // Parabel
  }
  // gedämpftes Nachfedern
  function springDecay(p, wobbles = 3) {
    if (p >= 1) return 0;
    return sin(p * Math.PI * wobbles * 2) * pow(1 - p, 2.2);
  }
  // Herzschlag „lub-dub": zwei Schläge, dann Pause
  function heartPulse(p) {          // p 0…1 pro Zyklus
    const beat = (x, c, w) => Math.exp(-pow((x - c) / w, 2));
    return beat(p, 0.10, 0.055) + 0.72 * beat(p, 0.26, 0.06);
  }
  // unruhiges Flackern (deterministisch, kein Random → Export = Vorschau)
  function flicker(t) {
    return 0.5 + 0.5 * (
      0.55 * sin(t * 11.3) + 0.28 * sin(t * 27.7 + 1.3) + 0.17 * sin(t * 43.1 + 2.6)
    );
  }

  const F = (o) => Object.assign({ dx: 0, dy: 0, sx: 1, sy: 1, rot: 0, a: 1, glow: 0 }, o);

  /* ================================================================
     Die Bibliothek. group = Reiter in der Oberfläche.
     ================================================================ */
  SS.ANIM_GROUPS = [
    { id: 'bounce', name: '🏀 Hüpfen' },
    { id: 'wiggle', name: '〰 Wiggle' },
    { id: 'beat',   name: '💗 Herzschlag' },
    { id: 'glow',   name: '✨ Leuchten' },
    { id: 'move',   name: '☁ Bewegen' },
    { id: 'spin',   name: '↻ Drehen' },
  ];

  SS.ANIMS = [
    { id: 'none', name: 'Keine', group: null, fn: () => F({}) },

    /* ---------------- 🏀 HÜPFEN / BOUNCING ---------------- */
    { id: 'bounce', name: 'Hüpfen', group: 'bounce', desc: 'Der Klassiker – sanft auf und ab',
      fn: (t, A) => F({ dy: -bounceArc(saw(t, 0.9)) * 0.34 * A }) },

    { id: 'bounce-ball', name: 'Gummiball', group: 'bounce', desc: 'Springt und wird beim Aufkommen platt',
      fn: (t, A) => {
        const p = saw(t, 0.85), h = bounceArc(p);
        const squash = pow(1 - h, 6);           // nur ganz unten quetschen
        return F({ dy: -h * 0.42 * A, sx: 1 + squash * 0.20 * A, sy: 1 - squash * 0.20 * A });
      } },

    { id: 'bounce-drop', name: 'Fallen & Aufkommen', group: 'bounce', desc: 'Fällt herunter und federt aus',
      fn: (t, A) => {
        const p = saw(t, 2.2);
        if (p < 0.35) { const q = p / 0.35; return F({ dy: -(1 - easeInQuad(q)) * 0.9 * A }); }
        const q = (p - 0.35) / 0.65;
        return F({ dy: -abs(springDecay(q, 2.5)) * 0.26 * A, sy: 1 + springDecay(q, 2.5) * 0.1 * A });
      } },

    { id: 'bounce-side', name: 'Seitwärts hüpfen', group: 'bounce', desc: 'Hüpft nach links und rechts',
      fn: (t, A) => {
        const p = saw(t, 1.6);
        const dir = p < 0.5 ? 1 : -1, q = (p % 0.5) / 0.5;
        return F({ dx: dir * (q - 0.5) * 0.5 * A, dy: -bounceArc(q) * 0.22 * A, rot: dir * bounceArc(q) * 0.12 * A });
      } },

    { id: 'bounce-jelly', name: 'Wackelpudding', group: 'bounce', desc: 'Weiche Gelee-Verformung',
      fn: (t, A) => F({ sx: 1 + sin(t * 5.4) * 0.13 * A, sy: 1 + sin(t * 5.4 + Math.PI) * 0.13 * A,
        dy: sin(t * 5.4) * 0.05 * A }) },

    { id: 'bounce-squash', name: 'Quetschen & Strecken', group: 'bounce', desc: 'Cartoon-Squash-and-Stretch',
      fn: (t, A) => {
        const p = saw(t, 1.0), h = bounceArc(p);
        const stretch = h > 0.15 ? (h - 0.15) / 0.85 : 0;
        const squash = pow(1 - h, 8);
        return F({ dy: -h * 0.4 * A,
          sx: 1 + squash * 0.28 * A - stretch * 0.12 * A,
          sy: 1 - squash * 0.26 * A + stretch * 0.16 * A });
      } },

    { id: 'bounce-spring', name: 'Sprungfeder', group: 'bounce', desc: 'Schnellt hoch und schwingt nach',
      fn: (t, A) => {
        const p = saw(t, 1.5);
        return F({ dy: -(1 - pow(1 - Math.min(1, p * 3), 3)) * 0.4 * A + springDecay(p, 4) * 0.14 * A,
          sy: 1 + springDecay(p, 4) * 0.12 * A });
      } },

    { id: 'bounce-pogo', name: 'Pogo-Stick', group: 'bounce', desc: 'Harte, hohe Sprünge',
      fn: (t, A) => {
        const p = saw(t, 0.62);
        return F({ dy: -bounceArc(p) * 0.62 * A, sy: 1 + bounceArc(p) * 0.08 * A, sx: 1 - bounceArc(p) * 0.05 * A });
      } },

    { id: 'bounce-hop', name: 'Häschen-Hüpfer', group: 'bounce', desc: 'Kleiner Hüpfer mit Neigung',
      fn: (t, A) => {
        const p = saw(t, 1.15);
        const h = p < 0.55 ? bounceArc(p / 0.55) : 0;
        return F({ dy: -h * 0.3 * A, dx: h * 0.06 * A, rot: sin(p * TAU) * 0.09 * A });
      } },

    { id: 'bounce-boing', name: 'Boing!', group: 'bounce', desc: 'Ploppt über die Zielgröße hinaus',
      fn: (t, A) => {
        const p = saw(t, 1.4);
        const s = p < 0.5 ? 1 + sin(p * TAU) * 0.22 * A : 1 + springDecay((p - 0.5) * 2, 3) * 0.12 * A;
        return F({ sx: s, sy: 2 - s });
      } },

    { id: 'bounce-tramp', name: 'Trampolin', group: 'bounce', desc: 'Weiter, hoher Flug',
      fn: (t, A) => {
        const p = saw(t, 1.8), h = bounceArc(p);
        return F({ dy: -pow(h, 0.75) * 0.85 * A, sy: 1 + pow(1 - h, 9) * 0.18 * A, sx: 1 - pow(1 - h, 9) * 0.14 * A });
      } },

    { id: 'bounce-tilt', name: 'Kipp-Hüpfer', group: 'bounce', desc: 'Hüpft und kippt dabei hin und her',
      fn: (t, A) => {
        const p = saw(t, 1.1);
        return F({ dy: -bounceArc(p) * 0.3 * A, rot: sin(t * 3.2) * 0.16 * A });
      } },

    { id: 'bounce-double', name: 'Doppel-Hüpfer', group: 'bounce', desc: 'Ein großer, ein kleiner Sprung',
      fn: (t, A) => {
        const p = saw(t, 1.9);
        let h = 0;
        if (p < 0.42) h = bounceArc(p / 0.42) * 1.0;
        else if (p < 0.68) h = bounceArc((p - 0.42) / 0.26) * 0.45;
        return F({ dy: -h * 0.4 * A });
      } },

    { id: 'bounce-zoom', name: 'Zoom-Hüpfer', group: 'bounce', desc: 'Größe hüpft statt der Position',
      fn: (t, A) => {
        const s = 1 + bounceArc(saw(t, 0.95)) * 0.24 * A;
        return F({ sx: s, sy: s });
      } },

    { id: 'bounce-shake', name: 'Rüttel-Hüpfer', group: 'bounce', desc: 'Hüpfen mit Zittern',
      fn: (t, A) => F({ dy: -bounceArc(saw(t, 0.8)) * 0.26 * A,
        dx: sin(t * 31) * 0.018 * A, rot: sin(t * 26) * 0.05 * A }) },

    { id: 'bounce-roll', name: 'Hüpfen & Rollen', group: 'bounce', desc: 'Springt und dreht sich weiter',
      fn: (t, A) => F({ dy: -bounceArc(saw(t, 0.95)) * 0.34 * A, rot: t * 1.4 * A }) },

    { id: 'bounce-heavy', name: 'Schwerer Aufprall', group: 'bounce', desc: 'Wuchtig, mit tiefem Einsinken',
      fn: (t, A) => {
        const p = saw(t, 1.35), h = bounceArc(pow(p, 0.85));
        const land = pow(1 - h, 12);
        return F({ dy: -h * 0.5 * A + land * 0.05 * A, sy: 1 - land * 0.3 * A, sx: 1 + land * 0.3 * A });
      } },

    { id: 'bounce-tick', name: 'Ticker', group: 'bounce', desc: 'Kurze, schnelle Mini-Hüpfer',
      fn: (t, A) => F({ dy: -bounceArc(saw(t, 0.4)) * 0.13 * A }) },

    /* ---------------- 〰 WIGGLE ---------------- */
    { id: 'wiggle', name: 'Wiggle klassisch', group: 'wiggle', desc: 'Das typische Icon-Wackeln',
      fn: (t, A) => F({ rot: sin(t * 7.5) * 0.11 * A }) },

    { id: 'wiggle-soft', name: 'Sanftes Wiggle', group: 'wiggle', desc: 'Ruhig und dezent',
      fn: (t, A) => F({ rot: sin(t * 3.4) * 0.07 * A }) },

    { id: 'wiggle-fast', name: 'Schnelles Wiggle', group: 'wiggle', desc: 'Flink und aufmerksamkeitsstark',
      fn: (t, A) => F({ rot: sin(t * 13) * 0.1 * A }) },

    { id: 'wiggle-x', name: 'Wiggle seitlich', group: 'wiggle', desc: 'Rutscht nach links und rechts',
      fn: (t, A) => F({ dx: sin(t * 8) * 0.05 * A }) },

    { id: 'wiggle-y', name: 'Wiggle hoch/runter', group: 'wiggle', desc: 'Zappelt auf und ab',
      fn: (t, A) => F({ dy: sin(t * 8) * 0.05 * A }) },

    { id: 'wiggle-tilt', name: 'Wiggle mit Versatz', group: 'wiggle', desc: 'Kippt und rutscht zugleich',
      fn: (t, A) => F({ rot: sin(t * 6.4) * 0.13 * A, dx: cos(t * 6.4) * 0.035 * A }) },

    { id: 'wiggle-scale', name: 'Wiggle mit Größe', group: 'wiggle', desc: 'Wackelt und atmet dabei',
      fn: (t, A) => { const s = 1 + sin(t * 6.8) * 0.07 * A; return F({ rot: sin(t * 6.8 + 1) * 0.09 * A, sx: s, sy: s }); } },

    { id: 'wiggle-jelly', name: 'Wiggle-Gelee', group: 'wiggle', desc: 'Weich verformendes Wackeln',
      fn: (t, A) => F({ rot: sin(t * 7) * 0.07 * A, sx: 1 + sin(t * 9) * 0.08 * A, sy: 1 - sin(t * 9) * 0.08 * A }) },

    { id: 'wiggle-rubber', name: 'Gummi-Wiggle', group: 'wiggle', desc: 'Zieht sich abwechselnd breit und schmal',
      fn: (t, A) => F({ sx: 1 + sin(t * 8.5) * 0.12 * A, sy: 1 + sin(t * 8.5 + Math.PI) * 0.12 * A }) },

    { id: 'wiggle-flag', name: 'Fähnchen', group: 'wiggle', desc: 'Flattert wie eine Fahne im Wind',
      fn: (t, A) => F({ rot: sin(t * 5.5) * 0.06 * A, sx: 1 + sin(t * 5.5 + 0.8) * 0.09 * A, dx: sin(t * 5.5) * 0.03 * A }) },

    { id: 'wiggle-noodle', name: 'Nudel-Wiggle', group: 'wiggle', desc: 'Langsam, weit ausholend',
      fn: (t, A) => F({ rot: sin(t * 2.3) * 0.24 * A, dx: sin(t * 2.3 + 0.6) * 0.05 * A }) },

    { id: 'wiggle-buzz', name: 'Summen', group: 'wiggle', desc: 'Sehr schnelles, feines Vibrieren',
      fn: (t, A) => F({ dx: sin(t * 46) * 0.012 * A, dy: cos(t * 52) * 0.012 * A, rot: sin(t * 49) * 0.02 * A }) },

    { id: 'wiggle-tap', name: 'Wiggle im Schub', group: 'wiggle', desc: 'Wackelt kurz, dann Pause – zieht Blicke an',
      fn: (t, A) => {
        const p = saw(t, 2.4);
        const on = p < 0.28 ? 1 - p / 0.28 * 0.2 : 0;
        return F({ rot: on * sin(t * 22) * 0.14 * A });
      } },

    { id: 'wiggle-heart', name: 'Wiggle + Puls', group: 'wiggle', desc: 'Wackeln mit Herzschlag',
      fn: (t, A) => {
        const s = 1 + heartPulse(saw(t, 1.3)) * 0.14 * A;
        return F({ rot: sin(t * 8) * 0.08 * A, sx: s, sy: s });
      } },

    { id: 'wiggle-swing', name: 'Wiggle-Pendel', group: 'wiggle', desc: 'Schwingt wie ein Anhänger',
      fn: (t, A) => F({ rot: sin(t * 4.4) * 0.19 * A, dy: abs(sin(t * 4.4)) * 0.02 * A }) },

    { id: 'wiggle-corner', name: 'Eck-Wiggle', group: 'wiggle', desc: 'Dreht um eine gedachte Ecke',
      fn: (t, A) => {
        const r = sin(t * 6) * 0.16 * A;
        return F({ rot: r, dx: -sin(r) * 0.5, dy: (1 - cos(r)) * 0.5 });
      } },

    { id: 'wiggle-8', name: 'Achter-Wiggle', group: 'wiggle', desc: 'Zeichnet eine liegende Acht',
      fn: (t, A) => F({ dx: sin(t * 3.2) * 0.06 * A, dy: sin(t * 6.4) * 0.035 * A, rot: sin(t * 3.2) * 0.05 * A }) },

    { id: 'wiggle-drunk', name: 'Torkeln', group: 'wiggle', desc: 'Unregelmäßig – wirkt handgemacht',
      fn: (t, A) => F({
        rot: (sin(t * 5.1) * 0.6 + sin(t * 8.3 + 1.2) * 0.3 + sin(t * 12.7 + 2.4) * 0.1) * 0.15 * A,
        dx: (sin(t * 3.7) * 0.7 + sin(t * 9.1 + 0.8) * 0.3) * 0.04 * A }) },

    { id: 'wiggle-nod', name: 'Nicken', group: 'wiggle', desc: 'Kurzes Zustimmen',
      fn: (t, A) => { const p = saw(t, 1.5); const on = p < 0.4 ? 1 : 0;
        return F({ dy: on * sin(p / 0.4 * TAU * 2) * 0.05 * A, sy: 1 - on * abs(sin(p / 0.4 * TAU * 2)) * 0.06 * A }); } },

    { id: 'wiggle-shiver', name: 'Frösteln', group: 'wiggle', desc: 'Feines Zittern mit leichtem Kippen',
      fn: (t, A) => F({ dx: sin(t * 33) * 0.016 * A, rot: sin(t * 29 + 0.5) * 0.035 * A }) },

    /* ---------------- 💗 HERZSCHLAG / PULS ---------------- */
    { id: 'heartbeat', name: 'Herzschlag', group: 'beat', desc: 'Echter Puls: kurz-kurz, Pause',
      fn: (t, A) => { const s = 1 + heartPulse(saw(t, 1.15)) * 0.22 * A; return F({ sx: s, sy: s }); } },

    { id: 'heartbeat-soft', name: 'Sanfter Herzschlag', group: 'beat', desc: 'Ruhiger, dezenter Puls',
      fn: (t, A) => { const s = 1 + heartPulse(saw(t, 1.9)) * 0.1 * A; return F({ sx: s, sy: s }); } },

    { id: 'heartbeat-glow', name: 'Herzschlag + Leuchten', group: 'beat', desc: 'Puls, der im Takt aufleuchtet',
      fn: (t, A) => {
        const h = heartPulse(saw(t, 1.15));
        const s = 1 + h * 0.2 * A;
        return F({ sx: s, sy: s, glow: 0.25 + h * 0.75 });
      } },

    { id: 'pulse', name: 'Pulsieren', group: 'beat', desc: 'Gleichmäßig groß und klein',
      fn: (t, A) => { const s = 1 + sin(t * 4.2) * 0.09 * A; return F({ sx: s, sy: s }); } },

    { id: 'breathe', name: 'Atmen', group: 'beat', desc: 'Sehr langsam, wie ein Atemzug',
      fn: (t, A) => { const s = 1 + sin(t * 1.15) * 0.07 * A; return F({ sx: s, sy: s, a: 0.9 + 0.1 * sin(t * 1.15) }); } },

    { id: 'throb', name: 'Pochen', group: 'beat', desc: 'Kräftig und schnell',
      fn: (t, A) => { const s = 1 + pow(0.5 + 0.5 * sin(t * 7.5), 2.4) * 0.2 * A; return F({ sx: s, sy: s }); } },

    { id: 'beat-swell', name: 'Anschwellen', group: 'beat', desc: 'Wächst langsam, schnappt zurück',
      fn: (t, A) => { const p = saw(t, 2.0); const s = 1 + (p < 0.8 ? easeOutQuad(p / 0.8) : 1 - (p - 0.8) / 0.2) * 0.18 * A; return F({ sx: s, sy: s }); } },

    { id: 'beat-wide', name: 'Breit & Schmal', group: 'beat', desc: 'Zieht sich in die Breite',
      fn: (t, A) => F({ sx: 1 + sin(t * 3.4) * 0.14 * A, sy: 1 - sin(t * 3.4) * 0.07 * A }) },

    /* ---------------- ✨ LEUCHTEN / GLOW ---------------- */
    { id: 'glow', name: 'Leuchten', group: 'glow', desc: 'Weicher Schein, der an- und abschwillt',
      fn: (t) => F({ glow: 0.35 + 0.65 * (0.5 + 0.5 * sin(t * 2.2)) }) },

    { id: 'glow-strong', name: 'Starkes Leuchten', group: 'glow', desc: 'Kräftiger Heiligenschein',
      fn: (t) => F({ glow: 0.65 + 0.35 * (0.5 + 0.5 * sin(t * 1.8)) }) },

    { id: 'glow-pulse', name: 'Leucht-Puls', group: 'glow', desc: 'Leuchten und Größe im Gleichtakt',
      fn: (t, A) => {
        const g = 0.5 + 0.5 * sin(t * 3.1);
        const s = 1 + g * 0.1 * A;
        return F({ sx: s, sy: s, glow: 0.3 + g * 0.7 });
      } },

    { id: 'neon', name: 'Neon-Flackern', group: 'glow', desc: 'Wie eine alte Leuchtreklame',
      fn: (t) => {
        const f = flicker(t);
        const dropout = (t % 3.7) > 3.58 ? 0.25 : 1;   // kurzer Aussetzer
        return F({ glow: (0.45 + 0.55 * f) * dropout, a: (0.8 + 0.2 * f) * (dropout < 1 ? 0.6 : 1) });
      } },

    { id: 'candleglow', name: 'Kerzenschein', group: 'glow', desc: 'Warmes, unruhiges Flackern',
      fn: (t, A) => {
        const f = flicker(t * 0.7);
        return F({ glow: 0.4 + 0.5 * f, sx: 1 + f * 0.03 * A, sy: 1 + f * 0.05 * A, a: 0.88 + 0.12 * f });
      } },

    { id: 'shimmer', name: 'Schimmern', group: 'glow', desc: 'Zartes Auf- und Abblenden',
      fn: (t) => F({ a: 0.55 + 0.45 * (0.5 + 0.5 * sin(t * 2.6)), glow: 0.25 }) },

    { id: 'twinkle', name: 'Funkeln', group: 'glow', desc: 'Blitzt kurz auf wie ein Stern',
      fn: (t, A) => {
        const g = 0.5 + 0.5 * sin(t * 5);
        return F({ a: 0.62 + 0.38 * g, sx: 1 + 0.06 * A * sin(t * 5), sy: 1 + 0.06 * A * sin(t * 5), glow: g * 0.8 });
      } },

    { id: 'sparkle-burst', name: 'Funken-Blitz', group: 'glow', desc: 'Ruhig, dann ein kurzer Blitz',
      fn: (t, A) => {
        const p = saw(t, 2.4);
        const burst = Math.exp(-pow((p - 0.15) / 0.06, 2));
        return F({ glow: 0.15 + burst, sx: 1 + burst * 0.16 * A, sy: 1 + burst * 0.16 * A });
      } },

    { id: 'strobe', name: 'Blitzen', group: 'glow', desc: 'Harter Ein/Aus-Rhythmus',
      fn: (t) => { const on = saw(t, 0.7) < 0.5; return F({ a: on ? 1 : 0.28, glow: on ? 0.9 : 0 }); } },

    { id: 'fadeinout', name: 'Ein- & Ausblenden', group: 'glow', desc: 'Erscheint und verschwindet sanft',
      fn: (t) => F({ a: 0.12 + 0.88 * (0.5 + 0.5 * sin(t * 1.4)) }) },

    /* ---------------- ☁ BEWEGEN ---------------- */
    { id: 'float', name: 'Schweben', group: 'move', desc: 'Treibt sanft auf und ab',
      fn: (t, A) => F({ dy: sin(t * 1.8) * 0.06 * A, rot: sin(t * 1.2) * 0.05 * A }) },

    { id: 'float-x', name: 'Treiben', group: 'move', desc: 'Gleitet seitlich hin und her',
      fn: (t, A) => F({ dx: sin(t * 1.5) * 0.09 * A, dy: sin(t * 2.3) * 0.03 * A }) },

    { id: 'rise', name: 'Aufsteigen', group: 'move', desc: 'Steigt auf und blendet aus – wie ein Ballon',
      fn: (t, A) => { const p = saw(t, 3.2); return F({ dy: -p * 0.75 * A, a: p < 0.75 ? 1 : (1 - p) * 4, dx: sin(p * 7) * 0.04 * A }); } },

    { id: 'sway', name: 'Wiegen', group: 'move', desc: 'Weiches Wiegen wie im Wind',
      fn: (t, A) => F({ rot: sin(t * 1.6) * 0.13 * A, dx: sin(t * 1.6) * 0.04 * A }) },

    { id: 'swing', name: 'Schaukeln', group: 'move', desc: 'Pendelt um den oberen Punkt',
      fn: (t, A) => F({ rot: sin(t * 2.4) * 0.22 * A, dy: abs(sin(t * 2.4)) * 0.02 * A }) },

    { id: 'wobble', name: 'Wackeln (klassisch)', group: 'wiggle', desc: 'Schnelles Hin-und-Her-Kippen',
      fn: (t, A) => F({ rot: sin(t * 6) * 0.09 * A }) },

    { id: 'jitter', name: 'Zittern', group: 'wiggle', desc: 'Nervöses Vibrieren',
      fn: (t, A) => F({ dx: sin(t * 37) * 0.014 * A, dy: cos(t * 41) * 0.014 * A }) },

    { id: 'shake', name: 'Schütteln', group: 'wiggle', desc: 'Kräftiges Rütteln im Schub',
      fn: (t, A) => {
        const p = saw(t, 1.6);
        const on = p < 0.35 ? 1 : 0;
        return F({ dx: on * sin(t * 44) * 0.05 * A, rot: on * sin(t * 40) * 0.05 * A });
      } },

    { id: 'wave', name: 'Welle', group: 'move', desc: 'Wellenförmig auf und ab mit Neigung',
      fn: (t, A) => F({ dy: sin(t * 2.6) * 0.08 * A, rot: cos(t * 2.6) * 0.1 * A }) },

    { id: 'orbit', name: 'Kreisen', group: 'move', desc: 'Fährt eine kleine Kreisbahn',
      fn: (t, A) => F({ dx: cos(t * 1.7) * 0.09 * A, dy: sin(t * 1.7) * 0.09 * A }) },

    { id: 'drift-slow', name: 'Sanftes Driften', group: 'move', desc: 'Kaum merklich – edel und ruhig',
      fn: (t, A) => F({ dx: sin(t * 0.7) * 0.05 * A, dy: cos(t * 0.55) * 0.04 * A, rot: sin(t * 0.6) * 0.03 * A }) },

    { id: 'pop', name: 'Ploppen', group: 'move', desc: 'Verschwindet kurz und ploppt zurück',
      fn: (t, A) => {
        const p = saw(t, 2.0);
        if (p > 0.85) { const q = (p - 0.85) / 0.15; const s = 1 - q; return F({ sx: s, sy: s, a: s }); }
        if (p < 0.15) { const q = p / 0.15; const s = q < 0.7 ? q / 0.7 * 1.15 : 1.15 - (q - 0.7) / 0.3 * 0.15; return F({ sx: s, sy: s, a: Math.min(1, q * 2) }); }
        return F({ sx: 1 + sin(t * 3) * 0.02 * A, sy: 1 + sin(t * 3) * 0.02 * A });
      } },

    /* ---------------- ↻ DREHEN ---------------- */
    { id: 'spin', name: 'Drehen', group: 'spin', desc: 'Gleichmäßige Rotation',
      fn: (t, A) => F({ rot: t * 0.8 * A }) },

    { id: 'spin-slow', name: 'Langsam drehen', group: 'spin', desc: 'Edel und träge',
      fn: (t, A) => F({ rot: t * 0.28 * A }) },

    { id: 'spin-back', name: 'Rückwärts drehen', group: 'spin', desc: 'Gegen den Uhrzeigersinn',
      fn: (t, A) => F({ rot: -t * 0.8 * A }) },

    { id: 'flip', name: 'Umblättern', group: 'spin', desc: 'Kippt um die senkrechte Achse',
      fn: (t) => F({ sx: cos(t * 1.9) }) },

    { id: 'flip-y', name: 'Salto', group: 'spin', desc: 'Kippt um die waagerechte Achse',
      fn: (t) => F({ sy: cos(t * 1.9) }) },

    { id: 'spin-pulse', name: 'Drehen & Pulsieren', group: 'spin', desc: 'Rotation mit Größenwechsel',
      fn: (t, A) => { const s = 1 + sin(t * 3.6) * 0.1 * A; return F({ rot: t * 0.6 * A, sx: s, sy: s }); } },

    { id: 'tilt', name: 'Kippen', group: 'spin', desc: 'Neigt sich langsam hin und her',
      fn: (t, A) => F({ rot: sin(t * 0.9) * 0.2 * A }) },

    { id: 'rock', name: 'Schaukelstuhl', group: 'spin', desc: 'Kippt mit leichtem Versatz',
      fn: (t, A) => F({ rot: sin(t * 2.1) * 0.15 * A, dx: sin(t * 2.1) * 0.05 * A, dy: abs(sin(t * 2.1)) * 0.03 * A }) },
  ];

  SS.ANIM_BY_ID = {};
  for (const a of SS.ANIMS) SS.ANIM_BY_ID[a.id] = a;

  /* ================================================================
     Anwenden
     ================================================================ */

  // Standardwerte an einem Element ergänzen (alte Projekte bleiben kompatibel)
  SS.animDefaults = function (el) {
    if (el.animSpeed === undefined) el.animSpeed = 1;
    if (el.animAmp === undefined) el.animAmp = 100;
    if (el.animPhase === undefined) el.animPhase = 0;
    return el;
  };

  /* Frame berechnen. size = Referenzgröße des Elements in Canvas-Pixeln. */
  SS.animFrame = function (el, size) {
    if (SS._noAnim) return null;          // Bilder-Export: immer der Ruhezustand
    const id = el && el.anim;
    if (!id || id === 'none') return null;
    const def = SS.ANIM_BY_ID[id];
    // Buchstaben-Animationen bewegen nicht den ganzen Block – siehe drawTextEl
    if (def && def.perChar) return null;
    if (!def || !def.fn) return null;
    const speed = el.animSpeed === undefined ? 1 : el.animSpeed;
    const amp = (el.animAmp === undefined ? 100 : el.animAmp) / 100;
    // Phasenversatz: je Element leicht unterschiedlich, damit nichts synchron wirkt
    const auto = ((el.id || '').split('').reduce((s, ch) => s + ch.charCodeAt(0), 0) % 17) * 0.13;
    const t = SS.animT * speed + auto + (el.animPhase || 0);
    const f = def.fn(t, amp);
    return {
      dx: (f.dx || 0) * size, dy: (f.dy || 0) * size,
      sx: f.sx === undefined ? 1 : f.sx, sy: f.sy === undefined ? 1 : f.sy,
      rot: f.rot || 0,
      a: f.a === undefined ? 1 : f.a,
      glow: (f.glow || 0) * amp,
    };
  };

  /* Transformation auf den Kontext legen. Rückgabe: Glow-Beschreibung oder null.
     Muss zwischen c.save() und dem Zeichnen aufgerufen werden – nach translate(x,y). */
  SS.applyAnim = function (c, el, size) {
    const f = SS.animFrame(el, size);
    if (!f) return null;
    c.translate(f.dx, f.dy);
    if (f.rot) c.rotate(f.rot);
    // Skalierung nie exakt 0 (sonst verschwindet der Kontext unwiderruflich)
    const sx = Math.abs(f.sx) < 0.001 ? 0.001 * Math.sign(f.sx || 1) : f.sx;
    const sy = Math.abs(f.sy) < 0.001 ? 0.001 * Math.sign(f.sy || 1) : f.sy;
    if (sx !== 1 || sy !== 1) c.scale(sx, sy);
    c.globalAlpha *= f.a;
    if (f.glow > 0.001) {
      return { color: el.animGlowColor || el.color || '#ffd9a0', blur: size * 0.34 * f.glow, power: f.glow };
    }
    return null;
  };

  /* Gibt es überhaupt etwas Animiertes? (steuert die Live-Render-Schleife) */
  SS.hasAnimation = function () {
    if (SS.clipIsPlaying && SS.clipIsPlaying()) return true;
    return SS.state.elements.some(e => e.anim && e.anim !== 'none');
  };

  /* Vorschau-Miniatur einer Animation für die Auswahl-Kacheln */
  SS.animPreviewLabel = function (id) {
    const d = SS.ANIM_BY_ID[id];
    return d ? d.desc || d.name : '';
  };
})();

/* ================================================================
   Buchstaben-Animationen (nur für Textfelder)
   Diese Animationen bewegen jeden Buchstaben einzeln – so wie man es
   aus CapCut kennt. Sie liefern kein Bild-Frame für das ganze Element,
   sondern eine Funktion charFn(index, anzahl, t, staerke, wortIndex).
   ================================================================ */
(function () {
  const sin = Math.sin, cos = Math.cos, abs = Math.abs, pow = Math.pow;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));

  /* Wie weit ist der Buchstabe g in der laufenden Runde?
     < 0 = noch nicht dran · 0…1 = im Übergang · > 1 = fertig */
  function reveal(g, n, t, speed, hold) {
    speed = speed || 9;
    hold = hold === undefined ? 1.8 : hold;
    const runde = n / speed + hold;
    const tt = t % runde;
    return tt * speed - g;
  }
  /* weiches Nachfedern */
  const spring = (p) => p >= 1 ? 1 : 1 - pow(1 - p, 3) + sin(p * Math.PI * 3) * pow(1 - p, 3) * 0.35;
  /* deterministischer Streuwert je Buchstabe */
  const streu = (g, k) => {
    const s = Math.sin(g * 12.9898 + k * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };

  const T = [
    { id: 't-typewriter', name: 'Schreibmaschine', desc: 'Buchstabe für Buchstabe wie getippt',
      charFn: (g, n, t, A) => ({ a: reveal(g, n, t, 11) > 0 ? 1 : 0 }) },

    { id: 't-fadein', name: 'Nacheinander einblenden', desc: 'Sanft von links nach rechts',
      charFn: (g, n, t, A) => ({ a: cl(reveal(g, n, t, 8) * 0.8, 0, 1) }) },

    { id: 't-popin', name: 'Ploppen', desc: 'Jeder Buchstabe springt ins Bild',
      charFn: (g, n, t, A) => {
        const p = cl(reveal(g, n, t, 9) * 0.55, 0, 1);
        const s = p <= 0 ? 0 : 0.2 + spring(p) * 0.8 * (1 + (1 - p) * 0.25 * A);
        return { a: p <= 0 ? 0 : 1, sx: s, sy: s };
      } },

    { id: 't-dropin', name: 'Herabfallen', desc: 'Buchstaben fallen von oben herein',
      charFn: (g, n, t, A) => {
        const p = cl(reveal(g, n, t, 9) * 0.5, 0, 1);
        return { a: p <= 0 ? 0 : cl(p * 3, 0, 1), dy: (1 - spring(p)) * -0.9 * A };
      } },

    { id: 't-riseup', name: 'Aufsteigen', desc: 'Buchstaben steigen von unten auf',
      charFn: (g, n, t, A) => {
        const p = cl(reveal(g, n, t, 9) * 0.5, 0, 1);
        return { a: p <= 0 ? 0 : cl(p * 3, 0, 1), dy: (1 - spring(p)) * 0.9 * A };
      } },

    { id: 't-slidein', name: 'Einfliegen', desc: 'Von rechts hereingeschoben',
      charFn: (g, n, t, A) => {
        const p = cl(reveal(g, n, t, 9) * 0.5, 0, 1);
        return { a: p <= 0 ? 0 : cl(p * 3, 0, 1), dx: (1 - spring(p)) * 1.4 * A };
      } },

    { id: 't-scatter', name: 'Zusammenfinden', desc: 'Buchstaben fliegen aus allen Richtungen zusammen',
      charFn: (g, n, t, A) => {
        const p = cl(reveal(g, n, t, 7) * 0.42, 0, 1);
        const q = 1 - spring(p);
        return { a: p <= 0 ? 0 : cl(p * 2.5, 0, 1),
          dx: q * (streu(g, 1) - 0.5) * 3 * A,
          dy: q * (streu(g, 2) - 0.5) * 3 * A,
          rot: q * (streu(g, 3) - 0.5) * 2.2 * A };
      } },

    { id: 't-wave', name: 'Welle', desc: 'Eine Welle läuft durch die Buchstaben',
      charFn: (g, n, t, A) => ({ dy: sin(t * 4 - g * 0.55) * 0.13 * A }) },

    { id: 't-bounce-each', name: 'Hüpfende Buchstaben', desc: 'Einer nach dem anderen hüpft',
      charFn: (g, n, t, A) => {
        const ph = (t * 2.2 - g * 0.22) % 1;
        const h = ph < 0.5 ? 4 * ph * (0.5 - ph) * 4 : 0;
        return { dy: -h * 0.45 * A };
      } },

    { id: 't-jump', name: 'Springen', desc: 'Kräftige Sprünge im Versatz',
      charFn: (g, n, t, A) => {
        const ph = (t * 1.6 - g * 0.16) % 1;
        const h = 4 * ph * (1 - ph);
        return { dy: -h * 0.55 * A, sy: 1 + h * 0.12 * A, sx: 1 - h * 0.06 * A };
      } },

    { id: 't-swing-each', name: 'Pendeln', desc: 'Buchstaben schwingen versetzt',
      charFn: (g, n, t, A) => ({ rot: sin(t * 3 - g * 0.4) * 0.24 * A }) },

    { id: 't-zoom-each', name: 'Pulsieren', desc: 'Größe läuft durch die Buchstaben',
      charFn: (g, n, t, A) => { const s = 1 + sin(t * 3.4 - g * 0.45) * 0.16 * A; return { sx: s, sy: s }; } },

    { id: 't-flip-each', name: 'Umklappen', desc: 'Buchstaben kippen nacheinander um',
      charFn: (g, n, t, A) => ({ sx: cos(t * 2.6 - g * 0.5) }) },

    { id: 't-shake-each', name: 'Zappeln', desc: 'Jeder Buchstabe zittert für sich',
      charFn: (g, n, t, A) => ({
        dx: sin(t * 26 + g * 2.1) * 0.03 * A,
        dy: cos(t * 31 + g * 1.7) * 0.03 * A,
        rot: sin(t * 24 + g) * 0.06 * A }) },

    { id: 't-glowrun', name: 'Lichtlauf', desc: 'Ein Leuchten wandert durch das Wort',
      charFn: (g, n, t, A) => {
        const pos = (t * 4) % (n + 5) - 2.5;
        const d = g - pos;
        const gl = Math.exp(-d * d / 2.2);
        return { glow: gl, sx: 1 + gl * 0.08 * A, sy: 1 + gl * 0.08 * A };
      } },

    { id: 't-neonon', name: 'Neon schaltet an', desc: 'Buchstaben flackern nacheinander an',
      charFn: (g, n, t, A) => {
        const p = reveal(g, n, t, 6, 2.4);
        if (p <= 0) return { a: 0.12, glow: 0 };
        const flack = p < 0.9 ? (0.35 + 0.65 * abs(sin(p * 26 + g))) : 1;
        return { a: 0.15 + 0.85 * flack, glow: flack };
      } },

    { id: 't-word-fade', name: 'Wort für Wort', desc: 'Blendet wortweise ein',
      charFn: (g, n, t, A, w) => ({ a: cl(reveal(w * 4.5, n, t, 8) * 0.7, 0, 1) }) },

    { id: 't-word-pop', name: 'Wort-Ploppen', desc: 'Jedes Wort springt einzeln ins Bild',
      charFn: (g, n, t, A, w) => {
        const p = cl(reveal(w * 5, n, t, 8) * 0.5, 0, 1);
        const s = p <= 0 ? 0 : spring(p);
        return { a: p <= 0 ? 0 : 1, sx: s, sy: s, dy: (1 - s) * 0.3 * A };
      } },

    { id: 't-cascade', name: 'Wasserfall', desc: 'Buchstaben fallen versetzt und federn aus',
      charFn: (g, n, t, A) => {
        const ph = (t * 1.1 - g * 0.09) % 1;
        const p = cl(ph * 2.2, 0, 1);
        return { dy: (1 - spring(p)) * -1.1 * A, a: cl(p * 4, 0, 1) };
      } },

    { id: 't-breathe-each', name: 'Atmende Buchstaben', desc: 'Ruhiges Auf und Ab im Versatz',
      charFn: (g, n, t, A) => {
        const s = 1 + sin(t * 1.5 - g * 0.3) * 0.07 * A;
        return { sx: s, sy: s, dy: sin(t * 1.5 - g * 0.3) * 0.04 * A };
      } },
  ];

  SS.ANIM_GROUPS.push({ id: 'text', name: '🅣 Buchstaben', textOnly: true });
  for (const a of T) {
    a.group = 'text';
    a.perChar = true;
    SS.ANIMS.push(a);
    SS.ANIM_BY_ID[a.id] = a;
  }
  SS.TEXT_ANIM_COUNT = T.length;
})();
