// The Mini Warden City body (src/structures/bodies/warden-city.ts) over
// fakes: the 5 % Overworld roll, the depth profile, the surface marker as a
// second spot of the site gate — loaded, judged and collision-checked before
// the first write, cancelling the whole candidate when bad — the marker lay,
// the vanilla table on all 10 chests, no guard step, and a restart.

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
      export * from './src/structures/bodies/warden-city.ts';
      export * from './src/structures/bodies.ts';
      export * from './src/structures/config.ts';
      export * from './src/structures/registry.ts';
      export * from './src/structures/store.ts';
      export * from './src/structures/roll.ts';
      export * from './src/structures/place.ts';
      export * from './src/structures/runtime.ts';
      export * from './src/structures/site.ts';
      export { ANCIENT_CITY, CUSTOM_TABLE } from './src/structures/loot.ts';
      export { CATEGORIES } from './src/structures/loot-table.ts';
      export { CHESTS as CITY_CHESTS, WARDEN_CITY_ID, WARDEN_CITY_SIZE, MARKER } from './src/structures/templates/warden-city.ts';`,
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
  WARDEN_CITY_BODY, MARKER_SPOT, markerCells, layMarker, BODIES, naturalDefs, CHANCES, ROLL_DEFS, dimShort,
  MemoryStore, SALT_KEY, rollHit, buildCandidate, StrfRuntime, SiteChecker, Registry, centreRing, coveredChunks,
  ANCIENT_CITY, CUSTOM_TABLE, CITY_CHESTS, WARDEN_CITY_ID, WARDEN_CITY_SIZE, MARKER, CHESTS_FILLED, GUARDS_SPAWNED,
} = m;

const AIR = 'minecraft:air';
const cityDef = () => naturalDefs(BODIES).find((d) => d.id === 'warden_city');

/** Grass at `ground(x, z)` over stone, plus explicit blocks; reads and writes are logged. */
class FakeWorld {
  constructor({ ground = () => 64, minY = -64, maxY = 320 } = {}) {
    Object.assign(this, { ground, minY, maxY });
    this.blocks = new Map();
    this.colTop = new Map();
    this.unloaded = new Set();
    this.writes = [];
    this.unloadedReads = 0;
  }
  set(x, y, z, t) {
    this.blocks.set(`${x},${y},${z}`, t);
    const k = `${x},${z}`;
    this.colTop.set(k, Math.max(this.colTop.get(k) ?? -Infinity, y));
  }
  type(x, y, z) {
    const t = this.blocks.get(`${x},${y},${z}`);
    if (t !== undefined) return t;
    const g = this.ground(x, z);
    return y > g ? AIR : y === g ? 'minecraft:grass_block' : 'minecraft:stone';
  }
  loadedAt(x, z) { return !this.unloaded.has(`${Math.floor(x / 16)},${Math.floor(z / 16)}`); }
  topmost(x, z) {
    if (!this.loadedAt(x, z)) { this.unloadedReads++; return undefined; }
    for (let y = Math.max(this.ground(x, z), this.colTop.get(`${x},${z}`) ?? -Infinity); y >= this.minY; y--) {
      const t = this.type(x, y, z);
      if (t !== AIR) return { y, typeId: t };
    }
    return { y: this.minY - 1, typeId: AIR };
  }
  typeAt(x, y, z) {
    if (!this.loadedAt(x, z)) { this.unloadedReads++; return undefined; }
    return this.type(x, y, z);
  }
  view() {
    return {
      minY: this.minY,
      maxY: this.maxY,
      isLoaded: (x, z) => this.loadedAt(x, z),
      topmost: (x, z) => this.topmost(x, z),
      typeAt: (x, y, z) => this.typeAt(x, y, z),
      // Only explicit blocks can be structure signatures here; natural grass and stone never are.
      contains: (lo, hi, types) => {
        for (const [k, t] of this.blocks) {
          const [x, y, z] = k.split(',').map(Number);
          if (x < lo[0] || x > hi[0] || y < lo[1] || y > hi[1] || z < lo[2] || z > hi[2]) continue;
          if (!this.loadedAt(x, z)) return undefined;
          if (types.includes(t)) return true;
        }
        return false;
      },
    };
  }
  edit() {
    return {
      topmost: (x, z) => this.topmost(x, z),
      typeAt: (x, y, z) => this.typeAt(x, y, z),
      set: (pos, typeId, states) => {
        this.writes.push(`set ${pos.join(',')} ${typeId}${states ? ` ${JSON.stringify(states)}` : ''}`);
        this.set(...pos, typeId);
      },
    };
  }
}

function runtime(w, { store = new MemoryStore(), events = [], salt = 'wrdn-node' } = {}) {
  if (store.get(SALT_KEY) === undefined) store.set(SALT_KEY, salt);
  let rt;
  const engine = {
    view: (d) => (d === 'o' || d === 'n' ? w.view() : undefined),
    placeWorld: () => ({
      hasTemplate: () => true,
      isLoaded: (x, z) => w.loadedAt(x, z),
      place: (id, origin, rot) => {
        const rec = rt.registry.allInstances().find((i) => i.origin.join() === origin.join());
        events.push(`place ${id} ${origin.join(',')} rot ${rot} record=${rec?.state}`);
        w.writes.push(`place ${id}`);
      },
      fill: () => events.push('fill'),
      edit: w.edit(),
    }),
    hooks: () => ({
      fillChest: (ctx) => events.push({ chest: ctx.index, table: ctx.table, pos: ctx.pos }),
      spawnGuard: (ctx) => events.push(`guard ${ctx.entity}`),
    }),
  };
  rt = new StrfRuntime(store, engine);
  return rt;
}

// ------------------------------------------------------------------ the body

test('the Warden City is a real body: its template, 10 chests on the vanilla Ancient City table, no guard step, no clear', () => {
  assert.equal(BODIES.warden_city, WARDEN_CITY_BODY);
  assert.equal(WARDEN_CITY_BODY.standIn, false);
  assert.equal(WARDEN_CITY_BODY.templateId, WARDEN_CITY_ID);
  assert.deepEqual(WARDEN_CITY_BODY.size, [...WARDEN_CITY_SIZE]);
  assert.equal(WARDEN_CITY_BODY.chests.length, 10);
  assert.deepEqual(WARDEN_CITY_BODY.chests.map((c) => c.local), CITY_CHESTS.map((c) => [...c.at]));
  assert.ok(WARDEN_CITY_BODY.chests.every((c) => c.table === ANCIENT_CITY && c.table !== CUSTOM_TABLE));
  // AC5: the guard step is absent, not empty.
  assert.equal('guards' in WARDEN_CITY_BODY, false);
  assert.equal(WARDEN_CITY_BODY.clear, undefined, 'the terrain is never cleared for a city');
  assert.equal(WARDEN_CITY_BODY.linked, undefined);
  assert.equal(WARDEN_CITY_BODY.spot, MARKER_SPOT);
  const def = cityDef();
  assert.equal(def.chance, CHANCES.warden_city);
  assert.equal(def.chance, 0.05);
  assert.equal(def.dim, 'o');
  assert.deepEqual(def.size, [...WARDEN_CITY_SIZE]);
});

// ------------------------------------------------------------------ AC7: 5 %, Overworld only

test('AC7: the roll hits close to 5 % of Overworld chunks, within 4 sigma, for several salts', () => {
  const def = cityDef();
  const N = 40000;
  const sigma = Math.sqrt((0.05 * 0.95) / N);
  const lines = [];
  for (const salt of ['a', 'b', 'c', 'wrdn-stat']) {
    let hits = 0;
    for (let i = 0; i < N; i++) if (rollHit(salt, 'o', (i % 200) - 100, Math.floor(i / 200) - 100, def)) hits++;
    const share = hits / N;
    lines.push(`${salt}: ${hits}/${N} = ${(share * 100).toFixed(2)} %`);
    assert.ok(Math.abs(share - 0.05) <= 4 * sigma, `salt ${salt}: ${share} outside 0.05 ± ${(4 * sigma).toFixed(4)}`);
  }
  console.log(`# warden roll share (tolerance ±${(4 * sigma * 100).toFixed(2)} pp = 4σ at N=${N}): ${lines.join('; ')}`);
});

