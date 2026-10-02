// Orbital Cannon core over plain values: spawn height (L0-orbc-r007, AC-4),
// the contact set (L0-orbc-r008, -as03), target distance (L0-orbc-ad01) and
// the stub effect. The orbital files bundled here must stay free of runtime
// @minecraft/server imports; the stub below throws on load if one appears.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MinecraftBlockTypes } from '@minecraft/vanilla-data';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const orbitalDir = join(projectRoot, 'src', 'orbital');

const minecraftServerStub = {
  name: 'minecraft-server-stub',
  setup(pluginBuild) {
    pluginBuild.onResolve({ filter: /^@minecraft\/server$/ }, () => ({
      path: '@minecraft/server',
      namespace: 'mc-stub',
    }));
    pluginBuild.onLoad({ filter: /.*/, namespace: 'mc-stub' }, () => ({
      contents: 'throw new Error("src/orbital/{charge,spawn,target,stub-effect}.ts must stay free of runtime @minecraft/server imports");',
      loader: 'js',
    }));
  },
};

const bundle = await build({
  stdin: {
    contents: ['charge', 'spawn', 'target', 'stub-effect'].map((f) => `export * from './${f}';`).join('\n'),
    resolveDir: orbitalDir,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  plugins: [minecraftServerStub],
});

const core = await import(
  'data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64')
);
const {
  spawnY,
  SPAWN_OFFSET,
  DEFAULT_SPAWN_OFFSET,
  chargeLocation,
  isContact,
  PASS_THROUGH,
  distanceToBlock,
  TARGET_RANGE,
  registerEffect,
  effectFor,
  attackTag,
  CHARGE_TAG,
  CHARGE_ENTITY_ID,
  SCALE_SPAWN_EVENTS,
  STUB_EFFECTS,
  STUB_RMB_COLUMNS,
  stubGrid,
} = core;

// Dimension.heightRange on BDS 1.26.51.1: max is the first Y above the build limit.
const HEIGHT = {
  'minecraft:overworld': { min: -64, max: 320 },
  'minecraft:nether': { min: 0, max: 128 },
  'minecraft:the_end': { min: 0, max: 256 },
};

// ------------------------------------------------------------------ AC#2: spawn height

test('spawnY: the AC-4 table', () => {
  const cases = [
    ['minecraft:overworld', 64, 124],
    ['minecraft:the_end', 60, 120],
    ['minecraft:nether', 40, 50],
    ['minecraft:overworld', 300, 319],
    ['minecraft:nether', 120, 127],
  ];
  for (const [dim, y, expected] of cases) {
    assert.equal(spawnY(dim, y, HEIGHT[dim]), expected, `${dim} y=${y}`);
  }
});

test('spawnY: the offsets are held — +60 Overworld and End, +10 Nether, +60 anywhere else', () => {
  assert.deepEqual({ ...SPAWN_OFFSET }, { 'minecraft:overworld': 60, 'minecraft:the_end': 60, 'minecraft:nether': 10 });
  assert.equal(DEFAULT_SPAWN_OFFSET, 60);
  assert.equal(spawnY('andrew:elsewhere', 10, { min: 0, max: 256 }), 70);
});

test('spawnY: the ceiling is max − 1 exactly, and there is no floor clamp', () => {
  assert.equal(spawnY('minecraft:overworld', 259, HEIGHT['minecraft:overworld']), 319);
  assert.equal(spawnY('minecraft:overworld', 260, HEIGHT['minecraft:overworld']), 319);
  assert.equal(spawnY('minecraft:overworld', 258, HEIGHT['minecraft:overworld']), 318);
  assert.equal(spawnY('minecraft:nether', 127, HEIGHT['minecraft:nether']), 127);
  assert.equal(spawnY('minecraft:overworld', -64, HEIGHT['minecraft:overworld']), -4);
});

test('chargeLocation: the column centre at spawnY', () => {
  assert.deepEqual(chargeLocation({ x: 12, z: -7 }, 94), { x: 12.5, y: 94, z: -6.5 });
});

// ------------------------------------------------------------------ AC#8: contact

const block = (typeId, { isAir = false, isLiquid = false, height } = {}) => ({
  typeId: `minecraft:${typeId}`,
  isAir,
  isLiquid,
  permutation: { getState: (name) => (name === 'height' ? height : undefined) },
});

