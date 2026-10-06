// The Sculk Crossbow entity hit off the engine (L0-sclk-p004, r002, r004, xasm24; T06–T10, T17 node half).
//
// src/sculk/patch.ts is bundled with no @minecraft/server at all. src/sculk/hit.ts is bundled with the real bolt
// pipeline and carve queue against an in-memory engine whose damage model is the one diagnose-CNTR-X22 measured:
// a 10-tick hurt window from the last landed hit (an equal or weaker hit takes 0, a stronger one the difference),
// absorption before health, a raised shield cancelling entityAttack, sonicBoom passing armour and the shield,
// cause `projectile` throwing, entityHurt delivered after the tick's other events. The GameTest twin in
// src/gametest/sculk-hit.ts shoots real bolts on BDS.

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
    b.onLoad({ filter: /.*/, namespace: 'no-engine' }, () => ({ contents: 'throw new Error("patch.ts must stay free of runtime @minecraft/server imports");', loader: 'js' }));
  },
};
const patch = await load(
  (await build({ entryPoints: [join(projectRoot, 'src', 'sculk', 'patch.ts')], bundle: true, format: 'esm', platform: 'neutral', write: false, plugins: [noEngine] })).outputFiles
);

const engineStub = `
const mc = (globalThis.__mcHit = { handlers: {}, intervals: new Map(), nextRun: 1, tick: 0, entities: new Map() });
const signal = (name) => ({
  subscribe(fn) { (mc.handlers[name] ??= []).push(fn); return fn; },
  unsubscribe(fn) { mc.handlers[name] = (mc.handlers[name] ?? []).filter((f) => f !== fn); },
});
export const world = {
  afterEvents: new Proxy({}, { get: (_, name) => signal(name) }),
  beforeEvents: new Proxy({}, { get: (_, name) => signal("before:" + name) }),
  getEntity: (id) => mc.entities.get(id),
};
export const system = {
  get currentTick() { return mc.tick; },
  run(fn) { fn(); return mc.nextRun++; },
  runInterval(fn) { const id = mc.nextRun++; mc.intervals.set(id, fn); return id; },
  clearRun(id) { mc.intervals.delete(id); },
};
export const LiquidType = { Water: "Water" };
export const EntityComponentTypes = { Projectile: "minecraft:projectile", Health: "minecraft:health" };
export const EntityDamageCause = { sonicBoom: "sonicBoom", entityAttack: "entityAttack", projectile: "projectile" };
export const GameMode = { Survival: "Survival", Adventure: "Adventure", Creative: "Creative", Spectator: "Spectator" };
export const EquipmentSlot = { Mainhand: "Mainhand", Offhand: "Offhand" };
export class Player {}
mc.Player = Player;
`;
const stubs = {
  name: 'hit-stubs',
  setup(b) {
    b.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: 'mc', namespace: 'hit-stub' }));
    b.onResolve({ filter: /legendary\/(recovery|hands|registry)$/ }, (a) => ({ path: a.path, namespace: 'hit-stub' }));
    b.onLoad({ filter: /.*/, namespace: 'hit-stub' }, (a) => {
      if (a.path === 'mc') return { contents: engineStub, loader: 'js' };
      if (a.path.endsWith('recovery')) {
        return {
          contents: 'export const HOLDER_TYPES = ["minecraft:chest"]; export function protectLegendariesIn() { (globalThis.__protectCalls ??= []).push(1); return { moved: 0, handedBack: 0 }; }',
          loader: 'js',
        };
      }
      if (a.path.endsWith('hands')) return { contents: 'export const heldLegendaries = () => [];', loader: 'js' };
      return { contents: 'export const SCULK_CROSSBOW = { itemId: "andrew:sculk_crossbow" };', loader: 'js' };
    });
  },
};
const sculk = await load(
  (
    await build({
      stdin: { contents: "export * from './hit'; export * from './carve'; export * from './bolt'; export * from './patch';", resolveDir: join(projectRoot, 'src', 'sculk'), loader: 'ts' },
      bundle: true,
      format: 'esm',
      platform: 'neutral',
      write: false,
      plugins: [stubs],
    })
  ).outputFiles
);
const mc = globalThis.__mcHit;
const logs = [];
console.warn = (msg) => logs.push(String(msg));

