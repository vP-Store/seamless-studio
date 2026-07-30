/* Seamless Studio – drei Beispielvideos zum Antippen
   ============================================================================
   „Ich will die drei Videos als Beispiel in der App haben, dass die Leinwand
   fertig ist und man das auswählen kann."

   Also: drei Kacheln im Video-Bereich. Ein Tipp lädt den Clip, stellt Format
   4:5, fünf Slides und das Zeitpanorama ein – die Leinwand steht fertig da.

   Die Videos liegen als eigene Dateien neben der App (rund 2,3 MB zusammen).
   Sie stehen bewusst NICHT in der Vorabladeliste des Service Workers, sonst
   dauerte der erste Start der App unnötig lange. Der Service Worker legt jede
   Antwort ohnehin im Cache ab – nach dem ersten Antippen ist ein Beispiel
   also auch offline da.

   Die Vorschaubildchen stecken als Datenzeile direkt in dieser Datei. Sie
   sind winzig (1–3 kB) und dadurch sofort und immer sichtbar, auch bevor ein
   Video je geladen wurde.
   ========================================================================= */

(function () {
  if (typeof SS.loadClip !== 'function') return;

  const BEISPIELE = [
    { id: 'mond', name: 'Mondphasen', datei: 'beispiel_mond.mp4',
      hinweis: 'Aus einer Mondsichel wird über fünf Slides der Vollmond. Der Klassiker für das Zeitpanorama.',
      modus: 'zeit', slides: 5,
      bild: 'data:image/jpeg;base64,/9j//gAQTGF2YzYwLjMxLjEwMgD/2wBDAAgMDA4MDhAQEBAQEBMSExQUFBMTExMUFBQVFRUZGRkVFRUUFBUVGBgZGRscGxoaGRocHB4eHiQkIiIqKiszMz7/xAB3AAACAwEBAQEAAAAAAAAAAAACAQADBAUHBggBAQEBAQAAAAAAAAAAAAAAAAEAAgMQAAIBAgQEBAYDAQAAAAAAAAABAgMREjETBEFhIVGBBSIGcaEyUrFCYpHRMxEBAQEAAwEBAQAAAAAAAAAAAAERAyECEkEx/8AAEQgAcADIAwEiAAIRAAMRAP/aAAwDAQACEQMRAD8A8DIMZ1CEIOwghhDFBsSwQxARjCJAGEOxIBAyWJAEWWFYkAQdhEQCDECCIMVgQBBiIhEMYExkCNMoQYxBDGMUQxkFEOwQSIElcusiDsSPCux3aHlFTd7adfb+t0v+lP8AdLPFH7l3Wa5nGR6z7MaVard26Lp3MerkajyCUHEpaPT/AHX5bT2m8x0klTrJzssoyv6o/wB9fE82khl2K9M4JaCIViLASQCBCBBEEICEQRCRjIMQgRCCkGMghBjGQIsjxBLI5kBBkaCREcYnpPt3Z13PHBSj+18rpP5nw+2oSrVIQiruTSP0z5dstClQUYq6ioy+Bx5L1jr5j4H3fgqbXbztaWpNO/H0xu0eHSR6/wC8t1F1qe1ha1BPFb759WvBWPIZDx/wemdoGxYCdnNWCWMEirEGICAQYIIJBjvyXz/0yiCBCFGMgzQMYgiZQZBiEGQYpdF9zfRozqtKEJSbyUU3+DmG+hua22d6VSpTf8JOP4YUvcPb3kEtuluNxG0uz6KC5s7XnHuXbeX05UtrONWta2KPWFPxyk/h0PBqnmm8rK1TcVprtKcmvmzlyqOWbOPxbdrr9T8atzuJV5ynJtuTbbfFvicxhtlZ2c7QAhgkyEEMREAg2gAIQQwSaCQYjKQIEZISCBQRpmmMgxZMggzSQZBijGCMkIlxEJIINRbL44Y5+oylCg2PAka3O+SFp3QJhfQruaXRk+BWqa4tGWlcYuWRZpqP1PwLHVUFaKRgnO4WmRpcoLIzOxTcVw1oZBYlxHijzLQtsh4Ci5Ymw1CwtEL/AKo80UGwIgghZMIlhmggyyEJT6JG+O3UXeUr8kiTn4Ws0OMJSdkmzs63JWCe5Uci0OXoVOxdHbvN2+Bc6il1bDdemu4aWWdJ8DE01mdF7qOSVjl1J3ZluCx2JrMx3BuZ0tDqvuUOTAEBO4iCYIhEIBCQYgKw0RMwWJmoy6C6FpzMbLFUZoN7hfKxTpyXBgqqXKsOjAKnJl6ovj0Ada5FOTHRjZi01ZAyrdDO02VOLBBdRlWJlqptjdFgVOJgXNOixaLJMojboMDRkRZBGnSl2HoyBMgjXosWiyLKI26QOkQYxGzTQsEQLII0OKBsgwv/2Q==' },
    { id: 'finsternis', name: 'Sonnenfinsternis', datei: 'beispiel_finsternis.mp4',
      hinweis: 'Die Finsternis wandert von links nach rechts über die Berge, der Himmel wird golden.',
      modus: 'zeit', slides: 5,
      bild: 'data:image/jpeg;base64,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' },
    { id: 'wellen', name: 'Lichtwellen', datei: 'beispiel_wellen.mp4',
      hinweis: 'Fließende Linien in Blau und Violett. Gutes Beispiel auch für den Spiegel-Modus.',
      modus: 'zeit', slides: 5,
      bild: 'data:image/jpeg;base64,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' },
  ];

  /* Der Datei-Eingang in video.js macht nach dem Laden noch einiges: Regler
     zuruecksetzen, Laenge uebernehmen, Kasten einblenden. Die Funktionen dort
     sind modulintern, also hier dasselbe noch einmal – knapp. */
  function bedienungNachziehen(cl, name) {
    const $ = SS.el;
    const setz = (id, wert) => { const e = $(id); if (e) e.value = wert; };
    setz('vidClipStart', '0');
    setz('vidClipEnd', '1000');
    const kasten = $('vidClipBox');
    if (kasten) kasten.classList.remove('hidden');
    if ($('vidClipName')) {
      $('vidClipName').textContent = `${name} · ${cl.dur.toFixed(1)} s · ${cl.w}×${cl.h}`;
    }
    if ($('vidClipTrim')) {
      $('vidClipTrim').textContent =
        `Ausschnitt: 0.0 s – ${cl.dur.toFixed(1)} s (${cl.dur.toFixed(1)} s)`;
    }
    const V = SS.video;
    if (V && V.opts) {
      V.opts.dur = Math.max(3, Math.min(30, Math.round(cl.dur)));
      setz('vidDur', String(V.opts.dur));
      if ($('vidDurL')) $('vidDurL').textContent = V.opts.dur + ' s';
      /* Kamerafahrt passt zum Panorama; die Kachelreihe der Stile wird in
         video.js nur beim Klick neu gezeichnet, deshalb hier von Hand. */
      V.opts.style = 'pan';
      const stile = document.getElementById('vidStyles');
      if (stile && V.STYLES) {
        [...stile.querySelectorAll('button')].forEach((b) => {
          const s = V.STYLES.find(x => x.name === b.textContent);
          b.classList.toggle('sel', !!s && s.id === V.opts.style);
        });
      }
    }
  }

  async function holen(url, name, typ) {
    const antwort = await fetch(url, { cache: 'force-cache' });
    if (!antwort.ok) throw new Error('Datei nicht gefunden (' + antwort.status + ')');
    const blob = await antwort.blob();
    return new File([blob], name, { type: typ });
  }

  async function zuerstDasEineDannDasAndere(b) {
    const wege = [[b.datei, b.name + '.mp4', 'video/mp4'],
                  [b.datei.replace(/\.mp4$/, '.webm'), b.name + '.webm', 'video/webm']];
    let letzter = null;
    for (const [url, name, typ] of wege) {
      try {
        const datei = await holen(url, name, typ);
        const cl = await SS.loadClip(datei);
        cl.datei = datei;
        return cl;
      } catch (e) { letzter = e; }
    }
    throw letzter || new Error('unbekannt');
  }

  let laeuft = false;

  async function laden(b) {
    if (laeuft) return;
    laeuft = true;
    SS.toast('„' + b.name + '" wird geladen …', 2400);
    try {
      /* MP4/H.264 zuerst – das spielt auf jedem Telefon. Einige Linux-Browser
         bringen aber gar keinen H.264-Dekoder mit; dort scheitert das Laden
         still. Deshalb liegt daneben dieselbe Datei als WebM/VP9, und bei
         einem Fehlschlag wird sie genommen. Kostet nichts, solange es
         funktioniert: die zweite Datei wird nur im Fehlerfall geholt. */
      const cl = await zuerstDasEineDannDasAndere(b);

      /* Erst Format und Slidezahl, dann der Modus – die Kacheln werden auf
         die Slidezahl gesetzt, die zu dem Zeitpunkt gilt. */
      SS.state.format = '4:5';
      SS.state.slides = b.slides;
      /* Überblendung und Zeitspanne zurücksetzen: eine vorher benutzte
         Vorlage kann sie verstellt haben (vv-zitat setzt spanne 0,8),
         und dann stünden die Kacheln beim nächsten Beispiel enger. */
      if (SS.videoLeinwand) {
        await SS.videoLeinwand.setzen(b.modus, { feder: 0.42, spanne: 1.0, t0: 0 });
      }
      SS.ui.syncTop && SS.ui.syncTop();
      bedienungNachziehen(cl, b.name);
      if (SS.videoLeinwand && SS.videoLeinwand.bedienungAuffrischen) {
        SS.videoLeinwand.bedienungAuffrischen();
      }
      SS.ui.zoomFit && SS.ui.zoomFit();
      SS.video && SS.video.refresh && SS.video.refresh(false);
      SS.requestRender && SS.requestRender();
      zeichnen();
      SS.toast('Leinwand steht: ' + b.slides + ' Slides aus „' + b.name +
        '". Vorlagen-Tab → Video-Vorlage für Text darüber.', 5200, 'ok');
    } catch (e) {
      SS.toast('Beispiel konnte nicht geladen werden: ' + e.message, 4200, 'err');
    } finally {
      laeuft = false;
    }
  }

  /* ---------------------------------------------------------------- Kacheln */
  let raster = null;

  function zeichnen() {
    if (!raster) return;
    const aktiv = SS.clip && SS.clip.ready ? String(SS.clip.name || '') : '';
    [...raster.children].forEach((k) => {
      const b = BEISPIELE.find(x => k.dataset.bsp === x.id);
      /* Der Name kann auf .mp4 oder .webm enden – Endung abschneiden. */
      k.classList.toggle('sel', !!b && aktiv.replace(/\.(mp4|webm)$/, '') === b.name);
    });
  }

  (function bauen() {
    const eingang = document.getElementById('vidClipFile');
    const anker = eingang && eingang.closest('label');
    if (!anker || !anker.parentElement) return;

    const kopf = document.createElement('h3');
    kopf.textContent = 'Beispielvideos';
    kopf.style.cssText = 'margin:6px 0 6px';
    anker.parentElement.insertBefore(kopf, anker);

    raster = document.createElement('div');
    raster.className = 'chips';
    raster.style.cssText = 'gap:8px;margin-bottom:8px';
    anker.parentElement.insertBefore(raster, anker);

    for (const b of BEISPIELE) {
      const k = document.createElement('button');
      k.className = 'swatch';
      k.dataset.bsp = b.id;
      k.title = b.hinweis;
      k.style.cssText = 'flex:1 1 30%;padding:0;overflow:hidden';
      const bild = document.createElement('img');
      bild.src = b.bild;
      bild.alt = b.name;
      bild.style.cssText = 'width:100%;display:block;border-radius:6px 6px 0 0';
      const lb = document.createElement('label');
      lb.textContent = b.name;
      k.appendChild(bild);
      k.appendChild(lb);
      k.onclick = () => laden(b);
      raster.appendChild(k);
    }

    const hinweis = document.createElement('p');
    hinweis.className = 'hint';
    hinweis.textContent = 'Ein Tipp genügt: Der Clip wird geladen und die Leinwand steht '
      + 'als Zeitpanorama über fünf Slides. Danach im Vorlagen-Tab eine Video-Vorlage '
      + 'für Schrift darüber wählen – oder unten den Modus ändern.';
    anker.parentElement.insertBefore(hinweis, anker);
  })();

  SS.BEISPIELE7 = { anzahl: BEISPIELE.length, ids: BEISPIELE.map(b => b.id) };
})();
