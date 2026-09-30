// The charge's fall (L0-orbc-p002, -ad02, -as02) and the attack lifecycle
// (L0-orbc-p003, -ad03, -r009, -r010, -r011) over plain values: the cell
// sweep as a pure function, then src/orbital/flight.ts against a fake engine
// that records every interval, event subscription and entity read.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

async function load(contents, engineStub) {
  const plugin = {
    name: 'minecraft-server-stub',
    setup(pluginBuild) {
      pluginBuild.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: '@minecraft/server', namespace: 'mc-stub' }));
      pluginBuild.onLoad({ filter: /.*/, namespace: 'mc-stub' }, () => ({ contents: engineStub, loader: 'js' }));
    },
  };
  const bundle = await build({
    stdin: { contents, resolveDir: projectRoot, loader: 'ts' },
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    write: false,
    plugins: [plugin],
  });
  return import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64'));
}

// charge.ts must stay free of runtime engine imports: this stub throws on load if one appears.
const pure = await load(
  "export * from './src/orbital/charge.ts';",
  'throw new Error("src/orbital/charge.ts must stay free of runtime @minecraft/server imports");'
);
const { FALL_SPEED, sweepCells, fallStep, attackTag, attackIdOfTag, scopeOfAttack } = pure;

// ------------------------------------------------------------------ AC#9: the sweep

test('FALL_SPEED is one named constant of 1 block per tick (as02)', () => {
  assert.equal(FALL_SPEED, 1);
});

test('sweepCells: floor(y) − 1 down to floor(ny), top first, never below minY', () => {
  assert.deepEqual(sweepCells(10, 9, -64), [9]);
  assert.deepEqual(sweepCells(10.5, 9.5, -64), [9]);
  assert.deepEqual(sweepCells(10.5, 10.2, -64), [], 'feet stay inside cell 10: nothing is entered');
  assert.deepEqual(sweepCells(10, 9.7, -64), [9]);
  assert.deepEqual(sweepCells(10, 7.5, -64), [9, 8, 7]);
  assert.deepEqual(sweepCells(1, -2, 0), [0], 'cells below the dimension floor do not exist');
  assert.deepEqual(sweepCells(0, -1, 0), [], 'a charge whose feet are on the floor has nothing left to enter');
});

const SPEEDS = [0.25, 0.3, 0.5, FALL_SPEED, 1.5, 2, 2.5, 3.7, 7, 16, 40, 100, 1000];
const STARTS = [94, 94.5, 94.99, 93.01, 30.4];

test('no cell between the old and the new y is skipped or visited twice, at any speed', () => {
  for (const minY of [-64, 0]) {
    for (const speed of SPEEDS) {
      for (const start of STARTS) {
        const visited = [];
        let y = start;
        for (let guard = 0; guard < 100000; guard++) {
          const ny = y - speed;
          visited.push(...sweepCells(y, ny, minY));
          if (ny < minY) break;
          y = ny;
        }
        const expected = [];
        for (let c = Math.floor(start) - 1; c >= minY; c--) expected.push(c);
        assert.deepEqual(visited, expected, `speed ${speed}, start ${start}, minY ${minY}`);
      }
    }
  }
});

test('the first contact cell is found exactly, and the feet never enter it, at any speed', () => {
  const minY = -64;
  for (const speed of SPEEDS) {
    for (const start of STARTS) {
      for (let contact = Math.floor(start) - 1; contact >= minY; contact -= 7) {
        let y = start;
        let hit;
        for (let guard = 0; guard < 100000 && hit === undefined; guard++) {
          const step = fallStep(y, minY, (cellY) => (cellY === contact ? 'contact' : 'clear'), speed);
          if (step.kind === 'contact') hit = step.cellY;
          else if (step.kind === 'move') {
            assert.ok(Math.floor(step.y) > contact, `speed ${speed}: feet entered the contact cell ${contact} at y=${step.y}`);
            y = step.y;
          } else assert.fail(`speed ${speed}, start ${start}: ${step.kind} above a contact at ${contact}`);
        }
        assert.equal(hit, contact, `speed ${speed}, start ${start}`);
      }
    }
  }
});

