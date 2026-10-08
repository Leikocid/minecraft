import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const itemJsonPath = join(projectRoot, 'packs', 'behavior', 'items', 'storm_blade.json');
const tokenJsonPath = join(projectRoot, 'packs', 'behavior', 'items', 'storm_blade_crafted.json');
const recipeJsonPath = join(projectRoot, 'packs', 'behavior', 'recipes', 'storm_blade.json');
const itemTexturePath = join(projectRoot, 'packs', 'resource', 'textures', 'item_texture.json');
const enLangPath = join(projectRoot, 'packs', 'resource', 'texts', 'en_US.lang');
const ruLangPath = join(projectRoot, 'packs', 'resource', 'texts', 'ru_RU.lang');

const itemJson = JSON.parse(readFileSync(itemJsonPath, 'utf-8'));
const tokenJson = JSON.parse(readFileSync(tokenJsonPath, 'utf-8'));
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

// Spec §02 asks for "ordinary hit = Diamond Sword damage", not a fixed
// "spec" number — docs/feedback/probe-storm.md P2 (`RES bare R0 melee alone:
// swing(true)=8.00`) measured the real vanilla minecraft:diamond_sword
// against a bare SimulatedPlayer target on BDS 1.26.51.1: 8, not the 7
// carried by Web Sword/Dragon Katana's item JSON from before that probe ran.
const MEASURED_DIAMOND_SWORD_DAMAGE = 8;