test('AC7: through discovery, cities roll only in the Overworld; the Nether, the End and custom dimensions get none', () => {
  const w = new FakeWorld();
  const rt = runtime(w, { salt: 'wrdn-dims' });
  let overworldHits = 0;
  let chunks = 0;
  // Chunks 3 apart: neighbouring cities never meet, so every hit is also a placement.
  for (let i = 0; i < 40; i++)
    for (let j = 0; j < 40; j++) {
      chunks++;
      for (const r of rt.discovery.evaluateChunk('o', i * 3, j * 3).results) if (r.def === 'warden_city' && r.outcome !== 'miss') overworldHits++;
      for (const r of rt.discovery.evaluateChunk('n', i * 3, j * 3).results) assert.notEqual(r.def, 'warden_city', 'a Nether chunk rolled a city');
    }
  const cities = rt.registry.allInstances().filter((i) => i.def === 'warden_city');
  console.log(`# warden discovery: ${overworldHits}/${chunks} Overworld chunks rolled a city (${((overworldHits / chunks) * 100).toFixed(2)} %), ${cities.length} records, dims ${[...new Set(cities.map((c) => c.dim))].join(',')}`);
  assert.ok(overworldHits > 0);
  assert.ok(cities.length > 0 && cities.every((c) => c.dim === 'o'), 'a city outside the Overworld');
  assert.equal(dimShort('minecraft:the_end'), undefined);
  assert.equal(dimShort('andrew:custom'), undefined);
  assert.deepEqual(ROLL_DEFS.filter((d) => d.id === 'warden_city').map((d) => d.dim), ['o']);
  assert.equal(rt.placeAt('warden_city', 'n', 0, 0, 0).kind, 'wrong-dimension');
});

