// src/structures/templates/warden-city.ts compiled by scripts/build-structures.mjs:
// structural assertions read the built .mcstructure, never the generator's own
// constants, so they prove what ships (§13, L0-wrdn-rul2..rul5). Only the
// surface marker, which is not part of the .mcstructure, is read from the module.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { buildSync } from 'esbuild';
import { cellIndex, parseMcstructure } from '../scripts/lib/mcstructure.mjs';
import { buildStructures } from '../scripts/build-structures.mjs';

const root = join(import.meta.dirname, '..');
const out = mkdtempSync(join(tmpdir(), 'andrew-warden-'));
buildStructures({ to: out });
const s = parseMcstructure(readFileSync(join(out, 'warden-city.mcstructure')));
buildSync({
  entryPoints: [join(root, 'src/structures/templates/warden-city.ts')],
  bundle: true,
  format: 'cjs',
  platform: 'neutral',
  outfile: join(out, 'warden-city.cjs'),
  logLevel: 'error',
});
const mod = createRequire(import.meta.url)(join(out, 'warden-city.cjs'));
rmSync(out, { recursive: true, force: true });

const [SX, SY, SZ] = s.size;
const inside = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < SX && y < SY && z < SZ;
const VOID = { name: 'minecraft:structure_void', states: {} };
const at = (x, y, z) => {
  const i = inside(x, y, z) ? s.primary[cellIndex(s.size, x, y, z)] : -1;
  return i === -1 ? VOID : s.palette[i];
};
const beAt = (x, y, z) => s.blockEntities.get(cellIndex(s.size, x, y, z));
const k = (x, y, z) => `${x},${y},${z}`;

function cellsOf(pred) {
  const found = [];
  for (let x = 0; x < SX; x++) for (let y = 0; y < SY; y++) for (let z = 0; z < SZ; z++) if (pred(at(x, y, z), x, y, z)) found.push([x, y, z]);
  return found;
}
const named = (name) => cellsOf((b) => b.name === name);

const N6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const H4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const isVoid = (b) => b.name === 'minecraft:structure_void';
const isAir = (b) => b.name === 'minecraft:air';
/** Cells a player moves through: air and the non-collision dressing on the floor or ceiling. */
const OPEN = /^minecraft:(air|sculk_vein|soul_torch|soul_lantern)$/;
const open = (b) => OPEN.test(b.name);

const CHESTS = named('minecraft:chest');
const SHRIEKERS = named('minecraft:sculk_shrieker');
const SENSORS = named('minecraft:sculk_sensor');
const MONUMENT = named('minecraft:reinforced_deepslate');

