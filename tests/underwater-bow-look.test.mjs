// The Underwater Bow's look: the icon read back pixel by pixel against the legendaries the
// player already accepted, and the in-hand frames, geometry, attachable and render controller
// wired end to end. Every shipped file must be exactly what tools/draw-underwater-bow.mjs draws.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng } from '../scripts/lib/png.mjs';
import {
  ICON_KEY,
  ICON_PATH,
  FRAME_KEYS,
  FRAME_TEXTURES,
  GEOMETRY_PATH,
  GEOMETRY_ID,
  GRIP,
  PULL,
  iconRgba,
  frameRgba,
  framePath,
  geometryJson,
  voxels,
} from '../tools/draw-underwater-bow.mjs';

const root = join(fileURLToPath(import.meta.url), '..', '..');
const resource = join(root, 'packs', 'resource');
const items = join(resource, 'textures', 'items');
const readJson = (...parts) => JSON.parse(readFileSync(join(...parts), 'utf-8'));

const NEAR_BLACK = 50;
const NEAR_WHITE = 230;
const ACCEPTED = ['andrew_dragon_katana', 'andrew_web_sword', 'andrew_scythe_of_calamity', 'andrew_storm_blade', 'andrew_above_water_trident'];
const GRIP_PAIR = ['#8C5A32', '#5A3719'];
// The vanilla bow's full draw, 1.0 s (L0-uwbw-eitm: max_draw_duration as a vanilla bow).
const DRAW_TICKS = 20;

const hex = (r, g, b) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
const luminance = (hexColour) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hexColour.slice(i, i + 2), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** Opaque pixels, colour census and bounding box of a 16x16 sprite. */
function census(png) {
  const colours = new Map();
  const at = new Map();
  const grid = Array.from({ length: png.height }, () => Array(png.width).fill(null));
  let opaque = 0;
  const box = { minX: 16, maxX: -1, minY: 16, maxY: -1 };
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const p = (y * png.width + x) * 4;
      const alpha = png.rgba[p + 3];
      assert.ok(alpha === 0 || alpha === 255, `pixel ${x},${y} is half transparent (${alpha})`);
      if (alpha === 0) continue;
      opaque++;
      const c = hex(png.rgba[p], png.rgba[p + 1], png.rgba[p + 2]);
      colours.set(c, (colours.get(c) ?? 0) + 1);
      grid[y][x] = c;
      at.set(c, [...(at.get(c) ?? []), [x, y]]);
      box.minX = Math.min(box.minX, x);
      box.maxX = Math.max(box.maxX, x);
      box.minY = Math.min(box.minY, y);
      box.maxY = Math.max(box.maxY, y);
    }
  }
  const byLight = [...colours.keys()].sort((a, b) => luminance(a) - luminance(b));
  return { opaque, colours, at, grid, box, darkest: byLight[0], lightest: byLight.at(-1) };
}

const describe = (name, c) =>
  `${name}: ${c.opaque} px, ${c.colours.size} colours, darkest ${c.darkest} (L ${luminance(c.darkest).toFixed(0)}), ` +
  `lightest ${c.lightest} (L ${luminance(c.lightest).toFixed(0)}), box x${c.box.minX}-${c.box.maxX} y${c.box.minY}-${c.box.maxY}`;

const readPng = (path) => decodePng(readFileSync(path));

// ------------------------------------------------------------------ icon

test('icon: 16x16 RGBA under the key andrew_underwater_bow, in the atlas, exactly what the drawer draws', () => {
  const png = readPng(ICON_PATH);
  assert.equal(ICON_KEY, 'andrew_underwater_bow');
  assert.equal(ICON_PATH, join(items, 'andrew_underwater_bow.png'));
  assert.deepEqual([png.width, png.height], [16, 16]);
  assert.deepEqual([...png.rgba], [...iconRgba()], 'the shipped icon drifted from the drawer — run node tools/draw-underwater-bow.mjs');

  const atlas = readJson(resource, 'textures', 'item_texture.json');
  assert.equal(atlas.texture_data[ICON_KEY]?.textures, `textures/items/${ICON_KEY}`, 'one texture, not a list of states');
});

test('icon keeps the house style read out of the accepted legendaries', (t) => {
  for (const name of ACCEPTED) t.diagnostic(describe(name, census(readPng(join(items, `${name}.png`)))));
  const icon = census(readPng(ICON_PATH));
  t.diagnostic(describe(ICON_KEY, icon));
  t.diagnostic(`palette: ${[...icon.colours].map(([c, n]) => `${c}×${n}`).join(' ')}`);

  assert.ok(icon.opaque >= 35 && icon.opaque <= 46, `${icon.opaque} opaque pixels, the accepted set holds 35–46`);
  assert.ok(icon.colours.size >= 5 && icon.colours.size <= 9, `${icon.colours.size} colours, the accepted set holds 5–9`);
  assert.ok(luminance(icon.darkest) <= NEAR_BLACK, `darkest ${icon.darkest} is not near-black — nothing carries it on a light slot`);
  assert.ok(luminance(icon.lightest) >= NEAR_WHITE, `lightest ${icon.lightest} is not near-white — nothing carries it on the dark hotbar`);
  assert.deepEqual([icon.box.minX, icon.box.minY, icon.box.maxX, icon.box.maxY].map((v) => v >= 1 && v <= 14), [true, true, true, true], 'a one-pixel margin on every side');
});

