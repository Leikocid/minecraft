// Death retention of every marked copy, off the engine (L0-lgnd-p002, ent4,
// ac07; CX-lgnd-10).
//
// The production modules — retention, recovery, state — are bundled against an
// in-memory @minecraft/server, as in legendary-recovery.test.mjs. Recovery is
// armed too: a copy path B takes off the ground must not come back a second
// time as a loss return. The GameTest twin is andrew:probe_retention_two_copies
// in src/gametest/probe-retention.ts.

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
export const BlockTypes = { get: (id) => ({ id }) };
export class BlockVolume {}
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

const PENDING_KEY = 'andrew:ws_pending';
const RETURNED = `${WEB_SWORD.textPrefix}.returned`;

function fire(name, event) {
  for (const handler of mc.handlers[name] ?? []) handler(event);
}

/** Runs everything system.run queued, including what those callbacks queue. */
function flush() {
  while (mc.queue.length > 0) mc.queue.shift()();
}

/** One recovery watcher tick: a loss return, if any, lands here. */
function tick() {
  for (const fn of [...mc.intervals.values()]) fn();
  flush();
}

/** Item entities lie in `ground`; getEntities answers from it, as the sweep's query does. */
const dimension = {
  heightRange: { min: -64, max: 320 },
  ground: [],
  spawned: [],
  isChunkLoaded: () => true,
  getBlock: () => undefined,
  getEntities() {
    return this.ground.filter((e) => e.isValid);
  },
  spawnItem(stack) {
    this.spawned.push(stack);
  },
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
          getEquipment: (slot) => (slot === 'Offhand' ? this.offhand : undefined),
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
  mc.players = [player];
  return player;
}

let entityCount = 0;
/** An item entity lying at the death spot, seen by recovery as the engine would announce it. */
function drop(stack) {
  const entity = {
    id: `e${++entityCount}`,
    typeId: 'minecraft:item',
    isValid: true,
    location: { x: 1, y: 64, z: 1 },
    dimension,
    getComponent: (id) => (id === 'minecraft:item' ? { itemStack: stack } : undefined),
    remove() {
      this.isValid = false;
    },
  };
  dimension.ground.push(entity);
  fire('entitySpawn', { entity });
  return entity;
}

function marked(owner, origin = 'admin') {
  return lg.markItem(WEB_SWORD, new mc.ItemStack(WEB_SWORD.itemId, 1), lg.makeMark(origin, owner));
}

const idOf = (stack) => lg.getMark(WEB_SWORD, stack).id;

/** How many copies of instance `id` the player carries, inventory and off hand. */
function held(player, id) {
  const carried = [...player.container.slots, player.offhand];
  return carried.filter((s) => s !== undefined && s.typeId === WEB_SWORD.itemId && lg.getMark(WEB_SWORD, s)?.id === id).length;
}

/** Every Web Sword the player carries, marked or not. */
function swordsCarried(player) {
  return [...player.container.slots, player.offhand].filter((s) => s?.typeId === WEB_SWORD.itemId).length;
}

/** Instance ids in the stored pending value, whatever its format. */
function pendingIds(player) {
  const raw = player.getDynamicProperty(PENDING_KEY);
  if (raw === undefined) return [];
  const value = JSON.parse(raw);
  return (Array.isArray(value) ? value : [value]).map((m) => m.id);
}

function owedIds(player) {
  return (lg.readOwed(WEB_SWORD)[player.id] ?? []).map((e) => e.mark.id);
}

function die(player) {
  fire('entityDie', { deadEntity: player });
  player.health = 0;
  flush();
}

function respawn(player) {
  player.health = 20;
  fire('playerSpawn', { player, initialSpawn: false });
  flush();
}

/** What the engine does on 1.26.51.1 before entityDie: every slot becomes an item entity. */
function spill(player) {
  const entities = [];
  for (let slot = 0; slot < player.container.size; slot++) {
    const stack = player.container.getItem(slot);
    if (stack !== undefined) {
      entities.push(drop(stack));
      player.container.setItem(slot, undefined);
    }
  }
  if (player.offhand !== undefined) {
    entities.push(drop(player.offhand));
    player.offhand = undefined;
  }
  return entities;
}

