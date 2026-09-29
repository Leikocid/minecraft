// The one-per-world craft gate (src/legendary/craftgate.ts) driven off the
// engine: the real module, bundled against a small in-memory stand-in for the
// @minecraft/server surfaces it touches — one inventory event, system.run, the
// world's dynamic properties, chat. The stand-in fires the inventory event for
// every write, including the gate's own, so a gate that re-triggers itself
// shows up as a settle that never ends.
//
// What the stand-in cannot prove — that the engine really raises the event for
// a /give and for a recipe's output — is proven on BDS by
// src/gametest/legendary-craftgate.ts.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const ENGINE = `
const engine = {
  listeners: [],
  events: [],
  jobs: [],
  props: new Map(),
  broadcasts: [],
  ticks: 0,
};

export class ItemStack {
  constructor(typeId, amount = 1) {
    this.typeId = typeId;
    this.amount = amount;
    this.props = new Map();
  }
  getDynamicProperty(key) {
    return this.props.get(key);
  }
  setDynamicProperty(key, value) {
    if (value === undefined) this.props.delete(key);
    else this.props.set(key, value);
  }
  clone() {
    const copy = new ItemStack(this.typeId, this.amount);
    copy.props = new Map(this.props);
    return copy;
  }
}

class Container {
  constructor(owner) {
    this.owner = owner;
    this.size = 36;
    this.slots = new Array(36).fill(undefined);
  }
  getItem(slot) {
    return this.slots[slot]?.clone();
  }
  setItem(slot, stack) {
    const before = this.slots[slot];
    this.slots[slot] = stack?.clone();
    engine.events.push({ player: this.owner, slot, beforeItemStack: before, itemStack: stack?.clone(), inventoryType: 'Inventory' });
  }
  addItem(stack) {
    // Every andrew:* item, token or weapon, has max_stack_size 1.
    const max = stack.typeId.startsWith('andrew:') ? 1 : 64;
    let slot = this.slots.findIndex(
      (s) => s !== undefined && s.typeId === stack.typeId && s.props.size === 0 && stack.props.size === 0 && s.amount + stack.amount <= max
    );
    if (slot >= 0) {
      const merged = this.slots[slot].clone();
      merged.amount += stack.amount;
      this.setItem(slot, merged);
      return undefined;
    }
    slot = this.slots.findIndex((s) => s === undefined);
    if (slot < 0) return stack;
    this.setItem(slot, stack);
    return undefined;
  }
}

class Player {
  constructor(name, gameMode) {
    this.id = 'id-' + name;
    this.name = name;
    this.gameMode = gameMode;
    this.isValid = true;
    this.location = { x: 0, y: 0, z: 0 };
    this.messages = [];
    this.dropped = [];
    this.container = new Container(this);
    this.dimension = { spawnItem: (stack) => this.dropped.push(stack) };
  }
  getGameMode() {
    return this.gameMode;
  }
  getComponent(id) {
    return id === 'minecraft:inventory' ? { container: this.container } : undefined;
  }
  sendMessage(message) {
    this.messages.push(message);
  }
}

export const system = {
  run(fn) {
    engine.jobs.push(fn);
  },
};

export const world = {
  afterEvents: {
    playerInventoryItemChange: {
      subscribe(listener) {
        engine.listeners.push(listener);
        return listener;
      },
    },
  },
  getDynamicProperty: (key) => engine.props.get(key),
  setDynamicProperty(key, value) {
    if (value === undefined) engine.props.delete(key);
    else engine.props.set(key, value);
  },
  getAbsoluteTime: () => engine.ticks,
  sendMessage(message) {
    engine.broadcasts.push(message);
  },
};

