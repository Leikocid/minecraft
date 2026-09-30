import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { build, transformSync } from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const readJson = (...parts) => JSON.parse(readFileSync(join(projectRoot, 'packs', ...parts), 'utf-8'));

const item = readJson('behavior', 'items', 'orbital_cannon.json')['minecraft:item'];
const token = readJson('behavior', 'items', 'orbital_cannon_crafted.json')['minecraft:item'];
const recipe = readJson('behavior', 'recipes', 'orbital_cannon.json')['minecraft:recipe_shaped'];
const charge = readJson('behavior', 'entities', 'orbital_charge.json')['minecraft:entity'];
const clientCharge = readJson('resource', 'entity', 'orbital_charge.entity.json')['minecraft:client_entity'];

function parseLang(file) {
  const entries = new Map();
  for (const line of readFileSync(join(projectRoot, 'packs', 'resource', 'texts', file), 'utf-8').split(/\r?\n/)) {
    const idx = line.indexOf('=');
    if (idx > 0 && !line.startsWith('#')) entries.set(line.slice(0, idx), line.slice(idx + 1));
  }
  return entries;
}
const en = parseLang('en_US.lang');
const ru = parseLang('ru_RU.lang');

// ------------------------------------------------------------------ item (L0-orbc-ent1, r001)

test('Orbital Cannon item JSON: what it has', async (t) => {
  const c = item.components;

  await t.test('identifier and display name', () => {
    assert.equal(item.description.identifier, 'andrew:orbital_cannon');
    assert.deepEqual(c['minecraft:display_name'], { value: 'item.andrew:orbital_cannon.name' });
  });

  await t.test('the vanilla fishing_rod atlas entry is the icon; no texture of its own', () => {
    assert.equal(c['minecraft:icon'], 'fishing_rod');
    const atlas = readJson('resource', 'textures', 'item_texture.json').texture_data;
    assert.ok(!('fishing_rod' in atlas), 'item_texture.json must not shadow the vanilla fishing_rod entry');
    assert.ok(!Object.keys(atlas).some((k) => k.includes('orbital')), 'no custom Cannon texture');
  });

  await t.test('Creative: Equipment with no group (L0-orbc-as07)', () => {
    assert.deepEqual(item.description.menu_category, { category: 'equipment' });
  });

  await t.test('stack of 1, held like a tool, allowed in the off hand, fire resistant', () => {
    assert.equal(c['minecraft:max_stack_size'], 1);
    assert.equal(c['minecraft:hand_equipped'], true);
    assert.deepEqual(c['minecraft:allow_off_hand'], { value: true });
    assert.deepEqual(c['minecraft:fire_resistant'], { value: true });
  });

  await t.test('format_version accepts the object forms and the no-group category', () => {
    assert.equal(readJson('behavior', 'items', 'orbital_cannon.json').format_version, '1.21.90');
  });
});

// r001: every rod/tool/weapon behaviour is absent by omission. Nothing is
// enforced by script, so a component added here silently brings it back.
test('Orbital Cannon item JSON: what it must not have', () => {
  const forbidden = [
    'minecraft:durability',
    'minecraft:enchantable',
    'minecraft:damage',
    'minecraft:digger',
    'minecraft:tags',
    'minecraft:use_modifiers',
    'minecraft:shooter',
    'minecraft:throwable',
  ];
  for (const key of forbidden) {
    assert.ok(!(key in item.components), `${key} must be absent (L0-orbc-r001)`);
  }
  assert.deepEqual(
    Object.keys(item.components).sort(),
    [
      'minecraft:allow_off_hand',
      'minecraft:display_name',
      'minecraft:fire_resistant',
      'minecraft:hand_equipped',
      'minecraft:icon',
      'minecraft:max_stack_size',
    ],
    'the component list is closed: anything else needs a KV decision first'
  );
});

test('craft token: hidden from Creative, looks like the Cannon, does nothing else', () => {
  assert.equal(token.description.identifier, 'andrew:orbital_cannon_crafted');
  assert.deepEqual(token.description.menu_category, { category: 'none' });
  assert.equal(token.components['minecraft:icon'], item.components['minecraft:icon']);
  assert.deepEqual(token.components['minecraft:display_name'], item.components['minecraft:display_name']);
  assert.equal(token.components['minecraft:max_stack_size'], 1);
  for (const key of ['minecraft:durability', 'minecraft:enchantable', 'minecraft:damage', 'minecraft:allow_off_hand']) {
    assert.ok(!(key in token.components), `token must not carry ${key}`);
  }
});

// ------------------------------------------------------------------ recipe (L0-orbc-r002)

