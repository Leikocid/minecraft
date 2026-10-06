// The Sculk Crossbow bolt loop and swap off the engine (L0-sclk-p002, p003, ent3, R-sclk-001, K-sclk-1).
//
// src/sculk/bolt.ts is bundled against an in-memory @minecraft/server whose events the test fires and
// whose ticks it steps by hand. Bolts move by their velocity, nothing else. The GameTest twin in
// src/gametest/sculk-bolt.ts flies real bolts on BDS.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const engineStub = `
const mc = (globalThis.__mc = { handlers: {}, intervals: new Map(), intervalCalls: 0, nextRun: 1, tick: 0 });
const signal = (name) => ({
  subscribe(fn) {
    (mc.handlers[name] ??= []).push(fn);
    return fn;
  },
  unsubscribe(fn) {
    mc.handlers[name] = (mc.handlers[name] ?? []).filter((f) => f !== fn);
  },
});
export const world = {
  afterEvents: new Proxy({}, { get: (_, name) => signal(name) }),
  beforeEvents: new Proxy({}, { get: (_, name) => signal("before:" + name) }),
  getDynamicProperty: () => undefined,
  setDynamicProperty() {},
};
export const system = {
  get currentTick() {
    return mc.tick;
  },
  run(fn) {
    fn();
    return mc.nextRun++;
  },
  runInterval(fn) {
    const id = mc.nextRun++;
    mc.intervals.set(id, fn);
    mc.intervalCalls++;
    return id;
  },
  clearRun(id) {
    mc.intervals.delete(id);
  },
};
export const EntityComponentTypes = { Projectile: "minecraft:projectile", Equippable: "minecraft:equippable", Inventory: "minecraft:inventory" };
export const EquipmentSlot = { Mainhand: "Mainhand", Offhand: "Offhand" };
export class Player {}
mc.Player = Player;
`;

const minecraftServerStub = {
  name: 'minecraft-server-stub',
  setup(pluginBuild) {
    pluginBuild.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: '@minecraft/server', namespace: 'mc-stub' }));
    pluginBuild.onLoad({ filter: /.*/, namespace: 'mc-stub' }, () => ({ contents: engineStub, loader: 'js' }));
  },
};

const bundle = await build({
  entryPoints: [join(projectRoot, 'src', 'sculk', 'bolt.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  plugins: [minecraftServerStub],
});
const realWarn = console.warn;
const lines = [];
console.warn = (msg) => lines.push(String(msg));
const bolt = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64'));
const mc = globalThis.__mc;

// ---------------------------------------------------------------- the fake world

let nextId = 1;
const live = new Set();

class Entity {
  constructor(typeId, dimension, location, velocity = { x: 0, y: 0, z: 0 }) {
    this.typeId = typeId;
    this.id = String(nextId++);
    this.dimension = dimension;
    this.location = { ...location };
    this.velocity = { ...velocity };
    this.isValid = true;
    this.components = {};
    live.add(this);
  }
  getVelocity() {
    return { ...this.velocity };
  }
  getComponent(type) {
    return this.components[type];
  }
  remove() {
    if (!this.isValid) throw new Error('InvalidEntityError');
    this.isValid = false;
    live.delete(this);
  }
}

function makePlayer(dimension, mainhand, offhand) {
  const p = Object.create(mc.Player.prototype);
  Object.assign(p, { typeId: 'minecraft:player', id: String(nextId++), name: `p${nextId}`, isValid: true, dimension });
  const stack = (typeId) => (typeId === undefined ? undefined : { typeId, getDynamicProperty: () => undefined });
  const hands = { Mainhand: stack(mainhand), Offhand: stack(offhand) };
  p.getComponent = (type) => (type === 'minecraft:equippable' ? { getEquipment: (slot) => hands[slot] } : undefined);
  return p;
}

function makeDimension({ loaded = () => true } = {}) {
  const dim = {
    id: 'minecraft:overworld',
    heightRange: { min: -64, max: 320 },
    particles: [],
    isChunkLoaded: (at) => loaded(at),
    spawnParticle(id, at) {
      dim.particles.push({ id, at, tick: mc.tick });
    },
    spawnEntity(typeId, at) {
      const e = new Entity(typeId, dim, at);
      e.components['minecraft:projectile'] = {
        owner: undefined,
        shoot(v) {
          e.velocity = { ...v };
        },
      };
      return e;
    },
  };
  return dim;
}

function arrowOf(dim, owner, velocity = { x: 0, y: 0, z: 3 }) {
  const a = new Entity('minecraft:arrow', dim, { x: 0.5, y: 10, z: 0.5 }, velocity);
  a.components['minecraft:projectile'] = { owner };
  return a;
}

function fire(name, event) {
  for (const fn of mc.handlers[name] ?? []) fn(event);
}

/** One server tick: projectiles move, then the script intervals run. */
function tick(n = 1) {
  for (let i = 0; i < n; i++) {
    mc.tick++;
    for (const e of live) {
      if (e.typeId !== bolt.BOLT_ID) continue;
      e.location = { x: e.location.x + e.velocity.x, y: e.location.y + e.velocity.y, z: e.location.z + e.velocity.z };
    }
    for (const fn of [...mc.intervals.values()]) fn();
  }
}

const events = [];
bolt.observeBolts((e) => events.push({ tick: mc.tick, kind: e.kind, id: e.record.id, reason: e.reason, record: e.record }));
const endingsOf = (id) => events.filter((e) => e.id === id && (e.kind === 'entity' || e.kind === 'block' || e.kind === 'expired'));
const yaw = (v) => (Math.atan2(v.x, v.z) * 180) / Math.PI;

function settleAll() {
  for (const e of [...live]) if (e.typeId === bolt.BOLT_ID) e.remove();
  tick(3);
  events.length = 0;
}

// ---------------------------------------------------------------- tests

test('registering arms four event subscriptions and no interval', () => {
  bolt.registerBolts();
  bolt.registerBolts();
  for (const name of ['entitySpawn', 'projectileHitEntity', 'projectileHitBlock', 'entityLoad']) {
    assert.equal(mc.handlers[name]?.length, 1, `${name} subscribed once`);
  }
  assert.equal(mc.intervals.size, 0);
  assert.equal(bolt.boltLoopRunning(), false);
});

test('K-sclk-1: arrows that are not the crossbow\'s start nothing and stay in the world', () => {
  const dim = makeDimension();
  const zombie = new Entity('minecraft:zombie', dim, { x: 0, y: 0, z: 0 });
  const ownerless = arrowOf(dim, undefined);
  const skeleton = arrowOf(dim, new Entity('minecraft:skeleton', dim, { x: 0, y: 0, z: 0 }));
  const vanilla = arrowOf(dim, makePlayer(dim, 'minecraft:crossbow'));
  const offhandOnly = arrowOf(dim, makePlayer(dim, 'minecraft:crossbow', 'andrew:sculk_crossbow'));
  for (const entity of [zombie, ownerless, skeleton, vanilla, offhandOnly]) fire('entitySpawn', { entity });
  tick(5);
  assert.equal(mc.intervalCalls, 0, 'no interval was ever created');
  assert.equal(events.length, 0);
  for (const a of [ownerless, skeleton, vanilla, offhandOnly]) assert.equal(a.isValid, true, 'the arrow is left alone');
});

test('p002: a main-hand crossbow arrow becomes one bolt in its spawn tick, with the arrow\'s velocity and owner', () => {
  const dim = makeDimension();
  const p = makePlayer(dim, 'andrew:sculk_crossbow');
  const arrow = arrowOf(dim, p, { x: 0.2, y: 0.1, z: 3 });
  fire('entitySpawn', { entity: arrow });
  assert.equal(arrow.isValid, false, 'the arrow is removed');
  const launched = events.filter((e) => e.kind === 'launched');
  assert.equal(launched.length, 1);
  const r = launched[0].record;
  assert.equal(r.ownerId, p.id);
  assert.equal(r.bornTick, mc.tick);
  assert.deepEqual(r.velocity, { x: 0.2, y: 0.1, z: 3 });
  assert.equal(r.bolt.getComponent('minecraft:projectile').owner, p);
  assert.deepEqual(r.bolt.getVelocity(), { x: 0.2, y: 0.1, z: 3 });
  assert.equal(bolt.boltLoopRunning(), true);
  settleAll();
});

test('R-sclk-001: a Multishot volley is three records turned 0/−10/+10°, on one interval', () => {
  const dim = makeDimension();
  const p = makePlayer(dim, 'andrew:sculk_crossbow');
  const before = mc.intervalCalls;
  for (let i = 0; i < 3; i++) fire('entitySpawn', { entity: arrowOf(dim, p) });
  const records = events.filter((e) => e.kind === 'launched').map((e) => e.record);
  assert.equal(records.length, 3);
  assert.equal(new Set(records.map((r) => r.id)).size, 3);
  assert.equal(new Set(records.map((r) => r.volleyId)).size, 1);
  assert.deepEqual(records.map((r) => r.volleyIndex), [0, 1, 2]);
  assert.deepEqual(records.map((r) => Math.round(yaw(r.velocity) * 1000) / 1000), [0, -10, 10]);
  for (const r of records) assert.ok(Math.abs(Math.hypot(r.velocity.x, r.velocity.y, r.velocity.z) - 3) < 1e-9, 'speed kept');
  assert.equal(mc.intervalCalls - before, 1, 'one interval for the three');
  assert.equal(mc.intervals.size, 1);

  // A shot in a later tick starts a new volley, unturned.
  tick();
  fire('entitySpawn', { entity: arrowOf(dim, p) });
  const next = events.filter((e) => e.kind === 'launched').at(-1).record;
  assert.equal(next.volleyIndex, 0);
  assert.notEqual(next.volleyId, records[0].volleyId);
  assert.equal(mc.intervalCalls - before, 1, 'still the same interval');
  settleAll();
});

test('R-sclk-001: each bolt resolves once; a second event for it is a no-op; the interval ends with the last', () => {
  const dim = makeDimension();
  const p = makePlayer(dim, 'andrew:sculk_crossbow');
  for (let i = 0; i < 3; i++) fire('entitySpawn', { entity: arrowOf(dim, p) });
  const [a, b, c] = events.filter((e) => e.kind === 'launched').map((e) => e.record);
  tick();
  const target = new Entity('minecraft:zombie', dim, { x: 0, y: 0, z: 0 });
  // remove_on_hit has taken the bolt off before the handler runs.
  a.bolt.remove();
  fire('projectileHitEntity', { projectile: a.bolt, dimension: dim, location: a.bolt.location, getEntityHit: () => ({ entity: target }) });
  fire('projectileHitBlock', { projectile: a.bolt, dimension: dim, location: a.bolt.location, getBlockHit: () => ({ block: { typeId: 'minecraft:stone', location: { x: 0, y: 0, z: 0 } }, face: 'North' }) });
  b.bolt.remove();
  fire('projectileHitBlock', { projectile: b.bolt, dimension: dim, location: b.bolt.location, getBlockHit: () => ({ block: { typeId: 'minecraft:stone', location: { x: 1, y: 0, z: 0 } }, face: 'North' }) });
  assert.deepEqual(endingsOf(a.id).map((e) => e.kind), ['entity']);
  assert.deepEqual(endingsOf(b.id).map((e) => e.kind), ['block']);
  assert.equal(bolt.liveBoltCount(), 1);
  assert.equal(bolt.boltLoopRunning(), true);
  tick(bolt.BOLT_LIFETIME_TICKS);
  assert.deepEqual(endingsOf(c.id).map((e) => [e.kind, e.reason]), [['expired', 'lifetime']]);
  assert.equal(c.bolt.isValid, false, 'the expired bolt is removed');
  assert.equal(bolt.boltLoopRunning(), false);
  assert.equal(mc.intervals.size, 0, 'no periodic work is left');
  events.length = 0;
});

test('p003: lifetime ends a bolt at age 100 exactly, with the trail drawn every tick before it', () => {
  const dim = makeDimension();
  const r = bolt.launchBolt(makePlayer(dim), dim, { x: 0, y: 0, z: 0 }, { x: 0, y: 0.5, z: 0 });
  tick(bolt.BOLT_LIFETIME_TICKS - 1);
  assert.equal(endingsOf(r.id).length, 0);
  tick();
  const end = endingsOf(r.id);
  assert.deepEqual(end.map((e) => e.reason), ['lifetime']);
  assert.equal(end[0].tick - r.bornTick, bolt.BOLT_LIFETIME_TICKS);
  const trailTicks = events.filter((e) => e.id === r.id && e.kind === 'trail').length;
  assert.equal(trailTicks, bolt.BOLT_LIFETIME_TICKS - 1);
  events.length = 0;
});

test('R-sclk-007: at most TRAIL_PER_TICK particles per bolt per tick, on the real segment', () => {
  const dim = makeDimension();
  const r = bolt.launchBolt(makePlayer(dim), dim, { x: 0, y: 0, z: 0 }, { x: 0, y: -0.5, z: 7 });
  tick();
  const ps = dim.particles.filter((p) => p.tick === mc.tick);
  assert.equal(ps.length, bolt.TRAIL_PER_TICK);
  assert.equal(ps[0].id, bolt.TRAIL_PARTICLE);
  assert.deepEqual(ps.at(-1).at, r.bolt.location);
  for (const p of ps) assert.ok(p.at.z > 0 && p.at.z <= 7 && p.at.y < 0 && p.at.y >= -0.5, 'on the segment just flown');
  r.bolt.velocity = { x: 0, y: 0, z: 0.4 };
  tick();
  assert.equal(dim.particles.filter((p) => p.tick === mc.tick).length, 1, 'a short segment gets one ring');
  settleAll();
});

test('p003: the Void and the edge of the loaded chunks end a bolt with no outcome', () => {
  const dim = makeDimension({ loaded: (at) => at.x < 32 });
  const owner = makePlayer(dim);
  const down = bolt.launchBolt(owner, dim, { x: 0, y: -60, z: 0 }, { x: 0, y: -3, z: 0 });
  const east = bolt.launchBolt(owner, dim, { x: 20, y: 0, z: 0 }, { x: 3, y: 0, z: 0 });
  const high = bolt.launchBolt(owner, dim, { x: 0, y: 330, z: 0 }, { x: 0, y: 1, z: 0 });
  tick(2);
  assert.deepEqual(endingsOf(down.id).map((e) => e.reason), ['void']);
  assert.deepEqual(endingsOf(east.id).map((e) => e.reason), [], 'still inside at x 26');
  tick(2);
  assert.deepEqual(endingsOf(east.id).map((e) => e.reason), ['unloaded'], 'taken off at x 29, before x 32');
  assert.ok(east.bolt.location.x < 32);
  assert.deepEqual(endingsOf(high.id), [], 'above the build limit is not unloaded');
  assert.equal(down.bolt.isValid, false);
  assert.equal(east.bolt.isValid, false);
  settleAll();
});

test('the hit event may arrive after the interval saw the bolt invalid; it still wins within the grace', () => {
  const dim = makeDimension();
  const r = bolt.launchBolt(makePlayer(dim), dim, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 3 });
  tick();
  r.bolt.remove();
  tick();
  assert.deepEqual(endingsOf(r.id), [], 'not ended in the tick it vanished');
  fire('projectileHitBlock', { projectile: r.bolt, dimension: dim, location: r.bolt.location, getBlockHit: () => ({ block: { typeId: 'minecraft:stone', location: { x: 0, y: 0, z: 6 } }, face: 'North' }) });
  assert.deepEqual(endingsOf(r.id).map((e) => e.kind), ['block']);

  const lost = bolt.launchBolt(makePlayer(dim), dim, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 3 });
  tick();
  lost.bolt.remove();
  tick(3);
  assert.deepEqual(endingsOf(lost.id).map((e) => e.reason), ['gone'], 'no hit came: gone, no outcome');
  assert.equal(mc.intervals.size, 0);
  events.length = 0;
});

test('p003: a bolt that stops moving has left the ticked chunks and ends stalled, drawing nothing while still', () => {
  const dim = makeDimension();
  const r = bolt.launchBolt(makePlayer(dim), dim, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 3 });
  tick(3);
  const before = dim.particles.length;
  r.bolt.velocity = { x: 0, y: 0, z: 0 };
  tick();
  assert.deepEqual(endingsOf(r.id), [], 'one still step is not yet a stall');
  tick();
  assert.deepEqual(endingsOf(r.id).map((e) => e.reason), ['stalled']);
  assert.equal(dim.particles.length, before, 'no ring is drawn in place');
  assert.equal(r.bolt.isValid, false);
  assert.equal(mc.intervals.size, 0);
  events.length = 0;
});

test('C-23: a bolt that comes back through entityLoad is removed, record or not', () => {
  const dim = makeDimension();
  const stray = dim.spawnEntity(bolt.BOLT_ID, { x: 0, y: 0, z: 0 });
  fire('entityLoad', { entity: stray });
  assert.equal(stray.isValid, false);
  const r = bolt.launchBolt(makePlayer(dim), dim, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 });
  fire('entityLoad', { entity: r.bolt });
  assert.equal(r.bolt.isValid, false);
  assert.deepEqual(endingsOf(r.id).map((e) => [e.kind, e.reason]), [['expired', 'unloaded']]);
  assert.equal(mc.intervals.size, 0);
  console.warn = realWarn;
});
