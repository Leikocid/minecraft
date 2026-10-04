// The UFO magnet's choice (src/ufo/magnet-select.ts): the zone of UFO §3, the
// pure priority-and-nearness selection with the limit of 10 (L0-magn-rlim),
// and the whole magnet-on pass over a fake dimension — the lazy cut, double
// chests, the hopper rule, doors, legendaries, the armour tags, remove-first
// with rollback (L0-magn-rdup) and a scan that throws. The engine half is
// src/gametest/ufo-magnet-select.ts.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const bundle = await build({
  stdin: {
    contents: "export * from './src/ufo/magnet-select.ts'; export { IRON_TAG } from './src/ufo/event.ts';",
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
  ZONE_RADIUS,
  ZONE_DEPTH,
  ELEMENT_LIMIT,
  GROUND,
  STACK,
  HOLDER,
  BLOCK,
  ORE,
  zoneOf,
  inZone,
  distanceFrom,
  reach,
  zoneBox,
  rank,
  selectByPriority,
  magnetOn,
  IRON_TAG,
} = m;

const mc = (id) => (id.includes(':') ? id : `minecraft:${id}`);
const RANGE = { min: -64, max: 320 };
const CENTRE = { x: 100, y: 64, z: -40 };
const HOVER = 104;

// ---------------------------------------------------------------- the zone

test('the zone: r 100 around the centre, from centre − 20 to the hover height, clamped to the world', () => {
  assert.equal(ZONE_RADIUS, 100);
  assert.equal(ZONE_DEPTH, 20);
  assert.equal(ELEMENT_LIMIT, 10);
  const z = zoneOf(CENTRE, HOVER, RANGE);
  assert.deepEqual([z.yMin, z.yMax, z.radius], [44, 104, 100]);
  const box = zoneBox(z);
  assert.deepEqual(
    [box.to.x - box.from.x + 1, box.to.y - box.from.y + 1, box.to.z - box.from.z + 1],
    [201, 61, 201],
    'the box is 201 × 61 × 201'
  );
  const low = zoneOf({ x: 0, y: -55, z: 0 }, -15, RANGE);
  assert.equal(low.yMin, -64, 'clamped to the floor');
  const high = zoneOf({ x: 0, y: 300, z: 0 }, 400, RANGE);
  assert.equal(high.yMax, 319, 'clamped to the top row');
});

test('the cylinder: horizontal distance from the centre block’s middle, block rows inclusive', () => {
  const z = zoneOf(CENTRE, HOVER, RANGE);
  const mid = { x: 100.5, z: -39.5 };
  assert.ok(inZone(z, { x: mid.x + 100, y: 64, z: mid.z }), 'on the rim');
  assert.ok(!inZone(z, { x: mid.x + 100.01, y: 64, z: mid.z }), 'just outside the rim');
  assert.ok(!inZone(z, { x: mid.x + 71, y: 64, z: mid.z + 71 }), 'a box corner is outside the cylinder');
  assert.ok(inZone(z, { x: mid.x, y: 44, z: mid.z }), 'the floor row');
  assert.ok(!inZone(z, { x: mid.x, y: 43.99, z: mid.z }), 'below the floor');
  assert.ok(inZone(z, { x: mid.x, y: 104.9, z: mid.z }), 'the hover row');
  assert.ok(!inZone(z, { x: mid.x, y: 105, z: mid.z }), 'above the hover row');
  assert.equal(distanceFrom(z, { x: 100.5, y: 64.5 + 3, z: -39.5 + 4 }), 5);
});

test('reach: a sphere around the centre holds every cell of the cylinder', () => {
  const z = zoneOf(CENTRE, HOVER, RANGE);
  const r = reach(z);
  const box = zoneBox(z);
  for (const x of [box.from.x, box.to.x + 1]) for (const y of [box.from.y, box.to.y + 1]) for (const zz of [box.from.z, box.to.z + 1]) {
    const d = Math.hypot(x - 100.5, y - 64.5, zz - -39.5);
    if (Math.hypot(x - 100.5, zz - -39.5) <= 101) assert.ok(d <= r, `corner ${x},${y},${zz} at ${d.toFixed(1)} is beyond reach ${r}`);
  }
});

// ---------------------------------------------------------------- the pure choice

const cand = (cls, distance, key = `${cls}-${distance}`, sub = 0) => ({ cls, distance, key, sub });
const keys = (list) => list.map((c) => c.key);

test('rank: class first, then nearest, then key, then slot', () => {
  const list = [cand(4, 1, 'b'), cand(1, 9, 'x'), cand(2, 3, 'c', 2), cand(2, 3, 'c', 0), cand(1, 9, 'w'), cand(3, 0.5, 'm')];
  assert.deepEqual(keys(rank(list)), ['w', 'x', 'c', 'c', 'm', 'b']);
  assert.deepEqual(rank(list).filter((c) => c.key === 'c').map((c) => c.sub), [0, 2]);
});