export const __engine = {
  reset() {
    engine.events.length = 0;
    engine.jobs.length = 0;
    engine.props.clear();
    engine.broadcasts.length = 0;
  },
  player: (name, gameMode = 'Survival') => new Player(name, gameMode),
  broadcasts: () => [...engine.broadcasts],
  prop: (key) => engine.props.get(key),
  /** After-events first, then the jobs system.run queued — one tick at a time, until quiet. */
  settle() {
    for (let tick = 0; tick < 20; tick++) {
      if (engine.events.length === 0 && engine.jobs.length === 0) return tick;
      engine.ticks++;
      const events = engine.events.splice(0);
      for (const event of events) for (const listener of engine.listeners) listener(event);
      const jobs = engine.jobs.splice(0);
      for (const job of jobs) job();
    }
    throw new Error('the gate did not settle within 20 ticks — it keeps re-triggering itself');
  },
};
`;

const engineStub = {
  name: 'minecraft-server-engine',
  setup(pluginBuild) {
    pluginBuild.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: '@minecraft/server', namespace: 'mc-engine' }));
    pluginBuild.onLoad({ filter: /.*/, namespace: 'mc-engine' }, () => ({ contents: ENGINE, loader: 'js' }));
  },
};

const bundle = await build({
  stdin: {
    contents: [
      "export { registerCraftGate } from './src/legendary/craftgate.ts';",
      "export * from './src/legendary/registry.ts';",
      "export * from './src/legendary/rules.ts';",
      "export { __engine, ItemStack } from '@minecraft/server';",
    ].join('\n'),
    resolveDir: projectRoot,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  plugins: [engineStub],
});

const gate = await import(
  'data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64')
);
const { __engine: engine, ItemStack, LEGENDARIES, WEB_SWORD, SCYTHE_OF_CALAMITY, keysFor, tokenDecision } = gate;

const warn = console.warn;
console.warn = () => {};
gate.registerCraftGate();
console.warn = warn;

// ------------------------------------------------------------------ helpers

const crafted = (def) => engine.prop(keysFor(def).crafted) === true;

function stacks(player) {
  return player.container.slots.filter((s) => s !== undefined);
}

function count(player, typeId) {
  return stacks(player)
    .filter((s) => s.typeId === typeId)
    .reduce((n, s) => n + s.amount, 0);
}

function origins(player, def) {
  return stacks(player)
    .filter((s) => s.typeId === def.itemId)
    .map((s) => s.getDynamicProperty(keysFor(def).origin) ?? 'none')
    .sort();
}

function refunded(player, def) {
  return def.refund.map(([id]) => count(player, id)).reduce((a, b) => a + b, 0);
}

/** What a vanilla /give, a Creative teammate's copy or a pickup puts in the inventory. */
function giveWeapon(player, def) {
  player.container.addItem(new ItemStack(def.itemId, 1));
}

/** What the recipe puts in the inventory. */
function craft(player, def) {
  player.container.addItem(new ItemStack(def.craftTokenId, 1));
}

function quietly(fn) {
  const saved = console.warn;
  console.warn = () => {};
  try {
    return fn();
  } finally {
    console.warn = saved;
  }
}

const settle = () => quietly(() => engine.settle());

const GATED = [WEB_SWORD, SCYTHE_OF_CALAMITY];

// ------------------------------------------------------------------ AC-1

test('a /give copy in Survival does not spend the world craft', async (t) => {
  for (const def of GATED) {
    await t.test(`${def.itemId}: flag unset → stays unset, the copy is kept as given`, () => {
      engine.reset();
      const player = engine.player('giver');
      giveWeapon(player, def);
      settle();

      assert.equal(crafted(def), false, `a /give of ${def.itemId} spent the world craft`);
      assert.deepEqual(origins(player, def), ['none'], 'the /give copy was marked, taken or duplicated');
      assert.equal(refunded(player, def), 0, 'ingredients were handed out for a /give');
      assert.deepEqual(engine.broadcasts(), [], 'a /give was announced as a first craft');
      assert.deepEqual(player.messages, []);
    });

    await t.test(`${def.itemId}: flag already spent → the copy is kept, not refunded`, () => {
      engine.reset();
      const player = engine.player('late');
      craft(engine.player('crafter'), def);
      settle();
      assert.equal(crafted(def), true, 'the craft that should have spent the flag did not');

      giveWeapon(player, def);
      settle();
      assert.deepEqual(origins(player, def), ['none'], 'the /give copy was confiscated after the real craft');
      assert.equal(refunded(player, def), 0, 'a /give copy was swapped for ingredients');
      assert.deepEqual(player.messages, []);
    });
  }

  await t.test('several /give copies to several Survival players: flag stays unset', () => {
    engine.reset();
    const a = engine.player('a');
    const b = engine.player('b');
    giveWeapon(a, WEB_SWORD);
    giveWeapon(a, WEB_SWORD);
    giveWeapon(b, WEB_SWORD);
    settle();
    assert.equal(crafted(WEB_SWORD), false);
    assert.equal(count(a, WEB_SWORD.itemId) + count(b, WEB_SWORD.itemId), 3);
  });
});

// ------------------------------------------------------------------ AC-2

test('a real craft still spends the world craft exactly once', async (t) => {
  for (const def of GATED) {
    await t.test(`${def.itemId}: the first Survival craft claims, marks and announces once`, () => {
      engine.reset();
      const player = engine.player('smith');
      craft(player, def);
      settle();

      assert.equal(crafted(def), true, 'the craft did not spend the world craft');
      assert.equal(engine.prop(keysFor(def).craftedBy), 'smith');
      assert.equal(count(player, def.craftTokenId), 0, 'the craft token stayed in the inventory');
      assert.deepEqual(origins(player, def), ['craft'], 'expected exactly one weapon, marked origin "craft"');
      const weapon = stacks(player).find((s) => s.typeId === def.itemId);
      assert.equal(weapon.getDynamicProperty(keysFor(def).owner), player.id);
      assert.equal(engine.broadcasts().length, 1, 'the first craft must be announced exactly once');
      assert.equal(refunded(player, def), 0);
    });

    await t.test(`${def.itemId}: every later craft is refunded and the flag is not claimed again`, () => {
      engine.reset();
      const first = engine.player('first');
      const second = engine.player('second');
      craft(first, def);
      settle();
      craft(second, def);
      settle();
      craft(first, def);
      settle();

      assert.equal(crafted(def), true);
      assert.equal(engine.prop(keysFor(def).craftedBy), 'first', 'a later craft re-claimed the flag');
      assert.equal(engine.broadcasts().length, 1, 'a refunded craft was announced');
      assert.deepEqual(origins(first, def), ['craft'], 'the first crafter must hold exactly the one crafted weapon');
      assert.deepEqual(origins(second, def), [], 'the refunded crafter kept a weapon');
      for (const player of [first, second]) {
        assert.equal(count(player, def.craftTokenId), 0, 'a craft token stayed in an inventory');
      }
      for (const [id, n] of def.refund) {
        assert.equal(count(second, id), n, `the refunded crafter got ${count(second, id)} ${id}, expected ${n}`);
        assert.equal(count(first, id), n, `the first crafter's second attempt returned ${count(first, id)} ${id}, expected ${n}`);
      }
      assert.deepEqual(second.messages, [{ translate: `${def.textPrefix}.craft_blocked` }]);
    });
  }

  await t.test('a /give first, then the real craft: the craft claims and nothing is refunded', () => {
    engine.reset();
    const tester = engine.player('tester');
    const crafter = engine.player('crafter');
    giveWeapon(tester, WEB_SWORD);
    settle();
    craft(crafter, WEB_SWORD);
    settle();

    assert.equal(crafted(WEB_SWORD), true);
    assert.equal(engine.prop(keysFor(WEB_SWORD).craftedBy), 'crafter');
    assert.deepEqual(origins(tester, WEB_SWORD), ['none']);
    assert.deepEqual(origins(crafter, WEB_SWORD), ['craft']);
    assert.equal(refunded(crafter, WEB_SWORD), 0, 'the real craft was refunded after a /give');
    assert.deepEqual(crafter.messages, []);
  });

  await t.test('the same player: /give, then craft — both kept, only the crafted one marked', () => {
    engine.reset();
    const player = engine.player('solo');
    giveWeapon(player, SCYTHE_OF_CALAMITY);
    settle();
    craft(player, SCYTHE_OF_CALAMITY);
    settle();
    assert.equal(crafted(SCYTHE_OF_CALAMITY), true);
    assert.deepEqual(origins(player, SCYTHE_OF_CALAMITY), ['craft', 'none']);
    assert.equal(refunded(player, SCYTHE_OF_CALAMITY), 0);
  });

  await t.test('two players craft on the same tick: exactly one claims, the other is refunded', () => {
    engine.reset();
    const a = engine.player('a');
    const b = engine.player('b');
    craft(a, WEB_SWORD);
    craft(b, WEB_SWORD);
    settle();

    assert.equal(crafted(WEB_SWORD), true);
    assert.equal(engine.broadcasts().length, 1);
    const kept = [a, b].map((p) => origins(p, WEB_SWORD).length);
    assert.deepEqual(kept.sort(), [0, 1], 'exactly one of the two must hold the weapon');
  });

  await t.test('two tokens in one inventory (bulk craft): one claim, one refund', () => {
    engine.reset();
    const player = engine.player('bulk');
    craft(player, WEB_SWORD);
    craft(player, WEB_SWORD);
    settle();

    assert.deepEqual(origins(player, WEB_SWORD), ['craft']);
    assert.equal(count(player, WEB_SWORD.craftTokenId), 0);
    assert.equal(count(player, 'minecraft:web'), 4);
    assert.equal(count(player, 'minecraft:diamond_sword'), 1);
    assert.equal(engine.broadcasts().length, 1);
  });

  await t.test('budgets are per weapon: the Web Sword craft leaves the Scythe craft open', () => {
    engine.reset();
    const player = engine.player('both');
    craft(player, WEB_SWORD);
    settle();
    assert.equal(crafted(SCYTHE_OF_CALAMITY), false);
    craft(player, SCYTHE_OF_CALAMITY);
    settle();
    assert.equal(crafted(SCYTHE_OF_CALAMITY), true);
    assert.equal(engine.broadcasts().length, 2);
  });
});

