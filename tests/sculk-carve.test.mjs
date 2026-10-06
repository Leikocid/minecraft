// The Sculk Crossbow crater and sculk off the engine (L0-sclk-p005, r003, r004, r010, ad04, ent4; ac11 node half).
//
// src/sculk/crater-plan.ts is bundled with no @minecraft/server at all. src/sculk/carve.ts is bundled with the
// real bolt loop against an in-memory engine and a recorder in place of lgnd's protectLegendariesIn. The GameTest
// twin in src/gametest/sculk-carve.ts carves real craters on BDS.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = async (outputFiles) => import('data:text/javascript;base64,' + Buffer.from(outputFiles[0].text, 'utf-8').toString('base64'));

const noEngine = {
  name: 'no-engine',
  setup(b) {
    b.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: 'mc', namespace: 'no-engine' }));
    b.onLoad({ filter: /.*/, namespace: 'no-engine' }, () => ({ contents: 'throw new Error("crater-plan.ts must stay free of runtime @minecraft/server imports");', loader: 'js' }));
  },
};
const plan = await load(
  (await build({ entryPoints: [join(projectRoot, 'src', 'sculk', 'crater-plan.ts')], bundle: true, format: 'esm', platform: 'neutral', write: false, plugins: [noEngine] })).outputFiles
);

const engineStub = `
const mc = (globalThis.__mcCarve = { handlers: {}, intervals: new Map(), intervalCalls: 0, nextRun: 1, tick: 0 });
const signal = (name) => ({
  subscribe(fn) { (mc.handlers[name] ??= []).push(fn); return fn; },
  unsubscribe(fn) { mc.handlers[name] = (mc.handlers[name] ?? []).filter((f) => f !== fn); },
});
export const world = {
  afterEvents: new Proxy({}, { get: (_, name) => signal(name) }),
  beforeEvents: new Proxy({}, { get: (_, name) => signal("before:" + name) }),
};
export const system = {
  get currentTick() { return mc.tick; },
  run(fn) { fn(); return mc.nextRun++; },
  runInterval(fn) { const id = mc.nextRun++; mc.intervals.set(id, fn); mc.intervalCalls++; return id; },
  clearRun(id) { mc.intervals.delete(id); },
};
export const LiquidType = { Water: "Water" };
export const EntityComponentTypes = { Projectile: "minecraft:projectile" };
export const EquipmentSlot = { Mainhand: "Mainhand", Offhand: "Offhand" };
export class Player {}
`;
const recoveryStub = `
const rec = (globalThis.__protect = { calls: [], refuse: false });
export const HOLDER_TYPES = ["minecraft:chest", "minecraft:barrel", "minecraft:frame", "minecraft:crafter"];
export function protectLegendariesIn(dimension, box, opts) {
  rec.calls.push({ tick: globalThis.__mcCarve.tick, box, reason: opts?.reason, writesBefore: dimension.writes.length });
  if (rec.refuse) throw new Error("legendary protect: minecraft:crafter has no script-readable inventory");
  return { moved: 0, handedBack: 0 };
}
`;
const stubs = {
  name: 'carve-stubs',
  setup(b) {
    b.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: 'mc', namespace: 'carve-stub' }));
    b.onResolve({ filter: /legendary\/(recovery|hands|registry)$/ }, (a) => ({ path: a.path, namespace: 'carve-stub' }));
    b.onLoad({ filter: /.*/, namespace: 'carve-stub' }, (a) => {
      if (a.path === 'mc') return { contents: engineStub, loader: 'js' };
      if (a.path.endsWith('recovery')) return { contents: recoveryStub, loader: 'js' };
      if (a.path.endsWith('hands')) return { contents: 'export const heldLegendaries = () => [];', loader: 'js' };
      return { contents: 'export const SCULK_CROSSBOW = { itemId: "andrew:sculk_crossbow" };', loader: 'js' };
    });
  },
};
const carve = await load(
  (
    await build({
      stdin: { contents: "export * from './carve'; export * from './bolt';", resolveDir: join(projectRoot, 'src', 'sculk'), loader: 'ts' },
      bundle: true,
      format: 'esm',
      platform: 'neutral',
      write: false,
      plugins: [stubs],
    })
  ).outputFiles
);
const mc = globalThis.__mcCarve;
const protect = globalThis.__protect;
const realWarn = console.warn;
console.warn = () => {};

// ---------------------------------------------------------------- fixture grids