test('selectByPriority: at most 10, a higher class always before a nearer lower one', () => {
  const producers = [
    () => [cand(GROUND, 30, 'g2'), cand(GROUND, 20, 'g1')],
    () => [cand(STACK, 25, 's', 1), cand(STACK, 25, 's', 0)],
    () => [cand(HOLDER, 15, 'h1'), cand(HOLDER, 40, 'h2')],
    () => Array.from({ length: 12 }, (_, i) => cand(BLOCK, 12 - i, `b${12 - i}`)),
    () => [cand(ORE, 0.5, 'o')],
  ];
  const got = selectByPriority(producers);
  assert.equal(got.length, ELEMENT_LIMIT);
  assert.deepEqual(keys(got), ['g1', 'g2', 's', 's', 'h1', 'h2', 'b1', 'b2', 'b3', 'b4']);
  assert.deepEqual(got.slice(2, 4).map((c) => c.sub), [0, 1]);
});

test('selectByPriority: the lazy cut — a lower class runs only while a place is free, told how many', () => {
  const calls = [];
  const producer = (cls, n) => (free) => {
    calls.push([cls, free]);
    return Array.from({ length: n }, (_, i) => cand(cls, i + 1, `${cls}.${i}`));
  };
  const got = selectByPriority([producer(1, 7), producer(2, 5), producer(3, 9), producer(4, 9), producer(5, 9)]);
  assert.equal(got.length, 10);
  assert.deepEqual(calls, [[1, 10], [2, 3]], 'classes 3–5 never ran');
  assert.deepEqual(got.map((c) => c.cls).join(''), '1111111222');
  assert.equal(selectByPriority([producer(1, 3)], 2).length, 2, 'the limit is a parameter');
  assert.deepEqual(selectByPriority([() => [], () => []]), []);
});

// ---------------------------------------------------------------- a fake dimension

class Stack {
  constructor(typeId, amount = 1) {
    this.typeId = mc(typeId);
    this.amount = amount;
  }
}

class FakeContainer {
  constructor(size, items = {}) {
    this.size = size;
    this.slots = new Array(size).fill(undefined);
    for (const [k, s] of Object.entries(items)) this.slots[Number(k)] = s;
    this.writes = [];
  }
  getItem(k) {
    const s = this.slots[k];
    return s === undefined ? undefined : new Stack(s.typeId, s.amount);
  }
  setItem(k, s) {
    this.writes.push([k, s?.typeId]);
    this.slots[k] = s === undefined ? undefined : new Stack(s.typeId, s.amount);
  }
}

let entitySeq = 0;

class FakeEntity {
  constructor(dim, typeId, location, extra = {}) {
    this.dim = dim;
    this.id = `${-1000 - ++entitySeq}`;
    this.typeId = mc(typeId);
    this.location = { ...location };
    this.isValid = true;
    this.tags = new Set();
    this.stack = extra.stack;
    this.armour = extra.armour ?? {};
    this.hands = extra.hands ?? {};
    this.container = extra.container;
  }
  getComponent(name) {
    if (name === 'minecraft:item') return this.stack === undefined ? undefined : { itemStack: new Stack(this.stack.typeId, this.stack.amount) };
    if (name === 'minecraft:inventory') return this.container === undefined ? undefined : { container: this.container };
    return undefined;
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
  remove() {
    this.isValid = false;
  }
}

const perm = (typeId, states = {}) => ({ type: typeId, states, getState: (n) => states[n] });

class FakeBlock {
  constructor(dim, location, typeId, states = {}, container) {
    this.dim = dim;
    this.location = location;
    this.permutation = perm(mc(typeId), states);
    this.container = container;
  }
  get typeId() {
    return this.permutation.type;
  }
  getComponent(name) {
    return name === 'minecraft:inventory' && this.container !== undefined ? { container: this.container } : undefined;
  }
  setType(id) {
    this.dim.mutations.push(`setType ${this.location.x},${this.location.y},${this.location.z} ${id}`);
    this.permutation = perm(mc(id));
    if (mc(id) === 'minecraft:air') this.container = undefined;
  }
  setPermutation(p) {
    this.dim.mutations.push(`setPermutation ${this.location.x},${this.location.y},${this.location.z} ${p.type}`);
    this.permutation = p;
  }
}

/** Parses the magnet's own `tag @e[…] add|remove <tag>` commands; hasitem as U4b measured it. */
function runTag(dim, text) {
  const mm = text.match(/^tag @e\[(.*)\] (add|remove) (\S+)$/);
  if (mm === null) throw new Error(`fake: unknown command ${text}`);
  const [, args, op, tag] = mm;
  const hasitem = args.match(/hasitem=\{item=([^,}]+)(?:,location=([^}]+))?\}/);
  const rest = args.replace(/,?hasitem=\{[^}]*\}/, '').split(',');
  const kv = rest.map((a) => a.split('=')).filter((p) => p.length === 2);
  const get = (k) => kv.find(([key]) => key === k)?.[1];
  const [x, y, z, r] = ['x', 'y', 'z', 'r'].map((k) => Number(get(k)));
  const notTypes = kv.filter(([k, v]) => k === 'type' && v.startsWith('!')).map(([, v]) => mc(v.slice(1)));
  const needTag = get('tag');
  if (hasitem !== null && dim.hiddenItems.has(hasitem[1])) throw new Error(`Syntax error: Unexpected "${hasitem[1]}"`);
  const holds = (e) => {
    if (hasitem === null) return true;
    const [, item, location] = hasitem;
    const slot = { 'slot.armor.head': e.armour.head, 'slot.armor.chest': e.armour.chest, 'slot.armor.legs': e.armour.legs, 'slot.armor.feet': e.armour.feet, 'slot.weapon.mainhand': e.hands.mainhand, 'slot.weapon.offhand': e.hands.offhand };
    if (location !== undefined) return slot[location] === item;
    return Object.values(e.armour).includes(item);
  };
  let n = 0;
  for (const e of dim.entities) {
    if (!e.isValid || notTypes.includes(e.typeId)) continue;
    if (Math.hypot(e.location.x - x, e.location.y - y, e.location.z - z) > r) continue;
    if (needTag !== undefined && !e.tags.has(needTag)) continue;
    if (!holds(e)) continue;
    if (op === 'add') e.addTag(tag);
    else e.removeTag(tag);
    n++;
  }
  if (n === 0) throw new Error('No targets matched selector');
  return { successCount: n };
}

