// The Underwater Bow under the legendary rules, off the engine (spec v3 §1; L0-uwbw responsibility 3).
//
// Four bundles, each against its own in-memory @minecraft/server:
// - the engine-free rules: the bow has no forbidden enchantment, the table may offer every compatible bow
//   enchantment, and Infinity and Mending conflict as the engine measured;
// - src/legendary/enchant.ts: the scrub never touches a bow, and a trident beside it is still scrubbed;
// - recovery + retention + state under the ub keys: every marked copy comes back from a death, a Void loss goes to
//   the last holder and is paid on join, and a restart — a fresh module over the same world store — keeps the craft
//   flag, the ledger and the debt, and watches a reloaded bow again;
// - the UFO magnet's predicate: the bow is magnetic like every legendary (operator decision 2026-10-04), its craft
//   token is not.
// The GameTest twin is src/gametest/ubow-legendary.ts.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataUrl = (text) => 'data:text/javascript;base64,' + Buffer.from(text, 'utf-8').toString('base64');
const stubPlugin = (name, contents) => ({
  name,
  setup(b) {
    b.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: 'mc', namespace: name }));
    b.onLoad({ filter: /.*/, namespace: name }, () => ({ contents, loader: 'js' }));
  },
});
const noEngine = {
  name: 'no-engine',
  setup(b) {
    b.onResolve({ filter: /^@minecraft\// }, (args) => ({ errors: [{ text: `${args.importer} reaches ${args.path}` }] }));
  },
};

const BOW = 'andrew:underwater_bow';
const TOKEN = 'andrew:underwater_bow_crafted';
const TRIDENT = 'andrew:above_water_trident';
/** Every enchantment the engine accepts on the bow (ENGINE_ACCEPTS, ench_data_parity), curses aside. */
const BOW_ENCHANTMENTS = ['flame', 'infinity', 'mending', 'power', 'punch', 'unbreaking'];

console.warn = () => {};

// ---------------------------------------------------------------- 1. the rules: nothing forbidden, everything offered

const rules = await import(
  dataUrl(
    (
      await build({
        stdin: {
          contents: [
            "export { FORBIDDEN_ENCHANTMENTS, forbiddenFor } from './src/legendary/enchant-rules.ts';",
            "export { eligibleFor, conflicts, ELIGIBILITY } from './src/enchanting/roll-rules.ts';",
            "export { ENGINE_ACCEPTS, ENGINE_CONFLICTS } from './src/enchanting/eligibility.ts';",
            "export { isMagneticStack } from './src/ufo/iron.ts';",
            "export { isLegendaryWeaponStack, isLegendaryStack, UNDERWATER_BOW } from './src/legendary/registry.ts';",
          ].join('\n'),
          resolveDir: projectRoot,
          loader: 'ts',
        },
        bundle: true,
        format: 'esm',
        platform: 'neutral',
        write: false,
        plugins: [noEngine],
      })
    ).outputFiles[0].text
  )
);

test('FORBIDDEN_ENCHANTMENTS has no entry for the Underwater Bow', () => {
  assert.equal(rules.UNDERWATER_BOW.itemId, BOW);
  assert.equal(rules.FORBIDDEN_ENCHANTMENTS.has(BOW), false, `the bow is listed with [${rules.FORBIDDEN_ENCHANTMENTS.get(BOW)}]`);
  assert.equal(rules.FORBIDDEN_ENCHANTMENTS.has(TOKEN), false);
  assert.deepEqual([...rules.FORBIDDEN_ENCHANTMENTS.keys()], [TRIDENT], 'a weapon other than the trident gained a forbidden list');
  assert.deepEqual(rules.forbiddenFor(BOW), []);
  // The control: the same reads do see a forbidden list where one exists.
  assert.deepEqual(rules.forbiddenFor(TRIDENT), ['loyalty', 'riptide']);
});

test('the table may offer every compatible bow enchantment on the Underwater Bow, as on a vanilla bow', () => {
  const offered = [...rules.eligibleFor(BOW)].sort();
  assert.deepEqual(offered, BOW_ENCHANTMENTS);
  assert.deepEqual(offered, [...rules.eligibleFor('minecraft:bow')].sort());
  // The engine's own answer, measured on BDS: the bow accepts what a vanilla bow accepts, at the same maximum levels.
  assert.deepEqual(rules.ENGINE_ACCEPTS.get(BOW), rules.ENGINE_ACCEPTS.get('minecraft:bow'));
  assert.deepEqual(
    Object.keys(rules.ENGINE_ACCEPTS.get(BOW))
      .filter((id) => id !== 'vanishing')
      .sort(),
    BOW_ENCHANTMENTS
  );
});

test('Infinity and Mending conflict, by the engine and in the roller; nothing else among the bow enchantments does', () => {
  const pairs = rules.ENGINE_CONFLICTS.filter(([a, b]) => BOW_ENCHANTMENTS.includes(a) && BOW_ENCHANTMENTS.includes(b)).map((p) => [...p].sort().join('+'));
  assert.deepEqual(pairs, ['infinity+mending']);
  for (const a of BOW_ENCHANTMENTS) {
    for (const b of BOW_ENCHANTMENTS) {
      const expected = a !== b && [a, b].sort().join('+') === 'infinity+mending';
      assert.equal(rules.conflicts(a, b), expected, `conflicts(${a}, ${b})`);
    }
  }
});

test('the UFO magnet reads the bow as a legendary weapon, its craft token as nothing', () => {
  const isWeapon = rules.isLegendaryWeaponStack;
  assert.equal(rules.isMagneticStack({ typeId: BOW }, isWeapon), true);
  assert.equal(rules.isMagneticStack({ typeId: TOKEN }, isWeapon), false);
  assert.equal(rules.isLegendaryStack({ typeId: TOKEN }), true, 'the token is still a legendary stack for the other rules');
  assert.equal(rules.isMagneticStack({ typeId: 'minecraft:bow' }, isWeapon), false);
});

// ---------------------------------------------------------------- 2. the scrub never touches a bow

const scrubEngine = `
const mc = (globalThis.__mcUbScrub = { handlers: {}, tick: 0 });
const signal = (name) => ({
  subscribe(fn) { (mc.handlers[name] ??= []).push(fn); return fn; },
  unsubscribe(fn) { mc.handlers[name] = (mc.handlers[name] ?? []).filter((f) => f !== fn); },
});
export const world = { afterEvents: new Proxy({}, { get: (_, name) => signal(name) }) };
export const system = { get currentTick() { return mc.tick; } };
export const EntityComponentTypes = { Inventory: "minecraft:inventory", Equippable: "minecraft:equippable" };
export const EquipmentSlot = { Mainhand: "Mainhand", Offhand: "Offhand" };
`;
const enchant = await import(
  dataUrl(
    (
      await build({
        entryPoints: [join(projectRoot, 'src', 'legendary', 'enchant.ts')],
        bundle: true,
        format: 'esm',
        platform: 'neutral',
        write: false,
        plugins: [stubPlugin('ub-scrub-stub', scrubEngine)],
      })
    ).outputFiles[0].text
  )
);
const sc = globalThis.__mcUbScrub;
enchant.registerEnchantScrub();

class ScrubStack {
  constructor(typeId, enchants = []) {
    this.typeId = typeId;
    this.ench = new Map(enchants);
  }
  clone() {
    return new ScrubStack(this.typeId, [...this.ench]);
  }
  getComponent(name) {
    if (name !== 'minecraft:enchantable') return undefined;
    const ench = this.ench;
    return {
      getEnchantment: (id) => (ench.has(id) ? { type: { id }, level: ench.get(id) } : undefined),
      getEnchantments: () => [...ench].map(([id, level]) => ({ type: { id }, level })),
      removeEnchantment: (id) => void ench.delete(id),
    };
  }
}

function scrubPlayer(name) {
  const slots = new Array(36).fill(undefined);
  let offhand;
  const writes = [];
  const player = {
    id: `id-${name}`,
    name,
    isValid: true,
    slots,
    writes,
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
              slots[i] = stack?.clone();
              writes.push(`slot ${i}`);
            },
          },
        };
      }
      if (type === 'minecraft:equippable') {
        return {
          getEquipment: (slot) => (slot === 'Offhand' ? offhand?.clone() : undefined),
          setEquipment: (slot, stack) => {
            if (slot !== 'Offhand') return false;
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

const fireScrub = (name, event) => {
  for (const fn of sc.handlers[name] ?? []) fn(event);
};
const enchList = (stack) => [...stack.ench].map(([id, l]) => `${id}${l}`).sort();

test('the scrub leaves every bow enchantment on the bow, on every trigger, and still scrubs a trident', () => {
  const reports = [];
  const stop = enchant.observeScrubs((r) => reports.push(r));
  try {
    const player = scrubPlayer('ub-scrub');
    const withInfinity = [['power', 5], ['punch', 2], ['flame', 1], ['infinity', 1], ['unbreaking', 3]];
    const withMending = [['power', 5], ['punch', 2], ['flame', 1], ['mending', 1], ['unbreaking', 3]];
    player.slots[0] = new ScrubStack(BOW, withInfinity);
    player.slots[20] = new ScrubStack(BOW, withMending);
    fireScrub('playerInventoryItemChange', { player, slot: 0, itemStack: player.slots[0].clone() });
    fireScrub('playerInventoryItemChange', { player, slot: 20, itemStack: player.slots[20].clone() });
    player.getComponent('minecraft:equippable').setEquipment('Offhand', new ScrubStack(BOW, withInfinity));
    player.writes.length = 0;
    fireScrub('playerHotbarSelectedSlotChange', { player, newSlotSelected: 0 });
    assert.deepEqual(player.writes, [], 'the scrub wrote a bow back');
    assert.deepEqual(reports, []);
    assert.deepEqual(enchList(player.slots[0]), ['flame1', 'infinity1', 'power5', 'punch2', 'unbreaking3']);
    assert.deepEqual(enchList(player.slots[20]), ['flame1', 'mending1', 'power5', 'punch2', 'unbreaking3']);
    assert.deepEqual(enchList(player.offhand), ['flame1', 'infinity1', 'power5', 'punch2', 'unbreaking3']);
    assert.deepEqual(enchant.scrubStack(new ScrubStack(BOW, withMending)), []);

    // The control: a trident with Loyalty in the same harness is scrubbed, so the bow's silence is the rule's.
    player.slots[1] = new ScrubStack(TRIDENT, [['loyalty', 3], ['unbreaking', 3]]);
    fireScrub('playerInventoryItemChange', { player, slot: 1, itemStack: player.slots[1].clone() });
    assert.deepEqual(enchList(player.slots[1]), ['unbreaking3']);
    assert.deepEqual(reports.map((r) => [r.itemId, r.removed]), [[TRIDENT, ['loyalty3']]]);
  } finally {
    stop();
  }
});

// ---------------------------------------------------------------- 3. recovery and retention under the ub keys, and a restart

// The world store outlives a boot; handlers, intervals and queued runs do not. Each boot is a fresh module instance.
const engineStub = `
const persist = (globalThis.__ubPersist ??= { worldProps: new Map() });
const mc = (globalThis.__mcUb = { worldProps: persist.worldProps, handlers: {}, players: [], queue: [], intervals: new Map(), nextRun: 1 });
function props(map) {
  return {
    getDynamicProperty: (k) => map.get(k),
    setDynamicProperty(k, v) {
      if (v === undefined) map.delete(k);
      else map.set(k, v);
    },
  };
}
const signal = (name) => ({
  subscribe(fn) {
    (mc.handlers[name] ??= []).push(fn);
    return fn;
  },
  unsubscribe() {},
});
export const world = {
  afterEvents: new Proxy({}, { get: (_, name) => signal(name) }),
  beforeEvents: new Proxy({}, { get: (_, name) => signal("before:" + name) }),
  ...props(mc.worldProps),
  getAllPlayers: () => mc.players,
  getAbsoluteTime: () => 1000,
};
export const system = {
  run(fn) {
    mc.queue.push(fn);
    return mc.nextRun++;
  },
  runInterval(fn) {
    const id = mc.nextRun++;
    mc.intervals.set(id, fn);
    return id;
  },
  clearRun(id) {
    mc.intervals.delete(id);
  },
};
export class EnchantmentType {
  constructor(id) {
    this.id = id;
  }
}
export class ItemStack {
  constructor(typeId, amount = 1) {
    this.typeId = typeId;
    this.amount = amount;
    this.props = new Map();
    this.enchants = new Map();
    this.nameTag = undefined;
    this.lore = [];
    Object.assign(this, props(this.props));
  }
  getComponent(id) {
    if (id !== 'minecraft:enchantable') return undefined;
    const enchants = this.enchants;
    return {
      getEnchantments: () => [...enchants].map(([type, level]) => ({ type: { id: type }, level })),
      addEnchantment({ type, level }) {
        enchants.set(type.id, level);
      },
    };
  }
  getLore() {
    return [...this.lore];
  }
  setLore(lore) {
    this.lore = [...(lore ?? [])];
  }
  clone() {
    const copy = new ItemStack(this.typeId, this.amount);
    for (const [k, v] of this.props) copy.props.set(k, v);
    copy.enchants = new Map(this.enchants);
    copy.nameTag = this.nameTag;
    copy.lore = [...this.lore];
    return copy;
  }
}
export class Player {}
mc.ItemStack = ItemStack;
mc.Player = Player;
export const EntityComponentTypes = { Equippable: 'minecraft:equippable' };
export const EquipmentSlot = { Mainhand: 'Mainhand', Offhand: 'Offhand' };
export const BlockTypes = { get: (id) => (id.endsWith('_shelf') ? undefined : { id }) };
export const EntitySwingSource = { Attack: 'Attack', DropItem: 'DropItem' };
export class BlockVolume {
  constructor(from, to) {
    this.from = from;
    this.to = to;
  }
}
`;

const frameworkText = (
  await build({
    stdin: {
      contents: [
        "export * from './src/legendary/rules.ts';",
        "export * from './src/legendary/registry.ts';",
        "export * from './src/legendary/state.ts';",
        "export { registerRecovery } from './src/legendary/recovery.ts';",
        "export { registerRetention } from './src/legendary/retention.ts';",
      ].join('\n'),
      resolveDir: projectRoot,
      loader: 'ts',
    },
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    write: false,
    plugins: [stubPlugin('ub-framework-stub', engineStub)],
  })
).outputFiles[0].text;

let boots = 0;
/** A server start: a fresh module instance over the world store the previous one left. */
async function boot() {
  const lg = await import(dataUrl(`${frameworkText}\n// boot ${++boots}`));
  const mc = globalThis.__mcUb;
  lg.registerRecovery();
  lg.registerRetention();
  return { lg, mc };
}

let { lg, mc } = await boot();
const fire = (name, event) => {
  for (const handler of mc.handlers[name] ?? []) handler(event);
};
const flush = () => {
  while (mc.queue.length > 0) mc.queue.shift()();
};
const tick = () => {
  for (const fn of [...mc.intervals.values()]) fn();
  flush();
};

const dimension = {
  heightRange: { min: -64, max: 320 },
  ground: [],
  isChunkLoaded: () => true,
  getBlock: () => undefined,
  getEntities() {
    return this.ground.filter((e) => e.isValid);
  },
  spawnItem() {},
};

function makeContainer(size = 36) {
  const slots = new Array(size).fill(undefined);
  return {
    size,
    slots,
    getItem: (i) => slots[i],
    getSlot: (i) => ({
      setDynamicProperties(values) {
        for (const [k, v] of Object.entries(values)) slots[i].setDynamicProperty(k, v);
      },
    }),
    setItem(i, stack) {
      slots[i] = stack;
    },
    addItem(stack) {
      const free = slots.findIndex((s) => s === undefined);
      if (free < 0) return stack;
      slots[free] = stack;
      return undefined;
    },
  };
}

let playerCount = 0;
/** A player as one boot sees them; `same` rejoins a player of an earlier boot: same id, same stored properties. */
function makePlayer(name, same) {
  const player = Object.create(mc.Player.prototype);
  const store = same?.store ?? new Map();
  Object.assign(player, {
    id: same?.id ?? `-${++playerCount}`,
    name,
    store,
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
    setDynamicProperty(k, v) {
      if (v === undefined) store.delete(k);
      else store.set(k, v);
    },
    sendMessage(message) {
      this.messages.push(message.translate);
    },
    getComponent(id) {
      if (id === 'minecraft:inventory') return { container: this.container };
      if (id === 'minecraft:health') return { currentValue: this.health };
      if (id === 'minecraft:equippable') {
        return {
          getEquipment: (slot) => (slot === 'Mainhand' ? this.container.getItem(this.selectedSlotIndex) : slot === 'Offhand' ? this.offhand : undefined),
          setEquipment: (slot, stack) => {
            if (slot !== 'Offhand') return false;
            this.offhand = stack;
            return true;
          },
        };
      }
      return undefined;
    },
  });
  return player;
}

const online = (...players) => {
  mc.players = players;
};

let entityCount = 0;
function itemEntity(stack) {
  const entity = {
    id: `e${++entityCount}`,
    typeId: 'minecraft:item',
    isValid: true,
    location: { x: 3, y: 64, z: 3 },
    dimension,
    getComponent: (id) => (id === 'minecraft:item' ? { itemStack: stack } : undefined),
    remove() {
      this.isValid = false;
    },
  };
  dimension.ground.push(entity);
  return entity;
}

function dressedBow(owner, origin, enchants, nameTag, lore) {
  const stack = new mc.ItemStack(BOW, 1);
  for (const [id, level] of enchants) stack.enchants.set(id, level);
  stack.nameTag = nameTag;
  stack.lore = lore;
  return lg.markItem(lg.UNDERWATER_BOW, stack, lg.makeMark(origin, owner));
}

const markOf = (stack) => (stack?.typeId === BOW ? lg.getMark(lg.UNDERWATER_BOW, stack) : undefined);
const lookOf = (stack) => ({ enchants: [...stack.enchants].sort(), nameTag: stack.nameTag, lore: stack.lore });
/** Every copy of instance `id` a player carries, inventory and off hand, as [gen, look]. */
const copiesOf = (player, id) =>
  [...player.container.slots, player.offhand].filter((s) => markOf(s)?.id === id).map((s) => [markOf(s).gen, lookOf(s)]);
const owedTo = (player) => (lg.readOwed(lg.UNDERWATER_BOW)[player.id] ?? []).map((e) => [e.mark.id, e.mark.gen]);

const INFINITY_LOOK = [['flame', 1], ['infinity', 1], ['power', 5], ['punch', 2], ['unbreaking', 3]];
const MENDING_LOOK = [['flame', 1], ['mending', 1], ['power', 5], ['punch', 2], ['unbreaking', 3]];

test('death: every marked bow comes back with its look, under the ub keys; a plain copy is left to the engine', () => {
  const p = makePlayer('ub-every-copy');
  online(p);
  const crafted = dressedBow(p, 'craft', INFINITY_LOOK, 'Deep Draw', ['ub retention']);
  const admin = dressedBow(p, 'admin', MENDING_LOOK, 'Undertow Bow', ['ub mending']);
  const plain = new mc.ItemStack(BOW, 1);
  p.container.setItem(2, crafted);
  p.container.setItem(7, plain);
  p.offhand = admin;

  fire('entityDie', { deadEntity: p });
  p.health = 0;
  flush();
  const pending = JSON.parse(p.getDynamicProperty('andrew:ub_pending'));
  assert.deepEqual(pending.map((m) => m.id).sort(), [markOf(crafted).id, markOf(admin).id].sort(), 'not both marked bows are retained');
  assert.equal(p.container.getItem(2), undefined);
  assert.equal(p.offhand, undefined);
  assert.equal(p.container.getItem(7), plain, 'retention took the plain copy');
  assert.equal(p.getDynamicProperty('andrew:ws_pending'), undefined, 'the bow was retained under another def\'s keys');

  p.container.setItem(7, undefined);
  p.health = 20;
  fire('playerSpawn', { player: p, initialSpawn: false });
  flush();
  assert.deepEqual(copiesOf(p, markOf(crafted).id), [[0, lookOf(crafted)]]);
  assert.deepEqual(copiesOf(p, markOf(admin).id), [[0, lookOf(admin)]]);
  assert.equal(p.getDynamicProperty('andrew:ub_pending'), undefined);
});

test('the Void after a hand-over: owed to the last holder under the ub keys and paid on join, the crafter gets nothing', () => {
  const a = makePlayer('ub-crafter');
  const b = makePlayer('ub-holder');
  online(a, b);
  const bow = dressedBow(a, 'craft', INFINITY_LOOK, 'Deep Draw', []);
  const { id } = markOf(bow);
  b.container.setItem(0, bow);
  fire('playerInventoryItemChange', { player: b, slot: 0, itemStack: bow, inventoryType: 'Inventory' });
  assert.equal(markOf(b.container.getItem(0)).holder, b.id);
  const held = b.container.getItem(0);
  b.container.setItem(0, undefined);
  online(a);
  const entity = itemEntity(held.clone());
  fire('entitySpawn', { entity });
  entity.isValid = false;
  tick();
  assert.deepEqual(Object.keys(lg.readOwed(lg.UNDERWATER_BOW)), [b.id]);
  assert.deepEqual(owedTo(b), [[id, 1]]);
  assert.ok(typeof mc.worldProps.get('andrew:ub_owed') === 'string', 'the debt is not stored under the bow\'s own key');
  fire('playerSpawn', { player: a, initialSpawn: false });
  flush();
  assert.deepEqual(copiesOf(a, id), []);
  online(a, b);
  fire('playerSpawn', { player: b, initialSpawn: true });
  flush();
  assert.deepEqual(copiesOf(b, id), [[1, lookOf(held)]]);
  assert.deepEqual(lg.readOwed(lg.UNDERWATER_BOW), {});
});

test('a restart: the craft flag, the ledger and a debt survive in the world store, and a reloaded bow is watched again', async () => {
  const a = makePlayer('ub-restart-crafter');
  const b = makePlayer('ub-restart-holder');
  online(a, b);
  lg.setCrafted(lg.UNDERWATER_BOW, a.name);
  // B holds a bow and loses it while offline: owed at gen 1. A bow lies on the ground, watched, at gen 0.
  const lost = dressedBow(b, 'admin', MENDING_LOOK, 'Undertow Bow', ['ub mending']);
  const lying = dressedBow(a, 'craft', INFINITY_LOOK, 'Deep Draw', ['ub retention']);
  online(a);
  const gone = itemEntity(lost.clone());
  fire('entitySpawn', { entity: gone });
  gone.isValid = false;
  const ground = itemEntity(lying.clone());
  fire('entitySpawn', { entity: ground });
  tick();
  assert.deepEqual(owedTo(b), [[markOf(lost).id, 1]]);
  assert.equal(lg.ledgerGen(lg.UNDERWATER_BOW, markOf(lying).id), 0);

  // The stop: script memory goes, the world store stays. The ground bow comes back with its chunk.
  ({ lg, mc } = await boot());
  dimension.ground = [];
  assert.equal(lg.isCrafted(lg.UNDERWATER_BOW), true, 'the craft flag did not survive the restart');
  assert.deepEqual(owedTo(b), [[markOf(lost).id, 1]], 'the debt did not survive the restart');
  assert.deepEqual(lg.readOwed(lg.UNDERWATER_BOW)[b.id][0].mark.look, { enchantments: MENDING_LOOK, nameTag: 'Undertow Bow', lore: ['ub mending'] });

  const a2 = makePlayer('ub-restart-crafter', a);
  online(a2);
  const reloaded = itemEntity(lying.clone());
  fire('entityLoad', { entity: reloaded });
  tick();
  assert.deepEqual(lg.readOwed(lg.UNDERWATER_BOW)[a2.id], undefined, 'loading the ground bow was read as a loss');
  reloaded.isValid = false;
  tick();
  assert.deepEqual(copiesOf(a2, markOf(lying).id), [[1, lookOf(lying)]], 'the reloaded bow was not watched: its despawn returned nothing');
  assert.equal(lg.ledgerGen(lg.UNDERWATER_BOW, markOf(lying).id), 1);

  // B rejoins after the restart and is paid once; the copy that went to the Void before the stop stays stale.
  const b2 = makePlayer('ub-restart-holder', b);
  online(a2, b2);
  fire('playerSpawn', { player: b2, initialSpawn: true });
  flush();
  assert.deepEqual(copiesOf(b2, markOf(lost).id), [[1, lookOf(lost)]]);
  assert.deepEqual(owedTo(b2), []);
  fire('playerSpawn', { player: b2, initialSpawn: false });
  flush();
  assert.deepEqual(copiesOf(b2, markOf(lost).id).length, 1, 'a second spawn paid the debt again');
  assert.equal(lg.isLive(lg.UNDERWATER_BOW, markOf(lost)), false, 'the gen-0 copy is live again after the restart');
});
