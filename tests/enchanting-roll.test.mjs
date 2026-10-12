// The enchanting roller under spec §4 and §5 bullets 4–6, off the engine (L0-ench-ac02, ac03, ac04, ac05; R-ench-001…005).
//
// src/enchanting/roll.ts is bundled with a plugin that refuses every path to @minecraft/server, so the bundle building
// at all is the purity check. Every statistic runs on a fixed mulberry32 seed against ±3σ bands and cannot flake; a
// second pass on a fresh seed, printed in every message, holds ±5σ bands to show the fixed seed is not a lucky one.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MinecraftEnchantmentTypes, MinecraftItemTypes } from '@minecraft/vanilla-data';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(projectRoot, rel), 'utf-8');
const load = async (result) => import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text, 'utf-8').toString('base64'));

const engineReached = [];
const noEngine = {
  name: 'no-engine',
  setup(b) {
    b.onResolve({ filter: /^@minecraft\// }, (args) => {
      engineReached.push(`${relative(projectRoot, args.importer)} → ${args.path}`);
      return { errors: [{ text: `${relative(projectRoot, args.importer)} reaches ${args.path} at runtime` }] };
    });
  },
};
const bundle = (options) => build({ bundle: true, format: 'esm', platform: 'neutral', write: false, metafile: true, logLevel: 'silent', ...options });
const fromStdin = (contents, plugins) => bundle({ stdin: { contents, resolveDir: projectRoot, loader: 'ts' }, plugins });

const { roll, rules, forbidden } = await load(
  await fromStdin(
    'export * as roll from "./src/enchanting/roll"; export * as rules from "./src/enchanting/roll-rules"; export * as forbidden from "./src/legendary/enchant-rules";',
    [noEngine]
  )
);

const TRIDENT = 'andrew:above_water_trident';
const SCULK = 'andrew:sculk_crossbow';

const mulberry32 = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const FIXED_SEED = 0x5eed0412;
const FRESH_SEED = Math.floor(Math.random() * 2 ** 32);
const PASSES = [
  { label: 'fixed seed', seed: FIXED_SEED, k: 3 },
  { label: `fresh seed ${FRESH_SEED}`, seed: FRESH_SEED, k: 5 },
];

/** [lo, hi] = np ± kσ, widened to whole counts: n = 1000, p = 0.2, k = 3 gives [162, 238] (R-ench-004). */
const band = (n, p, k) => {
  const spread = k * Math.sqrt(n * p * (1 - p));
  return [Math.floor(n * p - spread), Math.ceil(n * p + spread)];
};
const inBand = (count, n, p, k, what) => {
  const [lo, hi] = band(n, p, k);
  assert.ok(count >= lo && count <= hi, `${what}: ${count} of ${n}, expected [${lo}, ${hi}] (p = ${p}, ±${k}σ)`);
};

const ids = (r) => r.enchantments.map((e) => e.id);
const hasTreasure = (r) => r.enchantments.some((e) => rules.TREASURE.has(e.id));

// ---------------------------------------------------------------- the data the roller stands on (R-ench-001)

