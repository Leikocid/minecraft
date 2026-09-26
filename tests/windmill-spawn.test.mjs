// The spawn Windmill (src/structures/spawn-search.ts, prepare.ts) over a fake
// world: search order 5×5 chunks → nearest within the radius → forced
// preparation, once per world, the discovery hold while it runs, the natural-
// only pre-check, edge blending, shallow-void fill, and fills cut to the
// engine's 32 768-cell cap.

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
      export * from './src/structures/spawn-search.ts';
      export * from './src/structures/prepare.ts';
      export * from './src/structures/clear.ts';
      export * from './src/structures/registry.ts';
      export * from './src/structures/store.ts';
      export * from './src/structures/runtime.ts';
      export { WINDMILL_BODY } from './src/structures/bodies/windmill.ts';`,
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
  SpawnSearch, SPAWN_KEY, SPAWN_ID, HOLD_MARGIN, planPrep, precheck, applyPrep, isNatural, largestStep,
  FILL_CELL_LIMIT, cells, VOID_DEPTH, BAND, StrfRuntime, MemoryStore, SALT_KEY,
} = m;

const AIR = 'minecraft:air';
const CHUNK = 16;
const REPLACEABLE = new Set([AIR, 'minecraft:water', 'minecraft:short_grass']);

/** Columns of `ground(x, z)`: grass on dirt on stone, plus explicit blocks; fills write through. */
class FakeWorld {
  constructor({ ground = () => 64, surface = () => 'minecraft:grass_block', minY = -64, maxY = 320 } = {}) {
    Object.assign(this, { ground, surface, minY, maxY });
    this.blocks = new Map();
    this.colTop = new Map();
    this.fills = [];
    this.writes = 0;
  }
  set(x, y, z, t) {
    this.blocks.set(`${x},${y},${z}`, t);
    const k = `${x},${z}`;
    this.colTop.set(k, Math.max(this.colTop.get(k) ?? -Infinity, y));
    this.writes++;
  }
  natural(x, y, z) {
    const g = this.ground(x, z);
    if (y > g) return AIR;
    if (y === g) return this.surface(x, z);
    return y >= g - 3 ? 'minecraft:dirt' : 'minecraft:stone';
  }
  type(x, y, z) {
    return this.blocks.get(`${x},${y},${z}`) ?? this.natural(x, y, z);
  }
  box(min, max, t) {
    for (let x = min[0]; x <= max[0]; x++) for (let y = min[1]; y <= max[1]; y++) for (let z = min[2]; z <= max[2]; z++) this.set(x, y, z, t);
  }
  view() {
    const w = this;
    return {
      minY: w.minY,
      maxY: w.maxY,
      isLoaded: () => true,
      topmost(x, z) {
        const start = Math.max(w.ground(x, z), w.colTop.get(`${x},${z}`) ?? -Infinity);
        for (let y = start; y >= w.minY; y--) {
          const t = w.type(x, y, z);
          if (t !== AIR) return { y, typeId: t };
        }
        return { y: w.minY - 1, typeId: AIR };
      },
      typeAt: (x, y, z) => w.type(x, y, z),
      contains(lo, hi, types) {
        for (let x = lo[0]; x <= hi[0]; x++) for (let z = lo[2]; z <= hi[2]; z++) {
          for (let y = Math.max(lo[1], w.minY); y <= Math.min(hi[1], w.maxY - 1); y++) if (types.includes(w.type(x, y, z))) return true;
        }
        return false;
      },
    };
  }
  prep() {
    const w = this;
    return {
      view: w.view(),
      foreign(min, max) {
        for (let x = min[0]; x <= max[0]; x++) for (let z = min[2]; z <= max[2]; z++) {
          for (let y = min[1]; y <= max[1]; y++) if (!isNatural(w.type(x, y, z))) return true;
        }
        return false;
      },
      fill(box, block, replace) {
        const n = cells(box);
        if (n > FILL_CELL_LIMIT) throw new Error(`fill of ${n} cells over the engine cap`);
        w.fills.push({ box, block, replace, n });
        for (let x = box.min[0]; x <= box.max[0]; x++) for (let y = box.min[1]; y <= box.max[1]; y++) for (let z = box.min[2]; z <= box.max[2]; z++) {
          if (replace === 'voids' && !REPLACEABLE.has(w.type(x, y, z))) continue;
          w.set(x, y, z, block);
        }
      },
    };
  }
  /** Ground after preparation: the first non-air, non-plant cell from the top of the column. */
  groundAt(x, z) {
    return this.view().topmost(x, z).y;
  }
}

function runtimeOver(world) {
  const store = new MemoryStore();
  store.set(SALT_KEY, 'spawn-salt');
  const placed = [];
  const rt = new StrfRuntime(store, {
    view: (d) => (d === 'o' ? world.view() : undefined),
    placeWorld: (d) => (d === 'o' ? {
      hasTemplate: () => true,
      isLoaded: () => true,
      place: (id, origin, rot) => placed.push({ id, origin, rot }),
      fill: () => {},
    } : undefined),
    hooks: () => ({ fillChest() {}, spawnGuard() {} }),
  });
  return { rt, store, placed };
}

function host(world, { spawn = { x: 8, z: 8 }, onWait } = {}) {
  const h = {
    loads: 0,
    removed: 0,
    waits: 0,
    states: [],
    spawn: () => spawn,
    async load() {
      h.loads++;
      return () => { h.removed++; };
    },
    async wait(n) {
      h.waits++;
      await onWait?.(n, h);
    },
    prep: () => world.prep(),
    announce: (s) => h.states.push(s),
  };
  return h;
}

function search(world, opts = {}) {
  const env = runtimeOver(world);
  const logs = [];
  const h = host(world, opts);
  const s = new SpawnSearch(env.rt, opts.store ?? env.store, h, { radius: opts.radius ?? 120, log: (l) => logs.push(l) });
  return { ...env, h, s, logs };
}

// ------------------------------------------------------------ natural whitelist

test('only natural blocks count as natural: terrain and plants yes, builds and structure blocks no', () => {
  for (const id of ['stone', 'grass_block', 'dirt', 'sand', 'gravel', 'deepslate', 'iron_ore', 'deepslate_diamond_ore', 'oak_log', 'birch_leaves', 'water', 'lava', 'short_grass', 'poppy', 'snow_layer', 'air', 'andesite', 'clay']) {
    assert.equal(isNatural(`minecraft:${id}`), true, id);
  }
  for (const id of ['oak_planks', 'cobblestone', 'stone_bricks', 'chest', 'mob_spawner', 'glass', 'polished_andesite', 'oak_stairs', 'stone_slab', 'bookshelf', 'deepslate_tiles', 'smooth_stone', 'cut_sandstone', 'torch', 'hay_block']) {
    assert.equal(isNatural(`minecraft:${id}`), false, id);
  }
});

// ------------------------------------------------------------ AC7: fills of at most 32 768 cells

test('AC7: preparation writes in fill calls of at most 32 768 cells; a plot clear over the cap is split', () => {
  // A 30-high natural spire on the plot makes the plot clear box 35×35×30 = 36 750 cells.
  const w = new FakeWorld({ ground: (x, z) => (x >= 10 && x <= 12 && z >= 10 && z <= 12 ? 94 : 64) });
  const v = planPrep(w.view(), 0, 0, 35);
  assert.equal(v.ok, true, JSON.stringify(v.reason));
  const clear = v.plan.writes.find((x) => x.kind === 'clear' && x.box.max[0] - x.box.min[0] === 34);
  assert.ok(cells(clear.box) > FILL_CELL_LIMIT, `plot clear ${cells(clear.box)} cells`);
  const job = applyPrep(w.prep(), v.plan);
  let r;
  do r = job.next(); while (!r.done);
  assert.ok(r.value.maxCells <= FILL_CELL_LIMIT, `largest fill ${r.value.maxCells}`);
  assert.ok(r.value.plotClearCalls >= 2, `plot clear in ${r.value.plotClearCalls} call(s)`);
  assert.equal(r.value.plotClearCells, cells(clear.box));
  assert.ok(w.fills.every((f) => f.n <= FILL_CELL_LIMIT));
  // The spire is gone: the plot is level.
  for (let x = 0; x < 35; x++) for (let z = 0; z < 35; z++) assert.equal(w.groundAt(x, z), 64, `${x},${z}`);
});

// ------------------------------------------------------------ AC5: level, blend, keep the cave open

/** A slope-1 hill east of the plot's centre and a deep cave under it. */
const hill = (x, z) => 64 + Math.max(0, 14 - Math.max(Math.abs(x - 30), Math.abs(z - 17)));

test('AC5: the plot is levelled, the band leaves no step over 1, the deep cave stays open under a thin cap', () => {
  const w = new FakeWorld({ ground: hill });
  const target = 64;
  // Cave: 9×9 under the plot centre, from 12 below the surface up to 2 below it.
  w.box([13, target - 12, 13], [21, target - 2, 21], AIR);
  const before = new Map();
  for (let x = -20; x < 55; x++) for (let z = -20; z < 55; z++) before.set(`${x},${z}`, w.groundAt(x, z));
  const v = planPrep(w.view(), 0, 0, 35);
  assert.equal(v.ok, true);
  assert.ok(v.plan.band >= BAND);
  assert.equal(v.plan.steep, false);
  assert.equal(precheck(w.prep(), v.plan, 'o').ok, true);
  const job = applyPrep(w.prep(), v.plan);
  while (!job.next().done);

  const yt = v.plan.targetY;
  const heights = new Map();
  const b = v.plan.band;
  for (let x = -b - 3; x < 35 + b + 3; x++) for (let z = -b - 3; z < 35 + b + 3; z++) heights.set(`${x},${z}`, w.groundAt(x, z));
  for (let x = 0; x < 35; x++) for (let z = 0; z < 35; z++) assert.equal(heights.get(`${x},${z}`), yt, `plot ${x},${z}`);
  const step = largestStep(heights);
  assert.ok(step.step <= 1, `step ${step.step} at ${step.at}`);
  // The natural hill had steps of at most 1 too: nothing we wrote is steeper than what was there.
  assert.ok(largestStep(before).step <= 1);

  // Cap: the D cells under the surface are solid; below them the cave is still air.
  for (let y = yt - VOID_DEPTH; y <= yt; y++) assert.notEqual(w.type(17, y, 17), AIR, `cap at y ${y}`);
  let open = 0;
  for (let x = 13; x <= 21; x++) for (let z = 13; z <= 21; z++) for (let y = target - 12; y < yt - VOID_DEPTH; y++) if (w.type(x, y, z) === AIR) open++;
  assert.equal(open, 9 * 9 * (yt - VOID_DEPTH - (target - 12)), 'cave volume below the cap');
});

// ------------------------------------------------------------ AC6: abort before the first write

for (const [label, id, at, reason] of [
  ['a player build in the band', 'minecraft:oak_planks', [-2, 66, 10], 'collision:player'],
  ['a spawner under the plot', 'minecraft:mob_spawner', [17, 62, 17], 'collision:spawner'],
  ['a structure signature', 'minecraft:stone_bricks', [5, 65, 30], 'collision:signature'],
  ['any other non-natural block', 'minecraft:polished_andesite', [20, 70, 20], 'foreign'],
]) {
  test(`AC6: ${label} stops the preparation before anything is written`, () => {
    const w = new FakeWorld({ ground: hill });
    w.set(...at, id);
    const writes = w.writes;
    const v = planPrep(w.view(), 0, 0, 35);
    assert.equal(v.ok, true);
    const c = precheck(w.prep(), v.plan, 'o');
    assert.equal(c.ok, false);
    assert.equal(c.reason, reason);
    assert.equal(w.writes, writes);
    assert.equal(w.fills.length, 0);
  });
}

test('AC6: the forced search skips a site whose pre-check fails and writes nothing there', async () => {
  const w = new FakeWorld({ ground: hill });
  w.set(17, 62, 17, 'minecraft:mob_spawner');
  const { s, logs } = search(w, { spawn: { x: 17, z: 17 }, radius: 10 });
  const writes = w.writes;
  const rec = await s.run();
  assert.notEqual(rec.status, 'done');
  assert.ok(Object.keys(rec.rejects).some((k) => k.startsWith('prep:collision:spawner')), JSON.stringify(rec.rejects));
  assert.equal(w.writes, writes);
  assert.ok(logs.some((l) => /refused before any write: collision:spawner/.test(l)));
});

// ------------------------------------------------------------ AC1: order of the search

test('AC1: on flat dry land the site is the nearest in the 5×5 chunks around spawn, reserved in the registry', async () => {
  const w = new FakeWorld();
  const { s, rt, h, placed } = search(w, { spawn: { x: 100, z: -40 } });
  const rec = await s.run();
  assert.equal(rec.status, 'done');
  assert.equal(rec.stage, 1);
  assert.equal(rec.prepared, false);
  const inst = rt.registry.get('o', rec.origin, SPAWN_ID);
  assert.equal(inst.state, 'done');
  assert.equal(rt.instances('windmill').length, 1);
  assert.equal(placed.length, 1);
  const c = [rec.origin[0] + 17, rec.origin[2] + 17];
  assert.ok(Math.hypot(c[0] - 100, c[1] + 40) <= 3, `centre ${c} vs spawn 100,-40`);
  assert.equal(h.removed, h.loads, 'every ticking area was removed');
  assert.equal(h.states.at(-1).record.id, SPAWN_ID);
  assert.equal(h.states.at(-1).nearSpawn, 1);
});

test('a guard step that throws (a Peaceful world) still leaves the spawn Windmill done, not failed: guards queue for later, the one search is not burned on it', async () => {
  const w = new FakeWorld();
  const store = new MemoryStore();
  store.set(SALT_KEY, 'spawn-salt-peaceful');
  const placed = [];
  const rt = new StrfRuntime(store, {
    view: (d) => (d === 'o' ? w.view() : undefined),
    placeWorld: (d) => (d === 'o' ? {
      hasTemplate: () => true,
      isLoaded: () => true,
      place: (id, origin, rot) => placed.push({ id, origin, rot }),
      fill: () => {},
    } : undefined),
    // Mirrors engineSpawnGuard on a real Peaceful server: the guard step throws.
    hooks: () => ({ fillChest() {}, spawnGuard: () => { throw new Error('EntitySpawnError: Attempting to spawn a hostile mob in a peaceful world.'); } }),
  });
  const h = host(w, { spawn: { x: 100, z: -40 } });
  const logs = [];
  const s = new SpawnSearch(rt, store, h, { radius: 120, log: (l) => logs.push(l) });
  const rec = await s.run();
  assert.equal(rec.status, 'done', `spawn Windmill search must not fail on a recoverable guard-step error: ${rec.reason}`);
  assert.equal(placed.length, 1, 'the template itself was placed');
  const inst = rt.registry.get('o', rec.origin, SPAWN_ID);
  assert.equal(inst.state, 'looted', 'guard step left pending, not skipped past');
  assert.equal(rt.queued, 1, 'the instance is queued so pumpPlacement retries the guard step later');
});

test('AC1: with water around spawn the search takes the nearest dry flat site farther out (stage 2)', async () => {
  // Dry land only east of x = 230; spawn at 0,0.
  const w = new FakeWorld({ surface: (x) => (x < 230 ? 'minecraft:water' : 'minecraft:grass_block') });
  const { s } = search(w, { spawn: { x: 0, z: 0 }, radius: 300 });
  const rec = await s.run();
  assert.equal(rec.status, 'done');
  assert.equal(rec.stage, 2);
  assert.ok(rec.origin[0] >= 230 && rec.origin[0] <= 234, `origin x ${rec.origin[0]}`);
  assert.ok(Math.abs(rec.origin[2] + 17) <= 4, `origin z ${rec.origin[2]}`);
});

test('AC1: no natural site anywhere in the radius → the best dry site is prepared by force (stage 3)', async () => {
  const w = new FakeWorld({ ground: (x, z) => 64 + ((Math.floor(x / 6) + Math.floor(z / 6)) % 2) * 5 });
  const { s, rt } = search(w, { spawn: { x: 0, z: 0 }, radius: 40 });
  const rec = await s.run();
  assert.equal(rec.status, 'done', rec.reason);
  assert.equal(rec.stage, 3);
  assert.equal(rec.prepared, true);
  assert.equal(rt.registry.get('o', rec.origin, SPAWN_ID).state, 'done');
  for (let x = rec.origin[0]; x < rec.origin[0] + 35; x++) assert.equal(w.groundAt(x, rec.origin[2] + 3), rec.targetY);
});

// ------------------------------------------------------------ AC8: no dry land at all

test('AC8: with no dry land in the radius there is no Windmill, and the log counts every place and its reason', async () => {
  const w = new FakeWorld({ surface: () => 'minecraft:water' });
  const { s, rt, logs, placed } = search(w, { radius: 60 });
  const rec = await s.run();
  assert.equal(rec.status, 'failed');
  assert.equal(rec.reason, 'no-dry-land');
  assert.equal(rt.instances('windmill').length, 0);
  assert.equal(placed.length, 0);
  assert.equal(w.writes, 0);
  const line = logs.find((l) => /search finished: no windmill/.test(l));
  assert.ok(line, logs.join('\n'));
  const n = Number(/checked (\d+) place/.exec(line)[1]);
  const counts = [...line.matchAll(/([a-z:-]+)=(\d+)/g)].map((x) => Number(x[2]));
  assert.ok(n > 100, line);
  assert.equal(counts.reduce((a, b) => a + b, 0), n, 'every checked place has exactly one reason');
  assert.match(line, /liquid=\d+/);
});

// ------------------------------------------------------------ AC3 + AC2: once per world

test('AC3: the flag is written before any work, and a second load never searches again', async () => {
  const w = new FakeWorld();
  let seen;
  const first = search(w, { onWait: (_n, h) => { seen ??= first?.store.get(SPAWN_KEY); } });
  const rec = await first.s.run();
  assert.equal(JSON.parse(seen).status, 'searching');
  assert.equal(rec.searches, 1);

  // A restart: a fresh runtime and search over the same store.
  const logs = [];
  const h2 = host(w);
  const again = new SpawnSearch(first.rt, first.store, h2, { radius: 120, log: (l) => logs.push(l) });
  const rec2 = await again.run();
  assert.deepEqual(rec2, rec);
  assert.equal(h2.loads, 0);
  assert.equal(first.rt.instances('windmill').length, 1);
  assert.ok(logs.some((l) => /already ran once .* not repeated/.test(l)));
  assert.equal(h2.states.at(-1).ranNow, false);
  assert.equal(h2.states.at(-1).searches, 1);
});

test('AC3: a search that found nothing is not repeated either, nor one cut short by a restart', async () => {
  const w = new FakeWorld({ surface: () => 'minecraft:water' });
  const a = search(w, { radius: 40 });
  assert.equal((await a.s.run()).status, 'failed');
  const h = host(w);
  const rec = await new SpawnSearch(a.rt, a.store, h, { radius: 40 }).run();
  assert.equal(rec.reason, 'no-dry-land');
  assert.equal(h.loads, 0);

  const store = new MemoryStore();
  store.set(SPAWN_KEY, JSON.stringify({ v: 1, status: 'searching', spawn: [0, 0], searches: 1 }));
  const flatWorld = new FakeWorld();
  const b = search(flatWorld, { store });
  const cut = await b.s.run();
  assert.equal(cut.status, 'failed');
  assert.match(cut.reason, /interrupted/);
  assert.equal(b.h.loads, 0);
  assert.equal(b.rt.instances('windmill').length, 0);
});

test('AC2: an interrupted preparation replays the same plan and still makes exactly one Windmill', async () => {
  const w = new FakeWorld({ ground: (x, z) => 64 + ((Math.floor(x / 6) + Math.floor(z / 6)) % 2) * 5 });
  const a = search(w, { spawn: { x: 0, z: 0 }, radius: 40 });
  const done = await a.s.run();
  // Rewind the record to "preparing" and drop the registry: as if the server died mid-way.
  const { rt, store } = runtimeOver(w);
  store.set(SPAWN_KEY, JSON.stringify({ ...done, status: 'preparing', prepared: undefined }));
  const h = host(w);
  const rec = await new SpawnSearch(rt, store, h, { radius: 40 }).run();
  assert.equal(rec.status, 'done', rec.reason);
  assert.deepEqual(rec.origin, done.origin);
  assert.equal(rt.instances('windmill').length, 1);
  assert.equal(rec.searches, 1);
});

// ------------------------------------------------------------ AC4: the hold on discovery

test('AC4: while the search runs, discovery holds every chunk within the radius of spawn and rolls the rest', async () => {
  const w = new FakeWorld();
  let during;
  const env = search(w, {
    spawn: { x: 0, z: 0 },
    onWait: (_n, h) => {
      if (during !== undefined) return;
      const d = env.rt.discovery;
      during = { near: d.hold?.('o', 2, 2), edge: d.hold?.('o', Math.floor((120 + HOLD_MARGIN - 16) / CHUNK), 0), far: d.hold?.('o', 40, 0), nether: d.hold?.('n', 0, 0) };
      d.discover([{ dimensionId: 'minecraft:overworld', x: 8, z: 8 }]);
      during.queued = d.queueLength;
      during.held = d.stats.held;
    },
  });
  await env.s.run();
  assert.deepEqual({ near: during.near, edge: during.edge, far: during.far, nether: during.nether }, { near: true, edge: true, far: false, nether: false });
  assert.equal(during.queued, 0, 'no chunk around spawn was queued');
  assert.ok(during.held > 0);
  assert.equal(env.rt.discovery.hold, undefined, 'the hold is released once the search ends');
});

test('a skip before the first write ends the search with no Windmill and no areas left', async () => {
  const w = new FakeWorld();
  let s;
  const env = search(w, { onWait: () => s.requestSkip('test') });
  s = env.s;
  const rec = await s.run();
  assert.equal(rec.status, 'skipped');
  assert.equal(env.rt.instances('windmill').length, 0);
  assert.equal(env.h.loads, env.h.removed);
  assert.equal(s.requestSkip('late'), false);
});
