/* Seamless Studio – Sticker-Sets nach Scotts Vorlagen-Blättern (v7.6)
   ============================================================================
   Vier neue Kategorien, gezeichnet nach den Pinterest-Blättern:

     wolken     weiche Aquarell- und Foto-Wolken in Weiß, Rosa, Blau, Grau
                und Gold – wie das Wolken-Blatt
     muscheln   Muscheln, Schnecken, Seestern und Perlen wie das Strand-Blatt
     golddeko   Gold-Elemente: Sonne mit Wellenstrahlen, Mondsichel,
                Schmetterling, Blüte, Stern-Ornament, Schleife, Wachssiegel
     schmuck    Vintage-Schätze mit Perlen und Steinchen: Schmetterlinge,
                Perlenstern, Perlen-Pilz, Mondgesicht, Feenflügel, Kammmuschel

   Zeichenvertrag wie überall: draw(c, s, col) zeichnet ZENTRIERT auf (0,0),
   Höhe s. Alles prozedural mit Verläufen – nichts wird nachgeladen, alle
   Größen bleiben scharf. Die Reiter stehen in index.html (data-cat), die
   App bindet sie beim Laden selbst an.
   ========================================================================= */

(function () {
  if (!SS.STICKERS) return;
  const TAU = Math.PI * 2;

  function rnd(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ================================================================ Wolken
     Grundform: mehrere überlappende Kreisbögen auf einer Basislinie.       */

  function wolkenForm(c, s, hell, mitte, dunkel, seed, flach) {
    const R = rnd(seed);
    const w = s * 1.62, h = s * (flach ? 0.72 : 0.95);
    const n = 7;
    const g = c.createLinearGradient(0, -h * 0.5, 0, h * 0.45);
    g.addColorStop(0, hell); g.addColorStop(0.6, mitte); g.addColorStop(1, dunkel);
    c.fillStyle = g;
    c.beginPath();
    for (let i = 0; i < n; i++) {
      const fx = -w / 2 + (i + 0.5) * (w / n);
      const fr = h * (0.26 + R() * 0.2) * (1 - Math.abs(i - (n - 1) / 2) / n * 0.7);
      const fy = h * 0.16 - fr * 0.95 + (R() - 0.5) * h * 0.07;
      c.moveTo(fx + fr, fy);
      c.arc(fx, fy, fr, 0, TAU);
    }
    /* Basis */
    c.moveTo(-w / 2 + h * 0.1, h * 0.16);
    c.ellipse(0, h * 0.14, w / 2 - h * 0.06, h * 0.30, 0, 0, TAU);
    c.fill();
  }

  const WOLKEN = [
    { id: 'wo-weich', name: 'Weiche Wolke', ar: 1.7, draw: (c, s) => wolkenForm(c, s, '#ffffff', '#f2f4f6', '#d7dde3', 11, false) },
    { id: 'wo-rosa', name: 'Rosa Wolke', ar: 1.7, draw: (c, s) => wolkenForm(c, s, '#ffe9ef', '#f6c9d6', '#e6a4ba', 23, false) },
    { id: 'wo-abend', name: 'Abendrot-Wolke', ar: 1.7, draw: (c, s) => wolkenForm(c, s, '#ffe3c9', '#f6b98f', '#dd8d6b', 37, false) },
    { id: 'wo-blau', name: 'Blaue Wolke', ar: 1.7, draw: (c, s) => wolkenForm(c, s, '#e8f1fb', '#b9d0ea', '#8aa9cf', 41, false) },
    { id: 'wo-nacht', name: 'Nachtblau-Wolke', ar: 1.7, draw: (c, s) => wolkenForm(c, s, '#93a7d8', '#6882be', '#4d63a2', 53, false) },
    { id: 'wo-grau', name: 'Regenwolke', ar: 1.7, draw: (c, s) => wolkenForm(c, s, '#f0f0f0', '#c9c9cc', '#96979d', 61, true) },
    { id: 'wo-gold', name: 'Goldene Wolke', ar: 1.7, draw: (c, s) => wolkenForm(c, s, '#fbeccb', '#e9cf96', '#c8a765', 71, true) },
    {
      id: 'wo-wirbel', name: 'Wirbel-Wolke', ar: 1.5,
      draw: (c, s) => {
        wolkenForm(c, s * 0.92, '#eef4fa', '#cddff0', '#a4c2de', 83, false);
        c.strokeStyle = 'rgba(255,255,255,.85)';
        c.lineWidth = s * 0.035; c.lineCap = 'round';
        for (const [fx, fy, fr] of [[-0.3, -0.02, 0.14], [0.08, -0.1, 0.18], [0.38, 0.02, 0.12]]) {
          c.beginPath();
          c.arc(s * fx, s * fy, s * fr, 0.4, 0.4 + TAU * 0.78);
          c.stroke();
        }
      },
    },
    {
      id: 'wo-glitzer', name: 'Rosa Glitzerwolke', ar: 1.7,
      draw: (c, s) => {
        wolkenForm(c, s, '#ffd9e4', '#f4a9c0', '#dd7fa0', 97, false);
        const R = rnd(5);
        c.fillStyle = 'rgba(255,255,255,.9)';
        for (let i = 0; i < 16; i++) {
          const x = (R() - 0.5) * s * 1.4, y = (R() - 0.6) * s * 0.5;
          c.beginPath(); c.arc(x, y, s * (0.006 + R() * 0.012), 0, TAU); c.fill();
        }
      },
    },
  ];

  /* ================================================================ Muscheln */

  function perlmutt(c, x, y, r, warm) {
    const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.5, warm ? '#fbeadd' : '#f3edf5');
    g.addColorStop(1, warm ? '#d9bfa8' : '#c6b8c9');
    c.fillStyle = g;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.95)';
    c.beginPath(); c.arc(x - r * 0.3, y - r * 0.35, r * 0.2, 0, TAU); c.fill();
  }

  function kammmuschel(c, s, hell, dunkel) {
    const r = s * 0.5;
    const g = c.createLinearGradient(0, -r, 0, r * 0.8);
    g.addColorStop(0, hell); g.addColorStop(1, dunkel);
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(0, r * 0.85);
    for (let i = 0; i <= 9; i++) {
      const a = Math.PI + (i / 9) * Math.PI;
      const rr2 = r * (i % 2 ? 1 : 0.93);
      c.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2 * 0.9 + r * 0.05);
    }
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(120,90,75,.35)';
    c.lineWidth = s * 0.012;
    for (let i = 1; i < 9; i++) {
      const a = Math.PI + (i / 9) * Math.PI;
      c.beginPath();
      c.moveTo(0, r * 0.8);
      c.lineTo(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.85 + r * 0.05);
      c.stroke();
    }
    /* Schloss unten */
    c.fillStyle = dunkel;
    c.beginPath(); c.arc(0, r * 0.85, r * 0.14, 0, TAU); c.fill();
  }

  const MUSCHELN = [
    { id: 'mu-kamm-rosa', name: 'Kammmuschel rosa', draw: (c, s) => kammmuschel(c, s, '#f7d3cd', '#dd9d92') },
    { id: 'mu-kamm-sand', name: 'Kammmuschel sand', draw: (c, s) => kammmuschel(c, s, '#f3e6d2', '#cbab84') },
    {
      id: 'mu-schnecke', name: 'Meeresschnecke',
      draw: (c, s) => {
        c.save(); c.rotate(-0.5);
        const g = c.createLinearGradient(-s * 0.4, 0, s * 0.5, 0);
        g.addColorStop(0, '#f6ead6'); g.addColorStop(1, '#c99e6f');
        c.fillStyle = g;
        c.beginPath();
        c.ellipse(0, 0, s * 0.46, s * 0.3, 0.2, 0, TAU); c.fill();
        /* Spitze */
        c.beginPath();
        c.moveTo(s * 0.34, -s * 0.16);
        c.lineTo(s * 0.55, -s * 0.34);
        c.lineTo(s * 0.42, 0);
        c.closePath(); c.fill();
        /* Öffnung */
        c.fillStyle = '#a97c54';
        c.beginPath(); c.ellipse(-s * 0.16, s * 0.1, s * 0.2, s * 0.12, 0.3, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(120,88,58,.4)'; c.lineWidth = s * 0.014;
        for (let i = 0; i < 4; i++) {
          c.beginPath();
          c.ellipse(s * 0.05 + i * s * 0.09, -i * s * 0.045, s * (0.34 - i * 0.07), s * (0.22 - i * 0.045), 0.2, -0.8, 1.6);
          c.stroke();
        }
        c.restore();
      },
    },
    {
      id: 'mu-spirale', name: 'Perlmutt-Spirale',
      draw: (c, s) => {
        const g = c.createRadialGradient(-s * 0.1, -s * 0.1, s * 0.05, 0, 0, s * 0.5);
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, '#efe6da'); g.addColorStop(1, '#c9b394');
        c.fillStyle = g;
        c.beginPath(); c.arc(0, 0, s * 0.46, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(140,115,88,.5)'; c.lineWidth = s * 0.02; c.lineCap = 'round';
        c.beginPath();
        for (let a = 0; a < TAU * 2.6; a += 0.1) {
          const r = s * 0.05 + (a / (TAU * 2.6)) * s * 0.4;
          const x = Math.cos(a) * r, y = Math.sin(a) * r;
          a === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
        }
        c.stroke();
      },
    },
    {
      id: 'mu-seestern', name: 'Seestern',
      draw: (c, s, col) => {
        c.save(); c.rotate(-0.2);
        const g = c.createLinearGradient(0, -s * 0.5, 0, s * 0.5);
        g.addColorStop(0, '#f2e3ce'); g.addColorStop(1, '#d3b48b');
        c.fillStyle = g;
        c.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI / 2 + (i / 5) * TAU;         // Armspitze
          const b = a + TAU / 10;                          // Tal dazwischen
          const spitzL = a - 0.16, spitzR = a + 0.16;
          if (i === 0) c.moveTo(Math.cos(spitzL) * s * 0.5, Math.sin(spitzL) * s * 0.5);
          /* runde Armspitze */
          c.quadraticCurveTo(Math.cos(a) * s * 0.56, Math.sin(a) * s * 0.56,
            Math.cos(spitzR) * s * 0.5, Math.sin(spitzR) * s * 0.5);
          /* tiefes Tal zum nächsten Arm */
          const naechster = b + TAU / 10 - 0.16;
          c.quadraticCurveTo(Math.cos(b) * s * 0.14, Math.sin(b) * s * 0.14,
            Math.cos(naechster) * s * 0.5, Math.sin(naechster) * s * 0.5);
        }
        c.closePath(); c.fill();
        c.fillStyle = 'rgba(255,255,255,.5)';
        const R = rnd(9);
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI / 2 + (i / 5) * TAU;
          for (let d = 0.14; d < 0.42; d += 0.09) {
            c.beginPath();
            c.arc(Math.cos(a) * s * d, Math.sin(a) * s * d, s * (0.012 + R() * 0.008), 0, TAU);
            c.fill();
          }
        }
        c.restore();
      },
    },
    { id: 'mu-perle', name: 'Perle', draw: (c, s) => perlmutt(c, 0, 0, s * 0.42, true) },
    {
      id: 'mu-perlen3', name: 'Perlen-Trio',
      draw: (c, s) => {
        perlmutt(c, -s * 0.26, s * 0.14, s * 0.2, true);
        perlmutt(c, s * 0.1, -s * 0.16, s * 0.26, false);
        perlmutt(c, s * 0.32, s * 0.2, s * 0.16, true);
      },
    },
    {
      id: 'mu-hibiskus', name: 'Hibiskus',
      draw: (c, s) => {
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI / 2 + (i / 5) * TAU;
          const g = c.createLinearGradient(0, 0, Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.5);
          g.addColorStop(0, '#fbe6ee'); g.addColorStop(0.75, '#ef9cbf'); g.addColorStop(1, '#e07ba6');
          c.fillStyle = g;
          c.save(); c.rotate(a);
          c.beginPath();
          c.moveTo(0, 0);
          /* breite, überlappende Blütenblätter mit gewelltem Rand */
          c.bezierCurveTo(s * 0.16, -s * 0.34, s * 0.44, -s * 0.30, s * 0.48, -s * 0.06);
          c.quadraticCurveTo(s * 0.52, 0, s * 0.48, s * 0.06);
          c.bezierCurveTo(s * 0.44, s * 0.30, s * 0.16, s * 0.34, 0, 0);
          c.closePath(); c.fill();
          c.strokeStyle = 'rgba(200,90,140,.35)'; c.lineWidth = s * 0.008;
          c.beginPath(); c.moveTo(s * 0.06, 0); c.lineTo(s * 0.4, 0); c.stroke();
          c.restore();
        }
        c.strokeStyle = '#d16f96'; c.lineWidth = s * 0.02; c.lineCap = 'round';
        c.beginPath(); c.moveTo(0, 0); c.lineTo(s * 0.16, -s * 0.2); c.stroke();
        c.fillStyle = '#e8c25c';
        for (let i = 0; i < 4; i++) {
          c.beginPath();
          c.arc(s * (0.15 + i * 0.02), -s * (0.2 + i * 0.025), s * 0.022, 0, TAU);
          c.fill();
        }
      },
    },
    {
      id: 'mu-muschelperle', name: 'Muschel mit Perle',
      draw: (c, s) => {
        c.save(); c.translate(0, s * 0.08);
        kammmuschel(c, s * 0.9, '#f4ddd6', '#d29c8c');
        perlmutt(c, 0, -s * 0.04, s * 0.14, false);
        c.restore();
      },
    },
  ];

  /* ================================================================ Gold */

  function goldVerlauf(c, x0, y0, x1, y1) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, '#f4dfa0');
    g.addColorStop(0.45, '#dcb35e');
    g.addColorStop(0.7, '#b98a3a');
    g.addColorStop(1, '#e8cd8a');
    return g;
  }

  const GOLD = [
    {
      id: 'go-sonne', name: 'Gold-Sonne',
      draw: (c, s) => {
        c.fillStyle = goldVerlauf(c, 0, -s * 0.5, 0, s * 0.5);
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * TAU;
          const lang = i % 2 === 0;
          const L = s * (lang ? 0.5 : 0.4);
          c.save(); c.rotate(a);
          c.beginPath();
          c.moveTo(s * 0.16, 0);
          /* wellige Strahlen */
          c.quadraticCurveTo(L * 0.5, s * (lang ? 0.05 : -0.04), L, 0);
          c.quadraticCurveTo(L * 0.5, s * (lang ? -0.018 : 0.018), s * 0.16, s * 0.018);
          c.closePath(); c.fill();
          c.restore();
        }
        const g = c.createRadialGradient(-s * 0.06, -s * 0.08, s * 0.02, 0, 0, s * 0.2);
        g.addColorStop(0, '#f8e8b8'); g.addColorStop(1, '#c39440');
        c.fillStyle = g;
        c.beginPath(); c.arc(0, 0, s * 0.19, 0, TAU); c.fill();
      },
    },
    {
      id: 'go-mond', name: 'Gold-Mond',
      draw: (c, s) => {
        c.fillStyle = goldVerlauf(c, -s * 0.3, -s * 0.4, s * 0.3, s * 0.45);
        c.beginPath();
        c.arc(0, 0, s * 0.46, Math.PI * 0.42, Math.PI * 1.62);
        c.arc(s * 0.2, -s * 0.06, s * 0.36, Math.PI * 1.55, Math.PI * 0.52, true);
        c.closePath(); c.fill();
        c.strokeStyle = 'rgba(120,86,30,.4)'; c.lineWidth = s * 0.012;
        c.beginPath();
        c.arc(0, 0, s * 0.46, Math.PI * 0.42, Math.PI * 1.62);
        c.stroke();
      },
    },
    {
      id: 'go-falter', name: 'Gold-Falter',
      draw: (c, s) => {
        const fl = (sp, ob) => {
          c.save(); c.scale(sp, 1);
          c.fillStyle = goldVerlauf(c, 0, ob ? -s * 0.4 : 0, s * 0.45, ob ? 0 : s * 0.35);
          c.beginPath();
          if (ob) {
            c.moveTo(s * 0.02, -s * 0.02);
            c.bezierCurveTo(s * 0.34, -s * 0.5, s * 0.52, -s * 0.34, s * 0.44, -s * 0.06);
            c.bezierCurveTo(s * 0.4, s * 0.05, s * 0.16, s * 0.05, s * 0.02, -s * 0.02);
          } else {
            c.moveTo(s * 0.02, s * 0.03);
            c.bezierCurveTo(s * 0.3, s * 0.05, s * 0.4, s * 0.2, s * 0.28, s * 0.4);
            c.bezierCurveTo(s * 0.14, s * 0.5, s * 0.03, s * 0.26, s * 0.02, s * 0.03);
          }
          c.closePath(); c.fill();
          c.strokeStyle = 'rgba(255,244,214,.6)';
          c.lineWidth = s * 0.014;
          c.stroke();
          c.restore();
        };
        fl(1, true); fl(-1, true); fl(1, false); fl(-1, false);
        c.fillStyle = '#8a6426';
        c.beginPath(); c.ellipse(0, 0, s * 0.035, s * 0.16, 0, 0, TAU); c.fill();
        c.strokeStyle = '#8a6426'; c.lineWidth = s * 0.012; c.lineCap = 'round';
        c.beginPath(); c.moveTo(0, -s * 0.14); c.quadraticCurveTo(-s * 0.1, -s * 0.3, -s * 0.14, -s * 0.34); c.stroke();
        c.beginPath(); c.moveTo(0, -s * 0.14); c.quadraticCurveTo(s * 0.1, -s * 0.3, s * 0.14, -s * 0.34); c.stroke();
      },
    },
    {
      id: 'go-bluete', name: 'Gold-Blüte',
      draw: (c, s) => {
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI / 2 + (i / 5) * TAU;
          c.save(); c.rotate(a);
          c.fillStyle = goldVerlauf(c, 0, -s * 0.1, s * 0.5, s * 0.1);
          c.beginPath();
          c.moveTo(s * 0.03, 0);
          c.bezierCurveTo(s * 0.18, -s * 0.26, s * 0.48, -s * 0.18, s * 0.5, 0);
          c.bezierCurveTo(s * 0.48, s * 0.18, s * 0.18, s * 0.26, s * 0.03, 0);
          c.closePath(); c.fill();
          c.strokeStyle = 'rgba(150,108,40,.45)'; c.lineWidth = s * 0.01;
          c.beginPath(); c.moveTo(s * 0.08, 0); c.lineTo(s * 0.42, 0); c.stroke();
          c.restore();
        }
        const g = c.createRadialGradient(0, 0, 0, 0, 0, s * 0.14);
        g.addColorStop(0, '#fdf0c8'); g.addColorStop(1, '#c1963f');
        c.fillStyle = g;
        c.beginPath(); c.arc(0, 0, s * 0.13, 0, TAU); c.fill();
      },
    },
    {
      id: 'go-stern', name: 'Gold-Stern-Ornament',
      draw: (c, s) => {
        c.fillStyle = goldVerlauf(c, 0, -s * 0.5, 0, s * 0.5);
        const zack = (n, r1, r2, rot) => {
          c.save(); c.rotate(rot || 0);
          c.beginPath();
          for (let i = 0; i < n * 2; i++) {
            const a = -Math.PI / 2 + (i / (n * 2)) * TAU;
            const r = i % 2 === 0 ? r1 : r2;
            c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
          c.closePath(); c.fill();
          c.restore();
        };
        zack(4, s * 0.5, s * 0.13);
        zack(4, s * 0.34, s * 0.10, Math.PI / 4);
        c.fillStyle = 'rgba(255,246,220,.85)';
        c.beginPath(); c.arc(0, 0, s * 0.06, 0, TAU); c.fill();
      },
    },
    {
      id: 'go-schleife', name: 'Gold-Schleife',
      draw: (c, s) => {
        const seite = (sp) => {
          c.save(); c.scale(sp, 1);
          c.fillStyle = goldVerlauf(c, 0, -s * 0.2, s * 0.5, s * 0.2);
          c.beginPath();
          c.moveTo(s * 0.02, 0);
          c.bezierCurveTo(s * 0.2, -s * 0.3, s * 0.5, -s * 0.26, s * 0.46, -s * 0.05);
          c.bezierCurveTo(s * 0.43, s * 0.12, s * 0.2, s * 0.14, s * 0.02, 0);
          c.closePath(); c.fill();
          c.strokeStyle = 'rgba(140,100,38,.5)'; c.lineWidth = s * 0.012;
          c.stroke();
          /* Band nach unten */
          c.fillStyle = goldVerlauf(c, 0, 0, s * 0.3, s * 0.45);
          c.beginPath();
          c.moveTo(s * 0.04, s * 0.05);
          c.quadraticCurveTo(s * 0.22, s * 0.22, s * 0.16, s * 0.42);
          c.lineTo(s * 0.28, s * 0.4);
          c.quadraticCurveTo(s * 0.3, s * 0.2, s * 0.1, s * 0.02);
          c.closePath(); c.fill();
          c.restore();
        };
        seite(1); seite(-1);
        const g = c.createRadialGradient(0, 0, 0, 0, 0, s * 0.1);
        g.addColorStop(0, '#f8e9bd'); g.addColorStop(1, '#b98a3a');
        c.fillStyle = g;
        c.beginPath(); c.arc(0, 0, s * 0.09, 0, TAU); c.fill();
      },
    },
    {
      id: 'go-siegel-rose', name: 'Wachssiegel Rose',
      draw: (c, s) => {
        const R = rnd(3);
        c.fillStyle = goldVerlauf(c, -s * 0.4, -s * 0.4, s * 0.4, s * 0.4);
        c.beginPath();
        for (let a = 0; a < TAU; a += 0.22) {
          const r = s * 0.45 * (0.92 + R() * 0.12);
          const x = Math.cos(a) * r, y = Math.sin(a) * r;
          a === 0 ? c.moveTo(x, y) : c.quadraticCurveTo(
            Math.cos(a - 0.11) * r * 1.06, Math.sin(a - 0.11) * r * 1.06, x, y);
        }
        c.closePath(); c.fill();
        c.strokeStyle = 'rgba(255,244,214,.5)'; c.lineWidth = s * 0.02;
        c.beginPath(); c.arc(0, 0, s * 0.33, 0, TAU); c.stroke();
        /* Rose eingeprägt */
        c.strokeStyle = 'rgba(120,86,30,.75)'; c.lineWidth = s * 0.02; c.lineCap = 'round';
        c.beginPath();
        for (let a = 0; a < TAU * 1.8; a += 0.12) {
          const r = s * 0.02 + (a / (TAU * 1.8)) * s * 0.13;
          const x = Math.cos(a) * r, y = -s * 0.06 + Math.sin(a) * r * 0.85;
          a === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
        }
        c.stroke();
        c.beginPath(); c.moveTo(0, s * 0.04); c.quadraticCurveTo(s * 0.02, s * 0.16, 0, s * 0.24); c.stroke();
        c.beginPath(); c.moveTo(0, s * 0.12); c.quadraticCurveTo(s * 0.12, s * 0.08, s * 0.16, s * 0.02); c.stroke();
        c.beginPath(); c.moveTo(0, s * 0.12); c.quadraticCurveTo(-s * 0.12, s * 0.08, -s * 0.16, s * 0.02); c.stroke();
      },
    },
    {
      id: 'go-siegel-mond', name: 'Wachssiegel Mond',
      draw: (c, s) => {
        const R = rnd(17);
        c.fillStyle = goldVerlauf(c, -s * 0.35, -s * 0.4, s * 0.35, s * 0.4);
        c.beginPath();
        for (let a = 0; a < TAU; a += 0.24) {
          const r = s * 0.44 * (0.9 + R() * 0.14);
          const x = Math.cos(a) * r, y = Math.sin(a) * r;
          a === 0 ? c.moveTo(x, y) : c.quadraticCurveTo(
            Math.cos(a - 0.12) * r * 1.07, Math.sin(a - 0.12) * r * 1.07, x, y);
        }
        c.closePath(); c.fill();
        c.strokeStyle = 'rgba(120,86,30,.7)'; c.lineWidth = s * 0.022; c.lineCap = 'round';
        c.beginPath();
        c.arc(0, 0, s * 0.2, Math.PI * 0.35, Math.PI * 1.68);
        c.stroke();
        c.fillStyle = 'rgba(120,86,30,.7)';
        for (const [fx, fy] of [[0.16, -0.14], [0.22, 0.02], [0.14, 0.16]]) {
          c.beginPath(); c.arc(s * fx, s * fy, s * 0.022, 0, TAU); c.fill();
        }
      },
    },
    {
      id: 'go-weihstern', name: 'Gold-Poinsettia',
      draw: (c, s) => {
        for (let lage = 0; lage < 2; lage++) {
          const n = 6, off = lage * (TAU / 12), L = s * (lage ? 0.34 : 0.48);
          for (let i = 0; i < n; i++) {
            const a = -Math.PI / 2 + (i / n) * TAU + off;
            c.save(); c.rotate(a);
            c.fillStyle = lage
              ? goldVerlauf(c, 0, -s * 0.06, L, s * 0.06)
              : (() => { const g = c.createLinearGradient(0, 0, L, 0); g.addColorStop(0, '#efe0c0'); g.addColorStop(1, '#cdb083'); return g; })();
            c.beginPath();
            c.moveTo(s * 0.04, 0);
            c.quadraticCurveTo(L * 0.4, -L * 0.3, L, 0);
            c.quadraticCurveTo(L * 0.4, L * 0.3, s * 0.04, 0);
            c.closePath(); c.fill();
            c.strokeStyle = 'rgba(150,116,54,.4)'; c.lineWidth = s * 0.008;
            c.beginPath(); c.moveTo(s * 0.06, 0); c.lineTo(L * 0.85, 0); c.stroke();
            c.restore();
          }
        }
        c.fillStyle = '#c1963f';
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU;
          c.beginPath();
          c.arc(Math.cos(a) * s * 0.05, Math.sin(a) * s * 0.05, s * 0.028, 0, TAU);
          c.fill();
        }
      },
    },
  ];

  /* ================================================================ Schmuck
     Vintage-Schätze: Perlen + Steinchen auf zarten Formen.                 */

  function steinchen(c, x, y, r, farbe) {
    const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.45, farbe);
    g.addColorStop(1, 'rgba(90,70,50,.9)');
    c.fillStyle = g;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }

  function fluegelpaar(c, s, hell, dunkel, adern) {
    const fl = (sp) => {
      c.save(); c.scale(sp, 1);
      const g = c.createLinearGradient(0, -s * 0.4, s * 0.5, s * 0.3);
      g.addColorStop(0, hell); g.addColorStop(1, dunkel);
      c.fillStyle = g; c.globalAlpha *= 0.92;
      c.beginPath();
      c.moveTo(s * 0.02, -s * 0.02);
      c.bezierCurveTo(s * 0.36, -s * 0.52, s * 0.56, -s * 0.3, s * 0.42, -s * 0.04);
      c.bezierCurveTo(s * 0.52, s * 0.12, s * 0.3, s * 0.42, s * 0.1, s * 0.3);
      c.bezierCurveTo(s * 0.04, s * 0.2, s * 0.02, s * 0.08, s * 0.02, -s * 0.02);
      c.closePath(); c.fill();
      c.globalAlpha /= 0.92;
      if (adern) {
        c.strokeStyle = adern; c.lineWidth = s * 0.01;
        for (const [tx, ty] of [[0.4, -0.3], [0.44, -0.1], [0.36, 0.14], [0.2, 0.3]]) {
          c.beginPath(); c.moveTo(s * 0.04, 0);
          c.quadraticCurveTo(s * tx * 0.5, s * ty * 0.6, s * tx, s * ty);
          c.stroke();
        }
      }
      c.restore();
    };
    fl(1); fl(-1);
  }

  const SCHMUCK = [
    {
      id: 'sk-falter-tuerkis', name: 'Juwelen-Falter türkis',
      draw: (c, s) => {
        fluegelpaar(c, s, '#9fd8cd', '#4f9d92', 'rgba(40,80,72,.4)');
        c.fillStyle = '#5b4a38';
        c.beginPath(); c.ellipse(0, 0, s * 0.035, s * 0.18, 0, 0, TAU); c.fill();
        const R = rnd(21);
        for (let i = 0; i < 10; i++) {
          const sp2 = i % 2 ? 1 : -1;
          steinchen(c, sp2 * s * (0.1 + R() * 0.3), (R() - 0.5) * s * 0.5, s * (0.015 + R() * 0.02), '#e8ddca');
        }
      },
    },
    {
      id: 'sk-falter-rosa', name: 'Juwelen-Falter rosa',
      draw: (c, s) => {
        fluegelpaar(c, s, '#f3c3d8', '#cd8bab', 'rgba(120,60,90,.35)');
        c.fillStyle = '#6b5340';
        c.beginPath(); c.ellipse(0, 0, s * 0.035, s * 0.18, 0, 0, TAU); c.fill();
        const R = rnd(33);
        for (let i = 0; i < 8; i++) {
          const sp2 = i % 2 ? 1 : -1;
          steinchen(c, sp2 * s * (0.12 + R() * 0.28), (R() - 0.5) * s * 0.45, s * (0.014 + R() * 0.018), '#f6e7d6');
        }
      },
    },
    {
      id: 'sk-fluegel', name: 'Feenflügel',
      draw: (c, s) => {
        c.save(); c.rotate(0.5);
        const g = c.createLinearGradient(0, -s * 0.5, s * 0.3, s * 0.4);
        g.addColorStop(0, 'rgba(244,236,220,.95)');
        g.addColorStop(0.6, 'rgba(228,208,178,.85)');
        g.addColorStop(1, 'rgba(196,164,120,.8)');
        c.fillStyle = g;
        c.beginPath();
        c.moveTo(-s * 0.1, s * 0.42);
        c.bezierCurveTo(-s * 0.2, -s * 0.1, s * 0.05, -s * 0.46, s * 0.3, -s * 0.5);
        c.bezierCurveTo(s * 0.2, -s * 0.2, s * 0.22, 0, s * 0.06, s * 0.16);
        c.bezierCurveTo(s * 0.1, s * 0.26, 0, s * 0.4, -s * 0.1, s * 0.42);
        c.closePath(); c.fill();
        c.strokeStyle = 'rgba(150,118,72,.45)'; c.lineWidth = s * 0.012;
        for (const t of [0.25, 0.5, 0.75]) {
          c.beginPath();
          c.moveTo(-s * 0.08, s * 0.38);
          c.quadraticCurveTo(s * 0.05 * t, -s * 0.1 * t, s * (0.28 - t * 0.1), -s * (0.48 - t * 0.28));
          c.stroke();
        }
        c.restore();
      },
    },
    {
      id: 'sk-perlenstern', name: 'Perlen-Stern',
      draw: (c, s) => {
        c.fillStyle = (() => { const g = c.createLinearGradient(0, -s * 0.5, 0, s * 0.5); g.addColorStop(0, '#e8d8b8'); g.addColorStop(1, '#bd9c62'); return g; })();
        c.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + (i / 10) * TAU;
          const r = i % 2 === 0 ? s * 0.5 : s * 0.24;
          c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        c.closePath(); c.fill();
        const R = rnd(7);
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI / 2 + (i / 5) * TAU;
          steinchen(c, Math.cos(a) * s * 0.3, Math.sin(a) * s * 0.3, s * 0.035, '#efe4d2');
        }
        perlmutt(c, 0, 0, s * 0.12, true);
        for (let i = 0; i < 8; i++) {
          steinchen(c, (R() - 0.5) * s * 0.4, (R() - 0.5) * s * 0.4, s * 0.014, '#fdf6e8');
        }
      },
    },
    {
      id: 'sk-pilz', name: 'Perlen-Pilz',
      draw: (c, s) => {
        /* Stiel */
        const g1 = c.createLinearGradient(-s * 0.12, 0, s * 0.12, 0);
        g1.addColorStop(0, '#efe6d4'); g1.addColorStop(0.5, '#f8f2e5'); g1.addColorStop(1, '#d9cbb2');
        c.fillStyle = g1;
        c.beginPath();
        c.moveTo(-s * 0.1, -s * 0.02);
        c.quadraticCurveTo(-s * 0.14, s * 0.3, -s * 0.2, s * 0.44);
        c.lineTo(s * 0.2, s * 0.44);
        c.quadraticCurveTo(s * 0.14, s * 0.3, s * 0.1, -s * 0.02);
        c.closePath(); c.fill();
        c.strokeStyle = 'rgba(150,128,96,.4)'; c.lineWidth = s * 0.01;
        for (let i = -2; i <= 2; i++) {
          c.beginPath();
          c.moveTo(i * s * 0.045, s * 0.0);
          c.lineTo(i * s * 0.08, s * 0.42);
          c.stroke();
        }
        /* Hut */
        const g2 = c.createLinearGradient(0, -s * 0.44, 0, 0);
        g2.addColorStop(0, '#d8c8ac'); g2.addColorStop(1, '#a88c60');
        c.fillStyle = g2;
        c.beginPath();
        c.moveTo(-s * 0.44, -s * 0.02);
        c.bezierCurveTo(-s * 0.4, -s * 0.42, s * 0.4, -s * 0.42, s * 0.44, -s * 0.02);
        c.closePath(); c.fill();
        /* Perlenrand + Perlen auf dem Hut */
        const R = rnd(29);
        for (let i = 0; i <= 10; i++) {
          const x = -s * 0.42 + (i / 10) * s * 0.84;
          steinchen(c, x, -s * 0.02, s * 0.024, '#f3ead8');
        }
        perlmutt(c, -s * 0.1, -s * 0.26, s * 0.06, true);
        perlmutt(c, s * 0.12, -s * 0.3, s * 0.05, false);
        for (let i = 0; i < 6; i++) {
          steinchen(c, (R() - 0.5) * s * 0.6, -s * (0.1 + R() * 0.24), s * 0.014, '#fdf6e8');
        }
      },
    },
    {
      id: 'sk-mondgesicht', name: 'Mond mit Gesicht',
      draw: (c, s) => {
        c.fillStyle = goldVerlauf(c, -s * 0.3, -s * 0.4, s * 0.3, s * 0.45);
        c.beginPath();
        c.arc(0, 0, s * 0.46, Math.PI * 0.42, Math.PI * 1.62);
        c.arc(s * 0.22, -s * 0.04, s * 0.34, Math.PI * 1.5, Math.PI * 0.56, true);
        c.closePath(); c.fill();
        /* Gesicht */
        c.strokeStyle = 'rgba(110,80,30,.7)'; c.lineWidth = s * 0.018; c.lineCap = 'round';
        c.beginPath(); c.arc(-s * 0.2, -s * 0.1, s * 0.045, Math.PI * 0.1, Math.PI * 0.9); c.stroke();
        c.beginPath(); c.moveTo(-s * 0.3, s * 0.02); c.quadraticCurveTo(-s * 0.26, s * 0.07, -s * 0.3, s * 0.1); c.stroke();
        c.beginPath(); c.moveTo(-s * 0.28, s * 0.2); c.quadraticCurveTo(-s * 0.2, s * 0.27, -s * 0.12, s * 0.24); c.stroke();
        /* kleiner Stern daneben */
        c.fillStyle = '#d8b86a';
        c.save(); c.translate(s * 0.3, s * 0.3);
        c.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = -Math.PI / 2 + (i / 8) * TAU;
          const r = i % 2 === 0 ? s * 0.1 : s * 0.04;
          c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        c.closePath(); c.fill();
        c.restore();
      },
    },
    {
      id: 'sk-kammperlen', name: 'Muschel mit Steinchen',
      draw: (c, s) => {
        kammmuschel(c, s * 0.92, '#cfd8d4', '#8fa39c');
        for (let i = 0; i <= 6; i++) {
          const a = Math.PI + (i / 6) * Math.PI;
          steinchen(c, Math.cos(a) * s * 0.42, Math.sin(a) * s * 0.38 + s * 0.02, s * 0.028, '#f0e8da');
        }
        perlmutt(c, 0, s * 0.18, s * 0.08, false);
      },
    },
    {
      id: 'sk-siegel-qualle', name: 'Nacht-Medaillon',
      draw: (c, s) => {
        /* dunkle Münze mit Sternenstaub */
        const g = c.createRadialGradient(-s * 0.1, -s * 0.14, s * 0.05, 0, 0, s * 0.48);
        g.addColorStop(0, '#3d4668'); g.addColorStop(1, '#232a45');
        c.fillStyle = g;
        c.beginPath(); c.arc(0, 0, s * 0.45, 0, TAU); c.fill();
        c.strokeStyle = '#c5a35e'; c.lineWidth = s * 0.05;
        c.beginPath(); c.arc(0, 0, s * 0.45, 0, TAU); c.stroke();
        const R = rnd(13);
        c.fillStyle = 'rgba(230,220,190,.9)';
        for (let i = 0; i < 26; i++) {
          const a = R() * TAU, r = R() * s * 0.36;
          c.beginPath(); c.arc(Math.cos(a) * r, Math.sin(a) * r, s * (0.006 + R() * 0.01), 0, TAU); c.fill();
        }
        /* Qualle eingeprägt */
        c.strokeStyle = '#d8c184'; c.lineWidth = s * 0.016; c.lineCap = 'round';
        c.beginPath(); c.arc(0, -s * 0.04, s * 0.13, Math.PI, 0); c.stroke();
        for (let i = -2; i <= 2; i++) {
          c.beginPath();
          c.moveTo(i * s * 0.055, -s * 0.02);
          c.quadraticCurveTo(i * s * 0.07, s * 0.1, i * s * 0.04, s * 0.18);
          c.stroke();
        }
      },
    },
  ];

  /* ---------------- eintragen ---------------- */
  const ALLE = [
    ...WOLKEN.map(d => Object.assign(d, { cat: 'wolken' })),
    ...MUSCHELN.map(d => Object.assign(d, { cat: 'muscheln' })),
    ...GOLD.map(d => Object.assign(d, { cat: 'golddeko' })),
    ...SCHMUCK.map(d => Object.assign(d, { cat: 'schmuck' })),
  ];
  for (const d of ALLE) {
    if (!SS.STICKERS.some(x => x.id === d.id)) SS.STICKERS.push(d);
  }

  SS.STICKER76 = { bereit: true, anzahl: ALLE.length };
})();