test('AC1: two marked copies of one weapon — both retained, both returned, no third', async (t) => {
  await t.test('path B (death drops spawn before entityDie, as on BDS 1.26.51.1): both are reclaimed into pending', () => {
    dimension.ground = [];
    const player = makePlayer('two-on-the-ground');
    const crafted = marked(player, 'craft');
    const given = marked(player, 'admin');
    player.container.setItem(0, crafted);
    player.container.setItem(7, given);

    const entities = spill(player);
    die(player);

    assert.ok(entities.every((e) => !e.isValid), 'a marked copy is still lying at the death spot');
    assert.deepStrictEqual(pendingIds(player).sort(), [idOf(crafted), idOf(given)].sort(), 'pending lost a copy');

    tick();
    tick();
    assert.deepStrictEqual(owedIds(player), [], 'path B took the copies, so nothing is lost and nothing is owed');

    respawn(player);
    assert.strictEqual(held(player, idOf(crafted)), 1, 'the crafted copy is not back exactly once');
    assert.strictEqual(held(player, idOf(given)), 1, 'the admin copy is not back exactly once');
    assert.strictEqual(swordsCarried(player), 2, 'a third Web Sword appeared');
    assert.deepStrictEqual(player.messages, [RETURNED, RETURNED]);
    assert.strictEqual(player.getDynamicProperty(PENDING_KEY), undefined, 'the tokens outlived the return');

    respawn(player);
    tick();
    assert.strictEqual(swordsCarried(player), 2, 'a further spawn issued a third copy');
    assert.deepStrictEqual(dimension.spawned, []);
  });

  await t.test('path A (still in the inventory at entityDie): every marked slot is blanked into pending', () => {
    const player = makePlayer('two-in-the-bag');
    const a = marked(player);
    const b = marked(player);
    player.container.setItem(3, a);
    player.container.setItem(20, b);

    die(player);
    assert.strictEqual(player.container.getItem(3), undefined, 'the engine would drop the first copy');
    assert.strictEqual(player.container.getItem(20), undefined, 'the engine would drop the second copy');
    assert.deepStrictEqual(pendingIds(player), [idOf(a), idOf(b)]);

    respawn(player);
    assert.strictEqual(held(player, idOf(a)), 1);
    assert.strictEqual(held(player, idOf(b)), 1);
    assert.strictEqual(swordsCarried(player), 2);
  });

  await t.test('path A: a copy in the inventory and a copy in the off hand are both retained', () => {
    const player = makePlayer('bag-and-hand');
    const bag = marked(player);
    const hand = marked(player);
    player.container.setItem(5, bag);
    player.offhand = hand;

    die(player);
    assert.strictEqual(player.container.getItem(5), undefined);
    assert.strictEqual(player.offhand, undefined, 'the off-hand copy is left for the engine to drop');
    assert.deepStrictEqual(pendingIds(player), [idOf(bag), idOf(hand)]);

    respawn(player);
    assert.strictEqual(held(player, idOf(bag)), 1);
    assert.strictEqual(held(player, idOf(hand)), 1);
    assert.strictEqual(swordsCarried(player), 2);
  });

  await t.test('path B: copies dropped from the off hand and the inventory are both reclaimed', () => {
    dimension.ground = [];
    const player = makePlayer('spilled-hand');
    const bag = marked(player);
    const hand = marked(player);
    player.container.setItem(0, bag);
    player.offhand = hand;

    spill(player);
    die(player);
    tick();
    respawn(player);
    assert.strictEqual(held(player, idOf(bag)), 1);
    assert.strictEqual(held(player, idOf(hand)), 1);
    assert.strictEqual(swordsCarried(player), 2);
    assert.deepStrictEqual(owedIds(player), []);
  });

  await t.test('the same instance seen twice — a doubled entityDie and a stray drop — is pending once', () => {
    dimension.ground = [];
    const player = makePlayer('doubled');
    const sword = marked(player);
    player.container.setItem(0, sword);

    fire('entityDie', { deadEntity: player });
    drop(sword.clone());
    fire('entityDie', { deadEntity: player });
    player.health = 0;
    flush();
    assert.deepStrictEqual(pendingIds(player), [idOf(sword)]);

    respawn(player);
    assert.strictEqual(held(player, idOf(sword)), 1);
    assert.strictEqual(swordsCarried(player), 1);
  });

  await t.test('an unmarked copy next to two marked ones keeps vanilla behaviour', () => {
    dimension.ground = [];
    const player = makePlayer('with-a-plain-one');
    const plain = new mc.ItemStack(WEB_SWORD.itemId, 1);
    const a = marked(player);
    const b = marked(player);
    player.container.setItem(0, plain);
    player.container.setItem(1, a);
    player.container.setItem(2, b);

    const entities = spill(player);
    die(player);
    assert.strictEqual(entities[0].isValid, true, 'the unmarked copy was taken off the ground');
    assert.deepStrictEqual(pendingIds(player), [idOf(a), idOf(b)]);
  });

  await t.test('on respawn, a pending instance already carried is not issued again; the rest are', () => {
    const player = makePlayer('half-carried');
    const a = marked(player);
    const b = marked(player);
    player.container.setItem(0, a);
    player.container.setItem(1, b);
    die(player);
    player.container.setItem(9, a);

    respawn(player);
    assert.strictEqual(held(player, idOf(a)), 1, 'the carried instance got a second copy');
    assert.strictEqual(held(player, idOf(b)), 1);
    assert.deepStrictEqual(player.messages, [RETURNED]);
    assert.strictEqual(player.getDynamicProperty(PENDING_KEY), undefined);
  });

  await t.test('on respawn, a stale pending entry is dropped without a copy and a live one is returned', () => {
    const player = makePlayer('one-stale');
    const stale = marked(player);
    const live = marked(player);
    player.container.setItem(0, stale);
    player.container.setItem(1, live);
    die(player);
    lg.bumpGen(WEB_SWORD, idOf(stale));

    respawn(player);
    assert.strictEqual(held(player, idOf(stale)), 0, 'a superseded generation was handed back');
    assert.strictEqual(held(player, idOf(live)), 1);
    assert.strictEqual(player.getDynamicProperty(PENDING_KEY), undefined);
  });

  await t.test('pending waits while the player is dead, and is paid on the spawn after', () => {
    const player = makePlayer('still-dead');
    const a = marked(player);
    const b = marked(player);
    player.container.setItem(0, a);
    player.container.setItem(1, b);
    die(player);

    fire('playerSpawn', { player, initialSpawn: false });
    flush();
    assert.strictEqual(swordsCarried(player), 0, 'a dead player was handed an item');
    assert.deepStrictEqual(pendingIds(player), [idOf(a), idOf(b)]);

    respawn(player);
    assert.strictEqual(swordsCarried(player), 2);
  });
});