test("icon's grip is the pair the Web Sword, the Scythe and the Storm Blade share", () => {
  const icon = census(readPng(ICON_PATH));
  for (const name of ['andrew_web_sword', 'andrew_scythe_of_calamity', 'andrew_storm_blade']) {
    const accepted = census(readPng(join(items, `${name}.png`)));
    for (const colour of GRIP_PAIR) assert.ok(accepted.colours.has(colour), `${colour} is no longer ${name}'s grip`);
  }
  for (const colour of GRIP_PAIR) assert.ok(icon.colours.has(colour), `the bow's grip lacks ${colour}`);
  // Light stripe upper-left, dark lower-right, as on the accepted grips.
  const mean = (colour) => icon.at.get(colour).reduce((s, [x, y]) => s + x + y, 0) / icon.at.get(colour).length;
  assert.ok(mean(GRIP_PAIR[0]) < mean(GRIP_PAIR[1]), 'the light grip stripe lies upper-left of the dark one');
});

test('icon lies on the vanilla diagonal: a straight string bottom-left to top-right, the stave bowing out upper-left', () => {
  const icon = census(readPng(ICON_PATH));
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) assert.equal(icon.grid[y][x], icon.grid[x][y], `not symmetric about the diagonal at ${x},${y}`);

  const string = icon.at.get(icon.lightest);
  const sums = new Set(string.map(([x, y]) => x + y));
  assert.equal(sums.size, 1, 'the string is one straight anti-diagonal');
  const [chord] = sums;
  const xs = string.map(([x]) => x).sort((a, b) => a - b);
  assert.deepEqual(xs, Array.from({ length: xs.length }, (_, i) => xs[0] + i), 'the string is unbroken');
  assert.ok(xs.length >= 10, `the string spans the sprite, got ${xs.length} px`);

  for (const [colour, pixels] of icon.at) {
    if (colour === icon.lightest) continue;
    for (const [x, y] of pixels) assert.ok(x + y < chord, `${colour} at ${x},${y} is not on the stave side of the string`);
  }
  for (const colour of GRIP_PAIR) for (const [x, y] of icon.at.get(colour)) assert.ok(Math.abs(x - y) <= 2, `grip pixel ${x},${y} is off the middle of the stave`);
});

// ------------------------------------------------------------------ in-hand frames

const frames = FRAME_KEYS.map((key) => census(readPng(framePath(key))));
const nockOf = (frame) => Math.max(...frame.at.get('#FFF08A').filter(([, y]) => y === 7).map(([x]) => x));

test('the four in-hand frames are exactly what the drawer draws', () => {
  FRAME_KEYS.forEach((key, i) => {
    const png = readPng(framePath(key));
    assert.deepEqual([png.width, png.height], [16, 16]);
    assert.deepEqual([...png.rgba], [...frameRgba(i)], `${key} drifted from the drawer — run node tools/draw-underwater-bow.mjs`);
  });
});

test('frames share the icon palette and the stave; only the string and the arrow move', () => {
  const palette = census(readPng(ICON_PATH)).colours;
  for (const f of frames) for (const c of f.colours.keys()) assert.ok(palette.has(c), `${c} is not an icon colour`);
  const stave = (f) => f.grid.map((row, y) => row.map((c, x) => (x < 5 || x > 10 || y === 7 ? null : c === '#FFF08A' ? null : c)));
  for (const f of frames.slice(1)) assert.deepEqual(stave(f), stave(frames[0]), 'the stave is the same on every frame');
});

test('each pulling frame draws the string one pixel further and the arrow back with it', () => {
  assert.deepEqual(PULL, [0, 1, 2, 3]);
  const nocks = frames.map(nockOf);
  assert.deepEqual(nocks.map((n) => n - nocks[0]), PULL, `nock columns ${nocks}`);
  assert.ok(!frames[0].grid[7].slice(0, 5).some(Boolean), 'no arrow on the standby frame');
  const heads = frames.slice(1).map((f) => f.grid[7].findIndex((c) => c !== null));
  assert.deepEqual(heads.map((h) => h - heads[0]), [0, 1, 2], `the head follows the string back: columns ${heads}`);
  for (const head of heads) assert.ok(head < GRIP[0] - 1, 'the head stays in front of the grip');
});

