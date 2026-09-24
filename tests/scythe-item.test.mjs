import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { build } from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const itemJsonPath = join(projectRoot, 'packs', 'behavior', 'items', 'scythe_of_calamity.json');
const recipeJsonPath = join(projectRoot, 'packs', 'behavior', 'recipes', 'scythe_of_calamity.json');
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

test('Scythe of Calamity item JSON', async (t) => {
  await t.test('parses successfully', () => {
    assert.ok(itemJson, 'item JSON should be a valid object');
    assert.ok(itemJson['minecraft:item'], 'item JSON must have minecraft:item root');
  });

  await t.test('identifier is andrew:scythe_of_calamity', () => {
    const identifier = itemJson['minecraft:item'].description?.identifier;
    assert.strictEqual(identifier, 'andrew:scythe_of_calamity', 'identifier must be andrew:scythe_of_calamity');
  });

  await t.test('max stack size is 1 and hand-equipped', () => {
    const components = itemJson['minecraft:item'].components ?? {};
    assert.strictEqual(components['minecraft:max_stack_size'], 1, 'max_stack_size must be 1');
    assert.strictEqual(components['minecraft:hand_equipped'], true, 'hand_equipped must be true');
  });

  // Netherite Sword parity: 1 above the Web Sword's diamond-sword-matching 7,
  // measured 8 actual damage against a real netherite sword by
  // andrew:scythe_melee_matches_netherite. [src: decision-scythe-melee-damage-8]
  await t.test('damage is 8 (Netherite Sword parity)', () => {
    const damage = itemJson['minecraft:item'].components?.['minecraft:damage'];
    assert.ok(damage, 'minecraft:damage component must be present');
    const value = typeof damage === 'number' ? damage : damage.value;
    assert.strictEqual(value, 8, 'damage must be 8');
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
      'minecraft:cooldown must not be present — the engine would otherwise start it on every use, ' +
        'including a failed one with no target [src: spec §3]'
    );
  });

  // The enchant slot is "sword", not "hoe": combat chants belong to the
  // weapon's role, not its crafting ingredient. [src: decision-scythe-
  // enchantments-slot-sword]
  await t.test('is enchantable via the sword slot', () => {
    const enchantable = itemJson['minecraft:item'].components?.['minecraft:enchantable'];
    assert.ok(enchantable, 'minecraft:enchantable component must be present');
    assert.strictEqual(enchantable.slot, 'sword', 'enchantable slot must be "sword"');
    assert.ok(typeof enchantable.value === 'number' && enchantable.value > 0, 'enchantable value must be a positive number');
  });

  await t.test('has the is_hoe and is_tool tags', () => {
    const tags = itemJson['minecraft:item'].components?.['minecraft:tags']?.tags ?? [];
    assert.ok(tags.includes('minecraft:is_hoe'), 'tags must include minecraft:is_hoe');
    assert.ok(tags.includes('minecraft:is_tool'), 'tags must include minecraft:is_tool');
  });

  await t.test('menu_category is equipment / hoe group', () => {
    const menuCategory = itemJson['minecraft:item'].description?.menu_category;
    assert.ok(menuCategory, 'description.menu_category must be set');
    assert.strictEqual(menuCategory.category, 'equipment', 'menu_category.category must be "equipment"');
    assert.strictEqual(menuCategory.group, 'itemGroup.name.hoe', 'menu_category.group must be the hoe group');
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

// The active ability fills the Miner's Pickaxe/Web Sword shoes here: a legendary
// item with no digger entry for its own base-tool tag would be dug through at
// bare-hand speed. [src: task wording — "важный урок кирки и меча"]
test('digger covers hoe-destructible blocks at diamond-hoe speed', () => {
  const digger = itemJson['minecraft:item'].components['minecraft:digger'];
  assert.ok(digger, 'minecraft:digger component is missing — hoe-destructible blocks would be dug by hand');
  assert.equal(digger.use_efficiency, true, 'Efficiency must be able to speed the scythe up');

  const entries = digger.destroy_speeds;
  assert.ok(Array.isArray(entries) && entries.length > 0, 'destroy_speeds is empty');

  const hoeBlocks = entries.find((entry) =>
    String(entry?.block?.tags ?? '').includes('minecraft:is_hoe_item_destructible')
  );
  assert.ok(
    hoeBlocks,
    'no destroy_speeds entry matches minecraft:is_hoe_item_destructible — ' +
      'the scythe would dig hoe-destructible blocks at bare-hand speed'
  );
  assert.equal(hoeBlocks.speed, 8, 'hoe-destructible speed must match diamond tier (8)');
});

test('Scythe of Calamity recipe', async (t) => {
  await t.test('parses successfully', () => {
    assert.ok(recipeJson, 'recipe JSON should be a valid object');
    assert.ok(recipeJson['minecraft:recipe_shaped'], 'recipe JSON must have minecraft:recipe_shaped root');
  });

  await t.test('is tagged for the crafting table', () => {
    const tags = recipeJson['minecraft:recipe_shaped'].tags ?? [];
    assert.ok(tags.includes('crafting_table'), 'recipe must be tagged "crafting_table"');
  });

  await t.test('matrix is golden apples above/below, obsidian either side of the diamond hoe', () => {
    const recipe = recipeJson['minecraft:recipe_shaped'];
    assert.deepStrictEqual(recipe.pattern, [' G ', 'OHO', ' G '], 'pattern must match the spec 3x3 layout');

    const key = recipe.key;
    assert.strictEqual(key.G?.item, 'minecraft:golden_apple', 'G must resolve to minecraft:golden_apple');
    assert.strictEqual(key.O?.item, 'minecraft:obsidian', 'O must resolve to minecraft:obsidian');
    assert.strictEqual(key.H?.item, 'minecraft:diamond_hoe', 'H must resolve to minecraft:diamond_hoe');

    const flat = recipe.pattern.join('').split('');
    assert.strictEqual(flat.filter((c) => c === 'G').length, 2, 'exactly 2 golden apples are required');
    assert.strictEqual(flat.filter((c) => c === 'O').length, 2, 'exactly 2 obsidian are required');
    assert.strictEqual(flat.filter((c) => c === 'H').length, 1, 'exactly 1 diamond hoe is required');
  });

  await t.test('result is exactly one andrew:scythe_of_calamity', () => {
    const result = recipeJson['minecraft:recipe_shaped'].result;
    assert.strictEqual(result.item, 'andrew:scythe_of_calamity', 'result item must be andrew:scythe_of_calamity');
    assert.strictEqual(result.count ?? 1, 1, 'result count must be 1');
  });

  await t.test('does not use experimental/beta formats', () => {
    assert.strictEqual(typeof recipeJson.format_version, 'string', 'format_version must be set');
    const recipeStr = JSON.stringify(recipeJson);
    assert.ok(!recipeStr.includes('experimental'), 'recipe JSON must not have experimental flags');
    assert.ok(!recipeStr.toLowerCase().includes('beta'), 'recipe JSON must not reference beta formats');
  });
});

test('Scythe of Calamity texture', async (t) => {
  await t.test('referenced PNG file exists and is 16x16', () => {
    const textureKey = 'andrew_scythe_of_calamity';
    const texturePath = itemTexture.texture_data[textureKey]?.textures;
    assert.ok(texturePath, `texture_data.${textureKey}.textures must be set`);

    const pngPath = join(projectRoot, 'packs', 'resource', `${texturePath}.png`);
    assert.ok(existsSync(pngPath), `referenced PNG must exist at ${pngPath}`);

    const { width, height } = readPngSize(pngPath);
    assert.strictEqual(width, 16, 'PNG width must be 16');
    assert.strictEqual(height, 16, 'PNG height must be 16');
  });
});

test('Scythe of Calamity localization catalogue: RU/EN key parity', async (t) => {
  const expectedKeys = [
    'item.andrew:scythe_of_calamity.name',
    'andrew.scythe.no_target',
    'andrew.scythe.first_craft',
    'andrew.scythe.craft_blocked',
    'andrew.scythe.returned',
    'andrew.scythe.admin_given',
    'andrew.scythe.reset',
  ];

  await t.test('every catalogued key is present, non-empty, in both languages', () => {
    for (const key of expectedKeys) {
      assert.ok(enLang.has(key), `en_US.lang is missing "${key}"`);
      assert.ok(ruLang.has(key), `ru_RU.lang is missing "${key}"`);
      assert.ok(enLang.get(key).length > 0, `en_US.lang: "${key}" must not be empty`);
      assert.ok(ruLang.get(key).length > 0, `ru_RU.lang: "${key}" must not be empty`);
    }
  });

  await t.test('the two files define the exact same set of andrew.scythe.* / scythe item keys', () => {
    const scytheKeys = (lang) =>
      [...lang.keys()]
        .filter((k) => k.startsWith('andrew.scythe.') || k === 'item.andrew:scythe_of_calamity.name')
        .sort();
    assert.deepStrictEqual(
      scytheKeys(enLang),
      scytheKeys(ruLang),
      'en_US.lang and ru_RU.lang must define the exact same Scythe of Calamity key set'
    );
  });
});

// registry.ts imports ItemStack from @minecraft/server as a type only, so it
// bundles cleanly with no engine stub — the import is erased at compile time.
const bundle = await build({
  stdin: {
    contents: "export * from './src/legendary/registry.ts';",
    resolveDir: projectRoot,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
});

const { LEGENDARIES, SCYTHE_OF_CALAMITY } = await import(
  'data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64')
);

test('Scythe of Calamity registration in LEGENDARIES', async (t) => {
  await t.test('is registered', () => {
    assert.ok(LEGENDARIES.includes(SCYTHE_OF_CALAMITY), 'SCYTHE_OF_CALAMITY must be in LEGENDARIES');
  });

  await t.test('matches the spec: keyPrefix, abilityKey, cooldown, craft gate, refund', () => {
    assert.strictEqual(SCYTHE_OF_CALAMITY.itemId, 'andrew:scythe_of_calamity');
    assert.strictEqual(SCYTHE_OF_CALAMITY.keyPrefix, 'sc');
    assert.strictEqual(SCYTHE_OF_CALAMITY.abilityKey, 'scythe_of_calamity');
    assert.strictEqual(SCYTHE_OF_CALAMITY.cooldownTicks, 600, '600 ticks = 30s at 20 ticks/s');
    assert.strictEqual(SCYTHE_OF_CALAMITY.craftGate, true);
    assert.deepStrictEqual(SCYTHE_OF_CALAMITY.refund, [
      ['minecraft:golden_apple', 2],
      ['minecraft:obsidian', 2],
      ['minecraft:diamond_hoe', 1],
    ]);
  });
});