test('Creative and Spectator crafts yield an ordinary copy and leave the flag alone', async (t) => {
  for (const gameMode of ['Creative', 'Spectator']) {
    await t.test(gameMode, () => {
      engine.reset();
      const player = engine.player('builder', gameMode);
      craft(player, WEB_SWORD);
      settle();

      assert.equal(crafted(WEB_SWORD), false);
      assert.equal(count(player, WEB_SWORD.craftTokenId), 0, 'the token was left in a Creative inventory');
      assert.deepEqual(origins(player, WEB_SWORD), ['none']);
      assert.deepEqual(engine.broadcasts(), []);
    });
  }
});

// ------------------------------------------------------------------ the pure rule

test('tokenDecision', async (t) => {
  for (const gameMode of ['Survival', 'Adventure']) {
    await t.test(`${gameMode}: claim while the flag is unset, refund after`, () => {
      assert.equal(tokenDecision(false, gameMode), 'claim');
      assert.equal(tokenDecision(true, gameMode), 'refund');
    });
  }
  for (const gameMode of ['Creative', 'Spectator']) {
    await t.test(`${gameMode}: unwrap whatever the flag`, () => {
      assert.equal(tokenDecision(false, gameMode), 'unwrap');
      assert.equal(tokenDecision(true, gameMode), 'unwrap');
    });
  }
});

