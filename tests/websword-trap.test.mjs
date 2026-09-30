// The Web Sword's "not through walls" rule, judged by its outcome: where the
// cube grows [src: webswordspecv1ruen §12 — 'не атаковать сквозь стены'].
//
// src/websword/trap.ts runs unmodified against a small fake engine. The fake
// answers the two view rays the way BDS 1.26.51.1 was measured to answer them
// (src/gametest/websword-trap.ts):
//   - BlockRaycastHit.faceLocation is the hit point's fractional part, so on a
//     full South, East or Up face its normal component reads 0, not 1;
//   - getEntitiesFromViewDirection stops at the first colliding block unless
//     told `ignoreBlockCollision`, and measures from the eye to the entity's
//     pick bounds (half-width 0.4 for a villager).
// The first test pins that model to numbers read off the engine, so a fake
// that drifted away from it cannot keep the rest green.
//
// What this pins: with the engine's entity ray stopping at walls, the wrapped
// faceLocation never changes where the cube grows — the mob is hidden before
// the trap's distance comparison could prefer it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const minecraftServerStub = {
  name: 'minecraft-server-stub',
  setup(pluginBuild) {
    pluginBuild.onResolve({ filter: /^@minecraft\/server$/ }, () => ({
      path: '@minecraft/server',
      namespace: 'mc-stub',
    }));
    pluginBuild.onLoad({ filter: /.*/, namespace: 'mc-stub' }, () => ({
      contents: [
        'const handlers = globalThis.__trapHandlers = {};',
        'const channel = (name) => ({ subscribe(fn) { handlers[name] = fn; return fn; } });',
        'export const world = {',
        '  afterEvents: { itemUse: channel("itemUse"), playerInteractWithBlock: channel("playerInteractWithBlock") },',
        '  getDynamicProperty() { return undefined; },',
        '};',
        'export const system = { get currentTick() { return globalThis.__trapTick ?? 0; } };',
        'export const EntityComponentTypes = { Equippable: "minecraft:equippable" };',
        'export const EquipmentSlot = { Mainhand: "Mainhand", Offhand: "Offhand" };',
      ].join('\n'),
      loader: 'js',
    }));
  },
};

