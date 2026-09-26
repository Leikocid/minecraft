// src/structures/templates/windmill.ts compiled by scripts/build-structures.mjs:
// every assertion reads the built .mcstructure, never the generator's own
// constants, so it proves what ships (§4.1–§4.4, L0-wind-r001…r003, -as07).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cellIndex, parseMcstructure } from '../scripts/lib/mcstructure.mjs';
import { buildStructures } from '../scripts/build-structures.mjs';

const out = mkdtempSync(join(tmpdir(), 'andrew-windmill-'));
buildStructures({ to: out });
const s = parseMcstructure(readFileSync(join(out, 'windmill.mcstructure')));
rmSync(out, { recursive: true, force: true });

const [SX, SY, SZ] = s.size;
const inside = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < SX && y < SY && z < SZ;
const AIR = { name: 'minecraft:air', states: {} };
const at = (x, y, z) => (inside(x, y, z) ? s.palette[s.primary[cellIndex(s.size, x, y, z)]] : AIR);
const beAt = (x, y, z) => s.blockEntities.get(cellIndex(s.size, x, y, z));
const k = (x, y, z) => `${x},${y},${z}`;

function cellsOf(pred) {
  const found = [];
  for (let x = 0; x < SX; x++) for (let y = 0; y < SY; y++) for (let z = 0; z < SZ; z++) if (pred(at(x, y, z), x, y, z)) found.push([x, y, z]);
  return found;
}
const named = (name) => cellsOf((b) => b.name === name);

// Floor bands by the y a player stands at (the floor slab is one below).
const FLOORS = [
  { n: 1, stand: [1, 6] },
  { n: 2, stand: [8, 13] },
  { n: 3, stand: [15, 29] },
];
const floorOf = (y) => FLOORS.find((f) => y >= f.stand[0] && y <= f.stand[1])?.n;

const H = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
/** Bedrock stairs weirdo_direction → the horizontal step that climbs it. */
const CLIMB = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

const DECAY = new Set(['minecraft:vine', 'minecraft:web']);
const PASSABLE = new Set(['minecraft:air', 'minecraft:wooden_door', 'minecraft:short_grass', 'minecraft:wheat']);
const NOT_SUPPORT = new Set([
  ...PASSABLE,
  ...DECAY,
  'minecraft:water',
  'minecraft:lantern',
  'minecraft:oak_fence',
  'minecraft:birch_fence',
  'minecraft:glass_pane',
]);

const DOOR = named('minecraft:wooden_door').sort((a, b) => a[1] - b[1]);
const STAIRS = named('minecraft:spruce_stairs').sort((a, b) => a[1] - b[1]);
const CHESTS = named('minecraft:chest');
const SPAWNERS = named('minecraft:mob_spawner');

/** Building extent: every wall and roof block, i.e. everything above the plot's crop layer except the rotor. */
const ROTOR = new Set(['minecraft:birch_fence', 'minecraft:birch_planks']);
const bodyCells = cellsOf((b, _x, y) => y >= 2 && b.name !== 'minecraft:air' && !ROTOR.has(b.name) && !DECAY.has(b.name) && b.name !== 'minecraft:dark_oak_log');
const bx = [Math.min(...bodyCells.map((c) => c[0])), Math.max(...bodyCells.map((c) => c[0]))];
const bz = [Math.min(...bodyCells.map((c) => c[2])), Math.max(...bodyCells.map((c) => c[2]))];
const inFootprint = (x, z) => x >= bx[0] && x <= bx[1] && z >= bz[0] && z <= bz[1];