// The central hall, found from the blocks: the only room whose open space
// stands at least 6 high above its floor. Its x/z extent is the central zone.
const TALL = 6;
function openRun(x, z) {
  let best = 0;
  for (let y = 0, run = 0; y < SY; y++) {
    run = open(at(x, y, z)) ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}
const tallCols = new Set();
for (let x = 0; x < SX; x++) for (let z = 0; z < SZ; z++) if (openRun(x, z) >= TALL) tallCols.add(`${x},${z}`);
function components(keys) {
  const seen = new Set();
  const comps = [];
  for (const start of keys) {
    if (seen.has(start)) continue;
    const comp = [start];
    seen.add(start);
    for (let i = 0; i < comp.length; i++) {
      const [x, z] = comp[i].split(',').map(Number);
      for (const [dx, dz] of H4) {
        const n = `${x + dx},${z + dz}`;
        if (keys.has(n) && !seen.has(n)) {
          seen.add(n);
          comp.push(n);
        }
      }
    }
    comps.push(comp);
  }
  return comps;
}
const TALL_ROOMS = components(tallCols);
const HALL_COLS = new Set(TALL_ROOMS.sort((a, b) => b.length - a.length)[0] ?? []);
const hallXs = [...HALL_COLS].map((c) => Number(c.split(',')[0]));
const hallZs = [...HALL_COLS].map((c) => Number(c.split(',')[1]));
const HALL = { x0: Math.min(...hallXs), x1: Math.max(...hallXs), z0: Math.min(...hallZs), z1: Math.max(...hallZs) };
const inHall = (x, z, pad = 0) => x >= HALL.x0 - pad && x <= HALL.x1 + pad && z >= HALL.z0 - pad && z <= HALL.z1 + pad;
const HALL_CENTER = [(HALL.x0 + HALL.x1) / 2, (HALL.z0 + HALL.z1) / 2];
/** Horizontal distance from a cell to the hall's x/z rectangle. */
const toHall = (x, z) => Math.hypot(Math.max(HALL.x0 - x, 0, x - HALL.x1), Math.max(HALL.z0 - z, 0, z - HALL.z1));

// Interior: every open cell reachable from the hall. It must never touch the
// template's outside or the void around the outline — a sealed city.
function interior() {
  const [cx, cz] = HALL_CENTER.map(Math.round);
  let start = null;
  for (let y = 1; y < SY && !start; y++) if (open(at(cx, y, cz))) start = [cx, y, cz];
  const seen = new Set([k(...start)]);
  const cells = [start];
  const leaks = [];
  for (let i = 0; i < cells.length; i++)
    for (const [dx, dy, dz] of N6) {
      const n = [cells[i][0] + dx, cells[i][1] + dy, cells[i][2] + dz];
      const b = at(...n);
      if (!inside(...n) || isVoid(b)) {
        leaks.push(k(...n));
        continue;
      }
      if (!seen.has(k(...n)) && open(b)) {
        seen.add(k(...n));
        cells.push(n);
      }
    }
  return { cells, keys: seen, leaks };
}
const INTERIOR = interior();

/** The hall's highest open cell over its centre: the roof starts above it. */
const HALL_TOP = (() => {
  const [cx, cz] = HALL_CENTER.map(Math.round);
  let top = -1;
  for (let y = 1; y < SY; y++) if (open(at(cx, y, cz))) top = y;
  return top;
})();

// The hall's upper level, found from the blocks: above the hall floor, the
// walking level with the most standing cells (solid under, two open above) in
// the hall. Its floor is the block layer under that level.
const standing = (x, y, z) => !open(at(x, y - 1, z)) && !isVoid(at(x, y - 1, z)) && open(at(x, y, z)) && open(at(x, y + 1, z));
const UPPER = (() => {
  let best = { y: -1, cells: 0 };
  for (let y = 4; y < HALL_TOP; y++) {
    let cells = 0;
    for (let x = HALL.x0; x <= HALL.x1; x++) for (let z = HALL.z0; z <= HALL.z1; z++) if (standing(x, y, z)) cells++;
    if (cells > best.cells) best = { y, cells };
  }
  return best;
})();

// The city is four times the §13 footprint by area, with the contents grown in
// proportion: 62×62×20, 40 chests (12 in the hall), 8 shriekers.
const CHEST_COUNT = 40;
const HALL_CHESTS = 12;
const SHRIEKER_COUNT = 8;

test('AC1: footprint ≈62×62, height 20, exactly 40 single chests, 12 of them in the central hall', () => {
  const solid = cellsOf((b) => !isAir(b) && !isVoid(b));
  const ext = [0, 1, 2].map((i) => Math.max(...solid.map((c) => c[i])) - Math.min(...solid.map((c) => c[i])) + 1);
  // ≈62×62: within two blocks of 62 on each side; the outline itself is irregular.
  assert.ok(Math.abs(ext[0] - 62) <= 2 && Math.abs(ext[2] - 62) <= 2, `footprint ${ext[0]}×${ext[2]}`);
  assert.strictEqual(ext[1], 20, `height ${ext[1]}`);
  const corners = [[0, 0], [SX - 1, 0], [0, SZ - 1], [SX - 1, SZ - 1]].filter(([x, z]) => isVoid(at(x, 0, z)));
  assert.ok(corners.length >= 2, 'the outline is a plain rectangle, not irregular');

  assert.strictEqual(CHESTS.length, CHEST_COUNT, `${CHESTS.length} chests`);
  for (const other of ['minecraft:trapped_chest', 'minecraft:barrel', 'minecraft:ender_chest']) assert.strictEqual(named(other).length, 0, `${other} present`);
  for (const [x, y, z] of CHESTS) {
    for (const [dx, dz] of H4) assert.notStrictEqual(at(x + dx, y, z + dz).name, 'minecraft:chest', `chest ${k(x, y, z)} touches another chest`);
    const be = beAt(x, y, z);
    assert.strictEqual(be?.id, 'Chest', `chest ${k(x, y, z)} has no Chest block entity`);
    assert.ok(be.pairx === undefined && be.pairlead === undefined, `chest ${k(x, y, z)} carries pairing data`);
    assert.ok(isAir(at(x, y + 1, z)), `chest ${k(x, y, z)} cannot open: ${at(x, y + 1, z).name} on top`);
    assert.ok(N6.some(([dx, dy, dz]) => INTERIOR.keys.has(k(x + dx, y + dy, z + dz))), `chest ${k(x, y, z)} is sealed off from the city`);
  }

  assert.strictEqual(TALL_ROOMS.length, 1, `${TALL_ROOMS.length} rooms at least ${TALL} high`);
  assert.ok(HALL_COLS.size >= 400, `central hall of ${HALL_COLS.size} columns`);
  assert.ok(Math.abs(HALL_CENTER[0] - (SX - 1) / 2) <= 1 && Math.abs(HALL_CENTER[1] - (SZ - 1) / 2) <= 1, `hall centred at ${HALL_CENTER}, not in the middle of the template`);
  const central = CHESTS.filter(([x, , z]) => inHall(x, z));
  assert.strictEqual(central.length, HALL_CHESTS, `${central.length} chests in the central hall: ${central.map((c) => k(...c)).join(' ')}`);
  // The other 28 are spread out: every side of the city has some, none holds more than a third.
  const outer = CHESTS.filter(([x, , z]) => !inHall(x, z));
  const side = ([x, , z]) => {
    const [dx, dz] = [x - HALL_CENTER[0], z - HALL_CENTER[1]];
    return Math.abs(dx) >= Math.abs(dz) ? (dx > 0 ? 'E' : 'W') : dz > 0 ? 'S' : 'N';
  };
  const perSide = {};
  for (const c of outer) perSide[side(c)] = (perSide[side(c)] ?? 0) + 1;
  assert.ok(Object.keys(perSide).length === 4 && Math.max(...Object.values(perSide)) <= (CHEST_COUNT - HALL_CHESTS) / 3, `outer chests per side ${JSON.stringify(perSide)}`);
});

test('the hall is filled at height: at least 10 chests and 2 shriekers stand on its upper level, the totals stay 40 and 8', () => {
  assert.ok(UPPER.cells >= 150, `the hall's upper level has ${UPPER.cells} standing cells at y=${UPPER.y}: it is a ledge, not a floor`);
  const floorY = UPPER.y - 1;
  const above = (cells) => cells.filter(([x, y, z]) => inHall(x, z) && y > floorY);
  const byLevel = (cells) => [...new Set(cells.map(([, y]) => y))].sort((a, b) => a - b).map((y) => `y${y}:${cells.filter((c) => c[1] === y).length}`).join(' ');
  console.log(`# warden-city upper hall: floor y=${floorY}, ${UPPER.cells} standing cells; chests ${byLevel(CHESTS)}; shriekers ${byLevel(SHRIEKERS)}`);
  assert.strictEqual(CHESTS.length, CHEST_COUNT, `${CHESTS.length} chests`);
  assert.strictEqual(SHRIEKERS.length, SHRIEKER_COUNT, `${SHRIEKERS.length} shriekers`);
  assert.ok(above(CHESTS).length >= 10, `${above(CHESTS).length} chests above the upper hall floor y=${floorY}; by level ${byLevel(CHESTS)}`);
  assert.ok(above(SHRIEKERS).length >= 2, `${above(SHRIEKERS).length} shriekers above the upper hall floor y=${floorY}; by level ${byLevel(SHRIEKERS)}`);
  // Each of them stands on that level, not on some post sticking up through it.
  for (const c of [...above(CHESTS), ...above(SHRIEKERS)]) assert.strictEqual(c[1], UPPER.y, `${k(...c)} is not on the upper level y=${UPPER.y}`);
  // And the level is reached on foot: its floor joins the hall floor through the interior.
  assert.ok(INTERIOR.keys.has(k(...above(CHESTS)[0].map((v, i) => (i === 1 ? v + 1 : v)))), 'the upper level is sealed off from the hall');
});

test('AC2: exactly 8 can_summon shriekers — two by the central hall, six in the far parts, apart; more sensors than shriekers', () => {
  assert.strictEqual(SHRIEKERS.length, SHRIEKER_COUNT, `${SHRIEKERS.length} shriekers`);
  for (const [x, y, z] of SHRIEKERS) {
    const b = at(x, y, z);
    assert.strictEqual(b.states.can_summon, 1, `shrieker ${k(x, y, z)}: can_summon=${b.states.can_summon}`);
    assert.strictEqual(b.states.active, 0, `shrieker ${k(x, y, z)} starts active`);
    assert.strictEqual(beAt(x, y, z)?.id, 'SculkShrieker', `shrieker ${k(x, y, z)} has no SculkShrieker block entity`);
    assert.ok(open(at(x, y + 1, z)) && INTERIOR.keys.has(k(x, y + 1, z)), `shrieker ${k(x, y, z)} is not reachable by a player`);
  }
  // Fixed positions: the template is the only source, so pin them exactly.
  assert.deepStrictEqual(
    SHRIEKERS.map((c) => k(...c)).sort(),
    ['13,1,59', '3,1,35', '31,9,28', '42,9,41', '49,1,3', '56,1,56', '59,1,29', '6,1,6'],
    'shrieker positions moved'
  );

  // Eight shriekers call the Warden four times as fast as two: most stay in the far rooms, apart.
  const near = SHRIEKERS.filter(([x, , z]) => toHall(x, z) <= 2);
  const far = SHRIEKERS.filter(([x, , z]) => !inHall(x, z) && Math.hypot(x - HALL_CENTER[0], z - HALL_CENTER[1]) >= 24);
  assert.strictEqual(near.length, 2, `${near.length} shriekers by the hall`);
  assert.strictEqual(far.length, SHRIEKER_COUNT - 2, `${far.length} shriekers in the far parts`);
  for (let i = 0; i < SHRIEKERS.length; i++)
    for (let j = i + 1; j < SHRIEKERS.length; j++) {
      const [a, b] = [SHRIEKERS[i], SHRIEKERS[j]];
      assert.ok(Math.hypot(a[0] - b[0], a[2] - b[2]) >= 12, `shriekers ${k(...a)} and ${k(...b)} stand together`);
    }
  const monumentDist = Math.min(...near.map((s) => Math.min(...MONUMENT.map(([x, , z]) => Math.hypot(x - s[0], z - s[2])))));
  assert.ok(monumentDist <= 3, `the nearest hall shrieker is ${monumentDist.toFixed(1)} from the monument`);

  assert.ok(SENSORS.length > SHRIEKERS.length, `${SENSORS.length} sensors`);
  assert.ok(SENSORS.length >= 24, `${SENSORS.length} sensors — the sculk dressing is thin`);
  assert.ok(named('minecraft:sculk').length >= 400, `${named('minecraft:sculk').length} sculk blocks`);
  assert.ok(named('minecraft:sculk_vein').length >= 120, `${named('minecraft:sculk_vein').length} sculk veins`);
  // A sensor right next to a shrieker would relay non-player vibrations into it.
  for (const [x, y, z] of SENSORS)
    for (const [a, , c] of SHRIEKERS) assert.ok(Math.abs(x - a) + Math.abs(z - c) > 2, `sensor ${k(x, y, z)} hugs a shrieker`);
  // No Warden or any other entity is baked into the template.
  assert.strictEqual(s.entities?.length ?? 0, 0, 'the template carries entities');
});

test('AC3: a purely decorative reinforced deepslate monument ≈5 wide × 6–7 tall; nothing in the code acts on it', () => {
  assert.ok(MONUMENT.length > 0, 'no reinforced deepslate');
  const ext = [0, 1, 2].map((i) => Math.max(...MONUMENT.map((c) => c[i])) - Math.min(...MONUMENT.map((c) => c[i])) + 1);
  const width = Math.max(ext[0], ext[2]);
  const depth = Math.min(ext[0], ext[2]);
  assert.strictEqual(width, 5, `monument ${width} wide`);
  assert.strictEqual(depth, 1, `monument ${depth} deep`);
  assert.ok(ext[1] >= 6 && ext[1] <= 7, `monument ${ext[1]} tall`);
  for (const [x, y, z] of MONUMENT) {
    assert.ok(inHall(x, z), `monument cell ${k(x, y, z)} outside the central hall`);
    assert.strictEqual(beAt(x, y, z), undefined, `monument cell ${k(x, y, z)} carries a block entity`);
  }
  // One piece, standing on the floor.
  const keys = new Set(MONUMENT.map((c) => k(...c)));
  const seen = new Set([k(...MONUMENT[0])]);
  const queue = [MONUMENT[0]];
  while (queue.length) {
    const [x, y, z] = queue.pop();
    for (const [dx, dy, dz] of N6) {
      const n = k(x + dx, y + dy, z + dz);
      if (keys.has(n) && !seen.has(n)) {
        seen.add(n);
        queue.push([x + dx, y + dy, z + dz]);
      }
    }
  }
  assert.strictEqual(seen.size, MONUMENT.length, 'the monument is in pieces');

  // A building, not a frame on a beam: the masonry joined to the frame fills a
  // solid volume in the hall, reaching over the frame's top.
  const hallSolid = (b) => !open(b) && !isVoid(b) && !/chest|sculk_(sensor|shrieker)/.test(b.name);
  const body = new Set(seen);
  const grow = [...MONUMENT];
  while (grow.length) {
    const [x, y, z] = grow.pop();
    for (const [dx, dy, dz] of N6) {
      const n = [x + dx, y + dy, z + dz];
      // The hall's floor and walls are not the monument: stay inside the hall, above its floor.
      if (n[1] < 1 || n[1] > HALL_TOP || !inHall(n[0], n[2]) || toHall(n[0], n[2]) > 0 || body.has(k(...n)) || !hallSolid(at(...n))) continue;
      if (n[0] === HALL.x0 || n[0] === HALL.x1 || n[2] === HALL.z0 || n[2] === HALL.z1) continue;
      body.add(k(...n));
      grow.push(n);
    }
  }
  const bodyCells = [...body].map((c) => c.split(',').map(Number));
  const top = Math.max(...bodyCells.map((c) => c[1]));
  const frameTop = Math.max(...MONUMENT.map((c) => c[1]));
  console.log(`# warden-city monument: ${body.size} cells joined to the frame, top y=${top} (frame top ${frameTop})`);
  assert.ok(body.size >= 400, `the monument building is ${body.size} cells`);
  assert.ok(top >= frameTop + 3, `the monument stops at y=${top}, the frame's top is ${frameTop}`);

  // Nothing functional anywhere in the build: no portal, no redstone, no command or structure blocks.
  const names = [...new Set(s.palette.map((p) => p.name))];
  const functional = names.filter((n) =>
    /portal|gateway|command_block|structure_block|jigsaw|redstone|lever|button|pressure_plate|tripwire|observer|piston|repeater|comparator|dispenser|dropper|hopper|target|respawn_anchor|lodestone|beacon|conduit/.test(n)
  );
  assert.deepStrictEqual(functional, [], `functional blocks: ${functional.join(' ')}`);

  // No script refers to the monument. Three classification lists name the block
  // type for their own reasons (structure detection, blocks the Web Sword never
  // replaces, blocks the dig-down GameTest cannot break); any other mention
  // would be code acting on it.
  const LISTS = new Set(['src/structures/collision.ts', 'src/websword/cube.ts', 'src/gametest/warden.ts', 'src/structures/templates/warden-city.ts']);
  const files = [];
  const walk = (dir) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(ts|js|mjs|json)$/.test(f)) files.push(p);
    }
  };
  walk(join(root, 'src'));
  walk(join(root, 'packs', 'behavior'));
  const offenders = [];
  for (const p of files) {
    const rel = relative(root, p).split('\\').join('/');
    if (rel.endsWith('.mcstructure') || rel.startsWith('packs/behavior/scripts/')) continue;
    const text = readFileSync(p, 'utf-8');
    if (/reinforced_deepslate/.test(text) && !LISTS.has(rel)) offenders.push(`${rel}: names reinforced_deepslate`);
    if (/\bMONUMENT\b/.test(text) && rel !== 'src/structures/templates/warden-city.ts') offenders.push(`${rel}: uses MONUMENT`);
  }
  assert.deepStrictEqual(offenders, [], offenders.join('\n'));
});