// ------------------------------------------------------------------ depth

test('depth: the top of the city lands on Y −45…−35, spread over the whole range', () => {
  const tops = new Set();
  for (let i = 0; i < 200; i++) {
    const rt = runtime(new FakeWorld(), { salt: `depth-${i}` });
    const c = buildCandidate(rt.registry.salt(), 'o', 5, 5, cityDef());
    const v = rt.checker.check(c);
    assert.equal(v.kind, 'valid', JSON.stringify(v));
    const top = v.y + c.size[1] - 1;
    assert.ok(top >= -45 && top <= -35, `top ${top}`);
    tops.add(top);
  }
  assert.equal(tops.size, 11, `tops seen: ${[...tops].sort((a, b) => a - b).join(' ')}`);
});

// ------------------------------------------------------------------ AC2: the second spot

const cand = (salt = 'spot') => buildCandidate(salt, 'o', 10, 10, cityDef());

test('marker spot: its columns lie inside the footprint and follow the rotation', () => {
  for (let i = 0; i < 16; i++) {
    const c = cand(`rot-${i}`);
    const cols = MARKER_SPOT.columns(c);
    assert.equal(cols.length, MARKER.length);
    for (const [x, z] of cols) assert.ok(x >= c.x && x < c.x + c.size[0] && z >= c.z && z < c.z + c.size[2]);
    const centre = markerCells(c).find((k) => k.center);
    assert.deepEqual([centre.x, centre.z], [c.x + 15, c.z + 15]);
  }
});