test('fallStep: the first contact top-down wins; the lower one is never reported', () => {
  const read = (cellY) => (cellY === 5 || cellY === 3 ? 'contact' : 'clear');
  assert.deepEqual(fallStep(8, -64, read, 10), { kind: 'contact', cellY: 5 });
});

test('fallStep: an unloaded cell before any contact makes the charge lost', () => {
  const read = (cellY) => (cellY === 6 ? 'unloaded' : cellY === 4 ? 'contact' : 'clear');
  assert.deepEqual(fallStep(8, -64, read, 10), { kind: 'lost', cellY: 6 });
  assert.deepEqual(fallStep(8, -64, (c) => (c === 7 ? 'contact' : c === 6 ? 'unloaded' : 'clear'), 10), { kind: 'contact', cellY: 7 });
});

test('fallStep: void only once the next y is below minY with no contact, and a contact on the floor cell still counts', () => {
  const clear = () => 'clear';
  assert.deepEqual(fallStep(1, 0, clear), { kind: 'move', y: 0 });
  assert.deepEqual(fallStep(0, 0, clear), { kind: 'void' });
  assert.deepEqual(fallStep(1, 0, (c) => (c === 0 ? 'contact' : 'clear')), { kind: 'contact', cellY: 0 });
  assert.deepEqual(fallStep(5, 0, clear, 40), { kind: 'void' });
});

test('attack tags carry the attack id, and the id carries its runtime scope', () => {
  assert.equal(attackIdOfTag(attackTag('gt-10-3')), 'gt-10-3');
  assert.equal(attackIdOfTag('andrew:oc_charge'), undefined);
  assert.equal(scopeOfAttack('oc-120-7'), 'oc');
  assert.equal(scopeOfAttack('gt-5-1'), 'gt');
  assert.equal(scopeOfAttack('bare'), 'bare');
});

// ------------------------------------------------------------------ flight.ts against a fake engine

const engineStub = `
const mc = (globalThis.__flightMc = { tick: 0, intervals: new Map(), runs: [], nextId: 1, subscribed: [], signals: {}, dims: new Map(), entityReads: 0 });
export class LocationInUnloadedChunkError extends Error {}
mc.LocationInUnloadedChunkError = LocationInUnloadedChunkError;
export const system = {
  get currentTick() { return mc.tick; },
  runInterval(cb, every) { if (every !== 1) throw new Error('interval of ' + every); const id = mc.nextId++; mc.intervals.set(id, cb); return id; },
  clearRun(id) { mc.intervals.delete(id); },
  run(cb) { mc.runs.push(cb); return mc.nextId++; },
};
function signal(name) {
  return {
    handlers: [],
    subscribe(cb) { mc.subscribed.push(name); this.handlers.push(cb); return cb; },
    unsubscribe(cb) { this.handlers = this.handlers.filter((h) => h !== cb); },
  };
}
export const world = {
  afterEvents: new Proxy({}, { get(t, name) { if (!(name in t)) t[name] = mc.signals[name] = signal(name); return t[name]; } }),
  getDimension(id) {
    const d = mc.dims.get(String(id).replace('minecraft:', ''));
    if (!d) throw new Error('no dimension ' + id);
    return d;
  },
};
`;

const flight = await load(
  ["export * from './src/orbital/flight.ts';", "export { registerEffect } from './src/orbital/charge.ts';"].join('\n'),
  engineStub
);
const mc = globalThis.__flightMc;
const warnings = [];
console.warn = (msg) => warnings.push(String(msg));

const CHARGE = 'andrew:orbital_charge';
const LIQUIDS = new Set(['minecraft:water', 'minecraft:flowing_water', 'minecraft:lava']);

class FakeEntity {
  constructor(dim, typeId, location, tags = []) {
    this.id = String(1000 + mc.nextId++);
    this.dim = dim;
    this.typeId = typeId;
    this.location = { ...location };
    this.tags = new Set(tags);
    this.isValid = true;
    this.trail = [location.y];
    dim.entities.push(this);
  }
  getTags() {
    if (!this.isValid) throw new Error('invalid entity');
    return [...this.tags];
  }
  teleport(location) {
    if (!this.isValid) throw new Error('invalid entity');
    if (this.explodeOnTeleport) throw new Error('teleport exploded');
    this.location = { ...location };
    this.trail.push(location.y);
  }
  remove() {
    if (!this.isValid) throw new Error('invalid entity');
    this.isValid = false;
    this.removedTick = mc.tick;
  }
}