test('every enchantment id is a Bedrock 1.26.51 id, with a max level, and the item ids exist', () => {
  const vanilla = Object.values(MinecraftEnchantmentTypes).map((id) => id.replace(/^minecraft:/, '')).sort();
  assert.deepEqual([...rules.MAX_LEVEL.keys()].sort(), vanilla);
  const used = [...rules.CLASS_ENCHANTMENTS.values()].flat().concat([...rules.TREASURE], [...rules.CURSES], [...rules.LEVEL_RULE_IDS], rules.CONFLICT_GROUPS.flat());
  assert.deepEqual(used.filter((id) => !rules.MAX_LEVEL.has(id)), []);
  assert.deepEqual([...rules.TREASURE].filter((id) => rules.CURSES.has(id)), [], 'a curse is never treasure (L0-ench-gl01)');

  const items = new Set(Object.values(MinecraftItemTypes));
  const vanillaKeys = [...rules.ELIGIBILITY.keys()].filter((id) => id.startsWith('minecraft:'));
  assert.deepEqual(vanillaKeys.filter((id) => !items.has(id)), []);
  for (const kind of ['sword', 'axe', 'pickaxe', 'shovel', 'hoe', 'spear', 'helmet', 'chestplate', 'leggings', 'boots']) {
    const shipped = [...items].filter((id) => id.endsWith(`_${kind}`));
    assert.deepEqual(shipped.filter((id) => !rules.ELIGIBILITY.has(id)), [], `every vanilla ${kind} is in the table`);
  }
  for (const [itemId, list] of rules.ELIGIBILITY) {
    assert.ok(list.includes('unbreaking') && list.includes('mending'), `${itemId} admits Unbreaking and Mending`);
  }
});

test('every add-on item with minecraft:enchantable is in the table under its own slot', () => {
  const dir = join(projectRoot, 'packs', 'behavior', 'items');
  const shipped = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf-8'))['minecraft:item'])
    .filter((item) => item?.components?.['minecraft:enchantable'] !== undefined);
  assert.ok(shipped.length >= 7, `${shipped.length} enchantable add-on items`);
  for (const item of shipped) {
    const itemId = item.description.identifier;
    const slot = item.components['minecraft:enchantable'].slot;
    assert.equal(rules.ADDON_SLOTS.get(itemId), slot, `${itemId}: slot ${slot} in packs/behavior/items`);
    assert.deepEqual(rules.ELIGIBILITY.get(itemId), rules.CLASS_ENCHANTMENTS.get(rules.SLOT_CLASS.get(slot)));
  }
  assert.deepEqual(rules.ELIGIBILITY.get(TRIDENT), rules.ELIGIBILITY.get('minecraft:trident'), 'slot spear is the trident');
  assert.deepEqual(rules.ELIGIBILITY.get('andrew:underwater_bow'), rules.ELIGIBILITY.get('minecraft:bow'));
});

// ---------------------------------------------------------------- AC1: the rare stage (R-ench-004, AC-ench-02)

const RARE_ITEMS = ['minecraft:mace', 'minecraft:diamond_boots', 'minecraft:bow', 'minecraft:diamond_pickaxe', 'minecraft:trident', 'andrew:underwater_bow', 'andrew:miners_pickaxe'];

/** 1000 valid generations of `itemId`: results holding treasure, and §4 breaches counted rather than thrown. */
function rareRun(itemId, tier, rng, n = 1000) {
  const out = { n, withTreasure: 0, hits: 0, missWithTreasure: 0, curses: 0, stageMismatch: 0 };
  while (out.n > 0) {
    const r = roll.rollEnchantments({ itemId, tier, rng });
    assert.equal(r.eligible, true, itemId);
    assert.notEqual(r.rareStage, 'none', `${itemId} has eligible treasure`);
    out.n--;
    if (hasTreasure(r)) out.withTreasure++;
    if (r.rareStage === 'hit') out.hits++;
    if (r.rareStage === 'miss' && hasTreasure(r)) out.missWithTreasure++;
    if (hasTreasure(r) !== (r.rareStage === 'hit')) out.stageMismatch++;
    out.curses += r.enchantments.filter((e) => rules.CURSES.has(e.id)).length;
  }
  out.n = n;
  return out;
}