// ------------------------------------------------------------------ the packs agree with the registry

function readPack(...parts) {
  return JSON.parse(readFileSync(join(projectRoot, 'packs', 'behavior', ...parts), 'utf-8'));
}

test('each gated weapon has a craft token, and its recipe outputs the token', async (t) => {
  for (const def of LEGENDARIES.filter((d) => d.craftGate)) {
    const name = def.itemId.split(':')[1];

    await t.test(`${def.itemId}: token id is distinct from every weapon id`, () => {
      assert.equal(def.craftTokenId, `${def.itemId}_crafted`);
      assert.ok(!LEGENDARIES.some((d) => d.itemId === def.craftTokenId));
    });

    await t.test(`${def.itemId}: recipe result is exactly one token`, () => {
      const result = readPack('recipes', `${name}.json`)['minecraft:recipe_shaped'].result;
      assert.equal(result.item, def.craftTokenId);
      assert.equal(result.count ?? 1, 1);
    });

    await t.test(`${def.itemId}: token looks like the weapon and is hidden from Creative`, () => {
      const weapon = readPack('items', `${name}.json`)['minecraft:item'];
      const token = readPack('items', `${name}_crafted.json`)['minecraft:item'];
      assert.equal(token.description.identifier, def.craftTokenId);
      assert.equal(token.description.menu_category?.category, 'none');
      assert.equal(token.components['minecraft:icon'], weapon.components['minecraft:icon']);
      assert.deepEqual(token.components['minecraft:display_name'], weapon.components['minecraft:display_name']);
      assert.equal(token.components['minecraft:max_stack_size'], 1);
    });
  }
});
