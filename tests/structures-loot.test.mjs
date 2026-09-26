// Loot (src/structures/loot-table.ts, loot.ts): the 13-category weighted
// table against spec §3.1–§3.3 on large seeded samples, and the chest fill
// over a fake chest — an occupied chest and an insert that wrote nothing are
// errors, never a quiet success.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const bundle = await build({
  stdin: {
    contents: `
      export * from './src/structures/loot-table.ts';
      export * from './src/structures/loot.ts';`,
    resolveDir: projectRoot,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  external: ['@minecraft/server'],
  write: false,
});
const m = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64'));
const {
  CATEGORIES, ATTEMPTS_MIN, ATTEMPTS_MAX, MAX_LEVEL, EXCLUSIVE, ENCHANTS_FOR, drawCategory, rollChest, rollEnchants,
  seededRng, scatterSlots, Loot, LootError, CUSTOM_TABLE, CONTROL_TABLE, ANCIENT_CITY, vanillaCommand,
} = m;

const SAMPLE = 200_000;
/**
 * Per-category tolerance in standard errors. With 13 categories checked at
 * once, 5σ keeps a false alarm under ~1e-5 per run; one weight unit added to
 * gold (17 → 18) moves that row by ~7σ at 200k draws, so it still goes red.
 */
const SIGMAS = 5;

/** Worst |observed − expected| in σ units, per category id. */
function frequencyGaps(counts, weights, n) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  const gaps = {};
  for (const [id, w] of Object.entries(weights)) {
    const p = w / total;
    const sigma = Math.sqrt((p * (1 - p)) / n);
    gaps[id] = Math.abs((counts[id] ?? 0) / n - p) / sigma;
  }
  return gaps;
}

const weightsOf = (cats) => Object.fromEntries(cats.map((c) => [c.id, c.weight]));

function assertMatchesWeights(counts, weights, n) {
  const gaps = frequencyGaps(counts, weights, n);
  const bad = Object.entries(gaps).filter(([, g]) => g > SIGMAS);
  assert.deepEqual(bad, [], `categories off their weight by more than ${SIGMAS}σ: ${JSON.stringify(gaps)}`);
}

test('the table is spec §3.2: 13 categories with their weights and quantities', () => {
  assert.equal(CATEGORIES.length, 13);
  assert.deepEqual(weightsOf(CATEGORIES), {
    sticks: 45, logs: 24, iron_ingot: 32, copper_ingot: 30, gold_ingot: 17, diamond: 6, golden_apple: 7,
    armor_unenchanted: 15, armor_enchanted: 5, sword_unenchanted: 12, sword_enchanted: 4, axe_unenchanted: 12, axe_enchanted: 4,
  });
  const qty = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.qty.join('-')]));
  assert.equal(qty.sticks, '2-8');
  assert.equal(qty.logs, '2-6');
  assert.equal(qty.iron_ingot, '2-8');
  assert.equal(qty.copper_ingot, '3-10');
  assert.equal(qty.gold_ingot, '1-5');
  assert.equal(qty.diamond, '1-3');
  assert.equal(qty.golden_apple, '1-3');
  assert.equal([ATTEMPTS_MIN, ATTEMPTS_MAX].join('-'), '5-12');
});

test('drawCategory: frequencies over a large sample match the relative weights', () => {
  const rng = seededRng('weights');
  const counts = {};
  for (let i = 0; i < SAMPLE; i++) {
    const c = drawCategory(rng, CATEGORIES);
    counts[c.id] = (counts[c.id] ?? 0) + 1;
  }
  assertMatchesWeights(counts, weightsOf(CATEGORIES), SAMPLE);
});

test('the frequency check itself goes red on a table one weight unit off', () => {
  const skewed = CATEGORIES.map((c) => (c.id === 'gold_ingot' ? { ...c, weight: c.weight + 1 } : c));
  const rng = seededRng('weights');
  const counts = {};
  for (let i = 0; i < SAMPLE; i++) {
    const c = drawCategory(rng, skewed);
    counts[c.id] = (counts[c.id] ?? 0) + 1;
  }
  assert.throws(() => assertMatchesWeights(counts, weightsOf(CATEGORIES), SAMPLE), /off their weight/);
});

