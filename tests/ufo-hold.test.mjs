// The UFO magnet's hold and release (src/ufo/magnet-hold.ts, magnet.ts): the
// geometry of the hold point and the cloud ring, the keep-away, which players
// are pulled (L0-magn-rply), one hold step over fake engine objects
// (L0-magn-phld), the drop exemption (L0-magn-rexm) and the one-tick release
// through the core's latch (L0-magn-prel). The engine half is
// src/gametest/ufo-magnet-hold.ts.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const bundle = await build({
  stdin: {
    contents: [
      "export * from './src/ufo/magnet-hold.ts';",
      "export * from './src/ufo/magnet.ts';",
      "export { ELEMENT_LIMIT, zoneOf } from './src/ufo/magnet-select.ts';",
      "export { UfoCore, IRON_TAG } from './src/ufo/event.ts';",
    ].join('\n'),
    resolveDir: projectRoot,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  external: ['@minecraft/server'],
  write: false,
});
const m = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const {
  PLAYER_DEPTH,
  PLAYER_SPEED,
  RING_RADIUS,
  RING_DEPTH,
  FLIGHT_SPEED,
  KEEP_AWAY,
  BODY_MIDDLE,
  RING_TURN_TICKS,
  EXEMPT,
  EXEMPT_RADIUS,
  ELEMENT_LIMIT,
  holdPoint,
  pullStep,
  stepToward,
  ringPoint,
  keepAway,
  pullsPlayer,
  ironInHand,
  holdStep,
  zoneOf,
  UfoMagnet,
  UfoCore,
  IRON_TAG,
} = m;

const mc = (id) => (id.includes(':') ? id : `minecraft:${id}`);
const RANGE = { min: -64, max: 320 };
const CENTRE = { x: 100, y: 64, z: -40 };
const HOVER = 104;
const SAUCER = { x: CENTRE.x + 0.5, y: HOVER, z: CENTRE.z + 0.5 };
const ZONE = zoneOf(CENTRE, HOVER, RANGE);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;
const noLegendary = () => false;

// ---------------------------------------------------------------- fakes

class Stack {
  constructor(typeId, amount = 1, legendary = false) {
    this.typeId = mc(typeId);
    this.amount = amount;
    this.legendary = legendary;
  }
}
const isLegendaryWeapon = (s) => s.legendary === true;

let seq = 0;

class FakeEntity {
  constructor(typeId, location, stack) {
    this.id = `${-1000 - ++seq}`;
    this.typeId = mc(typeId);
    this.location = { ...location };
    this.isValid = true;
    this.stack = stack;
    this.tags = new Set();
    this.calls = [];
    this.failTeleport = false;
  }
  getComponent(name) {
    return name === 'minecraft:item' && this.stack !== undefined ? { itemStack: this.stack } : undefined;
  }
  teleport(p) {
    if (this.failTeleport) throw new Error('LocationInUnloadedChunkError');
    this.calls.push('teleport');
    this.location = { ...p };
  }
  clearVelocity() {
    this.calls.push('clearVelocity');
  }
  hasTag(t) {
    return this.tags.has(t);
  }
  addTag(t) {
    this.tags.add(t);
    return true;
  }
  removeTag(t) {
    return this.tags.delete(t);
  }
}

class FakePlayer {
  constructor(name, location, { mode = 'Survival', hands = {}, armour = {}, health = 20 } = {}) {
    this.id = `p-${name}`;
    this.name = name;
    this.location = { ...location };
    this.isValid = true;
    this.mode = mode;
    this.slots = { ...hands, ...armour };
    this.health = health;
    this.knocks = [];
  }
  getGameMode() {
    return this.mode;
  }
  getComponent(name) {
    if (name === 'minecraft:equippable') return { getEquipment: (slot) => this.slots[slot] };
    if (name === 'minecraft:health') return { currentValue: this.health };
    return undefined;
  }
  applyKnockback(h, v) {
    this.knocks.push({ x: h.x, z: h.z, y: v });
  }
}

