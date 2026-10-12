// The Underwater Bow's look, drawn here and nowhere else: the inventory icon, the four
// in-hand frames (standby and three pulling stages) and the in-hand geometry built from
// them. Nothing in it comes from Mojang.
//
//   node tools/draw-underwater-bow.mjs                 rewrites the files below
//   node tools/draw-underwater-bow.mjs --preview <dir> also writes the previews there
//
// tests/underwater-bow-look.test.mjs fails when a shipped file drifts from what this draws.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng, encodePngRgba } from '../scripts/lib/png.mjs';
import { buildPreview } from './icon-preview.mjs';
import { renderTurns } from './model-preview.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const resource = join(root, 'packs', 'resource');
export const ICON_KEY = 'andrew_underwater_bow';
export const ICON_PATH = join(resource, 'textures', 'items', `${ICON_KEY}.png`);
export const FRAME_KEYS = ['default', 'pulling_0', 'pulling_1', 'pulling_2'];
export const FRAME_TEXTURES = {
  default: 'textures/entity/andrew_underwater_bow_standby',
  pulling_0: 'textures/entity/andrew_underwater_bow_pulling_0',
  pulling_1: 'textures/entity/andrew_underwater_bow_pulling_1',
  pulling_2: 'textures/entity/andrew_underwater_bow_pulling_2',
};
export const GEOMETRY_PATH = join(resource, 'models', 'entity', 'underwater_bow.geo.json');
export const GEOMETRY_ID = 'geometry.andrew.underwater_bow';

// Water by the trident's two sea blues, the strike by a lightning-yellow string that is
// also the near-white the dark hotbar needs; k is the Storm Blade's outline, g/G the grip
// pair the Web Sword, the Scythe and the Storm Blade share.
export const PALETTE = {
  l: [0x7f, 0xdc, 0xeb],
  m: [0x2c, 0x7d, 0xa0],
  w: [0xff, 0xf0, 0x8a],
  k: [0x1e, 0x2a, 0x3c],
  g: [0x8c, 0x5a, 0x32],
  G: [0x5a, 0x37, 0x19],
};

// The vanilla diagonal: the string runs bottom-left to top-right, the stave bows out to
// the upper left, the grip sits in the middle of the stave. Symmetric about x = y.
export const ICON = [
  '................',
  '..........lllk..',
  '........llmm.w..',
  '......llmm..w...',
  '....ggGm...w....',
  '....gGk...w.....',
  '...lGk...w......',
  '...lm...w.......',
  '..lm...w........',
  '..lm..w.........',
  '.lm..w..........',
  '.lm.w...........',
  '.l.w............',
  '.kw.............',
  '................',
  '................',
];

// In hand the bow is drawn upright, so third person needs no turn: the stave bows out to
// the left (model -Z, the way the hand faces), the string is the column on the right.
const STAVE = [
  '..........k.....',
  '.........lm.....',
  '........lm......',
  '.......lm.......',
  '......lm........',
  '......lm........',
  '.....gGk........',
  '.....gGk........',
  '.....gGk........',
  '......lm........',
  '......lm........',
  '.......lm.......',
  '........lm......',
  '.........lm.....',
  '..........k.....',
  '................',
];
const STRING_X = 11;
const STRING_ENDS = [0, 14];
const NOCK_Y = 7;
// The string is pulled back this many pixels on each frame; 0 is the standby frame.
export const PULL = [0, 1, 2, 3];
// Fletching, shaft and head from the nock forward: the arrow is the same length on every
// frame, so drawing the string back draws its head back toward the grip.
const ARROW = 'llggggggGkw';

/** Pixel lines between two points, one pixel per step along the longer axis. */
function line([x0, y0], [x1, y1]) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  return Array.from({ length: steps + 1 }, (_, i) => [
    Math.round(x0 + ((x1 - x0) * i) / (steps || 1)),
    Math.round(y0 + ((y1 - y0) * i) / (steps || 1)),
  ]);
}

/** One in-hand frame as 16 rows of palette keys. */
export function frameGrid(index) {
  const grid = STAVE.map((row) => [...row]);
  const pull = PULL[index];
  const nock = [STRING_X + pull, NOCK_Y];
  for (const end of STRING_ENDS) for (const [x, y] of line([STRING_X, end], nock)) grid[y][x] = 'w';
  if (pull > 0) [...ARROW].forEach((key, i) => (grid[NOCK_Y][nock[0] - 1 - i] = key));
  return grid.map((row) => row.join(''));
}

function rgbaOf(rows) {
  const rgba = new Uint8Array(16 * 16 * 4);
  rows.forEach((row, y) =>
    [...row].forEach((key, x) => {
      if (key !== '.') rgba.set([...PALETTE[key], 255], (y * 16 + x) * 4);
    })
  );
  return rgba;
}