test('Storm Blade item JSON', async (t) => {
  await t.test('parses successfully', () => {
    assert.ok(itemJson, 'item JSON should be a valid object');
    assert.ok(itemJson['minecraft:item'], 'item JSON must have minecraft:item root');
  });

  await t.test('identifier is andrew:storm_blade', () => {
    const identifier = itemJson['minecraft:item'].description?.identifier;
    assert.strictEqual(identifier, 'andrew:storm_blade', 'identifier must be andrew:storm_blade');
  });

  await t.test('max stack size is 1 and hand-equipped', () => {
    const components = itemJson['minecraft:item'].components ?? {};
    assert.strictEqual(components['minecraft:max_stack_size'], 1, 'max_stack_size must be 1');
    assert.strictEqual(components['minecraft:hand_equipped'], true, 'hand_equipped must be true');
  });

  await t.test('damage equals the probe-measured vanilla Diamond Sword value', () => {
    const damage = itemJson['minecraft:item'].components?.['minecraft:damage'];
    assert.ok(damage, 'minecraft:damage component must be present');
    const value = typeof damage === 'number' ? damage : damage.value;
    assert.strictEqual(
      value,
      MEASURED_DIAMOND_SWORD_DAMAGE,
      `damage must equal the probe-measured vanilla diamond_sword value (${MEASURED_DIAMOND_SWORD_DAMAGE})`
    );
  });

  await t.test('does not have a durability component (infinite durability)', () => {
    const components = itemJson['minecraft:item'].components ?? {};
    assert.ok(
      !Object.prototype.hasOwnProperty.call(components, 'minecraft:durability'),
      'minecraft:durability must not be present — durability is infinite by omission'
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
      'menu_category.group must be the namespaced sword group'
    );
  });

  await t.test('is fire resistant, so it stays in place in lava and fire instead of being destroyed and returned', () => {
    const fireResistant = itemJson['minecraft:item'].components?.['minecraft:fire_resistant'];
    assert.ok(fireResistant, 'minecraft:fire_resistant component must be present');
    const value = typeof fireResistant === 'boolean' ? fireResistant : fireResistant.value;
    assert.strictEqual(value, true, 'minecraft:fire_resistant.value must be true');
  });

  await t.test('is admitted to the off hand (minecraft:allow_off_hand)', () => {
    const allow = itemJson['minecraft:item'].components?.['minecraft:allow_off_hand'];
    assert.ok(allow !== undefined, 'minecraft:allow_off_hand must be present — without it the item cannot be held in the off hand');
    const value = typeof allow === 'boolean' ? allow : allow.value;
    assert.strictEqual(value, true, 'minecraft:allow_off_hand must be true');
  });

  await t.test('its craft token is not admitted to the off hand', () => {
    assert.strictEqual(tokenJson['minecraft:item'].components?.['minecraft:allow_off_hand'], undefined);
  });

  await t.test('its craft token has menu_category none, like the other tokens', () => {
    assert.strictEqual(tokenJson['minecraft:item'].description?.menu_category?.category, 'none');
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

test('Storm Blade recipe', async (t) => {
  await t.test('parses successfully', () => {
    assert.ok(recipeJson, 'recipe JSON should be a valid object');
    assert.ok(recipeJson['minecraft:recipe_shaped'], 'recipe JSON must have minecraft:recipe_shaped root');
  });

  await t.test('is tagged for the crafting table', () => {
    const tags = recipeJson['minecraft:recipe_shaped'].tags ?? [];
    assert.ok(tags.includes('crafting_table'), 'recipe must be tagged "crafting_table"');
  });

  // Spec §02: lightning rods top/bottom centre, wind charges either side of
  // the diamond sword centre. Ingredient ids checked against a real BDS
  // 1.26.51.1 crafter in the give/craft GameTest (AC#6): a wrong id fails the
  // replaceitem command there, not silently.
  await t.test('matrix is two lightning rods and two wind charges around the diamond sword', () => {
    const recipe = recipeJson['minecraft:recipe_shaped'];
    assert.deepStrictEqual(recipe.pattern, [' L ', 'WSW', ' L '], 'pattern must match the spec 3x3 layout');

    const key = recipe.key;
    assert.strictEqual(key.L?.item, 'minecraft:lightning_rod', 'L must resolve to minecraft:lightning_rod');
    assert.strictEqual(key.W?.item, 'minecraft:wind_charge', 'W must resolve to minecraft:wind_charge');
    assert.strictEqual(key.S?.item, 'minecraft:diamond_sword', 'S must resolve to minecraft:diamond_sword');
    assert.strictEqual(key.S?.data, undefined, 'S must accept any diamond sword (no data/aux filter)');

    const countOf = (ch) => recipe.pattern.join('').split('').filter((c) => c === ch).length;
    assert.strictEqual(countOf('L'), 2, 'exactly 2 lightning rods are required');
    assert.strictEqual(countOf('W'), 2, 'exactly 2 wind charges are required');
  });

  await t.test('result is exactly one andrew:storm_blade_crafted — the token, not the weapon', () => {
    const result = recipeJson['minecraft:recipe_shaped'].result;
    assert.strictEqual(result.item, 'andrew:storm_blade_crafted', 'result item must be the craft token andrew:storm_blade_crafted');
    assert.strictEqual(result.count ?? 1, 1, 'result count must be 1');
  });

  await t.test('does not use experimental/beta formats', () => {
    assert.strictEqual(typeof recipeJson.format_version, 'string', 'format_version must be set');
    const recipeStr = JSON.stringify(recipeJson);
    assert.ok(!recipeStr.includes('experimental'), 'recipe JSON must not have experimental flags');
    assert.ok(!recipeStr.toLowerCase().includes('beta'), 'recipe JSON must not reference beta formats');
  });
});

test('Storm Blade texture', async (t) => {
  await t.test('referenced PNG file exists and is 16x16', () => {
    const textureKey = 'andrew_storm_blade';
    const texturePath = itemTexture.texture_data[textureKey]?.textures;
    assert.ok(texturePath, `texture_data.${textureKey}.textures must be set`);

    const pngPath = join(projectRoot, 'packs', 'resource', `${texturePath}.png`);
    assert.ok(existsSync(pngPath), `referenced PNG must exist at ${pngPath}`);

    const { width, height } = readPngSize(pngPath);
    assert.strictEqual(width, 16, 'PNG width must be 16');
    assert.strictEqual(height, 16, 'PNG height must be 16');
  });
});

test('Storm Blade localization catalogue: RU/EN key parity', async (t) => {
  const expectedKeys = [
    'item.andrew:storm_blade.name',
    'andrew.storm_blade.first_craft',
    'andrew.storm_blade.craft_blocked',
    'andrew.storm_blade.returned',
    'andrew.storm_blade.admin_given',
    'andrew.storm_blade.reset',
    'andrew.storm_blade.hud_ready',
    'andrew.storm_blade.hud_cooldown',
  ];

  await t.test('every catalogued key is present, non-empty, in both languages', () => {
    for (const key of expectedKeys) {
      assert.ok(enLang.has(key), `en_US.lang is missing "${key}"`);
      assert.ok(ruLang.has(key), `ru_RU.lang is missing "${key}"`);
      assert.ok(enLang.get(key).length > 0, `en_US.lang: "${key}" must not be empty`);
      assert.ok(ruLang.get(key).length > 0, `ru_RU.lang: "${key}" must not be empty`);
    }
  });

  await t.test('the two files define the exact same set of andrew.storm_blade.* / storm_blade item keys', () => {
    const stormBladeKeys = (lang) =>
      [...lang.keys()].filter((k) => k.startsWith('andrew.storm_blade.') || k === 'item.andrew:storm_blade.name').sort();
    assert.deepStrictEqual(
      stormBladeKeys(enLang),
      stormBladeKeys(ruLang),
      'en_US.lang and ru_RU.lang must define the exact same Storm Blade key set'
    );
  });

  // Spec §02: the HUD line uses an em dash, not the shared "name: state" colon
  // format other passive-owning defs with no hudKeys fall back to.
  await t.test('the HUD lines use an em dash, not a colon', () => {
    assert.strictEqual(enLang.get('andrew.storm_blade.hud_ready'), '%s — Ready');
    assert.strictEqual(ruLang.get('andrew.storm_blade.hud_ready'), '%s — Готово');
  });
});