test('AC2: water under one marker cell the centre ring never samples cancels the whole candidate', () => {
  const c = cand();
  const ring = new Set(centreRing(c.x, c.z, c.size[0], c.size[2]).map(String));
  const cell = markerCells(c).find((k) => !k.center && !ring.has(`${k.x},${k.z}`));
  const w = new FakeWorld();
  w.set(cell.x, 64, cell.z, 'minecraft:water');
  const events = [];
  const rt = runtime(w, { events });
  const v = rt.checker.check(c);
  assert.deepEqual(v, { kind: 'rejected', reason: 'marker:liquid' });
  // The same spot with the underground box alone would pass: the marker decided.
  const boxOnly = new SiteChecker(() => w.view(), () => rt.registry.salt()).check(c);
  assert.equal(boxOnly.kind, 'valid');
  const out = rt.placeAt('warden_city', 'o', c.x + 15, c.z + 15, c.rot);
  assert.deepEqual(out, { kind: 'rejected', reason: 'marker:liquid' });
  assert.equal(rt.instances().length, 0);
  assert.deepEqual(w.writes, [], 'a rejected candidate wrote to the world');
  assert.deepEqual(events, []);
});

test('AC2: a player build or another structure at the marker cancels; the same thing only in the city box cancels too', () => {
  const c = cand();
  const centre = markerCells(c).find((k) => k.center);

  const build = new FakeWorld();
  build.set(centre.x + 3, 65, centre.z, 'minecraft:oak_planks');
  assert.deepEqual(runtime(build).checker.check(c), { kind: 'rejected', reason: 'marker:collision:player' });

  const other = runtime(new FakeWorld());
  const planned = other.registry.plan({ def: 'windmill', dim: 'o', origin: [centre.x - 17, 65, centre.z - 17], rot: 0, size: [35, 30, 35], id: 'windmill:test' });
  assert.ok(planned.ok);
  assert.deepEqual(other.checker.check(c), { kind: 'rejected', reason: 'marker:collision:instance' });

  const deep = new FakeWorld();
  deep.set(centre.x, -45, centre.z, 'minecraft:oak_planks');
  assert.deepEqual(runtime(deep).checker.check(c), { kind: 'rejected', reason: 'collision:player' });
});

test('AC2: ground at or below the city top leaves no cover over it: cancelled', () => {
  const c = cand();
  const low = new FakeWorld({ ground: () => -50 });
  assert.deepEqual(runtime(low).checker.check(c), { kind: 'rejected', reason: 'marker:no-cover' });
});

test('AC2: an unloaded spot keeps the candidate pending, and nothing is read or written before both are loaded', () => {
  const c = cand();
  const w = new FakeWorld();
  const [mx, mz] = MARKER_SPOT.columns(c)[0];
  w.unloaded.add(`${Math.floor(mx / 16)},${Math.floor(mz / 16)}`);
  const rt = runtime(w);
  assert.deepEqual(rt.checker.check(c), { kind: 'pending' });
  assert.equal(rt.checker.loaded(c), false);
  assert.equal(w.unloadedReads, 0, 'a read went into an unloaded chunk');
  assert.equal(rt.placeAt('warden_city', 'o', c.x + 15, c.z + 15, c.rot).kind, 'not-loaded');
  assert.deepEqual(w.writes, []);

  // A spot reaching outside the footprint is gated on its own chunks.
  const far = { ...MARKER_SPOT, columns: () => [[c.x + 200, c.z]] };
  const w2 = new FakeWorld();
  w2.unloaded.add(`${Math.floor((c.x + 200) / 16)},${Math.floor(c.z / 16)}`);
  const checker = new SiteChecker(() => w2.view(), () => 's', { spots: { warden_city: far } });
  assert.ok(coveredChunks(c.x, c.z, c.size[0], c.size[2]).every(([x, z]) => w2.loadedAt(x * 16, z * 16)), 'the footprint itself is loaded');
  assert.deepEqual(checker.check(c), { kind: 'pending' });
  assert.equal(checker.loaded(c), false);
  w2.unloaded.clear();
  assert.equal(checker.check(c).kind, 'valid');
});

// ------------------------------------------------------------------ placement, marker, loot, restart