/** Enough of a Dimension for magnetOn and the hold: items on the ground, no blocks, no holders. */
class FakeDimension {
  constructor() {
    this.heightRange = RANGE;
    this.entities = [];
    this.unloaded = () => false;
  }
  getEntities(q = {}) {
    return this.entities.filter((e) => {
      if (!e.isValid) return false;
      if (q.type !== undefined && e.typeId !== q.type) return false;
      if (q.excludeTypes?.includes(e.typeId)) return false;
      if (q.location !== undefined && dist(e.location, q.location) > q.maxDistance) return false;
      return true;
    });
  }
  getBlocks() {
    return { getBlockLocationIterator: () => [][Symbol.iterator]() };
  }
  getBlock() {
    return undefined;
  }
  spawnItem(stack, at) {
    return this.add(new FakeEntity('item', at, stack));
  }
  runCommand() {
    throw new Error('No targets matched selector');
  }
  isChunkLoaded(at) {
    return !this.unloaded(at);
  }
  add(e) {
    this.entities.push(e);
    return e;
  }
  item(typeId, at, legendary = false) {
    return this.add(new FakeEntity('item', at, new Stack(typeId, 1, legendary)));
  }
}

class FakeSpawns {
  constructor() {
    this.listeners = new Set();
    this.subscribed = 0;
  }
  subscribe(cb) {
    this.subscribed++;
    this.listeners.add(cb);
    return cb;
  }
  unsubscribe(cb) {
    this.listeners.delete(cb);
  }
  fire(entity) {
    for (const cb of this.listeners) cb({ entity, cause: 'Spawned' });
  }
}

function rig({ players = [], saucer = SAUCER } = {}) {
  const dim = new FakeDimension();
  const spawns = new FakeSpawns();
  const logs = [];
  const env = {
    overworld: () => dim,
    players: () => players,
    saucerPosition: () => saucer,
    spawns,
    host: { itemStack: (id, n) => new Stack(id, n), volume: (from, to) => ({ from, to }), now: () => 0, log: (msg) => logs.push(msg) },
    isLegendaryWeapon,
  };
  const magnet = new UfoMagnet(env);
  const payload = { centre: CENTRE, hoverY: HOVER, saucerPos: saucer, eventId: 'test-1-1' };
  return { dim, spawns, logs, magnet, payload, players };
}

const ground = (dx, dz) => ({ x: CENTRE.x + dx + 0.5, y: CENTRE.y + 1, z: CENTRE.z + dz + 0.5 });

// ---------------------------------------------------------------- geometry

test('the hold point is 6 below the saucer on its axis; a pull step is at most 0.6 and zero at the target', () => {
  assert.equal(PLAYER_DEPTH, 6);
  assert.equal(PLAYER_SPEED, 0.6);
  assert.deepEqual(holdPoint(SAUCER), { x: SAUCER.x, y: HOVER - 6, z: SAUCER.z });
  const from = { x: 0, y: 0, z: 0 };
  const v = pullStep(from, { x: 3, y: 4, z: 0 }, PLAYER_SPEED);
  assert.ok(near(Math.hypot(v.x, v.y, v.z), 0.6, 1e-12));
  assert.ok(near(v.x / v.y, 3 / 4, 1e-12), 'straight at the target');
  assert.deepEqual(pullStep(from, { x: 0.1, y: 0.2, z: 0 }, PLAYER_SPEED), { x: 0.1, y: 0.2, z: 0 }, 'a short way is covered exactly');
  assert.deepEqual(pullStep(from, from, PLAYER_SPEED), { x: 0, y: 0, z: 0 });
  const s = stepToward({ x: 0, y: -60, z: 0 }, { x: 0, y: 0, z: 0 }, FLIGHT_SPEED);
  assert.equal(FLIGHT_SPEED, 1.5);
  assert.deepEqual(s, { x: 0, y: -58.5, z: 0 });
});

test('the ring: radius 5, 3 below the saucer, evenly spaced, one slow turn in RING_TURN_TICKS', () => {
  assert.equal(RING_RADIUS, 5);
  assert.equal(RING_DEPTH, 3);
  const pts = Array.from({ length: 10 }, (_, i) => ringPoint(SAUCER, i, 10, 0));
  for (const p of pts) {
    assert.ok(near(Math.hypot(p.x - SAUCER.x, p.z - SAUCER.z), 5, 1e-9));
    assert.equal(p.y, HOVER - 3);
  }
  const gaps = pts.map((p, i) => dist(p, pts[(i + 1) % 10]));
  assert.ok(gaps.every((g) => near(g, gaps[0], 1e-9)), 'even spacing');
  const a = ringPoint(SAUCER, 0, 10, 0);
  const b = ringPoint(SAUCER, 0, 10, RING_TURN_TICKS);
  assert.ok(dist(a, b) < 1e-9, 'a full turn');
  assert.ok(dist(a, ringPoint(SAUCER, 0, 10, 1)) < FLIGHT_SPEED, 'an arrived element keeps up with its slot');
  // A held player on the axis is about 5.4 from every slot: clear of the keep-away.
  const body = { ...holdPoint(SAUCER), y: HOVER - 6 + BODY_MIDDLE };
  assert.ok(pts.every((p) => dist(p, body) > KEEP_AWAY + 2));
});