for (const { label, seed, k } of PASSES) {
  test(`AC1 (${label}): treasure in ≈ 20 % of 1000 valid generations per item, none on a miss, curses 0`, () => {
    let total = 0;
    let withTreasure = 0;
    RARE_ITEMS.forEach((itemId, i) => {
      const run = rareRun(itemId, 3, mulberry32(seed + i));
      inBand(run.withTreasure, run.n, 0.2, k, `${itemId} results with treasure (${label})`);
      assert.equal(run.missWithTreasure, 0, `${itemId}: a miss holds no treasure`);
      assert.equal(run.stageMismatch, 0, `${itemId}: treasure in the result exactly when the stage hit`);
      assert.equal(run.curses, 0, `${itemId}: curses`);
      total += run.n;
      withTreasure += run.withTreasure;
    });
    inBand(withTreasure, total, 0.2, k, `all items together (${label})`);
    for (const tier of [1, 2]) {
      const rng = mulberry32(seed ^ (tier * 0x9e3779b9));
      const runs = RARE_ITEMS.map((itemId) => rareRun(itemId, tier, rng));
      inBand(
        runs.reduce((s, r) => s + r.withTreasure, 0),
        runs.reduce((s, r) => s + r.n, 0),
        0.2,
        k,
        `tier ${tier} (${label}): the stage does not depend on the tier`
      );
      assert.equal(runs.reduce((s, r) => s + r.curses + r.missWithTreasure, 0), 0);
    }
  });
}

test('AC1: an item with no eligible treasure is "none", rolls the standard pool and is not a generation', () => {
  const rng = mulberry32(FIXED_SEED);
  const standard = ['efficiency', 'fortune', 'silk_touch', 'unbreaking'];
  for (let i = 0; i < 1000; i++) {
    const r = roll.rollFrom(standard, 3, rng);
    assert.equal(r.rareStage, 'none');
    assert.equal(r.eligible, true);
    assert.ok(r.enchantments.length >= 1);
    assert.ok(!r.trace.some((t) => t.stage === 'rare'), 'no rare draw at all');
    assert.ok(!hasTreasure(r));
  }
  for (const itemId of ['minecraft:stick', 'minecraft:shears', 'andrew:orbital_cannon', 'minecraft:carved_pumpkin']) {
    const calls = { n: 0 };
    const r = roll.rollEnchantments({ itemId, tier: 3, rng: () => (calls.n++, 0.5) });
    assert.deepEqual(r, { enchantments: [], eligible: false, rareStage: 'none', trace: [] }, itemId);
    assert.equal(calls.n, 0, `${itemId}: no draw is spent`);
  }
});

test('AC1: the trace holds every draw, in order', () => {
  const base = mulberry32(FIXED_SEED);
  for (let i = 0; i < 500; i++) {
    const drawn = [];
    const rng = () => {
      const u = base();
      drawn.push(u);
      return u;
    };
    const r = roll.rollEnchantments({ itemId: RARE_ITEMS[i % RARE_ITEMS.length], tier: 1 + (i % 3), rng });
    assert.deepEqual(r.trace.map((t) => t.u), drawn);
  }
  assert.throws(() => roll.rollEnchantments({ itemId: 'minecraft:bow', tier: 3, rng: () => 1 }), RangeError);
  assert.throws(() => roll.rollEnchantments({ itemId: 'minecraft:bow', tier: 4, rng: base }), RangeError);
});

// ---------------------------------------------------------------- AC2: Wind Burst and Unbreaking levels (R-ench-005, AC-ench-03)

