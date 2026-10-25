// The §4 hook, option a′ (src/enchanting/hook.ts, hook-rules.ts): the two signals the engine leaves are paired into a
// table generation, and at most ONE treasure enchantment is added on top — never a removal, never a level change.
//
// Both halves are covered: the decisions as pure functions, and the engine half against a stand-in @minecraft/server
// that reproduces the measured behaviour, `canAddEnchantment` **throwing** on a vanilla conflict rather than
// returning false (ubow probe). A hook without the try/catch fails here, in node, not on a server.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asModule = (text) => import('data:text/javascript;base64,' + Buffer.from(text, 'utf-8').toString('base64'));

const pure = await asModule(
  (await build({ entryPoints: [join(root, 'src', 'enchanting', 'hook-rules.ts')], bundle: true, format: 'esm', platform: 'neutral', write: false, external: ['@minecraft/*'] }))
    .outputFiles[0].text
);
const { MATCH_WINDOW_TICKS, additionFor, pairArrival, tierFromDrop } = pure;

// ------------------------------------------------------------------ the decisions

test('an arrival pairs with a drop inside the window, on either side of it', () => {
  const arrivals = [{ slot: 1, tick: 100 }];
  assert.deepEqual(pairArrival(arrivals, 100), arrivals[0]);
  assert.deepEqual(pairArrival(arrivals, 100 + MATCH_WINDOW_TICKS), arrivals[0]);
  // The drop is only ever noticed at the next poll, so the arrival can be on the later side too.
  assert.deepEqual(pairArrival(arrivals, 100 - MATCH_WINDOW_TICKS), arrivals[0]);
  assert.equal(pairArrival(arrivals, 100 + MATCH_WINDOW_TICKS + 1), undefined);
  assert.equal(pairArrival([], 100), undefined);
});

test('the nearest arrival to the drop wins', () => {
  const arrivals = [{ slot: 1, tick: 90 }, { slot: 2, tick: 108 }, { slot: 3, tick: 60 }];
  assert.equal(pairArrival(arrivals, 105).slot, 2);
  assert.equal(pairArrival(arrivals, 88).slot, 1);
});

test('only a 1, 2 or 3 level cost is a table offer', () => {
  assert.deepEqual([1, 2, 3].map(tierFromDrop), [1, 2, 3]);
  // An anvil combine costs up to 39 levels; nothing is added for a cost no table charges.
  for (const drop of [0, 4, 7, 39, -1]) assert.equal(tierFromDrop(drop), undefined, `drop ${drop}`);
});

test('nothing is added on a rare miss, on an ineligible item, or when the stack already carries the treasure', () => {
  const hit = { enchantments: [{ id: 'mending', level: 1 }, { id: 'efficiency', level: 3 }], eligible: true, rareStage: 'hit', trace: [] };
  assert.deepEqual(additionFor(hit, new Set()), { id: 'mending', level: 1 });
  assert.equal(additionFor(hit, new Set(['mending'])), undefined, 'raising a level means removing the one that was there');
  assert.equal(additionFor({ ...hit, rareStage: 'miss' }, new Set()), undefined);
  assert.equal(additionFor({ ...hit, rareStage: 'none' }, new Set()), undefined);
  assert.equal(additionFor({ ...hit, eligible: false }, new Set()), undefined);
  // Only treasure is ever added: an ordinary enchantment in the roll is not a′'s business.
  assert.equal(additionFor({ ...hit, enchantments: [{ id: 'efficiency', level: 5 }] }, new Set()), undefined);
});

// ------------------------------------------------------------------ the engine half, on a stand-in

