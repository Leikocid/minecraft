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
        'export const world = { getDynamicProperty() {} };',
        'export const system = { runInterval() {} };',
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
      "export { hudMessage } from './src/legendary/hud.ts';",
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
  DRAGON_KATANA,
  defFor,
  defForStack,
  defForAbility,
  isLegendaryStack,
  keysFor,
  cooldownKey,
  busyKey,
  resolveActivation,
  startCooldown,
  setBusy,
  hudMessage,
  SCYTHE_OF_CALAMITY,
  ORBITAL_CANNON,
  SCULK_CROSSBOW,
  STORM_BLADE,
  hasAbility,
  heldLegendaries,
  genLedgerKey,
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

  await t.test('the six shipped defs, in order, all but the Sculk Crossbow active (L0-lgnd-ac26)', () => {
    assert.deepStrictEqual(
      LEGENDARIES.map((def) => def.itemId),
      [
        'andrew:web_sword',
        'andrew:scythe_of_calamity',
        'andrew:orbital_cannon',
        'andrew:dragon_katana',
        'andrew:sculk_crossbow',
        'andrew:storm_blade',
      ]
    );
    for (const def of [WEB_SWORD, SCYTHE_OF_CALAMITY, ORBITAL_CANNON, DRAGON_KATANA, STORM_BLADE]) {
      assert.strictEqual(hasAbility(def), true, `${def.itemId} lost its ability`);
      assert.strictEqual(defForAbility(def.abilityKey), def);
      assert.strictEqual(def.cooldownTicks, 600);
    }
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

  await t.test('item ids, prefixes, tokens, commands and text prefixes are unique across all six defs', () => {
    for (const field of ['itemId', 'keyPrefix', 'command', 'craftTokenId', 'textPrefix']) {
      const values = LEGENDARIES.map((def) => def[field]);
      assert.strictEqual(new Set(values).size, values.length, `duplicate ${field}`);
    }
  });

  await t.test('ability keys are unique across the active defs only — a passive def has none to collide with', () => {
    const values = LEGENDARIES.filter(hasAbility).map((def) => def.abilityKey);
    assert.strictEqual(new Set(values).size, values.length, 'duplicate abilityKey');
  });

  await t.test('Dragon Katana is def #4 (AD-lgnd-14)', () => {
    assert.ok(LEGENDARIES.includes(DRAGON_KATANA));
    assert.strictEqual(DRAGON_KATANA.itemId, 'andrew:dragon_katana');
    assert.strictEqual(DRAGON_KATANA.keyPrefix, 'dk');
    assert.strictEqual(DRAGON_KATANA.abilityKey, 'dragon_katana');
    assert.strictEqual(DRAGON_KATANA.nameKey, 'item.andrew:dragon_katana');
    assert.strictEqual(DRAGON_KATANA.cooldownTicks, 600);
    assert.strictEqual(DRAGON_KATANA.craftGate, true);
    assert.strictEqual(DRAGON_KATANA.craftTokenId, 'andrew:dragon_katana_crafted');
    assert.deepStrictEqual(DRAGON_KATANA.refund, [
      ['minecraft:golden_apple', 2],
      ['minecraft:ender_pearl', 2],
      ['minecraft:diamond_sword', 1],
    ]);
    assert.strictEqual(DRAGON_KATANA.textPrefix, 'andrew.katana');
    assert.strictEqual(DRAGON_KATANA.command, 'andrew:katana');
    assert.deepStrictEqual(DRAGON_KATANA.hudKeys, {
      ready: 'andrew.katana.hud_ready',
      cooldown: 'andrew.katana.hud_cooldown',
    });
  });

  await t.test('isLegendaryStack is true for the Katana item and its token, false for a plain Diamond Sword', () => {
    assert.strictEqual(isLegendaryStack({ typeId: 'andrew:dragon_katana' }), true);
    assert.strictEqual(isLegendaryStack({ typeId: 'andrew:dragon_katana_crafted' }), true);
    assert.strictEqual(isLegendaryStack({ typeId: 'minecraft:diamond_sword' }), false);
  });

  await t.test('Sculk Crossbow is def #5: sk prefix, no ability, craft gate wired like every other def (CNTR-LGND-CX15-AA)', () => {
    assert.ok(LEGENDARIES.includes(SCULK_CROSSBOW));
    assert.strictEqual(SCULK_CROSSBOW.itemId, 'andrew:sculk_crossbow');
    assert.strictEqual(SCULK_CROSSBOW.keyPrefix, 'sk');
    assert.strictEqual(SCULK_CROSSBOW.nameKey, 'item.andrew:sculk_crossbow');
    assert.strictEqual(SCULK_CROSSBOW.craftGate, true);
    assert.strictEqual(SCULK_CROSSBOW.craftTokenId, 'andrew:sculk_crossbow_crafted');
    assert.deepStrictEqual(SCULK_CROSSBOW.refund, [
      ['minecraft:echo_shard', 2],
      ['minecraft:deepslate', 2],
      ['minecraft:crossbow', 1],
    ]);
    assert.strictEqual(SCULK_CROSSBOW.textPrefix, 'andrew.sculk_crossbow');
    assert.strictEqual(SCULK_CROSSBOW.command, 'andrew:crossbow');
    assert.strictEqual(hasAbility(SCULK_CROSSBOW), false, 'the crossbow must stay passive (R-lgnd-018)');
    assert.strictEqual(SCULK_CROSSBOW.abilityKey, undefined);
    assert.strictEqual(SCULK_CROSSBOW.cooldownTicks, undefined);
    assert.strictEqual(SCULK_CROSSBOW.hudKeys, undefined);
  });

  await t.test('isLegendaryStack is true for the Sculk Crossbow item and its token', () => {
    assert.strictEqual(isLegendaryStack({ typeId: 'andrew:sculk_crossbow' }), true);
    assert.strictEqual(isLegendaryStack({ typeId: 'andrew:sculk_crossbow_crafted' }), true);
  });

  await t.test('Storm Blade is def #6: sb prefix, an ability again, own em-dash HUD keys (L0-strm-edef)', () => {
    assert.ok(LEGENDARIES.includes(STORM_BLADE));
    assert.strictEqual(STORM_BLADE.itemId, 'andrew:storm_blade');
    assert.strictEqual(STORM_BLADE.keyPrefix, 'sb');
    assert.strictEqual(STORM_BLADE.abilityKey, 'storm_blade');
    assert.strictEqual(STORM_BLADE.nameKey, 'item.andrew:storm_blade');
    assert.strictEqual(STORM_BLADE.cooldownTicks, 600);
    assert.strictEqual(STORM_BLADE.craftGate, true);
    assert.strictEqual(STORM_BLADE.craftTokenId, 'andrew:storm_blade_crafted');
    assert.deepStrictEqual(STORM_BLADE.refund, [
      ['minecraft:lightning_rod', 2],
      ['minecraft:wind_charge', 2],
      ['minecraft:diamond_sword', 1],
    ]);
    assert.strictEqual(STORM_BLADE.textPrefix, 'andrew.storm_blade');
    assert.strictEqual(STORM_BLADE.command, 'andrew:storm');
    assert.deepStrictEqual(STORM_BLADE.hudKeys, {
      ready: 'andrew.storm_blade.hud_ready',
      cooldown: 'andrew.storm_blade.hud_cooldown',
    });
  });

  await t.test('isLegendaryStack is true for the Storm Blade item and its token, false for a plain Diamond Sword', () => {
    assert.strictEqual(isLegendaryStack({ typeId: 'andrew:storm_blade' }), true);
    assert.strictEqual(isLegendaryStack({ typeId: 'andrew:storm_blade_crafted' }), true);
    assert.strictEqual(isLegendaryStack({ typeId: 'minecraft:diamond_sword' }), false);
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
      gen: 'andrew:ws_gen',
      owed: 'andrew:ws_owed',
      holder: 'andrew:ws_holder',
      holderName: 'andrew:ws_holder_name',
    });
  });

  await t.test('Dragon Katana keys live under andrew:dk_*', () => {
    assert.deepStrictEqual(keysFor(DRAGON_KATANA), {
      origin: 'andrew:dk_origin',
      owner: 'andrew:dk_owner',
      id: 'andrew:dk_id',
      ownerName: 'andrew:dk_owner_name',
      crafted: 'andrew:dk_crafted',
      craftedBy: 'andrew:dk_crafted_by',
      pending: 'andrew:dk_pending',
      gen: 'andrew:dk_gen',
      owed: 'andrew:dk_owed',
      holder: 'andrew:dk_holder',
      holderName: 'andrew:dk_holder_name',
    });
  });

  await t.test('Sculk Crossbow keys live under andrew:sk_*, not andrew:sc_* (CNTR-LGND-CX15-AA: sc is the Scythe\'s)', () => {
    assert.deepStrictEqual(keysFor(SCULK_CROSSBOW), {
      origin: 'andrew:sk_origin',
      owner: 'andrew:sk_owner',
      id: 'andrew:sk_id',
      ownerName: 'andrew:sk_owner_name',
      crafted: 'andrew:sk_crafted',
      craftedBy: 'andrew:sk_crafted_by',
      pending: 'andrew:sk_pending',
      gen: 'andrew:sk_gen',
      owed: 'andrew:sk_owed',
      holder: 'andrew:sk_holder',
      holderName: 'andrew:sk_holder_name',
    });
    const scytheKeys = new Set(Object.values(keysFor(SCYTHE_OF_CALAMITY)));
    for (const key of Object.values(keysFor(SCULK_CROSSBOW))) {
      assert.ok(!scytheKeys.has(key), `${key} collides with a Scythe key`);
    }
  });

  await t.test('Storm Blade keys live under andrew:sb_*', () => {
    assert.deepStrictEqual(keysFor(STORM_BLADE), {
      origin: 'andrew:sb_origin',
      owner: 'andrew:sb_owner',
      id: 'andrew:sb_id',
      ownerName: 'andrew:sb_owner_name',
      crafted: 'andrew:sb_crafted',
      craftedBy: 'andrew:sb_crafted_by',
      pending: 'andrew:sb_pending',
      gen: 'andrew:sb_gen',
      owed: 'andrew:sb_owed',
      holder: 'andrew:sb_holder',
      holderName: 'andrew:sb_holder_name',
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

// Every key defs #1–#4 have written into shipped worlds, spelled out rather
// than derived: a changed byte orphans every mark, craft flag and timer under
// the old key (C-17).
test('keys of defs #1–#4 are byte-identical to the shipped ones (L0-lgnd-ac26)', () => {
  const shipped = [
    [WEB_SWORD, {
      item: {
        origin: 'andrew:ws_origin', owner: 'andrew:ws_owner', id: 'andrew:ws_id', ownerName: 'andrew:ws_owner_name',
        crafted: 'andrew:ws_crafted', craftedBy: 'andrew:ws_crafted_by', pending: 'andrew:ws_pending',
        gen: 'andrew:ws_gen', owed: 'andrew:ws_owed',
        holder: 'andrew:ws_holder', holderName: 'andrew:ws_holder_name',
      },
      ledger: 'andrew:ws_gen:i-1', cooldown: 'andrew:cd_web_sword', busy: 'andrew:busy_web_sword', hudKeys: undefined,
    }],
    [SCYTHE_OF_CALAMITY, {
      item: {
        origin: 'andrew:sc_origin', owner: 'andrew:sc_owner', id: 'andrew:sc_id', ownerName: 'andrew:sc_owner_name',
        crafted: 'andrew:sc_crafted', craftedBy: 'andrew:sc_crafted_by', pending: 'andrew:sc_pending',
        gen: 'andrew:sc_gen', owed: 'andrew:sc_owed',
        holder: 'andrew:sc_holder', holderName: 'andrew:sc_holder_name',
      },
      ledger: 'andrew:sc_gen:i-1', cooldown: 'andrew:cd_scythe_of_calamity', busy: 'andrew:busy_scythe_of_calamity', hudKeys: undefined,
    }],
    [ORBITAL_CANNON, {
      item: {
        origin: 'andrew:oc_origin', owner: 'andrew:oc_owner', id: 'andrew:oc_id', ownerName: 'andrew:oc_owner_name',
        crafted: 'andrew:oc_crafted', craftedBy: 'andrew:oc_crafted_by', pending: 'andrew:oc_pending',
        gen: 'andrew:oc_gen', owed: 'andrew:oc_owed',
        holder: 'andrew:oc_holder', holderName: 'andrew:oc_holder_name',
      },
      ledger: 'andrew:oc_gen:i-1', cooldown: 'andrew:cd_orbital_cannon', busy: 'andrew:busy_orbital_cannon',
      hudKeys: { ready: 'andrew.orbital.hud_ready', cooldown: 'andrew.orbital.hud_cooldown' },
    }],
    [DRAGON_KATANA, {
      item: {
        origin: 'andrew:dk_origin', owner: 'andrew:dk_owner', id: 'andrew:dk_id', ownerName: 'andrew:dk_owner_name',
        crafted: 'andrew:dk_crafted', craftedBy: 'andrew:dk_crafted_by', pending: 'andrew:dk_pending',
        gen: 'andrew:dk_gen', owed: 'andrew:dk_owed',
        holder: 'andrew:dk_holder', holderName: 'andrew:dk_holder_name',
      },
      ledger: 'andrew:dk_gen:i-1', cooldown: 'andrew:cd_dragon_katana', busy: 'andrew:busy_dragon_katana',
      hudKeys: { ready: 'andrew.katana.hud_ready', cooldown: 'andrew.katana.hud_cooldown' },
    }],
  ];
  for (const [def, want] of shipped) {
    assert.deepStrictEqual(keysFor(def), want.item, `${def.itemId} keysFor`);
    assert.strictEqual(genLedgerKey(def, 'i-1'), want.ledger, `${def.itemId} genLedgerKey`);
    assert.strictEqual(cooldownKey(def.abilityKey), want.cooldown, `${def.itemId} cooldownKey`);
    assert.strictEqual(busyKey(def.abilityKey), want.busy, `${def.itemId} busyKey`);
    assert.deepStrictEqual(def.hudKeys, want.hudKeys, `${def.itemId} hudKeys`);
  }
});

function makePlayer(main, off) {
  const props = new Map();
  const hands = { Mainhand: main, Offhand: off };
  return {
    props,
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
  // Unmarked stacks: a marked one would also need the world's generation ledger.
  const unmarked = (typeId) => ({ typeId, getDynamicProperty: () => undefined });
  const sword = unmarked('andrew:web_sword');
  const stick = unmarked('minecraft:stick');

  // The registry is read-only by type but a plain array at runtime; a second
  // entry makes the two-item rows real and is removed afterwards.
  LEGENDARIES.push(OTHER);
  t.after(() => LEGENDARIES.splice(LEGENDARIES.indexOf(OTHER), 1));
  const other = unmarked(OTHER.itemId);

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
    for (const key of Object.values(def.hudKeys ?? {})) {
      assert.ok(en.has(key), `missing HUD key ${key}`);
    }
  }
});

test('hudMessage: shared keys unless the def names its own (L0-adr-oded §1)', async (t) => {
  const unmarked = (typeId) => ({ typeId, getDynamicProperty: () => undefined });
  const sword = unmarked(WEB_SWORD.itemId);
  const scythe = unmarked(SCYTHE_OF_CALAMITY.itemId);

  // The Action Bar payloads the accepted Web Sword and Scythe HUDs send, as JSON.
  const golden = {
    swordReady: '{"rawtext":[{"translate":"andrew.legendary.ready","with":{"rawtext":[{"translate":"item.andrew:web_sword.name"}]}}]}',
    swordCooldown:
      '{"rawtext":[{"translate":"andrew.legendary.cooldown","with":{"rawtext":[{"translate":"item.andrew:web_sword.name"},{"text":"27"}]}}]}',
    scytheReady: '{"rawtext":[{"translate":"andrew.legendary.ready","with":{"rawtext":[{"translate":"item.andrew:scythe_of_calamity.name"}]}}]}',
    both:
      '{"rawtext":[{"translate":"andrew.legendary.cooldown","with":{"rawtext":[{"translate":"item.andrew:web_sword.name"},{"text":"27"}]}},' +
      '{"text":"   "},{"translate":"andrew.legendary.ready","with":{"rawtext":[{"translate":"item.andrew:scythe_of_calamity.name"}]}}]}',
  };

  await t.test('Web Sword and Scythe render exactly as before, ready and on cooldown', () => {
    globalThis.__nowMs = 1_000_000;
    assert.strictEqual(JSON.stringify(hudMessage(makePlayer(sword, undefined))), golden.swordReady);
    assert.strictEqual(JSON.stringify(hudMessage(makePlayer(scythe, undefined))), golden.scytheReady);

    const cooling = makePlayer(sword, scythe);
    startCooldown(cooling, WEB_SWORD.abilityKey);
    globalThis.__nowMs = 1_000_000 + 3_001;
    assert.strictEqual(JSON.stringify(hudMessage(cooling)), golden.both);
    assert.strictEqual(JSON.stringify(hudMessage(makePlayer(sword, undefined))), golden.swordReady);
    const swordOnly = makePlayer(sword, undefined);
    globalThis.__nowMs = 1_000_000;
    startCooldown(swordOnly, WEB_SWORD.abilityKey);
    globalThis.__nowMs = 1_000_000 + 3_001;
    assert.strictEqual(JSON.stringify(hudMessage(swordOnly)), golden.swordCooldown);
  });

  await t.test('nothing held, nothing sent', () => {
    assert.strictEqual(hudMessage(makePlayer(unmarked('minecraft:stick'), undefined)), undefined);
  });

  await t.test('a def with hudKeys renders its own keys, with the same arguments', () => {
    const own = { ...OTHER, hudKeys: { ready: 'andrew.test_legendary.ready', cooldown: 'andrew.test_legendary.cooldown' } };
    LEGENDARIES.push(own);
    t.after(() => LEGENDARIES.splice(LEGENDARIES.indexOf(own), 1));
    const item = unmarked(own.itemId);

    globalThis.__nowMs = 5_000_000;
    assert.deepStrictEqual(hudMessage(makePlayer(item, undefined)), {
      rawtext: [{ translate: 'andrew.test_legendary.ready', with: { rawtext: [{ translate: 'item.andrew:test_legendary.name' }] } }],
    });
    const cooling = makePlayer(item, sword);
    startCooldown(cooling, own.abilityKey);
    globalThis.__nowMs = 5_000_000 + 1_500;
    assert.deepStrictEqual(hudMessage(cooling), {
      rawtext: [
        { translate: 'andrew.test_legendary.cooldown', with: { rawtext: [{ translate: 'item.andrew:test_legendary.name' }, { text: '29' }] } },
        { text: '   ' },
        { translate: 'andrew.legendary.ready', with: { rawtext: [{ translate: 'item.andrew:web_sword.name' }] } },
      ],
    });
  });
});

// R-lgnd-018: a def with no ability (crossbow §1, §9, §10). The crossbow item
// does not exist yet, so a test-only passive def stands in for it.
test('a passive def has no Use claim, no HUD line and no timer (R-lgnd-018, L0-lgnd-ac26)', async (t) => {
  const PASSIVE = {
    itemId: 'andrew:test_passive',
    keyPrefix: 'tp',
    nameKey: 'item.andrew:test_passive',
    craftGate: true,
    craftTokenId: 'andrew:test_passive_crafted',
    refund: [],
    textPrefix: 'andrew.test_passive',
    command: 'andrew:testpassive',
  };
  LEGENDARIES.push(PASSIVE);
  t.after(() => LEGENDARIES.splice(LEGENDARIES.indexOf(PASSIVE), 1));

  const unmarked = (typeId) => ({ typeId, getDynamicProperty: () => undefined });
  const passive = unmarked(PASSIVE.itemId);
  const katana = unmarked(DRAGON_KATANA.itemId);
  const cannon = unmarked(ORBITAL_CANNON.itemId);
  const hit = (player) => {
    const h = resolveActivation(player);
    return h === undefined ? 'none' : `${h.slot}:${h.def.itemId}`;
  };
  const katanaReady =
    '{"rawtext":[{"translate":"andrew.katana.hud_ready","with":{"rawtext":[{"translate":"item.andrew:dragon_katana.name"}]}}]}';
  const katanaCooling =
    '{"rawtext":[{"translate":"andrew.katana.hud_cooldown","with":{"rawtext":[{"translate":"item.andrew:dragon_katana.name"},{"text":"27"}]}}]}';
  const timers = (player) => [...player.props.keys()].filter((k) => k.startsWith('andrew:cd_') || k.startsWith('andrew:busy_'));

  await t.test('hasAbility is false for it, and no ability lookup returns it', () => {
    assert.strictEqual(hasAbility(PASSIVE), false);
    assert.strictEqual(defForAbility(undefined), undefined);
    assert.strictEqual(defForAbility('undefined'), undefined);
    assert.strictEqual(defFor(PASSIVE.itemId), PASSIVE);
  });

  await t.test('it is still a held legendary, in either hand (AD-lgnd-15 §4)', () => {
    assert.deepStrictEqual(
      heldLegendaries(makePlayer(passive, katana)).map(({ def, slot }) => `${slot}:${def.itemId}`),
      ['Mainhand:andrew:test_passive', 'Offhand:andrew:dragon_katana']
    );
    assert.deepStrictEqual(
      heldLegendaries(makePlayer(undefined, passive)).map(({ def, slot }) => `${slot}:${def.itemId}`),
      ['Offhand:andrew:test_passive']
    );
  });

  await t.test('held alone, in either hand: no HUD message and no Use', () => {
    globalThis.__nowMs = 1_000_000;
    for (const player of [makePlayer(passive, undefined), makePlayer(undefined, passive), makePlayer(passive, passive)]) {
      assert.strictEqual(hudMessage(player), undefined);
      assert.strictEqual(hit(player), 'none');
      assert.deepStrictEqual(timers(player), []);
    }
  });

  await t.test('passive main hand: a ready off-hand Katana or Cannon answers the Use', () => {
    globalThis.__nowMs = 1_000_000;
    assert.strictEqual(hit(makePlayer(passive, katana)), 'Offhand:andrew:dragon_katana');
    assert.strictEqual(hit(makePlayer(passive, cannon)), 'Offhand:andrew:orbital_cannon');
  });

  await t.test('passive main hand: a cooling or busy off-hand Katana still answers nothing', () => {
    globalThis.__nowMs = 1_000_000;
    const cooling = makePlayer(passive, katana);
    startCooldown(cooling, DRAGON_KATANA.abilityKey);
    assert.strictEqual(hit(cooling), 'none');
    const busy = makePlayer(passive, katana);
    setBusy(busy, DRAGON_KATANA.abilityKey, 5000);
    assert.strictEqual(hit(busy), 'none');
  });

  await t.test('Katana main hand, passive off hand: the Katana keeps the Use as before', () => {
    globalThis.__nowMs = 1_000_000;
    assert.strictEqual(hit(makePlayer(katana, passive)), 'Mainhand:andrew:dragon_katana');
    const cooling = makePlayer(katana, passive);
    startCooldown(cooling, DRAGON_KATANA.abilityKey);
    assert.strictEqual(hit(cooling), 'none');
  });

  await t.test('next to a Katana, the HUD shows only the Katana line, byte for byte', () => {
    globalThis.__nowMs = 1_000_000;
    assert.strictEqual(JSON.stringify(hudMessage(makePlayer(passive, katana))), katanaReady);
    assert.strictEqual(JSON.stringify(hudMessage(makePlayer(katana, passive))), katanaReady);
    const cooling = makePlayer(passive, katana);
    startCooldown(cooling, DRAGON_KATANA.abilityKey);
    globalThis.__nowMs = 1_000_000 + 3_001;
    assert.strictEqual(JSON.stringify(hudMessage(cooling)), katanaCooling);
    assert.deepStrictEqual(timers(cooling), ['andrew:cd_dragon_katana']);
  });
});