// Block light, modelled as the Windmill and Airship tests do: an upper bound
// in which light passes every non-full block and falls by one per step.
const LIGHT_PASSES = /air|sculk_vein|sculk_sensor|sculk_shrieker|soul_lantern|soul_torch|chest/;
const EMITTERS = { 'minecraft:soul_lantern': 10, 'minecraft:soul_torch': 10 };
// Limits for "almost completely dark" (§13.1):
//  - MAX_LIGHTS 10: the build has eight — two torches at the monument, a
//    lantern in the ring avenue by each hall door and two at its corners, the
//    "few, by the passages and the centre" of §13.1 over a city four times the
//    §13 area; the cap leaves room for one more pair, no more. Every other
//    light-emitting vanilla block is banned outright below.
//  - LIT_LEVEL 7: at 7 and below a space still reads as dark in the vanilla
//    renderer; 7 is also the spawner Lmax the Windmill and Airship tests use.
//  - MAX_LIT_SHARE 0.15: under a sixth of the floor may be brighter than that.
//  - MIN_BLACK_SHARE 0.5: at least half the floor stays at block light 0 —
//    the only level where Bedrock (1.18+) spawns hostile mobs, i.e. the real
//    Ancient City's darkness.
const MAX_LIGHTS = 10;
const LIT_LEVEL = 7;
const MAX_LIT_SHARE = 0.15;
const MIN_BLACK_SHARE = 0.5;

