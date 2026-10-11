// Minimal PNG writer and reader: 8-bit RGB or RGBA, no interlace.
//
// Written by hand rather than pulled in as a dependency — the project asks before
// adding any, and a PNG of this shape is a header, a deflate and three CRCs.

import { deflateSync, inflateSync } from 'node:zlib';

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

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

/**
 * Reads what encodePng / encodePngRgba write, plus the four scanline filters other
 * tools use. 8-bit RGB (2) or RGBA (6), non-interlaced; anything else throws.
 * @param {Buffer} buf a complete PNG file.
 * @returns {{ width: number, height: number, rgba: Uint8Array }} RGB input comes back with alpha 255.
 */
export function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let pos = 8;
  let ihdr;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IHDR') ihdr = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IDAT') idat.push(buf.subarray(pos + 8, pos + 8 + len));
    pos += 12 + len;
  }
  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  const [depth, colourType, , , interlace] = ihdr.subarray(8);
  if (depth !== 8 || (colourType !== 2 && colourType !== 6) || interlace !== 0) {
    throw new Error(`unsupported PNG: depth ${depth}, colour type ${colourType}, interlace ${interlace}`);
  }
  const bpp = colourType === 6 ? 4 : 3;
  const stride = width * bpp;
  const raw = inflateSync(Buffer.concat(idat));
  const px = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let i = 0; i < stride; i++) {
      const x = raw[y * (stride + 1) + 1 + i];
      const a = i >= bpp ? px[y * stride + i - bpp] : 0;
      const b = y > 0 ? px[(y - 1) * stride + i] : 0;
      const c = i >= bpp && y > 0 ? px[(y - 1) * stride + i - bpp] : 0;
      const predictor = [0, a, b, (a + b) >> 1, paeth(a, b, c)][filter];
      if (predictor === undefined) throw new Error(`unknown scanline filter ${filter} on row ${y}`);
      px[y * stride + i] = (x + predictor) & 0xff;
    }
  }
  if (bpp === 4) return { width, height, rgba: px };
  const rgba = new Uint8Array(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    rgba.set(px.subarray(p * 3, p * 3 + 3), p * 4);
    rgba[p * 4 + 3] = 255;
  }
  return { width, height, rgba };
}