// ------------------------------------------------------------------ geometry

const geo = readJson(GEOMETRY_PATH)['minecraft:geometry'][0];
const cubes = geo.bones.flatMap((b) => (b.cubes ?? []).map((c) => ({ bone: b.name, ...c })));

test('geometry: one cube per pixel opaque on any frame, each sampling only its own pixel', () => {
  assert.equal(readFileSync(GEOMETRY_PATH, 'utf-8'), geometryJson(), 'geometry drifted from the drawer');
  assert.equal(geo.description.identifier, GEOMETRY_ID);
  assert.deepEqual([geo.description.texture_width, geo.description.texture_height], [16, 16]);

  const union = new Set(frames.flatMap((f) => f.grid.flatMap((row, y) => row.map((c, x) => (c ? `${x},${y}` : null)).filter(Boolean))));
  assert.deepEqual(new Set(voxels().map(([x, y]) => `${x},${y}`)), union);
  assert.equal(cubes.length, union.size);
  for (const cube of cubes) {
    const faces = Object.values(cube.uv);
    assert.equal(faces.length, 6);
    for (const f of faces) assert.deepEqual(f, faces[0]);
    const [u, v] = faces[0].uv;
    assert.deepEqual(faces[0].uv_size, [1, 1]);
    assert.ok(union.has(`${u},${v}`), `cube samples ${u},${v}, opaque on no frame`);
    assert.deepEqual(cube.size, [1, 1, 1]);
    assert.equal(cube.origin[0], -0.5, 'one pixel thick, in the y-z plane');
    assert.deepEqual([cube.origin[1] + 0.5, cube.origin[2] + 0.5], [24 + GRIP[1] - v, u - GRIP[0]]);
  }
});

test('geometry: the grip sits where the hand pivot lands, the stave bows forward (-z), the string toward the holder', () => {
  const bones = new Map(geo.bones.map((b) => [b.name, b]));
  assert.equal(bones.get('root').binding, 'q.item_slot_to_bone_name(c.item_slot)');
  assert.deepEqual([bones.get('bow').parent, bones.get('sprite').parent], ['root', 'bow']);
  const sample = (cube) => cube.uv.north.uv;
  const grip = cubes.find((c) => sample(c)[0] === GRIP[0] && sample(c)[1] === GRIP[1]);
  assert.deepEqual(grip.origin, [-0.5, 23.5, -0.5]);
  const standby = frames[0];
  const z = (c) => c.origin[2] + 0.5;
  const shown = cubes.filter((c) => standby.grid[sample(c)[1]][sample(c)[0]] !== null);
  const string = shown.filter((c) => standby.grid[sample(c)[1]][sample(c)[0]] === '#FFF08A');
  const stave = shown.filter((c) => !string.includes(c));
  const front = Math.min(...stave.map(z));
  assert.ok(front < 0, 'the stave reaches in front of the hand');
  for (const c of stave.filter((c) => z(c) === front)) assert.ok(Math.abs(sample(c)[1] - GRIP[1]) <= 1, 'the frontmost stave pixels are the grip rows');
  assert.ok(Math.min(...string.map(z)) > Math.max(...stave.map(z)), 'the string is behind every stave pixel, toward the holder');
});

// ------------------------------------------------------------------ attachable

const attachable = readJson(resource, 'attachables', 'underwater_bow.json')['minecraft:attachable'].description;
const controllers = Object.assign({}, ...readdirSync(join(resource, 'render_controllers')).map((f) => readJson(resource, 'render_controllers', f).render_controllers));
const animations = Object.assign({}, ...readdirSync(join(resource, 'animations')).map((f) => readJson(resource, 'animations', f).animations));
const controller = controllers[attachable.render_controllers[0]];

test('attachable: andrew:underwater_bow, its four frames, its geometry and its controller agree', () => {
  assert.equal(attachable.identifier, 'andrew:underwater_bow');
  assert.deepEqual(attachable.textures, FRAME_TEXTURES);
  for (const key of FRAME_KEYS) assert.ok(existsSync(join(resource, `${attachable.textures[key]}.png`)), key);
  assert.deepEqual(attachable.geometry, { default: GEOMETRY_ID });
  assert.equal(attachable.materials.default, 'entity_alphatest', 'the cut-out material hides the cubes a frame leaves transparent');
  assert.deepEqual(attachable.render_controllers, ['controller.render.andrew.underwater_bow']);
  assert.deepEqual(controller.arrays.textures['Array.pull_frames'], FRAME_KEYS.map((k) => `Texture.${k}`));
  assert.deepEqual(controller.textures, ['Array.pull_frames[v.frame]']);
  assert.equal(controller.geometry, 'Geometry.default');

  const bones = new Set(geo.bones.map((b) => b.name));
  for (const entry of attachable.scripts.animate) {
    for (const key of typeof entry === 'string' ? [entry] : Object.keys(entry)) {
      const animation = animations[attachable.animations[key]];
      assert.ok(animation, `${attachable.animations[key]} is not defined under animations/`);
      assert.equal(animation.animation_length, undefined, 'no timeline of its own');
      for (const bone of Object.keys(animation.bones)) assert.ok(bones.has(bone), `${key} moves ${bone}, which the geometry lacks`);
    }
  }
});

