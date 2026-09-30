// LMB penetrator column plan and cell classifier over plain values
// (L0-pntr-ent1, L0-pntr-ad02, L0-pntr-r001, L0-pntr-r002, L0-pntr-ent3).
// The bundled files must stay free of runtime @minecraft/server imports so
// that planning can never touch the world; the stub below throws on load if
// one appears.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const orbitalDir = join(__dirname, '..', 'src', 'orbital');

const minecraftServerStub = {
  name: 'minecraft-server-stub',
  setup(pluginBuild) {
    pluginBuild.onResolve({ filter: /^@minecraft\/server$/ }, () => ({
      path: '@minecraft/server',
      namespace: 'mc-stub',
    }));
    pluginBuild.onLoad({ filter: /.*/, namespace: 'mc-stub' }, () => ({
      contents: 'throw new Error("src/orbital/penetrator-plan.ts must stay free of runtime @minecraft/server imports");',
      loader: 'js',
    }));
  },
};

const bundle = await build({
  stdin: {
    contents: ['penetrator-plan', 'penetrator-keep'].map((f) => `export * from './${f}';`).join('\n'),
    resolveDir: orbitalDir,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  plugins: [minecraftServerStub],
});

const mod = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64'));
const { planColumn, layerOffsets, isPlannedCell, classify, PENETRATOR_KEEP, BAND_HEIGHT, MASK_RADIUS } = mod;

// Dimension.heightRange on BDS 1.26.51.1.
const HEIGHT = {
  'minecraft:overworld': { min: -64, max: 320 },
  'minecraft:nether': { min: 0, max: 128 },
  'minecraft:the_end': { min: 0, max: 256 },
};

function randomAttackId(i) {
  return `oc-${i}-${Math.random().toString(36).slice(2)}`;
}

// ------------------------------------------------------------------ AC#1: determinism

test('planColumn: two calls with the same args give bitwise-equal masks', () => {
  const a = planColumn('oc-42-7', { x: 10, y: 64, z: -3 }, HEIGHT['minecraft:overworld']);
  const b = planColumn('oc-42-7', { x: 10, y: 64, z: -3 }, HEIGHT['minecraft:overworld']);
  assert.deepStrictEqual(a, b);
});

test('planColumn: Math.random is never used — the PRNG is seeded only from attackId', () => {
  const original = Math.random;
  Math.random = () => {
    throw new Error('Math.random must not be called by planColumn');
  };
  try {
    planColumn('oc-99-1', { x: 0, y: 64, z: 0 }, HEIGHT['minecraft:overworld']);
  } finally {
    Math.random = original;
  }
});

test('planColumn: different attackId gives a different mask set', () => {
  const a = planColumn('attack-a', { x: 0, y: 64, z: 0 }, HEIGHT['minecraft:overworld']);
  const b = planColumn('attack-b', { x: 0, y: 64, z: 0 }, HEIGHT['minecraft:overworld']);
  assert.notDeepEqual([...a.masks[0]], [...b.masks[0]]);
});

// ------------------------------------------------------------------ AC#2: mask shape

test('planColumn: the 3x3 core is in every layer, over 200 random attacks', () => {
  for (let i = 0; i < 200; i++) {
    const plan = planColumn(randomAttackId(i), { x: 0, y: 64, z: 0 }, HEIGHT['minecraft:overworld']);
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        assert.ok(isPlannedCell(plan, dx, plan.top, dz), `core cell (${dx},${dz}) missing for ${plan.attackId}`);
      }
    }
  }
});

test('planColumn: layer cell count stays within 9..33 over 200 random attacks, and not every layer is a perfect 5x5', () => {
  let sawNonSquare = false;
  for (let i = 0; i < 200; i++) {
    const plan = planColumn(randomAttackId(i), { x: 0, y: 64, z: 0 }, HEIGHT['minecraft:overworld']);
    const cells = layerOffsets(plan, plan.top);
    assert.ok(cells.length >= 9 && cells.length <= 33, `layer had ${cells.length} cells for ${plan.attackId}`);

    const isPerfect5x5 = cells.length === 25 && cells.every((c) => Math.abs(c.dx) <= 2 && Math.abs(c.dz) <= 2);
    if (!isPerfect5x5) sawNonSquare = true;
  }
  assert.ok(sawNonSquare, 'expected at least one layer that is not a perfect 5x5 square');
});

test('planColumn: the mask changes once per 4-layer band', () => {
  const plan = planColumn('oc-band-1', { x: 0, y: 64, z: 0 }, HEIGHT['minecraft:overworld']);
  assert.equal(BAND_HEIGHT, 4);
  const top = plan.top;
  const bandZero = layerOffsets(plan, top);
  for (let dy = 1; dy < BAND_HEIGHT; dy++) {
    assert.deepEqual(layerOffsets(plan, top - dy), bandZero, `layer top-${dy} should share band 0's mask`);
  }
  const bandOne = layerOffsets(plan, top - BAND_HEIGHT);
  assert.notDeepEqual(bandOne, bandZero, 'band 1 should draw its own mask, not reuse band 0');
});

