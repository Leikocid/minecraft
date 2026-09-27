// src/structures/templates/airship.ts compiled by scripts/build-structures.mjs:
// every assertion reads the built .mcstructure, never the generator's own
// constants, so it proves what ships (§5.1–§5.3, L0-airs-r001/r002).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cellIndex, parseMcstructure } from '../scripts/lib/mcstructure.mjs';
import { buildStructures } from '../scripts/build-structures.mjs';
import { build } from 'esbuild';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const bundle = await build({
  stdin: { contents: `export { ROLL_DEFS } from './src/structures/config.ts';`, resolveDir: join(dirname(fileURLToPath(import.meta.url)), '..'), loader: 'ts' },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
});
const { ROLL_DEFS } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64'));

const out = mkdtempSync(join(tmpdir(), 'andrew-airship-'));
buildStructures({ to: out });
const s = parseMcstructure(readFileSync(join(out, 'airship.mcstructure')));
rmSync(out, { recursive: true, force: true });

const [SX, SY, SZ] = s.size;
const inside = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < SX && y < SY && z < SZ;
const AIR = { name: 'minecraft:air', states: {} };
const at = (x, y, z) => (inside(x, y, z) ? s.palette[s.primary[cellIndex(s.size, x, y, z)]] : AIR);
const beAt = (x, y, z) => s.blockEntities.get(cellIndex(s.size, x, y, z));
const k = (x, y, z) => `${x},${y},${z}`;
const unk = (key) => key.split(',').map(Number);

function cellsOf(pred) {
  const found = [];
  for (let x = 0; x < SX; x++) for (let y = 0; y < SY; y++) for (let z = 0; z < SZ; z++) if (pred(at(x, y, z), x, y, z)) found.push([x, y, z]);
  return found;
}
const named = (name) => cellsOf((b) => b.name === name);

const N6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const H = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const CHESTS = named('minecraft:chest');
const SPAWNERS = named('minecraft:mob_spawner');
const DOOR_CELLS = named('minecraft:wooden_door');
const LOWER_DOORS = DOOR_CELLS.filter((c) => at(...c).states.upper_block_bit === 0);

// The corridor: the straight row of cells between the two doors, one step in from each.
const [DA, DB] = [...LOWER_DOORS].sort((a, b) => a[0] - b[0] || a[2] - b[2]);
const STEP = DA && DB ? [Math.sign(DB[0] - DA[0]), 0, Math.sign(DB[2] - DA[2])] : [0, 0, 0];
const CORRIDOR = [];
const inLine = DA && DB && DA[1] === DB[1] && (DA[0] === DB[0] || DA[2] === DB[2]);
if (inLine) for (let c = [DA[0] + STEP[0], DA[1], DA[2] + STEP[2]]; k(...c) !== k(...DB); c = [c[0] + STEP[0], c[1], c[2] + STEP[2]]) CORRIDOR.push(c);
const CORRIDOR_KEYS = new Set(CORRIDOR.map((c) => k(...c)));
const FLOOR_Y = DA ? DA[1] - 1 : -1;

/** First solid cell straight above the corridor's middle: the gondola roof. */
const MID = CORRIDOR[Math.floor(CORRIDOR.length / 2)];
let ROOF_Y = FLOOR_Y + 1;
while (MID && inside(MID[0], ROOF_Y, MID[2]) && at(MID[0], ROOF_Y, MID[2]).name === 'minecraft:air') ROOF_Y++;

const passable = (b) => b.name === 'minecraft:air' || b.name === 'minecraft:lantern';

/** The corridor's whole air column, floor to roof. */
const CORRIDOR_SPACE = new Set(CORRIDOR.flatMap(([x, , z]) => Array.from({ length: ROOF_Y - FLOOR_Y - 1 }, (_, i) => k(x, FLOOR_Y + 1 + i, z))));

/** Every air cell reachable from the corridor inside the gondola, doors closed. */
const INTERIOR = new Set(CORRIDOR_SPACE);
{
  const queue = [...INTERIOR].map(unk);
  while (queue.length) {
    const [x, y, z] = queue.pop();
    for (const [dx, dy, dz] of N6) {
      const n = [x + dx, y + dy, z + dz];
      if (!inside(...n) || INTERIOR.has(k(...n)) || !passable(at(...n)) || n[1] <= FLOOR_Y || n[1] >= ROOF_Y) continue;
      INTERIOR.add(k(...n));
      queue.push(n);
    }
  }
}
const standable = ([x, y, z]) => y === FLOOR_Y + 1 && at(x, y, z).name === 'minecraft:air' && at(x, y + 1, z).name === 'minecraft:air' && at(x, y - 1, z).name !== 'minecraft:air';