test('AC4: almost completely dark — a handful of soul lamps, little lit floor, most of it at light 0', () => {
  const names = [...new Set(s.palette.map((p) => p.name))];
  const otherLights = names.filter(
    (n) =>
      !(n in EMITTERS) &&
      /lantern|torch|glowstone|sea_lantern|shroomlight|lamp|froglight|campfire|fire|lava|magma|candle|end_rod|glow_lichen|beacon|crying_obsidian|amethyst_cluster|sculk_catalyst|light_block|jack_o_lantern|conduit/.test(n)
  );
  assert.deepStrictEqual(otherLights, [], `other light sources: ${otherLights.join(' ')}`);
  const lamps = cellsOf((b) => b.name in EMITTERS);
  assert.ok(lamps.length > 0, 'no light at all — §13.1 places a few soul lamps');
  assert.ok(lamps.length <= MAX_LIGHTS, `${lamps.length} light sources > ${MAX_LIGHTS}`);
  // Every lamp sits in the hall or in a passage: an open run at most 5 wide across it.
  const span = (x, y, z, dx, dz) => {
    let n = 1;
    for (const s of [1, -1]) for (let i = 1; open(at(x + s * i * dx, y, z + s * i * dz)); i++) n++;
    return n;
  };
  for (const [x, y, z] of lamps) {
    const across = Math.min(span(x, y, z, 1, 0), span(x, y, z, 0, 1));
    assert.ok(toHall(x, z) <= 4 || across <= 5, `lamp ${k(x, y, z)} is ${toHall(x, z).toFixed(1)} from the central hall in an opening ${across} wide`);
  }

  const light = new Map();
  const queue = [];
  for (const [x, y, z] of lamps) {
    const l = EMITTERS[at(x, y, z).name];
    light.set(k(x, y, z), l);
    queue.push([x, y, z, l]);
  }
  while (queue.length) {
    const [x, y, z, l] = queue.shift();
    if (l <= 1) continue;
    for (const [dx, dy, dz] of N6) {
      const n = [x + dx, y + dy, z + dz];
      if (!inside(...n) || !LIGHT_PASSES.test(at(...n).name) || (light.get(k(...n)) ?? 0) >= l - 1) continue;
      light.set(k(...n), l - 1);
      queue.push([...n, l - 1]);
    }
  }
  // The floor: interior cells a player stands in (solid below, head room above).
  const floor = INTERIOR.cells.filter(([x, y, z]) => !open(at(x, y - 1, z)) && open(at(x, y + 1, z)));
  const lit = floor.filter((c) => (light.get(k(...c)) ?? 0) > LIT_LEVEL);
  const black = floor.filter((c) => (light.get(k(...c)) ?? 0) === 0);
  const litShare = lit.length / floor.length;
  const blackShare = black.length / floor.length;
  const hist = new Array(16).fill(0);
  for (const c of floor) hist[light.get(k(...c)) ?? 0]++;
  console.log(`# warden-city light: ${lamps.length} lamps, floor ${floor.length}, lit>${LIT_LEVEL} ${(litShare * 100).toFixed(1)}%, black ${(blackShare * 100).toFixed(1)}%, by level ${hist.join(' ')}`);
  assert.ok(floor.length >= 1600, `${floor.length} floor cells`);
  assert.ok(litShare < MAX_LIT_SHARE, `${(litShare * 100).toFixed(1)}% of the floor above block light ${LIT_LEVEL}`);
  assert.ok(blackShare >= MIN_BLACK_SHARE, `only ${(blackShare * 100).toFixed(1)}% of the floor at block light 0`);
});