test('keep-away: a point within 3 of a body moves out from the axis, else up; a clear point stays', () => {
  assert.equal(KEEP_AWAY, 3);
  const axis = SAUCER;
  const clear = { x: axis.x + 5, y: axis.y - 3, z: axis.z };
  assert.deepEqual(keepAway(clear, axis, [{ x: axis.x, y: axis.y - 5.1, z: axis.z }], { x: 1, z: 0 }), clear);
  // A player rising past the ring right at a slot.
  const body = { x: axis.x + 5, y: axis.y - 3, z: axis.z };
  const out = keepAway(clear, axis, [body], { x: 1, z: 0 });
  assert.ok(dist(out, body) >= 3, `still ${dist(out, body)} from the body`);
  assert.equal(out.y, clear.y, 'radially, at the same height');
  assert.ok(near(out.z, axis.z, 1e-9) && out.x > clear.x, 'outward along the slot direction');
  // On the axis: the slot's direction is the way out.
  const onAxis = { x: axis.x, y: axis.y - 6, z: axis.z };
  const fromAxis = keepAway(onAxis, axis, [{ ...onAxis, y: onAxis.y + 0.5 }], { x: 0, z: -1 });
  assert.ok(fromAxis.z < axis.z - 2.5 && near(fromAxis.x, axis.x, 1e-9), `pushed toward -z: ${JSON.stringify(fromAxis)}`);
  // Bodies all along the way out: up instead.
  const wall = Array.from({ length: 30 }, (_, k) => ({ x: axis.x + 5 + k * 0.5, y: axis.y - 3, z: axis.z }));
  const up = keepAway(clear, axis, wall, { x: 1, z: 0 });
  assert.equal(up.x, clear.x);
  assert.ok(up.y > clear.y && wall.every((b) => dist(up, b) >= 3), `up to ${up.y}`);
});

// ---------------------------------------------------------------- who is pulled

test('pulled (UFO AC-4, AC-5, UFO-TUNE-01): iron or a legendary weapon in the main or off hand, Survival or Adventure, alive, in the zone', () => {
  const at = ground(3, 3);
  const P = (opts) => new FakePlayer('x', at, opts);
  assert.equal(pullsPlayer(P({ hands: { Mainhand: new Stack('iron_ingot') } }), ZONE, noLegendary), true, 'ingot, main hand');
  assert.equal(pullsPlayer(P({ hands: { Offhand: new Stack('shears') } }), ZONE, noLegendary), true, 'shears, off hand');
  assert.equal(pullsPlayer(P({ mode: 'Adventure', hands: { Mainhand: new Stack('iron_pickaxe') } }), ZONE, noLegendary), true, 'Adventure (L0-xasm14)');
  assert.equal(pullsPlayer(P({ mode: 'Creative', hands: { Mainhand: new Stack('iron_ingot') } }), ZONE, noLegendary), false, 'Creative');
  assert.equal(pullsPlayer(P({ mode: 'Spectator', hands: { Mainhand: new Stack('iron_sword') } }), ZONE, noLegendary), false, 'Spectator');
  // Inventory is not read at all; worn armour is not a hand.
  const armour = { Head: new Stack('iron_helmet'), Chest: new Stack('iron_chestplate'), Legs: new Stack('iron_leggings'), Feet: new Stack('iron_boots') };
  assert.equal(pullsPlayer(P({ hands: { Mainhand: new Stack('dirt') }, armour }), ZONE, noLegendary), false, 'full iron armour, dirt in hand');
  assert.equal(pullsPlayer(P({}), ZONE, noLegendary), false, 'empty hands');
  assert.equal(pullsPlayer(P({ hands: { Mainhand: new Stack('iron_ingot') }, health: 0 }), ZONE, noLegendary), false, 'dead and still listed');
  const legendary = new Stack('andrew:scythe_of_calamity', 1, true);
  assert.equal(pullsPlayer(P({ hands: { Mainhand: legendary } }), ZONE, isLegendaryWeapon), true, 'a legendary weapon pulls like iron');
  assert.equal(pullsPlayer(P({ hands: { Offhand: legendary } }), ZONE, isLegendaryWeapon), true, 'a legendary weapon in the off hand');
  assert.equal(pullsPlayer(P({ hands: { Mainhand: new Stack('andrew:scythe_of_calamity_crafted') } }), ZONE, isLegendaryWeapon), false, 'a craft token is no weapon');
  assert.equal(pullsPlayer(P({ hands: { Mainhand: legendary } }), ZONE, noLegendary), false, 'the weapon test is the injected predicate');
  assert.equal(ironInHand(P({ hands: { Mainhand: new Stack('dirt'), Offhand: legendary } }), isLegendaryWeapon)?.typeId, 'andrew:scythe_of_calamity', 'the other hand still counts');
  const inside = new FakePlayer('mid', { x: CENTRE.x + 99, y: CENTRE.y + 1, z: CENTRE.z + 0.5 }, { hands: { Mainhand: new Stack('iron_ingot') } });
  assert.equal(pullsPlayer(inside, ZONE, noLegendary), true, 'inside the r 100 cylinder, 99 out');
  const outside = new FakePlayer('far', { x: CENTRE.x + 101, y: CENTRE.y + 1, z: CENTRE.z + 0.5 }, { hands: { Mainhand: new Stack('iron_ingot') } });
  assert.equal(pullsPlayer(outside, ZONE, noLegendary), false, 'outside the r 100 cylinder');
  const gone = P({ hands: { Mainhand: new Stack('iron_ingot') } });
  gone.isValid = false;
  assert.equal(pullsPlayer(gone, ZONE, noLegendary), false, 'invalid');
});

