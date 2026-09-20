import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const itemJsonPath = join(projectRoot, 'packs', 'behavior', 'items', 'test_item.json');
const itemTexturePath = join(projectRoot, 'packs', 'resource', 'textures', 'item_texture.json');
const languagesJsonPath = join(projectRoot, 'packs', 'resource', 'texts', 'languages.json');
const enLangPath = join(projectRoot, 'packs', 'resource', 'texts', 'en_US.lang');
const ruLangPath = join(projectRoot, 'packs', 'resource', 'texts', 'ru_RU.lang');

const itemJson = JSON.parse(readFileSync(itemJsonPath, 'utf-8'));
const itemTexture = JSON.parse(readFileSync(itemTexturePath, 'utf-8'));
const languages = JSON.parse(readFileSync(languagesJsonPath, 'utf-8'));
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

test('Item JSON', async (t) => {
  await t.test('parses successfully', () => {
    assert.ok(itemJson, 'item JSON should be a valid object');
    assert.ok(itemJson['minecraft:item'], 'item JSON must have minecraft:item root');
  });

  await t.test('identifier is andrew:test_item', () => {
    const identifier = itemJson['minecraft:item'].description?.identifier;
    assert.strictEqual(identifier, 'andrew:test_item', 'identifier must be andrew:test_item');
  });

  await t.test('menu_category is set (visible in creative inventory)', () => {
    const menuCategory = itemJson['minecraft:item'].description?.menu_category;
    assert.ok(menuCategory, 'description.menu_category must be set');
    assert.ok(menuCategory.category, 'menu_category.category must be set');
  });

  await t.test('max_stack_size is 64', () => {
    const components = itemJson['minecraft:item'].components;
    assert.strictEqual(components?.['minecraft:max_stack_size'], 64, 'max_stack_size must be 64');
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

test('Localization', async (t) => {
  await t.test('languages.json contains both en_US and ru_RU', () => {
    assert.ok(Array.isArray(languages), 'languages.json must be an array');
    assert.ok(languages.includes('en_US'), 'languages.json must include en_US');
    assert.ok(languages.includes('ru_RU'), 'languages.json must include ru_RU');
  });
});

test('Item texture', async (t) => {
  await t.test('item_texture.json has required top-level fields', () => {
    assert.ok(itemTexture.resource_pack_name, 'item_texture.json must have resource_pack_name');
    assert.strictEqual(itemTexture.texture_name, 'atlas.items', 'texture_name must be atlas.items');
  });

  await t.test('referenced PNG file exists and is 16x16', () => {
    const textureKey = 'andrew_test_item';
    const texturePath = itemTexture.texture_data[textureKey]?.textures;
    assert.ok(texturePath, `texture_data.${textureKey}.textures must be set`);

    const pngPath = join(projectRoot, 'packs', 'resource', `${texturePath}.png`);
    assert.ok(existsSync(pngPath), `referenced PNG must exist at ${pngPath}`);

    const { width, height } = readPngSize(pngPath);
    assert.strictEqual(width, 16, 'PNG width must be 16');
    assert.strictEqual(height, 16, 'PNG height must be 16');
  });
});