test('rollChest: 5–12 stacks, quantities in range, golden apple at most once, never enchanted', () => {
  const rng = seededRng('chests');
  const byId = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
  const attempts = new Map();
  const counts = {};
  let draws = 0;
  for (let i = 0; i < 40_000; i++) {
    const chest = rollChest(rng);
    attempts.set(chest.length, (attempts.get(chest.length) ?? 0) + 1);
    assert.ok(chest.length >= 5 && chest.length <= 12, `attempts ${chest.length}`);
    assert.ok(chest.filter((s) => s.category === 'golden_apple').length <= 1, 'two golden apples in one chest');
    for (const s of chest) {
      const [lo, hi] = byId[s.category].qty;
      assert.ok(s.amount >= lo && s.amount <= hi, `${s.category} amount ${s.amount}`);
      assert.notEqual(s.typeId, 'minecraft:enchanted_golden_apple');
      if (s.category !== 'golden_apple') {
        counts[s.category] = (counts[s.category] ?? 0) + 1;
        draws++;
      }
    }
  }
  assert.deepEqual([...attempts.keys()].sort((a, b) => a - b), [5, 6, 7, 8, 9, 10, 11, 12]);
  // Dropping the golden apple after its one success rescales every other row
  // equally, so their shares among themselves still follow the weights exactly.
  assertMatchesWeights(counts, weightsOf(CATEGORIES.filter((c) => c.id !== 'golden_apple')), draws);
});

test('gear: 80/20 iron/diamond, every armor slot, curse-free enchants within vanilla max', () => {
  const rng = seededRng('gear');
  let gear = 0;
  let diamond = 0;
  const slots = new Set();
  const repeats = { diamonds: 0, sameArmor: 0 };
  for (let i = 0; i < 40_000; i++) {
    const chest = rollChest(rng);
    if (chest.filter((s) => s.category === 'diamond').length > 1) repeats.diamonds++;
    const armor = chest.filter((s) => s.category.startsWith('armor')).map((s) => s.typeId);
    if (new Set(armor).size < armor.length) repeats.sameArmor++;
    for (const s of chest) {
      const m = /^minecraft:(iron|diamond)_(\w+)$/.exec(s.typeId);
      if (!/armor|sword|axe/.test(s.category)) {
        assert.equal(s.enchants.length, 0);
        continue;
      }
      assert.ok(m, `gear id ${s.typeId}`);
      gear++;
      if (m[1] === 'diamond') diamond++;
      if (s.category.startsWith('armor')) slots.add(m[2]);
      assert.equal(s.enchants.length > 0, s.category.endsWith('_enchanted'), `${s.category} enchants ${JSON.stringify(s.enchants)}`);
      for (const e of s.enchants) {
        assert.ok(ENCHANTS_FOR[m[2]].includes(e.id), `${e.id} on ${s.typeId}`);
        assert.ok(e.level >= 1 && e.level <= MAX_LEVEL[e.id], `${e.id} ${e.level}`);
        assert.ok(!/binding|vanishing/.test(e.id), `curse ${e.id}`);
      }
    }
  }
  const share = diamond / gear;
  const sigma = Math.sqrt((0.2 * 0.8) / gear);
  assert.ok(Math.abs(share - 0.2) < SIGMAS * sigma, `diamond share ${share} over ${gear} gear rolls`);
  assert.deepEqual([...slots].sort(), ['boots', 'chestplate', 'helmet', 'leggings']);
  assert.ok(repeats.diamonds > 0 && repeats.sameArmor > 0, `repeats allowed and seen: ${JSON.stringify(repeats)}`);
});

test('rollEnchants: never two from one exclusive set', () => {
  const rng = seededRng('ench');
  for (let i = 0; i < 20_000; i++) {
    for (const gear of Object.keys(ENCHANTS_FOR)) {
      const ids = rollEnchants(rng, gear).map((e) => e.id);
      assert.equal(new Set(ids).size, ids.length);
      for (const set of EXCLUSIVE) assert.ok(ids.filter((id) => set.includes(id)).length <= 1, `${gear}: ${ids}`);
    }
  }
});

test('seededRng and scatterSlots: same seed, same chest; distinct slots', () => {
  assert.deepEqual(rollChest(seededRng('a#0')), rollChest(seededRng('a#0')));
  assert.notDeepEqual(rollChest(seededRng('a#0')), rollChest(seededRng('a#1')));
  const slots = scatterSlots(seededRng('s'), 27, 12);
  assert.equal(new Set(slots).size, 12);
  assert.ok(slots.every((s) => s >= 0 && s < 27));
});

// ------------------------------------------------------------ fake chest