class FakeDimension {
  constructor(name, min, max) {
    this.id = `minecraft:${name}`;
    this.heightRange = { min, max };
    this.blocks = new Map();
    this.entities = [];
    this.unloaded = new Set();
    this.throwing = new Set();
    mc.dims.set(name, this);
  }
  set(x, y, z, typeId) {
    this.blocks.set(`${x},${y},${z}`, typeId);
  }
  getBlock({ x, y, z }) {
    const column = `${x},${z}`;
    if (this.throwing.has(column)) throw new mc.LocationInUnloadedChunkError('unloaded');
    if (this.unloaded.has(column)) return undefined;
    const typeId = this.blocks.get(`${x},${y},${z}`) ?? 'minecraft:air';
    return { typeId, isAir: typeId === 'minecraft:air', isLiquid: LIQUIDS.has(typeId), permutation: { getState: () => undefined } };
  }
  getEntities({ type } = {}) {
    mc.entityReads++;
    return this.entities.filter((e) => e.isValid && (type === undefined || e.typeId === type));
  }
}

const overworld = new FakeDimension('overworld', -64, 320);
const nether = new FakeDimension('nether', 0, 128);
const theEnd = new FakeDimension('the_end', 0, 256);

function tick(n = 1) {
  for (let i = 0; i < n; i++) {
    mc.tick++;
    for (const run of mc.runs.splice(0)) run();
    for (const cb of [...mc.intervals.values()]) cb();
  }
}

const detonations = [];
const recorder = {
  layout: (t) => [{ x: t.x, z: t.z }],
  scale: 0,
  onDetonate(dim, point, ownerId, mode, attackId) {
    const holder = flight.activeAttacks().get(attackId)?.charges.find((c) => c.x === point.x && c.z === point.z);
    detonations.push({ dim: dim.id, point: { ...point }, ownerId, mode, attackId, tick: mc.tick, entityValid: holder?.entity.isValid });
  },
};
flight.registerEffect('lmb', recorder);
flight.registerEffect('rmb', recorder);

flight.registerFlight('oc');

let seq = 0;
function attackOf(dim, columns, spawnY, { mode = 'rmb', ownerId = '-4294967295', createdTick = mc.tick } = {}) {
  const attackId = flight.newAttackId(mc.tick) + `x${++seq}`;
  const charges = columns.map((c, slot) => ({
    entity: new FakeEntity(dim, CHARGE, { x: c.x + 0.5, y: spawnY, z: c.z + 0.5 }, ['andrew:oc_charge', attackTag(attackId)]),
    slot,
    x: c.x,
    z: c.z,
    y: spawnY,
  }));
  return { attackId, mode, ownerId, dimensionId: dim.id, target: { x: columns[0].x, y: 0, z: columns[0].z }, face: undefined, spawnY, charges, createdTick };
}

const ends = [];
flight.observeChargeEnds((e) => ends.push({ outcome: e.outcome, attackId: e.attack.attackId, point: e.point, tick: e.tick, valid: e.charge.entity.isValid }));

function settle(limit = 2000) {
  for (let i = 0; i < limit && flight.activeAttacks().size > 0; i++) tick();
  tick();
}

test('no subscription to the owner: only entityLoad, entitySpawn and worldLoad (r010)', () => {
  assert.deepEqual([...new Set(mc.subscribed)].sort(), ['entityLoad', 'entitySpawn', 'worldLoad']);
});

test('attack ids carry this runtime\'s scope', () => {
  assert.match(flight.newAttackId(77), /^oc-77-\d+$/);
});

