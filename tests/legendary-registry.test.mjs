// The legendary registry, its key derivation and the main-hand / off-hand
// priority, off the engine. hands.ts imports @minecraft/server values, so the
// bundle stubs that module.

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
      "export * from './src/legendary/hands.ts';",
      "export * from './src/legendary/cooldown.ts';",
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

const {
  LEGENDARIES,
  WEB_SWORD,
  defFor,
  defForStack,
  defForAbility,
  keysFor,
  cooldownKey,
  busyKey,
  resolveActivation,
  startCooldown,
  setBusy,
} = await import(
  'data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64')
);

Date.now = () => globalThis.__nowMs ?? 0;

/** A second, test-only legendary so the table can hold two different items. */
const OTHER = {
  itemId: 'andrew:test_legendary',
  keyPrefix: 'tl',
  abilityKey: 'test_legendary',
  nameKey: 'item.andrew:test_legendary',
  cooldownTicks: 600,
  craftGate: false,
  refund: [],
  textPrefix: 'andrew.test_legendary',
  command: 'andrew:testlegendary',
};

test('registry', async (t) => {
  await t.test('defFor finds the Web Sword by item id', () => {
    assert.strictEqual(defFor('andrew:web_sword'), WEB_SWORD);
    assert.strictEqual(defFor('minecraft:diamond_sword'), undefined);
  });

  await t.test('defForStack reads the stack typeId, and tolerates no stack', () => {
    assert.strictEqual(defForStack({ typeId: 'andrew:web_sword' }), WEB_SWORD);
    assert.strictEqual(defForStack({ typeId: 'minecraft:stick' }), undefined);
    assert.strictEqual(defForStack(undefined), undefined);
  });

  await t.test('defForAbility finds by ability key', () => {
    assert.strictEqual(defForAbility('web_sword'), WEB_SWORD);
    assert.strictEqual(defForAbility('nope'), undefined);
  });

  await t.test('Web Sword definition matches the shipped behaviour', () => {
    assert.ok(LEGENDARIES.includes(WEB_SWORD));
    assert.strictEqual(WEB_SWORD.itemId, 'andrew:web_sword');
    assert.strictEqual(WEB_SWORD.keyPrefix, 'ws');
    assert.strictEqual(WEB_SWORD.abilityKey, 'web_sword');
    assert.strictEqual(WEB_SWORD.nameKey, 'item.andrew:web_sword');
    assert.strictEqual(WEB_SWORD.cooldownTicks, 600);
    assert.strictEqual(WEB_SWORD.craftGate, true);
    assert.deepStrictEqual(WEB_SWORD.refund, [
      ['minecraft:web', 4],
      ['minecraft:diamond_sword', 1],
    ]);
  });

  await t.test('item ids, prefixes and ability keys are unique across the registry', () => {
    for (const field of ['itemId', 'keyPrefix', 'abilityKey', 'command']) {
      const values = LEGENDARIES.map((def) => def[field]);
      assert.strictEqual(new Set(values).size, values.length, `duplicate ${field}`);
    }
  });
});

test('keys from keyPrefix', async (t) => {
  await t.test('Web Sword keeps its existing andrew:ws_* keys', () => {
    assert.deepStrictEqual(keysFor(WEB_SWORD), {
      origin: 'andrew:ws_origin',
      owner: 'andrew:ws_owner',
      id: 'andrew:ws_id',
      ownerName: 'andrew:ws_owner_name',
      crafted: 'andrew:ws_crafted',
      craftedBy: 'andrew:ws_crafted_by',
      pending: 'andrew:ws_pending',
    });
  });

  await t.test('another prefix gets its own namespace', () => {
    const keys = keysFor(OTHER);
    assert.strictEqual(keys.origin, 'andrew:tl_origin');
    const swordKeys = new Set(Object.values(keysFor(WEB_SWORD)));
    for (const key of Object.values(keys)) {
      assert.ok(!swordKeys.has(key), `${key} collides with a Web Sword key`);
    }
  });

  await t.test('cooldown and busy are keyed by ability', () => {
    assert.strictEqual(cooldownKey('web_sword'), 'andrew:cd_web_sword');
    assert.strictEqual(busyKey('web_sword'), 'andrew:busy_web_sword');
  });
});

