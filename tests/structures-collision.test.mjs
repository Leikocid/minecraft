// Collision heuristic (src/structures/collision.ts): the `player` rule keeps
// a structure off every block that can hold a player's items. fillBlocks and
// structureManager.place erase such a block's contents with no spill
// (CNTR-XCX10-AA F2), so a holder missing here is overwritten silently.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const bundle = await build({
  entryPoints: [join(projectRoot, 'src/structures/collision.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  external: ['@minecraft/server'],
  write: false,
});
const { SCAN_RULES, scanCollision, collisionBox } = await import(
  'data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64')
);

const COLORS = [
  'white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime', 'pink', 'gray',
  'light_gray', 'cyan', 'purple', 'blue', 'brown', 'green', 'red', 'black',
];

const HOLDERS = [
  'hopper', 'dropper', 'dispenser', 'crafter', 'decorated_pot', 'frame', 'glow_frame',
  'undyed_shulker_box', ...COLORS.map((c) => `${c}_shulker_box`),
].map((id) => `minecraft:${id}`);

const playerRules = SCAN_RULES.filter((r) => r.kind === 'player');
/** Player-rule ids that apply in every dimension at every height, as chests do. */
const everywhere = new Set(playerRules.filter((r) => r.dims === undefined && r.minY === undefined && r.maxY === undefined).flatMap((r) => r.types));

test('player rule: hopper, dropper, dispenser, every shulker box, crafter, decorated pot and both item frames are listed', () => {
  const missing = HOLDERS.filter((id) => !everywhere.has(id));
  assert.deepEqual(missing, [], `not in the player rule: ${missing.join(' ')}`);
  assert.equal(HOLDERS.filter((id) => id.endsWith('_shulker_box')).length, 17, 'undyed + 16 colours');
});

test('player rule: the holders it already had stay listed', () => {
  for (const id of ['chest', 'trapped_chest', 'barrel', 'ender_chest', 'furnace', 'blast_furnace', 'smoker', 'brewing_stand']) {
    assert.ok(everywhere.has(`minecraft:${id}`), `${id} dropped from the player rule`);
  }
});

test('scanCollision: a lone hopper or shulker box in the box is a player collision; the same box empty is clear', () => {
  const box = collisionBox([100, 64, -40], [35, 30, 35]);
  // A dense engine-side search: `contains` answers whether any of `types` is in the volume.
  const viewWith = (block) => ({
    contains: (lo, hi, types) =>
      block !== undefined && types.includes(block.id) &&
      [0, 1, 2].every((k) => block.at[k] >= lo[k] && block.at[k] <= hi[k]),
  });
  for (const id of ['minecraft:hopper', 'minecraft:purple_shulker_box', 'minecraft:glow_frame']) {
    assert.deepEqual(scanCollision(viewWith({ id, at: [117, 65, -23] }), 'o', box), { kind: 'hit', collision: 'player' }, id);
    assert.deepEqual(scanCollision(viewWith({ id, at: [117, 65, -23] }), 'n', box), { kind: 'hit', collision: 'player' }, `${id} in the Nether`);
  }
  assert.deepEqual(scanCollision(viewWith(undefined), 'o', box), { kind: 'clear' });
});