test('AC2: each rung is its own check — the highest pass wins, I when none passes, then the context max', () => {
  const [p1, p2, p3] = rules.LEVEL_CHANCES;
  assert.deepEqual([p1, p2, p3], [0.7, 0.4, 0.2]);
  for (let mask = 0; mask < 8; mask++) {
    const pass = [mask & 1, mask & 2, mask & 4].map(Boolean);
    const draws = [p1, p2, p3].map((p, i) => (pass[i] ? p - 1e-9 : p));
    const highest = pass.lastIndexOf(true) + 1 || 1;
    for (const cap of [3, 2, 1]) {
      assert.equal(rules.specialLevel(draws, cap), Math.min(highest, cap), `passes ${pass} cap ${cap}`);
    }
  }
  // Through the roller, on a set holding only Unbreaking: one pick, then exactly three level draws.
  const scripted = (...us) => {
    const queue = [...us];
    return () => queue.shift();
  };
  const level = (tier, ...rungs) => {
    const r = roll.rollFrom(['unbreaking'], tier, scripted(0, ...rungs));
    assert.deepEqual(r.trace.map((t) => [t.stage, t.rung]), [['pick', undefined], ['level', 1], ['level', 2], ['level', 3]]);
    return r.enchantments[0].level;
  };
  assert.equal(level(3, 0.9, 0.1, 0.9), 2, 'I fails, II passes: II, not a cascade that stops at I');
  assert.equal(level(3, 0.9, 0.9, 0.1), 3, 'only III passes: III');
  assert.equal(level(3, 0.1, 0.9, 0.9), 1);
  assert.equal(level(3, 0.9, 0.9, 0.9), 1, 'none passes: the fallback I');
  assert.equal(level(3, 0.1, 0.1, 0.1), 3);
  assert.equal(level(2, 0.9, 0.9, 0.1), 2, 'III capped to II at tier 2');
  assert.equal(level(1, 0.1, 0.1, 0.1), 1, 'tier 1 allows I');
});

/** The level of each occurrence of `id` on `itemId`, with its three rung draws, until `n` are collected. */
function levelRun(itemId, id, tier, rng, n = 1000) {
  const seen = [];
  while (seen.length < n) {
    const r = roll.rollEnchantments({ itemId, tier, rng });
    for (const e of r.enchantments.filter((x) => x.id === id)) {
      const rungs = r.trace.filter((t) => t.stage === 'level' && t.id === id);
      seen.push({ level: e.level, rungs });
    }
  }
  return seen.slice(0, n);
}

for (const { label, seed, k } of PASSES) {
  test(`AC2 (${label}): Wind Burst on the Mace and Unbreaking on a pickaxe at tier 3 — 70/40/20, highest wins`, () => {
    for (const [itemId, id] of [
      ['minecraft:mace', 'wind_burst'],
      ['minecraft:diamond_pickaxe', 'unbreaking'],
    ]) {
      const seen = levelRun(itemId, id, 3, mulberry32(seed));
      const what = `${id} on ${itemId} (${label})`;
      for (const { level, rungs } of seen) {
        assert.deepEqual(rungs.map((t) => t.rung), [1, 2, 3], `${what}: all three rungs drawn every time`);
        assert.equal(level, rules.specialLevel(rungs.map((t) => t.u), 3));
        assert.ok(level >= 1 && level <= 3);
      }
      const count = (lvl) => seen.filter((s) => s.level === lvl).length;
      inBand(count(3), 1000, 0.2, k, `${what}: III`);
      inBand(count(2), 1000, 0.32, k, `${what}: II`);
      inBand(count(1), 1000, 0.48, k, `${what}: I`);
      rules.LEVEL_CHANCES.forEach((p, i) => {
        inBand(seen.filter((s) => s.rungs[i].success).length, 1000, p, k, `${what}: rung ${i + 1} passes`);
        assert.ok(seen.every((s) => s.rungs[i].success === s.rungs[i].u < p));
      });
      // Independent: rung II passes at its own 40 % whether rung I passed or failed.
      for (const firstPassed of [true, false]) {
        const group = seen.filter((s) => s.rungs[0].success === firstPassed);
        inBand(group.filter((s) => s.rungs[1].success).length, group.length, 0.4, k, `${what}: rung II when rung I ${firstPassed ? 'passed' : 'failed'}`);
      }
    }
  });

  test(`AC2 (${label}): tier 2 caps at II with P(II) = 0.52, tier 1 gives I`, () => {
    const two = levelRun('minecraft:diamond_pickaxe', 'unbreaking', 2, mulberry32(seed + 2));
    assert.equal(two.filter((s) => s.level > 2).length, 0);
    inBand(two.filter((s) => s.level === 2).length, 1000, 0.52, k, `unbreaking at tier 2 (${label}): II`);
    const one = levelRun('minecraft:mace', 'wind_burst', 1, mulberry32(seed + 1));
    assert.deepEqual([...new Set(one.map((s) => s.level))], [1]);
  });
}