function makePlayer(main, off) {
  const props = new Map();
  const hands = { Mainhand: main, Offhand: off };
  return {
    getDynamicProperty: (key) => props.get(key),
    setDynamicProperty(key, value) {
      if (value === undefined) props.delete(key);
      else props.set(key, value);
    },
    getComponent: (id) =>
      id === 'minecraft:equippable' ? { getEquipment: (slot) => hands[slot] } : undefined,
  };
}

test('resolveActivation — main-hand priority table', async (t) => {
  const sword = { typeId: 'andrew:web_sword' };
  const stick = { typeId: 'minecraft:stick' };

  // The registry is read-only by type but a plain array at runtime; a second
  // entry makes the two-item rows real and is removed afterwards.
  LEGENDARIES.push(OTHER);
  t.after(() => LEGENDARIES.splice(LEGENDARIES.indexOf(OTHER), 1));
  const other = { typeId: OTHER.itemId };

  const rows = [
    // [main state, off state, expected]
    ['ready', 'ready', 'Mainhand'],
    ['ready', 'empty', 'Mainhand'],
    ['cooldown', 'ready', 'Offhand'],
    ['cooldown', 'empty', undefined],
    ['busy', 'ready', 'Offhand'],
    ['busy', 'empty', undefined],
    ['cooldown', 'cooldown', undefined],
    ['none', 'ready', 'Offhand'],
    ['none', 'empty', undefined],
  ];

  for (const [mainState, offState, expected] of rows) {
    await t.test(`main ${mainState} × off ${offState} -> ${expected ?? 'nothing'}`, () => {
      globalThis.__nowMs = 1_000_000;
      const main = mainState === 'none' ? stick : sword;
      const off = offState === 'empty' ? undefined : other;
      const player = makePlayer(main, off);

      if (mainState === 'cooldown') startCooldown(player, WEB_SWORD.abilityKey);
      if (mainState === 'busy') setBusy(player, WEB_SWORD.abilityKey, 5000);
      if (offState === 'cooldown') startCooldown(player, OTHER.abilityKey);

      const hit = resolveActivation(player);
      if (expected === undefined) {
        assert.strictEqual(hit, undefined);
      } else {
        assert.strictEqual(hit?.slot, expected);
        assert.strictEqual(hit?.def, expected === 'Mainhand' ? WEB_SWORD : OTHER);
      }
    });
  }

  await t.test('busy expires by its deadline', () => {
    globalThis.__nowMs = 0;
    const player = makePlayer(sword, undefined);
    setBusy(player, WEB_SWORD.abilityKey, 1000);
    assert.strictEqual(resolveActivation(player), undefined);
    globalThis.__nowMs = 1001;
    assert.strictEqual(resolveActivation(player)?.slot, 'Mainhand');
  });

  await t.test('cooldown on the main hand expires after cooldownTicks', () => {
    globalThis.__nowMs = 0;
    const player = makePlayer(sword, undefined);
    startCooldown(player, WEB_SWORD.abilityKey);
    globalThis.__nowMs = 600 * 50 - 1;
    assert.strictEqual(resolveActivation(player), undefined);
    globalThis.__nowMs = 600 * 50;
    assert.strictEqual(resolveActivation(player)?.slot, 'Mainhand');
  });
});

function langKeys(file) {
  return new Set(
    readFileSync(join(projectRoot, 'packs', 'resource', 'texts', file), 'utf-8')
      .split(/\r?\n/)
      .filter((line) => line.includes('=') && !line.startsWith('#'))
      .map((line) => line.slice(0, line.indexOf('=')))
  );
}

test('lang: shared legendary keys, and the same key set in en_US and ru_RU', () => {
  const en = langKeys('en_US.lang');
  const ru = langKeys('ru_RU.lang');
  assert.deepStrictEqual([...en].sort(), [...ru].sort());
  for (const key of ['andrew.legendary.cooldown', 'andrew.legendary.ready']) {
    assert.ok(en.has(key), `missing ${key}`);
  }
  for (const def of LEGENDARIES.filter((d) => d !== OTHER)) {
    assert.ok(en.has(`${def.nameKey}.name`), `missing ${def.nameKey}.name`);
    for (const suffix of ['first_craft', 'craft_blocked', 'returned', 'admin_given', 'reset']) {
      assert.ok(en.has(`${def.textPrefix}.${suffix}`), `missing ${def.textPrefix}.${suffix}`);
    }
  }
});