const stubPlugin = {
  name: 'mc-stub',
  setup(b) {
    b.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: 'stub', namespace: 'mc-stub' }));
    b.onLoad({ filter: /.*/, namespace: 'mc-stub' }, () => ({
      loader: 'js',
      contents: `
        const H = (globalThis.__ench = { tick: 1000, interval: undefined, players: [], inv: undefined, interact: undefined });
        /** Measured on BDS: canAddEnchantment throws on a vanilla conflict instead of returning false. */
        const CONFLICTS = [['depth_strider', 'frost_walker'], ['mending', 'infinity'], ['protection', 'blast_protection']];
        export class EnchantmentType { constructor(id) { this.id = id; } }
        export class ItemStack {
          constructor(typeId, amount = 1) { this.typeId = typeId; this.amount = amount; this.dp = new Map(); this.enchants = []; }
          clone() { const c = Object.create(ItemStack.prototype); Object.assign(c, this, { dp: new Map(this.dp), enchants: this.enchants.map((e) => ({ ...e })) }); return c; }
          setDynamicProperty(k, v) { this.dp.set(k, v); }
          getDynamicProperty(k) { return this.dp.get(k); }
          getComponent(id) {
            if (id !== 'minecraft:enchantable') return undefined;
            const self = this;
            return {
              getEnchantments: () => self.enchants.map((e) => ({ type: { id: e.id }, level: e.level })),
              getEnchantment: (id) => self.enchants.find((e) => e.id === id),
              canAddEnchantment: (e) => {
                const id = e.type.id;
                if (self.enchants.some((x) => CONFLICTS.some((g) => g.includes(id) && g.includes(x.id) && x.id !== id))) {
                  throw new Error('conflicting enchantment');
                }
                return !self.enchants.some((x) => x.id === id);
              },
              addEnchantment: (e) => { self.enchants.push({ id: e.type.id, level: e.level }); },
              removeEnchantment: (id) => { self.enchants = self.enchants.filter((e) => e.id !== id); },
            };
          }
        }
        export const world = {
          getAllPlayers: () => H.players,
          afterEvents: {
            playerInventoryItemChange: { subscribe(cb) { H.inv = cb; return cb; }, unsubscribe() { H.inv = undefined; } },
            playerInteractWithBlock: { subscribe(cb) { H.interact = cb; return cb; }, unsubscribe() { H.interact = undefined; } },
          },
        };
        export const system = {
          get currentTick() { return H.tick; },
          runInterval(cb, t) { H.interval = [cb, t]; return 1; },
          clearRun() { H.interval = undefined; },
        };
      `,
    }));
  },
};

const engine = await asModule(
  (await build({
    stdin: { contents: "export * from './src/enchanting/hook.ts'; export { ItemStack } from '@minecraft/server';", resolveDir: root, loader: 'ts' },
    bundle: true, format: 'esm', platform: 'neutral', write: false, plugins: [stubPlugin],
  })).outputFiles[0].text
);
const { ItemStack, enchStats, registerEnchantAdd } = engine;
const H = globalThis.__ench;

const mulberry32 = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

function fakePlayer(name, level = 30) {
  const items = new Array(36).fill(undefined);
  const container = { size: 36, getItem: (i) => items[i]?.clone(), setItem: (i, s) => { items[i] = s?.clone(); } };
  return { name, id: `id-${name}`, isValid: true, level, items, getComponent: (id) => (id === 'minecraft:inventory' ? { container } : undefined) };
}

function enchanted(typeId, pairs) {
  const stack = new ItemStack(typeId, 1);
  for (const [id, level] of pairs) stack.enchants.push({ id, level });
  return stack;
}

const poll = () => H.interval[0]();
/** One table generation: the stack comes back, the levels go, the next poll notices. */
function generate(player, slot, stack, cost = 2) {
  player.items[slot] = stack;
  H.inv({ player, slot, itemStack: stack.clone(), beforeItemStack: undefined });
  player.level -= cost;
  H.tick += 3;
  poll();
  return player.items[slot];
}
const ids = (stack) => stack.enchants.map((e) => e.id).sort();
const levelOf = (stack, id) => stack.enchants.find((e) => e.id === id)?.level;

function arm(seed) {
  for (const k of Object.keys(enchStats)) enchStats[k] = 0;
  H.players = [];
  const stop = registerEnchantAdd({ rng: mulberry32(seed) });
  return stop;
}

