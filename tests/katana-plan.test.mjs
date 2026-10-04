// Dragon Katana jump geometry over a fake block reader (spec §5, §6;
// L0-katn-p001 steps 4–7, L0-katn-r004, L0-katn-ent2,
// decision-katana-landing-above-lava-unsafe). The fake ray follows the
// KATA-PROBE-01 measurements (docs/feedback/probe-katana.md); the first block
// of tests pins it to those numbers before the plan is judged against it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const PLAN_TS = join(projectRoot, 'src', 'katana', 'plan.ts');

// No engine stub: any runtime @minecraft import stays external and fails the
// load below, and the output is checked for it.
const bundle = await build({
  entryPoints: [PLAN_TS],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  external: ['@minecraft/*'],
});
const bundleText = bundle.outputFiles[0].text;
const { planTeleport, standsSafely, KATANA_RANGE, TRACE_FLAGS, HAZARDS } = await import(
  'data:text/javascript;base64,' + Buffer.from(bundleText, 'utf-8').toString('base64')
);

// ------------------------------------------------------------------ the fake block reader

const AXES = ['x', 'y', 'z'];
const FULL = [{ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }];
const SPECS = {
  'minecraft:stone': { kind: 'solid', box: FULL },
  'minecraft:grass_block': { kind: 'solid', box: FULL },
  'minecraft:soul_soil': { kind: 'solid', box: FULL },
  'minecraft:magma': { kind: 'solid', box: FULL },
  'minecraft:water': { kind: 'liquid', box: FULL },
  'minecraft:flowing_water': { kind: 'liquid', box: FULL },
  'minecraft:lava': { kind: 'liquid', box: FULL },
  'minecraft:flowing_lava': { kind: 'liquid', box: FULL },
  'minecraft:short_grass': { kind: 'passable', box: FULL },
  'minecraft:poppy': { kind: 'passable', box: FULL },
  'minecraft:web': { kind: 'passable', box: FULL },
  'minecraft:white_carpet': { kind: 'passable', box: FULL },
  // Block rays never see fire, whatever the flags (P4).
  'minecraft:fire': { kind: 'invisible' },
  'minecraft:soul_fire': { kind: 'invisible' },
  bottom_slab: { typeId: 'minecraft:oak_slab', kind: 'solid', box: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0.5, z: 1 }] },
  top_slab: { typeId: 'minecraft:oak_slab', kind: 'solid', box: [{ x: 0, y: 0.5, z: 0 }, { x: 1, y: 1, z: 1 }] },
  fence: { typeId: 'minecraft:oak_fence', kind: 'solid', box: [{ x: 0.375, y: 0, z: 0.375 }, { x: 0.625, y: 1, z: 0.625 }] },
  pane: { typeId: 'minecraft:glass_pane', kind: 'solid', box: [{ x: 0.4375, y: 0, z: 0 }, { x: 0.5625, y: 1, z: 1 }] },
};
const FACE = { x: ['West', 'East'], y: ['Down', 'Up'], z: ['North', 'South'] };

const keyOf = (c) => `${c.x},${c.y},${c.z}`;
const floorV = (p) => ({ x: Math.floor(p.x), y: Math.floor(p.y), z: Math.floor(p.z) });
const frac = (p) => ({ x: p.x - Math.floor(p.x), y: p.y - Math.floor(p.y), z: p.z - Math.floor(p.z) });
const along = (from, dir, t) => ({ x: from.x + dir.x * t, y: from.y + dir.y * t, z: from.z + dir.z * t });
const unit = (v) => {
  const n = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / n, y: v.y / n, z: v.z / n };
};
const towards = (from, to) => unit({ x: to.x - from.x, y: to.y - from.y, z: to.z - from.z });

/** Cells in visiting order, one axis crossing per step, with the entry parameter. */
function* walk(from, dir) {
  const cell = floorV(from);
  const next = {};
  const delta = {};
  for (const a of AXES) {
    delta[a] = dir[a] === 0 ? Infinity : 1 / Math.abs(dir[a]);
    next[a] = dir[a] > 0 ? (cell[a] + 1 - from[a]) / dir[a] : dir[a] < 0 ? (from[a] - cell[a]) / -dir[a] : Infinity;
  }
  let t = 0;
  for (;;) {
    yield { cell: { ...cell }, t };
    const a = next.x <= next.y && next.x <= next.z ? 'x' : next.y <= next.z ? 'y' : 'z';
    if (!Number.isFinite(next[a])) return;
    t = next[a];
    cell[a] += Math.sign(dir[a]);
    next[a] += delta[a];
  }
}

