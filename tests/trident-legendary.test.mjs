// The Above-Water Trident under the legendary rules, off the engine (L0-trdt-a005; L0-trdt-adcl T2–T7; R-trdt-003).
//
// Three bundles, each against its own in-memory @minecraft/server:
// - src/legendary/enchant.ts, shaped like the Piercing strip's test (CNTR-SCLK-CX01): a slot read is a copy, a slot
//   write raises playerInventoryItemChange again after the handler returns, the off hand raises no inventory event;
// - recovery + retention + state: deliverToLastHolder to an online, dead and offline holder, the departure watch
//   with and without a DropItem swing (T3), watch() on a non-item entity (T5), a death with an empty slot (T4);
// - the UFO magnet's selection over a fake dimension: def #7 on the ground, in a chest and in a hand, and a custody
//   entity that is never a candidate (T6).
// The GameTest twin is src/gametest/trident-legendary.ts.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = async (result) => import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text, 'utf-8').toString('base64'));
const stubPlugin = (name, contents) => ({
  name,
  setup(b) {
    b.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: 'mc', namespace: name }));
    b.onLoad({ filter: /.*/, namespace: name }, () => ({ contents, loader: 'js' }));
  },
});

const TRIDENT = 'andrew:above_water_trident';

/** Every console.warn of the modules under test; each test clears it before it reads it. */
const logs = [];
console.warn = (msg) => logs.push(String(msg));

// ---------------------------------------------------------------- 1. the scrub (R-trdt-003)

const scrubEngine = `
const mc = (globalThis.__mcScrub = { handlers: {}, tick: 0 });
const signal = (name) => ({
  subscribe(fn) { (mc.handlers[name] ??= []).push(fn); return fn; },
  unsubscribe(fn) { mc.handlers[name] = (mc.handlers[name] ?? []).filter((f) => f !== fn); },
});
export const world = { afterEvents: new Proxy({}, { get: (_, name) => signal(name) }) };
export const system = { get currentTick() { return mc.tick; } };
export const EntityComponentTypes = { Inventory: "minecraft:inventory", Equippable: "minecraft:equippable" };
export const EquipmentSlot = { Mainhand: "Mainhand", Offhand: "Offhand" };
`;
const enchant = await load(
  await build({
    entryPoints: [join(projectRoot, 'src', 'legendary', 'enchant.ts')],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    write: false,
    plugins: [stubPlugin('scrub-stub', scrubEngine)],
  })
);
const sc = globalThis.__mcScrub;
const scrubLogs = logs;
enchant.registerEnchantScrub();
enchant.registerEnchantScrub();

/** An ItemStack as far as the scrub reads it: enchantments and the dynamic properties a mark lives in. */
class Stack {
  constructor(typeId, enchants = [], props = {}) {
    this.typeId = typeId;
    this.ench = new Map(enchants);
    this.props = { ...props };
  }
  clone() {
    return new Stack(this.typeId, [...this.ench], this.props);
  }
  getComponent(name) {
    if (name !== 'minecraft:enchantable' || this.typeId.endsWith('_crafted')) return undefined;
    const ench = this.ench;
    return {
      getEnchantment: (id) => (ench.has(id) ? { type: { id }, level: ench.get(id) } : undefined),
      getEnchantments: () => [...ench].map(([id, level]) => ({ type: { id }, level })),
      removeEnchantment: (id) => void ench.delete(id),
    };
  }
}

const list = (stack) => (stack === undefined ? 'empty' : [...stack.ench].map(([id, l]) => `${id}${l}`).sort().join('+'));

const queue = [];
const deliver = (name, event) => queue.push([name, event]);
function flushEvents() {
  for (let guard = 0; queue.length > 0; guard++) {
    assert.ok(guard < 50, 'the events never settle: the scrub feeds itself');
    const [name, event] = queue.shift();
    for (const fn of sc.handlers[name] ?? []) fn(event);
  }
}