class FakeDimension {
  constructor() {
    this.heightRange = RANGE;
    this.entities = [];
    this.blocks = new Map();
    this.commands = [];
    this.getBlocksCalls = [];
    this.mutations = [];
    this.failSpawn = () => false;
    this.failScan = false;
    this.hiddenItems = new Set(['andrew:web_sword_crafted', 'andrew:scythe_of_calamity_crafted', 'andrew:orbital_cannon_crafted']);
  }
  key(b) {
    return `${Math.floor(b.x)},${Math.floor(b.y)},${Math.floor(b.z)}`;
  }
  put(b, typeId, states = {}, container) {
    const block = new FakeBlock(this, { x: b.x, y: b.y, z: b.z }, typeId, states, container);
    this.blocks.set(this.key(b), block);
    return block;
  }
  getBlock(b) {
    const k = this.key(b);
    if (!this.blocks.has(k)) this.blocks.set(k, new FakeBlock(this, { x: Math.floor(b.x), y: Math.floor(b.y), z: Math.floor(b.z) }, 'air'));
    return this.blocks.get(k);
  }
  getBlocks(volume, options, allowUnloaded) {
    this.getBlocksCalls.push({ volume, types: options.includeTypes, allowUnloaded });
    if (this.failScan) throw new Error('UnloadedChunksError');
    const types = new Set(options.includeTypes);
    const { from, to } = volume;
    const found = [...this.blocks.values()].filter((b) => types.has(b.typeId) && b.location.x >= from.x && b.location.x <= to.x && b.location.y >= from.y && b.location.y <= to.y && b.location.z >= from.z && b.location.z <= to.z);
    return { getBlockLocationIterator: () => found.map((b) => ({ ...b.location }))[Symbol.iterator]() };
  }
  getEntities(q = {}) {
    return this.entities.filter((e) => {
      if (!e.isValid) return false;
      if (q.type !== undefined && e.typeId !== q.type) return false;
      if (q.excludeTypes?.includes(e.typeId)) return false;
      if (q.tags !== undefined && !q.tags.every((t) => e.tags.has(t))) return false;
      if (q.location !== undefined && Math.hypot(e.location.x - q.location.x, e.location.y - q.location.y, e.location.z - q.location.z) > q.maxDistance) return false;
      return true;
    });
  }
  spawnItem(stack, location) {
    if (this.failSpawn(stack)) throw new Error('spawn refused');
    const e = new FakeEntity(this, 'item', location, { stack: new Stack(stack.typeId, stack.amount) });
    e.spawnedByMagnet = true;
    this.entities.push(e);
    return e;
  }
  runCommand(text) {
    this.commands.push(text);
    return runTag(this, text);
  }
  // seeding helpers
  item(typeId, at, amount = 1) {
    const e = new FakeEntity(this, 'item', at, { stack: new Stack(typeId, amount) });
    this.entities.push(e);
    return e;
  }
  mob(typeId, at, extra) {
    const e = new FakeEntity(this, typeId, at, extra);
    this.entities.push(e);
    return e;
  }
  spawnedItems() {
    return this.entities.filter((e) => e.spawnedByMagnet && e.isValid);
  }
}