test('a generation adds one treasure on top, and every enchantment the table gave survives untouched', () => {
  const stop = arm(0x5eed0412);
  try {
    let added;
    // The 20 % is a roll: walk fresh generations until one hits, each on its own player so no mark carries over.
    for (let i = 0; i < 200 && added === undefined; i++) {
      const player = fakePlayer(`p${i}`);
      H.players = [player];
      const after = generate(player, 0, enchanted('minecraft:diamond_pickaxe', [['efficiency', 4], ['unbreaking', 2]]), 3);
      if (after.enchants.length > 2) added = after;
      assert.equal(levelOf(after, 'efficiency'), 4, 'an existing level was changed');
      assert.equal(levelOf(after, 'unbreaking'), 2, 'an existing level was changed');
      assert.ok(after.enchants.some((e) => e.id === 'efficiency') && after.enchants.some((e) => e.id === 'unbreaking'), 'an existing enchantment was removed');
    }
    assert.ok(added !== undefined, 'no treasure in 200 generations');
    const extra = added.enchants.filter((e) => e.id !== 'efficiency' && e.id !== 'unbreaking');
    assert.equal(extra.length, 1, `exactly one addition, got ${extra.map((e) => e.id).join(',')}`);
    assert.ok(['mending', 'frost_walker', 'soul_speed', 'swift_sneak', 'wind_burst'].includes(extra[0].id), `${extra[0].id} is not treasure`);
    assert.equal(enchStats.added, 1);
  } finally {
    stop();
  }
});

test('the same stack is not processed twice, however it moves', () => {
  const stop = arm(0x5eed0412);
  try {
    const player = fakePlayer('twice');
    H.players = [player];
    const after = generate(player, 0, enchanted('minecraft:diamond_pickaxe', [['efficiency', 1]]), 2);
    const firstRun = { ...enchStats };
    // Moved and another level drop: the mark is on the stack, so the generation does not come round again.
    generate(player, 0, after, 2);
    assert.equal(enchStats.generations, firstRun.generations, 'a marked stack was counted as a second generation');
    assert.deepEqual(ids(player.items[0]), ids(after));
  } finally {
    stop();
  }
});

test('negative controls: an arrival alone, a drop alone, and a cost no table charges all do nothing', () => {
  const stop = arm(0x5eed0412);
  try {
    const player = fakePlayer('neg');
    H.players = [player];
    poll();

    // 1. the stack arrives, no levels go
    const quiet = enchanted('minecraft:diamond_sword', [['sharpness', 3]]);
    player.items[0] = quiet;
    H.inv({ player, slot: 0, itemStack: quiet.clone() });
    H.tick += 3;
    poll();
    assert.equal(enchStats.generations, 0, 'an arrival without a level drop was taken for a generation');

    // 2. the levels go with the only arrival already outside the window
    H.tick += MATCH_WINDOW_TICKS + 10;
    poll();
    player.level -= 2;
    H.tick += 3;
    poll();
    assert.equal(enchStats.generations, 0, 'a drop paired with an arrival outside the window');

    // 3. an anvil-sized cost with an arrival in the window
    const anvil = enchanted('minecraft:diamond_pickaxe', [['efficiency', 2]]);
    player.items[1] = anvil;
    H.inv({ player, slot: 1, itemStack: anvil.clone() });
    player.level -= 9;
    H.tick += 3;
    poll();
    assert.equal(enchStats.generations, 0, 'a 9-level cost was taken for a table offer');
    assert.deepEqual(ids(player.items[1]), ['efficiency']);
  } finally {
    stop();
  }
});