test('AC1: exactly 25 single chests 5/8/12 and 3 spawners zombie_villager_v2/zombie/vindicator', () => {
  assert.strictEqual(CHESTS.length, 25, `${CHESTS.length} chests`);
  for (const other of ['minecraft:trapped_chest', 'minecraft:barrel', 'minecraft:ender_chest']) {
    assert.strictEqual(named(other).length, 0, `${other} present`);
  }
  const perFloor = [1, 2, 3].map((n) => CHESTS.filter(([, y]) => floorOf(y) === n).length);
  assert.deepStrictEqual(perFloor, [5, 8, 12], `chests per floor ${perFloor}`);

  for (const [x, y, z] of CHESTS) {
    for (const [dx, dz] of H) assert.notStrictEqual(at(x + dx, y, z + dz).name, 'minecraft:chest', `chest ${k(x, y, z)} touches another chest`);
    const be = beAt(x, y, z);
    assert.strictEqual(be?.id, 'Chest', `chest ${k(x, y, z)} has no Chest block entity`);
    assert.ok(be.pairx === undefined && be.pairlead === undefined, `chest ${k(x, y, z)} carries pairing data`);
  }

  assert.strictEqual(SPAWNERS.length, 3, `${SPAWNERS.length} spawners`);
  const mobs = SPAWNERS.map(([x, y, z]) => [floorOf(y), beAt(x, y, z)?.EntityIdentifier]).sort((a, b) => a[0] - b[0]);
  assert.deepStrictEqual(mobs, [
    [1, 'minecraft:zombie_villager_v2'],
    [2, 'minecraft:zombie'],
    [3, 'minecraft:vindicator'],
  ]);
  const spawnerEntities = [...s.blockEntities.values()].filter((be) => be.id === 'MobSpawner');
  assert.strictEqual(spawnerEntities.length, 3, 'MobSpawner block entities elsewhere than the 3 spawners');
});

test('AC2: ~15×15 base, ~30 high, three floors, one stair 1→3, 4 blades and one door on the front', () => {
  const w = bx[1] - bx[0] + 1;
  const d = bz[1] - bz[0] + 1;
  const top = Math.max(...bodyCells.map((c) => c[1]));
  assert.ok(w >= 13 && w <= 17 && d >= 13 && d <= 17, `base ${w}x${d}`);
  assert.ok(top + 1 >= 27 && top + 1 <= 33, `height ${top + 1}`);

  // Lower walls stone, upper walls wood (§4.1).
  const wall = (y) => {
    const names = [];
    for (let x = bx[0]; x <= bx[1]; x++) names.push(at(x, y, bz[1]).name);
    return names;
  };
  assert.ok(wall(3).every((n) => /stone|cobble/.test(n)), `floor 1 wall: ${wall(3)}`);
  assert.ok(wall(17).every((n) => /planks|log/.test(n)), `floor 3 wall: ${wall(17)}`);

  // Three full floors: a slab under each band over at least 90 % of the interior, and headroom above it.
  for (const f of FLOORS) {
    const slabY = f.stand[0] - 1;
    let solid = 0;
    let total = 0;
    for (let x = bx[0] + 1; x < bx[1]; x++)
      for (let z = bz[0] + 1; z < bz[1]; z++) {
        total++;
        if (!NOT_SUPPORT.has(at(x, slabY, z).name)) solid++;
      }
    assert.ok(solid / total >= 0.9, `floor ${f.n}: slab covers ${solid}/${total}`);
    assert.ok(f.stand[1] - f.stand[0] + 1 >= 5, `floor ${f.n}: ${f.stand[1] - f.stand[0] + 1} blocks of headroom`);
  }

  // The stair: one step per level from floor 1 to floor 3, each the neighbour of the last and climbed towards it.
  assert.ok(STAIRS.length > 0, 'no stairs');
  assert.strictEqual(STAIRS[0][1], FLOORS[0].stand[0], `first step at y=${STAIRS[0][1]}`);
  assert.strictEqual(STAIRS.at(-1)[1] + 1, FLOORS[2].stand[0], `last step leads to y=${STAIRS.at(-1)[1] + 1}`);
  STAIRS.forEach(([x, y, z], i) => {
    assert.strictEqual(y, STAIRS[0][1] + i, `stairs: two steps at y=${y}, or a gap below it`);
    if (i === 0) return;
    const [px, , pz] = STAIRS[i - 1];
    const [cx, cz] = CLIMB[at(x, y, z).states.weirdo_direction];
    assert.deepStrictEqual([x - px, z - pz], [cx, cz], `step ${k(x, y, z)} is not climbed from step ${i - 1}`);
  });
  assert.ok(STAIRS.some(([, y]) => y + 1 === FLOORS[1].stand[0]), 'the stair never passes floor 2 level');

  // One door: two stacked halves in the front wall.
  assert.strictEqual(DOOR.length, 2, `${DOOR.length} door blocks`);
  const [lo, hi] = DOOR;
  assert.deepStrictEqual([hi[0], hi[1] - 1, hi[2]], lo, 'door halves are not stacked');
  assert.deepStrictEqual(DOOR.map((c) => at(...c).states.upper_block_bit), [0, 1]);
  assert.strictEqual(lo[1], FLOORS[0].stand[0], 'door is not at floor 1');
  const front = lo[2] === bz[0] ? -1 : lo[2] === bz[1] ? 1 : 0;
  assert.ok(front !== 0 && lo[0] > bx[0] && lo[0] < bx[1], `door ${k(...lo)} is not in the north or south wall`);

  // Four blades: connected groups of blade blocks, all standing in front of the door's wall.
  const blade = cellsOf((b) => ROTOR.has(b.name));
  const left = new Set(blade.map((c) => k(...c)));
  let groups = 0;
  for (const c of blade) {
    if (!left.delete(k(...c))) continue;
    groups++;
    const queue = [c];
    while (queue.length) {
      const [x, y, z] = queue.pop();
      for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
        const n = [x + dx, y + dy, z + dz];
        if (left.delete(k(...n))) queue.push(n);
      }
    }
  }
  assert.strictEqual(groups, 4, `${groups} blades`);
  const wallZ = front < 0 ? bz[0] : bz[1];
  assert.ok(blade.every(([, , z]) => (z - wallZ) * front > 0), 'a blade block is not in front of the door wall');
  assert.ok(Math.min(...blade.map((c) => c[1])) > hi[1], 'blades reach down over the door');
});