const PASSES = {
  grass: ['short_grass', 'tall_grass', 'short_dry_grass', 'tall_dry_grass', 'bush', 'firefly_bush', 'fern', 'large_fern', 'deadbush'],
  flowers: [
    'dandelion', 'poppy', 'blue_orchid', 'allium', 'azure_bluet', 'red_tulip', 'orange_tulip', 'white_tulip',
    'pink_tulip', 'oxeye_daisy', 'cornflower', 'lily_of_the_valley', 'wither_rose', 'torchflower', 'sunflower',
    'lilac', 'rose_bush', 'peony', 'pitcher_plant', 'pink_petals', 'wildflowers', 'open_eyeblossom',
    'closed_eyeblossom', 'cactus_flower',
  ],
  saplings: [
    'oak_sapling', 'spruce_sapling', 'birch_sapling', 'jungle_sapling', 'acacia_sapling', 'dark_oak_sapling',
    'cherry_sapling', 'pale_oak_sapling', 'mangrove_propagule', 'bamboo_sapling',
  ],
  torches: [
    'torch', 'soul_torch', 'copper_torch', 'redstone_torch', 'unlit_redstone_torch', 'underwater_torch',
    'colored_torch_red', 'colored_torch_green', 'colored_torch_blue', 'colored_torch_purple',
  ],
  rails: ['rail', 'golden_rail', 'detector_rail', 'activator_rail'],
  redstone: ['redstone_wire'],
  vines: ['vine', 'weeping_vines', 'twisting_vines', 'cave_vines', 'cave_vines_body_with_berries', 'cave_vines_head_with_berries'],
  web: ['web'],
  sugarCane: ['reeds'],
  water: ['kelp', 'seagrass'],
  fire: ['fire', 'soul_fire'],
  technical: ['structure_void', ...Array.from({ length: 16 }, (_, i) => `light_block_${i}`)],
};

const CONTACTS = [
  'stone', 'bedrock', 'dirt', 'grass_block', 'oak_leaves', 'glass', 'glass_pane', 'oak_slab', 'smooth_stone_slab',
  'white_carpet', 'moss_carpet', 'oak_fence', 'nether_brick_fence', 'barrier', 'obsidian', 'chest',
];

test('PASS_THROUGH is exactly the as03 list — a block added or dropped here changes where charges stop', () => {
  const expected = new Set(Object.values(PASSES).flat().map((id) => `minecraft:${id}`));
  assert.deepEqual([...PASS_THROUGH].sort(), [...expected].sort());
});

test('every PASS_THROUGH id and every contact control is a real 1.26.51 block id', () => {
  const known = new Set(Object.values(MinecraftBlockTypes));
  for (const id of [...PASS_THROUGH, ...CONTACTS.map((c) => `minecraft:${c}`), 'minecraft:snow_layer']) {
    assert.ok(known.has(id), `${id} is not a block in @minecraft/vanilla-data 1.26.51 — a typo would make it silently a contact block`);
  }
});

test('isContact: grass, flowers, saplings, torches, rails, wire, vines, web, sugar cane, kelp, fire, structure_void and light blocks pass', () => {
  for (const [group, ids] of Object.entries(PASSES)) {
    for (const id of ids) assert.equal(isContact(block(id)), false, `${group}: ${id} must pass through`);
  }
});

test('isContact: one snow layer passes, two or more stop the charge', () => {
  assert.equal(isContact(block('snow_layer', { height: 0 })), false);
  for (let height = 1; height <= 7; height++) {
    assert.equal(isContact(block('snow_layer', { height })), true, `snow_layer height=${height}`);
  }
  assert.equal(isContact(block('snow')), true, 'a full snow block');
});

test('isContact: leaves, glass, slabs, carpets, fences and barrier are contact', () => {
  for (const id of CONTACTS) assert.equal(isContact(block(id)), true, id);
});

test('isContact: air and liquids never stop a charge', () => {
  assert.equal(isContact(block('air', { isAir: true })), false);
  for (const id of ['water', 'flowing_water', 'lava', 'flowing_lava']) {
    assert.equal(isContact(block(id, { isLiquid: true })), false, id);
  }
});

// ------------------------------------------------------------------ target distance (ad01)