const host = (logs = []) => ({
  itemStack: (typeId, amount) => new Stack(typeId, amount),
  volume: (from, to) => ({ from, to }),
  now: () => 0,
  log: (msg) => logs.push(msg),
});

/** On the centre's row: (dx, dz) from the centre block. */
const C = (dx, dz, dy = 1) => ({ x: CENTRE.x + dx, y: CENTRE.y + dy, z: CENTRE.z + dz });
const E = (dx, dz, dy = 1) => ({ x: CENTRE.x + dx + 0.5, y: CENTRE.y + dy, z: CENTRE.z + dz + 0.5 });
const run = (dim, opts, logs) => magnetOn(dim, CENTRE, HOVER, host(logs), opts);
const shape = (sel) => sel.elements.map((e) => e.cls).join('');

// ---------------------------------------------------------------- the pass

test('magnet-on (UFO AC-8): 3 ground items, 4 chest stacks, the 3 nearest holders; blocks and ore stay', () => {
  const dim = new FakeDimension();
  const items = [dim.item('iron_ingot', E(2, 0)), dim.item('iron_nugget', E(0, 4)), dim.item('shears', E(-6, 0))];
  dim.item('dirt', E(1, 1));
  const chest = new FakeContainer(27, { 0: new Stack('iron_sword'), 1: new Stack('bucket'), 2: new Stack('raw_iron', 3), 3: new Stack('iron_ingot', 4), 5: new Stack('dirt', 3) });
  dim.put(C(0, -8), 'chest', {}, chest);
  const g1 = dim.mob('iron_golem', E(9, 0));
  const g2 = dim.mob('iron_golem', E(0, 11));
  const cart = dim.mob('minecart', E(-12, 2));
  const far = dim.mob('minecart', E(12, 9));
  dim.mob('cow', E(3, 3));
  for (const b of [C(4, 4), C(-4, 4), C(4, -4)]) dim.put(b, 'iron_block');
  for (const b of [C(2, 2, 0), C(-2, -2, -1)]) dim.put(b, 'iron_ore');
  const logs = [];
  const sel = run(dim, {}, logs);
  assert.equal(shape(sel), '1112222333');
  assert.deepEqual(sel.elements.filter((e) => e.cls === GROUND).map((e) => e.entity.id), items.map((e) => e.id));
  assert.deepEqual(sel.elements.filter((e) => e.cls === HOLDER).map((e) => e.entity.id), [g1.id, g2.id, cart.id]);
  assert.deepEqual(sel.elements.filter((e) => e.cls === STACK).map((e) => `${e.from}*${e.entity.stack.amount}`), ['minecraft:iron_sword*1', 'minecraft:bucket*1', 'minecraft:raw_iron*3', 'minecraft:iron_ingot*4']);
  assert.deepEqual([0, 1, 2, 3].map((k) => chest.getItem(k)), [undefined, undefined, undefined, undefined]);
  assert.deepEqual(chest.getItem(5), new Stack('dirt', 3));
  assert.deepEqual(sel.elements.map((e) => e.slot), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 'ring places in selection order');
  assert.equal(sel.spawned.size, 4);
  assert.ok(!far.hasTag(IRON_TAG));
  assert.ok([g1, g2, cart].every((e) => e.hasTag(IRON_TAG)), 'the held holders carry the tag');
  assert.ok(dim.mutations.every((m) => !m.includes('iron_block') && !m.includes('iron_ore')), 'no block was touched');
  assert.equal(dim.getBlock(C(4, 4)).typeId, 'minecraft:iron_block');
  assert.equal(dim.getBlocksCalls.length, 1, 'one getBlocks');
  assert.equal(dim.getBlocksCalls[0].allowUnloaded, true, 'the scan skips unloaded chunks instead of throwing (C-12′)');
  assert.match(logs[0], /10 element\(s\) by class 3\/4\/3\/0\/0/);
});

test('magnet-on (AC-8, second scenario): 1 item and 12 blocks — the item and the 9 nearest blocks', () => {
  const dim = new FakeDimension();
  dim.item('iron_pickaxe', E(-1, -1));
  const blocks = Array.from({ length: 12 }, (_, i) => C(3 + i, i % 2 === 0 ? 0 : 1));
  for (const b of blocks) dim.put(b, 'iron_block');
  const sel = run(dim);
  assert.equal(shape(sel), '1444444444');
  assert.deepEqual(blocks.map((b) => dim.getBlock(b).typeId.replace('minecraft:', '')), [...Array(9).fill('air'), 'iron_block', 'iron_block', 'iron_block']);
  assert.ok(sel.elements.slice(1).every((e, i, a) => i === 0 || a[i - 1].distance <= e.distance));
  assert.equal(dim.spawnedItems().filter((e) => e.stack.typeId === 'minecraft:iron_block').length, 9);
});