/** Standing positions: support below, two passable cells. */
function standable(x, y, z) {
  return inside(x, y - 1, z) && !NOT_SUPPORT.has(at(x, y - 1, z).name) && PASSABLE.has(at(x, y, z).name) && PASSABLE.has(at(x, y + 1, z).name);
}

/** Walk from the door without breaking anything: level moves, and one-up moves onto a stair climbed its way. */
function walkFromDoor() {
  const [lo] = DOOR;
  const seen = new Set([k(...lo)]);
  const queue = [lo];
  while (queue.length) {
    const [x, y, z] = queue.shift();
    for (const [dx, dz] of H) {
      const nx = x + dx;
      const nz = z + dz;
      const moves = [[nx, y, nz]];
      const below = at(nx, y, nz);
      if (below.name === 'minecraft:spruce_stairs') {
        const [cx, cz] = CLIMB[below.states.weirdo_direction];
        if (cx === dx && cz === dz) moves.push([nx, y + 1, nz]);
      }
      for (const m of moves) {
        if (seen.has(k(...m)) || !standable(...m)) continue;
        if (!PASSABLE.has(at(x, m[1] + 1, z).name) && m[1] > y) continue;
        seen.add(k(...m));
        queue.push(m);
      }
    }
  }
  return seen;
}