test('AC1: exactly 10 single chests, 1 Vindicator spawner under the aisle centre, 2 doors on opposite sides', () => {
  assert.strictEqual(CHESTS.length, 10, `${CHESTS.length} chests`);
  for (const other of ['minecraft:trapped_chest', 'minecraft:barrel', 'minecraft:ender_chest']) assert.strictEqual(named(other).length, 0, `${other} present`);
  for (const [x, y, z] of CHESTS) {
    for (const [dx, dz] of H) assert.notStrictEqual(at(x + dx, y, z + dz).name, 'minecraft:chest', `chest ${k(x, y, z)} touches another chest`);
    const be = beAt(x, y, z);
    assert.strictEqual(be?.id, 'Chest', `chest ${k(x, y, z)} has no Chest block entity`);
    assert.ok(be.pairx === undefined && be.pairlead === undefined, `chest ${k(x, y, z)} carries pairing data`);
    assert.strictEqual(at(x, y + 1, z).name, 'minecraft:air', `chest ${k(x, y, z)} cannot open: ${at(x, y + 1, z).name} on top`);
    assert.ok(H.some(([dx, dz]) => INTERIOR.has(k(x + dx, y, z + dz))) || INTERIOR.has(k(x, y + 1, z)), `chest ${k(x, y, z)} is not reachable from inside`);
  }

  // Doors: two stacked halves each, in the two long walls, facing each other across the gondola.
  assert.strictEqual(DOOR_CELLS.length, 4, `${DOOR_CELLS.length} door blocks`);
  assert.strictEqual(LOWER_DOORS.length, 2, `${LOWER_DOORS.length} lower door halves`);
  for (const [x, y, z] of LOWER_DOORS) assert.strictEqual(at(x, y + 1, z).states.upper_block_bit, 1, `door ${k(x, y, z)} has no upper half`);
  assert.ok(SX > SZ, `template is ${SX}×${SZ}: x is expected to be the long axis`);
  assert.strictEqual(DA[0], DB[0], 'the doors are not facing each other across the gondola');
  assert.ok(DB[2] - DA[2] >= 2, `doors at z=${DA[2]} and z=${DB[2]} are not on opposite sides`);
  assert.strictEqual(DA[1], DB[1], 'the doors are on different levels');
  const facings = [DA, DB].map((c) => at(...c).states['minecraft:cardinal_direction']);
  assert.deepStrictEqual(facings, ['south', 'north'], `door facings ${facings}`);

  // The aisle runs door to door, walkable end to end.
  assert.ok(CORRIDOR.length >= 3, `aisle ${CORRIDOR.length} long`);
  for (const c of CORRIDOR) assert.ok(standable(c), `aisle cell ${k(...c)} is not walkable`);

  assert.strictEqual(SPAWNERS.length, 1, `${SPAWNERS.length} spawners`);
  const [sp] = SPAWNERS;
  assert.strictEqual(beAt(...sp)?.id, 'MobSpawner', 'spawner has no MobSpawner block entity');
  assert.strictEqual(beAt(...sp).EntityIdentifier, 'minecraft:vindicator');
  assert.strictEqual([...s.blockEntities.values()].filter((be) => be.id === 'MobSpawner').length, 1, 'more than one MobSpawner block entity');
  assert.deepStrictEqual(sp, [DA[0], FLOOR_Y, (DA[2] + DB[2]) / 2], `spawner ${k(...sp)} is not in the floor under the aisle centre`);
});

// ------------------------------------------------------------------ the shape

const CONCRETE = /^minecraft:(light_)?gray_concrete$/;
const LIGHT = 'minecraft:sea_lantern';
const FIN = 'minecraft:iron_block';
const GONDOLA_TOP = ROOF_Y;
/** Envelope: concrete above the gondola, plus a light that caps it (a light touching concrete). */
const isEnvelope = (x, y, z) =>
  y > GONDOLA_TOP && (CONCRETE.test(at(x, y, z).name) || (at(x, y, z).name === LIGHT && N6.some(([dx, dy, dz]) => CONCRETE.test(at(x + dx, y + dy, z + dz).name))));
