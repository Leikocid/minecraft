// Minimal PNG writer: 8-bit RGB or RGBA, no interlace, one IDAT.
//
// Written by hand rather than pulled in as a dependency — the project asks before
// adding any, and a PNG of this shape is a header, a deflate and three CRCs.

import { deflateSync } from 'node:zlib';

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function encode({ width, height, colourType, bytesPerPixel, pixels }) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = colourType;
  // Every scanline carries a leading filter byte; 0 means "no filter".
  const stride = width * bytesPerPixel;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(pixels.buffer, pixels.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * @param {{ width: number, height: number, rgb: Uint8Array }} img `rgb` is width*height*3.
 * @returns {Buffer} a complete PNG file.
 */
export function encodePng({ width, height, rgb }) {
  if (rgb.length !== width * height * 3) throw new Error(`rgb is ${rgb.length} bytes, expected ${width * height * 3}`);
  return encode({ width, height, colourType: 2, bytesPerPixel: 3, pixels: rgb });
}

/**
 * @param {{ width: number, height: number, rgba: Uint8Array }} img `rgba` is width*height*4 — needed for icons with transparency (colour type 6).
 * @returns {Buffer} a complete PNG file.
 */
export function encodePngRgba({ width, height, rgba }) {
  if (rgba.length !== width * height * 4) throw new Error(`rgba is ${rgba.length} bytes, expected ${width * height * 4}`);
  return encode({ width, height, colourType: 6, bytesPerPixel: 4, pixels: rgba });
}