class FakeEnchantable {
  constructor() {
    this.list = [];
  }
  canAddEnchantment(e) {
    return !this.list.some((x) => x.type.id === e.type.id);
  }
  addEnchantment(e) {
    this.list.push(e);
  }
}
class FakeItemStack {
  constructor(typeId, amount = 1) {
    this.typeId = typeId;
    this.amount = amount;
    this.ench = new FakeEnchantable();
  }
  getComponent(id) {
    return id === 'minecraft:enchantable' ? this.ench : undefined;
  }
}
class FakeEnchantmentType {
  constructor(id) {
    this.id = id;
  }
}
const api = { ItemStack: FakeItemStack, EnchantmentType: FakeEnchantmentType };

function fakeWorld(onCommand = () => {}) {
  const slots = new Array(27).fill(undefined);
  const container = {
    size: 27,
    getItem: (i) => slots[i],
    setItem: (i, s) => {
      slots[i] = s;
    },
  };
  const commands = [];
  const dim = {
    getBlock: () => ({ getComponent: (id) => (id === 'minecraft:inventory' ? { container } : undefined) }),
    runCommand: (cmd) => {
      commands.push(cmd);
      onCommand(container);
      return { successCount: 1 };
    },
  };
  const logs = [];
  return { slots, container, dim, commands, logs, loot: new Loot(dim, api, (msg) => logs.push(msg)) };
}

const filled = (slots) => slots.filter((s) => s !== undefined).length;

test('vanillaCommand: the quoted bare id the probe measured; nothing else passes', () => {
  assert.equal(vanillaCommand([1, 2, 3], ANCIENT_CITY), 'loot insert 1 2 3 loot "chests/ancient_city"');
  assert.throws(() => vanillaCommand([0, 0, 0], 'chests/x" @a'), LootError);
  assert.throws(() => vanillaCommand([0, 0, 0], 'loot_tables/chests/ancient_city.json'), LootError);
});

test('fillVanilla: an insert that wrote nothing is an error, not successCount=1', () => {
  const w = fakeWorld();
  assert.throws(() => w.loot.fillVanilla([0, 64, 0], CONTROL_TABLE), /left the chest at 0 64 0 empty/);
  assert.equal(w.commands.length, 1);
  assert.match(w.logs.join('\n'), /empty \(successCount=1\)/);
});

test('fillVanilla: an occupied chest is refused before the command, and logged', () => {
  const w = fakeWorld((c) => c.setItem(0, new FakeItemStack('minecraft:bone', 3)));
  w.slots[5] = new FakeItemStack('minecraft:dirt', 64);
  assert.throws(() => w.loot.fillVanilla([0, 64, 0], ANCIENT_CITY), /occupied \(1 slots\)/);
  assert.equal(w.commands.length, 0);
  assert.match(w.logs.join('\n'), /occupied/);
});

test('fillVanilla: an empty chest the command fills reports its slots', () => {
  const w = fakeWorld((c) => c.setItem(3, new FakeItemStack('minecraft:bone', 3)));
  assert.equal(w.loot.fillVanilla([0, 64, 0], CONTROL_TABLE), 1);
});

test('fillCustom: one stack per attempt in distinct slots; a same-seed repeat refills in place', () => {
  const w = fakeWorld();
  const stacks = w.loot.fillCustom([0, 64, 0], seededRng('inst#0'));
  assert.equal(filled(w.slots), stacks.length);
  const snapshot = w.slots.map((s) => s && `${s.typeId}x${s.amount}`);
  w.loot.fillCustom([0, 64, 0], seededRng('inst#0'));
  assert.deepEqual(w.slots.map((s) => s && `${s.typeId}x${s.amount}`), snapshot);
  assert.equal(w.logs.length, 0);
});

test('fillCustom: a chest holding anything else is refused and logged', () => {
  const w = fakeWorld();
  w.slots.fill(new FakeItemStack('minecraft:dirt', 64));
  assert.throws(() => w.loot.fillCustom([0, 64, 0], seededRng('inst#0')), LootError);
  assert.match(w.logs.join('\n'), /occupied/);
});

test('hooks.fillChest: custom table by id, vanilla otherwise', () => {
  const w = fakeWorld((c) => c.setItem(0, new FakeItemStack('minecraft:bone', 1)));
  const ctx = { instance: { id: 'windmill:o:1:2' }, index: 0, pos: [0, 64, 0] };
  w.loot.hooks.fillChest({ ...ctx, table: CUSTOM_TABLE });
  assert.equal(w.commands.length, 0);
  assert.ok(filled(w.slots) >= 5);
  const v = fakeWorld((c) => c.setItem(0, new FakeItemStack('minecraft:bone', 1)));
  v.loot.hooks.fillChest({ ...ctx, table: ANCIENT_CITY });
  assert.deepEqual(v.commands, ['loot insert 0 64 0 loot "chests/ancient_city"']);
});
