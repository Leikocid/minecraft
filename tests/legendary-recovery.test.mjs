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
export class ItemStack {
  constructor(typeId, amount = 1) {
    this.typeId = typeId;
    this.amount = amount;
    this.props = new Map();
    Object.assign(this, props(this.props));
  }
  clone() {
    const copy = new ItemStack(this.typeId, this.amount);
    for (const [k, v] of this.props) copy.props.set(k, v);
    return copy;
  }
}
export class Player {}
mc.ItemStack = ItemStack;
mc.Player = Player;
export const EntityComponentTypes = { Equippable: 'minecraft:equippable' };
export const EquipmentSlot = { Mainhand: 'Mainhand', Offhand: 'Offhand' };
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
  return {
    size,
    slots,
    getItem: (i) => slots[i],
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
        return { getEquipment: (slot) => (slot === 'Mainhand' ? this.container.getItem(this.selectedSlotIndex) : undefined) };
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