const key = (c) => `${c.x},${c.y},${c.z}`;
const FACES = ['Up', 'Down', 'North', 'South', 'East', 'West'];

/** A probe over a map of cell → kind; anything unlisted is `fallback`. */
const probeFrom = (cells, fallback = 'air') => (at) => cells.get(key(at)) ?? fallback;

/** A slab of `solid` 7×7 in the face plane and 5 layers into it, air everywhere else. */
function slab(impact, face, kinds = new Map()) {
  const cells = new Map();
  for (let u = -3; u <= 3; u++) for (let v = -3; v <= 3; v++) for (let k = 0; k < 5; k++) cells.set(key(plan.cellAt(impact, face, u, v, k)), 'solid');
  for (const [k, v] of kinds) cells.set(k, v);
  return cells;
}

/** u, v, k of `c` relative to `impact` across `face`. */
function local(impact, face, c) {
  const a = plan.faceAxes(face);
  const d = { x: c.x - impact.x, y: c.y - impact.y, z: c.z - impact.z };
  const dot = (p, q) => p.x * q.x + p.y * q.y + p.z * q.z;
  return { u: dot(d, a.u), v: dot(d, a.v), k: -dot(d, a.out) };
}

// ---------------------------------------------------------------- crater-plan.ts

test('r003: the same impact, face and seed always give the same cells', () => {
  const impact = { x: 10, y: 64, z: -3 };
  const probe = probeFrom(slab(impact, 'Up'));
  const a = plan.planCrater(impact, 'Up', 12345, probe);
  const b = plan.planCrater(impact, 'Up', 12345, probe);
  assert.deepEqual(a, b);
  assert.notDeepEqual(plan.craterColumns(12345), plan.craterColumns(54321));
});

test('ac11: across 1000 seeds × 6 faces the crater stays in 5×5×3 and the sculk in the 5×5, layers −2…3', () => {
  const impact = { x: 0, y: 64, z: 0 };
  for (const face of FACES) {
    const probe = probeFrom(slab(impact, face));
    for (let seed = 0; seed < 1000; seed++) {
      const p = plan.planCrater(impact, face, (seed * 2654435761) >>> 0, probe);
      for (const c of p.air) {
        const l = local(impact, face, c);
        assert.ok(Math.abs(l.u) <= 2 && Math.abs(l.v) <= 2 && l.k >= 0 && l.k <= 2, `${face} seed ${seed}: air ${key(c)} at ${JSON.stringify(l)}`);
      }
      for (const c of p.sculk) {
        const l = local(impact, face, c);
        assert.ok(Math.abs(l.u) <= 2 && Math.abs(l.v) <= 2 && l.k >= -2 && l.k <= 3, `${face} seed ${seed}: sculk ${key(c)} at ${JSON.stringify(l)}`);
        assert.ok(!(Math.abs(l.u) === 2 && Math.abs(l.v) === 2), `${face} seed ${seed}: sculk on a corner`);
      }
      assert.equal(new Set(p.air.map(key)).size, p.air.length, 'no cell twice');
    }
  }
});

test('ac11: on flat stone the centre is ≥ 2 deep, 12 ≤ air ≤ 75, the footprint is never a full 5×5, ≥ 8 sculk', () => {
  const impact = { x: 0, y: 64, z: 0 };
  const probe = probeFrom(slab(impact, 'Up'));
  const shapes = new Set();
  for (let seed = 0; seed < 1000; seed++) {
    const s = (seed * 2246822519) >>> 0;
    const p = plan.planCrater(impact, 'Up', s, probe);
    const air = new Set(p.air.map(key));
    assert.ok(air.has('0,64,0') && air.has('0,63,0'), `seed ${s}: the impact cell or the one behind it stays`);
    assert.ok(p.air.length >= 12 && p.air.length <= 75, `seed ${s}: ${p.air.length} air cells`);
    const columns = new Set(p.air.map((c) => `${c.x},${c.z}`));
    assert.ok(columns.size < 25, `seed ${s}: every footprint column carved`);
    assert.ok(p.sculk.length >= 8, `seed ${s}: ${p.sculk.length} sculk cells`);
    for (const c of p.sculk) {
      assert.ok(!air.has(key(c)), 'sculk never on a carved cell');
      const above = { x: c.x, y: c.y + 1, z: c.z };
      assert.ok(air.has(key(above)) || probe(above) === 'air', `seed ${s}: sculk at ${key(c)} is not exposed`);
    }
    shapes.add([...air].sort().join(';'));
  }
  assert.ok(shapes.size > 500, `only ${shapes.size} distinct shapes in 1000 seeds`);
});