test('recipe is the TNT cross around a fishing rod, and yields one craft token', () => {
  assert.equal(recipe.description.identifier, 'andrew:orbital_cannon');
  assert.deepEqual(recipe.tags, ['crafting_table']);
  assert.deepEqual(recipe.pattern, [' T ', 'TRT', ' T ']);
  assert.deepEqual(recipe.key, { T: { item: 'minecraft:tnt' }, R: { item: 'minecraft:fishing_rod' } });
  assert.deepEqual(recipe.result, { item: 'andrew:orbital_cannon_crafted', count: 1 });
  // r002 says "no unlock, as the other legendaries do"; they all have one.
  assert.deepEqual(recipe.unlock, [{ item: 'minecraft:tnt' }]);
});

// ------------------------------------------------------------------ lang (r002, L0-adr-oded §1)

const CANNON_KEYS = [
  'item.andrew:orbital_cannon.name',
  'andrew.orbital.first_craft',
  'andrew.orbital.craft_blocked',
  'andrew.orbital.returned',
  'andrew.orbital.admin_given',
  'andrew.orbital.reset',
  'andrew.orbital.hud_ready',
  'andrew.orbital.hud_cooldown',
];
const isCannonKey = (key) => key === 'item.andrew:orbital_cannon.name' || key.startsWith('andrew.orbital.');

test('lang: the same Cannon key set in en_US and ru_RU, all non-empty', () => {
  assert.deepEqual([...en.keys()].filter(isCannonKey).sort(), [...CANNON_KEYS].sort());
  assert.deepEqual([...ru.keys()].filter(isCannonKey).sort(), [...CANNON_KEYS].sort());
  for (const key of CANNON_KEYS) {
    assert.ok(en.get(key).trim().length > 0, `en_US: ${key} is empty`);
    assert.ok(ru.get(key).trim().length > 0, `ru_RU: ${key} is empty`);
  }
});

test('lang: names and HUD wording', () => {
  assert.equal(en.get('item.andrew:orbital_cannon.name'), 'Orbital Cannon');
  assert.equal(ru.get('item.andrew:orbital_cannon.name'), 'Орбитальная пушка');
  // Em dash, and no space before the unit.
  assert.equal(en.get('andrew.orbital.hud_ready'), '%s — Ready');
  assert.equal(ru.get('andrew.orbital.hud_ready'), '%s — Готово');
  assert.equal(en.get('andrew.orbital.hud_cooldown'), '%s — %ss');
  assert.equal(ru.get('andrew.orbital.hud_cooldown'), '%s — %sс');
});

test('lang: every Cannon message takes the same arguments as its Web Sword counterpart', () => {
  const args = (s) => (s.match(/%s/g) ?? []).length;
  for (const suffix of ['first_craft', 'craft_blocked', 'returned', 'admin_given', 'reset']) {
    const sword = en.get(`andrew.web_sword.${suffix}`);
    for (const lang of [en, ru]) {
      assert.equal(args(lang.get(`andrew.orbital.${suffix}`)), args(sword), `andrew.orbital.${suffix}`);
    }
  }
});

function sourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(full));
    else if (entry.name.endsWith('.ts')) out.push(full);
  }
  return out;
}

// §13: user-facing text lives in the lang files only. esbuild drops comments,
// so a comment naming the Cannon is not a hit; a string literal is.
test('no user-facing Cannon string is hard-coded in src/', () => {
  const fragments = new Set(['Orbital Cannon', 'Орбитальн']);
  for (const key of CANNON_KEYS) {
    for (const value of [en.get(key), ru.get(key)]) {
      for (const part of value.replace(/§./g, '').split('%s')) {
        if (part.trim().length >= 4) fragments.add(part.trim());
      }
    }
  }
  const hits = [];
  for (const file of sourceFiles(join(projectRoot, 'src'))) {
    const code = transformSync(readFileSync(file, 'utf-8'), { loader: 'ts' }).code;
    for (const fragment of fragments) {
      if (code.includes(fragment)) hits.push(`${relative(projectRoot, file)}: "${fragment}"`);
    }
  }
  assert.deepEqual(hits, []);
});

// ------------------------------------------------------------------ registry (L0-orbc-ent1)

const minecraftServerStub = {
  name: 'minecraft-server-stub',
  setup(pluginBuild) {
    pluginBuild.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: '@minecraft/server', namespace: 'mc-stub' }));
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
      "export { startCooldown } from './src/legendary/cooldown.ts';",
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
const lg = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64'));
const { ORBITAL_CANNON, LEGENDARIES } = lg;