function scrubPlayer(name, { offhandAdmits = true } = {}) {
  const slots = new Array(36).fill(undefined);
  let offhand;
  const writes = [];
  const player = {
    id: `id-${name}`,
    name,
    isValid: true,
    writes,
    slots,
    get offhand() {
      return offhand;
    },
    getComponent(type) {
      if (type === 'minecraft:inventory') {
        return {
          container: {
            size: slots.length,
            getItem: (i) => slots[i]?.clone(),
            setItem: (i, stack) => {
              const before = slots[i];
              slots[i] = stack?.clone();
              writes.push(`slot ${i}`);
              deliver('playerInventoryItemChange', { player, slot: i, itemStack: stack?.clone(), beforeItemStack: before });
            },
          },
        };
      }
      if (type === 'minecraft:equippable') {
        return {
          getEquipment: (slot) => (slot === 'Offhand' ? offhand?.clone() : undefined),
          setEquipment: (slot, stack) => {
            if (slot !== 'Offhand' || !offhandAdmits) return false;
            offhand = stack?.clone();
            writes.push('offhand');
            return true;
          },
        };
      }
      return undefined;
    },
  };
  return player;
}

function arrive(player, slot, stack) {
  player.slots[slot] = stack.clone();
  deliver('playerInventoryItemChange', { player, slot, itemStack: stack.clone(), beforeItemStack: undefined });
  flushEvents();
}

function watchScrubs() {
  const reports = [];
  const stop = enchant.observeScrubs((r) => reports.push(r));
  scrubLogs.length = 0;
  return { reports, stop };
}

const LOADED = [['loyalty', 3], ['riptide', 3], ['unbreaking', 3], ['impaling', 5], ['channeling', 1], ['mending', 1]];

test('R-trdt-003: the table forbids Loyalty and Riptide on the trident and nothing else on any weapon; arming twice arms once', () => {
  assert.deepEqual([...enchant.FORBIDDEN_ENCHANTMENTS], [[TRIDENT, ['loyalty', 'riptide']]]);
  assert.equal(sc.handlers.playerInventoryItemChange.length, 1);
  assert.equal(sc.handlers.playerHotbarSelectedSlotChange.length, 1);
});

test('scrubStack: only Loyalty and Riptide, only on the trident; the rest of the stack and its mark stay', () => {
  const loaded = new Stack(TRIDENT, LOADED, { 'andrew:tr_id': 'i1', 'andrew:tr_gen': 2 });
  assert.deepEqual(enchant.scrubStack(loaded), ['loyalty3', 'riptide3']);
  assert.equal(list(loaded), 'channeling1+impaling5+mending1+unbreaking3', 'Unbreaking and every other trident enchantment stays');
  assert.deepEqual(loaded.props, { 'andrew:tr_id': 'i1', 'andrew:tr_gen': 2 });
  assert.deepEqual(enchant.scrubStack(loaded), [], 'a second scrub finds nothing');

  const vanilla = new Stack('minecraft:trident', [['loyalty', 3], ['unbreaking', 3]]);
  assert.deepEqual(enchant.scrubStack(vanilla), []);
  assert.equal(list(vanilla), 'loyalty3+unbreaking3', 'a vanilla trident keeps Loyalty');

  const crossbow = new Stack('andrew:sculk_crossbow', [['piercing', 4], ['quick_charge', 3]]);
  assert.deepEqual(enchant.scrubStack(crossbow), [], 'the Piercing strip stays the crossbow module\'s own');
  assert.deepEqual(enchant.scrubStack(new Stack('andrew:above_water_trident_crafted')), [], 'no enchantable component');
  assert.deepEqual(enchant.scrubStack(undefined), []);
});

test('r003: a trident entering any slot loses Loyalty and Riptide in the event tick, once, keeping the rest and the mark', () => {
  const { reports, stop } = watchScrubs();
  const p = scrubPlayer('Alex');
  sc.tick = 100;
  arrive(p, 20, new Stack(TRIDENT, [['loyalty', 3], ['unbreaking', 3]], { 'andrew:tr_id': 'i2' }));
  stop();
  assert.equal(list(p.slots[20]), 'unbreaking3');
  assert.deepEqual(p.slots[20].props, { 'andrew:tr_id': 'i2' });
  assert.deepEqual(p.writes, ['slot 20'], 'one write; the event it raises finds nothing to scrub');
  assert.equal(reports.length, 1);
  assert.deepEqual({ ...reports[0] }, { playerId: 'id-Alex', playerName: 'Alex', itemId: TRIDENT, where: 20, trigger: 'inventory', removed: ['loyalty3'], kept: ['unbreaking3'], tick: 100 });
  assert.ok(scrubLogs.includes(`[andrew] legendary enchant: took loyalty3 off ${TRIDENT} of Alex (slot 20, inventory); kept unbreaking3`), scrubLogs.join('\n'));
});

