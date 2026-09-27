// Site suitability (src/structures/profiles.ts, site.ts, collision.ts,
// pending.ts): the five profiles on a good and a bad spot each, the collision
// heuristic, the loaded-footprint gate with the pending state, and the full
// recheck before a reserved candidate is written.

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
      export * from './src/structures/registry.ts';
      export * from './src/structures/store.ts';
      export * from './src/structures/config.ts';
      export * from './src/structures/roll.ts';
      export * from './src/structures/discovery.ts';
      export * from './src/structures/profiles.ts';
      export * from './src/structures/collision.ts';
      export * from './src/structures/pending.ts';
      export * from './src/structures/site.ts';`,
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
  Registry, MemoryStore, ROLL_DEFS, PROFILES, Discovery, buildCandidate, installTestHook, clearTestHook,
  dryLand, flat, altitude, depth, netherFloor, surfaceY,
  SiteChecker, SiteGate, PendingSites, scanCollision, collisionBox, coveredChunks, sampleColumns, candidateOf,
} = m;

const SALT = 'site-salt';
const def = (id) => ROLL_DEFS.find((d) => d.id === id);
const AIR = 'minecraft:air';

/**
 * A sparse world: every column is `ground(x, z)` of grass over stone, plus
 * explicit blocks. Reads are counted, and reads in unloaded chunks are
 * recorded — the loaded gate must make that list stay empty.
 */
class FakeWorld {
  constructor({ minY = -64, maxY = 320, ground = () => 64, fill = 'minecraft:grass_block', nether = false } = {}) {
    Object.assign(this, { minY, maxY, ground, fill, nether });
    this.blocks = new Map();
    this.unloaded = new Set();
    this.reads = 0;
    this.unloadedReads = [];
  }
  key(x, y, z) { return `${x},${y},${z}`; }
  set(x, y, z, t) { this.blocks.set(this.key(x, y, z), t); }
  fillBox(x0, y0, z0, x1, y1, z1, t) {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) this.set(x, y, z, t);
  }
  unload(cx, cz) { this.unloaded.add(`${cx},${cz}`); }
  load(cx, cz) { this.unloaded.delete(`${cx},${cz}`); }
  loadedAt(x, z) { return !this.unloaded.has(`${Math.floor(x / 16)},${Math.floor(z / 16)}`); }
  natural(x, y, z) {
    if (this.nether) return this.ground(x, z, y);
    const g = this.ground(x, z);
    if (y > g) return AIR;
    return y === g ? this.fill : 'minecraft:stone';
  }
  type(x, y, z) { return this.blocks.get(this.key(x, y, z)) ?? this.natural(x, y, z); }
  view() {
    const w = this;
    const guard = (x, z) => {
      w.reads++;
      if (!w.loadedAt(x, z)) { w.unloadedReads.push([x, z]); return false; }
      return true;
    };
    return {
      minY: w.minY,
      maxY: w.maxY,
      isLoaded: (x, z) => w.loadedAt(x, z),
      topmost(x, z) {
        if (!guard(x, z)) return undefined;
        for (let y = w.maxY - 1; y >= w.minY; y--) {
          const t = w.type(x, y, z);
          if (t !== AIR) return { y, typeId: t };
        }
        return { y: w.minY - 1, typeId: AIR };
      },
      typeAt(x, y, z) { return guard(x, z) ? w.type(x, y, z) : undefined; },
      contains(lo, hi, types) {
        for (let x = lo[0]; x <= hi[0]; x++) for (let z = lo[2]; z <= hi[2]; z++) {
          if (!guard(x, z)) return undefined;
          for (let y = Math.max(lo[1], w.minY); y <= Math.min(hi[1], w.maxY - 1); y++) {
            if (types.includes(w.type(x, y, z))) return true;
          }
        }
        return false;
      },
    };
  }
}

function setup(world, { registry = true } = {}) {
  const store = new MemoryStore();
  store.set('andrew:st:salt', SALT);
  const reg = new Registry(store);
  const views = (dim) => (dim === (world.nether ? 'n' : 'o') ? world.view() : undefined);
  const checker = new SiteChecker(views, () => SALT, registry ? { registry: reg } : {});
  return { store, reg, checker };
}

const cand = (id, cx = 0, cz = 0, dim) => buildCandidate(SALT, dim ?? def(id).dim, cx, cz, def(id));
const sample = (x, ground, liquid = false, top = ground) => ({ x, z: 0, top, topType: liquid ? 'minecraft:water' : 'minecraft:grass_block', liquid, ground });

// ------------------------------------------------------------ AC1: profiles, pure

test('dryLand: share of liquid samples against the threshold', () => {
  const spec = PROFILES.windmill.dryLand;
  const dry = Array.from({ length: 100 }, (_, i) => sample(i, 64, i < 5));
  assert.deepEqual(dryLand(dry, spec), { ok: true });
  const wet = Array.from({ length: 100 }, (_, i) => sample(i, 64, i < 6));
  assert.deepEqual(dryLand(wet, spec), { ok: false, reason: 'liquid' });
  assert.deepEqual(dryLand([sample(0, 64), sample(1, 64, true)], PROFILES.warden_city.dryLand), { ok: false, reason: 'liquid' });
});

test('flat: ground spread of 3 passes, 4 is uneven; leaves above do not count', () => {
  const spec = PROFILES.windmill.flat;
  assert.deepEqual(flat([sample(0, 64), sample(1, 67, false, 90)], spec), { ok: true });
  assert.deepEqual(flat([sample(0, 64), sample(1, 68)], spec), { ok: false, reason: 'uneven' });
  assert.equal(surfaceY([sample(0, 64), sample(1, 65), sample(2, 67)]), 66);
});

test('altitude: bottom in [maxTop+40, maxTop+70], lowered to +40 near the ceiling, rejected above it', () => {
  const spec = PROFILES.airship.altitude;
  for (const unit of [0, 0.25, 0.5, 0.999]) {
    const r = altitude(64, 12, unit, 320, spec);
    assert.ok(r.ok && r.y >= 104 && r.y <= 134, `unit ${unit}: ${JSON.stringify(r)}`);
  }
  assert.deepEqual(altitude(250, 12, 0.999, 320, spec), { ok: true, y: 290 });
  assert.deepEqual(altitude(270, 12, 0, 320, spec), { ok: false, reason: 'ceiling' });
});

test('depth: seeded top in [-45, -35], rejected when the bottom reaches the bedrock band', () => {
  const spec = PROFILES.warden_city.depth;
  for (const unit of [0, 0.5, 0.999]) {
    const r = depth(15, unit, -64, spec);
    assert.ok(r.ok && r.y + 14 >= -45 && r.y + 14 <= -35, `unit ${unit}: ${JSON.stringify(r)}`);
  }
  assert.deepEqual(depth(20, 0, -64, spec), { ok: false, reason: 'floor' });
});

test('netherFloor: a flat shelf is valid, a lava sea or a broken floor is not', () => {
  const spec = PROFILES.bastion.netherFloor;
  const col = (floor, over = {}) => ({ x: 0, z: 0, floor, lavaSea: false, inner: true, ...over });
  const shelf = Array.from({ length: 10 }, () => col(70));
  assert.deepEqual(netherFloor(shelf, 12, spec), { ok: true, y: 71 });
  assert.deepEqual(netherFloor([...shelf, col(undefined, { lavaSea: true })], 12, spec), { ok: false, reason: 'lavaOcean' });
  assert.deepEqual(netherFloor([...shelf, col(undefined, { lavaSea: true, inner: false })], 12, spec), { ok: true, y: 71 });
  const broken = [...Array.from({ length: 7 }, () => col(70)), col(50), col(90), col(40)];
  assert.deepEqual(netherFloor(broken, 12, spec), { ok: false, reason: 'uneven' });
  assert.deepEqual(netherFloor(Array.from({ length: 10 }, () => col(110)), 12, spec), { ok: false, reason: 'ceiling' });
});

// ------------------------------------------------------------ AC1: profiles on a world

test('windmill site: flat dry land is valid; a pond or a 6-block step rejects it', () => {
  const c = cand('windmill');
  const good = setup(new FakeWorld());
  assert.deepEqual(good.checker.check(c), { kind: 'valid', y: 65 });

  const pond = new FakeWorld();
  pond.fillBox(c.x, 64, c.z, c.x + Math.floor(c.size[0] * 0.3), 64, c.z + c.size[2] - 1, 'minecraft:water');
  assert.deepEqual(setup(pond).checker.check(c), { kind: 'rejected', reason: 'liquid' });

  const step = new FakeWorld({ ground: (x) => (x >= c.x + 17 ? 70 : 64) });
  assert.deepEqual(setup(step).checker.check(c), { kind: 'rejected', reason: 'uneven' });
});

test('airship site: bottom clears the highest tree by 40; mountain top hits the ceiling; ocean rejects', () => {
  const c = cand('airship');
  const w = new FakeWorld();
  const [tx, tz] = [c.x, c.z];
  w.fillBox(tx, 65, tz, tx, 84, tz, 'minecraft:oak_log');
  w.set(tx, 85, tz, 'minecraft:oak_leaves');
  const r = setup(w).checker.check(c);
  assert.equal(r.kind, 'valid');
  assert.ok(r.y >= 85 + 40 && r.y <= 85 + 70, JSON.stringify(r));

  assert.deepEqual(setup(new FakeWorld({ ground: () => 275 })).checker.check(c), { kind: 'rejected', reason: 'ceiling' });
  const sea = new FakeWorld({ fill: 'minecraft:water' });
  assert.deepEqual(setup(sea).checker.check(c), { kind: 'rejected', reason: 'liquid' });
});

test('warden city site: dry centre ring is valid; water over the centre rejects', () => {
  // A 20-high city drawn to top at −45 would reach the world floor and is rejected
  // for depth (see the depth test); take the first chunk whose draw fits.
  const c = [0, 1, 2, 3, 4, 5].map((cx) => cand('warden_city', cx)).find((k) => setup(new FakeWorld()).checker.check(k).kind === 'valid');
  const r = setup(new FakeWorld()).checker.check(c);
  assert.equal(r.kind, 'valid');
  assert.ok(r.y + c.size[1] - 1 <= -35 && r.y + c.size[1] - 1 >= -45);
  const w = new FakeWorld();
  w.set(c.x + Math.floor(c.size[0] / 2), 64, c.z + Math.floor(c.size[2] / 2), 'minecraft:water');
  assert.deepEqual(setup(w).checker.check(c), { kind: 'rejected', reason: 'liquid' });
});

test('bastion site: netherrack shelf is valid; a lava sea at 31 is lavaOcean', () => {
  const c = cand('bastion');
  const shelf = new FakeWorld({ minY: 0, maxY: 128, nether: true, ground: (_x, _z, y) => (y <= 60 ? 'minecraft:netherrack' : y >= 124 ? 'minecraft:bedrock' : AIR) });
  assert.deepEqual(setup(shelf).checker.check(c), { kind: 'valid', y: 61 });
  const sea = new FakeWorld({ minY: 0, maxY: 128, nether: true, ground: (_x, _z, y) => (y <= 31 ? 'minecraft:lava' : AIR) });
  assert.deepEqual(setup(sea).checker.check(c), { kind: 'rejected', reason: 'lavaOcean' });
});

test('sampling covers the whole footprint: grid, corners and centre', () => {
  const cols = sampleColumns(0, 0, 15, 12);
  for (const p of [[0, 0], [14, 0], [0, 11], [14, 11], [7, 6]]) assert.ok(cols.some(([x, z]) => x === p[0] && z === p[1]), `missing ${p}`);
  assert.equal(new Set(cols.map(String)).size, cols.length);
  assert.ok(sampleColumns(0, 0, 35, 35).length < cols.length * 3);
});

// ------------------------------------------------------------ collision

test('collision: player planks and chest, a spawner in the margin, a signature block; natural blocks pass', () => {
  const c = cand('windmill');
  const y = 65;
  const hit = (mutate) => {
    const w = new FakeWorld();
    mutate(w);
    return setup(w).checker.check(c);
  };
  assert.deepEqual(hit((w) => { w.set(c.x + 5, 65, c.z + 5, 'minecraft:oak_planks'); }), { kind: 'rejected', reason: 'collision:player' });
  assert.deepEqual(hit((w) => { w.set(c.x + 9, 65, c.z + 3, 'minecraft:chest'); }), { kind: 'rejected', reason: 'collision:player' });
  assert.deepEqual(hit((w) => { w.set(c.x - 2, 65, c.z, 'minecraft:mob_spawner'); }), { kind: 'rejected', reason: 'collision:spawner' });
  assert.deepEqual(hit((w) => { w.set(c.x + 1, y + 10, c.z + 1, 'minecraft:deepslate_tiles'); }), { kind: 'rejected', reason: 'collision:signature' });
  assert.deepEqual(hit((w) => { w.set(c.x - 3, 65, c.z, 'minecraft:mob_spawner'); }), { kind: 'valid', y }, 'outside the margin');
  assert.deepEqual(hit((w) => { w.set(c.x + 1, 64, c.z + 1, 'minecraft:deepslate'); w.set(c.x + 3, 65, c.z + 3, 'minecraft:oak_log'); }), { kind: 'valid', y });
});

test('collision: cobblestone counts at the surface, not in deep caves', () => {
  const w = new FakeWorld();
  w.set(0, -30, 0, 'minecraft:cobblestone');
  const view = w.view();
  assert.deepEqual(scanCollision(view, 'o', collisionBox([-5, -35, -5], [10, 10, 10])), { kind: 'clear' });
  w.set(0, 70, 0, 'minecraft:cobblestone');
  assert.deepEqual(scanCollision(view, 'o', collisionBox([-5, 65, -5], [10, 10, 10])), { kind: 'hit', collision: 'player' });
});

test('collision: another registry record within the margin rejects; the own record does not', () => {
  const c = cand('airship');
  const { reg, checker } = setup(new FakeWorld());
  const v = checker.check(c);
  assert.equal(v.kind, 'valid');
  reg.plan({ def: 'airship', dim: 'o', origin: [c.x, v.y, c.z], rot: c.rot, size: c.size, id: c.id });
  assert.equal(checker.check(c, c.id).kind, 'valid');
  const other = { ...c, id: 'airship:o:99:99' };
  assert.deepEqual(checker.check(other, other.id), { kind: 'rejected', reason: 'collision:instance' });
});

// ------------------------------------------------------------ loaded gate and pending

test('loaded gate: one unloaded chunk in the margin makes the candidate pending with zero block reads', () => {
  const c = cand('airship', 3, 3);
  const chunks = coveredChunks(c.x, c.z, c.size[0], c.size[2]);
  assert.ok(chunks.length >= 2);
  const w = new FakeWorld();
  const [ux, uz] = chunks[chunks.length - 1];
  w.unload(ux, uz);
  const { checker } = setup(w);
  assert.deepEqual(checker.check(c), { kind: 'pending' });
  assert.equal(w.reads, 0, 'a block was read before the loaded gate');
  assert.deepEqual(w.unloadedReads, []);
});

test('pending candidate: no record, no evaluated bit, no write; after loading the same origin and rotation is placed', () => {
  const d = def('airship');
  const w = new FakeWorld();
  const { reg, checker } = setup(w);
  let slices = 0;
  const gate = new SiteGate(checker, reg, () => slices);
  const disc = new Discovery(reg, gate.site, { defs: [d] });
  installTestHook({ outcomes: [['airship', 'o', 5, 7, true]] });
  try {
    const c = cand('airship', 5, 7);
    const [ux, uz] = coveredChunks(c.x, c.z, c.size[0], c.size[2]).at(-1);
    w.unload(ux, uz);

    const first = disc.evaluateChunk('o', 5, 7);
    assert.equal(first.results[0].outcome, 'pending');
    assert.equal(first.evaluated, false);
    assert.equal(reg.isEvaluated('o', 5, 7), false);
    assert.deepEqual(reg.allInstances(), []);
    assert.deepEqual(w.unloadedReads, []);
    const held = gate.held.get(c.id);
    assert.equal(held.state, 'unloaded');
    assert.deepEqual([held.cand.x, held.cand.z, held.cand.rot], [c.x, c.z, c.rot]);
    assert.deepEqual(gate.held.inChunk('o', 5, 7).map((h) => h.cand.id), [c.id]);

    // A restart forgets the held candidate; the roll rebuilds the same one.
    const again = setup(w);
    const disc2 = new Discovery(again.reg, new SiteGate(again.checker, again.reg, () => 0).site, { defs: [d] });
    assert.equal(disc2.evaluateChunk('o', 5, 7).results[0].outcome, 'pending');

    w.load(ux, uz);
    slices = 1;
    const second = disc.evaluateChunk('o', 5, 7);
    assert.equal(second.results[0].outcome, 'planned');
    assert.equal(second.evaluated, true);
    const inst = reg.get('o', [c.x, 0, c.z], c.id);
    assert.deepEqual([inst.origin[0], inst.origin[2], inst.rot], [c.x, c.z, c.rot]);

    const writes = [];
    assert.deepEqual(gate.occupy(inst, (i) => writes.push(i.id)), { kind: 'placed' });
    assert.deepEqual(writes, [c.id]);
    assert.equal(reg.get('o', inst.origin, c.id).state, 'placed');
    assert.equal(gate.held.size, 0);
  } finally {
    clearTestHook();
  }
});

test('occupy: a chunk unloaded between reservation and write keeps the record planned and writes nothing', () => {
  const w = new FakeWorld();
  const { reg, checker } = setup(w);
  const gate = new SiteGate(checker, reg, () => 0);
  const c = cand('windmill', 2, 2);
  const v = gate.site(c);
  const inst = reg.plan({ def: 'windmill', dim: 'o', origin: [c.x, v.y, c.z], rot: c.rot, size: c.size, id: c.id }).instance;
  w.unload(...coveredChunks(c.x, c.z, c.size[0], c.size[2])[0]);
  let wrote = 0;
  assert.deepEqual(gate.occupy(inst, () => wrote++), { kind: 'pending' });
  assert.equal(wrote, 0);
  assert.equal(reg.get('o', inst.origin, c.id).state, 'planned');
  assert.equal(gate.held.get(c.id).state, 'unloaded');
});

// ------------------------------------------------------------ recheck

test('recheck: a player build placed after validation, one slice later, cancels the candidate and nothing is written', () => {
  const w = new FakeWorld();
  const { reg, checker } = setup(w);
  let slices = 0;
  const gate = new SiteGate(checker, reg, () => slices);
  const disc = new Discovery(reg, gate.site, { defs: [def('windmill')] });
  installTestHook({ outcomes: [['windmill', 'o', 4, 4, true]] });
  try {
    assert.equal(disc.evaluateChunk('o', 4, 4).results[0].outcome, 'planned');
    const c = cand('windmill', 4, 4);
    const inst = reg.get('o', [c.x, 0, c.z], c.id);

    w.fillBox(c.x + 10, 65, c.z + 10, c.x + 13, 65, c.z + 13, 'minecraft:spruce_planks');
    w.set(c.x + 11, 66, c.z + 11, 'minecraft:chest');
    const before = JSON.stringify([...w.blocks]);
    slices = 1;

    let wrote = 0;
    assert.deepEqual(gate.occupy(inst, () => wrote++), { kind: 'rejected', reason: 'collision:player' });
    assert.equal(wrote, 0);
    assert.equal(JSON.stringify([...w.blocks]), before);
    const after = reg.get('o', inst.origin, c.id);
    assert.equal(after.state, 'failed');
    assert.equal(after.extras.why, 'collision:player');
    assert.deepEqual(gate.occupy(after, () => wrote++), { kind: 'skipped' });
  } finally {
    clearTestHook();
  }
});

test('recheck: same slice goes through the loaded gate only; a restart (no held entry) checks in full', () => {
  const w = new FakeWorld();
  const { reg, checker } = setup(w);
  const gate = new SiteGate(checker, reg, () => 7);
  const c = cand('windmill', 1, 1);
  const v = gate.site(c);
  const inst = reg.plan({ def: 'windmill', dim: 'o', origin: [c.x, v.y, c.z], rot: c.rot, size: c.size, id: c.id }).instance;
  w.reads = 0;
  assert.deepEqual(gate.occupy(inst, () => {}), { kind: 'placed' });
  assert.equal(w.reads, 0, 'same-slice occupation re-read the site');

  const c2 = cand('windmill', 9, 9);
  const inst2 = reg.plan({ def: 'windmill', dim: 'o', origin: [c2.x, 65, c2.z], rot: c2.rot, size: c2.size, id: c2.id }).instance;
  const fresh = new SiteGate(checker, reg, () => 7);
  w.set(c2.x + 3, 66, c2.z + 3, 'minecraft:crafting_table');
  assert.deepEqual(fresh.occupy(inst2, () => {}), { kind: 'rejected', reason: 'collision:player' });
  assert.deepEqual(candidateOf(inst2).rot, c2.rot);
});

test('recheck: terrain that moved the solved Y cancels instead of shifting the structure', () => {
  const w = new FakeWorld();
  const { reg, checker } = setup(w);
  let slices = 0;
  const gate = new SiteGate(checker, reg, () => slices);
  const c = cand('windmill', 6, 6);
  const v = gate.site(c);
  const inst = reg.plan({ def: 'windmill', dim: 'o', origin: [c.x, v.y, c.z], rot: c.rot, size: c.size, id: c.id }).instance;
  w.ground = () => 66;
  slices = 1;
  assert.deepEqual(gate.occupy(inst, () => {}), { kind: 'rejected', reason: 'site-changed' });
});

test('pending store: keyed by chunk, bounded, release forgets', () => {
  const p = new PendingSites();
  const a = cand('airship', 1, 1);
  const b = cand('windmill', 1, 1);
  p.hold({ cand: a, slice: 0, state: 'unloaded' });
  p.hold({ cand: b, slice: 0, state: 'validated', y: 65 });
  assert.deepEqual(p.inChunk('o', 1, 1).map((h) => h.cand.id), [a.id, b.id]);
  assert.deepEqual(p.unloaded().map((h) => h.cand.id), [a.id]);
  p.release(a.id);
  assert.deepEqual(p.inChunk('o', 1, 1).map((h) => h.cand.id), [b.id]);
  for (let i = 0; i < 1100; i++) p.hold({ cand: cand('airship', i, 50), slice: 0, state: 'unloaded' });
  assert.equal(p.size, 1024);
});

// ------------------------------------------------------------ engine adapter

/**
 * A Dimension double with the engine's measured behaviour: getTopmostBlock
 * skips liquids and throws in an unloaded chunk; getBlock returns undefined there.
 */
function fakeDimension(world) {
  const unloadedError = () => Object.assign(new Error('LocationInUnloadedChunkError'), { name: 'LocationInUnloadedChunkError' });
  return {
    heightRange: { min: world.minY, max: world.maxY },
    isChunkLoaded: ({ x, z }) => world.loadedAt(x, z),
    getTopmostBlock({ x, z }) {
      if (!world.loadedAt(x, z)) throw unloadedError();
      for (let y = world.maxY - 1; y >= world.minY; y--) {
        const t = world.type(x, y, z);
        if (t !== AIR && !/water|lava/.test(t)) return { typeId: t, location: { x, y, z } };
      }
      return undefined;
    },
    getBlock({ x, y, z }) {
      return world.loadedAt(x, z) ? { typeId: world.type(x, y, z) } : undefined;
    },
    containsBlock(vol, filter) {
      const { from, to } = vol;
      return world.view().contains([from.x, from.y, from.z], [to.x, to.y, to.z], filter.includeTypes) === true;
    },
  };
}
const engineApi = {
  BlockVolume: class { constructor(from, to) { this.from = from; this.to = to; } },
  BlockTypes: { get: (id) => (id === 'minecraft:pale_oak_planks' ? undefined : { id }) },
};

test('engine adapter: water under a liquid-skipping getTopmostBlock still counts as liquid', () => {
  const c = cand('windmill');
  const pond = new FakeWorld();
  pond.fillBox(c.x, 64, c.z, c.x + Math.floor(c.size[0] * 0.3), 64, c.z + c.size[2] - 1, 'minecraft:water');
  const view = m.dimensionView(fakeDimension(pond), engineApi);
  const top = view.topmost(c.x + 1, c.z + 1);
  assert.deepEqual(top, { y: 64, typeId: 'minecraft:water' });
  const checker = new SiteChecker(() => view, () => SALT);
  assert.deepEqual(checker.check(c), { kind: 'rejected', reason: 'liquid' });
  const sea = new FakeWorld();
  sea.fillBox(0, 64, 0, 3, 70, 3, 'minecraft:water');
  assert.deepEqual(m.dimensionView(fakeDimension(sea), engineApi).topmost(1, 1), { y: 70, typeId: 'minecraft:water' });
});

test('engine adapter: unloaded reads come back undefined, unknown block ids are dropped from queries', () => {
  const w = new FakeWorld();
  w.unload(0, 0);
  const view = m.dimensionView(fakeDimension(w), engineApi);
  assert.equal(view.topmost(1, 1), undefined);
  assert.equal(view.typeAt(1, 64, 1), undefined);
  const w2 = new FakeWorld();
  w2.set(1, 65, 1, 'minecraft:oak_planks');
  const v2 = m.dimensionView(fakeDimension(w2), engineApi);
  assert.equal(v2.contains([0, 60, 0], [3, 70, 3], ['minecraft:pale_oak_planks', 'minecraft:oak_planks']), true);
  assert.equal(v2.contains([0, 60, 0], [3, 70, 3], ['minecraft:pale_oak_planks']), false);
});
