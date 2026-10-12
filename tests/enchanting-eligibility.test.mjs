// The roller's tables (src/enchanting/roll-rules.ts) against the engine's reference (src/enchanting/eligibility.ts,
// measured on BDS by andrew:ench_data_parity), spec v3 §4, L0-ench-r001, r002, ac06. Any difference fails, and so
// does a reference measured on another BDS than scripts/targets.mjs pins. The negative controls rebuild both modules
// with one table line replaced and expect the same comparison to name that line's item.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BDS_VERSION } from '../scripts/targets.mjs';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const RULES = 'src/enchanting/roll-rules.ts';
const REFERENCE = 'src/enchanting/eligibility.ts';

/** Bundles both modules; `swap` replaces `from` with `to` in one of them, and must match exactly once. */
async function load(swap) {
  const plugins = [
    {
      name: 'no-engine',
      setup(b) {
        b.onResolve({ filter: /^@minecraft\// }, (args) => ({ errors: [{ text: `${relative(projectRoot, args.importer)} reaches ${args.path}` }] }));
      },
    },
  ];
  if (swap !== undefined) {
    const source = readFileSync(join(projectRoot, swap.file), 'utf-8');
    assert.equal(source.split(swap.from).length - 1, 1, `${swap.file} holds the line to swap exactly once: ${swap.from}`);
    plugins.push({
      name: 'swap-one-line',
      setup(b) {
        b.onLoad({ filter: /\.ts$/ }, (args) =>
          relative(projectRoot, args.path) === swap.file ? { contents: source.replace(swap.from, swap.to), loader: 'ts' } : undefined
        );
      },
    });
  }
  const result = await build({
    stdin: { contents: `export * as rules from "./${RULES}"; export * as ref from "./${REFERENCE}";`, resolveDir: projectRoot, loader: 'ts' },
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    write: false,
    logLevel: 'silent',
    plugins,
  });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text, 'utf-8').toString('base64'));
}

/**
 * The roller's table in the reference's shape: every eligible enchantment at its tier-3 cap, the level the table
 * reaches. Rows for items not shipped yet stay out; the BDS scenario fails once their item type exists.
 */
const rollerAccepts = (rules, ref) =>
  new Map(
    [...rules.ELIGIBILITY]
      .filter(([item]) => !ref.NOT_SHIPPED.includes(item))
      .map(([item, ids]) => [item, Object.fromEntries(ids.map((id) => [id, rules.levelCap(id, 3)]))])
  );

const rollerPairs = (rules) => rules.CONFLICT_GROUPS.flatMap((group) => group.flatMap((a, i) => group.slice(i + 1).map((b) => [a, b])));

/** Treasure is what the engine's table generator withholds, less the curses the roller removes anyway. */
const withheldTreasure = (rules, ref) => [...new Set([...ref.TABLE_WITHHOLDS.values()].flat())].filter((id) => !rules.CURSES.has(id)).sort();

/** Every difference between the roller and the reference, one line each; empty when they agree. */
function parity({ rules, ref }) {
  const out = [];
  for (const id of [...new Set([...rules.MAX_LEVEL.keys(), ...ref.ENGINE_MAX_LEVEL.keys()])].sort()) {
    if (rules.MAX_LEVEL.get(id) !== ref.ENGINE_MAX_LEVEL.get(id)) out.push(`max level ${id}: roller ${rules.MAX_LEVEL.get(id)}, engine ${ref.ENGINE_MAX_LEVEL.get(id)}`);
  }
  out.push(...ref.diffAccepts(rollerAccepts(rules, ref), ref.ENGINE_ACCEPTS).map((line) => line.replace('actual', 'roller').replace('expected', 'engine')));
  out.push(...ref.diffPairs(rollerPairs(rules), ref.ENGINE_CONFLICTS).map((line) => line.replace('actual', 'roller').replace('expected', 'engine')));
  const treasure = [...rules.TREASURE].sort();
  const withheld = withheldTreasure(rules, ref);
  for (const id of treasure.filter((x) => !withheld.includes(x))) out.push(`treasure ${id}: the roller's, but the vanilla table generator yields it`);
  for (const id of withheld.filter((x) => !treasure.includes(x))) out.push(`treasure ${id}: the vanilla table generator withholds it, the roller treats it as standard`);
  return out;
}

const real = await load();

test('the reference was measured on the BDS that scripts/targets.mjs pins, and is not empty', () => {
  const { ref } = real;
  assert.equal(ref.MEASURED_ON, BDS_VERSION, 'a new engine needs a new measurement: run andrew:ench_data_parity and paste its REF lines');
  assert.ok(ref.ENGINE_MAX_LEVEL.size >= 40, `${ref.ENGINE_MAX_LEVEL.size} enchantment types`);
  assert.ok(ref.ENGINE_ACCEPTS.size >= 80, `${ref.ENGINE_ACCEPTS.size} items`);
  assert.ok(ref.ENGINE_CONFLICTS.length > 0, 'conflicts');
  assert.ok(ref.TABLE_WITHHOLDS.size > 0, 'generator rows');
});