test('r003: stacks the scrub leaves alone raise no write and no report', () => {
  const { reports, stop } = watchScrubs();
  const p = scrubPlayer('Steve');
  arrive(p, 0, new Stack(TRIDENT, [['unbreaking', 3], ['impaling', 5]]));
  arrive(p, 1, new Stack('minecraft:trident', [['riptide', 3]]));
  arrive(p, 2, new Stack(TRIDENT));
  arrive(p, 3, new Stack('andrew:above_water_trident_crafted'));
  stop();
  assert.deepEqual(p.writes, []);
  assert.equal(reports.length, 0);
  assert.equal(list(p.slots[1]), 'riptide3');
});

test('r003: the event reads the live slot, so it never writes back an older copy than the slot holds', () => {
  const { reports, stop } = watchScrubs();
  const p = scrubPlayer('Kai');
  p.slots[5] = new Stack(TRIDENT, [['riptide', 3], ['unbreaking', 3]], { 'andrew:tr_holder': 'id-Kai' });
  deliver('playerInventoryItemChange', { player: p, slot: 5, itemStack: new Stack(TRIDENT, [['riptide', 3]]), beforeItemStack: undefined });
  flushEvents();
  stop();
  assert.deepEqual(p.slots[5].props, { 'andrew:tr_holder': 'id-Kai' });
  assert.equal(list(p.slots[5]), 'unbreaking3');
  assert.equal(reports.length, 1);
});

test('r003: the hand trigger scrubs the selected slot and the off hand, which no inventory event names', () => {
  const { reports, stop } = watchScrubs();
  const p = scrubPlayer('Noor');
  p.slots[4] = new Stack(TRIDENT, [['riptide', 2], ['unbreaking', 1]]);
  p.getComponent('minecraft:equippable').setEquipment('Offhand', new Stack(TRIDENT, [['loyalty', 2], ['impaling', 1]], { 'andrew:tr_id': 'off' }));
  p.writes.length = 0;
  sc.tick = 200;
  deliver('playerHotbarSelectedSlotChange', { player: p, newSlotSelected: 4, previousSlotSelected: 0 });
  flushEvents();
  stop();
  assert.equal(list(p.slots[4]), 'unbreaking1');
  assert.equal(list(p.offhand), 'impaling1');
  assert.deepEqual(p.offhand.props, { 'andrew:tr_id': 'off' });
  assert.deepEqual(reports.map((r) => `${r.where}:${r.trigger}:${r.removed.join('+')}@${r.tick}`), ['4:hand:riptide2@200', 'offhand:hand:loyalty2@200']);
});

test('a refusing off hand, a missing player and a throwing slot are logged, never thrown', () => {
  const { reports, stop } = watchScrubs();
  const ivy = scrubPlayer('Ivy');
  ivy.getComponent('minecraft:equippable').setEquipment('Offhand', new Stack(TRIDENT, [['loyalty', 3]]));
  const refused = { ...ivy, getComponent: (t) => (t === 'minecraft:equippable' ? { ...ivy.getComponent(t), setEquipment: () => false } : ivy.getComponent(t)) };
  deliver('playerHotbarSelectedSlotChange', { player: refused, newSlotSelected: 0, previousSlotSelected: 1 });
  flushEvents();
  assert.ok(scrubLogs.some((l) => l.includes(`the off hand of Ivy refused ${TRIDENT} without loyalty3; it keeps them`)), scrubLogs.join('\n'));

  deliver('playerInventoryItemChange', { player: undefined, slot: 0, itemStack: new Stack(TRIDENT, [['loyalty', 3]]) });
  deliver('playerHotbarSelectedSlotChange', { player: undefined, newSlotSelected: 0 });
  flushEvents();

  const broken = { id: 'id-Bo', name: 'Bo', isValid: true, getComponent: () => ({ container: { size: 9, getItem: () => { throw new Error('invalid'); } } }) };
  deliver('playerInventoryItemChange', { player: broken, slot: 0, itemStack: new Stack(TRIDENT, [['riptide', 3]]) });
  flushEvents();
  assert.ok(scrubLogs.some((l) => l.includes('scrub on slot 0 for Bo threw Error: invalid')), scrubLogs.join('\n'));

  const gone = scrubPlayer('Gone');
  gone.isValid = false;
  arrive(gone, 0, new Stack(TRIDENT, [['loyalty', 3]]));
  assert.equal(list(gone.slots[0]), 'loyalty3', 'an invalid player is not touched');
  stop();
  assert.equal(reports.length, 0);
});