const bundle = await build({
  entryPoints: [join(projectRoot, 'src', 'websword', 'trap.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  plugins: [minecraftServerStub],
});

const moduleUrl =
  'data:text/javascript;base64,' +
  Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64');

const { registerTrap } = await import(moduleUrl);

function quietly(fn) {
  const warn = console.warn;
  console.warn = () => {};
  try {
    return fn();
  } finally {
    console.warn = warn;
  }
}

quietly(registerTrap);
const useItem = globalThis.__trapHandlers.itemUse;

// ------------------------------------------------------------ the fake engine

/** Head above feet for a SimulatedPlayer, measured: feet y=-58, head y=-56.48. */
const EYE_HEIGHT = 1.52;
/** Pick bounds of a villager_v2, measured: 0.400 on three aims. */
const MOB_HALF_WIDTH = 0.4;
const MOB_HEIGHT = 2.0;
const AXES = ['x', 'y', 'z'];

const key = (v) => `${v.x},${v.y},${v.z}`;
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const unit = (v) => {
  const l = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / l, y: v.y / l, z: v.z / l };
};

/** Slab-method ray/box: entry distance, entry axis and the engine's name for the entry face. */
function rayBox(origin, dir, min, max) {
  let tIn = -Infinity;
  let tOut = Infinity;
  let axis = 'x';
  for (const a of AXES) {
    if (Math.abs(dir[a]) < 1e-12) {
      if (origin[a] < min[a] || origin[a] > max[a]) return undefined;
      continue;
    }
    let t1 = (min[a] - origin[a]) / dir[a];
    let t2 = (max[a] - origin[a]) / dir[a];
    if (t1 > t2) [t1, t2] = [t2, t1];
    if (t1 > tIn) {
      tIn = t1;
      axis = a;
    }
    tOut = Math.min(tOut, t2);
  }
  if (tIn > tOut || tOut < 0) return undefined;
  const positive = dir[axis] > 0;
  const face = { x: positive ? 'West' : 'East', y: positive ? 'Down' : 'Up', z: positive ? 'North' : 'South' }[axis];
  return { tIn, axis, face };
}

/** First stone cell the ray enters within `maxDistance`, with faceLocation as the engine reports it. */
function castBlock(head, dir, stone, maxDistance) {
  let best;
  for (const cell of stone) {
    const hit = rayBox(head, dir, cell, { x: cell.x + 1, y: cell.y + 1, z: cell.z + 1 });
    if (hit !== undefined && hit.tIn >= 0 && hit.tIn <= maxDistance && (best === undefined || hit.tIn < best.hit.tIn)) {
      best = { cell, hit };
    }
  }
  if (best === undefined) return undefined;
  const entry = sub(
    { x: head.x + dir.x * best.hit.tIn, y: head.y + dir.y * best.hit.tIn, z: head.z + dir.z * best.hit.tIn },
    best.cell
  );
  // The fractional part of the hit point: on a full cube's face the normal
  // component is 0 whichever side of the cube the face is on.
  const faceLocation = { ...entry, [best.hit.axis]: 0 };
  return { cell: best.cell, face: best.hit.face, faceLocation, tIn: best.hit.tIn };
}

function castEntity(head, dir, mob, stone, opts) {
  const maxDistance = opts?.maxDistance ?? Infinity;
  const hit = rayBox(
    head,
    dir,
    { x: mob.x - MOB_HALF_WIDTH, y: mob.y, z: mob.z - MOB_HALF_WIDTH },
    { x: mob.x + MOB_HALF_WIDTH, y: mob.y + MOB_HEIGHT, z: mob.z + MOB_HALF_WIDTH }
  );
  if (hit === undefined || hit.tIn > maxDistance) return undefined;
  if (opts?.ignoreBlockCollision !== true) {
    const wall = castBlock(head, dir, stone, maxDistance);
    if (wall !== undefined && wall.tIn < hit.tIn) return undefined;
  }
  return hit.tIn;
}

/**
 * A world of stone cells and one mob, seen by one player holding the sword.
 * Records every setType, and every option the trap passes to the entity ray.
 */
function makeWorld({ stone, mob, feet, aim }) {
  const solid = new Set(stone.map(key));
  const placed = new Set();
  const entityRayOptions = [];
  const head = { x: feet.x, y: feet.y + EYE_HEIGHT, z: feet.z };
  const dir = unit(sub(aim, head));

  const block = (cell) => ({
    location: cell,
    typeId: solid.has(key(cell)) ? 'minecraft:stone' : 'minecraft:air',
    get isAir() {
      return !solid.has(key(cell));
    },
    isLiquid: false,
    getComponent: () => undefined,
    setType: (id) => {
      assert.equal(id, 'minecraft:web');
      placed.add(key(cell));
    },
  });

  const mobEntity = {
    id: 'mob',
    typeId: 'minecraft:villager_v2',
    location: mob,
    getComponent: (id) => (id === 'minecraft:health' ? { currentValue: 20 } : undefined),
  };

  const props = new Map();
  const sword = { typeId: 'andrew:web_sword', amount: 1, getDynamicProperty: () => undefined };
  const player = {
    id: `player-${Math.random()}`,
    name: 'tester',
    location: feet,
    getHeadLocation: () => head,
    getBlockFromViewDirection: (opts) => {
      const hit = castBlock(head, dir, stone, opts?.maxDistance ?? Infinity);
      return hit && { block: block(hit.cell), face: hit.face, faceLocation: hit.faceLocation };
    },
    getEntitiesFromViewDirection: (opts) => {
      entityRayOptions.push(opts);
      const d = castEntity(head, dir, mob, stone, opts);
      return d === undefined ? [] : [{ entity: mobEntity, distance: d }];
    },
    getComponent: (id) =>
      id === 'minecraft:equippable' ? { getEquipment: (slot) => (slot === 'Mainhand' ? sword : undefined) } : undefined,
    getDynamicProperty: (k) => props.get(k),
    setDynamicProperty: (k, v) => (v === undefined ? props.delete(k) : props.set(k, v)),
    onScreenDisplay: { setActionBar: () => {} },
    dimension: { getBlock: block },
  };

  function use() {
    globalThis.__trapTick = (globalThis.__trapTick ?? 0) + 1;
    quietly(() => useItem({ source: player, itemStack: sword }));
    return placed;
  }

  return {
    use,
    head,
    entityRayOptions,
    blockRay: () => castBlock(head, dir, stone, 5),
    entityRay: () => castEntity(head, dir, mob, stone, { maxDistance: 3 }),
  };
}

// ------------------------------------------------------------- the scenarios

/**
 * Looking north from the cell {4,*,5}, feet on y=2: the three wall layouts of
 * the BDS scenarios in src/gametest/websword-trap.ts. `center` is where the
 * cube grows.
 */
const NORTH = {
  front: {
    feet: { x: 4.5, y: 2, z: 5.5 },
    stone: [{ x: 4, y: 2, z: 1 }, { x: 4, y: 3, z: 1 }],
    mob: { x: 4.5, y: 2, z: 3.5 },
    aim: { x: 4.5, y: 3.0, z: 3.5 },
    center: { x: 4, y: 2, z: 3 },
    wins: 'mob',
  },
  behind: {
    feet: { x: 4.5, y: 2, z: 5.5 },
    stone: [{ x: 4, y: 2, z: 3 }, { x: 4, y: 3, z: 3 }],
    mob: { x: 4.5, y: 2, z: 2.5 },
    aim: { x: 4.5, y: 3.0, z: 2.5 },
    center: { x: 4, y: 3, z: 4 },
    wins: 'wall',
  },
  edge: {
    feet: { x: 4.5, y: 2, z: 5.5 },
    stone: [{ x: 3, y: 2, z: 3 }, { x: 3, y: 3, z: 3 }],
    mob: { x: 2.5, y: 2, z: 3.5 },
    aim: { x: 3.1, y: 3.5, z: 4 },
    center: { x: 3, y: 3, z: 4 },
    wins: 'wall',
  },
};

/** Quarter turns clockwise seen from above, about x = z = 3.5. */
const TURNS = { north: 0, east: 1, south: 2, west: 3 };

function turnPoint(p, turns) {
  let { x, z } = p;
  for (let i = 0; i < turns; i++) [x, z] = [7 - z, x];
  return { x, y: p.y, z };
}

function turnCell(c, turns) {
  let { x, z } = c;
  for (let i = 0; i < turns; i++) [x, z] = [6 - z, x];
  return { x, y: c.y, z };
}

function turned(layout, turns) {
  return {
    feet: turnPoint(layout.feet, turns),
    stone: layout.stone.map((c) => turnCell(c, turns)),
    mob: turnPoint(layout.mob, turns),
    aim: turnPoint(layout.aim, turns),
    center: turnCell(layout.center, turns),
    wins: layout.wins,
  };
}

function cube(center) {
  const cells = new Set();
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        cells.add(key({ x: center.x + dx, y: center.y + dy, z: center.z + dz }));
      }
    }
  }
  return cells;
}