/** Where a ray first meets the box `[lo, hi]` placed in `cell`; null on a miss. */
function boxHit(from, dir, cell, [lo, hi]) {
  let near = -Infinity;
  let far = Infinity;
  let axis = 'x';
  for (const a of AXES) {
    const min = cell[a] + lo[a];
    const max = cell[a] + hi[a];
    if (dir[a] === 0) {
      if (from[a] < min || from[a] > max) return null;
      continue;
    }
    let t1 = (min - from[a]) / dir[a];
    let t2 = (max - from[a]) / dir[a];
    if (t1 > t2) [t1, t2] = [t2, t1];
    if (t1 > near) {
      near = t1;
      axis = a;
    }
    far = Math.min(far, t2);
  }
  if (near > far || far < 0) return null;
  const t = Math.max(near, 0);
  return { t, face: FACE[axis][dir[axis] > 0 ? 0 : 1], point: along(from, dir, t) };
}

class FakeWorld {
  /**
   * `floor`: every cell at or under this y is stone unless set otherwise.
   * `loaded(x, z)`: chunk loading by block column. `unloadedRays`: 'throw'
   * (LocationInUnloadedChunkError, the full-suite answer) or 'miss' (an
   * unloaded cell reads as empty, the fresh-world answer through air) — P5.
   */
  constructor({ floor, loaded = () => true, unloadedRays = 'throw', heightRange = { min: -64, max: 320 } } = {}) {
    this.floor = floor;
    this.loaded = loaded;
    this.unloadedRays = unloadedRays;
    this.heightRange = heightRange;
    this.cells = new Map();
    this.rays = 0;
    this.threw = 0;
    this.rayThrows = false;
  }

  set(cell, name) {
    this.cells.set(keyOf(cell), name === 'minecraft:air' ? null : { typeId: SPECS[name]?.typeId ?? name, ...SPECS[name] });
    return this;
  }

  fill(a, b, name) {
    for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++)
      for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y++)
        for (let z = Math.min(a.z, b.z); z <= Math.max(a.z, b.z); z++) this.set({ x, y, z }, name);
    return this;
  }

  blockAt(cell) {
    const set = this.cells.get(keyOf(cell));
    if (set !== undefined) return set;
    if (this.floor !== undefined && cell.y <= this.floor) return { typeId: 'minecraft:stone', ...SPECS['minecraft:stone'] };
    return null;
  }

  readable(cell) {
    return cell.y >= this.heightRange.min && cell.y < this.heightRange.max && this.loaded(cell.x, cell.z);
  }

  isChunkLoaded(location) {
    const c = floorV(location);
    return this.loaded(c.x, c.z);
  }

  getBlock(location) {
    const c = floorV(location);
    if (c.y < this.heightRange.min || c.y >= this.heightRange.max) throw new Error('LocationOutOfWorldBoundariesError');
    if (!this.loaded(c.x, c.z)) throw new Error('LocationInUnloadedChunkError');
    const b = this.blockAt(c);
    return { typeId: b?.typeId ?? 'minecraft:air', isAir: b === null, location: c };
  }

  /**
   * `maxDistance` budgets cell steps (P2b). A shape the ray meets on the
   * face it enters through is caught on entry; one met inside its cell —
   * the start cell included — only as the ray steps out of it (P3).
   */
  getBlockFromRay(from, dir, { maxDistance, includePassableBlocks = false, includeLiquidBlocks = false }) {
    this.rays++;
    if (this.rayThrows) throw new Error('LocationInUnloadedChunkError: fake');
    const budget = Math.floor(maxDistance + 1e-9);
    const stops = (b) =>
      b.kind === 'solid' ||
      (b.kind === 'passable' && includePassableBlocks) ||
      (b.kind === 'liquid' && includePassableBlocks && includeLiquidBlocks);
    let step = 0;
    for (const { cell, t } of walk(from, dir)) {
      if (!this.readable(cell)) {
        if (this.unloadedRays === 'throw') {
          this.threw++;
          throw new Error(`LocationInUnloadedChunkError: ${keyOf(cell)}`);
        }
      } else {
        const b = this.blockAt(cell);
        const h = b !== null && stops(b) ? boxHit(from, dir, cell, b.box) : null;
        if (h !== null) {
          const onEntry = step > 0 && h.t <= t + 1e-9;
          if (!onEntry && step + 1 > budget) return undefined;
          return {
            block: { location: cell, typeId: b.typeId },
            face: h.face,
            faceLocation: b.kind === 'liquid' ? { x: 0, y: 0, z: 0 } : frac(h.point),
            // Not engine API: lets the tests measure where the ray met the block.
            t: h.t,
          };
        }
      }
      if (++step > budget) return undefined;
    }
    return undefined;
  }
}

// ------------------------------------------------------------------ helpers

const EYE = 1.62;
const DOWN = { x: 0, y: -1, z: 0 };
const EAST = { x: 1, y: 0, z: 0 };

/** A player standing centred in feet cell (x, y, z). */
function stand(x, y, z, eye = EYE) {
  const origin = { x: x + 0.5, y, z: z + 0.5 };
  return { origin, head: { x: origin.x, y: y + eye, z: origin.z } };
}