test('r010/xasm25: deny-list cells and liquids in the crater stay; the cell under a kept one still goes', () => {
  const impact = { x: 0, y: 64, z: 0 };
  const cells = slab(impact, 'Up', new Map([['0,63,0', 'keep'], ['1,64,0', 'liquid'], ['0,64,1', 'keep']]));
  for (let seed = 0; seed < 200; seed++) {
    const p = plan.planCrater(impact, 'Up', seed, probeFrom(cells));
    const air = new Set(p.air.map(key));
    for (const k of ['0,63,0', '1,64,0', '0,64,1']) assert.ok(!air.has(k), `seed ${seed}: ${k} planned`);
    assert.ok(air.has('0,64,0') && air.has('0,62,0'), `seed ${seed}: the impact or the cell under the kept one stays`);
    assert.ok(!p.sculk.some((c) => key(c) === '0,63,0' || key(c) === '0,64,1'), 'sculk never replaces a kept block');
  }
});

test('p005 step 1: a bolt on a kept or liquid block carves nothing, sculk still lands around it', () => {
  const impact = { x: 0, y: 64, z: 0 };
  for (const kind of ['keep', 'liquid']) {
    const p = plan.planCrater(impact, 'Up', 7, probeFrom(slab(impact, 'Up', new Map([['0,64,0', kind]]))));
    assert.equal(p.air.length, 0, kind);
    assert.ok(p.sculk.length >= 7, `${kind}: ${p.sculk.length} sculk cells`);
    assert.ok(p.sculk.every((c) => c.y === 64 && key(c) !== '0,64,0'), `${kind}: sculk off the surface or on the impact`);
  }
});

test('C-12: an unloaded cell is never planned, for air or for sculk', () => {
  const impact = { x: 0, y: 64, z: 0 };
  const cells = slab(impact, 'Up');
  for (const [k] of cells) if (Number(k.split(',')[0]) >= 1) cells.set(k, 'unloaded');
  for (let seed = 0; seed < 200; seed++) {
    const p = plan.planCrater(impact, 'Up', seed, probeFrom(cells));
    assert.ok([...p.air, ...p.sculk].every((c) => c.x <= 0), `seed ${seed}: a cell at x ≥ 1 is planned`);
  }
});

test('r003: a side hit carves into the face hit, not down', () => {
  const impact = { x: 5, y: 70, z: 20 };
  const p = plan.planCrater(impact, 'North', 99, probeFrom(slab(impact, 'North')));
  assert.ok(p.air.length >= 12);
  assert.ok(p.air.every((c) => c.z >= 20 && c.z <= 22 && Math.abs(c.y - 70) <= 2 && Math.abs(c.x - 5) <= 2), 'a cell outside the face box');
  assert.ok(p.sculk.every((c) => c.z >= 18 && c.z <= 23));
});

test('r004: sculk only on a solid cell with air or a passable block outside it; never under water or on an `other` block', () => {
  const impact = { x: 0, y: 64, z: 0 };
  const cells = slab(impact, 'Up');
  const air = new Set(plan.craterCells(impact, 'Up', 3, probeFrom(cells)).map(key));
  const shallow = plan.sculkColumns(3).find(({ u, v }) => !air.has(key(plan.cellAt(impact, 'Up', u, v, 0))));
  assert.ok(shallow !== undefined, 'seed 3 leaves a rim column with sculk');
  const rim = plan.cellAt(impact, 'Up', shallow.u, shallow.v, 0);
  const over = { ...rim, y: rim.y + 1 };
  const with_ = (kinds) => plan.planCrater(impact, 'Up', 3, probeFrom(new Map([...cells, ...kinds]))).sculk.map(key);
  assert.ok(with_([]).includes(key(rim)), 'control: the bare rim cell gets sculk');
  assert.ok(with_([[key(over), 'passable']]).includes(key(rim)), 'a flower on it does not stop it');
  assert.ok(!with_([[key(over), 'liquid']]).includes(key(rim)), 'under water');
  assert.ok(!with_([[key(rim), 'other']]).includes(key(rim)), 'an `other` block');
  assert.ok(!with_([[key(over), 'solid']]).includes(key(rim)), 'a covered cell');
});

// ---------------------------------------------------------------- carve.ts on the in-memory engine

