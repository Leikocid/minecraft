// The Above-Water Trident's look: the icon measured against the legendaries the player
// already accepted, and the in-flight model wired end to end (entity, geometry, texture,
// render controller, animation). Both are read back from the shipped files, pixel by pixel.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng } from '../scripts/lib/png.mjs';
import {
  ICON_PATH,
  MODEL_TEXTURE_PATH,
  GEOMETRY_PATH,
  GEOMETRY_ID,
  MODEL_TEXTURE_SIZE,
  iconRgba,
  modelTextureRgba,
  geometryJson,
} from '../tools/draw-trident.mjs';

const root = join(fileURLToPath(import.meta.url), '..', '..');
const resource = join(root, 'packs', 'resource');
const items = join(resource, 'textures', 'items');
const readJson = (...parts) => JSON.parse(readFileSync(join(...parts), 'utf-8'));

const NEAR_BLACK = 50;
const NEAR_WHITE = 230;
const ACCEPTED = ['andrew_dragon_katana', 'andrew_web_sword', 'andrew_scythe_of_calamity', 'andrew_sculk_crossbow', 'andrew_storm_blade'];

const hex = (r, g, b) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
const luminance = (hexColour) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hexColour.slice(i, i + 2), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** Opaque pixels, colour census and bounding box of a 16x16 icon. */
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

test('trident icon: 16x16 RGBA, in the atlas, and exactly what tools/draw-trident.mjs draws', () => {
  const png = decodePng(readFileSync(ICON_PATH));
  assert.equal(png.width, 16);
  assert.equal(png.height, 16);
  assert.deepEqual([...png.rgba], [...iconRgba()], 'the shipped icon drifted from the drawer — run node tools/draw-trident.mjs');

  const atlas = readJson(resource, 'textures', 'item_texture.json');
  assert.equal(atlas.texture_data.andrew_above_water_trident?.textures, 'textures/items/andrew_above_water_trident');
  assert.ok(existsSync(join(items, 'andrew_above_water_trident.png')));
});

test('trident icon keeps the house style read out of the accepted legendaries', (t) => {
  for (const name of ACCEPTED) t.diagnostic(describe(name, census(decodePng(readFileSync(join(items, `${name}.png`))))));
  const icon = census(decodePng(readFileSync(ICON_PATH)));
  t.diagnostic(describe('andrew_above_water_trident', icon));
  t.diagnostic(`palette: ${[...icon.colours].map(([c, n]) => `${c}×${n}`).join(' ')}`);

  assert.ok(icon.opaque >= 35 && icon.opaque <= 46, `${icon.opaque} opaque pixels, the accepted set holds 35–46`);
  assert.ok(icon.colours.size >= 5 && icon.colours.size <= 9, `${icon.colours.size} colours, the accepted set holds 5–9`);
  assert.ok(luminance(icon.darkest) <= NEAR_BLACK, `darkest ${icon.darkest} is not near-black — nothing carries it on a light slot`);
  assert.ok(luminance(icon.lightest) >= NEAR_WHITE, `lightest ${icon.lightest} is not near-white — nothing carries it on the dark hotbar`);
  assert.deepEqual([icon.box.minX, icon.box.minY, icon.box.maxX, icon.box.maxY].map((v) => v >= 1 && v <= 14), [true, true, true, true], 'a one-pixel margin on every side');

  const webSword = census(decodePng(readFileSync(join(items, 'andrew_web_sword.png'))));
  for (const grip of ['#8C5A32', '#5A3719']) {
    assert.ok(webSword.colours.has(grip), `${grip} is no longer the Web Sword's grip`);
    assert.ok(icon.colours.has(grip), `the trident's grip lacks the Web Sword's ${grip}`);
  }
});

test('trident icon stands upright: the grip is two columns, the three prong tips three separate columns', () => {
  const icon = census(decodePng(readFileSync(ICON_PATH)));
  const columns = (colour) => new Set(icon.at.get(colour).map(([x]) => x));
  assert.deepEqual([...columns('#8C5A32')], [7], 'light grip runs straight down one column');
  assert.deepEqual([...columns('#5A3719')], [8], 'dark grip runs straight down the next one');

  const tips = [2, 7, 13].map((x) => icon.grid.findIndex((row) => row[x] !== null));
  assert.ok(tips.every((y) => y >= 1 && y <= 2), `prong tips must top the sprite, got rows ${tips}`);
  for (const x of [4, 5, 6, 9, 10, 11]) {
    for (let y = 0; y < 4; y++) assert.equal(icon.grid[y][x], null, `column ${x} row ${y} must stay clear between the prongs`);
  }
});