const ENVELOPE = cellsOf((_b, x, y, z) => isEnvelope(x, y, z));
const range = (vals) => (vals.length === 0 ? undefined : [Math.min(...vals), Math.max(...vals)]);
const span = (r) => (r === undefined ? 0 : r[1] - r[0] + 1);
const STATIONS = Array.from({ length: SX }, (_, x) => ENVELOPE.filter((c) => c[0] === x));
const [EX0, EX1] = range(ENVELOPE.map((c) => c[0]));
const E_LEN = EX1 - EX0 + 1;
const E_Z = range(ENVELOPE.map((c) => c[2]));
const E_Y = range(ENVELOPE.map((c) => c[1]));
const AXIS_Y = (E_Y[0] + E_Y[1]) / 2;
const AXIS_Z = (E_Z[0] + E_Z[1]) / 2;
/** Side view: vertical extent on the axis plane; plan view: horizontal extent on the axis height. */
const sideD = (x) => span(range(STATIONS[x].filter((c) => c[2] === AXIS_Z).map((c) => c[1])));
const planD = (x) => span(range(STATIONS[x].filter((c) => c[1] === AXIS_Y).map((c) => c[2])));
const TABLE = [0, 1, 3, 5, 5, 5, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 5, 5, 5, 5, 5, 5, 3, 3, 3, 3, 1, 1];
const DECLARED = ROLL_DEFS.find((d) => d.id === 'airship').size;

test('shape AC1: 28×11×7, the envelope at least 3.5 times as long as it is thick, in plan and from the side', () => {
  assert.deepStrictEqual(s.size, [28, 11, 7], `template ${s.size}`);
  assert.deepStrictEqual([...DECLARED], s.size, `declared ${DECLARED}`);
  const side = E_LEN / Math.max(...STATIONS.map((_, x) => sideD(x)));
  const plan = E_LEN / Math.max(...STATIONS.map((_, x) => planD(x)));
  assert.ok(side >= 3.5, `side fineness ${side.toFixed(2)} (${E_LEN} long)`);
  assert.ok(plan >= 3.5, `plan fineness ${plan.toFixed(2)} (${E_LEN} long)`);
});

test('shape AC2: every station is a round section of the tabled diameter, widest forward of the middle', () => {
  const side = STATIONS.map((_, x) => sideD(x));
  const plan = STATIONS.map((_, x) => planD(x));
  assert.deepStrictEqual(side, TABLE, 'side-view diameters by station');
  assert.deepStrictEqual(plan, TABLE, 'plan-view diameters by station');
  for (let x = 0; x < SX; x++) {
    const d = TABLE[x];
    const cells = STATIONS[x];
    if (d === 0) {
      assert.strictEqual(cells.length, 0, `station ${x}: envelope where the table has none`);
      continue;
    }
    // Round, not boxed: on the section's outermost rows and columns fewer cells than the diameter.
    const [y0, y1] = range(cells.map((c) => c[1]));
    const [z0, z1] = range(cells.map((c) => c[2]));
    assert.strictEqual(span([y0, y1]), d, `station ${x}: section height`);
    assert.strictEqual(span([z0, z1]), d, `station ${x}: section width`);
    if (d < 3) continue;
    for (const [label, row] of [['top', cells.filter((c) => c[1] === y1)], ['bottom', cells.filter((c) => c[1] === y0)]])
      assert.ok(row.length < d, `station ${x}: flat ${label}, ${row.length} of ${d} wide`);
    for (const [label, col] of [['north', cells.filter((c) => c[2] === z0)], ['south', cells.filter((c) => c[2] === z1)]])
      assert.ok(col.length < d, `station ${x}: flat ${label} side, ${col.length} of ${d} high`);
    // Centred on one axis.
    assert.strictEqual((y0 + y1) / 2, AXIS_Y, `station ${x} off the axis height`);
    assert.strictEqual((z0 + z1) / 2, AXIS_Z, `station ${x} off the axis line`);
  }
  const widest = Math.max(...TABLE);
  const wide = TABLE.flatMap((d, x) => (d === widest ? [x] : []));
  const mid = (EX0 + EX1) / 2;
  assert.ok(wide.reduce((a, b) => a + b, 0) / wide.length < mid, `widest stations ${wide} not forward of the middle x=${mid}`);
  // The tail takes the last ~45 %: from the end of the widest part to the tip.
  const tail = (EX1 - Math.max(...wide)) / E_LEN;
  assert.ok(tail >= 0.4 && tail <= 0.5, `tail ${(tail * 100).toFixed(0)} % of the length`);
  assert.strictEqual(TABLE[EX0], 1, 'the bow has no one-block tip');
  assert.strictEqual(TABLE[EX1], 1, 'the stern has no one-block tip');
});