test('the lazy cut: with 10 ground items the blocks are never scanned and no command runs', () => {
  const dim = new FakeDimension();
  for (let i = 0; i < 12; i++) dim.item('iron_ingot', E(i, 0));
  dim.put(C(1, 1), 'chest', {}, new FakeContainer(27, { 0: new Stack('iron_ingot') }));
  dim.mob('iron_golem', E(2, 2));
  const sel = run(dim);
  assert.equal(shape(sel), '1111111111');
  assert.deepEqual(sel.elements.map((e) => e.distance), [...sel.elements.map((e) => e.distance)].sort((a, b) => a - b));
  assert.equal(dim.getBlocksCalls.length, 0);
  assert.equal(dim.commands.length, 0);
  assert.deepEqual(sel.found, { 1: 12 });
});

test('outside the cylinder or below the floor: never a candidate', () => {
  const dim = new FakeDimension();
  dim.item('iron_ingot', E(72, 72));
  dim.item('iron_ingot', E(0, 0, -21));
  dim.put(C(71, 71), 'iron_block');
  dim.put(C(0, 0, -21), 'iron_ore');
  dim.put(C(0, 3, 41), 'iron_block');
  dim.put(C(0, 3, 40), 'iron_block');
  const sel = run(dim);
  assert.equal(shape(sel), '4');
  assert.equal(sel.elements[0].origin.y, CENTRE.y + 40, 'the hover row is in the zone');
});

test('containers: only iron comes out, nearest container first, slots in order; the block stays', () => {
  const dim = new FakeDimension();
  const near = new FakeContainer(9, { 0: new Stack('dirt', 64), 2: new Stack('iron_nugget', 5), 4: new Stack('compass'), 8: new Stack('iron_ingot', 2) });
  const far = new FakeContainer(3, { 0: new Stack('raw_iron', 7), 2: new Stack('dirt') });
  dim.put(C(3, 0), 'dispenser', {}, near);
  dim.put(C(20, 0), 'lit_furnace', {}, far);
  const crafter = dim.put(C(1, 0), 'crafter');
  const sel = run(dim);
  assert.deepEqual(sel.elements.map((e) => `${e.from}@${e.origin.x - CENTRE.x}`), ['minecraft:iron_nugget@3', 'minecraft:compass@3', 'minecraft:iron_ingot@3', 'minecraft:raw_iron@20']);
  assert.deepEqual(near.getItem(0), new Stack('dirt', 64));
  assert.deepEqual(far.getItem(2), new Stack('dirt'));
  assert.equal(dim.getBlock(C(3, 0)).typeId, 'minecraft:dispenser');
  assert.equal(dim.getBlock(C(20, 0)).typeId, 'minecraft:lit_furnace');
  assert.equal(crafter.typeId, 'minecraft:crafter');
  assert.ok(sel.spawned.size === 4 && [...sel.spawned].every((id) => dim.spawnedItems().some((e) => e.id === id)));
});

test('a container cut mid-way keeps its remaining iron', () => {
  const dim = new FakeDimension();
  for (let i = 0; i < 8; i++) dim.item('iron_ingot', E(i, 0));
  const c = new FakeContainer(27, { 0: new Stack('iron_ingot'), 1: new Stack('iron_nugget'), 2: new Stack('raw_iron') });
  dim.put(C(0, 5), 'barrel', {}, c);
  const sel = run(dim);
  assert.equal(shape(sel), '1111111122');
  assert.deepEqual([0, 1, 2].map((k) => c.getItem(k)?.typeId), [undefined, undefined, 'minecraft:raw_iron']);
});

test('a double chest yields each stack once; a row of two double chests is two containers', () => {
  const dim = new FakeDimension();
  // Either half shows the same 54 slots (U5; one view object here, as the engine's views agree).
  const pairA = new FakeContainer(54, { 27: new Stack('iron_nugget', 12), 53: new Stack('dirt', 3) });
  const pairB = new FakeContainer(54, { 3: new Stack('iron_ingot', 2) });
  dim.put(C(4, 0), 'chest', {}, pairA);
  dim.put(C(5, 0), 'chest', {}, pairA);
  dim.put(C(6, 0), 'chest', {}, pairB);
  dim.put(C(7, 0), 'chest', {}, pairB);
  const sel = run(dim);
  assert.deepEqual(sel.elements.map((e) => `${e.from}*${e.entity.stack.amount}@${e.origin.x - CENTRE.x}`), ['minecraft:iron_nugget*12@4', 'minecraft:iron_ingot*2@6']);
  assert.equal(pairA.getItem(27), undefined);
  assert.deepEqual(pairA.getItem(53), new Stack('dirt', 3));
});

