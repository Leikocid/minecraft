// The Above-Water Trident's look, drawn here and nowhere else: the inventory icon,
// the in-flight model's texture and its geometry. Nothing in it comes from Mojang.
//
//   node tools/draw-trident.mjs        rewrites the three files below
//
// tests/trident-look.test.mjs fails when a shipped file drifts from what this draws.

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodePngRgba } from '../scripts/lib/png.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const ICON_PATH = join(root, 'packs/resource/textures/items/andrew_above_water_trident.png');
export const MODEL_TEXTURE_PATH = join(root, 'packs/resource/textures/entity/andrew_trident_in_flight.png');
export const GEOMETRY_PATH = join(root, 'packs/resource/models/entity/trident_in_flight.geo.json');
export const GEOMETRY_ID = 'geometry.andrew.trident_in_flight';

// k and v are the Storm Blade's outline and violet, g/G the grip pair the Web Sword,
// the Scythe and the Storm Blade share: water is said by the blues, storm by the violet.
export const PALETTE = {
  w: [0xf2, 0xfb, 0xff],
  l: [0x7f, 0xdc, 0xeb],
  m: [0x2c, 0x7d, 0xa0],
  v: [0x3a, 0x2a, 0x8c],
  k: [0x1e, 0x2a, 0x3c],
  g: [0x8c, 0x5a, 0x32],
  G: [0x5a, 0x37, 0x19],
};

// Upright, off the grip-bottom-left diagonal every other legendary is drawn on: on a
// 16 px diagonal the prongs and the crossbar become single pixels meeting only at their
// corners and the head breaks into speckle at hotbar size; upright, each prong is an
// unbroken column. Side by side in docs/feedback/trident-look-diagonal.png.
export const ICON = [
  '................',
  '.......wv.......',
  '..w....lv....w..',
  '..l....lv....m..',
  '..lm...lv...mk..',
  '...mmmmlvmmmk...',
  '.......lk.......',
  '.......mk.......',
  '.......gG.......',
  '.......gG.......',
  '.......gG.......',
  '.......gG.......',
  '.......gG.......',
  '.......gG.......',
  '.......kk.......',
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

// The model texture is one flat swatch per palette colour. Faces sample only the middle
// of a swatch, so mipmapping at a distance never bleeds a neighbour's colour in.
const SWATCH = 8;
const SWATCH_KEYS = ['w', 'l', 'm', 'k', 'v', 'g', 'G'];
export const MODEL_TEXTURE_SIZE = 32;

export function modelTextureRgba() {
  const size = MODEL_TEXTURE_SIZE;
  const rgba = new Uint8Array(size * size * 4);
  SWATCH_KEYS.forEach((key, i) => {
    const x0 = (i % 4) * SWATCH;
    const y0 = Math.floor(i / 4) * SWATCH;
    for (let y = y0; y < y0 + SWATCH; y++) {
      for (let x = x0; x < x0 + SWATCH; x++) rgba.set([...PALETTE[key], 255], (y * size + x) * 4);
    }
  });
  return rgba;
}

function swatchUv(key) {
  const i = SWATCH_KEYS.indexOf(key);
  return { uv: [(i % 4) * SWATCH + 2, Math.floor(i / 4) * SWATCH + 2], uv_size: [4, 4] };
}

// Model units are pixels (1/16 block). The prongs point to -Z, where the vanilla arrow
// keeps its head: the arrow's rotation expression, reused in the fly animation, turns -Z
// along the flight. The entity position sits just behind the tips, so a hit does not
// bury the head in the wall. The prongs spread along X, which is what makes a roll show.
const PARTS = [
  { name: 'butt', key: 'k', origin: [-1.5, 0.5, 23], size: [3, 3, 2] },
  { name: 'grip', key: 'g', origin: [-1, 1, 13], size: [2, 2, 10] },
  { name: 'shaft', key: 'm', origin: [-1, 1, 7], size: [2, 2, 6] },
  { name: 'collar', key: 'v', origin: [-1.5, 0.5, 5], size: [3, 3, 2] },
  { name: 'crossbar', key: 'm', origin: [-5, 1, 4], size: [10, 2, 1] },
  { name: 'prong_centre', key: 'l', origin: [-1, 1, -2], size: [2, 2, 6] },
  { name: 'prong_left', key: 'l', origin: [-5, 1, 0], size: [2, 2, 4] },
  { name: 'prong_right', key: 'm', origin: [3, 1, 0], size: [2, 2, 4] },
  { name: 'tip_centre', key: 'w', origin: [-0.5, 1.5, -4], size: [1, 1, 2] },
  { name: 'tip_left', key: 'w', origin: [-4.5, 1.5, -2], size: [1, 1, 2] },
  { name: 'tip_right', key: 'w', origin: [3.5, 1.5, -2], size: [1, 1, 2] },
];
export const PIVOT = [0, 2, 0];

export function geometry() {
  const faces = ['north', 'east', 'south', 'west', 'up', 'down'];
  return {
    format_version: '1.12.0',
    'minecraft:geometry': [
      {
        description: {
          identifier: GEOMETRY_ID,
          texture_width: MODEL_TEXTURE_SIZE,
          texture_height: MODEL_TEXTURE_SIZE,
          visible_bounds_width: 4,
          visible_bounds_height: 4,
          visible_bounds_offset: [0, 0, 0],
        },
        bones: [
          { name: 'body', pivot: PIVOT },
          {
            name: 'spin',
            parent: 'body',
            pivot: PIVOT,
            cubes: PARTS.map(({ key, origin, size }) => ({
              origin,
              size,
              uv: Object.fromEntries(faces.map((f) => [f, swatchUv(key)])),
            })),
          },
        ],
      },
    ],
  };
}

export function geometryJson() {
  const text = JSON.stringify(geometry(), null, 2);
  return text.replace(/\[\s+([-\d.,\s]+?)\s+\]/g, (_, inner) => `[${inner.trim().split(/,\s*/).join(', ')}]`) + '\n';
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  writeFileSync(ICON_PATH, encodePngRgba({ width: 16, height: 16, rgba: iconRgba() }));
  writeFileSync(
    MODEL_TEXTURE_PATH,
    encodePngRgba({ width: MODEL_TEXTURE_SIZE, height: MODEL_TEXTURE_SIZE, rgba: modelTextureRgba() })
  );
  writeFileSync(GEOMETRY_PATH, geometryJson());
  console.log(`wrote ${ICON_PATH}\nwrote ${MODEL_TEXTURE_PATH}\nwrote ${GEOMETRY_PATH}`);
}
