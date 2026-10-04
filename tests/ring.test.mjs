// The RMB effect (L0-ring-p002, p003, ad01–ad04, r007, r010, cons RG-1/RG-2/RG-5)
// against a fake engine: every block read, every createExplosion, every
// doTileDrops write and every call to lgnd's protectLegendariesIn — which the
// test replaces, so a protection that throws can be staged.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const engineStub = `
export const LocationInUnloadedChunkError = globalThis.__ring.Unloaded;
export const system = globalThis.__ring.system;
export const world = globalThis.__ring.world;
export const BlockTypes = { get: (id) => ({ id }) };
export class BlockVolume {
  constructor(from, to) {
    this.from = from;
    this.to = to;
  }
}
`;
const recoveryStub = `
export const HOLDER_TYPES = ["minecraft:chest", "minecraft:barrel", "minecraft:frame", "minecraft:crafter"];
export function protectLegendariesIn(dim, volume, opts) { return globalThis.__ring.protect(dim, volume, opts); }
export function isLegendaryItemEntity(entity) { return entity.legendary === true; }
`;
const activationStub = `export function observeAttacks(cb) { globalThis.__ring.attackObservers.push(cb); return () => {}; }`;
const flightStub = `
export function activeAttacks() { return globalThis.__ring.active; }
export function observeChargeEnds(cb) { globalThis.__ring.endObservers.push(cb); return () => {}; }
`;

class Unloaded extends Error {}

/** Every engine-visible effect, in order, with the tick and the rule's value at that moment. */
const events = [];

const rules = { doTileDrops: true, throwOnWrite: false };
const fake = {
  Unloaded,
  attackObservers: [],
  endObservers: [],
  active: new Map(),
  entities: new Map(),
  system: {
    currentTick: 1000,
    nextId: 1,
    intervals: new Map(),
    runInterval(cb) {
      const id = this.nextId++;
      this.intervals.set(id, cb);
      return id;
    },
    clearRun(id) {
      this.intervals.delete(id);
    },
  },
  world: {
    gameRules: {
      get doTileDrops() {
        return rules.doTileDrops;
      },
      set doTileDrops(v) {
        if (rules.throwOnWrite) throw new Error('gamerule write refused');
        events.push({ kind: 'rule', value: v, tick: fake.system.currentTick });
        rules.doTileDrops = v;
      },
    },
    getEntity: (id) => fake.entities.get(id),
  },
  protect: (dim, volume, opts) => {
    events.push({ kind: 'protect', dim: dim.id, volume, opts, rule: rules.doTileDrops, tick: fake.system.currentTick });
    return { moved: 0, handedBack: 0 };
  },
};
globalThis.__ring = fake;

const plugin = {
  name: 'ring-stubs',
  setup(b) {
    b.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: 'server', namespace: 'stub' }));
    b.onResolve({ filter: /legendary\/recovery$/ }, () => ({ path: 'recovery', namespace: 'stub' }));
    b.onResolve({ filter: /^\.\/activation$/ }, () => ({ path: 'activation', namespace: 'stub' }));
    b.onResolve({ filter: /^\.\/flight$/ }, () => ({ path: 'flight', namespace: 'stub' }));
    const stubs = { server: engineStub, recovery: recoveryStub, activation: activationStub, flight: flightStub };
    b.onLoad({ filter: /.*/, namespace: 'stub' }, (args) => ({ contents: stubs[args.path], loader: 'js' }));
  },
};

const bundle = await build({
  stdin: {
    contents: "export * from './src/orbital/ring.ts'; export { effectFor } from './src/orbital/charge.ts'; export { RING_LAYOUT, layout } from './src/orbital/ring-layout.ts';",
    resolveDir: projectRoot,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  plugins: [plugin],
});
const mod = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64'));
const {
  RING_EFFECT,
  RING_MAX_BLASTS_PER_TICK,
  BLAST_POWER,
  RING_MIN_RANGE,
  PROTECT_MARGIN,
  MAX_QUEUE_AGE_TICKS,
  CONTAINER_FALLBACK,
  registerRing,
  observeRingReports,
  ringLoop,
  blastCentre,
  isUnderwaterCell,
  effectFor,
  RING_LAYOUT,
  layout,
} = mod;

registerRing();

// ------------------------------------------------------------------ fake world

const key = (x, y, z) => `${x},${y},${z}`;

/**
 * A dimension of stone at and below `surface`, air above, with overrides.
 * Blocks carry what isContact and isUnderwaterCell read.
 */
function dimension({ id = 'minecraft:overworld', surface = 64, unloaded = () => false, throwsUnloaded = () => false, explodeThrows = () => false, onExplode = () => {} } = {}) {
  const cells = new Map();
  const dim = {
    id,
    explosions: [],
    heightRange: { min: -64, max: 320 },
    /** Item entities lying in the world: {id, x, y, z, typeId, amount, legendary, removed}. */
    items: [],
    removals: [],
    queries: [],
    spawnItem(typeId, amount, at, extra = {}) {
      const item = {
        id: `item${dim.items.length}`,
        typeId: 'minecraft:item',
        isValid: true,
        location: at,
        stack: { typeId, amount },
        ...extra,
        getComponent: (c) => (c === 'minecraft:item' ? { itemStack: item.stack } : undefined),
        remove() {
          item.isValid = false;
          dim.removals.push(item);
        },
      };
      dim.items.push(item);
      return item;
    },
    getEntities({ type, location, volume }) {
      return dim.items.filter(
        (e) => e.isValid && e.typeId === type &&
          Math.floor(e.location.x) >= location.x && Math.floor(e.location.x) <= location.x + volume.x &&
          Math.floor(e.location.y) >= location.y && Math.floor(e.location.y) <= location.y + volume.y &&
          Math.floor(e.location.z) >= location.z && Math.floor(e.location.z) <= location.z + volume.z
      );
    },
    getBlocks(query, filter) {
      dim.queries.push({ query, filter });
      const out = [];
      for (const [k, c] of cells) {
        const [x, y, z] = k.split(',').map(Number);
        const { from, to } = query;
        if (x < from.x || x > to.x || y < from.y || y > to.y || z < from.z || z > to.z) continue;
        if (filter.includeTypes.includes(c.typeId)) out.push({ x, y, z });
      }
      return { getBlockLocationIterator: () => out[Symbol.iterator]() };
    },
    set(x, y, z, typeId, { waterlogged = false, slots } = {}) {
      cells.set(key(x, y, z), { typeId, waterlogged, slots });
    },
    getBlock({ x, y, z }) {
      if (throwsUnloaded(x, y, z)) throw new Unloaded(`unloaded ${key(x, y, z)}`);
      if (unloaded(x, y, z)) return undefined;
      const c = cells.get(key(x, y, z)) ?? { typeId: y <= surface ? 'minecraft:stone' : 'minecraft:air', waterlogged: false };
      const liquid = ['minecraft:water', 'minecraft:flowing_water', 'minecraft:lava', 'minecraft:flowing_lava'].includes(c.typeId);
      const container = c.slots === undefined ? undefined : { size: c.slots.length, getItem: (i) => c.slots[i] };
      return {
        typeId: c.typeId,
        isAir: c.typeId === 'minecraft:air',
        isLiquid: liquid,
        isWaterlogged: c.waterlogged,
        permutation: { getState: () => undefined },
        getComponent: (name) => (name === 'minecraft:inventory' && container !== undefined ? { container } : undefined),
      };
    },
    createExplosion(location, radius, options) {
      const call = { location, radius, options, rule: rules.doTileDrops, tick: fake.system.currentTick };
      events.push({ kind: 'explode', dim: id, ...call });
      if (explodeThrows(location)) throw new Error(`engine refused the explosion at ${key(location.x, location.y, location.z)}`);
      dim.explosions.push(call);
      onExplode(dim, location, options);
      return true;
    },
  };
  return dim;
}

/** Lets the microtasks queued so far run: the rest of "this tick". */
const settle = () => new Promise((resolve) => setImmediate(resolve));

/** Next tick: every live interval once, then its microtasks. */
async function tick(n = 1) {
  for (let i = 0; i < n; i++) {
    fake.system.currentTick++;
    for (const cb of [...fake.system.intervals.values()]) cb();
    await settle();
  }
}

/** Ticks until the queue is empty and its interval gone. */
async function drainAll(limit = 50) {
  await settle();
  for (let i = 0; i < limit && (ringLoop().running || ringLoop().queued > 0); i++) await tick();
}

/** Leaves nothing queued from an earlier test and starts a fresh tick, so the per-tick cap starts at zero. */
async function reset() {
  await drainAll();
  fake.system.currentTick++;
  events.length = 0;
  rules.doTileDrops = true;
  rules.throwOnWrite = false;
  fake.active.clear();
  fake.entities.clear();
  fake.protect = (dim, volume, opts) => {
    events.push({ kind: 'protect', dim: dim.id, volume, opts, rule: rules.doTileDrops, tick: fake.system.currentTick });
    return { moved: 0, handedBack: 0 };
  };
}

let seq = 0;
const newId = () => `oc-${fake.system.currentTick}-${++seq}`;

/** What activation does before any charge detonates: tells the effect the target. */
function commit(attackId, target, mode = 'rmb') {
  for (const cb of fake.attackObservers) cb({ attackId, mode, target });
}

function watch() {
  const reports = [];
  const stop = observeRingReports((r) => reports.push(r));
  return { reports, stop };
}

function detonateAll(dim, attackId, target, ownerId = 'owner') {
  const cols = layout(target);
  for (const c of cols) RING_EFFECT.onDetonate(dim, { x: c.x, y: target.y, z: c.z }, ownerId, 'rmb', attackId);
  return cols;
}

// ------------------------------------------------------------------ registration

test('registerRing puts the ring effect on RMB: the five-ring layout, normal TNT scale (L0-ring-r001)', () => {
  assert.equal(effectFor('rmb'), RING_EFFECT);
  const target = { x: 100, y: 64, z: -40 };
  const cols = RING_EFFECT.layout(target);
  assert.equal(cols.length, RING_LAYOUT.count);
  assert.deepEqual(cols, layout(target));
  assert.equal(RING_EFFECT.scale, 0);
  assert.equal(RING_MAX_BLASTS_PER_TICK, 48);
  assert.equal(BLAST_POWER, 4);
  // The rings refuse a nearer target: at 7 blocks the shooter already stands
  // 3.5 from the d=7 ring, whose power-4 cells reach 8.
  assert.equal(RING_MIN_RANGE, 5);
  assert.equal(RING_EFFECT.minRange, RING_MIN_RANGE);
  // The protection margin must cover the strongest ring, not the weakest.
  assert.equal(PROTECT_MARGIN, 8);
  assert.equal(MAX_QUEUE_AGE_TICKS, 200);
  assert.equal(CONTAINER_FALLBACK, true, 'as02 measured: doTileDrops=false does not stop a container spilling');
});

test('every blast explodes at its own ring power, not one power for all', async () => {
  await reset();
  const dim = dimension();
  const attackId = newId();
  const target = { x: 0, y: 64, z: 0 };
  commit(attackId, target);
  const cols = detonateAll(dim, attackId, target);
  await drainAll();
  assert.equal(dim.explosions.length, cols.length);

  const byPower = new Map();
  for (const e of dim.explosions) byPower.set(e.radius, (byPower.get(e.radius) ?? 0) + 1);
  // centre 1 + d=7 20 at power 4; d=14 40 at 2; d=21 60 and d=28 80 at 1.
  assert.deepStrictEqual([...byPower.entries()].sort((a, b) => b[0] - a[0]), [[4, 21], [2, 40], [1, 140]]);

  for (const e of dim.explosions) {
    const col = cols.find((c) => Math.floor(e.location.x) === c.x && Math.floor(e.location.z) === c.z);
    assert.notEqual(col, undefined, `a blast at ${e.location.x},${e.location.z} stands on no column`);
    assert.equal(e.radius, col.power, `blast at ${e.location.x},${e.location.z}`);
  }
});

test('a contact the layout does not hold explodes at the strongest power', async () => {
  await reset();
  const dim = dimension();
  const attackId = newId();
  commit(attackId, { x: 0, y: 64, z: 0 });
  // 5 blocks out is between the d=7 and d=14 rings: no column, no power of its own.
  RING_EFFECT.onDetonate(dim, { x: 5, y: 64, z: 0 }, 'owner', 'rmb', attackId);
  // And an attack nobody registered: the target is unknown.
  const orphan = newId();
  RING_EFFECT.onDetonate(dim, { x: 0, y: 64, z: 0 }, 'owner', 'rmb', orphan);
  await drainAll();
  assert.deepStrictEqual(dim.explosions.map((e) => e.radius), [BLAST_POWER, BLAST_POWER]);
});

// ------------------------------------------------------------------ AC#10 — r010 centre, r007 underwater

test('blastCentre: the middle of the cell above the contact, or of the contact itself under a solid (r010)', () => {
  const p = { x: 7, y: 64, z: -3 };
  const probe = (typeId) => ({ typeId, isAir: typeId === 'minecraft:air', isLiquid: typeId.includes('water') || typeId.includes('lava'), permutation: { getState: () => undefined } });
  assert.deepEqual(blastCentre(p, probe('minecraft:air')), { x: 7.5, y: 65.5, z: -2.5 });
  assert.deepEqual(blastCentre(p, probe('minecraft:water')), { x: 7.5, y: 65.5, z: -2.5 }, 'a liquid above is not solid');
  assert.deepEqual(blastCentre(p, probe('minecraft:short_grass')), { x: 7.5, y: 65.5, z: -2.5 }, 'a pass-through plant is not solid');
  assert.deepEqual(blastCentre(p, undefined), { x: 7.5, y: 65.5, z: -2.5 }, 'nothing readable above (world top) is not solid');
  assert.deepEqual(blastCentre(p, probe('minecraft:stone')), { x: 7.5, y: 64.5, z: -2.5 });
  assert.deepEqual(blastCentre(p, probe('minecraft:oak_leaves')), { x: 7.5, y: 64.5, z: -2.5 }, 'leaves are contact blocks for orbc, so solid here');
});

test('isUnderwaterCell: water, flowing water and waterlogged count; lava, bubble columns and cauldrons do not (r007)', () => {
  assert.equal(isUnderwaterCell({ typeId: 'minecraft:water', isWaterlogged: false }), true);
  assert.equal(isUnderwaterCell({ typeId: 'minecraft:flowing_water', isWaterlogged: false }), true);
  assert.equal(isUnderwaterCell({ typeId: 'minecraft:oak_stairs', isWaterlogged: true }), true);
  for (const id of ['minecraft:lava', 'minecraft:flowing_lava', 'minecraft:bubble_column', 'minecraft:cauldron', 'minecraft:air', 'minecraft:stone']) {
    assert.equal(isUnderwaterCell({ typeId: id, isWaterlogged: false }), false, id);
  }
  assert.equal(isUnderwaterCell(undefined), false);
});

test('each blast: centre from the contact cell, underwater read from the centre cell only, TNT flags (r007, r010, ad03)', async () => {
  await reset();
  const dim = dimension();
  const cases = [
    { name: 'air above', p: { x: 0, y: 64, z: 0 }, centre: { x: 0.5, y: 65.5, z: 0.5 }, underwater: false },
    { name: 'water above', p: { x: 10, y: 64, z: 0 }, above: 'minecraft:water', centre: { x: 10.5, y: 65.5, z: 0.5 }, underwater: true },
    { name: 'flowing water above', p: { x: 20, y: 64, z: 0 }, above: 'minecraft:flowing_water', centre: { x: 20.5, y: 65.5, z: 0.5 }, underwater: true },
    { name: 'lava above', p: { x: 30, y: 64, z: 0 }, above: 'minecraft:lava', centre: { x: 30.5, y: 65.5, z: 0.5 }, underwater: false },
    { name: 'waterlogged contact, air above: the centre cell is dry', p: { x: 40, y: 64, z: 0 }, here: ['minecraft:oak_stairs', true], centre: { x: 40.5, y: 65.5, z: 0.5 }, underwater: false },
    { name: 'buried: stone above, dry contact', p: { x: 50, y: 64, z: 0 }, above: 'minecraft:stone', centre: { x: 50.5, y: 64.5, z: 0.5 }, underwater: false },
    { name: 'buried in a waterlogged contact', p: { x: 60, y: 64, z: 0 }, above: 'minecraft:stone', here: ['minecraft:oak_stairs', true], centre: { x: 60.5, y: 64.5, z: 0.5 }, underwater: true },
    { name: 'water above a buried contact is not read', p: { x: 70, y: 64, z: 0 }, above: 'minecraft:stone', twoUp: 'minecraft:water', centre: { x: 70.5, y: 64.5, z: 0.5 }, underwater: false },
  ];
  const attackId = newId();
  for (const c of cases) {
    if (c.here) dim.set(c.p.x, c.p.y, c.p.z, c.here[0], { waterlogged: c.here[1] });
    if (c.above) dim.set(c.p.x, c.p.y + 1, c.p.z, c.above);
    if (c.twoUp) dim.set(c.p.x, c.p.y + 2, c.p.z, c.twoUp);
    RING_EFFECT.onDetonate(dim, c.p, 'owner', 'rmb', attackId);
  }
  await drainAll();
  assert.equal(dim.explosions.length, cases.length);
  cases.forEach((c, i) => {
    const e = dim.explosions[i];
    assert.deepEqual(e.location, c.centre, c.name);
    assert.equal(e.radius, 4, c.name);
    assert.deepEqual(
      { breaksBlocks: e.options.breaksBlocks, allowUnderwater: e.options.allowUnderwater, causesFire: e.options.causesFire },
      { breaksBlocks: !c.underwater, allowUnderwater: true, causesFire: false },
      c.name
    );
  });
});

// ------------------------------------------------------------------ AC#9 — RG-5: the rule always comes back, a failed protection explodes nothing

test('a throwing createExplosion is logged and skipped; the rest explode; doTileDrops comes back in the same call (RG-5)', async () => {
  await reset();
  const target = { x: 0, y: 64, z: 0 };
  // The centre and the outermost column: one failure in the first drain step, one in the last.
  const throwers = [layout(target)[0], layout(target).at(-1)];
  const bad = new Set(throwers.map((c) => key(c.x + 0.5, 65.5, c.z + 0.5)));
  const dim = dimension({ explodeThrows: (l) => bad.has(key(l.x, l.y, l.z)) });
  const { reports, stop } = watch();
  const attackId = newId();
  commit(attackId, target);
  const cols = detonateAll(dim, attackId, target);
  assert.equal(events.length, 0, 'onDetonate only queues: no engine call, no rule write inside it');
  const tick0 = fake.system.currentTick;
  await settle();
  // Everything the first drain did happened in the contact tick, and the rule is back already.
  const first = events.filter((e) => e.tick === tick0);
  assert.equal(first[0].kind, 'protect', 'protection runs before the window opens');
  assert.equal(first[0].rule, true, 'protection runs with drops on (frames spill: L0-adr-oprt §3)');
  assert.deepEqual(first[1], { kind: 'rule', value: false, tick: tick0 });
  assert.deepEqual(first[first.length - 1], { kind: 'rule', value: true, tick: tick0 });
  const inWindow = first.slice(2, -1);
  assert.equal(inWindow.length, RING_MAX_BLASTS_PER_TICK);
  assert.ok(inWindow.every((e) => e.kind === 'explode' && e.rule === false), 'every explosion call ran inside the window');
  assert.equal(rules.doTileDrops, true, 'restored before the drain returned');
  await drainAll();
  stop();
  assert.equal(rules.doTileDrops, true);
  const r = reports.find((x) => x.attackId === attackId);
  assert.equal(r.charges, cols.length);
  assert.equal(r.failed, 2);
  assert.equal(r.blasts, cols.length - 2);
  assert.equal(r.lost, 0);
  const writes = events.filter((e) => e.kind === 'rule').map((e) => e.value);
  const steps = events.filter((e) => e.kind === 'protect').length;
  assert.deepEqual(writes, Array.from({ length: steps }, () => [false, true]).flat(), 'one false/true pair per step, never left false');
});

test('a throwing protection explodes nothing in its step, writes no rule, removes no legendary; the step is lost (RG-5, C-15 rank 1)', async () => {
  await reset();
  const legendary = { id: 'ws-item', typeId: 'minecraft:item', removed: 0, remove() { this.removed++; } };
  fake.entities.set(legendary.id, legendary);
  let calls = 0;
  fake.protect = (dim, volume, opts) => {
    calls++;
    events.push({ kind: 'protect', dim: dim.id, volume, opts, rule: rules.doTileDrops, tick: fake.system.currentTick });
    if (calls === 1) throw new Error('legendary protect: a crafter has no script-readable inventory');
    return { moved: 0, handedBack: 0 };
  };
  const dim = dimension();
  const { reports, stop } = watch();
  const attackId = newId();
  const target = { x: 0, y: 64, z: 0 };
  commit(attackId, target);
  const cols = detonateAll(dim, attackId, target);
  const tick0 = fake.system.currentTick;
  await settle();
  const first = events.filter((e) => e.tick === tick0);
  assert.deepEqual(first.map((e) => e.kind), ['protect'], 'nothing after the throw in that step: no rule write, no explosion');
  assert.equal(rules.doTileDrops, true);
  await drainAll();
  stop();
  const r = reports.find((x) => x.attackId === attackId);
  assert.equal(r.lost, RING_MAX_BLASTS_PER_TICK, 'the whole first step is lost');
  assert.equal(r.blasts, cols.length - RING_MAX_BLASTS_PER_TICK, 'later steps go on');
  assert.equal(legendary.removed, 0);
  assert.equal(rules.doTileDrops, true);
});

test('a gamerule write that throws explodes nothing and leaves the rule as it was (RG-5)', async () => {
  await reset();
  rules.throwOnWrite = true;
  const dim = dimension();
  const { reports, stop } = watch();
  const attackId = newId();
  RING_EFFECT.onDetonate(dim, { x: 0, y: 64, z: 0 }, 'owner', 'rmb', attackId);
  await drainAll();
  stop();
  assert.equal(dim.explosions.length, 0);
  assert.equal(rules.doTileDrops, true);
  const r = reports.find((x) => x.attackId === attackId);
  assert.equal(r.lost, 1);
  assert.equal(r.blasts, 0);
});

test('doTileDrops initially false: never written, stays false, blasts still happen (ad01, ent3)', async () => {
  await reset();
  rules.doTileDrops = false;
  const dim = dimension();
  const attackId = newId();
  const target = { x: 0, y: 64, z: 0 };
  const cols = detonateAll(dim, attackId, target);
  await drainAll();
  assert.equal(events.filter((e) => e.kind === 'rule').length, 0);
  assert.equal(rules.doTileDrops, false);
  assert.equal(dim.explosions.length, cols.length);
});

test('an empty drain opens no window: no rule write without an explosion in it (ent3)', async () => {
  await reset();
  const dim = dimension({ unloaded: () => true });
  const attackId = newId();
  RING_EFFECT.onDetonate(dim, { x: 0, y: 64, z: 0 }, 'owner', 'rmb', attackId);
  await drainAll();
  assert.equal(events.filter((e) => e.kind === 'rule' || e.kind === 'protect').length, 0);
});

// ------------------------------------------------------------------ p003 / ad02 — the queue, RG-1, RG-2

test('one flat-ground attack: the contact tick explodes 48, then 48 a tick; 5 ticks; the interval goes when the queue empties (RG-1, RG-2, C-5a′)', async () => {
  await reset();
  const dim = dimension();
  const { reports, stop } = watch();
  const attackId = newId();
  const target = { x: 0, y: 64, z: 0 };
  commit(attackId, target);
  const start = fake.system.currentTick;
  const startsBefore = ringLoop().starts;
  const cols = detonateAll(dim, attackId, target);
  assert.equal(ringLoop().queued, cols.length, 'queued and returned');
  await settle();
  assert.equal(dim.explosions.filter((e) => e.tick === start).length, RING_MAX_BLASTS_PER_TICK, 'the first drain runs in the contact tick');
  assert.equal(ringLoop().running, true);
  await drainAll();
  stop();
  const perTick = new Map();
  for (const e of dim.explosions) perTick.set(e.tick, (perTick.get(e.tick) ?? 0) + 1);
  const expectTicks = Math.ceil(cols.length / RING_MAX_BLASTS_PER_TICK);
  assert.equal(perTick.size, expectTicks);
  assert.ok([...perTick.values()].every((n) => n <= RING_MAX_BLASTS_PER_TICK));
  assert.equal(ringLoop().running, false, 'no idle loop');
  assert.equal(ringLoop().starts, startsBefore + 1);
  const r = reports.find((x) => x.attackId === attackId);
  assert.equal(r.charges, cols.length);
  assert.equal(r.blasts, cols.length);
  assert.equal(r.maxBlastsInTick, RING_MAX_BLASTS_PER_TICK);
  assert.equal(r.ticksToDrain, expectTicks);
  assert.ok(r.ticksToDrain <= 5, `RG-2: ${r.ticksToDrain} ticks for one attack`);
  assert.equal(r.maxQueueTicks, expectTicks - 1);
  assert.deepEqual(r.blastsByTick.reduce((a, b) => a + b, 0), cols.length);
  assert.equal(r.itemsSuppressed, 0);
  assert.equal(r.protectCalls, expectTicks, 'one protection per step');
});

test('three attacks in one tick: FIFO across attacks, ≤ 48 a tick, drained in ≤ 13 ticks (RG-1, RG-2)', async () => {
  await reset();
  const dim = dimension();
  const { reports, stop } = watch();
  const ids = [newId(), newId(), newId()];
  const targets = [{ x: 0, y: 64, z: 0 }, { x: 16, y: 64, z: 0 }, { x: 32, y: 64, z: 0 }];
  ids.forEach((id, i) => commit(id, targets[i]));
  const order = [];
  ids.forEach((id, i) => {
    for (const c of layout(targets[i])) {
      order.push(`${c.x + 0.5},${c.z + 0.5}`);
      RING_EFFECT.onDetonate(dim, { x: c.x, y: 64, z: c.z }, `owner${i}`, 'rmb', id);
    }
  });
  await drainAll();
  stop();
  assert.deepEqual(dim.explosions.map((e) => `${e.location.x},${e.location.z}`), order, 'FIFO: a later attack never jumps an earlier one');
  const perTick = new Map();
  for (const e of dim.explosions) perTick.set(e.tick, (perTick.get(e.tick) ?? 0) + 1);
  assert.ok([...perTick.values()].every((n) => n <= RING_MAX_BLASTS_PER_TICK));
  assert.ok(perTick.size <= 13, `${perTick.size} ticks for three attacks`);
  for (const id of ids) {
    const r = reports.find((x) => x.attackId === id);
    assert.equal(r.maxBlastsInTick, RING_MAX_BLASTS_PER_TICK, 'counted across every attack in the tick');
    assert.equal(r.blasts, RING_LAYOUT.count);
  }
  assert.ok(Math.max(...ids.map((id) => reports.find((x) => x.attackId === id).lastTick)) - Math.min(...ids.map((id) => reports.find((x) => x.attackId === id).firstTick)) + 1 <= 13);
});

test('the per-tick cap holds across the microtask drain and an interval drain in the same tick', async () => {
  await reset();
  const dim = dimension();
  const attackId = newId();
  for (let i = 0; i < 100; i++) RING_EFFECT.onDetonate(dim, { x: i, y: 64, z: 0 }, 'owner', 'rmb', attackId);
  await settle();
  const t = fake.system.currentTick;
  for (const cb of [...fake.system.intervals.values()]) cb();
  await settle();
  assert.equal(dim.explosions.filter((e) => e.tick === t).length, RING_MAX_BLASTS_PER_TICK);
  await drainAll();
  assert.equal(dim.explosions.length, 100);
});

test('a blast queued over 200 ticks is dropped and logged, not exploded (p003 step 5)', async () => {
  await reset();
  const dim = dimension();
  const { reports, stop } = watch();
  const attackId = newId();
  const warn = console.warn;
  const lines = [];
  console.warn = (...a) => lines.push(a.join(' '));
  try {
    for (let i = 0; i < RING_MAX_BLASTS_PER_TICK + 1; i++) RING_EFFECT.onDetonate(dim, { x: i, y: 64, z: 0 }, 'owner', 'rmb', attackId);
    await settle();
    fake.system.currentTick += MAX_QUEUE_AGE_TICKS + 5;
    await drainAll();
  } finally {
    console.warn = warn;
  }
  stop();
  assert.equal(dim.explosions.length, RING_MAX_BLASTS_PER_TICK);
  const r = reports.find((x) => x.attackId === attackId);
  assert.equal(r.lost, 1);
  assert.ok(lines.some((l) => l.includes('lost') && l.includes(`over ${MAX_QUEUE_AGE_TICKS}`)), lines.join('\n'));
  assert.equal(ringLoop().running, false);
});

test('a contact cell no longer loaded is dropped as lost, before protection (C-12, p002 step 1)', async () => {
  await reset();
  const dim = dimension({ unloaded: (x) => x === 1, throwsUnloaded: (x) => x === 2 });
  const { reports, stop } = watch();
  const attackId = newId();
  for (const x of [0, 1, 2, 3]) RING_EFFECT.onDetonate(dim, { x, y: 64, z: 0 }, 'owner', 'rmb', attackId);
  await drainAll();
  stop();
  assert.deepEqual(dim.explosions.map((e) => e.location.x), [0.5, 3.5]);
  const r = reports.find((x) => x.attackId === attackId);
  assert.equal(r.lost, 2);
  assert.equal(r.blasts, 2);
  const p = events.find((e) => e.kind === 'protect');
  assert.deepEqual(p.volume, { min: { x: -8, y: 57, z: -8 }, max: { x: 11, y: 73, z: 8 } }, 'the lost blasts are not in the protected volume');
});

// ------------------------------------------------------------------ r004 — source

test('no blast carries a source, whoever the owner is and wherever it stands: a source is spared its own blast (as03, r004)', async () => {
  await reset();
  const over = dimension({ id: 'minecraft:overworld' });
  fake.entities.set('here', { id: 'here', isValid: true, dimension: { id: 'minecraft:overworld' } });
  fake.entities.set('nether', { id: 'nether', isValid: true, dimension: { id: 'minecraft:nether' } });
  const { reports, stop } = watch();
  const attackId = newId();
  ['here', 'nether', 'gone', 'not an id'].forEach((o, i) => RING_EFFECT.onDetonate(over, { x: i * 3, y: 64, z: 0 }, o, 'rmb', attackId));
  await drainAll();
  stop();
  assert.equal(over.explosions.length, 4);
  for (const e of over.explosions) assert.equal('source' in e.options, false, 'no source key at all');
  const r = reports.find((x) => x.attackId === attackId);
  assert.deepEqual([r.blasts, r.lost, r.failed], [4, 0, 0]);
});

// ------------------------------------------------------------------ ad04 / r008 — protection

test('one protection per dimension per step: union of centres ± 8, avoid = the ring footprint ± 8, before any explosion (ad04, r008)', async () => {
  await reset();
  const dim = dimension();
  const attackId = newId();
  const target = { x: 100, y: 64, z: 200 };
  commit(attackId, target);
  const cols = layout(target).slice(0, 10);
  for (const c of cols) RING_EFFECT.onDetonate(dim, { x: c.x, y: 64, z: c.z }, 'owner', 'rmb', attackId);
  await drainAll();
  const calls = events.filter((e) => e.kind === 'protect');
  assert.equal(calls.length, 1);
  const xs = cols.map((c) => c.x);
  const zs = cols.map((c) => c.z);
  assert.deepEqual(calls[0].volume, {
    min: { x: Math.min(...xs) - 8, y: 65 - 8, z: Math.min(...zs) - 8 },
    max: { x: Math.max(...xs) + 8, y: 65 + 8, z: Math.max(...zs) + 8 },
  });
  const reach = Math.max(...RING_LAYOUT.columns.map((c) => Math.max(Math.abs(c.x), Math.abs(c.z))));
  assert.equal(reach, 14);
  const avoid = calls[0].opts.avoid;
  assert.ok(avoid.min.x <= target.x - reach - 8 && avoid.max.x >= target.x + reach + 8, `avoid x ${avoid.min.x}..${avoid.max.x}`);
  assert.ok(avoid.min.z <= target.z - reach - 8 && avoid.max.z >= target.z + reach + 8, `avoid z ${avoid.min.z}..${avoid.max.z}`);
  assert.match(calls[0].opts.reason, /^ring /);
  const firstExplode = events.findIndex((e) => e.kind === 'explode');
  assert.ok(events.findIndex((e) => e.kind === 'protect') < firstExplode);
});

test('blasts in two dimensions in one step get one protection each, and each dimension its own explosions', async () => {
  await reset();
  const over = dimension({ id: 'minecraft:overworld' });
  const nether = dimension({ id: 'minecraft:nether' });
  const a = newId();
  const b = newId();
  RING_EFFECT.onDetonate(over, { x: 0, y: 64, z: 0 }, 'owner', 'rmb', a);
  RING_EFFECT.onDetonate(nether, { x: 0, y: 64, z: 0 }, 'owner', 'rmb', b);
  RING_EFFECT.onDetonate(over, { x: 2, y: 64, z: 0 }, 'owner', 'rmb', a);
  await drainAll();
  assert.deepEqual(events.filter((e) => e.kind === 'protect').map((e) => e.dim).sort(), ['minecraft:nether', 'minecraft:overworld']);
  assert.equal(over.explosions.length, 2);
  assert.equal(nether.explosions.length, 1);
});

test('far-apart attacks in one step are protected separately, never as one box spanning both', async () => {
  await reset();
  const dim = dimension();
  const a = newId();
  const b = newId();
  RING_EFFECT.onDetonate(dim, { x: 0, y: 64, z: 0 }, 'owner', 'rmb', a);
  RING_EFFECT.onDetonate(dim, { x: 5000, y: 64, z: 0 }, 'owner', 'rmb', b);
  await drainAll();
  const calls = events.filter((e) => e.kind === 'protect');
  assert.equal(calls.length, 2);
  for (const c of calls) assert.ok(c.volume.max.x - c.volume.min.x === 16, JSON.stringify(c.volume));
});

test('moved and handed-back legendaries are credited to the attack report', async () => {
  await reset();
  fake.protect = (dim, volume, opts) => {
    events.push({ kind: 'protect', dim: dim.id, volume, opts, rule: rules.doTileDrops, tick: fake.system.currentTick });
    return { moved: 2, handedBack: 1 };
  };
  const dim = dimension();
  const { reports, stop } = watch();
  const attackId = newId();
  RING_EFFECT.onDetonate(dim, { x: 0, y: 64, z: 0 }, 'owner', 'rmb', attackId);
  await drainAll();
  stop();
  const r = reports.find((x) => x.attackId === attackId);
  assert.equal(r.legendariesMoved, 2);
  assert.equal(r.legendariesHandedBack, 1);
  assert.equal(r.protectCalls, 1);
});

// ------------------------------------------------------------------ as02 — the container fallback (measured: doTileDrops=false does not stop a container's spill)

/** An explosion that destroys a chest within 3 blocks of its centre and spills its slots there, as the engine does. */
function spillingDim(chests, extra = {}) {
  const dim = dimension({
    ...extra,
    onExplode: (d, at) => {
      for (const c of chests) {
        if (c.gone || Math.hypot(c.x + 0.5 - at.x, c.y + 0.5 - at.y, c.z + 0.5 - at.z) > 3) continue;
        c.gone = true;
        d.set(c.x, c.y, c.z, 'minecraft:air');
        for (const st of c.slots.filter(Boolean)) d.spawnItem(st.typeId, st.amount, { x: c.x + 0.3, y: c.y + 0.2, z: c.z + 0.6 });
      }
    },
  });
  for (const c of chests) dim.set(c.x, c.y, c.z, c.typeId ?? 'minecraft:chest', { slots: c.slots });
  return dim;
}

test('a destroyed container\'s spill is taken back, up to what it held, after the window; legendaries and older items stay (as02, ent3)', async () => {
  await reset();
  const chest = { x: 0, y: 65, z: 0, slots: [{ typeId: 'minecraft:cobblestone', amount: 10 }, undefined, { typeId: 'minecraft:bread', amount: 3 }] };
  const dim = spillingDim([chest]);
  const older = dim.spawnItem('minecraft:cobblestone', 4, { x: 1.5, y: 65.1, z: 0.5 });
  const legendary = dim.spawnItem('andrew:web_sword', 1, { x: 0.5, y: 65.5, z: 0.5 }, { legendary: true });
  const { reports, stop } = watch();
  const attackId = newId();
  RING_EFFECT.onDetonate(dim, { x: 0, y: 64, z: 0 }, 'owner', 'rmb', attackId);
  await drainAll();
  stop();
  assert.equal(chest.gone, true);
  const removed = dim.removals.map((e) => `${e.stack.typeId}×${e.stack.amount}`).sort();
  assert.deepEqual(removed, ['minecraft:bread×3', 'minecraft:cobblestone×10']);
  assert.equal(older.isValid, true, 'an item that lay there before the blast is not spill');
  assert.equal(legendary.isValid, true);
  assert.equal(reports.find((x) => x.attackId === attackId).itemsSuppressed, 13);
  const q = dim.queries[0];
  assert.deepEqual(q.filter.includeTypes, ['minecraft:chest', 'minecraft:barrel'], 'frames and holders with no script inventory are not queried');
  const sweepAfterRestore = events.findIndex((e) => e.kind === 'rule' && e.value === true);
  assert.ok(sweepAfterRestore > events.findIndex((e) => e.kind === 'explode'));
});

test('a container the blasts left standing keeps what it spilled nothing of, and a spilled type it never held stays', async () => {
  await reset();
  const far = { x: 6, y: 65, z: 0, slots: [{ typeId: 'minecraft:cobblestone', amount: 10 }] };
  const near = { x: 0, y: 65, z: 0, slots: [{ typeId: 'minecraft:bread', amount: 2 }] };
  const dim = spillingDim([far, near]);
  const stranger = dim.spawnItem('minecraft:cobblestone', 1, { x: 6.5, y: 65.2, z: 0.5 });
  const { reports, stop } = watch();
  const attackId = newId();
  RING_EFFECT.onDetonate(dim, { x: 0, y: 64, z: 0 }, 'owner', 'rmb', attackId);
  // The far chest stands, but a cobblestone lands next to it during the blast: not its spill.
  await drainAll();
  stop();
  assert.equal(far.gone, undefined);
  assert.equal(stranger.isValid, true);
  assert.deepEqual(dim.removals.map((e) => e.stack.typeId), ['minecraft:bread']);
  assert.equal(reports.find((x) => x.attackId === attackId).itemsSuppressed, 2);
});

test('both halves of a double chest count once: the spill is capped by the one 54-slot container', async () => {
  await reset();
  const slots = Array.from({ length: 54 }, (_, i) => (i === 0 ? { typeId: 'minecraft:dirt', amount: 5 } : undefined));
  const a = { x: 0, y: 65, z: 0, slots };
  const b = { x: 1, y: 65, z: 0, slots, spill: false };
  const dim = dimension({
    onExplode: (d) => {
      for (const c of [a, b]) {
        if (c.gone) continue;
        c.gone = true;
        d.set(c.x, c.y, c.z, 'minecraft:air');
      }
      // The engine spills the pair's 5 dirt once, and a neighbouring block drop would be something else entirely.
      d.spawnItem('minecraft:dirt', 5, { x: 0.5, y: 65.2, z: 0.5 });
      d.spawnItem('minecraft:dirt', 5, { x: 1.5, y: 65.2, z: 0.5 });
    },
  });
  dim.set(0, 65, 0, 'minecraft:chest', { slots });
  dim.set(1, 65, 0, 'minecraft:chest', { slots });
  const attackId = newId();
  RING_EFFECT.onDetonate(dim, { x: 0, y: 64, z: 0 }, 'owner', 'rmb', attackId);
  await drainAll();
  assert.equal(dim.removals.reduce((n, e) => n + e.stack.amount, 0), 5, 'the pair held 5 dirt, not 10');
});

test('a throwing protection snapshots nothing and sweeps nothing (C-15 rank 1)', async () => {
  await reset();
  fake.protect = () => {
    throw new Error('legendary protect: refused');
  };
  const chest = { x: 0, y: 65, z: 0, slots: [{ typeId: 'minecraft:cobblestone', amount: 10 }] };
  const dim = spillingDim([chest]);
  RING_EFFECT.onDetonate(dim, { x: 0, y: 64, z: 0 }, 'owner', 'rmb', newId());
  await drainAll();
  assert.equal(dim.queries.length, 0);
  assert.equal(dim.explosions.length, 0);
  assert.equal(dim.removals.length, 0);
});

// ------------------------------------------------------------------ r009 — the report waits for the last charge

test('the report waits while orbc still has a charge of the attack falling, then comes once (r009)', async () => {
  await reset();
  const dim = dimension();
  const { reports, stop } = watch();
  const attackId = newId();
  const attack = { attackId, mode: 'rmb' };
  fake.active.set(attackId, attack);
  RING_EFFECT.onDetonate(dim, { x: 0, y: 64, z: 0 }, 'owner', 'rmb', attackId);
  await drainAll();
  assert.equal(reports.filter((r) => r.attackId === attackId).length, 0, 'a charge is still falling');
  await tick(3);
  RING_EFFECT.onDetonate(dim, { x: 4, y: 60, z: 0 }, 'owner', 'rmb', attackId);
  fake.active.delete(attackId);
  for (const cb of fake.endObservers) cb({ attack, outcome: 'detonated' });
  await drainAll();
  stop();
  const mine = reports.filter((r) => r.attackId === attackId);
  assert.equal(mine.length, 1);
  assert.equal(mine[0].charges, 2);
  assert.equal(mine[0].blasts, 2);
  assert.equal(mine[0].ticksToDrain, 4);
});

test('an attack whose last charge ends without contact still reports (void, lost, timeout)', async () => {
  await reset();
  const dim = dimension();
  const { reports, stop } = watch();
  const attackId = newId();
  const attack = { attackId, mode: 'rmb' };
  fake.active.set(attackId, attack);
  RING_EFFECT.onDetonate(dim, { x: 0, y: 64, z: 0 }, 'owner', 'rmb', attackId);
  await drainAll();
  fake.active.delete(attackId);
  for (const cb of fake.endObservers) cb({ attack, outcome: 'voided' });
  await settle();
  stop();
  assert.equal(reports.filter((r) => r.attackId === attackId).length, 1);
});

// ------------------------------------------------------------------ L0-adr-odrp §5 — one owner of the rule

function sources(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...sources(p));
    else if (/\.(ts|mjs|js)$/.test(name)) out.push(p);
  }
  return out;
}

test('src/orbital/ring.ts is the only file under src/ that writes doTileDrops (L0-adr-odrp §5)', () => {
  const writers = sources(join(projectRoot, 'src'))
    .filter((p) => !p.includes(`${join('src', 'gametest')}`))
    .filter((p) => /doTileDrops\s*=[^=]|gamerule\s+dotiledrops/i.test(readFileSync(p, 'utf-8')))
    .map((p) => relative(projectRoot, p));
  assert.deepEqual(writers, [join('src', 'orbital', 'ring.ts')]);
});