// ---------------------------------------------------------------- one hold step

test('a hold step: knockback toward the hold point for pulled players only, no element limit for players', () => {
  const players = Array.from({ length: ELEMENT_LIMIT + 2 }, (_, i) => new FakePlayer(`p${i}`, ground(i - 6, 4), { hands: { Mainhand: new Stack('iron_ingot') } }));
  const bare = new FakePlayer('bare', ground(0, -4));
  const r = holdStep({ saucer: SAUCER, zone: ZONE, tick: 0, slots: 0, players: [undefined, ...players, bare], elements: [], isLegendaryWeapon: noLegendary, isLoaded: () => true });
  assert.equal(r.pulled.length, ELEMENT_LIMIT + 2, 'every player with iron, beyond the 10');
  assert.equal(bare.knocks.length, 0, 'no knockback without iron');
  const target = holdPoint(SAUCER);
  for (const p of players) {
    assert.equal(p.knocks.length, 1);
    const k = p.knocks[0];
    assert.ok(Math.hypot(k.x, k.y, k.z) <= PLAYER_SPEED + 1e-12, 'at most 0.6');
    const d = { x: target.x - p.location.x, y: target.y - p.location.y, z: target.z - p.location.z };
    const len = Math.hypot(d.x, d.y, d.z);
    assert.ok(near(k.x, (d.x / len) * 0.6, 1e-9) && near(k.y, (d.y / len) * 0.6, 1e-9) && near(k.z, (d.z / len) * 0.6, 1e-9), 'straight at the hold point');
  }
});

test('a hold step: the hand is re-read every tick — drop stops the pull, iron back resumes it (U10)', () => {
  const p = new FakePlayer('a', ground(2, 2), { hands: { Mainhand: new Stack('iron_ingot') } });
  const step = () => holdStep({ saucer: SAUCER, zone: ZONE, tick: 0, slots: 0, players: [p], elements: [], isLegendaryWeapon: noLegendary, isLoaded: () => true });
  assert.deepEqual(step().pulled, [p.id]);
  p.slots.Mainhand = undefined;
  assert.deepEqual(step().pulled, [], 'dropped: no knockback in that tick');
  p.slots.Mainhand = new Stack('dirt');
  assert.deepEqual(step().pulled, [], 'switched to a non-iron slot');
  p.slots.Offhand = new Stack('shield');
  assert.deepEqual(step().pulled, [p.id], 'iron back in a hand');
  assert.equal(p.knocks.length, 2);
});