// ------------------------------------------------------------------ AC#3: vertical geometry

test('planColumn: vertical range per dimension, top = trigger y, bottom = heightRange.min, nothing above top', () => {
  for (const [dim, range] of Object.entries(HEIGHT)) {
    const triggerY = range.min + 50;
    const plan = planColumn('oc-vert-1', { x: 5, y: triggerY, z: 5 }, range);
    assert.equal(plan.top, triggerY, dim);
    assert.equal(plan.bottom, range.min, dim);
    assert.equal(layerOffsets(plan, triggerY + 1).length, 0, `${dim}: a cell above the trigger must never be planned`);
    assert.ok(layerOffsets(plan, plan.bottom).length > 0, `${dim}: the bottom layer must still be planned`);
  }
});

test('planColumn: a trigger at or below the floor gives a one-layer column', () => {
  const range = HEIGHT['minecraft:overworld'];
  const atFloor = planColumn('oc-floor-1', { x: 0, y: range.min, z: 0 }, range);
  assert.equal(atFloor.top, range.min);
  assert.equal(atFloor.bottom, range.min);
  assert.equal(atFloor.masks.length, 1);

  const belowFloor = planColumn('oc-floor-2', { x: 0, y: range.min - 5, z: 0 }, range);
  assert.equal(belowFloor.top, range.min - 5);
  assert.equal(belowFloor.bottom, range.min - 5);
  assert.equal(belowFloor.masks.length, 1);
});

// ------------------------------------------------------------------ AC#4: PENETRATOR_KEEP (xasm6)

// xasm6 names the light block once; a placed one is light_block_<level> on BDS 1.26.51.1 (probe_pntr_holders).
test('PENETRATOR_KEEP is exactly the xasm6 list, light blocks by the ids the engine places', () => {
  const expected = [
    'bedrock',
    'end_portal_frame',
    'end_portal',
    'end_gateway',
    'barrier',
    'light_block',
    ...Array.from({ length: 16 }, (_, level) => `light_block_${level}`),
    'command_block',
    'chain_command_block',
    'repeating_command_block',
    'structure_block',
    'structure_void',
    'jigsaw',
    'allow',
    'deny',
    'border_block',
    'invisible_bedrock',
    'moving_block',
    'piston_arm_collision',
    'sticky_piston_arm_collision',
  ].map((id) => `minecraft:${id}`);
  assert.deepEqual([...PENETRATOR_KEEP].sort(), [...expected].sort());
});

test('PENETRATOR_KEEP excludes Obsidian, Reinforced Deepslate and Ancient Debris — hard, but breakable', () => {
  for (const id of ['minecraft:obsidian', 'minecraft:reinforced_deepslate', 'minecraft:ancient_debris']) {
    assert.equal(PENETRATOR_KEEP.has(id), false, id);
  }
});

// ------------------------------------------------------------------ AC#5: classify order

const cell = (typeId, over = {}) => ({
  typeId,
  isAir: false,
  isLiquid: false,
  isWaterlogged: false,
  hasInventory: false,
  ...over,
});

test('classify: air is skip', () => {
  assert.equal(classify(cell('minecraft:air', { isAir: true })), 'skip');
});

test('classify: water and lava are keep', () => {
  assert.equal(classify(cell('minecraft:water', { isLiquid: true })), 'keep');
  assert.equal(classify(cell('minecraft:lava', { isLiquid: true })), 'keep');
});

test('classify: bedrock (the keep list) is keep', () => {
  assert.equal(classify(cell('minecraft:bedrock')), 'keep');
});

test('classify: a chest is removeContainer', () => {
  assert.equal(classify(cell('minecraft:chest', { hasInventory: true })), 'removeContainer');
});

test('classify: a waterlogged fence is removeWaterlogged', () => {
  assert.equal(classify(cell('minecraft:oak_fence', { isWaterlogged: true })), 'removeWaterlogged');
});

test('classify: a waterlogged chest is removeContainer, not removeWaterlogged', () => {
  assert.equal(classify(cell('minecraft:chest', { hasInventory: true, isWaterlogged: true })), 'removeContainer');
});

test('classify: a torch and a flower are remove', () => {
  assert.equal(classify(cell('minecraft:torch')), 'remove');
  assert.equal(classify(cell('minecraft:dandelion')), 'remove');
});

test('classify: obsidian is remove — hard, but not on the keep list', () => {
  assert.equal(classify(cell('minecraft:obsidian')), 'remove');
});

test('MASK_RADIUS is 3 (a 7x7 mask)', () => {
  assert.equal(MASK_RADIUS, 3);
});
