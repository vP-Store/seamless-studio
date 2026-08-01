/* Seamless Studio – Profilraster-Vorschau
   ============================================================================
   Instagram zeigt Beitraege im Feed als 4:5, schneidet sie im Profilraster
   aber auf 3:4 zu – seitlich faellt also etwas weg. Die Ueberlagerung dafuer
   gibt es schon (Raster-Menue, "3:4-Profilraster"). Was fehlte: einmal SEHEN,
   wie die erste Slide tatsaechlich im Profil liegt, zwischen anderen Kacheln,
   klein und beschnitten. Genau dafuer ist dieser Dialog.

   Er zeichnet ein Profil-Mockup: Kopfzeile, 3x2-Raster aus 3:4-Kacheln,
   deine gewaehlte Slide oben links (dort landet der neueste Beitrag), der
   Rest neutrale Platzhalter. Mit den Pfeilen laesst sich jede Slide als
   "Titelbild" durchprobieren. Nur Anzeige – exportiert wird hier nichts.
   ========================================================================= */

(function () {
  if (!SS.ui || typeof SS.paintScene !== 'function') return;

  let slideNr = 0;

  /* ---------------------------------------------------------------- Dialog */
  function bauen() {
    if (document.getElementById('prasterDlg')) return;
    const d = document.createElement('div');
    d.id = 'prasterDlg';
    d.className = 'modal hidden';
    d.innerHTML =
      '<div class="modal-card" style="max-width:420px">' +
        '<div class="sort-head"><h3>So liegt es im Profil</h3><button id="prClose">✕</button></div>' +
        '<canvas id="prCanvas" style="width:100%;border-radius:10px;display:block"></canvas>' +
        '<div class="ctl" style="justify-content:center;gap:14px;margin-top:10px">' +
          '<button id="prVor">‹</button>' +
          '<span class="val" id="prLabel" style="min-width:90px;text-align:center">Slide 1</span>' +
          '<button id="prZur">›</button>' +
        '</div>' +
        '<p class="hint">Oben links liegt der neueste Beitrag. Instagram beschneidet ' +
        'deine 4:5-Slide im Profil seitlich auf 3:4 – genau so ist sie hier zu sehen. ' +
        'Wichtiges gehoert in die Mitte der ersten Slide.</p>' +
      '</div>';
    document.body.appendChild(d);
    document.getElementById('prClose').onclick = schliessen;
    d.addEventListener('pointerdown', (e) => { if (e.target === d) schliessen(); });
    document.getElementById('prVor').onclick = () => { blaettern(-1); };
    document.getElementById('prZur').onclick = () => { blaettern(1); };
  }

  function schliessen() {
    const d = document.getElementById('prasterDlg');
    if (d) d.classList.add('hidden');
  }

  function blaettern(um) {
    const n = Math.max(1, SS.canvasSize().n);
    slideNr = ((slideNr + um) % n + n) % n;
    zeichnen();
  }

  /* ------------------------------------------------------------- Zeichnung */
  function zeichnen() {
    const cv = document.getElementById('prCanvas');
    if (!cv) return;
    const k = SS.canvasSize();
    const n = Math.max(1, k.n);
    slideNr = Math.min(slideNr, n - 1);
    document.getElementById('prLabel').textContent = 'Slide ' + (slideNr + 1) + ' / ' + n;

    /* Masse des Mockups (interne Pixel, 2x fuer Schaerfe) */
    const B = 760, rand = 26, spalt = 4;
    const kachelB = (B - 2 * rand - 2 * spalt) / 3;
    const kachelH = kachelB * 4 / 3;
    const kopfH = 150;
    const HH = kopfH + 2 * kachelH + spalt + rand;
    cv.width = B; cv.height = HH;
    const c = cv.getContext('2d');

    /* Untergrund + Kopfzeile wie ein Profil */
    c.fillStyle = '#101012'; c.fillRect(0, 0, B, HH);
    c.fillStyle = '#2c2c31';
    c.beginPath(); c.arc(rand + 44, 58, 40, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#e8e4de'; c.font = '600 30px Poppins, sans-serif';
    c.textAlign = 'left'; c.textBaseline = 'middle';
    const name = (SS.marke && SS.marke.handle) || '@deinprofil';
    c.fillText(name, rand + 104, 46);
    c.fillStyle = '#8b8b92'; c.font = '22px Poppins, sans-serif';
    c.fillText('Beitraege · Follower · Gefolgt', rand + 104, 82);
    c.strokeStyle = '#26262b'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, kopfH - 12); c.lineTo(B, kopfH - 12); c.stroke();

    /* Sechs Kacheln, 3:4. Oben links die gewaehlte Slide. */
    for (let z = 0; z < 2; z++) {
      for (let s = 0; s < 3; s++) {
        const x = rand + s * (kachelB + spalt);
        const y = kopfH + z * (kachelH + spalt);
        if (z === 0 && s === 0) {
          slideKachel(c, x, y, kachelB, kachelH);
        } else {
          const g = c.createLinearGradient(x, y, x + kachelB, y + kachelH);
          const t = (z * 3 + s) * 8;
          g.addColorStop(0, 'rgb(' + (52 - t / 2) + ',' + (50 - t / 2) + ',' + (56 - t / 2) + ')');
          g.addColorStop(1, 'rgb(' + (34 - t / 3) + ',' + (33 - t / 3) + ',' + (38 - t / 3) + ')');
          c.fillStyle = g;
          c.fillRect(x, y, kachelB, kachelH);
        }
      }
    }
  }

  /* Die gewaehlte Slide, mittig auf 3:4 beschnitten – exakt der Ausschnitt,
     den Instagram im Profil zeigt. Gezeichnet wird die echte Szene ueber
     SS.paintScene, nur eben klein. */
  function slideKachel(c, x, y, b, h) {
    const k = SS.canvasSize();
    const sichtbar = k.H * 3 / 4;                       // Breite des 3:4-Ausschnitts
    const von = slideNr * k.slideW + (k.slideW - sichtbar) / 2;
    const s = h / k.H;
    c.save();
    c.beginPath(); c.rect(x, y, b, h); c.clip();
    c.translate(x, y);
    c.scale(s, s);
    c.translate(-von, 0);
    try { SS.paintScene(c, k.W, k.H, { forExport: true }); } catch (e) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.fillStyle = '#333'; c.fillRect(x, y, b, h);
    }
    c.restore();
  }

  /* ------------------------------------------------- Knopf im Raster-Menue */
  const menue = document.getElementById('gridMenu');
  if (menue) {
    const kn = document.createElement('button');
    kn.id = 'btnPraster';
    kn.textContent = 'Profil-Vorschau öffnen …';
    kn.style.cssText = 'display:block;width:100%;margin-top:8px';
    kn.onclick = () => {
      bauen();
      slideNr = 0;
      document.getElementById('prasterDlg').classList.remove('hidden');
      /* Videos brauchen ein Bild: einmal kurz warten, dann zeichnen. */
      setTimeout(zeichnen, 60);
      menue.classList.add('hidden');
    };
    menue.appendChild(kn);
  }

  SS.profilVorschau = () => { bauen(); document.getElementById('prasterDlg').classList.remove('hidden'); setTimeout(zeichnen, 60); };
  SS.ZONEN7 = { bereit: true };
})();