export const iconRgba = () => rgbaOf(ICON);
export const frameRgba = (index) => rgbaOf(frameGrid(index));

// Model units are pixels. The root bone is bound to the hand slot; the engine takes 24 px
// off a bound bone in y, so the grip pixel is placed at y 24, z 0, where the hand pivot lands.
export const GRIP = [6, 7];
const HAND = [0, 24, 0];

/** Every pixel opaque in at least one frame: one cube each, sampling that pixel of whichever frame is shown. */
export function voxels() {
  const seen = new Set();
  for (const index of PULL.keys()) {
    frameGrid(index).forEach((row, y) => [...row].forEach((key, x) => key !== '.' && seen.add(y * 16 + x)));
  }
  return [...seen].sort((a, b) => a - b).map((p) => [p % 16, Math.floor(p / 16)]);
}

export function geometry() {
  const faces = ['north', 'east', 'south', 'west', 'up', 'down'];
  const cubes = voxels().map(([u, v]) => ({
    origin: [HAND[0] - 0.5, HAND[1] + (GRIP[1] - v) - 0.5, HAND[2] + (u - GRIP[0]) - 0.5],
    size: [1, 1, 1],
    uv: Object.fromEntries(faces.map((f) => [f, { uv: [u, v], uv_size: [1, 1] }])),
  }));
  return {
    format_version: '1.16.0',
    'minecraft:geometry': [
      {
        description: {
          identifier: GEOMETRY_ID,
          texture_width: 16,
          texture_height: 16,
          visible_bounds_width: 3,
          visible_bounds_height: 3.5,
          visible_bounds_offset: [0, 1.5, 0],
        },
        bones: [
          { name: 'root', pivot: HAND, binding: 'q.item_slot_to_bone_name(c.item_slot)' },
          { name: 'bow', parent: 'root', pivot: HAND },
          { name: 'sprite', parent: 'bow', pivot: HAND, cubes },
        ],
      },
    ],
  };
}

export function geometryJson() {
  const text = JSON.stringify(geometry(), null, 2);
  return text.replace(/\[\s+([-\d.,\s]+?)\s+\]/g, (_, inner) => `[${inner.trim().split(/,\s*/).join(', ')}]`) + '\n';
}

export const framePath = (key) => join(resource, `${FRAME_TEXTURES[key]}.png`);

function writePreviews(dir) {
  mkdirSync(dir, { recursive: true });
  const items = join(resource, 'textures', 'items');
  const accepted = ['andrew_dragon_katana', 'andrew_web_sword', 'andrew_scythe_of_calamity', 'andrew_storm_blade', 'andrew_above_water_trident'];
  const icons = [...accepted.map((n) => decodePng(readFileSync(join(items, `${n}.png`)))), { width: 16, height: 16, rgba: iconRgba() }];
  writeFileSync(join(dir, 'underwater-bow-look-preview.png'), buildPreview(icons));
  const frames = PULL.map((_, i) => ({ width: 16, height: 16, rgba: frameRgba(i) }));
  writeFileSync(join(dir, 'underwater-bow-look-frames.png'), buildPreview(frames));
  const geo = geometry()['minecraft:geometry'][0];
  const turns = frames.map((texture) =>
    decodePng(
      renderTurns({
        geo,
        texture,
        bone: 'sprite',
        axis: 'y',
        steps: 4,
        cameras: [{ yaw: 90, pitch: 0 }],
        backgrounds: [[126, 168, 220], [30, 30, 34]],
        cell: 200,
        scale: 9,
      })
    )
  );
  const { width, height } = turns[0];
  const rgba = new Uint8Array(width * height * turns.length * 4);
  turns.forEach((t, i) => rgba.set(t.rgba, i * width * height * 4));
  writeFileSync(join(dir, 'underwater-bow-look-hand.png'), encodePngRgba({ width, height: height * turns.length, rgba }));
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  writeFileSync(ICON_PATH, encodePngRgba({ width: 16, height: 16, rgba: iconRgba() }));
  FRAME_KEYS.forEach((key, i) => {
    mkdirSync(dirname(framePath(key)), { recursive: true });
    writeFileSync(framePath(key), encodePngRgba({ width: 16, height: 16, rgba: frameRgba(i) }));
  });
  writeFileSync(GEOMETRY_PATH, geometryJson());
  console.log([ICON_PATH, ...FRAME_KEYS.map(framePath), GEOMETRY_PATH].map((p) => `wrote ${p}`).join('\n'));
  const at = process.argv.indexOf('--preview');
  if (at > 0) {
    writePreviews(process.argv[at + 1]);
    console.log(`previews in ${process.argv[at + 1]}`);
  }
}
