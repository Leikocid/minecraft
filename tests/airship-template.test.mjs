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
const range = (vals) => (vals.length === 0 ? undefined : [Math.min(...vals), Math.max(...vals)]);
const span = (r) => (r === undefined ? 0 : r[1] - r[0] + 1);
/** The template's central row: odd width, so a real row of blocks and not a seam. */
const AXIS_Z_OF_TEMPLATE = (SZ - 1) / 2;

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
const LAMPS = cellsOf((b) => b.name === 'minecraft:lantern' || b.name === 'minecraft:soul_lantern');
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

const passable = (b) => b.name === 'minecraft:air' || b.name === 'minecraft:lantern' || b.name === 'minecraft:soul_lantern';

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

/** Interior air around the corridor, flood-filled without crossing the corridor or a door; standable components are rooms. */
function interiorComponents() {
  const seen = new Set(CORRIDOR_SPACE);
  const comps = [];
  for (const c of CORRIDOR)
    for (let y = FLOOR_Y + 1; y < ROOF_Y; y++)
      for (const [dx, dz] of H) {
        const start = [c[0] + dx, y, c[2] + dz];
        if (seen.has(k(...start)) || !passable(at(...start))) continue;
        const cells = [start];
        seen.add(k(...start));
        for (let i = 0; i < cells.length; i++)
          for (const [ex, ey, ez] of N6) {
            const n = [cells[i][0] + ex, cells[i][1] + ey, cells[i][2] + ez];
            if (!seen.has(k(...n)) && inside(...n) && passable(at(...n)) && n[1] > FLOOR_Y && n[1] < ROOF_Y) {
              seen.add(k(...n));
              cells.push(n);
            }
          }
        comps.push(cells);
      }
  return comps;
}
const COMPONENTS = interiorComponents();
const ROOMS = COMPONENTS.filter((cells) => cells.some(standable));
const touches = (cellKeys, [x, y, z]) => H.some(([dx, dz]) => cellKeys.has(k(x + dx, y, z + dz)));

/** The gondola: the solid cells at or under its roof connected to the doors (the lower fin reaches that height far aft). */
const GONDOLA_CELLS = [];
{
  const seen = new Set();
  const queue = DA ? [DA] : [];
  if (DA) seen.add(k(...DA));
  while (queue.length) {
    const c = queue.pop();
    GONDOLA_CELLS.push(c);
    for (const [dx, dy, dz] of N6) {
      const n = [c[0] + dx, c[1] + dy, c[2] + dz];
      if (!inside(...n) || seen.has(k(...n)) || n[1] > ROOF_Y || at(...n).name === 'minecraft:air') continue;
      seen.add(k(...n));
      queue.push(n);
    }
  }
}
const G_X = [Math.min(...GONDOLA_CELLS.map((c) => c[0])), Math.max(...GONDOLA_CELLS.map((c) => c[0]))];
const G_Z = [Math.min(...GONDOLA_CELLS.map((c) => c[2])), Math.max(...GONDOLA_CELLS.map((c) => c[2]))];