test('a double chest is paired by contents in either half order, not by adjacency alone', () => {
  const dim = new FakeDimension();
  const a = new FakeContainer(54, { 0: new Stack('iron_ingot'), 30: new Stack('dirt') });
  const swapped = new FakeContainer(54, { 27: new Stack('iron_ingot'), 3: new Stack('dirt') });
  swapped.getItem = (k) => a.getItem((k + 27) % 54);
  dim.put(C(4, 0), 'trapped_chest', {}, a);
  dim.put(C(4, 1), 'trapped_chest', {}, swapped);
  // Another 54-slot trapped chest on the other side: a neighbour of the same type, but another pair.
  dim.put(C(4, -1), 'trapped_chest', {}, new FakeContainer(54, { 0: new Stack('iron_ingot') }));
  const sel = run(dim);
  assert.deepEqual(sel.elements.map((e) => `${e.from}@${e.origin.z - CENTRE.z}`), ['minecraft:iron_ingot@0', 'minecraft:iron_ingot@-1'], 'the pair once; the chest beside it is its own');
});

test('the hopper (L0-lgnd-cx13): with anything in it a container that stays and gives up its iron and legendary weapons, empty a block that is pulled', () => {
  const dim = new FakeDimension();
  const full = new FakeContainer(5, { 0: new Stack('iron_ingot', 3), 4: new Stack('dirt') });
  const legendaryOnly = new FakeContainer(5, { 0: new Stack('andrew:orbital_cannon') });
  dim.put(C(2, 0), 'hopper', {}, full);
  dim.put(C(4, 0), 'hopper', {}, legendaryOnly);
  dim.put(C(6, 0), 'hopper', {}, new FakeContainer(5));
  const sel = run(dim);
  assert.deepEqual(sel.elements.map((e) => `${e.cls}:${e.from}@${e.origin.x - CENTRE.x}`), ['2:minecraft:iron_ingot@2', '2:andrew:orbital_cannon@4', '4:minecraft:hopper@6']);
  assert.equal(dim.getBlock(C(2, 0)).typeId, 'minecraft:hopper');
  assert.deepEqual(full.getItem(4), new Stack('dirt'));
  assert.equal(dim.getBlock(C(4, 0)).typeId, 'minecraft:hopper');
  assert.equal(legendaryOnly.getItem(0), undefined);
  assert.equal(dim.getBlock(C(6, 0)).typeId, 'minecraft:air');
  assert.deepEqual(dim.spawnedItems().map((e) => e.stack.typeId).sort(), ['andrew:orbital_cannon', 'minecraft:hopper', 'minecraft:iron_ingot']);
});

test('blocks: air plus exactly one own item; a door once, by its lower half; ore gives one raw_iron', () => {
  const dim = new FakeDimension();
  dim.put(C(2, 0), 'iron_door', { upper_block_bit: false });
  dim.put(C(2, 0, 2), 'iron_door', { upper_block_bit: true });
  dim.put(C(-3, 0), 'chipped_anvil');
  dim.put(C(0, 4), 'iron_chain');
  dim.put(C(0, -5, 0), 'deepslate_iron_ore');
  dim.put(C(5, 5), 'deprecated_anvil');
  const sel = run(dim);
  assert.deepEqual(sel.elements.map((e) => `${e.cls}:${e.entity.stack.typeId}*${e.entity.stack.amount}`), [
    '4:minecraft:iron_door*1',
    '4:minecraft:chipped_anvil*1',
    '4:minecraft:iron_chain*1',
    '4:minecraft:damaged_anvil*1',
    '5:minecraft:raw_iron*1',
  ]);
  assert.equal(sel.elements[0].origin.y, CENTRE.y + 1, 'the door is addressed by its lower half');
  for (const b of [C(2, 0), C(2, 0, 2), C(-3, 0), C(0, 4), C(0, -5, 0), C(5, 5)]) assert.equal(dim.getBlock(b).typeId, 'minecraft:air');
  assert.equal(dim.spawnedItems().length, 5);
});

test('a door is one element even when only its upper half is in the zone', () => {
  const dim = new FakeDimension();
  dim.put(C(1, 0, -21), 'iron_door', { upper_block_bit: false });
  dim.put(C(1, 0, -20), 'iron_door', { upper_block_bit: true });
  const sel = run(dim);
  assert.equal(sel.elements.length, 1);
  assert.equal(sel.elements[0].origin.y, CENTRE.y - 21);
  assert.equal(dim.getBlock(C(1, 0, -20)).typeId, 'minecraft:air');
});

