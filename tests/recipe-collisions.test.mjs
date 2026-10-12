// The GameTest pack loads beside the behavior pack, and of two shaped recipes with the same grid the engine crafts
// one: on BDS 1.26.51.1 the Crafter made andrew:probe_ubow_buckets' token from the Underwater Bow's grid and the
// shipped Trident token from probe_trident_buckets' grid. A test recipe that repeats a shipped grid silently takes
// over the product's craft, or the product takes over the probe's.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Every shaped recipe of one pack, as its grid of item ids with the empty outer rows and columns trimmed. */
function shapedGrids(pack) {
  const dir = join(projectRoot, 'packs', pack, 'recipes');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .flatMap((file) => {
      const recipe = JSON.parse(readFileSync(join(dir, file), 'utf-8'))['minecraft:recipe_shaped'];
      if (recipe === undefined) return [];
      const cell = (ch) => {
        if (ch === ' ') return '';
        const key = recipe.key[ch];
        return typeof key === 'string' ? key : `${key.item}${key.data === undefined ? '' : `:${key.data}`}`;
      };
      let rows = recipe.pattern.map((row) => [...row].map(cell));
      const width = Math.max(...rows.map((r) => r.length));
      rows = rows.map((r) => [...r, ...Array(width - r.length).fill('')]);
      while (rows.length > 0 && rows[0].every((c) => c === '')) rows.shift();
      while (rows.length > 0 && rows.at(-1).every((c) => c === '')) rows.pop();
      while (rows.length > 0 && rows.every((r) => r[0] === '')) rows = rows.map((r) => r.slice(1));
      while (rows.length > 0 && rows.every((r) => r.at(-1) === '')) rows = rows.map((r) => r.slice(0, -1));
      return [{ file: `packs/${pack}/recipes/${file}`, grid: rows.map((r) => r.join(',')).join(' / '), tags: recipe.tags ?? [] }];
    });
}

test('no GameTest-pack recipe repeats a shipped recipe\'s grid', () => {
  const shipped = shapedGrids('behavior');
  const collisions = shapedGrids('gametest').flatMap((probe) =>
    shipped
      .filter((product) => probe.grid === product.grid && probe.tags.some((t) => product.tags.includes(t)))
      .map((product) => `${probe.file} has the grid of ${product.file}: ${probe.grid}`)
  );
  assert.deepEqual(collisions, []);
});

test('the grid reader sees through a shifted shape (control)', () => {
  const [bow] = shapedGrids('behavior').filter((r) => r.file.endsWith('/underwater_bow.json'));
  assert.equal(bow.grid, ',minecraft:lightning_rod, / minecraft:water_bucket,minecraft:bow,minecraft:water_bucket / ,minecraft:sand,');
  const [mace] = shapedGrids('behavior').filter((r) => r.file.endsWith('/vanilla_mace.json'));
  assert.equal(mace.grid, 'minecraft:iron_block / minecraft:breeze_rod', 'outer empty rows and columns are trimmed');
});
