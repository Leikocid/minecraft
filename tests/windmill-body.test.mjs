// The Windmill body (src/structures/bodies/windmill.ts) over fakes: natural
// generation at 1 % in the Overworld only, a bad site cancelled with nothing
// written, 25 chests and exactly 10 guards spawned once — through a crash and
// a restart — and never topped up.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const bundle = await build({
  stdin: {
    contents: `
      export * from './src/structures/bodies/windmill.ts';
      export * from './src/structures/bodies.ts';
      export * from './src/structures/config.ts';
      export * from './src/structures/discovery.ts';
      export * from './src/structures/registry.ts';
      export * from './src/structures/store.ts';
      export * from './src/structures/roll.ts';
      export * from './src/structures/place.ts';
      export * from './src/structures/runtime.ts';
      export { CUSTOM_TABLE } from './src/structures/loot.ts';
      export { fieldCell, PLOT } from './src/structures/templates/windmill-fields.ts';
      export { WINDMILL_ID, WINDMILL_SIZE } from './src/structures/templates/windmill.ts';`,
    resolveDir: projectRoot,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  external: ['@minecraft/server'],
  write: false,
});
const m = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64'));
const {
  WINDMILL_BODY, GUARD_POINTS, GUARD_COUNT, GUARD_ENTITY, guardTag, BODIES, naturalDefs, CHANCES, Discovery, Registry,
  MemoryStore, SALT_KEY, rollHit, Placer, StrfRuntime, GUARDS_SPAWNED, CUSTOM_TABLE, fieldCell, PLOT, WINDMILL_ID,
  WINDMILL_SIZE, installTestHook, clearTestHook, candidateId,
} = m;

const windmillDef = () => naturalDefs(BODIES).find((d) => d.id === 'windmill');

// ------------------------------------------------------------------ AC7: 1 %, Overworld only

test('the Windmill is a real body: it rolls at its table chance and reserves its template size', () => {
  assert.equal(BODIES.windmill, WINDMILL_BODY);
  assert.equal(WINDMILL_BODY.standIn, false);
  const def = windmillDef();
  assert.equal(def.chance, 0.01);
  assert.equal(def.chance, CHANCES.windmill);
  assert.equal(def.dim, 'o');
  assert.deepEqual(def.size, [...WINDMILL_SIZE]);
});

test('AC7: over 1 000 000 chunks the roll hits ~1 % (within 5σ of the binomial)', () => {
  const def = windmillDef();
  const N = 1_000_000;
  let hits = 0;
  for (let i = 0; i < N; i++) {
    const cx = (i % 1000) - 500;
    const cz = Math.floor(i / 1000) - 500;
    if (rollHit('stat-salt', 'o', cx, cz, def)) hits++;
  }
  // σ = sqrt(N·p·(1−p)) ≈ 99.5 hits; 5σ keeps the test deterministic-safe and still rejects 0.9 % or 1.1 %.
  const sigma = Math.sqrt(N * 0.01 * 0.99);
  const share = hits / N;
  console.log(`windmill roll: ${hits}/${N} = ${(share * 100).toFixed(3)} % (σ = ${sigma.toFixed(1)} hits, tolerance ±${(5 * sigma).toFixed(0)})`);
  assert.ok(Math.abs(hits - N * 0.01) <= 5 * sigma, `${hits} hits, expected ${N * 0.01} ± ${5 * sigma}`);
});

test('AC7: discovery over Overworld, Nether and End plans Windmills in the Overworld only, ~1 % of chunks', () => {
  const store = new MemoryStore();
  store.set(SALT_KEY, 'dims');
  const reg = new Registry(store);
  // Every site is valid: the share measured is the roll's, not the terrain's.
  const site = () => ({ kind: 'valid', y: 64 });
  const defs = naturalDefs(BODIES);
  const disc = new Discovery(reg, site, { defs });
  const side = 120;
  let planned = 0;
  for (const dim of ['o', 'n']) {
    for (let cx = 0; cx < side; cx++) for (let cz = 0; cz < side; cz++) {
      for (const r of disc.evaluateChunk(dim, cx * 4, cz * 4).results) {
        if (r.def === 'windmill' && r.outcome === 'planned') planned++;
        if (r.def === 'windmill') assert.equal(dim, 'o', `a windmill rolled in ${dim}`);
      }
    }
  }
  // The End maps to no dimension: nothing is even queued there.
  disc.discover([{ dimensionId: 'minecraft:the_end', x: 0, z: 0 }]);
  assert.equal(disc.queueLength, 0);
  const records = reg.allInstances().filter((i) => i.def === 'windmill');
  assert.equal(records.length, planned);
  assert.ok(records.every((i) => i.dim === 'o'), 'a windmill record outside the Overworld');
  const n = side * side;
  const sigma = Math.sqrt(n * 0.01 * 0.99);
  console.log(`windmill discovery: ${planned}/${n} overworld chunks planned (${((planned / n) * 100).toFixed(2)} %), 0 in the nether`);
  assert.ok(Math.abs(planned - n * 0.01) <= 5 * sigma, `${planned} planned of ${n}`);
});