test('LEGENDARIES entry for the Cannon', () => {
  assert.ok(LEGENDARIES.includes(ORBITAL_CANNON));
  assert.deepEqual(
    { ...ORBITAL_CANNON, refund: ORBITAL_CANNON.refund.map((r) => [...r]) },
    {
      itemId: 'andrew:orbital_cannon',
      keyPrefix: 'oc',
      abilityKey: 'orbital_cannon',
      nameKey: 'item.andrew:orbital_cannon',
      cooldownTicks: 600,
      craftGate: true,
      craftTokenId: 'andrew:orbital_cannon_crafted',
      refund: [
        ['minecraft:tnt', 4],
        ['minecraft:fishing_rod', 1],
      ],
      textPrefix: 'andrew.orbital',
      command: 'andrew:orbital',
      hudKeys: { ready: 'andrew.orbital.hud_ready', cooldown: 'andrew.orbital.hud_cooldown' },
    }
  );
});

test('the Cannon derives the persistent keys L0-orbc-ent1 lists', () => {
  const keys = lg.keysFor(ORBITAL_CANNON);
  assert.deepEqual(
    [keys.origin, keys.owner, keys.id, keys.ownerName],
    ['andrew:oc_origin', 'andrew:oc_owner', 'andrew:oc_id', 'andrew:oc_owner_name']
  );
  assert.deepEqual([keys.crafted, keys.craftedBy], ['andrew:oc_crafted', 'andrew:oc_crafted_by']);
  assert.equal(keys.pending, 'andrew:oc_pending');
  assert.equal(lg.cooldownKey(ORBITAL_CANNON.abilityKey), 'andrew:cd_orbital_cannon');
  assert.equal(ORBITAL_CANNON.cooldownTicks, 600);

  const others = LEGENDARIES.filter((d) => d !== ORBITAL_CANNON).flatMap((d) => Object.values(lg.keysFor(d)));
  for (const key of Object.values(keys)) assert.ok(!others.includes(key), `${key} collides with another legendary`);
});

test('the registry finds the Cannon by item, token and ability', () => {
  assert.equal(lg.defFor('andrew:orbital_cannon'), ORBITAL_CANNON);
  assert.equal(lg.defForToken({ typeId: 'andrew:orbital_cannon_crafted' }), ORBITAL_CANNON);
  assert.equal(lg.defForAbility('orbital_cannon'), ORBITAL_CANNON);
});