const { MARKER, markerColumns, WARDEN_CITY_SIZE } = mod;
const CX = (SX - 1) / 2;
const CZ = (SZ - 1) / 2;

/** Walk down one column from the template top: what a player breaks before the first open cell. */
function digDown(x, z) {
  const broken = [];
  for (let y = SY - 1; y >= 0; y--) {
    const b = at(x, y, z);
    if (open(b)) return { broken, landed: [x, y, z] };
    broken.push(b.name);
  }
  return { broken, landed: null };
}

test('AC5 (template side): digging straight down from any marker cell breaks into the central hall', () => {
  assert.ok(Number.isInteger(CX) && Number.isInteger(CZ), `template ${SX}×${SZ} has no centre column that survives rotation`);
  for (const m of MARKER) {
    const [x, z] = [CX + m.dx, CZ + m.dz];
    const { broken, landed } = digDown(x, z);
    assert.ok(landed, `column ${x},${z} never opens`);
    assert.ok(INTERIOR.keys.has(k(...landed)) && inHall(x, z), `column ${x},${z} opens at ${landed} outside the hall`);
    assert.ok(!broken.some((n) => /reinforced_deepslate|bedrock|barrier/.test(n)), `column ${x},${z} runs through ${broken.join(' ')}`);
    // Room to drop into: at least two open cells under the break-in point.
    assert.ok(open(at(landed[0], landed[1] - 1, landed[2])), `column ${x},${z}: no head room under the roof`);
  }
  // The marker's centre stays over the template's centre column in every rotation.
  for (const rot of [0, 1, 2, 3]) {
    const origin = [100, 0, -50];
    const centre = markerColumns(origin, rot).find((c) => c.center);
    assert.deepStrictEqual([centre.x, centre.z], [origin[0] + CX, origin[2] + CZ], `rot ${rot}: marker centre moved off the city centre`);
  }
});