test('AC3: every chest is reachable from the door without breaking a block; no decay on the route', () => {
  const reached = walkFromDoor();
  const unreachable = CHESTS.filter(([x, y, z]) => !H.some(([dx, dz]) => reached.has(k(x + dx, y, z + dz))));
  assert.deepStrictEqual(unreachable, [], `chests nobody can stand next to: ${unreachable.map((c) => k(...c)).join(' ')}`);
  for (const [x, y, z] of CHESTS) assert.strictEqual(at(x, y + 1, z).name, 'minecraft:air', `chest ${k(x, y, z)} cannot open: ${at(x, y + 1, z).name} on top`);
  for (const f of FLOORS) assert.ok([...reached].some((c) => floorOf(Number(c.split(',')[1])) === f.n), `floor ${f.n} unreached`);

  const vines = named('minecraft:vine');
  const webs = named('minecraft:web');
  assert.ok(vines.length >= 20 && webs.length >= 20, `${vines.length} vines, ${webs.length} webs`);
  const perFloor = [1, 2, 3].map((n) => webs.filter(([x, y, z]) => inFootprint(x, z) && floorOf(y) === n).length);
  assert.ok(perFloor[2] > perFloor[0] && perFloor[2] > perFloor[1], `webs per floor ${perFloor}: floor 3 is not the densest`);

  const route = new Set();
  for (const c of DOOR) route.add(k(...c));
  for (const [x, y, z] of STAIRS) for (let dy = 0; dy <= 2; dy++) route.add(k(x, y + dy, z));
  for (const [x, y, z] of CHESTS) for (let dy = 0; dy <= 1; dy++) route.add(k(x, y + dy, z));
  const blocked = [...vines, ...webs].filter((c) => route.has(k(...c)));
  assert.deepStrictEqual(blocked, [], `decay on the door, stairs or a chest: ${blocked.map((c) => k(...c)).join(' ')}`);
});

// Light emitted by vanilla blocks; any palette name that looks like a light source must be listed here.
const EMISSION = {
  'minecraft:lantern': 15,
  'minecraft:soul_lantern': 10,
  'minecraft:torch': 14,
  'minecraft:soul_torch': 10,
  'minecraft:glowstone': 15,
  'minecraft:sea_lantern': 15,
  'minecraft:lit_pumpkin': 15,
  'minecraft:redstone_lamp': 0,
};
const LOOKS_LIT = /lantern|torch|lamp|glowstone|campfire|candle|froglight|fire|lava|shroomlight|sea_pickle|end_rod|lit_/;
/** Light passes everything but full opaque cubes — an upper bound on the real engine's block light. */
const TRANSPARENT = /air|door|web|vine|wheat|short_grass|glass|fence|stairs|lantern|chest|spawner|water|farmland|grass_path|torch/;
const LMAX = 7;

test('AC4: no cell in reach of a spawner gets block light above Lmax from the template', () => {
  const lit = s.palette.map((p) => p.name).filter((n) => LOOKS_LIT.test(n));
  for (const n of lit) assert.ok(n in EMISSION, `${n} emits light the test does not model`);

  const pad = 1;
  const light = new Map();
  const queue = [];
  for (const [name, level] of Object.entries(EMISSION)) {
    for (const c of named(name)) {
      light.set(k(...c), level);
      queue.push([...c, level]);
    }
  }
  assert.ok(queue.length > 0, 'no light sources at all — the decorative lighting is missing');
  while (queue.length) {
    const [x, y, z, l] = queue.shift();
    if (l <= 1) continue;
    for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      const n = [x + dx, y + dy, z + dz];
      if (n[0] < -pad || n[1] < -pad || n[2] < -pad || n[0] >= SX + pad || n[1] >= SY + pad || n[2] >= SZ + pad) continue;
      if (!TRANSPARENT.test(at(...n).name)) continue;
      if ((light.get(k(...n)) ?? 0) >= l - 1) continue;
      light.set(k(...n), l - 1);
      queue.push([...n, l - 1]);
    }
  }

  // Vanilla spawner reach: 4 blocks horizontally, 1 vertically, around the spawner.
  for (const [sx, sy, sz] of SPAWNERS) {
    let worst = 0;
    let where = '';
    for (let x = sx - 4; x <= sx + 4; x++)
      for (let y = sy - 1; y <= sy + 1; y++)
        for (let z = sz - 4; z <= sz + 4; z++) {
          if (!TRANSPARENT.test(at(x, y, z).name)) continue;
          const l = light.get(k(x, y, z)) ?? 0;
          if (l > worst) [worst, where] = [l, k(x, y, z)];
        }
    assert.ok(worst <= LMAX, `spawner ${k(sx, sy, sz)}: block light ${worst} at ${where} > Lmax ${LMAX}`);
  }
});

