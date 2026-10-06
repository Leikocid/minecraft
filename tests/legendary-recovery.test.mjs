// Loss return with generations and an owed list, off the engine
// (L0-lgnd-ad02, r005, ent2, ent4, p003).
//
// The production modules — recovery, retention, state, hands — are bundled
// against an in-memory @minecraft/server: dynamic-property stores, a container,
// an event bus the test fires by hand, and a system.run queue the test flushes.
// The GameTest twin in src/gametest/legendary-recovery.ts drives the same
// paths on BDS with real hoppers.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const engineStub = `
const mc = (globalThis.__mc = {
  worldProps: new Map(),
  handlers: {},
  players: [],
  queue: [],
  intervals: new Map(),
  nextRun: 1,
});
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
// Enchantments, the anvil name and the lore: what a returned copy must carry again.
// An enchantment named 'refused' stands for one the item no longer admits.
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
        if (type.id === 'refused') throw new Error('EnchantmentTypeUnknownIdError');
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
// This engine has no shelves: an id it does not know must never reach a query.
export const BlockTypes = { get: (id) => (id.endsWith('_shelf') ? undefined : { id }) };
export const EntitySwingSource = { Attack: 'Attack', DropItem: 'DropItem' };
export class BlockVolume {
  constructor(from, to) {
    this.from = from;
    this.to = to;
  }
}
`;

const minecraftServerStub = {
  name: 'minecraft-server-stub',
  setup(pluginBuild) {
    pluginBuild.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: '@minecraft/server', namespace: 'mc-stub' }));
    pluginBuild.onLoad({ filter: /.*/, namespace: 'mc-stub' }, () => ({ contents: engineStub, loader: 'js' }));
  },
};

const bundle = await build({
  stdin: {
    contents: [
      "export * from './src/legendary/rules.ts';",
      "export * from './src/legendary/registry.ts';",
      "export * from './src/legendary/state.ts';",
      "export * from './src/legendary/hands.ts';",
      "export { registerRecovery, protectLegendariesIn, HOLDER_TYPES, isLegendaryItemEntity, spotSearchLimit, standWatchState } from './src/legendary/recovery.ts';",
      "export { registerRetention } from './src/legendary/retention.ts';",
    ].join('\n'),
    resolveDir: projectRoot,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  plugins: [minecraftServerStub],
});

const lg = await import(
  'data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64')
);
const { WEB_SWORD } = lg;
const mc = globalThis.__mc;

console.warn = () => {};
lg.registerRecovery();
lg.registerRetention();

const OWED_KEY = 'andrew:ws_owed';
const RECOVERED = 'andrew.legendary.recovered';
const VOIDED = 'andrew.legendary.voided';

function fire(name, event) {
  for (const handler of mc.handlers[name] ?? []) handler(event);
}

/** Runs everything system.run queued, including what those callbacks queue. */
function flush() {
  while (mc.queue.length > 0) mc.queue.shift()();
}

/** One recovery watcher tick. */
function tick() {
  for (const fn of [...mc.intervals.values()]) fn();
  flush();
}

const dimension = {
  heightRange: { min: -64, max: 320 },
  isChunkLoaded: () => true,
  getBlock: () => undefined,
  getEntities: () => [],
  spawnItem(stack) {
    this.spawned.push(stack);
  },
  spawned: [],
};

function makeContainer(size = 36) {
  const slots = new Array(size).fill(undefined);
  const slotWrites = [];
  return {
    size,
    slots,
    slotWrites,
    getItem: (i) => slots[i],
    // ContainerSlot writes the stack in place, as the engine does.
    getSlot: (i) => ({
      setDynamicProperties(values) {
        if (slots[i] === undefined) throw new Error(`slot ${i} is empty`);
        for (const [k, v] of Object.entries(values)) slots[i].setDynamicProperty(k, v);
        slotWrites.push(i);
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
          getEquipment: (slot) =>
            slot === 'Mainhand' ? this.container.getItem(this.selectedSlotIndex) : slot === 'Offhand' ? this.offhand : undefined,
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

function online(...players) {
  mc.players = players;
}

let entityCount = 0;
function itemEntity(stack) {
  return {
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
}

function markedSword(owner, gen) {
  const mark = lg.makeMark('admin', owner);
  return lg.markItem(WEB_SWORD, new mc.ItemStack(WEB_SWORD.itemId, 1), gen === undefined ? mark : { ...mark, gen });
}

/** Drops `stack` on the ground, lets the watcher see it, then lets it vanish unseen. */
function loseUnseen(stack) {
  const entity = itemEntity(stack);
  fire('entitySpawn', { entity });
  entity.isValid = false;
  tick();
  return entity;
}

/** Instance `id` in `player`'s container, as the generations of its copies. */
function gensOf(player, id) {
  return player.container.slots
    .filter((s) => s !== undefined && lg.getMark(WEB_SWORD, s)?.id === id)
    .map((s) => lg.getMark(WEB_SWORD, s).gen);
}

function owedOf(player) {
  return lg.readOwed(WEB_SWORD)[player.id] ?? [];
}

test('AC1: a mark carries a generation; a return bumps it and the survivor goes stale', async (t) => {
  await t.test('parseMark: absent gen reads 0, a malformed gen makes the mark malformed', () => {
    const base = { origin: 'craft', owner: '-1', id: 'x' };
    assert.strictEqual(lg.parseMark(JSON.stringify(base)).gen, 0);
    assert.strictEqual(lg.parseMark(JSON.stringify({ ...base, gen: 3 })).gen, 3);
    for (const gen of [-1, 1.5, '2', null, true]) {
      assert.strictEqual(lg.parseMark(JSON.stringify({ ...base, gen })), undefined, `gen ${JSON.stringify(gen)}`);
    }
    const mark = { ...base, gen: 4, ownerName: 'Steve' };
    assert.deepStrictEqual(lg.parseMark(lg.serializeMark(mark)), mark);
  });

  await t.test('a fresh mark is gen 0, stamped on the stack and read back; an unstamped stack reads 0', () => {
    const owner = makePlayer('stamp');
    const mark = lg.makeMark('craft', owner);
    assert.strictEqual(mark.gen, 0);
    const stack = lg.markItem(WEB_SWORD, new mc.ItemStack(WEB_SWORD.itemId, 1), { ...mark, gen: 2 });
    assert.strictEqual(stack.getDynamicProperty('andrew:ws_gen'), 2);
    assert.strictEqual(lg.getMark(WEB_SWORD, stack).gen, 2);
    stack.setDynamicProperty('andrew:ws_gen', undefined);
    assert.strictEqual(lg.getMark(WEB_SWORD, stack).gen, 0);
    stack.setDynamicProperty('andrew:ws_gen', 'one');
    assert.strictEqual(lg.getMark(WEB_SWORD, stack), undefined);
  });

  const owner = makePlayer('owner');
  const finder = makePlayer('finder');
  online(owner, finder);
  const survivor = markedSword(owner);
  const { id } = lg.getMark(WEB_SWORD, survivor);

  await t.test('an unseen pickup is read as a loss: the owner gets the next generation, the ledger moves', () => {
    loseUnseen(survivor);
    assert.deepStrictEqual(gensOf(owner, id), [1]);
    assert.strictEqual(lg.ledgerGen(WEB_SWORD, id), 1);
    assert.deepStrictEqual(owner.messages, [RECOVERED]);
    assert.strictEqual(owner.getDynamicProperty('andrew:ws_pending'), undefined, 'a loss return does not go through the death token');
  });

  await t.test('the survivor the hopper kept is stale, the returned copy is live', () => {
    assert.strictEqual(lg.isStale(WEB_SWORD, survivor), true);
    assert.strictEqual(lg.isStale(WEB_SWORD, owner.container.getItem(0)), false);
  });

  await t.test('the stale survivor cannot cast; the live copy can', () => {
    finder.container.setItem(0, survivor);
    assert.strictEqual(lg.resolveActivation(finder), undefined);
    assert.deepStrictEqual(lg.heldLegendaries(finder), []);
    assert.strictEqual(lg.resolveActivation(owner)?.def, WEB_SWORD);
    finder.container.setItem(0, undefined);
  });

  await t.test('the stale survivor is deleted when it enters a player inventory, with a private message', () => {
    finder.container.setItem(4, survivor);
    fire('playerInventoryItemChange', { player: finder, slot: 4, itemStack: survivor, inventoryType: 'Hotbar' });
    assert.strictEqual(finder.container.getItem(4), undefined);
    assert.deepStrictEqual(finder.messages, [VOIDED]);
    assert.deepStrictEqual(gensOf(owner, id), [1], 'the live copy is untouched');
  });

  await t.test('the stale survivor is not retained on death', () => {
    finder.container.setItem(2, survivor);
    fire('entityDie', { deadEntity: finder });
    flush();
    assert.strictEqual(finder.container.getItem(2), undefined);
    assert.strictEqual(finder.getDynamicProperty('andrew:ws_pending'), undefined);
  });

  await t.test('a stale item entity is removed on sight and never watched', () => {
    const entity = itemEntity(survivor);
    fire('entitySpawn', { entity });
    assert.strictEqual(entity.isValid, false);
    tick();
    assert.strictEqual(lg.ledgerGen(WEB_SWORD, id), 1, 'removing a stale copy is not a loss');
  });

  await t.test('the returned copy lost again moves on to gen 2; nothing lowers it', () => {
    const live = owner.container.getItem(0);
    owner.container.setItem(0, undefined);
    loseUnseen(live);
    assert.deepStrictEqual(gensOf(owner, id), [2]);
    assert.strictEqual(lg.ledgerGen(WEB_SWORD, id), 2);
  });
});

test('AC2: debts are a list — two losses of one offline owner both survive and both come back', async (t) => {
  const owner = makePlayer('offline');
  online();
  const a = markedSword(owner);
  const b = markedSword(owner);
  const ids = [a, b].map((s) => lg.getMark(WEB_SWORD, s).id);

  await t.test('two losses while offline leave two entries, each at the next generation', () => {
    loseUnseen(a);
    loseUnseen(b);
    const owed = owedOf(owner);
    assert.deepStrictEqual(
      owed.map((e) => [e.mark.id, e.mark.gen]),
      ids.map((id) => [id, 1])
    );
    assert.ok(owed.every((e) => typeof e.reason === 'string' && e.reason.length > 0));
  });

  await t.test('on join both are handed over and the list empties', () => {
    online(owner);
    fire('playerSpawn', { player: owner, initialSpawn: true });
    flush();
    for (const id of ids) assert.deepStrictEqual(gensOf(owner, id), [1], id);
    assert.deepStrictEqual(owner.messages, [RECOVERED, RECOVERED]);
    assert.deepStrictEqual(owedOf(owner), []);
    assert.strictEqual(mc.worldProps.get(OWED_KEY), undefined, 'an empty ledger is cleared, not left as {}');
  });

  await t.test('a second spawn hands nothing more — each debt is paid exactly once', () => {
    fire('playerSpawn', { player: owner, initialSpawn: false });
    flush();
    for (const id of ids) assert.deepStrictEqual(gensOf(owner, id), [1], id);
    assert.strictEqual(owner.messages.length, 2);
  });

  await t.test('a death token for copy A and a debt for copy B are both paid on respawn', () => {
    const victim = makePlayer('victim');
    online(victim);
    const copyA = markedSword(victim);
    const copyB = markedSword(victim);
    victim.container.setItem(0, copyA);
    fire('entityDie', { deadEntity: victim });
    flush();
    victim.health = 0;
    loseUnseen(copyB);
    assert.strictEqual(owedOf(victim).length, 1, 'a dead owner cannot take the return now, so it is owed');
    assert.ok(victim.getDynamicProperty('andrew:ws_pending').includes(lg.getMark(WEB_SWORD, copyA).id), 'the death token survives the loss');

    victim.health = 20;
    fire('playerSpawn', { player: victim, initialSpawn: false });
    flush();
    assert.deepStrictEqual(gensOf(victim, lg.getMark(WEB_SWORD, copyA).id), [0]);
    assert.deepStrictEqual(gensOf(victim, lg.getMark(WEB_SWORD, copyB).id), [1]);
    assert.deepStrictEqual(owedOf(victim), []);
  });

  await t.test('a debt for an instance the player already carries is dropped without a copy', () => {
    const carrier = makePlayer('carrier');
    online();
    const lostCopy = markedSword(carrier);
    loseUnseen(lostCopy);
    const [entry] = owedOf(carrier);
    carrier.container.setItem(0, lg.markItem(WEB_SWORD, new mc.ItemStack(WEB_SWORD.itemId, 1), entry.mark));
    online(carrier);
    fire('playerSpawn', { player: carrier, initialSpawn: true });
    flush();
    assert.deepStrictEqual(gensOf(carrier, entry.mark.id), [1]);
    assert.deepStrictEqual(owedOf(carrier), []);
    assert.deepStrictEqual(carrier.messages, []);
  });

  await t.test('withOwed keeps one entry per instance: a newer generation replaces an older one', () => {
    const mark = { origin: 'admin', owner: '-9', id: 'i', gen: 1 };
    let owed = lg.withOwed({}, '-9', { mark, reason: 'lost' });
    owed = lg.withOwed(owed, '-9', { mark: { ...mark, id: 'j' }, reason: 'lost' });
    owed = lg.withOwed(owed, '-9', { mark: { ...mark, gen: 2 }, reason: 'lost' });
    assert.deepStrictEqual(
      owed['-9'].map((e) => `${e.mark.id}@${e.mark.gen}`),
      ['j@1', 'i@2']
    );
    assert.deepStrictEqual(lg.withoutOwed(owed, '-9', { ...mark, gen: 2 })['-9'].map((e) => e.mark.id), ['j']);
    assert.deepStrictEqual(lg.withoutOwed(lg.withoutOwed(owed, '-9', { ...mark, gen: 2 }), '-9', { ...mark, id: 'j' }), {});
  });
});

test('AC3: an owed value from before lists reads as a list of one', async (t) => {
  const legacyMark = { origin: 'craft', owner: '-77', id: 'legacy-1', ownerName: 'Alex' };
  const legacy = JSON.stringify({ '-77': JSON.stringify(legacyMark) });

  await t.test('parseOwed: one serialized mark per owner -> a one-element list at gen 0', () => {
    assert.deepStrictEqual(lg.parseOwed(legacy), {
      '-77': [{ mark: { ...legacyMark, gen: 0 }, reason: 'lost' }],
    });
  });

  await t.test('parseOwed drops what it cannot read and keeps the rest', () => {
    const mixed = JSON.stringify({
      '-1': 'not a mark',
      '-2': [{ mark: { origin: 'admin', owner: '-2', id: 'ok', gen: 1 }, reason: 'fell into the Void' }, { mark: 5 }],
      '-3': 42,
    });
    assert.deepStrictEqual(lg.parseOwed(mixed), {
      '-2': [{ mark: { origin: 'admin', owner: '-2', id: 'ok', gen: 1 }, reason: 'fell into the Void' }],
    });
    for (const raw of [undefined, 7, '', 'not json', '[1,2]', 'null']) {
      assert.deepStrictEqual(lg.parseOwed(raw), {}, String(raw));
    }
  });

  await t.test('a new loss appended to a legacy value keeps the legacy debt', () => {
    mc.worldProps.set(OWED_KEY, legacy);
    const owner = makePlayer('legacy-owner');
    owner.id = '-77';
    online();
    const extra = markedSword(owner);
    loseUnseen(extra);
    assert.deepStrictEqual(
      owedOf(owner).map((e) => [e.mark.id, e.mark.gen]),
      [
        ['legacy-1', 0],
        [lg.getMark(WEB_SWORD, extra).id, 1],
      ]
    );

    online(owner);
    fire('playerSpawn', { player: owner, initialSpawn: true });
    flush();
    assert.deepStrictEqual(gensOf(owner, 'legacy-1'), [0], 'the legacy debt is paid at gen 0, which is live');
    assert.deepStrictEqual(gensOf(owner, lg.getMark(WEB_SWORD, extra).id), [1]);
    assert.deepStrictEqual(owedOf(owner), []);
  });
});

test('off hand: death retention reads it, and the already-carried checks see it', async (t) => {
  await t.test('a marked sword in the off hand at death goes to pending and the slot is emptied', () => {
    const player = makePlayer('lefty');
    online(player);
    const sword = markedSword(player);
    player.offhand = sword;
    fire('entityDie', { deadEntity: player });
    flush();
    assert.strictEqual(player.offhand, undefined, 'the off hand still holds the sword, so the engine drops it');
    assert.deepStrictEqual(lg.readPending(WEB_SWORD, player).map((m) => m.id), [lg.getMark(WEB_SWORD, sword).id]);

    fire('playerSpawn', { player, initialSpawn: false });
    flush();
    assert.deepStrictEqual(gensOf(player, lg.getMark(WEB_SWORD, sword).id), [0], 'returned exactly once on respawn');
    assert.deepStrictEqual(lg.readPending(WEB_SWORD, player), []);
  });

  await t.test('an inventory copy and an off-hand copy of one weapon both go to pending, both slots emptied', () => {
    const player = makePlayer('both-places');
    online(player);
    const bag = markedSword(player);
    const held = markedSword(player);
    player.container.setItem(5, bag);
    player.offhand = held;
    fire('entityDie', { deadEntity: player });
    flush();
    assert.deepStrictEqual(
      lg.readPending(WEB_SWORD, player).map((m) => m.id),
      [bag, held].map((s) => lg.getMark(WEB_SWORD, s).id)
    );
    assert.strictEqual(player.container.getItem(5), undefined);
    assert.strictEqual(player.offhand, undefined, 'the off-hand copy is left for the engine to drop');
  });

  await t.test('a stale sword in the off hand at death is voided, not retained', () => {
    const player = makePlayer('stale-lefty');
    online(player);
    const sword = markedSword(player);
    lg.bumpGen(WEB_SWORD, lg.getMark(WEB_SWORD, sword).id);
    player.offhand = sword;
    fire('entityDie', { deadEntity: player });
    flush();
    assert.strictEqual(player.offhand, undefined);
    assert.deepStrictEqual(lg.readPending(WEB_SWORD, player), []);
  });

  await t.test('an unmarked sword in the off hand keeps vanilla death behaviour', () => {
    const player = makePlayer('plain-lefty');
    online(player);
    const plain = new mc.ItemStack(WEB_SWORD.itemId, 1);
    player.offhand = plain;
    fire('entityDie', { deadEntity: player });
    flush();
    assert.strictEqual(player.offhand, plain);
    assert.deepStrictEqual(lg.readPending(WEB_SWORD, player), []);
  });

  await t.test('a pending instance already held in the off hand is not issued a second time', () => {
    const player = makePlayer('holder');
    online(player);
    const sword = markedSword(player);
    lg.writePending(WEB_SWORD, player, [lg.getMark(WEB_SWORD, sword)]);
    player.offhand = sword;
    fire('playerSpawn', { player, initialSpawn: true });
    flush();
    assert.deepStrictEqual(gensOf(player, lg.getMark(WEB_SWORD, sword).id), [], 'a second copy entered the inventory');
    assert.deepStrictEqual(lg.readPending(WEB_SWORD, player), []);
  });

  await t.test('a debt for an instance held in the off hand is dropped without a copy', () => {
    const carrier = makePlayer('off-carrier');
    online();
    loseUnseen(markedSword(carrier));
    const [entry] = owedOf(carrier);
    carrier.offhand = lg.markItem(WEB_SWORD, new mc.ItemStack(WEB_SWORD.itemId, 1), entry.mark);
    online(carrier);
    fire('playerSpawn', { player: carrier, initialSpawn: true });
    flush();
    assert.deepStrictEqual(gensOf(carrier, entry.mark.id), [], 'a second copy entered the inventory');
    assert.deepStrictEqual(owedOf(carrier), []);
    assert.deepStrictEqual(carrier.messages, []);
  });
});

// ------------------------------------------------ protectLegendariesIn (L0-lgnd-p008)

function groundItem(stack, location) {
  return Object.assign(itemEntity(stack), { location });
}

/**
 * A dimension with stone up to y=63 and air above, plus the blocks `put` sets.
 * getBlocks answers from those blocks only, as the engine's filtered query does.
 * `setblock … air destroy` on a frame spills the frame and what `put` framed
 * as item entities in the same call, as BDS does (probe L0-xasm11 P1).
 */
function protectWorld() {
  const blocks = new Map();
  const key = (p) => `${p.x},${p.y},${p.z}`;
  const w = {
    queries: [],
    drops: [],
    entities: [],
    commands: [],
    put(at, typeId, container, framed) {
      blocks.set(key(at), { typeId, container, framed });
    },
    heightRange: { min: -64, max: 320 },
    getBlocks(vol, filter, allowUnloaded) {
      assert.strictEqual(allowUnloaded, false, 'an unloaded part must throw, not be skipped');
      w.queries.push({ vol, types: filter.includeTypes });
      const hits = [];
      for (const [k, b] of blocks) {
        const [x, y, z] = k.split(',').map(Number);
        const inside = x >= vol.from.x && x <= vol.to.x && y >= vol.from.y && y <= vol.to.y && z >= vol.from.z && z <= vol.to.z;
        if (inside && filter.includeTypes.includes(b.typeId)) hits.push({ x, y, z });
      }
      return { getBlockLocationIterator: () => hits[Symbol.iterator]() };
    },
    getBlock(at) {
      const b = blocks.get(key(at));
      const typeId = b?.typeId ?? (at.y <= 63 ? 'minecraft:stone' : 'minecraft:air');
      return {
        typeId,
        location: at,
        isAir: typeId === 'minecraft:air',
        isLiquid: typeId === 'minecraft:water',
        getComponent: (id) => (id === 'minecraft:inventory' && b?.container !== undefined ? { container: b.container } : undefined),
      };
    },
    // Block-inclusive: `volume` = max − min covers the max cell (probe L0-xasm11 P1).
    getEntities(q) {
      assert.strictEqual(q.type, 'minecraft:item');
      const inside = (p) => ['x', 'y', 'z'].every((a) => p[a] >= q.location[a] && p[a] < q.location[a] + q.volume[a] + 1);
      return w.entities.filter((e) => e.isValid && inside(e.location));
    },
    runCommand(command) {
      w.commands.push(command);
      const m = command.match(/^setblock (-?\d+) (-?\d+) (-?\d+) air destroy$/);
      const b = m && blocks.get(`${m[1]},${m[2]},${m[3]}`);
      if (!b) return { successCount: 0 };
      blocks.delete(`${m[1]},${m[2]},${m[3]}`);
      const at = { x: Number(m[1]) + 0.5, y: Number(m[2]) + 0.25, z: Number(m[3]) + 0.5 };
      w.entities.push(groundItem(new mc.ItemStack(b.typeId, 1), at));
      if (b.framed !== undefined) w.entities.push(groundItem(b.framed, at));
      return { successCount: 1 };
    },
    spawnItem(stack, at) {
      const entity = Object.assign(groundItem(stack, at), { stack, at, velocityCleared: false, clearVelocity() { this.velocityCleared = true; } });
      w.drops.push(entity);
      w.entities.push(entity);
      return entity;
    },
  };
  return w;
}

const BOX = { min: { x: 0, y: 64, z: 0 }, max: { x: 34, y: 93, z: 34 } };
const outsideXZ = (at, box) => at.x < box.min.x || at.x > box.max.x + 1 || at.z < box.min.z || at.z > box.max.z + 1;

test('protectLegendariesIn: a live marked legendary leaves the holder before the write', async (t) => {
  const owner = makePlayer('protect-owner');
  online();

  await t.test('moved out of a hopper and a shulker box, dropped outside the box with its id and generation', () => {
    const w = protectWorld();
    const hopper = makeContainer(5);
    const shulker = makeContainer(27);
    const a = markedSword(owner);
    const b = markedSword(owner);
    hopper.setItem(0, a);
    shulker.setItem(13, b);
    w.put({ x: 17, y: 64, z: 17 }, 'minecraft:hopper', hopper);
    w.put({ x: 3, y: 70, z: 30 }, 'minecraft:purple_shulker_box', shulker);
    const r = lg.protectLegendariesIn(w, BOX, { reason: 'test' });
    assert.deepStrictEqual(r, { moved: 2, handedBack: 0 });
    assert.strictEqual(hopper.getItem(0), undefined);
    assert.strictEqual(shulker.getItem(13), undefined);
    assert.deepStrictEqual(w.drops.map((d) => d.stack), [a, b], 'the same stacks, not re-made copies');
    for (const d of w.drops) {
      assert.ok(outsideXZ(d.at, BOX), `dropped at ${JSON.stringify(d.at)}, inside the box's footprint`);
      assert.strictEqual(d.at.y, 64, 'on the ground next to the box');
      assert.ok(d.velocityCleared);
    }
    for (const s of [a, b]) assert.strictEqual(lg.isLive(WEB_SWORD, lg.getMark(WEB_SWORD, s)), true, 'no generation moved');
  });

  await t.test('unmarked and stale copies and ordinary items stay and share the holder\'s fate', () => {
    const w = protectWorld();
    const chest = makeContainer(27);
    const stale = markedSword(owner);
    lg.bumpGen(WEB_SWORD, lg.getMark(WEB_SWORD, stale).id);
    chest.setItem(0, new mc.ItemStack(WEB_SWORD.itemId, 1));
    chest.setItem(1, stale);
    chest.setItem(2, new mc.ItemStack('minecraft:diamond', 3));
    w.put({ x: 5, y: 65, z: 5 }, 'minecraft:chest', chest);
    assert.deepStrictEqual(lg.protectLegendariesIn(w, BOX), { moved: 0, handedBack: 0 });
    assert.deepStrictEqual(chest.slots.slice(0, 3).map((s) => s?.typeId), [WEB_SWORD.itemId, WEB_SWORD.itemId, 'minecraft:diamond']);
    assert.deepStrictEqual(w.drops, []);
  });

  await t.test('a holder with no script inventory in the volume: throws before anything is moved', () => {
    const w = protectWorld();
    const hopper = makeContainer(5);
    const sword = markedSword(owner);
    hopper.setItem(0, sword);
    w.put({ x: 1, y: 64, z: 1 }, 'minecraft:hopper', hopper);
    w.put({ x: 30, y: 80, z: 30 }, 'minecraft:crafter', undefined);
    assert.throws(() => lg.protectLegendariesIn(w, BOX), /minecraft:crafter at 30,80,30 has no script-readable inventory/);
    assert.strictEqual(hopper.getItem(0), sword);
    assert.deepStrictEqual(w.drops, []);
  });

  await t.test('only ids the engine knows are queried, in slabs within the one-call cap', () => {
    const w = protectWorld();
    const big = { min: { x: 0, y: -60, z: 0 }, max: { x: 63, y: 3, z: 63 } };
    lg.protectLegendariesIn(w, big);
    assert.ok(w.queries.length >= 8);
    const types = w.queries[0].types;
    assert.ok(types.includes('minecraft:hopper') && types.includes('minecraft:undyed_shulker_box') && types.includes('minecraft:glow_frame'));
    assert.ok(!types.some((id) => id.endsWith('_shelf')), 'an unknown id reached the query');
    assert.ok(lg.HOLDER_TYPES.some((id) => id.endsWith('_shelf')));
    let covered = 0;
    for (const { vol } of w.queries) {
      const cells = (vol.to.x - vol.from.x + 1) * (vol.to.y - vol.from.y + 1) * (vol.to.z - vol.from.z + 1);
      assert.ok(cells <= 32768, `a query of ${cells} cells`);
      covered += cells;
    }
    assert.strictEqual(covered, 64 * 64 * 64);
  });

  await t.test('no safe spot: the stack goes to its owner online, or is owed at the same generation', () => {
    const flooded = () => {
      const w = protectWorld();
      const getBlock = w.getBlock;
      // Every column around the box is under water: nowhere to rest an item.
      w.getBlock = (at) => (at.y === 64 ? { ...getBlock(at), typeId: 'minecraft:water', isAir: false, isLiquid: true } : getBlock(at));
      return w;
    };
    const w1 = flooded();
    const barrel = makeContainer(27);
    const sword = markedSword(owner);
    const { id } = lg.getMark(WEB_SWORD, sword);
    barrel.setItem(4, sword);
    w1.put({ x: 9, y: 64, z: 9 }, 'minecraft:barrel', barrel);
    online(owner);
    assert.deepStrictEqual(lg.protectLegendariesIn(w1, BOX), { moved: 0, handedBack: 1 });
    assert.deepStrictEqual(gensOf(owner, id), [0]);
    assert.strictEqual(owner.container.slots.find((s) => s !== undefined && lg.getMark(WEB_SWORD, s)?.id === id), sword);
    assert.strictEqual(lg.ledgerGen(WEB_SWORD, id), 0);

    const w2 = flooded();
    const again = makeContainer(5);
    const other = markedSword(owner);
    const otherId = lg.getMark(WEB_SWORD, other).id;
    again.setItem(0, other);
    w2.put({ x: 9, y: 64, z: 9 }, 'minecraft:hopper', again);
    online();
    assert.deepStrictEqual(lg.protectLegendariesIn(w2, BOX), { moved: 0, handedBack: 1 });
    assert.deepStrictEqual(owedOf(owner).map((e) => [e.mark.id, e.mark.gen]), [[otherId, 0]]);
    online(owner);
    fire('playerSpawn', { player: owner, initialSpawn: false });
    flush();
    assert.deepStrictEqual(gensOf(owner, otherId), [0]);
    assert.deepStrictEqual(owedOf(owner), []);
  });
});

