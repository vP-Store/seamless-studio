/* Seamless Studio 5.2 – Animationen, zweiter Satz
   ============================================================================
   Hängt sich an die Bibliothek aus anim.js an. Fünf neue Gruppen:

     ⇥ Ein- & Ausgang   Element kommt herein, bleibt stehen, geht wieder.
                        Das ist die Sorte, die ein Reel trägt – sie fehlte ganz.
     ♪ Im Takt          rastet auf das Taktraster der mitgelieferten Klangbetten
     ◎ Kamera-nah       Parallaxe, Ken Burns je Element, Tiefe
     ☺ Charakter        Sticker, die sich benehmen wie kleine Wesen
     🅐 Buchstaben       zwölf weitere, die jeden Buchstaben einzeln bewegen

   Alles ohne Zufall gerechnet: Vorschau und Export zeigen dasselbe Bild.
   ========================================================================= */

(function () {
  const TAU = Math.PI * 2;
  const sin = Math.sin, cos = Math.cos, abs = Math.abs, pow = Math.pow;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const F = (o) => Object.assign({ dx: 0, dy: 0, sx: 1, sy: 1, rot: 0, a: 1, glow: 0 }, o);

  const easeOutCubic = (x) => 1 - pow(1 - x, 3);
  const easeInCubic = (x) => x * x * x;
  const easeOutBack = (x) => { const c = 1.70158; return 1 + (c + 1) * pow(x - 1, 3) + c * pow(x - 1, 2); };
  const easeOutElastic = (x) => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    return pow(2, -9 * x) * sin((x * 10 - 0.75) * (TAU / 3)) + 1;
  };

  /* ================================================================
     Ein- & Ausgang
     Ein Zyklus dauert ZYK Sekunden: herein (EIN), stehen, hinaus (AUS).
     phase(t) liefert:  p = 0…1 beim Hereinkommen,
                        1 während des Stehens,
                        1…0 beim Hinausgehen,   raus = true beim Ausgang
     ================================================================ */
  const ZYK = 4.2, EIN = 0.62, AUS = 0.62;
  function phase(t) {
    const p = ((t % ZYK) + ZYK) % ZYK;
    if (p < EIN) return { k: p / EIN, raus: false };
    if (p > ZYK - AUS) return { k: 1 - (p - (ZYK - AUS)) / AUS, raus: true };
    return { k: 1, raus: false };
  }
  /* Aus einer Ein-/Ausgangsbeschreibung eine fertige Animation bauen.
     bau(k, raus, A) bekommt den Fortschritt und ob gerade ausgegangen wird. */
  const gang = (id, name, desc, bau) => ({
    id, name, group: 'gang', desc,
    fn: (t, A) => { const ph = phase(t); return F(bau(ph.k, ph.raus, A)); },
  });

  const EIN_AUS = [
    gang('g-links', 'Von links herein', 'Fliegt von links herein und links wieder hinaus',
      (k, raus, A) => ({ dx: -(1 - easeOutCubic(k)) * 1.7 * A, a: cl(k * 1.6, 0, 1) })),

    gang('g-rechts', 'Von rechts herein', 'Fliegt von rechts herein und rechts wieder hinaus',
      (k, raus, A) => ({ dx: (1 - easeOutCubic(k)) * 1.7 * A, a: cl(k * 1.6, 0, 1) })),

    gang('g-oben', 'Von oben herein', 'Fällt von oben ins Bild und steigt wieder hoch',
      (k, raus, A) => ({ dy: -(1 - easeOutCubic(k)) * 1.5 * A, a: cl(k * 1.6, 0, 1) })),

    gang('g-unten', 'Von unten herein', 'Steigt von unten auf und sinkt wieder ab',
      (k, raus, A) => ({ dy: (1 - easeOutCubic(k)) * 1.5 * A, a: cl(k * 1.6, 0, 1) })),

    gang('g-durch', 'Durchreise', 'Kommt links herein und verlässt das Bild nach rechts',
      (k, raus, A) => ({ dx: (raus ? (1 - k) : -(1 - easeOutCubic(k))) * 1.8 * A, a: cl(k * 1.8, 0, 1) })),

    gang('g-zoom', 'Heranzoomen', 'Wächst aus dem Nichts und schrumpft wieder weg',
      (k, raus, A) => { const s = 0.2 + 0.8 * easeOutCubic(k); return { sx: s, sy: s, a: cl(k * 1.5, 0, 1) }; }),

    gang('g-zoomraus', 'Von vorn heran', 'Kommt riesig heran und fährt wieder zurück',
      (k, raus, A) => { const s = 2.4 - 1.4 * easeOutCubic(k); return { sx: s, sy: s, a: cl(k * 1.4, 0, 1) }; }),

    gang('g-pop', 'Aufploppen', 'Springt ins Bild und federt kurz nach',
      (k, raus, A) => { const s = 0.25 + 0.75 * easeOutBack(k); return { sx: s, sy: s, a: cl(k * 2, 0, 1) }; }),

    gang('g-feder', 'Federnd herein', 'Kommt mit Schwung und schwingt aus',
      (k, raus, A) => { const s = 0.3 + 0.7 * easeOutElastic(k); return { sx: s, sy: s, a: cl(k * 2, 0, 1) }; }),

    gang('g-dreh', 'Hereindrehen', 'Dreht sich ins Bild und wieder heraus',
      (k, raus, A) => ({ rot: (1 - easeOutCubic(k)) * (raus ? 1 : -1) * 1.5 * A,
                         sx: 0.4 + 0.6 * k, sy: 0.4 + 0.6 * k, a: cl(k * 1.6, 0, 1) })),

    gang('g-kippen', 'Aufklappen', 'Klappt auf wie eine Karte',
      (k, raus, A) => ({ sx: 0.02 + 0.98 * easeOutCubic(k), a: cl(k * 2.4, 0, 1) })),

    gang('g-jalousie', 'Aufziehen', 'Zieht sich von oben auf',
      (k, raus, A) => ({ sy: 0.02 + 0.98 * easeOutCubic(k), a: cl(k * 2.4, 0, 1) })),

    gang('g-blende', 'Weich einblenden', 'Erscheint ruhig und verschwindet ruhig',
      (k, raus, A) => ({ a: easeOutCubic(k), sx: 0.94 + 0.06 * k, sy: 0.94 + 0.06 * k })),

    gang('g-schweben', 'Herschweben', 'Schwebt schräg von unten heran',
      (k, raus, A) => ({ dx: -(1 - easeOutCubic(k)) * 0.5 * A, dy: (1 - easeOutCubic(k)) * 0.8 * A,
                         rot: (1 - k) * 0.22 * A, a: cl(k * 1.6, 0, 1) })),

    gang('g-schub', 'Anschieben', 'Rutscht kurz herein und bremst ab',
      (k, raus, A) => ({ dx: -(1 - easeOutElastic(k)) * 0.45 * A, a: cl(k * 3, 0, 1) })),

    gang('g-fallen', 'Hereinfallen', 'Fällt herein, tippt auf und kommt zur Ruhe',
      (k, raus, A) => {
        const p = easeOutCubic(k);
        const nach = k > 0.7 ? sin((k - 0.7) / 0.3 * Math.PI * 2) * pow(1 - (k - 0.7) / 0.3, 2) * 0.08 : 0;
        return { dy: -(1 - p) * 1.4 * A + nach * A, sy: 1 - nach * 0.5, a: cl(k * 2, 0, 1) };
      }),
  ];

  /* ================================================================
     Im Takt – rastet auf das Raster der mitgelieferten Klangbetten
     ================================================================ */
  const BPM_STD = 84;
  function bpm() {
    if (SS.beat && SS.beat.bpm) return SS.beat.bpm;
    const id = (SS.audio && SS.audio.state && SS.audio.state.soundId) || 'none';
    const tab = { meer: 60, wald: 76, wind: 66, regen: 84, ruhig: 72, froh: 112, episch: 90, lulla: 66 };
    return tab[id] || BPM_STD;
  }
  /* Position innerhalb eines Schlags, 0 = genau auf dem Schlag */
  function schlag(t, jeder) {
    const dauer = (60 / bpm()) * (jeder || 1);
    return ((t % dauer) + dauer) % dauer / dauer;
  }
  const takt = (id, name, desc, jeder, bau) => ({
    id, name, group: 'takt', desc,
    fn: (t, A) => F(bau(schlag(t, jeder), A)),
  });
  // Abklingen: 1 auf dem Schlag, schnell zurück auf 0
  const ab = (p, haerte = 5) => pow(1 - p, haerte);

  const IM_TAKT = [
    takt('b-puls', 'Puls', 'Wird auf jedem Schlag kurz größer', 1,
      (p, A) => { const s = 1 + ab(p) * 0.20 * A; return { sx: s, sy: s }; }),

    takt('b-puls2', 'Puls, jeder zweite', 'Nur auf jedem zweiten Schlag', 2,
      (p, A) => { const s = 1 + ab(p) * 0.26 * A; return { sx: s, sy: s }; }),

    takt('b-pop', 'Pop', 'Schnappt auf dem Schlag auf und fällt zurück', 1,
      (p, A) => { const s = 1 + ab(p, 9) * 0.34 * A; return { sx: s, sy: s * (1 - ab(p, 9) * 0.08 * A) }; }),

    takt('b-tipp', 'Antippen', 'Sackt auf dem Schlag kurz zusammen', 1,
      (p, A) => { const q = ab(p, 7); return { sx: 1 + q * 0.10 * A, sy: 1 - q * 0.12 * A, dy: q * 0.05 * A }; }),

    takt('b-hupf', 'Takt-Hüpfer', 'Springt auf jedem Schlag hoch', 1,
      (p, A) => ({ dy: -4 * p * (1 - p) * 0.30 * A })),

    takt('b-ruck', 'Ruckeln', 'Ruckt auf dem Schlag zur Seite', 1,
      (p, A) => ({ dx: ab(p, 8) * 0.14 * A * (p < 0.5 ? 1 : -1) })),

    takt('b-kipp', 'Takt-Kippen', 'Kippt abwechselnd nach links und rechts', 2,
      (p, A) => ({ rot: (p < 0.5 ? 1 : -1) * ab(p % 0.5 * 2, 4) * 0.11 * A })),

    takt('b-blitz', 'Takt-Blitzen', 'Leuchtet auf jedem Schlag auf', 1,
      (p, A) => ({ glow: ab(p, 6) * A, sx: 1 + ab(p, 6) * 0.05 * A, sy: 1 + ab(p, 6) * 0.05 * A })),

    takt('b-schatten', 'Schlagschatten', 'Zittert kurz nach dem Schlag nach', 1,
      (p, A) => { const q = ab(p, 4); return { dx: sin(p * 40) * q * 0.05 * A, dy: cos(p * 37) * q * 0.05 * A }; }),

    takt('b-vier', 'Vier-Viertel', 'Ein großer Akzent auf jedem vierten Schlag', 4,
      (p, A) => { const s = 1 + ab(p, 3) * 0.30 * A; return { sx: s, sy: s, rot: ab(p, 3) * 0.06 * A }; }),
  ];

  /* ================================================================
     Kamera-nah – Tiefe, Parallaxe, langsame Fahrten
     ================================================================ */
  const kam = (id, name, desc, fn) => ({ id, name, group: 'kamera', desc, fn: (t, A) => F(fn(t, A)) });

  const KAMERA = [
    kam('k-parallax', 'Parallaxe', 'Wandert langsam gegen die Kamera – wirkt weiter hinten',
      (t, A) => ({ dx: sin(t * 0.32) * 0.10 * A })),

    kam('k-parallax-nah', 'Parallaxe nah', 'Wandert stärker – wirkt weiter vorn',
      (t, A) => ({ dx: sin(t * 0.32) * 0.26 * A })),

    kam('k-kenburns', 'Ken Burns', 'Zoomt ganz langsam heran und wandert dabei',
      (t, A) => { const p = (sin(t * 0.18) + 1) / 2; const s = 1 + p * 0.14 * A;
        return { sx: s, sy: s, dx: (p - 0.5) * 0.10 * A, dy: (p - 0.5) * -0.06 * A }; }),

    kam('k-kenburns-raus', 'Ken Burns zurück', 'Fährt langsam zurück',
      (t, A) => { const p = (cos(t * 0.18) + 1) / 2; const s = 1 + p * 0.14 * A;
        return { sx: s, sy: s, dx: (0.5 - p) * 0.10 * A }; }),

    kam('k-drift', 'Abdriften', 'Zieht ganz langsam in eine Richtung',
      (t, A) => ({ dx: sin(t * 0.11) * 0.16 * A, dy: cos(t * 0.083) * 0.09 * A })),

    kam('k-atem', 'Kamera-Atmen', 'Kaum merkliches Ein- und Ausatmen',
      (t, A) => { const s = 1 + sin(t * 0.55) * 0.035 * A; return { sx: s, sy: s }; }),

    kam('k-handkamera', 'Handkamera', 'Unruhig wie aus der Hand gefilmt',
      (t, A) => ({ dx: (sin(t * 1.7) * 0.6 + sin(t * 4.3 + 1) * 0.3) * 0.022 * A,
                   dy: (cos(t * 1.3) * 0.6 + cos(t * 3.7 + 2) * 0.3) * 0.022 * A,
                   rot: sin(t * 0.9) * 0.012 * A })),

    kam('k-tiefe', 'Tiefenwackler', 'Kippt leicht, als läge es schräg im Raum',
      (t, A) => ({ sx: 1 + sin(t * 0.7) * 0.05 * A, sy: 1 + cos(t * 0.7) * 0.05 * A,
                   rot: sin(t * 0.35) * 0.03 * A })),

    kam('k-dolly', 'Dolly-Zoom', 'Zoomt in der Breite anders als in der Höhe',
      (t, A) => ({ sx: 1 + sin(t * 0.5) * 0.09 * A, sy: 1 - sin(t * 0.5) * 0.06 * A })),

    kam('k-vorbei', 'Vorbeiziehen', 'Zieht ruhig quer durchs Bild und wieder zurück',
      (t, A) => ({ dx: sin(t * 0.22) * 0.55 * A, sx: 1 + cos(t * 0.22) * 0.04 * A,
                   sy: 1 + cos(t * 0.22) * 0.04 * A })),
  ];

  /* ================================================================
     Charakter – Sticker, die sich benehmen wie kleine Wesen
     ================================================================ */
  const chr = (id, name, desc, fn) => ({ id, name, group: 'charakter', desc, fn: (t, A) => F(fn(t, A)) });

  const CHARAKTER = [
    chr('c-blinzeln', 'Blinzeln', 'Drückt sich alle paar Sekunden kurz zusammen',
      (t, A) => { const p = (t % 3.4) / 3.4;
        const zu = p < 0.06 ? sin(p / 0.06 * Math.PI) : 0;
        return { sy: 1 - zu * 0.85 * A }; }),

    chr('c-nicken', 'Zustimmen', 'Nickt zweimal und macht Pause',
      (t, A) => { const p = (t % 2.8) / 2.8;
        const n = p < 0.35 ? sin(p / 0.35 * TAU * 2) : 0;
        return { dy: n * 0.09 * A, rot: n * 0.05 * A }; }),

    chr('c-kopfschuetteln', 'Verneinen', 'Schüttelt kurz den Kopf',
      (t, A) => { const p = (t % 3.1) / 3.1;
        const n = p < 0.3 ? sin(p / 0.3 * TAU * 2.5) : 0;
        return { dx: n * 0.08 * A, rot: n * -0.05 * A }; }),

    chr('c-huepfschritt', 'Hüpfschritt', 'Zwei kleine Sprünge, dann Ruhe',
      (t, A) => { const p = (t % 2.2) / 2.2;
        const s = p < 0.5 ? abs(sin(p / 0.5 * TAU)) : 0;
        return { dy: -s * 0.20 * A, sy: 1 + s * 0.05 * A, sx: 1 - s * 0.04 * A }; }),

    chr('c-trudeln', 'Trudeln', 'Dreht sich träge und sinkt dabei leicht',
      (t, A) => ({ rot: sin(t * 0.6) * 0.5 * A, dy: sin(t * 0.6 + 1) * 0.08 * A })),

    chr('c-segeln', 'Segeln', 'Gleitet in weiten Bögen wie ein Blatt im Wind',
      (t, A) => ({ dx: sin(t * 0.45) * 0.30 * A, dy: sin(t * 0.9 + 0.7) * 0.14 * A,
                   rot: cos(t * 0.45) * 0.24 * A })),

    chr('c-blasen', 'Aufsteigen', 'Steigt langsam auf und beginnt unten von vorn',
      (t, A) => { const p = (t % 3.6) / 3.6;
        return { dy: -p * 1.1 * A, dx: sin(p * TAU * 1.5) * 0.09 * A,
                 a: p < 0.12 ? p / 0.12 : (p > 0.85 ? (1 - p) / 0.15 : 1) }; }),

    chr('c-schwanken', 'Schwanken', 'Wiegt sich schwer von einer Seite zur anderen',
      (t, A) => ({ rot: sin(t * 0.9) * 0.13 * A, dx: sin(t * 0.9) * 0.06 * A })),

    chr('c-federn', 'Federn', 'Wippt auf einer unsichtbaren Feder',
      (t, A) => { const s = sin(t * 3.1); return { dy: s * 0.07 * A, sy: 1 - s * 0.05 * A, sx: 1 + s * 0.035 * A }; }),

    chr('c-zucken', 'Zucken', 'Zuckt unvermittelt zusammen',
      (t, A) => { const p = (t % 4.4) / 4.4;
        const z = p < 0.08 ? pow(1 - p / 0.08, 2) * sin(p / 0.08 * TAU * 3) : 0;
        return { dx: z * 0.06 * A, dy: z * -0.05 * A, rot: z * 0.09 * A }; }),

    chr('c-schnuppern', 'Schnuppern', 'Beugt sich neugierig vor und zurück',
      (t, A) => { const p = (t % 3.0) / 3.0;
        const n = p < 0.4 ? sin(p / 0.4 * TAU) : 0;
        return { sx: 1 + n * 0.07 * A, sy: 1 - n * 0.04 * A, dx: n * 0.05 * A }; }),

    chr('c-tanzen', 'Tänzeln', 'Wippt im Wechsel von Fuß zu Fuß',
      (t, A) => ({ dx: sin(t * 2.6) * 0.07 * A, dy: -abs(sin(t * 2.6)) * 0.06 * A,
                   rot: sin(t * 2.6) * 0.07 * A })),
  ];

  /* ================================================================
     Einhängen
     ================================================================ */
  SS.ANIM_GROUPS = SS.ANIM_GROUPS || [];
  const textGruppe = SS.ANIM_GROUPS.filter(g => g.textOnly);
  SS.ANIM_GROUPS = SS.ANIM_GROUPS.filter(g => !g.textOnly);
  SS.ANIM_GROUPS.push(
    { id: 'gang',      name: '⇥ Ein- & Ausgang' },
    { id: 'takt',      name: '♪ Im Takt' },
    { id: 'kamera',    name: '◎ Kamera-nah' },
    { id: 'charakter', name: '☺ Charakter' },
  );
  textGruppe.forEach(g => SS.ANIM_GROUPS.push(g));   // Buchstaben bleiben zuletzt

  for (const a of EIN_AUS.concat(IM_TAKT, KAMERA, CHARAKTER)) {
    SS.ANIMS.push(a);
    SS.ANIM_BY_ID[a.id] = a;
  }

  /* ================================================================
     Zwölf weitere Buchstaben-Animationen
     ================================================================ */
  const reveal = (g, n, t, speed, hold) => {
    const p = t * speed - g;
    return cl(p, 0, 1);
  };
  const spring = (p) => (p >= 1 ? 1 : 1 - pow(2, -9 * p) * cos(p * 22));

  const T2 = [
    { id: 't-cursor', name: 'Schreibmaschine mit Cursor', desc: 'Tippt und lässt den Balken blinken',
      charFn: (g, n, t, A) => {
        const bis = (t * 9) % (n + 6);
        if (g < Math.floor(bis)) return { a: 1 };
        if (g === Math.floor(bis)) return { a: (t * 6) % 1 < 0.5 ? 1 : 0.25 };
        return { a: 0 };
      } },

    { id: 't-glitch', name: 'Glitch', desc: 'Einzelne Buchstaben springen kurz aus der Reihe',
      charFn: (g, n, t, A) => {
        const s = sin(g * 12.9898 + 78.233) * 43758.5453;
        const r = s - Math.floor(s);
        const takt = Math.floor(t * 7);
        const treffer = ((takt * 31 + g * 17) % 11) === 0;
        if (!treffer) return {};
        return { dx: (r - 0.5) * 0.22 * A, dy: (r - 0.5) * 0.14 * A, a: 0.55 + r * 0.45 };
      } },

    { id: 't-tafel', name: 'Anzeigetafel', desc: 'Buchstaben rollen wie an einer Abflugtafel ein',
      charFn: (g, n, t, A) => {
        const p = cl(t * 1.3 - g * 0.13, 0, 1);
        if (p >= 1) return { a: 1 };
        const roll = (1 - p) * 3.4;
        return { dy: (roll % 1) * -0.9 * A, a: cl(p * 2.2, 0, 1), sy: 1 - (1 - p) * 0.25 };
      } },

    { id: 't-farbwelle', name: 'Farbwelle', desc: 'Ein Leuchten läuft Buchstabe für Buchstabe durch',
      charFn: (g, n, t, A) => {
        const w = (sin(t * 2.4 - g * 0.7) + 1) / 2;
        return { glow: pow(w, 3) * A, sx: 1 + pow(w, 4) * 0.06 * A, sy: 1 + pow(w, 4) * 0.06 * A };
      } },

    { id: 't-karaoke', name: 'Karaoke', desc: 'Die Zeile füllt sich von links nach rechts',
      charFn: (g, n, t, A) => {
        const bis = (t * 0.9) % 1.3 * n;
        return g <= bis ? { a: 1, sy: 1 + 0.04 * A } : { a: 0.35 };
      } },

    { id: 't-quetschen', name: 'Quetschen', desc: 'Jeder Buchstabe wird kurz breit und wieder schmal',
      charFn: (g, n, t, A) => {
        const q = sin(t * 3.4 - g * 0.5);
        return { sx: 1 + q * 0.14 * A, sy: 1 - q * 0.11 * A };
      } },

    { id: 't-magnet', name: 'Zusammenziehen', desc: 'Buchstaben rücken zusammen und wieder auseinander',
      charFn: (g, n, t, A) => {
        const mitte = (n - 1) / 2;
        const z = (sin(t * 1.2) + 1) / 2;
        return { dx: (mitte - g) * 0.06 * z * A };
      } },

    { id: 't-tanz', name: 'Tanzende Buchstaben', desc: 'Jeder wippt für sich im eigenen Rhythmus',
      charFn: (g, n, t, A) => ({
        dy: sin(t * 3 + g * 1.1) * 0.09 * A,
        rot: cos(t * 2.4 + g * 0.9) * 0.10 * A,
      }) },

    { id: 't-aufblitzen', name: 'Aufblitzen', desc: 'Buchstaben blitzen nacheinander hell auf',
      charFn: (g, n, t, A) => {
        const p = ((t * 1.6 - g * 0.16) % 1.6) / 1.6;
        const b = p < 0.14 ? pow(1 - p / 0.14, 2) : 0;
        return { glow: b * A, sx: 1 + b * 0.12 * A, sy: 1 + b * 0.12 * A };
      } },

    { id: 't-umfallen', name: 'Umfallen', desc: 'Kippt einer nach dem anderen um und richtet sich auf',
      charFn: (g, n, t, A) => {
        const p = ((t * 0.8 - g * 0.1) % 1.8) / 1.8;
        const k = p < 0.5 ? sin(p / 0.5 * Math.PI) : 0;
        return { rot: k * 0.55 * A, dy: k * 0.08 * A };
      } },

    { id: 't-schaukel', name: 'Schaukeln', desc: 'Die Zeile schaukelt wie an einer Schnur',
      charFn: (g, n, t, A) => {
        const mitte = (n - 1) / 2;
        return { rot: sin(t * 1.6) * 0.13 * A, dy: (g - mitte) * sin(t * 1.6) * 0.018 * A };
      } },

    { id: 't-explodieren', name: 'Auseinanderfliegen', desc: 'Fliegt auseinander und findet wieder zusammen',
      charFn: (g, n, t, A) => {
        const p = (t % 3.4) / 3.4;
        const weg = p < 0.45 ? easeOutCubic(p / 0.45) : (p < 0.6 ? 1 : 1 - easeOutCubic((p - 0.6) / 0.4));
        const s = sin(g * 12.9898) * 43758.5453;
        const r1 = s - Math.floor(s);
        const s2 = sin(g * 78.233 + 3.1) * 43758.5453;
        const r2 = s2 - Math.floor(s2);
        return { dx: (r1 - 0.5) * 1.6 * weg * A, dy: (r2 - 0.5) * 1.2 * weg * A,
                 rot: (r1 - 0.5) * 2 * weg * A, a: 1 - weg * 0.35 };
      } },
  ];

  for (const a of T2) {
    a.group = 'text';
    a.perChar = true;
    SS.ANIMS.push(a);
    SS.ANIM_BY_ID[a.id] = a;
  }
  SS.TEXT_ANIM_COUNT = (SS.TEXT_ANIM_COUNT || 0) + T2.length;
})();