test('shape: two greys and half blocks on the steps, lit bow, stern and fin tips', () => {
  // Shade: the lower third of the envelope darker than the rest.
  const lower = ENVELOPE.filter((c) => c[1] < E_Y[0] + 2 && CONCRETE.test(at(...c).name));
  const upper = ENVELOPE.filter((c) => c[1] > AXIS_Y && CONCRETE.test(at(...c).name));
  assert.ok(lower.length > 0 && lower.every((c) => at(...c).name === 'minecraft:gray_concrete'), 'the lower third is not gray');
  assert.ok(upper.length > 0 && upper.every((c) => at(...c).name === 'minecraft:light_gray_concrete'), 'the upper half is not light gray');
  // A step in diameter away from the fins gets a slab over the smaller station's top and under its bottom.
  for (let x = EX0; x < 21; x++) {
    const small = TABLE[x] < TABLE[x + 1] ? x : TABLE[x] > TABLE[x + 1] ? x + 1 : undefined;
    if (small === undefined) continue;
    const r = range(STATIONS[small].filter((c) => c[2] === AXIS_Z).map((c) => c[1]));
    const over = at(small, r[1] + 1, AXIS_Z);
    assert.ok(/slab/.test(over.name) && over.states['minecraft:vertical_half'] === 'bottom', `station ${small}: no slab over the step, ${over.name}`);
    if (r[0] - 1 > GONDOLA_TOP) {
      const under = at(small, r[0] - 1, AXIS_Z);
      assert.ok(/slab/.test(under.name) && under.states['minecraft:vertical_half'] === 'top', `station ${small}: no slab under the step, ${under.name}`);
    }
  }
  assert.strictEqual(at(EX0, AXIS_Y, AXIS_Z).name, LIGHT, 'the bow tip is not lit');
  assert.strictEqual(at(EX1, AXIS_Y, AXIS_Z).name, LIGHT, 'the stern tip is not lit');
});

test('shape AC3: four tail fins in a cross — two vertical, two horizontal — inside the declared size', () => {
  const fin = named(FIN);
  const groups = {
    up: fin.filter(([, y, z]) => z === AXIS_Z && y > AXIS_Y),
    down: fin.filter(([, y, z]) => z === AXIS_Z && y < AXIS_Y),
    north: fin.filter(([, y, z]) => y === AXIS_Y && z < AXIS_Z),
    south: fin.filter(([, y, z]) => y === AXIS_Y && z > AXIS_Z),
  };
  assert.strictEqual(Object.values(groups).reduce((n, g) => n + g.length, 0), fin.length, 'a fin block off the two fin planes');
  for (const [name, cells] of Object.entries(groups)) {
    assert.ok(cells.length > 0, `no ${name} fin`);
    const xs = range(cells.map((c) => c[0]));
    assert.deepStrictEqual(xs, [21, 26], `${name} fin chord x ${xs}`);
    assert.ok(xs[0] > (EX0 + EX1) / 2, `${name} fin is not on the tail`);
    // The fin carries the outline of the widest section on, no further.
    const reach = name === 'up' || name === 'down' ? Math.max(...cells.map((c) => Math.abs(c[1] - AXIS_Y))) : Math.max(...cells.map((c) => Math.abs(c[2] - AXIS_Z)));
    assert.strictEqual(reach, 3, `${name} fin reaches ${reach} past the axis, the widest section 3`);
    const tip = name === 'up' ? [26, AXIS_Y + 3, AXIS_Z] : name === 'down' ? [26, AXIS_Y - 3, AXIS_Z] : name === 'north' ? [26, AXIS_Y, AXIS_Z - 3] : [26, AXIS_Y, AXIS_Z + 3];
    assert.strictEqual(at(...tip).name, LIGHT, `${name} fin tip ${k(...tip)} is not lit`);
    for (const c of [...cells, tip]) for (let i = 0; i < 3; i++) assert.ok(c[i] >= 0 && c[i] < DECLARED[i], `${name} fin ${k(...c)} outside the declared ${DECLARED}`);
  }
  const solid = cellsOf((b) => b.name !== 'minecraft:air');
  for (let i = 0; i < 3; i++) assert.ok(Math.max(...solid.map((c) => c[i])) < DECLARED[i], `a block past the declared size on axis ${i}`);
});

