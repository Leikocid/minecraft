import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const itemJsonPath = join(projectRoot, 'packs', 'behavior', 'items', 'web_sword.json');
const recipeJsonPath = join(projectRoot, 'packs', 'behavior', 'recipes', 'web_sword.json');
const itemTexturePath = join(projectRoot, 'packs', 'resource', 'textures', 'item_texture.json');
const enLangPath = join(projectRoot, 'packs', 'resource', 'texts', 'en_US.lang');
const ruLangPath = join(projectRoot, 'packs', 'resource', 'texts', 'ru_RU.lang');

const itemJson = JSON.parse(readFileSync(itemJsonPath, 'utf-8'));
const recipeJson = JSON.parse(readFileSync(recipeJsonPath, 'utf-8'));
const itemTexture = JSON.parse(readFileSync(itemTexturePath, 'utf-8'));
const enLangRaw = readFileSync(enLangPath, 'utf-8');
const ruLangRaw = readFileSync(ruLangPath, 'utf-8');

function parseLang(raw) {
  const entries = new Map();
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    entries.set(trimmed.slice(0, idx), trimmed.slice(idx + 1));
  }
  return entries;
}

const enLang = parseLang(enLangRaw);
const ruLang = parseLang(ruLangRaw);

function versionAtLeast(version, min) {
  const parts = String(version).split('.').map(Number);
  for (let i = 0; i < min.length; i++) {
    const a = parts[i] ?? 0;
    const b = min[i];
    if (a !== b) return a > b;
  }
  return true;
}