const key = (c) => `${c.x},${c.y},${c.z}`;
const D = sculk.SONIC_BOOM_DAMAGE;

// ---------------------------------------------------------------- patch.ts

/** Solid up to `top(x, z)` inclusive, air above; `kinds` overrides single cells. */
const terrain = (top, kinds = new Map()) => (at) => kinds.get(key(at)) ?? (at.y <= top(at.x, at.z) ? 'solid' : 'air');
const FEET = { x: 0, y: 2, z: 0 };
const flat = terrain(() => 1);
const seeds = Array.from({ length: 1000 }, (_, i) => (i * 2654435761) >>> 0);

test('r004: on flat ground the patch is the surface under the feet, inside 5×5, never a corner, nothing carved', () => {
  for (const seed of seeds) {
    const p = patch.planPatch(FEET, seed, flat);
    assert.equal(p.air.length, 0, 'a patch carves nothing');
    assert.equal(p.face, 'Up');
    for (const c of p.sculk) {
      assert.equal(c.y, 1, `seed ${seed}: sculk off the surface at ${key(c)}`);
      assert.ok(Math.abs(c.x) <= 2 && Math.abs(c.z) <= 2, `seed ${seed}: sculk outside 5×5 at ${key(c)}`);
      assert.ok(!(Math.abs(c.x) === 2 && Math.abs(c.z) === 2), `seed ${seed}: sculk on a corner`);
    }
    for (let x = -1; x <= 1; x++) for (let z = -1; z <= 1; z++) assert.ok(p.sculk.some((c) => c.x === x && c.z === z), `seed ${seed}: inner 3×3 cell ${x},${z} bare`);
    assert.ok(p.sculk.length >= 9 && p.sculk.length <= 21, `seed ${seed}: ${p.sculk.length} cells`);
  }
});

test('r004: the patch is irregular across seeds and the same for one seed', () => {
  const shapes = new Set(seeds.slice(0, 50).map((s) => patch.planPatch(FEET, s, flat).sculk.map(key).sort().join(';')));
  assert.ok(shapes.size >= 10, `${shapes.size} shapes over 50 seeds`);
  assert.deepEqual(patch.planPatch(FEET, 777, flat), patch.planPatch(FEET, 777, flat));
  assert.ok(seeds.some((s) => patch.planPatch(FEET, s, flat).sculk.length < 21), 'never a full ring');
});

test('xasm24: the surface follows the ground — a step beside the target, a wall left bare, a hover up to 6 above', () => {
  const step = patch.planPatch(FEET, 1, terrain((x) => (x >= 1 ? 2 : 1)));
  for (const c of step.sculk) assert.equal(c.y, c.x >= 1 ? 2 : 1, `step: ${key(c)}`);
  assert.ok(step.sculk.some((c) => c.y === 2) && step.sculk.some((c) => c.y === 1));

  const wall = patch.planPatch(FEET, 1, terrain((x) => (x >= 1 ? 4 : 1)));
  assert.ok(wall.sculk.every((c) => c.x < 1), 'a wall two above the feet gets no sculk');

  const hover = (y) => patch.planPatch({ x: 0, y, z: 0 }, 1, flat).sculk.length;
  assert.equal(hover(7), patch.planPatch(FEET, 1, flat).sculk.length, 'six above the ground still finds it');
  assert.equal(hover(8), 0, 'seven above: no patch');
});

test('r004: liquids, kept and other blocks, unloaded cells are never sculk; a plant above does not hide the ground', () => {
  const kinds = new Map([
    [key({ x: 0, y: 1, z: 0 }), 'liquid'],
    [key({ x: 1, y: 1, z: 0 }), 'keep'],
    [key({ x: 0, y: 1, z: 1 }), 'other'],
    [key({ x: -1, y: 1, z: 0 }), 'unloaded'],
    [key({ x: 0, y: 2, z: -1 }), 'passable'],
  ]);
  const p = patch.planPatch(FEET, 1, terrain(() => 1, kinds));
  const at = new Set(p.sculk.map(key));
  for (const k of ['0,1,0', '1,1,0', '0,1,1', '-1,1,0', '0,0,0', '1,0,0', '0,0,1', '-1,0,0']) assert.ok(!at.has(k), `${k} turned to sculk`);
  assert.ok(at.has('0,1,-1'), 'grass on the surface hid it');
});

