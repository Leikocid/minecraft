// The Airship body (src/structures/bodies/airship.ts, search-ring.ts) over
// fakes: natural generation at 2 % with the altitude profile, and the one
// Windmill-linked attempt — ring 40–100, never over the Windmill, never merged
// with an independent Airship, never widened, never touching the land.

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
      export * from './src/structures/bodies/airship.ts';
      export * from './src/structures/bodies/windmill.ts';
      export * from './src/structures/bodies.ts';
      export * from './src/structures/config.ts';
      export * from './src/structures/discovery.ts';
      export * from './src/structures/registry.ts';
      export * from './src/structures/store.ts';
      export * from './src/structures/roll.ts';
      export * from './src/structures/place.ts';
      export * from './src/structures/runtime.ts';
      export * from './src/structures/search-ring.ts';
      export { CUSTOM_TABLE } from './src/structures/loot.ts';
      export { AIRSHIP_ID, AIRSHIP_SIZE, CHESTS as AIRSHIP_CHESTS } from './src/structures/templates/airship.ts';
      export { WINDMILL_ID } from './src/structures/templates/windmill.ts';`,
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
  AIRSHIP_BODY, BODIES, naturalDefs, CHANCES, Discovery, Registry, MemoryStore, SALT_KEY, rollHit, StrfRuntime, CUSTOM_TABLE,
  AIRSHIP_ID, AIRSHIP_SIZE, AIRSHIP_CHESTS, WINDMILL_ID, WINDMILL_BODY, LINKED_RING, LINKED_STATUS, LINKED_TRIED, OVER_PARENT,
  linkedCandidates, overParent, parentCentre, footprintCentre, installTestHook, clearTestHook, withLinks, LINKS, standIn,
} = m;

const airshipDef = () => naturalDefs(BODIES).find((d) => d.id === 'airship');

// ------------------------------------------------------------------ the body

test('the Airship is a real body: its template, 10 chests on the custom table, no guards, no clear', () => {
  assert.equal(BODIES.airship, AIRSHIP_BODY);
  assert.equal(AIRSHIP_BODY.standIn, false);
  assert.equal(AIRSHIP_BODY.templateId, AIRSHIP_ID);
  assert.deepEqual(AIRSHIP_BODY.size, [...AIRSHIP_SIZE]);
  assert.equal(AIRSHIP_BODY.chests.length, 10);
  assert.deepEqual(AIRSHIP_BODY.chests.map((c) => c.local), AIRSHIP_CHESTS.map((c) => [...c.at]));
  assert.ok(AIRSHIP_BODY.chests.every((c) => c.table === CUSTOM_TABLE));
  // AC8: the guard step is absent from this body, not merely empty.
  assert.equal(AIRSHIP_BODY.guards, undefined);
  assert.equal('guards' in AIRSHIP_BODY, false);
  assert.equal(AIRSHIP_BODY.clear, undefined, 'an Airship must never clear anything');
  assert.equal(AIRSHIP_BODY.linked, undefined);
  const def = airshipDef();
  assert.equal(def.chance, CHANCES.airship);
  assert.equal(def.dim, 'o');
  assert.deepEqual(def.size, [...AIRSHIP_SIZE]);
});

test('links: only a real Windmill with a real Airship gets the linked hook', () => {
  assert.deepEqual({ ...LINKS }, { windmill: 'airship' });
  const start = () => {};
  assert.equal(typeof withLinks(BODIES, start).windmill.linked, 'function');
  assert.equal(BODIES.windmill.linked, undefined, 'withLinks changed the shared body');
  assert.equal(withLinks({ ...BODIES, airship: standIn([CUSTOM_TABLE, CUSTOM_TABLE]) }, start).windmill.linked, undefined);
  assert.equal(withLinks({ ...BODIES, windmill: standIn([CUSTOM_TABLE, CUSTOM_TABLE]) }, start).windmill.linked, undefined);
});

// ------------------------------------------------------------------ AC7: 2 %

test('AC7: over 1 000 000 chunks the Airship roll hits ~2 % (within 5σ of the binomial)', () => {
  const def = airshipDef();
  const N = 1_000_000;
  let hits = 0;
  for (let i = 0; i < N; i++) if (rollHit('airship-stat', 'o', (i % 1000) - 500, Math.floor(i / 1000) - 500, def)) hits++;
  // σ = sqrt(N·p·(1−p)) = 140 hits; 5σ = ±0.07 pp still rejects 1.9 % and 2.1 %.
  const sigma = Math.sqrt(N * 0.02 * 0.98);
  console.log(`airship roll: ${hits}/${N} = ${((hits / N) * 100).toFixed(3)} % (σ = ${sigma.toFixed(1)} hits, tolerance ±${(5 * sigma).toFixed(0)})`);
  assert.ok(Math.abs(hits - N * 0.02) <= 5 * sigma, `${hits} hits, expected ${N * 0.02} ± ${5 * sigma}`);
});

test('AC7: discovery plans independent Airships on ~2 % of Overworld chunks and none in the Nether', () => {
  const store = new MemoryStore();
  store.set(SALT_KEY, 'airship-dims');
  const reg = new Registry(store);
  const site = () => ({ kind: 'valid', y: 100 });
  const disc = new Discovery(reg, site, { defs: naturalDefs(BODIES) });
  const side = 150;
  let planned = 0;
  for (const dim of ['o', 'n']) {
    for (let cx = 0; cx < side; cx++) for (let cz = 0; cz < side; cz++) {
      // 5 chunks apart: no Airship footprint reaches its neighbour's.
      for (const r of disc.evaluateChunk(dim, cx * 5, cz * 5).results) {
        if (r.def !== 'airship') continue;
        assert.equal(dim, 'o', 'an airship rolled in the nether');
        if (r.outcome === 'planned') planned++;
      }
    }
  }
  const n = side * side;
  const sigma = Math.sqrt(n * 0.02 * 0.98);
  console.log(`airship discovery: ${planned}/${n} overworld chunks planned (${((planned / n) * 100).toFixed(2)} %)`);
  assert.ok(Math.abs(planned - n * 0.02) <= 5 * sigma, `${planned} planned of ${n}`);
});

// ------------------------------------------------------------------ fake world

const GROUND = 63;

/**
 * Flat land at GROUND; `water(x, z)` and `unloaded(x, z)` carve it. Every
 * world write is recorded, and no write may be a terrain write.
 */
function world({ water = () => false, unloaded = () => false, loader = true, salt = 'ring' } = {}) {
  const writes = [];
  const loads = [];
  const view = {
    minY: -64,
    maxY: 320,
    isLoaded: (x, z) => !unloaded(x, z),
    topmost: (x, z) => (unloaded(x, z) ? undefined : water(x, z) ? { y: GROUND, typeId: 'minecraft:water' } : { y: GROUND, typeId: 'minecraft:grass_block' }),
    typeAt: (x, y, z) => (unloaded(x, z) ? undefined : y < GROUND ? 'minecraft:dirt' : y === GROUND ? (water(x, z) ? 'minecraft:water' : 'minecraft:grass_block') : 'minecraft:air'),
    contains: () => false,
  };
  const placeWorld = {
    hasTemplate: (id) => id === WINDMILL_ID || id === AIRSHIP_ID,
    isLoaded: (x, z) => !unloaded(x, z),
    place: (id, origin, rot) => writes.push(['place', id, origin, rot]),
    fill: (s) => writes.push(['fill', s]),
  };
  const engine = {
    view: (d) => (d === 'o' ? view : undefined),
    placeWorld: () => placeWorld,
    hooks: () => ({ fillChest: (ctx) => writes.push(['chest', ctx.instance.id, ctx.index]), spawnGuard: () => {} }),
    ringLoader: loader
      ? () => ({
          load: async (min, max) => {
            loads.push([min, max]);
            // An area that never loads: the fake's "unloaded" columns stay so.
            return unloaded(min[0], min[1]) || unloaded(max[0], max[1]) ? undefined : () => loads.push('released');
          },
        })
      : undefined,
  };
  const store = new MemoryStore();
  store.set(SALT_KEY, salt);
  const logs = [];
  return { rt: new StrfRuntime(store, engine, { log: (s) => logs.push(s) }), writes, loads, logs, store, engine };
}

const hCentre = (inst) => footprintCentre({ x: inst.origin[0], z: inst.origin[2], size: inst.size });
const dist2d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const terrainWrites = (w) => w.writes.filter(([k]) => k === 'fill');

async function windmillAt(w, x, z, opts) {
  const out = w.rt.placeAt('windmill', 'o', x, z, 0, opts);
  assert.equal(out.kind, 'placed', JSON.stringify(out));
  const outcome = await w.rt.linked.outcome(out.instance.id);
  return { windmill: w.rt.registry.get('o', out.instance.origin, out.instance.id), outcome };
}

// ------------------------------------------------------------------ ring geometry

test('ring candidates: every footprint centre lies 40–100 blocks from the Windmill centre; seeded, varied', () => {
  const parent = { id: 'windmill:o:3:4', def: 'windmill', dim: 'o', origin: [31, 64, 47], rot: 0, size: [35, 30, 35], state: 'done', extras: {} };
  const def = airshipDef();
  const a = linkedCandidates('s1', parent, def);
  const b = linkedCandidates('s1', parent, def);
  const c = linkedCandidates('s2', parent, def);
  assert.deepEqual(a, b, 'not deterministic');
  assert.notDeepEqual(a.map((x) => x.id + x.x), c.map((x) => x.id + x.x));
  assert.ok(a.length >= 150, `${a.length} candidates`);
  const centre = parentCentre(parent);
  const ds = a.map((x) => dist2d(footprintCentre(x), centre));
  assert.ok(ds.every((d) => d >= LINKED_RING.rMin && d <= LINKED_RING.rMax), `out of ring: ${ds.filter((d) => d < 40 || d > 100)}`);
  assert.ok(Math.min(...ds) < 45 && Math.max(...ds) > 95, 'the ring is not covered edge to edge');
  assert.equal(new Set(a.map((x) => x.rot)).size, 4);
  assert.equal(new Set(a.map((x) => x.id)).size, a.length);
  assert.ok(a.every((x) => x.id.startsWith(`airship:linked:${parent.id}:`)));
});

test('AC4 (fakes): a footprint over the Windmill plot is refused whatever the height; beside it is not', () => {
  const parent = { origin: [0, 64, 0], size: [35, 30, 35] };
  const veto = overParent(parent);
  assert.equal(veto({ x: 10, z: 10, size: [15, 12, 7] }), OVER_PARENT);
  // Overlapping by a single column, at the plot's corner.
  assert.equal(veto({ x: 34, z: 34, size: [15, 12, 7] }), OVER_PARENT);
  assert.equal(veto({ x: 35, z: 0, size: [15, 12, 7] }), undefined);
  assert.equal(veto({ x: 0, z: -7, size: [15, 12, 7] }), undefined);
});

// ------------------------------------------------------------------ the linked attempt

test('AC2+AC3 (fakes): a placed Windmill makes one linked attempt; the Airship stands 40–100 blocks away, above the land', async () => {
  const w = world();
  const { windmill, outcome } = await windmillAt(w, 500, 500);
  assert.equal(w.rt.linked.attempts.get(windmill.id), 1);
  assert.equal(windmill.extras[LINKED_TRIED], true);
  assert.equal(outcome.status, 'placed');
  const ship = outcome.airship;
  assert.equal(ship.state, 'done');
  const d = dist2d(hCentre(ship), hCentre(windmill));
  assert.ok(d >= 40 && d <= 100, `distance ${d}`);
  assert.equal(outcome.distance, d);
  assert.ok(ship.origin[1] >= GROUND + 40 && ship.origin[1] <= GROUND + 70, `bottom ${ship.origin[1]}`);
  assert.equal(overParent(windmill)({ x: ship.origin[0], z: ship.origin[2], size: ship.size }), undefined);
  assert.equal(w.rt.registry.get('o', windmill.origin, windmill.id).extras[LINKED_STATUS], 'placed');
  assert.deepEqual(w.writes.filter(([k, id]) => k === 'place' && id === AIRSHIP_ID).length, 1);
  assert.equal(w.writes.filter(([k, id]) => k === 'chest' && id === ship.id).length, 10);
  assert.deepEqual(terrainWrites(w), []);
  assert.ok(w.logs.some((l) => l.includes(`distance ${d.toFixed(2)}`)));
  // Every temporary area it took was released.
  assert.equal(w.loads.filter((l) => l === 'released').length, w.loads.filter((l) => l !== 'released').length);

  // Every route to a second attempt: placeAt again, init again, a restart.
  assert.equal(w.rt.placeAt('windmill', 'o', 500, 500, 0).kind, 'blocked');
  w.rt.resumeUnfinished();
  await w.rt.linked.outcome(windmill.id);
  assert.equal(w.rt.linked.attempts.get(windmill.id), 1);
  assert.equal(w.rt.instances('airship').length, 1);
});

test('AC2 (fakes): a crash after the flag is set: the hook runs again on resume and does not attempt again', async () => {
  const w = world();
  let calls = 0;
  const bodies = withLinks(BODIES, () => {
    calls++;
    throw new Error('crash inside the linked hook');
  });
  const { Placer } = m;
  const placer = new Placer(w.rt.registry, w.engine.placeWorld('o'), bodies, w.engine.hooks('o'));
  const planned = w.rt.registry.plan({ def: 'windmill', dim: 'o', origin: [0, 64, 0], rot: 0, size: [35, 30, 35] });
  assert.throws(() => placer.run(planned.instance), /crash/);
  const mid = w.rt.registry.get('o', [0, 64, 0], planned.instance.id);
  assert.equal(mid.state, 'guarded', 'the finish step completed despite the crash');
  assert.equal(mid.extras[LINKED_TRIED], true);
  assert.equal(placer.init(mid), 'done');
  assert.equal(calls, 1, 'the linked hook attempted twice');
});

test('AC5 (fakes): an independent Airship already in the ring does not satisfy the attempt — the Windmill places its own', async () => {
  const w = world();
  // An independent Airship 60 blocks east of where the Windmill's centre will be.
  const ind = w.rt.placeAt('airship', 'o', 860, 800, 0);
  assert.equal(ind.kind, 'placed');
  const { windmill, outcome } = await windmillAt(w, 800, 800);
  assert.equal(outcome.status, 'placed');
  assert.notEqual(outcome.airship.id, ind.instance.id);
  const ships = w.rt.instances('airship');
  assert.equal(ships.length, 2);
  for (const s of ships) {
    const d = dist2d(hCentre(s), hCentre(windmill));
    assert.ok(d >= 40 && d <= 100, `${s.id} at ${d}`);
  }
});

test('AC5 (fakes): a linked Airship neither eats nor blocks its chunk\'s own 2 % roll', async () => {
  const w = world({ salt: 'roll-kept' });
  const { outcome } = await windmillAt(w, 1200, 1200);
  const ship = outcome.airship;
  const cx = Math.floor(ship.origin[0] / 16);
  const cz = Math.floor(ship.origin[2] / 16);
  assert.equal(w.rt.registry.isEvaluated('o', cx, cz), false, 'the linked placement marked its chunk evaluated');
  installTestHook({ outcomes: [['windmill', 'o', cx, cz, false], ['airship', 'o', cx, cz, true], ['warden_city', 'o', cx, cz, false]] });
  let res;
  try {
    res = w.rt.discovery.evaluateChunk('o', cx, cz).results.find((r) => r.def === 'airship');
  } finally {
    clearTestHook();
  }
  // The roll ran and was judged on its own spot: never `existing`, never `miss`.
  assert.ok(['planned', 'rejected'].includes(res.outcome), JSON.stringify(res));
  if (res.outcome === 'rejected') assert.match(res.reason, /^collision:/, 'only a physical overlap may cancel it');
  assert.equal(w.rt.registry.isEvaluated('o', cx, cz), true);
});

test('AC5 (fakes): two Windmills side by side each get their own linked Airship', async () => {
  const w = world({ salt: 'twins' });
  const a = await windmillAt(w, 2000, 2000);
  const b = await windmillAt(w, 2040, 2000);
  assert.equal(a.outcome.status, 'placed');
  assert.equal(b.outcome.status, 'placed');
  assert.notEqual(a.outcome.airship.id, b.outcome.airship.id);
  assert.equal(w.rt.instances('airship').length, 2);
});

test('AC6 (fakes): water everywhere in the ring — no Airship, status none, not widened, land untouched', async () => {
  const cx = 3000;
  // Dry only under the Windmill plot and its margin.
  const w = world({ water: (x, z) => Math.abs(x - cx) > 20 || Math.abs(z - cx) > 20 });
  const { windmill, outcome } = await windmillAt(w, cx, cx);
  assert.equal(outcome.status, 'none');
  assert.equal(w.rt.instances('airship').length, 0);
  assert.equal(w.rt.registry.get('o', windmill.origin, windmill.id).extras[LINKED_STATUS], 'none');
  assert.equal(outcome.result.rejects.liquid, outcome.result.checked);
  // Every area it loaded is inside the ring plus one footprint: nothing past 100 blocks + half an Airship + margin.
  const reach = 100 + 8 + 2;
  for (const l of w.loads.filter((l) => l !== 'released')) {
    for (const [x, z] of [l[0], l[1]]) assert.ok(Math.abs(x - cx) <= reach && Math.abs(z - cx) <= reach, `loaded ${x},${z}`);
  }
  assert.deepEqual(terrainWrites(w), []);
  assert.deepEqual(w.writes.filter(([k, id]) => k === 'place' && id === AIRSHIP_ID), []);
  // A later resume does not reopen a finished attempt.
  assert.equal(w.rt.linked.resume(w.rt.instances('windmill')), 0);
});

test('unreadable ring: the attempt stays pending (not failed), holds its candidates, and a retry finishes it', async () => {
  let blocked = true;
  // Only the four chunks under the Windmill's plot are readable; no ring footprint fits inside them.
  const out = (v) => v < 3968 || v > 4031;
  const w = world({ unloaded: (x, z) => blocked && (out(x) || out(z)) });
  const { windmill, outcome } = await windmillAt(w, 4000, 4000);
  assert.equal(outcome.status, 'pending');
  assert.equal(w.rt.registry.get('o', windmill.origin, windmill.id).extras[LINKED_STATUS], 'pending');
  assert.ok(w.rt.gate.held.unloaded().some((h) => h.cand.id.startsWith(`airship:linked:${windmill.id}:`)));
  assert.equal(w.rt.linked.pendingCount, 1);
  blocked = false;
  assert.equal(w.rt.linked.retryPending(), 1);
  const again = await w.rt.linked.outcome(windmill.id);
  assert.equal(again.status, 'placed');
  assert.equal(w.rt.linked.attempts.get(windmill.id), 1, 'a retry counted as a second attempt');
});

test('no ring loader: the attempt waits as pending instead of searching blind', async () => {
  const w = world({ loader: false });
  const { outcome } = await windmillAt(w, 5000, 5000);
  assert.equal(outcome.status, 'pending');
  assert.equal(w.rt.instances('airship').length, 0);
});