/** Every Molang string the attachable and its controller evaluate. */
function molangStrings() {
  const out = [...(attachable.scripts.initialize ?? []), ...attachable.scripts.pre_animation, ...controller.textures];
  for (const entry of attachable.scripts.animate) if (typeof entry === 'object') out.push(...Object.values(entry));
  return out;
}

test('the frame is read from the two draw queries the crossbow probe measured live, and nothing else', () => {
  const names = new Set();
  for (const src of molangStrings()) for (const [, scope, name] of src.matchAll(/\b(q|query|v|variable|c|context)\.(\w+)/g)) names.add(`${scope[0]}.${name}`);
  assert.deepEqual([...names].filter((n) => n.startsWith('q.')).sort(), ['q.main_hand_item_max_duration', 'q.main_hand_item_use_duration']);
  assert.deepEqual([...names].filter((n) => n.startsWith('c.')), ['c.is_first_person']);
});

test('every comparison is parenthesised on its own: the client binds && tighter than ==', () => {
  for (const src of molangStrings()) {
    const re = /<=|>=|==|!=|<|>/g;
    let m;
    while ((m = re.exec(src))) {
      let depth = 0;
      let open = -1;
      for (let i = m.index - 1; i >= 0; i--) {
        if (src[i] === ')') depth++;
        else if (src[i] === '(' && depth-- === 0) {
          open = i;
          break;
        }
      }
      assert.ok(open >= 0, `unparenthesised ${m[0]} in ${src}`);
      let close = -1;
      depth = 0;
      for (let i = open + 1; i < src.length; i++) {
        if (src[i] === '(') depth++;
        else if (src[i] === ')' && depth-- === 0) {
          close = i;
          break;
        }
      }
      const inner = src.slice(open + 1, close).replace(/\([^()]*\)/g, '');
      assert.doesNotMatch(inner, /\?|:|&&|\|\|/, `${m[0]} shares its brackets with another operator in ${src}`);
    }
  }
});

/** Runs the attachable's pre_animation for one frame of the client and returns v.frame. */
function frameShown(mhud, mhmd) {
  const v = {};
  const q = { main_hand_item_use_duration: mhud, main_hand_item_max_duration: mhmd };
  for (const statement of attachable.scripts.pre_animation) new Function('q', 'v', 'c', statement)(q, v, {});
  return v.frame;
}

test('rest shows the standby frame; a draw walks the three pulling frames and holds the last from full power', async (t) => {
  // main_hand_item_use_duration counts the session's remaining ticks and reads 0 at rest;
  // main_hand_item_max_duration is the session's length (probe-crossbow-look.md, Q3).
  for (const session of [DRAW_TICKS, 50, 72000]) {
    await t.test(`a ${session}-tick use session`, () => {
      assert.equal(frameShown(0, session), 0, 'at rest');
      const shown = Array.from({ length: Math.min(session, 200) }, (_, tick) => frameShown(session - tick, session));
      for (let tick = 0; tick < shown.length; tick++) {
        const expected = tick < DRAW_TICKS / 2 ? 1 : tick < DRAW_TICKS ? 2 : 3;
        assert.equal(shown[tick], expected, `+${tick}`);
      }
      assert.equal(frameShown(0, session), 0, 'released: back to standby');
    });
  }
});

test("the item's own draw agrees with the frames once the item ships", (t) => {
  const path = join(root, 'packs', 'behavior', 'items', 'underwater_bow.json');
  if (!existsSync(path)) {
    t.diagnostic('andrew:underwater_bow is not in the behavior pack yet: the frames assume a vanilla bow draw of 1.0 s');
    return;
  }
  const item = JSON.parse(readFileSync(path, 'utf-8'))['minecraft:item'];
  assert.equal(item.components['minecraft:icon']?.textures?.default ?? item.components['minecraft:icon'], ICON_KEY);
  assert.equal(Math.round(item.components['minecraft:shooter'].max_draw_duration * 20), DRAW_TICKS, 'the last frame is full power');
  const use = item.components['minecraft:use_modifiers']?.use_duration;
  if (use !== undefined) assert.ok(use * 20 >= DRAW_TICKS, 'a use session shorter than the draw never shows the last frame');
});
