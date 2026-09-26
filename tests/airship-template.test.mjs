// src/structures/templates/airship.ts compiled by scripts/build-structures.mjs:
// every assertion reads the built .mcstructure, never the generator's own
// constants, so it proves what ships (§5.1–§5.3, L0-airs-r001/r002, -as01).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cellIndex, parseMcstructure } from '../scripts/lib/mcstructure.mjs';
import { buildStructures } from '../scripts/build-structures.mjs';

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
const LAMPS = named('minecraft:lantern');
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
const standable = ([x, y, z]) => y === FLOOR_Y + 1 && at(x, y, z).name === 'minecraft:air' && at(x, y + 1, z).name === 'minecraft:air' && at(x, y - 1, z).name !== 'minecraft:air';
const COMPONENTS = interiorComponents();
const ROOMS = COMPONENTS.filter((cells) => cells.some(standable));
const touches = (cellKeys, [x, y, z]) => H.some(([dx, dz]) => cellKeys.has(k(x + dx, y, z + dz)));

test('AC1: exactly 10 single chests, 1 Vindicator spawner at the corridor centre, 2 doors on opposite ends', () => {
  assert.strictEqual(CHESTS.length, 10, `${CHESTS.length} chests`);
  for (const other of ['minecraft:trapped_chest', 'minecraft:barrel', 'minecraft:ender_chest']) assert.strictEqual(named(other).length, 0, `${other} present`);
  for (const [x, y, z] of CHESTS) {
    for (const [dx, dz] of H) assert.notStrictEqual(at(x + dx, y, z + dz).name, 'minecraft:chest', `chest ${k(x, y, z)} touches another chest`);
    const be = beAt(x, y, z);
    assert.strictEqual(be?.id, 'Chest', `chest ${k(x, y, z)} has no Chest block entity`);
    assert.ok(be.pairx === undefined && be.pairlead === undefined, `chest ${k(x, y, z)} carries pairing data`);
    assert.strictEqual(at(x, y + 1, z).name, 'minecraft:air', `chest ${k(x, y, z)} cannot open: ${at(x, y + 1, z).name} on top`);
  }

  // Doors: two stacked halves each, on the two short ends of the long axis — the assumption L0-airs-as01 pins here.
  assert.strictEqual(DOOR_CELLS.length, 4, `${DOOR_CELLS.length} door blocks`);
  assert.strictEqual(LOWER_DOORS.length, 2, `${LOWER_DOORS.length} lower door halves`);
  for (const [x, y, z] of LOWER_DOORS) assert.strictEqual(at(x, y + 1, z).states.upper_block_bit, 1, `door ${k(x, y, z)} has no upper half`);
  const longX = SX >= SZ;
  assert.ok(longX, `template is ${SX}×${SZ}: x is expected to be the long axis`);
  assert.deepStrictEqual([DA[0], DB[0]], [0, SX - 1], `doors at x=${DA[0]} and x=${DB[0]}, not on the two ends of the long axis`);
  assert.strictEqual(DA[2], DB[2], 'the doors are not facing each other across the gondola');
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

test('AC2: ≈15×7×10–12, a corridor plus 4 rooms, one ceiling lamp and two chests per room, two chests in the corridor', () => {
  const solid = cellsOf((b) => b.name !== 'minecraft:air');
  const ext = [0, 1, 2].map((i) => Math.max(...solid.map((c) => c[i])) - Math.min(...solid.map((c) => c[i])) + 1);
  assert.deepStrictEqual([ext[0], ext[2]], [15, 7], `footprint ${ext[0]}×${ext[2]}`);
  assert.ok(ext[1] >= 10 && ext[1] <= 12, `height ${ext[1]}`);

  assert.strictEqual(ROOMS.length, 4, `${ROOMS.length} rooms: ${ROOMS.map((r) => r.length).join(' ')}`);
  const roomKeys = ROOMS.map((cells) => new Set(cells.map((c) => k(...c))));
  ROOMS.forEach((cells, i) => {
    const lamps = cells.filter((c) => at(...c).name === 'minecraft:lantern');
    assert.strictEqual(lamps.length, 1, `room ${i}: ${lamps.length} lamps`);
    const [lx, ly, lz] = lamps[0];
    assert.strictEqual(at(lx, ly, lz).states.hanging, 1, `room ${i}: lamp is not hanging`);
    assert.strictEqual(ly + 1, ROOF_Y, `room ${i}: lamp at y=${ly} does not hang from the ceiling at y=${ROOF_Y}`);
    const chests = CHESTS.filter((c) => touches(roomKeys[i], c));
    assert.strictEqual(chests.length, 2, `room ${i}: ${chests.length} chests`);
    const doorways = cells.filter((c) => touches(CORRIDOR_KEYS, c));
    assert.ok(doorways.length > 0, `room ${i} has no doorway onto the corridor`);
  });
  assert.strictEqual(LAMPS.length, 4, `${LAMPS.length} lamps in total`);
  const corridorChests = CHESTS.filter((c) => touches(CORRIDOR_KEYS, c) && !roomKeys.some((r) => touches(r, c)));
  assert.strictEqual(corridorChests.length, 2, `${corridorChests.length} corridor chests`);
});

// Block light as the Windmill test models it: an upper bound, light passes everything but opaque cubes.
const TRANSPARENT = /air|door|glass|lantern|chest|spawner|iron_chain/;
const LMAX = 7;

test('AC2: the room lamps leave the corridor inside the spawner reach at block light ≤ Lmax', () => {
  const light = new Map();
  const queue = LAMPS.map((c) => [...c, 15]);
  for (const c of LAMPS) light.set(k(...c), 15);
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
  // Vanilla spawner reach: 4 blocks horizontally, 1 vertically. The rooms inside
  // that box are lit and refuse spawns; the corridor is where the Vindicators appear.
  const [sx, sy, sz] = SPAWNERS[0];
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