test('a hold step: elements teleport toward their slot at ≤ 1.5, then clearVelocity; a gone one leaves the set', () => {
  const far = new FakeEntity('item', ground(20, 0), new Stack('iron_ingot'));
  const close = new FakeEntity('iron_golem', { ...ringPoint(SAUCER, 1, 3, 0), y: HOVER - 3.5 });
  const gone = new FakeEntity('item', ground(1, 1), new Stack('iron_nugget'));
  gone.isValid = false;
  const els = [
    { entity: far, cls: 1, from: 'minecraft:iron_ingot', origin: far.location, slot: 0, arrived: false },
    { entity: close, cls: 3, from: 'minecraft:iron_golem', origin: close.location, slot: 1, arrived: false },
    { entity: gone, cls: 1, from: 'minecraft:iron_nugget', origin: gone.location, slot: 2, arrived: false },
  ];
  const before = { ...far.location };
  const r = holdStep({ saucer: SAUCER, zone: ZONE, tick: 0, slots: 3, players: [], elements: els, isLegendaryWeapon: noLegendary, isLoaded: () => true });
  assert.equal(r.moved, 2);
  assert.equal(r.gone, 1);
  assert.deepEqual(els.map((e) => e.entity.id), [far.id, close.id], 'the gone element is out; its slot is not refilled');
  assert.ok(near(dist(before, far.location), FLIGHT_SPEED, 1e-9), 'the far one flew 1.5');
  assert.equal(els[0].arrived, false);
  assert.ok(dist(close.location, ringPoint(SAUCER, 1, 3, 0)) < 1e-9, 'the near one is on its slot');
  assert.equal(els[1].arrived, true);
  for (const e of [far, close]) assert.deepEqual(e.calls, ['teleport', 'clearVelocity'], 'teleport, then the velocity cleared');
});

test('a hold step: an item never comes within 3 of a player; a mob is not kept away', () => {
  const slot0 = ringPoint(SAUCER, 0, 2, 0);
  const rising = new FakePlayer('rising', { x: slot0.x, y: slot0.y - BODY_MIDDLE, z: slot0.z });
  const item = new FakeEntity('item', { ...slot0 }, new Stack('iron_ingot'));
  const golem = new FakeEntity('iron_golem', { ...slot0 });
  const els = [
    { entity: item, cls: 1, from: 'minecraft:iron_ingot', origin: item.location, slot: 0, arrived: true },
    { entity: golem, cls: 3, from: 'minecraft:iron_golem', origin: golem.location, slot: 0, arrived: true },
  ];
  holdStep({ saucer: SAUCER, zone: ZONE, tick: 0, slots: 2, players: [rising], elements: els, isLegendaryWeapon: noLegendary, isLoaded: () => true });
  const body = { x: rising.location.x, y: rising.location.y + BODY_MIDDLE, z: rising.location.z };
  assert.ok(dist(item.location, body) >= KEEP_AWAY - 1e-9, `the item is ${dist(item.location, body).toFixed(2)} from the body`);
  assert.ok(dist(golem.location, slot0) < 1e-9, 'the golem holds its slot');
  // A spectator picks nothing up and is not a body.
  const ghost = new FakePlayer('ghost', rising.location, { mode: 'Spectator' });
  item.location = { ...slot0 };
  holdStep({ saucer: SAUCER, zone: ZONE, tick: 0, slots: 2, players: [ghost], elements: els, isLegendaryWeapon: noLegendary, isLoaded: () => true });
  assert.ok(dist(item.location, slot0) < 1e-9);
});

test('a hold step: nothing is moved into an unloaded chunk; a throwing element does not stop the others (C-12′)', () => {
  // Chunk column x 112..127 is unloaded; a sits just east of it, in chunk 128..143.
  const a = new FakeEntity('item', { x: 128.2, y: CENTRE.y + 1, z: CENTRE.z + 0.5 }, new Stack('iron_ingot'));
  const b = new FakeEntity('item', ground(-30, 0), new Stack('iron_ingot'));
  const c = new FakeEntity('minecart', ground(0, 30));
  c.failTeleport = true;
  const els = [a, b, c].map((entity, slot) => ({ entity, cls: 1, from: entity.typeId, origin: entity.location, slot, arrived: false }));
  const asked = [];
  const isLoaded = (p) => {
    asked.push(p);
    return !(p.x >= 112 && p.x < 128);
  };
  const r = holdStep({ saucer: SAUCER, zone: ZONE, tick: 0, slots: 3, players: [], elements: els, isLegendaryWeapon: noLegendary, isLoaded });
  assert.equal(r.skipped, 1);
  assert.deepEqual(a.calls, [], 'a stayed: its step ends in an unloaded chunk');
  assert.deepEqual(b.calls, ['teleport', 'clearVelocity']);
  assert.equal(asked.length, 1, 'a step inside the entity\'s own chunk asks nothing: that chunk is loaded');
  assert.equal(r.errors.length, 1);
  assert.match(r.errors[0], /minecart/);
  assert.equal(els.length, 3, 'a throw is not a loss');
});