test('AC6: the marker hands out no ready way down — no ladder, no shaft, no open column to the city', () => {
  // The marker itself: one layer of sculk and veins inside 5×5, irregular, centred on sculk.
  assert.ok(MARKER.every((m) => Math.abs(m.dx) <= 2 && Math.abs(m.dz) <= 2), 'marker exceeds 5×5');
  assert.ok(MARKER.every((m) => m.kind === 'sculk' || m.kind === 'vein'), 'marker holds something other than sculk and veins');
  assert.ok(MARKER.length >= 15 && MARKER.length < 25, `marker of ${MARKER.length} cells is not an irregular ~5×5 patch`);
  assert.strictEqual(MARKER.find((m) => m.dx === 0 && m.dz === 0)?.kind, 'sculk', 'marker centre is not sculk');
  assert.strictEqual(new Set(MARKER.map((m) => `${m.dx},${m.dz}`)).size, MARKER.length, 'marker cells repeat');
  const shape = (rot) => markerColumns([0, 0, 0], rot).map((c) => `${c.x},${c.z}`).sort().join(' ');
  assert.notStrictEqual(shape(0), shape(1), 'the marker looks the same after a quarter turn: rotation would be invisible');
  assert.deepStrictEqual(WARDEN_CITY_SIZE, s.size, 'module size disagrees with the built structure');

  // No climbing or shaft blocks anywhere in the city.
  const names = [...new Set(s.palette.map((p) => p.name))];
  const climbing = names.filter((n) => /ladder|scaffolding|vine|stairs|water|bubble_column|slime|honey_block|rope|chain|dripleaf|powder_snow/.test(n));
  assert.deepStrictEqual(climbing, [], `climbing blocks: ${climbing.join(' ')}`);

  // The interior is sealed: no open cell reaches the template top, its sides or the void outside the outline.
  assert.deepStrictEqual(INTERIOR.leaks.slice(0, 5), [], `the interior opens to the outside at ${INTERIOR.leaks.slice(0, 5).join(' ')}`);
  // Above the hall, under the whole marker: a solid roof of at least 2 blocks, no pocket in it.
  for (const m of MARKER) {
    const [x, z] = [CX + m.dx, CZ + m.dz];
    const { broken } = digDown(x, z);
    assert.ok(broken.length >= 2, `column ${x},${z}: roof of ${broken.length}`);
  }
  // And no open column anywhere: no interior cell sees the template top straight up.
  const skylit = INTERIOR.cells.filter(([x, y, z]) => {
    for (let yy = y + 1; yy < SY; yy++) if (!open(at(x, yy, z))) return false;
    return true;
  });
  assert.deepStrictEqual(skylit.slice(0, 5), [], `open shaft to the top above ${skylit.slice(0, 5).map((c) => k(...c)).join(' ')}`);
});