// ---------------------------------------------------------------- 2. the loss path, the departure watch, watch() and death

const lgndEngine = `
const mc = (globalThis.__mcLgnd = { worldProps: new Map(), handlers: {}, players: [], queue: [], intervals: new Map(), nextRun: 1, tick: 0 });
function props(map) {
  return {
    getDynamicProperty: (k) => map.get(k),
    setDynamicProperty(k, v) { if (v === undefined) map.delete(k); else map.set(k, v); },
  };
}
const signal = (name) => ({ subscribe(fn) { (mc.handlers[name] ??= []).push(fn); return fn; }, unsubscribe() {} });
export const world = {
  afterEvents: new Proxy({}, { get: (_, name) => signal(name) }),
  beforeEvents: new Proxy({}, { get: (_, name) => signal("before:" + name) }),
  ...props(mc.worldProps),
  getAllPlayers: () => mc.players,
  getAbsoluteTime: () => 1000,
};
export const system = {
  get currentTick() { return mc.tick; },
  run(fn) { mc.queue.push(fn); return mc.nextRun++; },
  runInterval(fn) { const id = mc.nextRun++; mc.intervals.set(id, fn); return id; },
  clearRun(id) { mc.intervals.delete(id); },
};
export class EnchantmentType { constructor(id) { this.id = id; } }
export class ItemStack {
  constructor(typeId, amount = 1) {
    this.typeId = typeId; this.amount = amount; this.props = new Map(); this.enchants = new Map(); this.nameTag = undefined; this.lore = [];
    Object.assign(this, props(this.props));
  }
  getComponent(id) {
    if (id !== 'minecraft:enchantable') return undefined;
    const enchants = this.enchants;
    return {
      getEnchantments: () => [...enchants].map(([type, level]) => ({ type: { id: type }, level })),
      addEnchantment({ type, level }) { enchants.set(type.id, level); },
    };
  }
  getLore() { return [...this.lore]; }
  setLore(lore) { this.lore = [...(lore ?? [])]; }
  clone() {
    const copy = new ItemStack(this.typeId, this.amount);
    for (const [k, v] of this.props) copy.props.set(k, v);
    copy.enchants = new Map(this.enchants); copy.nameTag = this.nameTag; copy.lore = [...this.lore];
    return copy;
  }
}
export class Player {}
mc.ItemStack = ItemStack;
mc.Player = Player;
export const EntityComponentTypes = { Equippable: 'minecraft:equippable' };
export const EquipmentSlot = { Mainhand: 'Mainhand', Offhand: 'Offhand' };
export const BlockTypes = { get: (id) => ({ id }) };
export const EntitySwingSource = { Attack: 'Attack', DropItem: 'DropItem' };
export class BlockVolume { constructor(from, to) { this.from = from; this.to = to; } }
`;
const lg = await load(
  await build({
    stdin: {
      contents: [
        "export * from './src/legendary/registry.ts';",
        "export * from './src/legendary/state.ts';",
        "export { registerRecovery, deliverToLastHolder } from './src/legendary/recovery.ts';",
        "export { registerRetention } from './src/legendary/retention.ts';",
      ].join('\n'),
      resolveDir: projectRoot,
      loader: 'ts',
    },
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    write: false,
    plugins: [stubPlugin('lgnd-stub', lgndEngine)],
  })
);
const mc = globalThis.__mcLgnd;
const lines = logs;
lg.registerRecovery();
lg.registerRetention();