test('placement: reservation first, then the template, then the marker in the same place step, then 10 vanilla chests; no guards', () => {
  const w = new FakeWorld();
  const events = [];
  const rt = runtime(w, { events });
  const out = rt.placeAt('warden_city', 'o', 200, 200, 1);
  assert.equal(out.kind, 'placed', JSON.stringify(out));
  const inst = out.instance;
  assert.equal(inst.state, 'done');
  const top = inst.origin[1] + inst.size[1] - 1;
  assert.ok(top >= -45 && top <= -35);
  assert.match(events[0], /^place andrew:warden-city .* rot 1 record=planned$/);
  assert.equal(w.writes[0], 'place andrew:warden-city');
  const marker = w.writes.slice(1);
  assert.equal(marker.length, MARKER.length);
  const cells = markerCells({ x: inst.origin[0], z: inst.origin[2], rot: inst.rot });
  for (const k of cells) {
    const want = k.kind === 'sculk' ? `set ${k.x},64,${k.z} minecraft:sculk` : `set ${k.x},65,${k.z} minecraft:sculk_vein {"multi_face_direction_bits":1}`;
    assert.ok(marker.includes(want), `missing ${want}`);
  }
  const chests = events.filter((e) => typeof e === 'object');
  assert.equal(chests.length, 10);
  assert.ok(chests.every((e) => e.table === ANCIENT_CITY));
  assert.equal(new Set(chests.map((e) => e.pos.join())).size, 10);
  assert.equal(events.filter((e) => typeof e === 'string' && e.startsWith('guard')).length, 0);
  const rec = rt.registry.get('o', inst.origin, inst.id);
  assert.equal(rec.extras[CHESTS_FILLED], 10);
  assert.equal(rec.extras[GUARDS_SPAWNED], undefined);
});

test('marker lay is idempotent and never cuts a trunk', () => {
  const w = new FakeWorld();
  const inst = { id: 'x', origin: [0, -57, 0], rot: 2, size: [...WARDEN_CITY_SIZE] };
  const cells = markerCells({ x: 0, z: 0, rot: 2 });
  const vein = cells.find((k) => k.kind === 'vein');
  w.set(vein.x, 65, vein.z, 'minecraft:oak_log');
  w.set(vein.x, 66, vein.z, 'minecraft:oak_leaves');
  const first = layMarker({ instance: inst }, w.edit(), -64);
  const snap = new Map(w.blocks);
  const writes = w.writes.length;
  const second = layMarker({ instance: inst }, w.edit(), -64);
  assert.deepEqual(second, first);
  assert.deepEqual(new Map(w.blocks), snap, 'a repeat changed the world');
  assert.equal(w.writes.length, writes * 2, 'the repeat wrote different cells');
  assert.equal(w.type(vein.x, 65, vein.z), 'minecraft:oak_log');
  assert.equal(first.find((r) => r.at[0] === vein.x && r.at[2] === vein.z).laid, false);
});

test('AC6: a restart gives no second set of chests and never refills a plundered one', () => {
  const store = new MemoryStore();
  const w = new FakeWorld();
  const events = [];
  const rt = runtime(w, { store, events });
  const out = rt.placeAt('warden_city', 'o', 400, 400, 0);
  assert.equal(out.kind, 'placed');
  const fills = () => events.filter((e) => typeof e === 'object').length;
  assert.equal(fills(), 10);

  const after = [];
  const rt2 = runtime(w, { store, events: after });
  assert.equal(rt2.resumeUnfinished(), 0);
  rt2.pumpPlacement(10);
  assert.equal(rt2.placeAt('warden_city', 'o', 400, 400, 0).kind, 'blocked');
  const cx = Math.floor(out.instance.origin[0] / 16);
  const cz = Math.floor(out.instance.origin[2] / 16);
  // The chunk's own roll finds the record, whatever it rolls.
  rt2.discovery.evaluateChunk('o', cx, cz);
  assert.deepEqual(after.filter((e) => typeof e === 'object'), []);
  assert.equal(rt2.instances('warden_city').length, 1);
});