test('the palette reads as an Ancient City: deepslate masonry, sculk, sensors, shriekers', () => {
  const names = new Set(s.palette.map((p) => p.name));
  for (const n of ['minecraft:deepslate_bricks', 'minecraft:deepslate_tiles', 'minecraft:sculk', 'minecraft:sculk_vein', 'minecraft:sculk_sensor', 'minecraft:sculk_shrieker', 'minecraft:reinforced_deepslate'])
    assert.ok(names.has(n), `${n} missing`);
  const foreign = [...names].filter((n) => !/deepslate|sculk|air|structure_void|chest|soul_|gray_wool/.test(n));
  assert.deepStrictEqual(foreign, [], `off-theme blocks: ${foreign.join(' ')}`);
});

// A player needs two cells of clearance, climbs at most one block and falls any distance —
// interior() only floods open cells, so it passes through gaps nobody can walk.
function walkFromMarkerShaft() {
  const passable = (x, y, z) => inside(x, y, z) && open(at(x, y, z));
  const stand = (x, y, z) => passable(x, y, z) && passable(x, y + 1, z) && inside(x, y - 1, z) && !passable(x, y - 1, z);
  const [cx, cz] = HALL_CENTER.map(Math.round);
  let start = null;
  for (let y = SY - 2; y >= 1 && !start; y--) if (stand(cx, y, cz)) start = [cx, y, cz];
  assert.ok(start, 'digging straight down the marker centre reaches no cell a player can stand on');

  const seen = new Set([k(...start)]);
  const queue = [start];
  while (queue.length > 0) {
    const [x, y, z] = queue.pop();
    for (const [dx, dz] of H4)
      for (let ny = y + 1; ny >= y - 8; ny--) {
        if (ny === y + 1 && !passable(x, y + 2, z)) continue;
        if (!stand(x + dx, ny, z + dz)) continue;
        let blocked = false;
        for (let t = Math.min(y, ny); t <= Math.max(y, ny) + 1 && !blocked; t++)
          if (t !== ny - 1 && !passable(x + dx, t, z + dz)) blocked = true;
        if (blocked) continue;
        if (!seen.has(k(x + dx, ny, z + dz))) {
          seen.add(k(x + dx, ny, z + dz));
          queue.push([x + dx, ny, z + dz]);
        }
        break;
      }
  }
  return seen;
}

test('every chest is reachable on foot from where the marker shaft lands', () => {
  const reached = walkFromMarkerShaft();
  const stranded = CHESTS.filter(([x, y, z]) =>
    !H4.some(([dx, dz]) => [0, -1, 1].some((dy) => reached.has(k(x + dx, y + dy, z + dz))))
  );
  assert.deepStrictEqual(stranded, [], `${stranded.length} of ${CHESTS.length} chests are walled off`);
});

test('the upper hall is reached on foot from the lower floor, not only by flying', () => {
  const reached = [...walkFromMarkerShaft()].map((c) => c.split(',').map(Number));
  const floors = new Set(reached.map(([, y]) => y));
  const hallFloor = Math.min(...SHRIEKERS.map(([, y]) => y).filter((y) => y > Math.min(...CHESTS.map(([, cy]) => cy)) + 4));
  assert.ok(floors.has(hallFloor), `no walking route reaches the hall floor at y=${hallFloor}`);
});
