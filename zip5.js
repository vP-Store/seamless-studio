/* ============================================================
   Seamless Studio 5.0 — ZIP-Schreiber
   Ersetzt JSZip. Speichert ohne Kompression (Methode „store"),
   weil JPEG, PNG, WebP, MP4 und WAV bereits komprimiert sind —
   ein Deflate-Durchgang brächte nichts und kostet nur Zeit.

   Bietet genau die API, die die App benutzt:
     const zip = new JSZip();
     const f = zip.folder('Name');
     f.file('bild.jpg', blob);
     zip.file('hinweis.txt', 'Text');
     await zip.generateAsync({ type: 'blob' });

   Wird nur aktiv, wenn kein funktionierendes JSZip vorliegt.
   ============================================================ */

(function () {
  const ok = (() => {
    try { return typeof window.JSZip === 'function' && typeof new window.JSZip().file === 'function'; }
    catch (e) { return false; }
  })();
  if (ok) return;

  /* CRC-32, Tabelle einmalig aufbauen */
  const TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(u8) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < u8.length; i++) c = TABLE[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  /* MS-DOS-Datum und -Zeit */
  function dosTime(d) {
    return ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() / 2)) & 0xFFFF;
  }
  function dosDate(d) {
    return (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
  }

  const enc = new TextEncoder();

  function Writer() {
    this.parts = [];
    this.len = 0;
  }
  Writer.prototype.push = function (u8) { this.parts.push(u8); this.len += u8.length; };
  Writer.prototype.u16 = function (v) { this.push(new Uint8Array([v & 255, (v >>> 8) & 255])); };
  Writer.prototype.u32 = function (v) {
    this.push(new Uint8Array([v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]));
  };

  function Zip(prefix, entries) {
    this._p = prefix || '';
    this._e = entries || [];
  }
  Zip.prototype.folder = function (name) {
    return new Zip(this._p + String(name).replace(/\/+$/, '') + '/', this._e);
  };
  Zip.prototype.file = function (name, data) {
    this._e.push({ name: this._p + name, data });
    return this;
  };
  Zip.prototype.generateAsync = async function (opts) {
    const now = new Date();
    const central = [];
    const w = new Writer();

    for (const e of this._e) {
      let bytes;
      if (typeof e.data === 'string') bytes = enc.encode(e.data);
      else if (e.data instanceof Uint8Array) bytes = e.data;
      else if (e.data instanceof ArrayBuffer) bytes = new Uint8Array(e.data);
      else bytes = new Uint8Array(await e.data.arrayBuffer());   // Blob / File

      const nameBytes = enc.encode(e.name);
      const crc = crc32(bytes);
      const offset = w.len;
      const t = dosTime(now), d = dosDate(now);

      w.u32(0x04034b50);            // Signatur der lokalen Kopfzeile
      w.u16(20);                    // benötigte Version
      w.u16(0x0800);                // Bit 11: Name ist UTF-8
      w.u16(0);                     // Methode: store
      w.u16(t); w.u16(d);
      w.u32(crc);
      w.u32(bytes.length); w.u32(bytes.length);
      w.u16(nameBytes.length); w.u16(0);
      w.push(nameBytes);
      w.push(bytes);

      central.push({ nameBytes, crc, size: bytes.length, offset, t, d });
    }

    const cdStart = w.len;
    for (const c of central) {
      w.u32(0x02014b50);
      w.u16(20); w.u16(20);
      w.u16(0x0800);
      w.u16(0);
      w.u16(c.t); w.u16(c.d);
      w.u32(c.crc);
      w.u32(c.size); w.u32(c.size);
      w.u16(c.nameBytes.length); w.u16(0); w.u16(0);
      w.u16(0); w.u16(0); w.u32(0);
      w.u32(c.offset);
      w.push(c.nameBytes);
    }
    const cdSize = w.len - cdStart;

    w.u32(0x06054b50);
    w.u16(0); w.u16(0);
    w.u16(central.length); w.u16(central.length);
    w.u32(cdSize); w.u32(cdStart);
    w.u16(0);

    const out = new Uint8Array(w.len);
    let p = 0;
    for (const part of w.parts) { out.set(part, p); p += part.length; }
    const blob = new Blob([out], { type: 'application/zip' });
    return (opts && opts.type === 'uint8array') ? out : blob;
  };

  window.JSZip = function () { return new Zip('', []); };
  window.JSZip.prototype = Zip.prototype;
  window.JSZip.__seamless = true;
})();