const fire = (name, event) => {
  for (const handler of mc.handlers[name] ?? []) handler(event);
};
const flush = () => {
  while (mc.queue.length > 0) mc.queue.shift()();
};
/** One recovery check, `ticks` after the last. */
const checkAfter = (ticks) => {
  mc.tick += ticks;
  for (const fn of [...mc.intervals.values()]) fn();
  flush();
};

const dimension = { heightRange: { min: -64, max: 320 }, isChunkLoaded: () => true, getBlock: () => undefined, getBlocks: () => ({ getBlockLocationIterator: () => [][Symbol.iterator]() }), getEntities: () => [], spawnItem() {} };

function makeContainer(size = 36) {
  const slots = new Array(size).fill(undefined);
  return {
    size,
    slots,
    getItem: (i) => slots[i],
    getSlot: (i) => ({ setDynamicProperties(values) { for (const [k, v] of Object.entries(values)) slots[i].setDynamicProperty(k, v); } }),
    setItem(i, stack) { slots[i] = stack; },
    addItem(stack) {
      const free = slots.findIndex((s) => s === undefined);
      if (free < 0) return stack;
      slots[free] = stack;
      return undefined;
    },
  };
}

let playerCount = 0;
function makePlayer(name) {
  const player = Object.create(mc.Player.prototype);
  const store = new Map();
  Object.assign(player, {
    id: `-${++playerCount}`,
    name,
    typeId: 'minecraft:player',
    isValid: true,
    health: 20,
    location: { x: 0, y: 64, z: 0 },
    dimension,
    container: makeContainer(),
    selectedSlotIndex: 0,
    offhand: undefined,
    messages: [],
    getDynamicProperty: (k) => store.get(k),
    setDynamicProperty(k, v) { if (v === undefined) store.delete(k); else store.set(k, v); },
    sendMessage(message) { this.messages.push(message.translate); },
    getComponent(id) {
      if (id === 'minecraft:inventory') return { container: this.container };
      if (id === 'minecraft:health') return { currentValue: this.health };
      if (id === 'minecraft:equippable') {
        return {
          getEquipment: (slot) => (slot === 'Offhand' ? this.offhand : undefined),
          setEquipment: (slot, stack) => { if (slot !== 'Offhand') return false; this.offhand = stack; return true; },
        };
      }
      return undefined;
    },
  });
  return player;
}

const online = (...players) => void (mc.players = players);
const gensOf = (player, id) => player.container.slots.filter((s) => s !== undefined && lg.getMark(lg.TRIDENT, s)?.id === id).map((s) => lg.getMark(lg.TRIDENT, s).gen);
const owedOf = (player) => lg.readOwed(lg.TRIDENT)[player.id] ?? [];

/** A marked trident, dressed, held by `holder`. */
function trident(owner, holder = owner) {
  const stack = new mc.ItemStack(TRIDENT, 1);
  stack.enchants.set('unbreaking', 3);
  stack.enchants.set('impaling', 5);
  stack.nameTag = 'Undertow';
  const mark = { ...lg.makeMark('craft', owner), holder: holder.id, holderName: holder.name };
  return { stack: lg.markItem(lg.TRIDENT, stack, mark), mark: lg.withLook(mark, stack) };
}

test('T2: deliverToLastHolder hands an online, living last holder the trident at the next generation, with its look', () => {
  const crafter = makePlayer('tr-crafter');
  const holder = makePlayer('tr-holder');
  online(crafter, holder);
  const { mark } = trident(crafter, holder);
  lines.length = 0;
  lg.deliverToLastHolder(lg.TRIDENT, mark, 'custody fallback: entity removed');
  assert.deepEqual(gensOf(holder, mark.id), [1]);
  assert.deepEqual(gensOf(crafter, mark.id), [], 'never the crafter');
  const back = holder.container.slots.find((s) => s !== undefined);
  assert.equal(back.nameTag, 'Undertow');
  assert.deepEqual([...back.enchants].sort(), [['impaling', 5], ['unbreaking', 3]]);
  assert.equal(lg.ledgerGen(lg.TRIDENT, mark.id), 1);
  assert.deepEqual(holder.messages, ['andrew.legendary.recovered']);
  assert.ok(lines.includes(`[andrew] legendary recovery: ${TRIDENT} id ${mark.id} custody fallback: entity removed; now gen 1, returning to tr-holder`), lines.join('\n'));
});