test("the roller's table equals the engine's: items, enchantments, max levels, conflicts, treasure", () => {
  assert.deepEqual(parity(real), []);
});

test('an item the reference skips as not shipped has a roller row and no item definition in the pack', () => {
  const { rules, ref } = real;
  const dir = join(projectRoot, 'packs', 'behavior', 'items');
  const shipped = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf-8'))['minecraft:item']?.description?.identifier);
  for (const item of ref.NOT_SHIPPED) {
    assert.ok(rules.ELIGIBILITY.has(item), `${item} has a roller row`);
    assert.ok(!shipped.includes(item), `${item} ships now: run andrew:ench_data_parity and move its REF row into ENGINE_ACCEPTS`);
  }
});

test("§4 treasure the vanilla table already offers is listed apart, and the roller does not implement it", (t) => {
  const { rules, ref } = real;
  assert.ok(ref.TABLE_ALREADY_OFFERS.size > 0, 'the probe found Lunge already offered (ENCH-PROBE-01 §5)');
  for (const id of ref.TREASURE_CANDIDATES) {
    const homes = [rules.TREASURE.has(id) && 'roller treasure', rules.CURSES.has(id) && 'curse', ref.TABLE_ALREADY_OFFERS.has(id) && 'already offered'].filter(Boolean);
    assert.equal(homes.length, 1, `${id}: ${homes.join(', ') || 'nowhere'}`);
  }
  for (const [id, item] of ref.TABLE_ALREADY_OFFERS) {
    assert.ok(id in (ref.ENGINE_ACCEPTS.get(item) ?? {}), `${item} accepts ${id}`);
    assert.ok(!(ref.TABLE_WITHHOLDS.get(item) ?? [id]).includes(id), `the generator yields ${id} on ${item}`);
    assert.ok(!rules.TREASURE.has(id), `${id} is offered already, so it is not the roller's treasure`);
  }
  t.diagnostic(`already at the vanilla table: ${[...ref.TABLE_ALREADY_OFFERS].map(([id, item]) => `${id} (${item})`).join(', ')}`);
  t.diagnostic(`implemented by the roller: ${[...rules.TREASURE].sort().join(', ')}`);
});

// AC3: one line of either table replaced turns the same comparison red, naming the item or pair the line holds.
const SWAPS = [
  {
    what: 'roller: Wind Burst taken off the Mace row',
    file: RULES,
    from: '["mace", ["density", "breach", "wind_burst", "smite", "bane_of_arthropods", "fire_aspect", ...DURABLE]],',
    to: '["mace", ["density", "breach", "smite", "bane_of_arthropods", "fire_aspect", ...DURABLE]],',
    names: 'minecraft:mace: wind_burst roller none, engine 3',
  },
  {
    what: 'roller: the axe row given the sword row',
    file: RULES,
    from: '["axe", [...DIGGER, ...DAMAGE]],',
    to: '["axe", MELEE],',
    names: 'minecraft:diamond_axe: efficiency roller none, engine 5',
  },
  {
    what: 'roller: the Silk Touch / Fortune group dropped',
    file: RULES,
    from: '  ["silk_touch", "fortune"],\n',
    to: '',
    names: 'conflict fortune+silk_touch: engine only',
  },
  {
    what: 'roller: Efficiency capped at IV',
    file: RULES,
    from: '["efficiency", 5],',
    to: '["efficiency", 4],',
    names: 'max level efficiency: roller 4, engine 5',
  },
  {
    what: 'roller: Swift Sneak dropped from treasure',
    file: RULES,
    from: '"soul_speed", "swift_sneak", "wind_burst"]',
    to: '"soul_speed", "wind_burst"]',
    names: 'treasure swift_sneak: the vanilla table generator withholds it, the roller treats it as standard',
  },
  {
    what: 'reference: Lunge taken off the iron spear row',
    file: REFERENCE,
    from: '["minecraft:iron_spear", { bane_of_arthropods: 5, fire_aspect: 2, knockback: 2, looting: 3, lunge: 3,',
    to: '["minecraft:iron_spear", { bane_of_arthropods: 5, fire_aspect: 2, knockback: 2, looting: 3,',
    names: 'minecraft:iron_spear: lunge roller 3, engine none',
  },
];

for (const swap of SWAPS) {
  test(`negative control — ${swap.what}: the comparison goes red`, async () => {
    const found = parity(await load(swap));
    assert.ok(found.includes(swap.names), `expected "${swap.names}" among ${found.length} differences: ${found.slice(0, 8).join(' | ')}`);
  });
}
