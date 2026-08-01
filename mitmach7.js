/* Seamless Studio – Mitmach-Karussells
   ============================================================================
   Formate, die Kommentare holen – das staerkste Signal fuer den Algorithmus.
   Vier Bauhelfer (kleine Dialoge, keine blossen Layouts):

     Quiz          Frage-Slide, Antwort-Slide, im Wechsel ("Erst raten!")
     A oder B      zwei Optionen gross, "Kommentiere A oder B"
     Lueckentext   ein Satz mit ____ und der Kommentar-Aufforderung
     Reihen-Raetsel je Slide ein Hinweis, Aufloesung am Ende

   Alle nutzen die Markenschriften, funktionieren ueber Video (hell mit
   Schatten) und enden mit einer Kommentar-Aufforderung.
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
      shadow: dunkel, shadowColor: '#100b07', shadowBlur: 24, shadowX: 0, shadowY: 4,
      bgStyle: 'none', lineHeight: 1.25,
    }, o));
  }

  function slidesSetzen(n) {
    const plus = document.getElementById('slidesPlus');
    const minus = document.getElementById('slidesMinus');
    let schutz = 0;
    while (SS.state.slides < n && schutz++ < 40) plus.click();
    while (SS.state.slides > n && schutz++ < 80) minus.click();
  }

  function abschliessen(neu, name) {
    const k = SS.canvasSize();
    neu.forEach(el => { SS.state.elements.push(el); SS.textUmbrechen(el, k.slideW * 0.86); });
    SS.pushHistory(name);
    SS.ui.refreshLayers && SS.ui.refreshLayers();
    SS.ui.zoomFit && SS.ui.zoomFit();
    SS.requestRender();
    SS.toast(name + ' gebaut – Texte antippen zum Feinschliff', 3200, 'ok');
  }

  const kicker = (inhalt, s, k) => textEl({ content: inhalt, x: s * k.slideW + k.slideW / 2,
    y: k.H * 0.16, size: Math.round(k.H * 0.020), letterSpacing: 6,
    font: marke().schriftText || 'Poppins',
    color: ueberVideo() ? 'rgba(255,255,255,.8)' : '#a29380' });
  const gross = (inhalt, s, k, yr) => textEl({ content: inhalt, x: s * k.slideW + k.slideW / 2,
    y: k.H * (yr || 0.42), size: Math.round(k.H * 0.058),
    font: marke().schriftTitel || 'Playfair Display', lineHeight: 1.16 });
  const klein = (inhalt, s, k, yr) => textEl({ content: inhalt, x: s * k.slideW + k.slideW / 2,
    y: k.H * (yr || 0.88), size: Math.round(k.H * 0.019), letterSpacing: 4,
    font: marke().schriftText || 'Poppins',
    color: ueberVideo() ? 'rgba(255,255,255,.75)' : '#8a7d6d' });

  /* ---------------------------------------------------------------- Quiz */
  function quizBauen(titel, paare) {
    const n = 1 + paare.length * 2 + 1;
    slidesSetzen(n);
    const k = SS.canvasSize();
    const neu = [];
    neu.push(kicker('QUIZ', 0, k));
    neu.push(gross(titel || 'Wie gut kennst\ndu dich aus?', 0, k, 0.40));
    neu.push(klein('ERST RATEN, DANN WISCHEN →', 0, k));
    paare.forEach((p, i) => {
      const fs = 1 + i * 2, as = fs + 1;
      neu.push(kicker('FRAGE ' + (i + 1), fs, k));
      neu.push(gross(p.frage, fs, k, 0.40));
      neu.push(klein('DEINE ANTWORT? →', fs, k));
      neu.push(kicker('AUFLÖSUNG', as, k));
      neu.push(gross(p.antwort, as, k, 0.40));
      neu.push(klein('RICHTIG GERATEN? ✓', as, k));
    });
    const letzte = n - 1;
    neu.push(gross('Wie viele\nhattest du richtig?', letzte, k, 0.38));
    neu.push(textEl({ content: 'Schreib deine Zahl in die Kommentare 👇',
      x: letzte * k.slideW + k.slideW / 2, y: k.H * 0.58,
      size: Math.round(k.H * 0.026) }));
    abschliessen(neu, 'Quiz');
  }

  /* -------------------------------------------------------------- A oder B */
  function abBauen(frage, a, bOpt) {
    slidesSetzen(2);
    const k = SS.canvasSize();
    const neu = [];
    neu.push(kicker('DU MUSST DICH ENTSCHEIDEN', 0, k));
    neu.push(gross(frage || 'Was bist du eher?', 0, k, 0.34));
    neu.push(textEl({ content: 'A · ' + (a || 'Option A'), x: k.slideW / 2, y: k.H * 0.56,
      size: Math.round(k.H * 0.040), bgStyle: 'pill', bgColor: '#F6EEDC', bgAlpha: 0.95,
      color: '#2b241d', shadow: false }));
    neu.push(textEl({ content: 'B · ' + (bOpt || 'Option B'), x: k.slideW / 2, y: k.H * 0.70,
      size: Math.round(k.H * 0.040), bgStyle: 'pill', bgColor: '#2b241d', bgAlpha: 0.92,
      color: '#F6EEDC', shadow: false }));
    neu.push(gross('Und, welches Team?', 1, k, 0.38));
    neu.push(textEl({ content: 'Kommentiere A oder B 👇', x: k.slideW + k.slideW / 2,
      y: k.H * 0.56, size: Math.round(k.H * 0.028) }));
    abschliessen(neu, 'A oder B');
  }

  /* ------------------------------------------------------------ Lueckentext */
  function lueckeBauen(satz) {
    slidesSetzen(2);
    const k = SS.canvasSize();
    const neu = [];
    neu.push(kicker('VERVOLLSTÄNDIGE DEN SATZ', 0, k));
    neu.push(gross(satz || 'Mein liebstes Ritual\nam Morgen ist ______', 0, k, 0.42));
    neu.push(klein('DEINE ANTWORT? →', 0, k));
    neu.push(gross('Schreib es in\ndie Kommentare', 1, k, 0.40));
    neu.push(textEl({ content: 'Ich lese jede Antwort 🤍', x: k.slideW + k.slideW / 2,
      y: k.H * 0.60, size: Math.round(k.H * 0.026) }));
    abschliessen(neu, 'Lückentext');
  }

  /* --------------------------------------------------------- Reihen-Raetsel */
  function raetselBauen(hinweise, aufloesung) {
    const n = 1 + hinweise.length + 1;
    slidesSetzen(n);
    const k = SS.canvasSize();
    const neu = [];
    neu.push(kicker('RATE MIT', 0, k));
    neu.push(gross('Ich sehe was,\nwas du nicht siehst …', 0, k, 0.40));
    neu.push(klein('HINWEIS FÜR HINWEIS →', 0, k));
    hinweise.forEach((h, i) => {
      const s = i + 1;
      neu.push(kicker('HINWEIS ' + (i + 1) + ' / ' + hinweise.length, s, k));
      neu.push(gross(h, s, k, 0.42));
    });
    const letzte = n - 1;
    neu.push(kicker('AUFLÖSUNG', letzte, k));
    neu.push(gross(aufloesung || '…', letzte, k, 0.40));
    neu.push(textEl({ content: 'Ab wann wusstest du es? Kommentiere die Hinweis-Nummer 👇',
      x: letzte * k.slideW + k.slideW / 2, y: k.H * 0.62,
      size: Math.round(k.H * 0.024) }));
    abschliessen(neu, 'Reihen-Rätsel');
  }

  /* ------------------------------------------------------------- Dialoge */
  function feld(platzhalter, wert) {
    return '<input type="text" placeholder="' + platzhalter + '" value="' + (wert || '') + '" style="width:100%">';
  }

  function dialog(art) {
    let d = document.getElementById('mmDlg');
    if (d) d.remove();
    d = document.createElement('div');
    d.id = 'mmDlg';
    d.className = 'modal';
    let inhalt = '';
    if (art === 'quiz') {
      inhalt = '<div class="ctl" style="display:block">' + feld('Quiz-Titel, z. B. „Wie gut kennst du den Mond?"') + '</div>' +
        '<div id="mmPaare"></div>' +
        '<button id="mmMehr" style="margin-top:6px">+ Frage</button>';
    } else if (art === 'ab') {
      inhalt = '<div class="ctl" style="display:block">' + feld('Die Frage, z. B. „Was bist du eher?"') + '</div>' +
        '<div class="ctl" style="display:block">' + feld('Option A, z. B. „Frühaufsteher"') + '</div>' +
        '<div class="ctl" style="display:block">' + feld('Option B, z. B. „Nachteule"') + '</div>';
    } else if (art === 'luecke') {
      inhalt = '<div class="ctl" style="display:block">' + feld('Satz mit ______ als Lücke') + '</div>';
    } else {
      inhalt = '<div id="mmHinweise">' +
        '<div class="ctl" style="display:block">' + feld('Hinweis 1') + '</div>' +
        '<div class="ctl" style="display:block">' + feld('Hinweis 2') + '</div></div>' +
        '<button id="mmMehr" style="margin-top:6px">+ Hinweis</button>' +
        '<div class="ctl" style="display:block;margin-top:6px">' + feld('Auflösung') + '</div>';
    }
    const NAMEN = { quiz: 'Quiz', ab: 'A oder B', luecke: 'Lückentext', raetsel: 'Reihen-Rätsel' };
    d.innerHTML = '<div class="modal-card" style="max-width:420px">' +
      '<div class="sort-head"><h3>' + NAMEN[art] + ' bauen</h3><button id="mmClose">✕</button></div>' +
      inhalt +
      '<button id="mmGo" class="wide primary" style="margin-top:10px">Slides bauen</button>' +
      '<p class="hint">Wird in die offene Szene gebaut – Slidezahl stellt sich passend ein.</p></div>';
    document.body.appendChild(d);
    d.querySelector('#mmClose').onclick = () => d.remove();
    d.addEventListener('pointerdown', (e) => { if (e.target === d) d.remove(); });

    if (art === 'quiz') {
      const paare = d.querySelector('#mmPaare');
      const paarZeile = () => {
        const z = document.createElement('div');
        z.className = 'ctl';
        z.style.display = 'block';
        z.innerHTML = feld('Frage') + feld('Antwort');
        paare.appendChild(z);
      };
      paarZeile(); paarZeile();
      d.querySelector('#mmMehr').onclick = () => { if (paare.children.length < 4) paarZeile(); };
    }
    if (art === 'raetsel') {
      d.querySelector('#mmMehr').onclick = () => {
        const h = d.querySelector('#mmHinweise');
        if (h.children.length >= 5) return;
        const z = document.createElement('div');
        z.className = 'ctl'; z.style.display = 'block';
        z.innerHTML = feld('Hinweis ' + (h.children.length + 1));
        h.appendChild(z);
      };
    }

    d.querySelector('#mmGo').onclick = () => {
      const werte = [...d.querySelectorAll('input[type=text]')].map(i => i.value.trim());
      d.remove();
      if (art === 'quiz') {
        const titel = werte[0];
        const paare = [];
        for (let i = 1; i + 1 < werte.length + 1; i += 2) {
          if (werte[i] && werte[i + 1]) paare.push({ frage: werte[i], antwort: werte[i + 1] });
        }
        if (!paare.length) { SS.toast('Mindestens eine Frage mit Antwort', 3000, 'warn'); return; }
        quizBauen(titel, paare);
      } else if (art === 'ab') abBauen(werte[0], werte[1], werte[2]);
      else if (art === 'luecke') lueckeBauen(werte[0]);
      else {
        const aufloesung = werte.pop();
        const hinweise = werte.filter(Boolean);
        if (!hinweise.length || !aufloesung) { SS.toast('Hinweise und Auflösung nötig', 3000, 'warn'); return; }
        raetselBauen(hinweise, aufloesung);
      }
    };
  }

  /* Bedienung im Studio-Panel */
  const kasten = document.getElementById('markeBox');
  if (kasten) {
    const kopf = document.createElement('div');
    kopf.className = 'ctl';
    kopf.style.cssText = 'margin-top:14px;display:block';
    kopf.innerHTML = '<span style="opacity:.75;font-size:13px">Mitmach-Karussells (holen Kommentare)</span>';
    const reihe = document.createElement('div');
    reihe.className = 'chips';
    reihe.innerHTML =
      '<button data-mm="quiz">Quiz</button>' +
      '<button data-mm="ab">A oder B</button>' +
      '<button data-mm="luecke">Lückentext</button>' +
      '<button data-mm="raetsel">Reihen-Rätsel</button>';
    kasten.appendChild(kopf);
    kasten.appendChild(reihe);
    reihe.querySelectorAll('button').forEach(b => { b.onclick = () => dialog(b.dataset.mm); });
  }

  SS.MITMACH7 = { bereit: true, quizBauen, abBauen, lueckeBauen, raetselBauen };
})();
