// The Pearl Rod craft token's icon: what the recipe book and the crafting output slot show. The rod the
// player ends up holding is a vanilla fishing rod and keeps the vanilla look. Nothing here comes from Mojang.
//
//   node tools/draw-pearl-rod.mjs        rewrites the icon below
//
// tests/pearl-item.test.mjs fails when the shipped file drifts from what this draws.

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodePngRgba } from '../scripts/lib/png.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const ICON_PATH = join(root, 'packs/resource/textures/items/andrew_pearl_rod_token.png');

// g/G is the grip pair the Web Sword, the Scythe and the Storm Blade share, k the Storm Blade's outline;
// the line is mid grey so it holds on the light panel too, and the pearl at its end, with the near-white
// highlight, says what the rod is for.
export const PALETTE = {
  r: [0xc8, 0xa0, 0x6a],
  g: [0x8c, 0x5a, 0x32],
  G: [0x5a, 0x37, 0x19],
  k: [0x1e, 0x2a, 0x3c],
  s: [0xae, 0xb6, 0xbe],
  w: [0xf2, 0xff, 0xfb],
  q: [0x2a, 0x9d, 0x84],
  p: [0x14, 0x54, 0x4a],
};

export const ICON = [
  '................',
  '................',
  '............rs..',
  '...........rks..',
  '..........rk.s..',
  '.........rk..s..',
  '........rk...s..',
  '.......rk....s..',
  '......rk.....s..',
  '.....gG.....qwq.',
  '....gG......pqp.',
  '...gG........p..',
  '..gG............',
  '.kG.............',
  '................',
  '................',
];

export function iconRgba() {
  const rgba = new Uint8Array(16 * 16 * 4);
  ICON.forEach((row, y) =>
    [...row].forEach((key, x) => {
      if (key !== '.') rgba.set([...PALETTE[key], 255], (y * 16 + x) * 4);
    })
  );
  return rgba;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  writeFileSync(ICON_PATH, encodePngRgba({ width: 16, height: 16, rgba: iconRgba() }));
  console.log(`wrote ${ICON_PATH}`);
}