test('protectLegendariesIn: the drop spot clears a 37×37 avoid box (L0-adr-oprt §2)', async (t) => {
  const owner = makePlayer('ring-owner');
  online();
  // ring-cx02: one ring queue step protects blast centres ± 8 and avoids the
  // whole ring footprint, 37 × 37 around the target.
  const avoid = { min: { x: -18, y: 56, z: -18 }, max: { x: 18, y: 72, z: 18 } };
  const volume = { min: { x: -8, y: 56, z: -8 }, max: { x: 8, y: 72, z: 8 } };

  await t.test('a legendary at the centre of the step lands outside the 37×37 footprint, same stack and generation', () => {
    const w = protectWorld();
    const hopper = makeContainer(5);
    const sword = markedSword(owner);
    const { id } = lg.getMark(WEB_SWORD, sword);
    hopper.setItem(0, sword);
    w.put({ x: 0, y: 64, z: 0 }, 'minecraft:hopper', hopper);
    assert.deepStrictEqual(lg.protectLegendariesIn(w, volume, { avoid, reason: 'ring step' }), { moved: 1, handedBack: 0 });
    const [drop] = w.drops;
    assert.strictEqual(drop.stack, sword);
    assert.ok(outsideXZ(drop.at, avoid), `dropped at ${JSON.stringify(drop.at)}, inside the 37×37 avoid box`);
    assert.strictEqual(drop.at.y, 64);
    assert.strictEqual(lg.ledgerGen(WEB_SWORD, id), 0);
    assert.strictEqual(lg.isLive(WEB_SWORD, lg.getMark(WEB_SWORD, sword)), true);
  });
});