test('AC2: other enchantments draw one uniform level up to the context max, never the rungs', () => {
  const rng = mulberry32(FIXED_SEED);
  for (const [tier, top] of [
    [3, 5],
    [2, 2],
    [1, 1],
  ]) {
    const levels = new Set();
    for (let i = 0; i < 3000; i++) {
      const r = roll.rollEnchantments({ itemId: 'minecraft:diamond_pickaxe', tier, rng });
      for (const e of r.enchantments.filter((x) => x.id === 'efficiency')) {
        const draws = r.trace.filter((t) => t.stage === 'level' && t.id === 'efficiency');
        assert.equal(draws.length, 1);
        assert.equal(draws[0].rung, undefined);
        levels.add(e.level);
      }
    }
    assert.deepEqual([...levels].sort(), Array.from({ length: top }, (_, i) => i + 1), `efficiency at tier ${tier}`);
  }
});

test('AC2: the same seed reproduces the same rolls', () => {
  const run = (seed) => {
    const rng = mulberry32(seed);
    return Array.from({ length: 500 }, (_, i) => roll.rollEnchantments({ itemId: RARE_ITEMS[i % RARE_ITEMS.length], tier: 1 + (i % 3), rng }));
  };
  assert.deepEqual(run(FIXED_SEED), run(FIXED_SEED));
  assert.notDeepEqual(run(FIXED_SEED), run(FIXED_SEED + 1));
});

// ---------------------------------------------------------------- AC3: conflict fuzz (R-ench-002, AC-ench-04)

/** R-ench-002's table, written here rather than read from roll-rules.ts, so wrong data cannot hide itself. */
const R002 = [
  ['protection', 'fire_protection', 'blast_protection', 'projectile_protection'],
  ['sharpness', 'smite', 'bane_of_arthropods'],
  ['density', 'breach', 'smite', 'bane_of_arthropods'],
  ['silk_touch', 'fortune'],
  ['depth_strider', 'frost_walker'],
  ['infinity', 'mending'],
  ['multishot', 'piercing'],
  ['riptide', 'loyalty'],
  ['riptide', 'channeling'],
];
const PAIRS = R002.flatMap((g) => g.flatMap((a, i) => g.slice(i + 1).map((b) => [a, b])));
const pairsIn = (list) => PAIRS.filter(([a, b]) => list.includes(a) && list.includes(b));

test('AC3: the conflict data covers every pair of R-ench-002', () => {
  assert.deepEqual(PAIRS.filter(([a, b]) => !rules.conflicts(a, b) || !rules.conflicts(b, a)), []);
  assert.equal(rules.conflicts('loyalty', 'channeling'), false, 'Loyalty and Channeling combine');
  assert.equal(rules.conflicts('sharpness', 'sharpness'), false);
});