function makeWorld(fill) {
  const grid = new Map(fill);
  const dim = {
    id: 'minecraft:overworld',
    heightRange: { min: -64, max: 320 },
    writes: [],
    getBlock(at) {
      const k = key(at);
      const typeId = grid.get(k) ?? 'minecraft:air';
      if (typeId === 'unloaded') return undefined;
      return {
        typeId,
        location: { ...at },
        isAir: typeId === 'minecraft:air',
        isLiquid: typeId === 'minecraft:water',
        getComponent: (c) => (c === 'minecraft:inventory' && typeId === 'minecraft:chest' ? { container: {} } : undefined),
        isLiquidBlocking: () => typeId !== 'minecraft:poppy',
        canContainLiquid: () => typeId === 'minecraft:chest' || typeId === 'minecraft:oak_slab',
        setType(t) {
          grid.set(k, t);
          dim.writes.push({ tick: mc.tick, at: k, type: t });
        },
      };
    },
    spawnParticle() {},
  };
  return { grid, dim };
}

function stoneSlab(impact) {
  const fill = [];
  for (let x = -3; x <= 3; x++) for (let z = -3; z <= 3; z++) for (let y = -4; y <= 0; y++) fill.push([key({ x: impact.x + x, y: impact.y + y, z: impact.z + z }), 'minecraft:stone']);
  return fill;
}

function tick(n = 1) {
  for (let i = 0; i < n; i++) {
    mc.tick++;
    for (const fn of [...mc.intervals.values()]) fn();
  }
}

const reports = [];
carve.observeCarves((r) => reports.push(r));
carve.registerCarve();

test('ad04: one bolt lands in its hit tick, protect first; no interval is left behind', () => {
  protect.calls.length = 0;
  reports.length = 0;
  const impact = { x: 0, y: 64, z: 0 };
  const { dim, grid } = makeWorld(stoneSlab(impact));
  const r = carve.carveBlockHit('b1', dim, impact, 'Up', 42);
  assert.equal(reports.length, 1, 'finished in the hit tick');
  assert.equal(r.carved.length, r.plan.air.length);
  assert.equal(r.sculked.length, r.plan.sculk.length);
  assert.ok(r.sculked.length >= 8);
  assert.ok(dim.writes.every((w) => w.tick === mc.tick));
  assert.equal(protect.calls.length, 1);
  assert.equal(protect.calls[0].writesBefore, 0, 'protect ran before the first write');
  assert.deepEqual(protect.calls[0].box, { min: r.plan.box.min, max: { ...r.plan.box.max, y: r.plan.box.max.y + 1 } }, 'the zone is the box and the layer above it');
  assert.equal(mc.intervals.size, 0, 'no periodic work');
  const firstSculk = dim.writes.findIndex((w) => w.type === carve.SCULK);
  assert.ok(dim.writes.slice(0, firstSculk).every((w) => w.type === 'minecraft:air'), 'crater cells before sculk cells');
  for (const c of r.carved) assert.equal(grid.get(key(c)), 'minecraft:air');
  for (const c of r.sculked) assert.equal(grid.get(key(c)), carve.SCULK);
});

test('ad04: eight bolts in one tick drain FIFO at CARVE_BUDGET_PER_TICK cells a tick on one interval, protect every writing tick', () => {
  protect.calls.length = 0;
  reports.length = 0;
  const fill = [];
  const impacts = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ x: i * 20, y: 64, z: 0 }));
  for (const impact of impacts) fill.push(...stoneSlab(impact));
  const { dim } = makeWorld(fill);
  const startsBefore = mc.intervalCalls;
  const jobs = impacts.map((impact, i) => carve.carveBlockHit(`m${i}`, dim, impact, 'Up', 1000 + i));
  const total = jobs.reduce((n, j) => n + j.plan.air.length + j.plan.sculk.length, 0);
  assert.ok(total > carve.CARVE_BUDGET_PER_TICK, `${total} cells fit one tick; the test needs more`);
  const hitTick = mc.tick;
  assert.ok(carve.pendingCarves() > 0 && mc.intervals.size === 1, 'the rest waits on the interval');
  for (let t = 0; t < 10 && carve.pendingCarves() > 0; t++) tick();
  assert.equal(carve.pendingCarves(), 0);
  tick();
  assert.equal(mc.intervals.size, 0, 'the interval ends with the queue');
  assert.equal(mc.intervalCalls - startsBefore, 1, 'one interval');
  const perTick = new Map();
  for (const w of dim.writes) perTick.set(w.tick, (perTick.get(w.tick) ?? 0) + 1);
  assert.ok([...perTick.values()].every((n) => n <= carve.CARVE_BUDGET_PER_TICK), `writes per tick ${[...perTick.values()]}`);
  assert.ok(perTick.get(hitTick) > 0, 'the hit tick already writes');
  assert.deepEqual(reports.map((r) => r.boltId), ['m0', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'], 'FIFO');
  for (const r of reports) {
    assert.equal(r.carved.length, r.plan.air.length, r.boltId);
    assert.equal(r.sculked.length, r.plan.sculk.length, r.boltId);
    const ticks = new Set(dim.writes.filter((w) => r.plan.air.concat(r.plan.sculk).some((c) => key(c) === w.at)).map((w) => w.tick));
    for (const t of ticks) assert.ok(protect.calls.some((c) => c.tick === t && c.reason.includes(r.boltId)), `${r.boltId}: tick ${t} wrote with no protect`);
  }
});