test('protectLegendariesIn: a legendary on the ground in the volume is moved, not lost (P-lgnd-008 step 3)', async (t) => {
  const owner = makePlayer('ground-owner');
  const avoid = { min: { x: -10, y: 60, z: -10 }, max: { x: 50, y: 80, z: 50 } };
  const both = { min: { x: -10, y: 60, z: -10 }, max: { x: 50, y: 93, z: 50 } };

  /** Four recovery checks, then what a misread loss would have left behind. */
  function assertNotLost(id) {
    for (let i = 0; i < 4; i++) tick();
    assert.strictEqual(lg.ledgerGen(WEB_SWORD, id), 0, 'the removal was read as a loss: the generation moved');
    assert.deepStrictEqual(gensOf(owner, id), [], 'the owner was handed a second copy');
    assert.deepStrictEqual(owner.messages, []);
    assert.deepStrictEqual(owedOf(owner), []);
  }

  await t.test('a watched ground legendary is re-dropped outside volume ∪ avoid, same id and gen, counted in moved', () => {
    online(owner);
    const w = protectWorld();
    const sword = markedSword(owner);
    const { id } = lg.getMark(WEB_SWORD, sword);
    const entity = groundItem(sword, { x: 20.5, y: 64, z: 12.5 });
    w.entities.push(entity);
    fire('entitySpawn', { entity });

    assert.deepStrictEqual(lg.protectLegendariesIn(w, BOX, { avoid, reason: 'test' }), { moved: 1, handedBack: 0 });
    assert.strictEqual(entity.isValid, false, 'the ground entity is still there');
    assert.strictEqual(w.drops.length, 1);
    const [drop] = w.drops;
    assert.deepStrictEqual(lg.getMark(WEB_SWORD, drop.stack), lg.getMark(WEB_SWORD, sword));
    assert.strictEqual(lg.getMark(WEB_SWORD, drop.stack).gen, 0);
    assert.ok(outsideXZ(drop.at, both), `dropped at ${JSON.stringify(drop.at)}, inside volume ∪ avoid`);

    fire('entitySpawn', { entity: drop });
    assertNotLost(id);
    assert.strictEqual(w.entities.filter((e) => e.isValid && lg.getMark(WEB_SWORD, e.getComponent('minecraft:item').itemStack)?.id === id).length, 1);
  });

  await t.test('an item removed before its entitySpawn arrived is never watched, even while isValid lags', () => {
    online(owner);
    const w = protectWorld();
    const sword = markedSword(owner);
    const { id } = lg.getMark(WEB_SWORD, sword);
    const entity = groundItem(sword, { x: 5.5, y: 64, z: 5.5 });
    w.entities.push(entity);

    assert.deepStrictEqual(lg.protectLegendariesIn(w, BOX), { moved: 1, handedBack: 0 });
    entity.isValid = true;
    fire('entitySpawn', { entity });
    entity.isValid = false;
    assertNotLost(id);
  });

  await t.test('handed back to an offline owner: owed at the same generation, and no loss on top', () => {
    online();
    const w = protectWorld();
    const getBlock = w.getBlock;
    w.getBlock = (at) => (at.y === 64 ? { ...getBlock(at), typeId: 'minecraft:water', isAir: false, isLiquid: true } : getBlock(at));
    const sword = markedSword(owner);
    const { id } = lg.getMark(WEB_SWORD, sword);
    const entity = groundItem(sword, { x: 5.5, y: 64, z: 5.5 });
    w.entities.push(entity);
    fire('entitySpawn', { entity });

    assert.deepStrictEqual(lg.protectLegendariesIn(w, BOX), { moved: 0, handedBack: 1 });
    for (let i = 0; i < 4; i++) tick();
    assert.deepStrictEqual(owedOf(owner).map((e) => [e.mark.id, e.mark.gen]), [[id, 0]]);
    assert.strictEqual(lg.ledgerGen(WEB_SWORD, id), 0);
    online(owner);
    fire('playerSpawn', { player: owner, initialSpawn: false });
    flush();
    assert.deepStrictEqual(gensOf(owner, id), [0]);
    owner.container.slots.fill(undefined);
    owner.messages.length = 0;
  });

  await t.test('unmarked, stale and ordinary items, and anything outside the volume, stay', () => {
    online(owner);
    const w = protectWorld();
    const stale = markedSword(owner);
    lg.bumpGen(WEB_SWORD, lg.getMark(WEB_SWORD, stale).id);
    const outside = markedSword(owner);
    const stays = [
      groundItem(new mc.ItemStack(WEB_SWORD.itemId, 1), { x: 1.5, y: 64, z: 1.5 }),
      groundItem(stale, { x: 2.5, y: 64, z: 2.5 }),
      groundItem(new mc.ItemStack('minecraft:diamond', 5), { x: 3.5, y: 64, z: 3.5 }),
      groundItem(outside, { x: 35.2, y: 64, z: 3.5 }),
      groundItem(outside, { x: 3.5, y: 94.1, z: 3.5 }),
    ];
    w.entities.push(...stays);
    assert.deepStrictEqual(lg.protectLegendariesIn(w, BOX), { moved: 0, handedBack: 0 });
    assert.ok(stays.every((e) => e.isValid));
    assert.deepStrictEqual(w.drops, []);
  });

  await t.test('the query covers the whole max cell and is clamped to the height range', () => {
    online(owner);
    const w = protectWorld();
    const sword = markedSword(owner);
    const corner = groundItem(sword, { x: 34.9, y: 93.9, z: 34.9 });
    w.entities.push(corner);
    assert.deepStrictEqual(lg.protectLegendariesIn(w, BOX), { moved: 1, handedBack: 0 });
    assert.strictEqual(corner.isValid, false);

    const deep = protectWorld();
    let query;
    deep.getEntities = (q) => ((query = q), []);
    lg.protectLegendariesIn(deep, { min: { x: 0, y: -100, z: 0 }, max: { x: 4, y: 400, z: 4 } });
    assert.deepStrictEqual(query.location, { x: 0, y: -64, z: 0 });
    assert.deepStrictEqual(query.volume, { x: 4, y: 319 - -64, z: 4 });
  });

  await t.test('isLegendaryItemEntity: an item entity with a live marked legendary, nothing else', () => {
    const live = markedSword(owner);
    const stale = markedSword(owner);
    lg.bumpGen(WEB_SWORD, lg.getMark(WEB_SWORD, stale).id);
    assert.strictEqual(lg.isLegendaryItemEntity(itemEntity(live)), true);
    assert.strictEqual(lg.isLegendaryItemEntity(itemEntity(stale)), false);
    assert.strictEqual(lg.isLegendaryItemEntity(itemEntity(new mc.ItemStack(WEB_SWORD.itemId, 1))), false);
    assert.strictEqual(lg.isLegendaryItemEntity(itemEntity(new mc.ItemStack('minecraft:diamond', 1))), false);
    const removed = itemEntity(live);
    removed.remove();
    assert.strictEqual(lg.isLegendaryItemEntity(removed), false);
    assert.strictEqual(lg.isLegendaryItemEntity({ ...itemEntity(live), typeId: 'minecraft:zombie' }), false);
  });
});