test('one shared interval: none before the first attack, one for several, cleared with the last, restarted by the next (ad02, C-5a′)', () => {
  const before = flight.flightLoop();
  assert.equal(before.running, false);
  assert.equal(mc.intervals.size, 0);
  overworld.set(0, 0, 0, 'minecraft:stone');
  overworld.set(5, 0, 5, 'minecraft:stone');
  const a = attackOf(overworld, [{ x: 0, z: 0 }], 10);
  const b = attackOf(overworld, [{ x: 5, z: 5 }], 20);
  const c = attackOf(theEnd, [{ x: 9, z: 9 }], 3);
  flight.launch(a);
  flight.launch(b);
  flight.launch(c);
  assert.equal(mc.intervals.size, 1, 'one interval for three attacks');
  assert.equal(flight.flightLoop().starts, before.starts + 1);
  tick(9);
  assert.equal(flight.activeAttacks().size, 2, 'the End charge voided, the two others still fall');
  tick(1);
  assert.equal(flight.activeAttacks().has(a.attackId), false, 'a detonated on its 10th tick');
  assert.equal(mc.intervals.size, 1);
  settle();
  assert.equal(flight.activeAttacks().size, 0);
  assert.equal(mc.intervals.size, 0, 'the interval is cleared with the last attack');
  const after = flight.flightLoop();
  assert.deepEqual([after.running, after.starts, after.stops], [false, before.starts + 1, before.stops + 1]);
  assert.ok(after.steps > before.steps && after.ms >= 0, 'every step is counted and timed');
  tick(5);
  assert.equal(mc.intervals.size, 0, 'no idle loop');
  flight.launch(attackOf(overworld, [{ x: 0, z: 0 }], 3));
  assert.equal(flight.flightLoop().starts, before.starts + 2);
  settle();
  assert.equal(mc.intervals.size, 0);
});

test('detonation: the contact block itself, once per charge, before its entity is removed, never in the firing tick', () => {
  detonations.length = 0;
  overworld.set(20, 4, 20, 'minecraft:stone');
  const attack = attackOf(overworld, [{ x: 20, z: 20 }], 34, { mode: 'lmb', ownerId: '-111' });
  const entity = attack.charges[0].entity;
  const fired = mc.tick;
  flight.launch(attack);
  const readsBefore = mc.entityReads;
  settle();
  assert.equal(detonations.length, 1);
  const d = detonations[0];
  assert.deepEqual(d.point, { x: 20, y: 4, z: 20 }, 'the block hit, not the air above it');
  assert.equal(d.dim, 'minecraft:overworld');
  assert.equal(d.ownerId, '-111');
  assert.equal(d.mode, 'lmb');
  assert.equal(d.attackId, attack.attackId);
  assert.equal(d.entityValid, true, 'onDetonate runs before the entity is removed');
  assert.equal(entity.isValid, false);
  assert.equal(entity.removedTick, d.tick, 'removed in the detonation tick');
  assert.equal(d.tick - fired, 30, '34 → 5 is 29 moves; the 30th step reads the stone under y=5');
  assert.deepEqual(entity.trail, Array.from({ length: 30 }, (_, i) => 34 - i), 'y drops by FALL_SPEED every tick, monotonic');
  assert.equal(mc.entityReads, readsBefore, 'the flight never queries entities');
});

test('liquids and pass-through blocks never stop a charge: water 5 deep and tall grass over stone detonate on the stone (r008)', () => {
  detonations.length = 0;
  overworld.set(30, 0, 30, 'minecraft:stone');
  for (let y = 1; y <= 5; y++) overworld.set(30, y, 30, 'minecraft:water');
  overworld.set(31, 0, 31, 'minecraft:stone');
  overworld.set(31, 1, 31, 'minecraft:short_grass');
  overworld.set(31, 2, 31, 'minecraft:torch');
  flight.launch(attackOf(overworld, [{ x: 30, z: 30 }, { x: 31, z: 31 }], 30));
  settle();
  assert.deepEqual(detonations.map((d) => d.point).sort((a, b) => a.x - b.x), [{ x: 30, y: 0, z: 30 }, { x: 31, y: 0, z: 31 }]);
});