test('AC7: the plot — mostly mature wheat, water, paths, abandoned patches, a fence with gaps', () => {
  const plot = (pred) => cellsOf((b, x, y, z) => y <= 1 && !inFootprint(x, z) && pred(b, x, y, z));
  const wheat = plot((b) => b.name === 'minecraft:wheat');
  const mature = wheat.filter((c) => at(...c).states.growth === 7);
  const farmland = plot((b) => b.name === 'minecraft:farmland');
  const water = plot((b) => b.name === 'minecraft:water');
  const paths = plot((b) => b.name === 'minecraft:grass_path' || b.name === 'minecraft:coarse_dirt');
  const trampled = plot((b, _x, y) => b.name === 'minecraft:dirt' && y === 0);
  const bare = farmland.filter(([x, y, z]) => at(x, y + 1, z).name === 'minecraft:air');
  const young = wheat.length - mature.length;

  assert.ok(mature.length >= 300, `${mature.length} mature wheat`);
  assert.ok(mature.length / farmland.length > 0.6, `mature ${mature.length} of ${farmland.length} farmland`);
  assert.ok(young > 0 && young < mature.length, `${young} young wheat`);
  assert.ok(water.length >= 40, `${water.length} water`);
  const hydrated = farmland.filter(([x, , z]) => water.some(([wx, , wz]) => Math.abs(wx - x) <= 4 && Math.abs(wz - z) <= 4));
  assert.strictEqual(hydrated.length, farmland.length, `${farmland.length - hydrated.length} farmland out of water range`);
  assert.ok(trampled.length >= 10 && bare.length >= 5, `trampled ${trampled.length}, bare farmland ${bare.length}`);
  assert.ok(named('minecraft:short_grass').length >= 5, 'no overgrown patches');

  // Paths lead from the ground in front of the door out to the fence.
  const [lo] = DOOR;
  const pathSet = new Set(paths.map((c) => k(c[0], 0, c[2])));
  const start = [lo[0], 0, lo[2] - 1];
  assert.ok(pathSet.has(k(...start)), 'no path in front of the door');
  const seen = new Set([k(...start)]);
  const queue = [start];
  let edge = false;
  while (queue.length) {
    const [x, , z] = queue.pop();
    for (const [dx, dz] of H) {
      const n = [x + dx, 0, z + dz];
      if (n[0] <= 0 || n[2] <= 0 || n[0] >= SX - 1 || n[2] >= SZ - 1) edge = true;
      if (pathSet.has(k(...n)) && !seen.has(k(...n))) {
        seen.add(k(...n));
        queue.push(n);
      }
    }
  }
  assert.ok(edge && paths.length >= 60, `${paths.length} path cells; door path reaches the fence: ${edge}`);

  // Fence on the perimeter ring, with gaps.
  // Clockwise, so neighbours in the list are neighbours on the ground.
  const ring = [];
  for (let i = 0; i < SX - 1; i++) ring.push([i, 0]);
  for (let i = 0; i < SZ - 1; i++) ring.push([SX - 1, i]);
  for (let i = SX - 1; i > 0; i--) ring.push([i, SZ - 1]);
  for (let i = SZ - 1; i > 0; i--) ring.push([0, i]);
  const posts = ring.map(([x, z]) => at(x, 1, z).name === 'minecraft:oak_fence');
  let gaps = 0;
  posts.forEach((p, i) => {
    if (!p && posts[(i + posts.length - 1) % posts.length]) gaps++;
  });
  const share = posts.filter(Boolean).length / posts.length;
  assert.ok(share >= 0.6 && share < 1, `fence covers ${Math.round(share * 100)} % of the perimeter`);
  assert.ok(gaps >= 3, `${gaps} gaps in the fence`);
});