test('protectLegendariesIn: item frames are broken open and a framed legendary is moved (L0-adr-oprt §3)', async (t) => {
  const owner = makePlayer('frame-owner');
  online(owner);

  await t.test('frame and glow frame: setblock … air destroy, the spilled legendaries leave, the frame items stay', () => {
    const w = protectWorld();
    const a = markedSword(owner);
    const b = markedSword(owner);
    w.put({ x: 4, y: 64, z: 4 }, 'minecraft:frame', undefined, a);
    w.put({ x: 30, y: 70, z: 2 }, 'minecraft:glow_frame', undefined, b);
    assert.deepStrictEqual(lg.protectLegendariesIn(w, BOX, { reason: 'test' }), { moved: 2, handedBack: 0 });
    assert.deepStrictEqual([...w.commands].sort(), ['setblock 30 70 2 air destroy', 'setblock 4 64 4 air destroy']);
    assert.deepStrictEqual(
      w.drops.map((d) => lg.getMark(WEB_SWORD, d.stack)),
      [a, b].map((s) => lg.getMark(WEB_SWORD, s))
    );
    for (const d of w.drops) assert.ok(outsideXZ(d.at, BOX), `dropped at ${JSON.stringify(d.at)}`);
    const left = w.entities.filter((e) => e.isValid && !w.drops.includes(e)).map((e) => e.getComponent('minecraft:item').itemStack.typeId);
    assert.deepStrictEqual(left.sort(), ['minecraft:frame', 'minecraft:glow_frame']);
  });

  await t.test('an empty frame is broken as well: what a frame holds cannot be read', () => {
    const w = protectWorld();
    w.put({ x: 7, y: 66, z: 7 }, 'minecraft:frame', undefined);
    assert.deepStrictEqual(lg.protectLegendariesIn(w, BOX), { moved: 0, handedBack: 0 });
    assert.deepStrictEqual(w.commands, ['setblock 7 66 7 air destroy']);
  });

  await t.test('a frame the command does not break: throws before any holder is emptied', () => {
    for (const refuse of [() => ({ successCount: 0 }), () => { throw new Error('CommandError'); }]) {
      const w = protectWorld();
      const hopper = makeContainer(5);
      const sword = markedSword(owner);
      hopper.setItem(0, sword);
      w.put({ x: 1, y: 64, z: 1 }, 'minecraft:hopper', hopper);
      w.put({ x: 4, y: 64, z: 4 }, 'minecraft:frame', undefined);
      w.runCommand = refuse;
      assert.throws(() => lg.protectLegendariesIn(w, BOX, { reason: 'test' }), /could not break the frame at 4,64,4 .*not writing over it \(test\)/);
      assert.strictEqual(hopper.getItem(0), sword);
      assert.deepStrictEqual(w.drops, []);
    }
  });
});