test('void: an empty End column ends below heightRange.min with no onDetonate and no entity left (r009)', () => {
  detonations.length = 0;
  ends.length = 0;
  const attack = attackOf(theEnd, [{ x: 400, z: 0 }], 90, { mode: 'lmb' });
  const entity = attack.charges[0].entity;
  const fired = mc.tick;
  flight.launch(attack);
  settle();
  assert.equal(detonations.length, 0);
  assert.equal(entity.isValid, false);
  assert.equal(Math.min(...entity.trail), 0, 'the last position is the floor cell, never below it');
  assert.deepEqual(ends.map((e) => e.outcome), ['voided']);
  assert.equal(ends[0].tick - fired, 91, '90 → 0 is 90 moves, the 91st step finds the next y below min');
  assert.equal(theEnd.getEntities({ type: CHARGE }).length, 0);
});

test('lost: an invalid entity, an unloaded next cell (undefined or LocationInUnloadedChunkError) — no effect, removed when it can be (r011)', () => {
  detonations.length = 0;
  ends.length = 0;
  for (const x of [40, 41, 42]) overworld.set(x, 0, 0, 'minecraft:stone');
  const attack = attackOf(overworld, [{ x: 40, z: 0 }, { x: 41, z: 0 }, { x: 42, z: 0 }], 20);
  flight.launch(attack);
  tick(3);
  const [gone, undef, thrown] = attack.charges.map((c) => c.entity);
  gone.isValid = false;
  overworld.unloaded.add('41,0');
  overworld.throwing.add('42,0');
  tick(1);
  assert.equal(flight.activeAttacks().has(attack.attackId), false, 'the attack ends when its last charge is lost');
  assert.deepEqual(ends.map((e) => e.outcome), ['lost', 'lost', 'lost']);
  assert.equal(detonations.length, 0);
  assert.equal(undef.isValid, false, 'a valid entity whose next cell is unloaded is removed');
  assert.equal(thrown.isValid, false);
  overworld.unloaded.clear();
  overworld.throwing.clear();
});

test('a bad charge is dropped alone: the others of its attack and of other attacks keep falling and detonate', () => {
  detonations.length = 0;
  ends.length = 0;
  for (const x of [50, 51, 52]) overworld.set(x, 0, 0, 'minecraft:stone');
  const attack = attackOf(overworld, [{ x: 50, z: 0 }, { x: 51, z: 0 }], 10);
  const other = attackOf(overworld, [{ x: 52, z: 0 }], 10);
  attack.charges[0].entity.explodeOnTeleport = true;
  flight.launch(attack);
  flight.launch(other);
  settle();
  assert.deepEqual(detonations.map((d) => d.point.x).sort(), [51, 52]);
  assert.deepEqual(ends.map((e) => e.outcome).sort(), ['detonated', 'detonated', 'lost']);
  assert.ok(warnings.some((w) => w.includes('teleport exploded') && w.includes('dropped as lost')));
  assert.equal(attack.charges.length, 0);
});

test('timeout: 400 ticks after firing the rest is dropped as lost, with a warning and no effect', () => {
  detonations.length = 0;
  ends.length = 0;
  const deep = new FakeDimension('deep', -5000, 320);
  const attack = attackOf(deep, [{ x: 0, z: 0 }], 300);
  const fired = mc.tick;
  flight.launch(attack);
  settle();
  assert.equal(detonations.length, 0);
  assert.deepEqual(ends.map((e) => e.outcome), ['timeout']);
  assert.equal(ends[0].tick - fired, flight.ATTACK_TIMEOUT_TICKS);
  assert.equal(attack.charges.length, 0);
  assert.ok(warnings.some((w) => w.includes(attack.attackId) && w.includes('dropped as lost')));
});

test('endAttack removes every charge it holds and clears the interval when it was the last', () => {
  const attack = attackOf(overworld, [{ x: 60, z: 0 }, { x: 61, z: 0 }], 50);
  flight.launch(attack);
  const entities = attack.charges.map((c) => c.entity);
  tick(2);
  flight.endAttack(attack.attackId);
  assert.ok(entities.every((e) => !e.isValid));
  assert.equal(flight.activeAttacks().size, 0);
  assert.equal(mc.intervals.size, 0);
});

