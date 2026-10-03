// isLegendaryStack, the predicate the UFO Magnet asks before it touches a stack
// (L0-lgnd-ad13, L0-lgnd-ac21 "Predicate"). The mark states of the fixtures are
// confirmed with the product's own getMark / isLive / isStale, so "stale" below
// is stale by the rule that ships, not by a label.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
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
        'export const worldProps = new Map();',
        'export const world = {',
        '  getDynamicProperty: (key) => worldProps.get(key),',
        '  setDynamicProperty: (key, value) => void worldProps.set(key, value),',
        '  getAbsoluteTime: () => 0,',
        '};',
        'export const EntityComponentTypes = { Equippable: "minecraft:equippable" };',
        'export const EquipmentSlot = { Mainhand: "Mainhand", Offhand: "Offhand" };',
      ].join('\n'),
      loader: 'js',
    }));
  },
};

const bundle = await build({
  stdin: {
    contents: [
      "export * from './src/legendary/registry.ts';",
      "export { getMark, isLive, isStale } from './src/legendary/state.ts';",
      "export { worldProps } from '@minecraft/server';",
    ].join('\n'),
    resolveDir: projectRoot,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  plugins: [minecraftServerStub],
});

const { LEGENDARIES, keysFor, genLedgerKey, isLegendaryStack, getMark, isLive, isStale, worldProps } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
);

/** An ItemStack stand-in that counts every dynamic-property read. */
function fakeStack(typeId, props = {}) {
  const stack = {
    typeId,
    reads: 0,
    getDynamicProperty(key) {
      stack.reads++;
      return props[key];
    },
  };
  return stack;
}

let serial = 0;

/** Mark props of `def` at generation `gen` for a fresh id; the world ledger is set to `ledger`. */
function markProps(def, gen, ledger) {
  const id = `ufo-${++serial}`;
  const keys = keysFor(def);
  worldProps.set(genLedgerKey(def, id), ledger);
  return { [keys.origin]: 'admin', [keys.owner]: 'player-1', [keys.id]: id, [keys.gen]: gen };
}

const STATES = [
  ['marked', (def) => markProps(def, 1, 1)],
  ['unmarked', () => ({})],
  ['stale', (def) => markProps(def, 0, 1)],
];

/** Asserts the fixture really is in `state` under the shipped mark rules. */
function assertState(def, stack, state) {
  const mark = getMark(def, stack);
  if (state === 'unmarked') {
    assert.equal(mark, undefined, `${stack.typeId}: the unmarked fixture carries a mark`);
    return;
  }
  assert.ok(mark !== undefined, `${stack.typeId}: the ${state} fixture carries no mark`);
  assert.equal(isLive(def, mark), state === 'marked', `${stack.typeId}: the ${state} fixture has the wrong liveness`);
  assert.equal(isStale(def, stack), state === 'stale', `${stack.typeId}: isStale disagrees with the ${state} fixture`);
}

test('isLegendaryStack (L0-lgnd-ac21 Predicate)', async (t) => {
  await t.test('the registry names exactly the three weapons and their three craft tokens', () => {
    const ids = LEGENDARIES.flatMap((def) => [def.itemId, def.craftTokenId]).sort();
    assert.deepEqual(ids, [
      'andrew:orbital_cannon',
      'andrew:orbital_cannon_crafted',
      'andrew:scythe_of_calamity',
      'andrew:scythe_of_calamity_crafted',
      'andrew:web_sword',
      'andrew:web_sword_crafted',
    ]);
  });

  for (const def of LEGENDARIES) {
    for (const typeId of [def.itemId, def.craftTokenId]) {
      for (const [state, props] of STATES) {
        await t.test(`true for ${typeId}, ${state}, without reading a dynamic property`, () => {
          const stack = fakeStack(typeId, props(def));
          assertState(def, stack, state);
          stack.reads = 0;
          assert.equal(isLegendaryStack(stack), true);
          assert.equal(stack.reads, 0, `${typeId}: the predicate read ${stack.reads} dynamic properties`);
        });
      }
    }
  }

  await t.test('false for minecraft:iron_sword, even one carrying a Web Sword mark', () => {
    const [webSword] = LEGENDARIES;
    assert.equal(isLegendaryStack(fakeStack('minecraft:iron_sword')), false);
    assert.equal(isLegendaryStack(fakeStack('minecraft:iron_sword', markProps(webSword, 1, 1))), false);
  });

  await t.test('false for undefined', () => {
    assert.equal(isLegendaryStack(undefined), false);
    assert.equal(isLegendaryStack(), false);
  });

  await t.test('false for an empty slot', () => {
    // Container.getItem answers an empty slot with undefined; an air stack is
    // what an empty hand reads as on some engine paths.
    const slots = [fakeStack('andrew:web_sword'), undefined];
    const container = { size: slots.length, getItem: (slot) => slots[slot] };
    assert.equal(isLegendaryStack(container.getItem(1)), false);
    assert.equal(isLegendaryStack(container.getItem(0)), true, 'the control slot holding a Web Sword');
    assert.equal(isLegendaryStack(fakeStack('minecraft:air')), false);
  });

  await t.test("false for the Miner's Pickaxe, which is not a legendary", () => {
    assert.equal(isLegendaryStack(fakeStack('andrew:miners_pickaxe')), false);
  });
});

// L0-lgnd-ac22: a death from the magnet's height keeps every legendary because
// retention never asks how the player died. The engine side is
// andrew:legendary_ufo_fall_death_keeps; this pins the code side, so a cause
// filter added to the death handlers fails here before it reaches BDS.
test('death retention reads no damage cause (L0-lgnd-ac22)', () => {
  const source = readFileSync(join(projectRoot, 'src', 'legendary', 'retention.ts'), 'utf-8');
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert.match(code, /entityDie\.subscribe/, 'the control: retention still subscribes to entityDie');
  assert.doesNotMatch(code, /damageSource|\.cause\b|EntityDamageCause/);
});
