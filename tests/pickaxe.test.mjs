import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const itemJsonPath = join(projectRoot, 'packs', 'behavior', 'items', 'miners_pickaxe.json');
const recipeJsonPath = join(projectRoot, 'packs', 'behavior', 'recipes', 'miners_pickaxe.json');
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

test('Miner\'s Pickaxe item JSON', async (t) => {
  await t.test('parses successfully', () => {
    assert.ok(itemJson, 'item JSON should be a valid object');
    assert.ok(itemJson['minecraft:item'], 'item JSON must have minecraft:item root');
  });

  await t.test('identifier is andrew:miners_pickaxe', () => {
    const identifier = itemJson['minecraft:item'].description?.identifier;
    assert.strictEqual(identifier, 'andrew:miners_pickaxe', 'identifier must be andrew:miners_pickaxe');
  });

  await t.test('does not have a durability component (infinite durability)', () => {
    const components = itemJson['minecraft:item'].components ?? {};
    assert.ok(
      !Object.prototype.hasOwnProperty.call(components, 'minecraft:durability'),
      'minecraft:durability must not be present — durability is infinite by omission'
    );
  });

  await t.test('is enchantable via the pickaxe slot', () => {
    const enchantable = itemJson['minecraft:item'].components?.['minecraft:enchantable'];
    assert.ok(enchantable, 'minecraft:enchantable component must be present');
    assert.strictEqual(enchantable.slot, 'pickaxe', 'enchantable slot must be "pickaxe"');
    assert.ok(typeof enchantable.value === 'number' && enchantable.value > 0, 'enchantable value must be a positive number');
  });

  await t.test('menu_category is equipment / pickaxe group', () => {
    const menuCategory = itemJson['minecraft:item'].description?.menu_category;
    assert.ok(menuCategory, 'description.menu_category must be set');
    assert.strictEqual(menuCategory.category, 'equipment', 'menu_category.category must be "equipment"');
    assert.strictEqual(menuCategory.group, 'itemGroup.name.pickaxe', 'menu_category.group must be the pickaxe group');
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

test('Miner\'s Pickaxe recipe', async (t) => {
  await t.test('parses successfully', () => {
    assert.ok(recipeJson, 'recipe JSON should be a valid object');
    assert.ok(recipeJson['minecraft:recipe_shaped'], 'recipe JSON must have minecraft:recipe_shaped root');
  });

  await t.test('is tagged for the crafting table', () => {
    const tags = recipeJson['minecraft:recipe_shaped'].tags ?? [];
    assert.ok(tags.includes('crafting_table'), 'recipe must be tagged "crafting_table"');
  });

  await t.test('matrix matches iron/raw-gold/stick layout exactly', () => {
    const recipe = recipeJson['minecraft:recipe_shaped'];
    assert.deepStrictEqual(recipe.pattern, ['III', 'GSG', ' S '], 'pattern must match the spec 3x3 layout');

    const key = recipe.key;
    assert.strictEqual(key.I?.item, 'minecraft:iron_ingot', 'I must resolve to minecraft:iron_ingot');
    assert.strictEqual(key.G?.item, 'minecraft:raw_gold', 'G must resolve to minecraft:raw_gold');
    assert.strictEqual(key.S?.item, 'minecraft:stick', 'S must resolve to minecraft:stick');
  });

  await t.test('result is exactly one andrew:miners_pickaxe', () => {
    const result = recipeJson['minecraft:recipe_shaped'].result;
    assert.strictEqual(result.item, 'andrew:miners_pickaxe', 'result item must be andrew:miners_pickaxe');
    assert.strictEqual(result.count ?? 1, 1, 'result count must be 1');
  });

  await t.test('does not use experimental/beta formats', () => {
    assert.strictEqual(typeof recipeJson.format_version, 'string', 'format_version must be set');
    const recipeStr = JSON.stringify(recipeJson);
    assert.ok(!recipeStr.includes('experimental'), 'recipe JSON must not have experimental flags');
    assert.ok(!recipeStr.toLowerCase().includes('beta'), 'recipe JSON must not reference beta formats');
  });
});

test('Miner\'s Pickaxe texture', async (t) => {
  await t.test('referenced PNG file exists and is 16x16', () => {
    const textureKey = 'andrew_miners_pickaxe';
    const texturePath = itemTexture.texture_data[textureKey]?.textures;
    assert.ok(texturePath, `texture_data.${textureKey}.textures must be set`);

    const pngPath = join(projectRoot, 'packs', 'resource', `${texturePath}.png`);
    assert.ok(existsSync(pngPath), `referenced PNG must exist at ${pngPath}`);

    const { width, height } = readPngSize(pngPath);
    assert.strictEqual(width, 16, 'PNG width must be 16');
    assert.strictEqual(height, 16, 'PNG height must be 16');
  });
});

// The digger's tag query is what makes the pickaxe dig at diamond speed, and a
// block the query misses is mined at speed 1 — bare hand, not some tier
// default. Measured on BDS 1.26.51.1: the earlier query named 'stone' and the
// '*_pick_diggable' tags, which copper ore (stone_pick_diggable only), ancient
// debris (no *_pick_diggable at all) and plain deepslate do not carry, so they
// took 302 ticks instead of 13. Every pickaxe-mineable vanilla block carries
// minecraft:is_pickaxe_item_destructible, so that one tag is the whole query.
test('digger asks for the tag every pickaxe-mineable block carries, at diamond speed', () => {
  const digger = itemJson['minecraft:item'].components['minecraft:digger'];
  assert.ok(digger, 'minecraft:digger component is missing');
  assert.equal(digger.use_efficiency, true, 'Efficiency must be able to speed the pickaxe up');

  const entries = digger.destroy_speeds;
  assert.ok(Array.isArray(entries) && entries.length > 0, 'destroy_speeds is empty');

  const universal = entries.find((entry) =>
    String(entry?.block?.tags ?? '').includes('minecraft:is_pickaxe_item_destructible')
  );
  assert.ok(
    universal,
    'no destroy_speeds entry matches minecraft:is_pickaxe_item_destructible — ' +
      'blocks outside the query fall back to bare-hand speed'
  );
  // 8 is the vanilla diamond tier; the spec asks for diamond-pickaxe feel.
  assert.equal(universal.speed, 8, 'the pickaxe must dig at diamond speed (8)');
});
