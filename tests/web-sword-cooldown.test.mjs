// Exercises the legendary cooldown service and the Action Bar HUD with the
// Web Sword registered, without the game. src/legendary/hud.ts imports
// @minecraft/server values, so the bundle below stubs that module.
//
// The clock is `Date.now()`, patched below so the test can fast-forward it.
// The stub's `world.getAbsoluteTime()` is a tripwire that throws: it was the
// original clock and it does not advance when the world's day cycle is stopped,
// which made a cooldown armed against it last forever. If an edit brings it
// back, this file says so instead of the bug reaching a server again.

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
        '  getAbsoluteTime() {',
        '    throw new Error("the cooldown must not be measured against world time-of-day");',
        '  },',
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
  stdin: {
    contents: "export * from './src/legendary/cooldown.ts'; export * from './src/legendary/hud.ts';",
    resolveDir: projectRoot,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  plugins: [minecraftServerStub],
});

const moduleUrl =
  'data:text/javascript;base64,' +
  Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64');

const { isReady: isReadyFor, startCooldown: startFor, remainingTicks: remainingFor, registerLegendaryHud } =
  await import(moduleUrl);

const KEY = 'web_sword';
const isReady = (p) => isReadyFor(p, KEY);
const startCooldown = (p) => startFor(p, KEY);
const remainingTicks = (p) => remainingFor(p, KEY);


const MS_PER_TICK = 50;

/**
 * The module under test reads the clock through `Date.now()`, so that is what
 * the test drives. The cases below are still written in ticks, the unit the
 * spec and `COOLDOWN_TICKS` are stated in.
 */
Date.now = () => globalThis.__mcNowMs ?? 0;
const atTick = (tick) => {
  globalThis.__mcNowMs = tick * MS_PER_TICK;
};

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

/** A player stub that also answers the HUD's equipment query for one hand. */
function makeHolder(heldTypeId, name = 'holder', hand = 'Mainhand') {
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
        if (slot !== hand) {
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
    atTick(12345);
    const player = makePlayer();
    assert.strictEqual(isReady(player), true);
    assert.strictEqual(remainingTicks(player), 0);
  });

  await t.test('immediately after start: not ready, 600 ticks remaining', () => {
    atTick(1000);
    const player = makePlayer();
    startCooldown(player);
    assert.strictEqual(isReady(player), false);
    assert.strictEqual(remainingTicks(player), 600);
  });

  await t.test('599 ticks later: still not ready, 1 tick remaining', () => {
    atTick(1000);
    const player = makePlayer();
    startCooldown(player);
    atTick(1000 + 599);
    assert.strictEqual(isReady(player), false);
    assert.strictEqual(remainingTicks(player), 1);
  });

  await t.test('exactly 600 ticks later: ready, zero remaining', () => {
    atTick(1000);
    const player = makePlayer();
    startCooldown(player);
    atTick(1000 + 600);
    assert.strictEqual(isReady(player), true);
    assert.strictEqual(remainingTicks(player), 0);
  });

  await t.test('cooldown is keyed per player — arming one leaves another untouched', () => {
    atTick(500);
    const a = makePlayer('a');
    const b = makePlayer('b');
    startCooldown(a);
    assert.strictEqual(isReady(a), false);
    assert.strictEqual(isReady(b), true);
    assert.strictEqual(remainingTicks(b), 0);
  });

  await t.test('stored as andrew:cd_<abilityKey>, an epoch-ms deadline', () => {
    atTick(1000);
    const player = makePlayer();
    startCooldown(player);
    assert.strictEqual(player.getDynamicProperty('andrew:cd_web_sword'), (1000 + 600) * MS_PER_TICK);
  });
});

const cooldownOf = (seconds) => ({
  rawtext: [
    {
      translate: 'andrew.legendary.cooldown',
      with: { rawtext: [{ translate: 'item.andrew:web_sword.name' }, { text: seconds }] },
    },
  ],
});
const READY = {
  rawtext: [{ translate: 'andrew.legendary.ready', with: { rawtext: [{ translate: 'item.andrew:web_sword.name' }] } }],
};

function tickHud(players) {
  globalThis.__mcPlayers = players;
  registerLegendaryHud();
  globalThis.__mcInterval.fn();
}

test('registerLegendaryHud — actionbar for legendary holders only', async (t) => {
  await t.test('seconds are rounded up, not down or truncated', () => {
    atTick(1000);
    const holder = makeHolder('andrew:web_sword');
    startCooldown(holder);
    atTick(1000 + 581); // 19 ticks left -> 0.95s -> ceil 1
    tickHud([holder]);
    assert.deepStrictEqual(holder.actionBarCalls.at(-1), cooldownOf('1'));
  });

  await t.test('a fresh 600-tick cooldown reads as exactly 30', () => {
    atTick(0);
    const holder = makeHolder('andrew:web_sword');
    startCooldown(holder);
    tickHud([holder]);
    assert.deepStrictEqual(holder.actionBarCalls.at(-1), cooldownOf('30'));
  });

  await t.test('"ready" right after expiry', () => {
    atTick(0);
    const holder = makeHolder('andrew:web_sword');
    startCooldown(holder);
    atTick(605);
    tickHud([holder]);
    assert.deepStrictEqual(holder.actionBarCalls.at(-1), READY);
  });

  await t.test('"ready" keeps showing long after expiry', () => {
    atTick(0);
    const holder = makeHolder('andrew:web_sword');
    startCooldown(holder);
    atTick(700);
    tickHud([holder]);
    assert.deepStrictEqual(holder.actionBarCalls.at(-1), READY);
  });

  await t.test('a holder who never armed the ability sees "ready"', () => {
    atTick(5);
    const holder = makeHolder('andrew:web_sword');
    tickHud([holder]);
    assert.deepStrictEqual(holder.actionBarCalls.at(-1), READY);
  });

  await t.test('the off hand counts as holding', () => {
    atTick(5);
    const holder = makeHolder('andrew:web_sword', 'offhander', 'Offhand');
    tickHud([holder]);
    assert.deepStrictEqual(holder.actionBarCalls.at(-1), READY);
  });

  await t.test('a player without a legendary in either hand gets no message', () => {
    atTick(0);
    const bystander = makeHolder(undefined);
    startCooldown(bystander);
    atTick(10);
    tickHud([bystander]);
    assert.strictEqual(bystander.actionBarCalls.length, 0);
  });

  await t.test('an undefined entry (SimulatedPlayer seen from the release pack) is skipped', () => {
    tickHud([undefined]);
  });

  await t.test('registers the interval at a 10-tick cadence', () => {
    registerLegendaryHud();
    assert.strictEqual(globalThis.__mcInterval.interval, 10);
  });
});