/** The centre of the cube that grew, read back from the 27 written cells. */
function grownCenter(placed) {
  assert.equal(placed.size, 27, `a single cube is 27 cells, ${placed.size} were written`);
  const cells = [...placed].map((k) => k.split(',').map(Number));
  const mid = (i) => (Math.min(...cells.map((c) => c[i])) + Math.max(...cells.map((c) => c[i]))) / 2;
  return { x: mid(0), y: mid(1), z: mid(2) };
}

// Read off dist/bds-gametest.log (world coordinates): websword_face_location
// and websword_entity_ray_distance on BDS 1.26.51.1.
const HEAD = { x: 3.5, y: -56.48, z: 6.5 };
const FACE_READS = [
  { label: 'south', block: { x: 3, y: -57, z: 4 }, dir: { x: 0, y: -0.08, z: -0.997 }, face: 'South', read: { x: 0.5, y: 0.4, z: 0 } },
  { label: 'south oblique', block: { x: 3, y: -57, z: 4 }, dir: { x: 0.192, y: -0.205, z: -0.96 }, face: 'South', read: { x: 0.8, y: 0.2, z: 0 } },
  { label: 'north oblique', block: { x: 3, y: -57, z: 8 }, dir: { x: -0.192, y: -0.205, z: 0.96 }, face: 'North', read: { x: 0.2, y: 0.2, z: 0 } },
  { label: 'east oblique', block: { x: 1, y: -57, z: 6 }, dir: { x: -0.96, y: -0.205, z: 0.192 }, face: 'East', read: { x: 0, y: 0.2, z: 0.8 } },
  { label: 'west', block: { x: 5, y: -57, z: 6 }, dir: { x: 0.997, y: -0.08, z: 0 }, face: 'West', read: { x: 0, y: 0.4, z: 0.5 } },
  { label: 'up', block: { x: 3, y: -59, z: 4 }, dir: { x: 0, y: -0.629, z: -0.777 }, face: 'Up', read: { x: 0.5, y: 0, z: 0.624 } },
];
// `through` is head + viewDirection * distance as the probe logged it: the
// engine's own direction, which differs from the aim point because
// lookAtLocation aims from 1.62 above the feet and the head sits at 1.52.
const ENTITY_READS = [
  { through: { x: 3.5, y: -56.976, z: 4.9 }, distance: 1.675 },
  { through: { x: 3.5, y: -56.416, z: 4.9 }, distance: 1.601 },
  { through: { x: 3.66, y: -57.536, z: 4.9 }, distance: 1.924 },
];
const BDS_MOB = { x: 3.5, y: -58, z: 4.5 };