// ------------------------------------------------------------------ orphan sweeps (p003 step 3)

function emit(name, event) {
  for (const h of mc.signals[name]?.handlers ?? []) h(event);
}

test('entitySpawn: a charge no live attack of this scope holds is removed a tick later; live, foreign-scope and other entities stay', () => {
  const live = attackOf(overworld, [{ x: 70, z: 0 }], 200);
  flight.launch(live);
  const untagged = new FakeEntity(overworld, CHARGE, { x: 71.5, y: 5, z: 0.5 });
  const staleOwn = new FakeEntity(overworld, CHARGE, { x: 72.5, y: 5, z: 0.5 }, [attackTag('oc-1-99')]);
  const foreign = new FakeEntity(overworld, CHARGE, { x: 73.5, y: 5, z: 0.5 }, [attackTag('gt-1-99')]);
  const cow = new FakeEntity(overworld, 'minecraft:cow', { x: 74.5, y: 5, z: 0.5 });
  const dead = new FakeEntity(overworld, CHARGE, { x: 75.5, y: 5, z: 0.5 });
  dead.isValid = false;
  const before = flight.orphanCounts().spawn;
  for (const entity of [live.charges[0].entity, untagged, staleOwn, foreign, cow, dead]) emit('entitySpawn', { entity });
  assert.equal(untagged.isValid, true, 'deferred: the core tags a charge right after spawnEntity');
  tick(1);
  assert.equal(untagged.isValid, false);
  assert.equal(staleOwn.isValid, false);
  assert.equal(live.charges[0].entity.isValid, true);
  assert.equal(foreign.isValid, true, "another runtime's charge is left to it");
  assert.equal(cow.isValid, true);
  assert.equal(flight.orphanCounts().spawn, before + 2);
  flight.endAttack(live.attackId);
  foreign.isValid = false;
});

test('entityLoad: a charge lost to an unload comes back as an orphan and is removed at once, even while its attack still flies', () => {
  const attack = attackOf(overworld, [{ x: 80, z: 0 }, { x: 81, z: 0 }], 200);
  flight.launch(attack);
  tick(2);
  const [unloaded, flying] = attack.charges.map((c) => c.entity);
  unloaded.isValid = false;
  tick(1);
  assert.equal(attack.charges.length, 1, 'the unloaded charge was dropped as lost');
  unloaded.isValid = true;
  emit('entityLoad', { entity: unloaded });
  assert.equal(unloaded.isValid, false, 'removed in the load event itself');
  emit('entityLoad', { entity: flying });
  assert.equal(flying.isValid, true, 'a charge its attack still holds is kept');
  flight.endAttack(attack.attackId);
});

test('an orphan never detonates: removal goes through no effect', () => {
  detonations.length = 0;
  const orphan = new FakeEntity(overworld, CHARGE, { x: 90.5, y: 1, z: 0.5 }, [attackTag('oc-3-3')]);
  emit('entityLoad', { entity: orphan });
  tick(3);
  assert.equal(orphan.isValid, false);
  assert.equal(detonations.length, 0);
});

test('startup: a tick after worldLoad every charge in every dimension is removed, any scope, other entities kept', () => {
  const left = [
    new FakeEntity(overworld, CHARGE, { x: 0.5, y: 90, z: 0.5 }, [attackTag('oc-9-9')]),
    new FakeEntity(nether, CHARGE, { x: 0.5, y: 90, z: 0.5 }, [attackTag('gt-9-9')]),
    new FakeEntity(theEnd, CHARGE, { x: 0.5, y: 90, z: 0.5 }),
  ];
  const pig = new FakeEntity(overworld, 'minecraft:pig', { x: 0.5, y: 1, z: 0.5 });
  const before = flight.orphanCounts().startup;
  emit('worldLoad', {});
  assert.ok(left.every((e) => e.isValid), 'deferred to system.run');
  tick(1);
  assert.ok(left.every((e) => !e.isValid));
  assert.equal(pig.isValid, true);
  assert.equal(flight.orphanCounts().startup, before + 3);
  assert.ok(warnings.some((w) => w.includes('startup sweep: 3 stale charge(s) removed')));
});