// ------------------------------------------------------------------ AC1 over fakes: cancel, write nothing

const GROUND = 63;

function world({ ground = () => GROUND, liquid = () => false } = {}) {
  const writes = [];
  const view = {
    minY: -64,
    maxY: 320,
    isLoaded: () => true,
    topmost: (x, z) => (liquid(x, z) ? { y: ground(x, z) + 1, typeId: 'minecraft:water' } : { y: ground(x, z), typeId: 'minecraft:grass_block' }),
    typeAt: (x, y, z) => (y <= ground(x, z) ? 'minecraft:dirt' : liquid(x, z) && y === ground(x, z) + 1 ? 'minecraft:water' : 'minecraft:air'),
    contains: () => false,
  };
  const guards = [];
  const engine = {
    view: (d) => (d === 'o' ? view : undefined),
    placeWorld: () => ({
      hasTemplate: (id) => id === WINDMILL_ID,
      isLoaded: () => true,
      place: (...a) => writes.push(['place', ...a]),
      fill: (s) => writes.push(['fill', s]),
    }),
    hooks: () => ({
      fillChest: (ctx) => writes.push(['chest', ctx.index]),
      spawnGuard: (ctx) => guards.push(ctx),
    }),
  };
  const store = new MemoryStore();
  store.set(SALT_KEY, 'site');
  return { rt: new StrfRuntime(store, engine), writes, guards, store, engine };
}

function naturalAt(w, cx, cz) {
  installTestHook({ outcomes: [['windmill', 'o', cx, cz, true]] });
  try {
    const res = w.rt.discovery.evaluateChunk('o', cx, cz).results.find((r) => r.def === 'windmill');
    w.rt.pumpPlacement(10);
    return res;
  } finally {
    clearTestHook();
  }
}

test('AC1 (fakes): an uneven candidate is cancelled — no record, no world write, not moved elsewhere', () => {
  const w = world({ ground: (x) => (x % 16 < 8 ? GROUND : GROUND + 6) });
  const r = naturalAt(w, 3, 3);
  assert.deepEqual([r.outcome, r.reason], ['rejected', 'uneven']);
  assert.equal(w.rt.registry.allInstances().length, 0);
  assert.deepEqual(w.writes, []);
  assert.equal(w.rt.queued, 0);
});

test('AC1 (fakes): a candidate on water is cancelled with nothing written', () => {
  const w = world({ liquid: (x, z) => z % 16 < 8 });
  const r = naturalAt(w, 5, 5);
  assert.deepEqual([r.outcome, r.reason], ['rejected', 'liquid']);
  assert.equal(w.rt.registry.allInstances().length, 0);
  assert.deepEqual(w.writes, []);
});

test('AC1 (fakes): a candidate cutting another structure is cancelled', () => {
  const w = world();
  const other = w.rt.registry.plan({ def: 'airship', dim: 'o', origin: [7 * 16, GROUND + 1, 7 * 16], rot: 0, size: [15, 7, 12] });
  assert.ok(other.ok);
  const r = naturalAt(w, 7, 7);
  assert.equal(r.outcome, 'rejected');
  assert.match(r.reason, /^collision:/);
  assert.equal(w.rt.instances('windmill').length, 0);
  assert.deepEqual(w.writes, []);
});