test('the fake engine answers as BDS 1.26.51.1 did', async (t) => {
  for (const r of FACE_READS) {
    await t.test(`faceLocation, ${r.label} face`, () => {
      const hit = castBlock(HEAD, unit(r.dir), [r.block], 5);
      assert.ok(hit !== undefined, 'the ray reaches the block');
      assert.equal(hit.face, r.face);
      for (const a of AXES) {
        assert.ok(Math.abs(hit.faceLocation[a] - r.read[a]) < 0.01, `faceLocation.${a}: model ${hit.faceLocation[a]}, BDS ${r.read[a]}`);
      }
    });
  }
  for (const r of ENTITY_READS) {
    await t.test(`entity distance ${r.distance}`, () => {
      const d = castEntity(HEAD, unit(sub(r.through, HEAD)), BDS_MOB, [], { maxDistance: 3 });
      assert.ok(Math.abs(d - r.distance) < 0.01, `model ${d}, BDS ${r.distance}`);
    });
  }
});

for (const which of ['front', 'behind', 'edge']) {
  const where = { front: 'in front of', behind: 'behind', edge: 'just past the edge of' }[which];
  test(`a mob ${where} a wall: the ${NORTH[which].wins} gets the cube, whichever way the player looks`, async (t) => {
    for (const [heading, turns] of Object.entries(TURNS)) {
      await t.test(`looking ${heading}`, () => {
        const layout = turned(NORTH[which], turns);
        const world = makeWorld(layout);
        const hit = world.blockRay();
        assert.ok(hit !== undefined, 'the block ray reaches the wall');

        if (layout.wins === 'mob') {
          const mob = world.entityRay();
          assert.ok(mob !== undefined && mob < hit.tIn, `the mob (${mob}) stands in front of the wall (${hit.tIn})`);
        } else {
          // What the outcome rests on: the entity ray stops at the wall, so the
          // mob never reaches the trap's distance comparison. Measured on BDS
          // 1.26.51.1 for all eight behind/edge layouts.
          assert.equal(world.entityRay(), undefined, 'the entity ray does not see through the wall');
        }
        // Control: on a South or East face the corner + faceLocation reading
        // the trap uses lands a block deep, so this activation runs through
        // the quirk rather than around it.
        if (hit.face === 'South' || hit.face === 'East') {
          const l = hit.cell;
          const cornerPlus = dist(world.head, { x: l.x + hit.faceLocation.x, y: l.y + hit.faceLocation.y, z: l.z + hit.faceLocation.z });
          assert.ok(cornerPlus - hit.tIn > 0.5, `corner + faceLocation (${cornerPlus}) overshoots the face (${hit.tIn})`);
        }

        const placed = world.use();
        assert.deepEqual(grownCenter(placed), layout.center, `the cube grows around ${key(layout.center)} (the ${layout.wins})`);
        assert.deepEqual(placed, cube(layout.center));
      });
    }
  });
}

test('the trap leaves the entity ray stopping at blocks — the rule rests on it', () => {
  const world = makeWorld(turned(NORTH.edge, TURNS.north));
  world.use();
  assert.ok(world.entityRayOptions.length > 0, 'the trap cast its entity ray');
  for (const opts of world.entityRayOptions) {
    assert.notEqual(opts?.ignoreBlockCollision, true, 'ignoreBlockCollision would let the mob behind the wall win');
  }
});