// Minimal PNG IHDR reader (no external image libraries).
function readPngSize(path) {
  const buf = readFileSync(path);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.ok(buf.subarray(0, 8).equals(signature), `${path} must be a valid PNG (signature mismatch)`);
  const chunkType = buf.subarray(12, 16).toString('ascii');
  assert.strictEqual(chunkType, 'IHDR', 'first chunk must be IHDR');
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

// Vanilla Diamond Sword attack damage, as recorded by decision-web-sword-item-values.
//
// Where this number comes from: BDS 1.26.51.1 (container `andrew-bds`) no longer
// ships item component data as loose JSON — `docker exec andrew-bds sh -c
// 'find /data/behavior_packs/vanilla_1.26.50 -iname "diamond_sword*"'` finds
// nothing; item stats for vanilla weapons are compiled into the engine binary,
// not shipped as data (unlike blocks, loot tables and recipes, which are still
// loose JSON in the same pack). Confirmed by dumping item_catalog.brarchive as
// text: it lists `minecraft:diamond_sword` only as a creative-menu catalog
// entry, with no damage/attribute field anywhere in the archive.
//
// The stable `@minecraft/server` 2.10.0 API (installed under
// node_modules/@minecraft/server) has no `ItemDamageComponent` /
// `ItemComponentTypes.Damage` either — grepping index.d.ts for "minecraft:damage"
// returns nothing — so the value cannot be read in-engine via script.
//
// Value used: 7. This is vanilla Diamond Sword's base attack damage in both
// Bedrock and Java Edition, unchanged since the 1.9-era combat parity update
// and still current on 1.26.x (Bedrock per-tier sword bonus: wood/gold 4,
// stone 5, iron 6, diamond 7, netherite 8) — a stable game-balance constant,
// not a per-version data value, which matches the empirical finding above that
// no version of the vanilla pack ships it as data to override.
const VANILLA_DIAMOND_SWORD_DAMAGE = 7;

test('Web Sword item JSON', async (t) => {
  await t.test('parses successfully', () => {
    assert.ok(itemJson, 'item JSON should be a valid object');
    assert.ok(itemJson['minecraft:item'], 'item JSON must have minecraft:item root');
  });

  await t.test('identifier is andrew:web_sword', () => {
    const identifier = itemJson['minecraft:item'].description?.identifier;
    assert.strictEqual(identifier, 'andrew:web_sword', 'identifier must be andrew:web_sword');
  });

  await t.test('max stack size is 1 and hand-equipped', () => {
    const components = itemJson['minecraft:item'].components ?? {};
    assert.strictEqual(components['minecraft:max_stack_size'], 1, 'max_stack_size must be 1');
    assert.strictEqual(components['minecraft:hand_equipped'], true, 'hand_equipped must be true');
  });

  await t.test('damage equals the recorded vanilla Diamond Sword value', () => {
    const damage = itemJson['minecraft:item'].components?.['minecraft:damage'];
    assert.ok(damage, 'minecraft:damage component must be present');
    const value = typeof damage === 'number' ? damage : damage.value;
    assert.strictEqual(
      value,
      VANILLA_DIAMOND_SWORD_DAMAGE,
      `damage must equal the recorded vanilla diamond_sword value (${VANILLA_DIAMOND_SWORD_DAMAGE})`
    );
  });

  await t.test('does not have a durability component (infinite durability)', () => {
    const components = itemJson['minecraft:item'].components ?? {};
    assert.ok(
      !Object.prototype.hasOwnProperty.call(components, 'minecraft:durability'),
      'minecraft:durability must not be present — durability is infinite by omission'
    );
  });

  await t.test('does not have a cooldown component (script owns cooldown)', () => {
    const components = itemJson['minecraft:item'].components ?? {};
    assert.ok(
      !Object.prototype.hasOwnProperty.call(components, 'minecraft:cooldown'),
      'minecraft:cooldown must not be present — WS-COOL-01 implements cooldown in script ' +
        '[src: decision-q-017-zero-cells]'
    );
  });

  await t.test('is enchantable via the sword slot', () => {
    const enchantable = itemJson['minecraft:item'].components?.['minecraft:enchantable'];
    assert.ok(enchantable, 'minecraft:enchantable component must be present');
    assert.strictEqual(enchantable.slot, 'sword', 'enchantable slot must be "sword"');
    assert.ok(typeof enchantable.value === 'number' && enchantable.value > 0, 'enchantable value must be a positive number');
  });

  await t.test('has the is_sword and is_tool tags', () => {
    const tags = itemJson['minecraft:item'].components?.['minecraft:tags']?.tags ?? [];
    assert.ok(tags.includes('minecraft:is_sword'), 'tags must include minecraft:is_sword');
    assert.ok(tags.includes('minecraft:is_tool'), 'tags must include minecraft:is_tool');
  });

  await t.test('menu_category is equipment / sword group', () => {
    const menuCategory = itemJson['minecraft:item'].description?.menu_category;
    assert.ok(menuCategory, 'description.menu_category must be set');
    assert.strictEqual(menuCategory.category, 'equipment', 'menu_category.category must be "equipment"');
    assert.strictEqual(
      menuCategory.group,
      'minecraft:itemGroup.name.sword',
      'menu_category.group must be the namespaced sword group (format_version >= 1.21.90 refuses a bare group name)'
    );
  });

  // CNTR-XCX10-AA / LGND-FIREPROOF-01-AA: Orbital §5 wants a legendary to
  // never be destroyed. Fire and lava are met literally via this component
  // (measured on BDS 1.26.51.1 — a marked andrew:web_sword without it burns
  // in both; with it, it survives 80 ticks); cactus, explosions and despawn
  // still fall back to destroyed-then-returned (recovery.ts).
  await t.test('is fire resistant, so it stays in place in lava and fire instead of being destroyed and returned', () => {
    const fireResistant = itemJson['minecraft:item'].components?.['minecraft:fire_resistant'];
    assert.ok(fireResistant, 'minecraft:fire_resistant component must be present');
    const value = typeof fireResistant === 'boolean' ? fireResistant : fireResistant.value;
    assert.strictEqual(value, true, 'minecraft:fire_resistant.value must be true');
  });

  // The object form of minecraft:fire_resistant is refused at load below
  // 1.21.90 ("expected an object"); a bare boolean parses but does nothing.
  await t.test('format_version supports the object form of minecraft:fire_resistant', () => {
    assert.ok(
      versionAtLeast(itemJson.format_version, [1, 21, 90]),
      `format_version ${itemJson.format_version} must be >= 1.21.90 for minecraft:fire_resistant as an object`
    );
  });

  await t.test('has a display_name loc key present in both languages', () => {
    const displayName = itemJson['minecraft:item'].components?.['minecraft:display_name'];
    assert.ok(displayName, 'minecraft:display_name component must be present');
    const key = typeof displayName === 'string' ? displayName : displayName.value;
    assert.ok(key, 'display_name loc key must be a non-empty string');
    assert.ok(enLang.has(key), `en_US.lang must define "${key}"`);
    assert.ok(ruLang.has(key), `ru_RU.lang must define "${key}"`);
    assert.ok(enLang.get(key).length > 0, 'en_US name must not be empty');
    assert.ok(ruLang.get(key).length > 0, 'ru_RU name must not be empty');
  });

  await t.test('has an icon referencing a texture key defined in item_texture.json', () => {
    const icon = itemJson['minecraft:item'].components?.['minecraft:icon'];
    assert.ok(icon, 'minecraft:icon component must be present');
    const textureKey = typeof icon === 'string' ? icon : icon.texture;
    assert.ok(textureKey, 'icon texture key must be a non-empty string');
    assert.ok(
      itemTexture.texture_data && itemTexture.texture_data[textureKey],
      `item_texture.json must define texture_data for "${textureKey}"`
    );
  });

  await t.test('does not use experimental/beta formats', () => {
    assert.strictEqual(typeof itemJson.format_version, 'string', 'format_version must be set');
    const itemStr = JSON.stringify(itemJson);
    assert.ok(!itemStr.includes('experimental'), 'item JSON must not have experimental flags');
    assert.ok(!itemStr.toLowerCase().includes('beta'), 'item JSON must not reference beta formats');
  });
});

test('Web Sword recipe', async (t) => {
  await t.test('parses successfully', () => {
    assert.ok(recipeJson, 'recipe JSON should be a valid object');
    assert.ok(recipeJson['minecraft:recipe_shaped'], 'recipe JSON must have minecraft:recipe_shaped root');
  });

  await t.test('is tagged for the crafting table', () => {
    const tags = recipeJson['minecraft:recipe_shaped'].tags ?? [];
    assert.ok(tags.includes('crafting_table'), 'recipe must be tagged "crafting_table"');
  });

  await t.test('matrix is a cross of 4 cobwebs around the diamond sword', () => {
    const recipe = recipeJson['minecraft:recipe_shaped'];
    assert.deepStrictEqual(recipe.pattern, [' W ', 'WSW', ' W '], 'pattern must match the spec 3x3 layout');

    const key = recipe.key;
    assert.strictEqual(key.W?.item, 'minecraft:web', 'W must resolve to minecraft:web');
    assert.strictEqual(key.S?.item, 'minecraft:diamond_sword', 'S must resolve to minecraft:diamond_sword');
    assert.strictEqual(key.S?.data, undefined, 'S must accept any diamond sword (no data/aux filter)');

    const webCount = recipe.pattern.join('').split('').filter((c) => c === 'W').length;
    assert.strictEqual(webCount, 4, 'exactly 4 web ingredients are required');
  });

  await t.test('result is exactly one andrew:web_sword', () => {
    const result = recipeJson['minecraft:recipe_shaped'].result;
    assert.strictEqual(result.item, 'andrew:web_sword', 'result item must be andrew:web_sword');
    assert.strictEqual(result.count ?? 1, 1, 'result count must be 1');
  });

  await t.test('does not use experimental/beta formats', () => {
    assert.strictEqual(typeof recipeJson.format_version, 'string', 'format_version must be set');
    const recipeStr = JSON.stringify(recipeJson);
    assert.ok(!recipeStr.includes('experimental'), 'recipe JSON must not have experimental flags');
    assert.ok(!recipeStr.toLowerCase().includes('beta'), 'recipe JSON must not reference beta formats');
  });
});

test('Web Sword texture', async (t) => {
  await t.test('referenced PNG file exists and is 16x16', () => {
    const textureKey = 'andrew_web_sword';
    const texturePath = itemTexture.texture_data[textureKey]?.textures;
    assert.ok(texturePath, `texture_data.${textureKey}.textures must be set`);

    const pngPath = join(projectRoot, 'packs', 'resource', `${texturePath}.png`);
    assert.ok(existsSync(pngPath), `referenced PNG must exist at ${pngPath}`);

    const { width, height } = readPngSize(pngPath);
    assert.strictEqual(width, 16, 'PNG width must be 16');
    assert.strictEqual(height, 16, 'PNG height must be 16');
  });
});

test('Web Sword localization catalogue: RU/EN key parity', async (t) => {
  const expectedKeys = [
    'item.andrew:web_sword.name',
    'andrew.web_sword.first_craft',
    'andrew.web_sword.craft_blocked',
    'andrew.web_sword.cooldown',
    'andrew.web_sword.ready',
    'andrew.web_sword.no_room',
    'andrew.web_sword.returned',
    'andrew.web_sword.admin_given',
    'andrew.web_sword.reset',
  ];

  await t.test('every catalogued key is present, non-empty, in both languages', () => {
    for (const key of expectedKeys) {
      assert.ok(enLang.has(key), `en_US.lang is missing "${key}"`);
      assert.ok(ruLang.has(key), `ru_RU.lang is missing "${key}"`);
      assert.ok(enLang.get(key).length > 0, `en_US.lang: "${key}" must not be empty`);
      assert.ok(ruLang.get(key).length > 0, `ru_RU.lang: "${key}" must not be empty`);
    }
  });

  await t.test('the two files define the exact same set of andrew.web_sword.* / web_sword item keys', () => {
    const webSwordKeys = (lang) =>
      [...lang.keys()].filter((k) => k.startsWith('andrew.web_sword.') || k === 'item.andrew:web_sword.name').sort();
    assert.deepStrictEqual(
      webSwordKeys(enLang),
      webSwordKeys(ruLang),
      'en_US.lang and ru_RU.lang must define the exact same Web Sword key set'
    );
  });
});

// The ability fills 27 cells with cobweb, so the sword must be able to cut it.
// An item with no destroy_speeds entry for a block breaks it at speed 1 — bare
// hand — and shipped 0.3.1 had no minecraft:digger at all: 401 ticks per
// cobweb block against 9 for a vanilla diamond sword, measured on BDS
// 1.26.51.1. Cobweb carries minecraft:is_sword_item_destructible, so one entry
// at the vanilla sword's cobweb speed of 15 restores parity.
test('digger covers sword-destructible blocks at the vanilla cobweb speed', () => {
  const digger = itemJson['minecraft:item'].components['minecraft:digger'];
  assert.ok(digger, 'minecraft:digger component is missing — cobweb would be cut by hand');
  assert.equal(digger.use_efficiency, true, 'Efficiency must be able to speed the sword up');

  const entries = digger.destroy_speeds;
  assert.ok(Array.isArray(entries) && entries.length > 0, 'destroy_speeds is empty');

  const swordBlocks = entries.find((entry) =>
    String(entry?.block?.tags ?? '').includes('minecraft:is_sword_item_destructible')
  );
  assert.ok(
    swordBlocks,
    'no destroy_speeds entry matches minecraft:is_sword_item_destructible — ' +
      'the sword would cut its own cobweb at bare-hand speed'
  );
  assert.equal(swordBlocks.speed, 15, 'cobweb speed must match a vanilla sword (15)');
});