test('protectLegendariesIn: the spot search walks max(16, halfExtent + 4) rings (L0-adr-oprt §2)', async (t) => {
  const box = (sx, sz) => ({ min: { x: 0, y: 64, z: 0 }, max: { x: sx - 1, y: 70, z: sz - 1 } });

  await t.test('spotSearchLimit = max(16, half the larger XZ extent + 4)', () => {
    assert.strictEqual(lg.spotSearchLimit(box(37, 37)), 22.5);
    assert.strictEqual(lg.spotSearchLimit(box(3, 3)), 16);
    assert.strictEqual(lg.spotSearchLimit(box(24, 24)), 16);
    assert.strictEqual(lg.spotSearchLimit(box(25, 25)), 16.5);
    assert.strictEqual(lg.spotSearchLimit(box(57, 9)), 32.5);
    assert.strictEqual(lg.spotSearchLimit(box(9, 57)), 32.5);
  });

  const owner = makePlayer('limit-owner');
  const avoid = { min: { x: -18, y: 56, z: -18 }, max: { x: 18, y: 72, z: 18 } };
  const volume = { min: { x: -8, y: 56, z: -8 }, max: { x: 8, y: 72, z: 8 } };
  /** Water on every column up to `wet` rings outside the 37×37 avoid box. */
  function drowned(wet) {
    const w = protectWorld();
    const getBlock = w.getBlock;
    const ring = (at) => Math.max(avoid.min.x - at.x, at.x - avoid.max.x, avoid.min.z - at.z, at.z - avoid.max.z, 0);
    w.getBlock = (at) => (at.y === 64 && ring(at) <= wet ? { ...getBlock(at), typeId: 'minecraft:water', isAir: false, isLiquid: true } : getBlock(at));
    return { w, ring };
  }
  function protectHopperSword(w) {
    const hopper = makeContainer(5);
    hopper.setItem(0, markedSword(owner));
    w.put({ x: 0, y: 64, z: 0 }, 'minecraft:hopper', hopper);
    return lg.protectLegendariesIn(w, volume, { avoid, reason: 'ring step' });
  }

  await t.test('37×37 avoid box: a spot 22 rings out is found', () => {
    online(owner);
    const { w, ring } = drowned(21);
    assert.deepStrictEqual(protectHopperSword(w), { moved: 1, handedBack: 0 });
    assert.strictEqual(ring({ x: Math.floor(w.drops[0].at.x), z: Math.floor(w.drops[0].at.z) }), 22);
  });

  await t.test('37×37 avoid box: 23 rings out is past the limit, so the stack is handed back', () => {
    online(owner);
    const { w } = drowned(22);
    assert.deepStrictEqual(protectHopperSword(w), { moved: 0, handedBack: 1 });
    assert.deepStrictEqual(w.drops, []);
  });
});

