// The Above-Water Trident as data (L0-trdt): its item, craft token and recipe,
// checked against the registry and against the probe report the numbers come
// from (docs/feedback/probe-trident.md).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const readJson = (...parts) => JSON.parse(readFileSync(join(projectRoot, ...parts), 'utf-8'));

const item = readJson('packs', 'behavior', 'items', 'above_water_trident.json')['minecraft:item'];
const token = readJson('packs', 'behavior', 'items', 'above_water_trident_crafted.json')['minecraft:item'];
const recipe = readJson('packs', 'behavior', 'recipes', 'above_water_trident.json')['minecraft:recipe_shaped'];
const atlas = readJson('packs', 'resource', 'textures', 'item_texture.json');
const probe = readFileSync(join(projectRoot, 'docs', 'feedback', 'probe-trident.md'), 'utf-8');

/** The body of the probe report's section `## <n>.`, up to the next `## `. */
function probeSection(n) {
  const start = probe.indexOf(`\n## ${n}. `);
  assert.ok(start >= 0, `docs/feedback/probe-trident.md has no section ${n}`);
  const end = probe.indexOf('\n## ', start + 1);
  return probe.slice(start, end < 0 ? undefined : end);
}

/** The bold number in the first column after the row label, from a probe table. */
function measured(section, rowLabel) {
  const row = section.split('\n').find((line) => line.startsWith(`| ${rowLabel} |`));
  assert.ok(row, `no table row "${rowLabel}" in the probe section`);
  const value = row.split('|')[2].trim().match(/^\*\*([\d.]+)\*\*$/);
  assert.ok(value, `row "${rowLabel}" carries no bold number in its first column: ${row}`);
  return Number(value[1]);
}

const components = item.components ?? {};
const valueOf = (component) => (typeof component === 'object' && component !== null ? component.value : component);

test('Above-Water Trident item JSON', async (t) => {
  await t.test('identifier, Equipment, and the trident group', () => {
    assert.equal(item.description.identifier, 'andrew:above_water_trident');
    assert.equal(item.description.menu_category?.category, 'equipment');
    assert.equal(item.description.menu_category?.group, 'minecraft:itemGroup.name.trident');
  });

  // §2: vanilla minecraft:trident lands 9.00 on a bare target; the probe's
  // custom item with minecraft:damage 8 lands 9.00 as well (+1 for the hand).
  await t.test('minecraft:damage + 1 (hand) is the vanilla trident melee measured in probe-trident.md §2', () => {
    const section = probeSection(2);
    const vanilla = measured(section, '`minecraft:trident`');
    const probeItem = measured(section, 'пробный предмет, `damage` 8, slot `spear`');
    assert.equal(vanilla, 9, 'probe §2: vanilla trident melee, bare, dry');
    assert.equal(probeItem, vanilla, 'probe §2: the custom item with damage 8 lands what the vanilla trident lands');
    assert.equal(valueOf(components['minecraft:damage']), probeItem - 1, 'the item must carry the probed damage 8, not a number from memory');
  });

  await t.test('enchantable through the slot the engine names "spear", enchantability 1 like the vanilla trident', () => {
    // probe §2: slot "trident" fails parsing and the item loads with no components.
    assert.match(probeSection(2), /slot `spear`/);
    assert.deepEqual(components['minecraft:enchantable'], { slot: 'spear', value: 1 });
  });

  await t.test('charges on Use and never throws by itself (L0-adr-twth §1, probe §3)', () => {
    assert.equal(components['minecraft:use_modifiers']?.use_duration, 3600);
    assert.equal(components['minecraft:use_animation'], 'spear');
    for (const id of ['minecraft:throwable', 'minecraft:projectile', 'minecraft:shooter']) {
      assert.equal(components[id], undefined, `${id} would let the engine decide what a release does`);
    }
  });

  await t.test('one per slot, held like a weapon, admitted to the off hand, fire resistant', () => {
    assert.equal(components['minecraft:max_stack_size'], 1);
    assert.equal(components['minecraft:hand_equipped'], true);
    assert.equal(valueOf(components['minecraft:allow_off_hand']), true);
    assert.equal(valueOf(components['minecraft:fire_resistant']), true);
    // minecraft:fire_resistant is read only from format_version 1.21.90 on.
    assert.equal(readJson('packs', 'behavior', 'items', 'above_water_trident.json').format_version, '1.21.90');
  });

  await t.test('infinite durability by omission', () => {
    assert.equal(components['minecraft:durability'], undefined);
  });

  await t.test('named by the registry key and drawn with the icon the look task shipped', () => {
    assert.equal(valueOf(components['minecraft:display_name']), 'item.andrew:above_water_trident.name');
    assert.equal(components['minecraft:icon'], 'andrew_above_water_trident');
    const texture = atlas.texture_data[components['minecraft:icon']]?.textures;
    assert.equal(texture, 'textures/items/andrew_above_water_trident');
    assert.ok(existsSync(join(projectRoot, 'packs', 'resource', `${texture}.png`)));
  });
});

test('Above-Water Trident craft token', async (t) => {
  await t.test('hidden from Creative, looks like the weapon, stays out of the off hand', () => {
    assert.equal(token.description.identifier, 'andrew:above_water_trident_crafted');
    assert.equal(token.description.menu_category?.category, 'none');
    assert.deepEqual(token.components['minecraft:display_name'], components['minecraft:display_name']);
    assert.equal(token.components['minecraft:icon'], components['minecraft:icon']);
    assert.equal(token.components['minecraft:max_stack_size'], 1);
    assert.equal(token.components['minecraft:allow_off_hand'], undefined);
  });
});

test('Above-Water Trident recipe (spec §01)', async (t) => {
  await t.test('" G / BTB / G " — golden apple, water bucket, vanilla trident — on the crafting table', () => {
    assert.deepEqual(recipe.tags, ['crafting_table']);
    assert.deepEqual(recipe.pattern, [' G ', 'BTB', ' G ']);
    assert.deepEqual(recipe.key, {
      G: { item: 'minecraft:golden_apple' },
      B: { item: 'minecraft:water_bucket' },
      T: { item: 'minecraft:trident' },
    });
  });

  await t.test('outputs one token, and no recipe outputs the weapon itself', () => {
    assert.deepEqual(recipe.result, { item: 'andrew:above_water_trident_crafted', count: 1 });
    const recipes = join(projectRoot, 'packs', 'behavior', 'recipes');
    for (const file of readdirSync(recipes)) {
      const text = readFileSync(join(recipes, file), 'utf-8');
      assert.ok(!/"item"\s*:\s*"andrew:above_water_trident"/.test(text), `${file} outputs or uses the weapon itself`);
    }
  });
});
