// Exercises the pure auto-smelt table without the game.
//
// src/autosmelt.ts imports @minecraft/server, which ships type declarations and
// no JavaScript, so node cannot import the module as-is. esbuild bundles it with
// that one import resolved to a stub; the stub is never touched, because
// smeltedDropFor is pure and registerAutoSmelt is not called here.

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
      contents: [
        'export const world = { beforeEvents: { playerBreakBlock: { subscribe() {} } } };',
        'export const system = { run() {} };',
        'export class ItemStack {}',
      ].join('\n'),
      loader: 'js',
    }));
  },
};

const bundle = await build({
  entryPoints: [join(projectRoot, 'src', 'autosmelt.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  plugins: [minecraftServerStub],
});

const moduleUrl =
  'data:text/javascript;base64,' +
  Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64');

const { smeltedDropFor } = await import(moduleUrl);

// The seven blocks named in the spec, and nothing else.
const SMELTED = [
  ['minecraft:iron_ore', 'minecraft:iron_ingot'],
  ['minecraft:deepslate_iron_ore', 'minecraft:iron_ingot'],
  ['minecraft:gold_ore', 'minecraft:gold_ingot'],
  ['minecraft:deepslate_gold_ore', 'minecraft:gold_ingot'],
  ['minecraft:copper_ore', 'minecraft:copper_ingot'],
  ['minecraft:deepslate_copper_ore', 'minecraft:copper_ingot'],
  ['minecraft:ancient_debris', 'minecraft:netherite_scrap'],
];

test('smeltedDropFor — allow-listed ores', async (t) => {
  for (const [blockTypeId, itemId] of SMELTED) {
    await t.test(`${blockTypeId} -> ${itemId}`, () => {
      assert.deepStrictEqual(smeltedDropFor(blockTypeId), { itemId, count: 1 });
    });
  }

  await t.test('every allow-listed block yields exactly one item', () => {
    for (const [blockTypeId] of SMELTED) {
      assert.strictEqual(
        smeltedDropFor(blockTypeId).count,
        1,
        `${blockTypeId} must drop exactly 1 (Fortune is deferred by the spec)`
      );
    }
  });
});

test('smeltedDropFor — everything else keeps vanilla behavior', async (t) => {
  // Named by the acceptance criterion.
  const vanilla = [
    'minecraft:stone',
    'minecraft:coal_ore',
    'minecraft:diamond_ore',
    'minecraft:deepslate',
  ];

  for (const blockTypeId of vanilla) {
    await t.test(`${blockTypeId} -> undefined`, () => {
      assert.strictEqual(smeltedDropFor(blockTypeId), undefined);
    });
  }

  await t.test('near-misses of the allow-list are not smelted', () => {
    // Raw items, the deepslate ores the list does not carry, and the blocks a
    // careless "contains ore" rule would swallow.
    const nearMisses = [
      'minecraft:raw_iron_block',
      'minecraft:deepslate_coal_ore',
      'minecraft:deepslate_diamond_ore',
      'minecraft:deepslate_redstone_ore',
      'minecraft:nether_gold_ore',
      'minecraft:gilded_blackstone',
      'minecraft:emerald_ore',
      'minecraft:lapis_ore',
      'minecraft:redstone_ore',
      'minecraft:quartz_ore',
      'minecraft:iron_block',
      'minecraft:netherrack',
      'andrew:miners_pickaxe',
      '',
    ];
    for (const blockTypeId of nearMisses) {
      assert.strictEqual(
        smeltedDropFor(blockTypeId),
        undefined,
        `${blockTypeId} must keep vanilla breaking behavior`
      );
    }
  });

  await t.test('Object.prototype keys do not leak through the lookup', () => {
    for (const key of ['constructor', 'toString', 'hasOwnProperty', '__proto__']) {
      assert.strictEqual(smeltedDropFor(key), undefined, `${key} must not resolve to a drop`);
    }
  });
});