test('shape AC4: a small gondola under the envelope — 9×5×4, forward, a block narrower each side, ≤ 40 % of the length', () => {
  const g = cellsOf((b, _x, y) => y <= GONDOLA_TOP && b.name !== 'minecraft:air');
  const [gx, gy, gz] = [0, 1, 2].map((i) => range(g.map((c) => c[i])));
  assert.deepStrictEqual([span(gx), span(gy), span(gz)], [9, 4, 5], `gondola ${span(gx)}×${span(gy)}×${span(gz)}`);
  assert.ok((gx[0] + gx[1]) / 2 < (EX0 + EX1) / 2, `gondola centre x=${(gx[0] + gx[1]) / 2} is not forward of the envelope centre x=${(EX0 + EX1) / 2}`);
  assert.deepStrictEqual(gz, [E_Z[0] + 1, E_Z[1] - 1], `gondola z ${gz} vs envelope z ${E_Z}`);
  assert.ok(span(gx) <= 0.4 * E_LEN, `gondola ${span(gx)} of ${E_LEN}`);
  // The envelope sits on the roof: no gap, no hangers.
  const roof = g.filter(([, y]) => y === GONDOLA_TOP);
  assert.ok(roof.some(([x, y, z]) => isEnvelope(x, y + 1, z)), 'the envelope does not rest on the gondola roof');
  assert.ok(gy[1] + 1 === E_Y[0], `envelope bottom y=${E_Y[0]} is not on the gondola roof y=${gy[1]}`);
  // Bow and stern walls trimmed at floor and roof.
  for (const x of gx) for (const y of gy) assert.ok(g.every((c) => !(c[0] === x && c[1] === y)), `gondola corner row x=${x} y=${y} not trimmed`);
  // A window strip: glass the whole way round at one height.
  const glass = named('minecraft:glass');
  assert.ok(glass.length >= 18, `${glass.length} windows`);
});

// Block light as the Windmill test models it: an upper bound, light passes everything but opaque cubes.
const TRANSPARENT = /air|door|glass|lantern|chest|spawner|iron_chain|slab/;
const LMAX = 7;
const EMITTERS = cellsOf((b) => b.name === 'minecraft:lantern' || b.name === LIGHT);

test('AC2: every light leaves the gondola inside the spawner reach at block light ≤ Lmax', () => {
  assert.ok(EMITTERS.length > 0, 'no lights at all');
  const light = new Map();
  const queue = EMITTERS.map((c) => [...c, 15]);
  for (const c of EMITTERS) light.set(k(...c), 15);
  while (queue.length) {
    const [x, y, z, l] = queue.shift();
    if (l <= 1) continue;
    for (const [dx, dy, dz] of N6) {
      const n = [x + dx, y + dy, z + dz];
      if (!inside(...n) || !TRANSPARENT.test(at(...n).name) || (light.get(k(...n)) ?? 0) >= l - 1) continue;
      light.set(k(...n), l - 1);
      queue.push([...n, l - 1]);
    }
  }
  // Vanilla spawner reach: 4 blocks horizontally, 1 vertically.
  const [sx, sy, sz] = SPAWNERS[0];
  let worst = 0;
  let where = '';
  let cells = 0;
  for (const key of INTERIOR) {
    const [x, y, z] = unk(key);
    if (Math.abs(x - sx) > 4 || Math.abs(z - sz) > 4 || Math.abs(y - sy) > 1) continue;
    cells++;
    const l = light.get(key) ?? 0;
    if (l > worst) [worst, where] = [l, key];
  }
  assert.ok(cells >= 8, `${cells} interior cells in the spawner reach`);
  assert.ok(worst <= LMAX, `block light ${worst} at ${where} > Lmax ${LMAX}`);
});

