import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const elytraPath = join(projectRoot, 'packs', 'behavior', 'recipes', 'elytra.json');
const totemPath = join(projectRoot, 'packs', 'behavior', 'recipes', 'totem_of_undying.json');

const elytra = JSON.parse(readFileSync(elytraPath, 'utf-8'));
const totem = JSON.parse(readFileSync(totemPath, 'utf-8'));

function countKey(pattern, key) {
  return pattern.join('').split('').filter((c) => c === key).length;
}

test('elytra recipe outputs the real vanilla item, not a substitute', () => {
  const r = elytra['minecraft:recipe_shaped'];
  assert.equal(r.description.identifier, 'andrew:elytra');
  assert.deepEqual(r.tags, ['crafting_table']);
  assert.deepEqual(r.result, { item: 'minecraft:elytra', count: 1 });
});

test('elytra recipe consumes exactly 6 feathers and 1 diamond chestplate', () => {
  const r = elytra['minecraft:recipe_shaped'];
  assert.equal(r.key.F.item, 'minecraft:feather');
  assert.equal(r.key.C.item, 'minecraft:diamond_chestplate');
  assert.equal(countKey(r.pattern, 'F'), 6);
  assert.equal(countKey(r.pattern, 'C'), 1);
});

test('totem recipe outputs the real vanilla item, not a substitute', () => {
  const r = totem['minecraft:recipe_shaped'];
  assert.equal(r.description.identifier, 'andrew:totem_of_undying');
  assert.deepEqual(r.tags, ['crafting_table']);
  assert.deepEqual(r.result, { item: 'minecraft:totem_of_undying', count: 1 });
});

test('totem recipe consumes exactly 8 gold ingots and 1 emerald', () => {
  const r = totem['minecraft:recipe_shaped'];
  assert.equal(r.key.G.item, 'minecraft:gold_ingot');
  assert.equal(r.key.E.item, 'minecraft:emerald');
  assert.equal(countKey(r.pattern, 'G'), 8);
  assert.equal(countKey(r.pattern, 'E'), 1);
});

test('neither recipe carries a craft gate, token, or any legendary machinery', () => {
  for (const json of [elytra, totem]) {
    const r = json['minecraft:recipe_shaped'];
    assert.ok(!JSON.stringify(r).includes('_crafted'), 'no craft token result');
    assert.ok(!r.result.item.startsWith('andrew:'), 'result must be a plain vanilla item id');
  }
});

test('the two recipe patterns do not collide with each other', () => {
  assert.notDeepEqual(elytra['minecraft:recipe_shaped'].pattern, totem['minecraft:recipe_shaped'].pattern);
});
