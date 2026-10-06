// The shared Survival-unbreakable deny list (L0-sclk-r010, L0-sclk-ac22, xcx25): one list for every
// weapon terrain edit, the Orbital penetrator's name re-exporting it rather than copying it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

const bundle = await build({
  stdin: {
    contents: [
      "export { TERRAIN_KEEP } from './terrain/keep';",
      "export { PENETRATOR_KEEP } from './orbital/penetrator-keep';",
    ].join('\n'),
    resolveDir: srcDir,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
});
const { TERRAIN_KEEP, PENETRATOR_KEEP } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64'));

test('r010: the penetrator list is the shared list itself, not a copy', () => {
  assert.equal(PENETRATOR_KEEP, TERRAIN_KEEP);
  assert.equal(TERRAIN_KEEP.size, 35);
});

test('ac22: Reinforced Deepslate, Obsidian and Ancient Debris stay off the shared list — both weapons carve them', () => {
  for (const id of ['minecraft:reinforced_deepslate', 'minecraft:obsidian', 'minecraft:ancient_debris', 'minecraft:portal']) {
    assert.equal(TERRAIN_KEEP.has(id), false, id);
  }
  for (const id of ['minecraft:bedrock', 'minecraft:barrier', 'minecraft:end_portal_frame', 'minecraft:light_block_7']) {
    assert.equal(TERRAIN_KEEP.has(id), true, id);
  }
});
