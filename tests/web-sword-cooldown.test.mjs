// Exercises the Web Sword cooldown service without the game.
//
// src/websword/cooldown.ts imports @minecraft/server values (world, system,
// EntityComponentTypes, EquipmentSlot) directly, and pulls in state.ts (which
// also imports @minecraft/server) and rules.ts — so the bundle below stubs
// @minecraft/server the same way tests/autosmelt.test.mjs does, and the stub's
// `world.getAbsoluteTime()` reads a global the test can rewind and fast-forward
// (contrast tests/web-sword-rules.test.mjs, which needs no stub at all).

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
        'export const world = {',
        '  getAbsoluteTime() { return globalThis.__mcTime ?? 0; },',
        '  getAllPlayers() { return globalThis.__mcPlayers ?? []; },',
        '};',
        'export const system = {',
        '  runInterval(fn, interval) {',
        '    globalThis.__mcInterval = { fn, interval };',
        '    return 1;',
        '  },',
        '};',
        'export const EntityComponentTypes = { Equippable: "minecraft:equippable" };',
        'export const EquipmentSlot = { Mainhand: "Mainhand", Offhand: "Offhand" };',
      ].join('\n'),
      loader: 'js',
    }));
  },
};

const bundle = await build({
  entryPoints: [join(projectRoot, 'src', 'websword', 'cooldown.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  plugins: [minecraftServerStub],
});

const moduleUrl =
  'data:text/javascript;base64,' +
  Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64');

const { isReady, startCooldown, remainingTicks, registerCooldownHud, DEFAULT_ABILITY_KEY } =
  await import(moduleUrl);

/** A stub player with a real dynamic-property store, the way state.ts reads/writes it. */
function makePlayer(name = 'player') {
  const props = new Map();
  return {
    name,
    typeId: 'minecraft:player',
    getDynamicProperty(key) {
      return props.get(key);
    },
    setDynamicProperty(key, value) {
      if (value === undefined) {
        props.delete(key);
      } else {
        props.set(key, value);
      }
    },
  };
}

/** A player stub that also answers the HUD's main-hand equipment query. */
function makeHolder(heldTypeId, name = 'holder') {
  const player = makePlayer(name);
  player.actionBarCalls = [];
  player.onScreenDisplay = {
    setActionBar(message) {
      player.actionBarCalls.push(message);
    },
  };
  player.getComponent = (componentId) => {
    if (componentId !== 'minecraft:equippable') {
      return undefined;
    }
    return {
      getEquipment(slot) {
        if (slot !== 'Mainhand') {
          return undefined;
        }
        return heldTypeId === undefined ? undefined : { typeId: heldTypeId };
      },
    };
  };
  return player;
}

test('isReady / startCooldown / remainingTicks — 30s = 600 ticks, per-player dynamic property', async (t) => {
  await t.test('a player who never armed the ability is ready with zero remaining', () => {
    globalThis.__mcTime = 12345;
    const player = makePlayer();
    assert.strictEqual(isReady(player), true);
    assert.strictEqual(remainingTicks(player), 0);
  });

  await t.test('immediately after start: not ready, 600 ticks remaining', () => {
    globalThis.__mcTime = 1000;
    const player = makePlayer();
    startCooldown(player);
    assert.strictEqual(isReady(player), false);
    assert.strictEqual(remainingTicks(player), 600);
  });

  await t.test('599 ticks later: still not ready, 1 tick remaining', () => {
    globalThis.__mcTime = 1000;
    const player = makePlayer();
    startCooldown(player);
    globalThis.__mcTime = 1000 + 599;
    assert.strictEqual(isReady(player), false);
    assert.strictEqual(remainingTicks(player), 1);
  });

  await t.test('exactly 600 ticks later: ready, zero remaining', () => {
    globalThis.__mcTime = 1000;
    const player = makePlayer();
    startCooldown(player);
    globalThis.__mcTime = 1000 + 600;
    assert.strictEqual(isReady(player), true);
    assert.strictEqual(remainingTicks(player), 0);
  });

  await t.test('cooldown is keyed per player — arming one leaves another untouched', () => {
    globalThis.__mcTime = 500;
    const a = makePlayer('a');
    const b = makePlayer('b');
    startCooldown(a);
    assert.strictEqual(isReady(a), false);
    assert.strictEqual(isReady(b), true);
    assert.strictEqual(remainingTicks(b), 0);
  });

  await t.test('the ability-key seam defaults to "web_sword"', () => {
    assert.strictEqual(DEFAULT_ABILITY_KEY, 'web_sword');
  });
});

test('registerCooldownHud — actionbar for sword holders only', async (t) => {
  await t.test('seconds are rounded up, not down or truncated', () => {
    globalThis.__mcTime = 1000;
    const holder = makeHolder('andrew:web_sword');
    startCooldown(holder); // until = 1600
    globalThis.__mcTime = 1000 + 581; // 19 ticks left -> 0.95s -> ceil 1
    globalThis.__mcPlayers = [holder];
    registerCooldownHud();
    globalThis.__mcInterval.fn();
    assert.deepStrictEqual(holder.actionBarCalls.at(-1), {
      translate: 'andrew.web_sword.cooldown',
      with: ['1'],
    });
  });

  await t.test('a fresh 600-tick cooldown reads as exactly 30', () => {
    globalThis.__mcTime = 0;
    const holder = makeHolder('andrew:web_sword');
    startCooldown(holder); // until = 600
    globalThis.__mcPlayers = [holder];
    registerCooldownHud();
    globalThis.__mcInterval.fn();
    assert.deepStrictEqual(holder.actionBarCalls.at(-1), {
      translate: 'andrew.web_sword.cooldown',
      with: ['30'],
    });
  });

  await t.test('within 10 ticks of expiry: "ready" is shown once', () => {
    globalThis.__mcTime = 0;
    const holder = makeHolder('andrew:web_sword');
    startCooldown(holder); // until = 600
    globalThis.__mcTime = 605;
    globalThis.__mcPlayers = [holder];
    registerCooldownHud();
    globalThis.__mcInterval.fn();
    assert.deepStrictEqual(holder.actionBarCalls.at(-1), { translate: 'andrew.web_sword.ready' });
  });

  await t.test('long after expiry: no further actionbar write', () => {
    globalThis.__mcTime = 0;
    const holder = makeHolder('andrew:web_sword');
    startCooldown(holder); // until = 600
    globalThis.__mcTime = 700; // 100 ticks past the 10-tick "just became ready" window
    globalThis.__mcPlayers = [holder];
    registerCooldownHud();
    globalThis.__mcInterval.fn();
    assert.strictEqual(holder.actionBarCalls.length, 0);
  });

  await t.test('a player without the sword in the main hand gets no message', () => {
    globalThis.__mcTime = 0;
    const bystander = makeHolder(undefined);
    startCooldown(bystander); // should have no observable effect on the HUD
    globalThis.__mcTime = 10;
    globalThis.__mcPlayers = [bystander];
    registerCooldownHud();
    globalThis.__mcInterval.fn();
    assert.strictEqual(bystander.actionBarCalls.length, 0);
  });

  await t.test('a sword holder who never armed the ability gets no message', () => {
    globalThis.__mcTime = 5;
    const holder = makeHolder('andrew:web_sword');
    globalThis.__mcPlayers = [holder];
    registerCooldownHud();
    globalThis.__mcInterval.fn();
    assert.strictEqual(holder.actionBarCalls.length, 0);
  });

  await t.test('registers the interval at a 10-tick cadence', () => {
    registerCooldownHud();
    assert.strictEqual(globalThis.__mcInterval.interval, 10);
  });
});
