/* Seamless Studio – Antwort-Karten
   ============================================================================
   Aus Kommentaren werden neue Beitraege: die Frage einer Leserin huebsch
   gerahmt (heller Kasten, wie eine Sprechblase), darunter deine Antwort in
   der Markenschrift. Zwei Slides: Frage-Slide (macht neugierig), Antwort-
   Slide – plus Aufforderung, die naechste Frage zu stellen.
   ========================================================================= */

(function () {
  if (!SS.ui || typeof SS.textUmbrechen !== 'function') return;

  const marke = () => SS.marke || {};
  const ueberVideo = () => !!(SS.clip && SS.clip.ready);

  function textEl(o) {
    const dunkel = ueberVideo();
    return SS.normalizeEl(Object.assign({
      id: SS.uid(), type: 'text', align: 'center',
      color: dunkel ? '#F6EEDC' : '#2f2a26',
      shadow: dunkel && (!o || o.bgStyle === undefined), shadowColor: '#100b07',
      shadowBlur: 24, shadowX: 0, shadowY: 4,
      bgStyle: 'none', lineHeight: 1.3,
    }, o));
  }

  function bauen(frage, von, antwort) {
    const plus = document.getElementById('slidesPlus');
    const minus = document.getElementById('slidesMinus');
    let schutz = 0;
    while (SS.state.slides < 2 && schutz++ < 20) plus.click();
    while (SS.state.slides > 2 && schutz++ < 40) minus.click();
    const k = SS.canvasSize();
    const sw = k.slideW;
    const neu = [];

    neu.push(textEl({ content: 'IHR FRAGT – ICH ANTWORTE', x: sw / 2, y: k.H * 0.17,
      size: Math.round(k.H * 0.020), letterSpacing: 6,
      font: marke().schriftText || 'Poppins',
      color: ueberVideo() ? 'rgba(255,255,255,.8)' : '#a29380' }));
    neu.push(textEl({ content: '„' + frage.replace(/^[„"]|["“]$/g, '') + '“',
      x: sw / 2, y: k.H * 0.42, size: Math.round(k.H * 0.040),
      font: 'Cormorant Garamond', italic: true, lineHeight: 1.35,
      bgStyle: 'card', bgColor: ueberVideo() ? '#171310' : '#faf6ee',
      bgAlpha: ueberVideo() ? 0.6 : 0.95, shadow: false,
      color: ueberVideo() ? '#F6EEDC' : '#3f382f' }));
    neu.push(textEl({ content: '— ' + (von || 'aus den Kommentaren'), x: sw / 2, y: k.H * 0.62,
      size: Math.round(k.H * 0.020), letterSpacing: 2,
      color: ueberVideo() ? 'rgba(255,255,255,.8)' : '#8a7d6d' }));
    neu.push(textEl({ content: 'MEINE ANTWORT →', x: sw / 2, y: k.H * 0.86,
      size: Math.round(k.H * 0.019), letterSpacing: 5,
      font: marke().schriftText || 'Poppins',
      color: ueberVideo() ? 'rgba(255,255,255,.75)' : '#a29380' }));

    neu.push(textEl({ content: antwort, x: sw + sw / 2, y: k.H * 0.42,
      size: Math.round(k.H * 0.034), font: marke().schriftTitel || 'Playfair Display',
      lineHeight: 1.3 }));
    neu.push(textEl({ content: 'Was möchtest du als Nächstes wissen?\nSchreib es in die Kommentare 👇',
      x: sw + sw / 2, y: k.H * 0.74, size: Math.round(k.H * 0.022), lineHeight: 1.45,
      color: ueberVideo() ? 'rgba(255,255,255,.85)' : '#8a7d6d' }));

    for (let s = 0; s < 2; s++) {
      neu.push(textEl({ content: marke().handle || '@DEINPROFIL', x: s * sw + sw / 2,
        y: k.H * 0.945, size: Math.round(k.H * 0.017), letterSpacing: 4,
        color: ueberVideo() ? 'rgba(255,255,255,.68)' : '#8a7d6d' }));
    }

    neu.forEach(el => { SS.state.elements.push(el); SS.textUmbrechen(el, sw * 0.80); });
    SS.pushHistory('Antwort-Karte');
    SS.ui.refreshLayers && SS.ui.refreshLayers();
    SS.ui.zoomFit && SS.ui.zoomFit();
    SS.requestRender();
    SS.toast('Frage-und-Antwort-Karussell gebaut', 2800, 'ok');
  }

  function dialog() {
    let d = document.getElementById('awDlg');
    if (d) d.remove();
    d = document.createElement('div');
    d.id = 'awDlg';
    d.className = 'modal';
    d.innerHTML = '<div class="modal-card" style="max-width:440px">' +
      '<div class="sort-head"><h3>Antwort-Karte</h3><button id="awClose">✕</button></div>' +
      '<textarea id="awFrage" rows="2" style="width:100%;resize:vertical" placeholder="Die Frage aus den Kommentaren …"></textarea>' +
      '<div class="ctl"><span>Von</span><input type="text" id="awVon" style="flex:1" placeholder="optional – z. B. @annak"></div>' +
      '<textarea id="awAntwort" rows="3" style="width:100%;resize:vertical;margin-top:6px" placeholder="Deine Antwort …"></textarea>' +
      '<button id="awGo" class="wide primary" style="margin-top:10px">Karussell bauen</button>' +
      '<p class="hint">Slide 1 zeigt die Frage im Kasten, Slide 2 deine Antwort – und lädt zur nächsten Frage ein.</p></div>';
    document.body.appendChild(d);
    d.querySelector('#awClose').onclick = () => d.remove();
    d.addEventListener('pointerdown', (e) => { if (e.target === d) d.remove(); });
    d.querySelector('#awGo').onclick = () => {
      const frage = d.querySelector('#awFrage').value.trim();
      const antwort = d.querySelector('#awAntwort').value.trim();
      if (frage.length < 4 || antwort.length < 4) { SS.toast('Frage und Antwort brauchen Text', 2800, 'warn'); return; }
      const von = d.querySelector('#awVon').value.trim();
      d.remove();
      bauen(frage, von, antwort);
    };
  }

  const anker = document.getElementById('btnBewertung');
  if (anker && anker.parentElement) {
    const b = document.createElement('button');
    b.id = 'btnAntwort';
    b.textContent = 'Antwort-Karte';
    b.onclick = dialog;
    anker.parentElement.appendChild(b);
  }

  SS.ANTWORT7 = { bereit: true, bauen };
})();