// L0-lgnd "LegendaryDef" invariant: the refund hands back exactly what the recipe took.
test('every legendary refund equals its recipe ingredients', () => {
  for (const def of LEGENDARIES) {
    const r = readJson('behavior', 'recipes', `${def.itemId.split(':')[1]}.json`)['minecraft:recipe_shaped'];
    const counts = new Map();
    for (const symbol of r.pattern.join('')) {
      if (symbol === ' ') continue;
      const id = r.key[symbol].item;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    assert.deepEqual(
      new Map(def.refund.map(([id, n]) => [id, n])),
      counts,
      `${def.itemId}: refund does not match the recipe`
    );
  }
});

test('the HUD renders the Cannon through its own keys', () => {
  const props = new Map();
  const hands = { Mainhand: { typeId: 'andrew:orbital_cannon', getDynamicProperty: () => undefined }, Offhand: undefined };
  const player = {
    getDynamicProperty: (key) => props.get(key),
    setDynamicProperty: (key, value) => (value === undefined ? props.delete(key) : props.set(key, value)),
    getComponent: (id) => (id === 'minecraft:equippable' ? { getEquipment: (slot) => hands[slot] } : undefined),
  };
  const realNow = Date.now;
  try {
    Date.now = () => 1_000_000;
    const name = { translate: 'item.andrew:orbital_cannon.name' };
    assert.deepEqual(lg.hudMessage(player), { rawtext: [{ translate: 'andrew.orbital.hud_ready', with: { rawtext: [name] } }] });
    lg.startCooldown(player, 'orbital_cannon');
    Date.now = () => 1_000_000 + 3_000;
    assert.deepEqual(lg.hudMessage(player), {
      rawtext: [{ translate: 'andrew.orbital.hud_cooldown', with: { rawtext: [name, { text: '27' }] } }],
    });
    hands.Offhand = hands.Mainhand;
    hands.Mainhand = undefined;
    assert.equal(lg.hudMessage(player).rawtext[0].translate, 'andrew.orbital.hud_cooldown');
  } finally {
    Date.now = realNow;
  }
});

// ------------------------------------------------------------------ charge entity (L0-orbc-ent3)

// format_version 1.26.50 drops minecraft:pushable (BDS 1.26.51.1 refuses the
// whole entity: "not present in the Schema"); its successors pushable_by_entity
// and pushable_by_block push by mere presence. 1.26.0 is vanilla TNT's version.
test('charge entity: format_version keeps the explicit minecraft:pushable', () => {
  assert.equal(readJson('behavior', 'entities', 'orbital_charge.json').format_version, '1.26.0');
  for (const key of ['minecraft:pushable_by_entity', 'minecraft:pushable_by_block']) {
    assert.ok(!(key in charge.components), `${key} makes it pushable`);
  }
});

test('charge entity: summonable by script only, inert, indestructible', () => {
  const d = charge.description;
  const c = charge.components;
  assert.equal(d.identifier, 'andrew:orbital_charge');
  assert.equal(d.is_summonable, true);
  assert.equal(d.is_spawnable, false);
  assert.ok(!('spawn_egg' in (clientCharge.description ?? {})), 'no spawn egg');
  assert.deepEqual(c['minecraft:collision_box'], { width: 0, height: 0 });
  assert.deepEqual(c['minecraft:physics'], { has_gravity: false, has_collision: false });
  assert.deepEqual(c['minecraft:pushable'], { is_pushable: false, is_pushable_by_piston: false });
  assert.deepEqual(c['minecraft:knockback_resistance'], { value: 1.0 });
  assert.deepEqual(c['minecraft:damage_sensor'], { triggers: { cause: 'all', deals_damage: 'no' } });
});

test('charge entity: nothing keeps it or despawns it — cleanup is scripted (L0-orbc-p003)', () => {
  const everywhere = [charge.components, ...Object.values(charge.component_groups ?? {})];
  for (const components of everywhere) {
    assert.ok(!('minecraft:persistent' in components), 'minecraft:persistent must be absent');
    assert.ok(!('minecraft:despawn' in components), 'minecraft:despawn must be absent');
  }
});

// The 1.0/1.2 scale is BP: property andrew:scale plus a component group with
// minecraft:scale, entered only through andrew:scale_rmb|lmb (e.g. as spawnEvent).
// The server holds minecraft:scale, so BDS reads 1.0/1.2 back; an RP Molang scale is visible only on a device.
test('charge entity: the scale is set in the behavior pack, by one event per mode', () => {
  assert.deepEqual(charge.description.properties, {
    'andrew:scale': { type: 'int', range: [0, 1], default: 0, client_sync: false },
  });
  assert.deepEqual(charge.component_groups, {
    'andrew:scale_rmb': { 'minecraft:scale': { value: 1.0 } },
    'andrew:scale_lmb': { 'minecraft:scale': { value: 1.2 } },
  });
  assert.ok(!('minecraft:scale' in charge.components), 'a base scale would compete with the groups');
  assert.deepEqual(charge.events, {
    'andrew:scale_rmb': {
      remove: { component_groups: ['andrew:scale_lmb'] },
      add: { component_groups: ['andrew:scale_rmb'] },
      set_property: { 'andrew:scale': 0 },
    },
    'andrew:scale_lmb': {
      remove: { component_groups: ['andrew:scale_rmb'] },
      add: { component_groups: ['andrew:scale_lmb'] },
      set_property: { 'andrew:scale': 1 },
    },
  });
  assert.ok(!('scripts' in clientCharge.description), 'an RP scale would multiply the BP one');
});

test('charge client entity: vanilla TNT textures, no asset of its own', () => {
  const d = clientCharge.description;
  assert.equal(d.identifier, 'andrew:orbital_charge');
  assert.deepEqual(d.textures, {
    side: 'textures/blocks/tnt_side',
    top: 'textures/blocks/tnt_top',
    bottom: 'textures/blocks/tnt_bottom',
  });
  for (const path of Object.values(d.textures)) {
    for (const ext of ['.png', '.tga']) {
      assert.ok(!existsSync(join(projectRoot, 'packs', 'resource', path + ext)), `${path}${ext} would shadow the vanilla texture`);
    }
  }
  const geo = readJson('resource', 'models', 'entity', 'orbital_charge.geo.json')['minecraft:geometry'];
  const faces = Object.fromEntries(geo.map((g) => [g.description.identifier, Object.keys(g.bones[0].cubes[0].uv).sort()]));
  assert.deepEqual(faces, {
    'geometry.andrew.orbital_charge.side': ['east', 'north', 'south', 'west'],
    'geometry.andrew.orbital_charge.top': ['up'],
    'geometry.andrew.orbital_charge.bottom': ['down'],
  });
  for (const g of geo) {
    assert.deepEqual(g.bones[0].cubes[0].size, [16, 16, 16], 'one full block');
    assert.deepEqual([g.description.texture_width, g.description.texture_height], [16, 16]);
  }
});