// ---------------------------------------------------------------- hit.ts on the in-memory engine

const live = new Set();
const pendingHurts = [];
let nextId = 1;

class Entity {
  constructor(typeId, dimension, location) {
    Object.assign(this, { typeId, id: String(nextId++), dimension, location: { ...location }, velocity: { x: 0, y: 0, z: 0 }, isValid: true, components: {} });
    live.add(this);
    mc.entities.set(this.id, this);
  }
  getVelocity() {
    return { ...this.velocity };
  }
  getComponent(type) {
    return this.components[type];
  }
  getEffect() {
    return undefined;
  }
  remove() {
    if (!this.isValid) throw new Error('InvalidEntityError');
    this.isValid = false;
    live.delete(this);
  }
}

/** Entity's methods on a prototype that `instanceof Player` accepts. */
function playerPrototype() {
  const proto = Object.create(mc.Player.prototype);
  for (const name of Object.getOwnPropertyNames(Entity.prototype)) if (name !== 'constructor') proto[name] = Entity.prototype[name];
  return proto;
}

/** A target with the X22 damage model. */
function living(dimension, { typeId = 'minecraft:player', hp = 40, absorption = 0, armour = false, shield = false, mode = 'Survival', immune = false, at = { x: 0.5, y: 2, z: 0.5 } } = {}) {
  const e = new Entity(typeId, dimension, at);
  if (typeId === 'minecraft:player') Object.setPrototypeOf(e, playerPrototype());
  Object.assign(e, { absorption, armour, shield, immune, hurts: [], window: undefined, killer: undefined });
  e.getGameMode = () => mode;
  e.getEffect = (id) => (id === 'absorption' && e.absorption > 0 ? { typeId: 'absorption' } : undefined);
  const health = {
    currentValue: hp,
    setCurrentValue(v) {
      health.currentValue = Math.max(0, v);
      return true;
    },
  };
  e.components['minecraft:health'] = health;
  e.applyDamage = (amount, options) => {
    if (options?.cause === 'projectile' && options.damagingProjectile === undefined) throw new Error('UnsupportedFunctionalityError: Cause \'projectile\' is not valid.');
    if (e.immune) return false;
    if (e.shield && options?.cause === 'entityAttack') return false;
    let dmg = options?.cause === 'entityAttack' && e.armour ? amount * 0.101 : amount;
    const w = e.window;
    if (w !== undefined && mc.tick - w.at < 10) {
      if (dmg <= w.max) return true;
      const extra = dmg - w.max;
      e.window = { at: mc.tick, max: dmg };
      dmg = extra;
    } else {
      e.window = { at: mc.tick, max: dmg };
    }
    const fromAbsorption = Math.min(e.absorption, dmg);
    e.absorption -= fromAbsorption;
    health.currentValue = Math.max(0, health.currentValue - (dmg - fromAbsorption));
    e.hurts.push({ tick: mc.tick, damage: dmg, cause: options?.cause, by: options?.damagingEntity?.id });
    pendingHurts.push({ hurtEntity: e, damage: dmg, damageSource: { cause: options?.cause, damagingEntity: options?.damagingEntity } });
    if (health.currentValue === 0 && e.killer === undefined) e.killer = { by: options?.damagingEntity?.id, cause: options?.cause };
    return true;
  };
  return e;
}

/** Stone at y ≤ 1 everywhere, air above. */
function makeDimension() {
  const grid = new Map();
  const dim = {
    id: 'minecraft:overworld',
    heightRange: { min: -64, max: 320 },
    writes: [],
    isChunkLoaded: () => true,
    spawnParticle() {},
    spawnEntity(typeId, at) {
      const e = new Entity(typeId, dim, at);
      e.components['minecraft:projectile'] = { owner: undefined, shoot: (v) => (e.velocity = { ...v }) };
      return e;
    },
    getBlock(at) {
      const k = key(at);
      const typeId = grid.get(k) ?? (at.y <= 1 ? 'minecraft:stone' : 'minecraft:air');
      return {
        typeId,
        location: { ...at },
        isAir: typeId === 'minecraft:air',
        isLiquid: false,
        getComponent: () => undefined,
        isLiquidBlocking: () => true,
        canContainLiquid: () => false,
        setType(t) {
          grid.set(k, t);
          dim.writes.push({ tick: mc.tick, at: k, type: t });
        },
      };
    },
  };
  return dim;
}