/** Yaw from +x toward +z, pitch up from level, both in degrees. */
function look(yaw, pitch) {
  const p = (pitch * Math.PI) / 180;
  const w = (yaw * Math.PI) / 180;
  return { x: Math.cos(p) * Math.cos(w), y: Math.sin(p), z: Math.cos(p) * Math.sin(w) };
}

function plan(world, who, dir) {
  return planTeleport(world, who.origin, who.head, dir);
}

/** How far the head moves: the head keeps its offset above the feet. */
function headShift(p) {
  const after = { x: p.feet.x + p.head.x - p.origin.x, y: p.feet.y + p.head.y - p.origin.y, z: p.feet.z + p.head.z - p.origin.z };
  return Math.hypot(after.x - p.head.x, after.y - p.head.y, after.z - p.head.z);
}

const feetCell = (p) => floorV({ x: p.feet.x, y: p.feet.y + 1e-6, z: p.feet.z });

/** Deterministic PRNG (mulberry32). */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------------------------ AC#1: no engine at runtime

test('plan.ts imports @minecraft/server for types only', () => {
  const source = readFileSync(PLAN_TS, 'utf8');
  const statements = source.match(/^(?:import|export)\b[^;]*?["']@minecraft\/[^"']+["']/gm) ?? [];
  assert.ok(statements.length >= 1, 'plan.ts is expected to take its vector and dimension types from @minecraft/server');
  for (const s of statements) assert.match(s, /^import type \{/, `runtime engine import: ${s}`);
  assert.doesNotMatch(source, /\brequire\s*\(|\bimport\s*\(/, 'no dynamic engine import either');
});

test('the bundle carries no @minecraft import and loads under plain node with no stub', () => {
  assert.doesNotMatch(bundleText, /@minecraft\//);
  assert.equal(typeof planTeleport, 'function');
  assert.equal(KATANA_RANGE, 20);
});

test('the plan only reads: no method beyond the four reader calls is touched', () => {
  const world = new FakeWorld({ floor: 63 }).fill({ x: 6, y: 64, z: -2 }, { x: 6, y: 66, z: 2 }, 'minecraft:stone');
  const touched = new Set();
  const spy = new Proxy(world, {
    get(target, prop, receiver) {
      touched.add(String(prop));
      const v = Reflect.get(target, prop, receiver);
      return typeof v === 'function' ? v.bind(target) : v;
    },
  });
  for (const dir of [EAST, look(30, -20), look(200, 10), look(0, 89)]) plan(spy, stand(0, 64, 0), dir);
  const allowed = new Set(['heightRange', 'isChunkLoaded', 'getBlock', 'getBlockFromRay']);
  assert.deepEqual([...touched].filter((p) => !allowed.has(p)), []);
});

// ------------------------------------------------------------------ the fake matches the probe

test('fake reproduces P2b: maxDistance counts cell steps, so 20 misses a diagonal stone at 16.40 and 13.16 blocks', () => {
  const cases = [
    { from: { x: 0.5, y: 3.5, z: 3.5 }, aim: { x: 16.5, y: 3.5, z: 3.5 }, block: { x: 16, y: 3, z: 3 }, smallest: 16 },
    { from: { x: 0.5, y: 3.5, z: 0.5 }, aim: { x: 12.5, y: 3.5, z: 12.3 }, block: { x: 12, y: 3, z: 12 }, smallest: 24 },
    { from: { x: 0.5, y: 2.5, z: 0.5 }, aim: { x: 8.5, y: 10.3, z: 8.4 }, block: { x: 8, y: 10, z: 8 }, smallest: 24 },
  ];
  for (const c of cases) {
    const w = new FakeWorld().set(c.block, 'minecraft:stone');
    const dir = towards(c.from, c.aim);
    let smallest;
    for (let md = 1; md <= 48 && smallest === undefined; md += 0.25) {
      if (w.getBlockFromRay(c.from, dir, { ...TRACE_FLAGS, maxDistance: md }) !== undefined) smallest = md;
    }
    assert.equal(smallest, c.smallest, keyOf(c.block));
  }
});

test('fake reproduces P3: the 2−2ε column misses a bottom slab in the feet cell, length 2 catches it, the floor is the cell below', () => {
  const F = { x: 3, y: 2, z: 3 };
  const top = { x: 3.5, y: 4 - 0.01, z: 3.5 };
  const w = new FakeWorld({ floor: 1 }).set(F, 'bottom_slab');
  assert.equal(w.getBlockFromRay(top, DOWN, { ...TRACE_FLAGS, maxDistance: 2 - 0.02 }), undefined);
  assert.deepEqual(w.getBlockFromRay(top, DOWN, { ...TRACE_FLAGS, maxDistance: 2 }).block.location, F);
  const empty = new FakeWorld({ floor: 1 });
  assert.deepEqual(empty.getBlockFromRay(top, DOWN, { ...TRACE_FLAGS, maxDistance: 2 }).block.location, { x: 3, y: 1, z: 3 });
});

test('fake reproduces P4: a ray down meets lava only with both flags, and never fire', () => {
  const w = new FakeWorld({ floor: 0 }).set({ x: 3, y: 1, z: 4 }, 'minecraft:lava').set({ x: 1, y: 1, z: 1 }, 'minecraft:fire');
  const from = { x: 3.5, y: 2.5, z: 4.5 };
  const ALL = { includePassableBlocks: true, includeLiquidBlocks: true };
  assert.equal(w.getBlockFromRay(from, DOWN, { ...ALL, maxDistance: 64 }).block.typeId, 'minecraft:lava');
  assert.equal(w.getBlockFromRay(from, DOWN, { includeLiquidBlocks: true, maxDistance: 64 }).block.typeId, 'minecraft:stone');
  assert.equal(w.getBlockFromRay(from, DOWN, { ...TRACE_FLAGS, maxDistance: 64 }).block.typeId, 'minecraft:stone');
  assert.deepEqual(w.getBlockFromRay({ x: 1.5, y: 2.5, z: 1.5 }, DOWN, { ...ALL, maxDistance: 64 }).block.location, { x: 1, y: 0, z: 1 });
});

// ------------------------------------------------------------------ AC#2: the trace

test('a wall ahead: the trace stops at its near face and the player lands on the near side', () => {
  const w = new FakeWorld({ floor: 63 }).fill({ x: 10, y: 64, z: -2 }, { x: 12, y: 68, z: 2 }, 'minecraft:stone');
  const who = stand(0, 64, 0);
  // T07: aimed level, and aimed at a point 15 blocks out through the wall.
  for (const dir of [EAST, towards(who.head, { x: 15.5, y: 64.5, z: 0.5 })]) {
    const p = plan(w, who, dir);
    assert.equal(p.stoppedBy, 'block');
    assert.equal(p.hitFace, 'West');
    assert.ok(p.endpoint.x < 10 && p.endpoint.x >= 9.6, `endpoint ${p.endpoint.x}`);
    assert.ok(p.feet !== undefined);
    assert.ok(p.feet.x < 10 && p.feet.x >= 8.5, `feet x ${p.feet.x}: within 1.5 of the near face, on the player's side`);
    assert.equal(p.feet.y, 64);
  }
});

test('walls on all four sides and the floor: the endpoint sits exactly 0.3 in front of the face that was hit', () => {
  // faceLocation reads 0 on a full East, South or Up face; the hit point must still be the face itself.
  const cases = [
    { dir: { x: 1, y: 0, z: 0 }, wall: [{ x: 10, y: 64, z: -2 }, { x: 12, y: 68, z: 2 }], face: 'West', axis: 'x', plane: 10 },
    { dir: { x: -1, y: 0, z: 0 }, wall: [{ x: -12, y: 64, z: -2 }, { x: -10, y: 68, z: 2 }], face: 'East', axis: 'x', plane: -9 },
    { dir: { x: 0, y: 0, z: 1 }, wall: [{ x: -2, y: 64, z: 10 }, { x: 2, y: 68, z: 12 }], face: 'North', axis: 'z', plane: 10 },
    { dir: { x: 0, y: 0, z: -1 }, wall: [{ x: -2, y: 64, z: -12 }, { x: 2, y: 68, z: -10 }], face: 'South', axis: 'z', plane: -9 },
  ];
  for (const c of cases) {
    const w = new FakeWorld({ floor: 63 }).fill(c.wall[0], c.wall[1], 'minecraft:stone');
    const p = plan(w, stand(0, 64, 0), c.dir);
    assert.equal(p.hitFace, c.face);
    assert.ok(Math.abs(p.endpoint[c.axis] - (c.plane - 0.3 * c.dir[c.axis])) < 1e-9, `${c.face}: endpoint ${JSON.stringify(p.endpoint)}`);
    assert.ok(p.feet !== undefined && Math.abs(p.feet[c.axis] - (c.plane - 0.5 * c.dir[c.axis])) < 1e-9, `${c.face}: feet ${JSON.stringify(p.feet)}`);
  }
  const who = stand(0, 64, 0);
  const p = plan(new FakeWorld({ floor: 63 }), who, towards(who.head, { x: 12.5, y: 64, z: 0.5 }));
  assert.equal(p.hitFace, 'Up');
  assert.ok(p.endpoint.y > 64 && p.endpoint.y < 64.3, `floor: endpoint ${JSON.stringify(p.endpoint)}`);
  assert.deepEqual(p.feet, { x: 12.5, y: 64, z: 0.5 });
});

test('a floor hit lands on the block that was aimed at, even when the endpoint falls back over an unstandable column', () => {
  // The ray meets the top of (10,63,0) 0.1 past its edge; pulled back 0.3, the endpoint is over column 9, which burns.
  const w = new FakeWorld({ floor: 63 }).set({ x: 9, y: 64, z: 0 }, 'minecraft:fire');
  const who = stand(0, 64, 0);
  const p = plan(w, who, towards(who.head, { x: 10.1, y: 64, z: 0.5 }));
  assert.equal(p.hitFace, 'Up');
  assert.ok(Math.floor(p.endpoint.x) === 9, `endpoint ${JSON.stringify(p.endpoint)}`);
  assert.deepEqual(p.feet, { x: 10.5, y: 64, z: 0.5 });
});

test('a part-block whose shape lies within 20 but whose cell runs past it still stops the trace', () => {
  // The fence post spans x 20.375–20.625: met at 19.875 blocks, inside the last cell; caught only when the ray leaves the cell (P3).
  const w = new FakeWorld({ floor: 63 }).fill({ x: 20, y: 64, z: 0 }, { x: 20, y: 65, z: 0 }, 'fence');
  const p = plan(w, stand(0, 64, 0), EAST);
  assert.equal(p.stoppedBy, 'block');
  assert.equal(p.hitFace, 'West');
  assert.ok(Math.abs(p.endpoint.x - 20.075) < 1e-9, `endpoint ${JSON.stringify(p.endpoint)}`);
  assert.deepEqual(p.feet, { x: 19.5, y: 64, z: 0.5 });
});

test('a diagonal wall the 20-step ray would miss is still not phased through', () => {
  // P2b: stones 16.40 and 13.16 blocks out take 24 cell steps.
  const cases = [
    { feet: { x: 0, y: 2, z: 0 }, aim: { x: 12.5, y: 3.5, z: 12.3 }, wallX: 12 },
    { feet: { x: 0, y: 1, z: 0 }, aim: { x: 8.5, y: 10.3, z: 8.4 }, wallX: 8 },
  ];
  for (const c of cases) {
    const w = new FakeWorld({ floor: c.feet.y - 1 }).fill({ x: c.wallX, y: c.feet.y, z: -20 }, { x: c.wallX + 2, y: 30, z: 30 }, 'minecraft:stone');
    const who = stand(c.feet.x, c.feet.y, c.feet.z);
    const dir = towards(who.head, c.aim);
    assert.equal(w.getBlockFromRay(who.head, dir, { ...TRACE_FLAGS, maxDistance: 20 }), undefined, 'the naive ray misses the wall');
    const p = plan(w, who, dir);
    assert.equal(p.stoppedBy, 'block');
    assert.ok(p.endpoint.x < c.wallX, `endpoint x ${p.endpoint.x}`);
    assert.ok(p.feet !== undefined && p.feet.x < c.wallX, `feet ${JSON.stringify(p.feet)}`);
  }
});

test('part-blocks across the path stop the trace: slab, fence, glass pane', () => {
  for (const [name, cell] of [
    ['top_slab', { x: 8, y: 65, z: 0 }],
    ['fence', { x: 8, y: 65, z: 0 }],
    ['pane', { x: 8, y: 65, z: 0 }],
  ]) {
    const w = new FakeWorld({ floor: 63 }).set(cell, name).set({ x: 8, y: 64, z: 0 }, name === 'top_slab' ? 'minecraft:stone' : name);
    const p = plan(w, stand(0, 64, 0), EAST);
    assert.equal(p.stoppedBy, 'block', name);
    assert.ok(p.feet !== undefined && p.feet.x < 9, `${name}: feet ${JSON.stringify(p.feet)}`);
  }
});

test('liquids do not stop the trace: a water wall, a lava wall and a lava pool are crossed', () => {
  for (const name of ['minecraft:water', 'minecraft:lava', 'minecraft:flowing_water', 'minecraft:flowing_lava']) {
    const wall = new FakeWorld({ floor: 63 }).fill({ x: 6, y: 64, z: -5 }, { x: 7, y: 70, z: 5 }, name);
    const p = plan(wall, stand(0, 64, 0), EAST);
    assert.equal(p.stoppedBy, 'range', name);
    assert.equal(p.hitFace, undefined, name);
    assert.deepEqual(p.feet, { x: 20.5, y: 64, z: 0.5 }, name);
  }

  // T08: aim past a lava pool sunk into the floor — the landing is beyond it, not in it nor over it.
  const lava = new FakeWorld({ floor: 63 }).fill({ x: 4, y: 63, z: -3 }, { x: 12, y: 63, z: 3 }, 'minecraft:lava');
  const who = stand(0, 64, 0);
  const q = plan(lava, who, towards(who.head, { x: 16.5, y: 64, z: 0.5 }));
  assert.equal(q.stoppedBy, 'block');
  assert.equal(q.hitFace, 'Up');
  assert.ok(q.feet !== undefined && q.feet.x > 13, `feet ${JSON.stringify(q.feet)}`);
  assert.equal(lava.getBlock({ ...q.feet, y: q.feet.y - 1 }).typeId, 'minecraft:stone');
});

test('passable blocks do not stop the trace: grass, flowers, cobweb, carpet', () => {
  const w = new FakeWorld({ floor: 63 })
    .set({ x: 3, y: 64, z: 0 }, 'minecraft:short_grass')
    .set({ x: 5, y: 64, z: 0 }, 'minecraft:poppy')
    .fill({ x: 7, y: 64, z: 0 }, { x: 7, y: 66, z: 0 }, 'minecraft:web')
    .set({ x: 9, y: 64, z: 0 }, 'minecraft:white_carpet');
  const p = plan(w, stand(0, 64, 0), EAST);
  assert.equal(p.stoppedBy, 'range');
  assert.deepEqual(p.feet, { x: 20.5, y: 64, z: 0.5 });
});

test('an unloaded chunk ahead shortens the trace: stoppedBy unreadable, the landing stays this side of it', () => {
  for (const unloadedRays of ['throw', 'miss']) {
    const w = new FakeWorld({ floor: 63, loaded: (x) => x < 16, unloadedRays });
    const who = stand(0, 64, 0);
    for (const dir of [EAST, towards(who.head, { x: 24.5, y: 63.5, z: 0.5 }), look(20, 5)]) {
      const p = plan(w, who, dir);
      assert.equal(p.stoppedBy, 'unreadable', `${unloadedRays} ${JSON.stringify(dir)}`);
      assert.ok(p.endpoint.x < 16, `endpoint ${p.endpoint.x}`);
      assert.ok(p.feet !== undefined && p.feet.x < 16, `feet ${JSON.stringify(p.feet)}`);
    }
    assert.equal(w.threw, 0, 'no ray of the plan stepped into the unloaded chunk');
  }
  // Without the walk, the same sloped ray reaches the unloaded ground: it throws or reports nothing (P5).
  const naive = new FakeWorld({ floor: 63, loaded: (x) => x < 16 });
  const who = stand(0, 64, 0);
  assert.throws(() => naive.getBlockFromRay(who.head, towards(who.head, { x: 24.5, y: 63.5, z: 0.5 }), { ...TRACE_FLAGS, maxDistance: 40 }));
});

test('the build limit is unreadable too', () => {
  const w = new FakeWorld();
  const p = plan(w, stand(0, 310, 0), { x: 0, y: 1, z: 0 });
  assert.equal(p.stoppedBy, 'unreadable');
  assert.ok(p.endpoint.y < 320);
  assert.deepEqual(p.feet, { x: 0.5, y: 318, z: 0.5 });
});

test('a trace ray that throws despite the walk is a refusal, not a guess', () => {
  const w = new FakeWorld({ floor: 63 });
  w.rayThrows = true;
  const p = plan(w, stand(0, 64, 0), EAST);
  assert.equal(p.stoppedBy, 'unreadable');
  assert.equal(p.feet, undefined);
});

test('no safe cell: boxed in, the plan refuses in every direction', () => {
  const w = new FakeWorld({ floor: 63 })
    .fill({ x: -1, y: 64, z: -1 }, { x: 1, y: 66, z: 1 }, 'minecraft:stone')
    .fill({ x: 0, y: 64, z: 0 }, { x: 0, y: 65, z: 0 }, 'minecraft:air');
  const who = stand(0, 64, 0);
  for (let yaw = 0; yaw < 360; yaw += 15)
    for (const pitch of [-90, -45, -10, 0, 10, 45, 90]) {
      const p = plan(w, who, look(yaw, pitch));
      assert.equal(p.feet, undefined, `yaw ${yaw} pitch ${pitch}: ${JSON.stringify(p.feet)}`);
    }
});

test('no safe cell: on a pillar in a lava lake, nothing over the lake is ever taken', () => {
  const w = new FakeWorld({ floor: 62 }).fill({ x: -25, y: 63, z: -25 }, { x: 25, y: 63, z: 25 }, 'minecraft:lava').set({ x: 0, y: 63, z: 0 }, 'minecraft:stone');
  const who = stand(0, 64, 0);
  for (let yaw = 0; yaw < 360; yaw += 30)
    for (const pitch of [-30, -10, 0, 20]) {
      const p = plan(w, who, look(yaw, pitch));
      if (p.feet !== undefined) {
        // Only the cells straight above the pillar stand on stone.
        const c = feetCell(p);
        assert.ok(c.x === 0 && c.z === 0, `yaw ${yaw} pitch ${pitch}: landed over the lake at ${keyOf(c)}`);
      }
    }
  assert.equal(plan(w, who, EAST).feet, undefined);
});

// ------------------------------------------------------------------ AC#3: what lies under the landing

test('standsSafely: air over lava or fire is refused, over water or a solid floor accepted', () => {
  const cases = [
    { label: 'air over stone', below: [], ok: true },
    { label: 'air over water', below: ['minecraft:water'], ok: true },
    { label: 'air over flowing water', below: ['minecraft:flowing_water'], ok: true },
    { label: 'air over magma', below: ['minecraft:magma'], ok: true },
    { label: 'air over lava', below: ['minecraft:lava'], ok: false },
    { label: 'air over flowing lava', below: ['minecraft:flowing_lava'], ok: false },
    { label: 'two air cells over lava', below: ['minecraft:air', 'minecraft:lava'], ok: false },
    { label: 'three air cells over water', below: ['minecraft:air', 'minecraft:air', 'minecraft:water'], ok: true },
    { label: 'air over fire', below: ['minecraft:fire'], ok: false },
    { label: 'air over soul fire on soul soil', below: ['minecraft:soul_fire', 'minecraft:soul_soil'], ok: false },
    { label: 'two air cells over fire', below: ['minecraft:air', 'minecraft:fire'], ok: false },
  ];
  for (const c of cases) {
    // Floor at y=0; `below` fills the cells under the feet from the top down.
    const feet = { x: 4, y: 1 + c.below.length, z: 4 };
    const w = new FakeWorld({ floor: 0 });
    c.below.forEach((name, i) => w.set({ x: 4, y: feet.y - 1 - i, z: 4 }, name));
    assert.equal(standsSafely(w, feet), c.ok, c.label);
  }
});

test('standsSafely: the feet and head cells (P3 cases, plus hazards and water)', () => {
  const cases = [
    { label: 'empty', ok: true },
    { label: 'stone in the feet cell', feet: 'minecraft:stone', ok: false },
    { label: 'bottom slab in the feet cell', feet: 'bottom_slab', ok: false },
    { label: 'top slab in the feet cell', feet: 'top_slab', ok: false },
    { label: 'bottom slab in the head cell', head: 'bottom_slab', ok: false },
    { label: 'top slab in the head cell', head: 'top_slab', ok: false },
    { label: 'carpet in the feet cell', feet: 'minecraft:white_carpet', ok: true },
    { label: 'short grass in the feet cell', feet: 'minecraft:short_grass', ok: true },
    { label: 'fence in the feet cell', feet: 'fence', ok: false },
    { label: 'water in both cells', feet: 'minecraft:water', head: 'minecraft:water', ok: true },
    { label: 'lava in the feet cell', feet: 'minecraft:lava', ok: false },
    { label: 'fire in the feet cell', feet: 'minecraft:fire', ok: false },
    { label: 'soul fire in the head cell', head: 'minecraft:soul_fire', ok: false },
  ];
  for (const c of cases) {
    const F = { x: 3, y: 2, z: 3 };
    const w = new FakeWorld({ floor: 1 });
    if (c.feet) w.set(F, c.feet);
    if (c.head) w.set({ ...F, y: 3 }, c.head);
    assert.equal(standsSafely(w, F), c.ok, c.label);
  }
  // Unreadable means solid.
  assert.equal(standsSafely(new FakeWorld({ floor: 1, loaded: (x) => x < 0 }), { x: 3, y: 2, z: 3 }), false);
  assert.equal(standsSafely(new FakeWorld(), { x: 0, y: 319, z: 0 }), false);
});

test('aiming into the air over a lava lake lands on stone short of it; over water or stone the aimed cell is taken', () => {
  const who = stand(0, 64, 0);
  const lake = (name) => new FakeWorld({ floor: 63 }).fill({ x: 14, y: 63, z: -4 }, { x: 24, y: 63, z: 4 }, name);

  const lava = lake('minecraft:lava');
  const p = plan(lava, who, EAST);
  assert.equal(p.stoppedBy, 'range');
  assert.ok(p.feet !== undefined, 'refused instead of stepping back');
  assert.ok(p.feet.x < 14, `feet ${JSON.stringify(p.feet)}`);
  assert.equal(lava.getBlock({ ...p.feet, y: 63 }).typeId, 'minecraft:stone');

  for (const name of ['minecraft:water', 'minecraft:stone']) {
    assert.deepEqual(plan(lake(name), who, EAST).feet, { x: 20.5, y: 64, z: 0.5 }, name);
  }
});

// ------------------------------------------------------------------ AC#4: the 20-block cap

function directions() {
  const out = [];
  for (let pitch = -90; pitch <= 90; pitch += 5) for (let yaw = 0; yaw < 360; yaw += 5) out.push({ yaw, pitch, dir: look(yaw, pitch) });
  const r = rng(20261004);
  for (let i = 0; i < 400; i++) {
    const v = { x: r() * 2 - 1, y: r() * 2 - 1, z: r() * 2 - 1 };
    if (Math.hypot(v.x, v.y, v.z) > 0.05) out.push({ yaw: NaN, pitch: NaN, dir: unit(v) });
  }
  return out;
}

test('open air in any direction: aim past 20 is clamped, never refused, and the head moves at most 20.0', () => {
  const dirs = directions();
  for (const eye of [1.62, 1.52]) {
    for (const start of [stand(0, 100, 0, eye), { origin: { x: 3.27, y: 100.4, z: -7.81 }, head: { x: 3.27, y: 100.4 + eye, z: -7.81 } }]) {
      const w = new FakeWorld();
      let least = Infinity;
      for (const { yaw, pitch, dir } of dirs) {
        const p = plan(w, start, dir);
        const label = `eye ${eye} yaw ${yaw} pitch ${pitch} dir ${JSON.stringify(dir)}`;
        assert.equal(p.stoppedBy, 'range', label);
        assert.ok(p.feet !== undefined, `refused: ${label}`);
        const shift = headShift(p);
        assert.ok(shift <= 20.0, `${label}: head moved ${shift}`);
        least = Math.min(least, shift);
      }
      assert.ok(least >= 18.5, `a clamp, not a short hop: least ${least}`);
    }
  }
});

test('open air, level and at 45°: the head moves between 19.0 and 20.0 (T06)', () => {
  for (const eye of [1.62, 1.52]) {
    const who = stand(0, 64, 0, eye);
    const w = new FakeWorld({ floor: 63 });
    for (let yaw = 0; yaw < 360; yaw += 45) {
      const p = plan(w, who, look(yaw, 0));
      const shift = headShift(p);
      assert.ok(shift >= 19.0 && shift <= 20.0, `eye ${eye} yaw ${yaw}: ${shift}`);
    }
  }
});

test('over a floor, every direction keeps the head within 20.0, and every look above the horizon lands', () => {
  const w = new FakeWorld({ floor: 63 });
  const who = stand(0, 64, 0);
  for (const { yaw, pitch, dir } of directions()) {
    const p = plan(w, who, dir);
    if (p.feet === undefined) {
      assert.ok(dir.y < 0, `refused looking up: yaw ${yaw} pitch ${pitch}`);
      continue;
    }
    assert.ok(headShift(p) <= 20.0, `yaw ${yaw} pitch ${pitch}: ${headShift(p)}`);
  }
});

// ------------------------------------------------------------------ invariants over random worlds

test('random worlds: a landing is in range, standing, on the owner side, reachable, and not the start cell', () => {
  const r = rng(7);
  const palette = ['minecraft:stone', 'bottom_slab', 'top_slab', 'fence', 'pane', 'minecraft:lava', 'minecraft:water', 'minecraft:fire', 'minecraft:short_grass', 'minecraft:web'];
  let landed = 0;
  for (let n = 0; n < 60; n++) {
    const w = new FakeWorld({ floor: 63 });
    for (let i = 0; i < 1500; i++) {
      const cell = { x: Math.floor(r() * 41) - 20, y: 64 + Math.floor(r() * 12), z: Math.floor(r() * 41) - 20 };
      if (cell.x === 0 && cell.z === 0 && cell.y <= 65) continue;
      w.set(cell, palette[Math.floor(r() * palette.length)]);
    }
    const who = stand(0, 64, 0);
    for (let k = 0; k < 10; k++) {
      const dir = look(r() * 360, r() * 120 - 60);
      const p = plan(w, who, dir);
      if (p.feet === undefined) continue;
      landed++;
      const c = feetCell(p);
      const label = `world ${n} dir ${JSON.stringify(dir)} feet ${keyOf(c)}`;
      assert.ok(headShift(p) <= 20.0, label);
      assert.notDeepEqual(c, { x: 0, y: 64, z: 0 }, label);
      assert.ok(standsSafely(w, c), label);
      const target = { x: c.x + 0.5, y: c.y + 1.5, z: c.z + 0.5 };
      const len = Math.hypot(target.x - p.head.x, target.y - p.head.y, target.z - p.head.z);
      const block = w.getBlockFromRay(p.head, towards(p.head, target), { ...TRACE_FLAGS, maxDistance: 64 });
      assert.ok(block === undefined || block.t >= len, `${label}: ${keyOf(block?.block.location ?? {})} stands between the head and the landing`);
      if (p.hitFace !== undefined) {
        assert.equal(p.stoppedBy, 'block', label);
        // A centred head is ≥ 0.38 from any block, so the hit point is the endpoint plus the full pull-back.
        const hitAt = along(p.endpoint, p.dir, 0.3);
        const n = { Up: [0, 1, 0], Down: [0, -1, 0], East: [1, 0, 0], West: [-1, 0, 0], South: [0, 0, 1], North: [0, 0, -1] }[p.hitFace];
        const side = (q) => (q.x - hitAt.x) * n[0] + (q.y - hitAt.y) * n[1] + (q.z - hitAt.z) * n[2];
        assert.ok(side({ x: c.x + 0.5, y: c.y + 0.5, z: c.z + 0.5 }) * side(p.head) > 0, `${label}: landed behind the ${p.hitFace} face`);
      }
    }
  }
  assert.ok(landed > 200, `only ${landed} landings: the invariants were barely exercised`);
});

test('HAZARDS is the decided list and nothing more', () => {
  assert.deepEqual([...HAZARDS].sort(), ['minecraft:fire', 'minecraft:flowing_lava', 'minecraft:lava', 'minecraft:soul_fire']);
});