test('AC3: modern and whole — no decay blocks, and the hull has no hole but its two doors', () => {
  const MODERN = new Set([
    'minecraft:air',
    'minecraft:gray_concrete',
    'minecraft:light_gray_concrete',
    'minecraft:glass',
    'minecraft:iron_block',
    'minecraft:iron_chain',
    'minecraft:lantern',
    'minecraft:chest',
    'minecraft:mob_spawner',
    'minecraft:wooden_door',
    'minecraft:sea_lantern',
    'minecraft:smooth_stone_slab',
    'minecraft:polished_andesite_slab',
  ]);
  const names = [...new Set(s.palette.map((p) => p.name))];
  const decay = names.filter((n) => /vine|web|cracked|mossy|chipped|damaged|infested|cobble|lichen|moss/.test(n));
  assert.deepStrictEqual(decay, [], `decay blocks: ${decay.join(' ')}`);
  const foreign = names.filter((n) => !MODERN.has(n));
  assert.deepStrictEqual(foreign, [], `blocks outside the modern palette: ${foreign.join(' ')}`);
  assert.ok(named('minecraft:glass').length >= 4, 'no windows');

  // Everything reachable from the corridor through air, doors closed, stays inside the hull.
  const seen = new Set(CORRIDOR_KEYS);
  const queue = [...CORRIDOR];
  while (queue.length) {
    const [x, y, z] = queue.pop();
    for (const [dx, dy, dz] of N6) {
      const n = [x + dx, y + dy, z + dz];
      assert.ok(inside(...n), `the interior leaks out of the template at ${k(...n)}`);
      if (seen.has(k(...n)) || !passable(at(...n))) continue;
      assert.ok(n[1] > FLOOR_Y && n[1] < ROOF_Y, `the interior leaks through the floor or roof at ${k(...n)}`);
      const outer = n[0] === 0 || n[0] === SX - 1 || n[2] === 0 || n[2] === SZ - 1;
      assert.ok(!outer, `hole in the hull at ${k(...n)}`);
      seen.add(k(...n));
      queue.push(n);
    }
  }
});

test('AC4: the balloon is decoration — no chest or spawner above the gondola, no hidden space inside it', () => {
  assert.ok(ROOF_Y > FLOOR_Y + 2 && ROOF_Y < SY - 1, `roof at y=${ROOF_Y}`);
  const above = [...CHESTS, ...SPAWNERS].filter(([, y]) => y >= ROOF_Y);
  assert.deepStrictEqual(above, [], `above the gondola: ${above.map((c) => k(...c)).join(' ')}`);
  const balloon = cellsOf((b, _x, y) => y > ROOF_Y && b.name !== 'minecraft:air');
  assert.ok(balloon.length >= 200, `balloon of ${balloon.length} blocks`);

  // Air above the roof that the open sky cannot reach would be a chamber inside the balloon.
  const outside = new Set();
  const queue = [];
  for (let x = -1; x <= SX; x++) for (let y = -1; y <= SY; y++) for (let z = -1; z <= SZ; z++) if (!inside(x, y, z)) outside.add(k(x, y, z));
  for (const key of outside) {
    const [x, y, z] = unk(key);
    for (const [dx, dy, dz] of N6) {
      const n = [x + dx, y + dy, z + dz];
      if (inside(...n) && !outside.has(k(...n)) && at(...n).name === 'minecraft:air') {
        outside.add(k(...n));
        queue.push(n);
      }
    }
  }
  while (queue.length) {
    const [x, y, z] = queue.pop();
    for (const [dx, dy, dz] of N6) {
      const n = [x + dx, y + dy, z + dz];
      if (inside(...n) && !outside.has(k(...n)) && at(...n).name === 'minecraft:air') {
        outside.add(k(...n));
        queue.push(n);
      }
    }
  }
  const hidden = cellsOf((b, x, y, z) => y > ROOF_Y && b.name === 'minecraft:air' && !outside.has(k(x, y, z)));
  assert.deepStrictEqual(hidden, [], `enclosed air in the balloon: ${hidden.map((c) => k(...c)).join(' ')}`);
});

test('AC5: no ready way down — no ladder, stairs, water, lift or chain below the gondola', () => {
  const names = [...new Set(s.palette.map((p) => p.name))];
  const climbing = names.filter((n) =>
    /ladder|scaffolding|stairs|water|lava|bubble_column|vine|slime|honey_block|piston|portal|end_gateway|rail|powder_snow|dripleaf|rope/.test(n)
  );
  assert.deepStrictEqual(climbing, [], `ground-access blocks: ${climbing.join(' ')}`);
  const low = cellsOf((b, _x, y) => y < FLOOR_Y && b.name !== 'minecraft:air');
  assert.deepStrictEqual(low, [], `blocks hang below the gondola floor: ${low.map((c) => k(...c)).join(' ')}`);
  assert.strictEqual(FLOOR_Y, 0, `the gondola floor is at y=${FLOOR_Y}, not the template bottom`);
  const chains = named('minecraft:iron_chain');
  assert.ok(chains.every(([, y]) => y >= ROOF_Y), `a chain below the roof: ${chains.map((c) => k(...c)).join(' ')}`);
});