test('AC5: exactly 10 single chests, 1 Vindicator spawner at the corridor centre, 2 doors on opposite ends', () => {
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

  // Doors: two stacked halves each, on the bow and stern ends of the gondola along the long axis (L0-airs-ac02, -as01).
  assert.strictEqual(DOOR_CELLS.length, 4, `${DOOR_CELLS.length} door blocks`);
  assert.strictEqual(LOWER_DOORS.length, 2, `${LOWER_DOORS.length} lower door halves`);
  for (const [x, y, z] of LOWER_DOORS) assert.strictEqual(at(x, y + 1, z).states.upper_block_bit, 1, `door ${k(x, y, z)} has no upper half`);
  for (const [x, y, z] of LOWER_DOORS) assert.notStrictEqual(at(x, y - 1, z).name, 'minecraft:air', `door ${k(x, y, z)} has no sill under it`);
  assert.ok(SX > SZ, `template is ${SX}×${SZ}: x is expected to be the long axis`);
  assert.deepStrictEqual([DA[0], DB[0]], G_X, `doors at x=${DA[0]} and x=${DB[0]}, not on the two ends of the gondola ${G_X}`);
  assert.strictEqual(DA[2], DB[2], 'the doors are not facing each other along the gondola');
  assert.strictEqual(DA[1], DB[1], 'the doors are on different levels');
  const facings = [DA, DB].map((c) => at(...c).states['minecraft:cardinal_direction']);
  assert.deepStrictEqual(facings, ['east', 'west'], `door facings ${facings}`);

  // The corridor runs door to door, walkable end to end.
  assert.ok(CORRIDOR.length >= 11, `corridor ${CORRIDOR.length} long`);
  for (const c of CORRIDOR) assert.ok(standable(c), `corridor cell ${k(...c)} is not walkable`);

  assert.strictEqual(SPAWNERS.length, 1, `${SPAWNERS.length} spawners`);
  const [sp] = SPAWNERS;
  assert.strictEqual(beAt(...sp)?.id, 'MobSpawner', 'spawner has no MobSpawner block entity');
  assert.strictEqual(beAt(...sp).EntityIdentifier, 'minecraft:vindicator');
  assert.strictEqual([...s.blockEntities.values()].filter((be) => be.id === 'MobSpawner').length, 1, 'more than one MobSpawner block entity');
  const centre = (DA[0] + DB[0]) / 2;
  assert.ok(Math.abs(sp[0] - centre) <= 1 && sp[2] === DA[2], `spawner ${k(...sp)} is not at the corridor centre x≈${centre}, z=${DA[2]}`);
  assert.ok(sp[1] === FLOOR_Y || CORRIDOR_KEYS.has(k(sp[0], sp[1], sp[2])), `spawner ${k(...sp)} is neither in the corridor floor nor in the corridor`);
});

/** Chests opened from a set of cells: beside one of them, or under one. */
const opensOnto = (cellKeys, [x, y, z]) => touches(cellKeys, [x, y, z]) || cellKeys.has(k(x, y + 1, z));