// ---------------------------------------------------------------- the magnet session

test('magnet-on and the drop exemption (UFO AC-6): iron or a legendary weapon within 12 of the saucer joins as X beyond the 10', () => {
  const { dim, spawns, magnet, payload, logs } = rig();
  for (let i = 0; i < 11; i++) dim.item('iron_ingot', ground(2 + i, 0));
  magnet.onPhase('magnet', payload);
  assert.equal(spawns.subscribed, 1, 'one entitySpawn subscription, at magnet-on');
  const v = magnet.view();
  assert.equal(v.elements.length, ELEMENT_LIMIT);
  assert.equal(v.slots, ELEMENT_LIMIT);
  magnet.magnetStep(1);

  const dropped = dim.item('iron_ingot', { x: SAUCER.x + 1, y: HOVER - 6 + 1.5, z: SAUCER.z });
  const groundDrop = dim.item('iron_ingot', ground(5, 5));
  const dirt = dim.item('dirt', { x: SAUCER.x, y: HOVER - 5, z: SAUCER.z });
  const legendary = dim.item('andrew:web_sword', { x: SAUCER.x, y: HOVER - 5, z: SAUCER.z }, true);
  const token = dim.item('andrew:web_sword_crafted', { x: SAUCER.x, y: HOVER - 4, z: SAUCER.z });
  const edge = dim.item('shears', { x: SAUCER.x + EXEMPT_RADIUS, y: HOVER, z: SAUCER.z });
  const past = dim.item('shears', { x: SAUCER.x + EXEMPT_RADIUS + 0.01, y: HOVER, z: SAUCER.z });
  for (const e of [dropped, groundDrop, dirt, legendary, token, edge, past]) spawns.fire(e);
  // An element the magnet spawned itself is never admitted twice.
  spawns.fire(v.elements[0].entity);
  assert.equal(magnet.view().elements.length, ELEMENT_LIMIT, 'admitted at the next step, not inside the after-event');
  magnet.magnetStep(2);
  const w = magnet.view();
  const x = w.elements.filter((e) => e.cls === EXEMPT);
  assert.deepEqual(x.map((e) => e.entity.id), [dropped.id, legendary.id, edge.id], 'the near drop, the legendary weapon and the one at exactly 12');
  assert.equal(w.elements.length, ELEMENT_LIMIT + 3);
  assert.deepEqual(x.map((e) => e.slot), [10, 11, 12], 'the next ring slots');
  assert.equal(w.slots, 13, 'the ring re-spaced over 13');
  assert.equal(w.exempt, 3);
  assert.ok(logs.some((l) => /magnet-on/.test(l)));
  spawns.fire(dropped);
  magnet.magnetStep(3);
  assert.equal(magnet.view().elements.length, ELEMENT_LIMIT + 3, 'no element twice');
});

test('release (UFO AC-14): one call lets every element go — no teleport, no knockback after it; the listener and the tag are gone', () => {
  const p = new FakePlayer('held', ground(0, 2), { hands: { Mainhand: new Stack('iron_ingot') } });
  const { dim, spawns, magnet, payload, logs } = rig({ players: [p] });
  const items = [dim.item('iron_ingot', ground(3, 0)), dim.item('bucket', ground(-3, 0))];
  magnet.onPhase('magnet', payload);
  for (let t = 1; t <= 3; t++) magnet.magnetStep(t);
  assert.equal(p.knocks.length, 3);
  const calls = items.map((e) => e.calls.length);
  magnet.onPhase('release', payload);
  assert.equal(magnet.view(), undefined, 'the session is gone');
  assert.equal(spawns.listeners.size, 0, 'the drop listener is unsubscribed');
  for (let t = 4; t <= 6; t++) magnet.magnetStep(t);
  assert.equal(p.knocks.length, 3, 'no knockback after the release');
  assert.deepEqual(items.map((e) => e.calls.length), calls, 'no teleport or velocity call after the release');
  const s = magnet.lastSummary();
  assert.equal(s.reason, 'release');
  assert.equal(s.steps, 3);
  assert.equal(s.held, 2);
  assert.ok(logs.some((l) => /released \(release\)/.test(l)));
  magnet.onPhase('release', payload);
  assert.equal(magnet.lastSummary(), s, 'a second release is a no-op');
});