test('recovery events for a player the pack cannot read, or one already removed, are ignored without a throw', () => {
  // A product pack gets undefined where a SimulatedPlayer stands; an after-event
  // can arrive for a player removed in the same tick, whose every call throws.
  const gone = makePlayer('gone');
  gone.isValid = false;
  gone.getComponent = () => {
    throw new Error('InvalidEntityError: Entity being invalid');
  };
  assert.doesNotThrow(() => fire('playerSwingStart', { player: undefined, swingSource: 'DropItem' }));
  assert.doesNotThrow(() => fire('playerSwingStart', { player: gone, swingSource: 'DropItem' }));
  assert.doesNotThrow(() => fire('playerInventoryItemChange', { player: gone, slot: 0, itemStack: undefined, beforeItemStack: new mc.ItemStack('minecraft:dirt'), inventoryType: 'Hotbar' }));
  assert.doesNotThrow(() => fire('before:entityRemove', { removedEntity: undefined }));
});

// ------------------------------------------------ the Void floor (L0-lgnd-cx14)

/** A dimension where, as on BDS, isChunkLoaded is false below the floor and getBlock throws outside the height range. */
function floorDimension(overrides = {}) {
  return {
    heightRange: { min: -64, max: 320 },
    asked: [],
    isChunkLoaded: (at) => at.y >= -64,
    getBlock(at) {
      this.asked.push(at.y);
      if (at.y < -64 || at.y >= 320) throw new Error('LocationOutOfWorldBoundariesError');
      return undefined;
    },
    getEntities: () => [],
    ...overrides,
  };
}

/** Watches `stack` at `location` in `dim`, then lets it vanish unseen before the next check. */
function vanishAt(stack, dim, location) {
  const entity = Object.assign(itemEntity(stack), { dimension: dim, location });
  fire('entitySpawn', { entity });
  entity.isValid = false;
  tick();
}

test('CX-lgnd-14: a marked item that vanished at the floor or below it is returned', async (t) => {
  const owner = makePlayer('floor');

  await t.test('last seen below the floor, where isChunkLoaded reads false: a Void loss, returned at gen 1', () => {
    online(owner);
    const sword = markedSword(owner);
    const { id } = lg.getMark(WEB_SWORD, sword);
    vanishAt(sword, floorDimension(), { x: 5.5, y: -64.076, z: 8.5 });
    assert.deepStrictEqual(gensOf(owner, id), [1]);
    assert.strictEqual(lg.ledgerGen(WEB_SWORD, id), 1);
  });

  await t.test('last seen inside the world in a chunk that is not loaded: still an unload, nothing returned', () => {
    online(owner);
    const sword = markedSword(owner);
    const { id } = lg.getMark(WEB_SWORD, sword);
    vanishAt(sword, floorDimension({ isChunkLoaded: () => false }), { x: 5.5, y: -60, z: 8.5 });
    assert.deepStrictEqual(gensOf(owner, id), []);
    assert.strictEqual(lg.ledgerGen(WEB_SWORD, id), 0);
  });

  for (const y of [-63.5, -64, 319.5]) {
    await t.test(`last seen at y=${y}: no cell outside the height range is asked for, and it is returned`, () => {
      online(owner);
      const sword = markedSword(owner);
      const { id } = lg.getMark(WEB_SWORD, sword);
      const dim = floorDimension();
      assert.doesNotThrow(() => vanishAt(sword, dim, { x: 5.5, y, z: 8.5 }));
      assert.ok(dim.asked.length > 0 && dim.asked.every((at) => at >= -64 && at < 320), `asked y [${dim.asked.join(' ')}]`);
      assert.deepStrictEqual(gensOf(owner, id), [1]);
    });
  }
});