test('AC2: a pending value from before lists reads as a list of one', async (t) => {
  const legacyMark = { origin: 'craft', owner: '-900', id: 'legacy-pending-1', ownerName: 'Alex' };
  const legacy = JSON.stringify(legacyMark);

  await t.test('readPending: one serialized mark -> a one-element list at gen 0', () => {
    const player = makePlayer('reader');
    player.setDynamicProperty(PENDING_KEY, legacy);
    assert.deepStrictEqual(lg.readPending(WEB_SWORD, player), [{ ...legacyMark, gen: 0 }]);
  });

  await t.test('parsePending keeps what it can read and drops the rest', () => {
    const ok = { origin: 'admin', owner: '-1', id: 'ok', gen: 2 };
    assert.deepStrictEqual(lg.parsePending(JSON.stringify([ok, { origin: 'nope' }, 5, null])), [ok]);
    assert.deepStrictEqual(lg.parsePending(JSON.stringify(ok)), [ok]);
    for (const raw of [undefined, 7, '', 'not json', 'null', '"a string"', '[]', '{"id":"x"}']) {
      assert.deepStrictEqual(lg.parsePending(raw), [], String(raw));
    }
  });

  await t.test('a legacy value left in a world is handed back on respawn, once, and cleared', () => {
    const player = makePlayer('legacy-owner');
    player.setDynamicProperty(PENDING_KEY, legacy);

    respawn(player);
    assert.strictEqual(held(player, legacyMark.id), 1);
    assert.deepStrictEqual(lg.getMark(WEB_SWORD, player.container.getItem(0)), { ...legacyMark, gen: 0 });
    assert.strictEqual(player.getDynamicProperty(PENDING_KEY), undefined);

    respawn(player);
    assert.strictEqual(held(player, legacyMark.id), 1, 'the legacy token was paid twice');
  });

  await t.test('a death on top of a legacy value appends to it; both come back', () => {
    const player = makePlayer('legacy-and-new');
    player.setDynamicProperty(PENDING_KEY, legacy);
    const fresh = marked(player);
    player.container.setItem(0, fresh);

    die(player);
    assert.deepStrictEqual(pendingIds(player), [legacyMark.id, idOf(fresh)], 'the death overwrote the legacy token');

    respawn(player);
    assert.strictEqual(held(player, legacyMark.id), 1);
    assert.strictEqual(held(player, idOf(fresh)), 1);
    assert.strictEqual(swordsCarried(player), 2);
  });

  await t.test('path B on top of a legacy value appends to it as well', () => {
    dimension.ground = [];
    const player = makePlayer('legacy-and-spilled');
    player.setDynamicProperty(PENDING_KEY, legacy);
    const fresh = marked(player);
    player.container.setItem(0, fresh);

    spill(player);
    die(player);
    assert.deepStrictEqual(pendingIds(player), [legacyMark.id, idOf(fresh)]);
  });

  await t.test('the key is unchanged and a new write is a JSON list', () => {
    const player = makePlayer('writer');
    const sword = marked(player);
    player.container.setItem(0, sword);
    die(player);
    const raw = player.getDynamicProperty(PENDING_KEY);
    assert.strictEqual(lg.keysFor(WEB_SWORD).pending, PENDING_KEY);
    assert.ok(Array.isArray(JSON.parse(raw)), `pending is stored as ${raw}`);
  });
});