function fire(name, event) {
  for (const fn of mc.handlers[name] ?? []) fn(event);
}

/** Ends the tick: the queued entityHurt events reach the script, then the next tick's intervals run. */
function tick(n = 1) {
  for (let i = 0; i < n; i++) {
    for (const e of pendingHurts.splice(0)) fire('entityHurt', e);
    mc.tick++;
    for (const fn of [...mc.intervals.values()]) fn();
  }
}

/** One bolt from `owner`, struck on `target` in this tick through projectileHitEntity. */
function hit(owner, target) {
  const record = sculk.launchBolt(owner, target.dimension, { x: 0.5, y: 3, z: -3 }, { x: 0, y: 0, z: 2 });
  record.bolt.remove();
  fire('projectileHitEntity', { projectile: record.bolt, dimension: target.dimension, location: target.location, getEntityHit: () => ({ entity: target }) });
  return record;
}

const reports = [];
sculk.observeHits((r) => reports.push(r));
const hpOf = (e) => e.getComponent('minecraft:health').currentValue;

function fresh() {
  tick(sculk.HURT_WINDOW_TICKS + 2);
  reports.length = 0;
  const dim = makeDimension();
  const owner = living(dim, { at: { x: 0.5, y: 2, z: -5 } });
  return { dim, owner };
}

test('arming subscribes entityHurt and the bolt observer once', () => {
  sculk.registerBolts();
  sculk.registerCarve();
  sculk.registerHit();
  sculk.registerHit();
  assert.equal(mc.handlers.entityHurt?.length, 1);
  assert.equal(mc.handlers.projectileHitEntity?.length, 1);
});

test('T06/T08: one bolt takes exactly D, cause sonicBoom by the owner, through armour and a raised shield', () => {
  const { dim, owner } = fresh();
  const bare = living(dim);
  const guarded = living(dim, { armour: true, shield: true, at: { x: 3.5, y: 2, z: 0.5 } });
  hit(owner, bare);
  hit(owner, guarded);
  assert.equal(hpOf(bare), 40 - D);
  assert.equal(hpOf(guarded), 40 - D);
  for (const e of [bare, guarded]) assert.deepEqual(e.hurts.map((h) => [h.cause, h.damage, h.by]), [['sonicBoom', D, owner.id]]);
  assert.deepEqual(reports.map((r) => r.path), ['native', 'native']);
  // The model's controls: entityAttack is what armour and the shield would have stopped.
  tick(12);
  assert.equal(guarded.applyDamage(D, { cause: 'entityAttack', damagingEntity: owner }), false);
});

test('T17: three bolts in one tick on one target take 3·D; without the write the window leaves 1·D', () => {
  const { dim, owner } = fresh();
  const t = living(dim, { armour: true });
  for (let i = 0; i < 3; i++) hit(owner, t);
  assert.equal(hpOf(t), 40 - 3 * D);
  assert.deepEqual(reports.map((r) => r.path), ['native', 'window', 'window']);

  const control = fresh();
  const c = living(control.dim, { armour: true });
  sculk.setWindowWrite(false);
  try {
    for (let i = 0; i < 3; i++) hit(control.owner, c);
  } finally {
    sculk.setWindowWrite(true);
  }
  assert.equal(hpOf(c), 40 - D, 'the negative control: the window swallows bolts 2 and 3');
});

test('C-28: absorption goes first and is never charged twice', () => {
  const { dim, owner } = fresh();
  const t = living(dim, { absorption: 16 });
  hit(owner, t);
  assert.equal(hpOf(t), 40, 'one bolt: absorption took it');
  assert.equal(t.absorption, 6);
  tick(12);
  hit(owner, t);
  assert.equal(hpOf(t), 36, 'the next bolt: 6 absorption + 4 health');
  assert.equal(t.absorption, 0);
  assert.ok(reports.every((r) => !r.wrote), 'outside a window nothing is written');

  const volley = fresh();
  const v = living(volley.dim, { absorption: 16 });
  for (let i = 0; i < 3; i++) hit(volley.owner, v);
  assert.equal(v.absorption + hpOf(v), 16 + 40 - 3 * D, 'a volley on absorption takes 3·D in all');
  assert.equal(v.absorption, 6, 'bolt 1 from absorption, not again from health');
});

