/* Seamless Studio – Audiogramm (Stimme als Wellenform)
   ============================================================================
   Das Podcast-Format ohne Gesicht: du sprichst einen Gedanken ein (die
   Sprachaufnahme gibt es schon), und im Video laeuft eine lebendige
   Wellenform mit – Balken, die deiner Stimme folgen, in der Markenfarbe.
   Zusammen mit den Karaoke-Untertiteln wird daraus ein komplettes
   Sprech-Reel. Gezeichnet wird in der Videoschicht (Vorschau UND Export),
   nie im Bildexport.
   ========================================================================= */

(function () {
  const V = SS.video, A = SS.audio;
  if (!V || !A || typeof V.drawFrame !== 'function') return;

  SS.audiogramm = { an: false, pos: 0.62, breite: 0.6 };

  /* Huellkurve der Aufnahme: ~40 Werte je Sekunde, einmal gerechnet. */
  let kurve = null, kurveVon = null;
  function kurveHolen() {
    const v = A.state.voice;
    if (!v || !v.buffer) return null;
    if (kurve && kurveVon === v.buffer) return kurve;
    const buf = v.buffer;
    const d = buf.getChannelData(0);
    const je = Math.max(1, Math.floor(buf.sampleRate / 40));
    const n = Math.floor(d.length / je);
    const k = new Float32Array(n);
    let max = 0.0001;
    for (let i = 0; i < n; i++) {
      let s = 0;
      const von = i * je;
      for (let j = 0; j < je; j += 8) s = Math.max(s, Math.abs(d[von + j]));
      k[i] = s;
      max = Math.max(max, s);
    }
    for (let i = 0; i < n; i++) k[i] = k[i] / max;
    kurve = { werte: k, jeSek: buf.sampleRate / je, dauer: buf.duration };
    kurveVon = v.buffer;
    return kurve;
  }

  const altFrame = V.drawFrame;
  V.drawFrame = function (oc, outW, outH, t) {
    const r = altFrame.apply(this, arguments);
    try {
      if (!SS.audiogramm.an) return r;
      const k = kurveHolen();
      if (!k) return r;
      const farbe = (SS.marke && SS.marke.farben && SS.marke.farben[0]) || '#c9a15f';
      const n = 44;
      const gesamtB = outW * SS.audiogramm.breite;
      const schritt = gesamtB / n;
      const bb = Math.max(3, schritt * 0.55);
      const mitteY = outH * SS.audiogramm.pos;
      const maxH = outH * 0.075;
      const fenster = 1.4;                       // Sekunden sichtbar
      oc.save();
      oc.setTransform(1, 0, 0, 1, 0, 0);
      oc.fillStyle = farbe;
      oc.globalAlpha = 0.92;
      for (let i = 0; i < n; i++) {
        const dt = (i / (n - 1) - 0.5) * fenster;
        const zt = t + dt;
        let w = 0;
        if (zt >= 0 && zt < k.dauer) w = k.werte[Math.floor(zt * k.jeSek)] || 0;
        /* Mitte betonen, Raender abklingen lassen */
        const huell = 0.35 + 0.65 * Math.cos((i / (n - 1) - 0.5) * Math.PI) ** 1.2;
        const h = Math.max(outH * 0.006, w * maxH * huell);
        const x = outW / 2 - gesamtB / 2 + i * schritt + (schritt - bb) / 2;
        const y = mitteY - h;
        const rad = Math.max(0.5, Math.min(bb / 2, h));   // nie negativ, nie groesser als der Balken
        oc.beginPath();
        oc.moveTo(x, y + rad);
        oc.arc(x + rad, y + rad, rad, Math.PI, 0);
        oc.lineTo(x + bb, mitteY + h - rad);
        oc.arc(x + rad, mitteY + h - rad, rad, 0, Math.PI);
        oc.closePath();
        oc.fill();
      }
      oc.restore();
    } catch (e) {}
    return r;
  };

  /* ------------------------------------------------------------ Bedienung */
  const anker = document.getElementById('sprecherBox');
  if (!anker) return;
  const box = document.createElement('div');
  box.id = 'audiogrammBox';
  box.innerHTML =
    '<label class="ctl"><input type="checkbox" id="agAn"> <span>Wellenform der Stimme im Video zeigen</span></label>' +
    '<div class="ctl" id="agPosRow"><span>Höhe</span>' +
    '<input type="range" id="agPos" min="20" max="88" value="62">' +
    '<span class="val" id="agPosL">62 %</span></div>' +
    '<p class="hint">Balken in deiner Markenfarbe folgen der Aufnahme – zusammen mit den ' +
    'Untertiteln wird daraus ein Sprech-Reel ohne Kamera.</p>';
  anker.appendChild(box);
  document.getElementById('agAn').addEventListener('change', (e) => {
    if (e.target.checked && !(A.state.voice && A.state.voice.buffer)) {
      e.target.checked = false;
      SS.toast('Erst eine Sprachaufnahme machen', 2800, 'warn');
      return;
    }
    SS.audiogramm.an = e.target.checked;
    V.refresh && V.refresh(true);
  });
  document.getElementById('agPos').addEventListener('input', () => {
    const v = +document.getElementById('agPos').value;
    document.getElementById('agPosL').textContent = v + ' %';
    SS.audiogramm.pos = v / 100;
    V.refresh && V.refresh(true);
  });

  SS.AUDIOGRAMM7 = { bereit: true };
})();