test('flat dry land: the natural Windmill is placed without any clear, 25 chests, 10 guards, done', () => {
  const w = world();
  const r = naturalAt(w, 9, 9);
  assert.equal(r.outcome, 'planned');
  const [inst] = w.rt.instances('windmill');
  assert.equal(inst.state, 'done');
  assert.deepEqual(w.writes.filter(([k]) => k === 'fill'), [], 'a normal Windmill cleared the land');
  assert.equal(w.writes.filter(([k]) => k === 'place').length, 1);
  assert.deepEqual(w.writes.filter(([k]) => k === 'chest').map(([, i]) => i), [...Array(25).keys()]);
  assert.equal(w.guards.length, GUARD_COUNT);
  assert.ok(w.guards.every((g) => g.entity === GUARD_ENTITY && g.fireproof === true && g.tags.includes(guardTag(inst.id))));
  assert.equal(inst.extras[GUARDS_SPAWNED], GUARD_COUNT);
  assert.equal(inst.origin[1], GROUND + 1);
});

// ------------------------------------------------------------------ AC2/AC3 over fakes

test('the body: 25 chests on the custom table, 10 distinct guard points on field cells inside the plot', () => {
  assert.equal(WINDMILL_BODY.templateId, WINDMILL_ID);
  assert.equal(WINDMILL_BODY.chests.length, 25);
  assert.ok(WINDMILL_BODY.chests.every((c) => c.table === CUSTOM_TABLE));
  assert.equal(WINDMILL_BODY.clear, undefined, 'a normal Windmill must not clear or level the land');
  assert.equal(GUARD_POINTS.length, 10);
  assert.equal(new Set(GUARD_POINTS.map((p) => p.join())).size, 10);
  for (const [x, y, z] of GUARD_POINTS) {
    assert.equal(y, 1);
    assert.ok(x > 0 && z > 0 && x < PLOT - 1 && z < PLOT - 1, `${x},${z} on the fence line`);
    const cell = fieldCell(x, z);
    assert.ok(cell !== undefined, `${x},${z} is inside the building`);
    assert.notEqual(cell.ground.name, 'minecraft:water', `${x},${z} is a ditch`);
    assert.ok(!['minecraft:oak_fence', 'minecraft:web'].includes(cell.above?.name), `${x},${z} is blocked by ${cell.above?.name}`);
  }
});

function rig(store, { failAt } = {}) {
  if (store.get(SALT_KEY) === undefined) store.set(SALT_KEY, 'g');
  const reg = new Registry(store);
  const spawned = [];
  const world = { hasTemplate: () => true, isLoaded: () => true, place: () => {}, fill: () => {} };
  const hooks = {
    fillChest: () => {},
    spawnGuard: (ctx) => {
      if (ctx.index === failAt) throw new Error('crash');
      spawned.push(ctx.index);
    },
  };
  return { reg, spawned, placer: new Placer(reg, world, { windmill: WINDMILL_BODY }, hooks) };
}

test('AC3 (fakes): a crash mid-guards resumes at the next guard — 10 in total, never an 11th', () => {
  const store = new MemoryStore();
  const a = rig(store, { failAt: 4 });
  const planned = a.reg.plan({ def: 'windmill', dim: 'o', origin: [0, 64, 0], rot: 3, size: [35, 31, 35] });
  assert.throws(() => a.placer.run(planned.instance), /crash/);
  const mid = a.reg.get('o', [0, 64, 0], planned.instance.id);
  assert.equal(mid.state, 'looted', 'the guard step completed despite the crash');
  assert.equal(mid.extras[GUARDS_SPAWNED], 4);

  const b = rig(store);
  assert.equal(b.placer.run(mid).state, 'done');
  assert.deepEqual([...a.spawned, ...b.spawned], [...Array(10).keys()]);

  // Every later run, and the guard step called by hand, spawns nobody.
  const c = rig(store);
  const done = c.reg.get('o', [0, 64, 0], planned.instance.id);
  c.placer.run(done);
  c.placer.init(done);
  assert.equal(c.reg.runStep(done, 'guard', () => assert.fail('guard step ran again')), 'skipped');
  assert.deepEqual(c.spawned, []);
  assert.equal(c.reg.fail(done, 'guards died'), false, 'guarded is reset by fail');
  assert.equal(c.reg.get('o', [0, 64, 0], planned.instance.id).state, 'done');
});

test('guard tags name the instance', () => {
  assert.equal(guardTag('windmill:o:3:-4'), 'andrew:guard:windmill:o:3:-4');
  assert.equal(candidateId('windmill', 'o', 3, -4), 'windmill:o:3:-4');
});