test('legendary weapons (UFO-TUNE-01): pulled like iron wherever they lie; a craft token is not', () => {
  const dim = new FakeDimension();
  const scythe = dim.item('andrew:scythe_of_calamity', E(1, 0));
  const token = dim.item('andrew:web_sword_crafted', E(1, 1));
  for (let i = 0; i < 5; i++) dim.item(['iron_ingot', 'iron_nugget', 'raw_iron', 'iron_sword', 'shears'][i], E(-4 - i, 4));
  const hopper = new FakeContainer(5, { 0: new Stack('andrew:orbital_cannon') });
  dim.put(C(0, -6), 'hopper', {}, hopper);
  const chest = new FakeContainer(27, { 0: new Stack('andrew:web_sword'), 1: new Stack('iron_ingot', 7), 2: new Stack('andrew:dragon_katana_crafted') });
  dim.put(C(0, -10), 'chest', {}, chest);
  const sel = run(dim);
  assert.equal(shape(sel), '111111222');
  assert.equal(sel.elements[0].entity, scythe, 'the Scythe is the nearest ground element');
  assert.deepEqual(sel.elements.slice(6).map((e) => e.from), ['andrew:orbital_cannon', 'andrew:web_sword', 'minecraft:iron_ingot']);
  assert.equal(hopper.getItem(0), undefined);
  assert.equal(chest.getItem(0), undefined);
  assert.equal(chest.getItem(1), undefined);
  assert.equal(chest.getItem(2).typeId, 'andrew:dragon_katana_crafted', 'a token stays in the chest');
  assert.ok(token.isValid && !sel.elements.some((e) => e.entity === token), 'a token on the ground is not pulled');
});

test('legendary weapons count towards the 10 like iron', () => {
  const dim = new FakeDimension();
  for (let i = 0; i < 10; i++) dim.item('iron_ingot', E(-2 - i, 3));
  const katana = dim.item('andrew:dragon_katana', E(1, 0));
  const sel = run(dim);
  assert.equal(shape(sel), '1111111111');
  assert.equal(sel.elements[0].entity, katana, 'the nearer weapon takes a place');
  assert.equal(sel.elements.filter((e) => e.from === 'minecraft:iron_ingot').length, 9, 'the farthest ingot is left');
});

test('holders (L0-magn-adar, UFO-TUNE-01): iron armour by four tag commands, a legendary weapon held by twelve; minecarts by type', () => {
  const dim = new FakeDimension();
  const golem = dim.mob('iron_golem', E(12, 12));
  const helmet = dim.mob('zombie', E(-10, -10), { armour: { head: 'minecraft:iron_helmet' } });
  const stand = dim.mob('armor_stand', E(10, -10), { armour: { legs: 'minecraft:iron_leggings' } });
  const bare = dim.mob('zombie', E(-10, -4));
  const sword = dim.mob('zombie', E(-4, -10), { hands: { mainhand: 'minecraft:iron_sword' } });
  const horse = dim.mob('horse', E(4, -10), { armour: {} });
  const cannonStand = dim.mob('armor_stand', E(6, 6), { armour: { head: 'minecraft:iron_helmet' }, hands: { mainhand: 'andrew:orbital_cannon' } });
  const katanaStand = dim.mob('armor_stand', E(-3, 9), { armour: {}, hands: { mainhand: 'andrew:dragon_katana' } });
  const offhandZombie = dim.mob('zombie', E(-6, 6), { armour: {}, hands: { offhand: 'andrew:web_sword' } });
  const loadedCart = dim.mob('chest_minecart', E(7, 0), { container: new FakeContainer(27, { 3: new Stack('andrew:web_sword') }) });
  const ironCart = dim.mob('hopper_minecart', E(8, 0), { container: new FakeContainer(5, { 0: new Stack('iron_ingot') }) });
  const player = dim.mob('player', E(1, 1), { armour: { head: 'minecraft:iron_helmet' }, hands: { mainhand: 'andrew:web_sword' } });
  const stale = dim.mob('cow', E(2, 2));
  stale.addTag(IRON_TAG);
  const sel = run(dim, { limit: 20 });
  const chosen = new Set(sel.elements.map((e) => e.entity));
  for (const e of [golem, helmet, stand, cannonStand, katanaStand, offhandZombie, loadedCart, ironCart]) assert.ok(chosen.has(e), `${e.typeId} at ${e.location.x - CENTRE.x},${e.location.z - CENTRE.z} was not chosen`);
  for (const e of [bare, sword, horse, player, stale]) assert.ok(!chosen.has(e), `${e.typeId} was chosen`);
  for (const e of [bare, sword, player, stale]) assert.ok(!e.hasTag(IRON_TAG), `${e.typeId} keeps the tag`);
  assert.ok(sel.elements.every((e) => e.cls === HOLDER));
  assert.ok(sel.elements.every((e, i, a) => i === 0 || a[i - 1].distance <= e.distance), 'nearest first');
  const adds = dim.commands.filter((c) => c.includes(' add '));
  const armour = adds.filter((c) => c.includes('location=slot.armor.'));
  assert.equal(armour.length, 4, 'one command per armour piece, never a list');
  assert.ok(armour.every((c) => /hasitem=\{item=minecraft:iron_\w+,location=slot\.armor\.\w+\}/.test(c) && c.includes('type=!minecraft:player')));
  const weapons = adds.filter((c) => c.includes('item=andrew:'));
  assert.equal(weapons.length, 12, 'four weapons, each asked with no location, in the main hand and in the off hand');
  assert.ok(weapons.every((c) => c.includes('type=!minecraft:player') && c.includes('type=!minecraft:item')));
  assert.equal(adds.length, 16);
  assert.ok(!dim.commands.some((c) => c.includes('_crafted')), 'tokens are hidden from commands; never asked by hasitem');
  assert.deepEqual(sel.failures, []);
});

