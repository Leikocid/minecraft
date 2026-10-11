// Puts item icons side by side the way the player meets them: on the dark hotbar,
// on the grey inventory slot and on the light inventory panel, at hotbar size and
// magnified. The last icon is the one under review and gets a marker under it.
//
//   node tools/icon-preview.mjs --out dist/renders/icons.png a.png b.png new.png
//
// Backgrounds are flat approximations of the stock Bedrock UI colours, not
// screenshots: this answers "does it hold on dark and on light", not "how does the
// device render it" — that stays an iPad check.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng, encodePngRgba } from '../scripts/lib/png.mjs';

const BACKGROUNDS = [
  { name: 'hotbar', fill: [38, 38, 38], frame: [12, 12, 12] },
  { name: 'slot', fill: [139, 139, 139], frame: [55, 55, 55] },
  { name: 'panel', fill: [198, 198, 198], frame: [255, 255, 255] },
];
const SMALL = 3;
const BIG = 8;
const GAP = 8;
const MARK = [255, 200, 40];

export function buildPreview(icons) {
  const n = icons.length;
  const cellSmall = 16 * SMALL + 2 * 6;
  const cellBig = 16 * BIG + 2 * 8;
  const width = GAP + n * (cellBig + GAP);
  const rowSmall = cellSmall + GAP;
  const rowBig = cellBig + GAP + 6;
  const height = GAP + BACKGROUNDS.length * (rowSmall + rowBig) + GAP;
  const out = new Uint8Array(width * height * 4);
  const fill = (x0, y0, w, h, [r, g, b]) => {
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        const o = (y * width + x) * 4;
        out[o] = r;
        out[o + 1] = g;
        out[o + 2] = b;
        out[o + 3] = 255;
      }
    }
  };
  const blit = (icon, x0, y0, scale) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const i = (y * 16 + x) * 4;
        if (icon.rgba[i + 3] === 0) continue;
        fill(x0 + x * scale, y0 + y * scale, scale, scale, icon.rgba.subarray(i, i + 3));
      }
    }
  };
  fill(0, 0, width, height, [90, 90, 96]);
  let y = GAP;
  for (const bg of BACKGROUNDS) {
    for (const [scale, cell, pad] of [
      [SMALL, cellSmall, 6],
      [BIG, cellBig, 8],
    ]) {
      icons.forEach((icon, i) => {
        const x = GAP + i * (cellBig + GAP) + (cellBig - cell) / 2;
        fill(x - 2, y - 2, cell + 4, cell + 4, bg.frame);
        fill(x, y, cell, cell, bg.fill);
        blit(icon, x + pad, y + pad, scale);
        if (i === n - 1) fill(x, y + cell + 3, cell, 2, MARK);
      });
      y += scale === SMALL ? rowSmall : rowBig;
    }
  }
  return encodePngRgba({ width, height, rgba: out });
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const args = process.argv.slice(2);
  const outAt = args.indexOf('--out');
  if (outAt < 0 || args.length < outAt + 2) {
    console.error('usage: node tools/icon-preview.mjs --out <preview.png> <icon.png>... (last = under review)');
    process.exit(2);
  }
  const out = args[outAt + 1];
  const paths = args.filter((_, i) => i !== outAt && i !== outAt + 1);
  const icons = paths.map((p) => {
    const png = decodePng(readFileSync(p));
    if (png.width !== 16 || png.height !== 16) throw new Error(`${p} is ${png.width}x${png.height}, expected 16x16`);
    return png;
  });
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, buildPreview(icons));
  console.log(`${out}: ${paths.length} icons`);
}