test('a window another source opened is known through entityHurt: the bolt still takes exactly D', () => {
  const { dim, owner } = fresh();
  const t = living(dim);
  t.applyDamage(3, { cause: 'entityAttack' });
  tick(2);
  hit(owner, t);
  assert.equal(hpOf(t), 40 - 3 - D);
  assert.equal(reports.at(-1).path, 'window');
});

test('lethal: hp ≤ D dies by one overkill sonicBoom, credited to the owner, shield or not, inside a window too', () => {
  const { dim, owner } = fresh();
  const plain = living(dim, { hp: 6 });
  const shielded = living(dim, { hp: 6, shield: true, at: { x: 3.5, y: 2, z: 0.5 } });
  const exact = living(dim, { hp: D, at: { x: -3.5, y: 2, z: 0.5 } });
  const late = living(dim, { hp: 25, at: { x: 6.5, y: 2, z: 0.5 } });
  for (const e of [plain, shielded, exact]) hit(owner, e);
  hit(owner, late);
  hit(owner, late);
  hit(owner, late);
  for (const e of [plain, shielded, exact, late]) {
    assert.equal(hpOf(e), 0);
    assert.deepEqual(e.killer, { by: owner.id, cause: 'sonicBoom' });
  }
  assert.deepEqual(reports.map((r) => r.path), ['lethal', 'lethal', 'lethal', 'native', 'window', 'lethal']);
});

test('xasm24: no damage to Creative, Spectator, armour stands or immune entities; a patch all the same; none for a gone target', () => {
  const { dim, owner } = fresh();
  const creative = living(dim, { mode: 'Creative' });
  const spectator = living(dim, { mode: 'Spectator', at: { x: 3.5, y: 2, z: 0.5 } });
  const stand = living(dim, { typeId: 'minecraft:armor_stand', hp: 6, at: { x: -3.5, y: 2, z: 0.5 } });
  const immune = living(dim, { typeId: 'andrew:ufo_saucer', hp: 20, immune: true, at: { x: 6.5, y: 2, z: 0.5 } });
  for (const e of [creative, spectator, stand]) hit(owner, e);
  for (let i = 0; i < 3; i++) hit(owner, immune);
  for (const e of [creative, spectator, stand]) assert.equal(e.hurts.length, 0);
  assert.equal(hpOf(immune), 20, 'an immune entity is never written down');
  assert.deepEqual(reports.slice(0, 3).map((r) => [r.living, r.path]), [[false, 'none'], [false, 'none'], [false, 'none']]);
  assert.ok(reports.every((r) => r.patch !== undefined && r.patch.kind === 'patch'));

  const gone = living(dim, { at: { x: 9.5, y: 2, z: 0.5 } });
  gone.isValid = false;
  hit(owner, gone);
  assert.equal(reports.at(-1).patch, undefined);
  assert.equal(reports.at(-1).path, 'none');
});

test('§5, T09, T10: only the struck entity is hurt; the patch lays sculk under it, carves nothing, runs no protect pass', () => {
  const { dim, owner } = fresh();
  const t = living(dim);
  const near = living(dim, { at: { x: 1.5, y: 2, z: 0.5 } });
  const protectBefore = globalThis.__protectCalls?.length ?? 0;
  hit(owner, t);
  assert.equal(near.hurts.length, 0);
  assert.equal(owner.hurts.length, 0);
  assert.equal(hpOf(near), 40);
  const r = reports.at(-1);
  assert.equal(r.patch.zone, undefined);
  assert.equal(globalThis.__protectCalls?.length ?? 0, protectBefore, 'protectLegendariesIn never ran for a patch');
  assert.ok(dim.writes.length >= 9, `${dim.writes.length} writes`);
  assert.ok(dim.writes.every((w) => w.type === sculk.SCULK && w.at.split(',')[1] === '1'), 'only surface cells, only sculk');
  assert.equal(r.patch.sculked.length, dim.writes.length);
  assert.ok(logs.some((l) => l.includes(`hit entity minecraft:player ${t.id} hp 40.00 -> 30.00 (D 10, native)`)), 'the hit line is logged');
  assert.ok(logs.some((l) => l.includes(`patch ${r.boltId} done: crater 0/0 cells`)), 'the patch line is logged');
});