test('AC3: 30 000 requests over every item, tier and seed — no conflicting pair, curse, forbidden id or level past max', () => {
  const items = [...rules.ELIGIBILITY.keys()];
  const master = mulberry32(FIXED_SEED ^ 0xf022);
  const seen = new Map(items.map((id) => [id, new Set()]));
  const pressure = new Map(PAIRS.map((p) => [p.join('+'), 0]));
  const breaches = [];
  let throws = 0;
  for (let i = 0; i < 30000; i++) {
    const itemId = items[Math.floor(master() * items.length)];
    const tier = 1 + Math.floor(master() * 3);
    const seed = Math.floor(master() * 2 ** 32);
    let r;
    try {
      r = roll.rollEnchantments({ itemId, tier, rng: mulberry32(seed) });
    } catch (err) {
      throws++;
      breaches.push(`${itemId} t${tier} s${seed}: threw ${err.message}`);
      continue;
    }
    const got = ids(r);
    const eligible = rules.eligibleFor(itemId);
    for (const [a, b] of pairsIn(got)) breaches.push(`${itemId}: ${a} + ${b}`);
    for (const e of r.enchantments) {
      if (rules.CURSES.has(e.id)) breaches.push(`${itemId}: curse ${e.id}`);
      if (forbidden.forbiddenFor(itemId).includes(e.id)) breaches.push(`${itemId}: forbidden ${e.id}`);
      if (!eligible.includes(e.id)) breaches.push(`${itemId}: ineligible ${e.id}`);
      if (e.level < 1 || e.level > rules.MAX_LEVEL.get(e.id)) breaches.push(`${itemId}: ${e.id} ${e.level}`);
      seen.get(itemId).add(e.id);
    }
    if (new Set(got).size !== got.length) breaches.push(`${itemId}: duplicate in ${got}`);
    for (const [a, b] of PAIRS) {
      if (eligible.includes(a) && eligible.includes(b) && (got.includes(a) || got.includes(b))) pressure.set(`${a}+${b}`, pressure.get(`${a}+${b}`) + 1);
    }
  }
  assert.equal(throws, 0, 'guard throws');
  assert.deepEqual(breaches.slice(0, 20), []);
  // Not vacuous: every pair two items can both take was in play, and every eligible id — treasure included — came up.
  const played = PAIRS.filter(([a, b]) => items.some((id) => rules.eligibleFor(id).includes(a) && rules.eligibleFor(id).includes(b)));
  assert.deepEqual(played.filter(([a, b]) => pressure.get(`${a}+${b}`) < 50).map((p) => p.join('+')), []);
  const missing = items.flatMap((id) => rules.eligibleFor(id).filter((e) => !seen.get(id).has(e)).map((e) => `${id}: ${e}`));
  assert.deepEqual(missing, []);
  for (const [itemId, treasure] of [
    ['minecraft:diamond_pickaxe', 'mending'],
    ['minecraft:netherite_leggings', 'swift_sneak'],
    ['minecraft:mace', 'wind_burst'],
    ['minecraft:iron_boots', 'soul_speed'],
    ['minecraft:iron_boots', 'frost_walker'],
  ]) {
    assert.ok(seen.get(itemId).has(treasure), `${treasure} on ${itemId}`);
  }
});

test('AC3: negative controls — the guard and the pair oracle both catch a bad result', () => {
  const sword = rules.eligibleFor('minecraft:diamond_sword');
  assert.deepEqual(pairsIn(['sharpness', 'looting', 'smite']), [['sharpness', 'smite']]);
  assert.throws(() => roll.assertValid([{ id: 'sharpness', level: 1 }, { id: 'smite', level: 1 }], sword), /conflict/);
  assert.throws(() => roll.assertValid([{ id: 'infinity', level: 1 }, { id: 'mending', level: 1 }], rules.eligibleFor('minecraft:bow')), /conflict/);
  assert.throws(() => roll.assertValid([{ id: 'riptide', level: 1 }, { id: 'channeling', level: 1 }], rules.eligibleFor('minecraft:trident')), /conflict/);
  assert.throws(() => roll.assertValid([{ id: 'density', level: 1 }, { id: 'smite', level: 1 }], rules.eligibleFor('minecraft:mace')), /conflict/);
  assert.throws(() => roll.assertValid([{ id: 'vanishing', level: 1 }], rules.ELIGIBILITY.get('minecraft:diamond_sword')), /curse/);
  assert.throws(() => roll.assertValid([{ id: 'sharpness', level: 6 }], sword), /level/);
  assert.throws(() => roll.assertValid([{ id: 'sharpness', level: 2 }, { id: 'sharpness', level: 2 }], sword), /twice/);
  assert.throws(() => roll.assertValid([{ id: 'power', level: 1 }], sword), /not eligible/);
  assert.throws(() => roll.assertValid([{ id: 'loyalty', level: 1 }], rules.ELIGIBILITY.get(TRIDENT), forbidden.forbiddenFor(TRIDENT)), /forbidden/);
  roll.assertValid([{ id: 'loyalty', level: 3 }, { id: 'channeling', level: 1 }], rules.eligibleFor('minecraft:trident'));
});