test('T2: a stale record delivers nothing — a second fallback for one throw cannot mint a second copy', () => {
  const p = makePlayer('tr-twice');
  online(p);
  const { mark } = trident(p);
  lg.deliverToLastHolder(lg.TRIDENT, mark, 'first');
  lines.length = 0;
  lg.deliverToLastHolder(lg.TRIDENT, mark, 'second');
  assert.deepEqual(gensOf(p, mark.id), [1]);
  assert.deepEqual(owedOf(p), []);
  assert.ok(lines.some((l) => l.includes(`id ${mark.id} second, but it was already stale`)), lines.join('\n'));
});

test('T2: a dead holder is owed the trident and paid once on respawn; an offline one on join', () => {
  const dead = makePlayer('tr-dead');
  const away = makePlayer('tr-away');
  online(dead);
  dead.health = 0;
  const d = trident(dead);
  const a = trident(away);
  lg.deliverToLastHolder(lg.TRIDENT, d.mark, 'the thrower died mid-flight');
  lg.deliverToLastHolder(lg.TRIDENT, a.mark, 'the thrower left mid-flight');
  assert.deepEqual(gensOf(dead, d.mark.id), []);
  assert.deepEqual(owedOf(dead).map((e) => [e.mark.id, e.mark.gen, e.reason]), [[d.mark.id, 1, 'the thrower died mid-flight']]);
  assert.deepEqual(owedOf(away).map((e) => [e.mark.id, e.mark.gen, e.mark.look?.nameTag]), [[a.mark.id, 1, 'Undertow']]);

  dead.health = 20;
  fire('playerSpawn', { player: dead, initialSpawn: false });
  flush();
  assert.deepEqual(gensOf(dead, d.mark.id), [1]);
  assert.deepEqual(owedOf(dead), []);
  fire('playerSpawn', { player: dead, initialSpawn: false });
  flush();
  assert.deepEqual(gensOf(dead, d.mark.id), [1], 'a second spawn paid again');

  online(dead, away);
  fire('playerSpawn', { player: away, initialSpawn: true });
  flush();
  assert.deepEqual(gensOf(away, a.mark.id), [1]);
  assert.equal(away.container.slots.find((s) => s !== undefined).nameTag, 'Undertow');
  assert.deepEqual(owedOf(away), []);
});

test('T3: a slot the throw empties is a departure with no DropItem swing — never a loss; with the swing it is one', () => {
  const p = makePlayer('tr-thrower');
  online(p);
  const { stack, mark } = trident(p);
  p.container.setItem(0, stack);
  // The throw: the hand slot is cleared by a script, no swing.
  lines.length = 0;
  mc.tick = 1000;
  p.container.setItem(0, undefined);
  fire('playerInventoryItemChange', { player: p, slot: 0, beforeItemStack: stack, itemStack: undefined });
  checkAfter(11);
  checkAfter(40);
  assert.deepEqual(lines.filter((l) => l.includes(`id ${mark.id}`)), [], 'the departure watch said something about a throw');
  assert.equal(lg.ledgerGen(lg.TRIDENT, mark.id), 0);
  assert.deepEqual(gensOf(p, mark.id), []);

  // The control: the same departure inside a DropItem swing's window is resolved as a drop, and lost.
  p.container.setItem(0, stack);
  mc.tick = 2000;
  fire('playerSwingStart', { player: p, swingSource: 'DropItem' });
  p.container.setItem(0, undefined);
  fire('playerInventoryItemChange', { player: p, slot: 0, beforeItemStack: stack, itemStack: undefined });
  checkAfter(11);
  assert.ok(lines.some((l) => l.includes(`id ${mark.id} left an inventory and was nowhere to be found; now gen 1`)), lines.join('\n'));
  assert.deepEqual(gensOf(p, mark.id), [1]);
});