test('release untags the held holders (L0-magn-prel step 3)', () => {
  const { dim, magnet, payload } = rig();
  dim.item('iron_ingot', ground(3, 0));
  magnet.onPhase('magnet', payload);
  // Patch a holder into the session the way magnetOn hands one over.
  const golem = new FakeEntity('iron_golem', ground(0, -6));
  golem.addTag(IRON_TAG);
  const session = magnet.live;
  session.tagged.push(golem);
  magnet.onPhase('release', payload);
  assert.equal(golem.hasTag(IRON_TAG), false);
});

class Store {
  constructor() {
    this.data = new Map();
  }
  get(k) {
    return this.data.get(k);
  }
  set(k, v) {
    if (v === undefined) this.data.delete(k);
    else this.data.set(k, v);
  }
}

function coreRig(players) {
  const r = rig({ players });
  const order = [];
  const saucer = {
    onPhase: () => {},
    saucerStep: () => order.push('saucerStep'),
    saucerPosition: () => SAUCER,
  };
  const magnet = {
    onPhase: (phase, payload) => {
      order.push(phase);
      r.magnet.onPhase(phase, payload);
    },
    magnetStep: (tick) => {
      order.push('magnetStep');
      r.magnet.magnetStep(tick);
    },
  };
  const target = { id: 'target', name: 'target', location: ground(0, 0), sendMessage() {} };
  const env = {
    now: () => 1_790_000_000_000,
    durations: { arrival: 2, magnet: 5, departure: 2, downed: 2 },
    pauseMs: 900_000,
    firstMinMs: 600_000,
    firstMaxMs: 1_200_000,
    overworldPlayers: () => [target],
    random: () => 0.5,
    store: new Store(),
    ceiling: () => RANGE.max,
    log: () => {},
  };
  const core = new UfoCore(env, { scope: 'tt', saucer, magnet });
  return { ...r, core, order, target };
}

test('through the core: magnetStep after saucerStep every magnet tick; the natural end releases before departure', () => {
  const p = new FakePlayer('held', ground(0, 2), { hands: { Mainhand: new Stack('iron_ingot') } });
  const { core, order, magnet } = coreRig([p]);
  assert.equal(core.command('come', 'target').ok, true);
  for (let t = 0; t < 12; t++) core.tick();
  const firstMagnet = order.indexOf('magnet');
  assert.equal(order[firstMagnet + 1], 'saucerStep');
  assert.equal(order[firstMagnet + 2], 'magnetStep', 'the hold runs in the magnet-on tick, after the saucer');
  const steps = order.filter((o) => o === 'magnetStep').length;
  assert.equal(steps, 5, 'one hold step per magnet tick');
  const rel = order.indexOf('release');
  assert.ok(rel > order.lastIndexOf('magnetStep'), 'no hold step after the release');
  assert.equal(p.knocks.length, 5);
  assert.equal(magnet.lastSummary().reason, 'release');
});

test('through the core: stop and a shoot-down both latch — the release runs at the start of the next tick', () => {
  for (const how of ['stop', 'shot']) {
    const p = new FakePlayer('held', ground(0, 2), { hands: { Mainhand: new Stack('iron_ingot') } });
    const { core, order, magnet } = coreRig([p]);
    core.command('come', 'target');
    for (let t = 0; t < 5; t++) core.tick();
    assert.equal(core.session().phase, 'magnet');
    const knocks = p.knocks.length;
    if (how === 'stop') assert.equal(core.command('stop').ok, true);
    else core.reportShotDown({ eventId: core.session().eventId, ownerId: 'o', ownerName: 'shooter' });
    assert.notEqual(magnet.view(), undefined, `${how}: nothing is released inside the caller's stack`);
    core.tick();
    assert.equal(magnet.view(), undefined, `${how}: released in the next tick`);
    assert.equal(order[order.length - 2], 'release', `${how}: the release comes first in that tick`);
    assert.equal(p.knocks.length, knocks, `${how}: no hold step in the release tick`);
    for (let t = 0; t < 4; t++) core.tick();
    assert.equal(p.knocks.length, knocks);
  }
});