test('andrew:trident_in_flight: client entity, geometry, texture, render controller and animation agree', () => {
  const files = (dir) => readdirSync(join(resource, dir)).map((f) => readJson(resource, dir, f));
  const client = files('entity')
    .map((j) => j['minecraft:client_entity']?.description)
    .find((d) => d?.identifier === 'andrew:trident_in_flight');
  assert.ok(client, 'no client entity andrew:trident_in_flight under packs/resource/entity/');

  const server = readdirSync(join(root, 'packs', 'behavior', 'entities'))
    .map((f) => readJson(root, 'packs', 'behavior', 'entities', f)['minecraft:entity']?.description)
    .find((d) => d?.identifier === 'andrew:trident_in_flight');
  assert.equal(server?.is_summonable, true, 'the throw spawns it from script, which needs is_summonable');

  assert.equal(client.geometry.default, GEOMETRY_ID);
  const geo = readJson(GEOMETRY_PATH)['minecraft:geometry'].find((g) => g.description.identifier === GEOMETRY_ID);
  assert.ok(geo, `${GEOMETRY_ID} is not in ${GEOMETRY_PATH}`);
  assert.equal(readFileSync(GEOMETRY_PATH, 'utf-8'), geometryJson(), 'geometry drifted from the drawer');

  const texturePath = join(resource, `${client.textures.default}.png`);
  assert.equal(texturePath, MODEL_TEXTURE_PATH);
  const texture = decodePng(readFileSync(texturePath));
  assert.deepEqual([texture.width, texture.height], [MODEL_TEXTURE_SIZE, MODEL_TEXTURE_SIZE]);
  assert.deepEqual([geo.description.texture_width, geo.description.texture_height], [texture.width, texture.height]);
  assert.deepEqual([...texture.rgba], [...modelTextureRgba()], 'model texture drifted from the drawer');

  const controllers = Object.assign({}, ...files('render_controllers').map((j) => j.render_controllers));
  for (const id of client.render_controllers) assert.ok(controllers[id], `${id} is not defined under render_controllers/`);

  const animations = Object.assign({}, ...files('animations').map((j) => j.animations));
  const bones = new Set(geo.bones.map((b) => b.name));
  for (const key of client.scripts.animate) {
    const animation = animations[client.animations[key]];
    assert.ok(animation, `${client.animations[key]} is not defined under animations/`);
    for (const bone of Object.keys(animation.bones)) assert.ok(bones.has(bone), `${key} moves ${bone}, which the geometry lacks`);
  }
  const spin = animations[client.animations.fly].bones.spin.rotation;
  assert.match(String(spin[2]), /q(uery)?\.(life|anim)_time/, 'the spin must turn with time');
});

test('in-flight model: prongs lead toward -Z, every face samples one flat swatch', () => {
  const geo = readJson(GEOMETRY_PATH)['minecraft:geometry'][0];
  const texture = decodePng(readFileSync(MODEL_TEXTURE_PATH));
  const colourAt = (x, y) => {
    const p = (y * texture.width + x) * 4;
    return texture.rgba[p + 3] === 0 ? null : hex(texture.rgba[p], texture.rgba[p + 1], texture.rgba[p + 2]);
  };
  const cubes = geo.bones.flatMap((b) => b.cubes ?? []);
  const faceColour = (cube) => {
    const { uv, uv_size } = cube.uv.north;
    const seen = new Set();
    for (const face of Object.values(cube.uv)) {
      for (let y = face.uv[1]; y < face.uv[1] + face.uv_size[1]; y++) {
        for (let x = face.uv[0]; x < face.uv[0] + face.uv_size[0]; x++) seen.add(colourAt(x, y));
      }
    }
    assert.equal(seen.size, 1, `cube at ${cube.origin} samples ${[...seen]} from uv ${uv}+${uv_size}`);
    return [...seen][0];
  };
  const front = cubes.reduce((a, b) => (b.origin[2] < a.origin[2] ? b : a));
  const back = cubes.reduce((a, b) => (b.origin[2] + b.size[2] > a.origin[2] + a.size[2] ? b : a));
  assert.ok(luminance(faceColour(front)) >= NEAR_WHITE, 'the foremost (-Z) cube is a white prong tip');
  assert.equal(faceColour(back), '#1E2A3C', 'the rearmost (+Z) cube is the dark butt cap');
  for (const cube of cubes) faceColour(cube);
});