test('T5: watch() leaves an entity that is not minecraft:item alone, whatever it carries', () => {
  lines.length = 0;
  const intervals = mc.intervals.size;
  let read = 0;
  const custody = {
    id: 'c1',
    typeId: 'andrew:trident_in_flight',
    isValid: true,
    location: { x: 0, y: 64, z: 0 },
    dimension,
    getComponent() {
      read++;
      return undefined;
    },
    getDynamicProperty: () => 'throw-1',
  };
  fire('entitySpawn', { entity: custody });
  fire('entityLoad', { entity: custody });
  assert.equal(read, 0, 'watch() read a component off a custody entity');
  assert.deepEqual(lines, []);
  assert.equal(mc.intervals.size, intervals, 'a check interval started for a custody entity');
});

test('T4: a thrower who dies with the trident in flight has an empty slot — retention stashes nothing', () => {
  const p = makePlayer('tr-dies');
  online(p);
  const { mark } = trident(p);
  lines.length = 0;
  fire('entityDie', { deadEntity: p });
  flush();
  assert.deepEqual(lg.readPending(lg.TRIDENT, p), []);
  assert.ok(lines.some((l) => l.includes(`${p.name} had no marked ${TRIDENT} in inventory or off hand at entityDie`)), lines.join('\n'));
  assert.equal(lg.ledgerGen(lg.TRIDENT, mark.id), 0);
});

// ---------------------------------------------------------------- 3. the magnet (T6)

const magnet = await load(
  await build({
    stdin: { contents: "export * from './src/ufo/magnet-select.ts'; export { IRON_TAG } from './src/ufo/event.ts';", resolveDir: projectRoot, loader: 'ts' },
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    external: ['@minecraft/server'],
    write: false,
  })
);

const CENTRE = { x: 100, y: 64, z: -40 };
const E = (dx, dz, dy = 1) => ({ x: CENTRE.x + dx + 0.5, y: CENTRE.y + dy, z: CENTRE.z + dz + 0.5 });

class MStack {
  constructor(typeId, amount = 1) {
    this.typeId = typeId;
    this.amount = amount;
  }
}

/** Just enough dimension for one magnet-on pass: entities, one chest, and the tag commands with hasitem. */
function fakeDimension() {
  let seq = 0;
  const entities = [];
  const chest = { at: { x: CENTRE.x, y: CENTRE.y + 1, z: CENTRE.z - 10 }, slots: new Array(27).fill(undefined) };
  const container = {
    size: 27,
    getItem: (k) => chest.slots[k],
    setItem: (k, s) => void (chest.slots[k] = s),
  };
  const entity = (typeId, location, extra = {}) => {
    const tags = new Set();
    const e = {
      id: `e${++seq}`,
      typeId,
      location,
      isValid: true,
      hands: extra.hands ?? {},
      stack: extra.stack,
      componentReads: 0,
      getComponent(name) {
        this.componentReads++;
        return name === 'minecraft:item' && this.stack !== undefined ? { itemStack: this.stack } : undefined;
      },
      hasTag: (t) => tags.has(t),
      addTag: (t) => (tags.add(t), true),
      removeTag: (t) => tags.delete(t),
      remove() {
        this.isValid = false;
      },
    };
    entities.push(e);
    return e;
  };
  const dim = {
    heightRange: { min: -64, max: 320 },
    entities,
    entity,
    chest,
    getEntities(q = {}) {
      return entities.filter(
        (e) =>
          e.isValid &&
          (q.type === undefined || e.typeId === q.type) &&
          !(q.excludeTypes ?? []).includes(e.typeId) &&
          (q.location === undefined || Math.hypot(e.location.x - q.location.x, e.location.y - q.location.y, e.location.z - q.location.z) <= q.maxDistance)
      );
    },
    getBlocks(volume, options) {
      const hit = options.includeTypes.includes('minecraft:chest') ? [{ ...chest.at }] : [];
      return { getBlockLocationIterator: () => hit[Symbol.iterator]() };
    },
    getBlock(b) {
      const isChest = Math.floor(b.x) === chest.at.x && Math.floor(b.y) === chest.at.y && Math.floor(b.z) === chest.at.z;
      return {
        location: { x: Math.floor(b.x), y: Math.floor(b.y), z: Math.floor(b.z) },
        typeId: isChest ? 'minecraft:chest' : 'minecraft:air',
        permutation: { getState: () => undefined },
        getComponent: (n) => (isChest && n === 'minecraft:inventory' ? { container } : undefined),
      };
    },
    spawnItem(stack, location) {
      return entity('minecraft:item', location, { stack });
    },
    runCommand(text) {
      const m = text.match(/^tag @e\[(.*)\] (add|remove) (\S+)$/);
      if (m === null) throw new Error(`fake: unknown command ${text}`);
      const [, args, op, tag] = m;
      const has = args.match(/hasitem=\{item=([^,}]+)(?:,location=([^}]+))?\}/);
      const not = [...args.matchAll(/type=!([^,\]]+)/g)].map((x) => x[1]);
      const needTag = args.match(/(?:^|,)tag=([^,\]]+)/)?.[1];
      let n = 0;
      for (const e of entities) {
        if (!e.isValid || not.includes(e.typeId) || (needTag !== undefined && !e.hasTag(needTag))) continue;
        if (has !== null) {
          const where = has[2] === 'slot.weapon.mainhand' ? [e.hands.mainhand] : has[2] === 'slot.weapon.offhand' ? [e.hands.offhand] : [];
          if (!where.includes(has[1])) continue;
        }
        if (op === 'add') e.addTag(tag);
        else e.removeTag(tag);
        n++;
      }
      if (n === 0) throw new Error('No targets matched selector');
      return { successCount: n };
    },
  };
  return dim;
}