test('CX-lgnd-14: armour stands are followed only while loaded and asked only below the floor', async (t) => {
  const standDim = { heightRange: { min: -64, max: 320 } };
  let standCount = 0;
  function stand(y, holds) {
    return {
      id: `stand${++standCount}`,
      typeId: 'minecraft:armor_stand',
      isValid: true,
      location: { x: 0.5, y, z: 0.5 },
      dimension: standDim,
      asked: [],
      killed: 0,
      runCommand(command) {
        this.asked.push(command);
        const hit = holds !== undefined && command.includes(`item=${holds.item},location=${holds.slot}}`);
        return { successCount: hit ? 1 : 0 };
      },
      kill() {
        this.killed++;
        return true;
      },
    };
  }
  const asked = (stands) => stands.reduce((n, s) => n + s.asked.length, 0);

  await t.test('no stand loaded: no watcher interval; another entity type does not start one', () => {
    assert.deepStrictEqual(lg.standWatchState(), { stands: 0, ticking: false });
    fire('entitySpawn', { entity: { ...stand(-70), typeId: 'minecraft:zombie' } });
    assert.deepStrictEqual(lg.standWatchState(), { stands: 0, ticking: false });
  });

  await t.test('50 stands above the floor holding a legendary: followed for 200 ticks, never asked', () => {
    const many = Array.from({ length: 50 }, () => stand(-60, { item: WEB_SWORD.itemId, slot: 'slot.weapon.mainhand' }));
    for (const s of many) fire('entitySpawn', { entity: s });
    assert.deepStrictEqual(lg.standWatchState(), { stands: 50, ticking: true });
    for (let i = 0; i < 200; i++) tick();
    assert.strictEqual(asked(many), 0);
    for (const s of many) fire('before:entityRemove', { removedEntity: s });
    tick();
    assert.deepStrictEqual(lg.standWatchState(), { stands: 0, ticking: false });
  });

  await t.test('below the floor holding a legendary in either hand: killed once, then no longer followed', () => {
    const main = stand(-60, { item: lg.SCYTHE_OF_CALAMITY.itemId, slot: 'slot.weapon.mainhand' });
    const off = stand(-60, { item: lg.ORBITAL_CANNON.itemId, slot: 'slot.weapon.offhand' });
    fire('entityLoad', { entity: main });
    fire('entitySpawn', { entity: off });
    tick();
    assert.strictEqual(asked([main, off]), 0);
    main.location.y = off.location.y = -70.2;
    tick();
    tick();
    assert.deepStrictEqual([main.killed, off.killed], [1, 1]);
    assert.deepStrictEqual(lg.standWatchState(), { stands: 0, ticking: false });
  });

  await t.test('below the floor with no legendary: every legendary asked for in both hands, never killed', () => {
    const plain = stand(-70.5, { item: 'minecraft:iron_sword', slot: 'slot.weapon.mainhand' });
    fire('entitySpawn', { entity: plain });
    tick();
    assert.strictEqual(plain.killed, 0);
    assert.strictEqual(plain.asked.length, lg.LEGENDARIES.length * 2);
    for (const def of lg.LEGENDARIES) {
      for (const slot of ['slot.weapon.mainhand', 'slot.weapon.offhand']) {
        assert.ok(plain.asked.includes(`testfor @s[hasitem={item=${def.itemId},location=${slot}}]`), `${def.itemId} ${slot}`);
      }
    }
    plain.isValid = false;
    tick();
    assert.deepStrictEqual(lg.standWatchState(), { stands: 0, ticking: false });
  });
});

// ------------------------------------------------ the last holder gets a lost instance back (L0-lgnd-ad11, CX-lgnd-16)

/** A Web Sword made by `crafter` the way the craft gate makes it. */
function craftedSword(crafter) {
  return lg.markItem(WEB_SWORD, new mc.ItemStack(WEB_SWORD.itemId, 1), lg.makeMark('craft', crafter));
}

/** A stack stamped the way stacks were before holders: origin, owner, id, owner name, no holder keys. */
function legacySword(owner, id) {
  const stack = new mc.ItemStack(WEB_SWORD.itemId, 1);
  stack.setDynamicProperty('andrew:ws_origin', 'craft');
  stack.setDynamicProperty('andrew:ws_owner', owner.id);
  stack.setDynamicProperty('andrew:ws_id', id);
  stack.setDynamicProperty('andrew:ws_owner_name', owner.name);
  return stack;
}

/** `stack` enters `player`'s slot, and the engine reports it. */
function arrive(player, slot, stack) {
  player.container.setItem(slot, stack);
  fire('playerInventoryItemChange', { player, slot, itemStack: stack, inventoryType: 'Inventory' });
}

/** The stack leaves `player`'s slot onto the ground and vanishes there unseen. */
function dropAndLose(player, slot) {
  const stack = player.container.getItem(slot);
  player.container.setItem(slot, undefined);
  loseUnseen(stack);
}

