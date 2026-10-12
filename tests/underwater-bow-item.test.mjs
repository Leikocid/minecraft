// The Underwater Bow as data (L0-uwbw-eitm): its item, craft token and recipe, checked against the shooter
// the probe measured (docs/feedback/probe-ubow.md §3) and against the look task's icon.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const readJson = (...parts) => JSON.parse(readFileSync(join(projectRoot, ...parts), 'utf-8'));

const itemFile = readJson('packs', 'behavior', 'items', 'underwater_bow.json');
const item = itemFile['minecraft:item'];
const token = readJson('packs', 'behavior', 'items', 'underwater_bow_crafted.json')['minecraft:item'];
const recipe = readJson('packs', 'behavior', 'recipes', 'underwater_bow.json')['minecraft:recipe_shaped'];
const probeShooter = readJson('packs', 'gametest', 'items', 'probe_ubow_shooter.json')['minecraft:item'].components;
const atlas = readJson('packs', 'resource', 'textures', 'item_texture.json');
const probe = readFileSync(join(projectRoot, 'docs', 'feedback', 'probe-ubow.md'), 'utf-8');

const components = item.components ?? {};
const valueOf = (component) => (typeof component === 'object' && component !== null ? component.value : component);

test('Underwater Bow item JSON', async (t) => {
  await t.test('identifier, Equipment, and the bow group', () => {
    assert.equal(item.description.identifier, 'andrew:underwater_bow');
    assert.equal(item.description.menu_category?.category, 'equipment');
    assert.equal(item.description.menu_category?.group, 'minecraft:itemGroup.name.bow');
  });

  // probe §3: this shooter repeats the vanilla bow's draw curve to the hundredth and takes Power, Punch, Flame
  // and Infinity. The shipped item must carry that shooter, not a variant nobody measured.
  await t.test('the shooter, draw and enchantable slot are the ones the probe measured against the vanilla bow', () => {
    assert.match(probe, /Кастомный shooter со `scale_power_by_draw_duration` повторяет кривую натяжения лука/);
    assert.deepEqual(components['minecraft:shooter'], probeShooter['minecraft:shooter']);
    assert.deepEqual(components['minecraft:enchantable'], probeShooter['minecraft:enchantable']);
    assert.deepEqual(components['minecraft:enchantable'], { slot: 'bow', value: 1 });
    assert.equal(components['minecraft:use_animation'], probeShooter['minecraft:use_animation']);
    assert.deepEqual(components['minecraft:use_modifiers'], probeShooter['minecraft:use_modifiers']);
  });

  await t.test('a bow, not a crossbow: no charge on draw, power scales with the draw, 1.0 s to full', () => {
    const shooter = components['minecraft:shooter'];
    assert.equal(shooter.charge_on_draw, false);
    assert.equal(shooter.scale_power_by_draw_duration, true);
    assert.equal(shooter.max_draw_duration, 1.0);
    assert.deepEqual(shooter.ammunition.map((a) => a.item), ['minecraft:arrow']);
  });

  await t.test('one per slot, held like a weapon, admitted to the off hand, fire resistant', () => {
    assert.equal(components['minecraft:max_stack_size'], 1);
    assert.equal(components['minecraft:hand_equipped'], true);
    assert.equal(valueOf(components['minecraft:allow_off_hand']), true);
    assert.equal(valueOf(components['minecraft:fire_resistant']), true);
    // minecraft:fire_resistant is read only from format_version 1.21.90 on.
    assert.equal(itemFile.format_version, '1.21.90');
  });

  await t.test('infinite durability by omission', () => {
    assert.equal(components['minecraft:durability'], undefined);
  });

  await t.test('named by the registry key and drawn with the icon the look task shipped', () => {
    assert.equal(valueOf(components['minecraft:display_name']), 'item.andrew:underwater_bow.name');
    assert.equal(components['minecraft:icon'], 'andrew_underwater_bow');
    const texture = atlas.texture_data[components['minecraft:icon']]?.textures;
    assert.equal(texture, 'textures/items/andrew_underwater_bow');
    assert.ok(existsSync(join(projectRoot, 'packs', 'resource', `${texture}.png`)));
  });
});

test('Underwater Bow craft token', async (t) => {
  await t.test('hidden from Creative, looks like the weapon, stays out of the off hand', () => {
    assert.equal(token.description.identifier, 'andrew:underwater_bow_crafted');
    assert.equal(token.description.menu_category?.category, 'none');
    assert.deepEqual(token.components['minecraft:display_name'], components['minecraft:display_name']);
    assert.equal(token.components['minecraft:icon'], components['minecraft:icon']);
    assert.equal(token.components['minecraft:max_stack_size'], 1);
    assert.equal(token.components['minecraft:allow_off_hand'], undefined);
    assert.equal(token.components['minecraft:shooter'], undefined, 'a token that shoots would be a second bow');
  });
});

test('Underwater Bow recipe (spec v3 §1)', async (t) => {
  await t.test('" R / WBW / S " — lightning rod, water bucket, vanilla bow, sand — on the crafting table', () => {
    assert.deepEqual(recipe.tags, ['crafting_table']);
    assert.deepEqual(recipe.pattern, [' R ', 'WBW', ' S ']);
    assert.deepEqual(recipe.key, {
      R: { item: 'minecraft:lightning_rod' },
      W: { item: 'minecraft:water_bucket' },
      B: { item: 'minecraft:bow' },
      S: { item: 'minecraft:sand' },
    });
  });

  await t.test('outputs one token, and no recipe outputs the weapon itself', () => {
    assert.deepEqual(recipe.result, { item: 'andrew:underwater_bow_crafted', count: 1 });
    const recipes = join(projectRoot, 'packs', 'behavior', 'recipes');
    for (const file of readdirSync(recipes)) {
      const text = readFileSync(join(recipes, file), 'utf-8');
      assert.ok(!/"item"\s*:\s*"andrew:underwater_bow"/.test(text), `${file} outputs or uses the weapon itself`);
    }
  });
});
