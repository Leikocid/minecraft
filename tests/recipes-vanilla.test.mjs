import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const recipesDir = join(__dirname, '..', 'packs', 'behavior', 'recipes');

const macePath = join(recipesDir, 'vanilla_mace.json');
const rocketPath = join(recipesDir, 'vanilla_firework_rocket.json');

const mace = JSON.parse(readFileSync(macePath, 'utf-8'));
const rocket = JSON.parse(readFileSync(rocketPath, 'utf-8'));

function countKey(pattern, key) {
  return pattern.join('').split('').filter((c) => c === key).length;
}

test('vanilla_mace recipe outputs 1 real vanilla minecraft:mace', () => {
  const r = mace['minecraft:recipe_shaped'];
  assert.equal(r.description.identifier, 'andrew:vanilla_mace');
  assert.deepEqual(r.tags, ['crafting_table']);
  assert.deepEqual(r.result, { item: 'minecraft:mace', count: 1 });
});

test('vanilla_mace consumes exactly 1 iron block and 1 breeze rod, centre over below-centre', () => {
  const r = mace['minecraft:recipe_shaped'];
  assert.equal(r.pattern.length, 3, 'pattern must be a full 3x3, not a 1x2 shorthand (xasm43)');
  assert.ok(r.pattern.every((row) => row.length === 3), 'every pattern row must be 3 cells wide');
  assert.equal(r.pattern[0], '   ', 'top row must be declared blank, not omitted');
  assert.equal(r.key.I.item, 'minecraft:iron_block');
  assert.equal(r.key.Z.item, 'minecraft:breeze_rod');
  assert.equal(countKey(r.pattern, 'I'), 1);
  assert.equal(countKey(r.pattern, 'Z'), 1);
  assert.equal(r.pattern[1][1], 'I', 'iron block must sit in the centre cell');
  assert.equal(r.pattern[2][1], 'Z', 'breeze rod must sit directly below the centre cell');
});

test('vanilla_firework_rocket recipe outputs 3 real vanilla minecraft:firework_rocket', () => {
  const r = rocket['minecraft:recipe_shaped'];
  assert.equal(r.description.identifier, 'andrew:vanilla_firework_rocket');
  assert.deepEqual(r.tags, ['crafting_table']);
  assert.deepEqual(r.result, { item: 'minecraft:firework_rocket', count: 3 });
});

test('vanilla_firework_rocket consumes exactly 1 paper and 1 string, centre over below-centre', () => {
  const r = rocket['minecraft:recipe_shaped'];
  assert.equal(r.pattern.length, 3, 'pattern must be a full 3x3, not a 1x2 shorthand (xasm43)');
  assert.ok(r.pattern.every((row) => row.length === 3), 'every pattern row must be 3 cells wide');
  assert.equal(r.pattern[0], '   ', 'top row must be declared blank, not omitted');
  assert.equal(r.key.P.item, 'minecraft:paper');
  assert.equal(r.key.S.item, 'minecraft:string');
  assert.equal(countKey(r.pattern, 'P'), 1);
  assert.equal(countKey(r.pattern, 'S'), 1);
  assert.equal(r.pattern[1][1], 'P', 'paper must sit in the centre cell');
  assert.equal(r.pattern[2][1], 'S', 'string must sit directly below the centre cell');
});

test('neither new recipe carries a craft gate, token, or any legendary machinery', () => {
  for (const json of [mace, rocket]) {
    const r = json['minecraft:recipe_shaped'];
    assert.ok(!JSON.stringify(r).includes('_crafted'), 'no craft token result');
    assert.ok(!r.result.item.startsWith('andrew:'), 'result must be a plain vanilla item id');
  }
});

// C-40 / R-uwbw-004 item 3: no shape in packs/behavior/recipes/*.json may collide
// with another — same item at every one of the 9 cells. Every recipe here is a
// full 3x3 shaped pattern (confirmed per file below), so the canonical form is
// just "item id or null" at each of the 9 absolute cells; two recipes collide
// only if that 9-cell map is identical.
function canonicalGrid(json, file) {
  const r = json['minecraft:recipe_shaped'];
  if (!r) return null; // shapeless or a non-recipe file: cannot collide with a shaped 3x3
  assert.equal(r.pattern.length, 3, `${file}: expected a 3-row pattern`);
  const cells = [];
  for (const row of r.pattern) {
    assert.equal(row.length, 3, `${file}: expected a 3-column pattern`);
    for (const ch of row) {
      cells.push(ch === ' ' ? null : r.key[ch]?.item ?? ch);
    }
  }
  return cells;
}

test('the two new patterns do not collide with each other or with any existing packs/behavior/recipes/*.json', () => {
  const files = readdirSync(recipesDir).filter((f) => f.endsWith('.json'));
  const grids = files.map((file) => ({
    file,
    grid: canonicalGrid(JSON.parse(readFileSync(join(recipesDir, file), 'utf-8')), file),
  }));
  for (let i = 0; i < grids.length; i++) {
    for (let j = i + 1; j < grids.length; j++) {
      if (grids[i].grid === null || grids[j].grid === null) continue;
      assert.notDeepEqual(grids[i].grid, grids[j].grid, `${grids[i].file} collides with ${grids[j].file}`);
    }
  }
});

// R-uwbw-004 item 3: the two vanilla recipes an operator could confuse ours with.
// Both share one ingredient with a new recipe (breeze_rod, paper) but differ in
// the other, so they are a different ingredient set even though the shapes may
// coincide in outline.
test('the new recipes differ from their vanilla look-alikes by ingredient, not just by shape', () => {
  const r = mace['minecraft:recipe_shaped'];
  assert.notEqual(r.key.I.item, 'minecraft:heavy_core', 'the new Mace recipe must not reuse the vanilla Heavy Core ingredient');
  const f = rocket['minecraft:recipe_shaped'];
  assert.notEqual(f.key.S.item, 'minecraft:gunpowder', 'the new rocket recipe must not reuse the vanilla Gunpowder ingredient');
});
