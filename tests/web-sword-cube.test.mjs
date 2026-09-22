// Exercises the Web Sword cube geometry and block classification without the
// game.
//
// src/websword/cube.ts imports nothing from @minecraft/server at runtime — the
// two things it needs from there (the Direction enum's string values, the Block
// shape) are reached as data rather than as an imported object — so the bundle
// below needs no stub of the module, the way tests/web-sword-rules.test.mjs
// does not. The `mc-stub` plugin is still installed as a tripwire: if a future
// edit adds a real import, the plugin's contents (a single `throw`) makes the
// test say so instead of the bundle failing with an opaque resolve error.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const minecraftServerStub = {
  name: 'minecraft-server-stub',
  setup(pluginBuild) {
    pluginBuild.onResolve({ filter: /^@minecraft\/server$/ }, () => ({
      path: '@minecraft/server',
      namespace: 'mc-stub',
    }));
    pluginBuild.onLoad({ filter: /.*/, namespace: 'mc-stub' }, () => ({
      contents:
        'throw new Error("src/websword/cube.ts must stay free of runtime @minecraft/server imports");',
      loader: 'js',
    }));
  },
};

const bundle = await build({
  entryPoints: [join(projectRoot, 'src', 'websword', 'cube.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  plugins: [minecraftServerStub],
});

const moduleUrl =
  'data:text/javascript;base64,' +
  Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64');

const {
  WEB_BLOCK_ID,
  PROTECTED_BLOCK_IDS,
  BLOCK_ENTITY_IDS,
  PROTECTED_ID_SUFFIXES,
  isProtectedBlockId,
  faceOffset,
  adjacentCell,
  toCell,
  planCells,
  classify,
} = await import(moduleUrl);

/**
 * A stand-in for a Block.
 *
 * `inventory: true` gives it a `minecraft:inventory` component, the live check
 * that catches containers the id lists have never heard of.
 * `throws: true` makes every read fail, which is how the engine reports a cell
 * in an unloaded chunk or outside the world.
 */
function makeBlock(typeId, { inventory = false, isAir = false, isLiquid = false, throws = false } = {}) {
  if (throws) {
    return {
      get typeId() {
        throw new Error('LocationInUnloadedChunkError');
      },
      getComponent() {
        throw new Error('LocationInUnloadedChunkError');
      },
      get isAir() {
        throw new Error('LocationInUnloadedChunkError');
      },
      get isLiquid() {
        throw new Error('LocationInUnloadedChunkError');
      },
    };
  }
  return {
    typeId,
    isAir,
    isLiquid,
    getComponent(componentId) {
      if (componentId === 'minecraft:inventory' && inventory) {
        return { container: { size: 27 } };
      }
      return undefined;
    },
  };
}

const key = (cell) => `${cell.x},${cell.y},${cell.z}`;

test('planCells — 27 unique cells of the 3x3x3 cube around the centre', async (t) => {
  const center = { x: 10, y: 64, z: -7 };
  const cells = planCells(center);

  await t.test('exactly 27 cells, all distinct', () => {
    assert.strictEqual(cells.length, 27);
    assert.strictEqual(new Set(cells.map(key)).size, 27);
  });

  await t.test('the centre itself is one of them (Q-011)', () => {
    assert.ok(cells.some((c) => key(c) === key(center)));
  });

  await t.test('every cell is within one block of the centre on all three axes', () => {
    for (const cell of cells) {
      assert.ok(Math.abs(cell.x - center.x) <= 1, `x out of range: ${key(cell)}`);
      assert.ok(Math.abs(cell.y - center.y) <= 1, `y out of range: ${key(cell)}`);
      assert.ok(Math.abs(cell.z - center.z) <= 1, `z out of range: ${key(cell)}`);
    }
  });

  await t.test('the cube spans the full [-1, +1] range on each axis', () => {
    for (const axis of ['x', 'y', 'z']) {
      const values = new Set(cells.map((c) => c[axis] - center[axis]));
      assert.deepStrictEqual([...values].sort((a, b) => a - b), [-1, 0, 1]);
    }
  });

  await t.test('negative coordinates are not special-cased', () => {
    const negative = planCells({ x: -1, y: -64, z: -1 });
    assert.strictEqual(new Set(negative.map(key)).size, 27);
    assert.ok(negative.some((c) => key(c) === '-2,-65,-2'));
    assert.ok(negative.some((c) => key(c) === '0,-63,0'));
  });
});

test('faceOffset / adjacentCell — all six faces', async (t) => {
  // North is -Z and south is +Z, per Block.north()/Block.south() in
  // @minecraft/server 2.10.0. The Direction enum's own doc comments say the
  // opposite and are wrong; this table is the contract that pins it down.
  const expected = {
    Up: { x: 0, y: 1, z: 0 },
    Down: { x: 0, y: -1, z: 0 },
    North: { x: 0, y: 0, z: -1 },
    South: { x: 0, y: 0, z: 1 },
    East: { x: 1, y: 0, z: 0 },
    West: { x: -1, y: 0, z: 0 },
  };

  await t.test('each face offsets by exactly one block along its own axis', () => {
    for (const [face, offset] of Object.entries(expected)) {
      assert.deepStrictEqual(faceOffset(face), offset, `face ${face}`);
    }
  });

  await t.test('opposite faces cancel out', () => {
    for (const [a, b] of [
      ['Up', 'Down'],
      ['North', 'South'],
      ['East', 'West'],
    ]) {
      const first = faceOffset(a);
      const second = faceOffset(b);
      assert.deepStrictEqual(
        { x: first.x + second.x, y: first.y + second.y, z: first.z + second.z },
        { x: 0, y: 0, z: 0 },
        `${a} + ${b}`
      );
    }
  });

  await t.test('adjacentCell steps off the hit block towards the hit face', () => {
    const block = { x: 3, y: 1, z: 3 };
    assert.deepStrictEqual(adjacentCell(block, 'Up'), { x: 3, y: 2, z: 3 });
    assert.deepStrictEqual(adjacentCell(block, 'Down'), { x: 3, y: 0, z: 3 });
    assert.deepStrictEqual(adjacentCell(block, 'North'), { x: 3, y: 1, z: 2 });
    assert.deepStrictEqual(adjacentCell(block, 'South'), { x: 3, y: 1, z: 4 });
    assert.deepStrictEqual(adjacentCell(block, 'East'), { x: 4, y: 1, z: 3 });
    assert.deepStrictEqual(adjacentCell(block, 'West'), { x: 2, y: 1, z: 3 });
  });

  await t.test('an unrecognised face centres on the hit block instead of throwing', () => {
    assert.deepStrictEqual(faceOffset('Sideways'), { x: 0, y: 0, z: 0 });
  });
});

test('toCell — a continuous position floors to the cell containing it', () => {
  assert.deepStrictEqual(toCell({ x: 3.7, y: 2.0, z: -0.2 }), { x: 3, y: 2, z: -1 });
  assert.deepStrictEqual(toCell({ x: -3.7, y: 64.9, z: 0.0 }), { x: -4, y: 64, z: 0 });
});

test('classify — the place/skip table (Q-013)', async (t) => {
  await t.test('air, an ordinary solid block and liquid are replaceable', () => {
    assert.strictEqual(classify(makeBlock('minecraft:air', { isAir: true })), 'place');
    assert.strictEqual(classify(makeBlock('minecraft:stone')), 'place');
    assert.strictEqual(classify(makeBlock('minecraft:water', { isLiquid: true })), 'place');
    assert.strictEqual(classify(makeBlock('minecraft:flowing_water', { isLiquid: true })), 'place');
    assert.strictEqual(classify(makeBlock('minecraft:dirt')), 'place');
    assert.strictEqual(classify(makeBlock('minecraft:oak_planks')), 'place');
  });

  await t.test('cobweb is skipped, so it is never counted as newly placed', () => {
    assert.strictEqual(classify(makeBlock(WEB_BLOCK_ID)), 'skip');
    assert.strictEqual(WEB_BLOCK_ID, 'minecraft:web');
  });

  await t.test('protected and unbreakable blocks are skipped', () => {
    for (const id of [
      'minecraft:bedrock',
      'minecraft:barrier',
      'minecraft:command_block',
      'minecraft:repeating_command_block',
      'minecraft:structure_block',
      'minecraft:jigsaw',
      'minecraft:end_portal',
      'minecraft:end_portal_frame',
      'minecraft:portal',
      'minecraft:light_block',
      'minecraft:reinforced_deepslate',
      'minecraft:moving_block',
    ]) {
      assert.strictEqual(classify(makeBlock(id)), 'skip', id);
    }
  });

  await t.test('containers and data-carrying block entities are skipped', () => {
    for (const id of [
      'minecraft:chest',
      'minecraft:trapped_chest',
      'minecraft:ender_chest',
      'minecraft:barrel',
      'minecraft:shulker_box',
      'minecraft:magenta_shulker_box',
      'minecraft:hopper',
      'minecraft:dropper',
      'minecraft:dispenser',
      'minecraft:furnace',
      'minecraft:lit_furnace',
      'minecraft:blast_furnace',
      'minecraft:smoker',
      'minecraft:brewing_stand',
      'minecraft:beacon',
      'minecraft:lectern',
      'minecraft:jukebox',
      'minecraft:mob_spawner',
      'minecraft:campfire',
      'minecraft:soul_campfire',
      'minecraft:enchanting_table',
      'minecraft:anvil',
      'minecraft:chipped_anvil',
      'minecraft:damaged_anvil',
      'minecraft:oak_sign',
      'minecraft:oak_hanging_sign',
      'minecraft:white_banner',
      'minecraft:red_bed',
    ]) {
      assert.strictEqual(classify(makeBlock(id)), 'skip', id);
    }
  });

  await t.test('an unrecognised block with a minecraft:inventory component is skipped', () => {
    assert.strictEqual(classify(makeBlock('othermod:strongbox', { inventory: true })), 'skip');
    // The control: the same unrecognised id with no inventory is ordinary.
    assert.strictEqual(classify(makeBlock('othermod:strongbox')), 'place');
  });

  await t.test('an unloaded cell — getBlock returned undefined — is skipped', () => {
    assert.strictEqual(classify(undefined), 'skip');
  });

  await t.test('a block whose reads throw is skipped rather than propagating', () => {
    assert.strictEqual(classify(makeBlock('minecraft:stone', { throws: true })), 'skip');
  });
});

test('the protected list is exported as a constant, not hidden in a branch', async (t) => {
  await t.test('both id sets and the suffix list are exported and non-empty', () => {
    assert.ok(PROTECTED_BLOCK_IDS instanceof Set);
    assert.ok(PROTECTED_BLOCK_IDS.size > 0);
    assert.ok(BLOCK_ENTITY_IDS instanceof Set);
    assert.ok(BLOCK_ENTITY_IDS.size > 0);
    assert.ok(Array.isArray(PROTECTED_ID_SUFFIXES));
    assert.ok(PROTECTED_ID_SUFFIXES.length > 0);
  });

  await t.test('every id is namespaced, so none of them can silently never match', () => {
    for (const id of [...PROTECTED_BLOCK_IDS, ...BLOCK_ENTITY_IDS]) {
      assert.ok(id.startsWith('minecraft:'), id);
    }
  });

  await t.test('isProtectedBlockId agrees with the lists and the suffixes', () => {
    assert.strictEqual(isProtectedBlockId('minecraft:bedrock'), true);
    assert.strictEqual(isProtectedBlockId('minecraft:chest'), true);
    assert.strictEqual(isProtectedBlockId('minecraft:lime_shulker_box'), true);
    assert.strictEqual(isProtectedBlockId('minecraft:stone'), false);
    assert.strictEqual(isProtectedBlockId(WEB_BLOCK_ID), false);
  });
});