test('distanceToBlock: eye to the nearest point of the block, by geometry', () => {
  const eye = { x: 3.5, y: 3.52, z: 5.5 };
  // North at eye level: near face z = -4 → 9.5; one further → 10.5.
  assert.equal(distanceToBlock(eye, { x: 3, y: 3, z: -5 }), 9.5);
  assert.equal(distanceToBlock(eye, { x: 3, y: 3, z: -6 }), 10.5);
  // South and East, whose near face is the block's own plane: the faceLocation trap (CNTR-XCX14).
  assert.equal(distanceToBlock(eye, { x: 3, y: 3, z: 10 }), 4.5);
  assert.equal(distanceToBlock(eye, { x: 8, y: 3, z: 5 }), 4.5);
  // Below and diagonal.
  assert.ok(Math.abs(distanceToBlock(eye, { x: 3, y: 1, z: 5 }) - 1.52) < 1e-9);
  assert.ok(Math.abs(distanceToBlock(eye, { x: 5, y: 3, z: 7 }) - Math.hypot(1.5, 1.5)) < 1e-9);
  // Inside the block.
  assert.equal(distanceToBlock(eye, { x: 3, y: 3, z: 5 }), 0);
  assert.equal(TARGET_RANGE, 25);
});

// ------------------------------------------------------------------ contract (r014) and stub

test('charge identity: entity id, static tag, attack tag and the scale spawn events', () => {
  assert.equal(CHARGE_ENTITY_ID, 'andrew:orbital_charge');
  assert.equal(CHARGE_TAG, 'andrew:oc_charge');
  assert.equal(attackTag('oc-12-3'), 'andrew:oc_attack:oc-12-3');
  const events = JSON.parse(readFileSync(join(projectRoot, 'packs', 'behavior', 'entities', 'orbital_charge.json'), 'utf-8'))[
    'minecraft:entity'
  ].events;
  assert.deepEqual({ ...SCALE_SPAWN_EVENTS }, { 0: 'andrew:scale_rmb', 1: 'andrew:scale_lmb' });
  for (const name of Object.values(SCALE_SPAWN_EVENTS)) assert.ok(name in events, `${name} is not an event of the charge entity`);
});

test('registerEffect: a later registration for a mode replaces the earlier one', () => {
  const a = { layout: () => [], onDetonate() {}, scale: 1 };
  const b = { layout: () => [], onDetonate() {}, scale: 1 };
  registerEffect('lmb', a);
  assert.equal(effectFor('lmb'), a);
  registerEffect('lmb', b);
  assert.equal(effectFor('lmb'), b);
});

test('stub LMB: one column, the target’s own, scale 1', () => {
  assert.deepEqual(STUB_EFFECTS.lmb.layout({ x: 4, y: 64, z: -9 }), [{ x: 4, z: -9 }]);
  assert.equal(STUB_EFFECTS.lmb.scale, 1);
});

test('stub RMB: 160 distinct grid columns around the target, its own first, scale 0', () => {
  const target = { x: 100, y: 64, z: -20 };
  const cols = STUB_EFFECTS.rmb.layout(target);
  assert.equal(STUB_RMB_COLUMNS, 160);
  assert.equal(cols.length, 160);
  assert.deepEqual(cols[0], { x: 100, z: -20 });
  assert.equal(new Set(cols.map((c) => `${c.x},${c.z}`)).size, 160);
  for (const c of cols) {
    assert.ok(Number.isInteger(c.x) && Number.isInteger(c.z));
    assert.ok(Math.hypot(c.x - target.x, c.z - target.z) <= 7.5, `${c.x},${c.z} is off the grid`);
  }
  assert.deepEqual(stubGrid(target), cols);
  assert.equal(STUB_EFFECTS.rmb.scale, 0);
});

test('stub onDetonate: one log line and one sound at the point', () => {
  const sounds = [];
  const warn = console.warn;
  const lines = [];
  console.warn = (msg) => lines.push(msg);
  try {
    STUB_EFFECTS.rmb.onDetonate({ id: 'minecraft:overworld', playSound: (id, at) => sounds.push([id, at]) }, { x: 1, y: 2, z: 3 }, 'owner', 'rmb', 'oc-1-1');
  } finally {
    console.warn = warn;
  }
  assert.equal(lines.length, 1);
  assert.match(lines[0], /orbital stub rmb: detonation at 1,2,3 in minecraft:overworld, attack oc-1-1/);
  assert.deepEqual(sounds, [['random.explode', { x: 1, y: 2, z: 3 }]]);
});

// ------------------------------------------------------------------ silence (r004, as06)

test('the orbital module sends no chat, title or action-bar text of its own', () => {
  for (const file of readdirSync(orbitalDir).filter((f) => f.endsWith('.ts'))) {
    const source = readFileSync(join(orbitalDir, file), 'utf-8');
    assert.doesNotMatch(source, /sendMessage|setActionBar|setTitle|updateSubtitle/, `${file} talks to the player`);
  }
});