test('AC5: one corridor plus 4 cabins two cells deep, one ceiling lamp and two chests per cabin, two chests in the corridor', () => {
  // Everything inside the gondola that is not the corridor is one of the four cabins: one corridor, no side passage.
  assert.strictEqual(COMPONENTS.length, 4, `${COMPONENTS.length} spaces off the corridor: ${COMPONENTS.map((r) => r.length).join(' ')}`);
  assert.strictEqual(ROOMS.length, 4, `${ROOMS.length} rooms: ${ROOMS.map((r) => r.length).join(' ')}`);
  assert.ok(CORRIDOR.every((c) => c[2] === AXIS_Z_OF_TEMPLATE), 'the corridor is not on the central row');
  const roomKeys = ROOMS.map((cells) => new Set(cells.map((c) => k(...c))));
  ROOMS.forEach((cells, i) => {
    const lamps = cells.filter((c) => LAMPS.some((l) => k(...l) === k(...c)));
    assert.strictEqual(lamps.length, 1, `room ${i}: ${lamps.length} lamps`);
    const [lx, ly, lz] = lamps[0];
    assert.strictEqual(at(lx, ly, lz).states.hanging, 1, `room ${i}: lamp is not hanging`);
    assert.strictEqual(ly + 1, ROOF_Y, `room ${i}: lamp at y=${ly} does not hang from the ceiling at y=${ROOF_Y}`);
    const chests = CHESTS.filter((c) => opensOnto(roomKeys[i], c));
    assert.strictEqual(chests.length, 2, `room ${i}: ${chests.length} chests`);
    const doorways = cells.filter((c) => touches(CORRIDOR_KEYS, c));
    assert.ok(doorways.length > 0, `room ${i} has no doorway onto the corridor`);
    // The floor plan, chests included: 5 along the corridor, 2 deep away from it.
    const plan = new Set([...cells, ...chests].map(([x, , z]) => `${x},${z}`));
    const xs = range([...plan].map((p) => Number(p.split(',')[0])));
    const zs = range([...plan].map((p) => Number(p.split(',')[1])));
    assert.deepStrictEqual([span(xs), span(zs), plan.size], [5, 2, 10], `room ${i}: ${span(xs)}×${span(zs)}, ${plan.size} cells`);
    assert.ok(zs[0] > AXIS_Z_OF_TEMPLATE || zs[1] < AXIS_Z_OF_TEMPLATE, `room ${i} straddles the corridor`);
  });
  assert.strictEqual(LAMPS.length, 4, `${LAMPS.length} lamps in total`);
  const corridorChests = CHESTS.filter((c) => opensOnto(CORRIDOR_SPACE, c) && !roomKeys.some((r) => opensOnto(r, c)));
  assert.strictEqual(corridorChests.length, 2, `${corridorChests.length} corridor chests`);
  assert.strictEqual(corridorChests.length + ROOMS.length * 2, CHESTS.length, 'a chest belongs to no room and not to the corridor');
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
const SIDE = STATIONS.map((_, x) => sideD(x));
const DIAMETER = Math.max(...SIDE);
const DECLARED = ROLL_DEFS.find((d) => d.id === 'airship').size;

test('scale AC1: 75×18×13, the envelope 5.0–6.5 times as long as it is thick, in plan and from the side', () => {
  assert.deepStrictEqual(s.size, [75, 18, 13], `template ${s.size}`);
  assert.deepStrictEqual([...DECLARED], s.size, `declared ${DECLARED}`);
  const side = E_LEN / DIAMETER;
  const plan = E_LEN / Math.max(...STATIONS.map((_, x) => planD(x)));
  assert.strictEqual(E_LEN, 73, `envelope ${E_LEN} long`);
  assert.strictEqual(DIAMETER, 13, `envelope ${DIAMETER} across`);
  assert.strictEqual(span(E_Z), 13, `envelope ${span(E_Z)} wide`);
  assert.ok(side >= 5 && side <= 6.5, `side fineness ${side.toFixed(2)} (${E_LEN} long)`);
  assert.ok(plan >= 5 && plan <= 6.5, `plan fineness ${plan.toFixed(2)} (${E_LEN} long)`);
});

test('scale AC2: a blunt bow full in 8 blocks, full diameter to 45 % of the length, then down to 1; no flat top or bottom anywhere', () => {
  const plan = STATIONS.map((_, x) => planD(x));
  assert.deepStrictEqual(plan, SIDE, 'plan and side diameters differ: sections are not round');
  const len = SIDE.slice(EX0, EX1 + 1);
  assert.deepStrictEqual(len.slice(0, 8), [1, 3, 5, 7, 9, 11, 13, 13], `bow ${len.slice(0, 8)}`);
  const full = len.flatMap((d, i) => (d === DIAMETER ? [i] : []));
  const lastFull = Math.max(...full);
  assert.deepStrictEqual(full, Array.from({ length: lastFull - 6 + 1 }, (_, i) => 6 + i), 'the full diameter is not one unbroken run');
  const held = (lastFull + 1) / E_LEN;
  assert.ok(Math.abs(held - 0.45) <= 1 / E_LEN, `full diameter held to ${(held * 100).toFixed(1)} % of the length`);
  const tail = len.slice(lastFull);
  for (let i = 1; i < tail.length; i++) {
    assert.ok(tail[i] <= tail[i - 1], `tail widens at station ${EX0 + lastFull + i}`);
    assert.ok(tail[i - 1] - tail[i] === 0 || tail[i - 1] - tail[i] === 2, `tail steps by ${tail[i - 1] - tail[i]} at station ${EX0 + lastFull + i}`);
  }
  assert.strictEqual(tail[tail.length - 1], 1, 'the stern has no one-block tip');
  for (let x = 0; x < SX; x++) {
    const d = SIDE[x];
    const cells = STATIONS[x];
    if (d === 0) {
      assert.strictEqual(cells.length, 0, `station ${x}: envelope off the axis plane`);
      continue;
    }
    // Round, not boxed: on the section's outermost rows and columns fewer cells than the diameter.
    const [y0, y1] = range(cells.map((c) => c[1]));
    const [z0, z1] = range(cells.map((c) => c[2]));
    assert.strictEqual(span([y0, y1]), d, `station ${x}: section height`);
    assert.strictEqual(span([z0, z1]), d, `station ${x}: section width`);
    assert.strictEqual((y0 + y1) / 2, AXIS_Y, `station ${x} off the axis height`);
    assert.strictEqual((z0 + z1) / 2, AXIS_Z, `station ${x} off the axis line`);
    if (d < 3) continue;
    for (const [label, row] of [['top', cells.filter((c) => c[1] === y1)], ['bottom', cells.filter((c) => c[1] === y0)]])
      assert.ok(row.length < d, `station ${x}: flat ${label}, ${row.length} of ${d} wide`);
    for (const [label, col] of [['north', cells.filter((c) => c[2] === z0)], ['south', cells.filter((c) => c[2] === z1)]])
      assert.ok(col.length < d, `station ${x}: flat ${label} side, ${col.length} of ${d} high`);
  }
  assert.strictEqual(AXIS_Z, AXIS_Z_OF_TEMPLATE, 'the envelope axis is not on the central row');
});

test('shape: two greys and half blocks on the steps, lit bow, stern and fin tips', () => {
  // Shade: the lower third of the envelope darker than the rest.
  const lower = ENVELOPE.filter((c) => c[1] < E_Y[0] + 2 && CONCRETE.test(at(...c).name));
  const upper = ENVELOPE.filter((c) => c[1] > AXIS_Y && CONCRETE.test(at(...c).name));
  assert.ok(lower.length > 0 && lower.every((c) => at(...c).name === 'minecraft:gray_concrete'), 'the lower third is not gray');
  assert.ok(upper.length > 0 && upper.every((c) => at(...c).name === 'minecraft:light_gray_concrete'), 'the upper half is not light gray');
  const finX0 = Math.min(...named(FIN).map((c) => c[0]));
  // A step in diameter ahead of the fins gets a slab over the smaller station's top and under its bottom.
  for (let x = EX0; x < finX0 - 1; x++) {
    const small = SIDE[x] < SIDE[x + 1] ? x : SIDE[x] > SIDE[x + 1] ? x + 1 : undefined;
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

test('scale AC3: four tail fins in a cross — chord ≈ 22 % of the length, vertical pair on the central row — inside the declared size', () => {
  const fin = named(FIN);
  const groups = {
    up: fin.filter(([, y, z]) => z === AXIS_Z && y > AXIS_Y),
    down: fin.filter(([, y, z]) => z === AXIS_Z && y < AXIS_Y),
    north: fin.filter(([, y, z]) => y === AXIS_Y && z < AXIS_Z),
    south: fin.filter(([, y, z]) => y === AXIS_Y && z > AXIS_Z),
  };
  assert.strictEqual(Object.values(groups).reduce((n, g) => n + g.length, 0), fin.length, 'a fin block off the two fin planes');
  const chords = [];
  for (const [name, cells] of Object.entries(groups)) {
    assert.ok(cells.length > 0, `no ${name} fin`);
    const xs = range(cells.map((c) => c[0]));
    chords.push(xs.join('..'));
    const chord = span(xs) / E_LEN;
    assert.ok(Math.abs(chord - 0.22) <= 0.02, `${name} fin chord ${span(xs)} = ${(chord * 100).toFixed(1)} % of ${E_LEN}`);
    assert.ok(xs[0] > (EX0 + EX1) / 2 && xs[1] < EX1, `${name} fin x ${xs} is not on the tail, ahead of the stern tip`);
    // Past the widest section: the fins stand out of the outline, the vertical pair up to the template's top row.
    const vertical = name === 'up' || name === 'down';
    const reach = Math.max(...cells.map((c) => (vertical ? Math.abs(c[1] - AXIS_Y) : Math.abs(c[2] - AXIS_Z))));
    const want = vertical ? SY - 1 - AXIS_Y : AXIS_Z;
    assert.strictEqual(reach, want, `${name} fin reaches ${reach} past the axis`);
    assert.ok(reach >= (DIAMETER - 1) / 2, `${name} fin does not reach the widest section`);
    const tip = name === 'up' ? [xs[1], AXIS_Y + reach, AXIS_Z] : name === 'down' ? [xs[1], AXIS_Y - reach, AXIS_Z] : name === 'north' ? [xs[1], AXIS_Y, AXIS_Z - reach] : [xs[1], AXIS_Y, AXIS_Z + reach];
    assert.strictEqual(at(...tip).name, LIGHT, `${name} fin tip ${k(...tip)} is not lit`);
    for (const c of [...cells, tip]) for (let i = 0; i < 3; i++) assert.ok(c[i] >= 0 && c[i] < DECLARED[i], `${name} fin ${k(...c)} outside the declared ${DECLARED}`);
  }
  assert.strictEqual(new Set(chords).size, 1, `fin chords differ: ${chords.join(' ')}`);
  assert.strictEqual(AXIS_Z, AXIS_Z_OF_TEMPLATE, 'the vertical fins are not on the central row');
  const solid = cellsOf((b) => b.name !== 'minecraft:air');
  for (let i = 0; i < 3; i++) assert.ok(Math.max(...solid.map((c) => c[i])) < DECLARED[i], `a block past the declared size on axis ${i}`);
});

test('scale AC4: the gondola — 13×7×4, forward, ≤ 20 % of the envelope length, about half its diameter wide', () => {
  const g = GONDOLA_CELLS;
  const [gx, gy, gz] = [0, 1, 2].map((i) => range(g.map((c) => c[i])));
  assert.deepStrictEqual([span(gx), span(gz), span(gy)], [13, 7, 4], `gondola ${span(gx)}×${span(gz)}×${span(gy)}`);
  assert.ok((gx[0] + gx[1]) / 2 < (EX0 + EX1) / 2, `gondola centre x=${(gx[0] + gx[1]) / 2} is not forward of the envelope centre x=${(EX0 + EX1) / 2}`);
  assert.ok(span(gx) <= 0.2 * E_LEN, `gondola ${span(gx)} of ${E_LEN}: ${((100 * span(gx)) / E_LEN).toFixed(1)} %`);
  const width = span(gz) / DIAMETER;
  assert.ok(width >= 0.45 && width <= 0.6, `gondola ${span(gz)} wide under a ${DIAMETER} envelope`);
  assert.strictEqual((gz[0] + gz[1]) / 2, AXIS_Z, 'the gondola is not under the envelope axis');
  // The envelope sits on the roof: no gap, no hangers, and the gondola only under full-diameter stations.
  const roof = g.filter(([, y]) => y === GONDOLA_TOP);
  assert.ok(roof.some(([x, y, z]) => isEnvelope(x, y + 1, z)), 'the envelope does not rest on the gondola roof');
  assert.ok(gy[1] + 1 === E_Y[0], `envelope bottom y=${E_Y[0]} is not on the gondola roof y=${gy[1]}`);
  for (let x = gx[0]; x <= gx[1]; x++) assert.strictEqual(SIDE[x], DIAMETER, `station ${x} over the gondola is ${SIDE[x]}, not full`);
  // Bow and stern walls trimmed at floor and roof, but for the sill each door stands on.
  const sills = new Set(LOWER_DOORS.map(([x, y, z]) => k(x, y - 1, z)));
  for (const x of gx) for (const y of gy) assert.ok(g.every((c) => !(c[0] === x && c[1] === y) || sills.has(k(...c))), `gondola corner row x=${x} y=${y} not trimmed`);
  // A window strip: glass the whole way round at one height.
  const glass = named('minecraft:glass');
  assert.ok(glass.length >= 24, `${glass.length} windows`);
});

// Block light as the Windmill test models it: an upper bound, light passes everything but opaque cubes.
const TRANSPARENT = /air|door|glass|lantern|chest|spawner|iron_chain|slab/;
const LMAX = 7;
const EMISSION = { 'minecraft:lantern': 15, 'minecraft:soul_lantern': 10, [LIGHT]: 15 };
const EMITTERS = cellsOf((b) => b.name in EMISSION);
/** Block light per cell, flooded from every emitter; a cell missing from it is dark. */
const LIGHT_MAP = new Map();
{
  const queue = EMITTERS.map((c) => [...c, EMISSION[at(...c).name]]);
  for (const [x, y, z, l] of queue) LIGHT_MAP.set(k(x, y, z), l);
  for (let i = 0; i < queue.length; i++) {
    const [x, y, z, l] = queue[i];
    if (l <= 1) continue;
    for (const [dx, dy, dz] of N6) {
      const n = [x + dx, y + dy, z + dz];
      if (!inside(...n) || !TRANSPARENT.test(at(...n).name) || (LIGHT_MAP.get(k(...n)) ?? 0) >= l - 1) continue;
      LIGHT_MAP.set(k(...n), l - 1);
      queue.push([...n, l - 1]);
    }
  }
}

test('AC5: the room lamps leave the spawner and the corridor inside its reach at block light ≤ Lmax', () => {
  assert.ok(EMITTERS.length > 0, 'no lights at all');
  const light = LIGHT_MAP;
  const [sx, sy, sz] = SPAWNERS[0];
  const own = light.get(k(sx, sy, sz)) ?? 0;
  assert.ok(own <= LMAX, `block light ${own} at the spawner > Lmax ${LMAX}`);
  // Vanilla spawner reach: 4 blocks horizontally, 1 vertically. The rooms inside
  // that box are lit and refuse spawns; the corridor is where the Vindicators appear.
  let worst = 0;
  let where = '';
  let cells = 0;
  for (const key of CORRIDOR_SPACE) {
    const [x, y, z] = unk(key);
    if (Math.abs(x - sx) > 4 || Math.abs(z - sz) > 4 || Math.abs(y - sy) > 1) continue;
    cells++;
    const l = light.get(key) ?? 0;
    if (l > worst) [worst, where] = [l, key];
  }
  assert.ok(cells >= 8, `${cells} corridor cells in the spawner reach`);
  assert.ok(worst > 0, 'the corridor gets no light at all from the rooms');
  assert.ok(worst <= LMAX, `block light ${worst} at ${where} > Lmax ${LMAX}`);
});

test('AC5: modern and whole — no decay blocks, and the hull has no hole but its two doors', () => {
  const MODERN = new Set([
    'minecraft:air',
    'minecraft:gray_concrete',
    'minecraft:light_gray_concrete',
    'minecraft:glass',
    'minecraft:iron_block',
    'minecraft:iron_chain',
    'minecraft:lantern',
    'minecraft:soul_lantern',
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
      const outer = n[0] <= G_X[0] || n[0] >= G_X[1] || n[2] <= G_Z[0] || n[2] >= G_Z[1];
      assert.ok(!outer, `hole in the hull at ${k(...n)}`);
      seen.add(k(...n));
      queue.push(n);
    }
  }
});

test('AC5: the balloon is a hollow shell of decoration — no chest or spawner above the gondola, nothing but air inside it', () => {
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
  // Air above the roof that the open sky cannot reach is the envelope's inside: hollow, sealed, empty.
  const hidden = cellsOf((b, x, y, z) => y > ROOF_Y && b.name === 'minecraft:air' && !outside.has(k(x, y, z)));
  assert.ok(hidden.length > 1000, `the envelope is not hollow: ${hidden.length} enclosed air cells`);
  const inSection = ([x, y, z]) => {
    const cells = STATIONS[x];
    if (cells.length === 0) return false;
    const [y0, y1] = range(cells.filter((c) => c[2] === z).map((c) => c[1])) ?? [Infinity, -Infinity];
    return y > y0 && y < y1;
  };
  const stray = hidden.filter((c) => !inSection(c));
  assert.deepStrictEqual(stray, [], `enclosed air outside the envelope: ${stray.slice(0, 10).map((c) => k(...c)).join(' ')}`);
  // The sealed inside is a cave: every cell a mob could stand in gets block light, or hostile mobs spawn there.
  const floor = hidden.filter(([x, y, z]) => at(x, y - 1, z).name !== 'minecraft:air' && at(x, y + 1, z).name === 'minecraft:air');
  const dark = floor.filter((c) => (LIGHT_MAP.get(k(...c)) ?? 0) < 1);
  assert.ok(floor.length > 100, `${floor.length} floor cells inside the envelope`);
  assert.deepStrictEqual(dark, [], `${dark.length} of ${floor.length} floor cells inside the envelope at block light 0: ${dark.slice(0, 10).map((c) => k(...c)).join(' ')}`);
  // Nothing but air and the shell's own blocks inside the envelope's outline.
  const filled = cellsOf((b, x, y, z) => y > ROOF_Y && b.name !== 'minecraft:air' && !isEnvelope(x, y, z) && inSection([x, y, z]));
  assert.deepStrictEqual(filled, [], `something inside the envelope: ${filled.slice(0, 10).map((c) => `${k(...c)} ${at(...c).name}`).join(' ')}`);
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
