/* ============================================================
   Seamless Studio 5.0 — Beat-Sync
   Die Klangbetten entstehen im Gerät, ihr Taktraster ist also
   bekannt. Damit lässt sich die Kamerafahrt auf den Takt rasten,
   ohne dass Audio analysiert werden muss: die Kamera hält den
   Schlag, ruckt darauf weiter und schwingt aus.
   Lädt nach video.js.
   ============================================================ */

(function () {
  const $ = (id) => document.getElementById(id);
  if (!SS.video || !SS.video.drawFrame) return;
  const V = SS.video;

  /* Taktangaben der mitgelieferten Betten. Die Naturklänge haben keinen
     eigenen Puls – dort ist der Wert ein ruhiger Standardtakt. */
  const BPM = {
    none: 0, meer: 60, wald: 76, wind: 66, regen: 84,
    ruhig: 72, froh: 112, episch: 90, lulla: 66, custom: 100,
  };

  SS.beat = SS.beat || { on: false, bpm: 0, every: 1 };
  if (SS.beat.every === undefined) SS.beat.every = 1;

  const bpmOf = () => {
    if (SS.beat.bpm) return SS.beat.bpm;
    const id = (SS.audio && SS.audio.state && SS.audio.state.soundId) || 'none';
    return BPM[id] || 84;
  };

  const easeOut = (x) => 1 - Math.pow(1 - x, 3);

  /* Zeit auf das Taktraster rasten: hält kurz, ruckt weiter, schwingt aus */
  function quantize(t) {
    const bpm = bpmOf();
    if (!bpm) return t;
    const beat = (60 / bpm) * Math.max(1, SS.beat.every);
    const i = Math.floor(t / beat);
    const frac = (t - i * beat) / beat;
    return (i + easeOut(Math.min(1, frac * 1.7))) * beat;
  }

  const origDraw = V.drawFrame;
  V.drawFrame = function (oc, outW, outH, t, cam) {
    if (SS.beat.on && typeof cam === 'function') {
      const camBeat = (tt) => cam(quantize(tt));
      return origDraw.call(this, oc, outW, outH, t, camBeat);
    }
    return origDraw.apply(this, arguments);
  };

  /* ================= Bedienung ================= */

  const panel = $('panel-video');
  if (!panel) return;

  const box = document.createElement('div');
  const h3 = document.createElement('h3');
  h3.textContent = 'Beat-Sync';
  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent = 'Die Kamera hält den Schlag und ruckt darauf weiter. Weil die Musik im Gerät entsteht, ist der Takt bekannt — es wird nichts analysiert.';

  const row = document.createElement('div');
  row.className = 'ctl';
  const lab = document.createElement('span');
  lab.textContent = 'Kamera im Takt';
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = !!SS.beat.on;
  row.appendChild(lab); row.appendChild(cb);

  const bpmRow = document.createElement('div');
  bpmRow.className = 'ctl';
  const bpmLab = document.createElement('span');
  bpmLab.textContent = 'Takt';
  const bpmR = document.createElement('input');
  bpmR.type = 'range'; bpmR.min = 50; bpmR.max = 150; bpmR.step = 1;
  bpmR.value = bpmOf();
  const bpmVal = document.createElement('span');
  bpmVal.className = 'val';
  bpmRow.appendChild(bpmLab); bpmRow.appendChild(bpmR); bpmRow.appendChild(bpmVal);

  const everyRow = document.createElement('div');
  everyRow.className = 'chips';

  box.appendChild(h3); box.appendChild(hint); box.appendChild(row);
  box.appendChild(bpmRow); box.appendChild(everyRow);
  const anchor = $('vidExport');
  panel.insertBefore(box, anchor ? anchor.previousElementSibling : null);

  function sync(save) {
    SS.beat.on = cb.checked;
    SS.beat.bpm = +bpmR.value;
    bpmVal.textContent = bpmR.value;
    bpmRow.classList.toggle('hidden', !cb.checked);
    everyRow.classList.toggle('hidden', !cb.checked);
    V.refresh && V.refresh(true);
    if (save) SS.pushHistory('Beat-Sync');
  }
  cb.addEventListener('change', () => sync(true));
  bpmR.addEventListener('input', () => sync(false));
  bpmR.addEventListener('change', () => sync(true));

  [[1, 'jeder Schlag'], [2, 'jeder zweite'], [4, 'jeder vierte']].forEach(([v, name]) => {
    const b = document.createElement('button');
    b.textContent = name;
    if (SS.beat.every === v) b.classList.add('sel');
    b.onclick = () => {
      SS.beat.every = v;
      [...everyRow.children].forEach(x => x.classList.remove('sel'));
      b.classList.add('sel');
      sync(true);
    };
    everyRow.appendChild(b);
  });

  /* Takt folgt dem gewählten Klangbett, solange nichts von Hand gesetzt wurde */
  const sounds = $('vidSounds');
  if (sounds) sounds.addEventListener('click', () => setTimeout(() => {
    const id = (SS.audio && SS.audio.state && SS.audio.state.soundId) || 'none';
    if (BPM[id]) { bpmR.value = BPM[id]; sync(false); }
  }, 60));

  sync(false);
})();