// ---------------------------------------------------------------- AC4: the legendaries' forbidden lists (R-ench-003)

/** How often each id comes up over `n` rolls of `itemId` at every tier. */
function tally(itemId, n, seed) {
  const rng = mulberry32(seed);
  const counts = new Map();
  for (let i = 0; i < n; i++) {
    for (const id of ids(roll.rollEnchantments({ itemId, tier: 1 + (i % 3), rng }))) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return (id) => counts.get(id) ?? 0;
}

test('AC4: the Above-Water Trident is never offered Loyalty or Riptide; the Sculk Crossbow never Piercing', () => {
  assert.deepEqual(forbidden.forbiddenFor(TRIDENT), ['loyalty', 'riptide']);
  assert.deepEqual(forbidden.forbiddenFor(SCULK), ['piercing']);
  assert.deepEqual(forbidden.forbiddenFor('minecraft:trident'), []);

  const trident = tally(TRIDENT, 6000, FIXED_SEED);
  const vanillaTrident = tally('minecraft:trident', 6000, FIXED_SEED);
  assert.equal(trident('loyalty'), 0);
  assert.equal(trident('riptide'), 0);
  for (const id of ['impaling', 'channeling', 'unbreaking', 'mending']) assert.ok(trident(id) > 0, `${id} stays on the legendary`);
  // Control: the slot admits both, so the zero above is the def's list at work, not a gap in the data.
  assert.ok(vanillaTrident('loyalty') > 0 && vanillaTrident('riptide') > 0, 'a vanilla trident is offered both');
  assert.ok(rules.ELIGIBILITY.get(TRIDENT).includes('loyalty') && rules.ELIGIBILITY.get(TRIDENT).includes('riptide'));

  const sculk = tally(SCULK, 6000, FIXED_SEED + 1);
  const vanillaCrossbow = tally('minecraft:crossbow', 6000, FIXED_SEED + 1);
  assert.equal(sculk('piercing'), 0);
  for (const id of ['multishot', 'quick_charge', 'unbreaking', 'mending']) assert.ok(sculk(id) > 0, `${id} stays on the crossbow`);
  assert.ok(vanillaCrossbow('piercing') > 0, 'a vanilla crossbow is offered Piercing');
  assert.ok(rules.ELIGIBILITY.get(SCULK).includes('piercing'));
});

test('AC4: the roller reads the live forbidden list — a def that forbids something joins with no roller change', () => {
  const katana = 'andrew:dragon_katana';
  assert.ok(tally(katana, 3000, FIXED_SEED)('looting') > 0);
  forbidden.FORBIDDEN_ENCHANTMENTS.set(katana, ['looting']);
  try {
    assert.equal(tally(katana, 3000, FIXED_SEED)('looting'), 0);
  } finally {
    forbidden.FORBIDDEN_ENCHANTMENTS.delete(katana);
  }
  assert.ok(tally(katana, 3000, FIXED_SEED)('looting') > 0);
});

test('AC4: the scrubs strip from the same lists the roller reads — one source, no copy', async () => {
  const engineStub = 'export const world = {}; export const system = {}; export const EntityComponentTypes = {}; export const EquipmentSlot = {};';
  const stub = {
    name: 'engine-stub',
    setup(b) {
      b.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: 'mc', namespace: 'engine-stub' }));
      b.onLoad({ filter: /.*/, namespace: 'engine-stub' }, () => ({ contents: engineStub, loader: 'js' }));
    },
  };
  const both = await load(
    await fromStdin(
      `import { FORBIDDEN_ENCHANTMENTS as scrub } from "./src/legendary/enchant";
       import { PIERCING as strip } from "./src/sculk/enchant";
       import { FORBIDDEN_ENCHANTMENTS, PIERCING } from "./src/legendary/enchant-rules";
       export const sameList = scrub === FORBIDDEN_ENCHANTMENTS;
       export const samePiercing = strip === PIERCING;`,
      [stub]
    )
  );
  assert.equal(both.sameList, true);
  assert.equal(both.samePiercing, true);
  assert.doesNotMatch(read('src/legendary/enchant.ts'), /["'](loyalty|riptide)["']/, 'the trident scrub holds no list of its own');
  assert.doesNotMatch(read('src/sculk/enchant.ts'), /["']piercing["']/, 'the crossbow strip holds no Piercing of its own');
  assert.doesNotMatch(read('src/enchanting/roll.ts'), /FORBIDDEN_ENCHANTMENTS|PIERCING/, 'the roller reads forbiddenFor() only');
});

// ---------------------------------------------------------------- AC5, AC6: a pure module, no hook (AC-ench-04, AC-ench-05)

/** Source without comments, so a rule may be named in prose. */
const code = (rel) => read(rel).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const enchantingFiles = readdirSync(join(projectRoot, 'src', 'enchanting'))
  .filter((f) => f.endsWith('.ts'))
  .map((f) => `src/enchanting/${f}`);

test('AC5: roll.ts and every module it imports never reach @minecraft/server; the random source is injected', async () => {
  assert.deepEqual(engineReached, []);
  for (const entry of ['src/enchanting/roll.ts', 'src/enchanting/roll-rules.ts']) {
    const result = await bundle({ entryPoints: [join(projectRoot, entry)], plugins: [noEngine] });
    const inputs = Object.keys(result.metafile.inputs);
    assert.deepEqual(inputs.filter((p) => !p.startsWith('src/')), [], `${entry} bundles only project sources`);
    if (entry.endsWith('roll.ts')) {
      assert.deepEqual(inputs.sort(), ['src/enchanting/roll-rules.ts', 'src/enchanting/roll.ts', 'src/legendary/enchant-rules.ts', 'src/legendary/registry.ts']);
    }
  }
  // A type-only import passes: registry.ts takes ItemStack as a type and is in the bundle above.
  assert.match(read('src/legendary/registry.ts'), /^import type \{[^}]*\} from "@minecraft\/server";$/m);
  // Negative control: the check does see a runtime import.
  await assert.rejects(bundle({ entryPoints: [join(projectRoot, 'src/legendary/enchant.ts')], plugins: [noEngine] }), /reaches @minecraft\/server/);
  engineReached.length = 0;
  for (const file of enchantingFiles) {
    assert.doesNotMatch(code(file), /Math\.random|Date\.now|crypto|performance/, `${file} draws randomness only from rng`);
  }
});

test('AC6: no event subscription, no item write, and nothing in the game imports the roller', () => {
  assert.deepEqual(enchantingFiles.sort(), ['src/enchanting/roll-rules.ts', 'src/enchanting/roll.ts']);
  for (const file of enchantingFiles) {
    assert.doesNotMatch(
      code(file),
      /\bworld\.|\bsystem\.|subscribe\(|setItem\(|setEquipment\(|addEnchantment|removeEnchantment|ItemStack|runCommand|@minecraft\/server/,
      `${file} touches the engine`
    );
  }
  const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
  const importers = walk(join(projectRoot, 'src'))
    .filter((f) => f.endsWith('.ts') && !f.includes(`${join('src', 'enchanting')}`))
    .filter((f) => /from\s+["'][^"']*enchanting\//.test(readFileSync(f, 'utf-8')))
    .map((f) => relative(projectRoot, f));
  assert.deepEqual(importers, [], 'roll.ts is imported only by tests until xq11 approves an adapter');
});