test('T6: the magnet takes def #7 on the ground, from a chest and from a hand, and never a custody entity', () => {
  const dim = fakeDimension();
  const ground = dim.entity('minecraft:item', E(1, 0), { stack: new MStack(TRIDENT) });
  const storm = dim.entity('minecraft:item', E(-1, 0), { stack: new MStack('andrew:storm_blade') });
  dim.chest.slots[0] = new MStack(TRIDENT);
  dim.chest.slots[2] = new MStack('minecraft:dirt', 3);
  const zombie = dim.entity('minecraft:zombie', E(-10, -4), { hands: { mainhand: TRIDENT } });
  const stand = dim.entity('minecraft:armor_stand', E(-8, 4), { hands: { offhand: TRIDENT } });
  const custody = ['andrew:trident_in_flight', 'minecraft:thrown_trident', 'minecraft:snowball'].map((id, i) => dim.entity(id, E(4 + 2 * i, 4, 4)));
  const reads = custody.map((e) => e.componentReads);

  const host = { itemStack: (typeId, amount) => new MStack(typeId, amount), volume: (from, to) => ({ from, to }), now: () => 0, log: () => {} };
  const sel = magnet.magnetOn(dim, CENTRE, 104, host);
  const by = (e) => sel.elements.find((x) => x.entity === e);
  assert.deepEqual(sel.failures, []);
  assert.equal(by(ground)?.cls, magnet.GROUND, 'the ground trident is not taken');
  assert.equal(by(storm)?.cls, magnet.GROUND, 'the Storm Blade beside it, the parity control, is not taken');
  const fromChest = sel.elements.filter((x) => x.cls === magnet.STACK);
  assert.deepEqual(fromChest.map((x) => x.from), [TRIDENT]);
  assert.equal(dim.chest.slots[0], undefined);
  assert.equal(dim.chest.slots[2].typeId, 'minecraft:dirt');
  assert.equal(by(zombie)?.cls, magnet.HOLDER);
  assert.equal(by(stand)?.cls, magnet.HOLDER);
  for (const [i, e] of custody.entries()) {
    assert.equal(by(e), undefined, `${e.typeId} was taken`);
    assert.ok(!e.hasTag(magnet.IRON_TAG), `${e.typeId} was tagged`);
    assert.equal(e.componentReads, reads[i], `${e.typeId} was read as an item`);
  }
  assert.ok(
    dim.entities.filter((e) => e.typeId === 'minecraft:item').every((e) => e.stack !== undefined),
    'the ground scan met an item entity with no stack'
  );
});

test('T1/T6: def #7 is on the registry list the magnet and recovery read; its token is not a weapon', () => {
  assert.ok(lg.LEGENDARIES.includes(lg.TRIDENT));
  assert.equal(lg.TRIDENT.itemId, TRIDENT);
  assert.ok(lg.isLegendaryWeaponStack(new mc.ItemStack(TRIDENT)));
  assert.ok(!lg.isLegendaryWeaponStack(new mc.ItemStack('andrew:above_water_trident_crafted')));
});