test('p005: a cell that changed after the plan is re-checked at write time — new bedrock stays, a covered cell gets no sculk', () => {
  reports.length = 0;
  const impact = { x: 200, y: 64, z: 0 };
  const fillers = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({ ...impact, x: impact.x + 20 * i }));
  const fill = stoneSlab(impact);
  for (const f of fillers) fill.push(...stoneSlab(f));
  const { dim, grid } = makeWorld(fill);
  // The fillers spend the hit tick's budget, so the last job is planned now and written a tick later.
  fillers.forEach((f, i) => carve.carveBlockHit(`q${i}`, dim, f, 'Up', 5 + i));
  const third = carve.carveBlockHit('q-last', dim, impact, 'Up', 7);
  assert.equal(third.carved.length + third.sculked.length, 0, 'the last job wrote in the hit tick: the re-check is not observed');
  const victim = third.plan.air.find((c) => c.y === 63);
  grid.set(key(victim), 'minecraft:bedrock');
  const planned = new Set(third.plan.air.map(key));
  // A rim cell: what covers it is not planned, so the crater does not open it again before the sculk write.
  const sculkCell = third.plan.sculk.find((c) => (c.x !== victim.x || c.z !== victim.z) && !planned.has(key({ ...c, y: c.y + 1 })));
  grid.set(key({ ...sculkCell, y: sculkCell.y + 1 }), 'minecraft:stone');
  for (let t = 0; t < 5 && carve.pendingCarves() > 0; t++) tick();
  const r = reports.find((x) => x.boltId === 'q-last');
  assert.equal(grid.get(key(victim)), 'minecraft:bedrock');
  assert.ok(!r.carved.some((c) => key(c) === key(victim)));
  assert.notEqual(grid.get(key(sculkCell)), carve.SCULK);
  assert.ok(r.skipped >= 2);
});

test('lgnd refuses the box: nothing is moved, so holder cells stay and the rest is carved', () => {
  reports.length = 0;
  protect.refuse = true;
  try {
    const impact = { x: 400, y: 64, z: 0 };
    const fill = stoneSlab(impact);
    const { dim, grid } = makeWorld([...fill, ['400,63,0', 'minecraft:chest'], ['400,64,0', 'minecraft:stone']]);
    const r = carve.carveBlockHit('h1', dim, impact, 'Up', 11);
    assert.ok(r.plan.air.some((c) => key(c) === '400,63,0'), 'the chest cell is planned');
    assert.equal(grid.get('400,63,0'), 'minecraft:chest');
    assert.equal(r.keptHolders, 1);
    assert.equal(r.protectErrors.length, 1);
    assert.equal(r.carved.length, r.plan.air.length - 1);
  } finally {
    protect.refuse = false;
  }
});

test('the classifier: stone solid, poppy passable, slab and chest other, bedrock keep, water liquid, unloaded unloaded', () => {
  const { dim } = makeWorld([
    ['0,0,0', 'minecraft:stone'],
    ['1,0,0', 'minecraft:poppy'],
    ['2,0,0', 'minecraft:oak_slab'],
    ['3,0,0', 'minecraft:chest'],
    ['4,0,0', 'minecraft:bedrock'],
    ['5,0,0', 'minecraft:water'],
    ['6,0,0', 'unloaded'],
    ['8,0,0', 'minecraft:mob_spawner'],
  ]);
  const kinds = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((x) => carve.kindOf(dim.getBlock({ x, y: 0, z: 0 })));
  assert.deepEqual(kinds, ['solid', 'passable', 'other', 'other', 'keep', 'liquid', 'unloaded', 'air', 'other']);
});

test.after(() => {
  console.warn = realWarn;
});