test('holder: a lost instance goes back to whoever held it last, not to its crafter (L0-lgnd-ad11)', async (t) => {
  await t.test('parsing: holder and holderName are read; a bad holder is dropped, never the mark', () => {
    const base = { origin: 'craft', owner: '-1', id: 'h', gen: 0, ownerName: 'Ann' };
    const held = { ...base, holder: '-2', holderName: 'Bea' };
    assert.deepStrictEqual(lg.parseMark(JSON.stringify(held)), held);
    assert.deepStrictEqual(lg.parseMark(lg.serializeMark(held)), held);
    for (const holder of [5, '', null, true, {}]) {
      assert.deepStrictEqual(lg.parseMark(JSON.stringify({ ...base, holder, holderName: 'x' })), base, `holder ${JSON.stringify(holder)}`);
    }
    assert.deepStrictEqual(lg.parseMark(JSON.stringify({ ...base, holderName: 'orphan' })), base, 'a name without a holder names nobody');
    assert.deepStrictEqual(lg.parseMark(JSON.stringify({ ...base, holder: '-2', holderName: 3 })), { ...base, holder: '-2' });
    assert.deepStrictEqual(lg.parsePending(JSON.stringify([{ ...base, holder: 7 }, held])), [base, held]);
    assert.deepStrictEqual(lg.parseOwed(JSON.stringify({ '-2': [{ mark: held, reason: 'lost' }], '-3': [{ mark: { ...base, holder: [] }, reason: 'lost' }] })), {
      '-2': [{ mark: held, reason: 'lost' }],
      '-3': [{ mark: base, reason: 'lost' }],
    });
  });

  await t.test('returnTarget is the holder, and the owner when there is none', () => {
    assert.strictEqual(lg.returnTarget({ origin: 'craft', owner: '-1', id: 'a', gen: 0, holder: '-2' }), '-2');
    assert.strictEqual(lg.returnTarget({ origin: 'craft', owner: '-1', id: 'a', gen: 0 }), '-1');
  });

  await t.test('a fresh mark names its maker as owner and holder; the stack carries both', () => {
    const maker = makePlayer('maker');
    const stack = craftedSword(maker);
    const mark = lg.getMark(WEB_SWORD, stack);
    assert.deepStrictEqual(
      [mark.owner, mark.ownerName, mark.holder, mark.holderName],
      [maker.id, 'maker', maker.id, 'maker']
    );
    assert.strictEqual(stack.getDynamicProperty('andrew:ws_holder'), maker.id);
    assert.strictEqual(stack.getDynamicProperty('andrew:ws_holder_name'), 'maker');
    stack.setDynamicProperty('andrew:ws_holder', 12);
    const bad = lg.getMark(WEB_SWORD, stack);
    assert.ok(bad !== undefined, 'a bad holder key cost the stack its mark');
    assert.strictEqual(bad.holder, undefined);
    assert.strictEqual(lg.returnTarget(bad), maker.id);
  });

  const crafter = makePlayer('crafter');
  const holder = makePlayer('holder');
  online(crafter, holder);
  const sword = craftedSword(crafter);
  const { id } = lg.getMark(WEB_SWORD, sword);

  await t.test('a hand-over stamps the new holder in place; the crafter fields stay', () => {
    arrive(holder, 3, sword);
    const onB = lg.getMark(WEB_SWORD, holder.container.getItem(3));
    assert.deepStrictEqual(
      [onB.owner, onB.ownerName, onB.origin, onB.holder, onB.holderName, onB.gen],
      [crafter.id, 'crafter', 'craft', holder.id, 'holder', 0]
    );
    assert.deepStrictEqual(holder.container.slotWrites, [3]);
    fire('playerInventoryItemChange', { player: holder, slot: 3, itemStack: holder.container.getItem(3), inventoryType: 'Inventory' });
    assert.deepStrictEqual(holder.container.slotWrites, [3], 'the holder is written once per hand-over, not on every event');
  });

  await t.test('online: the holder who lost it gets the next generation; the crafter gets nothing', () => {
    dropAndLose(holder, 3);
    assert.deepStrictEqual(gensOf(holder, id), [1]);
    assert.deepStrictEqual(gensOf(crafter, id), []);
    assert.deepStrictEqual(holder.messages, [RECOVERED]);
    assert.deepStrictEqual(crafter.messages, []);
    assert.deepStrictEqual(lg.readOwed(WEB_SWORD), {});
    const back = lg.getMark(WEB_SWORD, holder.container.slots.find((s) => s !== undefined));
    assert.deepStrictEqual([back.owner, back.ownerName, back.holder], [crafter.id, 'crafter', holder.id], 'the crafter stays the owner of the returned copy');
  });

  await t.test('offline: the debt is the holder\'s, not the crafter\'s, and is paid on the holder\'s join', () => {
    const a = makePlayer('crafter-2');
    const b = makePlayer('holder-2');
    online(a, b);
    const s2 = craftedSword(a);
    const id2 = lg.getMark(WEB_SWORD, s2).id;
    arrive(b, 0, s2);
    b.container.setItem(0, undefined);
    online(a);
    loseUnseen(s2.clone());
    const owed = lg.readOwed(WEB_SWORD);
    assert.deepStrictEqual(Object.keys(owed), [b.id]);
    assert.deepStrictEqual(owed[b.id].map((e) => [e.mark.id, e.mark.gen, e.mark.holder, e.mark.owner]), [[id2, 1, b.id, a.id]]);
    assert.deepStrictEqual(gensOf(a, id2), []);

    fire('playerSpawn', { player: a, initialSpawn: false });
    flush();
    assert.deepStrictEqual(gensOf(a, id2), [], 'the crafter redeemed the holder\'s debt');
    online(a, b);
    fire('playerSpawn', { player: b, initialSpawn: true });
    flush();
    assert.deepStrictEqual(gensOf(b, id2), [1]);
    assert.deepStrictEqual(lg.readOwed(WEB_SWORD), {});
  });

  await t.test('legacy: a stack with no holder, lost from the ground, goes to its owner', () => {
    const owner = makePlayer('legacy-owner-2');
    const bystander = makePlayer('bystander');
    online(owner, bystander);
    const old = legacySword(owner, 'legacy-held-1');
    assert.strictEqual(lg.getMark(WEB_SWORD, old).holder, undefined);
    loseUnseen(old);
    assert.deepStrictEqual(gensOf(owner, 'legacy-held-1'), [1]);
    assert.deepStrictEqual(gensOf(bystander, 'legacy-held-1'), []);
    assert.strictEqual(lg.getMark(WEB_SWORD, owner.container.slots.find((s) => s !== undefined)).holder, owner.id);
  });

  await t.test('legacy: the first inventory a holder-less stack enters becomes its holder', () => {
    const owner = makePlayer('legacy-owner-3');
    const taker = makePlayer('taker');
    online(owner, taker);
    arrive(taker, 5, legacySword(owner, 'legacy-held-2'));
    const mark = lg.getMark(WEB_SWORD, taker.container.getItem(5));
    assert.deepStrictEqual([mark.owner, mark.holder], [owner.id, taker.id]);
    dropAndLose(taker, 5);
    assert.deepStrictEqual(gensOf(taker, 'legacy-held-2'), [1]);
    assert.deepStrictEqual(gensOf(owner, 'legacy-held-2'), []);
  });

  await t.test('a stale copy entering an inventory is deleted, not stamped', () => {
    const owner = makePlayer('stale-owner');
    const finder = makePlayer('stale-finder');
    online(owner, finder);
    const s = craftedSword(owner);
    lg.bumpGen(WEB_SWORD, lg.getMark(WEB_SWORD, s).id);
    arrive(finder, 1, s);
    assert.strictEqual(finder.container.getItem(1), undefined);
    assert.deepStrictEqual(finder.container.slotWrites, []);
    assert.strictEqual(lg.getMark(WEB_SWORD, s).holder, owner.id);
  });

  await t.test('protect with no safe spot hands the stack to its holder, or owes it to them', () => {
    const flooded = () => {
      const w = protectWorld();
      const getBlock = w.getBlock;
      w.getBlock = (at) => (at.y === 64 ? { ...getBlock(at), typeId: 'minecraft:water', isAir: false, isLiquid: true } : getBlock(at));
      return w;
    };
    const a = makePlayer('protect-crafter');
    const b = makePlayer('protect-holder');
    const held = (stack) => lg.markItem(WEB_SWORD, new mc.ItemStack(WEB_SWORD.itemId, 1), lg.withHolder(lg.getMark(WEB_SWORD, stack), b));

    const w1 = flooded();
    const barrel = makeContainer(27);
    const s1 = held(craftedSword(a));
    const id1 = lg.getMark(WEB_SWORD, s1).id;
    barrel.setItem(0, s1);
    w1.put({ x: 9, y: 64, z: 9 }, 'minecraft:barrel', barrel);
    online(a, b);
    assert.deepStrictEqual(lg.protectLegendariesIn(w1, BOX), { moved: 0, handedBack: 1 });
    assert.deepStrictEqual(gensOf(b, id1), [0]);
    assert.deepStrictEqual(gensOf(a, id1), []);

    const w2 = flooded();
    const hopper = makeContainer(5);
    const s2 = held(craftedSword(a));
    const id2 = lg.getMark(WEB_SWORD, s2).id;
    hopper.setItem(0, s2);
    w2.put({ x: 9, y: 64, z: 9 }, 'minecraft:hopper', hopper);
    online(a);
    assert.deepStrictEqual(lg.protectLegendariesIn(w2, BOX), { moved: 0, handedBack: 1 });
    assert.deepStrictEqual(Object.keys(lg.readOwed(WEB_SWORD)), [b.id]);
    assert.deepStrictEqual(owedOf(b).map((e) => [e.mark.id, e.mark.gen]), [[id2, 0]]);
    assert.deepStrictEqual(gensOf(a, id2), []);
    online(a, b);
    fire('playerSpawn', { player: b, initialSpawn: true });
    flush();
    assert.deepStrictEqual(gensOf(b, id2), [0]);
    assert.deepStrictEqual(lg.readOwed(WEB_SWORD), {});
  });
});

// A loss return mints a new generation from the watched mark, so the mark
// carries the look read off the stack it was watched on.
test('look: a loss return and a redeemed debt are the same item, at the next generation', async (t) => {
  function dressed(owner) {
    const stack = markedSword(owner);
    stack.enchants.set('sharpness', 4);
    stack.nameTag = 'Lost and found';
    stack.lore = ['line one', 'line two'];
    return stack;
  }
  const lookOf = (stack) => ({ enchants: [...stack.enchants].sort(), nameTag: stack.nameTag, lore: stack.lore });
  const copyOf = (player, id) => player.container.slots.find((s) => s !== undefined && lg.getMark(WEB_SWORD, s)?.id === id);

  await t.test('online: the copy handed back carries the look of the stack that vanished', () => {
    const owner = makePlayer('look-loss');
    online(owner);
    const stack = dressed(owner);
    loseUnseen(stack);
    const id = lg.getMark(WEB_SWORD, stack).id;
    assert.deepStrictEqual(gensOf(owner, id), [1]);
    assert.deepStrictEqual(lookOf(copyOf(owner, id)), lookOf(stack));
  });

  await t.test('offline: the debt stores the look and the copy paid on join carries it', () => {
    const owner = makePlayer('look-owed');
    online();
    const stack = dressed(owner);
    loseUnseen(stack);
    const id = lg.getMark(WEB_SWORD, stack).id;
    assert.deepStrictEqual(owedOf(owner).map((e) => e.mark.look), [{ enchantments: [['sharpness', 4]], nameTag: 'Lost and found', lore: ['line one', 'line two'] }]);
    online(owner);
    fire('playerSpawn', { player: owner, initialSpawn: true });
    flush();
    assert.deepStrictEqual(gensOf(owner, id), [1]);
    assert.deepStrictEqual(lookOf(copyOf(owner, id)), lookOf(stack));
  });
});