test('an engine refusal is caught, counted, and costs the stack nothing', () => {
  const stop = arm(0x5eed0412);
  try {
    let refused = false;
    for (let i = 0; i < 400 && !refused; i++) {
      const player = fakePlayer(`boots${i}`);
      H.players = [player];
      // depth_strider conflicts with frost_walker, and the stand-in throws exactly as the engine does.
      const after = generate(player, 0, enchanted('minecraft:diamond_boots', [['depth_strider', 3]]), 3);
      assert.equal(levelOf(after, 'depth_strider'), 3, 'the conflicting pair cost the stack its own enchantment');
      assert.ok(!after.enchants.some((e) => e.id === 'frost_walker'), 'a conflicting enchantment was added anyway');
      refused = enchStats.refusedByEngine > 0;
    }
    assert.ok(refused, 'frost_walker never came up in 400 generations on boots with Depth Strider');
    assert.equal(enchStats.errors, 0, 'the throw escaped the hook');
  } finally {
    stop();
  }
});

// The limitation, as a test rather than a sentence: there is no separator between the table and anything else that
// takes levels (probe §4), so an enchanted stack arriving within two seconds of ANY level cost of 1-3 is read as a
// generation — an anvil combine among them. It can only gain: the assertions above hold that nothing is ever removed.
test('a non-table level cost beside an arrival is read as a generation, and that is the named limitation', () => {
  const stop = arm(0x5eed0412);
  try {
    const player = fakePlayer('anvil');
    H.players = [player];
    poll();
    const combined = enchanted('minecraft:diamond_pickaxe', [['efficiency', 4], ['mending', 1]]);
    player.items[0] = combined;
    H.inv({ player, slot: 0, itemStack: combined.clone() });
    player.level -= 3;
    H.tick += 3;
    poll();
    assert.equal(enchStats.generations, 1, 'the pairing window is what it is — see docs/feedback/probe-enchanting.md §4');
    const after = player.items[0];
    assert.equal(levelOf(after, 'efficiency'), 4, 'the anvil result lost a level');
    assert.equal(levelOf(after, 'mending'), 1, 'the hand-combined Mending book was touched');
  } finally {
    stop();
  }
});

// ------------------------------------------------------------------ the statistics of what reaches the player

const band = (n, p, k) => {
  const spread = k * Math.sqrt(n * p * (1 - p));
  return [Math.floor(n * p - spread), Math.ceil(n * p + spread)];
};
const CURSES = ['binding', 'vanishing'];

for (const [label, seed, k] of [['fixed seed', 0x5eed0412, 3], [`fresh seed`, Math.floor(Math.random() * 2 ** 32), 5]]) {
  test(`treasure reaches the player in ≈ 20 % of 1000 generations, curses never (${label})`, () => {
    const stop = arm(seed);
    try {
      const n = 1000;
      let withTreasure = 0;
      for (let i = 0; i < n; i++) {
        const player = fakePlayer(`s${i}`);
        H.players = [player];
        const after = generate(player, 0, enchanted('minecraft:diamond_pickaxe', [['efficiency', 1]]), 3);
        const extra = after.enchants.filter((e) => e.id !== 'efficiency');
        if (extra.length > 0) withTreasure += 1;
        for (const curse of CURSES) assert.ok(!extra.some((e) => e.id === curse), `${curse} was added`);
        assert.equal(levelOf(after, 'efficiency'), 1, 'the existing enchantment was touched');
      }
      const [lo, hi] = band(n, 0.2, k);
      assert.ok(withTreasure >= lo && withTreasure <= hi, `${withTreasure} of ${n} got treasure, expected [${lo}, ${hi}] (±${k}σ)`);
    } finally {
      stop();
    }
  });

  test(`a legendary's forbidden enchantments are never added (${label})`, () => {
    const stop = arm(seed);
    try {
      for (let i = 0; i < 300; i++) {
        const player = fakePlayer(`t${i}`);
        H.players = [player];
        const after = generate(player, 0, enchanted('andrew:above_water_trident', [['impaling', 2]]), 3);
        for (const id of ['loyalty', 'riptide']) {
          assert.ok(!after.enchants.some((e) => e.id === id), `${id} was added to the trident, which never keeps it`);
        }
        assert.equal(levelOf(after, 'impaling'), 2);
      }
    } finally {
      stop();
    }
  });
}