test('a legendary hasitem command that fails is logged; the other holders are still taken', () => {
  const dim = new FakeDimension();
  dim.hiddenItems.add('andrew:web_sword');
  const helmet = dim.mob('zombie', E(-10, -10), { armour: { head: 'minecraft:iron_helmet' } });
  const golem = dim.mob('iron_golem', E(12, 12));
  const sel = run(dim);
  assert.deepEqual(sel.elements.map((e) => e.entity), [helmet, golem]);
  assert.match(sel.failures.join(' '), /class 3 commands/);
});

test('remove first, spawn second, roll back (L0-magn-rdup): a failed spawn restores the slot and the block', () => {
  const dim = new FakeDimension();
  const c = new FakeContainer(27, { 0: new Stack('iron_ingot', 5), 1: new Stack('iron_nugget', 2) });
  dim.put(C(1, 0), 'chest', {}, c);
  dim.put(C(3, 0), 'iron_door', { upper_block_bit: false, direction: 2 });
  dim.put(C(3, 0, 2), 'iron_door', { upper_block_bit: true, direction: 2 });
  dim.put(C(5, 0), 'iron_bars');
  dim.failSpawn = (s) => s.typeId === 'minecraft:iron_ingot' || s.typeId === 'minecraft:iron_door';
  const logs = [];
  const sel = run(dim, {}, logs);
  assert.deepEqual(sel.elements.map((e) => e.from), ['minecraft:iron_nugget', 'minecraft:iron_bars']);
  assert.deepEqual(c.getItem(0), new Stack('iron_ingot', 5), 'the slot is put back');
  assert.deepEqual(c.writes.slice(0, 2), [[0, undefined], [0, 'minecraft:iron_ingot']], 'emptied before the spawn, refilled after it threw');
  assert.equal(dim.getBlock(C(3, 0)).typeId, 'minecraft:iron_door');
  assert.equal(dim.getBlock(C(3, 0, 2)).typeId, 'minecraft:iron_door');
  assert.equal(dim.getBlock(C(3, 0, 2)).permutation.getState('upper_block_bit'), true);
  assert.equal(sel.failures.length, 2);
  assert.match(logs[0], /put back/);
  assert.match(logs[0], /block restored/);
  assert.equal(dim.spawnedItems().length, 2);
});

test('a block scan that throws: classes 1 and 3 still run, the error is logged once, nothing is mutated', () => {
  const dim = new FakeDimension();
  dim.failScan = true;
  const item = dim.item('iron_ingot', E(1, 0));
  const golem = dim.mob('iron_golem', E(5, 0));
  dim.put(C(2, 2), 'iron_block');
  const sel = run(dim);
  assert.deepEqual(sel.elements.map((e) => e.entity), [item, golem]);
  assert.equal(sel.failures.length, 1);
  assert.match(sel.failures[0], /block scan: Error: UnloadedChunksError/);
  assert.deepEqual(dim.mutations, []);
  assert.equal(dim.getBlocksCalls.length, 1, 'scanned once for classes 2, 4 and 5');
});

test('a source that changed between the choice and its turn is skipped, not duplicated', () => {
  const dim = new FakeDimension();
  const c = new FakeContainer(27, { 0: new Stack('iron_ingot', 5) });
  dim.put(C(1, 0), 'chest', {}, c);
  const original = c.getItem.bind(c);
  let reads = 0;
  c.getItem = (k) => (k === 0 && ++reads > 1 ? new Stack('iron_ingot', 4) : original(k));
  const sel = run(dim);
  assert.equal(sel.elements.length, 0);
  assert.deepEqual(c.slots[0], new Stack('iron_ingot', 5));
  assert.match(sel.failures[0], /changed/);
});

test('undefined and invalid entities are skipped (C-22)', () => {
  const dim = new FakeDimension();
  const gone = dim.item('iron_ingot', E(1, 0));
  gone.isValid = false;
  const ok = dim.item('iron_ingot', E(2, 0));
  const real = dim.getEntities.bind(dim);
  dim.getEntities = (q) => [undefined, ...real(q), gone];
  const sel = run(dim);
  assert.deepEqual(sel.elements.map((e) => e.entity), [ok]);
});
